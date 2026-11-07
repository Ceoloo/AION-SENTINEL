# Foundation delivery gates

## Phase 0 — repo foundation (this PR)

- [x] Separate module with no login, command or token-issuer API.
- [x] Health-only local process; readiness is explicitly **503**.
- [x] Trusted identity/authorization/audit adapter seams.
- [x] Default-deny, tenant-isolation, policy-unavailable and audit-outage tests.
- [x] Versioned allowlisted authorization event schema.
- [x] Proposed ownership ADR and threat inventory.
- [ ] Human review of proposed ADR and Runtime contract.
- [ ] CI result confirmed on GitHub.

## Phase 1 — provider decision and identity integration

- [ ] Evaluate Keycloak vs ZITADEL for sovereign deployment.
- [ ] Add external OIDC discovery/JWKS verifier; pin issuer, audience,
      allowed algorithms, token type and key rotation/revocation behavior.
- [ ] Map verified subject to Runtime Principal and durable Actor.
- [ ] Negative tests for forged, expired, wrong-audience, replayed and
      revoked identities, plus MFA/privileged human access.
- [ ] Tenant and agent identity lifecycle / offboarding / break-glass runbook.

## Phase 2 — Runtime adapter and durable audit

- [ ] Implement authenticated, least-privilege Runtime authorization adapter.
- [ ] Reconfirm enforcement at command execution; no split-brain policy.
- [ ] Add durable audit event sink, resilience, retention and recovery tests.
- [ ] Design event correlation and OpenTelemetry instrumentation.
- [ ] Readiness depends on actual live dependencies and recovery evidence.

## Phase 3 — observability + security product

- [ ] Add OTel collector/exporters with sensitive-field suppression.
- [ ] Record traces, error budgets, latency, denied calls and per-agent cost.
- [ ] Build read-only Command Center security view and incident response.
- [ ] Tenant-isolation penetration tests, recovery drill and production gate.
- [ ] Integrate aion-security assurance evidence without duplicating it.

No production enablement, IdP choice, real authentication, token issuance,
telemetry store or authorization endpoint is claimed by Phase 0.
