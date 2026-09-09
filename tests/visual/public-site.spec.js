import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
});

test('hero', async ({ page }) => {
  await expect(page).toHaveScreenshot('hero.png');
});

test('skills', async ({ page }) => {
  const section = page.locator('#vision');
  await section.scrollIntoViewIfNeeded();
  // Component capture: fixed page chrome would otherwise cross the enlarged screenshot.
  // The header itself is compared separately in the navigation and viewport cases.
  await expect(section).toHaveScreenshot('skills.png', { style: '.glass-header, .skip-link { visibility: hidden !important; }' });
});

test('project-modal', async ({ page }) => {
  await page.locator('.trigger-modal').first().click();
  await expect.poll(() => page.locator('#project-modal-case img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page).toHaveScreenshot('project-modal.png');
});

test('certificate-modal', async ({ page }) => {
  await page.locator('.certification-view-btn').first().click();
  await expect.poll(() => page.locator('#certificate-modal-image').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page).toHaveScreenshot('certificate-modal.png');
});

test('certificates-expanded', async ({ page }) => {
  await page.locator('#certificates-more > summary').click();
  await expect(page.locator('#certifications')).toHaveScreenshot('certificates-expanded.png',
    { style: '.glass-header, .skip-link { visibility: hidden !important; }' });
});

test('navigation', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile') await page.locator('#menu-toggle').click();
  await expect(page.locator('.glass-header')).toHaveScreenshot('navigation.png');
});
