/** Finite implementation/negative-control checks; not an all-eta certificate. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {runOuterConstruction,outerExampleInput,validateOuterInput,prepareOuterSchedule,solveOuterSlice,evaluateOuterSlice,pressureJet,sourceStep,sourceStepPrime} from './outer.mjs';
import {makeBudget} from '../numerics.mjs';

const here=dirname(fileURLToPath(import.meta.url)),checks=[];
const hash=x=>createHash('sha256').update(x).digest('hex');
function check(id,fn){try {const detail=fn();checks.push({id,pass:true,detail:detail??null});}catch(e){checks.push({id,pass:false,message:e.message,stack:e.stack});}}
function fails(fn,code){assert.throws(fn,e=>e.code===code);return code;}
const input={...outerExampleInput(),etas:[0,.5,1]},budget=makeBudget();
const result=runOuterConstruction(input,budget);
writeFileSync(join(here,'outer-fixture.json'),JSON.stringify(result,null,2)+'\n');
if(process.argv.includes('--prepare-fixture')){console.log(JSON.stringify({status:'FIXTURE_PREPARED',path:'outer-fixture.json',sha256:hash(readFileSync(join(here,'outer-fixture.json')))}));process.exit(0);}

check('outer-json-validator-default',()=>{assert.equal(validateOuterInput(outerExampleInput()).valid,true);});
check('default-public-example-runs',()=>{assert.equal(runOuterConstruction(outerExampleInput(),makeBudget()).numericalAudit.pointwiseFiniteResidualChecksPassed,true);});
for(const [id,request] of [
  ['nan-eta',{etas:[NaN]}],['infinite-logP',{parameters:{logP:Infinity}}],['non-json-callback',{parameters:{x:()=>0}}],
  ['null-parameters',{parameters:null}],['negative-h',{parameters:{h:-1e-6}}],['h-ge-lambda-half',{parameters:{h:.0002}}],
  ['oversized-sample-array',{etas:Array(1025).fill(0)}],['huge-pressure-order',{pressureOrder:1e8}],['fractional-pressure-order',{pressureOrder:4.5}],
  ['too-fine-tolerance',{tolerance:1e-16}],['unknown-family',{family:'invented-model'}],['eta-outside-source-domain',{etas:[1.01]}],
  ['giant-mesh',{samplesPerEta:1e12}],['scalar-input',1],['prototype-input',new Date()]
])check(`reject-${id}`,()=>{assert.equal(validateOuterInput(request).valid,false);});
check('validator-rejects-maxPoints-without-computation',()=>{const v=validateOuterInput(input,{maxPoints:20});assert.equal(v.valid,false);assert.equal(v.status,'RESOURCE_LIMIT');});
check('bounded-operation-exhaustion',()=>fails(()=>runOuterConstruction(input,makeBudget({maxOperations:1000})),'RESOURCE_LIMIT'));
check('bounded-cancellation',()=>fails(()=>runOuterConstruction(input,makeBudget({}, {isCancelled:()=>true})),'CANCELLED'));
check('finite-default-budget',()=>{assert.ok(budget.snapshot().operations<=2e6);assert.equal(result.visualization.points.length,144);return {operations:budget.snapshot().operations};});
check('result-json-safe',()=>assert.deepEqual(JSON.parse(JSON.stringify(result)),result));
check('same-input-same-result-hash',()=>{const again=runOuterConstruction(input,makeBudget());assert.equal(hash(JSON.stringify(again)),hash(JSON.stringify(result)));});
check('source-step-values-and-symmetry',()=>{assert.equal(sourceStep(0),0);assert.equal(sourceStep(1),1);assert.equal(sourceStep(.5),.5);for(const t of [.1,.3,.4])assert.ok(Math.abs(sourceStep(t)+sourceStep(1-t)-1)<2e-15);assert.equal(sourceStepPrime(-1),0);assert.equal(sourceStepPrime(1),0);});
check('actual-A19-bracket-full-derivative',()=>{for(const s of result.slices){assert.ok(s.amplitude.amplitude>.9&&s.amplitude.amplitude<1.2);assert.ok(s.amplitude.endpointValues[0]<0&&s.amplitude.endpointValues[1]>0);assert.ok(s.amplitude.minimumDerivative>=.36);assert.ok(Math.abs(s.amplitude.normalizedSMomentResidual)<input.tolerance);}});
check('actual-MJ-affine-end-corrections',()=>{for(const s of result.slices){assert.equal(s.pulseEndCorrection.values.length,2);for(const row of s.pulseEndCorrection.momentRows){assert.ok(Math.abs(row.relativeCommonResidual)<input.tolerance);assert.equal(row.exactEqualityCertified,false);assert.ok(row.physicalResidualEstimate.logAbs>0);}assert.ok(s.pulseEndCorrection.affineAmplitude.some(v=>v.sign!==0&&v.float64===null));}});
check('A11-two-bumps-pressure-increment',()=>{for(const s of result.slices){const a=s.angularReset;assert.equal(a.values.length,2);assert.ok(a.normalizedResidual<input.tolerance);assert.equal(a.exactMomentEquality,false);assert.equal(a.momentAudit[1].row,'2Cp');assert.equal(a.momentAudit[1].exactEqualityCertified,false);}});
check('A7-three-additive-bumps-residuals',()=>{for(const s of result.slices){const h=s.heatCompensation;assert.equal(h.values.length,3);assert.ok(h.normalizedResidual<input.tolerance);assert.ok(h.pointwisePositiveBound);assert.equal(h.exactMomentEquality,false);for(const row of h.momentAudit)assert.ok(Math.abs(row.residualInCommonScale)<input.tolerance);}});
check('A7-heat-change-never-rounds-to-equality',()=>{for(const s of result.slices.filter(s=>Math.abs(s.eta)<1)){const h=s.heatCompensation;assert.equal(h.heatChanges[0].float64,null);assert.notEqual(h.heatChanges[0].sign,0);assert.ok(h.heatRemainderBounds[0].logAbs<h.heatChanges[0].logAbs);assert.equal(h.remainderContract.intervalCertified,false);assert.ok(h.momentAudit.some(r=>r.residual.sign!==0));}});
check('A7-endpoint-d-zero-consistent',()=>{const h=result.slices.find(s=>s.eta===1).heatCompensation;assert.ok(h.values.every(v=>v.sign===0));assert.ok(h.heatChanges.every(v=>v.sign===0));assert.equal(h.exactMomentEquality,false);});
check('pressure-entire-source-integral-no-cutoff',()=>{for(const s of result.slices){const p=s.pressure;assert.equal(p.family,'source-outer-A21');assert.equal(p.innerAndExteriorInfiniteIntegrals,'ANALYTIC_EXPONENTIAL_INTEGRATION');assert.ok(p.coefficients[0]<0);assert.ok(p.normalizedByPSquared[0]<=-2.5/(1+s.eta*s.eta)**2);assert.ok(p.coefficientTerms[0].some(x=>x.stage==='parameter-interpolation'&&x.value.sign!==0&&x.value.float64===null));assert.ok(p.coefficientTerms[0].some(x=>x.stage==='infinite-power-tail'&&x.value.sign!==0));}});
check('pressure-Taylor-parity-and-sign',()=>{const p0=result.slices[0].pressure;assert.equal(p0.coefficients[1],0);assert.equal(p0.coefficients[3],0);assert.ok(result.slices[1].pressure.coefficients[1]>0);const s=prepareOuterSchedule(input.parameters,makeBudget()),minus=pressureJet(s,-.5,4),plus=result.slices[1].pressure;for(let k=0;k<5;k++)assert.ok(Math.abs(minus.coefficients[k]-(-1)**k*plus.coefficients[k])<=Math.abs(plus.coefficients[k])*1e-14+1e-8);});
check('pressure-XR-independence-heat-XR-dependence',()=>{const a=prepareOuterSchedule(input.parameters,makeBudget()),b=prepareOuterSchedule({...input.parameters,logXR:21},makeBudget());assert.deepEqual(pressureJet(a,.5,4).coefficients,pressureJet(b,.5,4).coefficients);const sa=solveOuterSlice(a,.5),sb=solveOuterSlice(b,.5);assert.ok(Math.abs(sb.heat.scale-sa.heat.scale+1)<1e-9);});
check('actual-sampled-field-and-log-coordinate-definition',()=>{const s=prepareOuterSchedule(input.parameters,makeBudget()),slice=solveOuterSlice(s,.5),y=s.pulse.start+1/s.params.lambda,p=evaluateOuterSlice(slice,{logXOverXR:y});assert.equal(p.stage,'axial-pulse');assert.notEqual(p.physicalU.sign,0);assert.ok(Math.abs(p.physicalU.logAbs-p.physicalE.logAbs-Math.log(slice.amplitude.amplitude*.99))<2e-10);assert.ok(result.visualization.coordinateMeaning.includes('not a Cartesian'));});
check('physical-heat-edit-retained-when-field-underflows',()=>{const s=prepareOuterSchedule(input.parameters,makeBudget()),sl=solveOuterSlice(s,.5),point=evaluateOuterSlice(sl,{logXOverXR:s.end+1});assert.equal(point.physicalE.float64,null);assert.notEqual(point.corrections.tailHeatAdditiveE.sign,0);assert.equal(point.corrections.tailHeatAdditiveE.float64,null);assert.ok(point.corrections.tailHeatRemainderUpper.logAbs<point.corrections.tailHeatAdditiveE.logAbs);});
check('finite-heat-polynomial-is-not-exact-heat-solution',()=>{const s=prepareOuterSchedule(input.parameters,makeBudget()),sl=solveOuterSlice(s,.5),point=evaluateOuterSlice(sl,{logXOverXR:s.end+1});assert.notEqual(point.heatPolynomialODE.residual.sign,0);assert.equal(point.heatPolynomialODE.residual.float64,null);assert.equal(point.heatPolynomialODE.certifiedStressVanishing,false);assert.ok(Object.values(result.stressSupport.structuralChecks).every(Boolean));});
check('reject-source-bracket-outside-small-lambda-regime',()=>{const bad=runOuterConstruction({...input,parameters:{...input.parameters,lambda:.005},etas:[0]},makeBudget());assert.equal(bad.slices[0].amplitude.status,'SOURCE_BRACKET_NOT_ESTABLISHED');assert.equal(bad.slices[0].amplitude.amplitude,null);assert.equal(bad.slices[0].samples.length,0);assert.equal(bad.numericalAudit.pointwiseFiniteResidualChecksPassed,false);});
check('maximum-supported-pressure-jet-is-budgeted',()=>{const b=makeBudget({maxOperations:5e7}),s=prepareOuterSchedule(input.parameters,b),p=pressureJet(s,.3,54);assert.equal(p.coefficients.length,55);assert.ok(p.coefficients.every(Number.isFinite));assert.ok(b.snapshot().operations<=5e7);return {order:54,operations:b.snapshot().operations};});
check('no-original-witness-certification',()=>{assert.equal(result.status,'PARTIAL');assert.equal(result.model.regularAxisAttached,false);assert.equal(result.model.originalGlobalWitnessCertified,false);assert.ok(Object.values(result.certifiedConditions).every(v=>v===false));assert.equal(result.stressSupport.exactExteriorStressVanishingCertified,false);});

let reference=null;
try {reference=JSON.parse(readFileSync(join(here,'outer-independent-reference.json'),'utf8'));}catch{}
if(reference)check('independent-reference-has-exact-fixture-hash',()=>{assert.equal(reference.status,'PASS');assert.equal(reference.fixtureSha256,hash(readFileSync(join(here,'outer-fixture.json'))));});
const sourceFiles=['outer.mjs','outer.verify.mjs','outer-reference.py'].map(path=>({path,sha256:hash(readFileSync(join(here,path)))}));
const out={schema:'MathScope.SourceOuterImplementationValidation/1',status:checks.every(c=>c.pass)?'PASS':'FAIL',node:process.version,
  sourceFiles,fixture:{path:'outer-fixture.json',sha256:hash(readFileSync(join(here,'outer-fixture.json')))},
  input,resultHash:hash(JSON.stringify(result)),checks,counts:{total:checks.length,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length},
  independentReference:reference?{path:'outer-independent-reference.json',sha256:hash(readFileSync(join(here,'outer-independent-reference.json'))),counts:reference.counts,status:reference.status}:null,
  mathematicalScope:{componentOperations:'IMPLEMENTED_AND_TESTED_POINTWISE',originalN302:'PARTIAL',originalN307:'PARTIAL',exactFiveMoments:false,entireEtaInterval:false,globalWitness:false},
  command:'node mathscope-m1/navier/followup-construction/outer.verify.mjs',
  limits:['Finite implementation checks and independent numerical fixtures are not a certificate of all source parameter inequalities.',
    'Dimensionless residual tolerance does not imply a small dimensional residual or exact moment equality.',
    'The ideal source profile has not been attached to a certified analytic axis, strict stress cone, or admissible loop.']};
writeFileSync(join(here,'outer-validation.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({status:out.status,counts:out.counts,failures:checks.filter(x=>!x.pass)},null,2));
process.exitCode=out.status==='PASS'?0:1;
