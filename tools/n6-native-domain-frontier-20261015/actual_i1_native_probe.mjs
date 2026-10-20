/** Bind the true C12 debts and original continuous I1 operator. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const opt={};for(let i=2;i<process.argv.length;i+=2){assert(process.argv[i].startsWith('--')&&process.argv[i+1]);opt[process.argv[i].slice(2)]=process.argv[i+1];}
const root=resolve(opt['kernel-root']),out=resolve(opt.out),path='research-ide/mathscope-m2/navier/actual-continuation-exact-global.mjs';
const before=await readFile(resolve(root,path));assert.equal(createHash('sha256').update(before).digest('hex'),'497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f');
const {prepareActualGlobalLeadingProgram}=await import(pathToFileURL(resolve(root,path)));
// The complete original leading constructor uses exactly one displayed I1
// iterate. It is retained for prefix identity, never used as a root value.
const p=prepareActualGlobalLeadingProgram({etaDerivativeOrder:0,rootIterations:1}),G=p.G,sourceNodeCount=G.nodes.length;
const compact=JSON.parse(await readFile(resolve(opt.compact),'utf8')),system=G.quadraticSystems[p.system];
assert.deepEqual(system,compact.definitions['quadratic:1'].fullDefinition);
const diagRaw=await readFile(resolve(opt.diagnostics));assert.equal(createHash('sha256').update(diagRaw).digest('hex'),'b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1');
const diag=JSON.parse(diagRaw);assert.deepEqual({source:G.source,core:G.core,pressure:G.pressure,outer:G.outer,naturalKernel:G.naturalKernel},diag.fullNativePayloads.fixed);
let diagnosticOverlap=0;for(const[id,node]of Object.entries(diag.argumentAndContextGraph)){const i=Number(id);if(i<sourceNodeCount){assert.deepEqual(G.nodes[i],node);diagnosticOverlap++;}}assert(diagnosticOverlap>0);
for(let i=0;i<2;i++)assert.deepEqual(G.monotoneSystems[i],compact.definitions['monotone:'+i].fullDefinition);
const q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,sqrt2=G.sqrt(q(2)),{X,eta,Ileft,Iright,N,X0,K,lambda}=p.constants;
const expectedK=G.mul(G.parameter('Pstar'),G.exp(G.add(G.mul(q(-1,2),G.parameter('T')),q(-7,10),G.mul(q(-1,2),lambda),G.neg(G.mul(G.add(q(1,2),lambda),G.sub(G.mul(q(60),G.parameter('BOuter')),q(25)))))),G.inv(G.add(o,G.pow(eta,2))));
assert.equal(K,expectedK);
const loop=p.loop,phase=loop.program.loop.phase,physicalPhase=G.mul(N,G.log(X));
const actualA=G.substitute(loop.program.loop.primitives.A,phase,physicalPhase),actualB=G.substitute(loop.program.loop.primitives.B,phase,physicalPhase);
assert.equal(loop.deltaE,G.mul(loop.E,G.sub(G.exp(G.div(actualA,N)),o)));assert.equal(loop.deltaU,G.div(actualB,N));
const first=G.nodes[p.actualDebts[0]];assert.equal(first.op,'definite_integral');const logX=first.args[1],radial=G.exp(logX),at=id=>G.substitute(id,X,radial);
const ev=at(loop.E),uv=at(loop.U),de=at(loop.deltaE),du=at(loop.deltaU),power=(x,a,b=1)=>G.exp(G.mul(q(a,b),G.log(x)));
const density=[G.mul(radial,du),G.mul(sqrt2,power(radial,3,2),de),
 G.mul(sqrt2,power(radial,3,2),G.add(G.mul(ev,du),G.mul(uv,de),G.mul(du,de))),
 G.mul(radial,G.add(G.mul(q(2),uv,du),G.pow(du,2),G.neg(G.mul(ev,de)),G.mul(q(-1,2),G.pow(de,2)))),
 G.add(G.mul(ev,de),G.mul(q(1,2),G.pow(de,2)))];
for(let j=0;j<5;j++)assert.deepEqual(G.nodes[p.actualDebts[j]],{op:'definite_integral',args:[density[j],logX,G.log(Ileft),G.log(Iright)]});
const[dM,dI,dJ,dS,dCp]=p.actualDebts,K2=G.pow(K,2),X032=power(X0,3,2);
const normalized=[G.div(dM,G.mul(X0,K,lambda)),G.div(G.sub(G.div(dJ,G.mul(sqrt2,X032,K2)),G.div(dM,G.mul(X0,K))),G.pow(lambda,2)),
 G.div(dI,G.mul(X032,K,lambda)),G.div(dS,G.mul(X0,K2,lambda)),G.div(dCp,G.mul(K2,lambda))];
assert.deepEqual(p.normalizedDebts,normalized);assert.deepEqual(system.rhs,normalized.map(v=>G.neg(v)));assert.equal(system.scale,lambda);
const wrongSecond=G.div(G.sub(G.div(dJ,G.mul(sqrt2,X032,K2)),G.div(dM,G.mul(X0,K))),lambda);
assert.notEqual(wrongSecond,normalized[1]);
const omittedCross=G.mul(sqrt2,power(radial,3,2),G.add(G.mul(ev,du),G.mul(uv,de)));
assert.notEqual(omittedCross,density[2]);
const supports=Array.from({length:5},(_,j)=>[q(j+9),q(2*(j+9)+1,2)]),width=q(1,2),bump=(x,j)=>G.div(G.step(G.div(G.sub(x,supports[j][0]),width),1),width);
assert.deepEqual(p.program.I1.patch.supports,supports);assert.equal(p.program.I1.patch.width,width);
const integral=(fn,j)=>{const x=G.fresh('independent_I1_unit_bump');return G.integral(fn(x),x,...supports[j]);};
const A=Array.from({length:5},()=>Array(5).fill(z)),Q=Array.from({length:5},()=>Array(5).fill(z));
for(let j=0;j<5;j++){
 if(j<2){A[0][j]=o;A[1][j]=integral(x=>{const s=G.fresh('independent_I1_divided_log');return G.neg(G.mul(bump(x,j),G.integral(G.exp(G.neg(G.mul(lambda,s))),s,z,G.log(x))));},j);}
 else{A[2][j]=integral(x=>G.mul(sqrt2,G.sqrt(x),bump(x,j)),j);A[3][j]=G.neg(integral(x=>G.mul(G.exp(G.neg(G.mul(G.add(q(1,2),lambda),G.log(x)))),bump(x,j)),j));A[4][j]=integral(x=>G.mul(G.exp(G.neg(G.mul(G.add(q(3,2),lambda),G.log(x)))),bump(x,j)),j);}
 Q[3][j]=G.mul(j<2?o:q(-1,2),integral(x=>G.pow(bump(x,j),2),j));if(j>=2)Q[4][j]=integral(x=>G.div(G.pow(bump(x,j),2),G.mul(q(2),x)),j);
}
function canonical(id,env=new Map()){
 const{op,args}=G.nodes[id];if(op==='coordinate')return env.has(id)?['bound',env.get(id)]:['coordinate',id];
 if(['rational','source_parameter'].includes(op))return[op,args];
 if(op==='definite_integral'){const next=new Map(env);next.set(args[1],env.size);return[op,canonical(args[0],next),canonical(args[2],env),canonical(args[3],env)];}
 if(['integer_power','source_step_derivative'].includes(op))return[op,canonical(args[0],env),args[1]];
 assert(!op.startsWith('actual_'));const cs=args.map(a=>canonical(a,env));if(op==='add'||op==='multiply')cs.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));return[op,...cs];
}
for(let i=0;i<5;i++)for(let j=0;j<5;j++){assert.deepEqual(canonical(system.linear[i][j]),canonical(A[i][j]));assert.deepEqual(canonical(system.quadraticDiagonal[i][j]),canonical(Q[i][j]));}
const det=G.determinant(system.linear),inverse=system.linear.map((_,i)=>system.linear.map((__,j)=>G.div(G.mul(q((i+j)%2?-1:1),G.determinant(system.linear.filter((_,r)=>r!==j).map(row=>row.filter((_,c)=>c!==i)))),det)));
assert.deepEqual(system.preconditioner,inverse);assert.deepEqual(G.nodes[system.rootRadius],{op:'rational',args:['1','1000000']});
assert.equal(N,G.parameter('radialFrequencyN'));assert.equal(X0,G.parameter('X0I1'));assert.equal(lambda,G.parameter('lambda'));
assert.deepEqual(before,await readFile(resolve(root,path)));
const result={schema:'MathScope.N6.ActualI1TrueDebtSourceBinding/1',sourcePath:path,sourceSHA256:createHash('sha256').update(before).digest('hex'),sourceBytesUnchanged:true,
 sourceNodeCount,registryCompared:true,fixedDefinitionCompared:true,diagnosticOverlap,sourceHeaderSHA256:compact.sourceHeaderSHA256,
 actualQuadraticDefinition:system,actualLoopDefinitions:[G.monotoneSystems[0],G.monotoneSystems[1]],
 actualRoots:{X,eta,E:loop.E,U:loop.U,physicalPhase,actualA,actualB,deltaE:loop.deltaE,deltaU:loop.deltaU,actualDebts:p.actualDebts,normalizedDebts:p.normalizedDebts,N,X0,K,lambda},
 checks:{actualLoopDefinitionsEqual:true,literalFiniteNC12ExponentialAndAxialAddition:true,allFiveActualDensityIntegrandsAndBounds:true,
 allOriginalDebtNormalizationsIncludingLambdaMinusTwo:true,all25OriginalContinuousLinearEntries:true,all25OriginalQuadraticEntries:true,
 actualExactAdjugateInverse:true,originalUnitMassBumpsAndSupports:true,literalActualI1K:true,originalRootRadiusComparedOnly:true},
 strictNegativeControls:{omittedLambdaMinusTwoRejected:true,omittedActualMixedDensityProductRejected:true},
 proof:'ACTUAL_I1_TRUE_DEBT_CONTRACTION_KO.md',newOriginalGuardsDischarged:0,newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({schema:result.schema,sourceNodeCount,actualTrueDebtBinding:true,newDischarged:0})+'\n');
