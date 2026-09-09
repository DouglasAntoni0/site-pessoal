import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { publicSite } from '../tests/support/public-site.mjs';

const url = publicSite();
const browser = await chromium.launch();
const results = [];
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto(url);
  const urls = new Set(await page.locator('a[href]').evaluateAll(links => links.filter(a => !a.closest('.glass-modal')).map(a => a.href)));
  await page.locator('#projects-more > summary').click();
  for (const trigger of await page.locator('.trigger-modal').all()) {
    await trigger.click();
    await page.locator('#project-modal.active').waitFor();
    for (const href of await page.locator('#project-modal a[href]').evaluateAll(links => links.map(a => a.href))) urls.add(href);
    await page.keyboard.press('Escape');
  }
  for (const href of urls) {
    const target = new URL(href);
    if (!['http:', 'https:'].includes(target.protocol) || (target.origin === new URL(url).origin && target.hash)) continue;
    let result;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(href, { redirect: 'follow', signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'DouglasQA-LinkCheck/1.0' } });
        await response.body?.cancel();
        const protectedResponse = [401, 403, 429, 999].includes(response.status);
        result = { url: href, finalUrl: response.url, status: response.status,
          outcome: response.ok ? 'passed' : protectedResponse ? 'inconclusive' : 'failed' };
        if (response.status < 500) break;
      } catch (error) {
        result = { url: href, outcome: 'failed', error: error.message };
      }
    }
    results.push(result);
    console.log(JSON.stringify(result));
  }
} finally {
  await browser.close();
}
const summary = { url, checkedAt: new Date().toISOString(), passed: results.filter(r => r.outcome === 'passed').length,
  failed: results.filter(r => r.outcome === 'failed').length, inconclusive: results.filter(r => r.outcome === 'inconclusive').length, results };
await fs.mkdir('artifacts/links', { recursive: true });
await fs.writeFile('artifacts/links/report.json', JSON.stringify(summary, null, 2));
const text = 'Links públicos: ' + summary.passed + ' confirmados, ' + summary.failed + ' falharam, ' + summary.inconclusive + ' inconclusivos (bloqueio/autenticação; exigem conferência manual).';
console.log(text);
if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, text + '\n');
if (summary.failed) process.exitCode = 1;
