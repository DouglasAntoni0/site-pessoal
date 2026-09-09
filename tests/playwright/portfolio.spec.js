import { expect, test } from '../support/fixtures.js';

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

test('@smoke carrega a experiência sem recursos externos inesperados ou erros', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  const thirdParty = [];
  page.on('request', request => {
    const url = new URL(request.url());
    const site = new URL(test.info().project.use.baseURL);
    const rum = site.origin === 'https://douglasqa.netlify.app' && (
      (url.origin === 'https://netlify-rum.netlify.app' && request.resourceType() === 'script')
      || (url.href === 'https://ingesteer.services-prod.nsvcs.net/rum_collection' && ['POST', 'OPTIONS'].includes(request.method())));
    if (url.origin !== site.origin && !rum) thirdParty.push(url.href);
  });

  await page.goto('/', { waitUntil: 'networkidle' });

  await expect(page).toHaveTitle('Douglas Antonio | Software Quality Engineer');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Qualidade que antecipa riscos');
  await expect(page.locator('#projects-container article')).toHaveCount(9);
  await expect(page.locator('#volunteer-container article')).toHaveCount(1);
  await expect(page.locator('#project-modal')).toHaveCount(1);
  await expect(page.locator('#certifications .certification-card')).toHaveCount(16);
  await expect(page.locator('[data-skill-group]')).toHaveCount(6);
  await expect(page.locator('.skill-chip')).toHaveCount(62);
  await expect(page.locator('.skill-chip .skill-icon')).toHaveCount(62);
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
  test.setTimeout(120_000);
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectHeroSafe(page);
    await expectNoOverflow(page);
  }
});

test('rotação sem reload mantém a mesma estratégia e o DOM íntegro', async ({ page }, testInfo) => {
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

  await page.locator('#certificates-more > summary').click();
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

  await page.keyboard.press('Escape');
  const backendCard = page.locator('#certifications .certification-card')
    .filter({ hasText: 'Playwright Além da Interface' });
  await expect(backendCard).toContainText('15/08/2026');
  await expect(backendCard).toContainText('6.5 horas');

  await backendCard.getByRole('button', { name: 'Ver certificado' }).click();
  await expect(modal.locator('#certificate-modal-title')).toHaveText('Playwright Além da Interface');
  await expect(modal.locator('#certificate-modal-image'))
    .toHaveAttribute('src', 'assets/certificates/previews/udemy-playwright-alem-da-interface.webp');
  await expect(modal.getByRole('link', { name: /Abrir imagem/ }))
    .toHaveAttribute('href', 'assets/certificates/udemy-playwright-alem-da-interface.png');
});

test('touch recebe entradas pontuais sem tilt ou loops contínuos', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, ...(testInfo.project.name !== 'firefox' ? { isMobile: true } : {}) });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const nativeAnimate = Element.prototype.animate;
    window.__qaAnimationCalls = [];
    Element.prototype.animate = function animate(keyframes, options) {
      window.__qaAnimationCalls.push({
        duration: typeof options === 'object' ? options.duration : options,
        iterations: typeof options === 'object' ? (options.iterations ?? 1) : 1
      });
      return nativeAnimate.call(this, keyframes, options);
    };
  });
  await page.goto(testInfo.project.use.baseURL);

  expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
  expect(await page.locator('[data-counter]').allTextContents()).toEqual(['10', '4', '62']);
  const entryAnimations = await page.evaluate(() => window.__qaAnimationCalls);
  expect(entryAnimations.length).toBeGreaterThan(0);
  expect(entryAnimations.every(animation => animation.iterations === 1)).toBe(true);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);

  const project = page.locator('.project-row').first();
  await project.scrollIntoViewIfNeeded();
  await project.tap({ position: { x: 120, y: 100 } });
  await expect(project).not.toHaveClass(/pointer-active/);
  expect(await project.locator('.project-visual').evaluate(element => element.style.transform)).toBe('');
  await expectNoOverflow(page);
  await context.close();
});

test('reduced motion mantém conteúdo e painel QA estáticos', async ({ page }, testInfo) => {
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
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir menu principal' })).toBeVisible();
  await expectNoOverflow(page);
  const clippedText = await page.locator('.hero-proof span, .skill-group-header > div, .lifecycle-step small').evaluateAll(elements =>
    elements.filter(element => element.getBoundingClientRect().right > element.parentElement.getBoundingClientRect().right + 1).map(element => element.textContent));
  expect(clippedText).toEqual([]);
});

test('projetos aparecem após a apresentação e preservam os contatos', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('section[id]').evaluateAll(sections => sections.map(section => section.id)))
    .toEqual(['hero', 'projects', 'vision', 'quality', 'certifications', 'volunteer', 'contact']);
  await expect(page.getByRole('link', { name: 'Currículo' })).toHaveAttribute('href', 'assets/Douglas_Antonio_QA_Engineer.pdf');
  await expect(page.locator('.contact-link')).toHaveCount(3);
  await expect(page.locator('.skill-chip')).toHaveCount(62);
  await expect(page.locator('[data-skill-group]')).toHaveCount(6);
  await expect(page.locator('#certifications')).toContainText('Conversação: básico-intermediária');
});

test('competências têm ícones locais válidos e projetos refletem o currículo', async ({ page }) => {
  await page.goto('/');
  const icons = page.locator('.skill-chip .skill-icon');
  await expect(icons).toHaveCount(62);
  await expect(icons.locator('use, image')).toHaveCount(0);
  expect(await icons.evaluateAll(nodes => nodes.every(svg => {
    const bounds = svg.getBBox();
    return bounds.width > 0 && bounds.height > 0;
  }))).toBe(true);

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

test('desktop executa movimento progressivo e spotlight sem alterar layout', async ({ page }, testInfo) => {
  await page.goto('/');
  expect(await page.evaluate(() => document.getAnimations().some(animation => animation.playState === 'running'))).toBe(true);

  const project = page.locator('.project-row').first();
  await project.scrollIntoViewIfNeeded();
  await project.hover({ position: { x: 160, y: 120 } });
  await expect(project).toHaveClass(/pointer-active/);
  expect(await project.locator('.project-visual').evaluate(element => element.style.transform)).toContain('rotateX');
  expect(await project.locator('.project-content').evaluate(element => element.style.transform)).toBe('');
  await expectNoOverflow(page);
  await project.getByRole('button', { name: 'Ver detalhes' }).click();
  await expect(page.getByRole('dialog', { name: 'Automação de Performance com K6' })).toBeVisible();
});

