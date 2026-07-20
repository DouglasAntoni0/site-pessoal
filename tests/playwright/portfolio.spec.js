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
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Qualidade que antecipa riscos');
  await expect(page.locator('#projects-container article')).toHaveCount(9);
  await expect(page.locator('#volunteer-container article')).toHaveCount(1);
  await expect(page.locator('#project-modal')).toHaveCount(1);
  await expect(page.locator('#certifications .certification-card')).toHaveCount(14);
  await expect(page.locator('[data-skill-group]')).toHaveCount(6);
  await expect(page.locator('.skill-chip')).toHaveCount(62);
  await expect(page.locator('.skill-chip .skill-icon use')).toHaveCount(62);
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

  const iaCard = page.locator('#certifications .certification-card')
    .filter({ hasText: 'Testando com Inteligência (Artificial)' });
  await expect(iaCard).toContainText('19/07/2026');
  await expect(iaCard).toContainText('6 horas');

  const iaButton = iaCard.getByRole('button', { name: 'Ver certificado' });
  await iaButton.click();
  await expect(modal.locator('#certificate-modal-title')).toHaveText('Testando com Inteligência (Artificial)');
  await expect(modal.locator('#certificate-modal-image'))
    .toHaveAttribute('src', 'assets/certificates/previews/udemy-testando-com-inteligencia-artificial.webp');
  await expect(modal.getByRole('link', { name: /Abrir imagem/ }))
    .toHaveAttribute('href', 'assets/certificates/udemy-testando-com-inteligencia-artificial.png');
});

test('touch recebe entradas pontuais sem tilt ou loops contínuos', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173');

  expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
  expect(await page.evaluate(() => document.getAnimations().some(animation => animation.playState === 'running'))).toBe(true);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);

  const project = page.locator('.project-row').first();
  await project.scrollIntoViewIfNeeded();
  await project.tap({ position: { x: 120, y: 100 } });
  await expect(project).not.toHaveClass(/pointer-active/);
  expect(await project.locator('.project-content').evaluate(element => element.style.transform)).toBe('');
  await expectNoOverflow(page);
  await context.close();
});

test('reduced motion mantém conteúdo e painel QA estáticos', async ({ page }, testInfo) => {
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
  await expect(page.locator('.skill-chip')).toHaveCount(62);
  await expect(page.locator('[data-skill-group]')).toHaveCount(6);
  await expect(page.locator('#certifications')).toContainText('Conversação: básico-intermediária');
});

test('competências têm ícones locais válidos e projetos refletem o currículo', async ({ page }) => {
  await page.goto('/');
  const iconReferences = await page.locator('.skill-chip use').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  expect(iconReferences).toHaveLength(62);
  expect(iconReferences.every(reference => reference?.startsWith('assets/icons/sprite.svg#'))).toBe(true);

  const sprite = await page.evaluate(() => fetch('assets/icons/sprite.svg').then(response => response.text()));
  for (const reference of new Set(iconReferences)) {
    expect(sprite).toContain(`id="${reference.split('#')[1]}"`);
  }

  await page.locator('[data-project-id="modal-3"] .trigger-modal').click();
  const modal = page.locator('#project-modal');
  await expect(modal).toContainText('PostgreSQL');
  await expect(modal).toContainText('Fixtures JSON');
  await expect(modal).toContainText('Screenshots & Traces');
  await page.keyboard.press('Escape');

  await page.locator('[data-project-id="modal-10"] .trigger-modal').click();
  await expect(modal).toContainText('Bug Tracking');
  await expect(modal).toContainText('BDD / Gherkin');
});

test('logos de competências mantêm preenchimento visível no mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const brandIcons = page.locator('.skill-icon--brand');
  await expect(brandIcons.first()).toBeVisible();
  expect(await brandIcons.count()).toBeGreaterThan(30);
  expect(await brandIcons.evaluateAll(icons => icons.every(icon => {
    const style = getComputedStyle(icon);
    const rect = icon.getBoundingClientRect();
    return style.fill !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
  }))).toBe(true);
});

test('desktop executa movimento progressivo e spotlight sem alterar layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await page.goto('/');
  expect(await page.evaluate(() => document.getAnimations().some(animation => animation.playState === 'running'))).toBe(true);

  const project = page.locator('.project-row').first();
  await project.scrollIntoViewIfNeeded();
  await project.hover({ position: { x: 160, y: 120 } });
  await expect(project).toHaveClass(/pointer-active/);
  expect(await project.locator('.project-content').evaluate(element => element.style.transform)).toContain('rotateX');
  await expectNoOverflow(page);
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
