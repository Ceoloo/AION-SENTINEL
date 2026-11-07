import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const json = (res, status, value) => {
  const payload = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
};

/**
 * Health-only shell. No authentication, policy, audit or execution endpoints
 * are exposed until production adapters and negative security proofs exist.
 */
export function createSentinelServer() {
  return createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health/live') {
      return json(res, 200, { service: 'aion-sentinel', status: 'live' });
    }
    if (req.method === 'GET' && req.url === '/health/ready') {
      return json(res, 503, {
        service: 'aion-sentinel',
        status: 'not_ready',
        reason: 'identity_policy_and_durable_audit_not_integrated',
      });
    }
    return json(res, 404, { error: 'not_found' });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || '8085');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    process.stderr.write('Invalid PORT\n');
    process.exit(1);
  }
  const server = createSentinelServer();
  server.listen(port, host, () => {
    process.stdout.write(JSON.stringify({
      service: 'aion-sentinel', state: 'foundation_only', host, port,
    }) + '\n');
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}
