import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [runtime]=process.argv.slice(2);
const mod=await import(pathToFileURL(resolve(runtime,'actual-positive-global-stress.mjs')));
const result=mod.prepareActualPositiveGlobalStress({order:2,maxNodes:2000000,maxDerivativeOrder:16});
assert.ok(mod.assertActualPositiveGlobalStress(result));
const a=result.momentFamilies;
assert.equal(a.length,12);
const {G}=result;
const eta=result.moments.pressure.primitives.prepared.bootstrap.constants.eta;
const results=[];
for(const family of a){
  const definition=G.expressionSystems[family.system];
  assert.deepEqual(definition.parameters,[eta]);
  assert.equal(definition.body,family.actualBody);
  assert.deepEqual(definition.derivativeLimits,[2]);
  assert.ok(G.expressionValue(family.system,[eta],[2])>=0);
  assert.throws(()=>G.expressionValue(family.system,[eta],[3]),
    e=>e.code==='RESOURCE_LIMIT'&&e.message==='The shared body derivative budget is exhausted.');
  results.push({name:family.name,system:family.system,body:family.actualBody});
}
const baselineNodes=G.nodes.length;
const aliases=a.filter(f=>['ActualWholeGlobalMomentZero_2_1','ActualWholeGlobalMomentZero_2_5'].includes(f.name)).map(f=>{
  const alias=G.defineExpressionFunction({name:'independent_inspection_'+f.name,parameters:[eta],body:f.actualBody,derivativeLimits:[3]});
  assert.equal(G.expressionSystems[alias].body,G.expressionSystems[f.system].body);
  const eta3=G.expressionValue(alias,[eta],[3]),expected=G.nodes[eta3].args;
  assert.deepEqual(expected,[alias,[eta],[3]]);
  const materialized=G.materializeExpressionFunction(alias,[eta],[3]);
  let differentiated=f.actualBody;
  for(let i=0;i<3;i++)differentiated=G.derivative(differentiated,eta);
  assert.equal(materialized,differentiated);
  assert.deepEqual([...G.freeCoordinates(materialized)],[eta]);
  assert.throws(()=>G.expressionValue(f.system,[eta],[3]),e=>e.code==='RESOURCE_LIMIT');
  return {original:f.name,sourceBody:f.actualBody,alias,derivativeNode:eta3,materialized,freeCoordinates:[eta]};
});
assert.equal(aliases.length,2);
assert.ok(mod.assertActualPositiveGlobalStress(result));
console.log(JSON.stringify({nodes:baselineNodes,finalNodes:G.nodes.length,aliases,orders:result.request.throughOrder,results,
  stress:result.stressRows.map(v=>({n:v.order,component:v.component,forward:v.sourceForwardIntegral,backward:v.sourceBackwardIntegral}))}));
