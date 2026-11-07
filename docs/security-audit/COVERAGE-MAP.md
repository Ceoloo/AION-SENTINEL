# Sentinel source-first security coverage map

**Status:** Audit *planning* inventory as of foundation branch. Every row
needs an actual scoped review and evidence before it may be reported covered.
These are starting units, not vulnerabilities or security certifications.

Cloudflare [attack classes](https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/skills/security-audit/ATTACK-CLASSES.md)
plus domain companions determine the test taxonomy. A completed full audit
must create the upstream-schema `coverage-ledger.json`; this map does
**not** replace that ledger.

| Unit | Current Sentinel entrypoint or future surface | Primary trust boundary | Attack classes / source companion | Current state |
| --- | --- | --- | --- | --- |
| SA-01 | `src/identity.mjs` verified identity adapter | Untrusted credential -> verified principal | Auth protocol, forged identity, verifier outage; WEB-PROTOCOL-AND-AUTH | Adapter seam only; upstream IdP absent |
| SA-02 | `src/identity.mjs` tenant selector | Principal's durable tenant grants -> resource scope | Cross-tenant query, actor confusion; DATA-ISOLATION-AND-LIFECYCLE | Local negative tests exist; no full audit |
| SA-03 | `src/identity.mjs` permission decision | Verified actor -> Runtime/Core policy -> side effect | Confused deputy, TOCTOU, approval/action binding; AI-AND-LLM | Runtime adapter not implemented |
| SA-04 | `src/audit.mjs` / schema | Sensitive request -> allowlisted audit metadata -> durable evidence | Secret leakage, missing/forged event, audit outage | Schema + local mock only; durable store absent |
| SA-05 | `src/server.mjs` | Untrusted HTTP -> process routing | Header/request framing, method/path confusion, availability; WEB-PROTOCOL-AND-AUTH | Health-only service; no auth API |
| SA-06 | Future OIDC login and session lifecycle | IdP assertions -> mapped Runtime identity | Issuer/audience, algorithm, nonce, PKCE, JWKS rotation, session revocation, MFA | Not implemented; mandatory before launch |
| SA-07 | Future agent/workload identity & MCP | Delegated tool input -> executable capability | Prompt injection to sinks, model output, MCP namespace, tool schema, budget, retries; AI-AND-LLM | Not implemented; mandatory before agent use |
| SA-08 | Future tenant data/backup/export | Tenant-restricted state -> database/cache/export | RLS, cache/query scope, backup restore, deletion/revocation; DATA-ISOLATION-AND-LIFECYCLE | No Sentinel DB; AION Data ownership remains |
| SA-09 | GitHub workflow and dependency lifecycle | Repository/PR input -> trusted build/release | Untrusted CI permissions, artifact poisoning, action/dependency provenance; SUPPLY-CHAIN-AND-RELEASE | CI syntax/tests exist; no release audit |
| SA-10 | Future deployment/IaC/ingress | Configured host/cloud identity -> reachable service | IAM, network, secrets, exposed management endpoint; CLOUD-AND-DEPLOYMENT | No Sentinel deployment; Infra owns implementation |
| SA-11 | Future OpenTelemetry collectors and logs | Sensitive event -> telemetry exporter/backend | Redaction, cross-tenant read, misleading correlation, missing audit evidence | Not implemented; non-authoritative traces |
| SA-12 | Future services, agents and queues | Request -> CPU/memory/concurrency/spend | Resource exhaustion, queue starvation, recursive agent spend; RESOURCE-EXHAUSTION-AND-AVAILABILITY | No agent or queue implementation |
| SA-13 | Future CLI/operator desktop integrations | Desktop process/IPC -> privileged local action | Shell/IPC and local helper permissions; DESKTOP-MOBILE-AND-LOCAL-IPC | Out of current source scope |
| SA-14 | Future schema/parser/transport integrations | External payload -> parser/state/message broker | Injection, ambiguity, replay, queue/RPC sender identity; PROTOCOLS-RPC-AND-MESSAGING | Not implemented |

## Evidence and negative-test minimums

- **Identity:** wrong issuer, audience, algorithm or expired token denied;
  revoked identities blocked; no fallback to a raw or body-supplied actor.
- **Tenant:** principal for tenant A cannot access B through direct, queued,
  resumed, batched or delegated paths; tenant header never expands grants.
- **Authorization:** every side effect re-checks Runtime policy; approval
  binds action, arguments, requester and resource; no auto-self-approval.
- **Audit:** missing sink or failed write blocks allow; events redact tokens,
  prompts and customer data, with durable retention/restore verification.
- **Agent/MCP:** tools and outputs do not confer privilege; capability scope
  is enforced in code; loop spend/cancellation/idempotency tested.
- **Observability:** diagnostic traces are not treated as authoritative
  audit evidence and must honor tenant/data-access boundaries.
- **Build/release:** pinned dependencies, constrained CI permissions, clean
  release provenance, rollback and independent change approval.
- **Availability:** bounded request work, backpressure, timeouts and verified
  graceful failure before opening external endpoints.

## Initial AION source boundaries

A target run may cover just `Ceoloo/AION-SENTINEL`, but must declare Runtime,
Core, Data, Infra and aion-security interfaces **out of source scope** until
they are separately inspected at pinned SHAs. A Sentinel-only clean result
cannot certify AION end-to-end.

Relevant normative documents:
- [Security Infrastructure Standard v1.1](https://github.com/Ceoloo/aion-docs/blob/main/architecture/security-infrastructure-standard-v1.md)
- [Runtime Identity Plane ADR-005](https://github.com/Ceoloo/aion-docs/blob/main/adr/ADR-005-runtime-identity-plane.md)
- [aion-security ownership ADR-020](https://github.com/Ceoloo/aion-docs/blob/main/adr/ADR-020-aion-security-repo-ownership.md)
- [Continuous Assurance v1](https://github.com/Ceoloo/aion-docs/blob/main/architecture/continuous-assurance-v1.md)

**Next action:** run a specifically authorized `quick` source audit against
a fixed Sentinel commit, then widen to `standard` cross-repository runs
once the Runtime adapter and IdP exist. Nothing in this map asserts completion.
