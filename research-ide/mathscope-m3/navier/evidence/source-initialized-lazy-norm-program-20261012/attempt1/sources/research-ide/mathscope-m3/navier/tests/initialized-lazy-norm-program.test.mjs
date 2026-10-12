import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {originalInitializedNormProgramStructure,originalInitializedNormProgramProducerReferences,
  attachOriginalInitializedLazyNormProgram,assertOriginalInitializedLazyNormProgram,
  originalInitializedNormMaterializationDemand,materializeOriginalInitializedLazyNormProgram,
  assertOriginalInitializedFiniteNormInstantiation,originalInitializedLazyNormProgramCertificate}
  from '../source-initialized-lazy-norm-program.mjs';
import {attachActualCommonTargetWeightedNorms} from '../../../mathscope-m2/navier/actual-common-target-weighted-norms.mjs';
import {rectangularSourceFTC} from '../../../mathscope-m2/navier/actual-background-physical-seminorms.mjs';
import {prepareOriginalRadialClassMajorants} from '../source-radial-class-majorants.mjs';
import {prepareOriginalMeanMapOperatorSeminorms} from '../source-fixed-mean-majorants.mjs';
import {attachGlobalPostTemporalDefectClass,attachGlobalInitializedMeanInputClasses}
  from '../source-global-fresh-mean-class-majorants.mjs';

const fixtures={},programs=[0,2].map(order=>originalInitializedNormProgramStructure({order}));

test('complete initialized C0 demand is derived from the original finite operator losses',()=>{
  const p=programs[0],d=p.sourceDemand;
  assert.deepEqual(d,{backgroundSlowOrder:15,targetWeightedOrder:13,primaryOrder:12,commonYOrder:12,
    backgroundClassOrder:11,pressureOrder:11,initialResidualOrder:10,temporalOrder:5,freshDefectOrder:3,
    fixedFiveOrder:2,finiteCoefficientPrefix:11,fullWeightedStressDerivativeOrder:11,
    requiredPrimaryRadialPole:84,requiredFreshRadialPole:168});
  assert.equal(p.scalarProgram.scalarCompositionExecuted,true);
  assert.equal(p.scalarProgram.sourceDerivativeBodyCallsExecuted,false);
  assert.equal(p.callGraph.calls.length,13);assert.equal(p.callGraph.entry,12);
});

test('every producer call has its fixed same-source dependencies and no arbitrary leaf',()=>{
  for(const p of programs){
    const calls=p.callGraph.calls;
    assert.deepEqual(calls.map(c=>c.producer),['target','primary','commonY','background','radial','fourier','radial','five',
      'pressure','initialResidual','temporal','fresh','initialized']);
    assert.deepEqual(calls.map(c=>c.dependencies),[[],[0],[1],[1],[],[],[],[],[2,4],[8,3],[9,5,4],[10,6],[11,7]]);
    assert.deepEqual(p.callGraph.leaves,[0,4,5,6,7]);assert.equal(p.callGraph.sameSourceLeaf,0);
    assert.ok(calls.every((c,j)=>c.id===j&&c.dependencies.every(k=>k<j)&&!c.callerCallableSupplied&&!c.derivativeBodiesMaterialized));
    assert.equal(calls[5].request.inversePower,1);
  }
});

test('scalar AST contains only closed selected producer results and exact finite arithmetic',()=>{
  for(const p of programs){
    for(const [id,n]of p.scalarProgram.nodes.entries()){
      assert.ok(['rational','source_norm_result','add','multiply','integer_power','sqrt_positive','maximum'].includes(n.op));
      if(n.op==='rational'){assert.ok(BigInt(n.args[0])>=0n);assert.ok(BigInt(n.args[1])>0n);continue;}
      if(n.op==='source_norm_result'){
        const c=p.callGraph.calls[n.args[0]];assert.ok(c);
        assert.ok(['commonY','background','radial','fourier','five'].includes(c.producer));
        assert.ok(n.args[1].length>0&&n.args[1].every(k=>typeof k==='string'||Number.isSafeInteger(k)&&k>=0));continue;
      }
      const children=n.op==='integer_power'?n.args.slice(0,1):n.args;
      assert.ok(children.every(k=>Number.isSafeInteger(k)&&k>=0&&k<id));
    }
    assert.equal(p.scalarProgram.allLeavesClosedProducerResults,true);
  }
});

test('all actual imported norm producer function identities are available to a separate private binder',()=>{
  const r=originalInitializedNormProgramProducerReferences();
  assert.ok(Object.isFrozen(r));assert.ok(Object.values(r).every(f=>typeof f==='function'));
  assert.equal(r.target,attachActualCommonTargetWeightedNorms);assert.equal(r.rectangularFTC,rectangularSourceFTC);
  assert.equal(r.radial,prepareOriginalRadialClassMajorants);assert.equal(r.five,prepareOriginalMeanMapOperatorSeminorms);
  assert.equal(r.fresh,attachGlobalPostTemporalDefectClass);assert.equal(r.initialized,attachGlobalInitializedMeanInputClasses);
  assert.throws(()=>{r.target=()=>1;},TypeError);
  fixtures.producerKeys=Object.keys(r);fixtures.producersAreActualImportedFunctions=true;
});

test('full new Jz pressure moment, both T0 cutoff remainders and all five-map targets remain in the scalar graph',()=>{
  for(const p of programs){
    assert.ok(p.freshProducts.rows.every(r=>r.allFiveGrGroupsRetained&&!r.pressureMomentDiscarded&&r.JzParts.pressureMoment.constant!==0));
    assert.ok(p.postPressure.every(r=>r.cutoffA0.constant!==0&&r.fullCutoffRemainderKept&&!r.positiveIBPGainApplied));
    assert.ok(p.updatedPressure.every(r=>r.cutoffA0.constant!==0&&r.fullCutoffRemainderKept&&!r.allOrdersCutoffFlatnessClaimed));
    for(const [j,row]of p.fiveProducts.rows.entries()){
      assert.equal(row.inputOrder,j+1);assert.equal(row.allThreeFreshInputNorms.length,3);
      assert.deepEqual(row.allThreeFreshInputNorms.map(f=>f.constant),['P','Jtheta','Jz'].map(k=>p.freshProducts.rows[j+1].defects[k].constant));
      assert.equal(row.fields.beta.epsilonExponent,'2-kappa_s');assert.equal(row.fields.v.epsilonExponent,'1-kappa_s');
    }
  }
});

test('the nonlinear initialized exponents and the quadratic projection pole follow the full products',()=>{
  for(const p of programs){
    assert.equal(p.sourceDemand.requiredFreshRadialPole,2*p.sourceDemand.requiredPrimaryRadialPole);
    for(const row of p.rows){
      assert.equal(row.velocity.beta.epsilonExponent,'2-kappa_s');
      assert.equal(row.velocity.v.epsilonExponent,'1-kappa_s');assert.equal(row.velocity.gamma.epsilonExponent,'1-kappa_s');
      assert.equal(row.fullGr.epsilonExponent,'1-kappa_s');assert.equal(row.fullPressure.epsilonExponent,'1-kappa_s');
      assert.ok(Object.values(row.freshDefects).every(f=>f.epsilonExponent==='2-2*kappa_s'&&f.pole===0&&f.weight==='1'));
      assert.equal(row.fullNonlinearRemainder.noNewNonlinearDefectDeclaredZero,true);
    }
  }
});

test('a requested order above the historical twelve-jet evaluator cap remains a finite unflattened program',()=>{
  const p=originalInitializedNormProgramStructure({order:13,maxWork:500000});
  assert.equal(p.rows.length,14);assert.equal(p.sourceDemand.backgroundSlowOrder,28);
  assert.equal(p.sourceDemand.targetWeightedOrder,26);assert.equal(p.sourceDemand.fixedFiveOrder,15);
  assert.ok(p.scalarProgram.nodes.length<50000);assert.equal(p.scope.actualHighOrderSourceDerivativeBodiesMaterialized,false);
  fixtures.higherOrder={request:p.request,sourceDemand:p.sourceDemand,nodeCount:p.scalarProgram.nodes.length,
    finalRows:p.rows.map(r=>({order:r.order,defectExponents:Object.values(r.freshDefects).map(f=>f.epsilonExponent)})),scope:p.scope};
});

test('a caller cannot supply norm values, producer strings, replacement metadata or unbounded work',()=>{
  for(const input of [{norm:1},{producer:'target'},{targetNorm:()=>1},{sourceSHA256:'a'.repeat(64)},
    {power:1},{pole:1},{order:-1},{order:0.5},{order:Number.MAX_SAFE_INTEGER},{maxWork:0},{maxNodes:0},{order:0,maxNodes:2}])
    assert.throws(()=>originalInitializedNormProgramStructure(input));
});

test('structure records and source hashes never become live or materialized private source authority',async()=>{
  const fake=[{},programs[0],structuredClone(programs[0]),{source:programs[0].sourceDemand,scope:{actualSourceIdentityAuthenticated:true}},
    {targetNormProducer:attachActualCommonTargetWeightedNorms,sourceSHA256:'a'.repeat(64)}];
  for(const p of fake){
    assert.throws(()=>attachOriginalInitializedLazyNormProgram(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>assertOriginalInitializedLazyNormProgram(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>originalInitializedNormMaterializationDemand(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>assertOriginalInitializedFiniteNormInstantiation(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
    await assert.rejects(materializeOriginalInitializedLazyNormProgram(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
    await assert.rejects(originalInitializedLazyNormProgramCertificate(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
  }
  for(const p of programs){
    assert.equal(p.scope.actualSourceIdentityAuthenticated,false);assert.equal(p.scope.actualFinitePrivateNormAttachmentExecuted,false);
    assert.equal(p.scope.originalAllFiniteSourceRecipeAuthenticated,false);assert.equal(p.scope.completeN6,false);
  }
});

after(async()=>{
  if(process.env.MATHSCOPE_INITIALIZED_LAZY_NORM_DIRECTORY)await writeFile(
    process.env.MATHSCOPE_INITIALIZED_LAZY_NORM_DIRECTORY+'/initialized-lazy-norm-program.json',
    JSON.stringify({schema:'MathScope.N6.InitializedLazyNormProgramFixtures/1',programs,fixtures,
      actualPrivateCurrentIdentityUsed:false,actualHighOrderSourceLeafMaterializationExecuted:false,
      actualSameSourceSavedBinderTestSeparate:true,completeN6:false},null,2)+'\n');
});
