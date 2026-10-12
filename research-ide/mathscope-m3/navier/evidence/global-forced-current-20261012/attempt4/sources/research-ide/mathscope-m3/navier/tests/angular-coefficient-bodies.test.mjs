import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {GlobalSourceExpressions} from '../source-global-expressions.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {SourceCoupledExpressions} from '../source-coupled-expressions.mjs';
import {exactOriginalAngularLift} from '../source-initialized-angular.mjs';
import {exactHarmonicComplexAlgebra,exactAngularResidualUpdate} from '../source-harmonic-assembly.mjs';
import {verifyCompleteAngularResidualUpdate} from '../source-angular-update-verification.mjs';
import {retainExactAngularUpdateBodies,assertExactAngularUpdateBodies,exactRetainedBodyAngularUpdate,verifyExactAngularStateEquality} from '../source-angular-coefficient-bodies.mjs';

function fixture(){
  const base=new GlobalSourceExpressions(new ActualConvergentExpressions(),{maxNodes:500000,maximumSlowOrder:16}),
    G=new SourceCoupledExpressions(new AuxiliarySourceExpressions(base,{maximumOrder:16})),
    [R,Z,T,theta,y0,y1,c0,c1,d0,d1]=['R','Z','T','theta','y0','y1','c0','c1','d0','d1'].map(x=>G.fresh(x)),
    radical=G.sqrt(G.q(2)),lift=exactOriginalAngularLift(G,{R,Z,T,theta,Y:[y0,y1],center:[c0,c1],copy:[d0,d1],levelDifference:4,
      vr:[G.one,G.sub(G.one,radical)],vt:[G.sub(radical,G.one),G.one],Dgeom:G.sub(G.q(4),G.mul(G.q(2),radical)),
      Lambda:G.sub(G.q(4),radical),Tg:G.add(G.q(4),radical),ci:G.q(3,2),r0:G.q(1,10),epsilon:G.q(2,5),radialFast:G.add(G.one,R)}),
    C=exactHarmonicComplexAlgebra(G),n=[G.add(R,y0),G.add(Z,y1),G.add(T,G.mul(R,Z))],
    normalSquare=G.add(G.one,...n.map(x=>G.pow(x,2))),
    f=[G.div(G.add(G.mul(R,Z),y0),normalSquare),G.div(G.mul(T,y1),G.add(G.one,G.pow(G.add(R,y0),2))),
      G.div(G.add(G.pow(Z,2),G.mul(R,T,y0)),G.add(G.q(2),G.pow(G.add(T,y1),2)))],
    positive=m=>({m,velocity:n.map((x,j)=>C.value(G.div(G.mul(G.q(m),G.exp(f[j]),G.add(x,G.mul(T,y0))),normalSquare),
      G.div(G.add(G.mul(G.q(m),x,y1),G.sine(f[(j+1)%3])),G.pow(normalSquare,2)))),
      pressure:C.value(G.div(G.add(...n.map((x,j)=>G.mul(x,f[j]))),normalSquare),G.div(G.mul(R,Z,T),G.pow(normalSquare,2)))}),
    one=positive(1),two=positive(2),negative=r=>({m:-r.m,velocity:r.velocity.map(C.conjugate),pressure:C.conjugate(r.pressure)}),
    previous=[{m:0,velocity:[C.value(G.mul(R,G.exp(Z))),C.value(G.add(T,G.sine(y0))),C.value(G.mul(Z,y1))],
      pressure:C.value(G.exp(G.add(R,Z,y0)))},one,negative(one)],
    increment=[positive(1),negative(positive(1)),two,negative(two),
      {m:0,velocity:[C.zero,C.zero,C.zero],pressure:C.value(G.div(G.mul(R,Z,T,y0,y1),normalSquare))}],
    input={geometry:lift.geometry,phase:G.add(theta,G.mul(R,lift.xi),G.mul(T,lift.v),Z),k:G.q(2),previous,increment,
      oldFlatResidual:[{m:0,value:[C.value(G.exp(R)),C.value(G.exp(Z)),C.value(G.exp(T))]}]};
  return {G,C,R,Z,T,y0,y1,input,normalSquare};
}

test('every old and new whole coefficient, normal pressure and old flat root is bound before either physical PDE path',()=>{
  const {G,input}=fixture(),s=retainExactAngularUpdateBodies(G,input);
  assert.equal(assertExactAngularUpdateBodies(G,s),true);
  assert.equal(s.bindings.length,8*(input.previous.length+input.increment.length)+6);
  assert.deepEqual(s.retained.increment.map(r=>r.m),input.increment.map(r=>r.m));
  assert.equal(s.scope.sourceAuthenticated,false);assert.equal(s.scope.numericalValuesSubstituted,false);
  for(const b of s.bindings){
    assert.deepEqual(b.parameters,[...G.freeCoordinates(b.body)].sort((a,b)=>a-b));
    if(b.literalZero){assert.equal(b.root,G.zero);continue;}
    assert.equal(G.expressionSystem(b.system).body,b.body);
    assert.equal(G.materializeExpressionFunction(b.system,b.parameters),b.body);
    for(let j=0;j<b.parameters.length;j++){
      const orders=b.parameters.map((_,i)=>i===j?1:0),actual=G.materializeExpressionFunction(b.system,b.parameters,orders);
      assert.equal(actual,G.derivative(b.body,b.parameters[j]));
    }
  }
  assert.ok(s.bindings.some(b=>b.component==='pressure'&&b.role==='increment'&&b.m===0&&!b.literalZero));
});

test('the full source-shaped update is a bounded exact polynomial in its actual function jets, including all modes through four',t=>{
  const {G,input}=fixture(),result=exactRetainedBodyAngularUpdate(G,input,{maxProducts:3000000});
  assert.equal(result.pass,true);assert.deepEqual(result.verification.modes,[-4,-3,-2,-1,0,1,2,3,4]);
  assert.equal(result.verification.checks.length,54);
  assert.ok(result.verification.checks.every(x=>x.pass&&x.declaredDefectMatches&&x.numeratorMonomials===0));
  assert.equal(result.verification.sameCompleteCoefficientFunctionsInBothPDEPaths,true);
  assert.equal(result.verification.originalGraphCompositeAtomEquationsAdded,false);
  assert.equal(result.verification.fullMixedDerivativeMaterializationStillRequired,true);
  assert.equal(result.verification.algebraicErrorIfPassing,'0');
  assert.deepEqual(result.update.discardedModes,[]);
  t.diagnostic('Exact retained-body products: '+Math.max(...result.verification.checks.map(x=>x.productsUsed))+' / 3000000.');
});

test('unchanged proof limits reject raw nested-denominator expansion while the complete named-body operator identity passes',()=>{
  const {G,input}=fixture(),limit=300000,raw=exactAngularResidualUpdate(G,input);
  assert.throws(()=>verifyCompleteAngularResidualUpdate(G,raw,{maxProducts:limit}),{code:'RESOURCE_LIMIT'});
  const result=exactRetainedBodyAngularUpdate(G,input,{maxProducts:limit});
  assert.equal(result.pass,true);assert.ok(result.verification.checks.every(c=>c.productsUsed<=limit));
  assert.equal(result.operands.scope.compositeRootsDeclaredIndependentInOriginalGraph,false);
});

test('an omitted pressure gradient, quadratic mode or complex component cannot inherit the complete update proof',()=>{
  const {G,C,input}=fixture(),s=exactRetainedBodyAngularUpdate(G,input),zeroPressure=s.operands.retained.increment.map(r=>({...r,pressure:C.zero})),
    missingPressure=exactAngularResidualUpdate(G,{...s.operands.retained,increment:zeroPressure}),
    q=new Map(s.update.newQuadraticRemainder.map(r=>[r.m,r.value])),
    missingQuadratic={...s.update,decomposed:s.update.decomposed.map(r=>({m:r.m,value:r.value.map((z,j)=>C.sub(z,q.get(r.m)?.[j]??C.zero))}))};
  assert.equal(verifyCompleteAngularResidualUpdate(G,{...s.update,direct:missingPressure.direct}).pass,false);
  const v=verifyCompleteAngularResidualUpdate(G,missingQuadratic);
  assert.equal(v.pass,false);assert.ok(v.checks.some(x=>Math.abs(x.m)===4&&!x.pass));
  assert.throws(()=>verifyCompleteAngularResidualUpdate(G,{...s.update,direct:s.update.direct.filter(r=>r.m!==4)}),{code:'INVALID_INPUT'});
  const broken=structuredClone(s.update);delete broken.direct[0].value[0].imaginary;
  assert.throws(()=>verifyCompleteAngularResidualUpdate(G,broken),{code:'INVALID_INPUT'});
});

test('mutated whole source roots, incomplete argument tuples, substituted zero pressure and cloned seals are rejected',()=>{
  const {G,input}=fixture(),s=retainExactAngularUpdateBodies(G,input),b=s.bindings.find(x=>x.component==='pressure'&&!x.literalZero);
  assert.throws(()=>assertExactAngularUpdateBodies(G,{...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,key,value]of [[b,'body',G.zero],[b,'parameters',b.parameters.slice(1)],
    [s.original.increment[0].pressure,'real',G.zero],[s.retained.increment[0].pressure,'imaginary',G.zero]]){
    const old=object[key];object[key]=value;
    try{assert.throws(()=>assertExactAngularUpdateBodies(G,s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[key]=old;}
  }
  const oldNode=G.nodes[b.root];G.nodes[b.root]={...oldNode,args:[oldNode.args[0],oldNode.args[1].slice(1),oldNode.args[2]]};
  try{assert.throws(()=>assertExactAngularUpdateBodies(G,s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{G.nodes[b.root]=oldNode;}
  assert.equal(assertExactAngularUpdateBodies(G,s),true);
});

test('the refreshed pressure identity is executed even when the source graph keeps old plus new-minus-old as distinct roots',()=>{
  const {G,C,input,R,Z}=fixture(),old=input.previous[0].pressure.real,next=G.exp(G.add(R,Z,G.one)),
    sum=G.add(old,G.sub(next,old)),left=[{m:0,velocity:input.previous[0].velocity,pressure:C.value(sum)}],
    right=[{m:0,velocity:input.previous[0].velocity,pressure:C.value(next)}];
  assert.notEqual(sum,next);
  const result=verifyExactAngularStateEquality(G,left,right,{retainedScalarBodies:[old,next]});
  assert.equal(result.pass,true);assert.equal(result.sourceBodyRelationsAssumed,false);
  const wrong=[{...right[0],pressure:C.value(G.add(next,G.one))}];
  assert.equal(verifyExactAngularStateEquality(G,left,wrong,{retainedScalarBodies:[old,next]}).pass,false);
  assert.throws(()=>verifyExactAngularStateEquality(G,left,[{...right[0],m:1}],{retainedScalarBodies:[old,next]}),{code:'INVALID_INPUT'});
});
