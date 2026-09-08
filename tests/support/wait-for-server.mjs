import { request } from 'node:http';
import { setTimeout as wait } from 'node:timers/promises';

function respondsSuccessfully(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    // A readiness probe needs headers only. The old unread fetch GET body could
    // crash Node's Undici parser when Python closed a large HTTP/1.0 response.
    const probe = request(url, { method: 'HEAD', agent: false, signal: AbortSignal.timeout(timeoutMs) }, response => {
      response.once('error', reject);
      response.once('end', () => resolve(response.statusCode >= 200 && response.statusCode < 300));
      response.resume();
    });
    probe.once('error', reject);
    probe.end();
  });
}

export async function waitForServer(url, { timeoutMs = 15_000, pollIntervalMs = 250, probeTimeoutMs = 1_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await respondsSuccessfully(url, Math.min(probeTimeoutMs, deadline - Date.now()))) return;
    } catch {
      // Connection refusal and an unresponsive server both remain bounded.
    }
    const remaining = deadline - Date.now();
    if (remaining > 0) await wait(Math.min(pollIntervalMs, remaining));
  }
  throw new Error(`Static server did not start at ${url} within ${timeoutMs}ms`);
}
