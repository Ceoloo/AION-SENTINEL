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

## Run locally

Requires Node.js 22+. No external packages, keys or accounts are necessary.

~~~bash
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

Sentinel Identity (upstream OIDC); Sentinel Access (Runtime policy seam);
Sentinel Agent Trust (workload identity); Sentinel Observe (OpenTelemetry);
Sentinel Audit (durable evidence). Keep commercial product packaging separate
from the canonical AION six-repo architecture.
