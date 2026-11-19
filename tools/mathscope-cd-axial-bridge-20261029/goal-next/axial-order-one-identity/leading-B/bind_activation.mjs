/** Exact actual B.26 common-inner branch binding; no leading value sampling. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const [runtime,axisProof,output]=process.argv.slice(2);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const nav=path.join(runtime,'mathscope-m2/navier');
const pins={
 'actual-continuation-exact-stress.mjs':'22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2',
 'actual-continuation-exact-pregluing.mjs':'7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3',
 'actual-global-pressure-kernels.mjs':'43896a8d8a3156fbe6736092263f5cb95372bcd8742292af5e40322563c02c42',
 'actual-global-primitive-kernels.mjs':'efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59',
 'actual-continuation-exact-identities.mjs':'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712',
 'source-profile-data.mjs':'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
};
for(const [name,pin]of Object.entries(pins))if(sha(fs.readFileSync(path.join(nav,name)))!==pin)throw Error('pin '+name);
const axisRaw=fs.readFileSync(axisProof);
if(sha(axisRaw)!=='1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920')throw Error('actual analytic axis proof pin');
const {prepareActualOrderOneStressProgram}=await import(pathToFileURL(path.join(nav,'actual-continuation-exact-stress.mjs')));
const {reduceExpressionOnDeclaredBranches}=await import(pathToFileURL(path.join(nav,'actual-global-pressure-kernels.mjs')));
const {explicitPrimitiveBodyIdentity}=await import(pathToFileURL(path.join(nav,'actual-global-primitive-kernels.mjs')));
const {sourceGraphRationalIdentity}=await import(pathToFileURL(path.join(nav,'actual-continuation-exact-identities.mjs')));
const p=prepareActualOrderOneStressProgram({terms:0,bits:128,heatIterations:0}),G=p.G,pre=p.pre;
const prefix=sha(JSON.stringify(G.nodes.slice(0,117100)));
if(prefix!=='d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116')throw Error('historical prefix');
const q=(n,d=1)=>G.q(n,d),controls=pre.program.controls,y=controls.coordinate;
const Xa=G.parameter('Xa'),t1=G.parameter('t1'),Lambda=G.parameter('Lambda'),cx=G.mul(Xa,G.exp(y)),Y=G.mul(q(4),G.exp(y));
const params=G.source.parametersExactExpressions;
const exact=(key,value)=>{if(JSON.stringify(params[key])!==JSON.stringify(value))throw Error('unchanged source parameter '+key);};
exact('Xa',{quotient:[{integer:4},{ref:'Lambda'}]});
exact('Lambda',{power:[{ref:'Q'},64]});
exact('t1',{power:[{ref:'CSelected'},-120]});
exact('kappa0',{ref:'t1'});
exact('rho',{quotient:[{power:[{ref:'sigmaStar'},2]},{integer:65536}]});
exact('CSelected',{exp:{ref:'logCSelected'}});
const stepValues=new Map([[controls.blend,G.zero]]),betaSteps=[];
function scan(i){const n=G.nodes[i];if(n.op==='source_step_derivative'){betaSteps.push(i);return;}
 if(['add','multiply','inverse'].includes(n.op))n.args.forEach(scan);}
scan(controls.beta);if(betaSteps.length!==1)throw Error('literal beta step');
stepValues.set(betaSteps[0],G.zero);
const select=info=>info.left===pre.roots.Xstart&&info.right===pre.roots.Xend?3:null;
const reducedShear=reduceExpressionOnDeclaredBranches(G,controls.a,{coordinate:y,selectPiecewise:select,stepValues});
const reducedU=reduceExpressionOnDeclaredBranches(G,controls.UlogDerivative,{coordinate:y,selectPiecewise:select,stepValues});
const originalY=G.mul(Lambda,cx);
const naturalF=pre.functions.naturalF(originalY),naturalU=pre.functions.naturalU(originalY),moments=pre.functions.coreMoments(originalY);
const naturalSource=pre.functions.sourceFromState(cx,naturalF,naturalU,moments);
const expectedShear=G.mul(controls.kappa,naturalSource.p1);
const expectedU=G.mul(q(-1,2),controls.kappa,cx,naturalSource.ns);
const checkShear=explicitPrimitiveBodyIdentity(G,reducedShear.value,expectedShear,{maxVisits:600000});
const checkU=explicitPrimitiveBodyIdentity(G,reducedU.value,expectedU,{maxVisits:600000});
if(!checkShear.pass||!checkU.pass){console.log(JSON.stringify({checkShear,checkU,shearTrace:reducedShear.trace,UTrace:reducedU.trace}));throw Error('actual reference-to-natural source body');}
const kapWithT1=G.substitute(controls.kappa,G.parameter('kappa0'),t1);
const expectedKap=G.sub(G.one,G.mul(G.sub(G.one,t1),G.step(G.div(y,t1))));
const checkKap=sourceGraphRationalIdentity(G,G.sub(kapWithT1,expectedKap),{atomicNodes:[G.step(G.div(y,t1))]});
if(!checkKap.pass)throw Error('actual kappa');
const X=p.constants.X,eta=p.constants.eta,{D,d,L,Ustar,g}=G.core;
const radial=(U,avg)=>G.div(G.sub(G.sub(G.mul(q(2),eta,U),G.mul(q(2),D,eta,avg)),G.mul(d,G.derivative(avg,eta))),L);
const coreAverage=G.add(Ustar,G.div(G.natural('average',G.mul(Lambda,X)),Lambda));
const expectedCoreV=radial(pre.functions.naturalU(G.mul(Lambda,X)),coreAverage);
const bv=G.nodes[p.inner.v0];
if(bv.op!=='smooth_piecewise'||bv.args[0]!==X||bv.args[1]!==Xa||bv.args[2]!==p.inner.aSquared||bv.args[4]!==bv.args[5])throw Error('actual v0 core/collar branch');
const checkCoreV=explicitPrimitiveBodyIdentity(G,bv.args[3],expectedCoreV,{maxVisits:600000});
const bound=G.fresh('audited_actual_B26_mass'),ma=pre.functions.coreMoments(q(4))[0];
const collarMass=G.add(ma,G.integral(pre.functions.B26UAt(bound),bound,Xa,X));
const expectedCollarV=radial(pre.functions.B26UAt(X),G.div(collarMass,X));
const checkCollarV=explicitPrimitiveBodyIdentity(G,bv.args[4],expectedCollarV,{maxVisits:600000});
if(!checkCoreV.pass||!checkCollarV.pass)throw Error('actual same-source radial average');
const logX=G.log(G.div(X,Xa));
const expectedF=G.mul(g,G.natural('Phi',q(4)),G.exp(G.mul(q(-1,2),G.integral(controls.a,y,G.zero,logX))));
const fbranch=G.nodes[p.inner.F0],ubranch=G.nodes[p.inner.U0];
if(fbranch.op!=='smooth_piecewise'||ubranch.op!=='smooth_piecewise')throw Error('actual inner fields');
const checkActualF=sourceGraphRationalIdentity(G,G.sub(fbranch.args[4],expectedF),{atomicNodes:[expectedF,G.sqrt(G.mul(q(2),X))]});
const checkActualU=explicitPrimitiveBodyIdentity(G,ubranch.args[4],pre.functions.B26UAt(X),{maxVisits:600000});
if(!checkActualF.pass||!checkActualU.pass)throw Error('actual B26 field integrals');
const sourceIntegralRows=[];
// Both original actual B.26 controls occur in fixed-lower-bound integrals
// before any leading moment repair. Keep original bodies and upper endpoint.
for(let i=0;i<117100;i++){
 const n=G.nodes[i];if(n.op==='definite_integral'&&n.args[1]===y&&n.args[2]===G.zero&&
    (n.args[0]===controls.a||n.args[0]===controls.UlogDerivative))sourceIntegralRows.push({node:i,body:n.args[0],binder:y,left:0,right:n.args[3]});
}
if(!sourceIntegralRows.length)throw Error('actual B26 original integral bodies');
const out={schema:'MathScope.N1ActualB26NaturalActivationBinding/1',status:'PASS_ACTUAL_B26_COMMON_INNER_SOURCE_BRANCH',
 sourcePins:pins,axisProofSHA256:sha(axisRaw),originalPrefix:{count:117100,sha256:prefix},
 coordinates:{y,cx,originalY,Y,eta:p.constants.eta},sourceControls:controls,
 sourceEndpointRoots:{Xa,Xstart:pre.roots.Xstart,Xend:pre.roots.Xend,commonASquared:p.inner.aSquared},
 branchPremises:'0<=y<=t1/16<t1, cx=Xa exp(y)<Xstart; local B26 yB=log(100/Xa)>1>t1, so beta=1,blend=0. eta-independent real radial branches, also at their integration binders.',
 reducedShear,reducedU,naturalSource,checkShear,checkU,checkKap,sourceIntegralRows,
 actualAverageBinding:{v0:p.inner.v0,coreAverage,collarMass,ma,checkCoreV,checkCollarV,
  primitive:'core M=X*(Ustar+naturalAverage/Lambda); collar M=coreM(4)+integral_Xa^X actualB26U; these are the same ordinary mass primitive when the actual natural-average theorem holds.'},
 actualFieldBinding:{F0:p.inner.F0,U0:p.inner.U0,expectedF,checkActualF,checkActualU},
 originalScaling:{B:p.inner.B,delta:p.inner.delta,C1:p.inner.C1,formula:'B=4096*Lambda^2*Q^3/t1; delta=rho/(1024Q)'},
 actualModeIdentityNeeded:'The actual analytic natural source ODE and its regular zero-axis integrating factors imply p1=-2Y Phi_Y/Phi and ns=-2u_Y. The independent first-integral calculation proves this correspondence, not a syntactic substitution of the B22 field for actual B26.',
 parameterExpressions:Object.fromEntries(['Q','Lambda','rho','sigmaStar','logCaxis','logCSelected','CSelected','t1','Xa','kappa0','j0','h'].map(key=>[key,params[key]])),
 nativeNaturalSemantics:'Uses the pinned actual infinite analytic-axis construction, not finite radial truncation values.',
 release:'HOLD'};
fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({status:out.status,shearBranchChanges:reducedShear.trace.length,UBranchChanges:reducedU.trace.length,literalB26Integrals:sourceIntegralRows.length,allExactBodyChecks:true}));
