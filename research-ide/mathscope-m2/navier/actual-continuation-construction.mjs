/** Public, JSON-safe source-continuation adapter. Shared registries remain separate. */
import {evaluateActualB22Reference} from './actual-continuation-reference.mjs';
import {actualContinuationOmegaComparison,evaluateActualAxialContinuationCell} from './actual-continuation-comparison.mjs';
import {compileActualA2AxialProgram} from './actual-continuation-a2-program.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';
import {SOURCE_PROFILE_ID} from './source-profile.mjs';

/** Executed core/reference cells + actual axial cells + global comparison.
 * No request parameter can turn a bounded actual remainder into an exact
 * total debt or enable the next-order source before that debt is closed.
 */
export function actualContinuationConstruction(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','eta','XInterval','bits','degree'].includes(key))fail('INVALID_INPUT','Unknown actual continuation construction input '+key);
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID,eta=input.eta??'1/4',XInterval=input.XInterval??['1','100'],bits=input.bits??192,degree=input.degree??48;
  context.checkCancelled?.();
  const reference=evaluateActualB22Reference({sourceProfile,eta:{kind:'DIRECT_RATIONAL',value:eta},XInterval,bits,degree,etaOrder:2},context);
  context.checkCancelled?.();
  const actualAxialCell=evaluateActualAxialContinuationCell({sourceProfile,eta,XInterval,bits}),globalComparison=actualContinuationOmegaComparison({sourceProfile}),a2Program=compileActualA2AxialProgram({profileId:sourceProfile});
  context.checkCancelled?.();
  return {
    schema:'MathScope.ActualContinuationConstruction/1',profileId:SOURCE_PROFILE_ID,parameterExpressionSHA256:reference.parameterExpressionSHA256,status:'PARTIAL',request:{sourceProfile,eta:actualAxialCell.request.eta,XInterval:actualAxialCell.request.XInterval,bits,degree},
    coreMoments:reference.coreMoments,reference,actualAxialCell,globalComparison,a2Program,
    dataBinding:{coreRows:'result.results.coreMoments.rows',referenceIntegrals:'result.results.reference.regularIntegrals.values',actualAxialRows:'result.results.actualAxialCell.rows',comparison:'result.results.globalComparison.weightedRemainder',a2Roots:'result.results.a2Program.roots'},
    computed:{actualCoreIntegralIntervals:reference.coreMoments.rows.length,referenceRegularIntegralIntervals:Object.keys(reference.regularIntegrals.values).length,actualAxialCellIntervals:actualAxialCell.rows.length,sourceExpressionNodes:a2Program.nodes.length},
    nextOrderGate:{allowed:false,code:'ACTUAL_TOTAL_MOMENT_DEBTS_NOT_CLOSED',reason:'The full A.2 functional centers have an explicit program. The actual B.26/B.34/B.8 and C.12 displacement is a retained nonzero enclosure, not an evaluated exact functional difference. The five n=1 total debts and their exact cancellation coefficients have not been produced.',midpointOrA2SubstitutionAllowed:false,sourceDerivativeFamilyRequiredBeforeNextOrder:true},
    remaining:[
      {id:'a2-functional-centers',completed:false,available:'All actual source parameters, stage integrands, cumulative M, outer amplitude roots, finite endpoints and regular Omega formulas are compiled.',required:'Evaluate the two full A.2 weighted integral centers with a scaled validated exponential-weight integrator, or supply a fully convergent computable-real implementation of those existing nodes. Finite Float64 materialization of exp(13/lambda) is not an acceptable approximation.'},
      {id:'actual-functional-displacement',completed:false,available:'A source-bound C_eta^2 inner comparison, exact B.8 mass matching, an axis boundary difference, and the actual C.12/I1 remainder bound are proved and retained.',required:'For exact n=1 debt cancellation, refine the actual-versus-A.2 displacement as a convergent functional name, including actual B.26/B.34/B.8 and C.12 contributions, instead of treating the fixed nonzero error enclosure as zero or as a chosen arbitrary point.'},
      {id:'local-order-one-debts',completed:false,available:'The separate actual-background module supplies the genuine n=1 Picard construction and the five local moment functionals.',required:'Execute or construct convergent names for the local n=1 cutoff products with actual E0/U0, combine with the complete actual global Omega functionals, and apply the exact fixed bump inverses. The current comparator cannot replace these local products.'},
      {id:'actual-residual-refinement',completed:false,required:'For N4-05 compute the same corrected source coefficients and CN,m/Km needed by the requested actual residual/precision refinement. No reference integral, fixed source error floor, or n=1 axis-only sample is promoted to that check.'}
    ],
    scope:{actualWholeCoreMomentIntegration:true,actualB22ReferenceIntervalProgram:true,actualInnerAxialCellEnclosures:true,completeA2AxialFunctionProgram:true,actualGlobalOmegaComparisonRemainder:true,completeGlobalActualFunctionEvaluator:false,actualN1TotalMomentDebtsClosed:false,actualN1MomentRepairConstructed:false,nextOrderSourceAllowed:false,originalN404Complete:false,originalN405Complete:false,newLeanKernelProof:false}
  };
}
