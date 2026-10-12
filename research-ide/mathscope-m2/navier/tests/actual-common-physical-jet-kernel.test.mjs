import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualCovarianceExpressions} from '../actual-covariance-volterra.mjs';
import {ActualPulseThirdJetExpressions} from '../actual-pulse-third-jet-kernel.mjs';
import {ActualCommonPhysicalJetExpressions,assertSlowSignedTargetCoordinates} from '../actual-common-physical-jet-kernel.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

function base(){return new ActualCovarianceExpressions(new ActualConvergentExpressions());}
test('node-coordinate caching agrees with the original dependency rules including bound integrals and function calls',()=>{
  const b=base(),x=b.fresh('x'),y=b.fresh('y'),t=b.fresh('bound_t'),z=b.fresh('z'),
    body=b.mul(b.sine(x),b.exp(b.mul(y,t))),integral=b.integral(body,t,b.zero,z),
    system=b.defineExpressionFunction({name:'dependency_body',parameters:[x,y],body:b.add(b.pow(x,2),b.sine(y)),derivativeLimits:[3,3]}),
    shared=b.expressionValue(system,[b.mul(x,z),y],[1,1]),roots=[x,y,t,z,body,integral,shared,b.pow(shared,2)],
    old=new ActualPulseThirdJetExpressions(b),G=new ActualCommonPhysicalJetExpressions(b);
  for(const root of roots)for(const variable of [x,y,t,z])assert.equal(G.dependsOn(root,variable),old.dependsOn(root,variable));
  assert.equal(G.dependsOn(integral,t),false);assert.equal(G.dependsOn(integral,z),true);
  assert.equal(G.dependencyCache?.size??0,0);
  assert.equal(G.dependsOn(body,body),old.dependsOn(body,body));
  assert.equal(G.dependsOn(G.pow(body,2),body),true);
});
test('an increasing number of unrelated coordinates does not allocate a cross-product dependency cache',()=>{
  const G=new ActualCommonPhysicalJetExpressions(base()),x=G.fresh('retained_x');let body=x;
  for(let n=1;n<=128;n++)body=G.add(G.sine(body),G.q(n));
  const unrelated=Array.from({length:256},(_,n)=>G.fresh('unrelated_'+n));
  for(const v of unrelated){assert.equal(G.dependsOn(body,v),false);assert.equal(G.derivative(body,v),G.zero);}
  assert.equal(G.dependsOn(body,x),true);assert.equal(G.dependencyCache?.size??0,0);
  assert.ok(G.freeCoordinateCache.size<=G.nodes.length);
});
test('original Volterra and all third-variation dependencies and nonzero slow derivatives are retained',()=>{
  const G=new ActualCommonPhysicalJetExpressions(base(),{compactFTC:true}),R=G.fresh('R'),Z=G.fresh('Z'),T=G.fresh('T'),v=G.fresh('v'),
    matrix=[[R,G.mul(Z,v)],[G.zero,T]],parameters=[R,Z,T],initial=[G.one,G.zero],length=G.one,
    original=G.defineCovarianceVolterra({name:'original_polynomial_ode',variable:v,parameters,matrix,normUpper:G.q(10),length}),
    variation=G.definePulseThirdVariation({name:'original_polynomial_jet',variable:v,parameters,directions:parameters,matrix,initial,left:G.zero,length});
  G.bindOriginalCovarianceThirdJet(original,variation);
  const value=G.covarianceValue(original,0,v,parameters),dR=G.derivative(value,R);
  assert.notEqual(dR,G.zero);assert.equal(G.nodes[dR].op,'actual_pulse_third_jet_volterra');
  for(const variable of [R,Z,T,v])assert.equal(G.dependsOn(value,variable),true);
  assert.equal(G.pulseThirdJetSystems[variation].dimension,40);
  assert.equal(G.derivative(G.pulseThirdJetValue(variation,2,G.zero,parameters),R),G.zero);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(G.derivative(value,v),G.covarianceRhs(original,0,v,parameters))).pass,true);
});
test('coordinate substitution retains bound-variable capture avoidance and moving endpoint substitution',()=>{
  for(const Constructor of [ActualPulseThirdJetExpressions,ActualCommonPhysicalJetExpressions]){
    const G=new Constructor(base()),x=G.fresh('caller_x'),t=G.fresh('bound_t'),z=G.fresh('upper_z'),
      f=G.integral(G.exp(G.mul(x,t)),t,G.zero,z),at=G.substitute(f,x,t),n=G.nodes[at];
    assert.equal(n.op,'definite_integral');assert.notEqual(n.args[1],t);
    assert.deepEqual([...G.freeCoordinates(at)].sort((a,b)=>a-b),[t,z].sort((a,b)=>a-b));
    assert.equal(n.args[0],G.exp(G.mul(t,n.args[1])));
    const moved=G.substitute(f,z,x);assert.equal(G.nodes[moved].args[3],x);
    assert.equal(G.substitute(f,t,G.q(9)),f);
    const algebra=G.mul(G.add(x,G.one),G.add(t,z));
    assert.equal(sourceGraphRationalIdentity(G,G.sub(G.substitute(algebra,x,z),G.mul(G.add(z,G.one),G.add(t,z)))).pass,true);
  }
});
test('unrelated FTC coordinates do not create a Cartesian-product substitution cache',()=>{
  const G=new ActualCommonPhysicalJetExpressions(base()),x=G.fresh('retained_x');let body=x;
  for(let n=1;n<=128;n++)body=G.mul(G.add(G.sine(body),G.q(n)),G.add(x,G.q(n+1)));
  const before=G.substitutions.size;
  for(let i=0;i<256;i++){const v=G.fresh('unrelated_bound_'+i);assert.equal(G.substitute(body,v,G.one),body);}
  assert.equal(G.substitutions.size,before);
  assert.notEqual(G.substitute(body,x,G.q(2)),body);
});
test('a signed slow target can retain the frozen representative and never gains an M_alpha certificate',()=>{
  const G=new ActualCommonPhysicalJetExpressions(base()),coordinates=Object.fromEntries(['R','Z','T','Xrep','etaRep','sRep'].map(n=>[n,G.fresh(n)])),
    target=[G.mul(coordinates.R,coordinates.Xrep),G.sub(coordinates.T,coordinates.etaRep)],p=assertSlowSignedTargetCoordinates(G,target,coordinates);
  assert.equal(p.pass,true);assert.equal(p.frozenRepresentativeAllowed,true);
  assert.equal(p.targetRegularityClassVerified,false);assert.equal(p.sourceAuthenticated,false);
});
test('all auxiliary, angle, mesh-template and unknown target coordinates are rejected',()=>{
  const G=new ActualCommonPhysicalJetExpressions(base()),coordinates=Object.fromEntries(['R','Z','T','Xrep','etaRep','sRep'].map(n=>[n,G.fresh(n)]));
  for(const name of ['theta','xi','v','Y1','Y2','meshTemplate','unknown']){
    const forbidden=G.fresh(name);assert.throws(()=>assertSlowSignedTargetCoordinates(G,[G.add(coordinates.R,forbidden),G.one],coordinates),{code:'INVALID_INPUT'});
  }
  assert.throws(()=>assertSlowSignedTargetCoordinates(G,[G.one,G.zero],{...coordinates,Xrep:G.one}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
