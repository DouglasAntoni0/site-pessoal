import { defineConfig, devices } from '@playwright/test';
import { publicSite } from './tests/support/public-site.mjs';

export default defineConfig({
  testDir: './tests/visual',
  outputDir: 'artifacts/visual-results',
  snapshotPathTemplate: '{testDir}/baselines/{platform}/{projectName}/{arg}{ext}',
  timeout: 60_000,
  expect: { timeout: 10_000, toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.002 } },
  workers: 1,
  retries: 0,
  updateSnapshots: 'none',
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { outputFolder: 'artifacts/visual-report', open: 'never' }]],
  use: { baseURL: publicSite(), reducedMotion: 'reduce', colorScheme: 'dark', locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true } }
  ]
});
