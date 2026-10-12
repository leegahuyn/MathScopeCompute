/** Uniform finite-order calculus for the original positive covariance
 * weights and Gaussian physical tails. Exact recurrences supply a proof
 * for each finite order; a source adapter must authenticate the premises.
 */
import {allOrderMixedGaussianJetPowerAudit} from './actual-all-order-gaussian-jet-kernel.mjs';
import {gaussianFlatSummabilityRecipe} from './actual-gaussian-flat-tail-kernel.mjs';
import {factorial,rational as Q,qadd,qmul,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';

const choose=(m,j)=>factorial(m)/(factorial(j)*factorial(m-j)),reserve=n=>n<=1n?0:(n-1n).toString(2).length,
  degree=(power,pole=0)=>({power,pole}),mul=(a,b)=>degree(a.power+b.power,a.pole+b.pole),
  times=(a,c)=>degree(a.power+reserve(c),a.pole),
  sum=xs=>degree(Math.max(...xs.map(x=>x.power))+reserve(BigInt(xs.length)),Math.max(...xs.map(x=>x.pole)));

/** Write K*S for the positive common base (K>=2,S>=1). A degree(p,d)
 * denotes (K*S)^p*delta^-d. All constants in the source hypotheses are
 * absorbed into the SAME source-only K for a fixed requested order.
 * The zeta factors are tracked explicitly, not cancelled numerically.
 */
export function originalWeightedCovarianceJetPowers(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork','targetPoles'].includes(k)))
    fail('INVALID_INPUT','Select a finite order, a finite work budget and explicit target poles only.');
  const order=input.order??2,maxWork=input.maxWork??20000;
  if(!Number.isSafeInteger(order)||order<0||!Number.isSafeInteger(maxWork)||maxWork<1)
    fail('INVALID_INPUT','Use a finite nonnegative derivative order and a positive finite work budget.');
  const mixed=allOrderMixedGaussianJetPowerAudit({order:order+1,maxWork}),
    targetPoles=input.targetPoles??Array.from({length:order+2},(_,j)=>3+3*j);
  if(!Array.isArray(targetPoles)||targetPoles.length<order+2||targetPoles.some(d=>!Number.isSafeInteger(d)||d<0))
    fail('INVALID_INPUT','Every needed actual target derivative must have an explicit finite boundary pole.');
  const t=mixed.powers.t.map(p=>degree(p+1)),H=[],inverse=[],y=[],sigma=[],inverseRows=[],sqrtRows=[];
  for(let m=0;m<=order+1;m++){
    // H = (Dgeom*ci*Integral chi^2/2) Integral psi^2*t_r*t_tan.
    // ci*Ls=2r0 removes the interval power of S, exactly.
    H.push(mul(degree(2),sum(Array.from({length:m+1},(_,j)=>times(mul(t[j],t[m-j]),choose(m,j))))));
  }
  // ||H^-1|| <= 2 max|H_ij| / |det H|; |det H|>=d_star/S.
  inverse.push(degree(H[0].power+2));
  for(let m=1;m<=order+1;m++){
    const terms=Array.from({length:m},(_,j)=>times(mul(H[j+1],inverse[m-j-1]),2n*choose(m,j+1))),
      upper=mul(inverse[0],sum(terms));inverse.push(upper);inverseRows.push({order:m,terms,upper});
  }
  for(let m=0;m<=order+1;m++){
    const terms=Array.from({length:m+1},(_,j)=>times(mul(inverse[j],degree(1,targetPoles[m-j])),2n*choose(m,j)));
    y.push(sum(terms));
  }
  sigma.push(degree(Math.ceil(y[0].power/2),Math.ceil(y[0].pole/2)));
  for(let m=1;m<=order+1;m++){
    const terms=[y[m],...Array.from({length:m-1},(_,i)=>times(mul(sigma[i+1],sigma[m-i-1]),choose(m,i+1)))],
      upper=mul(degree(1),sum(terms));sigma.push(upper);sqrtRows.push({order:m,terms,upper,
        zetaAccounting:'(zeta or sqrt(zeta)*sqrt(zeta))/(2*sqrt(y)) <= sourceConstant*sqrt(zeta), since y>=c_y*zeta.'});
  }
  const normal=mixed.rows.filter(r=>r.label.startsWith('original n_')&&!r.label.startsWith('original n_prime')),
    invNormal=mixed.rows.find(r=>r.label==='original 1/|n|^2'),
    normalPowers=Array.from({length:order+2},(_,j)=>degree(Math.max(...normal.map(r=>r.powers[j])))),
    invNormalPowers=invNormal.powers.slice(0,order+2).map(p=>degree(p)),
    productJets=(a,b)=>Array.from({length:order+2},(_,m)=>sum(Array.from({length:m+1},(_,j)=>times(mul(a[j],b[m-j]),choose(m,j))))),
    sourceCutoffs=Array.from({length:order+2},(_,j)=>degree(3*j+3)),
    amplitude=productJets(productJets(sigma,t),sourceCutoffs),
    potential=productJets(productJets(normalPowers,amplitude),invNormalPowers).map(x=>mul(degree(2),x)),
    curlRows=Array.from({length:order+1},(_,m)=>{
      const fastTerms=Array.from({length:m+1},(_,j)=>times(mul(degree(1),potential[m+1-j]),choose(m,j))),
        connectionTerms=Array.from({length:m+1},(_,j)=>times(mul(degree(1),potential[m-j]),choose(m,j))),
        upper=sum([amplitude[m],potential[m+1],...fastTerms,...connectionTerms]);
      return {order:m,fastTerms,connectionTerms,upper,
        rule:'Every derivative of a(R)*D_xi C and C/R uses its full Leibniz sum. The same source K controls all derivatives of a/epsilon^-kappa_s and 1/R required at this fixed order.'};
    }),curl=curlRows.map(r=>r.upper);
  if([...H,...inverse,...y,...sigma,...potential,...curl].some(x=>!Number.isSafeInteger(x.power)||!Number.isSafeInteger(x.pole)))
    fail('RESOURCE_LIMIT','The finite boundary/band exponent recurrence exceeded exact safe-integer capacity.');
  return {schema:'MathScope.OriginalWeightedCovarianceJetPowers/1',order,mixed,H,inverse,inverseRows,y,sigma,sqrtRows,amplitude,potential,curl,curlRows,targetPoles,
    base:'For each fixed m choose one K_m>=2 dominating the original B_(m+1), W^(m+2), Haar-length constant, d_star^-1, c_y^-1/2, all target jet constants through m+1 and original cutoff/chart constants. It is independent of ell and labels.',
    premises:['Original homogeneous t mixed jets obey the retained mixed Gaussian ledger with the SAME Gaussian P(v)<=1.',
      'Original H has its literal Haar/cutoff integrals, ci*Ls=2r0, |det H|>=d_star/S, and each actual positive y_j>=c_y*zeta.',
      '|D^j Tbar|<=K_m*zeta*delta^(-targetPoles[j]) for every needed j on the same complete source annulus.',
      'The original cutoff slow mesh has scale ell^6=S^3; transverse cutoffs and the reference time cutoff have source-only derivative constants, with Ls>=1.',
      'The full-curl fast radial coefficient obeys |D_R^j a(R)|<=sourceConstant_j*epsilon^(-kappa_s), kappa_s=1/100000, and 1/k<=sqrt(epsilon).'],
    inverseIdentity:'D^m(H^-1)=-H^-1*sum_(j=1)^m binom(m,j)*(D^j H)*(D^(m-j)H^-1); matrix dimension2 is retained.',
    weightIdentity:'D^m y=sum_j binom(m,j)*D^j(H^-1)*D^(m-j)Tbar.',
    squareRootIdentity:'D^m sqrt(y)=[D^m y-sum_(j=1)^(m-1)binom(m,j)D^j sqrt(y)D^(m-j)sqrt(y)]/(2sqrt(y)).',
    conclusion:{weight:'|D^j sqrt(y)| <= (K_m*S)^sigma[j].power*sqrt(zeta)*delta^(-sigma[j].pole).',
      amplitude:'The original eta_beta*sqrt(epsilon)*sqrt(y)*chi*psi*t has coefficient class W_(1/2) with the displayed polynomial/pole bounds and Gaussian P.',
      potential:'The original n cross amplitude/(k|n|^2) has W_1 coefficients. A source-only 1/k factor cannot be lost.',
      curl:'The full normalized curl has the primary W_(1/2) coefficient plus a W_(1-kappa_s) remainder. Since kappa_s<1/2 and epsilon<=1, their absolute sum is bounded in W_(1/2) by curl[j].'},
    allMixedSubsetsAndMatrixDimensionsRetained:true,dividingVanishingWeightAtEdge:false,
    actualSourceAuthenticated:false,actualTargetPoleBoundsProvedHere:false,pass:true};
}

/** Positive margins are exact rational values at h=1/16. The original
 * source has 0<h<2^-4096, so every inequality is strict. Every physical
 * derivative can safely be charged TWO powers of Q^-1; S powers remain.
 */
export function originalPhysicalGaussianLossAudit(){
  const add=(...xs)=>xs.reduce(qadd,Q(0)),neg=x=>qmul(x,Q(-1)),hMax=Q(1,16),kappa=Q(1,100000),
    rows=[
      {id:'spatial-harmonic',loss:add(Q(1,2),qmul(hMax,Q(1,2))),budget:Q(1)},
      {id:'spatial-radial-fast',loss:add(Q(1,2),qmul(hMax,kappa)),budget:Q(1)},
      {id:'time-harmonic',loss:add(Q(1),qmul(hMax,Q(3,2))),budget:Q(2)},
      {id:'time-coefficient',loss:add(Q(1),hMax),budget:Q(2)},
      {id:'physical-momentum-base',loss:add(Q(3,2),qmul(hMax,Q(2))),budget:Q(2)}
    ].map(r=>{const margin=add(r.budget,neg(r.loss));return {id:r.id,upperLoss:qtext(r.loss),budget:qtext(r.budget),strictMargin:qtext(margin),pass:margin[0]>0n};});
  return {schema:'MathScope.OriginalPhysicalGaussianLossAudit/1',hDomain:'0<h<1/16',kappa_s:qtext(kappa),rows,
    proof:'D_star phase=n has a uniform source bound and k<=2 epsilon^-1/2. The axial epsilon cancels the pz/epsilon phase term exactly. Time has -epsilon*partial_T+partial_v, so its harmonic cost is epsilon^-1/2 with a polynomial S coefficient. The original radial fast factor costs epsilon^-kappa_s. Every fixed further coefficient derivative only changes a source constant or an S power.',
    physicalResidualDerivativeBound:'C_m*Q^(-2-2m)*S^b_m*sqrt(zeta)*delta^-d_m*P(v)',
    sourceAuthenticated:false,phaseAxialCancellationMustBeBoundToActualSource:true,hReplacedByZero:false,pass:rows.every(r=>r.pass)};
}

/** Two original radial flat exponents control every fixed boundary pole.
 * This proof uses the source width t1, not a chosen numerical cutoff.
 */
export function doubleBoundaryGaussianPoleBound(G,{innerExponent,outerExponent,pole=0}={}){
  if(![innerExponent,outerExponent].every(x=>Number.isSafeInteger(x)&&G.nodes[x])||!Number.isSafeInteger(pole)||pole<0)
    fail('INVALID_INPUT','Retain two positive source exponents and a finite nonnegative boundary pole.');
  if([innerExponent,outerExponent].some(x=>G.isq(x)&&G.fraction(x)[0]<=0n))fail('INVALID_INPUT','Both source boundary exponents must be positive.');
  const q=(n,d=1)=>G.q(n,d),a=innerExponent,b=outerExponent,nu=G.div(G.mul(a,b),G.add(a,b)),
    constant=G.exp(G.div(q(BigInt(pole)**2n),G.mul(q(2),nu))),x=G.fresh('boundary_inverse_delta'),
    difference=G.add(G.div(q(BigInt(pole)**2n),G.mul(q(2),nu)),G.mul(G.div(nu,q(2)),G.pow(x,2)),G.neg(G.mul(q(pole),x))),
    square=G.div(G.pow(G.sub(G.mul(nu,x),q(pole)),2),G.mul(q(2),nu)),
    identity=sourceGraphRationalIdentity(G,G.sub(difference,square),{atomicNodes:[nu],maxTerms:20000});
  if(!identity.pass)fail('INTERNAL_VALIDATION','The retained positive boundary square identity failed.');
  return {schema:'MathScope.DoubleBoundaryGaussianPoleBound/1',innerExponent:a,outerExponent:b,pole,nu,constant,identity,
    definition:'zeta=exp(-a/y^2-b/z^2), delta=min(1,y,z), y,z>0.',
    bound:'sqrt(zeta)*delta^-pole <= constant',
    proof:'0<nu=ab/(a+b)<=min(a,b). If delta<1, sqrt(zeta)<=exp(-nu/(2delta^2)) and log(1/delta)<=1/delta. Complete the displayed nonnegative square. If delta=1 use sqrt(zeta)<=1. Keeping half the radial exponential instead gives all fixed vanishing orders at either edge.',
    zeroExtensionOfOriginalWeightProvedHere:false,sourceAuthenticated:false,pass:true};
}

export function completePhysicalGaussianTailRecipe(G,input={}){
  const allowed=['gaussian','innerExponent','outerExponent','polynomialOrder','boundaryPole','derivativeOrder','flatOrder','firstBand','meshCount'];
  if(!input||Object.keys(input).some(k=>!allowed.includes(k)))fail('INVALID_INPUT','Use the exact source Gaussian, boundary constants, derivative orders and full mesh count.');
  const m=input.derivativeOrder??2,N=input.flatOrder??4,b=input.polynomialOrder??0,d=input.boundaryPole??0;
  if([m,N,b,d].some(x=>!Number.isSafeInteger(x)||x<0))fail('INVALID_INPUT','Use finite nonnegative derivative, flat, band and boundary orders.');
  if(!Number.isSafeInteger(input.meshCount)||!G.nodes[input.meshCount])fail('INVALID_INPUT','Retain the positive source mesh-count coefficient.');
  const loss=originalPhysicalGaussianLossAudit(),boundary=doubleBoundaryGaussianPoleBound(G,{innerExponent:input.innerExponent,outerExponent:input.outerExponent,pole:d}),
    band=gaussianFlatSummabilityRecipe(G,{gaussian:input.gaussian,polynomialOrder:2*b+18,powerLoss:2+2*m,flatOrder:N,firstBand:input.firstBand}),
    coefficient=G.mul(input.meshCount,boundary.constant),flatConstant=G.mul(coefficient,band.roots.constant),infiniteTail=G.mul(coefficient,band.roots.tail);
  return {schema:'MathScope.CompletePhysicalGaussianTailRecipe/1',derivativeOrder:m,flatOrder:N,polynomialOrder:b,boundaryPole:d,loss,boundary,band,
    roots:{flatConstant,infiniteTail},
    retainedPrefactor:'The actual source-only coefficient bound K_m^p remains as a multiplicative factor in both displayed constants; this generic scalar recipe does not supply it.',
    mesh:'S=ell^2. The complete original three-dimensional mesh contributes ell^18, with its original finite coefficient and both signs. This includes all labels, not just the at-most32 pointwise active signs.',
    conclusion:'Every actual temporal-cutoff residual derivative through fixed m is flat to every fixed order N once the SAME source uniform coefficient bound is attached. The positive infinite tail is retained.',
    actualAmplitudeBoundAuthenticated:false,totalUncorrectedNSResidualDeclaredFlat:false,newLeanKernelProof:false,sourceAuthenticated:false,pass:true};
}
