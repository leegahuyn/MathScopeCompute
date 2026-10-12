/** N6 source bridge: the exact inherited Imean background fixes the five
 * profiles and inverse. Positive enormous scales never enter binary64.
 * No current full-curl defect is substituted by an arbitrary target. */
import {PINNED_N3} from '../../mathscope-m2/navier/source-profile-data.mjs';
import {assertSourceProfile,validateParameterGraph} from '../../mathscope-m2/navier/source-profile.mjs';
import {actualMeanPatchDefinitions,evaluateActualMeanPatchJet,boundActualMeanPatchJets} from '../../mathscope-m2/navier/actual-pulse-meanpatch.mjs';
import {point,iadd,isub,ineg,imul,idiv,iscale,iexp,ilog,nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const maxabs=a=>Math.max(Math.abs(a[0]),Math.abs(a[1]));
const sum=xs=>xs.reduce((a,b)=>iadd(a,b),point(0));
const clone=x=>structuredClone(x);
const SOURCE_ID='same-profile-2026-10-10.3';
const PAPER_HASH='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f';
const PARAMETER_HASH='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152';

function polynomialDerivative(p){return p.slice(1).map((x,j)=>x*(j+1));}
function reciprocalDerivative(n){let p=[1];for(let j=0;j<n;j++){const dp=polynomialDerivative(p),q=Array(p.length+1).fill(0);for(let k=0;k<dp.length;k++){q[k]+=dp[k];q[k+2]+=dp[k];}for(let k=0;k<p.length;k++)q[k+1]-=2*(j+1)*p[k];p=q;}return p;}

/** Integral enclosures use a genuine lower and upper rectangle on each
 * monotone half of the exact source-independent C-infinity bump. There is
 * no sampled-quadrature error estimate presented as an enclosure. */
function normalizedMoment(power,panels){
  const one=point(1),ten=point(10),width=idiv(one,ten),h=idiv(width,point(panels));let total=point(0);
  for(let j=0;j<panels;j++){
    // x=1+t/10. The true bump is exp(-1/[t(1-t)]), hence
    // denominator t(1-t) is bounded exactly on each panel.
    const left=idiv(point(j),point(panels)),right=idiv(point(j+1),point(panels)),t=[Math.max(0,left[0]),Math.min(1,right[1])];
    const at=x=>imul(point(x),isub(one,point(x))),dl=at(t[0]),dr=at(t[1]);
    const low=Math.max(0,Math.min(dl[0],dr[0])),high=t[0]<=.5&&t[1]>=.5?.25:Math.max(dl[1],dr[1]);
    const bLo=low===0?0:iexp(ineg(idiv(one,point(low))))[0],bHi=iexp(ineg(idiv(one,point(high))))[1];
    const x=iadd(one,idiv(t,ten)),xp=iexp(imul(power,ilog(x)));
    total=iadd(total,imul(h,imul(xp,[Math.max(0,bLo),bHi])));
  }
  return total;
}

export function sourceMeanMomentBridge(input={}){
  const known=['sourceProfile','panels','derivativeOrder'];for(const k of Object.keys(input))if(!known.includes(k))fail('INVALID_INPUT','This source bridge fixes the original base, lambda, h and profiles; unknown input '+k);
  assertSourceProfile(input.sourceProfile??SOURCE_ID);
  const panels=input.panels??128,derivativeOrder=input.derivativeOrder??3;
  if(!Number.isSafeInteger(panels)||panels<32||panels>1024||panels%2||!Number.isSafeInteger(derivativeOrder)||derivativeOrder<0||derivativeOrder>12)fail('INVALID_INPUT','Use even moment panels 32..1024 and derivative order 0..12.');
  const parameterGraph=validateParameterGraph(),definitions=actualMeanPatchDefinitions();
  const unchanged=PINNED_N3.sourcePaperSHA256===PAPER_HASH&&PINNED_N3.parameterExpressionSHA256===PARAMETER_HASH&&
    JSON.stringify(PINNED_N3.parametersExactExpressions.lambda)===JSON.stringify({exp:{product:[{integer:-1000},{ref:'T'}]}})&&
    definitions.exact.G==='0'&&definitions.exact.radialV0==='-mConst'&&definitions.exact.E==='Kmean*(1+eta^2)^(-1)*exp(-(1/2+lambda)*y)';
  if(!unchanged)fail('SOURCE_IDENTITY_MISMATCH','The original same-profile mean-patch equations changed.');
  const d=idiv(point(1),point(5)),lambdaBound=[0,2**-1000],one=point(1),two=point(2),half=idiv(one,two);
  // T=exp(1048576)+10 > 1, e>2: 0<lambda=e^-1000T<2^-1000.
  // A zero interval endpoint encloses the positive source; it is not its value.
  const powers=[point(2),ineg(iadd(two,iscale(lambdaBound,2))),ineg(iscale(lambdaBound,2)),one,isub(one,iscale(lambdaBound,2))];
  const moments=powers.map(p=>normalizedMoment(p,panels)),nodes=powers.slice(0,3).map(p=>iexp(imul(d,p)));
  const angularInverse=Array.from({length:3},()=>Array(3));
  for(let i=0;i<3;i++){
    const [j,k]=[0,1,2].filter(j=>j!==i),den=imul(isub(nodes[i],nodes[j]),isub(nodes[i],nodes[k]));
    angularInverse[0][i]=idiv(imul(nodes[j],nodes[k]),den);
    angularInverse[1][i]=ineg(idiv(iadd(nodes[j],nodes[k]),den));
    angularInverse[2][i]=idiv(one,den);
  }
  const angularDeterminant=imul(imul(isub(nodes[1],nodes[0]),isub(nodes[2],nodes[0])),isub(nodes[2],nodes[1]));
  const angularRowCheck=nodes.map((z,i)=>[0,1,2].map(j=>{
    const value=sum([angularInverse[0][j],imul(z,angularInverse[1][j]),imul(imul(z,z),angularInverse[2][j])]);return {row:i,column:j,enclosure:value,identity:i===j?1:0,pass:value[0]<=(i===j?1:0)&&value[1]>=(i===j?1:0)};
  }));
  // theta=delta/lambda. The exact alternating-series bound
  // x-x^2/2 <= 1-exp(-x) <= x, x=2d lambda>0, never subtracts
  // two numerically equal exponentials and never sets lambda to zero.
  const twoD=iscale(d,2),thetaLower=isub(twoD,iscale(imul(imul(d,d),lambdaBound),2));
  const theta=[thetaLower[0],twoD[1]],thetaInverse=idiv(one,theta),axialScaled=[thetaInverse,ineg(imul(iexp(ineg(d)),thetaInverse))];
  const supportMax=iadd(iadd(one,iscale(d,4)),iscale(ilog(idiv(point(11),point(10))),2));
  const logBumpWidth=ilog(idiv(point(11),point(10))),baseAmplitudeNormalized=imul(iexp(ineg(iadd(half,lambdaBound))),[.5,1]);
  const sourceJet=evaluateActualMeanPatchJet({y:1.5,eta:.25,s:1,order:3}),sourceUniform=boundActualMeanPatchJets(3);
  const expectedV=imul(idiv(point(1),point(1+.25**2)),iexp(ineg(imul(iadd(half,lambdaBound),point(1.5))))),actualV=sourceJet.normalizedValues.VOverKmean;
  const derivativePolynomial=reciprocalDerivative(derivativeOrder),derivativeNumeratorL1=derivativePolynomial.reduce((s,x)=>s+Math.abs(x),0);
  const checks=[
    {id:'actual-original-parameter-DAG',pass:unchanged&&parameterGraph.ok},
    {id:'actual-mean-field-power-law-overlap',pass:Math.max(expectedV[0],actualV[0])<=Math.min(expectedV[1],actualV[1])},
    {id:'all-five-bump-supports-and-potential-hull-in-Imean',pass:logBumpWidth[1]<d[0]&&supportMax[1]<5},
    {id:'positive-source-normalized-a-for-entire-eta-domain',pass:baseAmplitudeNormalized[0]>0},
    {id:'five-positive-enclosed-power-integrals',pass:moments.every(x=>x[0]>0)},
    {id:'actual-lambda-angular-inverse-separated',pass:angularDeterminant[0]>0||angularDeterminant[1]<0},
    {id:'angular-inverse-times-original-power-matrix',pass:angularRowCheck.flat().every(x=>x.pass)},
    {id:'positive-lambda-factored-axial-inverse',pass:theta[0]>0&&axialScaled.every(x=>x.every(Number.isFinite))},
    {id:'source-uniform-third-jet-bound-on-entire-potential-support',pass:sourceUniform.pass&&sourceUniform.uniformOverEntireBox&&!sourceUniform.usesFiniteSampling}
  ];
  return {schema:'MathScope.N6.ActualSourceMeanMomentBridge/1',status:'ACTUAL_SOURCE_INVERSE_DEPENDENCY_EXECUTED',pass:checks.every(x=>x.pass),checks,input:{sourceProfile:SOURCE_ID,panels,derivativeOrder},
    source:{profile:SOURCE_ID,paperSHA256:PAPER_HASH,parameterExpressionSHA256:PARAMETER_HASH,assembly:clone(PINNED_N3.inputs.assembly),
      functions:['actualMeanPatchDefinitions','evaluateActualMeanPatchJet','boundActualMeanPatchJets','validateParameterGraph'],
      actualImportedSourceExecuted:true,sourceBaseChanged:false,sourceWaveChanged:false,sourcePressureChanged:false},
    exactSource:{lambda:clone(PINNED_N3.parametersExactExpressions.lambda),h:clone(PINNED_N3.parametersExactExpressions.h),T:clone(PINNED_N3.parametersExactExpressions.T),
      lambdaPositive:true,lambdaUpper:'2^-1000',binary64LambdaInterval:lambdaBound,zeroIsEnclosureEndpointOnly:true,
      a:'Kmean*(2*X0Imean)^(1/2+lambda)/(1+eta^2)',aLower:'Kmean*(2*X0Imean)^(1/2+lambda)/2 > 0',
      x0:'sqrt(2*X0Imean)*exp(1/2)',aOverKmeanX0Power:'a/(Kmean*x0^(1+2lambda))=exp(-1/2-lambda)/(1+eta^2)',
      aOverKmeanX0PowerInterval:baseAmplitudeNormalized,Gq:'0',b:'-epsilon*mConst/R',backgroundPressure:'Retained unchanged; the correction pressure must be newly reconstructed from gr.'},
    profiles:{base:'eta0(x)=x0^-1 exp(-1/[t(1-t)]), t=10*(x/x0-1), 0<t<1',copies:'eta_j(x)=exp(-j/5)*eta0(x*exp(-j/5))',
      azimuthal:[0,1,2],axial:[0,1],supportLogX:[1,supportMax[1]],potentialHullIncluded:true,smoothZeroExtension:true,dExact:'1/5'},
    moments:{powers:['2','-2-2lambda','-2lambda','1','1-2lambda'],intervals:moments,
      restoration:'mu_p = x0^p * normalizedMoment_p; all x0 powers remain exact symbolic nonzero factors',
      method:'Outward interval lower and upper rectangles on the positive compact bump; moment integrals enclosed over all of its support.',panels},
    angular:{rowFactorExpressions:['x0^2 * m_2','2*Kmean*x0^-1*kappa(eta)*m_-2-2lambda','-Kmean*x0*kappa(eta)*m_-2lambda'],
      kappa:'exp(-1/2-lambda)/(1+eta^2)',targets:['0','-Pq','-Jzq'],nodes,inverseIntervals:angularInverse,determinantInterval:angularDeterminant,identityEnclosures:angularRowCheck,
      rowNormalizedInfinityInverseBound:nextUp(Math.max(...angularInverse.map(row=>row.reduce((s,x)=>s+maxabs(x),0))))},
    axial:{rowFactors:['x0*m_1','Kmean*x0^2*kappa(eta)*m_1-2lambda'],r:'-Jthetaq/(a*mu_1-2lambda)',delta:'lambda*theta(lambda)',
      theta:'(1-exp(-2*d*lambda))/lambda',thetaInterval:theta,lambdaTimesCoefficientsPerR:axialScaled,
      exactIdentities:['lambda*s0=r/theta','lambda*s1=-exp(-d)*r/theta','s0+exp(d)*s1=0','s0+exp(d-2*d*lambda)*s1=r'],
      physicalCoefficientRestoration:'s_j=(lambda*s_j)/lambda with the original strictly positive exact lambda; no finite unscaled binary64 value asserted',
      cutoffRemainderExactlyZeroReason:'The field is independent of auxiliary variables and the weighted axial integral is exactly zero; T1 realizes gamma_d exactly by (8.14).'},
    smoothness:{fixedLambdaConstantsAllowed:true,targetClassesNotAssumed:true,derivativeOrder,reciprocalProfileNumerator:derivativePolynomial,derivativeNumeratorL1,
      exactRecurrence:'P_0=1; P_(n+1)=(1+eta^2)P_n\'-2(n+1)eta P_n; D_eta^n(1+eta^2)^-1=P_n/(1+eta^2)^(n+1)',
      allFixedOrderArgument:'The fixed profile support lies in x>0 and 1+eta^2>=1. Distinct angular nodes and positive fixed lambda give smooth inverse entries. Each fixed derivative has finite constants, with lambda-dependence retained.',
      baseRadialDerivativeFormula:'partial_R^n b=(-1)^(n+1) epsilon*mConst*n!*R^(-n-1)'},
    executedSourceJet:sourceJet,executedSourceUniformBound:sourceUniform,
    closedDependency:'The actual inherited base satisfies (8.24), and a fixed supported five-profile map with the original positive lambda and explicit source-scaled inverse bounds is installed.',
    currentFullCurlDefectsComputed:false,arbitraryTargetsPassedAsActualDefects:false,currentVelocityUpdated:false,currentPressureReconstructed:false,completeN6Criterion:false,
    remaining:['Compute gr,P,Jtheta,Jz from the complete current curl-generated velocity before calling the map.','Apply its coefficients to that same state and recompute pressure via (8.12).','Retain every old and new term of (8.26)-(8.27) and attach all required target derivative bounds.']};
}
