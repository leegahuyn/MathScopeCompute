/** Read-only binding of the actual C.1 variance/circle native definitions. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const opt={};for(let i=2;i<process.argv.length;i+=2){assert(process.argv[i].startsWith('--')&&process.argv[i+1]);opt[process.argv[i].slice(2)]=process.argv[i+1];}
const root=resolve(opt['kernel-root']??process.cwd()),out=resolve(opt.out??'work/ACTUAL_LOOP_NATIVE_BINDING.json');
const path='research-ide/mathscope-m2/navier/actual-continuation-exact-loop.mjs',before=await readFile(resolve(root,path));
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const {prepareActualLoopProgram}=await import(pathToFileURL(resolve(root,path)));
const p=prepareActualLoopProgram({etaDerivativeOrder:0,rootIterations:0}),G=p.G,program=p.program;
const sourceNodeCount=G.nodes.length,loop=program.loop,state=program.sourceState,variance=loop.variance;
let diagnosticOverlap=0,fixedDefinitionCompared=false;
if(opt.diagnostics){
 const raw=await readFile(resolve(opt.diagnostics));assert.equal(hash(raw.toString('utf8')),'b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1');
 const diag=JSON.parse(raw);
 assert.deepEqual({source:G.source,core:G.core,pressure:G.pressure,outer:G.outer,naturalKernel:G.naturalKernel},diag.fullNativePayloads.fixed);fixedDefinitionCompared=true;
 const prefixEnd=1+Math.max(p.roots.actualC12E,p.roots.actualC12U);
 for(const[id,node]of Object.entries(diag.argumentAndContextGraph)){const i=Number(id);if(i<prefixEnd){assert.deepEqual(G.nodes[i],node);diagnosticOverlap++;}}
 assert(diagnosticOverlap>0);
}
// Constructor returns registry IDs, not the definitions themselves.
assert(Number.isSafeInteger(p.muSystem)&&Number.isSafeInteger(p.thetaSystem));
const muDefinition=G.monotoneSystems[p.muSystem],thetaDefinition=G.monotoneSystems[p.thetaSystem];
assert(muDefinition&&thetaDefinition);assert.equal(loop.muSystem,p.muSystem);assert.equal(loop.thetaSystem,p.thetaSystem);
assert.equal(loop.mu,p.mu);assert.equal(loop.theta,p.theta);
const q=(a,b=1)=>G.q(a,b),z=G.zero,o=G.one,pi=loop.pi,twoPi=loop.twoPi,zz=variance.z;
const X=p.constants.X,eta=p.constants.eta,source=p.pre.functions.sourceFromState(X,G.div(state.E,G.sqrt(G.mul(q(2),X))),state.U,state.moments);
assert.equal(state.E,p.E);assert.equal(state.U,p.U);
assert.equal(state.a,G.sub(o,G.div(G.mul(q(2),X,G.derivative(state.E,X)),state.E)));
assert.equal(state.bs,G.div(G.mul(q(2),X,G.derivative(state.U,X)),state.E));
assert.equal(state.p1,source.p1);assert.equal(state.p2,G.div(G.mul(X,source.ns),state.E));
assert.equal(state.vs,G.add(state.a,G.div(G.pow(state.bs,2),state.a)));
const integrate=(fn,a,b,label)=>{const v=G.fresh(label);return G.integral(fn(v),v,a,b);};
function canonical(id,aliases=new Map(),env=new Map()){
  if(aliases.has(id))return ['atomic',aliases.get(id)];
  const {op,args}=G.nodes[id];
  if(op==='coordinate')return env.has(id)?['bound',env.get(id)]:['coordinate',id];
  if(op==='rational'||op==='source_parameter')return [op,args];
  if(op==='definite_integral'){
    const nested=new Map(env);nested.set(args[1],env.size);
    return [op,canonical(args[0],aliases,nested),canonical(args[2],aliases,env),canonical(args[3],aliases,env)];
  }
  if(op==='integer_power'||op==='source_step_derivative')return [op,canonical(args[0],aliases,env),args[1]];
  if(op.startsWith('actual_'))return [op,args]; // Every background operation must be explicitly aliased below.
  const children=args.map(a=>canonical(a,aliases,env));
  if(op==='add'||op==='multiply')children.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return [op,...children];
}
const same=(a,b,aliases=new Map())=>assert.deepEqual(canonical(a,aliases),canonical(b,aliases));
// Literal branch lineage needed by the two actual radial endpoint collars.
const XR=p.pre.constants.XR,T=G.parameter('T'),lambda=G.parameter('lambda');
const eXR=G.mul(XR,G.exp(o)),decayEnd=G.mul(eXR,G.exp(T)),Xc=G.mul(decayEnd,G.exp(o));
const y=G.log(G.div(X,XR));
const stateE=G.nodes[state.E];assert.equal(stateE.op,'smooth_piecewise');
assert.deepEqual(stateE.args.slice(0,3),[X,p.b8.roots.B8patchRight,XR]);
const earlyE=G.nodes[stateE.args[3]];assert.equal(earlyE.op,'add');
assert(earlyE.args.includes(p.b8.deltaE));
const earlyChoose=G.nodes[earlyE.args.find(i=>i!==p.b8.deltaE)];assert.equal(earlyChoose.op,'smooth_piecewise');
assert.deepEqual(earlyChoose.args.slice(0,3),[X,p.pre.constants.Xa,p.pre.constants.Xi]);
assert.equal(earlyChoose.args[4],p.pre.functions.B26EAt(X));
const outerChoose=G.nodes[stateE.args[5]];assert.equal(outerChoose.op,'smooth_piecewise');
assert.deepEqual(outerChoose.args.slice(0,3),[X,XR,eXR]);
const terminalChoose=G.nodes[outerChoose.args[5]];assert.equal(terminalChoose.op,'smooth_piecewise');
assert.deepEqual(terminalChoose.args.slice(0,3),[X,decayEnd,Xc]);
const expectedPower=G.mul(p.pre.constants.Keta,G.exp(G.add(q(-7,10),G.mul(q(-1,2),T),G.mul(q(-1,2),lambda),G.neg(G.mul(G.add(q(1,2),lambda),G.sub(y,G.add(T,q(2))))))));
assert.equal(terminalChoose.args[5],expectedPower);
assert.equal(state.U,p.b8.actualPreC12U);
const stateU=G.nodes[state.U];assert.equal(stateU.op,'smooth_piecewise');
const axialOuter=G.nodes[stateU.args[5]];assert.equal(axialOuter.op,'smooth_piecewise');
assert.deepEqual(axialOuter.args.slice(0,3),[X,eXR,decayEnd]);
const axialTail=G.nodes[axialOuter.args[5]];assert.equal(axialTail.op,'smooth_piecewise');
assert.equal(axialTail.args[1],z);assert.equal(axialTail.args[3],z);
assert.equal(axialTail.args[0],G.log(G.div(X,G.outer.roots.Xp)));
const pulseStart=G.add(G.add(G.add(o,T),o),G.mul(q(60),G.parameter('BOuter')));
assert.equal(G.outer.roots.Xp,G.mul(XR,G.exp(pulseStart)));
const params=G.source.parametersExactExpressions;
assert.deepEqual(params.loopILeft,{product:[{quotient:[{integer:4},{ref:'Lambda'}]},{exp:{quotient:[{ref:'t1'},{integer:8}]}}]});
assert.deepEqual(params.loopIRight,{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:3}]}}]});
const expectedPi=G.mul(q(4),integrate(t=>G.inv(G.add(o,G.pow(t,2))),z,o,'independent_pi'));
same(pi,expectedPi);
same(twoPi,G.mul(q(2),pi));
const mean=at=>G.div(integrate(theta=>G.exp(G.mul(at,G.sine(theta))),z,twoPi,'independent_exponential_mean'),twoPi);
same(variance.M,mean(zz));
same(variance.R,G.div(mean(G.mul(q(2),zz)),G.pow(variance.M,2)));
assert.equal(variance.R2,G.derivative(G.derivative(variance.R,zz),zz));
const aliases=new Map([[pi,'pi'],[twoPi,'twoPi'],[state.a,'a'],[state.ts,'ts'],[state.p2,'p2'],[loop.target.r,'r'],[loop.target.vTarget,'vTarget'],[loop.mu,'mu'],[loop.phase,'phase'],[loop.parameterChoices.d0,'d0']]);
const qAt=at=>integrate(s=>G.mul(G.sub(o,s),G.substitute(variance.R2,zz,G.mul(s,at))),z,o,'independent_removable_Q');
const muVar=muDefinition.variable;
const expectedMuBody=G.sub(G.mul(loop.parameterChoices.d0,muVar,G.sqrt(qAt(G.mul(muVar,state.p2)))),loop.target.r);
same(muDefinition.body,expectedMuBody,aliases);
assert.equal(muDefinition.name,'ActualC1VarianceRoot');assert.equal(muDefinition.left,z);assert.equal(muDefinition.right,loop.parameterChoices.muMax);
const thetaCoordinate=G.fresh('independent_tilt_theta'),normalizedTilt=G.div(G.exp(G.mul(zz,G.sine(thetaCoordinate))),variance.M),tiltDerivative=G.derivative(normalizedTilt,zz);
const tAt=theta=>G.add(state.ts,G.mul(loop.parameterChoices.d0,loop.mu,integrate(s=>G.simultaneousSubstitute(tiltDerivative,[zz,thetaCoordinate],[G.mul(s,loop.mu,state.p2),theta]),z,o,'independent_t_removable')));
const density=theta=>G.div(G.mul(state.a,G.add(o,G.pow(tAt(theta),2))),G.mul(twoPi,loop.target.vTarget));
const phiAt=theta=>integrate(t=>density(t),z,theta,'independent_circle_lift');
same(thetaDefinition.body,G.sub(phiAt(thetaDefinition.variable),loop.phase),aliases);
same(thetaDefinition.left,G.mul(twoPi,G.sub(loop.phase,o)),aliases);
same(thetaDefinition.right,G.mul(twoPi,G.add(loop.phase,o)),aliases);
assert.equal(thetaDefinition.name,'ActualC1CircleInverseLift');
const primitiveAAt=t=>G.mul(q(1,2),state.a,G.sub(phiAt(t),G.div(t,twoPi)));
const primitiveBAt=t=>G.mul(q(1,2),state.E,state.a,G.sub(G.mul(state.ts,phiAt(t)),G.div(integrate(w=>tAt(w),z,t,'independent_B_primitive'),twoPi)));
const expectedMeanA=integrate(t=>G.mul(primitiveAAt(t),density(t)),z,twoPi,'independent_A_mean');
const expectedMeanB=integrate(t=>G.mul(primitiveBAt(t),density(t)),z,twoPi,'independent_B_mean');
same(loop.means.meanA,expectedMeanA,aliases);same(loop.means.meanB,expectedMeanB,aliases);
const expectedA=G.sub(G.mul(q(1,2),state.a,G.sub(loop.phase,G.div(loop.theta,twoPi))),expectedMeanA);
const expectedB=G.sub(G.mul(q(1,2),state.E,state.a,G.sub(G.mul(state.ts,loop.phase),G.div(integrate(t=>tAt(t),z,loop.theta,'independent_B_at_phase'),twoPi))),expectedMeanB);
same(loop.primitives.A,G.choose(X,p.constants.Ileft,p.constants.Iright,z,expectedA,z),aliases);
same(loop.primitives.B,G.choose(X,p.constants.Ileft,p.constants.Iright,z,expectedB,z),aliases);
const N=G.parameter('radialFrequencyN'),physicalPhase=G.mul(N,G.log(X));
assert.equal(p.roots.actualC12Phase,physicalPhase);
const Aphysical=G.substitute(loop.primitives.A,loop.phase,physicalPhase),Bphysical=G.substitute(loop.primitives.B,loop.phase,physicalPhase);
assert.equal(p.deltaU,G.div(Bphysical,N));
assert.equal(p.deltaE,G.mul(state.E,G.sub(G.exp(G.div(Aphysical,N)),o)));
assert.equal(p.roots.actualC12E,G.add(state.E,p.deltaE));assert.equal(p.roots.actualC12U,G.add(state.U,p.deltaU));
// Compare against the actual g21 registry if its compact extraction is supplied.
let registryCompared=false;
if(opt.compact){const compact=JSON.parse(await readFile(resolve(opt.compact),'utf8'));for(const [i,s] of [[p.muSystem,muDefinition],[p.thetaSystem,thetaDefinition]])assert.deepEqual(s,compact.definitions['monotone:'+i].fullDefinition);registryCompared=true;}
// Only the small scalar variance subgraph is exported, never the complete background.
const seen=new Set(),todo=[variance.M,variance.R,variance.R2,pi,twoPi,zz];
while(todo.length){const id=todo.pop();if(seen.has(id))continue;seen.add(id);const n=G.nodes[id];assert(n);if(['rational','coordinate','source_parameter'].includes(n.op))continue;assert(!n.op.startsWith('actual_'));todo.push(...(['integer_power','source_step_derivative'].includes(n.op)?n.args.slice(0,1):n.args));}
const scalarNodes=Object.fromEntries([...seen].sort((a,b)=>a-b).map(id=>[id,G.nodes[id]]));
const wrongMuBody=G.sub(G.mul(loop.parameterChoices.d0,muVar,G.sqrt(qAt(G.mul(muVar,state.p2)))),G.mul(q(2),loop.target.r));
let wrongRejected=false;try{same(muDefinition.body,wrongMuBody,aliases);}catch{wrongRejected=true;}assert(wrongRejected);
assert.deepEqual(before,await readFile(resolve(root,path)));
const result={schema:'MathScope.N6.ActualC1NativeRegularityBinding/1',sourcePath:path,sourceSHA256:createHash('sha256').update(before).digest('hex'),sourceBytesUnchanged:true,sourceNodeCount,
registryCompared,fixedDefinitionCompared,diagnosticOverlap,monotoneDefinitions:[muDefinition,thetaDefinition],sourceStateRoots:{...state},loopRootContracts:{...loop.target,...loop.parameterChoices,mu:loop.mu,theta:loop.theta,phase:loop.phase,A:loop.primitives.A,B:loop.primitives.B},
checks:{literalActualStateSourceP1P2AndShears:true,literalEndpointParameters:true,literalLeftB26Branch:true,literalRightPowerEBranch:true,literalRightZeroUTailBranch:true,literalPulseStartAfterRightCollar:true,literalPi:true,literalExponentialMean:true,literalVarianceRatio:true,literalSecondDerivative:true,literalRemovableMuEquation:true,literalTiltAndCircleEquation:true,literalGlobalLiftBrackets:true,literalZeroMeanPrimitiveBodies:true,literalFiniteNPhaseAndC12Bodies:true,changedVarianceTargetRejected:wrongRejected},
scalarVariance:{roots:{...variance,pi,twoPi},nodes:scalarNodes,nodeCount:seen.size,sha256:hash([...seen].sort((a,b)=>a-b).map(id=>[id,G.nodes[id]]))},
remainingActualSourcePremises:['Completed background E,U,moments are C-infinity on a neighborhood of the full loop rectangle.','E>0, a^-1<=S, vs<=S, abs(p2)<=S on that rectangle.','vs-2>=S^-1 on two endpoint collars for the radial zero extension.'],newOriginalGuardsDischarged:0,newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');
process.stdout.write(JSON.stringify({schema:result.schema,sourceNodeCount,scalarVarianceNodes:seen.size,registryCompared,checks:result.checks,newDischarged:0})+'\n');
