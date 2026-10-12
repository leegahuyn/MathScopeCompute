import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareGlobalSourceBand} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../source-global-representative.mjs';
import {attachGlobalCurrentState} from '../source-global-current.mjs';
import {attachGlobalMomentCurrent} from '../source-global-moment.mjs';
import {attachGlobalCurrentPressure} from '../source-global-pressure.mjs';
import {attachGlobalTemporalInverse} from '../source-global-temporal.mjs';
import {attachGlobalInitializedMean,globalInitializedMeanCertificate} from '../source-global-initial-mean.mjs';
import {attachGlobalInitializedAngular,assertGlobalInitializedAngular,globalInitializedAngularCertificate} from '../source-initialized-angular.mjs';
import {attachGlobalForcedCurrent,assertGlobalForcedCurrent,globalForcedCurrentCertificate} from '../source-global-forced-current.mjs';
import {prepareOriginalMeanMapOperatorSeminorms,originalMeanMapOperatorCertificate} from '../source-fixed-mean-majorants.mjs';
import {attachInitializedMeanOperatorMajorants,assertInitializedMeanOperatorMajorants} from '../source-initialized-mean-majorants.mjs';
import {attachGlobalInitializedMeanStress,attachGlobalForcedMeanStress,assertGlobalUpdatedMeanStress,globalUpdatedMeanStressCertificate} from '../source-global-updated-mean-stress.mjs';

let meanTask,initialStressTask,angularTask,task,majorants,majorantFailure,stressTask,lastResourceCheck=0;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_FORCED_CURRENT '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)throw Object.assign(Error('The owned actual forced current exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{if(Date.now()-lastResourceCheck>1000){lastResourceCheck=Date.now();observe({stage:'bounded-actual-forced-current-memory-checkpoint'});}}};
async function save(name,value){if(process.env[name])await writeFile(process.env[name],JSON.stringify(value,null,2)+'\n');globalThis.gc?.();}
const getMean=()=>meanTask??=Promise.resolve().then(async()=>{
  const band=prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},context),representative=attachGlobalFixedRepresentative(band,context),
    current=attachGlobalCurrentState(representative,context),template=attachGlobalMomentCurrent(current,context),
    pressure=attachGlobalCurrentPressure(current,context),temporal=attachGlobalTemporalInverse(pressure,context),
    mean=attachGlobalInitializedMean(temporal,template,context);
  await save('M3_FORCED_CURRENT_MEAN_PARTIAL',await globalInitializedMeanCertificate(mean));
  // This additional class-operator leaf is independently checked. A leaf
  // failure must not prevent the already authenticated current from being
  // used to construct and save its separate angular/forced source. The
  // dedicated test still fails and the complete gate cannot pass.
  try{
    const norms=await prepareOriginalMeanMapOperatorSeminorms({order:1,maxNodes:300000,maxWork:10000},context);
    majorants=attachInitializedMeanOperatorMajorants(mean,norms);
    assertInitializedMeanOperatorMajorants(majorants);
    await save('M3_FORCED_CURRENT_MAJORANT_PARTIAL',{
      schema:majorants.schema,source:majorants.source,coordinateBinding:majorants.coordinateBinding,
      fixedDefinitionChecks:majorants.fixedDefinitionChecks,units:majorants.units,currentDefects:majorants.currentDefects,
      actualCoefficientChecks:majorants.actualCoefficientChecks,operatorBounds:majorants.operatorBounds,
      implications:majorants.implications,checks:majorants.checks,scope:majorants.scope,
      fixedOperator:await originalMeanMapOperatorCertificate(norms),actualInitializedMeanAttachmentExecuted:true,
      actualInputClassNormsAvailable:false
    });
  }catch(error){
    majorantFailure=error;
    await save('M3_FORCED_CURRENT_MAJORANT_FAILURE',{
      schema:'MathScope.N6.ActualOptionalMeanMajorantFailure/1',pass:false,
      error:{name:error.name,message:error.message,code:error.code??null,stack:error.stack},
      actualMeanSavedBeforeLeaf:true,actualInputClassNormsAvailable:false,
      angularConstructionIndependentlyRequiresPrivateUnchangedMean:true
    });
    observe({stage:'optional-actual-mean-majorant-failed-core-source-will-still-be-checked',message:error.message});
  }
  return mean;
});
const getInitialized=()=>angularTask??=getMean().then(async mean=>{
  const initialized=attachGlobalInitializedAngular(mean,context);
  await save('M3_FORCED_CURRENT_INITIALIZED_PARTIAL',await globalInitializedAngularCertificate(initialized));
  return initialized;
});
const get=()=>task??=getInitialized().then(async initialized=>{
  const forced=attachGlobalForcedCurrent(initialized,context);
  await save('M3_FORCED_CURRENT_EVIDENCE',await globalForcedCurrentCertificate(forced));
  return forced;
});

const getInitialStress=()=>initialStressTask??=getMean().then(async mean=>{
  const result=attachGlobalInitializedMeanStress(mean,context);
  await save('M3_FORCED_CURRENT_INITIAL_STRESS_EVIDENCE',await globalUpdatedMeanStressCertificate(result));
  return result;
});

const getStress=()=>stressTask??=get().then(async forced=>{
  const result=attachGlobalForcedMeanStress(forced,context);
  await save('M3_FORCED_CURRENT_STRESS_EVIDENCE',await globalUpdatedMeanStressCertificate(result));
  return result;
});

test('the fixed original mean seminorm operator is actually bound to the same newly recomputed P/J and all five source coefficients',async()=>{
  const mean=await getMean();if(majorantFailure)throw majorantFailure;
  assert.equal(majorants.mean,mean);assert.equal(assertInitializedMeanOperatorMajorants(majorants),true);
  assert.ok(majorants.checks.every(x=>x.pass));assert.ok(majorants.fixedDefinitionChecks.every(x=>x.pass));
  assert.ok(majorants.actualCoefficientChecks.every(x=>x.pass));
  assert.equal(majorants.operatorBounds.length,2);assert.ok(majorants.operatorBounds.every(x=>x.graphNamespace==='operator.G'));
  assert.equal(majorants.scope.actualFixedSourceOperatorBoundToNewCurrentDefects,true);
  for(const key of ['actualCurrentInputClassBoundsCertified','fullInitializedStateClassCertified','originalProp9_5Proved','wholeN6Complete'])
    assert.equal(majorants.scope[key],false,key);
});

test('the original Corollary8.5 stress is separately constructed from the actual newly initialized mean before any forced update',async()=>{
  const s=await getInitialStress(),mean=await getMean();
  assert.equal(assertGlobalUpdatedMeanStress(s),true);assert.equal(s.input,mean);assert.equal(s.G,mean.G);
  assert.equal(s.source.kind,'after-mean');assert.equal(s.source.earlierPreTemporalSigmaReused,false);
  assert.equal(s.source.latestFullMeanPressure,mean.stages.moments.pressure.value);
  assert.equal(s.stress.meanInput.Etheta,mean.stages.moments.mean.Etheta);
  assert.equal(s.stress.meanInput.Ez,mean.stages.moments.mean.Ez);
  assert.equal(s.compatibility.rawIntegralNodesPreserved,true);assert.equal(s.compatibility.mechanicalRawIntegralReduction,false);
  assert.ok(s.checks.every(x=>x.pass));assert.ok(s.compatibility.rows.every(r=>r.theoremReducedWeightedWhole===s.G.zero));
  assert.equal(s.scope.actualLatestMeanTangentialStressConstructed,true);assert.equal(s.scope.actualCor8_5SourceCompatibilityApplied,true);
  for(const key of ['subsequentSignedCovarianceUpdateConstructed','completeFourStepCycle','initializedJ0','completeN6','numericalWholeFieldEnclosure'])
    assert.equal(s.scope[key],false,key);
});

test('the full angular source uses the actual temporal-before-moment field and all original physical pressure parts',async()=>{
  const a=await getInitialized(),mean=a.mean,p=mean.temporal.pressure,G=a.G;
  assert.equal(assertGlobalInitializedAngular(a),true);assert.equal(mean.G,G.baseGraph);
  assert.equal(a.source.actualTemporalBeforeMomentSequence,true);assert.equal(a.reference.fullOriginalReferenceFieldPulledBack,true);
  assert.equal(a.reference.ownLabelBackgroundIdentityAssumedInstead,false);
  for(let j=0;j<3;j++)assert.equal(G.expressionSystem(a.reference.functions.velocity[j]).body,a.reference.roots.velocity[j]);
  assert.equal(G.expressionSystem(a.reference.functions.pressure).body,G.add(p.current.band.fields.pressure,mean.stages.moments.pressure.value));
  assert.equal(a.global.pressure,G.add(a.reference.roots.pressure,a.initial.global.pressure.nonzeroAngular));
});

test('all ten exact original lift templates and all162 reference maps retain every scale inside the actual differentiated body',async()=>{
  const a=await getInitialized(),G=a.G;assert.equal(a.templates.length,10);
  assert.deepEqual([...new Set(a.templates.map(t=>t.levelDifference))],[0,1,2,3,4]);
  for(const t of a.templates){assert.ok(t.lift.checks.every(x=>x.pass));assert.deepEqual(t.nonzeroAngularForcing.map(r=>r.m),[-2,-1,1,2]);
    assert.equal(t.coefficientVerification.pass,true);assert.equal(t.coefficientVerification.actualDirectMinusDecomposedRecomputed,true);}
  for(const id of a.application.definitions){const d=G.periodicIndexedSystem(id);assert.equal(d.rows.length,162);assert.equal(d.directions.length,6);
    assert.ok(d.rows.every(r=>r.coefficient===G.one&&r.derivativeMaps.flat().every(x=>x.coefficient===G.one)));}
  assert.ok(a.application.systems.flat().every(s=>s.allScaleFactorsInsideDifferentiatedBody));
});

test('every current nonzero coefficient is actually inverted with the complete normal pressure and its exact negative counterpart',async()=>{
  const s=await get(),G=s.G;assert.equal(s.templates.length,10);assert.equal(s.assembly.exactPositiveSourceSystems,20);
  assert.equal(s.assembly.exactNegativeConjugateSolutionRoutes,20);
  for(const t of s.templates){assert.ok(t.conjugacy.every(x=>x.pass));assert.equal(t.forced.length,2);
    for(const f of t.forced){assert.equal(f.inverse.G,G.forcedGraph);assert.equal(f.inverse.input.m,f.m);
      assert.deepEqual(f.inputRoots,t.originalSourceRows.find(r=>r.m===f.m).value);
      assert.equal(f.bound.everyOriginalSourceBodyRetained,true);assert.ok(f.inverse.identities.checks.every(x=>x.pass));
      assert.deepEqual(f.signedSolutions.map(x=>x.m),[f.m,-f.m]);assert.ok(f.signedSolutions[1].checks.every(x=>x.pass));
      assert.equal(f.inverse.scope.completeComplexSourceUsed,true);assert.equal(f.inverse.limit.allActualMatrixSourceAndTimeDerivativeBodiesGenerated,true);}
  }
  assert.equal(s.source.primaryCoefficientsRepurposedAsForcedSolutions,false);
});

test('the original full-source H_w path, zero-data support ideal and every mapped curl commutator are retained',async()=>{
  const s=await get();
  for(const t of s.templates){assert.ok(t.support.checks.every(x=>x.pass));assert.equal(t.support.wholeMeanCoefficientKept,true);
    for(const f of t.forced){assert.ok(f.path.checks.every(x=>x.pass));assert.equal(f.path.preimagesIdentified,false);
      assert.ok(f.pullback.every(z=>['real','imaginary'].every(p=>z[p].check.pass)));
      assert.equal(f.sourcePathInvariance.matrixIndependentOfBasepointN,true);
      assert.equal(f.mapped.identities.everyCommonYChainTermRetained,true);assert.equal(f.mapped.scope.fullCurlRemainderRetained,true);
      assert.equal(f.mapped.scope.complexPressureRetained,true);assert.equal(f.mapped.cutoff.path.principalCutoffResidualDeclaredZero,false);}
  }
});

test('the new full W and mean pressure are rebuilt from every primary-plus-forced angular coefficient',async()=>{
  const s=await get(),p=s.input.mean.temporal.pressure,G=s.G;
  for(const t of s.templates){assert.deepEqual(t.covariance.modes,[-2,-1,1,2]);assert.ok(t.covariance.checks.every(x=>x.pass));}
  for(const [name,field]of Object.entries(s.assembly.covarianceFields)){
    assert.equal(field.contributions,162);assert.equal(field.directions.length,5);assert.notEqual(field.root,p.covariance.fullAngularMean[name]);
    assert.equal(G.freeCoordinates(field.root).has(s.global.geometry.theta),false);
  }
  assert.equal(s.mean.mean.fullAngularCovariance,s.mean.fullCurrentCovariance);assert.equal(s.mean.mean.fullOriginalStress,p.residual.fullOriginalStress);
  assert.equal(s.mean.velocity,s.input.mean.stages.moments.velocity);assert.notEqual(s.mean.pressure.value,s.mean.previousPressure);
  assert.equal(s.mean.pressure.cutoffRemainderDeclaredZero,false);assert.equal(s.mean.pressure.endpointTerms.endpointTermsDeclaredZero,false);
  assert.equal(s.global.pressure,G.add(s.global.originalBackgroundPressure,s.global.fullMeanPressure,s.global.allAngularPressure));
});

test('all next modes through four and both complete physical residual paths keep the pressure update, old flat terms and quadratic remainder',async()=>{
  const s=await get(),G=s.G;
  for(const t of s.templates){assert.deepEqual(t.waveResidual.map(r=>r.m),[-4,-3,-2,-1,0,1,2,3,4]);
    assert.deepEqual(t.nextAngularSource.map(r=>r.m),[-4,-3,-2,-1,1,2,3,4]);assert.ok(t.residualChecks.every(x=>x.pass));
    assert.equal(t.update.newQuadraticRemainderRetained,true);assert.equal(t.update.oldFlatResidualRetained,true);assert.equal(t.update.pressureRefreshedFromIncrement,true);
    assert.deepEqual(t.update.discardedModes,[]);assert.equal(t.update.incrementDivergence.length>0,true);}
  assert.equal(s.global.direct.angularConvolutionUsed,false);
  assert.ok(s.global.direct.conservativeResidual.every(x=>G.freeCoordinates(x).has(s.global.geometry.theta)));
  assert.equal(s.assembly.fullMeanWaveProductsRetained,true);assert.equal(s.assembly.crossLabelProductsRemovedOnlyByActualSupportIdealAndOriginalDisjointness,true);
});

test('private updated-current authority rejects edited source coefficients, pressure or completion flags',async()=>{
  const s=await get();assert.equal(assertGlobalForcedCurrent(s),true);
  assert.throws(()=>assertGlobalForcedCurrent({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,name,bad]of [[s.templates[0].forced[0].inputRoots[0],'real',s.G.zero],[s.global,'pressure',s.G.zero],[s.scope,'originalN602Complete',true]]){
    const old=object[name];object[name]=bad;try{assert.throws(()=>assertGlobalForcedCurrent(s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[name]=old;}
  }
  assert.equal(assertGlobalForcedCurrent(s),true);
});

test('the observed actual substep remains separate from a numerical field enclosure, derivative audit and all-stage class acceptance',async()=>{
  const s=await get();assert.ok(s.checks.every(x=>x.pass));
  for(const key of ['actualOriginalForcedAngularSubstepConstructed','actualCompleteUpdatedCurrentConstructed','everyCurrentNonzeroModeUsedAsSource',
    'allOriginalAndNewPressureTermsRetained','allNextFiniteHarmonicsConstructed'])assert.equal(s.scope[key],true,key);
  for(const key of ['sourceDerivativeClosureAudited','numericalWholeFieldEnclosure','originalProp9_5ClassBoundsEstablished','initializedJ0',
    'allCorrectionStagesConstructed','originalN602Complete','originalN603Complete','completeN6'])assert.equal(s.scope[key],false,key);
});

test('the latest source Corollary8.5 stress uses the new full W and mean pressure while retaining raw compatibility integrals',async()=>{
  const s=await getStress(),f=await get();assert.equal(assertGlobalUpdatedMeanStress(s),true);assert.equal(s.input,f);
  assert.ok(s.checks.every(x=>x.pass));assert.equal(s.source.earlierPreTemporalSigmaReused,false);
  assert.equal(s.source.latestFullMeanPressure,f.mean.pressure.value);assert.equal(s.source.latestCovariance,f.mean.fullCurrentCovariance);
  assert.equal(s.stress.meanInput.P,f.mean.mean.P);assert.equal(s.stress.meanInput.Jtheta,f.mean.mean.Jtheta);
  assert.equal(s.stress.meanInput.Jz,f.mean.mean.Jz);assert.equal(s.Sigma.length,2);
  assert.equal(s.compatibility.rawIntegralNodesPreserved,true);assert.equal(s.compatibility.mechanicalRawIntegralReduction,false);
  assert.ok(s.compatibility.rows.every(r=>Number.isSafeInteger(r.rawWeightedSourceWhole)&&Number.isSafeInteger(r.rawCutoffRemainder)));
  assert.equal(s.scope.actualLatestMeanTangentialStressConstructed,true);assert.equal(s.scope.actualCor8_5SourceCompatibilityApplied,true);
  for(const key of ['sourceDerivativeClosureAudited','allOrderUniformClassBoundsEstablished','subsequentSignedCovarianceUpdateConstructed',
    'completeFourStepCycle','initializedJ0','completeN6','numericalWholeFieldEnclosure'])assert.equal(s.scope[key],false,key);
  assert.throws(()=>assertGlobalUpdatedMeanStress({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
