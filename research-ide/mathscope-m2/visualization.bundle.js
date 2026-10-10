/* MathScope M2 — additive, static source-bound mathematical computation. */
(()=>{
"use strict";
const __m2_0 = (()=>{
/** MathScope M0 / I0. JSON contracts describe scope; they never establish a theorem. */
const CONTRACT_VERSION = '1.0.0';
const VERSION = CONTRACT_VERSION;
const LEGACY_SESSION_SCHEMA = 'MathScopeResearchSession/0.3.1-foundation.1';
const EVIDENCE_GRADES = Object.freeze(['FORMAL PASS','THEOREM-BACKED','CERTIFIED NUMERICAL','NUMERICAL INDICATOR','EMPIRICAL CORRESPONDENCE','RESEARCH HYPOTHESIS','UNKNOWN','STALE']);
const EDGE_TYPES = Object.freeze(['LOCAL_TO_GLOBAL','BASE_CHANGE','PROJECTION','LIMIT','ASSUMES','COMPUTES','VERIFIED_BY','DEPENDS_ON','CITES']);
const s = (extra = {}) => ({ type:'string',minLength:1,...extra });
const integer = (minimum = 0,extra = {}) => ({type:'integer',minimum,...extra});
const decimalInteger = s({pattern:'^(0|[1-9][0-9]*|-[1-9][0-9]*)$'});
const positiveDecimal = s({pattern:'^(?:[1-9][0-9]*(?:\\.[0-9]+)?|0\\.[0-9]*[1-9][0-9]*)$'});
const hash = s({pattern:'^[a-f0-9]{64}$'});
const id = s({pattern:'^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,199}$'});
const list = (items, extra = {}) => ({type:'array',items,...extra});
const object = (properties,required = Object.keys(properties),extra = {}) => ({type:'object',properties,required,additionalProperties:false,...extra});
const jsonObject = {type:'object'};
const nullable = schema => ({anyOf:[schema,{type:'null'}]});
const ref = object({id,revision:s(),hash});
const refs = list(ref);
const sources = refs;
const scope = object({
  kind:{const:'FINITE'},
  primeInterval:object({lower:decimalInteger,upper:decimalInteger}),
  pAdic:object({p:decimalInteger,digits:integer(1)}),
  series:object({order:integer(0),timeMax:{anyOf:[{type:'number',exclusiveMinimum:0},positiveDecimal]}},['order']),
  spatial:object({bounds:list(list({type:'number'},{minItems:2,maxItems:2}),{minItems:1,maxItems:8}),timeMax:{type:'number',exclusiveMinimum:0}},['bounds']),
  finite:object({description:s(),itemCount:integer(0)}),
  description:s()
},['kind'],{anyOf:[{required:['primeInterval']},{required:['pAdic']},{required:['series']},{required:['spatial']},{required:['finite']}]});
const symbolicScope = object({kind:{const:'SYMBOLIC'},definition:s(),generator:s()},['kind','definition']);
const precision = object({
  kind:{enum:['EXACT','PADIC','REAL_INTERVAL','COMPLEX_INTERVAL','FLOAT64','STATISTICAL']},
  p:decimalInteger,digits:integer(1),absoluteBits:integer(1),workingBits:integer(1),guardDigits:integer(0),
  tolerance:{anyOf:[positiveDecimal,{type:'number',exclusiveMinimum:0}]},
  confidence:{type:'number',exclusiveMinimum:0,exclusiveMaximum:1},description:s(),norm:s(),propagation:jsonObject
},['kind']);
const evidence = object({
  grade:{enum:EVIDENCE_GRADES},
  scopeKind:{enum:['exact-finite','interval-certified','statistical','numerical','conditional-formal','theorem-reference','interface']},
  statement:s(),assumptionRefs:refs,sourceRefs:refs,certificateRef:ref,
  supportsCurrent:{type:'boolean'},effectiveTrust:s(),axioms:list(s()),method:s(),formalAudit:jsonObject
},['grade','scopeKind'],{additionalProperties:true});
const schema = (name,properties,required,extra={}) => ({
  $schema:'https://json-schema.org/draft/2020-12/schema',
  $id:`urn:mathscope:schema:${name}:1`,title:`MathScope ${name} v1`,
  ...object({schema:{const:`MathScope.${name}/1`},...properties},['schema',...(required||Object.keys(properties))],extra)
});
const domainBase = {id,revision:s(),sourceRefs:sources,assumptionRefs:refs};
const assumption = object({
  schema:{const:'MathScope.AssumptionSpec/1'},id,revision:s(),statement:s(),reason:s(),origin:{enum:['USER_AXIOM','HYPOTHESIS','EXTERNAL_THEOREM','DEFINITION']},
  status:{enum:['DECLARED','OPEN','THEOREM_REFERENCE','VERIFICATION_REQUIRED']},sourceRefs:sources,
  usedBy:list(id),scope:{anyOf:[scope,symbolicScope]},introducedBy:s()
},['id','revision','statement','reason','origin','status','sourceRefs','usedBy']);
const observation = schema('ObservationMapSpec',{
  ...domainBase,sourceObjectRef:ref,sourceType:s(),outputType:s(),method:{enum:['SLICE','SCALAR_MARGINAL','WILSON_LOOP','WILSON_LINE','CONDITIONAL_MEAN','BASIS_LAYOUT','SPECTRAL_OBSERVATION','USER_MAP']},
  definition:s(),sourceDimension:integer(0),displayDimension:{const:3},scope,
  axes:list(object({name:s(),sourceField:s(),kind:{enum:['PHYSICAL','COHOMOLOGICAL','CATEGORICAL','VALUATION','SPECTRAL']},unit:s(),scale:{enum:['LINEAR','LOG','SIGNED_LOG','CATEGORICAL']}}),{minItems:3,maxItems:3}),
  lostInformation:list(s()),injectivity:{enum:['NON_INJECTIVE','UNPROVED','CERTIFICATE_REQUIRED']},
  inverse:object({status:{enum:['UNAVAILABLE','CERTIFICATE_REQUIRED']},certificateRef:ref,domain:s()},['status']),
  gaugeConvention:nullable(s()),endpointData:nullable(jsonObject),parameters:jsonObject
});
const SCHEMAS = Object.freeze({
  PrecisionBudget:schema('PrecisionBudget',{...precision.properties},['kind']),
  FiniteScope:schema('FiniteScope',{...scope.properties},['kind'],{anyOf:scope.anyOf}),
  SourceManifest:schema('SourceManifest',{id,revision:s(),entries:list(object({
    id,kind:{enum:['CODE','PAPER','DATA','WEB','LEAN_SOURCE','LOCKFILE','BASELINE']},title:s(),uri:s(),sha256:nullable(hash),
    availability:{enum:['AVAILABLE','REFERENCED','MISSING']},locator:nullable(s()),version:nullable(s()),license:nullable(s())
  },['id','kind','title','uri','sha256','availability']),{minItems:1})}),
  AssumptionLedger:schema('AssumptionLedger',{id,revision:s(),assumptions:list(assumption)}),
  AssumptionSpec:schema('AssumptionSpec',{...assumption.properties},assumption.required),
  M1ObjectSpec:schema('M1ObjectSpec',{
    ...domainBase,domain:{enum:['ARITHMETIC','COHOMOLOGY','GAUGE','PDE','VERIFICATION']},
    objectType:{enum:['PrimeSetQuery','PadicObject','PointComparison','P1Comparison','LocalFactorFamily','GaugeGroup','Connection4D','StateFamily','Holonomy','SpectralModel','NavierStokesComponent','LeadingProfileCandidate','ValidationFixture']},
    description:s(),request:object({kind:s(),input:jsonObject,precision:jsonObject}),scope,precision,
    interpretation:object({finiteComputation:{const:true},externalComparison:{enum:['NOT_USED','THEOREM_REFERENCE','REQUIRED']},continuumClaim:{const:false},universalProof:{const:false}})
  }),
  PrismSpec:schema('PrismSpec',{
    ...domainBase,p:decimalInteger,
    ring:object({kind:{enum:['PADIC_INTEGER_RING','AFFINE_PRESENTATION','AINF','PERFECTOID_PRESENTATION']},presentation:s(),completion:s()}),
    ideal:object({generators:list(s(),{minItems:1}),presentation:s()}),
    delta:object({rule:s(),inputExtraDigits:integer(1),convention:s()}),
    frobenius:object({rule:s(),convention:s(),semilinear:{const:true},cutoffRule:s()}),
    geometricObject:object({kind:{enum:['POINT','PROJECTIVE_SPACE','SMOOTH_AFFINE','SMOOTH_PROPER','USER_PRESENTATION']},presentation:s(),dimension:integer(0)}),
    hypotheses:object({smooth:nullable({type:'boolean'}),proper:nullable({type:'boolean'}),details:list(s())}),
    comparison:object({status:{enum:['NONE','THEOREM_REFERENCE','CERTIFICATE_REQUIRED']},theorem:nullable(s()),sourceRefs:sources}),
    prismPredicate:object({status:{enum:['UNVERIFIED','THEOREM_REFERENCE','CERTIFICATE_REQUIRED']},statement:s(),sourceRefs:sources,certificateRef:ref},['status','statement','sourceRefs']),
    scope:{anyOf:[scope,symbolicScope]},semanticStatus:{enum:['INTERFACE','COMPARISON_MODEL']}
  }),
  PrimeQuerySpec:schema('PrimeQuerySpec',{
    ...domainBase,original:object({kind:{const:'PrimeSet'},definition:s()}),
    query:object({lower:decimalInteger,upper:decimalInteger,completeness:{const:'BOUNDED_ENUMERATION'}}),scope,
    output:{enum:['ENUMERATE','COUNT','COUNT_AND_ENUMERATE','GAPS']}
  }),
  GaugeGroupSpec:schema('GaugeGroupSpec',{
    ...domainBase,name:s(),compact:{const:true},simple:{const:true},
    lieAlgebra:object({family:{enum:['A','B','C','D','E','F','G']},rank:integer(1),dimension:integer(3),basis:s(),bracket:s()}),
    globalForm:object({form:{enum:['SIMPLY_CONNECTED','ADJOINT','QUOTIENT']},cover:s(),kernel:s(),description:s()}),
    representation:object({kind:{enum:['MATRIX','ADJOINT','ROOT_DATA']},name:s(),dimension:integer(1),faithful:{type:'boolean'},convention:s()}),
    invariantInnerProduct:object({normalization:s(),formula:s()})
  }),
  StateFamilySpec:schema('StateFamilySpec',{
    ...domainBase,gaugeGroupRef:ref,
    fieldConstruction:object({kind:{enum:['EMBEDDED_BPST','LIE_ALGEBRA_EXPANSION','LATTICE_WILSON','DECLARED_MODEL']},rule:s(),gaugeConvention:s(),parameters:jsonObject,
      embedding:object({domain:{const:'SU(2)'},codomainRef:ref,formula:s(),index:{type:'number',exclusiveMinimum:0},certificateStatus:{enum:['DECLARED','THEOREM_REFERENCE','CERTIFICATE_REQUIRED']},sourceRefs:sources})
    },['kind','rule','gaugeConvention','parameters']),
    delta:object({mode:{enum:['ASSUMED_BOUND','UNIT_RESCALE','EFFECTIVE_FAMILY','ENSEMBLE_ESTIMATE']},value:{type:'number',exclusiveMinimum:0},units:s(),role:s()}),
    coupling:object({g:{type:'number',exclusiveMinimum:0},normalization:s()}),
    lattice:nullable(object({a:{type:'number',exclusiveMinimum:0},L:list(integer(1),{minItems:4,maxItems:4}),boundary:s()})),
    seed:nullable(s()),channels:list(object({id,kind:s(),definition:s()}),{minItems:1}),scope,
    energyInterpretation:{enum:['DECLARED_BOUND','UNIT_CONVENTION','EFFECTIVE_MODEL','CHANNEL_ESTIMATE']}
  }),
  PDEConstructionSpec:schema('PDEConstructionSpec',{
    ...domainBase,modelId:s(),modelKind:{enum:['PAPER_CONSTRUCTION','ILLUSTRATIVE_MODEL','GENERAL_SOLVER']},
    equation:s(),paper:nullable(object({sourceRef:ref,theorem:s(),equationLocations:list(s(),{minItems:1})})),
    force:object({kind:{enum:['PAPER_FORCE','MANUFACTURED_FORCE','GIVEN_FORCE','ZERO_FORCE']},definition:s(),divergenceFree:{type:'boolean'}}),
    initialCondition:object({definition:s(),domain:s()}),normalization:jsonObject,
    similarityCoordinates:nullable(object({definition:s(),validDomain:s()})),
    profiles:object({generator:s(),status:{enum:['PAPER_DEFINITION','ILLUSTRATIVE','CERTIFICATE_REQUIRED','UNAVAILABLE']}}),
    pulses:object({generator:s(),cutoffRule:s()}),correction:object({order:integer(0),tailStatus:{enum:['UNPROVED','FINITE_BOUND','CERTIFICATE_REQUIRED']},tailDefinition:nullable(s())}),
    scope,parameters:jsonObject
  }),
  ObservationMapSpec:observation,
  ComputeJobSpec:schema('ComputeJobSpec',{
    id,modelRef:ref,adapter:object({id:s(),version:s()}),sourceRefs:sources,assumptionRefs:refs,scope,precision,
    seed:nullable(s()),domain:jsonObject,basis:jsonObject,
    budget:object({maxMillis:integer(1),maxBytes:integer(1),maxItems:integer(0),maxOperations:integer(1)},['maxMillis','maxBytes','maxItems']),input:jsonObject
  }),
  ResultEnvelope:schema('ResultEnvelope',{
    jobId:id,inputHash:hash,environmentHash:hash,status:{enum:['COMPLETED','PARTIAL','CANCELLED','FAILED','UNSUPPORTED','PRECISION_REQUIRED','BUDGET_EXCEEDED']},scope,precision,
    values:jsonObject,errorLedger:object({rounding:{},discretization:{},tail:{},residual:{},stability:{},statistical:{}},['rounding','discretization','tail','residual','stability','statistical']),
    provenance:object({modelRef:ref,sourceRefs:sources,assumptionRefs:refs,adapter:object({id:s(),version:s()}),seed:nullable(s()),domain:jsonObject,basis:jsonObject,environment:jsonObject},['modelRef','sourceRefs','assumptionRefs','adapter','seed','domain','basis','environment'],{additionalProperties:true}),
    evidence:{...evidence,required:['grade','scopeKind','sourceRefs','assumptionRefs']},contentHash:hash,cacheKey:hash,checkpointRef:nullable(s()),message:s(),details:jsonObject
  },['jobId','inputHash','environmentHash','status','scope','precision','values','errorLedger','provenance','evidence'],{additionalProperties:true}),
  ClaimSpec:schema('ClaimSpec',{
    ...domainBase,statement:s(),scope:{anyOf:[scope,symbolicScope]},
    propositionKind:{enum:['FINITE_RESULT','INFINITE_OBJECT','WEIL_RH_FINITE_FIELD','CLASSICAL_RH','BSD','GLOBAL_SPECTRUM','OBSERVED_SPECTRUM','GENERAL']},
    logicRole:{enum:['THEOREM_TARGET','CONJECTURE','CONDITIONAL','OBSERVATION','EXTERNAL_REFERENCE']},grade:{enum:EVIDENCE_GRADES}
  }),
  LegacyObservation:schema('LegacyObservation',{
    module:{enum:['primes','cohomology','yangmills','navier']},input:jsonObject,scope,legacyRefs:refs,snapshot:jsonObject,
    grade:{enum:['NUMERICAL INDICATOR','RESEARCH HYPOTHESIS']}
  }),
  ProofJob:{
    $schema:'https://json-schema.org/draft/2020-12/schema',$id:'urn:mathscope:schema:ProofJob:1',title:'MathScope proof job metadata v1',
    ...object({schemaVersion:{const:'mathscope.proof-job/1'},id,claimId:id,target:s(),requestedGrade:{enum:['EXACT_FINITE','CONDITIONAL_FORMAL']},
      sourceFiles:list(object({path:s(),content:s(),sha256:hash}),{minItems:1}),
      assumptions:list(object({id,kind:s(),statement:s()},['id','kind','statement'],{additionalProperties:true})),
      dependencyGraph:object({nodes:list(object({id,kind:s(),statement:s()},['id','kind'],{additionalProperties:true})),edges:list(object({from:id,to:id,type:{const:'DEPENDS_ON'}}))}),
      context:jsonObject,environment:jsonObject,digests:object({source:hash,assumptions:hash,dependency:hash,context:hash,environment:hash,binding:hash}),graphAudit:jsonObject,
      status:{const:'PREPARED_LOCAL_CHECK_REQUIRED'},capability:{const:'EXPORT_AND_PINNED_AUDIT_ONLY'}
    })
  }
});

/** Deliberately strict JSON normal form. No silent loss of BigInt/undefined/NaN. */
function canonicalStringify(value) {
  const active = new Set();
  function visit(v,path,allowApproximateNumber=false) {
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
    if (typeof v === 'number') {
      if (!Number.isFinite(v) || (!allowApproximateNumber&&Number.isInteger(v)&&!Number.isSafeInteger(v))) throw new TypeError(`${path}: finite, safely represented JSON number required; use a decimal string for exact integers`);
      return Object.is(v,-0)?0:v;
    }
    if (typeof v !== 'object') throw new TypeError(`${path}: unsupported JSON value (${typeof v})`);
    if (active.has(v)) throw new TypeError(`${path}: cyclic JSON`);
    if (!Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) throw new TypeError(`${path}: plain JSON object required`);
    active.add(v);
    let out;
    if (Array.isArray(v)) {
      out=[];
      for (let i=0;i<v.length;i++) {
        if (!Object.hasOwn(v,i)) throw new TypeError(`${path}: sparse JSON array`);
        out.push(visit(v[i],`${path}[${i}]`,allowApproximateNumber));
      }
    } else {
      out={};
      for (const key of Object.keys(v).sort()) {
        if (['__proto__','prototype','constructor'].includes(key)) throw new TypeError(`${path}: reserved object key ${key}`);
        const approximate=(v.kind==='FLOAT64'&&key==='value')||(v.kind==='STATISTICAL_ESTIMATE'&&['estimate','standardError','interval'].includes(key));
        out[key]=visit(v[key],`${path}.${key}`,approximate);
      }
    }
    active.delete(v);return out;
  }
  return JSON.stringify(visit(value,'$'));
}
async function sha256(value) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 requires WebCrypto; no non-cryptographic fallback is allowed');
  const bytes=new TextEncoder().encode(typeof value==='string'?value:canonicalStringify(value));
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
const hashValue=sha256;
class ContractError extends Error { constructor(kind,errors) {super(`${kind}: ${errors.join('; ')}`);this.name='ContractError';this.kind=kind;this.errors=errors;} }

// Runtime validator implements the JSON-Schema keywords used by the exported schemas.
function checkSchema(spec,v,path,errors) {
  const fail=message=>errors.push(`${path}: ${message}`);
  if (spec.anyOf && !spec.anyOf.some(branch=>{const e=[];checkSchema(branch,v,path,e);return !e.length;})) fail('does not match any allowed variant');
  if (spec.oneOf && spec.oneOf.filter(branch=>{const e=[];checkSchema(branch,v,path,e);return !e.length;}).length!==1) fail('must match exactly one allowed variant');
  for (const branch of spec.allOf||[]) checkSchema(branch,v,path,errors);
  if (Object.hasOwn(spec,'const') && canonicalStringify(v)!==canonicalStringify(spec.const)) fail(`must equal ${JSON.stringify(spec.const)}`);
  if (spec.enum && !spec.enum.some(item=>canonicalStringify(item)===canonicalStringify(v))) fail('value is outside the allowed enum');
  if (spec.type) {
    const types=Array.isArray(spec.type)?spec.type:[spec.type];
    const matches=t=>t==='null'?v===null:t==='array'?Array.isArray(v):t==='integer'?Number.isSafeInteger(v):t==='object'?v!==null&&typeof v==='object'&&!Array.isArray(v):t==='number'?typeof v==='number'&&Number.isFinite(v):typeof v===t;
    if (!types.some(matches)) {fail(`expected ${types.join(' or ')}`);return;}
  }
  if (typeof v==='string') {
    if (spec.minLength!=null&&v.length<spec.minLength) fail(`length must be at least ${spec.minLength}`);
    if (spec.maxLength!=null&&v.length>spec.maxLength) fail(`length must be at most ${spec.maxLength}`);
    if (spec.pattern&&!new RegExp(spec.pattern).test(v)) fail(`does not match ${spec.pattern}`);
  }
  if (typeof v==='number') {
    if (spec.minimum!=null&&v<spec.minimum) fail(`must be >= ${spec.minimum}`);
    if (spec.maximum!=null&&v>spec.maximum) fail(`must be <= ${spec.maximum}`);
    if (spec.exclusiveMinimum!=null&&v<=spec.exclusiveMinimum) fail(`must be > ${spec.exclusiveMinimum}`);
    if (spec.exclusiveMaximum!=null&&v>=spec.exclusiveMaximum) fail(`must be < ${spec.exclusiveMaximum}`);
  }
  if (Array.isArray(v)) {
    if (spec.minItems!=null&&v.length<spec.minItems) fail(`requires at least ${spec.minItems} items`);
    if (spec.maxItems!=null&&v.length>spec.maxItems) fail(`allows at most ${spec.maxItems} items`);
    if (spec.items) v.forEach((item,i)=>checkSchema(spec.items,item,`${path}[${i}]`,errors));
    if (spec.uniqueItems&&new Set(v.map(canonicalStringify)).size!==v.length) fail('duplicate items');
  }
  if (v&&typeof v==='object'&&!Array.isArray(v)) {
    for (const key of spec.required||[]) if (!Object.hasOwn(v,key)) fail(`required property ${key} missing`);
    for (const [key,value] of Object.entries(v)) {
      if (spec.properties?.[key]) checkSchema(spec.properties[key],value,`${path}.${key}`,errors);
      else if (spec.additionalProperties===false) fail(`unknown property ${key}`);
      else if (typeof spec.additionalProperties==='object') checkSchema(spec.additionalProperties,value,`${path}.${key}`,errors);
    }
  }
}
function isCanonicalInteger(v) {return typeof v==='string'&&/^(0|[1-9][0-9]*|-[1-9][0-9]*)$/.test(v);}
function scopeSemantics(v,errors,path='$.scope') {
  if (!v||v.kind!=='FINITE') return;
  if (v.primeInterval&&isCanonicalInteger(v.primeInterval.lower)&&isCanonicalInteger(v.primeInterval.upper)) {
    if (BigInt(v.primeInterval.lower)>BigInt(v.primeInterval.upper)) errors.push(`${path}: lower prime bound exceeds upper`);
    if (BigInt(v.primeInterval.lower)<0n) errors.push(`${path}: prime interval begins below zero`);
  }
  if (v.pAdic&&isCanonicalInteger(v.pAdic.p)&&BigInt(v.pAdic.p)<2n) errors.push(`${path}: p must be >= 2`);
  for (const bound of v.spatial?.bounds||[]) if (bound[0]>bound[1]) errors.push(`${path}: spatial lower bound exceeds upper`);
}
function precisionSemantics(v,errors) {
  if (!v) return;
  if (v.kind==='PADIC'&&!Number.isSafeInteger(v.digits)) errors.push('$.precision: PADIC requires digits');
  if (['REAL_INTERVAL','COMPLEX_INTERVAL'].includes(v.kind)&&!Number.isSafeInteger(v.absoluteBits)&&!Number.isSafeInteger(v.workingBits)) errors.push('$.precision: interval arithmetic requires absoluteBits or workingBits');
  if (v.kind==='STATISTICAL'&&typeof v.confidence!=='number') errors.push('$.precision: statistical confidence required');
}
function dimensionOfLieAlgebra(f,r) {return f==='A'?r*(r+2):['B','C'].includes(f)?r*(2*r+1):f==='D'?r*(2*r-1):f==='G'&&r===2?14:f==='F'&&r===4?52:f==='E'?({6:78,7:133,8:248}[r]??null):null;}
function validate(kind,value) {
  const errors=[],warnings=[];
  try {canonicalStringify(value);} catch(error) {return {ok:false,errors:[error.message],warnings};}
  const spec=SCHEMAS[kind];
  if (!spec) return {ok:false,errors:[`Unknown contract ${kind}`],warnings};
  checkSchema(spec,value,'$',errors);
  if (errors.length) return {ok:false,errors,warnings};
  if (value.scope) scopeSemantics(value.scope,errors);
  if (kind==='FiniteScope') scopeSemantics(value,errors,'$');
  if (value.precision) precisionSemantics(value.precision,errors);
  if (kind==='PrecisionBudget') precisionSemantics(value,errors);
  if (kind==='M1ObjectSpec') {
    const kinds={'arithmetic.primes':'PrimeSetQuery','arithmetic.primeCertificate':'PrimeSetQuery','arithmetic.padic':'PadicObject','arithmetic.point':'PointComparison','arithmetic.p1':'P1Comparison','arithmetic.localFactors':'LocalFactorFamily','arithmetic.verify':'ValidationFixture','gauge.group':'GaugeGroup','gauge.field':'Connection4D','gauge.family':'StateFamily','gauge.holonomy':'Holonomy','gauge.spectral':'SpectralModel','ns.provenance':'NavierStokesComponent','ns.coordinates':'NavierStokesComponent','ns.heat':'NavierStokesComponent','ns.exterior':'NavierStokesComponent','ns.axis-series':'NavierStokesComponent','ns.moments':'NavierStokesComponent','ns.cone':'NavierStokesComponent','ns.benchmark':'NavierStokesComponent','ns.leading-profile':'LeadingProfileCandidate','ns.validate':'ValidationFixture','ns.axis-certificate':'NavierStokesComponent','ns.source-outer':'NavierStokesComponent','ns.controlled-continuation':'NavierStokesComponent','ns.admissible-loop':'NavierStokesComponent','ns.pressure-certificate':'NavierStokesComponent','ns.axis-source-certificate':'NavierStokesComponent','ns.radial-modulation':'NavierStokesComponent','ns.source-inner-gluing':'NavierStokesComponent'};
    if(kinds[value.request.kind]!==value.objectType)errors.push('M1 object type does not match its installed domain operation');
    const expected=value.request.kind.startsWith('gauge.')?'GAUGE':value.request.kind.startsWith('ns.')?'PDE':['PointComparison','P1Comparison'].includes(value.objectType)?'COHOMOLOGY':value.objectType==='ValidationFixture'?'VERIFICATION':'ARITHMETIC';
    if(value.domain!==expected)errors.push('M1 domain does not match its mathematical object');
    warnings.push('The immutable request identifies the mathematical input. The installed domain validator must accept it before execution; serialized metadata never establishes a theorem.');
  }
  if (kind==='PrimeQuerySpec') {
    const interval=value.scope.primeInterval;
    if (!interval||interval.lower!==value.query.lower||interval.upper!==value.query.upper) errors.push('Prime query bounds must equal the finite scope bounds');
  }
  if (kind==='PrismSpec') {
    const p=BigInt(value.p);
    if (p<2n) errors.push('Prism p must be at least 2');
    if (p<=1000000n) {for (let d=2n;d*d<=p;d++) if (p%d===0n) {errors.push('Prism p is composite');break;}}
    else warnings.push('Large p is declared; a backend primality certificate is required before computation');
    if (value.semanticStatus==='COMPARISON_MODEL'&&(value.comparison.status==='NONE'||value.comparison.sourceRefs.length===0||value.prismPredicate.status==='UNVERIFIED')) errors.push('Comparison model requires a cited comparison and explicit prism-predicate provenance');
    if (value.prismPredicate.status!=='UNVERIFIED'&&value.prismPredicate.sourceRefs.length===0) errors.push('Prism predicate provenance is missing');
    warnings.push('Contract validity does not verify a prism predicate or compute a prismatic complex');
  }
  if (kind==='GaugeGroupSpec') {
    const a=value.lieAlgebra,dim=dimensionOfLieAlgebra(a.family,a.rank);
    if (dim===null||dim!==a.dimension) errors.push('Lie algebra family, rank and dimension are inconsistent');
    if (a.family==='D'&&a.rank<3) errors.push('D rank below 3 is not a simple compact Lie algebra');
    warnings.push('Lie bracket, representation and compact/simple realization remain mathematical proof obligations');
  }
  if (kind==='StateFamilySpec') {
    if (value.fieldConstruction.kind==='EMBEDDED_BPST'&&!value.fieldConstruction.embedding) errors.push('An explicit SU(2) embedding into the declared global G is required');
    if (value.fieldConstruction.embedding&&canonicalStringify(value.fieldConstruction.embedding.codomainRef)!==canonicalStringify(value.gaugeGroupRef)) errors.push('Embedding codomain must be exactly the declared gauge group revision');
    if (value.fieldConstruction.kind==='LATTICE_WILSON'&&(!value.lattice||value.seed===null)) errors.push('Wilson lattice field requires a lattice and seed');
    const meanings={ASSUMED_BOUND:'DECLARED_BOUND',UNIT_RESCALE:'UNIT_CONVENTION',EFFECTIVE_FAMILY:'EFFECTIVE_MODEL',ENSEMBLE_ESTIMATE:'CHANNEL_ESTIMATE'};
    if (meanings[value.delta.mode]!==value.energyInterpretation) errors.push('Delta mode and energy interpretation disagree');
    if (value.delta.mode==='ASSUMED_BOUND'&&value.assumptionRefs.length===0) errors.push('Assumed delta bound must reference an explicit USER_AXIOM/hypothesis record');
  }
  if (kind==='PDEConstructionSpec') {
    if (!value.modelId.startsWith(value.modelKind.toLowerCase()+':')) errors.push('modelId must be namespaced by the modelKind');
    if (value.modelKind==='PAPER_CONSTRUCTION'&&(!value.paper||value.force.kind!=='PAPER_FORCE'||value.profiles.status==='ILLUSTRATIVE')) errors.push('Paper reconstruction requires paper locations, paper force, and actual-paper profile definition');
    if (value.force.kind==='MANUFACTURED_FORCE'&&value.modelKind==='PAPER_CONSTRUCTION') errors.push('Manufactured force cannot be recorded as the paper construction');
    if (value.scope.kind!=='FINITE'||(!value.scope.spatial?.timeMax&&!value.scope.series?.timeMax)) errors.push('PDE computation requires a finite positive time upper bound');
  }
  if (kind==='AssumptionLedger') {
    if (new Set(value.assumptions.map(a=>a.id)).size!==value.assumptions.length) errors.push('Duplicate assumption IDs');
    value.assumptions.forEach(a=>assumptionSemantics(a,errors));
  }
  if (kind==='AssumptionSpec') assumptionSemantics(value,errors);
  if (kind==='SourceManifest') {
    if (new Set(value.entries.map(a=>a.id)).size!==value.entries.length) errors.push('Duplicate source IDs');
    for (const entry of value.entries) if (entry.availability==='AVAILABLE'&&!entry.sha256) errors.push(`Available source ${entry.id} needs a content SHA-256`);
  }
  if (kind==='ObservationMapSpec') {
    if (value.method==='SCALAR_MARGINAL'&&/connection|gaugefield|gauge-field/i.test(value.outputType)) errors.push('A scalar marginal cannot return a gauge connection');
    if (value.method==='WILSON_LINE'&&(!value.gaugeConvention||!value.endpointData)) errors.push('Open Wilson line requires endpoint and gauge convention metadata');
    if (value.sourceDimension>value.displayDimension&&value.lostInformation.length===0) errors.push('Dimension reduction must describe discarded information');
  }
  if (kind==='ComputeJobSpec'&&value.sourceRefs.length===0) warnings.push('No source files pinned; executable adapter versions must be pinned in result provenance');
  if (kind==='ResultEnvelope') {
    if(canonicalStringify(value.evidence.assumptionRefs)!==canonicalStringify(value.provenance.assumptionRefs)||canonicalStringify(value.evidence.sourceRefs)!==canonicalStringify(value.provenance.sourceRefs)) errors.push('Evidence and result provenance must retain identical source and assumption references');
    if (['FORMAL PASS','THEOREM-BACKED'].includes(value.evidence.grade)) errors.push('Generic computation cannot issue FORMAL PASS or THEOREM-BACKED; use an audited proof receipt');
    if (['conditional-formal','theorem-reference'].includes(value.evidence.scopeKind)) errors.push('Computation result is not a proof/audited theorem mapping');
    if (value.evidence.scopeKind==='statistical'&&value.evidence.grade==='CERTIFIED NUMERICAL') errors.push('A statistical confidence interval is not a rigorous interval certificate');
    if (value.status!=='COMPLETED'&&value.evidence.supportsCurrent===true) errors.push('Incomplete result cannot claim current completed support');
    if (value.evidence.scopeKind==='exact-finite'&&value.precision.kind!=='EXACT') errors.push('Exact-finite result requires exact arithmetic precision');
    if (value.evidence.scopeKind==='interval-certified'&&!['REAL_INTERVAL','COMPLEX_INTERVAL','PADIC'].includes(value.precision.kind)) errors.push('Certified interval scope requires a typed interval/valuation precision');
  }
  if (kind==='ClaimSpec'&&['FORMAL PASS','THEOREM-BACKED'].includes(value.grade)) errors.push('A target declaration cannot issue FORMAL PASS or THEOREM-BACKED; use an audited receipt');
  return {ok:errors.length===0,errors,warnings};
}
function assumptionSemantics(a,errors) {
  if (a.origin==='USER_AXIOM'&&a.status==='THEOREM_REFERENCE') errors.push(`User axiom ${a.id} cannot be relabeled as an external theorem`);
  if (a.origin==='EXTERNAL_THEOREM'&&a.sourceRefs.length===0) errors.push(`External theorem ${a.id} requires a source`);
}
function containsUserAxiom(payload) {return payload?.origin==='USER_AXIOM'||(payload?.schema==='MathScope.AssumptionLedger/1'&&payload.assumptions.some(a=>a.origin==='USER_AXIOM'));}
function assertValid(kind,value) {const report=validate(kind,value);if(!report.ok)throw new ContractError(kind,report.errors);return value;}
const validateComputeJobSpec=value=>validate('ComputeJobSpec',value);
const validateResultEnvelope=value=>validate('ResultEnvelope',value);
const validatePrismSpec=value=>validate('PrismSpec',value);
function effectiveEvidenceTrust(record,{receipt,isVerifiedProofReceipt}={}) {
  // Display the audited receipt itself.  A second metadata record cannot borrow
  // its authority merely by sharing a claim ID or copying a digest field.
  const directReceipt=record&&(!receipt||record===receipt)?record:null;
  if (directReceipt&&typeof isVerifiedProofReceipt==='function'&&isVerifiedProofReceipt(directReceipt)) return {status:'LOCAL_AUDIT_VERIFIED',grade:directReceipt.grade,conditional:directReceipt.grade==='CONDITIONAL_FORMAL'||directReceipt.axioms?.custom?.length>0,scope:directReceipt.scope,claimId:directReceipt.claimId};
  return {status:'REVALIDATION_REQUIRED',grade:record?.grade||'UNKNOWN',conditional:record?.scopeKind==='conditional-formal',scope:record?.scopeKind||'historical-metadata'};
}
/** Semantic restrictions on an edge are independent of diagram placement. */
function validateProofEdge(edge,nodes,{isVerifiedCertificate}={}) {
  const errors=[],warnings=[];
  const map=nodes instanceof Map?nodes:new Map((Array.isArray(nodes)?nodes:Object.values(nodes||{})).map(n=>[n.id,n]));
  if (!edge||!EDGE_TYPES.includes(edge.type)) return {ok:false,errors:['Unsupported dependency edge type'],warnings};
  const from=map.get(edge.from),to=map.get(edge.to);
  if (!from||!to) return {ok:false,errors:['Dependency endpoints must exist'],warnings};
  if (edge.from===edge.to) errors.push('Self-dependency is circular');
  const a=from.payload||from,b=to.payload||to;
  const proofEdge=['LOCAL_TO_GLOBAL','BASE_CHANGE','PROJECTION','LIMIT','VERIFIED_BY'].includes(edge.type);
  if (a.propositionKind==='WEIL_RH_FINITE_FIELD'&&b.propositionKind==='CLASSICAL_RH'&&proofEdge) errors.push('Finite-field Weil RH is not a classical RH proof bridge');
  if (a.propositionKind==='OBSERVED_SPECTRUM'&&b.propositionKind==='GLOBAL_SPECTRUM'&&proofEdge&&!edge.semanticBridge?.spectralInclusion) errors.push('Observed channel requires an explicit original-to-observed spectral inclusion theorem');
  if (a.scope?.kind==='FINITE'&&b.scope?.kind==='SYMBOLIC'&&proofEdge&&!edge.semanticBridge?.limitStatement) errors.push('Finite-to-infinite inference requires a quantified limit/coverage theorem');
  if (proofEdge) {
    if (!edge.certificate||typeof isVerifiedCertificate!=='function'||!isVerifiedCertificate(edge.certificate)) errors.push('Proof edge requires a live audited certificate; imported metadata is not proof');
    if (edge.certificate&&edge.certificate.claimId!==edge.to) errors.push('Certificate target does not match the dependency target');
    const binding=edge.certificate?.context?.graphBinding;
    const refMatches=(r,n)=>r&&r.id===n.id&&r.revision===n.revision&&r.hash===n.hash&&typeof n.hash==='string';
    if(!binding||!refMatches(binding.from,from)||!refMatches(binding.to,to)) errors.push('Proof receipt must bind both exact graph endpoint revisions and payload hashes; a theorem with the same label is insufficient');
  }
  if (containsUserAxiom(a)&&edge.type!=='ASSUMES'&&edge.type!=='CITES') errors.push('USER_AXIOM dependencies must remain explicit ASSUMES edges');
  if (containsUserAxiom(a)&&edge.type==='ASSUMES'&&b.logicRole==='THEOREM_TARGET') errors.push('Unconditional theorem target cannot assume a USER_AXIOM');
  if (['DEPENDS_ON','COMPUTES','CITES'].includes(edge.type)) warnings.push('Dependency/citation edge is provenance, not logical entailment');
  return {ok:errors.length===0,errors,warnings};
}

/** Complete, deliberately finite/unverified starting contracts for the IDE. */
async function getContractExamples() {
  const source={schema:'MathScope.SourceManifest/1',id:'m0-source-baseline',revision:'m0-source-baseline:r1',entries:[{
    id:'v031-page41',kind:'BASELINE',title:'MathScope v0.3.1 page 41 snapshot',uri:'https://project29770.websitepublisher.ai/v0.3.1.html',
    sha256:'5cf7e919b8a221873c8a65523ad1e74d60ec551dc4e3c6e0b09b782c42238755',availability:'AVAILABLE',locator:'version 41 / d400a17e',version:'41',license:null
  }]};
  const sourceRef={id:source.id,revision:source.revision,hash:await sha256(source)};
  const base=(id)=>({id,revision:`${id}:r1`,sourceRefs:[sourceRef],assumptionRefs:[]});
  const a={schema:'MathScope.AssumptionSpec/1',id:'m0-assume-gap',revision:'m0-assume-gap:r1',statement:'In the selected spectral model and fixed energy units, every positive spectral energy is at least delta > 0.',reason:'Explore a conditional corollary with the selected gap bound explicitly assumed.',origin:'USER_AXIOM',status:'DECLARED',sourceRefs:[],usedBy:[],scope:{kind:'SYMBOLIC',definition:'Conditional spectral model'},introducedBy:'MathScope user assumption mode'};
  const aRef={id:a.id,revision:a.revision,hash:await sha256(a)};
  const prime={schema:'MathScope.PrimeQuerySpec/1',...base('m0-primes'),original:{kind:'PrimeSet',definition:'The natural numbers p ≥ 2 whose only positive divisors are 1 and p.'},query:{lower:'2',upper:'200',completeness:'BOUNDED_ENUMERATION'},scope:{kind:'FINITE',primeInterval:{lower:'2',upper:'200'}},output:'COUNT_AND_ENUMERATE'};
  const prism={schema:'MathScope.PrismSpec/1',...base('m0-prism-p1'),p:'5',ring:{kind:'PADIC_INTEGER_RING',presentation:'Z_5 as the inverse limit of Z/5^N Z',completion:'5-adic completion'},ideal:{generators:['5'],presentation:'I=(5) in Z_5'},delta:{rule:'delta(a)=(a-a^5)/5 on Z_5',inputExtraDigits:1,convention:'Frobenius lift phi=id on Z_5'},frobenius:{rule:'phi(a)=a; geometric lift t -> t^5 on each compatible chart',convention:'Absolute crystalline Frobenius, basis conventions required',semilinear:true,cutoffRule:'A chart cutoff D maps into cutoff 5D; never silently crop'},geometricObject:{kind:'PROJECTIVE_SPACE',presentation:'P^1 over F_5, with charts t and s=t^-1',dimension:1},hypotheses:{smooth:true,proper:true,details:['These geometric hypotheses are declared in this initial interface.']},comparison:{status:'NONE',theorem:null,sourceRefs:[]},prismPredicate:{status:'UNVERIFIED',statement:'(Z_5,(5)) is the specified crystalline prism; attach comparison and formal provenance before upgrading the interface.',sourceRefs:[]},scope:{kind:'FINITE',pAdic:{p:'5',digits:4},series:{order:1}},semanticStatus:'INTERFACE'};
  const group={schema:'MathScope.GaugeGroupSpec/1',...base('m0-gauge-su2'),name:'SU(2)',compact:true,simple:true,lieAlgebra:{family:'A',rank:1,dimension:3,basis:'T_a=-i sigma_a/2',bracket:'[T_a,T_b]=epsilon_{abc} T_c'},globalForm:{form:'SIMPLY_CONNECTED',cover:'SU(2)',kernel:'{1}',description:'Simply connected compact form, distinguished from SO(3).'},representation:{kind:'MATRIX',name:'Defining complex representation',dimension:2,faithful:true,convention:'Anti-Hermitian traceless 2 by 2 matrices'},invariantInnerProduct:{normalization:'<T_a,T_b>=delta_ab',formula:'<X,Y>=-2 Tr(XY)'}};
  const groupRef={id:group.id,revision:group.revision,hash:await sha256(group)};
  const family={schema:'MathScope.StateFamilySpec/1',...base('m0-state-family'),gaugeGroupRef:groupRef,fieldConstruction:{kind:'EMBEDDED_BPST',rule:'Use the declared identity embedding of the classical SU(2) BPST field with rho=kappa/delta; no quantum gap identification.',gaugeConvention:'regular gauge',parameters:{kappa:1,center:[0,0,0,0]},embedding:{domain:'SU(2)',codomainRef:groupRef,formula:'identity on SU(2)',index:1,certificateStatus:'DECLARED',sourceRefs:[]}},delta:{mode:'EFFECTIVE_FAMILY',value:1,units:'chosen units with hbar*c=1',role:'An explicit model size parameter via rho=kappa/delta.'},coupling:{g:1,normalization:'S_E/hbar with the recorded invariant inner product'},lattice:null,seed:null,channels:[{id:'q4-density',kind:'SCALAR_DENSITY',definition:'Normalized classical BPST scalar density'}],scope:{kind:'FINITE',spatial:{bounds:[[-4,4],[-4,4],[-4,4],[-4,4]]}},energyInterpretation:'EFFECTIVE_MODEL'};
  const familyRef={id:family.id,revision:family.revision,hash:await sha256(family)};
  const obs={schema:'MathScope.ObservationMapSpec/1',...base('m0-density-observation'),sourceObjectRef:familyRef,sourceType:'4D classical scalar density',outputType:'3D scalar density samples',method:'SLICE',definition:'q_slice(y)=q4(y,c), c=0; x4 is a Euclidean coordinate.',sourceDimension:4,displayDimension:3,scope:{kind:'FINITE',spatial:{bounds:[[-4,4],[-4,4],[-4,4]]}},axes:[1,2,3].map(i=>({name:`x${i}`,sourceField:`x${i}`,kind:'PHYSICAL',unit:'chosen length unit',scale:'LINEAR'})),lostInformation:['Values away from the selected x4=0 slice','Gauge connection and quantum spectrum are not reconstructed from scalar density'],injectivity:'NON_INJECTIVE',inverse:{status:'UNAVAILABLE'},gaugeConvention:null,endpointData:null,parameters:{slice:0}};
  const pde={schema:'MathScope.PDEConstructionSpec/1',...base('m0-pde-solver'),modelId:'general_solver:periodic-taylor-green',modelKind:'GENERAL_SOLVER',equation:'du/dt + (u·grad)u = -grad p + nu Laplacian u + f; div u=0',paper:null,force:{kind:'ZERO_FORCE',definition:'f=0 for this independent benchmark',divergenceFree:true},initialCondition:{definition:'u0=(sin x cos y,-cos x sin y,0)',domain:'(R/2pi Z)^3'},normalization:{nu:1,period:6.283185307179586},similarityCoordinates:null,profiles:{generator:'Taylor–Green initial data; no paper reconstruction profile',status:'ILLUSTRATIVE'},pulses:{generator:'No pulses in this benchmark',cutoffRule:'Finite Fourier mode cutoff recorded by the solver'},correction:{order:0,tailStatus:'UNPROVED',tailDefinition:null},scope:{kind:'FINITE',spatial:{bounds:[[0,6.283185307179586],[0,6.283185307179586],[0,6.283185307179586]],timeMax:0.9},series:{order:8,timeMax:0.9}},parameters:{modeCutoff:8}};
  const claim={schema:'MathScope.ClaimSpec/1',...base('m0-gap-claim'),assumptionRefs:[aRef],statement:'Under the selected positive gap assumption, no spectral energy lies strictly between zero and delta.',scope:{kind:'SYMBOLIC',definition:'Selected spectral interface with explicit USER_AXIOM dependency'},propositionKind:'GENERAL',logicRole:'CONDITIONAL',grade:'RESEARCH HYPOTHESIS'};
  const all={SourceManifest:source,AssumptionSpec:a,AssumptionLedger:{schema:'MathScope.AssumptionLedger/1',id:'m0-assumptions',revision:'m0-assumptions:r1',assumptions:[a]},PrismSpec:prism,PrimeQuerySpec:prime,GaugeGroupSpec:group,StateFamilySpec:family,PDEConstructionSpec:pde,ObservationMapSpec:obs,ClaimSpec:claim};
  for(const [kind,value] of Object.entries(all))assertValid(kind,value);
  return all;
}

return {CONTRACT_VERSION,VERSION,LEGACY_SESSION_SCHEMA,EVIDENCE_GRADES,EDGE_TYPES,SCHEMAS,canonicalStringify,sha256,hashValue,ContractError,validate,containsUserAxiom,assertValid,validateComputeJobSpec,validateResultEnvelope,validatePrismSpec,effectiveEvidenceTrust,validateProofEdge,getContractExamples};
})();
const __m2_1 = (()=>{
/**
 * Read-only presentation adapter for M1/M2 computation receipts.
 * No calculation/proof state is mutated. Exact cells are retained independently
 * of the finite binary64 coordinates used by the display renderer.
 */
const {canonicalStringify,sha256} = __m2_0;
const VISUALIZATION_VERSION = '2.0.0';
const TERMINAL_FAILURE = new Set(['FAILED','CANCELLED','UNSUPPORTED','PRECISION_REQUIRED','BUDGET_EXCEEDED']);
const COPY = value => value === undefined ? null : JSON.parse(JSON.stringify(value));
const isFiniteNumber = v => typeof v === 'number' && Number.isFinite(v);
const minmax = values => { let lo=Infinity,hi=-Infinity; for(const v of values)if(Number.isFinite(v)){lo=Math.min(lo,v);hi=Math.max(hi,v);}return lo===Infinity?null:[lo,hi]; };
const point3 = v => Array.isArray(v) && v.length===3 && v.every(Number.isFinite);
const cap = (v,fallback,maximum) => Number.isSafeInteger(v)&&v>0?Math.min(v,maximum):fallback;

/** Explicit scalar admission; a p-adic residue is never silently a real scalar. */
function numericValue(value) {
  if(isFiniteNumber(value))return value;
  if(typeof value==='bigint')return Number.isFinite(Number(value))?Number(value):NaN;
  if(typeof value==='string'){
    const s=value.trim();
    if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)){
      const n=Number(s);return Number.isFinite(n)&&(n!==0||!/[1-9]/.test(s.split(/[eE]/)[0]))?n:NaN;
    }
    if(/^[+-]?\d+\/[+-]?\d+$/.test(s)){
      const [a,b]=s.split('/').map(Number),n=a/b;
      return Number.isFinite(a)&&Number.isFinite(b)&&b!==0&&Number.isFinite(n)&&(n!==0||a===0)?n:NaN;
    }
    return NaN;
  }
  if(!value||Array.isArray(value)||typeof value!=='object')return NaN;
  if(['FLOAT64','EXACT_INTEGER','INTEGER','RATIONAL','EXACT_RATIONAL','REAL'].includes(value.kind)&&'value' in value)return numericValue(value.value);
  if(['RATIONAL','EXACT_RATIONAL'].includes(value.kind))return numericValue(String(value.numerator??value.n)+'/'+String(value.denominator??value.d));
  if(value.type==='real-ball'&&'midpoint' in value)return numericValue(value.midpoint);
  // Exact interval certificates use {exact:'a/b', approximate:...} scalars.
  if(typeof value.exact==='string')return numericValue(value.exact);
  return NaN;
}

/** Full exact/typed value for a table cell; no toPrecision and no unsafe integer cast. */
function scalarText(value) {
  if(value===undefined||value===null)return '—';
  if(typeof value==='string'||typeof value==='number'||typeof value==='bigint')return String(value);
  if(typeof value==='boolean')return value?'true':'false';
  if(Array.isArray(value))return '['+value.map(scalarText).join(', ')+']';
  if(value.kind==='FLOAT64')return String(value.value)+' [Float64]';
  if(['EXACT_INTEGER','INTEGER','REAL'].includes(value.kind)&&'value' in value)return scalarText(value.value);
  if(['RATIONAL','EXACT_RATIONAL'].includes(value.kind))return 'value' in value?scalarText(value.value):String(value.numerator??value.n)+'/'+String(value.denominator??value.d);
  if(value.kind==='PADIC_BALL')return value.residue+' + O('+value.p+'^'+value.digits+')';
  if(value.type==='real-ball')return '['+scalarText(value.lower)+', '+scalarText(value.upper)+']';
  if(typeof value.exact==='string')return value.exact;
  return JSON.stringify(value);
}

function sampleIndices(length,limit) {
  if(length<=0)return [];
  limit=cap(limit,4000,24000);
  if(length<=limit)return Array.from({length},(_,i)=>i);
  if(limit===1)return [0];
  return Array.from({length:limit},(_,i)=>Math.floor(i*(length-1)/(limit-1)));
}
const sample = (list,n) => sampleIndices(list.length,n).map(i=>list[i]);
const axis = (label,type,sourceField,extra={}) => ({label,type,unit:'1',sourceField,scale:'linear',transform:'identity',dataDimension:1,physicalDimension:null,...extra});
const col = (label,sourceField,type='EXACT_OR_TYPED') => ({label,sourceField,type});
function table(columns,rows,sourcePaths,title='정확한 관측값') {return {title,columns:columns.map(c=>typeof c==='string'?col(c,c):c),rows:rows.map(r=>r.map(scalarText)),sourcePaths:sourcePaths||rows.map(()=>null),totalRows:rows.length,truncated:false};}
const emptyScene = () => ({points:[],lines:[],arrows:[],axes:['','','']});
function sceneFromChart(chart) {
  const points=[],lines=[];
  if(chart.kind==='SERIES')for(const s of chart.series||[]){const ps=(s.points||[]).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));for(const p of ps)points.push({pos:[p.x,p.y,0],value:p.y,label:p.label||s.label,sourcePath:p.sourcePath,color:s.color});if(s.connect!==false&&ps.length>1)lines.push({points:ps.map(p=>[p.x,p.y,0]),label:s.label,color:s.color});}
  if(chart.kind==='MATRIX')for(let i=0;i<chart.values.length;i++)for(let j=0;j<chart.values[i].length;j++){const v=numericValue(chart.values[i][j]);if(Number.isFinite(v))points.push({pos:[j,i,0],value:v,label:`${chart.rowLabels[i]}, ${chart.columnLabels[j]}: ${scalarText(chart.values[i][j])}`,sourcePath:`${chart.sourceField}[${i}][${j}]`});}
  if(chart.kind==='INTERVALS')for(const [i,p]of chart.items.entries()){if(Number.isFinite(p.midpoint))points.push({pos:[i,p.midpoint,0],value:p.midpoint,label:p.label,sourcePath:p.sourcePath});if(Number.isFinite(p.lower)&&Number.isFinite(p.upper))lines.push({points:[[i,p.lower,0],[i,p.upper,0]],label:p.label});}
  if(chart.kind==='NETWORK'){const byId=new Map(chart.nodes.map(n=>[n.id,n]));for(const n of chart.nodes)points.push({pos:[n.x,n.y,0],label:n.label,sourcePath:n.sourcePath});for(const e of chart.edges){const a=byId.get(e.from),b=byId.get(e.to);if(a&&b)lines.push({points:[[a.x,a.y,0],[b.x,b.y,0]],label:e.label||''});}}
  if(chart.kind==='CHECKS')for(const [i,p]of chart.items.entries())points.push({pos:[i,p.pass===true?1:p.pass===false?0:.5,0],label:p.label+' · '+p.status,value:p.pass===true?1:p.pass===false?0:.5,sourcePath:p.sourcePath});
  return {points,lines,arrows:[],axes:[chart.xLabel||'',chart.yLabel||'','도식 배치']};
}

function matrixView(values,rowLabels,columnLabels,sourceField,title,meaning) {
  const rows=values.flatMap((r,i)=>r.map((v,j)=>[rowLabels[i],columnLabels[j],v]));
  const paths=values.flatMap((r,i)=>r.map((_,j)=>`${sourceField}[${i}][${j}]`));
  return {kind:'MATRIX',title,description:meaning,chart:{kind:'MATRIX',values:COPY(values),rowLabels,columnLabels,sourceField,xLabel:'열 · '+(columnLabels[0]?.startsWith('α')?'simple root':'basis'),yLabel:'행 · '+(rowLabels[0]?.startsWith('α')?'simple coroot':'basis')},axisMetadata:[axis('열','CATEGORICAL',sourceField),axis('행','CATEGORICAL',sourceField),axis('계수','EXACT_RATIONAL',sourceField)],table:table(['행','열','정확한 계수'],rows,paths),lostInformation:['행·열의 간격은 군 다양체의 거리나 근의 유클리드 각도가 아닙니다.']};
}

function arithmeticCertificate(r) {
  const data=r.results||{},cert=data.certificate;
  if(!cert)return null;
  const nodes=[],edges=[],rows=[],paths=[],depthCount=new Map();
  const visit=(c,depth,parent,path,exponent)=>{
    if(nodes.length>=256)return;
    const id=path,y=depthCount.get(depth)||0;depthCount.set(depth,y+1);
    nodes.push({id,x:depth,y,label:'n='+c.n,sourcePath:path});
    rows.push([c.n,c.scheme,c.witness??c.base??'—',exponent??'—',parent?nodes.find(n=>n.id===parent)?.label:'root']);paths.push(path);
    if(parent)edges.push({from:parent,to:id,label:'因子 ^'+exponent});
    for(const [i,f]of (c.factors||[]).entries())if(f.certificate)visit(f.certificate,depth+1,id,path+`.factors[${i}].certificate`,f.exponent);
  };
  visit(cert,0,null,'result.results.certificate',null);
  return {kind:'NETWORK',title:'Lucas–Pratt 소수 인증 의존 그래프',description:'노드는 증명서에 등장한 정확한 정수이며, 선은 n−1의 소인수 인증 의존성을 표시합니다. 큰 정수는 문자열 그대로 보존합니다.',chart:{kind:'NETWORK',nodes,edges,xLabel:'인증 의존 깊이',yLabel:'동일 깊이의 인증 노드'},axisMetadata:[axis('인증 의존 깊이','CATEGORICAL','certificate.factors'),axis('노드 배치','CATEGORICAL','certificate.n')],table:table(['정확한 n','인증 방식','witness / base','소인수 지수','상위 인증'],rows,paths),lostInformation:['노드 사이 거리는 정수 차이나 소수 분포를 나타내지 않습니다.','화면은 정확한 인증 계산의 결과 표시이며 새 Lean 커널 증명을 만들지 않습니다.']};
}

function padicView(r) {
  const d=r.results||{},op=d.operation;
  if(d.value?.kind==='PADIC_BALL'){
    const ball=d.value,p=BigInt(ball.p),N=ball.digits;let residue=BigInt(ball.residue);const points=[],rows=[];
    for(let i=0;i<N;i++){const digit=residue%p;residue/=p;const n=Number(digit);if(Number.isFinite(n))points.push({x:i,y:n,label:`a_${i}=${digit}`,sourcePath:`result.results.value:digit[${i}]`});rows.push([i,digit,p.toString()+'^'+i,ball.residue,ball.digits]);}
    return {kind:'SERIES',title:'p-adic 유한 정밀도 자리 관측',description:`${scalarText(ball)} · 계수 a_k는 Σ a_k p^k의 정확한 유한 자리입니다. ${d.precision?.formula||''}`,chart:{kind:'SERIES',series:[{label:'p-adic digit a_k',connect:false,points}],xLabel:'자리 지수 k',yLabel:'정확한 자리 계수 a_k',xInteger:true},axisMetadata:[axis('자리 지수 k','PADIC_DIGIT_INDEX','result.results.value.digits'),axis('자리 계수 a_k','INTEGER_DIGIT','result.results.value.residue')],table:table(['자리 k','정확한 a_k','자리 가중치','원본 residue','확정 자리수 N'],rows,rows.map((_,i)=>`result.results.value:digit[${i}]`)),details:[{title:'정밀도·guard digit 계약',value:d.precision},{title:'guard digit 반례',value:d.guardDigitCounterexample}],lostInformation:['막대 높이와 화면 거리는 p-adic 거리 또는 p-adic 절댓값이 아닙니다.','N 이후의 자리는 미확정이며 0이라고 표시하지 않습니다.']};
  }
  if(op==='module'&&d.certificate){
    const m=d.certificate.diagonal,v=Array.from({length:m.rows},()=>Array(m.cols).fill('0'));for(const[i,j,x]of m.entries)v[i][j]=x;
    const view=matrixView(v,v.map((_,i)=>'codomain '+i),Array.from({length:m.cols},(_,i)=>'domain '+i),'result.results.certificate.diagonal','유한환 Smith 대각 표현',`계수환 Z/${d.certificate.ring.modulus}. 비가역 p 인자의 정수 계수를 보존합니다.`);
    view.details=[{title:'kernel · image · cokernel',value:d.module},{title:'정확한 basis 변환 U · V',value:{U:d.certificate.U,V:d.certificate.V}},{title:'독립 검사',value:d.verification}];return view;
  }
  if(op==='derivedReduction'&&d.derivedBaseChange){
    const rows=Object.keys(d.derivedBaseChange.cohomology).map(k=>[k,d.source.cohomology[k],d.ordinaryCohomologyTensor[k],d.derivedBaseChange.cohomology[k]]);
    return {kind:'TABLE',title:'Derived base change의 Tor 비교',description:d.reason,chart:{kind:'COMPARISON_TABLE',columns:['차수','원본 cohomology','ordinary tensor','derived base change'],rows:rows.map(r=>r.map(scalarText))},axisMetadata:[axis('cohomology 차수','COHOMOLOGICAL_DEGREE','result.results.derivedBaseChange.cohomology')],table:table(['차수','원본 cohomology','ordinary tensor','derived base change'],rows,rows.map(r=>'result.results.derivedBaseChange.cohomology.'+r[0])),details:[{title:'자유 복합체와 유한환 인증',value:{source:d.source,derived:d.derivedBaseChange,finiteModule:d.finiteModule}}],lostInformation:['문자열 모듈의 차이를 비교합니다. 벡터 공간 차원이나 근접성을 임의로 만들어 표시하지 않습니다.']};
  }
  return null;
}

function groupView(r){
  const g=r.group,d=g?.rootDatum;if(!d?.cartan)return null;
  const view=matrixView(d.cartan,d.cartan.map((_,i)=>'α'+(i+1)+'∨'),d.cartan.map((_,i)=>'α'+(i+1)),'result.group.rootDatum.cartan',g.id+' · 정확한 Cartan 행렬',d.cartanConvention+' · 군 차원 '+g.dimension+', rank '+g.rank+'. 군의 공간 좌표로 해석하지 않습니다.');
  view.details=[{title:'정확한 전체 근 자료',value:d},{title:'행렬 기저 · bracket · Gram',value:{basis:r.exactAlgebra.basis,structureConstants:r.exactAlgebra.structureConstants,gram:r.exactAlgebra.gram}},{title:'Chevalley 비교 기저',value:r.exactAlgebra.chevalley},{title:'정확한 군·대수 검사',value:r.verification}];
  view.relatedTables=[table(['root index','simple-root 좌표','character 좌표','cocharacter 좌표','|α|²'],(d.roots||[]).map((x,i)=>[i,x.simple,x.character,x.cocharacter,x.lengthSquared]),(d.roots||[]).map((_,i)=>`result.group.rootDatum.roots[${i}]`),'정확한 근 좌표')];return view;
}

function spectralView(r){
  const s=r.spectral;if(!s?.samples)return null;
  return {kind:'SERIES',title:'유한 Hamiltonian의 상관함수와 상계',description:`유한 차원 ${s.model.dimension}, gap=${s.gap}, 관측 채널 mass=${s.channelMass}. t는 이 유한 모형의 semigroup 매개변수이며 고전적 4D 장의 x4와 구별됩니다.`,chart:{kind:'SERIES',series:[{label:'C(t)',points:s.samples.map((p,i)=>({x:p.time,y:p.correlation,sourcePath:`result.spectral.samples[${i}].correlation`}))},{label:'명시한 gap 상계',dash:[6,4],points:s.samples.map((p,i)=>({x:p.time,y:p.upperBound,sourcePath:`result.spectral.samples[${i}].upperBound`}))}],xLabel:'spectral time t',yLabel:'C(t) / upper bound'},axisMetadata:[axis('spectral time t','SPECTRAL_TIME','result.spectral.samples.time',{unit:'model time'}),axis('상관함수','SPECTRAL_CORRELATION','result.spectral.samples.correlation')],table:table(['t','C(t)','명시한 gap 상계','위반 잔차'],s.samples.map(p=>[p.time,p.correlation,p.upperBound,p.boundResidual]),s.samples.map((_,i)=>`result.spectral.samples[${i}]`)),details:[{title:'정확히 지정한 유한 모형',value:s.model},{title:'모형의 가정',value:s.assumptions}],lostInformation:['유한 스펙트럼 모형은 양자 Yang–Mills 이론의 존재나 연속체 질량 간극 증명이 아닙니다.']};
}

function nsCoordinates(r){
  if(!r.forward?.position)return null;
  const p=r.forward.position,f=r.forward,inv=r.inverse;
  return {kind:'SPATIAL_3D',title:'Similarity 입력에 대응하는 실제 공간점',description:`같은 τ=${r.input.tau}, ν=${r.input.viscosity}에서 계산한 정방향 좌표와 역변환입니다. 1개 입력점의 계산이므로 주변 장을 생성하지 않습니다.`,scene:{points:[{pos:p.map(numericValue),sourcePosition:COPY(p),label:`X=${f.X}, η=${f.eta}, θ=${f.theta}`,sourcePath:'result.forward.position',radius:6}],lines:[],arrows:[],axes:['physical x','physical y','physical z'],equalScale:true},axisMetadata:['x','y','z'].map((x,i)=>axis('physical '+x,'PHYSICAL_CARTESIAN',`result.forward.position[${i}]`,{unit:'source length',physicalDimension:1})),table:table(['변수','정방향 원본','역변환','왕복 오차'],[['X',f.X,inv.X,r.roundtrip?.X],['η',f.eta,inv.eta,r.roundtrip?.eta],['θ',f.theta,inv.theta,'—'],['physical x',p[0],'—','—'],['physical y',p[1],'—','—'],['physical z',p[2],'—','—'],['τ',r.input.tau,r.input.tau,'—'],['q',f.q,inv.q,inv.rootResidual]],['result.forward.X','result.forward.eta','result.forward.theta','result.forward.position[0]','result.forward.position[1]','result.forward.position[2]','result.input.tau','result.inverse.rootResidual']),details:[{title:'좌표변환·미분 검사',value:r.checks}],lostInformation:['한 점의 정역 좌표 검사이며 완성된 blowup 프로파일이나 τ=0 극한의 증거가 아닙니다.']};
}

function nsHeat(r){
  if(!r.derivatives)return null;
  const items=r.derivatives.map((v,i)=>({label:`H${i?"′".repeat(i):''}(Z)`,lower:numericValue(v.lower),upper:numericValue(v.upper),midpoint:numericValue(v.midpoint),sourcePath:`result.derivatives[${i}]`}));
  return {kind:'INTERVALS',title:'Heat 함수와 도함수의 인증 구간',description:`고정 입력 Z=${r.Z}, h=${r.h}. 각 행에 서로 다른 도함수 구간을 표시합니다. 작은 구간 폭은 아래 정확 수치표에서 확인할 수 있습니다.`,chart:{kind:'INTERVALS',items,xLabel:'인증 구간',yLabel:'도함수 차수',independentRanges:true},axisMetadata:[axis('도함수 차수','DERIVATIVE_ORDER','result.derivatives'),axis('구간 값','REAL_INTERVAL','result.derivatives',{unit:'source normalization'})],table:table(['도함수','하계','midpoint (근사)','상계','반경'],r.derivatives.map((v,i)=>[i,v.lower,v.midpoint,v.upper,v.radius]),r.derivatives.map((_,i)=>`result.derivatives[${i}]`)),details:[{title:'구간 적분 오차 예산',value:r.certificate},{title:'유한 Taylor 계산과 발산 경계',value:r.finiteTaylor},{title:'ODE 잔차 구간',value:r.odeEnclosure}],lostInformation:['서로 다른 도함수의 구간 확대율은 행마다 다릅니다. 구간 사이의 시각적 길이를 크기 비교에 사용하지 않습니다.','유한 Taylor의 표시값을 수렴하는 무한 급수로 해석하지 않습니다.']};
}

function nsMoments(r){
  if(!r.profileSamples)return null;
  return {kind:'SERIES',title:'5모멘트 복원에서 계산한 프로파일',description:'직접 반환한 x, E, U 표본을 표시합니다. 수치 모멘트 일치는 연속 구간 Newton 인증과 별도입니다.',chart:{kind:'SERIES',series:['E','U'].map(k=>({label:k,points:r.profileSamples.map((p,i)=>({x:numericValue(p.x),y:numericValue(p[k]),sourcePath:`result.profileSamples[${i}].${k}`}))})),xLabel:'profile x',yLabel:'E / U'},axisMetadata:[axis('profile x','SIMILARITY_RADIUS','result.profileSamples.x'),axis('E / U','PROFILE_COMPONENT','result.profileSamples')],table:table(['x','E','U'],r.profileSamples.map(p=>[p.x,p.E,p.U]),r.profileSamples.map((_,i)=>`result.profileSamples[${i}]`)),relatedTables:[table(['모멘트','목표 차이','독립 재적분 잔차'],r.momentOrder.map((m,i)=>[m,r.targetDiscrepancy[i],r.residual[i]]),r.momentOrder.map((_,i)=>`result.residual[${i}]`),'모멘트 목표와 수치 잔차')],details:[{title:'Newton 수치 이력·acceptance',value:{history:r.history,acceptance:r.acceptance,intervalNewtonCertified:r.intervalNewtonCertified}}],lostInformation:['표본 사이와 전체 η에 대한 균일 인증은 이 그래프로 추가되지 않습니다.']};
}

function nsCone(r){
  const s=r.modulation?.samples;if(!s)return null;
  return {kind:'SERIES',title:'C.12 변조 연산의 실제 유한 표본',description:r.modulation.scope,chart:{kind:'SERIES',series:[{label:'E_N',points:s.map((p,i)=>({x:p.X,y:p.EN,sourcePath:`result.modulation.samples[${i}].EN`}))},{label:'U_N',points:s.map((p,i)=>({x:p.X,y:p.UN,sourcePath:`result.modulation.samples[${i}].UN`}))}],xLabel:'similarity X',yLabel:'E_N / U_N'},axisMetadata:[axis('X','SIMILARITY_RADIUS','result.modulation.samples.X'),axis('E_N / U_N','PROFILE_COMPONENT','result.modulation.samples')],table:table(['X','E_N','U_N','값 변화','radial derivative 변화'],s.map(p=>[p.X,p.EN,p.UN,p.valueChange,p.radialDerivativeChange]),s.map((_,i)=>`result.modulation.samples[${i}]`)),details:[{title:'전체 매개변수 상자에 대한 별도 구간 검사',value:r.wholeParameterBox},{title:'명시한 변조',value:{formula:r.modulation.formula,N:r.modulation.N,amplitude:r.modulation.amplitude}}],lostInformation:['표본의 변조 연산을 C.1 admissible loop 또는 완성된 전체 프로파일로 승격하지 않습니다.']};
}

function nsProvenance(r){
  const entries=r.map?.claimGraph;if(!entries)return null;
  const nodes=entries.map((x,i)=>({id:x.id,x:0,y:i,label:x.id+' · '+x.references.join(', '),sourcePath:`result.map.claimGraph[${i}]`}));
  return {kind:'NETWORK',title:'원문 구성 단계와 정리 의존성',description:'연결선은 원문에서 추출한 정리 의존성입니다. 문서 매핑 및 부분 커널 검사의 범위를 전체 증명 완료와 구별합니다.',chart:{kind:'NETWORK',nodes,edges:entries.flatMap(x=>x.dependsOn.map(p=>({from:p,to:x.id}))),xLabel:'정리 의존성',yLabel:'구성 단계'},axisMetadata:[axis('구성 단계','CATEGORICAL','result.map.claimGraph')],table:table(['단계','원문 구성','의존성','정리 참조','전체 원문 커널 확인'],entries.map(x=>[x.id,x.label,x.dependsOn,x.references,r.fullSourceProofLocallyVerified]),entries.map((_,i)=>`result.map.claimGraph[${i}]`)),details:[{title:'원본과 환경 결속',value:r.lock},{title:'검증 계약',value:r.analyticContracts}],lostInformation:['의존 그래프에 표시된 노드가 모두 구현되거나 Lean으로 검증되었다는 뜻이 아닙니다.']};
}

function checksView(r){
  if(!Array.isArray(r.checks)||!r.checks.length)return null;
  return {kind:'CHECKS',title:'실행한 독립 검사와 음성 대조군',description:`${r.passed??r.checks.filter(c=>c.pass===true).length} / ${r.total??r.checks.length} 검사. 음성 대조군의 PASS는 의도한 오류를 검출했다는 뜻입니다.`,chart:{kind:'CHECKS',items:r.checks.map((c,i)=>({label:c.name||c.id||'check '+i,pass:c.pass===true||c.ok===true||c.status==='PASS'?true:c.pass===false||c.ok===false?false:null,status:c.negativeControl?'NEGATIVE CONTROL':c.status||String(c.pass??c.ok??'UNSPECIFIED'),sourcePath:`result.checks[${i}]`}))},axisMetadata:[axis('검사 이름','CATEGORICAL','result.checks.name'),axis('검사 상태','CATEGORICAL','result.checks.pass')],table:table(['검사','pass','음성 대조군','오차 / 관측값','허용값'],r.checks.map(c=>[c.name||c.id,c.pass??c.ok??c.status,c.negativeControl??false,c.error??c.normalizedError??c.value??'—',c.tolerance??'—']),r.checks.map((_,i)=>`result.checks[${i}]`)),lostInformation:['유한 검사들의 PASS를 전체 PDE 해나 무한 영역 증명으로 해석하지 않습니다.']};
}

function complexView(r,raw){
  const d=r.results;if(!d?.complex)return null;
  const groups=d.complex.basis||[],dims=d.complex.dims||groups.map(b=>b.length);
  const inherited=raw?.points?.length?null:{kind:'SERIES',title:'정확한 복합체 · 차수별 모듈',description:'차수별 생성자, 미분, Frobenius와 비교 사상을 표시합니다. cochain 차수는 공간 좌표가 아닙니다.',chart:{kind:'SERIES',series:[{label:'chain group rank',connect:false,points:dims.map((v,i)=>({x:i,y:v,sourcePath:`result.results.complex.dims[${i}]`}))}],xLabel:'cohomological degree k',yLabel:'chain group rank',xInteger:true},axisMetadata:[axis('k','COHOMOLOGICAL_DEGREE','result.results.complex.dims'),axis('rank Cᵏ','MODULE_RANK','result.results.complex.dims')],table:table(['cochain degree','basis index','정확한 basis','Frobenius'],groups.flatMap((b,k)=>b.map((v,i)=>[k,i,v,d.frobenius?.cohomology?.find(x=>x.degree===k)?.multiplier??'—'])),groups.flatMap((b,k)=>b.map((_,i)=>`result.results.complex.basis[${k}][${i}]`))),lostInformation:['표시상 간격은 p-adic 거리나 위상적 인접성이 아닙니다.']};
  const details=[{title:'chain groups · differential',value:d.complex},{title:'kernel/image와 cohomology',value:d.smith||d.cohomology},{title:'Frobenius chain maps',value:d.frobenius},{title:'filtration · inclusion',value:d.filtration},{title:'comparison maps · 가정',value:d.comparison?.arrows},{title:'strong deformation retraction',value:d.retraction}].filter(x=>x.value!==undefined);
  return inherited?{...inherited,details}:{details};
}

/** Selected source basis column, preserving exact coefficients and target basis IDs. */
function traceBasis(job,degree,index){
  const d=job?.result?.results,c=d?.complex;
  if(!Number.isSafeInteger(degree)||!Number.isSafeInteger(index)||degree<0||index<0||!c?.basis?.[degree]||index>=c.basis[degree].length)return {ok:false,status:'INVALID_BASIS'};
  const column=(matrix,selected,targetBasis,matrixSourceField)=>!matrix?[]:(matrix.entries||[]).flatMap(([i,j,value],entry)=>j===selected?[{targetIndex:i,target:COPY(targetBasis?.[i]??i),coefficient:value,matrixSourceField,sourceField:`${matrixSourceField}.entries[${entry}][2]`}]:[]);
  const outgoing=(matrix,targetBasis,sourceField)=>column(matrix,index,targetBasis,sourceField);
  const basis=c.basis[degree][index],filtrationBasis=d.filtration?.basis?.[degree],same=(a,b)=>typeof a==='object'&&typeof b==='object'&&a?.id&&b?.id?a.id===b.id:canonicalStringify(a)===canonicalStringify(b);
  const filtrationMembership=Array.isArray(filtrationBasis)?basis?.inOriginal?basis.inOriginal.every(term=>filtrationBasis.some(b=>same(b,term.basis))):filtrationBasis.some(b=>same(b,basis)):null;
  let computedComparison=null;
  const R=d.retraction,r=R?.r?.[degree],h=R?.h?.[degree],inc=R?.i?.[degree];
  if(r&&inc){
    const rPath=`result.results.retraction.r[${degree}]`,iPath=`result.results.retraction.i[${degree}]`,hPath=`result.results.retraction.h[${degree}]`;
    const projectionTerms=column(r,index,R.K?.basis?.[degree],rPath),homotopyTerms=column(h,index,c.basis[degree-1],hPath);
    const inclusionImages=projectionTerms.map(term=>({cohomologyIndex:term.targetIndex,cohomologyBasis:COPY(term.target),projectionCoefficient:term.coefficient,projectionSourceField:term.sourceField,inclusionSourceField:iPath,terms:column(inc,term.targetIndex,c.basis[degree],iPath)}));
    const integerCoefficients=inclusionImages.every(image=>/^-?\d+$/.test(String(image.projectionCoefficient))&&image.terms.every(t=>/^-?\d+$/.test(String(t.coefficient))));
    const accumulated=new Map();
    if(integerCoefficients)for(const image of inclusionImages)for(const term of image.terms)accumulated.set(term.targetIndex,(accumulated.get(term.targetIndex)||0n)+BigInt(image.projectionCoefficient)*BigInt(term.coefficient));
    const roundtripTerms=[...accumulated].filter(([,value])=>value!==0n).sort(([a],[b])=>a-b).map(([targetIndex,value])=>({targetIndex,target:COPY(c.basis[degree][targetIndex]),coefficient:String(value)}));
    computedComparison={
      kind:'EXPLICIT_REPLACEMENT_SELECTED_COLUMN',sourceDegree:degree,sourceIndex:index,
      projection:{map:'r : C^k → H^k',sourceField:rPath,terms:projectionTerms,zero:projectionTerms.length===0},
      inclusionImages,
      roundtrip:{map:'i(r(b)) : C^k → C^k',sourceFields:[rPath,iPath],arithmetic:integerCoefficients?'EXACT_INTEGER_COMPOSITION':'COEFFICIENT_PRODUCTS_RETAINED',terms:integerCoefficients?roundtripTerms:null,zero:integerCoefficients?roundtripTerms.length===0:null},
      homotopy:h?{map:'h : C^k → C^(k−1)',sourceField:hPath,terms:homotopyTerms,zero:homotopyTerms.length===0}:null,
      identity:'id_C − i r = d h + h d',identitySource:'Existing verified retraction; selected columns do not create a new cohomology or comparison theorem.',
      formalPass:false
    };
  }
  return {ok:true,inputHash:job.inputHash??null,jobId:job.id,basis:COPY(basis),degree,index,differential:outgoing(c.differentials?.[degree],c.basis[degree+1],`result.results.complex.differentials[${degree}]`),frobenius:outgoing(d.frobenius?.maps?.[degree],d.frobenius?.target?.basis?.[degree]||c.basis[degree],`result.results.frobenius.maps[${degree}]`),filtrationMembership,filtrationMembershipRule:basis?.inOriginal?'Exact support in the original coordinate filtration; basis coefficients are integral.':'Original coordinate-filtration basis membership',computedInvariants:COPY(d.smith?.cohomology||d.cohomology||null),invariantSource:'EXISTING_COMPUTATION_RESULT',computedComparison,comparison:COPY(d.comparison?.arrows||[])};
}

/** Exact coverage tiles; never represents an uncomputed interval as zero primes. */
function primeTiles(job,{a,b}={}) {
  const d=job?.result?.results;if(!Array.isArray(d?.segments))return {status:'UNAVAILABLE',tiles:[]};
  const tiles=d.segments.map((s,i)=>({a:s.a,b:s.b,status:'COMPUTED_EXACT',primeCount:s.primes?.length??s.count??null,hash:s.hash,sourceField:`result.results.segments[${i}]`}));
  const start=a===undefined?null:BigInt(a),end=b===undefined?null:BigInt(b),out=[];
  if(start!==null&&end!==null&&end<start)throw Error('Prime viewport end precedes start.');
  let cursor=start;
  for(const t of tiles){const ta=BigInt(t.a),tb=BigInt(t.b);if(start!==null&&tb<start||end!==null&&ta>end)continue;const lo=start!==null&&ta<start?start:ta,hi=end!==null&&tb>end?end:tb;if(cursor!==null&&lo>cursor)out.push({a:String(cursor),b:String(lo-1n),status:'UNCOMPUTED',primeCount:null});out.push({...t,visibleA:String(lo),visibleB:String(hi)});cursor=hi+1n;}
  if(end!==null&&cursor!==null&&cursor<=end)out.push({a:String(cursor),b:String(end),status:'UNCOMPUTED',primeCount:null});
  return {status:'EXACT_FINITE_COVERAGE',definition:d.domain?.definition||'P = {p ∈ Z : p ≥ 2 and p has exactly two positive divisors}',tiles:out.length?out:tiles,sourceHash:d.rawHash,intervalCount:d.intervalCount,boundaryRule:'closed disjoint tiles; next a = previous b + 1'};
}

function rawView(job,raw,options){
  const r=job.result,kind=job.request?.kind||r.kind||'',maxPoints=cap(options.maxPoints,4000,6000),maxLineVertices=cap(options.maxLineVertices,12000,24000),invalid=[];
  const convert=(p,path)=>{if(!Array.isArray(p)||p.length!==3){invalid.push(path);return null;}const v=p.map(numericValue);if(!point3(v)){invalid.push(path);return null;}return v;};
  let points=(raw.points||[]).map((p,i)=>{const pos=convert(p.pos,`visualization.points[${i}].pos`);return pos?{...COPY(p),pos,sourcePosition:COPY(p.pos),sourceIndex:p.sourceIndex??i,sourcePath:`result.visualization.points[${i}]`}:null;}).filter(Boolean);
  const originalPoints=points.length;points=sample(points,maxPoints);
  const lines=[];let remaining=maxLineVertices;
  for(const[i,l]of (raw.lines||[]).entries()){
    if(remaining<2)break;
    // Split at invalid vertices. Filtering vertices alone would invent a join.
    let run=[];const flush=()=>{if(run.length>1&&remaining>=2){const ps=sample(run,Math.min(remaining,Math.max(2,Math.floor(maxLineVertices/Math.max(1,raw.lines.length)))));remaining-=ps.length;lines.push({...COPY(l),points:ps.map(x=>x.pos),sourcePositions:ps.map(x=>x.source),sourcePath:`result.visualization.lines[${i}]`});}run=[];};
    for(const[j,p]of(l.points||[]).entries()){const pos=convert(p,`visualization.lines[${i}].points[${j}]`);if(pos)run.push({pos,source:COPY(p)});else flush();}flush();
  }
  let arrows=(raw.arrows||[]).map((a,i)=>{const pos=convert(a.pos,`visualization.arrows[${i}].pos`),vector=convert(a.vector,`visualization.arrows[${i}].vector`);return pos&&vector?{...COPY(a),pos,vector,sourceVector:COPY(a.vector),sourcePath:`result.visualization.arrows[${i}]`}:null;}).filter(Boolean);const originalArrows=arrows.length;arrows=sample(arrows,Math.min(1200,maxPoints));
  let arrowDisplayScale=1;
  if(arrows.length){const coords=points.map(p=>p.pos).concat(arrows.map(a=>a.pos)),ranges=[0,1,2].map(i=>minmax(coords.map(p=>p[i]))),span=Math.max(...ranges.filter(Boolean).map(b=>b[1]-b[0])),magnitude=Math.max(...arrows.map(a=>Math.hypot(...a.vector)));if(Number.isFinite(magnitude)&&magnitude>0)arrowDisplayScale=.18*(span||1)/magnitude;arrows=arrows.map(a=>({...a,vector:a.vector.map(v=>v*arrowDisplayScale)}));}
  const axes=[0,1,2].map(i=>{const a=raw.axes?.[i];return typeof a==='string'?a:a?.label||a?.name||'axis '+i;});
  const physicalGaugeKinds=['gauge.field','gauge.family','gauge.holonomy','gauge.lattice','gauge.ensemble'];
  const legacyPhysical=physicalGaugeKinds.includes(kind)||['ns.exterior','ns.benchmark','ns.leading-profile'].includes(kind);
  const axisMetadata=axes.map((label,i)=>{
    const declared=typeof raw.axes?.[i]==='object'?raw.axes[i]:{},log=/\blog(?:2|10|₂|₁₀)?(?=\W|_|$)|로그/i.test(label)||/^LOG_/.test(declared.type||''),unit=declared.unit|| (legacyPhysical?'declared source length':'1');
    let type=declared.type||declared.kind||(legacyPhysical?'PHYSICAL_CARTESIAN':/index|degree|weight|prime|p$|정수|속성|간격/i.test(label)?'DATA_ATTRIBUTE':'PROFILE_COORDINATE');
    if(type==='PHYSICAL')type=/time|시간/i.test(unit)||/tau|τ|time|^t$|1-t/i.test(label)?'PHYSICAL_TIME':'PHYSICAL_COORDINATE';
    const dimension=declared.physicalDimension??(/^PHYSICAL_(CARTESIAN|CARTESIAN_COORDINATE|SPACE_COORDINATE|COORDINATE|LENGTH|TIME)$/.test(type)?1:0);
    return axis(label,type,`result.visualization.points[*].pos[${i}]`,{unit,scale:log?'stored-log':'linear',transform:log?'log coordinates supplied by computation':'identity',...declared,type,physicalDimension:dimension,coordinateRole:type,dataDimension:declared.dataDimension??1});
  });
  // A mathematical domain name cannot turn sample indices, curvature errors,
  // cohomological degrees, or a mixed (r,z,tau) chart into 3D spatial coordinates.
  const spatialAxis=a=>['PHYSICAL_CARTESIAN','PHYSICAL_SPACE_COORDINATE','PHYSICAL_COORDINATE','PHYSICAL_CARTESIAN_COORDINATE'].includes(a.type);
  const physical=axisMetadata.every(spatialAxis)&&new Set(axisMetadata.map(a=>a.unit)).size===1;
  const values=points.map(p=>numericValue(p.value)).filter(Number.isFinite),range=options.colorRange&&options.colorRange.length===2&&options.colorRange.every(Number.isFinite)&&options.colorRange[0]<=options.colorRange[1]?options.colorRange.slice():minmax(values);
  const tableRows=points.map(p=>[p.sourceIndex,...p.sourcePosition,p.value,p.label||'']);
  const rows=tableRows.length?tableRows:arrows.map((a,i)=>[i,...a.pos,a.sourceVector,'vector']);
  return {kind:physical?'SPATIAL_3D':'RELATION_3D',title:raw.description||kind,description:typeof raw.coordinateMeaning==='string'?raw.coordinateMeaning:JSON.stringify(raw.coordinateMeaning||{}),scene:{points,lines,arrows,axes,equalScale:physical,bounds:options.bounds||raw.bounds},axisMetadata,color:{quantity:raw.valueMeaning||job.request?.input?.observation?.quantity||'관측값',unit:raw.valueUnits||'declared by source',range,mode:options.colorRange?'FIXED':'AUTO'},table:table([col('원본 표본 index','sourceIndex'),...axisMetadata.map(a=>col(a.label,a.sourceField,a.type)),col('원본 값','value'),col('표본 설명','label')],rows,(points.length?points:arrows).map(p=>p.sourcePath)),lostInformation:[...(raw.lostInformation||[]),...(arrowDisplayScale!==1?[`표시 화살표는 원본 벡터에 공통 배율 ${arrowDisplayScale}을 적용했습니다. 수치표/원본 sourceVector는 배율을 적용하지 않았습니다.`]:[])],lod:{originalPoints,displayedPoints:points.length,originalArrows,displayedArrows:arrows.length,lineVertexBudget:maxLineVertices,invalidCoordinates:invalid.length,invalidPaths:invalid.slice(0,20),method:'DETERMINISTIC_UNIFORM_SOURCE_INDEX_WITH_ENDPOINTS',changesComputation:false},observation:{kind:r.observation?.kind||raw.observation?.kind||(kind==='gauge.holonomy'?'WILSON_PATH':null),sourceDimension:raw.sourceDimension??(physicalGaugeKinds.includes(kind)?4:physical?3:null),displayDimension:raw.displayDimension??3,physicalDimension:physical?3:0,coordinateTypes:axisMetadata.map(a=>a.type),nonInjective:raw.sourceDimension>raw.displayDimension||physicalGaugeKinds.includes(kind),reconstructionAllowed:false,endpointConvention:r.holonomy?{closed:r.holonomy.closed,observable:r.holonomy.gaugeInvariantObservable,gauge:job.request?.input?.gauge,sourcePath:job.request?.input?.path}:null},details:[]};
}

function fallbackTable(r){
  const d=r.results||r,rows=[],paths=[];
  const skip=new Set(['references','sources','provenance','executionMetrics','sourceLedger','integrityPayload','visualization','request']);
  const walk=(v,path,depth)=>{if(rows.length>=160)return;if(v===null||typeof v!=='object'){rows.push([path,scalarText(v)]);paths.push(path);return;}if(depth>=3||Array.isArray(v)&&v.length>16){rows.push([path,scalarText(v)]);paths.push(path);return;}for(const[k,x]of Object.entries(v))if(!skip.has(k))walk(x,path+(Array.isArray(v)?'['+k+']':'.'+k),depth+1);};
  walk(d,r.results?'result.results':'result',0);
  return {kind:'TABLE',title:'정확한 결과와 계약 자료',description:'이 결과에 정의된 공간 관측이 없어, 반환된 계산·검증 항목을 원본 필드에 연결하여 표시합니다.',chart:{kind:'COMPARISON_TABLE',columns:['원본 필드','값'],rows:rows.map(x=>x.map(scalarText))},axisMetadata:[axis('결과 항목','CATEGORICAL','result')],table:table(['원본 필드','정확한 값 / 계약'],rows,paths),lostInformation:['정의되지 않은 공간 좌표나 물리 모형을 생성하지 않습니다.']};
}

/** Build only from this job's result. Mismatching editor state blanks old marks. */
function makeVisualization(job,options={}) {
  const r=job?.result,request=job?.request,kind=request?.kind||r?.kind||'none';
  let editorMatches=options.currentEditorMatches!==false;
  if(options.currentRequest!==undefined)try{editorMatches=canonicalStringify(options.currentRequest)===canonicalStringify(request);}catch{editorMatches=false;}
  const binding={jobId:job?.id??null,kind,inputHash:job?.inputHash??null,resultHash:job?.resultHash??r?.resultHash??null,sourceHash:r?.sourceHash??r?.visualization?.sourceHash??r?.values?.visualization?.sourceHash??r?.results?.rawHash??r?.hashes?.physicalField??r?.parameterHash??r?.sourceLedger?.attachmentSha256??r?.group?.exactDataSha256??job?.inputHash??null,modelHash:r?.modelHash??r?.hashes?.physicalField??r?.results?.modelHash??r?.group?.exactDataSha256??null,sampleHash:options.observationIdentity?.sampleHash??r?.sampleHash??null,observationHash:options.observationIdentity?.observationHash??r?.visualization?.observationHash??r?.values?.visualization?.observationHash??null,displayTransformHash:r?.hashes?.display??null,currentEditorMatches:editorMatches,calculationStatus:job?.status??r?.status??'NOT_RUN',representationRevision:cap(options.representationRevision,1,Number.MAX_SAFE_INTEGER),formalPass:false};
  const base={schema:'MathScope.SourceBoundVisualization/1',version:VISUALIZATION_VERSION,binding,scene:emptyScene(),chart:null,table:table(['상태','설명'],[]),axisMetadata:[],details:[],relatedTables:[],lostInformation:[],color:null,lod:{originalPoints:0,displayedPoints:0,changesComputation:false}};
  if(!editorMatches)return {...base,state:'INPUT_CHANGED',kind:'STATE',title:'입력이 변경되었습니다',description:'선택한 실행 기록은 이전 입력의 결과입니다. 현재 입력을 실행하거나, 작업 목록에서 기록을 선택해 해당 입력을 복원하세요.',table:table(['실행','입력 SHA-256','상태'],[[binding.jobId,binding.inputHash,'현재 입력과 불일치']])};
  if(!r)return {...base,state:job?'WAITING':'NOT_RUN',kind:'STATE',title:job?'현재 계산을 기다리고 있습니다':'예제를 선택하고 실행하세요',description:'현재 입력에 연결된 계산 결과가 준비되면 관측과 수치표를 표시합니다.'};
  if(TERMINAL_FAILURE.has(job?.status)||TERMINAL_FAILURE.has(r.status))return {...base,state:job?.status||r.status,kind:'STATE',title:job?.status||r.status,description:r.message||r.reason||scalarText(r.blockers||r.contractReport||'이 입력에는 표시 가능한 계산 결과가 없습니다.'),table:table(['결과 상태','계산에서 반환한 이유'],[[job?.status||r.status,r.message||r.reason||r.blockers||r.contractReport||'not available']])};
  const raw=r.visualization||r.values?.visualization;
  let view;
  if(kind==='arithmetic.primeCertificate')view=arithmeticCertificate(r);
  else if(kind==='arithmetic.padic')view=padicView(r);
  else if(kind==='gauge.group')view=groupView(r);
  else if(kind==='gauge.spectral')view=spectralView(r);
  else if(kind==='ns.coordinates')view=nsCoordinates(r);
  else if(kind==='ns.heat')view=nsHeat(r);
  else if(kind==='ns.moments')view=nsMoments(r);
  else if(kind==='ns.cone')view=nsCone(r);
  else if(kind==='ns.provenance')view=nsProvenance(r);
  else if(kind==='ns.validate')view=checksView(r);
  if(!view&&raw&&((raw.points?.length||0)+(raw.lines?.length||0)+(raw.arrows?.length||0)>0))view=rawView(job,raw,options);
  if(r.results?.complex?.basis){const complex=complexView(r,raw);if(complex)view=view?{...view,details:[...(view.details||[]),...complex.details]}:complex;}
  view=view||fallbackTable(r);
  if(!view.scene)view.scene=view.chart?sceneFromChart(view.chart):emptyScene();
  const maxRows=cap(options.maxRows,200,1000),t=view.table;
  if(t&&t.rows.length>maxRows){const idx=sampleIndices(t.rows.length,maxRows);view.table={...t,rows:idx.map(i=>t.rows[i]),sourcePaths:idx.map(i=>t.sourcePaths[i]),truncated:true,totalRows:t.rows.length,selection:'DETERMINISTIC_SOURCE_INDEX_WITH_ENDPOINTS'};}
  if(kind==='arithmetic.primes'&&r.results?.segments){const tiles=primeTiles(job,options.primeViewport||{});view.primeAtlas=tiles;view.relatedTables=[...(view.relatedTables||[]),table(['tile a','tile b','계산 상태','정확한 소수 개수','tile hash'],tiles.tiles.map(t=>[t.a,t.b,t.status,t.primeCount,t.hash]),tiles.tiles.map(t=>t.sourceField),'계산한 소수 타일')];}
  if(!view.scene.points.length&&!view.scene.lines.length&&!view.scene.arrows.length&&view.kind!=='TABLE'&&view.kind!=='STATE'){
    view={...view,kind:'TABLE',chart:{kind:'COMPARISON_TABLE',columns:view.table?.columns.map(c=>c.label)||[],rows:view.table?.rows||[]},description:view.description+' · 유한 표시좌표가 없어 정확 수치표로 표시합니다.'};
  }
  return {...base,...view,state:'READY',binding};
}

/** Shared limits for two already-computed observations; does not generate a state. */
function compareVisualizations(leftJob,rightJob,options={}){
  const left=makeVisualization(leftJob,options),right=makeVisualization(rightJob,options);
  if(left.state!=='READY'||right.state!=='READY')return {ok:false,status:'NOT_READY',left,right};
  if(left.binding.kind!==right.binding.kind||JSON.stringify(left.axisMetadata.map(a=>[a.type,a.unit,a.transform]))!==JSON.stringify(right.axisMetadata.map(a=>[a.type,a.unit,a.transform])))return {ok:false,status:'INCOMPATIBLE_OBSERVATIONS',left,right};
  const contract=j=>({result:j.result?.observation||null,visualization:(j.result?.visualization||j.result?.values?.visualization)?.observation||null});
  if(canonicalStringify(contract(leftJob))!==canonicalStringify(contract(rightJob)))return {ok:false,status:'OBSERVATION_CONTRACT_DIFFERS',left,right};
  const pos=[...left.scene.points,...right.scene.points].map(p=>p.pos),bounds=[0,1,2].map(i=>minmax(pos.map(p=>p[i]))||[-1,1]);
  for(const b of bounds)if(b[0]===b[1]){b[0]-=.5;b[1]+=.5;}
  const colorRange=minmax([...(left.color?.range||[]),...(right.color?.range||[])]);
  const views=[makeVisualization(leftJob,{...options,bounds,colorRange}),makeVisualization(rightJob,{...options,bounds,colorRange})];
  return {ok:true,status:'COMPARABLE',left:views[0],right:views[1],shared:{bounds,colorRange,cameraOnly:true},physicalFieldUnchanged:left.binding.modelHash!==null&&left.binding.modelHash===right.binding.modelHash,description:leftJob.request?.input?.family?.mode==='ASSUMED_BOUND'?'Δ는 하한 가정입니다. 실제 장과 관측 생성 규칙이 같으면 physical-field hash가 같습니다.':'두 실행의 원본 모형·관측·수치표를 각각 유지합니다.'};
}

/** Distinct SHA-256 identities: physical/model rule, source samples, observation. */
async function sealObservationIdentity(job){
  const r=job?.result;if(!r)return {status:'NO_RESULT',sampleHash:null,observationHash:null};
  const samples=r.sourceSamples??(r.replicas?r.replicas.map(x=>({replicaIndex:x.replicaIndex,history:x.history??null,samples:x.samples??null})):null)??r.measurements?.sites??r.levels??r.history??r.spectral?.samples??r.profileSamples??r.modulation?.samples??r.points??null;
  const observation=r.visualization??r.values?.visualization??r.spectral?.samples??r.profileSamples??null;
  return {status:'SEALED',jobId:job.id,inputHash:job.inputHash,modelHash:r.modelHash??r.hashes?.physicalField??r.results?.modelHash??r.group?.exactDataSha256??null,sampleHash:samples?await sha256(samples):null,observationHash:observation?await sha256(observation):null,displayTransformHash:r.hashes?.display??null,policy:'EXACT_SOURCE_ARRAYS; MODEL_RULE_AND_SAMPLES_ARE_DISTINCT; DISPLAY_LOD_EXCLUDED'};
}

return {VISUALIZATION_VERSION,numericValue,scalarText,sampleIndices,traceBasis,primeTiles,makeVisualization,compareVisualizations,sealObservationIdentity};
})();
const __m2_2 = (()=>{
/** Bounded CPU projection of retained 3D data, with an orthographic camera.
 * One visible scene, <=6000 marks, DPR<=1.5, event-driven redraw only.
 * Coordinates remain mathematical data; camera rotations do not change them.
 */
const palette = ['#76e2cd', '#ffd282', '#99b8ff', '#f69fa5', '#ceafff'];
function heatColor(t) {
  t = Math.max(0, Math.min(1, t));
  const a = [64, 171, 183], b = [255, 186, 100];
  return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
}
class Scene3D {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.yaw = -0.65; this.pitch = 0.42; this.zoom = 1;
    this.data = { points: [], lines: [], arrows: [], axes: ['x', 'y', 'z'] };
    this.selected = null; this.projected = []; this.drag = null;
    this.observer = new ResizeObserver(() => this.draw()); this.observer.observe(canvas);
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      this.drag = { x: e.clientX, y: e.clientY, moved: false };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
      this.drag.moved = this.drag.moved || Math.abs(dx) + Math.abs(dy) > 2;
      this.yaw += dx * 0.008; this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch + dy * 0.008));
      this.drag.x = e.clientX; this.drag.y = e.clientY; this.draw();
    });
    canvas.addEventListener('pointerup', (e) => {
      if (this.drag && !this.drag.moved) this.pick(e);
      this.drag = null; if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointercancel', () => { this.drag = null; });
    canvas.addEventListener('lostpointercapture', () => { this.drag = null; });
    canvas.addEventListener('keydown', (e) => {
      const action = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Home: 'reset', '+': 'in', '=': 'in', '-': 'out' }[e.key];
      if (action) { e.preventDefault(); this.camera(action); }
    });
  }
  camera(action) {
    if (action === 'reset') { this.yaw = -0.65; this.pitch = 0.42; this.zoom = 1; }
    if (action === 'front') { this.yaw = 0; this.pitch = 0; }
    if (action === 'left') this.yaw -= 0.18;
    if (action === 'right') this.yaw += 0.18;
    if (action === 'up') this.pitch = Math.min(1.3, this.pitch + 0.15);
    if (action === 'down') this.pitch = Math.max(-1.3, this.pitch - 0.15);
    if (action === 'in') this.zoom = Math.min(2.2, this.zoom * 1.12);
    if (action === 'out') this.zoom = Math.max(0.4, this.zoom / 1.12);
    this.draw();
  }
  set(data) {
    this.data = { points: [], lines: [], arrows: [], axes: ['x', 'y', 'z'], ...data }; this.selected = null;
    const coords = [...this.data.points.map(p => p.pos), ...this.data.lines.flatMap(l => l.points), ...this.data.arrows.map(a => a.pos)];
    this.bounds = data.bounds || [0, 1, 2].map(i => {
      let min = Math.min(...coords.map(p => p[i])), max = Math.max(...coords.map(p => p[i]));
      if (!Number.isFinite(min) || !Number.isFinite(max)) { min = -1; max = 1; }
      if (max === min) { min -= 0.5; max += 0.5; }
      return [min, max];
    });
    this.spans = this.bounds.map(b => b[1] - b[0]);
    if (data.equalScale) this.spans = this.spans.map(() => Math.max(...this.spans));
    this.canvas.dataset.markCount = String(coords.length); this.canvas.dataset.renderer = 'CPU_ORTHOGRAPHIC_3D';
    this.draw();
  }
  project(pos) {
    const v = pos.map((x, i) => (x - (this.bounds[i][0] + this.bounds[i][1]) / 2) / this.spans[i] * 2);
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const x = c * v[0] + s * v[2], z = -s * v[0] + c * v[2];
    const y = cp * v[1] - sp * z, depth = sp * v[1] + cp * z;
    const scale = Math.min(this.width * 0.30, this.height * 0.32) * this.zoom;
    return [this.width / 2 + x * scale, this.height * 0.5 - y * scale, depth];
  }
  stroke(points, color, width = 1, dash = []) {
    const c = this.ctx; c.beginPath(); c.strokeStyle = color; c.lineWidth = width; c.setLineDash(dash);
    points.forEach((p, i) => { const v = this.project(p); if (i) c.lineTo(v[0], v[1]); else c.moveTo(v[0], v[1]); }); c.stroke(); c.setLineDash([]);
  }
  draw() {
    const box = this.canvas.getBoundingClientRect(); if (box.width < 2 || box.height < 2 || !this.ctx || !this.bounds) return;
    this.width = box.width; this.height = box.height; const dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(box.width * dpr); this.canvas.height = Math.round(box.height * dpr);
    const c = this.ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#081522'; c.fillRect(0, 0, box.width, box.height);
    const b = this.bounds, corner = b.map(a => a[0]);
    for (let i = 0; i < 3; i++) {
      const end = [...corner]; end[i] = b[i][1]; this.stroke([corner, end], '#7390a5', 1.2);
      const p = this.project(end); c.fillStyle = '#dfedf5'; c.font = '11px sans-serif'; c.fillText(this.data.axes[i] || 'xyz'[i], Math.max(8, Math.min(this.width - 100, p[0] + 5)), Math.max(18, Math.min(this.height - 22, p[1] - 5)));
      for (const f of [0, .5, 1]) {
        const q = [...corner]; q[i] = b[i][0] + f * (b[i][1] - b[i][0]); const s = this.project(q);
        c.fillStyle = '#9eb6ca'; c.font = '9px monospace'; c.fillText(formatTick(q[i]), s[0] - 5, s[1] + 14);
      }
    }
    for (let j = 0; j <= 4; j++) {
      const x = b[0][0] + (b[0][1] - b[0][0]) * j / 4, z = b[2][0] + (b[2][1] - b[2][0]) * j / 4;
      this.stroke([[x, b[1][0], b[2][0]], [x, b[1][0], b[2][1]]], '#20394b');
      this.stroke([[b[0][0], b[1][0], z], [b[0][1], b[1][0], z]], '#20394b');
    }
    for (const line of this.data.lines) this.stroke(line.points, line.color || palette[0], line.width || 1.5, line.dash || []);
    this.projected = this.data.points.map((p, i) => ({ ...p, xy: this.project(p.pos), index: i })).sort((a, b) => a.xy[2] - b.xy[2]);
    for (const p of this.projected) { c.globalAlpha = p.alpha ?? .85; c.beginPath(); c.fillStyle = p.color || palette[0]; c.arc(p.xy[0], p.xy[1], p.radius || 3, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
    for (const a of this.data.arrows) {
      const p = this.project(a.pos), q = this.project(a.pos.map((v, i) => v + a.vector[i]));
      const dx = q[0] - p[0], dy = q[1] - p[1], length = Math.hypot(dx, dy);
      if (length < .2) continue; c.strokeStyle = a.color || palette[0]; c.lineWidth = 1.3; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
      const u = dx / length, v = dy / length, size = Math.min(4, length * .3);
      c.moveTo(q[0] - size * u + size * .55 * v, q[1] - size * v - size * .55 * u); c.lineTo(q[0], q[1]); c.lineTo(q[0] - size * u - size * .55 * v, q[1] - size * v + size * .55 * u); c.stroke();
    }
    c.font = '10px sans-serif'; let x = 12;
    for (const [i, text] of (this.data.legend || []).entries()) { c.fillStyle = palette[i % palette.length]; c.fillRect(x, 12, 8, 8); c.fillStyle = '#d6e5ef'; c.fillText(text, x + 13, 20); x += Math.min(190, 27 + text.length * 6); }
    c.fillStyle = '#91aabd'; c.font = '10px sans-serif'; c.fillText('3D coordinates · orthographic camera · drag / arrow keys / Home', 12, this.height - 10);
    if (this.selected) {
      const label = this.selected.label || this.selected.pos.map(formatTick).join(', '); c.fillStyle = '#102c3d'; c.fillRect(8, 32, Math.min(this.width - 16, 420), 27); c.fillStyle = '#ffe1a6'; c.font = '11px monospace'; c.fillText(label.slice(0, 78), 15, 50);
    }
    this.canvas.dataset.renderReady = 'true';
  }
  pick(e) {
    const box = this.canvas.getBoundingClientRect(), x = e.clientX - box.left, y = e.clientY - box.top;
    let nearest = null, distance = 14;
    for (const p of this.projected) { const d = Math.hypot(p.xy[0] - x, p.xy[1] - y); if (d < distance) { nearest = p; distance = d; } }
    this.selected = nearest; this.draw();
  }
  destroy() { this.observer.disconnect(); }
}
function formatTick(x) { return Math.abs(x) >= 10000 || (x !== 0 && Math.abs(x) < .01) ? x.toExponential(1) : Number(x.toPrecision(3)).toString(); }
function plot2D(canvas, series, { xLabel = 'x', yLabel = 'y', xBounds, yBounds } = {}) {
  const box = canvas.getBoundingClientRect(); if (box.width < 2) return;
  const dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr);
  const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); const w = box.width, h = box.height; c.fillStyle = '#071622'; c.fillRect(0, 0, w, h);
  const all = series.flatMap(s => s.points);
  const xb = xBounds || [Math.min(...all.map(p => p[0])), Math.max(...all.map(p => p[0]))], yb = yBounds || [Math.min(...all.map(p => p[1])), Math.max(...all.map(p => p[1]))];
  const X = x => 48 + (w - 74) * (x - xb[0]) / (xb[1] - xb[0] || 1), Y = y => h - 40 - (h - 64) * (y - yb[0]) / (yb[1] - yb[0] || 1);
  c.font = '10px monospace';
  for (let i = 0; i <= 4; i++) { const y = yb[0] + (yb[1] - yb[0]) * i / 4; c.strokeStyle = '#203748'; c.beginPath(); c.moveTo(48, Y(y)); c.lineTo(w - 20, Y(y)); c.stroke(); c.fillStyle = '#a7bfd1'; c.fillText(formatTick(y), 3, Y(y) + 3); const x = xb[0] + (xb[1] - xb[0]) * i / 4; c.fillText(formatTick(x), X(x) - 8, h - 25); }
  series.forEach((s, j) => { c.strokeStyle = s.color || palette[j]; c.lineWidth = 1.7; c.beginPath(); s.points.forEach((p, i) => { if (i) c.lineTo(X(p[0]), Y(p[1])); else c.moveTo(X(p[0]), Y(p[1])); }); c.stroke(); });
  c.fillStyle = '#d8e8f3'; c.font = '10px sans-serif'; c.fillText(yLabel, 7, 12); c.fillText(xLabel, Math.max(50, w - 155), h - 8); canvas.dataset.renderReady = 'true';
}

return {palette,heatColor,Scene3D,plot2D};
})();
const __m2_3 = (()=>{
/** Bounded WebGL point rasterization. Exact mathematical values stay in the retained CPU scene. */
const vertex='attribute vec2 a_position;attribute float a_radius;attribute vec4 a_color;uniform vec2 u_resolution;uniform float u_dpr;varying vec4 v_color;void main(){vec2 clip=a_position/u_resolution*2.0-1.0;gl_Position=vec4(clip.x,-clip.y,0.0,1.0);gl_PointSize=2.0*a_radius*u_dpr;v_color=a_color;}';
const fragment='precision mediump float;varying vec4 v_color;void main(){vec2 p=gl_PointCoord*2.0-1.0;if(dot(p,p)>1.0)discard;gl_FragColor=vec4(v_color.rgb*v_color.a,v_color.a);}';
function rgb(color){
  if(/^#[\da-f]{6}$/i.test(color||''))return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);
  const m=String(color||'').match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);return m?m.slice(1).map(x=>Number(x)/255):[118/255,226/255,205/255];
}
function packMarks(points){
  const buffer=new Float32Array(points.length*7);let maxFloat32PixelError=0;
  for(const[i,p]of points.entries()){buffer.set([p.xy[0],p.xy[1],p.radius||3,...rgb(p.color),p.alpha??.85],i*7);maxFloat32PixelError=Math.max(maxFloat32PixelError,Math.abs(buffer[i*7]-p.xy[0]),Math.abs(buffer[i*7+1]-p.xy[1]));}
  return {buffer,maxFloat32PixelError};
}
class WebGLMarks {
  constructor(doc){this.doc=doc;this.canvas=null;this.gl=null;this.state='NOT_REQUESTED';this.reason=null;this.last=null;this.lost=false;}
  initialize(){
    if(this.gl&&!this.lost)return true;if(this.state==='UNAVAILABLE'||this.lost)return false;
    try{
      this.canvas=this.doc.createElement('canvas');
      const gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:true,depth:false,stencil:false});
      if(!gl){this.state='UNAVAILABLE';this.reason='WEBGL_CONTEXT_UNAVAILABLE';return false;}
      this.gl=gl;this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.state='CONTEXT_LOST';this.reason='WEBGL_CONTEXT_LOST';});
      this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.gl=null;this.state='NOT_REQUESTED';});
      const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
      const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment),p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
      this.program=p;this.buffer=gl.createBuffer();this.position=gl.getAttribLocation(p,'a_position');this.radius=gl.getAttribLocation(p,'a_radius');this.color=gl.getAttribLocation(p,'a_color');this.resolution=gl.getUniformLocation(p,'u_resolution');this.dpr=gl.getUniformLocation(p,'u_dpr');this.state='AVAILABLE';return true;
    }catch(e){this.state='UNAVAILABLE';this.reason=String(e.message).slice(0,300);return false;}
  }
  draw(points,width,height,dpr=1){
    if(!this.initialize()||points.length>6000||width<2||height<2)return false;
    const gl=this.gl;if(gl.isContextLost()){this.lost=true;this.state='CONTEXT_LOST';return false;}
    try{
      const packed=packMarks(points);this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,packed.buffer,gl.DYNAMIC_DRAW);
      for(const[loc,size,offset]of[[this.position,2,0],[this.radius,1,8],[this.color,4,12]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,28,offset);}
      gl.uniform2f(this.resolution,width,height);gl.uniform1f(this.dpr,dpr);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);gl.drawArrays(gl.POINTS,0,points.length);
      if(gl.getError()!==gl.NO_ERROR)throw Error('WebGL draw error');this.last={count:points.length,bytes:packed.buffer.byteLength,maxFloat32PixelError:packed.maxFloat32PixelError,width,height,dpr,backend:'WEBGL_POINTS'};return true;
    }catch(e){this.reason=String(e.message).slice(0,300);return false;}
  }
  rasterAudit(){
    const points=Array.from({length:16},(_,i)=>({xy:[20+(i%4)*32,20+Math.floor(i/4)*32,0],radius:4,color:i%2?'#ffd282':'#76e2cd',alpha:1}));
    if(!this.draw(points,140,140,1))return {status:'UNAVAILABLE',reason:this.reason||this.state,pass:false};
    const gl=this.gl,pixel=new Uint8Array(4);let hit=0,empty=0,maxColorError=0;
    for(const p of points){gl.readPixels(Math.floor(p.xy[0]),139-Math.floor(p.xy[1]),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(pixel[3]>250)hit++;const expected=rgb(p.color).map(x=>Math.round(x*255));for(let k=0;k<3;k++)maxColorError=Math.max(maxColorError,Math.abs(pixel[k]-expected[k]));gl.readPixels(Math.floor(p.xy[0])+8,139-Math.floor(p.xy[1]),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(pixel[3]===0)empty++;}
    const pass=hit===16&&empty===16&&maxColorError<=1&&gl.getError()===gl.NO_ERROR;
    return {status:pass?'PASS':'FAIL',pass,fixture:'16 explicitly synthetic isolated audit glyphs; not a mathematical result',hitCenters:hit,transparentOutside:empty,maxColorError,tolerance8BitColor:1};
  }
  metrics(){return {state:this.state,reason:this.reason,last:this.last};}
  destroy(){if(this.gl&&!this.lost){if(this.buffer)this.gl.deleteBuffer(this.buffer);if(this.program)this.gl.deleteProgram(this.program);}this.gl=null;this.canvas=null;this.state='DISPOSED';}
}

return {rgb,packMarks,WebGLMarks};
})();
const __m2_4 = (()=>{
/** Event-driven Canvas2D with optional WebGL point batches and a shared exact HTML table. */
const {Scene3D,heatColor,palette} = __m2_2;
const {numericValue,scalarText} = __m2_1;
const {WebGLMarks} = __m2_3;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const tick=n=>!Number.isFinite(n)?'—':Math.abs(n)>=10000||(n!==0&&Math.abs(n)<.001)?n.toExponential(3):String(Number(n.toPrecision(5)));
function range(values){let lo=Infinity,hi=-Infinity;for(const n of values)if(Number.isFinite(n)){lo=Math.min(lo,n);hi=Math.max(hi,n);}if(lo===Infinity)return [0,1];if(lo===hi){const pad=Math.abs(lo)*.05||.5;lo-=pad;hi+=pad;}return [lo,hi];}
function short(text,n){text=String(text??'');return text.length>n?text.slice(0,Math.max(1,n-1))+'…':text;}
function rounded(c,x,y,w,h,r=5){if(c.roundRect){c.beginPath();c.roundRect(x,y,w,h,r);}else{c.beginPath();c.rect(x,y,w,h);}}

/**
 * Scene3D-compatible interface. Camera work touches representationRevision only.
 * CPU 3D and chart routes read the same source-bound view and exact table.
 * WebGL only rasterizes retained points; CPU projection, selection and exact values remain identical.
 */
class SourceBoundScene extends Scene3D {
  constructor(canvas){
    super(canvas);this.presentation=null;this.representationRevision=0;this.cameraStamp=null;this.cameraListener=null;this.drawDurations=[];this.lastPicked=null;this.renderMode='AUTO';this.gpu=new WebGLMarks(canvas.ownerDocument||(typeof document!=='undefined'?document:null));this.actualRenderer='CPU_CANVAS2D';
    canvas.setAttribute('role','img');canvas.setAttribute('tabindex','0');
  }
  set(data){
    this.presentation=null;this.lastPicked=null;this.selected=null;
    for(const key of ['visualizationState','observationKind','inputHash','resultHash','sourceHash','modelHash','sampleHash','observationHash','ensembleHash','historyHash','configurationHash','sourceJobId','gpuPath','selectedSourcePath','representationRevision'])delete this.canvas.dataset[key];
    this.canvas.setAttribute('aria-label',data?.description||'현재 계산의 표시 자료입니다. 원본 실행 결속은 아직 설정되지 않았습니다.');
    return super.set(data);
  }
  setVisualization(view){
    this.presentation=view;this.lastPicked=null;
    this.canvas.dataset.selectedSourcePath='';
    const color=view.color?.range,scene={...view.scene};
    if(color)scene.points=(scene.points||[]).map(p=>{const n=numericValue(p.value);return {...p,color:p.color||(Number.isFinite(n)?heatColor((n-color[0])/(color[1]-color[0]||1)):palette[0])};});
    this.representationRevision=view.binding?.representationRevision||1;
    this.cameraStamp=JSON.stringify(this.getCamera());
    super.set(scene);
    this.canvas.dataset.visualizationState=view.state;
    this.canvas.dataset.observationKind=view.kind;
    this.canvas.dataset.inputHash=view.binding?.inputHash||'';
    this.canvas.dataset.resultHash=view.binding?.resultHash||'';
    this.canvas.dataset.sourceHash=view.binding?.sourceHash||'';
    for(const key of ['modelHash','sampleHash','observationHash','ensembleHash','historyHash','configurationHash'])this.canvas.dataset[key]=view.binding?.[key]||'';
    this.canvas.dataset.sourceJobId=view.binding?.jobId||'';
    this.canvas.dataset.gpuPath=this.gpu?.state||'NOT_REQUESTED';
    this.canvas.setAttribute('aria-label',`${view.title}. ${view.description}. 원본 값은 바로 아래 수치표에 있습니다.`);
    return view;
  }
  getCamera(){return {yaw:this.yaw,pitch:this.pitch,zoom:this.zoom};}
  setCamera(camera){if(!camera||![camera.yaw,camera.pitch,camera.zoom].every(Number.isFinite))return false;this.yaw=camera.yaw;this.pitch=clamp(camera.pitch,-1.35,1.35);this.zoom=clamp(camera.zoom,.4,2.2);this.draw();return true;}
  onCameraChange(listener){this.cameraListener=typeof listener==='function'?listener:null;}
  setRenderMode(mode){if(!['AUTO','CPU','WEBGL'].includes(mode))return false;this.renderMode=mode;this.draw();return true;}
  getMetrics(){const a=(this.drawDurations||[]).slice().sort((a,b)=>a-b);return {renderer:this.actualRenderer||'CPU_CANVAS2D',requestedMode:this.renderMode,webgl:this.gpu?.metrics()||{state:'NOT_REQUESTED'},samples:a.length,p95Milliseconds:a.length?a[Math.min(a.length-1,Math.ceil(a.length*.95)-1)]:null,targetMilliseconds:100,representationRevision:this.representationRevision};}
  renderingAudit(){const before=JSON.stringify({binding:this.presentation?.binding,table:this.presentation?.table,points:this.presentation?.scene.points}),mode=this.renderMode;this.setRenderMode('CPU');const cpu=this.projected.map(p=>({pos:p.pos,xy:p.xy,sourcePath:p.sourcePath,value:p.value}));this.setRenderMode('WEBGL');const gpu=this.projected.map(p=>({pos:p.pos,xy:p.xy,sourcePath:p.sourcePath,value:p.value})),actual=this.actualRenderer,details=this.gpu.metrics(),probe=new WebGLMarks(this.canvas.ownerDocument),raster=probe.rasterAudit();probe.destroy();const unchanged=before===JSON.stringify({binding:this.presentation?.binding,table:this.presentation?.table,points:this.presentation?.scene.points}),sameRetainedProjection=JSON.stringify(cpu)===JSON.stringify(gpu);this.setRenderMode(mode);return {status:raster.pass&&unchanged&&sameRetainedProjection?'PASS':raster.pass?'FAIL':'UNAVAILABLE',sourceUnchanged:unchanged,sameRetainedProjection,actualRenderer:actual,gpu:details,raster,marks:cpu.length,pixelTolerance:.001,exactTablePolicy:'GPU float32 values are display coordinates only; the unchanged retained exact table is authoritative.'};}
  destroy(){this.gpu?.destroy();super.destroy();}
  draw(){
    const started=globalThis.performance?.now?.()??Date.now(),view=this.presentation;
    if(!view){super.draw();return;}
    const stamp=JSON.stringify(this.getCamera());
    if(this.cameraStamp&&stamp!==this.cameraStamp){this.representationRevision++;this.cameraStamp=stamp;this.cameraListener?.(this.getCamera());}
    this.canvas.dataset.representationRevision=String(this.representationRevision||1);
    if(view.kind==='SPATIAL_3D'||view.kind==='RELATION_3D'){
      this.drawSpatial();
      if(view.kind==='RELATION_3D'&&this.ctx&&this.width&&this.height){this.ctx.fillStyle='#081522';this.ctx.fillRect(0,this.height-24,this.width,24);this.ctx.fillStyle='#adc6d5';this.ctx.font='10px sans-serif';this.ctx.fillText('Typed data coordinates · diagram layout / profile attributes · camera only',12,this.height-10);}
    }else{this.drawChart(view);this.actualRenderer='CPU_CANVAS2D_'+(view.chart?.kind||'STATE');}
    const elapsed=(globalThis.performance?.now?.()??Date.now())-started;
    if(this.drawDurations){this.drawDurations.push(elapsed);if(this.drawDurations.length>120)this.drawDurations.shift();}
  }
  drawSpatial(){
    const data=this.data,wantsGPU=this.renderMode==='WEBGL'||this.renderMode==='AUTO'&&(data.points?.length||0)>=1000;
    if(!wantsGPU||!this.gpu?.initialize()){super.draw();this.actualRenderer='CPU_CANVAS2D';this.canvas.dataset.renderer='CPU_ORTHOGRAPHIC_'+(this.presentation.kind==='SPATIAL_3D'?'PHYSICAL':'RELATION');this.canvas.dataset.gpuPath=this.gpu?.state||'NOT_REQUESTED';return;}
    // Paint axes/paths/vectors once, without the bulk CPU point loop. Restore the retained scene immediately.
    this.data={...data,points:[]};super.draw();this.data=data;if(!this.width||!this.height)return;
    this.projected=data.points.map((p,i)=>({...p,xy:this.project(p.pos),index:i})).sort((a,b)=>a.xy[2]-b.xy[2]);
    const dpr=Math.min(globalThis.devicePixelRatio||1,1.5);
    if(this.gpu.draw(this.projected,this.width,this.height,dpr)){this.ctx.drawImage(this.gpu.canvas,0,0,this.gpu.canvas.width,this.gpu.canvas.height,0,0,this.width,this.height);this.actualRenderer='WEBGL_POINTS_WITH_CANVAS_AXES';}else{super.draw();this.actualRenderer='CPU_CANVAS2D_FALLBACK';}
    this.canvas.dataset.gpuPath=this.gpu.state;this.canvas.dataset.renderer=this.actualRenderer;this.canvas.dataset.markCount=String(data.points.length+data.lines.reduce((n,l)=>n+l.points.length,0)+data.arrows.length);
    if(this.selected){this.ctx.fillStyle='#102c3d';this.ctx.fillRect(8,32,Math.min(this.width-16,420),27);this.ctx.fillStyle='#ffe1a6';this.ctx.font='11px monospace';this.ctx.fillText(short(this.selected.label||String(this.selected.value),78),15,50);}
  }
  drawChart(view){
    const box=this.canvas.getBoundingClientRect(),c=this.ctx;
    if(!c||box.width<2||box.height<2)return;
    this.width=box.width;this.height=box.height;
    const dpr=Math.min(globalThis.devicePixelRatio||1,1.5),cw=Math.round(box.width*dpr),ch=Math.round(box.height*dpr);
    if(this.canvas.width!==cw)this.canvas.width=cw;if(this.canvas.height!==ch)this.canvas.height=ch;
    c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#081522';c.fillRect(0,0,box.width,box.height);
    this.projected=[];this.canvas.dataset.renderReady='false';
    const w=box.width,h=box.height,chart=view.chart;
    c.fillStyle='#e5f1f7';c.font='600 13px sans-serif';c.fillText(short(view.title,Math.floor((w-32)/8)),16,24);
    if(view.kind==='STATE'||!chart){
      c.fillStyle='#adc6d5';c.font='13px sans-serif';const text=view.description||'현재 결과에 연결된 관측을 기다립니다.';
      const length=Math.max(20,Math.floor((w-40)/9));for(let i=0;i<Math.min(5,Math.ceil(text.length/length));i++)c.fillText(text.slice(i*length,(i+1)*length),20,65+i*23);
    }else if(chart.kind==='SERIES')this.drawSeries(chart,w,h);
    else if(chart.kind==='MATRIX')this.drawMatrix(chart,w,h);
    else if(chart.kind==='INTERVALS')this.drawIntervals(chart,w,h);
    else if(chart.kind==='NETWORK')this.drawNetwork(chart,w,h);
    else if(chart.kind==='CHECKS')this.drawChecks(chart,w,h);
    else this.drawComparisonTable(chart,w,h);
    if(this.lastPicked){c.fillStyle='#173447';c.fillRect(10,29,w-20,29);c.fillStyle='#ffe2a2';c.font='11px monospace';c.fillText(short(this.lastPicked.label,Math.floor((w-38)/6.7)),18,48);}
    c.fillStyle='#adc6d5';c.font='10px sans-serif';
    c.fillText(short('Source-bound '+(view.binding?.jobId||'')+' · exact values in the table',Math.floor((w-24)/5.7)),12,h-10);
    this.canvas.dataset.renderer='CPU_CANVAS2D_'+(chart?.kind||'STATE');
    this.canvas.dataset.markCount=String(view.scene?.points?.length||chart?.items?.length||chart?.rows?.length||0);
    this.canvas.dataset.renderReady='true';
  }
  axes(chart,w,h,all){
    const c=this.ctx,left=w<420?54:68,right=w-24,top=62,bottom=h-58,xb=chart.xBounds||range(all.map(p=>p.x)),yb=chart.yBounds||range(all.map(p=>p.y));
    const X=x=>left+(x-xb[0])/(xb[1]-xb[0])*(right-left),Y=y=>bottom-(y-yb[0])/(yb[1]-yb[0])*(bottom-top);
    c.strokeStyle='#66879b';c.lineWidth=1;c.beginPath();c.moveTo(left,top);c.lineTo(left,bottom);c.lineTo(right,bottom);c.stroke();
    c.font='10px monospace';
    for(let i=0;i<=4;i++){const x=xb[0]+(xb[1]-xb[0])*i/4,y=yb[0]+(yb[1]-yb[0])*i/4;c.fillStyle='#adc6d5';c.fillText(tick(y),4,Y(y)+4);c.fillText(tick(x),clamp(X(x)-12,left-10,w-68),bottom+16);c.strokeStyle='#203b4d';c.beginPath();c.moveTo(left,Y(y));c.lineTo(right,Y(y));c.stroke();}
    c.fillStyle='#d5e6ef';c.font='11px sans-serif';c.fillText(short(chart.yLabel,Math.floor((w-20)/7)),left,top-12);c.fillText(short(chart.xLabel,Math.floor((w-30)/7)),left,bottom+36);
    return {X,Y,left,right,top,bottom};
  }
  drawSeries(chart,w,h){
    const c=this.ctx,all=chart.series.flatMap(s=>s.points).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
    if(!all.length){c.fillStyle='#adc6d5';c.fillText('표시 가능한 유한 표본이 없습니다. 정확표를 확인하세요.',20,62);return;}
    const a=this.axes(chart,w,h,all);
    for(const[j,s]of chart.series.entries()){
      const ps=s.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),color=s.color||palette[j%palette.length];
      c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1.8;c.setLineDash(s.dash||(j%2?[5,3]:[]));
      if(s.connect!==false){c.beginPath();ps.forEach((p,i)=>{if(i)c.lineTo(a.X(p.x),a.Y(p.y));else c.moveTo(a.X(p.x),a.Y(p.y));});c.stroke();}
      c.setLineDash([]);
      for(const p of ps){const x=a.X(p.x),y=a.Y(p.y);if(s.connect===false){c.globalAlpha=.22;c.fillRect(x-4,y,8,a.bottom-y);c.globalAlpha=1;}if(j%2)c.fillRect(x-2.5,y-2.5,5,5);else{c.beginPath();c.arc(x,y,2.5,0,2*Math.PI);c.fill();}this.projected.push({...p,pos:[p.x,p.y,0],xy:[x,y,0],label:p.label||s.label+': '+scalarText(p.y)});}
      c.font='10px sans-serif';c.fillText(short(s.label,Math.floor((w-30)/Math.max(2,chart.series.length)/6)),18+j*(w-36)/Math.max(2,chart.series.length),42);
    }
  }
  drawMatrix(chart,w,h){
    const c=this.ctx,rows=chart.values.length,cols=chart.values[0]?.length||0;if(!rows||!cols)return;
    const left=70,top=58,cell=Math.min((w-left-30)/cols,(h-top-56)/rows),width=cell*cols,values=chart.values.flat().map(numericValue),extent=Math.max(...values.filter(Number.isFinite).map(Math.abs),1);
    c.font='11px sans-serif';
    for(let j=0;j<cols;j++){c.fillStyle='#d5e6ef';c.fillText(short(chart.columnLabels[j],Math.max(4,Math.floor(cell/7))),left+j*cell+7,top-12);}
    for(let i=0;i<rows;i++){
      c.fillStyle='#d5e6ef';c.fillText(short(chart.rowLabels[i],9),8,top+(i+.5)*cell+4);
      for(let j=0;j<cols;j++){
        const v=chart.values[i][j],n=numericValue(v),x=left+j*cell,y=top+i*cell;
        c.fillStyle=Number.isFinite(n)?heatColor((n+extent)/(2*extent)):'#334658';c.fillRect(x+1,y+1,Math.max(0,cell-2),Math.max(0,cell-2));
        if(cell>=24){c.fillStyle='#06131e';c.font=Math.max(10,Math.min(19,cell*.22))+'px monospace';c.textAlign='center';c.fillText(short(scalarText(v),Math.floor(cell/7)),x+cell/2,y+cell/2+5);c.textAlign='left';}
        this.projected.push({pos:[j,i,0],xy:[x+cell/2,y+cell/2,0],value:v,label:chart.rowLabels[i]+', '+chart.columnLabels[j]+': '+scalarText(v),sourcePath:chart.sourcePaths?.[i]?.[j]||`${chart.sourceField}[${i}][${j}]`});
      }
    }
    c.fillStyle='#adc6d5';c.font='10px sans-serif';c.fillText(short('row / column are categorical indices · exact entries shown',Math.floor((width+left-12)/6)),left,top+rows*cell+23);
  }
  drawIntervals(chart,w,h){
    const c=this.ctx,top=62,row=Math.min(86,(h-94)/Math.max(1,chart.items.length)),left=80,right=w-30;
    chart.items.forEach((p,i)=>{
      const y=top+i*row+20;let lo=p.lower,hi=p.upper;
      if(![lo,hi,p.midpoint].every(Number.isFinite)||lo>hi)return;
      const d=hi-lo||Math.abs(lo)*.001||1,pad=.1*d,X=x=>left+(x-lo+pad)/(d+2*pad)*(right-left);
      c.fillStyle='#d5e6ef';c.font='12px sans-serif';c.fillText(p.label,12,y+4);c.strokeStyle=palette[i%palette.length];c.lineWidth=3;c.beginPath();c.moveTo(X(lo),y);c.lineTo(X(hi),y);c.stroke();
      for(const v of[lo,hi]){c.beginPath();c.moveTo(X(v),y-7);c.lineTo(X(v),y+7);c.stroke();}
      c.fillStyle='#fff1cb';c.beginPath();c.arc(X(p.midpoint),y,4,0,Math.PI*2);c.fill();c.font='10px monospace';c.fillStyle='#adc6d5';c.fillText(tick(lo),left,y+24);c.textAlign='right';c.fillText(tick(hi),right,y+24);c.textAlign='left';
      this.projected.push({pos:[i,p.midpoint,0],xy:[X(p.midpoint),y,0],label:p.label+': ['+p.lower+', '+p.upper+']',sourcePath:p.sourcePath});
    });
    c.fillStyle='#adc6d5';c.font='10px sans-serif';c.fillText('Each row uses its own interval scale. Exact endpoints are below.',16,h-34);
  }
  drawNetwork(chart,w,h){
    if(w<520){
      const names=new Map(chart.nodes.map(n=>[n.id,n.label]));
      this.drawComparisonTable({columns:['원본 노드','연결된 상위 노드'],rows:chart.nodes.map(n=>[n.label,chart.edges.filter(e=>e.to===n.id).map(e=>names.get(e.from)).join(', ')||'root'])},w,h);
      return;
    }
    const c=this.ctx,nodes=chart.nodes,depths=[...new Set(nodes.map(n=>n.x))].sort((a,b)=>a-b),single=depths.length===1,position=new Map();
    const left=single?w/2:76,top=58,bottom=h-46,nodeH=single?Math.min(29,(bottom-top)/Math.max(1,nodes.length)-5):28,nodeW=single?Math.min(w-44,520):Math.max(68,Math.min(150,(w-50)/Math.max(1,depths.length)-16));
    for(const n of nodes){const level=nodes.filter(x=>x.x===n.x),i=level.findIndex(x=>x.id===n.id),x=single?left:76+(w-152)*depths.indexOf(n.x)/Math.max(1,depths.length-1),y=top+(bottom-top)*(i+.5)/level.length;position.set(n.id,[x,y]);}
    c.strokeStyle='#799cad';c.lineWidth=1.5;
    for(const e of chart.edges){const a=position.get(e.from),b=position.get(e.to);if(!a||!b)continue;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,tip=[b[0]-dx/l*(single?nodeH/2:nodeW/2),b[1]-dy/l*(single?nodeH/2:nodeW/2)];c.beginPath();c.moveTo(tip[0],tip[1]);c.lineTo(tip[0]-6*dx/l+4*dy/l,tip[1]-6*dy/l-4*dx/l);c.lineTo(tip[0]-6*dx/l-4*dy/l,tip[1]-6*dy/l+4*dx/l);c.closePath();c.fillStyle='#799cad';c.fill();}
    for(const n of nodes){const[x,y]=position.get(n.id);rounded(c,x-nodeW/2,y-nodeH/2,nodeW,nodeH);c.fillStyle='#173b4b';c.fill();c.strokeStyle=palette[0];c.stroke();c.fillStyle='#e4f1f4';c.font='11px monospace';c.textAlign='center';c.fillText(short(n.label,Math.floor((nodeW-14)/6.4)),x,y+4);c.textAlign='left';this.projected.push({pos:[n.x,n.y,0],xy:[x,y,0],label:n.label,sourcePath:n.sourcePath});}
  }
  drawChecks(chart,w,h){
    const c=this.ctx,columns=w>850?3:w>500?2:1,maxRows=Math.max(1,Math.floor((h-82)/30)),limit=columns*maxRows,items=chart.items.slice(0,limit),cw=(w-30)/columns;
    items.forEach((p,i)=>{const col=Math.floor(i/maxRows),row=i%maxRows,x=15+col*cw,y=58+row*30; c.fillStyle=p.pass===true?'#87e1c8':p.pass===false?'#ffa6a0':'#f5d182';c.font='600 12px sans-serif';c.fillText(p.pass===true?'✓':p.pass===false?'×':'?',x,y);c.fillStyle='#d7e7ee';c.font='10px sans-serif';c.fillText(short(p.label,Math.floor((cw-25)/6)),x+20,y);this.projected.push({pos:[i,p.pass?1:0,0],xy:[x+10,y-4,0],label:p.label+' · '+p.status,sourcePath:p.sourcePath});});
    if(chart.items.length>items.length){c.fillStyle='#adc6d5';c.font='10px sans-serif';c.fillText(`전체 ${chart.items.length}개 중 ${items.length}개 표시 · 모든 결과는 수치표에 있습니다.`,16,h-31);}
  }
  drawComparisonTable(chart,w,h){
    const c=this.ctx,columns=chart.columns||[],rows=chart.rows||[],cw=(w-32)/Math.max(1,columns.length),limit=Math.min(rows.length,Math.floor((h-94)/41));
    c.font='600 11px sans-serif';c.fillStyle='#d5e6ef';columns.forEach((v,j)=>c.fillText(short(v,Math.floor(cw/7)-1),16+j*cw,54));
    for(let i=0;i<limit;i++){const y=73+i*41;c.fillStyle=i%2?'#0b1f2e':'#102938';c.fillRect(12,y-13,w-24,36);rows[i].forEach((v,j)=>{c.fillStyle='#e5f0f4';c.font='11px monospace';c.fillText(short(scalarText(v),Math.floor(cw/7)-1),16+j*cw,y+9);});}
    if(rows.length>limit){c.fillStyle='#adc6d5';c.font='10px sans-serif';c.fillText(`전체 ${rows.length}행 · 전체 값은 아래 표와 JSON에 보존됩니다.`,16,h-33);}
  }
  pick(e){
    if(!this.presentation||['SPATIAL_3D','RELATION_3D'].includes(this.presentation.kind)){super.pick(e);this.lastPicked=this.selected;this.canvas.dataset.selectedSourcePath=this.selected?.sourcePath||'';return;}
    const box=this.canvas.getBoundingClientRect(),x=e.clientX-box.left,y=e.clientY-box.top;let best=null,distance=20;
    for(const p of this.projected){const d=Math.hypot(p.xy[0]-x,p.xy[1]-y);if(d<distance){best=p;distance=d;}}
    this.lastPicked=best;this.canvas.dataset.selectedSourcePath=best?.sourcePath||'';
    if(best)this.canvas.setAttribute('aria-label',best.label+' · 원본 필드 '+(best.sourcePath||''));
    this.draw();
  }
}

/** Dynamic columns prevent exact non-geometric results from disappearing. */
function renderObservationTable(head,body,view,{table:override}={}){
  if(!body)return {rows:0};const t=override||view.table,doc=body.ownerDocument||document;
  if(head){head.replaceChildren();const tr=head.tagName==='TR'?head:doc.createElement('tr');for(const column of t.columns){const th=doc.createElement('th');th.scope='col';th.textContent=typeof column==='string'?column:column.label;th.title=column.sourceField||'';tr.append(th);}if(tr!==head)head.append(tr);}
  body.replaceChildren();
  for(const[i,row]of t.rows.entries()){const tr=doc.createElement('tr');tr.dataset.sourcePath=t.sourcePaths?.[i]||'';for(const v of row){const td=doc.createElement('td');td.textContent=scalarText(v);td.style.overflowWrap='anywhere';tr.append(td);}body.append(tr);}
  if(!t.rows.length){const tr=doc.createElement('tr'),td=doc.createElement('td');td.colSpan=t.columns.length||1;td.textContent=view.description||'아직 결과가 없습니다.';tr.append(td);body.append(tr);}
  const element=body.closest?.('table');if(element){element.dataset.sourceJobId=view.binding?.jobId||'';element.dataset.inputHash=view.binding?.inputHash||'';element.dataset.totalRows=String(t.totalRows);element.dataset.displayedRows=String(t.rows.length);element.dataset.truncated=String(t.truncated);element.setAttribute('aria-label',t.title||'정확한 관측값');}
  return {rows:t.rows.length,totalRows:t.totalRows,truncated:t.truncated};
}

/** Optional source details, related exact tables, and semantic axis ledger. */
function renderObservationDetails(container,view){
  if(!container)return;const doc=container.ownerDocument||document;container.replaceChildren();
  const block=(title,content)=>{const d=doc.createElement('details'),s=doc.createElement('summary');s.textContent=title;d.append(s,content);container.append(d);return d;};
  const pre=value=>{const p=doc.createElement('pre');p.textContent=JSON.stringify(value,null,2);p.style.whiteSpace='pre-wrap';p.style.overflowWrap='anywhere';return p;};
  block('축 · 단위 · 변환 · 원본 필드',pre(view.axisMetadata));
  for(const t of view.relatedTables||[]){const table=doc.createElement('table'),head=doc.createElement('thead'),body=doc.createElement('tbody');table.append(head,body);renderObservationTable(head,body,view,{table:t});block(t.title,table);}
  for(const d of view.details||[])block(d.title,pre(d.value));
}

return {SourceBoundScene,renderObservationTable,renderObservationDetails};
})();
const __m2_5 = (()=>{
const observations = __m2_1;
const renderers = __m2_4;
const visualization=Object.freeze({...observations,...renderers});
if(typeof window!=='undefined')window.MathScopeM2Visualization=visualization;

return {visualization};
})();
})();