
(() => {
  'use strict';
  const SERVICE='https://mathscope-compute.onrender.com',ADAPTER='golden.elliptic-torus.v1';
  const $=s=>document.querySelector(s),clone=v=>JSON.parse(JSON.stringify(v)),api=()=>window.MathScopeV031Foundation;
  let controller=null,lastReplay=null,imported=null,sceneState=null,viewStatus=null,viewSerial=0;
  const collections=['objects','functionSpaces','operators','pdes','spectra','geometries','topologies','symmetries','kclasses','claims','representations','evidence'];
  const put=(text,detail)=>{$('#v031GoldenStatus').textContent=text;if(detail)$('#v031GoldenDetail').textContent=JSON.stringify(detail,null,2);};
  function goldenFrom(result){const g=result?.outputRepresentations?.find(x=>x.type==='GoldenSessionSpec');if(!g?.typedBundle||!g?.executableReplayRecord)throw Error('Incomplete Golden adapter response');return g;}
  function status(){
    const s=api()?.getSession(),run=s?.researchRuns?.filter(x=>x.adapter===ADAPTER).at(-1);
    if(!run)return{current:false,pass:false,reason:'No Golden run in current session',replay:null};
    const actual=collections.flatMap(k=>s[k]||[]),refs=run.nodeRefs||[];
    const usable=n=>!n.stale&&!['STALE','REVALIDATION REQUIRED','REVIEW'].includes(n.freshness)&&!['REVIEW','REVALIDATION REQUIRED'].includes(n.status)&&(n.type!=='EvidenceRecord'||(n.freshness==='CURRENT'&&n.supportsCurrent===true));
    const missing=refs.filter(ref=>!actual.some(n=>n.id===ref.id&&n.revision===ref.revision&&usable(n)));
    const wrongSession=run.sessionId!==s.id;
    const replayCurrent=lastReplay&&lastReplay.targetSessionId===s.id&&lastReplay.targetRevision===run.sessionRevision&&!wrongSession&&!missing.length;
    return{sessionId:s.id,sessionRevision:s.sessionRevision,runRevision:run.sessionRevision,current:!wrongSession&&!missing.length,pass:run.gate?.pass===true&&!wrongSession&&!missing.length,missing,gate:run.gate,numericalHash:run.numericalHash,replay:replayCurrent?lastReplay:null,view:viewStatus?.sessionId===s.id&&viewStatus?.revision===run.sessionRevision?viewStatus:null,proofReplay:proofReplay?.sessionId===s.id&&s.evidence.some(e=>e.id===proofReplay.evidenceId&&e.supportsCurrent===true&&e.freshness==='CURRENT')?proofReplay:null,proof:'Numerical integration does not issue FORMAL PASS'};
  }
  let lastJobExecution=null;
  async function request(path,body){
    if(controller)throw Error('A Golden request is already running');
    const task=window.MathScopeJobs.start({kind:path==='/v1/replay'?'replay':'run',...body},{onStatus:j=>put('SERVER '+j.status.toUpperCase()+' · '+j.phase+' · '+Math.round(j.elapsedMs||0)+' ms')});
    controller=task;$('#v031GoldenCancel').disabled=false;
    try{const out=await task.promise;lastJobExecution=out.job;return out.result;}
    finally{if(controller===task)controller=null;$('#v031GoldenCancel').disabled=true;}
  }
  function commit(result,expected){
    const s=api().getSession();if(s.id!==expected.id||s.sessionRevision!==expected.sessionRevision)throw Error('Session changed while computing; result not committed');
    const g=goldenFrom(result),bundle=clone(g.typedBundle);
    const representedSource=bundle.representations?.[0]?.sourceObjectRef;
    bundle.activeObjectRef=bundle.objects?.some(o=>o.id===representedSource)?representedSource:bundle.objects?.[0]?.id;
    if(g.sessionId!==s.id||g.sessionRevision!==s.sessionRevision+1)throw Error('Golden session/revision binding mismatch');
    if((bundle.evidence||[]).some(e=>e.grade!=='NUMERICAL INDICATOR'))throw Error('Numerical adapter attempted proof-grade evidence');
    for(const e of bundle.evidence||[]){e.freshness='CURRENT';e.supportsCurrent=true;}
    const run={id:'golden-run:r'+g.sessionRevision,adapter:ADAPTER,sessionId:s.id,sessionRevision:g.sessionRevision,numericalHash:g.numericalHash,gate:g.gate,nodeRefs:collections.flatMap(k=>bundle[k]||[]).filter(n=>n.revision).map(n=>({id:n.id,revision:n.revision})),snapshot:g.numericalSnapshot,environment:result.environment,generatedAt:new Date().toISOString()};
    bundle.researchRuns=[run];bundle.replayJobs=[{id:'golden-job:r'+g.sessionRevision,runRef:run.id,adapter:ADAPTER,record:g.executableReplayRecord,resultSnapshot:g.numericalSnapshot,environment:result.environment,sourceSessionId:s.id,sourceRevision:g.sessionRevision,jobExecution:lastJobExecution?clone(lastJobExecution):null}];
    const committed=api().commitTypedBundle(bundle,'Golden nonlinear elliptic A→B→C→D');
    if(committed.sessionRevision!==g.sessionRevision)throw Error('Committed revision mismatch');
    draw(g);return g;
  }
  function draw(g){
    const c=$('#v031GoldenCanvas'),ctx=c?.getContext('2d');if(!ctx)return;
    const mesh=g.numericalSnapshot.mesh,n=mesh.gridN,w=c.width,h=c.height;ctx.fillStyle='#091625';ctx.fillRect(0,0,w,h);
    for(const p of mesh.vertices){ctx.fillStyle='hsl('+(180+65*p.eigenmodeValue)+',70%,50%)';ctx.fillRect(w/2+p.x*w/2,p.y*h,w/(2*n)+1,h/n+1);ctx.fillStyle='hsl('+(150+10*p.candidateValue)+',60%,55%)';ctx.fillRect(p.x*w/2,p.y*h,w/(2*n)+1,h/n+1);}
    ctx.fillStyle='#07111e';ctx.font='18px sans-serif';ctx.fillText('u*='+g.numericalSnapshot.candidate.value+' (stored)',14,28);ctx.fillStyle='#fff';ctx.fillText('stored periodic eigenmode',w/2+14,28);
    $('#v031GoldenDescription').textContent='Unit flat torus [0,1)² with periodic edges. Left: stored constant candidate. Right: stored real Fourier mode cos(2πx) in [−1,1], constant along y. These are field charts. '+(g.gate?.pass?'Golden numerical checks passed.':'Inspect Golden checks.')+' Continuum stability and full PDE formalization are not asserted.';
    renderMesh(g).catch(e=>{$('#v031Golden3DStatus').textContent='3D HOLD · '+e.message;viewStatus={pass:false,error:e.message};});
  }
  async function renderMesh(g){
    const serial=++viewSerial,T=await import('three');if(serial!==viewSerial)return;
    if(sceneState){sceneState.events.abort();sceneState.observer.disconnect();sceneState.geometry.dispose();sceneState.material.dispose();sceneState.renderer.dispose();}
    const canvas=$('#v031Golden3D'),mesh=g.numericalSnapshot.mesh,renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));
    const scene=new T.Scene();scene.background=new T.Color(0x091625);const camera=new T.PerspectiveCamera(45,1,.1,100);camera.up.set(0,0,1);
    const geometry=new T.BufferGeometry(),positions=[],colors=[];
    for(const p of mesh.vertices){positions.push(...p.display3D);const color=new T.Color().setHSL((180+65*p.eigenmodeValue)/360,.7,.5);colors.push(color.r,color.g,color.b);}
    geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(mesh.triangles.flat());geometry.computeVertexNormals();
    const material=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide}),surface=new T.Mesh(geometry,material);scene.add(surface);
    let theta=.6,phi=.55,dist=8,width=0,height=0,down=false,x=0,y=0;const events=new AbortController();
    function render(){const nw=Math.max(200,canvas.clientWidth),nh=Math.max(200,canvas.clientHeight);if(nw!==width||nh!==height){width=nw;height=nh;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}camera.position.set(dist*Math.cos(phi)*Math.cos(theta),dist*Math.cos(phi)*Math.sin(theta),dist*Math.sin(phi));camera.lookAt(0,0,0);renderer.render(scene,camera);canvas.dataset.camera=JSON.stringify({theta,phi,dist});}
    canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')theta-=.12;if(e.key==='ArrowRight')theta+=.12;if(e.key==='ArrowUp')phi=Math.min(1.3,phi+.1);if(e.key==='ArrowDown')phi=Math.max(-1.3,phi-.1);if(['+','='].includes(e.key))dist=Math.max(3,dist/1.1);if(e.key==='-')dist=Math.min(25,dist*1.1);if(e.key==='Home'){theta=.6;phi=.55;dist=8;}render();},{signal:events.signal});
    canvas.addEventListener('pointerdown',e=>{down=true;x=e.clientX;y=e.clientY;canvas.setPointerCapture?.(e.pointerId);},{signal:events.signal});
    canvas.addEventListener('pointermove',e=>{if(!down)return;theta+=(e.clientX-x)*.008;phi=Math.max(-1.3,Math.min(1.3,phi+(e.clientY-y)*.008));x=e.clientX;y=e.clientY;render();},{signal:events.signal});
    for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,()=>{down=false;},{signal:events.signal});
    canvas.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(3,Math.min(25,dist*(1+.08*Math.sign(e.deltaY))));render();},{passive:false,signal:events.signal});
    const observer=new ResizeObserver(render);observer.observe(canvas);sceneState={events,observer,renderer,geometry,material};render();
    viewStatus={pass:true,sessionId:g.sessionId,revision:g.sessionRevision,vertices:mesh.vertices.length,triangles:mesh.triangles.length,numericalHash:g.numericalHash,source:'stored mesh/display3D and eigenmodeValue',metricPreserved:false,visualizationIsProof:false};
    $('#v031Golden3DStatus').textContent='WEBGL RENDERED · '+mesh.vertices.length+' stored vertices · '+mesh.triangles.length+' triangles · colors = stored eigenmode. The embedded torus does not preserve the flat metric.';
  }
  async function trackedGolden(operation,fn){
    const start=api().getSession(),failureContext={sessionId:start.id,sessionRevision:start.sessionRevision,inputSpec:{},stage:'Golden',operation,adapter:ADAPTER,executionScope:'CLIENT_REQUEST'};
    try{return await fn(failureContext)}catch(error){api().captureFailure(error,failureContext);throw error;}
  }
  async function run(){return trackedGolden('run',runCore);}
  async function runCore(failureContext){
    if(controller)return;
    lastReplay=null;imported=null;
    let s=api().getSession();if(s.title!=='Nonlinear Elliptic Prototype')s=api().createResearchSession('Nonlinear Elliptic Prototype');
    Object.assign(failureContext,{sessionId:s.id,sessionRevision:s.sessionRevision,inputSpec:{sessionId:s.id,revision:s.sessionRevision+1,lambda:1,candidateValue:1,gridN:16,refinements:[8,16,32],seed:0}});
    put('Running Golden A → B → C → D…');
    const result=await request('/v1/run',{adapter:ADAPTER,inputSpec:{sessionId:s.id,revision:s.sessionRevision+1,lambda:1,candidateValue:1,gridN:16,refinements:[8,16,32],seed:0},environment:{client:'MathScope v0.3.1 Golden'}});
    const g=commit(result,s);put((g.gate?.pass?'GOLDEN NUMERICAL PASS':'GOLDEN HOLD')+' · same session and revision · FORMAL coverage remains separate',status());return status();
  }
  async function replay(){return trackedGolden('replay',replayCore);}
  async function replayCore(failureContext){
    const s=api().getSession(),job=s.replayJobs?.filter(j=>j.adapter===ADAPTER).at(-1);
    if(!job?.record)throw Error('Import a Golden bundle or run Golden first. Legacy evidence without adapter inputs cannot be replayed.');
    Object.assign(failureContext,{sessionId:s.id,sessionRevision:s.sessionRevision,inputSpec:job.record.inputSpec||{},inputsHash:job.record.expectedInputsHash||null,jobId:job.id,provenance:{targetRevision:s.sessionRevision+1}});
    put('Replaying stored numerical job and checking environment…');
    const report=await request('/v1/replay',{record:job.record,targetSessionId:s.id,targetRevision:s.sessionRevision+1});
    if(report.pass===true&&report.result)commit(report.result,s);else api().recordFailure('EXECUTION_ERROR',{...failureContext,cause:'Numerical replay comparison did not pass',provenance:{comparison:report.comparison||null,reason:report.reason||null}});
    const {result:unusedResult,sourceRecord:unusedRecord,...summary}=report;lastReplay=clone(summary);
    put((report.pass?'NUMERICAL REPLAY PASS':'NUMERICAL REPLAY HOLD')+' · proof replay is independent',status());return lastReplay;
  }
  async function bundleFiles(s){
    const jobs=s.replayJobs||[],runs=s.researchRuns||[];
    const proofs=s.evidence.filter(e=>e.proofPackage?.schema==='MathScopeGoldenProofBundle/1'),last=proofs.at(-1),proofFiles={};
    if(last){proofFiles['lean/GoldenAlgebra.lean']=last.proofPackage.source;proofFiles['lean/lean-toolchain']=last.toolchain+'\n';proofFiles['lean/golden-proof.json']=JSON.stringify(last.proofPackage,null,2);}
    proofFiles['lean/coverage.json']=JSON.stringify({embeddedLeanSourceAvailable:!!last,proofs:proofs.map(e=>({id:e.id,sourceHash:e.inputsHash,environmentHash:e.environmentHash,proofHash:e.proofHash,scope:e.scope})),formalEvidenceWithoutSource:s.evidence.filter(e=>e.grade==='FORMAL PASS'&&!e.proofPackage).map(e=>e.id),replayRequired:true},null,2);
    return{...proofFiles,
      'numerics/jobs.json':JSON.stringify({schema:'MathScopeExecutableJobs/1',jobs,unreplayableEvidence:s.evidence.filter(e=>e.grade!=='FORMAL PASS'&&!jobs.some(j=>e.inputsHash===j.record?.expectedInputsHash)).map(e=>({id:e.id,grade:e.grade,reason:'No executable job associated; not replayed by this bundle'}))},null,2),
      'numerics/golden-runs.json':JSON.stringify(runs,null,2),
      'numerics/data.json':JSON.stringify(jobs.map(j=>({jobId:j.id,snapshot:j.resultSnapshot})),null,2),
      'environment/numerics.lock':JSON.stringify(jobs.map(j=>({jobId:j.id,environment:j.environment})),null,2),
      'revisions/all.json':JSON.stringify(s.revisions,null,2),
      'provenance/golden.json':JSON.stringify(runs.map(r=>({id:r.id,sessionId:r.sessionId,revision:r.sessionRevision,nodes:r.nodeRefs,hash:r.numericalHash})),null,2)
    };
  }
  async function validateBundleFiles(files,s){
    const proof=s.evidence.filter(e=>e.proofPackage?.schema==='MathScopeGoldenProofBundle/1').at(-1);
    if(proof){
      const source=files['lean/GoldenAlgebra.lean'];if(!source||!files['lean/golden-proof.json']||!files['lean/lean-toolchain'])throw Error('Formal source/environment files missing');
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',source))).map(v=>v.toString(16).padStart(2,'0')).join('');
      if(digest!==proof.inputsHash||new TextDecoder().decode(source)!==proof.proofPackage.source)throw Error('Formal source hash mismatch');
      if(JSON.stringify(JSON.parse(new TextDecoder().decode(files['lean/golden-proof.json'])))!==JSON.stringify(proof.proofPackage))throw Error('Formal metadata mismatch');
      if(new TextDecoder().decode(files['lean/lean-toolchain']).trim()!==proof.toolchain)throw Error('Formal toolchain mismatch');
    }
    if(!(s.replayJobs?.length))return;
    for(const p of ['numerics/jobs.json','numerics/golden-runs.json','numerics/data.json','environment/numerics.lock','revisions/all.json','provenance/golden.json'])if(!files[p])throw Error('Executable bundle missing '+p);
    const decode=p=>JSON.parse(new TextDecoder().decode(files[p]));
    if(JSON.stringify(decode('numerics/jobs.json').jobs)!==JSON.stringify(s.replayJobs))throw Error('Executable jobs differ from session');
    if(JSON.stringify(decode('numerics/golden-runs.json'))!==JSON.stringify(s.researchRuns))throw Error('Golden provenance differs from session');
    const expected={
      'numerics/data.json':s.replayJobs.map(j=>({jobId:j.id,snapshot:j.resultSnapshot})),
      'environment/numerics.lock':s.replayJobs.map(j=>({jobId:j.id,environment:j.environment})),
      'revisions/all.json':s.revisions,
      'provenance/golden.json':s.researchRuns.map(r=>({id:r.id,sessionId:r.sessionId,revision:r.sessionRevision,nodes:r.nodeRefs,hash:r.numericalHash}))
    };
    for(const [path,value] of Object.entries(expected))if(JSON.stringify(decode(path))!==JSON.stringify(value))throw Error('Bundle sidecar differs from session: '+path);
    for(const job of s.replayJobs)if(job.adapter!==ADAPTER||job.record?.adapter!==ADAPTER)throw Error('Unsupported executable adapter');
  }
  function onImport(report,s){imported={sourceSessionId:report.session.id,targetSessionId:s.id};lastReplay=null;proofReplay=null;$('#v031GoldenProofReviewed').checked=false;$('#v031GoldenProofStatus').textContent='HISTORICAL FORMAL · fresh Lean proof replay required';put('IMPORT VERIFIED · new session · numerical and proof replay required',imported);}
  let proofReplay=null;
  async function verifyProof(){return trackedGolden('verify-local-algebra',verifyProofCore);}
  async function verifyProofCore(failureContext){
    const reviewed=$('#v031GoldenProofReviewed')?.checked===true;
    const s=api().getSession(),prior=s.evidence.filter(e=>e.proofPackage?.schema==='MathScopeGoldenProofBundle/1').at(-1);
    Object.assign(failureContext,{sessionId:s.id,sessionRevision:s.sessionRevision,adapter:'golden-local-algebra',inputSpec:{semanticReviewed:reviewed,priorSourceHash:prior?.inputsHash||null}});
    $('#v031GoldenProofStatus').textContent='Lean compilation running against fixed audited source…';
    const verified=await api().verifyPinnedGolden(reviewed);
    if(verified.status!=='FORMAL PASS'||!verified.receipt){const error=Error('Formal verification did not satisfy pinned contract');error.failureKind=verified.data?.timedOut?'TIMEOUT':/DEPENDENCY[ _]MISSING/.test(verified.data?.state?.run||'')?'FORMAL_DEPENDENCY_MISSING':'EXECUTION_ERROR';api().captureFailure(error,{...failureContext,provenance:{run:verified.data?.state?.run||null,sourceHash:verified.data?.sourceHash||null,environmentHash:verified.data?.environmentHash||null,exitCode:verified.data?.exitCode??null,stderr:verified.data?.stderr||''}});$('#v031GoldenProofStatus').textContent='FORMAL HOLD · compiler output did not match pinned contract; failure recorded';return;}
    const e=api().commitPinnedGoldenProof(verified.receipt);
    proofReplay={sessionId:s.id,evidenceId:e.id,pass:prior?prior.inputsHash===e.inputsHash&&prior.environmentHash===e.environmentHash&&prior.proofHash===e.proofHash:true,kind:prior?'FRESH_PROOF_REPLAY':'FRESH_PROOF_VERIFICATION',sourceHash:e.inputsHash,environmentHash:e.environmentHash,proofHash:e.proofHash,elapsedMs:verified.data.elapsedMs,scope:e.scope};
    $('#v031GoldenProofStatus').textContent='FORMAL PASS · local algebra only · '+(proofReplay.pass?proofReplay.kind:'REPLAY ENVIRONMENT OR PROOF HASH CHANGED')+' · '+verified.data.elapsedMs+' ms';
    put('Golden numerical and local formal results recorded separately',status());return proofReplay;
  }
  const catchAction=fn=>()=>fn().catch(e=>put(e.name==='AbortError'?(e.cancellationConfirmed?'SERVER CANCELLED · worker stop confirmed · no result committed':'CANCELLATION UNCONFIRMED · no result committed'):'GOLDEN HOLD · '+e.message));
  function init(){
    $('#v031GoldenProof')?.addEventListener('click',()=>verifyProof().catch(e=>{$('#v031GoldenProofStatus').textContent='FORMAL HOLD · '+e.message;}));
    $('#v031GoldenRun')?.addEventListener('click',catchAction(run));$('#v031GoldenReplay')?.addEventListener('click',catchAction(replay));$('#v031GoldenCancel')?.addEventListener('click',()=>{if(controller){put('CANCELLATION REQUESTED · waiting for actual server worker stop');controller.cancel();}});
    window.MathScopeGolden={run,replay,status,bundleFiles,validateBundleFiles,onImport,verifyProof};
    const mc=document.modelContext;if(mc?.registerTool){const own=new AbortController();window.addEventListener('pagehide',()=>own.abort(),{once:true});try{mc.registerTool({name:'mathscope.stage8.golden_status',description:'Read the current linked Golden numerical session, revision checks and replay outcome. Does not run jobs or promote evidence.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:async()=>status()},{signal:own.signal});}catch(e){console.warn('Golden WebMCP unavailable: '+e.name);}}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

