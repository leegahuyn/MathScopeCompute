/** Public source-bound background progress API; kept separate from generic probes. */
export {buildActualBackgroundJets,evaluateBackgroundJetOracle} from './actual-background-jets.mjs';
export {actualBackgroundMajorant,auditPicardTailInequality} from './actual-background-majorant.mjs';
export {actualBackgroundAxisObservations,verifyActualBackgroundAxisObservations} from './actual-background-observations.mjs';
export {actualBackgroundMomentFunctionals} from './actual-background-moments.mjs';
export {actualBackgroundPointEnclosures,verifyActualBackgroundPointEnclosures} from './actual-background-points.mjs';
import {buildActualBackgroundJets} from './actual-background-jets.mjs';
import {actualBackgroundMajorant} from './actual-background-majorant.mjs';
import {actualBackgroundAxisObservations,verifyActualBackgroundAxisObservations} from './actual-background-observations.mjs';
import {actualBackgroundMomentFunctionals} from './actual-background-moments.mjs';
import {actualBackgroundPointEnclosures} from './actual-background-points.mjs';

export function actualBackgroundConstruction({profileId,order=1,radialDegree=3,bits=128}={}){
  const jets=buildActualBackgroundJets({profileId,order,radialDegree}),majorant=actualBackgroundMajorant({profileId,order,bits}),axisObservations=actualBackgroundAxisObservations({profileId}),moments=actualBackgroundMomentFunctionals({profileId,bits}),pointEnclosures=actualBackgroundPointEnclosures({profileId,locationScaleBits:bits});
  const verification=verifyActualBackgroundAxisObservations(axisObservations);if(!verification.pass)throw Error('An actual source-axis observation verification failed.');
  return {schema:'MathScope.ActualBackgroundConstruction/1',profileId:jets.profileId,order,radialDegree,jets,majorant,axisObservations,pointEnclosures,moments,verification,status:'PARTIAL',completed:['ACTUAL_ORDER_ONE_RADIAL_JETS','ACTUAL_COMMON_COLLAR_STRIP_AND_SOURCE_NORM','ACTUAL_CONVERGENT_PICARD_TAIL_DERIVATION','ACTUAL_FIRST_AXIS_DERIVATIVE_INTERVALS','ACTUAL_NONZERO_CORE_DIFFERENCE_QUOTIENT_ENCLOSURES','EXACT_FIVE_MOMENT_DEPENDENCY_DAG','ACTUAL_IMEAN_OMISSION_CONTROL'],remaining:['COMPLETE_ACTUAL_GLOBAL_OMEGA_MOMENT_FUNCTIONALS','APPLY_EXACT_FIVE_MOMENT_REPAIR_TO_COMPLETE_DEBTS','FINALIZE_EACH_ORDER_BEFORE_NEXT_SOURCE','EVALUATE_FINITE_SOURCE_Fslow_AND_CN_m_REFINEMENT'],allOriginalBackgroundCriteriaComplete:false};
}
