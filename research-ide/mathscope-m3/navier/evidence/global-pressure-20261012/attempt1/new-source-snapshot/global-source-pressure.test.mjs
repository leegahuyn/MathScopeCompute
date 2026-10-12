import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareGlobalSourceBand} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../source-global-representative.mjs';
import {attachGlobalCurrentState,assertGlobalCurrentState} from '../source-global-current.mjs';
import {attachGlobalCurrentPressure,assertGlobalCurrentPressure,globalCurrentPressureCertificate} from '../source-global-pressure.mjs';

let task,lastResourceCheck=0;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_PRESSURE '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)throw Object.assign(Error('Own global auxiliary pressure source process exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{if(Date.now()-lastResourceCheck>1000){lastResourceCheck=Date.now();observe({stage:'bounded-global-pressure-memory-checkpoint'});}}};
const get=()=>task??=Promise.resolve().then(()=>{
  const band=prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},context),representative=attachGlobalFixedRepresentative(band,context),
    current=attachGlobalCurrentState(representative,context);
  return attachGlobalCurrentPressure(current,context);
});

test('all81 original slow boxes and both signs retain the actual full-curl local bodies on a common torus',async()=>{
  const s=await get(),{G,current,cover}=s;assert.equal(assertGlobalCurrentState(current),true);
  assert.equal(G.baseGraph,current.G);assert.equal(G.nodes,current.G.nodes);
  assert.equal(cover.rows.length,81);assert.equal(new Set(cover.rows.map(x=>x.key)).size,81);
  for(const row of cover.rows){assert.equal(row.signs.length,2);assert.equal(row.countInGlobalSum,1);assert.equal(row.guards.length,5);
    assert.deepEqual(row.signs.map(x=>x.sign),[1,-1]);}
  for(const [name,field]of Object.entries(cover.fields)){
    const def=G.periodicIndexedSystem(field);assert.equal(def.rows.length,162);
    assert.equal(def.sourceRecipe.originalCurrentCovariance,current.covariance.fullAuxiliaryMean[name]);
    assert.ok(def.rows.every(x=>x.derivativeMaps.length===5&&x.derivativeMaps[3].length===2&&x.derivativeMaps[4].length===2));
  }
});

test('all requested full-torus derivatives materialize original local bodies before labels and periodic lifts',async()=>{
  const s=await get(),closure=s.closure;
  assert.equal(closure.allRequestedSharedBodiesMaterialized,true);assert.equal(closure.allDeclaredCoverRowsRetained,true);
  assert.ok(closure.indexedPartials.length>=6);assert.ok(closure.indexedPartials.every(x=>x.rows===162&&x.allDeclaredRowsRetained&&!x.labelsDifferentiated&&!x.torusNearestCopyDifferentiated));
  assert.ok(closure.indexedPartials.some(x=>x.orders[3]>0));assert.ok(closure.indexedPartials.some(x=>x.orders[4]>0));
  assert.ok(closure.indexedPartials.some(x=>x.orders[0]+x.orders[1]>0));
  assert.equal(closure.baseClosure.allRequestedSharedBodiesMaterialized,true);
  assert.ok(closure.baseClosure.pulseBlocks.length>0);assert.ok(closure.baseClosure.pulseBlocks.every(x=>x.allCoefficientAndTimeDerivativeBodiesGenerated));
  assert.equal(closure.numericalValuesOrEnclosures,false);
});

test('the complete radial pressure retains both original torus directions and the actual cutoff residual',async()=>{
  const s=await get(),{G,geometry,pressure}=s;
  assert.equal(pressure.identity.pass,true);assert.ok(s.checks.every(x=>x.pass));
  assert.notEqual(pressure.value,s.current.mean.pressure.value);assert.notEqual(pressure.cutoffRemainder,G.zero);
  assert.equal(pressure.cutoffRemainderDeclaredZero,false);
  assert.equal(pressure.actualAuxiliaryZeroMode,s.current.mean.pressure.value);
  assert.ok(geometry.Y.every(y=>G.freeCoordinates(pressure.value).has(y)));
  assert.ok([pressure.integrals,pressure.radialAuxiliaryIntegrals,pressure.slowZIntegrals].every(x=>x.endpointCheck.pass));
  assert.deepEqual(s.residual.fullOriginalStress,s.current.mean.residual.fullOriginalStress);
  assert.notEqual(s.residual.Etheta,G.zero);assert.notEqual(s.residual.Ez,G.zero);
});

test('the normalized Haar identity retains the old actual means with no extra covering multiplicity',async()=>{
  const s=await get(),{G,cover}=s;
  assert.deepEqual(s.covariance.fullAuxiliaryMean,s.current.covariance.fullAuxiliaryMean);
  assert.equal(s.radial.P,s.current.mean.P);assert.equal(cover.proof.haarInvariance.noExtraCoveringMultiplicity,true);
  assert.equal(cover.proof.haarInvariance.mechanicalIntegralReduction,false);
  assert.deepEqual(cover.proof.haarInvariance.coveringDegrees,['1','14','196','2744','38416']);
  assert.equal(cover.proof.integerRange.minimum,0);assert.equal(cover.proof.integerRange.maximum,4);
  assert.ok(cover.bands.every(x=>x.matrix.noInverseTorusCoverUsed));
  assert.equal(s.geometry.ci,G.mul(G.exp(G.mul(cover.baseIndex,G.log(s.current.band.geometry.Tg))),
    G.exp(G.mul(G.add(G.one,s.current.band.constants.h),G.log(s.current.band.geometry.Q)))));
});

test('the private complete-pressure source rejects changed cover entries or premature initialization claims',async()=>{
  const s=await get();assert.throws(()=>assertGlobalCurrentPressure({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,name,bad]of [[s.scope,'initializedJ0',true],[s.pressure,'value',s.G.zero],
    [s.cover.rows[0],'countInGlobalSum',2],[s.cover.proof.haarInvariance,'noExtraCoveringMultiplicity',false]]){
    const saved=object[name];object[name]=bad;try{assert.throws(()=>assertGlobalCurrentPressure(s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[name]=saved;}
  }
  assert.equal(assertGlobalCurrentPressure(s),true);
  for(const name of ['actualTemporalMeanInverseApplied','actualFiveMomentsAfterTemporalApplied','initializedJ0','allOrderTargetClassBoundsCertified','completeN6'])assert.equal(s.scope[name],false);
  assert.equal(s.residual.nonzeroAngularWaveResidualSeparate,true);
});

test('the observed pressure certificate pins the complete current source and all newly generated auxiliary derivatives',async()=>{
  const s=await get(),certificate=await globalCurrentPressureCertificate(s);
  assert.match(certificate.graph.sha256,/^[a-f0-9]{64}$/);assert.ok(certificate.graph.deltaNodeCount>0);
  assert.equal(certificate.sourceCurrent.sourceBand.upstreamSource.graph.sha256,'bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219');
  assert.equal(certificate.numericalIntegralValues,false);assert.equal(certificate.scope.completeN6,false);
  observe({stage:'global-source-pressure-certificate-ready',nodeCount:s.G.nodes.length,deltaNodes:certificate.graph.deltaNodeCount});
  if(process.env.M3_N6_GLOBAL_PRESSURE_EVIDENCE)await writeFile(process.env.M3_N6_GLOBAL_PRESSURE_EVIDENCE,JSON.stringify(certificate,null,2)+'\n');
});
