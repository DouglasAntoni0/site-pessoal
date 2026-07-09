import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';

const [, , portArg, ...command] = process.argv;
const port = Number(portArg || 4173);
const root = fileURLToPath(new URL('../../', import.meta.url));
const url = `http://127.0.0.1:${port}`;
const externalUrl = process.env.BASE_URL;

if (!command.length) {
  console.error('Missing command to run with static server.');
  process.exit(1);
}

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await wait(250);
    }
  }
  throw new Error(`Static server did not start at ${url}`);
}

let server;
if (!externalUrl) {
  server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: root,
    stdio: 'ignore',
    windowsHide: true
  });
}

try {
  if (!externalUrl) {
    await waitForServer();
  }

  const finalCommand = command.map(arg => arg.replace(`http://127.0.0.1:${port}`, externalUrl || url));

  const executable = finalCommand[0] === 'cypress'
    ? process.execPath
    : finalCommand[0];
  const args = finalCommand[0] === 'cypress'
    ? [path.join(root, 'node_modules', 'cypress', 'bin', 'cypress'), ...finalCommand.slice(1)]
    : finalCommand.slice(1);
  const child = spawn(executable, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true
  });

  const [code] = await once(child, 'exit');
  process.exitCode = code ?? 1;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (server) {
    server.kill();
  }
}
