import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const files = [];
for (const folder of ['src', 'scripts', 'tests']) {
  for await (const file of fs.glob(folder + '/**/*.{js,mjs}')) files.push(file);
}
files.push('playwright.config.mjs', 'playwright.visual.config.mjs', 'cypress.config.mjs');
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status) process.exit(result.status);
}
console.log('Syntax verified in ' + files.length + ' JavaScript files.');
