## Change and trust boundary

- What changed, and what is the affected human/service/agent identity?
- What new entrypoint, tenant/resource boundary, sensitive sink, or side effect
  is involved? State **none** only after reviewing the actual diff.

## Security review

- [ ] Updated [coverage map](../docs/security-audit/COVERAGE-MAP.md) if new
      identity, authorization, audit, telemetry, deployment, or agent surfaces appear.
- [ ] Traced untrusted input -> authoritative policy -> sensitive sink;
      no bypass of AION Runtime approvals.
- [ ] Added/updated bounded negative tests for relevant denial conditions.
- [ ] No tokens, keys, confidential evidence, or customer data in diff/logs.
- [ ] Distinguished confirmed vulnerabilities from needs-validation and
      hardening notes; linked private review tracking where applicable.
- [ ] Any critical/high confirmed issues resolved and independently rechecked,
      or change remains blocked.
- [ ] No claim of full security audit or production readiness based only on CI.

## Evidence and rollout

- Tests run:
- Audit profile/scope (or explanation for guidance-only review):
- Known validation gaps:
- Deployment impact: none / staged / requires separate approval
