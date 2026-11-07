# ADR-001 — Sentinel foundation and ownership

- Status: **Proposed** (2026-11-06)
- Owner: AION TechOps / Security Infrastructure Layer
- Target: AION-SENTINEL
- Depends on: aion-docs ADR-005 (Runtime identity plane), ADR-020
  (aion-security satellite ownership), Security Infrastructure Standard v1.1

## Decision proposed

Sentinel is a **headless identity/trust integration and observability product
surface**, not a seventh canonical platform plane and not an independent
execution gateway. Runtime remains the authentication enforcement boundary
for execution and Core/Data remain the authorization and durable actor
authorities under ADR-005. Sentinel MUST NOT fork the actor registry, policy
engine, approvals, canonical data schema, or security assurance operations.

Sentinel may supply IdP adapters, machine identity discovery, trusted principal
verification interfaces, observability schemas and integrations, and read-only
operator views. A separate IdP (Keycloak/ZITADEL or approved equivalent)
issues OIDC tokens. No custom password storage or token issuance.

## Hard rules

1. No principal/tenant/permission authority from HTTP bodies or headers.
2. The tenant selector constrains, never elevates, a verified principal.
3. No allow result if identity, policy, or durable security audit is absent.
4. Runtime MUST reauthorize sensitive operations at time of execution.
   A Sentinel decision is never a capability to bypass Runtime.
5. No authorization service or business-data endpoint until OIDC verification,
   Runtime adapter, isolation tests and resilient audit sink are implemented.
6. No sensitive data in general telemetry; security audit uses allowlisted
   metadata and a dedicated durable store with defined access/retention.
7. aion-security continues to own Continuous Assurance connectors and
   red/blue playbooks. Sentinel only exposes integration contracts.
8. No deployments or provider/migration changes from this foundation PR.

## Open decisions

- Upstream IdP: Keycloak vs ZITADEL; evaluate license, operations, MFA,
  recovery, tenancy, SSO/brokering, workload identity.
- Identity mapping: IdP subject to Runtime Principal/Actor, revocation,
  tenant scope, token audience/issuer and JWKS rotation semantics.
- Authorization adapter API: Runtime-controlled authenticated internal
  endpoint vs library composition; reconcile with ADR-005 first.
- OpenTelemetry propagation, sampling and PII suppression; evidence retention.
- Workload identity (SPIFFE/SPIRE) after basic service identity.
- Threat model, production runbooks, service SLOs and incident response.

## Acceptance before changing to Accepted

Architecture/security owner review, explicit boundary review against
ADR-005/ADR-020, IdP decision, testing for revoked identity / forged
tenant / failed audit / decision timeout, and written Runtime integration plan.
