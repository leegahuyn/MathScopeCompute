/** Actual ordered coefficient generator.  At every positive order it
 * constructs BOTH the common radial-collar system and a distinct natural
 * analytic auxiliary system, then applies the actual five-moment inverse.
 * No caller supplies a coefficient, an incoming moment, or a source norm.
 */
import {prepareActualOrderOneStressProgram} from './actual-continuation-exact-stress.mjs';
import {assertActualFirstOrderCompleted} from './actual-continuation-exact-order-one.mjs';
import {sourceScaledOperators,buildActualOmegaCoefficientOverX} from './actual-continuation-exact-order-two-source.mjs';
import {verifyActualMomentLinearIdentities} from './actual-continuation-exact-linear.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {ActualInductionExpressions} from './actual-residual-order-induction-expressions.mjs';
import {sourceAllOrderCutoffJets} from './actual-residual-order-induction-kernels.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

const live=new WeakMap();
const positiveOrder=n=>{if(!Number.isSafeInteger(n)||n<1)fail('INVALID_INPUT','Use a positive finite order.');};
const frozenJSON=x=>JSON.stringify(x);

/** Explicit positive majorants of the actual common/auxiliary source.
 * The ordinary cutoff derivatives are computed from the original seed.
 * All exponent constants retain 2*n*h; there is no fixed |a|<=3 step.
 */
function innerNorm(G,bootstrap,records,n,kind,sourceInfo){
  const q=(n,d=1)=>G.q(n,d),o=G.one,Lambda=G.parameter('Lambda'),rho=G.parameter('rho'),Q=G.parameter('Q'),sigma=G.parameter('sigmaStar'),delta=bootstrap.inner.delta;
  // At n=1 the original actual solution has a wider eta strip than the
  // independently generated auxiliary one. The raw radial core bound uses
  // that auxiliary norm, so all subsequent Cauchy losses use the smaller
  // auxiliary strip, for BOTH systems.
  const strip=G.div(delta,q(8n*256n**BigInt(n))),sourceStrip=G.mul(q(4),strip),loss=strip,previousStrip=n===1?G.div(delta,q(8)):records[n-1].norm.auxiliary.strip;
  const radius=G.add(q(6),q(1,1n<<BigInt(n-1))),radialDomain=kind==='actual'?bootstrap.inner.aSquared:G.div(radius,Lambda);
  const step=sourceAllOrderCutoffJets({order:2}),s=step.activation.ordinaryDerivativeBounds.map(BigInt),w=G.div(G.parameter('t1'),q(64)),Xa=G.parameter('Xa');
  const kappa1=G.div(q(s[1]),G.mul(w,Xa)),kappa2=G.add(G.div(q(s[1]),G.mul(w,G.pow(Xa,2))),G.div(q(s[2]),G.mul(G.pow(w,2),G.pow(Xa,2))));
  // On |Y|<=8 and dist(eta,I)<=rho/4 the B_rho margin is7/20.
  // |zeta|<=64/sigma^2 on that tube, giving an elementary actual g
  // upper bound without identifying a comparison profile with the source.
  const gBound=G.div(G.exp(G.div(G.mul(q(128),Lambda),G.pow(sigma,2))),G.parameter('CSelected'));
  const naturalBase=G.mul(q(64),Q,G.add(o,gBound));
  const H=[],V=[],rawDetails=[];
  for(let i=0;i<n;i++){
    let B;
    if(i===0){
      if(kind==='actual')B=bootstrap.inner.B;
      else{
        const gap=G.sub(q(8),radius),factor=G.maximum(o,G.div(G.mul(q(2),G.pow(Lambda,2)),G.pow(gap,2)));
        B=G.mul(naturalBase,factor);
      }
    }else if(kind==='auxiliary'){
      const lower=records[i].norm.auxiliary,gap=G.sub(lower.radius,radius);
      B=G.mul(lower.solutionNorm,G.maximum(o,G.div(G.mul(q(2),G.pow(Lambda,2)),G.pow(gap,2))));
      rawDetails.push({order:i,method:'actual auxiliary complex-X Cauchy',largerRadius:lower.radius,smallerRadius:radius,gap,bound:B});
    }else{
      const actual=records[i].norm.actual,aux=records[i].norm.auxiliary;
      const core=G.mul(q(2),G.pow(Lambda,2),aux.solutionNorm),collar=G.div(G.mul(q(64),actual.C,actual.solutionNorm,G.pow(Lambda,2)),actual.strip),raw=G.maximum(o,core,collar);
      B=G.mul(raw,G.add(o,G.mul(q(2),kappa1),kappa2));
      rawDetails.push({order:i,method:'auxiliary Cauchy on X<=1/Lambda; actual ODE on X>=1/Lambda; actual cutoff product',core,collar,raw,bound:B});
    }
    H.push(G.maximum(o,B));
    // Average is a contraction in each X derivative; one eta derivative
    // gives V_i/X.  The previous strip is common to the finite lower set.
    V.push(G.div(G.mul(q(128),G.add(o,G.mul(q(2*i),G.parameter('h'))),H[i]),previousStrip));
  }
  const e1=G.div(q(16),previousStrip),e2=G.mul(q(2),G.pow(e1,2)),E=G.add(q(4),G.mul(q(2*n),G.parameter('h')));
  const Z=B=>G.mul(B,G.add(G.mul(q(5),E),q(5),G.mul(q(6),e1)));
  const DXZ=B=>G.mul(B,G.add(G.mul(q(5),E),q(10),G.mul(q(6),e1)));
  const DEZ=B=>G.mul(B,G.add(G.mul(q(16),E),q(64),G.mul(G.add(G.mul(q(5),E),q(69)),e1),G.mul(q(6),e2)));
  const ZZ=B=>G.add(G.mul(q(5),E,Z(B)),G.mul(q(5),DXZ(B)),G.mul(q(6),DEZ(B)));
  const time=B=>G.mul(q(2),B,G.add(E,G.mul(q(2),e1),o));
  const omegaTerms=[time(V[n-1]),G.mul(q(6),V[n-1])];
  for(let i=0;i<n;i++){const j=n-1-i;omegaTerms.push(G.mul(q(3,2),V[i],V[j]),G.mul(H[i],Z(V[j])));}
  if(n>=2)omegaTerms.push(ZZ(V[n-2]));
  const omega=G.add(...omegaTerms),theta=[ZZ(H[n-1])],axial=[ZZ(H[n-1])],pressure=[G.mul(q(1,2),omega)];
  for(let i=1;i<n;i++){const j=n-i;pressure.push(G.mul(H[i],H[j]));theta.push(G.mul(q(2),V[i],H[j]),G.mul(H[i],Z(H[j])));axial.push(G.mul(V[i],H[j]),G.mul(H[i],Z(H[j])));}
  const pKnown=G.add(...pressure),Htheta=G.add(...theta),Hz=G.add(...axial),forcingBounds=[G.zero,G.zero,G.zero,G.mul(q(2),pKnown),G.mul(q(2),Htheta),G.add(G.mul(q(2),Hz),G.mul(q(16),pKnown))];
  const matrixBound=G.mul(q(512),G.add(o,E),G.add(o,H[0],V[0],Z(H[0]))),C=G.mul(q(2),G.add(matrixBound,...forcingBounds));
  const solutionNorm=G.exp(G.div(G.mul(q(9),G.pow(C,2),radialDomain),G.mul(q(2),loss))),Kcondition=G.ceiling(G.div(G.mul(q(72),G.pow(C,2),radialDomain),loss));
  return {order:n,kind,C,solutionNorm,strip,sourceStrip,loss,previousStrip,radialDomain,radius:kind==='auxiliary'?radius:null,Kcondition,
    sourceInfo,actualSourceBoundsDerived:true,sourceOperandReplacedByBound:false,leadingBase:{B:bootstrap.inner.B,naturalBase,gBound},lowerMixedRadialBounds:H,lowerRegularVBounds:V,
    rawDetails,kappa1,kappa2,e1,e2,exponentBound:E,omega,pKnown,Htheta,Hz,matrixBound,forcingBounds,
    proof:{radial:'The actual activation collar is smooth, not complex-radial analytic. Its derivatives follow from the original ODE. A separate auxiliary system supplies the small-core Cauchy estimate.',
      eta:'Previous analytic strips are at least256 times the next strip. Average, V/X, eta derivatives and products fit successively in the retained source strip.',
      matrix:'Every entry of the explicit six-by-six matrix is bounded by the displayed512*(1+E)*(1+H0+V0+Z(H0)); |eta|<=33/32, |d|<=3, |1/L|<=2, |X|,|xi|<=1.',
      naturalG:'Along eta paths of length<=2, |zeta|<=64/sigmaStar^2; g=exp(Lambda*integral zeta)/CSelected. This deliberately large true bound changes no source parameter.'}};
}

/** Universal six-component algebra kernel. The actual source constructor
 * calls this same body at lambda=2*n*h. A separate exact check can leave
 * lambda as an indeterminate, proving the equation identity for every n.
 * This operator alone is not an authenticated coefficient constructor.
 */
export function actualInductionLinearKernel(G,{X,eta,xi,lambda,F0,U0,v0,pKnown,Htheta,Hz}){
  const q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,{A,D,d,L}=G.core,b=G.neg(G.add(A,q(1,2))),c=G.neg(A),Hf=G.add(F0,G.mul(X,G.derivative(F0,X))),Hu=G.mul(X,G.derivative(U0,X)),{Z}=sourceScaledOperators(G,X,eta);
  const beta=G.add(b,lambda),gamma=G.add(c,lambda),pressureExponent=G.add(G.mul(q(-2),A),lambda),matrix0=Array.from({length:6},()=>Array(6).fill(z)),matrix1=Array.from({length:6},()=>Array(6).fill(z));
  matrix0[0][4]=o;matrix0[1][5]=o;matrix0[2][5]=q(-1);matrix0[3][0]=G.mul(q(4),xi,F0);
  matrix0[4][0]=G.mul(q(2),G.add(G.div(G.mul(beta,G.sub(G.mul(q(2),eta,U0),o)),L),v0));
  matrix0[4][1]=G.add(G.div(G.mul(q(4),eta,G.sub(A,lambda),Hf),L),G.mul(q(2),Z(b,F0)));
  matrix0[4][2]=G.div(G.mul(q(-4),eta,G.add(D,lambda),Hf),L);matrix0[4][4]=G.add(G.div(xi,L),G.mul(xi,v0),G.div(G.mul(q(-2),eta,xi,U0),L));
  matrix0[5][0]=G.div(G.mul(q(-8),eta,X,F0),L);matrix0[5][1]=G.add(G.div(G.mul(q(2),gamma,G.sub(G.mul(q(2),eta,U0),o)),L),G.div(G.mul(q(4),eta,G.sub(A,lambda),Hu),L),G.mul(q(2),Z(c,U0)));
  matrix0[5][2]=G.div(G.mul(q(-4),eta,G.add(D,lambda),Hu),L);matrix0[5][3]=G.div(G.mul(q(4),pressureExponent,eta),L);matrix0[5][5]=matrix0[4][4];
  matrix1[4][0]=G.div(G.mul(q(2),G.add(G.mul(D,eta),G.mul(d,U0))),L);matrix1[4][1]=matrix1[4][2]=G.div(G.mul(q(-2),d,Hf),L);
  matrix1[5][1]=G.div(G.mul(q(2),G.add(G.mul(D,eta),G.mul(d,U0),G.neg(G.mul(d,Hu)))),L);matrix1[5][2]=G.div(G.mul(q(-2),d,Hu),L);matrix1[5][3]=G.div(G.mul(q(2),d),L);
  const rawForcing=[z,z,z,G.mul(q(2),xi,pKnown),G.mul(q(2),Htheta),G.sub(G.mul(q(2),Hz),G.div(G.mul(q(4),eta,X,pKnown),L))];
  return {matrix0,matrix1,rawForcing,Hf,Hu,kernel:'ActualSixComponentUniversalKernel/1'};
}

function sourceSystem(G,bootstrap,records,n,kind,norm){
  const {X,eta}=bootstrap.constants,q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,{A,D,d,L}=G.core,h=G.parameter('h'),lambda=G.mul(q(2*n),h),{Z}=sourceScaledOperators(G,X,eta);
  const fields=Array.from({length:n},(_,i)=>i===0?records[0][kind]:records[i][kind]),F=fields.map(t=>t.F),U=fields.map(t=>t.U),v=fields.map(t=>t.v);
  const omega=buildActualOmegaCoefficientOverX(G,{order:n-1,X,eta,U,v}),p=[G.mul(q(-1,2),omega.value)],ht=[],hz=[],b=G.neg(G.add(A,q(1,2))),c=G.neg(A);
  for(let i=1;i<n;i++){const j=n-i,lj=G.mul(q(2*j),h);p.push(G.mul(F[i],F[j]));ht.push(G.mul(v[i],G.add(G.mul(X,G.derivative(F[j],X)),F[j])),G.mul(U[i],Z(G.add(b,lj),F[j])));hz.push(G.mul(X,v[i],G.derivative(U[j],X)),G.mul(U[i],Z(G.add(c,lj),U[j])));}
  const prev=G.mul(q(2*(n-1)),h);ht.push(G.neg(Z(G.sub(G.add(b,prev),D),Z(G.add(b,prev),F[n-1]))));hz.push(G.neg(Z(G.sub(G.add(c,prev),D),Z(G.add(c,prev),U[n-1]))));
  const pKnown=G.add(...p),Htheta=G.add(...ht),Hz=G.add(...hz),F0=F[0],U0=U[0],v0=v[0],Hf=G.add(F0,G.mul(X,G.derivative(F0,X))),Hu=G.mul(X,G.derivative(U0,X));
  const xi=G.fresh('actual_'+kind+'_order_'+n+'_xi'),{matrix0,matrix1,rawForcing,kernel}=actualInductionLinearKernel(G,{X,eta,xi,lambda,F0,U0,v0,pKnown,Htheta,Hz}),atXi=id=>G.substitute(id,X,G.pow(xi,2));
  const system=G.definePicardSystem({name:'ActualSameN3'+kind+'Order'+n,order:n,kind,linearKernel:kernel,xi,eta,diagonal:[0,0,2,0,3,1],A0:matrix0.map(r=>r.map(atXi)),A1:matrix1.map(r=>r.map(atXi)),forcing:rawForcing.map(atXi),zeroAxisDatum:[0,0,0,0,0,0],
    unknowns:['phi_n/C','U_n','Avg(U_n)-U_n','Pi_n','partial_xi(phi_n/C)','partial_xi U_n'],radialDomain:[z,G.sqrt(norm.radialDomain)],
    lowerOrders:fields.map((t,i)=>({order:i,F:atXi(t.F),U:atXi(t.U),v:atXi(t.v),kind})),actualFinalizedLowerCutoffs:kind==='actual',actualNaturalAuxiliaryEquations:kind==='auxiliary',
    tail:{sourceBound:norm.C,sourceStrip:norm.sourceStrip,solutionStrip:norm.strip,loss:norm.loss,Kcondition:norm.Kcondition,
      valueTailAtK:'4^-K/3 for K>=Kcondition',etaTailAtK:'m!*(2/solutionStrip)^m*4^-K/3',sourceNormProducer:'actual-residual-order-induction-source.mjs:innerNorm',
      actualAllOperandsSpecified:true,finitePartialSumIsSolution:false},solutionNorm:norm.solutionNorm,callerSuppliedForcing:false});
  const Fn=G.picardEven(system,0,X,eta),Un=G.picardEven(system,1,X,eta),average=G.add(Un,G.picardEven(system,2,X,eta));
  const vn=G.div(G.sub(G.sub(G.mul(q(2),eta,Un),G.mul(q(2),eta,G.add(D,lambda),average)),G.mul(d,G.derivative(average,eta))),L);
  return {order:n,kind,system,xi,F:Fn,U:Un,average,v:vn,Pi:G.picardEven(system,3,X,eta),lambda,omegaOverX:omega.value,pKnown,Htheta,Hz,rawMatrix0:matrix0,rawMatrix1:matrix1,rawForcing};
}

function actualCutoffRestriction(G,bootstrap,raw){
  const {X,eta}=bootstrap.constants,q=(n,d=1)=>G.q(n,d),r=bootstrap.orderOne,{D,d,L}=G.core;
  const w=G.div(G.parameter('t1'),q(64)),kappa=G.sub(G.one,G.step(G.div(G.sub(G.log(G.div(X,G.parameter('Xa'))),w),w)));
  const F=G.choose(X,r.Xkeep,r.Xcut,raw.F,G.mul(kappa,raw.F),G.zero),U=G.choose(X,r.Xkeep,r.Xcut,raw.U,G.mul(kappa,raw.U),G.zero),t=G.fresh('actual_order_'+raw.order+'_cut_average');
  const average=G.integral(G.substitute(U,X,G.mul(t,X)),t,G.zero,G.one),v=G.div(G.sub(G.sub(G.mul(q(2),eta,U),G.mul(q(2),eta,G.add(D,raw.lambda),average)),G.mul(d,G.derivative(average,eta))),L);
  return {order:raw.order,F,U,average,v,kappa,rawSystem:raw.system,rawF:raw.F,rawU:raw.U,cutoffPreserved:true,cutoffEnds:r.Xcut};
}

/** Whole-support lower nonlinear moments and the actual continuous inverse.
 * The source operands are functions; the norm graph never enters a debt.
 */
function completeOrder(G,bootstrap,records,n,raw,local,context){
  const {X,eta}=bootstrap.constants,r=bootstrap.orderOne,q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,{D,d,L}=G.core,{Xkeep,Xcut,Xplus,X0,IposRight,Rbase,ef,supports,Umat,Emat,Uinverse,Einverse}=r,lambda=G.parameter('lambda');
  const integrate=(body,a,b,name)=>{const t=G.fresh(name),shared=G.share(body,[X,eta],name+'_body');return G.integral(G.substitute(shared,X,t),t,a,b);};
  const Ft=local.F,Ut=local.U,F0=records[0].actual.F,U0=records[0].actual.U,localBodies=[Ut,G.mul(q(2),X,Ft),G.mul(q(2),F0,Ft),G.mul(q(2),X,G.add(G.mul(U0,Ft),G.mul(Ut,F0))),G.sub(G.mul(q(2),U0,Ut),G.mul(q(2),X,F0,Ft))];
  const localMoments=localBodies.map((v,j)=>integrate(v,z,Xcut,'n'+n+'_local_m'+j));
  const lower=records.slice(0,n).map(r=>r.global),omegaRaw=buildActualOmegaCoefficientOverX(G,{order:n-1,X,eta,U:lower.map(r=>r.U),v:lower.map(r=>r.v)}).value;
  const omega=G.choose(X,bootstrap.inner.aSquared,Xplus,raw.omegaOverX,omegaRaw,z),low=[[],[],[]];
  for(let i=1;i<n;i++){const j=n-i;low[0].push(G.mul(lower[i].F,lower[j].F));low[1].push(G.mul(q(2),X,lower[i].U,lower[j].F));low[2].push(G.sub(G.mul(lower[i].U,lower[j].U),G.mul(X,lower[i].F,lower[j].F)));}
  const lowerBodies=low.map(row=>G.add(...row)),lowerPressure=G.sub(lowerBodies[0],G.mul(q(1,2),omega));
  const incoming=[localMoments[0],localMoments[1],G.add(localMoments[2],integrate(lowerPressure,z,Xplus,'n'+n+'_lower_pressure')),
    G.add(localMoments[3],integrate(lowerBodies[1],z,Xplus,'n'+n+'_lower_angular_flux')),
    G.add(localMoments[4],integrate(G.add(lowerBodies[2],G.mul(q(1,2),X,omega)),z,Xplus,'n'+n+'_lower_axial_flux'))].map((v,j)=>G.share(v,[eta],'ActualOrder'+n+'Moment'+j));
  const power=(v,p)=>G.exp(G.mul(p,G.log(v))),R1=power(Rbase,G.sub(o,G.mul(q(2),lambda))),Rp=power(Rbase,G.sub(q(-2),G.mul(q(2),lambda))),Rz=power(Rbase,G.mul(q(-2),lambda)),dot=(a,b)=>G.add(...a.map((v,j)=>G.mul(v,b[j])));
  const Urhs=[G.neg(G.div(incoming[0],Rbase)),G.div(G.add(G.neg(G.div(incoming[0],Rbase)),G.div(incoming[3],G.mul(ef,R1))),G.mul(q(2),lambda))];
  const Erhs=[G.neg(G.div(incoming[1],G.pow(Rbase,2))),G.neg(G.div(incoming[2],G.mul(q(2),ef,Rp))),G.div(incoming[4],G.mul(ef,Rz))],alpha=Uinverse.map(row=>dot(row,Urhs)),beta=Einverse.map(row=>dot(row,Erhs));
  const width=q(1,2048),bump=(x,j)=>G.div(G.step(G.div(G.sub(x,supports[j][0]),width),1),width),sqrt2X=G.sqrt(G.mul(q(2),X)),normalizedR=G.div(sqrt2X,Rbase);
  const dU=G.choose(X,X0,IposRight,z,G.div(G.add(...alpha.map((v,j)=>G.mul(v,bump(normalizedR,j)))),Rbase),z),dF=G.choose(X,X0,IposRight,z,G.div(G.add(...beta.map((v,j)=>G.mul(v,bump(normalizedR,j+2)))),G.mul(Rbase,sqrt2X)),z);
  const U=G.share(G.add(Ut,dU),[X,eta],'ActualOrder'+n+'GlobalU'),F=G.share(G.add(Ft,dF),[X,eta],'ActualOrder'+n+'GlobalF');
  const correctionMass=G.mul(Rbase,G.add(...alpha.map((v,j)=>{const t=G.fresh('n'+n+'_bump_mass');return G.mul(v,G.choose(normalizedR,...supports[j],z,G.integral(G.mul(t,bump(t,j)),t,supports[j][0],normalizedR),Umat[0][j]));})));
  const localMassPart=integrate(Ut,z,X,'n'+n+'_local_mass'),localMass=G.choose(X,Xkeep,Xcut,localMassPart,localMassPart,localMoments[0]),lastU=G.mul(X0,G.pow(supports[1][1],2));
  const Mbody=G.choose(X,Xkeep,lastU,G.mul(X,raw.average),G.add(localMass,correctionMass),z),M=G.share(Mbody,[X,eta],'ActualOrder'+n+'Stream'),average=G.share(G.choose(X,Xkeep,lastU,raw.average,G.div(M,X),z),[X,eta],'ActualOrder'+n+'Average');
  const v=G.share(G.div(G.sub(G.sub(G.mul(q(2),eta,U),G.mul(q(2),eta,G.add(D,raw.lambda),average)),G.mul(d,G.derivative(average,eta))),L),[X,eta],'ActualOrder'+n+'VOverX');
  const localPressurePart=integrate(localBodies[2],z,X,'n'+n+'_local_pressure'),localPressure=G.choose(X,Xkeep,Xcut,localPressurePart,localPressurePart,localMoments[2]);
  const correctionPressure=G.mul(q(2),ef,Rp,G.add(...beta.map((v,j)=>{const t=G.fresh('n'+n+'_bump_pressure');return G.mul(v,G.choose(normalizedR,...supports[j+2],z,G.integral(G.mul(power(t,G.sub(q(-2),G.mul(q(2),lambda))),bump(t,j+2)),t,supports[j+2][0],normalizedR),Emat[1][j]));})));
  const Pi=G.share(G.choose(X,Xkeep,Xplus,raw.Pi,G.add(localPressure,correctionPressure,integrate(lowerPressure,z,X,'n'+n+'_lower_pressure_prefix')),z),[X,eta],'ActualOrder'+n+'Pressure');
  const F0pos=G.mul(ef,power(sqrt2X,G.sub(q(-2),G.mul(q(2),lambda)))),F0Fn=G.add(G.choose(X,Xkeep,Xcut,G.mul(F0,raw.F),G.mul(F0,Ft),z),G.choose(X,X0,IposRight,z,G.mul(F0pos,dF),z));
  const pressureDerivative=G.add(G.mul(q(2),F0Fn),lowerPressure),originalUrows=[Umat[0],Umat[0].map((v,j)=>G.sub(v,G.mul(q(2),lambda,Umat[1][j])))];
  const correctionMoments=[G.mul(Rbase,dot(originalUrows[0],alpha)),G.mul(G.pow(Rbase,2),dot(Emat[0],beta)),G.mul(q(2),ef,Rp,dot(Emat[1],beta)),G.mul(ef,R1,dot(originalUrows[1],alpha)),G.neg(G.mul(ef,Rz,dot(Emat[2],beta)))];
  const identity=verifyActualMomentLinearIdentities();if(!identity.pass)fail('INTERNAL_VALIDATION','The actual five-moment row identity failed.');
  // Execute the actual five residual bodies BEFORE authorizing order n+1.
  // A universal row formula or a later independent audit is insufficient.
  const momentResiduals=incoming.map((v,j)=>G.add(v,correctionMoments[j]));
  const actualMomentChecks=momentResiduals.map(body=>sourceGraphRationalIdentity(G,body,{atomicNodes:incoming}));
  if(!actualMomentChecks.every(c=>c.pass))fail('PREVIOUS_ORDER_INCOMPLETE','The actual order '+n+' moments did not cancel; the next source is forbidden.');
  context.checkCancelled?.();
  return {order:n,F,U,M,average,v,V:G.mul(X,v),Pi,E:G.mul(sqrt2X,F),pressureDerivative,F0Fn,localBodies,localMoments,lowerBodies,omega,lowerPressure,incoming,Urhs,Erhs,alpha,beta,dU,dF,
    correctionMoments,momentResiduals,momentIdentity:identity,actualMomentChecks,
    actualFullLowerSupportConsumed:true,knownNonlinearMomentsRestrictedToCore:false,continuousMatrixInverse:true,callerSuppliedDebt:false,completed:actualMomentChecks.every(c=>c.pass)};
}

function attachStress(G,bootstrap,records,n,tuple){
  const {X,eta}=bootstrap.constants,q=(n,d=1)=>G.q(n,d),z=G.zero,{A,D}=G.core,h=G.parameter('h'),{Z,T}=sourceScaledOperators(G,X,eta),b=G.neg(G.add(A,q(1,2))),c=G.neg(A),nu=k=>G.mul(q(2*k),h),all=[...records.slice(0,n).map(r=>r.global),tuple],F=all.map(r=>r.F),U=all.map(r=>r.U),v=all.map(r=>r.v);
  const Fx=F.map(f=>G.derivative(f,X)),Ux=U.map(f=>G.derivative(f,X)),theta=[T(G.add(b,nu(n)),F[n])],axial=[T(G.add(c,nu(n)),U[n])];
  for(let i=0;i<=n;i++){const j=n-i;theta.push(G.mul(v[i],G.add(G.mul(X,Fx[j]),F[j])),G.mul(U[i],Z(G.add(b,nu(j)),F[j])));axial.push(G.mul(X,v[i],Ux[j]),G.mul(U[i],Z(G.add(c,nu(j)),U[j])));}
  theta.push(G.mul(q(-2),G.add(G.mul(X,G.derivative(Fx[n],X)),G.mul(q(2),Fx[n]))),G.neg(Z(G.sub(G.add(b,nu(n-1)),D),Z(G.add(b,nu(n-1)),F[n-1]))));
  axial.push(Z(G.add(G.mul(q(-2),A),nu(n)),tuple.Pi),G.mul(q(-2),G.add(G.mul(X,G.derivative(Ux[n],X)),Ux[n])),G.neg(Z(G.sub(G.add(c,nu(n-1)),D),Z(G.add(c,nu(n-1)),U[n-1]))));
  const rawTheta=G.share(G.add(...theta),[X,eta],'ActualOrder'+n+'AngularResidual'),rawZ=G.share(G.add(...axial),[X,eta],'ActualOrder'+n+'AxialResidual'),{Xminus,Xplus}=bootstrap.orderOne;
  const thetaBody=G.mul(q(2),X,G.choose(X,Xminus,Xplus,z,rawTheta,z)),zBody=G.choose(X,Xminus,Xplus,z,rawZ,z),integrate=(body,a,b)=>{const t=G.fresh('n'+n+'_stress');return G.integral(G.substitute(body,X,t),t,a,b);};
  const Ttheta=G.choose(X,Xminus,Xplus,z,G.neg(G.div(integrate(thetaBody,Xminus,X),G.mul(q(2),X))),z),Tz=G.choose(X,Xminus,Xplus,z,G.neg(G.div(integrate(zBody,Xminus,X),G.sqrt(G.mul(q(2),X)))),z);
  return {order:n,rawTheta,rawZ,angularTerms:theta,axialTerms:axial,Ttheta,Tz,thetaBody,zBody,
    backwardTheta:G.div(integrate(thetaBody,X,Xplus),G.mul(q(2),X)),backwardZ:G.div(integrate(zBody,X,Xplus),G.sqrt(G.mul(q(2),X))),
    conservativeSourceMoments:[tuple.actualMomentChecks.every(c=>c.pass),records[n-1].global.actualMomentChecks.every(c=>c.pass)],
    compactSupport:[Xminus,Xplus],lowerViscosityOrder:n-1,leadingHeatUsedAsPositiveLower:false,exactNumericValuesClaimed:false};
}

export function prepareActualOrderInduction(input={},context={}){
  for(const k of Object.keys(input))if(!['sourceProfile','order','maxNodes','maxDerivativeOrder'].includes(k))fail('INVALID_INPUT','Actual coefficients and their norms cannot be supplied: '+k);
  const order=input.order??2;positiveOrder(order);
  const maxNodes=input.maxNodes??1500000;if(order>Math.floor(Math.sqrt(maxNodes)))fail('RESOURCE_LIMIT','Requested induction prefix exceeds its explicit construction budget.');
  const bootstrap=prepareActualOrderOneStressProgram({sourceProfile:input.sourceProfile,terms:0,bits:128,heatIterations:0},context);assertActualFirstOrderCompleted(bootstrap.completedOrderOne);
  const G=new ActualInductionExpressions(bootstrap.G,{maxNodes,maxDerivativeOrder:input.maxDerivativeOrder??128,checkCancelled:context.checkCancelled}),{X,eta}=bootstrap.constants,q=(n,d=1)=>G.q(n,d),{D,d,L,Ustar}=G.core,Lambda=G.parameter('Lambda'),Y=G.mul(Lambda,X);
  const share=(v,name)=>G.share(v,[X,eta],name),naturalF=G.mul(G.core.g,G.natural('Phi',Y)),naturalU=G.add(Ustar,G.div(G.natural('u',Y),Lambda)),average=G.add(Ustar,G.div(G.natural('average',Y),Lambda));
  const naturalV=G.div(G.sub(G.sub(G.mul(q(2),eta,naturalU),G.mul(q(2),D,eta,average)),G.mul(d,G.derivative(average,eta))),L);
  const records=[{order:0,actual:{F:bootstrap.inner.F0,U:bootstrap.inner.U0,v:bootstrap.inner.v0},auxiliary:{F:naturalF,U:naturalU,v:naturalV,average},
    global:{order:0,F:share(bootstrap.actualHeat.heat.finalF,'ActualFinalLeadingF'),U:share(bootstrap.finalU,'ActualFinalLeadingU'),v:share(bootstrap.finalv,'ActualFinalLeadingVOverX'),completed:true},
    sourceGate:bootstrap.program.parameterExpressionSHA256}];
  for(let n=1;n<=order;n++){
    context.checkCancelled?.();if(records.slice(0,n).some(r=>!r.global.completed))fail('PREVIOUS_ORDER_INCOMPLETE','Every lower actual global tuple must have completed its five moments.');
    const auxiliaryNorm=innerNorm(G,bootstrap,records,n,'auxiliary',{allLowerAuxiliarySystemsGenerated:true}),auxiliary=sourceSystem(G,bootstrap,records,n,'auxiliary',auxiliaryNorm);
    let raw,actual,norm,global,stress;
    if(n===1){
      const i=bootstrap.inner,r=bootstrap.orderOne;norm={order:1,kind:'actual',C:i.C1,solutionNorm:i.solutionNorm,strip:i.loss,sourceStrip:G.mul(q(2),i.loss),loss:i.loss,radialDomain:i.aSquared,radius:null,Kcondition:G.picardSystems[i.system].tail.Kcondition,originalActualSourceMajorant:true};
      raw={order:1,kind:'actual',system:i.system,F:G.picardEven(i.system,0,X,eta),U:G.picardEven(i.system,1,X,eta),average:G.add(G.picardEven(i.system,1,X,eta),G.picardEven(i.system,2,X,eta)),Pi:G.picardEven(i.system,3,X,eta),lambda:i.lambda1,omegaOverX:i.omegaOverX};
      actual=actualCutoffRestriction(G,bootstrap,raw);
      global={order:1,F:share(r.F1,'ActualFinalOrderOneF'),U:share(r.U1,'ActualFinalOrderOneU'),v:share(r.v1,'ActualFinalOrderOneVOverX'),M:share(r.M1,'ActualFinalOrderOneStream'),average:share(r.M1overX,'ActualFinalOrderOneAverage'),Pi:share(r.Pi1,'ActualFinalOrderOnePressure'),E:r.E1,
        pressureDerivative:r.pressureDerivative,alpha:r.alpha,beta:r.beta,incoming:r.moments,localMoments:r.localMoments,localBodies:r.localBodies,momentIdentity:bootstrap.program.momentRepair.universalLinearIdentity,completed:true,actualFullLowerSupportConsumed:true};
      global.actualMomentChecks=r.momentResiduals.map(body=>sourceGraphRationalIdentity(G,body,{atomicNodes:r.moments}));
      global.completed=global.actualMomentChecks.every(c=>c.pass);
      if(!global.completed)fail('PREVIOUS_ORDER_INCOMPLETE','The actual source first-order moments must cancel before generating order two.');
      stress=bootstrap.stress;
    }else{
      norm=innerNorm(G,bootstrap,records,n,'actual',{allLowerActualMomentTuplesCompleted:true});raw=sourceSystem(G,bootstrap,records,n,'actual',norm);actual=actualCutoffRestriction(G,bootstrap,raw);
      global=completeOrder(G,bootstrap,records,n,raw,actual,context);stress=attachStress(G,bootstrap,records,n,global);
    }
    records.push({order:n,raw,actual,auxiliary,global,stress,norm:{actual:norm,auxiliary:auxiliaryNorm},
      coreAgreement:{domain:[G.zero,G.parameter('Xa')],reason:'Identical original leading functions, zero axis datum, and lower coefficients before their common cutoff; uniqueness of the actual six-component Picard equation.',
        actualCutoffStarts:bootstrap.orderOne.Xkeep,auxiliaryReplacesActivationCollar:false,allEarlierAuxiliarySystemsGenerated:true}});
  }
  const roots={};for(const r of records.slice(1))for(const [name,v]of Object.entries({F:r.global.F,U:r.global.U,M:r.global.M,Pi:r.global.Pi,v:r.global.v,Ttheta:r.stress.Ttheta,Tz:r.stress.Tz,actualC:r.norm.actual.C,auxiliaryC:r.norm.auxiliary.C,actualNorm:r.norm.actual.solutionNorm,auxiliaryNorm:r.norm.auxiliary.solutionNorm}))roots['n'+r.order+'_'+name]=v;
  const result={G,bootstrap,records,roots,order};
  result.program=G.pack(roots,{schema:'MathScope.ActualOrderInductionProgram/1',order,records,
    sourceProvenance:{sameN3Profile:true,parameterExpressionSHA256:bootstrap.program.parameterExpressionSHA256,actualFinalLeadingIncludingHeat:true,positiveOrderMomentsBeforeNextSource:true},
    scope:{actualFinitePrefixConstructed:true,twoExplicitSystemsAtEveryOrder:true,actualInnerSourceNormsDerived:true,actualFiveMomentOperandsGenerated:true,
      fullGlobalMixedCoefficientNormsDerived:false,actualCutoffSequenceSelected:false,backgroundC2TailCertified:false,sourceUniformQStarCertified:false,originalN506Complete:false,formalKernelProof:false}});
  live.set(result,{G,nodeCount:G.nodes.length,prefix:frozenJSON(G.nodes),definitions:G.captureFunctionDefinitions(),recordData:frozenJSON(records),bootstrap});return result;
}
export function assertActualOrderInduction(result){
  const r=live.get(result);if(!r||r.G!==result.G||frozenJSON(r.G.nodes.slice(0,r.nodeCount))!==r.prefix||!r.G.functionDefinitionsUnchanged(r.definitions)||frozenJSON(result.records)!==r.recordData)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally generated actual induction prefix.');
  assertActualFirstOrderCompleted(r.bootstrap.completedOrderOne);return true;
}
export function compileActualOrderInduction(input={},context={}){return prepareActualOrderInduction(input,context).program;}

/** Every requested tail is an actual source-system tail, independent of
 * the small number of terms optionally displayed by the UI. */
export function actualOrderInductionTail(prepared,{order,kind='actual',etaOrder=0,bits=128}={}){
  assertActualOrderInduction(prepared);positiveOrder(order);const r=prepared.records[order];
  if(!r||!['actual','auxiliary'].includes(kind)||!Number.isSafeInteger(etaOrder)||etaOrder<0||!Number.isSafeInteger(bits)||bits<1)fail('INVALID_INPUT','Use a generated order and a finite derivative/precision target.');
  const G=prepared.G,norm=r.norm[kind],q=(n,d=1)=>G.q(n,d);G.derivativeBudget(etaOrder);
  const factor=G.mul(q(factorial(etaOrder)),G.pow(G.div(q(2),norm.strip),etaOrder)),Kprecision=G.ceiling(G.div(G.add(G.mul(q(bits),G.log(q(2))),G.log(G.maximum(G.one,factor))),G.log(q(4)))),K=G.maximum(G.one,norm.Kcondition,Kprecision),tail=G.mul(q(1,3),factor,G.exp(G.neg(G.mul(K,G.log(q(4))))));
  return {order,kind,etaOrder,bits,K,tail,target:q(1,1n<<BigInt(bits)),positiveRemainderRetained:true,actualSourceConvergenceModulus:true,finiteDisplayedTermsCertified:false};
}
