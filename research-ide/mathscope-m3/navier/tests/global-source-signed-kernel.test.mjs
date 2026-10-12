import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {exactSignedCovarianceInverse} from '../../../mathscope-m2/navier/actual-physical-residual-algebra.mjs';
import {exactHarmonicCovarianceIncrement,originalCurrentChartExponentAudit,attachGlobalSignedCurrent} from '../source-global-signed.mjs';

test('all six real-harmonic increment identities retain each of the three nonzero generic remainders',()=>{
  const G=new ActualConvergentExpressions(),vec=name=>[0,1,2].map(j=>G.fresh(name+'_'+j)),
    h=name=>({real:vec(name+'_A'),imaginary:vec(name+'_B')}),
    result=exactHarmonicCovarianceIncrement(G,{primary:h('W'),previous:h('E'),linearIncrement:h('L'),curlRemainder:h('R')});
  assert.equal(result.checks.length,6);assert.ok(result.checks.every(x=>x.pass));
  for(const name of ['earlier','curl','square'])assert.ok(result.omissions[name].every(x=>!x.pass));
  assert.equal(result.sourceAuthenticated,false);assert.equal(result.sameLabelSquareRetained,true);
});

test('the harmonic-half formula equals an independent exact four-point average of every quadratic component',()=>{
  const G=new ActualConvergentExpressions(),A=[0,1,2].map(j=>G.fresh('A'+j)),B=[0,1,2].map(j=>G.fresh('B'+j)),
    points=[[1,0],[0,1],[-1,0],[0,-1]],at=([c,s],i)=>G.sub(G.mul(G.q(c),A[i]),G.mul(G.q(s),B[i]));
  for(let i=0;i<3;i++)for(let j=i;j<3;j++){
    const average=G.mul(G.q(1,4),G.add(...points.map(p=>G.mul(at(p,i),at(p,j))))),
      expected=G.mul(G.q(1,2),G.add(G.mul(A[i],A[j]),G.mul(B[i],B[j])));
    assert.ok(sourceGraphRationalIdentity(G,G.sub(average,expected)).pass);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(average,G.mul(G.q(2),expected))).pass,false);
  }
});

test('the exact current chart exponents preserve the full pressure-moment product and stress tensor weight',()=>{
  const audit=originalCurrentChartExponentAudit();assert.equal(audit.pass,true);assert.equal(audit.checks.length,6);
  assert.deepEqual(audit.exponents.W,['1','2']);assert.deepEqual(audit.exponents.Sigma,audit.exponents.W);
  assert.deepEqual(audit.exponents.Jz,['0','2']);assert.deepEqual(audit.exponents.P,['1','2']);
  assert.deepEqual(audit.exponents.cRho,['-1','0']);assert.deepEqual(audit.exponents.rho,['1/2','0']);
  assert.equal(audit.genericExponentArithmeticOnly,true);
});

test('a genuinely signed exact target changes delta_a while the old positive amplitudes and full new square remain fixed',()=>{
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),H=[[q(3),q(1)],[q(-1),q(2)]],a=[q(2),q(3)],epsilon=q(1,8),target=[q(-7),q(5)],
    out=exactSignedCovarianceInverse(G,{H,amplitudes:a,epsilon,target});
  assert.deepEqual(out.a,a);assert.deepEqual(out.H,H);assert.ok(out.checks.every(x=>x.pass));
  assert.ok(out.diagnosticOmissions.omittedHalf.every(x=>!x.pass));assert.ok(out.square.some(x=>x!==G.zero));
  const expected=[q(-38,7),q(32,21)];
  for(let j=0;j<2;j++)assert.equal(sourceGraphRationalIdentity(G,G.sub(out.deltaAmplitude[j],expected[j])).pass,true);
});

test('receipts, a supplied Sigma and truncated harmonic vectors cannot become source authority',()=>{
  const G=new ActualConvergentExpressions();
  for(const fake of [{},{target:{Sigma:[G.zero,G.zero]}},{scope:{actualCurrentGlobalSigmaConstructed:true}}])
    assert.throws(()=>attachGlobalSignedCurrent(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>exactHarmonicCovarianceIncrement(G,{primary:{real:[G.zero],imaginary:[G.zero]}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
