import { publicSite } from '../support/public-site.mjs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

// Manual, opt-in hardware test. Never substitutes an emulator for a physical device.
const devices = execFileSync('adb', ['devices'], {encoding: 'utf8', windowsHide: true})
    .split(/\r?\n/).filter(line => /\sdevice$/.test(line)).map(line => line.split(/\s/)[0]);
const serial = process.env.ANDROID_SERIAL || (devices.length === 1 ? devices[0] : null);
assert(serial && devices.includes(serial), 'Connect and authorize one Android device, or set ANDROID_SERIAL.');
const adb = (...args) => execFileSync('adb', ['-s', serial, ...args], {encoding: 'utf8', windowsHide: true}).trim();
assert.notEqual(adb('shell', 'getprop', 'ro.kernel.qemu'), '1', 'This suite requires a physical Android device.');
const url = publicSite();
const port = adb('forward', 'tcp:0', 'localabstract:chrome_devtools_remote');
const output = 'artifacts/android';
await fs.mkdir(output, {recursive: true});
const screenshot = async name => {
    const focus = adb('shell', 'dumpsys', 'window').split('\n').find(line => line.includes('mCurrentFocus='));
    assert(focus?.includes('com.android.chrome'), 'Keep Chrome visible and the phone unlocked during the test.');
    const bytes = execFileSync('adb', ['-s', serial, 'exec-out', 'screencap', '-p'], {windowsHide: true, maxBuffer: 16 * 1024 * 1024});
    await fs.writeFile(`${output}/${name}.png`, bytes);
};
let browser;
let page;
const report = {
    measuredAt: new Date().toISOString(), url,
    device: adb('shell', 'getprop', 'ro.product.model'),
    android: adb('shell', 'getprop', 'ro.build.version.release'),
    physical: true, checks: [], errors: [], passed: false
};
try {
    // Attach to Chrome without restarting it, clearing data, or navigating existing tabs.
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    page = await browser.contexts()[0].newPage();
    await page.bringToFront();
    page.setDefaultTimeout(15_000);
    const cdp = await page.context().newCDPSession(page);
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    const tap = async locator => {
        await locator.scrollIntoViewIfNeeded();
        const box = await locator.boundingBox();
        assert(box, 'Touch target must be visible');
        await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: box.x + box.width / 2, y: box.y + box.height / 2}]});
        await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    };
    const geometry = async () => {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert(overflow <= 1, `Horizontal overflow: ${overflow}px`);
    };
    await page.goto(url, {waitUntil: 'networkidle'});
    report.browser = browser.version();
    report.screen = await page.evaluate(() => ({width: innerWidth, height: innerHeight, dpr: devicePixelRatio, touch: matchMedia('(pointer: coarse)').matches, userAgent: navigator.userAgent}));
    assert(report.screen.touch && /Android/.test(report.screen.userAgent), 'Expected real Android Chrome');
    await expect(page.locator('h1')).toBeVisible();
    await geometry();
    await screenshot('hero');
    report.checks.push('Hero and native viewport without horizontal overflow');
    await tap(page.locator('#menu-toggle'));
    await expect(page.locator('#primary-nav')).toBeVisible();
    await tap(page.locator('#primary-nav a[href="#projects"]'));
    await expect(page.locator('#primary-nav')).toBeHidden();
    await expect(page).toHaveURL(/#projects$/);
    report.checks.push('Touch menu opens and closes after navigation');
    await expect(page.locator('#projects-container .project-row:visible')).toHaveCount(3);
    await tap(page.locator('#projects-more > summary'));
    await expect(page.locator('#projects-container .project-row:visible')).toHaveCount(9);
    await tap(page.locator('#projects-more > summary'));
    await tap(page.locator('.trigger-modal[data-project-id="modal-1"]'));
    await expect(page.locator('#project-modal')).toBeVisible();
    await expect(page.locator('#project-modal-case')).toContainText('Smoke e Load Test');
    await page.locator('#project-modal-case').scrollIntoViewIfNeeded();
    await screenshot('case-study');
    await tap(page.locator('#project-modal .close-modal'));
    await expect(page.locator('#project-modal')).toBeHidden();
    report.checks.push('Project collection and case-study modal respond to touch');
    await tap(page.locator('[data-certificate-pdf]'));
    await expect(page.locator('#certificate-modal-image')).toBeVisible();
    await expect.poll(() => page.locator('#certificate-modal-image').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(page.locator('#certificate-modal-open')).toHaveAttribute('href', /\.pdf$/);
    await screenshot('maestro');
    await tap(page.locator('#certificate-viewer-modal .close-modal'));
    await tap(page.locator('#certificates-more > summary'));
    await expect(page.locator('.certification-card:visible')).toHaveCount(16);
    await geometry();
    report.checks.push('Maestro preview, PDF link and complete certificate collection');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(page.locator('.contact-link')).toHaveCount(3);
    await geometry();
    report.checks.push('Page scroll reaches contact section without overflow');
    assert.deepEqual(report.errors, []);
    report.passed = true;
} catch (error) {
    report.failure = error.message;
    if (page) await screenshot('failure').catch(() => {});
    process.exitCode = 1;
} finally {
    await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close(); // CDP connection: disconnect only.
    adb('forward', '--remove', `tcp:${port}`);
}
