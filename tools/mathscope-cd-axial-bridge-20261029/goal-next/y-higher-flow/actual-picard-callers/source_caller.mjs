import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import readline from 'node:readline';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

// Usage: node source_caller.mjs <graph-directory> <source-module> <top-receipt> <out.json>
assert.equal(process.argv.length,6);
const [dir,lib,topPath,out]=process.argv.slice(2);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(sha(fs.readFileSync(lib)),'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311');
const reg=fs.readFileSync(dir+'/original-source-functions.json');
assert.equal(sha(reg),'049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad');
const registry=JSON.parse(reg),expr=JSON.parse(registry.base.expression),pic=JSON.parse(registry.base.picard);
const hash=crypto.createHash('sha256'),nodes=[];let count=-1;
for await(const line of readline.createInterface({input:fs.createReadStream(dir+'/original-source-nodes.jsonl.gz').pipe(zlib.createGunzip()),crlfDelay:Infinity})){
  hash.update(line+'\n');if(count>=0&&count<=130347)nodes.push(JSON.parse(line));count++;
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
const top=fs.readFileSync(topPath);assert.equal(sha(top),'4f9b312d19506108a00fb6a378fe1cbc53f3c708c364297a6c5fd77c1a2ef73d');
const groups=JSON.parse(top).groups,rows=[];
assert.deepEqual(nodes[4756],{op:'coordinate',args:['X']});
for(const [order,system,caller] of [[1,0,28834],[2,3,120220],[3,5,123316],[4,7,126666],[5,9,130332]]){
 const s=pic[system];assert.equal(s.order,order);assert.equal(s.eta,2);assert.equal(s.diagonal[4],3);assert.equal(s.A0[0][4],G.one);assert.deepEqual(s.radialDomain,[0,24806]);
 assert.deepEqual(nodes[caller],{op:'actual_background_even_profile',args:[system,0,4756,2,0,0]});
 assert(groups.some(g=>g.system===system&&g.argument===4756&&g.calls.includes(caller)&&g.allMatchingGuardAndBinderPaths));
 const differentiated=G.derivative(caller,4756);
 assert.deepEqual(G.nodes[differentiated],{op:'actual_background_even_profile',args:[system,0,4756,2,1,0]});
 const expanded=G.materializePicardEvenDerivative(system,0,4756,2,1,0);
 const agenda=[{id:expanded,binders:[],path:[]}],seen=new Set();let witness=null;
 while(agenda.length&&!witness){let z=agenda.pop(),key=z.id+':'+z.binders.map(b=>b.binder).join(',');if(seen.has(key))continue;seen.add(key);
  const n=G.nodes[z.id],path=[...z.path,z.id];
  if(n.op==='actual_natural_series'&&n.args[2]===2){
   const even=z.binders.find(b=>b.name.startsWith('induction_even_X'));
   const average=z.binders.find(b=>b.name.startsWith('actual_Picard_radial_average'));
   if(even&&average){const radial=G.mul(G.sqrt(4756),even.binder,average.binder),y=G.mul(3454,G.pow(radial,2));
    if(n.args[1]===y)witness={call:z.id,args:n.args,radial,y,binders:z.binders,path};}
  }
  if(n.op==='definite_integral'){const [body,binder,left,right]=n.args;
   const bn=G.nodes[binder],name=bn.args[0];assert.equal(bn.op,'coordinate');
   agenda.push({id:body,binders:[...z.binders,{integral:z.id,binder,left,right,name}],path});
   agenda.push({id:left,binders:z.binders,path},{id:right,binders:z.binders,path});
  }else for(const id of children(n))agenda.push({id,binders:z.binders,path});
 }
 assert(witness,'expected source-generated nested even-X and radial-average unit binders for system '+system);
 assert(witness.binders.filter(b=>b.name.startsWith('induction_even_X')||b.name.startsWith('actual_Picard_radial_average')).every(b=>b.left===G.zero&&b.right===G.one));
 rows.push({order,system,caller,callerNode:G.nodes[caller],differentiated,expanded,visited:seen.size,witness});
}
const result={status:'PASS_N4_ORIGINAL_CALLER_GENERATED_EVEN_DERIVATIVE_UNIT_BINDERS',graphSha:'ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd',registrySha:sha(reg),topReceiptSha:sha(top),rows,
 domain:'Prior receipt: original top caller has matching upper-cutoff guard; nonnegative original X must still hold in each actual frame. Under 0<=X<=Xcut=Xa exp(t1/32), both nested t in [0,1], Xa=4/Lambda, 0<t1<1, Y<=4 exp(t1/32)<128/31<5.',scope:'Literal source callers and their requested formal derivative materialization, conditional on analytic validity and prior guard receipt; conservative path reach, not claim selected branches execute, global ingress, Picard convergence, arbitrary-n or all-Y closure.'};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(rows.map(r=>({order:r.order,system:r.system,caller:r.caller,expanded:r.expanded,call:r.witness.call,binders:r.witness.binders}))));
