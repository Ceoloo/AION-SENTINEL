# AION Sentinel — Security audit baseline v0.1

- **Status:** Adopted methodology / proposed AION-wide process, **not** a
  completed security audit or production attestation.
- **Owner:** AION TechOps Security Infrastructure Layer
- **Methodology source:** [Cloudflare security-audit-skill](https://github.com/cloudflare/security-audit-skill)
- **Pinned upstream reference:** [commit `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`](https://github.com/cloudflare/security-audit-skill/tree/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/skills/security-audit)
- **Source license:** [MIT](https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/LICENSE)
- **Companions:** [Coverage map](COVERAGE-MAP.md) · [Run record template](RUN-TEMPLATE.md)

This is an **AION-authored adaptation**, not a vendored copy of upstream code
or a claim that the skill has been installed or executed in CI. Re-evaluate
changes to the upstream methodology before changing the pinned revision.

## Policy hierarchy and ownership

1. **AION standards and accepted ADRs are normative:** aion-docs Security
   Infrastructure Standard (SIS v1.1), ADR-005 Runtime Identity Plane,
   ADR-020 aion-security Ownership, and the Secure Execution/Continuous
   Assurance contracts. The upstream skill supplies **audit methodology**,
   not new authorization or deployment policy.
2. **Sentinel** owns identity/trust/observability integration contracts and
   evidence schemas, not canonical policy or a second gateway.
3. **Runtime** enforces identity, approval and execution decisions; Core/Data
   remain the source of policy/Actor truth.
4. **aion-security** owns continuous-assurance connectors, red/blue playbooks
   and operational audit delivery. Audit results may inform Sentinel, but
   must not route remediation around Runtime's command/approval gates.
5. **aion-infra** owns deployed configuration, secrets and network controls.
   A source-only audit cannot certify its live configuration.

This baseline is initially added to the Sentinel repo. A broader AION-wide
policy change needs its own accepted aion-docs decision before calling it
binding across all repositories.

## Operating modes

- **Guidance (default):** targeted threat modeling, source review, code
  change checks, and finding triage. Read only relevant skill companions.
  No six-phase run or audit report is implied.
- **Full audit (explicit authorization only):** choose a target, immutable
  source SHA, declared profile (`quick`, `standard`, or `deep`), scope,
  exclusions, evidence and a separately writable output directory. Run the
  six phases below. If required isolation or independent validation is
  unavailable, mark incomplete/needs_validation rather than claiming clean.

## Full audit — six mandatory stages

1. **Reconnaissance:** inventory entry points, actors, identities, data
   stores, secrets, dependency calls, authorization gates, deployments,
   sinks and trust boundaries. Record source SHA, scope and prior audits
   in `run-metadata.json` and `architecture.md`. Create deterministic
   `coverage-ledger.json` before hunting.
2. **Coverage-led hunting:** assign threat classes against concrete
   boundary/entrypoint units. Hunt separately across identity, auth,
   web/protocol, agents/MCP, tenancy, audit/evidence, cloud, supply chain
   and resource exhaustion; compare direct, queued, retry, resumed, batch
   and delegated paths. Record uncovered and deferred units. Use an
   independent coverage critic.
3. **Independent candidate validation:** give each distinct candidate to a
   reviewer who did not discover it. Require a source-to-sink trace,
   identifiable lower-trust actor, affected principal/resource, concrete
   boundary violation, and the smallest safe local proof. A plausible
   attack chain alone is not confirmation.
4. **Structured findings:** retain separate `confirmed`,
   `needs_validation`, and `rejected` records in `findings.json`
   according to Cloudflare's pinned `report-schema.json`.
   Validate findings with `validate-findings.cjs` and the ledger with
   `validate-coverage-ledger.cjs` **from the reviewed pinned source**.
   Do not copy/use a changed upstream script silently.
5. **Independent record verification:** recheck source paths, trust
   boundaries, actual observed effect, impact, remediation and unresolved
   blockers. If a material replacement increases certainty/impact or
   changes the evidence, require a fresh independent verifier.
6. **Report:** derive `REPORT.md`, `FINDINGS-DETAIL.md` and
   `NEEDS-VALIDATION.md` from verified records and the coverage ledger.
   Describe profile, immutable ref, evidence limits, coverage gaps,
   confirmed findings and owner actions. No severity for
   `needs_validation`; rejected hypotheses are not vulnerabilities.

## Evidence quality and verdicts

| Verdict | Evidence requirement | Reporting |
| --- | --- | --- |
| `confirmed` | Current-source trace and bounded, independently verified boundary failure | Impact-based severity, affected principal/resource, smallest fix and regression case |
| `needs_validation` | Specific source-supported suspicion with decisive missing fact | No severity; exact blocker, bounded local validation or owner-observed deployed-state check |
| `rejected` | Hypothesis disproved by source or local evidence | Retained as rejected only; never in confirmed-findings table |
| Hardening note | Defense-in-depth opportunity where a blocking control remains effective | Separate from vulnerabilities; can be prioritized as engineering debt |

Never convert absence of telemetry, missing configuration visibility, or a
checklist deviation into a confirmed exploit without demonstrating the
underlying security boundary violation. Do not equate format-validation success
with verified security.

## Safety and evidence isolation (mandatory)

- Source review is read-only. Execute target-controlled processes, tests,
  fuzzers, generated code or fixtures **only** in an OS-enforced sandbox with
  no external network (isolated loopback only if needed), a sanitized
  allowlisted environment, read-only target/toolchain, agent-specific scratch
  storage and tight CPU/memory/process/disk/time limits.
- If any safeguard cannot be established, do **not execute target code**.
  Record the limitation as `needs_validation` and specify a bounded owner
  validation plan. CI currently tests product code; it does not constitute
  this adversarial sandbox.
- Never probe live deployments, production identities, shared systems,
  customer records, or paid APIs; never run stress tests against shared
  infrastructure or install dependencies over the network inside the sandbox.
- Full-audit run output defaults **outside the repository**, for example
  a private dedicated audit workspace. Do not place run results inside this
  repo unless explicitly authorized and gitignored; protect confidential
  findings under restricted access.
- Use dummy tenants, principals, tokens and clients. No screenshots/logs
  with credentials, personal data, private models, or sensitive prompts.
- Separate reviewer roles and isolate their scratch/output paths; one
  contributor must not secretly validate their own candidate as independent.
- For potential production issues, owners conduct approved, non-intrusive
  observation or authorized staged reproductions; never use live exploitation
  as a shortcut to a verdict.

## Required output and gates

A full run must identify `target`, `source_ref`, `profile`,
`scope_paths`, `out_of_scope`, `run_status`, `coverage_status`,
independent reviewer identities, findings or explicit zero-findings, and
action owners. An incomplete run must remain labeled **INCOMPLETE**.

Before changing a Sentinel trust boundary or promoting to production:

1. Run relevant regression/negative tests (fail-closed, revoked access,
   wrong issuer/audience, forged tenant, approval/actor mismatch, policy
   and audit outage, bypass path, replay, trace redaction, failure recovery).
2. Obtain an independent source-grounded security review with a recorded
   coverage scope and status.
3. Treat confirmed critical/high findings as release blockers until
   remediated and independently reverified. Track other confirmed findings,
   hardening notes and needs-validation leads with owners.
4. Never deploy or merge solely because Node tests or this baseline document
   exists. Production authority remains with AION's human deployment/
   operator review gates.

See upstream [SKILL.md](https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/skills/security-audit/SKILL.md),
[RECONNAISSANCE.md](https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/skills/security-audit/RECONNAISSANCE.md),
[HUNTING.md](https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/skills/security-audit/HUNTING.md)
and [VALIDATION-AND-REPORTING.md](https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/skills/security-audit/VALIDATION-AND-REPORTING.md).
