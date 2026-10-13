import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {openSavedInitializedSource,savedInitializedSourceProgram} from '../source-saved-initialized-authority.mjs';
import {attachSavedInitializedNormFamily,constructSavedInitializedNormProgram} from '../source-saved-initialized-norm-family.mjs';
import {attachSavedInitializedCutoffAuthority} from '../source-saved-initialized-cutoff-norms.mjs';
import {attachSavedFiveMeanChangeNorms,assertSavedFiveMeanChangeNorms,savedFiveMeanChangeNormCertificate} from '../source-saved-five-mean-change-norms.mjs';

let pending;
const observations=[];
async function setup(){
  if(!pending)pending=(async()=>{
    const cap=await openSavedInitializedSource(),source=savedInitializedSourceProgram(cap),family=attachSavedInitializedNormFamily(cap),
      cutoff=await attachSavedInitializedCutoffAuthority(family),parent=constructSavedInitializedNormProgram(family,{order:4});
    return {cap,source,family,cutoff,parent};
  })();
  return pending;
}

test('C0 and C2 complete five-map changes bind the actual original initialized source',async()=>{
  const {cap,source,cutoff,parent}=await setup();
  for(const order of [0,2]){
    const r=attachSavedFiveMeanChangeNorms(cap,parent,cutoff,{order});
    assert.equal(assertSavedFiveMeanChangeNorms(r),true);
    assert.equal(r.source.sourceNodePrefixSHA256,cap.source.sourceNodePrefixSHA256);
    assert.equal(r.source.sourceNodeCount,3615866);
    assert.deepEqual(r.sourceBinding.previous,cap.actualRoots.temporalVelocity);
    assert.deepEqual(r.sourceBinding.updated,cap.actualRoots.initializedVelocity);
    assert.equal(r.sourceBinding.increment.beta,source.mean.potential.deltaBeta);
    assert.equal(r.sourceBinding.increment.gamma,source.mean.potential.gammaDesired);
    assert.equal(r.rows.length,order+1);
    for(const name of ['beta','v','gamma']){
      const identity=r.sourceBinding.velocityIdentities[name];
      assert.equal(identity.increment,r.sourceBinding.increment[name]);
      assert.equal(identity.updated,r.sourceBinding.updated[name]);
      assert.equal(identity.identityValidForArbitraryWholeOperands,true);
    }
    observations.push(await savedFiveMeanChangeNormCertificate(r));
  }
});

test('every original mean product and all four slow groups remain at each mixed order',async()=>{
  const {cap,cutoff,parent}=await setup(),r=attachSavedFiveMeanChangeNorms(cap,parent,cutoff,{order:2});
  for(const row of r.rows){
    assert.equal(Object.values(row.fluxProducts).reduce((n,group)=>n+Object.keys(group).length,0),19);
    assert.deepEqual(Object.keys(row.thetaTerms).sort(),['axial','radial','slowTime','viscous']);
    assert.deepEqual(Object.keys(row.zTerms).sort(),['axial','radial','slowTime','viscous']);
    assert.equal(row.Etheta.epsilonExponentExact,'199997/100000');
    assert.equal(row.Ez.epsilonExponentExact,'199997/100000');
    assert.equal(row.fastTimeCancellationApplied,false);
    assert.equal(row.actualCutoffFlatnessInferred,false);
    assert.ok(row.fluxProducts.thetaRadial.incrementQuadratic);
    assert.ok(row.fluxProducts.thetaAxial.incrementQuadratic);
    assert.ok(row.fluxProducts.zRadial.incrementQuadratic);
    assert.ok(row.fluxProducts.zAxial.incrementSquare);
  }
  assert.equal(r.demand.requiredIncrementVelocityOrder,4);
  assert.equal(r.inputRows.incrementRows.length,5);
  assert.equal(r.inputRows.previousRows.length,4);
});

test('the old and new full pressures, A0 and endpoint terms are not replaced by Haar averages',async()=>{
  const {cap,source,cutoff,parent}=await setup(),r=attachSavedFiveMeanChangeNorms(cap,parent,cutoff,{order:2}),p=r.sourceBinding.pressureDifference;
  assert.equal(p.old,source.mean.stages.temporal.pressure.value);
  assert.equal(p.new,source.mean.stages.moments.pressure.value);
  assert.notEqual(p.old,p.new);
  assert.equal(p.oldA0,source.mean.stages.temporal.pressure.cutoffRemainder);
  assert.equal(p.newA0,source.mean.stages.moments.pressure.cutoffRemainder);
  assert.deepEqual(p.oldEndpointTerms,source.mean.stages.temporal.pressure.endpointTerms);
  assert.deepEqual(p.newEndpointTerms,source.mean.stages.moments.pressure.endpointTerms);
  for(const row of r.inputRows.pressureChangeRows){
    assert.equal(row.before.constant,parent.postPressure[row.order].pressure.constant);
    assert.equal(row.after.constant,parent.updatedPressure[row.order].pressure.constant);
    assert.ok(r.scalarProgram.nodes[row.pressure.constant]);
  }
  assert.deepEqual(r.sourceBinding.unchangedCovariance,cap.actualRoots.covariance);
  assert.deepEqual(r.sourceBinding.unchangedStress,cap.actualRoots.originalStress);
  assert.deepEqual(r.sourceBinding.originalFreshTargets,cap.actualRoots.freshInputDefects);
  assert.deepEqual(r.sourceBinding.retainedNonlinearDefects,cap.actualRoots.retainedRemainderDefects);
});

test('the complete source norm prefix and every deferred producer result are retained',async()=>{
  const {cap,cutoff,parent}=await setup(),r=attachSavedFiveMeanChangeNorms(cap,parent,cutoff,{order:2});
  assert.deepEqual(r.scalarProgram.nodes.slice(0,r.scalarProgram.parentPrefixCount),parent.scalarProgram.nodes);
  assert.deepEqual(r.callGraph,parent.callGraph);
  for(const node of r.scalarProgram.nodes.filter(n=>n.op==='source_norm_result')){
    assert.ok(r.callGraph.calls[node.args[0]]);
    assert.ok(Array.isArray(node.args[1])&&node.args[1].length);
  }
  assert.equal(r.scalarProgram.sourceNormValuesNumericallyEvaluated,false);
  assert.equal(r.sourceBinding.sourceFiles.length,3);
});

test('copied capabilities, parents and cutoff records cannot issue source-bound results',async()=>{
  const {cap,cutoff,parent}=await setup();
  assert.throws(()=>attachSavedFiveMeanChangeNorms(structuredClone(cap),parent,cutoff,{order:0}));
  assert.throws(()=>attachSavedFiveMeanChangeNorms(cap,structuredClone(parent),cutoff,{order:0}));
  assert.throws(()=>attachSavedFiveMeanChangeNorms(cap,parent,structuredClone(cutoff),{order:0}));
  const r=attachSavedFiveMeanChangeNorms(cap,parent,cutoff,{order:0});
  assert.throws(()=>assertSavedFiveMeanChangeNorms(structuredClone(r)),{code:'INVALID_SAVED_FIVE_MEAN_CHANGE'});
  assert.throws(()=>assertSavedFiveMeanChangeNorms({...r}),{code:'INVALID_SAVED_FIVE_MEAN_CHANGE'});
});

test('omitted derivative orders, caller norm values and insufficient budgets are rejected',async()=>{
  const {cap,family,cutoff,parent}=await setup(),short=constructSavedInitializedNormProgram(family,{order:1});
  assert.throws(()=>attachSavedFiveMeanChangeNorms(cap,short,cutoff,{order:0}),{code:'RESOURCE_LIMIT'});
  for(const input of [{order:-1},{order:0.5},{order:3},{order:0,norm:1},{order:0,sourceHash:'fake'},{order:0,maxNodes:2},{order:0,maxWork:1}])
    assert.throws(()=>attachSavedFiveMeanChangeNorms(cap,parent,cutoff,input));
});

test('changes to actual roots, full pressure, scalar constants and completion flags invalidate the seal',async()=>{
  const {cap,cutoff,parent}=await setup();
  const changes=[r=>{r.sourceBinding.increment.v=0;},r=>{r.sourceBinding.pressureDifference.old=r.sourceBinding.pressureDifference.new;},
    r=>{r.rows[0].Etheta.constant=0;},r=>{r.rows[0].fluxProducts.zAxial.incrementSquare.constant=0;},
    r=>{r.scope.wholeM3Complete=true;},r=>{r.scope.originalN601Complete=true;}];
  for(const change of changes){
    const r=attachSavedFiveMeanChangeNorms(cap,parent,cutoff,{order:0});change(r);
    assert.throws(()=>assertSavedFiveMeanChangeNorms(r),{code:'INVALID_SAVED_FIVE_MEAN_CHANGE'});
  }
});

test('recorded source premises and genuinely unfinished original criteria stay explicit',async()=>{
  const {cap,cutoff,parent}=await setup(),r=attachSavedFiveMeanChangeNorms(cap,parent,cutoff,{order:0});
  assert.equal(r.scope.actualSavedFiveMapSourceBound,true);
  assert.equal(r.scope.actualFiniteSlowResidualNormCompositionExecuted,true);
  assert.equal(r.scope.fastTimeUsesRecordedNoAuxiliaryDependencePremise,true);
  for(const key of ['newIndependentFastTimeZeroCheck','actualWholeMeanDifferenceRecomputed','temporalFastCancellationApplied',
    'initialHaarAndPositiveIBPCutoffCompositionApplied','actualHighOrderDerivativeBodiesMaterialized','completeInitialTupleClassCertified',
    'originalN601Complete','originalN602Complete','completeN6','wholeM3Complete'])assert.equal(r.scope[key],false);
  const certificate=await savedFiveMeanChangeNormCertificate(r);
  assert.deepEqual(certificate.program,r);
  assert.match(certificate.graph.sha256,/^[a-f0-9]{64}$/);
  assert.equal(certificate.serializedCertificateIsNotPrivateSourceAuthority,true);
});

after(async()=>{
  if(process.env.M3_SAVED_FIVE_CHANGE_EVIDENCE&&observations.length)await writeFile(process.env.M3_SAVED_FIVE_CHANGE_EVIDENCE,
    JSON.stringify({schema:'MathScope.N6.SavedFiveMeanChangeObserved/1',certificates:observations,
      sourceNormValuesAreNotNumericalSamples:true,wholeM3Complete:false},null,2)+'\n',{flag:'wx'});
});
