import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [source,traceFile,out]=process.argv.slice(2);assert.ok(source&&traceFile&&out);
const navier=resolve(source,'research-ide/mathscope-m2/navier'),sha=b=>createHash('sha256').update(b).digest('hex');
for(const [name,pin] of Object.entries({'actual-residual-order-induction-source.mjs':'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047','actual-residual-order-induction-norms.mjs':'0387335a081650c4a6ffed6e213215d32a363350c2a156a7163e82f4c0234634'}))assert.equal(sha(await readFile(resolve(navier,name))),pin,name);
assert.equal(sha(await readFile(traceFile)),'195a465e4570c1da341db4d56d71beb1773d5040bd95b296c17c7dfd2a395edc');
const load=name=>import(pathToFileURL(resolve(navier,name)).href);
const [{prepareActualOrderInduction},{attachActualInductionNorms,assertActualInductionNorms,actualNormCalculus},{traceExactArithmeticDependencies}]=await Promise.all([
 load('actual-residual-order-induction-source.mjs'),load('actual-residual-order-induction-norms.mjs'),import(pathToFileURL(resolve(traceFile)).href)]);
const prepared=prepareActualOrderInduction({order:3,maxNodes:2200000,maxDerivativeOrder:128});
const {G,records,bootstrap}=prepared;assert.equal(G.nodes.length,123870);
const prefix=createHash('sha256');for(const node of G.nodes)prefix.update(JSON.stringify(node)+'\n');
assert.equal(prefix.digest('hex'),'ae216216f5076bd6d8c4d5a61f34af1979141af5f13b591c6de371bc0a672d9e');
console.log('generated original order3 prefix',G.nodes.length);
const norms=attachActualInductionNorms(prepared,{throughOrder:3,derivativeOrder:10});assert(assertActualInductionNorms(norms));assert.ok(Object.values(norms.checks).every(Boolean));
console.log('generated original order3 C10 profile bounds',G.nodes.length);
const q=(n,d=1)=>G.q(n,d),Xa=G.parameter('Xa'),R=G.parameter('C12EnvelopeR');
const fac=n=>Array.from({length:n},(_,i)=>BigInt(i+1)).reduce((a,b)=>a*b,1n),{fn,mul}=actualNormCalculus(G);
const roots={},rows=[];
for(const [index,rec] of records.slice(1).entries()){
 const n=rec.order,row=norms.normalized[index];
 assert.deepEqual(rec.coreAgreement.domain,[G.zero,Xa]);
 assert.deepEqual(row.domain.X,[G.div(Xa,q(2)),G.mul(q(2),bootstrap.orderOne.Xb)]);
 for(const field of ['F','U'])assert.equal(row.actualSourceRoots[field],rec.global[field]);
 const get=(field,r,e)=>{const t=row.jets[field].find(x=>x.radialOrder===r&&x.etaOrder===e);assert(t,`${field},${r},${e}`);return t.upper;};
 const Xlo=row.domain.X[0],invR=fn((r,e)=>e?G.zero:G.div(q(fac(r)),G.mul(G.sqrt(G.mul(q(2),Xlo)),G.pow(Xlo,r))));
 const annularF=mul(invR,fn((r,e)=>get('E',r,e)));
 for(const field of ['F','U']){
  const jets=[];for(let r=0;r<=10;r++)for(let e=0;r+e<=10;e++)jets.push(field==='F'?annularF.get(r,e):get(field,r,e));
  const H=G.maximum(G.one,...jets),upper=G.mul(q(3),G.add(G.one,G.div(G.pow(R,2),q(2))),G.add(G.one,H));
  assert.equal(G.freeCoordinates(upper).size,0);roots[`n${n}_${field}`]=upper;rows.push({order:n,field,H,upper,jetCount:jets.length,actualSourceRoot:rec.global[field]});
 }
}
const trace=traceExactArithmeticDependencies(G,roots);
const bad=trace.nonArithmeticBoundaries.filter(x=>x.node.op!=='definite_integral'||![239,257,275].includes(x.id));assert.deepEqual(bad,[]);
const result={schema:'MathScope.N7.ActualPositiveProfileC8FTCUpperFromC10/1',status:'SOURCE_BOUND_PROFILE_C10_UPPER_OPERANDS',sourceProfile:prepared.program.parameterExpressionSHA256,
  sourcePrefixSHA256:'ae216216f5076bd6d8c4d5a61f34af1979141af5f13b591c6de371bc0a672d9e',rows,roots,trace,originalDefinitions:G.source.parametersExactExpressions,
  scope:'Original n1..3 F/U source profile upper operands through degree10 on the exact original FTC rectangle; one per profile bounds its 45 C8 FTC face sums. Original analytic norm and source provenance required; arithmetic integral boundaries retained, no numeric endpoint or same-live-family join.',release:'HOLD'};
await writeFile(out,JSON.stringify(result)+'\n');console.log(JSON.stringify({status:result.status,nodes:G.nodes.length,roots,traceNodes:trace.nodeCount,boundaries:trace.nonArithmeticBoundaries.map(x=>x.id)}));
