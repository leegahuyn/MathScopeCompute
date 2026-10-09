"""Derive the A.21 input variant while preserving the audited rational module.

The coefficient-space operators, contraction propagation and tail estimator are
copied byte-for-byte from the pinned local module. Only the analytic input
producer, public names and explicitly scoped result descriptions differ.
"""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parent
base=ROOT/'axis-certificates.mjs'
original=base.read_text()
BASE_SHA='7bff5106ded0223d0e7ff14d4431a240de160bdcc6be17c1072189206312495d'
assert hashlib.sha256(base.read_bytes()).hexdigest()==BASE_SHA
s=original
s=s.replace("import {ComputeError,makeBudget} from '../numerics.mjs';", "import {ComputeError,makeBudget} from '../numerics.mjs';\nimport {createSourcePressureAnalyticProducer,validateSourcePressureAnalyticInput} from './pressure-analytic.mjs';\nimport {outerExampleInput} from './outer.mjs';")
start=s.index('function normalize(input){')
end=s.index('\nconst box=',start)
s=s[:start]+'''// Internal producer output may contain more digits than a public input string.
// It is parsed separately so the public input-size contract stays unchanged.
function parseBound(v,name){
  if(typeof v!=='string'||v.length>4096||!/^[-+]?\\d+(?:\\/\\d+)?$/.test(v))
    throw new ComputeError('PRECISION_REQUIRED',`${name}: generated rational enclosure exceeds the supported scalar size`);
  const [n,d='1']=v.split('/');return Q(BigInt(n),BigInt(d));
}
function normalize(input,budget=null){
  object(input,'input');
  keys(input,['pressure','h','j0','sigmaMode','lambdaMode','lambdaMultiplier','coefficientRadiusRatio','tailDegree','radialDerivativeOrder','etaDerivativeOrder','sampleEta','sampleCount','maxY','boundBits'],'input');
  const pressure=input.pressure??{family:'source-outer-A21',parameters:outerExampleInput().parameters};
  object(pressure,'pressure');keys(pressure,['family','parameters'],'pressure');
  if(pressure.family!=='source-outer-A21')throw new ComputeError('UNSUPPORTED_PRESSURE_DATUM','This certificate requires the actual A.21 target pressure producer. Caller-supplied masses, norms and truth flags are not accepted.');
  const bits=integer(input.boundBits??128,'boundBits',64,256);
  const sourceInput={parameters:pressure.parameters??outerExampleInput().parameters,boundBits:bits};
  const checked=validateSourcePressureAnalyticInput(sourceInput);
  if(!checked.valid)throw new ComputeError(checked.status??'INVALID_INPUT',checked.message??'A.21 pressure source input was rejected',checked.detail??{});
  const sourceH=parse(checked.parameterHExact,'source pressure h');
  const h=parse(input.h??checked.parameterHExact,'h'),j=parse(input.j0??'3/100','j0');
  if(cmp(h,sourceH)!==0)throw new ComputeError('AXIS_H_MISMATCH','Axis h must equal the exact h of the actual A.21 target pressure',{parameterHExact:qs(sourceH),axisHExact:qs(h)});
  if(!positive(h)||cmp(h,Q(1,100))>0||!positive(j)||cmp(j,Q(1,20))>0)throw new ComputeError('INVALID_INPUT','Require 0<h<=1/100 and 0<j0<=1/20');
  if((input.sigmaMode??'computed-cutoff')!=='computed-cutoff'||(input.lambdaMode??'computed-threshold')!=='computed-threshold')throw new ComputeError('INVALID_INPUT','sigma and Lambda are selected from derived bounds, not caller thresholds');
  const ratio=parse(input.coefficientRadiusRatio??'1/16','coefficientRadiusRatio'),eta=parse(input.sampleEta??'1/5','sampleEta'),Y=parse(input.maxY??'41/10','maxY');
  if(!positive(ratio)||cmp(ratio,Q(1,2))>0||cmp(mag(eta),one)>0||!positive(Y)||cmp(Y,Q(41,10))>0)throw new ComputeError('INVALID_INPUT','Require 0<coefficientRadiusRatio<=1/2, |sampleEta|<=1, 0<maxY<=41/10');
  const N=integer(input.tailDegree??24,'tailDegree',2,128),kr=integer(input.radialDerivativeOrder??2,'radialDerivativeOrder',0,4),ke=integer(input.etaDerivativeOrder??2,'etaDerivativeOrder',0,4);
  if(N<kr)throw new ComputeError('INVALID_INPUT','tailDegree must be at least radialDerivativeOrder');
  const a={h,j,ratio,eta,Y,N,kr,ke,bits,multiplier:integer(input.lambdaMultiplier??2,'lambdaMultiplier',1,1024),samples:integer(input.sampleCount??17,'sampleCount',3,65),sourceInput,parameterHExact:qs(sourceH)};
  // Validation has no transcendental quadrature or analytic certificate run.
  if(!budget)return a;
  const producer=createSourcePressureAnalyticProducer(sourceInput,budget),c=producer.certificate;
  const binding=producer.bindAxisH(qs(h));
  if(!binding.matches)throw new ComputeError('AXIS_H_MISMATCH','A.21 pressure and axis use different exact h',binding);
  const K=parseBound(c.totalMassUpper,'A.21 total mass upper bound');
  const inner=parseBound(c.innerThetaOneMassLower,'A.21 theta-one mass lower bound');
  if(cmp(inner,Q(4))<0)throw new ComputeError('UNSUPPORTED_PRESSURE_SIZE','The supported axis branch requires its derived theta-one mass lower bound to be at least 4. No user mass assertion can replace it.');
  if(K.n.toString().length>600||K.d.toString().length>600)throw new ComputeError('PRECISION_REQUIRED','A.21 mass enclosure exceeds the supported exact integer size');
  return {...a,K,producer,binding};
}
export function validateAxisSourceInput(input={}){
  try{const a=normalize(input);return {valid:true,pressureFamily:'source-outer-A21',parameterHExact:a.parameterHExact,exactInput:{h:qs(a.h),j0:qs(a.j)},scope:'Structural and exact input binding checks; analytic bounds are produced by the budgeted run.'};}
  catch(e){return {valid:false,status:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{}};}
}
''' + s[end:]
old="  const den=iadd(box(one),isq(e)),P=ineg(idiv(box(a.K),isq(den))),Pd=idiv(iscale(e,mul(Q(4),a.K)),imul(isq(den),den));"
new="  const pressure=a.producer.realBounds([qs(e[0]),qs(e[1])]);\n  const P=[parseBound(pressure.P.lower,'P lower'),parseBound(pressure.P.upper,'P upper')],Pd=[parseBound(pressure.Pprime.lower,'Pprime lower'),parseBound(pressure.Pprime.upper,'Pprime upper')];"
assert s.count(old)==1;s=s.replace(old,new)
s=s.replace('axisCertificateSources','axisSourceCertificateSources')
s=s.replace('export function certifyAxis(', 'export function certifyAxisSource(')
# Only the run calls normalize with a budget; validate remains purely structural.
assert 'budget.tick();const a=normalize(input);' in s
s=s.replace('budget.tick();const a=normalize(input);', 'budget.tick();const a=normalize(input,budget);')
s=s.replace("certificateScope:'unique nonlinear Appendix-B axis fixed point for the explicitly defined rational pressure datum'", "certificateScope:'unique nonlinear Appendix-B axis fixed point for the actual A.21 target pressure, with source-generated analytic bounds'")
old="inputModel:{pressure:{family:'rational',K:qs(a.K),formula:'P(eta)=-K/(1+eta^2)^2',completedOutgoingPressure:false},h:qs(a.h),j0:qs(a.j),sampleEta:qs(a.eta),UStar:'4*eta+j0',phiStar:'exp(Lambda*integral_0^eta zetaStar)',normalizedAmplitude:'g=exp(Lambda*phase-logC)',source:'Explicit analytic datum satisfying the pressure sign/smoothness hypotheses; equality with the original outer schedule is neither assumed nor established.'}"
new="inputModel:{pressure:{family:'source-outer-A21',formula:'P(z)=-integral (1+z^2)^(-2*theta(y)) dmu(y)',completedOutgoingPressure:false,targetPressureAnalyticBounds:true,sourceParameters:a.sourceInput.parameters},h:qs(a.h),j0:qs(a.j),sampleEta:qs(a.eta),UStar:'4*eta+j0',phiStar:'exp(Lambda*integral_0^eta zetaStar)',normalizedAmplitude:'g=exp(Lambda*phase-logC)',source:'Actual A.21 target pressure. Equality with a numerically repaired outer field still requires exact outer-moment certification.'},\n      sourcePressureCertificate:a.producer.certificate,pressureAxisBinding:a.binding,\n      sourcePressureOnCoefficientTube:a.producer.complexBounds({realWindow:'11/10',tubeRadius:qs(tube.bounds.outerRadius)}),\n      derivedFrom:{rationalModuleSha256:'"+BASE_SHA+"',unchanged:'cutoff, Cauchy, resolvent, controlled remainder, positivity and infinite-tail calculation kernels',rationalDefaultScalarLeanAuditAppliesToThisInstance:false}"
assert s.count(old)==1;s=s.replace(old,new)
s=s.replace("'Equality of the rational pressure with the completed original outer profile'", "'Equality of this exact A.21 target pressure with the numerically repaired outer field'")
s=s.replace("'Only the declared rational analytic pressure family has a checked input producer. Caller-supplied norm/tail/pressure-truth claims are rejected.'", "'This A.21 input is constructed from the actual source schedule and the stated principal Log branch. Caller-supplied mass/norm/tail/truth claims are rejected.'")
s=s.replace("completedOuterPressureLinked:false,fullOriginalParameterOrder:false", "sourceA21TargetPressureLinked:true,completedOuterPressureLinked:false,fullOriginalParameterOrder:false")
s=s.replace("'The completed outgoing pressure, global witness and physical velocity amplitude are not represented.'", "'The A.21 target has certified local bounds, but equality with the repaired outer field, a global witness and physical velocity amplitude are not represented.'")
s=s.replace("schema:'MathScope.Navier.AxisBoundCertificate/1'", "schema:'MathScope.Navier.SourceAxisBoundCertificate/1'")
a=s.index('export function axisExampleInput()')
s=s[:a]+'''export function axisSourceExampleInput(){return {pressure:{family:'source-outer-A21',parameters:outerExampleInput().parameters},j0:'3/100',sigmaMode:'computed-cutoff',lambdaMode:'computed-threshold',lambdaMultiplier:2,tailDegree:24,sampleEta:'1/5',sampleCount:17,boundBits:128};}
export function getAxisSourceExamples(){return [{id:'ns-axis-source-exact-bounds',label:'실제 A.21 압력과 연결된 국소 축 상계',request:{kind:'ns.axis-source-certificate',input:axisSourceExampleInput(),budget:{maxOperations:20000000,maxMillis:60000,maxMilliseconds:60000,maxPoints:2048}}}];}
'''
s='// Generated by derive-axis-source.py from a SHA-pinned rational-datum module.\n'+s
out=ROOT/'axis-source-certificate.mjs';out.write_text(s)
# Compare the calculation kernels verbatim, independently of their input producer.
spans=[]
for start,end in [
 ('function cutoffCertificate','function complexBounds'),
 ('function complexBounds','function tubeCertificate'),
 ('function tubeCertificate','function sqrtCeil'),
 ('function positiveSeries','function controlled'),
 ('function controlled','function factorial'),
 ('function tailBound','function comparisonBox'),
 ('function comparisonBox','function chiAt'),
]:
 a0=original.index(start);a1=s.index(start)
 b0=original.index(end,a0+len(start));b1=s.index(end,a1+len(start))
 x=original[a0:b0];y=s[a1:b1]
 assert x==y,start
 spans.append({'start':start,'bytes':len(x.encode()),'sha256':hashlib.sha256(x.encode()).hexdigest(),'equal':True})
manifest={'schema':'MathScope.SourceAxisDerivation/1','baseSource':base.name,'baseSha256':BASE_SHA,'derivedSource':out.name,'derivedSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'unchangedSpans':spans,'scope':'Only analytic input preparation, real pressure interval evaluation and public result descriptions differ. No new Lean proof receipt is generated.'}
(ROOT/'axis-source-derivation.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'file':str(out),'sha256':manifest['derivedSha256'],'commonSpans':len(spans)}))
