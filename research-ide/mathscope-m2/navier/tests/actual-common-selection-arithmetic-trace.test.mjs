import test from 'node:test';
import assert from 'node:assert/strict';
import {traceExactArithmeticDependencies,actualCommonSelectionArithmeticTrace} from '../actual-common-selection-arithmetic-trace.mjs';

test('pure arithmetic trace retains exact IDs and never treats integer powers as expression references',()=>{
  const G={nodes:[{op:'rational',args:['2','1']},{op:'source_parameter',args:['h']},{op:'integer_power',args:[0,57]},
    {op:'inverse',args:[1]},{op:'multiply',args:[2,3]},{op:'exp',args:[4]},{op:'rational',args:['999','1']}]};
  const before=JSON.stringify(G),t=traceExactArithmeticDependencies(G,{value:5});
  assert.equal(t.nodeCount,6);assert.equal(t.summaries.value.pureArithmeticAboveSourceParameters,true);
  assert.deepEqual(t.sourceParameters,['h']);assert.deepEqual(t.nodes[2],{id:2,node:G.nodes[2]});assert.equal(JSON.stringify(G),before);
  assert.equal(t.sourceAuthenticated,false);assert.equal(t.numericalEnclosureIssued,false);
});

test('an original improper integral is an explicit boundary and cannot become a guessed zero or positive number',()=>{
  const G={nodes:[{op:'rational',args:['0','1']},{op:'coordinate',args:['v']},{op:'integral',args:[1,1,0,1]},{op:'exp',args:[2]}]},
    t=traceExactArithmeticDependencies(G,{opaque:3});
  assert.equal(t.summaries.opaque.pureArithmeticAboveSourceParameters,false);
  assert.deepEqual(t.summaries.opaque.nonArithmeticBoundaries,[2]);assert.deepEqual(t.nonArithmeticBoundaries[0].node,G.nodes[2]);
  assert.equal(t.nodes.some(r=>r.id===0),false);assert.equal(t.opaqueValuesReplaced,false);
});

test('missing operands and a partial budget are explicit failures',()=>{
  assert.throws(()=>traceExactArithmeticDependencies({nodes:[{op:'exp',args:[9]}]},{x:0}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const G={nodes:[{op:'rational',args:['1','1']},{op:'exp',args:[0]}]};
  assert.throws(()=>traceExactArithmeticDependencies(G,{x:1},{maxNodes:1}),{code:'RESOURCE_LIMIT'});
});

test('an arbitrary object cannot acquire the private actual-family trace',async()=>{
  await assert.rejects(actualCommonSelectionArithmeticTrace({G:{nodes:[]}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
