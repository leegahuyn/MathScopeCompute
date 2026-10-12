/** The complete source (5.19), including its pre-heat integration constant.
 * Heat change + I2 change = 0 alone would not establish this invariant.
 * This binds the actual A.2 angular reset, A.13 wait/terminal integral,
 * B8 and I1 angular corrections, then the unchanged heat subtraction.
 */
import {assertActualFirstOrderCompleted} from './actual-continuation-exact-order-one.mjs';
import {assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {actualSupportOrderProof} from './actual-continuation-exact-support.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function actualLeadingSubtractedAngularProof(first,heat){
  assertActualFirstOrderCompleted(first);assertActualHeatLeading(heat);
  const {G}=first;if(heat.G!==G)fail('INVALID_SOURCE_CONSTRUCTION','The actual leading moment and heat field must share one source graph.');
  const sourceOrder=actualSupportOrderProof(first),leading=first.originalLeading,pre=leading.pre,b8=leading.loop.b8,H=heat.heat,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),lambda=G.parameter('lambda'),eta=G.core.eta;
  const g=G.sub(G.one,h),a=G.sub(G.one,lambda),rho=G.mul(G.parameter('co'),h),XR=G.parameter('XR');
  const power=(v,p,d=1)=>G.exp(G.mul(q(p,d),G.log(v)));
  const b8I=G.add(pre.discrepancy[1],G.mul(power(XR,3,2),pre.constants.Keta,pre.constants.mu,G.quadraticSystems[b8.system].rhs[2]));
  const i1I=G.add(leading.actualDebts[1],G.mul(power(leading.constants.X0,3,2),leading.constants.K,lambda,G.quadraticSystems[leading.system].rhs[2]));
  const b8Check=sourceGraphRationalIdentity(G,b8I,{atomicNodes:[pre.discrepancy[1]]}),i1Check=sourceGraphRationalIdentity(G,i1I,{atomicNodes:[leading.actualDebts[1]]});

  const angular=G.outer.equations.angular,stage=G.outer.stages.find(s=>s.id==='angular'),last=G.outer.stages.at(-1),center0=G.sub(stage.length,q(3));
  const angularRow=G.add(...angular.linear[0].map((v,j)=>G.mul(v,angular.coefficients[j]))),angularResidual=G.sub(angularRow,angular.target[0]);
  const angularCheck=sourceGraphRationalIdentity(G,angularResidual,{atomicNodes:[angular.coefficients[1],angular.target[0]]});
  // r=I/(X*H), H=sqrt(2X)E. On this stage r'=1-a*r.
  // The actual target is -(r_after_interpolation-1/a)*exp(-a*center0).
  // Thus r_release-1/a=exp(-a*(length-center0))*(row-target).
  const rReleaseDeviation=G.mul(G.exp(G.neg(G.mul(a,G.sub(stage.length,center0)))),angularResidual);
  // Q=(1-h)r-1. Its homogeneous propagation through steepening,
  // holding and flattening is exp(-a/2-g/2); the hold has g_stage=0.
  const QbDeviation=G.mul(g,G.exp(G.mul(q(-1,2),G.add(a,g))),rReleaseDeviation);
  const Qb=G.outer.roots.Qb,Qp=G.outer.roots.Qp,wait=G.outer.roots.terminalWait,waitExponent=G.neg(G.mul(g,wait)),waitFactor=G.exp(waitExponent),waitRatio=G.div(Qp,Qb);
  const logRatio=G.log(G.div(Qb,Qp)),waitArgument=G.add(waitExponent,logRatio),waitCheck=sourceGraphRationalIdentity(G,waitArgument,{atomicNodes:[logRatio]});
  const expectedWait=G.div(logRatio,g),waitBound=wait===expectedWait&&sourceOrder.pass;

  // Bind the actual A.13 operand itself, including the factor 1/2 from
  // sigma((s-1)/2). It is the cumulative terminal loss of J(s)Q(s).
  const qpNode=G.nodes[Qp];
  if(qpNode?.op!=='definite_integral')fail('INVALID_SOURCE_CONSTRUCTION','The actual A.13 terminal integral is missing.');
  const [qpBody,t,lo,hi]=qpNode.args,fo=s=>G.sub(G.one,G.mul(rho,G.sub(G.one,G.step(G.div(G.sub(s,G.one),q(2)))))),foPrime=s=>G.mul(q(1,2),rho,G.step(G.div(G.sub(s,G.one),q(2)),1));
  const expectedDensity=G.div(G.mul(G.exp(G.mul(g,t)),foPrime(t)),G.sub(G.one,rho));
  const terminalDensityCheck=sourceGraphRationalIdentity(G,G.sub(qpBody,expectedDensity));
  const s=G.fresh('actual_A13_terminal_coordinate'),J=G.div(G.mul(G.exp(G.mul(g,s)),fo(s)),G.sub(G.one,rho));
  // Use a distinct bound variable when the upper endpoint is s.
  const u=G.fresh('actual_A13_cumulative'),partial=G.integral(G.substitute(qpBody,t,u),u,G.one,s),Qmid=G.div(G.sub(Qp,partial),J);
  const odeResidual=G.add(G.derivative(Qmid,s),G.mul(G.add(g,G.div(foPrime(s),fo(s))),Qmid),G.div(foPrime(s),fo(s)));
  const terminalODE=sourceGraphRationalIdentity(G,odeResidual,{atomicNodes:[Qp,partial,G.exp(G.mul(g,s))]});
  const terminalEndNumerator=G.sub(Qp,G.integral(qpBody,t,G.one,q(3)));
  const terminalEndCheck=sourceGraphRationalIdentity(G,terminalEndNumerator,{atomicNodes:[Qp]});
  const terminalSourceChecks={actualIntegralBounds:lo===G.one&&hi===q(3),actualTerminalStage:last.id==='terminal'&&last.length===q(3),
    actualDensity:terminalDensityCheck.pass,actualTerminalODE:terminalODE.pass,terminalEndZero:terminalEndCheck.pass,
    positiveFoAndJ:sourceOrder.parameterChecks.actualCo&&sourceOrder.arithmeticChecks.hDyadicSmall,
    waitUsesPositiveActualQbQp:waitBound&&waitCheck.pass};

  // At terminal entry, X*H/(1-h) times Q is the physical subtracted
  // moment. Beyond the terminal endpoint E=E_pow and r=1/(1-h).
  const Xstart=G.mul(XR,G.exp(last.start)),Estart=G.mul(G.parameter('Pstar'),G.exp(last.logAStart)),physicalScale=G.div(G.mul(G.sqrt(q(2)),power(Xstart,3,2),Estart),g);
  const A2base=G.mul(physicalScale,G.add(G.sub(G.mul(Qb,waitFactor),Qp),G.mul(waitFactor,QbDeviation)));
  const beforeHeatBody=G.add(A2base,b8I,i1I),heatI=G.add(H.heatI,G.mul(lambda,H.norm[0],G.quadraticSystems[H.system].rhs[0])),originalRoot=G.add(beforeHeatBody,heatI);
  const normalizedRoot=G.substitute(originalRoot,waitFactor,waitRatio),atoms=[pre.discrepancy[1],leading.actualDebts[1],angular.coefficients[1],angular.target[0],Qb,Qp,physicalScale,H.heatI,H.norm[0]];
  const fullCheck=sourceGraphRationalIdentity(G,normalizedRoot,{atomicNodes:atoms});
  const missingWait=sourceGraphRationalIdentity(G,G.sub(Qb,Qp),{atomicNodes:[Qb,Qp]}),missingAngular=sourceGraphRationalIdentity(G,G.neg(angular.target[0]),{atomicNodes:[angular.target[0]]}),missingB8=sourceGraphRationalIdentity(G,pre.discrepancy[1],{atomicNodes:[pre.discrepancy[1]]});
  const pass=b8Check.pass&&i1Check.pass&&angularCheck.pass&&Object.values(terminalSourceChecks).every(Boolean)&&fullCheck.pass&&[missingWait,missingAngular,missingB8].every(p=>!p.pass);
  if(!pass)fail('INTERNAL_VALIDATION','The complete pre-heat and post-heat source angular invariant did not close.');
  return {schema:'MathScope.ActualLeadingSubtractedAngularProof/1',originalRoot,normalizedRoot,beforeHeatBody,A2base,heatChangeAndI2:heatI,
    correctionHistories:{B8:{actualIncoming:pre.discrepancy[1],actualRootSystem:b8.system,body:b8I,check:b8Check},I1:{actualIncoming:leading.actualDebts[1],actualRootSystem:leading.system,body:i1I,check:i1Check}},
    angularReset:{actualTarget:angular.target[0],actualMatrixRow:angular.linear[0],actualCoefficients:angular.coefficients,residual:angularResidual,check:angularCheck,rReleaseDeviation,QbDeviation,
      sourceIdentity:'r=I/(XH), H=sqrt(2X)E; r_prime=1-(3/2+alpha)r. The actual A.2 rInitial/rDecay/rEntry/rBefore/rAfter integrals form the retained target. At angular release r-1/(1-lambda)=exp(-(1-lambda)*(length-center0))*(actual row-target).'},
    terminal:{Qb,Qp,wait,waitFactor,waitRatio,waitArgument,waitCheck,sourceChecks:terminalSourceChecks,density:qpBody,expectedDensity,terminalDensityCheck,coordinate:s,J,partial,Qmid,odeResidual,terminalODE,terminalEndNumerator,terminalEndCheck,Xstart,Estart,physicalScale,
      sourceIdentity:'Q=(1-h)I/(XH)-1; (J Q)_s=-exp((1-h)s)*f_o_prime/(1-rho). Qb*exp(-(1-h)*wait)=Qp, and the actual Qp integral is the entire loss from s=1 to3. Therefore I-I_pow=0 after the terminal stage.'},
    analyticRewrite:{from:waitFactor,to:waitRatio,argumentIdentity:waitCheck,positiveDomainSource:sourceOrder.parameterExpressionSHA256,rule:'exp(-log(Qb/Qp))=Qp/Qb for the actual positive Qb,Qp',verified:waitBound&&waitCheck.pass},
    sourceOrderProof:sourceOrder,check:fullCheck,negativeControls:{waitOmitted:missingWait,angularCorrectionOmitted:missingAngular,B8AngularCorrectionOmitted:missingB8},
    source:'Original A.11, A.13, (5.19); B8/I1 restore the actual angular moment; H8-H14 change the same prescribed H_pow by the retained heat debt and I2 correction.',
    constantOfIntegrationIncluded:true,heatChangeAloneUsedAsWholeMoment:false,numericIntegralValuesUsed:false,pass};
}
