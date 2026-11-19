import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, output] = process.argv.slice(2);
if (!runtime || !output) throw new Error('original runtime and a new output path are required');
const pins = {
  'actual-positive-global-stress.mjs': '77227cd74000f5b6d4bec0361106af21d8020b2eee1eb979c1adc9ec3aae97d1',
  'actual-continuation-exact-leading-conservation.mjs': '48650f7a1ad5515dc24cf26395bb3b6435ca11c602bfcf8fb09446012a21474b',
  'actual-continuation-exact-stress.mjs': '22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2',
  'actual-continuation-exact-heat.mjs': 'c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172',
  'actual-continuation-exact-functions.mjs': '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-residual-order-induction-expressions.mjs': 'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501',
};
const sourceDirectory = resolve(runtime, 'research-ide/mathscope-m2/navier');
for (const [file, expected] of Object.entries(pins)) {
  const data = await readFile(resolve(sourceDirectory, file));
  assert.equal(createHash('sha256').update(data).digest('hex'), expected, file);
}
const original = await import(pathToFileURL(resolve(sourceDirectory, 'actual-positive-global-stress.mjs')));
const result = original.prepareActualPositiveGlobalStress({ order: 1, maxNodes: 2000000 }, {
  onProgress: (step) => console.log(JSON.stringify(step)),
});
const certificate = await original.actualPositiveGlobalStressCertificate(result);
const bootstrap = result.moments.pressure.primitives.prepared.bootstrap;
const audit = certificate.leading.angular.originalAuditProof;
const theta = certificate.stressRows.find((row) => row.order === 1 && row.component === 'theta');
const axial = certificate.stressRows.find((row) => row.order === 1 && row.component === 'z');
assert.equal(certificate.request.throughOrder, 1);
assert.ok(audit.check.pass && audit.pass && audit.constantOfIntegrationIncluded);
assert.ok(Object.values(audit.terminal.sourceChecks).every(Boolean));
assert.ok(audit.correctionHistories.B8.check.pass && audit.correctionHistories.I1.check.pass);
assert.ok(!audit.heatChangeAloneUsedAsWholeMoment);
assert.ok(Object.values(audit.negativeControls).every((row) => !row.pass));
assert.ok(theta.originalTotalCheck.pass && theta.rawDensityCheck.pass && theta.wholeDensityCheck.pass);
assert.ok(axial.originalTotalCheck.pass && axial.rawDensityCheck.pass && axial.wholeDensityCheck.pass);
assert.equal(theta.actualConservativeTotalReduced, result.G.zero);
assert.equal(axial.actualConservativeTotalReduced, result.G.zero);
assert.equal(bootstrap.roots.actualOrderOneTotalR2Residual, 117072);
assert.equal(bootstrap.roots.actualOrderOneTotalRResidual, 117075);
const first = result.moments.rows[0];
const originalPrefixLength = 117100;
const originalPrefix = bootstrap.G.nodes.slice(0, originalPrefixLength);
const originalPrefixSHA256 = createHash('sha256')
  .update(JSON.stringify(originalPrefix)).digest('hex');
assert.equal(originalPrefixSHA256, 'd125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116');
const registry = {
  expression: ['actual_expression_partial'],
  quadratic: ['actual_quadratic_root'],
  monotone: ['actual_monotone_root'],
  picard: ['actual_background_picard', 'actual_background_even_profile'],
};
const nativePrefixes = Object.fromEntries(Object.entries(registry).map(([kind, ops]) => {
  const count = originalPrefix.reduce((size, node) => ops.includes(node.op) ? Math.max(size, node.args[0] + 1) : size, 0);
  assert.ok(count > 0, kind);
  const definitions = bootstrap.G[kind + 'Systems'].slice(0, count);
  assert.equal(definitions.length, count, kind);
  return [kind, { count, sha256: createHash('sha256').update(JSON.stringify(definitions)).digest('hex') }];
}));
const originalExpressions = bootstrap.G.expressionSystems.slice(0, nativePrefixes.expression.count);
const widenedExpressions = result.G.expressionSystems.slice(0, originalExpressions.length);
assert.equal(bootstrap.G.materializeExpressionFunction, result.G.materializeExpressionFunction);
assert.deepEqual(originalExpressions.map((entry) => entry.derivativeLimits), [[4, 6], [4, 6]]);
for (let i = 0; i < originalExpressions.length; i++) {
  const expected = {
    ...originalExpressions[i], derivativeLimits: [128, 128],
    implementation: 'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',
    historicalBodyPreserved: true,
  };
  assert.deepEqual(widenedExpressions[i], expected);
}
nativePrefixes.expression.widenedSHA256 = createHash('sha256').update(JSON.stringify(widenedExpressions)).digest('hex');
nativePrefixes.expression.scope = 'Same name, formals, body and inherited materializer. Registered derivative budgets are widened.';
nativePrefixes.expression.originalLimits = [4, 6];
nativePrefixes.expression.inductionLimits = [128, 128];
nativePrefixes.expression.matchedMaterializer = true;
const select = (row) => ({
  originalTotal: row.originalTotal, reconstructedWhole: row.actualWholeResidualIntegral,
  rawResidual: row.actualRawResidual, conservativeTotal: row.actualConservativeTotal,
  reducedConservativeTotal: row.actualConservativeTotalReduced,
  totalIdentity: row.originalTotalCheck.pass, rawDensityIdentity: row.rawDensityCheck.pass,
  sameForwardBackwardDensity: row.wholeDensityCheck.pass, backwardSign: row.backwardSign.pass,
});
const summary = {
  status: 'EXECUTED_ORIGINAL_ORDER_ONE_CANCELLATION_WITH_PREHEAT_CONSTANT',
  pins, graph: certificate.graph, actualSource: certificate.source,
  originalPrefix: { nodes: originalPrefixLength, sha256: originalPrefixSHA256, nativePrefixes },
  actualOriginalOrderOne: {
    leadingF: bootstrap.actualHeat.heat.finalF,
    sourceAngular: bootstrap.roots.actualOrderOneAngularResidualDividedByR,
    angularTotal: bootstrap.roots.actualOrderOneTotalR2Residual,
    axialTotal: bootstrap.roots.actualOrderOneTotalRResidual,
    exactParameterTreeSHA256: bootstrap.program.parameterExpressionSHA256,
  },
  leadingAngular: {
    preHeat: audit.beforeHeatBody, A2Base: audit.A2base,
    actualI2AndHeat: audit.heatChangeAndI2, originalAuditExpression: audit.originalRoot,
    mappedNormalizedMoment: certificate.leading.angular.mappedNormalizedRoot,
    checkedFullAlgebra: audit.check.pass, preHeatConstant: audit.constantOfIntegrationIncluded,
    positiveWaitAndTail: audit.terminal.sourceChecks,
    B8andI1: { B8: audit.correctionHistories.B8.actualRootSystem, I1: audit.correctionHistories.I1.actualRootSystem },
    missingTermsRejected: Object.keys(audit.negativeControls),
    heatTailTruncated: bootstrap.actualHeat.program.heat.tailTruncated,
    ordinaryInwardEtaEndpoints: bootstrap.actualHeat.program.heat.oneSidedEtaEndpoints,
  },
  originalAngularTimeAndFlux: {
    oneBasedMomentNumbers: [2, 4],
    actualBodies: [first.actualWholeIntegrals[1], first.actualWholeIntegrals[3]],
    exactInverseRows: [first.checks[1].pass, first.checks[3].pass],
  },
  tangentialWhole: { theta: select(theta), axial: select(axial) },
  scope: {
    authoritativeValue: 'CONDITIONAL_ORDINARY_SOURCE_INTEGRAL_SEMANTICS',
    numericalValuesEvaluated: false, allOrdersConstructed: false,
    finalJets: 0, release: 'HOLD',
  },
};
await writeFile(output, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(summary.status);
