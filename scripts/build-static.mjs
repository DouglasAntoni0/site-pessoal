import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const files = [
  'index.html',
  'layout.css',
  'animations.css',
  'projects-data.js',
  'main.js'
];

async function copyIfExists(source, target) {
  try {
    const stat = await fs.stat(source);
    if (stat.isDirectory()) {
      await fs.cp(source, target, { recursive: true });
    } else {
      await fs.copyFile(source, target);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });

for (const file of files) {
  await copyIfExists(path.join(root, file), path.join(dist, file));
}

await copyIfExists(path.join(root, 'assets'), path.join(dist, 'assets'));

console.log('Static site built in dist/. Tests are intentionally not part of the Netlify deploy artifact.');
