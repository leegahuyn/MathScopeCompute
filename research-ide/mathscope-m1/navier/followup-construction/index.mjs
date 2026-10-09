/** Additional source constructions, kept separate from the frozen v50 modules.
 * A local bound or a computed source component is not a completed global witness.
 */
import {ComputeError} from '../numerics.mjs';
import {certifyAxis, axisExampleInput, validateAxisInput} from './axis-certificates.mjs';
import {runAdmissibleLoop, getLoopExamples, validateLoopInput} from './admissible-loop.mjs';
import {runControlledContinuation, getContinuationExamples, validateContinuationInput} from './controlled-continuation.mjs';
import {runOuterConstruction, outerExampleInput, validateOuterInput} from './outer.mjs';
import {certifyAxisSource, getAxisSourceExamples, validateAxisSourceInput} from './axis-source-certificate.mjs';
import {certifySourcePressureAnalytic, sourcePressureAnalyticExampleInput, validateSourcePressureAnalyticInput} from './pressure-analytic.mjs';
import {runRadialModulation, getRadialModulationExamples, validateRadialModulationInput} from './source-radial-modulation.mjs';
import {runInnerGluing, getInnerGluingExamples, validateInnerGluingInput} from './source-inner-gluing.mjs';

export const FOLLOWUP_KINDS = Object.freeze([
  'ns.axis-certificate', 'ns.source-outer',
  'ns.controlled-continuation', 'ns.admissible-loop',
  'ns.pressure-certificate', 'ns.axis-source-certificate', 'ns.radial-modulation', 'ns.source-inner-gluing',
]);

export function getFollowupExamples() {
  return [
    {id:'ns-axis-exact-bounds', label:'실제 Bρ 국소 수렴·양성·무한 tail 상계',
      request:{kind:'ns.axis-certificate', input:axisExampleInput(),
        budget:{maxOperations:20000000,maxMilliseconds:60000,maxPoints:2048}}},
    {id:'ns-source-outer-repairs', label:'원문 외곽 진폭·모멘트·heat 보상',
      request:{kind:'ns.source-outer', input:outerExampleInput(),
        budget:{maxOperations:20000000,maxMilliseconds:60000,maxPoints:2048}}},
    ...getContinuationExamples(), ...getLoopExamples(),
    {id:'ns-source-pressure-bounds',label:'실제 A.21 압력 · 복소 영역과 모든 η 도함수 상계',
      request:{kind:'ns.pressure-certificate',input:sourcePressureAnalyticExampleInput(),
        budget:{maxOperations:20000000,maxMilliseconds:60000,maxPoints:2048}}},
    ...getAxisSourceExamples(), ...getRadialModulationExamples(),
    ...getInnerGluingExamples().map(e=>({...e,request:{...e.request,budget:{...e.request.budget,maxMillis:60000}}})),
  ];
}

export function validateFollowupInput(kind, input={}) {
  const validator = {
    'ns.axis-certificate':validateAxisInput,
    'ns.source-outer':validateOuterInput,
    'ns.controlled-continuation':validateContinuationInput,
    'ns.admissible-loop':validateLoopInput,
    'ns.pressure-certificate':validateSourcePressureAnalyticInput,
    'ns.axis-source-certificate':validateAxisSourceInput,
    'ns.radial-modulation':validateRadialModulationInput,
    'ns.source-inner-gluing':validateInnerGluingInput,
  }[kind];
  if(!validator) return {valid:false,status:'UNSUPPORTED',message:'Unsupported follow-up NS construction.'};
  return validator(input);
}

export async function runFollowupJob(kind, input, budget) {
  budget.tick();
  const runner = {
    'ns.axis-certificate':certifyAxis,
    'ns.source-outer':runOuterConstruction,
    'ns.controlled-continuation':runControlledContinuation,
    'ns.admissible-loop':runAdmissibleLoop,
    'ns.pressure-certificate':certifySourcePressureAnalytic,
    'ns.axis-source-certificate':certifyAxisSource,
    'ns.radial-modulation':runRadialModulation,
    'ns.source-inner-gluing':runInnerGluing,
  }[kind];
  if(!runner) throw new ComputeError('UNSUPPORTED','Unsupported follow-up NS construction.');
  const raw = await runner(input,budget);
  if(!raw || typeof raw!=='object' || Array.isArray(raw))
    throw new ComputeError('COMPUTATION_ERROR','A source construction must return a result object.');
  // Runtime observations are reported once by navier/index.mjs. Keeping elapsed
  // time inside an analytic certificate would change its mathematical replay hash.
  const {execution,executionMetrics,...result} = raw;
  const scopes={
    'ns.axis-certificate':'명시적인 유리함수 압력에 대한 국소 축 해의 정확 상계와 원문 정리 참조',
    'ns.source-outer':'유한 η 단면에서 원문 외부 스케줄·보정·A.21 압력의 실제 수치 계산',
    'ns.controlled-continuation':'유한 축 계수에서 시작하는 B.22·B.26의 실제 수치 연장',
    'ns.admissible-loop':'제공된 각 고정 상태에 대한 C.1 루프와 모든 위상의 원뿔 간격 상계',
    'ns.pressure-certificate':'실제 A.21 목표 압력의 양의 측도·복소 영역·모든 도함수에 대한 정확 상계',
    'ns.axis-source-certificate':'실제 A.21 목표 압력과 같은 h로 결속된 국소 축의 정확 상계',
    'ns.radial-modulation':'명시된 annulus에서 C.12 변조와 비선형 5모멘트 첫 patch의 실제 수치 계산',
    'ns.source-inner-gluing':'실제 A.21/B.26 끝점에서 B.34 연장·Gi 복원·다섯 누적 모멘트의 비선형 B.8 보정을 계산한 유한 η 후보',
  };
  const blockers=result.blockers??result.missingConditions??(
    kind==='ns.axis-certificate'?[
      '이 축 입력과 완성된 A.21 외부 압력이 같다는 인증은 아직 연결되지 않았습니다.',
      '무한 계수열의 상계와 별도 유한 η-jet 계산 사이의 동일성·반올림 오차 연결이 필요합니다.',
      '생성된 해석적 전제 전체의 Lean 증명과 전역 접합·응력 인증은 별도 조건입니다.',
    ]:['ns.pressure-certificate','ns.axis-source-certificate'].includes(kind)?[
      '실제 A.21 목표 압력을 사용합니다. 수치 보정된 외곽 장과 정확히 같은 압력인지의 인증은 남아 있습니다.',
      '별도 유한 η-jet 배열과 무한 계수열의 동일성·반올림 오차 연결은 남아 있습니다.',
      '생성된 해석적 전제 전체의 Lean 증명과 전역 접합·응력 인증은 별도 조건입니다.',
    ]:kind==='ns.source-outer'?[
      '모든 η에서 매개변수 조건과 모멘트 등식을 인증해야 합니다.',
      '정규 축과 제어 연장, 엄밀한 다섯 모멘트 접합을 연결해야 합니다.',
      '부호와 로그로 보존된 잔차는 수치 기록입니다. 작은 정규화 잔차만으로 정확 등식을 판정하지 않습니다.',
      ...(result.stressSupport?.missing??[]),
    ]:[]);
  return {
    ...result,
    domainStatus:result.domainStatus??(kind==='ns.source-outer'&&result.status==='PARTIAL'?'SOURCE_OUTER_CONSTRUCTION_COMPUTED':result.status),
    evidenceGrade:result.evidenceGrade??'SOURCE_FORMULA',
    certificateScope:result.certificateScope??scopes[kind],
    scopeDescription:scopes[kind],
    blockers,
    fullProfileCertified:false,
    fullCertifiedProfile:false,
    fullNavierStokesSolution:false,
    sourceConstructionScope:{
      ...(result.sourceConstructionScope??{}),
      originalAcceptanceIds:['ns.axis-certificate','ns.axis-source-certificate'].includes(kind)?['N3-01','N3-03','N3-04']:
        kind==='ns.pressure-certificate'?['N3-01','N3-02','N3-03']:
        kind==='ns.source-outer'?['N3-02','N3-07']:
        kind==='ns.controlled-continuation'?['N3-04','N3-05','N3-07']:
        kind==='ns.source-inner-gluing'?['N3-01','N3-05','N3-06','N3-07']:['N3-06'],
      completedGlobalWitness:false,
      generatedAnalyticPremisesKernelChecked:false,
      finiteOrLocalResultIsNotFullProfileCertification:true,
    },
  };
}
