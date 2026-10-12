/** P8 contracts bind data; they never turn serialized metadata into proof authority. */
import {prepareProofJob, proofSha256} from '../../mathscope-m0/proof.mjs';
import {OBJECT_KINDS,ARITHMETIC_MODES,PROOF_METHODS,NO_AUTHORITY,fail,shape,string,id,hashString,declaration,reference,references,assertJSON,canonicalJSON,sha256,cloneJSON,freeze,issue} from './common.mjs';
import {auditAssumptionLedger} from './assumptions.mjs';
export * from './common.mjs';
const COMMIT = /^[a-f0-9]{40}$/;

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
  shape(value,['leanVersion','leanCommit','mathlibCommit','runtimeLibrarySha256','importClosureSha256'],['toolchain','driverSha256','sourceManifestSha256','inputManifestSha256','consumerManifestSha256','leanBinarySha256','lakeManifestSha256','importedModuleCount','kernelModified','runtimeModified'],'pinned environment');
  string(value.leanVersion,'Lean version',500);
  if (!COMMIT.test(value.leanCommit) || value.mathlibCommit!==null && !COMMIT.test(value.mathlibCommit)) fail('INVALID_ENVIRONMENT','Exact Lean and optional mathlib commits are required.');
  for (const [key,v] of Object.entries(value)) if (key.endsWith('Sha256')) hashString(v,key);
  if (value.toolchain!==undefined) string(value.toolchain,'toolchain',240);
  if (value.importedModuleCount!==undefined && (!Number.isSafeInteger(value.importedModuleCount) || value.importedModuleCount<0)) fail('INVALID_ENVIRONMENT','Imported module count must be a nonnegative integer.');
  for (const field of ['kernelModified','runtimeModified']) if (value[field]!==undefined && value[field]!==false) fail('INVALID_ENVIRONMENT','A modified kernel or runtime cannot use this pinned finite certificate contract.');
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
