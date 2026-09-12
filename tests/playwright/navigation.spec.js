import { test, expect } from '../support/fixtures.js';

// Avoid competing rendering workloads when measuring animation frames.
test.describe.configure({ mode: 'default' });
// Use CSS-pixel resolution for frame sampling. The Windows WebKit software
// renderer can spend the entire native animation painting one retina frame.
// The remaining functional suite retains each device's original pixel ratio.
test.use({ deviceScaleFactor: 1 });

async function followAnchor(page, selector, { keyboard = false } = {}) {
    const link = page.locator(selector);
    if (selector.startsWith('#primary-nav') && await page.locator('#menu-toggle').isVisible()) {
        await page.locator('#menu-toggle').click();
    }
    // Prepare offscreen hero actions without adding test-driven smooth scrolling
    // to the journey that will be measured after the actual activation.
    if (selector.startsWith('.hero-actions')) {
        await link.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    }
    await expect(link).toBeVisible();
    if (keyboard) await link.evaluate(el => el.focus({ preventScroll: true }));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const hash = await link.getAttribute('href');
    const start = await page.evaluate(() => {
        window.anchorScrollSamples = [];
        window.recordAnchorScroll = () => window.anchorScrollSamples.push(scrollY);
        addEventListener('scroll', window.recordAnchorScroll, { passive: true });
        return scrollY;
    });
    if (keyboard) {
        await page.keyboard.press('Enter');
    } else {
        // Native pointer activation avoids locator.click() repositioning a
        // sticky menu link before the browser starts following its anchor.
        const box = await link.boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await expect(page).toHaveURL(new RegExp(`${hash}$`));
    await expect.poll(() => page.evaluate(hash => {
        const target = document.querySelector(hash);
        const root = document.documentElement;
        const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const expected = Math.max(0, Math.min(root.scrollHeight - innerHeight,
            scrollY + target.getBoundingClientRect().top - padding - margin));
        return Math.abs(scrollY - expected);
    }, hash), { message: `A rolagem deve terminar em ${hash}, abaixo do cabeçalho` }).toBeLessThanOrEqual(2);

    const { end, samples } = await page.evaluate(() => {
        removeEventListener('scroll', window.recordAnchorScroll);
        return { end: scrollY, samples: window.anchorScrollSamples };
    });
    expect(Math.abs(end - start), `${selector} deve percorrer uma distância visível`).toBeGreaterThan(100);
    const low = Math.min(start, end) + 5;
    const high = Math.max(start, end) - 5;
    expect(new Set(samples.filter(y => y > low && y < high)).size,
        `${selector} deve mostrar uma posição intermediária, sem salto direto`).toBeGreaterThan(0);
    await expect(page.locator('#primary-nav a[aria-current="location"]')).toHaveAttribute('href', hash);
}

for (const [name, viewport] of [
    ['desktop', { width: 1440, height: 900 }],
    ['celular', { width: 390, height: 844 }]
]) {
    test(`âncoras rolam suavemente para cima e para baixo em ${name}`, async ({ page }) => {
        test.setTimeout(90_000);
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);
        await followAnchor(page, '.hero-actions a[href="#contact"]', { keyboard: true });
        await followAnchor(page, '.logo');
        await followAnchor(page, '.hero-actions a[href="#projects"]');
        for (const id of ['certifications', 'vision', 'contact', 'hero', 'volunteer', 'quality', 'projects']) {
            await followAnchor(page, `#primary-nav a[href="#${id}"]`);
        }
    });
}
