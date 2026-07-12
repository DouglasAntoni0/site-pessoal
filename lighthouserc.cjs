module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-gpu',
        emulatedFormFactor: 'mobile'
      }
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'network-dependency-tree-insight': 'off',
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, aggregationMethod: 'median' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05, aggregationMethod: 'median' }],
        'total-blocking-time': ['error', { maxNumericValue: 150, aggregationMethod: 'median' }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci'
    }
  }
};
