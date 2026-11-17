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
 const todo=[expanded],seen=new Set(),natural=[];
 while(todo.length){const id=todo.pop();if(seen.has(id)||id<130348)continue;seen.add(id);const n=G.nodes[id];if(n.op==='actual_natural_series')natural.push({id,args:n.args});todo.push(...children(n));}
 const factor=(id)=>{const z=G.nodes[id];return z.op==='multiply'?[...factor(z.args[0]),...factor(z.args[1])]:[id]};
 const fold=(id)=>{const n=G.nodes[id];if(n.op!=='multiply'||!n.args.includes(3617))return null;let e=n.args.find(x=>x!==3617),en=G.nodes[e];if(en.op!=='exp')return null;let ln=G.nodes[en.args[0]];if(ln.op!=='log_positive')return null;let p=G.nodes[ln.args[0]];if(p.op!=='multiply'||!p.args.includes(3679))return null;return p.args.find(x=>x!==3679);};
 const decode=(id)=>{let a=G.nodes[id].args,head,body;if(G.nodes[id].op!=='multiply')return null;if(a.includes(3454)){head=3454;body=a.find(x=>x!==3454);let q=G.nodes[body];if(q.op==='integer_power'&&q.args[1]===2)return {kind:'direct',square:body};let b=fold(body);if(b!==null&&G.nodes[b].op==='integer_power'&&G.nodes[b].args[1]===2)return {kind:'one-log',square:b};return null;}if(a.includes(474)){head=474;body=a.find(x=>x!==474);let e=G.nodes[body];if(e.op!=='exp')return null;let l=G.nodes[e.args[0]];if(l.op!=='log_positive')return null;let p=G.nodes[l.args[0]];if(p.op!=='multiply'||!p.args.includes(3679))return null;let b=fold(p.args.find(x=>x!==3679));if(b!==null&&G.nodes[b].op==='integer_power'&&G.nodes[b].args[1]===2)return {kind:'two-log',square:b};}return null;};
 const reaches=(targets,cut)=>{let q=[expanded],vis=new Set(),hit=new Set();while(q.length){let id=q.pop();if(id<130348||vis.has(id))continue;vis.add(id);if(targets.has(id))hit.add(id);let n=G.nodes[id],a=n.args,ch=children(n);if(n.op==='definite_integral'&&cut.binder===a[1])ch=[a[2],a[3]];if(n.op==='smooth_piecewise'&&cut.square===a[0]&&a[1]===3617)ch=[a[0],a[1],a[2],a[3]];q.push(...ch);}return hit.size;};
 const ys=[];
 for(const y of new Set(natural.map(x=>x.args[1]))){const dec=decode(y);assert(dec,'unexpected dynamic natural operand '+y);const factors=factor(G.nodes[dec.square].args[0]);
  const sqrt=factors.filter(id=>G.nodes[id].op==='sqrt_positive'&&G.nodes[id].args[0]===4756);
  const unit=factors.filter(id=>G.nodes[id].op==='coordinate'&&/^(induction_even_X|actual_Picard_radial_average)/.test(G.nodes[id].args[0]));
  assert.equal(sqrt.length,1);assert.equal(factors.length,1+unit.length);assert(unit.length===1||unit.length===2);
  assert.equal(unit.filter(id=>G.nodes[id].args[0].startsWith('induction_even_X')).length,1);
  const targets=new Set(natural.filter(n=>n.args[1]===y).map(n=>n.id));assert([...targets].every(id=>G.nodes[id].args[2]===2));assert.equal(reaches(targets,{}),targets.size);
  const integralChecks=[];
  for(const binder of unit){let bindings=[];for(const id of seen){const n=G.nodes[id];if(n.op==='definite_integral'&&n.args[1]===binder)bindings.push({id,left:n.args[2],right:n.args[3]});}
   assert(bindings.length&&bindings.every(b=>b.left===G.zero&&b.right===G.one));let after=reaches(targets,{binder});assert.equal(after,0);integralChecks.push({binder,bindings,reachableAfterCut:after});}
  let guardCut=null;if(dec.kind!=='direct'){guardCut=reaches(targets,{square:dec.square});assert.equal(guardCut,0,'positive-log guard not dominant for '+y);}
  ys.push({id:y,...dec,sqrt:sqrt[0],unit,naturalCount:targets.size,naturalCalls:[...targets].sort((a,b)=>a-b),integralChecks,logGuardCutReach:guardCut});
 }
 rows.push({order,system,caller,differentiated,expanded,visited:seen.size,naturalCount:natural.length,ys});
}
const all=rows.flatMap(r=>r.ys.flatMap(y=>y.naturalCalls));assert.equal(all.length,114);assert.equal(new Set(all).size,114);
const result={status:'PASS_N4_FIVE_ACTUAL_FIRST_DERIVATIVE_DYNAMIC_NATURAL_RANGE_CONDITIONAL',rows,dynamicUniqueCalls:all.length,scope:'Only dynamically allocated natural nodes in the five materialized first-X derivative expressions and their ordinary AST edges; source cutoff caller, image, eta, lazy semantics and source real parameters remain conditional. Dynamic lower native-definition expansion and all other generated jets remain open.'};fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(rows.map(r=>({order:r.order,visited:r.visited,natural:r.naturalCount,ys:r.ys.map(y=>[y.kind,y.naturalCount])}))));
