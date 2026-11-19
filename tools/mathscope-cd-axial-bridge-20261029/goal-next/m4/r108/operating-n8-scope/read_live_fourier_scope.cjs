'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.MATHSCOPE_PLAYWRIGHT_PACKAGE || 'playwright-core');

const TARGET = 'https://project29770.websitepublisher.ai/v0.3.1.html';
const HTTP_SHA = 'a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48';
const BLOB = 'c572d2ed4399524bdbc665305c6acb9e7d38ee3d';
const RUN = '8bdf584da5121931d1fb7d79416d568c698f5a8211c22d7d600648ea23015b6f';
const sha = data => createHash('sha256').update(data).digest('hex');
const gitBlob = data => createHash('sha1').update('blob ' + data.length + '\0').update(data).digest('hex');

const [file, output] = process.argv.slice(2);
assert.ok(file && output);
const originalBytes = fs.readFileSync(file);
assert.equal(gitBlob(originalBytes), BLOB);
const original = JSON.parse(originalBytes);
assert.equal(original.runHash, RUN);
const xy = [Math.PI / 4, Math.PI / 4];
const sample = original.observations.samples.find(({position}) =>
  position[2] === 0 && Math.abs(position[0] - xy[0]) < 1e-14 && Math.abs(position[1] - xy[1]) < 1e-14
);
assert.ok(sample && Math.hypot(...sample.velocity) > 0.05);
fs.mkdirSync(output, { recursive: true });

function pixel([x, y, z], width, height) {
  const [xn, yn, zn] = [x / Math.PI - 1, y / Math.PI - 1, z / Math.PI - 1];
  const cosineYaw = Math.cos(0.48);
  const sineYaw = Math.sin(0.48);
  const mappedX = cosineYaw * xn - sineYaw * yn;
  const mappedY = sineYaw * xn + cosineYaw * yn;
  const mappedZ = Math.cos(0.56) * zn - Math.sin(0.56) * mappedY;
  return [width / 2 + 157 * mappedX, height / 2 + 140 * mappedZ];
}

async function pick(page, canvas, z, touch) {
  await canvas.scrollIntoViewIfNeeded();
  const client = await canvas.evaluate(element => {
    const r = element.getBoundingClientRect();
    return { left: r.left, top: r.top, cssWidth: r.width, cssHeight: r.height,
             width: element.width, height: element.height };
  });
  const position = [sample.position[0], sample.position[1], z];
  const [x, y] = pixel(position, client.width, client.height);
  const point = [
    client.left + x * client.cssWidth / client.width,
    client.top + y * client.cssHeight / client.height,
  ];
  const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.id, point);
  assert.equal(hit, 'msn8-scene');
  if (touch) {
    await page.touchscreen.tap(point[0], point[1]);
  } else {
    await page.mouse.click(point[0], point[1]);
  }
  const label = await page.locator('#msn8-picked').innerText();
  const coordLine = '좌표 ' + position.map(x => x.toExponential(4)).join(', ');
  assert.ok(label.includes(coordLine), label);
  assert.ok(label.includes('속도 ' + sample.velocity.map(x => x.toExponential(4)).join(', ')), label);
  assert.ok(label.includes('runHash ' + RUN) && label.includes(BLOB));
  assert.match(label, /원식: \(u·∇\)u-νΔu\+∇p, ∇·u=0/);
  assert.match(label, /Lean source-refinement \/ rigorous pointwise error: OPEN/);
  assert.match(label, /FINITE_GALERKIN_ONLY \/ C,D FINAL OPEN/);
  if (z === 0) {
    assert.match(label, /원본 직접 저장된 z=0 벡터/);
  } else {
    assert.match(label, /Fourier kz=0에 따른 정확한 z-방향 확장/);
  }
  return { position, clickAt: point, actualTarget: hit, pickedText: label };
}

async function testViewport(browser, spec) {
  const context = await browser.newContext({
    viewport: spec.viewport, isMobile: spec.mobile, hasTouch: spec.mobile,
    deviceScaleFactor: spec.mobile ? 2 : 1, acceptDownloads: true, serviceWorkers: 'block',
  });
  const blockedMethods = {};
  const pageErrors = [];
  let pageReceipt;
  await context.route('**/*', async route => {
    const method = route.request().method();
    if (route.request().isNavigationRequest() && route.request().url() === TARGET && method === 'GET') {
      // Buffer the live HTTPS response before forwarding it unchanged. Chromium's
      // page inspector evicts this 30 MB body from its response-body cache.
      const response = await route.fetch({ maxRedirects: 0, timeout: 60000 });
      const bytes = await response.body();
      pageReceipt = { bytes: bytes.length, sha256: sha(bytes), status: response.status(), url: response.url() };
      return route.fulfill({ response });
    }
    if (method === 'GET' || method === 'HEAD') return route.continue();
    blockedMethods[method] = (blockedMethods[method] || 0) + 1;
    return route.abort();
  });
  if (typeof context.routeWebSocket === 'function') {
    await context.routeWebSocket('**/*', socket => socket.close());
  }
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(String(error.message).slice(0, 240)));
  try {
    const response = await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 100000 });
    assert.equal(response.status(), 200);
    assert.equal(pageReceipt.status, 200);
    assert.equal(pageReceipt.url, TARGET);
    assert.equal(pageReceipt.sha256, HTTP_SHA);
    const observedAt = new Date().toISOString();
    const status = page.locator('#msn8-source-status');
    await status.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.getElementById('msn8-source-status')
      ?.textContent.includes('SHA-1 MATCH'), undefined, { timeout: 30000 });
    const statusText = await status.innerText();
    assert.ok(statusText.includes(BLOB) && statusText.includes('RELEASE HOLD'));
    const carried = Buffer.from(await page.locator('#msn8-pinned-original-json').textContent());
    assert.ok(carried.equals(originalBytes));
    const observable = page.locator('#msn8-observable');
    await observable.selectOption('vorticity');
    const canvas = page.locator('#msn8-scene');
    const got = [];
    for (const z of [0, Math.PI, 2 * Math.PI]) {
      got.push(await pick(page, canvas, z, spec.mobile));
    }
    const imageFile = path.join(output, spec.name + '-actual.png');
    await canvas.locator('..').screenshot({ path: imageFile });

    const control = page.locator('#msn8-index');
    assert.equal(await control.inputValue(), '31');
    await control.press('Home');
    assert.equal(await control.inputValue(), '0');
    const earlyCaption = await page.locator('#msn8-scene-caption').innerText();
    const earlyStats = await page.locator('#msn8-stats').innerText();
    assert.match(earlyCaption, /독립 벡터 저장\/오차 인증은 아님/);
    assert.match(earlyStats, /해당 프레임의 Fourier 계수 미저장/);
    assert.doesNotMatch(earlyStats, /Curl \/ gradient Parseval: VERIFIED/);
    await control.press('End');
    assert.equal(await control.inputValue(), '31');

    const switcher = page.locator('#msn8-kind');
    await switcher.selectOption('core');
    const proxyCaption = await page.locator('#msn8-scene-caption').innerText();
    const proxyStats = await page.locator('#msn8-stats').innerText();
    assert.match(proxyCaption, /full K 에너지 미수행/);
    assert.match(proxyStats, /원본 runHash를 공유하지 않음/);
    assert.ok(!proxyStats.includes(RUN));
    await switcher.selectOption('tg');
    const trace = page.locator('#ms-n8-live-20261025 details').last();
    await trace.locator('summary').click();
    const traceText = await trace.innerText();
    assert.ok(traceText.includes(RUN) && traceText.includes(BLOB));
    assert.match(traceText, /§N8, p\.65–66/);

    const downloadPending = page.waitForEvent('download');
    await page.locator('#msn8-export').click();
    const download = await downloadPending;
    assert.match(download.suggestedFilename(), /^MathScope_N8_TG_source_run_8bdf584da5\.json$/);
    const downloaded = fs.readFileSync(await download.path());
    assert.ok(downloaded.equals(originalBytes));

    return {
      viewport: spec.viewport, mobile: spec.mobile, observedAt, http: response.status(),
      httpBytes: pageReceipt.bytes, httpSHA256: pageReceipt.sha256, scopePanel: statusText,
      supportedInteractions: { finalFrame: 31, scene: 'vorticity', picks: got,
        earlyFrameNoStoredCoefficients: true, earlyCaption, earlyStats,
        analyticCoreSeparate: true, proxyCaption, proxyStats, traceText,
        output: { filename: download.suggestedFilename(), bytes: downloaded.length,
                  sha256: sha(downloaded), gitBlobSHA1: gitBlob(downloaded) },
      },
      screenshot: { path: path.basename(imageFile), sha256: sha(fs.readFileSync(imageFile)) },
      pageErrors, blockedMethods,
    };
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.MATHSCOPE_CHROMIUM_EXECUTABLE,
    headless: true,
  });
  try {
    const profiles = [
      { name: 'desktop', viewport: { width: 1280, height: 900 }, mobile: false },
      { name: 'mobile', viewport: { width: 390, height: 844 }, mobile: true },
    ];
    const observations = [];
    for (const profile of profiles) observations.push(await testViewport(browser, profile));
    fs.writeFileSync(path.join(output, 'live-scene.json'), JSON.stringify({
      schema: 'MathScope.R1-03.C88.OperatingFiniteScene/1',
      scope: 'NS finite comparator path within R1-03, not whole R1-03 acceptance',
      url: TARGET, chromium: browser.version(), gitBlobSHA1: BLOB, runHash: RUN,
      responseTransport: 'Fresh HTTPS route GET buffered and forwarded byte-identically',
      immutableGitBytes: originalBytes.length, immutableGitSHA256: sha(originalBytes),
      observations, globalRelease: 'HOLD', operatingR108: 'OPEN',
    }, null, 2) + '\n', { flag: 'wx' });
    console.log('PASS living operating finite-scene 2 viewports, 6 actual picks, 2 exact downloads');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
