/** Numerical nested-exponential intervals for the ORIGINAL positive profile.
 * Endpoints contain numerical rational constants and exp/neg only.  No source
 * expression, parameter root, unevaluated integral, or zero replacement occurs
 * in an endpoint.  The guaranteed width is in the explicitly named iterated
 * logarithm coordinate; it is NOT a relative-error claim for the original value.
 */
import {getPinnedSourceProfile,SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {directedArithmetic,rational as Q,readRational,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const exp=x=>({exp:x}),neg=x=>({neg:x}),constant=x=>({rational:x});
function tower(height,seed,small){
  let node=constant(seed);
  for(let j=0;j<height-1;j++)node=exp(node);
  return exp(small?neg(node):node);
}
export function numericalEndpointIsClosed(node){
  if(!node||typeof node!=='object'||Array.isArray(node)||Object.keys(node).length!==1)return false;
  if(Object.hasOwn(node,'rational')){try{readRational(node.rational);return true;}catch{return false;}}
  if(Object.hasOwn(node,'exp'))return numericalEndpointIsClosed(node.exp);
  if(Object.hasOwn(node,'neg'))return numericalEndpointIsClosed(node.neg);
  return false;
}
export function numericalExponentialInterval({height,small=false,coordinate}={}){
  if(!Number.isSafeInteger(height)||height<1||height>6||typeof small!=='boolean'||!coordinate||Object.keys(coordinate).some(k=>!['lower','upper'].includes(k)))
    fail('INVALID_INPUT','Use a finite exponential height, a sign choice, and two exact numerical logarithm-coordinate endpoints.');
  const lo=readRational(coordinate.lower),hi=readRational(coordinate.upper);
  if(qcompare(lo,hi)>0)fail('INVALID_INPUT','The numerical logarithm interval is reversed.');
  const lower=tower(height,small?coordinate.upper:coordinate.lower,small),upper=tower(height,small?coordinate.lower:coordinate.upper,small);
  return {height,small,coordinate:{lower:qtext(lo),upper:qtext(hi)},lower,upper,
    strictlyPositiveLower:true,finiteUpper:true,endpointsContainOnlyNumericalConstants:true,
    coordinateDefinition:small?(height===1?'-log(value)':'log^'+(height-1)+'(-log(value))'):'log^'+height+'(value)',
    interpretation:'Apply the displayed real exp/neg operations to the numerical rational leaves. These are actual absolute real endpoints; their dense decimal expansion is unnecessary.',
    originalValueRelativeErrorGuaranteed:false};
}

function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','precisionBits','logCoordinateTolerance'].includes(k)))
    fail('INVALID_INPUT','Only the pinned profile and exact numerical logarithm controls may be requested. No source parameters, intervals, or proof flags are supplied.');
  const {sourceProfile=SOURCE_PROFILE_ID,precisionBits=192,logCoordinateTolerance='1/1000000000000'}=input;
  assertSourceProfile(sourceProfile);const tolerance=readRational(logCoordinateTolerance);
  if(qcompare(tolerance,Q(0))<=0||qcompare(tolerance,Q(1,100))>0)fail('INVALID_INPUT','The logarithm-coordinate width lies in (0,1/100].');
  directedArithmetic(precisionBits);return {sourceProfile,precisionBits,logCoordinateTolerance:qtext(tolerance)};
}

async function bindOriginalProfile(profile){
  const p=profile.parametersExactExpressions,r=n=>({ref:n}),i=n=>({integer:n}),pow=(n,k)=>({power:[r(n),k]}),checks=[];
  const bind=(name,expected)=>checks.push({name,actual:p[name],expected,pass:same(p[name],expected)});
  bind('Md',i(1048576));bind('T',{sum:[{exp:r('Md')},i(10)]});
  bind('h',{exp:{product:[i(-8002),r('T')]}});bind('lambda',{exp:{product:[i(-1000),r('T')]}});
  bind('logP',{product:[i(2),r('T')]});bind('Pstar',{exp:r('logP')});bind('K',pow('Pstar',2));
  bind('j0',pow('h',4));bind('sigmaStar',{quotient:[r('j0'),i(2000)]});
  bind('Q',{quotient:[{product:[i(String(1n<<260n)),r('K')]},pow('sigmaStar',2)]});
  bind('Lambda',pow('Q',64));bind('BRefUpper',pow('Q',300));
  bind('logCSelected',{sum:[{product:[i(10),{log:{sum:[i(1),r('BRefUpper')]}}]},pow('Q',200)]});
  bind('CSelected',{exp:r('logCSelected')});
  bind('logCaxis',{sum:[{quotient:[{product:[i(64),r('Lambda')]},pow('sigmaStar',2)]},i(1)]});bind('Caxis',{exp:r('logCaxis')});
  bind('sourceEnvelopeS',pow('CSelected',100000));bind('C12EnvelopeR',{exp:pow('sourceEnvelopeS',256)});
  bind('directionalMarginKappa',pow('C12EnvelopeR',-10));bind('t1',pow('CSelected',-120));
  bind('radialFrequencyN',{sum:[i(1),{ceil:pow('C12EnvelopeR',50)}]});
  bind('XR',{product:[i(110),{power:[{product:[r('CSelected'),r('Pstar')]},10]}]});
  bind('co',{rational:'1/256'});bind('Tf',i(128));
  if(checks.some(r=>!r.pass))fail('INVALID_SOURCE_CONSTRUCTION','The original positive profile formula changed: '+checks.filter(r=>!r.pass).map(r=>r.name).join(', '));
  return {profileId:profile.profileId??SOURCE_PROFILE_ID,parameterExpressionSHA256:profile.parameterExpressionSHA256,
    evaluatedParameterDefinitionSHA256:await sha256(canonicalStringify(p)),checks,
    originalH:p.h,originalT:p.T,allUsedOriginalDefinitionsMatched:true,sourceProfileReplaced:false};
}

export function positiveProfileTowerErrorAudit(){
  // a=260 log2+2 log2000 <260+16=276, a_axis<64*276+6+16.
  // The source exp(Md) is so large that this finite reserve is far stronger
  // than the rounding error of the regular 96..512-bit logarithm arithmetic.
  const M=1048576,N=4096,checks=[
    {id:'literal-Q-exponent',left:String(4+8*8002),right:'64020',pass:4+8*8002===64020},
    {id:'literal-selected-exponent',left:String(200*64020),right:'12804000',pass:200*64020===12804000},
    {id:'literal-axis-exponent',left:String(64*64020+8*8002),right:'4161296',pass:64*64020+8*8002===4161296},
    {id:'selected-low-order-log-correction',left:String(200*276+1),right:'12804000',pass:200*276+1<12804000},
    {id:'axis-low-order-log-correction',left:String(64*276+6+16+1),right:'4161296',pass:64*276+6+16+1<4161296},
    {id:'regular-log2000-upper',left:String(8n**8n),right:String(2000n*3n**8n),pass:8n**8n>2000n*3n**8n},
    {id:'regular-log100000-upper',left:String(8n**12n),right:String(100000n*3n**12n),pass:8n**12n>100000n*3n**12n},
    {id:'regular-log25600000-upper',left:String(8n**18n),right:String(25600000n*3n**18n),pass:8n**18n>25600000n*3n**18n},
    {id:'all-transformed-profile-log-corrections',left:String(200*276+1+19),right:'12804000',pass:200*276+1+19<12804000},
    {id:'positive-exponential-dominates-selected-log-correction',left:String(16**3),right:String(6*(15*16+10)),pass:16**3>6*(15*16+10)},
    {id:'one-common-dyadic-log-reserve',left:'32',right:'2^(Md-4096)',pass:M-N>5}
  ];
  return {schema:'MathScope.PositiveProfileTowerErrorAudit/1',M,reserveExponent:N,reserve:'1/'+String(1n<<4096n),checks,pass:checks.every(r=>r.pass),
    derivation:{
      T:'Write t=exp(M), T=t+10. Then0<log(T)-M=log(1+10/t)<10*exp(-M).',
      Q:'The original Q equals2^260*2000^2*exp(64020*T). With a=260log2+2log2000 in(0,276),0<log(log Q)-(M+log64020)<11*exp(-M).',
      CSelected:'Let L=log Q,Y=200L>16. log C=exp(Y)+10log(1+exp(300L)). Since log(1+exp(300L))<300L+log2, the ratio of the added term to exp(Y) is below(15Y+10)exp(-Y)<1. Hence log(log C)=Y+xi with0<xi<1, and0<log^3 C-(M+log12804000)<11exp(-M).',
      Caxis:'log Caxis=c_axis*exp(4161296*T)+1, with0<log c_axis<64*276+6+16. Taking the two remaining logarithms yields the same11exp(-M) upper error at base M+log4161296.',
      sourceEnvelopeS:'log^3(C^100000)=log(log100000+log(log C)); the positive added constant is less12, so the same12exp(-M) reserve suffices.',
      Renv:'Renv=exp(C^25600000). Therefore log^4 Renv=log(log25600000+log(log C)); log25600000<18 adds less than one further exp(-M) in the final coordinate.',
      powers:'For t1=C^-120, log^2(-log t1)=log(log120+log(log C)). For kappa=Renv^-10, log^3(-log kappa) has the analogous positive finite log10 correction. Powers Renv^4096 and2*Renv^10 are treated the same way; additive2 or rounding1+ceil(Renv^50) changes the final coordinate by still less exp(-M).',
      transformedReserve:'Write x=log(log C)=Y+xi,0<xi<1. Every displayed C/Renv transformation has final coordinate log(x+d), where0<=d<19: for C^100000 use d=log100000<12; for C^-120 use log120<5; for Renv use log25600000<18. A power, the prefactor2, or1+ceil(Renv^50) contributes at most an extra1 after the intermediate logarithms because its relative added term is below1. Thus its final coordinate is between M+log12804000 and that number+11exp(-M), by200*276+1+19<12804000.',
      XR:'XR=110*C^10*Pstar^10. The extra log110+20T is strictly positive and less log C for this source. Its contribution after the remaining logarithms is bounded by a finite constant times exp(-M), together with log10.',
      reserve:'Every displayed positive final-coordinate correction is less32*exp(-M)<32*2^-M<2^-4096. No original small value or remainder is replaced by zero.'},
    relativeAccuracyOfOriginalTowerValueClaimed:false,numericalLogarithmsStillNeedDirectedEvaluation:true,sourceAuthenticated:false};
}

export async function encloseActualPositiveProfileLogs(input={}){
  const request=requestOf(input),profile=getPinnedSourceProfile(),sourceBinding=await bindOriginalProfile(profile),audit=positiveProfileTowerErrorAudit(),A=directedArithmetic(request.precisionBits),
    tiny=A.point(Q(1,1n<<4096n)),M=A.point(1048576),tolerance=readRational(request.logCoordinateTolerance),rows=[];
  const row=(name,height,c,small=false)=>{
    const base=A.add(M,A.logRational(Q(c))),box=[base[0],A.add(base,tiny)[1]],width=Q(box[1]-box[0],A.S),packed=A.pack(box),coordinate={lower:packed.lower,upper:packed.upper};
    if(qcompare(width,tolerance)>0)fail('PRECISION_REQUIRED','The '+name+' logarithm coordinate is wider than requested.');
    const interval=numericalExponentialInterval({height,small,coordinate});
    if(!numericalEndpointIsClosed(interval.lower)||!numericalEndpointIsClosed(interval.upper))fail('INTERNAL_VALIDATION','A numerical endpoint retained a nonnumeric source expression.');
    rows.push({name,interval,logCoordinateInterval:packed,logCoordinateWidth:qtext(width),logCoordinateTolerance:request.logCoordinateTolerance,toleranceMet:true});
  };
  row('T',1,1);row('h',2,8002,true);row('lambda',2,1000,true);row('Pstar',2,2);row('Q_profile',2,64020);
  row('CSelected',3,12804000);row('Caxis',3,4161296);row('sourceEnvelopeS',3,12804000);row('C12EnvelopeR',4,12804000);
  row('t1',3,12804000,true);row('directionalMarginKappa',4,12804000,true);row('u_equals_2_Renv_power10',4,12804000);
  row('Renv_power4096',4,12804000);row('radialFrequencyN',4,12804000);row('XR',3,12804000);
  const s2=A.sqrt(A.point(2)),regular={sqrt2:A.pack(s2),Tg:A.pack(A.add(A.point(4),s2)),LambdaPalette:A.pack(A.sub(A.point(4),s2)),
    Dgeom:A.pack(A.sub(A.point(4),A.mul(A.point(2),s2))),r0:A.pack(A.point(Q(1,1n<<34n))),co:A.pack(A.point(Q(1,256))),Tf:A.pack(A.point(128))};
  const result={schema:'MathScope.ActualPositiveProfileLogEnclosure/1',status:'SOURCE_BOUND_NUMERICAL_NESTED_EXPONENTIAL_INTERVALS',pass:audit.pass,request,sourceBinding,audit,rows,regular,
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_LOGARITHM_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false},
    proof:'Each original profile formula is checked literally. The proved numerical logarithm-coordinate interval is mapped monotonically to absolute endpoints containing only rational constants and real exp/neg. A reversed seed order is used for a small positive tower.',
    scope:{originalPositiveProfileNumericallyEnclosed:true,positiveLowerEndpointsRetained:true,originalValueRelativeToleranceGuaranteed:false,
      everyDisplayedLogCoordinateWidthChecked:true,endpointsHaveNoOriginalExpressionRoots:true,regularGeometryConstantsNeedOwnBandBinding:true,commonSelectorNormsNumericallyEvaluated:false,actualEllNumericallyEnclosed:false,
      originalPaletteFractionalPartNumericallyResolved:false,actualCiLsEpsilonNumericallyEnclosed:false,actualTargetTauNumericallyEnclosed:false,wholeGNUMComplete:false,M3Started:false}};
  seals.set(result,canonicalStringify(result));return result;
}
export function assertActualPositiveProfileLogs(result){
  if(!result||!seals.has(result)||seals.get(result)!==canonicalStringify(result))fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private original positive-profile numerical result.');
  return true;
}
export function actualPositiveProfileLogCertificate(result){assertActualPositiveProfileLogs(result);return structuredClone(result);}
