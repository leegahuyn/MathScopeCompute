import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {prepareGlobalSourceBand,assertGlobalSourceBand,globalSourceBandCertificate} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative,assertGlobalFixedRepresentative,globalFixedRepresentativeCertificate} from '../source-global-representative.mjs';
import {assertActualCommonAdmissibleBand} from '../../../mathscope-m2/navier/actual-common-admissible-band.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

let task,representative,lastResourceCheck=0;
function observe(extra={}){
  const text=readFileSync('/proc/self/status','utf8'),hostPID=Number(text.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(text.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,
    maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_SOURCE '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)throw Object.assign(Error('Own source process exceeded its actual memory gate.'),{code:'RESOURCE_LIMIT'});
}
const get=()=>task??=Promise.resolve().then(()=>prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},
  {onProgress:observe,checkCancelled:()=>{if(Date.now()-lastResourceCheck>500){lastResourceCheck=Date.now();observe({stage:'bounded-source-memory-checkpoint'});}}}));

test('strict source inputs do not accept a supplied H, arbitrary source scale or omitted coefficient row',()=>{
  for(const input of [{H:[]},{coefficientOrder:-1},{coefficientOrder:1.5},{maxNodes:8000000}])
    assert.throws(()=>prepareGlobalSourceBand(input),e=>['INVALID_INPUT','RESOURCE_LIMIT'].includes(e.code));
});

test('new M3 template executes the genuine source prefix while sharing append-only node bodies',async()=>{
  const p=await get(),n=p.sourceBinding.sourcePrefixNodeCount;
  assert.equal(p.checks.every(x=>x.pass),true);
  assert.notEqual(p.G,p.family.G);assert.notEqual(p.G.nodes,p.family.G.nodes);
  assert.equal(p.family.G.nodes.length,n);
  assert.ok(p.G.nodes.length>n);
  assert.equal(p.G.nodes[0],p.family.G.nodes[0]);
  assert.equal(p.G.nodes[n-1],p.family.G.nodes[n-1]);
  assert.equal(canonicalStringify(p.G.nodes.slice(0,n)),canonicalStringify(p.family.G.nodes));
  assert.equal(p.sourceBinding.originalM2SourceChanged,false);
  assert.throws(()=>assertActualCommonAdmissibleBand(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('the real n1 cutoff transition and radial commutator survive the whole N1 band window',async()=>{
  const p=await get(),row=p.background.rows[0],G=p.G;
  assert.equal(p.background.rows.length,1);
  assert.equal(row.order,1);assert.equal(row.reducedChi,row.chi);assert.equal(row.reducedExtra,row.extra);
  assert.notEqual(row.chi,G.one);assert.notEqual(row.extra,G.zero);
  assert.equal(row.sourceRoots.F,p.family.prepared.records[1].global.F);
  assert.equal(row.sourceRoots.Pi,p.family.prepared.records[1].global.Pi);
  assert.equal(p.background.completeRadialCutoffCommutatorRetained,true);
  assert.equal(p.background.omittedTail.firstOmitted,2);
  assert.equal(p.background.omittedTail.missingCoefficientAssumedZero,false);
  assert.equal(p.window.nextSourceScale,p.family.selector.rows[1].scale);
});

test('both actual H matrices and pulse equations depend on their own explicit frozen band parameter',async()=>{
  const p=await get(),G=p.G,ell=p.coordinates.ell;
  assert.equal(G.nodes[ell].op,'coordinate');
  for(const f of p.families){
    const s=G.covarianceSystems[f.system];
    assert.equal(s.parameters.at(-1),ell);
    assert.equal(s.matrix.some(row=>row.some(x=>G.freeCoordinates(x).has(ell))),true);
    for(const x of [f.covariance.theta,f.covariance.z,f.covariance.mass])assert.equal(G.freeCoordinates(x).has(ell),true);
    for(const c of [p.coordinates.R,p.coordinates.Z,p.coordinates.T,p.coordinates.v])
      for(const x of [f.carrier.p,f.carrier.pz,f.carrier.x0])assert.equal(G.derivative(x,c),G.zero);
  }
  const a=p.family.selector.ellA,b=G.sub(a,G.one),ha=p.target.H.flat().map(x=>G.substitute(x,ell,a)),hb=p.target.H.flat().map(x=>G.substitute(x,ell,b));
  assert.equal(ha.every((x,j)=>x!==hb[j]),true);
  assert.equal([...ha,...hb].every(x=>!G.freeCoordinates(x).has(ell)),true);
  assert.equal(assertGlobalSourceBand(p),true);
});

test('the exact two-sign inverse is checked and never reselects positive a for a new residual',async()=>{
  const p=await get();
  assert.equal(p.target.inverseChecks.length,2);
  assert.equal(p.target.inverseChecks.every(x=>x.pass),true);
  assert.equal(p.families.length,2);
  assert.deepEqual(p.families.map(x=>x.sign),[1,-1]);
  assert.equal(p.sourceBinding.oldSelectedHReused,false);
  assert.equal(p.scope.positiveWeightsRequireOriginalSameBoxDomain,true);
  assert.equal(p.scope.newN6ClassCertificate,false);
});

test('a copied record, missing later scale, changed window or promoted scope is rejected',async()=>{
  const p=await get();
  assert.throws(()=>assertGlobalSourceBand({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [obj,key,value]of [[p.window,'nextSourceScale',p.G.zero],[p.window.exactTail,'firstOmitted',3],
    [p.scope,'allLabelsAndRadialIntegralsAssembled',true],[p.scope,'originalN604Complete',true]]){
    const previous=obj[key];obj[key]=value;
    try{assert.throws(()=>assertGlobalSourceBand(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{obj[key]=previous;}
  }
  assert.equal(assertGlobalSourceBand(p),true);
});

test('every representative expression is constructed from the original shell and frozen mesh, before slow derivatives',async()=>{
  const p=await get();representative=attachGlobalFixedRepresentative(p,{onProgress:observe});
  assert.equal(representative.checks.every(x=>x.pass),true);
  assert.equal(representative.reduction.sourceConstants.h,p.G.parameter('h'));
  assert.equal(representative.reduction.sourceConstants.Xa,p.G.parameter('Xa'));
  assert.equal(representative.reduction.sourceConstants.Xb,p.chart.Xb);
  assert.equal(p.G.nodes[representative.roots.s].args[0],p.chart.system);
  for(const root of Object.values(representative.roots).flat())
    for(const c of ['R','Z','T'])assert.equal(p.G.freeCoordinates(root).has(p.coordinates[c]),false);
  assert.equal(representative.scope.representativeDependsOnResidual,false);
  assert.equal(representative.scope.exteriorGuardRequired,true);
});

test('a point-dependent or metadata-forged representative cannot become global field authority',async()=>{
  const p=await get(),r=representative;
  assert.throws(()=>assertGlobalFixedRepresentative({...r}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const previous=r.roots.R;r.roots.R=p.coordinates.R;
  try{assert.throws(()=>assertGlobalFixedRepresentative(r),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{r.roots.R=previous;}
  assert.equal(assertGlobalFixedRepresentative(r),true);
  assert.equal(r.scope.completeGlobalWaveAssembled,false);
});

test('source-delta receipt binds genuine upstream graph and keeps all global obligations explicit',async()=>{
  const p=await get(),r=await globalSourceBandCertificate(p);
  assert.equal(r.upstreamSource.graph.sha256,'bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219');
  assert.equal(r.graph.originalPrefixGraphSHA256,r.upstreamSource.graph.sha256);
  assert.match(r.graph.sha256,/^[a-f0-9]{64}$/);
  // Later substitutions append instances; the receipt binds the frozen
  // template prefix, rather than silently absorbing those new roots.
  assert.ok(r.graph.nodeCount<=p.G.nodes.length);
  assert.equal(r.graph.newNodeCount,r.graph.nodeCount-p.sourceBinding.sourcePrefixNodeCount);
  assert.equal(r.verification.actualSourceProgramExecuted,true);
  assert.equal(r.verification.numericalHOrGlobalFieldEvaluated,false);
  assert.equal(r.scope.globalRepresentativeSelectorBound,false);
  assert.equal(r.scope.allLabelsAndRadialIntegralsAssembled,false);
  assert.equal(r.scope.originalN604Complete,false);
  const fixed=await globalFixedRepresentativeCertificate(representative);
  observe({stage:'global-band-and-fixed-representative-certificate-ready'});
  if(process.env.M3_N6_GLOBAL_EVIDENCE)await writeFile(process.env.M3_N6_GLOBAL_EVIDENCE,JSON.stringify({band:r,representative:fixed},null,2)+'\n');
});
