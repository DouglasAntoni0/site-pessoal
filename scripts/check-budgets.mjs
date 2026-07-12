import fs from 'node:fs/promises';
import path from 'node:path';
import { brotliCompressSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const htmlPath = path.join(dist, 'index.html');
const html = await fs.readFile(htmlPath, 'utf8');

const localReferences = [...html.matchAll(/(?:href|src)="(assets\/[^"#?]+)"/g)].map((match) => match[1]);
const criticalReferences = [...new Set(localReferences.filter((reference) => /(?:assets\/build\/.+\.(?:css|js|woff2)|assets\/icons\/favicon\.svg)$/.test(reference)))];
const files = [{ name: 'index.html', path: htmlPath }];
for (const reference of criticalReferences) files.push({ name: reference, path: path.join(dist, reference) });

const measured = [];
for (const file of files) {
    const bytes = await fs.readFile(file.path);
    measured.push({ name: file.name, raw: bytes.byteLength, brotli: brotliCompressSync(bytes).byteLength });
}

const css = measured.filter((file) => file.name.endsWith('.css')).reduce((sum, file) => sum + file.brotli, 0);
const js = measured.filter((file) => file.name.endsWith('.js')).reduce((sum, file) => sum + file.brotli, 0);
const total = measured.reduce((sum, file) => sum + file.brotli, 0);
const requestCount = 1 + criticalReferences.length;
const budgets = {
    css: { actual: css, limit: 20 * 1024 },
    js: { actual: js, limit: 20 * 1024 },
    total: { actual: total, limit: 250 * 1024 },
    requests: { actual: requestCount, limit: 8 }
};

console.table(measured.map((file) => ({ file: file.name, rawBytes: file.raw, brotliBytes: file.brotli })));
for (const [name, budget] of Object.entries(budgets)) {
    if (budget.actual > budget.limit) {
        throw new Error(`${name} budget exceeded: ${budget.actual} > ${budget.limit}`);
    }
}
console.log('Performance budgets passed.', budgets);
