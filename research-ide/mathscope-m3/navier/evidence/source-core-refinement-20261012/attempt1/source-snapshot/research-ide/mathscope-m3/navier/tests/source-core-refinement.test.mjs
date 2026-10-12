import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateSourceCoreRefinement,validateSourceCoreRefinement,sourceCoreRefinementObservations} from '../source-core-refinement.mjs';

test('core refinement changes one control and compares the same physical source coordinates',async()=>{
  const result=await evaluateSourceCoreRefinement();
  assert.equal(result.freshCoreComparisonsExecuted,true);assert.equal(result.freshSourceConstructorExecuted,false);
  assert.equal(result.families.length,3);assert.ok(result.execution.uniqueCoreEvaluations<=result.execution.maximumEvaluations);
  for(const family of result.families)for(const variant of family.variants){
    assert.equal(variant.verifiedUnchangedControls,true);
    assert.ok(variant.comparisons.every(row=>row.intervalsOverlap&&row.samePhysicalCoordinate));
    for(const sample of variant.samples){assert.equal(sample.sourceBinding.parameterExpressionSHA256,result.source.parameterExpressionSHA256);
      assert.equal(sample.nonlinearComparisonErrorsRetained,true);assert.equal(sample.pressureAnalyticErrorsRetained,true);
      assert.equal(sample.entireFinalVelocityEvaluated,false);}
  }
  const grids=result.families[0].variants.map(row=>row.samples.map(sample=>sample.request.Y));
  assert.deepEqual(grids[0],['2','3']);assert.deepEqual(grids[1],['2','5/2','3']);
  assert.deepEqual(grids[2],['2','9/4','5/2','11/4','3']);
  assert.equal(result.adaptationAxes.fourierCutoff.executed,false);assert.equal(result.lastResolvedTau,null);
  assert.equal(result.scope.originalN805CriterionComplete,false);
  const observations=sourceCoreRefinementObservations(result);
  assert.deepEqual(observations.samples,[]);assert.deepEqual(observations.curves,[]);
  assert.equal(observations.contract.intervalRepresentation,'EXACT_RATIONAL_ENDPOINTS_WITH_POSITIVE_NONLINEAR_AND_PRESSURE_ERRORS');
  assert.equal(observations.claims[0].fullPhysicalVelocityEvaluated,false);
  assert.equal(observations.claims[0].omittedFourierTailCertified,false);
  assert.equal(observations.claims[0].uniformSpatialInterpolationCertified,false);
  assert.equal(observations.contract.sourceFiles.length,2);
  assert.throws(()=>sourceCoreRefinementObservations({...result,scope:{...result.scope,originalN805CriterionComplete:true}}));
});

test('fresh independent runs are deterministic and cannot accept fabricated source, constants or unbounded work',async()=>{
  const input={gridLevels:[1],degrees:[32],precisionBits:[128],baseGrid:1,baseDegree:32,baseBits:128},
    a=await evaluateSourceCoreRefinement(input),b=await evaluateSourceCoreRefinement(input);
  assert.deepEqual(a,b);
  for(const bad of [null,[],{source:{}},{h:0},{bits:256},{gridLevels:[3]},{degrees:[31]},
    {precisionBits:[513]},{gridLevels:[1,1]},{baseGrid:0},{gridLevels:[16],degrees:[32,33,34,35,36,37,38,39],precisionBits:[128,129,130,131,132,133,134,135],baseGrid:16}])
    assert.throws(()=>validateSourceCoreRefinement(bad));
});
