/** Reproducible, compact input to the independent Fraction/Decimal audit. */
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {actualMeanPulseAmplitude,encloseLiouvilleTransfer} from '../actual-pulse-amplitude-integrator.mjs';
import {point,iadd,imul,nextDown,nextUp} from '../../../mathscope-m1/navier/numerics.mjs';

const sha=async path=>createHash('sha256').update(await readFile(new URL(path,import.meta.url))).digest('hex');
const actual=actualMeanPulseAmplitude({steps:32}),finiteCases=[];
for(const G of[2,4,8]){
  const steps=32,L=.5,inv=[nextDown(1/G),nextUp(1/G)];let state=[point(1),point(.8)];
  for(let j=0;j<steps;j++){
    const left=j*L/steps,right=(j+1)*L/steps,potential=[nextDown(.25+left/5),nextUp(.25+right/5)];
    const {matrix}=encloseLiouvilleTransfer({potential,step:point(L/steps),inverseGrowth:inv});
    state=matrix.map(row=>row.reduce((sum,x,i)=>iadd(sum,imul(x,state[i])),point(0)));
  }
  finiteCases.push({G,L,steps,initial:[1,.8],potential:'1/4+zeta/5',finalScaledState:state,sourceInstanceCertified:false});
}
const result={schema:'MathScope.ActualPulseAmplitudeIndependentInput/1',
  sourceProfile:actual.profileId,sourceAssemblySHA256:actual.sourceHash,
  runtimeSHA256:{phase:await sha('../actual-pulse-amplitude-phase.mjs'),integrator:await sha('../actual-pulse-amplitude-integrator.mjs')},
  sourceChecks:actual.sourceScales.checks,
  actual:{request:actual.request,initial:actual.initial,rows:actual.rows.map(r=>({a:r.a,radial:r.radialOverP,movingN:r.minusMovingNOverSqrtLambdaUStarP,theta:r.thetaOverSqrtLambdaUStarP,z:r.zOverUStarP,energy:r.energyOverP2UStar2,energyDerivative:r.energyDerivativeOverGScaleP2UStar2,referenceLog:r.referenceNormalizedLogP,actualLogNorm:r.actualNormalizedLogNorm,sourcePath:r.sourcePath})),scope:actual.scope},
  finiteOperatorDiagnostics:finiteCases,
  note:'The finite G diagnostics and zero-small-parameter limits test the operator and arithmetic. Actual production inputs always retain the pinned positive source parameters.'};
const path=new URL('./actual-pulse-amplitude-independent.json',import.meta.url);
await writeFile(path,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({fixture:path.pathname,rows:result.actual.rows.length,finiteCases:finiteCases.length,sourceChecks:result.sourceChecks.length}));
