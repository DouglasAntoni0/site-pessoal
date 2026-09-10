import { test, expect } from '../support/fixtures.js';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const noOverflow = async page => expect(await page.evaluate(() =>
  Math.max(document.documentElement.scrollWidth - innerWidth, document.body.scrollWidth - innerWidth))).toBeLessThanOrEqual(1);
test.beforeEach(async ({ page }) => page.emulateMedia({ reducedMotion: 'reduce' }));

test('REG-01 currículo baixado corresponde integralmente ao PDF versionado', async ({ page, request }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Baixar currículo', exact: true });
  const response = await request.get(await link.getAttribute('href'));
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  const expected = await fs.readFile('assets/Douglas_Antonio_QA_Engineer.pdf');
  expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  expect(sha(await response.body())).toBe(sha(expected));
  const downloading = page.waitForEvent('download');
  await link.click();
  const download = await downloading;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  expect(sha(await fs.readFile(await download.path()))).toBe(sha(expected));
});

test('REG-02 âncoras, IDs, contatos e metadados não têm destinos vazios ou ambíguos', async ({ page }) => {
  await page.goto('/');
  const invalid = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    const errors = ids.filter((id, index) => ids.indexOf(id) !== index).map(id => 'duplicate:' + id);
    for (const a of document.querySelectorAll('a[href]')) {
      if (a.closest('.glass-modal')) continue; // Populated on opening; modal journeys check their actual links.
      const href = a.getAttribute('href');
      if (href.startsWith('#') && !document.getElementById(href.slice(1))) errors.push(href);
      if (!href || /^(javascript|data):/i.test(href)) errors.push(href);
      if (a.target === '_blank' && !a.rel.split(' ').includes('noopener')) errors.push('unsafe:' + href);
    }
    return errors;
  });
  expect(invalid).toEqual([]);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://douglasqa.netlify.app/');
  expect((await page.locator('meta[name="description"]').getAttribute('content')).length).toBeGreaterThan(40);
  const contacts = await page.locator('.contact-link').evaluateAll(links => links.map(a => a.href));
  expect(contacts.some(href => href.startsWith('https://wa.me/'))).toBe(true);
  expect(contacts.some(href => href.includes('linkedin.com'))).toBe(true);
  expect(contacts.some(href => href.includes('github.com'))).toBe(true);
});

test('REG-03 resposta pública aplica segurança e cache dos arquivos com hash', async ({ page, request }) => {
  const response = await page.goto('/');
  const headers = response.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['content-security-policy']).toContain("object-src 'none'");
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['cache-control']).toContain('must-revalidate');
  const script = await page.locator('script[type="module"][src]').getAttribute('src');
  const asset = await request.get(script);
  expect(asset.status()).toBe(200);
  expect(asset.headers()['cache-control']).toContain('immutable');
  const missing = await request.get('/qa-missing-resource-8ab733.js');
  expect(missing.status()).toBe(404);
});

test('REG-04 teclado alcança o conteúdo pelo link de salto', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  const target = await skip.getAttribute('href');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(target + '$'));
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('main')))).toBe(true);
});

test('REG-05 menu mantém estado correto ao atravessar o breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto('/');
  const toggle = page.locator('#menu-toggle');
  const nav = page.locator('#primary-nav');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(nav).toBeVisible();
  await expect(nav.locator('a').first()).toBeFocused();
  await page.setViewportSize({ width: 961, height: 900 });
  await expect(toggle).toBeHidden();
  await expect(nav).toBeVisible();
  // CSS visibility changes before the matchMedia listener resets the menu.
  // Verify that reset before requesting the next viewport transition.
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await toggle.click();
  await expect(nav).toBeHidden();
  await noOverflow(page);
});

for (const [name, triggerSelector, modalSelector] of [
  ['projeto', '.trigger-modal', '#project-modal'],
  ['certificado', '.certification-view-btn', '#certificate-viewer-modal']
]) {
  test('REG-06 ' + name + ' abre por Espaço e fecha por botão e fundo', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator(triggerSelector).first();
    const modal = page.locator(modalSelector);
    for (const method of ['button', 'backdrop']) {
      await trigger.focus();
      await page.keyboard.press('Space');
      await expect(modal).toBeVisible();
      await expect(page.locator('body')).toHaveClass(/modal-open/);
      if (method === 'button') await modal.locator('.close-modal').click();
      else await page.locator('#modal-overlay').click({ position: { x: 2, y: 2 } });
      await expect(modal).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(page.locator('body')).not.toHaveClass(/modal-open/);
      await expect(page.locator('main')).not.toHaveAttribute('inert');
    }
  });
}

test('REG-07 duas aberturas concorrentes exibem somente o último projeto', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/build/projects-*.js', async route => { await gate; await route.continue(); });
  await page.goto('/');
  const triggers = page.locator('#projects-container .trigger-modal:visible');
  const expectedTitle = await triggers.nth(1).locator('xpath=ancestor::article').locator('h3').textContent();
  await triggers.nth(0).click();
  await expect(triggers.nth(0)).toHaveAttribute('aria-busy', 'true');
  await triggers.nth(1).click();
  release();
  await expect(page.locator('#project-modal-title')).toHaveText(expectedTitle);
  await expect(page.locator('.glass-modal.active')).toHaveCount(1);
  await expect(triggers.nth(0)).not.toHaveAttribute('aria-busy');
  await expect(triggers.nth(1)).not.toHaveAttribute('aria-busy');
  await page.keyboard.press('Escape');
  await expect(triggers.nth(1)).toBeFocused();
});

test('REG-08 certificado cancela projeto pendente sem ser substituído', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/build/projects-*.js', async route => { await gate; await route.continue(); });
  await page.goto('/');
  const project = page.locator('.trigger-modal').first();
  await project.click();
  await expect(project).toHaveAttribute('aria-busy', 'true');
  await page.locator('.certification-view-btn').first().click();
  release();
  await expect(project).not.toHaveAttribute('aria-busy');
  await expect(page.locator('#certificate-viewer-modal')).toBeVisible();
  await expect(page.locator('#project-modal')).toBeHidden();
});

test('REG-09 perda de conexão mantém fallback e recarregamento recupera detalhes', async ({ page, context }) => {
  await page.goto('/');
  await context.setOffline(true);
  await page.locator('.trigger-modal').first().click();
  await expect(page.locator('#project-modal')).toContainText('Não foi possível carregar os detalhes');
  await expect(page.locator('#project-modal-link')).toHaveAttribute('href', /^https:\/\/github.com\//);
  await page.keyboard.press('Escape');
  await context.setOffline(false);
  await page.reload();
  await page.locator('.trigger-modal').first().click();
  await expect(page.locator('#project-modal code')).not.toBeEmpty();
  await expect(page.locator('#project-modal .code-container')).toBeVisible();
});

test('REG-10 preview lento anuncia carregamento e exibe a imagem real ao concluir', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/certificates/previews/*', async route => { await gate; await route.continue(); });
  await page.goto('/');
  await page.locator('.certification-view-btn').first().click();
  await expect(page.locator('#certificate-modal-status')).toContainText('Carregando');
  await expect(page.locator('#certificate-modal-image')).toBeHidden();
  release();
  await expect(page.locator('#certificate-modal-status')).toBeHidden();
  await expect.poll(() => page.locator('#certificate-modal-image').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
});

test('REG-11 fontes indisponíveis mantêm conteúdo, ícones e navegação legíveis', async ({ page }) => {
  await page.route('**/*.woff2', route => route.abort());
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.skill-chip svg')).toHaveCount(62);
  await page.locator('#menu-toggle').click();
  await page.locator('#primary-nav a[href="#vision"]').click();
  await expect(page).toHaveURL(/#vision$/);
  await noOverflow(page);
});

test('REG-12 APIs opcionais ausentes preservam as funções essenciais', async ({ page }) => {
  await page.addInitScript(() => {
    delete window.IntersectionObserver;
    delete window.ResizeObserver;
    Element.prototype.animate = undefined;
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await page.locator('.trigger-modal').first().click();
  await expect(page.locator('#project-modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#menu-toggle').click();
  await expect(page.locator('#primary-nav')).toBeVisible();
  expect(errors).toEqual([]);
});

test('REG-13 economia de dados mantém contadores finais e suspende animações', async ({ page }) => {
  await page.addInitScript(() => {
    const connection = new EventTarget();
    connection.saveData = true;
    Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/motion-reduced/);
  expect(await page.locator('[data-counter]').allTextContents()).toEqual(['10', '4', '62']);
  expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
  await page.evaluate(() => { navigator.connection.saveData = false; navigator.connection.dispatchEvent(new Event('change')); });
  await expect(page.locator('html')).not.toHaveClass(/motion-reduced/);
  await page.locator('.trigger-modal').first().click();
  await expect(page.locator('#project-modal')).toBeVisible();
});

test('REG-14 histórico e reload preservam conteúdo e links internos', async ({ page }) => {
  await page.goto('/');
  await page.locator('#primary-nav a[href="#vision"]').click();
  await expect(page).toHaveURL(/#vision$/);
  await page.locator('#primary-nav a[href="#contact"]').click();
  await page.goBack();
  await expect(page).toHaveURL(/#vision$/);
  await page.goForward();
  await expect(page).toHaveURL(/#contact$/);
  await page.reload();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator('.contact-link')).toHaveCount(3);
  await page.locator('.trigger-modal').first().click();
  await expect(page.locator('#project-modal')).toBeVisible();
});

test('REG-15 vinte ciclos de interação não duplicam modais nem acumulam conteúdo', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  const chunks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/\/build\/projects-.*\.js$/.test(request.url())) chunks.push(request.url()); });
  await page.goto('/');
  const counts = [];
  for (let cycle = 0; cycle < 20; cycle++) {
    await page.locator('.trigger-modal').first().click();
    await expect(page.locator('.glass-modal.active')).toHaveCount(1);
    counts.push(await page.locator('*').count());
    await page.locator('#project-modal .close-modal').click();
    await page.locator('.certification-view-btn').first().click();
    await expect(page.locator('.glass-modal.active')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('main')).not.toHaveAttribute('inert');
  }
  expect(new Set(counts).size).toBe(1);
  expect(chunks).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('REG-16 acessibilidade inclui menu aberto e estado de falha do certificado', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/certificates/previews/*', route => route.abort());
  await page.goto('/');
  const audit = async () => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  };
  await page.locator('#menu-toggle').click();
  await audit();
  await page.keyboard.press('Escape');
  await page.locator('.certification-view-btn').first().click();
  await expect(page.locator('#certificate-modal-status')).toContainText('Não foi possível');
  await audit();
});
