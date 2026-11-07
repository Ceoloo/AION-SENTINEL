import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrustBoundary } from '../src/identity.mjs';
import { createAuditEvent } from '../src/audit.mjs';

const principal = {
  principalId: 'principal-1',
  actorId: 'actor-1',
  kind: 'agent-worker',
  tenantIds: ['tenant-a'],
};

function harness(overrides = {}) {
  const events = [];
  const adapters = {
    verifyIdentity: async ({ credential }) =>
      credential === 'valid-credential' ? { verified: true, principal } : null,
    decidePermission: async () => ({ allow: true }),
    recordAudit: async (event) => { events.push(event); },
    ...overrides,
  };
  return { boundary: createTrustBoundary(adapters), events };
}

const request = {
  credential: 'valid-credential',
  tenantId: 'tenant-a',
  action: 'invoke',
  resource: 'service:code-review',
  correlationId: 'trace-1',
};

test('unconfigured foundation denies all access', async () => {
  const result = await createTrustBoundary().authorize(request);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'not_configured');
});

test('verified principal with runtime approval and acknowledged audit may allow', async () => {
  const { boundary, events } = harness();
  const result = await boundary.authorize(request);
  assert.equal(result.allowed, true);
  assert.equal(events.length, 1);
  assert.equal(events[0].outcome, 'allow');
  assert.equal(events[0].actorId, 'actor-1');
  assert.equal(events[0].tenantId, 'tenant-a');
  assert.equal(events[0].eventId, result.eventId);
});

test('tenant selector cannot extend identity grants', async () => {
  let policyCalled = false;
  const { boundary, events } = harness({
    decidePermission: async () => { policyCalled = true; return { allow: true }; },
  });
  const result = await boundary.authorize({ ...request, tenantId: 'tenant-b' });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'tenant_forbidden');
  assert.equal(policyCalled, false);
  assert.equal(events[0].outcome, 'deny');
});

test('missing, invalid, unverified or spoofed credential cannot allow', async () => {
  const { boundary } = harness();
  for (const credential of [undefined, '', 'bad-token']) {
    assert.equal((await boundary.authorize({ ...request, credential })).allowed, false);
  }
  const spoof = harness({ verifyIdentity: async () => ({
    verified: false, principal: { ...principal, tenantIds: ['tenant-a'] },
  }) });
  assert.equal((await spoof.boundary.authorize(request)).reason, 'identity_invalid');
});

test('missing policy allow and policy errors deny', async () => {
  for (const decision of [null, undefined, { allow: 'true' }, { allow: false }]) {
    const { boundary } = harness({ decidePermission: async () => decision });
    assert.equal((await boundary.authorize(request)).allowed, false);
  }
  const { boundary } = harness({ decidePermission: async () => { throw Error('offline'); } });
  assert.equal((await boundary.authorize(request)).reason, 'policy_unavailable');
});

test('an audit outage prevents otherwise allowed execution', async () => {
  const { boundary } = harness({ recordAudit: async () => { throw Error('offline'); } });
  const result = await boundary.authorize(request);
  assert.deepEqual(result, { allowed: false, reason: 'audit_unavailable', eventId: null });
});

test('audit is allowlisted metadata, never raw credentials or arbitrary claims', async () => {
  const { boundary, events } = harness();
  await boundary.authorize(request);
  const serialized = JSON.stringify(events[0]);
  assert.ok(!serialized.includes('valid-credential'));
  assert.ok(!serialized.includes('token'));
  assert.throws(() => createAuditEvent({ outcome: 'allow', reason: 'hello world' }));
  assert.equal(Object.isFrozen(events[0]), true);
});

test('invalid inputs fail closed before invoking identity or policy', async () => {
  let called = false;
  const { boundary, events } = harness({
    verifyIdentity: async () => { called = true; return { verified: true, principal }; },
  });
  const result = await boundary.authorize({ ...request, resource: 'invalid value with spaces' });
  assert.equal(result.reason, 'invalid_request');
  assert.equal(called, false);
  assert.equal(events[0].resource, null);
});
