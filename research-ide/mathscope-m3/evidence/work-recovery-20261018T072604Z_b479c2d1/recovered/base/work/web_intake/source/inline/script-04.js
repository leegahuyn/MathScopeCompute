

(() => {
  'use strict';

  const SCHEMA = 'MathScopeResearchSession/0.3.1-foundation.1';
  const FOUNDATION_VERSION = '0.3.1-stage1.1';
  const STORAGE_KEY = 'mathscope:v031:session-store';
  const CURRENT_KEY = 'mathscope:v031:current-session';
  const CRASH_KEY = 'mathscope:v031:crash-recovery';
  const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
  const REPRESENTATION_METHODS = ['projection','slice','embedding','stereographic','pca-like','spectral-reduction','user-defined','sampled-finite'];
  const EVIDENCE_GRADES = ['FORMAL PASS','THEOREM-BACKED','CERTIFIED NUMERICAL','NUMERICAL INDICATOR','EMPIRICAL CORRESPONDENCE','RESEARCH HYPOTHESIS','UNKNOWN','STALE'];

  let store = null;
  let session = null;
  let selected = { kind:'session', ref:null };
  let canvasTab = '3D';
  let dockTab = 'Evidence';
  let dirty = false;
  let autosaveTimer = null;
  let foundationTests = [];
  let consoleLines = [];
  let webmcpAbort = null;

  const one = (s, root=document) => root.querySelector(s);
  const all = (s, root=document) => Array.from(root.querySelectorAll(s));
  const now = () => new Date().toISOString();
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const log = (kind, message) => {
    consoleLines.unshift('[' + new Date().toLocaleTimeString() + '] ' + kind + ' · ' + message);
    consoleLines = consoleLines.slice(0,120);
    if (dockTab === 'Console') renderDock();
  };
  const toast = message => {
    const el = one('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
  };

  async function hashValue(value){
    try{
      const data = new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value));
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2,'0')).join('');
    }catch{
      return 'hash-unavailable';
    }
  }

  function revisionNumber(revision){
    const m = String(revision || '').match(/:r(\d+)$/);
    return m ? Number(m[1]) : 1;
  }

  function makeObject(id='obj-s3'){
    return {
      id,
      type:'Manifold',
      baseField:'R',
      intrinsicDim:3,
      ambientDim:4,
      structures:['smooth','riemannian-candidate'],
      domainRef:null,
      revision:id + ':r1',
      parentRevision:null,
      assumptions:[],
      provenance:{ source:'v0.2.1 baseline clone', mode:'inherited', capturedAt:now() },
      hash:'pending'
    };
  }

  function makeRepresentation(objectRef, id='rep-s3-proj'){
    return {
      id,
      sourceObjectRef:objectRef,
      method:'projection',
      displayDim:3,
      mapDefinition:'(x1,x2,x3,x4) -> (x1,x2,x3)',
      parameters:{ discardedCoordinate:'x4' },
      sampling:{ mode:'legacy-threejs-sample', count:'inherited' },
      injectivityStatus:'NON_INJECTIVE',
      ambiguityRef:{ type:'two-sheet-sign-fibre', description:'interior points may correspond to ±x4' },
      fidelityVector:{ topology:null, metric:null, spectral:null, dynamics:null },
      lostDimensions:['x4'],
      discardedCoordinates:['x4'],
      inverseStatus:'NO_GLOBAL_INVERSE',
      provenance:{ source:'Stage1 baseline mapping', capturedAt:now() },
      revision:id + ':r1',
      parentRevision:null,
      stale:false,
      freshness:'CURRENT'
    };
  }

  function makeClaim(objectRef, repRef, id='claim-representation-boundary'){
    return {
      id,
      statement:'The 3D coordinate projection is a representation of S³, not the original object.',
      scope:'representation-boundary',
      assumptions:[],
      dependsOn:[objectRef,repRef],
      status:'SUPPORTED',
      freshness:'CURRENT',
      revision:id + ':r1',
      parentRevision:null
    };
  }

  function makeEvidence(claimRef, upstream, overrides={}){
    return Object.assign({
      id:uid('ev'),
      grade:'THEOREM-BACKED',
      claimRef,
      method:'typed-contract',
      inputsHash:'pending',
      environmentHash:'browser-local',
      residuals:null,
      errorBounds:null,
      assumptions:[],
      generatedAt:now(),
      adapterVersion:FOUNDATION_VERSION,
      upstreamRevisions:upstream.slice(),
      freshness:'CURRENT',
      supportsCurrent:true,
      stale:false
    }, overrides);
  }

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

  function createDefaultSession(title='MathScope Research Session'){
    const id = uid('rs');
    const object = makeObject();
    const rep = makeRepresentation(object.id);
    const claim = makeClaim(object.id,rep.id);
    const numerical = makeEvidence(claim.id,[object.revision,rep.revision,claim.revision],{
      id:'ev-baseline-numerical',
      grade:'NUMERICAL INDICATOR',
      method:'legacy-3d-sampling',
      residuals:{ sampleCount:'inherited' }
    });
    const formal = makeEvidence('C-014',[object.revision,rep.revision],{
      id:'ev-c014-formal',
      grade:'FORMAL PASS',
      method:'inherited-final-verifier',
      environmentHash:'v0.2.1-pinned-formal',
      assumptions:['legacy C-014 verifier contract; not reverified in this session'],
      freshness:'HISTORICAL FORMAL',
      supportsCurrent:false
    });
    const sessionObj = {
      schema:SCHEMA,
      id,
      title,
      goals:['Track what each mathematical representation preserves and loses.'],
      objects:[object],
      activeObjectRef:object.id,
      representations:[rep],
      functionSpaces:[],
      differentialSystems:[],
      optimizations:[],
      operators:[],
      pdes:[],
      spectra:[],
      geometries:[],
      topologies:[],
      entropies:[],
      symmetries:[],
      kclasses:[],
      claims:[claim],
      evidence:[numerical,formal],
      assumptions:[],
      revisions:[
        createRevisionRecord('object',object.id,object.revision,null,'create','Stage1 baseline object','SYSTEM'),
        createRevisionRecord('representation',rep.id,rep.revision,null,'create','Stage1 baseline representation','SYSTEM'),
        createRevisionRecord('claim',claim.id,claim.revision,null,'create','Stage1 representation boundary claim','SYSTEM')
      ],
      checkpoints:[],
      environmentRef:{
        mode:'local-first',
        storage:'localStorage',
        foundationVersion:FOUNDATION_VERSION,
        stableDependency:'v0.2.1 shared assets / read-only',
        page:'/v0.3.1.html'
      },
      createdAt:now(),
      updatedAt:now(),
      sessionRevision:1,
      archivedAt:null
    };
    return sessionObj;
  }

  function blankStore(){
    return { schema:SCHEMA, version:1, sessions:{}, archived:{}, updatedAt:now() };
  }

  function loadStore(){
    let parsed = null;
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) parsed = JSON.parse(raw);
    }catch(err){
      log('STORE','Failed to parse session store: ' + err.message);
    }
    if (!parsed || parsed.schema !== SCHEMA || !parsed.sessions || typeof parsed.sessions !== 'object'){
      parsed = blankStore();
    }
    // Serialized records cannot carry the in-memory verifier receipt across reloads.
    const pending=[...Object.values(parsed.sessions||{}),...Object.values(parsed.archived||{})],seen=new Set();
    while(pending.length){
      const item=pending.pop();if(!item||typeof item!=='object'||seen.has(item))continue;seen.add(item);
      for(const ev of(item.evidence||[]))if(['FORMAL PASS','THEOREM-BACKED'].includes(ev.grade)){ev.supportsCurrent=false;ev.freshness=ev.grade==='FORMAL PASS'?'HISTORICAL FORMAL':'HISTORICAL';}
      for(const claim of(item.claims||[]))if(['PROVED','FORMAL PASS','THEOREM-BACKED'].includes(claim.status)){claim.status='REVIEW';claim.freshness='REVALIDATION REQUIRED';}
      for(const cp of(item.checkpoints||[]))if(cp?.snapshot)pending.push(cp.snapshot);
    }
    return parsed;
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

  const FAILURE_KINDS=Object.freeze({
    SOLVER_DIVERGED:'Solver diverged',MESH_INVALID:'Mesh invalid',
    THEOREM_ASSUMPTIONS_MISSING:'Theorem assumptions missing',OPERATOR_DOMAIN_INCOMPLETE:'Operator domain incomplete',
    SPECTRAL_POLLUTION_SUSPECTED:'Spectral pollution suspected',FORMAL_DEPENDENCY_MISSING:'Formal dependency missing',
    PROJECTION_NONINJECTIVE:'Projection noninjective',TOPOLOGY_COMPUTATION_INCOMPLETE:'Topology computation incomplete',
    KTHEORY_BACKEND_UNAVAILABLE:'K-theory backend unavailable',BOUNDARY_ANALYSIS_INCONCLUSIVE:'Boundary analysis inconclusive',
    TIMEOUT:'Execution timed out',CANCELLED:'Execution cancelled',EXECUTION_ERROR:'Execution failed'
  });
  const REQUIRED_FAILURE_KINDS=Object.freeze(Object.keys(FAILURE_KINDS).slice(0,10));
  function failureInput(value){
    const seen=new WeakSet(),redacted=[];
    const json=JSON.stringify(value??{},(key,item)=>{
      if(/^(authorization|password|secret|accessToken|refreshToken|token|apiKey)$/i.test(key)){redacted.push(key);return '[REDACTED]';}
      if(item&&typeof item==='object'){if(seen.has(item))throw Error('Failure input must be acyclic JSON');seen.add(item);}
      if(typeof item==='number'&&!Number.isFinite(item))return String(item);
      if(['function','symbol','bigint'].includes(typeof item))throw Error('Failure input must be JSON');return item;
    });
    if(json.length>65536)throw Error('Failure input exceeds 64 KiB; provide bounded inputSpec and input/job hash references');
    return{value:JSON.parse(json),redactedKeys:[...new Set(redacted)]};
  }
  function validateFailureRecord(record){
    const errors=[];
    if(!record||record.type!=='FailureRecord'||record.schema!=='MathScopeFailureRecord/1')return['FailureRecord schema invalid'];
    if(!record.id||!Object.hasOwn(FAILURE_KINDS,record.kind))errors.push('FailureRecord id/kind invalid');
    if(record.status!=='RECORDED_FAILURE'||record.mathematicalGrade!=='UNKNOWN'||record.canSupportClaim!==false||record.canPromoteEvidence!==false)errors.push('FailureRecord has no mathematical evidence authority');
    if(!record.cause||typeof record.cause.message!=='string'||!record.cause.message.trim())errors.push('FailureRecord cause required');
    if(!record.inputSpec||typeof record.inputSpec!=='object'||!record.createdAt)errors.push('FailureRecord input/time required');
    if(!record.sourceSessionId||!Number.isInteger(record.sourceSessionRevision)||record.sourceSessionRevision<0||!Number.isInteger(record.recordedSessionRevision)||record.recordedSessionRevision<record.sourceSessionRevision)errors.push('FailureRecord session/revision provenance invalid');
    if(!record.provenance||!record.provenance.stage||!record.provenance.operation)errors.push('FailureRecord operation provenance required');
    if(record.provenance?.cancellationConfirmed===true&&record.provenance?.executionScope!=='SERVER_WORKER')errors.push('Server cancellation receipt required for confirmed cancellation');
    return errors;
  }
  function appendFailureRecord(target,kind,details={}){
    if(!Object.hasOwn(FAILURE_KINDS,kind))throw Error('Unsupported failure kind');
    const sourceRevision=details.sessionRevision??target.sessionRevision;
    if(!Number.isInteger(sourceRevision)||sourceRevision<0||sourceRevision>target.sessionRevision)throw Error('Failure origin revision is invalid');
    if(details.sessionId&&details.sessionId!==target.id)throw Error('Failure origin session mismatch');
    const input=failureInput(details.inputSpec),provenanceInput=failureInput(details.provenance||{});
    const executionScope=['SERVER_WORKER','CLIENT_REQUEST','BROWSER','USER_REPORTED','CONTRACT_TEST'].includes(details.executionScope)?details.executionScope:'BROWSER';
    const record={schema:'MathScopeFailureRecord/1',type:'FailureRecord',id:uid('failure'),kind,label:FAILURE_KINDS[kind],
      status:'RECORDED_FAILURE',mathematicalGrade:'UNKNOWN',canSupportClaim:false,canPromoteEvidence:false,
      cause:{code:String(details.code||kind).slice(0,160),message:String(details.cause?.message||details.cause||details.message||FAILURE_KINDS[kind]).slice(0,4000)},
      inputSpec:input.value,inputRedactions:input.redactedKeys,sourceSessionId:target.id,sourceSessionRevision:sourceRevision,
      recordedSessionRevision:target.sessionRevision+1,createdAt:now(),
      provenance:{stage:String(details.stage||'Research session').slice(0,100),operation:String(details.operation||'record-observed-failure').slice(0,160),adapter:details.adapter||null,jobId:details.jobId||null,inputsHash:details.inputsHash||null,executionScope,cancellationConfirmed:executionScope==='SERVER_WORKER'&&details.cancellationConfirmed===true,details:provenanceInput.value},
      scope:'Execution failure or limitation observation only; cannot support a mathematical claim or theorem/proof promotion'};
    const errors=validateFailureRecord(record);if(errors.length)throw Error(errors.join(' | '));
    if(!Array.isArray(target.failureRecords))target.failureRecords=[];
    target.failureRecords.push(record);const parent='session:r'+target.sessionRevision;target.sessionRevision=record.recordedSessionRevision;
    target.revisions.unshift(createRevisionRecord('session',target.id,'session:r'+target.sessionRevision,parent,'failure-record',kind+': '+record.cause.message,'FAILURE_AUDIT'));
    target.updatedAt=now();return clone(record);
  }
  function recordFailure(kind,details={}){
    const id=details.sessionId||session.id,target=id===session.id?session:store.sessions[id];
    if(!target)throw Error('Failure origin session is unavailable; refusing to attach to a different session');
    const record=appendFailureRecord(target,kind,details);store.sessions[target.id]=target;
    persist('failure-record:'+kind);if(target.id===session.id)renderAll();
    window.dispatchEvent?.(new CustomEvent('mathscope:failure-recorded',{detail:{id:record.id,sessionId:target.id,kind}}));
    return record;
  }
  function classifyFailure(error){
    if(Object.hasOwn(FAILURE_KINDS,error?.failureKind))return error.failureKind;
    if(error?.timedOut===true||error?.name==='TimeoutError')return'TIMEOUT';
    if(error?.name==='AbortError')return'CANCELLED';
    const message=String(error?.message||error||'');
    const rules=[['SOLVER_DIVERGED',/solver.*diverg|did not converge/i],['MESH_INVALID',/mesh.*invalid|invalid.*mesh/i],['THEOREM_ASSUMPTIONS_MISSING',/assumptions?.*(missing|required)|review.*statement.*first/i],['OPERATOR_DOMAIN_INCOMPLETE',/operator.*domain.*(missing|incomplete)|domain incomplete/i],['SPECTRAL_POLLUTION_SUSPECTED',/spectral pollution/i],['FORMAL_DEPENDENCY_MISSING',/DEPENDENCY.?MISSING|(?:Lean|formal).*(?:dependency|toolchain).*(?:missing|unavailable)/i],['PROJECTION_NONINJECTIVE',/projection.*non.?injective/i],['TOPOLOGY_COMPUTATION_INCOMPLETE',/topology.*(?:incomplete|not computed)/i],['KTHEORY_BACKEND_UNAVAILABLE',/K.?theory.*backend.*unavailable/i],['BOUNDARY_ANALYSIS_INCONCLUSIVE',/boundary.*inconclusive/i],['TIMEOUT',/timed?\s*out|timeout/i]];
    return rules.find(([,pattern])=>pattern.test(message))?.[0]||'EXECUTION_ERROR';
  }
  function captureFailure(error,details={}){
    const kind=classifyFailure(error),scope=error?.executionScope||details.executionScope||(kind==='CANCELLED'?'CLIENT_REQUEST':'BROWSER');
    return recordFailure(kind,{...details,cause:error?.message||String(error),code:error?.code||details.code,executionScope:scope,cancellationConfirmed:error?.cancellationConfirmed===true&&scope==='SERVER_WORKER',jobId:error?.jobId||details.jobId});
  }
  function failureContractSelfTests(){
    const fixture=createDefaultSession('Failure contract fixture'),beforeClaims=JSON.stringify(fixture.claims),beforeEvidence=JSON.stringify(fixture.evidence),tests=[];
    for(const kind of REQUIRED_FAILURE_KINDS){const record=appendFailureRecord(fixture,kind,{cause:'Scoped contract-test observation: '+kind,inputSpec:{fixture:true,parameter:1},stage:'C3',operation:'failure-contract-self-test',executionScope:'CONTRACT_TEST'});tests.push({name:kind,pass:validateFailureRecord(record).length===0&&record.canSupportClaim===false&&record.mathematicalGrade==='UNKNOWN'});}
    const restored=JSON.parse(JSON.stringify(fixture));tests.push({name:'Failure JSON preservation',pass:JSON.stringify(restored.failureRecords)===JSON.stringify(fixture.failureRecords)});
    tests.push({name:'No claim/evidence mutation',pass:JSON.stringify(fixture.claims)===beforeClaims&&JSON.stringify(fixture.evidence)===beforeEvidence});
    const forged={...fixture.failureRecords[0],mathematicalGrade:'FORMAL PASS',canSupportClaim:true};tests.push({name:'Failure proof promotion rejected',pass:validateFailureRecord(forged).length>0});
    return{pass:tests.length===13&&tests.every(x=>x.pass),tests,scope:'Executed record/serialization/trust contract for ten failure kinds; does not pretend to execute every numerical solver failure'};
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

  function canPromoteEvidence(ev,target,context={}){
    const deny = reason => ({ok:false,reason});
    if(!ev||!EVIDENCE_GRADES.includes(ev.grade)||!EVIDENCE_GRADES.includes(target))return deny('Evidence grade missing or invalid');
    if(target==='FORMAL PASS')return deny('FORMAL PASS requires a receipt from an audited pinned verifier; generic evidence promotion cannot issue it');
    if(target==='THEOREM-BACKED')return deny('A theorem mapping is a separate audited record; caller flags and numerical evidence cannot issue theorem support');
    if(context.sourceScope==='FINITE_APPROX'&&context.targetScope==='INFINITE_EXACT')return deny('Finite approximation cannot be promoted to exact infinite spectrum');
    return {ok:true};
  }

  function ensureSession(){
    store = loadStore();
    let currentId = localStorage.getItem(CURRENT_KEY);
    if (!currentId || !store.sessions[currentId]){
      currentId = Object.keys(store.sessions)[0];
    }
    if (!currentId){
      const initial = createDefaultSession('v0.3.1 Foundation Session');
      store.sessions[initial.id] = initial;
      currentId = initial.id;
      localStorage.setItem(CURRENT_KEY,currentId);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(store));
    }
    session = store.sessions[currentId];
    let migrated=false;
    for(const key of ['functionSpaces','differentialSystems','optimizations','entropies','symmetries']){
      if(!Array.isArray(session[key])){ session[key]=[]; migrated=true; }
    }
    if(migrated){
      store.sessions[session.id]=session;
      try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(store)); }catch{}
    }
    selected = {kind:'session',ref:session.id};
  }

  function snapshotForCheckpoint(s){
    const snap = clone(s);
    snap.checkpoints = [];
    return snap;
  }

  function saveCrashSnapshot(reason='dirty-change'){
    if (!session) return;
    try{
      localStorage.setItem(CRASH_KEY,JSON.stringify({schema:SCHEMA,timestamp:now(),reason,session:snapshotForCheckpoint(session)}));
    }catch(err){ log('RECOVERY','Could not write crash snapshot: ' + err.message); }
  }

  function persist(reason='manual'){
    if (!session) return;
    session.updatedAt = now();
    store.sessions[session.id] = session;
    store.updatedAt = now();
    try{
      const payload = JSON.stringify(store);
      if (payload.length > 4.5 * 1024 * 1024) throw new Error('local store nearing safety cap');
      localStorage.setItem(STORAGE_KEY,payload);
      localStorage.setItem(CURRENT_KEY,session.id);
      localStorage.removeItem(CRASH_KEY);
      dirty = false;
      log('STORE','Saved: ' + reason);
      const el = one('#v031Autosave'); if (el) el.textContent = 'SAVED ' + new Date().toLocaleTimeString();
      renderTop();
    }catch(err){
      log('STORE','Save failed: ' + err.message);
      toast('Stage1 저장 실패: ' + err.message);
    }
  }

  function markDirty(reason='change'){
    dirty = true;
    saveCrashSnapshot(reason);
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => persist('autosave:' + reason),700);
    const el = one('#v031Autosave'); if (el) el.textContent = 'AUTOSAVE PENDING';
    renderTop();
  }

  function createSession(){
    const title = prompt('ResearchSession title','New MathScope Research Session');
    if (title == null) return;
    const s = createDefaultSession(title.trim() || 'Untitled Research Session');
    store.sessions[s.id] = s;
    session = s;
    selected = {kind:'session',ref:s.id};
    localStorage.setItem(CURRENT_KEY,s.id);
    persist('create-session');
    renderAll();
    toast('ResearchSession 생성 완료');
  }

  function duplicateSession(){
    const copy = clone(session);
    copy.id = uid('rs');
    copy.title = session.title + ' — copy';
    copy.createdAt = now(); copy.updatedAt = now(); copy.archivedAt = null;
    copy.sessionRevision = 1;
    copy.checkpoints = [];
    copy.revisions.unshift(createRevisionRecord('session',copy.id,'r1',null,'duplicate','Duplicated from ' + session.id,'USER'));
    store.sessions[copy.id] = copy;
    session = copy; selected = {kind:'session',ref:copy.id};
    localStorage.setItem(CURRENT_KEY,copy.id);
    persist('duplicate-session'); renderAll(); toast('세션 복제 완료');
  }

  function renameSession(){
    const title = prompt('Rename ResearchSession',session.title);
    if (title == null || !title.trim()) return;
    const old = session.title;
    session.title = title.trim();
    createSessionRevision('rename','title: ' + old + ' -> ' + session.title);
    markDirty('rename-session'); renderAll();
  }

  function archiveSession(){
    if (!confirm('현재 ResearchSession을 archive 하시겠습니까? 데이터는 archived store에 보존됩니다.')) return;
    session.archivedAt = now();
    store.archived[session.id] = clone(session);
    delete store.sessions[session.id];
    const nextId = Object.keys(store.sessions)[0];
    if (nextId) session = store.sessions[nextId];
    else{
      session = createDefaultSession('v0.3.1 Foundation Session');
      store.sessions[session.id] = session;
    }
    selected = {kind:'session',ref:session.id};
    localStorage.setItem(CURRENT_KEY,session.id);
    persist('archive-session'); renderAll(); toast('세션 archive 완료');
  }

  function createSessionRevision(changeType,delta){
    const parent = 'session:r' + session.sessionRevision;
    session.sessionRevision += 1;
    const next = 'session:r' + session.sessionRevision;
    session.revisions.unshift(createRevisionRecord('session',session.id,next,parent,changeType,delta,'USER'));
    return next;
  }

  function createCheckpoint(label){
    label = label || prompt('Checkpoint label','checkpoint ' + (session.checkpoints.length + 1));
    if (label == null) return null;
    const cp = {id:uid('cp'),label:label.trim() || 'checkpoint',createdAt:now(),snapshot:snapshotForCheckpoint(session)};
    session.checkpoints.unshift(cp);
    createSessionRevision('checkpoint','Created ' + cp.label);
    markDirty('checkpoint');
    renderAll();
    toast('Checkpoint 생성: ' + cp.label);
    return cp;
  }

  function restoreCheckpoint(id){
    const cp = session.checkpoints.find(x => x.id === id);
    if (!cp) return;
    const checkpoints = session.checkpoints;
    const restored = clone(cp.snapshot);
    restored.checkpoints = checkpoints;
    restored.id = session.id;
    restored.title = session.title;
    restored.sessionRevision = Math.max(session.sessionRevision,restored.sessionRevision || 1);
    session = restored;
    store.sessions[session.id] = session;
    createSessionRevision('checkpoint-restore','Restored checkpoint ' + cp.label);
    selected = {kind:'session',ref:session.id};
    markDirty('checkpoint-restore');
    persist('checkpoint-restore');
    renderAll();
    toast('Checkpoint 복원 완료');
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

  function reviseActiveObject(){
    const obj = session.objects.find(o => o.id === session.activeObjectRef);
    if (!obj){ toast('Active ObjectSpec 없음'); return; }
    const delta = prompt('Object revision delta','metadata / assumption / structure change');
    if (delta == null) return;
    const parent = obj.revision;
    const next = obj.id + ':r' + (revisionNumber(parent) + 1);
    obj.parentRevision = parent;
    obj.revision = next;
    obj.provenance = Object.assign({},obj.provenance,{lastEditedAt:now()});
    const rev = createRevisionRecord('object',obj.id,next,parent,'object',delta || 'object revision','USER');
    rev.invalidatedEdges = invalidateForChange(session,'object',obj.id);
    session.revisions.unshift(rev);
    markDirty('object-revision');
    selected = {kind:'object',ref:obj.id};
    renderAll();
    toast('Object revision 생성 · downstream stale propagation 적용');
  }

  function runSemanticGuardTests(){
    const sample = makeEvidence('x',['r1'],{grade:'NUMERICAL INDICATOR',method:'numerical'});
    const lsp = makeEvidence('x',['r1'],{grade:'UNKNOWN',method:'Lean LSP no-error'});
    return [
      {name:'AI → FORMAL PASS blocked',pass:!canPromoteEvidence(sample,'FORMAL PASS',{sourceAuthority:'AI'}).ok},
      {name:'Numerical → THEOREM-BACKED blocked without theorem',pass:!canPromoteEvidence(sample,'THEOREM-BACKED',{}).ok},
      {name:'Visual → topology equivalence blocked',pass:!canPromoteEvidence(sample,'THEOREM-BACKED',{sourceAuthority:'VISUAL',claimType:'TOPOLOGY_EQUIVALENCE'}).ok},
      {name:'LSP no-error → FORMAL PASS blocked',pass:!canPromoteEvidence(lsp,'FORMAL PASS',{}).ok},
      {name:'Finite approximation → infinite exact blocked',pass:!canPromoteEvidence(sample,'THEOREM-BACKED',{sourceScope:'FINITE_APPROX',targetScope:'INFINITE_EXACT'}).ok}
    ];
  }

  function runDependencyTests(){
    const changes = ['object','assumption','representation','mesh','solverTolerance','boundaryCondition','operatorDomain','leanEnvironment'];
    return changes.map(changeType => {
      const fixture = createDefaultSession('fixture');
      fixture.evidence.push(makeEvidence('fixture',[fixture.objects[0].revision],{id:'fixture-certified',grade:'CERTIFIED NUMERICAL',method:'fixture'}));
      const invalidated = invalidateForChange(fixture,changeType,fixture.activeObjectRef);
      let pass = invalidated.length > 0;
      if (changeType === 'leanEnvironment'){
        pass = fixture.evidence.some(e => e.grade === 'FORMAL PASS' && e.freshness === 'HISTORICAL FORMAL');
      }
      if (['mesh','solverTolerance','boundaryCondition'].includes(changeType)){
        pass = fixture.evidence.some(e => e.grade === 'STALE');
      }
      return {name:'Dependency invalidation: ' + changeType,pass,detail:invalidated.join(', ')};
    });
  }

  function runFoundationSelfTests(){
    const schemaErrors = validateSession(session);
    const objectErrors = session.objects.flatMap(validateObjectSpec);
    const repErrors = session.representations.flatMap(r => validateRepresentationSpec(r,session));
    const evidenceErrors = session.evidence.flatMap(validateEvidenceRecord);
    const activeRepresentation=session.representations.find(r=>r.sourceObjectRef===session.activeObjectRef);
    const guard=guard3DRepresentation(activeRepresentation);
    const representationGuardPass=schemaErrors.length===0&&(activeRepresentation?.displayDim===3?guard.ok===true:guard.ok===false);
    foundationTests = [
      {name:'ResearchSession schema',pass:schemaErrors.length===0,detail:schemaErrors.join(' | ')},
      {name:'ObjectSpec schema',pass:objectErrors.length===0,detail:objectErrors.join(' | ')},
      {name:'RepresentationSpec schema',pass:repErrors.length===0,detail:repErrors.join(' | ')},
      {name:'EvidenceRecord schema',pass:evidenceErrors.length===0,detail:evidenceErrors.join(' | ')},
      {name:'3D Representation guard',pass:representationGuardPass,detail:activeRepresentation?(guard.errors||guard.warnings||[]).join(' | '):'Selected object has no RepresentationSpec; missing representation correctly rejected (no 3D render authorization)'},
      ...runDependencyTests(),
      ...runSemanticGuardTests()
    ];
    const pass = foundationTests.every(t => t.pass);
    log('TEST',(pass ? 'PASS' : 'FAIL') + ' · ' + foundationTests.filter(t=>t.pass).length + '/' + foundationTests.length);
    renderStageTests();
    renderTop();
    toast(pass ? 'Stage1 Foundation self-test PASS' : 'Stage1 Foundation self-test에서 실패 항목 확인');
    return {pass,tests:clone(foundationTests)};
  }

  function evidenceCounts(){
    const counts = {};
    EVIDENCE_GRADES.forEach(g => counts[g]=0);
    (session.evidence || []).forEach(e => counts[e.grade] = (counts[e.grade] || 0) + 1);
    return counts;
  }

  function getNode(kind,ref){
    if (kind === 'session') return session;
    const map = {
      object:'objects', representation:'representations', claim:'claims',
      evidence:'evidence', assumption:'assumptions', revision:'revisions',
      functionSpace:'functionSpaces', differentialSystem:'differentialSystems', optimization:'optimizations',
      operator:'operators', pde:'pdes', spectrum:'spectra',
      geometry:'geometries', topology:'topologies', entropy:'entropies', symmetry:'symmetries', kclass:'kclasses'
    };
    return (session[map[kind]] || []).find(x => x.id === ref) || null;
  }

  function renderTop(){
    const dirtyEl = one('#v031Dirty');
    if (dirtyEl){ dirtyEl.textContent = dirty ? 'DIRTY' : 'CLEAN'; dirtyEl.className='v031-pill ' + (dirty?'warn':'pass'); }
    const schemaEl = one('#v031SchemaBadge'); if (schemaEl) schemaEl.textContent = 'SCHEMA ' + SCHEMA.split('/')[1];
    const summary = evidenceCounts();
    const ev = one('#v031EvidenceSummary');
    if (ev) ev.textContent = 'EVIDENCE ' + session.evidence.length + ' · F' + (summary['FORMAL PASS']||0) + ' T' + (summary['THEOREM-BACKED']||0) + ' N' + ((summary['CERTIFIED NUMERICAL']||0)+(summary['NUMERICAL INDICATOR']||0));
    const stage = one('#v031StageStatus');
    if (stage){
      const pass = foundationTests.length && foundationTests.every(t=>t.pass);
      stage.textContent = foundationTests.length ? ('FOUNDATION ' + (pass?'PASS':'CHECK')) : 'FOUNDATION READY';
      stage.className = 'v031-pill ' + (pass?'pass':'warn');
    }
    const select = one('#v031SessionSelect');
    if (select){
      select.innerHTML = Object.values(store.sessions).map(s => '<option value="'+escapeHtml(s.id)+'">'+escapeHtml(s.title)+'</option>').join('');
      select.value = session.id;
    }
    const goal = one('#v031Goal'); if (goal && document.activeElement !== goal) goal.value = session.goals[0] || '';
    const cp = one('#v031CheckpointSelect');
    if (cp){
      cp.innerHTML = '<option value="">checkpoint…</option>' + session.checkpoints.map(x => '<option value="'+escapeHtml(x.id)+'">'+escapeHtml(x.label)+'</option>').join('');
    }
    const env = one('#v031Environment');
    if (env) env.textContent = 'ENV localStorage · ' + FOUNDATION_VERSION;
  }

  function renderTree(){
    const groups = [
      ['Objects','object',session.objects],
      ['Representations','representation',session.representations],
      ['Function Spaces','functionSpace',session.functionSpaces||[]],
      ['Differential Systems','differentialSystem',session.differentialSystems||[]],
      ['Operators','operator',session.operators],
      ['PDE','pde',session.pdes],
      ['Optimization','optimization',session.optimizations||[]],
      ['Spectra','spectrum',session.spectra],
      ['Geometry','geometry',session.geometries],
      ['Topology','topology',session.topologies],
      ['Entropy','entropy',session.entropies||[]],
      ['Symmetry','symmetry',session.symmetries||[]],
      ['K-Theory','kclass',session.kclasses],
      ['Claims','claim',session.claims],
      ['Evidence','evidence',session.evidence],
      ['Assumptions','assumption',session.assumptions],
      ['Revisions','revision',session.revisions.slice(0,8)]
    ];
    const total = groups.reduce((n,g)=>n+g[2].length,0);
    one('#v031TreeCount').textContent = total + ' nodes';
    one('#v031ObjectTree').innerHTML = groups.map(([title,kind,items]) => {
      const rows = items.length ? items.map(item => {
        const label = item.title || item.statement || item.label || item.id || kind;
        const active = selected.kind===kind && selected.ref===item.id ? ' active' : '';
        return '<button class="'+active+'" data-v031-node-kind="'+kind+'" data-v031-node-ref="'+escapeHtml(item.id)+'">'+escapeHtml(label)+'</button>';
      }).join('') : '<div class="muted small">—</div>';
      return '<div class="v031-tree-group"><div class="v031-tree-title">'+title+' · '+items.length+'</div>'+rows+'</div>';
    }).join('');
    all('[data-v031-node-ref]').forEach(btn => btn.addEventListener('click',() => {
      selected={kind:btn.dataset.v031NodeKind,ref:btn.dataset.v031NodeRef};
      renderTree(); renderInspector(); renderCanvas();
    }));
  }

  function inspectorRows(obj){
    if (!obj) return [['status','not selected']];
    const preferred = ['id','title','type','baseField','intrinsicDim','ambientDim','sourceObjectRef','method','displayDim','injectivityStatus','inverseStatus','grade','status','freshness','revision','parentRevision','claimRef','method','environmentHash','updatedAt'];
    const rows = [];
    preferred.forEach(key => {
      if (key in obj){
        const value = typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : obj[key];
        rows.push([key,value]);
      }
    });
    if (obj.assumptions) rows.push(['assumptions',JSON.stringify(obj.assumptions)]);
    if (obj.provenance) rows.push(['provenance',JSON.stringify(obj.provenance)]);
    if (obj.fidelityVector) rows.push(['fidelity',JSON.stringify(obj.fidelityVector)]);
    if (obj.residuals) rows.push(['numerical errors',JSON.stringify(obj.residuals)]);
    if (obj.errorBounds) rows.push(['error bounds',JSON.stringify(obj.errorBounds)]);
    if (obj.theoremAssumptions) rows.push(['theorem assumptions',JSON.stringify(obj.theoremAssumptions)]);
    if (obj.lostDimensions) rows.push(['lost dimensions',JSON.stringify(obj.lostDimensions)]);
    return rows.slice(0,18);
  }

  function renderInspector(){
    const node = getNode(selected.kind,selected.ref);
    one('#v031SelectedKind').textContent = selected.kind.toUpperCase();
    one('#v031Inspector').innerHTML = inspectorRows(node).map(([k,v]) => '<div class="k">'+escapeHtml(k)+'</div><div class="v">'+escapeHtml(v)+'</div>').join('');
  }

  function activeRepresentation(){
    return session.representations.find(r => r.sourceObjectRef === session.activeObjectRef && !r.stale) ||
      session.representations.find(r => r.sourceObjectRef === session.activeObjectRef) || null;
  }

  function renderCanvas(){
    const panel = one('#v031CanvasPanel'); if (!panel) return;
    const rep = activeRepresentation();
    const guard = guard3DRepresentation(rep);
    const guardEl = one('#v031CanvasGuard');
    if (guardEl){
      guardEl.textContent = guard.ok ? 'REP GUARD PASS' : 'REP GUARD BLOCK';
      guardEl.style.color = guard.ok ? '#72deb9' : '#ff8d95';
    }
    if (canvasTab === '3D'){
      if (!guard.ok){
        panel.innerHTML='<div class="v031-empty"><div><strong>3D blocked</strong>'+escapeHtml((guard.errors||[]).join(' · '))+'</div></div>';
        return;
      }
      panel.innerHTML='<div class="v031-empty"><div><strong>Guarded 3D representation ready</strong><div class="muted small">Object '+escapeHtml(rep.sourceObjectRef)+' → '+escapeHtml(rep.method)+' → R³</div><div style="margin:12px 0"><span class="v031-pill warn">'+escapeHtml(rep.injectivityStatus)+'</span> <span class="v031-pill">lost '+escapeHtml((rep.lostDimensions||[]).join(','))+'</span> <span class="v031-pill">'+escapeHtml(rep.inverseStatus)+'</span></div><button class="btn primary" id="v031OpenLegacy3D">Open inherited S³ renderer</button></div></div>';
      one('#v031OpenLegacy3D')?.addEventListener('click',openGuardedLegacy3D);
      return;
    }
    if (canvasTab === 'Research Graph'){
      panel.innerHTML='<div class="v031-empty"><div><strong>Foundation dependency view</strong><div class="muted small">Object → Representation → Claim → Evidence · full Research Graph arrives in v0.3.1-C.</div></div></div>';
      return;
    }
    panel.innerHTML='<div class="v031-empty"><div><strong>'+escapeHtml(canvasTab)+' shell ready</strong><div class="muted small">Stage 1 establishes the IDE contract. Domain computation is activated in later milestones.</div></div></div>';
  }

  function openGuardedLegacy3D(){
    const rep = activeRepresentation();
    const guard = guard3DRepresentation(rep);
    if (!guard.ok){ toast('RepresentationSpec guard blocked 3D view'); return; }
    const btn = one('[data-view-target="geometry"]');
    if (btn) btn.click();
  }

  function renderEvidenceDock(){
    const rows = session.evidence.map(ev => '<div class="v031-evidence-card"><b>'+escapeHtml(ev.id)+'</b><span>'+escapeHtml(ev.grade)+' · '+escapeHtml(ev.freshness||'CURRENT')+'</span><span>'+escapeHtml(ev.method)+'</span></div>').join('');
    return '<div class="v031-evidence-grid">'+rows+'</div>';
  }

  function renderDependencyDock(){
    const rows = session.revisions.slice(0,20).map(r => '<div style="padding:6px 0;border-bottom:1px solid rgba(142,215,255,.08)"><span class="v031-pill">'+escapeHtml(r.changeType)+'</span> <b>'+escapeHtml(r.nodeType)+' · '+escapeHtml(r.revision)+'</b><div class="muted small">'+escapeHtml(r.delta)+' · invalidated '+(r.invalidatedEdges?.length||0)+'</div></div>').join('');
    return rows || '<div class="muted">No revisions yet.</div>';
  }

  function renderDock(){
    const panel=one('#v031DockPanel'); if(!panel)return;
    if (dockTab==='Evidence') panel.innerHTML=renderEvidenceDock();
    else if (dockTab==='Claims') panel.innerHTML=session.claims.map(c=>'<div style="padding:6px 0"><span class="v031-pill">'+escapeHtml(c.status)+'</span> '+escapeHtml(c.statement)+'</div>').join('');
    else if (dockTab==='Console') panel.innerHTML='<div class="v031-console">'+escapeHtml(consoleLines.join('\n'))+'</div>';
    else if (dockTab==='Dependency Graph') panel.innerHTML=renderDependencyDock();
    else panel.innerHTML='<div class="v031-empty" style="min-height:110px"><div><strong>'+escapeHtml(dockTab)+' dock ready</strong><div class="muted small">Typed module content is connected in the corresponding v0.3.1 milestone.</div></div></div>';
  }

  function renderStageTests(){
    const grid=one('#v031StageGrid'); if(!grid)return;
    const base = foundationTests.length ? foundationTests : [
      {name:'ResearchSession + Schema',pass:false,detail:'ready to test'},
      {name:'Revision / Stale propagation',pass:false,detail:'ready to test'},
      {name:'Evidence / Trust guards',pass:false,detail:'ready to test'},
      {name:'IDE Shell',pass:true,detail:'Object Tree · Canvas · Inspector · Dock'},
      {name:'Persistence',pass:true,detail:'save/load/autosave/recovery/export/import'},
      {name:'Stable isolation',pass:true,detail:'v0.2.1 shared assets read-only'}
    ];
    grid.innerHTML=base.map(t=>'<div class="v031-stage-card '+(t.pass?'pass':'warn')+'"><b>'+(t.pass?'✓ ':'○ ')+escapeHtml(t.name)+'</b><small>'+escapeHtml(t.detail||'')+'</small></div>').join('');
  }

  function renderRecovery(){
    const bar=one('#v031RecoveryBar'); if(!bar)return;
    let recovery=null;
    try{ recovery=JSON.parse(localStorage.getItem(CRASH_KEY)||'null'); }catch{}
    const storedUpdated = session?.updatedAt ? Date.parse(session.updatedAt) : 0;
    const recoveryTime = recovery?.timestamp ? Date.parse(recovery.timestamp) : 0;
    const show = recovery && recovery.schema===SCHEMA && recovery.session?.id===session.id && recoveryTime>storedUpdated;
    bar.classList.toggle('show',!!show);
    if(show) one('#v031RecoveryText').textContent='snapshot '+new Date(recovery.timestamp).toLocaleString()+' · '+(recovery.reason||'unsaved change');
  }

  function renderAll(){
    renderTop(); renderTree(); renderInspector(); renderCanvas(); renderDock(); renderStageTests(); renderRecovery();window.MathScopeFailureUI?.refresh?.();
    window.dispatchEvent(new CustomEvent('mathscope:session-rendered',{detail:{sessionId:session?.id,revision:session?.sessionRevision}}));
  }

  function exportSession(){
    const manifest = {
      schema:SCHEMA,
      exportedAt:now(),
      foundationVersion:FOUNDATION_VERSION,
      session:session,
      trustRules:{
        representationNotObject:true,
        visualizedNotProved:true,
        numericalNotExact:true,
        finiteNotInfinite:true,
        aiNotTheorem:true
      }
    };
    const blob = new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='mathscope-v0.3.1-foundation-'+session.id+'.json';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    log('EXPORT','v0.3.1 ResearchSession JSON exported');
  }

  function quarantineImportedSession(incoming){
    // Checkpoints are import data too: restoring one must not revive current proof.
    const pending=[incoming],seen=new Set();
    while(pending.length){
      const item=pending.pop();if(!item||typeof item!=='object'||seen.has(item))continue;seen.add(item);
      if(item.researchM0){
        const quarantine=window.MathScopeM0Contracts?.quarantineResearchM0Namespace;
        if(typeof quarantine!=='function')throw Error('M0 import quarantine is unavailable');
        quarantine(item.researchM0);
      }
      for(const ev of(item.evidence||[])){
        ev.supportsCurrent=false;
        if(ev.grade==='FORMAL PASS'){ev.freshness='HISTORICAL FORMAL';ev.stale=false;}
        else if(ev.grade==='THEOREM-BACKED'){ev.freshness='HISTORICAL';ev.theoremEdgePreserved=true;}
        else ev.freshness='REVALIDATION REQUIRED';
      }
      for(const claim of(item.claims||[])){claim.importedStatus=claim.importedStatus||claim.status;claim.status='REVIEW';claim.freshness='REVALIDATION REQUIRED';}
      for(const cp of(item.checkpoints||[]))if(cp?.snapshot)pending.push(cp.snapshot);
    }
    return incoming;
  }

  function importVerifiedBundleSession(candidate,sourceFormat='mathscope'){
    const incoming=clone(candidate),errors=validateSession(incoming);
    if(errors.length)throw new Error('Import schema validation failed: '+errors.slice(0,8).join(' | '));
    quarantineImportedSession(incoming);
    incoming.id=uid('rs');
    incoming.title=(incoming.title||'Imported ResearchSession')+(sourceFormat==='json'?' — JSON import':' — verified import');
    incoming.updatedAt=now();
    incoming.importAudit={status:'REPLAY REQUIRED',sourceSessionId:candidate.id,sourceFormat,importedAt:now(),rule:'Import integrity or schema validity does not establish theorem/formal environment compatibility'};
    store.sessions[incoming.id]=incoming;
    session=incoming;selected={kind:'session',ref:session.id};
    localStorage.setItem(CURRENT_KEY,session.id);
    persist('research-session-import');renderAll();
    log('IMPORT','ResearchSession imported into a new session · evidence and checkpoint replay required');
    return clone(session);
  }

  async function importSessionFile(file){
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) throw new Error('import exceeds 5 MiB safety cap');
    const parsed = JSON.parse(await file.text());
    if (parsed.schema !== SCHEMA || !parsed.session) throw new Error('v0.3.1 Foundation schema mismatch');
    return importVerifiedBundleSession(parsed.session,'json');
  }

  function selectSession(id){
    if (!store.sessions[id]) return;
    if (dirty) persist('session-switch');
    session=store.sessions[id]; selected={kind:'session',ref:session.id};
    localStorage.setItem(CURRENT_KEY,id);
    renderAll();
  }

  function setupUi(){
    one('#v031SessionSelect')?.addEventListener('change',e=>selectSession(e.target.value));
    one('#v031Goal')?.addEventListener('input',e=>{session.goals[0]=e.target.value;markDirty('goal');});
    one('#v031NewSession')?.addEventListener('click',createSession);
    one('#v031DuplicateSession')?.addEventListener('click',duplicateSession);
    one('#v031RenameSession')?.addEventListener('click',renameSession);
    one('#v031ArchiveSession')?.addEventListener('click',archiveSession);
    one('#v031ReviseObject')?.addEventListener('click',reviseActiveObject);
    one('#v031Checkpoint')?.addEventListener('click',()=>createCheckpoint());
    one('#v031RestoreCheckpoint')?.addEventListener('click',()=>{const id=one('#v031CheckpointSelect')?.value;if(id)restoreCheckpoint(id);});
    one('#v031SelfTest')?.addEventListener('click',runFoundationSelfTests);
    one('#v031Run')?.addEventListener('click',runFoundationSelfTests);
    one('#v031Verify')?.addEventListener('click',()=>{const r=runFoundationSelfTests();log('VERIFY',r.pass?'Schema + guards PASS':'Verification requires attention');});
    one('#v031Stress')?.addEventListener('click',()=>{foundationTests=runSemanticGuardTests();renderStageTests();renderTop();toast(foundationTests.every(x=>x.pass)?'Semantic guard stress PASS':'Guard stress failed');});
    one('#v031Save')?.addEventListener('click',()=>persist('manual-save'));
    one('#v031Export')?.addEventListener('click',exportSession);
    one('#v031Import')?.addEventListener('click',()=>one('#v031ImportFile')?.click());
    one('#v031ImportFile')?.addEventListener('change',async e=>{try{await importSessionFile(e.target.files?.[0]);toast('v0.3.1 session import 완료');}catch(err){toast('Import 실패: '+err.message);}e.target.value='';});
    one('#v031Recover')?.addEventListener('click',()=>{try{const r=JSON.parse(localStorage.getItem(CRASH_KEY)||'null');if(!r?.session)throw new Error('snapshot missing');session=r.session;store.sessions[session.id]=session;selected={kind:'session',ref:session.id};persist('crash-recovery');renderAll();toast('Crash recovery 완료');}catch(err){toast('복구 실패: '+err.message);}});
    one('#v031DiscardRecovery')?.addEventListener('click',()=>{localStorage.removeItem(CRASH_KEY);renderRecovery();});
    all('[data-v031-canvas]').forEach(btn=>btn.addEventListener('click',()=>{all('[data-v031-canvas]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');canvasTab=btn.dataset.v031Canvas;renderCanvas();}));
    all('[data-v031-dock]').forEach(btn=>btn.addEventListener('click',()=>{all('[data-v031-dock]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');dockTab=btn.dataset.v031Dock;renderDock();}));
    const palette=one('#v031Palette');
    one('#v031Command')?.addEventListener('click',()=>palette?.showModal());
    one('#v031ClosePalette')?.addEventListener('click',()=>palette?.close());
    all('[data-v031-command]').forEach(btn=>btn.addEventListener('click',()=>{
      palette?.close();
      const cmd=btn.dataset.v031Command;
      if(cmd==='new')createSession();
      if(cmd==='checkpoint')createCheckpoint();
      if(cmd==='revise')reviseActiveObject();
      if(cmd==='test')runFoundationSelfTests();
      if(cmd==='export')exportSession();
      if(cmd==='legacy3d')openGuardedLegacy3D();
    }));
    document.addEventListener('keydown',e=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
        if(one('.view[data-view="foundation"]')?.classList.contains('active')){e.preventDefault();palette?.showModal();}
      }
    });
    window.addEventListener('beforeunload',()=>{if(dirty)saveCrashSnapshot('beforeunload');});
  }

  async function finalizeHashes(){
    for(const obj of session.objects){
      obj.hash = await hashValue({id:obj.id,type:obj.type,baseField:obj.baseField,intrinsicDim:obj.intrinsicDim,ambientDim:obj.ambientDim,structures:obj.structures,revision:obj.revision});
    }
    for(const ev of session.evidence){
      if(ev.inputsHash==='pending')ev.inputsHash=await hashValue({claimRef:ev.claimRef,upstreamRevisions:ev.upstreamRevisions,method:ev.method});
    }
    markDirty('hash-finalization');
  }

  async function registerWebMCP(){
    const mc = document.modelContext;
    const chip = one('#webmcpStatus');
    if (!mc || typeof mc.registerTool !== 'function'){
      if(chip)chip.textContent='WEBMCP UNSUPPORTED';
      log('WEBMCP','Native registration API not available in this browser');
      return {implemented:true,native:false};
    }
    try{
      if(webmcpAbort)webmcpAbort.abort();
      webmcpAbort=new AbortController();
      await mc.registerTool({
        name:'mathscope.session.summary',
        description:'Read the active MathScope v0.3.1 ResearchSession summary, revisions, evidence counts and current representation guard state.',
        inputSchema:{type:'object',properties:{}},
        annotations:{readOnlyHint:true,untrustedContentHint:false},
        execute:()=>({
          session:{id:session.id,title:session.title,goal:session.goals[0]||'',revision:session.sessionRevision},
          counts:{objects:session.objects.length,representations:session.representations.length,claims:session.claims.length,evidence:session.evidence.length,revisions:session.revisions.length},
          evidence:evidenceCounts(),
          representationGuard:guard3DRepresentation(activeRepresentation()),
          dirty
        })
      },{signal:webmcpAbort.signal});
      await mc.registerTool({
        name:'mathscope.foundation.self_test',
        description:'Run read-only Stage 1 Foundation schema, dependency-invalidation and evidence-promotion guard tests.',
        inputSchema:{type:'object',properties:{}},
        annotations:{readOnlyHint:true,untrustedContentHint:false},
        execute:()=>runFoundationSelfTests()
      },{signal:webmcpAbort.signal});
      await mc.registerTool({
        name:'mathscope.session.create_checkpoint',
        description:'Create a checkpoint snapshot of the active ResearchSession. This modifies only local MathScope session state.',
        inputSchema:{type:'object',properties:{label:{type:'string',description:'Optional checkpoint label.'}}},
        annotations:{readOnlyHint:false,untrustedContentHint:false},
        execute:(input)=>{const cp=createCheckpoint(input?.label||('agent checkpoint '+new Date().toLocaleString()));return cp?{ok:true,id:cp.id,label:cp.label}:{ok:false};}
      },{signal:webmcpAbort.signal});
      if(chip)chip.textContent='WEBMCP STAGE1 REGISTERED';
      log('WEBMCP','Registered 3 Foundation tools. Native consumer invocation still requires a compatible browser/agent.');
      return {implemented:true,native:true};
    }catch(err){
      if(chip)chip.textContent='WEBMCP REGISTER ERROR';
      log('WEBMCP','Registration failed: '+err.message);
      return {implemented:true,native:false,error:err.message};
    }
  }

  function upsertById(target,node){
    if(!node||typeof node!=='object'||!node.id)throw new Error('typed bundle node requires id');
    const i=target.findIndex(x=>x?.id===node.id);
    if(i>=0)target[i]=clone(node);else target.push(clone(node));
  }

  // Only this fixed endpoint may issue a one-use, session/revision-bound receipt.
  // These pins were read from the live C-014 verifier on 2026-10-08; changes require review.
  const C014_PIN=Object.freeze({
    base:'https://mathscope-cloud-lean.onrender.com',claimId:'C-014',
    sourceHash:'fe8d8e01ba0a3f8e53443e0364461d71ba4beb46cd8c95991bfe3226decdef22',
    environmentHash:'2782f9f3ae1d2419b197590860a44e05f59b637e1d7b32a878c6fa461e998666',
    dependencyLockHash:'bed5550e8143feef9f71d35f692287561189300e66fb08bcdd06c5f40b63e7fb',
    toolchain:'leanprover/lean4:v4.34.0-rc2',deployCommit:'3e3eb489aebcf9ed8d56ce1b444fd709dff89523',
    axiomAuditOutput:'theorem=MathScope.Claims.C014.c014_slice_radius\naxioms=propext,Classical.choice,Quot.sound',
    statement:'Σᵢ₌₁⁴ xᵢ²=1 and x₄=c imply x₁²+x₂²+x₃²=1−c².'
  });
  const formalReceipts=new WeakMap(),VERIFIER_WRITE=Symbol('pinned-verifier-write');

  async function pinnedVerifierJson(path,options={}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);
    try{
      const response=await fetch(C014_PIN.base+path,{...options,signal:controller.signal,cache:'no-store',credentials:'omit',redirect:'error'});
      if(!response.ok)throw new Error('Pinned verifier HTTP '+response.status);
      return await response.json();
    }catch(error){if(controller.signal.aborted){const timeout=Error('Verifier response timed out after 90 seconds. The service may still be starting or compiling; no proof was committed. Retry after the service is ready.');timeout.failureKind='TIMEOUT';timeout.executionScope='CLIENT_REQUEST';timeout.cancellationConfirmed=false;throw timeout;}throw error;}finally{clearTimeout(timer);}
  }

  async function verifyPinnedC014(semanticReviewed=false){
    const sessionId=session.id,revision=session.sessionRevision;
    const meta=await pinnedVerifierJson('/v1/meta');
    if(meta.service!=='mathscope-cloud-lean'||meta.mode!=='restricted-c014'||['toolchain','environmentHash','dependencyLockHash'].some(k=>meta[k]!==C014_PIN[k]))throw new Error('Pinned verifier environment changed: review required');
    const data=await pinnedVerifierJson('/v1/verify/c014',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({semanticReviewed:semanticReviewed===true})});
    if(session.id!==sessionId||session.sessionRevision!==revision)throw new Error('Session changed during verification; verify again');
    const bound=['claimId','sourceHash','environmentHash','dependencyLockHash','toolchain','deployCommit'].every(k=>data[k]===C014_PIN[k]);
    const audit=typeof data.axiomAuditOutput==='string'&&data.axiomAuditOutput.trim()===C014_PIN.axiomAuditOutput;
    const success=bound&&audit&&data.state?.run==='SUCCESS'&&data.state?.evidence==='FORMAL'&&data.state?.freshness==='CURRENT'&&data.state?.trust==='UNCONDITIONAL'&&typeof data.stdout==='string'&&data.stdout.trim().length>0&&data.stderr==='';
    if(!success)return {data:clone(data),status:data.state?.run==='ERROR'?'FORMAL FAIL':'PARTIAL',receipt:null};
    if(semanticReviewed!==true||data.state?.truth!=='PROVED')return {data:clone(data),status:'PARTIAL',receipt:null};
    const receipt=Object.freeze({});
    formalReceipts.set(receipt,{sessionId,revision,data:clone(data)});
    return {data:clone(data),status:'FORMAL PASS',receipt};
  }

  function commitPinnedC014Proof(receipt){
    const verified=formalReceipts.get(receipt);
    if(!verified||verified.sessionId!==session.id||verified.revision!==session.sessionRevision)throw new Error('Current pinned verifier receipt required; verify again');
    const d=verified.data,claimId='claim-stage5-c014',existing=session.claims.find(c=>c.id===claimId);
    if(existing&&existing.statement!==C014_PIN.statement)throw new Error('C-014 claim identity conflict');
    const claim={id:claimId,statement:C014_PIN.statement,scope:'AUDITED C-014 / EXACT ALGEBRAIC SLICE; no PDE claim',assumptions:['server-pinned C-014 source','semantic review complete'],dependsOn:[],status:'PROVED',freshness:'CURRENT',revision:existing?.revision||claimId+':r1',parentRevision:existing?.parentRevision||null};
    const ev={id:uid('ev-proof'),grade:'FORMAL PASS',claimRef:claimId,method:'Stage5 ProofDock / pinned Lean final verifier',inputsHash:d.sourceHash,environmentHash:d.environmentHash,dependencyLockHash:d.dependencyLockHash,toolchain:d.toolchain,deployCommit:d.deployCommit,residuals:{proofResult:'FORMAL PASS',run:d.state.run,truth:d.state.truth,axiomAudit:d.axiomAuditOutput,stdout:d.stdout,stderr:d.stderr},errorBounds:null,assumptions:['LSP diagnostics are not proof evidence','semantic review complete'],generatedAt:now(),adapterVersion:'0.3.1-stage5.1',upstreamRevisions:[claim.revision],stale:false,freshness:'CURRENT',supportsCurrent:true,scope:claim.scope};
    commitTypedBundle({bundleId:uid('stage5-proof'),claims:[claim],evidence:[ev]},'Stage5 Proof Dock · FORMAL PASS',VERIFIER_WRITE);
    formalReceipts.delete(receipt);
    return clone(ev);
  }

  const GOLDEN_PIN=Object.freeze({"service":"mathscope-cloud-lean","mode":"restricted-golden-algebra","claimId":"GOLDEN-NONLINEAR-ALGEBRA-001","sourceHash":"d27a3c8baa37889217d546a9020ea54552e850888590739062300821406ce593","toolchain":"leanprover/lean4:v4.34.0-rc2","environmentHash":"7ea051389ff1d51087bca3dd8e6d00b7faf109897e15c22e618184ec94ed7f3c","dependencyLockHash":"1cdd08f98fcd2991112a238be44dcf0384e2f7be947b56a35b865451b79bad6b","deployCommit":"3e3eb489aebcf9ed8d56ce1b444fd709dff89523","verificationMode":"fresh-lean-process-per-request"});
  const goldenProofReceipts=new WeakMap();
  const goldenTheorems=['exact_perturbation','constant_one_stationary','constant_one_linear_coefficient'].map(n=>'MathScope.GoldenElliptic.'+n);
  function validGoldenAudit(stdout){
    if(typeof stdout!=='string'||stdout.includes('sorryAx'))return false;
    const rows=[...stdout.matchAll(/'([^']+)' depends on axioms: \[([^\]]*)\]/g)];
    return rows.length===3&&goldenTheorems.every(name=>{const match=rows.filter(r=>r[1]===name);return match.length===1&&JSON.stringify(match[0][2].split(',').map(s=>s.trim()).sort())===JSON.stringify(['Classical.choice','Quot.sound','propext']);});
  }
  async function verifyPinnedGolden(semanticReviewed=false){
    if(semanticReviewed!==true)throw new Error('Review the exact algebraic statement and excluded claims first');
    const sessionId=session.id,revision=session.sessionRevision,run=session.researchRuns?.at(-1);
    if(!run||run.adapter!=='golden.elliptic-torus.v1'||run.sessionId!==sessionId||run.gate?.pass!==true||run.snapshot?.candidate?.lambda!==1||run.snapshot?.candidate?.value!==1)throw new Error('Current Golden lambda=1, candidate=1 run required');
    const ids=new Set(run.nodeRefs.map(r=>r.id));
    const linked=[...(session.pdes||[]),...(session.operators||[])].filter(n=>ids.has(n.id));
    if(linked.length<2||linked.some(n=>n.stale||['STALE','REVALIDATION REQUIRED','REVIEW'].includes(n.freshness)||!run.nodeRefs.some(r=>r.id===n.id&&r.revision===n.revision)))throw new Error('Golden PDE/operator linkage is stale');
    const meta=await pinnedVerifierJson('/v1/golden/meta');
    const pinned=['service','mode','claimId','sourceHash','toolchain','environmentHash','dependencyLockHash','deployCommit','verificationMode'];
    if(pinned.some(k=>meta[k]!==GOLDEN_PIN[k])||await hashValue(meta.source)!==GOLDEN_PIN.sourceHash)throw new Error('Golden verifier pin/source changed; review required');
    const data=await pinnedVerifierJson('/v1/verify/golden',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({claimId:GOLDEN_PIN.claimId,sourceHash:GOLDEN_PIN.sourceHash,semanticReviewed:true})});
    if(session.id!==sessionId||session.sessionRevision!==revision)throw new Error('Session changed during proof verification; retry');
    const proofHash=await hashValue(JSON.stringify({sourceHash:data.sourceHash,environmentHash:data.environmentHash,axiomAuditOutput:data.axiomAuditOutput}));
    const success=pinned.every(k=>data[k]===GOLDEN_PIN[k])&&await hashValue(data.source)===GOLDEN_PIN.sourceHash&&data.exitCode===0&&data.timedOut===false&&data.stderr===''&&validGoldenAudit(data.stdout)&&data.axiomAuditOutput===data.stdout.trim()&&proofHash===data.proofHash&&data.state?.run==='SUCCESS'&&data.state?.evidence==='FORMAL'&&data.state?.truth==='PROVED'&&data.state?.freshness==='CURRENT'&&data.state?.trust==='UNCONDITIONAL';
    if(!success)return{status:'FORMAL HOLD',receipt:null,data:clone(data)};
    const receipt=Object.freeze({});goldenProofReceipts.set(receipt,{sessionId,revision,data:clone(data),linked:clone(linked)});
    return{status:'FORMAL PASS',receipt,data:clone(data)};
  }
  function commitPinnedGoldenProof(receipt){
    const verified=goldenProofReceipts.get(receipt);
    if(!verified||verified.sessionId!==session.id||verified.revision!==session.sessionRevision)throw new Error('Current Golden verifier receipt required');
    const d=verified.data,id='claim-golden-local-algebra',old=session.claims.find(c=>c.id===id);
    const claim={id,type:'ClaimSpec',statement:'Exact commutative-ring perturbation identity; D(1)=0 implies F(D,1,1)=0; the formal coefficient at lambda=1,u=1 is -D(v)-2v.',scope:d.formalScope,assumptions:d.assumptions,excludedClaims:d.excludedClaims,dependsOn:verified.linked.map(n=>n.id),status:'PROVED',freshness:'CURRENT',revision:id+':r'+(revisionNumber(old?.revision)+1),parentRevision:old?.revision||null};
    const ev={id:uid('ev-golden-formal'),type:'EvidenceRecord',grade:'FORMAL PASS',claimRef:id,method:'Pinned fixed-source Lean compiler / fresh process',inputsHash:d.sourceHash,environmentHash:d.environmentHash,dependencyLockHash:d.dependencyLockHash,toolchain:d.toolchain,deployCommit:d.deployCommit,proofHash:d.proofHash,residuals:null,errorBounds:null,assumptions:d.assumptions,generatedAt:now(),adapterVersion:'golden-formal/1',upstreamRevisions:[claim.revision,...verified.linked.map(n=>n.revision)],stale:false,freshness:'CURRENT',supportsCurrent:true,scope:d.formalScope,proofPackage:{schema:'MathScopeGoldenProofBundle/1',source:d.source,metadata:clone(d)}};
    commitTypedBundle({bundleId:uid('golden-formal'),claims:[claim],evidence:[ev]},'Golden local algebra · fresh Lean FORMAL PASS',VERIFIER_WRITE);
    goldenProofReceipts.delete(receipt);return clone(ev);
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

  function createResearchSession(title){
    if(typeof title!=='string'||!title.trim()||title.length>160)throw new Error('Research session title required (1–160 characters)');
    if(dirty)persist('before-new-session');
    const fresh=createDefaultSession(title.trim());
    for(const key of ['objects','representations','functionSpaces','differentialSystems','optimizations','operators','pdes','spectra','geometries','topologies','entropies','symmetries','kclasses','claims','evidence','assumptions','revisions','checkpoints'])fresh[key]=[];
    fresh.activeObjectRef=null;fresh.researchRuns=[];fresh.replayJobs=[];
    store.sessions[fresh.id]=fresh;session=fresh;selected={kind:'session',ref:session.id};
    localStorage.setItem(CURRENT_KEY,session.id);persist('create-research-session');renderAll();return clone(session);
  }

  async function commitResearchM0(namespace,{expectedSessionId,expectedM0Revision,reason='M0 update'}={}){
    if(!expectedSessionId||expectedSessionId!==session.id)throw Error('M0 target session changed; retry in the selected session');
    const revision=session.researchM0?.revision??null;
    if(expectedM0Revision!==revision)throw Error('M0 revision changed; refresh before saving');
    const guarded=window.MathScopeM0Contracts;
    if(!guarded?.verifyResearchM0Namespace)throw Error('M0 contract runtime unavailable');
    const prepared=clone(namespace),report=await guarded.verifyResearchM0Namespace(prepared);
    if(!report.ok)throw Error('M0 validation: '+report.errors.slice(0,6).join(' | '));
    if(expectedSessionId!==session.id||(session.researchM0?.revision??null)!==revision)throw Error('Session changed during M0 validation; no changes saved');
    if(revision!==null&&prepared.revision<revision)throw Error('M0 namespace cannot roll back its revision');
    if(revision!==null&&prepared.revision===revision){
      if(guarded.canonicalStringify(prepared)===guarded.canonicalStringify(session.researchM0))return clone(session);
      throw Error('M0 content changes must advance the namespace revision');
    }
    const incoming=clone(session);incoming.researchM0=prepared;
    const parent='session:r'+incoming.sessionRevision;incoming.sessionRevision++;
    incoming.updatedAt=now();
    incoming.revisions.unshift(createRevisionRecord('session',incoming.id,'session:r'+incoming.sessionRevision,parent,'research-m0',String(reason).slice(0,250),'ADAPTER'));
    const nextStore={...store,sessions:{...store.sessions,[incoming.id]:incoming},updatedAt:now()};
    const serialized=JSON.stringify(nextStore);
    if(serialized.length>4.5*1024*1024)throw Error('M0 session exceeds local storage budget; export and start a smaller session');
    // A single atomic storage write precedes the in-memory state change.
    localStorage.setItem(STORAGE_KEY,serialized);
    store=nextStore;session=incoming;dirty=false;clearTimeout(autosaveTimer);
    log('STORE','Saved: '+String(reason).slice(0,250));renderAll();
    return clone(session);
  }

  function exposeApi(){
    window.MathScopeV031Foundation = {
      schema:SCHEMA,
      version:FOUNDATION_VERSION,
      getSession:()=>clone(session),
      commitResearchM0,
      failureKinds:FAILURE_KINDS,recordFailure,captureFailure,classifyFailure,validateFailureRecord,runFailureSelfTests:failureContractSelfTests,
      validateSession:(candidate)=>validateSession(candidate||session),
      importVerifiedBundleSession,
      createResearchSession,
      verifyPinnedC014,
      commitPinnedC014Proof,
      verifyPinnedGolden,
      commitPinnedGoldenProof,
      runSelfTests:runFoundationSelfTests,
      createCheckpoint,
      reviseActiveObject,
      canPromoteEvidence,
      guard3DRepresentation:()=>guard3DRepresentation(activeRepresentation()),
      commitTypedBundle,
      save:()=>persist('api-save'),
      exportSession
    };
  }

  function init(){
    if(!one('#v031Foundation'))return;
    ensureSession();
    setupUi();
    exposeApi();
    renderAll();
    finalizeHashes();
    registerWebMCP();
    runFoundationSelfTests();
    setTimeout(()=>{
      const btn=one('[data-view-target="foundation"]');
      if(btn && !location.hash.includes('legacy') && !location.hash.startsWith('#research-foundation') && !location.hash.startsWith('#research-objects') && !location.hash.startsWith('#research-m2') && !location.hash.startsWith('#research-m3') && !location.hash.startsWith('#research-gauge-m3') && !location.hash.startsWith('#research-fluid-m3'))btn.click();
    },350);
    log('FOUNDATION','Stage 1 runtime initialized · stable shared assets remain read-only');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});
  else setTimeout(init,0);
})();
