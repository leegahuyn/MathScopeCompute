import {galerkinAcceptance,integrateGalerkin,residualSplitFixture} from './galerkin.mjs';
import {correctionAcceptance,temporalMeanInverse,fiveMomentCorrection,symbolicMomentMap,signedCovarianceIncrement,correctionOrderLedger,harmonicLedger,harmonicResponse,NS_PAPER} from './corrections.mjs';
import {localizationAcceptance,localizationContract,forceExtensionSchedule,verifyPeriodization,nearTerminalSchedule} from './localization.mjs';
import {inheritedSource} from './source-inheritance.mjs';
import {sourceMeanMomentBridge} from './source-mean-map.mjs';
import {implementationPin} from './implementation-pin.mjs';
import {buildFlowObservations,validateFlowObservationOptions} from './flow-observations.mjs';
import {recordedSourceReconstruction} from './source-current-evidence.mjs';
import {recordedInnerGrowth,innerGrowthObservations} from './source-inner-growth-evidence.mjs';
import {evaluateSourceCoreRefinement,sourceCoreRefinementObservations} from './source-core-refinement.mjs';
import {recordedSourceNearTerminal,sourceNearTerminalObservations} from './source-near-terminal-evidence.mjs';
import {recordedGlobalMoment,globalMomentObservations} from './source-global-moment-evidence.mjs';
import {recordedSourceN7DomainExterior,sourceExteriorForceObservations} from './source-exterior-force-evidence.mjs';
import {recordedGlobalSigned,globalSignedObservations} from './source-global-signed-evidence.mjs';
import {recordedSourceCoreRestrictionEvidence,sourceCoreRestrictionEvidenceObservations} from './source-core-restriction-evidence.mjs';
import {recordedGlobalMomentFullPressure,globalMomentFullPressureObservations} from './source-global-moment-pressure-evidence.mjs';
import {sourceLocalizationOperatorEvidence,sourceLocalizationOperatorEvidenceObservations} from './source-localization-operator-evidence.mjs';
import {sourcePeriodizationReviewEvidence,sourcePeriodizationReviewEvidenceObservations} from './source-periodization-review-evidence.mjs';
import {recordedGlobalTemporalInverse,globalTemporalInverseObservations} from './source-global-temporal-evidence.mjs';
import {recordedGlobalForcedCurrent,globalForcedCurrentObservations} from './source-global-forced-current-evidence.mjs';

const bad=(code,message)=>{throw Object.assign(new Error(message),{code});};
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
async function sha(x){const b=new TextEncoder().encode(canonical(x)),d=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}
const copy=x=>JSON.parse(JSON.stringify(x));

export const NAVIER_M3_EXAMPLES=[
  {id:'N6-workbench',title:'N6 보정 연산과 소스 의무',input:{package:'N6',operation:'workbench'}},
  {id:'N6-source-reconstruction',title:'N6 원본 압력·C5·signed curl 실제 실행 자료',input:{package:'N6',operation:'source-reconstruction'}},
  {id:'N6-global-moment-record',title:'N6 전체 band·label의 다섯 모멘트·압력 보정 기록',input:{package:'N6',operation:'global-moment-record'}},
  {id:'N6-global-moment-full-pressure-record',title:'N6 다섯 원문 적분·전체 보조 토러스 압력·비선형 나머지항',input:{package:'N6',operation:'global-moment-full-pressure-record'}},
  {id:'N6-global-temporal-inverse-record',title:'N6 원문 시간평균 역연산 · 모든 Fourier 꼬리와 축 방향 potential',input:{package:'N6',operation:'global-temporal-inverse-record'}},
  {id:'N6-global-forced-current-record',title:'N6 모든 각도 source 역연산 · cutoff curl·새 모드·압력 검증',input:{package:'N6',operation:'global-forced-current-record'}},
  {id:'N6-global-signed-record',title:'N6 원래 고정 진폭 · 전체 signed covariance와 세 나머지항',input:{package:'N6',operation:'global-signed-record'}},
  {id:'N6-source-mean',title:'N6 원래 λ의 실제 mean-patch 연결',input:{package:'N6',operation:'source-mean-map'}},
  {id:'N6-harmonic',title:'N6 비영 조화항 응답',input:{package:'N6',operation:'harmonic-response'}},
  {id:'N6-signed',title:'N6 signed covariance increment',input:{package:'N6',operation:'signed-covariance',parameters:{target:[-.003,.002]}}},
  {id:'N6-moments',title:'N6 다섯 radial moment',input:{package:'N6',operation:'five-moments',parameters:{lambda:.2,a:1,d:.2}}},
  {id:'N7-workbench',title:'N7 localization·force 관문',input:{package:'N7',operation:'workbench'}},
  {id:'N7-inner-growth-record',title:'N7 원래 내부 경로 · 양의 하한과 엄밀 구간',input:{package:'N7',operation:'inner-growth-record'}},
  {id:'N7-source-domain-exterior',title:'N7 원문 cutoff 정의역 · 외부 영역의 실제 힘·압력',input:{package:'N7',operation:'source-domain-exterior-record'}},
  {id:'N7-source-core-restriction',title:'N7 최종 장의 내부 경로 식별 · 전체 보정항 지지 검증',input:{package:'N7',operation:'source-core-restriction-record'}},
  {id:'N7-source-localization-operator',title:'N7 원문 국소화 · 모든 교차항과 압력 항등식',input:{package:'N7',operation:'source-localization-operator'}},
  {id:'N7-source-periodization-review',title:'N7 원문 비교 정리 · 점성 배율과 지지 분리 주기화',input:{package:'N7',operation:'source-periodization-review'}},
  {id:'N7-periodic',title:'N7 지지 분리와 주기화',input:{package:'N7',operation:'periodization',parameters:{sameForcing:true,periodicPressure:true,zeroInitialData:true}}},
  {id:'N8-TG',title:'N8 Taylor–Green 적응 계산',input:{package:'N8',operation:'galerkin',parameters:{cutoff:2,viscosity:1,endTime:.5,initialStep:.1}}},
  {id:'N8-nonlinear',title:'N8 비선형 Fourier 흐름',input:{package:'N8',operation:'galerkin',parameters:{cutoff:2,seed:103,endTime:.08,rtol:1e-5}}},
  {id:'N8-flow',title:'N8 실제 유선·입자 경로와 core/global 에너지',input:{package:'N8',operation:'galerkin',parameters:{cutoff:2,viscosity:1,endTime:.2,initialStep:.025,
    observation:{seeds:[[Math.PI/4,0,0],[Math.PI/3,Math.PI/4,0]],steps:16,angularOrigin:[0,0,0],
      coreBounds:[[Math.PI/4,3*Math.PI/4],[0,Math.PI/2],[0,Math.PI]],coreGrid:4}}}},
  {id:'N8-nearT',title:'N8 양의 τ와 log 좌표',input:{package:'N8',operation:'near-terminal'}},
  {id:'N8-source-near-terminal',title:'N8 원문 내부 경로 · 세 속도 성분의 정확한 구간',input:{package:'N8',operation:'source-near-terminal-record'}},
  {id:'N8-source-core-refinement',title:'N8 원문 내부장 · 독립 격자·차수·정밀도 비교',input:{package:'N8',operation:'source-core-refinement'}},
  {id:'N8-acceptance',title:'N8 FFT·aliasing·energy 검사',input:{package:'N8',operation:'acceptance'}}
];

export const NAVIER_M3_PROGRESS={
  N6:{status:'PARTIAL_SOURCE_RECONSTRUCTION',complete:false,
    implemented:['source4/common6 hash·root 상속과 같은 common6 원본 생성자 실제 재실행','전체 원래 band·label의 curl 6개 공분산·현재 P/J와 Haar 평균 압력','두 원래 pulse의 실제 C4/C5·FTC body·비가환 변분계와 retained tail','전체 현재 residual에서 유도한 signed target·고정 H/a·실제 full curl·세 remainder·갱신 mean pressure/P/J','전체 band·label 현재 P/J의 원래 다섯 bump·두 보존 적분·전체 보조 토러스 압력·비선형8.26/27 재계산','원래 M2 mean-patch의 양의 λ·a와 5 moment inverse 구간','원래 전체 zero-mean residual의 실제 Fourier inverse·m+4 도함수 꼬리·모든 요청별 bound·ci/T1/A1/느린 시간 항·독립 검산','현재 source의 모든 비영 각도 inverse 20개·원래 cutoff 뒤 전체 curl·새 m+m′ 모드와 유한 각도 꼬리·540개 PDE 계수 및 2320개 식의 저장 그래프 재검증'],
    remaining:['실제 temporal inverse 이후의 새 pressure·다섯 moment 보정·j0 초기화·B0/C0 class 지수','검증된 조화항 보정과 매 단계 새 압력·전체 physical PDE를 연결한 네 단계 반복','같은 qbig의 모든 필요한 도함수 상수와 실제 source auxiliary Fourier tail','동일 최종 cutoff sum과 Lemma5.4 tail']},
  N7:{status:'SOURCE_DOMAIN_VERIFIED_FINAL_FIELD_PARTIAL',complete:false,
    implemented:['동일 원본 초기 조건과 Lemma9.7을 연결한 qstar 정의역·cutoff support·초기 영 구간·고정 K·unit plateau','원래 heat 외부 영역의 실제 pressure/force와 nonzero div f·Poisson 항등식','원래 양의 h를 보존한 외부 force/pressure terminal jet 0…4차','같은 source core의 양의 하한과 전체 꼬리·모든 원문 연산자의 열린 지지 귀납으로 최종 장 내부 경로 식별','원문 curl(cA)+cB·cp의 실제 계수와 전체 10개 commutator·div u=0·div f를 유지한 압력 항등식','같은 원문 cutoff의 ν·공간·시간 배율, 단위 토러스의 엄격한 지지 분리와 모든 비교 정리 가정 보존'],
    remaining:['비영 환형 보정값을 포함하는 전체 공간 장의 수치 평가','동일 global force의 terminal 모든 차수 jets·정량 norm·t>1 접합 tail','활성 시간대의 전체 compact K energy/dissipation/forcing work와 독립 refinement']},
  N8:{status:'GENERIC_GALERKIN_EXECUTED_RECONSTRUCTION_PARTIAL',complete:false,
    implemented:['divergence-free Fourier basis·zero mean','exact convolution 대 padded FFT','IMEX·CFL·local error·energy defect','실제 Taylor–Green 및 비선형 계산','원래 양의 τ·log 시간·세 성분의 다섯 내부 경로 구간과 최종 장의 동일한 core 식별','원래 내부장 격자·차수·정밀도 독립 refinement와 양의 비선형/압력 오차','실제 accepted 계수 history의 경로·고정 시각 유선·각속도·core/global 에너지','관측량별 source/test·analytic/Lean 의무와 run hash 연결'],
    remaining:['비영 환형 영역을 포함하는 전체 공간 near-terminal 평가','전체 source의 grid·Fourier·coefficient·pulse/axial scale·precision 적응과 균일 tail','완전한 원문해 enclosure·Lean refinement·모든 claim과 replay artifact 연결']}
};

function fieldObservations(run,options,runPath='results'){
  const observations=buildFlowObservations(run,options),base='research-ide/mathscope-m3/navier/',
    blueprint={source:'MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf',
      sha256:'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac',page:66,
      criterionRecord:'research-ide/mathscope-m3/N8_PROGRESS.json'},
    rows=[
      ['velocity','Cartesian velocity','u(x,t)=sum_k uhat_k(t)*exp(i*k dot x)',
        'The executed finite solenoidal Fourier coefficients are synthesized at the saved positions. No omitted continuum-mode enclosure is supplied.',
        ['tests/independent_numpy.py','tests/flow-observations.test.mjs']],
      ['angular-velocity','Axial angular velocity','Omega_z=((x1-o1)*u2-(x2-o2)*u1)/((x1-o1)^2+(x2-o2)^2)',
        'This is angular velocity about the declared origin and x3 axis, not vorticity. It is undefined on the axis.',
        ['tests/flow-observations.test.mjs']],
      ['streamline','Instantaneous streamline','dx/dsigma=u(x,t_final), with t_final fixed',
        'Coarse/fine RK4 endpoint difference is a numerical indicator, not a rigorous trajectory enclosure.',
        ['tests/flow-observations.test.mjs']],
      ['particle-path','Time-dependent particle path','dx/dt=u_interpolated(x,t)',
        'The actual stored accepted coefficient states are interpolated linearly; their times, decimation and maximum gap are retained. The temporal interpolation and RK4 errors are not rigorously enclosed.',
        ['tests/flow-observations.test.mjs','tests/flow-interface.test.mjs']],
      ['global-energy','Full periodic energy','E=(1/2)*integral_[0,2pi]^3 |u|^2 = (2pi)^3*FourierEnergyMean',
        'Parseval energy of the executed finite trigonometric field is checked against separate midpoint quadrature; it is not the original whole-space compact K energy.',
        ['tests/independent_numpy.py','tests/flow-observations.test.mjs']],
      ['core-energy','Fixed subregion energy','E_core=(1/2)*integral_core |u|^2',
        'The declared Cartesian core box is integrated with n^3 and (2n)^3 midpoint samples. Their difference is an error indicator, not a proven bound.',
        ['tests/flow-observations.test.mjs']]
    ];
  observations.claims=rows.map(([key,observable,equation,meaning,tests])=>({id:'N8-O-'+key,observable,equation,
    reference:{blueprint:{...blueprint,criteria:['N8-01','N8-06','N8-07']},paper:{...NS_PAPER,
      application:'Background Navier-Stokes source; this observation belongs to the separate finite periodic Galerkin branch.'}},
    numericalTests:tests.map(path=>({path:base+path,kind:'NUMERICAL_REGRESSION_SOURCE'})),
    finiteRunChecks:[{id:'finite-run-complete',path:runPath+'.status',pass:run.status==='FINITE_RUN_COMPLETE'},
      {id:'all-accepted-steps-div-free-and-real',path:runPath+'.history',pass:run.history.every(x=>x.pass)}],
    analyticCertificate:null,leanTheorem:null,certifiedApproximation:false,errorEnclosure:null,
    scope:'EXECUTED_FINITE_PERIODIC_MODEL',meaning}));
  for(const sample of observations.samples)sample.reference={claimIds:['N8-O-velocity','N8-O-angular-velocity'],
    ledger:'observations.claims',coefficientSource:runPath+'.final'};
  for(const path of observations.paths){
    path.observationClaim=path.kind==='PARTICLE_PATH'?'N8-O-particle-path':'N8-O-streamline';
    path.coefficientSource=runPath+(path.kind==='PARTICLE_PATH'?'.stateHistory.frames':'.final');
  }
  for(const row of observations.curves)row.observationClaims={globalEnergy:'N8-O-global-energy',coreEnergy:'N8-O-core-energy'};
  observations.energy.global.observationClaim='N8-O-global-energy';
  observations.energy.core.observationClaim='N8-O-core-energy';
  observations.contract.executedRunPath=runPath;
  return observations;
}

export async function runNavierM3(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['package','operation','parameters'].includes(k)))bad('INVALID_INPUT','Use package, operation and parameters.');
  const pack=input.package??'N8',operation=input.operation??(pack==='N8'?'galerkin':'workbench'),parameters=input.parameters??{};
  if(!['N6','N7','N8'].includes(pack)||!parameters||typeof parameters!=='object'||Array.isArray(parameters))bad('UNSUPPORTED','Supported packages are N6,N7,N8.');
  let results,observations={kind:'CONTRACT_TABLE',samples:[],curves:[]},checks=[];
  if(pack==='N6'){
    if(operation==='workbench'){results=correctionAcceptance();results.residual=residualSplitFixture();checks=[...results.checks,{id:'N6-02-full-quadratic-residual',pass:results.residual.pass}];}
    else if(operation==='source-reconstruction'){results=recordedSourceReconstruction(parameters);checks=results.checks;}
    else if(operation==='global-moment-record'){results=await recordedGlobalMoment(parameters);checks=results.checks;observations=globalMomentObservations(results);}
    else if(operation==='global-moment-full-pressure-record'){results=await recordedGlobalMomentFullPressure(parameters);checks=results.checks;observations=globalMomentFullPressureObservations(results);}
    else if(operation==='global-temporal-inverse-record'){results=await recordedGlobalTemporalInverse(parameters);checks=results.checks;observations=globalTemporalInverseObservations(results);}
    else if(operation==='global-forced-current-record'){results=await recordedGlobalForcedCurrent(parameters);checks=results.checks;observations=globalForcedCurrentObservations(results);}
    else if(operation==='global-signed-record'){results=await recordedGlobalSigned(parameters);checks=results.checks;observations=globalSignedObservations(results);}
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
    else if(operation==='inner-growth-record'){results=await recordedInnerGrowth(parameters);checks=results.checks;observations=innerGrowthObservations(results);}
    else if(operation==='source-domain-exterior-record'){results=await recordedSourceN7DomainExterior(parameters);checks=results.checks;observations=sourceExteriorForceObservations(results);}
    else if(operation==='source-core-restriction-record'){results=await recordedSourceCoreRestrictionEvidence(parameters);checks=results.checks;observations=sourceCoreRestrictionEvidenceObservations(results);}
    else if(operation==='source-localization-operator'){results=await sourceLocalizationOperatorEvidence(parameters);checks=results.checks;observations=sourceLocalizationOperatorEvidenceObservations(results);}
    else if(operation==='source-periodization-review'){results=await sourcePeriodizationReviewEvidence(parameters);checks=results.checks;observations=sourcePeriodizationReviewEvidenceObservations(results);}
    else if(operation==='localization')results=localizationContract(parameters);
    else if(operation==='force-extension')results=forceExtensionSchedule(parameters);
    else if(operation==='periodization')results=verifyPeriodization(parameters);
    else bad('UNSUPPORTED','Unknown N7 operation.');
  }else{
    if(operation==='galerkin'){
      const {observation,...integratorParameters}=parameters;
      // Validate before the solver and keep display/sampling controls out
      // of its numerical input. The complete original input is still hashed.
      const options=validateFlowObservationOptions(observation);
      results=integrateGalerkin(integratorParameters);observations=fieldObservations(results,options);
      checks=[{id:'finite-run-complete',pass:results.status==='FINITE_RUN_COMPLETE'},{id:'all-accepted-steps-div-free-and-real',pass:results.history.every(x=>x.pass)}];
    }
    else if(operation==='acceptance'){results=galerkinAcceptance();checks=results.checks;observations=fieldObservations(results.selectedRun,undefined,'results.selectedRun');}
    else if(operation==='near-terminal'){results=nearTerminalSchedule(parameters);observations={kind:'POSITIVE_TAU_COORDINATES_ONLY',samples:[],curves:results.rows.map(x=>({time:x.s,logRadialScale:x.radialLogScale}))};}
    else if(operation==='source-near-terminal-record'){results=await recordedSourceNearTerminal(parameters);checks=results.checks;observations=sourceNearTerminalObservations(results);}
    else if(operation==='source-core-refinement'){
      results=await evaluateSourceCoreRefinement(parameters);observations=sourceCoreRefinementObservations(results);
      checks=[{id:'fresh-directed-original-core-evaluations',pass:results.freshCoreComparisonsExecuted===true&&results.execution.binary64UsedForDecisions===false},
        {id:'one-control-per-refinement-and-common-point-interval-agreement',pass:results.families.every(f=>f.variants.every(v=>v.verifiedUnchangedControls&&v.comparisons.every(c=>c.intervalsOverlap&&c.samePhysicalCoordinate)))},
        {id:'positive-nonlinear-and-pressure-errors-retained',pass:results.families.every(f=>f.variants.every(v=>v.samples.every(s=>s.nonlinearComparisonErrorsRetained&&s.pressureAnalyticErrorsRetained)))}];
    }
    else bad('UNSUPPORTED','Unknown N8 operation.');
  }
  const normalizedInput={package:pack,operation,parameters:copy(parameters)},resultHash=await sha({input:normalizedInput,results}),inputHash=await sha(normalizedInput);
  observations.contract={...(observations.contract??{}),runHash:resultHash,inputHash};
  for(const claim of observations.claims??[]){claim.runHash=resultHash;claim.inputHash=inputHash;}
  return {schema:'MathScope.NavierM3.Result/1',version:'0.1.0',package:pack,operation,input:normalizedInput,inputHash,runHash:resultHash,
    ...(results.recordedOnly===true?{recordedOnly:true,freshSourceConstructorExecuted:false}:{}),
    ...(results.newSupportProofExecuted===true?{newSupportProofExecuted:true}:{}),
    ...(results.freshExactOperatorProofExecuted===true?{freshExactOperatorProofExecuted:true,freshSourceConstructorExecuted:false}:{}),
    status:NAVIER_M3_PROGRESS[pack].status,executionStatus:results.status??(checks.every(x=>x.pass)?'FINITE_CHECKS_PASSED':'FINITE_CHECKS_FAILED'),
    source:{implementation:implementationPin,paper:NS_PAPER,profile:inheritedSource.sourceProfile,parameterExpressionSHA256:inheritedSource.parameterExpressionSHA256,
      common6:inheritedSource.files.common6,source4:inheritedSource.files.source4,physicalGraph:inheritedSource.graph,inheritedM2Assessment:inheritedSource.inheritedM2Assessment},
    sourceBoundaries:{M2Preserved:true,P7Changed:false,fullUncorrectedResidualAssumedFlat:false,completeN6:false,completeN7:false,completeN8:false,wholeM3Complete:false},
    results,checks,observations,progress:copy(NAVIER_M3_PROGRESS[pack]),
    evidence:{numericOrAlgebraicFiniteExecution:results.recordedOnly!==true||results.newSupportProofExecuted===true,
      ...(results.recordedOnly===true?{recordedOnly:true,freshSourceConstructorExecuted:false,
        ...(results.gate?{recordedSourceGatePassed:results.gate.exitCode===0}:{})}:{}),
      ...(results.newSupportProofExecuted===true?{newSupportProofExecuted:true,recordedSourceMeasurementsReused:true}:{}),
      ...(results.freshExactOperatorProofExecuted===true?{freshExactOperatorProofExecuted:true,recordedSourceMeasurementsReused:true,recordedSourceGatePassed:results.gate.pass===true}:{}),
      analyticCertificate:results.newSupportProofExecuted===true?{kind:'ORIGINAL_SOURCE_CORE_RESTRICTION',
        proofSHA256:results.proofSHA256,scope:copy(results.scope),sourceArtifacts:copy(results.sourceArtifacts),
        nonzeroCorrectionFieldsConstructed:false,newLeanKernelProof:false}:results.freshExactOperatorProofExecuted===true?{
          kind:results.analyticProofKind??'ORIGINAL_LOCALIZATION_OPERATOR_IDENTITIES',proofSHA256:results.proofSHA256,scope:copy(results.scope),
          sourceArtifacts:copy(results.sourceArtifacts),newLeanKernelProof:false}:null,
      leanTheorem:null,formalComplete:false,sourceReconstructionComplete:false}};
}

export async function replayNavierM3(record){
  if(record?.schema!=='MathScope.NavierM3.Result/1')bad('INVALID_REPLAY','Expected a MathScope Navier M3 result.');
  const inputHash=await sha(record.input),originalHash=await sha({input:record.input,results:record.results});
  if(inputHash!==record.inputHash||originalHash!==record.runHash)bad('REPLAY_HASH_MISMATCH','The exported input or results were changed.');
  const fresh=await runNavierM3(record.input);
  if(fresh.runHash!==record.runHash)bad('REPLAY_RESULT_MISMATCH','The current runtime produces a different result; keep the prior run separate.');
  for(const key of ['version','package','operation','status','executionStatus','source','sourceBoundaries','evidence','observations','progress','recordedOnly','freshSourceConstructorExecuted','newSupportProofExecuted','freshExactOperatorProofExecuted']){
    if(canonical(record[key])!==canonical(fresh[key]))bad('REPLAY_AUTHORITY_MISMATCH','The source, view or claim authority was changed: '+key);
  }
  return {schema:'MathScope.NavierM3.Replay/1',pass:true,inputHash,runHash:fresh.runHash,result:fresh};
}
