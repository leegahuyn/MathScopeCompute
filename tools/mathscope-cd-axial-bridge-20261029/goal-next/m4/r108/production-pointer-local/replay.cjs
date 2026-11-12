/** Read-only reproduction from the pinned public HTTP response. */
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {readFileSync, writeFileSync, mkdirSync} = require('node:fs');
const {createServer} = require('node:http');
const {join, resolve} = require('node:path');

const [input, playwright, chrome, out] = process.argv.slice(2);
assert(input && playwright && chrome && out, 'Provide the HTTP snapshot, Playwright module, Chrome and output directory');
const {chromium} = require(resolve(playwright));
const bytes = readFileSync(input);
const digest = createHash('sha256').update(bytes).digest('hex');
assert.equal(digest, 'a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48');

const patch = '@media (min-width: 701px) { #ms32-open { bottom: 70px !important; } }';
const ids = [
  ['ms32-open', 'ms32-dialog', '#ms32-close'],
  ['ms-m4-launcher', 'ms-m4-dialog', '#ms-m4-dialog button[data-close]'],
];
const viewports = [
  ['mobile', 390, 844], ['breakpoint', 701, 900], ['tablet', 768, 900],
  ['small-desktop', 1024, 768], ['desktop', 1280, 900], ['wide', 1920, 1080],
];
const server = createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/v0.3.1.html') {
    response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}).end(bytes);
  } else {
    response.writeHead(404).end();
  }
});

async function centers(page) {
  return Promise.all(ids.map(([id]) => page.locator('#' + id).evaluate(element => {
    const {x, y, width, height} = element.getBoundingClientRect();
    const hit = document.elementFromPoint(x + width / 2, y + height / 2);
    return {id: element.id, rect: {x, y, width, height}, centerHit: hit?.closest('button')?.id ?? hit?.id};
  })));
}

async function main() {
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
  const url = 'http://127.0.0.1:' + server.address().port + '/v0.3.1.html';
  const browser = await chromium.launch({headless: true, executablePath: chrome});
  const rows = [];
  try {
    for (const [label, width, height] of viewports) {
      const page = await browser.newPage({viewport: {width, height}});
      let blocked = 0;
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.route('**/*', route => {
        const request = route.request();
        if (request.url() === url && request.method() === 'GET') return route.continue();
        blocked++;
        return route.abort();
      });
      await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 90_000});
      await page.locator('#ms32-open').waitFor();
      const before = await centers(page);
      assert.equal(before[0].centerHit, width >= 701 ? 'ms-m4-launcher' : 'ms32-open');
      await page.addStyleTag({content: patch});
      const after = await centers(page);
      assert.deepEqual(after.map(row => row.centerHit), ids.map(([id]) => id));
      for (const [launcher, dialog, close] of ids) {
        await page.locator('#' + launcher).click();
        await page.locator('#' + dialog).waitFor({state: 'visible'});
        await page.locator(close).click();
        await page.locator('#' + dialog).waitFor({state: 'hidden'});
      }
      const image = join(out, label + '.png');
      await page.screenshot({path: image});
      rows.push({label, width, height, before, after, dialogsOpenedAndClosed: ids.length, blocked, pageErrors});
      await page.close();
    }
    const receipt = {
      status: 'VERIFIED_LOCAL_PUBLIC_SNAPSHOT_POINTER_FIX', baselineSHA256: digest, baselineBytes: bytes.length,
      patch, browser: browser.version(), rows,
      published: false, outboundNetworkTested: false, operationalR108: 'OPEN', release: 'HOLD',
    };
    writeFileSync(join(out, 'replay.json'), JSON.stringify(receipt, null, 2) + '\n');
    console.log('PASS pointer targets and open/close in', rows.length, 'viewports');
  } finally {
    await browser.close();
  }
}

mkdirSync(out, {recursive: true});
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => server.close());
