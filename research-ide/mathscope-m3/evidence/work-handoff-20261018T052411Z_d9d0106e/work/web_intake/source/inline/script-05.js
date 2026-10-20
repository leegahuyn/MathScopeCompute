
(() => {
  'use strict';
  const VERSION='0.3.1-stage2.1';
  const one=s=>document.querySelector(s);
  const now=()=>new Date().toISOString();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let lastRun=null;
  let tests=[];
  const PI=Math.PI;

  function revNext(collection,id){
    const s=window.MathScopeV031Foundation?.getSession?.();
    const found=(s?.[collection]||[]).find(x=>x.id===id);
    const m=String(found?.revision||'').match(/:r(\d+)$/);
    return id+':r'+(m?(Number(m[1])+1):1);
  }
  async function sha(value){
    try{
      const d=new TextEncoder().encode(JSON.stringify(value));
      const b=await crypto.subtle.digest('SHA-256',d);
      return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
    }catch{return 'hash-unavailable';}
  }
  function lambdaH(n,p,q){
    const h=1/(n+1);
    return 4/(h*h)*(Math.sin(p*PI*h/2)**2+Math.sin(q*PI*h/2)**2);
  }
  function lambdaExact(p,q){return PI*PI*(p*p+q*q);}
  function gridIndex(n,i,j){return i*(n+2)+j;}
  function solve(n){
    n=Math.max(6,Math.min(40,Math.round(Number(n)||16)));
    const h=1/(n+1), size=(n+2)*(n+2), u=new Float64Array(size), exact=new Float64Array(size);
    const lam=lambdaH(n,1,1), cont=2*PI*PI, scale=cont/lam;
    for(let i=0;i<=n+1;i++){
      const x=i*h;
      for(let j=0;j<=n+1;j++){
        const y=j*h, base=Math.sin(PI*x)*Math.sin(PI*y);
        exact[gridIndex(n,i,j)]=base;
        u[gridIndex(n,i,j)]=(i===0||j===0||i===n+1||j===n+1)?0:scale*base;
      }
    }
    let maxResidual=0,maxError=0,maxU=0;
    for(let i=1;i<=n;i++)for(let j=1;j<=n;j++){
      const k=gridIndex(n,i,j),x=i*h,y=j*h;
      const Au=(4*u[k]-u[gridIndex(n,i-1,j)]-u[gridIndex(n,i+1,j)]-u[gridIndex(n,i,j-1)]-u[gridIndex(n,i,j+1)])/(h*h);
      const f=cont*Math.sin(PI*x)*Math.sin(PI*y);
      maxResidual=Math.max(maxResidual,Math.abs(Au-f));
      maxError=Math.max(maxError,Math.abs(u[k]-exact[k]));
      maxU=Math.max(maxU,Math.abs(u[k]));
    }
    const modes=[];
    for(let p=1;p<=Math.min(n,6);p++)for(let q=1;q<=Math.min(n,6);q++){
      const lh=lambdaH(n,p,q),le=lambdaExact(p,q);
      modes.push({p,q,lambda:lh,continuum:le,relError:Math.abs(lh-le)/le});
    }
    modes.sort((a,b)=>a.lambda-b.lambda);
    return {n,h,u,exact,lambda1:lam,lambda1Continuum:cont,lambdaRatio:lam/cont,maxResidual,maxError,maxU,modes:modes.slice(0,12)};
  }
  function validatePDE(p){
    const req=['id','equation','classification','manifoldOrDomainRef','functionSpaceRef','coefficients','parameters','boundaryConditions','nonlinear','solverPlan','evidencePolicy','revision'];
    return req.filter(k=>!(k in (p||{}))).map(k=>'PDESpec.'+k+' missing');
  }
  function validateOperator(o){
    const e=[]; if(!o?.id)e.push('OperatorSpec.id missing'); if(!o?.T)e.push('operator T missing');
    if(!o?.domain)e.push('domain D(T) missing'); if(!o?.codomain)e.push('codomain missing');
    if(o?.bounded===false&&!o?.domain)e.push('unbounded operator requires domain');
    if(o?.symmetric===true&&o?.selfAdjoint==null)e.push('symmetric must not auto-promote: selfAdjoint status required');
    if(!('adjointDomain' in (o||{})))e.push('adjoint domain missing');
    return e;
  }
  function validateSpectrum(s){
    const e=[]; if(!s?.id)e.push('SpectrumSpec.id missing'); if(s?.mode!=='finiteApprox')e.push('Stage2 spectrum must be finiteApprox');
    if(!Number.isFinite(s?.truncationN))e.push('truncation N missing');
    if(!Array.isArray(s?.pointSpectrum))e.push('point spectrum missing');
    if(s?.exactInfinite===true)e.push('finite approximation mislabeled exact infinite');
    return e;
  }
  function buildSpecs(sol){
    const n=sol.n, objectId='obj-poisson-field', pdeId='pde-poisson-unit-square', opId='op-dirichlet-laplacian', spId='spectrum-dirichlet-laplacian-fd', repId='rep-poisson-field-3d', claimId='claim-stage2-discrete-solve';
    const objectRevision=revNext('objects',objectId),pdeRevision=revNext('pdes',pdeId),opRevision=revNext('operators',opId),spRevision=revNext('spectra',spId),repRevision=revNext('representations',repId),claimRevision=revNext('claims',claimId);
    const fieldObject={id:objectId,type:'ScalarField',baseField:'R',intrinsicDim:2,ambientDim:3,structures:['finite-difference-grid','Dirichlet-boundary','scalar-field'],domainRef:'Omega=(0,1)^2',revision:objectRevision,parentRevision:null,assumptions:['uniform Cartesian grid','boundary values zero'],provenance:{source:'Stage2 manufactured Poisson vertical slice',capturedAt:now(),gridN:n},hash:'pending'};
    const pde={id:pdeId,equation:'-Delta u = 2*pi^2*sin(pi*x)*sin(pi*y)',classification:'linear elliptic',manifoldOrDomainRef:'Omega=(0,1)^2',functionSpaceRef:'H^1_0(Omega)',coefficients:{diffusion:1},parameters:{gridN:n,h:sol.h},boundaryConditions:[{type:'Dirichlet',boundary:'partial Omega',value:0}],initialData:null,nonlinear:false,linearizationRule:null,objectiveRef:null,solverPlan:{method:'five-point centered finite difference',gridN:n,unknowns:n*n,solve:'manufactured eigenmode direct scaling',tolerance:1e-10},evidencePolicy:{defaultGrade:'NUMERICAL INDICATOR',referenceSolution:'sin(pi*x)sin(pi*y)'},revision:pdeRevision,theoremAssumptions:['unit square','homogeneous Dirichlet boundary']};
    const operator={id:opId,T:'-Delta_D',domain:'H^2(Omega) ∩ H^1_0(Omega)',adjointDomain:'H^2(Omega) ∩ H^1_0(Omega)',codomain:'L^2(Omega)',baseField:'R',linear:true,bounded:false,denselyDefined:true,closed:true,closable:true,symmetric:true,selfAdjoint:true,normal:true,unitary:false,compact:false,compactResolvent:true,adjointRef:opId,norm:null,spectrumRef:spId,resolventRef:null,revision:opRevision,theoremAssumptions:['bounded smooth/Lipschitz benchmark domain','Dirichlet realization']};
    const spectrum={id:spId,operatorRef:opId,mode:'finiteApprox',pointSpectrum:sol.modes.map(m=>({p:m.p,q:m.q,value:m.lambda,multiplicity:'grid-mode'})),continuousSpectrum:{status:'NOT REPRESENTED BY FINITE MATRIX'},residualSpectrum:{status:'NOT REPRESENTED BY FINITE MATRIX'},resolvent:null,pseudospectrum:null,spectralRadius:lambdaH(n,n,n),truncationN:n*n,basis:'interior Cartesian grid / discrete sine modes',projection:'five-point finite-difference matrix A_N',convergenceSeries:[{N:n,lambda1:sol.lambda1,continuum:sol.lambda1Continuum,relError:Math.abs(sol.lambdaRatio-1)}],pollutionRisk:'NOT ASSESSED — FINITE APPROXIMATION',exactInfinite:false,revision:spRevision};
    const representation={id:repId,sourceObjectRef:objectId,method:'embedding',displayDim:3,mapDefinition:'(x,y) -> (x,y,u_h(x,y))',parameters:{gridN:n,h:sol.h,verticalQuantity:'u_h'},sampling:{mode:'uniform-grid',points:(n+2)*(n+2)},injectivityStatus:'INJECTIVE_AS_GRAPH_COORDINATES',ambiguityRef:null,fidelityVector:{fieldMaxError:sol.maxError,lambda1RelativeError:Math.abs(sol.lambdaRatio-1)},lostDimensions:[],discardedCoordinates:[],inverseStatus:'XY_PROJECTION_RECOVERS_GRID_COORDINATES',provenance:{source:'Stage2 Canvas2D projected graph',capturedAt:now()},revision:repRevision,parentRevision:null,stale:false,freshness:'CURRENT'};
    const claim={id:claimId,statement:'The reported u_h satisfies the finite-difference Dirichlet Poisson system to the stored discrete residual.',scope:'finite discrete system only',assumptions:['five-point stencil','uniform grid','Dirichlet boundary','finite N'],dependsOn:[pdeId,opId,spId,objectId],status:'SUPPORTED',freshness:'CURRENT',revision:claimRevision,parentRevision:null};
    return {fieldObject,pde,operator,spectrum,representation,claim};
  }
  async function bundleFor(sol){
    const s=buildSpecs(sol);
    s.fieldObject.hash=await sha({id:s.fieldObject.id,revision:s.fieldObject.revision,n:sol.n,maxError:sol.maxError});
    const inputsHash=await sha({pde:s.pde,operatorRevision:s.operator.revision,gridN:sol.n});
    const evidence={id:'ev-stage2-'+Date.now().toString(36),grade:'NUMERICAL INDICATOR',claimRef:s.claim.id,method:'five-point-finite-difference / manufactured-mode',inputsHash,environmentHash:'browser-js/'+VERSION,residuals:{maxDiscreteResidual:sol.maxResidual,maxGridError:sol.maxError,lambda1RelativeError:Math.abs(sol.lambdaRatio-1)},errorBounds:null,assumptions:['finite grid','floating-point arithmetic','continuum exact solution used for benchmark error only'],generatedAt:now(),adapterVersion:VERSION,upstreamRevisions:[s.fieldObject.revision,s.pde.revision,s.operator.revision,s.spectrum.revision,s.representation.revision,s.claim.revision],freshness:'CURRENT',supportsCurrent:true,stale:false};
    return {bundleId:'stage2-poisson-vertical-slice',objects:[s.fieldObject],pdes:[s.pde],operators:[s.operator],spectra:[s.spectrum],representations:[s.representation],claims:[s.claim],evidence:[evidence],specs:s,evidenceRecord:evidence};
  }
  function projectPoint(x,y,z,maxU,w,h){
    const cx=w*.5,cy=h*.69,s=260,sy=112,zs=150/(maxU||1);
    return [cx+(x-y)*s,cy+(x+y-1)*sy-z*zs];
  }
  function draw(sol){
    const c=one('#v031PdeFieldCanvas'); if(!c)return;
    const ctx=c.getContext?.('2d'); if(!ctx){c.dataset.renderStatus='NO_CANVAS_CONTEXT';return;}
    const rect=c.getBoundingClientRect?.()||{width:c.width,height:c.height};
    const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(480,Math.round(rect.width||900)),h=390;
    c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const n=sol.n,step=Math.max(1,Math.ceil(n/18));
    ctx.lineWidth=1;
    function line(points,alpha){
      if(!points.length)return;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
      for(let k=1;k<points.length;k++)ctx.lineTo(points[k][0],points[k][1]);
      ctx.strokeStyle='rgba(124,233,225,'+alpha+')';ctx.stroke();
    }
    for(let i=0;i<=n+1;i+=step){
      const pts=[];for(let j=0;j<=n+1;j++){const x=i/(n+1),y=j/(n+1),z=sol.u[gridIndex(n,i,j)];pts.push(projectPoint(x,y,z,sol.maxU,w,h));}line(pts,.38);
    }
    for(let j=0;j<=n+1;j+=step){
      const pts=[];for(let i=0;i<=n+1;i++){const x=i/(n+1),y=j/(n+1),z=sol.u[gridIndex(n,i,j)];pts.push(projectPoint(x,y,z,sol.maxU,w,h));}line(pts,.62);
    }
    const o=projectPoint(0,0,0,sol.maxU,w,h),px=projectPoint(1,0,0,sol.maxU,w,h),py=projectPoint(0,1,0,sol.maxU,w,h),pz=projectPoint(0,0,sol.maxU,sol.maxU,w,h);
    ctx.lineWidth=1.5;ctx.strokeStyle='rgba(207,233,241,.7)';
    for(const p of [px,py,pz]){ctx.beginPath();ctx.moveTo(o[0],o[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();}
    ctx.fillStyle='rgba(207,233,241,.8)';ctx.font='12px sans-serif';ctx.fillText('x',px[0]+5,px[1]);ctx.fillText('y',py[0]-12,py[1]);ctx.fillText('u_h',pz[0]+6,pz[1]-3);
    c.dataset.renderStatus='PASS';
  }
  function fmt(x,d=3){if(!Number.isFinite(x))return '—';if(Math.abs(x)<1e-3&&x!==0)return x.toExponential(2);return x.toFixed(d);}
  function render(sol,bundle){
    lastRun={sol,bundle};
    one('#v031S2H').textContent=fmt(sol.h,5);
    one('#v031S2Residual').textContent=sol.maxResidual.toExponential(2);
    one('#v031S2Error').textContent=sol.maxError.toExponential(2);
    one('#v031S2Lambda').textContent=fmt(sol.lambdaRatio,6);
    one('#v031S2SpectrumRows').innerHTML=sol.modes.slice(0,10).map(m=>'<tr><td>('+m.p+','+m.q+')</td><td>'+fmt(m.lambda,4)+'</td><td>'+fmt(m.continuum,4)+'</td><td>'+m.relError.toExponential(2)+'</td></tr>').join('');
    const s=bundle.specs;
    const rows=[['PDESpec',s.pde.classification+' · '+s.pde.revision],['Equation',s.pde.equation],['Function space',s.pde.functionSpaceRef],['OperatorSpec',s.operator.T+' · domain '+s.operator.domain],['Operator guard','UNBOUNDED · DOMAIN DECLARED'],['SpectrumSpec','finiteApprox · N='+s.spectrum.truncationN],['Representation',s.representation.mapDefinition],['Evidence',bundle.evidenceRecord.grade]];
    one('#v031S2Spec').innerHTML=rows.map(r=>'<div class="k">'+esc(r[0])+'</div><div class="v">'+esc(r[1])+'</div>').join('');
    one('#v031S2Provenance').textContent=JSON.stringify({solver:s.pde.solverPlan,residuals:bundle.evidenceRecord.residuals,spectrum:{mode:s.spectrum.mode,truncationN:s.spectrum.truncationN,basis:s.spectrum.basis,pollutionRisk:s.spectrum.pollutionRisk},representation:{displayDim:s.representation.displayDim,injectivity:s.representation.injectivityStatus},environment:bundle.evidenceRecord.environmentHash},null,2);
    one('#v031S2RepBadge').textContent='RepresentationSpec · grid '+sol.n+'×'+sol.n;
    draw(sol);
  }
  async function run(commit){
    const n=Number(one('#v031S2GridN')?.value||16),sol=solve(n),bundle=await bundleFor(sol);
    render(sol,bundle);
    if(commit){
      const api=window.MathScopeV031Foundation;
      if(!api?.commitTypedBundle)throw new Error('Foundation commitTypedBundle API unavailable');
      api.commitTypedBundle(bundle,'Stage2 Poisson vertical slice N='+n);
      one('#v031S2Status').textContent='STAGE 2 COMMITTED';
      one('#v031S2Status').className='v031-pill pass';
    }else{
      one('#v031S2Status').textContent='STAGE 2 PREVIEW';
      one('#v031S2Status').className='v031-pill';
    }
    return {sol,bundle};
  }
  async function runTests(){
    const a=solve(8),b=solve(16),c=solve(32),pack=await bundleFor(b),s=pack.specs;
    const api=window.MathScopeV031Foundation;
    const guard=api?.canPromoteEvidence?.(pack.evidenceRecord,'THEOREM-BACKED',{sourceScope:'FINITE_APPROX',targetScope:'INFINITE_EXACT'});
    tests=[
      {name:'PDESpec typing',pass:validatePDE(s.pde).length===0,detail:validatePDE(s.pde).join(' | ')},
      {name:'Operator typing / domain',pass:validateOperator(s.operator).length===0&&s.operator.bounded===false&&!!s.operator.domain,detail:validateOperator(s.operator).join(' | ')},
      {name:'Finite SpectrumSpec typing',pass:validateSpectrum(s.spectrum).length===0&&s.spectrum.truncationN===b.n*b.n,detail:validateSpectrum(s.spectrum).join(' | ')},
      {name:'Discrete solver residual',pass:b.maxResidual<1e-9,detail:'||A_N u_h-f_h||∞='+b.maxResidual.toExponential(3)},
      {name:'Grid refinement improves field error',pass:c.maxError<b.maxError&&b.maxError<a.maxError,detail:'N8 '+a.maxError.toExponential(2)+' → N16 '+b.maxError.toExponential(2)+' → N32 '+c.maxError.toExponential(2)},
      {name:'λ1 convergence',pass:Math.abs(c.lambdaRatio-1)<Math.abs(b.lambdaRatio-1)&&Math.abs(b.lambdaRatio-1)<Math.abs(a.lambdaRatio-1),detail:'ratio N16='+b.lambdaRatio.toFixed(6)},
      {name:'3D RepresentationSpec metadata',pass:s.representation.displayDim===3&&s.representation.sourceObjectRef===s.fieldObject.id&&s.representation.method==='embedding',detail:s.representation.mapDefinition},
      {name:'Evidence remains numerical',pass:pack.evidenceRecord.grade==='NUMERICAL INDICATOR',detail:pack.evidenceRecord.grade},
      {name:'finite → infinite promotion blocked',pass:guard?.ok===false,detail:guard?.reason||'Foundation guard unavailable'},
      {name:'deterministic finite solve',pass:solve(16).maxError===b.maxError&&solve(16).lambda1===b.lambda1,detail:'same input → same scalar diagnostics'}
    ];
    const pass=tests.every(t=>t.pass);
    one('#v031S2Gate').textContent=pass?'PASS':'CHECK';
    one('#v031S2Gate').className='chip '+(pass?'ok':'warn');
    one('#v031S2Tests').innerHTML=tests.map(t=>'<div class="s2-test '+(t.pass?'pass':'fail')+'"><b>'+(t.pass?'✓ ':'✕ ')+esc(t.name)+'</b><small>'+esc(t.detail)+'</small></div>').join('');
    return {pass,tests:JSON.parse(JSON.stringify(tests))};
  }
  function init(){
    if(!one('#v031AnalyticSlice'))return;
    const slider=one('#v031S2GridN');
    slider?.addEventListener('input',()=>{one('#v031S2GridNValue').textContent=slider.value;});
    one('#v031S2Run')?.addEventListener('click',()=>run(true).catch(e=>{one('#v031S2Status').textContent='STAGE 2 ERROR';one('#v031S2Provenance').textContent=String(e?.stack||e);}));
    one('#v031S2Preview')?.addEventListener('click',()=>run(false));
    one('#v031S2SelfTest')?.addEventListener('click',()=>runTests());
    window.addEventListener('resize',()=>{if(lastRun)draw(lastRun.sol);});
    window.MathScopeV031AnalyticSlice={version:VERSION,solve,buildSpecs,validatePDE,validateOperator,validateSpectrum,run:()=>run(true),preview:()=>run(false),runSelfTests:runTests,getLastRun:()=>lastRun};
    run(false).then(runTests);
    if(location.hash==='#stage2')setTimeout(()=>document.querySelector('[data-view-target="analytic-slice"]')?.click(),420);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();
