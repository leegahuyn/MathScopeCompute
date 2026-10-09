/** Execution, rejection, binding and reproducibility checks for A.21 bounds.
 * Independent Fraction/mpmath checks are in pressure-analytic-reference.py.
 * This script does not run or change any frozen outer/axis verification record.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {makeBudget} from '../numerics.mjs';
import {sourcePressureAnalyticExampleInput,validateSourcePressureAnalyticInput,createSourcePressureAnalyticProducer,certifySourcePressureAnalytic} from './pressure-analytic.mjs';

const dir=path.dirname(fileURLToPath(import.meta.url)),checks=[],budget=makeBudget(),input=sourcePressureAnalyticExampleInput();
const producer=createSourcePressureAnalyticProducer(input,budget),certificate=producer.certificate;
function check(id,fn){try{fn();checks.push({id,status:'PASS'});console.log(`PASS ${id}`);}catch(e){checks.push({id,status:'FAIL',message:e.message});console.error(`FAIL ${id}: ${e.message}`);}}
function rational(s){const [a,b='1']=s.split('/');return [BigInt(a),BigInt(b)];}
function compare(a,b){a=rational(a);b=rational(b);return a[0]*b[1]<b[0]*a[1]?-1:a[0]*b[1]>b[0]*a[1]?1:0;}
function jsonSafe(v){if(v===null||typeof v==='string'||typeof v==='boolean')return true;if(typeof v==='number')return Number.isFinite(v);if(Array.isArray(v))return v.every(jsonSafe);return typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype&&Object.values(v).every(jsonSafe);}
function throwsCode(fn,code){assert.throws(fn,e=>e.code===code);}
const invalid=[
 ['null-input',null],['array-input',[]],['fake-certificate',{certified:true}],['fake-mass',{totalMassUpper:'1'}],['fake-norm',{pressureNorm:'1'}],
 ['unknown-parameter',{parameters:{j0:1}}],['nonfinite-parameter',{parameters:{h:Infinity}}],['nan-parameter',{parameters:{lambda:NaN}}],
 ['callback-parameter',{parameters:{logP:()=>14}}],['zero-h',{parameters:{h:0}}],['negative-h',{parameters:{h:-1e-8}}],['h-too-large-for-lambda',{parameters:{h:0.001}}],
 ['lambda-too-large',{parameters:{lambda:0.02}}],['negative-logP',{parameters:{logP:-1}}],['too-large-logP',{parameters:{logP:101}}],
 ['zero-denominator',{parameters:{h:'1/0'}}],['oversized-rational',{parameters:{h:'1/'.padEnd(184,'1')}}],['overlong-exponent',{parameters:{h:'1e-401'}}],
 ['bound-bits-too-small',{boundBits:63}],['bound-bits-too-large',{boundBits:257}],['noninteger-bits',{boundBits:128.5}],
 ['window-too-small',{realWindow:'99/100'}],['window-too-large',{realWindow:'3'}],['zero-tube',{tubeRadius:'0'}],['tube-at-unsupported-boundary',{tubeRadius:'1/2'}],
 ['negative-coefficient-radius',{coefficientRadiusRatio:'-1/100'}],['coefficient-ratio-too-large',{coefficientRadiusRatio:'3/4'}]
];
check('default-certificate',()=>assert.equal(certificate.status,'VERIFIED_ANALYTIC_PRESSURE_BOUND_CERTIFICATE'));
check('default-exact-h',()=>assert.equal(producer.parameterHExact,'3022314549036573/302231454903657293676544'));
check('numeric-h-exact-match',()=>assert.equal(producer.bindAxisH(1e-8).matches,true));
check('exact-rational-h-match',()=>assert.equal(producer.bindAxisH(producer.parameterHExact).matches,true));
check('decimal-h-is-not-binary64-h',()=>assert.equal(producer.bindAxisH('1/100000000').status,'AXIS_H_MISMATCH'));
check('bad-h-binding-refused',()=>assert.equal(producer.bindAxisH(Infinity).matches,false));
check('default-valid-pure-normalizer',()=>{const c=validateSourcePressureAnalyticInput(input);assert.equal(c.valid,true);assert.equal(c.analyticComputationPerformed,false);assert.equal(c.parameterHExact,producer.parameterHExact);});
for(const [id,v] of invalid)check(`reject-${id}`,()=>assert.equal(validateSourcePressureAnalyticInput(v).valid,false));
check('exact-decimal-input-binding',()=>{const c=validateSourcePressureAnalyticInput({parameters:{h:'0.00000001'}});assert.equal(c.parameterHExact,'1/100000000');assert.equal(c.inputBinding.h.numericApproximationIsIdentical,false);});
check('display-json-only',()=>assert.equal(jsonSafe(certificate),true));
check('no-runtime-in-mathematical-result',()=>assert.doesNotMatch(JSON.stringify(certificate),/elapsedMilliseconds|createdAt|Date\.now|executionMetrics|"execution"/));
check('same-original-input-byte-identical',()=>assert.equal(JSON.stringify(certifySourcePressureAnalytic(input)),JSON.stringify(certificate)));
check('normalized-input-preserves-mathematical-bounds',()=>{const c=certifySourcePressureAnalytic(certificate.normalizedInput);assert.equal(c.status,certificate.status);for(const k of ['totalMassLower','totalMassUpper','parameterHExact'])assert.equal(c[k],certificate[k]);assert.deepEqual(c.realBounds,certificate.realBounds);});
check('no-transcendental-runtime-in-validation-or-producer',()=>{
 const oldExp=Math.exp,oldLog=Math.log,oldLog2=Math.log2,oldPow=Math.pow;let v,c;
 try{Math.exp=Math.log=Math.log2=Math.pow=()=>{throw new Error('Forbidden binary64 transcendental called');};v=validateSourcePressureAnalyticInput({});c=certifySourcePressureAnalytic({});}
 finally{Math.exp=oldExp;Math.log=oldLog;Math.log2=oldLog2;Math.pow=oldPow;}
 assert.equal(v.valid,true);assert.equal(c.status,certificate.status);
});
check('positive-nonzero-inner-mass',()=>{assert.equal(compare(certificate.innerThetaOneMassLower,'0'),1);assert.notEqual(certificate.innerThetaOneMass.lower,certificate.innerThetaOneMass.upper);assert.equal(certificate.innerThetaOneMass.isRationalValueClaim,false);});
check('mass-order',()=>{assert.equal(compare(certificate.totalMassUpper,certificate.totalMassLower),1);assert.equal(certificate.totalMassLower,certificate.innerThetaOneMassLower);});
check('origin-derivative-exact-zero',()=>assert.deepEqual(producer.realBounds(['0','0']).Pprime,{lower:'0',upper:'0'}));
check('positive-eta-derivative-strict',()=>assert.equal(compare(producer.realBounds(['1/2','1']).Pprime.lower,'0'),1));
check('negative-eta-derivative-strict',()=>assert.equal(compare(producer.realBounds(['-1','-1/2']).Pprime.upper,'0'),-1));
check('all-real-pressure-negative',()=>assert.equal(compare(certificate.realBounds.P.upper,'0'),-1));
check('real-bounds-refuse-reversed-box',()=>throwsCode(()=>producer.realBounds(['1','-1']),'INVALID_INPUT'));
check('real-bounds-refuse-outside-window',()=>throwsCode(()=>producer.realBounds(['-2','0']),'INVALID_INPUT'));
check('complex-denominator-positive',()=>assert.equal(compare(certificate.complexBounds.denominatorRealPartLower,'0'),1));
check('complex-noninteger-powers-and-domination-explicit',()=>{assert.match(certificate.complexBounds.nonintegerPowerDefinition,/PrincipalLog/);assert.equal(certificate.complexBounds.domination.independentOfY,true);assert.equal(certificate.gates.pressureDerivativeUnderIntegral,true);});
check('complex-bounds-refuse-half-radius',()=>throwsCode(()=>producer.complexBounds({tubeRadius:'1/2'}),'INVALID_INPUT'));
check('complex-bounds-refuse-outside-window',()=>throwsCode(()=>producer.complexBounds({realWindow:'2'}),'INVALID_INPUT'));
check('complex-bounds-refuse-user-bound',()=>throwsCode(()=>producer.complexBounds({pressureAbsUpper:'1'}),'INVALID_INPUT'));
check('infinite-both-tails-present',()=>{assert.equal(certificate.mass.bothInfiniteEndsIncluded,true);assert.equal(certificate.mass.finiteCutoffUsed,false);assert.equal(certificate.mass.quadratureUsed,false);assert.equal(certificate.scheduleExistence.numericalODEUsed,false);});
check('mixed-tail-not-rounded-away',()=>{assert.equal(compare(certificate.mixedThetaSuffix.upper,'0'),1);assert.equal(certificate.mixedThetaSuffix.rationalDecayBits,512);});
check('terminal-wait-certified-positive',()=>{const s=certificate.scheduleExistence;assert.equal(compare(s.terminalQBeforeWait.lower,s.terminalQp.upper),1);assert.equal(compare(s.wait.finiteUpper,'0'),1);});
check('all-eta-derivative-coefficient-bound',()=>{assert.equal(certificate.coefficientNorm.allEtaDerivativeOrders,true);assert.equal(compare(certificate.coefficientNorm.radiusRatio,'1'),-1);assert.match(certificate.coefficientNorm.derivativeConvention,/Actual derivatives/);});
check('seventeen-observations-with-raw-values',()=>{assert.equal(certificate.observations.samples.length,17);assert.equal(certificate.visualization.points.length,17);assert.equal(certificate.visualization.lines.length,2);for(const s of certificate.observations.samples){assert.equal(compare(s.normalizedPressure.lower,s.normalizedPressure.upper),-1);assert.equal(compare(s.normalizedHalfWidth,'0'),1);assert.equal(typeof s.P.lower,'string');}});
check('visualization-coordinates-finite-and-labels-honest',()=>{for(const p of certificate.visualization.points)assert.equal(p.pos.every(Number.isFinite),true);assert.match(certificate.visualization.coordinateMeaning,/not a spatial fluid field/);});
check('operation-budget-refused',()=>assert.equal(certifySourcePressureAnalytic({},makeBudget({maxOperations:20})).status,'RESOURCE_LIMIT'));
check('render-point-budget-refused',()=>assert.equal(certifySourcePressureAnalytic({},makeBudget({maxPoints:50})).status,'RESOURCE_LIMIT'));
check('cancellation-refused',()=>assert.equal(certifySourcePressureAnalytic({},makeBudget({}, {isCancelled:()=>true})).status,'CANCELLED'));
check('full-proof-claims-remain-false',()=>{for(const k of ['exactPressureEqualityWithRepairedE','existingFiniteJetsCertified','globalWitness','fullOriginalParameterOrder','fullPremiseBundleLeanChecked','callerSuppliedNormAccepted','quadratureTruthAccepted'])assert.equal(certificate.gates[k],false);});
const variants=[];
for(const [id,request] of [
 ['bits64',{boundBits:64}],['bits256',{boundBits:256}],
 ['wide-large-parameters',{parameters:{Md:'4',logP:'100',lambda:'1/200',h:'1/1000000000000',logXR:'100',Tf:'512',co:'1/100'},boundBits:256,realWindow:'2',tubeRadius:'1/4',coefficientRadiusRatio:'1/2'}],
 ['small-pressure-outside-full-source-order',{parameters:{logP:'0',h:'1/100000000'}}]
]){
 const b=makeBudget({maxOperations:5000000}),c=certifySourcePressureAnalytic(request,b);
 variants.push({id,input:request,certificate:c});
 check(`actual-variant-${id}`,()=>assert.equal(c.status,certificate.status));
 if(id==='small-pressure-outside-full-source-order')check('insufficient-original-parameters-not-promoted',()=>{assert.equal(c.sourceParameterContract.necessaryLogPGreaterThanTd,'DISPROVED');assert.equal(c.sourceParameterContract.fullSufficientlySmallLargeOrderCertified,false);});
}
const intervals=[['-11/10','-1'],['-1','-1/2'],['-1/2','-1/8'],['-1/8','0'],['0','1/8'],['1/8','1/2'],['1/2','1'],['1','11/10'],['-1/8','1/8']];
const additionalRealBounds=intervals.map(x=>producer.realBounds(x));
check('nine-extra-real-interval-enclosures',()=>{for(const c of additionalRealBounds){assert.ok(compare(c.P.lower,c.P.upper)<=0);assert.ok(compare(c.Pprime.lower,c.Pprime.upper)<=0);}});
const additionalComplexBounds=['1/1000000','1/8','49/100'].map(tubeRadius=>producer.complexBounds({tubeRadius}));
check('three-complex-tube-enclosures',()=>{for(const c of additionalComplexBounds){assert.equal(compare(c.denominatorRealPartLower,'0'),1);assert.equal(compare(c.pressureAbsUpper,'0'),1);}});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,p))).digest('hex');
const failures=checks.filter(x=>x.status==='FAIL'),report={schema:'MathScope.Navier.SourcePressureAnalyticExecutionAudit/1',status:failures.length?'FAIL':'PASS',counts:{passed:checks.length-failures.length,failed:failures.length,total:checks.length},checks,
 toolchain:{node:process.version},sourceSha256:sha('pressure-analytic.mjs'),frozenOuterSha256:sha('outer.mjs'),budget:budget.snapshot(),
 scope:{analyticArgumentSeparatelyDocumented:true,independentArithmeticReference:'pressure-analytic-reference.py',newLeanTargets:0,generatedPremiseBundleLeanChecked:false,globalNSWitness:false,exactRepairedFieldPressureIdentity:false},
 command:'node mathscope-m1/navier/followup-construction/pressure-analytic.verify.mjs'};
fs.writeFileSync(path.join(dir,'pressure-analytic-fixture.json'),JSON.stringify(certificate,null,2)+'\n');
fs.writeFileSync(path.join(dir,'pressure-analytic-cases.json'),JSON.stringify({variants,additionalRealBounds,additionalComplexBounds},null,2)+'\n');
fs.writeFileSync(path.join(dir,'pressure-analytic-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,counts:report.counts,sourceSha256:report.sourceSha256,defaultBudget:report.budget}));
if(failures.length)process.exitCode=1;
