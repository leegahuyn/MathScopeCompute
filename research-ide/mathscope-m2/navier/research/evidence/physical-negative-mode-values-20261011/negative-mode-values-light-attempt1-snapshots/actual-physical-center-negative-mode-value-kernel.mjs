/** Fresh exact arithmetic for the two raw coupled w_minus center values.
 * This generic module has NO source authentication authority. A separately
 * pinned, executed source certificate must bind the same original centers,
 * B/S inequalities and invariant cone. No source graph is reconstructed.
 */
import {rational as Q,readRational,qcompare,qsub,qtext,fail} from './actual-continuation-arithmetic.mjs';

const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const root=x=>Number.isSafeInteger(x)&&x>=0;
const BASE_POWER=128n,SCALE_POWER=1024n,CONE_POWER=260n,CENTER_HALF_POWER=1n;

function requestControls(input){
  if(!object(input)||Object.keys(input).some(k=>!['sourceProfile','precisionBits','tolerance','maxCutoffCells','maxTargetCells'].includes(k)))
    fail('INVALID_INPUT','Only the fresh runtime precision and exact width controls are accepted; the source cone powers cannot be supplied by a caller.');
  const precisionBits=input.precisionBits??192,tolerance=input.tolerance??'1/1000000000000';
  if(!Number.isSafeInteger(precisionBits)||precisionBits<192||precisionBits>512||typeof tolerance!=='string')
    fail('INVALID_INPUT','Use192..512 bits and an exact rational STRING tolerance.');
  const tol=readRational(tolerance);
  if(qcompare(tol,Q(0))<=0||qcompare(tol,Q(1,100))>0)
    fail('INVALID_INPUT','The requested absolute interval width lies in(0,1/100].');
  return {precisionBits,tolerance:qtext(tol)};
}

function checkedCenter(box){
  if(!object(box)||typeof box.lower!=='string'||typeof box.upper!=='string')
    fail('INVALID_INPUT','Each fresh w_plus center interval needs exact rational STRING endpoints.');
  // Display-only binary64 metadata is never read for this comparison.
  const lower=readRational(box.lower),upper=readRational(box.upper);
  if(qcompare(lower,upper)>0||qcompare(lower,Q(0))<=0||qcompare(upper,Q(1,2))>=0)
    fail('INVALID_INPUT','The fresh w_plus center interval must prove0<lower<=upper<1/2.');
  return {lower:qtext(lower),upper:qtext(upper)};
}

/** centers[i] is the fresh rational w_plus box for originalBindings[i].
 * originalBindings[i] has exactly {sign,centerRoot,negativeModeRoot}.
 * The wrapper must authenticate that positional correspondence against the
 * original physical certificate; root IDs alone never prove provenance.
 */
export function enclosePhysicalCenterNegativeModeValues(centers,originalBindings,controls={},context={}){
  const request=requestControls(controls),tol=readRational(request.tolerance);
  if(!Array.isArray(centers)||!Array.isArray(originalBindings)||centers.length!==2||originalBindings.length!==2)
    fail('INVALID_INPUT','Supply the two original sign families and their two fresh w_plus center intervals.');
  const seenSigns=new Set(),seenRoots=new Set(),bindings=originalBindings.map(binding=>{
    if(!object(binding)||Object.keys(binding).some(k=>!['sign','centerRoot','negativeModeRoot'].includes(k))||
      ![1,-1].includes(binding.sign)||!root(binding.centerRoot)||!root(binding.negativeModeRoot))
      fail('INVALID_INPUT','Each original family binding needs sign+1 or−1 and its exact center and raw negative-mode root IDs.');
    if(seenSigns.has(binding.sign)||seenRoots.has(binding.centerRoot)||seenRoots.has(binding.negativeModeRoot)||binding.centerRoot===binding.negativeModeRoot)
      fail('INVALID_INPUT','Original family signs and all four center component roots must be distinct.');
    seenSigns.add(binding.sign);seenRoots.add(binding.centerRoot);seenRoots.add(binding.negativeModeRoot);
    return {...binding};
  });
  context.checkCancelled?.();context.onProgress?.({stage:'fresh-raw-negative-mode-value-bounds-start',rows:2});
  const centerBoxes=centers.map(checkedCenter),remainingPower=SCALE_POWER-CONE_POWER,
    radiusExponent=BASE_POWER*remainingPower+CENTER_HALF_POWER,bits=BigInt(request.precisionBits),
    denominator=1n<<bits,positiveGridRadius=Q(1,denominator),width=Q(2,denominator),
    exactRadius={kind:'EXACT_POSITIVE_DYADIC',numerator:'1',denominatorPowerOfTwo:Number(radiusExponent)},
    exponentChecks=[
      {id:'source-scale-power-dominates-cone-power',left:String(SCALE_POWER),relation:'>',right:String(CONE_POWER),pass:remainingPower>0n},
      {id:'exact-raw-negative-mode-radius-exponent',left:String(radiusExponent),relation:'=',right:'97793',pass:radiusExponent===97793n},
      {id:'outward-grid-is-strictly-wider-than-the-positive-source-radius',left:String(bits),relation:'<',right:String(radiusExponent),pass:bits<radiusExponent}
    ];
  if(exponentChecks.some(r=>!r.pass))fail('INTERNAL_VALIDATION','The exact integer cone-to-value exponent or outward rounding comparison failed.');
  if(qcompare(width,tol)>0)
    fail('PRECISION_REQUIRED','The fresh outward dyadic interval exceeds the requested absolute width; the positive source radius is never rounded to zero.');
  const rows=bindings.map((binding,i)=>({
    rowKey:['wMinus',binding.sign,1,'VALUE'].join(':'),quantity:'wMinus',sign:binding.sign,component:1,derivative:'VALUE',order:0,
    sourceRoot:binding.negativeModeRoot,originalCenterRoot:binding.centerRoot,
    positiveCenterInterval:{...centerBoxes[i]},exactAbsoluteBound:{...exactRadius},
    directedInterval:{lower:qtext(Q(-1,denominator)),upper:qtext(positiveGridRadius),denominatorPowerOfTwo:request.precisionBits},
    width:qtext(width),tolerance:request.tolerance,toleranceMet:true,positiveErrorRadius:qtext(positiveGridRadius),
    normalization:{exactFactor:'1',normalizedRadialPower:0,originalRawCoupledMode:true},
    interpretation:'The original second component w_minus of this sign family, at the same new physical-center representative and v=Ls/2. This is a VALUE, without Ac, u, A0 or a radial derivative factor.',
    zeroContained:true,identicallyZeroClaimed:false,sourceAuthenticated:false
  }));
  const checks=[...exponentChecks,
    {id:'both-original-sign-families-and-component-roots-are-distinct',pass:seenSigns.size===2&&seenRoots.size===4},
    {id:'fresh-exact-w-plus-boxes-prove-positive-and-below-half',pass:centerBoxes.length===2},
    {id:'fresh-symmetric-rational-intervals-are-positive-width-and-meet-tolerance',pass:rows.every(row=>qcompare(readRational(row.width),Q(0))>0&&
      qcompare(qsub(readRational(row.directedInterval.upper),readRational(row.directedInterval.lower)),readRational(row.width))===0&&qcompare(readRational(row.width),tol)<=0)},
    {id:'no-source-authentication-or-exact-zero-is-created-by-arithmetic',pass:rows.every(row=>row.sourceAuthenticated===false&&!row.identicallyZeroClaimed)}
  ];
  if(checks.some(row=>!row.pass))fail('INTERNAL_VALIDATION','The fresh raw negative-mode value postprocessing failed.');
  context.checkCancelled?.();context.onProgress?.({stage:'fresh-raw-negative-mode-value-bounds-complete',rows:2});
  return {schema:'MathScope.PhysicalCenterNegativeModeValues/1',pass:true,request,rows,checks,
    proof:{
      premise:'The same original source has B>=2^128, S>=B^1024 and w_plus>0 with |w_minus/w_plus|<=B^260/S. Each supplied fresh box encloses its original w_plus.',
      implication:'|w_minus|< (1/2)*(B^260/S) <= (1/2)*B^(-764) <= 2^(-97793).',
      exponentIdentity:{basePower:String(BASE_POWER),scalePower:String(SCALE_POWER),conePower:String(CONE_POWER),remainingPower:String(remainingPower),
        centerHalfPower:String(CENTER_HALF_POWER),radiusExponent:String(radiusExponent),equation:'128*(1024-260)+1=97793',computedWith:'EXACT_BIGINT'},
      exactPositiveAnalyticRadius:{...exactRadius},
      directedRounding:'Since192<=bits<=512<97793, rounding the nonzero exact radius2^-97793 outward to the bits dyadic grid gives one grid unit2^-bits. Both signed endpoints are retained.',
      fullCoupledModeRetained:true,referenceUncoupledModeSubstituted:false,centerCoefficientScalingApplied:false
    },
    sourceRequirements:{
      authentication:'PINNED_EXECUTED_EXTERNAL_SOURCE_CERTIFICATE_REQUIRED',
      paths:['sourceBounds.roots.B','sourceBounds.roots.S','sourceBounds.derivation.base','sourceBounds.derivation.band','sourceBounds.derivation.cone',
        'rows[i].sign','rows[i].center.a','rows[i].center.other','rows[i].checks','numerics.values.centers[i]'],
      actualCoupledSystemAndUnitInitialDataRequired:true,originalCorrectedPhysicalMapRequired:true,
      freshCenterOrderMustMatchOriginalBindings:true,originalRootIDsAloneAuthenticateNothing:true,
      callerBooleansPromoteSourceAuthority:false
    },
    arithmetic:{kind:'EXACT_BIGINT_RATIONAL_OUTWARD_DYADIC',precisionBits:request.precisionBits,largestConstructedDyadicDenominatorExponent:request.precisionBits,
      giantSourceBOrSConstructed:false,giantAnalyticRadiusDenominatorConstructed:false,binary64UsedForDecisions:false},
    precision:{absoluteValueWidthRequested:true,scaledCoefficientToleranceReinterpretedAsRelativeError:false,relativeErrorGuaranteed:false,
      bothStrictlyPositiveErrorRadiiRetained:true},
    scope:{valueRowsAdded:2,existingDerivativeRowCountChanged:false,negativeModeDistinctFromNegativeSignFamily:true,
      actualSourceGraphReconstructed:false,privateSourceTokenCreated:false,actualSourcePointAuthenticated:false,wholeGNUMComplete:false},
    sourceAuthenticated:false
  };
}
