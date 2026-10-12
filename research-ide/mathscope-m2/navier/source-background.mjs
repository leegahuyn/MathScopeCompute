import {iadd,isub,imul,idiv,iscale,ilog,iexp,point} from '../../mathscope-m1/navier/numerics.mjs';
import {getPinnedSourceProfile,SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';

const bad=(code,message)=>{throw Object.assign(Error(message),{code});};
const finite=(x,name,lo,hi)=>{if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)bad('INVALID_INPUT',name+' is outside the installed finite operator domain.');return x;};
const zeroMatrix=()=>Array.from({length:6},()=>Array(6).fill('0'));

/** The source system (5.7), with complete regular coefficient expressions. */
export function sourcePicardSystem(n=1){
  if(!Number.isSafeInteger(n)||n<1||n>8)bad('INVALID_INPUT','n must be an integer in 1..8.');
  const A0=zeroMatrix(),A1=zeroMatrix();
  A0[0][4]='1';A0[1][5]='1';A0[2][5]='-1';A0[3][0]='4*xi*phi0/C^2';
  A0[4][0]='2*(beta*(-1+2*eta*U0)/L+V0/X)';
  A0[4][1]='4*eta*(A-lambda_n)*Hphi/L+2*Z_(-A-1/2)(phi0)';
  A0[4][2]='-4*eta*(D+lambda_n)*Hphi/L';
  A0[4][4]='xi/L+xi*(V0/X)-2*eta*xi*U0/L';
  A0[5][0]='-8*eta*X*phi0/(L*C^2)';
  A0[5][1]='2*gamma*(-1+2*eta*U0)/L+4*eta*(A-lambda_n)*HU/L+2*Z_(-A)(U0)';
  A0[5][2]='-4*eta*(D+lambda_n)*HU/L';
  A0[5][3]='4*delta*eta/L';A0[5][5]=A0[4][4];
  A1[4][0]='2*(D*eta+d*U0)/L';A1[4][1]=A1[4][2]='-2*d*Hphi/L';
  A1[5][1]='2*(D*eta+d*U0-d*HU)/L';A1[5][2]='-2*d*HU/L';A1[5][3]='2*d/L';
  const mask=A1.map(r=>r.map(x=>x!=='0')),nilpotentProducts=[];
  for(let i=0;i<6;i++)for(let j=0;j<6;j++){const paths=[];for(let k=0;k<6;k++)if(mask[i][k]&&mask[k][j])paths.push(k);nilpotentProducts.push({row:i+1,column:j+1,possibleDiagonalKernelPaths:paths});}
  return {schema:'MathScope.SourceSixComponentPicardSystem/1',n,sourceProfile:SOURCE_PROFILE_ID,sourceEquations:['5.2','5.3','5.4','5.5','5.6','5.7','5.8'],coordinates:['phi_n','U_n','K_n','Pi_n','partial_xi phi_n','partial_xi U_n'],axisDatum:[0,0,0,0,0,0],singularDiagonal:[0,0,2,0,3,1],definitions:{X:'xi^2',K_n:'A_X(U_n)-U_n',lambda_n:'2*n*h',beta:'-A-1/2+lambda_n',gamma:'-A+lambda_n',delta:'-2*A+lambda_n',Hphi:'phi0+X*partial_X phi0',HU:'X*partial_X U0',knownPressureSource:'pKnown=C^-2*sum_(1<=i,j<n;i+j=n)(phi_i*phi_j)-Omega_(n-1)/(2X)'},A0,A1,forcing:['0','0','0','2*xi*pKnown','2*(known angular transport - Z_(-A-1/2+lambda_(n-1)-D) Z_(-A-1/2+lambda_(n-1)) phi_(n-1))','2*(known axial transport - Z_(-A+lambda_(n-1)-D) Z_(-A+lambda_(n-1)) U_(n-1) - 2*eta*X*pKnown/L)'],regularity:{V0OverXi:'xi*(V0/X); V0/X is smooth from (5.2)',pressureRowSubstitutedIntoAxial:true,zeroAxisData:true,diagonalInverse:'(Gg)_i(xi)=xi*integral_0^1 t^c_i*g_i(t*xi) dt',axisParity:['even','even','even','even','odd','odd']},blockCertificate:{A1Maps:'first four coordinates into last two',A1Kills:'last two coordinates',nilpotentProducts,allDiagonalKernelProductsVanish:nilpotentProducts.every(x=>x.possibleDiagonalKernelPaths.length===0),parameterDerivativesPreserveMask:true,maximumEtaDerivatives:'ceil(k/2)'},commonDomain:{aExact:'sqrt(Xa*exp(t1/16))',archivedOrdering:'X_an=Xa*exp(t1/16) < X_modulation_left=Xa*exp(t1/8) < Xa*exp(t1/4)',positiveOrderCutoffOrdering:'X_minus=Xa*exp(t1/128) < X_keep=Xa*exp(t1/64) < X_cut=Xa*exp(t1/32) < a^2=Xa*exp(t1/16)',notationGuard:'The positive-order X_minus is a new point inside the analytic activation collar; it is not the archived modulation interval endpoint.',sourceFile:'followup-20261010-final-stress-audit/ACTIVATION_COLLAR_BOUNDS_EN.md',sourceSha256:'2035fa202134d7ca0affcad7ad7aafbb05e3508fde3a5f34a3f2cea6fd003750',independentOfOrder:true,parameterStripNumericRadius:null,CnForActualProfile:null},sameProfileCoefficientsSolved:false};
}

/** Rigorous scalar tail for (5.8), conditional on explicitly supplied bounds. */
export function picardTailBound(input={}){
  const Cn=finite(input.Cn??.5,'Cn',1e-8,1e4),a=finite(input.a??.25,'a',1e-8,4),rho=finite(input.rho??.5,'rho',.0002,4),rhoPrime=finite(input.rhoPrime??.25,'rhoPrime',.0001,4),K=finite(input.terms??16,'terms',2,512);
  if(!Number.isSafeInteger(K)||rhoPrime>=rho)bad('INVALID_INPUT','Use integer terms and 0<rhoPrime<rho.');
  const delta=isub(point(rho),point(rhoPrime)),A=imul(point(Cn),point(a));
  if(K<2*Math.ceil(delta[1]))bad('INVALID_INPUT','The tail start must be at least 2*ceil(rho-rhoPrime).');
  const ratio=idiv(iscale(imul(A,A),3),iscale(delta,2*(K+2)));
  if(ratio[1]>=1)bad('PRECISION_REQUIRED','The two-parity geometric tail needs more terms; the common radial interval is never silently reduced.');
  const logTerm=k=>{const p=Math.ceil(k/2);let logFactorial=point(0);for(let j=2;j<=k+1;j++)logFactorial=iadd(logFactorial,ilog(point(j)));const pd=idiv(point(p),delta),base=[Math.max(1,pd[0]),Math.max(1,pd[1])];return iadd(isub(iscale(ilog(A),k+1),logFactorial),iscale(ilog(base),p));};
  const rows=Array.from({length:K+2},(_,k)=>({k,maximumEtaDerivatives:Math.ceil(k/2),logTermBound:logTerm(k)})),b0=rows[K].logTermBound,b1=rows[K+1].logTermBound,anchor=Math.max(b0[1],b1[1]),logSum=iadd(point(anchor),ilog(iadd(iexp(isub(b0,point(anchor))),iexp(isub(b1,point(anchor))))));
  const tail=isub(logSum,ilog(isub(point(1),ratio)));
  return {schema:'MathScope.PicardScalarTail/1',parameters:{Cn,a,rho,rhoPrime,terms:K},cauchyRadiusLoss:delta,rows,tailFrom:K,logTailBound:tail,parityRatioUpper:ratio,tailFormula:'sum_(k>=K) B_k <= (B_K+B_(K+1))/(1-r); r=3*(Cn*a)^2/(2*Delta*(K+2))',ratioDerivation:'(1+1/p)^p<e<3, p=ceil(k/2), bounds B_(k+2)/B_k for both parities.',commonIntervalUnchanged:true,constantProvenance:'EXPLICIT_OPERATOR_PROBE_BOUNDS; not derived from the pinned N3 coefficient functions',sourceCnBoundProven:false,actualProfileSolutionEnclosed:false,pass:tail.every(Number.isFinite)&&ratio[1]<1};
}

export function backgroundPicardComponent(input={}){assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID);return {sourceProfile:getPinnedSourceProfile(),system:sourcePicardSystem(input.n??1),tail:picardTailBound(input),solutionState:'SOURCE_OPERATOR_AND_CONDITIONAL_TAIL_IMPLEMENTED; ACTUAL_PROFILE_SOURCE_NORMS_NOT_COMPUTED',nextOrderAllowed:false};}

const det2=A=>isub(imul(A[0][0],A[1][1]),imul(A[0][1],A[1][0]));
function determinant(A){if(A.length===2)return det2(A);return iadd(isub(imul(A[0][0],det2([[A[1][1],A[1][2]],[A[2][1],A[2][2]]])),imul(A[0][1],det2([[A[1][0],A[1][2]],[A[2][0],A[2][2]]]))),imul(A[0][2],det2([[A[1][0],A[1][1]],[A[2][0],A[2][1]]])));}
function cramer(A,b){const det=determinant(A);if(det[0]<=0&&det[1]>=0)bad('PRECISION_REQUIRED','The interval moment matrix determinant contains zero.');return {determinant:det,solution:A.map((_,j)=>idiv(determinant(A.map((row,i)=>row.map((x,k)=>j===k?b[i]:x))),det))};}

/** Source (5.16) retains the extremely small exact lambda by a confluent row. */
export function sourceMomentOperator(input={}){
  assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID);const n=input.n??1;if(!Number.isSafeInteger(n)||n<1||n>8)bad('INVALID_INPUT','n must be in 1..8.');
  const width=1/4096,centers=[1.5,2,2.5,3,3.5],intervals=centers.map(c=>[c-width,c+width]),lambda=[0,2**-1000],weights=x=>{const L=ilog(x),decay=iexp(iscale(imul(lambda,L),-2)),logWeight=imul(x,isub(L,imul(lambda,imul(L,L))));return {u:[x,[logWeight[0],imul(x,L)[1]]],e:[imul(x,x),imul(idiv(point(1),imul(x,x)),decay),decay]};},U=Array.from({length:2},(_,i)=>intervals.slice(0,2).map(x=>weights(x).u[i])),E=Array.from({length:3},(_,i)=>intervals.slice(2).map(x=>weights(x).e[i]));
  const debts=input.normalizedDebts??[1,-.25,.125,-.5,.375];if(!Array.isArray(debts)||debts.length!==5)bad('INVALID_INPUT','normalizedDebts requires five finite operator-probe values.');debts.forEach((v,i)=>finite(v,'debt['+i+']',-1e4,1e4));
  const uSolve=cramer(U,debts.slice(0,2).map(v=>point(-v))),eSolve=cramer(E,debts.slice(2).map(v=>point(-v))),profile=getPinnedSourceProfile();
  return {schema:'MathScope.SourceConfluentMomentOperator/1',n,sourceProfile:profile,sourceEquations:['5.10','5.11','5.12','5.14','5.15','5.16'],lambda:{exactExpression:profile.parametersExactExpressions.lambda,strictlyPositive:true,enclosure:lambda,lowerEndpointIsNotSubstitution:true},sourcePatch:{name:'Ipos',XLeft:profile.parametersExactExpressions.X0Ipos,XRight:profile.parametersExactExpressions.IposRight,normalizedR:'x=R/sqrt(2*X0Ipos)',supportedStrictlyInside:'1<x<exp(5/2)',radialBase:'Rbase=sqrt(2*X0Ipos)'},bumps:intervals.map((support,i)=>({id:i<2?'U'+(i+1):'E'+(i-1),normalizedSupport:support,smoothDefinition:'b(x)=Z^-1*exp(-1/(1-((x-center)/width)^2)) for |x-center|<width; 0 otherwise',center:centers[i],width,integral:1,massNormalization:'Z is the exact positive integral; matrix enclosures use monotone weight extrema, not sampled quadrature.'})),matrices:{normalizedConfluentU:U,normalizedE:E},rowTransform:{originalUExponents:['1','1-2*lambda'],newUWeights:['x','x*(1-x^(-2*lambda))/(2*lambda)'],identity:'row2new=(row1-row2old)/(2*lambda)',physicalRowScaling:['Rbase','Rbase^(1-2*lambda)','Rbase^2','Rbase^(-2-2*lambda)','Rbase^(-2*lambda)'],transformedDebts:'The supplied first two debts are already transformed and physically normalized. They are not the unevaluated source m_n^0.',confluentWeightBound:'x*(log(x)-lambda*log(x)^2) <= x*(1-x^(-2*lambda))/(2*lambda) <= x*log(x)',noLambdaZeroSubstitution:true},normalizedDebts:debts,uSolve,eSolve,sourceMomentDebtsEvaluated:false,actualMomentCorrectionsApplied:false,nextOrderAllowed:false,stressSupport:{n1:'[X_minus,X_b]',nAtLeast2:'[X_minus,X_plus]',differentSupportsPreserved:true,requiresAllFiveMoments:true},scope:'A certified finite-dimensional moment repair operator on the actual reserved source patch and actual lambda. The actual five incoming moment functions and their derivatives remain uncomputed.',pass:!(uSolve.determinant[0]<=0&&uSolve.determinant[1]>=0)&&!(eSolve.determinant[0]<=0&&eSolve.determinant[1]>=0)};
}
