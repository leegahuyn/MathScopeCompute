const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { once } = require('node:events');
const { createServer } = require('node:http');
const { readFile, writeFile } = require('node:fs/promises');
const { resolve } = require('node:path');
const { Readable } = require('node:stream');
const { pathToFileURL } = require('node:url');
const { gunzipSync } = require('node:zlib');

const expected = {
  baseline: 'e6ebde6250a861296554f26305cb40200b0a70e822acb3f588e9dca423d6e784',
  candidate: '0504482900dbeac2faf992be9a923bc51ab1de6bcec0b82ac058085444669735',
  worker: 'eacd0e21b85b79f1892182963c77e50248a77e11ac07c1d1f0bc789b57587705',
  patch: '04662c00f3e1c93eedbce8782231433b5a9f7bb60e1bda630475202844e14fe3',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function patch(input, patches, reverse) {
  const expectedInput = reverse ? expected.candidate : expected.baseline;
  const expectedOutput = reverse ? expected.baseline : expected.candidate;
  assert.equal(hash(input), expectedInput, 'exact patch input');
  let output = input;
  for (const p of reverse ? [...patches].reverse() : patches) {
    assert.equal(p.operation, 'replace');
    const find = Buffer.from(reverse ? p.replace : p.find);
    const swap = Buffer.from(reverse ? p.find : p.replace);
    const i = output.indexOf(find);
    assert.ok(i >= 0 && output.indexOf(find, i + find.length) < 0, 'unique patch anchor');
    output = Buffer.concat([output.subarray(0, i), swap, output.subarray(i + find.length)]);
  }
  assert.equal(hash(output), expectedOutput, 'exact patch output');
  return output;
}

async function main() {
  const [workerPath, baselinePath, patchesPath, output, browserSignal] = process.argv.slice(2);
  assert.ok(workerPath && baselinePath && patchesPath && output);
  const workerBytes = await readFile(workerPath);
  assert.equal(hash(workerBytes), expected.worker);
  const patchBytes = await readFile(patchesPath);
  assert.equal(hash(patchBytes), expected.patch);
  const patches = JSON.parse(patchBytes);
  const baseline = gunzipSync(await readFile(baselinePath));
  const worker = (await import(pathToFileURL(resolve(workerPath)))).default;
  const path = '/v0.3.1.html';
  let body = null;
  let origin;
  const server = createServer(async (request, response) => {
    try {
      // Use the actual private worker transport for candidate, and the
      // recovered exact baseline with its same local isolation headers.
      const native = await worker.fetch(new Request(origin + request.url, { method: request.method }));
      response.writeHead(native.status, Object.fromEntries(native.headers));
      if (body && native.ok && request.method === 'GET') {
        await native.body.cancel();
        response.end(body);
      } else if (native.body) Readable.fromWeb(native.body).pipe(response);
      else response.end();
    } catch (error) {
      response.destroy(error);
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
  async function observe(phase, want) {
    const response = await fetch(origin + path, { cache: 'no-store' });
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(hash(bytes), want);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.match(response.headers.get('content-security-policy'), /connect-src 'self'/);
    const launch = bytes.includes(Buffer.from('id="ms-m4-launcher"'));
    const lab = bytes.includes(Buffer.from('id="ms-r1-lab"'));
    assert.ok(launch && lab === (want === expected.candidate));
    const head = await fetch(origin + path, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    return { phase, status: response.status, bytes: bytes.length, sha256: hash(bytes), labMarker: lab, launcherMarker: launch,
      cacheControl: response.headers.get('cache-control'), headStatus: head.status };
  }
  try {
    const steps = [await observe('original-candidate-worker', expected.candidate)];
    const candidate = patch(baseline, patches, false);
    body = patch(candidate, patches, true);
    assert.ok(body.equals(baseline));
    steps.push(await observe('served-rollback', expected.baseline));
    assert.throws(() => patch(body, patches, true), /exact patch input/);
    const corrupted = Buffer.from(candidate);
    corrupted[0] ^= 1;
    assert.throws(() => patch(corrupted, patches, true), /exact patch input/);
    assert.ok(patch(body, patches, false).equals(candidate));
    body = null;
    steps.push(await observe('served-candidate-again', expected.candidate));
    const result = { schema: 'MathScope.R108.IsolatedArchivedWorkerRoundTrip/1', status: 'VERIFIED_LOOPBACK_CANDIDATE_ROLLBACK_REDEPLOY',
      route: path, stages: steps, inputPins: expected, patches: patches.length,
      wrongGenerationRollbackRejected: true, corruptCandidateRollbackRejected: true,
      scope: 'Original candidate Worker and exact reversed historical baseline served under a common loopback URL. This is separate from the operating WebsitePublisher page and provider version restore.',
      liveDeploymentPerformed: false, operatingR108: 'OPEN', release: 'HOLD' };
    await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ status: result.status, sha256: hash(await readFile(output)) }));
    if (browserSignal) {
      await writeFile(browserSignal, JSON.stringify({ origin, path, phase: 'candidate' }) + '\n', { flag: 'wx' });
      // Terminal input switches the loopback response under the same URL.
      process.stdin.setEncoding('utf8');
      for await (const input of process.stdin) {
        const action = input.trim();
        if (action === 'stop') break;
        if (action === 'baseline') body = baseline;
        if (action === 'candidate') body = null;
        if (['baseline', 'candidate'].includes(action)) console.log(JSON.stringify(await observe(action, expected[action])));
      }
    }
  } finally {
    server.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
