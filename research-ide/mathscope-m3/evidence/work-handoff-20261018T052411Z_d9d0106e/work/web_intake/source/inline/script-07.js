
(() => {
  'use strict';
  const VERSION='0.3.1-stage4.1';
  const one=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now=()=>new Date().toISOString();
  let singularity=null,fidelity=null,gate=[],lastBundle=null;

  const SINGULARITY_STATES=['REGULAR','POSSIBLY SINGULAR','NUMERICALLY SINGULAR','THEOREM-BACKED SINGULAR','FORMALLY PROVED','UNKNOWN'];
  const ENTROPY_SPECS=[
    {id:'entropy-shannon',kind:'Shannon',definition:'H(p)=-Σ p_i log p_i',measure:'discrete probability',state:'normalized probability vector',normalization:'Σp_i=1',units:'nats',assumptions:['p_i≥0'],revision:'entropy-shannon:r1'},
    {id:'entropy-metric',kind:'Metric',definition:'measure-theoretic entropy of a dynamical system',measure:'invariant measure μ',state:'measure-preserving dynamical system',normalization:'framework-dependent',units:null,assumptions:['specified transformation and invariant measure'],revision:'entropy-metric:r1'},
    {id:'entropy-topological',kind:'Topological',definition:'orbit-complexity growth invariant',measure:null,state:'continuous dynamical system',normalization:'framework-dependent',units:null,assumptions:['specified topology and dynamics'],revision:'entropy-topological:r1'},
    {id:'entropy-volume',kind:'Volume',definition:'asymptotic geometric volume-growth rate',measure:'Riemannian volume',state:'Riemannian manifold / cover',normalization:'definition-dependent',units:null,assumptions:['metric specified'],revision:'entropy-volume:r1'},
    {id:'entropy-spectral',kind:'Spectral',definition:'Shannon entropy of an explicitly normalized spectral distribution',measure:'normalized spectral weights',state:'finite selected spectrum',normalization:'weights sum to one',units:'nats',assumptions:['finite selected eigenvalue set','normalization explicitly chosen'],revision:'entropy-spectral:r1'},
    {id:'entropy-perelman-f',kind:'PerelmanF',definition:'F(g,f)=∫(R+|∇f|²)e^{-f}dV',measure:'e^{-f}dV',state:'Riemannian metric + potential f',normalization:'∫e^{-f}dV=1 when invoked',units:null,assumptions:['Ricci-flow context','smooth data'],revision:'entropy-perelman-f:r1'},
    {id:'entropy-perelman-w',kind:'PerelmanW',definition:'Perelman W functional with scale τ',measure:'(4πτ)^(-n/2)e^{-f}dV',state:'metric + f + τ',normalization:'weighted measure normalized',units:null,assumptions:['Ricci-flow context','τ>0'],revision:'entropy-perelman-w:r1'},
    {id:'entropy-vn',kind:'vonNeumann',definition:'S(ρ)=-Tr(ρ log ρ)',measure:'operator state',state:'positive trace-one density operator ρ',normalization:'Tr ρ=1',units:'nats',assumptions:['ρ positive semidefinite'],revision:'entropy-vn:r1'}
  ];
  const LIFTING=[
    {kind:'product',formula:'X² × K³',assumptions:['chosen fibre K³'],warning:'many fibres give the same low-D projection'},
    {kind:'warped product',formula:'X² ×_f K³',assumptions:['warping f specified'],warning:'f is extra hypothesis, not recovered uniquely'},
    {kind:'fibration',formula:'K³ → E⁵ → X²',assumptions:['bundle/fibration data specified'],warning:'total space is not determined by the base alone'},
    {kind:'symmetry extension',formula:'orbit_G(X²)',assumptions:['group action G specified'],warning:'symmetry choice is external structure'},
    {kind:'radial extension',formula:'u(r) ↦ U(r,ω)',assumptions:['radial/spherical ansatz'],warning:'ansatz excludes non-radial candidates'},
    {kind:'spectral extension',formula:'Σ_{j≤M} c_j e_j ↦ high-D mode candidate',assumptions:['basis/eigenmodes chosen'],warning:'basis and truncation dependent'}
  ];

  function rows(rs){return rs.map(r=>'<div class="k">'+esc(r[0])+'</div><div class="v">'+esc(r[1])+'</div>').join('')}
  function num(sel,fallback){const x=Number(one(sel)?.value);return Number.isFinite(x)?x:fallback}
  function nextRev(collection,id){const s=window.MathScopeV031Foundation?.getSession?.()||{},n=(s[collection]||[]).find(x=>x.id===id),m=String(n?.revision||'').match(/:r(\d+)$/);return id+':r'+(m?(Number(m[1])+1):1)}
  function canvas(sel,height=320){const c=one(sel),ctx=c?.getContext?.('2d');if(!ctx)return null;const rect=c.getBoundingClientRect?.()||{width:900},w=Math.max(460,Math.round(rect.width||900)),h=height,dpr=Math.min(window.devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return{c,ctx,w,h}}
  function colorRamp(q){q=Math.max(0,Math.min(1,q));return'rgba('+Math.round(25+210*q)+','+Math.round(45+130*(1-q))+','+Math.round(80+130*(1-q))+',1)'}

  function singularityProbe(){
    const eps=Math.max(.02,num('#v031S4Epsilon',.1)),levels=[Math.min(.3,eps*4),Math.min(.3,eps*2),eps],metrics=[];
    for(const e of levels){const uMax=1/e,gradMax=2/(3*Math.sqrt(3)*e*e),h1Proxy=Math.sqrt(Math.log(1+1/(e*e))),energyConcentration=1/(e*e+0.05);metrics.push({epsilon:e,uLinf:uMax,gradMax,h1Proxy,energyConcentration,residual:'N/A — indicator field, not PDE solve'})}
    const growth=metrics[2].uLinf/metrics[0].uLinf,status=growth>2.5?'NUMERICALLY SINGULAR':growth>1.5?'POSSIBLY SINGULAR':'REGULAR';
    singularity={id:'geometry-singularity-probe',analysisType:'SingularitySpec',status,field:'u_ε(r)=1/sqrt(r²+ε²)',indicators:metrics,selectedEpsilon:eps,curvature:'NOT APPLICABLE TO SCALAR FIELD',jacobianDeterminant:'N/A',smallestSingularValue:'N/A',refinementPersistence:growth,evidenceGrade:'NUMERICAL INDICATOR',revision:nextRev('geometries','geometry-singularity-probe'),assumptions:['synthetic indicator family','not asserted to solve a PDE'],provenance:{source:'Stage4 browser singularity reference probe',generatedAt:now()}};
    renderSingularity();return singularity
  }
  function renderSingularity(){
    if(!singularity)singularityProbe();
    const status=singularity.status;one('#v031S4SingularityStatus').textContent=status;
    one('#v031S4SingularityStates').innerHTML=SINGULARITY_STATES.map(s=>'<span class="s4-status '+(s===status?'active':'')+'">'+esc(s)+'</span>').join('');
    const last=singularity.indicators.at(-1);one('#v031S4SingularityMetrics').innerHTML=rows([['field',singularity.field],['status',status],['evidence',singularity.evidenceGrade],['||u||_L∞',last.uLinf.toFixed(4)],['||∇u|| max proxy',last.gradMax.toFixed(4)],['H^s/H¹ proxy',last.h1Proxy.toFixed(4)],['energy concentration',last.energyConcentration.toFixed(4)],['refinement growth',singularity.refinementPersistence.toFixed(3)+'×'],['residual',last.residual]]);
    drawSingularity()
  }
  function drawSingularity(){
    const o=canvas('#v031S4SingularityCanvas',320);if(!o)return;const{c,ctx,w,h}=o,eps=singularity.selectedEpsilon,img=ctx.createImageData(w,h),p=img.data;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const xx=2*(x/(w-1)-.5),yy=2*(y/(h-1)-.5),u=1/Math.sqrt(xx*xx+yy*yy+eps*eps),q=Math.min(1,u*eps),k=4*(y*w+x);p[k]=Math.round(25+220*q);p[k+1]=Math.round(35+125*(1-q));p[k+2]=Math.round(75+150*(1-q));p[k+3]=255}
    ctx.putImageData(img,0,0);ctx.fillStyle='rgba(255,255,255,.9)';ctx.font='11px monospace';ctx.fillText('u_ε(r)=1/sqrt(r²+ε²) · numerical indicator field',10,18);c.dataset.renderStatus='PASS'
  }

  function projectionSpec(){
    return{id:'rep-stage4-r5-to-r3',sourceObjectRef:'obj-stage4-r5-curve',method:'projection',displayDim:3,mapDefinition:'π(x1,x2,x3,x4,x5)=(x1,x2,0)',parameters:{source:'γ(θ)=(cos2θ,sin2θ,cosθ,sinθ,cos3θ)',theta:'[0,2π)'},sampling:{points:240},injectivityStatus:'NON_INJECTIVE',ambiguityRef:'θ ~ θ+π under π',fidelityVector:null,lostDimensions:['x3','x4','x5'],discardedCoordinates:['cosθ','sinθ','cos3θ'],inverseStatus:'NO UNIQUE INVERSE',sourceSingularSet:['θ=π/4','θ=5π/4'],displayedSingularSet:'same displayed point for θ and θ+π',provenance:{source:'Stage4 R5 curve reference',capturedAt:now()},revision:nextRev('representations','rep-stage4-r5-to-r3'),parentRevision:null,stale:false,freshness:'CURRENT'}
  }
  function renderProjection(){
    const rep=projectionSpec();one('#v031S4ProjectionSpec').innerHTML=rows([['source M^n','γ:S¹→R⁵'],['projection π',rep.mapDefinition],['display dimension',rep.displayDim],['injectivity',rep.injectivityStatus],['lost coordinates',rep.lostDimensions.join(', ')],['ambiguity fibre',rep.ambiguityRef],['inverse',rep.inverseStatus],['source singular markers',rep.sourceSingularSet.join(', ')],['displayed π(S)',rep.displayedSingularSet]]);
    const o=canvas('#v031S4ProjectionCanvas',320);if(!o)return;const{c,ctx,w,h}=o,cx=w/2,cy=h/2,r=Math.min(w,h)*.34;ctx.strokeStyle='rgba(124,233,225,.8)';ctx.lineWidth=1.6;ctx.beginPath();
    for(let i=0;i<=240;i++){const t=2*Math.PI*i/240,x=cx+r*Math.cos(2*t),y=cy+r*Math.sin(2*t);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
    const t=Math.PI/4,x=cx+r*Math.cos(2*t),y=cy+r*Math.sin(2*t);ctx.fillStyle='rgba(255,194,92,.95)';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(220,240,246,.9)';ctx.font='11px monospace';ctx.fillText('θ=π/4 and θ=5π/4 collide here',Math.max(8,x-100),Math.max(18,y-14));c.dataset.renderStatus='PASS'
  }

  function fidelityVector(){
    const spectral=window.MathScopeV031AnalyticSlice?.solve?.(16),spectralDef=spectral?Math.abs(spectral.lambdaRatio-1):null;
    const energyDefect=10/14,topo=window.MathScopeV031Stage4B7?.getResult?.()||null,comparison=topo?.type==='TopologyComparisonSpec'?topo:null;
    const bDistances=(comparison?.bottleneckDistanceByDimension||[]).map(x=>Number(x.bottleneckDistance)).filter(Number.isFinite);
    const maxBottleneck=bDistances.length?Math.max(...bDistances):null;
    const bettiMismatch=!!comparison&&(comparison.bettiDelta||[]).some(x=>Number(x.delta)!==0);
    const topologyComponent=comparison
      ?{raw:bettiMismatch?1:0,normalization:'Betti-number delta indicator on selected finite Rips complexes',tolerance:null,status:bettiMismatch?'COMPUTED DIFFERENCE · EQUIVALENCE NOT ESTABLISHED':'NO BETTI DELTA IN COMPUTED DIMS · EQUIVALENCE NOT ESTABLISHED',assumptions:['finite samples','selected metric/filtration','Betti agreement is not topology equivalence']}
      :{raw:null,normalization:null,tolerance:null,status:'PENDING B7 PERSISTENCE BACKEND',assumptions:['visual similarity is insufficient']};
    const persistenceComponent=comparison
      ?{raw:maxBottleneck,normalization:'max GUDHI bottleneck distance across computed homology dimensions',tolerance:null,status:'COMPUTED FINITE PERSISTENCE COMPARISON',assumptions:['finite samples','selected coefficient field','selected Rips filtration']}
      :{raw:null,normalization:null,tolerance:null,status:'PENDING B7',assumptions:['barcode/diagram not yet computed']};
    return{id:'fidelity-stage4-r5-projection',sourceRevision:'obj-stage4-r5-curve:r1',representationRevision:projectionSpec().revision,components:{
      hausdorff:{raw:null,normalization:null,tolerance:null,status:'NOT COMPARABLE WITHOUT COMMON METRIC/EMBEDDING',assumptions:['ambient dimensions differ']},
      topology:topologyComponent,
      persistence:persistenceComponent,
      curvature:{raw:null,normalization:null,tolerance:null,status:'NOT EVALUATED',assumptions:['curve curvature requires chosen metric/parameter treatment']},
      spectral:{raw:spectralDef,normalization:'relative λ1 error for Stage3 finite Laplacian reference',tolerance:.02,status:spectralDef!=null&&spectralDef<.02?'WITHIN DEMO TOLERANCE':'CHECK',assumptions:['separate Stage3 finite reference']},
      singularityLocation:{raw:0,normalization:'display position only',tolerance:0,status:'DISPLAY COLLISION / IDENTIFIABILITY FAIL',assumptions:['θ and θ+π project to same point']},
      energy:{raw:energyDefect,normalization:'1 - projected derivative energy/source derivative energy',tolerance:.1,status:'HIGH LOSS',assumptions:['Euclidean R5 source metric','π keeps x1,x2 only']}
    },overallScore:null,revision:'fidelity-stage4-r1'};
  }
  function renderFidelity(){
    fidelity=fidelityVector();const labels={hausdorff:'Hausdorff defect',topology:'Topology defect',persistence:'Persistence defect',curvature:'Curvature defect',spectral:'Spectral defect',singularityLocation:'Singularity-location defect',energy:'Energy defect'};
    one('#v031S4Fidelity').innerHTML=Object.entries(fidelity.components).map(([k,v])=>'<div class="s4-fidelity-card"><b>'+esc(labels[k])+'</b><span>raw='+esc(v.raw==null?'—':(typeof v.raw==='number'?v.raw.toFixed(6):v.raw))+'</span><span>'+esc(v.status)+'</span><span>'+esc(v.assumptions.join('; '))+'</span></div>').join('')
  }

  function renderLifting(){
    one('#v031S4LiftingCandidates').innerHTML=LIFTING.map(x=>'<div class="s4-candidate"><b>'+esc(x.kind)+'</b><small>'+esc(x.formula)+'</small><small>assumptions: '+esc(x.assumptions.join('; '))+'</small><small style="color:#ffd990">NON-UNIQUENESS: '+esc(x.warning)+'</small></div>').join('')
  }

  function ricciState(t){
    t=Math.max(0,Math.min(.49,t));const c=1-2*t,r=Math.sqrt(c),area=4*Math.PI*c,scalar=2/c,lambda1=2/c;
    return{id:'geometry-ricci-s2',type:'GeometryEvolutionSpec',model:'round S² unnormalized Ricci flow',equation:'∂_t g=-2 Ric(g)',metricScale:c,radius:r,area,scalarCurvature:scalar,selectedLaplacianEigenvalue:lambda1,entropy:{status:'NOT AUTO-COMPUTED',reason:'Perelman F/W requires f/τ data'},singularRegion:t>.45?'GLOBAL CURVATURE GROWTH / EXTINCTION APPROACH':'NONE IN REFERENCE FAMILY',validInterval:'0≤t<1/2',revision:nextRev('geometries','geometry-ricci-s2'),provenance:{source:'exact round-sphere reference family',generatedAt:now()}}
  }
  function surgerySpec(){return{id:'geometry-surgery-demo',type:'SurgeryEventSpec',status:'DEMONSTRATION / NOT TRIGGERED BY SPHERE REFERENCE',trigger:'hypothetical neck-pinch criterion supplied externally',preEventGeometry:'required snapshot ref',postEventGeometry:'required snapshot ref',topologyRevision:'new topology revision required',discontinuityMarker:true,dimensionLiftingJustification:false,revision:nextRev('geometries','geometry-surgery-demo')}}
  function renderRicci(){
    const t=num('#v031S4RicciT',.2),g=ricciState(t),s=surgerySpec();one('#v031S4RicciTValue').textContent=t.toFixed(2);one('#v031S4RicciMetrics').innerHTML=rows([['model',g.model],['equation',g.equation],['metric scale c(t)',g.metricScale.toFixed(4)],['radius',g.radius.toFixed(4)],['area',g.area.toFixed(4)],['scalar curvature',g.scalarCurvature.toFixed(4)],['selected λ1',g.selectedLaplacianEigenvalue.toFixed(4)],['valid interval',g.validInterval],['singular region',g.singularRegion],['entropy',g.entropy.status+' — '+g.entropy.reason]]);
    one('#v031S4Surgery').innerHTML=rows([['SurgeryEvent status',s.status],['trigger',s.trigger],['pre-event',s.preEventGeometry],['post-event',s.postEventGeometry],['topology revision',s.topologyRevision],['discontinuity marker',String(s.discontinuityMarker)],['dimension-lifting justification',String(s.dimensionLiftingJustification)]]);
    const o=canvas('#v031S4RicciCanvas',300);if(!o)return;const{c,ctx,w,h}=o,cx=w/2,cy=h/2,r=95*g.radius;ctx.strokeStyle='rgba(124,233,225,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();for(let k=-2;k<=2;k++){ctx.strokeStyle='rgba(124,233,225,.2)';ctx.beginPath();ctx.ellipse(cx,cy,r,Math.max(5,r*Math.cos(k*Math.PI/6)),0,0,Math.PI*2);ctx.stroke()}ctx.fillStyle='rgba(220,240,246,.9)';ctx.font='11px monospace';ctx.fillText('round S² · c(t)=1-2t · extinction t=1/2',10,18);c.dataset.renderStatus='PASS'
  }

  function entropyValue(kind){
    const p=Math.max(.25,Math.min(.95,num('#v031S4EntropySample',.6))),q=[p,(1-p)/2,(1-p)/2],H=-q.reduce((s,x)=>s+(x?x*Math.log(x):0),0);
    if(kind==='Shannon')return{value:H,meaning:'computed from demo probability [p,(1-p)/2,(1-p)/2]'};
    if(kind==='Spectral'){const w=[1,1/4,1/9],z=w.reduce((a,b)=>a+b,0),v=w.map(x=>x/z),S=-v.reduce((s,x)=>s+x*Math.log(x),0);return{value:S,meaning:'computed on explicitly normalized finite spectral weights'};}
    if(kind==='vonNeumann')return{value:H,meaning:'diagonal density matrix diag(p,(1-p)/2,(1-p)/2) demo'};
    return{value:null,meaning:'typed semantics only; no number without required dynamical/geometric state'}
  }
  function renderEntropy(){
    const kind=one('#v031S4EntropyKind')?.value||'Shannon',spec=ENTROPY_SPECS.find(x=>x.kind===kind)||ENTROPY_SPECS[0],ev=entropyValue(kind);one('#v031S4EntropySpec').innerHTML=rows([['EntropySpec',spec.kind],['definition',spec.definition],['measure',spec.measure??'—'],['state/distribution',spec.state],['normalization',spec.normalization],['units',spec.units??'—'],['assumptions',spec.assumptions.join('; ')],['demo value',ev.value==null?'NOT COMPUTED':ev.value.toFixed(6)],['meaning',ev.meaning]]);
    one('#v031S4EntropyTable').innerHTML=ENTROPY_SPECS.map(x=>'<tr><td>'+esc(x.kind)+'</td><td>'+esc(x.definition+' · '+x.state+' · '+x.normalization)+'</td></tr>').join('')
  }

  async function buildBundle(){
    const rep=projectionSpec();fidelity=fidelityVector();rep.fidelityVector=fidelity.components;
    const geomSing=singularity||singularityProbe(),geomRicci=ricciState(num('#v031S4RicciT',.2)),surgery=surgerySpec(),entropy=JSON.parse(JSON.stringify(ENTROPY_SPECS.find(x=>x.kind===(one('#v031S4EntropyKind')?.value||'Shannon'))));
    entropy.revision=nextRev('entropies',entropy.id);
    const object={id:'obj-stage4-r5-curve',type:'ParametricCurve',baseField:'R',intrinsicDim:1,ambientDim:5,structures:['smooth-parametric-curve','Euclidean-ambient'],domainRef:'S1 parameter θ',revision:'obj-stage4-r5-curve:r1',parentRevision:null,assumptions:['θ modulo 2π'],provenance:{source:'Stage4 projection demo',capturedAt:now()},hash:'stage4-r5-demo'};
    const claim={id:'claim-stage4-projection-loss',statement:'The selected 5D→3D display is non-injective and loses x3,x4,x5; displayed similarity does not imply source equality or topological equivalence.',scope:'REPRESENTATION / IDENTIFIABILITY',assumptions:['projection π(x)=(x1,x2,0)'],dependsOn:[object.id,rep.id],status:'SUPPORTED',freshness:'CURRENT',revision:'claim-stage4-projection-loss:r1',parentRevision:null};
    const evidence={id:'ev-stage4-projection-guard',grade:'NUMERICAL INDICATOR',claimRef:claim.id,method:'explicit analytic projection collision θ~θ+π',inputsHash:'stage4-r5-projection',environmentHash:'browser:'+VERSION,residuals:{energyDefect:fidelity.components.energy.raw},errorBounds:null,assumptions:['reference curve formulas'],generatedAt:now(),adapterVersion:VERSION,upstreamRevisions:[object.revision,rep.revision],stale:false,freshness:'CURRENT',supportsCurrent:true,scope:'representation-identifiability demonstration'};
    return{bundleId:'stage4-b1-b6',objects:[object],representations:[rep],geometries:[geomSing,geomRicci,surgery],entropies:[entropy],claims:[claim],evidence:[evidence]}
  }
  async function commitBundle(){
    const b=await buildBundle();window.MathScopeV031Foundation?.commitTypedBundle?.(b,'Stage4 B1-B6 geometry demo');lastBundle=b;one('#v031S4BundleSummary').innerHTML=rows([['bundle',b.bundleId],['objects',b.objects.length],['representations',b.representations.length],['geometries',b.geometries.length],['entropies',b.entropies.length],['claims',b.claims.length],['evidence',b.evidence.length],['status','COMMITTED']]);return b
  }

  function runGate(){
    const rep=projectionSpec(),fid=fidelityVector(),g=singularity||singularityProbe(),lift=LIFTING,specs=ENTROPY_SPECS,visualGuard=rep.injectivityStatus==='NON_INJECTIVE'&&rep.inverseStatus==='NO UNIQUE INVERSE';
    gate=[
      {name:'B1 Projection typing',pass:rep.displayDim===3&&rep.sourceObjectRef&&rep.lostDimensions.length===3&&visualGuard,detail:'Object/Representation separated; lost coordinates + ambiguity recorded'},
      {name:'B2 Singularity status',pass:SINGULARITY_STATES.includes(g.status)&&g.evidenceGrade==='NUMERICAL INDICATOR'&&!['THEOREM-BACKED SINGULAR','FORMALLY PROVED'].includes(g.status),detail:'numerical refinement cannot auto-promote theorem/formal state'},
      {name:'B3 Fidelity vector',pass:fid.overallScore===null&&Object.keys(fid.components).length===7,detail:'7 component metrics/statuses; no 0-100 collapse'},
      {name:'B4 Lifting non-uniqueness',pass:lift.length===6&&lift.every(x=>x.warning&&x.assumptions.length),detail:'product/warped/fibration/symmetry/radial/spectral candidates all carry warnings'},
      {name:'B5 Entropy semantics',pass:specs.length===8&&new Set(specs.map(x=>x.definition)).size===8,detail:'Shannon/metric/topological/volume/spectral/Perelman F/W/vN kept distinct'},
      {name:'B6 Topology check',pass:visualGuard&&(fid.components.topology.status.includes('PENDING')||fid.components.topology.status.includes('EQUIVALENCE NOT ESTABLISHED')),detail:fid.components.topology.status.includes('PENDING')?'3D collision/similarity never promotes topology equivalence; B7 pending':'B7 finite topology evidence recorded; topology equivalence remains NOT ESTABLISHED'}
    ];
    const pass=gate.every(x=>x.pass),b7Api=window.MathScopeV031Stage4B7,b7Result=b7Api?.getResult?.()||null,b7Gate=b7Result?b7Api.runGate?.():null,fullPass=pass&&!!b7Gate?.pass;
    one('#v031S4Gate').textContent=pass?'B1-B6 PASS':'B GATE CHECK';one('#v031S4Gate').className='chip '+(pass?'ok':'warn');
    const coverage=one('#v031S4CoverageBadge');if(coverage){coverage.textContent=b7Result?(fullPass?'B1-B7 PASS':'B1-B7 CHECK'):(pass?'B1-B6 PASS · B7 READY':'B1-B7 CHECK');coverage.className='v031-pill '+(b7Result&&fullPass?'pass':'warn')}
    one('#v031S4Tests').innerHTML=gate.map(t=>'<div class="s4-test '+(t.pass?'pass':'fail')+'"><b>'+(t.pass?'PASS · ':'FAIL · ')+esc(t.name)+'</b><small>'+esc(t.detail)+'</small></div>').join('');return{pass,tests:JSON.parse(JSON.stringify(gate)),b7Pass:b7Gate?.pass??null,fullPass:b7Result?fullPass:false}
  }

  function topologyBlocker(){
    const blocker=one('#v031S4TopologyBlocker');
    if(!blocker)return; // B7 replaces this legacy placeholder.
    blocker.innerHTML=rows([['required','level-set extraction; components; H0/H1/H2; persistent homology; barcode; persistence diagram; pre/post projection comparison'],['current browser layer','semantic guard only — no fake persistence calculation'],['backend status','PENDING — real topology adapter required'],['architecture need','real topology adapter for cubical/simplicial/Vietoris-Rips workflows'],['decision point','select backend/library before B7 implementation'],['Stage4 status','B1-B6 implemented; B7 BLOCKED ON BACKEND CHOICE']])
  }
  function registerWebMCP(){const mc=document.modelContext;if(!mc?.registerTool)return;const safe=d=>{try{mc.registerTool(d,{signal:new AbortController().signal})}catch{}};safe({name:'mathscope.stage4.summary',description:'Read Stage4 B Geometry Engine status and current B7 blocker.',inputSchema:{type:'object',properties:{}},execute:async()=>({version:VERSION,gate,topologyBackend:'PENDING',singularity,fidelity})});safe({name:'mathscope.stage4.run_gate',description:'Run read-only B1-B6 semantic acceptance checks.',inputSchema:{type:'object',properties:{}},execute:async()=>runGate()})}

  function init(){
    if(!one('#v031Stage4Geometry'))return;
    one('#v031S4Epsilon')?.addEventListener('input',()=>{one('#v031S4EpsilonValue').textContent=num('#v031S4Epsilon',.1).toFixed(2);singularityProbe()});
    one('#v031S4ProbeSingularity')?.addEventListener('click',()=>{singularityProbe();runGate()});
    one('#v031S4RicciT')?.addEventListener('input',renderRicci);
    one('#v031S4EntropyKind')?.addEventListener('input',renderEntropy);one('#v031S4EntropySample')?.addEventListener('input',renderEntropy);
    one('#v031S4Commit')?.addEventListener('click',()=>commitBundle().catch(e=>{one('#v031S4BundleSummary').innerHTML=rows([['error',String(e.message||e)]])}));
    window.addEventListener('resize',()=>{drawSingularity();renderProjection();renderRicci()});
    singularityProbe();renderProjection();renderFidelity();renderLifting();renderRicci();renderEntropy();topologyBlocker();runGate();registerWebMCP();
    window.MathScopeV031Stage4={version:VERSION,singularityProbe,projectionSpec,fidelityVector,ricciState,surgerySpec,entropySpecs:ENTROPY_SPECS,liftingCandidates:LIFTING,runGate,commit:commitBundle,getBundle:()=>lastBundle};
    if(location.hash==='#stage4')setTimeout(()=>document.querySelector('[data-view-target="stage4-geometry"]')?.click(),500)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0)
})();
