import test from 'node:test';
import assert from 'node:assert/strict';
import {numericalExponentialArithmetic} from '../actual-numerical-exponential-arithmetic.mjs';
import {tracedArithmeticEvaluator} from '../actual-selection-arithmetic-enclosure-kernel.mjs';
const trace=nodes=>({nodes:nodes.map(([id,op,args])=>({id,node:{op,args}})),nonArithmeticBoundaries:[]});

test('literal source node evaluation treats an integer exponent as data, not a root',()=>{
  const N=numericalExponentialArithmetic(),t=trace([[0,'rational',['2','1']],[1,'integer_power',[0,57]],[2,'source_parameter',['x']],
    [3,'multiply',[1,2]],[4,'rational',['-1','1']],[5,'add',[3,4]]]),before=JSON.stringify(t),
    E=tracedArithmeticEvaluator(t,N,{parameters:new Map([['x',N.point('1/2')]])});
  assert.equal(N.toClosed(E.value(5)).lower.rational,String((1n<<56n)-1n));
  assert.equal(JSON.stringify(t),before);assert.equal(E.report().visitedNodes,6);
  assert.equal(E.report().sourceAuthenticated,false);
});

test('opaque integral intervals remain explicit unproved generic premises',()=>{
  const N=numericalExponentialArithmetic(),t=trace([[0,'rational',['1','1']],[1,'definite_integral',[500,501,0,99]],[2,'add',[0,1]]]);
  t.nonArithmeticBoundaries=[{id:1}];
  assert.throws(()=>tracedArithmeticEvaluator(t,N).value(2),{code:'NON_ARITHMETIC_BOUNDARY'});
  const E=tracedArithmeticEvaluator(t,N,{boundaries:new Map([[1,N.fromClosed({lower:{rational:'1/4'},upper:{rational:'3'}})]])});
  assert.deepEqual(N.toClosed(E.value(2)),{lower:{rational:'5/4'},upper:{rational:'4'}});
  assert.deepEqual(E.report().conditionalBoundaryIntervalsConsumed,[1]);assert.equal(E.report().boundaryPremisesProvedHere,false);
  assert.throws(()=>tracedArithmeticEvaluator(t,N,{boundaries:new Map([[0,N.zero()]])}),{code:'INVALID_INPUT'});
});

test('missing parameters, duplicate nodes, cycles and arithmetic-arity changes are rejected',()=>{
  const N=numericalExponentialArithmetic();
  assert.throws(()=>tracedArithmeticEvaluator(trace([[0,'source_parameter',['h']]]),N).value(0),{code:'NON_ARITHMETIC_BOUNDARY'});
  assert.throws(()=>tracedArithmeticEvaluator(trace([[0,'add',[1]],[1,'multiply',[0]]]),N).value(0),{code:'INVALID_INPUT'});
  assert.throws(()=>tracedArithmeticEvaluator(trace([[0,'rational',['1','1']],[0,'rational',['2','1']]]),N),{code:'INVALID_INPUT'});
  assert.throws(()=>tracedArithmeticEvaluator(trace([[0,'rational',['1','1']],[1,'inverse',[0,0]]]),N).value(1),{code:'INVALID_INPUT'});
  assert.throws(()=>tracedArithmeticEvaluator(trace([[0,'rational',['1','1']],[1,'exp',[0]]]),N,{maxNodeVisits:1}).value(1),{code:'RESOURCE_LIMIT'});
});
