import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualInductionExpressions} from '../actual-residual-order-induction-expressions.mjs';
import {ActualCommonPhysicalJetExpressions} from '../actual-common-physical-jet-kernel.mjs';
import {actualLeadingTargetOnSensitivityGraph} from '../actual-covariance-sensitivity.mjs';
import {copiedLeadingDerivativePairs,leadingRegularDivergenceBodyBinding,assertActualCommonBandBackgroundResidual} from '../actual-common-band-background-residual.mjs';

// Formal, small original-formula fixture. The mass primitive is an actual
// integral of U. This is not a privately authenticated source family.
function fixture(){
  const G=new ActualInductionExpressions(new ActualConvergentExpressions()),X=G.fresh('leading_divergence_X'),eta=G.core.eta,
    q=(n,d=1)=>G.q(n,d),t=G.fresh('leading_divergence_mass_t'),
    radial=G.choose(X,q(1),q(2),G.exp(X),G.add(G.exp(X),G.mul(G.step(G.sub(X,q(1))),G.step(G.sub(q(2),X)))),G.exp(X)),
    axial=G.mul(G.add(G.one,eta),G.exp(G.neg(X))),U=G.add(axial,radial),
    M=G.add(G.integral(G.substitute(axial,X,t),t,G.zero,X),G.integral(G.substitute(radial,X,t),t,G.zero,X)),
    F=G.share(G.mul(G.exp(G.neg(X)),G.add(G.one,G.pow(eta,2))),[X,eta],'fixture_divergence_F'),
    prepared={bootstrap:{constants:{X,eta},finalM:M},records:[{global:{F,U,M}}]},
    operator={background:{prepared},chart:{X,eta,s:G.one},constants:{A:G.core.A,D:G.core.D,h:G.parameter('h')}},
    leading=actualLeadingTargetOnSensitivityGraph(G,operator),Meta=G.derivative(M,eta),{D,d,L}=G.core;
  prepared.records[0].global.v=G.div(G.sub(G.sub(G.mul(q(2),eta,U),G.div(G.mul(q(2),D,eta,M),X)),G.div(G.mul(d,Meta),X)),L);
  const sourceCount=G.nodes.length,H=new ActualCommonPhysicalJetExpressions(G),family={G,leading,prepared,
    source:{pressureStressSeminorms:{positiveStress:{moments:{pressure:{stream:{scope:{actualGlobalLeadingMassPrimitiveIdentity:true}}}}}}}};
  return {G,H,X,eta,family,sourceCount};
}

test('retained source derivatives are proved before their copied-graph representation is rewritten',()=>{
  const f=fixture(),p=copiedLeadingDerivativePairs(f.H,f.G,f.family.leading,f,f.sourceCount);
  assert.equal(p.rows.length,3);assert.equal(p.sourceAuthenticated,false);
  const mass=p.rows.find(r=>r.name==='M');
  assert.notEqual(mass.sourceDerivative,mass.independentDerivative);
  assert.equal(mass.check.direct.pass,false);assert.equal(mass.check.pass,true);
  assert.ok(mass.check.trace.length>0);
  assert.ok(p.rows.every(r=>r.sourceDerivative<f.sourceCount&&r.originalNodeBytesIdentical));
  assert.throws(()=>assertActualCommonBandBackgroundResidual(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('proved copied-source derivative pairs bind both original fluxes and their differentiated identities',()=>{
  const f=fixture(),events=[],p=leadingRegularDivergenceBodyBinding(f.H,f.family,f.sourceCount,{onProgress:e=>events.push(e)});
  assert.equal(p.derivativeRows.length,3);assert.ok(p.derivativeRows.every(r=>r.pass&&r.originalNodeBytesIdentical));
  assert.notEqual(p.derivativeRows[0].sourceDerivative,p.derivativeRows[0].independentDerivative);
  assert.equal(p.derivativeRows[0].check.direct.pass,false);assert.equal(p.derivativeRows[0].check.pass,true);
  assert.ok(p.fluxChecks.every(r=>r.pass));assert.ok(p.checks.every(r=>r.pass));
  assert.equal(p.sourceFluxes.length,2);assert.equal(p.sourceFluxRewrites.length,2);assert.equal(p.rawDefects.length,2);
  assert.ok(p.sourceFluxRewrites.some(r=>r.trace.some(t=>t.source===p.derivativeRows[0].sourceDerivative)));
  assert.equal(p.sourceAuthenticated,false);assert.throws(()=>assertActualCommonBandBackgroundResidual(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.equal(p.originalStressRetainedBeforeReduction,true);assert.equal(p.actualDefectsNotDefinedAsZero,true);
  assert.equal(events.filter(e=>e.stage==='same-physical-leading-derivative-body').length,3);
});

test('a new or changed sibling derivative root cannot be used as an operand of the physical graph',()=>{
  const f=fixture(),old=f.G.derivative.bind(f.G),late=f.G.add(f.G.derivative(f.family.leading.M,f.eta),f.G.one);
  f.G.derivative=(id,coordinate)=>id===f.family.leading.M&&coordinate===f.eta?late:old(id,coordinate);
  assert.throws(()=>copiedLeadingDerivativePairs(f.H,f.G,f.family.leading,f,f.sourceCount),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const h=fixture(),derivative=h.G.derivative(h.family.leading.M,h.eta);
  h.H.nodes[derivative]={op:'q',args:['1','1']};
  assert.throws(()=>copiedLeadingDerivativePairs(h.H,h.G,h.family.leading,h,h.sourceCount),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('deleting either original shear still fails the repaired flux binding',()=>{
  for(const component of [0,1]){
    const f=fixture(),root=f.family.leading.raw[component],body=f.H.materializeExpressionFunction(...f.H.nodes[root].args),
      term=component===0?f.family.leading.terms.thetaShear:f.family.leading.terms.zShear,
      changed=f.H.sub(body,term),raw=[...f.family.leading.raw];raw[component]=changed;
    assert.throws(()=>leadingRegularDivergenceBodyBinding(f.H,{...f.family,leading:{...f.family.leading,raw}},f.sourceCount),{code:'INVALID_SOURCE_CONSTRUCTION'});
  }
});
