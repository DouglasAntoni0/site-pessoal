import { test, expect } from '../support/fixtures.js';

test('efeitos contínuos usam transform ou opacidade e pausam fora da área visível', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const continuousAnimations = () => page.evaluate(() => document.getAnimations()
        .filter(animation => animation.playState === 'running' && animation.effect?.getTiming().iterations === Infinity)
        .map(animation => {
            const target = animation.effect.target;
            const bounds = target.getBoundingClientRect();
            return {
                properties: [...new Set(animation.effect.getKeyframes().flatMap(frame => Object.keys(frame)
                    .filter(key => !['offset', 'computedOffset', 'easing', 'composite'].includes(key))))],
                inViewport: bounds.bottom > 0 && bounds.top < innerHeight && bounds.right > 0 && bounds.left < innerWidth,
                inHero: Boolean(target.closest('#hero'))
            };
        }));
    await expect.poll(async () => (await continuousAnimations()).some(animation => animation.inHero)).toBe(true);
    for (const { properties, inViewport } of await continuousAnimations()) {
        expect(inViewport).toBe(true);
        expect(properties.length).toBeGreaterThan(0);
        expect(properties.every(property => ['transform', 'opacity'].includes(property)), properties.join(', ')).toBe(true);
    }
    await page.locator('#contact').evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'start' }));
    // The previous section can remain partly visible above this short section.
    // Its decoration may keep moving; every fully offscreen effect must pause.
    await expect.poll(async () => (await continuousAnimations())
        .every(animation => animation.inViewport && !animation.inHero)).toBe(true);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(async () => (await continuousAnimations()).some(animation => animation.inHero)).toBe(true);
});

test('halos preservam os controles e pausam em modais, aba oculta e movimento reduzido', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const halos = page.locator('#hero .aurora-orb');
    const runningHalos = () => page.evaluate(() => document.getAnimations()
        .filter(animation => animation.effect?.target.matches('.aurora-orb') && animation.playState === 'running').length);
    const haloStates = () => page.evaluate(() => document.getAnimations()
        .filter(animation => animation.effect?.target.matches('.aurora-orb'))
        .map(animation => ({ state: animation.playState, time: animation.currentTime, duration: animation.effect.getTiming().duration })));
    await expect(halos).toHaveCount(2);
    await expect(page.locator('#hero .aurora-wrapper')).toHaveAttribute('aria-hidden', 'true');
    await expect.poll(runningHalos).toBe(2);
    expect((await haloStates()).map(state => state.duration).sort((a, b) => a - b)).toEqual([18_000, 24_000]);
    for (const bounds of await halos.evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height, filter: getComputedStyle(element).filter };
    }))) {
        expect(bounds.width).toBeLessThanOrEqual(480);
        expect(bounds.height).toBeLessThanOrEqual(480);
        expect(bounds.filter).toBe('none');
    }
    const action = page.locator('.hero-actions .btn').first();
    await action.scrollIntoViewIfNeeded();
    expect(await action.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    })).toBe(true);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(runningHalos).toBe(2);

    // Open through the real production handler while keeping the hero in view,
    // so this checks modal suspension independently of offscreen suspension.
    await page.locator('.trigger-modal').first().evaluate(element => element.click());
    await expect(page.locator('#project-modal')).toBeVisible();
    await expect.poll(async () => (await haloStates()).every(state => state.state === 'paused')).toBe(true);
    const pausedTimes = (await haloStates()).map(state => state.time);
    expect(pausedTimes).toHaveLength(2);
    await page.waitForTimeout(120);
    expect((await haloStates()).map(state => state.time)).toEqual(pausedTimes);
    await page.keyboard.press('Escape');
    await expect.poll(runningHalos).toBe(2);

    // Simulate the browser notification to verify the production visibility handler.
    await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(runningHalos).toBe(0);
    await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(runningHalos).toBe(2);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('#hero .aurora-wrapper')).toBeHidden();
    await expect.poll(runningHalos).toBe(0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect.poll(runningHalos).toBe(2);
});

const currentLink = page => page.locator('#primary-nav a[aria-current="location"]');
async function expectCurrent(page, id) {
    await expect(currentLink(page)).toHaveCount(1);
    await expect(currentLink(page)).toHaveAttribute('href', `#${id}`);
}

async function clickVisibleHeaderControl(page, locator) {
    await expect(locator).toBeVisible();
    const box = await locator.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height);
    // These sticky controls are already in the viewport. locator.click() may
    // scroll them into view again, shifting the document before the click and
    // changing the position saved in browser history (notably in WebKit).
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
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
    await clickVisibleHeaderControl(page, page.locator('#primary-nav a[href="#contact"]'));
    await expectCurrent(page, 'contact');
    await page.goBack();
    await expectCurrent(page, 'vision');
    await page.reload();
    await expectCurrent(page, 'vision');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#vision').evaluate(el => el.scrollIntoView({ block: 'start' }));
    await expectCurrent(page, 'vision');
    await clickVisibleHeaderControl(page, page.locator('#menu-toggle'));
    await expectCurrent(page, 'vision');
    await expect(currentLink(page)).toBeVisible();
    expect(await currentLink(page).evaluate(el => getComputedStyle(el).boxShadow)).not.toBe('none');
    await clickVisibleHeaderControl(page, page.locator('#primary-nav a[href="#quality"]'));
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
