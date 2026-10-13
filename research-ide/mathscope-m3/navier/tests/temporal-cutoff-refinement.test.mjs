import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {evaluateRecordedTemporalCutoffRefinement,assertRecordedTemporalCutoffRefinement,recordedTemporalCutoffRefinementObservations} from '../source-temporal-cutoff-refinement.mjs';

let observed;

test('K doubling retains the four executed actual source tails and their original graph',async()=>{
  const r=await evaluateRecordedTemporalCutoffRefinement();
  assert.equal(assertRecordedTemporalCutoffRefinement(r),true);
  assert.equal(r.rows.length,16);
  assert.equal(r.comparisons.length,12);
  assert.equal(r.source.artifact.sha256,'8ef4e695623643d6ed344ce092270b0ac392be1aa2e49bcc1990ebd5da39df58');
  assert.deepEqual([...new Set(r.rows.map(x=>x.originalSourceDerivativeBoundRoot))],[1697489,1698049,1703520,1705757]);
  assert.deepEqual([...new Set(r.rows.map(x=>x.originalResidualRoot))],[643053,643068]);
  for(const row of r.rows){
    assert.equal(row.sourceDerivativeOrder,row.derivativeOrder+4);
    assert.equal(row.omittedBoundScalar,`(source_scalar(${row.originalK1TailBoundRoot}))/(${row.K})`);
    assert.equal(row.representedNonzeroModeCount,(2*row.K+1)**2-1);
    assert.equal(row.sourceScalarIsANumericalValue,false);
    assert.equal(row.freshFourierCoefficientIntegralsComputed,false);
    assert.equal(row.originalFullOmittedTailRetained,true);
  }
  assert.ok(r.comparisons.every(x=>x.cutoffDoubled&&x.sameOriginalSourceDerivativeBound&&x.observedNumericalFourierDifference===null));
  observed=structuredClone(r);
});

test('cutoff comparison keeps the pre-temporal and final-field obligations separate',async()=>{
  const r=await evaluateRecordedTemporalCutoffRefinement({cutoffs:[4,1,2]});
  assert.deepEqual(r.request.cutoffs,[1,2,4]);
  assert.equal(r.scope.originalN805Complete,false);
  assert.equal(r.scope.finalFieldSourceAttached,false);
  assert.equal(r.scope.freshFourierSumsEvaluated,false);
  assert.equal(r.scope.wholeM3Complete,false);
  assert.equal(r.lastResolvedTau,null);
  const view=recordedTemporalCutoffRefinementObservations(r);
  assert.deepEqual(view.samples,[]);
  assert.deepEqual(view.curves,[]);
  assert.equal(view.tables.length,12);
  assert.equal(view.sourceExpressionIdsAreNumericalValues,false);
  assert.match(view.limitation,/No source norm is assigned a numeric value/);
});

test('caller source norms and completion overrides are rejected',async()=>{
  for(const x of [{sourceSHA256:'fake'},{norm:0},{originalN805Complete:true},{cutoffs:[1,1]},{cutoffs:[0]},{cutoffs:[1.5]},{cutoffs:[1048577]}])
    await assert.rejects(evaluateRecordedTemporalCutoffRefinement(x));
});

test('copied and tampered tables cannot issue source observations',async()=>{
  const r=await evaluateRecordedTemporalCutoffRefinement();
  assert.throws(()=>recordedTemporalCutoffRefinementObservations(structuredClone(r)),{code:'INVALID_TEMPORAL_CUTOFF_REFINEMENT'});
  r.rows[0].originalK1TailBoundRoot=0;
  assert.throws(()=>recordedTemporalCutoffRefinementObservations(r),{code:'INVALID_TEMPORAL_CUTOFF_REFINEMENT'});
  const s=await evaluateRecordedTemporalCutoffRefinement();s.scope.originalN805Complete=true;
  assert.throws(()=>assertRecordedTemporalCutoffRefinement(s),{code:'INVALID_TEMPORAL_CUTOFF_REFINEMENT'});
});

after(async()=>{
  if(process.env.M3_TEMPORAL_CUTOFF_REFINEMENT_EVIDENCE&&observed)await writeFile(process.env.M3_TEMPORAL_CUTOFF_REFINEMENT_EVIDENCE,
    JSON.stringify({schema:'MathScope.N8.RecordedTemporalCutoffRefinementObserved/1',result:observed,
      originalN805Complete:false,wholeM3Complete:false},null,2)+'\n',{flag:'wx'});
});
