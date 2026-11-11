import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertActualCommonTargetWeightedNorms,
} from '../../mathscope-m2/navier/actual-common-target-weighted-norms.mjs';
import { canonicalStringify } from '../../mathscope-m0/contracts.mjs';
import { exportOriginalSourceGraph } from '../post-signed-20261023/export_original_source_graph.mjs';
import {
  assertGlobalPrimaryClassOperator,
  attachGlobalPrimaryClassOperator,
  globalPrimaryClassOperatorCertificate,
} from '../navier/source-primary-class-majorants.mjs';

export async function replayPrimaryC3({ directory, receipt, save, stage, context, current, family, bandMaxNodes }) {
  const N = receipt.requestedPrefix;
  assert.strictEqual(current.band.family, family);
  assert.equal(family.request.derivativeOrder, 6);
  const gaussian = family.source.backgroundNorms.gaussianRows.find(row => row.derivativeOrder === 4);
  assert.equal(gaussian.backgroundDerivativeOrder, 6);
  receipt.primaryC3Result = {
    originalCurrentPrivateSeal: true,
    backgroundRow: gaussian,
    referenceWindow: current.band.window,
    exactPrefixDomain: current.domain,
    finalJets: 0,
  };
  save();

  const target = stage('sealed-original-target-C4', () => family.constructTargetWeightedNorms({
    derivativeOrder: 4, maxNodes: bandMaxNodes, maxJetRequests: 600000,
  }, context), assertActualCommonTargetWeightedNorms);
  assert.strictEqual(target.family, family);
  assert.equal(target.request.derivativeOrder, 4);
  receipt.primaryC3Result.targetRows = target.rows.map(row => ({
    derivativeOrder: row.derivativeOrder, pole: row.pole, N_m: row.N_m,
  }));
  save();

  const primary = stage('sealed-original-primary-C3',
    () => attachGlobalPrimaryClassOperator(current, target, { order: 3, maxWork: 200000 }, context),
    assertGlobalPrimaryClassOperator);
  assert.strictEqual(primary.current, current);
  assert.strictEqual(primary.target, target);
  assert.equal(primary.bounds.backgroundRow.backgroundDerivativeOrder, 6);
  assert.deepEqual(primary.bounds.targetRows.map(row => [row.derivativeOrder, row.pole]),
    [[0, 3], [1, 6], [2, 9], [3, 12], [4, 15]]);
  assert.equal(primary.scope.actualFiniteDerivativeOrder, 3);
  assert.equal(primary.scope.actualOriginalPotentialWOneClassCertified, true);
  assert.equal(primary.scope.actualForcedInputWClassCertified, false);
  assert.equal(primary.scope.completeN6, false);
  assert.ok(primary.checks.length > 0 && primary.checks.every(row => row.pass));
  receipt.primaryC3Result.nativeScope = primary.scope;
  receipt.primaryC3Result.nativeChecks = primary.checks;
  receipt.currentStage = 'export-original-primary-C3';
  save();

  const files = {};
  function write(name, value, expected) {
    const raw = canonicalStringify(value);
    const sha = createHash('sha256').update(raw).digest('hex');
    if (expected !== undefined) assert.equal(sha, expected, name);
    writeFileSync(join(directory, name), raw);
    files[name] = { sha256: sha, bytes: Buffer.byteLength(raw) };
    global.gc?.();
    context.checkCancelled();
  }

  const certificate = await globalPrimaryClassOperatorCertificate(primary);
  const { program, sourceTarget, sourceCurrent, ...metadata } = certificate;
  write('primary-C3-certificate.json', { ...metadata, sourceTarget, sourceCurrent });
  write('primary-C3-additive-program.json', program, certificate.graph.sha256);
  write('primary-C3-target-program.json', target.program, sourceTarget.graph.sha256);
  assert.equal(program.currentBase.sha256, sourceCurrent.graph.sha256);
  assert.equal(program.targetBase.sha256, sourceTarget.graph.sha256);
  receipt.primaryC3Result.files = files;
  save();

  const roots = [current.domain.q, current.domain.nextScale, current.domain.nextScaleTimesQ];
  receipt.primaryC3Result.currentSnapshot = await exportOriginalSourceGraph(current.G, {
    dir: join(directory, 'original-whole-k-primary-current-graph'),
    roots,
    sourceCommit: receipt.executingCommit,
    pr30Commit: 'a9b3a5b317525f6d0a71e2e356b054c9d25d2e60',
    scope: 'ORIGINAL_WHOLE_K_N' + N + '_PRIMARY_C3_CURRENT',
    maxNodes: bandMaxNodes,
  });
  save();
}
