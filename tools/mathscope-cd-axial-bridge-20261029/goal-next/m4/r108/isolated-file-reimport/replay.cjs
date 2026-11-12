/** Exercise export and file-input reimport in the immutable private candidate. */
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {readFileSync, writeFileSync} = require('node:fs');
const {resolve} = require('node:path');

const [file, playwright, chrome, out] = process.argv.slice(2);
assert(file && playwright && chrome && out, 'Supply candidate HTML, Playwright module, Chrome and output JSON');
const {chromium} = require(resolve(playwright));
const bytes = readFileSync(file);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(bytes), '0504482900dbeac2faf992be9a923bc51ab1de6bcec0b82ac058085444669735');
const url = 'http://127.0.0.1:49173/isolated-file-reimport.html';
const textHas = async (page, text) => page.waitForFunction(
  expected => document.querySelector('[data-r1="status"]').textContent.includes(expected), text,
  {timeout: 60_000});

async function main() {
  const browser = await chromium.launch({headless: true, executablePath: chrome});
  try {
    const page = await browser.newPage({viewport: {width: 1330, height: 900}, acceptDownloads: true});
    const pageErrors = [];
    const rows = [];
    let blocked = 0;
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.route('**/*', route => {
      const request = route.request();
      if (request.url() === url && request.method() === 'GET') {
        return route.fulfill({body: bytes, contentType: 'text/html; charset=utf-8'});
      }
      blocked++;
      return route.abort();
    });
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 90_000});
    await page.locator('#ms-m4-launcher').click();
    const control = key => page.locator('[data-r1="' + key + '"]');
    const inspect = async () => JSON.parse(await control('inspect').textContent());
    const reimport = (name, buffer) => control('import').setInputFiles({name, mimeType: 'application/json', buffer});
    let pointFile;
    let pointResult;
    for (const fixture of ['su2', 'point']) {
      await control('fixture').selectOption(fixture);
      await control('run').click();
      await page.waitForFunction(() => document.querySelector('#ms-r1-lab').dataset.state === 'COMPLETED',
        undefined, {timeout: 60_000});
      const before = await inspect();
      const [download] = await Promise.all([page.waitForEvent('download'), control('export').click()]);
      const parts = [];
      for await (const part of await download.createReadStream()) parts.push(part);
      const exported = Buffer.concat(parts);
      const bundle = JSON.parse(exported);
      assert.equal(bundle.formalPass, false);
      assert.equal(bundle.fixtureId, fixture);
      assert.equal(bundle.bundle.inputHash, before.inputHash);
      assert.equal(bundle.bundle.mathematicalHash, before.resultHash);
      await reimport(fixture + '.json', exported);
      await textHas(page, '재계산 MATCH');
      const after = await inspect();
      assert.equal(after.inputHash, before.inputHash);
      assert.equal(after.resultHash, before.resultHash);
      assert.notEqual(after.jobId, before.jobId);
      rows.push({fixture, beforeJob: before.jobId, afterJob: after.jobId, inputHash: after.inputHash,
        resultHash: after.resultHash, sourceWorkerSHA256: after.sourceWorkerSHA256, status: 'MATCH'});
      if (fixture === 'point') {
        pointFile = exported;
        pointResult = after;
      }
    }
    await reimport('invalid.json', Buffer.from('{'));
    await textHas(page, '거부 또는 실행 실패');
    assert.equal((await inspect()).resultHash, pointResult.resultHash);
    const editor = control('input');
    await editor.locator('xpath=ancestor::details[1]').locator('summary').click();
    const original = await editor.inputValue();
    await editor.fill(original + ' ');
    await reimport('point-dirty.json', pointFile);
    await textHas(page, 'EDITED_INPUT_PRESERVED');
    assert.equal(await editor.inputValue(), original + ' ');
    const changed = JSON.parse(original);
    changed.input.p = '5';
    await editor.fill(JSON.stringify(changed, null, 2));
    await control('apply').click();
    await reimport('point-stale.json', pointFile);
    await textHas(page, '다른 입력: STALE');
    assert.equal((await inspect()).state, 'STALE');
    assert.equal(await page.locator('#ms-r1-lab').getAttribute('data-state'), 'STALE');
    assert.equal(JSON.parse(await editor.inputValue()).input.p, '5');
    const result = {
      status: 'PASS_TWO_ISOLATED_BROWSER_REIMPORTS',
      candidateSHA256: sha(bytes), browser: browser.version(), rows,
      invalidFilePreservesResult: true, unappliedEditPreserved: true, differentInputResultState: 'STALE',
      editedInputPrimeAfterStale: '5', blocked, pageErrors,
      nativeOSFileChooserTested: false, hostedOrOperationalR108: 'OPEN', release: 'HOLD',
    };
    writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
    console.log('PASS two isolated file reimports, malformed and stale controls');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
