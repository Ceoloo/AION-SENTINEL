# Security audit run — owner template

> Template only. This is not a completed audit. Do not check in sensitive
> evidence, exploit details, or production information to this public repo.

**Run ID:** _assign a unique private run ID_
**Target repository:** _owner/repo_
**Source SHA / worktree status:** _immutable SHA / clean or dirty_
**Audit mode:** _quick / standard / deep_
**Scope paths and trust boundaries:** _exact directories and endpoints_
**Exclusions and deployment unknowns:** _list_
**Prior run references:** _list or none_
**Execution policy:** sandboxed-source-and-local-only
**Sandbox verified by:** _owner and date or "unavailable"_
**Run status:** _not started / incomplete / complete_
**Audit owner:** _named person or team_
**Independent reviewers:** _named distinct reviewers_

## Reconnaissance

- Entrypoints and sink map:
- Effective human/service/agent identities:
- Tenant/resource trust boundaries:
- Dependency and deployment assumptions:
- Prior code/version changes:
- Applicable Cloudflare companion documents:

## Coverage tracking

Record actual checks and evidence in the Cloudflare-format
`coverage-ledger.json`. List its private location here. For every
blocked or deferred unit, name the reason and next verification owner.

## Candidate classification

Use upstream `report-schema.json` and `validate-findings.cjs` for a
full audit. Keep `confirmed`, `needs_validation` and `rejected`
distinct; separately record non-exploitable hardening notes.

- Confirmed findings, source and independently reproduced local effect:
- Needs-validation leads and exact missing facts:
- Rejected leads and disproof:
- Hardening recommendations:
- Coverage gaps and explicit out-of-scope units:

## Independent verification and release decision

- Independent record verification status:
- Validators executed and result (schema success does not certify security):
- Confirmed high/critical findings and blocking remediation:
- Residual risks, owners and deadlines:
- Human approver for merge/deployment:
- Verdict: _incomplete / changes requested / accepted for limited scope_

For a full audit, produce the upstream-required `run-metadata.json`,
`architecture.md`, `coverage-ledger.json`, `findings.json`,
`REPORT.md`, `FINDINGS-DETAIL.md` and `NEEDS-VALIDATION.md`
in the **private external audit output directory**, rather than substituting
this summary template for schema-validated evidence.
