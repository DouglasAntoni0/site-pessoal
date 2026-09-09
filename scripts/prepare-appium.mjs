import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

// UiAutomator2 8.6.1 ships a shrinkwrap pinning vulnerable Morgan 1.11.0.
// Apply the same explicit override inside that package, where npm honors it.
const driverRoot = path.resolve('tests/appium/node_modules/appium-uiautomator2-driver');
const manifestPath = path.join(driverRoot, 'package.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
assert.equal(manifest.name, 'appium-uiautomator2-driver');
assert.equal(manifest.version, '8.6.1');
manifest.overrides = { ...manifest.overrides, morgan: '1.12.0' };
manifest.dependencies.morgan = '1.12.0';
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
assert(process.env.npm_execpath, 'Run with npm run prepare:appium.');
const result = spawnSync(process.execPath, [process.env.npm_execpath, 'install', '--prefix', driverRoot,
  '--omit=dev', '--ignore-scripts'], { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
if (result.status) process.exit(result.status);
let checked = 0;
for await (const file of fs.glob('tests/appium/node_modules/**/morgan/package.json')) {
  assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).version, '1.12.0', file);
  checked++;
}
assert(checked >= 1, 'Morgan package not found.');
console.log('Verified corrected Morgan in ' + checked + ' installed locations.');
