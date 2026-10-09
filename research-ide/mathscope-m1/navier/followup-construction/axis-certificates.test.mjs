import test from 'node:test';
import assert from 'node:assert/strict';
import {certifyAxis,axisExampleInput,validateAxisInput,getAxisExamples} from './axis-certificates.mjs';
import {makeBudget} from '../numerics.mjs';

const a=certifyAxis(axisExampleInput());
const rat=s=>{const [n,d='1']=s.split('/');return [BigInt(n),BigInt(d)];};
const less=(a,b)=>{const [n,d]=rat(a),[m,e]=rat(b);return n*e<m*d;};
test('default analytic datum yields an all-eta local bound certificate',()=>{
  assert.equal(a.status,'VERIFIED_LOCAL_BOUND_CERTIFICATE');
  assert.equal(a.cutoff.coveredWholeInterval,true);assert.ok(a.cutoff.cells.length>1);
  assert.equal(a.bounds.allRadialCoefficients,true);assert.equal(a.bounds.allEtaDerivativeOrders,true);
  assert.ok(less(a.bounds.contractionLipschitzUpper.exact,'1/2'));
  assert.ok(less('1/4',a.bounds.uniformPhiPositiveLower.exact));
});
test('finite scalar bounds satisfy the actual fixed-point hypotheses exactly',()=>{
  const B=BigInt(a.controlled.remainderBound),L=BigInt(a.controlled.remainderLipschitz),lam=BigInt(a.selectedParameters.Lambda);
  assert.ok(1n+B+L<=lam);assert.ok(B<=2n*lam);assert.ok(L<=lam);
  assert.equal(a.bounds.selfMapDisplacementUpper.exact,'1/400');
  assert.equal(a.bounds.uniformPhiError.exact,'1/318');
});
test('doubling computed Lambda halves the certified uniform error',()=>{
  const b=certifyAxis({...axisExampleInput(),lambdaMultiplier:4,sampleCount:3});
  assert.equal(b.status,'VERIFIED_LOCAL_BOUND_CERTIFICATE');
  assert.equal(BigInt(b.selectedParameters.Lambda),2n*BigInt(a.selectedParameters.Lambda));
  assert.equal(b.bounds.selfMapDisplacementUpper.exact,'1/800');
  assert.equal(b.bounds.uniformPhiError.exact,'1/636');
});
test('higher tail degree improves the bound for the same infinite solution',()=>{
  const b=certifyAxis({...axisExampleInput(),tailDegree:12,sampleCount:3});
  assert.equal(b.status,'VERIFIED_LOCAL_BOUND_CERTIFICATE');
  assert.ok(less(a.tails.rows.at(-1).phiTailUpper,b.tails.rows.at(-1).phiTailUpper));
  assert.equal(a.selectedParameters.Lambda,b.selectedParameters.Lambda);
});
test('a different exact pressure coefficient receives its own derived certificate',()=>{
  const b=certifyAxis({...axisExampleInput(),pressure:{family:'rational',K:'4'},sampleCount:3});
  assert.equal(b.status,'VERIFIED_LOCAL_BOUND_CERTIFICATE');
  assert.notEqual(b.selectedParameters.Lambda,a.selectedParameters.Lambda);
  assert.equal(b.inputModel.pressure.K,'4');
});
test('large exact constants remain strings and every plotted coordinate is finite',()=>{
  assert.equal(typeof a.controlled.remainderBound,'string');
  assert.equal(typeof a.selectedParameters.Lambda,'string');
  assert.equal(typeof a.selectedParameters.logC,'string');
  assert.ok(a.selectedParameters.Lambda.length>30);
  assert.ok(a.visualization.points.every(p=>p.pos.every(Number.isFinite)));
  assert.doesNotThrow(()=>JSON.stringify(a));
});
test('the certificate never promotes the old jet, outer datum, or full witness',()=>{
  for(const k of ['existingFiniteJetLinked','completedOuterPressureLinked','fullOriginalParameterOrder','globalWitness','fullProfileCertified','fullCertificateKernelChecked'])assert.equal(a.gates[k],false);
  assert.equal(a.proofBoundary.formalPass,false);
  assert.equal(a.inputModel.pressure.completedOutgoingPressure,false);
});
for(const [name,change] of [
  ['unknown pressure',{pressure:{family:'external',K:'10'}}],
  ['forged top-level norm',{normBound:'1'}],
  ['forged pressure certificate',{pressure:{family:'rational',K:'10',certified:true}}],
  ['caller Lambda',{Lambda:'999999999999999999999'}],
  ['caller normalization',{logC:'999999999999999999999'}],
  ['negative pressure coefficient',{pressure:{family:'rational',K:'-1'}}],
  ['too-small negative pressure',{pressure:{family:'rational',K:'3'}}],
  ['NaN',{h:NaN}],['Infinity',{j0:Infinity}],['unsafe integer',{pressure:{family:'rational',K:1e100}}],
  ['zero denominator',{h:'1/0'}],['noncontracting radius ratio',{coefficientRadiusRatio:'1'}],
  ['excess degree',{tailDegree:129}],['excess derivative',{etaDerivativeOrder:5}],
  ['out-of-domain eta',{sampleEta:'11/10'}],['out-of-domain Y',{maxY:'5'}]
])test(`reject ${name}`,()=>{
  const input={...axisExampleInput(),...change},v=validateAxisInput(input),r=certifyAxis(input);
  assert.equal(v.valid,false);assert.notEqual(r.status,'VERIFIED_LOCAL_BOUND_CERTIFICATE');assert.equal(r.evidenceGrade,'NO_CERTIFICATE');
});
test('cancellation uses the existing budget hook',()=>{
  const r=certifyAxis(axisExampleInput(),makeBudget({}, {isCancelled:()=>true}));assert.equal(r.status,'CANCELLED');
});
test('operation budget aborts before certifying',()=>{
  const r=certifyAxis(axisExampleInput(),makeBudget({maxOperations:1000}));assert.equal(r.status,'RESOURCE_LIMIT');
});
test('maxPoints bounds both samples and the all-eta cover',()=>{
  assert.equal(certifyAxis(axisExampleInput(),makeBudget({maxPoints:2})).status,'RESOURCE_LIMIT');
  assert.equal(certifyAxis({...axisExampleInput(),sampleCount:3},makeBudget({maxPoints:4})).status,'RESOURCE_LIMIT');
});
test('examples use safe exact input constants with the declared job kind',()=>{
  const [v]=getAxisExamples();assert.equal(v.request.kind,'ns.axis-certificate');assert.equal(validateAxisInput(v.request.input).valid,true);
});
