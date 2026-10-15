/** Source binding for the exact conservation/B26-interface theorem. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const options={};for(let i=2;i<process.argv.length;i+=2){assert(process.argv[i].startsWith('--')&&process.argv[i+1]);options[process.argv[i].slice(2)]=process.argv[i+1];}
const root=resolve(options['kernel-root']??process.cwd()),out=resolve(options.out??'work/ACTUAL_NATURAL_B26_BINDING.json');
const path='research-ide/mathscope-m2/navier/actual-continuation-exact-pregluing.mjs',sourcePath=resolve(root,path),before=await readFile(sourcePath);
const {prepareActualPregluingProgram}=await import(pathToFileURL(sourcePath));
const p=prepareActualPregluingProgram({etaDerivativeOrder:0}),G=p.G,sourceNodeCount=G.nodes.length,q=(a,b=1)=>G.q(a,b),o=G.one,z=G.zero;
const {eta,L,A,D,d,g,P0,Ustar,chi,zeta,Hstar}=G.core,Lambda=G.parameter('Lambda'),X=G.var('X'),Y=G.mul(Lambda,X),h=G.parameter('h');
function canonical(id,env=new Map()){
 const {op,args}=G.nodes[id];if(op==='coordinate')return env.has(id)?['bound',env.get(id)]:['coordinate',id];
 if(['rational','source_parameter'].includes(op))return[op,args];
 if(op==='definite_integral'){const next=new Map(env);next.set(args[1],env.size);return[op,canonical(args[0],next),canonical(args[2],env),canonical(args[3],env)];}
 if(['integer_power','source_step_derivative'].includes(op))return[op,canonical(args[0],env),args[1]];
 if(op==='actual_natural_series')return[op,args[0],canonical(args[1],env),canonical(args[2],env),...args.slice(3)];
 assert(!op.startsWith('actual_'),'Unexpected native boundary in natural core moment: '+op);
 const c=args.map(a=>canonical(a,env));if(op==='add'||op==='multiply')c.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));return[op,...c];
}
const same=(a,b)=>assert.deepEqual(canonical(a),canonical(b));
// Literal sourceFromState, including all five true moments and pressure P0.
const rx=p.reference.coordinate,F=p.reference.F,U=p.reference.U,[M,I,J,S,Cp]=p.reference.moments;
const Pi=G.add(P0,Cp),W=G.sub(G.sub(o,G.div(G.mul(q(2),D,eta,M),rx)),G.div(G.mul(d,G.derivative(M,eta)),rx));
const angular=G.add(G.mul(G.sub(o,h),I),G.neg(G.mul(D,eta,G.derivative(I,eta))),G.neg(G.mul(d,G.derivative(J,eta))),G.mul(q(2),G.sub(h,D),eta,J));
const Qs=G.add(G.neg(W),G.div(angular,G.mul(q(2),G.pow(rx,2),F)));
const Ns=G.add(G.neg(G.mul(W,U)),G.div(G.add(G.mul(D,G.sub(M,G.mul(eta,G.derivative(M,eta)))),G.mul(q(4),h,eta,S),G.neg(G.mul(d,G.derivative(S,eta)))),rx),G.mul(q(4),A,eta,Pi),G.neg(G.mul(d,G.derivative(Pi,eta))));
const expected={W,Qs,Ns,p1:G.div(G.mul(rx,Qs),L),ns:G.div(Ns,L),Pi};
for(const[k,v]of Object.entries(expected))assert.equal(p.reference.source[k],v,k);
const integrate=fn=>{const y=G.fresh('independent_core_integral');return G.integral(fn(y),y,z,Y);};
const phi=y=>G.natural('Phi',y),u=y=>G.add(Ustar,G.div(G.natural('u',y),Lambda));
const t=G.inv(Lambda),t2=G.pow(t,2);
const expectedMoments=[G.mul(G.mul(Y,t),G.add(Ustar,G.mul(t,G.natural('average',Y)))),
 G.mul(q(2),g,t2,integrate(y=>G.mul(y,phi(y)))),
 G.mul(q(2),g,t2,integrate(y=>G.mul(y,phi(y),u(y)))),
 G.sub(G.mul(t,integrate(y=>G.pow(u(y),2))),G.mul(G.pow(g,2),t2,integrate(y=>G.mul(y,G.pow(phi(y),2))))),
 G.mul(G.pow(g,2),t,integrate(y=>G.pow(phi(y),2)))];
const actualMoments=p.functions.coreMoments(Y);actualMoments.forEach((a,i)=>same(a,expectedMoments[i]));
// The reference left branches really are these same natural functions/history.
const guardF=G.nodes[p.reference.F],guardU=G.nodes[p.reference.U];
assert.equal(guardF.op,'smooth_piecewise');assert.equal(guardU.op,'smooth_piecewise');
assert.equal(guardF.args[0],rx);assert.equal(guardU.args[0],rx);
assert.equal(guardF.args[3],p.functions.naturalF(G.mul(Lambda,rx)));
assert.equal(guardU.args[3],p.functions.naturalU(G.mul(Lambda,rx)));
const refCore=p.functions.coreMoments(G.mul(Lambda,rx));p.reference.moments.forEach((a,i)=>{assert.equal(G.nodes[a].op,'smooth_piecewise');same(G.nodes[a].args[3],refCore[i]);});
// Sign is bound to the literal source AST, not a prose convention.
const sigma=G.parameter('sigmaStar'),den=G.add(G.pow(Hstar,2),G.pow(sigma,2));
assert.equal(chi,G.div(G.pow(Hstar,2),den));assert.equal(zeta,G.neg(G.div(G.mul(L,Hstar),den)));
assert.notEqual(zeta,G.div(G.mul(L,Hstar),den));
// Literal B26 controls and middle bodies consumed by the coefficient program.
const c=p.program.controls,cy=c.coordinate,Xa=p.constants.Xa,t1=G.parameter('t1'),k0=G.parameter('kappa0'),w1=G.parameter('omega1'),w2=G.parameter('omega2');
const cx=G.mul(Xa,G.exp(cy)),yB=G.log(G.div(q(100),Xa));
const kap=G.add(k0,G.mul(G.sub(o,k0),G.sub(o,G.step(G.div(cy,t1))))),beta=G.sub(o,G.step(G.div(G.sub(cy,yB),w1))),blend=G.step(G.div(G.sub(cy,G.add(yB,w1)),w2));
assert.equal(c.kappa,kap);assert.equal(c.beta,beta);assert.equal(c.blend,blend);
const p1at=G.substitute(expected.p1,rx,cx),nsat=G.substitute(expected.ns,rx,cx);
assert.equal(c.a,G.add(G.mul(G.sub(o,blend),kap,p1at),G.mul(q(4,5),blend)));
assert.equal(c.UlogDerivative,G.mul(q(-1,2),kap,beta,cx,nsat));
const endpoint=G.log(G.div(X,Xa));
const expectedF=G.mul(g,phi(q(4)),G.exp(G.mul(q(-1,2),G.integral(c.a,cy,z,endpoint))));
const expectedU=G.add(u(q(4)),G.integral(c.UlogDerivative,cy,z,endpoint));
assert.equal(G.nodes[p.roots.B26F].args[4],expectedF);assert.equal(G.nodes[p.roots.B26U].args[4],expectedU);
let diagnosticOverlap=0;if(options.diagnostics){const diag=JSON.parse(await readFile(resolve(options.diagnostics),'utf8'));for(const[id,n]of Object.entries(diag.argumentAndContextGraph)){const i=Number(id);if(i<sourceNodeCount){assert.deepEqual(G.nodes[i],n);diagnosticOverlap++;}}assert(diagnosticOverlap>0);}
assert.deepEqual(before,await readFile(sourcePath));
const result={schema:'MathScope.N6.ActualNaturalB26SourceBinding/1',sourcePath:path,sourceSHA256:createHash('sha256').update(before).digest('hex'),sourceBytesUnchanged:true,sourceNodeCount,diagnosticOverlap,
 checks:{literalSourceP1AndNs:true,allFiveLiteralCoreMoments:true,referenceLeftNaturalBodies:true,referenceLeftNaturalMomentHistory:true,literalNegativeZetaSign:true,literalB26ControlsAndMiddleBodies:true},
 sourceRoots:{referenceCoordinate:rx,referenceF:F,referenceU:U,referenceMoments:p.reference.moments,source:expected,coreMoments:actualMoments,B26F:expectedF,B26U:expectedU,controlCoordinate:cy,controls:c},
 negativeControls:{positiveZetaSignRejected:true},independentConservationProof:'ACTUAL_NATURAL_B26_JOIN_KO.md',newOriginalGuardsDischarged:0,newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({schema:result.schema,sourceNodeCount,diagnosticOverlap,checks:result.checks,newDischarged:0})+'\n');
