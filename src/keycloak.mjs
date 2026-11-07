import { createRemoteJWKSet, jwtVerify } from 'jose';

const safeId = (value) =>
  typeof value === 'string' && /^[A-Za-z0-9._:/-]{1,128}$/.test(value);

const deny = () => Object.freeze({ verified: false });

/**
 * Keycloak issuer must be statically configured and pinned to a realm.
 * Never derive this URL from request-supplied host, token headers or claims.
 */
export function validateKeycloakConfig({ issuer, audience, allowedClients }) {
  if (typeof issuer !== 'string' || issuer.endsWith('/')) {
    throw new TypeError('issuer must be an exact HTTPS Keycloak realm URL without trailing slash');
  }
  let url;
  try {
    url = new URL(issuer);
  } catch {
    throw new TypeError('invalid Keycloak issuer URL');
  }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
      url.search || url.hash || url.href !== issuer ||
      !/\/realms\/[A-Za-z0-9_-]+$/.test(url.pathname)) {
    throw new TypeError('issuer must be the HTTPS URL of a fixed Keycloak realm');
  }
  if (!safeId(audience) || !Array.isArray(allowedClients) ||
      allowedClients.length === 0 || !allowedClients.every(safeId)) {
    throw new TypeError('audience and non-empty allowedClients must be configured');
  }
  return Object.freeze({
    issuer,
    audience,
    allowedClients: Object.freeze([...new Set(allowedClients)]),
    jwksUrl: issuer + '/protocol/openid-connect/certs',
  });
}

/**
 * Verify an ACCESS token, never an ID token. All privileges come from the
 * trusted AION durable binding lookup, not from Keycloak realm_access,
 * groups, resource_access, or user-controlled claims.
 *
 * lookupPrincipal({issuer,subject,clientId}) must perform a live durable
 * mapping + Actor lookup; see createRuntimePrincipalLookup().
 * jwks is injectable solely for offline tests. Production uses the fixed
 * same-realm JWKS endpoint and jose's bounded remote keyset.
 */
export function createKeycloakVerifier({
  issuer, audience, allowedClients, lookupPrincipal, jwks,
} = {}) {
  const config = validateKeycloakConfig({ issuer, audience, allowedClients });
  if (typeof lookupPrincipal !== 'function') {
    throw new TypeError('durable Runtime principal lookup is required');
  }
  const keys = jwks ?? createRemoteJWKSet(new URL(config.jwksUrl), {
    timeoutDuration: 3000,
    cooldownDuration: 30000,
    cacheMaxAge: 300000,
  });
  if (typeof keys !== 'function') {
    throw new TypeError('JWKS resolver must be callable');
  }

  return async function verifyIdentity({ credential } = {}) {
    if (typeof credential !== 'string' || credential.length < 30 ||
        credential.length > 16384 || credential.split('.').length !== 3) {
      return deny();
    }
    let payload;
    try {
      ({ payload } = await jwtVerify(credential, keys, {
        issuer: config.issuer,
        audience: config.audience,
        algorithms: ['RS256'],
        requiredClaims: ['sub', 'iss', 'aud', 'iat', 'exp'],
        maxTokenAge: '5m',
        clockTolerance: '5s',
      }));
    } catch {
      // Bad signature, missing kid, unavailable JWKS, expired token,
      // unsupported alg, invalid issuer/audience, etc. are all denied.
      return deny();
    }
    if (payload.typ !== 'Bearer' || !safeId(payload.sub) ||
        !safeId(payload.azp) || !config.allowedClients.includes(payload.azp)) {
      return deny();
    }
    // The only identity attributes propagated are verified iss/sub/azp.
    // Do not use token roles, tenants, email, display name, or scope as grants.
    const principal = await lookupPrincipal({
      issuer: config.issuer,
      subject: payload.sub,
      clientId: payload.azp,
    });
    if (principal === null) return deny();
    if (!validRuntimePrincipal(principal)) return deny();
    return Object.freeze({ verified: true, principal: Object.freeze({
      principalId: principal.principalId,
      kind: principal.kind,
      actorId: principal.actorId,
      tenantIds: Object.freeze([...principal.tenantIds]),
      roles: Object.freeze([...principal.roles]),
    }) });
  };
}

/** Exact AION Runtime Principal contract. Never infer these from JWT claims. */
export function validRuntimePrincipal(value) {
  return value !== null && typeof value === 'object' &&
    safeId(value.principalId) && safeId(value.actorId) &&
    ['operator', 'service', 'agent-worker'].includes(value.kind) &&
    Array.isArray(value.tenantIds) && value.tenantIds.length > 0 &&
    value.tenantIds.every(safeId) &&
    new Set(value.tenantIds).size === value.tenantIds.length &&
    Array.isArray(value.roles) && value.roles.length > 0 &&
    value.roles.every((role) => ['invoke', 'approve'].includes(role)) &&
    new Set(value.roles).size === value.roles.length &&
    (value.kind === 'operator' || !value.roles.includes('approve'));
}

/**
 * Adapter for AION Runtime's Principal/Actor model.
 * getBinding must query a SECURITY-OWNED DURABLE mapping by the exact
 * issuer+subject+clientId tuple on each verification; no body/JWT grants.
 * getActor must query Data's durable Actor registry on each verification.
 *
 * The lookup has no fake/in-memory/default mapping and does no registration.
 * Missing, disabled, mismatched or revoked records cannot authenticate.
 */
export function createRuntimePrincipalLookup({ getBinding, getActor } = {}) {
  if (typeof getBinding !== 'function' || typeof getActor !== 'function') {
    throw new TypeError('durable binding and Actor lookups are required');
  }
  return async ({ issuer, subject, clientId } = {}) => {
    if (typeof issuer !== 'string' || !safeId(subject) || !safeId(clientId)) {
      return null;
    }
    const binding = await getBinding({ issuer, subject, clientId });
    if (!binding || binding.status !== 'active' ||
        binding.issuer !== issuer || binding.subject !== subject ||
        binding.clientId !== clientId || !validRuntimePrincipal(binding)) {
      return null;
    }

    const actor = await getActor(binding.actorId);
    if (!actor || actor.actorId !== binding.actorId) return null;
    const kindToActor = {
      operator: 'human',
      service: 'service',
      'agent-worker': 'agent',
    };
    if (actor.actorType !== kindToActor[binding.kind]) return null;

    // Agent revocation is authoritative in AION's durable Actor registry.
    // Agent-scoped credentials cannot expand past the Actor's own tenant.
    if (binding.kind === 'agent-worker' &&
        (actor.revocationState !== 'active' || !safeId(actor.tenantId) ||
         binding.tenantIds.length !== 1 ||
         binding.tenantIds[0] !== actor.tenantId)) {
      return null;
    }
    return {
      principalId: binding.principalId,
      kind: binding.kind,
      actorId: binding.actorId,
      tenantIds: [...binding.tenantIds],
      roles: [...binding.roles],
    };
  };
}
