import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [next,hosted,receiptPath,out]=process.argv.slice(2);
assert.ok(next&&hosted&&receiptPath&&out);
const sha=x=>createHash('sha256').update(x).digest('hex');
const receiptBytes=await readFile(receiptPath),a=JSON.parse(receiptBytes);
const prior={};
for(const [key,[name,checksum]] of Object.entries(a.priorReceipts)){
  const bytes=await readFile(resolve(next,name));
  assert.equal(sha(bytes),checksum);
  prior[key]=JSON.parse(bytes);
}
const registryBytes=await readFile(resolve(hosted,'original-source-functions.json'));
assert.equal(sha(registryBytes),'657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333');
const decode=x=>typeof x==='string'?JSON.parse(x):x;
const reg=decode(decode(registryBytes.toString()).base);
const fields=decode(reg.fieldDefinitions).slice(0,6);
const sourceComponents=['rr','rtheta','rz','thetatheta','thetaz','zz'];
assert.deepEqual(fields.map(f=>f.name),sourceComponents.map(x=>'GlobalCompleteCommonTorus_'+x));
const boundRows=fields.map((f,j)=>{
  const component=sourceComponents[j], receiptRows=a.nativeCovariance.localAngular[component];
  assert.equal(f.rows.length,162);
  assert.deepEqual([...new Set(f.rows.map(r=>r.localBody))].sort((x,y)=>x-y),receiptRows.map(r=>r.guarded).sort((x,y)=>x-y));
  assert.ok(receiptRows.every(r=>r.chiPowers.every(([i,k])=>i+k===2&&i>=0&&k>=0)));
  return f.rows.length;
});
assert.equal(boundRows.reduce((x,y)=>x+y,0),972);
assert.equal(a.nativeCovariance.finalMeanPressure,prior.initialized.roots.finalMeanPressure);
assert.equal(a.nativeCovariance.lateGr,prior.initialized.sourceRecords[3614891]&&3614891);
assert.deepEqual(a.nativeMean.freshTargets,Object.values(prior.initialized.semanticRefs.freshActualTargets));
assert.deepEqual(a.nativeMean.actualVelocity,Object.values(prior.initialized.semanticRefs.rebuiltFinal.velocity));

const deps=({op,args})=>op==='authenticated_source_norm_root'||op==='rational'?[]:op==='integer_power'?[args[0]]:args;
const nodes=a.nodes,p=[];
const bgRoots=new Set(prior.background.bounds.flatMap(r=>[r.F,r.G]));
const targetRoots=new Set(prior.target.bounds.flatMap(r=>r.component));
const fixedRoots=new Set(prior.radial.unweighted.flatMap(f=>f.rows.flatMap(r=>[r.T,r.A])).concat(a.intermediate.rawWholeShiftedFixedRoots));
const nativeRoots=new Set(Object.keys(a.nativeSourceRecords).map(Number));
const sources={'hosted-original':nativeRoots,'target-c7':targetRoots,'background-c8':bgRoots,'fixed-radial':fixedRoots};
function checkPositive(n,i){
  assert.ok(deps(n).every(x=>Number.isSafeInteger(x)&&x>=0&&x<i));
  const {op,args}=n;
  switch(op){
    case 'rational': assert.ok(BigInt(args[0])>=0n&&BigInt(args[1])>0n);return BigInt(args[0])>0n;
    case 'authenticated_source_norm_root': assert.ok(sources[args[0]].has(args[1]));return true;
    case 'add': case 'maximum': return args.some(x=>p[x]);
    case 'multiply': return args.every(x=>p[x]);
    case 'inverse': assert.equal(p[args[0]],true);return true;
    case 'integer_power': assert.ok(Number.isSafeInteger(args[1])&&args[1]>0);return p[args[0]];
    case 'sqrt_positive': return p[args[0]];
    case 'exp': return true;
    default: assert.fail('unexpected bound operation: '+op);
  }
}
for(const [i,n] of nodes.entries())p.push(checkPositive(n,i));
assert.throws(()=>checkPositive({op:'inverse',args:[0]},nodes.length));
const expectedGraph='095864393424caf0c6dd3934ebfe8856e4bc283e70b447d759a2cb0f1f702e7e';
assert.equal(nodes.length,8271);
assert.equal(sha(JSON.stringify(nodes)),expectedGraph);
assert.equal(a.graphSHA256,expectedGraph);
const final=a.roots.initializedMeanPressure;
assert.deepEqual(final,{normalizedValue:8254,normalizedDr:8255,normalizedZ:8256,physicalValue:8257,physicalR:8258,physicalZ:8259});
for(const [physical,normalized] of [[final.physicalValue,final.normalizedValue],[final.physicalR,final.normalizedDr],[final.physicalZ,final.normalizedZ]]){
  assert.equal(nodes[physical].op,'multiply');
  assert.ok(nodes[physical].args.includes(normalized));
  const multiplier=nodes[physical].args.find(x=>x!==normalized);
  assert.equal(nodes[multiplier].op,'exp');
}
const live=new Set(),stack=[final.physicalValue,final.physicalR,final.physicalZ];
while(stack.length){
  const k=stack.pop();
  if(live.has(k))continue;
  live.add(k);
  stack.push(...deps(nodes[k]));
}
for(const root of Object.values(final))assert.ok(live.has(root)&&p[root]);
const imports={};
for(const i of live){
  if(nodes[i].op!=='authenticated_source_norm_root')continue;
  const [namespace,id]=nodes[i].args;
  (imports[namespace]??=[]).push(id);
}
for(const roots of Object.values(imports))roots.sort((x,y)=>x-y);
assert.deepEqual(imports['target-c7'],[...targetRoots].sort((x,y)=>x-y));
assert.deepEqual(imports['background-c8'],[...bgRoots].sort((x,y)=>x-y));
assert.ok(imports['hosted-original'].includes(8)&&imports['hosted-original'].includes(6));

// Independent ordinary radial symbolic rule with the exact sign of
// the vector connection. Terms are sorted by the derivative of beta
// and the power of 1/R. No source operator is evaluated numerically.
const canonical=terms=>Object.entries(terms).filter(([,v])=>v!==0).sort(([x],[y])=>x.localeCompare(y));
function radial(terms){
  const out={};
  const put=(m,p,v)=>{const k=m+':'+p;out[k]=(out[k]??0)+v;};
  for(const [k,v] of Object.entries(terms)){
    const [m,p]=k.split(':').map(Number);
    put(m+1,p,v);
    if(p)put(m,p+1,-p*v);
  }
  return out;
}
const vectorPart={'2:0':1,'1:1':1,'0:2':-1};
const decomposed=radial({'1:0':1,'0:1':1});
assert.deepEqual(canonical(decomposed),canonical(vectorPart));
assert.notDeepEqual(canonical(decomposed),canonical({...vectorPart,'0:2':1}));
const readback={schema:'MathScope.N7.InitializedMeanPressureBoundReadback/1',receiptSHA256:sha(receiptBytes),
  graphSHA256:expectedGraph,sourceRows:972,sourceComponents,arithmeticNodes:nodes.length,finalReachable:live.size,
  importedNormRoots:imports,physicalRoots:[final.physicalValue,final.physicalR,final.physicalZ],
  controls:{rejectWrongVectorConnectionSign:true,rejectZeroInverse:true},
  scope:'Exact source and positive arithmetic readback with the original analytic premises in README.'};
await writeFile(out,JSON.stringify(readback,null,2)+'\n');
console.log('PASS 972 native rows, all actual imported norms, complete initialized mean pressure roots and sign controls.');
console.log('Readback SHA256 '+sha(await readFile(out)));
