/** Finite exact H integrals and their genuine Volterra tail. These bounds
 * improve at every sufficiently large truncation order for fixed source
 * parameters. No nonrepresentable exact scale is converted to binary64. */
import {assertActualCovarianceOperator} from './actual-covariance-source-operator.mjs';
import {actualOperatorPowerAudit} from './actual-covariance-operator-bounds.mjs';
import {covarianceMatrixAlgebra} from './actual-covariance-matrix.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function actualCovarianceFiniteIntegrals(operator,input={},context={}){
  assertActualCovarianceOperator(operator);if(!input||Object.keys(input).some(k=>k!=='terms'))fail('INVALID_INPUT','Choose only a finite Volterra term count.');
  const terms=input.terms??1;if(!Number.isSafeInteger(terms)||terms<0||terms>32)fail('RESOURCE_LIMIT','Display zero through 32 actual ordered-integral terms; retain the nonzero factorial tail.');
  const audit=actualOperatorPowerAudit();if(!audit.pass)fail('INTERNAL_VALIDATION','The actual unconditional Volterra norm budget failed.');
  const {G,geometry:g,constants:c,coordinates:{v},cutoffs}=operator,q=(n,d=1)=>G.q(n,d),{mul}=covarianceMatrixAlgebra(G),rows=[];
  const basisNorm=G.mul(G.pow(c.Bnorm,20),G.pow(G.add(G.one,g.k),2),G.pow(G.add(G.one,g.Ls),2)),wholeWNorm=G.exp(G.mul(c.matrixNorm,g.Ls));
  for(const f of operator.families){
    context.checkCancelled?.();const partial=G.covariancePartialSum(f.system,{terms}),z=partial.values.map(x=>G.mul(f.P,x)),t=mul(f.frame.B,z.map(x=>[x])).map(r=>r[0]),density=[G.mul(t[0],t[1]),G.mul(t[0],t[2]),G.pow(t[0],2)];
    const integrals=density.map(d=>G.mul(g.haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),d),v,G.zero,g.Ls))),error=G.mul(q(2),g.haarFactor,g.Ls,G.pow(basisNorm,2),wholeWNorm,partial.tail);
    rows.push({sign:f.sign,terms,partial,approximateIntegrals:{theta:integrals[0],z:integrals[1],mass:integrals[2]},
      enclosure:integrals.map(x=>[G.sub(x,error),G.add(x,error)]),absoluteError:error,
      exactReferenceRoots:[f.covariance.theta,f.covariance.z,f.covariance.mass],
      actualCoefficientBodiesRetained:true,finiteValueEqualsLimit:false});
  }
  return {schema:'MathScope.ActualCovarianceFiniteIntegralEnclosures/1',G,sourceProfile:operator.sourceProfile,parameterExpressionSHA256:operator.parameterExpressionSHA256,terms,rows,
    proof:{volterra:'The explicit ordered-integral terms satisfy ||w-w_N||<=exp(KL)*(KL)^(N+1)/(N+1)!. Both ||w|| and ||w_N|| are <=exp(KL).',
      envelope:'P(mid)=1 and the exact frozen lambda-dref changes from positive to negative at the midpoint. Thus 0<P<=1 throughout [0,Ls], independent of the operator perturbation size.',
      basis:'The actual unconditional bound gives ||B||_infinity <= Bsource^20*(1+k)^2*(1+Ls)^2.',
      bilinear:'|t_r*t_j-tNr*tNj| <= 2*||B||^2*exp(KL)*tail. Multiply the exact positive Haar/transverse factor and integrate the interval length; 0<=psi<=1.',
      convergence:'For fixed actual finite K,L, (KL)^(N+1)/(N+1)! tends to zero. The error has no fixed comparison floor.',
      innerOperands:'Each coefficient, source root, natural/Picard limit and finite nested integral has the source producer already present in the retained graph. This result is an exact functional enclosure, not a decimal approximation to the whole source.'},
    unconditionalPowerAudit:audit.unconditional,allIntegrandsConstructed:true,errorTendsToZero:true,fixedNonzeroComparisonFloor:false,
    scope:{sourceBoundExactIntegralEnclosures:true,actualNumericalQuadratureExecuted:false,actualGlobalDecimalValuesProduced:false,
      finiteSampleClaimedWholeDomain:false,originalN506Complete:false}};
}
