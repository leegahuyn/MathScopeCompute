/** Source-defined nonzero core point enclosures of the actual n=1 solution.
 * The common Picard interval is unchanged.  A smaller *observation Cauchy
 * disc* yields rigorous remainder bounds for a finite set of explicitly
 * positive radii.  Changing locationScaleBits changes those radii; this is
 * not fixed-point precision refinement or a physical residual-decay test.
 */
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {actualBackgroundMajorant} from './actual-background-majorant.mjs';
import {actualBackgroundAxisObservations} from './actual-background-observations.mjs';
import {nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
const q=(a,b=1n)=>{a=BigInt(a);b=BigInt(b);if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return [a/g,b/g];};
const read=s=>{const [a,b='1']=s.split('/');return q(a,b);};
const str=a=>a[1]===1n?String(a[0]):a[0]+'/'+a[1];
const add=(a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),cmp=(a,b)=>{const d=a[0]*b[1]-b[0]*a[1];return d<0n?-1:d>0n?1:0;};
function floatQ(x){if(!Number.isFinite(x))throw Error('Expected finite normalized point value');if(x===0)return q(0);const d=new DataView(new ArrayBuffer(8));d.setFloat64(0,x);const b=d.getBigUint64(0),s=b>>63n?-1n:1n,e=Number((b>>52n)&2047n),m=(b&((1n<<52n)-1n))+(e===0?0n:1n<<52n),p=(e===0?-1022:e-1023)-52;return p>=0?q(s*m*(1n<<BigInt(p))):q(s*m,1n<<BigInt(-p));}
function directed(a,side){let n=a[0]*(1n<<64n),v=n/a[1];if(n<0n&&n%a[1])v--;let x=Number(v)/2**64;for(let k=0;k<8;k++){if(side<0?cmp(floatQ(x),a)<=0:cmp(floatQ(x),a)>=0)return x;x=side<0?nextDown(x):nextUp(x);}throw Error('Unable to enclose a normalized actual point value');}
const I=n=>({integer:String(n)}),R=name=>({ref:name}),P=(a,n)=>({power:[a,n]}),M=(...a)=>({product:a}),D=(a,b)=>({quotient:[a,b]});

export function actualBackgroundPointEnclosures({profileId=SOURCE_PROFILE_ID,locationScaleBits=96}={}){
  const source=assertSourceProfile(profileId);if(!Number.isSafeInteger(locationScaleBits)||locationScaleBits<16||locationScaleBits>4096)throw Error('locationScaleBits must be an integer from 16 to 4096.');
  const majorant=actualBackgroundMajorant({profileId,bits:locationScaleBits}),axis=actualBackgroundAxisObservations({profileId}),eps=q(1,1n<<BigInt(locationScaleBits));
  const quantities={
    observationCauchyRadiusX:D(I(3),R('Lambda')),
    observationPicardASquared:M(P(R('C1'),2),R('observationCauchyRadiusX')),
    logObservationSolutionNorm:D(M(I(9),R('observationPicardASquared')),M(I(2),R('cauchyRadiusLoss'))),
    observationSolutionNorm:{exp:R('logObservationSolutionNorm')},
    observationScaleBound:{sum:[I(1),D(M(I(4),R('CSelected'),P(R('j0'),2)),P(R('Lambda'),2)),D(I(1),R('j0')),D(I(1),R('K'))]},
    observationXUnit:D(M(P(R('observationCauchyRadiusX'),2),P(I(2),-locationScaleBits)),M(I(32),R('observationSolutionNorm'),R('observationScaleBound'))),
  };
  const samples=[];
  for(let i=1;i<=5;i++)for(let j=0;j<axis.samples.length;j++){
    const a=axis.samples[j],lo=add(read(a.normalizedInterval.lower),q(-eps[0],eps[1])),hi=add(read(a.normalizedInterval.upper),eps),interval={lower:str(lo),upper:str(hi),width:str(add(hi,q(-lo[0],lo[1])))},display=[directed(lo,-1),directed(hi,1)];
    const quantity=j===0?'(-4*j0^2/Lambda^2)*phi_1(X_i,0)/X_i':j===1?'U_1(X_i,0)/(j0*X_i)':'Pi_1(X_i,0)/(K*X_i)';
    samples.push({id:`actual-core-n1-${i}-${j}`,sourceAxisDerivativeId:a.id,sourceIndex:samples.length,component:a.component,radialIndex:i,XExactExpression:M(I(i),R('observationXUnit')),XExact:`${i}*observationXUnit`,XStrictlyPositive:true,XBinary64:null,XLogExpression:`log(${i})+2*log(3/Lambda)-${locationScaleBits}*log(2)-log(32)-logObservationSolutionNorm-log(observationScaleBound)`,etaExact:'0',quantity,observationKind:'ACTUAL_NONZERO_RADIUS_NORMALIZED_DIFFERENCE_QUOTIENT',normalizedInterval:interval,sourceAxisDerivativeInterval:a.normalizedInterval,analyticRemainderUpperExact:`1/2^${locationScaleBits}`,displayEnclosure:display,value:(display[0]+display[1])/2,pos:[i,(display[0]+display[1])/2,j],sourceField:`actualSource.pointEnclosures.samples[${samples.length}].normalizedInterval`,sourceHash:a.sourceHash,rawFunctionValueNotDisplayed:true});
  }
  return {schema:'MathScope.ActualOrderOneNonzeroCoreEnclosures/1',profileId,parameterExpressionSHA256:source.parameterExpressionSHA256,sourceInputs:axis.sourceInputs,locationScaleBits,exactExpressions:{...majorant.exactExpressions,...quantities},derivedExpressions:quantities,domain:{etaExact:'0',positiveOrder:1,radialPointCount:5,observationCauchyRadiusX:'3/Lambda',actualNaturalCoreEndsAt:'4/Lambda',commonPicardIntervalUnchanged:majorant.commonInterval,allSampleRadiiStrictlyPositive:true,allSampleRadiiInsideActualUnmodifiedCore:true,completeCollarSampling:false},samples,proof:[
    'On complex |X|<=3/Lambda the actual unmodified leading core is analytic by its B_rho coefficient construction; the same conservative B and C1 bounds apply to its original six-component linear equation.',
    'The integral Picard series works on complex radial rays. The first four coordinates are even in xi, hence analytic in X; the actual real-axis solution agrees by the original uniqueness statement.',
    'Let A^2=C1^2*(3/Lambda), Delta=delta/8, c=3*A/sqrt(2*Delta). The kth Picard term is bounded by c^(k+1)/sqrt((k+1)!). Cauchy-Schwarz with weights 2^(-m) gives sum_(m>=1)c^m/sqrt(m!) <=sqrt(exp(2*c^2)-1)<exp(c^2)=M.',
    'With R=3/Lambda, Cauchy gives |f(X)-f_prime(0)*X|<=M*(X/R)^2/(1-X/R) for F1,U1,Pi1, all of which have zero axis datum.',
    'The normalized multipliers are sF=-4*CSelected*j0^2/Lambda^2, sU=1/j0, sPi=1/K. Their absolute values are each <=Bobs=1+|sF|+sU+sPi.',
    'For X_i=i*R^2*2^(-b)/(32*M*Bobs), i=1..5, R<1 and M,Bobs>=1 imply X_i/R<5/32 and |s*(f(X_i)/X_i-f_prime(0))|<=i*2^(-b)/(32*(1-5/32))<2^(-b).',
  ],scope:{actualNonzeroRadiusFunctionValuesEnclosed:true,rigorousNormalizedDifferenceQuotients:true,axisDerivativesRelabeledAsPointValues:false,nonzeroActualPositiveRadius:true,finiteKPicardSumNumericallyExecuted:false,rawUnnormalizedFieldsNumericallyRepresented:false,completeInnerCollarEvaluator:false,localMomentIntegralsEvaluated:false,precisionChangesObservationPoint:true,fixedPointRefinement:false,N4_05_ResidualEvidence:false,globalMomentRepairComplete:false},displayAxes:[{label:'source radius multiplier i',kind:'CATEGORICAL_SOURCE_RADIUS_INDEX',sourceField:'samples[].radialIndex',physicalCoordinate:false},{label:'normalized difference quotient interval',kind:'NORMALIZED_ACTUAL_FIELD_ENCLOSURE',sourceField:'samples[].normalizedInterval',physicalCoordinate:false},{label:'component',kind:'CATEGORICAL',sourceField:'samples[].component',physicalCoordinate:false}]};
}

export function verifyActualBackgroundPointEnclosures(value){
  try{const x=actualBackgroundPointEnclosures({profileId:value?.profileId,locationScaleBits:value?.locationScaleBits}),pass=JSON.stringify(x)===JSON.stringify(value);return {pass,reason:pass?'All actual source, positive-coordinate, normalization and remainder fields match their independent reconstruction.':'A source coordinate, normalization, interval, analytic bound or claim field was changed.'};}catch(e){return {pass:false,reason:e.message};}
}
