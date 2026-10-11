/** Exact inverse-torus and three-component value lemmas.
 * These routines are conditional mathematics. Only the separate private
 * common-source adapter may certify an actual point or source interval.
 */
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {centeredPulseNumericalRequest,encloseCenteredPulseCoefficients} from './actual-centered-pulse-enclosure-kernel.mjs';
import {adiabaticPulseCenterControls,encloseAdiabaticPulseCenters} from './actual-adiabatic-pulse-center-kernel.mjs';
import {directedArithmetic,rational as Q,readRational,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {ORIGINAL_RADIAL_PHASE_SPECIFICATION} from './source-radial-phase-exponent.mjs';

const root=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x];
const dot=(G,a,b)=>G.add(...a.map((x,j)=>G.mul(x,b[j])));
const cross=(G,a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))];

/** A finite, exact reserve for coordinate displacement and its later
 * fixed-order estimates. No original exponential is evaluated as zero.
 */
export function physicalCenterFrequencyAudit({power=16384,bits=16384}={}){
  if(!Number.isSafeInteger(power)||power<1||power>1000000||!Number.isSafeInteger(bits)||bits<1||bits>1000000)
    fail('INVALID_INPUT','Use finite positive power and dyadic remainder orders through one million.');
  const left=512n*(1n<<2048n),right=200000n*(16n*BigInt(power)+BigInt(bits)),rows=[
    {id:'positive-radial-exponent-lower',left:'196',relation:'>',right:'162',pass:196n>162n},
    {id:'original-radial-margin-below-half',left:'2',relation:'<',right:'100000',pass:2n<100000n},
    {id:'radial-exponent-upper',left:'17/8',relation:'<',right:'3',pass:17n<24n},
    {id:'strong-band-beats-polynomial-and-positive-dyadic-remainder',left:String(left),relation:'>',right:String(right),pass:left>right},
    {id:'source-norm-absorbs-displacement-constants',left:'64',relation:'<',right:String(1n<<128n),pass:64n<(1n<<128n)},
    {id:'same-box-offset-remains-inside-original-support',left:'9/16',relation:'<',right:'3/4',pass:9n<12n},
    {id:'terminal-neighborhood-stays-away-from-both-ends',left:'3/16',relation:'>',right:'0',pass:3n>0n}
  ];
  return {schema:'MathScope.PhysicalCenterFrequencyAudit/1',power,bits,rows,pass:rows.every(r=>r.pass),
    hypotheses:{h:'0<h<2^-4096',ell:'ell >= (64/h)^2',S:'S=ell^2',epsilon:'epsilon=2^(-h*ell)',
      radialExponent:'dr='+ORIGINAL_RADIAL_PHASE_SPECIFICATION.formula,radialRatio:ORIGINAL_RADIAL_PHASE_SPECIFICATION.rho,
      radialMargin:'kappa_s='+ORIGINAL_RADIAL_PHASE_SPECIFICATION.kappa,sourceNorm:'B>=2^128, S>=B^1024'},
    conclusion:'epsilon^(1/200000)*S^'+power+' < 2^-'+bits,
    proof:{logarithm:'Set t=ell^(1/4)>1. log(ell)=4log(t)<4t and log2>1/2 give log2(ell)<8t.',
      strongBand:'h*ell/t=h*ell^(3/4)>=512/sqrt(h)>512*2^2048. The displayed exact integer inequality therefore gives h*ell/200000>16*power*t+bits*t.',
      dyadic:'2*power*log2(ell)<16*power*t and t>1. Subtract these exponents without rounding epsilon or h to zero.',
      radial:'Lambda^2>Tg follows from 14>9sqrt(2), checked by196>162. Thus1/2<rho<1. With original kappa_s=1/100000<1/2, dr-1=(2*rho-1)+2*h*(rho-kappa_s)>0; dr<2*(1+h)<17/8<3.',
      inverseMap:'For the original palette floor write i=(-(1+h)*log(Q)-log(S))/log(Tg)-theta, 0<=theta<1. Original (6.2) gives M_i=Lambda^i*Q^(dr/2)=Lambda^(-theta)*epsilon^(-kappa_s)*S^(-rho)>epsilon^(-kappa_s)/(3*S)>=epsilon^(-1/200000)/(3*S). At B^-1<Rstar<B, a nearest torus-center lift changes each projected coordinate by <1. Its positive radial inverse remains in (Rstar/2,2Rstar), where the radial derivative exceeds epsilon^(-1/200000)/(12*B^2*S). The weaker exponent retained in this bound does not redefine the original dr.',
      displacement:'|Rsharp-Rstar|<12*B^2*S*epsilon^(1/200000); |Tsharp-1|<6*S*epsilon. Hence |log(Xsharp/Xstar)|<64*B^3*S*epsilon^(1/200000), and every mesh offset changes by <S^5*epsilon^(1/200000).',
      neighborhood:'These positive bounds are <2^-bits when power>=5. The source adapter must separately bind B, ell, source radius, palette, original supports and representative choice.'},
    positiveErrorUpper:'1/'+String(1n<<BigInt(bits)),sourceAuthenticated:false,hReplacedByZero:false};
}

/** Invert the ORIGINAL band map at a lattice lift of a specified palette
 * center. Positivity of the projected radial coordinate is NOT guessed;
 * it is a separate hypothesis discharged by the source frequency lemma.
 */
export function exactInversePhysicalTorusCenter(G,input){
  const names=['Q','Lambda','Tg','paletteIndex','dr','Dgeom','basis','center','anchorYi'];
  if(!G||!input||Object.keys(input).some(k=>!names.includes(k))||names.slice(0,6).some(k=>!root(G,input[k]))||
    input.basis?.length!==2||input.basis.some(a=>a?.length!==2||a.some(x=>!root(G,x)))||
    ['center','anchorYi'].some(k=>input[k]?.length!==2||input[k].some(x=>!root(G,x))))
    fail('INVALID_INPUT','Use every retained original band map operand and the two center/anchor coordinates.');
  const {Q:bandQ,Lambda,Tg,paletteIndex:i,dr,Dgeom,basis,center,anchorYi}=input,q=(n,d=1)=>G.q(n,d),s2=G.sqrt(q(2)),
    expectedBasis=[[G.one,G.sub(G.one,s2)],[G.sub(s2,G.one),G.one]],expectedD=G.sub(q(4),G.mul(q(2),s2));
  if(JSON.stringify(basis)!==JSON.stringify(expectedBasis)||Dgeom!==expectedD||Lambda!==G.sub(q(4),s2)||Tg!==G.add(q(4),s2))
    fail('INVALID_SOURCE_CONSTRUCTION','The actual original orthogonal quadratic basis and eigenvalues are required.');
  const power=(x,a)=>G.exp(G.mul(a,G.log(x))),floor=x=>G.neg(G.ceiling(G.neg(x))),
    copy=anchorYi.map((x,j)=>floor(G.add(G.sub(x,center[j]),q(1,2)))),lift=center.map((x,j)=>G.add(x,copy[j])),
    radialCoordinate=G.div(dot(G,basis[0],lift),Dgeom),timeCoordinate=G.div(dot(G,basis[1],lift),Dgeom),
    radialMultiplier=power(Lambda,i),timeMultiplier=power(Tg,i),
    physicalR=power(G.div(radialCoordinate,radialMultiplier),G.inv(dr)),physicalTime=G.div(timeCoordinate,timeMultiplier),
    slowT=G.div(G.sub(G.one,physicalTime),bandQ),rawSlowR=G.div(physicalR,G.sqrt(bandQ)),
    profileX=G.div(G.pow(rawSlowR,2),G.mul(q(2),slowT)),slowR=G.sqrt(G.mul(q(2),slowT,profileX)),
    reconstructed=lift.map((_,j)=>G.add(G.mul(basis[0][j],radialCoordinate),G.mul(basis[1][j],timeCoordinate))),
    quadraticRelation=G.sub(G.pow(s2,2),q(2)),reconstructionChecks=reconstructed.map((x,j)=>sourceGraphRationalIdentity(G,
      G.sub(G.sub(x,lift[j]),G.div(G.mul(quadraticRelation,lift[j]),Dgeom)),{atomicNodes:lift,maxTerms:10000})),
    timeIdentity=sourceGraphRationalIdentity(G,G.sub(G.sub(G.one,G.mul(bandQ,slowT)),physicalTime),{atomicNodes:[physicalTime,bandQ],maxTerms:10000}),
    radiusSquareIdentity=sourceGraphRationalIdentity(G,G.sub(G.mul(q(2),slowT,profileX),G.pow(rawSlowR,2)),{atomicNodes:[slowT,rawSlowR],maxTerms:10000});
  if(!reconstructionChecks.every(r=>r.pass)||!timeIdentity.pass||!radiusSquareIdentity.pass)fail('INTERNAL_VALIDATION','An exact inverse-map algebra identity failed.');
  return {schema:'MathScope.ExactInversePhysicalTorusCenter/1',input:{...input},copy,lift,radialCoordinate,timeCoordinate,radialMultiplier,timeMultiplier,
    physical:{r:physicalR,z:G.zero,t:physicalTime},slow:{R:slowR,Z:G.zero,T:slowT},profile:{X:profileX,eta:G.zero,s:slowT},rawSlowR,
    reconstructed,reconstructionChecks,timeIdentity,radiusSquareIdentity,
    positiveRealRules:{required:['Q>0','dr>0','radialCoordinate>0','slowT>0'],
      radial:'r=exp(log(radialCoordinate/Lambda^i)/dr)>0. Hence Lambda^i*r^dr=radialCoordinate exactly by the real exp/log inverse law.',
      normalizedRadius:'The positive square root sqrt(2*Tsharp*Xsharp) equals rawSlowR>0 by radiusSquareIdentity, so sqrt(Q)*Rsharp=r.',
      quadratic:'sqrt(2)^2=2. Each displayed reconstruction residual is exactly (sqrt(2)^2-2)*lift_j/Dgeom.',
      nearestLift:'copy_j is an integer floor. At the reconstructed center, floor(Yi_j-center_j+1/2)=floor(copy_j+1/2)=copy_j; the original local offset is exactly zero.',
      chart:'At Z=0 the original implicit equation s-Z^2*s^(2h)-T=0 is s-T=0. Its certified unique root is Tsharp, so X=Rsharp^2/(2*Tsharp)=Xsharp.'},
    sourceAuthenticated:false,positiveRadialCoordinateProvedHere:false,physicalSourceMembershipProvedHere:false,pass:true};
}

/** Retain the coefficient-curl term. It vanishes in VALUE at an exact
 * zero phase; no derivative of it or nonlinear residual is set to zero.
 */
export function physicalCenterCurlAlgebra(G){
  const n=[0,1,2].map(j=>G.fresh('physical_center_normal_'+j)),t=[0,1,2].map(j=>G.fresh('physical_center_amplitude_'+j)),
    a=G.fresh('physical_center_positive_prefactor'),k=G.fresh('physical_center_nonzero_integer'),n2=dot(G,n,n),nt=dot(G,n,t),
    C=cross(G,n,t).map(x=>G.div(G.mul(a,x),G.mul(k,n2))),leading=cross(G,n,C).map(x=>G.neg(G.mul(k,x))),
    projected=t.map((x,j)=>G.mul(a,G.sub(x,G.div(G.mul(n[j],nt),n2)))),
    checks=leading.map((x,j)=>sourceGraphRationalIdentity(G,G.sub(x,projected[j]),{maxTerms:10000})),
    missingComponent=sourceGraphRationalIdentity(G,G.sub(leading[0],G.mul(a,t[0])),{maxTerms:10000});
  return {schema:'MathScope.PhysicalCenterCurlAlgebra/1',n,t,a,k,n2,normalConstraint:nt,coefficient:C,leading,projected,checks,
    exactFormula:'curl_star(-C*sin(k*Phi))=-k*(grad_star(Phi) cross C)*cos(k*Phi)-curl_star(C)*sin(k*Phi).',
    valueAtZeroPhase:'Under grad_star(Phi)=n and n dot t=0, Phi=0 gives curl_star(-C*sin(k*Phi))=a*t.',
    negativeControl:{omitted:'normal constraint',check:missingComponent,correctlyRejected:!missingComponent.pass},
    derivativesOfCurlRemainderDiscarded:false,nonlinearResidualDiscarded:false,sourceAuthenticated:false,
    pass:checks.every(x=>x.pass)&&!missingComponent.pass};
}

/** Literal original cutoffs plus their exact center plateau.  The source
 * expression interpreter intentionally retains source_step_derivative(6,0),
 * so numerical-node equality with1 is neither necessary nor sufficient.
 * Keep the original function value and certify the two arguments and the
 * original sigma(x)=1 for x>=1 law separately.
 */
export function physicalCenterCutoffPlateauAudit(G,input){
  const names=['chi','psi','xi','v','Ls','r0'];
  if(!input||Object.keys(input).some(k=>!names.includes(k))||names.some(k=>!root(G,input[k])))
    fail('INVALID_INPUT','Use the retained original transverse/longitudinal cutoff bodies and their own variables and scales.');
  const {chi,psi,xi,v,Ls,r0}=input,q=(n,d=1)=>G.q(n,d),a=G.sqrt(G.pow(G.div(xi,r0),2)),
    expectedChi=G.choose(a,q(1,4),q(3,4),G.one,G.step(G.sub(q(3,2),G.mul(q(2),a))),G.zero),
    argumentsOriginal=[G.sub(G.div(G.mul(q(20),v),Ls),q(4)),G.sub(q(16),G.div(G.mul(q(20),v),Ls))],
    expectedPsi=G.mul(...argumentsOriginal.map(x=>G.step(x))),center=G.div(Ls,q(2)),chiAt=G.substitute(chi,xi,G.zero),
    argumentsAt=argumentsOriginal.map(x=>G.substitute(x,v,center)),psiAt=G.substitute(psi,v,center),
    argumentChecks=argumentsAt.map(x=>sourceGraphRationalIdentity(G,G.sub(x,q(6)),{atomicNodes:[Ls],maxTerms:10000})),
    checks=[{id:'literal-original-cutoff-bodies',pass:chi===expectedChi&&psi===expectedPsi},
      {id:'actual-transverse-center-on-constant-branch',pass:chiAt===G.one},
      {id:'both-actual-longitudinal-arguments-equal-six',pass:argumentChecks.every(x=>x.pass)},
      {id:'original-sigma-constant-one-branch',pass:argumentsOriginal.every(x=>{const node=G.nodes[G.step(x)];return node.op==='source_step_derivative'&&node.args[0]===x&&node.args[1]===0;})&&6>=1}];
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The retained original cutoff plateau did not bind: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return {schema:'MathScope.ExactPhysicalCenterCutoffPlateau/1',input,center,chiAt,psiAt,argumentsOriginal,argumentsAt,argumentChecks,checks,
    evaluatedValues:{chi:G.one,psi:G.one},originalPsiValueReplaced:false,
    proof:'At the proved center v=Ls/2 with original Ls>0, both retained step arguments are exactly6. The original source sigma has value1 on[1,infinity); thus their unchanged product equals1. Xi=0 is on the original chi constant branch. Every original body and actual value node is retained.',
    requiresPositiveOriginalLength:true,sourceAuthenticated:false,pass:true};
}

/** Three signed cylindrical components, H columns and weights, each with
 * its own explicit positive source scale. The numerical values use no
 * point from an old certificate; the adapter proves the hypotheses anew.
 */
export function enclosePhysicalCenterCoefficients(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance','centerTolerance','maxCutoffCells'].includes(k)))
    fail('INVALID_INPUT','Only directed precision, exact tolerances and the finite cutoff quadrature budget are inputs.');
  const {centerTolerance='1/10000000000000000000000000000000000000000',...rest}=input,request=centeredPulseNumericalRequest(rest),
    centerControls=adiabaticPulseCenterControls({precisionBits:request.precisionBits,tolerance:centerTolerance}),
    centered=encloseCenteredPulseCoefficients(request,context),absolute=encloseAdiabaticPulseCenters(centerControls),A=directedArithmetic(request.precisionBits),
    center=A.unpack(absolute.values.center),center2=A.unpack(absolute.values.centerSquared),inverse2=A.unpack(absolute.values.inverseCenterSquared),
    component=A.mul(center,A.widen(A.one(),Q(1,1n<<8192n))),
    values={pulseCylindrical:[1,-1].map(sign=>[component,component,sign===1?component:A.neg(component)].map(x=>A.pack(x))),
      weightedCylindrical:[1,-1].map((sign,i)=>{const w=A.unpack(centered.values.normalizedWeightedAmplitude[i]);return [w,w,sign===1?w:A.neg(w)].map(x=>A.pack(x));}),
      covariance: [centered.values.normalizedCovarianceTheta,centered.values.normalizedCovarianceZ].map(row=>row.map(x=>A.pack(A.mul(center2,A.unpack(x))))),
      weights:centered.values.normalizedInverseWeight.map(x=>A.pack(A.mul(inverse2,A.unpack(x)))),
      centers:[A.pack(center),A.pack(center)],mass:[1,2].map(()=>A.pack(A.mul(center2,A.unpack(centered.values.normalizedMass))))},rows=[];
  values.determinant=[A.pack(A.sub(A.mul(A.unpack(values.covariance[0][0]),A.unpack(values.covariance[1][1])),
    A.mul(A.unpack(values.covariance[0][1]),A.unpack(values.covariance[1][0]))))];
  values.squareRootWeights=values.weights.map(x=>A.pack(A.sqrt(A.unpack(x))));
  if(A.unpack(values.determinant[0])[1]>=0n||values.squareRootWeights.some(x=>A.unpack(x)[0]<=0n))
    fail('PRECISION_REQUIRED','The actual-source conditional determinant and positive square-root coefficients were not separated from zero.');
  for(const[name,array]of Object.entries(values)){
    const boxes=Array.isArray(array[0])?array.flat():array;
    for(const[index,box]of boxes.entries()){
      const z=A.unpack(box),width=Q(z[1]-z[0],A.S),tolerance=['pulseCylindrical','centers'].includes(name)?centerControls.tolerance:request.tolerance;
      if(qcompare(width,readRational(tolerance))>0)fail('PRECISION_REQUIRED','The actual-source conditional '+name+' interval exceeds its requested width.');
      rows.push({name,index,interval:box,width:qtext(width),tolerance,toleranceMet:true});
    }
  }
  return {schema:'MathScope.PhysicalCenterCoefficientNumerics/1',request:{...request,centerTolerance:centerControls.tolerance},centered,absolute,values,rows,
    scales:{pulseCylindrical:['1','Ac','u'],weightedCylindrical:['A0','Ac*A0','u*A0'],covariance:[['Ac*massScale','Ac*massScale'],['u*massScale','u*massScale']],
      weights:'tau/massScale',squareRootWeights:'sqrt(tau/massScale)',determinant:'Ac*u*massScale^2',mass:'massScale',physicalVelocity:['Q^-A*sqrt(epsilon)*eta_beta*A0','Q^-A*sqrt(epsilon)*eta_beta*Ac*A0','Q^-A*sqrt(epsilon)*eta_beta*u*A0'],
      definitions:'massScale=r0^2/sqrt(g*Ls); A0=sqrt(tau/massScale); g=3*lambda0*u^2/(1+u^2)^(3/2); Ac=-c0*sqrt(1+u^2); tau=Ttheta/Ac>0 at the actual terminal midplane.'},
    sourceAuthenticated:false,physicalSourcePointCertifiedHere:false,exactPositiveScalesNumericallyEvaluated:false,
    valueOnly:true,slowOrFastDerivativeValuesEnclosed:false,wholeGNUMComplete:false,positiveRemaindersRetained:true,
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false},pass:true};
}
