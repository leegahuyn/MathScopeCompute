// Read-only contract oracle extracted from the provider read projection of v0.3.1.
// The validator, dependency handling and commit functions below are verbatim.
// Only persistence/rendering effects, IDs and the clock are replaced by test doubles.
// This digest pins that redacted read projection, not the complete live page bytes.
export const FOUNDATION_READ_PROJECTION_SHA256="7bdf4cd11e35ab021d4d5686cdbdd709062f3675635eba523be6f16fbc7de948";
export const FOUNDATION_SOURCE_SLICES=[
  "  const SCHEMA = 'MathScopeResearchSession/0.3.1-foundation.1';",
  "  const REPRESENTATION_METHODS = ['projection','slice','embedding','stereographic','pca-like','spectral-reduction','user-defined','sampled-finite'];",
  "  const EVIDENCE_GRADES = ['FORMAL PASS','THEOREM-BACKED','CERTIFIED NUMERICAL','NUMERICAL INDICATOR','EMPIRICAL CORRESPONDENCE','RESEARCH HYPOTHESIS','UNKNOWN','STALE'];",
  "  function createRevisionRecord(nodeType,nodeRef,revision,parentRevision,changeType,delta,author='SYSTEM'){\n    return {\n      id:uid('rev'),\n      nodeType,\n      nodeRef,\n      revision,\n      parentRevision:parentRevision || null,\n      changeType,\n      delta,\n      timestamp:now(),\n      author,\n      environmentHash:'browser-local',\n      invalidatedEdges:[],\n      supersededEdges:[]\n    };\n  }",
  "  function validateObjectSpec(obj){\n    const errors = [];\n    if (!obj || typeof obj !== 'object') return ['ObjectSpec missing'];\n    if (!obj.id) errors.push('ObjectSpec.id missing');\n    if (!obj.type) errors.push('ObjectSpec.type missing');\n    if (!('baseField' in obj)) errors.push('ObjectSpec.baseField missing');\n    if (!Number.isFinite(Number(obj.intrinsicDim))) errors.push('ObjectSpec.intrinsicDim missing');\n    if (!Number.isFinite(Number(obj.ambientDim))) errors.push('ObjectSpec.ambientDim missing');\n    if (!Array.isArray(obj.structures)) errors.push('ObjectSpec.structures must be array');\n    if (!obj.revision) errors.push('ObjectSpec.revision missing');\n    if (!Array.isArray(obj.assumptions)) errors.push('ObjectSpec.assumptions must be array');\n    if (!obj.provenance) errors.push('ObjectSpec.provenance missing');\n    if (!('hash' in obj)) errors.push('ObjectSpec.hash missing');\n    return errors;\n  }",
  "  function validateRepresentationSpec(rep, s=session){\n    const errors = [];\n    if (!rep || typeof rep !== 'object') return ['RepresentationSpec missing'];\n    if (!rep.id) errors.push('RepresentationSpec.id missing');\n    if (!rep.sourceObjectRef || !s?.objects?.some(o => o.id === rep.sourceObjectRef)) errors.push('sourceObjectRef invalid');\n    if (!REPRESENTATION_METHODS.includes(rep.method)) errors.push('representation method unsupported');\n    if (!Number.isFinite(Number(rep.displayDim))) errors.push('displayDim missing');\n    if (!rep.mapDefinition) errors.push('mapDefinition missing');\n    if (!('parameters' in rep)) errors.push('parameters missing');\n    if (!('sampling' in rep)) errors.push('sampling missing');\n    if (!rep.injectivityStatus) errors.push('injectivityStatus missing');\n    if (!('ambiguityRef' in rep)) errors.push('ambiguityRef missing');\n    if (!('fidelityVector' in rep)) errors.push('fidelityVector missing');\n    if (!rep.provenance) errors.push('provenance missing');\n    if (!rep.revision) errors.push('revision missing');\n    return errors;\n  }",
  "  function validateEvidenceRecord(ev){\n    const required = ['id','grade','claimRef','method','inputsHash','environmentHash','generatedAt','adapterVersion','upstreamRevisions'];\n    const errors = required.filter(k => !(k in (ev || {}))).map(k => 'EvidenceRecord.' + k + ' missing');\n    if (ev && !EVIDENCE_GRADES.includes(ev.grade)) errors.push('EvidenceRecord.grade invalid: ' + ev.grade);\n    if (ev && !Array.isArray(ev.assumptions)) errors.push('EvidenceRecord.assumptions must be array');\n    if (ev && !Array.isArray(ev.upstreamRevisions)) errors.push('EvidenceRecord.upstreamRevisions must be array');\n    return errors;\n  }",
  "  function validateSession(s){\n    const errors = [];\n    const arrays = ['goals','objects','representations','functionSpaces','differentialSystems','optimizations','operators','pdes','spectra','geometries','topologies','entropies','symmetries','kclasses','claims','evidence','assumptions','revisions','checkpoints'];\n    if (!s || typeof s !== 'object') return ['ResearchSession missing'];\n    if (s.schema !== SCHEMA) errors.push('schema mismatch');\n    if (!s.id) errors.push('id missing');\n    if (!s.title) errors.push('title missing');\n    arrays.forEach(k => { if (!Array.isArray(s[k])) errors.push(k + ' must be array'); });\n    if (!('environmentRef' in s)) errors.push('environmentRef missing');\n    (s.objects || []).forEach(o => errors.push(...validateObjectSpec(o)));\n    (s.representations || []).forEach(r => errors.push(...validateRepresentationSpec(r,s)));\n    (s.evidence || []).forEach(e => errors.push(...validateEvidenceRecord(e)));\n    if(s.failureRecords!=null){if(!Array.isArray(s.failureRecords))errors.push('failureRecords must be array');else for(const record of s.failureRecords)errors.push(...validateFailureRecord(record));}\n    if (s.activeObjectRef && !(s.objects || []).some(o => o.id === s.activeObjectRef)) errors.push('activeObjectRef invalid');\n    if(s.researchM0!=null){\n      const validator=window.MathScopeM0Contracts?.validateResearchM0Namespace;\n      if(typeof validator!=='function')errors.push('M0 contract runtime unavailable; import cannot be validated');\n      else errors.push(...validator(s.researchM0).errors.map(e=>'M0: '+e));\n    }\n    return errors;\n  }",
  "  function guard3DRepresentation(rep){\n    const errors = validateRepresentationSpec(rep);\n    if (rep && rep.displayDim !== 3) errors.push('3D renderer requires RepresentationSpec.displayDim === 3; source object dimension is independent');\n    if (errors.length) return {ok:false,errors};\n    return {\n      ok:true,\n      warnings:[\n        rep.injectivityStatus === 'NON_INJECTIVE' ? 'NON_INJECTIVE' : null,\n        (rep.lostDimensions || []).length ? 'LOST ' + rep.lostDimensions.join(',') : null,\n        rep.inverseStatus || null\n      ].filter(Boolean)\n    };\n  }",
  "  function createSessionRevision(changeType,delta){\n    const parent = 'session:r' + session.sessionRevision;\n    session.sessionRevision += 1;\n    const next = 'session:r' + session.sessionRevision;\n    session.revisions.unshift(createRevisionRecord('session',session.id,next,parent,changeType,delta,'USER'));\n    return next;\n  }",
  "  function staleEvidence(ev,mode){\n    if (mode === 'leanEnvironment' && ev.grade !== 'FORMAL PASS') return;\n    if (ev.grade === 'FORMAL PASS'){\n      ev.freshness = 'HISTORICAL FORMAL';\n      ev.supportsCurrent = false;\n      ev.stale = false;\n      return;\n    }\n    if (ev.grade === 'THEOREM-BACKED'){\n      ev.freshness = 'HISTORICAL';\n      ev.supportsCurrent = false;\n      ev.theoremEdgePreserved = true;\n      return;\n    }\n    ev.previousGrade = ev.previousGrade || ev.grade;\n    ev.grade = 'STALE';\n    ev.freshness = 'STALE';\n    ev.stale = true;\n    ev.supportsCurrent = false;\n  }",
  "  function dependencyGraph(targetSession){\n    const groups=['objects','functionSpaces','differentialSystems','optimizations','operators','pdes','spectra','geometries','topologies','entropies','symmetries','kclasses','claims','representations','evidence','assumptions','researchRuns','replayJobs'];\n    const nodes=new Map(),aliases=new Map(),edges=new Map(),metadata=new Map();\n    for(const group of groups)for(const node of targetSession[group]||[]){\n      if(!node||typeof node!=='object'||typeof node.id!=='string')continue;\n      nodes.set(node.id,{node,group});aliases.set(node.id,node.id);\n      if(node.revision)aliases.set(node.revision,node.id);\n      if(node.parentRevision)aliases.set(node.parentRevision,node.id);\n    }\n    for(const revision of targetSession.revisions||[])if(nodes.has(revision.nodeRef)){\n      if(revision.revision)aliases.set(revision.revision,revision.nodeRef);\n      if(revision.parentRevision)aliases.set(revision.parentRevision,revision.nodeRef);\n    }\n    const resolve=ref=>typeof ref==='string'?(aliases.get(ref)||((/:r\\d+$/.test(ref)&&nodes.has(ref.replace(/:r\\d+$/,'')))?ref.replace(/:r\\d+$/,''):null)):null;\n    const add=(from,to)=>{if(from&&to&&from!==to){if(!edges.has(from))edges.set(from,new Set());edges.get(from).add(to);}};\n    const directKeys=new Set(['dependsOn','upstreamRevisions','sourceRevisionRefs','generatedBy','linearizedAt','nodeRefs']);\n    const ignored=new Set(['id','revision','parentRevision','sessionId','sessionRevision','provenance','snapshot','resultSnapshot','record','proofPackage','environment','residuals','numericalSnapshot','typedBundle','sourceRecord']);\n    for(const [id,{node,group}] of nodes){\n      const refs=[],supportRefs=[],producedRefs=[];let declared=false;\n      const walk=(value,key='',depth=0)=>{\n        if(depth>8||value==null)return;\n        if(key==='assumptions'){\n          for(const item of Array.isArray(value)?value:[]){const ref=typeof item==='string'?item:item?.id||item?.ref||item?.assumptionRef;if(resolve(ref)){refs.push(ref);declared=true;}}\n          return;\n        }\n        if(key==='linearizedOperatorRef'){declared=true;if(typeof value==='string')producedRefs.push(value);return;}\n        if(directKeys.has(key)||(/Ref(s)?$/.test(key)&&!['ambiguityRef','evidenceRefs','activeObjectRef'].includes(key))){\n          declared=true;\n          for(const item of Array.isArray(value)?value:[value]){\n            const ref=typeof item==='string'?item:item?.revision||item?.id||item?.ref||item?.nodeRef;\n            if(typeof ref==='string')refs.push(ref);else if(item!=null)refs.push('UNRESOLVED_TYPED_REFERENCE');\n          }\n          return;\n        }\n        if(key==='evidenceRefs'){declared=true;for(const ref of Array.isArray(value)?value:[])if(typeof ref==='string')supportRefs.push(ref);return;}\n        if(typeof value==='object')for(const [childKey,child] of Object.entries(value))if(!ignored.has(childKey))walk(child,childKey,depth+1);\n      };\n      walk(node);\n      const missing=[];\n      for(const ref of refs){const upstream=resolve(ref);if(upstream)add(upstream,id);else missing.push(ref);}\n      for(const ref of supportRefs){const evidence=resolve(ref);if(evidence)add(evidence,id);else missing.push(ref);}\n      for(const ref of producedRefs){const output=resolve(ref);if(output)add(id,output);else missing.push(ref);}\n      // A claim loses support when its evidence becomes inapplicable, even when\n      // old records did not carry an explicit evidenceRefs field.\n      if(group==='evidence'&&resolve(node.claimRef))add(id,resolve(node.claimRef));\n      const rootInput=['objects','functionSpaces','assumptions'].includes(group);\n      metadata.set(id,{declared,missing,unknown:(!rootInput&&!declared)||missing.length>0});\n    }\n    const unknown=new Set([...metadata].filter(([,m])=>m.unknown).map(([id])=>id));\n    const queue=[...unknown];for(let i=0;i<queue.length;i++)for(const child of edges.get(queue[i])||[])if(!unknown.has(child)){unknown.add(child);queue.push(child);}\n    return{nodes,aliases,edges,metadata,unknown,resolve};\n  }",
  "  function invalidateForChange(targetSession,changeType,targetRef){\n    const graph=dependencyGraph(targetSession),invalidated=[],numericOnly=['mesh','solverTolerance','solver'].includes(changeType),formalOnly=changeType==='leanEnvironment';\n    const roots=new Set(),reached=new Set(),changedEvidence=new Set();\n    if(formalOnly){for(const [id,{node,group}] of graph.nodes)if(group==='evidence'&&node.grade==='FORMAL PASS')roots.add(id);}\n    else if(graph.resolve(targetRef))roots.add(graph.resolve(targetRef));\n    const queue=[...roots];for(let i=0;i<queue.length;i++){const id=queue[i];if(reached.has(id))continue;reached.add(id);for(const child of graph.edges.get(id)||[])if(!reached.has(child))queue.push(child);}\n    const historic=node=>node.supportsCurrent===false&&/HISTORICAL|REVALIDATION REQUIRED|STALE/.test(node.freshness||'');\n    const numerical=node=>['NUMERICAL INDICATOR','CERTIFIED NUMERICAL'].includes(node.grade)||['NUMERICAL INDICATOR','CERTIFIED NUMERICAL'].includes(node.previousGrade);\n    const audit=(node,status)=>{node.dependencyAudit={status,changeType,targetRef:targetRef||null,scope:status==='DEPENDENCY_UNKNOWN'?'Legacy or unresolved references; selective independence cannot be established':'Explicit dependency graph reachability'};};\n    for(const [id,{node,group}] of graph.nodes){\n      if(group!=='evidence'||historic(node))continue;\n      const hit=reached.has(id),unknown=!formalOnly&&graph.unknown.has(id);\n      if(!hit&&!unknown)continue;\n      if(numericOnly&&!numerical(node))continue;\n      if(formalOnly&&node.grade!=='FORMAL PASS')continue;\n      if(hit){staleEvidence(node,changeType);audit(node,'DOWNSTREAM_INVALIDATED');}\n      else{if(['FORMAL PASS','THEOREM-BACKED'].includes(node.grade))staleEvidence(node,changeType);else{node.freshness='REVALIDATION REQUIRED';node.supportsCurrent=false;node.dependencyStatus='UNKNOWN';}audit(node,'DEPENDENCY_UNKNOWN');}\n      changedEvidence.add(id);invalidated.push('evidence:'+id);\n    }\n    const impactedClaims=new Set();for(const id of changedEvidence){const claim=graph.resolve(graph.nodes.get(id).node.claimRef);if(claim)impactedClaims.add(claim);}\n    const numericalArtifacts=new Set(['representations','spectra','geometries','topologies','entropies','optimizations','researchRuns','replayJobs']);\n    for(const [id,{node,group}] of graph.nodes){\n      if(group==='evidence'||roots.has(id)||historic(node))continue;\n      if(group==='claims'){\n        if((!numericOnly&&!formalOnly&&reached.has(id))||impactedClaims.has(id)){\n          // A still-current formal receipt can continue supporting the same\n          // claim after a mesh/solver-only change.\n          if(numericOnly&&(targetSession.evidence||[]).some(e=>e.claimRef===id&&['FORMAL PASS','THEOREM-BACKED'].includes(e.grade)&&e.supportsCurrent!==false&&e.freshness==='CURRENT'))continue;\n          node.status='REVIEW';node.freshness='REVIEW';audit(node,reached.has(id)?'DOWNSTREAM_INVALIDATED':'DEPENDENCY_UNKNOWN');invalidated.push('claim:'+id);\n        }\n      }else if(!formalOnly&&reached.has(id)&&(!numericOnly||numericalArtifacts.has(group))){node.stale=true;node.freshness='STALE';audit(node,'DOWNSTREAM_INVALIDATED');invalidated.push(group+':'+id);}\n    }\n    return [...new Set(invalidated)];\n  }",
  "  function dependencyContent(node){\n    const ignored=new Set(['freshness','stale','supportsCurrent','previousGrade','dependencyAudit','dependencyStatus','updatedAt','generatedAt','capturedAt','lastEditedAt']);\n    const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).filter(k=>!ignored.has(k)).sort().map(k=>[k,stable(value[k])])):value;\n    return JSON.stringify(stable(node));\n  }",
  "  function prepareTypedBundleInvalidation(targetSession,bundle,allowed){\n    const prepared=clone(bundle),changed=[],oldEvidence=new Map((targetSession.evidence||[]).map(e=>[e.id,clone(e)]));\n    for(const key of allowed){\n      if(prepared[key]==null)continue;\n      if(!Array.isArray(prepared[key]))throw new Error(key+' must be an array');\n      for(const node of prepared[key]){\n        const old=(targetSession[key]||[]).find(n=>n.id===node.id);\n        if(old&&dependencyContent(old)!==dependencyContent(node))changed.push(node.id);\n      }\n    }\n    const edges=[];for(const ref of changed)edges.push(...invalidateForChange(targetSession,'typedNode',ref));\n    prepared.__invalidatedEdges=[...new Set(edges)];\n    const signature=e=>JSON.stringify([e.inputsHash,e.environmentHash,e.upstreamRevisions,e.residuals,e.errorBounds]);\n    for(const node of prepared.evidence||[]){\n      const old=oldEvidence.get(node.id),invalidated=(targetSession.evidence||[]).find(e=>e.id===node.id);\n      if(old&&invalidated&&invalidated.supportsCurrent===false&&signature(old)===signature(node)){\n        Object.assign(node,{freshness:invalidated.freshness,supportsCurrent:false,stale:invalidated.stale,grade:invalidated.grade,previousGrade:invalidated.previousGrade,dependencyAudit:{status:'REUSED_EVIDENCE_REQUIRES_RECOMPUTE',changeType:'typedNode',scope:'Same evidence content cannot become current merely by replacing a node with the same ID'}});\n      }\n    }\n    return prepared;\n  }",
  "  function settleTypedBundleInvalidation(targetSession,prepared){\n    const graph=dependencyGraph(targetSession),affectedClaims=new Set();\n    for(const ev of prepared.evidence||[]){\n      const stored=(targetSession.evidence||[]).find(e=>e.id===ev.id);if(!stored||stored.supportsCurrent===false)continue;\n      const obsolete=(stored.upstreamRevisions||[]).some(ref=>{const id=graph.resolve(ref),node=id&&graph.nodes.get(id)?.node;return node&&/:r\\d+$/.test(ref)&&node.revision&&node.revision!==ref;});\n      if(obsolete){staleEvidence(stored,'typedNode');stored.dependencyAudit={status:'OBSOLETE_UPSTREAM_REVISION',changeType:'typedNode',scope:'Evidence names a superseded node revision'};if(stored.claimRef)affectedClaims.add(stored.claimRef);}\n    }\n    for(const edge of prepared.__invalidatedEdges||[])if(edge.startsWith('claim:'))affectedClaims.add(edge.slice(6));\n    for(const id of affectedClaims){\n      const claim=(targetSession.claims||[]).find(c=>c.id===id);if(!claim||claim.status==='RESEARCH HYPOTHESIS')continue;\n      const current=(targetSession.evidence||[]).some(e=>e.claimRef===id&&e.supportsCurrent!==false&&!e.stale&&!/HISTORICAL|STALE|REVALIDATION/.test(e.freshness||''));\n      if(!current){claim.status='REVIEW';claim.freshness='REVIEW';}\n    }\n  }",
  "  function upsertById(target,node){\n    if(!node||typeof node!=='object'||!node.id)throw new Error('typed bundle node requires id');\n    const i=target.findIndex(x=>x?.id===node.id);\n    if(i>=0)target[i]=clone(node);else target.push(clone(node));\n  }",
  "  function commitTypedBundle(bundle,reason='typed-bundle',authority=null){\n    if(!bundle||typeof bundle!=='object')throw new Error('typed bundle missing');\n    if(authority!==VERIFIER_WRITE){\n      if((bundle.evidence||[]).some(e=>['FORMAL PASS','THEOREM-BACKED'].includes(e?.grade)))throw new Error('Proof-grade evidence requires a separate audited verifier or theorem mapping; typed adapters cannot issue it');\n      if((bundle.claims||[]).some(c=>['PROVED','FORMAL PASS','THEOREM-BACKED'].includes(c?.status)))throw new Error('Typed adapters cannot issue proved claims');\n    }\n    const snapshot=clone(session);\n    const allowed=['objects','functionSpaces','differentialSystems','optimizations','operators','pdes','spectra','geometries','topologies','entropies','symmetries','kclasses','claims','representations','evidence'];\n    try{\n      const prepared=prepareTypedBundleInvalidation(session,bundle,allowed);\n      for(const key of allowed){\n        if(prepared[key]==null)continue;\n        for(const node of prepared[key])upsertById(session[key],node);\n      }\n      settleTypedBundleInvalidation(session,prepared);\n      if(bundle.activeObjectRef!=null){if(!session.objects.some(o=>o.id===bundle.activeObjectRef))throw new Error('Unknown active object');session.activeObjectRef=bundle.activeObjectRef;}\n      for(const key of ['researchRuns','replayJobs']){\n        if(bundle[key]==null)continue;\n        if(!Array.isArray(bundle[key]))throw new Error(key+' must be an array');\n        if(!Array.isArray(session[key]))session[key]=[];\n        for(const node of bundle[key]){if(!node?.id)throw new Error(key+' entry requires id');upsertById(session[key],clone(node));}\n      }\n      const errors=validateSession(session);\n      if(errors.length)throw new Error('bundle validation: '+errors.slice(0,8).join(' | '));\n      createSessionRevision('typed-bundle',reason);\n      const bundleRevision=createRevisionRecord('bundle',bundle.bundleId||'typed-bundle','bundle:r'+session.sessionRevision,null,'typed-bundle',reason,'ADAPTER');\n      bundleRevision.invalidatedEdges=prepared.__invalidatedEdges;session.revisions.unshift(bundleRevision);\n      markDirty(reason);\n      persist(reason);\n      renderAll();\n      return clone(session);\n    }catch(err){\n      session=snapshot;\n      store.sessions[session.id]=session;\n      renderAll();\n      throw err;\n    }\n  }"
];
export function createFoundationFixture(initial){
  const clone=value=>JSON.parse(JSON.stringify(value));
  let session=clone(initial),sequence=0;
  const store={sessions:{[session.id]:session}},effects=[];
  const VERIFIER_WRITE=Symbol('private-verifier-authority'),window={};
  const uid=prefix=>prefix+'-'+(++sequence),now=()=>new Date().toISOString();
  const markDirty=()=>{},renderAll=()=>{},persist=reason=>effects.push(reason);
  const SCHEMA = 'MathScopeResearchSession/0.3.1-foundation.1';

  const REPRESENTATION_METHODS = ['projection','slice','embedding','stereographic','pca-like','spectral-reduction','user-defined','sampled-finite'];

  const EVIDENCE_GRADES = ['FORMAL PASS','THEOREM-BACKED','CERTIFIED NUMERICAL','NUMERICAL INDICATOR','EMPIRICAL CORRESPONDENCE','RESEARCH HYPOTHESIS','UNKNOWN','STALE'];

  function createRevisionRecord(nodeType,nodeRef,revision,parentRevision,changeType,delta,author='SYSTEM'){
    return {
      id:uid('rev'),
      nodeType,
      nodeRef,
      revision,
      parentRevision:parentRevision || null,
      changeType,
      delta,
      timestamp:now(),
      author,
      environmentHash:'browser-local',
      invalidatedEdges:[],
      supersededEdges:[]
    };
  }

  function validateObjectSpec(obj){
    const errors = [];
    if (!obj || typeof obj !== 'object') return ['ObjectSpec missing'];
    if (!obj.id) errors.push('ObjectSpec.id missing');
    if (!obj.type) errors.push('ObjectSpec.type missing');
    if (!('baseField' in obj)) errors.push('ObjectSpec.baseField missing');
    if (!Number.isFinite(Number(obj.intrinsicDim))) errors.push('ObjectSpec.intrinsicDim missing');
    if (!Number.isFinite(Number(obj.ambientDim))) errors.push('ObjectSpec.ambientDim missing');
    if (!Array.isArray(obj.structures)) errors.push('ObjectSpec.structures must be array');
    if (!obj.revision) errors.push('ObjectSpec.revision missing');
    if (!Array.isArray(obj.assumptions)) errors.push('ObjectSpec.assumptions must be array');
    if (!obj.provenance) errors.push('ObjectSpec.provenance missing');
    if (!('hash' in obj)) errors.push('ObjectSpec.hash missing');
    return errors;
  }

  function validateRepresentationSpec(rep, s=session){
    const errors = [];
    if (!rep || typeof rep !== 'object') return ['RepresentationSpec missing'];
    if (!rep.id) errors.push('RepresentationSpec.id missing');
    if (!rep.sourceObjectRef || !s?.objects?.some(o => o.id === rep.sourceObjectRef)) errors.push('sourceObjectRef invalid');
    if (!REPRESENTATION_METHODS.includes(rep.method)) errors.push('representation method unsupported');
    if (!Number.isFinite(Number(rep.displayDim))) errors.push('displayDim missing');
    if (!rep.mapDefinition) errors.push('mapDefinition missing');
    if (!('parameters' in rep)) errors.push('parameters missing');
    if (!('sampling' in rep)) errors.push('sampling missing');
    if (!rep.injectivityStatus) errors.push('injectivityStatus missing');
    if (!('ambiguityRef' in rep)) errors.push('ambiguityRef missing');
    if (!('fidelityVector' in rep)) errors.push('fidelityVector missing');
    if (!rep.provenance) errors.push('provenance missing');
    if (!rep.revision) errors.push('revision missing');
    return errors;
  }

  function validateEvidenceRecord(ev){
    const required = ['id','grade','claimRef','method','inputsHash','environmentHash','generatedAt','adapterVersion','upstreamRevisions'];
    const errors = required.filter(k => !(k in (ev || {}))).map(k => 'EvidenceRecord.' + k + ' missing');
    if (ev && !EVIDENCE_GRADES.includes(ev.grade)) errors.push('EvidenceRecord.grade invalid: ' + ev.grade);
    if (ev && !Array.isArray(ev.assumptions)) errors.push('EvidenceRecord.assumptions must be array');
    if (ev && !Array.isArray(ev.upstreamRevisions)) errors.push('EvidenceRecord.upstreamRevisions must be array');
    return errors;
  }

  function validateSession(s){
    const errors = [];
    const arrays = ['goals','objects','representations','functionSpaces','differentialSystems','optimizations','operators','pdes','spectra','geometries','topologies','entropies','symmetries','kclasses','claims','evidence','assumptions','revisions','checkpoints'];
    if (!s || typeof s !== 'object') return ['ResearchSession missing'];
    if (s.schema !== SCHEMA) errors.push('schema mismatch');
    if (!s.id) errors.push('id missing');
    if (!s.title) errors.push('title missing');
    arrays.forEach(k => { if (!Array.isArray(s[k])) errors.push(k + ' must be array'); });
    if (!('environmentRef' in s)) errors.push('environmentRef missing');
    (s.objects || []).forEach(o => errors.push(...validateObjectSpec(o)));
    (s.representations || []).forEach(r => errors.push(...validateRepresentationSpec(r,s)));
    (s.evidence || []).forEach(e => errors.push(...validateEvidenceRecord(e)));
    if(s.failureRecords!=null){if(!Array.isArray(s.failureRecords))errors.push('failureRecords must be array');else for(const record of s.failureRecords)errors.push(...validateFailureRecord(record));}
    if (s.activeObjectRef && !(s.objects || []).some(o => o.id === s.activeObjectRef)) errors.push('activeObjectRef invalid');
    if(s.researchM0!=null){
      const validator=window.MathScopeM0Contracts?.validateResearchM0Namespace;
      if(typeof validator!=='function')errors.push('M0 contract runtime unavailable; import cannot be validated');
      else errors.push(...validator(s.researchM0).errors.map(e=>'M0: '+e));
    }
    return errors;
  }

  function guard3DRepresentation(rep){
    const errors = validateRepresentationSpec(rep);
    if (rep && rep.displayDim !== 3) errors.push('3D renderer requires RepresentationSpec.displayDim === 3; source object dimension is independent');
    if (errors.length) return {ok:false,errors};
    return {
      ok:true,
      warnings:[
        rep.injectivityStatus === 'NON_INJECTIVE' ? 'NON_INJECTIVE' : null,
        (rep.lostDimensions || []).length ? 'LOST ' + rep.lostDimensions.join(',') : null,
        rep.inverseStatus || null
      ].filter(Boolean)
    };
  }

  function createSessionRevision(changeType,delta){
    const parent = 'session:r' + session.sessionRevision;
    session.sessionRevision += 1;
    const next = 'session:r' + session.sessionRevision;
    session.revisions.unshift(createRevisionRecord('session',session.id,next,parent,changeType,delta,'USER'));
    return next;
  }

  function staleEvidence(ev,mode){
    if (mode === 'leanEnvironment' && ev.grade !== 'FORMAL PASS') return;
    if (ev.grade === 'FORMAL PASS'){
      ev.freshness = 'HISTORICAL FORMAL';
      ev.supportsCurrent = false;
      ev.stale = false;
      return;
    }
    if (ev.grade === 'THEOREM-BACKED'){
      ev.freshness = 'HISTORICAL';
      ev.supportsCurrent = false;
      ev.theoremEdgePreserved = true;
      return;
    }
    ev.previousGrade = ev.previousGrade || ev.grade;
    ev.grade = 'STALE';
    ev.freshness = 'STALE';
    ev.stale = true;
    ev.supportsCurrent = false;
  }

  function dependencyGraph(targetSession){
    const groups=['objects','functionSpaces','differentialSystems','optimizations','operators','pdes','spectra','geometries','topologies','entropies','symmetries','kclasses','claims','representations','evidence','assumptions','researchRuns','replayJobs'];
    const nodes=new Map(),aliases=new Map(),edges=new Map(),metadata=new Map();
    for(const group of groups)for(const node of targetSession[group]||[]){
      if(!node||typeof node!=='object'||typeof node.id!=='string')continue;
      nodes.set(node.id,{node,group});aliases.set(node.id,node.id);
      if(node.revision)aliases.set(node.revision,node.id);
      if(node.parentRevision)aliases.set(node.parentRevision,node.id);
    }
    for(const revision of targetSession.revisions||[])if(nodes.has(revision.nodeRef)){
      if(revision.revision)aliases.set(revision.revision,revision.nodeRef);
      if(revision.parentRevision)aliases.set(revision.parentRevision,revision.nodeRef);
    }
    const resolve=ref=>typeof ref==='string'?(aliases.get(ref)||((/:r\d+$/.test(ref)&&nodes.has(ref.replace(/:r\d+$/,'')))?ref.replace(/:r\d+$/,''):null)):null;
    const add=(from,to)=>{if(from&&to&&from!==to){if(!edges.has(from))edges.set(from,new Set());edges.get(from).add(to);}};
    const directKeys=new Set(['dependsOn','upstreamRevisions','sourceRevisionRefs','generatedBy','linearizedAt','nodeRefs']);
    const ignored=new Set(['id','revision','parentRevision','sessionId','sessionRevision','provenance','snapshot','resultSnapshot','record','proofPackage','environment','residuals','numericalSnapshot','typedBundle','sourceRecord']);
    for(const [id,{node,group}] of nodes){
      const refs=[],supportRefs=[],producedRefs=[];let declared=false;
      const walk=(value,key='',depth=0)=>{
        if(depth>8||value==null)return;
        if(key==='assumptions'){
          for(const item of Array.isArray(value)?value:[]){const ref=typeof item==='string'?item:item?.id||item?.ref||item?.assumptionRef;if(resolve(ref)){refs.push(ref);declared=true;}}
          return;
        }
        if(key==='linearizedOperatorRef'){declared=true;if(typeof value==='string')producedRefs.push(value);return;}
        if(directKeys.has(key)||(/Ref(s)?$/.test(key)&&!['ambiguityRef','evidenceRefs','activeObjectRef'].includes(key))){
          declared=true;
          for(const item of Array.isArray(value)?value:[value]){
            const ref=typeof item==='string'?item:item?.revision||item?.id||item?.ref||item?.nodeRef;
            if(typeof ref==='string')refs.push(ref);else if(item!=null)refs.push('UNRESOLVED_TYPED_REFERENCE');
          }
          return;
        }
        if(key==='evidenceRefs'){declared=true;for(const ref of Array.isArray(value)?value:[])if(typeof ref==='string')supportRefs.push(ref);return;}
        if(typeof value==='object')for(const [childKey,child] of Object.entries(value))if(!ignored.has(childKey))walk(child,childKey,depth+1);
      };
      walk(node);
      const missing=[];
      for(const ref of refs){const upstream=resolve(ref);if(upstream)add(upstream,id);else missing.push(ref);}
      for(const ref of supportRefs){const evidence=resolve(ref);if(evidence)add(evidence,id);else missing.push(ref);}
      for(const ref of producedRefs){const output=resolve(ref);if(output)add(id,output);else missing.push(ref);}
      // A claim loses support when its evidence becomes inapplicable, even when
      // old records did not carry an explicit evidenceRefs field.
      if(group==='evidence'&&resolve(node.claimRef))add(id,resolve(node.claimRef));
      const rootInput=['objects','functionSpaces','assumptions'].includes(group);
      metadata.set(id,{declared,missing,unknown:(!rootInput&&!declared)||missing.length>0});
    }
    const unknown=new Set([...metadata].filter(([,m])=>m.unknown).map(([id])=>id));
    const queue=[...unknown];for(let i=0;i<queue.length;i++)for(const child of edges.get(queue[i])||[])if(!unknown.has(child)){unknown.add(child);queue.push(child);}
    return{nodes,aliases,edges,metadata,unknown,resolve};
  }

  function invalidateForChange(targetSession,changeType,targetRef){
    const graph=dependencyGraph(targetSession),invalidated=[],numericOnly=['mesh','solverTolerance','solver'].includes(changeType),formalOnly=changeType==='leanEnvironment';
    const roots=new Set(),reached=new Set(),changedEvidence=new Set();
    if(formalOnly){for(const [id,{node,group}] of graph.nodes)if(group==='evidence'&&node.grade==='FORMAL PASS')roots.add(id);}
    else if(graph.resolve(targetRef))roots.add(graph.resolve(targetRef));
    const queue=[...roots];for(let i=0;i<queue.length;i++){const id=queue[i];if(reached.has(id))continue;reached.add(id);for(const child of graph.edges.get(id)||[])if(!reached.has(child))queue.push(child);}
    const historic=node=>node.supportsCurrent===false&&/HISTORICAL|REVALIDATION REQUIRED|STALE/.test(node.freshness||'');
    const numerical=node=>['NUMERICAL INDICATOR','CERTIFIED NUMERICAL'].includes(node.grade)||['NUMERICAL INDICATOR','CERTIFIED NUMERICAL'].includes(node.previousGrade);
    const audit=(node,status)=>{node.dependencyAudit={status,changeType,targetRef:targetRef||null,scope:status==='DEPENDENCY_UNKNOWN'?'Legacy or unresolved references; selective independence cannot be established':'Explicit dependency graph reachability'};};
    for(const [id,{node,group}] of graph.nodes){
      if(group!=='evidence'||historic(node))continue;
      const hit=reached.has(id),unknown=!formalOnly&&graph.unknown.has(id);
      if(!hit&&!unknown)continue;
      if(numericOnly&&!numerical(node))continue;
      if(formalOnly&&node.grade!=='FORMAL PASS')continue;
      if(hit){staleEvidence(node,changeType);audit(node,'DOWNSTREAM_INVALIDATED');}
      else{if(['FORMAL PASS','THEOREM-BACKED'].includes(node.grade))staleEvidence(node,changeType);else{node.freshness='REVALIDATION REQUIRED';node.supportsCurrent=false;node.dependencyStatus='UNKNOWN';}audit(node,'DEPENDENCY_UNKNOWN');}
      changedEvidence.add(id);invalidated.push('evidence:'+id);
    }
    const impactedClaims=new Set();for(const id of changedEvidence){const claim=graph.resolve(graph.nodes.get(id).node.claimRef);if(claim)impactedClaims.add(claim);}
    const numericalArtifacts=new Set(['representations','spectra','geometries','topologies','entropies','optimizations','researchRuns','replayJobs']);
    for(const [id,{node,group}] of graph.nodes){
      if(group==='evidence'||roots.has(id)||historic(node))continue;
      if(group==='claims'){
        if((!numericOnly&&!formalOnly&&reached.has(id))||impactedClaims.has(id)){
          // A still-current formal receipt can continue supporting the same
          // claim after a mesh/solver-only change.
          if(numericOnly&&(targetSession.evidence||[]).some(e=>e.claimRef===id&&['FORMAL PASS','THEOREM-BACKED'].includes(e.grade)&&e.supportsCurrent!==false&&e.freshness==='CURRENT'))continue;
          node.status='REVIEW';node.freshness='REVIEW';audit(node,reached.has(id)?'DOWNSTREAM_INVALIDATED':'DEPENDENCY_UNKNOWN');invalidated.push('claim:'+id);
        }
      }else if(!formalOnly&&reached.has(id)&&(!numericOnly||numericalArtifacts.has(group))){node.stale=true;node.freshness='STALE';audit(node,'DOWNSTREAM_INVALIDATED');invalidated.push(group+':'+id);}
    }
    return [...new Set(invalidated)];
  }

  function dependencyContent(node){
    const ignored=new Set(['freshness','stale','supportsCurrent','previousGrade','dependencyAudit','dependencyStatus','updatedAt','generatedAt','capturedAt','lastEditedAt']);
    const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).filter(k=>!ignored.has(k)).sort().map(k=>[k,stable(value[k])])):value;
    return JSON.stringify(stable(node));
  }

  function prepareTypedBundleInvalidation(targetSession,bundle,allowed){
    const prepared=clone(bundle),changed=[],oldEvidence=new Map((targetSession.evidence||[]).map(e=>[e.id,clone(e)]));
    for(const key of allowed){
      if(prepared[key]==null)continue;
      if(!Array.isArray(prepared[key]))throw new Error(key+' must be an array');
      for(const node of prepared[key]){
        const old=(targetSession[key]||[]).find(n=>n.id===node.id);
        if(old&&dependencyContent(old)!==dependencyContent(node))changed.push(node.id);
      }
    }
    const edges=[];for(const ref of changed)edges.push(...invalidateForChange(targetSession,'typedNode',ref));
    prepared.__invalidatedEdges=[...new Set(edges)];
    const signature=e=>JSON.stringify([e.inputsHash,e.environmentHash,e.upstreamRevisions,e.residuals,e.errorBounds]);
    for(const node of prepared.evidence||[]){
      const old=oldEvidence.get(node.id),invalidated=(targetSession.evidence||[]).find(e=>e.id===node.id);
      if(old&&invalidated&&invalidated.supportsCurrent===false&&signature(old)===signature(node)){
        Object.assign(node,{freshness:invalidated.freshness,supportsCurrent:false,stale:invalidated.stale,grade:invalidated.grade,previousGrade:invalidated.previousGrade,dependencyAudit:{status:'REUSED_EVIDENCE_REQUIRES_RECOMPUTE',changeType:'typedNode',scope:'Same evidence content cannot become current merely by replacing a node with the same ID'}});
      }
    }
    return prepared;
  }

  function settleTypedBundleInvalidation(targetSession,prepared){
    const graph=dependencyGraph(targetSession),affectedClaims=new Set();
    for(const ev of prepared.evidence||[]){
      const stored=(targetSession.evidence||[]).find(e=>e.id===ev.id);if(!stored||stored.supportsCurrent===false)continue;
      const obsolete=(stored.upstreamRevisions||[]).some(ref=>{const id=graph.resolve(ref),node=id&&graph.nodes.get(id)?.node;return node&&/:r\d+$/.test(ref)&&node.revision&&node.revision!==ref;});
      if(obsolete){staleEvidence(stored,'typedNode');stored.dependencyAudit={status:'OBSOLETE_UPSTREAM_REVISION',changeType:'typedNode',scope:'Evidence names a superseded node revision'};if(stored.claimRef)affectedClaims.add(stored.claimRef);}
    }
    for(const edge of prepared.__invalidatedEdges||[])if(edge.startsWith('claim:'))affectedClaims.add(edge.slice(6));
    for(const id of affectedClaims){
      const claim=(targetSession.claims||[]).find(c=>c.id===id);if(!claim||claim.status==='RESEARCH HYPOTHESIS')continue;
      const current=(targetSession.evidence||[]).some(e=>e.claimRef===id&&e.supportsCurrent!==false&&!e.stale&&!/HISTORICAL|STALE|REVALIDATION/.test(e.freshness||''));
      if(!current){claim.status='REVIEW';claim.freshness='REVIEW';}
    }
  }

  function upsertById(target,node){
    if(!node||typeof node!=='object'||!node.id)throw new Error('typed bundle node requires id');
    const i=target.findIndex(x=>x?.id===node.id);
    if(i>=0)target[i]=clone(node);else target.push(clone(node));
  }

  function commitTypedBundle(bundle,reason='typed-bundle',authority=null){
    if(!bundle||typeof bundle!=='object')throw new Error('typed bundle missing');
    if(authority!==VERIFIER_WRITE){
      if((bundle.evidence||[]).some(e=>['FORMAL PASS','THEOREM-BACKED'].includes(e?.grade)))throw new Error('Proof-grade evidence requires a separate audited verifier or theorem mapping; typed adapters cannot issue it');
      if((bundle.claims||[]).some(c=>['PROVED','FORMAL PASS','THEOREM-BACKED'].includes(c?.status)))throw new Error('Typed adapters cannot issue proved claims');
    }
    const snapshot=clone(session);
    const allowed=['objects','functionSpaces','differentialSystems','optimizations','operators','pdes','spectra','geometries','topologies','entropies','symmetries','kclasses','claims','representations','evidence'];
    try{
      const prepared=prepareTypedBundleInvalidation(session,bundle,allowed);
      for(const key of allowed){
        if(prepared[key]==null)continue;
        for(const node of prepared[key])upsertById(session[key],node);
      }
      settleTypedBundleInvalidation(session,prepared);
      if(bundle.activeObjectRef!=null){if(!session.objects.some(o=>o.id===bundle.activeObjectRef))throw new Error('Unknown active object');session.activeObjectRef=bundle.activeObjectRef;}
      for(const key of ['researchRuns','replayJobs']){
        if(bundle[key]==null)continue;
        if(!Array.isArray(bundle[key]))throw new Error(key+' must be an array');
        if(!Array.isArray(session[key]))session[key]=[];
        for(const node of bundle[key]){if(!node?.id)throw new Error(key+' entry requires id');upsertById(session[key],clone(node));}
      }
      const errors=validateSession(session);
      if(errors.length)throw new Error('bundle validation: '+errors.slice(0,8).join(' | '));
      createSessionRevision('typed-bundle',reason);
      const bundleRevision=createRevisionRecord('bundle',bundle.bundleId||'typed-bundle','bundle:r'+session.sessionRevision,null,'typed-bundle',reason,'ADAPTER');
      bundleRevision.invalidatedEdges=prepared.__invalidatedEdges;session.revisions.unshift(bundleRevision);
      markDirty(reason);
      persist(reason);
      renderAll();
      return clone(session);
    }catch(err){
      session=snapshot;
      store.sessions[session.id]=session;
      renderAll();
      throw err;
    }
  }
  return {
    getSession:()=>clone(session),commitTypedBundle,validateSession,validateObjectSpec,
    validateRepresentationSpec,validateEvidenceRecord,guard3DRepresentation,dependencyGraph,invalidateForChange,
    mutate:fn=>fn(session),replace:value=>{session=clone(value);store.sessions[session.id]=session;},effects
  };
}
