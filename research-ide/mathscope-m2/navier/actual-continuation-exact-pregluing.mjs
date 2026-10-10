/** Exact actual B.22 -> B.26 -> B.34 -> axial-restoration functions.
 * Every incoming B.8 debt below contains the actual infinite natural core,
 * not an interval midpoint, Bessel comparator, or supplied discrepancy.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {SOURCE_PROFILE_ID} from './source-profile.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function prepareActualPregluingProgram(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','etaDerivativeOrder'].includes(key))fail('INVALID_INPUT','Unknown actual pregluing input '+key);
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID,order=input.etaDerivativeOrder??0;
  if(!Number.isSafeInteger(order)||order<0||order>2)fail('RESOURCE_LIMIT','Pregluing outputs currently materialize eta derivatives through order two.');
  const G=new ActualConvergentExpressions(sourceProfile),q=(a,b=1)=>G.q(a,b),z=G.zero,o=G.one,eta=G.core.eta;
  const {g,P0,L,A,D,d,Ustar}=G.core,Lambda=G.parameter('Lambda'),C=G.parameter('CSelected'),XR=G.parameter('XR'),Pstar=G.parameter('Pstar'),t1=G.parameter('t1'),kappa0=G.parameter('kappa0'),w1=G.parameter('omega1'),w2=G.parameter('omega2'),Tsh=G.parameter('Tsh'),Xa=G.parameter('Xa'),Xi=q(110),Xb=q(100),Xsep=G.parameter('Xsep');
  const f=G.inv(G.add(o,G.pow(eta,2))),Keta=G.mul(Pstar,f),c=G.mul(q(4),eta),root2=G.sqrt(q(2));
  const power=(x,a,b=1)=>G.exp(G.mul(q(a,b),G.log(x)));
  const integral=(body,left,right,prefix)=>{const v=G.fresh(prefix);return G.integral(body(v),v,left,right);};
  const naturalPhi=Y=>G.natural('Phi',Y),naturalU=Y=>G.add(Ustar,G.div(G.natural('u',Y),Lambda));
  const naturalF=Y=>G.mul(g,naturalPhi(Y));
  function coreMoments(Y){
    const invL=G.inv(Lambda),invL2=G.pow(invL,2),X=G.mul(Y,invL);
    return [G.mul(X,G.add(Ustar,G.mul(invL,G.natural('average',Y)))),
      G.mul(q(2),g,invL2,integral(y=>G.mul(y,naturalPhi(y)),z,Y,'actual_core_I')),
      G.mul(q(2),g,invL2,integral(y=>G.mul(y,naturalPhi(y),naturalU(y)),z,Y,'actual_core_J')),
      G.sub(G.mul(invL,integral(y=>G.pow(naturalU(y),2),z,Y,'actual_core_U2')),G.mul(G.pow(g,2),invL2,integral(y=>G.mul(y,G.pow(naturalPhi(y),2)),z,Y,'actual_core_E2'))),
      G.mul(G.pow(g,2),invL,integral(y=>G.pow(naturalPhi(y),2),z,Y,'actual_core_Cp'))];
  }
  const names=['M','I','J','S','Cp'],addRows=(a,b)=>a.map((v,i)=>G.add(v,b[i]));
  function increment(E,U,left,right,prefix){
    // Integration in log radius keeps every physical measure factor explicit.
    const a=G.log(left),b=G.log(right),v=G.fresh(prefix+'_logX'),X=G.exp(v),ev=E(X),uv=U(X),e2=G.pow(ev,2);
    const bodies=[G.mul(X,uv),G.mul(root2,power(X,3,2),ev),G.mul(root2,power(X,3,2),uv,ev),G.mul(X,G.sub(G.pow(uv,2),G.mul(q(1,2),e2))),G.mul(q(1,2),e2)];
    return bodies.map(body=>G.integral(body,v,a,b));
  }
  function constantFIncrement(F,U,left,right){
    const dx=G.sub(right,left),dx2=G.sub(G.pow(right,2),G.pow(left,2)),f2=G.pow(F,2);
    return [G.mul(U,dx),G.mul(F,dx2),G.mul(U,F,dx2),G.sub(G.mul(G.pow(U,2),dx),G.mul(q(1,2),f2,dx2)),G.mul(f2,dx)];
  }

  // B.22 reference: integrate the literal natural logarithmic slopes only
  // inside the positive-width collar, and retain its complete moment history.
  const Xstart=G.mul(Xa,G.exp(t1)),Xend=G.mul(Xa,G.exp(G.mul(q(2),t1))),Ystart=G.mul(Lambda,Xstart),endY=G.mul(q(2),t1);
  const Fstart=naturalF(Ystart),Ustart=naturalU(Ystart),Mstart=coreMoments(Ystart),rx=G.fresh('reference_X'),ry=G.log(G.div(rx,Xa));
  const cutoff=s=>G.sub(o,G.step(G.div(G.sub(s,t1),t1)));
  const FcollarAt=y=>G.mul(Fstart,G.exp(integral(s=>{const Y=G.mul(q(4),G.exp(s));return G.mul(cutoff(s),Y,G.div(G.natural('Phi',Y,eta,1,0),naturalPhi(Y)));},t1,y,'B22_logF')));
  const UcollarAt=y=>G.add(Ustart,integral(s=>{const Y=G.mul(q(4),G.exp(s));return G.mul(cutoff(s),G.div(Y,Lambda),G.natural('u',Y,eta,1,0));},t1,y,'B22_U'));
  const Fend=FcollarAt(endY),Uend=UcollarAt(endY),Fcollar=FcollarAt(ry),Ucollar=UcollarAt(ry);
  const EcollarAt=X=>G.mul(G.sqrt(G.mul(q(2),X)),FcollarAt(G.log(G.div(X,Xa))));
  const UcollarX=X=>UcollarAt(G.log(G.div(X,Xa)));
  const Mend=addRows(Mstart,increment(EcollarAt,UcollarX,Xstart,Xend,'B22_moments'));
  const referenceF=G.choose(rx,Xstart,Xend,naturalF(G.mul(Lambda,rx)),Fcollar,Fend),referenceU=G.choose(rx,Xstart,Xend,naturalU(G.mul(Lambda,rx)),Ucollar,Uend);
  const partialM=addRows(Mstart,increment(EcollarAt,UcollarX,Xstart,rx,'B22_partial_moments')),afterM=addRows(Mend,constantFIncrement(Fend,Uend,Xend,rx)),beforeM=coreMoments(G.mul(Lambda,rx));
  const referenceMoments=names.map((_,i)=>G.choose(rx,Xstart,Xend,beforeM[i],partialM[i],afterM[i]));
  function sourceFromState(X,F,U,ms){
    const [M,I,J,S,Cp]=ms,Me=G.derivative(M,eta),Ie=G.derivative(I,eta),Je=G.derivative(J,eta),Se=G.derivative(S,eta),Pi=G.add(P0,Cp),Pie=G.derivative(Pi,eta);
    const W=G.sub(G.sub(o,G.div(G.mul(q(2),D,eta,M),X)),G.div(G.mul(d,Me),X));
    const angular=G.add(G.mul(G.sub(o,G.parameter('h')),I),G.neg(G.mul(D,eta,Ie)),G.neg(G.mul(d,Je)),G.mul(q(2),G.sub(G.parameter('h'),D),eta,J));
    const Qs=G.add(G.neg(W),G.div(angular,G.mul(q(2),G.pow(X,2),F)));
    const Ns=G.add(G.neg(G.mul(W,U)),G.div(G.add(G.mul(D,G.sub(M,G.mul(eta,Me))),G.mul(q(4),G.parameter('h'),eta,S),G.neg(G.mul(d,Se))),X),G.mul(q(4),A,eta,Pi),G.neg(G.mul(d,Pie)));
    return {W,Qs,Ns,p1:G.div(G.mul(X,Qs),L),ns:G.div(Ns,L),Pi};
  }
  const referenceSource=sourceFromState(rx,referenceF,referenceU,referenceMoments),atReference=(id,X)=>G.substitute(id,rx,X);

  // B.26 and both terminal controls. The reference is used only as the
  // prescribed source in these actual integrals, never relabeled as actual U.
  const cy=G.fresh('actual_B26_y'),cx=G.mul(Xa,G.exp(cy)),yB=G.log(G.div(Xb,Xa)),yI=G.log(G.div(Xi,Xa));
  const kap=G.add(kappa0,G.mul(G.sub(o,kappa0),G.sub(o,G.step(G.div(cy,t1)))));
  const beta=G.sub(o,G.step(G.div(G.sub(cy,yB),w1))),blend=G.step(G.div(G.sub(cy,G.add(yB,w1)),w2));
  const actualShear=G.add(G.mul(G.sub(o,blend),kap,atReference(referenceSource.p1,cx)),G.mul(q(4,5),blend));
  const actualUControl=G.mul(q(-1,2),kap,beta,cx,atReference(referenceSource.ns,cx));
  const phi4=naturalPhi(q(4)),u4=naturalU(q(4));
  const B26FAt=X=>G.mul(g,phi4,G.exp(G.mul(q(-1,2),G.integral(actualShear,cy,z,G.log(G.div(X,Xa))))));
  const B26UAt=X=>G.add(u4,G.integral(actualUControl,cy,z,G.log(G.div(X,Xa))));
  const B26EAt=X=>G.mul(G.sqrt(G.mul(q(2),X)),B26FAt(X));
  const Ei=B26EAt(Xi),Gi=B26UAt(Xi),Mi=addRows(coreMoments(q(4)),increment(B26EAt,B26UAt,Xa,Xi,'B26_full_moments'));

  // B.34 retains the actual endpoint ell_i and G_i.
  const ellI=G.log(G.mul(C,Ei));
  const shiftEAt=X=>{const y=G.log(G.div(X,Xi)),s=G.step(G.div(y,Tsh));return G.exp(G.add(G.neg(G.log(C)),G.mul(q(1,10),y),G.mul(G.sub(o,s),ellI),G.mul(s,G.log(f))));};
  const idealEAt=X=>G.mul(Keta,power(G.div(X,XR),1,10));
  const restLeft=G.mul(XR,G.exp(q(-8))),restRight=G.mul(XR,G.exp(q(-7)));
  const restoredUAt=X=>G.add(Gi,G.mul(G.sub(c,Gi),G.step(G.add(G.log(G.div(X,XR)),q(8)))));
  const Msep=addRows(Mi,increment(shiftEAt,()=>Gi,Xi,Xsep,'B34_full_moments'));
  const MrestLeft=addRows(Msep,increment(idealEAt,()=>Gi,Xsep,restLeft,'ideal_gap_moments'));
  const incomingActual=addRows(MrestLeft,increment(idealEAt,restoredUAt,restLeft,restRight,'restoration_full_moments'));
  const x=G.div(restRight,XR),XR32=power(XR,3,2),K2=G.pow(Keta,2);
  const idealM=G.mul(c,restRight),idealI=G.mul(q(5,8),root2,XR32,Keta,power(x,8,5)),idealJ=G.mul(c,idealI),idealS=G.sub(G.mul(G.pow(c,2),restRight),G.mul(q(5,12),XR,K2,power(x,6,5))),idealCp=G.mul(q(5,2),K2,power(x,1,5));
  const incomingIdeal=[idealM,idealI,idealJ,idealS,idealCp],discrepancy=incomingActual.map((v,i)=>G.sub(v,incomingIdeal[i])),[dm,di,dj,ds,dp]=discrepancy,mu=G.parameter('muMoment');
  const scaledDebt=[G.div(dm,G.mul(XR,Keta)),G.div(G.sub(dj,G.mul(c,di)),G.mul(XR32,K2)),G.div(di,G.mul(XR32,Keta)),G.div(G.sub(ds,G.mul(q(2),c,dm)),G.mul(XR,K2)),G.div(dp,K2)].map(v=>G.neg(G.div(v,mu)));
  const X=G.var('X'),Y=G.mul(Lambda,X),actualF=G.choose(X,Xa,Xi,naturalF(Y),B26FAt(X),G.div(shiftEAt(X),G.sqrt(G.mul(q(2),X)))),actualU=G.choose(X,Xa,Xi,naturalU(Y),B26UAt(X),Gi);
  const roots={...G.core,Xa,Xb,Xi,Xsep,Xstart,Xend,restLeft,restRight,referenceF,referenceU,referenceP1:referenceSource.p1,referenceNs:referenceSource.ns,referencePi:referenceSource.Pi,B26F:actualF,B26U:actualU,B26Ei:Ei,B26Gi:Gi,ellI,B34E:shiftEAt(X),restorationU:restoredUAt(X),idealE:idealEAt(X)};
  names.forEach((name,i)=>{roots['reference'+name]=referenceMoments[i];roots['incomingActual'+name]=incomingActual[i];roots['incomingIdeal'+name]=incomingIdeal[i];roots['incomingDiscrepancy'+name]=discrepancy[i];roots['B8scaledDebt'+i]=scaledDebt[i];});
  for(let m=1;m<=order;m++)for(const name of ['B26Ei','B26Gi',...names.map(n=>'incomingDiscrepancy'+n),...names.map((_,i)=>'B8scaledDebt'+i)]){
    context.checkCancelled?.();roots[name+'_eta'+m]=G.derivative(m===1?roots[name]:roots[name+'_eta'+(m-1)],eta);
  }
  const program=G.pack(roots,{
    construction:'Actual natural series, literal B.22, actual B.26 controls, B.34 shift, and exact incoming five-moment B.8 operands.',etaDerivativeOrder:order,
    reference:{coordinate:rx,momentRoots:referenceMoments,cutoffPositiveWidthRetained:true,naturalSeriesInputRange:'0<=Y<=4*exp(2*t1)<4.1',naturalExtensionAboveFourIsReferenceInputOnly:true},
    controls:{coordinate:cy,a:actualShear,UlogDerivative:actualUControl,kappa:kap,beta,blend,yB,yI,constantTargetA:'4/5'},
    actualIncomingDebt:{names,endpoint:restRight,actualMoments:incomingActual,idealMoments:incomingIdeal,discrepancy,scaledTarget:scaledDebt,sign:'Root correction target is negative actual-minus-ideal discrepancy.',normalization:['dM/(XR*Keta)','(dJ-4eta*dI)/(XR^(3/2)*Keta^2)','dI/(XR^(3/2)*Keta)','(dS-8eta*dM)/(XR*Keta^2)','dCp/Keta^2'],scaleDivision:'muMoment=h^2>0',everyMomentHistoryIncluded:true,idealAxisSingularIntegrandAvoidedByExactPrimitive:true,callerSuppliedDebt:false,intervalMidpointUsed:false},
    convergence:{naturalSeries:'Actual coefficient generator and B_rho geometric tail, without a fixed comparison floor.',finiteIntegrals:'All bodies, variables, and finite endpoints are present. Continuous actual field inputs have the pinned C^1000 total-order-four bounds; standard Riemann refinement applies after the displayed log-radius changes of variables.',actualIntegralRefinementNumericallyRun:false,rootCancellationNotYetApplied:true},
    scope:{actualPregluingFunctionDefinitionCompiled:true,actualB8IncomingFiveFunctionalOperandsCompiled:true,actualB8RootsSolved:false,actualIncomingValuesNumericallyEnclosed:false,completeC12ModulationProgram:false,actualFinalOmegaValuesAvailable:false,originalN404Complete:false,newLeanKernelProof:false}
  });
  return {G,program,roots,names,scaledDebt,incomingActual,incomingIdeal,discrepancy,reference:{coordinate:rx,F:referenceF,U:referenceU,moments:referenceMoments,source:referenceSource},functions:{naturalPhi,naturalU,naturalF,coreMoments,B26EAt,B26UAt,shiftEAt,idealEAt,restoredUAt,increment,sourceFromState},prefixMoments:{atXi:Mi,atXsep:Msep,atRestLeft:MrestLeft,atRestRight:incomingActual},constants:{Xa,Xi,Xsep,restLeft,restRight,XR,Keta,c,Gi,mu,eta}};
}

export function compileActualPregluingProgram(input={},context={}){return prepareActualPregluingProgram(input,context).program;}
