import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const own = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const value = (name, fallback) => { const index = args.indexOf(name); return index < 0 ? fallback : args[index + 1]; };
const require = createRequire(import.meta.url);
const playwrightPath = value('--playwright', process.env.MATHSCOPE_PLAYWRIGHT_PATH || 'playwright');
const { chromium } = require(playwrightPath);
const executablePath = value('--browser-executable', process.env.MATHSCOPE_BROWSER_EXECUTABLE || undefined);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const out = resolve(own, 'evidence');
await mkdir(out, { recursive: true });
const model = JSON.parse(await readFile(resolve(own, 'panel-model.json'), 'utf8'));
const sha = data => createHash('sha256').update(data).digest('hex');
const expectedById = new Map(model.criteria.map(item => [item.taskId, item]));
const startedAt = new Date().toISOString();
const runId = startedAt.replace(/[^0-9]/g, '');
const screenshotDir = resolve(out, `browser-run-${runId}`);
await mkdir(screenshotDir, { recursive: true });
const results = [];
const checks = async (page, name, viewport) => {
  const timings = [];
  assert.ok((await page.title()).startsWith('MathScope'), 'Expected MathScope page title');
  assert.ok((await page.locator('body').innerText()).length > 50, 'Page is meaningful');
  assert.equal(await page.locator('vite-error-overlay,nextjs-portal [data-nextjs-dialog-overlay]').count(), 0);
  await page.locator('#ms-m4-dialog[data-ready=true]').waitFor({ state: 'attached', timeout: 60000 });
  await page.locator('#ms-m4-launcher').click();
  await page.locator('#ms-m4-dialog').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#ms-m4-dialog [data-criterion]').count(), 24);
  const ids = await page.locator('#ms-m4-dialog [data-criterion]').evaluateAll(nodes => nodes.map(n => n.dataset.criterion));
  assert.equal(new Set(ids).size, 24);
  assert.equal(ids.filter(id => id.startsWith('N')).length, 8);
  assert.equal(ids.filter(id => id.startsWith('I3')).length, 8);
  assert.equal(ids.filter(id => id.startsWith('R1')).length, 8);
  assert.equal(await page.locator('[data-observed-receipts] p').count(), model.observedReceipts.length);
  if (model.observedReceipts.some(x => x.kind === 'FRESH_KERNEL_REPLAY')) {
    assert.match(await page.locator('[data-observed-receipts]').textContent(), /조건부 해석 소스 exit 1/);
    assert.match(await page.locator('[data-observed-receipts]').textContent(), /pin 일치=false/);
  }
  for (const id of ids) {
    const before = performance.now();
    const control = page.locator(`#ms-m4-dialog [data-criterion="${id}"]`);
    if (name.includes('mobile')) await control.tap(); else await control.click();
    await page.waitForFunction(id => document.querySelector('[data-inspector]').dataset.selectedCriterion === id, id);
    timings.push(performance.now() - before);
    assert.equal(await page.locator('#ms-m4-dialog [data-detail-original]').innerText(), expectedById.get(id).exactCriterion);
    assert.match(await page.locator('#ms-m4-dialog [data-detail-page]').innerText(), new RegExp(`p\\.${expectedById.get(id).pdfPage}$`));
    assert.equal(await page.locator('#ms-m4-dialog [data-detail-sha]').innerText(), model.blueprintSha256);
    assert.ok((await page.locator('#ms-m4-dialog [data-detail-deps]').innerText()).length > 0);
    assert.ok((await page.locator('#ms-m4-dialog [data-detail-links] a').count()) >= 2);
  }
  await page.locator('#ms-m4-dialog [data-criterion="I3-06"]').focus();
  await page.keyboard.press('Enter');
  assert.match(await page.locator('[data-detail-title]').innerText(), /I3-06/);
  await page.locator('#ms-m4-dialog [data-step="local"]').click();
  assert.match(await page.locator('[data-detail-title]').innerText(), /N6-08/);
  const dl = page.waitForEvent('download');
  await page.locator('[data-export]').click();
  const downloaded = await dl;
  const downloadedPath = await downloaded.path();
  const exported = JSON.parse(await readFile(downloadedPath, 'utf8'));
  assert.equal(exported.m3OriginalAccepted, 56);
  assert.equal(exported.m4FinalAcceptance, 'UNCONFIRMED');
  assert.equal(exported.criteria.length, 24);
  assert.equal(exported.importedTrust, 'REASSESSMENT_REQUIRED');
  const forged = { ...exported, selectedCriterion: 'R1-06', m3OriginalAccepted: 64,
    m4FinalAcceptance: 'COMPLETE', evidenceRecords: [{ criterionId: 'I3-06', status: 'PASS', sourceSha256: '0'.repeat(64) }] };
  await page.locator('[data-import]').setInputFiles({ name: 'forged-pass.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(forged)) });
  await page.waitForFunction(() => document.querySelector('#ms-m4-dialog').dataset.importedTrust === 'QUARANTINED_REASSESSMENT_REQUIRED');
  assert.equal(await page.locator('#ms-m4-dialog').getAttribute('data-m3-accepted'), '56');
  assert.equal(await page.locator('#ms-m4-dialog').getAttribute('data-m4-final-acceptance'), 'UNCONFIRMED');
  assert.match(await page.locator('[data-message]').innerText(), /QUARANTINED/);
  const validSelection = await page.locator('[data-inspector]').getAttribute('data-selected-criterion');
  await page.locator('[data-import]').setInputFiles({ name: 'wrong-source.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...exported, blueprintSha256: '0'.repeat(64) })) });
  await page.waitForFunction(() => document.querySelector('#ms-m4-dialog').dataset.lastImportError === 'IMPORT_REJECTED');
  assert.equal(await page.locator('[data-inspector]').getAttribute('data-selected-criterion'), validSelection);
  assert.match(await page.locator('[data-message]').innerText(), /hash가 다릅니다/);
  await page.locator('[data-import]').setInputFiles({ name: 'valid-view.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
  await page.waitForFunction(() => document.querySelector('[data-inspector]').dataset.selectedCriterion === 'N6-08');
  await page.locator('#ms-m4-dialog [data-criterion="N6-01"]').click();
  const overflow = await page.locator('#ms-m4-dialog').evaluate(node => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }));
  assert.ok(overflow.scrollWidth <= overflow.clientWidth + 1, 'No horizontal dialog clipping');
  const tinyTargets = await page.locator('#ms-m4-dialog button').evaluateAll(nodes => nodes.filter(n => n.getBoundingClientRect().height < 43).map(n => n.textContent));
  assert.deepEqual(tinyTargets, []);
  await page.locator('#ms-m4-dialog').evaluate(node => { node.scrollTop = 0; });
  const screenshot = resolve(screenshotDir, `${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: false });
  const heap = await page.evaluate(() => performance.memory ? { usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize } : null);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.getElementById('ms-m4-launcher').getAttribute('aria-expanded') === 'false');
  assert.equal(await page.locator('#ms-m4-dialog').getAttribute('open'), null);
  assert.equal(await page.locator('#ms-m4-launcher').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#ms-m4-launcher').evaluate(node => document.activeElement === node), true);
  return { name, viewport, pageIdentity: true, meaningfulPage: true, overlayAbsent: true, originalCriterionSelection: 24,
    keyboardSelection: true, stepSelection: true, exportActualDownload: true, importForgedPassQuarantined: true,
    wrongSourceImportRejected: true, validViewRoundTrip: true, authoritativeCountsPreserved: true,
    escapeFocusReturn: true, horizontalClippingAbsent: true, minTargetHeightPx: 44,
    selectionLatencyMs: { median: timings.sort((a, b) => a - b)[Math.floor(timings.length / 2)], max: Math.max(...timings) },
    heap, screenshot: `browser-run-${runId}/${name}.png`, screenshotSha256: sha(await readFile(screenshot)) };
};
try {
  for (const [name, viewport] of [['standalone-desktop', { width: 1440, height: 1050 }], ['standalone-mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, isMobile: name.includes('mobile'), hasTouch: name.includes('mobile'), reducedMotion: 'reduce' });
    const page = await context.newPage();
    const consoleIssues = [];
    page.on('console', msg => { if (['error', 'warning'].includes(msg.type())) consoleIssues.push({ type: msg.type(), text: msg.text() }); });
    page.on('pageerror', error => consoleIssues.push({ type: 'pageerror', text: error.message }));
    await page.goto(pathToFileURL(resolve(out, 'standalone.html')).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const result = await checks(page, name, viewport);
    assert.deepEqual(consoleIssues, [], 'Standalone console health');
    results.push({ ...result, consoleIssues, url: page.url(), title: await page.title() });
    await context.close();
  }
  const candidate = value('--candidate', null);
  const baseline = value('--baseline', null);
  const requestedUrl = 'https://project29770.websitepublisher.ai/v0.3.1.html';
  let baselineIssues = [];
  if (baseline) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
    const baselineBytes = await readFile(resolve(baseline));
    await context.route(requestedUrl, route => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: baselineBytes }));
    const page = await context.newPage();
    page.on('console', msg => { if (['error', 'warning'].includes(msg.type())) baselineIssues.push({ type: msg.type(), text: msg.text() }); });
    page.on('pageerror', error => baselineIssues.push({ type: 'pageerror', text: error.message }));
    await page.goto(requestedUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.screenshot({ path: resolve(screenshotDir, 'baseline-desktop.png'), fullPage: false });
    await context.close();
  }
  if (candidate) for (const [name, viewport] of [['candidate-desktop', { width: 1440, height: 1050 }], ['candidate-mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, isMobile: name.includes('mobile'), hasTouch: name.includes('mobile'), reducedMotion: 'reduce' });
    const candidateBytes = await readFile(resolve(candidate));
    await context.route(requestedUrl, route => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: candidateBytes }));
    const page = await context.newPage(); const consoleIssues = [];
    page.on('console', msg => { if (['error', 'warning'].includes(msg.type())) consoleIssues.push({ type: msg.type(), text: msg.text() }); });
    page.on('pageerror', error => consoleIssues.push({ type: 'pageerror', text: error.message }));
    await page.goto(requestedUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const result = await checks(page, name, viewport);
    const panelIssues = consoleIssues.filter(issue => /ms-m4|panel\.js|mathscope-m4/.test(issue.text));
    assert.deepEqual(panelIssues, [], 'No evidence panel runtime issue');
    results.push({ ...result, consoleIssues, inheritedBaselineIssues: baselineIssues,
      panelRuntimeIssues: panelIssues, url: page.url(), title: await page.title(),
      documentLocallyIntercepted: true, remotePageMutated: false, candidateSha256: sha(candidateBytes) });
    await context.close();
  }
  const receipt = { schemaVersion: 'mathscope.m4.browser-qa/1', startedAt, completedAt: new Date().toISOString(),
    browserVersion: browser.version(), fallback: 'Browser plugin not available; cua.getState invocation timed out in the parent task. Explicitly authorized Playwright fallback with installed isolated headless Chrome.',
    dataKind: 'Original mathematical acceptance criteria and dependency sequence; no synthetic scientific measurements',
    scope: 'Additive evidence panel selection, source trace, keyboard/tap, export/import quarantine and local candidate rendering',
    doesNotGrant: ['M3_ORIGINAL_CRITERION_ACCEPTANCE', 'M4_COMPLETE', 'LEAN_KERNEL_PASS', 'LIVE_PUBLICATION_CONFIRMATION'],
    passed: true, results };
  await writeFile(resolve(out, `browser-qa-${runId}.json`), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
  await writeFile(resolve(out, 'browser-qa-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, cases: results.map(x => x.name), receipt: resolve(out, 'browser-qa-receipt.json') }, null, 2));
} catch (error) {
  const failure = { schemaVersion: 'mathscope.m4.browser-qa/1', startedAt, failedAt: new Date().toISOString(), passed: false, error: error.stack, results };
  await writeFile(resolve(out, `browser-failure-${Date.now()}.json`), JSON.stringify(failure, null, 2) + '\n');
  throw error;
} finally { await browser.close(); }
