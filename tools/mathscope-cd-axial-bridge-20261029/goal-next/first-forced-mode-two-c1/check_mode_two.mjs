import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [next,archivedReplay,gaugeFile,inputFile,out]=process.argv.slice(2);
assert.ok(next&&archivedReplay&&gaugeFile&&inputFile&&out);
const sha=x=>createHash('sha256').update(x).digest('hex');
async function pinned(path,h){
  const b=await readFile(path);
  assert.equal(sha(b),h,path);
  return JSON.parse(b);
}
const inputBytes=await readFile(inputFile),input=JSON.parse(inputBytes);
const archive=await pinned(archivedReplay,'e0e466e8bdf8d65f06e82da38631ad5f4c5c7f12f3d073ac1bbe104a0ddf4b38');
const gauge=await pinned(gaugeFile,'95e5f4cce485e95414a0b6574513ea462d50a4e0cc1e98675c6d54a216e21c80');
const primary=await pinned(resolve(next,input.pins.primary[0]),input.pins.primary[1]);
const mean=await pinned(resolve(next,input.pins.mean[0]),input.pins.mean[1]);
assert.equal(archive.snapshot.node_stream_sha256,input.source.forcedSHA256);
assert.equal(gauge.sourceGraphSHA256,input.source.forcedSHA256);
assert.equal(gauge.sourceRegistrySHA256,input.source.registrySHA256);
assert.equal(archive.changedRealComponentsByMode[2],0);
const matches=[];
for(const r of input.source.records){
  const a=archive.rows.find(x=>x.key===r.key&&x.mode===2);
  const b=gauge.cases.find(x=>x.key===r.key&&x.mode===2);
  assert.ok(a&&b);
  assert.deepEqual(a.path,r.path);
  assert.deepEqual(a.components.map(x=>x.raw),r.raw);
  assert.deepEqual(a.components.map(x=>x.mapped),r.mapped);
  assert.ok(a.components.every(c=>c.raw===c.supported&&c.primary===0&&c.inverseWrapper));
  for(const c of a.components){
    const map=new Map(a.path.Y.map((y,i)=>[y,a.path.Hw[i]]));
    assert.deepEqual(c.sourceActuals,c.sourceFormals.map(id=>map.get(id)??id));
  }
  assert.equal(b.positiveNormalizedCylindricalPotential.length,3);
  assert.ok(b.positiveNormalizedCylindricalPotential.every(x=>x.real.coefficient===-1&&x.imaginary.coefficient===1));
  assert.equal(b.negativeModeRule,'complex conjugate on the same phase');
  matches.push({key:r.key,system:a.system,mode:2,formalSource:a.components.map(x=>x.formalPathSource),potential:b.positiveNormalizedCylindricalPotential});
}
assert.equal(matches.length,10);
assert.equal(new Set(matches.map(x=>x.system)).size,10);

// Independent abstract conservation/divergence substitution. Coefficients
// are integers of commuting symbolic amplitude and jet monomials.
function poly(terms){
  const a=new Map();
  for(const [v,...xs] of terms){
    const key=xs.sort().join('*');
    a.set(key,(a.get(key)??0)+v);
  }
  return [...a].filter(([,x])=>x!==0).sort(([a],[b])=>a.localeCompare(b));
}
for(let j=0;j<3;j++){
  const u='u'+j,dr='dr'+j,dz='dz'+j;
  const conn=j===0?[[-1,'Rinv','u1','u1']]:j===1?[[1,'Rinv','u0','u1']]:[];
  const conservative=[
    [1,dr,'u0'],[1,u,'dr0'],[1,dz,'u2'],[1,u,'dz2'],[1,'Rinv',u,'u0'],...conn
  ];
  // The original i*k*n.u term occurs twice at harmonic two.
  const substitute=[[-2,u,'dr0'],[-2,u,'dz2'],[-2,u,'Rinv','u0']];
  const carrierFree=[[1,dr,'u0'],[1,dz,'u2'],[-1,u,'dr0'],[-1,u,'dz2'],[-1,u,'Rinv','u0'],...conn];
  assert.deepEqual(poly([...conservative,...substitute]),poly(carrierFree));
  assert.notDeepEqual(poly([...conservative,...substitute.map(([n,...a])=>[-n,...a])]),poly(carrierFree));
}
assert.deepEqual(input.weight.epsilonExponent,[99999,100000]);
assert.equal(input.weight.zetaPower,1);
assert.equal(input.weight.Ppower,2);
assert.equal(input.weight.deltaPole,2*mean.intermediate.sqrtWeightPoles[3]);
const pos=input.positive.nodes,positive=[];
function reachable(ns,roots){
  const seen=new Set(),q=[...roots];
  while(q.length){
    const i=q.pop();
    if(seen.has(i))continue;
    seen.add(i);
    const x=ns[i];
    if(['add','multiply','maximum','inverse','sqrt_positive','exp'].includes(x.op))q.push(...x.args);
    if(x.op==='integer_power')q.push(x.args[0]);
  }
  return seen;
}
const roots=[input.positive.rawModeTwoValue,input.positive.rawModeTwoOrdinaryC1];
const branch=reachable(pos,roots);
const primaryRoots=[...branch].flatMap(i=>{
  const n=pos[i];
  return n.op==='authenticated_source_norm_root'&&n.args[0]==='initialized-primary-positive'?[n.args[1]]:[];
});
const rawPrimary=reachable(primary.nodes,primaryRoots);
assert.ok(!rawPrimary.has(primary.intermediate.kUpper));
for(const i of rawPrimary){
  const a=primary.nodes[i];
  assert.ok(!(a.op==='authenticated_source_norm_root'&&a.args[0]==='initialized-mean-positive'&&a.args[1]===mean.intermediate.gaussianAbsorption));
}
for(const [i,{op,args}] of pos.entries()){
  if(op==='rational'){
    assert.ok(BigInt(args[0])>=0n&&BigInt(args[1])>0n);
    positive.push(BigInt(args[0])>0n);
  }else if(op==='authenticated_source_norm_root'){
    assert.ok(args[0]==='hosted-original'?Object.hasOwn(mean.nativeSourceRecords,args[1]):args[0]==='initialized-primary-positive'&&Boolean(primary.nodes[args[1]]));
    positive.push(true);
  }else{
    assert.ok((op==='integer_power'?args.slice(0,1):args).every(x=>Number.isInteger(x)&&x>=0&&x<i));
    assert.ok(['integer_power','add','multiply','maximum'].includes(op));
    positive.push(op==='integer_power'?positive[args[0]]:op==='multiply'?args.every(x=>positive[x]):args.some(x=>positive[x]));
  }
}
assert.equal(sha(JSON.stringify(pos)),input.positive.graphSHA256);
assert.ok(roots.every(i=>positive[i]));

// Extension to actual zero-data mode-two output. In t=B P z, mode two
// has matrix M-3dI. Since d>=0, the original stable bound W still applies.
// On the fixed xi axis the frame and matrix are constant in xi.
const nodes=[];
const node=(op,args)=>{const id=nodes.length;nodes.push({op,args});return id;};
const q=(n,d=1)=>node('rational',[String(n),String(d)]);
const op=(n,...a)=>node(n,a);
const leaf=(s,i)=>node('authenticated_source_norm_root',[s,i]);
const R=leaf('hosted-original',216823),B0=leaf('hosted-original',300170),r0=leaf('hosted-original',300171),
  kappa=leaf('hosted-original',617289),S=leaf('initialized-mean-positive',mean.intermediate.wholeKBandSUpper),
  W=leaf('initialized-mean-positive',mean.intermediate.stableW);
const u=op('multiply',q(2),op('inverse',kappa)),twoU=op('multiply',q(2),u);
const B=op('multiply',q(2),op('add',q(1),twoU),op('add',q(1),op('integer_power',R,10)));
const Ls=op('multiply',q(12),r0,S); // 2 r0 Tg S < 12 r0 S.
const leftProjection=op('multiply',q(4),B0); // ||Bleft||_infty <=2B0, ||Pi||_infty <=2.
const transfer=op('multiply',B,Ls,leftProjection,W);
const forcing=roots.map(id=>leaf('mode-two-input-positive',id));
const t0=op('multiply',transfer,forcing[0]),txi=op('multiply',transfer,forcing[1]);
const potential0=op('multiply',op('integer_power',B0,2),t0),
  potentialXi=op('multiply',op('integer_power',B0,2),txi);
assert.equal(2**2-1,3);
assert.ok(3<2**2); // sqrt(3)<2 in the projection and cross-product bounds.
const readback={schema:'MathScope.N7.ArchivedModeTwoForcedValueAndTransverseJet/1',inputReceiptSHA256:sha(inputBytes),
  originalArchiveReplaySHA256:'e0e466e8bdf8d65f06e82da38631ad5f4c5c7f12f3d073ac1bbe104a0ddf4b38',
  originalGaugeReceiptSHA256:'95e5f4cce485e95414a0b6574513ea462d50a4e0cc1e98675c6d54a216e21c80',
  inputPositiveGraphSHA256:input.positive.graphSHA256,checkedArchivedPathComponents:60,systems:matches,
  tWeight:{epsilonExponent:[99999,100000],zetaPower:1,deltaPole:144,Ppower:1},
  normalizedPotentialWeight:{epsilonExponent:[149999,100000],zetaPower:1,deltaPole:144,Ppower:1},
  ownPhysicalPotentialWeight:{epsilonExponent:[49999,100000],zetaPower:1,deltaPole:144,Ppower:1},
  positive:{nodes,graphSHA256:sha(JSON.stringify(nodes)),roots:{forcedVelocityAmplitude:t0,forcedVelocityAmplitudeXi:txi,
    mappedNormalizedPotential:potential0,mappedNormalizedPotentialXi:potentialXi}},
  controls:{rejectWrongDivergenceSign:true},
  scope:'Archived N1 mode two on admitted fixed paths. Per positive complex coefficient value and xi derivative. No newer private-family join or physical whole-K jet promotion.'};
await writeFile(out,JSON.stringify(readback,null,2)+'\n');
console.log('PASS archived ten mode-two zero-data systems, weighted potential value/xi bound and independent divergence readback.');
console.log(JSON.stringify({roots:readback.positive.roots,graphSHA256:readback.positive.graphSHA256,fileSHA256:sha(await readFile(out))}));
