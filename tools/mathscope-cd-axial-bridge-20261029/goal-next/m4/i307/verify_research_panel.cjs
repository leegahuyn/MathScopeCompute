const assert = require('node:assert/strict');
const { readFileSync, writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { join, resolve } = require('node:path');
const { chromium } = require(process.env.MATHSCOPE_PLAYWRIGHT_PATH || 'playwright');

const root = resolve(process.argv[2]);
const out = resolve(process.argv[3]);
const bytes = readFileSync(join(root, 'built/candidate.html'));
const manifest = JSON.parse(readFileSync(join(root, 'built/manifest.json')));
const audit = JSON.parse(readFileSync(join(root, 'I3-07_RECEIPT.json')));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(bytes), manifest.candidateSHA256);
assert.equal(manifest.unrelatedBytesPreserved, true);
assert.equal(manifest.reversible, true);

async function verify() {
  const browser = await chromium.launch({ executablePath: process.env.MATHSCOPE_CHROME_PATH, headless: true });
  const views = [];
  try {
    for (const viewport of [{width:1200,height:900},{width:390,height:844}]) {
      const page = await browser.newPage({viewport});
      try {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const url = 'http://127.0.0.1:39157/research-boundaries.html';
        await page.route('**/*', route => route.request().url() === url
          ? route.fulfill({ body: bytes, contentType: 'text/html; charset=utf-8' })
          : route.abort());
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.locator('#ms-m4-launcher').click();
        const list = page.locator('[data-r1="research-boundaries"]');
        const summary = list.locator('..').locator('summary');
        await summary.focus();
        await summary.press('Enter');
        assert.equal(await list.isVisible(), true);
        const rows = await list.locator('li').evaluateAll(items => items.map(item => ({
          id:item.dataset.researchClaim,
          label:item.querySelector('strong').textContent,
          status:item.querySelector('p').textContent,
          scope:item.querySelector('p:last-child').textContent,
        })));
        assert.deepEqual(rows, audit.researchBoundaries.map(({ releaseOpen, ...row }) => row));
        assert.deepEqual(errors, []);
        const panel = page.locator('#ms-m4-dialog');
        const overflow = await panel.evaluate(el => el.scrollWidth - el.clientWidth);
        assert(overflow <= 1, JSON.stringify({overflow,viewport}));
        views.push({ viewport, summaryText: await summary.textContent(), keyboardExpanded:true,
          visible:true, rows, errors, overflow });
      } finally {
        await page.close();
      }
    }
    writeFileSync(out, JSON.stringify({ schema:'MathScope.M4.I307.BrowserReadback/1',
      verdict:'PASS_RELEASE_LAB_RESEARCH_STATUS', chromium:browser.version(),
      candidateSHA256:manifest.candidateSHA256, baselineSHA256:manifest.baseSHA256,
      deployment:false, views }, null, 2) + '\n');
    console.log('I3-07 six matching research/model rows visible and keyboard expandable in both viewports');
  } finally {
    await browser.close();
  }
}
verify().catch(error => { console.error(error); process.exitCode = 1; });
