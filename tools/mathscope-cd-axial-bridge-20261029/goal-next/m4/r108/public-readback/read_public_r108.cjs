const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.MATHSCOPE_PLAYWRIGHT_PACKAGE || 'playwright');

const target = 'https://project29770.websitepublisher.ai/v0.3.1.html';
const destination = process.argv[2];
assert.ok(destination);
fs.mkdirSync(destination, { recursive: true });

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.MATHSCOPE_CHROMIUM_EXECUTABLE,
    headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const blockedMethods = [];
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error.message).slice(0, 240)));
    page.on('console', message => {
      if (message.type() === 'error' && consoleErrors.length < 20) {
        consoleErrors.push(message.text().slice(0, 240));
      }
    });
    await page.route('**/*', route => {
      const method = route.request().method();
      if (method === 'GET' || method === 'HEAD') return route.continue();
      blockedMethods.push(method);
      return route.abort();
    });
    if (typeof page.routeWebSocket === 'function') {
      await page.routeWebSocket('**/*', socket => socket.close());
    }
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 100000 });
    assert.equal(response.status(), 200);
    assert.equal(new URL(page.url()).origin, new URL(target).origin);
    const launcher = page.locator('#ms32-open');
    await launcher.waitFor({ state: 'visible' });
    const centerHit = await launcher.evaluate(element => {
      const box = element.getBoundingClientRect();
      const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return { launcher: element.id, actualTarget: top?.closest('button')?.id ?? top?.id ?? null };
    });
    let activation = 'pointer';
    let pointerFailure = null;
    if (centerHit.actualTarget !== centerHit.launcher) {
      await page.screenshot({ path: path.join(destination, 'launcher-overlap.png') });
      try {
        await launcher.click({ timeout: 1500 });
      } catch (error) {
        pointerFailure = String(error.message).split('\n').find(line => line.includes('intercepts pointer events'))
          ?.replace(/\u001b\[[0-9;]*m/g, '').trim();
        assert.ok(pointerFailure);
        activation = 'keyboard';
        await launcher.focus();
        await launcher.press('Enter');
      }
    } else {
      await launcher.click();
    }
    const dialog = page.locator('#ms32-dialog');
    await dialog.waitFor({ state: 'visible' });
    await dialog.locator('[data-ms32-tab="m4"]').click();
    const selector = dialog.locator('#ms32-select');
    await selector.selectOption('R1-08');
    assert.equal(await selector.inputValue(), 'R1-08');
    const panel = dialog.locator('#ms32-panel-m4');
    await panel.waitFor({ state: 'visible' });
    const visible = await dialog.innerText();
    assert.ok(visible.includes('R1-08'));
    assert.match(visible, /HOLD/);
    const viewports = [];
    for (const [name, width, height] of [['desktop', 1280, 900], ['mobile', 390, 844]]) {
      await page.setViewportSize({ width, height });
      const screenshot = name + '.png';
      await page.screenshot({ path: path.join(destination, screenshot) });
      viewports.push({ name, width, height, screenshot });
    }
    const selectedCriterion = await selector.inputValue();
    const screenUrl = page.url();
    const visiblePanelText = (await panel.innerText()).split('\n').map(line => line.trim()).filter(Boolean).slice(0, 40);
    await dialog.locator('#ms32-close').click();
    await page.locator('#ms-m4-launcher').focus();
    await page.locator('#ms-m4-launcher').press('Enter');
    await page.locator('#ms-m4-dialog').waitFor({ state: 'visible' });
    const workbench = page.locator('#ms-r1-lab');
    const labRootCount = await workbench.count();
    const proofJobHostCount = await page.locator('[data-r1="proof-job-host"]').count();
    const record = {
      checkedUtc: new Date().toISOString(), entryUrl: target, screenUrl, labUrl: page.url(),
      status: response.status(), title: await page.title(),
      selectedCriterion, releaseHoldVisible: true, visiblePanelText,
      currentLab: { labRootCount, proofJobHostCount, visible: labRootCount === 1 && await workbench.isVisible(),
        visibleSummary: labRootCount === 1 ? (await workbench.innerText()).slice(0, 1000) : null },
      screenshotViewports: viewports, centerHit, activation, pointerFailure, blockedMethods, pageErrors, consoleErrors,
      candidatePostPublicationScreenReceipt: false
    };
    fs.writeFileSync(path.join(destination, 'public-screen.json'), JSON.stringify(record, null, 2) + '\n');
    console.log(JSON.stringify({ status: record.status, selectedCriterion: record.selectedCriterion,
      releaseHoldVisible: true, labRootCount, proofJobHostCount, activation, viewports: viewports.length }));
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
