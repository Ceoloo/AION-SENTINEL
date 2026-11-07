# Sentinel integration architecture (design target, not deployed)

AION Workspace / human / agent / service
    -> external managed or self-hosted IdP (OIDC, MFA, passkeys)
    -> verified Principal binding at AION Runtime
    -> durable Actor lookup (AION Data) / Core PolicyEngine
    -> Runtime Execution Gateway -> approved adapters
    -> audit evidence + correlated OpenTelemetry signals

Sentinel owns *integration contracts* for identity, trust and observability;
it does not become an alternative path for agents to call business APIs.
The existing aion-security repo owns proactive security assurance connectors.

## Implementation interface

The exported createTrustBoundary() is deliberately a library seam with three
required, injected functions:

- verifyIdentity({credential}) — a vetted adapter validates the signed token
  against expected issuer, audience, expiry, algorithm and rotation/revocation
  rules. It must never read principal claims from an untrusted body.
- decidePermission({principal,tenantId,action,resource}) — delegates to the
  authoritative Runtime/Core decision path. No in-process allowlist default.
- recordAudit(event) — commits to a durable, isolated audit sink and resolves
  only on acknowledgement. A console log is **not** sufficient for production.

No adapter is provided by the foundation. Absence, errors and non-boolean
allow results fail closed. Sensitive operations are independently enforced
again by Runtime, even after any preflight decision.

## Data and telemetry

- Audit event schema: schemas/audit-event.v1.schema.json.
- Correlate decisions with a request/trace ID; do not use a token as an ID.
- Keep authorization audit records separate from sampled diagnostic traces.
- Future OpenTelemetry spans/metrics are non-authoritative and must redact
  JWTs, API keys, PII, prompt data and sensitive business records.
- Future audit store requires append-only/tamper-evident controls, tenant-
  restricted access, backup/restore tests and documented retention policy.

## Threats to prove

Token replay; invalid issuer/audience; expired/revoked credentials; forged
tenant selector; principal/Actor mismatch; approval spoofing; TOCTOU permission
changes; unavailable IdP; unavailable policy engine; failed evidence write;
cross-tenant data leakage; trace/log secret leakage; telemetry flooding.

## Runtime boundaries

- AION Runtime: identity enforcement, command execution, human approval.
- AION Core: policy semantics and human gates.
- AION Data: actor and execution persistence.
- AION Infra: workloads, secrets, network access and deployment.
- AION Security: assurance agents/connectors and red/blue testing.
- AION Sentinel: reusable identity and observability integrations.
