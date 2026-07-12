import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Builder, By, Key, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const port = 4176;
const baseUrl = process.env.BASE_URL || `http://127.0.0.1:${port}`;
const root = fileURLToPath(new URL('../../', import.meta.url));
const dist = path.join(root, 'dist');

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      await wait(250);
    }
  }
  throw new Error(`Static server did not start at ${baseUrl}`);
}

async function getOverflow(driver) {
  return driver.executeScript(() => ({
    documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bodyOverflow: document.body.scrollWidth - document.body.clientWidth
  }));
}

async function buildDriver(width, height) {
  const options = new chrome.Options()
    .addArguments('--headless=new')
    .addArguments('--disable-gpu')
    .addArguments('--no-sandbox')
    .addArguments(`--window-size=${width},${height}`);

  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

let server;
if (!process.env.BASE_URL) {
  server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dist], {
    cwd: root,
    stdio: 'ignore',
    windowsHide: true
  });
}

const failures = [];

try {
  if (!process.env.BASE_URL) {
    await waitForServer();
  }

  for (const [name, width, height] of [
    ['desktop', 1440, 900],
    ['tablet', 768, 1024],
    ['mobile', 390, 844],
    ['small-mobile', 320, 568],
    ['minimum-mobile', 280, 653],
    ['landscape-mobile', 667, 375]
  ]) {
    const driver = await buildDriver(width, height);
    try {
      await driver.get(baseUrl);
      await driver.wait(until.titleIs('Douglas Antonio | Software Quality Engineer'), 8000);
      const heading = await driver.wait(async () => {
        const text = await driver.findElement(By.css('h1')).getAttribute('textContent');
        return /Engenharia de Qualidade Escalável/.test(text) ? text : false;
      }, 8000, `${name}: hero title text`);
      assert.match(heading, /Engenharia de Qualidade Escalável/, `${name}: hero title`);

      const overflow = await getOverflow(driver);
      assert.equal(overflow.documentOverflow <= 1, true, `${name}: document overflow ${JSON.stringify(overflow)}`);
      assert.equal(overflow.bodyOverflow <= 1, true, `${name}: body overflow ${JSON.stringify(overflow)}`);

      const certificationNav = await driver.findElement(By.css('a[href="#certifications"]'));
      assert.match(await certificationNav.getAttribute('textContent'), /Certificações/, `${name}: certifications nav label`);
      const certificationCards = await driver.findElements(By.css('#certifications .certification-card'));
      assert.equal(certificationCards.length, 13, `${name}: certification card count`);
      const certificationViewButtons = await driver.findElements(By.css('#certifications .certification-view-btn'));
      assert.equal(certificationViewButtons.length, 13, `${name}: certification view button count`);
      const supportCards = await driver.findElements(By.css('#certifications .certification-support-card'));
      assert.equal(supportCards.length, 2, `${name}: complementary certification card count`);
      const certificationsText = await driver.executeScript('return document.querySelector("#certifications").textContent;');
      assert.match(certificationsText, /Segurança em Tecnologia da Informação/, `${name}: security certificate title`);
      assert.match(certificationsText, /Projetos de Sistemas de TI/, `${name}: systems projects certificate title`);
      assert.match(certificationsText, /Inglês - Avançado/, `${name}: advanced english credential title`);
      assert.match(certificationsText, /Informática/, `${name}: informatics credential title`);
      await driver.executeScript('arguments[0].scrollIntoView({ block: "center", inline: "center" });', certificationViewButtons[0]);
      await wait(150);
      await driver.executeScript('arguments[0].click();', certificationViewButtons[0]);
      const certificateModal = await driver.wait(until.elementLocated(By.css('#certificate-viewer-modal.active')), 8000);
      const certificateImage = await certificateModal.findElement(By.css('#certificate-modal-image'));
      assert.match(await certificateImage.getAttribute('src'), /assets\/certificates\/previews\/ebac-engenheiro-qualidade-software\.webp/, `${name}: certification image src`);
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.wait(until.elementIsNotVisible(certificateModal), 8000);
      const certificationCta = await driver.findElement(By.css('#certifications .certifications-cta'));
      assert.equal(await certificationCta.getAttribute('href'), 'https://www.linkedin.com/in/douglas-antonio-qa/details/certifications/', `${name}: certifications CTA href`);
      assert.equal(await certificationCta.getAttribute('target'), '_blank', `${name}: certifications CTA target`);
      assert.match(await certificationCta.getAttribute('rel'), /noopener/, `${name}: certifications CTA rel`);
      const buttons = await driver.findElements(By.css('.trigger-modal'));
      assert.equal(buttons.length, 10, `${name}: modal trigger count`);
      const projectsText = await driver.executeScript('return document.querySelector("main").textContent;');
      assert.match(projectsText, /Pytest: Gerenciador de Tarefas/, `${name}: pytest project title`);
      assert.match(projectsText, /Selenium JS Toolshop QA/, `${name}: selenium project title`);
      assert.match(projectsText, /BDD com Cucumber/, `${name}: cucumber project title`);

      await driver.executeScript('arguments[0].scrollIntoView({ block: "center", inline: "center" });', buttons[0]);
      await wait(150);
      await driver.executeScript('arguments[0].click();', buttons[0]);
      const modal = await driver.wait(until.elementLocated(By.css('.glass-modal.active')), 8000);
      const modalText = await driver.wait(async () => {
        const text = await modal.getAttribute('textContent');
        return /Automação de Performance com K6/.test(text) ? text : false;
      }, 8000, `${name}: modal content text`);
      assert.match(modalText, /Automação de Performance com K6/, `${name}: modal content`);
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.wait(until.elementIsNotVisible(modal), 8000);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
    } finally {
      await driver.quit();
    }
  }
} finally {
  if (server) {
    server.kill();
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Selenium checks passed across desktop, tablet, mobile and small-mobile.');
