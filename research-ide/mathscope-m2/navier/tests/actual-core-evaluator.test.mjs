import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {evaluateActualCorePoint as evaluate} from '../actual-core-evaluator.mjs';

const r=s=>{const [n,d='1']=s.split('/');return [BigInt(n),BigInt(d)];};
const cmp=(a,b)=>{a=r(a);b=r(b);return a[0]*b[1]<b[0]*a[1]?-1:a[0]*b[1]>b[0]*a[1]?1:0;};
const contains=(a,x)=>cmp(a.lower,x)<=0&&cmp(a.upper,x)>=0;
const overlaps=(a,b)=>cmp(a.lower,b.upper)<=0&&cmp(a.upper,b.lower)>=0;
const value=z=>z.displayEnclosure;
const base=evaluate();

test('binds actual assembly, actual pressure and Banach proof to pinned file bytes',()=>{
  for(const key of ['assembly','axisProof','pressure','pressureProof']){const source=base.sourceBindings[key];const bytes=readFileSync(new URL('../../../'+source.path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);}
  assert.equal(base.profileId,'same-profile-2026-10-10.3');assert.equal(base.sourceBindings.parameterExpressionSHA256.length,64);
});
test('nine mixed n=0 Phi intervals have finite displays and real result paths',()=>{
  assert.equal(base.phi.rows.length,9);
  for(const [i,row] of base.phi.rows.entries()){assert.equal(row.sourcePath,`result.results.phi.rows[${i}]`);assert.ok(value(row.actualNonlinearInterval).every(Number.isFinite));assert.ok(cmp(row.actualNonlinearInterval.lower,row.actualNonlinearInterval.upper)<=0);assert.ok(contains(row.actualNonlinearInterval,row.comparisonPolynomial.lower));assert.ok(contains(row.actualNonlinearInterval,row.comparisonPolynomial.upper));}
});
test('retains both positive mathematical errors when arithmetic precision changes',()=>{
  const high=evaluate({bits:512});
  for(let i=0;i<9;i++){const a=base.phi.rows[i],b=high.phi.rows[i];assert.equal(a.positiveNonlinearErrorUpper,b.positiveNonlinearErrorUpper);assert.ok(cmp(a.positiveNonlinearErrorUpper,'0')>0);assert.ok(cmp(a.comparisonRadialCauchyTailUpper,'0')>0);assert.ok(overlaps(a.actualNonlinearInterval,b.actualNonlinearInterval));}
  assert.equal(high.scope.positiveBanachErrorRetained,true);
});
test('constant axis identity has exact Phi=1 and zero eta derivatives',()=>{
  const z=evaluate({Y:0});for(const row of z.phi.rows.filter(x=>x.YDerivativeOrder===0)){const expected=row.normalizedEtaDerivativeOrder?'0':'1';assert.equal(row.actualNonlinearInterval.lower,expected);assert.equal(row.actualNonlinearInterval.upper,expected);}
  for(const row of z.axial.rows){assert.equal(row.uOverK.lower,'0');assert.equal(row.uOverK.upper,'0');}
});
test('arbitrary requested rational Y values change actual intervals',()=>{
  const ys=['1/3','7/3','4','41/10'].map(Y=>evaluate({Y,eta:{kind:'RHO_SCALED',value:'-1/5'}}));
  for(let i=1;i<ys.length;i++)assert.ok(value(ys[i].phi.rows[0].actualNonlinearInterval)[1]<value(ys[i-1].phi.rows[0].actualNonlinearInterval)[0]);
  for(const z of ys)assert.ok(value(z.phi.rows[0].actualNonlinearInterval)[0]>.25);
});
test('resolves the actual small-H eta chart rather than reusing eta-zero Phi',()=>{
  const zero=evaluate({eta:{kind:'J_SCALED',value:'0'}}),critical=evaluate({eta:{kind:'J_SCALED',value:'-2/9'}});
  assert.ok(value(zero.phi.rows[0].actualNonlinearInterval)[1]<.3);
  assert.ok(value(critical.phi.rows[0].actualNonlinearInterval)[0]>.999999);
  assert.ok(value(critical.phi.rows[2].actualNonlinearInterval)[1]<-1e7);
});
test('tiny exact rational eta divides symbolically without a rounded zero denominator',()=>{
  for(const sign of ['','-']){const z=evaluate({eta:{kind:'DIRECT_RATIONAL',value:sign+'1/'+(1n<<300n)}});assert.ok(value(z.phi.rows[0].actualNonlinearInterval).every(Number.isFinite));}
});
test('actual U and radial average retain scale and derivative distinction',()=>{
  assert.equal(base.axial.actualValues[0].normalization,'DIVIDE_BY_POSITIVE_J0');assert.ok(contains(base.axial.actualValues[0].U,'1'));
  assert.equal(base.axial.reconstruction.positiveCorrectionScale,'K/Lambda');
  const u=value(base.axial.rows[1].uOverK),a=value(base.axial.rows[1].averageUCorrectionOverK);assert.ok(u[0]>39&&u[1]<41);assert.ok(a[0]>19&&a[1]<21);
  assert.equal(base.axial.actualValues[2].positiveCorrectionScale,'K/Lambda');
  const directZero=evaluate({eta:{kind:'DIRECT_RATIONAL',value:'0'}});assert.equal(directZero.axial.actualValues[0].normalization,'ORDINARY_ETA_DERIVATIVE');assert.equal(directZero.axial.actualValues[0].positiveCorrectionScale,'K/Lambda');
});
test('ordinary eta points keep nonconstant actual pressure and nonzero axial derivatives',()=>{
  const z=evaluate({eta:{kind:'DIRECT_RATIONAL',value:'1/3'}});assert.ok(value(z.axial.rows[2].uOverK)[1]<-120);assert.equal(z.axial.pressure.derivatives.length,4);
  for(const row of z.axial.pressure.derivatives)assert.ok(cmp(row.analyticErrorUpper,'0')>0);
  assert.equal(z.axial.pressure.sourceApproximationIsActualPressure,false);
});
test('natural extension at Y>4 is not mislabeled as the physical B26 collar',()=>{
  const z=evaluate({Y:'41/10'});assert.equal(z.domain.sourcePosition,'NATURAL_ANALYTIC_EXTENSION_FOR_B26_INPUT_ONLY');assert.equal(z.domain.B26CutoffApplied,false);assert.equal(z.domain.actualPhysicalCollarEvaluated,false);
});
test('retains global and formal obligations',()=>{
  assert.equal(base.status,'PARTIAL');assert.equal(base.scope.wholeOriginalProfileEvaluatorComplete,false);assert.equal(base.scope.newLeanKernelProof,false);assert.equal(base.scope.globalMomentDebtEvaluated,false);assert.equal(base.scope.comparisonReplacedActualPhi,false);
});
test('rejects extrapolation, malformed precision and altered profile inputs',()=>{
  for(const input of [{Y:'42/10'},{Y:-1},{eta:{kind:'RHO_SCALED',value:'1/3'}},{eta:{kind:'DIRECT_RATIONAL',value:2}},{eta:{kind:'J_SCALED',value:'0',skipError:true}},{bits:64},{degree:24},{radialOrder:3},{precision:'exact'},{sourceProfile:'different-profile'},{Y:NaN}])assert.throws(()=>evaluate(input));
});
test('deterministic replay and cancellation propagate',()=>{
  assert.deepEqual(evaluate(),base);assert.throws(()=>evaluate({}, {checkCancelled(){throw Error('cancelled');}}),/cancelled/);
});
test('independent Python Fraction verifies pressure derivatives, axial rational reference and Bessel values',()=>{
  const inputs=[...['0','1/7','1/3','-2/3','1'].map(x=>({Y:'7/3',eta:{kind:'DIRECT_RATIONAL',value:x}})),...['0','-2/9','1/5'].map(x=>({Y:'7/3',eta:{kind:'J_SCALED',value:x}}))];
  const cases=inputs.map(input=>{const z=evaluate(input);return {request:z.request,cp:z.axial.pressure.cPInterval,pressure:z.axial.pressure.derivatives.map(d=>d.interval),axial:z.axial.rows.map(a=>a.uOverK),phi:z.phi.rows.filter(x=>x.normalizedEtaDerivativeOrder===0).map(x=>x.actualNonlinearInterval)};});
  const result=spawnSync('python',[new URL('./actual-core-evaluator-independent.py',import.meta.url).pathname],{input:JSON.stringify(cases),encoding:'utf8'});assert.equal(result.status,0,result.stderr||result.stdout);const receipt=JSON.parse(result.stdout);assert.ok(receipt.passed>=65);assert.equal(receipt.failed,0);
});
