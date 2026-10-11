import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualInductionExpressions} from '../actual-residual-order-induction-expressions.mjs';
import {disposableThirdJetCacheCopy} from '../actual-third-jet-ftc.mjs';
import {actualLeadingTargetOnSensitivityGraph} from '../actual-covariance-sensitivity.mjs';
import {leadingDerivativeBodyIdentity,leadingTargetBodyBinding,assertActualBackgroundResidualFlatness} from '../actual-background-residual-flatness.mjs';

class IndependentExpressions extends ActualInductionExpressions {
  derivative(id,coordinate){return this.dependsOn(id,coordinate)?super.derivative(id,coordinate):this.zero;}
}

function fixture(){
  const G=new ActualInductionExpressions(new ActualConvergentExpressions()),X=G.fresh('leading_binding_X'),eta=G.core.eta,
    q=(n,d=1)=>G.q(n,d),t=G.fresh('leading_binding_t'),
    radial=G.choose(X,q(1),q(2),G.exp(X),G.add(G.exp(X),G.step(X)),G.exp(X)),
    // The retained source AD of the eta-independent radial primitive is an
    // all-zero integral/piecewise tree. The independent AD returns G.zero.
    primitive=G.integral(G.substitute(radial,X,t),t,G.zero,X),
    M=G.choose(X,q(1),q(2),G.add(G.mul(eta,G.exp(X)),primitive),
      G.add(G.mul(G.pow(eta,2),G.exp(X)),primitive),G.add(G.mul(eta,G.exp(X)),primitive)),
    F=G.share(G.mul(G.exp(G.neg(X)),G.add(G.one,G.pow(eta,2))),[X,eta],'fixture_F'),
    U=G.share(G.mul(G.exp(G.neg(X)),G.add(G.one,eta)),[X,eta],'fixture_U'),
    prepared={bootstrap:{constants:{X,eta},finalM:M},records:[{global:{F,U}}]},
    operator={background:{prepared},chart:{X,eta,s:G.one},constants:{A:G.core.A,D:G.core.D,h:G.parameter('h')}},
    common=actualLeadingTargetOnSensitivityGraph(G,operator),
    derivatives=[['M',eta],['F',X],['U',X]].map(([name,coordinate])=>({name,coordinate,sourceField:common[name],sourceDerivative:G.derivative(common[name],coordinate)})),
    sourceNodeCount=G.nodes.length,H=new IndependentExpressions(disposableThirdJetCacheCopy(G)),
    independent=actualLeadingTargetOnSensitivityGraph(H,operator);
  return {G,H,X,eta,common,independent,derivatives,sourceNodeCount};
}

test('same leading target binds the original M_eta tree and both radial shears before copy',()=>{
  const f=fixture(),events=[],p=leadingTargetBodyBinding(f.H,f.common,f.independent,f.derivatives,f,{onProgress:event=>events.push(event)});
  assert.notEqual(f.derivatives[0].sourceDerivative,p.derivatives[0].independentDerivative);
  assert.equal(p.derivatives[0].check.direct.pass,false);
  assert.equal(p.derivatives[0].check.pass,true);assert.ok(p.derivatives[0].check.trace.length>0);
  assert.ok(f.derivatives.every(row=>row.sourceDerivative<f.sourceNodeCount));
  assert.equal(p.derivatives.length,3);assert.equal(p.primitives.length,10);assert.equal(p.stresses.length,2);
  assert.ok(p.stresses.every(row=>row.check.pass));assert.equal(p.sourceAuthenticated,false);
  assert.equal(events.filter(row=>row.stage==='same-common-leading-stress-shell').length,2);
  assert.throws(()=>assertActualBackgroundResidualFlatness(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('literal derivative comparison preserves a nonzero compact primitive and every branch',()=>{
  const G=new ActualConvergentExpressions(),X=G.fresh('nonzero_primitive_X'),t=G.fresh('nonzero_primitive_t'),
    density=G.choose(t,G.q(1),G.q(2),G.zero,G.step(t),G.zero),primitive=G.integral(density,t,G.zero,X),
    nonzero=G.choose(X,G.q(1),G.q(2),G.zero,G.exp(X),G.zero);
  assert.equal(leadingDerivativeBodyIdentity(G,primitive,G.zero).pass,false);
  assert.equal(leadingDerivativeBodyIdentity(G,nonzero,G.zero).pass,false);
  const changedLimit=G.integral(density,t,G.zero,G.mul(G.q(2),X));
  assert.equal(leadingDerivativeBodyIdentity(G,primitive,changedLimit).pass,false);
});

test('either omitted source shear still fails after the derivative representation repair',()=>{
  for(const component of [0,1]){
    const f=fixture(),term=component===0?f.independent.terms.thetaShear:f.independent.terms.zShear,
      raw=[...f.independent.raw],body=f.H.materializeExpressionFunction(...f.H.nodes[raw[component]].args);
    raw[component]=f.H.share(f.H.sub(body,term),[f.X,f.eta],'fixture_missing_shear_'+component);
    assert.throws(()=>leadingTargetBodyBinding(f.H,f.common,{...f.independent,raw},f.derivatives,f),error=>
      error.code==='INVALID_SOURCE_CONSTRUCTION'&&error.message.includes('both shear terms'));
  }
});

test('source derivative omissions, altered derivatives and exhausted literal budgets cannot pass',()=>{
  const f=fixture();
  assert.throws(()=>leadingTargetBodyBinding(f.H,f.common,f.independent,f.derivatives.slice(1),f),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const changed=f.derivatives.map(row=>({...row}));changed[0].sourceDerivative=f.H.add(changed[0].sourceDerivative,f.H.one);
  assert.throws(()=>leadingTargetBodyBinding(f.H,f.common,f.independent,changed,f),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>leadingDerivativeBodyIdentity(f.H,changed[0].sourceDerivative,f.H.zero,{maxVisits:1}),{code:'RESOURCE_LIMIT'});
});
