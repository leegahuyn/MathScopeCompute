/** Exact generic identities for a source-bound whole-annulus assembly.
 * This file has no actual-source authority. The caller must bind every
 * field, square-root relation, normal, target and analytic estimate.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {covarianceMatrixAlgebra} from './actual-covariance-matrix.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function annulusCovarianceAlgebraAudit(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),{dot,mul,transpose,identity,sub,scale}=covarianceMatrixAlgebra(G),
    t=G.fresh('annulus_unit_circle_parameter'),F=G.fresh('annulus_frozen_F'),g=G.fresh('annulus_gradient_magnitude'),s=G.fresh('annulus_reference_slope'),
    den=G.add(G.one,G.pow(t,2)),N=[G.div(G.sub(G.pow(t,2),G.one),den),G.div(G.mul(q(2),t),den)],K=[G.neg(N[1]),N[0]],
    n=[s,...K],n2=dot(n,n),sourceK=[[G.zero,G.neg(G.mul(q(2),F)),G.zero],[G.add(G.mul(q(2),F),G.mul(g,N[0])),G.zero,G.zero],[G.mul(g,N[1]),G.zero,G.zero]],
    pressure=transpose(sourceK).map(row=>dot(n,row)),A=sourceK.map((row,i)=>row.map((v,j)=>G.add(G.neg(v),G.div(G.mul(n[i],pressure[j]),n2)))),
    U=[[G.one,G.zero],[G.neg(G.mul(s,K[0])),N[0]],[G.neg(G.mul(s,K[1])),N[1]]],Uleft=[[G.one,G.zero,G.zero],[G.zero,...N]],
    projected=mul(Uleft,mul(A,U)),expected=[[G.zero,G.div(G.mul(q(2),F,N[0]),G.add(G.one,G.pow(s,2)))],[G.neg(G.add(g,G.mul(q(2),F,N[0]))),G.zero]],
    projectionChecks=projected.flatMap((row,i)=>row.map((v,j)=>sourceGraphRationalIdentity(G,G.sub(v,expected[i][j]),{maxTerms:50000}))),
    omittedPressure=mul(Uleft,mul(scale(q(-1),sourceK),U)),pressureNegative=omittedPressure.flatMap((row,i)=>row.map((v,j)=>sourceGraphRationalIdentity(G,G.sub(v,expected[i][j]),{maxTerms:50000}))),
    lambda=G.fresh('annulus_positive_lambda0'),root=G.fresh('annulus_positive_sqrt_one_plus_s_squared'),nt=G.fresh('annulus_negative_Ntheta'),
    c=G.div(G.mul(lambda,root),G.mul(q(2),F,nt)),J=[[G.one,G.one],[c,G.neg(c)]],Jinv=[[q(1,2),G.div(q(1,2),c)],[q(1,2),G.neg(G.div(q(1,2),c))]],
    reference=[[G.zero,G.div(G.mul(q(2),F,nt),G.pow(root,2))],[G.div(G.pow(lambda,2),G.mul(q(2),F,nt)),G.zero]],
    diagonal=[[G.div(lambda,root),G.zero],[G.zero,G.neg(G.div(lambda,root))]],diag=mul(Jinv,mul(reference,J)),
    diagonalChecks=diag.flatMap((row,i)=>row.map((v,j)=>sourceGraphRationalIdentity(G,G.sub(v,diagonal[i][j])))),
    wrongC=G.div(lambda,G.mul(q(2),F,nt)),wrongJ=[[G.one,G.one],[wrongC,G.neg(wrongC)]],wrongJinv=[[q(1,2),G.div(q(1,2),wrongC)],[q(1,2),G.neg(G.div(q(1,2),wrongC))]],
    wrongDiag=mul(wrongJinv,mul(reference,wrongJ)),rootNegative=wrongDiag.flatMap((row,i)=>row.map((v,j)=>sourceGraphRationalIdentity(G,G.sub(v,diagonal[i][j])))),
    Ac=G.fresh('annulus_Ac'),u=G.fresh('annulus_u'),m=[G.fresh('annulus_mass_plus'),G.fresh('annulus_mass_minus')],
    C=[[G.fresh('annulus_C11'),G.fresh('annulus_C12')],[G.fresh('annulus_C21'),G.fresh('annulus_C22')]],
    H=[0,1].map(i=>[0,1].map(j=>G.mul(m[j],G.add(G.neg(G.mul(Ac,N[i],C[0][j])),G.mul(u,K[i],C[1][j]))))),
    determinant=M=>G.sub(G.mul(M[0][0],M[1][1]),G.mul(M[0][1],M[1][0])),detH=determinant(H),detC=determinant(C),
    determinantCheck=sourceGraphRationalIdentity(G,G.add(detH,G.mul(Ac,u,...m,detC)),{maxTerms:50000}),
    wrongOrientation=sourceGraphRationalIdentity(G,G.sub(detH,G.mul(Ac,u,...m,detC)),{maxTerms:50000}),
    checks={referenceProjection:projectionChecks,referenceDiagonalization:diagonalChecks,physicalDeterminant:determinantCheck},
    negativeControls={omittedPressureDetected:pressureNegative.some(x=>!x.pass),omittedReferenceRootDetected:rootNegative.some(x=>!x.pass),reversedDeterminantSignDetected:!wrongOrientation.pass};
  if(!projectionChecks.every(x=>x.pass)||!diagonalChecks.every(x=>x.pass)||!determinantCheck.pass||!Object.values(negativeControls).every(Boolean))
    fail('INTERNAL_VALIDATION','The source-independent annulus reference or determinant algebra failed.');
  return {schema:'MathScope.AnnulusCovarianceAlgebraAudit/1',checks,negativeControls,pass:true,sourceAuthenticated:false,
    unitFrame:'N=((t^2-1)/(1+t^2),2t/(1+t^2)), K=(-N_z,N_theta). For every source N_theta<0, t=N_z/(1-N_theta) gives this same frame.',
    referenceRelationsRequired:'root^2=1+s^2, lambda0^2=-2F0*Ntheta*(gabs+2F0*Ntheta), c0=lambda0/(2F0*Ntheta), all required denominators nonzero.',
    pressureRetained:'Reference n-prime is zero only in the algebraic reference comparison. Actual n-prime and B-prime remain in the source operator and its error estimate.',
    determinantIdentity:'det(H)=-Ac*u*mass_plus*mass_minus*det(C). Positive masses and det(C)>0 give negative physical determinant.',
    numericalSourceValuesSubstituted:false,analyticErrorBoundsProducedHere:false};
}
