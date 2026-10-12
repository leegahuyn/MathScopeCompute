import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareGlobalSourceBand} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../source-global-representative.mjs';
import {attachGlobalCurrentState} from '../source-global-current.mjs';
import {attachGlobalCurrentPressure,assertGlobalCurrentPressure} from '../source-global-pressure.mjs';
import {attachGlobalInitialAngularState,assertGlobalInitialAngularState,globalInitialAngularCertificate,auditGlobalInitialAngularDerivatives} from '../source-global-angular.mjs';

let task,audit,lastResourceCheck=0;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_ANGULAR '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)throw Object.assign(Error('Owned actual angular source process exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{if(Date.now()-lastResourceCheck>1000){lastResourceCheck=Date.now();observe({stage:'bounded-global-angular-memory-checkpoint'});}}};
const get=()=>task??=Promise.resolve().then(()=>{
  const band=prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},context),representative=attachGlobalFixedRepresentative(band,context),
    current=attachGlobalCurrentState(representative,context),pressure=attachGlobalCurrentPressure(current,context);
  return attachGlobalInitialAngularState(pressure,context);
});
const getAudit=async()=>audit??=await auditGlobalInitialAngularDerivatives(await get(),context);

test('the actual complete initial field retains all162 source curl waves and all three physical pressure parts',async()=>{
  const s=await get(),{G,pressure,global:g}=s;assert.equal(assertGlobalCurrentPressure(pressure),true);
  assert.equal(G,pressure.G);assert.equal(g.assembly.completeCoverRows,81);assert.equal(g.assembly.signedContributions,162);
  assert.equal(g.pressure.background,pressure.current.band.fields.pressure);assert.equal(g.pressure.fullAuxiliaryMean,pressure.pressure.value);
  assert.notEqual(g.pressure.nonzeroAngular,G.zero);assert.equal(g.pressure.value,G.add(g.pressure.background,g.pressure.fullAuxiliaryMean,g.pressure.nonzeroAngular));
  for(const field of Object.values(g.assembly.definitions)){
    const definition=G.periodicIndexedSystem(field);assert.equal(definition.rows.length,162);assert.equal(definition.directions.length,6);
    assert.ok(definition.rows.every(row=>row.values.length===10&&row.derivativeMaps.length===6&&row.derivativeMaps[5][0].parameter===9));
    assert.ok(definition.sourceRecipe.physicalAngleRetained&&definition.sourceRecipe.completeLocalFullCurl&&definition.sourceRecipe.homogeneousPrimaryPressureIncluded);
  }
});

test('every authentic primary homogeneous pressure keeps the moving-normal source row and full complex half pair',async()=>{
  const s=await get(),{G,pressure}=s;
  for(const [index,row]of s.local.entries()){
    const current=pressure.current.local.rows[index],family=pressure.current.band.families[index];
    assert.deepEqual(row.primaryPressure.row,family.frame.pressureImaginaryRow);assert.equal(row.primaryPressure.identity.pass,true);
    assert.equal(row.primaryPressure.homogeneousPrimaryNotForcedInverse,true);assert.equal(row.forcedInverseApplied,false);
    const plus=row.waveRows.find(x=>x.m===1),minus=row.waveRows.find(x=>x.m===-1);
    assert.equal(plus.pressure.real,G.zero);assert.equal(plus.pressure.imaginary,G.mul(G.q(1,2),row.primaryPressure.value.imaginary));
    assert.equal(minus.pressure.imaginary,G.neg(plus.pressure.imaginary));
    plus.velocity.forEach((x,j)=>{assert.equal(x.real,G.mul(G.q(1,2),current.curl.leading[j]));assert.equal(x.imaginary,G.mul(G.q(1,2),current.curl.remainder[j]));});
  }
});

test('the complete local source residual includes all m=0,±1,±2, updated pressure and every old-flat/new-quadratic term',async()=>{
  const s=await get();
  for(const row of s.local){
    assert.deepEqual(row.waveResidual.map(x=>x.m),[-2,-1,0,1,2]);assert.deepEqual(row.nonzeroAngularForcing.map(x=>x.m),[-2,-1,1,2]);
    assert.equal(row.update.oldFlatResidualRetained,true);assert.equal(row.update.newQuadraticRemainderRetained,true);assert.equal(row.update.pressureRefreshedFromIncrement,true);
    assert.equal(row.checks.filter(x=>x.id.startsWith('source-local-exact-update-')).length,30);assert.ok(row.checks.every(x=>x.pass));
    assert.deepEqual(row.update.discardedModes,[]);assert.ok(row.update.newQuadraticRemainder.some(x=>x.m===2));
  }
  assert.equal(s.global.oldFlatResidual.numericalZeroAssumed,false);assert.equal(s.global.sourceFiniteModeInventory.completeSignedLabels,162);
});

test('the second residual path uses the actual separated palette while the direct path retains the full sum inside nonlinear products',async()=>{
  const s=await get(),{G,global:g}=s;
  assert.equal(g.crossTerms.allCrossLabelProductsVanish,true);assert.equal(g.crossTerms.actualSmoothDisjointPalette.pass,true);assert.equal(g.crossTerms.originalTorus.pass,true);
  assert.equal(g.crossTerms.arbitraryOverlappingFieldsAccepted,false);assert.equal(g.crossTerms.zeroInferredFromFrequencySeparation,false);
  assert.deepEqual(g.crossTerms.source,s.pressure.cover.proof);assert.equal(g.assembly.normalization.pass,true);
  assert.equal(g.direct.angularConvolutionUsed,false);assert.equal(g.direct.allCylindricalConnectionsRetained,true);
  for(const root of g.direct.conservativeResidual){assert.ok(G.freeCoordinates(root).has(g.geometry.theta));assert.ok(g.geometry.Y.every(y=>G.freeCoordinates(root).has(y)));}
  assert.ok(g.velocity.value.every((x,j)=>x===G.add(g.velocity.background[j],g.velocity.waves[j])));
  assert.ok(g.assembledResidual.every((x,j)=>x===G.add(g.referenceBaseResidual[j],g.assembly.roots['residual_'+j])));
});

test('the complete requested real/angular derivative closure differentiates every actual body before all labels and copies',async()=>{
  const a=await getAudit();assert.equal(a.actualSourceBodiesExecuted,true);assert.ok(a.checks.every(x=>x.pass));
  assert.equal(a.closure.allRequestedSharedBodiesMaterialized,true);assert.equal(a.closure.allDeclaredCoverRowsRetained,true);
  assert.equal(a.closure.baseClosure.allRequestedSharedBodiesMaterialized,true);
  assert.ok(a.closure.indexedPartials.some(x=>x.orders.length===6&&x.orders[5]>0));
  assert.ok(a.closure.indexedPartials.every(x=>x.rows===162&&x.allDeclaredRowsRetained&&!x.labelsDifferentiated&&!x.torusNearestCopyDifferentiated));
  assert.ok(a.closure.baseClosure.pulseBlocks.every(x=>x.allCoefficientAndTimeDerivativeBodiesGenerated));
});

test('changed source pressure, local mode inventories and premature final-field claims cannot retain the private seal',async()=>{
  const s=await get();assert.throws(()=>assertGlobalInitialAngularState({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,name,bad]of [[s.global.pressure,'value',s.G.zero],[s.local[0],'forcedInverseApplied',true],[s.scope,'initializedJ0',true],
    [s.global.crossTerms,'allCrossLabelProductsVanish',false],[s.global.sourceFiniteModeInventory,'maximumLocalHarmonic',1]]){
    const old=object[name];object[name]=bad;try{assert.throws(()=>assertGlobalInitialAngularState(s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[name]=old;}
  }
  assert.equal(assertGlobalInitialAngularState(s),true);
  for(const name of ['actualPostTemporalCurrent','forcedNonzeroInverseApplied','allCorrectionStagesConstructed','directGlobalNumericalResidualEnclosure','initializedJ0','originalN602Complete','originalN603Complete','completeN6'])
    assert.equal(s.scope[name],false);
});

test('the source certificate and derivative audit retain exact graph/source bindings and the explicit remaining stage limits',async()=>{
  const s=await get(),certificate=await globalInitialAngularCertificate(s),a=await getAudit();
  assert.match(certificate.graph.sha256,/^[a-f0-9]{64}$/);assert.match(a.graph.sha256,/^[a-f0-9]{64}$/);
  assert.equal(certificate.sourcePressure.sourceCurrent.sourceBand.upstreamSource.graph.sha256,'bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219');
  assert.equal(certificate.numericalSourceValues,false);assert.equal(a.forcedCorrectionExecuted,false);
  const result={schema:'MathScope.N6.GlobalActualInitialAngularObservedSource/1',certificate,derivativeAudit:a};
  observe({stage:'global-angular-source-certificate-ready',nodeCount:s.G.nodes.length});
  if(process.env.M3_N6_GLOBAL_ANGULAR_EVIDENCE)await writeFile(process.env.M3_N6_GLOBAL_ANGULAR_EVIDENCE,JSON.stringify(result,null,2)+'\n');
});
