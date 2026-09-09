import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicSite, PUBLIC_SITE } from '../support/public-site.mjs';

test('public site policy defaults to the published HTTPS origin', () => {
  const previous = process.env.BASE_URL;
  try {
    delete process.env.BASE_URL;
    assert.equal(publicSite(), PUBLIC_SITE);
    process.env.BASE_URL = PUBLIC_SITE;
    assert.equal(publicSite(), PUBLIC_SITE);
  } finally {
    if (previous === undefined) delete process.env.BASE_URL;
    else process.env.BASE_URL = previous;
  }
});

test('public site policy rejects alternate origins, protocols and paths before navigation', () => {
  const previous = process.env.BASE_URL;
  try {
    for (const value of ['http://douglasqa.netlify.app/', 'https://example.com/', 'https://douglasqa.netlify.app/other',
      'https://douglasqa.netlify.app/?test=1', 'https://user:password@douglasqa.netlify.app/']) {
      process.env.BASE_URL = value;
      assert.throws(publicSite, /exclusivamente/);
    }
  } finally {
    if (previous === undefined) delete process.env.BASE_URL;
    else process.env.BASE_URL = previous;
  }
});
