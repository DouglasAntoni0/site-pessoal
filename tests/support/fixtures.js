import { test as base, expect } from '@playwright/test';
import fs from 'node:fs/promises';

export const test = base.extend({
  page: async ({ page, browserName }, use, testInfo) => {
    const collect = process.env.COVERAGE === '1' && browserName === 'chromium';
    if (collect) await page.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymousScripts: false });
    await use(page);
    if (collect && !page.isClosed()) {
      const entries = (await page.coverage.stopJSCoverage()).filter(entry =>
        entry.url.startsWith('https://douglasqa.netlify.app/assets/build/'));
      const target = testInfo.outputPath('v8-coverage.json');
      await fs.writeFile(target, JSON.stringify(entries));
      await testInfo.attach('executed-production-javascript', { path: target, contentType: 'application/json' });
    }
  }
});
export { expect };
