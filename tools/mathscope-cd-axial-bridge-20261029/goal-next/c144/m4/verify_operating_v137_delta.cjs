'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const sha = (bytes, algorithm = 'sha256') => crypto.createHash(algorithm).update(bytes).digest('hex');
const files = {
  'actual_natural_view.fragment.html': 'b52f0c3b50d809d27802c7a2ba177836fc77b009',
  'actual_natural_view.js': '771030bc5a8a6bc139ef93667ee3c45d0db7a92c',
  'original_actual_natural_values.py': '4c9b59cc1774980e33bd979e4cf94fdf5be1889f',
  'ACTUAL_NATURAL_VALUES_20261027_KO.md': 'f10b7f1c4f910d1a3d164249e9dff3c9595c3573',
};
const naturalSource = '093db151718a206b14b5c4f878a52957626f0ea7';
const source = {};
for (const [file, object] of Object.entries(files)) {
  const content = fs.readFileSync(path.join(__dirname, file));
  const git = sha(Buffer.concat([Buffer.from('blob ' + content.length + '\0'), content]), 'sha1');
  assert.equal(git, object, file);
  source[file] = { content, git, sha256: sha(content), bytes: content.length };
}

const publicPath = process.argv[2] ?? path.resolve(__dirname, '../../continuation143/production-public.html');
const published = fs.readFileSync(publicPath);
const publishedHash = 'a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48';
assert.equal(published.length, 30707818);
assert.equal(sha(published), publishedHash);
const publicHtml = published.toString('utf8');
assert(Buffer.from(publicHtml).equals(published), 'byte-exact UTF-8');

function locateUnique(haystack, marker) {
  const start = haystack.indexOf(marker);
  assert(start >= 0, 'missing marker');
  assert.equal(haystack.indexOf(marker, start + 1), -1, 'nonunique marker');
  return start;
}

function canonical(value) {
  if (typeof value === 'string') {
    return JSON.stringify(value).replace(/[^\x20-\x7e]/g, c =>
      '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  }
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    assert(keys.every(key => /^[\x20-\x7e]*$/.test(key)), 'canonical key outside ASCII');
    return '{' + keys.map(key => canonical(key) + ':' + canonical(value[key])).join(',') + '}';
  }
  if (typeof value === 'number') assert(Number.isSafeInteger(value), 'canonical unsafe number');
  return JSON.stringify(value);
}

function readRun(id, expectedBytes, fileHash, runHash) {
  const prefix = '<script id="' + id + '"';
  const open = locateUnique(publicHtml, prefix);
  const from = publicHtml.indexOf('>', open) + 1;
  const to = publicHtml.indexOf('</script>', from);
  assert(from > open && to > from);
  const encoded = publicHtml.slice(from, to).trim();
  const bytes = Buffer.from(encoded, 'base64');
  assert.equal(bytes.toString('base64'), encoded, id);
  assert.equal(bytes.length, expectedBytes, id);
  assert.equal(sha(bytes), fileHash, id);
  const { run_hash_sha256: declared, ...unsigned } = JSON.parse(bytes.toString('utf8'));
  assert.equal(declared, runHash, id);
  const canonicalBytes = Buffer.from(canonical(unsigned));
  assert.equal(sha(canonicalBytes), runHash, id);
  const corrupted = Buffer.from(canonicalBytes);
  corrupted[corrupted.length - 1] ^= 1;
  assert.notEqual(sha(corrupted), runHash, id);
  return { id, bytes: bytes.length, fileHash, runHash, encoded, unsigned };
}

const natural = readRun('ms-natural-payload', 207508,
  'effecd401e17b760352863b1de63da4d11a6d950a7618c2e6fc4004bd0ec5c21',
  '9f9118b26f7f83bc5f36b1c29781c780caa2b807100e160e57925b80a66ac2a5');
const brho = readRun('ms-brho-payload', 20516,
  'ab77fe0dc5a441bd0ab98aaf61fa8852afb7c7739d5a2700ab1058d8bc7ab9a0',
  '9606baa9369803217bc620436c2c06f4ad6c4667cc7deb94c93bb6aa32d39f21');
const pressure = readRun('ms-a21-payload', 81741,
  '0154d1501368c9551ad63942ae7fae2438c2bd9a23495634491cdfda55286ecd',
  '148b63ed06fa43fad880d8c4f5aedaf3a480bdd4a56f21746e3c0acbdc7697f9');
assert.equal(natural.unsigned.whole_Brho_file_sha256, brho.fileHash);
assert.equal(natural.unsigned.whole_Brho_run_hash_sha256, brho.runHash);
assert.equal(natural.unsigned.pressure_file_sha256, pressure.fileHash);
assert.equal(natural.unsigned.pressure_run_hash_sha256, pressure.runHash);
assert.equal(brho.unsigned.pressure_file_sha256, pressure.fileHash);
assert.equal(brho.unsigned.pressure_run_hash_sha256, pressure.runHash);

assert.equal(natural.unsigned.implementation_sha256, source['original_actual_natural_values.py'].sha256);
assert.equal(natural.unsigned.written_proof_sha256, source['ACTUAL_NATURAL_VALUES_20261027_KO.md'].sha256);
const filledFragment = Buffer.from(source['actual_natural_view.fragment.html'].content.toString('utf8')
  .replaceAll('__NATURAL_FILE_SHA__', natural.fileHash)
  .replaceAll('__NATURAL_RUN_HASH__', natural.runHash)
  .replaceAll('__NATURAL_SOURCE_COMMIT__', naturalSource)
  .replaceAll('__NATURAL_PAYLOAD_BASE64__', natural.encoded));

const start = locateUnique(published, '<style id="ms-natural-style">');
const end = locateUnique(published, '<style id="ms-a21-style">');
const fragmentOffset = locateUnique(published, filledFragment);
const runtime = source['actual_natural_view.js'].content;
const runtimeOffset = locateUnique(published, runtime);
assert.deepEqual({ start, end, fragmentOffset, runtimeOffset }, {
  start: 30241389, end: 30542047, fragmentOffset: 30245774, runtimeOffset: 30527459,
});
assert(start < fragmentOffset);
assert(fragmentOffset + filledFragment.length <= runtimeOffset);
assert(runtimeOffset + runtime.length <= end);

const ledger = JSON.parse(fs.readFileSync(path.join(__dirname, 'publication-auth.json'), 'utf8'));
const [current, predecessor] = ledger.versionLedger.versions;
assert.equal(ledger.origin.projectId, 29770);
assert.equal(ledger.origin.task.task_number, 17);
assert.equal(ledger.origin.tasksSearchMatches, 1);
assert.equal(ledger.versionLedger.currentVersion, 137);
assert.equal(ledger.versionLedger.currentVersionHash, '9171eb0c');
assert.equal(current.version, 137);
assert.equal(predecessor.version, 136);
assert.equal(current.size_bytes, 29580450);
assert.equal(predecessor.size_bytes, 29279792);
assert.equal(current.size_bytes - predecessor.size_bytes, end - start);
const note = ledger.history.linkedNotes.find(value => value.id === 30432);
assert(note && !note.has_content && !ledger.limits.editorBodyReturned);
for (const marker of ['v137/9171eb0c', natural.runHash.slice(0, 12),
  brho.runHash.slice(0, 12), pressure.runHash.slice(0, 12), naturalSource.slice(0, 12),
  'Native runtime domains490/final A-D/energy/M4 remain OPEN', 'RELEASE HOLD']) {
  assert(note.summary.includes(marker), marker);
}

const report = natural.unsigned.result;
const rows = report.source_33_axis_evaluations;
const visualization = report.visualization;
assert.equal(rows.length, 33);
assert(rows.every(row => row.evaluation_eta === '0' && row.global_runtime_call_support_certified === false));
assert.equal(visualization.Y_values.length, 17);
for (const [chart, width] of [[visualization.Phi_microchart, 74], [visualization.u_chart, 65]]) {
  assert.equal(chart.frames.length, 17);
  assert(chart.frames.every(row => row.length === width));
}
assert(visualization.full_nonlinear_solution_enclosures);
assert(!visualization.final_A_D_field_samples);
assert(visualization.no_global_native_support_or_physical_final_field_claim);
assert.deepEqual([report.M3, report.M4, report.final_67_jets,
  report.natural_Y_certified, report.natural_Y_OPEN, report.release],
['62/64', '0/16', 0, 33, 490, 'HOLD']);

const browser = JSON.parse(fs.readFileSync(path.join(__dirname, 'browser-observation.json'), 'utf8'));
const liveUrl = new URL(browser.url);
assert.equal(liveUrl.hostname, 'project29770.websitepublisher.ai');
assert.equal(liveUrl.pathname, '/v0.3.1.html');
assert.equal(liveUrl.hash, '#m3-natural');
assert(browser.panelFound && browser.panelOpen);
assert.equal(browser.renderedStatus, 'verified');
assert.equal(browser.verifiedRun, natural.runHash);
assert.equal(browser.renderedCountTableRows, rows.length);
assert(browser.statusText.includes('RELEASE HOLD'));
for (const label of ['실행 JSON', '그림 PNG', '보기 링크']) {
  assert(browser.buttons.some(button => button.label === label && button.disabled === false), label);
}

const removed = published.subarray(start, end);
const withoutModule = Buffer.concat([published.subarray(0, start), published.subarray(end)]);
assert.equal(withoutModule.indexOf('<style id="ms-natural-style">'), -1);
assert.equal(withoutModule.indexOf('<style id="ms-a21-style">'), start);
const restored = Buffer.concat([withoutModule.subarray(0, start), removed, withoutModule.subarray(start)]);
assert(restored.equals(published));
const tampered = Buffer.from(removed);
tampered[0] ^= 1;
assert.notEqual(sha(Buffer.concat([withoutModule.subarray(0, start), tampered,
  withoutModule.subarray(start)])), publishedHash);

console.log(JSON.stringify({
  schema: 'mathscope.c144.m4.operating-v137-readonly/1',
  published: { bytes: published.length, sha256: publishedHash },
  official: { version: current.version, hash: ledger.versionLedger.currentVersionHash,
    noteId: note.id, currentStoredBytes: current.size_bytes, predecessorStoredBytes: predecessor.size_bytes },
  naturalModule: { start, end, bytes: removed.length, sha256: sha(removed),
    fragmentOffset, fragmentBytes: filledFragment.length, runtimeOffset, runtimeBytes: runtime.length },
  gitSource: { commit: naturalSource, files: Object.fromEntries(Object.entries(source)
    .map(([file, { git, sha256, bytes }]) => [file, { git, sha256, bytes }])) },
  payloads: [natural, brho, pressure].map(({ id, bytes, fileHash, runHash }) =>
    ({ id, bytes, fileHash, runHash })),
  browser: { panel: browser.renderedStatus, run: browser.verifiedRun,
    rows: browser.renderedCountTableRows, releaseHoldVisible: true },
  generatedPublicPreModuleCandidate: { status: 'UNATTESTED_PUBLIC_PREDECESSOR',
    bytes: withoutModule.length, sha256: sha(withoutModule), exactRestoration: true },
  tamperControls: 4,
  operatingM4: { result: 'OPEN', rows: '0/16', editableSourceExactBytes: false,
    originalAcceptanceEvidence: false, release: 'HOLD' },
}, null, 2));
