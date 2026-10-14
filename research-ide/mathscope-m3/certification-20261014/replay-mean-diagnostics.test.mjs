import test from 'node:test';
import assert from 'node:assert/strict';
import {createIndependentMeanReader} from './replay-reader.mjs';
import {checkpointRemainingMeanAtoms} from './replay-mean.mjs';
const reader=()=>{const source=[{op:'coordinate',args:['x']},{op:'coordinate',args:['y']},{op:'coordinate',args:['z']}];return createIndependentMeanReader({node:id=>source[id]});};
const comparison=(a,b)=>({pressureZ:{pass:false,numerator:[{monomial:`${a}:1`,coefficient:'1'},{monomial:`${b}:1`,coefficient:'-1'}]}});

test('remaining atom checkpoint proves only complete primitive alpha equivalence with original node IDs retained',()=>{
  const G=reader(),x=G.importSource(0),y=G.importSource(1),z=G.importSource(2),a=G.integral(G.put('exp',[G.mul(x,z)]),x,G.zero,G.one),b=G.integral(G.put('exp',[G.mul(y,z)]),y,G.zero,G.one),d=checkpointRemainingMeanAtoms(G,comparison(a,b));
  assert.deepEqual(d.roots,[a,b]);assert.equal(d.completeReviewedOperandCheckpoint,true);assert.equal(d.remainingAtomComparisons[0].equivalent,true);assert.equal(d.remainingAtomComparisons[0].completeCanonicalTreesCompared,true);
  assert.ok(d.reviewedOperandRows.some(row=>row.independentNode===x&&row.originalSourceNodes.includes(0)));
  assert.equal(d.sourceAlgebraAcceptanceChanged,false);assert.equal(d.originalN602Complete,false);
});

test('remaining atom checkpoint rejects unknown named or limit body semantics instead of merging same signatures',()=>{
  const G=reader(),x=G.importSource(0),y=G.importSource(1),a=G.integral(G.put('unknown_limit',[x]),x,G.zero,G.one),b=G.integral(G.put('unknown_limit',[y]),y,G.zero,G.one),d=checkpointRemainingMeanAtoms(G,comparison(a,b));
  assert.ok(d.opaqueDefiningBodyBoundaries.some(row=>row.operation==='unknown_limit'));assert.equal(d.remainingAtomComparisons[0].equivalent,null);assert.equal(d.remainingAtomComparisons[0].unknownOperatorMerged,false);
  assert.ok(d.primitiveAlphaForms.every(row=>row.status==='PRIMITIVE_FORM_UNRESOLVED'));assert.equal(d.allDefiningBodyCaptureClosureProved,false);
});

test('remaining checkpoint and alpha budgets produce explicit partial diagnostics',()=>{
  const G=reader(),x=G.importSource(0),a=G.integral(G.put('exp',[x]),x,G.zero,G.one),b=G.integral(G.pow(x,2),x,G.zero,G.one),d=checkpointRemainingMeanAtoms(G,comparison(a,b),{maxNodes:1,maxAlphaWork:10,maxBytes:1500000});
  assert.equal(d.completeReviewedOperandCheckpoint,false);assert.equal(d.limitStop.code,'REMAINING_OPERAND_CHECKPOINT_LIMIT');assert.ok(d.totalAlphaWorkUpperBound<=10);assert.equal(d.sourceAlgebraAcceptanceChanged,false);
});
