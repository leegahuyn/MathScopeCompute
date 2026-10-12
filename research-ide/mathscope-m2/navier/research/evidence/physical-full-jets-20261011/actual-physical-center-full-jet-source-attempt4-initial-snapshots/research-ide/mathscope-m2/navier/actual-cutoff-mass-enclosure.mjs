/** Directed numerical integrals for the two literal cutoffs in the genuine
 * covariance operator. This evaluates source factors, not the whole H matrix,
 * its inverse, a pulse solution, or the physical residual.
 */
import {directedArithmetic,intervalJets,readRational,rational,qadd,qsub,qmul,qdiv,qcompare,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';
import {prepareActualCovarianceOperator,assertActualCovarianceOperator} from './actual-covariance-source-operator.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const ORDER=8,seals=new WeakMap(),sourceSnapshots=new WeakMap();
const floor=(a,b)=>{let n=a/b;if(a<0n&&a%b)n--;return n;},ceil=(a,b)=>-floor(-a,b);
const abs=a=>a<0n?-a:a;
const divideInteger=(x,n)=>[floor(x[0],BigInt(n)),ceil(x[1],BigInt(n))];
const qpow=(q,n)=>rational(q[0]**BigInt(n),q[1]**BigInt(n));
const interval=(lo,hi)=>({lower:qtext(lo),upper:qtext(hi)});
const scaledInterval=(box,scale)=>interval(qmul(readRational(box.lower),scale),qmul(readRational(box.upper),scale));
const shiftedInterval=(box,shift)=>interval(qadd(readRational(box.lower),shift),qadd(readRational(box.upper),shift));
const positiveProductInterval=(a,b)=>interval(qmul(readRational(a.lower),readRational(b.lower)),qmul(readRational(a.upper),readRational(b.upper)));

function requestOf(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance','maxCells'].includes(k)))fail('INVALID_INPUT','Use precisionBits, an exact rational tolerance, and maxCells only.');
  const precisionBits=input.precisionBits??192,maxCells=input.maxCells??1024,tolerance=input.tolerance??'1/10000000000';
  if(!Number.isSafeInteger(precisionBits)||precisionBits<96||precisionBits>512)fail('INVALID_INPUT','Use 96..512 directed arithmetic bits.');
  if(typeof tolerance!=='string')fail('INVALID_INPUT','Tolerance must be an exact rational string, never a rounded decimal Number.');
  const tol=readRational(tolerance);
  if(qcompare(tol,rational(0))<=0||qcompare(tol,rational(1))>0)fail('INVALID_INPUT','The absolute interval-width tolerance must lie in (0,1].');
  if(qcompare(tol,rational(1,1n<<BigInt(precisionBits-24)))<0)fail('PRECISION_REQUIRED','The requested tolerance needs more directed precision; no zero-width result is substituted.');
  if(!Number.isSafeInteger(maxCells)||maxCells<4||maxCells>4096||(maxCells&(maxCells-1)))fail('INVALID_INPUT','maxCells must be a power of two from 4 through 4096.');
  return {precisionBits,tolerance:qtext(tol),maxCells};
}

/** All decisions use exact integers. e^x for x<=0 is enclosed using positive
 * Taylor series on [0,1/8], outward squaring, and an outward reciprocal.
 * A very small value has a positive upper endpoint; it is not replaced by 0.
 */
function elementary(A){
  let degree=0,denominator=1n;
  while(8n*(1n<<BigInt(A.bits+20))>7n*denominator){degree++;denominator=8n**BigInt(degree+1)*factorial(degree+1);}
  const seriesTail=rational(8n,7n*denominator),tailUnits=ceil(seriesTail[0]*A.S,seriesTail[1]);
  let evaluations=0,positiveTinyUpperBounds=0;
  function expPoint(n){
    evaluations++;
    if(n>0n)fail('INTERNAL_VALIDATION','The stable cutoff exponential must have a nonpositive argument.');
    if(n===0n)return A.one();
    const x=-n;
    if(x>=BigInt(A.bits+8)*A.S){positiveTinyUpperBounds++;return [0n,1n];}
    let shifts=0;while(x*8n>A.S*(1n<<BigInt(shifts)))shifts++;
    const small=A.point(rational(x,A.S*(1n<<BigInt(shifts))));
    if(small[1]*8n>A.S+8n)fail('INTERNAL_VALIDATION','Invalid exponential range reduction.');
    // The exact reduced argument is <=1/8. Its outward enclosure can extend
    // one ulp above; intersect with this proved range before the Taylor sum.
    small[1]=small[1]>A.S/8n?A.S/8n:small[1];
    let term=A.one(),sum=A.one();
    for(let k=1;k<=degree;k++){term=divideInteger(A.mul(term,small),k);sum=A.add(sum,term);}
    sum=[sum[0],sum[1]+tailUnits];
    for(let k=0;k<shifts;k++)sum=A.mul(sum,sum);
    return A.div(A.one(),sum);
  }
  const exp=x=>[expPoint(x[0])[0],expPoint(x[1])[1]];
  function expJet(a){
    const out=[exp(a[0])];
    for(let n=1;n<a.length;n++){
      let coefficient=A.zero();
      for(let k=1;k<=n;k++)coefficient=A.add(coefficient,A.mul(A.mul(A.point(k),a[k]),out[n-k]));
      out.push(divideInteger(coefficient,n));
    }
    return out;
  }
  return {expJet,report:()=>({method:'POSITIVE_TAYLOR_RANGE_REDUCTION_OUTWARD_SQUARING_AND_RECIPROCAL',degree,
    reducedArgument:['0','1/8'],positiveSeriesTail:qtext(seriesTail),evaluations,positiveTinyUpperBounds,
    tinyValuePolicy:'For x<=-(bits+8), 0<exp(x)<2^(-bits); enclosure [0,2^(-bits)] preserves a positive upper bound.'})};
}

// Coefficients are f^(k)(s)/k!, for f=σ(1-σ), on the WHOLE supplied cell.
function productJet(A,E,left,right){
  if(qcompare(left,rational(0))<=0||qcompare(right,rational(1,2))>0||qcompare(left,right)>0)fail('INVALID_INPUT','The interior Taylor cell must be contained in (0,1/2].');
  const J=intervalJets(A,ORDER),x=J.c([A.point(left)[0],A.point(right)[1]]);x[1]=A.one();
  const ix=J.inv(x),iy=J.inv(J.sub(J.c(1),x)),z=J.sub(J.mul(iy,iy),J.mul(ix,ix));
  // z(s)<=0 on this exact cell; intersect only the value, not its jets.
  z[0][1]=z[0][1]>0n?0n:z[0][1];
  const e=E.expJet(z),inverse=J.inv(J.add(J.c(1),e));
  return J.mul(e,J.mul(inverse,inverse));
}

/** Numerical kernel for the literal source σ integral. This return value is
 * not an authentication token for a covariance operator or an actual member.
 */
export function encloseSigmaSquareIntegral(input={},context={}){
  const request=requestOf(input),A=directedArithmetic(request.precisionBits),E=elementary(A),tol=readRational(request.tolerance);
  let power=1;while(4n**BigInt(power)<BigInt(A.bits+16))power++;
  const delta=rational(1,1n<<BigInt(power)),oneMinus=rational(delta[1]-delta[0],delta[1]);
  const decay=rational(delta[1]**2n,delta[0]**2n),correction=rational(oneMinus[1]**2n,oneMinus[0]**2n);
  const decayFloor=floor(decay[0]*correction[1]-correction[0]*decay[1],decay[1]*correction[1]);
  // z increases on (0,1/2]; σ(1-σ)<=exp(z). Since e>2,
  // Integral_0^delta f <= delta*2^(-floor(-z(delta))).
  const endpointTail=qmul(delta,rational(1,1n<<decayFloor)),tailUnits=ceil(endpointTail[0]*A.S,endpointTail[1]);
  const length=rational(delta[1]-2n*delta[0],2n*delta[1]),history=[];
  for(let cells=4;cells<=request.maxCells;cells*=2){
    let polynomial=A.zero(),radius=0n;
    const width=qdiv(length,rational(cells)),halfWidth=qdiv(width,rational(2));
    for(let i=0;i<cells;i++){
      context.checkCancelled?.();
      const left=qadd(delta,qmul(width,rational(i))),right=qadd(left,width),center=qadd(left,halfWidth);
      const midpoint=productJet(A,E,center,center),wholeCell=productJet(A,E,left,right);
      for(let k=0;k<ORDER;k+=2)polynomial=A.add(polynomial,A.mul(A.point(qmul(rational(2,k+1),qpow(halfWidth,k+1))),midpoint[k]));
      const c8=abs(wholeCell[ORDER][0])>abs(wholeCell[ORDER][1])?abs(wholeCell[ORDER][0]):abs(wholeCell[ORDER][1]);
      radius+=A.mul(A.point(qmul(rational(2,ORDER+1),qpow(halfWidth,ORDER+1))),[0n,c8])[1];
    }
    const quadratureWidth=4n*radius+2n*tailUnits,arithmeticWidth=2n*(polynomial[1]-polynomial[0]);
    const quadPass=qcompare(rational(2n*quadratureWidth,A.S),tol)<=0,arithmeticPass=qcompare(rational(2n*arithmeticWidth,A.S),tol)<=0;
    history.push({cells,quadratureWidth:qtext(rational(quadratureWidth,A.S)),arithmeticAndElementaryWidth:qtext(rational(arithmeticWidth,A.S)),quadPass,arithmeticPass});
    if(quadPass&&arithmeticPass){
      const j=[polynomial[0]-radius,polynomial[1]+radius+tailUnits],I=[A.S/2n-2n*j[1],A.S/2n-2n*j[0]];
      // Independent exact inequalities: 1/4 <= Integral sigma^2 <= 1/2.
      if(I[0]<A.S/4n||I[1]>A.S/2n||I[0]>I[1])fail('INTERNAL_VALIDATION','The computed source sigmoid integral violates its proved elementary range.');
      return {schema:'MathScope.SourceStepSquareDirectedIntegral/1',status:'COMPLETED',pass:true,request,
        integral:interval(rational(I[0],A.S),rational(I[1],A.S)),integralWidth:qtext(rational(I[1]-I[0],A.S)),
        sourceAuthenticated:false,sourceDefinition:'sigma(s)=exp(-s^-2)/(exp(-s^-2)+exp(-(1-s)^-2)), with sigma=0 for s<=0 and sigma=1 for s>=1.',
        proof:{reflection:'sigma(1-s)=1-sigma(s)',reduction:'Integral_0^1 sigma^2 = 1/2 - 2 Integral_0^(1/2) sigma(1-sigma)',
          interior:['delta','1/2'],delta:qtext(delta),taylorDegree:ORDER-1,wholeCellDerivativeOrder:ORDER,
          cellRemainder:'2*halfWidth^9*sup_cell |f^(8)/8!|/9',endpointTailUpper:qtext(endpointTail),
          endpointTailProof:'z(s)=(1-s)^-2-s^-2 is increasing; f<=exp(z); exp(-m)<2^-m for positive integer m.',
          midpointCoefficientsAreIntervals:true,wholeCellJetsAreIntervals:true},
        errorBudget:{definition:'Absolute width of the normalized sigma-square integral enclosure.',tolerance:request.tolerance,
          quadratureAllocation:qtext(qdiv(tol,rational(2))),arithmeticAllocation:qtext(qdiv(tol,rational(2))),
          quadratureWidth:qtext(rational(quadratureWidth,A.S)),taylorWidth:qtext(rational(4n*radius,A.S)),endpointTailWidth:qtext(rational(2n*tailUnits,A.S)),
          quadratureMeaning:'Validated Taylor and omitted-collar contributions, including outward rounding of their derivative enclosures and radii.',
          arithmeticAndElementaryWidth:qtext(rational(arithmeticWidth,A.S)),
          arithmeticMeaning:'Outward midpoint-jet and polynomial arithmetic plus the explicit elementary exponential-series remainders. No refinement difference is used as a quadrature bound.',
          totalWidth:qtext(rational(I[1]-I[0],A.S)),toleranceMet:true},
        arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false,elementary:E.report()},
        cells,history};
    }
    if(!arithmeticPass&&quadPass)fail('PRECISION_REQUIRED','Directed evaluation width exceeds its error allocation; increase precisionBits.');
  }
  fail('RESOURCE_LIMIT','The verified Taylor remainder exceeds the requested tolerance at maxCells; no uncertified integral is returned.');
}

function originalEllOneLengthEnclosure(operator){
  const {G,geometry:g,constants:{h}}=operator,q=(n,d=1)=>G.q(n,d);
  if(g.ell!==G.one)return null;
  const contract=sourceExponentContract(),logTwo=G.log(q(2)),Tg=G.add(q(4),G.sqrt(q(2)));
  const Q=G.exp(G.neg(G.mul(g.ell,logTwo))),quotient=G.div(G.sub(G.mul(G.add(G.one,h),g.ell,logTwo),G.mul(q(2),G.log(g.ell))),G.log(Tg));
  const paletteIndex=G.neg(G.ceiling(G.neg(quotient))),ci=G.mul(G.exp(G.mul(paletteIndex,G.log(Tg))),G.exp(G.mul(G.add(G.one,h),G.log(Q))));
  if(g.Q!==Q||g.Tg!==Tg||g.paletteIndex!==paletteIndex||g.ci!==ci||g.Ls!==G.div(G.mul(q(2),g.r0),ci)||h!==G.parameter('h')
    ||contract.profileId!==operator.sourceProfile||contract.parameterExpressionSHA256!==operator.parameterExpressionSHA256
    ||contract.upperBoundExact!=='2^-4096'||!contract.positive||!contract.notNumericallyReplaced)
    fail('INVALID_SOURCE_CONSTRUCTION','The original ell=1 Q, palette, ci, length or strict h source contract changed.');
  const lower=rational(1,1n<<32n),upper=qmul(lower,qadd(rational(1),rational(1,1n<<4095n)));
  return {ellExact:'1',roots:{ell:g.ell,Q,Tg,h,paletteIndex,ci,Ls:g.Ls},enclosure:interval(lower,upper),
    exactReduction:'For ell=1 the original Q=exp(-ell*log(2)) equals 1/2; paletteIndex=0; ci=2^(-(1+h)); Ls=2^(-32)*2^h.',
    paletteProof:'0<(1+h)*log(2)/log(4+sqrt(2))<1 because 0<h<1/16 and 4+sqrt(2)>4; its floor is exactly zero.',
    lengthProof:'0<h<2^-4096<1/2 implies 1<2^h<=exp(h)<=1/(1-h)<=1+2*h<1+2^-4095.',
    strictHContract:contract,strictInsideDisplayedClosedInterval:true,hSetToZero:false,LsReplacedByPoint:false};
}

function sourceCutoffBindings(operator){
  assertActualCovarianceOperator(operator);
  const {G,geometry:g,cutoffs:c,coordinates:{v}}=operator,q=(n,d=1)=>G.q(n,d);
  if(g.r0!==q(1,1n<<34n))fail('INVALID_SOURCE_CONSTRUCTION','The original dyadic r0 must be retained.');
  const t=G.div(c.xi,g.r0),absolute=G.sqrt(G.pow(t,2));
  const chi=G.choose(absolute,q(1,4),q(3,4),G.one,G.step(G.sub(q(3,2),G.mul(q(2),absolute))),G.zero);
  const transverse=G.integral(G.pow(chi,2),c.xi,G.neg(g.r0),g.r0);
  const psi=G.mul(G.step(G.sub(G.div(G.mul(q(20),v),g.Ls),q(4))),G.step(G.sub(q(16),G.div(G.mul(q(20),v),g.Ls))));
  if(chi!==c.chi||transverse!==c.transverseMass||psi!==c.psi)fail('INVALID_SOURCE_CONSTRUCTION','The original sigma branches, transition widths or source mass integral changed.');
  const longitudinal=G.integral(G.pow(psi,2),v,G.zero,g.Ls),normalizedLongitudinal=G.div(longitudinal,g.Ls);
  const roots={chi,transverseMass:transverse,psi,longitudinalSquareMass:longitudinal,normalizedLongitudinalSquareMass:normalizedLongitudinal,r0:g.r0,Ls:g.Ls};
  const slowDirections=['R','Z','T'];
  for(const root of [transverse,longitudinal,normalizedLongitudinal])for(const name of slowDirections)if(G.freeCoordinates(root).has(operator.coordinates[name]))fail('INVALID_SOURCE_CONSTRUCTION','A fixed-label cutoff mass unexpectedly depends on a slow coordinate.');
  return {roots,slowDirections,ellOneLength:originalEllOneLengthEnclosure(operator),chiBranches:{plateau:['-1/4','1/4'],transition:'sigma(3/2-2*abs(xi/r0))',outerSupport:['-3/4','3/4']},
    psiBranches:{normalizedPulseCoordinate:'u=v/Ls',leftTransition:['1/5','1/4'],plateau:['1/4','3/4'],rightTransition:['3/4','4/5']},
    literalOriginalBranchesChecked:true,originalHaarMassRootRetained:true,
    reductions:{transverse:'Integral chi^2 dxi = r0*(1/2+I)',longitudinal:'Integral_0^Ls psi^2 dv / Ls = 1/2+I/10',I:'Integral_0^1 sigma(s)^2 ds'},
    slowDerivativeProof:'The authenticated integral roots have no free R, Z or T coordinates when band and labels are frozen.'};
}

/** Attach the directed factors only to a live authentic operator. */
export async function attachActualCutoffMassEnclosure(operator,input={},context={}){
  assertActualCovarianceOperator(operator);const request=requestOf(input);
  if(!sourceSnapshots.has(operator)){
    const nodeCount=operator.G.nodes.length,program={...operator.program,nodes:operator.G.nodes.slice(0,nodeCount)};
    sourceSnapshots.set(operator,{nodeCount,sha256:await sha256(canonicalStringify(program))});
  }
  const sourceBinding=sourceCutoffBindings(operator),sigma=encloseSigmaSquareIntegral(request,context),r0=rational(1,1n<<34n);
  const normalizedTransverseMass=shiftedInterval(sigma.integral,rational(1,2));
  const normalizedLongitudinalSquareMass=shiftedInterval(scaledInterval(sigma.integral,rational(1,10)),rational(1,2));
  const length=sourceBinding.ellOneLength;
  const absoluteLongitudinalMass=length?positiveProductInterval(length.enclosure,normalizedLongitudinalSquareMass):null;
  const bindingNodeCount=operator.G.nodes.length,bindingNodes=JSON.stringify(operator.G.nodes.slice(0,bindingNodeCount));
  const bindingProgram={...operator.program,nodes:operator.G.nodes.slice(0,bindingNodeCount),cutoffMassEnclosure:sourceBinding};
  const result={schema:'MathScope.ActualCutoffMassEnclosure/1',status:'COMPLETED',pass:true,request,
    sourceProfile:operator.sourceProfile,parameterExpressionSHA256:operator.parameterExpressionSHA256,
    sourceProgram:{...sourceSnapshots.get(operator),compiler:'actual-covariance-source-operator.mjs:prepareActualCovarianceOperator',ellExact:operator.program.band.ellExact,
      hashDomain:'Authentic covariance operator program at first attachment, before cutoff checker appends.'},
    bindingProgram:{nodeCount:bindingNodeCount,sha256:await sha256(canonicalStringify(bindingProgram)),
      hashDomain:'Authentic source program and the appended literal longitudinal integral roots, with the cutoff reduction bindings.'},
    sourceBinding,sigmaIntegral:sigma,
    values:{normalizedTransverseMass,transverseMass:scaledInterval(normalizedTransverseMass,r0),normalizedLongitudinalSquareMass,
      longitudinalSquareMass:{coefficient:normalizedLongitudinalSquareMass,positiveExactScaleRoot:operator.geometry.Ls,
        ...(length?{scaleEnclosure:length.enclosure,absoluteEnclosure:absoluteLongitudinalMass,
          absoluteWidthBudget:{normalizedIntegralContribution:qtext(qmul(readRational(length.enclosure.lower),qdiv(readRational(sigma.integralWidth),rational(10)))),
            originalLengthEnclosureContribution:qtext(qmul(qsub(readRational(length.enclosure.upper),readRational(length.enclosure.lower)),readRational(normalizedLongitudinalSquareMass.upper))),
            totalWidth:qtext(qsub(readRational(absoluteLongitudinalMass.upper),readRational(absoluteLongitudinalMass.lower))),
            exactRationalProducts:true,additionalFloatingRounding:'0',requestedToleranceIsForNormalizedSigmaIntegral:true}}:{}),
        meaning:length?'The original Ls remains bound to its expression; its strict source interval gives an absolute rational enclosure of the whole longitudinal mass.':
          'The whole longitudinal mass is Ls times this rational interval. Ls remains the original exact source expression; no absolute numerical enclosure of Ls is claimed for this band.'}},
    slowDerivatives:{first:sourceBinding.slowDirections.map(coordinate=>({coordinate,transverseMass:{lower:'0',upper:'0'},longitudinalSquareMass:{lower:'0',upper:'0'}})),
      symmetricSecond:['RR','RZ','RT','ZZ','ZT','TT'].map(coordinate=>({coordinate,transverseMass:{lower:'0',upper:'0'},longitudinalSquareMass:{lower:'0',upper:'0'}})),
      proof:sourceBinding.slowDerivativeProof},
    checks:[{id:'authentic-unchanged-source-operator',pass:true},{id:'literal-original-sigma-branches-and-mass-root',pass:sourceBinding.literalOriginalBranchesChecked},
      {id:'directed-numerical-sigma-square-integral-with-split-error-budget',pass:sigma.errorBudget.toleranceMet},
      {id:'actual-transverse-and-longitudinal-reductions',pass:true},{id:'fixed-label-slow-mass-derivatives',pass:true},
      ...(length?[{id:'original-ell-one-length-and-absolute-longitudinal-mass',pass:true}]:[])],
    scope:{actualSourceCutoffFactorsNumericallyEnclosed:true,actualTransverseMassAbsoluteEnclosure:true,actualNormalizedLongitudinalSquareMassEnclosure:true,
      actualLongitudinalSquareMassAbsoluteEnclosure:!!length,actualOriginalLsNumericallyEnclosed:!!length,LsNumericallyReplacedByPoint:false,
      originalHRecomputed:false,actualVolterraSolutionNumericallyEnclosed:false,actualSlowPulseDerivativeNumericallyEnclosed:false,
      positiveWeightsOfExercisedMemberCertified:false,actualFullCurlNumericalEnclosure:false,fullPhysicalResidualAndFlatErrorPackageComplete:false,
      wholeGNUMComplete:false,newLeanKernelProof:false,hNumericallyReplacedByZero:false,sourceAuthenticated:true},
    interpretation:'Two actual cutoff integral factors and their fixed-label zero slow derivatives are enclosed. H, its weights, pulse derivatives and the full curl require their own source numerical enclosures.'};
  assertActualCovarianceOperator(operator);
  if(JSON.stringify(operator.G.nodes.slice(0,bindingNodeCount))!==bindingNodes)fail('INVALID_SOURCE_CONSTRUCTION','The cutoff integral program changed while its numerical result was being sealed.');
  seals.set(result,{operator,bindingNodeCount,bindingNodes,data:canonicalStringify(result)});return result;
}

export function assertActualCutoffMassEnclosure(result){
  const seal=seals.get(result);
  if(!seal||canonicalStringify(result)!==seal.data)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged live cutoff-factor enclosure; a copied or edited receipt is not an authentication token.');
  assertActualCovarianceOperator(seal.operator);
  if(JSON.stringify(seal.operator.G.nodes.slice(0,seal.bindingNodeCount))!==seal.bindingNodes)fail('INVALID_SOURCE_CONSTRUCTION','An authenticated cutoff integral body was changed after numerical enclosure.');
  sourceCutoffBindings(seal.operator);return true;
}

export async function actualCutoffMassEnclosure(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','ellExact','precisionBits','tolerance','maxCells'].includes(k)))fail('INVALID_INPUT','Use the original source selector and directed integration controls only.');
  const {sourceProfile=SOURCE_PROFILE_ID,ellExact='1',...controls}=input;
  if(ellExact!=='1')fail('RESOURCE_LIMIT','The exercised factory is limited to original ellExact:1; other members are not replaced by it.');
  requestOf(controls);
  const operator=prepareActualCovarianceOperator({sourceProfile,ellExact},context);
  return attachActualCutoffMassEnclosure(operator,controls,context);
}
