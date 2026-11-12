import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [next,receiptPath,out]=process.argv.slice(2);
assert.ok(next&&receiptPath&&out);
const sha=x=>createHash('sha256').update(x).digest('hex');
const raw=await readFile(receiptPath),a=JSON.parse(raw),inputs={};
for(const [k,[file,h]] of Object.entries(a.pins)){
  const bytes=await readFile(resolve(next,file));
  assert.equal(sha(bytes),h);
  inputs[k]=JSON.parse(bytes);
}
assert.deepEqual(a.source,{gaugeTemporal:1706770,gaugeFiveMap:3614778,directTemporal:1706624,directFiveMap:3614767,
  earlyEzNonzeroHaar:643882,earlyEthetaNonzeroHaar:643867,actualInitializedPressure:3859821,primaryPotentialSystems:[[694,695,696],[703,704,705]]});
assert.equal(inputs.transport.stageZeroRoots.psiT,a.source.gaugeTemporal);
assert.equal(inputs.transport.stageZeroRoots.psiFive,a.source.gaugeFiveMap);
assert.equal(inputs.transport.stageZeroRoots.temporalDirectV,a.source.directTemporal);
assert.equal(inputs.sharp.lineage.earlyNonzeroHaarEz,a.source.earlyEzNonzeroHaar);
assert.equal(inputs.sharp.lineage.earlyNonzeroHaarEtheta,a.source.earlyEthetaNonzeroHaar);

// Independent integer calculation of (partial_R+aL)^3 on an arbitrary
// scalar with L commuting with all slow derivatives and L(a)=0.
const radial=(poly)=>{
  const result=new Map();
  const put=(z,c)=>{
    const k=z.join(',');
    result.set(k,(result.get(k)??0n)+c);
  };
  for(const [k,c] of poly){
    const [r,l,x,y,z]=k.split(',').map(Number);
    put([r+1,l,x,y,z],c);
    put([r,l+1,x+1,y,z],c);
    if(x)put([r,l,x-1,y+1,z],BigInt(x)*c);
    if(y)put([r,l,x,y-1,z+1],BigInt(y)*c);
  }
  return result;
};
const identity=new Map([['0,0,0,0,0',1n]]);
const expected=new Map([['3,0,0,0,0',1n],['2,1,1,0,0',3n],['1,2,2,0,0',3n],['0,3,3,0,0',1n],
  ['1,1,0,1,0',3n],['0,2,1,1,0',3n],['0,1,0,0,1',1n]]);
const sorted=m=>[...m].sort(([a],[b])=>a.localeCompare(b));
const actual=sorted(radial(radial(radial(identity))));
assert.deepEqual(actual,sorted(expected));
const mutated=new Map(expected);
mutated.delete('0,1,0,0,1');
assert.notDeepEqual(actual,sorted(mutated));

// Exact direct-scalar transport of v/R at fixed sbar=R². For s radial
// derivatives, store signed integer numerators above the common 2^s.
const gcd=(a,b)=>b===0n?a:gcd(b,a%b);
function directRows(s,z,t){
  let p=new Map([['0,-1',1n]]);
  for(let j=0;j<s;j++){
    const r=new Map(),put=(key,c)=>r.set(key,(r.get(key)??0n)+c);
    for(const [k,c] of p){
      const [m,d]=k.split(',').map(Number);
      put(m+','+(d-2),BigInt(d)*c);
      put((m+1)+','+(d-1),c);
    }
    p=r;
  }
  const groups=new Map();
  for(const [k,c] of p){
    const [m,d]=k.split(',').map(Number),key=(m+z+t)+','+Math.abs(d);
    groups.set(key,(groups.get(key)??0n)+(c<0n?-c:c));
  }
  return [...groups].map(([k,v])=>{
    const [mappedOrder,radiusEnvelopePower]=k.split(',').map(Number),den=2n**BigInt(s),g=gcd(v,den),d=den/g;
    return {mappedOrder,radiusEnvelopePower,coefficient:d===1n?String(v/g):String(v/g)+'/'+String(d)};
  }).sort((a,b)=>a.mappedOrder-b.mappedOrder||a.radiusEnvelopePower-b.radiusEnvelopePower);
}
for(const key of Object.keys(a.roots.direct)){
  const [s,z,t]=key.split('@')[1].split(',').map(Number);
  assert.deepEqual(directRows(s,z,t),inputs.transport.atoms[key].mean,key);
}

const nodes=a.nodes,m=a.intermediate,positive=[];
const deps=({op,args})=>op==='rational'||op==='authenticated_source_norm_root'?[]:op==='integer_power'?[args[0]]:args;
const radialRoots=new Set(inputs.fixed.unweighted.flatMap(f=>f.rows.map(r=>r.T)).concat(inputs.mean.intermediate.rawWholeShiftedFixedRoots));
for(const [i,node] of nodes.entries()){
  assert.ok(deps(node).every(j=>Number.isSafeInteger(j)&&j>=0&&j<i));
  const {op,args}=node;
  switch(op){
    case 'rational':assert.ok(BigInt(args[0])>=0n&&BigInt(args[1])>0n);positive.push(BigInt(args[0])>0n);break;
    case 'authenticated_source_norm_root':{
      const [ns,id]=args;
      const valid={'hosted-original':()=>Object.hasOwn(inputs.mean.nativeSourceRecords,id),'initialized-mean-positive':()=>Boolean(inputs.mean.nodes[id]),
        'initialized-primary-positive':()=>Boolean(inputs.primary.nodes[id]),'initialized-pressure-positive':()=>Boolean(inputs.pressure.nodes[id]),
        'fixed-radial':()=>radialRoots.has(id),'slow-background-atom':()=>Object.hasOwn(inputs.slow.slowFieldAtomIntervals,id)};
      assert.ok(valid[ns]?.());positive.push(true);break;
    }
    case 'add':case 'maximum':positive.push(args.some(j=>positive[j]));break;
    case 'multiply':positive.push(args.every(j=>positive[j]));break;
    case 'inverse':assert.equal(positive[args[0]],true);positive.push(true);break;
    case 'integer_power':assert.ok(Number.isSafeInteger(args[1])&&args[1]>0);positive.push(positive[args[0]]);break;
    case 'exp':positive.push(true);break;
    default:assert.fail(op);
  }
}
const graphSHA='65971adebe62c655d733eb721683eb4c6f73554ce8aab3c3d8fd2f38f72b6842';
assert.equal(nodes.length,516);
assert.equal(a.graphSHA256,graphSHA);
assert.equal(sha(JSON.stringify(nodes)),graphSHA);
function reachable(root){
  const seen=new Set(),todo=[root];
  while(todo.length){
    const j=todo.pop();
    if(seen.has(j))continue;
    seen.add(j);todo.push(...deps(nodes[j]));
  }
  return seen;
}
assert.ok(reachable(m.psiLLL).has(m.W6));
assert.ok(reachable(m.W6).has(m.chi7));
assert.deepEqual(nodes[m.chi7],{op:'rational',args:[String(BigInt(inputs.mean.intermediate.partitionSeedSigma[7])*2n**245n),'1']});
assert.ok(reachable(m.vLL).has(m.etheta40));
assert.ok(reachable(m.psiTime).has(m.ez00));
assert.ok(reachable(m.psiTimeMixed).has(m.ez01)&&reachable(m.psiTimeMixed).has(m.ez10));
assert.ok(reachable(m.vTime).has(m.etheta00));
assert.equal(Object.keys(a.roots.gauge).length,57);
assert.equal(Object.keys(a.roots.direct).length,6);
assert.deepEqual(Object.keys(a.roots.all),Object.keys(inputs.transport.atoms));
for(const [key,id] of Object.entries(a.roots.all)){
  assert.ok(positive[id]);
  if(key.startsWith('p@')){
    assert.deepEqual(nodes[id],{op:'authenticated_source_norm_root',args:['initialized-pressure-positive',inputs.pressure.roots.stageZeroPressureAtoms[key]]});
    continue;
  }
  const c=m.componentRows[key];
  if(key.startsWith('A2@')){
    assert.ok(c.otherComponentsZero);
    assert.equal(id,c.primary);
    assert.deepEqual(inputs.slow.slowFieldAtomIntervals[key].exactInterval,['0','0']);
    continue;
  }
  assert.deepEqual(nodes[c.slow],{op:'authenticated_source_norm_root',args:['slow-background-atom',key]});
  const expected=[c.slow,c.mean];
  if(key.startsWith('A')){
    assert.deepEqual(nodes[c.primary],{op:'authenticated_source_norm_root',args:['initialized-primary-positive',inputs.primary.roots.physicalPrimary[key]]});
    expected.push(c.primary);
  }
  assert.deepEqual(nodes[id],{op:'add',args:expected.sort((a,b)=>a-b)});
}
const result={schema:'MathScope.N7.CompleteInitializedStageZeroAtomReadback/1',receiptSHA256:sha(raw),graphSHA256:graphSHA,
  arithmeticNodes:nodes.length,initializedAtoms:67,gaugeAtoms:57,directAtoms:6,pressureAtoms:4,
  controls:{rejectOmittedThirdRadialPullback:true},
  independentChecks:['exact cubic radial differential operator','six exact radial-square direct transport rows',
    'integer transverse order seven, live N-inverse cancellation operands','all 67 initialized branch sums']};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS independent third radial identity, actual direct-scalar transport and all 67 initialized branch sums.');
console.log('Readback SHA256 '+sha(await readFile(out)));
