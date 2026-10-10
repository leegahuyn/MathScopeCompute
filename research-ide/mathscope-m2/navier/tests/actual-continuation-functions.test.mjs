import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphPolynomialIdentity,sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {evaluateSourceProgramDiagnostic} from '../actual-global-source-expressions.mjs';

// Manufactured elementary functions verify the expression machinery only.
// They are never used as a replacement for the actual N3 functions.
const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),x=G.fresh('test_x'),e=G.fresh('test_eta');
const identity=body=>assert.equal(sourceGraphRationalIdentity(G,body).pass,true);
function expand(id,seen=new Map()){
  if(seen.has(id))return seen.get(id);const {op,args}=G.nodes[id];let value=id;
  if(op==='actual_expression_partial')value=expand(G.materializeExpressionFunction(args[0],args[1],args[2]),seen);
  else if(op==='add')value=G.add(expand(args[0],seen),expand(args[1],seen));
  else if(op==='multiply')value=G.mul(expand(args[0],seen),expand(args[1],seen));
  else if(op==='integer_power')value=G.pow(expand(args[0],seen),args[1]);
  else if(op==='inverse')value=G.inv(expand(args[0],seen));
  seen.set(id,value);return value;
}

test('shared mixed jets materialize the retained body and preserve nonlinear argument chain rules',()=>{
  const body=G.add(G.mul(G.pow(x,3),G.pow(e,2)),G.mul(q(2),x,e));
  const system=G.defineExpressionFunction({name:'manufactured_polynomial',parameters:[x,e],body,derivativeLimits:[3,3]});
  const args=[G.pow(e,2),G.add(e,q(1))],call=G.expressionValue(system,args);
  const explicit=G.add(G.mul(G.pow(e,6),G.pow(G.add(e,q(1)),2)),G.mul(q(2),G.pow(e,2),G.add(e,q(1))));
  identity(G.sub(expand(call),explicit));
  identity(G.sub(expand(G.derivative(call,e)),G.derivative(explicit,e)));
  identity(G.sub(expand(G.derivative(G.derivative(call,e),e)),G.derivative(G.derivative(explicit,e),e)));
  const mixed=G.materializeExpressionFunction(system,[x,e],[2,1]);
  identity(G.sub(mixed,G.mul(q(12),x,e)));
  assert.equal(G.expressionSystems[system].body,body);
  assert.equal(G.expressionSystems[system].unspecifiedOracle,false);
});

test('a moving-endpoint integral keeps both endpoint velocities and mixed parameter derivatives',()=>{
  const t=G.fresh('test_integral'),a=e,b=G.add(x,e),body=G.add(G.pow(t,2),G.mul(e,t));
  const integral=G.integral(body,t,a,b);
  const closed=G.add(G.mul(q(1,3),G.sub(G.pow(b,3),G.pow(a,3))),G.mul(q(1,2),e,G.sub(G.pow(b,2),G.pow(a,2))));
  const f=G.defineExpressionFunction({name:'manufactured_moving_integral',parameters:[x,e],body:integral,derivativeLimits:[3,3]});
  for(const [i,j]of [[0,0],[1,0],[0,1],[1,1],[0,2]]){
    let expected=closed;for(let k=0;k<i;k++)expected=G.derivative(expected,x);for(let k=0;k<j;k++)expected=G.derivative(expected,e);
    identity(G.sub(G.materializeExpressionFunction(f,[x,e],[i,j]),expected));
  }
  const raw=G.node('definite_integral',[body,t,a,b]);
  identity(G.sub(G.derivative(raw,e),G.derivative(closed,e)));
  const interiorOnly=G.integral(G.derivative(body,e),t,a,b);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(G.derivative(raw,e),interiorOnly)).pass,false);
});

test('substitution alpha-renames an integral when an argument uses its bound coordinate',()=>{
  const t=G.fresh('test_bound'),body=G.exp(G.mul(t,e)),integral=G.integral(body,t,G.zero,G.one);
  const call=G.substitute(integral,e,t),node=G.nodes[call];
  assert.equal(node.op,'definite_integral');assert.notEqual(node.args[1],t);
  assert.equal(G.dependsOn(call,t),true);
  assert.deepEqual([...G.freeCoordinates(call)],[t]);
  const program=G.pack({correct:call,incorrect:G.integral(G.exp(G.pow(t,2)),t,G.zero,G.one)}),coordinates={[G.nodes[t].args[0]]:2};
  const correct=evaluateSourceProgramDiagnostic(program,'correct',{coordinates,quadratureCells:128}),wrong=evaluateSourceProgramDiagnostic(program,'incorrect',{coordinates,quadratureCells:128});
  assert.ok(Math.abs(correct.value-(Math.exp(2)-1)/2)<2e-9);
  assert.ok(Math.abs(wrong.value-correct.value)>.1);
  assert.equal(correct.intervalCertified,false);assert.equal(correct.sameProfileCertificate,false);
});

test('simultaneous argument replacement does not sequentially capture another parameter',()=>{
  const body=G.add(x,G.mul(q(2),e));
  const system=G.defineExpressionFunction({name:'manufactured_swap',parameters:[x,e],body,derivativeLimits:[2,2]});
  identity(G.sub(G.materializeExpressionFunction(system,[e,x]),G.add(e,G.mul(q(2),x))));
});

test('missing body parameters and derivatives beyond the declared finite kernel fail explicitly',()=>{
  assert.throws(()=>G.defineExpressionFunction({name:'missing_eta',parameters:[x],body:G.add(x,e),derivativeLimits:[2]}),{code:'INVALID_INPUT'});
  assert.throws(()=>G.defineExpressionFunction({name:'missing_body',parameters:[x],body:-1,derivativeLimits:[2]}),{code:'INVALID_INPUT'});
  const system=G.defineExpressionFunction({name:'limited',parameters:[x],body:G.pow(x,3),derivativeLimits:[1]});
  assert.throws(()=>G.expressionValue(system,[x],[2]),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>G.derivative(G.expressionValue(system,[x],[1]),x),{code:'RESOURCE_LIMIT'});
});

test('function definition snapshots permit append-only operations and reject old body mutation',()=>{
  const system=G.defineExpressionFunction({name:'snapshot_body',parameters:[x],body:G.pow(x,2),derivativeLimits:[2]}),snapshot=G.captureFunctionDefinitions();
  G.defineExpressionFunction({name:'appended',parameters:[e],body:G.pow(e,2),derivativeLimits:[2]});
  assert.equal(G.functionDefinitionsUnchanged(snapshot),true);
  const old=G.expressionSystems[system].body;G.expressionSystems[system].body=G.zero;
  assert.equal(G.functionDefinitionsUnchanged(snapshot),false);G.expressionSystems[system].body=old;
  assert.equal(G.functionDefinitionsUnchanged(snapshot),true);
});

test('rational identity verifier rejects zero denominators, including a forged negative-power node',()=>{
  const badPower=G.node('integer_power',[G.zero,-1]),badInverse=G.node('inverse',[G.zero]);
  for(const bad of [badPower,badInverse]){
    assert.throws(()=>sourceGraphRationalIdentity(G,bad),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>sourceGraphRationalIdentity(G,bad,{atomicNodes:[G.zero]}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>sourceGraphPolynomialIdentity(G,bad),{code:'INVALID_SOURCE_CONSTRUCTION'});
    const apparentZero=G.node('add',[bad,G.node('multiply',[q(-1),bad])]);
    assert.throws(()=>sourceGraphRationalIdentity(G,apparentZero),{code:'INVALID_SOURCE_CONSTRUCTION'});
  }
  const denominator=G.add(x,e),expression=G.sub(G.div(G.mul(denominator,x),denominator),x),proof=sourceGraphRationalIdentity(G,expression);
  assert.equal(proof.pass,true);assert.ok(proof.denominatorMonomials>0);
  assert.equal(proof.nonzeroDenominatorProofRequired,true);assert.ok(proof.denominatorOperands.includes(denominator));
});

test('the first even-X axis jet follows the singular ODE coefficient recurrence, including eta jets',()=>{
  const xi=G.fresh('manufactured_picard_xi'),eta=G.core.eta,z=G.zero;
  const A0=Array.from({length:6},()=>Array(6).fill(z)),A1=Array.from({length:6},()=>Array(6).fill(z));
  A0[0][4]=G.one;A0[1][5]=G.one;A0[2][5]=q(-1);
  const a=G.add(G.one,G.pow(eta,2)),b=G.add(q(3),G.mul(q(2),eta)),c=G.pow(eta,3);
  const system=G.definePicardSystem({name:'manufactured_exact_even_solution',xi,eta,diagonal:[0,0,2,0,3,1],A0,A1,forcing:[z,z,z,G.mul(q(2),xi,c),G.mul(q(8),a),G.mul(q(4),b)]});
  const expected=[a,b,G.mul(q(-1,2),b),c];
  for(let component=0;component<4;component++)for(let m=0;m<=2;m++){
    let value=expected[component];for(let j=0;j<m;j++)value=G.derivative(value,eta);
    identity(G.sub(G.picardEven(system,component,z,eta,1,m),value));
  }
});
