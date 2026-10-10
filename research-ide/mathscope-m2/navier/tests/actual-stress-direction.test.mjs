import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {actualStressDirectionBounds,ACTUAL_STRESS_DIRECTION_BINDINGS,flatKernelAudit,directionCPowerAbsorption} from '../actual-stress-direction-bounds.mjs';
import {compileActualStressDirectionProgram,innerMomentDifferenceAlgebra,innerStressDifferenceAlgebra} from '../actual-stress-direction-program.mjs';
import {rational as q,readRational,qadd,qsub,qmul,qdiv,qneg,qpow,qtext,qcompare} from '../actual-continuation-arithmetic.mjs';
import {directionAlgebraFixtures} from './actual-stress-direction-fixture.mjs';

const receipt=actualStressDirectionBounds(),algebra=directionAlgebraFixtures();
const G={q,one:q(1),zero:q(0),add:(...a)=>a.reduce(qadd,q(0)),mul:(...a)=>a.reduce(qmul,q(1)),sub:qsub,div:qdiv,neg:qneg,pow:qpow};
const decode=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,readRational(v)]));
const angular=(c,m)=>G.add(G.mul(qsub(q(1),c.h),m.I),G.neg(G.mul(c.D,c.eta,m.Ieta)),G.neg(G.mul(c.d,m.Jeta)),G.mul(q(2),qsub(c.h,c.D),c.eta,m.J));
const directStress=(c,b,m)=>{
  const W=qsub(q(1),qdiv(G.add(G.mul(q(2),c.D,c.eta,m.M),G.mul(c.d,m.Meta)),b.X));
  return [G.add(G.neg(qdiv(G.mul(b.F,b.X,W),c.L)),qdiv(angular(c,m),G.mul(q(2),b.X,c.L)),G.mul(q(2),b.Fy)),G.add(qdiv(G.add(G.neg(G.mul(b.X,W,b.U)),G.mul(c.D,qsub(m.M,G.mul(c.eta,m.Meta))),G.mul(q(4),c.h,c.eta,m.S),G.neg(G.mul(c.d,m.Seta)),G.mul(b.X,qsub(G.mul(q(4),c.A,c.eta,m.Cp),G.mul(c.d,m.Cpeta)))),G.mul(c.L,b.r)),qdiv(G.mul(q(2),b.Uy),b.r))];
};

test('the actual source and every quantitative edge premise retain their bytes',()=>{
  for(const b of ACTUAL_STRESS_DIRECTION_BINDINGS){const bytes=readFileSync(fileURLToPath(new URL('../../../'+b.path,import.meta.url)));assert.equal(bytes.length,b.bytes,b.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256,b.path);}
  assert.equal(receipt.pass,true);assert.ok(receipt.checks.every(x=>x.pass));assert.equal(receipt.generatedSourceInput.pass,true);
});

test('no caller source function, norm, endpoint, band or completed-frame assertion is accepted',()=>{
  for(const input of [null,[],{R:8192},{t1:'1/100'},{sourceProfile:'other'},{T0:'unit'},{directionModulus:1},{Sstar:1},{completedC2:true}])assert.throws(()=>actualStressDirectionBounds(input));
  for(const input of [null,{derivativeOrder:2},{sourceProfile:'other'},{kernel:true}])assert.throws(()=>compileActualStressDirectionProgram(input));
  assert.throws(()=>actualStressDirectionBounds({}, {checkCancelled(){throw Error('direction-cancel');}}),/direction-cancel/);
});

test('the two actual flat-factor programs contain the complete natural and heat operands',()=>{
  const p=receipt.program;assert.equal(p.scope.firstProfileDerivativesExpanded,true);assert.ok(p.nodes.some(n=>n.op==='actual_natural_series'));
  assert.equal(p.exactFactorization.commonZeroStressFactorDividedNumerically,false);assert.equal(p.exactFactorization.outer,'T0=exp(-4/delta^2)*delta^-3*(outerTheta,delta^6*outerZ)');
  assert.equal(p.preservedTerms.outerThreeAngularTerms,true);assert.equal(p.preservedTerms.outerPressureHeatSquare,true);assert.equal(p.preservedTerms.outerNestedAxialIntegral,true);
  assert.ok(p.outerKernels.some(r=>r.name==='outer_pressure'&&r.m===-3));assert.ok(p.outerKernels.some(r=>r.name==='outer_axial_stress'&&r.m===0));
  for(const n of ['innerTheta','innerZ','innerDirectionTheta','innerDirectionZ','outerTheta','outerZ','outerDirectionTheta','outerDirectionZ'])for(const suffix of ['','_eta','_radial'])assert.ok(Number.isInteger(p.roots[n+suffix]),n+suffix);
  assert.ok(p.nodes.filter(n=>n.op==='actual_natural_series').every(n=>n.args[3]<=2&&n.args[4]<=2));
  assert.equal(p.scope.entireFunctionNumericallyEnclosed,false);
});

test('five moment density differences keep their full nonlinear cross terms',()=>{
  let detectsCross=0;
  for(const row of algebra.inner){const b=decode(row.state),actualE=G.add(b.E,G.mul(b.a,b.EOver)),actualU=G.add(b.U,G.mul(b.a,b.uOver));
    const densities=(E,U)=>[G.mul(b.X,U),G.mul(b.r,b.X,E),G.mul(b.r,b.X,E,U),G.mul(b.X,qsub(qmul(U,U),qdiv(qmul(E,E),q(2)))),qdiv(qmul(E,E),q(2))];
    const direct=densities(actualE,actualU).map((x,j)=>qtext(qdiv(qsub(x,densities(b.E,b.U)[j]),b.a)));
    assert.deepEqual(row.density,direct);
    const withoutCross=G.mul(b.r,b.X,G.add(G.mul(b.E,b.uOver),G.mul(b.U,b.EOver)));
    if(qtext(withoutCross)!==row.density[2])detectsCross++;
  }
  assert.ok(detectsCross>30);
});

test('factored inner stress equals the independent difference of the full 4.11 and 4.16 stresses',()=>{
  let detectsMovingShear=0;
  for(const row of algebra.inner){const b=decode(row.state),c=decode(row.constants),m=decode(row.reference),dm=decode(row.momentDifference);
    const ref={...b,Fy:G.neg(qdiv(G.mul(b.p1,b.F),q(2)))},actual={...b,F:G.add(b.F,G.mul(b.a,b.FOver)),U:G.add(b.U,G.mul(b.a,b.uOver)),Uy:G.mul(b.kappa,b.Uy)};
    actual.Fy=G.neg(qdiv(G.mul(b.kappa,b.p1,actual.F),q(2)));
    const actualM=Object.fromEntries(Object.keys(m).map(k=>[k,G.add(m[k],G.mul(b.a,dm[k]))])),a=directStress(c,actual,actualM),r=directStress(c,ref,m),expected=a.map((x,j)=>qtext(qdiv(qsub(x,r[j]),b.a)));
    assert.deepEqual([row.stress.theta,row.stress.axial],expected);
    if(b.Uy[0]!==0n){const omitted=qadd(readRational(row.stress.axial),qdiv(G.mul(q(2),b.Uy),b.r));assert.notEqual(qtext(omitted),row.stress.axial);detectsMovingShear++;}
  }
  assert.ok(detectsMovingShear>30);
});

test('the inner ring identities are defined at exact zero activation without dividing it',()=>{
  const r=algebra.inner[5],b={...decode(r.state),a:q(0),kappa:q(1)};
  assert.equal(innerMomentDifferenceAlgebra(G,b).length,5);
  const value=innerStressDifferenceAlgebra(G,b,decode(r.momentDifference),decode(r.constants));assert.ok(value.theta[1]>0n);assert.ok(value.axial[1]>0n);
});

test('closed kernel derivative budgets fail when the missing factor is hidden',()=>{
  assert.equal(flatKernelAudit().pass,true);assert.equal(flatKernelAudit({radialDerivativeCoefficient:'1'}).pass,false);assert.equal(flatKernelAudit({outerDerivativeDivisor:'64'}).pass,false);
  assert.equal(qtext(qadd(q(1),q(56,27))),'83/27');assert.ok(qcompare(q(83,27),q(5))<0);
});

test('actual finite C powers fit the unchanged R using explicitly executed exponential terms',()=>{
  for(const p of [0,131,65536,receipt.inner.unitDirectionDerivativeCPower,1000000000])assert.equal(directionCPowerAbsorption(p).pass,true);
  for(const p of [-1,1.5,1000000001])assert.throws(()=>directionCPowerAbsorption(p));
  assert.ok(receipt.inner.factorCoefficientCPower>65536);assert.ok(receipt.outer.heatDerivatives.some(x=>x.order===4&&x.upper==='2880'));
});

test('the middle field ledger retains the second fast radial derivative and the regular axis density',()=>{
  const f=receipt.middle.fieldRows;assert.ok(f.find(x=>x.id==='C12_exponent_yy').description.includes('N A_phase,phase'));assert.ok(f.find(x=>x.id==='C12_mixed2_exponential').description.includes('D²'));
  assert.equal(receipt.middle.fieldInverseDividedBeforeBounding,true);assert.ok(receipt.middle.checks.every(x=>x.pass));assert.ok(receipt.middle.stressFirstJetPower<256);assert.ok(receipt.middle.unitDirectionDerivativePower<512);
  assert.ok(receipt.middle.exactStressFormulas.z.includes('-XWU'));assert.ok(receipt.middle.exactStressFormulas.theta.includes('2D_y F'));
});

test('the frozen c0 bound follows from the displayed weaker a bounds, with no silent exponent gain',()=>{
  const row=receipt.ratio.rows.find(r=>r.id==='frozen-normal-and-c0');assert.equal(row.upper,'v_s<R^18, |c0|<R^10');assert.ok(receipt.ratio.checks.every(x=>x.pass));
  for(let k=1;k<=40;k++){const a=q(k+10,7),b=q(k-20,11),F=q(k+3,19),s=qadd(qmul(a,a),qmul(b,b));if(qcompare(s,qmul(q(2),a))<=0)continue;
    const n2=qdiv(qmul(a,a),s),lambda2=qadd(G.neg(G.mul(q(4),F,F,n2)),G.mul(q(2),F,F,a)),c2=qdiv(lambda2,G.mul(q(4),F,F,n2));
    assert.equal(qtext(c2),qtext(qdiv(qsub(qadd(a,qdiv(qmul(b,b),a)),q(2)),q(2))));
  }
});

test('an overlapping closed profile modulus is distinct from a completed frame or H column',()=>{
  assert.equal(receipt.bounds.profileUnitDirectionFirstDerivativeUpper,'R^512');assert.equal(receipt.ratio.resultingRatioVariationUpper,'kappa/16');assert.equal(receipt.ratio.completedBackgroundFrozenFrameIncluded,false);
  assert.equal(receipt.scope.limitingDirectionsIncluded,true);
  for(const k of ['completedPositiveOrderBackgroundBound','actualGeneralLabelHomogeneousPulseEnclosed','actualUniformHColumnsCertified','sourceUniformQStarCertified','globalEquation730Certified','originalN506Complete','newLeanKernelProof'])assert.equal(receipt.scope[k],false,k);
});
