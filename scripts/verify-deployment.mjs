import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { publicSite } from '../tests/support/public-site.mjs';

const url = publicSite();
const expected = process.env.EXPECTED_COMMIT;
const deadline = Date.now() + (expected ? 600_000 : 30_000);
let result;
do {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error('Site indisponível: HTTP ' + response.status);
  const html = await response.text();
  const manifestResponse = await fetch(url + 'deployment.json?t=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  let manifest;
  if (manifestResponse.ok && manifestResponse.headers.get('content-type')?.includes('json')) manifest = await manifestResponse.json();
  else await manifestResponse.body?.cancel();
  result = { url, checkedAt: new Date().toISOString(), expectedCommit: expected || null,
    deployedCommit: manifest?.commit || null, htmlSha256: createHash('sha256').update(html).digest('hex') };
  if (!expected || manifest?.commit === expected) break;
  console.log('Aguardando o Netlify publicar o commit solicitado...');
  await setTimeout(15_000);
} while (Date.now() < deadline);
await fs.mkdir('artifacts/deployment', { recursive: true });
await fs.writeFile('artifacts/deployment/verified.json', JSON.stringify(result, null, 2));
if (expected && result.deployedCommit !== expected) throw new Error('O commit publicado não corresponde ao commit solicitado: ' + JSON.stringify(result));
console.log(JSON.stringify(result, null, 2));
