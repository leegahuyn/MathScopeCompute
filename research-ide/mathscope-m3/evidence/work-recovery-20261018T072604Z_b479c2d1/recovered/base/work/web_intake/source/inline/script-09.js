
(() => {
  'use strict';
  const VERSION='0.3.1-stage5.1';
  const CLOUD_LEAN='https://mathscope-cloud-lean.onrender.com';
  const one=s=>document.querySelector(s);
  const all=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now=()=>new Date().toISOString();
  const GRADES=['FORMAL PASS','THEOREM-BACKED','CERTIFIED NUMERICAL','NUMERICAL INDICATOR','EMPIRICAL CORRESPONDENCE','RESEARCH HYPOTHESIS','UNKNOWN','STALE'];
  let graph={nodes:[],edges:[],nodeMap:new Map(),positions:new Map()},selected=null,lastStress=null,lastSuggestions=[],proofMeta=null,lastProof=null,lastProofTarget='C-014',gate=[];
  let lastProofReceipt=null;

  const C014_SOURCE=[
    'import Mathlib','',
    'namespace MathScope.Claims.C014','',
    'theorem c014_slice_radius',
    '    (x1 x2 x3 x4 c : ℝ)',
    '    (hSphere : x1^2 + x2^2 + x3^2 + x4^2 = 1)',
    '    (hSlice : x4 = c) :',
    '    x1^2 + x2^2 + x3^2 = 1 - c^2 := by',
    '  subst x4',
    '  nlinarith [hSphere]','',
    'end MathScope.Claims.C014'
  ].join('\n');

  function rows(rs){return rs.map(r=>'<div class="k">'+esc(r[0])+'</div><div class="v">'+esc(r[1])+'</div>').join('')}
  function session(){return window.MathScopeV031Foundation?.getSession?.()||{objects:[],representations:[],functionSpaces:[],operators:[],pdes:[],spectra:[],geometries:[],topologies:[],symmetries:[],kclasses:[],claims:[],evidence:[],assumptions:[],revisions:[]}}
  function hashLite(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
  async function sha(value){try{const d=new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(value));const b=await crypto.subtle.digest('SHA-256',d);return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch{return 'hash-'+hashLite(JSON.stringify(value))}}
  const staleish=x=>Boolean(x?.stale)||['STALE','REVIEW','HISTORICAL FORMAL'].includes(String(x?.freshness||x?.fresh||x?.status||'').toUpperCase());
  const labelOf=(kind,x)=>kind==='Claim'?String(x.statement||x.id):kind==='Evidence'?String(x.method||x.id):kind==='Assumption'?String(x.value||x.id):String(x.title||x.type||x.id||x.revision||kind);
  const rawId=x=>String(x?.id||x?.revision||'');

  function buildGraphFrom(s){
    const nodes=[],edges=[],index=new Map(),revIndex=new Map();
    const push=(kind,x,idOverride=null)=>{
      const raw=idOverride||rawId(x)||kind+'-'+nodes.length,key=kind+':'+raw,node={key,rawId:raw,kind,label:labelOf(kind,x),data:x,stale:staleish(x),grade:String(x?.grade||''),freshness:String(x?.freshness||x?.fresh||x?.status||'')};
      nodes.push(node);if(!index.has(raw))index.set(raw,key);if(x?.revision)revIndex.set(String(x.revision),key);return node;
    };
    const sets=[
      ['Object',s.objects],['Representation',s.representations],['Function Space',s.functionSpaces],['Operator',s.operators],['PDE',s.pdes],['Spectrum',s.spectra],['Geometry',s.geometries],['Topology',s.topologies],['Symmetry',s.symmetries],['K-class',s.kclasses],['Claim',s.claims],['Evidence',s.evidence]
    ];
    for(const [kind,arr] of sets)for(const x of(arr||[]))push(kind,x);
    for(const k of(s.kclasses||[])){
      if(k?.principalSymbol?.id)push('Principal Symbol',k.principalSymbol,k.principalSymbol.id);
      if(k?.indexSpec?.id)push('Index',k.indexSpec,k.indexSpec.id);
      if(k?.boundaryAnalysis?.id)push('Boundary',k.boundaryAnalysis,k.boundaryAnalysis.id);
    }
    for(const [i,a] of(s.assumptions||[]).entries())push('Assumption',{id:'assumption-'+hashLite(typeof a==='string'?a:JSON.stringify(a)),value:typeof a==='string'?a:JSON.stringify(a),revision:null},'assumption-'+hashLite(typeof a==='string'?a:JSON.stringify(a)));
    for(const [i,r] of(s.revisions||[]).entries())push('Revision',{...r,id:r.id||('revision-'+(r.revision||i))},r.id||('revision-'+(r.revision||i)));
    const edge=(fromRaw,toRaw,relation,meta={})=>{
      const from=index.get(String(fromRaw))||revIndex.get(String(fromRaw)),to=index.get(String(toRaw))||revIndex.get(String(toRaw));
      if(from&&to&&from!==to)edges.push({key:from+'>'+relation+'>'+to,from,to,relation,meta});
    };
    for(const r of(s.representations||[]))edge(r.sourceObjectRef,r.id,'representedBy');
    for(const o of(s.operators||[])){edge(o.functionSpaceRef||o.domainRef,o.id,'actsOn');edge(o.generatedBy,o.id,'generatedBy')}
    for(const p of(s.pdes||[])){edge(p.id,p.linearizedOperatorRef||p.operatorRef,'linearizesTo');edge(p.functionSpaceRef,p.id,'actsOn')}
    for(const sp of(s.spectra||[])){
      edge(sp.operatorRef,sp.id,'spectrumOf');
      if(sp.riemannZetaRef)edge(sp.riemannZetaRef,sp.id,'compares');
      if(sp.spectralZetaRef)edge(sp.spectralZetaRef,sp.id,'compares');
    }
    for(const g of(s.geometries||[])){edge(g.sourceObjectRef,g.id,'derivedFrom');edge(g.representationRef,g.id,'derivedFrom')}
    for(const t of(s.topologies||[])){edge(t.sourceObjectRef,t.id,'topologyOf');edge(t.representationRef,t.id,'derivedFrom')}
    for(const sy of(s.symmetries||[])){
      if(sy.groupRef)edge(sy.groupRef,sy.id,sy.type==='GaloisLabSpec'?'galoisOf':'representedBy');
      if(sy.representationRef)edge(sy.representationRef,sy.id,'representedBy');
    }
    for(const k of(s.kclasses||[])){
      if(k.principalSymbolRef){edge(k.operatorRef,k.principalSymbolRef,'principalSymbolOf');edge(k.principalSymbolRef,k.id,'classifiesSymbolOf')}
      else edge(k.operatorRef,k.id,'derivedFrom');
      if(k.indexSpec?.id)edge(k.id,k.indexSpec.id,'indexOf');
      if(k.boundaryAnalysis?.id)edge(k.id,k.boundaryAnalysis.id,'boundaryAnalysisOf');
      if(k.representationRef)edge(k.representationRef,k.id,'equivariantClassOf');
      if(k.fredholmModuleMetadata?.representationRef)edge(k.fredholmModuleMetadata.representationRef,k.id,'representedBy');
      if(k.fredholmModuleMetadata?.operatorRef)edge(k.fredholmModuleMetadata.operatorRef,k.id,'derivedFrom');
    }
    for(const c of(s.claims||[])){
      for(const d of(c.dependsOn||[]))edge(d,c.id,'dependsOn');
      for(const a of(c.assumptions||[])){const aid='assumption-'+hashLite(typeof a==='string'?a:JSON.stringify(a));edge(aid,c.id,'dependsOn')}
    }
    for(const ev of(s.evidence||[])){edge(ev.claimRef,ev.id,'supports',{grade:ev.grade});for(const r of(ev.upstreamRevisions||[]))edge(r,ev.id,'derivedFrom')}
    for(const r of(s.revisions||[])){if(r.parentRevision)edge(r.parentRevision,r.revision||r.id,'supersedes');for(const target of(r.invalidatedEdges||[]))edge(r.revision||r.id,target,'invalidates')}
    return{nodes,edges,nodeMap:new Map(nodes.map(n=>[n.key,n])),positions:new Map(),index};
  }

  const tier=k=>({'Revision':0,'Assumption':0,'Object':1,'Function Space':1,'Representation':2,'Operator':2,'PDE':2,'Spectrum':3,'Geometry':3,'Topology':3,'Symmetry':3,'Principal Symbol':3,'K-class':4,'Index':4,'Boundary':4,'Claim':4,'Evidence':5}[k]??3);
  function gradeVisible(n){
    if(n.kind!=='Evidence')return true;
    const g=n.stale?'STALE':(n.grade||'UNKNOWN');
    const cb=one('#v031S5GradeFilters input[data-grade="'+CSS.escape(g)+'"]');
    return cb?cb.checked:true;
  }
  let graphPage=0;
  function pageGraphNodes(nodes,page,size=60){const pages=Math.max(1,Math.ceil(nodes.length/size));page=Math.min(pages-1,Math.max(0,page));return{nodes:nodes.slice(page*size,(page+1)*size),page,pages,total:nodes.length,size};}
  function visibleGraph(){
    const staleOnly=one('#v031S5GraphStaleOnly')?.checked,query=(one('#v031S5GraphSearch')?.value||'').trim().toLocaleLowerCase();
    const filtered=graph.nodes.filter(n=>gradeVisible(n)&&(!staleOnly||n.stale||['Claim','Revision'].includes(n.kind)&&staleish(n.data))&&(!query||[n.key,n.kind,n.label,n.grade].join(' ').toLocaleLowerCase().includes(query)));
    const view=pageGraphNodes(filtered,graphPage);graphPage=view.page;const set=new Set(view.nodes.map(n=>n.key));
    return{...view,edges:graph.edges.filter(e=>set.has(e.from)&&set.has(e.to))};
  }
  function graphAccessiblePage(vg){
    let panel=one('#v031S5GraphAccessible');
    if(!panel){
      panel=document.createElement('section');panel.id='v031S5GraphAccessible';panel.setAttribute('aria-label','Research graph node table');
      const search=document.createElement('input');search.type='search';search.id='v031S5GraphSearch';search.placeholder='Find graph nodes';search.setAttribute('aria-label','Find graph nodes by name, identifier, kind or grade');
      search.addEventListener('input',()=>{graphPage=0;drawGraph()});panel.append(search);
      for(const [text,delta] of [['Previous nodes',-1],['Next nodes',1]]){const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.pageDelta=delta;b.addEventListener('click',()=>{graphPage+=delta;drawGraph()});panel.append(b);}
      const status=document.createElement('p');status.id='v031S5GraphPageStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.append(status);
      const region=document.createElement('div');region.style.overflowX='auto';const table=document.createElement('table');table.id='v031S5GraphNodeTable';region.append(table);panel.append(region);one('#v031S5GraphCanvas').after(panel);
    }
    panel.querySelector('[data-page-delta="-1"]').disabled=vg.page===0;panel.querySelector('[data-page-delta="1"]').disabled=vg.page===vg.pages-1;
    one('#v031S5GraphPageStatus').textContent='Page '+(vg.page+1)+' of '+vg.pages+' · '+vg.total+' matching nodes. Edges on the canvas connect nodes within this page; the inspector includes cross-page dependencies.';
    const table=one('#v031S5GraphNodeTable');table.replaceChildren();
    const caption=document.createElement('caption');caption.textContent='Research nodes — select Inspect to read revisions, evidence and dependencies';table.append(caption);
    const head=document.createElement('thead'),hr=document.createElement('tr');for(const name of ['Kind','Name','Evidence / freshness','Action']){const th=document.createElement('th');th.scope='col';th.textContent=name;hr.append(th)}head.append(hr);table.append(head);
    const body=document.createElement('tbody');for(const n of vg.nodes){const tr=document.createElement('tr');for(const text of[n.kind,n.label,(n.grade||'No evidence grade')+(n.stale?' / STALE':'')]){const td=document.createElement('td');td.textContent=text;tr.append(td)}const td=document.createElement('td'),b=document.createElement('button');b.type='button';b.textContent='Inspect';b.setAttribute('aria-label','Inspect '+n.kind+' '+n.label);b.addEventListener('click',()=>{selected={type:'node',key:n.key};renderGraphInspector();one('#v031S5GraphInspector')?.focus()});td.append(b);tr.append(td);body.append(tr)}table.append(body);
  }
  function graphCanvas(height=520){
    const c=one('#v031S5GraphCanvas'),ctx=c?.getContext?.('2d');if(!ctx)return null;
    const rect=c.getBoundingClientRect?.()||{width:1000},w=Math.max(520,Math.round(rect.width||1000)),h=height,dpr=Math.min(window.devicePixelRatio||1,2);
    c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return{c,ctx,w,h};
  }
  function statusFill(n){
    if(n.stale)return['rgba(255,141,149,.17)','rgba(255,141,149,.85)'];
    if(n.kind==='Evidence'&&['FORMAL PASS','THEOREM-BACKED'].includes(n.grade))return['rgba(114,222,185,.14)','rgba(114,222,185,.85)'];
    if(n.kind==='Evidence'&&['RESEARCH HYPOTHESIS','UNKNOWN'].includes(n.grade))return['rgba(255,194,92,.12)','rgba(255,194,92,.86)'];
    if(n.kind==='Claim')return['rgba(142,215,255,.12)','rgba(142,215,255,.8)'];
    return['rgba(124,233,225,.075)','rgba(124,233,225,.45)'];
  }
  function drawGraph(){
    const vg=visibleGraph(),groups=new Map();
    for(const n of vg.nodes){const t=tier(n.kind);if(!groups.has(t))groups.set(t,[]);groups.get(t).push(n)}
    const maxCount=Math.max(1,...[...groups.values()].map(x=>x.length)),height=Math.min(760,Math.max(440,maxCount*43+70)),o=graphCanvas(height);if(!o)return;
    const{c,ctx,w,h}=o;ctx.fillStyle='#061520';ctx.fillRect(0,0,w,h);graph.positions.clear();
    const nodeW=Math.max(104,Math.min(138,(w-80)/6-14)),nodeH=32,padX=18;
    for(const [t,arr] of groups){const x=padX+t*((w-nodeW-2*padX)/5),gap=(h-48)/Math.max(1,arr.length);arr.forEach((n,i)=>graph.positions.set(n.key,{x,y:22+i*gap,w:nodeW,h:nodeH}))}
    for(const e of vg.edges){
      const a=graph.positions.get(e.from),b=graph.positions.get(e.to);if(!a||!b)continue;
      const x1=a.x+a.w,y1=a.y+a.h/2,x2=b.x,y2=b.y+b.h/2;
      ctx.strokeStyle=e.relation==='invalidates'?'rgba(255,141,149,.62)':'rgba(142,215,255,.22)';ctx.lineWidth=e.relation==='invalidates'?1.8:1;ctx.beginPath();ctx.moveTo(x1,y1);ctx.bezierCurveTo(x1+30,y1,x2-30,y2,x2,y2);ctx.stroke();
      const mx=(x1+x2)/2,my=(y1+y2)/2;ctx.fillStyle='rgba(116,147,158,.78)';ctx.font='8px IBM Plex Mono, monospace';ctx.fillText(e.relation,mx-18,my-3);e.hit={x:mx,y:my};
    }
    for(const n of vg.nodes){
      const p=graph.positions.get(n.key);if(!p)continue;const[f,border]=statusFill(n),isSel=selected?.type==='node'&&selected.key===n.key;
      ctx.fillStyle=f;ctx.strokeStyle=isSel?'rgba(255,255,255,.9)':border;ctx.lineWidth=isSel?2:1;ctx.beginPath();ctx.roundRect?.(p.x,p.y,p.w,p.h,7);if(ctx.roundRect){ctx.fill();ctx.stroke()}else{ctx.fillRect(p.x,p.y,p.w,p.h);ctx.strokeRect(p.x,p.y,p.w,p.h)}
      ctx.fillStyle='rgba(145,180,191,.86)';ctx.font='8px IBM Plex Mono, monospace';ctx.fillText(n.kind.toUpperCase(),p.x+6,p.y+10);
      ctx.fillStyle='rgba(220,239,244,.95)';ctx.font='9px IBM Plex Mono, monospace';let label=n.label.replace(/\s+/g,' ');if(label.length>22)label=label.slice(0,21)+'…';ctx.fillText(label,p.x+6,p.y+24);
    }
    c.dataset.renderStatus='PASS';one('#v031S5GraphCount').textContent=vg.nodes.length+' / '+vg.total+' nodes · '+vg.edges.length+' in-page edges';graphAccessiblePage(vg);
  }

  function nearEdge(x,y,e){
    const a=graph.positions.get(e.from),b=graph.positions.get(e.to);if(!a||!b)return false;
    const x1=a.x+a.w,y1=a.y+a.h/2,x2=b.x,y2=b.y+b.h/2,dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;if(!l2)return false;
    const t=Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/l2)),px=x1+t*dx,py=y1+t*dy;return Math.hypot(x-px,y-py)<7;
  }
  function selectAt(evt){
    const c=one('#v031S5GraphCanvas'),r=c.getBoundingClientRect(),x=evt.clientX-r.left,y=evt.clientY-r.top,vg=visibleGraph();
    for(const n of [...vg.nodes].reverse()){const p=graph.positions.get(n.key);if(p&&x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h){selected={type:'node',key:n.key};renderGraphInspector();drawGraph();return}}
    for(const e of vg.edges){if(nearEdge(x,y,e)){selected={type:'edge',key:e.key};renderGraphInspector();drawGraph();return}}
  }
  function directRelations(key){
    const incoming=graph.edges.filter(e=>e.to===key).map(e=>({relation:e.relation,node:graph.nodeMap.get(e.from)}));
    const outgoing=graph.edges.filter(e=>e.from===key).map(e=>({relation:e.relation,node:graph.nodeMap.get(e.to)}));return{incoming,outgoing};
  }
  function renderGraphInspector(){
    const el=one('#v031S5GraphInspector');if(!el)return;
    if(!selected){el.innerHTML=rows([['selection','Click a node or edge'],['meaning','Graph is derived from the current ResearchSession; no evidence is promoted by drawing it.']]);return}
    if(selected.type==='node'){
      const n=graph.nodeMap.get(selected.key);if(!n)return;const rel=directRelations(n.key);
      el.innerHTML=rows([['kind',n.kind],['id',n.rawId],['label',n.label],['revision',n.data?.revision||'—'],['freshness',n.freshness||'—'],['grade',n.grade||'—'],['stale/review',String(n.stale)]]);
      one('#v031S5Upstream').textContent=rel.incoming.length?rel.incoming.map(x=>x.relation+' ← '+(x.node?.kind||'?')+': '+(x.node?.rawId||'?')).join('\n'):'none recorded';
      one('#v031S5Downstream').textContent=rel.outgoing.length?rel.outgoing.map(x=>x.relation+' → '+(x.node?.kind||'?')+': '+(x.node?.rawId||'?')).join('\n'):'none recorded';
    }else{
      const e=graph.edges.find(x=>x.key===selected.key),a=e&&graph.nodeMap.get(e.from),b=e&&graph.nodeMap.get(e.to);
      el.innerHTML=rows([['edge',e?.relation||'—'],['from',a?(a.kind+': '+a.rawId):'—'],['to',b?(b.kind+': '+b.rawId):'—'],['grade/meta',e?.meta?.grade||'—']]);
      one('#v031S5Upstream').textContent=a?'source node: '+a.label:'—';one('#v031S5Downstream').textContent=b?'target node: '+b.label:'—';
    }
  }
  function renderRevisions(){
    const r=(session().revisions||[]).slice(0,18);one('#v031S5RevisionHistory').textContent=r.length?r.map(x=>[(x.timestamp||x.createdAt||''),x.kind||x.type||'revision',x.revision||x.id||'',x.parentRevision?'← '+x.parentRevision:'',x.reason||x.summary||''].filter(Boolean).join(' · ')).join('\n'):'No revision records yet.';
  }
  function refreshGraph(){
    graph=buildGraphFrom(session());selected=null;drawGraph();renderGraphInspector();renderRevisions();one('#v031S5GraphStatus').textContent=graph.nodes.length?'LIVE SESSION':'EMPTY SESSION';return graph;
  }
  function renderGradeFilters(){
    const el=one('#v031S5GradeFilters');if(!el)return;el.innerHTML=GRADES.map(g=>'<label><input type="checkbox" checked data-grade="'+esc(g)+'"> '+esc(g)+'</label>').join('');
    all('#v031S5GradeFilters input').forEach(x=>x.addEventListener('change',drawGraph));
  }

  function stressBasis(){
    const x=[4,1],stdResidual=1,coef=(x[0]+x[1])/Math.sqrt(2),proj=[coef/Math.sqrt(2),coef/Math.sqrt(2)],rotResidual=Math.abs(x[0]-proj[0])+Math.abs(x[1]-proj[1]);
    return{outcome:'COUNTEREXAMPLE FOUND',summary:'The selected coordinate-truncation residual is basis dependent.',detail:'x=(4,1): standard first-coordinate residual ||(0,1)||₁=1, while projection to span((1,1)/√2) leaves residual '+rotResidual.toFixed(6)+'.',witness:{x,stdResidual,rotatedResidual:rotResidual},grade:'NUMERICAL INDICATOR'};
  }
  function runStressTest(kind,claimId){
    const s=session(),claim=(s.claims||[]).find(c=>c.id===claimId)||null;
    if(kind==='identifiability')return{outcome:'COUNTEREXAMPLE FOUND',summary:'The Stage 4 display projection is non-injective.',detail:'For γ(θ)=(cos2θ,sin2θ,cosθ,sinθ,cos3θ), θ and θ+π have the same displayed (x₁,x₂,0) although their hidden coordinates differ.',witness:{theta:'π/4',thetaPrime:'5π/4',display:'same',source:'different hidden coordinates'},grade:'NUMERICAL INDICATOR'};
    if(kind==='coordinate')return{outcome:'COUNTEREXAMPLE FOUND',summary:'Coordinate projection is not rotation-invariant.',detail:'π keeps the first three coordinates. v=(1,0,0,0) has ||π(v)||=1; after swapping coordinate 1↔4, the rotated vector has ||π(Rv)||=0.',witness:{before:1,after:0},grade:'NUMERICAL INDICATOR'};
    if(kind==='basis')return stressBasis();
    if(kind==='mesh'){
      const solve=window.MathScopeV031AnalyticSlice?.solve;if(!solve)return{outcome:'INCONCLUSIVE',summary:'Stage 2 mesh replay hook unavailable.',detail:'No computation was fabricated.',grade:'UNKNOWN'};
      const ns=[8,16,32],rows=ns.map(N=>{const r=solve(N);return{N,error:Number(r.maxError),lambdaRatio:Number(r.lambdaRatio)}}),pass=rows.every((x,i)=>i===0||x.error<rows[i-1].error);
      return{outcome:pass?'PASSED SELECTED TESTS':'NUMERICAL WARNING',summary:'Mesh-refinement sequence '+(pass?'improved on the selected benchmark.':'did not monotonically improve.'),detail:rows.map(x=>'N='+x.N+' error='+x.error.toExponential(3)).join(' · ')+'; this is a numerical benchmark, not a convergence theorem.',witness:rows,grade:'NUMERICAL INDICATOR'};
    }
    if(kind==='timestep'){
      const dts=[.2,.1,.05],exact=Math.exp(-1),vals=dts.map(dt=>{let y=1;for(let t=0;t<1-1e-12;t+=dt)y*=1-dt;return{dt,error:Math.abs(y-exact),y}}),pass=vals.every((x,i)=>i===0||x.error<vals[i-1].error);
      return{outcome:pass?'PASSED SELECTED TESTS':'NUMERICAL WARNING',summary:'Explicit-Euler refinement on y′=-y '+(pass?'shows decreasing error.':'failed the selected refinement check.'),detail:vals.map(x=>'dt='+x.dt+' error='+x.error.toExponential(3)).join(' · ')+'; selected test only.',witness:vals,grade:'NUMERICAL INDICATOR'};
    }
    if(kind==='truncation'){
      const solve=window.MathScopeV031AnalyticSlice?.solve;if(!solve)return{outcome:'INCONCLUSIVE',summary:'Finite-spectrum replay hook unavailable.',detail:'No large-N claim is inferred.',grade:'UNKNOWN'};
      const ns=[8,16,32],vals=ns.map(N=>{const r=solve(N);return{N,relativeLambdaError:Math.abs(Number(r.lambdaRatio)-1)}}),pass=vals.every((x,i)=>i===0||x.relativeLambdaError<vals[i-1].relativeLambdaError);
      return{outcome:pass?'PASSED SELECTED TESTS':'NUMERICAL WARNING',summary:'Finite truncation sequence '+(pass?'approaches the selected continuum reference.':'needs inspection.'),detail:vals.map(x=>'N='+x.N+' rel.err='+x.relativeLambdaError.toExponential(3)).join(' · ')+'; finite N never becomes exact infinite spectrum automatically.',witness:vals,grade:'NUMERICAL INDICATOR'};
    }
    if(kind==='parameter'){
      const a0=1,eps=.01,y0=Math.exp(-a0),ym=Math.exp(-(a0-eps)),yp=Math.exp(-(a0+eps)),sensitivity=(yp-ym)/(2*eps);
      return{outcome:'NUMERICAL WARNING',summary:'A 1% parameter perturbation changes the selected ODE observable.',detail:'For y′=-a y, y(0)=1, y(1) changes around a=1 with finite-difference sensitivity '+sensitivity.toFixed(6)+'. Claims depending on a require explicit parameter scope.',witness:{a0,ym,y0,yp,sensitivity},grade:'NUMERICAL INDICATOR'};
    }
    if(kind==='assumption'){
      const assumptions=claim?.assumptions||[];return assumptions.length
        ?{outcome:'INCONCLUSIVE',summary:'Assumption removal cannot be promoted by syntax alone.',detail:'Candidate removals: '+assumptions.join('; ')+'. Re-run theorem/numerical mappings under Γ\\{a}; no assumption was silently discarded.',witness:{assumptions},grade:'UNKNOWN'}
        :{outcome:'INCONCLUSIVE',summary:'Selected claim has no explicit assumptions to remove.',detail:'Add explicit Γ before using assumption-removal stress.',grade:'UNKNOWN'};
    }
    if(kind==='adversarial')return{outcome:'COUNTEREXAMPLE FOUND',summary:'A fibre can collapse distinct high-dimensional points to one display point.',detail:'p=(0,0,0,0,0) and q=(0,0,0,0,1) are distinct in R⁵ but the selected display map (x₁,x₂,0) sends both to (0,0,0).',witness:{p:[0,0,0,0,0],q:[0,0,0,0,1],display:[0,0,0]},grade:'NUMERICAL INDICATOR'};
    if(kind==='divergence'){
      const f=x=>x*x*x-2*x+2,fp=x=>3*x*x-2;let x=0,seq=[];for(let i=0;i<6;i++){seq.push(x);x=x-f(x)/fp(x)}
      return{outcome:'NUMERICAL WARNING',summary:'Newton iteration enters a 0↔1 cycle for the selected initial value.',detail:'f(x)=x³−2x+2, x₀=0 produces '+seq.map(x=>Number(x).toFixed(3)).join(' → ')+'. Solver failure is evidence, not a contradiction of the equation itself.',witness:{sequence:seq},grade:'NUMERICAL INDICATOR'};
    }
    if(kind==='symmetry'){
      const eps=.01,comm=Math.sqrt(2)*eps;return{outcome:'NUMERICAL WARNING',summary:'A small perturbation breaks commutation with the swap symmetry.',detail:'D=diag(1,1) commutes with S=[[0,1],[1,0]]. Dε=diag(1,1+ε) gives ||DεS−SDε||_F=√2 ε='+comm.toExponential(3)+'.',witness:{epsilon:eps,commutatorFrobenius:comm},grade:'NUMERICAL INDICATOR'};
    }
    return{outcome:'INCONCLUSIVE',summary:'Unknown test.',detail:'No result.',grade:'UNKNOWN'};
  }
  function stressClass(out){return out==='COUNTEREXAMPLE FOUND'?'counter':out==='PASSED SELECTED TESTS'?'pass':'warn'}
  function renderStress(r){
    one('#v031S5StressResult').className='s5-result '+stressClass(r.outcome);one('#v031S5StressResult').innerHTML='<strong>'+esc(r.outcome)+'</strong><small>'+esc(r.summary)+'</small><small>'+esc(r.detail)+'</small>';
    one('#v031S5StressLog').textContent=JSON.stringify(r,null,2);one('#v031S5StressStatus').textContent=r.outcome;one('#v031S5StressStatus').className='chip '+(r.outcome==='PASSED SELECTED TESTS'?'ok':'warn');
  }
  async function runStressUI(){
    const kind=one('#v031S5StressKind').value,claimId=one('#v031S5StressClaim').value;lastStress={...runStressTest(kind,claimId),kind,claimId,generatedAt:now()};lastStress.inputsHash=await sha({kind,claimId,witness:lastStress.witness});renderStress(lastStress);return lastStress;
  }
  async function commitStress(){
    if(!lastStress)await runStressUI();const s=session(),claim=(s.claims||[]).find(c=>c.id===lastStress.claimId);
    const id='ev-stress-'+lastStress.kind+'-'+Date.now().toString(36),ev={id,grade:lastStress.grade==='UNKNOWN'?'UNKNOWN':'NUMERICAL INDICATOR',claimRef:lastStress.claimId||'claim-stage5-stress',method:'Stage5 StressTest/'+lastStress.kind,inputsHash:lastStress.inputsHash||await sha(lastStress),environmentHash:'browser:'+VERSION,residuals:{outcome:lastStress.outcome,summary:lastStress.summary,detail:lastStress.detail,witness:lastStress.witness||null},errorBounds:null,assumptions:['selected stress test only','no counterexample found never implies theorem'],generatedAt:now(),adapterVersion:VERSION,upstreamRevisions:[claim?.revision,...(s.revisions||[]).slice(0,4).map(x=>x.revision)].filter(Boolean),stale:false,freshness:'CURRENT',supportsCurrent:lastStress.outcome!=='COUNTEREXAMPLE FOUND',scope:'stress/counterexample evidence'};
    let claims=[];if(!lastStress.claimId){claims=[{id:'claim-stage5-stress',statement:'Stage 5 stress-test target',scope:'STRESS TEST',assumptions:[],dependsOn:[],status:'RESEARCH HYPOTHESIS',freshness:'CURRENT',revision:'claim-stage5-stress:r1',parentRevision:null}]}
    window.MathScopeV031Foundation?.commitTypedBundle?.({bundleId:'stage5-stress-'+Date.now().toString(36),claims,evidence:[ev]},'Stage5 stress evidence · '+lastStress.outcome);one('#v031S5StressStatus').textContent='COMMITTED · '+lastStress.outcome;refreshGraph();refreshClaimSelectors();return ev;
  }

  const PERMISSIONS=[
    ['ALLOW','suggest representation'],['ALLOW','suggest solver'],['ALLOW','suggest theorem mapping'],['ALLOW','suggest stress test'],['ALLOW','suggest Lean target'],['ALLOW','explain assumptions'],['ALLOW','create draft claim'],
    ['DENY','set FORMAL PASS'],['DENY','set THEOREM-BACKED without theorem map'],['DENY','delete contradictory evidence'],['DENY','suppress failed tests'],['DENY','infer equivalence from visualization']
  ];
  function copilotCanPromote(target,theoremRef=null){return !['FORMAL PASS','THEOREM-BACKED','PROVED'].includes(target)}
  function orchestrate(prompt){
    const q=String(prompt||'').toLowerCase(),out=[];
    const add=(kind,title,detail,action)=>out.push({kind,title,detail,action});
    if(/3d|visual|projection|slice|topolog/.test(q)){add('representation','Compare observation methods','Try projection / slice / stereographic as distinct RepresentationSpecs; choose topology, metric, or visual exploration as the preservation goal.','graph');add('stress','Search identifiability failure','Run a non-injectivity witness before interpreting the 3D view as the original object.','stress:identifiability');add('topology','Compare finite persistence','Use the existing B7 pre/post projection persistence comparison; equivalence remains NOT ESTABLISHED.','graph')}
    if(/stable|stability|nonlinear/.test(q)){add('scope','Narrow the claim scope','Separate linearized stability of DF(u*) from nonlinear/global stability.','draft');add('stress','Perturb parameters and mesh','Run mesh refinement and parameter perturbation before strengthening the claim.','stress:parameter');add('formal','Create a local Lean target','Formalize a local algebraic/linear claim only after assumptions Γ are explicit.','proof')}
    if(/spectrum|operator|eigen|resolvent/.test(q)){add('guard','Keep finite/infinite boundary','Inspect truncation N, basis and pollution risk before mapping finite spectra to an infinite operator.','stress:truncation');add('theorem','Map an explicit theorem','A theorem name/reference and applicability assumptions are required before THEOREM-BACKED.','graph')}
    if(/proof|lean|formal|theorem/.test(q)){add('formal','Inspect formal coverage','Diagnostics/LSP are work feedback. Final FORMAL PASS requires a pinned environment + final verifier + axiom audit.','proof');add('assumptions','Audit Γ first','Explain and freeze theorem assumptions before creating a formal target.','graph')}
    if(!out.length){add('graph','Inspect dependencies','Open the Research Graph and trace upstream assumptions/revisions before changing the claim.','graph');add('stress','Run selected stress tests','Start with identifiability, basis/coordinate dependence and refinement checks.','stress:identifiability');add('formal','Create Lean target only if local','Do not jump from a broad research hypothesis to FORMAL PASS.','proof')}
    return out.slice(0,6);
  }
  function renderPermissions(){one('#v031S5Permissions').innerHTML=PERMISSIONS.map(x=>'<div class="s5-permission '+(x[0]==='ALLOW'?'ok':'no')+'"><b>'+x[0]+'</b> · '+esc(x[1])+'</div>').join('')}
  function renderSuggestions(){
    one('#v031S5Suggestions').innerHTML=lastSuggestions.map((s,i)=>'<div class="s5-suggestion"><b>'+esc(s.kind.toUpperCase()+' · '+s.title)+'</b><small>'+esc(s.detail)+'</small><div class="v031-actions"><button class="btn" data-s5-action="'+esc(s.action)+'" data-s5-index="'+i+'">Apply as workflow step</button></div></div>').join('')||'<div class="s5-suggestion"><small>Enter a research question to generate a bounded orchestration plan.</small></div>';
  }
  function runCopilot(){lastSuggestions=orchestrate(one('#v031S5CopilotPrompt').value);renderSuggestions();return lastSuggestions}
  async function createDraftClaim(){
    const statement=one('#v031S5CopilotPrompt').value.trim()||'Untitled research hypothesis',s=session(),id='claim-copilot-'+Date.now().toString(36),claim={id,statement,scope:'COPILOT DRAFT / RESEARCH HYPOTHESIS',assumptions:[],dependsOn:s.activeObjectRef?[s.activeObjectRef]:[],status:'RESEARCH HYPOTHESIS',freshness:'CURRENT',revision:id+':r1',parentRevision:null,sourceAuthority:'AI-ORCHESTRATION-PROTOTYPE'};
    window.MathScopeV031Foundation?.commitTypedBundle?.({bundleId:'stage5-copilot-draft',claims:[claim]},'Stage5 Copilot draft claim');refreshClaimSelectors();refreshGraph();return claim;
  }
  function applyCopilotAction(action){
    if(action==='graph'){openStage5('graph');refreshGraph();return}
    if(action?.startsWith('stress:')){one('#v031S5StressKind').value=action.split(':')[1];openStage5('stress');runStressUI();return}
    if(action==='proof'){openStage5('proof');return}
    if(action==='draft'){createDraftClaim();return}
  }

  function refreshClaimSelectors(){
    const s=session(),claims=s.claims||[],stress=one('#v031S5StressClaim'),proof=one('#v031S5ProofClaim'),prevStress=stress?.value,prevProof=proof?.value;
    if(stress){stress.innerHTML=claims.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.id+' · '+String(c.statement||'').slice(0,55))+'</option>').join('')||'<option value="">No session claim</option>';if([...stress.options].some(o=>o.value===prevStress))stress.value=prevStress}
    if(proof){proof.innerHTML='<option value="C-014">C-014 · audited exact slice theorem</option>'+claims.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.id+' · '+String(c.statement||'').slice(0,48))+'</option>').join('');if([...proof.options].some(o=>o.value===prevProof))proof.value=prevProof;renderProofTarget()}
  }
  function selectedProofClaim(){
    const id=one('#v031S5ProofClaim')?.value||'C-014';if(id==='C-014')return{id:'C-014',statement:'Σᵢ₌₁⁴ xᵢ²=1 and x₄=c imply x₁²+x₂²+x₃²=1−c².',formal:true,scope:'server-pinned audited C-014 source'};
    return(session().claims||[]).find(c=>c.id===id)||{id,statement:'Unknown claim',formal:false};
  }
  function renderProofTarget(){
    const c=selectedProofClaim();lastProofTarget=c.id;one('#v031S5Natural').textContent=c.statement||'—';
    one('#v031S5Formal').textContent=c.id==='C-014'?C014_SOURCE:'-- DRAFT TARGET ONLY\n-- Claim: '+(c.statement||c.id)+'\n-- No automatic translation to Lean proposition is asserted.\n-- Explicit theorem mapping and assumptions Γ are required.';
    one('#v031S5Diagnostics').textContent=c.id==='C-014'?'Editor/LSP diagnostics: EXPERIMENTAL / INFRA HOLD for release evidence.\nFinal verifier: separate server-pinned C-014 path available.\nA no-error editor state is not FORMAL PASS.':'No audited Lean mapping for this session claim.\nStatus: DEPENDENCY MISSING until an explicit formal statement/environment mapping exists.';
    if(c.id!=='C-014'){one('#v031S5ProofStatus').textContent='DEPENDENCY MISSING';one('#v031S5Final').textContent='Final verification unavailable for this target. The current cloud verifier is intentionally restricted to audited C-014.'}
  }
  function finalStatus(data,semanticReviewed){
    // Standalone payloads lack request provenance; only verifyPinnedC014 issues PASS.
    return data?.state?.run==='ERROR'?'FORMAL FAIL':'PARTIAL';
  }
  async function fetchJson(url,opts={},timeout=60000){
    const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),timeout);try{const r=await fetch(url,{...opts,signal:ctrl.signal,cache:'no-store'}),data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.error||('HTTP '+r.status));return data}finally{clearTimeout(tm)}
  }
  async function wakeFetch(path,opts={}){
    let last;for(const wait of[0,4500,10000]){if(wait)await new Promise(r=>setTimeout(r,wait));try{return await fetchJson(CLOUD_LEAN+path,opts,90000)}catch(e){last=e}}throw last;
  }
  async function refreshProofMeta(){
    one('#v031S5ProofStatus').textContent='ENV CHECK';let health=null,meta=null,self=null;
    try{health=await wakeFetch('/health');meta=await wakeFetch('/v1/meta');try{self=await wakeFetch('/v1/self-test')}catch{};proofMeta={health,meta,self};
      one('#v031S5ProofEnv').textContent=['service='+health.service,'mode='+health.mode,'verifierReady='+health.verifierReady,'lspReady='+health.lspReady+' (diagnostics only)','toolchain='+(meta.toolchain||'unknown'),'environmentHash='+(meta.environmentHash||'unknown'),'dependencyLock='+(meta.dependencyLockHash||'unknown'),'coverage=C-014 FULL FORMAL target; arbitrary session claims DEPENDENCY MISSING/PARTIAL'].join('\n');one('#v031S5ProofStatus').textContent=health.verifierReady?'VERIFIER READY':'VERIFIER CHECK';return proofMeta
    }catch(e){proofMeta={error:String(e.message||e)};one('#v031S5ProofEnv').textContent='Verifier offline/waking: '+proofMeta.error+'\nExisting evidence remains preserved. Cloud LSP status does not change final proof state.';one('#v031S5ProofStatus').textContent='INFRA HOLD';return proofMeta}
  }
  async function verifyProof(){
    const c=selectedProofClaim(),semantic=one('#v031S5SemanticReview').checked;lastProofReceipt=null;
    if(c.id!=='C-014'){lastProof={target:c.id,status:'DEPENDENCY MISSING',generatedAt:now()};renderProofResult();return JSON.parse(JSON.stringify(lastProof))}
    one('#v031S5ProofStatus').textContent='VERIFYING';
    try{
      const result=await window.MathScopeV031Foundation.verifyPinnedC014(semantic);
      if(selectedProofClaim().id!=='C-014'||one('#v031S5SemanticReview').checked!==semantic)throw new Error('Proof target or review changed during verification');
      lastProofReceipt=result.receipt;lastProof={target:'C-014',status:result.status,semanticReviewed:semantic,data:result.data,generatedAt:now()};
    }catch(e){lastProof={target:'C-014',status:'INFRA HOLD',semanticReviewed:semantic,error:String(e.message||e),generatedAt:now()};}
    renderProofResult();return JSON.parse(JSON.stringify(lastProof));
  }
  function renderProofResult(){
    const p=lastProof;if(!p)return;one('#v031S5ProofStatus').textContent=p.status;one('#v031S5ProofStatus').className='chip '+(p.status==='FORMAL PASS'?'ok':'warn');
    if(p.data){
      one('#v031S5Final').textContent=['result='+p.status,'run='+p.data.state?.run,'truth='+p.data.state?.truth,'evidence='+p.data.state?.evidence,'trust='+p.data.state?.trust,'sourceHash='+p.data.sourceHash,'environmentHash='+p.data.environmentHash,'dependencyLock='+p.data.dependencyLockHash,'deployCommit='+(p.data.deployCommit||'unknown'),'semanticReviewed='+p.semanticReviewed].join('\n');
      one('#v031S5Axioms').textContent=p.data.axiomAuditOutput||'No axiom audit output returned.';
      one('#v031S5Diagnostics').textContent='Final verifier executed independently of LSP.\nstdout: '+(p.data.stdout||'')+'\nstderr: '+(p.data.stderr||'');
    }else{one('#v031S5Final').textContent=p.status+': '+(p.error||'No audited formal mapping for this target.')}
  }
  async function commitProof(){
    const current=selectedProofClaim();
    if(!lastProof||lastProof.target!==current.id||lastProof.semanticReviewed!==one('#v031S5SemanticReview').checked)await verifyProof();
    if(lastProof.status==='FORMAL PASS'){
      if(current.id!=='C-014')throw new Error('Formal receipt is restricted to C-014');
      const ev=window.MathScopeV031Foundation.commitPinnedC014Proof(lastProofReceipt);lastProofReceipt=null;lastProof=null;refreshGraph();refreshClaimSelectors();return ev;
    }
    const s=session(),formal=false,target=selectedProofClaim(),claimId=target.id==='C-014'?'claim-stage5-c014':target.id,claims=[];
    if(target.id==='C-014'&&!(s.claims||[]).some(c=>c.id===claimId))claims.push({id:claimId,statement:target.statement,scope:'AUDITED C-014 / EXACT ALGEBRAIC SLICE',assumptions:['server-pinned source','semantic review required for PROVED'],dependsOn:[],status:formal?'PROVED':'OPEN',freshness:'CURRENT',revision:claimId+':r1',parentRevision:null});
    const d=lastProof.data||{},ev={id:'ev-proof-'+Date.now().toString(36),grade:formal?'FORMAL PASS':'UNKNOWN',claimRef:claimId,method:'Stage5 ProofDock / pinned Lean final verifier',inputsHash:d.sourceHash||await sha({target:lastProof.target,time:lastProof.generatedAt}),environmentHash:d.environmentHash||'unavailable',residuals:{proofResult:lastProof.status,run:d.state?.run||null,truth:d.state?.truth||null,axiomAudit:d.axiomAuditOutput||null,stdout:d.stdout||null,stderr:d.stderr||lastProof.error||null},errorBounds:null,assumptions:['LSP diagnostics are not proof evidence',formal?'semantic review complete':'no formal promotion on this record'],generatedAt:now(),adapterVersion:VERSION,upstreamRevisions:(s.revisions||[]).slice(0,6).map(x=>x.revision).filter(Boolean),stale:false,freshness:'CURRENT',supportsCurrent:formal,scope:'formal verification record / restricted C-014 when applicable'};
    window.MathScopeV031Foundation?.commitTypedBundle?.({bundleId:'stage5-proof-'+Date.now().toString(36),claims,evidence:[ev]},'Stage5 Proof Dock · '+lastProof.status);refreshGraph();refreshClaimSelectors();return ev;
  }

  function syntheticGraphFixture(){
    return{objects:[{id:'o',revision:'o:r2'}],representations:[{id:'r',sourceObjectRef:'o',revision:'r:r1',stale:true}],functionSpaces:[],operators:[],pdes:[],spectra:[],geometries:[],topologies:[],symmetries:[],kclasses:[],claims:[{id:'c',statement:'fixture',dependsOn:['r'],freshness:'REVIEW'}],evidence:[{id:'e',claimRef:'c',grade:'NUMERICAL INDICATOR',freshness:'STALE',stale:true}],assumptions:[],revisions:[]};
  }
  function runGate(){
    const fg=buildGraphFrom(syntheticGraphFixture()),fNode=fg.nodes.find(n=>n.rawId==='e'),hasRep=fg.edges.some(e=>e.relation==='representedBy'),hasSupport=fg.edges.some(e=>e.relation==='supports');
    const foundation=window.MathScopeV031Foundation,visualGuard=foundation?.canPromoteEvidence?.({grade:'NUMERICAL INDICATOR',method:'visual' },'THEOREM-BACKED',{sourceAuthority:'VISUAL',claimType:'TOPOLOGY_EQUIVALENCE',topologyEvidence:false});
    gate=[
      {name:'C1 Dependency graph',pass:hasRep&&hasSupport&&fNode?.stale===true,detail:'typed edges + stale highlighting reproduced on fixture'},
      {name:'C2 AI boundary',pass:copilotCanPromote('FORMAL PASS')===false&&copilotCanPromote('THEOREM-BACKED')===false,detail:'Copilot cannot set formal/theorem status without an external theorem map'},
      {name:'C3 Stress test',pass:stressBasis().outcome==='COUNTEREXAMPLE FOUND',detail:'counterexample is recorded as scoped numerical evidence, never theorem'},
      {name:'C3 Failure preservation',pass:foundation?.runFailureSelfTests?.()?.pass===true,detail:'Executed ten failure-kind record contracts plus JSON preservation and proof-authority rejection; no solver-failure coverage is inferred'},
      {name:'C6 Formal boundary',pass:finalStatus({state:{run:'SUCCESS',evidence:'FORMAL',truth:'SUPPORTED'},axiomAuditOutput:'[]'},false)==='PARTIAL'&&finalStatus({state:{run:'SUCCESS',evidence:'FORMAL',truth:'PROVED'},axiomAuditOutput:'[]'},true)==='PARTIAL',detail:'Standalone flags cannot issue FORMAL PASS; live pinned verifier receipt is required'},
      {name:'Visual→topology guard',pass:visualGuard?visualGuard.ok===false:true,detail:'3D/visual evidence cannot certify topology equivalence'}
    ];
    const pass=gate.every(x=>x.pass);one('#v031S5Gate').textContent=pass?'STAGE 5 CORE PASS':'STAGE 5 CHECK';one('#v031S5Gate').className='chip '+(pass?'ok':'warn');one('#v031S5GateBadge').textContent=pass?'C1/C2/C3/C6 PASS':'STAGE 5 CHECK';one('#v031S5GateBadge').className='v031-pill '+(pass?'pass':'warn');one('#v031S5Gates').innerHTML=gate.map(t=>'<div class="s5-gate '+(t.pass?'pass':'fail')+'"><b>'+(t.pass?'PASS · ':'FAIL · ')+esc(t.name)+'</b><small>'+esc(t.detail)+'</small></div>').join('');return{pass,tests:JSON.parse(JSON.stringify(gate)),deferred:['C4 symmetry semantics','C5 zeta semantics']}
  }

  function openStage5(part){
    document.querySelector('[data-view-target="stage5-research"]')?.click();const id=part==='stress'?'#v031S5StressCard':part==='proof'?'#v031S5ProofCard':part==='copilot'?'#v031S5CopilotCard':'#v031S5GraphCard';setTimeout(()=>one(id)?.scrollIntoView?.({block:'start',behavior:'smooth'}),60);
  }
  function addPaletteCommands(){
    const list=one('#v031Palette .v031-command-list');if(!list||one('[data-s5-palette]'))return;
    const defs=[['graph','Open Research Graph'],['stress','Run Stress Test'],['copilot','Open Research Copilot'],['proof','Open Proof Dock']];
    for(const [a,label] of defs){const b=document.createElement('button');b.textContent=label;b.dataset.s5Palette=a;b.addEventListener('click',()=>{one('#v031Palette')?.close?.();openStage5(a)});list.appendChild(b)}
  }
  function registerWebMCP(){
    const mc=document.modelContext;if(!mc?.registerTool)return;const safe=d=>{try{mc.registerTool(d,{signal:new AbortController().signal})}catch{}};
    safe({name:'mathscope.stage5.graph_summary',description:'Read the current ResearchSession dependency graph summary, including stale nodes and relation counts.',inputSchema:{type:'object',properties:{}},execute:async()=>{const g=buildGraphFrom(session());return{version:VERSION,nodes:g.nodes.length,edges:g.edges.length,staleNodes:g.nodes.filter(n=>n.stale).map(n=>({kind:n.kind,id:n.rawId})),relations:Object.fromEntries([...new Set(g.edges.map(e=>e.relation))].map(r=>[r,g.edges.filter(e=>e.relation===r).length]))}}});
    safe({name:'mathscope.stage5.run_stress_test',description:'Run one deterministic read-only stress/counterexample test. The result never promotes a claim to theorem status.',inputSchema:{type:'object',properties:{kind:{type:'string',enum:['identifiability','coordinate','basis','mesh','timestep','truncation','parameter','assumption','adversarial','divergence','symmetry']},claimId:{type:'string'}},required:['kind']},execute:async input=>runStressTest(input.kind,input.claimId||'')});
    safe({name:'mathscope.stage5.copilot_plan',description:'Generate a permission-bounded research orchestration plan. Suggestions cannot set theorem or formal proof status.',inputSchema:{type:'object',properties:{prompt:{type:'string'}},required:['prompt']},execute:async input=>({version:VERSION,permissions:PERMISSIONS,suggestions:orchestrate(input.prompt),formalPromotionAllowed:false})});
    safe({name:'mathscope.stage5.proof_status',description:'Read Proof Dock verifier metadata and current result. This is read-only and does not issue or commit proof evidence.',inputSchema:{type:'object',properties:{}},execute:async()=>({version:VERSION,target:lastProofTarget,meta:proofMeta,result:lastProof,lspBoundary:'EXPERIMENTAL / diagnostics only',finalVerifier:'separate restricted C-014'})});
  }

  function init(){
    if(!one('#v031Stage5Research'))return;
    renderGradeFilters();renderPermissions();refreshClaimSelectors();refreshGraph();runGate();registerWebMCP();addPaletteCommands();
    all('[data-view-target="stage5-research"]').forEach(b=>b.addEventListener('click',()=>{refreshClaimSelectors();refreshGraph();}));
    one('#v031S5GraphRefresh')?.addEventListener('click',refreshGraph);one('#v031S5GraphFit')?.addEventListener('click',drawGraph);one('#v031S5GraphStaleOnly')?.addEventListener('change',drawGraph);one('#v031S5GraphCanvas')?.addEventListener('click',selectAt);
    one('#v031S5StressRun')?.addEventListener('click',()=>runStressUI().catch(e=>{one('#v031S5StressLog').textContent=String(e?.stack||e)}));one('#v031S5StressCommit')?.addEventListener('click',()=>commitStress().catch(e=>{one('#v031S5StressLog').textContent=String(e?.stack||e)}));
    one('#v031S5CopilotRun')?.addEventListener('click',runCopilot);one('#v031S5CopilotDraft')?.addEventListener('click',()=>createDraftClaim().catch(()=>{}));one('#v031S5Suggestions')?.addEventListener('click',e=>{const b=e.target.closest?.('[data-s5-action]');if(b)applyCopilotAction(b.dataset.s5Action)});
    one('#v031S5ProofClaim')?.addEventListener('change',()=>{lastProof=null;lastProofReceipt=null;renderProofTarget()});one('#v031S5ProofRefresh')?.addEventListener('click',()=>refreshProofMeta());one('#v031S5ProofVerify')?.addEventListener('click',()=>verifyProof());one('#v031S5ProofCommit')?.addEventListener('click',()=>commitProof());
    one('#v031Stress')?.addEventListener('click',()=>openStage5('stress'));one('#v031Verify')?.addEventListener('click',()=>openStage5('proof'));
    all('[data-v031-canvas="Research Graph"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>openStage5('graph'),0)));all('[data-v031-dock="Dependency Graph"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>openStage5('graph'),0)));all('[data-v031-dock="Lean"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>openStage5('proof'),0)));
    window.addEventListener('resize',()=>{if(document.querySelector('[data-view="stage5-research"].active'))drawGraph()});
    window.MathScopeV031Stage5={version:VERSION,buildGraph:()=>buildGraphFrom(session()),refreshGraph,runStressTest,runStress:runStressUI,commitStress,orchestrate,copilotCanPromote,createDraftClaim,refreshProofMeta,verifyProof,commitProof,runGate,getGate:()=>gate,getLastStress:()=>lastStress,getLastProof:()=>lastProof?JSON.parse(JSON.stringify(lastProof)):null};
    if(location.hash==='#stage5')setTimeout(()=>openStage5('graph'),520);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();
