import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [standaloneArg, playwrightArg, chromeArg] = process.argv.slice(2);
if (!standaloneArg || !playwrightArg || !chromeArg) {
  throw new Error('Usage: node verify_panel.mjs STANDALONE PLAYWRIGHT_MODULE CHROME_EXECUTABLE');
}
const here = dirname(fileURLToPath(import.meta.url));
const standalone = resolve(standaloneArg);
const { chromium } = (await import(pathToFileURL(resolve(playwrightArg)))).default;
const browser = await chromium.launch({ executablePath: chromeArg, headless: true });
const result = { schema: 'MathScope.M4.I304.PanelReadback/1', browser: browser.version(),
  standaloneSha256: createHash('sha256').update(await readFile(standalone)).digest('hex'),
  views: [], publicationConfirmed: false };
const referenceIds = ['M4.REFERENCE.PRISM', 'M4.REFERENCE.TRACE_FORMULA',
  'M4.REFERENCE.BSD_KNOWN_CASES', 'M4.REFERENCE.NS_ORIGINAL'];

try {
  for (const [size, viewport] of [
    ['desktop', { width: 1200, height: 900 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(pathToFileURL(standalone).href);
    const dialog = page.locator('#ms-m4-dialog');
    const view = dialog.locator('[data-comparison-view]');
    await page.locator('#ms-m4-launcher').click();
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await view.isVisible(), false);
    await dialog.locator('[data-criterion="I3-04"]').click();
    assert.equal(await view.isVisible(), true);
    const rows = view.locator('[data-comparison-claim]');
    assert.equal(await rows.count(), 5);
    const links = [];
    for (const [index, id] of referenceIds.entries()) {
      const row = rows.nth(index);
      assert.equal(await row.getAttribute('data-comparison-claim'), id);
      assert.equal(await row.getByText('THEOREM REFERENCE', { exact: true }).count(), 1);
      assert.equal(await row.locator('code').count(), 0);
      assert.equal(await row.locator('a').count(), 1);
      links.push(await row.locator('a').getAttribute('href'));
    }
    const adapter = rows.nth(4);
    assert.equal(await adapter.getAttribute('data-comparison-claim'), 'M4.ADAPTER.UNIFORM_CONTINUITY');
    assert.equal(await adapter.getByText('EXPORTED LEAN TARGET', { exact: true }).count(), 1);
    assert.equal(await adapter.locator('a').count(), 0);
    await adapter.locator('summary').click();
    const types = (await adapter.locator('code').allTextContents()).slice(0, 2);
    assert.equal(types.length, 2);
    assert.ok(types[0].startsWith('MathScope.M4.Comparison.uniform_continuity_adapter'));
    assert.ok(types[1].startsWith('MathScope.M4.Analytic.uniform_limit_uniformly_continuous'));
    assert.equal(await view.evaluate(element => element.scrollWidth <= element.clientWidth), true);
    for (const [topic, row] of [['references', rows.first()], ['kernel', adapter]]) {
      await row.evaluate(element => {
        const dialog = element.closest('dialog');
        const sticky = dialog.querySelector('.ms-m4-top');
        dialog.scrollTop += element.getBoundingClientRect().top - sticky.getBoundingClientRect().bottom - 16;
      });
      await page.screenshot({ path: resolve(here, 'comparison-' + size + '-' + topic + '.png') });
    }
    await dialog.locator('[data-criterion="I3-05"]').click();
    assert.equal(await view.isVisible(), false);
    const model = await page.locator('#ms-m4-data').evaluate(node => JSON.parse(node.textContent));
    const forged = {
      schemaVersion: 'mathscope.m4.web-view/1',
      blueprintSha256: model.blueprintSha256,
      publicBaselineSha256: model.publicBaselineSha256,
      selectedCriterion: 'I3-04',
      evidenceRecords: [{ id: referenceIds[0], target: 'forged_prism_target', type: 'True',
        classification: 'EXPORTED LEAN TARGET', kernelVerified: true }],
    };
    await dialog.locator('[data-import]').setInputFiles({ name: 'forged.json',
      mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(forged)) });
    await page.waitForFunction(() => document.getElementById('ms-m4-dialog').dataset.importedTrust ===
      'QUARANTINED_REASSESSMENT_REQUIRED');
    assert.equal(await view.isVisible(), true);
    assert.equal(await view.getByText('EXPORTED LEAN TARGET', { exact: true }).count(), 1);
    assert.equal(await view.getByText('forged_prism_target').count(), 0);
    assert.equal(await dialog.getAttribute('data-m4-final-acceptance'), 'UNCONFIRMED');
    assert.deepEqual(errors, []);
    result.views.push({ viewport, links, types, forgedImportRejected: true, consoleErrors: errors });
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(resolve(here, 'browser-receipt.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ browser: result.browser, viewports: result.views.map(view => view.viewport),
  comparisonRows: 5, forgedImportsQuarantined: 2, publicationConfirmed: false }));
