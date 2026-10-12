import test from 'node:test';
import assert from 'node:assert/strict';
import {originalLeadingStreamPrimitiveIdentities} from '../actual-leading-stream-primitive-kernel.mjs';
const r=originalLeadingStreamPrimitiveIdentities();
test('original normalized and unnormalized bump primitives retain different widths',()=>{
  assert.equal(r.checks.normalizedBump.pass,true);assert.equal(r.checks.unnormalizedBump.pass,true);
  assert.equal(r.negativeControls.omittedNormalizedBumpWidth.pass,false);
});
test('positive logarithmic change of variable retains its radial Jacobian',()=>{
  assert.equal(r.checks.logarithmicPrimitiveJacobian.pass,true);assert.equal(r.negativeControls.omittedLogarithmicJacobian.pass,false);
});
test('the natural average coefficient identity is for arbitrary n and rejects the wrong denominator',()=>{
  assert.equal(r.checks.everyNaturalAverageCoefficient.pass,true);assert.equal(r.negativeControls.wrongNaturalAverageDenominator.pass,false);
  assert.equal(r.naturalSeries.finiteMaterializationIsWholeSeries,false);
});
test('generic FTC rules do not authenticate source fields or discard complete primitive constants',()=>{
  assert.equal(r.sourceAuthenticated,false);assert.match(r.compactJoinRule,/actual moment equation/);
});
