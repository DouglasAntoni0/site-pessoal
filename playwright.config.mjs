import { defineConfig, devices } from '@playwright/test';

const smoke = /@smoke/;

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: process.env.BASE_URL ? undefined : {
    command: 'python -m http.server 4173 --bind 127.0.0.1 --directory dist',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 20_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'firefox-smoke',
      grep: smoke,
      use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 768 } }
    },
    {
      name: 'webkit-smoke',
      grep: smoke,
      use: { ...devices['Desktop Safari'], viewport: { width: 1366, height: 768 } }
    }
  ]
});
