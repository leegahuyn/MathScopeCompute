/** Complete literal A.2 axial reference. The existing actual outer pulse roots are reused unchanged. */
import {compileActualOuterAxialProgram} from './actual-global-source-outer.mjs';
import {ActualSourceExpressions} from './actual-global-source-expressions.mjs';
import {SOURCE_PROFILE_ID} from './source-profile.mjs';

export function compileActualA2AxialProgram({profileId=SOURCE_PROFILE_ID}={}){
  const tail=compileActualOuterAxialProgram({profileId}),G=new ActualSourceExpressions(profileId);
  // Import actual operand nodes, retaining all source integrals/root branches.
  G.nodes=structuredClone(tail.nodes);G.lookup=new Map(G.nodes.map((node,i)=>[JSON.stringify([node.op,node.args]),i]));
  const X=G.var('X'),eta=G.var('eta'),t=G.var('t'),XR=G.parameter('XR'),T=G.parameter('T'),Md=G.parameter('Md'),h=G.parameter('h'),Xp=tail.roots.Xp,Xv=tail.roots.Xv;
  const eXR=G.mul(XR,G.exp(G.one)),decayEnd=G.mul(eXR,G.exp(T)),s=G.log(G.div(X,eXR)),z=G.fresh('actual_continuation_decay');
  const k=at=>G.mul(G.q(4),G.sub(G.one,G.step(G.div(G.log(G.add(G.one,at)),Md))));
  const decayU=G.mul(eta,k(s)),decayMass=G.mul(eta,eXR,G.add(G.q(4),G.integral(G.mul(G.exp(z),k(z)),z,G.zero,s)));
  const logTailX=G.log(G.div(X,Xp)),tailU=G.substitute(tail.roots.U,t,logTailX),tailM=G.substitute(tail.roots.M,t,logTailX);
  const U=G.choose(X,eXR,decayEnd,G.mul(G.q(4),eta),decayU,tailU),M=G.choose(X,eXR,decayEnd,G.mul(G.q(4),eta,X),decayMass,tailM);
  const A=G.add(G.q(1,2),h),D=G.sub(G.q(1,2),h),d=G.sub(G.one,G.pow(eta,2)),L=G.sub(G.one,G.mul(G.q(2),h,G.pow(eta,2)));
  const Ueta=G.derivative(U,eta),Meta=G.derivative(M,eta),vAxis=G.div(G.sub(G.mul(G.q(8),A,G.pow(eta,2)),G.mul(G.q(4),d)),L);
  const vGeneral=G.div(G.sub(G.sub(G.mul(G.q(2),eta,U),G.div(G.mul(G.q(2),D,eta,M),X)),G.div(G.mul(d,Meta),X)),L);
  const v=G.choose(X,eXR,decayEnd,vAxis,vGeneral,vGeneral),V=G.mul(X,v),vEta=G.derivative(v,eta);
  const integral=body=>G.integral(body,X,G.zero,Xv),jm=integral(v),j0=integral(G.mul(X,v)),hm=integral(G.mul(U,v)),h0=integral(G.mul(X,U,v)),km=integral(G.pow(v,2)),k1=integral(G.mul(X,G.pow(v,2)));
  // Both physical endpoints are eta-independent. Differentiate the regular
  // integrands directly, without forming a spurious 0 * singular inactive
  // branch at X=0 in the general moving-endpoint rule.
  const uvEta=G.add(G.mul(Ueta,v),G.mul(U,vEta)),jme=integral(vEta),j0e=integral(G.mul(X,vEta)),hme=integral(uvEta),h0e=integral(G.mul(X,uvEta));
  const P=G.add(G.div(G.add(G.mul(D,eta,jme),G.mul(d,hme),G.neg(G.mul(G.q(2),A,eta,hm))),G.mul(G.q(2),L)),G.mul(G.q(1,4),km),vAxis);
  const F=G.sub(G.div(G.add(G.mul(D,eta,j0e),G.neg(j0),G.mul(d,h0e),G.mul(G.q(2),D,eta,h0)),G.mul(G.q(2),L)),G.mul(G.q(1,4),k1));
  const roots={...tail.roots,A2U:U,A2M:M,A2V:V,A2v:v,A2UEta:Ueta,A2MEta:Meta,A2MEtaEta:G.derivative(Meta,eta),A2vEta:vEta,A2AxisVX:vAxis,decayEnd,Jminus1:jm,Jzero:j0,Jminus1Eta:jme,JzeroEta:j0e,Hminus1:hm,Hzero:h0,Hminus1Eta:hme,HzeroEta:h0e,Kminus2:km,Kminus1:k1,A2P:P,A2F:F,A2POverXR:G.div(P,XR),A2FOverXR2:G.div(F,G.pow(XR,2))};
  return G.pack(roots,{
    construction:'Literal A.2 U/M from the axis through Xv, with the original outer main-pulse amplitude and both exact M/J corrections.',
    sourceEquations:['A.2','A.7','A.11','A.13','A.19','4.7','5.6'],
    axialStages:[{domain:'0<=X<=e*XR',U:'4*eta',M:'4*eta*X'},{domain:'e*XR<X<e*XR*exp(T)',U:'eta*k(log(X/(e*XR)))',M:'eta*e*XR*(4+integral_0^log(X/(e*XR)) exp(s)*k(s) ds)',k:'4*(1-sigma(log(1+s)/Md))'},{domain:'e*XR*exp(T)<=X<=Xp',U:'0',M:'eta*mConst'},{domain:'Xp<X<Xv',U:'Original outer source pulse and its fixed amplitude/linear corrections',M:'Original exact cumulative pulse moment, including eta*mConst'},{domain:'X>=Xv',U:'0',M:'0'}],
    integration:{radialIntegrandsRegularAtAxis:true,axisBoundaryRetained:true,etaDerivativeOrderForValues:2,everyIntegralHasBodyVariableAndEndpoints:true,noNumericalIntegralOracleLeaf:true},
    originalTailProgram:{schema:tail.schema,parameterExpressionSHA256:tail.parameterExpressionSHA256,nodeCount:tail.nodes.length,energyNormalization:tail.energyNormalization,amplitudeBranch:tail.equations.pulse.selectedRootBracket,sourceSupport:tail.support},
    scope:{completeLiteralA2AxialDefinitionCompiled:true,actualNonlinearSourceReplacedByA2:false,comparisonRemainderRequiredForActualSource:true,wholeA2WeightedIntegralsNumericallyEnclosed:false,fullActualWeightedMomentValuesAvailable:false,originalN404Complete:false,newLeanKernelProof:false},
    numericalBarrier:'The exact graph contains exp(13/lambda) and weighted outer pulse integrals on xi=lambda*log(X/Xp). A finite Float64 quadrature cannot evaluate them; a scaled validated exponential-weight quadrature is still required.'
  });
}
