(() => {
  'use strict';
  const VERSION='0.3.1-stage7.1';
  const SERVICE='https://mathscope-compute.onrender.com';
  const one=s=>document.querySelector(s);
  const all=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now=()=>new Date().toISOString();
  const state={galois:null,zeta:null,flow:null,equivariant:null,perturbation:null,ricci:null};
  let gate=null,lastCommitted=null;

  function rows(rs){return rs.map(r=>'<div class="k">'+esc(r[0])+'</div><div class="v">'+esc(r[1])+'</div>').join('')}
  function val(v){return v==null?'—':typeof v==='object'?JSON.stringify(v):String(v)}
  function num(sel,f){const n=Number(one(sel)?.value);return Number.isFinite(n)?n:f}
  function currentSession(){return window.MathScopeV031Foundation?.getSession?.()||{symmetries:[],spectra:[],operators:[],geometries:[],kclasses:[],claims:[],evidence:[],revisions:[]}}
  async function fetchJson(url,opts={},timeout=60000){
    const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),timeout);
    try{const r=await fetch(url,{...opts,signal:ctrl.signal,cache:'no-store'}),data=await r.json().catch(()=>({}));if(!r.ok){const error=new Error(typeof data?.detail==='string'?data.detail:(data?.error||('HTTP '+r.status)));error.httpStatus=r.status;throw error}return data}finally{clearTimeout(tm)}
  }
  function hashLite(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
  function localEnvelope(adapter,input,outputs,residuals={},assumptions=[]){
    const h='local-'+hashLite(JSON.stringify({adapter,input})),ev={id:'ev-'+adapter+'-'+h,grade:'NUMERICAL INDICATOR',claimRef:input.claimRef||('claim:'+adapter),method:'browser-local Stage7 reference fallback',inputsHash:h,environmentHash:'browser-local-stage7',residuals,errorBounds:null,assumptions,generatedAt:now(),adapterVersion:VERSION,upstreamRevisions:input.sourceRevisionRefs||[],stale:false,scope:'Stage7 local-first reference fallback'};
    return{adapter,adapterVersion:VERSION,status:'completed',outputRepresentations:outputs,evidenceRecords:[ev],diagnostics:[{level:'warning',code:'LOCAL_FALLBACK',message:'Cloud Stage7 adapter was unavailable; deterministic browser-local reference logic was used. No theorem/formal promotion is implied.'}],residuals,errorBounds:null,provenanceEdges:[],reproducibilityHash:h,environment:{app:'MathScopeBrowser',appVersion:VERSION},jobId:'browser-'+h,startedAt:now(),completedAt:now(),elapsedMs:0,logs:['local fallback']};
  }
  function localAdapter(adapter,input){
    if(adapter==='advanced.galois-reference.v1'){
      const p=input.preset||'quadratic_sqrt2';let coeffs,roots,field,degree,group,order,corr,status='THEOREM-MAPPED REFERENCE';
      if(p==='quadratic_sqrt2'){const r=Math.sqrt(2);coeffs=[1,0,-2];roots=[{re:r,im:0},{re:-r,im:0}];field='Q(sqrt(2))';degree=2;group='C2';order=2;corr=[{subgroup:'C2',fixedField:'Q',orderReversing:true},{subgroup:'{e}',fixedField:field,orderReversing:true}]}
      else if(p==='quadratic_i'){coeffs=[1,0,1];roots=[{re:0,im:1},{re:0,im:-1}];field='Q(i)';degree=2;group='C2';order=2;corr=[{subgroup:'C2',fixedField:'Q',orderReversing:true},{subgroup:'{e}',fixedField:field,orderReversing:true}]}
      else {const r=Math.cbrt(2),q=Math.sqrt(3)/2;coeffs=[1,0,0,-2];roots=[{re:r,im:0},{re:-r/2,im:r*q},{re:-r/2,im:-r*q}];field='Q(cuberoot(2), zeta_3)';degree=6;group='S3';order=6;corr=[{subgroup:'S3',fixedField:'Q',orderReversing:true},{subgroup:'A3',fixedField:'Q(sqrt(-3))',orderReversing:true},{subgroup:'<transposition>',fixedField:'a cubic subfield',orderReversing:true},{subgroup:'{e}',fixedField:field,orderReversing:true}]}
      const gid='group-stage7-'+p,gid2='galois-stage7-'+p,rid='rep-theory-stage7-'+p;
      return localEnvelope(adapter,input,[
        {id:gid,type:'GroupTheorySpec',group,order,generators:[],actionOn:'polynomial roots',visualResemblanceCreatesRelation:false,status},
        {id:gid2,type:'GaloisLabSpec',baseField:'Q',polynomialCoefficients:coeffs,roots,splittingField:field,extensionDegree:degree,galoisGroup:group,groupRef:gid,fieldTower:['Q',field],galoisCorrespondence:corr,correspondenceStatus:'EXPLICIT',theoremMapping:{reference:'Keith Conrad, The Galois Correspondence',applicability:'built-in finite Galois reference'},shapeResemblanceCreatesGaloisRelation:false,requiresExplicitFieldExtension:true,sourceRevisionRefs:input.sourceRevisionRefs||[]},
        {id:rid,type:'RepresentationTheorySpec',groupRef:gid,representation:'permutation action on roots',validity:'EXPLICIT REFERENCE',invariantSubspaces:'NOT COMPUTED',operatorCommutation:'NOT APPLICABLE',irreducibleDecomposition:'PLACEHOLDER / EXTERNAL'}
      ],{rootResidualMax:0},['explicit finite Galois reference only','visual similarity is not Galois evidence']);
    }
    if(adapter==='advanced.zeta-resolvent-reference.v1'){
      const s=Number(input.sReal||2),N=Math.max(16,Math.min(200000,Math.round(Number(input.terms||5000))));if(!(s>1))throw new Error('local zeta fallback requires real s>1');
      let partial=0;for(let n=1;n<=N;n++)partial+=n**(-s);const lo=(N+1)**(1-s)/(s-1),hi=N**(1-s)/(s-1),rv=partial+(lo+hi)/2,err=(hi-lo)/2;
      const eigs=Array.from({length:20},(_,i)=>(i+1)**2),sz=eigs.reduce((a,x)=>a+x**(-s),0),zeros=[14.134725141734694,21.022039638771555,25.01085758014569,30.424876125859513,32.93506158773919,37.586178158825675,40.918719012147495,43.327073280914999,48.005150881167159,49.773832477672302];
      const spacing=a=>a.slice(1).map((x,i)=>x-a[i]),corr=(a,b)=>{const m=Math.min(a.length,b.length);if(m<3)return null;const aa=a.slice(0,m),bb=b.slice(0,m),ma=aa.reduce((x,y)=>x+y,0)/m,mb=bb.reduce((x,y)=>x+y,0)/m,sa=Math.sqrt(aa.reduce((x,y)=>x+(y-ma)**2,0)/m),sb=Math.sqrt(bb.reduce((x,y)=>x+(y-mb)**2,0)/m);return aa.reduce((x,y,i)=>x+(y-ma)*(bb[i]-mb),0)/(m*sa*sb)};
      const c=corr(spacing(zeros),spacing(eigs.slice(0,10)));
      return localEnvelope(adapter,input,[
        {id:'riemann-zeta-stage7',type:'RiemannZetaSpec',definition:'zeta(s)=sum n^-s for Re(s)>1',s,approximation:rv,errorBound:err,terms:N,reference:'NIST DLMF §§25.2,25.10',zeroOrdinatesReferenceSample:zeros,status:'CERTIFIED BY ELEMENTARY TAIL BOUND IN Re(s)>1'},
        {id:'spectral-zeta-stage7',type:'SpectralZetaSpec',definition:'finite supplied spectral zeta',s,value:sz,eigenvalueCount:eigs.length,mode:'FINITE/TRUNCATED',exactInfiniteSpectrum:false,sourceEigenvalues:eigs,status:'FINITE SPECTRAL ZETA'},
        {id:'zeta-comparison-stage7',type:'ZetaCorrespondenceSpec',riemannZetaRef:'riemann-zeta-stage7',spectralZetaRef:'spectral-zeta-stage7',spacingCorrelation:c,status:'EMPIRICAL CORRESPONDENCE',spectralIdentityEstablished:false,riemannZetaEqualsSpectralZeta:false,guard:'statistics do not establish spectral identity'},
        {id:'zeta-resolvent-stage7',type:'ResolventComparisonSpec',lambdaCursor:.5,finiteResolventNorm:2,mode:'FINITE DIAGONAL REFERENCE',finiteApproximationWarning:true}
      ],{spacingCorrelation:c,finiteResolventNorm:2},['Riemann and spectral zeta remain distinct','finite spectral data only']);
    }
    if(adapter==='advanced.spectral-flow-reference.v1'){
      const selfAdjoint=input.selfAdjoint!==false,fredholm=input.fredholm!==false,tracks=[[-.8,1.6],[-.6,1.4],[-.4,1.2],[-.2,.9],[.7,-1.4]],samples=101,ts=Array.from({length:samples},(_,i)=>i/(samples-1));let pos=0,neg=0;
      const out=tracks.map(([a,b],i)=>{const z=-a/b,inside=z>0&&z<1,sign=inside?(b>0?1:-1):0;if(sign>0)pos++;if(sign<0)neg++;return{track:i,a,b,values:ts.map(t=>a+b*t),crossingT:inside?z:null,crossingSign:sign}});
      const ok=selfAdjoint&&fredholm;
      return localEnvelope(adapter,input,[{id:'spectral-flow-stage7',type:'SpectralFlowSpec',family:'D_t=diag(a_i+b_i t)',parameter:{name:'t',start:0,end:1,samples},selfAdjoint,fredholmCondition:fredholm,finiteDimensionalReference:true,eigenvalueTracks:out,positiveCrossings:pos,negativeCrossings:neg,endpointZeroHits:0,spectralFlow:ok?pos-neg:null,status:ok?'VALID FINITE REFERENCE':'INVALID PRECONDITIONS',reference:'Phillips 1996',signedCrossingConvention:'negative-to-positive=+1; positive-to-negative=-1'}],{positiveCrossings:pos,negativeCrossings:neg,spectralFlow:ok?pos-neg:null},['explicit self-adjoint Fredholm reference family']);
    }
    if(adapter==='advanced.equivariant-k-reference.v1'){
      const good=(input.preset||'c2_commuting')==='c2_commuting',rid='equivariant-rep-stage7-'+(good?'c2_commuting':'c2_noncommuting'),eid='equivariant-k-stage7-'+(good?'c2_commuting':'c2_noncommuting'),kid='k-homology-stage7-'+(good?'c2_commuting':'c2_noncommuting');
      return localEnvelope(adapter,input,[
        {id:rid,type:'RepresentationTheorySpec',group:'C2',representation:'rho(g)=diag(1,-1)',representationValidity:'EXACT FINITE',operatorMatrix:good?[[2,0],[0,3]]:[[0,1],[1,0]],commutatorNorm:good?0:2,operatorCommutation:good?'PASS':'FAIL',invariantSubspaces:good?['span(e1)','span(e2)']:['operator does not preserve isotypic splitting']},
        {id:eid,type:'EquivariantKTheorySpec',representationRef:rid,groupAction:'C2 reference action',equivariantBundle:'finite C2 reference',equivariantOperator:good,equivariantSymbol:good?'REFERENCE METADATA':'UNAVAILABLE: COMMUTATION FAIL',equivariantKClass:good?'EXTERNAL/PARTIAL':null,equivariantIndex:'NOT COMPUTED / THEOREM MAPPING REQUIRED',symmetryGraphIntegration:true,reference:'Atiyah-Segal 1968',fullFormalizationClaimed:false,displayIsEquivariantKClass:false},
        {id:kid,type:'KHomologySpec',operatorClass:'elliptic/Fredholm-module metadata placeholder',fredholmModuleMetadata:{hilbertSpace:'finite reference surrogate',representationRef:rid,operatorRef:eid},spaceAssumptions:['framework must be explicit'],singularSpaceFramework:'NOT SELECTED',externalTheoremReference:'Baum-Douglas 1982',coverage:'PARTIAL / EXTERNAL THEOREM',formalPassClaimed:false}
      ],{commutatorNorm:good?0:2},['finite commutation is not full equivariant K-theory']);
    }
    if(adapter==='advanced.perturbation-reference.v1'){
      return localEnvelope(adapter,input,[{id:'perturbation-stage7',type:'PerturbationSpec',operators:['D','D+K1','D+K1+K2'],selfAdjointFiniteReference:true,eigenvalues:[[-2,1,3],[-1.9,.9,3],[-1.95,.98,2.97]],perturbationClass:'finite-rank/compact in finite reference model',finiteSquareFredholmIndex:[0,0,0],indexStabilityApplies:'TRIVIAL FINITE-SQUARE REFERENCE ONLY',infiniteFredholmIndexStability:'THEOREM MAPPING REQUIRED',guard:'finite index constancy is not arbitrary infinite Fredholm stability'}],{maxK1Norm:.1,maxK2Norm:.08},['finite symmetric reference']);
    }
    if(adapter==='advanced.ricci-flow-reference.v1'){
      const p=input.preset||'round_s2',N=80,tEnd=Number(input.tEnd??(p==='round_s2'?.45:1)),time=Array.from({length:N},(_,i)=>tEnd*i/(N-1));let scale,scalar,volume,eigen,sing=null,status;
      if(p==='round_s2'){if(!(tEnd>0&&tEnd<.5))throw new Error('round_s2 requires 0<tEnd<0.5');scale=time.map(t=>1-2*t);scalar=scale.map(c=>2/c);volume=scale.map(c=>4*Math.PI*c);eigen=scale.map(c=>2/c);sing=.5;status='THEOREM-MAPPED CONSTANT-CURVATURE REFERENCE'}
      else{scale=time.map(()=>1);scalar=time.map(()=>0);volume=time.map(()=>1);eigen=time.map(()=>4*Math.PI*Math.PI);status='RICCI-FLAT FIXED REFERENCE'}
      return localEnvelope(adapter,input,[{id:'ricci-flow-stage7-'+p,type:'RicciFlowSpec',preset:p,equation:'partial_t g = -2 Ric(g)',time,metricScale:scale,scalarCurvature:scalar,volume,selectedSpectrum:eigen,singularTime:sing,surgeryEvents:[],surgeryIsSeparateTopologyRevision:true,surgeryUsedAsDimensionLiftingJustification:false,status,theoremMapping:{reference:'Hamilton 1982'}}],{finalMetricScale:scale.at(-1),finalScalarCurvature:scalar.at(-1)},['constant-curvature reference only','surgery separate']);
    }
    throw new Error('No local Stage7 fallback for '+adapter);
  }
  async function runAdapter(adapter,input){
    const req={...input,sourceRevisionRefs:(currentSession().revisions||[]).slice(0,12).map(x=>x.revision).filter(Boolean)};
    try{const result=await fetchJson(SERVICE+'/v1/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({adapter,inputSpec:req,environment:{requestSource:'MathScope v0.3.1 Stage7',sessionId:currentSession().id||null}})});result.executionSource='CLOUD';return result}
    catch(err){const result=localAdapter(adapter,req);result.executionSource='BROWSER_FALLBACK';result.cloudFailure={name:err?.name||'Error',httpStatus:err?.httpStatus??null,message:String(err?.message||err)};result.diagnostics.unshift({level:'warning',code:'CLOUD_REQUEST_FAILED',message:result.cloudFailure.message});result.logs.push('Cloud failure: '+result.cloudFailure.message);return result}
  }
  function byType(envelope){return Object.fromEntries((envelope?.outputRepresentations||[]).map(x=>[x.type,x]))}
  function setStatus(id,text,cls=''){const el=one(id);if(!el)return;el.textContent=text;el.className='chip '+cls}

  function canvas(id,height=290){
    const c=one(id),ctx=c?.getContext?.('2d');if(!ctx)return null;
    const r=c.getBoundingClientRect?.()||{width:800},w=Math.max(420,Math.round(r.width||800)),h=height,dpr=Math.min(window.devicePixelRatio||1,2);
    c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return{c,ctx,w,h};
  }
  function baseCanvas(o,title){
    const{ctx,w,h}=o;ctx.fillStyle='#061520';ctx.fillRect(0,0,w,h);ctx.fillStyle='rgba(157,188,199,.82)';ctx.font='10px IBM Plex Mono, monospace';ctx.fillText(title,10,16);
  }

  function drawGalois(){
    const o=canvas('#v031S7GaloisCanvas'),g=state.galois?.types?.GaloisLabSpec;if(!o)return;baseCanvas(o,'roots in the complex plane');
    const{ctx,w,h,c}=o;if(!g?.roots?.length){ctx.fillStyle='#d5b96f';ctx.fillText('Run Galois reference.',28,h/2);c.dataset.renderStatus='EMPTY';return}
    const roots=g.roots.map(z=>({x:Number(z.re),y:Number(z.im)})),max=Math.max(1,...roots.flatMap(z=>[Math.abs(z.x),Math.abs(z.y)])),cx=w/2,cy=h/2,s=Math.min(w,h)*.34/max;
    ctx.strokeStyle='rgba(142,215,255,.2)';ctx.beginPath();ctx.moveTo(20,cy);ctx.lineTo(w-20,cy);ctx.moveTo(cx,28);ctx.lineTo(cx,h-20);ctx.stroke();
    roots.forEach((z,i)=>{const x=cx+z.x*s,y=cy-z.y*s;ctx.fillStyle='rgba(124,233,225,.92)';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(214,236,242,.88)';ctx.fillText('r'+(i+1),x+8,y-7)});
    ctx.fillStyle='rgba(255,194,92,.8)';ctx.fillText('visual root layout ≠ Galois relation',16,h-12);c.dataset.renderStatus='PASS';
  }
  function drawZeta(){
    const o=canvas('#v031S7ZetaCanvas'),z=state.zeta?.types;if(!o)return;baseCanvas(o,'Riemann ζ vs finite spectral ζ — distinct objects');
    const{ctx,w,h,c}=o;if(!z?.RiemannZetaSpec){ctx.fillStyle='#d5b96f';ctx.fillText('Run zeta reference.',28,h/2);c.dataset.renderStatus='EMPTY';return}
    const a=Number(z.RiemannZetaSpec.approximation),b=Number(z.SpectralZetaSpec.value),max=Math.max(1e-9,a,b),x0=70,bw=Math.min(140,(w-160)/2),base=h-45,scale=(h-90)/max;
    ctx.fillStyle='rgba(142,215,255,.72)';ctx.fillRect(x0,base-a*scale,bw,a*scale);ctx.fillStyle='rgba(124,233,225,.72)';ctx.fillRect(x0+bw+45,base-b*scale,bw,b*scale);
    ctx.fillStyle='#d8edf2';ctx.fillText('Riemann ζ('+z.RiemannZetaSpec.s+')',x0,base+18);ctx.fillText('finite spectral ζ',x0+bw+45,base+18);
    ctx.fillStyle='rgba(255,194,92,.85)';ctx.fillText('correlation status: '+z.ZetaCorrespondenceSpec.status,16,h-12);c.dataset.renderStatus='PASS';
  }
  function drawFlow(){
    const o=canvas('#v031S7FlowCanvas'),f=state.flow?.types?.SpectralFlowSpec;if(!o)return;baseCanvas(o,'self-adjoint Fredholm family eigenvalue tracks');
    const{ctx,w,h,c}=o;if(!f?.eigenvalueTracks?.length){ctx.fillStyle='#d5b96f';ctx.fillText('Run spectral-flow reference.',28,h/2);c.dataset.renderStatus='EMPTY';return}
    const pad=35,zero=h/2,max=Math.max(1,...f.eigenvalueTracks.flatMap(t=>(t.values||[]).map(v=>Math.abs(Number(v))))),sx=(w-pad-15)/Math.max(1,(f.parameter.samples||2)-1),sy=(h-70)/(2*max);
    ctx.strokeStyle='rgba(142,215,255,.22)';ctx.beginPath();ctx.moveTo(pad,zero);ctx.lineTo(w-15,zero);ctx.stroke();
    f.eigenvalueTracks.forEach((t,idx)=>{ctx.strokeStyle=idx%2?'rgba(142,215,255,.82)':'rgba(124,233,225,.82)';ctx.lineWidth=1.6;ctx.beginPath();(t.values||[]).forEach((v,i)=>{const x=pad+i*sx,y=zero-Number(v)*sy;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();if(t.crossingT!=null){const x=pad+(Number(t.crossingT)-f.parameter.start)/(f.parameter.end-f.parameter.start)*(w-pad-15);ctx.fillStyle=t.crossingSign>0?'rgba(114,222,185,.95)':'rgba(255,141,149,.95)';ctx.beginPath();ctx.arc(x,zero,4,0,Math.PI*2);ctx.fill()}});
    ctx.fillStyle='rgba(255,194,92,.85)';ctx.fillText('SF = '+val(f.spectralFlow)+' · +'+f.positiveCrossings+' / -'+f.negativeCrossings,16,h-12);c.dataset.renderStatus='PASS';
  }
  function drawRicci(){
    const o=canvas('#v031S7RicciCanvas'),r=state.ricci?.types?.RicciFlowSpec;if(!o)return;baseCanvas(o,'Ricci-flow reference evolution');
    const{ctx,w,h,c}=o;if(!r?.time?.length){ctx.fillStyle='#d5b96f';ctx.fillText('Run Ricci-flow reference.',28,h/2);c.dataset.renderStatus='EMPTY';return}
    const pad=38,n=r.time.length,series=[['metricScale',r.metricScale,'rgba(124,233,225,.9)'],['scalarCurvature',r.scalarCurvature,'rgba(142,215,255,.9)']];
    series.forEach(([name,arr,color],j)=>{const xs=(w-pad-16)/Math.max(1,n-1),vals=arr.map(Number),min=Math.min(...vals),max=Math.max(...vals),span=Math.max(1e-9,max-min);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();vals.forEach((v,i)=>{const x=pad+i*xs,y=30+(h-75)*(1-(v-min)/span);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.fillStyle=color;ctx.fillText(name,50+j*160,34)});
    ctx.fillStyle='rgba(255,194,92,.85)';ctx.fillText('surgery kept separate · no dimension-lifting justification',16,h-12);c.dataset.renderStatus='PASS';
  }

  function renderGalois(){
    const t=state.galois?.types||{},g=t.GaloisLabSpec||{},grp=t.GroupTheorySpec||{},rep=t.RepresentationTheorySpec||{};
    setStatus('#v031S7GaloisStatus',g.correspondenceStatus||'NO RESULT',g.correspondenceStatus==='EXPLICIT'?'ok':'warn');
    one('#v031S7GaloisSummary').innerHTML=rows([['polynomial',JSON.stringify(g.polynomialCoefficients||[])],['splitting field',g.splittingField||'—'],['extension degree',val(g.extensionDegree)],['Galois group',g.galoisGroup||'—'],['group order',val(grp.order)],['correspondence',g.correspondenceStatus||'—'],['representation',rep.representation||'—'],['guard','shapeResemblanceCreatesGaloisRelation='+String(g.shapeResemblanceCreatesGaloisRelation)]]);
    one('#v031S7GaloisTable').innerHTML=(g.galoisCorrespondence||[]).map(x=>'<tr><td>'+esc(x.subgroup)+'</td><td>'+esc(x.fixedField)+'</td><td>'+esc(String(x.orderReversing))+'</td></tr>').join('');
    drawGalois();
  }
  function renderZeta(){
    const t=state.zeta?.types||{},r=t.RiemannZetaSpec||{},s=t.SpectralZetaSpec||{},c=t.ZetaCorrespondenceSpec||{},rv=t.ResolventComparisonSpec||{};
    setStatus('#v031S7ZetaStatus',c.status||'NO RESULT',c.status==='EMPIRICAL CORRESPONDENCE'?'warn':'');
    one('#v031S7ZetaSummary').innerHTML=rows([['Riemann ζ',val(r.approximation)],['Riemann error bound',val(r.errorBound)],['spectral ζ',val(s.value)],['spectral mode',s.mode||'—'],['spacing correlation',c.spacingCorrelation==null?'—':Number(c.spacingCorrelation).toFixed(5)],['correspondence status',c.status||'—'],['spectral identity',String(!!c.spectralIdentityEstablished)],['finite resolvent norm',val(rv.finiteResolventNorm)]]);
    drawZeta();
  }
  function renderFlow(){
    const f=state.flow?.types?.SpectralFlowSpec||{};
    setStatus('#v031S7FlowStatus',f.status||'NO RESULT',f.status==='VALID FINITE REFERENCE'?'ok':'warn');
    one('#v031S7FlowPositive').textContent=val(f.positiveCrossings);one('#v031S7FlowNegative').textContent=val(f.negativeCrossings);one('#v031S7FlowValue').textContent=val(f.spectralFlow);
    one('#v031S7FlowSummary').innerHTML=rows([['self-adjoint',String(!!f.selfAdjoint)],['Fredholm condition',String(!!f.fredholmCondition)],['family',f.family||'—'],['endpoint zero hits',val(f.endpointZeroHits)],['crossing convention',f.signedCrossingConvention||'—'],['reference',f.reference||'—']]);
    drawFlow();
  }
  function renderEquivariant(){
    const t=state.equivariant?.types||{},r=t.RepresentationTheorySpec||{},e=t.EquivariantKTheorySpec||{},k=t.KHomologySpec||{};
    setStatus('#v031S7EquivariantStatus',e.equivariantOperator?'COMMUTING':'NOT EQUIVARIANT',e.equivariantOperator?'ok':'warn');
    one('#v031S7EquivariantSummary').innerHTML=rows([['group',r.group||'—'],['representation',r.representation||'—'],['commutator norm',val(r.commutatorNorm)],['operator equivariant',String(!!e.equivariantOperator)],['equivariant K-class',val(e.equivariantKClass)],['equivariant index',e.equivariantIndex||'—'],['display is K-class',String(!!e.displayIsEquivariantKClass)],['K-homology coverage',k.coverage||'—']]);
  }
  function renderPerturbation(){
    const p=state.perturbation?.types?.PerturbationSpec||{};
    setStatus('#v031S7PerturbationStatus',p.indexStabilityApplies||'NO RESULT',p.infiniteFredholmIndexStability==='THEOREM MAPPING REQUIRED'?'warn':'ok');
    one('#v031S7PerturbationSummary').innerHTML=rows([['operators',val(p.operators)],['eigenvalues',val(p.eigenvalues)],['perturbation class',p.perturbationClass||'—'],['finite indices',val(p.finiteSquareFredholmIndex)],['finite scope',p.indexStabilityApplies||'—'],['infinite scope',p.infiniteFredholmIndexStability||'—'],['guard',p.guard||'—']]);
  }
  function renderRicci(){
    const r=state.ricci?.types?.RicciFlowSpec||{};
    setStatus('#v031S7RicciStatus',r.status||'NO RESULT',r.status?.includes('REFERENCE')?'ok':'');
    one('#v031S7RicciSummary').innerHTML=rows([['preset',r.preset||'—'],['equation',r.equation||'—'],['final metric scale',r.metricScale?.length?Number(r.metricScale.at(-1)).toFixed(6):'—'],['final scalar curvature',r.scalarCurvature?.length?Number(r.scalarCurvature.at(-1)).toFixed(6):'—'],['final volume',r.volume?.length?Number(r.volume.at(-1)).toFixed(6):'—'],['singular time',val(r.singularTime)],['surgery events',val(r.surgeryEvents)],['dimension-lifting guard',String(!!r.surgeryUsedAsDimensionLiftingJustification)]]);
    drawRicci();
  }
  function renderRaw(){
    one('#v031S7Raw').textContent=JSON.stringify(Object.fromEntries(Object.entries(state).map(([k,v])=>[k,v?{jobId:v.envelope.jobId,executionSource:v.envelope.executionSource||'UNKNOWN',cloudFailure:v.envelope.cloudFailure||null,elapsedMs:v.envelope.elapsedMs,evidence:v.envelope.evidenceRecords?.[0],diagnostics:v.envelope.diagnostics,types:v.types}:null])),null,2);
  }

  async function runGalois(){
    setStatus('#v031S7GaloisStatus','RUNNING','warn');const preset=one('#v031S7GaloisPreset')?.value||'quadratic_sqrt2';
    const envelope=await runAdapter('advanced.galois-reference.v1',{preset,claimRef:'claim:stage7-galois-semantics'});state.galois={envelope,types:byType(envelope)};renderGalois();renderRaw();runGate();return state.galois;
  }
  async function runZeta(){
    setStatus('#v031S7ZetaStatus','RUNNING','warn');const envelope=await runAdapter('advanced.zeta-resolvent-reference.v1',{sReal:num('#v031S7ZetaS',2),terms:Math.round(num('#v031S7ZetaTerms',5000)),claimRef:'claim:stage7-zeta-semantics'});state.zeta={envelope,types:byType(envelope)};renderZeta();renderRaw();runGate();return state.zeta;
  }
  async function runFlow(){
    setStatus('#v031S7FlowStatus','RUNNING','warn');const envelope=await runAdapter('advanced.spectral-flow-reference.v1',{selfAdjoint:!!one('#v031S7FlowSelfAdjoint')?.checked,fredholm:!!one('#v031S7FlowFredholm')?.checked,claimRef:'claim:stage7-spectral-flow'});state.flow={envelope,types:byType(envelope)};renderFlow();renderRaw();runGate();return state.flow;
  }
  async function runEquivariant(){
    setStatus('#v031S7EquivariantStatus','RUNNING','warn');const preset=one('#v031S7EquivariantPreset')?.value||'c2_commuting';
    const envelope=await runAdapter('advanced.equivariant-k-reference.v1',{preset,claimRef:'claim:stage7-equivariant-semantics'});state.equivariant={envelope,types:byType(envelope)};renderEquivariant();renderRaw();runGate();return state.equivariant;
  }
  async function runPerturbation(){
    setStatus('#v031S7PerturbationStatus','RUNNING','warn');const envelope=await runAdapter('advanced.perturbation-reference.v1',{claimRef:'claim:stage7-perturbation'});state.perturbation={envelope,types:byType(envelope)};renderPerturbation();renderRaw();runGate();return state.perturbation;
  }
  async function runRicci(){
    setStatus('#v031S7RicciStatus','RUNNING','warn');const preset=one('#v031S7RicciPreset')?.value||'round_s2',tEnd=num('#v031S7RicciT',preset==='round_s2'?.45:1);
    const envelope=await runAdapter('advanced.ricci-flow-reference.v1',{preset,tEnd,claimRef:'claim:stage7-ricci-flow'});state.ricci={envelope,types:byType(envelope)};renderRicci();renderRaw();runGate();return state.ricci;
  }
  async function runAll(){
    const badge=one('#v031S7SuiteStatus');if(badge){badge.textContent='RUNNING 0/6';badge.className='v031-pill warn'}
    const jobs=[runGalois,runZeta,runFlow,runEquivariant,runPerturbation,runRicci];
    for(let i=0;i<jobs.length;i++){await jobs[i]();if(badge)badge.textContent='RUNNING '+(i+1)+'/6'}
    gate=runGate();if(badge){badge.textContent=(gate.pass?'SEMANTICS PASS':'SEMANTICS CHECK')+' · CLOUD '+gate.cloudCount+'/6 · LOCAL '+gate.localCount;badge.className='v031-pill '+(gate.pass&&gate.cloudPass?'pass':'warn')}return{state,gate};
  }

  function runGate(){
    const g=state.galois?.types?.GaloisLabSpec||{},z=state.zeta?.types||{},f=state.flow?.types?.SpectralFlowSpec||{},eq=state.equivariant?.types||{},p=state.perturbation?.types?.PerturbationSpec||{},r=state.ricci?.types?.RicciFlowSpec||{};
    const evidence=Object.values(state).filter(Boolean).flatMap(x=>x.envelope.evidenceRecords||[]);
    const tests=[
      {name:'S7-1 Galois semantics',pass:g.shapeResemblanceCreatesGaloisRelation===false&&g.requiresExplicitFieldExtension===true&&['EXPLICIT','NOT ESTABLISHED'].includes(g.correspondenceStatus),detail:'field extension/group structure explicit; visual resemblance has zero promotion authority'},
      {name:'S7-2 Zeta semantics',pass:z.RiemannZetaSpec?.id!==z.SpectralZetaSpec?.id&&z.ZetaCorrespondenceSpec?.spectralIdentityEstablished===false&&z.SpectralZetaSpec?.exactInfiniteSpectrum===false,detail:'Riemann ζ and spectral ζ remain separate; finite spectrum stays finite'},
      {name:'S7-3 Spectral flow',pass:f.selfAdjoint===true&&f.fredholmCondition===true&&f.positiveCrossings===4&&f.negativeCrossings===1&&f.spectralFlow===3,detail:'explicit self-adjoint Fredholm reference family gives +4,-1,SF=3'},
      {name:'S7-4 Equivariant / K-homology',pass:eq.EquivariantKTheorySpec?.displayIsEquivariantKClass===false&&eq.KHomologySpec?.coverage==='PARTIAL / EXTERNAL THEOREM'&&p.infiniteFredholmIndexStability==='THEOREM MAPPING REQUIRED',detail:'finite commutation/perturbation never masquerades as full equivariant K-theory or infinite Fredholm theorem'},
      {name:'S7-5 Ricci semantics',pass:r.surgeryUsedAsDimensionLiftingJustification===false&&Array.isArray(r.surgeryEvents)&&r.surgeryIsSeparateTopologyRevision===true,detail:'Ricci evolution and surgery remain separate from dimension-lifting justification'},
      {name:'S7-6 Trust boundary',pass:evidence.length>=6&&evidence.every(e=>e.grade==='NUMERICAL INDICATOR'),detail:'all compute evidence remains NUMERICAL INDICATOR; no Stage7 adapter emits THEOREM-BACKED or FORMAL PASS'}
    ];
    const pass=tests.every(x=>x.pass),box=one('#v031S7Gates');if(box)box.innerHTML=tests.map(t=>'<div class="s7-gate '+(t.pass?'pass':'fail')+'"><b>'+(t.pass?'PASS · ':'FAIL · ')+esc(t.name)+'</b><small>'+esc(t.detail)+'</small></div>').join('');
    const execution=Object.fromEntries(Object.entries(state).map(([key,value])=>[key,{source:value?.envelope?.executionSource||'NOT RUN',jobId:value?.envelope?.jobId||null,failure:value?.envelope?.cloudFailure||null}]));
    const cloudCount=Object.values(execution).filter(x=>x.source==='CLOUD').length,localCount=Object.values(execution).filter(x=>x.source==='BROWSER_FALLBACK').length,cloudPass=cloudCount===6;
    const gEl=one('#v031S7Gate');if(gEl){gEl.textContent=(pass?'S7-1…S7-6 PASS':'STAGE 7 CHECK')+' · CLOUD '+cloudCount+'/6 · LOCAL '+localCount;gEl.className='chip '+(pass&&cloudPass?'ok':'warn')}
    gate={pass,tests,semanticPass:pass,cloudPass,cloudCount,localCount,execution};return gate;
  }

  function tag(){const h=Object.values(state).filter(Boolean).map(x=>x.envelope.evidenceRecords?.[0]?.inputsHash||'').join('');return(h||Date.now().toString(36)).slice(0,12)}
  function remap(outputs,suffix){
    const cp=JSON.parse(JSON.stringify(outputs||[])),map=new Map(cp.filter(x=>x?.id).map(x=>[x.id,x.id+'-'+suffix]));
    const walk=v=>{if(Array.isArray(v))return v.map(walk);if(v&&typeof v==='object'){for(const k of Object.keys(v))v[k]=walk(v[k]);return v}if(typeof v==='string'&&map.has(v))return map.get(v);return v};
    return cp.map(x=>{x=walk(x);if(x.id){x.revision=x.id+':r1';x.parentRevision=null}return x});
  }
  function claim(id,statement,scope,dependsOn,status='SUPPORTED'){return{id,statement,scope,assumptions:[],dependsOn,status,freshness:'CURRENT',revision:id+':r1',parentRevision:null}}
  async function commitSuite(){
    if(!runGate().pass)await runAll();
    const f=window.MathScopeV031Foundation;if(!f?.commitTypedBundle)throw new Error('Foundation commit bridge unavailable');
    const suffix=tag(),bundle={bundleId:'stage7-advanced-'+suffix,symmetries:[],spectra:[],operators:[],geometries:[],kclasses:[],claims:[],evidence:[]};
    const added={};
    for(const [key,entry] of Object.entries(state)){
      if(!entry)continue;const outs=remap(entry.envelope.outputRepresentations,suffix),by={};outs.forEach(o=>by[o.type]=o);added[key]=by;
      outs.forEach(o=>{
        if(['GroupTheorySpec','GaloisLabSpec','RepresentationTheorySpec'].includes(o.type))bundle.symmetries.push(o);
        else if(['RiemannZetaSpec','SpectralZetaSpec','ZetaCorrespondenceSpec','ResolventComparisonSpec','SpectralFlowSpec'].includes(o.type))bundle.spectra.push(o);
        else if(o.type==='PerturbationSpec')bundle.operators.push(o);
        else if(o.type==='RicciFlowSpec')bundle.geometries.push(o);
        else if(['EquivariantKTheorySpec','KHomologySpec'].includes(o.type))bundle.kclasses.push(o);
      });
      const ev=(entry.envelope.evidenceRecords||[])[0];if(ev)bundle.evidence.push({...ev,id:ev.id+'-'+suffix,claimRef:'claim-stage7-'+key+'-'+suffix,freshness:'CURRENT',supportsCurrent:true,stale:false});
    }
    const first=(obj,type)=>obj?.[type]?.id;
    bundle.claims.push(
      claim('claim-stage7-galois-'+suffix,'The selected Galois relation is supported only by explicit polynomial/field/group data; 3D resemblance is not evidence.','GALOIS SEMANTICS',[first(added.galois,'GaloisLabSpec'),first(added.galois,'GroupTheorySpec')].filter(Boolean)),
      claim('claim-stage7-zeta-'+suffix,'Riemann zeta and the selected spectral zeta remain distinct; any spacing agreement is empirical correspondence, not spectral identity.','ZETA / RESOLVENT SEMANTICS',[first(added.zeta,'RiemannZetaSpec'),first(added.zeta,'SpectralZetaSpec'),first(added.zeta,'ZetaCorrespondenceSpec')].filter(Boolean),'RESEARCH HYPOTHESIS'),
      claim('claim-stage7-flow-'+suffix,'The reference spectral flow is the signed zero-crossing count of an explicit self-adjoint Fredholm family.','SPECTRAL FLOW',[first(added.flow,'SpectralFlowSpec')].filter(Boolean)),
      claim('claim-stage7-equivariant-'+suffix,'Finite group-action commutation is reference evidence only; equivariant K-theory and K-homology coverage remains partial/external.','EQUIVARIANT K / K-HOMOLOGY',[first(added.equivariant,'EquivariantKTheorySpec'),first(added.equivariant,'KHomologySpec')].filter(Boolean)),
      claim('claim-stage7-perturbation-'+suffix,'Finite perturbation spectra may move while finite square index stays zero; infinite Fredholm index stability still requires explicit hypotheses.','PERTURBATION',[first(added.perturbation,'PerturbationSpec')].filter(Boolean)),
      claim('claim-stage7-ricci-'+suffix,'Ricci-flow evolution is tracked independently from surgery and is not a generic dimension-lifting justification.','RICCI FLOW',[first(added.ricci,'RicciFlowSpec')].filter(Boolean))
    );
    const claimByKey={galois:bundle.claims[0].id,zeta:bundle.claims[1].id,flow:bundle.claims[2].id,equivariant:bundle.claims[3].id,perturbation:bundle.claims[4].id,ricci:bundle.claims[5].id};
    bundle.evidence.forEach(ev=>{const k=Object.keys(claimByKey).find(x=>ev.id.includes('advanced.'+x)||ev.id.includes(x));if(k)ev.claimRef=claimByKey[k]});
    lastCommitted=f.commitTypedBundle(bundle,'Stage7 Advanced Research · Galois/Zeta/SF/Equivariant/Ricci');window.MathScopeV031Stage5?.refreshGraph?.();one('#v031S7SuiteStatus').textContent='COMMITTED · '+suffix;return bundle;
  }

  function addPalette(){
    const list=one('#v031Palette .v031-command-list');if(!list||one('[data-s7-palette]'))return;
    for(const [a,label] of[['open','Open Stage 7 Advanced Research'],['run','Run Stage 7 reference suite']]){const b=document.createElement('button');b.textContent=label;b.dataset.s7Palette=a;b.addEventListener('click',()=>{one('#v031Palette')?.close?.();document.querySelector('[data-view-target="stage7-advanced"]')?.click();if(a==='run')runAll().catch(()=>{})});list.appendChild(b)}
  }
  function registerWebMCP(){
    const mc=document.modelContext;if(!mc?.registerTool)return;const safe=d=>{try{mc.registerTool(d,{signal:new AbortController().signal})}catch{}};
    safe({name:'mathscope.stage7.module_status',description:'Read current Stage7 Galois/zeta/spectral-flow/equivariant/perturbation/Ricci reference results without evidence promotion.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:async()=>({version:VERSION,gate,state:Object.fromEntries(Object.entries(state).map(([k,v])=>[k,v?{types:v.types,evidence:v.envelope.evidenceRecords}:null]))})});
    safe({name:'mathscope.stage7.run_reference_suite',description:'Run the bounded Stage7 advanced-research reference suite. Results remain scoped evidence and never become FORMAL PASS automatically.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:async()=>runAll()});
    safe({name:'mathscope.stage7.guard_report',description:'Evaluate Stage7 semantic guards: Galois structure, zeta separation, spectral-flow preconditions, equivariant/K-homology scope, Ricci-flow scope and evidence boundary.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:async()=>runGate()});
  }
  function init(){
    if(!one('#v031Stage7Advanced'))return;
    one('#v031S7GaloisRun')?.addEventListener('click',()=>runGalois().catch(e=>one('#v031S7Raw').textContent=String(e?.stack||e)));
    one('#v031S7ZetaRun')?.addEventListener('click',()=>runZeta().catch(e=>one('#v031S7Raw').textContent=String(e?.stack||e)));
    one('#v031S7FlowRun')?.addEventListener('click',()=>runFlow().catch(e=>one('#v031S7Raw').textContent=String(e?.stack||e)));
    one('#v031S7EquivariantRun')?.addEventListener('click',()=>runEquivariant().catch(e=>one('#v031S7Raw').textContent=String(e?.stack||e)));
    one('#v031S7PerturbationRun')?.addEventListener('click',()=>runPerturbation().catch(e=>one('#v031S7Raw').textContent=String(e?.stack||e)));
    one('#v031S7RicciRun')?.addEventListener('click',()=>runRicci().catch(e=>one('#v031S7Raw').textContent=String(e?.stack||e)));
    one('#v031S7RunAll')?.addEventListener('click',()=>runAll().catch(e=>one('#v031S7Raw').textContent=String(e?.stack||e)));
    one('#v031S7Commit')?.addEventListener('click',()=>commitSuite().catch(e=>one('#v031S7Raw').textContent=String(e?.stack||e)));
    one('#v031S7OpenGraph')?.addEventListener('click',()=>{document.querySelector('[data-view-target="stage5-research"]')?.click();setTimeout(()=>one('#v031S5GraphCard')?.scrollIntoView?.({behavior:'smooth',block:'start'}),70)});
    one('#v031S7RicciT')?.addEventListener('input',()=>one('#v031S7RicciTValue').textContent=Number(one('#v031S7RicciT').value).toFixed(2));
    all('[data-v031-canvas="Group"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>document.querySelector('[data-view-target="stage7-advanced"]')?.click(),0)));
    window.addEventListener('resize',()=>{if(state.galois)drawGalois();if(state.zeta)drawZeta();if(state.flow)drawFlow();if(state.ricci)drawRicci()});
    addPalette();registerWebMCP();runGate();
    window.MathScopeV031Stage7={version:VERSION,service:SERVICE,runAll,runGalois,runZeta,runFlow,runEquivariant,runPerturbation,runRicci,runGate,commitSuite,getState:()=>state,getCommitted:()=>lastCommitted};
    if(location.hash==='#stage7')setTimeout(()=>document.querySelector('[data-view-target="stage7-advanced"]')?.click(),420);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();