/** Actual n=1 six-component Picard operator on the original common collar.
 * The leading functions and every forcing operand are compiled from the
 * actual nonlinear core and the literal B.26 continuation. A finite partial
 * sum is displayed separately from the convergent solution operation.
 */
import {prepareActualGlobalLeadingProgram,assertActualGlobalLeadingPrepared} from './actual-continuation-exact-global.mjs';
import {actualBackgroundMajorant} from './actual-background-majorant.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';
const actualInnerPrograms=new WeakMap();

export function attachActualFirstOrderInner(leading,{terms=2,bits=128,etaOrder=2}={},context={}){
  assertActualGlobalLeadingPrepared(leading);
  if(!Number.isSafeInteger(terms)||terms<0||terms>8||!Number.isSafeInteger(bits)||bits<16||bits>4096||!Number.isSafeInteger(etaOrder)||etaOrder<0||etaOrder>4)fail('RESOURCE_LIMIT','Use 0..8 displayed Picard terms, 16..4096 target bits and eta order 0..4.');
  const G=leading.G,pre=leading.pre,q=(a,b=1)=>G.q(a,b),z=G.zero,o=G.one,{X,eta}=leading.constants;
  if(pre.G!==G||!leading.program.scope.actualFinalGlobalU0M0V0Compiled)fail('INVALID_INPUT','Use the compiled actual leading source and its unchanged graph.');
  const {A,D,d,L,Ustar}=G.core,h=G.parameter('h'),Lambda=G.parameter('Lambda'),Xa=G.parameter('Xa'),t1=G.parameter('t1'),Q=G.parameter('Q'),rho=G.parameter('rho');
  const delta=G.div(rho,G.mul(q(1024),Q)),aSquared=G.mul(Xa,G.exp(G.div(t1,q(16)))),a=G.sqrt(aSquared),loss=G.div(delta,q(8));
  const B=G.div(G.mul(q(4096),G.pow(Lambda,2),G.pow(Q,3)),t1),C1=G.div(G.mul(q(262144),G.pow(B,2)),G.pow(delta,2));
  const C1a2=G.mul(G.pow(C1,2),aSquared),Kcondition=G.ceiling(G.div(G.mul(q(72),C1a2),loss));
  const cauchyFactor=G.mul(q(Array.from({length:etaOrder},(_,i)=>BigInt(i+1)).reduce((v,w)=>v*w,1n)),G.pow(G.div(q(16),delta),etaOrder));
  const Kprecision=G.ceiling(G.mul(q(1,2),G.add(q(bits+etaOrder**2+4*etaOrder),G.div(q(2*etaOrder),delta)))),K=G.maximum(o,Kcondition,Kprecision);
  const tail=G.mul(q(1,3),G.exp(G.neg(G.mul(K,G.log(q(4))))),cauchyFactor),target=G.q(1,1n<<BigInt(bits));
  const solutionNorm=G.exp(G.div(G.mul(q(9),C1a2),G.mul(q(2),loss))),naturalSolutionNorm=G.exp(G.div(G.mul(q(45),G.pow(C1,2)),G.mul(q(2),Lambda,loss)));
  const majorant=actualBackgroundMajorant({profileId:leading.program.profileId,bits});
  if(majorant.parameterExpressionSHA256!==leading.program.parameterExpressionSHA256)fail('INTERNAL_VALIDATION','The actual n=1 majorant and leading source differ.');

  // Only the unchanged common collar enters this system. The source B.22
  // reference is consumed inside the actual B.26 controls, not substituted
  // for the actual leading field in the differential equations.
  const Y=G.mul(Lambda,X),naturalF=pre.functions.naturalF(Y),naturalU=pre.functions.naturalU(Y),collarU=pre.functions.B26UAt(X),collarF=G.div(pre.functions.B26EAt(X),G.sqrt(G.mul(q(2),X)));
  const F0=G.choose(X,Xa,aSquared,naturalF,collarF,collarF),U0=G.choose(X,Xa,aSquared,naturalU,collarU,collarU);
  const average=G.add(Ustar,G.div(G.natural('average',Y),Lambda)),coreVoverX=G.div(G.sub(G.sub(G.mul(q(2),eta,naturalU),G.mul(q(2),D,eta,average)),G.mul(d,G.derivative(average,eta))),L);
  const t=G.fresh('actual_n1_inner_M'),collarM=G.add(pre.functions.coreMoments(q(4))[0],G.integral(pre.functions.B26UAt(t),t,Xa,X)),collarAverage=G.div(collarM,X);
  const collarVoverX=G.div(G.sub(G.sub(G.mul(q(2),eta,collarU),G.mul(q(2),D,eta,collarAverage)),G.mul(d,G.derivative(collarAverage,eta))),L),v0=G.choose(X,Xa,aSquared,coreVoverX,collarVoverX,collarVoverX);
  const vX=G.derivative(v0,X),vXX=G.derivative(vX,X),vEta=G.derivative(v0,eta),vPlusXvX=G.add(v0,G.mul(X,vX));
  const omegaOverX=G.add(G.div(G.add(G.mul(D,eta,vEta),vPlusXvX),L),G.mul(v0,G.add(G.mul(q(1,2),v0),G.mul(X,vX))),G.div(G.mul(U0,G.sub(G.mul(d,vEta),G.mul(q(2),eta,vPlusXvX))),L),G.mul(q(-2),G.add(G.mul(q(2),vX),G.mul(X,vXX))));
  const Z=(exponent,value)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(exponent,value),G.mul(X,G.derivative(value,X)))),G.mul(d,G.derivative(value,eta))),L);
  const lambda1=G.mul(q(2),h),b0=G.neg(G.add(A,q(1,2))),c0=G.neg(A),beta=G.add(b0,lambda1),gamma=G.add(c0,lambda1),pressureExponent=G.add(G.mul(q(-2),A),lambda1);
  const Hf=G.add(F0,G.mul(X,G.derivative(F0,X))),Hu=G.mul(X,G.derivative(U0,X)),pKnown=G.mul(q(-1,2),omegaOverX),angularViscosity=Z(G.sub(b0,D),Z(b0,F0)),axialViscosity=Z(G.sub(c0,D),Z(c0,U0));
  const xi=G.var('actual_inner_xi'),matrix0=Array.from({length:6},()=>Array(6).fill(z)),matrix1=Array.from({length:6},()=>Array(6).fill(z));
  matrix0[0][4]=o;matrix0[1][5]=o;matrix0[2][5]=q(-1);matrix0[3][0]=G.mul(q(4),xi,F0);
  matrix0[4][0]=G.mul(q(2),G.add(G.div(G.mul(beta,G.sub(G.mul(q(2),eta,U0),o)),L),v0));
  matrix0[4][1]=G.add(G.div(G.mul(q(4),eta,G.sub(A,lambda1),Hf),L),G.mul(q(2),Z(b0,F0)));
  matrix0[4][2]=G.div(G.mul(q(-4),eta,G.add(D,lambda1),Hf),L);
  matrix0[4][4]=G.add(G.div(xi,L),G.mul(xi,v0),G.div(G.mul(q(-2),eta,xi,U0),L));
  matrix0[5][0]=G.div(G.mul(q(-8),eta,X,F0),L);
  matrix0[5][1]=G.add(G.div(G.mul(q(2),gamma,G.sub(G.mul(q(2),eta,U0),o)),L),G.div(G.mul(q(4),eta,G.sub(A,lambda1),Hu),L),G.mul(q(2),Z(c0,U0)));
  matrix0[5][2]=G.div(G.mul(q(-4),eta,G.add(D,lambda1),Hu),L);matrix0[5][3]=G.div(G.mul(q(4),pressureExponent,eta),L);matrix0[5][5]=matrix0[4][4];
  matrix1[4][0]=G.div(G.mul(q(2),G.add(G.mul(D,eta),G.mul(d,U0))),L);
  matrix1[4][1]=matrix1[4][2]=G.div(G.mul(q(-2),d,Hf),L);
  matrix1[5][1]=G.div(G.mul(q(2),G.add(G.mul(D,eta),G.mul(d,U0),G.neg(G.mul(d,Hu)))),L);matrix1[5][2]=G.div(G.mul(q(-2),d,Hu),L);matrix1[5][3]=G.div(G.mul(q(2),d),L);
  const rawForcing=[z,z,z,G.mul(q(2),xi,pKnown),G.mul(q(-2),angularViscosity),G.mul(q(2),G.add(G.neg(axialViscosity),G.div(G.mul(q(-2),eta,X,pKnown),L)))];
  const atXi=id=>G.substitute(id,X,G.pow(xi,2)),A0=matrix0.map(row=>row.map(atXi)),A1=matrix1.map(row=>row.map(atXi)),forcing=rawForcing.map(atXi);
  const system=G.definePicardSystem({name:'ActualSameN3OrderOneInner',order:1,xi,eta,diagonal:[0,0,2,0,3,1],A0,A1,forcing,zeroAxisDatum:[0,0,0,0,0,0],unknowns:['F1=phi1/C','U1','K1=average(U1)-U1','Pi1','partial_xi F1','partial_xi U1'],
    radialDomain:[z,a],sourceLeading:{F0:atXi(F0),U0:atXi(U0),v0:atXi(v0),omega0OverX:atXi(omegaOverX)},
    tail:{sourceMajorant:'actual-background-majorant.mjs:actualBackgroundMajorant',sourceBound:C1,sourceStrip:G.div(delta,q(4)),solutionStrip:G.div(delta,q(8)),loss,Kcondition,Kprecision,K,etaOrder,error:tail,target,
      proof:'Original nilpotent A1 mask gives at most ceil(k/2) eta derivatives in term k. For k>=Kcondition=ceil(72(C1*a)^2/loss), term k<=4^(-k-1), so the value tail<=4^-K/3. Cauchy on radius delta/16 multiplies by m!*(16/delta)^m. log2(m!)<=m^2 and log2(16/delta)<=4+2/delta imply the displayed Kprecision suffices.',
      sourceTruncationIndexNumericallyMaterialized:false,tailIsForTheCertifiedIndexNotForDisplayedTerms:true},
    solutionNorm:{commonCollar:solutionNorm,naturalExtensionToY5:naturalSolutionNorm,naturalExtensionNotUsedAsActualActivation:true},
    actualSourceInputs:majorant.sourceInputs,sourceEquations:['5.2','5.3','5.4','5.5','5.6','5.7','5.8'],leadingReferenceSubstitution:false,callerSuppliedForcing:false});
  const values=Array.from({length:6},(_,i)=>G.picardRoot(system,i,xi,eta)),partial=G.picardPartialSum(system,terms);
  const F1at=Xvalue=>G.picardEven(system,0,Xvalue,eta),U1at=Xvalue=>G.picardEven(system,1,Xvalue,eta);
  const axisForcing4=G.substitute(forcing[4],xi,z),axisForcing5=G.substitute(forcing[5],xi,z),axisPressure=G.substitute(pKnown,X,z);
  const roots={...leading.roots,actualInnerXi:xi,actualInnerC1:C1,actualInnerRadialBound:B,actualInnerDelta:delta,actualInnerCommonASquared:aSquared,actualInnerCertifiedK:K,actualInnerCertifiedEtaTail:tail,actualInnerTargetError:target,actualInnerSolutionNorm:solutionNorm,
    actualN1FaxisSlope:G.div(axisForcing4,q(8)),actualN1UaxisSlope:G.div(axisForcing5,q(4)),actualN1PiaxisSlope:axisPressure};
  values.forEach((v,i)=>{roots['actualInnerSolution'+i]=v;roots['actualInnerPartial'+i]=partial.sum[i];});
  for(let m=1;m<=etaOrder;m++)for(const i of [0,1,3]){context.checkCancelled?.();roots['actualInnerSolution'+i+'_eta'+m]=G.picardRoot(system,i,xi,eta,m);}
  const program=G.pack(roots,{construction:'Actual global leading source with the original same-N3 n=1 inner Picard system and a source-convergent solution operation.',order:1,inner:{system,values,partial,majorant,commonDomain:[z,aSquared],sourceMatricesConjugatedToF1Scaling:true,leading:{F0,U0,v0,omegaOverX},tail:{K,tail,target,etaOrder},norm:solutionNorm},
    scope:{...leading.program.scope,actualOrderOneInnerPicardFunctionCompiled:true,actualOrderOneForcingFullySpecified:true,actualFinitePicardTermsGenerated:true,actualCertifiedKTermsNumericallyEvaluated:false,actualOrderOneGlobalCutoffAndIposApplied:false,nextPositiveOrderAllowed:false,originalN404Complete:false,originalN405Complete:false}});
  const result={...leading,G,program,roots,originalLeading:leading,inner:{system,values,partial,xi,F1at,U1at,F0,U0,v0,omegaOverX,lambda1,delta,aSquared,C1,B,loss,K,tail,target,solutionNorm,naturalSolutionNorm,majorant}};
  actualInnerPrograms.set(result,{G,prefix:JSON.stringify(G.nodes),nodeCount:G.nodes.length,definitions:G.captureFunctionDefinitions(),inner:result.inner,innerData:JSON.stringify(result.inner),F1at,U1at,system,roots:[F0,U0,v0,omegaOverX],leading});
  return result;
}

export function prepareActualFirstOrderInnerProgram(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','terms','bits','etaOrder'].includes(key))fail('INVALID_INPUT','Unknown actual inner Picard input '+key);
  const leading=prepareActualGlobalLeadingProgram({sourceProfile:input.sourceProfile,etaDerivativeOrder:0,rootIterations:1},context);
  return attachActualFirstOrderInner(leading,input,context);
}
export function compileActualFirstOrderInnerProgram(input={},context={}){return prepareActualFirstOrderInnerProgram(input,context).program;}

export function assertActualFirstOrderInnerPrepared(result){
  const r=actualInnerPrograms.get(result);
  if(!r||result.G!==r.G||result.inner!==r.inner||JSON.stringify(result.inner)!==r.innerData||!r.G.functionDefinitionsUnchanged(r.definitions)||result.inner.F1at!==r.F1at||result.inner.U1at!==r.U1at||result.inner.system!==r.system||[result.inner.F0,result.inner.U0,result.inner.v0,result.inner.omegaOverX].some((v,j)=>v!==r.roots[j])||JSON.stringify(r.G.nodes.slice(0,r.nodeCount))!==r.prefix)fail('INVALID_SOURCE_CONSTRUCTION','The original actual inner function, forcing and source graph must be preserved before Lemma 5.2 extension.');
  assertActualGlobalLeadingPrepared(r.leading);return true;
}
