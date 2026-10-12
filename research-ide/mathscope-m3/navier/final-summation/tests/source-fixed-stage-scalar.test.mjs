import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {ActualConvergentExpressions} from '../../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {prepareOriginalFixedStageChoice,assertOriginalFixedStageChoice,bindOriginalFixedStageScalarEstimates,
  assertOriginalFixedStageScalarComparison} from '../source-fixed-stage-scalar-comparison.mjs';

function fixture(m=0,N=0){
  const G=new ActualConvergentExpressions(),choice=prepareOriginalFixedStageChoice(G,{derivativeOrder:m,decayOrder:N}),r=choice.roots,J=r.fixedStage;
  const input={commonLogQReciprocalRoot:G.q(2),cutoff:{stageRoot:J,logScaleRoot:G.q(40),tailDerivativeOrder:m+2},
    finiteState:{stageRoot:J,derivativeOrder:m+1,constantRoot:G.q(3),logPower:m+1,lossRoot:r.velocityLoss},
    finiteResidual:{stageRoot:J,derivativeOrder:m,constantRoot:G.q(5),logPower:m+2,lossRoot:r.residualLoss,decayRoot:r.residualDecay},
    flatRemainder:{stageRoot:J,derivativeOrder:m,decayOrder:N,constantRoot:G.q(7)}};
  return {G,choice,input};
}
let observed=[];

test('original-h fixed stages retain every complete order margin without materializing the index',()=>{
  for(const[m,N]of[[0,0],[0,4],[2,5],[8,20]]){
    const {G,choice,input}=fixture(m,N),comparison=bindOriginalFixedStageScalarEstimates(G,choice,input);
    assert.equal(assertOriginalFixedStageChoice(choice),true);
    assert.equal(choice.checks.length,7);assert.ok(choice.checks.every(x=>x.pass));
    assert.equal(G.nodes[choice.roots.fixedStage].op,'ceiling');
    assert.equal(G.nodes[choice.roots.h].op,'source_parameter');
    assert.equal(choice.requiredSourceEstimates.finiteVelocity.derivativeOrder,m+1);
    assert.equal(choice.requiredSourceEstimates.cutoffTail.derivativeOrder,m+2);
    assert.equal(choice.requiredSourceEstimates.finiteResidual.derivativeOrder,m);
    assert.equal(comparison.normalizedResidualUpper.qExponent,N);
    assert.equal(comparison.numericStageIndexMaterialized,false);
    assert.equal(comparison.numericOriginalHUsed,false);
    const program=G.pack({...choice.roots,...comparison.roots});
    observed.push({m,N,choice,comparison,input,program});
  }
});

test('all supplied constants, logarithmic powers and the sole same-J flat remainder are retained',()=>{
  const f=fixture(3,9),r=bindOriginalFixedStageScalarEstimates(f.G,f.choice,f.input);
  assert.equal(assertOriginalFixedStageScalarComparison(r),true);
  assert.deepEqual(r.sameFixedStagePremises.flatRemainder,f.input.flatRemainder);
  assert.equal(r.absorption.velocity.coefficientNorm,f.input.finiteState.constantRoot);
  assert.equal(r.absorption.residual.coefficientNorm,f.input.finiteResidual.constantRoot);
  assert.equal(r.absorption.velocity.logPower,4);assert.equal(r.absorption.residual.logPower,5);
  assert.equal(r.exactNSDifferenceConstant,'48');
  assert.equal(r.allFlatResidualsSummed,false);assert.equal(r.commonDomainForFiniteOperatorsChanged,false);
  for(const key of ['originalSourcePremisesAuthenticated','originalN608Complete','wholeM3Complete','actualOriginalFiniteStageConstructed'])assert.equal(r[key],false);
  assert.equal(r.actualPositiveWindowIndicesEnumerated,false);
});

test('different stages, omitted physical losses and insufficient derivative orders are rejected',()=>{
  const mutations=[
    [f=>f.input.finiteState.stageRoot=f.G.q(2),'WRONG_FIXED_STAGE'],
    [f=>f.input.finiteResidual.stageRoot=f.G.q(2),'WRONG_FIXED_STAGE'],
    [f=>f.input.flatRemainder.stageRoot=f.G.q(2),'WRONG_FIXED_STAGE'],
    [f=>f.input.cutoff.stageRoot=f.G.q(2),'WRONG_FIXED_STAGE'],
    [f=>f.input.flatRemainder.decayOrder=0,'WRONG_FIXED_STAGE'],
    [f=>f.input.finiteResidual.derivativeOrder=0,'WRONG_FIXED_STAGE'],
    [f=>f.input.finiteState.derivativeOrder=2,'INSUFFICIENT_COMPARISON_DERIVATIVES'],
    [f=>f.input.cutoff.tailDerivativeOrder=3,'INSUFFICIENT_COMPARISON_DERIVATIVES'],
    [f=>f.input.finiteState.lossRoot=f.G.zero,'CHANGED_SOURCE_DECAY_LOSS'],
    [f=>f.input.finiteResidual.lossRoot=f.G.zero,'CHANGED_SOURCE_DECAY_LOSS'],
    [f=>f.input.finiteResidual.decayRoot=f.G.one,'CHANGED_SOURCE_DECAY_LOSS']
  ];
  for(const[change,code]of mutations){const f=fixture(2,5);change(f);assert.throws(()=>bindOriginalFixedStageScalarEstimates(f.G,f.choice,f.input),{code});}
});

test('coordinate-dependent bounds, negative norms and caller authority cannot enter the scalar estimate',()=>{
  for(const name of ['finiteState','finiteResidual','flatRemainder']){
    const f=fixture();f.input[name].constantRoot=f.G.var('sample_position');
    assert.throws(()=>bindOriginalFixedStageScalarEstimates(f.G,f.choice,f.input),{code:'COORDINATE_DEPENDENT_BOUND'});
  }
  let f=fixture();f.input.finiteState.constantRoot=f.G.q(-1);
  assert.throws(()=>bindOriginalFixedStageScalarEstimates(f.G,f.choice,f.input),{code:'NEGATIVE_NORM_PREMISE'});
  f=fixture();f.input.originalSourcePremisesAuthenticated=true;
  assert.throws(()=>bindOriginalFixedStageScalarEstimates(f.G,f.choice,f.input),{code:'INVALID_INPUT'});
  f=fixture();assert.throws(()=>bindOriginalFixedStageScalarEstimates(new ActualConvergentExpressions(),f.choice,f.input),{code:'WRONG_SOURCE_GRAPH'});
});

test('choice cloning, changed metadata and changed exact h definitions invalidate the private record',()=>{
  let f=fixture();assert.throws(()=>assertOriginalFixedStageChoice(structuredClone(f.choice)),{code:'INVALID_FIXED_STAGE_CHOICE'});
  f=fixture();f.choice.decayOrder++;
  assert.throws(()=>assertOriginalFixedStageChoice(f.choice),{code:'INVALID_FIXED_STAGE_CHOICE'});
  f=fixture();f.G.source=structuredClone(f.G.source);f.G.source.parametersExactExpressions.h={integer:0};
  assert.throws(()=>assertOriginalFixedStageChoice(f.choice),{code:'INVALID_FIXED_STAGE_CHOICE'});
  assert.throws(()=>prepareOriginalFixedStageChoice(f.G),{code:'CHANGED_ORIGINAL_EXPONENT'});
});

test('comparison seals retain both scalar constants and the pre-existing graph prefix',()=>{
  let f=fixture(),r=bindOriginalFixedStageScalarEstimates(f.G,f.choice,f.input);
  assert.throws(()=>assertOriginalFixedStageScalarComparison(structuredClone(r)),{code:'INVALID_SCALAR_FIXED_STAGE_COMPARISON'});
  r.sameFixedStagePremises.flatRemainder.constantRoot=f.G.one;
  assert.throws(()=>assertOriginalFixedStageScalarComparison(r),{code:'INVALID_SCALAR_FIXED_STAGE_COMPARISON'});
  f=fixture();r=bindOriginalFixedStageScalarEstimates(f.G,f.choice,f.input);
  f.G.nodes[r.roots.totalConstant]={op:'rational',args:['0','1']};
  assert.throws(()=>assertOriginalFixedStageScalarComparison(r),{code:'INVALID_SCALAR_FIXED_STAGE_COMPARISON'});
});

test('independent graph extension preserves the same fixed-stage result',()=>{
  const f=fixture(),r=bindOriginalFixedStageScalarEstimates(f.G,f.choice,f.input);
  f.G.exp(f.G.q(12345));assert.equal(assertOriginalFixedStageChoice(f.choice),true);
  assert.equal(assertOriginalFixedStageScalarComparison(r),true);
});

test('exhausted exact program budgets return no comparison or fabricated stage',()=>{
  assert.throws(()=>prepareOriginalFixedStageChoice(new ActualConvergentExpressions(),{maxAddedNodes:1}),{code:'RESOURCE_LIMIT'});
  const f=fixture();assert.throws(()=>bindOriginalFixedStageScalarEstimates(f.G,f.choice,{...f.input,maxAddedNodes:1}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>prepareOriginalFixedStageChoice(new ActualConvergentExpressions(),{derivativeOrder:0.5}),{code:'RESOURCE_LIMIT'});
});

if(process.env.M3_FIXED_STAGE_SCALAR_EVIDENCE)test.after(async()=>{
  await writeFile(process.env.M3_FIXED_STAGE_SCALAR_EVIDENCE,JSON.stringify({schema:'MathScope.N6.FixedStageSourceScalarKernelObservedInputs/1',
    cases:observed,sourceNormValuesAreFixtures:true,actualOriginalFieldComputed:false,wholeM3Complete:false},null,2)+'\n');
});
