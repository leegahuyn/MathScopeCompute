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
  const N = receipt.requestedPrefix, order = receipt.primaryOrder;
  assert.ok([2, 3].includes(order));
  const targetOrder = order+1, backgroundOrder = order+3;
  assert.strictEqual(current.band.family, family);
  assert.equal(family.request.derivativeOrder, backgroundOrder);
  const gaussian = family.source.backgroundNorms.gaussianRows.find(row => row.derivativeOrder === targetOrder);
  assert.equal(gaussian.backgroundDerivativeOrder, backgroundOrder);
  receipt.primaryC3Result = {
    originalCurrentPrivateSeal: true,
    backgroundRow: gaussian,
    referenceWindow: current.band.window,
    exactPrefixDomain: current.domain,
    finalJets: 0,
  };
  save();

  const target = stage('sealed-original-target-C'+targetOrder, () => family.constructTargetWeightedNorms({
    derivativeOrder: targetOrder, maxNodes: bandMaxNodes, maxJetRequests: 600000,
  }, context), assertActualCommonTargetWeightedNorms);
  assert.strictEqual(target.family, family);
  assert.equal(target.request.derivativeOrder, targetOrder);
  receipt.primaryC3Result.targetRows = target.rows.map(row => ({
    derivativeOrder: row.derivativeOrder, pole: row.pole, N_m: row.N_m,
  }));
  save();

  const primary = stage('sealed-original-primary-C'+order,
    () => attachGlobalPrimaryClassOperator(current, target, { order, maxWork: 200000 }, context),
    assertGlobalPrimaryClassOperator);
  assert.strictEqual(primary.current, current);
  assert.strictEqual(primary.target, target);
  assert.equal(primary.bounds.backgroundRow.backgroundDerivativeOrder, backgroundOrder);
  assert.deepEqual(primary.bounds.targetRows.map(row => [row.derivativeOrder, row.pole]),
    Array.from({length: targetOrder+1}, (_, j) => [j, 3*(j+1)]));
  assert.equal(primary.scope.actualFiniteDerivativeOrder, order);
  assert.equal(primary.scope.actualOriginalPotentialWOneClassCertified, true);
  assert.equal(primary.scope.actualForcedInputWClassCertified, false);
  assert.equal(primary.scope.completeN6, false);
  assert.ok(primary.checks.length > 0 && primary.checks.every(row => row.pass));
  const weighted = primary.bounds.degreeProgram.weighted;
  const potential = weighted.potential[3];
  assert.deepEqual(potential, { power: 1283, pole: 18 });
  assert.deepEqual(weighted.curlRows[2].fastTerms[0], { power: potential.power+1, pole: potential.pole });
  receipt.primaryC3Result.potentialOrderThree = {
    nativePrimaryClassOrder: order,
    originalKRoot: primary.bounds.K,
    power: potential.power,
    pole: potential.pole,
    bound: 'K^1283*S^1283*epsilon*sqrt(zeta)*delta^(-18)*P(v)',
    source: 'Original potential third derivative in the full curl order-two Leibniz bound.',
  };
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
