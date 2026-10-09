/** MathScope M0 / I0. JSON contracts describe scope; they never establish a theorem. */
export const CONTRACT_VERSION = '1.0.0';
export const VERSION = CONTRACT_VERSION;
export const LEGACY_SESSION_SCHEMA = 'MathScopeResearchSession/0.3.1-foundation.1';
export const EVIDENCE_GRADES = Object.freeze(['FORMAL PASS','THEOREM-BACKED','CERTIFIED NUMERICAL','NUMERICAL INDICATOR','EMPIRICAL CORRESPONDENCE','RESEARCH HYPOTHESIS','UNKNOWN','STALE']);
export const EDGE_TYPES = Object.freeze(['LOCAL_TO_GLOBAL','BASE_CHANGE','PROJECTION','LIMIT','ASSUMES','COMPUTES','VERIFIED_BY','DEPENDS_ON','CITES']);
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
export const SCHEMAS = Object.freeze({
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
export function canonicalStringify(value) {
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
export async function sha256(value) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 requires WebCrypto; no non-cryptographic fallback is allowed');
  const bytes=new TextEncoder().encode(typeof value==='string'?value:canonicalStringify(value));
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export const hashValue=sha256;
export class ContractError extends Error { constructor(kind,errors) {super(`${kind}: ${errors.join('; ')}`);this.name='ContractError';this.kind=kind;this.errors=errors;} }

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
export function validate(kind,value) {
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
    const kinds={'arithmetic.primes':'PrimeSetQuery','arithmetic.primeCertificate':'PrimeSetQuery','arithmetic.padic':'PadicObject','arithmetic.point':'PointComparison','arithmetic.p1':'P1Comparison','arithmetic.localFactors':'LocalFactorFamily','arithmetic.verify':'ValidationFixture','gauge.group':'GaugeGroup','gauge.field':'Connection4D','gauge.family':'StateFamily','gauge.holonomy':'Holonomy','gauge.spectral':'SpectralModel','ns.provenance':'NavierStokesComponent','ns.coordinates':'NavierStokesComponent','ns.heat':'NavierStokesComponent','ns.exterior':'NavierStokesComponent','ns.axis-series':'NavierStokesComponent','ns.moments':'NavierStokesComponent','ns.cone':'NavierStokesComponent','ns.benchmark':'NavierStokesComponent','ns.leading-profile':'LeadingProfileCandidate','ns.validate':'ValidationFixture','ns.axis-certificate':'NavierStokesComponent','ns.source-outer':'NavierStokesComponent','ns.controlled-continuation':'NavierStokesComponent','ns.admissible-loop':'NavierStokesComponent','ns.pressure-certificate':'NavierStokesComponent','ns.axis-source-certificate':'NavierStokesComponent','ns.radial-modulation':'NavierStokesComponent'};
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
export function containsUserAxiom(payload) {return payload?.origin==='USER_AXIOM'||(payload?.schema==='MathScope.AssumptionLedger/1'&&payload.assumptions.some(a=>a.origin==='USER_AXIOM'));}
export function assertValid(kind,value) {const report=validate(kind,value);if(!report.ok)throw new ContractError(kind,report.errors);return value;}
export const validateComputeJobSpec=value=>validate('ComputeJobSpec',value);
export const validateResultEnvelope=value=>validate('ResultEnvelope',value);
export const validatePrismSpec=value=>validate('PrismSpec',value);
export function effectiveEvidenceTrust(record,{receipt,isVerifiedProofReceipt}={}) {
  // Display the audited receipt itself.  A second metadata record cannot borrow
  // its authority merely by sharing a claim ID or copying a digest field.
  const directReceipt=record&&(!receipt||record===receipt)?record:null;
  if (directReceipt&&typeof isVerifiedProofReceipt==='function'&&isVerifiedProofReceipt(directReceipt)) return {status:'LOCAL_AUDIT_VERIFIED',grade:directReceipt.grade,conditional:directReceipt.grade==='CONDITIONAL_FORMAL'||directReceipt.axioms?.custom?.length>0,scope:directReceipt.scope,claimId:directReceipt.claimId};
  return {status:'REVALIDATION_REQUIRED',grade:record?.grade||'UNKNOWN',conditional:record?.scopeKind==='conditional-formal',scope:record?.scopeKind||'historical-metadata'};
}
/** Semantic restrictions on an edge are independent of diagram placement. */
export function validateProofEdge(edge,nodes,{isVerifiedCertificate}={}) {
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
export async function getContractExamples() {
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
