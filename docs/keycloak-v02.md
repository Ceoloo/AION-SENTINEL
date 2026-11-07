# Sentinel Identity v0.2 — Keycloak access-token verification

**Status: REVIEW / NOT DEPLOYED.** This PR implements a Keycloak JWT verifier
and a source-level mapping adapter targeting AION Runtime's existing
`Principal` and Data's durable `Actor` models. It does **not** create a
Keycloak deployment, wire the active Runtime HTTP gateway, create a durable
principal-binding table, implement login or issue tokens. Runtime remains
on its current independent authentication path until an approved integration
PR and staging proofs are complete.

## Verify the access token, then resolve local authority

```text
Keycloak (OIDC realm, signing keys, short-lived access token)
  -> Sentinel verifier: RS256 signature + trusted JWKS, exact issuer,
     audience, azp allowlist, Bearer token type, sub, exp, iat and age
  -> getBinding(issuer, subject, clientId) from AION-owned durable binding store
  -> getActor(actorId) from AION Data Actor registry (same live authority as Runtime)
  -> Runtime Principal {principalId, actorId, kind, tenantIds, roles}
  -> Runtime rechecks Actor, capability, tenant and human-approval gates at execute
```

**Never** derive Runtime grants, tenant membership, durable Actor ID, or
principal roles from Keycloak `realm_access`, `resource_access`, groups,
scope, email, body attributes, or a caller-supplied principal header.
Unknown, disabled, mismatched, revoked or unregistered bindings fail closed.

## Keycloak configuration checklist (design; no live credentials)

1. Provision a dedicated AION realm (example issuer:
   `https://auth.example.com/realms/aion`) behind trusted TLS.
2. Create an OIDC resource-server audience `aion-runtime`. On the invoking
   clients, configure a **Keycloak Audience mapper** to add that audience to
   **access** tokens (not to ID tokens). A token for `account` alone is rejected.
3. Explicitly list allowed invoking client IDs (example `aion-console`
   and `aion-software-factory`) in Sentinel configuration. Reject unrelated
   `azp` values even if the token has a valid signature.
4. Use Keycloak's signing algorithm RS256 (restricted here). Keep signing
   private keys in the IdP, never in Sentinel/Runtime. Sentinel fetches the
   realm's `/protocol/openid-connect/certs` public JWKS over HTTPS.
5. Set short-lived access tokens (no more than five minutes for this
   verifier), require phishing-resistant MFA for privileged humans, and use
   authorization-code + PKCE for browsers. Do not enable password/direct-grant
   shortcuts for web clients or make service account secrets public.
6. Define lifecycle: operator approval for provisioning external-subject
   bindings, immediate durable binding disable for offboarding, durable
   Actor revocation, verified tenant scope, signing key rotation and a
   controlled emergency-logout procedure. A locally verified JWT remains
   valid until expiration unless the binding/Actor is disabled, so
   disabling only a Keycloak session is **not sufficient** for instant
   revocation. Evaluate server-side introspection where policy requires it.
7. Use distinct realms/issuers for environments; never use test keys,
   relaxed HTTPS, or local mocks as a production trust root.

The docs use placeholder domains and names, not an actual active realm.
Source: [Keycloak OIDC endpoints](https://www.keycloak.org/securing-apps/oidc-layers),
[Keycloak Audience mapper](https://www.keycloak.org/admin-api/protocol-mappers).

## Usage — library integration, not an HTTP login endpoint

```js
import { createKeycloakVerifier, createRuntimePrincipalLookup,
  createTrustBoundary } from './src/index.mjs';

// The following callbacks MUST use approved AION durable storage.
// There is deliberately no permissive default or static mapping.
const lookupPrincipal = createRuntimePrincipalLookup({
  getBinding: async ({ issuer, subject, clientId }) => {
    // Query an approved, uniquely indexed issuer/sub/client binding.
    throw new Error('AION binding registry integration not yet implemented');
  },
  getActor: async (actorId) => {
    // Read AION Data's durable Actor, not a token-supplied Actor object.
    throw new Error('Runtime Data integration not yet implemented');
  },
});
const verifyIdentity = createKeycloakVerifier({
  issuer: 'https://auth.example.com/realms/aion',
  audience: 'aion-runtime',
  allowedClients: ['aion-console'],
  lookupPrincipal,
});
const boundary = createTrustBoundary({
  verifyIdentity,
  decidePermission: async () => {
    // Authoritative AION Runtime/Core decision is required.
    throw new Error('Runtime adapter not yet implemented');
  },
  recordAudit: async () => {
    // Durable, acknowledged audit sink is required before allowing actions.
    throw new Error('Audit adapter not yet implemented');
  },
});
```

**No production allowance** results from this example.

## Runtime integration requirements (separate PR)

- Define a migration/registry for immutable IdP tuple
  `(issuer, subject, clientId)` to `principalId, actorId, kind, tenantIds, roles`.
  Unique constraints, least-privileged write paths and offboarding are required.
  Consider Data schema + Runtime admin control rather than Sentinel owning an
  independent authoritative user table.
- Add an **opt-in** Keycloak credential verifier to Runtime's actual gateway
  authentication boundary, never a new bypass endpoint or trusted header.
  Preserve API-key compatibility until approved cutover.
- Ensure HTTP and service clients cannot self-provision Actors, inherit
  `register`, or impersonate another tenant by changing headers.
- Read the Actor and binding at request time. The existing Runtime
  `resolveDurableActor`, `resolveDecisionIdentity` and tenant checks
  must still run on command and approval routes.
- Add staging integration proofs with an ephemeral Keycloak realm, test
  token issuance and JWKS rotation, failure modes and revocation, and
  production recoverability before Runtime's auth mode changes.
- Owner-approved deployment, migration and rollbacks are mandatory.
  Do not enable real login or production access from this PR.

## Test contract

`node --test test/keycloak.test.mjs` uses offline dummy RS256 keys and jose's
local JWKS resolver. It checks the signature, audience, issuer, allowed client,
access-token type, short expiry, negative tenant behavior, role spoofing and
durable binding disable. It is *not* a live Keycloak interoperability test,
penetration test, or audit completion proof.
