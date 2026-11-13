import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {
  ActiveModeTwoWitnessComplete,
  instrumentOriginalForcedSource,
  witnessContext,
} from '../active-mode-two-witness/record_active_mode_two.mjs';
import {prepareLivePrimaryC5Binding} from './bind_live_primary_c5.mjs';
import {runFullFirstForced} from './run_full_first_forced.mjs';

export async function runSameFamilyModeTwo({family, current, target, primary, context, out, runtime, supportReceipt, fullForced}) {
  assert.equal(current.domain.prefixOrder, 3);
  const navier = resolve(runtime, 'mathscope-m3/navier');
  const load = name => import(pathToFileURL(join(navier, name)).href);
  const [moment, pressure, temporal, mean, angular] = await Promise.all([
    load('source-global-moment.mjs'), load('source-global-pressure.mjs'),
    load('source-global-temporal.mjs'), load('source-global-initial-mean.mjs'),
    load('source-initialized-angular.mjs'),
  ]);
  const report = {status: 'RUNNING', prefix: 3, stages: [], rows: [],
    completeForcedSeal: false, numericOutputBound: false, finalJets: '0/67', release: 'HOLD'};
  const save = () => writeFile(join(out, 'same-family-mode-two.json'), JSON.stringify(report, null, 2) + '\n');
  const stage = async (name, construct, verify, ...inputs) => {
    report.currentStage = name;
    await save();
    context.checkCancelled();
    const value = construct(...inputs, context);
    assert.equal(verify(value), true, name);
    global.gc();
    context.checkCancelled();
    const row = {name, nodes: value.G.nodes.length, rssBytes: process.memoryUsage().rss};
    report.stages.push(row);
    await save();
    console.log(JSON.stringify(row));
    return value;
  };

  try {
    const moments = await stage('same-family-moments', moment.attachGlobalMomentCurrent,
      moment.assertGlobalMomentCurrent, current);
    const pressed = await stage('same-family-pressure', pressure.attachGlobalCurrentPressure,
      pressure.assertGlobalCurrentPressure, current);
    const timed = await stage('same-family-temporal', temporal.attachGlobalTemporalInverse,
      temporal.assertGlobalTemporalInverse, pressed);
    const initializedMean = await stage('same-family-initialized-mean', mean.attachGlobalInitializedMean,
      mean.assertGlobalInitializedMean, timed, moments);
    const initial = await stage('same-family-initialized-angular', angular.attachGlobalInitializedAngular,
      angular.assertGlobalInitializedAngular, initializedMean);
    const binding = await prepareLivePrimaryC5Binding({runtime, family, current, target, primary, initial});
    report.normRoots = binding.normRoots;
    if (fullForced) {
      report.currentStage = 'same-family-full-forced';
      await save();
      const {result, receipt} = await runFullFirstForced({load, initial, binding, context, out});
      report.full = receipt;
      report.completeForcedSeal = true;
      report.status = 'VERIFIED_COMPLETE_SAME_LIVE_N3_FIRST_FORCED';
      await save();
      if (process.env.MATHSCOPE_THROUGH_FIRST_CYCLE === 'true') {
        const {runFirstCycle} = await import('./run_first_cycle.mjs');
        await runFirstCycle({load, navier, forced: result, context, out});
      }
      return;
    }
    report.currentStage = 'same-family-forced-mode-two';
    await save();

    const original = join(navier, 'source-global-forced-current.mjs');
    const overlayName = 'source-global-forced-current.same-family-mode-two.mjs';
    const overlay = join(navier, overlayName);
    const originalBytes = await readFile(original);
    await writeFile(overlay, instrumentOriginalForcedSource(originalBytes), {flag: 'wx'});
    const witness = await witnessContext({dir: join(out, 'witness'), supportReceipt,
      originalForcedSource: original, instrumentedForcedSource: overlay});
    const forced = await load(overlayName);
    try {
      await forced.attachGlobalForcedCurrentWithCheckpoints(initial, {
        ...context, ...witness,
        async onSourceCheckpoint(event) {
          assert.strictEqual(event.source, initial);
          report.rows.push(binding.bindForcedTemplate(event.old, event.forced));
          await save();
          await witness.onSourceCheckpoint(event);
        },
      });
      throw new Error('Missing the two original same-family mode-two checkpoints');
    } catch (error) {
      if (!(error instanceof ActiveModeTwoWitnessComplete)) throw error;
    }
    assert.deepEqual(report.rows.map(({key, harmonic}) => [key, harmonic]), [['0:1', 2], ['1:1', 2]]);
    assert.deepEqual(await readFile(original), originalBytes);
    report.status = 'VERIFIED_SAME_LIVE_N3_PRIMARY_C5_AND_SELECTED_FORCED_INPUTS';
    await save();
  } catch (error) {
    if (!report.completeForcedSeal) report.status = 'STOPPED_BEFORE_SAME_FAMILY_INPUT_BINDING';
    report.error = {code: error.code ?? null, message: error.message, stack: error.stack};
    await save();
    throw error;
  }
}
