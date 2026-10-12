import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareGlobalSourceBand} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../source-global-representative.mjs';
import {attachGlobalCurrentState,assertGlobalCurrentState} from '../source-global-current.mjs';
import {attachGlobalSignedCurrent,assertGlobalSignedCurrent,auditGlobalSignedDerivatives} from '../source-global-signed.mjs';

let task,last=0;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_SIGNED '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)throw Object.assign(Error('Own signed source process exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{if(Date.now()-last>700){last=Date.now();observe({stage:'bounded-global-signed-memory-checkpoint'});}}};
const get=()=>task??=Promise.resolve().then(()=>{
  const band=prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3800000},context),representative=attachGlobalFixedRepresentative(band,context),
    current=attachGlobalCurrentState(representative,context);return attachGlobalSignedCurrent(current,context);
});

test('actual full-cover current source generates the fixed-H signed update',async()=>{
  const s=await get();assert.equal(assertGlobalSignedCurrent(s),true);assert.equal(assertGlobalCurrentState(s.state),true);
  assert.ok(s.checks.every(x=>x.pass));assert.deepEqual(s.inverse.Sigma,s.state.target.Sigma);
  assert.equal(s.source.newTargetOrWeightsAccepted,false);assert.equal(s.source.oldM2SealForged,false);
});

test('the actual leading full-cover covariance is separately bound to original H, a squared and the whole target',async()=>{
  const s=await get(),G=s.G;
  assert.ok(s.leading.checks.every(x=>x.pass));assert.equal(s.leading.leadingQuadraticDefectZero,true);
  assert.equal(s.leading.fullCurlCovarianceDeclaredEqualToTarget,false);assert.equal(s.leading.sourceRows.length,2);
  for(const [j,row]of s.leading.sourceRows.entries()){
    assert.ok(row.angularFactorChecks.every(x=>x.pass));assert.equal(row.squareRootDefinition.radicand,s.state.band.target.weights[j]);
    assert.deepEqual(row.actualIntegralColumn,s.state.band.target.H.map(r=>r[j]));
  }
  assert.deepEqual(s.leading.globalTarget,s.state.band.target.components.map(x=>G.mul(s.state.band.geometry.epsilon,x)));
});

test('current Sigma has the full source chart law including all radial integrals and c_rho P',async()=>{
  const s=await get();assert.ok(s.chartLaw.checks.every(x=>x.pass));assert.equal(s.chartLaw.sourceAuthenticated,true);
  assert.equal(s.chartLaw.arbitrarySuppliedSigmaAccepted,false);assert.deepEqual(s.chartLaw.target,s.state.target.Sigma);
  assert.deepEqual(s.chartLaw.exponents.exponents.Sigma,['1','2']);assert.equal(s.chartLaw.actualRows.length,6);
});

test('signed full curls retain fixed representatives, actual H factors and every same-label remainder',async()=>{
  const s=await get();
  for(const [j,row]of s.rows.entries()){
    assert.equal(row.fixedOriginalA,s.state.band.target.squareRootWeights[j]);assert.deepEqual(row.fixedOriginalH,s.state.band.target.H);
    assert.equal(row.noFreshSquareRootOfSignedTarget,true);assert.equal(row.representativeSubstitutedAfterSourceDifferentiation,true);
    assert.ok(row.curl.divergence.checks.every(x=>x.pass));assert.ok(row.beforeChecks.every(x=>x.pass));assert.ok(row.angularInverseChecks.every(x=>x.pass));
    assert.ok(row.expansion.checks.every(x=>x.pass));assert.equal(row.expansion.allThreeRemaindersRetained,true);
    for(const key of ['before','after','primary','earlier','curl','square'])for(const guard of Object.values(row.guards[key])){
      assert.equal(guard.auxiliary.zeroBeforeSingularBodyEvaluation,true);assert.equal(guard.whole.zeroBeforeSingularBodyEvaluation,true);
    }
  }
});

test('global B equals current Sigma only after the complete actual quadratic partition and chart conversion',async()=>{
  const s=await get(),id=s.assembly.identity;
  assert.equal(id.exactGlobalBilinearIdentityOnDeclaredAtlas,true);assert.equal(id.completePrimaryRows.length,81);
  assert.equal(new Set(id.completePrimaryRows.map(x=>x.key)).size,81);assert.deepEqual(id.globalPrimaryReduced,s.state.target.Sigma);
  assert.ok(id.localInverseChecks.every(x=>x.pass));assert.equal(id.fullCovarianceDifferenceEqualToSigmaAlone,false);
  for(const key of ['primary','earlier','curl','square'])for(const field of Object.values(s.assembly.registered[key].systems)){
    const system=s.G.globalIndexedSystem(field);assert.equal(system.rows.length,81);assert.ok(system.rows.every(x=>x.guards.length===5));
  }
});

test('all six updated full means recompute actual mean pressure and both momentum integrals',async()=>{
  const s=await get();assert.equal(Object.keys(s.updated.fullAuxiliaryMean).length,6);
  assert.ok(s.updated.mean.checks.every(x=>x.pass));assert.notEqual(s.updated.mean.P,s.state.mean.P);
  assert.notEqual(s.updated.mean.Jtheta,s.state.mean.Jtheta);assert.notEqual(s.updated.mean.Jz,s.state.mean.Jz);
  assert.equal(s.updated.mean.pressure.fullNonzeroAuxiliaryPressureConstructed,false);
  assert.equal(s.scope.allOrderSourceClassBoundsCertified,false);assert.equal(s.scope.originalN604Complete,false);
});

test('deleting an actual square, replacing Sigma or reselecting a cannot keep the private source seal',async()=>{
  const s=await get();assert.throws(()=>assertGlobalSignedCurrent({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,key,replacement]of [[s.inverse,'a',[s.G.one,s.G.one]],[s.source,'actualCurrentSigma',[s.G.zero,s.G.zero]],
    [s.assembly.identity,'newIncrementSquare',{}],[s.scope,'originalN604Complete',true]]){
    const saved=object[key];object[key]=replacement;
    try{assert.throws(()=>assertGlobalSignedCurrent(s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[key]=saved;}
  }
  assert.equal(assertGlobalSignedCurrent(s),true);
});

test('every required signed mean and potential derivative reaches the actual source bodies and two Volterra systems',async()=>{
  const s=await get(),audit=await auditGlobalSignedDerivatives(s,context);
  assert.ok(audit.checks.every(x=>x.pass));assert.equal(audit.closure.allRequestedSharedBodiesMaterialized,true);
  assert.equal(audit.uniformAllOrderClassBoundCertified,false);assert.equal(audit.originalN604Complete,false);
  assert.equal(audit.closure.finiteApproximationReplacesExactLimit,false);
  assert.ok(audit.closure.indexedPartials.every(x=>x.rows===81));
  observe({stage:'global-signed-audit-ready',nodeCount:s.G.nodes.length,functions:audit.closure.partials.length});
  if(process.env.M3_N6_GLOBAL_SIGNED_EVIDENCE)await writeFile(process.env.M3_N6_GLOBAL_SIGNED_EVIDENCE,JSON.stringify(audit,null,2)+'\n');
});
