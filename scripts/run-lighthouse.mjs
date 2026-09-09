import { publicSite } from '../tests/support/public-site.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import { Launcher } from 'chrome-launcher';
import { chromium } from '@playwright/test';
import { assessReports } from './lighthouse-policy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const url = publicSite();
const output = path.join(root, '.lighthouseci');
await fs.mkdir(output, { recursive: true });
const previousReports = ['assessment.json', 'failure.json', 'chrome-out.log', 'chrome-err.log',
    ...[1, 2, 3].flatMap(run => [`run-${run}.html`, `run-${run}.json`])];
await Promise.all(previousReports.map(name => fs.rm(path.join(output, name), { force: true })));
await fs.mkdir(path.join(root, 'test-results'), { recursive: true });
const profile = await fs.mkdtemp(path.join(root, 'test-results', 'lighthouse-profile-'));
const chromePath = chromium.executablePath();
// Use the browser revision installed from package-lock.json, with a fresh profile.
// Retain this launcher even if startup fails so finally can stop its own process.
const chrome = new Launcher({ chromePath, userDataDir: profile, chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'], logLevel: 'error' });
try {
    await fs.access(chromePath).catch(() => { throw new Error('Lighthouse browser missing. Run: npx playwright install chromium'); });
    await chrome.launch();
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
} catch (error) {
    await fs.writeFile(path.join(output, 'failure.json'), JSON.stringify({ measuredAt: new Date().toISOString(), node: process.version, chromePath, message: error.message, stack: error.stack }, null, 2));
    await Promise.allSettled(['chrome-out.log', 'chrome-err.log'].map(name => fs.copyFile(path.join(profile, name), path.join(output, name))));
    throw error;
} finally {
    await chrome.kill();
}
