import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {ActualSourceExpressions,evaluateSourceProgramDiagnostic} from '../../../../mathscope-m2/navier/actual-global-source-expressions.mjs';
import {checkedShrinkingCutoffSchedule,exactLogarithmicTailThreshold} from '../../shrinking-cutoff-summation.mjs';
import {prepareFinalSummationWindow,assertFinalSummationWindow,constructFinalSummationFromRoots,assertConstructedFinalWindow,
  originalFinalCutoffRoot,fixedStageFinalResidualComparison} from '../source-final-summation.mjs';
import {prepareSourceScalarFinalWindow} from '../source-final-summation.mjs';

function schedule(count=8){return checkedShrinkingCutoffSchedule({logQ0Reciprocal:'0',rows:Array.from({length:count},(_,i)=>({stage:i+1,gain:'1000',
  bounds:Array.from({length:i+2},(_,m)=>({order:m,constant:'1',logPower:0}))}))});}
function plan(input={}){return prepareFinalSummationWindow(schedule(),{logQReciprocal:['2','3'],order:0,truncateAfter:1,derivativeLoss:'2',...input});}
function fixture(G=new ActualSourceExpressions()){
  const [x,y,z,t,s]=['x','y','z','t','s'].map(v=>G.var(v)),q=G.add(G.pow(z,2),G.sub(G.one,t));
  const raw=j=>({potential:[G.mul(G.q(j),y,z),G.mul(G.q(j),x,G.pow(z,2)),G.add(G.mul(G.q(j),G.pow(x,2),t),G.mul(G.q(j),y))],
    azimuthalScalar:G.mul(G.q(j),G.add(s,z,G.pow(t,2))),pressure:G.add(G.mul(G.q(j),x,y,z),G.mul(G.q(j),G.pow(t,2)))});
  const base=raw(1),increments=[1,2].map(stage=>({stage,...raw(stage+1)}));
  return {G,plan:plan(),input:{coordinates:[x,y,z,t],radialSquaredVariable:s,qRoot:q,base,increments},coordinates:{x,y,z,t,s}};
}
let example;
let sourceScalarExample;
class ScalarGraphFixture extends ActualSourceExpressions{
  maximum(...args){return this.node('maximum',args);}
  freeCoordinates(id){
    const node=this.nodes[id];
    if(node.op==='coordinate')return new Set([id]);
    if(['rational','source_parameter'].includes(node.op))return new Set();
    const children=['integer_power','source_step_derivative'].includes(node.op)?[node.args[0]]:node.args;
    return new Set(children.flatMap(child=>[...this.freeCoordinates(child)]));
  }
  derivative(id,variable){return this.freeCoordinates(id).has(variable)?super.derivative(id,variable):this.zero;}
}
function scalarInput(G){return {logQ0ReciprocalRoot:G.q(2),truncateAfter:1,order:0,derivativeLossRoot:G.q(2),
  rows:[1,2,3].map(stage=>({stage,bounds:Array.from({length:stage+1},(_,order)=>({order,constantRoot:G.q(stage+order+1),logPower:order}))}))};}

test('the complete positive window retains every possible active index and proves every later cutoff is zero',()=>{
  const p=plan();assert.deepEqual(p.requiredIncrementIndices,[1,2]);assert.equal(p.firstExcludedIndex,3);
  assert.equal(p.window.firstJCutoffsExactlyOne,true);assert.equal(p.completeOnEntirePositiveWindow,true);
  assert.equal(p.omittedFutureCutoffTerms.identicallyZero,true);assert.equal(p.sourceCoefficientNormsAuthenticated,false);
  assert.equal(p.originalFinalFieldConstructed,false);assert.equal(p.allFutureNormPremisesProved,false);
  assert.equal(assertFinalSummationWindow(p),true);
  assert.throws(()=>assertFinalSummationWindow(structuredClone(p)),{code:'INVALID_WINDOW_PLAN'});
  p.requiredIncrementIndices.pop();assert.throws(()=>assertFinalSummationWindow(p),{code:'INVALID_WINDOW_PLAN'});
});

test('a prefix without an inactive cutoff is unresolved and cannot return a final field',()=>{
  const f=fixture(),p=plan({logQReciprocal:['8','9']});
  assert.equal(p.completeOnEntirePositiveWindow,false);assert.equal(p.lastResolvedPositiveQWindow,null);
  assert.match(p.unresolvedReason,/entire requested window/);
  assert.throws(()=>constructFinalSummationFromRoots(f.G,p,f.input),{code:'UNRESOLVED_ACTIVE_SET'});
});

test('actual supplied graph roots retain the transition curl, direct mean, pressure and full fixed-stage difference',()=>{
  const f=fixture(),result=constructFinalSummationFromRoots(f.G,f.plan,f.input),roots={};
  assert.equal(assertConstructedFinalWindow(result),true);assert.equal(result.checks.every(r=>r.pass),true);
  assert.equal(result.stages[0].cutoff,f.G.one);assert.equal(result.stages[1].possibleTransition,true);
  assert.ok(result.stages[1].commutator.some(id=>id!==f.G.zero));
  assert.equal(result.allTransitionCurlCommutatorsRetained,true);assert.equal(result.flatResidualSeriesFormed,false);
  assert.equal(result.sourceCurrentRootsAuthenticated,false);assert.equal(result.originalFinalN6FieldConstructed,false);
  for(let i=0;i<3;i++){roots['velocity_'+i]=result.velocity[i];roots['commutator_'+i]=result.stages[1].commutator[i];
    roots['uncut_'+i]=result.fixedUncutStage.velocity[i];roots['difference_'+i]=result.fixedUncutStage.differenceVelocity[i];}
  roots.pressure=result.pressure;roots.q=f.input.qRoot;roots.transitionCutoff=result.stages[1].cutoff;
  const program=f.G.pack(roots),points=[];
  for(const targetQ of [0.05,0.1,0.13])for(const z of [0.1,0.2]){
    const coordinates={x:0.7,y:-0.3,z,t:1+z*z-targetQ},values={};
    for(const name of Object.keys(roots))values[name]=evaluateSourceProgramDiagnostic(program,name,{coordinates});
    points.push({targetQ,coordinates,values});
    assert.ok(Math.abs(values.q.value-targetQ)<1e-14);
    assert.ok(Object.values(values).every(v=>!v.sameProfileCertificate&&!v.actualGlobalSourceEvaluated&&!v.intervalCertified));
  }
  assert.ok(points.some(p=>Math.abs(p.values.commutator_0.value)>0));
  example={plan:f.plan,result,program,points};
});

test('a missing active source, unsummed auxiliary coordinate or non-axisymmetric direct mean is rejected',()=>{
  let f=fixture();assert.throws(()=>constructFinalSummationFromRoots(f.G,f.plan,{...f.input,increments:f.input.increments.slice(0,1)}),{code:'INCOMPLETE_ACTIVE_SOURCE'});
  f=fixture();f.input.increments[0].potential[0]=f.G.var('unsubstituted_theta');
  assert.throws(()=>constructFinalSummationFromRoots(f.G,f.plan,f.input),{code:'UNSUBSTITUTED_SOURCE_COORDINATE'});
  f=fixture();f.input.base.azimuthalScalar=f.coordinates.x;
  assert.throws(()=>constructFinalSummationFromRoots(f.G,f.plan,f.input),{code:'NONAXISYMMETRIC_DIRECT_MEAN'});
  f=fixture();f.input.base.azimuthalScalar=f.G.integral(f.G.one,f.coordinates.x,f.G.zero,f.coordinates.x);
  assert.throws(()=>constructFinalSummationFromRoots(f.G,f.plan,f.input),{code:'NONAXISYMMETRIC_DIRECT_MEAN'});
  f=fixture();f.input.qRoot=f.G.add(f.input.qRoot,f.coordinates.x);
  assert.throws(()=>constructFinalSummationFromRoots(f.G,f.plan,f.input),{code:'INVALID_ORIGINAL_Q'});
});

test('exact cutoff seams branch before reciprocal construction and preserve the original half-plateau',()=>{
  const G=new ActualSourceExpressions();
  for(const value of [[0,1],[1,4],[1,2]])assert.equal(originalFinalCutoffRoot(G,G.q(...value)),G.one);
  for(const value of [[1,1],[2,1]])assert.equal(originalFinalCutoffRoot(G,G.q(...value)),G.zero);
  const middle=originalFinalCutoffRoot(G,G.q(3,4));
  assert.equal(evaluateSourceProgramDiagnostic(G.pack({middle}),'middle').value,0.5);
});

test('a stopped construction returns no field or source authority',()=>{
  const f=fixture();assert.throws(()=>constructFinalSummationFromRoots(f.G,f.plan,{...f.input,maxAddedNodes:2}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>constructFinalSummationFromRoots(f.G,f.plan,{...f.input,sourceAuthenticated:true}),{code:'INVALID_INPUT'});
});

test('a complete cutoff field without every uncut reference increment has no invented fixed-J field',()=>{
  const f=fixture(),p=plan({logQReciprocal:['1/5','1/2']});
  const result=constructFinalSummationFromRoots(f.G,p,{...f.input,increments:[]});
  assert.equal(result.fixedUncutStage,null);assert.equal(result.fixedStageTail,null);
  assert.match(result.fixedUncutStageUnavailableReason,/before J/);
  assert.deepEqual(result.velocity,result.base.velocity);assert.equal(assertConstructedFinalWindow(result),true);
});

test('a changed source operand or detached record invalidates the final-field seal',()=>{
  const f=fixture(),result=constructFinalSummationFromRoots(f.G,f.plan,f.input);
  assert.throws(()=>assertConstructedFinalWindow(structuredClone(result)),{code:'INVALID_FINAL_WINDOW'});
  f.G.nodes[f.input.base.potential[0]].args[0]=f.G.one;
  assert.throws(()=>assertConstructedFinalWindow(result),{code:'INVALID_FINAL_WINDOW'});
});

const comparisonInput={derivativeOrder:0,decayOrder:4,finiteState:{stage:2,derivativeOrder:2,constant:'1',qLoss:'2',logPower:0},
  finiteResidual:{stage:2,constant:'1',qLoss:'1',decay:'10',logPower:0},flatRemainder:{stage:2,derivativeOrder:0,decayOrder:4,constant:'3/7'}};
let comparison;
test('the quantified residual comparison uses one fixed J and retains a nonzero fixed flat remainder',()=>{
  const p=plan({logQReciprocal:['5','6'],order:2,truncateAfter:2,derivativeLoss:'1'});
  comparison=fixedStageFinalResidualComparison(p,comparisonInput);
  assert.equal(comparison.conditionalEstimateVerified,true);assert.equal(comparison.normalizedResidualUpper.coefficient,'131/28');
  assert.equal(comparison.onlyFlatRemainderPremise.constant,'3/7');assert.equal(comparison.allFlatResidualsSummed,false);
  assert.equal(comparison.allOriginalSourcePremisesAuthenticated,false);
  const wrong=structuredClone(comparisonInput);wrong.flatRemainder.stage=3;
  assert.throws(()=>fixedStageFinalResidualComparison(p,wrong),{code:'WRONG_FIXED_STAGE'});
  const weak=structuredClone(comparisonInput);weak.finiteState.derivativeOrder=0;
  assert.throws(()=>fixedStageFinalResidualComparison(p,weak),{code:'INSUFFICIENT_FINITE_STATE_DERIVATIVES'});
  const failed=structuredClone(comparisonInput);failed.finiteResidual.decay='1';
  assert.equal(fixedStageFinalResidualComparison(p,failed).conditionalEstimateVerified,false);
  const outside=plan({logQReciprocal:['3','4'],order:2,truncateAfter:2,derivativeLoss:'1'});
  assert.equal(fixedStageFinalResidualComparison(outside,comparisonInput).conditionalEstimateVerified,false);
});

test('the original positive h remains an exact expression and the relative log window resolves every possibly active term',()=>{
  const f=fixture(new ScalarGraphFixture()),input=scalarInput(f.G),p=prepareSourceScalarFinalWindow(f.G,input),
    result=constructFinalSummationFromRoots(f.G,p,f.input);
  assert.equal(assertFinalSummationWindow(p),true);assert.equal(assertConstructedFinalWindow(result),true);
  assert.deepEqual(p.requiredIncrementIndices,[1,2]);assert.equal(p.firstExcludedIndex,3);
  assert.deepEqual(p.window.relativeLogWindow,['1','3/2']);
  assert.equal(p.window.classifications[1].status,'TRANSITION_OR_ZERO');
  assert.equal(p.sourceExponentDefinitionChecked,true);assert.equal(p.sourceExponentNumericallyRounded,false);
  assert.equal(p.sourceCoefficientNormsAuthenticated,false);assert.equal(p.sourceCommonDomainAuthenticated,false);
  assert.equal(p.originalFinalFieldConstructed,false);assert.equal(result.stages[0].cutoff,f.G.one);
  assert.equal(result.checks.every(row=>row.pass),true);assert.equal(result.fixedUncutStage.stage,1);
  assert.throws(()=>fixedStageFinalResidualComparison(p,comparisonInput),{code:'SOURCE_SCALAR_COMPARISON_REQUIRED'});
  assert.throws(()=>constructFinalSummationFromRoots(new ScalarGraphFixture(),p,f.input),{code:'WRONG_SOURCE_SCALAR_GRAPH'});
  sourceScalarExample={plan:p,result,input,program:f.G.pack({h:f.G.parameter('h'),
    logLower:p.window.logQReciprocalRoots[0],logUpper:p.window.logQReciprocalRoots[1],
    ...Object.fromEntries(result.velocity.map((id,i)=>['velocity_'+i,id]))})};
});

test('the source scalar plan rejects omitted norms, coordinate-dependent bounds and a changed source exponent',()=>{
  let G=new ScalarGraphFixture(),input=scalarInput(G);input.rows[1].bounds.pop();
  assert.throws(()=>prepareSourceScalarFinalWindow(G,input),{code:'INCOMPLETE_SOURCE_NORM_PREFIX'});
  G=new ScalarGraphFixture();input=scalarInput(G);input.rows[0].bounds[0].constantRoot=G.var('sample');
  assert.throws(()=>prepareSourceScalarFinalWindow(G,input),/source-only/);
  G=new ScalarGraphFixture();input=scalarInput(G);G.source.parametersExactExpressions.h={integer:0};
  assert.throws(()=>prepareSourceScalarFinalWindow(G,input),{code:'CHANGED_ORIGINAL_EXPONENT'});
});

test('the source scalar plan retains its exact graph seal and returns no resolved plan when work is exhausted',()=>{
  const G=new ScalarGraphFixture(),input=scalarInput(G);
  assert.throws(()=>prepareSourceScalarFinalWindow(G,{...input,maxWork:2}),{code:'RESOURCE_LIMIT'});
  const p=prepareSourceScalarFinalWindow(G,input),root=p.schedule.stages[0].logScaleRoot;
  G.nodes[root].args[0]=G.zero;
  assert.throws(()=>assertFinalSummationWindow(p),{code:'INVALID_WINDOW_PLAN'});
});

test('preserve the independent-check artifact with all generic and source boundaries explicit',async()=>{
  assert.ok(example&&comparison&&sourceScalarExample);
  const thresholds=[];
  for(const constant of ['1/9','7/3','100'])for(const logPower of [0,1,4])for(const gain of ['1/7','3','11/2'])
    for(const stage of [1,4])thresholds.push(exactLogarithmicTailThreshold({constant,logPower,gain,stage}));
  const variedSchedules=[1,3].map(scale=>checkedShrinkingCutoffSchedule({logQ0Reciprocal:String(scale),
    rows:Array.from({length:6},(_,i)=>({stage:i+1,gain:String(scale*(i+1))+'/7',
      bounds:Array.from({length:i+2},(_,order)=>({order,constant:String(5**(i+1)+order)+'/3',logPower:order}))}))}));
  const artifact={schema:'MathScope.N6.FinalSummationConsumerFixture/1',example,comparison,thresholds,variedSchedules,sourceScalarExample,
    sourceNormsAuthenticated:false,actualOriginalFinalFieldConstructed:false,originalCriterionPromoted:false,wholeM3Complete:false};
  if(process.env.MATHSCOPE_FINAL_SUMMATION_ARTIFACT)await writeFile(process.env.MATHSCOPE_FINAL_SUMMATION_ARTIFACT,JSON.stringify(artifact,null,2)+'\n');
});
