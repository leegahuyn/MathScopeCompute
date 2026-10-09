import fs from 'node:fs/promises';
import {getExamples,runJob,jsonSafe} from './index.mjs';
import {heatIntegralCertificate,heatFast,heatTaylorFinite} from './heat.mjs';
import {comparisonSeries} from './axis-series.mjs';
import {certifiedConeBox} from './radial.mjs';
import {fixtures} from './fixtures.generated.mjs';
import {makeBudget,canonical,sha256} from './numerics.mjs';
const base=new URL('./',import.meta.url),checks=[],examples=[];
const append=(name,pass,detail={})=>checks.push({name,pass,...detail});
const clean=v=>{if(Array.isArray(v))return v.map(clean);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>k!=='executionMetrics').map(([k,x])=>[k,clean(x)]));return v;};
for(const e of getExamples()){const result=await runJob(e.request);const expected=['ns.axis-series','ns.moments','ns.cone','ns.leading-profile'].includes(e.request.kind)?'PARTIAL':'COMPLETED';append(`example_${e.id}`,result.status===expected,{status:result.status,domainStatus:result.domainStatus});examples.push({id:e.id,request:e.request,status:result.status,domainStatus:result.domainStatus,resultMathSha256:await sha256(canonical(clean(result))),diagnostics:result.diagnostics??null});if(e.request.kind==='ns.validate')checks.push(...(result.checks??[{name:'validation_runtime',pass:false,status:result.status,message:result.message}]));if(e.request.kind==='ns.leading-profile'){await fs.writeFile(new URL('evidence/leading-profile-candidate.json',base),JSON.stringify(result,null,2)+'\n');append('candidate_grade_cannot_be_promoted',result.fullCertifiedProfile===false&&result.fullNavierStokesSolution===false&&result.theoremClauses.length===6&&result.blockers.length>0);append('actual_candidate_moment_discrepancy_rejected',result.sliceReports.every(s=>s.momentStatus==='REJECTED_MOMENT_MATCH'),{residuals:result.sliceReports.map(s=>s.momentResidual)});}}
for(const f of fixtures.heat){const r=heatIntegralCertificate({Z:Number(f.Z),h:Number(f.h),derivativeOrder:2,tolerance:1e-8},makeBudget({maxOperations:20e6,maxMilliseconds:60000}));append(`certified_heat_encloses_330bit_Z_${f.Z}`,r.derivatives.every((b,i)=>b.lower<=Number(f.derivatives[i])&&b.upper>=Number(f.derivatives[i]))&&r.derivatives.every(b=>b.radius<=1e-8),{derivatives:r.derivatives,odeEnclosure:r.odeEnclosure});}
for(const Z of [.001,.01,.05]){const r=heatTaylorFinite(Z,.005,8),v=heatFast(Z).H;append(`finite_heat_Taylor_remainder_${Z}`,r.enclosure.lower<=v&&v<=r.enclosure.upper&&r.radiusOfConvergence===0,{radius:r.radiusOfConvergence,remainderBound:r.remainderBound});}
const comparison=comparisonSeries(4.1);append('comparison_entire_tail_enclosure',comparison.enclosure.lower<Number(fixtures.comparison.f0)&&comparison.enclosure.upper>Number(fixtures.comparison.f0));
const cone=certifiedConeBox();append('whole_cone_parameter_box_strict',cone.pass&&cone.kappaLower>0,{kappaLower:cone.kappaLower});append('invalid_whole_cone_parameter_box_rejected',!certifiedConeBox({box:{a:[1,1.1],bs:[0,0],p1:[3,3.1],p2:[0,0]}}).pass);
for(const [name,request,expected] of [
 ['negative_unknown_job',{kind:'ns.full-solution'},'UNSUPPORTED'],
 ['negative_pressure_precision',{kind:'ns.heat',precision:{bits:100}},'PRECISION_REQUIRED'],
 ['negative_below_rounding_target',{kind:'ns.heat',precision:{absoluteTolerance:1e-20}},'PRECISION_REQUIRED'],
 ['negative_operation_budget',{kind:'ns.heat',budget:{maxOperations:1000}},'BUDGET_EXCEEDED'],
 ['negative_zero_viscosity',{kind:'ns.exterior',input:{viscosity:0}},'FAILED'],
 ['negative_nan_input',{kind:'ns.heat',input:{Z:NaN}},'FAILED'],
 ['negative_nonlinear_moment_omission',{kind:'ns.moments',input:{omitQuadratic:true}},'FAILED'],
 ['negative_cone_direction',{kind:'ns.cone',input:{a:1,ps:[.5,0]}},'FAILED'],
 ['negative_invalid_support',{kind:'ns.moments',input:{overlap:true}},'FAILED'],
 ['negative_negative_axis_parameter',{kind:'ns.axis-series',input:{eta:2}},'FAILED'],
 ['negative_axis_exterior_footprint',{kind:'ns.exterior',input:{rmin:0}},'FAILED'],
 ['negative_underflow_time',{kind:'ns.leading-profile',input:{tau:1e-320,etaCount:3,radialCount:8,axisOrder:6}},'PRECISION_REQUIRED']
]){const r=await runJob(request);append(name,r.status===expected,{status:r.status,expected,domainStatus:r.domainStatus});}
let calls=0;const cancel=await runJob({kind:'ns.heat'},{isCancelled:()=>++calls>10});append('cancellation_hook',cancel.status==='CANCELLED',{status:cancel.status});
for(const e of getExamples().filter(e=>['ns.exterior','ns.leading-profile','ns.validate'].includes(e.request.kind))){const r1=await runJob(e.request),r2=await runJob(e.request);append(`replay_math_hash_${e.id}`,canonical(clean(r1))===canonical(clean(r2)));}
function safeTree(v){if(typeof v==='number')return Number.isFinite(v)&&(!Number.isInteger(v)||Number.isSafeInteger(v));if(Array.isArray(v))return v.every(safeTree);if(v&&typeof v==='object')return Object.values(v).every(safeTree);return true;}
append('canonical_safe_large_float',safeTree(jsonSafe({x:1e20,y:10n,z:-0}))&&jsonSafe({x:1e20}).x.value==='1.00000000000000000e+20');
const result={schemaVersion:1,status:checks.every(c=>c.pass)?'ALL_FINITE_CHECKS_PASSED':'CHECKS_FAILED',passed:checks.filter(c=>c.pass).length,total:checks.length,checks,examples,scope:'Finite NS M1 component, negative-control, independent numerical and canonical replay tests. Full source theorem and complete N3 profile are not certified.'};await fs.writeFile(new URL('evidence/numerical-validation.json',base),JSON.stringify(result,null,2)+'\n');console.log(result.status,result.passed,result.total);for(const c of checks.filter(c=>!c.pass))console.log(JSON.stringify(c));
