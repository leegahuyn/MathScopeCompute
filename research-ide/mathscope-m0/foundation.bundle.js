/* MathScope Research M0 1.0.0 — maintained modules; scoped evidence. */
(function(){
"use strict";
const __m0_0 = (()=>{
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
const __m0_1 = (()=>{
/** Additive ResearchSession extension. Mathematical trust never comes from JSON. */
const { validate, SCHEMAS, canonicalStringify, sha256, LEGACY_SESSION_SCHEMA, EDGE_TYPES, validateProofEdge, getContractExamples, containsUserAxiom } = __m0_0;
const M0_SCHEMA='MathScope.ResearchM0/1';
const SESSION_BUNDLE_SCHEMA='MathScope.M0SessionBundle/1';
const clone=value=>JSON.parse(canonicalStringify(value));
const HASH=/^[0-9a-f]{64}$/;
const NODE_KINDS=new Set(['object','assumption','claim','observation','legacyObservation','computeJob','result','source','proof']);
const LEGACY_GROUPS=['objects','representations','functionSpaces','differentialSystems','optimizations','operators','pdes','spectra','geometries','topologies','entropies','symmetries','kclasses','claims','evidence','assumptions','researchRuns','replayJobs'];
const PROOF_EDGES=new Set(['LOCAL_TO_GLOBAL','BASE_CHANGE','PROJECTION','LIMIT','VERIFIED_BY']);
const KIND_MAP=Object.freeze({PrismSpec:'object',PrimeQuerySpec:'object',GaugeGroupSpec:'object',StateFamilySpec:'object',PDEConstructionSpec:'object',AssumptionSpec:'assumption',AssumptionLedger:'assumption',ClaimSpec:'claim',ObservationMapSpec:'observation',LegacyObservation:'legacyObservation',ComputeJobSpec:'computeJob',ResultEnvelope:'result',SourceManifest:'source',ProofJob:'proof'});
const CURRENT='CURRENT';
const nsOf=value=>value?.schema===M0_SCHEMA?value:value?.researchM0;
function wrap(original,ns) {if(original.schema===M0_SCHEMA)return ns;const out=clone(original);out.researchM0=ns;return out;}
function fail(message) {throw new Error(`MathScope M0: ${message}`);}
function referenceOf(node) {return {id:node.id,revision:node.revision,hash:node.hash};}
function normalizeNodeKind(kind) {const normalized=KIND_MAP[kind]||kind;if(!NODE_KINDS.has(normalized))fail(`Unknown node kind ${kind}`);return normalized;}
function getSessionNodeKinds() {return {...KIND_MAP};}

function schemaKind(payload) {
  if(payload?.schemaVersion==='mathscope.proof-job/1')return 'ProofJob';
  return typeof payload?.schema==='string'?payload.schema.match(/^MathScope\.([^/]+)\/1$/)?.[1]:null;
}
function payloadReport(node) {
  const kind=schemaKind(node.payload);
  if (kind&&SCHEMAS[kind]) {
    const allowed={object:['PrismSpec','PrimeQuerySpec','GaugeGroupSpec','StateFamilySpec','PDEConstructionSpec'],assumption:['AssumptionSpec','AssumptionLedger'],claim:['ClaimSpec'],observation:['ObservationMapSpec'],legacyObservation:['LegacyObservation'],computeJob:['ComputeJobSpec'],result:['ResultEnvelope'],source:['SourceManifest'],proof:['ProofJob']};
    if (!allowed[node.kind]?.includes(kind)) return {ok:false,errors:[`Node kind ${node.kind} cannot hold ${kind}`]};
    return validate(kind,node.payload);
  }
  if (node.kind==='proof') return {ok:false,errors:['Proof records must remain in the audited ProofBridge; use a source reference or VERIFIED_BY receipt']};
  return {ok:false,errors:['Unknown or absent typed payload schema']};
}
function revisionNumber(node) {
  const m=String(node?.revision||'').match(/:r([1-9][0-9]*)$/);
  return m?Number(m[1]):0;
}
function mapNodes(ns) {return new Map(ns.nodes.map(n=>[n.id,n]));}
function findRevision(ns,id,revision,hash) {
  return [...ns.nodes,...ns.history].find(n=>n.id===id&&n.revision===revision&&n.hash===hash)
    || ns.legacyIndex.find(n=>n.id===id&&(n.revision===revision||(n.revision===null&&revision==='legacy-unversioned'))&&n.hash===hash);
}
function allPayloadRefs(payload) {
  const refs=[];
  function walk(value,key='') {
    if (!value||typeof value!=='object') return;
    if (key==='snapshot'||key==='parameters'||key==='input'||key==='provenance') return;
    if (!Array.isArray(value)&&typeof value.id==='string'&&typeof value.revision==='string'&&HASH.test(value.hash||'')) {refs.push(value);return;}
    for (const [name,child] of Object.entries(value)) walk(child,name);
  }
  walk(payload);return refs;
}
function cycleErrors(ns) {
  const errors=[],adj=new Map(ns.nodes.map(n=>[n.id,[]]));
  for (const e of ns.edges) adj.get(e.from)?.push(e.to);
  const seen=new Set(),active=new Set();
  function visit(id) {
    if (active.has(id)) {errors.push(`Dependency cycle at ${id}`);return;}
    if (seen.has(id)) return;
    active.add(id);for(const next of adj.get(id)||[])visit(next);active.delete(id);seen.add(id);
  }
  for(const id of adj.keys())visit(id);
  return [...new Set(errors)];
}
function unconditionalDependencyErrors(ns) {
  const errors=[],map=mapNodes(ns);
  for(const target of ns.nodes)if(target.payload?.logicRole==='THEOREM_TARGET'){
    const seen=new Set(),queue=[target.id];
    for(let i=0;i<queue.length;i++)for(const e of ns.edges)if(e.type!=='CITES'&&e.to===queue[i]&&!seen.has(e.from)){
      seen.add(e.from);queue.push(e.from);
      if(containsUserAxiom(map.get(e.from)?.payload))errors.push(`Unconditional target ${target.id} indirectly depends on USER_AXIOM ${e.from}`);
    }
  }
  return errors;
}
function validateResearchM0Namespace(ns) {
  const errors=[],warnings=[];
  try {canonicalStringify(ns);}catch(e){return {ok:false,errors:[e.message],warnings};}
  if(!ns||ns.schema!==M0_SCHEMA)return {ok:false,errors:['ResearchM0 schema mismatch'],warnings};
  if(ns.version!=='1.0.0')errors.push('ResearchM0 version mismatch');
  const namespaceKeys=new Set(['schema','version','revision','baseline','baselineHash','legacyIndex','nodes','edges','history','events','trustPolicy','importAudit']);
  for(const key of Object.keys(ns))if(!namespaceKeys.has(key))errors.push(`Unknown namespace property ${key}`);
  if (!Number.isSafeInteger(ns.revision)||ns.revision<0) errors.push('Namespace revision must be a nonnegative safe integer');
  if (!HASH.test(ns.baselineHash||'')||!ns.baseline||ns.baseline.schema!=='MathScopeBaselineManifest/1') errors.push('Pinned baseline manifest/digest missing');
  for(const k of ['nodes','edges','history','legacyIndex','events'])if(!Array.isArray(ns[k]))errors.push(`${k} must be an array`);
  if(errors.length)return {ok:false,errors,warnings};
  const ids=new Set(),revisions=new Set();
  for(const node of [...ns.nodes,...ns.history]) {
    if(!node||typeof node!=='object'){errors.push('Invalid node');continue;}
    if(!NODE_KINDS.has(node.kind))errors.push(`Unknown node kind ${node.kind}`);
    const nodeKeys=new Set(['id','kind','revision','payload','hash','freshness','staleReasons','supportsCurrent','effectiveTrust']);
    for(const key of Object.keys(node))if(!nodeKeys.has(key))errors.push(`Unknown node envelope property ${key}`);
    if(typeof node.id!=='string'||!node.id)errors.push('Node ID required');
    if(typeof node.revision!=='string'||!node.revision.startsWith(node.id+':r')||!revisionNumber(node))errors.push(`Invalid node revision ${node.id}`);
    if(!HASH.test(node.hash||''))errors.push(`Missing payload hash for ${node.id}`);
    const key=`${node.id}@${node.revision}`;
    if(revisions.has(key))errors.push(`Duplicate revision ${key}`);revisions.add(key);
    if(!['CURRENT','STALE','REVALIDATION_REQUIRED','HISTORICAL'].includes(node.freshness))errors.push(`Invalid freshness for ${node.id}`);
    if(!Array.isArray(node.staleReasons))errors.push(`staleReasons missing for ${node.id}`);
    if(node.supportsCurrent!==false)errors.push(`Node ${node.id} cannot confer mathematical support through a data field`);
    if(!['DECLARED','REVALIDATION_REQUIRED','FINITE_COMPUTATION_METADATA'].includes(node.effectiveTrust))errors.push(`Untrusted trust field on ${node.id}`);
    if(node.payload?.id&&node.payload.id!==node.id)errors.push(`Payload identity mismatch for ${node.id}`);
    if(node.payload?.revision&&node.payload.revision!==node.revision)errors.push(`Payload revision mismatch for ${node.id}`);
    const result=payloadReport(node);errors.push(...result.errors.map(e=>`${node.id}: ${e}`));
  }
  for(const entry of ns.legacyIndex)if(!entry||typeof entry.id!=='string'||typeof entry.group!=='string'||!HASH.test(entry.hash||'')||(entry.revision!==null&&typeof entry.revision!=='string'))errors.push('Malformed legacy identity binding');
  if(errors.length)return {ok:false,errors,warnings};
  for(const node of ns.nodes){if(ids.has(node.id))errors.push(`Duplicate current node ${node.id}`);ids.add(node.id);}
  const edgeIds=new Set(),nodes=mapNodes(ns);
  for(const edge of ns.edges) {
    if(!edge||typeof edge.id!=='string'||!edge.id||edgeIds.has(edge.id))errors.push('Missing or duplicate edge ID');edgeIds.add(edge?.id);
    if(!EDGE_TYPES.includes(edge?.type))errors.push('Unsupported edge type');
    if(!nodes.has(edge?.from)||!nodes.has(edge?.to))errors.push(`Missing edge endpoint ${edge?.id}`);
    if(edge?.from===edge?.to)errors.push(`Self dependency ${edge.id}`);
    if(!findRevision(ns,edge?.from,edge?.fromRevision,edge?.fromHash)||!findRevision(ns,edge?.to,edge?.toRevision,edge?.toHash))errors.push(`Unresolved edge revision/hash ${edge?.id}`);
    if(PROOF_EDGES.has(edge?.type)&&!['REVALIDATION_REQUIRED','AUDIT_REFERENCE'].includes(edge.proofStatus))errors.push(`Serialized proof edge cannot claim current formal authority: ${edge.id}`);
    if(!PROOF_EDGES.has(edge?.type)&&edge?.proofStatus!=='PROVENANCE_ONLY')errors.push(`Invalid provenance status ${edge?.id}`);
    // Import validation uses no live certificate; keep semantic shape checks but
    // do not confuse an historical receipt reference with a newly issued proof.
    const a=nodes.get(edge?.from)?.payload,b=nodes.get(edge?.to)?.payload;
    if(containsUserAxiom(a)&&!['ASSUMES','CITES'].includes(edge?.type))errors.push('USER_AXIOM edge must retain ASSUMES origin');
    if(containsUserAxiom(a)&&edge.type==='ASSUMES'&&b?.logicRole==='THEOREM_TARGET')errors.push('Unconditional target depends on a USER_AXIOM');
    if(a?.propositionKind==='WEIL_RH_FINITE_FIELD'&&b?.propositionKind==='CLASSICAL_RH'&&PROOF_EDGES.has(edge?.type))errors.push('Forbidden direct Weil-RH to classical-RH edge');
    if(a?.scope?.kind==='FINITE'&&b?.scope?.kind==='SYMBOLIC'&&PROOF_EDGES.has(edge?.type)&&!edge.semanticBridge?.limitStatement)errors.push('Finite-to-infinite edge lacks a quantified bridge');
    if(a?.propositionKind==='OBSERVED_SPECTRUM'&&b?.propositionKind==='GLOBAL_SPECTRUM'&&PROOF_EDGES.has(edge?.type)&&!edge.semanticBridge?.spectralInclusion)errors.push('Channel-to-global spectrum bridge missing');
  }
  if(errors.length)return {ok:false,errors,warnings};
  errors.push(...cycleErrors(ns));
  errors.push(...unconditionalDependencyErrors(ns));
  if(ns.trustPolicy!=='SERIALIZED_METADATA_NEVER_ISSUES_FORMAL_PASS')errors.push('Trust policy missing');
  return {ok:errors.length===0,errors,warnings};
}
async function verifyResearchM0Namespace(ns) {
  const report=validateResearchM0Namespace(ns);if(!report.ok)return report;
  if(await sha256(ns.baseline)!==ns.baselineHash)report.errors.push('Baseline manifest was modified');
  for(const node of [...ns.nodes,...ns.history]){
    if(await sha256(node.payload)!==node.hash)report.errors.push(`Payload digest mismatch for ${node.id}@${node.revision}`);
    if(schemaKind(node.payload)==='ProofJob')for(const file of node.payload.sourceFiles)if(await sha256(file.content)!==file.sha256)report.errors.push(`Proof source content hash mismatch: ${file.path}`);
  }
  report.ok=report.errors.length===0;return report;
}
async function assertNamespace(ns) {const r=await verifyResearchM0Namespace(ns);if(!r.ok)fail(r.errors.join('; '));}

/** Idempotent migration; the legacy session is never mutated or regraded. */
async function migrateSession(legacy,baseline) {
  if(!legacy||legacy.schema!==LEGACY_SESSION_SCHEMA||!legacy.id)fail('Expected existing v0.3.1 ResearchSession');
  const out=clone(legacy);
  if(out.researchM0) {await assertNamespace(out.researchM0);return out;}
  if(!baseline||baseline.schema!=='MathScopeBaselineManifest/1'||baseline.page?.version!==41||baseline.page?.versionHash!=='d400a17e')fail('M0 starts from the audited page 41 / d400a17e baseline');
  const legacyIndex=[];
  for(const group of LEGACY_GROUPS)for(const item of out[group]||[])if(item&&typeof item.id==='string')legacyIndex.push({id:item.id,group,revision:item.revision||'legacy-unversioned',hash:await sha256(item),grade:item.grade||null});
  out.researchM0={
    schema:M0_SCHEMA,version:'1.0.0',revision:0,
    baseline:clone(baseline),baselineHash:await sha256(baseline),legacyIndex,
    nodes:[],edges:[],history:[],events:[{type:'MIGRATED',revision:0,legacySessionId:out.id}],
    trustPolicy:'SERIALIZED_METADATA_NEVER_ISSUES_FORMAL_PASS'
  };
  await assertNamespace(out.researchM0);return out;
}

async function createNode({id,kind,payload,revision}) {
  kind=normalizeNodeKind(kind);
  const copy=clone(payload),nodeId=id||copy.id;
  if(!nodeId)fail('Node identity required');
  const rev=revision||copy.revision||`${nodeId}:r1`;
  if(copy.id&&copy.id!==nodeId)fail('Node identity differs from payload');
  if(copy.revision)copy.revision=rev;
  const node={id:nodeId,kind,revision:rev,payload:copy,hash:await sha256(copy),freshness:CURRENT,staleReasons:[],supportsCurrent:false,effectiveTrust:kind==='result'?'FINITE_COMPUTATION_METADATA':'DECLARED'};
  const report=payloadReport(node);if(!report.ok)fail(report.errors.join('; '));return node;
}
function downstream(ns,roots) {
  const reached=new Set(),queue=[...roots];
  for(let i=0;i<queue.length;i++)for(const e of ns.edges)if(e.from===queue[i]&&!reached.has(e.to)){reached.add(e.to);queue.push(e.to);}
  for(const root of roots)reached.delete(root);return reached;
}
function staleDependents(ns,id,reason) {
  const reached=downstream(ns,[id]);
  for(const node of ns.nodes)if(reached.has(node.id)){
    node.freshness='STALE';node.supportsCurrent=false;
    if(!node.staleReasons.includes(reason))node.staleReasons.push(reason);
  }
  for(const edge of ns.edges)if(edge.from===id||edge.to===id||reached.has(edge.from)||reached.has(edge.to))edge.freshness='STALE';
  return [...reached];
}
function validateReferencedAssumptions(ns,node) {
  for(const ref of node.payload.assumptionRefs||[]) {
    const linked=findRevision(ns,ref.id,ref.revision,ref.hash);
    if(linked&&!['AssumptionSpec','AssumptionLedger'].includes(schemaKind(linked.payload)))fail(`Assumption reference ${ref.id} points at another object type`);
    if(containsUserAxiom(linked?.payload)&&node.payload.logicRole==='THEOREM_TARGET')fail('Unconditional target cannot contain USER_AXIOM assumption reference');
  }
}
/** Replace one current revision atomically and selectively stale its descendants. */
async function addNode(sessionOrNamespace,input,{allowUnresolvedRefs=true}={}) {
  const original=nsOf(sessionOrNamespace);await assertNamespace(original);
  const ns=clone(original),existing=ns.nodes.find(n=>n.id===(input.id||input.payload?.id));
  if(existing){const comparable=clone(input.payload);if(comparable.revision)comparable.revision=existing.revision;if(canonicalStringify(existing.payload)===canonicalStringify(comparable))return clone(sessionOrNamespace);}
  const nextRevision=existing?`${existing.id}:r${revisionNumber(existing)+1}`:input.revision||input.payload?.revision||`${input.id||input.payload?.id}:r1`;
  const incoming=await createNode({...input,revision:nextRevision});
  validateReferencedAssumptions(ns,incoming);
  for(const ref of allPayloadRefs(incoming.payload)){
    const found=findRevision(ns,ref.id,ref.revision,ref.hash),current=ns.nodes.find(n=>n.id===ref.id);
    if(!found&&(!allowUnresolvedRefs||current||ns.legacyIndex.some(n=>n.id===ref.id)))fail(`Unresolved or mismatched content reference ${ref.id}`);
    if(current&&found&&current.revision!==ref.revision){incoming.freshness='STALE';incoming.staleReasons.push(`HISTORICAL_REFERENCE:${ref.id}@${ref.revision}`);}
  }
  const invalidated=existing?staleDependents(ns,existing.id,`UPSTREAM_REVISED:${existing.id}@${existing.revision}`):[];
  if(existing) {
    const historic=clone(existing);historic.freshness='HISTORICAL';ns.history.push(historic);
    ns.nodes[ns.nodes.findIndex(n=>n.id===existing.id)]=incoming;
  }else ns.nodes.push(incoming);
  for(const ref of allPayloadRefs(incoming.payload)){
    const source=ns.nodes.find(n=>n.id===ref.id);if(!source)continue;
    if(ref.id===incoming.id)fail('A payload cannot depend on itself');
    const type=source.kind==='assumption'?'ASSUMES':'DEPENDS_ON';
    const automatic={id:`auto:${ref.id}:${incoming.id}`,type,from:ref.id,to:incoming.id,fromRevision:ref.revision,toRevision:incoming.revision,fromHash:ref.hash,toHash:incoming.hash,semanticBridge:null,certificate:null,proofStatus:'PROVENANCE_ONLY',freshness:incoming.freshness==='STALE'?'STALE':CURRENT,origin:'PAYLOAD_REFERENCE'};
    const oldEdge=ns.edges.findIndex(e=>e.id===automatic.id);
    if(oldEdge>=0)ns.edges[oldEdge]=automatic;else ns.edges.push(automatic);
  }
  ns.revision++;
  ns.events.push({type:existing?'NODE_REVISED':'NODE_ADDED',revision:ns.revision,nodeId:incoming.id,nodeRevision:incoming.revision,hash:incoming.hash,invalidated});
  await assertNamespace(ns);return wrap(sessionOrNamespace,ns);
}
const upsertNode=addNode;

/** Live receipts are consulted at insertion, then persisted only as audit refs. */
async function addEdge(sessionOrNamespace,edge,{isVerifiedCertificate}={}) {
  const original=nsOf(sessionOrNamespace);await assertNamespace(original);
  const ns=clone(original);if(ns.edges.some(e=>e.id===edge.id))fail('Dependency edge ID already exists');
  const report=validateProofEdge(edge,ns.nodes,{isVerifiedCertificate});if(!report.ok)fail(report.errors.join('; '));
  const from=ns.nodes.find(n=>n.id===edge.from),to=ns.nodes.find(n=>n.id===edge.to);
  const out={id:edge.id,type:edge.type,from:from.id,to:to.id,fromRevision:from.revision,toRevision:to.revision,fromHash:from.hash,toHash:to.hash,
    semanticBridge:edge.semanticBridge?clone(edge.semanticBridge):null,
    certificate:edge.certificate?clone(edge.certificate):null,
    proofStatus:PROOF_EDGES.has(edge.type)?'AUDIT_REFERENCE':'PROVENANCE_ONLY',freshness:CURRENT};
  ns.edges.push(out);const cycles=cycleErrors(ns);if(cycles.length)fail(cycles.join('; '));
  ns.revision++;ns.events.push({type:'EDGE_ADDED',revision:ns.revision,edgeId:out.id});
  await assertNamespace(ns);return wrap(sessionOrNamespace,ns);
}

async function reviseAssumption(sessionOrNamespace,id,replacement) {
  const ns=nsOf(sessionOrNamespace);await assertNamespace(ns);
  const old=ns.nodes.find(n=>n.id===id&&n.kind==='assumption');if(!old)fail('Assumption node not found');
  if(schemaKind(old.payload)!=='AssumptionSpec')fail('Revise individual assumption records, not a whole ledger');
  const payload=typeof replacement==='string'?{...clone(old.payload),statement:replacement}:{...clone(old.payload),...clone(replacement)};
  if(payload.id!==id)fail('Revision cannot change assumption identity');
  if(old.payload.origin==='USER_AXIOM'&&payload.origin!=='USER_AXIOM')fail('A USER_AXIOM cannot be silently relabeled; introduce a separate proved statement with provenance');
  const updated=await addNode(sessionOrNamespace,{id,kind:'assumption',payload});
  return {session:updated,namespace:nsOf(updated),invalidated:[...downstream(ns,[id])]};
}
async function addAssumption(sessionOrNamespace,payload) {return addNode(sessionOrNamespace,{id:payload.id,kind:'assumption',payload});}

function effectiveNodeState(sessionOrNamespace,id) {
  const ns=nsOf(sessionOrNamespace),node=ns?.nodes.find(n=>n.id===id);
  if(!node)return null;
  return {id,revision:node.revision,freshness:node.freshness,recordedGrade:node.payload.grade||node.payload.evidence?.grade||null,effectiveTrust:node.effectiveTrust,supportsCurrent:false,staleReasons:[...node.staleReasons]};
}
function dependencySummary(sessionOrNamespace) {
  const ns=nsOf(sessionOrNamespace);
  return {nodes:ns.nodes.length,edges:ns.edges.length,history:ns.history.length,stale:ns.nodes.filter(n=>n.freshness==='STALE').map(n=>n.id),revision:ns.revision};
}

function quarantineResearchM0Namespace(ns,{integrity='NOT_CHECKED'}={}) {
  const report=validateResearchM0Namespace(ns);if(!report.ok)fail(report.errors.join('; '));
  for(const node of [...ns.nodes,...ns.history]){
    node.effectiveTrust='REVALIDATION_REQUIRED';node.supportsCurrent=false;
    if(node.freshness!== 'STALE'&&node.freshness!=='HISTORICAL')node.freshness='REVALIDATION_REQUIRED';
  }
  for(const edge of ns.edges)if(PROOF_EDGES.has(edge.type))edge.proofStatus='REVALIDATION_REQUIRED';
  ns.importAudit={status:'REVALIDATION_REQUIRED',integrity,rule:'Content hashes detect changed bytes, not mathematical truth or source authority'};
  return ns;
}
function quarantineLegacyTree(session,options) {
  const queue=[session],seen=new Set();
  while(queue.length){
    const item=queue.pop();if(!item||typeof item!=='object'||seen.has(item))continue;seen.add(item);
    for(const evidence of item.evidence||[])if(evidence&&typeof evidence==='object'){
      evidence.supportsCurrent=false;
      evidence.freshness=evidence.grade==='FORMAL PASS'?'HISTORICAL FORMAL':evidence.grade==='THEOREM-BACKED'?'HISTORICAL':'REVALIDATION REQUIRED';
    }
    for(const claim of item.claims||[])if(claim&&typeof claim==='object'){
      claim.importedStatus=claim.importedStatus||claim.status||'UNKNOWN';claim.status='REVIEW';claim.freshness='REVALIDATION REQUIRED';
    }
    if(item.researchM0)quarantineResearchM0Namespace(item.researchM0,options);
    for(const cp of item.checkpoints||[])if(cp?.snapshot)queue.push(cp.snapshot);
  }
}
async function exportSessionBundle(sessionOrNamespace) {
  const ns=nsOf(sessionOrNamespace);await assertNamespace(ns);
  const payload=clone(sessionOrNamespace);
  const manifest={schema:SESSION_BUNDLE_SCHEMA,version:'1.0.0',kind:payload.schema===M0_SCHEMA?'namespace':'session',payload,payloadHash:await sha256(payload),trust:'INTEGRITY_ONLY_REPLAY_REQUIRED'};
  return canonicalStringify(manifest);
}
async function importSessionBundle(text,{maxBytes=10*1024*1024,expectedBaselineHash}={}) {
  if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>maxBytes)fail('Import is missing or exceeds the configured byte limit');
  const data=JSON.parse(text);canonicalStringify(data);
  if(data.schema!==SESSION_BUNDLE_SCHEMA||!['session','namespace'].includes(data.kind)||data.trust!=='INTEGRITY_ONLY_REPLAY_REQUIRED')fail('Unsupported session bundle');
  if(await sha256(data.payload)!==data.payloadHash)fail('Session payload hash mismatch');
  if(data.kind==='session'&&(data.payload.schema!==LEGACY_SESSION_SCHEMA||!data.payload.id))fail('Legacy ResearchSession identity/schema missing');
  const ns=nsOf(data.payload);await assertNamespace(ns);
  if(expectedBaselineHash&&ns.baselineHash!==expectedBaselineHash)fail('Imported bundle belongs to a different baseline');
  if(data.kind==='session'){
    const queue=[data.payload];
    while(queue.length){const entry=queue.pop();if(entry.researchM0)await assertNamespace(entry.researchM0);for(const cp of entry.checkpoints||[])if(cp?.snapshot)queue.push(cp.snapshot);}
  }
  const output=clone(data.payload);
  if(data.kind==='session')quarantineLegacyTree(output,{integrity:'SHA256_VERIFIED'});else quarantineResearchM0Namespace(output,{integrity:'SHA256_VERIFIED'});
  await assertNamespace(nsOf(output));return output;
}
const exportM0Session=exportSessionBundle;
const importM0Session=importSessionBundle;

/** Explicit user action: recheck imported input definitions, never old results. */
async function revalidateImportedInputs(sessionOrNamespace,{expectedBaselineHash}={}) {
  const original=nsOf(sessionOrNamespace);await assertNamespace(original);
  if(!HASH.test(expectedBaselineHash||'')||original.baselineHash!==expectedBaselineHash)fail('Input revalidation requires the installed exact baseline digest');
  const ns=clone(original),inputKinds=new Set(['source','object','assumption','claim','observation','legacyObservation']),revalidated=[];
  for(const node of ns.nodes)if(inputKinds.has(node.kind)&&node.freshness==='REVALIDATION_REQUIRED'){
    node.freshness=CURRENT;node.effectiveTrust='DECLARED';node.supportsCurrent=false;revalidated.push(node.id);
  }
  ns.revision++;
  ns.events.push({type:'INPUT_CONTRACTS_REVALIDATED',revision:ns.revision,verification:'CONTRACT_AND_HASH_ONLY',nodeIds:revalidated,
    limitation:'Source authenticity and mathematical truth are not established. Stored jobs, results and proofs retain their previous trust.'});
  await assertNamespace(ns);return wrap(sessionOrNamespace,ns);
}

/** Small real dependency edit exercise; it makes no new mathematical claim. */
async function addDependencyExample(sessionOrNamespace) {
  const examples=await getContractExamples();let state=sessionOrNamespace;
  for(const kind of ['SourceManifest','AssumptionSpec','PrimeQuerySpec','ClaimSpec'])state=await addNode(state,{kind,payload:examples[kind]});
  const snapshot={schema:'MathScope.LegacyObservation/1',module:'yangmills',input:{delta:1,mode:'ASSUMED_BOUND'},scope:{kind:'FINITE',finite:{description:'One displayed conditional interpretation; this is metadata, not a field computation',itemCount:1}},legacyRefs:[],snapshot:{interpretation:'The current classical density does not determine the quantum mass gap.'},grade:'RESEARCH HYPOTHESIS'};
  state=await addNode(state,{id:'m0-gap-interpretation',kind:'LegacyObservation',payload:snapshot});
  const ns=nsOf(state);
  if(!ns.edges.some(e=>e.id==='demo:claim-to-interpretation'))state=await addEdge(state,{id:'demo:claim-to-interpretation',type:'DEPENDS_ON',from:'m0-gap-claim',to:'m0-gap-interpretation'});
  return {session:state,namespace:nsOf(state),assumptionId:'m0-assume-gap',dependentIds:['m0-gap-claim','m0-gap-interpretation'],independentId:'m0-primes'};
}

return {M0_SCHEMA,SESSION_BUNDLE_SCHEMA,referenceOf,normalizeNodeKind,getSessionNodeKinds,validateResearchM0Namespace,verifyResearchM0Namespace,migrateSession,createNode,addNode,upsertNode,addEdge,reviseAssumption,addAssumption,effectiveNodeState,dependencySummary,quarantineResearchM0Namespace,exportSessionBundle,importSessionBundle,exportM0Session,importM0Session,revalidateImportedInputs,addDependencyExample};
})();
const __m0_2 = (()=>{
/* MathScope M0 exact and approximate value vocabulary. No external numerical backend. */
function createValueOps() {
  const MAX_DIGITS = 2048;
  class ValueError extends Error {
    constructor(code, message, details = {}) { super(message); this.name = 'ValueError'; this.code = code; this.details = details; }
  }
  const fail = (code, message, details) => { throw new ValueError(code, message, details); };
  function asBigInt(value) {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) fail('INVALID_EXACT_INTEGER', 'An exact integer must be a safe integer, BigInt, or decimal string.');
    if (!['number', 'string', 'bigint'].includes(typeof value)) fail('INVALID_EXACT_INTEGER', 'Unsupported integer representation.');
    const s = String(value);
    if (!/^-?\d+$/.test(s) || s.replace('-', '').length > MAX_DIGITS) fail('INTEGER_LIMIT', `Integer input must contain at most ${MAX_DIGITS} decimal digits.`);
    return BigInt(s);
  }
  const abs = a => a < 0n ? -a : a;
  function gcd(a, b) { a = abs(a); b = abs(b); while (b) { const c = a % b; a = b; b = c; } return a; }
  const mod = (a, m) => ((a % m) + m) % m;
  function integer(value) { return { kind: 'INTEGER', value: asBigInt(value).toString() }; }
  function rational(numerator, denominator = '1') {
    let n = asBigInt(numerator), d = asBigInt(denominator);
    if (d === 0n) fail('DIVISION_BY_ZERO', 'A rational denominator cannot be zero.');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d); n /= g; d /= g;
    if (abs(n).toString().length > MAX_DIGITS || d.toString().length > MAX_DIGITS) fail('INTEGER_LIMIT', 'The exact result exceeds the configured digit limit.');
    return { kind: 'RATIONAL', numerator: n.toString(), denominator: d.toString() };
  }
  function asRational(v) {
    if (v && v.kind === 'RATIONAL') return rational(v.numerator, v.denominator);
    if (v && v.kind === 'INTEGER') return rational(v.value);
    if (typeof v === 'string' && /^-?\d+\/[1-9]\d*$/.test(v)) { const [n, d] = v.split('/'); return rational(n, d); }
    return rational(v);
  }
  function qParts(v) { v = asRational(v); return [BigInt(v.numerator), BigInt(v.denominator)]; }
  function qAdd(a, b) { const [an, ad] = qParts(a), [bn, bd] = qParts(b); const g = gcd(ad, bd); return rational(an * (bd / g) + bn * (ad / g), ad * (bd / g)); }
  function qNeg(a) { a = asRational(a); return rational(-BigInt(a.numerator), a.denominator); }
  function qSub(a, b) { return qAdd(a, qNeg(b)); }
  function qMul(a, b) { let [an, ad] = qParts(a), [bn, bd] = qParts(b); const g = gcd(an, bd), h = gcd(bn, ad); return rational((an / g) * (bn / h), (ad / h) * (bd / g)); }
  function qDiv(a, b) { b = asRational(b); if (b.numerator === '0') fail('DIVISION_BY_ZERO', 'Division by zero.'); return qMul(a, rational(b.denominator, b.numerator)); }
  function qCompare(a, b) { const [an, ad] = qParts(a), [bn, bd] = qParts(b); const c = an * bd - bn * ad; return c < 0n ? -1 : c > 0n ? 1 : 0; }
  function isPrimeSmall(p) {
    p = asBigInt(p);
    if (p < 2n || p > 1000000n) return false;
    if (p === 2n) return true;
    if (p % 2n === 0n) return false;
    for (let d = 3n; d * d <= p; d += 2n) if (p % d === 0n) return false;
    return true;
  }
  function primeModulus(p) {
    p = asBigInt(p);
    if (!isPrimeSmall(p)) fail('INVALID_PRIME', 'The supported modulus must be a prime between 2 and 1,000,000.');
    return p;
  }
  function finiteField(p, residue) { p = primeModulus(p); return { kind: 'FINITE_FIELD', p: p.toString(), residue: mod(asBigInt(residue), p).toString() }; }
  function sameField(a, b) {
    if (!a || !b || a.kind !== 'FINITE_FIELD' || b.kind !== 'FINITE_FIELD' || a.p !== b.p) fail('FIELD_BASE_MISMATCH', 'Finite-field operands must have the same prime modulus.');
    return [finiteField(a.p, a.residue), finiteField(b.p, b.residue)];
  }
  function finiteFieldAdd(a, b) { [a, b] = sameField(a, b); return finiteField(a.p, BigInt(a.residue) + BigInt(b.residue)); }
  function finiteFieldMul(a, b) { [a, b] = sameField(a, b); return finiteField(a.p, BigInt(a.residue) * BigInt(b.residue)); }
  function finiteFieldDivide(a, b) { [a, b] = sameField(a, b); if (b.residue === '0') fail('DIVISION_BY_ZERO', 'Zero has no multiplicative inverse in the finite field.'); return finiteField(a.p, BigInt(a.residue) * inverseMod(BigInt(b.residue), BigInt(b.p))); }
  function padicBall(p, residue, digits) {
    p = primeModulus(p);
    if (!Number.isInteger(digits) || digits < 1 || digits > 256) fail('PRECISION_LIMIT', 'Supported p-adic absolute precision is 1 to 256 digits.');
    return { kind: 'PADIC_BALL', p: p.toString(), residue: mod(asBigInt(residue), p ** BigInt(digits)).toString(), digits };
  }
  function realInterval(lower, upper) {
    lower = asRational(lower); upper = asRational(upper);
    if (qCompare(lower, upper) > 0) fail('INVALID_INTERVAL', 'The lower endpoint exceeds the upper endpoint.');
    return { kind: 'REAL_INTERVAL', lower, upper, certified: true, certification: 'EXACT_RATIONAL_ENDPOINTS' };
  }
  function interval(v) {
    if (!v || v.kind !== 'REAL_INTERVAL' || v.certified !== true || v.certification !== 'EXACT_RATIONAL_ENDPOINTS') fail('INVALID_INTERVAL', 'Only exact rational endpoint intervals are supported.');
    return realInterval(v.lower, v.upper);
  }
  function intervalAdd(a, b) { a = interval(a); b = interval(b); return realInterval(qAdd(a.lower, b.lower), qAdd(a.upper, b.upper)); }
  function intervalSub(a, b) { a = interval(a); b = interval(b); return realInterval(qSub(a.lower, b.upper), qSub(a.upper, b.lower)); }
  function intervalMul(a, b) {
    a = interval(a); b = interval(b);
    const bounds = [qMul(a.lower, b.lower), qMul(a.lower, b.upper), qMul(a.upper, b.lower), qMul(a.upper, b.upper)].sort(qCompare);
    return realInterval(bounds[0], bounds[3]);
  }
  function intervalDiv(a, b) {
    a = interval(a); b = interval(b);
    if (qCompare(b.lower, '0') <= 0 && qCompare(b.upper, '0') >= 0) fail('INTERVAL_CONTAINS_ZERO', 'An interval containing zero cannot be used as a divisor.');
    return intervalMul(a, realInterval(qDiv('1', b.upper), qDiv('1', b.lower)));
  }
  function complexInterval(real, imaginary) { return { kind: 'COMPLEX_INTERVAL', real: interval(real), imaginary: interval(imaginary), certified: true, certification: 'EXACT_RATIONAL_RECTANGLE' }; }
  function float64(value, note = 'IEEE-754 numerical value; no certified enclosure') {
    if (typeof value !== 'number' || !Number.isFinite(value)) fail('NONFINITE_VALUE', 'A numerical value must be finite.');
    return { kind: 'FLOAT64', value, certified: false, note: String(note) };
  }
  function statisticalEstimate({ estimate, standardError, sampleCount, effectiveSampleSize, confidence, interval: ci, method, dependence = 'unspecified' }) {
    if (![estimate, standardError, effectiveSampleSize, confidence].every(Number.isFinite) || standardError < 0 || !Number.isSafeInteger(sampleCount) || sampleCount < 2 || effectiveSampleSize <= 0 || effectiveSampleSize > sampleCount || confidence <= 0 || confidence >= 1 || !Array.isArray(ci) || ci.length !== 2 || !ci.every(Number.isFinite) || ci[0] > ci[1] || !method) fail('INVALID_STATISTICAL_ESTIMATE', 'A statistical estimate requires finite uncertainty, sample count, effective sample size, confidence, method, and ordered interval.');
    return { kind: 'STATISTICAL_ESTIMATE', estimate, standardError, sampleCount, effectiveSampleSize, confidence, interval: ci.slice(), method: String(method), dependence: String(dependence), certified: false, interpretation: 'SAMPLING_UNCERTAINTY_NOT_DETERMINISTIC_ENCLOSURE' };
  }
  function inverseMod(a, m) {
    let x = mod(a, m), y = m, u = 1n, v = 0n;
    while (y) { const q = x / y; [x, y] = [y, x - q * y]; [u, v] = [v, u - q * v]; }
    if (x !== 1n) fail('NONUNIT_DIVISION', 'Only unit division is implemented; Z/p^N Z is not treated as a field.');
    return mod(u, m);
  }
  function samePadic(a, b) {
    if (!a || !b || a.kind !== 'PADIC_BALL' || b.kind !== 'PADIC_BALL' || a.p !== b.p) fail('PADIC_BASE_MISMATCH', 'p-adic operands must have the same prime base.');
    return [padicBall(a.p, a.residue, a.digits), padicBall(b.p, b.residue, b.digits)];
  }
  function valuationLower(a) { let x = BigInt(a.residue), p = BigInt(a.p), v = 0; if (!x) return a.digits; while (x % p === 0n) { x /= p; v++; } return v; }
  function padicAdd(a, b) { [a, b] = samePadic(a, b); return padicBall(a.p, BigInt(a.residue) + BigInt(b.residue), Math.min(a.digits, b.digits)); }
  function padicMul(a, b) {
    [a, b] = samePadic(a, b);
    const digits = Math.min(256, a.digits + valuationLower(b), b.digits + valuationLower(a));
    return padicBall(a.p, BigInt(a.residue) * BigInt(b.residue), digits);
  }
  function padicUnitDivide(a, b) {
    [a, b] = samePadic(a, b);
    if (BigInt(b.residue) % BigInt(b.p) === 0n) fail('NONUNIT_DIVISION', 'The denominator is a nonunit. A separate p-adic quotient precision model is required.');
    const digits = Math.min(a.digits, b.digits + valuationLower(a)), m = BigInt(a.p) ** BigInt(digits);
    return padicBall(a.p, BigInt(a.residue) * inverseMod(BigInt(b.residue), m), digits);
  }
  function validateValue(v) {
    if (!v || typeof v !== 'object') fail('INVALID_VALUE', 'A value must carry an explicit kind.');
    switch (v.kind) {
      case 'INTEGER': return integer(v.value);
      case 'RATIONAL': return rational(v.numerator, v.denominator);
      case 'FINITE_FIELD': return finiteField(v.p, v.residue);
      case 'PADIC_BALL': return padicBall(v.p, v.residue, v.digits);
      case 'REAL_INTERVAL': return interval(v);
      case 'COMPLEX_INTERVAL': return complexInterval(v.real, v.imaginary);
      case 'FLOAT64': return float64(v.value, v.note);
      case 'STATISTICAL_ESTIMATE': return statisticalEstimate(v);
      default: fail('UNSUPPORTED_VALUE_TYPE', `Unsupported value kind: ${String(v.kind)}`);
    }
  }
  function formatValue(v, digits = 12) {
    v = validateValue(v);
    switch (v.kind) {
      case 'INTEGER': return v.value;
      case 'RATIONAL': return v.denominator === '1' ? v.numerator : `${v.numerator}/${v.denominator}`;
      case 'FINITE_FIELD': return `${v.residue} (mod ${v.p})`;
      case 'PADIC_BALL': return `${v.residue} + O(${v.p}^${v.digits})`;
      case 'REAL_INTERVAL': return `[${formatValue(v.lower)}, ${formatValue(v.upper)}]`;
      case 'COMPLEX_INTERVAL': return `${formatValue(v.real)} + i${formatValue(v.imaginary)}`;
      case 'FLOAT64': return `${v.value.toPrecision(Math.min(17, Math.max(1, digits)))} (numerical)`;
      case 'STATISTICAL_ESTIMATE': return `${v.estimate.toPrecision(Math.min(17, Math.max(1, digits)))}; ${(100 * v.confidence).toFixed(1)}% CI [${v.interval.join(', ')}] (statistical)`;
    }
  }
  return { ValueError, asBigInt, gcd, mod, integer, rational, asRational, qAdd, qSub, qMul, qDiv, qCompare, isPrimeSmall, finiteField, finiteFieldAdd, finiteFieldMul, finiteFieldDivide, padicBall, realInterval, complexInterval, intervalAdd, intervalSub, intervalMul, intervalDiv, float64, statisticalEstimate, inverseMod, padicAdd, padicMul, padicUnitDivide, validateValue, formatValue };
}

const ops = createValueOps();
const { ValueError, asBigInt, gcd, mod, integer, rational, asRational, qAdd, qSub, qMul, qDiv, qCompare, isPrimeSmall, finiteField, finiteFieldAdd, finiteFieldMul, finiteFieldDivide, padicBall, realInterval, complexInterval, intervalAdd, intervalSub, intervalMul, intervalDiv, float64, statisticalEstimate, inverseMod, padicAdd, padicMul, padicUnitDivide, validateValue, formatValue } = ops;

function canonicalStringify(value) {
  const seen = new Set();
  let nodes = 0;
  function visit(v, depth, allowApproximate = false) {
    if (++nodes > 250000 || depth > 64) throw new ValueError('SERIALIZATION_LIMIT', 'Input exceeds the canonical JSON node/depth limit.');
    if (v === null || typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'number') {
      if (!Number.isFinite(v) || (!allowApproximate && Number.isInteger(v) && !Number.isSafeInteger(v))) throw new ValueError('NON_CANONICAL_NUMBER', 'Use decimal strings for large exact integers and reject nonfinite numbers.');
      return Object.is(v, -0) ? '0' : JSON.stringify(v);
    }
    if (typeof v !== 'object' || seen.has(v)) throw new ValueError('NON_CANONICAL_JSON', 'Canonical inputs must be acyclic JSON values; BigInt needs an INTEGER tag.');
    if (!Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) throw new ValueError('NON_CANONICAL_JSON', 'Only plain JSON objects and arrays are accepted.');
    if (Array.isArray(v)) for (let i = 0; i < v.length; i++) if (!Object.hasOwn(v, i)) throw new ValueError('NON_CANONICAL_JSON', 'Sparse arrays are not canonical JSON.');
    seen.add(v);
    const approximateField = key => (v.kind === 'FLOAT64' && key === 'value') || (v.kind === 'STATISTICAL_ESTIMATE' && ['estimate', 'standardError', 'interval'].includes(key));
    const out = Array.isArray(v) ? `[${v.map(x => visit(x, depth + 1, allowApproximate)).join(',')}]` : `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${visit(v[k], depth + 1, approximateField(k))}`).join(',')}}`;
    seen.delete(v);
    return out;
  }
  const out = visit(value, 0);
  if (out.length > 8 * 1024 * 1024) throw new ValueError('SERIALIZATION_LIMIT', 'Canonical JSON is limited to 8 MiB.');
  return out;
}

async function sha256(value) {
  if (!globalThis.crypto?.subtle) throw new ValueError('CRYPTO_UNAVAILABLE', 'WebCrypto SHA-256 requires a secure context or a supported runtime.');
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : canonicalStringify(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}

return {createValueOps,canonicalStringify,sha256,ValueError,asBigInt,gcd,mod,integer,rational,asRational,qAdd,qSub,qMul,qDiv,qCompare,isPrimeSmall,finiteField,finiteFieldAdd,finiteFieldMul,finiteFieldDivide,padicBall,realInterval,complexInterval,intervalAdd,intervalSub,intervalMul,intervalDiv,float64,statisticalEstimate,inverseMod,padicAdd,padicMul,padicUnitDivide,validateValue,formatValue};
})();
const __m0_3 = (()=>{
const { createValueOps } = __m0_2;
/* Self-contained kernel runtime. Its static function source is bundled into a Blob worker.
 * Requests select an allowlisted adapter; no request can supply executable code. */
async function kernelRuntime(message, emit = () => {}, control = { cancelled: false }, valueFactory = createValueOps) {
  const V = valueFactory();
  const request = message.request;
  const budget = request.budget;
  const started = performance.now();
  let operations = message.checkpoint?.metrics?.operations || 0;
  const elapsedBefore = message.checkpoint?.metrics?.elapsedMillis || 0;
  let state = message.checkpoint?.state ? JSON.parse(JSON.stringify(message.checkpoint.state)) : null;
  const delay = () => new Promise(resolve => setTimeout(resolve, 0));
  const error = (code, reason, details = {}) => { const e = new Error(reason); e.code = code; e.details = details; throw e; };
  function touch(n = 1) {
    operations += n;
    if (operations > (budget.maxOperations ?? 20000000)) error('BUDGET_EXCEEDED', 'The operation budget was reached. The last complete checkpoint is retained.', { resource: 'operations', used: operations, limit: budget.maxOperations ?? 20000000 });
    if (elapsedBefore + performance.now() - started > budget.maxMillis) error('BUDGET_EXCEEDED', 'The elapsed worker budget was reached. Resume with a larger bounded budget.', { resource: 'maxMillis', limit: budget.maxMillis });
  }
  const snapshot = () => ({ schema: 'MathScope.KernelCheckpoint/1', state: JSON.parse(JSON.stringify(state)), metrics: { operations, elapsedMillis: elapsedBefore + performance.now() - started } });
  const publish = progress => emit({ type: 'progress', progress, checkpoint: snapshot() });
  const exactLedger = () => ({
    rounding: { status: 'NOT_APPLICABLE', reason: 'Exact integer/rational arithmetic; no floating-point rounding in the computed values.' },
    discretization: { status: 'NOT_APPLICABLE', reason: 'The result is a finite computation on the stated input domain.' },
    tail: { status: 'NOT_APPLICABLE', reason: 'No inference outside the finite scope or infinite-series tail is made.' },
    residual: { status: 'NOT_COMPUTED', reason: 'This adapter does not compute a PDE residual or solution-error estimate.' },
    stability: { status: 'NOT_PROVIDED', reason: 'No analytic stability theorem is attached.' },
    statistical: { status: 'NOT_APPLICABLE', reason: 'The adapter is deterministic; no MCMC or sampling claim is issued.' }
  });
  function trialPrime(n) {
    if (n < 2n) return false;
    if (n === 2n) return true;
    touch(); if (n % 2n === 0n) return false;
    for (let d = 3n; d * d <= n; d += 2n) { touch(); if (n % d === 0n) return false; }
    return true;
  }
  function basePrimes(limit) {
    const flags = new Uint8Array(limit + 1), out = [];
    for (let p = 2; p <= limit; p++) {
      touch();
      if (flags[p]) continue;
      out.push(p);
      for (let j = p * p; j <= limit; j += p) { flags[j] = 1; touch(); }
    }
    return out;
  }
  function modPow(a, e, m) {
    let r = 1n; a = V.mod(a, m);
    while (e) { touch(); if (e & 1n) r = r * a % m; a = a * a % m; e >>= 1n; }
    return r;
  }
  function inputMatrix(a) {
    if (!Array.isArray(a) || a.length < 1 || a.length > 16 || !Array.isArray(a[0]) || a[0].length < 1 || a[0].length > 16 || a.some(row => !Array.isArray(row) || row.length !== a[0].length)) error('INVALID_MATRIX', 'Matrices must be nonempty rectangular arrays with at most 16 rows and 16 columns.');
    return a.map(row => row.map(x => { const s = x?.kind === 'INTEGER' ? x.value : x; const b = V.asBigInt(s); if (String(b).replace('-', '').length > 512) error('INPUT_LIMIT', 'Matrix entries are limited to 512 decimal digits.'); return b; }));
  }
  try {
    if (!budget || !Number.isFinite(budget.maxMillis) || budget.maxMillis <= 0 || !Number.isSafeInteger(budget.maxItems) || budget.maxItems <= 0 || !Number.isSafeInteger(budget.maxBytes) || budget.maxBytes < 1024) error('INVALID_BUDGET', 'A finite positive time, item and byte budget is required.');
    if (state && state.adapterId !== request.adapter.id) error('INVALID_CHECKPOINT', 'Checkpoint adapter does not match the request.');
    let values, verification, scopeKind = 'exact-finite', ledger = exactLedger(), precision = JSON.parse(JSON.stringify(request.precision));
    if (request.adapter.id === 'prime-segment') {
      const L = V.asBigInt(request.input.lower), U = V.asBigInt(request.input.upper);
      const width = U >= L ? Number(U - L + 1n) : 0;
      if (L < 0n || U < L || U > 1000000n || width > 20000) error('UNSUPPORTED', 'The local prime adapter supports 0 ≤ L ≤ U ≤ 1,000,000 with at most 20,000 integers per finite interval.');
      if (width > budget.maxItems) error('BUDGET_EXCEEDED', 'The prime interval exceeds the item budget.', { resource: 'maxItems', required: width });
      if (request.scope.primeInterval?.lower !== L.toString() || request.scope.primeInterval?.upper !== U.toString()) error('SCOPE_MISMATCH', 'The declared prime interval must equal the executed interval.');
      if (request.precision.kind !== 'EXACT') error('PRECISION_MISMATCH', 'Prime enumeration requires EXACT precision.');
      const estimated = 65536 + 64 * width + Math.floor(Math.sqrt(Number(U))) + 1;
      if (estimated > budget.maxBytes) error('BUDGET_EXCEEDED', 'The conservative prime workspace/output estimate exceeds the byte budget.', { resource: 'maxBytes', requiredAtLeast: estimated });
      state ||= { adapterId: 'prime-segment', next: L.toString(), primes: [] };
      const next = V.asBigInt(state.next);
      if (next < L || next > U + 1n || !Array.isArray(state.primes) || state.primes.length > width || !state.primes.every(x => typeof x === 'string' && /^\d+$/.test(x))) error('INVALID_CHECKPOINT', 'The prime checkpoint shape or prefix is invalid.');
      // Imported checkpoints are untrusted. Independently validate the entire completed prefix.
      let prefixIndex = 0;
      for (let n = L; n < next; n++) {
        if (trialPrime(n)) { if (state.primes[prefixIndex++] !== n.toString()) error('INVALID_CHECKPOINT', 'The checkpoint contains an incorrect prime prefix.'); }
        if ((n - L + 1n) % 128n === 0n) { if (control.cancelled) return { status: 'CANCELLED', checkpoint: snapshot() }; await delay(); }
      }
      if (prefixIndex !== state.primes.length) error('INVALID_CHECKPOINT', 'The checkpoint has extra or missing prime entries.');
      const base = basePrimes(Math.floor(Math.sqrt(Number(U))));
      while (BigInt(state.next) <= U) {
        if (control.cancelled) return { status: 'CANCELLED', checkpoint: snapshot() };
        const lo = BigInt(state.next), hi = lo + 127n < U ? lo + 127n : U;
        const flags = new Uint8Array(Number(hi - lo + 1n));
        for (const pNumber of base) {
          const p = BigInt(pNumber), p2 = p * p;
          let start = ((lo + p - 1n) / p) * p;
          if (start < p2) start = p2;
          for (let k = start; k <= hi; k += p) { flags[Number(k - lo)] = 1; touch(); }
        }
        const chunk = [];
        for (let n = lo; n <= hi; n++) {
          const sieveSaysPrime = n >= 2n && flags[Number(n - lo)] === 0;
          const independent = trialPrime(n);
          if (sieveSaysPrime !== independent) error('VERIFICATION_FAILED', 'The segmented sieve disagreed with independent trial division.', { n: n.toString() });
          if (sieveSaysPrime) chunk.push(n.toString());
        }
        state.primes.push(...chunk); state.next = (hi + 1n).toString();
        publish(Number(hi - L + 1n) / width);
        await delay();
      }
      values = { primes: state.primes.map(V.integer), count: V.integer(state.primes.length), coverage: { lower: L.toString(), upper: U.toString(), testedIntegers: String(width), completeWithinScope: true, infinitePrimeSetComplete: false } };
      verification = { status: 'PASS', generator: 'SEGMENTED_ERATOSTHENES_SIEVE', verifier: 'TRIAL_DIVISION_BY_ALL_ODD_DIVISORS_TO_SQRT', verifiedIntegers: String(width), criterion: 'Every integer in the interval receives matching prime/composite decisions.', theoremScope: 'FINITE_INTERVAL_ONLY' };
    } else if (request.adapter.id === 'padic-delta') {
      state ||= { adapterId: 'padic-delta', phase: 'READY' };
      if (control.cancelled) return { status: 'CANCELLED', checkpoint: snapshot() };
      const p = V.asBigInt(request.input.p), N = request.input.outputDigits;
      if (!V.isPrimeSmall(p) || !Number.isInteger(N) || N < 1 || N > 255) error('UNSUPPORTED', 'Canonical delta on Z_p supports prime p ≤ 1,000,000 and 1 ≤ outputDigits ≤ 255.');
      if (budget.maxItems < 3 || budget.maxBytes < (N + 1) * String(p).length * 16 + 8192) error('BUDGET_EXCEEDED', 'The p-adic digit/workspace estimate exceeds the item or byte budget.');
      if (request.scope.pAdic?.p !== p.toString() || request.scope.pAdic?.digits !== N || request.precision.kind !== 'PADIC' || request.precision.digits !== N || (request.precision.p !== undefined && request.precision.p !== p.toString())) error('SCOPE_MISMATCH', 'p, output digits, scope, and precision must agree.');
      if ((request.domain.ring !== undefined && request.domain.ring !== `Z_${p}` && request.domain.ring !== 'Z_p') || (request.domain.frobeniusLift !== undefined && request.domain.frobeniusLift !== 'identity')) error('SCOPE_MISMATCH', 'This adapter requires the declared canonical Z_p base and Frobenius lift phi = identity.');
      const a = request.input.a;
      let residue, availableDigits, autoRefined = false;
      const inputModulus = p ** BigInt(N + 1), outputModulus = p ** BigInt(N);
      if (a?.kind === 'INTEGER') { residue = V.mod(V.asBigInt(a.value), inputModulus); availableDigits = 'EXACT_INTEGER_LIFT'; autoRefined = true; }
      else if (a?.kind === 'PADIC_BALL') {
        const ball = V.padicBall(a.p, a.residue, a.digits);
        if (ball.p !== p.toString()) error('PADIC_BASE_MISMATCH', 'The p-adic input base differs from the requested prime.');
        availableDigits = ball.digits;
        if (ball.digits < N + 1) {
          if (request.input.exactLift?.kind === 'INTEGER') {
            const lift = V.asBigInt(request.input.exactLift.value), knownMod = p ** BigInt(ball.digits);
            if (V.mod(lift, knownMod).toString() !== ball.residue) error('INCONSISTENT_EXACT_LIFT', 'The supplied exact lift is not congruent to the p-adic ball.');
            residue = V.mod(lift, inputModulus); availableDigits = 'EXACT_INTEGER_LIFT'; autoRefined = true;
          } else error('PRECISION_REQUIRED', 'Canonical delta(a) = (a − a^p)/p needs one additional input p-adic digit.', { requiredInputDigits: N + 1, availableInputDigits: ball.digits, outputDigits: N, canAutoRefineWithoutSource: false });
        } else residue = V.mod(BigInt(ball.residue), inputModulus);
      } else error('INVALID_VALUE', 'delta requires an INTEGER or PADIC_BALL input.');
      touch();
      const power = modPow(residue, p, inputModulus), numerator = residue - power;
      if (numerator % p !== 0n) error('VERIFICATION_FAILED', 'The canonical delta numerator is not divisible by p.');
      const delta = V.mod(numerator / p, outputModulus);
      // Independent binomial/repeated multiplication check for the small reference primes.
      let checkPower = 1n;
      let verifier;
      if (p <= 97n) {
        for (let j = 0n; j < p; j++) { checkPower = checkPower * residue % inputModulus; touch(); }
        if (checkPower !== power) error('VERIFICATION_FAILED', 'Binary exponentiation disagreed with repeated multiplication.');
        verifier = 'REPEATED_MULTIPLICATION_AND_DIVISIBILITY';
      } else verifier = 'DIVISIBILITY_AND_RECONSTRUCTION_CONGRUENCE_ONLY';
      if (V.mod(p * delta + power - residue, inputModulus) !== 0n) error('VERIFICATION_FAILED', 'The delta reconstruction congruence failed.');
      state.phase = 'DONE'; publish(1);
      values = { delta: V.padicBall(p, delta, N), inputResidueUsed: V.padicBall(p, residue, N + 1), convention: 'Z_p with Frobenius lift phi = identity; delta(a) = (a - a^p)/p', precisionPropagation: { requiredInputDigits: N + 1, availableInputDigits: availableDigits, outputDigits: N, digitsConsumed: 1, autoRefined, exactLiftNarrowsOriginalBall: autoRefined && a.kind === 'PADIC_BALL' } };
      scopeKind = 'interval-certified';
      verification = { status: 'PASS', generator: 'BINARY_MODULAR_EXPONENTIATION', verifier, theoremScope: 'CANONICAL_ZP_DELTA_MOD_P_POWER' };
      ledger.rounding = { status: 'CERTIFIED', reason: 'Exact arithmetic in the stated quotient; p-adic uncertainty is an absolute valuation bound.', bound: { kind: 'PADIC_ABSOLUTE_PRECISION', p: p.toString(), digits: N } };
    } else if (request.adapter.id === 'rational-interval') {
      state ||= { adapterId: 'rational-interval', phase: 'READY' };
      if (control.cancelled) return { status: 'CANCELLED', checkpoint: snapshot() };
      if (request.precision.kind !== 'REAL_INTERVAL') error('PRECISION_MISMATCH', 'The interval adapter requires REAL_INTERVAL precision.');
      if (!request.scope.finite || request.scope.finite.itemCount < 6) error('SCOPE_MISMATCH', 'An interval operation requires an explicit finite scope covering its input and output endpoints.');
      const a = V.validateValue(request.input.a), b = V.validateValue(request.input.b);
      if (a.kind !== 'REAL_INTERVAL' || b.kind !== 'REAL_INTERVAL') error('INVALID_VALUE', 'Both operands must be certified rational endpoint intervals.');
      if (budget.maxItems < 6 || budget.maxBytes < 8192 + new TextEncoder().encode(JSON.stringify([a, b])).length * 8) error('BUDGET_EXCEEDED', 'The rational interval workspace estimate exceeds the item or byte budget.');
      const operationsByName = { add: V.intervalAdd, subtract: V.intervalSub, multiply: V.intervalMul, divide: V.intervalDiv };
      const operation = operationsByName[request.input.operation];
      if (!operation) error('UNSUPPORTED', 'Supported interval operations are add, subtract, multiply and divide.');
      touch(16);
      const result = operation(a, b);
      const pointOperation = { add: V.qAdd, subtract: V.qSub, multiply: V.qMul, divide: V.qDiv }[request.input.operation];
      for (const x of [a.lower, a.upper]) for (const y of [b.lower, b.upper]) {
        const corner = pointOperation(x, y);
        if (V.qCompare(result.lower, corner) > 0 || V.qCompare(corner, result.upper) > 0) error('VERIFICATION_FAILED', 'An exact endpoint value falls outside the interval result.');
      }
      state.phase = 'DONE'; publish(1);
      values = { result, operation: request.input.operation, dependencyWarning: 'Operands are treated as independent intervals. Repeated variables can widen an enclosure; no point-value equality is asserted.' };
      verification = { status: 'PASS', generator: 'EXACT_RATIONAL_INTERVAL_ARITHMETIC', verifier: 'EXACT_CORNER_ENCLOSURE_CHECK', theoremScope: 'ENCLOSURE_OF_THE_STATED_BINARY_OPERATION' };
      scopeKind = 'interval-certified';
    } else if (request.adapter.id === 'integer-matrix-product') {
      const A = inputMatrix(request.input.A), B = inputMatrix(request.input.B);
      if (A[0].length !== B.length) error('MATRIX_SHAPE_MISMATCH', 'Inner matrix dimensions do not agree.');
      if (request.precision.kind !== 'EXACT') error('PRECISION_MISMATCH', 'Integer matrix multiplication requires EXACT precision.');
      const r = A.length, k = B.length, c = B[0].length, items = r * k + k * c + r * c;
      if (items > budget.maxItems) error('BUDGET_EXCEEDED', 'The matrix entries exceed the item budget.', { required: items });
      if ((items * 1100 + 32768) > budget.maxBytes) error('BUDGET_EXCEEDED', 'The conservative exact matrix digit/workspace estimate exceeds the byte budget.');
      if (!request.scope.finite || request.scope.finite.itemCount < items) error('SCOPE_MISMATCH', 'A finite matrix scope must include both inputs and the output entry count.');
      state ||= { adapterId: 'integer-matrix-product', nextRow: 0, rows: [] };
      if (!Number.isInteger(state.nextRow) || state.nextRow < 0 || state.nextRow > r || !Array.isArray(state.rows) || state.rows.length !== state.nextRow || state.rows.some(row => !Array.isArray(row) || row.length !== c)) error('INVALID_CHECKPOINT', 'The matrix checkpoint shape is invalid.');
      // Validate any completed rows using outer-product accumulation before reuse.
      const prefixCheck = Array.from({ length: state.nextRow }, () => Array(c).fill(0n));
      for (let h = 0; h < k; h++) for (let i = 0; i < state.nextRow; i++) for (let j = 0; j < c; j++) { prefixCheck[i][j] += A[i][h] * B[h][j]; touch(); }
      for (let i = 0; i < state.nextRow; i++) for (let j = 0; j < c; j++) if (String(prefixCheck[i][j]) !== state.rows[i][j]) error('INVALID_CHECKPOINT', 'The matrix prefix certificate failed.');
      while (state.nextRow < r) {
        if (control.cancelled) return { status: 'CANCELLED', checkpoint: snapshot() };
        const i = state.nextRow, row = [];
        for (let j = 0; j < c; j++) { let sum = 0n; for (let h = 0; h < k; h++) { sum += A[i][h] * B[h][j]; touch(); } row.push(V.integer(sum).value); }
        state.rows.push(row); state.nextRow++; publish(state.nextRow / r); await delay();
      }
      const check = Array.from({ length: r }, () => Array(c).fill(0n));
      for (let h = 0; h < k; h++) for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { check[i][j] += A[i][h] * B[h][j]; touch(); }
      for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) if (String(check[i][j]) !== state.rows[i][j]) error('VERIFICATION_FAILED', 'Independent outer-product accumulation disagreed with row-dot multiplication.');
      values = { product: state.rows.map(row => row.map(V.integer)), shape: [r, c], inputShape: [[r, k], [k, c]], exactEntryCount: r * c };
      verification = { status: 'PASS', generator: 'ROW_DOT_PRODUCT', verifier: 'INDEPENDENT_OUTER_PRODUCT_ACCUMULATION', theoremScope: 'THE_EXACT_FINITE_INPUT_MATRICES' };
    } else error('UNSUPPORTED', `Unsupported adapter: ${request.adapter.id}. The local runtime does not provide a general prismatic, Sage/FLINT, Yang–Mills or Navier–Stokes solver.`);
    const output = { status: 'COMPLETED', values, verification, errorLedger: ledger, precision, scopeKind };
    const outputBytes = new TextEncoder().encode(JSON.stringify(output)).length;
    if (outputBytes > budget.maxBytes) error('BUDGET_EXCEEDED', 'The output exceeds the byte budget.', { outputBytes, limit: budget.maxBytes });
    return { ...output, checkpoint: snapshot(), outputBytes };
  } catch (e) {
    return { status: ['UNSUPPORTED', 'PRECISION_REQUIRED', 'BUDGET_EXCEEDED'].includes(e.code) ? e.code : 'FAILED', error: { code: e.code || 'KERNEL_FAILURE', message: String(e.message || e), details: e.details || {} }, checkpoint: snapshot() };
  }
}

function createKernelWorkerSource() {
  return `"use strict";\nconst createValueOps = ${createValueOps.toString()};\nconst kernelRuntime = ${kernelRuntime.toString()};\nlet control = {cancelled:false}; let busy = false;\nself.onmessage = async event => {\n const message=event.data;\n if(message.type === 'cancel'){control.cancelled=true; return;}\n if(message.type !== 'start' || busy) return;\n busy=true;control={cancelled:false};\n try { const result=await kernelRuntime(message, update=>self.postMessage(update), control,createValueOps); self.postMessage({type:'result',result}); }\n catch(error){self.postMessage({type:'result',result:{status:'FAILED',error:{code:'WORKER_FAILURE',message:String(error.message || error)}}});}\n finally {busy=false;}\n};`;
}

return {kernelRuntime,createKernelWorkerSource};
})();
const __m0_4 = (()=>{
const { validateComputeJobSpec, validateResultEnvelope } = __m0_0;
const { canonicalStringify, sha256, integer, rational, realInterval } = __m0_2;
const { kernelRuntime, createKernelWorkerSource } = __m0_3;
const COMPUTE_VERSION = '1.0.0';
const ADAPTER_VERSION = '1.0.0';
const COMPUTE_LIMITS = Object.freeze({ maxConcurrent: 2, maxJobs: 32, maxQueued: 32, maxCacheEntries: 8, maxMillis: 60000, maxBytes: 16 * 1024 * 1024, maxItems: 100000, maxOperations: 50000000, maxSerializedInputBytes: 1024 * 1024, primeUpper: '1000000', primeWidth: 20000, matrixDimension: 16, matrixEntryDigits: 512, padicDigits: 255 });
const ADAPTER_IDS = ['prime-segment', 'padic-delta', 'rational-interval', 'integer-matrix-product'];
const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'FAILED', 'UNSUPPORTED', 'PRECISION_REQUIRED', 'BUDGET_EXCEEDED']);
const clone = value => JSON.parse(canonicalStringify(value));
const byteSize = value => new TextEncoder().encode(typeof value === 'string' ? value : canonicalStringify(value)).length;

class ComputeError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'ComputeError'; this.code = code; this.details = details; }
}
function requireJob(request) {
  const encoded = canonicalStringify(request);
  if (byteSize(encoded) > COMPUTE_LIMITS.maxSerializedInputBytes) throw new ComputeError('INPUT_LIMIT', 'A compute request is limited to 1 MiB.');
  const report = validateComputeJobSpec(request);
  if (!report.ok) throw new ComputeError('INVALID_COMPUTE_JOB', 'The compute request failed its mathematical scope/precision contract.', { errors: report.errors });
  if (request.adapter.version !== ADAPTER_VERSION) throw new ComputeError('UNSUPPORTED_VERSION', `The local adapters require version ${ADAPTER_VERSION}.`);
  const b = request.budget;
  for (const key of ['maxMillis', 'maxBytes', 'maxItems', 'maxOperations']) {
    if (b[key] !== undefined && (!Number.isSafeInteger(b[key]) || b[key] < 1 || b[key] > COMPUTE_LIMITS[key])) throw new ComputeError('BUDGET_EXCEEDED', `${key} must be a positive integer no greater than ${COMPUTE_LIMITS[key]}.`, { resource: key, requested: b[key], cap: COMPUTE_LIMITS[key] });
  }
  if (b.maxBytes < 16384) throw new ComputeError('BUDGET_EXCEEDED', 'The local runtime requires at least 16 KiB for a result and its provenance metadata.');
  if (!Object.keys(request.domain).length || !Object.keys(request.basis).length) throw new ComputeError('MISSING_CONTEXT', 'The domain and basis/convention objects must explicitly identify the calculation context.');
  return report;
}
function canonicalComputeInput(request) {
  requireJob(request);
  const { modelRef, adapter, sourceRefs, assumptionRefs, scope, precision, seed, domain, basis, input } = request;
  return clone({ schema: 'MathScope.CanonicalComputeInput/1', modelRef, adapter, sourceRefs, assumptionRefs, scope, precision, seed, domain, basis, input });
}
async function computeInputHash(request) { return sha256(canonicalComputeInput(request)); }
function contentForHash(result) {
  const { environment, ...mathematicalProvenance } = result.provenance;
  return { inputHash: result.inputHash, status: result.status, scope: result.scope, precision: result.precision, values: result.values, errorLedger: result.errorLedger, provenance: mathematicalProvenance, evidence: result.evidence };
}
const emptyLedger = () => Object.fromEntries(['rounding', 'discretization', 'tail', 'residual', 'stability', 'statistical'].map(k => [k, { status: 'NOT_COMPUTED', reason: 'No completed result is available.' }]));

/** Local bounded queue. The supplied workerFactory is an application integration hook,
 * never an input parameter or a remotely supplied executable. */
function createComputeEngine(options = {}) {
  const maxConcurrent = options.maxConcurrent ?? 1;
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1 || maxConcurrent > COMPUTE_LIMITS.maxConcurrent) throw new ComputeError('INVALID_CONCURRENCY', 'Local concurrency must be 1 or 2.');
  const jobs = new Map(), cache = new Map(), queue = [], listeners = new Set(), waiters = new Map();
  let active = 0, disposed = false, workerURL = null, sequence = 0;
  const workerSource = createKernelWorkerSource();
  const canWorker = typeof options.workerFactory === 'function' || (options.preferWorker !== false && typeof Worker === 'function' && typeof Blob === 'function' && typeof URL.createObjectURL === 'function');
  const executionMode = canWorker ? (options.workerFactory ? 'APPLICATION_WORKER_FACTORY' : 'BROWSER_WEB_WORKER') : 'COOPERATIVE_LOCAL_RUNTIME';
  const ready = (async () => {
    const sourceHash = await sha256(workerSource);
    const environment = {
      schema: 'MathScope.CapabilityManifest/1', module: 'MathScope M0 Local Compute', moduleVersion: COMPUTE_VERSION,
      executionMode, isolation: canWorker ? 'SEPARATE_WORKER' : 'COOPERATIVE_EVENT_LOOP', serverAdapter: false,
      workerAvailability: canWorker ? 'API_PRESENT_STARTUP_VALIDATED_PER_JOB' : 'NO_WORKER_SELECTED',
      executionPathPolicy: 'The selected worker path must start successfully for a result. CSP/worker startup failures are explicit FAILED results; no silent server or CPU fallback occurs.',
      runtime: { language: 'ECMAScript', bigint: typeof BigInt === 'function', webCrypto: Boolean(globalThis.crypto?.subtle), userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null, nodeVersion: typeof process !== 'undefined' && process.versions?.node ? process.versions.node : null },
      limits: clone(COMPUTE_LIMITS), configuredConcurrency: maxConcurrent,
      sourceManifest: [{ id: 'mathscope-m0:static-worker-runtime', version: COMPUTE_VERSION, sha256: sourceHash, availability: 'EMBEDDED_AND_EXPORTABLE', contents: 'Fixed local kernel runtime plus exact-value implementation' }],
      adapters: [
        { id: 'prime-segment', version: ADAPTER_VERSION, status: 'AVAILABLE', arithmetic: 'BIGINT_EXACT', bounds: { lowerMin: '0', upperMax: '1000000', maxIntervalWidth: 20000 }, generator: 'segmented sieve', independentVerifier: 'trial division for every integer in the finite interval' },
        { id: 'padic-delta', version: ADAPTER_VERSION, status: 'AVAILABLE', arithmetic: 'PADIC_BALL', bounds: { pMax: '1000000', outputDigitsMin: 1, outputDigitsMax: 255 }, convention: 'Z_p, phi = identity; one extra input digit required', independentVerifier: 'repeated multiplication for p ≤ 97; reconstruction congruence for all supported p' },
        { id: 'rational-interval', version: ADAPTER_VERSION, status: 'AVAILABLE', arithmetic: 'EXACT_RATIONAL_ENDPOINT_ENCLOSURE', operations: ['add', 'subtract', 'multiply', 'divide'], limitations: 'No transcendental functions, interval quadrature, or requested-width refinement. absoluteBits is recorded as a display/work request; exact rational endpoints incur zero arithmetic rounding.' },
        { id: 'integer-matrix-product', version: ADAPTER_VERSION, status: 'AVAILABLE', arithmetic: 'BIGINT_EXACT', bounds: { maxRows: 16, maxColumns: 16, maxEntryDigits: 512 }, independentVerifier: 'outer-product accumulation, separate from row-dot generator' }
      ],
      unavailable: [
        { id: 'SageMath', status: 'NOT_CONNECTED_IN_THIS_ADAPTER' }, { id: 'FLINT/Arb', status: 'NOT_CONNECTED_IN_THIS_ADAPTER' },
        { id: 'prismatic-complex-general', status: 'UNSUPPORTED', reason: 'No general prismatic cohomology backend is provided by M0.' },
        { id: 'general-G-lattice-ensemble', status: 'UNSUPPORTED', reason: 'No general-group field or lattice sampler is provided by these four adapters.' },
        { id: 'Navier-Stokes-construction', status: 'UNSUPPORTED', reason: 'Paper-profile reconstruction and PDE solvers are later work packages.' },
        { id: 'GPU-computation', status: 'UNSUPPORTED' }, { id: 'statistical-sampler', status: 'UNSUPPORTED', reason: 'The value schema can describe estimates; no MCMC sampler is claimed.' }
      ],
      resourcePolicy: 'Inputs and output sizes have hard finite caps. Workspace estimates are conservative guards, not OS-enforced heap quotas. No GPU budget or external cloud compute is silently selected.'
    };
    return { ...environment, environmentHash: await sha256(environment) };
  })();
  const publicJob = job => clone({ id: job.id, request: job.request, status: job.status, progress: job.progress, inputHash: job.inputHash, environmentHash: job.environment.environmentHash, cacheKey: job.cacheKey, fromCache: job.fromCache, executionMode, submittedAt: job.submittedAt, startedAt: job.startedAt, finishedAt: job.finishedAt, attempt: job.attempt, checkpointAvailable: Boolean(job.checkpoint), checkpointMetrics: job.checkpoint?.metrics ?? null, result: job.result, warnings: job.warnings });
  function notify(job) {
    const view = publicJob(job);
    for (const listener of listeners) { try { listener(view); } catch { /* A UI subscriber cannot change the job. */ } }
    if (TERMINAL.has(job.status)) { for (const resolve of waiters.get(job.id) || []) resolve(view); waiters.delete(job.id); }
  }
  async function resultEnvelope(job, raw) {
    const completed = raw.status === 'COMPLETED';
    const result = {
      schema: 'MathScope.ResultEnvelope/1', jobId: job.id, inputHash: job.inputHash, environmentHash: job.environment.environmentHash,
      cacheKey: job.cacheKey, status: raw.status, scope: clone(job.request.scope), precision: clone(raw.precision || job.request.precision),
      values: completed ? clone(raw.values) : {}, errorLedger: completed ? clone(raw.errorLedger) : emptyLedger(),
      provenance: { modelRef: clone(job.request.modelRef), sourceRefs: clone(job.request.sourceRefs), assumptionRefs: clone(job.request.assumptionRefs), adapter: clone(job.request.adapter), environment: clone(job.environment), seed: job.request.seed, seedSemantics: 'RECORDED_BUT_UNUSED_BY_DETERMINISTIC_ADAPTER', domain: clone(job.request.domain), basis: clone(job.request.basis), verification: raw.verification ? clone(raw.verification) : { status: 'NOT_COMPLETED' } },
      evidence: { grade: completed ? 'CERTIFIED NUMERICAL' : 'UNKNOWN', scopeKind: completed ? raw.scopeKind : 'interface', supportsCurrent: completed, statement: completed ? 'Software-verified finite calculation or exact endpoint/valuation enclosure on the recorded input scope. This receipt is not a Lean kernel proof.' : 'No completed mathematical observation is claimed.', method: completed ? raw.verification.verifier : 'NONE', sourceRefs: clone(job.request.sourceRefs), assumptionRefs: clone(job.request.assumptionRefs), effectiveTrust: completed ? 'LOCAL_SOFTWARE_CHECKS_WITH_DECLARED_FINITE_SCOPE' : 'NONE' }
    };
    if (raw.error) { result.message = raw.error.message; result.details = { code: raw.error.code, ...raw.error.details }; }
    result.contentHash = await sha256(contentForHash(result));
    const report = validateResultEnvelope(result);
    if (!report.ok) throw new ComputeError('INVALID_RESULT_ENVELOPE', 'The generated result failed its evidence contract.', { errors: report.errors });
    return result;
  }
  async function finish(job, raw) {
    try {
      if (raw.checkpoint) job.checkpoint = clone(raw.checkpoint);
      job.result = await resultEnvelope(job, raw);
      if (raw.status === 'COMPLETED' && byteSize(job.result) > job.request.budget.maxBytes) {
        raw = { status: 'BUDGET_EXCEEDED', error: { code: 'BUDGET_EXCEEDED', message: 'The complete result with provenance exceeds the artifact byte budget.', details: { resource: 'maxBytes', required: byteSize(job.result) } } };
        job.result = await resultEnvelope(job, raw);
      }
      job.status = raw.status; job.progress = raw.status === 'COMPLETED' ? 1 : job.progress; job.finishedAt = new Date().toISOString();
      if (raw.status === 'COMPLETED') {
        cache.delete(job.cacheKey); cache.set(job.cacheKey, clone(job.result));
        while (cache.size > COMPUTE_LIMITS.maxCacheEntries) cache.delete(cache.keys().next().value);
      }
    } catch (e) {
      job.status = 'FAILED'; job.finishedAt = new Date().toISOString();
      job.result = await resultEnvelope(job, { status: 'FAILED', error: { code: e.code || 'RESULT_FAILURE', message: e.message, details: e.details || {} } });
    }
    notify(job);
  }
  function executeInWorker(job) {
    return new Promise(resolve => {
      let worker, ended = false, watchdog;
      function close(result) {
        if (ended) return; ended = true; clearTimeout(watchdog);
        worker?.terminate(); job.worker = null; resolve(result);
      }
      try {
        if (options.workerFactory) worker = options.workerFactory(workerSource);
        else { workerURL ||= URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' })); worker = new Worker(workerURL); }
        job.worker = worker;
        worker.onmessage = event => {
          if (event.data.type === 'progress') { job.progress = event.data.progress; job.checkpoint = clone(event.data.checkpoint); notify(job); }
          else if (event.data.type === 'result') close(event.data.result);
        };
        worker.onerror = event => close({ status: 'FAILED', error: { code: 'WORKER_FAILURE', message: String(event.message || 'The worker failed; check content security policy and worker support.'), details: { executionMode } }, checkpoint: job.checkpoint });
        const remaining = Math.max(1, job.request.budget.maxMillis - (job.checkpoint?.metrics?.elapsedMillis || 0));
        watchdog = setTimeout(() => close({ status: 'BUDGET_EXCEEDED', error: { code: 'BUDGET_EXCEEDED', message: 'The worker watchdog reached the elapsed time budget.', details: { resource: 'maxMillis' } }, checkpoint: job.checkpoint }), remaining + 750);
        worker.postMessage({ type: 'start', request: clone(job.request), checkpoint: job.checkpoint ? clone(job.checkpoint) : null });
        if (job.status === 'CANCEL_REQUESTED') worker.postMessage({ type: 'cancel' });
      } catch (e) { close({ status: 'FAILED', error: { code: 'WORKER_UNAVAILABLE', message: String(e.message), details: { executionMode } }, checkpoint: job.checkpoint }); }
    });
  }
  async function run(job) {
    job.status = 'RUNNING'; job.startedAt = new Date().toISOString(); job.attempt++; job.control = { cancelled: false }; notify(job);
    try {
      const raw = canWorker ? await executeInWorker(job) : await kernelRuntime({ request: clone(job.request), checkpoint: job.checkpoint ? clone(job.checkpoint) : null }, update => { job.progress = update.progress; job.checkpoint = clone(update.checkpoint); notify(job); }, job.control);
      await finish(job, raw);
    } catch (e) { await finish(job, { status: 'FAILED', error: { code: e.code || 'QUEUE_FAILURE', message: String(e.message), details: e.details || {} } }); }
    finally { active--; job.worker = null; void pump(); }
  }
  async function pump() {
    await ready;
    if (disposed) return;
    while (active < maxConcurrent && queue.length) {
      const id = queue.shift(), job = jobs.get(id);
      if (!job || job.status !== 'QUEUED') continue;
      active++; void run(job);
    }
  }
  async function submit(request, submitOptions = {}) {
    if (disposed) throw new ComputeError('ENGINE_DISPOSED', 'This compute engine was disposed.');
    const report = requireJob(request);
    // Own the immutable mathematical input before any asynchronous digest step.
    // Caller edits while SHA-256 is pending must not separate its hash from values.
    request = clone(request);
    if (jobs.has(request.id)) throw new ComputeError('DUPLICATE_JOB', 'A job with this ID already exists. Use a fresh job ID for changed mathematical inputs.');
    if (jobs.size >= COMPUTE_LIMITS.maxJobs || queue.length >= COMPUTE_LIMITS.maxQueued) throw new ComputeError('QUEUE_LIMIT', 'The retained job/queue limit was reached. Export and remove completed jobs first.');
    const environment = await ready, inputHash = await computeInputHash(request), cacheKey = await sha256({ inputHash, environmentHash: environment.environmentHash });
    if (jobs.has(request.id)) throw new ComputeError('DUPLICATE_JOB', 'A job with this ID was submitted concurrently.');
    if (jobs.size >= COMPUTE_LIMITS.maxJobs || queue.length >= COMPUTE_LIMITS.maxQueued) throw new ComputeError('QUEUE_LIMIT', 'The retained job/queue limit was reached.');
    const job = { id: request.id, request: clone(request), status: 'QUEUED', progress: 0, inputHash, cacheKey, environment, fromCache: false, submittedAt: new Date().toISOString(), startedAt: null, finishedAt: null, attempt: 0, result: null, checkpoint: null, warnings: report.warnings, worker: null, control: null };
    jobs.set(job.id, job);
    if (submitOptions.useCache !== false && cache.has(cacheKey)) {
      const cached = clone(cache.get(cacheKey));
      if (await sha256(contentForHash(cached)) !== cached.contentHash) { cache.delete(cacheKey); job.warnings.push('Corrupted cache entry discarded.'); }
      else if (byteSize(cached) <= job.request.budget.maxBytes) {
        cached.jobId = job.id; job.result = cached; job.status = 'COMPLETED'; job.progress = 1; job.fromCache = true; job.finishedAt = new Date().toISOString(); notify(job); return publicJob(job);
      }
    }
    queue.push(job.id); notify(job); void pump(); return publicJob(job);
  }
  function lookup(id) { const job = jobs.get(id); if (!job) throw new ComputeError('UNKNOWN_JOB', `Unknown compute job: ${id}`); return job; }
  function cancel(id) {
    const job = lookup(id);
    if (TERMINAL.has(job.status)) return false;
    const wasQueued = job.status === 'QUEUED';
    job.status = 'CANCEL_REQUESTED'; if (job.control) job.control.cancelled = true; job.worker?.postMessage({ type: 'cancel' }); notify(job);
    if (wasQueued) { const i = queue.indexOf(id); if (i >= 0) queue.splice(i, 1); void finish(job, { status: 'CANCELLED', checkpoint: job.checkpoint }); }
    return true;
  }
  async function resume(id, resumeOptions = {}) {
    const job = lookup(id);
    if (!['CANCELLED', 'BUDGET_EXCEEDED'].includes(job.status)) throw new ComputeError('NOT_RESUMABLE', 'Only cancelled or budget-exhausted jobs can resume. A precision change creates a new request.');
    if (disposed) throw new ComputeError('ENGINE_DISPOSED', 'This compute engine was disposed.');
    if (resumeOptions.budget) { const request = { ...job.request, budget: clone(resumeOptions.budget) }; requireJob(request); job.request = request; }
    job.status = 'QUEUED'; job.result = null; job.finishedAt = null; job.fromCache = false;
    queue.push(id); notify(job); void pump(); return publicJob(job);
  }
  async function exportCheckpoint(id) {
    const job = lookup(id);
    const payload = { schema: 'MathScope.CheckpointBundle/1', request: clone(job.request), inputHash: job.inputHash, environmentHash: job.environment.environmentHash, workerSourceHash: job.environment.sourceManifest[0].sha256, checkpoint: job.checkpoint ? clone(job.checkpoint) : null, status: job.status, progress: job.progress };
    return canonicalStringify({ ...payload, bundleHash: await sha256(payload) });
  }
  function parseBundle(text, schema) {
    if (typeof text !== 'string' || byteSize(text) > 8 * 1024 * 1024) throw new ComputeError('BUNDLE_LIMIT', 'An import must be a JSON string no larger than 8 MiB.');
    let parsed; try { parsed = JSON.parse(text); } catch { throw new ComputeError('INVALID_BUNDLE', 'The import is not valid JSON.'); }
    if (parsed.schema !== schema) throw new ComputeError('INVALID_BUNDLE', `Expected ${schema}.`);
    canonicalStringify(parsed); return parsed;
  }
  async function verifyBundleHash(bundle) { const { bundleHash, ...payload } = bundle; if (await sha256(payload) !== bundleHash) throw new ComputeError('BUNDLE_INTEGRITY', 'The exported bundle hash does not match its contents.'); return payload; }
  async function importCheckpoint(text, importOptions = {}) {
    const payload = await verifyBundleHash(parseBundle(text, 'MathScope.CheckpointBundle/1'));
    requireJob(payload.request);
    const environment = await ready;
    if (await computeInputHash(payload.request) !== payload.inputHash) throw new ComputeError('INPUT_HASH_MISMATCH', 'Checkpoint mathematical input hash mismatch.');
    if (payload.workerSourceHash !== environment.sourceManifest[0].sha256) throw new ComputeError('SOURCE_VERSION_MISMATCH', 'The checkpoint requires a different executable kernel source.');
    if (jobs.size >= COMPUTE_LIMITS.maxJobs) throw new ComputeError('QUEUE_LIMIT', 'The retained job limit was reached.');
    const request = clone(payload.request); request.id = importOptions.id || `${request.id}:import${++sequence}`;
    if (jobs.has(request.id)) throw new ComputeError('DUPLICATE_JOB', 'An imported job ID already exists.');
    requireJob(request);
    const cacheKey = await sha256({ inputHash: payload.inputHash, environmentHash: environment.environmentHash });
    const job = { id: request.id, request, status: 'CANCELLED', progress: Number.isFinite(payload.progress) ? Math.min(1, Math.max(0, payload.progress)) : 0, inputHash: payload.inputHash, cacheKey, environment, fromCache: false, submittedAt: new Date().toISOString(), startedAt: null, finishedAt: null, attempt: 0, result: null, checkpoint: payload.checkpoint ? clone(payload.checkpoint) : null, warnings: ['Imported checkpoint prefixes are reverified before reuse; an exported hash is integrity metadata, not an authenticity certificate.'], worker: null, control: null };
    if (job.checkpoint) {
      if (job.checkpoint.schema !== 'MathScope.KernelCheckpoint/1' || !job.checkpoint.metrics || !Number.isSafeInteger(job.checkpoint.metrics.operations) || job.checkpoint.metrics.operations < 0 || !Number.isFinite(job.checkpoint.metrics.elapsedMillis) || job.checkpoint.metrics.elapsedMillis < 0) throw new ComputeError('INVALID_CHECKPOINT', 'Checkpoint metrics or schema are invalid.');
    }
    jobs.set(job.id, job); notify(job); return publicJob(job);
  }
  async function exportBundle(id) {
    const job = lookup(id);
    if (!job.result) throw new ComputeError('RESULT_PENDING', 'Wait for a completed or terminal observation before exporting its bundle.');
    const payload = { schema: 'MathScope.ObservationBundle/1', request: clone(job.request), environment: clone(job.environment), checkpoint: job.checkpoint ? clone(job.checkpoint) : null, result: clone(job.result), sourceBundle: { kind: 'STATIC_ALLOWLISTED_WORKER', sha256: job.environment.sourceManifest[0].sha256, code: workerSource, executionPolicy: 'Imports never execute this text. Replay uses the installed matching source only.' }, verifierLog: [clone(job.result.provenance.verification)], sourceAvailability: clone(job.environment.sourceManifest) };
    return canonicalStringify({ ...payload, bundleHash: await sha256(payload) });
  }
  async function replayBundle(text, replayOptions = {}) {
    const payload = await verifyBundleHash(parseBundle(text, 'MathScope.ObservationBundle/1'));
    const environment = await ready;
    if (!payload.sourceBundle || payload.sourceBundle.sha256 !== await sha256(payload.sourceBundle.code) || payload.sourceBundle.sha256 !== environment.sourceManifest[0].sha256) throw new ComputeError('SOURCE_VERSION_MISMATCH', 'A matching installed allowlisted kernel source is required for replay. Uploaded code is never executed.');
    const report = await isResultFor(payload.request, payload.result);
    if (!report.ok) throw new ComputeError('RESULT_INTEGRITY', 'The source result failed its input/content/evidence checks.', { errors: report.errors });
    const request = clone(payload.request); request.id = replayOptions.id || `${request.id}:replay${++sequence}`;
    if (replayOptions.budget) request.budget = clone(replayOptions.budget);
    const submitted = await submit(request, { useCache: false }), completed = await wait(submitted.id);
    return { job: completed, comparison: { status: completed.status === 'COMPLETED' && completed.result.contentHash === payload.result.contentHash ? 'MATCH' : 'MISMATCH', mathematicalContentMatched: completed.result?.contentHash === payload.result.contentHash, originalEnvironmentHash: payload.result.environmentHash, currentEnvironmentHash: environment.environmentHash, originalGrade: payload.result.evidence.grade, importedEvidenceTrusted: false, replayUsesInstalledSources: true } };
  }
  function wait(id) { const job = lookup(id); if (TERMINAL.has(job.status)) return Promise.resolve(publicJob(job)); return new Promise(resolve => { const list = waiters.get(id) || []; list.push(resolve); waiters.set(id, list); }); }
  return {
    submit, cancel, resume, wait, exportCheckpoint, importCheckpoint, exportBundle, replayBundle,
    getJob: id => publicJob(lookup(id)), listJobs: () => [...jobs.values()].map(publicJob), capabilities: async () => clone(await ready),
    subscribe(fn) { if (typeof fn !== 'function') throw new ComputeError('INVALID_SUBSCRIBER', 'A subscriber must be a function.'); listeners.add(fn); return () => listeners.delete(fn); },
    cacheInfo: () => ({ entries: cache.size, keys: [...cache.keys()], maxEntries: COMPUTE_LIMITS.maxCacheEntries }),
    clearCache() { cache.clear(); },
    removeJob(id) { const job = lookup(id); if (!TERMINAL.has(job.status)) throw new ComputeError('JOB_ACTIVE', 'Cancel and wait for the job before removing it.'); jobs.delete(id); },
    dispose() { disposed = true; for (const job of jobs.values()) if (!TERMINAL.has(job.status)) cancel(job.id); if (workerURL) { URL.revokeObjectURL(workerURL); workerURL = null; } listeners.clear(); }
  };
}

async function isResultFor(request, result) {
  const report = validateResultEnvelope(result);
  if (!report.ok) return { ok: false, errors: report.errors };
  const expectedInput = await computeInputHash(request);
  const errors = [];
  if (expectedInput !== result.inputHash) errors.push('The result belongs to a different mathematical input, source, assumptions, precision, seed, domain, or basis.');
  for (const key of ['modelRef', 'sourceRefs', 'assumptionRefs', 'adapter', 'seed', 'domain', 'basis']) if (!Object.hasOwn(result.provenance, key) || canonicalStringify(request[key]) !== canonicalStringify(result.provenance[key])) errors.push(`Result provenance does not match request ${key}.`);
  if (canonicalStringify(request.scope) !== canonicalStringify(result.scope) || canonicalStringify(request.precision) !== canonicalStringify(result.precision)) errors.push('Result scope or precision does not match the request.');
  if (await sha256(contentForHash(result)) !== result.contentHash) errors.push('The result content hash is invalid.');
  return { ok: errors.length === 0, errors };
}

async function verifyResult(request, result) {
  const integrity = await isResultFor(request, result);
  if (!integrity.ok) return integrity;
  if (result.status !== 'COMPLETED') return { ok: false, errors: ['There is no completed result to verify.'] };
  const engine = createComputeEngine({ preferWorker: false });
  try {
    const job = await engine.submit({ ...clone(request), id: 'verification:finite-result' }, { useCache: false });
    const replayed = await engine.wait(job.id);
    return { ok: replayed.status === 'COMPLETED' && replayed.result.contentHash === result.contentHash, errors: replayed.status === 'COMPLETED' && replayed.result.contentHash === result.contentHash ? [] : ['Fresh finite recomputation did not match.'], verification: replayed.result?.provenance.verification };
  } finally { engine.dispose(); }
}

async function createExampleJob(adapterId = 'prime-segment') {
  if (!ADAPTER_IDS.includes(adapterId)) throw new ComputeError('UNSUPPORTED', `No example for ${adapterId}.`);
  const sourceHash = await sha256(createKernelWorkerSource());
  const examples = {
    'prime-segment': { scope: { kind: 'FINITE', primeInterval: { lower: '2', upper: '1000' } }, precision: { kind: 'EXACT' }, domain: { kind: 'INTEGER_INTERVAL', convention: 'both endpoints included' }, basis: { kind: 'CANONICAL_INTEGER_ORDER' }, input: { lower: '2', upper: '1000' } },
    'padic-delta': { scope: { kind: 'FINITE', pAdic: { p: '5', digits: 3 } }, precision: { kind: 'PADIC', p: '5', digits: 3, guardDigits: 1 }, domain: { ring: 'Z_5', frobeniusLift: 'identity' }, basis: { kind: 'STANDARD_RESIDUE' }, input: { p: '5', a: { kind: 'PADIC_BALL', p: '5', residue: '7', digits: 4 }, outputDigits: 3 } },
    'rational-interval': { scope: { kind: 'FINITE', finite: { description: 'One binary operation on two exact rational intervals', itemCount: 6 } }, precision: { kind: 'REAL_INTERVAL', workingBits: 64, description: 'Exact rational endpoints; zero arithmetic rounding. This does not assert an enclosure-width target.' }, domain: { operation: 'real interval multiplication', endpoints: 'exact rationals' }, basis: { kind: 'REAL_ORDER' }, input: { operation: 'multiply', a: realInterval(rational('1', '3'), rational('1', '2')), b: realInterval(rational('-2'), rational('3')) } },
    'integer-matrix-product': { scope: { kind: 'FINITE', finite: { description: 'Integer matrices D0 (5×4), D1 (3×5), D1 D0 (3×4)', itemCount: 47 } }, precision: { kind: 'EXACT' }, domain: { ring: 'Z', operation: 'D1 times D0', fixtureMeaning: 'Finite matrices from the P1 comparison design; their product being zero does not by itself certify the whole prismatic comparison.' }, basis: { kind: 'ORDERED_EXPLICIT_BASES', C0: ['1_U0', 't', '1_U1', 's'], C1: ['dt', 'ds', 't^-1', '1', 't'], C2: ['t^-2 dt', 't^-1 dt', 'dt'] }, input: { A: [[0,-1,1,0,0],[0,0,0,0,0],[-1,0,0,0,-1]].map(row => row.map(String)), B: [[0,1,0,0],[0,0,0,1],[0,0,0,1],[-1,0,1,0],[0,-1,0,0]].map(row => row.map(String)) } }
  };
  const example = examples[adapterId];
  const modelHash = await sha256({ fixture: adapterId, ...example });
  return { schema: 'MathScope.ComputeJobSpec/1', id: `m0-example:${adapterId}`, modelRef: { id: `m0-fixture:${adapterId}`, revision: '1', hash: modelHash }, adapter: { id: adapterId, version: ADAPTER_VERSION }, sourceRefs: [{ id: 'mathscope-m0:static-worker-runtime', revision: COMPUTE_VERSION, hash: sourceHash }], assumptionRefs: [], ...clone(example), seed: '0', budget: { maxMillis: 15000, maxBytes: 4 * 1024 * 1024, maxItems: 20000, maxOperations: 20000000 } };
}
async function getExampleJobs() { return Promise.all(ADAPTER_IDS.map(createExampleJob)); }

return {COMPUTE_VERSION,ADAPTER_VERSION,COMPUTE_LIMITS,ComputeError,canonicalComputeInput,computeInputHash,createComputeEngine,isResultFor,verifyResult,createExampleJob,getExampleJobs};
})();
const __m0_5 = (()=>{
// Generated after actual pinned Lean checks. Review raw evidence before updating.
// Imported browser data cannot mutate this module's release authority.
const SHIPPED_AUDIT_DIGESTS = {
  "m0-finite-d2": "2016205d34c6d44eb658a43074aaf79910c37fc0c862779dd8ea293f1d5a7dbb",
  "m0-finite-integer": "0c1c4d3b73faf9f83c1d812e09dc93b1e8dd4d78818a3ad1a9dd1542e05798ba",
  "m0-analytic-gap": "581f88ef3df935d7ac48289001c484542c3bb937c10054cb6893a92c3c0474a7",
  "m0-conditional-user-gap": "4d4456c8f32f3ca7a353a322118ae16329ee3ba747c4bb029a0a0de49e0ff355",
  "m0-comparison-gap": "ef4ae4f281a9b44e0cfab0da9cf14b100f6290622b8a64ec59958bdc0853f55b"
};
const SHIPPED_PROOF_BUNDLES = [
  {
    "schemaVersion": "mathscope.shipped-proof/1",
    "id": "m0-finite-d2",
    "label": "Finite complex · d² = 0 for every integer vector",
    "scope": "Universal v in Z^4 for the fixed D1 and D0 matrices of the D=1 Cech–de Rham fixture. No full prismatic comparison or omitted-weight claim.",
    "explanation": {
      "student": "For these two fixed integer matrices, applying the two differentials in succession gives the zero vector for every integer input. This verifies the finite chain condition.",
      "expert": "The kernel checks ∀ v : C0, d1 (d0 v) = zeroC2. Its only foundational dependency is propext. This does not prove a geometric comparison or a cohomology rank statement."
    },
    "jobSpec": {
      "claimId": "M0.FINITE.D_SQUARED_ZERO",
      "target": "MathScope.M0.Finite.differential_squared_zero",
      "requestedGrade": "EXACT_FINITE",
      "sourceFiles": [
        {
          "path": "MathScope/M0/Defs.lean",
          "content": "import Init\n\n/-!\nMathScope M0: concrete finite algebra definitions.\n\nThese integer modules are the D = 1 Cech--de Rham matrix fixture used in the\nblueprint.  This file does not identify a finite truncation with a complete\nprismatic complex.  The geometric comparison and the omitted weights require\nseparate certificates.\n-/\n\nnamespace MathScope.M0\n\nstructure C0 where\n  a : Int\n  b : Int\n  c : Int\n  d : Int\n  deriving DecidableEq, Repr\n\nstructure C1 where\n  u : Int\n  v : Int\n  w : Int\n  x : Int\n  y : Int\n  deriving DecidableEq, Repr\n\nstructure C2 where\n  a : Int\n  b : Int\n  c : Int\n  deriving DecidableEq, Repr\n\n/-- Coordinates of the actual 5 by 4 integer matrix in the blueprint. -/\ndef d0 (v : C0) : C1 :=\n  ⟨v.b, v.d, v.d, v.c - v.a, -v.b⟩\n\n/-- Coordinates of the actual 3 by 5 integer matrix in the blueprint. -/\ndef d1 (v : C1) : C2 :=\n  ⟨-v.v + v.w, 0, -v.u - v.y⟩\n\ndef zeroC2 : C2 := ⟨0, 0, 0⟩\n\n/-- The literal matrices are retained for an independently evaluated certificate. -/\ndef matrixD0 : List (List Int) :=\n  [[0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 0, 1],\n   [-1, 0, 1, 0], [0, -1, 0, 0]]\n\ndef matrixD1 : List (List Int) :=\n  [[0, -1, 1, 0, 0], [0, 0, 0, 0, 0], [-1, 0, 0, 0, -1]]\n\ndef dot (row column : List Int) : Int :=\n  (row.zipWith (fun a b => a * b) column).foldl (fun a b => a + b) 0\n\n/-- Fixed shape 3 by 5 times 5 by 4; no unbounded indexing is requested. -/\ndef matrixProduct : List (List Int) :=\n  matrixD1.map fun row =>\n    (List.range 4).map fun j => dot row (matrixD0.map fun input => input[j]!)\n\nend MathScope.M0\n",
          "sha256": "b00496552d9de1c5271fc319670902785af5a0785aa1fe31451985aa1f2bbe37"
        },
        {
          "path": "MathScope/M0/Finite.lean",
          "content": "import MathScope.M0.Defs\n\n/-!\nUniversal integer-coordinate statement for one fixed finite complex.\nNo claim about all prismatic complexes, cohomology ranks, omitted Laurent\nweights, or Frobenius follows from this single finite theorem.\n-/\n\nnamespace MathScope.M0.Finite\n\nopen MathScope.M0\n\n/-- Literal 3 by 4 product evaluated by the kernel; audit dependencies below. -/\ntheorem matrix_product_zero :\n    matrixProduct = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] := by\n  decide\n\n/-- D1 D0 = 0 for every vector in Z^4, for the specified matrices. -/\ntheorem differential_squared_zero (v : C0) : d1 (d0 v) = zeroC2 := by\n  change C2.mk (-v.d + v.d) 0 (-v.b - -v.b) = C2.mk 0 0 0\n  rw [Int.add_left_neg, Int.sub_self]\n\n/-- Exact integer fixture, including negative and large coordinates. -/\ntheorem integer_fixture :\n    d1 (d0 ⟨-7, 9007199254740993, 11, -13⟩) = zeroC2 := by\n  decide\n\nset_option pp.fullNames true\n\n#check matrix_product_zero\n#print axioms matrix_product_zero\n#check differential_squared_zero\n#print axioms differential_squared_zero\n#check integer_fixture\n#print axioms integer_fixture\n\nend MathScope.M0.Finite\n",
          "sha256": "07b6309d8b638c13924c63ce3c0d4a4b2023211e56ec68c95210ffdcf88b5713"
        }
      ],
      "assumptions": [],
      "dependencyGraph": {
        "nodes": [
          {
            "id": "M0.FINITE.D_SQUARED_ZERO",
            "kind": "theorem",
            "statement": "MathScope.M0.Finite.differential_squared_zero (v : MathScope.M0.C0) :\n  MathScope.M0.d1 (MathScope.M0.d0 v) = MathScope.M0.zeroC2"
          }
        ],
        "edges": []
      },
      "context": {
        "modelId": "p1-cech-de-rham-D1-integer-complex",
        "domain": "Z^4",
        "truncationD": 1,
        "inputShape": [
          5,
          4
        ],
        "outputShape": [
          3,
          5
        ]
      },
      "environment": {
        "leanVersion": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)",
        "leanCommit": "5045d0056413266e57c625dcd7c365b10e377c52",
        "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612",
        "mathlibLakeManifestSha256": "8f67b2cf24143ac091cdb425e886c2164b2fc2d6fbccd6db9454b697f9541a67",
        "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13",
        "driverSha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa",
        "driverSourceSha256": "dbcada6e01a624daf70f53689fc95fa71b1a53c3e0279d2c2157c11c1e62e78e",
        "importClosureDigest": "77ae522db918211a75ca552740d37573830858450c2bd20061e9c01d3715f577",
        "importManifestSha256": "b596afdb954f29f3b327eca57e8fafe0ba141fe5fc1abb8c988a35d3d937a4b4",
        "importModuleCount": 2258,
        "unresolvedImportCount": 0,
        "kernelModified": false,
        "runtimeModified": false,
        "verifierGuardModified": false,
        "frontend": "official shared-library frontend with explicit installation root"
      }
    },
    "audit": {
      "schemaVersion": "mathscope.lean-audit/1",
      "checkedAt": "2026-10-09T12:05:54.113613+00:00",
      "target": "MathScope.M0.Finite.differential_squared_zero",
      "targetType": "MathScope.M0.Finite.differential_squared_zero (v : MathScope.M0.C0) :\n  MathScope.M0.d1 (MathScope.M0.d0 v) = MathScope.M0.zeroC2",
      "axioms": {
        "all": [
          "propext"
        ],
        "standard": [
          "propext"
        ],
        "custom": []
      },
      "compileExitCode": 0,
      "sorry": false,
      "warnings": [],
      "elapsedSeconds": 0.256243,
      "environmentDigest": "75b1093cfdc55f91f4d23ea844acb2678fb600d11afb89133417c14e8a6e7721",
      "moduleBuilds": [
        {
          "module": "MathScope.M0.Defs",
          "sourceFile": "MathScope/M0/Defs.lean",
          "sourceSha256": "b00496552d9de1c5271fc319670902785af5a0785aa1fe31451985aa1f2bbe37",
          "exitCode": 0,
          "logFile": "lean-defs-audit.txt",
          "logSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "outputOleanSha256": "678574633fa396804fc3f98751d460a7051810f28098c610db4a8b219026a371"
        },
        {
          "module": "MathScope.M0.Finite",
          "sourceFile": "MathScope/M0/Finite.lean",
          "sourceSha256": "07b6309d8b638c13924c63ce3c0d4a4b2023211e56ec68c95210ffdcf88b5713",
          "exitCode": 0,
          "logFile": "lean-finite-audit.txt",
          "logSha256": "72fca58e1260d3418a194d3322ba18cdc9df903a4b1eba45453ff2c8c4890935",
          "outputOleanSha256": "5c23ec5f12afebae9ec10754d27bce512d0b63f70f4dcf64984c059717b6c8c2"
        }
      ],
      "targetModuleLog": "MathScope.M0.Finite.matrix_product_zero : MathScope.M0.matrixProduct = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]\n'MathScope.M0.Finite.matrix_product_zero' depends on axioms: [propext]\nMathScope.M0.Finite.differential_squared_zero (v : MathScope.M0.C0) :\n  MathScope.M0.d1 (MathScope.M0.d0 v) = MathScope.M0.zeroC2\n'MathScope.M0.Finite.differential_squared_zero' depends on axioms: [propext]\nMathScope.M0.Finite.integer_fixture :\n  MathScope.M0.d1 (MathScope.M0.d0 { a := -7, b := 9007199254740993, c := 11, d := -13 }) = MathScope.M0.zeroC2\n'MathScope.M0.Finite.integer_fixture' does not depend on any axioms\n",
      "negativeControls": [
        {
          "name": "NegativeFalse",
          "sourceFile": "NegativeFalse.lean",
          "sourceSha256": "bb8c5d5918222e9b4d279b6e41df5059171fb75ecca29b8c1f367d396ba5f261",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativefalse-audit.txt",
          "logSha256": "7cdcd37943712cee8cdf758bb022f59b662172bf2e9819758aec45781dce1592"
        },
        {
          "name": "NegativeMatrix",
          "sourceFile": "NegativeMatrix.lean",
          "sourceSha256": "1ce60aeb2856a9bbd80e2deaf6b0a2e84f61a5b0adf8a7b661fb6dcdb90b4c9b",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativematrix-audit.txt",
          "logSha256": "2d1e52c5f095cad04e2fb1c8a8596ce23479c189d08ba56b100bf070dfbb28b8"
        }
      ],
      "fullEnvironmentEvidence": "evidence/lean-environment.json",
      "fullValidationEvidence": "evidence/lean-validation.json",
      "compilerTrust": "Official Lean shared library and normal kernel; installation path explicitly supplied; unchanged kernel/runtime/guards."
    }
  },
  {
    "schemaVersion": "mathscope.shipped-proof/1",
    "id": "m0-finite-integer",
    "label": "Exact integer fixture · no axiom dependencies",
    "scope": "One exact integer vector (-7, 9007199254740993, 11, -13) under the specified finite differentials. This is a concrete fixture, not a universal theorem.",
    "explanation": {
      "student": "This exact calculation includes an integer beyond JavaScript's safe Number range. Lean computes the result without rounding.",
      "expert": "The theorem integer_fixture is kernel-evaluated, and #print axioms returns no dependencies. Its quantifier scope is the single displayed vector."
    },
    "jobSpec": {
      "claimId": "M0.FINITE.INTEGER_FIXTURE",
      "target": "MathScope.M0.Finite.integer_fixture",
      "requestedGrade": "EXACT_FINITE",
      "sourceFiles": [
        {
          "path": "MathScope/M0/Defs.lean",
          "content": "import Init\n\n/-!\nMathScope M0: concrete finite algebra definitions.\n\nThese integer modules are the D = 1 Cech--de Rham matrix fixture used in the\nblueprint.  This file does not identify a finite truncation with a complete\nprismatic complex.  The geometric comparison and the omitted weights require\nseparate certificates.\n-/\n\nnamespace MathScope.M0\n\nstructure C0 where\n  a : Int\n  b : Int\n  c : Int\n  d : Int\n  deriving DecidableEq, Repr\n\nstructure C1 where\n  u : Int\n  v : Int\n  w : Int\n  x : Int\n  y : Int\n  deriving DecidableEq, Repr\n\nstructure C2 where\n  a : Int\n  b : Int\n  c : Int\n  deriving DecidableEq, Repr\n\n/-- Coordinates of the actual 5 by 4 integer matrix in the blueprint. -/\ndef d0 (v : C0) : C1 :=\n  ⟨v.b, v.d, v.d, v.c - v.a, -v.b⟩\n\n/-- Coordinates of the actual 3 by 5 integer matrix in the blueprint. -/\ndef d1 (v : C1) : C2 :=\n  ⟨-v.v + v.w, 0, -v.u - v.y⟩\n\ndef zeroC2 : C2 := ⟨0, 0, 0⟩\n\n/-- The literal matrices are retained for an independently evaluated certificate. -/\ndef matrixD0 : List (List Int) :=\n  [[0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 0, 1],\n   [-1, 0, 1, 0], [0, -1, 0, 0]]\n\ndef matrixD1 : List (List Int) :=\n  [[0, -1, 1, 0, 0], [0, 0, 0, 0, 0], [-1, 0, 0, 0, -1]]\n\ndef dot (row column : List Int) : Int :=\n  (row.zipWith (fun a b => a * b) column).foldl (fun a b => a + b) 0\n\n/-- Fixed shape 3 by 5 times 5 by 4; no unbounded indexing is requested. -/\ndef matrixProduct : List (List Int) :=\n  matrixD1.map fun row =>\n    (List.range 4).map fun j => dot row (matrixD0.map fun input => input[j]!)\n\nend MathScope.M0\n",
          "sha256": "b00496552d9de1c5271fc319670902785af5a0785aa1fe31451985aa1f2bbe37"
        },
        {
          "path": "MathScope/M0/Finite.lean",
          "content": "import MathScope.M0.Defs\n\n/-!\nUniversal integer-coordinate statement for one fixed finite complex.\nNo claim about all prismatic complexes, cohomology ranks, omitted Laurent\nweights, or Frobenius follows from this single finite theorem.\n-/\n\nnamespace MathScope.M0.Finite\n\nopen MathScope.M0\n\n/-- Literal 3 by 4 product evaluated by the kernel; audit dependencies below. -/\ntheorem matrix_product_zero :\n    matrixProduct = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] := by\n  decide\n\n/-- D1 D0 = 0 for every vector in Z^4, for the specified matrices. -/\ntheorem differential_squared_zero (v : C0) : d1 (d0 v) = zeroC2 := by\n  change C2.mk (-v.d + v.d) 0 (-v.b - -v.b) = C2.mk 0 0 0\n  rw [Int.add_left_neg, Int.sub_self]\n\n/-- Exact integer fixture, including negative and large coordinates. -/\ntheorem integer_fixture :\n    d1 (d0 ⟨-7, 9007199254740993, 11, -13⟩) = zeroC2 := by\n  decide\n\nset_option pp.fullNames true\n\n#check matrix_product_zero\n#print axioms matrix_product_zero\n#check differential_squared_zero\n#print axioms differential_squared_zero\n#check integer_fixture\n#print axioms integer_fixture\n\nend MathScope.M0.Finite\n",
          "sha256": "07b6309d8b638c13924c63ce3c0d4a4b2023211e56ec68c95210ffdcf88b5713"
        }
      ],
      "assumptions": [],
      "dependencyGraph": {
        "nodes": [
          {
            "id": "M0.FINITE.INTEGER_FIXTURE",
            "kind": "theorem",
            "statement": "MathScope.M0.Finite.integer_fixture :\n  MathScope.M0.d1 (MathScope.M0.d0 { a := -7, b := 9007199254740993, c := 11, d := -13 }) = MathScope.M0.zeroC2"
          }
        ],
        "edges": []
      },
      "context": {
        "modelId": "p1-cech-de-rham-D1-integer-fixture",
        "input": [
          "-7",
          "9007199254740993",
          "11",
          "-13"
        ],
        "numericType": "Int"
      },
      "environment": {
        "leanVersion": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)",
        "leanCommit": "5045d0056413266e57c625dcd7c365b10e377c52",
        "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612",
        "mathlibLakeManifestSha256": "8f67b2cf24143ac091cdb425e886c2164b2fc2d6fbccd6db9454b697f9541a67",
        "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13",
        "driverSha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa",
        "driverSourceSha256": "dbcada6e01a624daf70f53689fc95fa71b1a53c3e0279d2c2157c11c1e62e78e",
        "importClosureDigest": "77ae522db918211a75ca552740d37573830858450c2bd20061e9c01d3715f577",
        "importManifestSha256": "b596afdb954f29f3b327eca57e8fafe0ba141fe5fc1abb8c988a35d3d937a4b4",
        "importModuleCount": 2258,
        "unresolvedImportCount": 0,
        "kernelModified": false,
        "runtimeModified": false,
        "verifierGuardModified": false,
        "frontend": "official shared-library frontend with explicit installation root"
      }
    },
    "audit": {
      "schemaVersion": "mathscope.lean-audit/1",
      "checkedAt": "2026-10-09T12:05:54.113613+00:00",
      "target": "MathScope.M0.Finite.integer_fixture",
      "targetType": "MathScope.M0.Finite.integer_fixture :\n  MathScope.M0.d1 (MathScope.M0.d0 { a := -7, b := 9007199254740993, c := 11, d := -13 }) = MathScope.M0.zeroC2",
      "axioms": {
        "all": [],
        "standard": [],
        "custom": []
      },
      "compileExitCode": 0,
      "sorry": false,
      "warnings": [],
      "elapsedSeconds": 0.256243,
      "environmentDigest": "75b1093cfdc55f91f4d23ea844acb2678fb600d11afb89133417c14e8a6e7721",
      "moduleBuilds": [
        {
          "module": "MathScope.M0.Defs",
          "sourceFile": "MathScope/M0/Defs.lean",
          "sourceSha256": "b00496552d9de1c5271fc319670902785af5a0785aa1fe31451985aa1f2bbe37",
          "exitCode": 0,
          "logFile": "lean-defs-audit.txt",
          "logSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "outputOleanSha256": "678574633fa396804fc3f98751d460a7051810f28098c610db4a8b219026a371"
        },
        {
          "module": "MathScope.M0.Finite",
          "sourceFile": "MathScope/M0/Finite.lean",
          "sourceSha256": "07b6309d8b638c13924c63ce3c0d4a4b2023211e56ec68c95210ffdcf88b5713",
          "exitCode": 0,
          "logFile": "lean-finite-audit.txt",
          "logSha256": "72fca58e1260d3418a194d3322ba18cdc9df903a4b1eba45453ff2c8c4890935",
          "outputOleanSha256": "5c23ec5f12afebae9ec10754d27bce512d0b63f70f4dcf64984c059717b6c8c2"
        }
      ],
      "targetModuleLog": "MathScope.M0.Finite.matrix_product_zero : MathScope.M0.matrixProduct = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]\n'MathScope.M0.Finite.matrix_product_zero' depends on axioms: [propext]\nMathScope.M0.Finite.differential_squared_zero (v : MathScope.M0.C0) :\n  MathScope.M0.d1 (MathScope.M0.d0 v) = MathScope.M0.zeroC2\n'MathScope.M0.Finite.differential_squared_zero' depends on axioms: [propext]\nMathScope.M0.Finite.integer_fixture :\n  MathScope.M0.d1 (MathScope.M0.d0 { a := -7, b := 9007199254740993, c := 11, d := -13 }) = MathScope.M0.zeroC2\n'MathScope.M0.Finite.integer_fixture' does not depend on any axioms\n",
      "negativeControls": [
        {
          "name": "NegativeFalse",
          "sourceFile": "NegativeFalse.lean",
          "sourceSha256": "bb8c5d5918222e9b4d279b6e41df5059171fb75ecca29b8c1f367d396ba5f261",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativefalse-audit.txt",
          "logSha256": "7cdcd37943712cee8cdf758bb022f59b662172bf2e9819758aec45781dce1592"
        },
        {
          "name": "NegativeMatrix",
          "sourceFile": "NegativeMatrix.lean",
          "sourceSha256": "1ce60aeb2856a9bbd80e2deaf6b0a2e84f61a5b0adf8a7b661fb6dcdb90b4c9b",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativematrix-audit.txt",
          "logSha256": "2d1e52c5f095cad04e2fb1c8a8596ce23479c189d08ba56b100bf070dfbb28b8"
        }
      ],
      "fullEnvironmentEvidence": "evidence/lean-environment.json",
      "fullValidationEvidence": "evidence/lean-validation.json",
      "compilerTrust": "Official Lean shared library and normal kernel; installation path explicitly supplied; unchanged kernel/runtime/guards."
    }
  },
  {
    "schemaVersion": "mathscope.shipped-proof/1",
    "id": "m0-analytic-gap",
    "label": "Real spectral implication · explicit gap hypothesis",
    "scope": "For any subset of real energies and a supplied GapAt hypothesis in one fixed energy unit, no positive energy below the bound belongs to that set. No self-adjoint operator, semigroup, QFT or continuum construction is provided.",
    "explanation": {
      "student": "If a positive gap has already been established or supplied as a hypothesis, this theorem rules out energies between zero and that gap. The theorem does not establish the gap itself.",
      "expert": "The real-valued universal implication retains hGap in its full Lean type. Only propext, Classical.choice and Quot.sound are used; there is no custom axiom. No limiting or differentiability operation is formalized."
    },
    "jobSpec": {
      "claimId": "M0.ANALYTIC.GAP_EXCLUSION",
      "target": "MathScope.M0.Analytic.gap_excludes_interval",
      "requestedGrade": "CONDITIONAL_FORMAL",
      "sourceFiles": [
        {
          "path": "MathScope/M0/Analytic.lean",
          "content": "import Mathlib.Basic.Real.Basic\n\n/-!\nConditional real spectral statements.\n\n`GapAt` is a predicate on a set of real numbers in one fixed energy unit.\nIts arguments and hypotheses are explicit; this is not a construction of a\nHilbert space, a self-adjoint Hamiltonian, a quantum field theory, or a\ncontinuum limit.  No interchange of limits, sums or derivatives is used.\n-/\n\nnamespace MathScope.M0.Analytic\n\n/-- A positive lower bound on every positive member of a real spectrum. -/\ndef GapAt (spectrum : Set ℝ) (delta : ℝ) : Prop :=\n  0 < delta ∧ ∀ energy ∈ spectrum, 0 < energy → delta ≤ energy\n\n/-- A supplied gap excludes all positive energies strictly below it. -/\ntheorem gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n    (hGap : GapAt spectrum delta) :\n    ∀ energy, 0 < energy → energy < delta → energy ∉ spectrum := by\n  intro energy hPositive hBelow hMember\n  exact (not_lt_of_ge (hGap.2 energy hMember hPositive)) hBelow\n\n/-- The same spectrum retains every smaller positive certified lower bound. -/\ntheorem smaller_positive_gap (spectrum : Set ℝ) (delta epsilon : ℝ)\n    (hGap : GapAt spectrum delta) (hPositive : 0 < epsilon)\n    (hSmaller : epsilon ≤ delta) : GapAt spectrum epsilon := by\n  refine ⟨hPositive, ?_⟩\n  intro energy hMember hEnergy\n  exact le_trans hSmaller (hGap.2 energy hMember hEnergy)\n\n/-- An observed superset is sufficient; an arbitrary channel subset is not. -/\ntheorem gap_transfer (original observed : Set ℝ) (delta : ℝ)\n    (hObserved : GapAt observed delta) (hInclusion : original ⊆ observed) :\n    GapAt original delta := by\n  refine ⟨hObserved.1, ?_⟩\n  intro energy hOriginal hPositive\n  exact hObserved.2 energy (hInclusion hOriginal) hPositive\n\nset_option pp.fullNames true\n\n#check gap_excludes_interval\n#print axioms gap_excludes_interval\n#check smaller_positive_gap\n#print axioms smaller_positive_gap\n#check gap_transfer\n#print axioms gap_transfer\n\nend MathScope.M0.Analytic\n",
          "sha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313"
        }
      ],
      "assumptions": [
        {
          "id": "M0.HYP.GAP_AT",
          "kind": "HYPOTHESIS",
          "statement": "hGap : GapAt spectrum delta; equivalently 0 < delta and every positive energy in spectrum is at least delta.",
          "source": "MathScope/M0/Analytic.lean",
          "status": "EXPLICIT_PARAMETER"
        }
      ],
      "dependencyGraph": {
        "nodes": [
          {
            "id": "M0.ANALYTIC.GAP_EXCLUSION",
            "kind": "theorem",
            "statement": "MathScope.M0.Analytic.gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n  (hGap : MathScope.M0.Analytic.GapAt spectrum delta) (energy : ℝ) : 0 < energy → energy < delta → energy ∉ spectrum"
          },
          {
            "id": "M0.HYP.GAP_AT",
            "kind": "hypothesis",
            "statement": "hGap : GapAt spectrum delta; equivalently 0 < delta and every positive energy in spectrum is at least delta."
          }
        ],
        "edges": [
          {
            "from": "M0.ANALYTIC.GAP_EXCLUSION",
            "to": "M0.HYP.GAP_AT",
            "type": "DEPENDS_ON"
          }
        ]
      },
      "context": {
        "modelId": "real-spectral-set-interface",
        "energyDomain": "mathlib Real",
        "variables": [
          "spectrum : Set Real",
          "delta : Real"
        ],
        "energyUnit": "fixed shared energy unit"
      },
      "environment": {
        "leanVersion": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)",
        "leanCommit": "5045d0056413266e57c625dcd7c365b10e377c52",
        "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612",
        "mathlibLakeManifestSha256": "8f67b2cf24143ac091cdb425e886c2164b2fc2d6fbccd6db9454b697f9541a67",
        "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13",
        "driverSha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa",
        "driverSourceSha256": "dbcada6e01a624daf70f53689fc95fa71b1a53c3e0279d2c2157c11c1e62e78e",
        "importClosureDigest": "77ae522db918211a75ca552740d37573830858450c2bd20061e9c01d3715f577",
        "importManifestSha256": "b596afdb954f29f3b327eca57e8fafe0ba141fe5fc1abb8c988a35d3d937a4b4",
        "importModuleCount": 2258,
        "unresolvedImportCount": 0,
        "kernelModified": false,
        "runtimeModified": false,
        "verifierGuardModified": false,
        "frontend": "official shared-library frontend with explicit installation root"
      }
    },
    "audit": {
      "schemaVersion": "mathscope.lean-audit/1",
      "checkedAt": "2026-10-09T12:05:54.113613+00:00",
      "target": "MathScope.M0.Analytic.gap_excludes_interval",
      "targetType": "MathScope.M0.Analytic.gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n  (hGap : MathScope.M0.Analytic.GapAt spectrum delta) (energy : ℝ) : 0 < energy → energy < delta → energy ∉ spectrum",
      "axioms": {
        "all": [
          "propext",
          "Classical.choice",
          "Quot.sound"
        ],
        "standard": [
          "propext",
          "Classical.choice",
          "Quot.sound"
        ],
        "custom": []
      },
      "compileExitCode": 0,
      "sorry": false,
      "warnings": [],
      "elapsedSeconds": 0.950517,
      "environmentDigest": "75b1093cfdc55f91f4d23ea844acb2678fb600d11afb89133417c14e8a6e7721",
      "moduleBuilds": [
        {
          "module": "MathScope.M0.Analytic",
          "sourceFile": "MathScope/M0/Analytic.lean",
          "sourceSha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313",
          "exitCode": 0,
          "logFile": "lean-analytic-audit.txt",
          "logSha256": "be64cfe388ea601349c533fc59596334cb470379ff467860a1d98c0017958292",
          "outputOleanSha256": "c3088e9d3cc88b97b031a6fde2635ed08d9c657a4b2a532ffa5224f98c5013ce"
        }
      ],
      "targetModuleLog": "MathScope.M0.Analytic.gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n  (hGap : MathScope.M0.Analytic.GapAt spectrum delta) (energy : ℝ) : 0 < energy → energy < delta → energy ∉ spectrum\n'MathScope.M0.Analytic.gap_excludes_interval' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.M0.Analytic.smaller_positive_gap (spectrum : Set ℝ) (delta epsilon : ℝ)\n  (hGap : MathScope.M0.Analytic.GapAt spectrum delta) (hPositive : 0 < epsilon) (hSmaller : epsilon ≤ delta) :\n  MathScope.M0.Analytic.GapAt spectrum epsilon\n'MathScope.M0.Analytic.smaller_positive_gap' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.M0.Analytic.gap_transfer (original observed : Set ℝ) (delta : ℝ)\n  (hObserved : MathScope.M0.Analytic.GapAt observed delta) (hInclusion : original ⊆ observed) :\n  MathScope.M0.Analytic.GapAt original delta\n'MathScope.M0.Analytic.gap_transfer' depends on axioms: [propext, Classical.choice, Quot.sound]\n",
      "negativeControls": [
        {
          "name": "NegativeFalse",
          "sourceFile": "NegativeFalse.lean",
          "sourceSha256": "bb8c5d5918222e9b4d279b6e41df5059171fb75ecca29b8c1f367d396ba5f261",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativefalse-audit.txt",
          "logSha256": "7cdcd37943712cee8cdf758bb022f59b662172bf2e9819758aec45781dce1592"
        },
        {
          "name": "NegativeMatrix",
          "sourceFile": "NegativeMatrix.lean",
          "sourceSha256": "1ce60aeb2856a9bbd80e2deaf6b0a2e84f61a5b0adf8a7b661fb6dcdb90b4c9b",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativematrix-audit.txt",
          "logSha256": "2d1e52c5f095cad04e2fb1c8a8596ce23479c189d08ba56b100bf070dfbb28b8"
        }
      ],
      "fullEnvironmentEvidence": "evidence/lean-environment.json",
      "fullValidationEvidence": "evidence/lean-validation.json",
      "compilerTrust": "Official Lean shared library and normal kernel; installation path explicitly supplied; unchanged kernel/runtime/guards."
    }
  },
  {
    "schemaVersion": "mathscope.shipped-proof/1",
    "id": "m0-conditional-user-gap",
    "label": "User-assumed Δ = 1 · conditional corollary",
    "scope": "Consequence of two named custom axioms about one uninterpreted real spectrum and a gap at 1. It does not identify this spectrum with any Yang–Mills Hamiltonian.",
    "explanation": {
      "student": "The gap at 1 is deliberately assumed. Lean verifies its consequence and keeps the names of both assumptions visible. Changing that assumption requires a different audit.",
      "expert": "#print axioms includes MathScope.M0.Conditional.selectedSpectrum and MathScope.M0.Conditional.userAssumedGapAtOne in addition to the three standard dependencies. The selected set is an interface, not a quantum construction."
    },
    "jobSpec": {
      "claimId": "M0.CONDITIONAL.SELECTED_GAP",
      "target": "MathScope.M0.Conditional.selected_gap_excludes_interval",
      "requestedGrade": "CONDITIONAL_FORMAL",
      "sourceFiles": [
        {
          "path": "MathScope/M0/Analytic.lean",
          "content": "import Mathlib.Basic.Real.Basic\n\n/-!\nConditional real spectral statements.\n\n`GapAt` is a predicate on a set of real numbers in one fixed energy unit.\nIts arguments and hypotheses are explicit; this is not a construction of a\nHilbert space, a self-adjoint Hamiltonian, a quantum field theory, or a\ncontinuum limit.  No interchange of limits, sums or derivatives is used.\n-/\n\nnamespace MathScope.M0.Analytic\n\n/-- A positive lower bound on every positive member of a real spectrum. -/\ndef GapAt (spectrum : Set ℝ) (delta : ℝ) : Prop :=\n  0 < delta ∧ ∀ energy ∈ spectrum, 0 < energy → delta ≤ energy\n\n/-- A supplied gap excludes all positive energies strictly below it. -/\ntheorem gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n    (hGap : GapAt spectrum delta) :\n    ∀ energy, 0 < energy → energy < delta → energy ∉ spectrum := by\n  intro energy hPositive hBelow hMember\n  exact (not_lt_of_ge (hGap.2 energy hMember hPositive)) hBelow\n\n/-- The same spectrum retains every smaller positive certified lower bound. -/\ntheorem smaller_positive_gap (spectrum : Set ℝ) (delta epsilon : ℝ)\n    (hGap : GapAt spectrum delta) (hPositive : 0 < epsilon)\n    (hSmaller : epsilon ≤ delta) : GapAt spectrum epsilon := by\n  refine ⟨hPositive, ?_⟩\n  intro energy hMember hEnergy\n  exact le_trans hSmaller (hGap.2 energy hMember hEnergy)\n\n/-- An observed superset is sufficient; an arbitrary channel subset is not. -/\ntheorem gap_transfer (original observed : Set ℝ) (delta : ℝ)\n    (hObserved : GapAt observed delta) (hInclusion : original ⊆ observed) :\n    GapAt original delta := by\n  refine ⟨hObserved.1, ?_⟩\n  intro energy hOriginal hPositive\n  exact hObserved.2 energy (hInclusion hOriginal) hPositive\n\nset_option pp.fullNames true\n\n#check gap_excludes_interval\n#print axioms gap_excludes_interval\n#check smaller_positive_gap\n#print axioms smaller_positive_gap\n#check gap_transfer\n#print axioms gap_transfer\n\nend MathScope.M0.Analytic\n",
          "sha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313"
        },
        {
          "path": "MathScope/M0/Conditional.lean",
          "content": "import MathScope.M0.Analytic\n\n/-!\nExplicit USER_AXIOM demonstration, deliberately isolated from Finite and\nAnalytic import paths.  The selected spectrum is an uninterpreted object.\nIt is not defined to be the spectrum of a quantum Yang--Mills Hamiltonian.\nThe selected bound is 1 in a fixed, declared energy unit; the source changes\nwhen that assumption changes.\n-/\n\nnamespace MathScope.M0.Conditional\n\nopen MathScope.M0.Analytic\n\naxiom selectedSpectrum : Set ℝ\n\naxiom userAssumedGapAtOne : GapAt selectedSpectrum 1\n\n/-- Conditional consequence, with both custom dependencies printed below. -/\ntheorem selected_gap_excludes_interval :\n    ∀ energy, 0 < energy → energy < (1 : ℝ) → energy ∉ selectedSpectrum :=\n  gap_excludes_interval selectedSpectrum 1 userAssumedGapAtOne\n\nset_option pp.fullNames true\n\n#check selectedSpectrum\n#check userAssumedGapAtOne\n#check selected_gap_excludes_interval\n#print axioms selected_gap_excludes_interval\n\nend MathScope.M0.Conditional\n",
          "sha256": "79c3fd19000b46cecb1181dfb89a16d81b49735446fa7cafaf82a0434d51c917"
        }
      ],
      "assumptions": [
        {
          "id": "M0.AXIOM.SELECTED_SPECTRUM",
          "kind": "USER_AXIOM",
          "declaration": "MathScope.M0.Conditional.selectedSpectrum",
          "statement": "selectedSpectrum : Set Real (uninterpreted spectrum object)",
          "source": "MathScope/M0/Conditional.lean",
          "status": "ASSUMED"
        },
        {
          "id": "M0.AXIOM.GAP_ONE",
          "kind": "USER_AXIOM",
          "declaration": "MathScope.M0.Conditional.userAssumedGapAtOne",
          "statement": "userAssumedGapAtOne : GapAt selectedSpectrum 1",
          "source": "MathScope/M0/Conditional.lean",
          "status": "ASSUMED"
        }
      ],
      "dependencyGraph": {
        "nodes": [
          {
            "id": "M0.CONDITIONAL.SELECTED_GAP",
            "kind": "theorem",
            "statement": "MathScope.M0.Conditional.selected_gap_excludes_interval (energy : ℝ) :\n  0 < energy → energy < 1 → energy ∉ MathScope.M0.Conditional.selectedSpectrum"
          },
          {
            "id": "M0.AXIOM.SELECTED_SPECTRUM",
            "kind": "user_axiom",
            "statement": "selectedSpectrum : Set Real (uninterpreted spectrum object)"
          },
          {
            "id": "M0.AXIOM.GAP_ONE",
            "kind": "user_axiom",
            "statement": "userAssumedGapAtOne : GapAt selectedSpectrum 1"
          }
        ],
        "edges": [
          {
            "from": "M0.CONDITIONAL.SELECTED_GAP",
            "to": "M0.AXIOM.SELECTED_SPECTRUM",
            "type": "DEPENDS_ON"
          },
          {
            "from": "M0.CONDITIONAL.SELECTED_GAP",
            "to": "M0.AXIOM.GAP_ONE",
            "type": "DEPENDS_ON"
          }
        ]
      },
      "context": {
        "modelId": "user-axiom-gap-interface",
        "delta": "1",
        "deltaRole": "DECLARED_GAP_BOUND",
        "energyUnit": "fixed shared energy unit",
        "fieldIsRecomputed": false
      },
      "environment": {
        "leanVersion": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)",
        "leanCommit": "5045d0056413266e57c625dcd7c365b10e377c52",
        "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612",
        "mathlibLakeManifestSha256": "8f67b2cf24143ac091cdb425e886c2164b2fc2d6fbccd6db9454b697f9541a67",
        "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13",
        "driverSha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa",
        "driverSourceSha256": "dbcada6e01a624daf70f53689fc95fa71b1a53c3e0279d2c2157c11c1e62e78e",
        "importClosureDigest": "77ae522db918211a75ca552740d37573830858450c2bd20061e9c01d3715f577",
        "importManifestSha256": "b596afdb954f29f3b327eca57e8fafe0ba141fe5fc1abb8c988a35d3d937a4b4",
        "importModuleCount": 2258,
        "unresolvedImportCount": 0,
        "kernelModified": false,
        "runtimeModified": false,
        "verifierGuardModified": false,
        "frontend": "official shared-library frontend with explicit installation root"
      }
    },
    "audit": {
      "schemaVersion": "mathscope.lean-audit/1",
      "checkedAt": "2026-10-09T12:05:54.113613+00:00",
      "target": "MathScope.M0.Conditional.selected_gap_excludes_interval",
      "targetType": "MathScope.M0.Conditional.selected_gap_excludes_interval (energy : ℝ) :\n  0 < energy → energy < 1 → energy ∉ MathScope.M0.Conditional.selectedSpectrum",
      "axioms": {
        "all": [
          "propext",
          "Classical.choice",
          "Quot.sound",
          "MathScope.M0.Conditional.selectedSpectrum",
          "MathScope.M0.Conditional.userAssumedGapAtOne"
        ],
        "standard": [
          "propext",
          "Classical.choice",
          "Quot.sound"
        ],
        "custom": [
          "MathScope.M0.Conditional.selectedSpectrum",
          "MathScope.M0.Conditional.userAssumedGapAtOne"
        ]
      },
      "compileExitCode": 0,
      "sorry": false,
      "warnings": [],
      "elapsedSeconds": 0.979182,
      "environmentDigest": "75b1093cfdc55f91f4d23ea844acb2678fb600d11afb89133417c14e8a6e7721",
      "moduleBuilds": [
        {
          "module": "MathScope.M0.Analytic",
          "sourceFile": "MathScope/M0/Analytic.lean",
          "sourceSha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313",
          "exitCode": 0,
          "logFile": "lean-analytic-audit.txt",
          "logSha256": "be64cfe388ea601349c533fc59596334cb470379ff467860a1d98c0017958292",
          "outputOleanSha256": "c3088e9d3cc88b97b031a6fde2635ed08d9c657a4b2a532ffa5224f98c5013ce"
        },
        {
          "module": "MathScope.M0.Conditional",
          "sourceFile": "MathScope/M0/Conditional.lean",
          "sourceSha256": "79c3fd19000b46cecb1181dfb89a16d81b49735446fa7cafaf82a0434d51c917",
          "exitCode": 0,
          "logFile": "lean-conditional-audit.txt",
          "logSha256": "57725831910b2082c3afa838394e95c39285f72d0b69118fbc04a0643de2f55c",
          "outputOleanSha256": "8173b47041ac3b410883f72fe1659d170ad1256782d57fe1a3f6e2643b69d24a"
        }
      ],
      "targetModuleLog": "MathScope.M0.Conditional.selectedSpectrum : Set ℝ\nMathScope.M0.Conditional.userAssumedGapAtOne : MathScope.M0.Analytic.GapAt MathScope.M0.Conditional.selectedSpectrum 1\nMathScope.M0.Conditional.selected_gap_excludes_interval (energy : ℝ) :\n  0 < energy → energy < 1 → energy ∉ MathScope.M0.Conditional.selectedSpectrum\n'MathScope.M0.Conditional.selected_gap_excludes_interval' depends on axioms: [propext,\n Classical.choice,\n Quot.sound,\n MathScope.M0.Conditional.selectedSpectrum,\n MathScope.M0.Conditional.userAssumedGapAtOne]\n",
      "negativeControls": [
        {
          "name": "NegativeFalse",
          "sourceFile": "NegativeFalse.lean",
          "sourceSha256": "bb8c5d5918222e9b4d279b6e41df5059171fb75ecca29b8c1f367d396ba5f261",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativefalse-audit.txt",
          "logSha256": "7cdcd37943712cee8cdf758bb022f59b662172bf2e9819758aec45781dce1592"
        },
        {
          "name": "NegativeMatrix",
          "sourceFile": "NegativeMatrix.lean",
          "sourceSha256": "1ce60aeb2856a9bbd80e2deaf6b0a2e84f61a5b0adf8a7b661fb6dcdb90b4c9b",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativematrix-audit.txt",
          "logSha256": "2d1e52c5f095cad04e2fb1c8a8596ce23479c189d08ba56b100bf070dfbb28b8"
        }
      ],
      "fullEnvironmentEvidence": "evidence/lean-environment.json",
      "fullValidationEvidence": "evidence/lean-validation.json",
      "compilerTrust": "Official Lean shared library and normal kernel; installation path explicitly supplied; unchanged kernel/runtime/guards."
    }
  },
  {
    "schemaVersion": "mathscope.shipped-proof/1",
    "id": "m0-comparison-gap",
    "label": "Comparison adapter · explicit spectrum inclusion",
    "scope": "A gap on an observed superset transfers to an original subset when the explicit SpectrumComparison.inclusion field is supplied in the same energy unit.",
    "explanation": {
      "student": "A gap seen in a larger certified set applies to its subsets. An arbitrary observation channel usually gives a subset, so this direction must be checked before transferring a conclusion.",
      "expert": "The adapter theorem requires original ⊆ observed; no projection or channel certificate is inferred from a picture. Prismatic, RH/BSD and paper-level NS imports remain separate reference or development tasks."
    },
    "jobSpec": {
      "claimId": "M0.COMPARISON.GAP_TRANSFER",
      "target": "MathScope.M0.Comparison.transport_gap",
      "requestedGrade": "CONDITIONAL_FORMAL",
      "sourceFiles": [
        {
          "path": "MathScope/M0/Analytic.lean",
          "content": "import Mathlib.Basic.Real.Basic\n\n/-!\nConditional real spectral statements.\n\n`GapAt` is a predicate on a set of real numbers in one fixed energy unit.\nIts arguments and hypotheses are explicit; this is not a construction of a\nHilbert space, a self-adjoint Hamiltonian, a quantum field theory, or a\ncontinuum limit.  No interchange of limits, sums or derivatives is used.\n-/\n\nnamespace MathScope.M0.Analytic\n\n/-- A positive lower bound on every positive member of a real spectrum. -/\ndef GapAt (spectrum : Set ℝ) (delta : ℝ) : Prop :=\n  0 < delta ∧ ∀ energy ∈ spectrum, 0 < energy → delta ≤ energy\n\n/-- A supplied gap excludes all positive energies strictly below it. -/\ntheorem gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n    (hGap : GapAt spectrum delta) :\n    ∀ energy, 0 < energy → energy < delta → energy ∉ spectrum := by\n  intro energy hPositive hBelow hMember\n  exact (not_lt_of_ge (hGap.2 energy hMember hPositive)) hBelow\n\n/-- The same spectrum retains every smaller positive certified lower bound. -/\ntheorem smaller_positive_gap (spectrum : Set ℝ) (delta epsilon : ℝ)\n    (hGap : GapAt spectrum delta) (hPositive : 0 < epsilon)\n    (hSmaller : epsilon ≤ delta) : GapAt spectrum epsilon := by\n  refine ⟨hPositive, ?_⟩\n  intro energy hMember hEnergy\n  exact le_trans hSmaller (hGap.2 energy hMember hEnergy)\n\n/-- An observed superset is sufficient; an arbitrary channel subset is not. -/\ntheorem gap_transfer (original observed : Set ℝ) (delta : ℝ)\n    (hObserved : GapAt observed delta) (hInclusion : original ⊆ observed) :\n    GapAt original delta := by\n  refine ⟨hObserved.1, ?_⟩\n  intro energy hOriginal hPositive\n  exact hObserved.2 energy (hInclusion hOriginal) hPositive\n\nset_option pp.fullNames true\n\n#check gap_excludes_interval\n#print axioms gap_excludes_interval\n#check smaller_positive_gap\n#print axioms smaller_positive_gap\n#check gap_transfer\n#print axioms gap_transfer\n\nend MathScope.M0.Analytic\n",
          "sha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313"
        },
        {
          "path": "MathScope/M0/Comparison.lean",
          "content": "import MathScope.M0.Analytic\n\n/-!\nAn explicit local adapter theorem with its necessary inclusion hypothesis.\nPrismatic comparison, global trace formulas, BSD and the attached PDE paper\nremain THEOREM REFERENCE until exact exported Lean statements are imported\nand their adapter obligations are proved.  A URL is not such an adapter.\n-/\n\nnamespace MathScope.M0.Comparison\n\nopen MathScope.M0.Analytic\n\nstructure SpectrumComparison (original observed : Set ℝ) where\n  inclusion : original ⊆ observed\n\ntheorem transport_gap (original observed : Set ℝ) (delta : ℝ)\n    (comparison : SpectrumComparison original observed)\n    (hObserved : GapAt observed delta) : GapAt original delta :=\n  gap_transfer original observed delta hObserved comparison.inclusion\n\nset_option pp.fullNames true\n\n#check transport_gap\n#print axioms transport_gap\n\nend MathScope.M0.Comparison\n",
          "sha256": "c5629d6c17cde5f67e50c577a2a7b71dd0b7223db657fdb27527312c2d02a2af"
        }
      ],
      "assumptions": [
        {
          "id": "M0.HYP.SPECTRUM_INCLUSION",
          "kind": "HYPOTHESIS",
          "statement": "comparison : SpectrumComparison original observed, containing original subset observed.",
          "source": "MathScope/M0/Comparison.lean",
          "status": "EXPLICIT_PARAMETER"
        },
        {
          "id": "M0.HYP.OBSERVED_GAP",
          "kind": "HYPOTHESIS",
          "statement": "hObserved : GapAt observed delta",
          "source": "MathScope/M0/Comparison.lean",
          "status": "EXPLICIT_PARAMETER"
        }
      ],
      "dependencyGraph": {
        "nodes": [
          {
            "id": "M0.COMPARISON.GAP_TRANSFER",
            "kind": "theorem",
            "statement": "MathScope.M0.Comparison.transport_gap (original observed : Set ℝ) (delta : ℝ)\n  (comparison : MathScope.M0.Comparison.SpectrumComparison original observed)\n  (hObserved : MathScope.M0.Analytic.GapAt observed delta) : MathScope.M0.Analytic.GapAt original delta"
          },
          {
            "id": "M0.HYP.SPECTRUM_INCLUSION",
            "kind": "hypothesis",
            "statement": "comparison : SpectrumComparison original observed, containing original subset observed."
          },
          {
            "id": "M0.HYP.OBSERVED_GAP",
            "kind": "hypothesis",
            "statement": "hObserved : GapAt observed delta"
          }
        ],
        "edges": [
          {
            "from": "M0.COMPARISON.GAP_TRANSFER",
            "to": "M0.HYP.SPECTRUM_INCLUSION",
            "type": "DEPENDS_ON"
          },
          {
            "from": "M0.COMPARISON.GAP_TRANSFER",
            "to": "M0.HYP.OBSERVED_GAP",
            "type": "DEPENDS_ON"
          }
        ]
      },
      "context": {
        "modelId": "spectral-inclusion-adapter",
        "inclusionDirection": "original subset observed",
        "energyUnit": "fixed shared energy unit"
      },
      "environment": {
        "leanVersion": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)",
        "leanCommit": "5045d0056413266e57c625dcd7c365b10e377c52",
        "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612",
        "mathlibLakeManifestSha256": "8f67b2cf24143ac091cdb425e886c2164b2fc2d6fbccd6db9454b697f9541a67",
        "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13",
        "driverSha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa",
        "driverSourceSha256": "dbcada6e01a624daf70f53689fc95fa71b1a53c3e0279d2c2157c11c1e62e78e",
        "importClosureDigest": "77ae522db918211a75ca552740d37573830858450c2bd20061e9c01d3715f577",
        "importManifestSha256": "b596afdb954f29f3b327eca57e8fafe0ba141fe5fc1abb8c988a35d3d937a4b4",
        "importModuleCount": 2258,
        "unresolvedImportCount": 0,
        "kernelModified": false,
        "runtimeModified": false,
        "verifierGuardModified": false,
        "frontend": "official shared-library frontend with explicit installation root"
      }
    },
    "audit": {
      "schemaVersion": "mathscope.lean-audit/1",
      "checkedAt": "2026-10-09T12:05:54.113613+00:00",
      "target": "MathScope.M0.Comparison.transport_gap",
      "targetType": "MathScope.M0.Comparison.transport_gap (original observed : Set ℝ) (delta : ℝ)\n  (comparison : MathScope.M0.Comparison.SpectrumComparison original observed)\n  (hObserved : MathScope.M0.Analytic.GapAt observed delta) : MathScope.M0.Analytic.GapAt original delta",
      "axioms": {
        "all": [
          "propext",
          "Classical.choice",
          "Quot.sound"
        ],
        "standard": [
          "propext",
          "Classical.choice",
          "Quot.sound"
        ],
        "custom": []
      },
      "compileExitCode": 0,
      "sorry": false,
      "warnings": [],
      "elapsedSeconds": 0.930312,
      "environmentDigest": "75b1093cfdc55f91f4d23ea844acb2678fb600d11afb89133417c14e8a6e7721",
      "moduleBuilds": [
        {
          "module": "MathScope.M0.Analytic",
          "sourceFile": "MathScope/M0/Analytic.lean",
          "sourceSha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313",
          "exitCode": 0,
          "logFile": "lean-analytic-audit.txt",
          "logSha256": "be64cfe388ea601349c533fc59596334cb470379ff467860a1d98c0017958292",
          "outputOleanSha256": "c3088e9d3cc88b97b031a6fde2635ed08d9c657a4b2a532ffa5224f98c5013ce"
        },
        {
          "module": "MathScope.M0.Comparison",
          "sourceFile": "MathScope/M0/Comparison.lean",
          "sourceSha256": "c5629d6c17cde5f67e50c577a2a7b71dd0b7223db657fdb27527312c2d02a2af",
          "exitCode": 0,
          "logFile": "lean-comparison-audit.txt",
          "logSha256": "34b3b75a629b4c83d2d4edd466741c14bc62377eaf58c94c87f5757ccaf9d124",
          "outputOleanSha256": "7ed6c46839f259880b3887b295fdff8146b3524f5ffe9af235952e75b025b728"
        }
      ],
      "targetModuleLog": "MathScope.M0.Comparison.transport_gap (original observed : Set ℝ) (delta : ℝ)\n  (comparison : MathScope.M0.Comparison.SpectrumComparison original observed)\n  (hObserved : MathScope.M0.Analytic.GapAt observed delta) : MathScope.M0.Analytic.GapAt original delta\n'MathScope.M0.Comparison.transport_gap' depends on axioms: [propext, Classical.choice, Quot.sound]\n",
      "negativeControls": [
        {
          "name": "NegativeFalse",
          "sourceFile": "NegativeFalse.lean",
          "sourceSha256": "bb8c5d5918222e9b4d279b6e41df5059171fb75ecca29b8c1f367d396ba5f261",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativefalse-audit.txt",
          "logSha256": "7cdcd37943712cee8cdf758bb022f59b662172bf2e9819758aec45781dce1592"
        },
        {
          "name": "NegativeMatrix",
          "sourceFile": "NegativeMatrix.lean",
          "sourceSha256": "1ce60aeb2856a9bbd80e2deaf6b0a2e84f61a5b0adf8a7b661fb6dcdb90b4c9b",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativematrix-audit.txt",
          "logSha256": "2d1e52c5f095cad04e2fb1c8a8596ce23479c189d08ba56b100bf070dfbb28b8"
        }
      ],
      "fullEnvironmentEvidence": "evidence/lean-environment.json",
      "fullValidationEvidence": "evidence/lean-validation.json",
      "compilerTrust": "Official Lean shared library and normal kernel; installation path explicitly supplied; unchanged kernel/runtime/guards."
    }
  }
];

return {SHIPPED_AUDIT_DIGESTS,SHIPPED_PROOF_BUNDLES};
})();
const __m0_6 = (()=>{
const { SHIPPED_PROOF_BUNDLES, SHIPPED_AUDIT_DIGESTS } = __m0_5;
/**
 * M0 proof provenance.  This module checks exact bindings to audits produced by
 * an actual pinned Lean run.  It does not execute Lean in a browser and does not
 * grant the older application's FORMAL PASS status.
 *
 * The trust anchor is the reviewed application release's immutable allowlist.
 * There is no remote signature service in M0.  A serialized receipt has no
 * authority: only a fresh, exact matched receipt has the private WeakSet brand.
 */

const VERSION = 'mathscope.proof-job/1';
const GRADES = new Set(['EXACT_FINITE', 'CONDITIONAL_FORMAL', 'UNCONDITIONAL_FORMAL']);
const STANDARD_AXIOMS = new Set(['propext', 'Classical.choice', 'Quot.sound']);
const receiptAuthority = new WeakSet();
const moduleAuthority = deepFreeze(cloneJSON(SHIPPED_AUDIT_DIGESTS));
const shippedBundles = deepFreeze(cloneJSON(SHIPPED_PROOF_BUNDLES));

function cloneJSON(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function canonicalProofJSON(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Proof metadata must contain finite JSON numbers.');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalProofJSON).join(',')}]`;
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalProofJSON(value[k])}`).join(',')}}`;
  }
  throw new TypeError('Proof metadata must be ordinary JSON; undefined, BigInt and executable values are rejected.');
}

async function proofSha256(value) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA256_UNAVAILABLE: a secure browser context is required.');
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : canonicalProofJSON(value));
  const result = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(result), x => x.toString(16).padStart(2, '0')).join('');
}

function validId(value, field) {
  if (typeof value !== 'string' || !value.trim() || value.length > 500) throw new TypeError(`Invalid ${field}.`);
  return value;
}

function normalKind(value) {
  return String(value || '').toLowerCase().replaceAll('-', '_');
}

/** This is a structural guard, never a substitute for Lean's dependency audit. */
function auditDependencyGraph(graph, targetId, options = {}) {
  const issues = [];
  const fail = (code, message, details = {}) => issues.push({ code, message, ...details });
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return { ok: false, status: 'INVALID_GRAPH', authority: 'STRUCTURAL_GUARD_ONLY', issues: [{ code: 'GRAPH_REQUIRED', message: 'A dependency graph is required.' }], closure: [] };
  }
  if (graph.nodes.length > 1024 || graph.edges.length > 4096) {
    return { ok: false, status: 'INVALID_GRAPH', authority: 'STRUCTURAL_GUARD_ONLY', issues: [{ code: 'GRAPH_BUDGET', message: 'The M0 graph budget was exceeded.' }], closure: [] };
  }
  const nodes = new Map();
  const adjacency = new Map();
  const allowedKinds = new Set(['theorem', 'definition', 'hypothesis', 'user_axiom', 'reference', 'open', 'imported_theorem']);
  for (const node of graph.nodes) {
    if (!node || typeof node.id !== 'string' || !node.id || nodes.has(node.id)) {
      fail('INVALID_NODE', 'Node IDs must be present and unique.');
      continue;
    }
    if (!allowedKinds.has(normalKind(node.kind))) fail('INVALID_NODE_KIND', `Unsupported node kind for ${node.id}.`);
    nodes.set(node.id, node);
    adjacency.set(node.id, []);
  }
  if (!nodes.has(targetId)) fail('TARGET_MISSING', 'The exact claim ID must occur in the dependency graph.');
  for (const edge of graph.edges) {
    if (!edge || edge.type !== 'DEPENDS_ON' || !nodes.has(edge.from) || !nodes.has(edge.to)) {
      fail('INVALID_EDGE', 'Proof dependencies require existing IDs and DEPENDS_ON direction (claim to prerequisite).');
      continue;
    }
    adjacency.get(edge.from).push(edge.to);
  }
  const color = new Map();
  const closure = [];
  const stack = [];
  function visit(id) {
    if (color.get(id) === 1) {
      fail('DEPENDENCY_CYCLE', 'A dependency cycle cannot close a research gate.', { cycle: [...stack.slice(stack.indexOf(id)), id] });
      return;
    }
    if (color.get(id) === 2) return;
    color.set(id, 1);
    stack.push(id);
    closure.push(id);
    for (const next of adjacency.get(id) || []) visit(next);
    stack.pop();
    color.set(id, 2);
  }
  if (nodes.has(targetId)) visit(targetId);
  const reachable = closure.map(id => nodes.get(id));
  const userAxioms = reachable.filter(n => normalKind(n.kind) === 'user_axiom').map(n => n.id);
  const open = reachable.filter(n => normalKind(n.kind) === 'open').map(n => n.id);
  const references = reachable.filter(n => normalKind(n.kind) === 'reference').map(n => n.id);
  const hypotheses = reachable.filter(n => normalKind(n.kind) === 'hypothesis').map(n => n.id);
  for (const node of reachable) {
    if (['hypothesis', 'user_axiom'].includes(normalKind(node.kind)) && (typeof node.statement !== 'string' || !node.statement.trim())) {
      fail('ASSUMPTION_STATEMENT_MISSING', `Assumption ${node.id} has no exact statement.`);
    }
  }
  if (open.length) fail('RESEARCH_OPEN', 'An open mathematical input remains in the dependency closure.', { nodes: open });
  if (references.length) fail('THEOREM_REFERENCE_ONLY', 'A literature reference has no imported kernel theorem adapter.', { nodes: references });
  if (userAxioms.length && options.requestedGrade !== 'CONDITIONAL_FORMAL') {
    fail('USER_AXIOM_GRADE_CONFLICT', 'A custom axiom requires a conditional grade.', { nodes: userAxioms });
  }
  if (options.closeResearchGate) {
    const normalize = value => String(value || '').replace(/\s+/g, ' ').trim();
    const targetStatement = normalize(nodes.get(targetId)?.statement);
    const same = reachable.filter(n => n.id !== targetId && ['hypothesis', 'user_axiom'].includes(normalKind(n.kind)) && targetStatement && normalize(n.statement) === targetStatement);
    if (same.length) fail('GOAL_ASSUMED_AS_PREMISE', 'Restating the desired conclusion as an assumption does not close the research gate.', { nodes: same.map(n => n.id) });
  }
  return deepFreeze({ ok: issues.length === 0, status: issues.length ? 'DEPENDENCY_REJECTED' : 'DEPENDENCY_VALID', authority: 'STRUCTURAL_GUARD_ONLY', issues, closure: [...new Set(closure)].sort(), userAxioms, hypotheses, open, references });
}

function normalizeGraph(graph) {
  canonicalProofJSON(graph);
  return {
    nodes: cloneJSON(graph.nodes).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    edges: cloneJSON(graph.edges).sort((a, b) => canonicalProofJSON(a) < canonicalProofJSON(b) ? -1 : canonicalProofJSON(a) > canonicalProofJSON(b) ? 1 : 0),
  };
}

function getProofCapabilities() {
  return deepFreeze({
    schemaVersion: VERSION,
    capability: 'EXPORT_AND_PINNED_AUDIT_ONLY',
    exactShippedAuditChecks: true,
    arbitrarySourceCompile: false,
    remoteEndpoint: null,
    executableBrowserMetadata: false,
    existingFormalPassIssuer: false,
    receiptPersistence: 'Serialized receipts lose authority; exact audit matching must run again.',
    shippedCount: shippedBundles.length,
    trustAnchor: 'Exact immutable hashes reviewed with this application release; no remote attestation service.',
    limitation: 'Edited Lean source can be exported as a ProofJob. A new kernel run must be supplied by a separately authorized compiler integration; M0 does not claim that service exists.',
  });
}

function listShippedProofs() {
  return shippedBundles.map(b => deepFreeze({ id: b.id, claimId: b.jobSpec.claimId, label: b.label, target: b.jobSpec.target, grade: b.jobSpec.requestedGrade, scope: b.scope, explanation: b.explanation, axioms: cloneJSON(b.audit.axioms), auditDigest: moduleAuthority[b.id] }));
}

function getShippedProofBundle(id = shippedBundles[0]?.id) {
  const bundle = shippedBundles.find(b => b.id === id);
  if (!bundle) throw new RangeError('Unknown shipped proof ID.');
  return cloneJSON(bundle);
}

/** Prepare a reproducible request; preparing a request is not a proof result. */
async function prepareProofJob(input) {
  const spec = input?.jobSpec || input;
  if (!spec || typeof spec !== 'object') throw new TypeError('ProofJob specification required.');
  const claimId = validId(spec.claimId, 'claimId');
  const target = validId(spec.target, 'target');
  if (!/^[A-Za-z_][A-Za-z0-9_.']*$/.test(target)) throw new TypeError('The target must be an explicit Lean declaration name.');
  const requestedGrade = spec.requestedGrade || 'CONDITIONAL_FORMAL';
  if (!GRADES.has(requestedGrade)) throw new TypeError('Unsupported requested proof grade.');
  if (!Array.isArray(spec.sourceFiles) || !spec.sourceFiles.length || spec.sourceFiles.length > 128) throw new TypeError('One to 128 Lean source files are required.');
  const seen = new Set();
  let totalBytes = 0;
  const sourceFiles = [];
  for (const file of spec.sourceFiles) {
    if (!file || typeof file.path !== 'string' || !/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.lean$/.test(file.path) || file.path.split('/').some(p => p === '..' || p === '.')) throw new TypeError('Source paths must be relative .lean paths without traversal.');
    if (seen.has(file.path) || typeof file.content !== 'string') throw new TypeError('Source paths must be unique and include full source text.');
    seen.add(file.path);
    totalBytes += new TextEncoder().encode(file.content).length;
    if (totalBytes > 2 * 1024 * 1024) throw new RangeError('The M0 proof source budget is 2 MiB.');
    sourceFiles.push({ path: file.path, content: file.content, sha256: await proofSha256(file.content) });
  }
  sourceFiles.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (!Array.isArray(spec.assumptions)) throw new TypeError('Explicit assumptions array required; [] means no stated extra assumptions.');
  canonicalProofJSON(spec.assumptions);
  const assumptionIds = new Set();
  const assumptions = cloneJSON(spec.assumptions);
  for (const assumption of assumptions) {
    validId(assumption.id, 'assumption.id');
    validId(assumption.statement, 'assumption.statement');
    if (assumptionIds.has(assumption.id)) throw new TypeError('Duplicate assumption ID.');
    assumptionIds.add(assumption.id);
  }
  assumptions.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (!spec.dependencyGraph || !Array.isArray(spec.dependencyGraph.nodes) || !Array.isArray(spec.dependencyGraph.edges)) throw new TypeError('Explicit dependencyGraph required.');
  const dependencyGraph = normalizeGraph(spec.dependencyGraph);
  const graphAudit = auditDependencyGraph(dependencyGraph, claimId, { requestedGrade });
  canonicalProofJSON(spec.environment || {});
  canonicalProofJSON(spec.context || {});
  const environment = cloneJSON(spec.environment || {});
  const context = cloneJSON(spec.context || {});
  if (!environment.leanVersion || !environment.leanCommit || !environment.runtimeLibrarySha256) throw new TypeError('Pinned Lean environment and runtime digest required.');
  const source = await proofSha256(sourceFiles.map(({ path, sha256 }) => ({ path, sha256 })));
  const digests = {
    source,
    assumptions: await proofSha256(assumptions),
    dependency: await proofSha256(dependencyGraph),
    context: await proofSha256(context),
    environment: await proofSha256(environment),
  };
  digests.binding = await proofSha256({ schemaVersion: VERSION, claimId, target, requestedGrade, ...digests });
  return deepFreeze({
    schemaVersion: VERSION,
    id: `proof-job:${digests.binding}`,
    claimId, target, requestedGrade, sourceFiles, assumptions, dependencyGraph, context, environment, digests, graphAudit,
    status: graphAudit.ok ? 'PREPARED_LOCAL_CHECK_REQUIRED' : 'BLOCKED_DEPENDENCY',
    capability: 'EXPORT_AND_PINNED_AUDIT_ONLY',
  });
}

function result(status, reason, extra = {}) {
  return deepFreeze({ status, verified: false, reason, canCompileHere: false, ...extra });
}

async function assessProofEvidence(jobInput, bundleInput) {
  let job;
  try { job = await prepareProofJob(jobInput); }
  catch (error) { return result('INVALID_PROOF_JOB', String(error.message || error)); }
  if (jobInput?.schemaVersion === VERSION && (jobInput.id !== job.id || canonicalProofJSON(jobInput.digests || {}) !== canonicalProofJSON(job.digests))) {
    return result('STALE', 'The serialized job hash does not match the recomputed source and metadata bindings. Prepare a fresh ProofJob.', { mismatchedBindings: ['serializedJobBinding'] });
  }
  if (!job.graphAudit.ok) return result('DEPENDENCY_REJECTED', 'The graph contains an unresolved or circular proof dependency.', { issues: job.graphAudit.issues });
  if (!bundleInput) return result('LOCAL_CHECK_REQUIRED', 'No audit was supplied. Export this source for a new pinned Lean run.');
  let bundle;
  try {
    canonicalProofJSON(bundleInput);
    bundle = cloneJSON(bundleInput);
  } catch (error) { return result('UNTRUSTED_IMPORTED', `Malformed imported audit: ${error.message}`); }
  if (!bundle.id || !Object.hasOwn(moduleAuthority, bundle.id)) return result('UNTRUSTED_IMPORTED', 'This imported audit has no matching immutable release authority.');
  const actualBundleDigest = await proofSha256(bundle);
  if (actualBundleDigest !== moduleAuthority[bundle.id]) return result('UNTRUSTED_IMPORTED', 'The audit JSON differs from the immutable shipped audit. Changing its exit code, axioms, type or hash cannot grant verification.');
  const auditJob = await prepareProofJob(bundle.jobSpec);
  const changed = ['source', 'assumptions', 'dependency', 'context', 'environment', 'binding'].filter(k => job.digests[k] !== auditJob.digests[k]);
  if (changed.length) return result('STALE', 'The stored audit applies to different source, assumptions, context, target, or environment.', { mismatchedBindings: changed, expectedJobId: auditJob.id, currentJobId: job.id });
  const audit = bundle.audit;
  if (audit.compileExitCode !== 0 || audit.sorry || audit.axioms.all.some(a => /(?:^|\.)sorryAx$/.test(a)) || !audit.negativeControls.every(n => n.rejected && n.exitCode !== 0)) {
    return result('AUDIT_REJECTED', 'Compiler success, absence of sorry, and required negative controls are mandatory.');
  }
  const customAxioms = audit.axioms.all.filter(a => !STANDARD_AXIOMS.has(a));
  if (customAxioms.length && job.requestedGrade !== 'CONDITIONAL_FORMAL') return result('USER_AXIOM_GRADE_CONFLICT', 'Custom axioms cannot be displayed as an unconditional theorem.');
  const declaredAxioms = new Set(job.assumptions.filter(a => normalKind(a.kind) === 'user_axiom').map(a => a.declaration));
  if (customAxioms.some(name => !declaredAxioms.has(name))) return result('ASSUMPTION_AUDIT_MISMATCH', 'A custom kernel axiom is missing from the explicit assumption ledger.');
  const receipt = deepFreeze({
    id: `proof-receipt:${actualBundleDigest}:${job.digests.binding}`,
    schemaVersion: 'mathscope.proof-receipt/1',
    claimId: job.claimId,
    jobId: job.id,
    target: job.target,
    targetType: audit.targetType,
    status: 'LOCAL_AUDIT_VERIFIED',
    grade: job.requestedGrade,
    sourceDigest: job.digests.source,
    assumptionsDigest: job.digests.assumptions,
    environmentDigest: job.digests.environment,
    dependencyDigest: job.digests.dependency,
    contextDigest: job.digests.context,
    context: cloneJSON(job.context),
    bindingDigest: job.digests.binding,
    auditDigest: actualBundleDigest,
    axioms: cloneJSON(audit.axioms),
    scope: bundle.scope,
    mathematicalStatus: customAxioms.length ? 'USER_AXIOM_DEPENDENT' : job.assumptions.length ? 'EXPLICIT_HYPOTHESES' : 'FIXED_FINITE_THEOREM',
    issuedExistingFormalPass: false,
  });
  receiptAuthority.add(receipt);
  return deepFreeze({ status: 'LOCAL_AUDIT_VERIFIED', verified: true, reason: 'Exact source, environment, assumption and target bindings match a shipped audit from the pinned Lean kernel run.', canCompileHere: false, receipt, job, explanation: bundle.explanation });
}

function isVerifiedProofReceipt(value) {
  return Boolean(value && typeof value === 'object' && receiptAuthority.has(value));
}

/** Source and logs are exportable data.  Reimporting them does not import authority. */
function exportProofRequest(job, bundle = null) {
  if (!job || job.schemaVersion !== VERSION) throw new TypeError('Prepare a ProofJob before exporting.');
  return {
    schemaVersion: 'mathscope.proof-export/1',
    job: cloneJSON(job),
    audit: bundle ? cloneJSON(bundle) : null,
    importedTrust: 'REVALIDATION_REQUIRED',
    reproduction: 'From lean/: lake build MathScope.M0.Finite MathScope.M0.Analytic MathScope.M0.Conditional MathScope.M0.Comparison; then inspect #check and #print axioms. NegativeFalse.lean and NegativeMatrix.lean must fail.',
  };
}

return {canonicalProofJSON,proofSha256,auditDependencyGraph,getProofCapabilities,listShippedProofs,getShippedProofBundle,prepareProofJob,assessProofEvidence,isVerifiedProofReceipt,exportProofRequest};
})();
const __m0_7 = (()=>{
const BASELINE = {"schema": "MathScopeBaselineManifest/1", "id": "baseline-v031-page41", "capturedAt": "2026-10-09", "page": {"url": "https://project29770.websitepublisher.ai/v0.3.1.html", "version": 41, "versionHash": "d400a17e", "sha256": "5cf7e919b8a221873c8a65523ad1e74d60ec551dc4e3c6e0b09b782c42238755"}, "extension": {"extensionVersion": "0.1.0", "target": "https://project29770.websitepublisher.ai/v0.3.1.html", "files": {"renderer.mjs": "02fa4c76c053ab1900d9d4edca83c2f54e017b0aed67a1bc2d63fd4ba598c1f3", "arithmetic-model.mjs": "e6b23af2044b368598e74b1d64966fafa1df31f646d37787339c19cb918ff218", "ym-model.mjs": "8ee5654cfe682eb73e0a8b49b97f7d43dbbef6311f6dceda4270fc2d7515a35c", "ns-model.mjs": "0a1b2f812d41c57bd00cc1856771251942c2cc9e3338ec6853e8e8f73fa6939f", "arithmetic-ui.mjs": "5f8f5545a9bc22bee40cbe41f4be7b64545a3aa9bb418f529fb0e3ff356f378a", "ym-ui.mjs": "998143e335d337c09885790c1c2f5a9fb3bf54db09ca8f296b8026f6666620a9", "ns-ui.mjs": "09b2eececaccc74f2c048cb958505a374ca277fc89c32186151653a0c8644a73", "session-bundle.mjs": "08a9b51cc1904ecea4449e02cbac394cfa70c7ce1f96b7e5e06289e34fa69c32", "lean-bundle.mjs": "ff40c1498ba2694f1770ec25bf9a7af8d35c572feabfdf58cddc1db943ea8795", "extension.mjs": "80534c6594494f189b8639586348a19a960d9de632a165f4a991243003021e7d", "extension.html": "551613f92f23e519a3a025bcbcfcdc0d8f5882bf7226d8b605df93ccb6a7ea3e", "extension.css": "d4d1855ae70e976a0db97dbc46129c7c3e12f4f7c9b3411c84e3a393d967e089"}, "bundleSha256": "4bc8de628d8dc4be0226072e018c3d5efd49242c5077cc1da7f37e7cd19ab335", "bundleBytes": 208778, "newAssets": 0, "releaseGate": "UNCHANGED / HOLD", "leanValidation": "CORE_AND_MATHLIB_AND_DEFAULT_SCENARIO_KERNEL_PASS_CONDITIONAL"}, "leanSources": [{"file": "MathScopeConditionalYM_Core.lean", "sha256": "c4316c0c6b8d3ba1461b675a377728b8baf2096b6f0ea6938fa9653eb1326639"}, {"file": "MathScopeConditionalYM.lean", "sha256": "6d64aa5b3f4a62477a6732ed1b6018f4ee588ffd051e22a04fcce9fcbfaa234c"}, {"file": "MathScopeSelectedScenario_SU2_Delta1_Slice0.lean", "sha256": "91ebce6fb7fbb17c9a6100fa86a8724c9151053d366ef65620fac557b6f3e815"}], "nsPaper": {"sha256": "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f", "pages": 166}, "blueprint": {"sha256": "0c1b345e0dbb860dadc979b6b912ea3faf03e9453054dc018595d0d609202620", "pages": 99}, "releaseGate": "RELEASE HOLD", "existingChecks": {"passed": 28, "total": 28, "record": "mathscope-extension/browser-validation.json"}};

return {BASELINE};
})();
const __m0_8 = (()=>{
/** Bind the bounded compute engine to actual, versioned ResearchSession records. */
const {assertValid,canonicalStringify,sha256} = __m0_0;
const {createNode,addNode,addEdge,referenceOf,verifyResearchM0Namespace} = __m0_1;
const {isResultFor,verifyResult,computeInputHash} = __m0_4;
const {createKernelWorkerSource} = __m0_3;
const clone=x=>JSON.parse(canonicalStringify(x));
function fail(message){throw new Error('M0 compute/session binding: '+message);}
function nsOf(value){return value?.schema==='MathScope.ResearchM0/1'?value:value?.researchM0;}
function sameRef(a,b){return a?.id===b?.id&&a?.revision===b?.revision&&a?.hash===b?.hash;}
function uniqueRefs(refs){const out=[];for(const ref of refs)if(!out.some(r=>sameRef(r,ref)))out.push(clone(ref));return out;}
function currentNode(ns,ref){return ns.nodes.find(n=>sameRef(n,ref));}
function requireCurrent(ns,ref,kind){
  const n=currentNode(ns,ref);
  if(!n||n.freshness!=='CURRENT'||(kind&&n.kind!==kind))fail(`Reference ${ref.id} is unresolved, revised, stale, or has the wrong type; refresh it before computing.`);
  return n;
}
async function validateNamespace(ns){const r=await verifyResearchM0Namespace(ns);if(!r.ok)fail(r.errors.join('; '));}
function preparationBody(prepared){const {preparationHash,...body}=prepared;return body;}
function targetContext(request){return {adapter:request.adapter,input:request.input,domain:request.domain,basis:request.basis,scope:request.scope,precision:request.precision,seed:request.seed,assumptionRefs:request.assumptionRefs,sourceRefs:request.sourceRefs};}
function targetStatement(request){return `Declared finite ${request.adapter.id} computational target. Exact context: ${canonicalStringify(targetContext(request))}`;}

/** This does not mutate a session or execute anything. UI save is explicit. */
async function prepareSessionJob(originalRequest,namespace,capabilities){
  const ns=nsOf(namespace);await validateNamespace(ns);assertValid('ComputeJobSpec',originalRequest);
  const request=clone(originalRequest),adapter=capabilities?.adapters?.find(a=>a.id===request.adapter.id&&a.version===request.adapter.version&&a.status==='AVAILABLE');
  if(!adapter)fail('This adapter/version is not installed and available.');
  const installedHash=await sha256(createKernelWorkerSource());
  const supplied=capabilities.sourceManifest?.find(s=>s.id==='mathscope-m0:static-worker-runtime');
  if(!supplied||supplied.sha256!==installedHash)fail('Worker capability digest does not match the installed fixed source.');
  const sourceId=`m0-source-worker:${installedHash}`;
  const sourcePayload={schema:'MathScope.SourceManifest/1',id:sourceId,revision:`${sourceId}:r1`,entries:[{
    id:'mathscope-m0:static-worker-runtime',kind:'CODE',title:'Installed MathScope bounded worker runtime',uri:'embedded:mathscope-m0/static-worker-runtime',sha256:installedHash,availability:'AVAILABLE',locator:'Fixed local kernel runtime plus exact-value implementation',version:supplied.version||capabilities.moduleVersion,license:null
  }]};
  const sourceNode=await createNode({kind:'SourceManifest',payload:sourcePayload}),plannedNodes=[];
  const existingSource=ns.nodes.find(n=>n.id===sourceNode.id);
  if(existingSource){if(!sameRef(existingSource,sourceNode)||existingSource.freshness!=='CURRENT')fail('Installed source manifest has a conflicting or imported revision; revalidate it in a fresh session.');}
  else plannedNodes.push(sourceNode);
  const workerRef=referenceOf(sourceNode);
  const retained=request.sourceRefs.filter(r=>r.id!=='mathscope-m0:static-worker-runtime'&&r.id!==sourceId);
  for(const ref of retained)requireCurrent(ns,ref,'source');
  request.sourceRefs=uniqueRefs([workerRef,...retained]);

  let model=currentNode(ns,request.modelRef);
  if(model){
    requireCurrent(ns,request.modelRef);
    if(!['object','claim'].includes(model.kind)||model.payload.scope?.kind!=='FINITE')fail('The registered model is not a finite mathematical target for these adapters.');
    request.assumptionRefs=uniqueRefs([...request.assumptionRefs,...(model.payload.assumptionRefs||[])]);
  }else if(ns.nodes.some(n=>n.id===request.modelRef.id))fail('The model ID exists with a different revision/hash; refresh the model reference.');
  for(const ref of request.assumptionRefs)requireCurrent(ns,ref,'assumption');
  if(model){
    if(request.adapter.id==='prime-segment'){
      if(model.payload.schema!=='MathScope.PrimeQuerySpec/1')fail('Prime computation requires a PrimeQuerySpec, not a gauge/PDE/prismatic model.');
      if(model.payload.query.lower!==request.input.lower||model.payload.query.upper!==request.input.upper||canonicalStringify(model.payload.scope)!==canonicalStringify(request.scope))fail('The registered prime target has different bounds/scope; choose or prepare a matching target.');
      if(model.payload.output==='GAPS')fail('The installed prime adapter returns counts and enumeration, not a registered gap target.');
    }else if(model.id!==`m0-target:${request.adapter.id}:${await sha256(targetContext(request))}`||model.payload.schema!=='MathScope.ClaimSpec/1'||model.payload.propositionKind!=='FINITE_RESULT'||model.payload.logicRole!=='OBSERVATION'||model.payload.statement!==targetStatement(request)||canonicalStringify(model.payload.scope)!==canonicalStringify(request.scope)||canonicalStringify(model.payload.sourceRefs)!==canonicalStringify(request.sourceRefs)||canonicalStringify(model.payload.assumptionRefs)!==canonicalStringify(request.assumptionRefs)){
      fail('The registered target does not match this exact finite adapter/input/domain/basis/precision. A prism, gauge field or PDE model cannot be computed by relabeling a finite arithmetic adapter.');
    }
  }
  if(!model){
    const context=targetContext(request);
    const digest=await sha256(context),modelId=`m0-target:${request.adapter.id}:${digest}`;
    const common={id:modelId,revision:`${modelId}:r1`,sourceRefs:request.sourceRefs,assumptionRefs:request.assumptionRefs};
    const payload=request.adapter.id==='prime-segment'?{
      schema:'MathScope.PrimeQuerySpec/1',...common,original:{kind:'PrimeSet',definition:'Natural p >= 2 with exactly two positive divisors.'},
      query:{lower:request.input.lower,upper:request.input.upper,completeness:'BOUNDED_ENUMERATION'},scope:request.scope,output:'COUNT_AND_ENUMERATE'
    }:{
      schema:'MathScope.ClaimSpec/1',...common,statement:targetStatement(request),
      scope:request.scope,propositionKind:'FINITE_RESULT',logicRole:'OBSERVATION',grade:'UNKNOWN'
    };
    model=await createNode({kind:request.adapter.id==='prime-segment'?'PrimeQuerySpec':'ClaimSpec',payload});
    const identical=ns.nodes.find(n=>n.id===model.id);
    if(identical){if(!sameRef(identical,model)||identical.freshness!=='CURRENT')fail('Generated target conflicts with an existing stale/revised node.');model=identical;}
    else plannedNodes.push(model);
    request.modelRef=referenceOf(model);
  }
  assertValid('ComputeJobSpec',request);
  const prepared={schema:'MathScope.PreparedSessionJob/1',request,plannedNodes,baselineHash:ns.baselineHash,namespaceRevision:ns.revision,environmentHash:capabilities.environmentHash,inputHash:await computeInputHash(request)};
  prepared.preparationHash=await sha256(preparationBody(prepared));return prepared;
}

/** Recheck bindings and freshly verify completed values before explicit save. */
async function saveSessionJob(namespace,prepared,job){
  const ns=nsOf(namespace);await validateNamespace(ns);
  if(prepared?.schema!=='MathScope.PreparedSessionJob/1'||await sha256(preparationBody(prepared))!==prepared.preparationHash)fail('Prepared request was modified.');
  if(prepared.baselineHash!==ns.baselineHash)fail('The session belongs to a different baseline.');
  const request=prepared.request;assertValid('ComputeJobSpec',request);
  if(!job?.result||job.id!==request.id||job.result.jobId!==request.id||job.environmentHash!==prepared.environmentHash)fail('Job/result identity or execution environment does not match the prepared request.');
  if(canonicalStringify(job.request)!==canonicalStringify(request))fail('The completed job belongs to a different request.');
  const integrity=await isResultFor(request,job.result);if(!integrity.ok)fail(integrity.errors.join('; '));
  let state=clone(ns);
  for(const node of prepared.plannedNodes){
    if(await sha256(node.payload)!==node.hash)fail(`Planned payload changed: ${node.id}`);
    const old=state.nodes.find(n=>n.id===node.id);
    if(old){if(!sameRef(old,node)||old.freshness!=='CURRENT')fail(`Planned node ${node.id} was revised; prepare the job again.`);}
    else state=await addNode(state,{id:node.id,kind:node.kind,payload:node.payload,revision:node.revision});
  }
  for(const ref of [...request.sourceRefs,...request.assumptionRefs,request.modelRef])requireCurrent(state,ref);
  const model=requireCurrent(state,request.modelRef);
  for(const ref of model.payload.assumptionRefs||[])requireCurrent(state,ref,'assumption');
  if(job.result.status==='COMPLETED'){
    const verified=await verifyResult(request,job.result);if(!verified.ok)fail(verified.errors.join('; '));
  }
  state=await addNode(state,{kind:'ComputeJobSpec',payload:request});
  const resultId=`result:${job.id}`;
  state=await addNode(state,{id:resultId,kind:'ResultEnvelope',payload:job.result});
  const edgeId=`computes:${job.id}`;
  if(!state.edges.some(e=>e.id===edgeId))state=await addEdge(state,{id:edgeId,type:'COMPUTES',from:job.id,to:resultId});
  return state;
}

return {prepareSessionJob,saveSessionJob};
})();
const __m0_9 = (()=>{
/** Thin tools over the same M0 controller used by visible controls.
 * API baseline: document.modelContext, checked 2026-10-09 against the draft
 * and Chrome's 2026-09-21 imperative guide. No legacy global/polyfill.
 */
const ownership = new WeakMap();
const ADAPTERS = ['prime-segment', 'padic-delta', 'rational-interval', 'integer-matrix-product'];
const EMPTY = { type: 'object', properties: {}, additionalProperties: false };

function checkedInput(input, keys, required = []) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('An input object is required.');
  if (Object.keys(input).some(k => !keys.includes(k))) throw Error('Unknown input field.');
  if (required.some(k => !Object.hasOwn(input, k))) throw Error('Required input field missing.');
  if (JSON.stringify(input).length > 65536) throw Error('Tool input exceeds 64 KiB.');
  return input;
}

function createM0ToolDefinitions(api) {
  const wrap = (keys, required, fn) => async (input = {}, options = {}) => {
    try {
      checkedInput(input, keys, required);
      if (options.signal?.aborted) return { ok: false, state: 'NOT_STARTED', code: 'CANCELLED' };
      return await fn(input, options);
    } catch (error) {
      return { ok: false, state: 'NOT_STARTED', code: error.code || 'INVALID_REQUEST', message: String(error.message).slice(0,600) };
    }
  };
  return [
    {
      name: 'mathscope.research_m0.status',
      description: 'Read the active MathScope M0 session, typed-object counts, bounded compute capabilities, jobs and evidence-audit summary. Does not modify the session.',
      inputSchema: EMPTY, annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: wrap([], [], () => api.getStatus())
    },
    {
      name: 'mathscope.research_m0.validate_contract',
      description: 'Validate a versioned MathScope research contract without saving it. Schemas and data validation do not prove the mathematical hypotheses.',
      inputSchema: { type: 'object', properties: { kind: { type: 'string', maxLength: 100 }, value: { type: 'object' } }, required: ['kind','value'], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: wrap(['kind','value'], ['kind','value'], ({kind,value}) => {
        if (typeof kind !== 'string' || kind.length > 100 || !value || typeof value !== 'object' || Array.isArray(value)) throw Error('A contract name and object are required.');
        return api.validateContract(kind,value);
      })
    },
    {
      name: 'mathscope.research_m0.run_fixture',
      description: 'Run one named small M0 reference calculation in the current browser worker. Adds only a local job and displays its result; does not save mathematical evidence or replace edited inputs. Returns the job ID for status/cancel.',
      inputSchema: { type: 'object', properties: { adapter: { type: 'string', enum: ADAPTERS } }, required:['adapter'], additionalProperties:false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: wrap(['adapter'],['adapter'], async ({adapter},{signal}) => {
        if (!ADAPTERS.includes(adapter)) throw Error('Unsupported fixture adapter.');
        return api.runFixture(adapter, { signal });
      })
    },
    {
      name: 'mathscope.research_m0.job_status',
      description: 'Read one M0 browser job using an ID returned by run_fixture or the job list. This does not issue proof status.',
      inputSchema: { type:'object', properties:{ jobId:{type:'string',minLength:1,maxLength:160} },required:['jobId'],additionalProperties:false },
      annotations:{readOnlyHint:true,untrustedContentHint:true},
      execute:wrap(['jobId'],['jobId'],({jobId})=>{
        if (typeof jobId !== 'string' || !jobId || jobId.length > 160) throw Error('Invalid job ID.');
        return api.getJobStatus(jobId);
      })
    },
    {
      name:'mathscope.research_m0.cancel_job',
      description:'Request cancellation of a named M0 browser calculation. Preserves its last checkpoint for resume. Cancellation is not a rollback of previously saved session records.',
      inputSchema:{type:'object',properties:{jobId:{type:'string',minLength:1,maxLength:160}},required:['jobId'],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      execute:wrap(['jobId'],['jobId'],({jobId})=>{
        if(typeof jobId !== 'string'||!jobId||jobId.length>160) throw Error('Invalid job ID.');
        return api.cancelJob(jobId);
      })
    },
    {
      name:'mathscope.research_m0.self_test',
      description:'Run bounded M0 contract, arithmetic, selective-stale and proof-audit acceptance checks in isolated memory. No active-session mutation and no external computation.',
      inputSchema:EMPTY,annotations:{readOnlyHint:true,untrustedContentHint:false},
      execute:wrap([],[],(_,options)=>api.runChecks(options))
    },
    {
      name:'mathscope.research_m0.proof_audit',
      description:'Compare the selected Lean source and assumptions with the exact shipped local kernel audit. Modified or untrusted imported sources require revalidation. This neither runs a remote compiler nor issues the existing FORMAL PASS certificate.',
      inputSchema:EMPTY,annotations:{readOnlyHint:true,untrustedContentHint:true},
      execute:wrap([],[],()=>api.checkSelectedProof())
    }
  ];
}

async function registerM0Tools(api, host = typeof document === 'undefined' ? null : document) {
  if (!host) return { implemented:true,registered:false,reason:'NO_DOCUMENT',dispose(){} };
  const prior = ownership.get(host);
  if (prior) prior.abort();
  const controller = new AbortController();
  ownership.set(host,controller);
  const dispose = () => { controller.abort(); if (ownership.get(host)===controller) ownership.delete(host); };
  const mc = host.modelContext;
  if (!mc || typeof mc.registerTool !== 'function') return {implemented:true,registered:false,reason:'NATIVE_REGISTRATION_UNAVAILABLE',dispose};
  const names=[];
  try {
    for(const tool of createM0ToolDefinitions(api)) {
      if(controller.signal.aborted) return {implemented:true,registered:false,reason:'DISPOSED',dispose};
      await mc.registerTool(tool,{signal:controller.signal});
      names.push(tool.name);
    }
    if(controller.signal.aborted) return {implemented:true,registered:false,reason:'DISPOSED',dispose};
    return {implemented:true,registered:true,contract:'document.modelContext.registerTool + AbortSignal',checkedDocsAt:'2026-10-09',names,consumerVerification:'REQUIRES_CURRENT_CLIENT_INVOCATION',dispose};
  } catch(error) {
    dispose();
    return {implemented:true,registered:false,reason:'REGISTRATION_REJECTED',message:String(error.message).slice(0,300),dispose};
  }
}

return {createM0ToolDefinitions,registerM0Tools};
})();
const __m0_10 = (()=>{
const Contracts = __m0_0;
const Sessions = __m0_1;
const Compute = __m0_4;
const Proof = __m0_6;
const copy = value => JSON.parse(JSON.stringify(value));
const requireTrue = (condition, message) => { if (!condition) throw new Error(message); };
const ACCEPTANCE_SCOPE = Object.freeze({
  id: 'M0_LOCAL_FOUNDATION_ACCEPTANCE', version: '1.0.0',
  isolatedSyntheticSession: true, mutatesActiveSession: false, readsActiveSession: false, networkRequests: false,
  computation: 'Four finite local adapters and their explicit bounds; native browser Worker when available.',
  proof: 'Exact replay of shipped source-bound Lean audits; this run does not compile Lean in the browser.',
  exclusions: 'No full prismatic complex, general-G quantum construction, RH/BSD resolution, Navier–Stokes reconstruction or global release certification.'
});

function syntheticLegacy() {
  return {
    schema: Contracts.LEGACY_SESSION_SCHEMA, id: 'm0-acceptance-isolated-session', title: 'Isolated M0 acceptance fixture',
    objects: [{ id: 'legacy-object:prime', revision: 'legacy-object:prime:r1', definition: 'PrimeSet' }],
    representations: [{ id: 'legacy-view:prime', objectRef: 'legacy-object:prime', camera: { x: 1, y: 2, z: 3 } }],
    claims: [{ id: 'legacy-claim:finite', statement: 'Historical finite fixture', grade: 'NUMERICAL INDICATOR' }],
    evidence: [{ id: 'legacy-evidence:historical', claimRef: 'legacy-claim:finite', grade: 'NUMERICAL INDICATOR', supportsCurrent: false }],
    assumptions: [], revisions: [], checkpoints: [], researchRuns: [], sessionRevision: 1
  };
}
// The baseline here is explicitly a test input. The deployed baseline manifest is
// separately pinned by the IDE; acceptance never reads or replaces that session.
const SYNTHETIC_BASELINE = Object.freeze({ schema: 'MathScopeBaselineManifest/1', id: 'isolated-acceptance-baseline-fixture', purpose: 'TEST_FIXTURE_NOT_DEPLOYMENT_AUDIT', page: { version: 41, versionHash: 'd400a17e' } });

/** Runs checks entirely against local temporary data. No active window session is
 * accessed, imported, saved, revised, or regraded. */
async function runM0Acceptance({ signal, onProgress } = {}) {
  const results = [], engines = new Set();
  let examples, migrated, lastPrimeResult;
  function createEngine() { const engine = Compute.createComputeEngine(); engines.add(engine); return engine; }
  const engine = createEngine();
  const abortEngines = () => { for (const instance of engines) for (const job of instance.listJobs()) if (['QUEUED', 'RUNNING', 'CANCEL_REQUESTED'].includes(job.status)) instance.cancel(job.id); };
  signal?.addEventListener('abort', abortEngines, { once: true });
  async function finite(adapter) {
    const request = await Compute.createExampleJob(adapter); request.id = `acceptance:${adapter}`;
    const submitted = await engine.submit(request), job = await engine.wait(submitted.id);
    requireTrue(job.status === 'COMPLETED', `${adapter}: ${job.status} ${job.result?.message || ''}`);
    requireTrue(Contracts.validateResultEnvelope(job.result).ok, `${adapter}: result envelope validation failed`);
    requireTrue((await Compute.isResultFor(request, job.result)).ok, `${adapter}: input/provenance binding failed`);
    return { request, job, result: job.result };
  }
  const checks = [
    {
      id: 'A01', label: 'Versioned starter contracts', run: async () => {
        examples = await Contracts.getContractExamples();
        const names = Object.keys(examples);
        for (const name of names) requireTrue(Contracts.validate(name, examples[name]).ok, `${name} example is invalid`);
        return { contractCount: names.length, contracts: names };
      }
    },
    {
      id: 'A02', label: 'Isolated legacy migration and round-trip', run: async () => {
        const legacy = syntheticLegacy(), before = Contracts.canonicalStringify(legacy);
        migrated = await Sessions.migrateSession(legacy, SYNTHETIC_BASELINE);
        requireTrue(Contracts.canonicalStringify(legacy) === before, 'Migration mutated the legacy input');
        for (const key of ['objects', 'representations', 'claims', 'evidence', 'assumptions', 'revisions', 'checkpoints']) requireTrue(Contracts.canonicalStringify(migrated[key]) === Contracts.canonicalStringify(legacy[key]), `Legacy ${key} changed`);
        const exported = await Sessions.exportSessionBundle(migrated), imported = await Sessions.importSessionBundle(exported);
        const recovered = imported.session || imported;
        requireTrue(recovered.id === legacy.id, 'Round-trip did not preserve the legacy session ID');
        requireTrue(recovered.evidence.length === legacy.evidence.length, 'Round-trip changed the number of legacy evidence records');
        for (let i = 0; i < legacy.evidence.length; i++) {
          for (const key of ['id', 'claimRef', 'grade']) requireTrue(recovered.evidence[i][key] === legacy.evidence[i][key], `Round-trip changed historical evidence ${key}`);
          requireTrue(recovered.evidence[i].supportsCurrent === false, 'Imported legacy evidence acquired current authority');
        }
        return { preservedSessionId: legacy.id, preservedLegacyGroups: 7, importAuthority: 'REVALIDATION_REQUIRED', syntheticFixture: true };
      }
    },
    {
      id: 'A03', label: 'Finite scope, CW and fake-proof guards', run: async () => {
        const sourceExamples = examples || await Contracts.getContractExamples();
        const request = await Compute.createExampleJob(); delete request.scope.primeInterval;
        requireTrue(!Contracts.validateComputeJobSpec(request).ok, 'Missing finite bounds were accepted');
        const prism = copy(sourceExamples.PrismSpec); prism.geometricObject.kind = 'CW_COMPLEX';
        requireTrue(!Contracts.validate('PrismSpec', prism).ok, 'A CW complex was accepted as a prism');
        const fake = { schema: 'MathScope.ResultEnvelope/1', jobId: 'acceptance:forged-proof', inputHash: '0'.repeat(64), environmentHash: '0'.repeat(64), status: 'COMPLETED', scope: { kind: 'FINITE', finite: { description: 'Intentional forged test record', itemCount: 1 } }, precision: { kind: 'EXACT' }, values: { x: { kind: 'INTEGER', value: '1' } }, errorLedger: { rounding: null, discretization: null, tail: null, residual: null, stability: null, statistical: null }, provenance: {}, evidence: { grade: 'FORMAL PASS', scopeKind: 'exact-finite' } };
        requireTrue(!Contracts.validateResultEnvelope(fake).ok, 'A generic compute record issued FORMAL PASS');
        return { rejected: ['UNBOUNDED_FINITE_QUERY', 'CW_AS_PRISM', 'GENERIC_FORMAL_PASS'] };
      }
    },
    {
      id: 'A04', label: 'Selective assumption staleness', run: async () => {
        const original = migrated || await Sessions.migrateSession(syntheticLegacy(), SYNTHETIC_BASELINE);
        const graph = await Sessions.addDependencyExample(original);
        const updated = await Sessions.reviseAssumption(graph.session, graph.assumptionId, 'Acceptance test revision: the hypothesis has changed.');
        for (const id of graph.dependentIds) requireTrue(Sessions.effectiveNodeState(updated.session, id)?.freshness === 'STALE', `Dependent ${id} was not marked stale`);
        requireTrue(Sessions.effectiveNodeState(updated.session, graph.independentId)?.freshness === 'CURRENT', 'An unrelated finite prime object was incorrectly marked stale');
        requireTrue((await Sessions.verifyResearchM0Namespace(updated.namespace)).ok, 'Revised namespace failed its content hashes');
        return { stale: graph.dependentIds, preservedCurrent: graph.independentId };
      }
    },
    {
      id: 'A05', label: 'Exact prime interval and completeness', run: async () => {
        const { job, result } = await finite('prime-segment'); lastPrimeResult = result;
        requireTrue(result.values.count.value === '168', 'Expected pi(1000) = 168');
        requireTrue(result.values.coverage.completeWithinScope === true && result.values.coverage.infinitePrimeSetComplete === false, 'Finite/infinite completeness distinction failed');
        return { count: '168', scope: '[2,1000]', verifier: result.provenance.verification.verifier, executionMode: job.executionMode };
      }
    },
    {
      id: 'A06', label: 'Canonical p-adic delta', run: async () => {
        const { result } = await finite('padic-delta');
        requireTrue(result.values.delta.residue === '15' && result.values.delta.digits === 3, 'Expected delta_5(7) = 15 + O(5^3)');
        requireTrue(result.values.precisionPropagation.digitsConsumed === 1, 'The p-adic precision loss was not recorded');
        return { p: '5', inputDigits: 4, outputDigits: 3, residue: '15', scopeKind: result.evidence.scopeKind };
      }
    },
    {
      id: 'A07', label: 'Exact rational interval enclosure', run: async () => {
        const { result } = await finite('rational-interval'), interval = result.values.result;
        requireTrue(interval.lower.numerator === '-1' && interval.lower.denominator === '1' && interval.upper.numerator === '3' && interval.upper.denominator === '2', 'Expected [-1,3/2]');
        requireTrue(result.evidence.scopeKind === 'interval-certified', 'Interval evidence lost its scope type');
        return { enclosure: '[-1, 3/2]', endpoints: 'EXACT_RATIONAL', residual: result.errorLedger.residual.status, stability: result.errorLedger.stability.status };
      }
    },
    {
      id: 'A08', label: 'Finite differential matrix certificate', run: async () => {
        const { result } = await finite('integer-matrix-product');
        requireTrue(result.values.product.flat().length === 12 && result.values.product.flat().every(x => x.kind === 'INTEGER' && x.value === '0'), 'D1 D0 is not the exact 3×4 zero matrix');
        requireTrue(result.provenance.verification.verifier === 'INDEPENDENT_OUTER_PRODUCT_ACCUMULATION', 'Independent matrix checker missing');
        if (lastPrimeResult) {
          const changed = await Compute.createExampleJob(); changed.sourceRefs[0].hash = 'a'.repeat(64);
          requireTrue(!(await Compute.isResultFor(changed, lastPrimeResult)).ok, 'A result was reused after changing its source');
        }
        return { product: 'D1 D0 = 0', dimensions: [3, 4], scope: 'These finite integer matrices only', sourceStaleGuard: true };
      }
    },
    {
      id: 'A09', label: 'Insufficient precision stays incomplete', run: async () => {
        const request = await Compute.createExampleJob('padic-delta'); request.id = 'acceptance:precision-negative'; request.input.a.digits = 3;
        const submitted = await engine.submit(request), job = await engine.wait(submitted.id);
        requireTrue(job.status === 'PRECISION_REQUIRED', 'Insufficient p-adic input precision did not stop execution');
        requireTrue(job.result.details.requiredInputDigits === 4 && job.result.evidence.supportsCurrent === false && job.result.evidence.grade === 'UNKNOWN', 'Incomplete result received completed support');
        return { status: job.status, requiredInputDigits: 4, noInventedDigit: true };
      }
    },
    {
      id: 'A10', label: 'Shipped Lean audit exact binding', run: async () => {
        const bundles = Proof.listShippedProofs(); requireTrue(bundles.length >= 2, 'Expected finite and conditional shipped Lean audit fixtures');
        const verified = [];
        for (const item of bundles) {
          const bundle = Proof.getShippedProofBundle(item.id), report = await Proof.assessProofEvidence(bundle.jobSpec, bundle);
          requireTrue(report.verified === true && Proof.isVerifiedProofReceipt(report.receipt), `Shipped audit ${item.id} did not match its exact binding`);
          requireTrue(!Proof.isVerifiedProofReceipt(copy(report.receipt)), 'A serialized receipt retained live authority');
          requireTrue(report.canCompileHere === false, 'Audit replay was mislabeled as a new browser Lean compile');
          verified.push({ id: item.id, target: report.receipt.target, grade: report.receipt.grade });
        }
        return { matchedAudits: verified, newLeanCompilation: false };
      }
    },
    {
      id: 'A11', label: 'Edited Lean source makes old audit stale', run: async () => {
        const bundle = Proof.getShippedProofBundle(), changed = copy(bundle.jobSpec);
        changed.sourceFiles[0].content += '\n-- M0 acceptance: exact source changed.\n';
        const report = await Proof.assessProofEvidence(changed, bundle);
        requireTrue(report.status === 'STALE' && report.verified === false, 'An old Lean audit was reused for edited source');
        return { status: report.status, mismatchedBindings: report.mismatchedBindings || [] };
      }
    },
    {
      id: 'A12', label: 'Forged Lean audit is untrusted', run: async () => {
        const original = Proof.getShippedProofBundle(), forged = copy(original);
        forged.audit.targetType += '\nFORGED ACCEPTANCE TEST TYPE';
        const report = await Proof.assessProofEvidence(original.jobSpec, forged);
        requireTrue(report.status === 'UNTRUSTED_IMPORTED' && report.verified === false, 'A changed audit acquired authority');
        return { status: report.status, serializedPassFieldsGrantAuthority: false };
      }
    }
  ];
  try {
    for (const check of checks) {
      if (signal?.aborted) break;
      const started = performance.now(); let item;
      try {
        const details = await check.run();
        item = { id: check.id, label: check.label, pass: true, status: 'PASS', details, durationMillis: performance.now() - started };
      } catch (error) {
        item = { id: check.id, label: check.label, pass: false, status: signal?.aborted ? 'CANCELLED' : 'FAIL', message: String(error.message || error), details: { code: error.code || null }, durationMillis: performance.now() - started };
      }
      results.push(item);
      if (onProgress) { try { await onProgress({ ...copy(item), completed: results.length, total: checks.length }); } catch { /* UI logging cannot change acceptance results. */ } }
    }
    const passed = results.filter(x => x.pass).length;
    return { pass: !signal?.aborted && results.length === checks.length && passed === checks.length, passed, total: checks.length, results, scope: copy(ACCEPTANCE_SCOPE), aborted: Boolean(signal?.aborted) };
  } finally {
    signal?.removeEventListener('abort', abortEngines);
    for (const instance of engines) instance.dispose();
  }
}

return {runM0Acceptance};
})();
const __m0_11 = (()=>{
const C = __m0_0;
const S = __m0_1;
const V = __m0_2;
const Compute = __m0_4;
const Proof = __m0_6;
const Integration = __m0_8;
const { BASELINE } = __m0_7;
const { registerM0Tools } = __m0_9;
const { runM0Acceptance } = __m0_10;
const clone = value => JSON.parse(C.canonicalStringify(value));
const pretty = value => JSON.stringify(value, null, 2);
const BASELINE_JSON = C.canonicalStringify(BASELINE);

// This bridge exists before the legacy DOMContentLoaded importer starts.
// Data validation cannot issue the legacy application's formal certificates.
if (typeof window !== 'undefined') {
  window.MathScopeM0Contracts = Object.freeze({
    canonicalStringify: C.canonicalStringify,
    validateResearchM0Namespace(namespace) {
      const report = S.validateResearchM0Namespace(namespace);
      if (namespace?.baseline && C.canonicalStringify(namespace.baseline) !== BASELINE_JSON) report.errors.push('M0 baseline differs from the installed release.');
      report.ok = report.errors.length === 0;
      return report;
    },
    async verifyResearchM0Namespace(namespace) {
      const report = await S.verifyResearchM0Namespace(namespace);
      if (namespace?.baselineHash !== await C.sha256(BASELINE_JSON)) report.errors.push('M0 baseline is not the installed release baseline.');
      report.ok = report.errors.length === 0;
      return report;
    },
    quarantineResearchM0Namespace: S.quarantineResearchM0Namespace,
  });
}

const ADAPTER_LABELS = {
  'prime-segment': '소수 구간 · 정확한 정수',
  'padic-delta': 'p-진 δ · 정밀도 전파',
  'rational-interval': '유리수 구간 · 정확한 끝점',
  'integer-matrix-product': '정수 행렬 · D₁D₀ 계산',
};
const ADAPTER_DESCRIPTIONS = {
  'prime-segment': '선택한 유한 구간의 모든 정수를 체와 독립적인 나눗셈 검사로 확인합니다. 상한 1,000,000, 구간 폭 20,000입니다.',
  'padic-delta': 'Zₚ에서 φ = id, δ(a) = (a − aᵖ)/p를 계산합니다. 출력 N자리에는 입력 N+1자리가 필요합니다.',
  'rational-interval': '유리수 끝점을 정확히 계산하여 포함 구간을 얻습니다. 초월함수와 적분은 현재 어댑터의 범위 밖입니다.',
  'integer-matrix-product': '명시한 정수 행렬의 곱을 두 알고리즘으로 확인합니다. 기본 예제는 설계도의 유한 D₁D₀ = 0 계산입니다.',
};
const CONTRACT_LABELS = {
  PrimeQuerySpec: 'PrimeQuerySpec · 무한 소수집합 / 유한 질의',
  PrismSpec: 'PrismSpec · 프리즘 입력 계약',
  GaugeGroupSpec: 'GaugeGroupSpec · 군과 전역형',
  StateFamilySpec: 'StateFamilySpec · 장 / Δ의 역할',
  PDEConstructionSpec: 'PDEConstructionSpec · 방정식 / 출처 / 절단',
  ObservationMapSpec: 'ObservationMapSpec · 4D → 3D 관측',
  AssumptionSpec: 'AssumptionSpec · 개별 가정',
  AssumptionLedger: 'AssumptionLedger · 가정 원장',
  ClaimSpec: 'ClaimSpec · 주장과 적용 범위',
  SourceManifest: 'SourceManifest · 출처와 버전',
};

async function bootM0() {
  const root = document.getElementById('mathscopeResearchM0');
  if (!root || root.dataset.mounted === 'true') return;
  const $ = id => document.getElementById(id);
  const base = () => {
    const api = window.MathScopeV031Foundation;
    if (!api?.getSession || !api?.commitResearchM0) throw Error('기존 Research Session 연결을 아직 사용할 수 없습니다.');
    return api;
  };
  const engine = Compute.createComputeEngine();
  const examples = await C.getContractExamples();
  const capabilities = await engine.capabilities();
  const proofs = Proof.listShippedProofs();
  const pendingJobs = new Map();
  const replayReports = new Map();
  let selectedJobId = null, selectedNodeId = null, activeTab = 'objects';
  let selectedBundle = null, editedProof = null, selectedFile = null, proofEdit = 0, lastProof = null;
  let lastChecks = null, checking = null, toolRegistration = null, sequence = 0, exportURL = null;
  const nextId = prefix => prefix + ':' + Date.now().toString(36) + ':' + (++sequence);

  function text(id, value) { $(id).textContent = typeof value === 'string' ? value : pretty(value); }
  function status(message, failed = false) {
    text('m0-status', message); $('m0-status').classList.toggle('m0-error', failed); $('m0-status').dataset.error = String(failed);
  }
  function download(name, data) {
    const content = typeof data === 'string' ? data : pretty(data);
    if (exportURL) URL.revokeObjectURL(exportURL);
    exportURL = URL.createObjectURL(new Blob([content], {type: 'application/json;charset=utf-8'}));
    const link = $('m0-download-link'); link.href = exportURL; link.download = name; link.textContent = name + ' 다운로드';
    $('m0-export-content').value = content; $('m0-export-panel').hidden = false; $('m0-export-panel').open = true;
  }
  function on(id, fn) {
    $(id).addEventListener('click', async () => {
      const button = $(id); if (button.dataset.busy === 'true') return;
      button.dataset.busy = 'true'; button.disabled = true;
      try { await fn(); } catch (error) { status(error.message, true); }
      finally { button.dataset.busy = 'false'; button.disabled = false; renderJobs(); }
    });
  }
  function option(select, value, label) {
    const element = document.createElement('option'); element.value = value; element.textContent = label; select.append(element);
  }
  function item(container, title, detail, action, selected = false) {
    const element = document.createElement(action ? 'button' : 'div');
    element.className = 'm0-item'; element.dataset.selected = String(selected);
    if (action) { element.type = 'button'; element.addEventListener('click', action); }
    const strong = document.createElement('strong'); strong.textContent = title;
    const small = document.createElement('small'); small.textContent = detail;
    element.append(strong, small); container.append(element);
  }
  function paragraphs(id, entries) {
    const area = $(id); area.replaceChildren();
    for (const [label, value] of entries) {
      const p = document.createElement('p'), strong = document.createElement('strong');
      strong.textContent = label + ' '; p.append(strong, document.createTextNode(String(value))); area.append(p);
    }
  }

  async function writeNamespace(reason, update) {
    const api = base(), original = api.getSession();
    const migrated = await S.migrateSession(original, BASELINE);
    let ns = migrated.researchM0;
    if (!original.researchM0) ns = await S.addNode(ns, {kind:'SourceManifest', payload:examples.SourceManifest});
    ns = await update(ns, original);
    const result = await api.commitResearchM0(ns, {
      expectedSessionId: original.id, expectedM0Revision: original.researchM0?.revision ?? null, reason,
    });
    renderSession(); return result;
  }

  function renderSession() {
    let current;
    try { current = base().getSession(); } catch (error) { status(error.message, true); return; }
    const ns = current.researchM0;
    text('m0-session-title', current.title || current.id); text('m0-session-id', current.id);
    text('m0-revision', ns ? 'M0 revision ' + ns.revision : 'M0 연결 전');
    text('m0-node-count', (ns?.nodes.length || 0) + ' nodes');
    $('m0-object-list').replaceChildren(); $('m0-assumption-list').replaceChildren(); $('m0-edge-list').replaceChildren();
    if (!ns?.nodes.length) item($('m0-object-list'), '등록된 M0 대상이 없습니다.', '예제를 검사한 뒤 세션에 등록하세요.');
    for (const node of [...(ns?.nodes || [])].reverse()) {
      item($('m0-object-list'), node.id, node.kind + ' · ' + node.revision + ' · ' + node.freshness,
        () => { selectedNodeId = node.id; text('m0-node-detail', node); $('m0-node-detail').closest('details').open = true; }, selectedNodeId === node.id);
      if (node.payload.schema === 'MathScope.AssumptionSpec/1') item($('m0-assumption-list'), node.id,
        node.payload.origin + ' · ' + node.revision + ' · ' + node.payload.statement,
        () => { $('m0-assumption-id').value = node.id; $('m0-assumption-statement').value = node.payload.statement; $('m0-assumption-reason').value = node.payload.reason; });
    }
    for (const edge of ns?.edges || []) item($('m0-edge-list'), edge.from + ' → ' + edge.to, edge.type + ' · ' + edge.freshness + ' · ' + edge.proofStatus);
    const selected = ns?.nodes.find(n => n.id === selectedNodeId); if (selected) text('m0-node-detail', selected);
    $('m0-initialize').textContent = ns ? '현재 M0 연결 확인' : '현재 세션에 M0 연결';
  }
  function setTab(name, updateHash = true, focus = false) {
    if (!['objects','jobs','evidence','lean'].includes(name)) return;
    activeTab = name;
    for (const tab of root.querySelectorAll('[data-m0-tab]')) {
      const active = tab.dataset.m0Tab === name;
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      $('m0-panel-' + tab.dataset.m0Tab).hidden = !active;
      if (active && focus) tab.focus();
    }
    if (updateHash && root.classList.contains('active')) history.replaceState(null, '', '#research-foundation/' + name);
  }
  for (const tab of root.querySelectorAll('[data-m0-tab]')) {
    tab.addEventListener('click', () => setTab(tab.dataset.m0Tab));
    tab.addEventListener('keydown', event => {
      const names = ['objects','jobs','evidence','lean'], position = names.indexOf(activeTab);
      let next = position;
      if (event.key === 'ArrowRight') next = (position + 1) % 4;
      else if (event.key === 'ArrowLeft') next = (position + 3) % 4;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = 3;
      else return;
      event.preventDefault(); setTab(names[next], true, true);
    });
  }
  function loadContract() {
    const kind = $('m0-contract-kind').value, example = examples[kind];
    $('m0-contract-json').value = pretty(example); $('m0-object-id').value = example.id;
    text('m0-contract-result', '예제 준비 · 계약 검사는 수학적 가정의 증명을 뜻하지 않습니다.');
  }
  for (const [kind, label] of Object.entries(CONTRACT_LABELS)) option($('m0-contract-kind'), kind, label);
  $('m0-contract-kind').addEventListener('change', loadContract);
  on('m0-contract-example', loadContract);
  on('m0-contract-validate', () => {
    const result = C.validate($('m0-contract-kind').value, JSON.parse($('m0-contract-json').value));
    text('m0-contract-result', result); status(result.ok ? '입력 계약 통과 · 선언한 수학적 가정은 별도 검증 대상입니다.' : '계약 오류를 확인하세요.', !result.ok);
  });
  on('m0-contract-add', async () => {
    const kind = $('m0-contract-kind').value, payload = JSON.parse($('m0-contract-json').value), id = $('m0-object-id').value.trim();
    payload.id = id; if (payload.revision) payload.revision = id + ':r1';
    C.assertValid(kind, payload);
    await writeNamespace('Register ' + kind, ns => S.addNode(ns, {id, kind, payload}, {allowUnresolvedRefs:false}));
    text('m0-contract-result', {ok:true, id, status:'REGISTERED', trust:'DECLARED'}); status(id + '를 현재 세션에 등록했습니다.');
  });
  on('m0-schema-export', () => download('MathScope-' + $('m0-contract-kind').value + '-schema.json', C.SCHEMAS[$('m0-contract-kind').value]));
  on('m0-export-copy', async () => {
    try { await navigator.clipboard.writeText($('m0-export-content').value); status('JSON을 클립보드에 복사했습니다.'); }
    catch { $('m0-export-content').focus(); $('m0-export-content').select(); status('JSON을 선택했습니다. Ctrl+C 또는 Command+C로 복사하세요.'); }
  });
  on('m0-initialize', async () => { await writeNamespace('Connect M0 foundation', ns => ns); status('M0 연결 확인 완료 · 기존 대상과 증거 ID를 보존했습니다.'); });
  on('m0-capture', async () => {
    const getter = window.MathScopeResearchExtensions?.getObservation;
    if (!getter) throw Error('확장 관측 모듈을 사용할 수 없습니다.');
    const snapshot = getter(), original = base().getSession();
    const matched = (original.objects || []).find(n => n.id === 'rx-' + snapshot.module + '-object' && C.canonicalStringify(n.input) === C.canonicalStringify(snapshot.input));
    await writeNamespace('Capture extension ' + snapshot.module, async ns => {
      const legacyRefs = [], bindings = [];
      if (matched) for (const group of ['objects','representations','claims','evidence']) {
        for (const node of original[group] || []) if (node.id.startsWith('rx-' + snapshot.module + '-')) {
          const hash = await C.sha256(node), indexed = ns.legacyIndex.find(n => n.id === node.id && n.hash === hash);
          if (indexed) { legacyRefs.push({id:node.id, revision:node.revision || 'legacy-unversioned', hash}); bindings.push({group, node}); }
        }
      }
      const payload = {schema:'MathScope.LegacyObservation/1', module:snapshot.module, input:snapshot.input,
        scope:{kind:'FINITE',finite:{description:'One finite displayed observation; detailed input cutoffs and projection are retained in snapshot',itemCount:1}},
        legacyRefs, snapshot:{...snapshot, legacyBindings:bindings, bindingRule:'Only unchanged baseline-indexed legacy records with matching input are linked.'},
        grade:snapshot.conditionalClaim ? 'RESEARCH HYPOTHESIS' : 'NUMERICAL INDICATOR'};
      return S.addNode(ns, {id:'m0-observation:' + snapshot.module, kind:'LegacyObservation', payload});
    });
    status(snapshot.module + ' 관측의 입력·3D 표현·출처를 M0에 기록했습니다.');
  });
  on('m0-export', async () => {
    const session = base().getSession(); if (!session.researchM0) throw Error('먼저 M0를 연결하거나 대상을 등록하세요.');
    download('MathScope-M0-' + session.id + '.json', await S.exportSessionBundle(session));
    status('현재 세션과 M0 계약·의존 관계를 파일로 준비했습니다. 아래에서 다운로드하거나 JSON을 복사하세요.');
  });
  on('m0-import', () => $('m0-import-file').click());
  on('m0-revalidate-inputs', async () => {
    await writeNamespace('Recheck imported input contracts', async ns => S.revalidateImportedInputs(ns,{expectedBaselineHash:await C.sha256(BASELINE_JSON)}));
    status('입력의 계약·해시를 다시 확인했습니다. 기존 계산 결과와 Lean 증거는 재실행·재감사 대상입니다.');
  });
  $('m0-import-file').addEventListener('change', async () => {
    const file = $('m0-import-file').files[0]; if (!file) return;
    try {
      if (file.size > 8 * 1024 * 1024) throw Error('가져오기 한도는 8 MiB입니다.');
      const content = await file.text(), header = JSON.parse(content);
      if (header.schema === 'MathScope.ObservationBundle/1') {
        status('가져온 계산 묶음을 설치된 엔진으로 재현 중입니다.');
        const replay = await engine.replayBundle(content); selectedJobId = replay.job.id; renderJobs();
        text('m0-job-result', replay); setTab('jobs'); status('계산 묶음 재현: ' + replay.comparison.status); return;
      }
      if (header.schema === 'MathScope.CheckpointBundle/1') {
        const job = await engine.importCheckpoint(content); selectedJobId = job.id; renderJobs(); setTab('jobs');
        status('체크포인트를 가져왔습니다. 재개하면 저장된 계산 접두부를 다시 검사합니다.'); return;
      }
      const imported = await S.importSessionBundle(content, {expectedBaselineHash:await C.sha256(BASELINE_JSON)});
      if (imported.schema !== C.LEGACY_SESSION_SCHEMA) throw Error('화면에서 가져올 때는 전체 ResearchSession 묶음이 필요합니다.');
      const result = base().importVerifiedBundleSession(imported, 'MathScope M0 JSON');
      if (result?.ok === false) throw Error(result.error || pretty(result));
      renderSession(); status('별도 연구 세션으로 가져왔습니다. 저장된 검증 근거는 REVALIDATION_REQUIRED입니다.');
    } catch (error) { status('가져오기 실패: ' + error.message, true); }
    finally { $('m0-import-file').value = ''; }
  });

  async function loadJob() {
    const adapter = $('m0-adapter').value;
    $('m0-job-json').value = pretty(await Compute.createExampleJob(adapter)); text('m0-adapter-description', ADAPTER_DESCRIPTIONS[adapter]);
  }
  for (const [id,label] of Object.entries(ADAPTER_LABELS)) option($('m0-adapter'), id, label);
  $('m0-adapter').addEventListener('change', () => void loadJob().catch(error => status(error.message,true)));
  on('m0-job-example', loadJob);
  async function runRequest(input, {signal} = {}) {
    if (signal?.aborted) return {ok:false,state:'NOT_STARTED',code:'CANCELLED'};
    const original = base().getSession(), migrated = await S.migrateSession(original, BASELINE);
    const requested = clone(input); requested.id = nextId('m0-job');
    const prepared = await Integration.prepareSessionJob(requested, migrated.researchM0, capabilities);
    if (signal?.aborted) return {ok:false,state:'NOT_STARTED',code:'CANCELLED'};
    const job = await engine.submit(prepared.request);
    pendingJobs.set(job.id, {sessionId:original.id, prepared}); selectedJobId = job.id;
    if (signal) {
      const abort = () => { try { engine.cancel(job.id); } catch {} };
      signal.addEventListener('abort', abort, {once:true});
      void engine.wait(job.id).then(() => signal.removeEventListener('abort',abort));
      if (signal.aborted) abort();
    }
    renderJobs(); status((job.status === 'COMPLETED' ? '계산 완료' + (job.fromCache ? ' · 동일 입력 캐시' : '') : '계산 시작') + ' · ' + ADAPTER_LABELS[job.request.adapter.id]);
    return {ok:true,jobId:job.id,status:job.status,executionMode:job.executionMode};
  }
  on('m0-job-run', () => runRequest(JSON.parse($('m0-job-json').value)));
  function selectedJob() { if (!selectedJobId) throw Error('먼저 작업을 선택하세요.'); return engine.getJob(selectedJobId); }
  function renderJobs() {
    const jobs = engine.listJobs(); $('m0-job-list').replaceChildren();
    for (const job of [...jobs].reverse()) item($('m0-job-list'), ADAPTER_LABELS[job.request.adapter.id] || job.request.adapter.id,
      job.id + ' · ' + job.status + (job.fromCache ? ' · CACHE' : ''), () => { selectedJobId = job.id; renderJobs(); }, selectedJobId === job.id);
    const job = selectedJobId ? engine.getJob(selectedJobId) : null;
    text('m0-job-state', job?.status || 'IDLE'); $('m0-job-progress').value = job?.progress || 0;
    text('m0-job-progress-text', job ? Math.round(job.progress * 100) + '% · ' + job.executionMode + ' · 시도 ' + job.attempt : '아직 실행한 작업이 없습니다.');
    const result = job?.result;
    $('m0-job-cancel').disabled = !job || !['RUNNING','QUEUED','CANCEL_REQUESTED'].includes(job.status);
    $('m0-job-resume').disabled = !job || !['CANCELLED','BUDGET_EXCEEDED'].includes(job.status);
    $('m0-job-save').disabled = !result || !pendingJobs.has(job?.id);
    $('m0-job-export').disabled = !result;
    $('m0-job-replay').disabled = job?.status !== 'COMPLETED';
    if (result) {
      const vals = result.values || {}, lines = [];
      if (vals.count) lines.push(['소수 개수', V.formatValue(vals.count)]);
      if (vals.delta) lines.push(['δ(a)', V.formatValue(vals.delta)]);
      if (vals.result?.kind === 'REAL_INTERVAL') lines.push(['포함 구간', V.formatValue(vals.result)]);
      if (vals.product) {
        const zero = vals.product.every(row => row.every(value => value.kind === 'INTEGER' && value.value === '0'));
        lines.push(['행렬곱',zero ? '0 (' + vals.product.length + ' × ' + (vals.product[0]?.length || 0) + ' 영행렬)' : '[' + vals.product.map(row => '[' + row.map(V.formatValue).join(', ') + ']').join(', ') + ']']);
      }
      lines.push(['기록 등급', result.evidence.grade], ['검증 범위', result.evidence.scopeKind], ['입력 SHA-256', result.inputHash.slice(0,20) + '…']);
      if (result.message) lines.unshift(['실행 응답', result.message]);
      if (replayReports.has(job.id)) lines.push(['독립 재현',replayReports.get(job.id).comparison.status]);
      paragraphs('m0-result-summary',lines); text('m0-job-result',replayReports.has(job.id) ? {result,replay:replayReports.get(job.id).comparison} : result);
    } else { $('m0-result-summary').replaceChildren(); text('m0-job-result', job ? '계산 중 · 마지막 체크포인트를 유지합니다.' : '계산 결과가 여기에 표시됩니다.'); }
  }
  engine.subscribe(job => {
    renderJobs();
    if (job.id === selectedJobId && ['COMPLETED','CANCELLED','PRECISION_REQUIRED','BUDGET_EXCEEDED','FAILED','UNSUPPORTED'].includes(job.status)) status('계산 ' + job.status + ' · ' + job.id, ['FAILED','UNSUPPORTED'].includes(job.status));
  });
  on('m0-job-cancel', () => { const job = selectedJob(); engine.cancel(job.id); status('취소 요청을 보냈습니다. 마지막 체크포인트를 보존합니다.'); });
  on('m0-job-resume', async () => {
    const job = selectedJob();
    if (job.status === 'BUDGET_EXCEEDED') {
      const resource = job.result?.details?.resource;
      if (!['maxMillis','maxBytes','maxItems','maxOperations'].includes(resource)) throw Error('이 예산 오류는 자동 재개할 수 없습니다. 입력과 실행 한도를 확인하세요.');
      const previous = job.request.budget[resource], cap = Compute.COMPUTE_LIMITS[resource];
      const increased = Math.min(cap,Math.max(previous + 1,previous * 2));
      if (increased <= previous) throw Error('현재 어댑터의 ' + resource + ' 한도에 도달했습니다. 더 작은 유한 범위로 새 계산을 만드세요.');
      const budget = {...job.request.budget,[resource]:increased}, context = pendingJobs.get(job.id);
      if (context) {
        const current = base().getSession(); if (current.id !== context.sessionId) throw Error('이 작업을 시작한 연구 세션으로 돌아와 재개하세요.');
        const migrated = await S.migrateSession(current,BASELINE);
        context.prepared = await Integration.prepareSessionJob({...job.request,budget},migrated.researchM0,capabilities);
      }
      await engine.resume(job.id,{budget}); status('체크포인트 재개 · ' + resource + ' ' + previous + ' → ' + increased);
    } else { await engine.resume(job.id); status('체크포인트 재개 · ' + job.id); }
  });
  on('m0-job-save', async () => {
    const job = selectedJob(), context = pendingJobs.get(job.id);
    if (!context) throw Error('가져온 작업은 원래 모델의 세션 연결을 먼저 복원해야 합니다. 재현 묶음으로 보존할 수 있습니다.');
    if (context.sessionId !== base().getSession().id) throw Error('계산을 시작한 연구 세션으로 돌아온 뒤 저장하세요.');
    await writeNamespace('Record compute ' + job.id, ns => Integration.saveSessionJob(ns,context.prepared,job));
    status('입력 대상·계산 작업·결과·출처를 같은 세션에 기록했습니다.');
  });
  on('m0-job-export', async () => {
    const job = selectedJob(), checkpoint = ['CANCELLED','BUDGET_EXCEEDED'].includes(job.status);
    const content = checkpoint ? await engine.exportCheckpoint(job.id) : await engine.exportBundle(job.id);
    download('MathScope-M0-' + (checkpoint ? 'checkpoint-' : 'observation-') + job.id.replaceAll(':','-') + '.json', content);
    status(checkpoint ? '재개 가능한 체크포인트 파일을 준비했습니다.' : '입력·출력·출처·검사 기록·계산 소스가 담긴 파일을 준비했습니다.');
  });
  on('m0-job-replay', async () => {
    const sourceJob = selectedJob(), content = await engine.exportBundle(sourceJob.id), isolated = Compute.createComputeEngine();
    status('새 엔진으로 같은 입력을 다시 계산하고 있습니다.');
    try {
      const replay = await isolated.replayBundle(content); replayReports.set(sourceJob.id,replay); text('m0-job-result',replay);
      status('새 엔진 재현 검사: ' + replay.comparison.status + ' · 가져온 등급을 신뢰하지 않고 다시 계산했습니다.', replay.comparison.status !== 'MATCH');
    } finally { isolated.dispose(); }
  });
  on('m0-cloud-check', async () => {
    if (typeof window.MathScopeV031Stage3?.checkCloud !== 'function') throw Error('기존 계산 서버 연결 API를 사용할 수 없습니다.');
    text('m0-cloud-result','기존 계산 서버 응답 확인 중…');
    const response = await window.MathScopeV031Stage3.checkCloud();
    text('m0-cloud-result',{...response,m0LocalAdapters:'These four exact adapters run in the browser worker; no remote M0 adapter is claimed.'});
  });

  on('m0-assumption-add', async () => {
    const id = $('m0-assumption-id').value.trim();
    const payload = {...clone(examples.AssumptionSpec),id,revision:id + ':r1',statement:$('m0-assumption-statement').value.trim(),reason:$('m0-assumption-reason').value.trim()};
    await writeNamespace('Add USER_AXIOM ' + id, ns => S.addAssumption(ns,payload));
    text('m0-evidence-result',{id,origin:'USER_AXIOM',status:'DECLARED'}); status('사용자 가정을 등록했습니다. 이를 사용하는 주장은 조건부로 유지됩니다.');
  });
  on('m0-assumption-revise', async () => {
    const id = $('m0-assumption-id').value.trim(); let invalidated = [];
    await writeNamespace('Revise assumption ' + id, async ns => {
      const result = await S.reviseAssumption(ns,id,{statement:$('m0-assumption-statement').value.trim(),reason:$('m0-assumption-reason').value.trim()});
      invalidated = result.invalidated; return result.namespace;
    });
    text('m0-evidence-result',{revised:id,stale:invalidated,rule:'Only dependency descendants were invalidated.'});
    status('가정 수정 완료 · 의존 항목 ' + invalidated.length + '개 STALE');
  });
  $('m0-edge-json').value = pretty({id:'m0-example-edge',type:'DEPENDS_ON',from:'source-node-id',to:'dependent-node-id'});
  on('m0-edge-add', async () => {
    const edge = JSON.parse($('m0-edge-json').value);
    await writeNamespace('Add dependency ' + edge.id, ns => S.addEdge(ns,edge,{isVerifiedCertificate:Proof.isVerifiedProofReceipt}));
    text('m0-evidence-result',{ok:true,edgeId:edge.id}); status('검사한 의존 관계를 등록했습니다.');
  });
  on('m0-dependency-example', async () => {
    let info;
    await writeNamespace('Create selective-stale example', async ns => { info = await S.addDependencyExample(ns); return info.namespace; });
    $('m0-assumption-id').value = info.assumptionId;
    const assumption = base().getSession().researchM0.nodes.find(n => n.id === info.assumptionId);
    $('m0-assumption-statement').value = assumption.payload.statement; $('m0-assumption-reason').value = assumption.payload.reason;
    text('m0-evidence-result',{assumptionId:info.assumptionId,dependentIds:info.dependentIds,independentId:info.independentId,next:'Edit the assumption statement and select the revise button.'});
    status('가정 변경 예제를 만들었습니다. 진술을 수정하면 관련 주장 2개만 STALE가 됩니다.');
  });

  function showProofFile() {
    selectedFile = $('m0-proof-file').value;
    $('m0-proof-source').value = editedProof.sourceFiles.find(f => f.path === selectedFile)?.content || '';
  }
  function loadProof() {
    selectedBundle = Proof.getShippedProofBundle($('m0-proof-example').value);
    editedProof = clone(selectedBundle.jobSpec); proofEdit++; lastProof = null;
    $('m0-proof-file').replaceChildren();
    for (const file of editedProof.sourceFiles) option($('m0-proof-file'),file.path,file.path);
    $('m0-proof-file').value = editedProof.sourceFiles.at(-1).path; showProofFile();
    const meta = proofs.find(p => p.id === selectedBundle.id);
    paragraphs('m0-proof-summary', [['정리',meta.target],['학습 설명',meta.explanation.student],['연구 범위',meta.explanation.expert],['명시한 사용자 공리',meta.axioms.custom.join(', ') || '없음']]);
    text('m0-proof-status','NOT CHECKED'); text('m0-proof-result',{claimId:meta.claimId,scope:meta.scope,axioms:meta.axioms,status:'Exact audit comparison required.'});
  }
  for (const proof of proofs) option($('m0-proof-example'),proof.id,proof.label);
  $('m0-proof-example').addEventListener('change',loadProof); $('m0-proof-file').addEventListener('change',showProofFile);
  $('m0-proof-source').addEventListener('input', () => {
    const file = editedProof.sourceFiles.find(f => f.path === selectedFile); if (!file) return;
    file.content = $('m0-proof-source').value; proofEdit++; lastProof = null;
    text('m0-proof-status','STALE'); text('m0-proof-result','소스가 변경되었습니다. 이 내용에는 기존 커널 검사 기록을 적용할 수 없습니다. 새 ProofJob으로 내보낼 수 있습니다.');
  });
  async function checkSelectedProof() {
    const edit = proofEdit, spec = clone(editedProof), bundle = clone(selectedBundle);
    const job = await Proof.prepareProofJob(spec), result = await Proof.assessProofEvidence(job,bundle);
    if (edit !== proofEdit) return {ok:false,status:'STALE',reason:'Source changed during audit comparison.'};
    lastProof = {job,result};
    text('m0-proof-status',result.status); text('m0-proof-result',{job:{id:job.id,target:job.target,digests:job.digests,context:job.context},...result});
    status(result.verified ? '포함된 실제 Lean 검사와 소스·공리·환경이 일치합니다. 적용 범위는 오른쪽 정리의 명세입니다.' : '현재 소스의 감사 상태: ' + result.status);
    return {ok:result.verified,...result,jobId:job.id};
  }
  on('m0-proof-reset',loadProof); on('m0-proof-check',checkSelectedProof);
  on('m0-proof-save', async () => {
    const job = await Proof.prepareProofJob(clone(editedProof));
    await writeNamespace('Record ProofJob ' + job.target, ns => S.addNode(ns,{kind:'ProofJob',payload:job}));
    status('정확한 Lean 소스와 가정·환경을 ProofJob으로 기록했습니다. 임의의 세션 주장에 대한 증명 지위를 부여하지 않습니다.');
  });
  on('m0-proof-export', async () => {
    const job = await Proof.prepareProofJob(clone(editedProof));
    download('MathScope-M0-' + selectedBundle.id + '-ProofJob.json', Proof.exportProofRequest(job,selectedBundle));
    status('새 커널 검사에 필요한 Lean 소스·가정·의존 관계·환경을 파일로 준비했습니다.');
  });

  async function runChecks(options = {}) {
    if (checking) return checking;
    text('m0-check-result','별도 메모리에서 M0 기반 검사 실행 중…');
    $('m0-check-result').closest('details').open = true;
    checking = runM0Acceptance({...options,onProgress:result => text('m0-check-result',result)}).then(result => {
      lastChecks = result; text('m0-check-result',result); root.dataset.checksPass = String(result.pass);
      status('M0 기반 검사 ' + result.passed + '/' + result.total + ' · ' + (result.pass ? 'PASS' : '실패 항목 확인'),!result.pass); return result;
    }).finally(() => { checking = null; });
    return checking;
  }
  on('m0-check',runChecks);
  const api = Object.freeze({
    version:'1.0.0',
    getStatus() {
      const current = base().getSession(), ns = current.researchM0;
      return {ok:true,version:'1.0.0',session:{id:current.id,title:current.title,legacyRevision:current.sessionRevision,m0Revision:ns?.revision ?? null,
        legacyCounts:Object.fromEntries(['objects','representations','claims','evidence'].map(k=>[k,current[k]?.length || 0])),
        m0:ns ? S.dependencySummary(ns) : null},capabilities,
        jobs:engine.listJobs().map(j=>({id:j.id,status:j.status,adapter:j.request.adapter.id,progress:j.progress,fromCache:j.fromCache})),
        proof:{capabilities:Proof.getProofCapabilities(),selected:selectedBundle.id,status:lastProof?.result.status || (proofEdit ? $('m0-proof-status').textContent : 'NOT_CHECKED')},
        checks:lastChecks,releaseGate:'UNCHANGED / HOLD'};
    },
    validateContract:(kind,value)=>C.validate(kind,value),
    runFixture:async (adapter,options) => runRequest(await Compute.createExampleJob(adapter),options),
    getJobStatus:jobId => ({ok:true,job:engine.getJob(jobId)}),
    cancelJob:jobId => ({ok:true,cancelRequested:engine.cancel(jobId),job:engine.getJob(jobId)}),
    runChecks,checkSelectedProof,
  });
  window.MathScopeResearchM0 = api;
  async function registerTools() {
    toolRegistration = await registerM0Tools(api);
    const {dispose,...publicState} = toolRegistration; text('m0-webmcp-status',publicState);
  }
  window.addEventListener('pagehide', event => { toolRegistration?.dispose(); if (!event.persisted) { engine.dispose(); if (exportURL) URL.revokeObjectURL(exportURL); } });
  window.addEventListener('pageshow', event => { if (event.persisted) void registerTools(); });
  window.addEventListener('mathscope:session-rendered',renderSession);
  const nav = document.querySelector('[data-view-target="research-foundation"]');
  nav?.addEventListener('click', () => { setTab(activeTab); renderSession(); });
  for (const button of document.querySelectorAll('[data-view-target]')) button.addEventListener('click',event => {
    if (event.isTrusted && button.dataset.viewTarget !== 'research-foundation' && location.hash.startsWith('#research-foundation')) history.replaceState(null,'',location.pathname + location.search);
  });
  function route() {
    const match = location.hash.match(/^#research-foundation(?:\/(objects|jobs|evidence|lean))?$/);
    if (match) { activeTab = match[1] || 'objects'; nav?.click(); setTab(activeTab,false); }
  }
  window.addEventListener('hashchange',route);
  text('m0-runtime',capabilities.executionMode === 'BROWSER_WEB_WORKER' ? 'Browser Worker · 4 adapters' : 'Local runtime · 4 adapters');
  text('m0-proof-count',proofs.length + ' pinned proof bundles');
  text('m0-capabilities',capabilities); text('m0-proof-capabilities',Proof.getProofCapabilities()); text('m0-baseline',BASELINE);
  loadContract(); await loadJob(); loadProof(); renderSession(); renderJobs();
  root.dataset.mounted = 'true'; root.dataset.version = '1.0.0';
  await registerTools(); route();
  status('M0 준비 완료 · 대상을 등록하거나 정확한 작은 계산을 실행하세요.');
}

if (typeof document !== 'undefined') {
  const start = () => void bootM0().catch(error => {
    const status = document.getElementById('m0-status'); if (status) { status.textContent = 'M0 초기화 오류: ' + error.message; status.classList.add('m0-error'); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
}

return {bootM0};
})();
})();