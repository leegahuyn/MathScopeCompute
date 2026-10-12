import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {SourceCoupledExpressions,assertSourceCoupledExpressions,coupledForcedAngularInverse} from '../source-coupled-expressions.mjs';
import {ForcedPulseExpressions} from '../source-forced-pulse.mjs';
const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:120000}).pass;

function setup(){
  const base=new ActualConvergentExpressions(),[x,y,v]=['x','y','v'].map(n=>base.fresh(n)),A=new AuxiliarySourceExpressions(base,{maximumOrder:16}),
    original=A.share(A.mul(x,y),[x,y],'OriginalAuxiliaryBody'),
    G=new SourceCoupledExpressions(A),F=G.forcedGraph;
  return {base,A,G,F,x,y,v,original};
}
function inverse(f,m=1){
  const {G,x,y,v}=f;
  return coupledForcedAngularInverse(G,{variable:v,parameters:[x,y],directions:[x,y],length:G.one,n:[G.one,G.zero,G.zero],
    K:Array.from({length:3},()=>[G.zero,G.zero,G.zero]),k:G.one,epsilon:G.one,m,
    forcing:[{real:G.zero,imaginary:G.zero},{real:G.add(x,G.mul(v,y)),imaginary:G.zero},{real:G.zero,imaginary:x}]});
}

test('the joint namespace retains the original owner and exactly one reusable forced owner across stages',()=>{
  const f=setup(),{G,A,F,original,x,y}=f,source=G.captureFunctionDefinitions(),old=A.captureFunctionDefinitions(),
    shared=G.share(G.add(original,G.pow(x,2)),[x,y],'NewMixedBody'),one=inverse(f),two=inverse(f,2);
  assert.equal(assertSourceCoupledExpressions(G,A),true);assert.equal(new SourceCoupledExpressions(A),G);
  assert.equal(new ForcedPulseExpressions(G),F);assert.equal(one.inverse.G,F);assert.equal(two.inverse.G,F);
  assert.notEqual(one.inverse.system,two.inverse.system);assert.equal(G.nodes[original].op,'m3_aux_expression_partial');
  assert.equal(G.nodes[shared].op,'m3_coupled_expression_partial');assert.ok(G.nodes[shared].args[0].startsWith('coupled-expression:'));
  assert.equal(A.functionDefinitionsUnchanged(old),true);assert.equal(G.functionDefinitionsUnchanged(source),true);
  const corrupt=structuredClone(source);corrupt.definitions='[]';assert.equal(G.functionDefinitionsUnchanged(corrupt),false);
  assert.equal(one.sourceAuthenticated,false);assert.equal(one.everyOriginalSourceBodyRetained,true);
});

test('a new indexed field differentiates full forced bodies before applying both chart columns',()=>{
  const f=setup(),{G,x,y,v}=f,t=inverse(f).inverse.velocity[1].real,
    body=G.mul(x,t),local=G.defineExpressionFunction({name:'ForcedTimesSlowCutoff',parameters:[x,y,v],body}),
    row={localSystem:local,values:[G.add(x,y),G.sub(x,y),v],coefficient:G.q(3),
      derivativeMaps:[[{parameter:0,coefficient:G.one},{parameter:1,coefficient:G.one}],
        [{parameter:0,coefficient:G.one},{parameter:1,coefficient:G.q(-1)}]],label:{fixture:'both-columns'},guards:[]},
    field=G.definePeriodicIndexedField({name:'FullMixedField',parameters:[x,y,v],directions:[x,y],rows:[row]}),
    root=G.periodicIndexedValue(field,[x,y,v]),program=G.commonTorusDerivativeProgram(field,[1,1]);
  assert.equal(program.terms.length,1);assert.equal(program.allDeclaredRowsRetained,true);assert.ok(program.localBodies.length>=2);
  assert.ok(program.localBodies.every(r=>r.actualBodyDifferentiatedBeforeMapping));
  const derivative=G.derivative(G.derivative(root,x),y);
  assert.deepEqual(G.nodes[derivative].args[2],[1,1]);
  const expanded=G.materializePeriodicIndexedField(field,[1,1]);
  let direct=G.simultaneousSubstitute(body,[x,y,v],row.values);direct=G.mul(row.coefficient,G.derivative(G.derivative(direct,x),y));
  const materialized=expanded.terms[0].derivatives.map(d=>G.mul(d.coefficient,
    G.materializeExpressionFunction(local,row.values,d.orders))),assembled=G.mul(row.coefficient,G.add(...materialized));
  assert.equal(equal(G,assembled,direct),true);
  assert.equal(program.labelsDifferentiated,false);assert.equal(program.torusNearestCopyDifferentiated,false);
});

test('direction-dependent outer factors and maps are rejected while their body Leibniz terms remain available',()=>{
  const {G,x,y}=setup(),local=G.defineExpressionFunction({parameters:[x,y],body:G.mul(x,y)}),
    row={localSystem:local,values:[x,y],coefficient:G.one,derivativeMaps:[[{parameter:0,coefficient:G.one}],[{parameter:1,coefficient:G.one}]]},
    input={parameters:[x,y],directions:[x,y],rows:[row]};
  assert.throws(()=>G.definePeriodicIndexedField({...input,rows:[{...row,coefficient:x}]}),{code:'INVALID_INPUT'});
  assert.throws(()=>G.definePeriodicIndexedField({...input,rows:[{...row,derivativeMaps:[[{parameter:0,coefficient:y}],row.derivativeMaps[1]]}]}),{code:'INVALID_INPUT'});
  const slow=G.share(G.mul(G.pow(x,2),G.mul(x,y)),[x,y],'VaryingSlowFactorInsideBody'),d=G.derivative(slow,x),
    value=G.materializeExpressionFunction(...G.nodes[d].args);
  assert.equal(equal(G,value,G.mul(G.q(3),G.pow(x,2),y)),true);
});

test('mixed pressure integrals retain both moving endpoint terms and capture-free substitutions',()=>{
  const f=setup(),{G,x,y,v}=f,t=inverse(f).inverse.velocity[1].real,
    body=G.add(t,G.mul(x,y)),left=G.mul(G.q(2),y),right=G.add(G.pow(y,2),G.one),integral=G.integral(body,x,left,right),
    d=G.derivative(integral,y),interior=G.integral(G.derivative(body,y),x,left,right),
    upper=G.mul(G.substitute(body,x,right),G.mul(G.q(2),y)),lower=G.mul(G.substitute(body,x,left),G.q(2));
  assert.equal(equal(G,d,G.add(interior,upper,G.neg(lower))),true);
  assert.equal(equal(G,d,interior),false);
  const swapped=G.substitute(G.integral(G.mul(t,y),x,G.zero,G.one),y,x),free=G.freeCoordinates(swapped);
  assert.ok(free.has(x));assert.ok(free.has(v));
  const n=G.nodes[swapped];assert.equal(n.op,'definite_integral');assert.notEqual(n.args[1],x);
});

test('old auxiliary applications with new forced arguments use the joint full chain rule',()=>{
  const f=setup(),{G,A,x,y,original}=f,t=inverse(f).inverse.velocity[1].real,
    oldId=G.nodes[original].args[0],applied=G.expressionValue(oldId,[t,y]),d=G.derivative(applied,x),
    oldDerivative=A.expressionValue(oldId,[t,y],[1,0]),expected=G.mul(oldDerivative,G.derivative(t,x));
  assert.equal(equal(G,d,expected),true);
  const shared=G.share(applied,[x,y,f.v],'OpaqueMixedApplication'),derivative=G.forcedGraph.derivative(shared,x);
  assert.equal(G.nodes[derivative].op,'m3_coupled_expression_partial');
  const actual=G.materializeExpressionFunction(...G.nodes[derivative].args);assert.equal(equal(G,actual,d),true);
});

test('new exact Fourier inverse nodes keep their namespace, complete parameters and nonzero derivative orders',()=>{
  const f=setup(),{G,A,x,y,v}=f,t=inverse(f).inverse.velocity[1].real,
    old=A.defineAuxiliaryInverse({name:'Old',body:G.mul(x,y),Y:[x,y],parameters:[x,y],directions:[x,y]}),
    current=G.defineAuxiliaryInverse({name:'AfterForced',body:t,Y:[x,y],parameters:[x,y,v],directions:[x,y,v]}),
    value=G.auxiliaryInverseValue(current,[x,y,v]),d=G.derivative(G.derivative(value,v),x);
  assert.equal(typeof old,'number');assert.ok(current.startsWith('coupled-inverse:'));
  assert.equal(G.nodes[A.auxiliaryInverseValue(old,[x,y])].op,'m3_aux_inverse_partial');
  assert.equal(G.nodes[value].op,'m3_coupled_inverse_partial');assert.deepEqual(G.nodes[d].args[2],[1,0,1]);
  assert.equal(G.auxiliaryInverseSystem(current).body,t);assert.equal(G.auxiliaryInverseSystem(current).finiteSumDeclaredEqualToLimit,false);
  assert.throws(()=>G.auxiliaryInverseValue(current,[x,y,v],[17,0,0]),{code:'RESOURCE_LIMIT'});
});

test('a forward-reference or self-referential custom body cannot acquire a private defining record',()=>{
  const {G,x,y}=setup(),forged=G.node('m3_coupled_expression_partial',['coupled-expression:0',[x,y],[0,0]]);
  assert.throws(()=>G.defineExpressionFunction({parameters:[x,y],body:forged}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const fakePulse=G.node('m3_forced_pulse_partial',[100,'real',0,x,[y],[0]]);
  assert.throws(()=>G.defineExpressionFunction({parameters:[x,y],body:fakePulse}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
