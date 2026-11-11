import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [repo,out]=process.argv.slice(2);
assert.ok(repo&&out);
const load=file=>import(pathToFileURL(resolve(repo,'research-ide/mathscope-m3/navier',file)).href);
const R=await load('source-radial-class-majorants.mjs');
const radial=await R.prepareOriginalRadialClassMajorants({order:4,pole:0,ibpOrder:1});
assert.equal(R.assertOriginalRadialClassMajorants(radial),true);
const rc=await R.originalRadialClassMajorantCertificate(radial);
const sourceSHA='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152';
assert.equal(radial.source.parameterExpressionSHA256,sourceSHA);
const selectedRadial=radial.rows.map((r,e)=>({e,rows:r.orders.slice(0,5).map(o=>({order:o.order,primitive:o.primitiveConstant,
  input:o.primitiveInputOrder}))}));
for(const row of selectedRadial)assert.ok(row.rows.every(o=>o.order===o.input));
const G=radial.G;
const unweighted=radial.change.exponents.slice(0,2).map(e=>({
  weight:e.e,
  rows:e.throughOrder.slice(0,5).map((c,m)=>{
    const common=G.mul(G.q(2*3**m),radial.geometry.B,c.outputPrefactor,c.outputComposition,c.transformedSource);
    const T=G.mul(G.q(2),common,radial.cutoff.rows[m].bound);
    const A=G.mul(common,radial.cutoff.rows[m+1].bound);
    return {order:m,T,A,inputOrder:m};
  })
}));
const used=new Set();
function visit(id){
  if(used.has(id))return;
  const n=G.nodes[id];
  assert.ok(n);
  used.add(id);
  if(['add','multiply','maximum','inverse','sqrt_positive','exp','log_positive'].includes(n.op))for(const child of n.args)visit(child);
  if(n.op==='integer_power')visit(n.args[0]);
}
for(const family of unweighted)for(const row of family.rows)for(const id of [row.T,row.A])visit(id);
const result={schema:'MathScope.N7.InitialMeanFixedOperatorsOrder4/1',sourceSHA,
  radial:{graph:rc.graph,request:radial.request,geometry:radial.geometry,checks:radial.checks,selected: selectedRadial},
  unweighted,unweightedArithmeticClosure:Object.fromEntries([...used].sort((a,b)=>a-b).map(i=>[i,G.nodes[i]])),
  scope:{actualFixedFiniteOperatorsConstructed:true,actualCurrentInputNormsMaterialized:false}};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS original fixed radial through C4 generated; current covariance norm not supplied.');
console.log(JSON.stringify({radialGraph:rc.graph}));
