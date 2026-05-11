import { expect, test } from '@playwright/test';

const externalHosts = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com', 'unpkg.com'];

async function blockExternalAssets(page) {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (externalHosts.includes(url.hostname)) {
      return route.abort();
    }
    return route.continue();
  });
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bodyOverflow: document.body.scrollWidth - document.body.clientWidth
  }));

  expect(overflow.documentOverflow, JSON.stringify(overflow)).toBeLessThanOrEqual(1);
  expect(overflow.bodyOverflow, JSON.stringify(overflow)).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource: net::ERR_FAILED')) {
      browserErrors.push(message.text());
    }
  });
  page.browserErrors = browserErrors;
});

test('carrega título, hero e chamadas principais sem depender de CDN', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle('Douglas Antonio | Software Quality Engineer');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Engenharia de Qualidade Escalável');
  await expect(page.getByRole('link', { name: 'Meus Projetos' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contato' }).first()).toBeVisible();
  expect(page.browserErrors).toEqual([]);
});

test('mantém a navegação principal íntegra em todos os breakpoints', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  for (const label of ['Início', 'Visão & Tech', 'Projetos', 'Open Source', 'Contato']) {
    await expect(page.getByRole('link', { name: label }).first()).toBeVisible();
  }
  await expectNoHorizontalOverflow(page);
});

test('ancoras do menu navegam para seções sem esconder conteúdo crítico', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });

  const targets = [
    ['Visão & Tech', 'Shift-Left & Operações'],
    ['Projetos', 'Arsenal de'],
    ['Open Source', 'Voluntariado'],
    ['Contato', 'Engenharia de nível mundial']
  ];

  for (const [linkName, headingText] of targets) {
    await nav.getByRole('link', { name: linkName, exact: true }).click();
    await expect(page.getByText(headingText, { exact: false }).first()).toBeVisible();
  }
});

test('renderiza todos os projetos e separa voluntariado corretamente', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#projects-container article')).toHaveCount(4);
  await expect(page.locator('#volunteer-container article')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ver Detalhes' })).toHaveCount(5);
});

test('abre e fecha modal pelo botão, overlay e tecla Escape', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Ver Detalhes' }).first().click();
  const modal = page.getByRole('dialog', { name: 'Automação de Performance com K6' });
  await expect(modal).toBeVisible();
  await expect(modal.getByText('K6 (JavaScript)')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();

  await page.getByRole('button', { name: 'Ver Detalhes' }).nth(1).click();
  await expect(page.getByRole('dialog', { name: 'Web Testing E2E com Cypress' })).toBeVisible();
  await page.locator('#modal-overlay').click({ position: { x: 5, y: 5 } });
  await expect(page.getByRole('dialog', { name: 'Web Testing E2E com Cypress' })).toBeHidden();
});

test('todos os modais possuem conteúdo, badges e link externo seguro', async ({ page }) => {
  test.setTimeout(60_000);
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const buttons = page.getByRole('button', { name: 'Ver Detalhes' });
  const count = await buttons.count();
  expect(count).toBe(5);

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    await button.scrollIntoViewIfNeeded();
    await button.click();
    const modal = page.locator('.glass-modal.active');
    await expect.poll(async () => modal.isVisible()).toBe(true);
    await expect(modal.locator('.modal-badge').first()).toBeVisible();
    const repo = modal.getByRole('link', { name: 'Acessar Repositório' });
    await expect(repo).toHaveAttribute('target', '_blank');
    await expect(repo).toHaveAttribute('rel', /noopener/);
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  }
});

test('cards de contato têm destinos corretos e seguros', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const expectedLinks = [
    ['WhatsApp', /wa\.me\/5533991073110/],
    ['LinkedIn', /linkedin\.com\/in\/douglas-antonio-qa/],
    ['GitHub', /github\.com\/DouglasAntoni0/]
  ];

  for (const [name, href] of expectedLinks) {
    const link = page.getByRole('link', { name: new RegExp(name) });
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAttribute('rel', /noopener/);
  }
});

test('layout mobile 390px não cria rolagem horizontal e mostra CTAs', async ({ page }) => {
  await blockExternalAssets(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Meus Projetos' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contato' }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('layout mobile estreito 320px mantém header e cards dentro da tela', async ({ page }) => {
  await blockExternalAssets(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('link', { name: 'Open Source' })).toBeVisible();
  await expect(page.locator('#projects-container article').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('layout tablet mantém projetos empilhados sem cortar visual', async ({ page }) => {
  await blockExternalAssets(page);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Projetos', exact: true }).click();
  await expect(page.locator('#projects-container article').first()).toBeVisible();
  await expect(page.locator('.project-visual').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('modo reduced motion mantém conteúdo visível e funcional', async ({ page }) => {
  await blockExternalAssets(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Ver Detalhes' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Automação de Performance com K6' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('foco de teclado entra no modal e retorna ao gatilho ao fechar', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Fluxo de teclado validado no desktop; tablet e mobile cobrem interação touch.');
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const firstTrigger = page.getByRole('button', { name: 'Ver Detalhes' }).first();
  await firstTrigger.scrollIntoViewIfNeeded();
  await firstTrigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Automação de Performance com K6' })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.activeElement?.classList.contains('close-modal'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(firstTrigger).toBeFocused();
});
