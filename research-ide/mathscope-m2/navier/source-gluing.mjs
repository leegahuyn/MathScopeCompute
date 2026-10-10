import {iadd,isub,imul,idiv,iscale,ilog,iexp,point,nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const scalar=(x,name)=>{if(typeof x!=='number'||!Number.isFinite(x))fail(name+' must be a finite binary64 value.');return x;};
const interval=(x,name)=>{if(typeof x==='number')return point(scalar(x,name));if(!Array.isArray(x)||x.length!==2||x.some(y=>typeof y!=='number'||!Number.isFinite(y))||x[0]>x[1])fail(name+' must be a number or an ordered finite interval.');return x.slice();};
const exactOffset=(integer,value)=>{const v=new DataView(new ArrayBuffer(8));v.setFloat64(0,value);const bits=v.getBigUint64(0),negative=Boolean(bits>>63n),e=Number((bits>>52n)&2047n),m=(bits&((1n<<52n)-1n))+(e===0?0n:1n<<52n),p=(e===0?-1022:e-1023)-52;let n=negative?-m:m,d=1n;if(p<0)d<<=BigInt(-p);else n<<=BigInt(p);n+=BigInt(integer)*d;return {numerator:String(n),denominator:String(d),sign:n<0n?-1:n>0n?1:0};};
const exactLog2Text=value=>{const r=exactOffset(0,value);let n=BigInt(r.numerator),d=BigInt(r.denominator),a=n<0n?-n:n,b=d;while(b){const t=a%b;a=b;b=t;}n/=a;d/=a;return d===1n?String(n):n+'/'+d;};

/** Universal locally-finite support statement for any doubling continuation. */
export function certifyCutoffPrefix(log2a,log2qRange){
  if(!Array.isArray(log2a)||log2a.length<1||log2a.length>64||log2a.some((k,i)=>!Number.isSafeInteger(k)||k<1||k>1e7||i>0&&k<log2a[i-1]+1))fail('A positive, strictly doubling dyadic cutoff prefix is required.');
  if(!Array.isArray(log2qRange)||log2qRange.length!==2)fail('A compact positive q domain must give two finite log2 endpoints.');
  const [lo,hi]=log2qRange.map((x,i)=>scalar(x,'log2qRange['+i+']'));if(lo>hi||hi>0||lo< -1e9)fail('Use -1e9<=log2(q_min)<=log2(q_max)<=0.');
  const lastOffset=exactOffset(log2a.at(-1),lo),complete=lastOffset.sign>=0,active=log2a.flatMap((k,i)=>exactOffset(k,lo).sign<0?[i+1]:[]),inactive=log2a.flatMap((k,i)=>exactOffset(k,lo).sign>=0?[i+1]:[]);
  return {schema:'MathScope.CompactActiveCutoffPrefix/1',log2a:log2a.slice(),domain:{log2qMin:lo,log2qMax:hi,qMinExact:`2^(${exactLog2Text(lo)})`,qMaxExact:`2^(${exactLog2Text(hi)})`,log2EndpointEncoding:'EXACT_BINARY64_DYADIC; decimal UI text is only a display',strictlyPositive:true},activePositiveOrders:active,inactivePositiveOrders:inactive,prefixComplete:complete,status:complete?'COMPLETE_FOR_ANY_DOUBLING_CONTINUATION':'PREFIX_EXHAUSTED',lastCutoffAtQMin:lastOffset,omittedHigherOrdersAreZero:complete,proof:complete?{inequality:'a_J*q_min>=1; a_j>=2^(j-J)*a_J for every j>J; hence a_j*q>=1 on the entire compact domain.',cutoffSupport:'chi(s)=0 for every s>=1',comparisonArithmetic:'Exact BigInt sign of integer log2(a_J) plus the exact binary64 log2(q_min).',futurePolicy:'ALL_FUTURE_CUTOFFS_CONTINUE_THE_SAME_DOUBLING_CONSTRUCTION',doesNotNeedUnseenCoefficientValues:true}:null,requestMorePrefix:complete?null:{reason:'Unseen higher orders may still be active. No locally finite total value is certified.',requiredLastLog2aAtLeast:Math.ceil(-lo)},uncutSeriesConvergenceClaimed:false,actualN3HigherOrderSequenceEvaluated:false};
}

function smoothScalar(s){
  if(s<=.5)return point(1);if(s>=1)return point(0);
  const x=isub(iscale(point(s),2),point(1));if(x[0]<=0||x[1]>=1)return [0,1];
  const rate=isub(idiv(point(1),isub(point(1),x)),idiv(point(1),x));
  let value;if(rate[0]>=0){const e=iexp(iscale(rate,-1));value=idiv(e,iadd(point(1),e));}else if(rate[1]<=0){const e=iexp(rate);value=idiv(point(1),iadd(point(1),e));}else if(rate[1]<700)value=idiv(point(1),iadd(point(1),iexp(rate)));else return [0,1];
  return [Math.max(0,value[0]),Math.min(1,value[1])];
}
/** The genuine C-infinity cutoff, enclosed by monotonicity and bounded exp. */
export function smoothPotentialCutoff(log2Argument){
  scalar(log2Argument,'log2Argument');if(log2Argument<=-1)return {interval:[1,1],region:'ONE',exact:'1'};if(log2Argument>=0)return {interval:[0,0],region:'OFF',exact:'0'};
  const s=iexp(iscale(ilog(point(2)),log2Argument)),left=smoothScalar(s[1]),right=smoothScalar(s[0]),exponent=exactLog2Text(log2Argument);return {interval:[left[0],right[1]],region:'C_INFINITY_COLLAR',argumentInterval:s,exact:`1/(1+exp(1/(2-2*2^(${exponent}))-1/(2*2^(${exponent})-1)))`,strictlyBetweenZeroAndOne:true};
}

/** Sum actual supplied potential values after cutoff, only when the prefix is exhaustive. */
export function evaluateLocalPotentialSum({log2a,log2qRange,log2q,potentials}={}){
  const activity=certifyCutoffPrefix(log2a,log2qRange);scalar(log2q,'log2q');if(log2q<log2qRange[0]||log2q>log2qRange[1])fail('The potential evaluation point must belong to its certified compact q domain.');
  if(!Array.isArray(potentials)||potentials.length!==log2a.length)fail('Supply one three-component potential value for every provided positive order.');
  const inputValues=potentials.map((v,i)=>{if(!Array.isArray(v)||v.length!==3)fail('Potential '+(i+1)+' requires three components.');return v.map((x,k)=>interval(x,'potential '+(i+1)+' component '+k));});
  const summands=inputValues.map((value,i)=>{const cutoff=smoothPotentialCutoff(log2a[i]+log2q);return {order:i+1,sourcePath:`results.localPotentialSum.inputPotentials[${i}]`,value,cutoff,cutoffPotentialValue:value.map(v=>cutoff.region==='OFF'?point(0):cutoff.region==='ONE'?v.slice():imul(cutoff.interval,v))};});
  const sum=summands.reduce((acc,row)=>acc.map((v,k)=>iadd(v,row.cutoffPotentialValue[k])),[point(0),point(0),point(0)]),formal=inputValues.reduce((acc,row)=>acc.map((v,k)=>iadd(v,row[k])),[point(0),point(0),point(0)]);
  return {schema:'MathScope.ActualLocallyFinitePotentialSum/1',activity,query:{log2q,qExact:`2^(${exactLog2Text(log2q)})`,log2Exact:exactLog2Text(log2q)},inputPotentials:inputValues,datumRole:'SUPPLIED_POTENTIAL_VALUES_AT_THE_QUERY_POINT; NOT_N3_COEFFICIENTS',summands,localSum:activity.prefixComplete?{value:sum,completeOnCompact:true,omittedHigherContributionExactlyZero:true}:null,finiteCutoffPrefixValue:sum,uncutFiniteFormalTruncation:{value:formal,orders:log2a.length,role:'FORMAL_FINITE_PREFIX; NOT_THE_LOCALLY_FINITE_CUTOFF_SUM'},potentialBeforeCurl:true,sourceEquations:['5.35','5.39','5.42','5.43','5.45'],sourceInstanceCertified:false,allOrderSourceCertificate:false,allUnseenCoefficientsReplacedByZero:false};
}

export function cutoffConstantLedger(rows){
  return {operatorCertificate:rows.every(r=>r.allQBoundPassed),scope:'CONDITIONAL_SCALAR_INEQUALITY_FOR_THE_SUPPLIED_POSITIVE_CONSTANTS',constantsInputPaths:rows.flatMap((row,j)=>row.constants.map((_,m)=>`results.rows[${j}].constants[${m}]`)),constantsProvenance:'EXPLICITLY_DECLARED_BOUND_PREMISES',sourceDerivativeBoundsVerified:false,sourceInstanceCertified:false,allOrderSourceCertificate:false,empiricalSamplingUsedAsProof:false,necessarySourceInstantiation:'For a same-profile background, separately supply valid C_hat[j,m], P and g bounds derived from the repaired coefficient sequence.'};
}
