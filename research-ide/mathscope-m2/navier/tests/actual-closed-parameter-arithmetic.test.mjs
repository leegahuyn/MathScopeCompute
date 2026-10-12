import test from 'node:test';
import assert from 'node:assert/strict';
import {numericalExponentialArithmetic,closedNumericalExponentialEndpoint} from '../actual-numerical-exponential-arithmetic.mjs';
import {evaluateClosedArithmeticDefinitions,encloseActualClosedParameterArithmetic,assertActualClosedParameterArithmetic,actualClosedParameterArithmeticCertificate} from '../actual-closed-parameter-arithmetic.mjs';
import {getPinnedSourceProfile} from '../source-profile.mjs';
import {rational as Q,readRational,qcompare} from '../actual-continuation-arithmetic.mjs';

test('a finite independent definition graph keeps quotient, power, min and shared refs',()=>{
  const defs={a:{integer:3},b:{power:[{ref:'a'},2]},c:{quotient:[{ref:'b'},{integer:2}]},
    d:{min:[{ref:'c'},{rational:'7/2'}]},e:{sum:[{ref:'d'},{neg:{ref:'a'}}]}},
    N=numericalExponentialArithmetic(),before=JSON.stringify(defs),r=evaluateClosedArithmeticDefinitions(defs,N);
  assert.deepEqual(N.toClosed(r.values.get('e')),{lower:{rational:'1/2'},upper:{rational:'1/2'}});
  assert.equal(JSON.stringify(defs),before);assert.equal(r.evaluationOrder.length,5);assert.equal(r.sourceAuthenticated,false);
});

test('the actual 63 original arithmetic definitions have positive numerical endpoints and checked widths',async()=>{
  const profile=getPinnedSourceProfile(),r=await encloseActualClosedParameterArithmetic();
  assert.equal(r.rows.length,63);assert.equal(r.rows.length,Object.keys(profile.parametersExactExpressions).length);
  assert.deepEqual(r.source.definitions,profile.parametersExactExpressions);
  assert(r.source.everyOriginalNamedParameterEvaluated&&r.pass);
  for(const row of r.rows){
    assert(row.interval.strictlyPositiveLower&&row.interval.toleranceMet);
    assert(closedNumericalExponentialEndpoint(row.interval.lower)&&closedNumericalExponentialEndpoint(row.interval.upper));
    assert(qcompare(readRational(row.interval.coordinateWidth),Q(1,1000000000000n))<=0);
  }
  const at=name=>r.rows.find(x=>x.name===name).interval;
  assert.equal(at('h').small,true);assert.equal(at('h').logarithmCount,2);
  assert.equal(at('CSelected').logarithmCount,3);assert.equal(at('C12EnvelopeR').logarithmCount,4);
  assert.equal(r.scope.actualCommonSelectorNumericallyEnclosed,false);assert.equal(r.scope.wholeGNUMComplete,false);
  assertActualClosedParameterArithmetic(r);
  assert.throws(()=>assertActualClosedParameterArithmetic(actualClosedParameterArithmeticCertificate(r)),{code:'INVALID_SOURCE_CONSTRUCTION'});
  r.rows[0].interval.upper={rational:'1'};
  assert.throws(()=>assertActualClosedParameterArithmetic(r),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('unknown function bodies, free refs, cycles and invalid integer literals are not numeric premises',()=>{
  const N=numericalExponentialArithmetic();
  for(const defs of [{a:{ref:'missing'}},{a:{ref:'b'},b:{ref:'a'}},{a:{integer:'1/2'}}])
    assert.throws(()=>evaluateClosedArithmeticDefinitions(defs,N),{code:'INVALID_INPUT'});
  for(const defs of [{a:{integral:[0,1]}},{a:{actual_solution:1}}])
    assert.throws(()=>evaluateClosedArithmeticDefinitions(defs,N),{code:'NON_ARITHMETIC_BOUNDARY'});
  assert.throws(()=>evaluateClosedArithmeticDefinitions({a:{exp:{integer:1}}},N,{maxExpressionVisits:1}),{code:'RESOURCE_LIMIT'});
});

test('the pinned wrapper rejects a caller-supplied profile value or proof flag',async()=>{
  await assert.rejects(encloseActualClosedParameterArithmetic({h:'0'}),{code:'INVALID_INPUT'});
  await assert.rejects(encloseActualClosedParameterArithmetic({sourceAuthenticated:true}),{code:'INVALID_INPUT'});
  await assert.rejects(encloseActualClosedParameterArithmetic({sourceProfile:'invented-profile'}),{code:'UNSUPPORTED'});
});
