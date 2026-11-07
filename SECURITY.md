# Security policy — foundation status

This repository is a **non-production foundation**. It must not be relied on
as an identity provider, token service, audit system or authorization oracle.

- Public repo: never commit credentials, signing keys or customer data.
- No credentials are stored, decoded or logged by the foundation.
- No user login, OIDC issuance, privilege elevation or command API exists.
- Only GET /health/live (200) and GET /health/ready (503) are exposed.
- Health server binds to 127.0.0.1 by default. Do not publicly expose it.
- Any authorization prototype requires verified identity, authoritative
  Runtime policy and a durably acknowledged audit record.
- Testing success does NOT establish security assurance or production readiness.
- Report a security vulnerability privately using GitHub's repository
  Security tab if private vulnerability reporting is enabled, otherwise
  contact a repository maintainer through an agreed private channel.
- Do not include secrets or exploit details in public issues.
