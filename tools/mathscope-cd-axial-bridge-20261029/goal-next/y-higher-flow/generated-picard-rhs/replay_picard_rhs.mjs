import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import readline from 'node:readline';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

// Usage: node replay_picard_rhs.mjs <graph-directory> <source-module> <out.json>
assert.equal(process.argv.length,5);
const [dir,lib,out]=process.argv.slice(2);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(sha(fs.readFileSync(lib)),'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311');
const reg=fs.readFileSync(dir+'/original-source-functions.json');
assert.equal(sha(reg),'049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad');
const registry=JSON.parse(reg),expr=JSON.parse(registry.base.expression),pic=JSON.parse(registry.base.picard);
const hash=crypto.createHash('sha256'),nodes=[];let count=-1;
for await(const line of readline.createInterface({input:fs.createReadStream(dir+'/original-source-nodes.jsonl.gz').pipe(zlib.createGunzip()),crlfDelay:Infinity})){
  hash.update(line+'\n');if(count>=0&&count<=130331)nodes.push(JSON.parse(line));count++;
}
assert.equal(count,7358162);assert.equal(hash.digest('hex'),'ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd');
assert.deepEqual(nodes[24806],{op:'sqrt_positive',args:[24805]});
assert.deepEqual(nodes[24805],{op:'multiply',args:[3617,24804]});
assert.deepEqual(nodes[24804],{op:'exp',args:[24803]});
assert.deepEqual(nodes[24803],{op:'multiply',args:[3612,24802]});
assert.deepEqual(nodes[24802],{op:'rational',args:['1','16']});
assert.deepEqual(nodes[3454],{op:'source_parameter',args:['Lambda']});
assert.deepEqual(nodes[3612],{op:'source_parameter',args:['t1']});
assert.deepEqual(nodes[3617],{op:'source_parameter',args:['Xa']});
const adapter=lib.replace('actual-continuation-exact-functions.mjs','actual-residual-order-induction-expressions.mjs');
assert.equal(sha(fs.readFileSync(adapter)),'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501');
const {ActualConvergentExpressions}=await import(pathToFileURL(fs.realpathSync(lib)));
const {ActualInductionExpressions}=await import(pathToFileURL(fs.realpathSync(adapter)));
const G=new ActualInductionExpressions(new ActualConvergentExpressions(),{maxNodes:1500000});
G.nodes=nodes;G.lookup=new Map(nodes.map((n,i)=>[JSON.stringify([n.op,n.args]),i]));
G.expressionSystems=expr;G.picardSystems=pic;G.quadraticSystems=JSON.parse(registry.base.quadratic);G.monotoneSystems=JSON.parse(registry.base.monotone);
G.derivatives=new Map();G.substitutions=new Map();G.dependencyCache=new Map();G.expressionMaterializations=new Map();G.serial=4000000;
function children(n){const a=n.args;if(['coordinate','source_parameter','rational'].includes(n.op))return [];if(['integer_power','source_step_derivative'].includes(n.op))return [a[0]];if(n.op==='actual_natural_series')return [a[1],a[2]];if(['actual_background_picard','actual_background_even_profile'].includes(n.op))return [a[2],a[3]];if(n.op==='actual_expression_partial')return a[1];if(n.op==='definite_integral')return [a[0],a[2],a[3]];return a.filter(Number.isSafeInteger);}
const x=G.fresh('audit_higher_radial_X'),t=G.fresh('audit_higher_radial_t'),xi=G.mul(t,G.sqrt(x));
const Y=G.mul(3454,G.pow(xi,2)),rows=[];
for(const [order,system] of [[1,0],[2,3],[3,5],[4,7],[5,9]]){
 const s=pic[system];assert.equal(s.order,order);assert.equal(s.eta,2);assert.equal(s.diagonal[4],3);assert.deepEqual(s.radialDomain,[0,24806]);
 const rhs=G.picardRhs(system,4,xi,2,0);const seen=new Set(),stack=[rhs],found=[];
 while(stack.length){let id=stack.pop();if(seen.has(id))continue;seen.add(id);const n=G.nodes[id];if(n.op==='actual_natural_series'&&n.args[1]===Y&&n.args[2]===2)found.push({id,args:n.args});stack.push(...children(n));}
 const radial=G.picardRadialDerivative(system,4,G.sqrt(x),2,0);
 const all=new Set(),todo=[radial],binders=[];
 while(todo.length){let id=todo.pop();if(all.has(id))continue;all.add(id);const n=G.nodes[id];
  if(n.op==='definite_integral'){
   const [body,binder,left,right]=n.args;
   if(left===G.zero&&right===G.one&&String(G.nodes[binder]?.args?.[0]).startsWith('actual_Picard_radial_average')){
    const localY=G.mul(3454,G.pow(G.mul(binder,G.sqrt(x)),2)), nested=[],q=[body],visited=new Set();
    while(q.length){const a=q.pop();if(visited.has(a))continue;visited.add(a);const z=G.nodes[a];if(z.op==='actual_natural_series'&&z.args[1]===localY&&z.args[2]===2)nested.push({id:a,args:z.args});q.push(...children(z));}
    if(nested.length)binders.push({integral:id,binder,left,right,localY,natural:nested});
   }
  }
  todo.push(...children(n));
 }
 assert(binders.length,'actual source radial derivative should bind its shifted RHS');
 rows.push({order,system,component:4,xiFormal:s.xi,rhs,visited:seen.size,directNaturalAtShiftedXi:found,radial,sourceUnitBinders:binders});
}
assert(rows.every(row=>row.directNaturalAtShiftedXi.length));
const result={status:'PASS_N4_ACTUAL_FIVE_SYSTEM_SHIFTED_RHS_NATURAL_OPERANDS',inputGraphSha:'ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd',registrySha:sha(reg),xi:{id:xi,node:G.nodes[xi],x,t},Y:{id:Y,node:G.nodes[Y]},rows,
 domain:'Conditionally on 0<=X<=Xa*exp(t1/16), 0<=t<=1, Lambda>0, Xa=4/Lambda and 0<t1<1: Y=Lambda*t^2*X<=4*exp(t1/16)<64/15<5; eta remains formal #2. These are RHS construction calls, not an evaluation of the original infinite Picard solution.',scope:'Only calls with the exact direct Y operand among component 4 RHS in five actual N4 systems; branch-dependent logarithmic operands, other RHS components, the natural-call guards, all recursively materialized derivatives, all actual caller frames and infinite-limit semantics are separate.'};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(rows.map(r=>({order:r.order,system:r.system,radial:r.radial,binders:r.sourceUnitBinders.length,naturalCalls:r.sourceUnitBinders.reduce((n,b)=>n+b.natural.length,0)}))));
