import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {captureNumericalScaleRootSeal,assertNumericalScaleRootSeal} from '../actual-numerical-scale-root-seal.mjs';

function fixture(){
  const G=new ActualSourceExpressions(),a=G.var('a'),b=G.var('b'),mass=G.var('m'),det=G.var('scaledDet'),oldScale=G.mul(a,mass),start=G.nodes.length,
    m2=G.pow(mass,2),absoluteDet=G.mul(det,a,b,m2),absoluteSqrt=G.sqrt(b),record=captureNumericalScaleRootSeal(G,{appendStart:start,roots:[oldScale,absoluteDet,absoluteSqrt]});
  return {G,a,m2,absoluteDet,absoluteSqrt,record};
}
test('new determinant and absolute square-root roots are retained',()=>{
  for(const name of['absoluteDet','absoluteSqrt']){const f=fixture();assert(assertNumericalScaleRootSeal(f.record,f.G));f.G.nodes[f[name]]={op:'rational',args:['0','1']};
    assert.throws(()=>assertNumericalScaleRootSeal(f.record,f.G),{code:'INVALID_SOURCE_CONSTRUCTION'});}
});
test('an appended dependency is guarded even when it is not a displayed root',()=>{
  const f=fixture();assert(!f.record.sourceRoots.includes(f.m2));f.G.nodes[f.m2]={op:'integer_power',args:[f.a,3]};
  assert.throws(()=>assertNumericalScaleRootSeal(f.record,f.G),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
test('later unrelated append is permitted without changing retained membership',()=>{
  const f=fixture(),count=f.G.nodes.length;f.G.exp(f.G.q(7));assert(f.G.nodes.length>count);assert(assertNumericalScaleRootSeal(f.record,f.G));
  assert.equal(f.record.sourceAuthenticated,false);assert.equal(f.record.numericalCalculationPerformed,false);
});
test('old displayed roots, record copies and public metadata mutations are rejected',()=>{
  const f=fixture();assert.throws(()=>assertNumericalScaleRootSeal(structuredClone(f.record),f.G),{code:'INVALID_SOURCE_CONSTRUCTION'});
  f.G.nodes[f.record.sourceRoots[0]]={op:'rational',args:['9','1']};assert.throws(()=>assertNumericalScaleRootSeal(f.record,f.G),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const g=fixture();g.record.appendEnd++;assert.throws(()=>assertNumericalScaleRootSeal(g.record,g.G),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
