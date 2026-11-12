import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const [next,hosted,functionalPath,receiptPath,out]=process.argv.slice(2);
assert.ok(next&&hosted&&functionalPath&&receiptPath&&out);
const sha=x=>createHash('sha256').update(x).digest('hex');
const bytes=await readFile(receiptPath),a=JSON.parse(bytes);
const originalFunctional=await readFile(functionalPath);
assert.equal(sha(originalFunctional),a.functionalSHA256);
const sourceFunctional=JSON.parse(originalFunctional).nodes.find(x=>x.id===a.native.sourceFunctional);
assert.equal(sourceFunctional.operation,'ActualInitializedState');
assert.ok(sourceFunctional.data.potentials.primary.includes('BEFORE exactCylindricalHarmonicCurl'));
const inputs={};
for(const [k,[file,h]] of Object.entries(a.pins)){
  const b=await readFile(resolve(next,file));
  assert.equal(sha(b),h);
  inputs[k]=JSON.parse(b);
}
const registry=await readFile(resolve(hosted,'original-source-functions.json'));
assert.equal(sha(registry),a.registrySHA256);
const decode=x=>typeof x==='string'?JSON.parse(x):x;
const reg=decode(decode(registry.toString()).base),base=decode(reg.base);
const defs=decode(base.expression),fields=decode(reg.fieldDefinitions);
assert.deepEqual(fields.slice(6,9).map(x=>x.name),a.native.velocityCover);
assert.ok(fields.slice(6,9).every(f=>f.rows.length===162));
for(const [j,systems] of a.native.nativePotentialSystems.entries()){
  assert.deepEqual(systems.map(id=>defs[id].body),a.native.nativePotentialBodies[j]);
  assert.ok(systems.every(id=>/^GlobalOriginalPotential_/.test(defs[id].name)));
}
const wanted=new Set(Object.keys(a.native.sourceRecords).map(Number));
const hash=createHash('sha256'),raw=new Map();
const stream=createReadStream(resolve(hosted,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
stream.on('data',b=>hash.update(b));
let count=-1;
for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
  if(wanted.has(count))raw.set(count,JSON.parse(line));
  count++;
}
assert.equal(count,4456994);
assert.equal(hash.digest('hex'),a.sourceSHA256);
for(const [id,r] of Object.entries(a.native.sourceRecords))assert.deepEqual(raw.get(Number(id)),r);

// Verify bilinearity and every source cross-product coefficient by
// independently substituting the nine pairs of coordinate vectors.
const epsBasis=[0,1,2].map(i=>[0,1,2].map(j=>i===j?1n:0n));
const cross=(x,y)=>[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
for(const [j,row] of inputs.angular.source.sourceBinding.entries()){
  const denom=[623354,623688][j],parameters=[...row.preNormal,...row.preAmp];
  function countLeaves(id){
    if(parameters.includes(id))return [[parameters.indexOf(id)]];
    if(id===denom||id===20)return [[]];
    const n=raw.get(id);
    assert.ok(n.op==='add'||n.op==='multiply');
    if(n.op==='add')return n.args.flatMap(countLeaves);
    return n.args.map(countLeaves).reduce((a,b)=>a.flatMap(x=>b.map(y=>[...x,...y])),[[]]);
  }
  for(const id of a.native.nativePotentialBodies[j])assert.ok(countLeaves(id).every(term=>term.length===2&&term.filter(x=>x<3).length===1));
  function evaluate(id,p){
    if(id===denom)return 1n;
    if(id===20)return -1n;
    if(parameters.includes(id))return p[parameters.indexOf(id)];
    const n=raw.get(id),v=n.args.map(x=>evaluate(x,p));
    return n.op==='add'?v.reduce((a,b)=>a+b,0n):v.reduce((a,b)=>a*b,1n);
  }
  for(const x of epsBasis)for(const y of epsBasis){
    assert.deepEqual(a.native.nativePotentialBodies[j].map(id=>evaluate(id,[...x,...y])),cross(x,y));
  }
  assert.notDeepEqual(cross(epsBasis[1],epsBasis[2]).map(x=>-x),cross(epsBasis[1],epsBasis[2]));
}

// Independent exact Laurent/trigonometric coefficient transport. A key
// stores [dR,dZ,dT,dTheta,Rpower,cosPower,sinPower]. The gauge components
// are treated independently before applying absolute values.
const initials={A0:[[1n,1,0],[-1n,0,1]],A1:[[1n,0,1],[1n,1,0]],A2:[[1n,0,0]]};
function applyOperator(input,axis){
  const out=new Map();
  const put=(i,c)=>{
    if(!c)return;
    const k=i.join(',');
    out.set(k,(out.get(k)??0n)+c);
  };
  const increment=(i,k)=>i.map((x,j)=>j===k?x+1:x);
  if(axis===2||axis===3){
    for(const [key,c] of input)put(increment(key.split(',').map(Number),axis-1),c);
    return out;
  }
  for(const [key,weight] of input){
    const i=key.split(',').map(Number),r=i[4],cos=i[5],sin=i[6];
    const dr=axis===0?[0,1,0,1n]:[0,0,1,1n];
    const da=axis===0?[-1,0,1,-1n]:[-1,1,0,1n];
    const shift=(j,[r,c,s])=>j.map((x,k)=>k===4?x+r:k===5?x+c:k===6?x+s:x);
    put(shift(increment(i,0),dr),weight*dr[3]);
    put(shift(increment(i,3),da),weight*da[3]);
    if(r)put(shift(shift(i,[-1,0,0]),dr),weight*BigInt(r)*dr[3]);
    if(cos)put(shift(shift(i,[0,-1,1]),da),-weight*BigInt(cos)*da[3]);
    if(sin)put(shift(shift(i,[0,1,-1]),da),weight*BigInt(sin)*da[3]);
  }
  return out;
}
function actualCoefficientRows(name,orders){
  const groups=new Map();
  for(const [sign,c,s] of initials[name]){
    let terms=new Map([[[0,0,0,0,0,c,s].join(','),sign]]);
    for(const [axis,m] of orders.entries())for(let j=0;j<m;j++)terms=applyOperator(terms,axis);
    for(const [key,c] of terms){
      if(!c)continue;
      const v=key.split(',').map(Number),order=v[0]+v[1]+v[2]+v[3],rp=Math.abs(v[4]),k=order+','+rp;
      groups.set(k,(groups.get(k)??0n)+(c<0n?-c:c));
    }
  }
  return [...groups].map(([k,c])=>{
    const [mappedOrder,radiusEnvelopePower]=k.split(',').map(Number);
    return {mappedOrder,radiusEnvelopePower,coefficient:String(c)};
  }).sort((a,b)=>a.mappedOrder-b.mappedOrder||a.radiusEnvelopePower-b.radiusEnvelopePower);
}
const keys=Object.keys(a.roots.physicalPrimary);
assert.equal(keys.length,57);
for(const key of keys){
  const [name,index]=key.split('@'),orders=index.split(',').map(Number);
  assert.deepEqual(actualCoefficientRows(name,orders),inputs.transport.atoms[key].wave,key);
  assert.deepEqual(a.intermediate.powerRows[key],[orders[0]+orders[1]+orders[2]+2*orders[3],orders[2]]);
  if(name==='A2'){
    assert.equal(a.roots.completeInitializedAxialPotential[key],a.roots.physicalPrimary[key]);
    assert.deepEqual(inputs.transport.atoms[key].mean,[]);
    assert.deepEqual(inputs.slow.slowFieldAtomIntervals[key].exactInterval,['0','0']);
  }
}
assert.equal(Object.keys(a.roots.completeInitializedAxialPotential).length,19);

const nodes=a.nodes,p=[];
const deps=({op,args})=>op==='rational'||op==='authenticated_source_norm_root'?[]:op==='integer_power'?[args[0]]:args;
const bgRoots=new Set(inputs.bg.bounds.flatMap(x=>[x.F,x.G]));
for(const [i,node] of nodes.entries()){
  assert.ok(deps(node).every(j=>Number.isSafeInteger(j)&&j>=0&&j<i));
  const {op,args}=node;
  switch(op){
    case 'rational':assert.ok(BigInt(args[0])>=0n&&BigInt(args[1])>0n);p.push(BigInt(args[0])>0n);break;
    case 'authenticated_source_norm_root':{
      const [ns,id]=args;
      assert.ok(ns==='hosted-original'?Object.hasOwn(inputs.mean.nativeSourceRecords,id):
        ns==='initialized-mean-positive'?Boolean(inputs.mean.nodes[id]):ns==='background-c8'&&bgRoots.has(id));
      p.push(true);break;
    }
    case 'add':case 'maximum':p.push(args.some(j=>p[j]));break;
    case 'multiply':p.push(args.every(j=>p[j]));break;
    case 'inverse':assert.equal(p[args[0]],true);p.push(true);break;
    case 'sqrt_positive':p.push(p[args[0]]);break;
    case 'integer_power':assert.ok(Number.isSafeInteger(args[1])&&args[1]>0);p.push(p[args[0]]);break;
    case 'exp':p.push(true);break;
    default:assert.fail(op);
  }
}
const graphSHA='98f6f2a02f1dea447321f2299652abb016157cd37e815dc486510ae3b612db1b';
assert.equal(nodes.length,2431);
assert.equal(a.graphSHA256,graphSHA);
assert.equal(sha(JSON.stringify(nodes)),graphSHA);
assert.ok(Object.values(a.roots.physicalPrimary).every(x=>p[x]));
const reachable=new Set(),todo=[a.intermediate.pulled[3]];
while(todo.length){
  const k=todo.pop();
  if(reachable.has(k))continue;
  reachable.add(k);todo.push(...deps(nodes[k]));
}
const jetIndex=a.intermediate.orders.findIndex(([s,v])=>s===0&&v===3);
assert.ok(reachable.has(a.intermediate.w[jetIndex]));
assert.ok(reachable.has(a.intermediate.chi[3]));
assert.ok(reachable.has(a.intermediate.kUpper));
assert.ok(reachable.has(a.intermediate.pullback.J3));
const result={schema:'MathScope.N7.ActualInitializedPrimaryPotentialC3Readback/1',receiptSHA256:sha(bytes),graphSHA256:graphSHA,
  sourceNodes:count,nativeSignedPotentials:6,actualSourceRows:162,arithmeticNodes:nodes.length,primaryAtoms:57,completeInitializedAxialAtoms:19,
  independentChecks:['six native cross products on nine exact basis pairs each','57 exact Cartesian Laurent polynomial rows',
    'physical dyadic exponent per requested atom','third pulse derivative, carrier and cutoff reachability']};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS independent source cross products and exact transport of 57 initialized primary potential atoms.');
console.log('Readback SHA256 '+sha(await readFile(out)));
