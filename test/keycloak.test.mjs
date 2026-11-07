import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import {
  createKeycloakVerifier, createRuntimePrincipalLookup,
  validateKeycloakConfig, validRuntimePrincipal,
} from '../src/keycloak.mjs';
import { createTrustBoundary } from '../src/identity.mjs';

const issuer = 'https://auth.example.test/realms/aion';
const audience = 'aion-runtime';
const clientId = 'aion-console';
const subject = 'keycloak-subject-1';

const baseBinding = () => ({
  issuer, subject, clientId,
  principalId: 'principal-ops-1',
  actorId: 'actor-ops-1',
  kind: 'operator',
  tenantIds: ['tenant-a'],
  roles: ['invoke', 'approve'],
  status: 'active',
});
const baseActor = () => ({ actorId: 'actor-ops-1', actorType: 'human' });

async function fixture() {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  jwk.kid = 'test-key-1';
  jwk.alg = 'RS256';
  jwk.use = 'sig';
  const jwks = createLocalJWKSet({ keys: [jwk] });
  let binding = baseBinding();
  let actor = baseActor();
  let bindingCalls = 0;
  let actorCalls = 0;
  const lookupPrincipal = createRuntimePrincipalLookup({
    getBinding: async (identity) => {
      bindingCalls++;
      if (identity.issuer !== issuer || identity.subject !== subject || identity.clientId !== clientId) {
        return null;
      }
      return binding;
    },
    getActor: async (id) => {
      actorCalls++;
      assert.equal(id, 'actor-ops-1');
      return actor;
    },
  });
  const verifyIdentity = createKeycloakVerifier({
    issuer, audience, allowedClients: [clientId], lookupPrincipal, jwks,
  });
  async function sign(overrides = {}) {
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      sub: subject, iss: issuer, aud: audience, azp: clientId,
      typ: 'Bearer', iat: now, exp: now + 180,
      ...overrides,
    };
    return new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid: 'test-key-1', typ: 'JWT' }).sign(privateKey);
  }
  return {
    sign, verifyIdentity,
    setBinding: (next) => { binding = next; },
    setActor: (next) => { actor = next; },
    calls: () => ({ bindingCalls, actorCalls }),
  };
}

test('requires HTTPS realm issuer and explicit audience/client allowlist', () => {
  assert.throws(() => validateKeycloakConfig({
    issuer: 'http://localhost:8080/realms/aion', audience, allowedClients: [clientId],
  }));
  assert.throws(() => validateKeycloakConfig({
    issuer: 'https://auth.example.test/realms/aion?other=1', audience, allowedClients: [clientId],
  }));
  assert.throws(() => validateKeycloakConfig({ issuer, audience, allowedClients: [] }));
  const config = validateKeycloakConfig({ issuer, audience, allowedClients: [clientId] });
  assert.equal(config.jwksUrl, issuer + '/protocol/openid-connect/certs');
});

test('cryptographically verified access token resolves exact AION Runtime Principal', async () => {
  const f = await fixture();
  const token = await f.sign();
  const response = await f.verifyIdentity({ credential: token });
  assert.equal(response.verified, true);
  assert.deepEqual(response.principal, {
    principalId: 'principal-ops-1',
    actorId: 'actor-ops-1',
    kind: 'operator',
    tenantIds: ['tenant-a'],
    roles: ['invoke', 'approve'],
  });
  assert.deepEqual(f.calls(), { bindingCalls: 1, actorCalls: 1 });
});

test('rejects wrong issuer, audience, client, expired token, ID token, forged sub', async () => {
  const f = await fixture();
  const changes = [
    { iss: 'https://other.example.test/realms/aion' },
    { aud: 'another-api' },
    { azp: 'unapproved-client' },
    { exp: Math.floor(Date.now() / 1000) - 100 },
    { typ: 'ID' },
    { sub: 'other-subject' },
  ];
  for (const changed of changes) {
    const token = await f.sign(changed);
    const response = await f.verifyIdentity({ credential: token });
    assert.equal(response.verified, false, JSON.stringify(changed));
  }
});

test('rejects unsigned, malformed and invalid-signature tokens', async () => {
  const f = await fixture();
  for (const token of [null, '', 'abc.def.xyz', 'aaa.bbb.ccc']) {
    assert.equal((await f.verifyIdentity({ credential: token })).verified, false);
  }
  const token = await f.sign();
  const modified = token.split('.');
  modified[2] = modified[2].slice(0, -2) + 'aa';
  assert.equal((await f.verifyIdentity({ credential: modified.join('.') })).verified, false);
});

test('tenant, role and actor grants are never taken from JWT claims', async () => {
  const f = await fixture();
  const token = await f.sign({
    tenantIds: ['tenant-evil'], roles: ['register'], realm_access: { roles: ['admin'] },
  });
  const result = await f.verifyIdentity({ credential: token });
  assert.equal(result.verified, true);
  assert.deepEqual(result.principal.tenantIds, ['tenant-a']);
  assert.deepEqual(result.principal.roles, ['invoke', 'approve']);
  const protectedBoundary = createTrustBoundary({
    verifyIdentity: f.verifyIdentity,
    decidePermission: async () => ({ allow: true }),
    recordAudit: async () => {},
  });
  const decision = await protectedBoundary.authorize({
    credential: token, tenantId: 'tenant-evil', action: 'invoke', resource: 'service:deploy',
  });
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, 'tenant_forbidden');
});

test('missing, disabled, mismatched or revoked durable binding denies', async () => {
  const f = await fixture();
  const token = await f.sign();
  for (const value of [
    null,
    { ...baseBinding(), status: 'disabled' },
    { ...baseBinding(), subject: 'different-sub' },
    { ...baseBinding(), roles: ['register'] },
    { ...baseBinding(), kind: 'agent-worker' },
    { ...baseBinding(), tenantIds: ['tenant-a', 'tenant-a'] },
  ]) {
    f.setBinding(value);
    assert.equal((await f.verifyIdentity({ credential: token })).verified, false);
  }
  f.setBinding(baseBinding());
  f.setActor({ actorId: 'actor-ops-1', actorType: 'agent' });
  assert.equal((await f.verifyIdentity({ credential: token })).verified, false);
});

test('agent identity is single-tenant and revocation-state protected', async () => {
  const lookup = createRuntimePrincipalLookup({
    getBinding: async () => ({
      issuer, subject, clientId, principalId: 'principal-agent-1',
      actorId: 'actor-agent-1', kind: 'agent-worker',
      tenantIds: ['tenant-a'], roles: ['invoke'], status: 'active',
    }),
    getActor: async () => ({
      actorId: 'actor-agent-1', actorType: 'agent',
      tenantId: 'tenant-a', revocationState: 'revoked',
    }),
  });
  assert.equal(await lookup({ issuer, subject, clientId }), null);
});

test('every token verification rechecks live durable binding and Actor', async () => {
  const f = await fixture();
  const token = await f.sign();
  assert.equal((await f.verifyIdentity({ credential: token })).verified, true);
  f.setBinding({ ...baseBinding(), status: 'disabled' });
  assert.equal((await f.verifyIdentity({ credential: token })).verified, false);
  assert.equal(f.calls().bindingCalls, 2);
});

test('missing durable lookup and invalid Runtime Principal fail at startup/deny', async () => {
  assert.throws(() => createRuntimePrincipalLookup({}));
  assert.throws(() => createKeycloakVerifier({ issuer, audience, allowedClients: [clientId] }));
  assert.equal(validRuntimePrincipal({ ...baseBinding(), roles: ['register'] }), false);
});
