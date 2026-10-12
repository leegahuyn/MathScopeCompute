/** Exact inverse of the ORIGINAL auxiliary-time direction on the two-torus.
 *
 * These calculus kernels retain explicit Fourier integrals and a genuine
 * tail. They grant no source authority. A private source caller must bind
 * the smooth periodic body, its slow parameters, and its zero-mean role.
 * No caller-provided derivative bound, divisor, pi or direction is accepted.
 */
import {rational,qtext} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const copy=value=>structuredClone(value),piCache=new WeakMap(),boundCache=new WeakMap();
const MAX_FINITE_CUTOFF=8,MAX_OUTPUT_ORDER=8,MAX_BOUND_ORDER=12;

function object(input,keys){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!keys.includes(key)))
    fail('INVALID_INPUT','Use only the explicit source body, its two torus coordinates, and the supported numerical controls. Caller source bounds and replacement constants are forbidden.');
}
function bodyCoordinates(G,body,Y){
  if(!G?.nodes?.[body]||!Array.isArray(Y)||Y.length!==2||Y[0]===Y[1]||Y.some(id=>G.nodes[id]?.op!=='coordinate'))
    fail('INVALID_INPUT','An auxiliary torus body needs an existing expression and two distinct independent coordinates.');
  for(const name of ['q','add','sub','mul','div','pow','sqrt','sine','cosine','integral','derivative','substitute','simultaneousSubstitute','freeCoordinates','fresh'])
    if(typeof G[name]!=='function')fail('INVALID_INPUT','The expression graph is missing '+name+'.');
}
function integer(value,name,{zero=true,maxBits=4096}={}){
  if(typeof value==='number'&&!Number.isSafeInteger(value))fail('INVALID_INPUT',name+' must be an exact integer.');
  if(!['number','string','bigint'].includes(typeof value)||!/^[-]?(?:0|[1-9]\d*)$/.test(String(value)))
    fail('INVALID_INPUT',name+' must be an exact canonical integer.');
  const n=BigInt(value),absolute=n<0n?-n:n;
  if(absolute.toString(2).length>maxBits||(!zero&&n===0n))fail('INVALID_INPUT',name+' exceeds its exact integer domain.');
  return n;
}
function mode(k,{zero=false}={}){
  if(!Array.isArray(k)||k.length!==2)fail('INVALID_INPUT','A Fourier frequency has exactly two integer components.');
  const out=k.map((value,j)=>integer(value,'Fourier frequency '+j));
  if(!zero&&out.every(value=>value===0n))fail('ZERO_MODE_NOT_INVERTIBLE','The original auxiliary-time operator has no inverse on its zero Fourier mode.');
  return out;
}
const absolute=n=>n<0n?-n:n;
const order=(value,maximum,name)=>{
  if(!Number.isSafeInteger(value)||value<0||value>maximum)fail('RESOURCE_LIMIT',name+' must be an integer from 0 through '+maximum+'.');
  return value;
};

/** pi=4*atan(1), retaining its exact real integral instead of Math.PI. */
export function exactAuxiliaryPi(G){
  if(piCache.has(G))return copy(piCache.get(G));
  const variable=G.fresh('n6_exact_pi_t'),integrand=G.div(G.one,G.add(G.one,G.pow(variable,2))),
    integral=G.integral(integrand,variable,G.zero,G.one),value=G.mul(G.q(4),integral),
    result={value,variable,integrand,integral,definition:'pi=4*integral_0^1 1/(1+t^2) dt',
      binary64:null,sourceAuthenticated:false};
  piCache.set(G,copy(result));return result;
}

/** k.v_t=(k1-k0)+k0*sqrt(2), v_t=(sqrt(2)-1,1).
 * The reciprocal is calculated in Q(sqrt(2)); cancellation never passes
 * through binary64. A nonzero integer norm is separated from zero exactly.
 */
export function exactAuxiliaryDivisor(G,k){
  const [k0,k1]=mode(k),m=k1-k0,n=k0,integerNorm=m*m-2n*n*n,
    maximum=absolute(k0)>absolute(k1)?absolute(k0):absolute(k1);
  if(integerNorm===0n)fail('ZERO_MODE_NOT_INVERTIBLE','The exact quadratic norm vanished; the zero mode cannot be inverted.');
  const sqrtTwo=G.sqrt(G.q(2)),value=G.add(G.q(m),G.mul(G.q(n),sqrtTwo)),
    conjugate=G.sub(G.q(m),G.mul(G.q(n),sqrtTwo)),reciprocal=G.div(conjugate,G.q(integerNorm)),
    inverseAbsUpper=G.mul(G.add(G.q(2),sqrtTwo),G.q(maximum));
  if(G.nodes[sqrtTwo]?.op!=='sqrt_positive'||G.nodes[sqrtTwo].args[0]!==G.q(2))
    fail('INVALID_INPUT','The divisor requires the exact positive square root of the rational two.');
  return {schema:'MathScope.N6.ExactAuxiliaryDivisor/1',mode:[String(k0),String(k1)],
    direction:['sqrt(2)-1','1'],quadratic:{m:String(m),n:String(n),integerNorm:String(integerNorm),
      reciprocalRational:qtext(rational(m,integerNorm)),reciprocalSqrtTwo:qtext(rational(-n,integerNorm))},
    sqrtTwo,value,conjugate,reciprocal,inverseAbsUpper,maxFrequency:String(maximum),
    proof:{integerNormNonzero:integerNorm!==0n,integerNormAbsAtLeastOne:absolute(integerNorm)>=1n,
      exactNormIdentity:'(m+n*sqrt(2))*(m-n*sqrt(2))=m^2-2*n^2',
      inverseBound:'|1/(v_t.k)| <= |m|+sqrt(2)*|n| <= (2+sqrt(2))*max(|k0|,|k1|)',
      mBoundChecked:absolute(m)<=2n*maximum,nBoundChecked:absolute(n)<=maximum,
      zeroModeInverted:false,binary64UsedForNonzeroDecision:false},sourceAuthenticated:false};
}

function unitTorusIntegral(G,body,Y,tag){
  const variables=Y.map((_,j)=>G.fresh('n6_fourier_'+tag+'_y'+j)),
    integrand=G.simultaneousSubstitute(body,Y,variables),
    inner=G.integral(integrand,variables[1],G.zero,G.one),value=G.integral(inner,variables[0],G.zero,G.one);
  if(Y.some(y=>G.freeCoordinates(value).has(y)))fail('INVALID_INPUT','A Fourier coefficient retained a torus coordinate after integration.');
  return {value,variables,integrand,inner,outer:value,normalizedHaarMass:'1'};
}

/** Actual real Fourier coefficient integrals. The zero coefficient may be
 * extracted here, but exactAuxiliaryDivisor never inverts it.
 */
export function actualFourierCoefficient(G,input){
  object(input,['body','Y','k']);const {body,Y}=input;bodyCoordinates(G,body,Y);
  const k=mode(input.k,{zero:true}),pi=exactAuxiliaryPi(G),twoPi=G.mul(G.q(2),pi.value),
    phase=G.mul(twoPi,G.add(...Y.map((y,j)=>G.mul(G.q(k[j]),y)))),
    cosine=G.cosine(phase),sine=G.sine(phase),
    cosineIntegral=unitTorusIntegral(G,G.mul(body,cosine),Y,'cos'),
    sineIntegral=unitTorusIntegral(G,G.mul(body,sine),Y,'sin');
  return {schema:'MathScope.N6.ActualAuxiliaryFourierCoefficient/1',body,Y:[...Y],mode:k.map(String),
    pi:copy(pi),twoPi,phase,cosine,sine,C:cosineIntegral.value,S:sineIntegral.value,
    cosineIntegral,sineIntegral,complexConvention:'Fhat(k)=C_k-i*S_k',
    zeroMode:k.every(value=>value===0n),coefficientIsExactIntegral:true,numericalQuadratureValueSupplied:false,
    slowParameters:[...G.freeCoordinates(body)].filter(id=>!Y.includes(id)),sourceAuthenticated:false};
}

/** A two-dimensional anchored FTC bound, with slow parameters still free:
 * |g(x,y)| <= |g(0,0)| + int|g_x(u,0)| + int|g_y(0,v)|
 *              + int int|g_xy(u,v)|.
 * Each absolute value is bounded by sqrt(1+g^2). Both pure derivatives of
 * the requested order are evaluated from the ACTUAL supplied body.
 */
export function sourceTorusDerivativeBound(G,input){
  object(input,['body','Y','derivativeOrder']);const {body,Y}=input;bodyCoordinates(G,body,Y);
  const derivativeOrder=order(input.derivativeOrder,MAX_BOUND_ORDER,'The source torus derivative order'),
    key=[body,...Y,derivativeOrder].join(':'),cache=boundCache.get(G)??new Map();boundCache.set(G,cache);
  if(cache.has(key))return copy(cache.get(key));
  const absBound=value=>G.sqrt(G.add(G.one,G.pow(value,2))),faces=[];
  for(let axis=0;axis<2;axis++){
    let derivative=body;for(let j=0;j<derivativeOrder;j++)derivative=G.derivative(derivative,Y[axis]);
    const first=G.derivative(derivative,Y[0]),second=G.derivative(derivative,Y[1]),mixed=G.derivative(first,Y[1]),
      u=G.fresh('n6_fourier_ftc_u'),v=G.fresh('n6_fourier_ftc_v'),
      at00=G.simultaneousSubstitute(derivative,Y,[G.zero,G.zero]),
      firstAt=G.simultaneousSubstitute(first,Y,[u,G.zero]),secondAt=G.simultaneousSubstitute(second,Y,[G.zero,v]),
      mixedAt=G.simultaneousSubstitute(mixed,Y,[u,v]),
      anchor=absBound(at00),xFace=G.integral(absBound(firstAt),u,G.zero,G.one),
      yFace=G.integral(absBound(secondAt),v,G.zero,G.one),
      mixedFace=G.integral(G.integral(absBound(mixedAt),v,G.zero,G.one),u,G.zero,G.one),
      upper=G.add(anchor,xFace,yFace,mixedFace);
    if(Y.some(y=>G.freeCoordinates(upper).has(y)))fail('INVALID_INPUT','The anchored FTC bound was not uniform in both torus coordinates.');
    faces.push({axis,derivativeOrder,derivative,first,second,mixed,anchor,xFace,yFace,mixedFace,upper,
      integrationVariables:[u,v],sourceExpressions:{at00,firstAt,secondAt,mixedAt}});
  }
  const upper=G.maximum(...faces.map(row=>row.upper)),result={schema:'MathScope.N6.SourceTorusDerivativeBound/1',body,Y:[...Y],
    derivativeOrder,upper,faces,slowParameters:[...G.freeCoordinates(upper)],
    boundMeaning:'C bounds sup|partial_y0^r F| and sup|partial_y1^r F| on the unit torus at each fixed slow parameter.',
    proof:'Apply the two-dimensional fundamental theorem of calculus at (0,0) to each pure derivative. Bound each absolute derivative by sqrt(1+derivative^2), integrate over each full unit face, and take the larger bound.',
    highestGeneratedTorusDerivativeTotalOrder:derivativeOrder+2,callerNumericalBoundsAccepted:false,
    smoothPeriodicBodyPremiseMustBeBoundBySource:true,sourceAuthenticated:false};
  cache.set(key,copy(result));return result;
}

/** Complete omitted-square tail for every output multi-index |alpha|=m.
 * Pure r=m+4 integrations by parts give Fourier decay |k|max^-r;
 * the original quadratic divisor costs one power, and each 2D max-norm
 * shell has exactly 8n points. Sum_(n>K)n^-2 <= 1/K.
 */
export function auxiliaryInverseTail(G,input){
  object(input,['body','Y','cutoff','derivativeOrder']);const {body,Y}=input;bodyCoordinates(G,body,Y);
  const cutoff=integer(input.cutoff,'The Fourier cutoff',{zero:false});
  if(cutoff<1n)fail('INVALID_INPUT','The Fourier cutoff must be positive.');
  const derivativeOrder=order(input.derivativeOrder??0,MAX_OUTPUT_ORDER,'The requested output derivative order'),
    sourceOrder=derivativeOrder+4,bound=sourceTorusDerivativeBound(G,{body,Y,derivativeOrder:sourceOrder}),
    pi=exactAuxiliaryPi(G),twoPi=G.mul(G.q(2),pi.value),constant=G.mul(G.q(8),G.add(G.q(2),G.sqrt(G.q(2)))),
    upper=G.div(G.mul(constant,bound.upper),G.mul(G.pow(twoPi,5),G.q(cutoff)));
  return {schema:'MathScope.N6.AuxiliaryInverseTail/1',cutoff:String(cutoff),derivativeOrder,sourceDerivativeOrder:sourceOrder,
    sourceBound:bound,pi:copy(pi),upper,exactFormula:'8*(2+sqrt(2))*C_(m+4)/((2*pi)^5*K)',
    lattice:'All k in Z^2 with max(|k0|,|k1|)>K',shellCount:'8*n',
    proof:['For the largest nonzero frequency component, r=m+4 integrations by parts give |Fhat(k)|<=C_r/((2*pi)^r*|k|max^r).',
      '|1/(v_t.k)|<=(2+sqrt(2))*|k|max, and an output torus derivative of total order m contributes at most (2*pi)^m*|k|max^m.',
      'Each max-norm shell n has 8n lattice points; its total is bounded by 8*(2+sqrt(2))*C_r/(2*pi)^5*n^-2.',
      'The positive decreasing-series bound sum_(n=K+1)^infinity n^-2 <= integral_K^infinity x^-2 dx = 1/K retains every omitted mode.'],
    tailTendsToZero:true,finiteCutoffDeclaredExact:false,omittedModesSetToZero:false,
    periodicIntegrationByPartsPremiseMustBeBoundBySource:true,sourceAuthenticated:false};
}

/** Real half-lattice finite sum of the zero-average inverse. The original
 * Haar zero mode is retained separately and is never divided by zero. The
 * exact inverse still consists of this finite sum PLUS the recorded tail.
 */
export function finiteAuxiliaryInverse(G,input){
  object(input,['body','Y','cutoff','derivativeOrders']);const {body,Y}=input;bodyCoordinates(G,body,Y);
  const cutoff=input.cutoff??2;
  if(!Number.isSafeInteger(cutoff)||cutoff<1||cutoff>MAX_FINITE_CUTOFF)
    fail('RESOURCE_LIMIT','The explicit finite auxiliary inverse uses cutoff 1 through '+MAX_FINITE_CUTOFF+'. Its omitted-mode tail remains separate.');
  const requested=input.derivativeOrders??[0];
  if(!Array.isArray(requested)||!requested.length||requested.length>MAX_OUTPUT_ORDER+1||new Set(requested).size!==requested.length)
    fail('INVALID_INPUT','Request distinct finite output derivative orders.');
  const derivativeOrders=requested.map(value=>order(value,MAX_OUTPUT_ORDER,'The output derivative order')).sort((a,b)=>a-b),
    mean=actualFourierCoefficient(G,{body,Y,k:[0,0]}),centeredBody=G.sub(body,mean.C),rows=[];
  for(let k0=0;k0<=cutoff;k0++)for(let k1=-cutoff;k1<=cutoff;k1++){
    if(k0===0&&k1<=0)continue;
    const k=[k0,k1],coefficient=actualFourierCoefficient(G,{body:centeredBody,Y,k}),divisor=exactAuxiliaryDivisor(G,k),
      numerator=G.sub(G.mul(coefficient.C,coefficient.sine),G.mul(coefficient.S,coefficient.cosine)),
      value=G.mul(G.q(2),G.div(divisor.reciprocal,coefficient.twoPi),numerator),
      sourceProjection=G.mul(G.q(2),G.add(G.mul(coefficient.C,coefficient.cosine),G.mul(coefficient.S,coefficient.sine)));
    rows.push({mode:k,coefficient,divisor,value,sourceProjection,
      identity:'N[2*(C*sin(2*pi*k.y)-S*cos(2*pi*k.y))/(2*pi*(v_t.k))]=2*(C*cos(2*pi*k.y)+S*sin(2*pi*k.y))',
      bothConjugateModesIncluded:true});
  }
  const value=G.add(...rows.map(row=>row.value)),sourceProjection=G.add(...rows.map(row=>row.sourceProjection)),
    tails=derivativeOrders.map(derivativeOrder=>auxiliaryInverseTail(G,{body:centeredBody,Y,cutoff,derivativeOrder}));
  return {schema:'MathScope.N6.FiniteAuxiliaryInverse/1',body,Y:[...Y],cutoff,derivativeOrders,
    direction:['sqrt(2)-1','1'],haarMean:mean,centeredBody,value,sourceProjection,rows,tails,
    halfLatticeRule:'k0>0 or (k0=0 and k1>0), with max(|k0|,|k1|)<=K',
    pairCount:rows.length,fullLatticeModeCount:2*rows.length,
    inverseMeaning:'Finite Fourier part of N^-1(F-HaarMean(F)); the Haar zero mode is returned separately and every omitted mode is bounded by the retained tails.',
    zeroMode:{value:mean.C,retainedSeparately:true,inverted:false},
    physicalTemporalFactorNotApplied:true,slowTimeResidualNotDiscarded:true,
    sourceProjectionIdentityUsesExactDivisors:true,sourceSmoothPeriodicityRequired:true,
    finiteSumClaimedWholeInverse:false,omittedTailRetained:true,sourceAuthenticated:false};
}
