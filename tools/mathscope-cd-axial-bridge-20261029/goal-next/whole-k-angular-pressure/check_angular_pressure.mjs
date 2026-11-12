import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const [next,hosted,receiptPath,out]=process.argv.slice(2);
assert.ok(next&&hosted&&receiptPath&&out,'Supply GOAL_NEXT, HOSTED_GRAPH, RECEIPT, OUTPUT.');
const sha=x=>createHash('sha256').update(x).digest('hex');
const original=await readFile(receiptPath),a=JSON.parse(original),inputs={};
for(const [k,[file,h]] of Object.entries(a.pins)){
  const raw=await readFile(resolve(next,file));
  assert.equal(sha(raw),h);
  inputs[k]=JSON.parse(raw);
}
const registry=await readFile(resolve(hosted,'original-source-functions.json'));
assert.equal(sha(registry),a.registrySHA256);
const decode=x=>typeof x==='string'?JSON.parse(x):x;
const actual=decode(decode(decode(registry.toString()).base).fieldDefinitions)[9];
assert.equal(actual.rows.length,162);
assert.deepEqual([...new Set(actual.rows.map(x=>x.localBody))],[3625754,3652129]);
const firstSource=JSON.parse(JSON.stringify(a.source.sourceBinding[0]));
const bindings=a.source.sourceBinding.map(x=>x.formalToFrozen);
assert.deepEqual(bindings,[{622807:623950,622808:623955,622809:623935},{622807:623950,622808:623955,622809:623935}]);

// Independent source readback of the exact half-amplitude and both
// conjugate sine branches. Their algebra is checked before any majorant.
const wanted=new Set([1,19,20,3616133,3674937,3675276,3859821]);
for(const row of a.source.sourceBinding){
  for(let i=row.raw-6;i<=row.guarded;i++)wanted.add(i);
  for(const sine of row.sines)for(let j=sine-4;j<=sine;j++)wanted.add(j);
}
const ns=new Map(),hash=createHash('sha256');
const stream=createReadStream(resolve(hosted,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
stream.on('data',b=>hash.update(b));
let count=-1;
for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
  if(wanted.has(count))ns.set(count,JSON.parse(line));
  count++;
}
assert.equal(count,4456994);
assert.equal(hash.digest('hex'),a.sourceSHA256);
const n=(id,op)=>{
  const q=ns.get(id);
  assert.equal(q?.op,op,'source #'+id);
  return q.args;
};
function signedBody(row){
  const [a,b]=n(row.raw,'add');
  const sign=(i)=>{
    const [minus,m]=n(i,'multiply');
    assert.deepEqual(n(minus,'rational'),['-1','1']);
    return n(m,'multiply');
  };
  const [sPlus,half1]=sign(a),[sMinus,negHalf]=sign(b);
  const [minus,half2]=n(negHalf,'multiply');
  assert.deepEqual(n(minus,'rational'),['-1','1']);
  assert.equal(half1,half2);
  assert.equal(half1,row.half);
  assert.deepEqual(n(half1,'multiply'),[19,row.coefficient]);
  assert.deepEqual(n(19,'rational'),['1','2']);
  assert.deepEqual([sPlus,sMinus],row.sines);
  const [ap]=n(sPlus,'sine'),[am]=n(sMinus,'sine');
  assert.deepEqual(n(ap,'multiply'),[622801,row.phase]);
  assert.deepEqual(n(am,'multiply'),[3616133,row.phase]);
  assert.deepEqual(n(3616133,'multiply'),[20,622801]);
}
a.source.sourceBinding.forEach(signedBody);
const [first]=n(firstSource.raw,'add'),save=ns.get(first);
ns.set(first,{...save,args:[1,save.args[1]]});
assert.throws(()=>signedBody(firstSource));
ns.set(first,save);
assert.deepEqual(n(3859821,'add'),[3674937,3675276]);
assert.deepEqual(n(3675276,'add'),[622935,3615361]);

const nodes=a.nodes,positive=[];
const dependencies=n=>n.op==='rational'||n.op==='authenticated_source_norm_root'?[]:n.op==='integer_power'?[n.args[0]]:n.args;
const bgRoots=new Set(inputs.bg.bounds.flatMap(x=>[x.F,x.G]));
for(const [i,{op,args}] of nodes.entries()){
  assert.ok(dependencies({op,args}).every(j=>Number.isSafeInteger(j)&&j>=0&&j<i));
  switch(op){
    case 'rational':
      assert.ok(BigInt(args[0])>=0n&&BigInt(args[1])>0n);
      positive.push(BigInt(args[0])>0n);
      break;
    case 'authenticated_source_norm_root': {
      const [ns,id]=args;
      assert.ok(ns==='hosted-original'?Object.hasOwn(inputs.mean.nativeSourceRecords,id):ns==='initialized-mean-positive'?
        Boolean(inputs.mean.nodes[id]):ns==='background-c8'?bgRoots.has(id):
          ns==='slow-background-pressure-atom'&&Object.hasOwn(inputs.slow.slowFieldAtomIntervals,id));
      positive.push(true);
      break;
    }
    case 'add':case 'maximum': positive.push(args.some(j=>positive[j]));break;
    case 'multiply':positive.push(args.every(j=>positive[j]));break;
    case 'inverse':assert.equal(positive[args[0]],true);positive.push(true);break;
    case 'sqrt_positive':positive.push(positive[args[0]]);break;
    case 'integer_power':assert.ok(Number.isSafeInteger(args[1])&&args[1]>0);positive.push(positive[args[0]]);break;
    case 'exp':positive.push(true);break;
    default:assert.fail(op);
  }
}
const expectedGraph='773f14650c984489b8e3e2285058b57bf64123aaf2b85b72c669e6e1801518bb';
assert.equal(nodes.length,222);
assert.equal(a.graphSHA256,expectedGraph);
assert.equal(sha(JSON.stringify(nodes)),expectedGraph);
const angular=a.roots.angular,totals=a.roots.stageZeroPressureAtoms,m=inputs.mean.roots.initializedMeanPressure;
for(const [name,ang,mean] of [
  ['p@0,0,0,0',angular.value,m.physicalValue],
  ['p@1,0,0,0',angular.cartesianXY,m.physicalR],
  ['p@0,1,0,0',angular.cartesianXY,m.physicalR],
  ['p@0,0,1,0',angular.axial,m.physicalZ]
]){
  assert.equal(positive[totals[name]],true);
  const v=nodes[totals[name]];
  assert.equal(v.op,'add');
  const [angularNode,mIndex,bIndex]=v.args;
  assert.equal(angularNode,ang);
  assert.deepEqual(nodes[mIndex],{op:'authenticated_source_norm_root',args:['initialized-mean-positive',mean]});
  assert.deepEqual(nodes[bIndex],{op:'authenticated_source_norm_root',args:['slow-background-pressure-atom',name]});
}
const readback={schema:'MathScope.N7.InitialAngularPressureBoundReadback/1',receiptSHA256:sha(original),
  graphSHA256:expectedGraph,sourceRows:162,originalSourceNodes:count,arithmeticNodes:nodes.length,
  stageZeroPressureAtoms:totals,controls:{rejectWrongSineSign:true},
  scope:'Independent readback of the exact signed source pair and the positive bound arithmetic. Original analytic premises remain those in README.'};
await writeFile(out,JSON.stringify(readback,null,2)+'\n');
console.log('PASS independent original signed half-pair and all four stage-zero pressure atom sums.');
console.log('Readback SHA256 '+sha(await readFile(out)));
