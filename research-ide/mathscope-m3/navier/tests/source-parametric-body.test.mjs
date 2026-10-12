import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {materializeParametricExpressionBody} from '../source-higher-jets.mjs';

const equal=(G,a,b)=>assert.equal(sourceGraphRationalIdentity(G,G.sub(a,b)).pass,true);

test('mixed derivative sharing preserves actual coupled argument substitution',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('x'),y=G.fresh('y'),
    body=G.add(G.mul(G.pow(x,2),y),G.exp(y)),
    system=G.defineExpressionFunction({name:'explicit_mixed_body',parameters:[x,y],body,derivativeLimits:[3,3]}),
    args=[G.add(x,y),G.mul(x,y)],application=G.expressionValue(system,args,[1,1]),
    row=materializeParametricExpressionBody(G,application);
  // Independent calculus: d_x d_y (x^2*y+exp(y))=2*x.
  equal(G,row.body,G.mul(G.q(2),x));
  equal(G,G.simultaneousSubstitute(row.body,row.parameters,row.arguments),G.mul(G.q(2),G.add(x,y)));
  equal(G,G.materializeExpressionFunction(system,args,[1,1]),G.mul(G.q(2),G.add(x,y)));
  assert.deepEqual(row.arguments,args);
  assert.equal(row.bodyAtDefiningParameters,true);
  assert.equal(row.sourceAuthenticated,false);
  assert.throws(()=>materializeParametricExpressionBody(G,body),{code:'INVALID_INPUT'});
});

test('moving-endpoint derivative keeps its bound coordinate local under shared application',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('endpoint'),y=G.fresh('coefficient'),t=G.fresh('local_integral'),
    body=G.integral(G.mul(t,y),t,G.zero,x),
    system=G.defineExpressionFunction({name:'actual_FTC_body',parameters:[x,y],body,derivativeLimits:[2,2]}),
    application=G.expressionValue(system,[y,G.add(x,G.one)],[1,0]),
    row=materializeParametricExpressionBody(G,application);
  // FTC gives x*y before applying endpoint->y, coefficient->x+1.
  equal(G,row.body,G.mul(x,y));
  equal(G,G.simultaneousSubstitute(row.body,row.parameters,row.arguments),G.mul(y,G.add(x,G.one)));
  assert.equal(G.freeCoordinates(row.body).has(t),false);
  const repeated=materializeParametricExpressionBody(G,G.expressionValue(system,[G.q(3),G.q(5)],[1,0]));
  assert.equal(repeated.body,row.body,'The same exact derivative definition is reused at different arguments.');
  equal(G,G.simultaneousSubstitute(repeated.body,repeated.parameters,repeated.arguments),G.q(15));
});
