import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareGlobalSourceBand,assertGlobalSourceBand} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative,assertGlobalFixedRepresentative} from '../source-global-representative.mjs';
import {attachGlobalCurrentState,assertGlobalCurrentState,auditGlobalCurrentDerivatives,globalGraphEqual} from '../source-global-current.mjs';
import {GlobalSourceExpressions} from '../source-global-expressions.mjs';

let task,lastResourceCheck=0,audit;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_CURRENT '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)throw Object.assign(Error('Own global current source process exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{if(Date.now()-lastResourceCheck>500){lastResourceCheck=Date.now();observe({stage:'bounded-global-current-memory-checkpoint'});}}};
const get=()=>task??=Promise.resolve().then(()=>{
  const band=prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},context),representative=attachGlobalFixedRepresentative(band,context);
  return attachGlobalCurrentState(representative,context);
});

test('global field authority cannot come from a receipt or a supplied current Sigma',()=>{
  for(const fake of [{},{Sigma:[0,0],pass:true},{schema:'MathScope.N6.GlobalFixedRepresentative/1',scope:{originalN604Complete:true}}])
    assert.throws(()=>attachGlobalCurrentState(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('actual original band and representative execute on the independently extended shared source graph',async()=>{
  const s=await get(),G=s.G;
  assert.ok(G instanceof GlobalSourceExpressions);assert.equal(assertGlobalSourceBand(s.band),true);assert.equal(assertGlobalFixedRepresentative(s.representative),true);
  assert.equal(s.checks.every(x=>x.pass),true);assert.equal(s.source.oldM2BandSealForged,false);assert.equal(s.source.serializedReceiptUsedAsFieldAuthority,false);
  assert.equal(s.band.background.rows[0].reducedChi,s.band.background.rows[0].chi);
  assert.notEqual(s.band.background.rows[0].chi,G.one);assert.notEqual(s.band.background.rows[0].extra,G.zero);
  assert.equal(s.domain.nextScale,s.band.family.selector.rows[1].scale);
  assert.equal(s.domain.oneFinitePrefixClaimedValidAtAllQ,false);
  assert.equal(s.domain.prefixSharedByWholeRadialIntegral,true);
});

test('both source signs retain all six full-curl means, original a/H and guards before each singular representative body',async()=>{
  const s=await get(),G=s.G,names=s.covariance.components;
  assert.deepEqual(s.local.rows.map(x=>x.sign),[1,-1]);assert.equal(names.length,6);
  for(const [i,row]of s.local.rows.entries()){
    assert.equal(row.originalFixedPositiveA,s.band.target.squareRootWeights[i]);assert.equal(row.originalCovariance,s.band.families[i].system);
    assert.equal(row.tangency.pass,true);assert.equal(row.curl.divergence.checks.every(x=>x.pass),true);
    assert.equal(row.curl.remainder.some(x=>x!==G.zero),true);
    for(const name of names){
      assert.equal(row.guards[name].whole.layers.length,5);assert.equal(row.guards[name].angular.layers.length,7);
      assert.equal(row.guards[name].whole.zeroBeforeSingularBodyEvaluation,true);
      for(const c of [s.band.coordinates.theta,s.band.cutoffs.xi,s.band.coordinates.v])assert.equal(G.freeCoordinates(row.mean[name]).has(c),false);
    }
  }
  assert.equal(s.geometry.palette.commonToAllBandsAndLabels,true);assert.equal(s.geometry.torus.pass,true);
});

test('the actual 81 candidates have separate mapped coordinates and reference-q guards before out-of-band roots',async()=>{
  const s=await get(),G=s.G,p=s.assembly.partition;
  assert.equal(p.labels.length,81);assert.equal(new Set(p.labels.map(x=>x.key)).size,81);
  assert.equal(p.noIndependentOffsetCoordinates,true);assert.equal(p.partition.exactSquaredSum,G.one);
  for(const name of s.covariance.components){
    const f=G.globalIndexedSystem(s.covariance.indexedSystems[name]);assert.equal(f.rows.length,81);
    for(const [i,row]of f.rows.entries()){
      const b=p.bands[p.partition.rows[i].relativeBand+1],label=p.labels[i];
      assert.deepEqual(row.values,[...b.slow,label.ell,...label.grid]);
      assert.equal(row.guards.length,5);assert.equal(row.guards.at(-1)[0],G.sub(p.bandCoordinate,label.ell));
      assert.equal(row.label.countInGlobalSum,1);assert.deepEqual(row.label.signs,[1,-1]);
    }
  }
  assert.equal(s.scope.all81PointCandidatesRetained,true);assert.equal(s.assembly.pointwiseLabelsUsedAsRadialInventory,false);
});

test('actual all-cover covariance produces whole-envelope current P/J, pressure and Corollary 8.5 Sigma',async()=>{
  const s=await get(),G=s.G,g=s.mean.geometry,{R,Z,T,ell}=s.band.coordinates;
  assert.equal(s.mean.checks.every(x=>x.pass),true);assert.equal(s.target.checks.every(x=>x.pass),true);
  assert.equal(s.target.callerSuppliedTargetUsed,false);assert.equal(s.target.actualCurrentResidualUsed,true);
  assert.equal(s.target.compatibility.sourceSupport.entireIndexedFieldInsideEveryIntegral,true);
  assert.equal(s.target.compatibility.sourceSupport.allCrossedRadialLabelsRetained,true);
  assert.equal(s.target.compatibility.sourceSupport.pointBoundSubstitutedForRadialCount,false);
  for(const integral of s.target.integrals){
    const whole=G.nodes[integral.whole],partial=G.nodes[integral.partial];
    assert.equal(whole.op,'definite_integral');assert.equal(whole.args[2],g.innerRadius);assert.equal(whole.args[3],g.outerRadius);
    assert.equal(partial.op,'definite_integral');assert.equal(partial.args[2],g.innerRadius);assert.equal(partial.args[3],R);
  }
  for(const sigma of s.target.Sigma){assert.notEqual(sigma,G.zero);assert.equal([...G.freeCoordinates(sigma)].every(x=>[R,Z,T,ell].includes(x)),true);}
});

test('dropping the current c_rho P product or whole normalization is a concrete failed algebraic alternative',async()=>{
  const s=await get(),G=s.G,{Z}=s.band.coordinates,g=s.mean.geometry;
  assert.equal(s.target.moments[1],G.mul(s.band.geometry.epsilon,G.derivative(G.add(s.mean.Jz,G.mul(g.cRho,s.mean.P)),Z)));
  const omitted=G.mul(s.band.geometry.epsilon,G.derivative(s.mean.Jz,Z));
  assert.equal(globalGraphEqual(G,omitted,s.target.moments[1]).pass,false);
  assert.equal(s.target.compatibility.pressureMeanNormalization.zeroIntegralIsAConsequenceNotAnInput,true);
  assert.equal(s.target.compatibility.pressureMeanNormalization.check.pass,true);
  const badSource=G.sub(s.mean.gr,G.mul(g.unnormalized,s.mean.P));
  assert.equal(globalGraphEqual(G,badSource,s.mean.pressure.source).pass,false);
});

test('current targets, complete cover metadata and source epochs cannot be forged or changed',async()=>{
  const s=await get();assert.throws(()=>assertGlobalCurrentState({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,name,bad]of [[s.target,'Sigma',[s.G.zero,s.G.zero]],[s.domain,'nextScale',s.G.one],
    [s.assembly,'candidateBoxes',16],[s.scope,'originalN604Complete',true]]){
    const saved=object[name];object[name]=bad;
    try{assert.throws(()=>assertGlobalCurrentState(s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[name]=saved;}
  }
  assert.equal(assertGlobalCurrentState(s),true);
});

test('every requested global current derivative materializes its actual local/Volterra bodies without a finite-sum replacement',async()=>{
  const s=await get();audit=await auditGlobalCurrentDerivatives(s,context);
  assert.equal(audit.checks.every(x=>x.pass),true);assert.equal(audit.closure.allRequestedSharedBodiesMaterialized,true);
  assert.equal(audit.closure.indexedPartials.every(x=>x.rows===81&&!x.labelsDifferentiated),true);
  assert.equal(audit.closure.pulseBlocks.every(x=>x.allCoefficientAndTimeDerivativeBodiesGenerated),true);
  assert.equal(audit.source.sourceBand.upstreamSource.graph.sha256,'bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219');
  assert.equal(audit.closure.finiteApproximationReplacesExactLimit,false);assert.equal(audit.allOrderClassBoundCertified,false);
  assert.equal(audit.originalN604Complete,false);assert.equal(audit.numericalFieldEnclosureComputed,false);
  observe({stage:'global-current-audit-ready',nodeCount:s.G.nodes.length,functions:audit.closure.partials.length});
  if(process.env.M3_N6_GLOBAL_CURRENT_EVIDENCE)await writeFile(process.env.M3_N6_GLOBAL_CURRENT_EVIDENCE,JSON.stringify(audit,null,2)+'\n');
});
