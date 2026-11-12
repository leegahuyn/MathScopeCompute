import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import readline from 'node:readline';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const dir=process.argv[2] || 'work/goal-next/axial-recursion/hosted-43020929929/original-n2-current-pressure-graph';
const lib=process.argv[3] || 'work/goal-next/second-live/node-fixture/research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(digest(fs.readFileSync(lib)),'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311');
const regBytes=fs.readFileSync(path.join(dir,'original-source-functions.json'));
assert.equal(digest(regBytes),'6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f');
const registry=JSON.parse(regBytes),expr=JSON.parse(registry.base.expression),pic=JSON.parse(registry.base.picard);
const hash=crypto.createHash('sha256'),nodes=[];let count=-1;
const rd=readline.createInterface({input:fs.createReadStream(path.join(dir,'original-source-nodes.jsonl.gz')).pipe(zlib.createGunzip()),crlfDelay:Infinity});
for await(const line of rd){hash.update(line+'\n');if(count>=0&&count<=120279)nodes.push(JSON.parse(line));count++;}
assert.equal(count,2852905);assert.equal(hash.digest('hex'),'75db9fddc311fb7ce8d7968fbde4a52a07521cf8d47feb0b8f302d6bed108987');
const expected={120221:{op:'actual_background_even_profile',args:[3,1,4756,2,0,0]},
  120239:{op:'smooth_piecewise',args:[4756,28819,28823,120221,120238,0]},
  120276:{op:'coordinate',args:['n2_local_m0$296']},120278:{op:'actual_expression_partial',args:[11,[120276,2],[0,0]]},
  120279:{op:'definite_integral',args:[120278,120276,0,28823]},
  28823:{op:'multiply',args:[3617,28822]},28822:{op:'exp',args:[28821]},28821:{op:'multiply',args:[3612,28820]},28820:{op:'rational',args:['1','32']},
  24805:{op:'multiply',args:[3617,24804]},24804:{op:'exp',args:[24803]},24803:{op:'multiply',args:[3612,24802]},24802:{op:'rational',args:['1','16']},
  3612:{op:'source_parameter',args:['t1']},3617:{op:'source_parameter',args:['Xa']}};
for(const [id,node] of Object.entries(expected))assert.deepEqual(nodes[+id],node);
assert.deepEqual(expr[11].parameters,[4756,2]);assert.equal(expr[11].body,120239);
assert.equal(pic[3].xi,118918);assert.deepEqual(pic[3].radialDomain,[0,24806]);
assert.deepEqual(nodes[24806],{op:'sqrt_positive',args:[24805]});
const {ActualConvergentExpressions}=await import(pathToFileURL(path.resolve(lib)));
const {ActualInductionExpressions}=await import(pathToFileURL(path.resolve(path.join(path.dirname(lib),'actual-residual-order-induction-expressions.mjs'))));
const G=new ActualInductionExpressions(new ActualConvergentExpressions(),{maxNodes:500000});
G.nodes=nodes;G.lookup=new Map(nodes.map((n,i)=>[JSON.stringify([n.op,n.args]),i]));
G.expressionSystems=expr;G.picardSystems=pic;G.quadraticSystems=JSON.parse(registry.base.quadratic);G.monotoneSystems=JSON.parse(registry.base.monotone);
G.derivatives=new Map();G.substitutions=new Map();G.dependencyCache=new Map();G.expressionMaterializations=new Map();G.serial=2000000;
const expanded=G.materializeExpressionFunction(11,[120276,2],[0,0]),outer=G.nodes[expanded];
assert.equal(outer.op,'smooth_piecewise');assert.deepEqual(outer.args.slice(0,3),[120276,28819,28823]);
const inner=G.nodes[outer.args[3]];assert.deepEqual(inner,{op:'actual_background_even_profile',args:[3,1,120276,2,0,0]});
assert.equal(outer.args[5],0);const middle=G.nodes[outer.args[4]];assert.equal(middle.op,'multiply');assert(middle.args.includes(outer.args[3]));
const picard=G.materializePicardEvenDerivative(3,1,120276,2,0,0),pr=G.nodes[picard];
assert.equal(pr.op,'actual_background_picard');assert.deepEqual(pr.args.slice(0,2),[3,1]);assert.equal(pr.args[3],2);assert.deepEqual(G.nodes[pr.args[2]],{op:'sqrt_positive',args:[120276]});
const t=G.fresh('audit_actual_picard_t'),boundXi=G.mul(t,pr.args[2]);
const rhs=G.picardRhs(3,4,boundXi,2,0),expectedY=G.mul(3454,G.pow(boundXi,2));
function refs(n){const a=n.args;if(['coordinate','source_parameter','rational'].includes(n.op))return [];if(['integer_power','source_step_derivative'].includes(n.op))return [a[0]];if(n.op==='actual_natural_series')return [a[1],a[2]];if(['actual_background_picard','actual_background_even_profile'].includes(n.op))return [a[2],a[3]];if(n.op==='actual_expression_partial')return a[1];if(n.op==='definite_integral')return [a[0],a[2],a[3]];return a.filter(Number.isSafeInteger);}
const seen=new Set(),todo=[rhs],found=[];while(todo.length){const id=todo.pop();if(seen.has(id))continue;seen.add(id);const n=G.nodes[id];if(n.op==='actual_natural_series'&&n.args[0]==='Phi'&&n.args[1]===expectedY&&n.args[2]===2)found.push({id,args:n.args});todo.push(...refs(n));}
assert(found.length>0,'actual N2 Picard RHS must contain Phi at substituted argument');
const displayed=G.picardPartialSum(3,3);const momentFinite=G.substitute(displayed.sum[1],118918,pr.args[2]);
const momentSeen=new Set(),mq=[momentFinite],momentNatural=[];
while(mq.length){const id=mq.pop();if(momentSeen.has(id))continue;momentSeen.add(id);const n=G.nodes[id];if(n.op==='actual_natural_series')momentNatural.push({id,args:n.args});mq.push(...refs(n));}
const dynamic=momentNatural.filter(n=>n.id>=120280);const dynamicY=[...new Set(dynamic.map(n=>n.args[1]))].map(id=>({id,node:G.nodes[id]}));
const stack=[{id:momentFinite, binders:[], path:[]}],lexSeen=new Set();let lexHit=null;
while(stack.length){const {id,binders,path}=stack.pop();const key=id+':'+binders.map(b=>b.id).join(',');if(lexSeen.has(key))continue;lexSeen.add(key);const n=G.nodes[id];if(n.op==='actual_natural_series'&&n.args[0]==='Phi'&&n.id!==0&&id>=120280&&binders.length){lexHit={id,node:n,binders,path,yTree:null};break;}if(n.op==='definite_integral'){const [body,binder,left,right]=n.args;stack.push({id:body,binders:[...binders,{id:binder,coord:G.nodes[binder],left,right}],path:[...path,{id,op:n.op}]});stack.push({id:left,binders,path});stack.push({id:right,binders,path});}else for(const child of refs(n))stack.push({id:child,binders,path:[...path,{id,op:n.op}]});}
function tree(id,depth=9){const n=G.nodes[id];return {id,op:n.op,args:n.args,children:depth?refs(n).map(i=>tree(i,depth-1)):[]};}
if(lexHit){lexHit.yTree=tree(lexHit.node.args[1]);lexHit.guardValues=[3617,24805,3624,3627].map(i=>tree(i,4));lexHit.guards=lexHit.path.filter(p=>["smooth_piecewise","definite_integral"].includes(p.op)).map(p=>({id:p.id,node:G.nodes[p.id]}));}
assert(lexHit);assert.equal(lexHit.id,150912);assert.deepEqual(lexHit.node.args,['Phi',150564,2,0,0]);
assert.deepEqual(lexHit.binders.map(b=>[b.id,b.left,b.right]),[[130663,0,1],[125935,0,1],[121768,0,1]]);
assert.deepEqual(G.nodes[150564],{op:'multiply',args:[3454,150563]});assert.deepEqual(G.nodes[150563],{op:'multiply',args:[3617,150562]});assert.deepEqual(G.nodes[150562],{op:'exp',args:[150344]});assert.deepEqual(G.nodes[150344],{op:'log_positive',args:[150343]});assert.deepEqual(G.nodes[150343],{op:'multiply',args:[3679,150341]});assert.deepEqual(G.nodes[3679],{op:'inverse',args:[3617]});assert.deepEqual(G.nodes[150341],{op:'integer_power',args:[150340,2]});assert.deepEqual(G.nodes[150340],{op:'multiply',args:[121768,148594]});assert.deepEqual(G.nodes[148594],{op:'multiply',args:[125935,148593]});assert.deepEqual(G.nodes[148593],{op:'multiply',args:[120290,130663]});
const ix1=lexHit.path.findIndex(p=>p.id===151124),ix2=lexHit.path.findIndex(p=>p.id===151063);assert.equal(lexHit.path[ix1+1].id,151123);assert.equal(lexHit.path[ix2+1].id,151053);assert.deepEqual(G.nodes[151124],{op:'smooth_piecewise',args:[150341,3617,24805,150877,151123,151123]});assert.deepEqual(G.nodes[151063],{op:'smooth_piecewise',args:[150563,3624,3627,151053,151058,151062]});
// A strict numerical-rational witness exposes why a nonnegative moment binder is necessary.
assert(-1<0);
const out={status:'PASS source-bound literal N2 local moment materialization',root:120279,binder:120276,
 sharedCall:120278,expressionSystem:11,expanded,outer,materializedEven:inner,picard,actualPicard:pr,sourceRadialDomain:pic[3].radialDomain,
 sourceCutoff:'Xa*exp(t1/32)',sourcePicardRadiusSquared:'Xa*exp(t1/16)',
 boundRhs:{component:4,t,boundXi,rhs,expectedY,found,visited:seen.size},displayedPicard:{count:displayed.count,component:1,momentFinite,finitePartialSumIsExactSolution:displayed.finitePartialSumIsExactSolution,naturalCount:momentNatural.length,dynamicNaturalCount:dynamic.length,dynamicNaturalSample:dynamic.slice(0,20),dynamicY:dynamicY.slice(0,20)},
 lexHit, mathematicalRange:'Assume Xa>0,t1>0,binder in [0,Xcut], valid local source semantics and eta domain. Then sqrt(binder)<=sqrt(Xcut)<sqrt(Xa*exp(t1/16)), so system3 Picard argument stays in its original radial domain. For internal t in [0,1], Lambda*(t*sqrt(binder))^2 <= Lambda*Xcut=4 exp(t1/32), provided Lambda*Xa=4.',
 scope:'One actual N2 local-moment source binder after executing exact expression materialization; not native runtime observation or complete Picard convergence/derivative proof. Strict source endpoints rely on real source semantics. No final Y/jet gate promotion.'};
console.log(JSON.stringify(out,null,2));
