/** Exact residual interfaces for the original physical full curls.
 * Averaging is linear. The covariance identities hold pointwise before
 * applying angular/Haar averaging, so no same-label nonlinear term is lost.
 * This generic algebra does not authenticate source fields or invertibility.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const root=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x];
const vector=(G,x,n=3)=>Array.isArray(x)&&x.length===n&&x.every(y=>root(G,y));
const matrix=(G,x)=>Array.isArray(x)&&x.length===3&&x.every(r=>vector(G,r));
const same=(G,a,b,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes,maxTerms:100000});
const add=(G,...xs)=>xs[0].map((_,j)=>G.add(...xs.map(x=>x[j])));
const covariance=(G,u)=>[G.mul(u[0],u[1]),G.mul(u[0],u[2])];
const bilinear=(G,u,v)=>[1,2].map(j=>G.add(G.mul(u[0],v[j]),G.mul(v[0],u[j])));
const advect=(G,u,gradient)=>gradient.map(row=>G.add(...row.map((x,j)=>G.mul(u[j],x))));

export function exactCovarianceResidualExpansion(G,input={}){
  if(!input||Object.keys(input).some(k=>!['primary','previous','linearIncrement','curlRemainder','target'].includes(k)))
    fail('INVALID_INPUT','Retain the primary wave, earlier correction, linear increment, actual curl remainder and two-component target.');
  const {primary:W,previous:E,linearIncrement:P,curlRemainder:R,target:Sigma}=input;
  if(![W,E,P,R].every(v=>vector(G,v))||!vector(G,Sigma,2))fail('INVALID_INPUT','Use complete existing real vector roots.');
  const U=add(G,W,E),V=add(G,P,R),Cbefore=covariance(G,U),Cafter=covariance(G,add(G,U,V)),
    principalBilinear=bilinear(G,W,P),earlierInteraction=bilinear(G,E,P),curlInteraction=bilinear(G,U,R),
    newSquare=covariance(G,V),linearInverseDefect=principalBilinear.map((x,j)=>G.sub(x,Sigma[j])),
    residual=Cafter.map((x,j)=>G.sub(G.sub(G.sub(G.sub(x,Cbefore[j]),Sigma[j]),earlierInteraction[j]),G.add(curlInteraction[j],newSquare[j]))),
    checks=residual.map((x,j)=>same(G,x,linearInverseDefect[j])),
    withoutSquare=residual.map((x,j)=>same(G,G.add(x,newSquare[j]),linearInverseDefect[j])),
    withoutEarlier=residual.map((x,j)=>same(G,G.add(x,earlierInteraction[j]),linearInverseDefect[j]));
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','The actual covariance expansion lost an ordered product.');
  return {schema:'MathScope.ExactCovarianceResidualExpansion/1',U,V,Cbefore,Cafter,principalBilinear,earlierInteraction,curlInteraction,newSquare,linearInverseDefect,residual,checks,
    diagnosticOmissions:{withoutSquare,withoutEarlier},
    identity:'C(U+V)-C(U)-Sigma-B(E,P)-B(U,R)-C(V)=B(W,P)-Sigma, U=W+E, V=P+R.',
    averaging:'The same identity holds after normalized angular and Haar averages. Only after the SAME source proves averaged B(W,P)=Sigma does the right side vanish. Different-label support separation does not remove same-label squares.',
    allOrderedCrossProductsRetained:true,newIncrementSquareRetained:true,previousCorrectionRetained:true,unprovedLinearInverseDefectRetained:true,
    fullPhysicalCovarianceEqualsPrincipalTarget:false,sourceAuthenticated:false,pass:true};
}

/** Signed linear covariance inverse. Nonzero det(H) and positive a_j are
 * explicit premises. Sigma may have either sign; no positivity constraint
 * on a new stress increment is introduced.
 */
export function exactSignedCovarianceInverse(G,input={}){
  if(!input||Object.keys(input).some(k=>!['H','amplitudes','epsilon','target'].includes(k)))
    fail('INVALID_INPUT','Use the complete original H, fixed amplitudes, epsilon and signed target.');
  const {H,amplitudes:a,epsilon,target:Sigma}=input;
  if(!Array.isArray(H)||H.length!==2||H.some(r=>!vector(G,r,2))||!vector(G,a,2)||!vector(G,Sigma,2)||!root(G,epsilon))
    fail('INVALID_INPUT','Retain a two-by-two covariance matrix and two scalar amplitudes.');
  const det=G.sub(G.mul(H[0][0],H[1][1]),G.mul(H[0][1],H[1][0])),
    rhs=Sigma.map(x=>G.div(x,epsilon)),dSigma=[G.div(G.sub(G.mul(H[1][1],rhs[0]),G.mul(H[0][1],rhs[1])),det),
      G.div(G.sub(G.mul(H[0][0],rhs[1]),G.mul(H[1][0],rhs[0])),det)],
    deltaAmplitude=dSigma.map((x,j)=>G.div(x,G.mul(G.q(2),a[j]))),
    cross=H.map(row=>G.mul(epsilon,G.add(...row.map((x,j)=>G.mul(x,G.q(2),a[j],deltaAmplitude[j]))))),
    square=H.map(row=>G.mul(epsilon,G.add(...row.map((x,j)=>G.mul(x,G.pow(deltaAmplitude[j],2)))))),
    checks=cross.map((x,j)=>same(G,x,Sigma[j],H.flat())),
    omittedHalf=H.map(row=>G.mul(epsilon,G.add(...row.map((x,j)=>G.mul(x,G.q(2),a[j],G.div(dSigma[j],a[j]))))));
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','The signed covariance inverse lost its fixed amplitude or real-harmonic factor2.');
  return {schema:'MathScope.ExactSignedCovarianceInverse/1',H,a,epsilon,Sigma,det,dSigma,deltaAmplitude,cross,square,checks,
    diagnosticOmissions:{omittedHalf:omittedHalf.map((x,j)=>same(G,x,Sigma[j],H.flat()))},
    premises:'epsilon>0, det(H)!=0, original fixed a_plus,a_minus>0 on the open shell. H includes the original cosine1/2 and original Haar/cutoff integral factors.',
    formula:'dSigma=H^-1(Sigma/epsilon); delta_a_j=dSigma_j/(2*a_j); averaged B(W0,L Sigma)=Sigma; C(L Sigma)=epsilon*H*(delta_a)^2 is retained.',
    targetMayHaveEitherSign:true,originalPositiveAmplitudesRemainFixed:true,quadraticRemainderRetained:true,
    smoothEdgeExtensionProvedHere:false,sourceAuthenticated:false,pass:true};
}

/** Physical Cartesian NS residual in the convention gradient[i][j]=D_j u_i.
 * Source adapters pass derivatives already materialized from the exact
 * potential and original physical map; no numerical differences are used.
 */
export function exactPhysicalMomentumSplit(G,input={}){
  const keys=['background','backgroundGradient','backgroundTime','backgroundLaplacian','backgroundPressureGradient',
    'wave','waveGradient','waveTime','waveLaplacian','wavePressureGradient'];
  if(!input||Object.keys(input).some(k=>!keys.includes(k))||keys.some(k=>input[k]===undefined))fail('INVALID_INPUT','Retain all original Cartesian momentum operands.');
  for(const k of keys)if(k.endsWith('Gradient')&&!k.endsWith('PressureGradient')?!matrix(G,input[k]):!vector(G,input[k]))
    fail('INVALID_INPUT','A Cartesian residual operand is incomplete: '+k);
  const {background:u,backgroundGradient:Du,backgroundTime:ut,backgroundLaplacian:Lu,backgroundPressureGradient:Dp,
    wave:w,waveGradient:Dw,waveTime:wt,waveLaplacian:Lw,wavePressureGradient:Dpi}=input,
    totalVelocity=add(G,u,w),totalGradient=Du.map((row,i)=>row.map((x,j)=>G.add(x,Dw[i][j]))),
    totalAdvection=advect(G,totalVelocity,totalGradient),baseAdvection=advect(G,u,Du),
    backgroundTransportsWave=advect(G,u,Dw),waveTransportsBackground=advect(G,w,Du),waveSelfAdvection=advect(G,w,Dw),
    total=ut.map((x,j)=>G.add(x,wt[j],totalAdvection[j],G.neg(Lu[j]),G.neg(Lw[j]),Dp[j],Dpi[j])),
    background=ut.map((x,j)=>G.add(x,baseAdvection[j],G.neg(Lu[j]),Dp[j])),
    linear=wt.map((x,j)=>G.add(x,backgroundTransportsWave[j],waveTransportsBackground[j],G.neg(Lw[j]),Dpi[j])),
    retainedSplit=add(G,background,linear,waveSelfAdvection),checks=total.map((x,j)=>same(G,x,retainedSplit[j]));
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','The physical NS residual expansion lost a transport or pressure term.');
  return {schema:'MathScope.ExactPhysicalMomentumSplit/1',totalVelocity,totalGradient,total,background,linear,
    backgroundTransportsWave,waveTransportsBackground,waveSelfAdvection,retainedSplit,checks,
    identity:'R(u+w,p+pi)=R(u,p)+[w_t+(u.grad)w+(w.grad)u-Delta w+grad pi]+(w.grad)w.',
    gradientConvention:'gradient[component][direction]',pressureAndAllTransportTermsRetained:true,
    residualDeclaredZero:false,residualDeclaredFlat:false,sourceAuthenticated:false,pass:true};
}

export function originalPhysicalResidualAlgebraAudit(){
  const G=new ActualConvergentExpressions(),vec=name=>[0,1,2].map(j=>G.fresh(name+'_'+j)),mat=name=>[0,1,2].map(j=>vec(name+'_'+j)),
    covariance=exactCovarianceResidualExpansion(G,{primary:vec('W0'),previous:vec('E'),linearIncrement:vec('LSigma'),curlRemainder:vec('Rcurl'),target:vec('Sigma').slice(0,2)}),
    signed=exactSignedCovarianceInverse(G,{H:[[G.fresh('H00'),G.fresh('H01')],[G.fresh('H10'),G.fresh('H11')]],amplitudes:vec('fixed_a').slice(0,2),epsilon:G.fresh('epsilon'),target:vec('signed_Sigma').slice(0,2)}),
    momentum=exactPhysicalMomentumSplit(G,{background:vec('u'),backgroundGradient:mat('Du'),backgroundTime:vec('ut'),backgroundLaplacian:vec('Lu'),backgroundPressureGradient:vec('Dp'),
      wave:vec('w'),waveGradient:mat('Dw'),waveTime:vec('wt'),waveLaplacian:vec('Lw'),wavePressureGradient:vec('Dpi')}),
    negatives=[...covariance.diagnosticOmissions.withoutSquare,...covariance.diagnosticOmissions.withoutEarlier,...signed.diagnosticOmissions.omittedHalf];
  if(negatives.some(c=>c.pass))fail('INTERNAL_VALIDATION','A deleted original quadratic, earlier-correction or half-factor term was not detected.');
  return {schema:'MathScope.OriginalPhysicalResidualAlgebraAudit/1',covariance,signed,momentum,pass:true,
    sourceAuthenticated:false,allLabelsAuthenticated:false,actualResidualFlatnessProved:false,m3Started:false};
}
