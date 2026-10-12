/** Actual completed leading stress and its exact two-column inverse.
 * Every prefix below uses the original B8/C12/I1/I2/heat-prepared fields,
 * including both viscosity/shear terms. No A2 fixture is substituted. */
import {assertActualCovarianceOperator} from './actual-covariance-source-operator.mjs';
import {certifyActualCovarianceOperatorBounds} from './actual-covariance-operator-bounds.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function attachActualCovarianceTarget(operator,context={}){
  assertActualCovarianceOperator(operator);context.checkCancelled?.();const {G,background,chart,constants:c,geometry:g,frozen:f}=operator,q=(n,d=1)=>G.q(n,d),{X,eta}=background.prepared.bootstrap.constants;
  const F=background.prepared.records[0].global.F,U=background.prepared.records[0].global.U,M=background.prepared.bootstrap.finalM,parameters=[X,eta],t=G.fresh('actual_H_target_prefix_X');
  const integrate=(name,body)=>G.share(G.integral(G.substitute(body,X,t),t,G.zero,X),parameters,'ActualCovarianceTargetPrefix_'+name);
  const I=integrate('I',G.mul(q(2),X,F)),J=integrate('J',G.mul(q(2),X,U,F)),S=integrate('S',G.sub(G.pow(U,2),G.mul(X,G.pow(F,2)))),Cp=integrate('Cp',G.pow(F,2));
  const d=G.sub(G.one,G.pow(eta,2)),L=G.sub(G.one,G.mul(q(2),c.h,G.pow(eta,2))),Pi=G.add(G.core.P0,Cp),W=G.sub(G.one,G.div(G.add(G.mul(q(2),c.D,eta,M),G.mul(d,G.derivative(M,eta))),X)),sqrt2X=G.sqrt(G.mul(q(2),X));
  const angularNumerator=G.add(G.mul(G.sub(G.one,c.h),I),G.neg(G.mul(c.D,eta,G.derivative(I,eta))),G.neg(G.mul(d,G.derivative(J,eta))),G.mul(q(2),G.sub(c.h,c.D),eta,J));
  const thetaStock=G.neg(G.div(G.mul(F,X,W),L)),thetaMoment=G.div(angularNumerator,G.mul(q(2),X,L)),thetaShear=G.mul(q(2),X,G.derivative(F,X)),Ttheta=G.add(thetaStock,thetaMoment,thetaShear);
  const axialNumerator=G.add(G.neg(G.mul(X,W,U)),G.mul(c.D,G.sub(M,G.mul(eta,G.derivative(M,eta)))),G.mul(q(4),c.h,eta,S),G.neg(G.mul(d,G.derivative(S,eta))),G.mul(X,G.sub(G.mul(q(4),c.A,eta,Pi),G.mul(d,G.derivative(Pi,eta)))));
  const zMoment=G.div(axialNumerator,G.mul(L,sqrt2X)),zShear=G.div(G.mul(q(2),X,G.derivative(U,X)),sqrt2X),Tz=G.add(zMoment,zShear);
  const raw=[Ttheta,Tz].map((body,i)=>G.share(body,parameters,'ActualFullLeadingCovarianceTarget_'+i)),profileAt=body=>G.simultaneousSubstitute(body,[X,eta],[chart.X,chart.eta]),rawAt=raw.map(profileAt),factor=G.exp(G.mul(G.neg(G.add(c.A,q(1,2))),G.log(chart.s))),target=rawAt.map(x=>G.mul(factor,x));
  const H=operator.families[0].covariance.theta===undefined?null:[operator.families.map(a=>a.covariance.theta),operator.families.map(a=>a.covariance.z)];
  if(!H)fail('INVALID_SOURCE_CONSTRUCTION','The actual two H columns are missing.');
  const determinant=G.sub(G.mul(H[0][0],H[1][1]),G.mul(H[0][1],H[1][0])),adjugate=[[H[1][1],G.neg(H[0][1])],[G.neg(H[1][0]),H[0][0]]],weights=adjugate.map(row=>G.div(G.add(...row.map((x,j)=>G.mul(x,target[j]))),determinant));
  const Hy=H.map(row=>G.add(...row.map((x,j)=>G.mul(x,weights[j])))),checks=Hy.map((v,i)=>sourceGraphRationalIdentity(G,G.sub(v,target[i]),{atomicNodes:[...H.flat(),...target],maxTerms:20000}));
  if(!checks.every(x=>x.pass))fail('INTERNAL_VALIDATION','The exact actual H inverse failed its source-integral identity.');
  const sourceBounds=certifyActualCovarianceOperatorBounds(operator),Ac=G.mul(G.neg(f.c0),G.sqrt(G.add(G.one,G.pow(c.u,2)))),targetN=G.add(G.mul(f.N[0],target[0]),G.mul(f.N[1],target[1])),targetK=G.add(G.mul(f.K[0],target[0]),G.mul(f.K[1],target[1])),targetScale=G.neg(G.div(targetN,Ac));
  const normalizedWeights=weights.map((y,i)=>G.div(G.mul(operator.families[i].covariance.mass,y),targetScale));
  const absolutePhysicalDetLower=G.mul(q(15,8),Ac,c.u,...operator.families.map(x=>x.covariance.mass));
  return {schema:'MathScope.ActualCovarianceTargetAndInverse/1',G,operator,sourceProfile:operator.sourceProfile,parameterExpressionSHA256:operator.parameterExpressionSHA256,
    raw:{coordinates:{X,eta},F,U,M,I,J,S,Cp,Pi,W,components:raw,atSlowProfile:rawAt,terms:{thetaStock,thetaMoment,thetaShear,zMoment,zShear}},
    targetChart:{factor,components:target,definition:'s^(-A-1/2)*T0(X,eta), s=q/Q; T0 is the actual full heat-prepared leading stress'},
    H,determinant,adjugate,weights,squareRootWeights:weights.map(y=>G.sqrt(y)),normalizedWeights,targetScale,targetDirectionRatio:G.div(G.mul(Ac,targetK),G.mul(c.u,G.neg(targetN))),Hy,
    localCovariance:Hy.map(x=>G.mul(g.epsilon,x)),exactCovarianceResidual:checks.map(()=>G.zero),inverseChecks:checks,
    bounds:sourceBounds,absoluteDeterminantLower:absolutePhysicalDetLower,signedDeterminantUpper:G.neg(absolutePhysicalDetLower),
    determinantOrientation:'det(H)<0 in the physical (theta,z) rows and (plus,minus) columns. det(C)>15/8 after rows [-N/Ac;K/u] and positive column-mass normalization. The lower bound displayed for H is its absolute determinant.',
    sourceTargetProof:{equations:['4.8','4.11','4.16','4.26','7.27','7.29'],
      completeSource:'The authenticated completed-background graph contains actual B8 five-moment restoration, C12, I1 and the full A7 heat plus I2 compensation.',
      finitePrefixes:'I=Integral_0^X 2xF; J=Integral_0^X 2xUF; S=Integral_0^X(U^2-xF^2); Cp=Integral_0^X F^2. Pi=P0+Cp and M is the actual finalized stream.',
      shearRetained:'The actual +2X F_X and +2X U_X/sqrt(2X) terms are retained.',
      cone:'The original closed-annulus direction obeys |c0*T_K/T_N|^2<=1-kappa/2; its extended endpoint direction is used only after the exact flat source factor is divided.',
      neighborhood:'The internally generated direction modulus gives normalized target-ratio variation <=kappa/16 in every selected slow box for S>=R^1024.',
      inverse:'The actual H column error<=kappa/128 and the exact Bernstein audit give det(C)>15/8 and kappa/64<=normalized y_sign<=2.',
      flatEdges:'T0=e_a*b_a at the left collar and T0=e_b*delta^-3*b_b at the right collar, with the explicit source factors and nonzero smooth coefficients. Thus y_sign=flat_factor times a smooth positive coefficient; its square root has the same smooth zero extension. The target is exactly zero at both endpoints.'},
    domain:{openPositiveWeights:'Xa<X<Xb, eta in[-1,1], s in[1/2,2], same source slow box, every ell>=ellMinimum',
      closedEdges:'At X=Xa or Xb both y values are exactly zero; strict positivity is not asserted there.',
      normalizedWeightsAtEdges:'The displayed targetScale ratio is used only on the open stress shell. It is not evaluated as 0/0 at the endpoints.',
      numericalValuesEnclosed:false,
      exercisedMember:{admissibleBandMembershipProved:false,determinantNonzeroForThisMemberCertified:false,positiveWeightsForThisMemberCertified:false,
        reason:'The exact member formula is exercised independently of the universal certified-domain theorem. No comparison of this member ell with the source ellMinimum is asserted.'}},
    scope:{actualFullLeadingTargetConstructed:true,actualTwoColumnInverseConstructed:true,sourceCovarianceMatchedOnEveryCertifiedBox:true,
      sourceUniformQStarCertified:sourceBounds.scope.sourceUniformQStarCertified,strictPositiveWeightsOnlyOnOpenSupport:true,
      exactZeroWeightsAtFlatEdges:true,globalEquation730Certified:false,originalN506Complete:false,newLeanKernelProof:false}};
}
