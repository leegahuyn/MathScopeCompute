/** Run the repeated Forced candidate only after the original source seal exists. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
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
  return emitActiveN3RepeatCandidate({navier,pde,firstCycle,context,out,mode});
}
