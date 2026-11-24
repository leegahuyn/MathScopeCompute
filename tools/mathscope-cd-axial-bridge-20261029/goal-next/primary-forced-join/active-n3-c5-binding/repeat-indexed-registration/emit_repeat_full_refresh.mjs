import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildLiveRepeatMeanRefresh} from '../../../c144/reference-followup/build_repeat_mean_refresh.mjs';
import {loadOriginalAssembly} from './emit_repeat_indexed_registration.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export async function emitRepeatFullRefresh({navier, pde, repeat, indexed, out}) {
  const {G} = pde;
  const before = G.captureFunctionDefinitions();
  const start = G.nodes.length;
  assert.equal(start, indexed.append.endExclusive);
  assert.deepEqual(before.counts, indexed.append.newNativeDefinitionCounts);
  const load = path => import(pathToFileURL(resolve(navier, path)).href);
  const [assembly, pdeSource, harmonic, mean, operators, global, quadratic] = await Promise.all([
    loadOriginalAssembly(navier),
    load('../post-signed-20261023/source-postfive-full-3d-residual.mjs'),
    load('source-harmonic-assembly.mjs'),
    load('source-updated-mean-pressure.mjs'),
    load('source-full-mean-equations.mjs'),
    load('source-global-current.mjs'),
    load('source-quadratic-identity.mjs'),
  ]);
  assert.equal(assembly.overlaySHA256, indexed.inputs.exposedOriginalHelperSHA256);
  const source = {...assembly, ...pdeSource, ...harmonic, ...mean, ...operators, ...global, ...quadratic};
  const refreshed = buildLiveRepeatMeanRefresh({
    pde, repeat, registration: indexed.registration, source,
  });
  const geometry = pde.five.temporal.frontier.signed.input.global.geometry;
  const residual = harmonic.exactRealCylindricalPDE(G, {
    geometry, velocity: refreshed.fullVelocity, pressure: refreshed.fullPressure,
  });
  assert.ok(residual.allCylindricalConnectionsRetained);
  assert.ok(G.functionDefinitionsUnchanged(before));
  assert.ok(pdeSource.assertActualPostFiveFull3DPDE(pde));
  const end = G.nodes.length;
  assert.ok(end > start && end <= start + 500_000, 'Unexpected Repeat refresh node count');
  const after = G.captureFunctionDefinitions();
  assert.equal(after.counts[1], before.counts[1] + 6);
  assert.deepEqual(after.counts.slice(2), before.counts.slice(2));
  const current = G.coupledDefinitions();
  const names = Object.keys(refreshed.covarianceDeltaFields);
  const covariance = Object.fromEntries(names.map(key => {
    const field = refreshed.covarianceDeltaFields[key];
    return [key, {field: field.field, root: field.root, updated: refreshed.updatedCovariance[key]}];
  }));
  const pressure = refreshed.delta.pressure;
  const roots = {
    covariance,
    mean: {
      defects: refreshed.updatedDefects,
      pressureIncrement: pressure.value,
      pressureRemainder: pressure.cutoffRemainder,
      deltaRadialPressureDerivative: pressure.fullRadialDerivative,
    },
    oldVelocity: pde.velocity.fullPhysicalVelocity,
    oldPressure: pde.pressure.fullPhysicalPressure,
    oldConservative: pde.residual.conservative,
    repeatAngular: indexed.registration.fields.map(field => field.root),
    velocity: refreshed.fullVelocity,
    pressure: refreshed.fullPressure,
    divergence: residual.divergence,
    conservative: residual.conservativeResidual,
    advective: residual.advectiveResidual,
    pressureGradient: residual.pressureGradient,
    vectorLaplacian: residual.vectorLaplacian,
  };
  const nodes = Buffer.from(G.nodes.slice(start, end).map(node => JSON.stringify(node) + '\n').join(''));
  const definitions = Buffer.from(JSON.stringify({
    expressions: current.expressions.slice(before.counts[0]),
    fields: current.fields.slice(before.counts[1]),
  }) + '\n');
  const receipt = {
    schema: 'MathScope.N8.SameLiveRepeatFullRefreshCandidate/1',
    status: 'CANDIDATE_FULL_PRESSURE_AND_PDE_GRAPH_CONSTRUCTED',
    predecessor: {
      originalStreamSHA256: indexed.inputs.repeatBaseStreamSHA256,
      indexedAppendSHA256: indexed.append.nodeSHA256,
      indexedDefinitionsSHA256: indexed.append.definitionsSHA256,
    },
    append: {
      start, end, nodeSHA256: digest(nodes), definitionsSHA256: digest(definitions),
      previousCounts: before.counts, newCounts: after.counts,
    },
    roots,
    scope: {
      sameLiveGraph: true,
      independentWholeFieldAngularProjectionProved: false,
      fullPhysicalResidualASTRecomputed: true,
      completeSecondForcedState: false,
      physicalAllDomainAdmission: 'OPEN',
      fixedLabelC1AllRows: 'OPEN',
      completeFlatRemainder: 'OPEN',
      finalJets: 0,
      release: 'HOLD',
    },
  };
  await writeFile(resolve(out, 'active-repeat-full-refresh-append.jsonl'), nodes, {flag: 'wx'});
  await writeFile(resolve(out, 'active-repeat-full-refresh-definitions.json'), definitions, {flag: 'wx'});
  await writeFile(resolve(out, 'active-repeat-full-refresh.json'), JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx'});
  return receipt;
}
