
(() => {
  'use strict';
  const VERSION='0.3.1-stage4-b7.1';
  const SERVICE_URL='https://mathscope-compute.onrender.com';
  const one=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now=()=>new Date().toISOString();
  let lastEnvelope=null,lastResult=null,lastGate=null,lastCommitted=null;

  function num(sel,fallback){const v=Number(one(sel)?.value);return Number.isFinite(v)?v:fallback}
  function rows(rs){return rs.map(r=>'<div class="k">'+esc(r[0])+'</div><div class="v">'+esc(r[1])+'</div>').join('')}
  function canvas(sel,height=280){
    const c=one(sel),ctx=c?.getContext?.('2d');if(!ctx)return null;
    const rect=c.getBoundingClientRect?.()||{width:620},w=Math.max(360,Math.round(rect.width||620)),h=height,dpr=Math.min(window.devicePixelRatio||1,2);
    c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return{c,ctx,w,h};
  }
  async function fetchJson(url,opts={},timeout=45000){
    const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),timeout);
    try{
      const res=await fetch(url,{...opts,signal:ctrl.signal});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data?.detail||('HTTP '+res.status));
      return data;
    }finally{clearTimeout(tm)}
  }
  function projectionCloud(samples){
    const source=[],display=[];
    for(let i=0;i<samples;i++){
      const t=2*Math.PI*i/samples;
      const x1=Math.cos(2*t),x2=Math.sin(2*t),x3=Math.cos(t),x4=Math.sin(t),x5=Math.cos(3*t);
      source.push([x1,x2,x3,x4,x5]);display.push([x1,x2,0]);
    }
    return{source,display};
  }
  function squareLoop(samples){
    const pts=[],per=Math.max(24,samples);
    for(let i=0;i<per;i++){
      const s=4*i/per,edge=Math.floor(s),u=s-edge;
      if(edge===0)pts.push([u,0]);
      else if(edge===1)pts.push([1,u]);
      else if(edge===2)pts.push([1-u,1]);
      else pts.push([0,1-u]);
    }
    return pts;
  }
  function cubicalRing(size=25){
    const out=[];
    for(let j=0;j<size;j++){
      const row=[],y=-1.2+2.4*j/(size-1);
      for(let i=0;i<size;i++){
        const x=-1.2+2.4*i/(size-1),r=Math.hypot(x,y);
        row.push(Math.abs(r-.68));
      }
      out.push(row);
    }
    return out;
  }
  function simplexCycle(){
    return [
      {vertices:[0],filtration:0},{vertices:[1],filtration:0},{vertices:[2],filtration:0},{vertices:[3],filtration:0},
      {vertices:[0,1],filtration:0},{vertices:[1,2],filtration:0},{vertices:[2,3],filtration:0},{vertices:[3,0],filtration:0}
    ];
  }
  function baseParams(){
    return{
      coefficientField:Number(one('#v031S4B7Coeff')?.value||2),
      maxHomologyDimension:Number(one('#v031S4B7MaxDim')?.value||1),
      maxEdgeLength:num('#v031S4B7Edge',.9),
      minPersistence:0,
      claimRef:'claim-stage4-b7-persistence',
      sourceRevisionRefs:['obj-stage4-r5-curve:r1','rep-stage4-r5-to-r3']
    };
  }
  function makeRequest(forceMode=null){
    const selectedBackend=one('#v031S4B7Backend')?.value||'gudhi';
    const mode=forceMode||one('#v031S4B7Mode')?.value||'projection-compare';
    const samples=Math.round(num('#v031S4B7Samples',48));
    const p=baseParams();
    if(mode==='projection-compare'){
      const cloud=projectionCloud(samples);
      return{adapter:'topology.gudhi.v1',mode,inputSpec:{...p,operation:'compareRipsPointClouds',pointsA:cloud.source,pointsB:cloud.display,sourceRevisionRefsA:['obj-stage4-r5-curve:r1'],sourceRevisionRefsB:['rep-stage4-r5-to-r3:r1']}};
    }
    if(mode==='cubical'){
      return{adapter:'topology.gudhi.v1',mode,inputSpec:{...p,complexKind:'cubical',vertices:cubicalRing(25),minPersistence:-1}};
    }
    if(mode==='simplex'){
      return{adapter:'topology.gudhi.v1',mode,inputSpec:{...p,complexKind:'simplex',simplices:simplexCycle(),minPersistence:-1}};
    }
    const cloud=projectionCloud(samples);
    const points=selectedBackend==='ripser'?squareLoop(samples):cloud.source;
    return{adapter:selectedBackend==='ripser'?'topology.ripser.v1':'topology.gudhi.v1',mode:'rips',inputSpec:{...p,complexKind:'rips',points}};
  }
  async function cloudRun(forceMode=null){
    const req=makeRequest(forceMode);
    one('#v031S4B7Status').textContent='RUNNING';
    one('#v031S4B7Status').className='chip warn';
    const session=window.MathScopeV031Foundation?.getSession?.();
    req.inputSpec.upstreamRevisions=(session?.revisions||[]).slice(0,12).map(x=>x.revision).filter(Boolean);
    const envelope=await fetchJson(SERVICE_URL+'/v1/run',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({adapter:req.adapter,inputSpec:req.inputSpec,environment:{requestSource:'MathScope v0.3.1 Stage4 B7',sessionId:session?.id||null}})
    });
    lastEnvelope=envelope;lastResult=envelope.outputRepresentations?.[0]||null;
    renderResult(req,envelope,lastResult);
    lastGate=runB7Gate();
    updateFullStageBadge();
    one('#v031S4B7Status').textContent=lastGate.pass?'B7 PASS':req.adapter.toUpperCase();
    one('#v031S4B7Status').className='chip '+(lastGate.pass?'ok':'warn');
    return{request:req,envelope,result:lastResult,gate:lastGate};
  }
  function topologyPanels(rep){
    if(rep?.type==='TopologyComparisonSpec')return[
      {label:'SOURCE · R⁵',rep:rep.source},
      {label:'DISPLAY · R³',rep:rep.representation}
    ];
    return[{label:'TOPOLOGY RESULT',rep}];
  }
  function intervalGroups(rep){
    const p=rep?.persistenceIntervals||{};return Object.keys(p).sort().map(k=>({key:k,rows:Array.isArray(p[k])?p[k]:[]}));
  }
  function maxFiniteDeath(panels){
    let m=1;
    for(const panel of panels)for(const g of intervalGroups(panel.rep))for(const r of g.rows){
      if(Number.isFinite(r.birth))m=Math.max(m,r.birth);
      if(Number.isFinite(r.death))m=Math.max(m,r.death);
    }
    return m;
  }
  function drawBarcode(rep){
    const o=canvas('#v031S4B7Barcode',280);if(!o)return;
    const{c,ctx,w,h}=o,panels=topologyPanels(rep),maxX=maxFiniteDeath(panels),pad=36,panelH=(h-24)/panels.length;
    ctx.fillStyle='#071722';ctx.fillRect(0,0,w,h);ctx.font='10px monospace';
    panels.forEach((panel,pi)=>{
      const top=18+pi*panelH,groups=intervalGroups(panel.rep),all=groups.flatMap(g=>g.rows.map(r=>({...r,key:g.key}))).slice(0,22);
      ctx.fillStyle='rgba(220,240,246,.9)';ctx.fillText(panel.label,8,top);
      all.forEach((r,i)=>{
        const y=top+12+(i+1)*Math.max(7,(panelH-28)/Math.max(1,all.length)),x1=pad+(w-pad-14)*(r.birth||0)/maxX,x2=r.death==null?w-18:pad+(w-pad-14)*r.death/maxX;
        ctx.strokeStyle=r.dimension===0?'rgba(124,233,225,.85)':r.dimension===1?'rgba(142,215,255,.9)':'rgba(255,194,92,.9)';
        ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();
        if(r.death==null){ctx.fillStyle=ctx.strokeStyle;ctx.fillText('→',w-16,y+3)}
      });
    });
    c.dataset.renderStatus='PASS';
  }
  function drawDiagram(rep){
    const o=canvas('#v031S4B7Diagram',280);if(!o)return;
    const{c,ctx,w,h}=o,panels=topologyPanels(rep),maxX=maxFiniteDeath(panels),pad=34;
    ctx.fillStyle='#071722';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(142,215,255,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad,h-pad);ctx.lineTo(w-12,h-pad);ctx.moveTo(pad,h-pad);ctx.lineTo(pad,12);ctx.moveTo(pad,h-pad);ctx.lineTo(w-12,12);ctx.stroke();
    const marks=[];
    panels.forEach((panel,pi)=>intervalGroups(panel.rep).forEach(g=>g.rows.forEach(r=>marks.push({r,pi}))));
    for(const {r,pi} of marks.slice(0,160)){
      const x=pad+(w-pad-18)*(r.birth||0)/maxX,death=r.death==null?maxX:r.death,y=h-pad-(h-pad-18)*death/maxX;
      ctx.fillStyle=pi===0?'rgba(124,233,225,.82)':'rgba(255,194,92,.82)';
      ctx.beginPath();ctx.arc(x,y,3+(r.dimension||0),0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle='rgba(220,240,246,.82)';ctx.font='10px monospace';ctx.fillText('birth →',w-70,h-10);ctx.fillText('death ↑',5,18);
    c.dataset.renderStatus='PASS';
  }
  function summaryFor(rep){
    if(rep?.type==='TopologyComparisonSpec'){
      const dist=(rep.bottleneckDistanceByDimension||[]).map(x=>'H'+x.dimension+': '+Number(x.bottleneckDistance).toExponential(3)).join(' · ');
      return[
        ['type',rep.type],['backend',rep.backend],['source complex',rep.source?.complexKind||'—'],['display complex',rep.representation?.complexKind||'—'],
        ['bottleneck',dist||'—'],['Betti Δ',(rep.bettiDelta||[]).map(x=>'H'+x.dimension+': '+x.source+'→'+x.representation).join(' · ')],
        ['equivalence',rep.topologyEquivalenceStatus],['scope',rep.scope]
      ];
    }
    const betti=(rep?.bettiNumbers||[]).map(x=>'β'+x.dimension+'='+x.value).join(', ');
    const counts=Object.entries(rep?.persistenceIntervals||{}).map(([k,v])=>k+':'+(v?.length||0)).join(', ');
    return[['type',rep?.type||'—'],['backend',rep?.backend||'—'],['complex',rep?.complexKind||'—'],['field',rep?.coefficientField||'—'],['Betti',betti||'—'],['interval counts',counts||'—'],['equivalence',rep?.topologyEquivalenceStatus||'—'],['scope',rep?.scope||'—']];
  }
  function renderResult(req,envelope,rep){
    one('#v031S4B7Summary').innerHTML=rows(summaryFor(rep));
    one('#v031S4B7Raw').textContent=JSON.stringify({adapter:req.adapter,jobId:envelope.jobId,elapsedMs:envelope.elapsedMs,evidence:envelope.evidenceRecords?.[0],result:rep},null,2);
    if(rep?.type==='TopologyComparisonSpec'){
      one('#v031S4B7CompareSummary').innerHTML=rows([
        ['comparison','source R⁵ sample ↔ projected R³ sample'],['bottleneck distances',(rep.bottleneckDistanceByDimension||[]).map(x=>'H'+x.dimension+'='+Number(x.bottleneckDistance).toExponential(3)).join(' · ')],
        ['interpretation',rep.interpretation],['promotion guard','persistence similarity ≠ homeomorphism proof']
      ]);
    }else{
      one('#v031S4B7CompareSummary').innerHTML=rows([['comparison','not run in this job'],['promotion guard','finite persistence remains scoped evidence']]);
    }
    drawBarcode(rep);drawDiagram(rep);
  }
  function runB7Gate(){
    const rep=lastResult,e=lastEnvelope?.evidenceRecords?.[0],panels=topologyPanels(rep);
    const checks=[
      {name:'Real backend',pass:['topology.gudhi.v1','topology.ripser.v1'].includes(lastEnvelope?.adapter),detail:lastEnvelope?.adapter||'none'},
      {name:'H₀/H₁/H₂ contract',pass:panels.every(p=>p.rep&&typeof p.rep.persistenceIntervals==='object'),detail:'typed persistenceIntervals by dimension'},
      {name:'Barcode + diagram',pass:one('#v031S4B7Barcode')?.dataset.renderStatus==='PASS'&&one('#v031S4B7Diagram')?.dataset.renderStatus==='PASS',detail:'Canvas2D render-ready'},
      {name:'Evidence boundary',pass:e?.grade==='NUMERICAL INDICATOR'&&String(e?.scope||'').toLowerCase().includes('topolog'),detail:(e?.grade||'none')+' · '+(e?.scope||'')},
      {name:'Topology promotion guard',pass:rep?.topologyEquivalenceStatus==='NOT ESTABLISHED'&&panels.every(p=>p.rep?.topologyEquivalenceStatus==='NOT ESTABLISHED'),detail:'visual/persistence similarity cannot auto-promote equivalence'},
      {name:'Pre/post provenance',pass:rep?.type!=='TopologyComparisonSpec'||((rep.source?.sourceRevisionRefs||[]).length>0&&(rep.representation?.sourceRevisionRefs||[]).length>0),detail:'source/representation revision refs retained'}
    ];
    const pass=checks.every(x=>x.pass);
    one('#v031S4B7Tests').innerHTML=checks.map(t=>'<div class="s4-test '+(t.pass?'pass':'fail')+'"><b>'+(t.pass?'PASS · ':'FAIL · ')+esc(t.name)+'</b><small>'+esc(t.detail)+'</small></div>').join('');
    return{pass,tests:checks};
  }
  function updateFullStageBadge(){
    const base=window.MathScopeV031Stage4?.runGate?.();
    const pass=!!base?.pass&&!!lastGate?.pass,badge=one('#v031S4CoverageBadge');
    if(badge){badge.textContent=pass?'B1-B7 PASS':'B1-B7 CHECK';badge.className='v031-pill '+(pass?'pass':'warn')}
  }
  async function commitTopology(){
    if(!lastResult)await cloudRun();
    const rep=JSON.parse(JSON.stringify(lastResult));
    rep.id='topology-stage4-b7-'+Date.now().toString(36);
    rep.revision=rep.id+':r1';rep.parentRevision=null;rep.stale=false;rep.freshness='CURRENT';
    rep.sourceObjectRef='obj-stage4-r5-curve';rep.representationRef='rep-stage4-r5-to-r3';
    const claim={id:'claim-stage4-b7-persistence',statement:'The recorded persistence data describes the selected finite filtered complex/sample and does not establish topology equivalence of the original continuum objects.',scope:'FINITE / SAMPLED COMPUTATIONAL TOPOLOGY',assumptions:['selected coefficient field','selected filtration/metric','finite sampling'],dependsOn:[rep.id,'obj-stage4-r5-curve','rep-stage4-r5-to-r3'],status:'SUPPORTED',freshness:'CURRENT',revision:'claim-stage4-b7-persistence:r1',parentRevision:null};
    const src=lastEnvelope?.evidenceRecords?.[0]||{};
    const evidence={...src,id:src.id||('ev-stage4-b7-'+Date.now().toString(36)),claimRef:claim.id,grade:'NUMERICAL INDICATOR',freshness:'CURRENT',supportsCurrent:true,stale:false,scope:src.scope||'finite computational topology / persistent homology only'};
    const bundle={bundleId:'stage4-b7-topology',topologies:[rep],claims:[claim],evidence:[evidence]};
    window.MathScopeV031Foundation?.commitTypedBundle?.(bundle,'Stage4 B7 persistent homology evidence');
    lastCommitted=bundle;
    one('#v031S4B7Status').textContent='B7 COMMITTED';one('#v031S4B7Status').className='chip ok';
    return bundle;
  }
  function backendChanged(){
    const backend=one('#v031S4B7Backend')?.value||'gudhi',mode=one('#v031S4B7Mode');
    if(backend==='ripser'&&mode&&!['rips','projection-compare'].includes(mode.value))mode.value='rips';
    one('#v031S4B7Status').textContent=backend==='ripser'?'RIPSER FAST':'GUDHI PRIMARY';
    one('#v031S4B7Status').className='chip';
  }
  function registerWebMCP(){
    const mc=document.modelContext;if(!mc?.registerTool)return;
    const safe=d=>{try{mc.registerTool(d,{signal:new AbortController().signal})}catch{}};
    safe({name:'mathscope.stage4.topology_status',description:'Read the current Stage4 B7 persistent-homology result and finite-topology trust boundary.',inputSchema:{type:'object',properties:{}},execute:async()=>({version:VERSION,backendPolicy:{primary:'GUDHI',fastPath:'Ripser.py'},hasResult:!!lastResult,gate:lastGate,result:lastResult})});
    safe({name:'mathscope.stage4.run_topology',description:'Run a read-only finite persistent-homology computation using the selected Stage4 B7 settings. This never proves topology equivalence.',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['projection-compare','rips','cubical','simplex']}}},execute:async(input)=>cloudRun(input?.mode||null)});
  }
  function init(){
    if(!one('#v031S4B7Run'))return;
    one('#v031S4B7Samples')?.addEventListener('input',()=>{one('#v031S4B7SamplesValue').textContent=String(Math.round(num('#v031S4B7Samples',48)))});
    one('#v031S4B7Backend')?.addEventListener('change',backendChanged);
    one('#v031S4B7Run')?.addEventListener('click',()=>cloudRun().catch(e=>{one('#v031S4B7Status').textContent='B7 ERROR';one('#v031S4B7Status').className='chip warn';one('#v031S4B7Raw').textContent=String(e?.stack||e)}));
    one('#v031S4B7Compare')?.addEventListener('click',()=>cloudRun('projection-compare').catch(e=>{one('#v031S4B7Raw').textContent=String(e?.stack||e)}));
    one('#v031S4B7Commit')?.addEventListener('click',()=>commitTopology().catch(e=>{one('#v031S4B7Raw').textContent=String(e?.stack||e)}));
    window.addEventListener('resize',()=>{if(lastResult){drawBarcode(lastResult);drawDiagram(lastResult)}});
    registerWebMCP();backendChanged();
    window.MathScopeV031Stage4B7={version:VERSION,service:SERVICE_URL,projectionCloud,cubicalRing,simplexCycle,makeRequest,run:()=>cloudRun(),compare:()=>cloudRun('projection-compare'),runGate:runB7Gate,commit:commitTopology,getResult:()=>lastResult,getEnvelope:()=>lastEnvelope,getCommitted:()=>lastCommitted};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();
