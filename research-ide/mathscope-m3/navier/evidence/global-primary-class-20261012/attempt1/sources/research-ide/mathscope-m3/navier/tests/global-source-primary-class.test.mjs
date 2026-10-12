import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareGlobalSourceBand} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../source-global-representative.mjs';
import {attachGlobalCurrentState,assertGlobalCurrentState,globalCurrentStateCertificate} from '../source-global-current.mjs';
import {actualCommonTargetWeightedNormCertificate} from '../../../mathscope-m2/navier/actual-common-target-weighted-norms.mjs';
import {clearDisposableThirdJetCaches} from '../../../mathscope-m2/navier/actual-third-jet-ftc.mjs';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';
import {attachGlobalPrimaryClassOperator,assertGlobalPrimaryClassOperator,globalPrimaryClassOperatorCertificate}
  from '../source-primary-class-majorants.mjs';
import {attachGlobalCurrentPressure,globalCurrentPressureCertificate} from '../source-global-pressure.mjs';
import {attachGlobalCommonYCovarianceClass,assertGlobalCommonYCovarianceClass,globalCommonYCovarianceClassCertificate}
  from '../source-common-y-class-majorants.mjs';

let task,lastCheck=0,certificate;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_PRIMARY_CLASS '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)
    throw Object.assign(Error('The owned actual primary class source process exceeded its declared memory budget.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{if(Date.now()-lastCheck>1000){lastCheck=Date.now();observe({stage:'owned-primary-class-memory-checkpoint'});}}};
const save=async(name,value,canonical=false)=>{if(process.env.MATHSCOPE_PRIMARY_CLASS_DIRECTORY)
  await writeFile(process.env.MATHSCOPE_PRIMARY_CLASS_DIRECTORY+'/'+name,(canonical?canonicalStringify(value):JSON.stringify(value,null,2))+'\n');};
const get=()=>task??=Promise.resolve().then(async()=>{
  const band=prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},context),
    current=attachGlobalCurrentState(attachGlobalFixedRepresentative(band,context),context);
  await save('actual-primary-current.json',await globalCurrentStateCertificate(current));
  clearDisposableThirdJetCaches(current.G);clearDisposableThirdJetCaches(band.family.G);global.gc?.();
  observe({stage:'actual-primary-current-saved-before-new-norm-leaf',nodeCount:current.G.nodes.length});
  const target=band.family.constructTargetWeightedNorms({derivativeOrder:1,maxNodes:5000000,maxJetRequests:300000},context),
    targetCertificate=await actualCommonTargetWeightedNormCertificate(target);
  await save('actual-target-weighted-norm-program.json',target.program,true);
  await save('actual-target-weighted-norm-certificate.json',targetCertificate);
  clearDisposableThirdJetCaches(target.G);global.gc?.();
  observe({stage:'actual-target-norms-saved-before-primary-class-attachment',nodeCount:target.G.nodes.length});
  const p=attachGlobalPrimaryClassOperator(current,target,{order:0,maxWork:100000},context);
  certificate=await globalPrimaryClassOperatorCertificate(p);
  await save('actual-primary-class.json',certificate);
  observe({stage:'actual-primary-class-packet-saved',nodeCount:p.G.nodes.length,currentNodes:current.G.nodes.length});
  return p;
});

test('actual primary class authority requires a private current and actual target norm, never a receipt or supplied completion',()=>{
  for(const fake of [{},{scope:{actualOriginalPrimaryWOneHalfClassCertified:true}},{sourceAuthenticated:true}])
    assert.throws(()=>attachGlobalPrimaryClassOperator(fake,{}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('the same actual original current executes its C3, target C1 and source-only fixed coefficient norm construction',async()=>{
  const p=await get(),G=p.G;
  assert.equal(assertGlobalPrimaryClassOperator(p),true);assert.equal(assertGlobalCurrentState(p.current),true);
  assert.ok(p.checks.every(x=>x.pass));assert.equal(p.request.order,0);
  assert.equal(p.target.family,p.current.band.family);assert.notEqual(G,p.current.G);
  assert.equal(p.bounds.backgroundRow.backgroundDerivativeOrder,3);
  assert.deepEqual(p.bounds.targetRows.map(x=>x.derivativeOrder),[0,1]);
  assert.deepEqual(p.bounds.targetRows.map(x=>x.pole),[3,6]);
  assert.equal(p.bounds.coefficientConstants.sourceOnly,true);
  assert.ok(p.bounds.targetRows.every(x=>G.freeCoordinates(x.N_m).size===0));
  assert.equal(p.source.oldM2PhysicalBandSealUsed,false);
});

test('both original stable matrices, pressure normal terms and their unchanged positive H inverse are attached',async()=>{
  const p=await get(),G=p.current.G,band=p.current.band;
  assert.deepEqual(p.sourcePulseBindings.map(x=>x.sign),[1,-1]);
  for(const [j,row]of p.sourcePulseBindings.entries()){
    const f=band.families[j];assert.equal(row.system,f.system);assert.equal(row.originalP,f.P);
    assert.deepEqual(row.originalMatrix,G.covarianceSystems[f.system].matrix);
    assert.ok(row.binding.checks.every(x=>x.pass));assert.equal(row.originalPositiveA,band.target.squareRootWeights[j]);
    assert.ok(row.sameOriginalTimeCutoff&&row.sourceAmplitudeBodyMatches&&row.frozenReferenceAndCarrier);
    const c=p.covariance.sourceRows[j];assert.ok(c.actualTangency.pass&&c.pressureChecks.every(x=>x.pass));
    assert.deepEqual(c.actualIntegralColumn,c.originalHColumn);assert.equal(c.squareRootDefinition.radicand,band.target.weights[j]);
    assert.notEqual(c.homogeneousPressure,G.zero);
  }
});

test('the leading covariance cancels by the complete partition while all six actual full-curl remainders remain',async()=>{
  const p=await get(),G=p.current.G,c=p.covariance;
  assert.equal(c.leadingCovarianceCancellationExecuted,true);assert.equal(c.fullCovarianceDeclaredEqualToTarget,false);
  assert.equal(p.current.assembly.partition.partition.rows.length,81);
  assert.equal(Object.keys(c.fullGlobalHaar).length,6);
  for(const row of c.sourceRows){
    assert.equal(Object.keys(row.remainder).length,6);assert.ok(Object.values(row.remainder).some(x=>x!==G.zero));
    assert.ok(row.guardChecks.every(x=>x.pass));assert.ok(row.angularFactorChecks.every(x=>x.pass));
  }
  assert.equal(p.bounds.haarRows[0].everyCandidateRetained,true);
  assert.equal(p.bounds.haarRows[0].pointActiveCountSubstitutedForWholeInventory,false);
  assert.match(p.bounds.haarRows[0].exactComparison,/ratio=Q_ref\/Q_label/);
});

test('the norm leaf preserves its genuine prefix window and does not claim all high derivative graphs or the complete initial tuple',async()=>{
  const p=await get(),band=p.current.band;
  assert.deepEqual(p.domain.actualWindow,band.window);
  assert.equal(p.domain.nextScale,band.family.selector.rows[1].scale);
  assert.equal(p.domain.oneFinitePrefixClaimedValidAtAllQ,false);
  assert.equal(p.domain.sameCommonThresholdForAllFixedOrders,true);
  assert.equal(p.scope.actualOriginalPrimaryWOneHalfClassCertified,true);
  assert.equal(p.scope.actualOriginalPrimaryPressureWOneClassCertified,true);
  assert.equal(p.scope.actualFullCurlRemainderWOneMinusKappaClassCertified,true);
  for(const name of ['allIntegerDerivativeGraphsLiterallyExecuted','actualPostTemporalFiveMapClassCertified',
    'actualForcedInputWClassCertified','actualShiftedRadialPressureClassCertified','actualCompleteInitialN6TupleClassCertified',
    'allFiniteIterationStagesClassCertified','completeN6'])assert.equal(p.scope[name],false);
  assert.throws(()=>attachGlobalPrimaryClassOperator(p.current,p.target,{order:1}),{code:'RESOURCE_LIMIT'});
});

test('private source, weighted norm roots and altered class claims are rejected, including actual coefficient-body mutation',async()=>{
  const p=await get();assert.throws(()=>assertGlobalPrimaryClassOperator({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,key,bad]of [[p.bounds,'K',p.G.one],[p.source,'oldM2PhysicalBandSealUsed',true],
    [p.scope,'actualCompleteInitialN6TupleClassCertified',true],[p.domain,'oneFinitePrefixClaimedValidAtAllQ',true]]){
    const saved=object[key];object[key]=bad;
    try{assert.throws(()=>assertGlobalPrimaryClassOperator(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[key]=saved;}
  }
  const root=p.bounds.rows[0].fields.primary.constant,old=p.G.nodes[root];p.G.nodes[root]={op:'rational',args:['0','1']};
  try{assert.throws(()=>assertGlobalPrimaryClassOperator(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.G.nodes[root]=old;}
  assert.equal(assertGlobalPrimaryClassOperator(p),true);
});

test('the additive packet retains complete new constant bodies and exact links to both authenticated base programs',async()=>{
  const p=await get(),c=certificate;
  assert.equal(c.graph.sha256,await sha256(canonicalStringify(c.program)));
  assert.equal(c.program.targetBase.sha256,c.sourceTarget.graph.sha256);
  assert.equal(c.program.currentBase.sha256,c.sourceCurrent.graph.sha256);
  assert.equal(c.graph.normAddedNodes,c.program.norm.nodes.length);
  assert.equal(c.graph.currentAddedNodes,c.program.current.nodes.length);
  assert.equal(c.graph.requiresCompleteAuthenticatedTargetBaseProgram,true);
  assert.equal(c.sourceTarget.graph.sha256,await sha256(canonicalStringify(p.target.program)));
  assert.equal(c.sourceCurrent.sourceBand.upstreamSource.graph.sha256,'bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219');
  p.G.fresh('separate-expression-after-primary-class-certificate');
  assert.equal(assertGlobalPrimaryClassOperator(p),true);
  observe({stage:'actual-primary-class-verification-finished',normNodes:c.graph.normNodeCount,primaryClassOnly:true});
});

test('the same actual primary source supplies the full pre-Haar common-Y covariance with every original derivative column',async()=>{
  const p=await get();clearDisposableThirdJetCaches(p.current.G);clearDisposableThirdJetCaches(p.G);global.gc?.();
  const pressure=attachGlobalCurrentPressure(p.current,context);
  await save('actual-pre-haar-pressure.json',await globalCurrentPressureCertificate(pressure));
  clearDisposableThirdJetCaches(pressure.G);global.gc?.();
  const y=attachGlobalCommonYCovarianceClass(p,pressure,{},context),c=await globalCommonYCovarianceClassCertificate(y);
  await save('actual-common-Y-covariance-class.json',c);
  assert.equal(assertGlobalCommonYCovarianceClass(y),true);assert.ok(y.checks.every(x=>x.pass));
  assert.equal(y.mapping.mapRows.length,162);assert.equal(y.mapping.indexedRows.length,6);
  assert.ok(y.mapping.mapRows.every(r=>r.exactXiColumns&&r.exactPulseColumns&&r.exactDerivativeMaps&&r.allMapCoefficientsFrozen));
  assert.equal(y.mapping.haarAverageSubstituted,false);assert.equal(y.bounds.noAuxiliaryIntegrationMassInserted,true);
  assert.equal(y.scope.actualPreHaarCommonYCovarianceClassCertified,true);
  assert.equal(y.scope.actualCompleteInitialN6TupleClassCertified,false);assert.equal(y.scope.completeN6,false);
  assert.equal(c.graph.addedNodes,c.program.nodes.length);
  assert.equal(c.graph.sha256,await sha256(canonicalStringify(c.program)));
  assert.equal(c.program.normBaseOffset,c.parents.primary.normNodeCount);
  const r=y.mapping.mapRows[0],saved=r.exactPulseColumns;r.exactPulseColumns=false;
  try{assert.throws(()=>assertGlobalCommonYCovarianceClass(y),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{r.exactPulseColumns=saved;}
  assert.equal(assertGlobalCommonYCovarianceClass(y),true);
  observe({stage:'actual-primary-and-complete-common-Y-class-verification-finished',normNodes:c.graph.nodeCount,
    pressureNodes:pressure.G.nodes.length,completeInitialClass:false});
});
