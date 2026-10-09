/** Additive ResearchSession extension. Mathematical trust never comes from JSON. */
import { validate, SCHEMAS, canonicalStringify, sha256, LEGACY_SESSION_SCHEMA, EDGE_TYPES, validateProofEdge, getContractExamples, containsUserAxiom } from './contracts.mjs';

export const M0_SCHEMA='MathScope.ResearchM0/1';
export const SESSION_BUNDLE_SCHEMA='MathScope.M0SessionBundle/1';
const clone=value=>JSON.parse(canonicalStringify(value));
const HASH=/^[0-9a-f]{64}$/;
const NODE_KINDS=new Set(['object','assumption','claim','observation','legacyObservation','computeJob','result','source','proof']);
const LEGACY_GROUPS=['objects','representations','functionSpaces','differentialSystems','optimizations','operators','pdes','spectra','geometries','topologies','entropies','symmetries','kclasses','claims','evidence','assumptions','researchRuns','replayJobs'];
const PROOF_EDGES=new Set(['LOCAL_TO_GLOBAL','BASE_CHANGE','PROJECTION','LIMIT','VERIFIED_BY']);
const KIND_MAP=Object.freeze({M1ObjectSpec:'object',PrismSpec:'object',PrimeQuerySpec:'object',GaugeGroupSpec:'object',StateFamilySpec:'object',PDEConstructionSpec:'object',AssumptionSpec:'assumption',AssumptionLedger:'assumption',ClaimSpec:'claim',ObservationMapSpec:'observation',LegacyObservation:'legacyObservation',ComputeJobSpec:'computeJob',ResultEnvelope:'result',SourceManifest:'source',ProofJob:'proof'});
const CURRENT='CURRENT';
const nsOf=value=>value?.schema===M0_SCHEMA?value:value?.researchM0;
function wrap(original,ns) {if(original.schema===M0_SCHEMA)return ns;const out=clone(original);out.researchM0=ns;return out;}
function fail(message) {throw new Error(`MathScope M0: ${message}`);}
export function referenceOf(node) {return {id:node.id,revision:node.revision,hash:node.hash};}
export function normalizeNodeKind(kind) {const normalized=KIND_MAP[kind]||kind;if(!NODE_KINDS.has(normalized))fail(`Unknown node kind ${kind}`);return normalized;}
export function getSessionNodeKinds() {return {...KIND_MAP};}

function schemaKind(payload) {
  if(payload?.schemaVersion==='mathscope.proof-job/1')return 'ProofJob';
  return typeof payload?.schema==='string'?payload.schema.match(/^MathScope\.([^/]+)\/1$/)?.[1]:null;
}
function payloadReport(node) {
  const kind=schemaKind(node.payload);
  if (kind&&SCHEMAS[kind]) {
    const allowed={object:['M1ObjectSpec','PrismSpec','PrimeQuerySpec','GaugeGroupSpec','StateFamilySpec','PDEConstructionSpec'],assumption:['AssumptionSpec','AssumptionLedger'],claim:['ClaimSpec'],observation:['ObservationMapSpec'],legacyObservation:['LegacyObservation'],computeJob:['ComputeJobSpec'],result:['ResultEnvelope'],source:['SourceManifest'],proof:['ProofJob']};
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
export function validateResearchM0Namespace(ns) {
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
export async function verifyResearchM0Namespace(ns) {
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
export async function migrateSession(legacy,baseline) {
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

export async function createNode({id,kind,payload,revision}) {
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
export async function addNode(sessionOrNamespace,input,{allowUnresolvedRefs=true}={}) {
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
export const upsertNode=addNode;

/** Live receipts are consulted at insertion, then persisted only as audit refs. */
export async function addEdge(sessionOrNamespace,edge,{isVerifiedCertificate}={}) {
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

export async function reviseAssumption(sessionOrNamespace,id,replacement) {
  const ns=nsOf(sessionOrNamespace);await assertNamespace(ns);
  const old=ns.nodes.find(n=>n.id===id&&n.kind==='assumption');if(!old)fail('Assumption node not found');
  if(schemaKind(old.payload)!=='AssumptionSpec')fail('Revise individual assumption records, not a whole ledger');
  const payload=typeof replacement==='string'?{...clone(old.payload),statement:replacement}:{...clone(old.payload),...clone(replacement)};
  if(payload.id!==id)fail('Revision cannot change assumption identity');
  if(old.payload.origin==='USER_AXIOM'&&payload.origin!=='USER_AXIOM')fail('A USER_AXIOM cannot be silently relabeled; introduce a separate proved statement with provenance');
  const updated=await addNode(sessionOrNamespace,{id,kind:'assumption',payload});
  return {session:updated,namespace:nsOf(updated),invalidated:[...downstream(ns,[id])]};
}
export async function addAssumption(sessionOrNamespace,payload) {return addNode(sessionOrNamespace,{id:payload.id,kind:'assumption',payload});}

export function effectiveNodeState(sessionOrNamespace,id) {
  const ns=nsOf(sessionOrNamespace),node=ns?.nodes.find(n=>n.id===id);
  if(!node)return null;
  return {id,revision:node.revision,freshness:node.freshness,recordedGrade:node.payload.grade||node.payload.evidence?.grade||null,effectiveTrust:node.effectiveTrust,supportsCurrent:false,staleReasons:[...node.staleReasons]};
}
export function dependencySummary(sessionOrNamespace) {
  const ns=nsOf(sessionOrNamespace);
  return {nodes:ns.nodes.length,edges:ns.edges.length,history:ns.history.length,stale:ns.nodes.filter(n=>n.freshness==='STALE').map(n=>n.id),revision:ns.revision};
}

export function quarantineResearchM0Namespace(ns,{integrity='NOT_CHECKED'}={}) {
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
export async function exportSessionBundle(sessionOrNamespace) {
  const ns=nsOf(sessionOrNamespace);await assertNamespace(ns);
  const payload=clone(sessionOrNamespace);
  const manifest={schema:SESSION_BUNDLE_SCHEMA,version:'1.0.0',kind:payload.schema===M0_SCHEMA?'namespace':'session',payload,payloadHash:await sha256(payload),trust:'INTEGRITY_ONLY_REPLAY_REQUIRED'};
  return canonicalStringify(manifest);
}
export async function importSessionBundle(text,{maxBytes=10*1024*1024,expectedBaselineHash}={}) {
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
export const exportM0Session=exportSessionBundle;
export const importM0Session=importSessionBundle;

/** Explicit user action: recheck imported input definitions, never old results. */
export async function revalidateImportedInputs(sessionOrNamespace,{expectedBaselineHash}={}) {
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
export async function addDependencyExample(sessionOrNamespace) {
  const examples=await getContractExamples();let state=sessionOrNamespace;
  for(const kind of ['SourceManifest','AssumptionSpec','PrimeQuerySpec','ClaimSpec'])state=await addNode(state,{kind,payload:examples[kind]});
  const snapshot={schema:'MathScope.LegacyObservation/1',module:'yangmills',input:{delta:1,mode:'ASSUMED_BOUND'},scope:{kind:'FINITE',finite:{description:'One displayed conditional interpretation; this is metadata, not a field computation',itemCount:1}},legacyRefs:[],snapshot:{interpretation:'The current classical density does not determine the quantum mass gap.'},grade:'RESEARCH HYPOTHESIS'};
  state=await addNode(state,{id:'m0-gap-interpretation',kind:'LegacyObservation',payload:snapshot});
  const ns=nsOf(state);
  if(!ns.edges.some(e=>e.id==='demo:claim-to-interpretation'))state=await addEdge(state,{id:'demo:claim-to-interpretation',type:'DEPENDS_ON',from:'m0-gap-claim',to:'m0-gap-interpretation'});
  return {session:state,namespace:nsOf(state),assumptionId:'m0-assume-gap',dependentIds:['m0-gap-claim','m0-gap-interpretation'],independentId:'m0-primes'};
}
