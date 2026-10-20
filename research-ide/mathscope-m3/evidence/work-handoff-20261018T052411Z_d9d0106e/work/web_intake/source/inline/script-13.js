
(() => {
  'use strict';
  const VERSION='0.3.1-stage8.1';
  const SERVICE='https://mathscope-compute.onrender.com';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const ESC=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now=()=>new Date().toISOString();
  const encoder=new TextEncoder(),decoder=new TextDecoder();
  const modes={
    s5:{graph:'C1 Research Graph',stress:'C3 Stress / Refinement',copilot:'C2 Copilot Suggestions',proof:'C8 Proof Coverage'},
    s6:{symbol:'D2 Principal Symbol',kclass:'D4 K-Class Representative',index:'D5 Index / Kernel / Cokernel',boundary:'D7 Boundary Obstruction',nonlinear:'D8 Nonlinear Linearization'},
    s7:{galois:'C6 Galois / Root Orbit',zeta:'C7 Riemann ζ Complex Surface',spectral_zeta:'C7 Finite Spectral ζ',flow:'D9 Spectral Flow',equivariant:'D12 Equivariant C₂',perturbation:'D10 Perturbation',khomology:'D11 K-Homology Metadata',ricci:'B5 Ricci Flow'}
  };
  let THREE_P=null;
  const R={s5:null,s6:null,s7:null};
  const renderSerial={s5:0,s6:0,s7:0};
  const results={s5:null,s6:null,s7:null};
  let zetaCache=null, pendingZeta=null, lastBundleBytes=null, currentGate=null, lastBench=null;
  const evidenceClasses=['FORMAL PASS','THEOREM-BACKED','CERTIFIED NUMERICAL','NUMERICAL INDICATOR','EMPIRICAL CORRESPONDENCE','RESEARCH HYPOTHESIS','UNKNOWN','STALE'];
  const pinnedWarnings=[
    'Visualized ≠ Proved','Representation ≠ Object','Numeric ≠ Exact',
    'Finite spectrum ≠ Infinite spectrum','3D Galois resemblance ≠ Galois proof',
    'Riemann ζ ≠ Spectral ζ','Index 0 ≠ Invertible','K-class display ≠ K-class itself'
  ];
  function sess(){return window.MathScopeV031Foundation?.getSession?.()||null}
  function log(message){const el=$('#v031S8Log');if(el)el.textContent='['+now()+'] '+message+'\n'+el.textContent.slice(0,9000)}
  function lbl(stage,m){return modes[stage]?.[m]||m}
  function status(stage,text,warn=false){const el=$('#v031S8'+stage.toUpperCase()+'Status');if(el){el.textContent=text;el.className='chip '+(warn?'warn':'ok')}}
  function mode(stage){return $('#v031S8'+stage.toUpperCase()+'Mode')?.value||Object.keys(modes[stage])[0]}
  function rebaseRepresentation(stage,key,source,method,lost,scope){
    const s=sess();
    const rev=(s?.revisions||[]).slice(0,8).map(r=>r.revision).filter(Boolean);
    return {
      type:'Research3DRepresentationSpec',
      id:'s8-view-'+stage+'-'+key,sourceObjectRef:source,method,displayDim:3,
      mapDefinition:scope,
      preserved:['source node reference','assumptions and source revisions','visual encoding metadata'],
      lostDimensions:lost, sourceRevisions:rev, revision:'s8-view-'+stage+'-'+key+':r1',
      evidenceGrade:'NUMERICAL INDICATOR',proofCertification:false,topologyEquivalenceCertified:false,
      assumptions:['reference visualization, not formal proof','selected sampling/embedding and camera must be recorded']
    };
  }
  function metadata(stage,key,source,method,lost,scope,extra={}){
    return {representation:rebaseRepresentation(stage,key,source,method,lost,scope),
      source:source,stage,mode:key,displayTitle:lbl(stage,key),uncertainty:'SAMPLED / SCHEMATIC',
      ...extra,trust:pinnedWarnings};
  }
  async function engine(){
    if(!THREE_P)THREE_P=import('three').catch(e=>{THREE_P=null;throw e});
    return THREE_P;
  }
  function addSphere(T,group,x,y,z,r=.1,color=0x78e9e1){
    const g=new T.SphereGeometry(r,10,8);
    const m=new T.MeshBasicMaterial({color});const mesh=new T.Mesh(g,m);
    mesh.position.set(x,y,z);group.add(mesh);return mesh;
  }
  function addLine(T,group,pts,color=0x92cbdc){
    const g=new T.BufferGeometry().setFromPoints(pts.map(p=>new T.Vector3(...p)));
    const ln=new T.Line(g,new T.LineBasicMaterial({color,transparent:true,opacity:.8}));group.add(ln);return ln;
  }
  function bar(T,group,x,y,z,value,color){
    const h=Math.max(.025,Math.abs(value)),g=new T.BoxGeometry(.48,.48,h);
    const mesh=new T.Mesh(g,new T.MeshBasicMaterial({color,transparent:true,opacity:.82}));
    mesh.position.set(x,y,z+(value>=0?h/2:-h/2));group.add(mesh);return mesh;
  }
  function series(T,group,fn,n=84,color=0x7ce9e1){
    const pts=[];for(let k=0;k<n;k++)pts.push(fn(k/(n-1)));addLine(T,group,pts,color);
  }
  async function surface(T,group,nx,ny,at,opts={}){return window.MathScopeProgressiveSurface(T,group,nx,ny,at,opts);}
  function complexEuler(x,t,N){
    const re=new Float64Array(N+1),im=new Float64Array(N+1);
    for(let i=0;i<=N;i++){const n=i+1,v=Math.pow(n,-x),ph=-t*Math.log(n);re[i]=v*Math.cos(ph);im[i]=v*Math.sin(ph)}
    let sr=0,si=0,w=.5;
    for(let k=0;k<=N;k++){
      sr+=w*re[0];si+=w*im[0];
      for(let j=0;j<N-k;j++){re[j]-=re[j+1];im[j]-=im[j+1]}
      w*=.5;
    }
    const a=Math.pow(2,1-x),theta=-t*Math.log(2),dr=1-a*Math.cos(theta),di=-a*Math.sin(theta),d=dr*dr+di*di;
    if(d<1e-12)return null;
    return {re:(sr*dr+si*di)/d,im:(si*dr-sr*di)/d};
  }
  function localZetaGrid(){
    const nx=25,ny=35,verts=[],domain={realMin:.2,realMax:1.4,imagMin:0,imagMax:32};
    let discrepancyMax=0,masked=0,nearZero=0;
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
      const x=domain.realMin+(domain.realMax-domain.realMin)*i/(nx-1);
      const y=domain.imagMin+(domain.imagMax-domain.imagMin)*j/(ny-1);
      if(Math.hypot(x-1,y)<.075){verts.push({x,y,status:'POLE_MASKED',height:null,phase:null});masked++;continue}
      const low=complexEuler(x,y,42),high=complexEuler(x,y,68);
      if(!low||!high||![low.re,low.im,high.re,high.im].every(Number.isFinite)){
        verts.push({x,y,status:'EVALUATION_MASKED',height:null,phase:null});masked++;continue
      }
      const mag=Math.hypot(high.re,high.im),d=Math.hypot(low.re-high.re,low.im-high.im);
      discrepancyMax=Math.max(discrepancyMax,d);if(mag<.05)nearZero++;
      verts.push({x,y,height:Math.min(8,Math.log1p(mag)),phase:Math.atan2(high.im,high.re),magnitude:mag,re:high.re,im:high.im,precisionDiscrepancy:d,status:'SAMPLED'});
    }
    return {type:'ComplexZetaSurfaceSpec',functionRef:'RiemannZetaSpec',grid:{realSamples:nx,imagSamples:ny},
      domain,vertices:verts,maskedCount:masked,nearZeroSampleCount:nearZero,
      analyticContinuation:'Euler-transformed Dirichlet eta series (browser reference)',
      precisionDiscrepancyIsCertifiedBound:false,numericalDiscrepancyMax:discrepancyMax,
      heightScale:'log1p(abs(zeta(s)))',phaseScale:'arg(zeta(s)) radians',
      riemannZetaEqualsSpectralZeta:false,zeroCertification:'NONE',status:'NUMERICAL INDICATOR / BROWSER REFERENCE'};
  }
  let zetaRequestController=null,activeSamplingTask=null;
  async function cancelSampling(){
    activeSamplingTask?.cancel();
    const task=zetaRequestController;
    if(task){log('Server cancellation requested; waiting for worker termination.');const outcome=await task.cancel();log(outcome.cancellationConfirmed?'Server worker termination confirmed; no result committed.':'Server termination unconfirmed; no result committed.');}
    else log('Local sampling stopped; no active server job handle.');
  }
  function cpuSample(){
    const N=320,t=performance.now();let valid=0;
    for(let i=0;i<N;i++){const z=complexEuler(.5,12+i*.01,48);if(z&&Number.isFinite(z.re))valid++;}
    const elapsedMs=performance.now()-t;return{samples:N,valid,elapsedMs,msPerSample:elapsedMs/N};
  }
  function runSamplingWorker(kind,{signal,timeoutMs=12000}={}){
    if(!['zeta','cpu'].includes(kind))return Promise.reject(Error('unsupported sampling task'));
    if(typeof Worker==='undefined')return Promise.reject(Error('Web Worker unavailable: sampling not run on the UI thread'));
    activeSamplingTask?.cancel();
    return new Promise((resolve,reject)=>{
      let worker,url,timer,settled=false;
      const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);worker?.terminate();if(url)URL.revokeObjectURL(url);if(activeSamplingTask===task)activeSamplingTask=null;error?reject(error):resolve(value)};
      const abort=()=>finish(new DOMException('Sampling cancelled','AbortError'));
      const task={cancel:abort};activeSamplingTask=task;
      if(signal?.aborted){abort();return;}
      try{
        const code=complexEuler.toString()+'\n'+localZetaGrid.toString()+'\n'+cpuSample.toString()+"\nonmessage=e=>{try{const result=e.data==='zeta'?localZetaGrid():cpuSample();postMessage({ok:true,result})}catch(e){postMessage({ok:false,error:String(e.message||e)})}};";
        url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));worker=new Worker(url);
        worker.onmessage=e=>e.data?.ok?finish(null,e.data.result):finish(Error(e.data?.error||'sampling worker failed'));
        worker.onerror=e=>finish(Error(e.message||'sampling worker failed'));
        signal?.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>finish(Error('Sampling worker timed out')),Math.max(100,Math.min(30000,timeoutMs)));
        worker.postMessage(kind);
      }catch(e){finish(e)}
    });
  }
  function createViewportSizing(canvas,renderer,camera,lod){
    let width=0,height=0,dpr=0,sizeUpdates=0;
    const update=()=>{
      const w=Math.max(320,canvas.clientWidth||700),h=Math.max(220,canvas.clientHeight||330),ratio=Math.min(lod==='compact'?1:1.5,window.devicePixelRatio||1);
      if(w!==width||h!==height||ratio!==dpr){width=w;height=h;dpr=ratio;renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();sizeUpdates++;}
      return{width,height,dpr,sizeUpdates,physicalWidth:canvas.width,physicalHeight:canvas.height,lod};
    };
    return{update};
  }
  async function cloudZeta(){
    if(zetaCache)return zetaCache;if(pendingZeta)return pendingZeta;
    pendingZeta=(async()=>{
      const origin=window.MathScopeV031Foundation.getSession(),inputSpec={realMin:.2,realMax:1.4,imagMin:0,imagMax:32,realSamples:25,imagSamples:35,precisionDps:28};
      const task=window.MathScopeJobs.start({kind:'run',adapter:'advanced.zeta-complex-surface.v1',inputSpec,environment:{requestSource:'MathScope Stage8 3D',clientVersion:VERSION}}, {onStatus:j=>status('s7','SERVER '+j.status.toUpperCase()+' · '+j.phase,true)});zetaRequestController=task;
      try{const {result:out,job}=await task.promise;const z=(out.outputRepresentations||[]).find(x=>x.type==='ComplexZetaSurfaceSpec');
        if(!z||z.zeroCertification!=='NONE'||z.riemannZetaEqualsSpectralZeta!==false)throw Error('invalid cloud zeta trust contract');
        zetaCache={data:z,source:'CLOUD NUMERICAL (mpmath analytic continuation)',evidence:out.evidenceRecords?.[0],jobExecution:job};return zetaCache;
      }catch(e){window.MathScopeV031Foundation.captureFailure(e,{sessionId:origin.id,sessionRevision:origin.sessionRevision,inputSpec,stage:'Stage7 complex zeta',operation:'cloud-surface-sampling',adapter:'advanced.zeta-complex-surface.v1'});if(e.name==='AbortError'||e.failureKind==='CANCELLED')throw e;const warning=String(e.message||e);log('Complex zeta cloud fallback: '+warning+'; Render 3D retries the cloud request.');const z=await runSamplingWorker('zeta');zetaCache={data:z,source:'BROWSER EULER-ETA APPROXIMATION / UNCERTIFIED',evidence:null,warning};return zetaCache;}
      finally{pendingZeta=null;if(zetaRequestController===task)zetaRequestController=null;}
    })();return pendingZeta;
  }
  async function sampleFallback(stage,key,T,group){
    let meta=metadata(stage,key,'ReferenceFixture','scoped-schematic',[],lbl(stage,key)+' illustrative reference');
    const pStage5=window.MathScopeV031Stage5;
    const pStage6=window.MathScopeV031Stage6;
    const pStage7=window.MathScopeV031Stage7;
    if(stage==='s5'){
      const graph=pStage5?.buildGraph?.()||{nodes:[],edges:[]};
      const nodes=(graph.nodes||[]).slice(0,120);
      const gradeZ={"FORMAL PASS":3,"THEOREM-BACKED":2.4,"CERTIFIED NUMERICAL":2,"NUMERICAL INDICATOR":1.2,"RESEARCH HYPOTHESIS":.4,"STALE":-.8};
      if(key==='graph'||key==='copilot'||key==='proof'){
        const active=key==='graph'?nodes:nodes.filter(n=>key==='proof'?['Claim','Evidence','Revision'].includes(n.kind):['Claim','Representation','Assumption','Evidence'].includes(n.kind));
        const tier={Object:0,Representation:1,Operator:2,PDE:2,Spectrum:3,Geometry:3,Topology:3,'Principal Symbol':4,'K-class':5,Claim:5,Evidence:6};
        const positions=new Map();
        active.forEach((n,i)=>{const x=((tier[n.kind]??3)-3)*1.0,y=((i%9)-4)*.48,z=(gradeZ[n.grade]??(n.stale?-.7:.5));positions.set(n.key,[x,y,z]);addSphere(T,group,x,y,z,n.stale?.11:.085,n.stale?0xff8888:n.kind==='Evidence'?0x7ce9e1:0x8ed7ff)});
        for(const e of(graph.edges||[])){const a=positions.get(e.from),b=positions.get(e.to);if(a&&b)addLine(T,group,[a,b],0x395c74)}
        if(!active.length)meta.uncertainty='NO COMMITTED GRAPH DATA';
        meta=metadata(stage,key,'ResearchSession/DependencyGraph','layout-embedding',['metric meaning of coordinates','proof entailment from visual position'],'x=dependency tier, y=sibling layout, z=recorded grade', {nodeCount:active.length,totalSourceNodes:graph.nodes?.length||0,displayNodeCap:120,omittedSourceNodes:Math.max(0,(graph.nodes?.length||0)-nodes.length),edgeCount:graph.edges?.length||0,graphAccess:'Use the searchable paginated node table for every source node and cross-page dependencies'});
      }else{
        await surface(T,group,44,28,(u,v)=>[(u-.5)*8,(v-.5)*6,.4+1.7*Math.exp(-Math.pow((u-.58)*4,2)-Math.pow((v-.4)*5,2))+.15*Math.sin(u*25)*Math.cos(v*23)],{hue:(u,v)=>.1+.35*u});
        meta=metadata(stage,key,'StressTestReferenceFixture','residual-surface',['exact solver error bounds'],'x=parameter, y=refinement, z=schematic residual',{uncertainty:'SYNTHETIC STRESS TERRAIN / NOT A COMPUTED COUNTEREXAMPLE'});
      }
    } else if(stage==='s6'){
      const input=pStage6?.makeInput?.()||{},b=pStage6?.getByType?.()||{};
      const A=input.quadraticForm||((input.model==='hyperbolic_counterexample')?[[1,0],[0,-1]]:[[1,0],[0,1]]);
      const q=theta=>{const c=Math.cos(theta),s=Math.sin(theta);return A[0][0]*c*c+(A[0][1]+A[1][0])*c*s+A[1][1]*s*s};
      if(key==='symbol'||key==='kclass'){
        const rings=key==='symbol'?1:5;
        for(let k=0;k<rings;k++)series(T,group,t=>{const th=2*Math.PI*t,rad=1+k*.19;return [rad*Math.cos(th),rad*Math.sin(th),q(th)*(.9+k*.08)]},121,k%2?0x8ed7ff:0x7ce9e1);
        for(let k=0;k<128;k++){const th=2*Math.PI*k/128,z=q(th);if(Math.abs(z)<.035)addSphere(T,group,Math.cos(th),Math.sin(th),z,.055,0xff8585)}
        meta=metadata(stage,key,key==='symbol'?'PrincipalSymbolSpec':'KTheorySpec',key==='symbol'?'cotangent-unit-circle':'symbol-representative-phase',['unseen cotangent directions','eigenbundle topology'],'ξ=(cosθ,sinθ), z=ξᵀAξ / sampled representative',{uncertainty:b.EllipticityResult?.status||'REFERENCE MODEL ONLY',kClassItselfVisualized:false});
      } else if(key==='index'){
        const ix=b.IndexSpec||{},ker=Number(ix.kernelDimension??1),coker=Number(ix.cokernelDimension??1),idx=Number(ix.analyticIndex??(ker-coker));
        bar(T,group,-1.6,0,0,ker,0x78e9e1);bar(T,group,0,0,0,coker,0x8ed7ff);bar(T,group,1.6,0,0,idx,0xffc65d);
        meta=metadata(stage,key,'IndexSpec','kernel-cokernel-bars',['full Fredholm operator information'],'x=kernel/cokernel/index bars, z=value',{kernel:ker,cokernel:coker,index:idx,uncertainty:b.IndexSpec?.comparison||'SYNTHETIC CLOSED LAPLACIAN REFERENCE / NOT LIVE INDEX COMPUTATION',guard:'index 0 ≠ invertible'});
      } else if(key==='boundary'){
        const N=80;for(let j=0;j<3;j++)series(T,group,t=>{const th=2*Math.PI*t;return[1.7*Math.cos(th),1.7*Math.sin(th),j*.7]},N,j===1?0xffd17e:0x7ce9e1);
        for(let k=0;k<16;k++){const a=2*Math.PI*k/16;addLine(T,group,[[1.7*Math.cos(a),1.7*Math.sin(a),0],[1.7*Math.cos(a),1.7*Math.sin(a),1.4]],0x34536d)}
        meta=metadata(stage,key,'BoundaryAnalysisSpec','symbolic-boundary-cylinder',['actual boundary calculus'],'coloured local/global BC hypothesis bands',{uncertainty:'SEMANTIC DISPLAY; LOCAL OBSTRUCTION DOES NOT BLOCK EVERY BC'});
      } else {
        await surface(T,group,50,35,(u,v)=>{const x=(u-.5)*4,y=(v-.5)*4;return[x,y,-.4*(x*x+y*y)+.13*Math.pow(x*x+y*y,2)]},{hue:(u,v)=>.55-.3*u});
        meta=metadata(stage,key,'NonlinearIndexBridgeSpec','toy-potential-surface',['true PDE solution set','global nonlinear stability'],'z=-.4|u|²+.13|u|⁴ toy local potential',{uncertainty:'TOY POTENTIAL, NOT NONLINEAR PDE GENERAL SOLUTION'});
      }
    } else {
      const t=pStage7?.getState?.()||{};
      if(key==='galois'){
        const roots=t.galois?.types?.GaloisLabSpec?.roots||[{re:Math.sqrt(2),im:0},{re:-Math.sqrt(2),im:0}];
        roots.forEach((r,i)=>addSphere(T,group,r.re*1.2,r.im*1.2,i*.4,.16,0x7ce9e1));
        for(let j=0;j<roots.length;j++)addLine(T,group,[[roots[j].re*1.2,roots[j].im*1.2,j*.4],[roots[(j+1)%roots.length].re*1.2,roots[(j+1)%roots.length].im*1.2,((j+1)%roots.length)*.4]],0x8ed7ff);
        meta=metadata(stage,key,'GaloisLabSpec','complex-roots-with-reference-permutation',['algebraic field extension proof'],'x=Re(root),y=Im(root),z=display layer',{uncertainty:'DISPLAY OF ROOTS / NOT GALOIS CERTIFICATION'});
      } else if(key==='spectral_zeta'){
        const eigs=t.zeta?.types?.SpectralZetaSpec?.sourceEigenvalues||Array.from({length:20},(_,i)=>(i+1)*(i+1));
        eigs.slice(0,40).forEach((ev,i)=>bar(T,group,(i%10-4.5)*.55,Math.floor(i/10)*.62,0,Math.log1p(ev)*.4,0x8ed7ff));
        meta=metadata(stage,key,'SpectralZetaSpec','finite-eigenvalue-towers',['infinite spectral measure'],'z=log1p(finite eigenvalues)',{uncertainty:'FINITE/TRUNCATED; DISTINCT FROM RIEMANN ZETA'});
      } else if(key==='flow'){
        const f=t.flow?.types?.SpectralFlowSpec;
        const tracks=f?.eigenvalueTracks||[[-.8,1.6],[-.6,1.4],[-.4,1.2],[-.2,.9],[.7,-1.4]].map(([a,b])=>({a,b,values:Array.from({length:101},(_,i)=>a+b*i/100)}));
        tracks.forEach((track,i)=>series(T,group,q=>[(q-.5)*7,(i-2)*.72,Number(track.a)+Number(track.b)*q],101,track.b>=0?0x7ce9e1:0xff8585));
        meta=metadata(stage,key,'SpectralFlowSpec','t-track-eigenvalue',['operator topology beyond selected tracks'],'x=time, y=track index, z=eigenvalue',{uncertainty:f?.status||'EXPLICIT DIAGONAL SELF-ADJOINT FREDHOLM REFERENCE'});
      } else if(key==='equivariant'||key==='khomology'){
        for(let i=0;i<2;i++){bar(T,group,i?1.3:-1.3,0,0,i?2.2:1.6,0x8ed7ff);addSphere(T,group,i?1.3:-1.3,0,i?2.3:1.7,.13,0x7ce9e1)}
        addLine(T,group,[[-1.3,0,1.6],[1.3,0,2.2]],0xffc65d);
        meta=metadata(stage,key,key==='equivariant'?'EquivariantKTheorySpec':'KHomologySpec','group-action-metadata',['abstract K-homology class','equivariant K-class'],'finite C2 representation surrogate',{uncertainty:'PARTIAL/EXTERNAL, NOT ABSTRACT K-CLASS VISUALIZATION'});
      } else if(key==='perturbation'){
        const eigs=t.perturbation?.types?.PerturbationSpec?.eigenvalues||[[-2,1,3],[-1.9,.9,3],[-1.95,.98,2.97]];
        for(let i=0;i<Math.min(...eigs.map(e=>e.length));i++){addLine(T,group,eigs.map((row,j)=>[(j-1)*2,(i-1)*1.25,row[i]]),0x7ce9e1)}
        meta=metadata(stage,key,'PerturbationSpec','finite-eigenvalue-track',['infinite Fredholm stability theorem'],'x=perturbation step, y=eigenvalue index, z=finite eigenvalue',{uncertainty:'FINITE MATRIX REFERENCE ONLY'});
      } else if(key==='ricci'){
        const flow=t.ricci?.types?.RicciFlowSpec,ts=[0,.12,.26,.4];
        ts.forEach((tt,i)=>{
          const radius=Math.sqrt(Math.max(.02,1-2*tt))*.83;
          const geo=new T.SphereGeometry(radius,18,12),mat=new T.MeshBasicMaterial({color:i%2?0x8ed7ff:0x7ce9e1,wireframe:true,transparent:true,opacity:.48});
          const mesh=new T.Mesh(geo,mat);mesh.position.x=(i-1.5)*2.2;group.add(mesh);
        });
        meta=metadata(stage,key,'RicciFlowSpec','round-sphere-time-snapshots',['general Ricci flow solution','surgery event data'],'round S²: g(t)=(1-2t)g(0) reference',{uncertainty:flow?.status||'CONSTANT-CURVATURE REFERENCE; SURGERY SEPARATE'});
      }
    }
    return meta;
  }
  function present(stage,meta){
    results[stage]=meta;
    const box=$('#v031S8'+stage.toUpperCase()+'Info');
    if(box){box.textContent=JSON.stringify({label:meta.displayTitle,sourceObject:meta.source,map:meta.representation.mapDefinition,discarded:meta.representation.lostDimensions,evidence:meta.representation.evidenceGrade,scope:meta.uncertainty,notes:meta.guard||meta.trust,rendering:meta.rendering},null,2)}
    status(stage,'3D REFERENCE · '+meta.uncertainty,true);
  }
  function stop(stage){
    const state=R[stage];if(!state)return;
    state.disposed=true;
    state.resizeObserver?.disconnect();state.cancelDraw?.();
    if(state.events)state.events.abort();
    if(state.raf)cancelAnimationFrame(state.raf);
    state.scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){for(const m of(Array.isArray(obj.material)?obj.material:[obj.material]))m.dispose()}});
    state.renderer.dispose();R[stage]=null;
  }
  async function render(stage){
    const c=$('#v031S8'+stage.toUpperCase()+'Canvas');
    if(!c)return;
    stop(stage);
    const key=mode(stage),serial=++renderSerial[stage];
    const info=$('#v031S8'+stage.toUpperCase()+'Info');
    if(info)info.textContent='3D viewer initializing…';
    let T;
    try{T=await engine()}catch(e){
      if(info)info.textContent='WebGL module unavailable: '+String(e.message||e)+' — no false 3D PASS is issued.';
      status(stage,'WEBGL UNAVAILABLE',true);return;
    }
    if(renderSerial[stage]!==serial)return;
    let renderer;
    try{renderer=new T.WebGLRenderer({canvas:c,antialias:true,alpha:false,powerPreference:'low-power'})}
    catch(e){if(info)info.textContent='WebGL unavailable: '+e.message;status(stage,'WEBGL HOLD',true);return}
    const w=Math.max(320,c.clientWidth||700),h=Math.max(220,c.clientHeight||330);
    const lod=$('#v031S8'+stage.toUpperCase()+'LOD')?.value||'full';
    const scene=new T.Scene();scene.background=new T.Color(0x061520);
    const camera=new T.PerspectiveCamera(45,w/h,.1,500);camera.up.set(0,0,1);
    let theta=-.9,phi=.42,dist=14.5;
    function orbit(){camera.position.set(dist*Math.cos(phi)*Math.cos(theta),dist*Math.cos(phi)*Math.sin(theta),dist*Math.sin(phi)+1.5);camera.lookAt(0,0,.5)}
    orbit();
    const group=new T.Group();group.userData.lod=lod;scene.add(group);
    const axes=new T.AxesHelper(3.8);scene.add(axes);
    const grid=new T.GridHelper(11,11,0x254a5e,0x183244);grid.rotation.x=Math.PI/2;scene.add(grid);
    renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.setSize(w,h,false);
    group.userData.loading={isCancelled:()=>renderSerial[stage]!==serial||!c.isConnected||!c.getClientRects().length,onProgress:p=>{c.dataset.loading=JSON.stringify(p);if(info)info.textContent='Progressive surface · '+p.phase+' '+p.loaded+'/'+p.total+' · partial display is not evidence';renderer.render(scene,camera);}};
    let meta;try{meta=await sampleFallback(stage,key,T,group);
    if(stage==='s7'&&key==='zeta'){
      status(stage,'SAMPLING ζ(s)…',true);
      const gridResult=await cloudZeta();
      if(renderSerial[stage]!==serial){scene.traverse(obj=>{obj.geometry?.dispose();for(const m of(obj.material?(Array.isArray(obj.material)?obj.material:[obj.material]):[]))m.dispose()});renderer.dispose();return;}
      const z=gridResult.data,nx=z.grid.realSamples,ny=z.grid.imagSamples,d=z.domain;
      const vals=z.vertices||[];
      await surface(T,group,nx,ny,(u,v,i,j)=>{
        const p=vals[j*nx+i];
        if(!p||p.status==='POLE_MASKED'||p.status==='EVALUATION_MASKED'||!Number.isFinite(p.height))return null;
        return [(p.x-(d.realMin+d.realMax)/2)*7.4/(d.realMax-d.realMin),
                (p.y-(d.imagMin+d.imagMax)/2)*8.2/(d.imagMax-d.imagMin),
                Math.min(7,p.height)*1.5];
      },{hue:(u,v,i,j)=>{const p=vals[j*nx+i];return p?.phase==null?0:(p.phase+Math.PI)/(2*Math.PI)}});
      const knownZeros=[14.134725141734694,21.022039638771555,25.01085758014569,30.424876125859513];
      for(const y of knownZeros){if(y>=d.imagMin&&y<=d.imagMax)addSphere(T,group,((.5-(d.realMin+d.realMax)/2)*7.4/(d.realMax-d.realMin)),((y-(d.imagMin+d.imagMax)/2)*8.2/(d.imagMax-d.imagMin)),.04,.055,0xffffff)}
      meta=metadata(stage,key,'RiemannZetaSpec','complex-domain-height-phase',['Re ζ and Im ζ as independent spatial axes','holomorphic geometry and metric'],'x=Re(s), y=Im(s), z=1.5*log(1+|ζ(s)|), hue=arg ζ(s)',{
        uncertainty:gridResult.source,maskedSamples:z.maskedCount,
        note:'White points = reference zero ordinates, NOT proof of zeros; pole s=1 masked; numerical precision discrepancy is not an error certificate.',
        analyticContinuation:z.analyticContinuation,zeroCertification:false,riemannEqualsSpectral:false,
        precisionCrossCheckCertified:false,evidence: gridResult.evidence?.grade||'NUMERICAL INDICATOR'
      });
    }
    }catch(e){scene.traverse(obj=>{obj.geometry?.dispose();for(const m of(obj.material?(Array.isArray(obj.material)?obj.material:[obj.material]):[]))m.dispose()});renderer.dispose();throw e;}
    meta.rendering={lod,surfaceStats:group.userData.surfaceStats||[],geometryIsEvidence:false};
    present(stage,meta);
    let down=false,lastX=0,lastY=0;
    const events=new AbortController();
    const sizing=createViewportSizing(c,renderer,camera,lod);let drawRaf=0;
    const redraw=()=>{const viewport=sizing.update();orbit();renderer.render(scene,camera);c.dataset.viewport=JSON.stringify({...viewport,surfaces:group.userData.surfaceStats||[]});};
    const requestDraw=()=>{if(!drawRaf)drawRaf=requestAnimationFrame(()=>{drawRaf=0;if(!events.signal.aborted)redraw()})};
    const cancelDraw=()=>{if(drawRaf)cancelAnimationFrame(drawRaf);drawRaf=0;};
    const resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(requestDraw):null;resizeObserver?.observe(c);
    c.addEventListener('pointerdown',e=>{down=true;lastX=e.clientX;lastY=e.clientY;c.setPointerCapture?.(e.pointerId)},{signal:events.signal});
    c.addEventListener('pointermove',e=>{if(!down)return;theta+=(e.clientX-lastX)*.008;phi=Math.min(1.25,Math.max(-1.1,phi+(e.clientY-lastY)*.007));lastX=e.clientX;lastY=e.clientY;requestDraw()},{signal:events.signal});
    c.addEventListener('pointerup',()=>{down=false},{signal:events.signal});
    c.addEventListener('pointercancel',()=>{down=false},{signal:events.signal});
    c.tabIndex=0;c.setAttribute('aria-describedby','v031S8'+stage.toUpperCase()+'Info');
    c.setAttribute('aria-label','Interactive 3D mathematical representation. Arrow keys rotate, plus/minus zoom, Home resets. Drag or wheel also supported.');
    c.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;
      e.preventDefault();
      if(e.key==='ArrowLeft')theta-=.12;if(e.key==='ArrowRight')theta+=.12;
      if(e.key==='ArrowUp')phi=Math.min(1.25,phi+.1);if(e.key==='ArrowDown')phi=Math.max(-1.1,phi-.1);
      if(e.key==='+'||e.key==='=')dist=Math.max(3,dist/1.075);if(e.key==='-')dist=Math.min(35,dist*1.075);
      if(e.key==='Home'){theta=-.9;phi=.42;dist=14.5;}
      requestDraw();c.dataset.camera=JSON.stringify({theta,phi,dist});
    },{signal:events.signal});
    c.addEventListener('wheel',e=>{if(e.cancelable)e.preventDefault();dist=Math.min(35,Math.max(3,dist*(1+Math.sign(e.deltaY)*.075)));requestDraw()},{passive:false,signal:events.signal});
    window.addEventListener('resize',requestDraw,{signal:events.signal});
    R[stage]={renderer,scene,camera,group,events,resizeObserver,cancelDraw,requestDraw,disposed:false,raf:0,redraw};
    redraw();
    const rotate=$('#v031S8'+stage.toUpperCase()+'Rotate');
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const meter=$('#v031S8'+stage.toUpperCase()+'Telemetry');
    if(meter)meter.textContent=reduced?'Reduced motion: rotation disabled.':'Rotate to measure 180 rendered frames; this is a browser sample, not a device certification.';
    if(rotate?.checked&&!reduced){let last=null,frames=[],renderCosts=[];const tick=t=>{
      const obj=R[stage];if(!obj||obj.disposed)return;
      if(document.querySelector('[data-view="'+(stage==='s5'?'stage5-research':stage==='s6'?'stage6-index':'stage7-advanced')+'"].active')==null)return;
      const interval=last===null?0:t-last;last=t;const delta=Math.min(.05,interval/1000);theta+=delta*.22;
      const begin=performance.now();redraw();const cost=performance.now()-begin;
      if(interval>0&&document.visibilityState==='visible'){frames.push(interval);renderCosts.push(cost);if(frames.length>180){frames.shift();renderCosts.shift();}}
      if(frames.length&&frames.length%30===0){
        const sorted=[...frames].sort((a,b)=>a-b),sum=frames.reduce((a,b)=>a+b,0);
        const sample={frames:frames.length,fps:Number((1000*frames.length/sum).toFixed(2)),frameMsP95:Number(sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))].toFixed(2)),renderSubmitMsMean:Number((renderCosts.reduce((a,b)=>a+b,0)/renderCosts.length).toFixed(3)),viewport:{width:innerWidth,height:innerHeight},scope:'visible rAF render callbacks; CPU submission time is not CPU utilization or GPU completion'};
        obj.frameSample=sample;if(meter)meter.textContent=JSON.stringify(sample);
      }
      obj.raf=requestAnimationFrame(tick);
    };R[stage].raf=requestAnimationFrame(tick)}
  }
  async function sampleFrames(stage){
    const obj=R[stage],meter=$('#v031S8'+stage.toUpperCase()+'Telemetry');
    if(!obj||obj.disposed)throw Error('Render a 3D view first');
    if(obj.raf){cancelAnimationFrame(obj.raf);obj.raf=0;}
    const rotate=$('#v031S8'+stage.toUpperCase()+'Rotate');if(rotate)rotate.checked=false;
    meter.textContent='Sampling 180 stationary rendered frames; reduced-motion preference preserved.';
    const intervals=[],costs=[];let last=null,start=performance.now();
    await new Promise(resolve=>{
      function frame(t){
        if(obj.disposed||R[stage]!==obj||document.visibilityState!=='visible'||performance.now()-start>15000){meter.textContent='Frame sample interrupted; no performance certification.';resolve();return;}
        const c=$('#v031S8'+stage.toUpperCase()+'Canvas');if(!c?.getClientRects().length){meter.textContent='Frame sample interrupted: view hidden.';resolve();return;}
        if(last!==null)intervals.push(t-last);last=t;
        const before=performance.now();obj.redraw();costs.push(performance.now()-before);
        if(intervals.length<180){requestAnimationFrame(frame);return;}
        const sorted=[...intervals].sort((a,b)=>a-b);
        const sample={frames:180,stationary:true,fps:Number((180000/intervals.reduce((a,b)=>a+b,0)).toFixed(2)),frameMsP95:Number(sorted[171].toFixed(2)),renderSubmitMsMean:Number((costs.reduce((a,b)=>a+b,0)/costs.length).toFixed(3)),viewport:{width:innerWidth,height:innerHeight,devicePixelRatio:window.devicePixelRatio||1,canvas:JSON.parse($('#v031S8'+stage.toUpperCase()+'Canvas').dataset.viewport||'{}')},scope:'visible stationary rAF render callbacks; not CPU utilization, GPU completion, or target-device acceptance'};
        obj.frameSample=sample;meter.textContent=JSON.stringify(sample);log('3D frame sample '+stage+': '+JSON.stringify(sample));resolve();
      }
      requestAnimationFrame(frame);
    });
  }
  function setup3D(){
    for(const stage of['s5','s6','s7']){
      const selector=$('#v031S8'+stage.toUpperCase()+'Mode');if(!selector)continue;
      selector.innerHTML=Object.entries(modes[stage]).map(([value,name])=>'<option value="'+ESC(value)+'">'+ESC(name)+'</option>').join('');
      if(stage==='s7')selector.value='zeta';
      const canvas=$('#v031S8'+stage.toUpperCase()+'Canvas');
      if(canvas&&!$('#v031S8'+stage.toUpperCase()+'Telemetry')){const meter=document.createElement('output');meter.id='v031S8'+stage.toUpperCase()+'Telemetry';meter.className='s8-telemetry';meter.setAttribute('aria-label','3D performance sample');canvas.after(meter);}
      const button=$('#v031S8'+stage.toUpperCase()+'Draw');
      button?.addEventListener('click',()=>{if(stage==='s7'&&mode(stage)==='zeta'&&zetaCache?.warning&&!pendingZeta)zetaCache=null;return render(stage).catch(e=>{status(stage,'ERROR',true);log(stage+' 3D error: '+e.message)});});
      if(button){const measure=document.createElement('button');measure.id='v031S8'+stage.toUpperCase()+'Frames';measure.type='button';measure.textContent='Measure 3D frames';measure.addEventListener('click',()=>sampleFrames(stage).catch(e=>log('Frame sample: '+e.message)));button.after(measure);}
      if(button&&!$('#v031S8'+stage.toUpperCase()+'LOD')){
        const wrap=document.createElement('div');wrap.className='s8-controls';
        const label=document.createElement('label');label.textContent='Mesh detail ';const lod=document.createElement('select');lod.id='v031S8'+stage.toUpperCase()+'LOD';lod.setAttribute('aria-label','3D mesh detail');
        lod.innerHTML='<option value="full">Full sampled mesh</option><option value="compact">Compact mesh (stride 2)</option>';label.append(lod);wrap.append(label);
        lod.addEventListener('change',()=>render(stage).catch(e=>log('LOD: '+e.message)));
        for(const [title,key] of [['Rotate left','ArrowLeft'],['Rotate right','ArrowRight'],['Rotate up','ArrowUp'],['Rotate down','ArrowDown'],['Zoom in','+'],['Zoom out','-'],['Reset camera','Home']]){
          const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=title;b.addEventListener('click',()=>canvas?.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})));wrap.append(b);
        }
        button.parentElement.after(wrap);
        if(stage==='s7'){const cancel=document.createElement('button');cancel.type='button';cancel.className='btn';cancel.textContent='Cancel zeta sampling / request';cancel.addEventListener('click',cancelSampling);wrap.append(cancel);}
      }
      $('#v031S8'+stage.toUpperCase()+'Rotate')?.addEventListener('change',()=>render(stage).catch(()=>{}));
      selector.addEventListener('change',()=>render(stage).catch(e=>log('3D switch error: '+e.message)));
    }
    for(const [stage,nav] of [['s5','stage5-research'],['s6','stage6-index'],['s7','stage7-advanced']]){
      $$('[data-view-target="'+nav+'"]').forEach(el=>el.addEventListener('click',()=>{
        setTimeout(()=>render(stage).catch(e=>log(e.message)),260);
      }));
    }
    if(location.hash==='#stage8')setTimeout(()=>document.querySelector('[data-view-target="stage8-hardening"]')?.click(),380);
  }
  async function digest(bytes){
    const b=await crypto.subtle.digest('SHA-256',bytes);
    return[...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  const crcTable=(()=>{const arr=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;arr[n]=c>>>0}return arr})();
  function crc32(data){let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
  function u16(v){const a=new Uint8Array(2);new DataView(a.buffer).setUint16(0,v,true);return a}
  function u32(v){const a=new Uint8Array(4);new DataView(a.buffer).setUint32(0,v>>>0,true);return a}
  function join(parts){const n=parts.reduce((s,x)=>s+x.length,0),all=new Uint8Array(n);let i=0;for(const p of parts){all.set(p,i);i+=p.length}return all}
  function pack(files){
    const local=[],central=[];let offset=0;
    const names=Object.keys(files).sort();
    if(names.length>80)throw Error('file count exceeds 80');
    for(const name of names){
      if(!/^[A-Za-z0-9._/-]+$/.test(name)||name.includes('..')||name.startsWith('/'))throw Error('unsafe bundle filename');
      const nam=encoder.encode(name),bytes=typeof files[name]==='string'?encoder.encode(files[name]):files[name],crc=crc32(bytes),flags=0x800;
      const head=join([u32(0x04034b50),u16(20),u16(flags),u16(0),u16(0),u16(0),u32(crc),u32(bytes.length),u32(bytes.length),u16(nam.length),u16(0),nam]);
      local.push(head,bytes);
      central.push(join([u32(0x02014b50),u16(20),u16(20),u16(flags),u16(0),u16(0),u16(0),u32(crc),u32(bytes.length),u32(bytes.length),u16(nam.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nam]));
      offset+=head.length+bytes.length;
    }
    const cdata=join(central),end=join([u32(0x06054b50),u16(0),u16(0),u16(names.length),u16(names.length),u32(cdata.length),u32(offset),u16(0)]);
    return join([...local,cdata,end]);
  }
  function unpack(zip){
    const a=zip instanceof Uint8Array?zip:new Uint8Array(zip);
    if(a.length>12*1024*1024)throw Error('bundle exceeds 12 MiB');
    if(a.length<22)throw Error('not a valid .mathscope ZIP');
    const dv=new DataView(a.buffer,a.byteOffset,a.byteLength);
    let end=-1;
    for(let i=a.length-22;i>=Math.max(0,a.length-65557);i--){
      if(dv.getUint32(i,true)===0x06054b50&&i+22+dv.getUint16(i+20,true)===a.length){end=i;break}
    }
    if(end<0)throw Error('not a valid .mathscope ZIP');
    const count=dv.getUint16(end+10,true),dirStart=dv.getUint32(end+16,true),dirSize=dv.getUint32(end+12,true);
    if(dv.getUint16(end+4,true)!==0||dv.getUint16(end+6,true)!==0||dv.getUint16(end+8,true)!==count)throw Error('multi-disk ZIP not supported');
    if(count<1||count>80||dirStart+dirSize!==end)throw Error('bundle directory invalid');
    let off=dirStart;const files=Object.create(null),ranges=[];
    for(let k=0;k<count;k++){
      if(off+46>end||dv.getUint32(off,true)!==0x02014b50)throw Error('invalid ZIP central entry');
      const flags=dv.getUint16(off+8,true),method=dv.getUint16(off+10,true);
      if(method!==0||(flags&~0x800)!==0)throw Error('compressed/encrypted/descriptor ZIP entries not supported');
      const crc=dv.getUint32(off+16,true),size=dv.getUint32(off+20,true),comp=dv.getUint32(off+24,true),len=dv.getUint16(off+28,true),ex=dv.getUint16(off+30,true),co=dv.getUint16(off+32,true),localOffset=dv.getUint32(off+42,true);
      const next=off+46+len+ex+co;
      if(next>end||dv.getUint16(off+34,true)!==0)throw Error('ZIP directory entry out of bounds');
      const name=decoder.decode(a.slice(off+46,off+46+len));
      if(!/^[A-Za-z0-9._/-]+$/.test(name)||name.includes('..')||name.startsWith('/')||Object.hasOwn(files,name))throw Error('unsafe or duplicate ZIP path');
      if(size!==comp||size>7*1024*1024)throw Error('invalid ZIP size');
      if(localOffset+30>dirStart||dv.getUint32(localOffset,true)!==0x04034b50)throw Error('local ZIP header missing');
      const localLen=dv.getUint16(localOffset+26,true),localExtra=dv.getUint16(localOffset+28,true);
      const contentStart=localOffset+30+localLen+localExtra,contentEnd=contentStart+size;
      if(contentStart>dirStart||contentEnd>dirStart)throw Error('ZIP content out of bounds');
      const localName=decoder.decode(a.slice(localOffset+30,localOffset+30+localLen));
      if(localName!==name||dv.getUint16(localOffset+6,true)!==flags||dv.getUint16(localOffset+8,true)!==method||dv.getUint32(localOffset+14,true)!==crc||dv.getUint32(localOffset+18,true)!==size||dv.getUint32(localOffset+22,true)!==comp)throw Error('local/central ZIP metadata mismatch');
      if(ranges.some(([start,end])=>localOffset<end&&contentEnd>start))throw Error('overlapping ZIP entries');
      ranges.push([localOffset,contentEnd]);
      const content=a.slice(contentStart,contentEnd);
      if(crc32(content)!==crc)throw Error('CRC mismatch for '+name);
      files[name]=content;off=next;
    }
    if(off!==end)throw Error('ZIP directory size mismatch');
    return files;
  }
  async function buildBundle(){
    const f=window.MathScopeV031Foundation,s=f?.getSession?.();
    if(!s||f.validateSession(s).length)throw Error('current session schema invalid; run Stage1 validation');
    const groups={objects:'objects',representations:'representations',operators:'operators',
      pdes:'pde',spectra:'spectra',geometries:'geometry',topologies:'topology',
      kclasses:'ktheory',claims:'claims',evidence:'evidence',
      symmetries:'symmetry',functionSpaces:'function-spaces',entropies:'entropy'};
    const files={'session.json':JSON.stringify(s,null,2),
      'environment.lock':JSON.stringify({version:VERSION,sessionSchema:s.schema,foundationVersion:f.version,
        exportedAt:now(),computeService:SERVICE,proofEnvironment:s.environmentRef||null,
        cloudLSP:'EXPERIMENTAL / INFRA HOLD; never formal certificate',verifyAfterImport:true},null,2),
      'views/stage8-3d.json':JSON.stringify({stage5:results.s5?.representation||null,
        stage6:results.s6?.representation||null,stage7:results.s7?.representation||null},null,2),
      'failures/all.json':JSON.stringify({schema:'MathScopeFailureLog/1',records:s.failureRecords||[],mathematicalAuthority:false},null,2),
      'logs/README.txt':'MathScope Bundle: images are optional; no screenshot is proof. Imported evidence is REPLAY REQUIRED.',
      'lean/coverage.json':JSON.stringify({embeddedLeanSourceAvailable:false,formalEvidence:s.evidence.filter(e=>e.grade==='FORMAL PASS').map(e=>({id:e.id,claimRef:e.claimRef,environmentHash:e.environmentHash,inputsHash:e.inputsHash})),replayRequired:true},null,2),
      'numerics/jobs.json':JSON.stringify(s.evidence.filter(e=>e.grade!=='FORMAL PASS').map(e=>({id:e.id,method:e.method,inputsHash:e.inputsHash,environmentHash:e.environmentHash,residuals:e.residuals,errorBounds:e.errorBounds})),null,2),
      'screenshots/README.txt':'Screenshots are optional display artifacts, never evidence of exact mathematical proof.'};
    for(const [key,folder] of Object.entries(groups))files[folder+'/all.json']=JSON.stringify(s[key]||[],null,2);
    if(window.MathScopeGolden?.bundleFiles)Object.assign(files,await window.MathScopeGolden.bundleFiles(s));
    const entries=[];
    for(const [name,content] of Object.entries(files)){const bytes=encoder.encode(content);entries.push({path:name,size:bytes.length,sha256:await digest(bytes)})}
    const manifest={format:'MathScopeBundleZIP/0.3.1',schema:s.schema,revision:s.sessionRevision,
      sourceSessionId:s.id,createdAt:now(),files:entries,hashIsAuthenticityProof:false,requiresReplay:true,
      trustPolicy:'No numerical/theorem/formal elevation on import; environment compatibility must be rechecked'};
    files['manifest.json']=JSON.stringify(manifest,null,2);
    return pack(files);
  }
  async function verifyBundle(zip){
    const files=unpack(zip);
    if(!files['manifest.json']||!files['session.json']||!files['environment.lock'])throw Error('mandatory bundle files missing');
    const man=JSON.parse(decoder.decode(files['manifest.json']));
    if(man.format!=='MathScopeBundleZIP/0.3.1'||man.schema!==window.MathScopeV031Foundation?.schema)throw Error('incompatible bundle schema; migration not available');
    if(!Array.isArray(man.files)||man.files.length<5||man.files.length>79)throw Error('bundle manifest entry count invalid');
    const seen=new Set();
    for(const row of man.files){
      if(seen.has(row.path)||!files[row.path])throw Error('missing/duplicate manifest entry '+row.path);
      seen.add(row.path);
      if(files[row.path].length!==row.size||await digest(files[row.path])!==row.sha256)throw Error('SHA-256 mismatch: '+row.path);
    }
    if(Object.keys(files).length!==seen.size+1)throw Error('undeclared entry in bundle');
    const s=JSON.parse(decoder.decode(files['session.json'])),errors=window.MathScopeV031Foundation.validateSession(s);
    if(errors.length)throw Error('invalid imported ResearchSession: '+errors.slice(0,6).join(' | '));
    if(man.sourceSessionId!==s.id||man.revision!==s.sessionRevision||man.schema!==s.schema)throw Error('manifest session identity/revision mismatch');
    if(!seen.has('session.json')||!seen.has('environment.lock'))throw Error('mandatory paths must be checksummed');
    const env=JSON.parse(decoder.decode(files['environment.lock']));
    if(env.sessionSchema!==s.schema)throw Error('environment lock mismatch');
    if(s.failureRecords?.length&&!files['failures/all.json'])throw Error('Failure history file missing');
    if(files['failures/all.json']){const failureLog=JSON.parse(decoder.decode(files['failures/all.json']));if(failureLog.schema!=='MathScopeFailureLog/1'||failureLog.mathematicalAuthority!==false||JSON.stringify(failureLog.records)!==JSON.stringify(s.failureRecords||[]))throw Error('Failure history differs from session');}
    await window.MathScopeGolden?.validateBundleFiles?.(files,s);
    return{manifest:man,session:s,environment:env,status:'HASH VALID / AUTHENTICITY NOT VERIFIED / EVIDENCE REPLAY REQUIRED'};
  }
  function download(bytes,name,mime){
    const blob=new Blob([bytes],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  async function exportBundle(){
    const bytes=await buildBundle();const verified=await verifyBundle(bytes);
    lastBundleBytes=bytes;download(bytes,'MathScope-'+verified.session.id+'.mathscope','application/zip');
    const s=$('#v031S8BundleStatus');if(s)s.textContent='EXPORT PASS · '+bytes.length+' bytes · '+verified.manifest.files.length+' checksummed paths';log('Bundle export/roundtrip hash verified');
    return verified;
  }
  async function importBundle(file){
    if(!file)throw Error('No .mathscope file selected');
    if(file.size>12*1024*1024)throw Error('bundle larger than 12 MiB');
    const payload=new Uint8Array(await file.arrayBuffer()),report=await verifyBundle(payload);
    const dest=$('#v031S8BundleStatus');if(dest)dest.textContent=report.status+' · source '+report.session.id;
    if(!confirm('검증된 .mathscope 번들을 새 ResearchSession으로 가져옵니다. 기존 session은 보존되지만, 과거 증거는 REPLAY REQUIRED로 표시됩니다. 계속할까요?'))return report;
    const imported=window.MathScopeV031Foundation.importVerifiedBundleSession(report.session);
    window.MathScopeGolden?.onImport?.(report,imported);
    log('Imported session '+imported.id+' with historical/awaiting-replay evidence');return report;
  }
  async function benchmark(){
    const result=await runSamplingWorker('cpu');lastBench={...result,execution:'dedicated Web Worker',exactTimer:'worker performance.now',budgetNote:'320 finite Euler-eta samples; elapsed compute time, not CPU utilization or 3D FPS'};
    $('#v031S8BenchResult').textContent=JSON.stringify(lastBench,null,2);log('CPU sampling benchmark completed in worker without extrapolating FPS');return lastBench;
  }
  async function regression(){
    const checks=[];
    const test=(name,pass,scope)=>checks.push({name,status:pass===true?'PASS':pass===false?'FAIL':'HOLD',scope});
    const foundation=window.MathScopeV031Foundation;
    const s=foundation?.getSession?.();
    test('Stage1 ResearchSession schema',!!s&&foundation.validateSession(s).length===0,'session typing');
    const stage2=await window.MathScopeV031AnalyticSlice?.runSelfTests?.();
    test('Stage2 finite vs infinite',stage2?.pass??null,'10 executed finite PDE, convergence, typing and trust checks');
    const stage3=window.MathScopeV031Stage3?.runAcceptance?.();
    test('Stage3 A1–A6 semantic gate',stage3?.pass??null,'Executed operator/PDE/spectrum/nonlinear/reproducibility reference checks; general PDE formalization is outside this gate');
    const stage4=window.MathScopeV031Stage4?.runGate?.();
    test('Stage4 B1–B6 semantic gate',stage4?.pass??null,'Executed projection, singularity, fidelity, lifting, entropy and topology-boundary checks');
    test('Stage4 computed B7 topology',stage4?.b7Pass??null,'Requires actual finite topology computation in this page session');
    const stage5=window.MathScopeV031Stage5?.runGate?.();
    test('Stage5 C1/C2/C3/C6 semantic checks',stage5?.pass??null,'Executed graph, stress, AI and verifier separation checks; C4/C5 use the Stage7 symmetry/zeta guard');
    test('Stage6 D semantic checks',window.MathScopeV031Stage6?.runGate?.()?.pass===true?true:null,'symbol, K-class, index, boundary, nonlinear');
    test('Stage7 Advanced guards',window.MathScopeV031Stage7?.runGate?.()?.pass===true?true:null,'Galois, zeta, flow, equivariant, Ricci');
    test('No visual->formal promotion',results.s5?.representation?.proofCertification===true?false:results.s5?.representation?.proofCertification===false?true:null,'record 3D ResearchGraph view');
    test('Zeta identity guard',zetaCache?.data?zetaCache.data.riemannZetaEqualsSpectralZeta===false:null,'complex zeta distinct from finite spectral zeta');
    try{const report=await verifyBundle(await buildBundle());test('MathScope ZIP roundtrip and SHA',report.manifest.files.length>=5,'session+environment+views+typed data paths')}
    catch(e){test('MathScope ZIP roundtrip and SHA',false,e.message)}
    const golden=window.MathScopeGolden?.status?.();
    test('Golden A→B→C→D nonlinear elliptic integration',golden?.current?golden.pass:null,'one nonlinear operator, linked session/revisions/evidence');
    test('Executable numerical + environment replay',golden?.replay?.pass===true?true:null,'rerun stored adapter inputs; imported proof remains historical');
    test('Independent Golden Lean proof replay',golden?.proofReplay?.kind==='FRESH_PROOF_REPLAY'?golden.proofReplay.pass:null,'Fresh compiler process, exact audited local algebra source, environment and proof hash; not a full PDE theorem');
    test('DOM accessibility smoke',verifyAccessibility().pass,'Labels only; independent native assistive-technology acceptance still required');
    test('Dedicated Worker CPU benchmark',lastBench?.execution==='dedicated Web Worker'&&lastBench?.valid===lastBench?.samples?true:null,'Measured compute time, not CPU utilization');
    test('Native browser E2E / accessibility',null,'Independent Edge/Chrome keyboard, screen-reader and responsive audit evidence must be reviewed before release');
    test('60fps 3D target',null,'Review measured frame times and target-device environment; a single embedded-browser sample does not certify all devices');
    const pass=checks.filter(c=>c.status==='PASS').length,fail=checks.filter(c=>c.status==='FAIL').length,hold=checks.filter(c=>c.status==='HOLD').length;
    currentGate={pass:fail===0&&hold===0,checks,passed:pass,failed:fail,held:hold,release:'HOLD'};
    $('#v031S8GateSummary').textContent='STAGE 8 RELEASE HOLD · '+pass+' PASS / '+fail+' FAIL / '+hold+' HOLD';
    $('#v031S8Gates').innerHTML=checks.map(c=>'<div class="s8-gate '+c.status.toLowerCase()+'"><b>'+ESC(c.status)+' · '+ESC(c.name)+'</b><small>'+ESC(c.scope)+'</small></div>').join('');
    log('Stage8 nonmutating semantic checks completed: '+pass+' PASS, '+fail+' FAIL, '+hold+' HOLD');
    return currentGate;
  }
  function verifyAccessibility(){
    const out=[];
    for(const stage of['s5','s6','s7']){
      const canvas=$('#v031S8'+stage.toUpperCase()+'Canvas');
      const selector=$('#v031S8'+stage.toUpperCase()+'Mode');
      out.push({stage,canvasAria:!!canvas?.getAttribute('aria-label'),selectorLabel:!!(selector?.labels?.length||selector?.getAttribute('aria-label')?.trim()||selector?.getAttribute('aria-labelledby')?.split(/\s+/).some(id=>document.getElementById(id)?.textContent.trim()))});
    }
    const noError=out.every(x=>x.canvasAria&&x.selectorLabel);
    const r={domChecks:out,pass:noError,scope:'DOM label smoke only; not native screen-reader audit'};
    $('#v031S8Accessibility').textContent=JSON.stringify(r,null,2);return r;
  }
  function registerMcp(){
    const mc=document.modelContext;if(!mc?.registerTool)return;
    const safe=d=>{try{mc.registerTool(d,{signal:new AbortController().signal})}catch{}};
    safe({name:'mathscope.stage8.hardening_status',description:'Read Stage8 3D metadata, bundle/benchmark/gate state without mutation or evidence promotion.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:async()=>({version:VERSION,currentGate,bench:lastBench,frameSamples:Object.fromEntries(Object.entries(R).filter(([,v])=>v?.frameSample).map(([k,v])=>[k,v.frameSample])),views:results,jobs:window.MathScopeJobs.getHistory(),trust:pinnedWarnings})});
    safe({name:'mathscope.stage8.validate_current_session',description:'Run Stage8 non-mutating checks including in-memory ZIP SHA-256 roundtrip (no download).',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:async()=>regression()});
    safe({name:'mathscope.stage8.zeta3d_summary',description:'Read numerical-only complex zeta 3D surface summary and guards; computes the reference grid if absent.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:async()=>{const p=await cloudZeta();return{source:p.source,warning:p.warning||null,grid:p.data.grid,maskedCount:p.data.maskedCount,zeroCertification:p.data.zeroCertification,riemannZetaEqualsSpectralZeta:false}}});
  }
  function init(){
    if(!$('#v031Stage8Hardening'))return;
    setup3D();
    $('#v031S8Export')?.addEventListener('click',()=>exportBundle().catch(e=>log('Export failure: '+e.message)));
    $('#v031S8Import')?.addEventListener('change',e=>importBundle(e.target.files?.[0]).catch(err=>{log('Import rejected: '+err.message);$('#v031S8BundleStatus').textContent='IMPORT REJECTED · '+err.message}));
    $('#v031S8Run')?.addEventListener('click',()=>regression().catch(e=>log('Gate error: '+e.message)));
    $('#v031S8Benchmark')?.addEventListener('click',()=>benchmark().catch(e=>log('Bench error: '+e.message)));
    const cancelCPU=document.createElement('button');cancelCPU.type='button';cancelCPU.textContent='Cancel sampling / request';cancelCPU.addEventListener('click',cancelSampling);$('#v031S8Benchmark')?.after(cancelCPU);
    $('#v031S8Access')?.addEventListener('click',verifyAccessibility);
    $('#v031S8OpenZeta')?.addEventListener('click',()=>document.querySelector('[data-view-target="stage7-advanced"]')?.click());
    registerMcp();
    window.MathScopeV031Stage8={version:VERSION,render,regression,benchmark,buildBundle,verifyBundle,pack,unpack,localZetaGrid,complexEuler,runSamplingWorker,cancelSampling,sampleFrames,getGate:()=>currentGate,getView:stage=>results[stage],getZeta:()=>zetaCache,getBundleBytes:()=>lastBundleBytes};
    document.title='MathScope v0.3.1 — M1 / M2 Research IDE';
    log('Stage8 module loaded · private local bundle work only · release HOLD until native QA + golden replay');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});
  else setTimeout(init,0);
})();
