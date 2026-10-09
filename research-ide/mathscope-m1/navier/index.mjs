/** MathScope M1 Navier–Stokes bounded component laboratory.
 * No current job emits FULL_CERTIFIED_PROFILE or FULL_NAVIER_STOKES_SOLUTION.
 */
import {ComputeError,makeBudget,validatePrecision,finiteNumber,positive,boundedInteger,canonical,sha256,integrate} from './numerics.mjs';
import {provenance} from './provenance.generated.mjs';
import {fixtures} from './fixtures.generated.mjs';
import {leanEvidence} from './lean.generated.mjs';
import {parameters,fromSimilarity,toSimilarity,coordinateFieldSample} from './coordinates.mjs';
import {heatIntegralCertificate,heatFast,heatTaylorFinite,exteriorPoint,exteriorJet,taylorGreenPoint} from './heat.mjs';
import {coordinateChecks,exactPDEChecks,spectralConvolutionCheck,coreReconstructionChecks} from './checks.mjs';
import {solveAxisCoefficients,evaluateAxis,comparisonSeries} from './axis-series.mjs';
import {parameterOrder,buildOuterSchedule,solveFiveMomentRepair,coneMargins,coneModulationFixture,certifiedConeBox} from './radial.mjs';
import {constructLeadingCandidate} from './profile.mjs';
import * as Followup from './followup-construction/index.mjs';

export const VERSION='1.3.0-m1';
const kinds=['ns.provenance','ns.coordinates','ns.heat','ns.exterior','ns.benchmark','ns.axis-series','ns.moments','ns.cone','ns.leading-profile','ns.validate',...Followup.FOLLOWUP_KINDS];
const commonBudget={maxOperations:20000000,maxMilliseconds:60000,maxPoints:480};
const commonPrecision={bits:53,absoluteTolerance:1e-8,relativeTolerance:1e-8};
export function getCapabilities(){return {id:'navier-m1',version:VERSION,kinds,precision:{arithmetic:'exact rational axis bounds; outward binary64 heat and scalar intervals; signed-log outer quantities; binary64 candidate jets and ODEs',bits:53,minimumAbsoluteTolerance:2e-14,independentFixtures:'separate high-precision and exact rational reference calculations',unsupportedPrecisionStatus:'PRECISION_REQUIRED'},budget:{maximumOperations:50000000,maximumMilliseconds:120000,maximumPoints:16384,cancellation:'isCancelled callback checked in bounded numerical loops'},scope:['N1 provenance and exact theorem contract','N2 coordinates, heat, viscosity and independent PDE checks','N3 finite nonlinear axis and exact local bounds for an explicit analytic datum','Source outer repairs, exact A.21 pressure/axis input bounds, B.5 continuation, actual B.34/B.8 cumulative five-moment gluing, C.1 loops and C.12 modulation with nonlinear first-patch correction'],notImplemented:['one uniformly certified quantitative parameter selection for the full original datum','certified identity of the actual A.21 target with repaired outer fields and of finite eta jets with the infinite axis sequence','uniform interval-Newton five-moment gluing and complete radial/eta cone certification after the computed C.12 operation','N4-N8 full construction'],evidenceGrades:{...provenance.evidenceGrades,EXACT_BOUND_CERTIFICATE_WITH_THEOREM_REFERENCE:'Exact executable local bounds with explicit source-theorem references; no full generated analytic Lean proof or global profile.',EXACT_RATIONAL_BOUNDS_WITH_ANALYTIC_THEOREM_ARGUMENT:'Exact scalar bounds for the actual A.21 pressure with explicit analytic theorem arguments; generated Lean premise bundle remains open.'}};}
export function getExamples(){return [
 ['ns-source-contract','논문 166쪽·정리·Lean 어댑터 계약','ns.provenance',{}],
 ['ns-similarity','실제 similarity 좌표와 역변환','ns.coordinates',{X:.6,eta:-.35,theta:.4,tau:.1,h:.005,viscosity:1}],
 ['ns-heat-interval','Heat factor 적분·도함수 구간 인증','ns.heat',{Z:1,h:.005,derivativeOrder:2,taylorOrder:8}],
 ['ns-source-exterior','원문 heat exterior · r > 0','ns.exterior',{tau:.1,h:.005,viscosity:1,cInfinity:1,radialCount:6}],
 ['ns-taylor-green','별도 정확 Taylor–Green 기준 해','ns.benchmark',{time:.19,viscosity:1}],
 ['ns-nonlinear-axis','원문 비선형 축 급수 · 꼬리 미인증','ns.axis-series',{eta:.2,axisOrder:8,Lambda:48,Ymax:1.2}],
 ['ns-five-moments','비선형 5모멘트 · 독립 재적분','ns.moments',{eta:.2}],
 ['ns-cone-operator','Cone 부등식과 실제 radial modulation 연산','ns.cone',{a:3,bs:0,ps:[5,0],N:32}],
 ['ns-leading-candidate','실제 축·외곽 + 미인증 접합 후보','ns.leading-profile',{tau:.1,h:.005,viscosity:1,etaCount:3,radialCount:12,axisOrder:8}],
 ['ns-independent-checks','FD·FFT·고정밀·음성 대조군','ns.validate',{}]
 ].map(([id,label,kind,input])=>({id,label,request:{kind,input,precision:{...commonPrecision},budget:{...commonBudget}}})).concat(Followup.getFollowupExamples().map(e=>({...e,request:{...e.request,precision:{...commonPrecision,...e.request.precision}}})));}
function finiteTree(v,path='input'){if(typeof v==='number'&&!Number.isFinite(v))throw new ComputeError('INVALID_INPUT',`${path} must be finite`);if(Array.isArray(v))v.forEach((x,i)=>finiteTree(x,`${path}[${i}]`));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>finiteTree(x,`${path}.${k}`));}
export function validateRequest(request){
  try{
    if(!request||typeof request!=='object'||!kinds.includes(request.kind))throw new ComputeError('UNSUPPORTED','Unknown NS job kind',{kind:request?.kind,supported:kinds});
    if(request.input!==undefined&&(request.input===null||typeof request.input!=='object'||Array.isArray(request.input)))throw new ComputeError('INVALID_INPUT','input must be an object');
    finiteTree(request);
    const precision=validatePrecision(request.precision),input=request.input??{};
    if(Followup.FOLLOWUP_KINDS.includes(request.kind)){
      const checked=Followup.validateFollowupInput(request.kind,input);
      if(!checked.valid)throw new ComputeError(checked.status??'INVALID_INPUT',checked.message??'Source construction input failed validation',checked.detail??{});
    }else{
      if(input.tau!==undefined)positive(input.tau,'tau');
      if(input.viscosity!==undefined)positive(input.viscosity,'viscosity');
      if(input.h!==undefined)parameters(input);
    }
    for(const k of ['maxOperations','maxMilliseconds','maxPoints'])if(request.budget?.[k]!==undefined){
      const v=request.budget[k];
      if(typeof v!=='number'||!Number.isSafeInteger(v)||v<1)throw new ComputeError('INVALID_INPUT',`${k} must be a positive safe integer`);
    }
    return {valid:true,kind:request.kind,input,precision,budget:{...commonBudget,...request.budget}};
  }catch(e){return {valid:false,status:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{}};}
}
function stripped(v){if(Array.isArray(v))return v.map(stripped);if(v&&typeof v==='object'){const out={};for(const [k,x]of Object.entries(v)){if(x===undefined||typeof x==='function'||k==='budget'||k==='executionMetrics')continue;out[k]=stripped(x);}return out;}return v;}
/** Canonical-safe scalars: a decimal string carries any unsafe integer float. */
export function jsonSafe(v){if(typeof v==='bigint')return {kind:'INTEGER',value:v.toString()};if(typeof v==='number'){if(!Number.isFinite(v))return {kind:'NONFINITE_REJECTED',value:Number.isNaN(v)?'NaN':v>0?'Infinity':'-Infinity',usableAsNumber:false};if(Number.isInteger(v)&&!Number.isSafeInteger(v))return {kind:'FLOAT64',value:v.toExponential(17),precisionBits:53};return Object.is(v,-0)?0:v;}if(Array.isArray(v))return v.map(jsonSafe);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([,x])=>x!==undefined&&typeof x!=='function').map(([k,x])=>[k,jsonSafe(x)]));return v;}
function fieldVisualization(points,description,coordinateMeaning,lostInformation=[]){return {points:points.map(p=>({pos:p.position??p.pos,label:p.label??'',value:p.speed??p.value})),arrows:points.map(p=>({pos:p.position??p.pos,vector:p.velocity??p.vector})),lines:[],axes:['x','y','z'],description,coordinateMeaning,lostInformation};}
function exteriorJob(input,budget){const o={...parameters(input),cInfinity:positive(input.cInfinity??1,'cInfinity')},n=boundedInteger(input.radialCount??6,'radialCount',2,64),rmin=positive(input.rmin??.25,'rmin'),rmax=positive(input.rmax??2,'rmax');if(!(rmax>rmin))throw new ComputeError('INVALID_INPUT','rmax must exceed rmin');const points=[];for(let i=0;i<n;i++)for(let k=0;k<8;k++)for(const z of [-.5,.5]){if(points.length>=budget.maxPoints)break;budget.tick();const r=rmin+(rmax-rmin)*i/(n-1),t=2*Math.PI*k/8,p=exteriorPoint([r*Math.cos(t),r*Math.sin(t),z],o,budget);points.push({...p,label:`r=${r.toPrecision(4)}`});}return {status:'SOURCE_FORMULA_NUMERICAL_EVALUATION',evidenceGrade:'SOURCE_FORMULA',parameters:o,points,normalization:{cInfinity:o.cInfinity,proofSelected:false},domain:{excludeAxis:true,rMinimum:rmin,rMaximum:rmax,globalEnergyClaim:false},diagnostics:{pointCount:points.length,maxSpeed:Math.max(...points.map(p=>p.speed)),fullNavierStokesConstruction:false},errorBudget:{quadrature:'Adaptive Simpson value path; per-point estimates are not rigorous enclosures. Use ns.heat for certified integral balls.',solutionErrorBound:null},visualization:fieldVisualization(points,'원문 heat exterior의 실제 적분값. 축과 전역 접합은 제외됩니다.','Physical Cartesian coordinates and actual velocity components; UI may normalize arrows.',['z-independent standalone component has no finite R3 total energy.','cInfinity is an arbitrary display normalization until the full source matching is complete.'])};}
function benchmarkJob(input,budget){const o={time:input.time??.19,viscosity:input.viscosity??1},points=[];for(let i=0;i<7;i++)for(let j=0;j<7;j++)for(const z of [-.6,0,.6]){if(points.length>=budget.maxPoints)break;budget.tick();points.push(taylorGreenPoint([2*Math.PI*i/7,2*Math.PI*j/7,z],o));}const a=taylorGreenPoint([0,0,0],o),energyDerivative=-a.meanDissipation;return {status:'EXACT_BENCHMARK_FLOAT_EVALUATION',evidenceGrade:'FINITE_NUMERICAL_FIXTURE',parameters:o,points,domain:'(R/(2pi Z))^3',meanEnergy:a.meanEnergy,meanEnstrophy:a.meanEnstrophy,meanDissipation:a.meanDissipation,energyDerivative,fullSourceSolution:false,visualization:fieldVisualization(points,'별도의 정확한 주기 Taylor–Green 기준 해','Periodic physical x,y,z; this fixture is not the source blowup construction.',[])};}
function axisJob(input,budget){const o=parameterOrder(input),outer=buildOuterSchedule(o,budget),eta=finiteNumber(input.eta??.2,'eta');if(Math.abs(eta)>1)throw new ComputeError('INVALID_INPUT','|eta|<=1 required');const solution=solveAxisCoefficients(eta,{...o,axisOrder:input.axisOrder??8},outer.pressureJet,budget),Ymax=positive(input.Ymax??1.2,'Ymax'),values=Array.from({length:41},(_,i)=>evaluateAxis(solution,Ymax*i/(40*o.Lambda)));return {status:solution.status,evidenceGrade:'FORMAL_NONLINEAR_AXIS_COEFFICIENTS',parameters:{...o,eta,Ymax},solution,values,comparison:comparisonSeries(4.1),pressureAudit:outer.pressureAudit(),certifiedNonlinearRadius:null,certifiedNonlinearTail:null,blockers:solution.blockers,visualization:{points:values.map(p=>({pos:[p.X,p.Phi,p.U],label:`X=${p.X.toPrecision(4)}`,value:p.E})),arrows:[],lines:[{points:values.map(p=>[p.X,p.Phi,p.U])}],axes:['X','Phi','U'],description:'실제 비선형 계수 재귀의 유한 합. f0는 별도 scalar comparison입니다.',coordinateMeaning:'Coefficient-profile space (X,Phi,U), not physical Cartesian coordinates.',lostInformation:['Nonlinear series convergence radius, complex eta domain and tail remain uncertified.']}};}
function viscosityEnergyCheck(budget){const val=(nu,R)=>{const p=integrate(x=>Math.exp(-2*x*x/nu),-R,R,1e-11,budget);return nu*p.value**3;},base=val(1,6),cases=[.1,1,3].map(nu=>{const observed=val(nu,6*Math.sqrt(nu)),expected=nu**2.5*base,err=Math.abs(observed-expected)/(1+Math.abs(expected));return {nu,observed,expected,normalizedError:err,pass:err<1e-10};});return {name:'viscosity_energy_measure_scaling',pass:cases.every(x=>x.pass),cases,field:'u1(x)=exp(-|x|^2)e1, uNu=sqrt(nu)u1(x/sqrt(nu))',domain:'Finite boxes [-6sqrt(nu),6sqrt(nu)]^3; analytic change-of-variable scales the identical domain',independentPaths:['physical-coordinate quadrature at each viscosity','nu^(5/2) times unit-viscosity energy'],tolerance:1e-10};}
export function highPrecisionChecks(){const checks=[];for(const f of fixtures.coordinates){const input=Object.fromEntries(Object.entries(f.input).map(([k,v])=>[k,Number(v)])),p=fromSimilarity(input,input),q=toSimilarity(f.position.map(Number),input),err=Math.max(...p.position.map((v,i)=>Math.abs(v-Number(f.position[i]))/(1+Math.abs(v))),Math.abs(q.q-Number(f.q))/(1+Number(f.q)),Math.abs(q.eta-input.eta),Math.abs(q.X-input.X));checks.push({name:`coordinate_330bit_nu_${input.viscosity}_eta_${input.eta}`,pass:err<1e-13,error:err,tolerance:1e-13});}for(const f of fixtures.heat){const v=heatFast(Number(f.Z),Number(f.h));const err=Math.max(...[v.H,v.dH,v.ddH].map((x,i)=>Math.abs(x-Number(f.derivatives[i]))));checks.push({name:`heat_direct_v_integral_330bit_Z_${f.Z}`,pass:err<1e-10,error:err,tolerance:1e-10});}for(const f of fixtures.exterior){const v=exteriorJet(Number(f.r),{tau:Number(f.tau),viscosity:Number(f.viscosity)}),err=Math.max(...['K','dr','drr','dt'].map(k=>Math.abs(v[k]-Number(f[k]))/(1+Math.abs(Number(f[k])))));checks.push({name:`exterior_derivatives_330bit_nu_${f.viscosity}`,pass:err<1e-10,error:err,tolerance:1e-10,mpmathCylindricalResidual:f.cylindricalResidual});}const c=comparisonSeries(4.1),target=Number(fixtures.comparison.f0);checks.push({name:'entire_comparison_f0_4p1',pass:c.value?.lower!==undefined?target>=c.value.lower&&target<=c.value.upper:Math.abs((c.midpoint??c.value)-target)<1e-12,reference:fixtures.comparison.f0,observed:c});return checks;}
export function runValidation(input={},budget=makeBudget(commonBudget)){const checks=[...coordinateChecks(input),...exactPDEChecks(input,budget),...spectralConvolutionCheck(input,budget).checks,...coreReconstructionChecks(input,budget),...highPrecisionChecks(),viscosityEnergyCheck(budget)];const moment=solveFiveMomentRepair({},budget),badMoment=solveFiveMomentRepair({omitQuadratic:true},budget);checks.push({name:'five_moment_independent_reintegration',pass:moment.status==='NUMERICAL_MOMENT_MATCH',residual:moment.normalizedResidual,tolerance:1e-8},{name:'negative_omitted_quadratic_moments',pass:badMoment.status==='REJECTED_MOMENT_MATCH',negativeControl:true,residual:badMoment.normalizedResidual});for(const [name,fn,code] of [['negative_overlap_support',()=>solveFiveMomentRepair({overlap:true},budget),'INVALID_SUPPORT'],['negative_exterior_axis',()=>exteriorPoint([0,0,1],{},budget),'EXCLUDED_DOMAIN'],['negative_viscosity',()=>parameters({viscosity:0}),'INVALID_INPUT'],['negative_precision_claim',()=>validatePrecision({bits:100}),'PRECISION_REQUIRED']]){try{fn();checks.push({name,pass:false,negativeControl:true});}catch(e){checks.push({name,pass:e.code===code,negativeControl:true,observedStatus:e.code});}}checks.push({name:'whole_parameter_box_cone_certificate',pass:certifiedConeBox().pass,certificate:certifiedConeBox()});checks.push({name:'negative_zero_stress_division',pass:coneMargins({a:3,bs:0,ps:[3,0]}).pass===false,negativeControl:true},{name:'negative_invalid_cone',pass:coneMargins({a:1,bs:0,ps:[.5,0]}).pass===false,negativeControl:true});return {status:checks.every(x=>x.pass)?'VALIDATION_PASSED':'VALIDATION_FAILED',evidenceGrade:'FINITE_NUMERICAL_FIXTURE',checks,passed:checks.filter(x=>x.pass).length,total:checks.length,scope:'Finite independent consistency checks; not a complete profile or source-theorem certificate.',fullCertifiedProfile:false};}
function engineStatus(domain){
  if(['COMPLETED','PARTIAL','FAILED','CANCELLED','PRECISION_REQUIRED','UNSUPPORTED','BUDGET_EXCEEDED'].includes(domain))return domain;
  if(domain==='RESOURCE_LIMIT')return 'BUDGET_EXCEEDED';
  if(['FORMAL_NONLINEAR_AXIS_COEFFICIENTS','NUMERICAL_MOMENT_MATCH','FINITE_CONE_OPERATOR_CHECK','PARTIAL_CANDIDATE_WITH_BLOCKERS'].includes(domain))return 'PARTIAL';
  if(['PROVENANCE_LOCKED','FINITE_COORDINATE_EVALUATION','VERIFIED_NUMERICAL_ENCLOSURE','SOURCE_FORMULA_NUMERICAL_EVALUATION','EXACT_BENCHMARK_FLOAT_EVALUATION','VALIDATION_PASSED','VERIFIED_LOCAL_BOUND_CERTIFICATE','VERIFIED_ANALYTIC_PRESSURE_BOUND_CERTIFICATE'].includes(domain))return 'COMPLETED';
  return 'FAILED';
}
export async function runJob(request,hooks={}){
  const started=Date.now(),valid=validateRequest(request);
  if(!valid.valid)return jsonSafe({...valid,domainStatus:valid.status,status:engineStatus(valid.status),kind:request?.kind,executionMetrics:{elapsedMilliseconds:Date.now()-started}});
  const {kind,input,precision}=valid,budget=makeBudget(valid.budget,hooks);
  try{
    budget.tick();let result;
    if(Followup.FOLLOWUP_KINDS.includes(kind))result=await Followup.runFollowupJob(kind,input,budget);
    else switch(kind){
      case 'ns.provenance':
        result={status:'PROVENANCE_LOCKED',evidenceGrade:'THEOREM_REFERENCE',...provenance,leanEvidence,highPrecisionFixtureContract:{precisionDigits:fixtures.precisionDigits,method:fixtures.method},fullSourceProofLocallyVerified:false};break;
      case 'ns.coordinates':
        result={status:'FINITE_COORDINATE_EVALUATION',evidenceGrade:'FINITE_NUMERICAL_FIXTURE',...coordinateFieldSample(input,budget),checks:coordinateChecks(input)};break;
      case 'ns.heat':
        result=heatIntegralCertificate({...input,tolerance:precision.absoluteTolerance},budget);
        result.evidenceGrade=result.status==='VERIFIED_NUMERICAL_ENCLOSURE'?'VERIFIED_NUMERICAL_ENCLOSURE':'UNCERTIFIED_ERROR_TARGET';
        result.finiteTaylor=heatTaylorFinite(input.Z??1,input.h??.005,input.taylorOrder??8);break;
      case 'ns.exterior':result=exteriorJob(input,budget);break;
      case 'ns.benchmark':result=benchmarkJob(input,budget);break;
      case 'ns.axis-series':result=axisJob(input,budget);break;
      case 'ns.moments':result={...solveFiveMomentRepair(input,budget),evidenceGrade:'FINITE_NUMERICAL_FIXTURE'};break;
      case 'ns.cone':
        result={status:'FINITE_CONE_OPERATOR_CHECK',evidenceGrade:'FINITE_NUMERICAL_FIXTURE',margin:coneMargins({a:input.a??3,bs:input.bs??0,ps:input.ps??[5,0]}),modulation:coneModulationFixture(input),wholeParameterBox:certifiedConeBox(input),blockers:[{id:'C1_ADMISSIBLE_LOOP',criterion:'N3-06',reason:'This older finite modulation fixture does not instantiate C.1. The separate ns.admissible-loop job computes source loops for supplied states; a uniform input profile remains required.'}],fullConeRealization:false};
        if(!result.margin.pass)result.status='REJECTED_CONE_INPUT';
        else if(!result.wholeParameterBox.pass)result.status='REJECTED_CONE_BOX';break;
      case 'ns.leading-profile':result=constructLeadingCandidate(input,budget);break;
      case 'ns.validate':result=runValidation(input,budget);break;
    }
    budget.tick();
    const domainStatus=result.domainStatus??result.status,clean=stripped(result);
    const parameterHash=await sha256(canonical({version:VERSION,kind,input,precision,source:provenance.lock.attachment.sha256,commit:provenance.lock.repository.commit}));
    return jsonSafe({...clean,domainStatus,status:engineStatus(result.status),kind,moduleVersion:VERSION,precision,parameterHash,
      sourceLedger:{attachmentSha256:provenance.lock.attachment.sha256,repositoryCommit:provenance.lock.repository.commit,theoremReference:'Theorem1.1; N3 Theorem4.6',fullOriginalKernelBuild:false},
      contract:{fullCertifiedProfile:false,fullNavierStokesSolution:false,solutionErrorBound:null,
        precisionOfCandidate:['ns.axis-certificate','ns.axis-source-certificate','ns.pressure-certificate'].includes(kind)?'Exact rational bounds and exact positive-exponential parameters; displayed enclosure centers use IEEE754 binary64. Generated analytic premises are not fully kernel-checked.':
          kind==='ns.source-outer'?'Signed-log quantities and IEEE754 binary64 quadrature/ODEs; small numerical residuals are not exact moment identities.':
          'IEEE754 binary64; only individually labelled intervals are numerical enclosures'},
      executionMetrics:{elapsedMilliseconds:Date.now()-started,operations:budget.snapshot().operations}});
  }catch(e){return jsonSafe({domainStatus:e.code??'COMPUTATION_ERROR',status:engineStatus(e.code??'COMPUTATION_ERROR'),kind,moduleVersion:VERSION,message:e.message,detail:e.detail??{},fullCertifiedProfile:false,executionMetrics:{elapsedMilliseconds:Date.now()-started,operations:budget.snapshot().operations}});}
}
