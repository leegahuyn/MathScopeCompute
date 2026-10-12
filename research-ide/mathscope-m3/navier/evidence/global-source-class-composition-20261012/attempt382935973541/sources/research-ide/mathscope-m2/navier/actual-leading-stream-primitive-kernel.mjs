/** Exact generic identities used by the original leading stream primitive.
 * Source binding, all original primitive histories and their joins are
 * checked separately. A generic identity is not source authentication.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function originalLeadingStreamPrimitiveIdentities(){
  const G=new ActualConvergentExpressions(),q=(a,b=1)=>G.q(a,b),X=G.fresh('stream_X'),
    scale=G.fresh('stream_scale'),width=G.fresh('stream_width'),left=G.fresh('stream_left'),
    coefficient=G.fresh('stream_coefficient'),u=G.fresh('stream_u'),n=G.fresh('stream_n'),
    arg=G.div(G.sub(G.div(X,scale),left),width),sigma=G.step(arg),
    normalized=G.mul(scale,coefficient,sigma),normalizedU=G.mul(coefficient,G.div(G.step(arg,1),width)),
    unnormalized=G.mul(scale,width,coefficient,sigma),unnormalizedU=G.mul(coefficient,G.step(arg,1)),
    dlog=G.derivative(G.log(X),X),logDensity=G.mul(X,u),logFTC=G.mul(logDensity,dlog),
    checks={
      normalizedBump:sourceGraphRationalIdentity(G,G.sub(G.derivative(normalized,X),normalizedU)),
      unnormalizedBump:sourceGraphRationalIdentity(G,G.sub(G.derivative(unnormalized,X),unnormalizedU)),
      logarithmicPrimitiveJacobian:sourceGraphRationalIdentity(G,G.sub(logFTC,u)),
      everyNaturalAverageCoefficient:sourceGraphRationalIdentity(G,G.sub(G.mul(G.add(n,G.one),G.div(u,G.add(n,G.one))),u)),
    },negativeControls={
      omittedNormalizedBumpWidth:sourceGraphRationalIdentity(G,G.sub(G.derivative(normalized,X),G.mul(coefficient,G.step(arg,1)))),
      omittedLogarithmicJacobian:sourceGraphRationalIdentity(G,G.sub(logDensity,u)),
      wrongNaturalAverageDenominator:sourceGraphRationalIdentity(G,G.sub(G.mul(G.add(n,G.one),G.div(u,G.add(n,q(2)))),u)),
    };
  if(Object.values(checks).some(c=>!c.pass)||Object.values(negativeControls).some(c=>c.pass))
    fail('INTERNAL_VALIDATION','The leading primitive normalization identities failed.');
  return {schema:'MathScope.OriginalLeadingStreamPrimitiveIdentities/1',checks,negativeControls,pass:true,
    sourceAuthenticated:false,
    naturalSeries:{coefficient:'average_n=u_n/(n+1), for every integer n>=0',
      finiteIdentity:'d_Y[Y*sum_(n=0)^N average_n Y^n]=sum_(n=0)^N u_n Y^n for EVERY N.',
      infiniteIdentity:'d_Y[Y*average(Y,eta)]=u(Y,eta). The original B_rho radius 20 gives uniform convergence of the series and each fixed derivative on 0<=Y<=4.1, including the one-sided axis value.',
      finiteMaterializationIsWholeSeries:false},
    primitiveRule:'If the original integrand and fixed lower endpoint are independent of X, d_X integral_a^b(X) f(t,eta)dt=f(b(X),eta)*b_X. Bound-coordinate renaming does not alter this rule.',
    logarithmicChange:'For positive original endpoints, integral_log(a)^log(b) exp(t)U(exp(t),eta)dt=integral_a^b U(x,eta)dx.',
    compactJoinRule:'At a compact right endpoint the primitive equals its full retained integral, never zero merely from compact integrand support. Each zero closure requires its actual moment equation.',
    allFixedEtaDerivatives:'The same identities hold after any fixed eta derivative for which the original source smoothness proof applies; no highest derivative is assigned zero.'};
}
