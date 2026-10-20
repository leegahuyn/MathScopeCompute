/** Bind the original order-one global primitive joins; no producer is edited. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const opt={};for(let i=2;i<process.argv.length;i+=2){assert(process.argv[i].startsWith('--')&&process.argv[i+1]);opt[process.argv[i].slice(2)]=process.argv[i+1];}
for(const k of ['kernel-root','diagnostics','compact','out'])assert(opt[k],`--${k} is required`);
const root=resolve(opt['kernel-root']),out=resolve(opt.out),base='research-ide/mathscope-m2/navier/';
const pins={
 'actual-continuation-exact-order-one.mjs':'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72',
 'actual-leading-stream-primitive.mjs':'4a9a1d28d9ee7cea2d776fe73bdeed3a95dbe62fdb50a51fa536d3ccc55667de',
 'actual-global-primitive-kernels.mjs':'efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59',
 'actual-continuation-exact-support.mjs':'0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
 'actual-leading-omega-prefix-kernel.mjs':'e2e424d147e8a731d75ecc738bf40fc85909edc1db531353999403488ee3e8b8'
};
const sha=x=>createHash('sha256').update(x).digest('hex');
const before={};for(const file of Object.keys(pins)){before[file]=await readFile(resolve(root,base+file));assert.equal(sha(before[file]),pins[file],file);}
const {prepareActualFirstOrderGlobalProgram}=await import(pathToFileURL(resolve(root,base+'actual-continuation-exact-order-one.mjs')));
const {attachActualLeadingStreamPrimitive}=await import(pathToFileURL(resolve(root,base+'actual-leading-stream-primitive.mjs')));
const {explicitPrimitiveBodyIdentity}=await import(pathToFileURL(resolve(root,base+'actual-global-primitive-kernels.mjs')));
const {sourceGraphRationalIdentity}=await import(pathToFileURL(resolve(root,base+'actual-continuation-exact-identities.mjs')));
const {actualSupportOrderProof,checkActualExteriorZeros}=await import(pathToFileURL(resolve(root,base+'actual-continuation-exact-support.mjs')));
const {originalLeadingOmegaPrefixIdentity,originalLeadingMassContinuityDefect}=await import(pathToFileURL(resolve(root,base+'actual-leading-omega-prefix-kernel.mjs')));
const originalOmegaAlgebra=originalLeadingOmegaPrefixIdentity(),originalContinuityAlgebra=originalLeadingMassContinuityDefect();
assert(originalOmegaAlgebra.pass&&originalContinuityAlgebra.pass);
const p=prepareActualFirstOrderGlobalProgram({terms:0,bits:128,etaOrder:0}),G=p.G,r=p.orderOne;
const sourceNodeCount=G.nodes.length,compact=JSON.parse(await readFile(resolve(opt.compact),'utf8'));
assert.deepEqual(G.picardSystems[p.inner.system],compact.definitions['picard:0'].fullDefinition);
assert.deepEqual(G.quadraticSystems[p.system],compact.definitions['quadratic:1'].fullDefinition);
const bodies={F1:r.F1,U1:r.U1,v1:r.v1,M1:r.M1,average:r.M1overX,Pi1:r.Pi1};
for(const[k,i]of Object.entries({F1:5,U1:6,v1:7,M1:8,average:9,Pi1:10}))assert.equal(bodies[k],compact.definitions['expression:'+i].fullDefinition.body,k);
assert.equal(p.finalU,compact.definitions['expression:3'].fullDefinition.body);
const raw=await readFile(resolve(opt.diagnostics));assert.equal(sha(raw),'b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1');
const diag=JSON.parse(raw);assert.deepEqual({source:G.source,core:G.core,pressure:G.pressure,outer:G.outer,naturalKernel:G.naturalKernel},diag.fullNativePayloads.fixed);
let diagnosticOverlap=0;for(const[id,n]of Object.entries(diag.argumentAndContextGraph))if(Number(id)<sourceNodeCount){assert.deepEqual(G.nodes[Number(id)],n);diagnosticOverlap++;}assert(diagnosticOverlap>0);
const q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,{X,eta,Xv}=p.constants,{A,D,d,L}=G.core;
const actualLocalPressureDensity=p.program.momentRepair.localIntegrands[2];
assert(Number.isSafeInteger(actualLocalPressureDensity)&&G.nodes[actualLocalPressureDensity]);
const equal=(a,b,atomicNodes=[])=>{const c=explicitPrimitiveBodyIdentity(G,a,b,{atomicNodes,maxVisits:600000});assert(c.pass,JSON.stringify(c));return{left:a,right:b,pass:true,visited:c.visited};};
const algebra=(body,atomicNodes=[])=>{const c=sourceGraphRationalIdentity(G,body,{atomicNodes,maxTerms:50000});assert(c.pass,JSON.stringify(c));return{body,pass:true};};
const integral=(fn,left,right,name)=>{const t=G.fresh(name);return G.integral(fn(t),t,left,right);};
// The existing original independent audit binds every actual M0 history,
// C12 log-radius Jacobian and B8/I1/outer first root equation. It does not
// infer that a compact integrand has a zero primitive.
const stream=attachActualLeadingStreamPrimitive(p.originalLeading);
assert(stream.scope.actualGlobalLeadingMassPrimitiveIdentity&&stream.scope.actualGlobalLeadingStreamReconstruction&&stream.scope.actualLeadingContinuityIdentity);
assert(stream.checks.every(c=>c.pass));
const U=p.finalU,v=p.finalv,VX0=p.roots.actualGlobalAxisVX;
const vX=G.derivative(v,X),vEta=G.derivative(v,eta),Ueta=G.derivative(U,eta);
const axisSourceBinding=equal(VX0,G.div(G.sub(G.mul(q(2),A,eta,G.core.Ustar),G.mul(q(4),d)),L));
assert.equal(G.derivative(G.core.Ustar,eta),q(4));
const axisNaturalLimit=algebra(G.sub(VX0,G.div(G.sub(G.sub(G.mul(q(2),eta,G.core.Ustar),G.mul(q(2),D,eta,G.core.Ustar)),G.mul(d,G.derivative(G.core.Ustar,eta))),L)),[G.core.Ustar]);
const axisAtEtaZero=algebra(G.sub(G.substitute(VX0,eta,z),q(-4)));
const iv=integral(t=>G.substitute(v,X,t),z,X,'independent_n1_prefix_v');
const iuv=integral(t=>G.substitute(G.mul(U,v),X,t),z,X,'independent_n1_prefix_uv');
const ivv=integral(t=>G.substitute(G.pow(v,2),X,t),z,X,'independent_n1_prefix_vv');
const boundary=G.add(G.div(G.mul(X,v),G.mul(q(2),L)),G.neg(G.div(G.mul(eta,X,U,v),L)),G.mul(q(1,2),X,G.pow(v,2)),G.neg(v),G.neg(G.mul(X,vX)));
const omegaPrefix=G.add(G.div(G.add(G.mul(D,eta,G.derivative(iv,eta)),G.mul(d,G.derivative(iuv,eta)),G.mul(q(-2),A,eta,iuv)),G.mul(q(2),L)),G.mul(q(1,4),ivv),boundary,VX0);
const closedOmega=G.choose(X,r.Xkeep,Xv,omegaPrefix,omegaPrefix,p.pressureOmega);
const prefixBinding=equal(p.roots.actualOrderOneGlobalPressurePrefix,closedOmega,[U,v,vX,vEta,Ueta,VX0,p.pressureOmega]);
// Reconstruct Pi1 with the COMPLETE Omega prefix and every continuous bump.
const power=(x,a)=>G.exp(G.mul(a,G.log(x))),Rp=power(r.Rbase,G.sub(q(-2),G.mul(q(2),p.constants.lambda)));
const width=q(1,2048),bump=(x,j)=>G.div(G.step(G.div(G.sub(x,r.supports[j][0]),width),1),width);
const sourceLambda=G.parameter('lambda'),centers=[q(3,2),q(2),q(5,2),q(3),q(7,2)],half=q(1,4096);
assert.deepEqual(r.supports,centers.map(c=>[G.sub(c,half),G.add(c,half)]));
const actualIposMatrixBindings=[];
for(let j=0;j<5;j++){
 if(j<2){
  const m0=integral(x=>G.mul(x,bump(x,j)),...r.supports[j],'independent_n1_U_matrix0');
  const m1=integral(x=>{const w=G.fresh('independent_n1_U_confluent');return G.mul(x,bump(x,j),G.integral(G.exp(G.mul(q(-2),sourceLambda,w)),w,z,G.log(x)));},...r.supports[j],'independent_n1_U_matrix1');
  actualIposMatrixBindings.push({block:'U',row:0,column:j,...equal(r.Umat[0][j],m0)},{block:'U',row:1,column:j,...equal(r.Umat[1][j],m1)});
 }else{
  const weights=[x=>G.pow(x,2),x=>power(x,G.sub(q(-2),G.mul(q(2),sourceLambda))),x=>power(x,G.mul(q(-2),sourceLambda))];
  for(let k=0;k<3;k++)actualIposMatrixBindings.push({block:'E',row:k,column:j-2,...equal(r.Emat[k][j-2],integral(x=>G.mul(weights[k](x),bump(x,j)),...r.supports[j],'independent_n1_E_matrix'))});
 }
}
assert.equal(actualIposMatrixBindings.length,13);
const actualIposRbase=equal(r.Rbase,G.sqrt(G.mul(q(2),G.parameter('X0Ipos'))));
const Kpos=G.mul(G.parameter('Pstar'),G.inv(G.add(o,G.pow(eta,2))),G.exp(G.add(G.mul(q(-1,2),G.parameter('T')),q(-7,10),G.mul(q(-1,2),sourceLambda),G.neg(G.mul(G.add(q(1,2),sourceLambda),G.sub(G.mul(q(60),G.parameter('BOuter')),q(14)))))));
const actualIposAmplitude=equal(r.ef,G.mul(Kpos,power(r.Rbase,G.add(o,G.mul(q(2),sourceLambda)))));
const local=integral(t=>G.substitute(actualLocalPressureDensity,X,t),z,X,'independent_n1_local_pressure');
const localClosed=G.choose(X,r.Xkeep,r.Xcut,local,local,r.localMoments[2]);
const correction=G.mul(q(2),r.ef,Rp,G.add(...r.beta.map((b,j)=>G.mul(b,G.choose(r.normalizedR,...r.supports[j+2],z,
 integral(t=>G.mul(power(t,G.sub(q(-2),G.mul(q(2),p.constants.lambda))),bump(t,j+2)),r.supports[j+2][0],r.normalizedR,'independent_n1_pressure_bump'),r.Emat[1][j])))));
const expectedPi=G.choose(X,r.Xkeep,r.Xplus,G.picardEven(p.inner.system,3,X,eta),G.sub(G.add(localClosed,correction),p.roots.actualOrderOneGlobalPressurePrefix),z);
const pressureBinding=equal(r.Pi1,expectedPi,[...r.beta,r.ef,r.Rbase,Rp,...r.localMoments,actualLocalPressureDensity,p.roots.actualOrderOneGlobalPressurePrefix]);
const actualMomentChecks=r.momentResiduals.map(body=>algebra(body,r.moments));assert.equal(actualMomentChecks.length,5);
const pressureMoment=algebra(G.add(r.moments[2],G.mul(q(2),r.ef,Rp,G.add(...r.beta.map((b,j)=>G.mul(b,r.Emat[1][j]))))),r.moments);
// Original U/K/pressure rows, with both the radial Jacobian and zero data.
const s=G.picardSystems[p.inner.system],xi=s.xi;
assert.deepEqual(s.diagonal,[0,0,2,0,3,1]);assert(s.zeroAxisDatum.every(x=>x===0));
assert(s.A0[1].every((a,j)=>a===(j===5?o:z)));assert(s.A0[2].every((a,j)=>a===(j===5?q(-1):z)));
assert([...s.A1[1],...s.A1[2],s.forcing[1],s.forcing[2]].every(x=>x===z));
const picardPressureCoefficient=equal(s.A0[3][0],G.mul(q(4),xi,G.substitute(p.inner.F0,X,G.pow(xi,2))));
assert(s.A0[3].slice(1).every(x=>x===z)&&s.A1[3].every(x=>x===z)&&s.diagonal[3]===0);
const innerOmegaAtXi=G.substitute(p.inner.omegaOverX,X,G.pow(xi,2));
const picardPressureForcing=algebra(G.sub(s.forcing[3],G.mul(q(-1),xi,innerOmegaAtXi)),[xi,innerOmegaAtXi]);
const support=actualSupportOrderProof(p),exterior=checkActualExteriorZeros(G,[p.finalU,p.finalv,r.F1,r.U1,r.M1,r.v1],support);
assert(support.pass&&exterior.pass);
// Controls reject actual stored constants/prefixes, not only metadata.
assert.notEqual(p.roots.actualOrderOneGlobalPressurePrefix,G.choose(X,r.Xkeep,Xv,omegaPrefix,omegaPrefix,z));
assert(!explicitPrimitiveBodyIdentity(G,r.Pi1,G.choose(X,r.Xkeep,r.Xplus,G.picardEven(p.inner.system,3,X,eta),G.add(localClosed,correction),z),{atomicNodes:[...r.beta,r.ef,r.Rbase,...r.localMoments,actualLocalPressureDensity,p.roots.actualOrderOneGlobalPressurePrefix]}).pass);
assert(!sourceGraphRationalIdentity(G,G.sub(s.A0[3][0],G.mul(q(2),xi,G.substitute(p.inner.F0,X,G.pow(xi,2))))).pass);
for(const file of Object.keys(pins))assert.deepEqual(before[file],await readFile(resolve(root,base+file)));
const result={schema:'MathScope.N6.ActualOrderOnePrimitiveBinding/1',sourceFiles:Object.entries(before).map(([file,b])=>({path:base+file,sha256:sha(b),bytes:b.length})),
 sourceHeaderSHA256:compact.sourceHeaderSHA256,sourcePaperSHA256:G.source.sourcePaperSHA256,diagnosticsSHA256:sha(raw),sourceNodeCount,diagnosticOverlap,
 exactOriginalBindings:{picard0:true,quadratic1:true,allSixOriginalGlobalBodyIDs:true,fixedDefinition:true},
 bodyRoots:bodies,sourceCoordinates:{X,eta,xi,Xv,Xkeep:r.Xkeep,Xcut:r.Xcut,Xplus:r.Xplus,axisVX:VX0},
 actualLeadingRoots:{U:p.finalU,M:p.finalM,V:p.finalV,v:p.finalv,Xv},
 actualIposSource:{matrixBindings:actualIposMatrixBindings,RbaseBinding:actualIposRbase,amplitudeBinding:actualIposAmplitude,
  supports:r.supports,Umat:r.Umat,Emat:r.Emat,lambda:sourceLambda,Rbase:r.Rbase,ef:r.ef,positiveParameterExpressions:{lambda:G.source.parametersExactExpressions.lambda,X0Ipos:G.source.parametersExactExpressions.X0Ipos,Pstar:G.source.parametersExactExpressions.Pstar}},
 leadingStream:{checks:stream.checks.map(({id,pass})=>({id,pass})),scope:stream.scope,sourceRootBindings:stream.roots},
 originalExactAlgebra:{omega:originalOmegaAlgebra,continuity:originalContinuityAlgebra},
 exactPrimitiveBindings:{prefixBinding,pressureBinding,pressureMoment,picardPressureCoefficient,picardPressureForcing,actualMomentChecks,axisSourceBinding,axisNaturalLimit,axisAtEtaZero},
 support:{pass:support.pass,endpoints:support.endpoints,exterior:{pass:exterior.pass,checks:exterior.checks}},
 strictNegativeControls:{omittedClosedOmegaConstantRejected:true,omittedActualOmegaPrefixRejected:true,missingPicardRadialFactorRejected:true},
 analyticPremises:['Actual leading U0/M0/v0 are C∞ with their original axis limits and true B8/I1/outer roots.','Actual Picard0 normal convergence, parity and the all-order natural/B26 source joins.','Original positive λ,Kpos,Rbase and continuous bump determinants.'],
 actualAllOrderPrimitiveRegularityComposed:false,wholeGOnJProved:false,newDischarged:0};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({schema:result.schema,sourceNodeCount,diagnosticOverlap,streamChecks:stream.checks.length,newDischarged:0}));
