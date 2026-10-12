/** P8 contracts bind data; they never turn serialized metadata into proof authority. */
import {canonicalProofJSON, proofSha256, prepareProofJob} from '../../mathscope-m0/proof.mjs';

export const OBJECT_KINDS = Object.freeze(['CW_TOY', 'DERIVED_MODEL', 'PRISMATIC_VIA_COMPARISON', 'NATIVE_PRISMATIC']);
export const ARITHMETIC_MODES = Object.freeze(['EXACT', 'BALL', 'APPROXIMATE']);
export const PROOF_METHODS = Object.freeze(['NONE', 'LEAN_KERNEL', 'EXTERNAL_THEOREM', 'HYPOTHESIS']);
export const NO_AUTHORITY = Object.freeze({certificateIssued:false, formalComplete:false, wholeP8Complete:false, wholeM3Complete:false});
const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,239}$/;
const LEAN_NAME = /^[A-Za-z_][A-Za-z0-9_.']*$/;

export function fail(code, message) { throw Object.assign(new TypeError(message), {code}); }
export function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
export function shape(value, required, optional=[], label='object') {
  if (!isObject(value)) fail('INVALID_OBJECT', `${label} must be an ordinary JSON object.`);
  const allowed = new Set([...required, ...optional]);
  if (required.some(key => !Object.hasOwn(value, key)) || Object.keys(value).some(key => !allowed.has(key))) fail('INVALID_FIELDS', `${label} has missing or unsupported fields.`);
}
export function string(value, label, max=65536) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail('INVALID_STRING', `${label} must be nonempty text within its budget.`);
  // TextEncoder replaces isolated UTF-16 surrogates; reject before hashing.
  for (let i=0; i<value.length; i++) {
    const c=value.charCodeAt(i);
    if (c>=0xd800 && c<=0xdbff) { const d=value.charCodeAt(++i); if (!(d>=0xdc00 && d<=0xdfff)) fail('INVALID_UNICODE', `${label} contains an unpaired surrogate.`); }
    else if (c>=0xdc00 && c<=0xdfff) fail('INVALID_UNICODE', `${label} contains an unpaired surrogate.`);
  }
  return value;
}
export function id(value, label='id') { string(value,label,240); if (!ID.test(value)) fail('INVALID_ID', `${label} is not a supported identifier.`); return value; }
export function hashString(value, label='hash') { if (typeof value !== 'string' || !HASH.test(value)) fail('INVALID_HASH', `${label} must be a lower-case SHA-256.`); return value; }
export function declaration(value) { string(value,'Lean declaration',240); if (!LEAN_NAME.test(value)) fail('INVALID_DECLARATION','Use an explicit Lean declaration name.'); return value; }
export function reference(value) { shape(value,['id','revision','hash'],[],'reference'); id(value.id); string(value.revision,'reference revision',240); hashString(value.hash); return value; }
export function references(values, label='references') {
  if (!Array.isArray(values) || values.length>256) fail('REFERENCE_BUDGET', `${label} must be a bounded array.`);
  const ids=new Set(); for (const ref of values) { reference(ref); if (ids.has(ref.id)) fail('DUPLICATE_REFERENCE',`${label} contains duplicate IDs.`); ids.add(ref.id); }
}
export function assertJSON(value, maxBytes=2*1024*1024) {
  let count=0; const seen=new Set();
  function visit(v,depth) {
    if (++count>100000 || depth>48) fail('JSON_BUDGET','JSON nesting or item budget exceeded.');
    if (v===null || typeof v==='boolean') return;
    if (typeof v==='string') { if (v.length) string(v.trim() ? v : 'x','JSON text',maxBytes); return; }
    if (typeof v==='number') { if (!Number.isFinite(v) || Number.isInteger(v) && !Number.isSafeInteger(v)) fail('UNSAFE_JSON_NUMBER','Use exact strings for integers outside the safe integer range; nonfinite numbers are not data.'); return; }
    if (!Array.isArray(v) && !isObject(v)) fail('NON_JSON_VALUE','Only ordinary JSON values are accepted.');
    if (seen.has(v)) fail('JSON_CYCLE','Cyclic or aliased object references are not JSON input.'); seen.add(v);
    if (Object.getOwnPropertySymbols(v).length || Array.isArray(v) && (Object.keys(v).length!==v.length || Object.keys(v).some((k,i)=>k!==String(i)))) fail('NON_JSON_VALUE','Symbol properties, sparse arrays and array decorations are not JSON data.');
    if (!Array.isArray(v) && Object.getOwnPropertyNames(v).length!==Object.keys(v).length) fail('NON_JSON_VALUE','Hidden properties are not JSON data.');
    for (const key of Object.keys(v)) {
      string(key,'JSON key',1024);
      if (['__proto__','prototype','constructor'].includes(key)) fail('UNSAFE_KEY','Prototype-related keys are not supported.');
      const descriptor=Object.getOwnPropertyDescriptor(v,key);
      if (!descriptor || !Object.hasOwn(descriptor,'value')) fail('NON_JSON_VALUE','Accessor properties are not JSON data.');
      visit(descriptor.value,depth+1);
    }
    seen.delete(v);
  }
  visit(value,0);
  const text=canonicalProofJSON(value);
  if (new TextEncoder().encode(text).length>maxBytes) fail('JSON_BUDGET','Canonical JSON exceeds the byte budget.');
  return value;
}
export const canonicalJSON = value => canonicalProofJSON(assertJSON(value,16*1024*1024));
export const sha256 = value => proofSha256(typeof value==='string' ? string(value,'hashed text',16*1024*1024) : canonicalJSON(value));
export const cloneJSON = value => JSON.parse(canonicalJSON(value));
export function freeze(value) { if (value && typeof value==='object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
export function issue(error) { return {code:error.code || 'INVALID_CONTRACT',message:String(error.message || error)}; }

function target(value) { shape(value,['declaration','propositionId','type'],[],'proof target'); declaration(value.declaration); id(value.propositionId,'propositionId'); string(value.type,'target type'); }
function precision(value) {
  shape(value,[],['binaryBits','decimalDigits','pAdicDigits','seriesOrder','absoluteTolerance'],'precision');
  for (const [key,v] of Object.entries(value)) {
    if (key==='absoluteTolerance') { if (typeof v!=='string' || !/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(v) || v.length>200) fail('INVALID_PRECISION','absoluteTolerance must be a nonnegative decimal string.'); }
    else if (!Number.isSafeInteger(v) || v < (key==='seriesOrder'?0:1) || v>1000000) fail('INVALID_PRECISION',`${key} must be a bounded exact integer.`);
  }
}
export function validateObjectEvidence(value) {
  const issues=[];
  try {
    assertJSON(value);
    shape(value,['schema','id','revision','object','arithmetic','proof'],[],'P8 claim');
    if (value.schema!=='MathScope.M3.P8.Claim/1') fail('INVALID_SCHEMA','Unsupported P8 claim schema.');
    id(value.id); string(value.revision,'claim revision',240);
    shape(value.object,['id','kind','baseRef','coefficientRingRef'],[],'mathematical object');
    id(value.object.id); if (!OBJECT_KINDS.includes(value.object.kind)) fail('INVALID_OBJECT_KIND','Object kind is independent of numerical and proof evidence.');
    reference(value.object.baseRef); reference(value.object.coefficientRingRef);
    shape(value.arithmetic,['mode','scope','precision'],[],'arithmetic');
    if (!ARITHMETIC_MODES.includes(value.arithmetic.mode)) fail('INVALID_ARITHMETIC_MODE','Arithmetic mode must be an explicit enum, never a numerical grade.');
    shape(value.arithmetic.scope,['kind','description'],['bounds'],'arithmetic scope');
    if (!['FINITE','SYMBOLIC'].includes(value.arithmetic.scope.kind)) fail('INVALID_SCOPE','Declare finite or symbolic scope.');
    string(value.arithmetic.scope.description,'scope description'); precision(value.arithmetic.precision);
    shape(value.proof,['method','target','sourceRefs','assumptionRefs'],[],'proof declaration');
    if (!PROOF_METHODS.includes(value.proof.method)) fail('INVALID_PROOF_METHOD','Proof method must be an explicit enum, never a numerical grade.');
    target(value.proof.target); references(value.proof.sourceRefs,'sourceRefs'); references(value.proof.assumptionRefs,'assumptionRefs');
  } catch (error) { issues.push(issue(error)); }
  return freeze({ok:issues.length===0,issues,authority:'STRUCTURAL_VALIDATION_ONLY',...NO_AUTHORITY});
}

function environment(value) {
  shape(value,['leanVersion','leanCommit','mathlibCommit','runtimeLibrarySha256','importClosureSha256'],['toolchain','driverSha256','sourceManifestSha256','inputManifestSha256','consumerManifestSha256'],'pinned environment');
  string(value.leanVersion,'Lean version',500);
  if (!COMMIT.test(value.leanCommit) || value.mathlibCommit!==null && !COMMIT.test(value.mathlibCommit)) fail('INVALID_ENVIRONMENT','Exact Lean and optional mathlib commits are required.');
  for (const [key,v] of Object.entries(value)) if (key.endsWith('Sha256')) hashString(v,key);
  if (value.toolchain!==undefined) string(value.toolchain,'toolchain',240);
}

/** Binds exact declared inputs. Even a matching binding has no compiler authority. */
export async function bindP8Claim(input) {
  assertJSON(input,8*1024*1024);
  const body=cloneJSON(input); // Snapshot before any await: caller edits cannot mix revisions.
  shape(body,['claim','sourceFiles','environment','input','precision','assumptionLedger','dependencyGraph'],[],'binding request');
  const validation=validateObjectEvidence(body.claim); if (!validation.ok) fail(validation.issues[0].code,validation.issues[0].message);
  environment(body.environment); precision(body.precision);
  if (canonicalJSON(body.precision)!==canonicalJSON(body.claim.arithmetic.precision)) fail('PRECISION_BINDING_MISMATCH','The claim and run must use the same precision contract.');
  if (!Array.isArray(body.sourceFiles) || !body.sourceFiles.length || body.sourceFiles.length>128) fail('SOURCE_BUDGET','Bind one to 128 source files.');
  const sourceFiles=[], paths=new Set(); let sourceBytes=0;
  for (const file of body.sourceFiles) {
    shape(file,['path','content'],[],'source file'); string(file.path,'source path',500);
    if (!/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(?:lean|mjs|js|py|json)$/.test(file.path) || file.path.split('/').some(x=>x==='.'||x==='..') || paths.has(file.path)) fail('INVALID_SOURCE_PATH','Use distinct relative source paths without traversal.');
    if (typeof file.content!=='string') fail('INVALID_SOURCE','Source content must be text.');
    if (file.content) string(file.content,'source content',2*1024*1024);
    sourceBytes+=new TextEncoder().encode(file.content).length;
    if (sourceBytes>2*1024*1024) fail('SOURCE_BUDGET','Source text exceeds 2 MiB.');
    paths.add(file.path); sourceFiles.push({...file,sha256:await proofSha256(file.content)});
  }
  sourceFiles.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  const {auditAssumptionLedger}=await import('./assumptions.mjs');
  const ledgerAudit=auditAssumptionLedger(body.assumptionLedger);
  if (!ledgerAudit.ok) fail(ledgerAudit.issues[0].code,ledgerAudit.issues[0].message);
  const lt=body.assumptionLedger.target, ct=body.claim.proof.target;
  if (lt.claimId!==body.claim.id || lt.declaration!==ct.declaration || lt.type!==ct.type || lt.propositionId!==ct.propositionId) fail('TARGET_BINDING_MISMATCH','Ledger and claim must bind the identical target declaration, proposition ID and type.');
  if (canonicalJSON(body.dependencyGraph)!==canonicalJSON(body.assumptionLedger.dependencyGraph)) fail('DEPENDENCY_BINDING_MISMATCH','Ledger and run dependency graphs differ.');
  const declared=body.assumptionLedger.entries.map(e=>e.id).sort();
  if (canonicalJSON(body.claim.proof.assumptionRefs.map(r=>r.id).sort())!==canonicalJSON(declared)) fail('ASSUMPTION_BINDING_MISMATCH','Every declared assumption must have one exact claim reference.');
  for (const entry of body.assumptionLedger.entries) {
    const ref=body.claim.proof.assumptionRefs.find(r=>r.id===entry.id);
    if (ref.revision!==entry.revision || ref.hash!==await sha256(entry)) fail('ASSUMPTION_BINDING_MISMATCH','Claim assumption reference does not match the actual ledger entry.');
  }
  const digests={};
  for (const [key,value] of Object.entries({claim:body.claim,source:sourceFiles.map(({path,sha256})=>({path,sha256})),environment:body.environment,input:body.input,precision:body.precision,base:body.claim.object.baseRef,ring:body.claim.object.coefficientRingRef,target:ct,assumptions:body.assumptionLedger,dependency:body.dependencyGraph})) digests[key]=await sha256(value);
  digests.binding=await sha256({schema:'MathScope.M3.P8.Binding/1',...digests});
  let proofRequest=null;
  if (body.claim.proof.method==='LEAN_KERNEL') {
    const leanSources=sourceFiles.filter(f=>f.path.endsWith('.lean')).map(({path,content})=>({path,content}));
    if (!leanSources.length) fail('LEAN_SOURCE_REQUIRED','A Lean proof request needs actual Lean source.');
    proofRequest=await prepareProofJob({claimId:body.claim.id,target:ct.declaration,requestedGrade:body.assumptionLedger.entries.some(e=>e.kind==='USER_AXIOM')?'CONDITIONAL_FORMAL':'EXACT_FINITE',sourceFiles:leanSources,assumptions:body.assumptionLedger.entries.map(e=>({...e,kind:e.kind.toLowerCase()})),dependencyGraph:{nodes:body.dependencyGraph.nodes,edges:body.dependencyGraph.edges},environment:body.environment,context:{p8Binding:digests.binding,targetType:ct.type,input:body.input,precision:body.precision,baseRef:body.claim.object.baseRef,coefficientRingRef:body.claim.object.coefficientRingRef}});
  }
  return freeze({schema:'MathScope.M3.P8.Binding/1',...body,sourceFiles,digests,proofRequest,status:'BOUND_REVALIDATION_REQUIRED',authority:'DATA_BINDING_ONLY',...NO_AUTHORITY});
}

export async function verifyP8Binding(record,current) {
  try {
    assertJSON(record,16*1024*1024);
    record=cloneJSON(record); if (current!==undefined) current=cloneJSON(current);
    shape(record,['schema','claim','sourceFiles','environment','input','precision','assumptionLedger','dependencyGraph','digests','proofRequest','status','authority',...Object.keys(NO_AUTHORITY)],[],'binding record');
    if (record.schema!=='MathScope.M3.P8.Binding/1' || record.status!=='BOUND_REVALIDATION_REQUIRED' || record.authority!=='DATA_BINDING_ONLY' || Object.keys(NO_AUTHORITY).some(k=>record[k]!==false)) fail('IMPORTED_AUTHORITY_REJECTED','Serialized bindings cannot claim proof authority.');
    const request={}; for (const k of ['claim','environment','input','precision','assumptionLedger','dependencyGraph']) request[k]=cloneJSON(record[k]);
    request.sourceFiles=record.sourceFiles.map(f=>({path:f.path,content:f.content}));
    const recomputed=await bindP8Claim(request);
    if (canonicalJSON(record)!==canonicalJSON(recomputed)) fail('BINDING_INTEGRITY_MISMATCH','The record differs from its recomputed sources, metadata or binding.');
    if (!current) return freeze({ok:false,status:'CURRENT_BINDING_REQUIRED',integrity:'CONSISTENT',mismatchedBindings:[],...NO_AUTHORITY});
    const fresh=await bindP8Claim(current), mismatchedBindings=Object.keys(fresh.digests).filter(k=>fresh.digests[k]!==record.digests[k]);
    return freeze({ok:mismatchedBindings.length===0,status:mismatchedBindings.length?'STALE':'BINDINGS_MATCH_UNVERIFIED',integrity:'CONSISTENT',mismatchedBindings,...NO_AUTHORITY});
  } catch (error) { return freeze({ok:false,status:'BINDING_REJECTED',issues:[issue(error)],...NO_AUTHORITY}); }
}
