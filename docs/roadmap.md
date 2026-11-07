# Foundation delivery gates

## Phase 0 — repo foundation (this PR)

- [x] Separate module with no login, command or token-issuer API.
- [x] Health-only local process; readiness is explicitly **503**.
- [x] Trusted identity/authorization/audit adapter seams.
- [x] Default-deny, tenant-isolation, policy-unavailable and audit-outage tests.
- [x] Versioned allowlisted authorization event schema.
- [x] Proposed ownership ADR and threat inventory.
- [ ] Human review of proposed ADR and Runtime contract.
- [x] CI result confirmed on GitHub for initial foundation commit.
- [x] Documented Cloudflare-derived baseline audit method and initial
      security coverage map (methodology only; no full audit performed).
- [ ] Run an independently validated, specifically authorized quick audit
      against a pinned Sentinel SHA and track unverified boundaries.

## Audit methodology gates (cross-cutting)

- [ ] Review and accept the proposed adoption of the baseline in AION's
      canonical security docs before declaring it mandatory holding-wide.
- [ ] Review each new trust boundary using the source-first
      [audit baseline](security-audit/BASELINE.md) and
      [coverage map](security-audit/COVERAGE-MAP.md).
- [ ] Independently validate candidate findings; keep release blocked for
      confirmed critical/high issues until remediation is verified.
- [ ] Document scope, source SHA, out-of-scope systems and unresolved
      validation gaps in a private audit run before production approval.

## Phase 1 — provider decision and identity integration

- [x] Select Keycloak as the upstream OIDC identity provider (user decision).
- [x] Implement strict RS256 signed access-token verification with an offline JWKS test suite.
- [x] Implement durable Runtime Principal/Actor mapping adapter contract (no live DB integration).
- [x] Pin issuer, audience, algorithm, access-token type and intended client;
      derive HTTPS JWKS endpoint from configured Keycloak realm.
- [ ] Prove JWKS key rotation and live Keycloak interoperability in staging.
- [x] Add exact verified issuer/sub/client to Runtime Principal/Actor lookup contract.
- [ ] Implement AION Data-backed binding registry and opt-in Runtime gateway integration.
- [x] Offline negative tests for signature, wrong issuer/audience/client,
      expiry, token type, tenant spoof and durable binding disable.
- [ ] Validate replay/session revocation strategy and MFA/privileged human access in staging.
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
