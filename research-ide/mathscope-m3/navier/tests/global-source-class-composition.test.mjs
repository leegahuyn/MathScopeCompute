import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareActualCommonAdmissibleFamily,actualCommonAdmissibleFamilyCertificate}
  from '../../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {actualCommonTargetWeightedNormCertificate}
  from '../../../mathscope-m2/navier/actual-common-target-weighted-norms.mjs';
import {clearDisposableThirdJetCaches} from '../../../mathscope-m2/navier/actual-third-jet-ftc.mjs';
import {attachGlobalSourceBand} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../source-global-representative.mjs';
import {attachGlobalCurrentState,globalCurrentStateCertificate} from '../source-global-current.mjs';
import {attachGlobalPrimaryClassOperator,globalPrimaryClassOperatorCertificate}
  from '../source-primary-class-majorants.mjs';
import {attachGlobalCurrentPressure,globalCurrentPressureCertificate} from '../source-global-pressure.mjs';
import {attachGlobalCommonYCovarianceClass,globalCommonYCovarianceClassCertificate}
  from '../source-common-y-class-majorants.mjs';
import {attachGlobalBackgroundClass,assertGlobalBackgroundClass,globalBackgroundClassCertificate}
  from '../source-background-class-majorants.mjs';
import {prepareOriginalRadialClassMajorants,originalRadialClassMajorantCertificate}
  from '../source-radial-class-majorants.mjs';
import {attachGlobalRadialPressureClass,assertGlobalRadialPressureClass,globalRadialPressureClassCertificate}
  from '../source-global-pressure-class-majorants.mjs';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';

// This is a new coherent C4 family. The earlier successful C3/order0
// packet is neither relabelled nor mutated to supply a missing derivative.
const certificates={};let primaryTask,commonTask,backgroundTask,pressureTask,lastCheck=0;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,
    rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_SOURCE_CLASS '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)
    throw Object.assign(Error('The owned coherent original-class source process exceeded its declared memory budget.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{
  if(Date.now()-lastCheck>1000){lastCheck=Date.now();observe({stage:'owned-coherent-class-memory-checkpoint'});}
}};
const save=async(name,value,canonical=false)=>{
  if(process.env.MATHSCOPE_SOURCE_CLASS_DIRECTORY)
    await writeFile(process.env.MATHSCOPE_SOURCE_CLASS_DIRECTORY+'/'+name,
      (canonical?canonicalStringify(value):JSON.stringify(value,null,2))+'\n');
};
const dispose=(...graphs)=>{for(const G of new Set(graphs))if(G)clearDisposableThirdJetCaches(G);global.gc?.();};

const getPrimary=()=>primaryTask??=Promise.resolve().then(async()=>{
  const family=prepareActualCommonAdmissibleFamily({throughOrder:2,derivativeOrder:4,maxNodes:5000000,
    maxProfileJets:60000,maxJetRequests:600000},context);
  certificates.family=await actualCommonAdmissibleFamilyCertificate(family);
  await save('actual-common-C4-family.json',certificates.family);
  dispose(family.G);observe({stage:'actual-coherent-C4-family-saved',nodes:family.G.nodes.length});
  const band=attachGlobalSourceBand(family,{coefficientOrder:1,maxNodes:4000000},context),
    current=attachGlobalCurrentState(attachGlobalFixedRepresentative(band,context),context);
  certificates.current=await globalCurrentStateCertificate(current);
  await save('actual-primary-current.json',certificates.current);
  dispose(current.G,family.G);observe({stage:'actual-coherent-current-saved',nodes:current.G.nodes.length});
  const target=family.constructTargetWeightedNorms({derivativeOrder:2,maxNodes:6000000,maxJetRequests:600000},context);
  certificates.target=await actualCommonTargetWeightedNormCertificate(target);
  await save('actual-target-weighted-norm-program.json',target.program,true);
  await save('actual-target-weighted-norm-certificate.json',certificates.target);
  dispose(target.G);observe({stage:'actual-coherent-target-C2-saved',nodes:target.G.nodes.length});
  const p=attachGlobalPrimaryClassOperator(current,target,{order:1,maxWork:200000},context);
  certificates.primary=await globalPrimaryClassOperatorCertificate(p);
  await save('actual-primary-class.json',certificates.primary);
  dispose(p.G,current.G);observe({stage:'actual-coherent-primary-C1-saved',normNodes:p.G.nodes.length,sourceNodes:current.G.nodes.length});
  return p;
});

const getCommon=()=>commonTask??=Promise.resolve().then(async()=>{
  const p=await getPrimary(),pressure=attachGlobalCurrentPressure(p.current,context);
  certificates.fullPressure=await globalCurrentPressureCertificate(pressure);
  await save('actual-pre-haar-pressure.json',certificates.fullPressure);
  dispose(pressure.G,p.G);observe({stage:'actual-coherent-pre-Haar-pressure-saved',nodes:pressure.G.nodes.length});
  const y=attachGlobalCommonYCovarianceClass(p,pressure,{maxWork:200000},context);
  certificates.commonY=await globalCommonYCovarianceClassCertificate(y);
  await save('actual-common-Y-covariance-class.json',certificates.commonY);
  dispose(y.G,pressure.G);observe({stage:'actual-coherent-common-Y-C1-saved',normNodes:y.G.nodes.length});
  return y;
});

const getBackground=()=>backgroundTask??=Promise.resolve().then(async()=>{
  const y=await getCommon(),b=attachGlobalBackgroundClass(y.primary,{order:1,maxWork:200000},context);
  certificates.background=await globalBackgroundClassCertificate(b);
  await save('actual-complete-background-class.json',certificates.background);
  dispose(b.G,b.current.G);observe({stage:'actual-full-background-C1-saved',normNodes:b.G.nodes.length});return b;
});

const getPressure=()=>pressureTask??=Promise.resolve().then(async()=>{
  const y=await getCommon();await getBackground();
  const pole=Math.max(...y.bounds.rows.slice(0,2).map(r=>r.fields.fullCovariance.pole)),
    radial=await prepareOriginalRadialClassMajorants({order:0,pole,ibpOrder:1,maxNodes:1000000,maxWork:200000},context);
  certificates.fixedRadial=await originalRadialClassMajorantCertificate(radial);
  await save('actual-fixed-radial-class-operator.json',certificates.fixedRadial);
  observe({stage:'actual-fixed-radial-operator-saved-before-composition',nodes:radial.G.nodes.length,pole});
  const p=attachGlobalRadialPressureClass(y,radial,{order:0,ibpOrder:0,maxWork:200000},context);
  certificates.radial=await globalRadialPressureClassCertificate(p);
  await save('actual-full-radial-pressure-class.json',certificates.radial);
  dispose(p.G,p.pressure.G,radial.G);observe({stage:'actual-full-gr-P-T0-class-packet-saved',normNodes:p.G.nodes.length});return p;
});

test('new source class attachments reject supplied norms, copied records and completion labels',()=>{
  for(const fake of [{},{sourceAuthenticated:true},{scope:{actualCompleteInitialN6TupleClassCertified:true}}]){
    assert.throws(()=>attachGlobalBackgroundClass(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>attachGlobalRadialPressureClass(fake,{}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  }
});

test('a new private original C4 family actually generates target C2 and primary C1 on the same source',async()=>{
  const p=await getPrimary(),family=p.current.band.family;
  assert.equal(family.request.derivativeOrder,4);assert.equal(family.request.throughOrder,2);
  assert.equal(p.request.order,1);assert.equal(p.target.family,family);
  assert.equal(p.bounds.backgroundRow.backgroundDerivativeOrder,4);
  assert.deepEqual(p.bounds.targetRows.map(r=>[r.derivativeOrder,r.pole]),[[0,3],[1,6],[2,9]]);
  assert.deepEqual(p.bounds.rows.map(r=>r.order),[0,1]);assert.ok(p.checks.every(r=>r.pass));
  assert.notEqual(p.G,p.current.G);assert.equal(p.source.oldM2PhysicalBandSealUsed,false);
  assert.equal(p.domain.oneFinitePrefixClaimedValidAtAllQ,false);
});

test('both original pulse systems, all H columns, normal pressure and complete curl squares remain',async()=>{
  const p=await getPrimary(),G=p.current.G;
  assert.deepEqual(p.sourcePulseBindings.map(r=>r.sign),[1,-1]);
  for(const r of p.covariance.sourceRows){
    assert.equal(r.homogeneousPressure===G.zero,false);assert.ok(r.pressureChecks.every(c=>c.pass));
    assert.equal(r.actualTangency.pass,true);assert.deepEqual(r.actualIntegralColumn,r.originalHColumn);
    assert.equal(Object.keys(r.remainder).length,6);assert.ok(Object.values(r.remainder).some(x=>x!==G.zero));
  }
  assert.equal(p.covariance.leadingCovarianceCancellationExecuted,true);
  assert.equal(p.covariance.fullCovarianceDeclaredEqualToTarget,false);
});

test('the complete actual pre-Haar covariance now has every total first slow and two-torus derivative norm',async()=>{
  const y=await getCommon();assert.ok(y.checks.every(r=>r.pass));
  assert.equal(y.scope.actualFiniteDerivativeOrder,1);assert.equal(y.mapping.mapRows.length,162);
  assert.equal(y.mapping.indexedRows.length,6);assert.equal(y.bounds.noAuxiliaryIntegrationMassInserted,true);
  assert.deepEqual(y.bounds.rows.map(r=>r.order),[0,1]);
  assert.ok(y.mapping.mapRows.every(r=>r.exactXiColumns&&r.exactPulseColumns&&r.exactDerivativeMaps&&r.allMapCoefficientsFrozen));
  for(const r of y.bounds.rows)for(const f of Object.values(r.fields))assert.equal(y.G.freeCoordinates(f.constant).size,0);
  assert.equal(y.mapping.haarAverageSubstituted,false);
});

test('the same actual background binds full radial cutoff terms, all source FTC faces and higher-stress epsilon cubed',async()=>{
  const b=await getBackground();assert.ok(b.checks.every(r=>r.pass));assert.equal(b.request.order,1);
  assert.equal(b.sourceNorms.leadingFTC.length,3);assert.ok(b.sourceNorms.leadingFTC.every(r=>r.faces.length===4));
  assert.equal(b.binding.literalCompleteRadialBracket,true);assert.equal(b.binding.literalStressNormalization,true);
  assert.ok(b.binding.allPositiveRows.every(r=>r.exactOriginalCoefficients&&r.exactCommonScale&&r.entireRadialCutoffCommutator));
  assert.ok(b.rows.every(r=>r.b.epsilonExponent==='1'&&r.bMinusLeading.epsilonExponent==='3'&&
    r.higherStress.epsilonExponent==='3'&&r.fullStress.epsilonExponent==='1'));
  assert.deepEqual(b.rows.map(r=>r.finiteWeightedStress[0].pole),[3,6]);
  assert.equal(b.binding.originalBackgroundFlatResidualRetained,true);
  for(const r of b.rows)for(const key of ['F','G','b','higherStress','fullStress'])assert.equal(b.G.freeCoordinates(r[key].constant).size,0);
});

test('actual complete gr, whole P, rho P and the full shifted pressure receive source-only order0 constants',async()=>{
  const p=await getPressure();assert.ok(p.checks.every(r=>r.pass));assert.equal(p.request.order,0);
  assert.equal(p.demand.requiredCommonYCovarianceOrder,1);assert.equal(p.commonY.scope.actualFiniteDerivativeOrder,1);
  assert.equal(p.sourceBinding.force.value,p.pressure.radial.gr);
  assert.equal(p.sourceBinding.actualPressure,p.pressure.pressure.value);
  assert.deepEqual(p.sourceBinding.force.cylindricalSigns,[-1,-1,-1,-1,1]);
  assert.equal(p.rows[0].gr.epsilonExponent,'1-kappa_s');
  assert.equal(p.rows[0].P.wholeNormalizedHaarProjection,true);assert.equal(p.rows[0].P.independentOfRAndY,true);
  for(const key of ['gr','P','rhoP','centeredSource','pressure','fullPhysicalRadialDerivative','radialPressureDefect','cutoffA0'])
    assert.equal(p.G.freeCoordinates(p.rows[0][key].constant).size,0);
  assert.equal(p.fixedConstantCopy.sourceNumericalValuesUsed,false);
});

test('the retained full cutoff pressure remainder has an unimproved norm without a false flatness or higher-derivative promotion',async()=>{
  const p=await getPressure(),b=await getBackground();
  assert.equal(p.rows[0].cutoffA0.flatnessClaimed,false);assert.equal(p.rows[0].cutoffA0.positiveEpsilonGain,false);
  assert.equal(p.rows[0].sourceRadialDerivativeBoundUsesExactIdentity,true);assert.equal(p.rows[0].cutoffGains.length,0);
  assert.equal(p.pendingCutoffGains[0].demand.requiredCommonYCovarianceOrder,6);
  assert.equal(p.pendingCutoffGains[0].requiredNormRowAlreadyGenerated,false);
  assert.equal(p.scope.actualCutoffAllOrdersFlatnessCertified,false);
  for(const x of [p,b])for(const key of ['actualCompleteInitialN6TupleClassCertified','allFiniteIterationStagesClassCertified','completeN6'])
    assert.equal(x.scope[key],false);
  assert.equal(b.scope.unchangedBackgroundFlatResidualRetained,true);
  assert.throws(()=>attachGlobalRadialPressureClass(p.commonY,p.radial,{order:0,ibpOrder:1}),{code:'RESOURCE_LIMIT'});
});

test('changed source coefficients, altered norm constants and forged completion records fail the private attachment guards',async()=>{
  const p=await getPressure(),b=await getBackground();
  assert.throws(()=>assertGlobalBackgroundClass({...b}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertGlobalRadialPressureClass({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [x,check,object,key,bad]of [
    [b,assertGlobalBackgroundClass,b.scope,'actualCompleteInitialN6TupleClassCertified',true],
    [p,assertGlobalRadialPressureClass,p.scope,'actualCutoffAllOrdersFlatnessCertified',true],
    [p,assertGlobalRadialPressureClass,p.rows[0].pressure,'constant',p.G.zero],
    [b,assertGlobalBackgroundClass,b.binding,'literalCompleteRadialBracket',false]]){
    const saved=object[key];object[key]=bad;
    try{assert.throws(()=>check(x),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[key]=saved;}
  }
  const id=b.rows[0].higherStress.constant,old=b.G.nodes[id];b.G.nodes[id]={op:'rational',args:['0','1']};
  try{assert.throws(()=>assertGlobalBackgroundClass(b),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{b.G.nodes[id]=old;}
});

test('complete additive norm programs retain actual parent hashes and explicit source versus norm namespaces',async()=>{
  await getPressure();const {primary,target,current,commonY,fullPressure,background,radial,fixedRadial}=certificates;
  assert.deepEqual(primary.program.targetBase,target.graph);assert.deepEqual(primary.program.currentBase,current.graph);
  assert.deepEqual(commonY.parents.primary,primary.graph);assert.deepEqual(commonY.parents.pressure,fullPressure.graph);
  assert.deepEqual(background.parent,primary.graph);assert.deepEqual(radial.parents.commonY,commonY.graph);
  assert.deepEqual(radial.parents.fixedRadial,fixedRadial.graph);
  for(const c of [primary,commonY,background,radial,fixedRadial])
    assert.equal(c.graph.sha256,await sha256(canonicalStringify(c.program)));
  assert.equal(radial.integerRootsAreExactSourceExpressions,true);assert.equal(radial.numericalNormValuesComputed,false);
  assert.equal(radial.graph.requiresCompleteAuthenticatedParentPrograms,true);
  observe({stage:'actual-coherent-class-composition-verification-finished',completeInitialClass:false,completeN6:false});
});
