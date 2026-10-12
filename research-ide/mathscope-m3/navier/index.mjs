import {galerkinAcceptance,integrateGalerkin,fourierSpace,sampleVelocity,residualSplitFixture} from './galerkin.mjs';
import {correctionAcceptance,temporalMeanInverse,fiveMomentCorrection,symbolicMomentMap,signedCovarianceIncrement,correctionOrderLedger,harmonicLedger,harmonicResponse,NS_PAPER} from './corrections.mjs';
import {localizationAcceptance,localizationContract,forceExtensionSchedule,verifyPeriodization,nearTerminalSchedule} from './localization.mjs';
import {inheritedSource} from './source-inheritance.mjs';
import {sourceMeanMomentBridge} from './source-mean-map.mjs';
import {implementationPin} from './implementation-pin.mjs';

const bad=(code,message)=>{throw Object.assign(new Error(message),{code});};
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
async function sha(x){const b=new TextEncoder().encode(canonical(x)),d=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}
const copy=x=>JSON.parse(JSON.stringify(x));

export const NAVIER_M3_EXAMPLES=[
  {id:'N6-workbench',title:'N6 보정 연산과 소스 의무',input:{package:'N6',operation:'workbench'}},
  {id:'N6-source-mean',title:'N6 원래 λ의 실제 mean-patch 연결',input:{package:'N6',operation:'source-mean-map'}},
  {id:'N6-harmonic',title:'N6 비영 조화항 응답',input:{package:'N6',operation:'harmonic-response'}},
  {id:'N6-signed',title:'N6 signed covariance increment',input:{package:'N6',operation:'signed-covariance',parameters:{target:[-.003,.002]}}},
  {id:'N6-moments',title:'N6 다섯 radial moment',input:{package:'N6',operation:'five-moments',parameters:{lambda:.2,a:1,d:.2}}},
  {id:'N7-workbench',title:'N7 localization·force 관문',input:{package:'N7',operation:'workbench'}},
  {id:'N7-periodic',title:'N7 지지 분리와 주기화',input:{package:'N7',operation:'periodization',parameters:{sameForcing:true,periodicPressure:true,zeroInitialData:true}}},
  {id:'N8-TG',title:'N8 Taylor–Green 적응 계산',input:{package:'N8',operation:'galerkin',parameters:{cutoff:2,viscosity:1,endTime:.5,initialStep:.1}}},
  {id:'N8-nonlinear',title:'N8 비선형 Fourier 흐름',input:{package:'N8',operation:'galerkin',parameters:{cutoff:2,seed:103,endTime:.08,rtol:1e-5}}},
  {id:'N8-nearT',title:'N8 양의 τ와 log 좌표',input:{package:'N8',operation:'near-terminal'}},
  {id:'N8-acceptance',title:'N8 FFT·aliasing·energy 검사',input:{package:'N8',operation:'acceptance'}}
];

export const NAVIER_M3_PROGRESS={
  N6:{status:'PARTIAL_SOURCE_RECONSTRUCTION',complete:false,
    implemented:['source4/common6 hash·root 상속','전체 비선형 residual 항등식','비영 harmonic projected ODE','signed covariance inverse','정확 대수적 divisor Fourier inverse','원래 M2 mean-patch의 양의 λ·a와 5 moment inverse 구간','고정 domain의 유리수 차수 장부'],
    remaining:['실제 primary-curl state의 temporal+moment 초기화','모든 현재 조화항과 실제 curl을 연결한 네 단계 반복','각 단계의 압력·전체 residual·정밀도 상계','동일 최종 cutoff sum과 Lemma5.4 tail']},
  N7:{status:'BLOCKED_BY_N6_LOCAL_FIELD',complete:false,
    implemented:['qstar 내부 localization cutoff 선택','div f를 포함한 pressure contract','유한 terminal-jet cutoff schedule','지지 분리·same-force·periodic-pressure 관문'],
    remaining:['N6 최종 A,B,p의 실제 localization','동일 force의 terminal 모든 차수 jets','전체 compact K의 energy balance','source e0 양의 하한과 remainder']},
  N8:{status:'GENERIC_GALERKIN_EXECUTED_RECONSTRUCTION_PARTIAL',complete:false,
    implemented:['divergence-free Fourier basis·zero mean','exact convolution 대 padded FFT','IMEX·CFL·local error·energy defect','실제 Taylor–Green 및 비선형 계산','독립 τ·log 좌표·관측 manifest'],
    remaining:['N7를 승계한 실제 near-terminal reconstruction','grid·Fourier·coefficient·precision의 source tail 포함 적응','원문해 수치 enclosure와 Lean refinement 연결']}
};

function fieldObservations(run){
  const S=fourierSpace(run.input.cutoff),positions=[];
  for(let x=0;x<9;x++)for(let y=0;y<9;y++)positions.push([2*Math.PI*x/8,2*Math.PI*y/8,0]);
  return {kind:'ACTUAL_FINITE_FOURIER_FIELD',samples:sampleVelocity(S,run.final,positions),
    curves:run.history.map(x=>({time:x.time,energy:x.energy,gradientSquared:x.gradientSquared,divergence:x.normalizedDivergence})),
    contract:{coordinateFrame:'fixed physical 2pi-periodic box',bounds:[[0,2*Math.PI],[0,2*Math.PI],[0,2*Math.PI]],units:'dimensionless periodic model',time:run.lastResolvedTime,
      velocityOrAngularVelocity:'Cartesian velocity',streamlineOrParticlePath:'instantaneous vector samples; no particle integration',energyScope:'whole periodic domain spatial mean',
      colorRange:[0,Math.max(...sampleVelocity(S,run.final,positions).map(x=>x.speed))],vectorScale:1,automaticVectorNormalization:false,paperReconstruction:false}};
}

export async function runNavierM3(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['package','operation','parameters'].includes(k)))bad('INVALID_INPUT','Use package, operation and parameters.');
  const pack=input.package??'N8',operation=input.operation??(pack==='N8'?'galerkin':'workbench'),parameters=input.parameters??{};
  if(!['N6','N7','N8'].includes(pack)||!parameters||typeof parameters!=='object'||Array.isArray(parameters))bad('UNSUPPORTED','Supported packages are N6,N7,N8.');
  let results,observations={kind:'CONTRACT_TABLE',samples:[],curves:[]},checks=[];
  if(pack==='N6'){
    if(operation==='workbench'){results=correctionAcceptance();results.residual=residualSplitFixture();checks=[...results.checks,{id:'N6-02-full-quadratic-residual',pass:results.residual.pass}];}
    else if(operation==='temporal-inverse')results=temporalMeanInverse(parameters);
    else if(operation==='five-moments')results=fiveMomentCorrection(parameters);
    else if(operation==='source-moment-map')results=symbolicMomentMap();
    else if(operation==='source-mean-map'){results=sourceMeanMomentBridge(parameters);checks=results.checks;}
    else if(operation==='signed-covariance')results=signedCovarianceIncrement(parameters);
    else if(operation==='order-ledger')results=correctionOrderLedger(parameters.stage??0);
    else if(operation==='harmonics')results=harmonicLedger(parameters);
    else if(operation==='harmonic-response'){results=harmonicResponse(parameters);observations={kind:'FINITE_SAMPLED_AMPLITUDE_MODEL',samples:[],curves:results.rows.map(x=>({time:x.v,amplitudeNorm:x.norm,normalError:x.normalError}))};}
    else bad('UNSUPPORTED','Unknown N6 operation.');
  }else if(pack==='N7'){
    if(operation==='workbench'){results=localizationAcceptance();checks=results.checks;}
    else if(operation==='localization')results=localizationContract(parameters);
    else if(operation==='force-extension')results=forceExtensionSchedule(parameters);
    else if(operation==='periodization')results=verifyPeriodization(parameters);
    else bad('UNSUPPORTED','Unknown N7 operation.');
  }else{
    if(operation==='galerkin'){results=integrateGalerkin(parameters);observations=fieldObservations(results);checks=[{id:'finite-run-complete',pass:results.status==='FINITE_RUN_COMPLETE'},{id:'all-accepted-steps-div-free-and-real',pass:results.history.every(x=>x.pass)}];}
    else if(operation==='acceptance'){results=galerkinAcceptance();checks=results.checks;observations=fieldObservations(results.selectedRun);}
    else if(operation==='near-terminal'){results=nearTerminalSchedule(parameters);observations={kind:'POSITIVE_TAU_COORDINATES_ONLY',samples:[],curves:results.rows.map(x=>({time:x.s,logRadialScale:x.radialLogScale}))};}
    else bad('UNSUPPORTED','Unknown N8 operation.');
  }
  const normalizedInput={package:pack,operation,parameters:copy(parameters)},resultHash=await sha({input:normalizedInput,results}),inputHash=await sha(normalizedInput);
  observations.contract={...(observations.contract??{}),runHash:resultHash,inputHash};
  return {schema:'MathScope.NavierM3.Result/1',version:'0.1.0',package:pack,operation,input:normalizedInput,inputHash,runHash:resultHash,
    status:NAVIER_M3_PROGRESS[pack].status,executionStatus:results.status??(checks.every(x=>x.pass)?'FINITE_CHECKS_PASSED':'FINITE_CHECKS_FAILED'),
    source:{implementation:implementationPin,paper:NS_PAPER,profile:inheritedSource.sourceProfile,parameterExpressionSHA256:inheritedSource.parameterExpressionSHA256,
      common6:inheritedSource.files.common6,source4:inheritedSource.files.source4,physicalGraph:inheritedSource.graph,inheritedM2Assessment:inheritedSource.inheritedM2Assessment},
    sourceBoundaries:{M2Preserved:true,P7Changed:false,fullUncorrectedResidualAssumedFlat:false,completeN6:false,completeN7:false,completeN8:false,wholeM3Complete:false},
    results,checks,observations,progress:copy(NAVIER_M3_PROGRESS[pack]),
    evidence:{numericOrAlgebraicFiniteExecution:true,analyticCertificate:null,leanTheorem:null,formalComplete:false,sourceReconstructionComplete:false}};
}

export async function replayNavierM3(record){
  if(record?.schema!=='MathScope.NavierM3.Result/1')bad('INVALID_REPLAY','Expected a MathScope Navier M3 result.');
  const inputHash=await sha(record.input),originalHash=await sha({input:record.input,results:record.results});
  if(inputHash!==record.inputHash||originalHash!==record.runHash)bad('REPLAY_HASH_MISMATCH','The exported input or results were changed.');
  const fresh=await runNavierM3(record.input);
  if(fresh.runHash!==record.runHash)bad('REPLAY_RESULT_MISMATCH','The current runtime produces a different result; keep the prior run separate.');
  for(const key of ['version','package','operation','status','executionStatus','source','sourceBoundaries','evidence','observations','progress']){
    if(canonical(record[key])!==canonical(fresh[key]))bad('REPLAY_AUTHORITY_MISMATCH','The source, view or claim authority was changed: '+key);
  }
  return {schema:'MathScope.NavierM3.Replay/1',pass:true,inputHash,runHash:fresh.runHash,result:fresh};
}
