import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';

assert.equal(process.argv.length,4,'Use MIXED_WAVE_JSON READBACK_JSON');
const [, ,path,out]=process.argv;
const bytes=await readFile(path);
const result=JSON.parse(bytes);
const {nodes,roots}=result;
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(sha(JSON.stringify(nodes)),result.graphSHA256);
const identifiers=new Map(nodes.map(({op,args},id)=>[JSON.stringify([op,args]),id]));
assert.equal(identifiers.size,nodes.length);
const find=(op,args)=>{
  const id=identifiers.get(JSON.stringify([op,args]));
  assert.ok(Number.isSafeInteger(id),op+' '+args);
  return id;
};
const integer=(x,y=1)=>find('rational',[String(x),String(y)]),zero=integer(0),one=integer(1);
const ordering=(a,b)=>a-b;
function plus(values){
  const v=values.filter(x=>x!==zero).sort(ordering);
  return v.length===0?zero:v.length===1?v[0]:find('add',v);
}
function times(values){
  if(values.includes(zero))return zero;
  const v=values.filter(x=>x!==one).sort(ordering);
  return v.length===0?one:v.length===1?v[0]:find('multiply',v);
}
const power=(x,p)=>p===0?one:p===1||x===one?x:find('integer_power',[x,p]);
const maximum=values=>find('maximum',[...new Set(values)].sort(ordering));
const f=n=>n===0?1:n*f(n-1),bin=(n,j)=>f(n)/(f(j)*f(n-j));
const index=(s,v)=>(s+v)*(s+v+1)/2+v;
function cauchy(a,b,k){
  const [s,v]=result.normalizedOrder[k];
  const values=[];
  for(let pulse=0;pulse<=v;pulse++)
    for(let slow=0;slow<=s;slow++)values.push(times([a[index(slow,pulse)],b[index(s-slow,v-pulse)]]));
  return plus(values);
}
function multiplyJet(a,b){
  return result.normalizedOrder.map((_,k)=>cauchy(a,b,k));
}

const background=new Set(),lower=new Set(),original=new Set();
for(const [id,{op,args}] of nodes.entries()){
  if(op==='rational'){
    assert.match(args[0],/^\d+$/);
    assert.match(args[1],/^[1-9]\d*$/);
    continue;
  }
  if(op==='authenticated_source_norm_root'){
    const maps={'archived-original':original,'archived-background-c8':background,'archived-lower-positive':lower};
    assert.ok(maps[args[0]]&&Number.isSafeInteger(args[1]));
    maps[args[0]].add(args[1]);
    continue;
  }
  assert.ok(['add','multiply','inverse','sqrt_positive','integer_power','maximum'].includes(op));
  for(const x of op==='integer_power'?args.slice(0,1):args)
    assert.ok(Number.isSafeInteger(x)&&0<=x&&x<id);
}
assert.equal(result.normalizedOrder.length,21);
for(const [k,[s,v]] of result.normalizedOrder.entries()){
  assert.equal(index(s,v),k);
  if(s+v<=4)assert.equal(roots.Mnorm[k],maximum(roots.M.map(row=>plus(row.map(jet=>jet[k])))));
  if(v===0)continue;
  const terms=[];
  for(let b=0;b<v;b++)
    for(let a=0;a<=s;a++)terms.push(times([roots.Mnorm[index(a,b)],roots.w[index(s-a,v-1-b)]]));
  assert.equal(roots.w[k],times([integer(1,v),plus(terms)]));
  if(s===0){
    const envelope=[];
    for(let j=0;j<v;j++)envelope.push(times([roots.envelopeSlope[index(0,j)],roots.normalizedP[index(0,v-1-j)]]));
    assert.equal(roots.normalizedP[k],times([integer(1,v),plus(envelope)]));
  }else assert.equal(roots.normalizedP[k],zero);
}
for(const [k,[s,v]] of result.normalizedOrder.entries()){
  assert.equal(roots.weight[k],v===0?find('authenticated_source_norm_root',['archived-lower-positive',[2523,2527,2530,2533,2537,2541][s]]):zero);
  if(s>0)assert.equal(roots.psi[k],zero);
}
assert.equal(roots.normalizedP[0],one);
assert.ok(!lower.has(3505),'The archived Gaussian-absorption constant must stay out of this weighted graph.');
for(const [component,frameRow] of roots.B.entries()){
  const t=result.normalizedOrder.map((_,k)=>plus(frameRow.map((jet,j)=>multiplyJet(multiplyJet(jet,roots.normalizedP),roots.w)[k])));
  assert.deepEqual(t,roots.normalizedT[component]);
  assert.deepEqual([roots.psi,roots.weight,roots.partition].reduce(multiplyJet,t),roots.amplitude[component]);
}

function diff(a,j){
  const next=[...a];
  next[j]++;
  return next;
}
const ordinary=(jet,[r,z,t,i,v])=>times([integer(f(r+z+t)*f(v)),roots.chi[i],jet[index(r+z+t,v)]]);
function fast(jet,a){
  const items=[];
  for(let j=0;j<=a[0];j++){
    const b=diff(a,3);
    b[0]-=j;
    items.push(times([integer(bin(a[0],j)),roots.radialPhase[j],ordinary(jet,b)]));
  }
  return plus(items);
}
function inverseRadius(jet,a){
  const terms=[];
  for(let j=0;j<=a[0];j++){
    const b=[...a];
    b[0]-=j;
    terms.push(times([integer(bin(a[0],j)*f(j)),power(roots.radiusUpper,j+1),ordinary(jet,b)]));
  }
  return plus(terms);
}
const poles=[12,24,48,72,96,120];
function checkCurl(row){
  const a=row.orders,[Cr,Ctheta,Cz]=roots.potential;
  const exact={
    D_Z_theta:ordinary(Ctheta,diff(a,1)),
    D_Z_r:ordinary(Cr,diff(a,1)),
    D_R_z:ordinary(Cz,diff(a,0)),
    fastZ:fast(Cz,a),
    D_R_theta:ordinary(Ctheta,diff(a,0)),
    fastTheta:fast(Ctheta,a),
    radiusTerm:inverseRadius(Ctheta,a)
  };
  assert.deepEqual(row.imaginaryComponents,exact);
  assert.deepEqual(row.real,roots.amplitude.map(jet=>ordinary(jet,a)));
  assert.deepEqual(row.imaginary,[exact.D_Z_theta,plus([exact.D_Z_r,exact.D_R_z,exact.fastZ]),
    plus([exact.D_R_theta,exact.fastTheta,exact.radiusTerm])]);
  assert.equal(row.pressure,ordinary(roots.pressure,a));
  const s=a[0]+a[1]+a[2];
  assert.deepEqual(row.poles,{real:poles[s],imaginary:poles[s+1],pressure:poles[s]});
}
const counts=[0,0,0,0,0],seen=new Set();
for(const row of roots.results){
  assert.equal(row.orders.length,5);
  assert.ok(row.orders.every(j=>Number.isSafeInteger(j)&&0<=j));
  const d=row.orders.reduce((a,b)=>a+b,0),key=row.orders.join(',');
  assert.ok(d<=4&&!seen.has(key));
  counts[d]++;
  seen.add(key);
  checkCurl(row);
}
assert.deepEqual(counts,[1,5,15,35,70]);
assert.deepEqual(result.exactImaginaryTermPowers,{
  D_Z_theta:200000,D_Z_r:200000,D_R_z:100000,fastZ:99999,D_R_theta:100000,fastTheta:99999,radiusTerm:100000
});
const control=structuredClone(roots.results[0]);
control.imaginaryComponents.radiusTerm=zero;
assert.throws(()=>checkCurl(control));
assert.throws(()=>checkCurl({...roots.results[0],poles:{real:12,imaginary:12,pressure:12}}));
const report={schema:'MathScope.ArchivedPrimaryWeightedMixedWaveReadback/1',status:'PASS',
  receiptSHA256:sha(bytes),graphSHA256:result.graphSHA256,nodes:nodes.length,
  indexCounts:counts,volterraRecurrences:15,normalizedEnvelopeRecurrences:5,
  sourceNamespaces:{background:[...background].sort(ordering),lower:[...lower].sort(ordering),original:[...original].sort(ordering)},
  mutationControls:['dropped reciprocal-radius connection rejected','underestimated imaginary pole rejected']};
await writeFile(out,JSON.stringify(report)+'\n');
console.log(JSON.stringify({status:report.status,receiptSHA256:report.receiptSHA256,fileSHA256:sha(await readFile(out))}));
