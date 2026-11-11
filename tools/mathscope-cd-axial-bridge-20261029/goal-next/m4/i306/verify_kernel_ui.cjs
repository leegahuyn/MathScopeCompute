const assert = require('node:assert/strict');
const { readFileSync, writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { join, resolve } = require('node:path');
const { chromium } = require(process.env.MATHSCOPE_PLAYWRIGHT_PATH || 'playwright');
const out = resolve(process.argv[2]);
const sha = value => createHash('sha256').update(value).digest('hex');
const bytes = readFileSync(join(out, 'candidate.html'));
const build = JSON.parse(readFileSync(join(out, 'browser-build.json')));
assert.equal(sha(bytes), build.candidateSHA256);

async function check() {
  const browser = await chromium.launch({ executablePath: process.env.MATHSCOPE_CHROME_PATH, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1250, height: 950 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = 'http://127.0.0.1:39147/candidate.html';
    await page.route('**/*', route => route.request().url() === url
      ? route.fulfill({ body: bytes, contentType: 'text/html; charset=utf-8' })
      : route.abort());
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.locator('#ms-m4-launcher').click();
    const panel = page.locator('[data-r1="kernel"]');
    await panel.locator('..').locator('summary').click();
    assert.equal(await panel.isVisible(), true);
    const data = JSON.parse(await panel.innerText());
    assert.equal(data.run.databaseId, 42998472759);
    const pinned = data.pinned.targets.find(target => target.target.endsWith('.selected_gap_excludes_interval'));
    const core = data.core.targets.find(target => target.target.endsWith('.assumed_cauchy_limit'));
    assert.equal(pinned.grade, 'CONDITIONAL_FORMAL');
    assert(pinned.axioms.includes('MathScope.M0.Conditional.selectedSpectrum'));
    assert(pinned.axioms.includes('MathScope.M0.Conditional.userAssumedGapAtOne'));
    assert.equal(core.grade, 'USER_AXIOM_CONDITIONAL');
    assert.deepEqual(core.userAxioms, ['MathScope.M4.Conditional.assumedComplete']);
    assert.deepEqual(errors, []);
    writeFileSync(join(out, 'browser-result.json'), JSON.stringify({
      verdict: 'PASS_VISIBLE_USER_AXIOMS', runId: data.run.databaseId,
      candidateSHA256: build.candidateSHA256, chromiumVersion: browser.version(),
      title: await page.title(), visible: await panel.isVisible(), pinned, core, errors,
      scope: 'Reversible release-lab candidate based on the archived v103 page.'
    }, null, 2) + '\n');
    console.log('I3-06 conditional grades and actual user axioms visible in the release lab');
  } finally {
    await browser.close();
  }
}
check().catch(error => { console.error(error); process.exitCode = 1; });
