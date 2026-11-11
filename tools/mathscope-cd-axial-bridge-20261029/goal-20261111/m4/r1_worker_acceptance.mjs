import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [repoArg, manifestArg, outputArg] = process.argv.slice(2);
if (!repoArg || !manifestArg || !outputArg) {
  throw Error('Usage: node r1_worker_acceptance.mjs REPO REPLAY_MANIFEST OUTPUT');
}
const repo = resolve(repoArg);
const pin = '9595b4de5a1065b694d225c0ad2a14d5aa4435a9';
const lab = 'research-ide/mathscope-m4/release-lab/';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const gitBytes = (path, ref = pin) => execFileSync(
  'git', ['-c', 'core.longpaths=true', '-C', repo, 'show', `${ref}:${path}`],
  { maxBuffer: 32 * 1024 * 1024 },
);
const historicalBytes = gitBytes(lab + 'evidence/run-2026-10-13T175955318Z/manifest.json');
assert.equal(sha256(historicalBytes), '8a310145e28ae01ed7bd412052436d8ab25798d9cff66f5b87cda5c2214c72e6');
const historical = JSON.parse(historicalBytes);
const replayBytes = await readFile(manifestArg);
const replay = JSON.parse(replayBytes);
assert.equal(replay.pass, true);

const sourceBytes = new Map();
const hooks = registerHooks({
  load(url, context, nextLoad) {
    const loaded = nextLoad(url, context);
    if (url.startsWith('file:') && loaded.format === 'module') {
      const path = relative(repo, fileURLToPath(url));
      if (!isAbsolute(path) && path !== '..' && !path.startsWith('..\\') && !path.startsWith('../')) {
        sourceBytes.set(path.replaceAll('\\', '/'), Buffer.from(loaded.source));
      }
    }
    return loaded;
  },
});
const fromRepo = path => import(pathToFileURL(resolve(repo, path)).href);
const fixtureAPI = await fromRepo(lab + 'verify-fixtures.mjs');
const { createM1Engine } = await fromRepo('research-ide/mathscope-m1/core/engine.mjs');
const { heatIntegralCertificate } = await fromRepo('research-ide/mathscope-m1/navier/heat.mjs');
const { point, iadd, imul, idiv, ipower, iscale, isub, maxabs, iexp } =
  await fromRepo('research-ide/mathscope-m1/navier/numerics.mjs');
const { canonicalStringify } = await fromRepo('research-ide/mathscope-m0/contracts.mjs');
const catalogBytes = gitBytes(lab + 'catalog.json');
const installedCatalogBytes = await readFile(resolve(repo, lab + 'catalog.json'));
assert.equal(sha256(installedCatalogBytes), replay.catalogSHA256);
const catalog = JSON.parse(catalogBytes);
assert.deepEqual(await fixtureAPI.readCatalog(), catalog);
const windowsNewlinesOnly = Buffer.from(
  installedCatalogBytes.toString('utf8').replaceAll('\r\n', '\n'),
).equals(catalogBytes);
assert.equal(windowsNewlinesOnly, true);
assert.deepEqual(historical.fixtures.map(row => row.id), catalog.fixtures.map(row => row.id));
assert.deepEqual(replay.fixtures.map(row => row.id), catalog.fixtures.map(row => row.id));

function verifyRow(fixture, current, expected) {
  assert.equal(current.pass, true, fixture.id);
  assert.equal(current.workersStarted, 1, fixture.id);
  assert.equal(current.worker.status, 'COMPLETED', fixture.id);
  assert.equal(current.mathematicalHashMatch, true, fixture.id);
  assert.equal(current.local.mathematicalHash, current.worker.mathematicalHash, fixture.id);
  assert.deepEqual(current.request, fixture.request, fixture.id);
  assert.equal(current.requestDigest, sha256(canonicalStringify(fixture.request)), fixture.id);
  assert.equal(current.requestDigest, expected.requestDigest, fixture.id);
  assert.equal(current.inputHash, expected.inputHash, fixture.id);
  assert.equal(current.worker.workerSHA256, expected.worker.workerSHA256, fixture.id);
  assert.equal(current.worker.mathematicalHash, expected.worker.mathematicalHash, fixture.id);
  assert.deepEqual(current.observation, expected.observation, fixture.id);
  assert.deepEqual(current.invariant, expected.invariant, fixture.id);
}

const cases = [];
for (const [index, fixture] of catalog.fixtures.entries()) {
  const expected = historical.fixtures[index];
  verifyRow(fixture, replay.fixtures[index], expected);
  const observed = await fixtureAPI.verifyFixture(fixture);
  verifyRow(fixture, observed, expected);
  cases.push({
    id: fixture.id,
    workersStarted: observed.workersStarted,
    requestDigest: observed.requestDigest,
    inputHash: observed.inputHash,
    workerSHA256: observed.worker.workerSHA256,
    mathematicalHash: observed.worker.mathematicalHash,
    checks: observed.invariant.checks,
  });
  console.log(`R1-01 ${fixture.id} same input, Worker, mathematical result and invariants`);
}

async function runM1(id) {
  const fixture = catalog.fixtures.find(row => row.id === id);
  const engine = createM1Engine({ workerFactory: fixtureAPI.nativeWorkerFactory });
  try {
    const queued = await engine.submit(fixture.request);
    const job = await engine.wait(queued.id);
    assert.equal(job.status, 'COMPLETED');
    assert.equal(job.mathematicalHash, cases.find(row => row.id === id).mathematicalHash);
    return { fixture, result: job.result };
  } finally {
    engine.dispose();
  }
}

function intervalError(box, value) {
  assert(box.every(Number.isFinite) && Number.isFinite(value));
  return maxabs(isub(box, point(value)));
}

const { fixture: exterior, result: samples } = await runM1('exterior');
const { tau, h, viscosity, cInfinity, radialCount } = exterior.request.input;
const nu = ipower(point(viscosity), 0.5);
const exponent = iscale(iadd(point(1), iscale(point(h), 2)), -1);
const scale = imul(point(cInfinity), ipower(point(2), iadd(point(0.5), point(h))));
const tolerance = exterior.request.precision.absoluteTolerance;
assert.equal(samples.points.length, 16 * radialCount);
const exteriorChecks = [];
for (let shell = 0; shell < radialCount; shell++) {
  const points = samples.points.slice(16 * shell, 16 * (shell + 1));
  const rows = points.map(({ position: [x, y], velocity }) => {
    const r = ipower(iadd(imul(point(x), point(x)), imul(point(y), point(y))), 0.5);
    assert(r[0] > 0);
    const rn = idiv(r, nu);
    const Z = idiv(iscale(point(tau), 4), imul(rn, rn));
    return { x, y, velocity, r, rn, Z };
  });
  const zLow = Math.min(...rows.map(row => row.Z[0]));
  const zHigh = Math.max(...rows.map(row => row.Z[1]));
  const certificate = Z => heatIntegralCertificate({
    Z, h, derivativeOrder: 0, tolerance: tolerance / 16,
  });
  const atLow = certificate(zLow);
  const atHigh = certificate(zHigh);
  assert.equal(atLow.status, 'VERIFIED_NUMERICAL_ENCLOSURE');
  assert.equal(atHigh.status, 'VERIFIED_NUMERICAL_ENCLOSURE');
  // For h > 0 the positive integral integrand decreases in Z.
  const H = [atHigh.derivatives[0].lower, atLow.derivatives[0].upper];
  assert(H[0] > 0 && H[0] <= H[1]);
  for (const { x, y, velocity, r, rn } of rows) {
    const K = imul(nu, imul(scale, imul(ipower(rn, exponent), H)));
    const bounds = [
      iscale(idiv(imul(K, point(y)), r), -1),
      idiv(imul(K, point(x)), r),
      point(0),
    ];
    const errorUpper = bounds.map((box, i) => intervalError(box, velocity[i]));
    assert(errorUpper.every(error => error <= tolerance));
    exteriorChecks.push({ shell, x, y, velocity, bounds, errorUpper });
  }
}

const { fixture: benchmark, result: tg } = await runM1('taylor-green');
const rate = imul(point(benchmark.request.input.viscosity), point(benchmark.request.input.time));
const exactAmplitudeSquared = iexp(iscale(rate, -4));
const energy = iscale(exactAmplitudeSquared, 0.25);
const dissipation = iscale(exactAmplitudeSquared, benchmark.request.input.viscosity);
const derivative = iscale(dissipation, -1);
const taylorGreen = [
  ['meanEnergy', energy], ['meanDissipation', dissipation], ['energyDerivative', derivative],
].map(([quantity, box]) => {
  const errorUpper = intervalError(box, tg[quantity]);
  assert(errorUpper <= benchmark.request.precision.absoluteTolerance);
  return { quantity, box, observed: tg[quantity], errorUpper };
});

const heat = replay.fixtures.find(row => row.id === 'heat');
assert(heat.observation.derivatives.every(ball =>
  ball.radius <= heat.request.precision.absoluteTolerance && ball.lower <= ball.upper));
assert(heat.observation.odeEnclosure.lower <= 0 && heat.observation.odeEnclosure.upper >= 0);
const axis = replay.fixtures.find(row => row.id === 'axis');
assert.equal(axis.observation.tailDegree, axis.request.input.tailDegree);
assert.equal(axis.observation.localGates.infiniteCoefficientTail, true);
assert.equal(axis.observation.localGates.globalWitness, false);
assert.equal(axis.observation.tailRows.length, axis.request.input.sampleCount);
for (const row of axis.observation.tailRows) {
  const [n, d = '1'] = row.phiTailUpper.split('/');
  assert(BigInt(n) >= 0n && BigInt(d) > 0n);
}

hooks.deregister();
const sourceClosure = [];
for (const [path, loaded] of [...sourceBytes.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const pinned = gitBytes(path);
  const exact = loaded.equals(pinned);
  const windowsNewlinesOnly = Buffer.from(
    loaded.toString('utf8').replaceAll('\r\n', '\n'),
  ).equals(pinned);
  assert(exact || windowsNewlinesOnly, `M4 source differs from pin: ${path}`);
  sourceClosure.push({ path, loadedSHA256: sha256(loaded), pinnedSHA256: sha256(pinned), exact });
}
assert(sourceClosure.some(row => row.path.endsWith('mathscope-m1/core/worker-data.mjs')));
assert(sourceClosure.some(row => row.path.endsWith('mathscope-m2/core/worker-data.mjs')));

const receipt = {
  schema: 'MathScope.M4.R101IndependentReplay/1',
  originalCriterion: 'R1-01',
  pinnedSourceCommit: pin,
  originalCheckoutHead: replay.sourceCommit,
  historicalManifestSHA256: sha256(historicalBytes),
  firstReplayManifestSHA256: sha256(replayBytes),
  catalog: {
    pinnedSHA256: sha256(catalogBytes),
    installedSHA256: sha256(installedCatalogBytes),
    historicalSHA256: historical.catalogSHA256,
    parsedCatalogMatchesPinned: true,
    installedAndPinnedCatalogDifferOnlyByWindowsNewlines: windowsNewlinesOnly,
  },
  runtime: { node: process.version, platform: process.platform, arch: process.arch },
  cases,
  sourceClosure,
  finiteNumericBounds: {
    scope: 'Real enclosures at the exact finite fixture inputs and emitted binary64 coordinates',
    exteriorVelocity: {
      calculation: 'Independent interval quadrature for H; monotone endpoint transfer in Z; outward Cartesian propagation at the Worker points',
      absoluteTolerance: tolerance,
      pointCount: exteriorChecks.length,
      maximumCoordinateErrorUpper: Math.max(...exteriorChecks.flatMap(row => row.errorUpper)),
      points: exteriorChecks,
    },
    heatDerivatives: heat.observation.derivatives,
    heatODE: heat.observation.odeEnclosure,
    axisLocalRationalTail: axis.observation,
    taylorGreen,
  },
  verdict: 'PASS_SUPPORTED_R1_01_FIXTURES',
};
await writeFile(outputArg, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({
  cases: cases.length,
  sourceModules: sourceClosure.length,
  exteriorPoints: exteriorChecks.length,
  maximumExteriorVelocityErrorUpper: receipt.finiteNumericBounds.exteriorVelocity.maximumCoordinateErrorUpper,
  verdict: receipt.verdict,
}));
