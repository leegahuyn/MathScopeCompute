import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {GlobalSourceExpressions} from '../source-global-expressions.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {SourceCoupledExpressions,coupledForcedAngularInverse} from '../source-coupled-expressions.mjs';
import {materializeCoupledSourceClosure} from '../source-coupled-derivative-closure.mjs';
import {exactAuxiliaryPi} from '../source-auxiliary-fourier.mjs';

function fixture(){
  const base=new GlobalSourceExpressions(new ActualConvergentExpressions(),{maxNodes:400000,maximumSlowOrder:16}),
    A=new AuxiliarySourceExpressions(base,{maximumOrder:16}),G=new SourceCoupledExpressions(A),[x,y,v]=['x','y','v'].map(n=>G.fresh(n)),
    twoPi=G.mul(G.q(2),exactAuxiliaryPi(G).value),periodic=G.mul(G.sine(G.mul(twoPi,x)),G.cosine(G.mul(twoPi,y))),
    args={variable:v,parameters:[x,y],directions:[x,y],length:G.one,n:[G.one,G.zero,G.zero],
      K:Array.from({length:3},()=>[G.zero,G.zero,G.zero]),k:G.one,epsilon:G.one,m:1},
    f=[{real:G.zero,imaginary:G.zero},{real:G.mul(G.add(G.one,v),periodic),imaginary:G.zero},{real:G.zero,imaginary:periodic}],
    first=coupledForcedAngularInverse(G,{...args,forcing:f}),t=first.inverse.velocity[1].real,
    inverse=G.defineAuxiliaryInverse({name:'FourierAfterForced',body:t,Y:[x,y],parameters:[x,y,v],directions:[x,y,v]}),
    q=G.auxiliaryInverseValue(inverse,[x,y,v]);
  return {base,A,G,x,y,v,args,first,t,inverse,q};
}

test('an actual mixed Fourier derivative generates its own C0 and C1 tails and every inherited forced coefficient jet',()=>{
  const f=fixture(),{G,x,v,q}=f,d=G.derivative(G.derivative(q,v),x),
    closure=materializeCoupledSourceClosure(G,[q,d],{fourierCutoff:1,maxExpressions:10000});
  assert.equal(closure.fourierJets.length,2);assert.ok(closure.forcedJets.length>1);
  assert.ok(closure.fourierJets.some(r=>r.orders.join(',')==='1,0,1'));
  for(const row of closure.fourierJets){
    assert.equal(row.sourceJetDifferentiatedBeforeTail,true);assert.deepEqual(row.finite.derivativeOrders,[0,1]);
    assert.equal(row.finite.body,row.actualDerivativeBody);assert.equal(row.finite.zeroMode.inverted,false);
    assert.deepEqual(row.finite.tails.map(t=>t.sourceDerivativeOrder),[4,5]);
    assert.ok(row.finite.tails.every(t=>t.sourceBound.body===row.finite.centeredBody&&!t.omittedModesSetToZero));
    assert.equal(row.sourcePeriodicityStillRequiresAuthentication,true);
  }
  assert.equal(closure.everyForcedDerivativeHasItsOwnActualSourceAndFactorialTail,true);
  assert.equal(closure.everyFourierDerivativeHasItsOwnActualSourceAndC0C1Tail,true);
  assert.equal(closure.baseClosure.allRequestedSharedBodiesMaterialized,true);
  assert.equal(closure.finiteSeriesReplacedExactLimits,false);assert.equal(closure.sourceAuthenticated,false);
});

test('a later forced system can use the whole earlier auxiliary limit without losing its mixed derivative closure',()=>{
  const f=fixture(),{G,q,args}=f,later=coupledForcedAngularInverse(G,{...args,m:2,
    forcing:[{real:G.zero,imaginary:G.zero},{real:q,imaginary:G.zero},{real:G.zero,imaginary:G.zero}]}),
    derivative=G.derivative(later.inverse.velocity[1].real,f.x),closure=materializeCoupledSourceClosure(G,[derivative],{maxExpressions:12000});
  const systems=new Set(closure.forcedJets.map(j=>j.system));
  assert.ok(systems.has(f.first.inverse.system));assert.ok(systems.has(later.inverse.system));
  assert.ok(closure.fourierJets.length>0);assert.ok(closure.sharedExpressions.some(r=>r.body===q));
  assert.equal(later.inverse.G,f.first.inverse.G);assert.equal(closure.allCorrectionStagesConstructed,false);
  assert.equal(closure.originalAllBandClassBoundsCertified,false);assert.equal(closure.completeN6,false);
});

test('joint closure rejects an insufficient budget or an unauthenticated facade without dropping the pending tail',()=>{
  const f=fixture();assert.throws(()=>materializeCoupledSourceClosure(f.G,[f.q],{maxExpressions:1}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>materializeCoupledSourceClosure({...f.G},[f.q]),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>materializeCoupledSourceClosure(f.G,[f.q],{fourierCutoff:0}),{code:'INVALID_INPUT'});
});

test('an original shared defining body applied to a new exact limit keeps its own derivative body and the complete foreign argument',()=>{
  const f=fixture(),{base,G,q,x}=f,u=base.fresh('original_shared_u'),body=base.mul(base.pow(u,2),base.exp(u)),
    system=base.defineExpressionFunction({name:'OriginalBodyAtCoupledLimit',parameters:[u],body}),
    value=G.expressionValue(system,[q]),derivative=G.derivative(value,x),
    closure=materializeCoupledSourceClosure(G,[value,derivative],{maxExpressions:15000});
  assert.ok(G.extended(value));
  assert.ok(closure.sharedExpressions.some(r=>r.system===system&&r.orders[0]===0&&r.body===body));
  assert.ok(closure.sharedExpressions.some(r=>r.system===system&&r.orders[0]===1&&r.body===base.derivative(body,u)));
  assert.ok(closure.fourierJets.some(r=>r.system===f.inverse));
  assert.ok(closure.forcedJets.some(r=>r.system===f.first.inverse.system));
});

test('original zero and higher pulse jets at a new forced argument retain their original coefficient systems and full chain rule',()=>{
  const f=fixture(),{base,G,x,y,v,t}=f,z=base.fresh('original_third_slow'),w=base.fresh('original_pulse'),parameters=[x,y,z],
    matrix=[[base.mul(x,w),base.add(y,w)],[base.mul(z,w),base.zero]],
    covariance=base.defineCovarianceVolterra({name:'OriginalPulseAtForcedTime',variable:w,parameters,matrix,normUpper:base.q(1000),length:base.one}),
    pulse=base.bindGlobalPulseDerivatives(covariance,{directions:parameters}),
    zero=base.covarianceValue(covariance,1,t,parameters),higher=base.globalPulseJetValue(pulse,0,t,parameters,[1,0,0]),
    derivatives=[G.derivative(zero,v),G.derivative(higher,v)],
    closure=materializeCoupledSourceClosure(G,[zero,higher,...derivatives],{maxExpressions:15000});
  assert.ok(G.extended(zero)&&G.extended(higher));
  assert.ok(closure.baseClosure.pulseBlocks.some(b=>b.pulse===pulse&&b.orders.join(',')==='0,0,0'));
  assert.ok(closure.baseClosure.pulseBlocks.some(b=>b.pulse===pulse&&b.orders.join(',')==='1,0,0'));
  assert.ok(closure.forcedJets.some(j=>j.system===f.first.inverse.system));
  const dtime=G.derivative(t,v),canonical=base.covarianceValue(covariance,1,w,parameters),
    expected=G.mul(dtime,G.simultaneousSubstitute(base.derivative(canonical,w),[w,...parameters],[t,...parameters]));
  assert.equal(derivatives[0],expected);
});
