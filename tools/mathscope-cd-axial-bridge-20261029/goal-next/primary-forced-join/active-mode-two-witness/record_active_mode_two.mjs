import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const originalSHA = '492c97715d7fae56929e9bbe6991450db20186da00d4e6de2aa17c4a25959827';
const supportSHA = 'e2568961ead64b62898c5f2052c08b85e144b39f4a85db0f2921089cf0fb4338';
const keys = ['0:1', '1:1'];
const parts = ['real', 'imaginary'];
const stage = 'actual-original-active-mode-two-template';
const anchor = "      progress(context,'actual-all-label-forced-source-full-complex-inverse-and-mapped-curl',G,{key:old.key,m});";
const hook = [
  "      if(context.activeOriginalModeTwoWitness===true && m===2 && (old.key==='0:1'||old.key==='1:1')){",
  `        yield {kind:'${stage}',G,source,old,forced:forced.at(-1),initializedNodeCount:start};`,
  '      }',
];

export function instrumentOriginalForcedSource(bytes) {
  assert.equal(sha(bytes), originalSHA, 'original Forced source bytes');
  const source = bytes.toString('utf8');
  assert.equal(source.split(anchor).length, 2, 'unique already-verified local route anchor');
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  return Buffer.from(source.replace(anchor, [anchor, ...hook].join(newline)));
}

function row(G, old, f) {
  assert.equal(f.m, 2);
  assert.equal(old.sign, 1);
  assert.ok(old.checks.every(x => x.pass) && f.checks.every(x => x.pass));
  assert.ok(f.signedSolutions[1].checks.every(x => x.pass));
  const { waveRows, unsharedWaveRows, waveResidual, primaryFlatResidual, nonzeroAngularForcing } = old;
  assert.deepEqual(primaryFlatResidual.map(x => x.m).sort(), [-1, 1]);
  const raw = waveResidual.find(x => x.m === 2).value;
  const supported = nonzeroAngularForcing.find(x => x.m === 2).value;
  const quadratic = old.update.newQuadraticRemainder.find(x => x.m === 2).value;
  assert.deepEqual(raw, supported);
  assert.deepEqual(f.inputRoots, supported);
  const components = supported.flatMap((z, j) => parts.map(part => {
    const pull = f.pullback[j][part], formalPathSource = f.bound.wrappedSource[j][part];
    assert.equal(pull.body, z[part]);
    assert.equal(pull.mapped, f.bound.originalSource[j][part]);
    assert.equal(formalPathSource, f.inverse.source[j][part]);
    assert.equal(pull.check.pass, true);
    return { j, part, raw: raw[j][part], primary: G.zero, supported: z[part], mapped: pull.mapped,
      formalPathSource, system: pull.system ?? null, sourceFormals: pull.parameters ?? [], sourceCall: pull.root };
  }));
  const { Y, Hw, w, pulse, ci, Tg, vt, levelDifference } = f.path;
  const { normal, K, k, epsilon, projectedSource, system, velocity, pressure } = f.inverse;
  return { key: old.key, m: 2, changed: 0, components, phase: old.phase, lift: old.lift, liftNormal: old.normal, quadratic,
    wave: waveRows.find(x => x.m === 1), unsharedWave: unsharedWaveRows.find(x => x.m === 1),
    rawModeInventory: waveResidual.map(x => x.m), primaryModeInventory: primaryFlatResidual.map(x => x.m),
    supportedModeInventory: nonzeroAngularForcing.map(x => x.m),
    path: { Y, Hw, w, pulse, ci, Tg, vt, levelDifference },
    normal, K, k, epsilon, projectedSource, system, length: f.inverse.input.length, output: velocity, pressure,
    mappedCutoff: f.mapped.cutoff.mapped, mappedPotential: f.mapped.potential,
    mappedVelocity: f.mapped.velocity, mappedPressure: f.mapped.pressure, mappedEndpoint: f.mapped.mapping,
    localSourceCheckIDs: f.checks.map(x => x.id) };
}

async function streamGraph(G, dir) {
  const definitions = Buffer.from(JSON.stringify(G.captureFunctionDefinitions()) + '\n');
  const registry = JSON.parse(definitions);
  assert.equal(registry.counts.length, 5);
  const nodeCount = G.nodes.length, digest = createHash('sha256'), histogram = Object.create(null);
  let bytes = 0;
  const counted = line => { digest.update(line); bytes += Buffer.byteLength(line); return line; };
  function* lines() {
    yield counted(JSON.stringify({ schema: 'MathScope.M3.FullNodesJSONL/1', node_count: nodeCount }) + '\n');
    for (let index = 0; index < nodeCount; index++) {
      const node = G.nodes[index];
      histogram[node.op] = (histogram[node.op] ?? 0) + 1;
      yield counted(JSON.stringify(node) + '\n');
    }
  }
  await pipeline(Readable.from(lines()), createGzip({ level: 1 }),
    createWriteStream(join(dir, 'original-source-nodes.jsonl.gz'), { flags: 'wx' }));
  await writeFile(join(dir, 'original-source-functions.json'), definitions, { flag: 'wx' });
  assert.equal(G.nodes.length, nodeCount);
  return { node_count: nodeCount, node_stream_sha256: digest.digest('hex'), node_stream_uncompressed_bytes: bytes,
    operation_histogram: histogram, definitions_sha256: sha(definitions), extended_coupled_function_counts: registry.counts };
}

export class ActiveModeTwoWitnessComplete extends Error {}

export async function witnessContext({ dir, supportReceipt, originalForcedSource, instrumentedForcedSource }) {
  const original = await readFile(originalForcedSource);
  const instrumented = await readFile(instrumentedForcedSource);
  assert.deepEqual(instrumented, instrumentOriginalForcedSource(original));
  const support = await readFile(supportReceipt);
  assert.equal(sha(support), supportSHA, 'independent physical support receipt');
  const supportEvidence = JSON.parse(support);
  const rows = [];
  let identity;
  return { activeOriginalModeTwoWitness: true, async onSourceCheckpoint(event) {
    if (event.kind !== stage) return;
    const { G, source, old, forced, initializedNodeCount } = event;
    const pressure = source.mean.temporal.pressure, current = pressure.current, band = current.band;
    assert.equal(source.G, G);
    const order = band.request.coefficientOrder;
    assert.ok([3, 4].includes(order), 'active witness requires N3 or N4 original prefix');
    assert.equal(current.domain.prefixOrder, order);
    assert.equal(current.domain.nextScale, band.window.nextSourceScale);
    assert.equal(old.key, keys[rows.length], 'both actual feasible relative-band cases in original order');
    if (identity) assert.equal(source, identity);
    identity = source;
    rows.push(row(G, old, forced));
    if (rows.length !== keys.length) return;
    const cover = pressure.cover.rows.find(x => x.key === '0:0:0:0');
    const plus = cover.signs.find(x => x.sign === 1);
    const relative = pressure.cover.bands[cover.relativeBand + 1];
    assert.equal(cover.relativeBand, 0);
    assert.equal(cover.countInGlobalSum, 1);
    assert.equal(relative.ell, cover.label.ell);
    const application = source.application.definitions.map((field, j) => {
      const system = G.periodicIndexedSystem(field);
      const indices = system.rows.flatMap((r, index) => r.label.key === cover.key && r.label.sign === 1 ? [index] : []);
      assert.equal(indices.length, 1);
      const rowIndex = indices[0], indexed = system.rows[rowIndex], own = source.application.systems[plus.sourceLocalRow][j];
      assert.equal(indexed.localSystem, own.system);
      assert.equal(indexed.values.at(-1), relative.delta);
      return { field, root: source.application.residualRoots[j], rowIndex, values: indexed.values,
        system: own.system, ownSystem: own.ownSystem, referenceValues: own.referenceValues };
    });
    await mkdir(dir);
    const snapshot = await streamGraph(G, dir);
    const receipt = { schema: 'MathScope.OriginalActiveModeTwoSourceWitness/1', order, initializedNodeCount,
      source: { originalForcedSHA256: originalSHA, instrumentedForcedSHA256: sha(instrumented),
        originalPaperSHA256: pressure.source.originalPaperSHA256, parameterExpressionSHA256: pressure.source.parameterExpressionSHA256 },
      physical: { supportReceiptSHA256: supportSHA, originalSupportGraphSHA256: supportEvidence.originalGraphSHA256,
        chart: supportEvidence.chart, selection: 'delta=0 or 1, chosen by retained original floor expression' },
      nativeCover: { key: cover.key, relativeBand: cover.relativeBand, labelEll: cover.label.ell, grid: cover.label.grid,
        guards: cover.guards, delta: relative.delta, paletteIndex: relative.paletteIndex, referenceCommonIndex: pressure.cover.baseIndex,
        paletteOperands: { h: band.constants.h, Tg: band.geometry.Tg, baseEll: pressure.cover.baseEll, ellReference: band.coordinates.ell },
        labelValues: plus.values, matrix: relative.matrix.value, sign: plus.sign, sourceLocalRow: plus.sourceLocalRow,
        coverParameters: pressure.cover.parameters, representativeRoots: current.representative.roots,
        q: current.domain.q, nextScale: current.domain.nextScale, nextScaleTimesQ: current.domain.nextScaleTimesQ,
        rectangle: { center: plus.rectangle.center, copy: plus.rectangle.copy }, application },
      rows, snapshot, completeForcedSeal: false, uniformClassOrJetBound: false };
    await writeFile(join(dir, 'original-active-mode-two-witness.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
    throw new ActiveModeTwoWitnessComplete(dir);
  } };
}
