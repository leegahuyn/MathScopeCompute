/** The actual original C.1 loop, from the completed source B.8 field.
 * Both inversions are genuine monotone-root programs with explicit m/M
 * contraction refinements. No caller-supplied loop, variance, or phase map
 * is used. The exact one-period means are retained in both primitives.
 */
import {prepareActualB8Program} from './actual-continuation-exact-b8.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function prepareActualLoopProgram(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','etaDerivativeOrder','rootIterations'].includes(key))fail('INVALID_INPUT','Unknown actual source-loop input '+key);
  const order=input.etaDerivativeOrder??0,iterations=input.rootIterations??0;
  if(!Number.isSafeInteger(order)||order<0||order>2||!Number.isSafeInteger(iterations)||iterations<0||iterations>3)fail('RESOURCE_LIMIT','Actual loop output supports eta order 0..2 and zero through three displayed monotone iterates.');
  const b8=prepareActualB8Program({sourceProfile:input.sourceProfile,etaDerivativeOrder:0,rootIterations:1},context),G=b8.G,pre=b8.pre,X=G.var('X'),eta=G.core.eta,q=(a,b=1)=>G.q(a,b),z=G.zero,o=G.one;
  const {Xa,Xi,XR,Keta}=pre.constants,Lambda=G.parameter('Lambda'),T=G.parameter('T'),lambda=G.parameter('lambda'),S=G.parameter('sourceEnvelopeS'),delta=G.parameter('loopDelta'),d0=G.parameter('loopD0'),muMax=G.parameter('loopMuMax'),Ileft=G.parameter('loopILeft'),Iright=G.parameter('loopIRight'),N=G.parameter('radialFrequencyN');
  const power=(x,a,b=1)=>G.exp(G.mul(q(a,b),G.log(x))),integral=(fn,a,b,prefix)=>{const v=G.fresh(prefix);return G.integral(fn(v),v,a,b);};
  const sigmaIntegral=v=>integral(t=>G.step(t),z,v,'C1_outer_sigma');
  const y=G.log(G.div(X,XR)),eXR=G.mul(XR,G.exp(o)),decayEnd=G.mul(eXR,G.exp(T)),Xc=G.mul(decayEnd,G.exp(o));
  const initialE=G.mul(Keta,G.exp(G.sub(G.mul(q(1,10),y),G.mul(q(3,5),sigmaIntegral(y)))));
  const decayE=G.mul(Keta,G.exp(G.add(q(-1,5),G.mul(q(-1,2),G.sub(y,o))))),es=G.sub(y,G.add(o,T));
  const entryE=G.mul(Keta,G.exp(G.add(q(-1,5),G.mul(q(-1,2),T),G.mul(q(-1,2),es),G.neg(G.mul(lambda,sigmaIntegral(es))))));
  const powerE=G.mul(Keta,G.exp(G.add(q(-7,10),G.mul(q(-1,2),T),G.mul(q(-1,2),lambda),G.neg(G.mul(G.add(q(1,2),lambda),G.sub(y,G.add(T,q(2))))))));
  const outerE=G.choose(X,XR,eXR,pre.functions.idealEAt(X),initialE,G.choose(X,decayEnd,Xc,decayE,entryE,powerE));
  const naturalE=G.mul(G.sqrt(G.mul(q(2),X)),pre.functions.naturalF(G.mul(Lambda,X))),earlyE=G.choose(X,Xa,Xi,naturalE,pre.functions.B26EAt(X),pre.functions.shiftEAt(X));
  const E=G.choose(X,b8.roots.B8patchRight,XR,G.add(earlyE,b8.deltaE),outerE,outerE),U=b8.actualPreC12U;
  const EAt=at=>G.substitute(E,X,at),UAt=at=>G.substitute(U,X,at),coreAtXa=pre.functions.coreMoments(q(4)),increments=pre.functions.increment(EAt,UAt,Xa,X,'C1_actual_prefix');
  const before=pre.functions.coreMoments(G.mul(Lambda,X)),after=coreAtXa.map((v,i)=>G.add(v,increments[i])),moments=before.map((v,i)=>G.choose(X,Xa,Xi,v,after[i],after[i]));
  // The same cumulative moments, including Cp and parameter derivatives,
  // produce the actual p_s. The old B.22 reference is not used here.
  const source=pre.functions.sourceFromState(X,G.div(E,G.sqrt(G.mul(q(2),X))),U,moments),a=G.sub(o,G.div(G.mul(q(2),X,G.derivative(E,X)),E)),bs=G.div(G.mul(q(2),X,G.derivative(U,X)),E),p1=source.p1,p2=G.div(G.mul(X,source.ns),E),ts=G.neg(G.div(bs,a)),vs=G.add(a,G.div(G.pow(bs,2),a)),cs=G.add(p1,G.mul(ts,p2)),js=G.sub(p2,G.mul(ts,p1));
  const vStar=G.add(q(2),G.mul(q(1,2),delta)),leftCut=G.add(q(2),G.mul(q(1,8),delta)),rightCut=G.add(q(2),G.mul(q(1,4),delta)),zeta=G.sub(o,G.step(G.div(G.sub(vs,leftCut),G.mul(q(1,8),delta)))),rBase=G.sqrt(G.div(G.sub(vStar,vs),a)),r=G.choose(vs,leftCut,rightCut,rBase,G.mul(zeta,rBase),z),vTarget=G.add(vs,G.mul(G.pow(zeta,2),G.sub(vStar,vs)));

  // pi is itself an exact finite integral; trig operations have their ordinary
  // convergent Taylor meaning. The M/Q definitions are valid at p2=0.
  const pi=G.mul(q(4),integral(t=>G.inv(G.add(o,G.pow(t,2))),z,o,'C1_pi')),twoPi=G.mul(q(2),pi),zz=G.fresh('C1_variance_z');
  const MAt=at=>G.div(integral(theta=>G.exp(G.mul(at,G.sine(theta))),z,twoPi,'C1_exponential_mean'),twoPi),M=MAt(zz),R=G.div(MAt(G.mul(q(2),zz)),G.pow(M,2)),R2=G.derivative(G.derivative(R,zz),zz);
  const QAt=at=>integral(s=>G.mul(G.sub(o,s),G.substitute(R2,zz,G.mul(s,at))),z,o,'C1_removable_Q');
  const muVariable=G.fresh('C1_actual_mu'),W=G.mul(d0,muVariable,G.sqrt(QAt(G.mul(muVariable,p2)))),muBody=G.sub(W,r);
  const muSystem=G.defineMonotoneSystem({name:'ActualC1VarianceRoot',parameters:[X,eta],variable:muVariable,body:muBody,left:z,right:muMax,derivativeLower:G.exp(G.neg(G.pow(S,14))),derivativeUpper:G.exp(G.pow(S,22)),source:'LOOP_DERIVATIVE_ENVELOPE.md (7)–(11), QUANTITATIVE_LOOP_SELECTION.md; actual premodulation state bound by the pinned source S.',endpointSigns:'F(0)<=0<=F(muMax); the right bracket is the source muMax=S^12.',rootBranch:'Unique nonnegative branch, including the zero branch on the flat source collars.',bodyContainsActualSource:true,removableQuotientAtP2ZeroPreserved:true});
  const mu=G.monotoneRoot(muSystem,[X,eta]);
  const thetaCoordinate=G.fresh('C1_theta'),normalizedTilt=G.div(G.exp(G.mul(zz,G.sine(thetaCoordinate))),M),tiltDerivative=G.derivative(normalizedTilt,zz);
  const tAt=theta=>G.add(ts,G.mul(d0,mu,integral(s=>G.simultaneousSubstitute(tiltDerivative,[zz,thetaCoordinate],[G.mul(s,mu,p2),theta]),z,o,'C1_t_removable')));
  const densityAt=theta=>G.div(G.mul(a,G.add(o,G.pow(tAt(theta),2))),G.mul(twoPi,vTarget)),phiAt=theta=>integral(t=>densityAt(t),z,theta,'C1_circle_lift');
  const phase=G.var('actual_loop_phase'),thetaVariable=G.fresh('C1_inverse_theta'),thetaSystem=G.defineMonotoneSystem({name:'ActualC1CircleInverseLift',parameters:[X,eta,phase],variable:thetaVariable,body:G.sub(phiAt(thetaVariable),phase),left:G.mul(twoPi,G.sub(phase,o)),right:G.mul(twoPi,G.add(phase,o)),derivativeLower:G.inv(G.mul(q(16),G.pow(S,2))),derivativeUpper:G.exp(G.pow(S,38)),source:'LOOP_DERIVATIVE_ENVELOPE.md (13), actual lifted circle density.',endpointSigns:'phi(theta+2pi)=phi(theta)+1 and phi(0)=0 imply a root in [2pi(phase-1),2pi(phase+1)].',rootBranch:'Unique global lifted inverse; no discontinuous modulo or floor is differentiated.',bodyContainsActualSource:true});
  const theta=G.monotoneRoot(thetaSystem,[X,eta,phase]);
  const primitiveAAt=t=>G.mul(q(1,2),a,G.sub(phiAt(t),G.div(t,twoPi))),primitiveBAt=t=>G.mul(q(1,2),E,a,G.sub(G.mul(ts,phiAt(t)),G.div(integral(w=>tAt(w),z,t,'C1_B_t_primitive'),twoPi)));
  const meanA=integral(t=>G.mul(primitiveAAt(t),densityAt(t)),z,twoPi,'C1_A_zero_mean'),meanB=integral(t=>G.mul(primitiveBAt(t),densityAt(t)),z,twoPi,'C1_B_zero_mean');
  // Using the exact inverse equation phi(theta)=phase removes one nested
  // integral. This identity belongs to the limit, not to a finite iterate.
  const A=G.sub(G.mul(q(1,2),a,G.sub(phase,G.div(theta,twoPi))),meanA),B=G.sub(G.mul(q(1,2),E,a,G.sub(G.mul(ts,phase),G.div(integral(t=>tAt(t),z,theta,'C1_B_at_phase'),twoPi))),meanB);
  const Acut=G.choose(X,Ileft,Iright,z,A,z),Bcut=G.choose(X,Ileft,Iright,z,B,z),physicalPhase=G.mul(N,G.log(X)),Aphysical=G.substitute(Acut,phase,physicalPhase),Bphysical=G.substitute(Bcut,phase,physicalPhase),deltaU=G.div(Bphysical,N),deltaE=G.mul(E,G.sub(G.exp(G.div(Aphysical,N)),o));
  const roots={...b8.roots,actualPreLoopE:E,actualPreLoopU:U,actualPreLoopA:a,actualPreLoopBs:bs,actualPreLoopP1:p1,actualPreLoopP2:p2,actualPreLoopVs:vs,actualPreLoopCs:cs,actualPreLoopJs:js,actualLoopMu:mu,actualLoopTheta:theta,actualLoopA:Acut,actualLoopB:Bcut,actualLoopMeanA:meanA,actualLoopMeanB:meanB,actualC12DeltaU:deltaU,actualC12DeltaE:deltaE,actualC12U:G.add(U,deltaU),actualC12E:G.add(E,deltaE),actualC12Phase:physicalPhase};
  const muIterate=G.monotoneIterate(muSystem,[X,eta],iterations),thetaIterate=G.monotoneIterate(thetaSystem,[X,eta,phase],iterations);roots.actualMuIterate=muIterate.value;roots.actualMuIterationTail=muIterate.error;roots.actualThetaIterate=thetaIterate.value;roots.actualThetaIterationTail=thetaIterate.error;
  for(let m=1;m<=order;m++)for(const name of ['actualLoopMu','actualLoopA','actualLoopB','actualC12DeltaU','actualC12DeltaE']){context.checkCancelled?.();roots[name+'_eta'+m]=G.derivative(m===1?roots[name]:roots[name+'_eta'+(m-1)],eta);}
  const program=G.pack(roots,{construction:'The original C.1 variance root, inverse circle lift, exact zero-mean primitives, and the same pinned finite-N C.12 modulation of the actual preglued field.',etaDerivativeOrder:order,
    sourceState:{domain:[Ileft,Iright],E,U,moments,a,bs,p1,p2,ts,vs,cs,js,actualFiveMomentHistoryUsed:true,referenceSubstitutedForActualState:false,heatI2OutsideThisDomain:true},
    loop:{muSystem,thetaSystem,mu,theta,pi,twoPi,phase,parameterChoices:{S,d0,muMax,delta},variance:{M,R,R2,z:zz,QMeaning:'integral_0^1 (1-s) R_second(s*z) ds',zeroArgumentAllowed:true},target:{vStar,zeta,r,vTarget},means:{meanA,meanB,ordinaryPhiMeasure:true,meanSubtractionPerformed:true},primitives:{A:Acut,B:Bcut},monotoneApproximants:{iterations,mu:muIterate,theta:thetaIterate}},
    modulation:{frequency:N,phase:physicalPhase,domain:[Ileft,Iright],deltaU,deltaE,originalNRetained:true,fastRadialDerivativeNotDiscarded:true,periodAverageSubstitution:false},
    scope:{actualPreC12SourceStateCompiled:true,actualOriginalLoopFunctionalProgramCompiled:true,actualZeroMeanPrimitivesCompiled:true,actualPinnedNModulatedFieldsCompiled:true,actualLoopRootFiniteApproximantsGenerated:true,actualLoopNumericallyEnclosed:false,actualI1FiveMomentRepairCompiled:false,fullActualOmegaFunctionalsAvailable:false,originalN404Complete:false,newLeanKernelProof:false}});
  return {G,program,b8,pre,roots,E,U,moments,a,bs,p1,p2,mu,theta,muSystem,thetaSystem,A:Acut,B:Bcut,deltaU,deltaE,constants:{X,eta,Ileft,Iright,N}};
}

export function compileActualLoopProgram(input={},context={}){return prepareActualLoopProgram(input,context).program;}
