import {test, expect} from '@playwright/test';
import sharp from 'sharp';

async function paintedPixels(icon) {
    await icon.evaluate(svg => svg.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
    const {data, info} = await sharp(await icon.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true});
    let count = 0;
    for (let pixel = 0; pixel < data.length; pixel += info.channels) {
        const channels = [data[pixel], data[pixel + 1], data[pixel + 2]];
        if (Math.max(...channels) > 90 && Math.max(...channels) - Math.min(...channels) > 35) count++;
    }
    return count;
}

test('@smoke os 62 ícones são pintados no celular mesmo sem arquivos externos de ícones', async ({page}) => {
    test.setTimeout(120_000); // Scroll to and inspect actual pixels of 62 separate glyphs.
    await page.setViewportSize({width:390,height:844});
    await page.route('**/assets/icons/**', route => route.abort());
    await page.goto('/', {waitUntil:'networkidle'});
    const icons = page.locator('.skill-chip .skill-icon');
    await expect(icons).toHaveCount(62);
    for (const icon of await icons.all()) {
        const label = await icon.evaluate(svg => svg.closest('[data-skill-id]').dataset.skillId);
        expect(await paintedPixels(icon), `${label}: visible colored glyph pixels`).toBeGreaterThan(12);
    }
});

test('@smoke ícones permanecem após rotação, rolagem e navegação sem JavaScript', async ({browser}, testInfo) => {
    const context = await browser.newContext({javaScriptEnabled:false, viewport:{width:390,height:844}, baseURL:testInfo.project.use.baseURL});
    try {
        const page = await context.newPage();
        await page.route('**/assets/icons/**', route => route.abort());
        await page.goto('/');
        for (const viewport of [{width:390,height:844},{width:844,height:390},{width:390,height:844}]) {
            await page.setViewportSize(viewport);
            for (const id of ['javascript-node','playwright','postgresql','appium','git','performance-tests']) {
                const icon = page.locator(`[data-skill-id="${id}"] .skill-icon`);
                expect(await paintedPixels(icon), `${id} at ${viewport.width}px`).toBeGreaterThan(12);
            }
            expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
        }
        await page.goto('/#contact');
        await page.goBack();
        expect(await paintedPixels(page.locator('[data-skill-id="python"] .skill-icon'))).toBeGreaterThan(12);
    } finally {
        await context.close();
    }
});
