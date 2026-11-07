import { createAuditEvent } from './audit.mjs';

const opaqueId = (value) =>
  typeof value === 'string' && /^[A-Za-z0-9._:/-]{1,128}$/.test(value);

const deny = (reason, eventId = null) =>
  Object.freeze({ allowed: false, reason, eventId });

/**
 * Sentinel provides an integration seam, NOT an alternative authorization
 * authority. Wire verifyIdentity to a vetted IdP adapter and decidePermission
 * to the existing AION Runtime/Core authority. Never use request body claims.
 *
 * Adapters:
 * verifyIdentity({credential}) => {verified:true, principal:{principalId, actorId,
 *   kind:'operator'|'service'|'agent-worker', tenantIds:string[]}}
 * decidePermission({principal,tenantId,action,resource}) => {allow:boolean}
 * recordAudit(event) => Promise<void> (durably acknowledged)
 */
export function createTrustBoundary({ verifyIdentity, decidePermission, recordAudit } = {}) {
  async function authorize({ credential, tenantId, action, resource, correlationId = null } = {}) {
    const configured = [verifyIdentity, decidePermission, recordAudit].every(
      (adapter) => typeof adapter === 'function',
    );
    if (!configured) return deny('not_configured');

    const metadata = {
      tenantId: opaqueId(tenantId) ? tenantId : null,
      action: opaqueId(action) ? action : null,
      resource: opaqueId(resource) ? resource : null,
      correlationId: opaqueId(correlationId) ? correlationId : null,
    };
    let principal = null;
    async function finish(outcome, reason) {
      try {
        const event = createAuditEvent({
          ...metadata,
          principalId: principal?.principalId ?? null,
          actorId: principal?.actorId ?? null,
          outcome,
          reason,
        });
        // A failing audit sink must NEVER permit an allow decision.
        await recordAudit(event);
        return outcome === 'allow'
          ? Object.freeze({ allowed: true, reason, eventId: event.eventId })
          : deny(reason, event.eventId);
      } catch {
        return deny('audit_unavailable');
      }
    }

    if (!opaqueId(tenantId) || !opaqueId(action) || !opaqueId(resource)) {
      return finish('deny', 'invalid_request');
    }
    if (typeof credential !== 'string' || credential.length === 0) {
      return finish('deny', 'identity_required');
    }

    let verification;
    try {
      verification = await verifyIdentity({ credential });
    } catch {
      return finish('deny', 'identity_unavailable');
    }
    const candidate = verification?.principal;
    const permittedKind = ['operator', 'service', 'agent-worker'];
    const validPrincipal =
      verification?.verified === true &&
      opaqueId(candidate?.principalId) &&
      opaqueId(candidate?.actorId) &&
      permittedKind.includes(candidate?.kind) &&
      Array.isArray(candidate?.tenantIds) &&
      candidate.tenantIds.length > 0 &&
      candidate.tenantIds.every(opaqueId);

    if (!validPrincipal) return finish('deny', 'identity_invalid');
    principal = Object.freeze({
      principalId: candidate.principalId,
      actorId: candidate.actorId,
      kind: candidate.kind,
      tenantIds: Object.freeze([...candidate.tenantIds]),
    });
    // Tenant selector is only a constraint; it never expands verified grants.
    if (!principal.tenantIds.includes(tenantId)) return finish('deny', 'tenant_forbidden');

    try {
      const decision = await decidePermission({ principal, tenantId, action, resource });
      // Strict allow only. Null/undefined/strings/unknown all deny.
      return finish(decision?.allow === true ? 'allow' : 'deny',
        decision?.allow === true ? 'policy_allowed' : 'policy_denied');
    } catch {
      return finish('deny', 'policy_unavailable');
    }
  }
  return Object.freeze({ authorize });
}
