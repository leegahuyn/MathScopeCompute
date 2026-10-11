import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualInductionExpressions} from '../actual-residual-order-induction-expressions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {exactSlowChartOperators,exactSlowChartIdentityAudit,exactSlowProfileExpansion,materializeSlowProfileExpansion,slowMultiIndices} from '../actual-all-band-background-norm-kernel.mjs';

function fixture(){const G=new ActualInductionExpressions(new ActualConvergentExpressions()),s=G.fresh('norm_s'),X=G.fresh('norm_X'),eta=G.fresh('norm_eta'),h=G.q(1,128);return {G,s,X,eta,h};}

test('the original slow chart is an exact inverse and all coefficient commutators vanish',()=>{
  const {G,...c}=fixture(),p=exactSlowChartIdentityAudit(G,c);
  assert.equal(p.pass,true,JSON.stringify({rows:p.rows.filter(r=>!r.check.pass),commutators:p.commutators.filter(r=>!r.check.pass)}));
  assert.equal(p.rows.length,9);assert.equal(p.commutators.length,9);assert.equal(p.sourceAuthenticated,false);
});

test('every mixed slow derivative through two equals the independent polynomial body differentiation',()=>{
  const {G,...c}=fixture(),{s,X,eta}=c,chart=exactSlowChartOperators(G,c),
    profile=G.add(G.pow(s,2),G.mul(s,X,eta),G.pow(X,3),G.pow(eta,4)),multiplier=G.div(G.one,G.mul(s,X)),
    expansion=exactSlowProfileExpansion(G,{...c,multiplier,order:2,maxJetRequests:50000}),
    actual=materializeSlowProfileExpansion(G,expansion,{profileRoot:profile,s,X,eta});
  assert.equal(actual.length,10);
  for(const row of actual){let direct=G.mul(multiplier,profile);
    for(let axis=0;axis<3;axis++)for(let j=0;j<row.slowOrders[axis];j++)direct=chart.derivative(direct,axis);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(direct,row.value),{atomicNodes:[chart.sD,chart.R],maxTerms:20000}).pass,true,row.slowOrders.join(','));
  }
});

test('a retained actual shared profile body is differentiated and its Euler variable is not frozen',()=>{
  const {G,...c}=fixture(),{s,X,eta}=c,body=G.add(G.pow(s,2),G.mul(s,X,eta)),system=G.defineExpressionFunction({name:'ActualNormFixture',parameters:[s,X,eta],body}),
    profile=G.expressionValue(system,[s,X,eta]),multiplier=G.one,expansion=exactSlowProfileExpansion(G,{...c,multiplier,order:1}),
    rows=materializeSlowProfileExpansion(G,expansion,{profileRoot:profile,s,X,eta});
  assert.equal(G.expressionSystems[system].body,body);assert.equal(rows.length,4);
  const euler=G.mul(s,G.derivative(profile,s));assert.notEqual(euler,G.zero);
  const jet=G.derivative(profile,s),node=G.nodes[jet];assert.equal(node.op,'actual_expression_partial');
  assert.equal(G.materializeExpressionFunction(...node.args),G.derivative(body,s));
});

test('missing multiplier and coefficient derivatives are rejected by exact independent identities',()=>{
  const {G,...c}=fixture(),{s,X}=c,chart=exactSlowChartOperators(G,c),profile=X,multiplier=G.inv(s),
    expansion=exactSlowProfileExpansion(G,{...c,multiplier,order:2}),rows=materializeSlowProfileExpansion(G,expansion,{profileRoot:profile,...c}),
    rr=rows.find(r=>r.slowOrders[0]===2),correct=chart.derivative(chart.derivative(G.mul(multiplier,profile),0),0),
    wrongFrozenCoefficient=G.zero,wrongNoMultiplier=chart.derivative(chart.derivative(profile,0),0);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(correct,rr.value),{atomicNodes:[chart.R,chart.sD]}).pass,true);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(correct,wrongFrozenCoefficient),{atomicNodes:[chart.R,chart.sD]}).pass,false);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(correct,wrongNoMultiplier),{atomicNodes:[chart.R,chart.sD]}).pass,false);
});

test('the derivative order has no mathematical cap and explicit finite work limits cannot omit jets',()=>{
  const {G,...c}=fixture();assert.equal(slowMultiIndices(20).length,1771);
  assert.throws(()=>exactSlowProfileExpansion(G,{...c,multiplier:G.one,order:20,maxJetRequests:20}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>slowMultiIndices(-1),{code:'INVALID_INPUT'});
  assert.throws(()=>exactSlowChartOperators(G,{...c,s:c.X}),{code:'INVALID_INPUT'});
});
