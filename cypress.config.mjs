import { defineConfig } from 'cypress';
import { publicSite } from './tests/support/public-site.mjs';

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: publicSite(),
    setupNodeEvents(on, config) {
      if (config.baseUrl !== publicSite()) throw new Error('Cypress must test the public Netlify site.');
      return config;
    },
    specPattern: 'tests/cypress/**/*.cy.js',
    supportFile: false,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000
  }
});
