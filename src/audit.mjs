import { randomUUID } from 'node:crypto';

/**
 * Allowlisted security decision metadata. Never spread request bodies, JWT claims,
 * headers, credentials or arbitrary payloads into an audit record.
 * An audit event is evidence only when a durable sink successfully acknowledges it.
 */
export function createAuditEvent({
  principalId = null,
  actorId = null,
  tenantId = null,
  action = null,
  resource = null,
  correlationId = null,
  outcome,
  reason,
} = {}) {
  if (!['allow', 'deny'].includes(outcome)) throw new TypeError('invalid audit outcome');
  if (typeof reason !== 'string' || !/^[a-z_]{3,48}$/.test(reason)) {
    throw new TypeError('invalid audit reason');
  }
  for (const value of [principalId, actorId, tenantId, action, resource, correlationId]) {
    if (value !== null && (typeof value !== 'string' || !/^[A-Za-z0-9._:/-]{1,128}$/.test(value))) {
      throw new TypeError('invalid audit metadata');
    }
  }
  return Object.freeze({
    schemaVersion: '1.0',
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    category: 'authorization',
    outcome,
    reason,
    principalId,
    actorId,
    tenantId,
    action,
    resource,
    correlationId,
  });
}
