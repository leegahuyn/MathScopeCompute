/** Actual same-source B.8: continuous matrix, actual incoming debt, and a
 * convergent root with its exact moment-cancellation equation.
 * The roots here repair the leading profile. They are not the N4-04 n=1
 * correction, which also needs the final C.12/I.1 global Omega functionals.
 */
import {prepareActualPregluingProgram} from './actual-continuation-exact-pregluing.mjs';
import {ACTUAL_B8_PRECONDITIONER as PIN} from './actual-continuation-exact-b8-data.mjs';
import {readRational,qadd,qsub,qmul,qdiv,qcompare,rational as qrat,qtext,fail} from './actual-continuation-arithmetic.mjs';

const qn=(G,text)=>{const [a,b='1']=text.split('/');return G.q(a,b);};

export function actualB8ContractionProof(){
  const zU=readRational(PIN.inverseResidualUpper[0]),zE=readRational(PIN.inverseResidualUpper[1]),BU=readRational(PIN.quadraticPreconditionedBounds[0]),BE=readRational(PIN.quadraticPreconditionedBounds[1]),mu=readRational(PIN.muUpper),r=readRational(PIN.rootRadius),beta=readRational(PIN.incomingPreconditionedBound);
  const z=qcompare(zU,zE)>0?zU:zE,B=qadd(BU,BE),lip=qadd(z,qmul(qrat(2),qmul(mu,qmul(B,r)))),image=qadd(beta,qadd(qmul(z,r),qmul(mu,qmul(B,qmul(r,r)))));
  const checks={actualCertificatePassed:PIN.allOriginalChecksPassed,inverseResidualStrict:qcompare(z,qrat(1,4))<0,rootBoxInvariant:qcompare(image,r)<0,contractionBelowQuarter:qcompare(lip,qrat(1,4))<0,preconditionerIsNotRelabeledAsExactInverse:PIN.isExactInverseOfContinuousMatrix===false};
  if(!Object.values(checks).every(Boolean))fail('INTERNAL_VALIDATION','Actual B.8 contraction arithmetic failed.');
  return {sourcePath:PIN.sourcePath,sourceSHA256:PIN.sourceSHA256,actualIncomingProof:'CONTINUATION_AND_NEW_DEBT.md (17)–(19), REFERENCE_DERIVATIVE_BOUNDS.md section 7, GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md section 4',radius:qtext(r),preconditionedIncomingUpper:qtext(beta),mapImageUpper:qtext(image),lipschitzUpper:qtext(lip),convenientLipschitzUpper:'1/4',checks,iterateStart:'zero vector',tailAfterIterations:'10^-6 * 4^(-iterations)',sameRootForEveryRefinement:true,numericalRootValuesComputed:false};
}

export function prepareActualB8Program(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','etaDerivativeOrder','rootIterations'].includes(key))fail('INVALID_INPUT','Unknown actual B.8 input '+key);
  const order=input.etaDerivativeOrder??0,iterations=input.rootIterations??2;
  if(!Number.isSafeInteger(order)||order<0||order>2)fail('RESOURCE_LIMIT','Actual B.8 outputs currently materialize eta derivatives through order two.');
  if(!Number.isSafeInteger(iterations)||iterations<0||iterations>12)fail('RESOURCE_LIMIT','Materialize zero through twelve exact B.8 root iterates. The limit definition is unchanged.');
  const pre=prepareActualPregluingProgram({sourceProfile:input.sourceProfile,etaDerivativeOrder:0},context),G=pre.G,{eta,mu,XR,Keta,c,Xa,Xi,restLeft,restRight,Gi}=pre.constants,q=(a,b=1)=>G.q(a,b),z=G.zero,o=G.one,n=5;
  const power=(x,a,b=1)=>G.exp(G.mul(q(a,b),G.log(x))),sqrt2=G.sqrt(q(2)),supports=Array.from({length:5},(_,j)=>[q(j+6,2048),q(2*(j+6)+1,4096)]),width=q(1,4096);
  const bump=(X,j)=>G.step(G.div(G.sub(X,supports[j][0]),width),1);
  const integrate=(body,j,prefix)=>{const x=G.fresh(prefix);return G.integral(body(x),x,...supports[j]);};
  const linear=Array.from({length:n},()=>Array(n).fill(z)),quadraticDiagonal=Array.from({length:n},()=>Array(n).fill(z));
  for(let j=0;j<n;j++){
    if(j<2){linear[0][j]=width;linear[1][j]=integrate(x=>G.mul(sqrt2,power(x,3,5),bump(x,j)),j,'B8_U_linear');}
    else{linear[2][j]=integrate(x=>G.mul(sqrt2,G.sqrt(x),bump(x,j)),j,'B8_E_I');linear[3][j]=G.neg(integrate(x=>G.mul(power(x,1,10),bump(x,j)),j,'B8_E_S'));linear[4][j]=integrate(x=>G.mul(power(x,-9,10),bump(x,j)),j,'B8_E_Cp');}
    const b2=integrate(x=>G.pow(bump(x,j),2),j,'B8_bump_squared');quadraticDiagonal[3][j]=G.mul(j<2?o:q(-1,2),b2);
    if(j>=2)quadraticDiagonal[4][j]=integrate(x=>G.div(G.pow(bump(x,j),2),G.mul(q(2),x)),j,'B8_bump_squared_Cp');
  }
  const preconditioner=PIN.preconditioner.map(row=>row.map(x=>qn(G,x))),proof=actualB8ContractionProof();
  const system=G.defineQuadraticSystem({name:'ActualSameN3B8',linear,quadraticDiagonal,rhs:pre.scaledDebt,scale:mu,preconditioner,rootRadius:qn(G,proof.radius),lipschitzUpper:q(1,4),actualOperandSource:'Exact actual B22/B26/B34/restoration five moments in this same graph.',proof,valueRefinementImplementation:'actual-continuation-exact-b8.mjs:prepareActualB8Program, rootIterations',implicitDerivativeImplementation:'actual-continuation-exact-functions.mjs:quadraticRootEtaDerivative',implicitDerivativeRule:'(A+2mu Qdiag diag(z)) z_eta = actual_rhs_eta; higher derivatives use ordinary product/inverse rules.',continuousMatrixReplacedByPreconditioner:false});
  const values=Array.from({length:n},(_,j)=>G.quadraticRoot(system,j,eta));
  const polynomial=xs=>linear.map((row,i)=>G.add(...row.map((a,j)=>G.mul(a,xs[j])),G.mul(mu,G.add(...quadraticDiagonal[i].map((a,j)=>G.mul(a,G.pow(xs[j],2)))))));
  const step=xs=>{const residual=polynomial(xs).map((v,i)=>G.sub(v,pre.scaledDebt[i]));return xs.map((v,i)=>G.sub(v,G.add(...preconditioner[i].map((b,j)=>G.mul(b,residual[j])))));};
  let iterate=Array(n).fill(z);for(let k=0;k<iterations;k++){context.checkCancelled?.();iterate=step(iterate);}
  const rootTail=G.mul(q(1,1000000),q(1,4n**BigInt(iterations)));
  const X=G.var('X'),x=G.div(X,XR),deltaU=G.mul(Keta,mu,G.add(...[0,1].map(j=>G.mul(values[j],bump(x,j))))),deltaE=G.mul(Keta,mu,G.add(...[2,3,4].map(j=>G.mul(values[j],bump(x,j)))));
  const patchRight=G.mul(XR,G.exp(q(-5))),preU0=G.choose(X,Xa,Xi,pre.functions.naturalU(G.mul(G.parameter('Lambda'),X)),pre.functions.B26UAt(X),Gi),preURestore=G.choose(X,restLeft,restRight,preU0,pre.functions.restoredUAt(X),c);
  const eXR=G.mul(XR,G.exp(o)),decayEnd=G.mul(eXR,G.exp(G.parameter('T'))),s=G.log(G.div(X,eXR)),k=at=>G.mul(q(4),G.sub(o,G.step(G.div(G.log(G.add(o,at)),G.parameter('Md')))));
  const t=G.var('t'),tailT=G.log(G.div(X,G.outer.roots.Xp)),tailU=G.substitute(G.outer.roots.U,t,tailT),tailM=G.substitute(G.outer.roots.M,t,tailT),a2U=G.choose(X,eXR,decayEnd,c,G.mul(eta,k(s)),tailU);
  const massS=G.fresh('B8_outer_mass'),decayM=G.mul(eta,eXR,G.add(q(4),G.integral(G.mul(G.exp(massS),k(massS)),massS,z,s))),a2M=G.choose(X,eXR,decayEnd,G.mul(c,X),decayM,tailM);
  const actualPreC12U=G.choose(X,restRight,patchRight,preURestore,G.add(c,deltaU),a2U);
  const coreM=pre.functions.coreMoments(G.mul(G.parameter('Lambda'),X))[0],coreMa=pre.functions.coreMoments(q(4))[0],vB=G.fresh('B8_actual_inner_mass'),insideM=G.add(coreMa,G.integral(pre.functions.B26UAt(vB),vB,Xa,X));
  const afterXiM=G.add(pre.prefixMoments.atXi[0],G.mul(Gi,G.sub(X,Xi))),beforeRestoreM=G.choose(X,Xa,Xi,coreM,insideM,afterXiM);
  const vR=G.fresh('B8_restore_mass'),restoreM=G.add(pre.prefixMoments.atRestLeft[0],G.integral(pre.functions.restoredUAt(vR),vR,restLeft,X)),beforePatchM=G.choose(X,restLeft,restRight,beforeRestoreM,restoreM,pre.incomingActual[0]);
  const correctionMass=G.mul(XR,Keta,mu,G.add(...[0,1].map(j=>{const v=G.fresh('B8_bump_prefix'),part=G.integral(bump(v,j),v,supports[j][0],x);return G.mul(values[j],G.choose(x,...supports[j],z,part,width));})));
  const inPatchM=G.add(pre.incomingActual[0],G.mul(c,G.sub(X,restRight)),correctionMass),actualPreC12M=G.choose(X,restRight,patchRight,beforePatchM,inPatchM,a2M);
  const axisVx=G.div(G.sub(G.mul(q(2),G.core.A,eta,G.core.Ustar),G.mul(q(4),G.core.d)),G.core.L),preM_eta=G.derivative(actualPreC12M,eta),vGeneral=G.div(G.sub(G.sub(G.mul(q(2),eta,actualPreC12U),G.div(G.mul(q(2),G.core.D,eta,actualPreC12M),X)),G.div(G.mul(G.core.d,preM_eta),X)),G.core.L);
  const coreAverage=G.add(G.core.Ustar,G.div(G.natural('average',G.mul(G.parameter('Lambda'),X)),G.parameter('Lambda'))),coreVoverX=G.div(G.sub(G.sub(G.mul(q(2),eta,pre.functions.naturalU(G.mul(G.parameter('Lambda'),X))),G.mul(q(2),G.core.D,eta,coreAverage)),G.mul(G.core.d,G.derivative(coreAverage,eta))),G.core.L);
  const actualPreC12v=G.choose(X,Xa,patchRight,coreVoverX,vGeneral,vGeneral),actualPreC12V=G.mul(X,actualPreC12v);
  const roots={...pre.roots,actualPreC12U,actualPreC12M,actualPreC12V,actualPreC12v,actualAxisVX:axisVx,B8deltaU:deltaU,B8deltaE:deltaE,B8patchRight:patchRight,B8rootTail:rootTail};
  values.forEach((v,j)=>{roots['B8root'+j]=v;roots['B8iterate'+j]=iterate[j];roots['B8equationResidual'+j]=G.sub(polynomial(values)[j],pre.scaledDebt[j]);});
  for(let m=1;m<=order;m++)for(const name of [...values.map((_,j)=>'B8root'+j),'actualPreC12U','actualPreC12M','actualPreC12v']){context.checkCancelled?.();roots[name+'_eta'+m]=G.derivative(m===1?roots[name]:roots[name+'_eta'+(m-1)],eta);}
  const program=G.pack(roots,{construction:'Actual leading-source pregluing and B.8 moment restoration, with the actual root represented by its contractive sequence.',etaDerivativeOrder:order,pregluing:pre.program.actualIncomingDebt,B8:{system,geometry:{supports,width,unitMass:false},linear,quadraticDiagonal,target:pre.scaledDebt,rootValues:values,materializedIterates:iterate,iterations,rootTail,proof,cancellation:{equation:'A*z+mu*Q(z)=the negative actual incoming normalized debt',allFiveMomentsRestoredExactlyInTheLimit:true,finiteIterateDeclaredExactRoot:false,rationalPreconditionerDeclaredExactInverse:false,actualC12MomentsAlreadyRestored:false}},
    globalAxialScope:{UAndMThroughXv:true,fieldsIdenticallyZeroAfterXv:true,M_XEqualsU:true,axisRegularityRetained:true,positiveAxisDatumJ0Retained:true,afterB8EqualityReason:'All five actual moment equations, including M, have zero discrepancy. Compact support of deltaU alone would not imply this.',finalC12Field:false},
    scope:{actualB8FiveFunctionalOperandsCompiled:true,actualB8UniqueRootLimitCompiled:true,actualB8RootFiniteApproximantsGenerated:true,actualB8RootNumericallyEnclosed:false,actualPreC12AxialFunctionDefinitionCompiled:true,fullActualC12ModulationAndI1RepairCompiled:false,actualFinalOmegaMomentsAvailable:false,actualN1MomentRepairComplete:false,originalN404Complete:false,newLeanKernelProof:false}});
  return {G,program,pre,system,values,iterate,step,polynomial,roots,proof,actualPreC12U,actualPreC12M,actualPreC12v,deltaU,deltaE};
}

export function compileActualB8Program(input={},context={}){return prepareActualB8Program(input,context).program;}
