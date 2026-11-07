# AION SENTINEL

**Identity · Trust · Observability** — headless security integration
foundation for AION humans, services and autonomous agents.

> **Status: FOUNDATION / NOT PRODUCTION READY.** This is not an Okta
> replacement or a deployed identity provider. It does not issue JWTs,
> handle passwords, authenticate users, authorize Runtime commands or persist
> compliance-grade audit logs.

## Why this exists

Sentinel is the future identity, trust and observability integration surface.
AION Runtime already owns the execution authentication boundary; Core/Data
own policy and durable grants. This repository provides a reusable, fail-closed
contract without creating a competing control plane.

Ownership is proposed in [ADR-001](docs/ADR-001-sentinel-foundation.md);
existing [aion-docs ADR-005](https://github.com/Ceoloo/aion-docs/blob/main/adr/ADR-005-runtime-identity-plane.md)
and [ADR-020](https://github.com/Ceoloo/aion-docs/blob/main/adr/ADR-020-aion-security-repo-ownership.md)
remain authoritative until a new decision is accepted.

## Foundation included

- Health-only Node 22 server (no business or identity endpoints).
- Pure integration seam: identity verification -> Runtime policy decision ->
  acknowledged audit event (all must be injected).
- Strict tenant constraint, default-deny and fail-closed behavior.
- Minimal allowlisted, versioned audit metadata contract.
- Security tests and GitHub Actions CI.
- [Architecture](docs/architecture.md), [roadmap](docs/roadmap.md),
  [security policy](SECURITY.md).

## Security audit methodology

Security reviews use the [AION Sentinel audit baseline](docs/security-audit/BASELINE.md),
adapted from Cloudflare's open-source security-audit skill at a pinned
revision. The [coverage map](docs/security-audit/COVERAGE-MAP.md) tracks
initial attack surfaces and explicit gaps; the
[run template](docs/security-audit/RUN-TEMPLATE.md) describes the evidence
handoff. This is guidance and planning, **not** an audit-complete claim.
Full audits require explicit scope, independent validation and isolated
offline execution. Do not store sensitive audit results in this public repo.

## Identity v0.2 — Keycloak (draft)

The [Keycloak integration guide](docs/keycloak-v02.md) documents verified
RS256 access-token validation, pinned realm issuer and audience, explicit
client allowlist, and **live durable Principal/Actor mapping** through
`createRuntimePrincipalLookup()`. Authorization/tenant roles are never
trusted from JWT claims. No Keycloak instance, mapping table, or Runtime
gateway cutover is deployed; production remains disabled pending
staging integration and security review.

Dependencies are locked; run `npm ci --ignore-scripts` before testing.

## Run locally

Requires Node.js 22+. No external packages, keys or accounts are necessary.

~~~bash
npm ci --ignore-scripts
npm run check
npm start
curl -i http://127.0.0.1:8085/health/live
curl -i http://127.0.0.1:8085/health/ready
~~~

Liveness returns 200; readiness intentionally returns **503** because no IdP,
policy or durable audit integrations exist. Other routes return 404.

### Library use (contracts only)

~~~js
import { createTrustBoundary } from './src/index.mjs';

const boundary = createTrustBoundary({
  verifyIdentity: async ({ credential }) => {
    // REQUIRED: vetted OIDC verifier adapter; do NOT trust caller claims.
    throw new Error('not implemented');
  },
  decidePermission: async (request) => {
    // REQUIRED: authoritative AION Runtime/Core decision, not local grants.
    throw new Error('not implemented');
  },
  recordAudit: async (event) => {
    // REQUIRED: durable acknowledged security evidence store.
    throw new Error('not implemented');
  },
});

// This denies until every real integration exists.
const result = await boundary.authorize({
  credential: 'external-bearer-token',
  tenantId: 'tenant-a',
  action: 'invoke',
  resource: 'service:review',
});
~~~

**Security boundary:** Nothing returned by Sentinel overrides Runtime's own
authorization or human approval requirements.

## Future modules (not built)

Sentinel Identity (Keycloak token verifier and Runtime mapping seam now drafted); Sentinel Access (Runtime policy seam);
Sentinel Agent Trust (workload identity); Sentinel Observe (OpenTelemetry);
Sentinel Audit (durable evidence). Keep commercial product packaging separate
from the canonical AION six-repo architecture.
