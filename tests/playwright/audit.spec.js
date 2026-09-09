import { expect, test } from '../support/fixtures.js';

// Keep the functional journeys deterministic; motion has its own tests below and in portfolio.spec.js.
test.beforeEach(async ({page}) => { await page.emulateMedia({reducedMotion:'reduce'}); });

test('@smoke todos os certificados carregam sob demanda e Maestro preserva o PDF original', async ({ page, request }) => {
  test.setTimeout(120_000); // Sixteen complete image/document journeys, including WebKit on Windows.
  const certificateRequests = [];
  page.on('request', request => {
    if (request.url().includes('/certificates/')) certificateRequests.push(request.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(certificateRequests).toEqual([]);

  await page.locator('#certificates-more > summary').click();
  const cards = page.locator('.certification-card');
  await expect(cards).toHaveCount(16);
  for (const card of await cards.all()) {
    const title = await card.locator('h3').textContent();
    const trigger = card.getByRole('button', { name: 'Ver certificado' });
    await trigger.click();
    const modal = page.getByRole('dialog', { name: title, exact: true });
    await expect(modal).toBeVisible();
    await expect.poll(() => modal.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    const original = await modal.locator('#certificate-modal-open').getAttribute('href');
    const response = await request.get(original);
    expect(response.ok(), original).toBe(true);
    if (title.startsWith('Maestro:')) {
      await expect(card).toContainText('30/08/2026');
      await expect(card).toContainText('3 horas');
      expect(response.headers()['content-type']).toContain('application/pdf');
      expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
      await expect(modal.getByRole('link', { name: 'Abrir PDF original em nova guia' })).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
});

test('@smoke todos os projetos abrem e os modais isolam o foco do conteúdo de fundo', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  test.setTimeout(120_000); // Ten complete keyboard journeys in each engine.
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#projects-more > summary').click();
  for (const trigger of await page.locator('.trigger-modal').all()) {
    await trigger.click();
    const modal = page.locator('#project-modal');
    await expect(modal, await trigger.getAttribute('data-project-id')).toBeVisible();
    await expect(page.locator('main')).toHaveAttribute('inert', '');
    const close = modal.getByRole('button', { name: 'Fechar detalhes do projeto' });
    const link = modal.getByRole('link', { name: 'Acessar repositório' });
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(link).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await expect(modal.locator('code')).not.toBeEmpty();
    await expect(link).toHaveAttribute('href', /^https:\/\/github\.com\//);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(page.locator('main')).not.toHaveAttribute('inert');
  }
  expect(errors).toEqual([]);
});

test('menu em tela baixa com texto ampliado permite alcançar o último link', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.getByRole('button', { name: 'Abrir menu principal' }).click();
  await expect.poll(() => page.locator('.glass-header').evaluate(header => header.getBoundingClientRect().bottom <= innerHeight)).toBe(true);
  await page.getByRole('navigation').getByRole('link', { name: 'Contato', exact: true }).click();
  await expect(page.getByRole('navigation')).toBeHidden();
  await expect(page).toHaveURL(/#contact$/);
});

test('reduzir movimento durante a sessão interrompe tilt e novas animações de entrada', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    window.__entries = 0;
    Element.prototype.animate = function (...args) {
      window.__entries += 1;
      return animate.apply(this, args);
    };
  });
  await page.goto('/');
  const first = page.locator('.project-row').first();
  await first.hover();
  await expect(first).toHaveClass(/pointer-active/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveClass(/motion-reduced/);
  const entries = await page.evaluate(() => window.__entries);
  const last = page.locator('.project-row').last();
  await last.hover();
  await expect(first).not.toHaveClass(/pointer-active/);
  await expect(last).not.toHaveClass(/pointer-active/);
  expect(await page.evaluate(() => window.__entries)).toBe(entries);
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
});

test('falha no preview mostra alternativa para abrir o documento', async ({ page }) => {
  await page.route('**/certificates/previews/*', route => route.abort());
  await page.goto('/');
  await page.locator('[data-certificate-title="Maestro: Testes Mobile do Zero ao Pipeline"]').click();
  const modal = page.getByRole('dialog', { name: 'Maestro: Testes Mobile do Zero ao Pipeline', exact: true });
  await expect(modal.getByRole('status')).toContainText('Não foi possível carregar');
  await expect(modal.getByRole('link', { name: 'Abrir PDF original em nova guia' })).toBeVisible();
  await expect(modal.locator('img')).toBeHidden();
  await page.keyboard.press('Escape');
  await page.unroute('**/certificates/previews/*');
  await page.locator('.certification-view-btn').first().click();
  await expect(page.locator('#certificate-modal-image')).toBeVisible();
  await expect.poll(() => page.locator('#certificate-modal-image').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator('#certificate-modal-status')).toBeHidden();
});

test('texto de proficiência permanece dentro do cartão em tela estreita', async ({ page }) => {
  await page.setViewportSize({ width: 280, height: 653 });
  await page.goto('/');
  const overflow = await page.locator('.language-levels li').evaluateAll(items => items.map(item => {
    const range = document.createRange();
    range.selectNodeContents(item);
    return range.getBoundingClientRect().right - item.getBoundingClientRect().right;
  }));
  expect(Math.max(...overflow)).toBeLessThanOrEqual(1);
});
