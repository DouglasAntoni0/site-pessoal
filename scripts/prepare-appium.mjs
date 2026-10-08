import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

// UiAutomator2 bundles dependencies with older versions.
// Apply the reviewed security patches inside that package, where npm honors them.
const project = JSON.parse(await fs.readFile('tests/appium/package.json', 'utf8'));
const patches = project.overrides;
const driverRoot = path.resolve('tests/appium/node_modules/appium-uiautomator2-driver');
const manifestPath = path.join(driverRoot, 'package.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
assert.equal(manifest.name, 'appium-uiautomator2-driver');
assert.equal(manifest.version, project.devDependencies['appium-uiautomator2-driver']);
manifest.overrides = { ...manifest.overrides, ...patches };
for (const section of ['dependencies', 'optionalDependencies']) {
  for (const [name, version] of Object.entries(patches)) {
    if (manifest[section]?.[name]) manifest[section][name] = version;
  }
}
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
assert(process.env.npm_execpath, 'Run with npm run prepare:appium.');
const result = spawnSync(process.execPath, [process.env.npm_execpath, 'update', ...Object.keys(patches), '--prefix', driverRoot,
  '--omit=dev', '--ignore-scripts'], { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
if (result.status) process.exit(result.status);
for (const [name, version] of Object.entries(patches)) {
  let checked = 0;
  for await (const file of fs.glob(`tests/appium/node_modules/**/${name}/package.json`)) {
    assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).version, version, file);
    checked++;
  }
  assert(checked >= 1, `${name} package not found.`);
  console.log(`Verified ${name}@${version} in ${checked} installed locations.`);
}
