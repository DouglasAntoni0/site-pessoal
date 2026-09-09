import { firefox, webkit } from '@playwright/test';
import { publicSite } from '../tests/support/public-site.mjs';
for (const [name, engine] of Object.entries({ firefox, webkit })) {
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  page.on('requestfailed', request => console.log(name, 'FAILED REQUEST', request.url(), request.failure()));
  page.on('pageerror', error => console.log(name, 'PAGE ERROR', error.message));
  await page.addInitScript(() => {
    window.events = [];
    for (const type of ['pointermove', 'pointerout', 'mousemove', 'click']) document.addEventListener(type, e => {
      window.events.push({ type, target:e.target.tagName, x:e.clientX, y:e.clientY, related:e.relatedTarget?.tagName });
    });
  });
  await page.goto(publicSite());
  console.log(name, 'environment', await page.evaluate(() => ({
    pointer:matchMedia('(pointer: fine)').matches, hover:matchMedia('(hover: hover)').matches,
    coarse:matchMedia('(pointer: coarse)').matches, slow:matchMedia('(update: slow)').matches,
    reduced:matchMedia('(prefers-reduced-motion: reduce)').matches, className:document.documentElement.className,
    visible:document.visibilityState, agent:navigator.userAgent
  })));
  const row=page.locator('.project-row').first();
  await row.hover({position:{x:160,y:120}});
  await page.waitForTimeout(500);
  console.log(name,'hover1',await row.getAttribute('class'),await page.evaluate(()=>window.events));
  await row.hover({position:{x:180,y:140}});
  await page.waitForTimeout(500);
  console.log(name,'hover2',await row.getAttribute('class'),await page.evaluate(()=>window.events));
  await row.locator('.trigger-modal').click();
  await page.locator('#project-modal.active').waitFor({timeout:30000});
  console.log(name,'modal opened');
  await browser.close();
}
