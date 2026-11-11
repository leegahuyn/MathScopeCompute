/** Actual n=1 axis derivatives, with retained A.21 pressure uncertainty.
 * These are newly derived positive-order coefficients of the same source.
 * They are not nonzero-radius samples of the full Picard solution.
 */
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {ACTUAL_BACKGROUND_INPUTS} from './actual-background-data.mjs';
import {nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
const q=(a,b=1n)=>{a=BigInt(a);b=BigInt(b);if(!b)throw Error('Zero denominator');if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return [a/g,b/g];};
const read=s=>{if(typeof s!=='string'||!/^[-+]?\d+(\/\d+)?$/.test(s))throw Error('An exact rational is required.');const [a,b='1']=s.split('/');return q(a,b);};
const str=a=>a[1]===1n?String(a[0]):a[0]+'/'+a[1];
const add=(a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),mul=(a,b)=>q(a[0]*b[0],a[1]*b[1]),cmp=(a,b)=>{const s=a[0]*b[1]-b[0]*a[1];return s<0n?-1:s>0n?1:0;};
const pt=(a,b=1n)=>[q(a,b),q(a,b)],ia=(a,b)=>[add(a[0],b[0]),add(a[1],b[1])],im=(a,b)=>{const c=a.flatMap(x=>b.map(y=>mul(x,y))).sort(cmp);return [c[0],c[3]];},scale=(a,n,d=1)=>im(a,pt(n,d));
function floatQ(x){if(!Number.isFinite(x))throw Error('Finite chart value required.');if(x===0)return q(0);const d=new DataView(new ArrayBuffer(8));d.setFloat64(0,x);const b=d.getBigUint64(0),sg=b>>63n?-1n:1n,e=Number((b>>52n)&2047n),f=b&((1n<<52n)-1n),m=e===0?f:f+(1n<<52n),p=(e===0?-1022:e-1023)-52;return p>=0?q(sg*m*(1n<<BigInt(p))):q(sg*m,1n<<BigInt(-p));}
function directed(a,sign){const scaled=a[0]*(1n<<64n);let f=scaled/a[1];if(scaled<0n&&scaled%a[1])f--;let x=Number(f)/2**64;for(let k=0;k<8;k++){if(sign<0?cmp(floatQ(x),a)<=0:cmp(floatQ(x),a)>=0)return x;x=sign<0?nextDown(x):nextUp(x);}throw Error('Unable to enclose exact normalized coefficient.');}
const pack=a=>({lower:str(a[0]),upper:str(a[1]),width:str(add(a[1],mul(q(-1),a[0])))});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function actualBackgroundAxisObservations({profileId=SOURCE_PROFILE_ID}={}){
  const source=assertSourceProfile(profileId),tiny=q(1,1n<<2048n),positiveTiny=[q(0),tiny],A=ia(pt(1,2),positiveTiny),b=scale(ia(pt(1),positiveTiny),-1);
  const chi=q(4000000,4000001),zetaPrimeCoefficient=q(4000000n*3999999n,4000001n*4000001n);
  const angular=ia(ia([mul(chi,chi),mul(chi,chi)],im(im(ia(pt(9,2),scale(positiveTiny,-1)),[zetaPrimeCoefficient,zetaPrimeCoefficient]),positiveTiny)),scale(im(im(b,positiveTiny),im(positiveTiny,positiveTiny)),2));
  const p0=ACTUAL_BACKGROUND_INPUTS.pressure.normalizedDerivativeIntervals[0].interval,p2=ACTUAL_BACKGROUND_INPUTS.pressure.normalizedDerivativeIntervals[2].interval;
  const pressure=ia(ia(scale(positiveTiny,-12),scale(im(A,[read(p0.lower),read(p0.upper)]),2)),scale([read(p2.lower),read(p2.upper)],-1,2));
  const rows=[
    {id:'actual-phi1-axis-slope',component:'phi_1',normalization:'-4*j0^2/Lambda^2',quantity:'(-4*j0^2/Lambda^2)*partial_X phi_1(0,0)',formula:'chi0^2 + (9/2-h)*(4000000*3999999/4000001^2)/Lambda + 2*(-1-h)*j0^2/Lambda^2',unnormalizedFormula:'partial_X phi_1(0,0) = -(2*(-1-h)+Lambda*zetaPrime(0)+Lambda^2*zeta(0)^2)/4',interval:angular,strictSign:'positive normalized value; partial_X phi_1 is negative',dependsOn:['actual h','actual j0','actual Lambda','actual sigmaStar=j0/2000'],restoration:'partial_X phi_1 = -Lambda^2/(4*j0^2) * normalizedValue'},
    {id:'actual-U1-axis-slope',component:'U_1',normalization:'1/j0',quantity:'partial_X U_1(0,0)/j0',formula:'1/2+h',unnormalizedFormula:'partial_X U_1(0,0)=(1/2+h)*j0',interval:A,strictSign:'strictly greater than 1/2 after normalization',dependsOn:['actual h','actual j0'],restoration:'partial_X U_1 = j0 * normalizedValue'},
    {id:'actual-Pi1-axis-slope',component:'Pi_1',normalization:'1/K',quantity:'partial_X Pi_1(0,0)/K',formula:'-12/K + 2*(1/2+h)*(P(0)/K) - (P_second(0)/K)/2',unnormalizedFormula:'partial_X Pi_1(0,0)=-12+2*A*P(0)-P_second(0)/2',interval:pressure,strictSign:'negative',dependsOn:['actual h','actual K','actual A.21 pressure derivative intervals 0 and 2'],restoration:'partial_X Pi_1 = K * normalizedValue'},
  ];
  const samples=rows.map((r,i)=>{const normalizedInterval=pack(r.interval),displayEnclosure=[directed(r.interval[0],-1),directed(r.interval[1],1)],value=(displayEnclosure[0]+displayEnclosure[1])/2;const {interval,...row}=r;return {...row,sourceIndex:i,XExact:'0',etaExact:'0',radialDerivativeOrder:1,observationKind:'FIRST_RADIAL_DERIVATIVE_AT_AXIS',normalizedInterval,displayEnclosure,value,pos:[i,value,0],sourceField:`actualSource.axisObservations.samples[${i}].normalizedInterval`,sourceHash:(i===2?ACTUAL_BACKGROUND_INPUTS.inputs.pressure:ACTUAL_BACKGROUND_INPUTS.inputs.axisProducer).sha256,physicalValueUnderflowOrOverflowNotSubstituted:true};});
  return {schema:'MathScope.ActualOrderOneAxisObservations/1',profileId,parameterExpressionSHA256:source.parameterExpressionSHA256,sourceInputs:ACTUAL_BACKGROUND_INPUTS.inputs,sourceEquations:['5.2','5.3','5.4','5.5','5.6'],domain:{XExact:'0',etaExact:'0',positiveOrder:1,radialDerivativeOrder:1,actualNonzeroRadiusSamples:false},samples,arithmetic:'Exact BigInt rational interval operations; retained A.21 analytic and quadrature errors; directed binary64 marks only.',smallParameterEnclosure:{h:['0','1/2^2048'],j0Squared:['0','1/2^2048'],inverseK:['0','1/2^2048'],inverseLambda:['0','1/2^2048'],lowerZeroIsEnclosureEndpointOnly:true,allActualParametersStrictlyPositive:true,proof:'T=exp(1048576)+10>2^39, K=exp(4T), h=exp(-8002T), j0=h^4, Lambda=Q^64 and Q>=2^260; e>2.'},scope:{actualPositiveOrderValuesEnclosed:true,firstRadialDerivativesOnly:true,valuesProducedFromActualSameN3:true,actualPressureIntervalsUsed:true,suppliedProbeValuesUsed:false,nonzeroRadiusPicardSolutionEvaluated:false,globalMomentRepairComplete:false,physicalResidualDecayVerified:false}};
}

export function verifyActualBackgroundAxisObservations(value){
  try{const expected=actualBackgroundAxisObservations({profileId:value?.profileId});const checks=[{id:'source-binding',pass:same(value.sourceInputs,expected.sourceInputs)&&value.parameterExpressionSHA256===expected.parameterExpressionSHA256},{id:'domain-and-scope',pass:same(value.domain,expected.domain)&&same(value.scope,expected.scope)},{id:'actual-derived-coefficients',pass:same(value.samples,expected.samples)},{id:'small-positive-parameters-retained',pass:same(value.smallParameterEnclosure,expected.smallParameterEnclosure)}];return {pass:checks.every(c=>c.pass),checks};}catch(e){return {pass:false,checks:[{id:'well-formed-same-source-observations',pass:false,reason:e.message}]};}
}
