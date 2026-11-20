const assert = require("node:assert/strict");
const {createHash} = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {gunzipSync} = require("node:zlib");

const [uploadedPath, historicalDir, providerPath, currentDir, outputPath] = process.argv.slice(2);
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const json = file => JSON.parse(fs.readFileSync(file, "utf8"));
const historical = json(path.join(historicalDir, "isolated-deployment.json"));
const historicalScreen = json(path.join(historicalDir, "actual-post-publication-screen.json"));
const provider = json(providerPath);
const currentScreenPath = path.join(currentDir, "current-post-publication-screen.json");
const currentScreen = json(currentScreenPath);
const block = 512;
const tarRecord = 10240;
const round = (value, alignment) => Math.ceil(value / alignment) * alignment;
const read = (buf, start, size) => buf.subarray(start, start + size)
  .toString("utf8").replace(/\0.*$/s, "").trim();
const octal = (buf, start, size) => Number.parseInt(read(buf, start, size), 8);

function filesFromTar(content) {
  const files = [];
  let directories = 0;
  let offset = 0;
  while (offset + block <= content.length && content[offset] !== 0) {
    const header = content.subarray(offset, offset + block);
    const filename = read(header, 0, 100);
    const size = octal(header, 124, 12);
    const type = read(header, 156, 1);
    assert.ok(Number.isSafeInteger(size) && size >= 0);
    const checksum = header.reduce((sum, b, i) => sum + (i >= 148 && i < 156 ? 32 : b), 0);
    assert.equal(checksum, octal(header, 148, 8), filename);
    assert.ok(offset + block + round(size, block) <= content.length, filename);
    if (type === "5") {
      assert.equal(size, 0);
      directories++;
    } else {
      assert.equal(type, "0", filename);
      assert.ok(!files.some(file => file.filename === filename), filename);
      files.push({filename, data: content.subarray(offset + block, offset + block + size)});
    }
    offset += block + round(size, block);
  }
  assert.ok(content.subarray(offset).every(byte => byte === 0), "Nonzero bytes after uploaded entries");
  return {files, directories};
}

function writeOctal(header, value, pos, length) {
  header.write(value.toString(8).padStart(length - 1, "0") + "\0", pos, length, "ascii");
}

function canonicalTar(files, mode = 0o644) {
  const bytes = files.reduce((sum, file) => sum + block + round(file.data.length, block), 2*block);
  const output = Buffer.alloc(round(bytes, tarRecord));
  let offset = 0;
  for (const {filename, data} of files) {
    const header = output.subarray(offset, offset + block);
    header.write(filename, 0, 100, "utf8");
    writeOctal(header, mode, 100, 8);
    writeOctal(header, 0, 108, 8);
    writeOctal(header, 0, 116, 8);
    writeOctal(header, data.length, 124, 12);
    writeOctal(header, 0, 136, 12);
    header[156] = "0".charCodeAt(0);
    header.write("ustar\u000000", 257, 8, "ascii");
    header.fill(32, 148, 156);
    const checksum = header.reduce((sum, b) => sum + b, 0);
    header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "ascii");
    data.copy(output, offset + block);
    offset += block + round(data.length, block);
  }
  return output;
}

const uploaded = fs.readFileSync(uploadedPath);
assert.equal(uploaded.length, historical.source.archiveBytes);
assert.equal(digest(uploaded), historical.source.archiveSHA256);
assert.equal(provider.deployment.id, historical.deployment.id);
assert.equal(provider.deployment.project_id, historical.deployment.project_id);
assert.equal(provider.deployment.type, "publish");
assert.equal(provider.deployment.status, "succeeded");
assert.equal(provider.deployment.url, historical.deployment.url);
assert.equal(provider.deployment.provider_deployment_id, historical.deployment.provider_deployment_id);
assert.equal(provider.version.id, historical.deployment.version_id);
assert.equal(provider.deployment.version_id, provider.version.id);
assert.equal(provider.version.deployment_id, provider.deployment.id);
assert.equal(provider.version.source.commit_sha, historical.source.commit_sha);
const current = provider.currentProject;
assert.equal(current.id, provider.deployment.project_id);
assert.equal(current.status, "active");
assert.equal(current.current_live_url, provider.deployment.url);
assert.equal(current.latest_version_number, provider.version.version_number);
assert.equal(current.current_user_role, "owner");
assert.equal(current.access_mode, historical.access.mode);
assert.equal(current.access_revision, historical.access.revision);
assert.equal(current.allowlist_count, historical.access.userCount);
assert.equal(current.group_count, historical.access.groupCount);
assert.equal(current.external_visitor_count, historical.access.externalVisitorCount);
const original = gunzipSync(uploaded);
const {files, directories} = filesFromTar(original);
files.sort((a, b) => a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0);
assert.deepEqual(files.map(f => f.filename), ["dist/.openai/hosting.json", "dist/server/index.js"]);
const [{data: hostingConfig}, {data: worker}] = files;
assert.equal(JSON.parse(hostingConfig).project_id, provider.deployment.project_id);
assert.equal(digest(worker), historical.source.workerSHA256);
const payload = /^const encoded = "([A-Za-z0-9+/=]+)";\n/.exec(worker.toString("ascii"));
assert.ok(payload, "Unrecognized Worker payload header");
const html = gunzipSync(Buffer.from(payload[1], "base64"));
assert.equal(html.length, historical.source.candidateBytes);
assert.equal(digest(html), historical.source.candidateSHA256);
assert.equal(digest(html), historicalScreen.http.candidateSHA256);
assert.equal(new URL(historicalScreen.entry).origin, provider.deployment.url);
assert.equal(historicalScreen.access.authenticatedBySitesDispatch, true);
assert.equal(historicalScreen.releaseHoldVisible, true);
assert.equal(historicalScreen.selectedCriterion, "R1-08");
assert.equal(historicalScreen.responseSubstitution, false);
assert.equal(historicalScreen.http.status, 200);
assert.deepEqual(historicalScreen.fixtures.map(f => [f.fixture, f.status]), [["su2", "COMPLETED"], ["point", "COMPLETED"]]);
for (const frame of historicalScreen.viewports) {
  assert.equal(path.basename(frame.filename), frame.filename);
  assert.equal(digest(fs.readFileSync(path.join(historicalDir, frame.filename))), frame.sha256);
}
assert.equal(currentScreen.entry, historicalScreen.entry);
assert.equal(currentScreen.http.status, 200);
assert.equal(currentScreen.browserHttp.status, 200);
assert.equal(currentScreen.http.candidateSHA256, digest(html));
assert.equal(currentScreen.http.bytes, html.length + currentScreen.http.providerInsertion.bytes);
assert.equal(currentScreen.http.providerInsertion.at, historicalScreen.http.providerInsertion.at);
assert.equal(currentScreen.access.authenticatedBySitesDispatch, true);
assert.equal(currentScreen.access.anonymous.status, 401);
assert.equal(currentScreen.access.anonymous.candidateReturned, false);
assert.equal(currentScreen.selectedCriterion, "R1-08");
assert.equal(currentScreen.releaseHoldVisible, true);
assert.equal(currentScreen.responseSubstitution, false);
assert.deepEqual(currentScreen.errors, []);
assert.deepEqual(currentScreen.attemptedExternalHttp, []);
assert.deepEqual(currentScreen.fixtures, historicalScreen.fixtures);
assert.deepEqual(currentScreen.viewports.map(frame => frame.filename), historicalScreen.viewports.map(frame => frame.filename));
for (const frame of currentScreen.viewports) {
  assert.equal(path.basename(frame.filename), frame.filename);
  assert.equal(digest(fs.readFileSync(path.join(currentDir, frame.filename))), frame.sha256);
}
const stored = provider.version.archive_storage;
assert.equal(stored.archive_format, "tar");
assert.equal(stored.file_count, files.length);
const canonical = canonicalTar(files);
assert.equal(canonical.length, stored.size_bytes);
assert.equal("sha256:" + digest(canonical), stored.content_hash);

const changedWorker = Buffer.from(worker);
changedWorker[0] ^= 1;
const controls = {
  reverseEntryOrderRejected: digest(canonicalTar([...files].reverse())) !== digest(canonical),
  uploadedModeInsteadOfCanonicalRejected: digest(canonicalTar(files, 0o666)) !== digest(canonical),
  changedWorkerByteRejected: digest(canonicalTar([files[0], {...files[1], data: changedWorker}])) !== digest(canonical),
};
assert.ok(Object.values(controls).every(Boolean));

const receipt = {
  schema: "MathScope.M4.R108.AuthenticatedSavedArchiveBinding/1",
  isolatedScope: "OWNER_PRIVATE_M1_M2",
  deployment: provider.deployment.id,
  version: provider.version.id,
  activeOwnerPrivateRevision: current.access_revision,
  deployedSourceCommit: provider.version.source.commit_sha,
  uploadedGzip: {bytes: uploaded.length, sha256: digest(uploaded)},
  uploadedTar: {bytes: original.length, sha256: digest(original), directories},
  canonicalization: "Two regular files in path order with dist/ retained, USTAR mode 0644, uid/gid/mtime zero, empty device fields, 10240-byte record padding",
  providerTar: {bytes: canonical.length, sha256: digest(canonical), files: stored.file_count},
  localMembers: files.map(file => ({path: file.filename, bytes: file.data.length, sha256: digest(file.data)})),
  embeddedHtml: {bytes: html.length, sha256: digest(html)},
  historicalScreen: {entry: historicalScreen.entry, observedUtc: historicalScreen.observedUtc,
    archivedScreenshotHashes: historicalScreen.viewports.map(frame => frame.sha256)},
  currentScreen: {
    entry: currentScreen.entry, observedUtc: currentScreen.observedUtc,
    receiptSHA256: digest(fs.readFileSync(currentScreenPath)),
    ownerHttpStatus: currentScreen.http.status, anonymousHttpStatus: currentScreen.access.anonymous.status,
    rawHttpSHA256: currentScreen.http.sha256, providerInsertion: currentScreen.http.providerInsertion,
    fixtureRunIdentityMatchesHistorical: true,
    screenshotHashes: currentScreen.viewports.map(frame => frame.sha256)
  },
  sameExactProviderArchive: true,
  controls,
  operatingR108: "OPEN",
  release: "HOLD",
};
fs.writeFileSync(outputPath, JSON.stringify(receipt, null, 2) + "\n");
console.log("Verified exact authenticated saved tar, embedded candidate and historical screen binding.");
