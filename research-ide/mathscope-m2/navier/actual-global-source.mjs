/** Public, additive entry point. Earlier background modules remain frozen. */
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {compileActualOuterAxialProgram} from './actual-global-source-outer.mjs';
import {actualGlobalOmegaReduction,actualModulationOmegaRemainder,fiveMomentsDoNotDetermineOmega} from './actual-global-source-moments.mjs';
import {actualOuterPulseObservations} from './actual-global-source-observations.mjs';

export {compileActualOuterAxialProgram,actualGlobalOmegaReduction,actualModulationOmegaRemainder,fiveMomentsDoNotDetermineOmega,actualOuterPulseObservations};
export {ActualSourceExpressions,evaluateSourceProgramDiagnostic} from './actual-global-source-expressions.mjs';
export {evaluateExactOmegaReducedMoments,evaluateExactRegularOmegaJet} from './actual-global-source-moments.mjs';

export function actualGlobalSourceConstruction(input={}){
  const allowed=['profileId','eta','xi'];for(const key of Object.keys(input))if(!allowed.includes(key))throw Error('Unknown actual global source input '+key);
  const profileId=input.profileId??SOURCE_PROFILE_ID,source=assertSourceProfile(profileId),eta=input.eta??.25,xi=input.xi??[.5,1,2,5,9];
  const outerObservations=actualOuterPulseObservations({profileId,eta,xi}),reduction=actualGlobalOmegaReduction({profileId,eta}),modulationRemainder=actualModulationOmegaRemainder({profileId}),outerProgram=compileActualOuterAxialProgram({profileId});
  return {
    schema:'MathScope.ActualGlobalSourceConstruction/1',profileId,parameterExpressionSHA256:source.parameterExpressionSHA256,status:'PARTIAL',reduction,outerProgram,outerObservations,modulationRemainder,negativeControl:fiveMomentsDoNotDetermineOmega(),
    target:{N4_04:'Apply the exact original Ipos inverse to the complete same-source five moment debts.',globalPressureDebt:'-P, with the retained actual axis boundary; P=integral Omega0/(2X).',globalFluxDebt:'+F, where F=integral Omega0/2.',fullSupport:'Xv=XR*exp(T+2+60*BOuter+13/lambda)',decomposition:['0 to I1Right: actual pre-C12 inner/continuation/B8 profile is still required.','I1Right to Xp: actual U=0, M=eta*mConst; the twenty-log-unit contribution is integrated exactly in outerProgram.','Xp to Xv: actual outer pulse, both M/J corrections, and total-S amplitude are compiled in outerProgram.','Beyond Xv: U=M=V=Omega0=0 exactly.','The final C.12/I1 change to the two functional values is covered by the separate source remainder.']},
    completed:['Exact derivative-free radial integral reduction and both fixed-subinterval boundary formulas.','Actual axis contribution, including the exact eta=0 value -4.','Same-source full outer-tail U/M definitions, explicit scalar roots, eta derivatives, and integral targets.','Actual nonzero outer U/E, M/(XE), and V/(XE) point enclosures at requested eta.','Quantified original C.12 plus I1 omission for Omega functional values, with the actual N retained.'],
    remaining:[
      {id:'preC12ActualEtaEvaluator',obligation:'Compile and evaluate the same nonlinear leading function on full eta in [-1,1], propagate it through B.22/B.26/B.34 and the actual B.8 continuous roots, and bind U and its cumulative average through eta order two.',availableInputs:'The source recipe and its norms already exist; no new user parameter is needed.',completed:false},
      {id:'completeWeightedIntegrals',obligation:'Enclose the actual pre-C12 six regular integrals and the complete outer pulse integrals, then attach the final source remainder and both original Ipos inverse blocks.',completed:false},
      {id:'etaDerivativeFamilyForInduction',obligation:'For an order-m eta derivative of the two debts, propagate source and modulation/repair bounds through eta order m+2. The present value remainder is not that derivative family.',completed:false}
    ],
    scope:{actualGlobalU0V0EverywhereEvaluated:false,preC12ArbitraryEtaFunctionEvaluatorInstalled:false,actualOuterTailDefinitionCompiled:true,actualOuterNonzeroValuesEnclosed:true,actualFullMomentDebtsClosed:false,actualIposInverseAppliedToFullDebts:false,higherOrderInductionEnabled:false,N4_03_Complete:false,N4_04_Complete:false,N4_05_Complete:false,newLeanKernelExecution:false},
    verification:{allRootAndIntegralDefinitionsHaveExplicitProgramOperands:true,noNamedOracleRelabeledAsEvaluator:true,sourceNormDoesNotReplaceFunctionValues:true,endpointMomentShortcutExplicitlyRejected:true,liveBrowserVerificationPerformedByThisModule:false}
  };
}
