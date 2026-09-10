import { test, expect } from '../support/fixtures.js';

const currentLink = page => page.locator('#primary-nav a[aria-current="location"]');
async function expectCurrent(page, id) {
    await expect(currentLink(page)).toHaveCount(1);
    await expect(currentLink(page)).toHaveAttribute('href', `#${id}`);
}

test('seção atual acompanha rolagem nos dois sentidos e coleções expandidas', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expectCurrent(page, 'hero');
    for (const id of ['projects', 'vision', 'quality', 'certifications', 'volunteer', 'contact', 'vision']) {
        await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ block: 'start' }));
        await expectCurrent(page, id);
    }
    await page.locator('#projects-more > summary').click();
    await page.locator('#vision').evaluate(el => el.scrollIntoView({ block: 'start' }));
    await expectCurrent(page, 'vision');
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expectCurrent(page, 'contact');
    await page.evaluate(() => scrollTo(0, 0));
    await expectCurrent(page, 'hero');
});

test('navegação ativa preserva âncora, histórico e mudança para menu móvel', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#vision');
    await expectCurrent(page, 'vision');
    await page.locator('#primary-nav a[href="#contact"]').click();
    await expectCurrent(page, 'contact');
    await page.goBack();
    await expectCurrent(page, 'vision');
    await page.reload();
    await expectCurrent(page, 'vision');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#vision').evaluate(el => el.scrollIntoView({ block: 'start' }));
    await page.locator('#menu-toggle').click();
    await expectCurrent(page, 'vision');
    await expect(currentLink(page)).toBeVisible();
    expect(await currentLink(page).evaluate(el => getComputedStyle(el).boxShadow)).not.toBe('none');
    await page.locator('#primary-nav a[href="#quality"]').click();
    await expect(page.locator('#primary-nav')).toBeHidden();
    await expectCurrent(page, 'quality');
});

test('pressionamento tem resposta visual e respeita movimento reduzido', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const reduced of [false, true]) {
        await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
        await page.goto('/');
        const button = page.locator('#menu-toggle');
        await button.hover();
        await page.mouse.down();
        await expect.poll(() => button.evaluate(el => getComputedStyle(el).transform))
            .toBe(reduced ? 'none' : 'matrix(0.98, 0, 0, 0.98, 0, 0)');
        await expect(button).toHaveCSS('border-top-color', 'rgb(165, 243, 252)');
        // Release away from the control to test cancellation of a press.
        await page.mouse.move(0, 0);
        await page.mouse.up();
        await expect.poll(() => button.evaluate(el => getComputedStyle(el).transform)).toBe('none');
        await expect(button).toHaveAttribute('aria-expanded', 'false');
        await button.click();
        await expect(button).toHaveAttribute('aria-expanded', 'true');
    }
});

test('coleções usam entrada curta, sem ocultar o conteúdo quando animações são desativadas', async ({ page }) => {
    await page.addInitScript(() => {
        const animate = Element.prototype.animate;
        window.collectionAnimations = [];
        Element.prototype.animate = function (frames, options) {
            if (this.parentElement?.matches('.collection-disclosure')) {
                window.collectionAnimations.push({ frames, duration: options.duration });
            }
            return animate.call(this, frames, options);
        };
    });
    for (const reduced of [false, true]) {
        await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
        await page.goto('/');
        await page.locator('#projects-more > summary').click();
        await expect(page.locator('#projects-more .project-row:visible')).toHaveCount(6);
        if (reduced) {
            expect(await page.evaluate(() => window.collectionAnimations)).toEqual([]);
        } else {
            await expect.poll(() => page.evaluate(() => window.collectionAnimations.length)).toBe(1);
            const [animation] = await page.evaluate(() => window.collectionAnimations);
            expect(animation.duration).toBeLessThanOrEqual(350);
            expect(animation.frames.every(frame => frame.opacity >= 0.75 && !frame.transform)).toBe(true);
        }
        await page.locator('#projects-more > summary').click();
        await expect(page.locator('#projects-more .project-row:visible')).toHaveCount(0);
    }
});
