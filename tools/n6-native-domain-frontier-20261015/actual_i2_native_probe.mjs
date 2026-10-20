/** Literal full heat debts and positive terminal geometry, small cloud probe. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const opt={};for(let i=2;i<process.argv.length;i+=2){assert(process.argv[i].startsWith('--')&&process.argv[i+1]);opt[process.argv[i].slice(2)]=process.argv[i+1];}
const root=resolve(opt['kernel-root']),out=resolve(opt.out),path='research-ide/mathscope-m2/navier/actual-continuation-exact-heat.mjs',before=await readFile(resolve(root,path));
assert.equal(createHash('sha256').update(before).digest('hex'),'c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172');
// The original g graph builds order one before attaching heat. Reproduce its
// exact bootstrap, including the zero displayed iterates, so node identity is
// checked against the original compact graph rather than a different prefix.
const bootstrapPath='research-ide/mathscope-m2/navier/actual-continuation-exact-stress.mjs';
const bootstrapBefore=await readFile(resolve(root,bootstrapPath));
const {prepareActualOrderOneStressProgram}=await import(pathToFileURL(resolve(root,bootstrapPath)));
const bootstrap=prepareActualOrderOneStressProgram({terms:0,bits:128,heatIterations:0});
const p=bootstrap.actualHeat,G=p.G,sourceNodeCount=G.nodes.length,heat=p.heat;
const compact=JSON.parse(await readFile(resolve(opt.compact),'utf8')),q1=G.quadraticSystems[p.system],q2=G.quadraticSystems[heat.system];
assert.deepEqual(q1,compact.definitions['quadratic:1'].fullDefinition);assert.deepEqual(q2,compact.definitions['quadratic:2'].fullDefinition);
assert.equal(heat.finalF,compact.definitions['expression:2'].fullDefinition.body);
assert.equal(p.finalU,compact.definitions['expression:3'].fullDefinition.body);
const diagRaw=await readFile(resolve(opt.diagnostics));assert.equal(createHash('sha256').update(diagRaw).digest('hex'),'b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1');
const diag=JSON.parse(diagRaw);assert.deepEqual({source:G.source,core:G.core,pressure:G.pressure,outer:G.outer,naturalKernel:G.naturalKernel},diag.fullNativePayloads.fixed);
let diagnosticOverlap=0;for(const[id,node]of Object.entries(diag.argumentAndContextGraph)){const i=Number(id);if(i<sourceNodeCount){assert.deepEqual(G.nodes[i],node);diagnosticOverlap++;}}assert(diagnosticOverlap>0);
const q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,P=G.parameter('Pstar'),XR=G.parameter('XR'),T=G.parameter('T'),B=G.parameter('BOuter'),h=G.parameter('h'),lambda=G.parameter('lambda'),eta=G.core.eta;
const exp=x=>G.exp(x),neg=x=>G.neg(x),rho=G.mul(G.parameter('co'),h),A=G.add(q(1,2),h),alpha=neg(G.add(q(1,2),lambda));
const integral=(fn,left,right,prefix)=>{const t=G.fresh(prefix);return G.integral(fn(t),t,left,right);};
const Sint=x=>integral(t=>G.step(t),z,x,'independent_I2_sigma_primitive');
const aliases=new Map();
function canon(id,env=new Map()){
 if(aliases.has(id))return['alias',aliases.get(id)];
 const{op,args}=G.nodes[id];if(op==='coordinate')return env.has(id)?['bound',env.get(id)]:['coordinate',id];
 if(['rational','source_parameter'].includes(op))return[op,args];
 if(op==='definite_integral'){const next=new Map(env);next.set(args[1],env.size);return[op,canon(args[0],next),canon(args[2],env),canon(args[3],env)];}
 if(['integer_power','source_step_derivative'].includes(op))return[op,canon(args[0],env),args[1]];
 assert(!op.startsWith('actual_'));let cs=args.map(a=>canon(a,env));
 if(op==='add'||op==='multiply'){
  cs=cs.flatMap(c=>c[0]===op?c.slice(1):[c]);let num=op==='add'?0n:1n,den=1n;const rest=[];
  const gcd=(a,b)=>b===0n?(a<0n?-a:a):gcd(b,a%b);
  for(const c of cs)if(c[0]==='rational'){const n=BigInt(c[1][0]),d=BigInt(c[1][1]);if(op==='add'){num=num*d+n*den;den*=d;}else{num*=n;den*=d;}const g=gcd(num,den);num/=g;den/=g;}else rest.push(c);
  if(op==='multiply'&&num===0n)return['rational',['0','1']];
  if(op==='add'?num!==0n:num!==den)rest.push(['rational',[String(num),String(den)]]);
  if(rest.length===0)return['rational',[op==='add'?'0':'1','1']];if(rest.length===1)return rest[0];cs=rest;
  cs.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 }
 return[op,...cs];
}
const same=(a,b)=>assert.deepEqual(canon(a),canon(b));
// The only non-explicit terminal duration is this positive finite log ratio.
const aa=G.sub(o,lambda),Q0=G.div(G.sub(lambda,h),aa),hold=G.mul(q(-4),G.log(h));
const Qsteep=G.mul(exp(neg(G.mul(aa,q(1,2)))),G.add(Q0,integral(s=>G.mul(exp(G.mul(aa,G.sub(s,Sint(s)))),G.sub(G.add(lambda,G.mul(aa,G.step(s))),h)),z,o,'independent_I2_Qsteep')));
const Qhold=G.add(Qsteep,G.mul(G.sub(o,h),hold));
const Qb=G.mul(exp(neg(G.mul(G.sub(o,h),q(1,2)))),G.add(Qhold,integral(s=>G.mul(exp(G.mul(G.sub(o,h),Sint(s))),G.sub(o,h),G.sub(o,G.step(s))),z,o,'independent_I2_Qflatten')));
const Qp=integral(s=>G.div(G.mul(exp(G.mul(G.sub(o,h),s)),rho,G.step(G.div(G.sub(s,o),q(2)),1)),G.mul(q(2),G.sub(o,rho))),o,q(3),'independent_I2_Qterminal');
same(G.outer.roots.Qb,Qb);same(G.outer.roots.Qp,Qp);
const wait=G.div(G.log(G.div(Qb,Qp)),G.sub(o,h));same(G.outer.roots.terminalWait,wait);
// Endpoint amplitudes contain no angular bump coefficient or pulse amplitude.
const st=G.outer.stages,ids=['initial','axialDecay','entry','reservedPower','pulse','interpolation','angular','steepen','steepPower','flatten','wait','terminal'];assert.deepEqual(st.map(s=>s.id),ids);
const durations=[o,T,o,G.mul(q(60),B),G.div(q(13),lambda),G.parameter('Tf'),G.mul(q(30),B),o,hold,o,wait,q(3)];
// Retain the original unevaluated sigma(Tf/Tf) endpoint in the literal
// comparison. Its value one is an analytic flat-step identity, not an AST
// simplification performed by the original producer.
const interpolationEndpoint=G.step(G.div(durations[5],G.parameter('Tf')));
const deltas=[q(-1,5),G.mul(q(-1,2),T),G.sub(q(-1,2),G.mul(lambda,q(1,2))),G.mul(alpha,durations[3]),G.mul(alpha,durations[4]),
 G.sub(G.mul(alpha,durations[5]),G.mul(G.log(q(2)),interpolationEndpoint)),G.mul(alpha,durations[6]),G.sub(alpha,G.mul(G.sub(o,lambda),q(1,2))),
 G.mul(q(-3,2),hold),G.add(q(-3,2),G.mul(G.sub(o,h),q(1,2))),G.mul(neg(A),wait)];
let yy=z,logAmp=z;for(let i=0;i<12;i++){same(st[i].start,yy);same(st[i].logAStart,logAmp);same(st[i].length,durations[i]);if(i<11){yy=G.add(yy,durations[i]);logAmp=G.add(logAmp,deltas[i]);same(st[i].end,yy);same(st[i].logAEnd,logAmp);}}
const Xt=G.mul(XR,exp(st[11].start)),Et=G.mul(P,exp(st[11].logAStart)),XK=G.mul(Xt,exp(q(1,5))),eK=G.mul(Et,exp(neg(G.mul(A,q(1,5)))));
same(heat.Xtail,Xt);same(heat.Etail,Et);same(heat.XK,XK);same(heat.eK,eK);
for(const[a,b,name]of[[heat.Xtail,Xt,'Xtail'],[heat.Etail,Et,'Etail'],[heat.XK,XK,'XK'],[heat.eK,eK,'eK']]){aliases.set(a,name);aliases.set(b,name);}
const improper=(fn,lower=z,prefix='independent_I2_improper')=>{const t=G.fresh(prefix),om=G.sub(o,t),s=G.add(lower,G.div(t,om));return G.integral(G.mul(fn(s),G.pow(om,-2)),t,z,o);};
const weight=u=>exp(G.add(neg(u),G.mul(h,G.log(u)))),gamma=improper(weight);same(heat.gamma,gamma);aliases.set(heat.gamma,'Gamma');aliases.set(gamma,'Gamma');
const loss=Z=>G.div(improper(u=>G.mul(weight(u),G.sub(o,exp(neg(G.mul(h,G.log(G.add(o,G.mul(Z,u))))))))),gamma);
const atHeat=s=>{const xx=G.mul(heat.Xtail,exp(s)),fo=G.sub(o,G.mul(rho,G.sub(o,G.step(G.div(G.sub(s,o),q(2))))));
 const ec=G.mul(heat.Etail,exp(neg(G.mul(A,s))),G.div(fo,G.sub(o,rho))),Z=G.div(G.mul(q(2),G.sub(o,G.pow(eta,2))),xx),cut=G.step(G.div(G.sub(s,q(1,5)),q(3,10))),L=G.mul(cut,loss(Z));return{xx,ec,L,energy:G.sub(G.pow(G.sub(o,L),2),o)};};
const DI=neg(improper(s=>{const v=atHeat(s);return G.mul(G.sqrt(q(2)),v.xx,G.sqrt(v.xx),v.ec,v.L);},q(1,5))),
 DS=neg(improper(s=>{const v=atHeat(s);return G.mul(q(1,2),v.xx,G.pow(v.ec,2),v.energy);},q(1,5))),
 DCp=improper(s=>{const v=atHeat(s);return G.mul(q(1,2),G.pow(v.ec,2),v.energy);},q(1,5));
same(heat.heatI,DI);same(heat.heatS,DS);same(heat.heatCp,DCp);
const X0=G.parameter('X0I2'),K=G.mul(P,G.inv(G.add(o,G.pow(eta,2))),exp(G.add(G.mul(q(-1,2),T),q(-7,10),G.mul(q(-1,2),lambda),neg(G.mul(G.add(q(1,2),lambda),G.sub(G.mul(q(60),B),q(20)))))));
assert.equal(heat.X0,X0);same(heat.K,K);
const norms=[G.mul(X0,G.sqrt(X0),heat.K),G.mul(X0,G.pow(heat.K,2)),G.pow(heat.K,2)];
assert.deepEqual(heat.norm,norms);assert.deepEqual(q2.rhs,[heat.heatI,heat.heatS,heat.heatCp].map((d,j)=>neg(G.div(d,G.mul(lambda,norms[j])))));
assert.notEqual(q2.rhs[0],neg(G.div(heat.heatI,norms[0])));
assert.deepEqual(q2.linear,q1.linear.slice(2).map(r=>r.slice(2)));assert.deepEqual(q2.quadraticDiagonal,q1.quadraticDiagonal.slice(2).map(r=>r.slice(2)));
const det=G.determinant(q2.linear),inverse=q2.linear.map((_,i)=>q2.linear.map((__,j)=>G.div(G.mul(q((i+j)%2?-1:1),G.determinant(q2.linear.filter((_,r)=>r!==j).map(row=>row.filter((_,c)=>c!==i)))),det)));
assert.deepEqual(q2.preconditioner,inverse);assert.deepEqual(G.nodes[q2.rootRadius],{op:'rational',args:['1','1000000']});
let badGamma=false;try{same(heat.gamma,G.mul(q(2),gamma));}catch{badGamma=true;}assert(badGamma);
assert.deepEqual(before,await readFile(resolve(root,path)));
assert.deepEqual(bootstrapBefore,await readFile(resolve(root,bootstrapPath)));
const result={schema:'MathScope.N6.ActualI2TrueHeatDebtSourceBinding/1',sourcePath:path,sourceSHA256:createHash('sha256').update(before).digest('hex'),sourceBytesUnchanged:true,
 originalBootstrap:{path:bootstrapPath,sha256:createHash('sha256').update(bootstrapBefore).digest('hex'),terms:0,bits:128,heatIterations:0},
 sourceNodeCount,registryCompared:true,fixedDefinitionCompared:true,diagnosticOverlap,sourceHeaderSHA256:compact.sourceHeaderSHA256,
 actualQuadraticDefinition:q2,actualI1QuadraticDefinition:q1,actualTailStages:st,
 actualCompletedLeadingRoots:{E:heat.finalE,F:heat.finalF,U:p.finalU,M:p.finalM,V:p.finalV,v:p.finalv,Xb:heat.Xb,Xv:p.constants.Xv},
 actualRoots:{eta,h,lambda,Xtail:heat.Xtail,Etail:heat.Etail,XK:heat.XK,eK:heat.eK,gamma:heat.gamma,heatLoss:heat.heatLoss,heatI:heat.heatI,heatS:heat.heatS,heatCp:heat.heatCp,X0,K:heat.K,normalizations:heat.norm},
 checks:{literalQbQpAndTerminalWait:true,literalAllEndpointStageLengthsAndLogAmplitudes:true,literalEtaIndependentTailGeometry:true,
 actualFullImproperGammaAndThreeHeatDebts:true,actualPhysicalZArgumentAndCutoff:true,actualNormalizedRhsWithLambda:true,
 exactSameContinuousEOperatorAsI1:true,actualExactAdjugateInverse:true,literalActualI2K:true,literalActualFinalLeadingFAndU:true},
 strictNegativeControls:{changedActualGammaRejected:badGamma,omittedActualLambdaNormalizationRejected:true},physicalEtaDomain:'[-1,1], Z=2*(1-eta^2)/X>=0',
 noNegativeZOrEtaExtensionClaimed:true,proof:'ACTUAL_I2_TRUE_HEAT_DEBT_CONTRACTION_KO.md',newOriginalGuardsDischarged:0,newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({schema:result.schema,sourceNodeCount,actualFullHeatDebtsBound:true,newDischarged:0})+'\n');
