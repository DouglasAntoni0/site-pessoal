import { expect, test } from '@playwright/test';

const viewports = [
  [280, 653],
  [320, 568],
  [360, 640],
  [390, 844],
  [430, 932],
  [667, 375],
  [768, 1024],
  [1024, 768],
  [1366, 768],
  [1440, 900],
  [1920, 1080]
];

function collectRuntimeErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function expectNoOverflow(page) {
  const metrics = await page.evaluate(() => ({
    html: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth
  }));
  expect(metrics.html, JSON.stringify(metrics)).toBeLessThanOrEqual(1);
  expect(metrics.body, JSON.stringify(metrics)).toBeLessThanOrEqual(1);
}

async function expectHeroSafe(page) {
  const metrics = await page.evaluate(() => {
    const header = document.querySelector('.glass-header').getBoundingClientRect();
    const title = document.querySelector('.hero-title').getBoundingClientRect();
    return {
      headerBottom: header.bottom,
      titleTop: title.top,
      titleBottom: title.bottom,
      viewportHeight: innerHeight,
      opacity: Number.parseFloat(getComputedStyle(document.querySelector('.hero-title')).opacity)
    };
  });
  expect(metrics.titleTop, JSON.stringify(metrics)).toBeGreaterThanOrEqual(metrics.headerBottom);
  expect(metrics.titleBottom, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewportHeight);
  expect(metrics.opacity, JSON.stringify(metrics)).toBeGreaterThanOrEqual(0.75);
}

test('@smoke carrega a experiência publicada sem terceiros ou erros', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  const thirdParty = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== 'http://127.0.0.1:4173') thirdParty.push(url.href);
  });

  await page.goto('/', { waitUntil: 'networkidle' });

  await expect(page).toHaveTitle('Douglas Antonio | Software Quality Engineer');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Engenharia de Qualidade Escalável');
  await expect(page.locator('#projects-container article')).toHaveCount(9);
  await expect(page.locator('#volunteer-container article')).toHaveCount(1);
  await expect(page.locator('#project-modal')).toHaveCount(1);
  await expect(page.locator('#certifications .certification-card')).toHaveCount(13);
  expect(await page.locator('*').count()).toBeLessThanOrEqual(900);
  expect(thirdParty).toEqual([]);
  expect(errors).toEqual([]);
});

test('@smoke modal compartilhado é seguro e acessível por teclado', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Ver Detalhes' }).first();
  await trigger.focus();
  await page.keyboard.press('Enter');

  const modal = page.getByRole('dialog', { name: 'Automação de Performance com K6' });
  await expect(modal).toBeVisible();
  await expect(modal.getByText('K6 (JavaScript)')).toBeVisible();
  await expect(modal.getByRole('link', { name: 'Acessar Repositório' })).toHaveAttribute('href', /^https:\/\//);
  await expect(modal.getByRole('link', { name: 'Acessar Repositório' })).toHaveAttribute('rel', /noopener/);
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('#project-modal')))).toBe(true);

  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('responsividade extrema preserva título e elimina overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectHeroSafe(page);
    await expectNoOverflow(page);
  }
});

test('rotação sem reload mantém a mesma estratégia e o DOM íntegro', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const nodeCount = await page.locator('*').count();
  await expect(page.locator('#primary-nav')).toBeHidden();

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#primary-nav')).toBeHidden();
  expect(await page.locator('*').count()).toBe(nodeCount);
  await expectHeroSafe(page);
  await expectNoOverflow(page);
});

test('menu móvel abre e fecha por link, clique externo e Escape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Abrir menu principal' });
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
  await expect(toggle).toBeFocused();

  await toggle.click();
  await nav.getByRole('link', { name: 'Projetos', exact: true }).click();
  await expect(nav).toBeHidden();

  await toggle.click();
  await page.locator('main').click({ position: { x: 2, y: 2 } });
  await expect(nav).toBeHidden();
});

test('certificados usam WebP sob demanda e preservam PNG original', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('#certifications .certification-view-btn').first();
  await button.scrollIntoViewIfNeeded();
  await button.click();

  const modal = page.locator('#certificate-viewer-modal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('#certificate-modal-image')).toHaveAttribute('src', /previews\/.+\.webp$/);
  await expect(modal.getByRole('link', { name: /Abrir imagem/ })).toHaveAttribute('href', /\.png$/);
  await expect(modal.locator('#certificate-modal-image')).toHaveAttribute('decoding', 'async');
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
});

test('reduced motion e touch mantêm todo o conteúdo estático', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const state = await page.evaluate(() => ({
    titleOpacity: getComputedStyle(document.querySelector('.hero-title')).opacity,
    auroraDisplay: getComputedStyle(document.querySelector('.aurora-wrapper')).display,
    animations: document.getAnimations().filter(animation => animation.playState === 'running').length,
    smooth: getComputedStyle(document.documentElement).scrollBehavior
  }));
  expect(state.titleOpacity).toBe('1');
  expect(state.auroraDisplay).toBe('none');
  expect(state.animations).toBe(0);
  expect(state.smooth).toBe('auto');
  await expectNoOverflow(page);
});

test('texto a 200% continua navegável sem overflow horizontal', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir menu principal' })).toBeVisible();
  await expectNoOverflow(page);
});

test('ordem pública das seções, links e contatos é preservada', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('section[id]').evaluateAll(sections => sections.map(section => section.id)))
    .toEqual(['hero', 'vision', 'quality', 'certifications', 'projects', 'volunteer', 'contact']);
  await expect(page.getByRole('link', { name: 'Currículo' })).toHaveAttribute('href', 'assets/Douglas_Antonio_QA_Engineer.pdf');
  await expect(page.locator('.contact-link')).toHaveCount(3);
  await expect(page.locator('.tech-tag')).toHaveCount(32);
});

test('snapshot visual determinístico em desktop e mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.screenshot({
      path: testInfo.outputPath(`${name}.png`),
      animations: 'disabled',
      caret: 'hide',
      fullPage: true
    });
  }
});
