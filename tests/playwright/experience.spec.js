import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@smoke coleções destacam três projetos e seis certificados, sem perder os demais', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#projects-container .project-row:visible')).toHaveCount(3);
    await expect(page.locator('.certification-card:visible')).toHaveCount(6);
    const projectToggle = page.locator('#projects-more > summary');
    await projectToggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#projects-container .project-row:visible')).toHaveCount(9);
    await page.keyboard.press('Enter');
    await expect(page.locator('#projects-container .project-row:visible')).toHaveCount(3);
    await page.locator('#certificates-more > summary').click();
    await expect(page.locator('.certification-card:visible')).toHaveCount(16);
    await page.locator('#certificates-more > summary').click();
    await expect(page.locator('.certification-card:visible')).toHaveCount(6);
});

test('@smoke conteúdo e links funcionam sem JavaScript em celular e desktop', async ({ browser }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL: testInfo.project.use.baseURL });
    const page = await context.newPage();
    for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        await expect(page.getByRole('navigation', {name: 'Navegação principal'})).toBeVisible();
        await expect(page.locator('.project-row')).toHaveCount(10);
        await expect(page.locator('#projects-container a').first()).toHaveAttribute('href', 'https://github.com/DouglasAntoni0/projeto-completo-k6');
        await expect(page.getByRole('button', {name:'Ver detalhes'})).toHaveCount(0);
        await page.locator('#projects-more > summary').click();
        await expect(page.locator('#projects-container .project-row:visible')).toHaveCount(9);
        await page.locator('#certificates-more > summary').click();
        await expect(page.locator('.certification-card:visible')).toHaveCount(16);
        await expect(page.locator('[data-certificate-pdf]')).toHaveAttribute('href', /maestro.+\.pdf$/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    await context.close();
});

test('estudos de caso preservam origem e deixam a imagem fora do carregamento inicial', async ({page}) => {
    const evidenceRequests = [];
    const detailRequests = [];
    page.on('request', request => { if (request.url().includes('/evidence/')) evidenceRequests.push(request.url()); });
    page.on('request', request => { if (/\/build\/projects-[^/]+\.js$/.test(request.url())) detailRequests.push(request.url()); });
    await page.goto('/');
    expect(evidenceRequests).toEqual([]);
    expect(detailRequests).toEqual([]);
    for (const [id, result] of [['modal-1','Smoke e Load Test'],['modal-3','22 testes aprovados'],['modal-4','7 de 7 arquivos']]) {
        await page.locator(`.trigger-modal[data-project-id="${id}"]`).click();
        const study = page.locator('#project-modal-case');
        await expect(study).toContainText(result);
        await expect(study.getByRole('link',{name:'Ver execução no GitHub'})).toHaveAttribute('href', /\/actions\/runs\/\d+$/);
        await expect(study.getByRole('link',{name:'Consultar teste de origem'})).toHaveAttribute('href', /\/blob\/[a-f0-9]{40}\//);
        await expect.poll(() => study.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
        await page.keyboard.press('Escape');
    }
    expect(detailRequests).toHaveLength(1);
});

test('falha ao carregar detalhes preserva o acesso ao repositório', async ({page}) => {
    await page.route('**/build/projects-*.js', route => route.abort());
    await page.goto('/');
    const trigger = page.locator('.trigger-modal').first();
    await trigger.click();
    const modal = page.locator('#project-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Não foi possível carregar os detalhes');
    await expect(modal.locator('#project-modal-link')).toHaveAttribute('href', 'https://github.com/DouglasAntoni0/projeto-completo-k6');
    await expect(modal.locator('.code-container')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
});

test('Escape cancela a abertura pendente de detalhes em conexão lenta', async ({page}) => {
    let resume;
    const gate = new Promise(resolve => { resume = resolve; });
    await page.route('**/build/projects-*.js', async route => { await gate; await route.continue(); });
    await page.goto('/');
    const trigger = page.locator('.trigger-modal').first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-busy', 'true');
    await page.keyboard.press('Escape');
    resume();
    await expect(trigger).not.toHaveAttribute('aria-busy');
    await expect(page.locator('#project-modal')).toBeHidden();
    await trigger.click();
    await expect(page.locator('#project-modal')).toBeVisible();
});

test('acessibilidade automatizada cobre página, coleções e os dois modais', async ({page}) => {
    test.setTimeout(90_000);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.setViewportSize({width:390,height:844});
    await page.goto('/');
    const audit = async () => {
        const results = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
        expect(results.violations.map(v => ({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
    };
    await audit();
    await page.locator('#projects-more > summary').click();
    await page.locator('#certificates-more > summary').click();
    await audit();
    await page.locator('.trigger-modal').first().click();
    await audit();
    await page.keyboard.press('Escape');
    await page.locator('[data-certificate-pdf]').click();
    await expect(page.locator('#certificate-modal-image')).toBeVisible();
    await audit();
});
