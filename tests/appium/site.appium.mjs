import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';
import { Builder, By, until, Key } from 'selenium-webdriver';
import { publicSite } from '../support/public-site.mjs';

const url = publicSite();
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(root, 'artifacts/appium');
await fs.mkdir(output, { recursive: true });
const adbDevices = execFileSync('adb', ['devices'], { encoding: 'utf8', windowsHide: true });
const serial = adbDevices.split(/\r?\n/).find(line => /^emulator-\d+\s+device$/.test(line))?.split(/\s/)[0];
assert(serial, 'This suite requires a running Android emulator, not a physical phone.');
const adb = (...args) => execFileSync('adb', ['-s', serial, ...args], { encoding: 'utf8', windowsHide: true }).trim();
assert.equal(adb('shell', 'getprop', 'ro.kernel.qemu'), '1');
assert(adb('shell', 'pm', 'path', 'com.android.chrome').includes('package:'), 'Chrome must be installed in the emulator image.');
const report = { url, measuredAt: new Date().toISOString(), physical: false, emulator: serial,
  android: adb('shell', 'getprop', 'ro.build.version.release'), checks: [], passed: false };
const log = createWriteStream(path.join(output, 'appium.log'));
const server = spawn(process.execPath, ['node_modules/appium/build/lib/main.js', '--address', '127.0.0.1',
  '--port', '4723', '--allow-insecure', 'uiautomator2:chromedriver_autodownload'],
{ cwd: path.join(root, 'tests/appium'), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
server.stdout.pipe(log);
server.stderr.pipe(log);
let driver;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error('Appium stopped before opening its automation connection.');
    try {
      const response = await fetch('http://127.0.0.1:4723/status', { signal: AbortSignal.timeout(1000) });
      const body = await response.json();
      if (body.value?.ready) { ready = true; break; }
    } catch {}
    await wait(1000);
  }
  assert(ready, 'Appium automation connection did not become ready.');
  driver = await new Builder().usingServer('http://127.0.0.1:4723').withCapabilities({
    platformName: 'Android', browserName: 'Chrome',
    'appium:automationName': 'UiAutomator2', 'appium:udid': serial,
    'appium:newCommandTimeout': 120, 'appium:uiautomator2ServerInstallTimeout': 120000,
    'appium:adbExecTimeout': 60000,
    'goog:chromeOptions': { args: ['--no-first-run', '--disable-fre', '--no-default-browser-check'] }
  }).build();
  await driver.manage().setTimeouts({ implicit: 0, pageLoad: 60000, script: 30000 });
  const find = selector => driver.findElement(By.css(selector));
  const visible = selector => driver.wait(until.elementLocated(By.css(selector)), 20000)
    .then(element => driver.wait(until.elementIsVisible(element), 20000));
  const click = async selector => {
    const element = await find(selector);
    const href = await element.getAttribute('href');
    await driver.executeScript('arguments[0].scrollIntoView({block:"center",behavior:"instant"});', element);
    await element.click();
    if (href?.startsWith(url + '#')) {
      // Updating the URL starts the journey; wait for the actual destination
      // before capturing the screen or issuing another scroll command.
      await driver.wait(() => driver.executeScript(`
        const target = document.querySelector(arguments[0]);
        const root = document.documentElement;
        const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const expected = Math.max(0, Math.min(root.scrollHeight - innerHeight,
          scrollY + target.getBoundingClientRect().top - padding - margin));
        return Math.abs(scrollY - expected) <= 2;
      `, new URL(href).hash), 10000, 'Anchor scrolling did not reach its destination.');
    }
  };
  const check = async (name, run) => {
    await run();
    await fs.writeFile(path.join(output, name + '.png'), await driver.takeScreenshot(), 'base64');
    report.checks.push({ name, passed: true });
    console.log('PASS ' + name);
  };
  const geometry = async () => {
    const overflow = await driver.executeScript('return document.documentElement.scrollWidth - document.documentElement.clientWidth;');
    assert(overflow <= 1, 'Horizontal overflow: ' + overflow);
  };
  await driver.get(url);
  report.userAgent = await driver.executeScript('return navigator.userAgent;');
  assert.match(report.userAgent, /Android/);
  report.capabilities = { browserVersion: (await driver.getCapabilities()).get('browserVersion') };
  await check('01-hero-and-icons', async () => {
    await driver.wait(until.titleIs('Douglas Antonio | Software Quality Engineer'), 20000);
    await visible('h1');
    assert.equal((await driver.findElements(By.css('.skill-chip'))).length, 62);
    assert.equal(await driver.executeScript('return [...document.querySelectorAll(".skill-chip svg")].filter(svg => svg.getBBox().width > 0 && svg.getBBox().height > 0).length;'), 62);
    await geometry();
  });
  await check('02-mobile-navigation', async () => {
    await click('#menu-toggle');
    await visible('#primary-nav');
    await click('#primary-nav a[href="#vision"]');
    assert.match(await driver.getCurrentUrl(), /#vision$/);
    assert.equal(await (await find('#menu-toggle')).getAttribute('aria-expanded'), 'false');
    await geometry();
  });
  await check('03-all-projects', async () => {
    await click('#projects-more > summary');
    const triggers = await driver.findElements(By.css('.trigger-modal'));
    assert.equal(triggers.length, 10);
    for (const trigger of triggers) {
      await driver.executeScript('arguments[0].scrollIntoView({block:"center",behavior:"instant"});', trigger);
      await trigger.click();
      await visible('#project-modal.active');
      assert.match(await (await find('#project-modal-link')).getAttribute('href'), /^https:\/\/github.com\//);
      assert((await (await find('#project-modal-code')).getAttribute('textContent')).length > 0);
      await click('#project-modal .close-modal');
    }
  });
  await check('04-all-certificates', async () => {
    await click('#certificates-more > summary');
    const triggers = await driver.findElements(By.css('.certification-view-btn'));
    assert.equal(triggers.length, 16);
    for (const trigger of triggers) {
      await driver.executeScript('arguments[0].scrollIntoView({block:"center",behavior:"instant"});', trigger);
      await trigger.click();
      await visible('#certificate-viewer-modal.active');
      await driver.wait(() => driver.executeScript('const i=document.querySelector("#certificate-modal-image");return !i.hidden && i.complete && i.naturalWidth > 0;'), 20000);
      await click('#certificate-viewer-modal .close-modal');
    }
  });
  await check('05-resume-availability', async () => {
    const href = await (await find('a[download]')).getAttribute('href');
    assert.equal(href, url + 'assets/Douglas_Antonio_QA_Engineer.pdf');
    const available = await driver.executeAsyncScript('const done=arguments[arguments.length-1];fetch(arguments[0]).then(async r=>done({ok:r.ok,type:r.headers.get("content-type"),magic:(await r.text()).slice(0,5)})).catch(e=>done({error:String(e)}));', href);
    assert.equal(available.ok, true);
    assert.match(available.type, /application\/pdf/);
    assert.equal(available.magic, '%PDF-');
  });
  await check('06-reload-and-contact', async () => {
    await driver.get(url + '#contact');
    await driver.navigate().refresh();
    assert.equal((await driver.findElements(By.css('.contact-link'))).length, 3);
    await geometry();
  });
  await check('07-text-scaling', async () => {
    await driver.executeScript('document.documentElement.style.fontSize="200%";');
    await geometry();
    await click('#menu-toggle');
    await click('#primary-nav a[href="#projects"]');
    await click('.trigger-modal');
    await visible('#project-modal.active');
    await click('#project-modal .close-modal');
    assert.equal(await driver.executeScript('return document.querySelector("main").inert;'), false);
  });
  report.passed = true;
} catch (error) {
  report.error = { message: error.message, stack: error.stack };
  if (driver) await fs.writeFile(path.join(output, 'failure.png'), await driver.takeScreenshot().catch(() => ''), 'base64');
  process.exitCode = 1;
  console.error(error);
} finally {
  await driver?.quit().catch(() => {});
  server.kill();
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
}
