const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { chromium } = require(process.env.MATHSCOPE_PLAYWRIGHT_PATH || 'playwright');

const root = resolve(process.argv[2]);
const read = name => readFileSync(join(root,name));
const bytes = read('built/candidate.html');
const manifest = JSON.parse(read('built/manifest.json'));
const expected = JSON.parse(read('model.json'));
const audit = JSON.parse(read('I3-08_RECEIPT.json'));
const digest = input => createHash('sha256').update(input).digest('hex');
assert.equal(digest(bytes), manifest.candidateSHA256);
assert.equal(manifest.reversible && manifest.unrelatedBytesPreserved, true);

async function verify() {
  const browser = await chromium.launch({ executablePath: process.env.MATHSCOPE_CHROME_PATH, headless:true });
  const views = [];
  try {
    for (const viewport of [{width:1200,height:900}, {width:390,height:844}]) {
      const page = await browser.newPage({ viewport });
      try {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const url = 'http://127.0.0.1:39157/claim-parity.html';
        await page.route('**/*', route => route.request().url() === url
          ? route.fulfill({ body: bytes, contentType:'text/html; charset=utf-8' })
          : route.abort());
        await page.goto(url, { waitUntil:'domcontentloaded', timeout:120000 });
        await page.locator('#ms-m4-launcher').click();
        const pane = page.locator('[data-m4-formal-view]');
        const item = name => pane.locator('[data-claim-' + name + ']');
        const text = name => item(name).textContent();
        const summary = pane.locator(':scope > summary');
        await summary.focus();
        await summary.press('Enter');
        assert.equal(await item('student').isVisible(), true);
        assert.equal(await item('picker').inputValue(), 'M4.ANALYTIC.UNIFORM_LIMIT_CONTINUITY');
        assert.equal(await item('expert').getAttribute('open'), null);
        await item('expert').locator('summary').press('Enter');
        assert.equal(await item('type').isVisible(), true);
        assert.deepEqual(await page.locator('#ms-r1-data').evaluate(el => JSON.parse(el.textContent).formalClaims), expected);
        const seen = [];
        for (const claim of expected.claims) {
          await item('picker').selectOption(claim.claimId);
          assert.equal(await item('student').getAttribute('data-selected-claim-id'), claim.claimId);
          assert.equal(await item('expert').getAttribute('data-selected-claim-id'), claim.claimId);
          assert.equal(await text('id'), claim.claimId + ' · ' + claim.grade);
          assert.equal(await text('scope'), claim.shared.scope);
          assert.equal(await text('quantifier'), claim.shared.quantifier);
          assert.equal(await text('approximation'), claim.shared.approximationScope);
          assert.equal(await text('assumptions'), claim.shared.assumptionIds.join(', ') || '없음');
          assert.equal(await text('explanation'), claim.student.explanation);
          assert.equal(await text('example'), claim.student.example || '');
          assert.equal(await item('example').isVisible(), claim.student.example !== null);
          assert.equal(await text('type'), claim.expert.targetType);
          assert.equal(await text('axioms'), claim.expert.axioms.join(', ') || '없음');
          assert.equal(await text('source'), claim.sourceFile);
          assert.equal(await text('counterexample'), claim.expert.counterexampleCondition);
          assert.equal(await text('receipt'), audit.kernelReceiptSHA256);
          seen.push(claim.claimId);
        }
        const selected = await item('picker').inputValue();
        const typeBeforeImport = await text('type');
        const m4data = await page.locator('#ms-m4-data').evaluate(el => JSON.parse(el.textContent));
        const file = { schemaVersion:'mathscope.m4.web-view/1',
          blueprintSha256:m4data.blueprintSha256, publicBaselineSha256:m4data.publicBaselineSha256,
          selectedCriterion:'I3-08', evidenceRecords:[{claimId:selected, targetType:'True', assumptions:[], kernelVerified:true}] };
        const dialog = page.locator('#ms-m4-dialog');
        await dialog.locator('[data-import]').setInputFiles({name:'forged-i308.json',mimeType:'application/json',
          buffer:Buffer.from(JSON.stringify(file))});
        await page.waitForFunction(() => document.getElementById('ms-m4-dialog').dataset.importedTrust === 'QUARANTINED_REASSESSMENT_REQUIRED');
        assert.equal(await item('picker').inputValue(), selected);
        assert.equal(await text('type'), typeBeforeImport);
        assert.equal(await dialog.getAttribute('data-m4-final-acceptance'), 'UNCONFIRMED');
        assert.equal(await page.locator('[data-r1="research-boundaries"] li').count(), 6);
        const overflow = await dialog.evaluate(el => el.scrollWidth - el.clientWidth);
        assert(overflow <= 1, JSON.stringify({overflow,viewport}));
        assert.deepEqual(errors, []);
        views.push({viewport, keyboardOpenedBothViews:true, exactClaimIds:seen, rejectedForgedImport:true,
          researchRowsPreserved:6, errors, overflow});
      } finally {
        await page.close();
      }
    }
    const result = { schema:'MathScope.M4.I308.BrowserReadback/1', chromium:browser.version(),
      candidateSHA256:manifest.candidateSHA256, baselineSHA256:manifest.baseSHA256, views,
      publicationConfirmed:false, verdict:'PASS_STUDENT_AND_EXPERT_BROWSER_PARITY' };
    writeFileSync(join(root,'browser-receipt.json'), JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify({viewports:views.length, exactClaimsPerViewport:views[0].exactClaimIds.length,
      verdict:result.verdict}));
  } finally {
    await browser.close();
  }
}
verify().catch(error => { console.error(error); process.exitCode = 1; });
