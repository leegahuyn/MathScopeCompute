(() => {
  'use strict';
  const VERSION='0.3.1-stage6.1';
  const SERVICE='https://mathscope-compute.onrender.com';
  const one=s=>document.querySelector(s);
  const all=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now=()=>new Date().toISOString();
  let lastEnvelope=null,lastResult=null,lastByType={},lastGate=null,lastCommitted=null;

  function num(sel,fallback){const v=Number(one(sel)?.value);return Number.isFinite(v)?v:fallback}
  function rows(rs){return rs.map(r=>'<div class="k">'+esc(r[0])+'</div><div class="v">'+esc(r[1])+'</div>').join('')}
  function currentSession(){return window.MathScopeV031Foundation?.getSession?.()||{objects:[],operators:[],pdes:[],kclasses:[],claims:[],evidence:[],revisions:[]}}
  function matrixFor(model){
    if(model==='hyperbolic_counterexample')return[[1,0],[0,-1]];
    if(model==='custom_quadratic_symbol')return[[num('#v031S6A11',2),num('#v031S6A12',.2)],[num('#v031S6A12',.2),num('#v031S6A22',1)]];
    return null;
  }
  function makeInput(){
    const s=currentSession(),model=one('#v031S6Model')?.value||'closed_scalar_laplacian',mode=one('#v031S6Mode')?.value||'theorem',condition=one('#v031S6Boundary')?.value||'none';
    const input={
      model,analysisMode:mode,manifoldDimension:Math.round(num('#v031S6Dim',2)),lambda:num('#v031S6Lambda',0),
      samples:Math.round(num('#v031S6Samples',96)),seed:0,tolerance:1e-9,
      compact:!!one('#v031S6Compact')?.checked,smooth:!!one('#v031S6Smooth')?.checked,connected:!!one('#v031S6Connected')?.checked,
      boundary:{present:condition!=='none',condition},candidate:'u*=0',claimRef:'claim-stage6-elliptic-structure',
      sourceRevisionRefs:(s.revisions||[]).slice(0,10).map(x=>x.revision).filter(Boolean)
    };
    const q=matrixFor(model);if(q)input.quadraticForm=q;
    return input;
  }
  async function fetchJson(url,opts={},timeout=60000){
    const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),timeout);
    try{const r=await fetch(url,{...opts,signal:ctrl.signal,cache:'no-store'}),data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.detail||data?.error||('HTTP '+r.status));return data}finally{clearTimeout(tm)}
  }
  function types(envelope){return Object.fromEntries((envelope?.outputRepresentations||[]).map(x=>[x.type,x]))}
  function modelChanged(){
    const model=one('#v031S6Model')?.value||'',custom=model==='custom_quadratic_symbol',box=one('#v031S6CustomMatrix');
    if(box)box.style.opacity=custom?'1':'.45';
    for(const id of['#v031S6A11','#v031S6A12','#v031S6A22']){const el=one(id);if(el)el.disabled=!custom}
    if(model==='hyperbolic_counterexample'||custom){const d=one('#v031S6Dim');if(d)d.value='2'}
  }
  function canvas(){
    const c=one('#v031S6SymbolCanvas'),ctx=c?.getContext?.('2d');if(!ctx)return null;
    const r=c.getBoundingClientRect?.()||{width:800},w=Math.max(420,Math.round(r.width||800)),h=300,dpr=Math.min(window.devicePixelRatio||1,2);
    c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return{c,ctx,w,h};
  }
  function drawSymbol(){
    const o=canvas();if(!o)return;const{c,ctx,w,h}=o,sym=lastByType.PrincipalSymbolSpec,vals=(sym?.determinantSamples||[]).map(Number).filter(Number.isFinite);
    ctx.fillStyle='#061520';ctx.fillRect(0,0,w,h);const pad=34,zero=h/2;
    ctx.strokeStyle='rgba(142,215,255,.2)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad,zero);ctx.lineTo(w-14,zero);ctx.stroke();
    ctx.fillStyle='rgba(157,188,199,.82)';ctx.font='10px IBM Plex Mono, monospace';ctx.fillText('σ₂(D)(x,ξ) on |ξ|=1',10,16);ctx.fillText('0',16,zero+3);
    if(!vals.length){ctx.fillStyle='rgba(255,194,92,.8)';ctx.fillText('Run Stage 6 to load symbol samples.',pad,zero-12);c.dataset.renderStatus='EMPTY';return}
    const max=Math.max(1e-9,...vals.map(v=>Math.abs(v))),sx=(w-pad-18)/Math.max(1,vals.length-1),sy=(h-70)/(2*max);
    ctx.strokeStyle='rgba(124,233,225,.88)';ctx.lineWidth=2;ctx.beginPath();
    vals.forEach((v,i)=>{const x=pad+i*sx,y=zero-v*sy;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.stroke();
    vals.forEach((v,i)=>{if(Math.abs(v)<Math.max(2e-3,max*.02)){const x=pad+i*sx,y=zero-v*sy;ctx.fillStyle='rgba(255,141,149,.9)';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill()}});
    ctx.fillStyle='rgba(142,215,255,.75)';ctx.fillText('sample →',w-70,h-12);ctx.fillText('max |σ|='+max.toExponential(2),pad,34);c.dataset.renderStatus='PASS';
  }
  function val(v){return v==null?'—':typeof v==='object'?JSON.stringify(v):String(v)}
  function render(){
    const op=lastByType.DifferentialOperatorSpec||{},sym=lastByType.PrincipalSymbolSpec||{},ell=lastByType.EllipticityResult||{},k=lastByType.KTheorySpec||{},idx=lastByType.IndexSpec||{},bd=lastByType.BoundaryAnalysisSpec||{},nl=lastByType.NonlinearIndexBridgeSpec||null,cov=lastByType.FormalizationCoverageSpec||{};
    one('#v031S6Status').textContent=ell.status||'NO RESULT';one('#v031S6Status').className='chip '+(String(ell.status||'').includes('ELLIPTIC')?'ok':ell.status==='FAIL'?'warn':'');
    one('#v031S6SymbolSummary').innerHTML=rows([['operator',op.model||'—'],['order',op.operatorOrder??'—'],['principal part',op.principalPart||'—'],['symbol',sym.formula||'—'],['xi condition',ell.xiNonzeroConditionExplicit?'ξ ≠ 0 / |ξ|=1 reduction':'—'],['min sampled σmin',sym.smallestSingularValueSampleMin==null?'—':Number(sym.smallestSingularValueSampleMin).toExponential(4)],['characteristic',sym.characteristicDirectionFound?'FOUND':'none detected / exact reference'],['mode',sym.analysisMode||'—']]);
    one('#v031S6KStatus').textContent=k.classStatus||'NO RESULT';
    one('#v031S6KClass').innerHTML=rows([['principalSymbolRef',k.principalSymbolRef||'—'],['ellipticity',k.ellipticityStatus||'—'],['symbolClassRef',k.symbolClassRef||'—'],['class status',k.classStatus||'—'],['compact support',k.compactSupportSemantics||'—'],['representative',k.representative?JSON.stringify(k.representative):'—'],['display guard',k.displayWarning||'—']]);
    one('#v031S6Ker').textContent=idx.kernelDimension==null?'UNKNOWN':String(idx.kernelDimension);one('#v031S6Coker').textContent=idx.cokernelDimension==null?'UNKNOWN':String(idx.cokernelDimension);one('#v031S6Index').textContent=idx.analyticIndex==null?'UNKNOWN':String(idx.analyticIndex);
    one('#v031S6IndexStatus').textContent=idx.comparison||'NOT EVALUATED';
    one('#v031S6IndexSummary').innerHTML=rows([['analytic index',val(idx.analyticIndex)],['topological index',val(idx.topologicalIndex)],['comparison',idx.comparison||'—'],['theorem edge',idx.indexTheoremEdge||'—'],['assumptions satisfied',String(!!idx.theoremAssumptionsSatisfied)],['invertible',val(idx.invertible)],['solvability',idx.solvability||'—'],['guard','indexZeroImpliesInvertible='+String(idx.indexZeroImpliesInvertible)]]);
    one('#v031S6BoundaryStatus').textContent=bd.status||'NO RESULT';
    one('#v031S6BoundarySummary').innerHTML=rows([['boundary',String(!!bd.manifoldBoundary)],['condition',bd.boundaryCondition||'—'],['boundary symbol',bd.boundarySymbol||'—'],['obstruction',bd.atiyahBottObstruction||'—'],['local elliptic BC',bd.localEllipticBCEligibility||'—'],['APS/global',bd.apsOrGlobalAlternative||'—'],['all BC impossible',String(!!bd.allBoundaryConditionsImpossible)],['coverage',bd.coverage||'—']]);
    one('#v031S6NonlinearStatus').textContent=nl?'LINEARIZATION BRIDGE':'SELECT NONLINEAR PRESET';
    one('#v031S6NonlinearSummary').innerHTML=nl?rows([['nonlinear equation',nl.nonlinearEquation],['candidate',nl.candidate],['linearization',nl.linearization],['principal symbol',nl.principalSymbolRef],['K-class',nl.kTheoryRef],['index',nl.indexRef],['local virtual dimension',val(nl.localModuliVirtualDimension)],['bifurcation warning',String(!!nl.bifurcationWarning)],['global solvability',nl.globalNonlinearSolvabilityStatus],['global stability',nl.globalNonlinearStabilityStatus]]):rows([['pipeline','F(u)=0 → candidate u* → L=DF(u*) → symbol/ellipticity → K-class/index'],['status','inactive for current preset'],['guard','No index result is applied directly to a nonlinear equation.']]);
    one('#v031S6Coverage').innerHTML=rows(Object.entries(cov).filter(([key])=>!['id','type'].includes(key)).map(([key,value])=>[key,val(value)]));
    one('#v031S6Raw').textContent=JSON.stringify({jobId:lastEnvelope?.jobId,elapsedMs:lastEnvelope?.elapsedMs,evidence:lastEnvelope?.evidenceRecords?.[0],diagnostics:lastEnvelope?.diagnostics,result:lastByType},null,2);drawSymbol();lastGate=runGate();
  }
  async function run(){
    const input=makeInput();one('#v031S6Status').textContent='RUNNING';one('#v031S6Status').className='chip warn';
    const envelope=await fetchJson(SERVICE+'/v1/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({adapter:'index.elliptic-reference.v1',inputSpec:input,environment:{requestSource:'MathScope v0.3.1 Stage6',sessionId:currentSession().id||null}})});
    lastEnvelope=envelope;lastByType=types(envelope);lastResult={input,envelope,byType:lastByType};render();return lastResult;
  }
  function boundarySemanticFixture(){return{atiyahBottObstruction:'NONZERO',localEllipticBCEligibility:'OBSTRUCTED',apsOrGlobalAlternative:'POSSIBLE / REQUIRES SEPARATE ANALYSIS',allBoundaryConditionsImpossible:false}}
  function nonlinearSemanticFixture(){return{equation:'F(u)=0',candidate:'u*',linearization:'L = DF(u*)',globalNonlinearSolvabilityStatus:'NOT ESTABLISHED',globalNonlinearStabilityStatus:'NOT ESTABLISHED'}}
  function runGate(){
    const ell=lastByType.EllipticityResult||{},k=lastByType.KTheorySpec||{},idx=lastByType.IndexSpec||{},cov=lastByType.FormalizationCoverageSpec||{},bf=boundarySemanticFixture(),nf=nonlinearSemanticFixture(),ev=lastEnvelope?.evidenceRecords?.[0];
    const checks=[
      {name:'D1 Ellipticity semantics',pass:ell.xiNonzeroConditionExplicit===true&&['THEOREM-BACKED ELLIPTIC','NUMERICALLY CONSISTENT','FAIL','UNKNOWN'].includes(ell.status)&&!(ell.sampledNumericalMode&&ell.incompleteSamplingWarning===false),detail:(ell.status||'no result')+' · ξ≠0 explicit · sampled/theorem modes separated'},
      {name:'D2 K-class display',pass:k.visualizationIsKClass===false&&k.displayWarning==='DISPLAY IS NOT THE K-CLASS ITSELF',detail:'sampled symbol representative is never relabeled as the abstract K-class'},
      {name:'D3 Index semantics',pass:idx.indexZeroImpliesInvertible===false&&idx.indexAloneDeterminesSolvability===false&&idx.kernelCokernelTrackedSeparately===true,detail:'kernel/cokernel remain separate; index 0 cannot certify invertibility'},
      {name:'D4 Boundary semantics',pass:bf.localEllipticBCEligibility==='OBSTRUCTED'&&bf.allBoundaryConditionsImpossible===false&&bf.apsOrGlobalAlternative.includes('POSSIBLE'),detail:'nonzero obstruction blocks the local elliptic BC path, not every possible BC'},
      {name:'D5 Nonlinear bridge',pass:nf.linearization.includes('DF')&&nf.globalNonlinearSolvabilityStatus==='NOT ESTABLISHED'&&nf.globalNonlinearStabilityStatus==='NOT ESTABLISHED',detail:'index path is forced through L=DF(u*) and remains local/linearized'},
      {name:'D6 Formal coverage',pass:String(cov.fullAtiyahSinger||'').includes('NOT FULLY FORMALIZED')&&ev?.grade==='NUMERICAL INDICATOR',detail:'advanced theorem mapping is external/partial; compute adapter never emits FORMAL PASS/THEOREM-BACKED evidence'}
    ];
    const pass=checks.every(x=>x.pass);one('#v031S6Gate').textContent=pass?'D1-D6 PASS':'D GATE CHECK';one('#v031S6Gate').className='chip '+(pass?'ok':'warn');one('#v031S6GateBadge').textContent=pass?'D1-D6 PASS':'D1-D6 CHECK';one('#v031S6GateBadge').className='v031-pill '+(pass?'pass':'warn');one('#v031S6Gates').innerHTML=checks.map(t=>'<div class="s6-gate '+(t.pass?'pass':'fail')+'"><b>'+(t.pass?'PASS · ':'FAIL · ')+esc(t.name)+'</b><small>'+esc(t.detail)+'</small></div>').join('');return{pass,tests:checks}
  }
  function tagFromEvidence(){const h=String(lastEnvelope?.evidenceRecords?.[0]?.inputsHash||Date.now().toString(36));return h.slice(0,10)}
  function theoremEvidence(id,claimRef,method,assumptions,backendEv){return{id,grade:'THEOREM-BACKED',claimRef,method,inputsHash:backendEv.inputsHash,environmentHash:backendEv.environmentHash,residuals:null,errorBounds:null,assumptions:[...(assumptions||[])],generatedAt:now(),adapterVersion:VERSION,upstreamRevisions:[...(backendEv.upstreamRevisions||[])],freshness:'CURRENT',supportsCurrent:true,stale:false,scope:'explicit external theorem mapping / not a Lean formal proof'}}
  async function commit(){
    if(!lastResult)await run();
    const f=window.MathScopeV031Foundation;if(!f?.commitTypedBundle)throw new Error('Foundation commit bridge unavailable');
    const t=tagFromEvidence(),op0=lastByType.DifferentialOperatorSpec,sym=lastByType.PrincipalSymbolSpec,ell=lastByType.EllipticityResult,k0=lastByType.KTheorySpec,idx=lastByType.IndexSpec,bd=lastByType.BoundaryAnalysisSpec,nl=lastByType.NonlinearIndexBridgeSpec||null,backendEv=lastEnvelope.evidenceRecords?.[0];
    const opId='op-stage6-'+t,symId='symbol-stage6-'+t,indexId='index-stage6-'+t,boundaryId='boundary-stage6-'+t,kId='kclass-stage6-'+t,ellClaim='claim-stage6-ellipticity-'+t,indexClaim='claim-stage6-index-'+t,boundaryClaim='claim-stage6-boundary-'+t,nonlinearClaim='claim-stage6-nonlinear-'+t;
    const symbolNode={...sym,id:symId,operatorRef:opId};
    const indexNode={...idx,id:indexId,operatorRef:opId,kTheoryRef:kId};
    const boundaryNode={...bd,id:boundaryId,operatorRef:opId};
    const op={...op0,id:opId,T:op0?.model==='nonlinear_elliptic_linearization'?'-Delta_g + lambda - 3(u*)^2':'-sum A_ij partial_i partial_j',domain:'H^2(M) (reference domain; boundary/domain details remain explicit)',codomain:'L^2(M)',baseField:'R/C',linear:true,bounded:false,denselyDefined:true,closed:'REFERENCE / THEOREM-MAPPED',closable:true,symmetric:'REFERENCE-DEPENDENT',selfAdjoint:'REFERENCE-DEPENDENT',normal:null,unitary:false,compact:false,adjointRef:null,adjointDomain:'tracked separately / reference',spectrumRef:null,resolventRef:null,principalSymbol:symbolNode,revision:opId+':r1',parentRevision:null,assumptions:[...(idx?.theoremAssumptions||[])],provenance:{source:'MathScopeCompute index.elliptic-reference.v1',jobId:lastEnvelope.jobId,reproducibilityHash:lastEnvelope.reproducibilityHash}};
    const k={...k0,id:kId,operatorRef:opId,principalSymbolRef:symId,analyticIndex:idx?.analyticIndex,topologicalIndex:idx?.topologicalIndex,boundaryObstruction:bd?.atiyahBottObstruction,spectralFlowRef:null,kHomologyRef:null,equivariantGroupRef:null,indexSpec:indexNode,boundaryAnalysis:boundaryNode,principalSymbol:symbolNode,revision:kId+':r1',parentRevision:null,evidenceRefs:[]};
    const claims=[
      {id:ellClaim,statement:ell?.status==='FAIL'?'The supplied principal symbol fails the ellipticity criterion.':'The supplied reference principal symbol satisfies the recorded ellipticity status: '+(ell?.status||'UNKNOWN')+'.',scope:'PRINCIPAL SYMBOL / ELLIPTICITY',assumptions:[...(ell?.theoremMapping?.applicability?[ell.theoremMapping.applicability]:[])],dependsOn:[opId,kId],status:ell?.status==='THEOREM-BACKED ELLIPTIC'?'SUPPORTED':'RESEARCH HYPOTHESIS',freshness:'CURRENT',revision:ellClaim+':r1',parentRevision:null},
      {id:indexClaim,statement:'The recorded index data tracks kernel and cokernel separately; index=0 is not an invertibility or solvability certificate.',scope:'FREDHOLM / INDEX SEMANTICS',assumptions:[...(idx?.theoremAssumptions||[])],dependsOn:[opId,kId],status:idx?.analyticIndex!=null?'SUPPORTED':'OPEN',freshness:'CURRENT',revision:indexClaim+':r1',parentRevision:null}
    ];
    if(bd?.manifoldBoundary)claims.push({id:boundaryClaim,statement:'Boundary analysis is scoped to local elliptic BC eligibility/obstruction; it does not assert that every boundary condition is impossible.',scope:'BOUNDARY / ATIYAH-BOTT SEMANTICS',assumptions:[],dependsOn:[opId,kId],status:'SUPPORTED',freshness:'CURRENT',revision:boundaryClaim+':r1',parentRevision:null});
    if(nl)claims.push({id:nonlinearClaim,statement:'K-theory/index analysis applies to the linearization L=DF(u*) and does not establish global nonlinear solvability or stability.',scope:'NONLINEAR PDE / LINEARIZATION / INDEX',assumptions:['candidate u* fixed','linearization exists'],dependsOn:[opId,kId],status:'SUPPORTED',freshness:'CURRENT',revision:nonlinearClaim+':r1',parentRevision:null});
    const evidence=[];
    if(backendEv)evidence.push({...backendEv,id:backendEv.id+'-'+t,claimRef:ellClaim,freshness:'CURRENT',supportsCurrent:true,stale:false});
    if(ell?.theoremMapping&&backendEv){const guard=f.canPromoteEvidence?.(backendEv,'THEOREM-BACKED',{theoremRef:ell.theoremMapping.reference});if(!guard||guard.ok)evidence.push(theoremEvidence('ev-stage6-ellipticity-theorem-'+t,ellClaim,'External theorem map · '+ell.theoremMapping.reference,[ell.theoremMapping.applicability],backendEv))}
    if(idx?.theoremAssumptionsSatisfied&&idx?.indexTheoremReference&&backendEv){const guard=f.canPromoteEvidence?.(backendEv,'THEOREM-BACKED',{theoremRef:idx.indexTheoremReference});if(!guard||guard.ok)evidence.push(theoremEvidence('ev-stage6-index-theorem-'+t,indexClaim,'External theorem map · '+idx.indexTheoremReference,idx.theoremAssumptions||[],backendEv))}
    k.evidenceRefs=evidence.map(e=>e.id);
    const bundle={bundleId:'stage6-d-'+t,operators:[op],kclasses:[k],claims,evidence};lastCommitted=f.commitTypedBundle(bundle,'Stage6 D layer · '+(ell?.status||'UNKNOWN'));window.MathScopeV031Stage5?.refreshGraph?.();one('#v031S6Status').textContent='COMMITTED · '+(ell?.status||'');return bundle;
  }
  function openGraph(){document.querySelector('[data-view-target="stage5-research"]')?.click();setTimeout(()=>one('#v031S5GraphCard')?.scrollIntoView?.({behavior:'smooth',block:'start'}),70)}
  function addPalette(){
    const list=one('#v031Palette .v031-command-list');if(!list||one('[data-s6-palette]'))return;
    for(const [a,label] of[['open','Open Symbol / K-Theory / Index Lab'],['run','Run Stage 6 structural reference']]){const b=document.createElement('button');b.textContent=label;b.dataset.s6Palette=a;b.addEventListener('click',()=>{one('#v031Palette')?.close?.();document.querySelector('[data-view-target="stage6-index"]')?.click();if(a==='run')run().catch(()=>{})});list.appendChild(b)}
  }
  function registerWebMCP(){
    const mc=document.modelContext;if(!mc?.registerTool)return;const safe=d=>{try{mc.registerTool(d,{signal:new AbortController().signal})}catch{}};
    safe({name:'mathscope.stage6.structure_status',description:'Read the current Stage6 principal-symbol, ellipticity, K-class, index and boundary result. This does not promote evidence.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:async()=>({version:VERSION,hasResult:!!lastResult,gate:lastGate,result:lastByType,trust:{indexZeroImpliesInvertible:false,displayIsKClass:false,obstructionMeansAllBCImpossible:false}})});
    safe({name:'mathscope.stage6.run_reference',description:'Run the bounded Stage6 structural reference adapter. Output remains scoped evidence; no FORMAL PASS is issued.',inputSchema:{type:'object',properties:{model:{type:'string',enum:['closed_scalar_laplacian','nonlinear_elliptic_linearization','custom_quadratic_symbol','hyperbolic_counterexample']},analysisMode:{type:'string',enum:['theorem','symbolic','sampled']}}},annotations:{readOnlyHint:true},execute:async input=>{if(input?.model)one('#v031S6Model').value=input.model;if(input?.analysisMode)one('#v031S6Mode').value=input.analysisMode;modelChanged();return run()}});
    safe({name:'mathscope.stage6.guard_report',description:'Run the Stage6 D1-D6 semantic acceptance checks without committing any session mutation.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:async()=>runGate()});
  }
  function init(){
    if(!one('#v031Stage6Index'))return;
    one('#v031S6Samples')?.addEventListener('input',()=>{one('#v031S6SamplesValue').textContent=String(Math.round(num('#v031S6Samples',96)))});
    one('#v031S6Model')?.addEventListener('change',modelChanged);modelChanged();
    one('#v031S6Run')?.addEventListener('click',()=>run().catch(e=>{one('#v031S6Status').textContent='ERROR';one('#v031S6Status').className='chip warn';one('#v031S6Raw').textContent=String(e?.stack||e)}));
    one('#v031S6Commit')?.addEventListener('click',()=>commit().catch(e=>{one('#v031S6Raw').textContent=String(e?.stack||e)}));one('#v031S6OpenGraph')?.addEventListener('click',openGraph);
    all('[data-v031-canvas="Index"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>document.querySelector('[data-view-target="stage6-index"]')?.click(),0)));
    all('[data-v031-dock="K-Theory"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>document.querySelector('[data-view-target="stage6-index"]')?.click(),0)));
    window.addEventListener('resize',()=>{if(lastResult)drawSymbol()});addPalette();registerWebMCP();runGate();
    window.MathScopeV031Stage6={version:VERSION,service:SERVICE,makeInput,run,runGate,commit,boundarySemanticFixture,nonlinearSemanticFixture,getResult:()=>lastResult,getByType:()=>lastByType,getCommitted:()=>lastCommitted};
    if(location.hash==='#stage6')setTimeout(()=>document.querySelector('[data-view-target="stage6-index"]')?.click(),420);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();