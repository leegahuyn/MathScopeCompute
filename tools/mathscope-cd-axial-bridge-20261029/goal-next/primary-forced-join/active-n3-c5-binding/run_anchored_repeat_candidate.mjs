/** Run the repeated Forced candidate only after the original source seal exists. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {exportCoupledSnapshot} from './spatial-stage1/export_coupled_snapshot.mjs';
import {emitActiveN3RepeatCandidate} from './repeat-candidate-preflight/emit_active_n3_repeat_candidate.mjs';

const ORIGINAL_SHA = '4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export function anchoredRepeatMode({override, manualMode, hosted = false} = {}) {
  const mode = override || manualMode || (hosted ? 'metadata' : 'off');
  assert.ok(['off','metadata','full-source'].includes(mode), 'Invalid repeated Forced candidate mode.');
  return mode;
}

export async function runAnchoredRepeatCandidate({navier,pde,firstCycle,context,out}) {
  const event = process.env.GITHUB_EVENT_PATH;
  const manualMode = event ? JSON.parse(await readFile(event,'utf8')).inputs?.repeat_mode : undefined;
  const mode = anchoredRepeatMode({override: process.env.MATHSCOPE_ACTIVE_N3_REPEAT_MODE,
    manualMode, hosted: process.env.GITHUB_ACTIONS === 'true'});
  if (mode === 'off') return null;
  const name = 'source-postfive-repeat-forced.mjs';
  const path = resolve(navier,'../post-signed-20261023',name);
  const source = await readFile(new URL('./repeat-candidate-preflight/pinned-original/' + name,import.meta.url));
  assert.equal(sha(source), ORIGINAL_SHA);
  try {
    await writeFile(path,source,{flag:'wx'});
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  assert.equal(sha(await readFile(path)), ORIGINAL_SHA, 'Restore the pinned original repeat source in the disposable runner.');
  const receipt = await emitActiveN3RepeatCandidate({
    navier,pde,firstCycle,context,out,mode,deferExport:mode === 'full-source',
  });
  if (mode === 'full-source') {
    const snapshot = await exportCoupledSnapshot(navier,pde.G,{
      dir: resolve(out,'active-n3-repeat-forced-source'), roots:receipt.rootIds,
      scope:'SAME_LIVE_ACTIVE_N3_POST_FIVE_REPEAT_FORCED_CONDITIONAL_SOURCE',
      sourceCommit:process.env.GITHUB_SHA || 'UNKNOWN_LOCAL_RUN',
      pr30Commit:pde.five.temporal.frontier.signed.source.sourceCommit,
    });
    await writeFile(resolve(out,'active-n3-repeat-forced-export.json'),JSON.stringify({
      schema:'MathScope.N8.SameLiveRepeatCandidateExport/1',snapshot,
      candidate:'active-n3-repeat-forced-candidate.json',guardedMatchesOriginalSupportedSource:'OPEN',
      completeSecondCorrection:'OPEN',finalJets:0,release:'HOLD',
    },null,2)+'\n',{flag:'wx'});
  }
  return receipt;
}
