import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyLivePostFiveSplit} from './verify_postfive_live.mjs';
import {runAnchoredRepeatCandidate} from './run_anchored_repeat_candidate.mjs';
import {emitFirstSpatial, firstSpatialMode} from './spatial-stage1/emit_first_spatial.mjs';

export async function runFirstCycle({load, navier, forced, context, out}) {
  const spatialMode = firstSpatialMode();
  const original = path => import(pathToFileURL(join(navier, '..', path)).href);
  const downstreamContext = {onProgress: context.onProgress, checkCancelled: context.checkCancelled};
  const receipt = {schema: 'MathScope.N7.SameLiveN3OriginalFirstCycle/1',
    status: 'RUNNING', prefix: 3, sourceForcedNodeCount: forced.G.nodes.length,
    stages: [], finalJets: '0/67', N706: 'OPEN', N805: 'OPEN', release: 'HOLD'};
  const save = () => writeFile(join(out, 'first-cycle.json'), JSON.stringify(receipt, null, 2) + '\n');
  let physical, directSplit;
  const stage = async (name, build, verify, summarize) => {
    receipt.currentStage = name;
    await save();
    context.checkCancelled();
    const value = await build();
    assert.equal(verify(value), true, name);
    assert.strictEqual(value.G.nodes, forced.G.nodes, name);
    global.gc();
    context.checkCancelled();
    const record = {name, nodeCount: value.G.nodes.length, rssBytes: process.memoryUsage().rss,
      ...summarize(value)};
    receipt.stages.push(record);
    await save();
    console.log(JSON.stringify(record));
    return value;
  };

  try {
    const corollary = await load('source-global-updated-mean-stress.mjs');
    const stress = await stage('original-latest-corollary-8-5-stress',
      () => corollary.attachGlobalForcedMeanStress(forced, context),
      corollary.assertGlobalUpdatedMeanStress,
      value => ({sigma: value.Sigma, rawSourceRoots: corollary.globalUpdatedMeanStressSourceRoots(value),
        checks: value.checks.map(({id, pass}) => ({id, pass}))}));
    assert.strictEqual(stress.input, forced);
    const signedSource = await load('original-signed-162-successor.mjs');
    const signed = await stage('original-signed-162-successor',
      () => signedSource.attachOriginalSigned162Successor(forced, {
        candidateMaxAdditionalNodes: 250_000,
        assemblyMaxAdditionalNodes: 1_500_000, onProgress: context.onProgress,
      }), signedSource.assertOriginalSigned162Successor, value => {
        assert.strictEqual(value.latestStress.input, stress.input);
        assert.equal(value.audit.allIndexedRows, 1620);
        return {indexedRows: value.audit.allIndexedRows, roots: value.audit.rootInventory};
      });
    const frontierSource = await load('source-signed-temporal-frontier.mjs');
    const frontier = await stage('original-post-signed-temporal-frontier',
      () => frontierSource.attachSigned162TemporalFrontier(signed),
      frontierSource.assertSigned162TemporalFrontier, value => ({scope: value.scope}));
    const temporalSource = await original('post-signed-20261023/source-signed-actual-temporal-inverse.mjs');
    const temporal = await stage('original-post-signed-exact-temporal',
      () => temporalSource.attachActualPostSignedTemporalInverse(frontier, downstreamContext),
      temporalSource.assertActualPostSignedTemporalInverse, value => ({
        inverses: Object.values(value.inverses).map(row => row.exact),
        freshPressureAndMeans: ['P', 'Jtheta', 'Jz'].map(key => value.postTemporal.updatedMeanPressure.mean[key]),
      }));
    const fiveSource = await original('post-signed-20261023/source-signed-actual-five-map.mjs');
    const five = await stage('original-post-signed-five-map',
      () => fiveSource.attachActualPostSignedFiveMap(temporal, downstreamContext),
      fiveSource.assertActualPostSignedFiveMap, value => ({
        freshPressureAndMeans: ['P', 'Jtheta', 'Jz'].map(key => value.postFiveMean.updatedMeanPressure.mean[key]),
      }));
    const pdeSource = await original('post-signed-20261023/source-postfive-full-3d-residual.mjs');
    const pde = await stage('original-post-five-physical-residual',
      () => pdeSource.attachActualPostFiveFull3DPDE(five, downstreamContext),
      pdeSource.assertActualPostFiveFull3DPDE, value => ({
        velocity: value.velocity.fullPhysicalVelocity, pressure: value.pressure.fullPhysicalPressure,
        divergence: value.residual.divergence, conservativeResidual: value.residual.conservative,
      }));
    const splitSource = await original('post-signed-20261023/source-postfive-direct-split.mjs');
    receipt.currentStage = 'original-post-five-direct-split';
    await save();
    context.checkCancelled();
    const split = splitSource.buildSourcePostFiveDirectSplit(pde);
    assert.equal(split.checks.allRootsValid, true);
    assert.equal(split.roots.defects.length, 3);
    context.checkCancelled();
    receipt.split = {roots: split.roots.defects, divergence: split.roots.divergenceDefect,
      nodeCount: forced.G.nodes.length, differencesProvedZero: false};
    receipt.status = 'VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION';
    await save();
    physical = pde;
    directSplit = split;
  } catch (error) {
    receipt.status = 'STOPPED_DURING_FIRST_CYCLE';
    receipt.error = {name: error.name, code: error.code ?? null, message: error.message};
    receipt.stoppedNodes = forced.G.nodes.length;
    await save();
    throw error;
  }
  // Keep the source construction receipt intact if the independent check
  // finds an unmatched operand or a surviving comparison polynomial.
  let splitFailure = null;
  try {
    await verifyLivePostFiveSplit({navier, out, pde: physical, split: directSplit, currentReceipt: receipt});
  } catch (error) {
    if (spatialMode === 'off') throw error;
    splitFailure = error;
  }
  let spatialFailure = null;
  if (spatialMode !== 'off') {
    try {
      await emitFirstSpatial({navier, out, pde: physical, mode: spatialMode,
        splitOutcome: splitFailure ? 'FAILED' : 'VERIFIED'});
    } catch (error) {
      await writeFile(join(out, 'first-correction-spatial-failure.json'),
        JSON.stringify({mode: spatialMode, code: error.code ?? null, message: error.message,
          sameRunDirectSplitOutcome: splitFailure ? 'FAILED' : 'VERIFIED',
          N706: 'OPEN', N805: 'OPEN', finalJets: 0, release: 'HOLD'}, null, 2) + '\n');
      spatialFailure = error;
    }
  }
  let repeatFailure = null;
  if (!splitFailure) {
    try {
      await runAnchoredRepeatCandidate({navier,out,pde:physical,firstCycle:receipt,context:downstreamContext});
    } catch (error) {
      await writeFile(join(out,'active-n3-repeat-forced-failure.json'), JSON.stringify({
        schema:'MathScope.N8.SameLiveRepeatCandidateFailure/1',
        code:error.code ?? null,message:error.message,sameRunFirstCycleVerified:true,
        completeSecondCorrection:'OPEN',finalJets:0,release:'HOLD',
      },null,2) + '\n',{flag:'wx'});
      repeatFailure = error;
    }
  }
  const downstreamFailures = [splitFailure,spatialFailure,repeatFailure].filter(Boolean);
  if (downstreamFailures.length === 1) throw downstreamFailures[0];
  if (downstreamFailures.length > 1) {
    throw new AggregateError(downstreamFailures,'Original source downstream evidence did not finish');
  }
}
