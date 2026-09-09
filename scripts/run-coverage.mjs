import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import v8toIstanbul from 'v8-to-istanbul';
import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import { publicSite } from '../tests/support/public-site.mjs';

const url = publicSite();
function run(args, env = {}) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', windowsHide: true, env: { ...process.env, ...env } });
  if (result.error) throw result.error;
  return result.status ?? 1;
}
const status = run(['node_modules/@playwright/test/cli.js', 'test', '--project=chromium'], { COVERAGE: '1' });
const coverage = libCoverage.createCoverageMap({});
const bundleRoot = path.resolve('dist/assets/build');
const entries = [];
for await (const filename of fs.glob('test-results/**/v8-coverage.json')) entries.push(...JSON.parse(await fs.readFile(filename, 'utf8')));
if (!entries.length) throw new Error('Nenhuma cobertura do site público foi coletada.');
const conversions = new Map();
// Fetch the source maps belonging to the actual deployed bundles, avoiding
// platform-dependent build hashes. Check their embedded sources against this checkout.
for (const entry of entries) {
  if (conversions.has(entry.url)) continue;
  const name = path.posix.basename(new URL(entry.url).pathname);
  const file = path.join(bundleRoot, name);
  const sourceResponse = await fetch(entry.url, { signal: AbortSignal.timeout(20_000) });
  const mapResponse = await fetch(entry.url + '.map', { signal: AbortSignal.timeout(20_000) });
  if (!sourceResponse.ok || !mapResponse.ok) throw new Error('Bundle or source map unavailable: ' + entry.url);
  const source = await sourceResponse.text();
  const sourcemap = await mapResponse.json();
  for (let i = 0; i < sourcemap.sources.length; i++) {
    const mappedPath = path.resolve(path.dirname(file), sourcemap.sources[i]);
    const allowedRoot = path.resolve('src') + path.sep;
    if (!mappedPath.startsWith(allowedRoot)) throw new Error('Unexpected mapped source: ' + mappedPath);
    const local = await fs.readFile(mappedPath, 'utf8');
    if (local.replaceAll('\r\n', '\n') !== sourcemap.sourcesContent[i].replaceAll('\r\n', '\n')) {
      throw new Error('O fonte publicado difere do checkout: ' + mappedPath);
    }
  }
  const converter = v8toIstanbul(file, 0, { source, sourceMap: { sourcemap } });
  await converter.load();
  converter.applyCoverage([{ functionName: '', isBlockCoverage: true, ranges: [{ startOffset: 0, endOffset: source.length, count: 0 }] }]);
  coverage.merge(converter.toIstanbul());
  conversions.set(entry.url, { file, source, sourcemap });
}
const checked = new Set();
for (const entry of entries) {
  const name = path.posix.basename(new URL(entry.url).pathname);
  const built = conversions.get(entry.url);
  if (!built || entry.source !== built.source) {
    throw new Error('O JavaScript publicado difere do código usado para os source maps: ' + entry.url);
  }
  checked.add(name);
  const converter = v8toIstanbul(built.file, 0, { source: entry.source, sourceMap: { sourcemap: built.sourcemap } });
  await converter.load();
  converter.applyCoverage(entry.functions);
  coverage.merge(converter.toIstanbul());
}
coverage.filter(filename => filename.replaceAll('\\', '/').includes('/src/scripts/'));
const expectedFiles = (await fs.readdir('src/scripts')).filter(name => name.endsWith('.js'));
for (const name of expectedFiles) {
  if (!coverage.files().some(file => path.basename(file) === name)) throw new Error('Módulo ausente do relatório: ' + name);
}
const output = 'artifacts/coverage';
await fs.mkdir(output, { recursive: true });
const context = libReport.createContext({ dir: output, coverageMap: coverage });
for (const format of ['html', 'json', 'json-summary', 'text']) reports.create(format).execute(context);
const summary = coverage.getCoverageSummary().toJSON();
const thresholds = { lines: 90, statements: 90, functions: 85, branches: 75 };
const failures = Object.entries(thresholds).filter(([kind, minimum]) => summary[kind].pct < minimum);
await fs.writeFile(path.join(output, 'measurement.json'), JSON.stringify({
  url, measuredAt: new Date().toISOString(), method: 'Chromium V8 with byte-identical source maps',
  bundles: [...checked], modules: expectedFiles, thresholds, summary, testExitCode: status,
  scope: 'Default Playwright pages; separately created browser contexts are not included in the coverage percentage.'
}, null, 2));
if (failures.length) console.error('Coverage below gate:', failures);
process.exitCode = status || (failures.length ? 1 : 0);
