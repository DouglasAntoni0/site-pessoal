import {test, expect} from '@playwright/test';
import sharp from 'sharp';

async function paintedPixels(screenshot, box) {
    const {data, info} = await sharp(screenshot).extract(box).removeAlpha().raw().toBuffer({resolveWithObject:true});
    let count = 0;
    for (let pixel = 0; pixel < data.length; pixel += info.channels) {
        const channels = [data[pixel], data[pixel + 1], data[pixel + 2]];
        if (Math.max(...channels) > 90 && Math.max(...channels) - Math.min(...channels) > 35) count++;
    }
    return count;
}

async function expectPaintedIcons(page, ids) {
    const pending = new Set(ids);
    while (pending.size) {
        const firstId = pending.values().next().value;
        await page.locator(`[data-skill-id="${firstId}"] .skill-icon`).evaluate(svg =>
            svg.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
        // Capture the real viewport once for all visible glyphs. Separate locator
        // screenshots repeated expensive WebKit snapshots for every single icon.
        const visible = await page.locator('.skill-chip .skill-icon').evaluateAll(icons => {
            const headerBottom = document.querySelector('.glass-header').getBoundingClientRect().bottom;
            return icons.map(svg => {
                const rect = svg.getBoundingClientRect();
                return {id:svg.closest('[data-skill-id]').dataset.skillId,
                    left:Math.ceil(rect.left), top:Math.ceil(rect.top),
                    width:Math.floor(rect.width) - 1, height:Math.floor(rect.height) - 1};
            }).filter(box => box.left >= 0 && box.top > headerBottom
                && box.left + box.width < innerWidth && box.top + box.height < innerHeight);
        });
        const batch = visible.filter(icon => pending.has(icon.id));
        expect(batch.map(icon => icon.id), 'scroll exposes the next icon below the fixed header').toContain(firstId);
        const screenshot = await page.screenshot({scale:'css'});
        for (const {id, ...box} of batch) {
            expect(await paintedPixels(screenshot, box), `${id}: visible colored glyph pixels`).toBeGreaterThan(12);
            pending.delete(id);
        }
    }
}

test('@smoke os 62 ícones são pintados no celular mesmo sem arquivos externos de ícones', async ({page}) => {
    test.setTimeout(120_000);
    await page.setViewportSize({width:390,height:844});
    await page.route('**/assets/icons/**', route => route.abort());
    await page.goto('/', {waitUntil:'networkidle'});
    const icons = page.locator('.skill-chip .skill-icon');
    await expect(icons).toHaveCount(62);
    const ids = await icons.evaluateAll(elements => elements.map(svg => svg.closest('[data-skill-id]').dataset.skillId));
    await expectPaintedIcons(page, ids);
});

test.describe('ícones sem JavaScript', () => {
    test.use({javaScriptEnabled:false});

    test('@smoke ícones permanecem após rotação, rolagem e navegação sem JavaScript', async ({page}) => {
        test.setTimeout(120_000); // Multiple viewport captures on software-rendered CI browsers.
        await page.setViewportSize({width:390,height:844});
        await page.route('**/assets/icons/**', route => route.abort());
        await page.goto('/');
        for (const viewport of [{width:390,height:844},{width:844,height:390},{width:390,height:844}]) {
            await page.setViewportSize(viewport);
            await expectPaintedIcons(page, ['javascript-node','playwright','postgresql','appium','git','performance-tests']);
            expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
        }
        await page.goto('/#contact');
        await page.goBack();
        await expectPaintedIcons(page, ['python']);
    });
});
