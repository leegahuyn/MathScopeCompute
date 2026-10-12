/** Actual nonlinear core moment integrals: exact polynomial integration plus BOTH analytic errors. */
import {evaluateActualCorePoint} from './actual-core-evaluator.mjs';
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {directedArithmetic,intervalJets,fail,rational as q,qadd,qmul,qdiv,qpow,qcompare,qtext,readRational,factorial} from './actual-continuation-arithmetic.mjs';

const CORE_EVALUATOR_SHA='670952e4d28f1f6f81830e90a784192de3b387fc097db2576f9fd5716dc6d2a9';
const KEYS=['phi','yPhi','phiSquared','yPhiSquared','uOverK','uOverKSquared','yUOverKPhi'];

export function integrateIntervalPolynomial(A,coefficients,a,b,weight=0){
  if(!Number.isSafeInteger(weight)||weight<0||weight>4)fail('INVALID_INPUT','The exact polynomial weight is an integer from zero to four.');
  let total=A.zero();
  coefficients.forEach((coefficient,k)=>{const n=k+weight+1,w=qdiv(qadd(qpow(b,n),[-qpow(a,n)[0],qpow(a,n)[1]]),q(n));total=A.add(total,A.mul(coefficient,A.point(w)));});
  return total;
}

function multiplyPolynomials(J,a,b,context){
  const out=Array.from({length:a.length+b.length-1},()=>J.c(0));
  for(let i=0;i<a.length;i++){context.checkCancelled?.();for(let j=0;j<b.length;j++)out[i+j]=J.add(out[i+j],J.mul(a[i],b[j]));}
  return out;
}
const fieldBounds=(A,polynomial,Y,order)=>Array.from({length:order+1},(_,m)=>polynomial.reduce((v,c,k)=>A.add(v,A.mul(A.absUpper(c[m]),A.point(qpow(Y,k)))),A.zero()));
function productError(A,left,right,leftError,rightError,order){
  return Array.from({length:order+1},(_,m)=>{let e=A.zero();for(let j=0;j<=m;j++)e=A.add(e,A.add(A.add(A.mul(left[j],rightError[m-j]),A.mul(leftError[j],right[m-j])),A.mul(leftError[j],rightError[m-j])));return e;});
}
const endpointRadius=(A,x)=>qtext(q(x[1],A.S));

function actualCoordinateJet(A,J,eta){
  const value=readRational(eta.value,4096),j=A.small(16384),kind=eta.kind;
  const center=kind==='DIRECT_RATIONAL'?A.point(value):kind==='J_SCALED'?A.mul(j,A.point(value)):A.div(A.mul(A.mul(j,j),A.point(value)),A.point(262144000000n));
  const e=J.c(center);if(e.length>1)e[1]=j;
  const Ustar=J.add(J.scale(e,4),J.c(j));
  return {eta:e,Ustar,j,KOverLambda:A.small(16380),inverseLambda:A.small(16640)};
}

/** Internal prepared arithmetic is consumed by the B.22 adapter; result is the JSON-safe public object. */
export function prepareActualCoreMoments(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','Y','eta','etaOrder','bits','degree'].includes(key))fail('INVALID_INPUT','Unknown actual continuation integral input '+key);
  const profileId=input.sourceProfile??SOURCE_PROFILE_ID,source=assertSourceProfile(profileId),Y=readRational(input.Y??'4',4096),order=input.etaOrder??2,bits=input.bits??192,degree=input.degree??48;
  if(qcompare(Y,q(0))<0||qcompare(Y,q(41,10))>0)fail('INVALID_INPUT','Core moment integration requires 0<=Y<=41/10.');
  if(!Number.isSafeInteger(order)||order<0||order>2)fail('INVALID_INPUT','The certified normalized eta order is zero through two.');
  const eta=input.eta??{kind:'DIRECT_RATIONAL',value:'1/4'},request={sourceProfile:profileId,eta,etaOrder:order,radialOrder:0,bits,degree};
  const anchor=evaluateActualCorePoint({...request,Y:'1'},context),end=evaluateActualCorePoint({...request,Y:qtext(Y)},context),A=directedArithmetic(bits),J=intervalJets(A,order),chi=anchor.phi.chiNormalizedEtaTaylorCoefficients.map(A.unpack),coordinate=actualCoordinateJet(A,J,anchor.request.eta);
  const phi=[J.c(1)];
  // Integrate in t=y/Y on [0,1]. Scaling BEFORE convolution avoids multiplying
  // dyadic coefficient roundoff by Y^(2*degree) in the squared moments.
  for(let n=0;n<degree;n++){context.checkCancelled?.();phi.push(J.scale(J.mul(phi[n],chi),A.point(qmul(Y,q(-1,2*(n+1)*(n+2))))));}
  const uCoefficient=anchor.axial.rows.map((r,m)=>{
    let scale=A.one();for(let j=0;j<m;j++)scale=A.mul(scale,coordinate.j);
    return A.mul(A.mul(A.unpack(r.uOverKReference),A.point(Y)),A.div(scale,A.point(factorial(m))));
  });
  const u=[J.c(0),uCoefficient],phiBounds=fieldBounds(A,phi,q(1),order),uBounds=fieldBounds(A,u,q(1),order);
  const errorRecords=Array.from({length:order+1},(_,m)=>{
    const p=end.phi.rows.find(x=>x.normalizedEtaDerivativeOrder===m),tail=readRational(p.comparisonRadialCauchyTailUpper),banach=readRational(p.positiveNonlinearErrorUpper),uBanach=readRational(end.axial.rows[m].positiveNonlinearErrorUpper);
    return {etaOrder:m,comparisonTail:qtext(tail),positiveNonlinearPhiError:qtext(banach),positiveNonlinearUOverKError:qtext(uBanach),coefficientPhiError:qtext(qdiv(qadd(tail,banach),q(factorial(m)))),coefficientUError:qtext(qdiv(uBanach,q(factorial(m))))};
  });
  const pError=errorRecords.map(r=>A.point(readRational(r.coefficientPhiError))),uError=errorRecords.map(r=>A.point(readRational(r.coefficientUError)));
  const phi2=multiplyPolynomials(J,phi,phi,context),u2=multiplyPolynomials(J,u,u,context),up=multiplyPolynomials(J,u,phi,context);
  const p2Error=productError(A,phiBounds,phiBounds,pError,pError,order),u2Error=productError(A,uBounds,uBounds,uError,uError,order),upError=productError(A,uBounds,phiBounds,uError,pError,order);
  const specs=[['phi',phi,0,pError],['yPhi',phi,1,pError],['phiSquared',phi2,0,p2Error],['yPhiSquared',phi2,1,p2Error],['uOverK',u,0,uError],['uOverKSquared',u2,0,u2Error],['yUOverKPhi',up,1,upError]],integrals={},rows=[];
  for(const [key,polynomial,weight,error]of specs){
    context.checkCancelled?.();const measure=A.point(qdiv(qpow(Y,weight+1),q(weight+1)));
    integrals[key]=Array.from({length:order+1},(_,m)=>{
      const polynomialValue=A.mul(integrateIntervalPolynomial(A,polynomial.map(c=>c[m]),q(0),q(1),weight),A.point(qpow(Y,weight+1))),radius=A.mul(measure,error[m]);
      const actual=A.add(polynomialValue,[-radius[1],radius[1]]),f=A.point(factorial(m));
      rows.push({id:key,etaDerivativeOrder:m,quantity:'j0^'+m+' * partial_eta^'+m+' integral_0^Y '+({phi:'Phi',yPhi:'y*Phi',phiSquared:'Phi^2',yPhiSquared:'y*Phi^2',uOverK:'u/K',uOverKSquared:'(u/K)^2',yUOverKPhi:'y*(u/K)*Phi'}[key])+' dy',polynomialIntegral:A.pack(A.mul(polynomialValue,f)),analyticIntegralErrorUpper:endpointRadius(A,A.mul(radius,f)),actualInterval:A.pack(A.mul(actual,f)),positiveNonlinearErrorRetained:Y[0]!==0n,sourceCell:['0',qtext(Y)]});
      return actual;
    });
  }
  const KLambda=coordinate.KOverLambda,Ustar=coordinate.Ustar,coreU=J.add(J.scale(Ustar,A.point(Y)),J.scale(integrals.uOverK,KLambda));
  const coreUPhi=J.add(J.mul(Ustar,integrals.yPhi),J.scale(integrals.yUOverKPhi,KLambda));
  const coreU2=J.add(J.add(J.scale(J.mul(Ustar,Ustar),A.point(Y)),J.scale(J.mul(Ustar,integrals.uOverK),A.mul(A.point(2),KLambda))),J.scale(integrals.uOverKSquared,A.mul(KLambda,KLambda)));
  const normalizedMoments={M:coreU,I:J.scale(integrals.yPhi,2),J:J.scale(coreUPhi,2),S_axial:coreU2,S_angular:integrals.yPhiSquared,Cp:integrals.phiSquared};
  const normalizedMomentRows=Array.from({length:order+1},(_,m)=>({etaDerivativeOrder:m,derivativeNormalization:'j0^m times derivative of the SCALED coefficient; apply eta-dependent g separately',values:Object.fromEntries(Object.entries(normalizedMoments).map(([k,v])=>[k,A.pack(A.mul(v[m],A.point(factorial(m))))]))}));
  const result={
    schema:'MathScope.ActualCoreMomentIntegrals/1',profileId,parameterExpressionSHA256:source.parameterExpressionSHA256,status:'PARTIAL',request:{sourceProfile:profileId,Y:qtext(Y),eta:anchor.request.eta,etaOrder:order,bits,degree},
    method:{name:'EXACT_POLYNOMIAL_INTEGRATION_WITH_UNIFORM_ACTUAL_REMAINDER',polynomialCoordinate:'t=y/Y in [0,1]; coefficient scaling is performed before multiplication',polynomialMaximumDegree:2*degree,pointSamplingUsedAsIntegralProof:false,wholeRadialCellEnclosed:true,nonlinearComparisonErrorRemoved:false,pressureAnalyticErrorRetained:true,factorialsIncluded:true,etaDerivativeConvention:'w=(eta-eta0)/j0; coefficients are converted to j0^m ordinary eta derivatives in public rows'},
    sourceCell:{Y:['0',qtext(Y)],X:['0','('+qtext(Y)+')/Lambda'],allParametersEtaDomain:['-1','1'],actualUnmodifiedCore:Y[0]*1n<=4n*Y[1],naturalInputOnlyAboveFour:qcompare(Y,q(4))>0,actualB26CollarIntegrated:false},
    rows,normalizedMomentRows,restoration:{M:'M = Lambda^-1 * M_coefficient',I:'I = g*Lambda^-2 * I_coefficient',J:'J = g*Lambda^-2 * J_coefficient',S:'S = Lambda^-1*S_axial_coefficient - g^2*Lambda^-2*S_angular_coefficient',Cp:'Cp = g^2*Lambda^-1*Cp_coefficient',pressure:'Pi = actual A.21 Pi0 + Cp',g:'exp(Lambda*psi(eta))/CSelected',psi:'integral_0^eta -L(s)*Hstar(s)/(Hstar(s)^2+sigmaStar^2) ds',gEta:'Lambda*zeta(eta)*g',gStrictlyPositive:true,gNumericallyEvaluated:false,positiveKOverLambda:'K/Lambda',physicalMomentEtaDerivativesAlreadyAssembled:false},
    errors:{coefficientBudgets:errorRecords,pressure:anchor.axial.pressure,comparisonPolynomialUsesActualChiInterval:true,uniformProductErrorIncludesBothCrossTermsAndErrorProduct:true,changingDegreeDoesNotRemovePositiveNonlinearFloor:true},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits,operations:A.operations(),binary64UsedForDecisions:false},
    sourceBindings:{...anchor.sourceBindings,coreEvaluatorImplementationSHA256:CORE_EVALUATOR_SHA,formula:'SAME_DATUM_ANALYTIC_AXIS.md section 10, equation (25); original (4.15)'},
    scope:{sameSourceCoreMomentCoefficientsEnclosed:true,actualWholeCoreCellIntegration:true,actualFiveCoreMomentsRestoredAsPositiveScaleExpressions:true,referenceB22Applied:false,actualB26EndpointConstructed:false,actualB34ShiftIntegrated:false,actualB8IncomingDebtEvaluated:false,fullGlobalOmegaMomentsClosed:false,originalN404Complete:false,originalN405Complete:false,newLeanKernelProof:false}
  };
  return {result,A,J,Y,coordinate,integrals,normalizedMoments,anchor,end,order,degree};
}

export function evaluateActualCoreMoments(input={},context={}){return prepareActualCoreMoments(input,context).result;}

export const actualCoreMomentIntegralKeys=Object.freeze([...KEYS]);
