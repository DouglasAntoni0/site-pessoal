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

async function expectHeroBelowHeader(page) {
  const geometry = await page.evaluate(() => {
    const header = document.querySelector('.glass-header')?.getBoundingClientRect();
    const title = document.querySelector('.hero-title')?.getBoundingClientRect();
    return {
      headerBottom: header?.bottom ?? 0,
      titleTop: title?.top ?? 0,
      titleBottom: title?.bottom ?? 0,
      viewportHeight: window.innerHeight
    };
  });

  expect(geometry.titleTop, JSON.stringify(geometry)).toBeGreaterThanOrEqual(geometry.headerBottom + 8);
  expect(geometry.titleBottom, JSON.stringify(geometry)).toBeLessThan(geometry.viewportHeight);
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

  for (const label of ['Início', 'Visão & Tech', 'Atuação', 'Certificações', 'Projetos', 'Open Source', 'Contato']) {
    await expect(page.getByRole('link', { name: label }).first()).toBeVisible();
  }
  await expectNoHorizontalOverflow(page);
});

test('ancoras do menu navegam para seções sem esconder conteúdo crítico', async ({ page }) => {
  test.setTimeout(45_000);
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });

  const targets = [
    ['Visão & Tech', 'Shift-Left & Operações'],
    ['Atuação', 'Da estratégia de teste'],
    ['Certificações', 'Certificações que sustentam'],
    ['Projetos', 'Arsenal de'],
    ['Open Source', 'Voluntariado'],
    ['Contato', 'Engenharia de nível mundial']
  ];

  for (const [linkName, headingText] of targets) {
    await nav.getByRole('link', { name: linkName, exact: true }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText(headingText, { exact: false }).first()).toBeVisible({ timeout: 8_000 });
  }
});

test('seção de atuação e currículo ficam disponíveis', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /Da estratégia de teste/ })).toBeVisible();
  await expect(page.getByText('Shift-left e Test Strategy')).toBeVisible();
  const resume = page.getByRole('link', { name: 'Currículo' });
  await expect(resume).toHaveAttribute('href', 'assets/Douglas_Antonio_QA_Engineer.pdf');
  await expect(resume).toHaveAttribute('download', '');
});


test('seção de certificações renderiza cards e CTA seguro do LinkedIn', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const section = page.locator('#certifications');
  await expect(section.getByRole('heading', { name: /Certificações que sustentam/ })).toBeVisible();
  await expect(section.locator('.certification-card')).toHaveCount(13);
  await expect(section.locator('.certification-view-btn')).toHaveCount(13);
  await expect(section.getByText('Profissão: Engenheiro de Qualidade de Software')).toBeVisible();
  await expect(section.getByText('Playwright Zombie Edition')).toBeVisible();
  await expect(section.getByText('Segurança em Tecnologia da Informação')).toBeVisible();
  await expect(section.getByText('Projetos de Sistemas de TI')).toBeVisible();
  const linkedin = section.getByRole('link', { name: /Ver certificações no LinkedIn/ });
  await expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/douglas-antonio-qa/details/certifications/');
  await expect(linkedin).toHaveAttribute('target', '_blank');
  await expect(linkedin).toHaveAttribute('rel', /noopener/);

  await section.locator('.certification-view-btn').first().click();
  const certificateModal = page.locator('#certificate-viewer-modal');
  await expect(certificateModal).toBeVisible();
  await expect(certificateModal.getByRole('heading', { name: 'Profissão: Engenheiro de Qualidade de Software' })).toBeVisible();
  await expect(certificateModal.locator('#certificate-modal-image')).toHaveAttribute('src', /assets\/certificates\/ebac-engenheiro-qualidade-software\.png/);
  await expect(certificateModal.getByRole('link', { name: /Abrir imagem/ })).toHaveAttribute('href', /assets\/certificates\/ebac-engenheiro-qualidade-software\.png/);
  await page.keyboard.press('Escape');
  await expect(certificateModal).toBeHidden();
  await expectNoHorizontalOverflow(page);
});
test('renderiza todos os projetos e separa voluntariado corretamente', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#projects-container article')).toHaveCount(6);
  await expect(page.locator('#volunteer-container article')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ver Detalhes' })).toHaveCount(7);
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
  test.setTimeout(90_000);
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const buttons = page.getByRole('button', { name: 'Ver Detalhes' });
  const count = await buttons.count();
  expect(count).toBe(7);

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    await button.scrollIntoViewIfNeeded();
    await button.click({ force: true });
    const modal = page.locator('.glass-modal.active');
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await expect(modal.locator('.modal-badge').first()).toBeVisible({ timeout: 5_000 });
    const repo = modal.getByRole('link', { name: 'Acessar Repositório' });
    await expect(repo).toHaveAttribute('target', '_blank');
    await expect(repo).toHaveAttribute('rel', /noopener/);
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 5_000 });
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
    const link = page.locator('#contact').getByRole('link', { name: new RegExp(name) });
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

test('hero mobile não fica tampado por header em alturas comuns de navegador', async ({ page }) => {
  await blockExternalAssets(page);

  for (const size of [
    { width: 320, height: 560 },
    { width: 360, height: 640 },
    { width: 390, height: 700 },
    { width: 430, height: 760 }
  ]) {
    await page.setViewportSize(size);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectHeroBelowHeader(page);
    await expectNoHorizontalOverflow(page);
  }
});

test('layout mobile estreito 320px mantém header e cards dentro da tela', async ({ page }) => {
  await blockExternalAssets(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('link', { name: 'Open Source' })).toBeVisible();
  await expect(page.locator('#projects-container article').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('todos os modais mobile exibem snippet de código e botão do repositório', async ({ page }) => {
  test.setTimeout(60_000);
  await blockExternalAssets(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const buttons = page.getByRole('button', { name: 'Ver Detalhes' });
  const count = await buttons.count();
  expect(count).toBe(7);

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    await button.scrollIntoViewIfNeeded();
    await button.click({ force: true });

    const modal = page.locator('.glass-modal.active');
    await expect.poll(async () => modal.isVisible()).toBe(true);
    const code = modal.locator('.code-container');
    await expect(code).toBeVisible();
    await expect(code.locator('code')).not.toBeEmpty();

    const box = await code.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(160);
    await expect(modal.getByRole('link', { name: 'Acessar Repositório' })).toBeVisible();
    await modal.locator('.close-modal').click();
    await expect(modal).toBeHidden();
  }
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

test('todas as 32 tech-tags possuem um ícone visível', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const tags = page.locator('.tech-tag');
  const count = await tags.count();
  expect(count).toBe(32);

  for (let i = 0; i < count; i++) {
    const icon = tags.nth(i).locator('i');
    await expect(icon).toHaveCount(1);
  }
});

test('meta viewport está presente para responsividade', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const viewport = page.locator('meta[name="viewport"]');
  await expect(viewport).toHaveAttribute('content', /width=device-width/);
});

test('footer está visível ao final da página', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();
  await expect(footer).toContainText('Douglas Antonio');
});

test('seções aparecem na ordem correta na página', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const sectionIds = await page.evaluate(() => {
    const sections = document.querySelectorAll('section[id]');
    return [...sections].map(s => s.id);
  });

  expect(sectionIds).toEqual(['hero', 'vision', 'quality', 'certifications', 'projects', 'volunteer', 'contact']);
});

test('quality strip exibe as 3 métricas sem overflow', async ({ page }) => {
  await blockExternalAssets(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const strip = page.locator('.quality-strip');
  await strip.scrollIntoViewIfNeeded();
  const cells = strip.locator('> div');
  await expect(cells).toHaveCount(3);
  for (const text of ['CI/CD', 'API + Dados', 'Web + Mobile']) {
    await expect(strip.getByText(text)).toBeVisible();
  }
  await expectNoHorizontalOverflow(page);
});
