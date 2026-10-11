import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {homogeneousPulseGaussianPowerAudit,normalizedHomogeneousPulseBinding} from '../actual-pulse-gaussian-power-kernel.mjs';

function fixture(){
  const G=new ActualConvergentExpressions(),v=G.fresh('stable_v'),length=G.q(10),lambda=G.div(G.q(3),G.sqrt(G.add(G.one,G.pow(v,2)))),dref=G.div(G.add(G.one,G.pow(v,2)),G.q(2)),damping=G.add(dref,G.q(1,100)),
    error=[[G.q(1,200),G.q(-1,300)],[G.q(1,400),G.q(-1,500)]],projected=error.map((row,i)=>row.map((x,j)=>G.add(x,i===j?(i?G.neg(lambda):lambda):G.zero))),
    matrix=projected.map((row,i)=>row.map((x,j)=>i===j?G.sub(x,G.add(lambda,G.sub(damping,dref))):x)),time=G.fresh('stable_integral_time'),
    P=G.exp(G.integral(G.substitute(G.sub(lambda,dref),v,time),time,G.div(length,G.q(2)),v));
  return {G,input:{v,length,lambda,dref,damping,projected,error,matrix,P,initial:[G.one,G.zero]}};
}

test('the normalized matrix retains the damped second channel and the original envelope FTC',()=>{
  const {G,input}=fixture(),p=normalizedHomogeneousPulseBinding(G,input);
  assert.equal(p.checks.length,12);assert.ok(p.checks.every(x=>x.pass));
  assert.equal(p.stableDiagonal[0][0],G.zero);assert.equal(p.stableDiagonal[1][1],G.mul(G.q(-2),input.lambda));
  assert.equal(p.coefficientBoundsDerivedHere,false);
});

test('omitting the stable eigenvalue, reversing damping, or resetting the original initial data is rejected',()=>{
  const {G,input}=fixture(),wrong=input.matrix.map(row=>[...row]);wrong[1][1]=G.add(wrong[1][1],G.mul(G.q(2),input.lambda));
  assert.throws(()=>normalizedHomogeneousPulseBinding(G,{...input,matrix:wrong}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>normalizedHomogeneousPulseBinding(G,{...input,damping:G.sub(input.dref,G.q(1,100))}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>normalizedHomogeneousPulseBinding(G,{...input,initial:[G.zero,G.zero]}),{code:'INVALID_INPUT'});
  assert.throws(()=>normalizedHomogeneousPulseBinding(G,{...input,P:G.exp(input.v)}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('all finite fast-time orders keep the same positive denominator requirements and stable exponential',()=>{
  for(const order of [0,2,5,17]){
    const p=homogeneousPulseGaussianPowerAudit({order,maxWork:30000});
    assert.equal(p.powers.t.length,order+1);assert.ok(p.powers.t.every(Number.isSafeInteger));
    assert.ok(p.rows.filter(r=>r.lowerPower!==undefined).every(r=>[0,1,2,4].includes(r.lowerPower)));
    assert.equal(p.allFiniteOrdersUseSameSourceThreshold,true);
    assert.equal(p.actualSlowDerivativeBoundsProduced,false);
    assert.match(p.solution.normalizedBound,/exp\(\(2E\+Ed\)\*Lmax\)/);
    assert.ok(p.rows.some(r=>r.label==='original Bprime 00'));
    assert.ok(p.rows.some(r=>r.label==='original pressure numerator 0'));
  }
});

test('resource exhaustion is explicit and supplied source completion flags are not accepted as orders',()=>{
  assert.throws(()=>homogeneousPulseGaussianPowerAudit({order:20,maxWork:100}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>homogeneousPulseGaussianPowerAudit({order:-1}),{code:'INVALID_INPUT'});
});
