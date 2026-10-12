import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualInductionExpressions} from '../actual-residual-order-induction-expressions.mjs';
import {explicitPrimitiveBodyIdentity,matchExplicitPrimitiveDensity,originalRadialBumpPrimitiveIdentities,originalEvenAveragePrimitiveIdentity} from '../actual-global-primitive-kernels.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

test('the full R-bump primitive keeps dX=R dR for arbitrary coefficient and exponent',()=>{
  const r=originalRadialBumpPrimitiveIdentities();assert.equal(r.pass,true);
  assert.equal(r.checks.mass.pass,true);assert.equal(r.checks.pressure.pass,true);
  assert.equal(r.negativeControls.omittedRadialJacobian.pass,false);
  assert.equal(r.sourceAuthenticated,false);
});

test('the general-n Picard average identity and its wrong-sign control are independent of n',()=>{
  const r=originalEvenAveragePrimitiveIdentity();assert.equal(r.check.pass,true);assert.equal(r.wrongSign.pass,false);
  assert.equal(r.allPositiveOrders,true);assert.equal(r.sourceAuthenticated,false);
});

test('explicit primitive comparison ignores only shared names and alpha-renaming of bound coordinates',()=>{
  const G=new ActualInductionExpressions(new ActualConvergentExpressions()),X=G.fresh('X'),eta=G.fresh('eta'),s=G.fresh('s'),t=G.fresh('t'),
    f=G.sin?G.sin(X):G.sine(X),body=G.add(G.mul(eta,f),G.exp(G.neg(G.pow(X,2)))),
    shared=G.share(body,[X,eta],'same actual body'),left=G.integral(G.substitute(shared,X,s),s,G.zero,X),right=G.integral(G.substitute(body,X,t),t,G.zero,X);
  assert.equal(explicitPrimitiveBodyIdentity(G,left,right).pass,true);
  const wrongEnd=G.integral(G.substitute(body,X,t),t,G.zero,G.mul(G.q(2),X));
  assert.equal(explicitPrimitiveBodyIdentity(G,left,wrongEnd).pass,false);
  const wrongDensity=G.integral(G.substitute(G.add(body,G.one),X,t),t,G.zero,X);
  assert.equal(explicitPrimitiveBodyIdentity(G,left,wrongDensity).pass,false);
  const derivativeShare=G.expressionValue(G.nodes[shared].args[0],[X,eta],[1,0]);
  assert.equal(explicitPrimitiveBodyIdentity(G,shared,derivativeShare).pass,false);
});

test('the same source atom retains its actual free-parameter substitution',()=>{
  const G=new ActualInductionExpressions(new ActualConvergentExpressions()),eta=G.fresh('eta'),X=G.fresh('X'),a=G.exp(G.pow(eta,2)),
    f=G.share(G.mul(a,G.sine(X)),[X,eta],'explicit source'),s=G.fresh('s'),t=G.fresh('t'),
    l=G.integral(G.substitute(f,X,s),s,G.zero,X),r=G.integral(G.mul(a,G.sine(t)),t,G.zero,X);
  assert.equal(explicitPrimitiveBodyIdentity(G,l,r,{atomicNodes:[a]}).pass,true);
  const altered=G.expressionValue(G.nodes[f].args[0],[X,G.add(eta,G.one)]);
  assert.equal(explicitPrimitiveBodyIdentity(G,f,altered,{atomicNodes:[a]}).pass,false);
});

test('a nonconstant compact primitive cannot be declared zero from its compact density',()=>{
  const G=new ActualConvergentExpressions(),X=G.fresh('X'),s=G.fresh('s'),f=G.step(s,1),
    primitive=G.integral(f,s,G.zero,G.one);
  assert.equal(explicitPrimitiveBodyIdentity(G,primitive,G.zero).pass,false);
  const partial=G.integral(f,s,G.zero,X),derivative=G.derivative(partial,X),expected=G.step(X,1);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(derivative,expected)).pass,true);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(derivative,G.zero)).pass,false);
});

test('a declared visit budget yields resource failure instead of an unverified equality',()=>{
  const G=new ActualConvergentExpressions(),X=G.fresh('X'),f=G.exp(G.add(X,G.one)),other=G.exp(X);
  assert.equal(explicitPrimitiveBodyIdentity(G,f,f,{maxVisits:1}).pass,true);
  assert.throws(()=>explicitPrimitiveBodyIdentity(G,f,other,{maxVisits:1}),{code:'RESOURCE_LIMIT'});
});

test('literal prefix roles are selected by real source density, independently of commutative operand order',()=>{
  const G=new ActualConvergentExpressions(),X=G.fresh('X'),t=G.fresh('t'),a=G.integral(G.sine(t),t,G.zero,X),b=G.integral(G.cosine(t),t,G.zero,X);
  for(const candidates of [[a,b],[b,a]]){
    assert.equal(matchExplicitPrimitiveDensity(G,candidates,G.sine(X)),a);
    assert.equal(matchExplicitPrimitiveDensity(G,candidates,G.cosine(X)),b);
  }
  assert.throws(()=>matchExplicitPrimitiveDensity(G,[a,b],G.exp(X)),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>matchExplicitPrimitiveDensity(G,[a,a],G.sine(X)),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
