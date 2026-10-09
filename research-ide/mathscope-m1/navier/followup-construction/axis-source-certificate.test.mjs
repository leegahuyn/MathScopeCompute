/** Independent boundary and invariant tests for the A.21 input adapter.
 * The frozen rational source and its historical Lean receipt are read only.
 * This suite does not promote generated analytic premises to a kernel proof.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {certifyAxisSource,axisSourceExampleInput,validateAxisSourceInput,getAxisSourceExamples} from './axis-source-certificate.mjs';
import {createSourcePressureAnalyticProducer} from './pressure-analytic.mjs';
import {makeBudget} from '../numerics.mjs';

const DIR=new URL('./',import.meta.url);
const PIN='7bff5106ded0223d0e7ff14d4431a240de160bdcc6be17c1072189206312495d';
const digest=s=>createHash('sha256').update(s).digest('hex');
const read=name=>readFileSync(new URL(name,DIR));
const rat=s=>{const [n,d='1']=String(s).split('/');return [BigInt(n),BigInt(d)];};
const compare=(a,b)=>{const [n,d]=rat(a),[m,e]=rat(b),t=n*e-m*d;return t<0n?-1:t>0n?1:0;};
const sameFraction=(a,b)=>compare(a,b)===0;
const clone=x=>JSON.parse(JSON.stringify(x));
const freshBudget=extra=>makeBudget({maxOperations:20000000,maxMilliseconds:60000,maxPoints:2048,...extra});
let defaultRecord;
const fixture=()=>defaultRecord??=certifyAxisSource(axisSourceExampleInput(),freshBudget());
const shortInput=changes=>({...axisSourceExampleInput(),sampleCount:3,...changes});
const mathematical=r=>{const {execution,...body}=r;return body;};

test('the frozen rational module and seven declared algorithm spans retain their actual hashes',()=>{
  const base=read('axis-certificates.mjs'),derived=read('axis-source-certificate.mjs');
  const manifest=JSON.parse(read('axis-source-derivation.json'));
  assert.equal(digest(base),PIN);
  assert.equal(manifest.baseSha256,PIN);
  assert.equal(digest(derived),manifest.derivedSha256);
  const spans=[['function cutoffCertificate','function complexBounds'],['function complexBounds','function tubeCertificate'],['function tubeCertificate','function sqrtCeil'],['function positiveSeries','function controlled'],['function controlled','function factorial'],['function tailBound','function comparisonBox'],['function comparisonBox','function chiAt']];
  assert.equal(manifest.unchangedSpans.length,spans.length);
  const text=base.toString(),variant=derived.toString();
  for(const [start,end] of spans){
    const extract=s=>{const a=s.indexOf(start);assert.ok(a>=0);const b=s.indexOf(end,a+start.length);assert.ok(b>a);return s.slice(a,b);};
    const x=extract(text),y=extract(variant),entry=manifest.unchangedSpans.find(v=>v.start===start);
    assert.equal(y,x,start);assert.equal(entry.sha256,digest(x));assert.equal(entry.bytes,Buffer.byteLength(x));assert.equal(entry.equal,true);
  }
  // The selection, positivity and sampling arithmetic in the driver is also
  // compared directly, beyond the seven advertised reusable function spans.
  const driver=s=>s.slice(s.indexOf('    const resolvent=positiveSeries'),s.indexOf('    const record={'));
  assert.ok(driver(text).length>500);assert.equal(driver(variant),driver(text));
});

test('the shipped source example is canonical JSON with a bound and an exact parameter contract',()=>{
  const [example]=getAxisSourceExamples();
  assert.equal(example.request.kind,'ns.axis-source-certificate');
  assert.equal(validateAxisSourceInput(example.request.input).valid,true);
  assert.deepEqual(clone(example.request.input),axisSourceExampleInput());
  assert.ok(example.request.budget.maxOperations<=50000000);
  assert.ok(example.request.budget.maxPoints<=16384);
});

test('the default actually binds the A.21 target and constructs a whole-eta local certificate',()=>{
  const r=fixture();
  assert.equal(r.status,'VERIFIED_LOCAL_BOUND_CERTIFICATE',r.message);
  assert.equal(r.schema,'MathScope.Navier.SourceAxisBoundCertificate/1');
  assert.equal(r.sourcePressureCertificate.status,'VERIFIED_ANALYTIC_PRESSURE_BOUND_CERTIFICATE');
  assert.equal(r.inputModel.pressure.family,'source-outer-A21');
  assert.equal('K' in r.inputModel.pressure,false,'A total-mass bound is not an actual rational pressure coefficient.');
  assert.equal(r.gates.sourceA21TargetPressureLinked,true);
  assert.equal(r.cutoff.coveredWholeInterval,true);
  assert.equal(r.bounds.allRadialCoefficients,true);
  assert.equal(r.bounds.allEtaDerivativeOrders,true);
  assert.deepEqual(r.bounds.fullRealAxisRectangle,{Y:['0','41/10'],eta:['-1','1']});
});

test('the selected scalar constants satisfy self-map, contraction and positivity inequalities exactly',()=>{
  const r=fixture(),B=BigInt(r.controlled.remainderBound),L=BigInt(r.controlled.remainderLipschitz),lambda=BigInt(r.selectedParameters.Lambda);
  assert.ok(lambda>=1n+B+L);
  assert.ok(B<=2n*lambda);
  assert.ok(L<lambda);
  assert.equal(sameFraction(r.bounds.selfMapDisplacementUpper.exact,`${B}/${2n*lambda}`),true);
  assert.equal(sameFraction(r.bounds.contractionLipschitzUpper.exact,`${L}/${2n*lambda}`),true);
  assert.ok(compare(r.bounds.uniformPhiPositiveLower.exact,'1/4')>0);
  assert.equal(r.bounds.selfMapDisplacementUpper.exact,'1/400');
  assert.equal(r.bounds.uniformPhiError.exact,'1/318');
});

test('the derived mass and branch majorants match the exact selected coefficient tube',()=>{
  const r=fixture(),p=r.sourcePressureCertificate,c=r.sourcePressureOnCoefficientTube,t=r.complexInput;
  assert.equal(c.realWindow,'11/10');
  assert.equal(c.tubeRadius,t.outerTubeRadius);
  assert.equal(c.domination.massUpper,p.totalMassUpper);
  assert.ok(compare(c.denominatorRealPartLower,'0')>0);
  // The unchanged rational majorant uses a more conservative denominator.
  assert.ok(compare(c.denominatorAbsLower,t.denominatorLowerBounds['1+z^2'])>=0);
  assert.ok(compare(p.innerThetaOneMassLower,'4')>=0);
  assert.equal(p.mass.bothInfiniteEndsIncluded,true);
  assert.equal(p.mass.finiteCutoffUsed,false);
  assert.equal(p.mass.quadratureUsed,false);
  assert.equal(p.complexBounds.quadratureUsed,false);
  assert.equal(p.mixedThetaSuffix.nonzeroUpperRetained,true);
});

test('binary64 h is bound as its exact dyadic value and not an equal-looking decimal',()=>{
  const r=fixture(),dyadic='3022314549036573/302231454903657293676544';
  assert.equal(r.pressureAxisBinding.status,'EXACT_H_MATCH');
  assert.equal(r.pressureAxisBinding.matches,true);
  assert.equal(r.selectedParameters.h,dyadic);
  assert.equal(r.sourcePressureCertificate.parameterHExact,dyadic);
  assert.equal(validateAxisSourceInput({...axisSourceExampleInput(),h:dyadic}).valid,true);
  const bad=validateAxisSourceInput({...axisSourceExampleInput(),h:'1/100000000'});
  assert.equal(bad.valid,false);assert.equal(bad.status,'AXIS_H_MISMATCH');
});

test('explicit exact h and omitted h generate the same mathematical certificate',()=>{
  const input=shortInput(),h=validateAxisSourceInput(input).parameterHExact;
  const a=certifyAxisSource(input,freshBudget()),b=certifyAxisSource({...input,h},freshBudget());
  assert.equal(a.status,'VERIFIED_LOCAL_BOUND_CERTIFICATE',a.message);
  assert.equal(b.status,'VERIFIED_LOCAL_BOUND_CERTIFICATE',b.message);
  assert.deepEqual(mathematical(a),mathematical(b));
});

test('a genuinely decimal source h has its own exact equality and its own selected tuple',()=>{
  const input=shortInput();input.pressure.parameters.h='1/100000000';input.h='1/100000000';
  const r=certifyAxisSource(input,freshBudget());
  assert.equal(r.status,'VERIFIED_LOCAL_BOUND_CERTIFICATE',r.message);
  assert.equal(r.pressureAxisBinding.axisHExact,'1/100000000');
  assert.equal(r.pressureAxisBinding.matches,true);
  assert.equal(r.sourcePressureCertificate.inputBinding.h.inputKind,'EXACT_TEXT_RATIONAL');
  assert.equal(r.sourcePressureCertificate.inputBinding.h.numericApproximationIsIdentical,false);
  // Integer majorants may coincide for nearby exact inputs; the mathematical
  // parameter tuple and its h binding must still retain the distinct datum.
  assert.notDeepEqual(r.selectedParameters,fixture().selectedParameters);
});

test('all cutoff cells form one exact cover, with an actual low-Z exclusion or positive H-square margin',()=>{
  const r=fixture(),cells=[...r.cutoff.cells].sort((a,b)=>compare(a.eta.lower,b.eta.lower));
  assert.equal(cells[0].eta.lower,'-1');assert.equal(cells.at(-1).eta.upper,'1');
  for(let i=0;i<cells.length;i++){
    const c=cells[i];assert.ok(compare(c.eta.lower,c.eta.upper)<0);
    if(i)assert.equal(cells[i-1].eta.upper,c.eta.lower);
    if(c.reason==='abs(Z)>delta')assert.ok(compare(c.Z.lower,r.cutoff.delta)>0||compare(c.Z.upper,'-'+r.cutoff.delta)<0);
    else {assert.equal(c.reason,'H2>=positive-margin');assert.ok(compare(c.H2.lower,r.cutoff.positiveH2Margin)>=0);assert.ok(compare(c.H2.lower,'0')>0);}
  }
});

test('repaired E, finite eta jets, the complete witness and the old scalar Lean receipt stay outside scope',()=>{
  const r=fixture();
  for(const k of ['existingFiniteJetLinked','completedOuterPressureLinked','fullOriginalParameterOrder','globalWitness','fullProfileCertified','fullCertificateKernelChecked'])assert.equal(r.gates[k],false,k);
  assert.equal(r.derivedFrom.rationalDefaultScalarLeanAuditAppliesToThisInstance,false);
  assert.equal(r.proofBoundary.formalPass,false);
  assert.equal(r.sourcePressureCertificate.gates.exactPressureEqualityWithRepairedE,false);
  assert.equal(r.sourcePressureCertificate.gates.fullPremiseBundleLeanChecked,false);
  assert.equal(r.sourcePressureCertificate.gates.existingFiniteJetsCertified,false);
  assert.ok(r.proofBoundary.notInferred.some(s=>s.includes('repaired')));
  assert.ok(r.proofBoundary.notInferred.some(s=>s.includes('eta-jet')));
});

test('large exact tuples and every tail are preserved as JSON strings while plotted coordinates stay finite',()=>{
  const r=fixture();
  for(const value of [r.selectedParameters.Lambda,r.selectedParameters.logC,r.controlled.remainderBound,r.controlled.remainderLipschitz])assert.equal(typeof value,'string');
  assert.ok(r.visualization.points.every(p=>p.pos.length===3&&p.pos.every(Number.isFinite)));
  assert.equal(r.visualization.points.length,r.tails.rows.length);
  assert.equal(r.tails.rows[0].phiTailUpper,'0');
  for(const t of r.tails.rows){assert.ok(compare(t.phiTailUpper,'0')>=0);assert.ok(compare(t.normalizedProfileEnclosure.lower,t.normalizedProfileEnclosure.upper)<0);}
  assert.doesNotThrow(()=>JSON.stringify(r));
});

test('the source adapter refuses a pressure whose derived prefix mass is too small',()=>{
  const input=shortInput();input.pressure.parameters.logP=0;
  assert.equal(validateAxisSourceInput(input).valid,true,'Structural validation does not fabricate an analytic mass certificate.');
  const r=certifyAxisSource(input,freshBudget());
  assert.equal(r.status,'UNSUPPORTED_PRESSURE_SIZE');assert.equal(r.evidenceGrade,'NO_CERTIFICATE');
});

test('256-bit producer bounds use the internal rational path without relaxing public input limits',()=>{
  const input=shortInput({boundBits:256}),r=certifyAxisSource(input,freshBudget());
  assert.equal(validateAxisSourceInput(input).valid,true);
  assert.equal(r.status,'VERIFIED_LOCAL_BOUND_CERTIFICATE',r.message);
  assert.equal(r.sourcePressureCertificate.normalizedInput.boundBits,256);
  assert.ok(r.sourcePressureCertificate.totalMassUpper.length>600,'This exercises the previously blocked internal value.');
  assert.equal(r.pressureAxisBinding.matches,true);
  assert.equal(r.gates.globalWitness,false);
  assert.equal(validateAxisSourceInput({...input,h:'1'.repeat(601)}).valid,false);
});

for(const [name,change] of [
  ['rational family in the source adapter',{pressure:{family:'rational',K:'10'}}],
  ['untrusted mass upper',{pressure:{family:'source-outer-A21',parameters:axisSourceExampleInput().pressure.parameters,totalMassUpper:'1'}}],
  ['pressure-truth flag',{pressure:{family:'source-outer-A21',parameters:axisSourceExampleInput().pressure.parameters,certified:true}}],
  ['top-level norm assertion',{normUpper:'1'}],
  ['caller-selected Lambda',{Lambda:'1000000000000000000000'}],
  ['caller-selected logC',{logC:'1000000000000000000000'}],
  ['changed real coefficient window',{realWindow:'1'}],
  ['mismatched axis h',{h:'1/100000000'}],
  ['nonfinite j0',{j0:Infinity}],
  ['NaN source parameter',{pressure:{family:'source-outer-A21',parameters:{...axisSourceExampleInput().pressure.parameters,h:NaN}}}],
  ['zero rational denominator',{h:'1/0'}],
  ['excess pressure precision',{boundBits:257}],
  ['noncontracting radius ratio',{coefficientRadiusRatio:'1'}],
  ['excess coefficient degree',{tailDegree:129}],
  ['derivative above the retained degree',{tailDegree:2,radialDerivativeOrder:3}],
  ['excess eta derivative order',{etaDerivativeOrder:5}],
  ['eta outside the certified interval',{sampleEta:'11/10'}],
  ['radius outside the positive interval',{maxY:'5'}]
])test('reject '+name,()=>{
  const input={...axisSourceExampleInput(),...change},v=validateAxisSourceInput(input),r=certifyAxisSource(input,freshBudget());
  assert.equal(v.valid,false);assert.notEqual(r.status,'VERIFIED_LOCAL_BOUND_CERTIFICATE');assert.equal(r.evidenceGrade,'NO_CERTIFICATE');assert.equal(r.gates.globalWitness,false);
});

test('operation exhaustion and cancellation prevent a source certificate',()=>{
  assert.equal(certifyAxisSource(axisSourceExampleInput(),freshBudget({maxOperations:1000})).status,'RESOURCE_LIMIT');
  assert.equal(certifyAxisSource(axisSourceExampleInput(),makeBudget({}, {isCancelled:()=>true})).status,'CANCELLED');
});

test('maxPoints bounds both plotted samples and the complete cutoff cover',()=>{
  assert.equal(certifyAxisSource(axisSourceExampleInput(),freshBudget({maxPoints:2})).status,'RESOURCE_LIMIT');
  assert.equal(certifyAxisSource(shortInput(),freshBudget({maxPoints:4})).status,'RESOURCE_LIMIT');
});

test('the producer is recomputed from exact inputs and does not import serialized certificate truth',()=>{
  const r=fixture(),p=createSourcePressureAnalyticProducer({parameters:axisSourceExampleInput().pressure.parameters,boundBits:128},freshBudget());
  assert.deepEqual(p.certificate,r.sourcePressureCertificate);
  const bad=clone(axisSourceExampleInput());bad.pressure.certificate=clone(p.certificate);
  assert.equal(validateAxisSourceInput(bad).valid,false);
});
