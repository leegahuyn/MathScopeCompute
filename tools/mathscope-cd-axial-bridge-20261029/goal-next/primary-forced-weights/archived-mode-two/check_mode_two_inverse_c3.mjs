import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

assert.equal(process.argv.length,6,'Use WAVE_PROGRAM LOWER_PROGRAM INVERSE_C3_JSON OUT_JSON');
const [, ,wavePath,lowerPath,inversePath,out]=process.argv;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pins=[
  [wavePath,'e6cfd19055479fbcb43dddcd17ae05ddc3fb075eb911620f485dfb7d29c6fe70'],
  [lowerPath,'5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328'],
  [inversePath,'e66bdbe54057e202131efa663c687d93ce943e66103b92ec9254aa52c11154b1']
];
const [wave,lower,receipt]=await Promise.all(pins.map(async ([path,digest])=>{
  assert.notEqual(resolve(path),resolve(out));
  const bytes=await readFile(path);
  assert.equal(sha(bytes),digest,path);
  return JSON.parse(bytes);
}));
const {positive:{extensionStart,extension,normalizedOrders,roots}}=receipt;
const base=[...lower.nodes],aliases=[];
const maps={'archived-original':'hosted-original','archived-background-c8':'background-c8'};
for(const n of wave.nodes){
  const {op,args}=n;
  if(op==='authenticated_source_norm_root'&&args[0]==='archived-lower-positive'){
    aliases.push(args[1]);
    continue;
  }
  const dst=base.length;
  if(op==='authenticated_source_norm_root')base.push({op,args:[maps[args[0]],args[1]]});
  else if(op==='rational')base.push(n);
  else if(op==='integer_power')base.push({op,args:[aliases[args[0]],args[1]]});
  else base.push({op,args:args.map(id=>aliases[id])});
  aliases.push(dst);
}
assert.equal(base.length,extensionStart);
assert.equal(sha(JSON.stringify([...base,...extension])),receipt.positive.graphSHA256);
const lookup=new Map(extension.map((n,i)=>[JSON.stringify([n.op,n.args]),extensionStart+i]));
assert.equal(lookup.size,extension.length);
function find(op,args){
  const id=lookup.get(JSON.stringify([op,args]));
  assert.ok(Number.isSafeInteger(id),op+' '+args);
  return id;
}
const q=(x,y=1)=>find('rational',[String(x),String(y)]);
const zero=q(0),one=q(1),order=(a,b)=>a-b;
function add(xs){
  const v=xs.filter(x=>x!==zero).sort(order);
  return v.length===0?zero:v.length===1?v[0]:find('add',v);
}
function mul(xs){
  if(xs.includes(zero))return zero;
  const v=xs.filter(x=>x!==one).sort(order);
  return v.length===0?one:v.length===1?v[0]:find('multiply',v);
}
const max=xs=>find('maximum',[...new Set(xs)].sort(order));
const byOrder=new Map(normalizedOrders.map((a,i)=>[a.join(','),i]));
const at=(A,s,l,v)=>A[byOrder.get([s,l,v].join(','))];
const oldOrder=new Map(wave.normalizedOrder.map((a,i)=>[a.join(','),i]));
const fromWave=A=>normalizedOrders.map(([s,l,v])=>l>0?zero:aliases[A[oldOrder.get([s,v].join(','))]]);
const point=x=>normalizedOrders.map((_,i)=>i===0?x:zero);
function product(A,B){
  return normalizedOrders.map(([s,l,v])=>{
    const terms=[];
    for(let c=0;c<=v;c++)for(let b=0;b<=l;b++)for(let a=0;a<=s;a++)
      terms.push(mul([at(A,a,b,c),at(B,s-a,l-b,v-c)]));
    return add(terms);
  });
}
const addJets=(...xs)=>normalizedOrders.map((_,i)=>add(xs.map(a=>a[i])));
const prodJets=(...xs)=>xs.reduce(product,point(one));
const scale=(c,A)=>A.map(x=>mul([c,x]));
const n=wave.roots.n.map(fromWave),n2=addJets(...n.map(a=>product(a,a)));
const nMax=normalizedOrders.map((_,i)=>max(n.map(a=>a[i])));
const M=wave.roots.M.map((row,i)=>row.map((a,j)=>i===j?
  addJets(fromWave(a),scale(q(12),n2)):fromWave(a)));
const operatorNorm=A=>normalizedOrders.map((_,i)=>max(A.map(row=>add(row.map(a=>a[i])))));
assert.deepEqual(operatorNorm(M),roots.M2norm);
const project=n.map((a,i)=>n.map((b,j)=>addJets(point(i===j?one:zero),prodJets(a,b,roots.n2Inv))));
assert.deepEqual(project,roots.projection);
const Q=roots.Bleft.map(row=>project[0].map((_,j)=>addJets(...row.map((a,i)=>product(a,project[i][j])))));
assert.deepEqual(operatorNorm(Q),roots.projectedNorm);
assert.deepEqual(operatorNorm(wave.roots.B.map(row=>row.map(fromWave))),roots.Bnorm);
assert.deepEqual(fromWave(wave.roots.normalizedP),roots.env);
assert.deepEqual(fromWave(wave.roots.psi),roots.psi);
const psiV=normalizedOrders.map(([s,l,v])=>s+l>0?zero:
  mul([q(v+1),aliases[wave.roots.psi[oldOrder.get([0,v+1].join(','))]]]));
assert.deepEqual(psiV,roots.psiV);
const complement=roots.psi.map((x,i)=>i===0?one:x);
const count=normalizedOrders.length;
function checkSolution(part,candidate){
  const g=roots.modeInputs[part],z=roots.z[part];
  const f=prodJets(roots.projectedNorm,roots.env,g);
  assert.deepEqual(f,roots.normalizedSource[part]);
  const M2=roots.M2norm;
  for(let i=0;i<count;i++){
    const [s,l,v]=normalizedOrders[i],terms=[];
    if(v===0){
      for(let a=s;a>=1;a--)terms.push(mul([at(M2,a,0,0),at(z,s-a,l,0)]));
      assert.equal(candidate[i],mul([roots.LW,add([f[i],...terms])]));
    }else{
      for(let b=v-1;b>=0;b--)for(let a=s;a>=0;a--)terms.push(mul([at(M2,a,0,b),at(z,s-a,l,v-1-b)]));
      assert.equal(candidate[i],mul([q(1,v),add([at(f,s,l,v-1),...terms])]));
    }
  }
  const t=prodJets(roots.Bnorm,roots.env,z);
  assert.deepEqual(t,roots.t[part]);
  assert.deepEqual(prodJets(roots.psi,nMax,roots.n2Inv,t),roots.mappedGauge[part]);
  assert.deepEqual(scale(q(3,2),prodJets(roots.psi,roots.n2Inv,
    addJets(product(roots.pressureMax,t),product(nMax,g)))),roots.pressure[part]);
  assert.deepEqual(product(complement,g),roots.cutoffComplement[part]);
  assert.deepEqual(product(psiV,t),roots.cutoffDerivative[part]);
}
for(const part of [0,1])checkSolution(part,roots.z[part]);
for(const a of [[2,0,0],[0,0,2]]){
  const mutant=[...roots.z[0]];
  mutant[byOrder.get(a.join(','))]=zero;
  assert.throws(()=>checkSolution(0,mutant));
}
const fact=[1,1,2,6],seen=new Set(),used=new Set();
function checkRow(row){
  const [r,z,t,l,v]=row.orders,s=r+z+t;
  const scalePart=(name,swap)=>[0,1].map(part=>mul([q(fact[s]*fact[l]*fact[v]),
    at(roots[name][swap?1-part:part],s,l,v)]));
  for(const [name,source,swap] of [
    ['t','t',false],['gauge','mappedGauge',true],['pressure','pressure',true],
    ['cutoffComplement','cutoffComplement',false],['cutoffDerivative','cutoffDerivative',false]
  ]){
    assert.deepEqual(row[name],scalePart(source,swap));
    row[name].forEach(id=>used.add(id));
  }
  assert.equal(row.pole,receipt.weights.poles[s+l+v]);
}
for(const row of receipt.ordinaryRows){
  const k=row.orders.join(',');
  assert(!seen.has(k));
  seen.add(k);
  checkRow(row);
}
assert.equal(seen.size,56);
const gaugeMutation=structuredClone(receipt.ordinaryRows[0]);
gaugeMutation.gauge.reverse();
assert.throws(()=>checkRow(gaugeMutation));
assert.deepEqual(receipt.weights.gaugeAndPressure.epsilon,[
  receipt.weights.tAndCutoffDerivative.epsilon[1]+50000,
  receipt.weights.tAndCutoffDerivative.epsilon[0]+50000
]);
assert.deepEqual([...used].sort(order),Object.keys(receipt.upperEndpoints).map(Number).sort(order));
const report={
  schema:'MathScope.ArchivedFirstForcedModeTwoInverseC3Readback/1',status:'PASS',receiptSHA256:pins[2][1],
  graphSHA256:receipt.positive.graphSHA256,ordinaryIndices:seen.size,recurrences:2*count,upperEndpoints:used.size,
  controls:['missing slow second recurrence rejected','missing endpoint second recurrence rejected','unswapped mapped complex part rejected']
};
await writeFile(out,JSON.stringify(report)+'\n');
console.log(JSON.stringify({status:report.status,indices:seen.size,roots:used.size,SHA256:sha(await readFile(out))}));
