/** Exact assumption identities and dependency direction; no imported-audit authority. */
import {auditDependencyGraph} from '../../mathscope-m0/proof.mjs';
import {NO_AUTHORITY,assertJSON,canonicalJSON,cloneJSON,shape,string,id,declaration,references,fail,freeze,issue} from './contracts.mjs';

export const STANDARD_AXIOMS=Object.freeze(['Classical.choice','Quot.sound','propext']);
const KINDS=Object.freeze({USER_AXIOM:'user_axiom',HYPOTHESIS:'hypothesis',EXTERNAL_THEOREM:'reference',OPEN_OBLIGATION:'open'});
const NODE_KINDS=new Set(['theorem','definition','hypothesis','user_axiom','reference','open','imported_theorem']);
const normalizeStatement=value=>value.replace(/\s+/g,' ').trim();
const sortedSet=values=>[...new Set(values)].sort();

function checkLedger(ledger) {
  assertJSON(ledger);
  shape(ledger,['schema','target','entries','dependencyGraph'],[],'assumption ledger');
  if (ledger.schema!=='MathScope.M3.P8.AssumptionLedger/1') fail('INVALID_SCHEMA','Unsupported assumption ledger schema.');
  shape(ledger.target,['claimId','declaration','propositionId','type'],[],'ledger target');
  id(ledger.target.claimId); declaration(ledger.target.declaration); id(ledger.target.propositionId); string(ledger.target.type,'target type');
  if (!Array.isArray(ledger.entries) || ledger.entries.length>256) fail('ASSUMPTION_BUDGET','Use at most 256 explicit assumptions.');
  const ids=new Set(), declarations=new Set();
  for (const entry of ledger.entries) {
    shape(entry,['id','revision','kind','declaration','propositionId','statement','sourceRefs'],[],'assumption');
    id(entry.id); string(entry.revision,'assumption revision',240); id(entry.propositionId); string(entry.statement,'assumption statement'); references(entry.sourceRefs,'assumption source refs');
    if (!Object.hasOwn(KINDS,entry.kind)) fail('INVALID_ASSUMPTION_KIND','Use an explicit assumption kind.');
    if (ids.has(entry.id)) fail('DUPLICATE_ASSUMPTION','Assumption IDs must be unique.'); ids.add(entry.id);
    if (entry.kind==='USER_AXIOM' && entry.declaration===null) fail('AXIOM_DECLARATION_REQUIRED','Every user axiom must name its Lean declaration.');
    if (entry.declaration!==null) {
      declaration(entry.declaration);
      if (declarations.has(entry.declaration)) fail('DUPLICATE_DECLARATION','A Lean declaration cannot stand for two ledger assumptions.'); declarations.add(entry.declaration);
    }
  }
  const graph=ledger.dependencyGraph;
  shape(graph,['direction','nodes','edges'],[],'dependency graph');
  if (graph.direction!=='CLAIM_TO_PREREQUISITE') fail('DEPENDENCY_DIRECTION','P8 proof dependencies point from claim to prerequisite.');
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges) || graph.nodes.length>1024 || graph.edges.length>4096) fail('GRAPH_BUDGET','The dependency graph exceeds its budget.');
  const nodes=new Map();
  for (const node of graph.nodes) {
    shape(node,['id','kind','statement','propositionId'],['declaration'],'dependency node');
    id(node.id); string(node.statement,'node statement'); id(node.propositionId);
    if (!NODE_KINDS.has(node.kind) || nodes.has(node.id)) fail('INVALID_NODE','Dependency node kind or identity is invalid.');
    if (node.declaration!==undefined) declaration(node.declaration);
    nodes.set(node.id,node);
  }
  const target=nodes.get(ledger.target.claimId);
  if (!target || target.kind!=='theorem' || target.propositionId!==ledger.target.propositionId || target.statement!==ledger.target.type || target.declaration!==ledger.target.declaration) fail('TARGET_BINDING_MISMATCH','The graph target must exactly match the declared theorem and its type.');
  for (const entry of ledger.entries) {
    const node=nodes.get(entry.id);
    if (!node || node.kind!==KINDS[entry.kind] || node.statement!==entry.statement || node.propositionId!==entry.propositionId || (node.declaration??null)!==entry.declaration) fail('ASSUMPTION_NODE_MISMATCH','Each assumption must match its graph node exactly.');
  }
  for (const node of nodes.values()) if (Object.values(KINDS).includes(node.kind) && !ids.has(node.id)) fail('UNDECLARED_ASSUMPTION','Every hypothesis, axiom, reference and open obligation needs a ledger entry.');
  const edges=new Set();
  for (const edge of graph.edges) {
    shape(edge,['from','to','type'],[],'dependency edge');
    if (edge.type!=='DEPENDS_ON' || !nodes.has(edge.from) || !nodes.has(edge.to)) fail('INVALID_EDGE','Dependencies require existing endpoints and DEPENDS_ON.');
    const key=`${edge.from}\u0000${edge.to}`;
    if (edges.has(key)) fail('DUPLICATE_EDGE','Duplicate dependency edge.'); edges.add(key);
  }
  const structural=auditDependencyGraph(graph,ledger.target.claimId,{requestedGrade:'CONDITIONAL_FORMAL',closeResearchGate:true});
  // Also inspect disconnected components: a hidden cycle cannot become valid later.
  for (const node of graph.nodes) {
    const check=auditDependencyGraph(graph,node.id,{requestedGrade:'CONDITIONAL_FORMAL'});
    const fatal=check.issues.find(x=>['DEPENDENCY_CYCLE','INVALID_EDGE','INVALID_NODE','INVALID_NODE_KIND'].includes(x.code));
    if (fatal) fail(fatal.code,fatal.message);
  }
  return {nodes,structural};
}

function kernelConsistency(ledger,kernelAudit,usedEntries) {
  assertJSON(kernelAudit,8*1024*1024);
  if (kernelAudit.schema!=='MathScope.M3.P8.LeanAudit/1' || !Array.isArray(kernelAudit.targets)) fail('INVALID_KERNEL_AUDIT','Expected a P8 LeanAudit/1 with explicit target records.');
  if (kernelAudit.status!=='KERNEL_CHECKED_FINITE_SCOPES' || kernelAudit.serializedAuthority!=='UNTRUSTED_REQUIRES_REEXECUTION') fail('INVALID_KERNEL_AUDIT','Only a successful scoped audit with untrusted serialization semantics may be compared.');
  const targets=kernelAudit.targets.filter(t=>t.name===ledger.target.declaration);
  if (targets.length!==1 || targets[0].type!==ledger.target.type) fail('KERNEL_TARGET_MISMATCH','The audit must contain exactly the requested declaration with its exact theorem type.');
  const chosen=targets[0];
  shape(chosen.axioms,['all','standard','custom'],[],'kernel axioms');
  for (const values of Object.values(chosen.axioms)) {
    if (!Array.isArray(values) || values.length>256 || values.some(x=>typeof x!=='string')) fail('INVALID_AXIOM_LIST','Axiom lists must be explicit bounded declaration-name arrays.');
    values.forEach(declaration);
    if (new Set(values).size!==values.length) fail('INVALID_AXIOM_LIST','Duplicate axiom names are not accepted.');
  }
  const all=sortedSet(chosen.axioms.all), standard=all.filter(x=>STANDARD_AXIOMS.includes(x)), custom=all.filter(x=>!STANDARD_AXIOMS.includes(x));
  if (all.some(x=>/(?:^|\.)sorryAx$/.test(x))) fail('SORRY_AXIOM','A sorryAx dependency is never a completed finite certificate.');
  if (canonicalJSON(standard)!==canonicalJSON(sortedSet(chosen.axioms.standard)) || canonicalJSON(custom)!==canonicalJSON(sortedSet(chosen.axioms.custom))) fail('AXIOM_PARTITION_MISMATCH','The standard/custom lists must exactly partition the actual axiom list.');
  const declared=sortedSet(usedEntries.filter(e=>e.kind==='USER_AXIOM').map(e=>e.declaration));
  if (canonicalJSON(declared)!==canonicalJSON(custom)) fail('AXIOM_LEDGER_MISMATCH','Actual custom axioms and the target closure ledger must match in both directions.');
  return {status:'CONSISTENT_UNTRUSTED',all,standard,custom,target:chosen.name,type:chosen.type};
}

export function auditAssumptionLedger(ledger,{kernelAudit}={}) {
  try {
    const {structural}=checkLedger(ledger), closure=structural.closure;
    const used=ledger.entries.filter(e=>closure.includes(e.id));
    const assumedTarget=used.filter(e=>['USER_AXIOM','HYPOTHESIS'].includes(e.kind) && (e.id===ledger.target.claimId || e.propositionId===ledger.target.propositionId || e.declaration===ledger.target.declaration || normalizeStatement(e.statement)===normalizeStatement(ledger.target.type))).map(e=>e.id);
    const status=assumedTarget.length?'CONDITIONAL_ON_TARGET':used.some(e=>e.kind==='OPEN_OBLIGATION')?'RESEARCH_OPEN':used.some(e=>e.kind==='EXTERNAL_THEOREM')?'THEOREM_REFERENCE_ONLY':used.some(e=>['USER_AXIOM','HYPOTHESIS'].includes(e.kind))?'CONDITIONAL':'NO_EXTRA_ASSUMPTIONS';
    const axiomConsistency=kernelAudit?kernelConsistency(ledger,kernelAudit,used):{status:'NO_AUDIT'};
    return freeze({ok:true,status,closure,assumedTarget,customAxioms:used.filter(e=>e.kind==='USER_AXIOM').map(e=>e.declaration).sort(),hypotheses:used.filter(e=>e.kind==='HYPOTHESIS').map(e=>e.id),unusedAssumptionIds:ledger.entries.filter(e=>!closure.includes(e.id)).map(e=>e.id),axiomConsistency,issues:structural.issues,semanticEquivalenceDecided:false,authority:'STRUCTURAL_AND_UNTRUSTED_AUDIT_CONSISTENCY_ONLY',...NO_AUTHORITY});
  } catch (error) { return freeze({ok:false,status:'LEDGER_REJECTED',issues:[issue(error)],authority:'NONE',...NO_AUTHORITY}); }
}

/** Session edges deliberately reverse proof dependencies for downstream invalidation. */
export function dependencyGraphToSessionEdges(graph) {
  assertJSON(graph); shape(graph,['direction','nodes','edges'],[],'dependency graph');
  if (graph.direction!=='CLAIM_TO_PREREQUISITE') fail('DEPENDENCY_DIRECTION','Expected claim-to-prerequisite graph.');
  const ids=new Set(graph.nodes.map(n=>n.id));
  return freeze(graph.edges.map(edge=>{
    shape(edge,['from','to','type'],[],'dependency edge');
    if (edge.type!=='DEPENDS_ON' || !ids.has(edge.from) || !ids.has(edge.to)) fail('INVALID_EDGE','Dependency endpoints must exist.');
    return {from:edge.to,to:edge.from,type:'DEPENDS_ON',direction:'PREREQUISITE_TO_DEPENDENT',proofStatus:'PROVENANCE_ONLY'};
  }));
}

export function prepareAssumptionRemoval(ledger,assumptionId) {
  const audit=auditAssumptionLedger(ledger);
  if (!audit.ok) fail(audit.issues[0].code,audit.issues[0].message);
  const removed=ledger.entries.find(e=>e.id===assumptionId); if (!removed) fail('ASSUMPTION_NOT_FOUND','Select an existing assumption.');
  const sessionEdges=dependencyGraphToSessionEdges(ledger.dependencyGraph), affected=new Set(), queue=[assumptionId];
  for (let i=0;i<queue.length;i++) for (const edge of sessionEdges) if (edge.from===queue[i] && !affected.has(edge.to)) { affected.add(edge.to); queue.push(edge.to); }
  const copy=cloneJSON(ledger);
  copy.entries=copy.entries.filter(e=>e.id!==assumptionId);
  copy.dependencyGraph.nodes=copy.dependencyGraph.nodes.filter(n=>n.id!==assumptionId);
  copy.dependencyGraph.edges=copy.dependencyGraph.edges.filter(e=>e.from!==assumptionId && e.to!==assumptionId);
  return freeze({schema:'MathScope.M3.P8.AssumptionRemoval/1',ledger:copy,removed:cloneJSON(removed),affectedClaimIds:[...affected].sort(),status:'STALE_SOURCE_REGENERATION_REQUIRED',freshKernelRunRequired:true,sourceRegenerationRequired:true,requiredCheck:'Remove the declaration or binder from the actual Lean source, regenerate dependent proof jobs, and compile again. Removing JSON entries cannot establish a theorem.',...NO_AUTHORITY});
}
