import assert from 'node:assert/strict';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const [graph,base,out]=process.argv.slice(2);
assert.ok(graph&&base&&out);
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const prior=await readFile(base);
assert.equal(sha(prior),'12cc99ba7c3b47c88555e5eaca310fab7471d307e720c40340de78e104d9634d');
const registry=await readFile(resolve(graph,'original-source-functions.json'));
assert.equal(sha(registry),'657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333');
const rows=JSON.parse(JSON.parse(registry).base.fieldDefinitions)[2].rows;
const nodes=new Map(),hash=createHash('sha256');
const gzip=createReadStream(resolve(graph,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
gzip.on('data',chunk=>hash.update(chunk));
const stream=createInterface({input:gzip,crlfDelay:Infinity});
let i=-1;
for await(const line of stream){
  if(i>=0 && i<=644000)nodes.set(i,JSON.parse(line));
  i++;
}
assert.equal(i,4456994);
assert.equal(hash.digest('hex'),'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf');

function args(i,op){
  const x=nodes.get(i);
  assert.equal(x?.op,op,'source '+i);
  return x.args;
}
function exact(i,op,values){assert.deepEqual(args(i,op),values,'source '+i);}
function pair(i,op,known){
  const a=args(i,op);
  assert.equal(a.length,2);
  assert.ok(a.includes(known),'source factor '+known+' at '+i);
  return a[0]===known?a[1]:a[0];
}
exact(5294,'multiply',[23,24]);
exact(23,'add',[9,19]);
exact(22,'add',[19,21]);
exact(21,'multiply',[9,20]);
exact(127,'log_positive',[24]);
exact(24,'rational',['2','1']);
exact(19,'rational',['1','2']);
exact(9,'source_parameter',['h']);

const bindings=rows.map(row=>{
  const zmap=row.derivativeMaps[1];
  assert.equal(zmap.length,1);
  assert.equal(zmap[0].parameter,1);
  const zFactor=zmap[0].coefficient;
  assert.equal(pair(row.values[1],'multiply',622803),zFactor);
  const ratioLog=pair(args(zFactor,'exp')[0],'multiply',22);
  assert.equal(pair(args(row.coefficient,'exp')[0],'multiply',5294),ratioLog);
  const ratio=args(ratioLog,'log_positive')[0];
  const ownQ=args(pair(ratio,'multiply',622794),'inverse')[0];
  const ell=pair(pair(args(ownQ,'exp')[0],'multiply',20),'multiply',127);
  assert.equal(ell,row.label.ell);
  return {label:row.label.key,sign:row.label.sign,ell,ratio,zFactor,covarianceFactor:row.coefficient};
});
assert.equal(bindings.length,162);
assert.equal(new Set(bindings.map(r=>r.label+':'+r.sign)).size,162);
const receipt={
  schema:'MathScope.N7.TransverseWrzAxialScaleSupplement/1',
  parentSHA256:sha(prior),nativeRegistrySHA256:sha(registry),
  checkedNativeRows:bindings.length,bindings,
  sourceFormula:'ratio^(2*A+6*D)=ratio^(4-4*h)<=4^4 on each active original row',
  conditionalPressureTerm:'-eps^6/ci0*T0*T1*N^-1*P_perp*T0(partial_Z^6 W_rz)',
  remainingHighNormsMaterialized:false
};
await writeFile(out,JSON.stringify(receipt,null,2)+'\n');
console.log('PASS literal reference and own dyadic axial covariance scaling, all 162 signed original rows.');
console.log('Receipt SHA256 '+sha(await readFile(out)));
