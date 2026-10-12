import test from 'node:test';
import assert from 'node:assert/strict';
import {runNavierM3,replayNavierM3} from '../../navier/index.mjs';
import {buildSourceRefinementPanel,sourceRefinementSummary,sourceRefinementSelection} from '../navier-source-refinement-view.mjs';
import {deriveExtendedViewContract} from '../extended-view-contract.mjs';

const result=await runNavierM3({package:'N8',operation:'source-core-refinement'});
const original=JSON.stringify(result);

test('fresh original-core results retain exact samples for all three independent controls',()=>{
  const panel=buildSourceRefinementPanel(result);
  assert.equal(panel.freshCoreComparisonsExecuted,true);
  assert.deepEqual(panel.axes.map(axis=>axis.axis),['spatialGrid','comparisonDegree','arithmeticBits']);
  let expected=0;
  for(const family of result.results.families)for(const variant of family.variants){
    expected+=variant.samples.length;
    variant.samples.forEach((sample,index)=>{
      const row=panel.rows.find(row=>row.id===family.axis+':'+variant.level+':'+index);
      assert.deepEqual(row.quantities,sample.quantities);
      assert.deepEqual(row.controls,variant.controls);
      assert.equal(row.Y,sample.sourceDomain.Y);
      assert.equal(row.X,sample.sourceDomain.X);
    });
  }
  assert.equal(panel.rows.length,expected);
  assert.equal(panel.physicalSpaceSamplesGenerated,false);
  assert.equal(result.recordedOnly,undefined);
  assert.equal(result.evidence.numericOrAlgebraicFiniteExecution,true);
  assert.ok(result.checks.every(check=>check.pass));
  assert.equal(JSON.stringify(result),original);
});

test('exact row selection and bounded summary preserve all unresolved source tails',()=>{
  const panel=buildSourceRefinementPanel(result),row=panel.rows.at(-1),selection=sourceRefinementSelection(result,row.id);
  assert.deepEqual(selection.quantities,row.quantities);
  assert.equal(selection.exactIntervalsRoundedToBinary64,false);
  assert.equal(selection.sourceChangedBySelection,false);
  assert.equal(selection.runHash,result.runHash);
  const summary=sourceRefinementSummary(result);
  assert.equal(summary.adaptationAxes.fourierCutoff.executed,false);
  assert.equal(summary.adaptationAxes.spatialGrid.uniformInterpolationError,null);
  assert.equal(summary.lastResolvedTau,null);
  assert.equal(summary.scope.wholeN8ReconstructionComputed,false);
  assert.equal(summary.allOriginalSamplesRetainedInExport,true);
  selection.quantities.azimuthalCore.interval.lower='0';
  assert.equal(JSON.stringify(result),original);
  assert.throws(()=>sourceRefinementSelection(result,'missing'),{code:'INVALID_SOURCE_REFINEMENT_VIEW'});
});

test('view contract produces no invented Cartesian samples and rejects altered mathematical scope',()=>{
  const view=deriveExtendedViewContract({result,resultDigest:'source-core-test'},
    {camera:{yaw:0,pitch:0,zoom:1},lod:250,selected:null,state:'all'});
  assert.equal(view.sourcePointCount,0);
  assert.equal(view.commonColorRange,null);
  assert.equal(view.mathematicalSourceChanged,false);
  const mutations=[r=>{r.results.scope.wholeN8ReconstructionComputed=true;},
    r=>{r.results.adaptationAxes.fourierCutoff.executed=true;},
    r=>{r.results.families[0].variants[0].verifiedUnchangedControls=false;},
    r=>{r.results.families[0].variants[0].samples[0].pressureAnalyticErrorsRetained=false;},
    r=>{r.observations.samples=[{position:[0,0,0],value:0}];}];
  for(const mutate of mutations){const changed=structuredClone(result);mutate(changed);
    assert.throws(()=>buildSourceRefinementPanel(changed),{code:'INVALID_SOURCE_REFINEMENT_VIEW'});}
});

test('replay recomputes the same original intervals and rejects changed claim authority',async()=>{
  const replay=await replayNavierM3(result);
  assert.equal(replay.pass,true);
  assert.equal(replay.runHash,result.runHash);
  const changed=structuredClone(result);changed.evidence.sourceReconstructionComplete=true;
  await assert.rejects(()=>replayNavierM3(changed),{code:'REPLAY_AUTHORITY_MISMATCH'});
});
