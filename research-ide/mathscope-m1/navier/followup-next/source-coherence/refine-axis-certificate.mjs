import {createHash} from 'node:crypto';
import {certifyAxisSource} from '../../followup-construction/axis-source-certificate.mjs';
import {makeBudget} from '../../numerics.mjs';
import {Q,qa,qm,qd,qn,qs,parseQ} from './exact-polynomial.mjs';

const ceil=a=>-((-a.n)/a.d)+(a.n>0n&&a.n%a.d!==0n?1n:0n);
const record=a=>({numerator:String(a.n),denominator:String(a.d),exact:qs(a)});

/** Source-generated refinement for the actual low-chi axial endpoint margin.
 * No Lambda, error estimate, pressure norm, or theorem-truth flag is supplied by
 * the caller. The frozen source generator is rerun first. The same all-input
 * remainder bounds hold for every Lambda>=1 and normalized amplitude norm<=2.
 */
export function certifySourceAxisForCone(input={},budget=makeBudget({maxOperations:20000000,maxMilliseconds:60000,maxPoints:2048})) {
  const base=certifyAxisSource(input,budget);
  if(base.status!=='VERIFIED_LOCAL_BOUND_CERTIFICATE')return base;
  const B=parseQ(base.controlled.remainderBound),Lip=parseQ(base.controlled.remainderLipschitz),delta=parseQ(base.selectedParameters.deltaStar),oldLambda=parseQ(base.selectedParameters.Lambda);
  const target=qd(delta,Q(100)),required=Q(ceil(qd(B,qm(Q(2),target)))),lambda=required.n>oldLambda.n?required:oldLambda;
  const error=qd(B,qm(Q(2),lambda)),lipschitz=qd(Lip,qm(Q(2),lambda)),q=Q(159,200),uniformError=qd(error,q),lower=qa(Q(305719,1152000),qn(uniformError));
  const phase=parseQ(base.bounds.phaseRealPartUpper),logC=qa(qm(lambda,phase),Q(1));
  if(error.n*target.d>target.n*error.d||lambda.n<oldLambda.n||lipschitz.n*2n>=lipschitz.d||lower.n*4n<=lower.d)throw new Error('Automatic cone-margin refinement failed');
  const derived=structuredClone(base);
  derived.certificateScope='unique nonlinear Appendix-B axis fixed point for the same actual A.21 pressure, with Lambda automatically refined for the low-chi axial margin';
  derived.selectedParameters={...derived.selectedParameters,Lambda:qs(lambda),lambdaMode:'computed-cone-margin-refinement',logC:qs(logC),C:{kind:'EXACT_POSITIVE_EXPONENTIAL',log:qs(logC)},X0:qs(qd(Q(4),lambda)),XMax:qs(qd(Q(41,10),lambda))};
  derived.bounds={...derived.bounds,selfMapDisplacementUpper:record(error),contractionLipschitzUpper:record(lipschitz),uniformPhiError:record(uniformError),uniformPhiPositiveLower:record(lower)};
  // The old total norm and displayed comparison intervals remain conservative
  // bounds after refinement. Radial coordinates must refer to the NEW Lambda.
  for(const row of derived.tails.rows)row.X=qs(qd(parseQ(row.Y),lambda));
  derived.refinement={schema:'MathScope.Navier.AxisConeMarginRefinement/1',
    parentMathematicalSHA256:createHash('sha256').update(JSON.stringify({...base,execution:undefined})).digest('hex'),parentLambda:qs(oldLambda),selectedLambda:qs(lambda),
    targetFixedPointError:qs(target),achievedFixedPointError:qs(error),selection:'Lambda=max(Lambda_source,ceil(50*B/deltaStar)); hence B/(2Lambda)<=deltaStar/100.',
    whyTheRemainderBoundTransfers:'The frozen controlledRemainder bound uses only 1/Lambda<=1. Its coefficient-space ball, complex tube, pressure function, sigmaStar, and reference center are unchanged. The new normalization threshold enforces the same normalized amplitude bound. Thus the same B and Lipschitz bounds apply to the newly selected fixed point.',
    derivativeConsequence:'For Y<=4.1, |partial_Y(u-u0)| <= targetFixedPointError/[20*(1-4.1/20)^2], which is less than deltaStar/8.',
    changedInfiniteFunction:true,oldFinitePrefixReused:false,oldNormAndComparisonEnclosuresRemainUpperBounds:true,formalPremisesKernelChecked:false};
  derived.visualization.description='Conservative interval observations for the newly refined infinite axis sequence; the stored X coordinates use the refined Lambda.';
  derived.proofBoundary.notInferred.push('Global cone completion from Lambda refinement alone; the reference, final amplitude and activation comparisons remain separate.');
  return derived;
}
