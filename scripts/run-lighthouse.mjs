import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { assessReports } from './lighthouse-policy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const url = process.env.BASE_URL || 'http://127.0.0.1:4178/';
const output = path.join(root, '.lighthouseci');
const profile = path.join(root, 'test-results', 'lighthouse-profile');
await fs.mkdir(output, { recursive: true });
await fs.mkdir(profile, { recursive: true });
// A dedicated profile also avoids chrome-launcher's temporary-folder cleanup issue on Windows.
const chrome = await launch({ userDataDir: profile, chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'], logLevel: 'silent' });
try {
    const reports = [];
    for (let run = 1; run <= 3; run += 1) {
        const result = await lighthouse(url, { port: chrome.port, output: ['json', 'html'], logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
        await fs.writeFile(path.join(output, `run-${run}.json`), result.report[0]);
        await fs.writeFile(path.join(output, `run-${run}.html`), result.report[1]);
        if (result.lhr.runtimeError) throw new Error(result.lhr.runtimeError.message);
        reports.push(result.lhr);
        console.log(`Lighthouse ${run}/3: ${Math.round(result.lhr.categories.performance.score * 100)} performance`);
    }
    const assessment = assessReports(reports);
    await fs.writeFile(path.join(output, 'assessment.json'), JSON.stringify({ url, measuredAt: new Date().toISOString(), ...assessment }, null, 2));
    console.log(JSON.stringify(assessment, null, 2));
    if (!assessment.passed) process.exitCode = 1;
} finally {
    await chrome.kill();
}
