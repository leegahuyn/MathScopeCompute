import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {fourierSpace,randomSolenoidal,advectDirect,advectFFT,galerkinAcceptance} from '../galerkin.mjs';
import {correctionAcceptance} from '../corrections.mjs';
import {sourceMeanMomentBridge} from '../source-mean-map.mjs';
import {localizationAcceptance} from '../localization.mjs';
import {NAVIER_M3_EXAMPLES,runNavierM3,replayNavierM3} from '../index.mjs';

const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','evidence');fs.mkdirSync(dir,{recursive:true});
const galerkin=galerkinAcceptance(),correction=correctionAcceptance(),localization=localizationAcceptance(),examples=[];
for(const example of NAVIER_M3_EXAMPLES){const result=await runNavierM3(example.input),replay=await replayNavierM3(result);examples.push({id:example.id,input:example.input,status:result.status,executionStatus:result.executionStatus,runHash:result.runHash,replay:replay.pass});fs.writeFileSync(path.join(dir,example.id+'.json'),JSON.stringify(result,null,2)+'\n');}
const mutated=await runNavierM3(NAVIER_M3_EXAMPLES.find(x=>x.id==='N8-TG').input);mutated.results.final[0]+=1;let tamperRejected=false;try{await replayNavierM3(mutated);}catch(e){tamperRejected=e.code==='REPLAY_HASH_MISMATCH';}
const forgedAuthority=await runNavierM3({package:'N8',operation:'galerkin'});forgedAuthority.evidence.formalComplete=true;let authorityRejected=false;try{await replayNavierM3(forgedAuthority);}catch(e){authorityRejected=e.code==='REPLAY_AUTHORITY_MISMATCH';}
const forgedView=await runNavierM3({package:'N8',operation:'galerkin'});forgedView.observations.samples[0].velocity[0]+=1;let viewRejected=false;try{await replayNavierM3(forgedView);}catch(e){viewRejected=e.code==='REPLAY_AUTHORITY_MISMATCH';}
const S=fourierSpace(2),initial=randomSolenoidal(S,5489),fft=advectFFT(S,initial);
fs.writeFileSync(path.join(dir,'numpy-input.json'),JSON.stringify({cutoff:2,modes:S.modes,initial:[...initial],direct:[...advectDirect(S,initial)],fft:[...fft.value],fftGrid:fft.gridSize}));
const actualMean=sourceMeanMomentBridge();
const checks=[...actualMean.checks,...galerkin.checks,...correction.checks,...localization.checks,{id:'tampered-replay-rejected',pass:tamperRejected},{id:'forged-formal-badge-rejected',pass:authorityRejected},{id:'forged-observation-rejected',pass:viewRejected},{id:'examples-run-and-replay',pass:examples.every(x=>x.replay)}];
const result={schema:'MathScope.NavierM3.SelectedAcceptance/1',checks,pass:checks.every(x=>x.pass),counts:{checks:checks.length,examples:examples.length},examples,
  measurements:{FFTDirect:galerkin.convolution.normalizedError,aliasMutation:galerkin.convolution.aliasNormalizedError,TGOrders:galerkin.observedOrder,fiveMomentNormalizedError:correction.moments.normalizedFiveEquationError,projectedODEExactError:correction.response.endpointError},
  scope:'Finite implementations and source-bound construction/guard checks. N6/N7 source reconstruction and the original 24 criteria are not all complete.',
  fullM3Complete:false,paperReconstructionComplete:false};
fs.writeFileSync(path.join(dir,'acceptance.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
