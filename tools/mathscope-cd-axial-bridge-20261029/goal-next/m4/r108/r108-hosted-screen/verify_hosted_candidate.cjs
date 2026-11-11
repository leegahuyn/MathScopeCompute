const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.MATHSCOPE_PLAYWRIGHT_PATH || 'playwright-core');

const [site, output, localCandidate] = process.argv.slice(2);
const origin = new URL(site).origin;
const entry = new URL('/v0.3.1.html', origin).href;
const expected = '0504482900dbeac2faf992be9a923bc51ab1de6bcec0b82ac058085444669735';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function checkedPayload(response, candidate, token) {
  let prefix = 0;
  while (prefix < candidate.length && candidate[prefix] === response[prefix]) prefix++;
  const insertedLength = response.length - candidate.length;
  const inserted = response.subarray(prefix, prefix + insertedLength);
  const suffix = response.subarray(prefix + insertedLength);
  assert.ok(insertedLength >= 0 && suffix.equals(candidate.subarray(prefix)),
    'Hosted response differs outside one insertion. Raw SHA-256 ' + hash(response));
  assert.ok(!inserted.includes(Buffer.from(token)), 'Provider insertion contains a credential');
  return { bytes: response.length, sha256: hash(response), candidateSHA256: hash(candidate),
    providerInsertion: { at: prefix, bytes: insertedLength, sha256: hash(inserted),
      htmlComment: inserted.subarray(0, 4).toString() === '<!--' } };
}

async function readHiddenLine() {
  const input = process.stdin;
  if (input.isTTY) input.setRawMode(true);
  input.setEncoding('utf8');
  process.stderr.write('Ready for owner verification credential on hidden stdin.\n');
  try {
    let line = '';
    for await (const chunk of input) {
      line += chunk;
      if (/[\r\n]/.test(line)) return line.trim();
      if (line.length > 16384) throw new Error('Credential input too long');
    }
    throw new Error('Missing credential');
  } finally {
    if (input.isTTY) input.setRawMode(false);
  }
}

async function main() {
  const token = await readHiddenLine();
  const credential = 'Bearer ' + token;
  const headers = { 'OAI-Sites-Authorization': credential };
  const anonymous = await fetch(entry, { redirect: 'manual' });
  const location = anonymous.headers.get('location');
  const anonymousBytes = Buffer.from(await anonymous.arrayBuffer());
  const anonymousReadback = {
    status: anonymous.status,
    redirectOrigin: location ? new URL(location, entry).origin : null,
    candidateReturned: hash(anonymousBytes) === expected,
  };
  assert.ok(!anonymousReadback.candidateReturned && [302, 303, 307, 308, 401, 403].includes(anonymousReadback.status),
    'Anonymous request should be denied or directed to authentication');

  const http = await fetch(entry, { headers, redirect: 'manual' });
  assert.equal(http.status, 200, 'Owner-authenticated HTTP status was ' + http.status);
  const exactBytes = Buffer.from(await http.arrayBuffer());
  const canonical = await fs.readFile(localCandidate);
  assert.equal(hash(canonical), expected);
  const httpPayload = checkedPayload(exactBytes, canonical, token);
  console.log(JSON.stringify({ checkedHttp: { status: http.status, ...httpPayload } }));
  const contentType = http.headers.get('content-type');
  assert.match(contentType, /text\/html/);
  assert.match(http.headers.get('content-security-policy'), /worker-src 'self' blob:/);

  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.MATHSCOPE_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 950 }, serviceWorkers: 'block' });
    const attemptedExternalHttp = [];
    await context.route(/^https?:\/\//, async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== origin) {
        attemptedExternalHttp.push(url.origin);
        return route.abort();
      }
      if (request.url() === entry && request.resourceType() === 'document') {
        return route.continue({ headers: { ...request.headers(), ...headers } });
      }
      return route.continue();
    });

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(entry, { waitUntil: 'domcontentloaded', timeout: 90000 });
    assert.equal(response.status(), 200, 'Authenticated browser status was ' + response.status());
    const browserURL = new URL(page.url());
    assert.equal(browserURL.origin, origin, 'Browser left the candidate origin for ' + browserURL.origin);
    console.log(JSON.stringify({ browserNavigation: { pathname: browserURL.pathname, responsePathname: new URL(response.url()).pathname } }));
    const browserContentType = await response.headerValue('content-type');
    assert.match(browserContentType, /text\/html/);
    assert.match(await response.headerValue('content-security-policy'), /worker-src 'self' blob:/);

    const viewports = [];
    async function capture(filename, width, height) {
      await page.setViewportSize({ width, height });
      const bytes = await page.screenshot({ path: path.join(output, filename) });
      viewports.push({ width, height, filename, sha256: hash(bytes) });
    }
    await page.locator('[data-view-target="research-extensions"]').click();
    const hold = page.getByText('RESEARCH EXTENSION · RELEASE HOLD', { exact: true });
    await hold.waitFor({ state: 'visible' });
    await hold.scrollIntoViewIfNeeded();
    const holdText = await hold.innerText();
    await capture('desktop-global-hold.png', 1280, 950);
    const boardLauncher = page.locator('#ms-m4-launcher');
    await boardLauncher.focus();
    await boardLauncher.press('Enter');
    const board = page.locator('#ms-m4-dialog');
    await board.waitFor({ state: 'visible' });
    await board.locator('[data-catalog]').getByText(/R1-08/).first().click();
    const inspector = board.locator('[data-inspector]');
    const boardText = await inspector.innerText();
    assert.match(boardText, /범위별 릴리스 판정/);
    assert.match(boardText, /HOLD/);
    const historicalModuleStatus = await board.locator('.ms-m4-baseline').innerText();
    await inspector.getByRole('heading', { name: /범위별 릴리스 판정/ }).scrollIntoViewIfNeeded();
    await capture('desktop-r108.png', 1280, 950);
    await page.setViewportSize({ width: 390, height: 844 });
    await inspector.getByRole('heading', { name: /범위별 릴리스 판정/ }).scrollIntoViewIfNeeded();
    await capture('mobile-r108.png', 390, 844);
    await page.setViewportSize({ width: 1280, height: 950 });
    const panel = page.locator('[data-m4-formal-view]');
    await panel.locator(':scope > summary').press('Enter');
    assert.equal(await panel.locator('[data-claim-student]').isVisible(), true, 'Formal claim was not visible');
    const lab = page.locator('#ms-r1-lab');
    const control = key => lab.locator('[data-r1="' + key + '"]');
    await control('input').locator('..').locator('..').locator('summary').click();
    const fixtures = [];
    for (const fixture of ['su2', 'point']) {
      await control('fixture').selectOption(fixture);
      await control('run').click();
      await page.waitForFunction(() => !document.querySelector('[data-r1="run"]').disabled);
      const status = await lab.getAttribute('data-state');
      assert.equal(status, 'COMPLETED', fixture + ' did not complete');
      const { inputHash, resultHash, sourceWorkerSHA256 } = JSON.parse(await control('inspect').textContent());
      for (const sha of [inputHash, resultHash, sourceWorkerSHA256]) assert.match(sha, /^[a-f0-9]{64}$/);
      fixtures.push({ fixture, status, inputHash, resultHash, sourceWorkerSHA256 });
    }
    const filename = 'desktop-fixture.png';
    viewports.push({ name: 'desktop-fixture', width: 1280, height: 950, filename,
      sha256: hash(await page.screenshot({ path: path.join(output, filename) })) });
    assert.deepEqual(attemptedExternalHttp, []);
    assert.deepEqual(errors, []);
    const record = {
      observedUtc: new Date().toISOString(), entry, browser: browser.version(),
      access: { authenticatedBySitesDispatch: true, anonymous: anonymousReadback },
      http: { status: http.status, contentType, ...httpPayload },
      browserHttp: { status: response.status(), path: new URL(response.url()).pathname,
        contentType: browserContentType },
      title: await page.title(), selectedCriterion: 'R1-08',
      releaseHoldVisible: true, holdText, historicalModuleStatus, boardText, fixtures, viewports,
      attemptedExternalHttp, errors, responseSubstitution: false,
    };
    await fs.writeFile(path.join(output, 'actual-post-publication-screen.json'), JSON.stringify(record, null, 2) + '\n');
    console.log(JSON.stringify({ authenticated: record.http, anonymous: anonymousReadback, fixtures,
      selectedCriterion: record.selectedCriterion, viewports: viewports.length, releaseHoldVisible: true }));
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error.name + ': ' + String(error.message).split('\n')[0]);
  process.exitCode = 1;
});
