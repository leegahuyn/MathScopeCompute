const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('node:http');
const { Readable } = require('node:stream');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.MATHSCOPE_PLAYWRIGHT_PATH || 'playwright');

async function verify() {
  const worker = (await import(pathToFileURL(process.argv[2]))).default;
  const server = createServer((request, response) => {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const result = worker.fetch(new Request(origin + request.url, { method: request.method }));
    response.writeHead(result.status, Object.fromEntries(result.headers));
    if (result.body) Readable.fromWeb(result.body).pipe(response);
    else response.end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.MATHSCOPE_CHROME_PATH,
      headless: true,
    });
    const page = await browser.newPage({ viewport: { width: 1250, height: 950 } });
    const attemptedExternalHttp = [];
    await page.route(/^https?:\/\//, async route => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      attemptedExternalHttp.push(url.origin);
      return route.abort();
    });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.addInitScript(() => {
      window.cspViolations = [];
      document.addEventListener('securitypolicyviolation', event => {
        window.cspViolations.push([event.effectiveDirective, event.blockedURI]);
      });
    });
    const response = await page.goto(origin + '/v0.3.1.html', { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200);
    await page.locator('#ms-m4-launcher').click();
    const panel = page.locator('[data-m4-formal-view]');
    await panel.locator(':scope > summary').press('Enter');
    assert.equal(await panel.locator('[data-claim-student]').isVisible(), true);

    const lab = page.locator('#ms-r1-lab');
    const control = key => lab.locator(`[data-r1="${key}"]`);
    await control('input').locator('..').locator('..').locator('summary').click();
    const observed = [];
    for (const fixture of ['su2', 'point']) {
      await control('fixture').selectOption(fixture);
      await control('run').click();
      await page.waitForFunction(() => !document.querySelector('[data-r1="run"]').disabled);
      const status = await lab.getAttribute('data-state');
      assert.equal(status, 'COMPLETED');
      const { inputHash, resultHash, sourceWorkerSHA256 } = JSON.parse(await control('inspect').textContent());
      for (const hash of [inputHash, resultHash, sourceWorkerSHA256]) assert.match(hash, /^[a-f0-9]{64}$/);
      observed.push({ fixture, status, inputHash, resultHash, sourceWorkerSHA256 });
    }
    const cspViolations = await page.evaluate(() => window.cspViolations);
    assert(cspViolations.some(([directive, url]) =>
      directive === 'script-src-elem' && url.startsWith('https://cdn.websitepublisher.ai/')));
    assert.deepEqual(attemptedExternalHttp, []);
    assert.deepEqual(pageErrors, []);
    console.log(JSON.stringify({ chromium: browser.version(), attemptedExternalHttp, pageErrors,
      blockedDirectives: [...new Set(cspViolations.map(([directive]) => directive))], observed }));
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

verify().catch(error => { console.error(error); process.exitCode = 1; });
