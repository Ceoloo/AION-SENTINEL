# AION Sentinel agent instructions

## Security review baseline

For security questions and code review, follow
[docs/security-audit/BASELINE.md](docs/security-audit/BASELINE.md) and the
Cloudflare security-audit methodology at the **pinned upstream commit** cited
there. Keep AION's canonical Security Infrastructure Standard, Runtime identity
ADR-005, and aion-security ownership ADR-020 as the authority on requirements.

- **Guidance mode is the default.** A request to use this guide or review a
  particular issue does not, by itself, authorize a full security audit.
- Run the full six-phase audit only when expressly requested for a target.
  Do not claim complete coverage without a validated coverage ledger,
  independently verified findings, and a scoped report.
- Never execute untrusted repository code, tools, downloaded dependencies, or
  exploit proofs on the host. Use the specified network-isolated OS sandbox;
  if unavailable, inspect source only and record the verification blocker.
- Do not scan public or deployed AION endpoints or use real identities, client
  data, credentials, or production systems as audit fixtures.
- Do not submit speculative vulnerabilities as confirmed. Keep
  `confirmed`, `needs_validation`, `rejected`, and hardening notes distinct.
- Security audit report outputs go **outside the audited repository** by default.
  Never commit confidential evidence or attack reproductions to this public repo.
- Sentinel is not a new execution authority. Runtime must enforce permissions
  again at the final side effect; Core/Data remain the durable-grant authority.
- New auth, policy, audit, telemetry, deployment, or agent/MCP code must update
  the coverage map and include bounded negative tests before review.

This file sets contributor workflow guidance. It is not an audited finding,
security certification, or permission to run intrusive tests.
