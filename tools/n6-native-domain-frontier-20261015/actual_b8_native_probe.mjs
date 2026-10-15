/** Bind literal B8 continuous matrices/debt/correction to the fresh replay. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const opt={};for(let i=2;i<process.argv.length;i+=2){assert(process.argv[i].startsWith('--')&&process.argv[i+1]);opt[process.argv[i].slice(2)]=process.argv[i+1];}
const root=resolve(opt['kernel-root']??process.cwd()),out=resolve(opt.out??'work/ACTUAL_B8_NATIVE_BINDING.json');
const path='research-ide/mathscope-m2/navier/actual-continuation-exact-b8.mjs',before=await readFile(resolve(root,path));
const {prepareActualB8Program}=await import(pathToFileURL(resolve(root,path)));
const p=prepareActualB8Program({etaDerivativeOrder:0,rootIterations:1}),G=p.G,system=G.quadraticSystems[p.system],sourceNodeCount=G.nodes.length;
assert(system.name==='ActualSameN3B8');assert.deepEqual(system.rhs,p.pre.scaledDebt);assert.equal(system.scale,G.parameter('muMoment'));
const q=(a,b=1)=>G.q(a,b),z=G.zero,o=G.one,n=5,width=q(1,4096),supports=Array.from({length:n},(_,j)=>[q(j+6,2048),q(2*(j+6)+1,4096)]);
assert.deepEqual(p.program.B8.geometry.supports,supports);assert.equal(p.program.B8.geometry.width,width);
const power=(x,a,b=1)=>G.exp(G.mul(q(a,b),G.log(x))),bump=(x,j)=>G.step(G.div(G.sub(x,supports[j][0]),width),1),sqrt2=G.sqrt(q(2));
const integral=(fn,j)=>{const x=G.fresh('independent_B8_integral');return G.integral(fn(x),x,...supports[j]);};
const linear=Array.from({length:n},()=>Array(n).fill(z)),quadratic=Array.from({length:n},()=>Array(n).fill(z));
for(let j=0;j<n;j++){
 if(j<2){linear[0][j]=width;linear[1][j]=integral(x=>G.mul(sqrt2,power(x,3,5),bump(x,j)),j);}
 else{linear[2][j]=integral(x=>G.mul(sqrt2,G.sqrt(x),bump(x,j)),j);linear[3][j]=G.neg(integral(x=>G.mul(power(x,1,10),bump(x,j)),j));linear[4][j]=integral(x=>G.mul(power(x,-9,10),bump(x,j)),j);}
 quadratic[3][j]=G.mul(j<2?o:q(-1,2),integral(x=>G.pow(bump(x,j),2),j));
 if(j>=2)quadratic[4][j]=integral(x=>G.div(G.pow(bump(x,j),2),G.mul(q(2),x)),j);
}
function canonical(id,env=new Map()){
 const{op,args}=G.nodes[id];if(op==='coordinate')return env.has(id)?['bound',env.get(id)]:['coordinate',id];
 if(['rational','source_parameter'].includes(op))return[op,args];
 if(op==='definite_integral'){const next=new Map(env);next.set(args[1],env.size);return[op,canonical(args[0],next),canonical(args[2],env),canonical(args[3],env)];}
 if(['integer_power','source_step_derivative'].includes(op))return[op,canonical(args[0],env),args[1]];
 assert(!op.startsWith('actual_'));const c=args.map(a=>canonical(a,env));if(op==='add'||op==='multiply')c.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));return[op,...c];
}
for(let i=0;i<n;i++)for(let j=0;j<n;j++){assert.deepEqual(canonical(system.linear[i][j]),canonical(linear[i][j]));assert.deepEqual(canonical(system.quadraticDiagonal[i][j]),canonical(quadratic[i][j]));}
// The exact preconditioner is a rational matrix, not the actual A inverse.
const qvalue=id=>{const node=G.nodes[id];assert(node.op==='rational');return node.args[0]+'/'+node.args[1];};
const preconditioner=system.preconditioner.map(row=>row.map(qvalue));
assert.equal(G.nodes[system.rootRadius].op,'rational');assert.equal(qvalue(system.rootRadius),'1/1000000');
const X=G.var('X'),x=G.div(X,p.pre.constants.XR),values=p.values;
assert.equal(p.deltaE,G.mul(p.pre.constants.Keta,system.scale,G.add(...[2,3,4].map(j=>G.mul(values[j],bump(x,j))))));
assert.equal(p.deltaU,G.mul(p.pre.constants.Keta,system.scale,G.add(...[0,1].map(j=>G.mul(values[j],bump(x,j))))));
let registryCompared=false;if(opt.compact){const c=JSON.parse(await readFile(resolve(opt.compact),'utf8'));assert.deepEqual(system,c.definitions['quadratic:0'].fullDefinition);registryCompared=true;}
let diagnosticOverlap=0,fixedDefinitionCompared=false;
if(opt.diagnostics){const diag=JSON.parse(await readFile(resolve(opt.diagnostics),'utf8'));
 assert.deepEqual({source:G.source,core:G.core,pressure:G.pressure,outer:G.outer,naturalKernel:G.naturalKernel},diag.fullNativePayloads.fixed);fixedDefinitionCompared=true;
 for(const[id,node]of Object.entries(diag.argumentAndContextGraph)){const i=Number(id);if(i<sourceNodeCount){assert.deepEqual(G.nodes[i],node);diagnosticOverlap++;}}assert(diagnosticOverlap>0);
}
assert.deepEqual(before,await readFile(resolve(root,path)));
const result={schema:'MathScope.N6.ActualB8ContinuousSourceBinding/1',sourcePath:path,sourceSHA256:createHash('sha256').update(before).digest('hex'),sourceBytesUnchanged:true,sourceNodeCount,registryCompared,fixedDefinitionCompared,diagnosticOverlap,
 checks:{all25LinearEntries:true,all25QuadraticEntries:true,actualIncomingScaledDebt:true,exactMuMomentScale:true,literalFiveSupportsAndWidth:true,actualEandUCorrectionBodies:true},
 continuousReplayContract:{alpha:'1/10',supports:Array.from({length:5},(_,j)=>[(j+6)+'/2048',(2*(j+6)+1)+'/4096']),unitMass:false,width:'1/4096',bump:'source sigma derivative order1',linearDefinition:system.linear,quadraticDefinition:system.quadraticDiagonal},
 preconditioner,rootRadius:qvalue(system.rootRadius),sourceRhs:system.rhs,sourceScale:system.scale,
 incomingAnalyticProof:'ACTUAL_B8_INCOMING_AND_POSITIVITY_KO.md',newOriginalGuardsDischarged:0,newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({schema:result.schema,sourceNodeCount,registryCompared,checks:result.checks,newDischarged:0})+'\n');
