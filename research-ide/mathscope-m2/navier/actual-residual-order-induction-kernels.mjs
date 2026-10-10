/** Executed, source-specific primitives for an all-order continuation.
 *
 * These are arbitrary finite-order derivative algorithms, not an extension
 * of the old order-12 numerical constants.  They do NOT certify a completed
 * positive-order coefficient or choose a cutoff from an unspecified norm.
 * The companion source/norm/background modules supply those operands.
 * See research/ACTUAL_RESIDUAL_ORDER_INDUCTION_KO.md for their exact
 * two-system induction and the boundary of the C2 completion claim.
 */
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {PINNED_N3} from './source-profile-data.mjs';
import {rational as Q,qadd,qmul,qpow,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';

const orderCheck=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail('INVALID_INPUT',name+' must be a nonnegative safe integer.');};
const workBudget=(n,context={})=>{const limit=context.maxArithmeticOperations??1000000;if(!Number.isSafeInteger(limit)||limit<1)fail('INVALID_INPUT','Use a positive arithmetic resource budget.');if(n>Math.floor(Math.sqrt(limit/16)))fail('RESOURCE_LIMIT','This requested finite derivative order exceeds the explicit arithmetic budget. The recurrence has no fixed order-twelve theorem limit.');};
const binomial=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const absolute=n=>n<0n?-n:n;
const polynomial=p=>[...p].filter(([,c])=>c!==0n).sort(([a],[b])=>a-b).map(([power,c])=>({power,coefficient:String(c)}));
const addTerm=(p,k,v)=>{const next=(p.get(k)??0n)+v;if(next)p.set(k,next);else p.delete(k);};
const source=profileId=>{const s=assertSourceProfile(profileId??SOURCE_PROFILE_ID);return {profileId:s.id,parameterExpressionSHA256:s.parameterExpressionSHA256,assemblySHA256:PINNED_N3.inputs.assembly.sha256};};

/** For a_p(t)=exp(-t^-p), p=1 or2, every derivative is
 * exp(-z^p) P_k(z), z=1/t, with
 * P_(k+1)=p*z^(p+1)*P_k-z^2*P'_k.
 * Each monomial is bounded individually on ALL z>=0.  No maximum
 * degree from a previous finite audit enters this estimate.
 */
function seedJets(p,order,checkCancelled){
  let P=new Map([[0,1n]]);const rows=[],bounds=[];
  for(let k=0;k<=order;k++){
    checkCancelled?.();let bound=0n;
    const monomialBounds=[];
    for(const [j,c] of P){
      // max z^j exp(-z^p)=(j/(p*e))^(j/p) for j>0.
      // If v=j/p<=1 the maximum is<=1; if v>1, ceil(v)^ceil(v)
      // is an integer upper bound.  This also covers j=0.
      const ceiling=Math.max(1,Math.ceil(j/p));
      const upper=BigInt(ceiling)**BigInt(ceiling);
      bound+=absolute(c)*upper;
      monomialBounds.push({power:j,coefficient:String(c),integerMaximumUpper:String(upper)});
    }
    rows.push({order:k,polynomial:polynomial(P),monomialBounds,ordinaryDerivativeUpper:String(bound)});bounds.push(bound);
    if(k<order){const next=new Map();for(const [j,c]of P){addTerm(next,j+p+1,BigInt(p)*c);if(j)addTerm(next,j+1,-BigInt(j)*c);}P=next;}
  }
  return {rows,bounds};
}

/** Ordinary derivatives of sigma_p(t)=a_p(t)/(a_p(t)+a_p(1-t)).
 * The extension is constant outside [0,1], with matching flat jets.
 * exp(-2^p)>1/denominatorInverseUpper, proved with e<11/4.
 */
function stepJets(p,order,checkCancelled){
  const seed=seedJets(p,order,checkCancelled),inverseFloor=p===2?64n:16n,reciprocal=[inverseFloor],sigma=[1n];
  for(let m=1;m<=order;m++){
    checkCancelled?.();let r=0n;
    for(let k=1;k<=m;k++)r+=binomial(m,k)*2n*seed.bounds[k]*reciprocal[m-k];
    reciprocal.push(inverseFloor*r);
    let s=0n;for(let k=0;k<=m;k++)s+=binomial(m,k)*seed.bounds[k]*reciprocal[m-k];
    sigma.push(s);
  }
  return {seedPower:p,seed:'exp(-1/t^'+p+') on t>0, extended flat by0',
    step:'a(t)/(a(t)+a(1-t)) on0<t<1, with constant exterior branches',
    denominatorInverseUpper:String(inverseFloor),seedDerivatives:seed.rows,
    reciprocalOrdinaryDerivativeBounds:reciprocal.map(String),ordinaryDerivativeBounds:sigma.map(String),
    recurrence:{reciprocal:'r_0=D; r_m=D*sum_(k=1)^m binom(m,k)*2*b_k*r_(m-k)',
      quotient:'s_0=1; s_m=sum_(k=0)^m binom(m,k)*b_k*r_(m-k) for m>=1'},
    domain:'all real t; flat endpoint extension included',fixedOldDerivativeBoundUsed:false};
}

/** The original source uses the square seed for activation and radial
 * gluing.  The independently chosen time cutoff matches source-gluing.mjs:
 * chi(s)=1-sigma_1(2s-1), equal1 for s<=1/2 and0 for s>=1.
 */
export function sourceAllOrderCutoffJets(input={},context={}){
  if(input===null||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','Use a source derivative request.');
  for(const k of Object.keys(input))if(!['sourceProfile','order'].includes(k))fail('INVALID_INPUT','A source cutoff, derivative bound, or scale cannot be replaced: '+k);
  const n=input.order??16;orderCheck(n,'order');workBudget(n+2,context);
  const sourceInfo=source(input.sourceProfile),activation=stepJets(2,n,context.checkCancelled),timeStep=stepJets(1,n+1,context.checkCancelled);
  const S=Array.from({length:n+2},()=>[]);S[0][0]=1n;
  for(let r=1;r<=n+1;r++)for(let k=0;k<=r;k++)S[r][k]=BigInt(k)*(S[r-1][k]??0n)+(k?S[r-1][k-1]??0n:0n);
  const ordinary=Array.from({length:n+2},(_,r)=>r?2n**BigInt(r)*BigInt(timeStep.ordinaryDerivativeBounds[r]):1n),euler=[];
  for(let r=0;r<=n+1;r++){
    let value=0n;for(let k=0;k<=r;k++)value+=(S[r][k]??0n)*ordinary[k];
    euler.push(value);
  }
  // Rational comparisons, independent of a machine exponential.
  let eUpper=Q(0);for(let k=0;k<=10;k++)eUpper=qadd(eUpper,Q(1,factorial(k)));
  eUpper=qadd(eUpper,Q(12,11n*factorial(11)));
  const checks=[{id:'same-source-profile',pass:sourceInfo.profileId===SOURCE_PROFILE_ID},
    {id:'e-upper-below-11/4',pass:eUpper[0]*4n<11n*eUpper[1]},
    {id:'square-denominator',pass:11n**4n<64n*4n**4n},
    {id:'linear-denominator',pass:11n**2n<16n*4n**2n},
    {id:'every-requested-derivative-generated',pass:activation.ordinaryDerivativeBounds.length===n+1&&euler.length===n+2}];
  return {schema:'MathScope.SourceAllOrderCutoffJets/1',...sourceInfo,order:n,activation,timeStep,
    timeCutoff:{definition:'chi(s)=1-sigma_1(2s-1)',sameDefinitionAs:'source-gluing.mjs:smoothPotentialCutoff',
      plateau:['s<=1/2','s>=1'],ordinaryDerivativeBounds:ordinary.map(String),eulerDerivativeBounds:euler.map(String),
      eulerIdentity:'(s*d_s)^r chi=sum_(k=0)^r S(r,k)*s^k*chi^(k); |s|<=1 on every nonconstant derivative support',
      radialPotentialExtraDerivative:'The cutoff term s*chi_prime has r-th Euler derivative D^(r+1)chi; its needed n+1 bound is retained.',
      stirling:S.map(row=>row.map(String))},checks,pass:checks.every(x=>x.pass),
    scope:{actualSourcePrimitiveBoundsDerived:true,requestedFiniteOrder:n,fixedTwelveJetExtrapolation:false,
      fullCoefficientNormProducer:false,cutoffScalesSelected:false,backgroundC2TailCertified:false,originalN506Complete:false,formalKernelProof:false}};
}

/** Actual B_rho derivative bound on a fixed complex natural domain.
 * Phi,u,average here are the actual nonlinear Banach solution.  The
 * coefficient is exact rational arithmetic; Q and rho are the pinned
 * positive source expressions and are never rounded to zero.
 */
export function sourceAllOrderNaturalJetBound(input={},context={}){
  if(input===null||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','Use an actual natural derivative request.');
  for(const k of Object.keys(input))if(!['sourceProfile','radialLogOrder','etaOrder'].includes(k))fail('INVALID_INPUT','The actual natural field or bound cannot be replaced: '+k);
  const r=input.radialLogOrder??0,m=input.etaOrder??0;orderCheck(r,'radialLogOrder');orderCheck(m,'etaOrder');workBudget(r+m+2,context);
  const sourceInfo=source(input.sourceProfile),S=Array.from({length:r+1},()=>[]);S[0][0]=1n;
  for(let j=1;j<=r;j++){context.checkCancelled?.();for(let k=0;k<=j;k++)S[j][k]=BigInt(k)*(S[j-1][k]??0n)+(k?S[j-1][k-1]??0n:0n);}
  let coefficient=Q(0);const terms=[];
  for(let k=0;k<=r;k++)if(S[r][k]){
    const value=qmul(Q(S[r][k]*factorial(m+k)),qmul(qpow(Q(1,4),k),qpow(Q(2),m+k+1)));
    coefficient=qadd(coefficient,value);terms.push({radialDerivative:k,stirling:String(S[r][k]),coefficient:qtext(value)});
  }
  return {schema:'MathScope.SourceAllOrderNaturalJetBound/1',...sourceInfo,radialLogOrder:r,etaOrder:m,
    source:'SAME_DATUM_ANALYTIC_AXIS.md Banach space B_rho, radial base20; differentiated geometric series',
    functions:['actual Phi','actual u','actual radial average of u'],
    domain:{complexYAbsoluteUpper:'5',complexEtaDistanceFromRealIUpper:'rho/4',realI:['-1','1'],remainingCauchyDenominatorLower:'1/2'},
    exactBound:{product:[{rational:qtext(coefficient)},{sourceParameter:'Q'},{integerPower:[{sourceParameter:'rho'},-m]}]},
    coefficient:qtext(coefficient),terms,derivativeConvention:'ordinary eta derivative and (Y*d_Y)^r',
    inequality:'|(Y*d_Y)^r d_eta^m f| <= Q*rho^-m*sum_k S(r,k)*(1/4)^k*(m+k)!*2^(m+k+1)',
    proof:'At |Y|<=5 and |deltaEta|<=rho/4, 1-|Y|/20-|deltaEta|/rho>=1/2. Expand (Y*d_Y)^r by exact Stirling numbers and apply the positive B_rho Cauchy coefficient bound. The extra original (m+1)^-2 gain is discarded, never needed.',
    pass:true,scope:{actualNaturalFunctionBound:true,comparisonProfileSubstituted:false,arbitraryFiniteOrdersComputed:true,
      actualActivationCollarIncluded:false,positiveOrderAuxiliarySystemConstructed:false,fullCoefficientNormProducer:false,backgroundC2TailCertified:false}};
}

/** All ordered nonlinear products required by the original order-n
 * equations. This is an executable recipe, not a claim that its function
 * operands have been supplied. The same-order (0,n),(n,0) terms remain in
 * the linear Picard operator; every forcing pair is strictly lower-order.
 */
export function positiveOrderInductionRecipe(order){
  orderCheck(order,'order');if(order===0)fail('INVALID_INPUT','Use a positive expansion order.');
  workBudget(order);
  const pairs=Array.from({length:order+1},(_,i)=>[i,order-i]),forcingPairs=pairs.filter(([i,j])=>i>0&&j>0),omegaOrder=order-1;
  return {schema:'MathScope.PositiveOrderInductionRecipe/1',order,
    exactExponent:{sourceParameter:'h',integerMultiplier:2*order},
    linearPairs:[[0,order],[order,0]],forcingPairs,omega:{order:omegaOrder,orderedPairs:Array.from({length:order},(_,i)=>[i,omegaOrder-i]),axialViscosityOrder:order>=2?order-2:null},
    tangentialAxialViscosityOrder:order-1,
    pressureKnown:'sum_(i+j=n, i,j>=1) F_i F_j - Omega_(n-1)/(2X)',
    angularKnown:'sum_(i+j=n, i,j>=1) [v_i*(X*F_jX+F_j)+U_i*Z_(b+2jh)F_j] - Z_(b+2(n-1)h-D)Z_(b+2(n-1)h)F_(n-1)',
    axialKnown:'sum_(i+j=n, i,j>=1) [X*v_i*U_jX+U_i*Z_(c+2jh)U_j] - Z_(c+2(n-1)h-D)Z_(c+2(n-1)h)U_(n-1)',
    sixForcing:'[0,0,0,2*xi*pKnown,2*Htheta,2*Hz-4*eta*X*pKnown/L]',
    momentLowerBodies:['0','0','sum_(i+j=n, i,j>=1) F_i F_j-Omega_(n-1)/(2X)',
      'sum_(i+j=n, i,j>=1) 2X U_i F_j','sum_(i+j=n, i,j>=1) [U_i U_j-X F_i F_j]+Omega_(n-1)/2'],
    lowerSourcePolicy:'Actual common-collar system consumes finalized local cutoffs; global moments consume the full finalized lower fields, including Ipos corrections.',
    auxiliaryPolicy:'A second natural system must be generated explicitly from earlier natural auxiliary systems. It is identified with the actual one only on X<=Xa by uniqueness.',
    coefficientParameterBound:{formula:'4+2*n*h',fixedAbsExponentThree:false},
    requiresCompletedOrders:Array.from({length:order},(_,i)=>i),
    sourceOperandsResolved:false,coefficientNormsComputed:false,actualTupleConstructed:false,pass:false};
}

/** Source q-Euler product coefficients for (5.46). Returned weights are
 * actual polynomials in the pinned h, with exact nonnegative integer
 * coefficients. A coefficient-profile norm is deliberately NOT invented.
 */
export function sourceNormalizedCutoffWeights(input={},context={}){
  if(input===null||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','Use an actual normalized cutoff request.');
  for(const k of Object.keys(input))if(!['sourceProfile','order','derivativeOrder'].includes(k))fail('INVALID_INPUT','A missing coefficient norm cannot be injected into this primitive: '+k);
  const n=input.order??2,m=input.derivativeOrder??2;orderCheck(n,'order');orderCheck(m,'derivativeOrder');if(n<1)fail('INVALID_INPUT','Use a positive expansion order.');
  const primitives=sourceAllOrderCutoffJets({sourceProfile:input.sourceProfile,order:m},context),C=primitives.timeCutoff.eulerDerivativeBounds.map(BigInt),rows=[];
  for(let r=0;r<=m;r++){
    const coefficients=Array.from({length:r+1},(_,power)=>String(binomial(r,power)*(2n*BigInt(n))**BigInt(power)*C[r-power]));
    const extra=Array.from({length:r+1},(_,power)=>String(binomial(r,power)*(2n*BigInt(n))**BigInt(power)*C[r-power+1]));
    rows.push({eulerOrder:r,polynomialInSourceH:coefficients,extraPotentialCutoffPolynomialInSourceH:extra});
  }
  return {schema:'MathScope.SourceNormalizedCutoffWeights/1',profileId:primitives.profileId,parameterExpressionSHA256:primitives.parameterExpressionSHA256,order:n,derivativeOrder:m,
    weights:rows,sourceCutoff:primitives.timeCutoff.definition,
    identity:'(q*d_q)^r[chi(c*q)*q^(2*n*h)]=q^(2*n*h)*sum_k binom(r,k)*(2*n*h)^(r-k)*(s*d_s)^k chi(s), s=c*q',
    extraPotentialIdentity:'Replace the k-th chi Euler derivative by its k+1 derivative for s*chi_prime(s).',
    pendingNorm:'B_(n,m) must be computed from the actual normalized coefficient/potential jets multiplied by these weights, through all mixed profile derivatives <=m.',
    selectorOnceNormExists:'log(c_n) >= max(log(c_(n-1))+log2, [n*log2+log(max(1,B_(n,m)))]/(n*h), for every m<=n, plus the actual (5.37) requirements.',
    allQProof:'For 0<q<=1/c_n, B_(n,m)*q^(n*h)<=2^-n; for q>=1/c_n the cutoff and every derivative are zero.',
    scope:{actualSourceCutoffWeightsComputed:true,allPositiveNExponentRetained:true,actualCoefficientNormMissing:true,
      completeScheduleSelected:false,backgroundC2TailCertified:false,sourceUniformQStarCertified:false,originalN506Complete:false},pass:primitives.pass};
}
