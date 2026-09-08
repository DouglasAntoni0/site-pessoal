import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createServer as createTcpServer } from 'node:net';
import { once } from 'node:events';
import { waitForServer } from '../support/wait-for-server.mjs';

async function listen(server, t) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}/`;
}

test('readiness handles a large HTTP/1.0 document without requesting its body', async t => {
  const methods = [];
  const body = Buffer.alloc(256 * 1024, 'a');
  const server = createTcpServer(socket => {
    socket.once('data', data => {
      const method = data.toString().split(' ')[0];
      methods.push(method);
      socket.write(`HTTP/1.0 200 OK\r\nContent-Length: ${body.length}\r\nConnection: close\r\n\r\n`);
      socket.end(method === 'HEAD' ? undefined : body);
    });
  });
  const url = await listen(server, t);
  for (let attempt = 0; attempt < 3; attempt++) await waitForServer(url);
  assert.deepEqual(methods, ['HEAD', 'HEAD', 'HEAD']);
});

test('readiness waits through unsuccessful HTTP statuses', async t => {
  let requests = 0;
  const server = createServer((request, response) => {
    response.writeHead(++requests < 3 ? 503 : 200);
    response.end();
  });
  const url = await listen(server, t);
  await waitForServer(url, { pollIntervalMs: 10 });
  assert.equal(requests, 3);
});

test('a server that accepts connections but never replies times out', async t => {
  const sockets = new Set();
  const server = createTcpServer(socket => {
    sockets.add(socket);
    socket.on('data', () => {});
    socket.on('close', () => sockets.delete(socket));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => {
    for (const socket of sockets) socket.destroy();
    return new Promise(resolve => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}/`;
  await assert.rejects(waitForServer(url, { timeoutMs: 200, probeTimeoutMs: 50, pollIntervalMs: 10 }), /Static server did not start/);
});
