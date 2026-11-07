import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createSentinelServer } from '../src/server.mjs';

test('health-only shell is live but NOT ready and exposes no command API', async () => {
  const server = createSentinelServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  try {
    const base = 'http://127.0.0.1:' + port;
    const live = await fetch(base + '/health/live');
    assert.equal(live.status, 200);
    assert.equal((await live.json()).status, 'live');
    const ready = await fetch(base + '/health/ready');
    assert.equal(ready.status, 503);
    assert.equal((await ready.json()).status, 'not_ready');
    const command = await fetch(base + '/v1/commands', { method: 'POST' });
    assert.equal(command.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
