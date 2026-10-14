import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { inspectRadiusFTCDominance, auditSavedRadiusAndMonotone } from '../source-saved-radius-monotone-audit.mjs';

function fixture() {
  const nodes = [{ op: 'rational', args: ['0', '1'] }, { op: 'rational', args: ['1', '1'] }, { op: 'rational', args: ['2', '1'] },
    ...['x', 'y', 'z'].map(n => ({ op: 'coordinate', args: [n] }))];
  const put = (op, args) => { nodes.push({ op, args }); return nodes.length - 1; };
  const add = xs => xs.reduce((a, b) => put('add', [a, b]));
  const squares = [], anchors = [], bounds = [];
  for (let j = 0; j < 3; j++) {
    const faces = [];
    for (let mask = 0; mask < 8; mask++) {
      const square = put('integer_power', [2, 2]); squares.push(square);
      let face = put('sqrt_positive', [put('add', [1, square])]);
      if (mask === 0) anchors.push(face);
      for (let k = 2; k >= 0; k--) if (mask & (1 << k)) face = put('definite_integral', [face, 3 + k, 0, 1]);
      faces.push(face);
    }
    bounds.push(add(faces));
  }
  const aggregate = add(bounds), maximum = put('maximum', [1, aggregate]);
  return { nodes, node: id => nodes[id], put, squares, anchors, bounds, aggregate, maximum };
}

test('fixture derives strict FTC maximum dominance with analytic conditions retained', () => {
  const f = fixture(), r = inspectRadiusFTCDominance(f);
  assert.deepEqual(r.faceDimensionCounts, [3, 9, 9, 3]);
  assert.equal(r.conditionalDominance.lowerBound, '3');
  assert.equal(r.conditionalDominance.strictMarginAtLeast, '2');
  assert.equal(r.conditionalDominance.selectedOperand, f.aggregate);
  assert.equal(r.conditionalDominance.analyticHypothesesProved, false);
  assert.equal(r.conditionalDominance.globalSmoothnessProved, false);
  assert.equal(r.sourceAuthenticated, false);
  assert.equal(r.originalN602Complete, false);
  assert.equal(r.faces.every(x => x.realBodyProved === false && x.integrabilityProved === false && x.orderedEndpointsProved === false), true);
  assert.throws(() => { r.conditionalDominance.analyticHypothesesProved = true; }, TypeError);
});

test('fixture rejects a fake odd square, omitted anchor, reversed maximum and insufficient work', () => {
  const odd = fixture(); odd.nodes[odd.squares[0]].args[1] = 3;
  assert.throws(() => inspectRadiusFTCDominance(odd), /actual even square/);
  const missing = fixture(); missing.nodes[missing.bounds[0]].args[0] = missing.anchors[0];
  assert.throws(() => inspectRadiusFTCDominance(missing), /complete 3D FTC face inventories/);
  const reversed = fixture(); reversed.nodes[reversed.maximum].args.reverse();
  assert.throws(() => inspectRadiusFTCDominance(reversed), /max\(1,B\)/);
  assert.throws(() => inspectRadiusFTCDominance({ ...fixture(), maxWork: 1 }), /work budget/);
});

test('fixture rejects caller replacement of the actual saved source', async () => {
  await assert.rejects(auditSavedRadiusAndMonotone({ sourceAuthenticated: true }), /no caller graph/);
});

test('saved actual radius24faces and monotone012 operands stream exactly; all analytic guards remain explicit', { timeout: 300000 }, async () => {
  const report = await auditSavedRadiusAndMonotone();
  assert.equal(report.source.sourceDependencies.length, 155);
  assert.equal(report.source.fullUncompressedStreamVerified, true);
  assert.ok(report.source.retainedAuditNodeCount < 15000);
  assert.deepEqual(report.sourceMaximum.sourceMaximum.node, { op: 'maximum', args: [1, 539399] });
  assert.equal(report.sourceMaximum.sourceAuthenticated, true);
  assert.deepEqual(report.sourceMaximum.faces.filter(x => x.anchoredZeroDimensionalFace).map(x => x.sourceFace).sort((a, b) => a - b), [494498, 499013, 516218]);
  assert.equal(report.sourceMaximum.conditionalDominance.analyticHypothesesProved, false);
  assert.deepEqual(report.monotone.map(x => x.index), [0, 1, 2]);
  assert.equal(report.monotone.every(x => !x.analyticConditionsProvedByThisAudit), true);
  assert.ok(report.monotone[0].unresolvedUpstreamOperators.some(x => x.sourceNode === 4483 && x.node.op === 'actual_natural_series'));
  assert.ok(report.monotone[1].unresolvedUpstreamOperators.some(x => x.node.op === 'actual_monotone_root'));
  assert.equal(report.monotone[2].unresolvedUpstreamOperators.length, 0);
  assert.equal(report.scope.originalN601Complete, false);
  assert.equal(report.scope.originalN602Complete, false);
  assert.equal(report.scope.M3CountRaised, false);
  const directory = process.env.MATHSCOPE_RADIUS_MONOTONE_EVIDENCE_DIR;
  if (directory) {
    await mkdir(resolve(directory), { recursive: true });
    const digest = raw => createHash('sha256').update(raw).digest('hex');
    const raw = JSON.stringify(report, null, 2) + '\n', file = 'radius-monotone-audit.json';
    await writeFile(resolve(directory, file), raw, { flag: 'wx' });
    const implementations = await Promise.all(['../source-saved-radius-monotone-audit.mjs', './saved-radius-monotone-audit.test.mjs'].map(async path => {
      const bytes = await readFile(new URL(path, import.meta.url)); return { path, sha256: digest(bytes), bytes: bytes.length };
    }));
    await writeFile(resolve(directory, 'execution.json'), JSON.stringify({ schema: 'MathScope.N6.SavedRadiusMonotoneAuditExecution/1', startedAt: report.startedAt,
      finishedAt: report.finishedAt, nodeVersion: process.version, implementations, artifact: file, artifactSHA256: digest(raw), mathematicalStatus: report.mathematicalStatus,
      sourceRadius: 539400, conditionalSelectedOperand: 539399, originalN601Complete: false, originalN602Complete: false, M3CountRaised: false }, null, 2) + '\n', { flag: 'wx' });
    console.log('RADIUS_MONOTONE_AUDIT', JSON.stringify({ artifact: file, sha256: digest(raw), faces: 24, anchors: 3, sourceNode: 539400,
      conditionalOperand: 539399, monotoneDefinitions: 3, status: report.mathematicalStatus, analyticGuardsProved: false }));
  }
});
