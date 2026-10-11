/** Directed quadrature for the regular positive coefficient of the ORIGINAL
 * terminal angular target.  This module does not authenticate a source point.
 * The source adapter must retain rho, EpowB, r, Ac, the slow factor and the
 * nonzero Gaussian factor, and bind the exact backward primitive separately.
 */
import {directedArithmetic,intervalJets,readRational,rational as Q,qadd,qsub,qmul,qdiv,qpow,qcompare,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';

const ORDER=12,TAIL=128;
const floor=(a,b)=>{let n=a/b;if(a<0n&&a%b)n--;return n;},ceil=(a,b)=>-floor(-a,b);
const abs=x=>x<0n?-x:x;
const divide=(a,n)=>[floor(a[0],BigInt(n)),ceil(a[1],BigInt(n))];

/** Explicit positive Taylor series with range reduction and outward rounding.
 * A tiny negative exponential retains a positive upper endpoint. */
export function terminalTargetElementary(A){
  let degree=0,denominator=1n;
  while(8n*(1n<<BigInt(A.bits+24))>7n*denominator){degree++;denominator=8n**BigInt(degree+1)*factorial(degree+1);}
  const remainder=Q(8n,7n*denominator),units=ceil(remainder[0]*A.S,remainder[1]);let evaluations=0,tinyUpperBounds=0;
  function expPoint(n){
    evaluations++;if(n===0n)return A.one();
    if(n<=-BigInt(A.bits+8)*A.S){tinyUpperBounds++;return [0n,1n];}
    const x=abs(n);if(x>512n*A.S)fail('RESOURCE_LIMIT','The regular numerical exponential exceeded its finite range budget.');
    let shifts=0;while(8n*x>A.S*(1n<<BigInt(shifts)))shifts++;
    const y=A.point(Q(x,A.S*(1n<<BigInt(shifts))));y[1]=y[1]>A.S/8n?A.S/8n:y[1];
    let sum=A.one(),term=A.one();
    for(let k=1;k<=degree;k++){term=divide(A.mul(term,y),k);sum=A.add(sum,term);}
    sum=[sum[0],sum[1]+units];for(let j=0;j<shifts;j++)sum=A.mul(sum,sum);
    return n<0n?A.div(A.one(),sum):sum;
  }
  const exp=x=>[expPoint(x[0])[0],expPoint(x[1])[1]];
  const expJet=a=>{const b=[exp(a[0])];for(let n=1;n<a.length;n++){
    let c=A.zero();for(let k=1;k<=n;k++)c=A.add(c,A.mul(A.mul(A.point(k),a[k]),b[n-k]));b.push(divide(c,n));
  }return b;};
  const sqrtJet=a=>{const b=[A.sqrt(a[0])];if(b[0][0]<=0n)fail('PRECISION_REQUIRED','The regular square root must have a strictly positive lower bound.');
    for(let n=1;n<a.length;n++){let c=a[n];for(let k=1;k<n;k++)c=A.sub(c,A.mul(b[k],b[n-k]));b.push(A.div(c,A.mul(A.point(2),b[0])));}return b;};
  return {exp,expJet,sqrtJet,report:()=>({method:'DIRECTED_POSITIVE_TAYLOR_RANGE_REDUCTION_SQUARING_RECIPROCAL',degree,
    reducedArgument:['0','1/8'],positiveTaylorRemainder:qtext(remainder),evaluations,tinyPositiveUpperBounds:tinyUpperBounds,
    tinyPolicy:'For x<=-(bits+8), the interval [0,2^-bits] contains exp(x)>0. No tiny exponential is replaced by an exact zero.'})};
}

/** u-jets of (1/4)e^(-u+d-s) C(s), at d=1/4 and
 * s=d/sqrt(1+d^2*u/4), C=8g+s^3*g', g=(flat(s/2)+flat(1-s/2))^-1.
 * Each coefficient is a rigorous enclosure of the derivative divided by k!.
 */
export function terminalTargetRegularIntegrandJet(A,E,left,right,{order=ORDER}={}){
  if(!Number.isSafeInteger(order)||order<0||order>16||qcompare(left,Q(0))<0||qcompare(right,Q(TAIL))>0||qcompare(left,right)>0)
    fail('INVALID_INPUT','Use an ordered cell in [0,128] and a finite derivative order through16.');
  const J=intervalJets(A,order),u=J.c([A.point(left)[0],A.point(right)[1]]);if(order)u[1]=A.one();
  const d=J.c(A.point(Q(1,4))),s=J.div(d,E.sqrtJet(J.add(J.c(1),J.scale(u,A.point(Q(1,64)))))),
    a=J.scale(s,A.point(Q(1,2))),b=J.sub(J.c(1),a),ia=J.inv(a),ib=J.inv(b),
    fa=E.expJet(J.neg(J.mul(ia,ia))),fb=E.expJet(J.neg(J.mul(ib,ib))),den=J.add(fa,fb),g=J.inv(den),
    gp=J.mul(J.sub(J.mul(J.mul(J.mul(ib,ib),ib),fb),J.mul(J.mul(J.mul(ia,ia),ia),fa)),J.mul(g,g)),
    C=J.add(J.scale(g,A.point(8)),J.mul(J.mul(J.mul(s,s),s),gp)),
    weight=E.expJet(J.sub(J.sub(d,s),u));
  return J.scale(J.mul(weight,C),A.point(Q(1,4)));
}

export function terminalTargetPerturbationAudit(){
  // For 0<=s<=5/16 the second flat term is >e^-2>1/8.
  // |flat'|<=2 and |flat''|<=16 follow from max z^p e^-z=(p/e)^p.
  const go=8,gp=128,gpp=4608,cUpper=128,cPrimeUpper=2048,checks=[
    {id:'regular-exponential-upper-and-lower',pass:65*100+24<11*25*24&&11**2<8*4**2&&16>15,
      proof:'sum_(k=0)^4 1/k!=65/24 and the positive tail is <(1/120)/(1-1/6)=1/100; hence5/2<e<11/4 and e^2<8.'},
    {id:'source-go-positive-denominator',pass:32*32<2*27*27,inequality:'(1-s/2)^-2 <= (32/27)^2 <2'},
    {id:'source-go-first-derivative',pass:2*8**2<=gp},
    {id:'source-go-second-derivative',pass:2*2**2*8**3+8*8**2<=gpp},
    {id:'source-go-first-derivative-positive',pass:32**2>40*5**2&&1600n*1024n<(1n<<40n),
      inequality:'a<=5/32 gives a^-3*flat(a)<1/1024, whereas b>=27/32 and b<=1 give b^-3*flat(b)>1/8; hence gprime>0.'},
    {id:'source-C-value-upper',pass:8*go*16**3+5**3*gp<cUpper*16**3},
    {id:'source-C-derivative-upper',pass:(8*16**2+3*5**2)*gp*16+5**3*gpp<cPrimeUpper*16**3},
    {id:'delta-integral-lipschitz',pass:2*(cUpper+cPrimeUpper)<4*65536},
    {id:'retained-viscous-and-boundary-over-r-squared',pass:2*5*cUpper*27+32*16**3*cUpper<4*2**19*27},
    {id:'all-actual-perturbations-below-positive-reserve',pass:2542-2400>4&&4090-2400>4&&6648-2400>4&&16368-2400>4}
  ];
  return {schema:'MathScope.TerminalTargetPositivePerturbationAudit/1',pass:checks.every(x=>x.pass),checks,
    sourceAuthenticated:false,requiredActualPremises:{deltaDifferenceFromQuarter:'<2^-16384',deltaRange:['3/16','5/16'],
      h:'0<h<2^-4096',heatArgument:'0<z<2^-2559',profileRadiusSquared:'r^2>2^2561',midplaneEta:'0',profileL:'1',
      originalHeatMoments:'0< H<=1, |1-H|<=h(1+h)z, |Hprime|<=h(1+h)',originalBackwardTargetBodyRequired:true},
    bounds:{go,gp,gpp,C:cUpper,Cprime:cPrimeUpper,deltaLipschitz:65536,
      positiveViscousAndBoundaryRemainderUpper:'2^19/r^2',deltaPerturbationUpper:'2^-16368',hPerturbationUpper:'2^-4090',heatPerturbationUpper:'2^-6648',
      allActualPerturbationsRadius:qtext(Q(1,1n<<2400n))},
    exactNormalization:'tau = rho*EpowB*r*exp(A*delta)*s_slow^(-A-1/2)*exp(-4/delta^2)/(4*Ac) * coefficient',
    coefficient:'J[e^((1-h)(delta-s)) H(z*e^(s-delta))*C(s)] + 2/r^2*J[e^(-h(delta-s))*((2+2h)H+2z_s Hprime)*C(s)] + 8/(delta^3*r^2)*H(z)*C(delta)',
    J:'(1/4)*integral_0^infinity exp(-u) f(delta/sqrt(1+delta^2*u/4)) du',
    heatAndHNotReplacedByZero:true,positiveRemainingScaleEvaluated:false};
}

function inputOf(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance','maxCells'].includes(k)))
    fail('INVALID_INPUT','Only directed numerical controls are accepted, never a point, source h, target or proof flag.');
  const precisionBits=input.precisionBits??192,tolerance=input.tolerance??'1/1000000000000',maxCells=input.maxCells??1024,tol=readRational(tolerance);
  directedArithmetic(precisionBits);
  if(qcompare(tol,Q(0))<=0||qcompare(tol,Q(1,100))>0)fail('INVALID_INPUT','Use a positive exact interval-width tolerance at most1/100.');
  if(qcompare(tol,Q(1,1n<<BigInt(precisionBits-32)))<0)fail('PRECISION_REQUIRED','The requested width needs higher directed arithmetic precision.');
  if(!Number.isSafeInteger(maxCells)||maxCells<16||maxCells>4096||(maxCells&(maxCells-1)))fail('INVALID_INPUT','maxCells is a power of two from16 through4096.');
  return {precisionBits,tolerance:qtext(tol),maxCells};
}

/** A non-source numerical kernel. Every cell uses midpoint Taylor degree11
 * and the whole-cell twelfth derivative remainder. Refinement agreement is
 * never used as an error certificate. */
export function encloseTerminalTargetRegularCoefficient(input={},context={}){
  const request=inputOf(input),A=directedArithmetic(request.precisionBits),E=terminalTargetElementary(A),tol=readRational(request.tolerance),audit=terminalTargetPerturbationAudit(),
    tail=Q(1,1n<<122n),tailUnits=ceil(tail[0]*A.S,tail[1]),perturb=readRational(audit.bounds.allActualPerturbationsRadius),perturbUnits=ceil(perturb[0]*A.S,perturb[1]),history=[];
  if(!audit.pass)fail('INTERNAL_VALIDATION','The exact positive perturbation ledger failed.');
  for(let cells=16;cells<=request.maxCells;cells*=2){
    const width=Q(TAIL,cells),half=qdiv(width,Q(2));let polynomial=A.zero(),radius=0n;
    for(let j=0;j<cells;j++){
      context.checkCancelled?.();const left=qmul(width,Q(j)),right=qadd(left,width),center=qadd(left,half),
        midpoint=terminalTargetRegularIntegrandJet(A,E,center,center),whole=terminalTargetRegularIntegrandJet(A,E,left,right);
      for(let k=0;k<ORDER;k+=2)polynomial=A.add(polynomial,A.mul(A.point(qmul(Q(2,k+1),qpow(half,k+1))),midpoint[k]));
      const derivativeUpper=abs(whole[ORDER][0])>abs(whole[ORDER][1])?abs(whole[ORDER][0]):abs(whole[ORDER][1]);
      radius+=A.mul(A.point(qmul(Q(2,ORDER+1),qpow(half,ORDER+1))),[0n,derivativeUpper])[1];
    }
    const quadratureWidth=2n*radius+tailUnits+2n*perturbUnits,arithmeticWidth=polynomial[1]-polynomial[0],
      quadraturePass=qcompare(Q(2n*quadratureWidth,A.S),tol)<=0,arithmeticPass=qcompare(Q(2n*arithmeticWidth,A.S),tol)<=0;
    history.push({cells,quadratureWidth:qtext(Q(quadratureWidth,A.S)),arithmeticAndElementaryWidth:qtext(Q(arithmeticWidth,A.S)),quadraturePass,arithmeticPass});
    if(quadraturePass&&arithmeticPass){
      const regular=[polynomial[0]-radius,polynomial[1]+radius+tailUnits],sourceConditional=[regular[0]-perturbUnits,regular[1]+perturbUnits];
      if(regular[0]<=0n||sourceConditional[0]<=0n)fail('INTERNAL_VALIDATION','The regular angular coefficient lost its proved positivity.');
      return {schema:'MathScope.TerminalTargetRegularCoefficientEnclosure/1',pass:true,status:'DIRECTED_REGULAR_COEFFICIENT_KERNEL',request,
        regularCoefficient:A.pack(regular),actualCoefficientIfSourcePremisesBound:A.pack(sourceConditional),
        absoluteWidth:qtext(Q(sourceConditional[1]-sourceConditional[0],A.S)),cells,history,perturbationAudit:audit,
        errorBudget:{tolerance:request.tolerance,arithmeticAndElementaryWidth:qtext(Q(arithmeticWidth,A.S)),
          taylorWidth:qtext(Q(2n*radius,A.S)),positiveInfiniteTailUpper:qtext(tail),actualPointAndHeatPerturbationRadius:qtext(perturb),
          quadratureAndSourcePerturbationWidth:qtext(Q(quadratureWidth,A.S)),totalWidth:qtext(Q(sourceConditional[1]-sourceConditional[0],A.S)),toleranceMet:true},
        proof:{sourceRegularFormula:'d=1/4, s=d/sqrt(1+d^2*u/4), g=(flat(s/2)+flat(1-s/2))^-1, C=8g+s^3*gprime',
          regularIntegral:'(1/4)*integral_0^infinity exp(-u+d-s)*C(s) du',taylorDegree:ORDER-1,wholeCellDerivativeOrder:ORDER,
          cellRemainder:'2*halfWidth^13*sup_cell|f^(12)/12!|/13',tailStart:TAIL,
          infiniteTail:'g<=8, |gprime|<=128 imply |C|<128; exp(d-s)<2. The omitted integral is <=64*exp(-128)<2^-122.',
          refinementDifferenceUsedAsProof:false,positiveInfiniteTailRetained:true},
        arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false,elementary:E.report()},
        scope:{regularCoefficientNumericallyEnclosed:true,actualSourcePointAuthenticated:false,actualTauAbsoluteScaleEnclosed:false,
          originalHReplacedByZero:false,uncomputedOriginalScaleCalledNumerical:false,wholeGNUMComplete:false,M3Started:false}};
    }
    if(quadraturePass&&!arithmeticPass)fail('PRECISION_REQUIRED','The regular quadrature has converged but arithmetic width exceeds its budget.');
  }
  fail('RESOURCE_LIMIT','The actual Taylor and positive-tail error budget was not met at maxCells.');
}
