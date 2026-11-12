import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [next,forced,receiptPath,out]=process.argv.slice(2);
assert.ok(next&&forced&&receiptPath&&out);
const sha=x=>createHash('sha256').update(x).digest('hex');
const bytes=await readFile(receiptPath),a=JSON.parse(bytes);
async function pinned(path,h){
  const b=await readFile(path);
  assert.equal(sha(b),h,path);
  return JSON.parse(b);
}
const inputs={};
for(const [k,[name,h]] of Object.entries(a.pins))inputs[k]=await pinned(resolve(next,name),h);
const reg=await pinned(resolve(forced,'original-source-functions.json'),a.archivedRegistrySHA256);
const run=await pinned(resolve(forced,'corrected-first-force.json'),'c7d429adb927a3020b870df3fb755806061727ed2efc7d8df8736c785e65f835');
assert.equal(run.snapshot.node_stream_sha256,a.archivedGraphSHA256);
const systems=JSON.parse(reg.definitions)[3];
for(const b of a.sourceSystems){
  const s=systems[b.zeroDataSystem],r=run.rows.find(x=>x.system===s.id&&x.m===2);
  const first=systems[b.referenceSystem];
  assert.ok(r);
  assert.equal(s.variable,b.variable);
  assert.deepEqual(s.parameters,b.parameters);
  assert.deepEqual(s.directions,b.directions);
  assert.deepEqual(first.parameters.filter(x=>x!==b.extraModeOneMeanReferenceFormal),s.parameters);
  assert.ok(s.initial.every(z=>z.real===0&&z.imaginary===0));
  assert.deepEqual(b.t,r.output);
  assert.deepEqual(b.mappedPressure,r.mappedCutoff.pressure);
  assert.deepEqual(b.cutoffComplement,r.mappedCutoff.remainingSource);
  assert.deepEqual(b.cutoffDerivative,r.mappedCutoff.derivativeSource);
  assert.deepEqual(b.mappedGauge,inputs.output.systems.find(x=>x.key===b.key).potential);
}
assert.equal(a.sourceSystems.length,10);

// Independent exact differential polynomial rules. Matrix products are
// noncommutative. Each term is an ordered tuple with integer coefficient.
const normalize=terms=>{
  const out=new Map();
  for(const [c,...xs] of terms){
    const k=xs.join('*');
    out.set(k,(out.get(k)??0)+c);
  }
  return [...out].filter(([,x])=>x).sort(([a],[b])=>a.localeCompare(b));
};
function derivative(terms,d){
  const next=[];
  for(const [c,...xs] of terms)for(const [i,x] of xs.entries())for(const [v,...r] of d[x]??[]){
    next.push([c*v,...xs.slice(0,i),...r,...xs.slice(i+1)]);
  }
  return next;
}
const zV=[[1,'M','z'],[1,'F']];
const zVV=derivative(zV,{M:[[1,'Mv']],z:[[1,'zv']],F:[[1,'Fv']]});
const zSV=derivative(zV,{M:[[1,'Ms']],z:[[1,'zs']],F:[[1,'Fs']]});
const zXiV=derivative(zV,{z:[[1,'zxi']],F:[[1,'Fxi']]});
assert.deepEqual(normalize(zVV),normalize([[1,'Mv','z'],[1,'M','zv'],[1,'Fv']]));
assert.deepEqual(normalize(zSV),normalize([[1,'Ms','z'],[1,'M','zs'],[1,'Fs']]));
assert.deepEqual(normalize(zXiV),normalize([[1,'M','zxi'],[1,'Fxi']]));
assert.notDeepEqual(normalize(zSV),normalize([[1,'z','Ms'],[1,'M','zs'],[1,'Fs']]));
const vDiff={B:[[1,'Bv']],Bv:[[1,'Bvv']],P:[[1,'Pv']],Pv:[[1,'Pvv']],z:[[1,'zv']],zv:[[1,'zvv']]};
const tV2=derivative(derivative([[1,'B','P','z']],vDiff),vDiff);
assert.deepEqual(normalize(tV2),normalize([[1,'Bvv','P','z'],[2,'Bv','Pv','z'],[1,'B','Pvv','z'],
  [2,'Bv','P','zv'],[2,'B','Pv','zv'],[1,'B','P','zvv']]));
const force=[[ -1,'L','invP','g' ]];
const forceV=derivative(force,{L:[[1,'Lv']],invP:[[-1,'G','invP']],g:[[1,'gv']]});
assert.deepEqual(normalize(forceV),normalize([[-1,'Lv','invP','g'],[1,'L','G','invP','g'],[-1,'L','invP','gv']]));
const pressureSource=[[1,'n','g'],[1,'normalRow','t']];
const pressureV=derivative(pressureSource,{n:[[1,'nv']],g:[[1,'gv']],normalRow:[[1,'normalRowV']],t:[[1,'tv']]});
assert.deepEqual(normalize(pressureV),normalize([[1,'nv','g'],[1,'n','gv'],[1,'normalRowV','t'],[1,'normalRow','tv']]));

const nodes=a.nodes,positive=[],m=a.intermediate;
const rootsFG=new Set(inputs.bg.bounds.flatMap(x=>[x.F,x.G]));
const deps=({op,args})=>op==='rational'||op==='authenticated_source_norm_root'?[]:op==='integer_power'?[args[0]]:args;
for(const [i,n] of nodes.entries()){
  const {op,args}=n;
  assert.ok(deps(n).every(x=>Number.isInteger(x)&&x>=0&&x<i));
  switch(op){
    case 'rational':
      assert.ok(BigInt(args[0])>=0n&&BigInt(args[1])>0n);
      positive.push(BigInt(args[0])>0n);break;
    case 'authenticated_source_norm_root':{
      const [ns,id]=args;
      const accept={'hosted-original':()=>Object.hasOwn(inputs.mean.nativeSourceRecords,id),'initialized-primary-positive':()=>Boolean(inputs.primary.nodes[id]),
        'initialized-mean-positive':()=>Boolean(inputs.mean.nodes[id]),'background-c8':()=>rootsFG.has(id),'mode-two-input-positive':()=>Boolean(inputs.input.positive.nodes[id])};
      assert.ok(accept[ns]?.());positive.push(true);break;
    }
    case 'add':case 'maximum':positive.push(args.some(x=>positive[x]));break;
    case 'multiply':positive.push(args.every(x=>positive[x]));break;
    case 'inverse':assert.equal(positive[args[0]],true);positive.push(true);break;
    case 'sqrt_positive':positive.push(positive[args[0]]);break;
    case 'integer_power':assert.ok(Number.isInteger(args[1])&&args[1]>0);positive.push(positive[args[0]]);break;
    default:assert.fail(op);
  }
}
const graphSHA='37f4ad3d914ac10d6313a9d0ca631b7a8fffc31569d22eba3522e292b897ab22';
assert.equal(a.graphSHA256,graphSHA);
assert.equal(sha(JSON.stringify(nodes)),graphSHA);
function reachable(root){
  const work=[root],seen=new Set();
  while(work.length){
    const x=work.pop();
    if(seen.has(x))continue;
    seen.add(x);
    work.push(...deps(nodes[x]));
  }
  return seen;
}
const {t,A,pressure,flatComplement,flatCutoffDerivative}=a.roots;
for(const roots of [t,A,pressure,flatComplement,flatCutoffDerivative])assert.ok(Object.values(roots).every(r=>positive[r]));
for(const [tag,z] of [['slow',m.zs],['xi',m.zx],['v',m.zv],['vv',m.zvv],['slowV',m.zsv],['xiV',m.zxv]]){
  assert.ok(reachable(t[tag]).has(z));
  assert.ok(reachable(A[tag]).has(t[tag]));
}
for(const [tag,source] of [['slow',m.fs],['xi',m.fx],['v',m.fv]]){
  assert.ok(reachable(pressure[tag]).has(t[tag]));
  assert.ok(reachable(pressure[tag]).has(m.N1));
  assert.ok(reachable(t[tag==='slow'?'slowV':tag==='xi'?'xiV':'vv']).has(source));
}
assert.ok(reachable(flatCutoffDerivative.v).has(m.psiVV));
assert.ok(reachable(flatCutoffDerivative.v).has(t.v));
assert.ok(reachable(flatComplement.v).has(m.psiV));
assert.ok(reachable(A.vv).has(m.psiVV));
assert.ok(reachable(t.vv).has(m.Mv));
assert.ok(reachable(t.slowV).has(m.Ms));
assert.deepEqual(a.weights,{t:'epsilon^(1-kappa_s)*zeta*delta^(-144)*P(v)',
  AAndPressure:'epsilon^(3/2-kappa_s)*zeta*delta^(-144)*P(v)',complement:'epsilon^(1-kappa_s)*zeta*delta^(-144)*P(v)^2',
  derivative:'epsilon^(1-kappa_s)*zeta*delta^(-144)*P(v)'});
const output={schema:'MathScope.N7.ArchivedModeTwoSelectedOutputJetsReadback/1',receiptSHA256:sha(bytes),graphSHA256:graphSHA,
  systems:a.sourceSystems.length,arithmeticNodes:nodes.length,actualRoots:a.roots,
  checks:['original zero-data and mapped gauge/pressure/cutoff operands','noncommutative variation and product rules',
    'source pressure term n dot g retained','selected pulse and slow derivative reachability'],
  controls:{rejectCommutingMsThroughZ:true},scope:'Archived N1 own-label jets only. Original analytic premises and later source tasks remain.'};
await writeFile(out,JSON.stringify(output,null,2)+'\n');
console.log('PASS independent original mode-two jet readback and noncommutative variational arithmetic.');
console.log('Readback SHA256 '+sha(await readFile(out)));
