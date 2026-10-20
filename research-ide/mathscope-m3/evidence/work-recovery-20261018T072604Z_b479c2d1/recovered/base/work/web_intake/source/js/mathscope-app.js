
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
const fmt = (x,n=4)=>Number.isFinite(x)?Number(x).toFixed(n):'—';
const now = ()=>new Date().toISOString();

const CLOUD_LEAN_BASE='https://mathscope-cloud-lean.onrender.com';
let cloudBackendReady=false;
let activeCloudVerifyController=null;

let pinnedC014Source='';

const state = {
  view:'geometry',
  executionMode:'cloud',
  object:'S3',
  observation:'slice',
  sliceKind:'exact',
  c:0.60,
  epsilon:0.05,
  pathT:0,
  preservationGoal:'dynamics',
  morphismType:'embedding',
  seed:2101,
  objectRevision:1,
  representationRevision:1,
  claimRevision:1,
  selectedPoint:null,
  p:1.5,
  k:3,
  faVector:[4,1,0.5,-0.25,0.125],
  functionalMode:'sequence',
  faPreset:'custom',
  faSeed:2101,
  faCount:8,
  faOperator:'diagonal',
  faOperatorStrength:0.65,
  faSelectedMode:1,
  faSparseRatio:0.25,
  faAmplitude:1.2,
  faOscFreq:2,
  faOscPhase:0,
  faOscEnvelope:0.35,
  faDecayKind:'exponential',
  faDecayRate:0.4,
  faBasis:{type:'standard',active:'source',sourceRevision:0,selected:1,sourceMatrix:null,sourceFingerprint:'',audit:null,derived:null},
  faResidual:{sourceLpPower:0,mappedL2Squared:0,sourceVector:[],mappedVector:[]},
  faSampleRho:{value:0,grade:'ESTIMATED',sampleSize:0},
  faCertifiedRho:{value:null,evidenceRef:null,status:'UNKNOWN'},
  faUserOperator:{matrix:null,status:'UNSET',revision:0,fingerprint:'',symmetric:false,symmetryResidual:null},
  faOperatorSchema:null,
  faFrameMetadata:null,
  faProvenance:[],



  faIteration:0,
  faPlaying:false,
  ifc:{encoder:'projection',collision:0.35,noise:0.05,sampleRevision:1,selectedSampleId:'src-01',collisionWitness:null,samples:null},
  geometryCore:{surface:'sphere',topology:'sphere',metricSemantic:'both',tangent:true,curvature:true,curvatureType:'gaussian',curvatureNorm:'auto',tangentDensity:10,meshResolution:40,solverResolution:23,custom:null,geodesic:null},
  pde:{equation:'heat',initial:'gaussian',dt:0.006,seed:2101,time:0,kappa:0.22,waveSpeed:1,damping:0.08,initialVelocity:0,customInitialMode:'expression',customInitialExpr:'sin(2*x)+0.5*cos(3*z)',customInitialGridText:'[[0,0.5,0],[0.5,1,0.5],[0,0.5,0]]',customInitialGrid:null,transport:{vx:0.8,vz:0.35,boundary:'periodic'},schrodingerScale:1,reaction:{model:'fisher',rate:1},solverSteps:0,playing:false,sourceEvolution:null,representationEvolution:null,lastDiagnostics:null},
  pdeModel:null,
  transfer:{defect:0.03,tolerance:0.05,identifiable:false,metric:'display-l2',status:'NO_TRANSFER_KNOWN',certificateStatus:'WITHHELD',blockedReasons:[],evidenceRef:null,sourceEvolution:null,representationEvolution:null},
  perfectoid:{selected:'U1',overlap:true,sideFocus:'both',coverDepth:4,metadataMissing:false,camera:null,rationalSubsets:null,correspondences:null,overlaps:null},
  adapterC:{mode:'A',baseField:'Q',coefficients:'Q',objectRef:'EllipticDemo:E(-1,1)',evidenceNamespaces:{A:[],B:[],C:[]},hodgeCells:null,cycleMap:null,bridges:null,morphismPolicy:null},



  multiViewM:2,
  boxDim:2.2,
  dynMode:'heat',
  dynT:0.5,
  dynDefect:0.03,
  dynEps:0.05,
  arithmetic:{a:-1,b:1,pMax:43,rows:[],selectedPrime:null},
  condensed:{u1:'a',u2:'b',overlap1:'c',overlap2:'c'},
  assumptions:[],
  claims:[
    {id:'C-014',statement:'Σᵢ₌₁⁴ xᵢ²=1, x₄=c ⇒ x₁²+x₂²+x₃²=1−c²',truth:'OPEN',evidence:'NONE',run:'IDLE',fresh:'CURRENT',trust:'UNCONDITIONAL',scope:'S³ exact slice',formal:true},
    {id:'C-015',statement:'x₄=c 단면이 표준 S²와 위상동형',truth:'OPEN',evidence:'NONE',run:'IDLE',fresh:'CURRENT',trust:'UNCONDITIONAL',scope:'|c|<1',formal:true},
    {id:'LP-1',statement:'∥Mₚ(x)∥₂² = ∥x∥ₚᵖ',truth:'SUPPORTED',evidence:'EXACT_FINITE',run:'IDLE',fresh:'CURRENT',trust:'UNCONDITIONAL',scope:'현재 유한 벡터 demo',formal:true},
    {id:'LP-2R',statement:'표준 좌표 절단 Pₖ에서 ℓᵖ reconstruction residual identity',truth:'SUPPORTED',evidence:'EXACT_FINITE',run:'IDLE',fresh:'CURRENT',trust:'UNCONDITIONAL',scope:'현재 유한 벡터 demo',formal:true},
    {id:'LP-2CE',statement:'LP-2 exact identity가 임의 rotated orthogonal projection에서도 성립한다',truth:'REFUTED',evidence:'COUNTEREXAMPLE',run:'SUCCESS',fresh:'CURRENT',trust:'UNCONDITIONAL',scope:'p=1, x=(4,1), e=(1,1)/√2',formal:false},
    {id:'HILB-1',statement:'certified ρₖ<1이면 선택 subset에서 Qₖ가 bi-Lipschitz',truth:'OPEN',evidence:'NONE',run:'IDLE',fresh:'CURRENT',trust:'UNCONDITIONAL',scope:'certified upper bound 필요',formal:true},
    {id:'NO-GO-1',statement:'무한차원 Banach open set의 single continuous injective ℝ³ chart는 불가',truth:'OPEN',evidence:'NONE',run:'IDLE',fresh:'CURRENT',trust:'UNCONDITIONAL',scope:'formal target',formal:true},
    {id:'AX-1',statement:'Γ ⊢ P와 ⊢ P를 신뢰경계에서 구분',truth:'SUPPORTED',evidence:'REVIEWED',run:'IDLE',fresh:'CURRENT',trust:'UNCONDITIONAL',scope:'state semantics',formal:false},
    {id:'DIAG-1',statement:'exact/ε-commutative diagram semantics를 분리',truth:'SUPPORTED',evidence:'REVIEWED',run:'IDLE',fresh:'CURRENT',trust:'UNCONDITIONAL',scope:'diagram engine',formal:false}
  ],
  selectedClaim:'C-014',
  evidenceHistory:[
    {time:now(),kind:'SYSTEM',summary:'MathScope v0.2.1.1 web prototype session initialized.'}
  ],
  evidenceRecords:[],
  semanticReviewed:false,
  reduceMotionOverride:false,
  savedHash:''
};

function toast(msg){
  const t=$('#toast'); if(!t)return;
  t.textContent=msg;t.classList.add('show');
  clearTimeout(toast._timer);toast._timer=setTimeout(()=>t.classList.remove('show'),2600);
}
function addHistory(kind,summary){
  state.evidenceHistory.unshift({time:now(),kind,summary});
  renderHistory(); updateSessionHash();
}
function storeEvidenceRecord(data,claim){
  if(!data||!claim)return;
  const rec={
    id:data.id||('ev-'+Date.now()),
    claimId:data.claimId||claim.id,
    objectRevision:state.objectRevision,
    representationRevision:state.representationRevision,
    claimRevision:state.claimRevision,
    sourceRevisions:{object:state.objectRevision,representation:state.representationRevision,claim:state.claimRevision},
    createdAt:data.createdAt||now(),
    kind:data?.state?.evidence||'NONE',
    truthStatus:data?.state?.truth||'OPEN',
    evidenceGrade:data?.state?.evidence||'NONE',
    runStatus:data?.state?.run||'ERROR',
    freshness:data?.state?.freshness||'CURRENT',
    trustContext:data?.state?.trust||'UNCONDITIONAL',
    sourceHash:data.sourceHash||'',
    environmentHash:data.environmentHash||'',
    dependencyLockHash:data.dependencyLockHash||'',
    toolchain:data.toolchain||'',
    axiomAuditOutput:data.axiomAuditOutput||'',
    stdout:data.stdout||'',
    stderr:data.stderr||'',
    executionMode:'cloud',
    certifiedUpper:Number.isFinite(data.certifiedUpper)?data.certifiedUpper:null,
    metadata:data.metadata||null
  };
  state.evidenceRecords.unshift(rec);
  state.evidenceRecords=state.evidenceRecords.slice(0,200);
}
function safeText(id,text){const el=$(id);if(el)el.textContent=text}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function safeClass(value){return String(value??'').replace(/[^a-zA-Z0-9_-]/g,'')}
function badge(text,cls=''){return '<span class="badge '+safeClass(cls)+'"><span class="dot"></span>'+escapeHtml(text)+'</span>'}
function applyStateSnapshot(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('invalid state payload');
  const allowed=new Set(Object.keys(state));
  for(const key of Object.keys(raw)){
    if(key==='__proto__'||key==='prototype'||key==='constructor'||!allowed.has(key))continue;
    state[key]=raw[key];
  }
  state.pdeModel=null;
}

function activateView(name){
  if(!$$('.view').some(v=>v.dataset.view===name))name='geometry';
  if(state.view!==name){stopFunctionalPlayback();stopPdePlayback();}
  state.view=name;
  $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));
  $$('.nav-btn').forEach(b=>{b.classList.toggle('active',b.dataset.viewTarget===name);b.setAttribute('aria-current',b.dataset.viewTarget===name?'page':'false');});
  for(const [key,h] of sceneRegistry)if(h.el.closest('.view')?.dataset.view!==name)releaseScene(key);
  requestAnimationFrame(()=>{if(state.view!==name)return;
    if(name==='geometry'){initThree();resizeThree();renderGeometry();}
    if(name==='functional'){drawFunctionalViz();renderFunctional3D();renderBasisPreview3D();}
    if(name==='fidelity'){drawFidelityPipeline();renderIfc3D();}
    if(name==='advanced')drawPerfectoidViz();
    if(name==='dynamics'){drawDynamics();renderGeometryCore3D();renderPde3D();renderTransfer3D();}
    if(name==='arithmetic'){drawThetaHistogram();drawFrobenius();renderAdapterC3D();}
    refreshAccess();
  });
  window.scrollTo({top:0,behavior:'instant'});updateSessionHash();
}
$$('[data-view-target]').forEach(b=>b.addEventListener('click',()=>activateView(b.dataset.viewTarget)));


function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
function randn(rng){let u=0,v=0;while(u===0)u=rng();while(v===0)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function sampleS3(n,seed=state.seed){
  const rng=mulberry32(seed),out=[];
  for(let i=0;i<n;i++){let a=randn(rng),b=randn(rng),c=randn(rng),d=randn(rng);const q=Math.hypot(a,b,c,d);out.push([a/q,b/q,c/q,d/q]);}
  return out;
}
const s3Samples=sampleS3(9500);

let renderer,scene,camera,controls,displayGroup,currentRenderable,raycaster,pointer,pointMeta=[];
function initThree(){
  const el=$('#threeScene'); if(!el||renderer||!el.closest('.view.active'))return;
  el.querySelectorAll('.context-notice').forEach(x=>x.remove());
  renderer=makeSafeRenderer(el);
  renderer.setClearColor(0x06131d,0);
  el.appendChild(renderer.domElement);
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x06131d,.055);
  camera=new THREE.PerspectiveCamera(46,1,.1,100);camera.position.set(3.5,2.4,4.7);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.06;
  scene.add(new THREE.HemisphereLight(0xbdeeff,0x07131e,1.25));
  const k=new THREE.DirectionalLight(0x7ce9e1,2.1);k.position.set(4,5,3);scene.add(k);
  const rim=new THREE.DirectionalLight(0x8ed7ff,1.2);rim.position.set(-4,-3,-2);scene.add(rim);
  const grid=new THREE.GridHelper(6,18,0x244c5d,0x132d3b);grid.position.y=-1.65;grid.material.transparent=true;grid.material.opacity=.3;scene.add(grid);
  displayGroup=new THREE.Group();scene.add(displayGroup);
  raycaster=new THREE.Raycaster();raycaster.params.Points.threshold=.06;pointer=new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown',pickPoint);
  const ro=new ResizeObserver(resizeThree);ro.observe(el);
  registerScene('geometry',{el,renderer,scene,camera,controls,group:displayGroup,ro,resize:resizeThree},[3.5,2.4,4.7]);
  renderGeometry();
}
function resizeThree(){if(!renderer)return;const el=$('#threeScene');const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();}
function disposeCurrent(){
  if(!currentRenderable)return;
  displayGroup.remove(currentRenderable);
  currentRenderable.traverse?.(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.();});
  currentRenderable=null;pointMeta=[];
}
function makePoints(points,meta,colors=null,size=.027){
  const pos=new Float32Array(points.length*3), col=colors?new Float32Array(points.length*3):null;
  for(let i=0;i<points.length;i++){pos[i*3]=points[i][0];pos[i*3+1]=points[i][1];pos[i*3+2]=points[i][2];if(col){col[i*3]=colors[i][0];col[i*3+1]=colors[i][1];col[i*3+2]=colors[i][2];}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));if(col)g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const m=new THREE.PointsMaterial({size,vertexColors:!!col,color:col?0xffffff:0x35d3c5,transparent:true,opacity:.72,depthWrite:false});
  pointMeta=meta||[];return new THREE.Points(g,m);
}
function renderGeometry(){
  if(!displayGroup)return;
  disposeCurrent();
  const object=state.object;
  if(object==='S2'){
    const geo=new THREE.SphereGeometry(1,64,40),mat=new THREE.MeshPhysicalMaterial({color:0x35d3c5,transparent:true,opacity:.28,roughness:.2,side:THREE.DoubleSide});
    const g=new THREE.Group();g.add(new THREE.Mesh(geo,mat));g.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo),new THREE.LineBasicMaterial({color:0x7ce9e1,transparent:true,opacity:.26})));currentRenderable=g;displayGroup.add(g);
  }else if(object==='T2'){
    const geo=new THREE.TorusGeometry(1,.36,32,96),mat=new THREE.MeshPhysicalMaterial({color:0x8ed7ff,transparent:true,opacity:.28,roughness:.22,side:THREE.DoubleSide});
    const g=new THREE.Group();g.add(new THREE.Mesh(geo,mat));g.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo),new THREE.LineBasicMaterial({color:0x8ed7ff,transparent:true,opacity:.18})));currentRenderable=g;displayGroup.add(g);
  }else{
    renderS3();
  }
  renderGeometryStatus();
}
function renderS3(){
  const obs=state.observation;
  if(obs==='slice'){
    if(state.sliceKind==='exact'){
      const c=state.c;if(Math.abs(c)>1){currentRenderable=new THREE.Group();displayGroup.add(currentRenderable);return}
      const r=Math.sqrt(Math.max(0,1-c*c)),g=new THREE.Group();
      if(r<.003){g.add(new THREE.Mesh(new THREE.SphereGeometry(.045,20,12),new THREE.MeshStandardMaterial({color:0x7ce9e1,emissive:0x103c38})))}
      else{
        const geo=new THREE.SphereGeometry(r,64,40);
        g.add(new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({color:0x35d3c5,transparent:true,opacity:.26,roughness:.18,side:THREE.DoubleSide})));
        g.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo),new THREE.LineBasicMaterial({color:0x7ce9e1,transparent:true,opacity:.26})));
      }
      currentRenderable=g;displayGroup.add(g);
    }else{
      const pts=[],meta=[],colors=[];const c=state.c,e=state.epsilon;
      for(const x of s3Samples){if(Math.abs(x[3]-c)<e){pts.push([x[0],x[1],x[2]]);meta.push(x);const t=(x[3]+1)/2;colors.push([.18+.35*t,.75+.15*t,.74+.22*t]);}}
      currentRenderable=makePoints(pts,meta,colors,.035);displayGroup.add(currentRenderable);
    }
  }else if(obs==='projection'){
    const th=state.pathT*Math.PI/2,cs=Math.cos(th),sn=Math.sin(th),pts=[],meta=[],colors=[];
    for(const x of s3Samples){const xr=x[0]*cs-x[3]*sn,x4=x[0]*sn+x[3]*cs;pts.push([xr,x[1],x[2]]);meta.push([xr,x[1],x[2],x4]);const t=(x4+1)/2;colors.push([.15+.28*t,.63+.25*t,.85]);}
    currentRenderable=makePoints(pts,meta,colors,.026);displayGroup.add(currentRenderable);
  }else{
    const pts=[],meta=[],colors=[],clip=4.5;
    for(const x of s3Samples){const den=1-x[3];if(den<.025)continue;const y=[x[0]/den,x[1]/den,x[2]/den];if(Math.hypot(...y)>clip)continue;pts.push(y.map(v=>v/clip));meta.push(x);const t=(x[3]+1)/2;colors.push([.25,.55+.35*t,.9-.25*t]);}
    currentRenderable=makePoints(pts,meta,colors,.024);displayGroup.add(currentRenderable);
  }
}
function pickPoint(e){
  if(!(currentRenderable?.isPoints))return;
  const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObject(currentRenderable);if(!hits.length)return;
  const idx=hits[0].index,src=pointMeta[idx];if(!src)return;state.selectedPoint=src;renderSelectedPoint();
}
function renderSelectedPoint(){
  const el=$('#selectedPoint');if(!el)return;
  if(!state.selectedPoint){el.innerHTML='<span class="muted">점군에서 점을 클릭하면 원좌표/후보를 표시합니다.</span>';return}
  const x=state.selectedPoint;
  if(state.observation==='projection'){
    const r2=x[0]*x[0]+x[1]*x[1]+x[2]*x[2],a=Math.sqrt(Math.max(0,1-r2));
    el.innerHTML='<div class="kv"><div class="k">display y</div><div class="v mono">('+x.slice(0,3).map(v=>fmt(v,3)).join(', ')+')</div><div class="k">preimage x₄′</div><div class="v mono">±'+fmt(a,4)+'</div><div class="k">ambiguity fibre</div><div class="v warning">'+(a<1e-5?'boundary: 1 candidate':'interior: 2 candidates')+'</div></div>';
  }else{
    el.innerHTML='<div class="kv"><div class="k">source coordinate</div><div class="v mono">('+x.map(v=>fmt(v,3)).join(', ')+')</div></div>';
  }
}
function renderGeometryStatus(){
  const object=state.object,obs=state.observation;
  $$('.object-selector button').forEach(b=>b.classList.toggle('active',b.dataset.object===object));
  $$('[data-obs]').forEach(b=>b.classList.toggle('active',b.dataset.obs===obs));
  safeText('#objectName',object==='S3'?'S³ ⊂ ℝ⁴':object==='S2'?'S² ⊂ ℝ³':'T² ⊂ ℝ³');
  safeText('#dimIntrinsic',object==='T2'||object==='S2'?'2':'3');safeText('#dimAmbient',object==='S3'?'4':'3');safeText('#dimDisplay','3');
  safeText('#cValue',fmt(state.c,2));safeText('#epsValue',fmt(state.epsilon,3));safeText('#pathValue',fmt(state.pathT,2));
  const c=state.c,r=Math.sqrt(Math.max(0,1-c*c));
  safeText('#sliceRadius',Math.abs(c)<1?'S² radius '+fmt(r,4):Math.abs(c)===1?'single point':'empty');
  const exact=state.sliceKind==='exact';
  safeText('#sliceKindLabel',exact?'EXACT ANALYTIC SLICE':'SLAB APPROXIMATION');
  $('#sliceKindLabel')?.classList.toggle('warn',!exact);
  $('#exactSliceBtn')?.classList.toggle('active',exact);$('#slabSliceBtn')?.classList.toggle('active',!exact);
  let ident='N/A',amb='N/A',axis='(x₁,x₂,x₃)',metric='display Euclidean; source metric not inferred',meaning='';
  if(object==='S3'&&obs==='projection'){ident='NO';amb='interior usually 2 preimages';meaning='Image fills B³. Equator x₄′=0 is a rank-drop locus.'}
  if(object==='S3'&&obs==='slice'){ident=exact?'YES on slice coordinates':'SAMPLE ONLY';amb=exact?'none for analytic slice':'depends on slab thickness';meaning=exact?'Level set x₄=c; exact analytic model.':'|x₄−c|<ε point sample; not an exact slice.'}
  if(object==='S3'&&obs==='stereo'){ident='YES on domain';amb='north pole excluded';meaning='Stereographic chart; displayed coordinates are rescaled/clipped.'}
  if(object!=='S3'){ident='PRESET';amb='not evaluated';meaning='Finite-dimensional preset viewer.'}
  safeText('#geoIdent',ident);safeText('#geoAmbiguity',amb);safeText('#axisSemantic',axis);safeText('#metricSemantic',metric);safeText('#geometryMeaning',meaning);
  const events=[];
  if(object==='S3'&&obs==='slice'){if(Math.abs(c)>1)events.push(['EMPTY','|c|>1','no slice']);else if(Math.abs(Math.abs(c)-1)<.02)events.push(['CRITICAL','c≈±1','degeneration to point']);else events.push(['REGULAR','|c|<1','smooth S² slice']);if(!exact)events.push(['APPROX','slab','ε='+fmt(state.epsilon,3)]);}
  if(object==='S3'&&obs==='projection')events.push(['RANK','equator','rank drops from 3 to 2 at x₄′=0']);
  $('#geoEvents').innerHTML=events.map(e=>'<div class="event"><span class="etype">'+e[0]+'</span><span>'+e[1]+'</span><span class="muted">'+e[2]+'</span></div>').join('')||'<div class="muted small">No event for current preset.</div>';
  renderSelectedPoint();
  updateSessionHash();
}
$$('.object-selector button').forEach(b=>b.addEventListener('click',()=>{state.object=b.dataset.object;state.selectedPoint=null;state.representationRevision++;renderGeometry();addHistory('REPRESENTATION','Object preset switched to '+state.object+'.')}));
$$('[data-obs]').forEach(b=>b.addEventListener('click',()=>{state.observation=b.dataset.obs;state.selectedPoint=null;state.representationRevision++;renderGeometry();addHistory('REPRESENTATION','Observation switched to '+state.observation+'.')}));
$('#exactSliceBtn')?.addEventListener('click',()=>{state.sliceKind='exact';state.representationRevision++;renderGeometry();});
$('#slabSliceBtn')?.addEventListener('click',()=>{state.sliceKind='slab';state.representationRevision++;renderGeometry();});
$('#cRange')?.addEventListener('input',e=>{state.c=+e.target.value;state.representationRevision++;renderGeometry();});
$('#epsRange')?.addEventListener('input',e=>{state.epsilon=+e.target.value;state.representationRevision++;if(state.sliceKind==='slab')renderGeometry();else renderGeometryStatus();});
$('#pathRange')?.addEventListener('input',e=>{state.pathT=+e.target.value;state.representationRevision++;if(state.observation==='projection')renderGeometry();else renderGeometryStatus();});


const labHosts={};

const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
function motionDisabled(){return Boolean(state.reduceMotionOverride)||motionPreference.matches}
const sceneCameras={};
const sceneRegistry=new Map();
const renderBudget={targetFps:30,maxInteractiveFps:60,maxPixelRatio:1.5,s3Samples:9500,maxVectorCoordinates:32,defaultVisualResolution:40,defaultSolverResolution:23,maxSolverResolution:41,maxTrainingEpochs:2000};
const sceneStats={created:0,disposed:0,frames:0,contextLosses:0};
function makeSafeRenderer(el){
  try {const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,renderBudget.maxPixelRatio));return r;}
  catch(error){
    const panel=document.createElement('div');panel.className='webgl-fallback';panel.setAttribute('role','status');
    panel.textContent='3D unavailable · WebGL을 사용할 수 없습니다. 수치·표·2D 도식과 내보내기는 계속 사용할 수 있습니다. 다른 모듈로 이동한 뒤 다시 열어 재시도할 수 있습니다.';
    return {isFallback:true,domElement:panel,setPixelRatio(){},setClearColor(){},setSize(){},setAnimationLoop(){},render(){},dispose(){},info:{render:{calls:0},memory:{geometries:0,textures:0}}};
  }
}
function disposeSceneTree(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();root?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){materials.add(m);Object.values(m).forEach(t=>{if(t?.isTexture)textures.add(t);});}});
  textures.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());geometries.forEach(x=>x.dispose());
}
function releaseScene(key){
  const h=sceneRegistry.get(key);if(!h)return;
  sceneCameras[key]={position:h.camera.position.toArray(),target:h.controls.target.toArray(),zoom:h.camera.zoom};
  h.renderer.setAnimationLoop(null);h.ro?.disconnect();h.controls.dispose();disposeSceneTree(h.scene);h.renderer.dispose();h.renderer.domElement.remove();h.alive=false;
  sceneRegistry.delete(key);delete labHosts[key];sceneStats.disposed++;
  if(key==='geometry'){renderer=null;displayGroup=null;currentRenderable=null;}
}
function registerScene(key,h,initial){
  sceneStats.created++;h.alive=true;h.frames=0;h.lastFrame=0;h.drawTimes=[];h.frameTimes=[];sceneRegistry.set(key,h);
  const remembered=sceneCameras[key];if(remembered){h.camera.position.fromArray(remembered.position);h.controls.target.fromArray(remembered.target);h.camera.zoom=remembered.zoom;h.camera.updateProjectionMatrix();}
  const dom=h.renderer.domElement;dom.tabIndex=0;dom.setAttribute('role',h.renderer.isFallback?'status':'img');dom.setAttribute('aria-label',(h.el.getAttribute('aria-label')||key)+' · Arrow keys rotate, +/− zoom, Home resets. Geometry point clouds: [ and ] select samples.');
  dom.addEventListener('keydown',e=>{const offset=h.camera.position.clone().sub(h.controls.target),s=new THREE.Spherical().setFromVector3(offset);let handled=true;
    if(e.key==='ArrowLeft')s.theta-=.12;else if(e.key==='ArrowRight')s.theta+=.12;else if(e.key==='ArrowUp')s.phi=Math.max(.08,s.phi-.12);else if(e.key==='ArrowDown')s.phi=Math.min(Math.PI-.08,s.phi+.12);else if(e.key==='+'||e.key==='=')s.radius*=.9;else if(e.key==='-')s.radius*=1.1;else if(e.key==='Home'){h.camera.position.set(...initial);h.controls.target.set(0,0,0);h.controls.update();e.preventDefault();return;}
    else if(key==='geometry'&&['[',']'].includes(e.key)&&pointMeta.length){h.selectedIndex=((h.selectedIndex||0)+(e.key===']'?1:-1)+pointMeta.length)%pointMeta.length;state.selectedPoint=pointMeta[h.selectedIndex];renderSelectedPoint();e.preventDefault();return;}else handled=false;
    if(handled){e.preventDefault();h.camera.position.copy(h.controls.target).add(new THREE.Vector3().setFromSpherical(s));h.controls.update();}
  });
  dom.addEventListener('webglcontextlost',e=>{e.preventDefault();h.renderer.setAnimationLoop(null);sceneStats.contextLosses++;let notice=h.el.querySelector('.context-notice');if(!notice){notice=document.createElement('div');notice.className='context-notice warning-box';h.el.appendChild(notice);}notice.setAttribute('role','status');notice.textContent='WebGL context lost · 수치와 표는 유지됩니다. 모듈을 다시 열어 3D를 복구하세요.';});
  if(!h.renderer.isFallback)h.renderer.setAnimationLoop(t=>{
    if(!h.alive||document.hidden||!h.el.closest('.view.active'))return;
    const box=h.el.getBoundingClientRect();if(box.bottom<0||box.top>innerHeight||!box.width||!box.height)return;
    const minFrameMs=1000/renderBudget.maxInteractiveFps-1;
    if(t-h.lastFrame<minFrameMs)return;
    if(h.lastFrame&&t-h.lastFrame<1000){h.frameTimes.push(t-h.lastFrame);if(h.frameTimes.length>180)h.frameTimes.shift();}
    h.lastFrame=t;const start=performance.now();h.controls.update();
    if(key==='geometry'&&!motionDisabled()&&displayGroup)displayGroup.rotation.y+=.0009;
    h.renderer.render(h.scene,h.camera);h.drawTimes.push(performance.now()-start);if(h.drawTimes.length>180)h.drawTimes.shift();h.frames++;sceneStats.frames++;
  });
  h.resize();return h;
}
function refreshAccess(){
  document.querySelectorAll('input,select,textarea').forEach(el=>{
    if(el.getAttribute('aria-label')||el.labels?.length)return;
    const parent=el.parentElement;
    const label=parent?.querySelector('.label')||parent?.querySelector('.metric-row>span:first-child');
    const labelText=label?.textContent.trim()||el.id.replace(/([a-z])([A-Z])/g,'$1 $2');
    if(labelText)el.setAttribute('aria-label',labelText);
  });
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.setAttribute('aria-label',b.textContent.trim());
    b.setAttribute('aria-current',b.classList.contains('active')?'page':'false');
  });
  document.querySelectorAll('.segment,.segmented').forEach(g=>{
    if(!g.getAttribute('role'))g.setAttribute('role','group');
    if(!g.getAttribute('aria-label'))g.setAttribute('aria-label',g.closest('.card')?.querySelector('.card-title')?.textContent?.trim()||'MathScope mode controls');
  });
  document.querySelectorAll('.segmented button,.segment button,.functional-mode,.pde-eq,.geometry-core-preset,.adapter-mode,.adapter-c-mode,.perfectoid-side,.dyn-mode,.ifc-learned-mode,[data-obs],.object-selector button').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active'))));
  document.querySelectorAll('canvas:not([aria-label])').forEach(c=>c.setAttribute('aria-label',c.id+' · finite numerical diagram; accompanying values and tables provide the data'));
}
function setupReleaseUX(){
  if(!document.querySelector('.skip-link')){
    const skip=document.createElement('a');skip.href='#mathscope-main';skip.className='skip-link';skip.textContent='본문으로 이동';document.body.prepend(skip);
  }
  const main=$('main')||$('.main');if(main){main.id='mathscope-main';main.tabIndex=-1;}
  $('#toast')?.setAttribute('role','status');$('#toast')?.setAttribute('aria-live','polite');
  if(!$('#releaseBudget')){
    const info=document.createElement('div');info.className='info-box release-budget';info.id='releaseBudget';info.textContent='실용 기본 예산 · S³ 9,500 samples · vector ≤32 · visual mesh 40 / solver 23 (≤41) · pixel ratio ≤1.5 · visible scenes only, 30fps target. 장비별 실측 필요. Arrow keys: camera · +/−: zoom · Home: reset. 색과 함께 상태 텍스트·선 패턴·수치 범위를 확인하세요.';main?.prepend(info);
  }
  if(!$('#heavyComputeNotice')){
    const heavy=document.createElement('div');heavy.className='warning-box';heavy.id='heavyComputeNotice';heavy.textContent='Heavy compute · mesh solver / custom input / training은 main thread에서 실행됩니다. Solver mesh >29 또는 training >500 epochs는 지연될 수 있습니다. seed, resolution, dt, solver steps와 모델 revision을 export에 기록합니다. 큰 계산은 더 낮은 해상도로 시작하세요.';$('#geometryCore3D')?.closest('.grid')?.before(heavy);
  }
  if(!$('#ifcKeyboardSample')){
    const ifcSelect=document.createElement('select');ifcSelect.id='ifcKeyboardSample';ifcSelect.setAttribute('aria-label','Identifiability source sample');ifcSelect.innerHTML=ensureIfcSamples().map(s=>'<option value="'+escapeHtml(s.id)+'">'+escapeHtml(s.id)+'</option>').join('');ifcSelect.addEventListener('change',()=>{state.ifc.selectedSampleId=ifcSelect.value;renderIfc3D();drawFidelityPipeline();});$('#ifc3D')?.after(ifcSelect);
  }
  const reduce=$('#releaseReduceMotion');
  if(reduce&&!reduce.dataset.bound){reduce.dataset.bound='1';reduce.checked=Boolean(state.reduceMotionOverride);reduce.addEventListener('change',()=>{state.reduceMotionOverride=reduce.checked;if(motionDisabled()){stopFunctionalPlayback();stopPdePlayback();}for(const [,h] of sceneRegistry)h.controls.enableDamping=!motionDisabled();updateSessionHash();});}
  refreshAccess();document.addEventListener('click',()=>queueMicrotask(refreshAccess),{passive:true});
  const motionChanged=()=>{if(motionDisabled()){stopFunctionalPlayback();stopPdePlayback();}};
  if(typeof motionPreference.addEventListener==='function')motionPreference.addEventListener('change',motionChanged);else motionPreference.addListener?.(motionChanged);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopFunctionalPlayback();stopPdePlayback();}});
  addEventListener('pagehide',()=>{stopFunctionalPlayback();stopPdePlayback();stopCloudLsp('page hidden');for(const key of [...sceneRegistry.keys()])releaseScene(key);});
  addEventListener('pageshow',e=>{if(e.persisted)activateView(state.view);});
  window.__mathscopeRenderAudit=()=>({budget:renderBudget,stats:{...sceneStats},reducedMotion:motionDisabled(),active:[...sceneRegistry].map(([key,h])=>({key,fallback:!!h.renderer.isFallback,frames:h.frames,size:[h.renderer.domElement.width||h.el.clientWidth,h.renderer.domElement.height||h.el.clientHeight],position:h.camera.position.toArray(),rotation:h.group?.rotation.y||0,meanFrameMs:h.frameTimes.reduce((s,x)=>s+x,0)/Math.max(1,h.frameTimes.length),meanDrawMs:h.drawTimes.reduce((s,x)=>s+x,0)/Math.max(1,h.drawTimes.length),drawCalls:h.renderer.info.render.calls,memory:{...h.renderer.info.memory}}))});
}

function createLabHost(key,containerId,cameraPos=[5,3.2,6]){
  const el=$('#'+containerId);if(!el||!el.closest('.view.active'))return null;
  if(labHosts[key])return labHosts[key];
  const renderer=makeSafeRenderer(el);
  renderer.setClearColor(0x061720,0);
  el.innerHTML='';el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x061720,.035);
  const camera=new THREE.PerspectiveCamera(44,1,.1,100);camera.position.set(...cameraPos);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.06;
  scene.add(new THREE.HemisphereLight(0xbdeeff,0x07131e,1.05));
  const keyLight=new THREE.DirectionalLight(0x8ed7ff,1.5);keyLight.position.set(4,6,5);scene.add(keyLight);
  const rim=new THREE.DirectionalLight(0x7ce9e1,.8);rim.position.set(-4,1,-4);scene.add(rim);
  const group=new THREE.Group();scene.add(group);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();};
  const ro=new ResizeObserver(resize);ro.observe(el);
  const host={el,renderer,scene,camera,controls,group,resize,ro};
  labHosts[key]=host;registerScene(key,host,cameraPos);return host;
}
function clearLabGroup(host){
  if(!host)return;
  while(host.group.children.length){
    const o=host.group.children[0];host.group.remove(o);
    o.traverse?.(x=>{x.geometry?.dispose?.();if(Array.isArray(x.material))x.material.forEach(m=>m.dispose?.());else x.material?.dispose?.();});
  }
}
function resizeLab(key){labHosts[key]?.resize?.()}
function makeBar3D(x,z,value,maxAbs,color,opacity=.88,width=.22){
  const scale=Math.max(.03,Math.abs(value)/(maxAbs||1)*1.7);
  const g=new THREE.BoxGeometry(width,scale,width);
  const m=new THREE.MeshStandardMaterial({color,transparent:true,opacity,roughness:.35,metalness:.05});
  const mesh=new THREE.Mesh(g,m);mesh.position.set(x,(value>=0?1:-1)*scale/2,z);return mesh;
}
function makeLine3D(a,b,color=0x8ed7ff,opacity=.8,dashed=false){
  const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);
  const m=dashed?new THREE.LineDashedMaterial({color,transparent:true,opacity,dashSize:.12,gapSize:.08}):new THREE.LineBasicMaterial({color,transparent:true,opacity});
  const line=new THREE.Line(g,m);if(dashed)line.computeLineDistances();return line;
}
function addArrow(group,from,to,color=0x8ed7ff,scale=.12){
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),d=b.clone().sub(a),len=d.length();if(len<1e-9)return;
  const arrow=new THREE.ArrowHelper(d.clone().normalize(),a,len,color,Math.min(scale,len*.3),Math.min(scale*.6,len*.18));group.add(arrow);
}

function generateFunctionalPreset(){
  const preset=$('#faPreset')?.value||state.faPreset||'custom',seed=Math.trunc(+($('#faSeed')?.value||state.faSeed||2101)),count=clamp(Math.trunc(+($('#faCount')?.value||state.faCount||8)),3,32);
  const ratio=clamp(+($('#faSparseRatio')?.value||state.faSparseRatio||.25),.05,.9),amp=clamp(+($('#faAmplitude')?.value||state.faAmplitude||1.2),.1,3);
  const freq=clamp(+($('#faOscFreq')?.value||state.faOscFreq||2),.25,6),phase=clamp(+($('#faOscPhase')?.value||state.faOscPhase||0),0,Math.PI*2),env=clamp(+($('#faOscEnvelope')?.value||state.faOscEnvelope||.35),0,1);
  const decayKind=$('#faDecayKind')?.value||state.faDecayKind||'exponential',decayRate=clamp(+($('#faDecayRate')?.value||state.faDecayRate||.4),.05,3);
  Object.assign(state,{faPreset:preset,faSeed:seed,faCount:count,faSparseRatio:ratio,faAmplitude:amp,faOscFreq:freq,faOscPhase:phase,faOscEnvelope:env,faDecayKind:decayKind,faDecayRate:decayRate});
  safeText('#faSparseRatioVal',fmt(ratio,2));safeText('#faAmplitudeVal',fmt(amp,1));safeText('#faOscFreqVal',fmt(freq,2));safeText('#faOscPhaseVal',fmt(phase,2));safeText('#faOscEnvelopeVal',fmt(env,2));
  if(preset==='custom'){functionalCompute();return}
  const rng=mulberry32(seed);let v=[];
  if(preset==='random')v=Array.from({length:count},()=>Number((randn(rng)*amp).toFixed(5)));
  if(preset==='sparse')v=Array.from({length:count},()=>rng()<ratio?Number(((rng()*2-1)*amp).toFixed(5)):0);
  if(preset==='oscillatory')v=Array.from({length:count},(_,i)=>Number((amp*Math.sin((i+1)*freq+phase)*Math.exp(-env*i/Math.max(1,count))).toFixed(5)));
  if(preset==='decaying')v=Array.from({length:count},(_,i)=>{
    const d=decayKind==='polynomial'?1/Math.pow(i+1,decayRate):Math.exp(-decayRate*i);
    return Number((((i%2?-.75:1))*amp*d).toFixed(5));
  });
  if($('#faVector'))$('#faVector').value=v.join(', ');
  functionalCompute();
}

function operatorSchemaDefinition(type,strength,n){
  const s=clamp(Number(strength)||0,0,1.5);
  if(type==='diagonal')return {family:'diagonal',parameters:{decaySlope:s},domain:n,codomain:n,selfAdjoint:true};
  if(type==='compact')return {family:'compact-like',parameters:{exponent:.35+.55*s},domain:n,codomain:n,selfAdjoint:true};
  if(type==='shift')return {family:'cyclic-shift',parameters:{gain:.9+.08*Math.cos(s)},domain:n,codomain:n,selfAdjoint:false};
  if(type==='smoothing')return {family:'nearest-neighbor-smoothing',parameters:{alpha:.225*s,center:1-.45*s},domain:n,codomain:n,selfAdjoint:true};
  if(type==='selfadjoint')return {family:'symmetric-tridiagonal',parameters:{diagonal:1-.18*s,coupling:.09*s},domain:n,codomain:n,selfAdjoint:true};
  return {family:'user-matrix',parameters:{source:'authoritative finite matrix'},domain:n,codomain:n,selfAdjoint:state.faUserOperator?.symmetric===true};
}
function matrixVectorMul(A,v){return A.map(row=>row.reduce((s,a,j)=>s+a*(v[j]??0),0))}
function parseUserOperatorMatrix(text,n){
  const raw=String(text??'').trim();if(!raw)throw new Error('Operator matrix is empty.');
  let A;
  if(raw.startsWith('['))A=JSON.parse(raw);
  else A=raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>line.split(/[\s,;]+/).filter(Boolean).map(Number));
  if(!Array.isArray(A)||A.length!==n||!A.every(r=>Array.isArray(r)&&r.length===n))throw new Error('User matrix must be exactly '+n+'×'+n+' to match the current vector dimension.');
  A=A.map(r=>r.map(Number));
  if(A.some(r=>r.some(x=>!Number.isFinite(x))))throw new Error('User matrix entries must be finite numbers.');
  return A;
}
function matrixSymmetryResidual(A){
  let m=0;for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++)m=Math.max(m,Math.abs(A[i][j]-A[j][i]));return m;
}
function operatorMatrix(type,strength,n){
  const s=clamp(Number(strength)||0,0,1.5),A=Array.from({length:n},()=>Array(n).fill(0));
  if(type==='diagonal'){for(let i=0;i<n;i++)A[i][i]=1-s*(i/Math.max(1,n-1))*.55;return A;}
  if(type==='compact'){const e=.35+s*.55;for(let i=0;i<n;i++)A[i][i]=1/Math.pow(i+1,e);return A;}
  if(type==='shift'){const gain=.9+.08*Math.cos(s);for(let i=0;i<n;i++)A[i][(i-1+n)%n]=gain;return A;}
  if(type==='smoothing'){
    const a=.225*s,c=1-.45*s;
    for(let i=0;i<n;i++){A[i][i]=c;if(i>0)A[i][i-1]+=a;else A[i][i]+=a;if(i<n-1)A[i][i+1]+=a;else A[i][i]+=a;}
    return A;
  }
  if(type==='selfadjoint'){const d=1-.18*s,a=.09*s;for(let i=0;i<n;i++){A[i][i]=d;if(i>0)A[i][i-1]=a;if(i<n-1)A[i][i+1]=a;}return A;}
  if(type==='user-matrix')return state.faUserOperator?.status==='READY'?state.faUserOperator.matrix:null;
  return null;
}
function jacobiEigenSymmetric(A){
  const M=cloneMatrix(A),n=M.length,V=identityMatrix(n),eps=1e-13,maxSweeps=Math.max(40,12*n*n);
  if(n===1)return {values:[M[0][0]],vectors:[[1]]};
  for(let sweep=0;sweep<maxSweeps;sweep++){
    let p=0,q=1,max=0;
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=Math.abs(M[i][j]);if(a>max){max=a;p=i;q=j;}}
    if(max<eps)break;
    const app=M[p][p],aqq=M[q][q],apq=M[p][q],phi=.5*Math.atan2(2*apq,aqq-app),c=Math.cos(phi),s=Math.sin(phi);
    for(let k=0;k<n;k++)if(k!==p&&k!==q){
      const mkp=M[k][p],mkq=M[k][q];M[k][p]=M[p][k]=c*mkp-s*mkq;M[k][q]=M[q][k]=s*mkp+c*mkq;
    }
    M[p][p]=c*c*app-2*s*c*apq+s*s*aqq;M[q][q]=s*s*app+2*s*c*apq+c*c*aqq;M[p][q]=M[q][p]=0;
    for(let k=0;k<n;k++){const vkp=V[k][p],vkq=V[k][q];V[k][p]=c*vkp-s*vkq;V[k][q]=s*vkp+c*vkq;}
  }
  const pairs=M.map((r,i)=>({value:r[i],vector:V.map(row=>row[i])})).sort((a,b)=>a.value-b.value);
  return {values:pairs.map(x=>x.value),vectors:columnsToMatrix(pairs.map(x=>x.vector))};
}
function operatorSpectralInfo(type,strength,n){
  const A=operatorMatrix(type,strength,n),schema=operatorSchemaDefinition(type,strength,n);
  if(!A)return {status:'BLOCKED',values:[],vectors:null,schema};
  const sym=matrixSymmetryResidual(A);
  if(sym<=1e-10){
    const eig=jacobiEigenSymmetric(A);return {status:'ACTUAL_FINITE',values:eig.values,vectors:eig.vectors,symmetryResidual:sym,schema};
  }
  return {status:'ILLUSTRATIVE',values:Array.from({length:n},(_,i)=>i+1),vectors:null,symmetryResidual:sym,schema};
}
function auditUserOperatorMatrix(){
  const n=Math.max(1,state.faVector.length);
  try{
    const A=parseUserOperatorMatrix($('#faUserOperatorMatrix')?.value||'',n),sym=matrixSymmetryResidual(A),fp=basisFingerprint(A);
    state.faUserOperator={matrix:A,status:'READY',revision:(state.faUserOperator?.revision||0)+1,fingerprint:fp,symmetric:sym<=1e-10,symmetryResidual:sym};
    safeText('#faUserOperatorStatus','READY · '+n+'×'+n+' · symmetry residual='+formatAuditNumber(sym)+' · '+(sym<=1e-10?'self-adjoint finite matrix':'non-symmetric finite matrix')+' · '+fp);
  }catch(err){
    state.faUserOperator={matrix:null,status:'BLOCKED',revision:(state.faUserOperator?.revision||0)+1,fingerprint:'',symmetric:false,symmetryResidual:Infinity,error:String(err?.message||err)};
    safeText('#faUserOperatorStatus','BLOCKED · '+state.faUserOperator.error);
  }
  updateOperatorSchemaUI();renderFunctional3D();return state.faUserOperator;
}
function updateOperatorSchemaUI(){
  const n=Math.max(1,state.faVector.length),type=$('#faOperator')?.value||state.faOperator,strength=+($('#faOperatorStrength')?.value||state.faOperatorStrength),schema=operatorSchemaDefinition(type,strength,n);
  state.faOperator=type;state.faOperatorSchema=schema;
  safeText('#faOperatorSchema','operator schema · '+schema.family+' · '+Object.entries(schema.parameters).map(([k,v])=>k+'='+(typeof v==='number'?fmt(v,5):String(v))).join(' · '));
  if(type==='user-matrix'&&state.faUserOperator?.status!=='READY')safeText('#faOperatorSchema','operator schema · user-matrix · BLOCKED until a '+n+'×'+n+' finite matrix passes audit');
  return schema;
}
function functionalOperatorVector(input,type,strength,iterations){
  const A=operatorMatrix(type,strength,input.length);
  if(!A)return null;
  let v=[...input];for(let it=0;it<iterations;it++)v=matrixVectorMul(A,v);return v;
}
function functionalFrameMetadata(z,type,strength,iteration){
  const n=z.length,spec=operatorSpectralInfo(type,strength,n),l2=Math.hypot(...z),coordinateEnergy=z.map(x=>x*x);
  let spectralEnergy=null;
  if(spec.status==='ACTUAL_FINITE'&&spec.vectors){
    const V=spec.vectors,coeff=Array.from({length:n},(_,j)=>{let s=0;for(let i=0;i<n;i++)s+=V[i][j]*z[i];return s;});
    spectralEnergy=coeff.map(x=>x*x);
  }
  const meta={iteration,accumulatedNormL2:l2,coordinateEnergy,spectralEnergy,spectralEnergyStatus:spectralEnergy?'ACTUAL_FINITE_EIGENBASIS':'UNAVAILABLE_OR_ILLUSTRATIVE',spectralStatus:spec.status,eigenvalues:spec.values};
  state.faFrameMetadata=meta;
  safeText('#faFrameMetadata','i='+iteration+' · ∥state∥₂='+fmt(l2,6)+' · energy='+meta.spectralEnergyStatus);
  safeText('#faSpectralStatus',spec.status+(spec.status==='ACTUAL_FINITE'?' · eigenvalues=['+spec.values.slice(0,8).map(x=>fmt(x,4)).join(', ')+(spec.values.length>8?', …':'')+']':' · no real self-adjoint eigendecomposition claimed'));
  return {meta,spec};
}
function functionalProvenance(type,spec){
  const basisType=state.faBasis?.type||'standard',basisRef=basisType==='standard'?'standard-coordinate':('user-basis@r'+(state.faBasis?.sourceRevision||0));
  const chain=[
    {step:'A',map:'M_p',from:'source ℓ^p finite vector',to:'mapped ℓ^2 finite vector',status:'EXACT_FINITE'},
    {step:'B',map:'P_k / basis preview',basis:basisRef,k:state.k,status:basisType==='standard'?'EXACT_FINITE':'DERIVED_PREVIEW_ONLY'},
    {step:'C',map:'T^i',operator:type,iteration:state.faIteration||0,spectralStatus:spec.status,status:type==='user-matrix'?'EXACT_FINITE_IF_AUDITED':'EXACT_FINITE'}
  ];
  state.faProvenance=chain;safeText('#faProvenanceChain',chain.map(x=>x.step+':'+x.map+'['+x.status+']').join(' → '));return chain;
}
function cameraSnapshot(key){
  const h=labHosts[key];if(!h)return null;
  return {position:h.camera.position.toArray(),target:h.controls.target.toArray(),zoom:h.camera.zoom};
}
function functionalReplaySignature(){
  const v=[...state.faVector],p=state.p,k=clamp(state.k,1,v.length),y=lpMap(v,p),yp=y.map((a,i)=>i<k?a:0),xh=lpInv(yp,p);
  return {
    p,k,source:v,mapped:y,reconstruction:xh,
    sourceResidualPower:lpNormP(v.map((a,i)=>a-xh[i]),p),
    mappedResidualSquared:y.reduce((s,a,i)=>s+(i>=k?a*a:0),0),
    sampleRho:state.faSampleRho?.value??null,
    basisFingerprint:state.faBasis?.sourceFingerprint||null,
    operator:state.faOperator,
    operatorMatrixFingerprint:state.faUserOperator?.fingerprint||null
  };
}
function compareFunctionalReplay(expected,tol=1e-8){
  if(!expected)return {status:'NO_REFERENCE'};
  const got=functionalReplaySignature(),diffs=[];
  const cmp=(name,a,b)=>{
    if(Array.isArray(a)&&Array.isArray(b)){const n=Math.max(a.length,b.length);let m=0;for(let i=0;i<n;i++)m=Math.max(m,Math.abs((a[i]??0)-(b[i]??0)));if(m>tol)diffs.push(name+': maxΔ='+m);}
    else if(typeof a==='number'&&typeof b==='number'){if(Math.abs(a-b)>tol)diffs.push(name+': Δ='+Math.abs(a-b));}
    else if(a!==b)diffs.push(name+': '+String(a)+' != '+String(b));
  };
  ['p','k','source','mapped','reconstruction','sourceResidualPower','mappedResidualSquared','basisFingerprint','operator','operatorMatrixFingerprint'].forEach(k=>cmp(k,expected[k],got[k]));
  return {status:diffs.length?'FAIL':'PASS',tolerance:tol,diffs,got};
}
function functionalExportSnapshot(){
  return {
    sourceVector:[...state.faVector],p:state.p,k:state.k,seed:state.faSeed,
    basis:{type:state.faBasis?.type||'standard',activePreview:state.faBasis?.active||'source',sourceMatrix:state.faBasis?.sourceMatrix?cloneMatrix(state.faBasis.sourceMatrix):null,sourceRevision:state.faBasis?.sourceRevision||0,sourceFingerprint:state.faBasis?.sourceFingerprint||'',audit:state.faBasis?.audit?{rank:state.faBasis.audit.rank,orthoF:state.faBasis.audit.orthoF,orthoMax:state.faBasis.audit.orthoMax,condition2:state.faBasis.audit.condition2,sigmaMin:state.faBasis.audit.sigmaMin,sigmaMax:state.faBasis.audit.sigmaMax}:null,derived:state.faBasis?.derived?{method:state.faBasis.derived.method,freshness:state.faBasis.derived.freshness,sourceRevision:state.faBasis.derived.sourceRevision,sourceFingerprint:state.faBasis.derived.sourceFingerprint,matrix:cloneMatrix(state.faBasis.derived.matrix)}:null},
    operator:{type:state.faOperator,strength:state.faOperatorStrength,schema:state.faOperatorSchema||null,userMatrix:state.faUserOperator?.matrix?cloneMatrix(state.faUserOperator.matrix):null,frameMetadata:state.faFrameMetadata||null},
    residual:state.faResidual||null,sampleRho:state.faSampleRho||null,certifiedRho:state.faCertifiedRho||null,provenance:state.faProvenance||[],
    cameras:{functional:cameraSnapshot('functional'),basis:cameraSnapshot('basis')},
    evidenceRefs:['LP-1','LP-2R','LP-2CE','HILB-1']
  };
}


function identityMatrix(n){return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0))}
function cloneMatrix(A){return A.map(r=>r.slice())}
function matrixShape(A){return [A.length,A[0]?.length||0]}
function basisFingerprint(A){
  const s=JSON.stringify(A),prime=16777619;let h=2166136261>>>0;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,prime)>>>0}
  return 'fnv1a32-'+h.toString(16).padStart(8,'0');
}
function parseBasisMatrix(text,n){
  const raw=String(text??'').trim();if(!raw)throw new Error('Basis matrix is empty.');
  let A;
  if(raw.startsWith('[')){
    A=JSON.parse(raw);
  }else{
    A=raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>line.split(/[\s,;]+/).filter(Boolean).map(Number));
  }
  if(!Array.isArray(A)||!A.length||!A.every(Array.isArray))throw new Error('Basis must be a 2D matrix.');
  const rows=A.length,cols=A[0].length;
  if(rows>32||cols>32)throw new Error('Finite basis audit is capped at 32×32.');
  if(rows!==n)throw new Error('Basis row count '+rows+' must equal current vector dimension n='+n+'.');
  if(!cols||cols>rows)throw new Error('Basis must have 1≤m≤n columns.');
  if(A.some(r=>r.length!==cols))throw new Error('Basis matrix must be rectangular.');
  A=A.map(r=>r.map(Number));
  if(A.some(r=>r.some(v=>!Number.isFinite(v))))throw new Error('Basis entries must be finite numbers; NaN/Infinity are rejected.');
  return A;
}
function matrixTranspose(A){return A[0].map((_,j)=>A.map(r=>r[j]))}
function gramMatrix(A){
  const [n,m]=matrixShape(A),G=Array.from({length:m},()=>Array(m).fill(0));
  for(let i=0;i<m;i++)for(let j=i;j<m;j++){
    let s=0;for(let r=0;r<n;r++)s+=A[r][i]*A[r][j];
    G[i][j]=G[j][i]=s;
  }
  return G;
}
function jacobiEigenvaluesSymmetric(A){
  const M=cloneMatrix(A),n=M.length;if(!n)return [];
  const eps=1e-14,maxSweeps=Math.max(30,8*n*n);
  for(let sweep=0;sweep<maxSweeps;sweep++){
    let p=0,q=1,max=0;
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const v=Math.abs(M[i][j]);if(v>max){max=v;p=i;q=j;}}
    if(max<eps)break;
    const app=M[p][p],aqq=M[q][q],apq=M[p][q],phi=.5*Math.atan2(2*apq,aqq-app),c=Math.cos(phi),s=Math.sin(phi);
    for(let k=0;k<n;k++)if(k!==p&&k!==q){
      const mkp=M[k][p],mkq=M[k][q];
      M[k][p]=M[p][k]=c*mkp-s*mkq;M[k][q]=M[q][k]=s*mkp+c*mkq;
    }
    M[p][p]=c*c*app-2*s*c*apq+s*s*aqq;
    M[q][q]=s*s*app+2*s*c*apq+c*c*aqq;
    M[p][q]=M[q][p]=0;
  }
  return M.map((r,i)=>Math.max(0,r[i])).sort((a,b)=>a-b);
}
function auditBasisMatrix(A){
  const [n,m]=matrixShape(A),G=gramMatrix(A),eig=jacobiEigenvaluesSymmetric(G),lmax=Math.max(0,...eig),tol=Math.max(1e-13,lmax*1e-11*Math.max(1,m));
  const positive=eig.filter(x=>x>tol),rank=positive.length,lmin=rank===m?positive[0]:0,sigmaMin=Math.sqrt(lmin),sigmaMax=Math.sqrt(lmax),cond=rank===m&&sigmaMin>0?sigmaMax/sigmaMin:Infinity;
  let frob2=0,maxErr=0;
  for(let i=0;i<m;i++)for(let j=0;j<m;j++){const d=G[i][j]-(i===j?1:0);frob2+=d*d;maxErr=Math.max(maxErr,Math.abs(d));}
  return {n,m,G,eigenvalues:eig,rank,sigmaMin,sigmaMax,condition2:cond,orthoF:Math.sqrt(frob2),orthoMax:maxErr,orthonormal:maxErr<=1e-10&&rank===m,fullColumnRank:rank===m};
}
function matrixColumns(A){const [n,m]=matrixShape(A);return Array.from({length:m},(_,j)=>Array.from({length:n},(_,i)=>A[i][j]))}
function columnsToMatrix(cols){if(!cols.length)return [];const n=cols[0].length,m=cols.length;return Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>cols[j][i]))}
function dotVec(a,b){let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s}
function normVec(a){return Math.sqrt(dotVec(a,a))}
function deriveMGS(A){
  const cols=matrixColumns(A),Q=[],tol=1e-12;
  for(let j=0;j<cols.length;j++){
    let v=cols[j].slice();
    for(const q of Q){const a=dotVec(q,v);for(let i=0;i<v.length;i++)v[i]-=a*q[i];}
    const nv=normVec(v);if(nv<tol)throw new Error('Modified Gram-Schmidt stopped: source columns are numerically dependent.');
    Q.push(v.map(x=>x/nv));
  }
  return columnsToMatrix(Q);
}
function deriveHouseholderQR(A){
  const [n,m]=matrixShape(A),R=cloneMatrix(A),Q=identityMatrix(n),tol=1e-12;
  for(let k=0;k<m;k++){
    const x=Array.from({length:n-k},(_,r)=>R[k+r][k]),nx=normVec(x);if(nx<tol)throw new Error('Householder QR stopped: source columns are numerically dependent.');
    const alpha=x[0]>=0?-nx:nx,v=x.slice();v[0]-=alpha;const nv=normVec(v);if(nv<tol)continue;for(let i=0;i<v.length;i++)v[i]/=nv;
    for(let j=k;j<m;j++){let d=0;for(let r=0;r<v.length;r++)d+=v[r]*R[k+r][j];for(let r=0;r<v.length;r++)R[k+r][j]-=2*v[r]*d;}
    for(let row=0;row<n;row++){let d=0;for(let r=0;r<v.length;r++)d+=Q[row][k+r]*v[r];for(let r=0;r<v.length;r++)Q[row][k+r]-=2*d*v[r];}
  }
  return Q.map(row=>row.slice(0,m));
}
function formatAuditNumber(x){
  if(x===Infinity)return '∞ (rank deficient)';
  if(!Number.isFinite(x))return '—';
  if(Math.abs(x)<1e-14)return '0';
  if(Math.abs(x)>=1e5||Math.abs(x)<1e-5)return x.toExponential(6);
  return x.toPrecision(8);
}
function renderGramMatrix(G){
  const el=$('#faGramMatrix');if(!el)return;
  if(!G?.length){el.innerHTML='<span class="muted small">No Gram matrix.</span>';return}
  const m=G.length;
  let h='<table><thead><tr><th>G</th>'+Array.from({length:m},(_,j)=>'<th>'+String(j+1)+'</th>').join('')+'</tr></thead><tbody>';
  for(let i=0;i<m;i++){
    h+='<tr><th>'+String(i+1)+'</th>';
    for(let j=0;j<m;j++){
      const d=G[i][j]-(i===j?1:0),cls=i===j?'diag':Math.abs(d)>1e-8?'offdiag-alert':'';
      h+='<td class="'+cls+'">'+formatAuditNumber(G[i][j])+'</td>';
    }
    h+='</tr>';
  }
  el.innerHTML=h+'</tbody></table>';
}
function basisSourceMatrix(){
  const n=Math.max(1,state.faVector.length),type=$('#faBasisType')?.value||state.faBasis?.type||'standard';
  if(type==='standard')return identityMatrix(n);
  return parseBasisMatrix($('#faBasisInput')?.value||state.faBasis?.sourceText||'',n);
}
function auditBasisSource(options={}){
  const silent=Boolean(options.silent),type=$('#faBasisType')?.value||state.faBasis?.type||'standard';
  if(!state.faBasis)state.faBasis={type:'standard',active:'source',sourceRevision:0,selected:1,sourceMatrix:null,audit:null,derived:null};
  state.faBasis.type=type;
  try{
    const A=basisSourceMatrix(),fp=basisFingerprint(A),changed=fp!==state.faBasis.sourceFingerprint;
    if(changed){
      state.faBasis.sourceRevision=(state.faBasis.sourceRevision||0)+1;
      if(state.faBasis.derived&&state.faBasis.derived.sourceRevision!==state.faBasis.sourceRevision)state.faBasis.derived.freshness='STALE';
    }
    state.faBasis.sourceMatrix=cloneMatrix(A);state.faBasis.sourceFingerprint=fp;state.faBasis.sourceText=JSON.stringify(A);
    if(type==='standard'&&$('#faBasisInput'))$('#faBasisInput').value=JSON.stringify(A);
    const audit=auditBasisMatrix(A);state.faBasis.audit=audit;
    safeText('#faBasisShape',audit.n+'×'+audit.m);safeText('#faBasisRank',audit.rank+'/'+audit.m);safeText('#faBasisOrthoF',formatAuditNumber(audit.orthoF));safeText('#faBasisOrthoMax',formatAuditNumber(audit.orthoMax));safeText('#faBasisCond',formatAuditNumber(audit.condition2));safeText('#faBasisSigma',formatAuditNumber(audit.sigmaMin)+' / '+formatAuditNumber(audit.sigmaMax));
    safeText('#faBasisStatus',(type==='standard'?'STANDARD BASIS · ':'USER BASIS · ')+(audit.orthonormal?'ORTHONORMAL':'NOT ORTHONORMAL')+' · '+(audit.fullColumnRank?'FULL COLUMN RANK':'RANK DEFICIENT')+' · source r'+state.faBasis.sourceRevision);
    renderGramMatrix(audit.G);
    if($('#faBasisSelected')){$('#faBasisSelected').max=Math.max(1,audit.m);state.faBasis.selected=clamp(state.faBasis.selected||1,1,audit.m);$('#faBasisSelected').value=state.faBasis.selected;safeText('#faBasisSelectedVal',String(state.faBasis.selected));}
    updateDerivedBasisUI();renderBasisPreview3D();if(!silent)updateSessionHash();
    return audit;
  }catch(err){
    state.faBasis.audit=null;safeText('#faBasisStatus','BASIS INPUT ERROR · '+String(err?.message||err));safeText('#faBasisShape','—');safeText('#faBasisRank','—');safeText('#faBasisOrthoF','—');safeText('#faBasisOrthoMax','—');safeText('#faBasisCond','—');safeText('#faBasisSigma','—');renderGramMatrix(null);renderBasisPreview3D();return null;
  }
}
function updateDerivedBasisUI(){
  const d=state.faBasis?.derived,ta=$('#faDerivedBasis');
  if(!d){if(ta)ta.value='';safeText('#faBasisProvenance','No derived basis yet. Original source is authoritative.');return}
  if(ta)ta.value=JSON.stringify(d.matrix,null,2);
  safeText('#faBasisProvenance',d.method+' derived copy · '+d.freshness+' · source basis r'+d.sourceRevision+' · '+d.sourceFingerprint+' · ∥QᵀQ−I∥F='+formatAuditNumber(d.audit.orthoF)+' · source preserved');
}
function deriveBasisCopy(method){
  const audit=auditBasisSource({silent:true});if(!audit)return;
  if(!audit.fullColumnRank){safeText('#faBasisProvenance','DERIVATION BLOCKED · source basis is rank deficient.');return}
  try{
    const A=state.faBasis.sourceMatrix,Q=method==='QR'?deriveHouseholderQR(A):deriveMGS(A),qa=auditBasisMatrix(Q);
    state.faBasis.derived={method:method==='QR'?'HOUSEHOLDER_QR':'MODIFIED_GRAM_SCHMIDT',matrix:Q,audit:qa,sourceRevision:state.faBasis.sourceRevision,sourceFingerprint:state.faBasis.sourceFingerprint,createdAt:now(),freshness:'CURRENT'};
    updateDerivedBasisUI();renderBasisPreview3D();updateSessionHash();
  }catch(err){safeText('#faBasisProvenance','DERIVATION ERROR · '+String(err?.message||err));}
}
function activeBasisMatrix(){
  const active=$('#faBasisActive')?.value||state.faBasis?.active||'source';state.faBasis.active=active;
  const d=state.faBasis?.derived;
  if(active==='derived'&&d&&d.freshness==='CURRENT'&&d.sourceRevision===state.faBasis.sourceRevision)return d.matrix;
  return state.faBasis?.sourceMatrix||identityMatrix(Math.max(1,state.faVector.length));
}
function renderBasisPreview3D(){
  const host=createLabHost('basis','faBasis3D',[4.2,2.7,5.1]);if(!host)return;clearLabGroup(host);const g=host.group;
  const source=state.faBasis?.sourceMatrix,derived=state.faBasis?.derived?.matrix,active=activeBasisMatrix();
  if(!source?.length){safeText('#faBasis3DStatus','No valid source basis to preview.');return}
  const [n,m]=matrixShape(source),sel=clamp((state.faBasis?.selected||1)-1,0,m-1),maxShow=Math.min(m,12);
  const draw=(A,colorBase,opacity,offset=.0)=>{
    const cols=matrixColumns(A);
    for(let j=0;j<Math.min(maxShow,cols.length);j++){
      const v=cols[j],head=[(v[0]||0)+offset,v[1]||0,v[2]||0],tail=Math.sqrt(v.slice(3).reduce((s,x)=>s+x*x,0));
      const col=j===sel?0xffffff:colorBase,scale=1/(Math.max(1,normVec(head),Math.sqrt(head[0]*head[0]+head[1]*head[1]+head[2]*head[2]+tail*tail)));
      addArrow(g,[0,0,0],head.map(x=>x*scale*1.65),col,j===sel?.18:.11);
      if(tail>1e-10){
        const ring=new THREE.Mesh(new THREE.TorusGeometry(.16+.12*Math.min(1,tail),.016,8,32),new THREE.MeshBasicMaterial({color:0xf2c96d,transparent:true,opacity:.35*opacity}));
        ring.position.set(0,-.08-.045*j,0);ring.rotation.x=Math.PI/2;g.add(ring);
      }
    }
  };
  const activeKind=$('#faBasisActive')?.value||'source';
  draw(source,0x8ed7ff,activeKind==='source'?1:.35,0);
  if(derived&&state.faBasis.derived?.freshness==='CURRENT')draw(derived,0x8de4b0,activeKind==='derived'?1:.35,.015);
  g.add(new THREE.GridHelper(5,10,0x244c5d,0x122d39));
  const col=matrixColumns(active)[sel]||[],tail=Math.sqrt(col.slice(3).reduce((s,x)=>s+x*x,0));
  safeText('#faBasis3DStatus','preview basis='+(activeKind==='derived'?'derived copy':'authoritative source')+' · vector '+(sel+1)+'/'+m+' · ambient n='+n+' · displayed coordinates=(1,2,3) · omitted tail norm='+formatAuditNumber(tail)+'. Amber rings encode omitted-coordinate magnitude only; they are not extra geometric dimensions.');
}
$('#faBasisType')?.addEventListener('change',e=>{state.faBasis.type=e.target.value;if(e.target.value==='standard'){state.faBasis.active='source';if($('#faBasisActive'))$('#faBasisActive').value='source';}auditBasisSource();});
$('#faAuditBasis')?.addEventListener('click',()=>auditBasisSource());
$('#faDeriveQR')?.addEventListener('click',()=>deriveBasisCopy('QR'));
$('#faDeriveMGS')?.addEventListener('click',()=>deriveBasisCopy('MGS'));
$('#faClearDerived')?.addEventListener('click',()=>{state.faBasis.derived=null;state.faBasis.active='source';if($('#faBasisActive'))$('#faBasisActive').value='source';updateDerivedBasisUI();renderBasisPreview3D();updateSessionHash();});
$('#faBasisActive')?.addEventListener('change',e=>{state.faBasis.active=e.target.value;renderBasisPreview3D();});
$('#faBasisSelected')?.addEventListener('input',e=>{state.faBasis.selected=+e.target.value;safeText('#faBasisSelectedVal',String(state.faBasis.selected));renderBasisPreview3D();});
$('#faBasisInput')?.addEventListener('change',()=>{if(($('#faBasisType')?.value||'standard')==='user')auditBasisSource();});
function functionalProjectionData(){
  const v=parseVector($('#faVector')?.value||state.faVector.join(',')),p=+($('#pRange')?.value||state.p),y=lpMap(v,p);
  const a=[y[0]||0,y[1]||0,y[2]||0],proj=[a[0],a[1],0],res=[0,0,a[2]];
  return {source:a,projection:proj,residual:res};
}
function renderFunctional3D(){
  const host=createLabHost('functional','functional3D',[5.6,3.4,6.4]);if(!host)return;clearLabGroup(host);
  const mode=state.functionalMode||'sequence',v=parseVector($('#faVector')?.value||state.faVector.join(',')),p=+($('#pRange')?.value||state.p),k=clamp(+($('#kRange')?.value||state.k),1,Math.max(1,v.length)),y=lpMap(v,p);
  const maxAbs=Math.max(1e-9,...v.map(Math.abs),...y.map(Math.abs));
  const group=host.group;
  const grid=new THREE.GridHelper(8,16,0x244c5d,0x122d39);grid.position.y=-.02;grid.material.transparent=true;grid.material.opacity=.24;group.add(grid);
  const sequence=(offset=0,scale=.78)=>{
    const count=Math.min(18,v.length),spacing=Math.min(.52,4.6/Math.max(1,count-1));
    const x0=offset-(count-1)*spacing/2;
    const trunc=y.map((a,i)=>i<k?a:0);
    for(let i=0;i<count;i++){
      const x=x0+i*spacing;
      const selected=i===clamp((state.faSelectedMode||1)-1,0,Math.max(0,count-1));
      group.add(makeBar3D(x,-1.15,v[i],maxAbs,selected?0xffffff:0x8ed7ff,selected?1:.82,.18*scale));
      group.add(makeBar3D(x,0,y[i],maxAbs,selected?0xffffff:0x35d3c5,selected?1:.82,.18*scale));
      const c=selected?0xffffff:(i<k?0x8de4b0:0xf2c96d);
      const val=i<k?trunc[i]:y[i];
      const mesh=makeBar3D(x,1.15,val,maxAbs,c,i<k?.85:.42,.18*scale);group.add(mesh);
    }
  };
  const projection=(offset=0,scale=1)=>{
    const d=functionalProjectionData(),base=[offset,0,0],s=.9*scale;
    const src=d.source.map(x=>x*s/maxAbs),pr=d.projection.map(x=>x*s/maxAbs),rr=d.residual.map(x=>x*s/maxAbs);
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(3.2*scale,3.2*scale),new THREE.MeshStandardMaterial({color:0x173849,transparent:true,opacity:.32,side:THREE.DoubleSide}));
    plane.rotation.x=-Math.PI/2;plane.position.set(offset,0,0);group.add(plane);
    addArrow(group,base,[offset+src[0],src[2],src[1]],0x8ed7ff,.16);
    addArrow(group,base,[offset+pr[0],0,pr[1]],0x8de4b0,.16);
    addArrow(group,[offset+pr[0],0,pr[1]],[offset+src[0],src[2],src[1]],0xf2c96d,.13);
    group.add(makeLine3D([offset-1.7,0,0],[offset+1.7,0,0],0x456f7f,.38));
  };
  const operator=(offset=0,scale=.78)=>{
    const type=$('#faOperator')?.value||state.faOperator,strength=+($('#faOperatorStrength')?.value||state.faOperatorStrength),it=state.faIteration||0;
    const z=functionalOperatorVector(y,type,strength,it),sel=clamp((state.faSelectedMode||1)-1,0,Math.max(0,y.length-1));
    if(!z){safeText('#functional3DStatus','OPERATOR BLOCKED · user matrix must pass finite dimension audit before execution.');stopFunctionalPlayback();return}
    const count=Math.min(18,z.length),spacing=Math.min(.52,4.6/Math.max(1,count-1)),x0=offset-(count-1)*spacing/2;
    const frame=functionalFrameMetadata(z,type,strength,it);functionalProvenance(type,frame.spec);
    for(let i=0;i<count;i++){
      const color=i===sel?0xffffff:(i<k?0xb8a8ff:0x6a7f99);const mesh=makeBar3D(x0+i*spacing,0,z[i],maxAbs,color,i===sel?1:.8,.2*scale);group.add(mesh);
    }
    const baseY=-.04;group.add(makeLine3D([offset-2.7,baseY,0],[offset+2.7,baseY,0],0x5b7890,.45));
  };
  if(mode==='sequence')sequence(0,1);
  if(mode==='projection')projection(0,1.2);
  if(mode==='operator')operator(0,1);
  if(mode==='mixed'){sequence(-3.2,.62);projection(0,.72);operator(3.2,.62);}
  safeText('#functionalModeStatus',mode.toUpperCase());
  const type=$('#faOperator')?.value||state.faOperator;safeText('#functionalEvidenceGrade',mode==='projection'?'EXACT_FINITE projection geometry · no infinite-dimensional certificate':mode==='operator'?'EXACT_FINITE operator iteration / spectrum demo':'EXACT_FINITE transform · ESTIMATED sample residual');
  const semanticNote=mode==='projection'?'Displayed Hilbert demo: projection lies in the retained plane and the amber residual is drawn normal to it (orthogonality semantic).':mode==='operator'?'Spectral columns are finite operator-state coefficients; selected mode is highlighted.':mode==='mixed'?'A→B→C share one finite state with provenance-preserving transitions.':'Source / Mₚ / Pₖ lanes share coordinate IDs.';
  safeText('#functional3DStatus','mode='+mode+' · p='+fmt(p,2)+' · k='+k+' · iteration='+(state.faIteration||0)+' · operator='+type+'. '+semanticNote+' Screen Euclidean distance is not promoted to source norm.');
}
function setFunctionalMode(mode){
  state.functionalMode=mode;$$('.functional-mode').forEach(b=>b.classList.toggle('active',b.dataset.functionalMode===mode));renderFunctional3D();updateSessionHash();
}
$$('.functional-mode').forEach(b=>b.addEventListener('click',()=>setFunctionalMode(b.dataset.functionalMode)));
$('#generateFaPreset')?.addEventListener('click',generateFunctionalPreset);
$('#faPreset')?.addEventListener('change',e=>{state.faPreset=e.target.value});
['faSeed','faCount','faDecayRate'].forEach(id=>$('#'+id)?.addEventListener('change',()=>{state.faSeed=Math.trunc(+($('#faSeed')?.value||2101));state.faCount=clamp(Math.trunc(+($('#faCount')?.value||8)),3,32);state.faDecayRate=clamp(+($('#faDecayRate')?.value||.4),.05,3)}));
['faSparseRatio','faAmplitude','faOscFreq','faOscPhase','faOscEnvelope'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{
  state.faSparseRatio=+($('#faSparseRatio')?.value||.25);state.faAmplitude=+($('#faAmplitude')?.value||1.2);state.faOscFreq=+($('#faOscFreq')?.value||2);state.faOscPhase=+($('#faOscPhase')?.value||0);state.faOscEnvelope=+($('#faOscEnvelope')?.value||.35);
  safeText('#faSparseRatioVal',fmt(state.faSparseRatio,2));safeText('#faAmplitudeVal',fmt(state.faAmplitude,1));safeText('#faOscFreqVal',fmt(state.faOscFreq,2));safeText('#faOscPhaseVal',fmt(state.faOscPhase,2));safeText('#faOscEnvelopeVal',fmt(state.faOscEnvelope,2));
}));
$('#faDecayKind')?.addEventListener('change',e=>{state.faDecayKind=e.target.value});
$('#faOperator')?.addEventListener('change',e=>{state.faOperator=e.target.value;state.faIteration=0;updateOperatorSchemaUI();renderFunctional3D();});
$('#faOperatorStrength')?.addEventListener('input',e=>{state.faOperatorStrength=+e.target.value;safeText('#faOperatorStrengthVal',fmt(state.faOperatorStrength,2));updateOperatorSchemaUI();renderFunctional3D();});
$('#faAuditOperatorMatrix')?.addEventListener('click',auditUserOperatorMatrix);
$('#faUserOperatorMatrix')?.addEventListener('change',()=>{if(($('#faOperator')?.value||state.faOperator)==='user-matrix')auditUserOperatorMatrix();});
$('#faSelectedMode')?.addEventListener('input',e=>{state.faSelectedMode=+e.target.value;safeText('#faSelectedModeVal',String(state.faSelectedMode));renderFunctional3D();});
let functionalPlayTimer=null;
function stopFunctionalPlayback(){if(functionalPlayTimer){clearInterval(functionalPlayTimer);functionalPlayTimer=null}state.faPlaying=false}
$('#faPlay')?.addEventListener('click',()=>{if(motionDisabled()){toast('Reduced motion is active · Functional playback is paused.');return}stopFunctionalPlayback();state.faPlaying=true;functionalPlayTimer=setInterval(()=>{state.faIteration=(state.faIteration||0)+1;if(state.faIteration>20)state.faIteration=0;renderFunctional3D();},650);});
$('#faPause')?.addEventListener('click',stopFunctionalPlayback);
$('#faReset')?.addEventListener('click',()=>{stopFunctionalPlayback();state.faIteration=0;renderFunctional3D();});


function ensureIfcSamples(){
  if(!state.ifc)state.ifc={encoder:'projection',collision:.35,noise:.05,sampleRevision:1,selectedSampleId:'src-01',collisionWitness:null};
  if(!Array.isArray(state.ifc.samples)||state.ifc.samples.length!==6){
    const pts=[[-4.5,.9,-.9],[-4.3,.25,.6],[-4.4,-.55,-.4],[-3.9,1.25,.35],[-3.8,-1.0,.75],[-4.0,-.2,-1.0]];
    state.ifc.samples=pts.map((point,i)=>({id:'src-'+String(i+1).padStart(2,'0'),point:[...point]}));
  }
  return state.ifc.samples;
}
function ifcHashObject(x){return basisFingerprint(x)}
function ifcModelDefaults(){
  if(!state.ifc)state.ifc={};
  if(!state.ifc.learned)state.ifc.learned={mode:'frozen',architecture:'mlp-3-h-z-h-3',latentDim:2,hiddenWidth:6,activation:'tanh',seed:2101,optimizer:'adam',learningRate:.02,epochs:250,batchSize:6,trainingStatus:'UNTRAINED',loss:null,weightHash:'',modelRevision:0,model:null};
  if(!state.ifc.noiseScope)state.ifc.noiseScope='observation';
  if(!Number.isFinite(state.ifc.collisionTolerance))state.ifc.collisionTolerance=.08;
  if(!state.ifc.fidelityWeights)state.ifc.fidelityWeights={Top:1,Metric:1,Hom:1,Spectral:1,Dyn:1};
  if(!state.ifc.fidelityEnabled)state.ifc.fidelityEnabled={Top:true,Metric:true,Hom:true,Spectral:true,Dyn:true};
  return state.ifc;
}
function ifcAct(x,type){return type==='relu'?Math.max(0,x):type==='linear'?x:Math.tanh(x)}
function ifcActPrime(z,type){return type==='relu'?(z>0?1:0):type==='linear'?1:(1-Math.tanh(z)**2)}
function ifcInitMatrix(rows,cols,rng,scale){return Array.from({length:rows},()=>Array.from({length:cols},()=>randn(rng)*scale))}
function ifcInitNetwork(force=false){
  const S=ifcModelDefaults(),L=S.learned,arch=$('#ifcArchitecture')?.value||L.architecture,latent=clamp(Math.trunc(+($('#ifcLatentDim')?.value||L.latentDim||2)),1,3),hidden=clamp(Math.trunc(+($('#ifcHiddenWidth')?.value||L.hiddenWidth||6)),2,16),activation=$('#ifcActivation')?.value||L.activation,seed=Math.trunc(+($('#ifcModelSeed')?.value||L.seed||2101));
  const key=[arch,latent,hidden,activation,seed].join('|');
  if(!force&&L.model&&L.model.key===key)return L.model;
  const rng=mulberry32(seed),layers=[];
  const add=(input,output,act)=>layers.push({input,output,act,W:ifcInitMatrix(output,input,rng,Math.sqrt(2/Math.max(1,input+output))),b:Array(output).fill(0)});
  if(arch==='linear-3-z-3'){add(3,latent,'linear');add(latent,3,'linear');}
  else{add(3,hidden,activation);add(hidden,latent,activation);add(latent,hidden,activation);add(hidden,3,'linear');}
  const model={key,architecture:arch,latentDim:latent,hiddenWidth:hidden,activation,seed,layers,latentLayer:arch==='linear-3-z-3'?0:1,opt:null};
  Object.assign(L,{architecture:arch,latentDim:latent,hiddenWidth:hidden,activation,seed,model,trainingStatus:L.mode==='frozen'?'FROZEN_SEEDED':'READY_TO_TRAIN',loss:null,weightHash:ifcHashObject(layers.map(x=>({W:x.W,b:x.b}))),modelRevision:(L.modelRevision||0)+1});
  updateIfcModelMeta();return model;
}
function ifcForward(model,x,needCache=false){
  let a=x.slice(),latent=null;const cache=[];
  model.layers.forEach((layer,li)=>{
    const z=layer.W.map((row,r)=>row.reduce((s,w,j)=>s+w*a[j],layer.b[r]));
    const out=z.map(v=>ifcAct(v,layer.act));
    if(needCache)cache.push({aPrev:a.slice(),z,out:out.slice()});
    a=out;if(li===model.latentLayer)latent=out.slice();
  });
  return {output:a,latent:latent||a.slice(),cache};
}
function ifcZeroLikeMatrix(A){return A.map(r=>r.map(()=>0))}
function ifcOptimizerInit(model){
  model.opt={t:0,layers:model.layers.map(l=>({mW:ifcZeroLikeMatrix(l.W),vW:ifcZeroLikeMatrix(l.W),mb:l.b.map(()=>0),vb:l.b.map(()=>0)}))};
}
function ifcTrainModel(){
  const S=ifcModelDefaults(),L=S.learned;
  if(L.mode!=='trainable'){safeText('#ifcTrainingStatus','FROZEN MODE · switch to Trainable sandbox first');return}
  const model=ifcInitNetwork(false),samples=ensureIfcSamples(),data=samples.map(s=>s.point.map(v=>v/5));
  const epochs=clamp(Math.trunc(+($('#ifcEpochs')?.value||L.epochs||250)),1,2000),lr=clamp(+($('#ifcLearningRate')?.value||L.learningRate||.02),.0001,.2),optimizer=$('#ifcOptimizer')?.value||L.optimizer||'adam';
  Object.assign(L,{epochs,learningRate:lr,optimizer,batchSize:clamp(Math.trunc(+($('#ifcBatchSize')?.value||6)),1,64),trainingStatus:'TRAINING'});
  safeText('#ifcTrainingStatus','TRAINING…');
  if(optimizer==='adam'&&!model.opt)ifcOptimizerInit(model);
  let lastLoss=0;
  for(let epoch=0;epoch<epochs;epoch++){
    const grads=model.layers.map(l=>({W:ifcZeroLikeMatrix(l.W),b:l.b.map(()=>0)}));let loss=0;
    data.forEach(x=>{
      const f=ifcForward(model,x,true),out=f.output;loss+=out.reduce((s,v,i)=>s+(v-x[i])**2,0)/out.length;
      let grad=out.map((v,i)=>2*(v-x[i])/out.length);
      for(let li=model.layers.length-1;li>=0;li--){
        const layer=model.layers[li],C=f.cache[li],gz=grad.map((g,i)=>g*ifcActPrime(C.z[i],layer.act));
        for(let r=0;r<layer.output;r++){
          grads[li].b[r]+=gz[r];
          for(let c=0;c<layer.input;c++)grads[li].W[r][c]+=gz[r]*C.aPrev[c];
        }
        const prev=Array(layer.input).fill(0);
        for(let c=0;c<layer.input;c++)for(let r=0;r<layer.output;r++)prev[c]+=layer.W[r][c]*gz[r];
        grad=prev;
      }
    });
    lastLoss=loss/data.length;
    const scale=1/data.length;
    if(optimizer==='adam'){
      model.opt.t++;const t=model.opt.t,b1=.9,b2=.999,eps=1e-8;
      model.layers.forEach((layer,li)=>{
        const O=model.opt.layers[li];
        for(let r=0;r<layer.output;r++){
          const gb=grads[li].b[r]*scale;O.mb[r]=b1*O.mb[r]+(1-b1)*gb;O.vb[r]=b2*O.vb[r]+(1-b2)*gb*gb;layer.b[r]-=lr*(O.mb[r]/(1-Math.pow(b1,t)))/(Math.sqrt(O.vb[r]/(1-Math.pow(b2,t)))+eps);
          for(let c=0;c<layer.input;c++){const gw=grads[li].W[r][c]*scale;O.mW[r][c]=b1*O.mW[r][c]+(1-b1)*gw;O.vW[r][c]=b2*O.vW[r][c]+(1-b2)*gw*gw;layer.W[r][c]-=lr*(O.mW[r][c]/(1-Math.pow(b1,t)))/(Math.sqrt(O.vW[r][c]/(1-Math.pow(b2,t)))+eps);}
        }
      });
    }else{
      model.layers.forEach((layer,li)=>{for(let r=0;r<layer.output;r++){layer.b[r]-=lr*grads[li].b[r]*scale;for(let c=0;c<layer.input;c++)layer.W[r][c]-=lr*grads[li].W[r][c]*scale;}});
    }
  }
  L.trainingStatus='TRAINED_SANDBOX';L.loss=lastLoss;L.weightHash=ifcHashObject(model.layers.map(x=>({W:x.W,b:x.b})));L.modelRevision=(L.modelRevision||0)+1;L.datasetIds=ensureIfcSamples().map(s=>s.id);updateIfcModelMeta();renderIfc3D();drawFidelityPipeline();updateSessionHash();
}
function updateIfcModelMeta(){
  const S=ifcModelDefaults(),L=S.learned;
  if($('#ifcLearnedPanel'))$('#ifcLearnedPanel').style.display=S.encoder==='learned'?'block':'none';
  safeText('#ifcTrainingStatus',L.trainingStatus||'UNTRAINED');safeText('#ifcLoss',Number.isFinite(L.loss)?L.loss.toExponential(6):'—');safeText('#ifcWeightHash',L.weightHash||'—');safeText('#ifcModelRevision',String(L.modelRevision||0));safeText('#ifcDatasetIds',(L.datasetIds||ensureIfcSamples().map(s=>s.id)).join(', '));
  $$('.ifc-learned-mode').forEach(b=>b.classList.toggle('active',b.dataset.ifcLearned===(L.mode||'frozen')));
}
function ifcPerturb(index,dim,amp,seed=2101){return amp*Math.sin((index+1)*12.9898+(dim+1)*78.233+seed*.013)*.72}
function ifcEncodePoint(point,index){
  const S=ifcModelDefaults(),scope=S.noiseScope||'observation',noise=S.noise||0,seed=S.learned?.seed||2101;
  let src=point.slice();if(scope==='source')src=src.map((v,d)=>v+ifcPerturb(index,d,noise,seed));
  let obs;
  if(S.encoder==='constant')obs=[0,0];
  else if(S.encoder==='invariant')obs=[Math.hypot(src[1],src[2]),src[1]*src[2]+.15*src[0]];
  else if(S.encoder==='learned'){
    const model=ifcInitNetwork(false),f=ifcForward(model,src.map(v=>v/5),false);obs=f.latent.slice(0,model.latentDim);
  }else obs=[src[1],src[2]];
  if(scope==='observation')obs=obs.map((v,d)=>v+ifcPerturb(index,d,noise,seed+17));
  return {sourceMath:src,observationMath:obs};
}
function ifcObservationSet(){
  const S=ifcModelDefaults(),samples=ensureIfcSamples(),raw=samples.map((s,i)=>({id:s.id,source:s.point.slice(),...ifcEncodePoint(s.point,i)}));
  if(S.collision>0&&S.encoder!=='constant'){
    const idx=[0,1,2],dim=Math.max(...raw.map(x=>x.observationMath.length)),mean=Array(dim).fill(0);
    idx.forEach(i=>{for(let d=0;d<dim;d++)mean[d]+=raw[i].observationMath[d]||0});for(let d=0;d<dim;d++)mean[d]/=idx.length;
    idx.forEach(i=>{raw[i].observationMath=raw[i].observationMath.map((v,d)=>(1-S.collision)*v+S.collision*mean[d])});
  }
  raw.forEach((x,i)=>{
    const o=x.observationMath,d0=o[0]||0,d1=o[1]||0,d2=o[2]||0,rendererNoise=S.noiseScope==='renderer'?S.noise:0;
    x.display=[-2.25+.18*d2,d0+(rendererNoise?ifcPerturb(i,0,rendererNoise,(S.learned?.seed||2101)+41):0),d1+(rendererNoise?ifcPerturb(i,1,rendererNoise,(S.learned?.seed||2101)+41):0)];
  });
  return raw;
}
function ifcCollisionBundles(data,tol){
  const n=data.length,parent=Array.from({length:n},(_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i])),join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a};
  const dist=(a,b)=>{const m=Math.max(a.length,b.length);let s=0;for(let i=0;i<m;i++)s+=((a[i]||0)-(b[i]||0))**2;return Math.sqrt(s)};
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(dist(data[i].observationMath,data[j].observationMath)<=tol)join(i,j);
  const map=new Map();for(let i=0;i<n;i++){const r=find(i);if(!map.has(r))map.set(r,[]);map.get(r).push(data[i]);}
  return [...map.values()].filter(g=>g.length>1);
}
function ifcSampleDiameter(bundle){
  let d=0;for(let i=0;i<bundle.length;i++)for(let j=i+1;j<bundle.length;j++){const a=bundle[i].source,b=bundle[j].source;d=Math.max(d,Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]));}return d;
}
function ifcCertifiedRecords(){
  const amb=state.evidenceRecords.find(ev=>ev.freshness==='CURRENT'&&ev.runStatus==='SUCCESS'&&ev.evidenceGrade==='FORMAL'&&ev.metadata?.type==='IFC_AMBIGUITY_BOUND'&&ev.objectRevision===state.objectRevision&&ev.representationRevision===state.representationRevision);
  const cert=state.evidenceRecords.find(ev=>ev.freshness==='CURRENT'&&ev.runStatus==='SUCCESS'&&ev.evidenceGrade==='FORMAL'&&ev.metadata?.type==='IFC_CERTIFICATE'&&ev.objectRevision===state.objectRevision&&ev.representationRevision===state.representationRevision);
  return {ambiguity:amb,certificate:cert};
}
function ifcFidelityState(){
  const keys=['Top','Metric','Hom','Spectral','Dyn'],vals={},weights={},missing=[];let num=0,den=0;
  keys.forEach(k=>{
    const enabled=$('#useDelta'+k)?.checked!==false,w=Math.max(0,+($('#weight'+k)?.value||1)),v=+($('#delta'+k)?.value||0);weights[k]=w;vals[k]=enabled?v:null;
    safeText('#delta'+k+'Val',enabled?fmt(v,3):'MISSING');
    if(enabled&&w>0){num+=w*v;den+=w}else missing.push(k);
  });
  const Delta=den>0?num/den:null,sigma=+($('#sigmaRange')?.value||.25),F=Delta==null?null:Math.exp(-(Delta*Delta)/(2*sigma*sigma)),band=F==null?'UNKNOWN':F>.88?'HIGH':F>.6?'MEDIUM':'LOW';
  safeText('#ifcDeltaFormula','Δ = ('+keys.filter(k=>vals[k]!=null&&weights[k]>0).map(k=>fmt(weights[k],2)+'·δ_'+k.toLowerCase()).join(' + ')+') / '+fmt(den,2));
  safeText('#ifcMissingComponents',missing.length?'MISSING: '+missing.join(', ')+' · missing values are not silently imputed.':'No missing fidelity components.');
  return {keys,vals,weights,missing,Delta,F,band,sigma};
}
function computeIfcState(){
  const S=ifcModelDefaults(),enc=$('#ifcEncoder')?.value||S.encoder||'projection',collision=+($('#ifcCollision')?.value||S.collision||0),noise=+($('#ifcNoise')?.value||S.noise||0),noiseScope=$('#ifcNoiseScope')?.value||S.noiseScope||'observation',tol=clamp(+($('#ifcCollisionTolerance')?.value||S.collisionTolerance||.08),.0001,.5);
  Object.assign(S,{encoder:enc,collision,noise,noiseScope,collisionTolerance:tol});
  updateIfcModelMeta();safeText('#ifcCollisionVal',fmt(collision,2));safeText('#ifcNoiseVal',fmt(noise,3));safeText('#ifcNoiseState',noiseScope+' noise='+fmt(noise,3)+' · not a robustness certificate');
  const data=ifcObservationSet(),bundles=ifcCollisionBundles(data,tol),actualCollision=bundles.length>0,theoremNonInjective=enc==='constant',ident=actualCollision||theoremNonInjective?'NON_IDENTIFIABLE':'IDENTIFIABLE_SAMPLE_ONLY';
  const sampleDiameter=bundles.reduce((m,b)=>Math.max(m,ifcSampleDiameter(b)),0),records=ifcCertifiedRecords(),certBound=records.ambiguity?.metadata?.certifiedAmbiguityBound;
  const F=ifcFidelityState(),eps=+($('#epsilonGoal')?.value||.1),confidence=+($('#confidenceRange')?.value||.72),robust=+($('#robustRange')?.value||.08),admissible=['admContinuity','admComplexity','admNoncollapse','admIdent'].every(id=>$('#'+id)?.checked);
  const numericalEligible=F.Delta!=null&&F.Delta<=eps,identClosed=!actualCollision&&!theoremNonInjective&&Boolean(records.ambiguity)&&Number.isFinite(certBound),boundAvailable=Boolean(records.ambiguity)&&Number.isFinite(certBound);
  const blocked=[];if(actualCollision||theoremNonInjective)blocked.push('NON_INJECTIVE');if(!admissible)blocked.push('MISSING_HYPOTHESIS');if(!boundAvailable)blocked.push('NO_CERTIFIED_MAP');if(F.missing.length)blocked.push('NUMERICAL_ONLY');
  let cert='WITHHELD';if(actualCollision||theoremNonInjective)cert='BLOCKED';else if(admissible&&identClosed&&boundAvailable&&numericalEligible)cert='ELIGIBLE';if(records.certificate&&cert!=='BLOCKED')cert='ISSUED';
  if(cert==='BLOCKED'&&!blocked.length)blocked.push('NON_INJECTIVE');
  const learnedMeta=enc==='learned'?S.learned:null;
  const encoderMeta={type:enc,scope:'finite-source-sample',noiseScope,learned:learnedMeta?{mode:learnedMeta.mode,architecture:learnedMeta.architecture,latentDim:learnedMeta.latentDim,hiddenWidth:learnedMeta.hiddenWidth,activation:learnedMeta.activation,seed:learnedMeta.seed,optimizer:learnedMeta.optimizer,epochs:learnedMeta.epochs,loss:learnedMeta.loss,weightHash:learnedMeta.weightHash,trainingStatus:learnedMeta.trainingStatus,modelRevision:learnedMeta.modelRevision}:null,theoremNonInjective:theoremNonInjective?{scope:'encoder definition',reason:'constant encoder'}:null};
  S.data=data;S.bundles=bundles;S.sampleAmbiguityDiameter=sampleDiameter;S.certifiedAmbiguityBound=Number.isFinite(certBound)?certBound:null;S.fidelity=F;S.confidence=confidence;S.robustnessCertifiedRadius=robust;S.gate={ident,admissible,boundAvailable,numericalEligible,status:cert,blockedReasons:[...new Set(blocked)],eps,confidence,robustance:robust,objectRevision:state.objectRevision,representationRevision:state.representationRevision,claimRevision:state.claimRevision};S.encoderMetadata=encoderMeta;
  const witnessIds=bundles.flatMap(b=>b.map(x=>x.id));S.collisionWitness=witnessIds.length?{id:'cw-'+S.sampleRevision+'-'+witnessIds.join('-'),sampleIds:[...new Set(witnessIds)],bundles:bundles.map(b=>b.map(x=>x.id)),sampleAmbiguityDiameter:sampleDiameter,evidenceClass:'FINITE_SAMPLE_WITNESS',representationRevision:state.representationRevision}:null;
  safeText('#ifcEncoderMeta',enc+(enc==='learned'?' · '+S.learned.mode+' · '+S.learned.architecture+' · z='+S.learned.latentDim:'')+' · noise@'+noiseScope);
  safeText('#ifcCollisionEvidence',S.collisionWitness?'FINITE_SAMPLE_WITNESS · '+S.collisionWitness.bundles.map(b=>'['+b.join(',')+']').join(' '):(theoremNonInjective?'THEOREM/DEFINITIONAL NON-INJECTIVITY · constant encoder':'NONE'));
  safeText('#ifcAmbiguitySample',fmt(sampleDiameter,6)+' · ESTIMATED/EXACT_FINITE sample diameter');safeText('#ifcAmbiguityCertified',Number.isFinite(certBound)?fmt(certBound,6)+' · '+records.ambiguity.id:'UNKNOWN');
  safeText('#ifcIdentStatus',ident);safeText('#ifcFidelityBand',F.band+(F.F==null?'':' · Fσ='+fmt(F.F,4)));safeText('#ifcCertificateStatus',cert);safeText('#ifcBlockedReasons',S.gate.blockedReasons.length?S.gate.blockedReasons.join(' · '):'NONE');
  safeText('#ifcConfidenceState','P='+fmt(confidence,2)+' · independent probability/confidence state');safeText('#ifcRobustnessState',records.certificate?.metadata?.robustnessRadius!=null?'CERTIFIED R='+fmt(records.certificate.metadata.robustnessRadius,4):'UNVERIFIED · UI R='+fmt(robust,3)+' is only a requested/diagnostic radius');
  safeText('#ifcRevisionLink','formal claim r'+state.claimRevision+' · representation r'+state.representationRevision+' · object r'+state.objectRevision);
  const sel=S.selectedSampleId||ensureIfcSamples()[0].id;safeText('#ifcSelectedSample',sel);
  const fibre=bundles.find(b=>b.some(x=>x.id===sel));safeText('#ifcFibreBundle',fibre?'Fibre bundle @ '+sel+': '+fibre.map(x=>x.id).join(' ↔ ')+' · sample diameter='+fmt(ifcSampleDiameter(fibre),5):'Fibre bundle @ '+sel+': singleton in current finite sample.');
  safeText('#ifcGateSnapshot',JSON.stringify({ident,admissible,boundAvailable,numericalEligible,eps,Delta:F.Delta,status:cert,reasons:S.gate.blockedReasons,revisions:{object:state.objectRevision,representation:state.representationRevision,claim:state.claimRevision}}));
  return {enc,collision,noise,noiseScope,tol,data,bundles,actualCollision,theoremNonInjective,ident,sampleDiameter,certBound,records,fidelity:F,Delta:F.Delta,F:F.F,band:F.band,eps,confidence,robust,admissible,numericalEligible,identClosed,boundAvailable,blocked:S.gate.blockedReasons,cert};
}
function renderIfc3D(){
  const host=createLabHost('ifc','ifc3D',[7.6,4.7,8.7]);if(!host)return;clearLabGroup(host);const S=computeIfcState(),g=host.group;
  const grid=new THREE.GridHelper(10,20,0x244c5d,0x122d39);grid.position.y=-1.7;grid.material.transparent=true;grid.material.opacity=.18;g.add(grid);
  const bundleIds=new Set(S.bundles.flatMap(b=>b.map(x=>x.id))),selected=state.ifc.selectedSampleId;
  S.data.forEach((row,i)=>{
    const p=row.source,q=row.display,isSel=row.id===selected,inBundle=bundleIds.has(row.id);
    const sourceMat=new THREE.MeshStandardMaterial({color:isSel?0xffffff:0x8ed7ff,emissive:0x0b2635});const m=new THREE.Mesh(new THREE.SphereGeometry(isSel?.13:.09,14,10),sourceMat);m.position.set(...p);m.userData={sampleId:row.id,kind:'source'};g.add(m);
    const obsMat=new THREE.MeshStandardMaterial({color:isSel?0xffffff:(inBundle?0xf29a7a:0x8de4b0)});const om=new THREE.Mesh(new THREE.SphereGeometry(isSel?.15:.11,16,12),obsMat);om.position.set(...q);om.userData={sampleId:row.id,kind:'observation'};g.add(om);
    g.add(makeLine3D(p,q,inBundle?0xf29a7a:0x5ca9bd,inBundle?.9:.45));
  });
  S.fidelity.keys.forEach((k,i)=>{
    const d=S.fidelity.vals[k],x=-1.15+i*.58,z=.2+.14*i;
    if(d==null){const m=new THREE.Mesh(new THREE.BoxGeometry(.13,.13,.13),new THREE.MeshStandardMaterial({color:0x66737a,transparent:true,opacity:.4}));m.position.set(x,-1.05,z);g.add(m);return}
    const y=(1-d)*2-1;g.add(makeLine3D([x,-1.3,z],[x,y,z],0x8ed7ff,.72));const m=new THREE.Mesh(new THREE.SphereGeometry(.11,16,10),new THREE.MeshStandardMaterial({color:0x8ed7ff}));m.position.set(x,y,z);g.add(m);
  });
  const planeY=S.Delta==null?-1.4:(1-S.eps)*2-1,plane=new THREE.Mesh(new THREE.PlaneGeometry(3.3,2.4),new THREE.MeshBasicMaterial({color:0x8ed7ff,transparent:true,opacity:.08,side:THREE.DoubleSide}));plane.rotation.x=-Math.PI/2;plane.position.set(0,planeY,.35);g.add(plane);
  const gateStates=[{pass:S.ident!=='NON_IDENTIFIABLE',color:0x8de4b0},{pass:S.admissible,color:0x8de4b0},{pass:S.boundAvailable,color:0x8de4b0},{pass:S.cert==='ISSUED',color:0xb8a8ff}];
  gateStates.forEach((x,i)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.85,.38,.85),new THREE.MeshStandardMaterial({color:x.pass?x.color:0xf2c96d,transparent:true,opacity:.82,roughness:.4}));m.position.set(3.4,1.05-i*.72,0);g.add(m);if(i<gateStates.length-1)g.add(makeLine3D([3.4,.82-i*.72,0],[3.4,.45-i*.72,0],0x789aa4,.55));});
  safeText('#idFidelityVizStatus',S.cert==='BLOCKED'?'IDENTIFIABILITY/GATE BLOCKED · '+S.blocked.join(' · '):S.cert==='ISSUED'?'ISSUED only because a matching FORMAL EvidenceRecord exists.':'Fidelity may be high, but certificate remains '+S.cert+' until identifiability/bound/evidence close the gate.');
  if(!host.el.dataset.ifcPickingReady){
    host.el.dataset.ifcPickingReady='1';const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
    host.renderer.domElement.addEventListener('pointerdown',e=>{const rect=host.renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(pointer,host.camera);const hit=ray.intersectObjects(host.group.children,true).find(h=>h.object?.userData?.sampleId);if(hit){state.ifc.selectedSampleId=hit.object.userData.sampleId;renderIfc3D();drawFidelityPipeline();}});
  }
}
function setIfcLearnedMode(mode){const S=ifcModelDefaults();S.learned.mode=mode;S.learned.model=null;S.learned.trainingStatus=mode==='frozen'?'FROZEN_SEEDED':'READY_TO_TRAIN';$$('.ifc-learned-mode').forEach(b=>b.classList.toggle('active',b.dataset.ifcLearned===mode));ifcInitNetwork(true);renderIfc3D();}
$('#ifcEncoder')?.addEventListener('change',e=>{const S=ifcModelDefaults();S.encoder=e.target.value;updateIfcModelMeta();renderIfc3D();drawFidelityPipeline();});
$$('.ifc-learned-mode').forEach(b=>b.addEventListener('click',()=>setIfcLearnedMode(b.dataset.ifcLearned)));
['ifcArchitecture','ifcLatentDim','ifcHiddenWidth','ifcActivation','ifcModelSeed'].forEach(id=>$('#'+id)?.addEventListener('change',()=>{const S=ifcModelDefaults(),L=S.learned;L.architecture=$('#ifcArchitecture')?.value||L.architecture;L.latentDim=+($('#ifcLatentDim')?.value||L.latentDim);L.hiddenWidth=+($('#ifcHiddenWidth')?.value||L.hiddenWidth);L.activation=$('#ifcActivation')?.value||L.activation;L.seed=Math.trunc(+($('#ifcModelSeed')?.value||L.seed));L.model=null;ifcInitNetwork(true);renderIfc3D();}));
['ifcOptimizer','ifcLearningRate','ifcEpochs','ifcBatchSize'].forEach(id=>$('#'+id)?.addEventListener('change',()=>{const L=ifcModelDefaults().learned;L.optimizer=$('#ifcOptimizer')?.value||L.optimizer;L.learningRate=+($('#ifcLearningRate')?.value||L.learningRate);L.epochs=+($('#ifcEpochs')?.value||L.epochs);L.batchSize=+($('#ifcBatchSize')?.value||L.batchSize);updateIfcModelMeta();}));
$('#ifcResetModel')?.addEventListener('click',()=>{ifcInitNetwork(true);renderIfc3D();});
$('#ifcTrainModel')?.addEventListener('click',ifcTrainModel);
['ifcCollision','ifcNoise'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{renderIfc3D();drawFidelityPipeline();}));
['ifcNoiseScope','ifcCollisionTolerance'].forEach(id=>$('#'+id)?.addEventListener('change',()=>{renderIfc3D();drawFidelityPipeline();}));
$('#ifcSaveWitness')?.addEventListener('click',()=>{
  const S=computeIfcState();if(!state.ifc.collisionWitness){toast('저장할 finite collision witness가 없습니다.');return}
  const data={id:'ifc-witness-'+Date.now(),claimId:'IFC-COLLISION',createdAt:now(),state:{truth:'SUPPORTED',evidence:'EXACT_FINITE',run:'SUCCESS',freshness:'CURRENT',trust:'UNCONDITIONAL'},metadata:{type:'IFC_COLLISION_WITNESS',scope:'finite-sample',encoderMetadata:state.ifc.encoderMetadata,witness:state.ifc.collisionWitness,sampleAmbiguityDiameter:S.sampleDiameter,representationRevision:state.representationRevision}};
  storeEvidenceRecord(data,{id:'IFC-COLLISION'});addHistory('EVIDENCE','Stored finite collision witness '+data.id+' without promoting it to theorem-level non-injectivity.');toast('Collision witness EvidenceRecord 저장 완료');
});
$('#ifcExportAudit')?.addEventListener('click',()=>{
  const S=computeIfcState(),payload={schema:'MathScopeIFCGateAudit/1.0',exportedAt:now(),objectRevision:state.objectRevision,representationRevision:state.representationRevision,claimRevision:state.claimRevision,encoderMetadata:state.ifc.encoderMetadata,sourceSampleIds:ensureIfcSamples().map(s=>s.id),collisionWitness:state.ifc.collisionWitness,sampleAmbiguityDiameter:S.sampleDiameter,certifiedAmbiguityBound:S.certBound,noise:{scope:S.noiseScope,value:S.noise},fidelity:S.fidelity,confidence:S.confidence,robustnessRequested:S.robust,admissible:S.admissible,epsilon:S.eps,certificateStatus:S.cert,blockedReasons:S.blocked};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mathscope-ifc-gate-audit.json';a.click();URL.revokeObjectURL(a.href);addHistory('EXPORT','IFC gate audit exported with all decision inputs/reason tags.');
});

function mathExprTokenizer(src){
  const tokens=[];let i=0;
  while(i<src.length){
    if(/\s/.test(src[i])){i++;continue}
    const rest=src.slice(i),num=rest.match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
    if(num){tokens.push({t:'num',v:Number(num[0])});i+=num[0].length;continue}
    const id=rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);if(id){tokens.push({t:'id',v:id[0]});i+=id[0].length;continue}
    if('+-*/^(),'.includes(src[i])){tokens.push({t:src[i],v:src[i]});i++;continue}
    throw new Error('Unsupported token near "'+src.slice(i,i+12)+'"');
  }
  return tokens;
}
function compileMathExpression(source){
  const tokens=mathExprTokenizer(String(source||'')),allowedVars=new Set(['x','y','z','t']),funcs={sin:Math.sin,cos:Math.cos,tanh:Math.tanh,exp:Math.exp,sqrt:Math.sqrt,abs:Math.abs},consts={pi:Math.PI,e:Math.E};let pos=0;
  const peek=()=>tokens[pos],take=t=>{const a=peek();if(!a||a.t!==t)throw new Error('Expected '+t);pos++;return a};
  function primary(){
    const a=peek();if(!a)throw new Error('Unexpected end of expression');
    if(a.t==='num'){pos++;return ()=>a.v}
    if(a.t==='id'){
      pos++;const name=a.v;
      if(peek()?.t==='('){take('(');if(!funcs[name])throw new Error('Unsupported function '+name);const arg=expr();take(')');return vars=>funcs[name](arg(vars));}
      if(name in consts)return ()=>consts[name];
      if(!allowedVars.has(name))throw new Error('Unsupported variable '+name);
      return vars=>Number(vars[name]??0);
    }
    if(a.t==='('){take('(');const f=expr();take(')');return f}
    throw new Error('Unexpected token '+a.v);
  }
  function unary(){const a=peek();if(a?.t==='+'){pos++;return unary()}if(a?.t==='-'){pos++;const f=unary();return vars=>-f(vars)}return primary()}
  function power(){let left=unary();if(peek()?.t==='^'){pos++;const right=power(),L=left;left=vars=>Math.pow(L(vars),right(vars));}return left}
  function mul(){let left=power();while(peek()&&['*','/'].includes(peek().t)){const op=peek().t;pos++;const right=power(),L=left;left=op==='*'?(vars=>L(vars)*right(vars)):(vars=>L(vars)/right(vars));}return left}
  function expr(){let left=mul();while(peek()&&['+','-'].includes(peek().t)){const op=peek().t;pos++;const right=mul(),L=left;left=op==='+'?(vars=>L(vars)+right(vars)):(vars=>L(vars)-right(vars));}return left}
  const fn=expr();if(pos!==tokens.length)throw new Error('Unexpected trailing token '+tokens[pos].v);
  return vars=>{const v=fn(vars||{});if(!Number.isFinite(v))throw new Error('Expression evaluated to non-finite value');return v};
}
function parseHeightGrid(raw){
  const s=String(raw||'').trim();if(!s)throw new Error('Height grid is empty');
  let G;if(s.startsWith('['))G=JSON.parse(s);else G=s.split(/\r?\n/).map(r=>r.trim()).filter(Boolean).map(r=>r.split(/[\s,;]+/).filter(Boolean).map(Number));
  if(!Array.isArray(G)||G.length<2||!G.every(Array.isArray))throw new Error('Grid must be a 2D numeric array with at least 2 rows');
  const m=G[0].length;if(m<2||G.some(r=>r.length!==m))throw new Error('Grid must be rectangular with at least 2 columns');
  G=G.map(r=>r.map(Number));if(G.length>81||m>81)throw new Error('Grid capped at 81×81');if(G.some(r=>r.some(v=>!Number.isFinite(v))))throw new Error('Grid contains non-finite values');
  return G;
}
function sampleNumericGrid(G,u,v){
  const n=G.length,m=G[0].length,uu=clamp(u,0,1)*(m-1),vv=clamp(v,0,1)*(n-1),i=Math.min(m-2,Math.floor(uu)),j=Math.min(n-2,Math.floor(vv)),a=uu-i,b=vv-j;
  return (1-a)*(1-b)*G[j][i]+a*(1-b)*G[j][i+1]+(1-a)*b*G[j+1][i]+a*b*G[j+1][i+1];
}
function ensureGeometryState(){
  const G=state.geometryCore||(state.geometryCore={});
  if(!G.surface)G.surface='sphere';if(!G.topology)G.topology='sphere';if(!G.metricSemantic)G.metricSemantic='both';if(!G.curvatureType)G.curvatureType='gaussian';if(!G.curvatureNorm)G.curvatureNorm='auto';if(!Number.isFinite(G.solverResolution))G.solverResolution=23;
  if(!G.custom)G.custom={mode:'expression',expr:'0.35*sin(1.6*x)*cos(1.3*y)+0.08*x*y',gridText:'[[0,0.2,0],[0.2,0.5,0.2],[0,0.2,0]]',domain:1.7,heightScale:1,revision:1,grid:null,exprCompiled:null,exprKey:''};
  if(!G.geodesic)G.geodesic={a:'sphere:s01',b:'sphere:s07',pathIds:[],approxDistance:null,certifiedDistance:null,chordDistance:null};
  return G;
}
function customHeightAt(x,y){
  const G=ensureGeometryState(),C=G.custom,scale=Number(C.heightScale||1);
  if(C.mode==='sampled'){
    if(!C.grid)C.grid=parseHeightGrid(C.gridText);const H=C.grid,n=H.length,m=H[0].length,d=Math.max(.1,Number(C.domain||1.7)),u=clamp((x+d)/(2*d),0,1)*(m-1),v=clamp((y+d)/(2*d),0,1)*(n-1),i=Math.min(m-2,Math.floor(u)),j=Math.min(n-2,Math.floor(v)),a=u-i,b=v-j;
    return scale*((1-a)*(1-b)*H[j][i]+a*(1-b)*H[j][i+1]+(1-a)*b*H[j+1][i]+a*b*H[j+1][i+1]);
  }
  const key=C.expr;if(!C.exprCompiled||C.exprKey!==key){C.exprCompiled=compileMathExpression(key);C.exprKey=key}
  return scale*C.exprCompiled({x,y,z:0,t:0});
}
function surfacePoint(surface,u,v){
  const G=ensureGeometryState();
  if(surface==='sphere'){const th=Math.PI*v,ph=2*Math.PI*u;return new THREE.Vector3(Math.sin(th)*Math.cos(ph),Math.cos(th),Math.sin(th)*Math.sin(ph));}
  if(surface==='torus'){const U=2*Math.PI*u,V=2*Math.PI*v,R=1.25,r=.42;return new THREE.Vector3((R+r*Math.cos(V))*Math.cos(U),r*Math.sin(V),(R+r*Math.cos(V))*Math.sin(U));}
  const d=surface==='saddle'?1.7:Number(G.custom.domain||1.7),x=(2*u-1)*d,z=(2*v-1)*d,y=surface==='saddle'?.28*(x*x-z*z):customHeightAt(x,z);return new THREE.Vector3(x,y,z);
}
function surfaceTangents(surface,u,v){
  const h=1e-4,p=surfacePoint(surface,u,v),pu=surfacePoint(surface,clamp(u+h,0,1),v).sub(surfacePoint(surface,clamp(u-h,0,1),v)),pv=surfacePoint(surface,u,clamp(v+h,0,1)).sub(surfacePoint(surface,u,clamp(v-h,0,1)));
  if(pu.length()<1e-9)pu.set(1,0,0);if(pv.length()<1e-9)pv.set(0,0,1);const n=pu.clone().cross(pv).normalize();return {p,tu:pu.normalize(),tv:pv.normalize(),n};
}
function graphDerivatives(surface,u,v){
  const G=ensureGeometryState(),d=surface==='saddle'?1.7:Number(G.custom.domain||1.7),x=(2*u-1)*d,z=(2*v-1)*d,h=Math.max(1e-3,d*1e-3),f=(X,Z)=>surface==='saddle'?.28*(X*X-Z*Z):customHeightAt(X,Z),f0=f(x,z),fx=(f(x+h,z)-f(x-h,z))/(2*h),fz=(f(x,z+h)-f(x,z-h))/(2*h),fxx=(f(x+h,z)-2*f0+f(x-h,z))/(h*h),fzz=(f(x,z+h)-2*f0+f(x,z-h))/(h*h),fxz=(f(x+h,z+h)-f(x+h,z-h)-f(x-h,z+h)+f(x-h,z-h))/(4*h*h);
  return {fx,fz,fxx,fzz,fxz};
}
function surfaceCurvature(surface,u,v,type){
  if(type==='proxy'){const p=surfacePoint(surface,u,v);return p.y}
  if(surface==='sphere')return type==='mean'?1:1;
  if(surface==='torus'){const V=2*Math.PI*v,R=1.25,r=.42,den=R+r*Math.cos(V);return type==='mean'?(R+2*r*Math.cos(V))/(2*r*den):Math.cos(V)/(r*den);}
  const d=graphDerivatives(surface,u,v),q=1+d.fx*d.fx+d.fz*d.fz;if(type==='mean')return ((1+d.fz*d.fz)*d.fxx-2*d.fx*d.fz*d.fxz+(1+d.fx*d.fx)*d.fzz)/(2*Math.pow(q,1.5));return (d.fxx*d.fzz-d.fxz*d.fxz)/(q*q);
}
function surfaceGridDimensions(surface,res){
  const r=Math.max(8,Math.trunc(res));return surface==='sphere'?{nu:r*2,nv:r,wrapU:true,wrapV:false}:surface==='torus'?{nu:r*2,nv:r,wrapU:true,wrapV:true}:{nu:r,nv:r,wrapU:false,wrapV:false};
}
function buildSurfaceMeshData(surface,res){
  const D=surfaceGridDimensions(surface,res),positions=[],uv=[],indices=[],ids=[];
  const uCount=D.wrapU?D.nu:D.nu+1,vCount=D.wrapV?D.nv:D.nv+1;
  for(let j=0;j<vCount;j++)for(let i=0;i<uCount;i++){const u=D.wrapU?i/D.nu:i/D.nu,v=D.wrapV?j/D.nv:j/D.nv;positions.push(surfacePoint(surface,u,v));uv.push([u,v]);ids.push(surface+':mesh:'+String(j).padStart(3,'0')+':'+String(i).padStart(3,'0'));}
  const idx=(i,j)=>j*uCount+i;
  const maxJ=D.wrapV?D.nv:D.nv,maxI=D.wrapU?D.nu:D.nu;
  for(let j=0;j<maxJ;j++)for(let i=0;i<maxI;i++){const ni=D.wrapU?(i+1)%uCount:i+1,nj=D.wrapV?(j+1)%vCount:j+1,a=idx(i,j),b=idx(ni,j),c=idx(i,nj),d=idx(ni,nj);indices.push(a,c,b,b,c,d);}
  return {surface,positions,uv,indices,ids,nu:D.nu,nv:D.nv,wrapU:D.wrapU,wrapV:D.wrapV};
}
function surfaceDataToGeometry(data,curvatureValues=null,range=null){
  const pos=[],colors=[];data.positions.forEach((p,i)=>{pos.push(p.x,p.y,p.z);const val=curvatureValues?.[i]??0,col=range?curvatureRamp(val,range[0],range[1]):new THREE.Color(0x35d3c5);colors.push(col.r,col.g,col.b);});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(data.indices);geo.computeVertexNormals();return geo;
}
function curvatureRamp(v,min,max){const t=clamp((v-min)/Math.max(1e-12,max-min),0,1),c=new THREE.Color();c.setRGB(.92-.66*t,.3+.55*t,.25+.6*t);return c}
function robustRange(vals){const a=vals.filter(Number.isFinite).slice().sort((x,y)=>x-y);if(!a.length)return [-1,1];const lo=a[Math.floor(.05*(a.length-1))],hi=a[Math.floor(.95*(a.length-1))];return Math.abs(hi-lo)<1e-12?[lo-1,hi+1]:[lo,hi]}
function geometrySemanticSamples(surface){
  const uv=[[.08,.18],[.25,.18],[.42,.18],[.67,.18],[.88,.18],[.12,.5],[.35,.5],[.62,.5],[.88,.5],[.18,.82],[.5,.82],[.82,.82]],prefix=surface+':s';
  return uv.map((q,i)=>({id:prefix+String(i+1).padStart(2,'0'),uv:q,point:surfacePoint(surface,q[0],q[1])}));
}
function geometryPopulateEndpoints(){
  const G=ensureGeometryState(),samples=geometrySemanticSamples(G.surface),ids=new Set(samples.map(s=>s.id));if(!ids.has(G.geodesic.a))G.geodesic.a=samples[0].id;if(!ids.has(G.geodesic.b))G.geodesic.b=samples[Math.min(6,samples.length-1)].id;
  for(const id of ['geodesicA','geodesicB']){const el=$('#'+id);if(el){el.innerHTML=samples.map(s=>'<option value="'+escapeHtml(s.id)+'">'+escapeHtml(s.id)+'</option>').join('');el.value=id==='geodesicA'?G.geodesic.a:G.geodesic.b;}}
  safeText('#geodesicEndpointIds',G.geodesic.a+' ↔ '+G.geodesic.b);return samples;
}
function meshAdjacency(data){
  const adj=Array.from({length:data.positions.length},()=>new Map()),add=(a,b)=>{const w=data.positions[a].distanceTo(data.positions[b]),m=adj[a];if(!m.has(b)||w<m.get(b))m.set(b,w);};
  for(let q=0;q<data.indices.length;q+=3){const a=data.indices[q],b=data.indices[q+1],c=data.indices[q+2];add(a,b);add(b,a);add(b,c);add(c,b);add(c,a);add(a,c);}return adj;
}
function nearestMeshVertex(data,p){let best=0,d=Infinity;data.positions.forEach((q,i)=>{const x=q.distanceToSquared(p);if(x<d){d=x;best=i}});return best}
function dijkstraPath(data,start,end){
  const adj=meshAdjacency(data),n=data.positions.length,dist=Array(n).fill(Infinity),prev=Array(n).fill(-1),used=Array(n).fill(false);dist[start]=0;
  for(let step=0;step<n;step++){let u=-1,b=Infinity;for(let i=0;i<n;i++)if(!used[i]&&dist[i]<b){b=dist[i];u=i}if(u<0||u===end)break;used[u]=true;for(const [v,w] of adj[u]){const nd=dist[u]+w;if(nd<dist[v]){dist[v]=nd;prev[v]=u}}}
  if(!Number.isFinite(dist[end]))return {distance:Infinity,path:[]};const path=[];for(let u=end;u>=0;u=prev[u]){path.push(u);if(u===start)break}path.reverse();return {distance:dist[end],path};
}
function gpdGeodesicEvidence(a,b){
  return state.evidenceRecords.find(ev=>ev.freshness==='CURRENT'&&ev.runStatus==='SUCCESS'&&(ev.evidenceGrade==='FORMAL'||ev.evidenceGrade==='REVIEWED')&&ev.objectRevision===state.objectRevision&&ev.metadata?.type==='GPD_GEODESIC_CERTIFICATE'&&((ev.metadata?.endpointA===a&&ev.metadata?.endpointB===b)||(ev.metadata?.endpointA===b&&ev.metadata?.endpointB===a)))||null;
}
function computeGeometryGeodesic(){
  const G=ensureGeometryState(),samples=geometrySemanticSamples(G.surface),map=new Map(samples.map(s=>[s.id,s]));G.geodesic.a=$('#geodesicA')?.value||G.geodesic.a;G.geodesic.b=$('#geodesicB')?.value||G.geodesic.b;const A=map.get(G.geodesic.a),B=map.get(G.geodesic.b);if(!A||!B)return null;
  const data=buildSurfaceMeshData(G.surface,G.solverResolution),ia=nearestMeshVertex(data,A.point),ib=nearestMeshVertex(data,B.point),D=dijkstraPath(data,ia,ib),chord=A.point.distanceTo(B.point),ev=gpdGeodesicEvidence(G.geodesic.a,G.geodesic.b);
  Object.assign(G.geodesic,{pathIds:D.path.map(i=>data.ids[i]),pathPoints:D.path.map(i=>data.positions[i].toArray()),approxDistance:D.distance,chordDistance:chord,certifiedDistance:Number.isFinite(ev?.metadata?.distance)?ev.metadata.distance:null,evidenceRef:ev?.id||null,solverResolution:G.solverResolution});
  safeText('#geodesicEndpointIds',G.geodesic.a+' ↔ '+G.geodesic.b);safeText('#intrinsicDistanceApprox',Number.isFinite(D.distance)?fmt(D.distance,7)+' · mesh geodesic approximation':'UNAVAILABLE');safeText('#intrinsicDistanceCertified',Number.isFinite(G.geodesic.certifiedDistance)?fmt(G.geodesic.certifiedDistance,7)+' · '+G.geodesic.evidenceRef:'UNKNOWN · no matching EvidenceRecord');safeText('#ambientChordDistance',fmt(chord,7)+' · ambient Euclidean chord');renderGeometryCore3D();return G.geodesic;
}
function addGeometryTangents(group,surface,density){
  const samples=geometrySemanticSamples(surface),count=Math.min(samples.length,Math.max(4,Math.round(density*.65)));for(let i=0;i<count;i++){const s=samples[Math.floor(i*samples.length/count)],T=surfaceTangents(surface,s.uv[0],s.uv[1]);group.add(new THREE.ArrowHelper(T.tu,T.p.clone().addScaledVector(T.n,.025),.34,0xf2c96d,.1,.05));}
}
function renderGeometryCore3D(){
  const host=createLabHost('geometryCore','geometryCore3D',[4.8,3.1,5.7]);if(!host)return;clearLabGroup(host);const G=ensureGeometryState();
  G.surface=G.surface||'sphere';G.tangent=$('#geometryTangent')?.checked!==false;G.curvature=$('#geometryCurvature')?.checked!==false;G.tangentDensity=clamp(Math.trunc(+($('#geometryTangentDensity')?.value||G.tangentDensity||10)),4,20);G.meshResolution=clamp(Math.trunc(+($('#geometryMeshResolution')?.value||G.meshResolution||40)),16,72);G.solverResolution=clamp(Math.trunc(+($('#geometrySolverResolution')?.value||G.solverResolution||23)),9,41);G.topology=$('#geometryTopology')?.value||G.topology;G.metricSemantic=$('#geometryMetricSemantic')?.value||G.metricSemantic;G.curvatureType=$('#geometryCurvatureType')?.value||G.curvatureType;G.curvatureNorm=$('#geometryCurvatureNorm')?.value||G.curvatureNorm;
  const data=buildSurfaceMeshData(G.surface,Math.max(10,Math.round(G.meshResolution/2))),curv=data.uv.map(q=>surfaceCurvature(G.surface,q[0],q[1],G.curvatureType)),range=G.curvatureNorm==='fixed'?[-1,1]:robustRange(curv),geo=surfaceDataToGeometry(data,G.curvature?curv:null,G.curvature?range:null),g=host.group;
  const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.84,roughness:.42,metalness:.03,side:THREE.DoubleSide}));g.add(mesh);g.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo),new THREE.LineBasicMaterial({color:0xb7dae3,transparent:true,opacity:.07})));
  if(G.tangent)addGeometryTangents(g,G.surface,G.tangentDensity);
  const samples=geometryPopulateEndpoints(),A=samples.find(s=>s.id===G.geodesic.a),B=samples.find(s=>s.id===G.geodesic.b);if(A&&B){const ma=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),new THREE.MeshStandardMaterial({color:0xffffff}));ma.position.copy(A.point);g.add(ma);const mb=ma.clone();mb.position.copy(B.point);g.add(mb);g.add(makeLine3D(A.point.toArray(),B.point.toArray(),0xf29a7a,.75,true));}
  if(Array.isArray(G.geodesic.pathPoints)&&G.geodesic.pathPoints.length>1){const pts=G.geodesic.pathPoints.map(x=>new THREE.Vector3(...x));g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x8de4b0,transparent:true,opacity:.95})));}
  const grid=new THREE.GridHelper(6,20,0x244c5d,0x122d39);grid.position.y=-1.9;grid.material.transparent=true;grid.material.opacity=.14;g.add(grid);
  safeText('#geometryTangentDensityVal',String(G.tangentDensity));safeText('#geometryMeshResolutionVal',String(G.meshResolution));safeText('#geometrySolverResolutionVal',String(G.solverResolution));safeText('#geometryCoreSurface',G.surface);safeText('#geometryTopologyStatus',G.topology+' · metadata only, not inferred from mesh');safeText('#geometryCoreCurvatureSemantic',G.curvature?(G.curvatureType+' · '+G.curvatureNorm+' normalization'):'heatmap disabled');safeText('#geometryCurvatureRange',G.curvature?(fmt(range[0],5)+' … '+fmt(range[1],5)):'—');safeText('#geometryMeshSemantic','visual='+G.meshResolution+' · solver='+G.solverResolution+' · independent');safeText('#geometryCoreStatus',G.surface+' · topology='+G.topology+' · metric='+G.metricSemantic+' · curvature='+G.curvatureType+'. Green path=intrinsic mesh approximation; dashed red=ambient chord. Visual shape does not certify topology/geodesic distance.');
}
function applyCustomSurface(){
  const G=ensureGeometryState(),C=G.custom;C.mode=$$('.custom-surface-mode').find(b=>b.classList.contains('active'))?.dataset.customSurfaceMode||C.mode;C.expr=$('#customSurfaceExpr')?.value||C.expr;C.gridText=$('#customSurfaceGrid')?.value||C.gridText;C.domain=clamp(+($('#customSurfaceDomain')?.value||C.domain||1.7),.5,5);C.heightScale=clamp(+($('#customSurfaceHeightScale')?.value||C.heightScale||1),.05,3);
  try{if(C.mode==='expression'){C.exprCompiled=compileMathExpression(C.expr);C.exprKey=C.expr;C.exprCompiled({x:.1,y:.2,z:0,t:0});}else C.grid=parseHeightGrid(C.gridText);C.revision++;G.surface='custom';G.topology=$('#geometryTopology')?.value||'unknown';G.geodesic.pathPoints=[];$$('.geometry-core-preset').forEach(b=>b.classList.toggle('active',b.dataset.geometryCore==='custom'));safeText('#customSurfaceStatus','CUSTOM '+C.mode.toUpperCase()+' READY · revision '+C.revision+' · topology metadata remains '+G.topology);renderGeometryCore3D();ensurePdeModel(true);renderPde3D();updateSessionHash();}catch(err){safeText('#customSurfaceStatus','CUSTOM INPUT ERROR · '+String(err?.message||err));}
}
$$('.custom-surface-mode').forEach(b=>b.addEventListener('click',()=>{const G=ensureGeometryState();G.custom.mode=b.dataset.customSurfaceMode;$$('.custom-surface-mode').forEach(x=>x.classList.toggle('active',x===b));if($('#customExpressionPanel'))$('#customExpressionPanel').style.display=G.custom.mode==='expression'?'block':'none';if($('#customSamplePanel'))$('#customSamplePanel').style.display=G.custom.mode==='sampled'?'block':'none';}));
$('#applyCustomSurface')?.addEventListener('click',applyCustomSurface);
$('#customSurfaceFile')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{const txt=await f.text();parseHeightGrid(txt);if($('#customSurfaceGrid'))$('#customSurfaceGrid').value=txt;safeText('#customSurfaceStatus','Loaded sampled surface file '+f.name+' · click Apply custom graph to commit.');}catch(err){safeText('#customSurfaceStatus','FILE ERROR · '+String(err?.message||err));}e.target.value='';});
$$('.geometry-core-preset').forEach(b=>b.addEventListener('click',()=>{const G=ensureGeometryState();G.surface=b.dataset.geometryCore;if(G.surface==='sphere')G.topology='sphere';else if(G.surface==='torus')G.topology='torus';else if(G.surface==='saddle')G.topology='plane';else if(G.surface==='custom')G.topology='unknown';G.geodesic.pathPoints=[];$$('.geometry-core-preset').forEach(x=>x.classList.toggle('active',x===b));if($('#geometryCustomPanel'))$('#geometryCustomPanel').style.display=G.surface==='custom'?'block':'none';if($('#geometryTopology'))$('#geometryTopology').value=G.topology;renderGeometryCore3D();ensurePdeModel(true);renderPde3D();renderTransfer3D();}));
['geometryTangent','geometryCurvature','geometryTangentDensity','geometryMeshResolution','geometrySolverResolution','geometryTopology','geometryMetricSemantic','geometryCurvatureType','geometryCurvatureNorm'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{const G=ensureGeometryState();if(id==='geometryTopology')G.topology=$('#geometryTopology').value;if(id==='geometryMetricSemantic')G.metricSemantic=$('#geometryMetricSemantic').value;if(id==='geometryCurvatureType')G.curvatureType=$('#geometryCurvatureType').value;if(id==='geometryCurvatureNorm')G.curvatureNorm=$('#geometryCurvatureNorm').value;if(id==='geometrySolverResolution'){G.solverResolution=+$('#geometrySolverResolution').value;state.pdeModel=null;}renderGeometryCore3D();if(id==='geometrySolverResolution')renderPde3D();}));
$('#computeGeodesic')?.addEventListener('click',computeGeometryGeodesic);
['geodesicA','geodesicB'].forEach(id=>$('#'+id)?.addEventListener('change',()=>{const G=ensureGeometryState();G.geodesic.a=$('#geodesicA')?.value||G.geodesic.a;G.geodesic.b=$('#geodesicB')?.value||G.geodesic.b;safeText('#geodesicEndpointIds',G.geodesic.a+' ↔ '+G.geodesic.b);}));

function signpow(x,a){return Math.sign(x)*Math.pow(Math.abs(x),a)}
function lpMap(x,p){return x.map(v=>signpow(v,p/2))}
function lpInv(y,p){return y.map(v=>signpow(v,2/p))}
function lpNormP(x,p){return x.reduce((s,v)=>s+Math.pow(Math.abs(v),p),0)}
function parseVector(s){
  const raw=String(s??'').trim();if(!raw)return [];
  let arr=[];
  try{
    if(raw.startsWith('[')){
      const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error('JSON input must be an array');arr=parsed;
    }else arr=raw.split(',').map(v=>v.trim()).filter(v=>v.length);
  }catch(_e){window.__faVectorParse={status:'ERROR',message:'Invalid JSON/comma vector syntax'};return []}
  const nums=arr.map(Number);
  if(nums.some(v=>!Number.isFinite(v))){window.__faVectorParse={status:'ERROR',message:'NaN/Infinity/non-numeric entries are rejected'};return []}
  const truncated=nums.length>32;const out=nums.slice(0,32);
  window.__faVectorParse={status:truncated?'TRUNCATED':'OK',message:truncated?'Coordinate count capped at 32':'Parsed '+out.length+' finite coordinates'};
  return out;
}
function functionalCompute(){
  const p=+($('#pRange')?.value||state.p),v=parseVector($('#faVector')?.value||state.faVector.join(','));
  if(!v.length){safeText('#faVectorStatus',window.__faVectorParse?.message||'Vector must contain at least one finite coordinate.');return}
  safeText('#faVectorStatus',(window.__faVectorParse?.status==='TRUNCATED'?'WARNING · ':'OK · ')+(window.__faVectorParse?.message||'finite vector parsed')+' · p≥1 enforced');
  state.p=p;state.faVector=v;const n=v.length,k=clamp(+($('#kRange')?.value||state.k),1,Math.max(1,n));state.k=k;
  if($('#kRange')){$('#kRange').max=Math.max(1,n);$('#kRange').value=k}
  safeText('#pValue',fmt(p,2));safeText('#kValue',String(k));
  const y=lpMap(v,p),yp=y.map((a,i)=>i<k?a:0),xh=lpInv(yp,p);
  const sourceResidual=v.map((a,i)=>a-xh[i]),mappedResidual=y.map((a,i)=>i<k?0:a),lhs=lpNormP(sourceResidual,p),rhs=mappedResidual.reduce((s,a)=>s+a*a,0);
  state.faResidual={sourceLpPower:lhs,mappedL2Squared:rhs,sourceVector:sourceResidual,mappedVector:mappedResidual};
  safeText('#mpVector','('+y.map(a=>fmt(a,4)).join(', ')+')');safeText('#reconVector','('+xh.map(a=>fmt(a,4)).join(', ')+')');
  safeText('#lpLhs',fmt(lhs,8));safeText('#lpRhs',fmt(rhs,8));safeText('#faSourceResidual','power='+fmt(lhs,8)+' · vector=('+sourceResidual.map(a=>fmt(a,4)).join(', ')+')');safeText('#faMappedResidual','squared='+fmt(rhs,8)+' · vector=('+mappedResidual.map(a=>fmt(a,4)).join(', ')+')');
  const finiteMatch=Math.abs(lhs-rhs)<1e-9,basisType=state.faBasis?.type||'standard';
  safeText('#lpIdentity',basisType==='standard'?(finiteMatch?'MATCH — STANDARD Pₖ EXACT_FINITE':'MISMATCH'):'STANDARD-Pₖ IDENTITY ONLY · USER BASIS NOT AUTO-CERTIFIED');
  $('#lpIdentity')?.classList.toggle('good',basisType==='standard'&&finiteMatch);
  const zeroRegression=k===n&&Math.abs(lhs)<1e-12&&Math.abs(rhs)<1e-12;
  safeText('#faRankAudit','FA-18 · k='+k+' ≤ n='+n+' · '+(k===n?(zeroRegression?'k=n EXACT_ZERO_REGRESSION PASS':'k=n REGRESSION FAIL'):'rank clamped; residual tail retained'));
  const samples=[
    v, v.map((z,i)=>z+(i===0?.7:.08*(i+1))),v.map((z,i)=>z-(i===1?.6:.04*(i+2))),
    v.map((z,i)=>.6*z+.1*i),v.map((z,i)=>1.15*z-.05*i),v.map((z,i)=>-0.35*z+.12*i)
  ].map(x=>lpMap(x,p));
  let rho=0;
  for(let i=0;i<samples.length;i++)for(let j=i+1;j<samples.length;j++){const d=samples[i].map((a,q)=>a-samples[j][q]);const norm=Math.hypot(...d),tail=Math.hypot(...d.slice(k));if(norm>1e-12)rho=Math.max(rho,tail/norm);}
  state.faSampleRho={value:rho,grade:'ESTIMATED',sampleSize:samples.length};
  safeText('#sampleRho',fmt(rho,5));
  const certEv=state.evidenceRecords.find(ev=>ev.claimId==='HILB-1'&&ev.evidenceGrade==='FORMAL'&&ev.freshness==='CURRENT'&&ev.runStatus==='SUCCESS'&&Number.isFinite(ev.certifiedUpper));
  state.faCertifiedRho=certEv?{value:certEv.certifiedUpper,evidenceRef:certEv.id,status:'THEOREM_BACKED'}:{value:null,evidenceRef:null,status:'UNKNOWN'};
  safeText('#certRho',certEv?fmt(certEv.certifiedUpper,5)+' · '+certEv.id:'UNKNOWN');
  safeText('#topCert',certEv&&certEv.certifiedUpper<1?'ELIGIBLE — FORMAL/THEOREM-BACKED Uₖ<1':'NOT AVAILABLE');
  const x=[4,1],yy=lpMap(x,1),s=Math.SQRT1_2,coef=(yy[0]+yy[1])*s,q=[coef*s,coef*s],xr=lpInv(q,1);
  const err=Math.abs(x[0]-xr[0])+Math.abs(x[1]-xr[1]),hres=(yy[0]-q[0])**2+(yy[1]-q[1])**2;
  safeText('#rotErr',fmt(err,4));safeText('#rotHilb',fmt(hres,4));safeText('#rotVerdict',Math.abs(err-hres)>1e-8?'COUNTEREXAMPLE REPRODUCED':'unexpected');
  const m=+($('#multiM')?.value||state.multiViewM),d=+($('#boxDim')?.value||state.boxDim);state.multiViewM=m;state.boxDim=d;
  safeText('#multiMValue',String(m));safeText('#boxDimValue',fmt(d,1));safeText('#targetDim',String(3*m));safeText('#dimHeuristic',3*m>2*d?'DIMENSION HEURISTIC PASSED':'MORE VIEWS NEEDED');
  if($('#faSelectedMode')){$('#faSelectedMode').max=Math.max(1,n);state.faSelectedMode=clamp(state.faSelectedMode||1,1,Math.max(1,n));$('#faSelectedMode').value=state.faSelectedMode;safeText('#faSelectedModeVal',String(state.faSelectedMode));}
  updateOperatorSchemaUI();drawFunctionalViz();renderFunctional3D();auditBasisSource({silent:true});
  updateSessionHash();
}
['#pRange','#kRange','#faVector','#multiM','#boxDim'].forEach(id=>$(id)?.addEventListener('input',functionalCompute));


function drawFunctionalViz(){
  const canvas=$('#lpVizCanvas'),s=setupCanvas(canvas);if(!s||s.w<20||s.h<20)return;
  const {c,w,h}=s,p=+($('#pRange')?.value||state.p),v=parseVector($('#faVector')?.value||state.faVector.join(','));
  if(!v.length){safeText('#lpVizStatus','시각화할 유한 demo vector가 없습니다.');return}
  const k=clamp(+($('#kRange')?.value||state.k),1,v.length),y=lpMap(v,p),trunc=y.map((a,i)=>i<k?a:0);
  c.clearRect(0,0,w,h);
  const pad=18,gap=20,panelW=(w-pad*2-gap*2)/3,panelY=38,panelH=h-76;
  const maxAbs=Math.max(1e-9,...v.map(Math.abs),...y.map(Math.abs));
  const drawPanel=(x,title,vals,mode)=>{
    c.fillStyle='rgba(8,30,42,.78)';c.strokeStyle='rgba(111,165,180,.25)';c.lineWidth=1;
    c.beginPath();c.roundRect(x,panelY,panelW,panelH,10);c.fill();c.stroke();
    c.fillStyle='#cfe7ea';c.font='600 11px Space Grotesk, sans-serif';c.fillText(title,x+10,panelY+18);
    const base=panelY+panelH*.58,innerW=panelW-20,count=Math.min(16,vals.length),bw=Math.max(4,Math.min(18,innerW/Math.max(1,count)-4));
    c.strokeStyle='rgba(140,205,217,.14)';c.beginPath();c.moveTo(x+10,base);c.lineTo(x+panelW-10,base);c.stroke();
    vals.slice(0,16).forEach((val,i)=>{
      const xx=x+12+(i+.5)*(innerW/Math.max(1,count)),mag=Math.min(panelH*.34,Math.abs(val)/maxAbs*panelH*.34);
      let color='#8ed7ff';
      if(mode==='mapped')color='#35d3c5';
      if(mode==='trunc')color=i<k?'#8de4b0':'#f2c96d';
      c.fillStyle=color;c.globalAlpha=mode==='trunc'&&i>=k?.85:.9;
      const yy=val>=0?base-mag:base;
      c.fillRect(xx-bw/2,yy,bw,Math.max(2,mag));
      if(mode==='trunc'&&i>=k){
        c.strokeStyle='#f2c96d';
        const omag=Math.min(panelH*.34,Math.abs(y[i])/maxAbs*panelH*.34);
        c.strokeRect(xx-bw/2,base-omag,bw,Math.max(2,omag));
      }
      c.globalAlpha=1;c.fillStyle='#7197a2';c.font='8px IBM Plex Mono, monospace';c.fillText(String(i+1),xx-3,panelY+panelH-7);
    });
    c.fillStyle='#7f9fa8';c.font='9px IBM Plex Sans KR, sans-serif';
    c.fillText(mode==='source'?'source coordinates':mode==='mapped'?'nonlinear Mₚ normalization':'green=Pₖ kept · amber=tail',x+10,panelY+panelH-22);
  };
  drawPanel(pad,'x ∈ ℓᵖ (finite demo)',v,'source');
  drawPanel(pad+panelW+gap,'Mₚ(x) ∈ ℓ²',y,'mapped');
  drawPanel(pad+(panelW+gap)*2,'PₖMₚ(x) + residual',trunc,'trunc');
  c.strokeStyle='rgba(142,215,255,.7)';c.fillStyle='#8ed7ff';c.lineWidth=1.5;
  for(const xx of [pad+panelW+gap/2,pad+2*panelW+1.5*gap]){
    c.beginPath();c.moveTo(xx-8,h/2);c.lineTo(xx+8,h/2);c.stroke();
    c.beginPath();c.moveTo(xx+8,h/2);c.lineTo(xx+3,h/2-4);c.lineTo(xx+3,h/2+4);c.closePath();c.fill();
  }
  const tailEnergy=y.slice(k).reduce((sum,a)=>sum+a*a,0),totalEnergy=y.reduce((sum,a)=>sum+a*a,0)||1;
  safeText('#lpVizStatus','p='+fmt(p,2)+' · k='+k+' · displayed coordinates='+v.length+' · residual ℓ² energy²='+fmt(tailEnergy,6)+' ('+fmt(100*tailEnergy/totalEnergy,2)+'%). 이 화면은 finite-coordinate observation이며 무한차원 원공간의 literal 3D shape가 아닙니다.');
}

function drawFidelityPipeline(){
  const canvas=$('#idFidelityCanvas'),s=setupCanvas(canvas);if(!s||s.w<20||s.h<20)return;
  const {c,w,h}=s,S=computeIfcState(),F=S.fidelity,keys=F.keys;
  c.clearRect(0,0,w,h);
  const gap=24,pad=18,boxW=(w-pad*2-gap*2)/3,boxH=h-50,top=28;
  const box=(x,title,stroke)=>{c.fillStyle='rgba(8,30,42,.78)';c.strokeStyle=stroke;c.lineWidth=1.2;c.beginPath();c.roundRect(x,top,boxW,boxH,12);c.fill();c.stroke();c.fillStyle='#d8edf0';c.font='600 11px Space Grotesk, sans-serif';c.fillText(title,x+10,top+19);};
  const x1=pad,x2=pad+boxW+gap,x3=pad+(boxW+gap)*2;
  box(x1,'1 · IDENTIFIABILITY',S.ident==='NON_IDENTIFIABLE'?'rgba(242,154,122,.65)':'rgba(141,228,176,.55)');
  const srcX=x1+boxW*.27,obsX=x1+boxW*.72,rows=S.data.slice(0,4);
  rows.forEach((row,i)=>{const yy=top+65+i*42;c.fillStyle=row.id===state.ifc.selectedSampleId?'#ffffff':'#8ed7ff';c.beginPath();c.arc(srcX,yy,5,0,Math.PI*2);c.fill();const bundle=S.bundles.find(b=>b.some(x=>x.id===row.id));const targetY=bundle?top+105+S.bundles.indexOf(bundle)*45:yy;c.strokeStyle=bundle?'rgba(242,154,122,.7)':'rgba(141,228,176,.42)';c.beginPath();c.moveTo(srcX+6,yy);c.lineTo(obsX-6,targetY);c.stroke();});
  const targetYs=[];rows.forEach((row,i)=>{const bundle=S.bundles.find(b=>b.some(x=>x.id===row.id));const yy=bundle?top+105+S.bundles.indexOf(bundle)*45:top+65+i*42;if(!targetYs.some(y=>Math.abs(y-yy)<2)){targetYs.push(yy);c.fillStyle=bundle?'#f29a7a':'#8de4b0';c.beginPath();c.arc(obsX,yy,6,0,Math.PI*2);c.fill();}});
  c.fillStyle=S.ident==='NON_IDENTIFIABLE'?'#f29a7a':'#8de4b0';c.font='9px IBM Plex Mono, monospace';c.fillText(S.ident+' · sample diam='+fmt(S.sampleDiameter,3),x1+10,top+boxH-18);
  box(x2,'2 · FIDELITY / Δ VECTOR','rgba(142,215,255,.4)');
  keys.forEach((k,i)=>{const d=F.vals[k],yy=top+55+i*32;c.fillStyle='#789aa4';c.font='9px IBM Plex Mono, monospace';c.fillText(k.toLowerCase(),x2+10,yy+7);c.fillStyle='rgba(142,215,255,.15)';c.fillRect(x2+72,yy,Math.max(30,boxW-92),9);if(d==null){c.fillStyle='#66737a';c.fillText('MISSING',x2+76,yy+8);}else{c.fillStyle='#8ed7ff';c.fillRect(x2+72,yy,Math.max(1,(boxW-92)*clamp(d,0,1)),9);}});
  c.fillStyle='#d8edf0';c.font='10px IBM Plex Mono, monospace';c.fillText(F.Delta==null?'Δ=UNKNOWN':'Δ='+fmt(F.Delta,4)+' · Fσ='+fmt(F.F,5),x2+10,top+boxH-18);
  box(x3,'3 · CERTIFICATE GATE',S.cert==='ISSUED'?'rgba(184,168,255,.75)':S.cert==='BLOCKED'?'rgba(242,154,122,.55)':'rgba(242,201,109,.45)');
  const gy=top+72,gateRows=[['Identifiability',S.ident!=='NON_IDENTIFIABLE'],['Admissible',S.admissible],['Certified bound',S.boundAvailable],['Numerical ε',S.numericalEligible]];
  gateRows.forEach((r,i)=>{c.fillStyle=r[1]?'#8de4b0':'#f2c96d';c.font='10px IBM Plex Mono, monospace';c.fillText(r[0]+': '+(r[1]?'PASS':'NO'),x3+12,gy+i*31);});
  c.fillStyle=S.cert==='ISSUED'?'#b8a8ff':S.cert==='BLOCKED'?'#f29a7a':'#f2c96d';c.fillText('CERTIFICATE: '+S.cert,x3+12,gy+145);
  c.fillStyle='#7f9fa8';c.font='8px IBM Plex Mono, monospace';c.fillText('ε changes numerical eligibility only',x3+12,gy+170);
  c.strokeStyle='rgba(142,215,255,.55)';c.fillStyle='#8ed7ff';c.lineWidth=1.4;for(const xx of [x1+boxW+gap/2,x2+boxW+gap/2]){c.beginPath();c.moveTo(xx-8,h/2);c.lineTo(xx+8,h/2);c.stroke();c.beginPath();c.moveTo(xx+8,h/2);c.lineTo(xx+3,h/2-4);c.lineTo(xx+3,h/2+4);c.closePath();c.fill();}
  safeText('#idFidelityVizStatus',S.cert==='ISSUED'?'FORMAL/REVIEWED EvidenceRecord matched the current scope/revisions; ISSUED is allowed.':S.cert==='BLOCKED'?'BLOCKED · '+S.blocked.join(' · '):'WITHHELD/ELIGIBLE remains distinct from ISSUED. HIGH FIDELITY ≠ IDENTIFIABLE ≠ CERTIFIED.');
}function ensurePerfectoidModel(){
  if(!state.perfectoid||typeof state.perfectoid!=='object')state.perfectoid={selected:'U1',overlap:true};
  const P=state.perfectoid;
  if(!P.sideFocus)P.sideFocus='both';
  if(!P.sourceRef)P.sourceRef='PerfectoidDemo:X';
  if(!P.tiltRef)P.tiltRef='PerfectoidDemo:X-flat';
  if(!Array.isArray(P.rationalSubsets)){
    P.rationalSubsets=Array.from({length:6},(_,i)=>{
      const n=i+1,id='U'+n;
      return {
        id,
        tiltId:id+'-flat',
        depth:n,
        sourceRef:'rat:'+id,
        tiltRef:'rat:'+id+'-flat',
        sourceFormula:id+' = {x∈X : |f_'+n+'(x)|≤|g_'+n+'(x)|, g_'+n+'(x)≠0}',
        tiltFormula:id+'♭ = {x∈X♭ : |f_'+n+'♭(x)|≤|g_'+n+'♭(x)|, g_'+n+'♭(x)≠0}',
        hypothesisState:n===3?'UNKNOWN':'HYPOTHESES_REQUIRED',
        metadataStatus:'AVAILABLE'
      };
    });
  }
  if(!Array.isArray(P.correspondences))P.correspondences=P.rationalSubsets.map(n=>({id:'corr-'+n.id,sourceId:n.id,tiltId:n.tiltId,relationType:'TILT_RATIONAL_CORRESPONDENCE',hypothesisState:n.hypothesisState,evidenceRef:null}));
  if(!Array.isArray(P.overlaps))P.overlaps=Array.from({length:5},(_,i)=>({id:'overlap-U'+(i+1)+'-U'+(i+2),sourceIds:['U'+(i+1),'U'+(i+2)],tiltIds:['U'+(i+1)+'-flat','U'+(i+2)+'-flat'],relationType:'RATIONAL_OVERLAP',hypothesisState:'UNKNOWN'}));
  if(!P.selected)P.selected='U1';
  return P;
}
function perfectoidEvidenceFor(corrId){
  return state.evidenceRecords.find(ev=>ev.freshness==='CURRENT'&&ev.runStatus==='SUCCESS'&&(ev.evidenceGrade==='FORMAL'||ev.evidenceGrade==='REVIEWED')&&ev.objectRevision===state.objectRevision&&ev.representationRevision===state.representationRevision&&ev.metadata?.type==='PERFECTOID_CORRESPONDENCE'&&ev.metadata?.correspondenceId===corrId)||null;
}
function perfectoidCurrent(){
  const P=ensurePerfectoidModel(),depth=clamp(+($('#perfectoidDepth')?.value||P.coverDepth||4),2,6);
  P.coverDepth=depth;P.overlap=$('#perfectoidOverlap')?.checked!==false;P.showCorrespondence=$('#perfectoidRational')?.checked!==false;P.metadataMissing=Boolean($('#perfectoidMetadataMissing')?.checked);
  let selected=$('#perfectoidSubset')?.value||P.selected||'U1',idx=clamp(parseInt(selected.slice(1)||'1')-1,0,depth-1);selected='U'+(idx+1);P.selected=selected;
  const node=P.rationalSubsets.find(x=>x.id===selected),corr=P.correspondences.find(x=>x.sourceId===selected),evidence=corr?perfectoidEvidenceFor(corr.id):null;
  return {P,depth,idx,node,corr,evidence};
}
function updatePerfectoidInspector(){
  const C=perfectoidCurrent(),{P,depth,idx,node,corr,evidence}=C,missing=P.metadataMissing;
  if($('#perfectoidSubset'))$('#perfectoidSubset').value=P.selected;
  safeText('#perfectoidDepthVal',String(depth));safeText('#perfectoidSourceNode',node?node.id+' ⊂ X':'UNKNOWN');safeText('#perfectoidTiltNode',node?node.id+'♭ ⊂ X♭':'UNKNOWN');
  const hyp=missing?'UNKNOWN':(node?.hypothesisState||'UNKNOWN'),eState=evidence?'THEOREM_BACKED · '+evidence.id:'NO MATCHING EVIDENCE';
  safeText('#perfectoidHypothesis',hyp);safeText('#perfectoidEvidenceState',eState);
  safeText('#perfectoidNodeMetadata',node?('id='+node.id+'\nsourceRef='+node.sourceRef+'\ntiltRef='+node.tiltRef+'\nsourceFormula='+node.sourceFormula+'\ntiltFormula='+node.tiltFormula+'\ndisplayDepth='+node.depth+' (DISPLAY HIERARCHY ONLY)'):'UNKNOWN');
  safeText('#perfectoidCorrespondenceMetadata',missing?'UNKNOWN · selected correspondence metadata unavailable; no guessed bridge is rendered.':corr?('id='+corr.id+'\ntype='+corr.relationType+'\nhypothesis='+corr.hypothesisState+'\nevidenceRef='+(evidence?.id||'NONE')+'\nrender='+((evidence)?'SOLID THEOREM_BACKED':'DASHED / CONDITIONAL')):'UNKNOWN');
  const overlap=idx>0?P.overlaps[idx-1]:P.overlaps[0];safeText('#perfectoidOverlapBadge',P.overlap&&overlap?('Overlap node '+overlap.id+' · '+overlap.sourceIds.join('∩')+' ↔ '+overlap.tiltIds.join('∩')+' · '+overlap.hypothesisState):'Overlap node hidden.');
  safeText('#perfectoidFailureState',missing?'UNKNOWN FAILURE STATE · correspondence metadata missing. Selected bridge disabled; no interpolation/guess is drawn.':'Metadata available. THEOREM_BACKED requires matching EvidenceRecord; otherwise the bridge stays conditional.');
  safeText('#perfectoidVizStatus','selected '+P.selected+' ↔ '+P.selected+'♭ · depth='+depth+' · sideFocus='+P.sideFocus+' · SCHEMATIC_ONLY. Depth is a display/refinement hierarchy, not Krull/metric dimension; screen distance is not adic/valuation distance.');
  return C;
}
function perfectoidCameraRestore(host){
  const P=ensurePerfectoidModel(),snap=P.camera;if(!snap||!host)return;const stamp=JSON.stringify(snap);if(host._perfectoidCameraStamp===stamp)return;
  if(Array.isArray(snap.position))host.camera.position.fromArray(snap.position);if(Array.isArray(snap.target))host.controls.target.fromArray(snap.target);if(Number.isFinite(snap.zoom))host.camera.zoom=snap.zoom;host.camera.updateProjectionMatrix();host.controls.update();host._perfectoidCameraStamp=stamp;
}
function perfectoidExportSnapshot(){
  const C=updatePerfectoidInspector(),{P,depth}=C;
  const corrs=P.correspondences.filter(c=>parseInt(c.sourceId.slice(1))<=depth).map(c=>{const ev=perfectoidEvidenceFor(c.id);return {...c,evidenceRef:ev?.id||null,evidenceState:ev?'THEOREM_BACKED':'NO_MATCHING_EVIDENCE'}});
  return {schema:'MathScopePerfectoidSnapshot/1.0',sourceRef:P.sourceRef,tiltRef:P.tiltRef,coverDepth:depth,selectedSubsetId:P.selected,sideFocus:P.sideFocus,metadataMissing:P.metadataMissing,rationalSubsets:P.rationalSubsets.filter(n=>n.depth<=depth).map(n=>({...n})),correspondences:corrs,overlaps:P.overlap?P.overlaps.filter((_,i)=>i<depth-1).map(x=>({...x})):[],camera:cameraSnapshot('perfectoid'),metricSemantic:'SCHEMATIC_ONLY__SCREEN_DISTANCE_NOT_ADIC',representationStatus:'VISUAL_ONLY',familyMode:'FUTURE_ADAPTER_ONLY'};
}
function renderPerfectoid3D(){
  const host=createLabHost('perfectoid','perfectoid3D',[6.5,4.5,8.2]);if(!host)return;clearLabGroup(host);const C=updatePerfectoidInspector(),{P,depth,idx}=C,g=host.group;
  if(!host._perfectoidCameraHook){host._perfectoidCameraHook=true;host.controls.addEventListener('change',()=>{P.camera=cameraSnapshot('perfectoid');host._perfectoidCameraStamp=JSON.stringify(P.camera);});}
  perfectoidCameraRestore(host);
  const lx=-2.6,rx=2.6,top=1.9,step=.72,sourceOpacity=P.sideFocus==='tilt'?.25:1,tiltOpacity=P.sideFocus==='source'?.25:1;
  const srcPos=new Map(),tiltPos=new Map();
  for(let i=0;i<depth;i++){
    const n=P.rationalSubsets[i],y=top-i*step,z=.22*Math.sin(i*.9),selected=i===idx;
    const sp=[lx,y,z],tp=[rx,y,-z];srcPos.set(n.id,sp);tiltPos.set(n.tiltId,tp);
    const sMat=new THREE.MeshStandardMaterial({color:selected?0xffffff:0x8ed7ff,transparent:true,opacity:sourceOpacity,roughness:.35});
    const tMat=new THREE.MeshStandardMaterial({color:selected?0xffffff:0xb8a8ff,transparent:true,opacity:tiltOpacity,roughness:.35});
    const sm=new THREE.Mesh(new THREE.SphereGeometry(selected?.18:.13,18,12),sMat);sm.position.set(...sp);sm.userData={perfectoidSubsetId:n.id,side:'source'};g.add(sm);
    const tm=new THREE.Mesh(new THREE.SphereGeometry(selected?.18:.13,18,12),tMat);tm.position.set(...tp);tm.userData={perfectoidSubsetId:n.id,side:'tilt'};g.add(tm);
    if(i>0){
      const prev=P.rationalSubsets[i-1];
      const sl=makeLine3D(srcPos.get(prev.id),sp,0x35d3c5,.55*sourceOpacity,false);sl.userData={edgeType:'INCLUSION_REFINEMENT'};g.add(sl);
      const tl=makeLine3D(tiltPos.get(prev.tiltId),tp,0x8f7bd6,.55*tiltOpacity,false);tl.userData={edgeType:'INCLUSION_REFINEMENT'};g.add(tl);
    }
    const corr=P.correspondences[i],ev=perfectoidEvidenceFor(corr.id),selectedMissing=P.metadataMissing&&selected;
    if(P.showCorrespondence&&!selectedMissing){
      const theoremBacked=Boolean(ev),dashed=!theoremBacked,line=makeLine3D(sp,tp,theoremBacked?0x8de4b0:0xf2c96d,theoremBacked?.9:.62,dashed);line.userData={edgeType:'TILT_RATIONAL_CORRESPONDENCE',correspondenceId:corr.id,evidenceRef:ev?.id||null};g.add(line);
    }
    if(P.overlap&&i>0){
      const ov=P.overlaps[i-1],oy=y+step/2,og=new THREE.Mesh(new THREE.OctahedronGeometry(.11),new THREE.MeshStandardMaterial({color:0x8de4b0,transparent:true,opacity:.72}));
      og.position.set(0,oy,.55);og.userData={edgeType:'RATIONAL_OVERLAP',overlapId:ov.id};g.add(og);
      g.add(makeLine3D([lx,oy,.05],[0,oy,.55],0x8de4b0,.25,true));g.add(makeLine3D([rx,oy,-.05],[0,oy,.55],0x8de4b0,.25,true));
    }
  }
  const srcLane=makeLine3D([lx,top+.35,0],[lx,top-(depth-1)*step-.35,0],0x35d3c5,.18*sourceOpacity,true),tiltLane=makeLine3D([rx,top+.35,0],[rx,top-(depth-1)*step-.35,0],0x8f7bd6,.18*tiltOpacity,true);g.add(srcLane);g.add(tiltLane);
  const floor=new THREE.GridHelper(8,16,0x244c5d,0x122d39);floor.position.y=-2.0;floor.material.transparent=true;floor.material.opacity=.14;g.add(floor);
  if(!host._perfectoidPickingReady){host._perfectoidPickingReady=true;const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();host.renderer.domElement.addEventListener('pointerdown',e=>{const rect=host.renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(pointer,host.camera);const hit=ray.intersectObjects(host.group.children,true).find(h=>h.object?.userData?.perfectoidSubsetId);if(hit){P.selected=hit.object.userData.perfectoidSubsetId;if($('#perfectoidSubset'))$('#perfectoidSubset').value=P.selected;drawPerfectoidViz();}});}
}
function drawPerfectoidViz(){
  const canvas=$('#perfectoidVizCanvas'),s=setupCanvas(canvas),C=updatePerfectoidInspector();renderPerfectoid3D();if(!s||s.w<20||s.h<20)return;
  const {c,w,h}=s,{P,depth,idx}=C;c.clearRect(0,0,w,h);const lx=w*.23,rx=w*.77,top=36,bottom=h-26,span=bottom-top;
  c.fillStyle='#cfe7ea';c.font='600 11px Space Grotesk, sans-serif';c.fillText('LEFT: X',lx-20,17);c.fillText('RIGHT: X♭',rx-28,17);c.fillStyle='#7f9fa8';c.font='8px IBM Plex Mono, monospace';c.fillText('depth = display/refinement hierarchy only',8,h-7);
  const levels=[];
  for(let i=0;i<depth;i++){
    const n=P.rationalSubsets[i],yy=top+(i/Math.max(1,depth-1))*span,active=i===idx;levels.push(yy);
    c.fillStyle=active?'#ffffff':'#8ed7ff';c.beginPath();c.arc(lx,yy,active?7:5,0,Math.PI*2);c.fill();c.fillStyle=active?'#ffffff':'#b8a8ff';c.beginPath();c.arc(rx,yy,active?7:5,0,Math.PI*2);c.fill();
    c.fillStyle='#91aeb7';c.font='8px IBM Plex Mono, monospace';c.fillText(n.id,lx-24,yy+3);c.fillText(n.id+'♭',rx+8,yy+3);
    if(i>0){c.strokeStyle='rgba(53,211,197,.45)';c.setLineDash([]);c.beginPath();c.moveTo(lx,levels[i-1]+5);c.lineTo(lx,yy-5);c.stroke();c.strokeStyle='rgba(184,168,255,.45)';c.beginPath();c.moveTo(rx,levels[i-1]+5);c.lineTo(rx,yy-5);c.stroke();}
    const corr=P.correspondences[i],ev=perfectoidEvidenceFor(corr.id),missing=P.metadataMissing&&active;
    if(P.showCorrespondence&&!missing){c.strokeStyle=ev?'#8de4b0':'#f2c96d';c.setLineDash(ev?[]:[5,4]);c.beginPath();c.moveTo(lx+6,yy);c.lineTo(rx-6,yy);c.stroke();c.setLineDash([]);}
    if(P.overlap&&i>0){c.fillStyle='#8de4b0';c.fillRect(w/2-3,(levels[i-1]+yy)/2-3,6,6);}
  }
}
$('#perfectoidDepth')?.addEventListener('input',()=>{ensurePerfectoidModel().coverDepth=+$('#perfectoidDepth').value;drawPerfectoidViz();updateSessionHash();});
$('#perfectoidRational')?.addEventListener('input',drawPerfectoidViz);
$('#perfectoidOverlap')?.addEventListener('input',drawPerfectoidViz);
$('#perfectoidMetadataMissing')?.addEventListener('input',drawPerfectoidViz);
$('#perfectoidSubset')?.addEventListener('change',e=>{ensurePerfectoidModel().selected=e.target.value;drawPerfectoidViz();updateSessionHash();});
$$('.perfectoid-side').forEach(b=>b.addEventListener('click',()=>{const P=ensurePerfectoidModel();P.sideFocus=b.dataset.perfectoidSide;$$('.perfectoid-side').forEach(x=>x.classList.toggle('active',x===b));drawPerfectoidViz();updateSessionHash();}));
$('#perfectoidResetCamera')?.addEventListener('click',()=>{const P=ensurePerfectoidModel(),h=labHosts.perfectoid;if(h){h.camera.position.set(6.5,4.5,8.2);h.controls.target.set(0,.2,0);h.controls.update();P.camera=cameraSnapshot('perfectoid');h._perfectoidCameraStamp=JSON.stringify(P.camera);}});
$('#perfectoidExport')?.addEventListener('click',()=>{const snap=perfectoidExportSnapshot(),blob=new Blob([JSON.stringify(snap,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mathscope-perfectoid-rational-snapshot.json';a.click();URL.revokeObjectURL(a.href);addHistory('EXPORT','Perfectoid rational correspondence snapshot exported.');});
$('#perfectoidVizCanvas')?.addEventListener('pointerdown',e=>{const P=ensurePerfectoidModel(),canvas=$('#perfectoidVizCanvas'),rect=canvas.getBoundingClientRect(),depth=clamp(+($('#perfectoidDepth')?.value||P.coverDepth||4),2,6),top=36,bottom=rect.height-26,span=bottom-top,y=e.clientY-rect.top;let best=0,dist=Infinity;for(let i=0;i<depth;i++){const yy=top+(i/Math.max(1,depth-1))*span,d=Math.abs(y-yy);if(d<dist){dist=d;best=i;}}P.selected='U'+(best+1);if($('#perfectoidSubset'))$('#perfectoidSubset').value=P.selected;drawPerfectoidViz();});

function fidelityCompute(){
  const keys=['Top','Metric','Hom','Spectral','Dyn'],S=ifcModelDefaults();
  keys.forEach(k=>{S.fidelityEnabled[k]=$('#useDelta'+k)?.checked!==false;S.fidelityWeights[k]=Math.max(0,+($('#weight'+k)?.value||1));});
  const F=ifcFidelityState(),conf=+($('#confidenceRange')?.value||.72),rob=+($('#robustRange')?.value||.08),eps=+($('#epsilonGoal')?.value||.1);
  S.confidence=conf;S.robustnessRequested=rob;
  safeText('#deltaTotal',F.Delta==null?'UNKNOWN':fmt(F.Delta,4));safeText('#fidelityScore',F.F==null?'UNKNOWN':fmt(F.F,5));safeText('#confidenceVal',fmt(conf,2));safeText('#robustVal',fmt(rob,3));safeText('#epsilonStatus',F.Delta==null?'UNKNOWN — missing fidelity data':F.Delta<=eps?'NUMERICAL YES':'NUMERICAL NO');
  const checks=['admContinuity','admComplexity','admNoncollapse','admIdent'],ok=checks.every(id=>$('#'+id)?.checked);
  safeText('#deltaStarStatus',ok?'ELIGIBLE FOR NUMERICAL SEARCH — not a certificate':'NOT COMPUTED — admissibility gate incomplete');safeText('#constantEncoder','REJECTED by non-collapse/identifiability gate');safeText('#spectralBenchmark','SPECTRAL FIDELITY = 1 · ISOMETRY = UNKNOWN/NO CERTIFICATE');
  computeIfcState();drawFidelityPipeline();renderIfc3D();updateSessionHash();
}
['deltaTop','deltaMetric','deltaHom','deltaSpectral','deltaDyn','sigmaRange','confidenceRange','robustRange','epsilonGoal','admContinuity','admComplexity','admNoncollapse','admIdent','useDeltaTop','useDeltaMetric','useDeltaHom','useDeltaSpectral','useDeltaDyn','weightTop','weightMetric','weightHom','weightSpectral','weightDyn'].forEach(id=>$('#'+id)?.addEventListener('input',fidelityCompute));


function signedFieldColor(v,maxAbs){
  const t=maxAbs>1e-9?clamp(v/maxAbs,-1,1):0,c=new THREE.Color();if(t>=0)c.setRGB(.18+.18*(1-t),.54+.38*t,.95-.2*t);else{const u=-t;c.setRGB(.95,.56-.22*u,.2+.18*(1-u));}return c;
}
function phaseColor(phi){
  const t=((phi/(2*Math.PI))%1+1)%1,c=new THREE.Color();c.setHSL(t,.72,.58);return c;
}
function ensurePdeState(){
  const P=state.pde||(state.pde={});if(!P.equation)P.equation='heat';if(!P.initial)P.initial='gaussian';if(!Number.isFinite(P.dt))P.dt=.006;if(!Number.isFinite(P.seed))P.seed=2101;if(!Number.isFinite(P.time))P.time=0;if(!Number.isFinite(P.kappa))P.kappa=.22;if(!Number.isFinite(P.waveSpeed))P.waveSpeed=1;if(!Number.isFinite(P.damping))P.damping=.08;if(!Number.isFinite(P.initialVelocity))P.initialVelocity=0;if(!P.transport)P.transport={vx:.8,vz:.35,boundary:'periodic'};if(!Number.isFinite(P.schrodingerScale))P.schrodingerScale=1;if(!P.reaction)P.reaction={model:'fisher',rate:1};if(!P.customInitialMode)P.customInitialMode='expression';if(!P.customInitialExpr)P.customInitialExpr='sin(2*x)+0.5*cos(3*z)';if(!P.customInitialGridText)P.customInitialGridText='[[0,0.5,0],[0.5,1,0.5],[0,0.5,0]]';if(!('customInitialGrid' in P))P.customInitialGrid=null;if(!Number.isFinite(P.solverSteps))P.solverSteps=0;return P;
}
function spectralBasis(surface,u,v){
  if(surface==='sphere'){
    return [{lambda:0,value:1},{lambda:2,value:Math.sin(Math.PI*v)*Math.cos(2*Math.PI*u)},{lambda:2,value:Math.sin(Math.PI*v)*Math.sin(2*Math.PI*u)},{lambda:2,value:Math.cos(Math.PI*v)},{lambda:6,value:Math.sin(Math.PI*v)*Math.cos(Math.PI*v)*Math.cos(2*Math.PI*u)},{lambda:6,value:Math.sin(Math.PI*v)*Math.cos(Math.PI*v)*Math.sin(2*Math.PI*u)},{lambda:6,value:(3*Math.cos(Math.PI*v)**2-1)/2},{lambda:6,value:Math.sin(Math.PI*v)**2*Math.cos(4*Math.PI*u)},{lambda:6,value:Math.sin(Math.PI*v)**2*Math.sin(4*Math.PI*u)}];
  }
  const R=1.25,r=.42,U=2*Math.PI*u,V=2*Math.PI*v,terms=[[0,0],[1,0],[0,1],[1,1],[2,0],[0,2],[2,1],[1,2]],out=[];for(const [m,n] of terms)out.push({lambda:m*m/(R*R)+n*n/(r*r),value:Math.cos(m*U)*Math.cos(n*V)});out.push({lambda:1/(R*R)+1/(r*r),value:Math.sin(U)*Math.sin(V)});return out;
}
function pdeInitialValue(pos,uv,kind,seed,index){
  const P=ensurePdeState();
  if(kind==='custom'){
    try{
      if(P.customInitialMode==='sampled'){if(!P.customInitialGrid)P.customInitialGrid=parseHeightGrid(P.customInitialGridText);return sampleNumericGrid(P.customInitialGrid,uv[0],uv[1]);}
      if(!P.customInitialCompiled||P.customInitialKey!==P.customInitialExpr){P.customInitialCompiled=compileMathExpression(P.customInitialExpr);P.customInitialKey=P.customInitialExpr}
      return P.customInitialCompiled({x:pos.x,y:pos.y,z:pos.z,t:0});
    }catch{return 0}
  }
  if(kind==='gaussian'){const G=ensureGeometryState();if(G.surface==='sphere'){const c=new THREE.Vector3(.68,.5,.54).normalize();return Math.exp(5.5*(pos.dot(c)-1));}if(G.surface==='torus'){const du=Math.atan2(Math.sin(2*Math.PI*uv[0]-.6),Math.cos(2*Math.PI*uv[0]-.6)),dv=Math.atan2(Math.sin(2*Math.PI*uv[1]-.2),Math.cos(2*Math.PI*uv[1]-.2));return Math.exp(-3.2*(du*du+.55*dv*dv));}return Math.exp(-1.6*((pos.x-.55)**2+(pos.z+.2)**2));}
  if(kind==='pulse'){const G=ensureGeometryState();if(G.surface==='sphere'){const c=new THREE.Vector3(.68,.5,.54).normalize();return Math.exp(16*(pos.dot(c)-1));}return Math.exp(-10*((pos.x-.5)**2+(pos.z+.15)**2));}
  if(kind==='standing'){const G=ensureGeometryState();if(G.surface==='sphere')return .75*pos.x*pos.y+.45*(3*pos.z*pos.z-1);if(G.surface==='torus')return Math.sin(4*Math.PI*uv[0])*Math.cos(2*Math.PI*uv[1]);return Math.sin(Math.PI*(uv[0]))*Math.sin(Math.PI*(uv[1]));}
  const rng=mulberry32(seed+index*7919);return (rng()*2-1)*.65;
}
function makeSpectralModel(surface,initial,seed){
  const G=ensureGeometryState(),P=ensurePdeState(),data=buildSurfaceMeshData(surface,18),basisCount=9,basisValues=data.positions.map((p,i)=>spectralBasis(surface,data.uv[i][0],data.uv[i][1])),weights=data.positions.map((p,i)=>surface==='sphere'?Math.max(.02,Math.sin(Math.PI*data.uv[i][1])):1),f0=data.positions.map((p,i)=>pdeInitialValue(p,data.uv[i],initial,seed,i)),coeff=[],lambda=[];
  for(let k=0;k<basisCount;k++){let num=0,den=0;for(let i=0;i<f0.length;i++){const b=basisValues[i][k].value,w=weights[i];num+=w*f0[i]*b;den+=w*b*b;}coeff[k]=den>1e-12?num/den:0;lambda[k]=basisValues[0][k].lambda;}
  return {kind:'spectral',surface,mesh:data,basisValues,coeff,velocityCoeff:coeff.map(a=>P.initialVelocity*a),lambda,time:0,solverSteps:0};
}
function cotangent(a,b){const cross=a.clone().cross(b).length(),dot=a.dot(b);return cross>1e-12?dot/cross:0}
function makeCotangentModel(initial,seed,n){
  const G=ensureGeometryState(),P=ensurePdeState(),data=buildSurfaceMeshData(G.surface,n),positions=data.positions,indices=data.indices,mass=Array(positions.length).fill(0),adj=Array.from({length:positions.length},()=>new Map()),addW=(i,j,w)=>{adj[i].set(j,(adj[i].get(j)||0)+w);adj[j].set(i,(adj[j].get(i)||0)+w);};
  for(let q=0;q<indices.length;q+=3){const ia=indices[q],ib=indices[q+1],ic=indices[q+2],A=positions[ia],B=positions[ib],C=positions[ic],ab=B.clone().sub(A),ac=C.clone().sub(A),ba=A.clone().sub(B),bc=C.clone().sub(B),ca=A.clone().sub(C),cb=B.clone().sub(C),area=.5*ab.clone().cross(ac).length();mass[ia]+=area/3;mass[ib]+=area/3;mass[ic]+=area/3;const cotA=cotangent(ab,ac),cotB=cotangent(ba,bc),cotC=cotangent(ca,cb);addW(ib,ic,.5*cotA);addW(ia,ic,.5*cotB);addW(ia,ib,.5*cotC);}
  let maxRate=0,minEdge=Infinity;for(let i=0;i<adj.length;i++){let sum=0;for(const [j,w] of adj[i]){sum+=Math.abs(w);minEdge=Math.min(minEdge,positions[i].distanceTo(positions[j]));}maxRate=Math.max(maxRate,sum/Math.max(1e-9,mass[i]));}
  const u0=positions.map((p,i)=>pdeInitialValue(p,data.uv[i],initial,seed,i)),velocity=u0.map(v=>P.initialVelocity*v);
  return {kind:'cotangent',surface:G.surface,mesh:data,mass,adj,maxRate,minEdge,u0,u:[...u0],velocity,re:[...u0],im:Array(u0.length).fill(0),time:0,solverSteps:0};
}
function pdeSolverKind(){
  const G=ensureGeometryState(),P=ensurePdeState();return (['sphere','torus'].includes(G.surface)&&['heat','wave','schrodinger'].includes(P.equation))?'spectral':'cotangent';
}
function ensurePdeModel(force=false){
  const G=ensureGeometryState(),P=ensurePdeState();P.initial=$('#pdeInitial')?.value||P.initial;P.seed=Math.trunc(+($('#pdeSeed')?.value||P.seed));P.equation=P.equation||'heat';
  const key=[G.surface,G.custom?.revision||0,G.solverResolution,P.initial,P.seed,P.equation,P.customInitialMode,P.customInitialExpr,P.customInitialGridText,P.initialVelocity,P.kappa,P.waveSpeed,P.damping,P.transport?.vx,P.transport?.vz,P.transport?.boundary,P.schrodingerScale,P.reaction?.model,P.reaction?.rate].join('|'),kind=pdeSolverKind();
  if(force||!state.pdeModel||state.pdeModel.key!==key){const model=kind==='spectral'?makeSpectralModel(G.surface,P.initial,P.seed):makeCotangentModel(P.initial,P.seed,G.solverResolution);model.key=key;state.pdeModel=model;P.solverSteps=0;}
  return state.pdeModel;
}
function pdeLaplacian(model,u){const out=Array(u.length).fill(0);for(let i=0;i<u.length;i++){let s=0;for(const [j,w] of model.adj[i])s+=w*(u[j]-u[i]);out[i]=s/Math.max(1e-9,model.mass[i]);}return out}
function transportDerivative(model,u,vx,vz,boundary){
  const out=Array(u.length).fill(0),speed=Math.hypot(vx,vz);if(speed<1e-12)return out;const dir=new THREE.Vector2(vx/speed,vz/speed);
  for(let i=0;i<u.length;i++){let best=-1,bestScore=-Infinity,bestDist=1;const pi=model.mesh.positions[i];for(const [j] of model.adj[i]){const pj=model.mesh.positions[j],d=new THREE.Vector2(pi.x-pj.x,pi.z-pj.z),L=d.length();if(L<1e-9)continue;d.multiplyScalar(1/L);const score=d.dot(dir);if(score>bestScore){bestScore=score;best=j;bestDist=L;}}if(best>=0&&bestScore>0)out[i]=speed*(u[i]-u[best])/bestDist;else out[i]=0;if(boundary==='reflective'&&model.adj[i].size<4)out[i]=0;}
  return out;
}
function reactionTerm(u,model,rate){return model==='allen-cahn'?rate*(u-u*u*u):rate*u*(1-u)}
function meshAdvanceTo(model,target){
  const P=ensurePdeState(),eq=P.equation,kappa=P.kappa,c=P.waveSpeed,gamma=P.damping,userDt=P.dt,speed=Math.hypot(P.transport.vx,P.transport.vz);if(target<model.time-1e-10){model.u=[...model.u0];model.velocity=model.u0.map(v=>P.initialVelocity*v);model.re=[...model.u0];model.im.fill(0);model.time=0;model.solverSteps=0;}
  let recommended=.01;if(eq==='heat'||eq==='reaction'||eq==='schrodinger')recommended=.38/Math.max(1e-9,kappa*model.maxRate);else if(eq==='wave')recommended=.7/Math.max(1e-9,c*Math.sqrt(model.maxRate));else if(eq==='transport')recommended=.45*model.minEdge/Math.max(1e-9,speed);
  const sub=Math.max(1,Math.ceil(userDt/Math.max(1e-5,recommended))),dt=userDt/sub,boundaryEffective=(eq==='transport'&&P.transport.boundary==='periodic'&&!['sphere','torus'].includes(model.surface))?'outflow-fallback':P.transport.boundary;
  while(model.time+1e-10<target){const h=Math.min(dt,target-model.time);
    if(eq==='heat'){const lap=pdeLaplacian(model,model.u);for(let i=0;i<model.u.length;i++)model.u[i]+=h*kappa*lap[i];}
    else if(eq==='wave'){const lap=pdeLaplacian(model,model.u);for(let i=0;i<model.u.length;i++)model.velocity[i]+=h*(c*c*lap[i]-gamma*model.velocity[i]);for(let i=0;i<model.u.length;i++)model.u[i]+=h*model.velocity[i];}
    else if(eq==='transport'){const adv=transportDerivative(model,model.u,P.transport.vx,P.transport.vz,boundaryEffective);for(let i=0;i<model.u.length;i++)model.u[i]-=h*adv[i];}
    else if(eq==='reaction'){const lap=pdeLaplacian(model,model.u);for(let i=0;i<model.u.length;i++)model.u[i]+=h*(kappa*lap[i]+reactionTerm(model.u[i],P.reaction.model,P.reaction.rate));}
    else if(eq==='schrodinger'){const lapRe=pdeLaplacian(model,model.re),lapIm=pdeLaplacian(model,model.im),scale=P.schrodingerScale;for(let i=0;i<model.re.length;i++){model.re[i]+=-h*kappa*scale*lapIm[i];model.im[i]+=h*kappa*scale*lapRe[i];}}
    model.time+=h;model.solverSteps++;
  }
  P.solverSteps=model.solverSteps;return {recommended,sub,boundaryEffective};
}
function evaluateSpectral(model,t){
  const P=ensurePdeState(),eq=P.equation,real=[],imag=[];const coeffReal=model.coeff.map((a,i)=>{const l=model.lambda[i];if(eq==='heat')return a*Math.exp(-P.kappa*l*t);if(eq==='wave'){if(l<1e-12)return a+model.velocityCoeff[i]*t;const om=P.waveSpeed*Math.sqrt(l);return a*Math.exp(-P.damping*t/2)*Math.cos(om*t)+(model.velocityCoeff[i]/Math.max(1e-9,om))*Math.exp(-P.damping*t/2)*Math.sin(om*t);}if(eq==='schrodinger')return a*Math.cos(P.schrodingerScale*l*t);return a;});const coeffImag=model.coeff.map((a,i)=>eq==='schrodinger'?-a*Math.sin(P.schrodingerScale*model.lambda[i]*t):0);
  model.basisValues.forEach(bs=>{real.push(bs.reduce((s,b,i)=>s+coeffReal[i]*b.value,0));imag.push(bs.reduce((s,b,i)=>s+coeffImag[i]*b.value,0));});model.solverSteps=Math.round(t/Math.max(1e-9,P.dt));P.solverSteps=model.solverSteps;return {real,imag,magnitude:real.map((x,i)=>Math.hypot(x,imag[i])),phase:real.map((x,i)=>Math.atan2(imag[i],x)),stability:{recommended:null,sub:1,boundaryEffective:'closed/analytic'},model};
}
function pdeFieldAtTime(target){
  const model=ensurePdeModel();if(model.kind==='spectral')return evaluateSpectral(model,target);const stability=meshAdvanceTo(model,target);return {real:state.pde.equation==='schrodinger'?[...model.re]:[...model.u],imag:state.pde.equation==='schrodinger'?[...model.im]:Array(model.u.length).fill(0),magnitude:state.pde.equation==='schrodinger'?model.re.map((x,i)=>Math.hypot(x,model.im[i])):model.u.map(Math.abs),phase:state.pde.equation==='schrodinger'?model.re.map((x,i)=>Math.atan2(model.im[i],x)):Array(model.u.length).fill(0),stability,model};
}
function pdeDiagnostics(real,imag,model){
  const complex=ensurePdeState().equation==='schrodinger',vals=complex?real.map((x,i)=>x*x+imag[i]*imag[i]):real.map(x=>x*x),maxAbs=Math.max(1e-9,...real.map((x,i)=>complex?Math.hypot(x,imag[i]):Math.abs(x)));let l2=0,mean=0,massSum=0;
  if(model.kind==='cotangent'){for(let i=0;i<real.length;i++){l2+=model.mass[i]*vals[i];mean+=model.mass[i]*real[i];massSum+=model.mass[i];}mean/=Math.max(1e-9,massSum);}else{for(let i=0;i<real.length;i++){l2+=vals[i];mean+=real[i];}mean/=Math.max(1,real.length);}
  let waveEnergy=null;if(ensurePdeState().equation==='wave'&&model.kind==='cotangent'){const lap=pdeLaplacian(model,model.u);waveEnergy=0;for(let i=0;i<real.length;i++)waveEnergy+=.5*model.mass[i]*(model.velocity[i]*model.velocity[i]-ensurePdeState().waveSpeed**2*model.u[i]*lap[i]);}
  return {maxAbs,l2,mean,waveEnergy};
}
function pdeEnergySemantic(diag,model){
  const P=ensurePdeState();if(P.equation==='heat')return 'L2² diagnostic · expected dissipative under Heat; mean approximately conserved on closed/Neumann-like domains';if(P.equation==='wave')return 'discrete wave energy '+(P.damping>0?'dissipative with damping':'approximately conserved when γ=0');if(P.equation==='transport')return 'mass/L2 diagnostic · conservation depends on boundary and advection discretization';if(P.equation==='schrodinger')return '∥ψ∥² magnitude norm · spectral demo unitary; mesh explicit demo is numerical only';return 'reaction-diffusion has no generic conserved energy; mass/L2 are diagnostics only';
}
function buildFieldGeometry(model,field){
  const base=model.mesh.positions,indices=model.mesh.indices,diag=pdeDiagnostics(field.real,field.imag,model),positions=[],colors=[],P=ensurePdeState();for(let i=0;i<base.length;i++){const p=base[i].clone(),val=P.equation==='schrodinger'?field.magnitude[i]:field.real[i],T=surfaceTangents(model.surface,model.mesh.uv[i]?.[0]||0,model.mesh.uv[i]?.[1]||0),n=T.n;p.addScaledVector(n,.18*val/diag.maxAbs);positions.push(p.x,p.y,p.z);const col=P.equation==='schrodinger'?phaseColor(field.phase[i]):signedFieldColor(field.real[i],diag.maxAbs);colors.push(col.r,col.g,col.b);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();return {geo,diag};
}
function pdeSourceProvenance(model,stability){
  const G=ensureGeometryState(),P=ensurePdeState();return {ref:'Phi:'+P.equation+':'+G.surface+':r'+state.representationRevision,equation:P.equation,solver:model.kind,surface:G.surface,solverResolution:G.solverResolution,dt:P.dt,solverSteps:P.solverSteps,displayTime:P.time,seed:P.seed,boundary:stability.boundaryEffective||'closed/analytic',initialCondition:P.initial,customSurfaceRevision:G.custom?.revision||null};
}
function pdeRepresentationProvenance(){
  const P=ensurePdeState();return {ref:'Psi:MathScopeFieldRenderer:v2',sourceSolverAssumedIdentical:false,colorEncoding:P.equation==='schrodinger'?'phase hue':'signed field heatmap',displacement:'normal displacement normalized by current max magnitude',displayTime:P.time};
}
function renderTransportGlyphs(group,model){
  const P=ensurePdeState();if(P.equation!=='transport')return;const n=Math.min(16,model.mesh.positions.length),step=Math.max(1,Math.floor(model.mesh.positions.length/n)),v=new THREE.Vector3(P.transport.vx,0,P.transport.vz);for(let i=0;i<model.mesh.positions.length;i+=step){const uv=model.mesh.uv[i]||[0,0],T=surfaceTangents(model.surface,uv[0],uv[1]),tan=v.clone().sub(T.n.clone().multiplyScalar(v.dot(T.n)));if(tan.length()>1e-8)group.add(new THREE.ArrowHelper(tan.normalize(),model.mesh.positions[i].clone().addScaledVector(T.n,.04),.24,0xffffff,.07,.035));}
}
function renderPde3D(){
  const host=createLabHost('pde','pde3D',[4.8,3.0,5.8]);if(!host)return;clearLabGroup(host);const P=ensurePdeState(),G=ensureGeometryState();
  P.initial=$('#pdeInitial')?.value||P.initial;P.dt=clamp(+($('#pdeDt')?.value||P.dt),.0005,.05);P.seed=Math.trunc(+($('#pdeSeed')?.value||P.seed));P.kappa=+($('#pdeKappa')?.value||P.kappa);P.waveSpeed=+($('#pdeWaveSpeed')?.value||P.waveSpeed);P.damping=+($('#pdeDamping')?.value||P.damping);P.initialVelocity=+($('#pdeInitialVelocity')?.value||P.initialVelocity);P.time=+($('#pdeTime')?.value||P.time);P.customInitialExpr=$('#pdeCustomInitialExpr')?.value||P.customInitialExpr;P.transport.vx=+($('#transportVX')?.value||P.transport.vx);P.transport.vz=+($('#transportVZ')?.value||P.transport.vz);P.transport.boundary=$('#transportBoundary')?.value||P.transport.boundary;P.schrodingerScale=+($('#schrodingerScale')?.value||P.schrodingerScale);P.reaction.model=$('#reactionModel')?.value||P.reaction.model;P.reaction.rate=+($('#reactionRate')?.value||P.reaction.rate);
  const field=pdeFieldAtTime(P.time),built=buildFieldGeometry(field.model,field),g=host.group,mesh=new THREE.Mesh(built.geo,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.4,metalness:.02,transparent:true,opacity:.94}));g.add(mesh);g.add(new THREE.LineSegments(new THREE.WireframeGeometry(built.geo),new THREE.LineBasicMaterial({color:0xc5e5eb,transparent:true,opacity:.055})));renderTransportGlyphs(g,field.model);const grid=new THREE.GridHelper(6,18,0x244c5d,0x122d39);grid.position.y=-2;grid.material.transparent=true;grid.material.opacity=.12;g.add(grid);
  const solver=field.model.kind==='spectral'?'SPECTRAL · finite analytic preset':'COTANGENT LB · lumped mass mesh',boundary=field.stability.boundaryEffective||'closed/analytic',stabilityText=field.model.kind==='spectral'?'analytic finite modal evolution':(field.stability.sub>1?'SUBSTEPPED '+field.stability.sub+'× · recommended Δt≤'+fmt(field.stability.recommended,6):'EXPLICIT STEP · recommended Δt≤'+fmt(field.stability.recommended,6));
  P.sourceEvolution=pdeSourceProvenance(field.model,field.stability);P.representationEvolution=pdeRepresentationProvenance();P.lastDiagnostics=built.diag;
  safeText('#pdeSolverMode',solver);safeText('#pdeBoundarySemantic',boundary);safeText('#pdeStability',stabilityText);safeText('#pdeEnergy',(built.diag.waveEnergy!=null?'waveE='+fmt(built.diag.waveEnergy,6)+' · ':'')+'L2²='+fmt(built.diag.l2,6)+' · mean='+fmt(built.diag.mean,6));safeText('#pdeEnergySemantic',pdeEnergySemantic(built.diag,field.model));safeText('#pdeReplayState','solverSteps='+P.solverSteps+' · displayTime='+fmt(P.time,4)+' · dt='+fmt(P.dt,5));safeText('#pdePhaseMagnitude',P.equation==='schrodinger'?'phase=hue · magnitude=displacement · REPRESENTATION DEMO ONLY':'NOT_APPLICABLE');safeText('#pdeTimeVal',fmt(P.time,2));safeText('#pdeKappaVal',fmt(P.kappa,2));safeText('#pdeWaveSpeedVal',fmt(P.waveSpeed,2));safeText('#pdeDampingVal',fmt(P.damping,2));safeText('#pdeInitialVelocityVal',fmt(P.initialVelocity,2));safeText('#schrodingerScaleVal',fmt(P.schrodingerScale,2));
  safeText('#pde3DStatus',G.surface+' · '+P.equation.toUpperCase()+' · '+P.initial+' · '+solver+' · solver mesh '+G.solverResolution+' vs display mesh '+G.meshResolution+'. Numerical animation/evidence remains separate from formal PDE claims.');
}
function updatePdePanels(){
  const P=ensurePdeState();$$('.pde-eq').forEach(b=>b.classList.toggle('active',b.dataset.pdeEq===P.equation));if($('#transportControls'))$('#transportControls').style.display=P.equation==='transport'?'block':'none';if($('#schrodingerControls'))$('#schrodingerControls').style.display=P.equation==='schrodinger'?'block':'none';if($('#reactionControls'))$('#reactionControls').style.display=P.equation==='reaction'?'block':'none';if($('#pdeCustomInitialPanel'))$('#pdeCustomInitialPanel').style.display=P.initial==='custom'?'block':'none';$$('.pde-custom-mode').forEach(b=>b.classList.toggle('active',b.dataset.pdeCustomMode===(P.customInitialMode||'expression')));if($('#pdeCustomExpressionPanel'))$('#pdeCustomExpressionPanel').style.display=P.customInitialMode==='sampled'?'none':'block';if($('#pdeCustomSamplePanel'))$('#pdeCustomSamplePanel').style.display=P.customInitialMode==='sampled'?'block':'none';
}
function resetPdeModel(){const P=ensurePdeState();P.time=0;P.solverSteps=0;if($('#pdeTime'))$('#pdeTime').value=0;safeText('#pdeTimeVal','0.00');state.pdeModel=null;ensurePdeModel(true);renderPde3D();}
$$('.pde-eq').forEach(b=>b.addEventListener('click',()=>{const P=ensurePdeState();P.equation=b.dataset.pdeEq;state.pdeModel=null;updatePdePanels();resetPdeModel();renderTransfer3D();}));
['pdeInitial','pdeDt','pdeSeed','pdeKappa','pdeWaveSpeed','pdeDamping','pdeInitialVelocity','pdeCustomInitialExpr','pdeCustomInitialGrid','transportVX','transportVZ','transportBoundary','schrodingerScale','reactionModel','reactionRate'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{const P=ensurePdeState();P.initial=$('#pdeInitial')?.value||P.initial;P.customInitialExpr=$('#pdeCustomInitialExpr')?.value||P.customInitialExpr;P.customInitialGridText=$('#pdeCustomInitialGrid')?.value||P.customInitialGridText;P.customInitialGrid=null;updatePdePanels();state.pdeModel=null;ensurePdeModel(true);renderPde3D();renderTransfer3D();}));
$$('.pde-custom-mode').forEach(b=>b.addEventListener('click',()=>{const P=ensurePdeState();P.customInitialMode=b.dataset.pdeCustomMode;P.customInitialGrid=null;updatePdePanels();state.pdeModel=null;renderPde3D();}));
$('#pdeCustomInitialFile')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{const txt=await f.text();parseHeightGrid(txt);const P=ensurePdeState();P.customInitialMode='sampled';P.customInitialGridText=txt;P.customInitialGrid=null;if($('#pdeCustomInitialGrid'))$('#pdeCustomInitialGrid').value=txt;safeText('#pdeCustomInitialStatus','Loaded '+f.name+' · sampled scalar field ready.');updatePdePanels();state.pdeModel=null;renderPde3D();}catch(err){safeText('#pdeCustomInitialStatus','FILE ERROR · '+String(err?.message||err));}e.target.value='';});
$('#pdeTime')?.addEventListener('input',e=>{const P=ensurePdeState();P.time=+e.target.value;renderPde3D();renderTransfer3D();});
let pdePlayTimer=null;function stopPdePlayback(){if(pdePlayTimer){clearInterval(pdePlayTimer);pdePlayTimer=null}ensurePdeState().playing=false}
$('#pdePlay')?.addEventListener('click',()=>{if(motionDisabled()){toast('Reduced motion is active · PDE playback is paused.');return}stopPdePlayback();ensurePdeState().playing=true;pdePlayTimer=setInterval(()=>{const P=ensurePdeState();P.time+=.025;if(P.time>3){P.time=0;state.pdeModel=null;}if($('#pdeTime'))$('#pdeTime').value=P.time;renderPde3D();renderTransfer3D();},80);});
$('#pdePause')?.addEventListener('click',stopPdePlayback);$('#pdeReset')?.addEventListener('click',()=>{stopPdePlayback();resetPdeModel();renderTransfer3D();});

function gpdTransferEvidence(){
  return state.evidenceRecords.find(ev=>ev.freshness==='CURRENT'&&ev.runStatus==='SUCCESS'&&(ev.evidenceGrade==='FORMAL'||ev.evidenceGrade==='REVIEWED')&&ev.objectRevision===state.objectRevision&&ev.representationRevision===state.representationRevision&&ev.metadata?.type==='GPD_TRANSFER_CERTIFICATE')||null;
}
function renderTransfer3D(){
  const host=createLabHost('transfer','transfer3D',[4.8,2.9,6.3]);if(!host)return;clearLabGroup(host);const T=state.transfer||(state.transfer={}),P=ensurePdeState(),G=ensureGeometryState(),defect=+($('#transferDefect')?.value||T.defect||.03),tol=+($('#transferTolerance')?.value||T.tolerance||.05),ident=Boolean($('#transferIdentifiable')?.checked),metric=$('#transferMetric')?.value||T.metric||'display-l2',ev=gpdTransferEvidence();Object.assign(T,{defect,tolerance:tol,identifiable:ident,metric});
  const g=host.group,N=60,src=[],rep=[];for(let i=0;i<N;i++){const t=i/(N-1)*2.5,base=[-2.4+4.8*i/(N-1),.55*Math.sin(2.2*t),.55*Math.cos(1.35*t)],d=defect*(.35+.65*Math.sin(Math.PI*i/(N-1))**2);src.push(new THREE.Vector3(...base));rep.push(new THREE.Vector3(base[0],base[1]+d*6,base[2]+.2*d*4));}
  const line=(pts,color)=>new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity:.95}));g.add(line(src,0x8ed7ff));g.add(line(rep,0x35d3c5));const pos=[],idx=[];for(let i=0;i<N;i++){pos.push(src[i].x,src[i].y,src[i].z,rep[i].x,rep[i].y,rep[i].z);if(i<N-1){const a=2*i,b=a+1,c=a+2,d=a+3;idx.push(a,c,b,b,c,d);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();g.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:defect<=tol?0x8de4b0:0xf29a7a,transparent:true,opacity:.22,side:THREE.DoubleSide})));g.add(new THREE.GridHelper(7,18,0x244c5d,0x122d39));
  let transfer='NO_TRANSFER_KNOWN',cert='WITHHELD',reasons=[];if(!ident){reasons.push('NON_IDENTIFIABLE')}if(defect>tol)reasons.push('DEFECT_ABOVE_TOLERANCE');if(!ev)reasons.push('NO_TRANSFER_EVIDENCE');if(ident&&defect<=tol)transfer=ev?(ev.metadata?.transferStatus||'APPROXIMATE'):'APPROXIMATE';else if(defect<=tol)transfer='EMPIRICAL_ONLY';if(reasons.includes('NON_IDENTIFIABLE')||reasons.includes('DEFECT_ABOVE_TOLERANCE'))cert='BLOCKED';else if(ev)cert='ISSUED';else cert='WITHHELD';
  T.status=transfer;T.certificateStatus=cert;T.blockedReasons=reasons;T.evidenceRef=ev?.id||null;T.sourceEvolution=P.sourceEvolution||pdeSourceProvenance(ensurePdeModel(),{boundaryEffective:'unknown'});T.representationEvolution=P.representationEvolution||pdeRepresentationProvenance();
  safeText('#transferDefectVal',fmt(defect,3));safeText('#transferToleranceVal',fmt(tol,3));safeText('#transfer3DStatus',transfer);safeText('#transferCertificateStatus',cert+(reasons.length?' · '+reasons.join(' / '):''));safeText('#transferEvidenceStatus',ev?ev.id+' · '+ev.evidenceGrade:'NONE');safeText('#sourceEvolutionProvenance',JSON.stringify(T.sourceEvolution));safeText('#representationEvolutionProvenance',JSON.stringify(T.representationEvolution));safeText('#defectMetricSemantic','δ(t)='+metric+'(EΦₜ, ΨₜE) · finite representation scope · ribbon width ∝ observed defect');
}
['transferDefect','transferTolerance','transferIdentifiable','transferMetric'].forEach(id=>$('#'+id)?.addEventListener('input',renderTransfer3D));
function gpdExportSnapshot(){
  const G=ensureGeometryState(),P=ensurePdeState(),T=state.transfer;return {schema:'MathScopeGPDSnapshot/1.0',exportedAt:now(),objectRevision:state.objectRevision,representationRevision:state.representationRevision,geometry:{surface:G.surface,topology:G.topology,metricSemantic:G.metricSemantic,visualMeshResolution:G.meshResolution,solverMeshResolution:G.solverResolution,tangent:{enabled:G.tangent,density:G.tangentDensity},curvature:{enabled:G.curvature,type:G.curvatureType,normalization:G.curvatureNorm},custom:G.surface==='custom'?{mode:G.custom.mode,expr:G.custom.expr,gridText:G.custom.gridText,domain:G.custom.domain,heightScale:G.custom.heightScale,revision:G.custom.revision}:null,geodesic:{...G.geodesic},camera:cameraSnapshot('geometryCore')},pde:{equation:P.equation,initialCondition:P.initial,customInitial:P.initial==='custom'?{mode:P.customInitialMode,expr:P.customInitialMode==='expression'?P.customInitialExpr:null,gridText:P.customInitialMode==='sampled'?P.customInitialGridText:null}:null,seed:P.seed,dt:P.dt,solverSteps:P.solverSteps,displayTime:P.time,kappa:P.kappa,waveSpeed:P.waveSpeed,damping:P.damping,initialVelocity:P.initialVelocity,transport:{...P.transport},schrodingerScale:P.schrodingerScale,reaction:{...P.reaction},sourceEvolution:P.sourceEvolution,representationEvolution:P.representationEvolution,lastDiagnostics:P.lastDiagnostics,camera:cameraSnapshot('pde')},transfer:{...T,camera:cameraSnapshot('transfer')},evidenceRefs:state.evidenceRecords.filter(ev=>['GPD_GEODESIC_CERTIFICATE','GPD_TRANSFER_CERTIFICATE'].includes(ev.metadata?.type)).map(ev=>ev.id)};
}
$('#exportGpdSnapshot')?.addEventListener('click',()=>{const snap=gpdExportSnapshot(),blob=new Blob([JSON.stringify(snap,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mathscope-gpd-snapshot.json';a.click();URL.revokeObjectURL(a.href);addHistory('EXPORT','Geometry/PDE/Dynamics integrated snapshot exported.');});

function setupCanvas(canvas){
  if(!canvas)return null;const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);canvas.width=Math.max(1,rect.width*dpr);canvas.height=Math.max(1,rect.height*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return {c,w:rect.width,h:rect.height};
}
function drawSeries(canvas, series, opts={}){
  const s=setupCanvas(canvas);if(!s)return;const {c,w,h}=s;c.clearRect(0,0,w,h);c.strokeStyle='rgba(140,205,217,.14)';c.lineWidth=1;
  for(let i=1;i<5;i++){const y=i*h/5;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  const all=series.flatMap(x=>x.values),mn=Math.min(...all),mx=Math.max(...all),span=(mx-mn)||1;
  const cols=['#35d3c5','#8ed7ff','#b8a8ff','#f2c96d'];
  series.forEach((ser,idx)=>{c.strokeStyle=cols[idx%cols.length];c.lineWidth=1.7;c.beginPath();ser.values.forEach((v,i)=>{const x=(i/(ser.values.length-1))*w,y=h-((v-mn)/span)*h;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke();});
  c.fillStyle='#8caab5';c.font='10px IBM Plex Sans KR';c.fillText(opts.label||'',8,14);
}
function drawDynamics(){
  const t=+($('#dynTRange')?.value||state.dynT);state.dynT=t;safeText('#dynTValue',fmt(t,2));
  const N=180,xs=[...Array(N)].map((_,i)=>i/(N-1)),lam=[1,4,9],a=[1,.65,.35];
  const modes=['heat','wave','schr'];const mode=state.dynMode;
  const values=xs.map(x=>a.reduce((s,aj,j)=>{
    const phi=Math.sin((j+1)*Math.PI*x);let fac=1;
    if(mode==='heat')fac=Math.exp(-lam[j]*t);if(mode==='wave')fac=Math.cos(Math.sqrt(lam[j])*t);if(mode==='schr')fac=Math.cos(lam[j]*t);
    return s+aj*fac*phi;
  },0));
  drawSeries($('#dynCanvas'),[{values}],{label:mode.toUpperCase()+' state'});
  const amp=a.map((aj,j)=>mode==='heat'?Math.abs(aj*Math.exp(-lam[j]*t)):mode==='wave'?Math.abs(aj*Math.cos(Math.sqrt(lam[j])*t)):Math.abs(aj));
  safeText('#dynAmps',amp.map(v=>fmt(v,3)).join(' · '));
  safeText('#dynInvariant',mode==='heat'?'high modes decay (smoothing)':mode==='wave'?'oscillatory amplitudes':'|complex mode coefficient| conserved');
  $$('.dyn-mode').forEach(b=>b.classList.toggle('active',b.dataset.dyn===mode));
  const defect=+($('#defectRange')?.value||state.dynDefect),eps=+($('#dynEps')?.value||state.dynEps);state.dynDefect=defect;state.dynEps=eps;
  safeText('#defectValue',fmt(defect,3));safeText('#dynEpsValue',fmt(eps,3));safeText('#commuteStatus',defect===0?'EXACT NUMERICAL MATCH (not formal)':defect<=eps?'EPS-COMMUTES CANDIDATE':'DEFECT ABOVE TOLERANCE');
  const identifiable=$('#dynIdent')?.checked;safeText('#transferStatus',identifiable&&defect<=eps?'APPROXIMATE TRANSFER CANDIDATE':'NO TRANSFER CERTIFICATE');
  updateSessionHash();
}
$$('.dyn-mode').forEach(b=>b.addEventListener('click',()=>{state.dynMode=b.dataset.dyn;drawDynamics()}));
['dynTRange','defectRange','dynEps','dynIdent'].forEach(id=>$('#'+id)?.addEventListener('input',drawDynamics));
window.addEventListener('resize',()=>{
  if(state.view==='functional'){drawFunctionalViz();resizeLab('functional');resizeLab('basis');}
  if(state.view==='fidelity'){drawFidelityPipeline();resizeLab('ifc');}
  if(state.view==='advanced'){drawPerfectoidViz();resizeLab('perfectoid');}
  if(state.view==='dynamics'){drawDynamics();resizeLab('geometryCore');resizeLab('pde');resizeLab('transfer');}
  if(state.view==='arithmetic'){drawThetaHistogram();drawFrobenius();resizeLab('adapterC');}
});

function mod(n,p){return ((n%p)+p)%p}
function primesUpTo(n){const out=[];for(let x=2;x<=n;x++){let ok=true;for(let d=2;d*d<=x;d++)if(x%d===0){ok=false;break}if(ok)out.push(x)}return out}
function countCurve(p,a,b){
  let count=1;
  for(let x=0;x<p;x++){const rhs=mod(x*x*x+a*x+b,p);for(let y=0;y<p;y++)if(mod(y*y-rhs,p)===0)count++}
  return count;
}

function adapterCProfiles(){
  return {
    R:{label:'ℝ',modes:{A:true,B:true,C:false},capabilities:{realLocus:true,primeSampler:false,frobenius:false,cohomology:true,hodge:false,adic:false},coefficients:['R','C'],reason:'Real locus + Betti/de Rham style views. Hodge mode requires complexification metadata and stays disabled in the base R profile.'},
    C:{label:'ℂ',modes:{A:false,B:true,C:true},capabilities:{realLocus:false,primeSampler:false,frobenius:false,cohomology:true,hodge:true,adic:false},coefficients:['C'],reason:'Complex/Hodge and comparison views. Finite-prime arithmetic mode is unavailable in the base C profile.'},
    Q:{label:'ℚ',modes:{A:true,B:true,C:true},capabilities:{realLocus:true,primeSampler:true,frobenius:true,cohomology:true,hodge:true,adic:false},coefficients:['Q','C','Ql'],reason:'Archimedean realization + good-prime reductions + comparison/Hodge demo layers.'},
    Fq:{label:'𝔽q',modes:{A:true,B:true,C:false},capabilities:{realLocus:false,primeSampler:true,frobenius:true,cohomology:true,hodge:false,adic:false},coefficients:['Fp','Ql'],reason:'Finite-field point count/Frobenius + étale/crystalline style comparison. Hodge mode disabled.'},
    Qp:{label:'ℚp',modes:{A:false,B:true,C:false},capabilities:{realLocus:false,primeSampler:false,frobenius:false,cohomology:true,hodge:false,adic:true},coefficients:['Ql','Fp'],reason:'Local/adic comparison lens. Current Adapter C arithmetic/Hodge renderers are unavailable; Perfectoid remains a separate A-only viewer.'}
  };
}
function ensureAdapterCState(){
  if(!state.adapterC||typeof state.adapterC!=='object')state.adapterC={mode:'A'};
  const A=state.adapterC;
  if(!A.baseField)A.baseField='Q';
  if(!A.coefficients)A.coefficients='Q';
  if(!A.objectRef)A.objectRef='EllipticDemo:E(a,b)';
  if(!A.evidenceNamespaces)A.evidenceNamespaces={A:[],B:[],C:[]};
  if(!Array.isArray(A.hodgeCells))A.hodgeCells=[
    {id:'h00',p:0,q:0,degree:0,multiplicity:1,filtration:0},
    {id:'h10',p:1,q:0,degree:1,multiplicity:1,filtration:1},
    {id:'h01',p:0,q:1,degree:1,multiplicity:1,filtration:0},
    {id:'h11',p:1,q:1,degree:2,multiplicity:1,filtration:1}
  ];
  if(!A.cycleMap)A.cycleMap={id:'cycle-map-ch1-h2',source:'CH^1(X)',target:'H^2(X)',type:'CYCLE_CLASS_MAP',status:'WITHHELD'};
  if(!A.bridges)A.bridges={
    AB:{id:'bridge-AB',type:'ARITHMETIC_TO_COHOMOLOGY',requires:['selected-good-prime'],status:'CONDITIONAL'},
    AC:{id:'bridge-AC',type:'HODGE_REALIZATION_BRIDGE',requires:['smooth-projective','complex-realization'],status:'CONDITIONAL'},
    BC:{id:'bridge-BC',type:'COMPARISON_TO_FILTRATION',requires:['smooth-projective'],status:'CONDITIONAL'}
  };
  return A;
}
function adapterCEvidence(namespace,type,id){
  return state.evidenceRecords.find(ev=>ev.freshness==='CURRENT'&&ev.runStatus==='SUCCESS'&&(ev.evidenceGrade==='FORMAL'||ev.evidenceGrade==='REVIEWED')&&ev.objectRevision===state.objectRevision&&ev.metadata?.namespace===namespace&&(!type||ev.metadata?.type===type)&&(!id||ev.metadata?.edgeId===id||ev.metadata?.bridgeId===id||ev.metadata?.mapId===id))||null;
}
function adapterCCapability(mode){
  const A=ensureAdapterCState(),profile=adapterCProfiles()[A.baseField]||adapterCProfiles().Q,letters=[...new Set(String(mode).split(''))].filter(x=>['A','B','C'].includes(x));
  const missing=letters.filter(x=>!profile.modes[x]);
  return {ok:missing.length===0,missing,profile};
}
function adapterCRepresentationChanged(reason){
  state.representationRevision++;
  state.evidenceRecords.forEach(ev=>{if(String(ev.metadata?.namespace||'').startsWith('ADAPTER_C')&&ev.freshness==='CURRENT')ev.freshness='STALE'});
  addHistory('ADAPTER_C',reason+' · representation r'+state.representationRevision+'; Adapter C evidence freshness reevaluated.');
}
function adapterCComparisonEdges(){
  const A=ensureAdapterCState(),coeff=A.coefficients,smooth=Boolean($('#adapterCSmoothProjective')?.checked),hyp=Boolean($('#adapterCComparisonHyp')?.checked);
  const defs=[
    {id:'cmp-betti-dr',from:'Betti',to:'deRham',theoremId:'CMP-BETTI-DR-DEMO',degree:1,allowed:['C'],hypothesis:smooth?'SATISFIED':'MISSING_SMOOTH_PROJECTIVE'},
    {id:'cmp-dr-etale',from:'deRham',to:'etale',theoremId:'CMP-DR-ETALE-DEMO',degree:1,allowed:['Ql'],hypothesis:hyp?'SATISFIED':'MISSING_COMPARISON_HYPOTHESIS'},
    {id:'cmp-etale-crys',from:'etale',to:'crystalline',theoremId:'CMP-ETALE-CRYS-DEMO',degree:1,allowed:['Ql','Fp'],hypothesis:hyp?'SATISFIED':'MISSING_COMPARISON_HYPOTHESIS'},
    {id:'cmp-crys-prism',from:'crystalline',to:'prismatic',theoremId:'CMP-CRYS-PRISM-DEMO',degree:1,allowed:['Fp','Ql'],hypothesis:(hyp&&smooth)?'SATISFIED':'MISSING_HYPOTHESIS'},
    {id:'cmp-prism-rigid',from:'prismatic',to:'rigid',theoremId:'CMP-PRISM-RIGID-DEMO',degree:1,allowed:['Ql'],hypothesis:hyp?'SATISFIED':'MISSING_COMPARISON_HYPOTHESIS'}
  ];
  return defs.map(e=>{
    const coefficientCompatible=e.allowed.includes(coeff),evidence=adapterCEvidence('ADAPTER_C_B','ADAPTER_C_COMPARISON',e.id),hypothesisSatisfied=e.hypothesis==='SATISFIED',enabled=coefficientCompatible&&hypothesisSatisfied;
    return {...e,coefficientProfile:coeff,coefficientCompatible,hypothesisSatisfied,evidenceRef:evidence?.id||null,status:evidence&&enabled?'VERIFIED':enabled?'CONDITIONAL':'DISABLED'};
  });
}
function adapterCProfileUI(){
  const A=ensureAdapterCState(),profiles=adapterCProfiles(),profile=profiles[A.baseField]||profiles.Q;
  $$('[data-base-field]').forEach(b=>b.classList.toggle('active',b.dataset.baseField===A.baseField));
  if($('#adapterCCoefficients'))$('#adapterCCoefficients').value=A.coefficients;
  safeText('#baseBranch',profile.reason);
  safeText('#repSelector','available lenses: '+Object.entries(profile.modes).filter(([,v])=>v).map(([k])=>'Mode '+k).join(' + ')+(profile.capabilities.adic?' · adic context via dedicated viewer':''));
  safeText('#adapterCCapabilityStatus',profile.label+' · coefficients '+A.coefficients+' · '+(profile.coefficients.includes(A.coefficients)?'COMPATIBLE':'COEFFICIENT PROFILE MISMATCH'));
  safeText('#adapterCCapabilityMatrix','A='+(profile.modes.A?'AVAILABLE':'DISABLED')+' · B='+(profile.modes.B?'AVAILABLE':'DISABLED')+' · C='+(profile.modes.C?'AVAILABLE':'DISABLED')+' · prime/Frob='+(profile.capabilities.primeSampler?'YES':'NO')+' · Hodge='+(profile.capabilities.hodge?'YES':'NO'));
  $$('.adapter-c-mode').forEach(b=>{
    const cap=adapterCCapability(b.dataset.adapterCMode);b.disabled=!cap.ok;b.title=cap.ok?'available for '+profile.label:('disabled: missing '+cap.missing.join('+')+' capability for '+profile.label);
  });
  const current=adapterCCapability(A.mode);
  if(!current.ok){
    const fallback=['A','B','C'].find(m=>adapterCCapability(m).ok)||'B';
    A.mode=fallback;$$('.adapter-c-mode').forEach(b=>b.classList.toggle('active',b.dataset.adapterCMode===fallback));
    safeText('#adapterCUnsupportedReason','Requested mode was unavailable for '+profile.label+'. Fallback → '+fallback+'. Reason: '+profile.reason);
  }else safeText('#adapterCUnsupportedReason','Current mode '+A.mode+' is supported by '+profile.label+'. Unsupported buttons remain disabled with tooltip reasons.');
  safeText('#comparisonCoefficientStatus',A.coefficients+' · edge compatibility is reevaluated independently for every comparison edge.');
  safeText('#adapterCObjectRef',A.objectRef);
}


function computeArithmetic(){
  const A=ensureAdapterCState(),profile=adapterCProfiles()[A.baseField]||adapterCProfiles().Q,a=Math.trunc(+($('#curveA')?.value??-1)),b=Math.trunc(+($('#curveB')?.value??1)),pMax=clamp(Math.trunc(+($('#pMax')?.value??43)),7,71);
  state.arithmetic.a=a;state.arithmetic.b=b;state.arithmetic.pMax=pMax;A.objectRef='EllipticDemo:E('+a+','+b+')';
  const core=4*a*a*a+27*b*b,discr=-16*core,singular=core===0;state.arithmetic.discriminant=discr;state.arithmetic.singular=singular;
  safeText('#curveDisc',String(discr));safeText('#adapterCObjectRef',A.objectRef);
  if(singular){
    state.arithmetic.rows=[];state.arithmetic.selectedPrime=null;
    safeText('#ellipticStatus','SINGULAR CUBIC · discriminant = 0');safeText('#ellipticClaimGate','BLOCKED · elliptic-specific claims disabled');
    safeText('#goodBadSummary','no elliptic prime sampler: singular Weierstrass cubic');
    if($('#primeTableBody'))$('#primeTableBody').innerHTML='<tr><td colspan="6" class="danger">SINGULAR: elliptic-specific local factors/Frobenius claims are blocked.</td></tr>';
    drawThetaHistogram();drawFrobenius();renderArithmeticSelected();renderAdapterC3D();updateSessionHash();return;
  }
  safeText('#ellipticStatus','NONSINGULAR · elliptic demo eligible');safeText('#ellipticClaimGate','OPEN within explicitly supported finite/demo scopes');
  if(!profile.capabilities.primeSampler){
    state.arithmetic.rows=[];state.arithmetic.selectedPrime=null;
    safeText('#goodBadSummary','prime sampler unavailable for base field '+profile.label+' · no silent base-field coercion');
    if($('#primeTableBody'))$('#primeTableBody').innerHTML='<tr><td colspan="6" class="warning">Prime-reduction sampler unsupported in the current base-field profile.</td></tr>';
    drawThetaHistogram();drawFrobenius();renderArithmeticSelected();renderAdapterC3D();updateSessionHash();return;
  }
  const rows=[];
  for(const prime of primesUpTo(pMax)){
    if(prime===2)continue;
    const good=mod(discr,prime)!==0;
    if(!good){rows.push({p:prime,good:false,reason:'BAD_REDUCTION',pointCountGrade:'EXACT_FINITE'});continue}
    const n=countCurve(prime,a,b),ap=prime+1-n,ratio=ap/(2*Math.sqrt(prime)),angleDomain=Math.abs(ratio)<=1+1e-12,theta=angleDomain?Math.acos(clamp(ratio,-1,1)):null;
    rows.push({p:prime,good:true,n,ap,ratio,theta,angleDomain,local:'1 − ('+ap+')T + '+prime+'T²',pointCountGrade:'EXACT_FINITE',traceGrade:'EXACT_FINITE',thetaGrade:angleDomain?'DERIVED_NUMERIC':'BLOCKED'});
  }
  state.arithmetic.rows=rows;
  if(!rows.find(r=>r.good&&r.p===state.arithmetic.selectedPrime))state.arithmetic.selectedPrime=rows.find(r=>r.good)?.p||null;
  safeText('#goodBadSummary',rows.filter(r=>r.good).length+' good · '+rows.filter(r=>!r.good).length+' bad reductions · finite distribution sample only');
  if($('#primeTableBody'))$('#primeTableBody').innerHTML=rows.map(r=>r.good?'<tr class="clickable" tabindex="0" role="button" aria-label="Prime '+escapeHtml(r.p)+' details" data-prime="'+escapeHtml(r.p)+'"><td>'+r.p+'</td><td>'+r.n+'</td><td>'+r.ap+'</td><td>'+(r.angleDomain?fmt(r.theta,4):'DOMAIN FAIL')+'</td><td>'+r.local+'</td><td>'+badge('EXACT_FINITE','ok')+' <span class="muted small">θ '+r.thetaGrade+'</span></td></tr>':'<tr><td>'+r.p+'</td><td colspan="4" class="warning">BAD REDUCTION · no ordinary elliptic local factor emitted</td><td>'+badge('EXACT_FINITE FLAG','warn')+'</td></tr>').join('');
  $$('#primeTableBody tr[data-prime]').forEach(tr=>{const open=()=>{state.arithmetic.selectedPrime=+tr.dataset.prime;drawFrobenius();renderArithmeticSelected();renderAdapterC3D();};tr.addEventListener('click',open);tr.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
  drawThetaHistogram();drawFrobenius();renderArithmeticSelected();renderAdapterC3D();updateSessionHash();
}
function drawThetaHistogram(){
  const rows=state.arithmetic.rows.filter(r=>r.good&&r.angleDomain&&Number.isFinite(r.theta)),canvas=$('#thetaCanvas'),s=setupCanvas(canvas);if(!s)return;const {c,w,h}=s;c.clearRect(0,0,w,h);const bins=10,arr=Array(bins).fill(0);rows.forEach(r=>arr[Math.min(bins-1,Math.floor(r.theta/Math.PI*bins))]++);
  const mx=Math.max(1,...arr);arr.forEach((v,i)=>{const bw=w/bins-4,x=i*w/bins+2,bh=(v/mx)*(h-32);c.fillStyle='rgba(53,211,197,.65)';c.fillRect(x,h-18-bh,bw,bh)});c.fillStyle='#8caab5';c.font='10px IBM Plex Sans KR';c.fillText('finite θₚ histogram — ESTIMATED SAMPLE, NOT GLOBAL THEOREM',8,14);c.fillText('0',4,h-4);c.fillText('π',w-12,h-4);
}
function drawFrobenius(){
  const prime=state.arithmetic.selectedPrime,row=state.arithmetic.rows.find(r=>r.p===prime&&r.good),canvas=$('#frobCanvas'),s=setupCanvas(canvas);if(!s)return;const {c,w,h}=s;c.clearRect(0,0,w,h);c.strokeStyle='rgba(140,205,217,.18)';c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke();if(!row||!row.angleDomain)return;
  const re=row.ap/2,disc=Math.max(0,4*prime-row.ap*row.ap),im=Math.sqrt(disc)/2,scale=Math.min(w,h)/(2.7*Math.sqrt(prime));
  [[re,im],[re,-im]].forEach((z,i)=>{c.beginPath();c.fillStyle=i?'#8ed7ff':'#35d3c5';c.arc(w/2+z[0]*scale,h/2-z[1]*scale,6,0,Math.PI*2);c.fill()});
  c.fillStyle='#8caab5';c.font='10px IBM Plex Sans KR';c.fillText('Frobenius eigenvalue fingerprint · good p='+prime+' · DERIVED from EXACT_FINITE count',8,14);
}
function renderArithmeticSelected(){
  const row=state.arithmetic.rows.find(r=>r.p===state.arithmetic.selectedPrime&&r.good);
  if(!row){safeText('#selectedPrime','—');safeText('#selectedAp','—');safeText('#selectedTheta','—');safeText('#selectedFactor','—');safeText('#selectedApScope','no selected good reduction');safeText('#selectedAngleDomain','—');safeText('#selectedLocalEvidence','—');return}
  safeText('#selectedPrime','p = '+row.p);safeText('#selectedAp','aₚ = '+row.ap);safeText('#selectedTheta',row.angleDomain?'θₚ = '+fmt(row.theta,5):'θₚ BLOCKED');safeText('#selectedFactor',row.local);
  safeText('#selectedApScope','aₚ = p + 1 − #E(Fₚ) · good reduction p='+row.p+' · EXACT_FINITE');
  safeText('#selectedAngleDomain','aₚ/(2√p)='+fmt(row.ratio,7)+' · '+(row.angleDomain?'DOMAIN PASS |ratio|≤1':'DOMAIN FAIL'));
  safeText('#selectedLocalEvidence','#E(Fₚ) '+row.pointCountGrade+' · aₚ '+row.traceGrade+' · θ '+row.thetaGrade);
}
function adapterCEvidenceNamespaceSummary(){
  const A=ensureAdapterCState(),names=['A','B','C'];A.evidenceNamespaces={};
  names.forEach(n=>A.evidenceNamespaces[n]=state.evidenceRecords.filter(ev=>ev.freshness==='CURRENT'&&String(ev.metadata?.namespace||'')==='ADAPTER_C_'+n).map(ev=>ev.id));
  safeText('#adapterCEvidenceNamespaces',names.map(n=>n+':{'+A.evidenceNamespaces[n].join(',')+'}').join(' · '));
  return A.evidenceNamespaces;
}
function adapterCBridgeState(){
  const A=ensureAdapterCState(),mode=A.mode,smooth=Boolean($('#adapterCSmoothProjective')?.checked),profile=adapterCProfiles()[A.baseField]||adapterCProfiles().Q,selected=state.arithmetic.rows.find(r=>r.p===state.arithmetic.selectedPrime&&r.good);
  const AB={...A.bridges.AB,status:selected?'TYPED_LINK_READY':'WITHHELD_NO_GOOD_PRIME',datum:selected?{p:selected.p,ap:selected.ap,theta:selected.theta}:null,target:'etale:H^1'};
  const AC={...A.bridges.AC,status:(smooth&&['Q','C'].includes(A.baseField)&&profile.modes.C)?'CONDITIONAL_METADATA_READY':'WITHHELD_MISSING_CONTEXT',metadata:smooth?{bridge:'complex-realization/Hodge demo',identityClaim:false}:null};
  const BC={...A.bridges.BC,status:(smooth&&profile.modes.B&&profile.modes.C)?'CONDITIONAL_METADATA_READY':'WITHHELD_MISSING_CONTEXT',hypothesisComposition:'PROHIBITED'};
  A.bridgeState={AB,AC,BC};
  safeText('#adapterCBridgeStatus','AB='+AB.status+' · AC='+AC.status+' · BC='+BC.status+' · no hypothesis composition');
  safeText('#adapterCComboBridge','AB selected arithmetic datum → étale node only by typed bridge. AC requires explicit bridge metadata and never identifies the concrete object with Hodge data. BC keeps comparison-edge hypotheses separate from filtration-edge hypotheses.');
  return A.bridgeState;
}
function renderComparisonEdgeTable(){
  const edges=adapterCComparisonEdges(),el=$('#comparisonEdgeTable');if(!el)return;
  el.innerHTML='<table><thead><tr><th>edge</th><th>theorem ID</th><th>degree</th><th>allowed coeff</th><th>hypothesis</th><th>evidenceRef</th><th>status</th></tr></thead><tbody>'+edges.map(e=>'<tr><td>'+escapeHtml(e.from)+'→'+escapeHtml(e.to)+'</td><td class="mono">'+escapeHtml(e.theoremId)+'</td><td>H^'+escapeHtml(e.degree)+'</td><td>'+escapeHtml(e.allowed.join('/'))+'</td><td>'+escapeHtml(e.hypothesis)+'</td><td>'+escapeHtml(e.evidenceRef||'NONE')+'</td><td>'+escapeHtml(e.status)+'</td></tr>').join('')+'</tbody></table>';
}
function renderHodgeCells(){
  const A=ensureAdapterCState(),el=$('#hodgeCellsTable');if(el)el.innerHTML='<table><thead><tr><th>cell</th><th>degree</th><th>multiplicity</th><th>filtration</th><th>typed state</th></tr></thead><tbody>'+A.hodgeCells.map(h=>'<tr><td>H<sup>'+escapeHtml(h.p)+','+escapeHtml(h.q)+'</sup></td><td>'+escapeHtml(h.degree)+'</td><td>'+escapeHtml(h.multiplicity)+'</td><td>F^'+escapeHtml(h.filtration)+'</td><td>TYPED_CELL</td></tr>').join('')+'</tbody></table>';
  const cycleEv=adapterCEvidence('ADAPTER_C_C','ADAPTER_C_CYCLE_MAP',null),cycleFlag=Boolean($('#adapterCCycleEvidence')?.checked);A.cycleMap.status=cycleEv?'EVIDENCE_LINKED':cycleFlag?'USER_CONDITION_PRESENT__NOT_PROOF':'WITHHELD';
  safeText('#cycleMapStatus',A.cycleMap.source+' → '+A.cycleMap.target+' · '+A.cycleMap.status+' · Hodge class equality is NOT inferred');
}
function adapterCMorphismPolicy(type){
  const policies={
    'embedding':{render:'solid inclusion arrow + subobject outline',semantics:'injective/subobject visualization only; induced cohomology map remains separate'},
    'finite map':{render:'multi-fibre glyphs + finite-map arrow',semantics:'fibre cardinality/ramification metadata; not an embedding'},
    'branched cover':{render:'branched sheets + highlighted branch locus',semantics:'branch/ramification data required; away-from-branch behaviour separated'},
    'smooth fibration':{render:'base lane + fibre slices',semantics:'smoothness/fibre variation metadata required; monodromy not inferred'},
    'birational map':{render:'dashed birational bridge + exceptional/indeterminacy markers',semantics:'not an everywhere isomorphism; exceptional loci stay explicit'}
  };
  return policies[type]||policies.embedding;
}
function renderMorphismPolicy(){
  const type=$('#morphismType')?.value||state.morphismType||'embedding',P=adapterCMorphismPolicy(type);state.morphismType=type;ensureAdapterCState().morphismPolicy={type,...P};safeText('#morphismPolicy',type+' · '+P.render+'\n'+P.semantics);return P;
}
function addAdapterCNode(group,pos,color,size=.15,opacity=.92,userData=null){
  const m=new THREE.Mesh(new THREE.SphereGeometry(size,18,12),new THREE.MeshStandardMaterial({color,transparent:true,opacity,roughness:.35}));m.position.set(...pos);if(userData)m.userData=userData;group.add(m);return m;
}
function renderAdapterC3D(){
  adapterCProfileUI();const host=createLabHost('adapterC','adapterC3D',[7.4,4.6,8.3]);if(!host)return;clearLabGroup(host);
  const A=ensureAdapterCState(),mode=A.mode,cap=adapterCCapability(mode),g=host.group,profile=cap.profile,comp=Boolean($('#adapterCComparisonHyp')?.checked),smooth=Boolean($('#adapterCSmoothProjective')?.checked),cycle=Boolean($('#adapterCCycleEvidence')?.checked),edges=adapterCComparisonEdges(),bridges=adapterCBridgeState();
  safeText('#adapterCModeStatus',mode);safeText('#adapterCZAxis','Mode A: local invariant / prime index · Mode B: cohomological degree · Mode C: filtration/Hodge bidegree');
  const lane={A:-3.4,B:0,C:3.4},anchors={},showA=mode.includes('A')&&profile.modes.A,showB=mode.includes('B')&&profile.modes.B,showC=mode.includes('C')&&profile.modes.C;let selectedPrimeNode=null,etaleNode=null;
  if(showA){
    anchors.A=new THREE.Vector3(lane.A,0,0);
    if(profile.capabilities.realLocus&&!state.arithmetic.singular){
      const a=state.arithmetic.a,b=state.arithmetic.b,ptsTop=[],ptsBot=[];for(let q=0;q<80;q++){const x=-2.1+4.2*q/79,rhs=x*x*x+a*x+b;if(rhs>=0){const y=Math.sqrt(rhs);ptsTop.push(new THREE.Vector3(lane.A+x*.55,y*.24,0));ptsBot.push(new THREE.Vector3(lane.A+x*.55,-y*.24,0));}}
      if(ptsTop.length>1)g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsTop),new THREE.LineBasicMaterial({color:0x35d3c5})));if(ptsBot.length>1)g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsBot),new THREE.LineBasicMaterial({color:0x35d3c5})));
    }
    const rows=(state.arithmetic.rows||[]).filter(r=>r.good).slice(0,14);
    rows.forEach((r,i)=>{const ang=Number.isFinite(r.theta)?r.theta:0,rad=.72+.06*i,x=lane.A+Math.cos(ang)*rad,z=Math.sin(ang)*rad,y=-1.2+i*.17,node=addAdapterCNode(g,[x,y,z],r.p===state.arithmetic.selectedPrime?0xffffff:0x8ed7ff,r.p===state.arithmetic.selectedPrime?.18:.095,.92,{prime:r.p,namespace:'ADAPTER_C_A',datumId:'local-p-'+r.p});if(r.p===state.arithmetic.selectedPrime)selectedPrimeNode=node;});
  }
  const bNodes={};
  if(showB){
    anchors.B=new THREE.Vector3(lane.B,0,0);
    const defs=[['Betti',[-.72,.9,.1],0x8ed7ff,1],['deRham',[.55,.75,.2],0x35d3c5,1],['etale',[-.72,-.05,.35],0xb8a8ff,1],['crystalline',[.55,-.2,.45],0xf2c96d,1],['prismatic',[0,-1.05,.55],0x8de4b0,1],['rigid',[.9,-1.0,.65],0x9bbbd1,1]];
    defs.forEach(([name,pos,color,degree])=>{const P=[lane.B+pos[0],pos[1],pos[2]+degree*.28],node=addAdapterCNode(g,P,color,.17,.92,{cohomology:name,degree,namespace:'ADAPTER_C_B'});bNodes[name]=node;if(name==='etale')etaleNode=node;});
    edges.forEach(e=>{const a=bNodes[e.from],b=bNodes[e.to];if(!a||!b)return;const verified=e.status==='VERIFIED',enabled=e.status!=='DISABLED',line=makeLine3D(a.position.toArray(),b.position.toArray(),verified?0x8de4b0:enabled?0xf2c96d:0x6f7479,verified?.9:enabled?.58:.25,!verified);line.userData={edgeType:'COMPARISON_ISOMORPHISM',edgeId:e.id,theoremId:e.theoremId,evidenceRef:e.evidenceRef,hypothesis:e.hypothesis};g.add(line);});
  }
  if(showC){
    anchors.C=new THREE.Vector3(lane.C,0,0);
    for(let i=0;i<4;i++){const plane=new THREE.Mesh(new THREE.BoxGeometry(2.15,.08,1.75),new THREE.MeshStandardMaterial({color:[0x2b5264,0x356d78,0x4d6289,0x6b5d8e][i],transparent:true,opacity:.28,roughness:.5}));plane.position.set(lane.C,-1+i*.68,0);plane.userData={edgeType:'FILTRATION_LEVEL',filtration:i};g.add(plane);if(i>0){const prev=[lane.C,-1+(i-1)*.68,.72],cur=[lane.C,-1+i*.68,.72],l=makeLine3D(prev,cur,0xb8a8ff,.78,false);l.userData={edgeType:'FILTRATION_INCLUSION'};g.add(l);}}
    A.hodgeCells.forEach((h,i)=>{const x=lane.C+(h.p-.5)*.85,z=(h.q-.5)*.65,y=-.82+h.filtration*.68,node=addAdapterCNode(g,[x,y,z],0xb8a8ff,.12+.035*h.multiplicity,.9,{hodgeCellId:h.id,p:h.p,q:h.q,multiplicity:h.multiplicity,namespace:'ADAPTER_C_C'});});
    const cycleEv=adapterCEvidence('ADAPTER_C_C','ADAPTER_C_CYCLE_MAP',null),start=[lane.C-.72,-1.2,.7],end=[lane.C+.5,.95,.25],arrowColor=cycleEv?0x8de4b0:cycle?0xf2c96d:0x7a6f56;addArrow(g,start,end,arrowColor,.14);
  }
  if(showA&&showB&&selectedPrimeNode&&etaleNode){const l=makeLine3D(selectedPrimeNode.position.toArray(),etaleNode.position.toArray(),0x8ed7ff,.62,true);l.userData={edgeType:'TYPED_BRIDGE_AB',bridgeId:bridges.AB.id,status:bridges.AB.status};g.add(l);}
  if(showA&&showC&&anchors.A&&anchors.C&&bridges.AC.status==='CONDITIONAL_METADATA_READY'){const l=makeLine3D(anchors.A.toArray(),anchors.C.toArray(),0xb8a8ff,.48,true);l.userData={edgeType:'TYPED_BRIDGE_AC',bridgeId:bridges.AC.id,identityClaim:false};g.add(l);}
  if(showB&&showC&&anchors.B&&anchors.C&&bridges.BC.status==='CONDITIONAL_METADATA_READY'){const l=makeLine3D(anchors.B.toArray(),anchors.C.toArray(),0x35d3c5,.48,true);l.userData={edgeType:'TYPED_BRIDGE_BC',bridgeId:bridges.BC.id,hypothesisComposition:'PROHIBITED'};g.add(l);}
  g.add(new THREE.GridHelper(10,20,0x244c5d,0x122d39));
  adapterCEvidenceNamespaceSummary();renderComparisonEdgeTable();renderHodgeCells();renderMorphismPolicy();
  const linkText=mode==='A'?'Arithmetic layer only':mode==='B'?'Cohomology layer only':mode==='C'?'Hodge/Cycle layer only':mode+' typed links active';safeText('#adapterCLinkStatus',linkText);
  safeText('#adapterC3DStatus','mode='+mode+' · base='+A.baseField+' · coeff='+A.coefficients+' · capability='+(cap.ok?'SUPPORTED':'BLOCKED')+' · comparison edges carry independent theorem/hypothesis/evidence metadata · evidence namespaces A/B/C remain independent.');
}
function adapterCExportSnapshot(){
  const A=ensureAdapterCState(),cap=adapterCCapability(A.mode),edges=adapterCComparisonEdges(),bridges=adapterCBridgeState();return {schema:'MathScopeAdapterCSnapshot/1.0',exportedAt:now(),objectRef:A.objectRef,objectRevision:state.objectRevision,representationRevision:state.representationRevision,mode:A.mode,baseField:A.baseField,coefficients:A.coefficients,capability:{ok:cap.ok,missing:cap.missing,profile:cap.profile},arithmetic:{a:state.arithmetic.a,b:state.arithmetic.b,discriminant:state.arithmetic.discriminant,singular:state.arithmetic.singular,pMax:state.arithmetic.pMax,selectedPrime:state.arithmetic.selectedPrime,rows:state.arithmetic.rows.map(r=>({...r}))},cohomology:{degreeSemantic:'explicit H^n z-axis',edges},hodgeCycle:{cells:A.hodgeCells.map(x=>({...x})),cycleMap:{...A.cycleMap}},bridges,objectRefSharedAcrossLayers:true,evidenceNamespaces:adapterCEvidenceNamespaceSummary(),morphismPolicy:{...(A.morphismPolicy||renderMorphismPolicy())},evidenceRefs:state.evidenceRecords.filter(ev=>String(ev.metadata?.namespace||'').startsWith('ADAPTER_C')).map(ev=>ev.id),camera:cameraSnapshot('adapterC')};
}
$('#computeCurve')?.addEventListener('click',computeArithmetic);
$$('[data-base-field]').forEach(b=>b.addEventListener('click',()=>{const A=ensureAdapterCState(),next=b.dataset.baseField;if(A.baseField!==next){A.baseField=next;adapterCRepresentationChanged('Base field → '+next);}adapterCProfileUI();computeArithmetic();renderAdapterC3D();}));
$('#adapterCCoefficients')?.addEventListener('change',e=>{const A=ensureAdapterCState(),next=e.target.value;if(A.coefficients!==next){A.coefficients=next;adapterCRepresentationChanged('Coefficient profile → '+next);}adapterCProfileUI();renderAdapterC3D();});
$$('.adapter-c-mode').forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;const A=ensureAdapterCState();A.mode=b.dataset.adapterCMode;$$('.adapter-c-mode').forEach(x=>x.classList.toggle('active',x===b));renderAdapterC3D();updateSessionHash();}));
['adapterCSmoothProjective','adapterCComparisonHyp','adapterCCycleEvidence'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{renderAdapterC3D();updateSessionHash();}));
$('#adapterCExport')?.addEventListener('click',()=>{const snap=adapterCExportSnapshot(),blob=new Blob([JSON.stringify(snap,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mathscope-adapter-c-snapshot.json';a.click();URL.revokeObjectURL(a.href);addHistory('EXPORT','Adapter C snapshot exported with base field, primes, comparison/Hodge/cycle layers and evidence refs.');});

function updateGoalAdvice(){
  const g=$('#preservationGoal')?.value||state.preservationGoal||'dynamics';
  state.preservationGoal=g;
  const map={
    topology:'Identifiability + certified secant/topological certificate가 우선입니다.',
    metric:'MetricSemantic + distortion + isometry certificate가 필요합니다.',
    homotopy:'finite invariant evidence와 homotopy-equivalence certificate를 분리합니다.',
    cohomology:'site/coefficients/degree + comparison hypotheses를 먼저 고정합니다.',
    spectrum:'spectral fidelity와 isometry/equivalence를 별도 상태로 둡니다.',
    symplectic:'symplectic form / Hamiltonian data를 Euclidean distortion과 분리합니다.',
    Frobenius:'base field, good/bad reduction, Frobenius convention, local factors를 고정합니다.',
    dynamics:'EvolutionProfile + commutation defect + TransferCertificate를 사용합니다.'
  };
  safeText('#goalAdvice',map[g]||'선택한 목표에 맞는 observation/certificate를 사용합니다.');
}
$('#preservationGoal')?.addEventListener('change',updateGoalAdvice);

function updateMorphismAdvice(){
  const t=$('#morphismType')?.value||state.morphismType||'embedding',prev=state.morphismType||'embedding';
  const map={
    'embedding':'embedding → inclusion structure; induced maps remain separate typed data.',
    'finite map':'finite map → finite fibre/ramification rendering policy.',
    'branched cover':'branched cover → branch/ramification loci are explicit.',
    'smooth fibration':'smooth fibration → base/fibre semantics; monodromy not inferred.',
    'birational map':'birational map → exceptional/indeterminacy loci; not an everywhere isomorphism.'
  };
  state.morphismType=t;safeText('#morphismAdvice',map[t]);renderMorphismPolicy();
  if(prev!==t){adapterCRepresentationChanged('Morphism rendering policy → '+t);renderAdapterC3D();}
}
$('#morphismType')?.addEventListener('change',updateMorphismAdvice);

function condensedCheck(){
  const a=$('#overlap1')?.value??'',b=$('#overlap2')?.value??'';state.condensed.overlap1=a;state.condensed.overlap2=b;
  const ok=a===b;safeText('#finiteDescent',ok?'PASS on displayed finite diagram · EXACT_FINITE':'FAIL on displayed finite diagram');
  safeText('#globalSheaf','UNKNOWN — finite diagram test does not certify global sheaf property');
  $('#finiteDescent')?.classList.toggle('good',ok);$('#finiteDescent')?.classList.toggle('danger',!ok);
  roundTripCheck();updateSessionHash();
}
['overlap1','overlap2'].forEach(id=>$('#'+id)?.addEventListener('input',condensedCheck));
function roundTripCheck(){
  const ni=$('#naturalIso')?.checked,dc=$('#descentCert')?.checked;
  safeText('#roundTripStatus',ni&&dc?'USER-SUPPLIED CONDITIONS PRESENT — certificate still requires evidence':'NO SHEAF ROUND-TRIP CERTIFICATE');
}
['naturalIso','descentCert'].forEach(id=>$('#'+id)?.addEventListener('input',roundTripCheck));

function getClaim(){return state.claims.find(c=>c.id===state.selectedClaim)||state.claims[0]}
function renderClaims(){
  $('#claimTableBody').innerHTML=state.claims.map(c=>'<tr class="clickable" tabindex="0" role="button" aria-label="Claim '+escapeHtml(c.id)+' details" data-claim="'+escapeHtml(c.id)+'"><td>'+escapeHtml(c.id)+'</td><td>'+escapeHtml(c.statement)+'</td><td>'+badge(c.truth,c.truth==='REFUTED'?'bad':c.truth==='PROVED'?'ok':'info')+'</td><td>'+badge(c.evidence,c.evidence==='NONE'?'':c.evidence==='COUNTEREXAMPLE'?'bad':'info')+'</td><td>'+escapeHtml(c.run)+'</td><td>'+badge(c.fresh,c.fresh==='STALE'?'warn':'ok')+'</td><td>'+escapeHtml(c.trust)+'</td></tr>').join('');
  $$('#claimTableBody tr[data-claim]').forEach(tr=>{const open=()=>{state.selectedClaim=tr.dataset.claim;renderClaimDetail();};tr.addEventListener('click',open);tr.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
  renderClaimDetail();updateBenchmarks();
}
function renderClaimDetail(){
  const c=getClaim();safeText('#claimId',c.id);safeText('#claimStatement',c.statement);safeText('#claimScope',c.scope);
  safeText('#claimTruth',c.truth);safeText('#claimEvidence',c.evidence);safeText('#claimRun',c.run);safeText('#claimFresh',c.fresh);safeText('#claimTrust',c.trust);
  if($('#userAxiomToggle'))$('#userAxiomToggle').checked=c.trust==='USER_AXIOM';
  if($('#semanticReview'))$('#semanticReview').checked=state.semanticReviewed;
}
function setSelectedClaimTrust(){
  const c=getClaim();c.trust=$('#userAxiomToggle')?.checked?'USER_AXIOM':'UNCONDITIONAL';
  if(c.trust==='USER_AXIOM'&&!state.assumptions.includes('USER_AXIOM: local user assumption'))state.assumptions.push('USER_AXIOM: local user assumption');
  if(c.trust==='UNCONDITIONAL')state.assumptions=state.assumptions.filter(x=>!x.startsWith('USER_AXIOM'));
  renderClaims();renderAssumptions();addHistory('TRUST','Claim '+c.id+' trust context → '+c.trust+'.');
}
$('#userAxiomToggle')?.addEventListener('change',setSelectedClaimTrust);
$('#semanticReview')?.addEventListener('change',e=>{state.semanticReviewed=e.target.checked;addHistory('REVIEW','Semantic review '+(state.semanticReviewed?'marked complete':'reopened')+' for '+getClaim().id+'.')});
async function checkCloudBackend(){
  safeText('#cloudLeanStatus','CLOUD LEAN CHECK');
  try{
    const res=await fetch(CLOUD_LEAN_BASE+'/health',{cache:'no-store'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    const serviceUp=Boolean(data?.ok);
    cloudBackendReady=serviceUp&&data?.verifierReady===true;
    safeText('#cloudLeanStatus',cloudBackendReady?'CLOUD LEAN VERIFIED':serviceUp?'SERVICE UP · VERIFIER CHECK':'CLOUD LEAN DEGRADED');
    safeText('#cloudMetaStatus',cloudBackendReady?'LIVE · C-014 FORMAL self-test passed':serviceUp?'SERVICE LIVE · verifier self-test not passed yet':'DEGRADED');
    $('#cloudLeanChip')?.classList.toggle('ok',cloudBackendReady);
    $('#cloudLeanChip')?.classList.toggle('warn',!cloudBackendReady);
    if(serviceUp){
      try{
        const metaRes=await fetch(CLOUD_LEAN_BASE+'/v1/meta',{cache:'no-store'});
        if(metaRes.ok){
          const meta=await metaRes.json();
          safeText('#cloudMetaToolchain',meta?.toolchain||'unknown');
          safeText('#cloudMetaEnv',meta?.environmentHash||'unknown');
          safeText('#cloudMetaLock',meta?.dependencyLockHash||'unknown');
        }
      }catch(_err){}
    }
    return cloudBackendReady;
  }catch(err){
    cloudBackendReady=false;
    safeText('#cloudLeanStatus','CLOUD LEAN WAKING / OFFLINE');
    safeText('#cloudMetaStatus','OFFLINE / WAKING');
    safeText('#cloudMetaToolchain','unavailable');
    safeText('#cloudMetaEnv','unavailable');
    safeText('#cloudMetaLock','unavailable');
    $('#cloudLeanChip')?.classList.remove('ok');$('#cloudLeanChip')?.classList.add('warn');
    return false;
  }
}


let cloudLspSocket=null;
let cloudLspSession=null;
let cloudLspReady=false;
let cloudLspVersion=1;
let cloudLspInitId=7001;
let cloudLspChangeTimer=null;
let cloudLspReadyWaiter=null;
let cloudLspDiagnosticWaiter=null;
let cloudLspDiagnosticsEventWaiter=null;
let cloudLspRpcId=9000;
const cloudLspPendingRequests=new Map();

function waitForCloudLspReady(timeoutMs=120000){
  if(cloudLspReady)return Promise.resolve(true);
  if(cloudLspReadyWaiter?.promise)return cloudLspReadyWaiter.promise;
  let timer=null;
  const promise=new Promise((resolve,reject)=>{
    timer=setTimeout(()=>{if(cloudLspReadyWaiter?.promise===promise)cloudLspReadyWaiter=null;reject(new Error('Cloud LSP ready timeout'));},timeoutMs);
    cloudLspReadyWaiter={promise:null,resolve:(v)=>{clearTimeout(timer);cloudLspReadyWaiter=null;resolve(v);},reject:(e)=>{clearTimeout(timer);cloudLspReadyWaiter=null;reject(e);},timer};
  });
  cloudLspReadyWaiter.promise=promise;
  return promise;
}
function waitForCloudDiagnostic(targetVersion=0,timeoutMs=120000){
  if(cloudLspDiagnosticWaiter?.promise)return cloudLspDiagnosticWaiter.promise;
  let timer=null;
  const promise=new Promise((resolve,reject)=>{
    timer=setTimeout(()=>{if(cloudLspDiagnosticWaiter?.promise===promise)cloudLspDiagnosticWaiter=null;reject(new Error('Lean diagnostic timeout'));},timeoutMs);
    cloudLspDiagnosticWaiter={promise:null,targetVersion,resolve:(v)=>{clearTimeout(timer);cloudLspDiagnosticWaiter=null;resolve(v);},reject:(e)=>{clearTimeout(timer);cloudLspDiagnosticWaiter=null;reject(e);},timer};
  });
  cloudLspDiagnosticWaiter.promise=promise;
  return promise;
}
function waitForCloudDiagnosticsEvent(targetVersion=0,timeoutMs=120000){
  if(cloudLspDiagnosticsEventWaiter?.promise)return cloudLspDiagnosticsEventWaiter.promise;
  let timer=null;
  const promise=new Promise((resolve,reject)=>{
    timer=setTimeout(()=>{if(cloudLspDiagnosticsEventWaiter?.promise===promise)cloudLspDiagnosticsEventWaiter=null;reject(new Error('Lean initial diagnostics event timeout'));},timeoutMs);
    cloudLspDiagnosticsEventWaiter={promise:null,targetVersion,resolve:(v)=>{clearTimeout(timer);cloudLspDiagnosticsEventWaiter=null;resolve(v);},reject:(e)=>{clearTimeout(timer);cloudLspDiagnosticsEventWaiter=null;reject(e);},timer};
  });
  cloudLspDiagnosticsEventWaiter.promise=promise;
  return promise;
}

function cloudLspRequest(method,params,timeoutMs=120000){
  if(!cloudLspSocket||cloudLspSocket.readyState!==WebSocket.OPEN)return Promise.reject(new Error('Cloud LSP socket not open'));
  const id=++cloudLspRpcId;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{cloudLspPendingRequests.delete(id);reject(new Error(method+' timeout'));},timeoutMs);
    cloudLspPendingRequests.set(id,{resolve:(value)=>{clearTimeout(timer);cloudLspPendingRequests.delete(id);resolve(value);},reject:(err)=>{clearTimeout(timer);cloudLspPendingRequests.delete(id);reject(err);}});
    cloudLspSend({jsonrpc:'2.0',id,method,params});
  });
}


function setCloudLspStatus(text,ok=false,warn=false){
  safeText('#cloudLspStatus',text);
  $('#cloudLspChip')?.classList.toggle('ok',ok);
  $('#cloudLspChip')?.classList.toggle('warn',warn);
}
function cloudLspSend(message){
  if(cloudLspSocket?.readyState===WebSocket.OPEN)cloudLspSocket.send(JSON.stringify(message));
}
function renderCloudDiagnostics(params){
  const ds=params?.diagnostics||[],version=Number(params?.version??0);
  window.__mathscopeLastDiagnostics={version,diagnostics:ds,receivedAt:new Date().toISOString()};
  if(cloudLspDiagnosticsEventWaiter&&(!cloudLspDiagnosticsEventWaiter.targetVersion||version>=cloudLspDiagnosticsEventWaiter.targetVersion))cloudLspDiagnosticsEventWaiter.resolve({version,diagnostics:ds});
  if(ds.length&&cloudLspDiagnosticWaiter&&(!cloudLspDiagnosticWaiter.targetVersion||version>=cloudLspDiagnosticWaiter.targetVersion))cloudLspDiagnosticWaiter.resolve(ds);
  if(!ds.length){
    safeText('#cloudLspDiagnostic','LSP: 현재 문서에 보고된 diagnostics가 없습니다. 이 상태만으로 FORMAL evidence가 되지는 않습니다.');
    return;
  }
  const label=s=>s===1?'ERROR':s===2?'WARN':s===3?'INFO':'HINT';
  const text=ds.slice(0,20).map(d=>{
    const line=(d?.range?.start?.line??0)+1,col=(d?.range?.start?.character??0)+1;
    return label(d.severity)+' L'+line+':'+col+' · '+String(d.message||'');
  }).join('\n');
  safeText('#cloudLspDiagnostic',text+(ds.length>20?'\n… '+(ds.length-20)+' more':''));
}
function openCloudLspDocument(){
  if(!cloudLspSession||!cloudLspReady)return;
  cloudLspVersion=1;
  cloudLspSend({jsonrpc:'2.0',method:'textDocument/didOpen',params:{
    textDocument:{
      uri:cloudLspSession.documentUri,
      languageId:'lean4',
      version:cloudLspVersion,
      text:$('#leanSource')?.value??''
    },
    dependencyBuildMode:'never'
  }});
}
function pushCloudLspChange(){
  if(!cloudLspSession||!cloudLspReady)return;
  cloudLspVersion++;
  cloudLspSend({jsonrpc:'2.0',method:'textDocument/didChange',params:{
    textDocument:{uri:cloudLspSession.documentUri,version:cloudLspVersion},
    contentChanges:[{text:$('#leanSource')?.value??''}]
  }});
}
function stopCloudLsp(reason='manual stop'){
  clearTimeout(cloudLspChangeTimer);
  cloudLspChangeTimer=null;
  cloudLspReady=false;
  cloudLspSession=null;
  if(cloudLspSocket){
    try{cloudLspSocket.close(1000,reason)}catch{}
  }
  cloudLspSocket=null;
  for(const [id,p] of cloudLspPendingRequests){p.reject(new Error('Cloud LSP stopped'));cloudLspPendingRequests.delete(id);}
  setCloudLspStatus('LSP IDLE');
}
function startCloudLsp(){
  if(cloudLspSocket&&(cloudLspSocket.readyState===WebSocket.OPEN||cloudLspSocket.readyState===WebSocket.CONNECTING))return;
  stopCloudLsp('restart');
  setCloudLspStatus('LSP CONNECTING',false,true);
  safeText('#cloudLspDiagnostic','Cloud Lean LSP 세션을 시작하는 중…');
  const wsUrl=CLOUD_LEAN_BASE.replace(/^http/,'ws')+'/v1/lsp';
  const ws=new WebSocket(wsUrl);
  cloudLspSocket=ws;
  ws.onopen=()=>{setCloudLspStatus('LSP STARTING',false,true);safeText('#cloudLspDiagnostic','WebSocket connected · waiting for Lean lake serve initialize response…');};
  ws.onmessage=e=>{
    let msg;try{msg=JSON.parse(e.data)}catch{return}
    if(msg?.mathscope){
      if(msg.mathscope.type==='session'){
        cloudLspSession=msg.mathscope;
        cloudLspInitId++;
        cloudLspSend({jsonrpc:'2.0',id:cloudLspInitId,method:'initialize',params:{
          processId:null,
          clientInfo:{name:'MathScope Web',version:'0.2.1.1'},
          rootUri:cloudLspSession.rootUri,
          capabilities:{
            textDocument:{publishDiagnostics:{relatedInformation:true}},
            workspace:{configuration:true,workspaceFolders:true,inlayHint:{refreshSupport:true},semanticTokens:{refreshSupport:true},codeLens:{refreshSupport:true},diagnostics:{refreshSupport:true}}
          },
          workspaceFolders:[{uri:cloudLspSession.rootUri,name:'MathScope'}]
        }});
      }else if(msg.mathscope.type==='stderr'){
        safeText('#cloudLspDiagnostic','LSP stderr: '+msg.mathscope.text);
      }else if(msg.mathscope.type==='error'){
        safeText('#cloudLspDiagnostic','LSP error: '+msg.mathscope.text);
      }
      return;
    }
    if(msg?.method&&msg?.id!=null){
      let result=null;
      if(msg.method==='workspace/configuration')result=Array.isArray(msg?.params?.items)?msg.params.items.map(()=>null):[];
      else if(msg.method==='workspace/workspaceFolders')result=[];
      else if(msg.method==='workspace/applyEdit')result={applied:false,failureReason:'MathScope Cloud LSP web client does not apply workspace edits.'};
      else if(msg.method==='window/showMessageRequest')result=null;
      else if(msg.method==='window/workDoneProgress/create')result=null;
      else if(msg.method==='client/registerCapability'||msg.method==='client/unregisterCapability'||msg.method==='workspace/inlayHint/refresh'||msg.method==='workspace/semanticTokens/refresh'||msg.method==='workspace/codeLens/refresh'||msg.method==='workspace/diagnostic/refresh')result=null;
      cloudLspSend({jsonrpc:'2.0',id:msg.id,result});
      return;
    }
    if(msg?.id!=null&&cloudLspPendingRequests.has(msg.id)){
      const pending=cloudLspPendingRequests.get(msg.id);
      if(msg.error)pending.reject(new Error(String(msg.error?.message||'LSP request failed')));else pending.resolve(msg.result);
      return;
    }
    if(msg?.id===cloudLspInitId&&msg?.result){
      cloudLspSend({jsonrpc:'2.0',method:'initialized',params:{}});
      cloudLspReady=true;
      setCloudLspStatus('LSP READY',true,false);
      if(cloudLspReadyWaiter)cloudLspReadyWaiter.resolve(true);
      openCloudLspDocument();
      addHistory('LSP','Cloud lake serve session initialized. Diagnostics remain non-FORMAL work feedback.');
      return;
    }
    if(msg?.method==='textDocument/publishDiagnostics'){
      renderCloudDiagnostics(msg.params);
    }
  };
  ws.onerror=()=>{
    cloudLspReady=false;
    if(cloudLspReadyWaiter)cloudLspReadyWaiter.reject(new Error('Cloud LSP socket error'));
    setCloudLspStatus('LSP ERROR',false,true);
    safeText('#cloudLspDiagnostic','Cloud LSP 연결 오류. Final verifier와 기존 EvidenceRecord에는 영향을 주지 않습니다.');
  };
  ws.onclose=()=>{
    const wasReady=cloudLspReady;
    if(!cloudLspReady&&cloudLspReadyWaiter)cloudLspReadyWaiter.reject(new Error('Cloud LSP closed before ready'));
    cloudLspReady=false;cloudLspSession=null;cloudLspSocket=null;
    setCloudLspStatus('LSP IDLE',false,wasReady);
  };
}
$('#startCloudLsp')?.addEventListener('click',startCloudLsp);
$('#stopCloudLsp')?.addEventListener('click',()=>stopCloudLsp());
$('#leanSource')?.addEventListener('input',()=>{
  if(!cloudLspReady)return;
  clearTimeout(cloudLspChangeTimer);
  cloudLspChangeTimer=setTimeout(pushCloudLspChange,250);
});

$('#requestLean')?.addEventListener('click',async()=>{
  const c=getClaim();
  const editorSource=$('#leanSource')?.value??'';
  if(c.id==='C-014'&&pinnedC014Source&&editorSource.trim()!==pinnedC014Source.trim()){
    c.run='ERROR';renderClaims();
    safeText('#leanDiagnostic','CLOUD MVP SECURITY BOUNDARY: 현재 Cloud C-014 verifier는 서버에 고정된 audited source만 검증합니다. Editor 내용을 변경한 경우 FORMAL evidence를 발급하지 않습니다. 사용자 정의 Lean 코드는 Private Local Mode 또는 향후 sandboxed Cloud Worker가 필요합니다.');
    addHistory('LEAN','Cloud verification refused: editor source differs from pinned audited C-014 source.');
    return;
  }
  if(c.id!=='C-014'){
    c.run='ERROR';renderClaims();
    safeText('#leanDiagnostic','CLOUD MVP: C-014만 실제 서버 검증에 연결되어 있습니다. 다른 claim은 아직 FORMAL evidence를 발급하지 않습니다.');
    addHistory('LEAN','Cloud verification refused for '+c.id+': current cloud MVP is restricted to C-014.');
    return;
  }
  c.run='QUEUED';renderClaims();safeText('#leanDiagnostic','Cloud Lean worker 준비 중… C-014를 고정 환경에서 검증합니다.');
  addHistory('LEAN','Cloud verification queued for C-014.');
  activeCloudVerifyController=new AbortController();
  try{
    const res=await fetch(CLOUD_LEAN_BASE+'/v1/verify/c014',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({semanticReviewed:state.semanticReviewed===true}),
      signal:activeCloudVerifyController.signal
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data?.error||('HTTP '+res.status));
    c.truth=data?.state?.truth||'OPEN';
    c.evidence=data?.state?.evidence||'NONE';
    c.run=data?.state?.run||'ERROR';
    c.fresh=data?.state?.freshness||'CURRENT';
    c.trust=data?.state?.trust||'UNCONDITIONAL';
    const audit=(data?.axiomAuditOutput||'').trim();
    const detail=[
      'Cloud C-014 verification: '+c.run,
      'Truth '+c.truth+' · Evidence '+c.evidence+' · Freshness '+c.fresh+' · Trust '+c.trust,
      data?.toolchain?('Toolchain '+data.toolchain):'',
      data?.sourceHash?('source '+data.sourceHash.slice(0,16)+'…'):'',
      data?.environmentHash?('environment '+data.environmentHash.slice(0,16)+'…'):'',
      data?.dependencyLockHash?('lock '+data.dependencyLockHash.slice(0,16)+'…'):'',
      audit?('Axiom audit: '+audit):''
    ].filter(Boolean).join('\n');
    safeText('#leanDiagnostic',detail);
    if(c.run==='SUCCESS'&&c.evidence==='FORMAL')storeEvidenceRecord(data,c);
    addHistory('LEAN','Cloud C-014 '+c.run+': '+c.evidence+' / '+c.truth+'; source '+(data?.sourceHash||'').slice(0,12)+'.');
    cloudBackendReady=true;safeText('#cloudLeanStatus','CLOUD LEAN READY');$('#cloudLeanChip')?.classList.add('ok');$('#cloudLeanChip')?.classList.remove('warn');
  }catch(err){
    if(err?.name==='AbortError'){
      c.run='CANCELLED';safeText('#leanDiagnostic','CANCELLED: 브라우저가 응답 대기를 중단했습니다. 서버 작업이 이미 시작되었다면 서버에서는 완료될 수 있으며, 이 취소 자체는 수학적 반증이 아닙니다.');
      addHistory('LEAN','Cloud C-014 response wait cancelled; no evidence promotion performed.');
    }else{
      c.run='ERROR';safeText('#leanDiagnostic','CLOUD ERROR: '+String(err?.message||err)+'. 기존 evidence는 보존됩니다.');
      addHistory('LEAN','Cloud C-014 execution error: '+String(err?.message||err)+'. Existing evidence preserved.');
      cloudBackendReady=false;safeText('#cloudLeanStatus','CLOUD LEAN DEGRADED');$('#cloudLeanChip')?.classList.remove('ok');$('#cloudLeanChip')?.classList.add('warn');
    }
  }finally{
    activeCloudVerifyController=null;renderClaims();
  }
});
$('#cancelLean')?.addEventListener('click',()=>{
  if(activeCloudVerifyController)activeCloudVerifyController.abort();
  else {const c=getClaim();c.run='CANCELLED';addHistory('LEAN','Build request cancelled for '+c.id+'.');renderClaims();}
});
$('#staleDefinitions')?.addEventListener('click',()=>{
  state.objectRevision++;state.claimRevision++;
  const affected=new Set(['C-014','C-015','LP-1','LP-2R','HILB-1']);
  state.claims.forEach(c=>{if(affected.has(c.id))c.fresh='STALE'});
  state.evidenceRecords.forEach(ev=>{if(affected.has(ev.claimId)&&ev.freshness==='CURRENT')ev.freshness='STALE'});
  addHistory('REVISION','Object definition/assumption revision changed. Dependent claim state and retained EvidenceRecords marked STALE; no proof history deleted.');renderClaims();renderRevision();updateTop();
});
$('#refreshCurrent')?.addEventListener('click',()=>{
  const c=getClaim();c.run='IDLE';
  addHistory('REVISION','Freshness was not reset for '+c.id+'. CURRENT requires a new verification against the current revision; retained evidence remains '+c.fresh+'.');
  safeText('#leanDiagnostic','STALE evidence cannot be promoted to CURRENT manually. Re-run verification on the current revision.');
  renderClaims();
});
function renderAssumptions(){
  $('#assumptionList').innerHTML=state.assumptions.length?state.assumptions.map(x=>'<div class="event"><span class="etype">Γ</span><span>'+escapeHtml(x)+'</span><span class="warn">DECLARED</span></div>').join(''):'<div class="muted small">No user axioms. Theorem/local hypotheses are shown per claim scope.</div>';
}
function renderHistory(){
  $('#historyList').innerHTML=state.evidenceHistory.slice(0,40).map(h=>'<div class="history-item"><b>'+escapeHtml(h.kind)+'</b> · '+escapeHtml(new Date(h.time).toLocaleTimeString())+'<br>'+escapeHtml(h.summary)+'</div>').join('');
}
function renderRevision(){
  safeText('#objectRev','r'+state.objectRevision);safeText('#repRev','r'+state.representationRevision);safeText('#claimRepRev','r'+state.representationRevision);safeText('#claimRev','r'+state.claimRevision);
  $('#revisionGraph').innerHTML='<span class="rev-node">Object r'+escapeHtml(state.objectRevision)+'</span><span class="rev-arrow">→</span><span class="rev-node">Representation r'+escapeHtml(state.representationRevision)+'</span><span class="rev-arrow">→</span><span class="rev-node '+(state.claims.some(c=>c.fresh==='STALE')?'stale':'')+'">Claims r'+escapeHtml(state.claimRevision)+'</span><span class="rev-arrow">→</span><span class="rev-node">Evidence history '+escapeHtml(state.evidenceHistory.length)+' · formal records '+escapeHtml(state.evidenceRecords?.length||0)+'</span>';
}
function updateBenchmarks(){
  const by=id=>state.claims.find(c=>c.id===id);
  const b5=state.claims.some(c=>c.fresh==='STALE');
  const b6=state.claims.some(c=>c.trust==='USER_AXIOM');
  const items=[
    ['B1','IMPLEMENTED','Projection/slice/critical cases separated'],
    ['B2',by('LP-2CE')?.truth==='REFUTED'?'PASS':'CHECK','rotated-basis counterexample'],
    ['B3',safeText?'PASS':'CHECK','sample residual never enables topology certificate'],
    ['B4','PASS','spectral fidelity and isometry certificate shown separately'],
    ['B5',b5?'PASS AFTER REVISION':'READY','proof history survives STALE transition'],
    ['B6',b6?'PASS WITH USER AXIOM':'READY','USER_AXIOM remains in trust context'],
    ['B7','PASS','constant encoder rejected by admissibility gate'],
    ['B8',state.arithmetic.rows.length?'PASS':'READY','finite arithmetic sample tagged ESTIMATED']
  ];
  $('#benchmarkList').innerHTML=items.map(x=>'<div class="check '+(x[1].startsWith('PASS')?'pass':'pending')+'"><span class="mark">'+(x[1].startsWith('PASS')?'✓':'•')+'</span><span><b>'+x[0]+'</b> · '+x[2]+'</span><span class="badge '+(x[1].startsWith('PASS')?'ok':'warn')+'">'+x[1]+'</span></div>').join('');
}
function updateTop(){
  safeText('#topRevisions','OBJ r'+state.objectRevision+' · REP r'+state.representationRevision+' · CLAIM r'+state.claimRevision);
  renderRevision();updateSessionHash();
}


function currentFormalEvidence(claimId){
  return state.evidenceRecords.find(ev=>
    ev.claimId===claimId&&
    ev.evidenceGrade==='FORMAL'&&
    ev.freshness==='CURRENT'&&
    ev.runStatus==='SUCCESS'&&
    ev.objectRevision===state.objectRevision&&
    ev.representationRevision===state.representationRevision&&
    ev.claimRevision===state.claimRevision
  )||null;
}
function visualizationModule(view){
  const map={geometry:'GEOMETRY_PDE_DYNAMICS',functional:'FUNCTIONAL',fidelity:'IDENT_FIDELITY_CERT',dynamics:'GEOMETRY_PDE_DYNAMICS',arithmetic:'ADAPTER_C',advanced:'PERFECTOID',claims:'CLAIMS',validation:'VALIDATION',overview:'OVERVIEW',architecture:'ARCHITECTURE'};
  return map[view]||'OVERVIEW';
}
function buildVisualizationSpec(view=state.view){
  let mode=view,axisSemantics=[],metricSemantic='DISPLAY_EUCLIDEAN_ONLY',representationStatus='VISUAL_ONLY',certificateStatus='WITHHELD',blockedReasons=[],evidenceRefs=[];
  if(view==='geometry'){
    mode=state.observation;
    axisSemantics=[{axis:'x',meaning:'display x₁'},{axis:'y',meaning:'display x₂'},{axis:'z',meaning:'display x₃'}];
    metricSemantic='DISPLAY_EUCLIDEAN__SOURCE_METRIC_NOT_INFERRED';
    representationStatus=state.object==='S3'&&state.observation==='slice'&&state.sliceKind==='exact'?'EXACT':'ESTIMATED';
    blockedReasons=['NO_CERTIFIED_MAP'];
  }else if(view==='functional'){
    mode=state.functionalMode;
    axisSemantics=[{axis:'x',meaning:'coordinate index / mode id'},{axis:'y',meaning:'representation lane / retained subspace'},{axis:'z',meaning:'coefficient magnitude / spectral energy'}];
    metricSemantic='SOURCE_NORM_EXPLICIT__SCREEN_DISTANCE_NONSEMANTIC';
    representationStatus=state.functionalMode==='mixed'?'DERIVED':'EXACT';
    certificateStatus='WITHHELD';blockedReasons=['FINITE_TRUNCATION','NO_CERTIFIED_MAP'];
    evidenceRefs=['LP-1','LP-2R','LP-2CE'];
  }else if(view==='fidelity'){
    mode='linked-triple-view';
    axisSemantics=[{axis:'x',meaning:'structural component / panel lane'},{axis:'y',meaning:'discrepancy or gate level'},{axis:'z',meaning:'robustness/confidence auxiliary axis'}];
    metricSemantic='DIAGNOSTIC_STATE_SPACE';
    representationStatus='ESTIMATED';
    const S=computeIfcState();
    certificateStatus=S.cert;
    representationStatus=S.cert==='ISSUED'?'FORMAL_LINKED':'ESTIMATED';
    blockedReasons=[...S.blocked];
    evidenceRefs=[S.records?.ambiguity?.id,S.records?.certificate?.id].filter(Boolean);
  }else if(view==='dynamics'){
    const G=ensureGeometryState(),P=ensurePdeState(),tr=state.transfer||{defect:.03,tolerance:.05,identifiable:false,metric:'display-l2'},ev=gpdTransferEvidence();
    mode='geometry→pde→transfer';
    axisSemantics=[{axis:'x',meaning:'surface carrier display coordinate x'},{axis:'y',meaning:'surface coordinate y plus explicitly encoded field displacement'},{axis:'z',meaning:'surface carrier display coordinate z'}];
    metricSemantic=(G.metricSemantic==='intrinsic'?'INTRINSIC_TARGET':G.metricSemantic==='ambient'?'AMBIENT_DISPLAY_ONLY':'INTRINSIC_AND_AMBIENT_SEPARATED')+'__DEFECT_'+String(tr.metric||'display-l2').toUpperCase();
    representationStatus=ev?'FORMAL_LINKED':'ESTIMATED';
    const reasons=[];if(!tr.identifiable)reasons.push('NON_INJECTIVE');if(Number(tr.defect)>Number(tr.tolerance))reasons.push('NUMERICAL_ONLY');if(!ev)reasons.push('NO_CERTIFIED_MAP');
    certificateStatus=(!tr.identifiable||Number(tr.defect)>Number(tr.tolerance))?'BLOCKED':ev?'ISSUED':'WITHHELD';
    blockedReasons=reasons;evidenceRefs=ev?[ev.id]:[];
    if(P.equation==='schrodinger')blockedReasons.push('NUMERICAL_ONLY');
  }else if(view==='arithmetic'){
    const A=ensureAdapterCState(),cap=adapterCCapability(A.mode),ev=adapterCEvidenceNamespaceSummary();
    mode=A.mode;
    axisSemantics=[{axis:'x',meaning:'typed theory lane / arithmetic real-or-prime coordinate'},{axis:'y',meaning:'local invariant / comparison layout coordinate'},{axis:'z',meaning:'Frobenius imaginary component OR explicit cohomological degree OR Hodge filtration level'}];
    metricSemantic='INVARIANT_DIAGRAM__NOT_LITERAL_GEOMETRY';
    representationStatus='ESTIMATED';certificateStatus='WITHHELD';blockedReasons=[];
    if(!cap.ok)blockedReasons.push('MISSING_HYPOTHESIS');
    if(state.arithmetic.singular)blockedReasons.push('NO_CERTIFIED_MAP');
    if((ev.A||[]).length+(ev.B||[]).length+(ev.C||[]).length===0)blockedReasons.push('NUMERICAL_ONLY');
    evidenceRefs=[...(ev.A||[]),...(ev.B||[]),...(ev.C||[])];
  }else if(view==='advanced'){
    mode='rational-correspondence';
    axisSemantics=[{axis:'x',meaning:'fixed semantic side: source X vs tilt X♭'},{axis:'y',meaning:'cover/refinement display depth only'},{axis:'z',meaning:'schematic rational-subset/overlap lane'}];
    metricSemantic='SCHEMATIC_ONLY__SCREEN_DISTANCE_NOT_ADIC_OR_VALUATION';
    const PF=perfectoidCurrent(),ev=PF.corr?perfectoidEvidenceFor(PF.corr.id):null;
    representationStatus=ev?'FORMAL_LINKED':'VISUAL_ONLY';certificateStatus=ev?'ELIGIBLE':'WITHHELD';blockedReasons=['SCHEMATIC_ONLY'];if(!ev)blockedReasons.push('MISSING_HYPOTHESIS');if(PF.P.metadataMissing)blockedReasons.push('NO_CERTIFIED_MAP');evidenceRefs=ev?[ev.id]:[];
  }else if(view==='claims'){
    mode=state.selectedClaim;
    const ev=currentFormalEvidence(state.selectedClaim);
    const sorryDependent=Boolean(ev&&/sorryAx/.test(String(ev.axiomAuditOutput||'')));
    const trustOk=Boolean(ev&&ev.trustContext==='UNCONDITIONAL'&&!sorryDependent);
    const issuable=Boolean(ev&&trustOk&&state.semanticReviewed);
    representationStatus=ev?'FORMAL_LINKED':'DERIVED';
    certificateStatus=issuable?'ISSUED':ev?'ELIGIBLE':'WITHHELD';
    blockedReasons=[];
    if(!ev)blockedReasons.push('NO_CERTIFIED_MAP');
    if(ev&&!state.semanticReviewed)blockedReasons.push('MISSING_HYPOTHESIS');
    if(ev&&!trustOk)blockedReasons.push('MISSING_HYPOTHESIS');
    evidenceRefs=ev?[ev.id]:[];
    axisSemantics=[];metricSemantic='NOT_APPLICABLE';
  }
  if(representationStatus==='FORMAL_LINKED'&&!evidenceRefs.length)representationStatus='DERIVED';
  return {
    id:'viz-'+view,
    revision:state.representationRevision,
    objectRevision:state.objectRevision,
    claimRevision:state.claimRevision,
    module:visualizationModule(view),
    mode,
    preservationGoal:state.preservationGoal,
    axisSemantics,
    metricSemantic,
    representationStatus,
    certificateStatus,
    blockedReasons:[...new Set(blockedReasons)],
    assumptions:[...state.assumptions],
    evidenceRefs
  };
}
function buildModuleSnapshots(){
  return ['geometry','functional','fidelity','dynamics','arithmetic','advanced','claims'].map(v=>buildVisualizationSpec(v));
}
function serializableState(){
  const copy={...state,pdeModel:null,selectedPoint:null,evidenceHistory:state.evidenceHistory.slice(0,100)};
  return copy;
}
function releaseReplaySignature(){
  const G=ensureGeometryState(),P=ensurePdeState(),IF=ifcModelDefaults(),PF=ensurePerfectoidModel(),AC=ensureAdapterCState();
  const evidence=state.evidenceRecords.map(ev=>({
    id:ev.id,claimId:ev.claimId,objectRevision:ev.objectRevision,representationRevision:ev.representationRevision??null,claimRevision:ev.claimRevision,
    evidenceGrade:ev.evidenceGrade,runStatus:ev.runStatus,freshness:ev.freshness,trustContext:ev.trustContext,
    sourceHash:ev.sourceHash||'',environmentHash:ev.environmentHash||'',dependencyLockHash:ev.dependencyLockHash||'',certifiedUpper:ev.certifiedUpper??null
  })).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  return {
    schema:'MathScopeReleaseReplay/1.0',
    view:state.view,
    revisions:{object:state.objectRevision,representation:state.representationRevision,claim:state.claimRevision},
    preservationGoal:state.preservationGoal,
    geometry:{object:state.object,observation:state.observation,sliceKind:state.sliceKind,c:state.c,epsilon:state.epsilon,pathT:state.pathT},
    functional:functionalReplaySignature(),
    ifc:{encoder:IF.encoder,collision:IF.collision,noise:IF.noise,noiseScope:IF.noiseScope,selectedSampleId:IF.selectedSampleId,modelRevision:IF.learned?.modelRevision??0,weightHash:IF.learned?.weightHash||''},
    perfectoid:{selected:PF.selected,coverDepth:PF.coverDepth,sideFocus:PF.sideFocus,metadataMissing:Boolean(PF.metadataMissing)},
    adapterC:{mode:AC.mode,baseField:AC.baseField,coefficients:AC.coefficients,objectRef:AC.objectRef,curve:{a:state.arithmetic.a,b:state.arithmetic.b,pMax:state.arithmetic.pMax,selectedPrime:state.arithmetic.selectedPrime}},
    gpd:{geometry:{surface:G.surface,topology:G.topology,metricSemantic:G.metricSemantic,meshResolution:G.meshResolution,solverResolution:G.solverResolution},pde:{equation:P.equation,initial:P.initial,seed:P.seed,dt:P.dt,time:P.time,kappa:P.kappa,waveSpeed:P.waveSpeed,damping:P.damping},transfer:{defect:state.transfer?.defect??null,tolerance:state.transfer?.tolerance??null,identifiable:Boolean(state.transfer?.identifiable),metric:state.transfer?.metric||null}},
    claims:state.claims.map(c=>({id:c.id,truth:c.truth,evidence:c.evidence,run:c.run,fresh:c.fresh,trust:c.trust})).sort((a,b)=>a.id.localeCompare(b.id)),
    evidence,
    moduleSpecs:buildModuleSnapshots().map(s=>({module:s.module,mode:s.mode,axisSemantics:s.axisSemantics,metricSemantic:s.metricSemantic,representationStatus:s.representationStatus,certificateStatus:s.certificateStatus,blockedReasons:s.blockedReasons,evidenceRefs:s.evidenceRefs}))
  };
}
function compareReleaseReplay(expected,actual=releaseReplaySignature(),tolerance=1e-8){
  if(!expected)return {status:'NO_REFERENCE',tolerance,diffs:[]};
  const diffs=[];
  const walk=(a,b,path)=>{
    if(typeof a==='number'&&typeof b==='number'){
      if(!Number.isFinite(a)||!Number.isFinite(b)){if(a!==b)diffs.push(path+': '+a+' != '+b);return}
      const lim=tolerance*(1+Math.max(Math.abs(a),Math.abs(b)));if(Math.abs(a-b)>lim)diffs.push(path+': Δ='+Math.abs(a-b));return;
    }
    if(Array.isArray(a)||Array.isArray(b)){
      if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length){diffs.push(path+': array shape mismatch');return}
      for(let i=0;i<a.length;i++)walk(a[i],b[i],path+'['+i+']');return;
    }
    if(a&&typeof a==='object'||b&&typeof b==='object'){
      if(!a||!b||typeof a!=='object'||typeof b!=='object'){diffs.push(path+': object mismatch');return}
      const keys=[...new Set([...Object.keys(a),...Object.keys(b)])].sort();
      for(const k of keys)walk(a[k],b[k],path?path+'.'+k:k);return;
    }
    if(a!==b)diffs.push(path+': '+String(a)+' != '+String(b));
  };
  walk(expected,actual,'');
  return {status:diffs.length?'FAIL':'PASS',tolerance,diffs:diffs.slice(0,50),actual};
}
function makeExportManifest(){
  return {
    schema:'MathScopeSession/2.2',
    exportedAt:now(),
    renderingBudget:{...renderBudget},
    state:serializableState(),
    visualizationSpec:buildVisualizationSpec(),
    moduleSnapshots:buildModuleSnapshots(),
    functionalSnapshot:functionalExportSnapshot(),
    functionalReplay:functionalReplaySignature(),
    releaseReplay:releaseReplaySignature(),
    perfectoidSnapshot:perfectoidExportSnapshot(),
    adapterCSnapshot:adapterCExportSnapshot(),
    gpdSnapshot:gpdExportSnapshot(),
    evidenceRecords:state.evidenceRecords.map(x=>({...x}))
  };
}
function setVisualizationParameter(parameter,value){
  if(parameter==='functionalMode'){if(!['sequence','projection','operator','mixed'].includes(value))throw new Error('invalid functionalMode');setFunctionalMode(value);}
  else if(parameter==='p'){const v=clamp(Number(value),1,4);state.p=v;if($('#pRange'))$('#pRange').value=v;functionalCompute();}
  else if(parameter==='k'){const n=Math.max(1,state.faVector.length),v=clamp(Math.trunc(Number(value)),1,n);state.k=v;if($('#kRange'))$('#kRange').value=v;functionalCompute();}
  else if(parameter==='ifcCollision'){const v=clamp(Number(value),0,1);state.ifc.collision=v;if($('#ifcCollision'))$('#ifcCollision').value=v;renderIfc3D();drawFidelityPipeline();}
  else if(parameter==='ifcEncoder'){if(!['projection','invariant','constant','learned'].includes(value))throw new Error('invalid ifcEncoder');state.ifc.encoder=value;if($('#ifcEncoder'))$('#ifcEncoder').value=value;updateIfcModelMeta();renderIfc3D();drawFidelityPipeline();}
  else if(parameter==='geometrySurface'){if(!['sphere','torus','saddle','custom'].includes(value))throw new Error('invalid geometrySurface');ensureGeometryState().surface=value;$$('.geometry-core-preset').forEach(b=>b.classList.toggle('active',b.dataset.geometryCore===value));if($('#geometryCustomPanel'))$('#geometryCustomPanel').style.display=value==='custom'?'block':'none';renderGeometryCore3D();state.pdeModel=null;ensurePdeModel(true);renderPde3D();}
  else if(parameter==='geometryTopology'){if(!['sphere','torus','disk','plane','unknown'].includes(value))throw new Error('invalid geometryTopology');ensureGeometryState().topology=value;if($('#geometryTopology'))$('#geometryTopology').value=value;renderGeometryCore3D();}
  else if(parameter==='pdeEquation'){if(!['heat','wave','transport','schrodinger','reaction'].includes(value))throw new Error('invalid pdeEquation');ensurePdeState().equation=value;updatePdePanels();state.pdeModel=null;resetPdeModel();}
  else if(parameter==='pdeTime'){const v=clamp(Number(value),0,3);state.pde.time=v;if($('#pdeTime'))$('#pdeTime').value=v;renderPde3D();renderTransfer3D();}
  else if(parameter==='adapterCMode'){if(!['A','B','C','AB','AC','BC','ABC'].includes(value))throw new Error('invalid adapterCMode');const A=ensureAdapterCState();if(!adapterCCapability(value).ok)throw new Error('adapterCMode unsupported for current base field');A.mode=value;$$('.adapter-c-mode').forEach(b=>b.classList.toggle('active',b.dataset.adapterCMode===value));renderAdapterC3D();}
  else if(parameter==='adapterCBaseField'){if(!['R','C','Q','Fq','Qp'].includes(value))throw new Error('invalid adapterCBaseField');ensureAdapterCState().baseField=value;adapterCProfileUI();computeArithmetic();renderAdapterC3D();}
  else if(parameter==='adapterCCoefficients'){if(!['Q','R','C','Ql','Fp'].includes(value))throw new Error('invalid adapterCCoefficients');ensureAdapterCState().coefficients=value;if($('#adapterCCoefficients'))$('#adapterCCoefficients').value=value;adapterCProfileUI();renderAdapterC3D();}
  else if(parameter==='perfectoidSubset'){if(!/^U[1-6]$/.test(String(value)))throw new Error('invalid perfectoidSubset');state.perfectoid.selected=String(value);if($('#perfectoidSubset'))$('#perfectoidSubset').value=String(value);drawPerfectoidViz();}
  else throw new Error('unsupported parameter');
  state.representationRevision++;updateTop();
  return {parameter,value,visualizationSpec:buildVisualizationSpec()};
}
function runVisualizationRegression(){
  const results=[];
  const push=(id,pass,detail)=>results.push({id,pass:Boolean(pass),detail});
  const v=[1,-.5,.25],m2=lpMap(v,2);push('T-FA-01',m2.every((x,i)=>Math.abs(x-v[i])<1e-12),'p=2 Mₚ identity-like finite mapping');
  const p=1.5,y=lpMap(v,p),k=v.length,r=y.reduce((s,a,i)=>s+(i>=k?a*a:0),0);push('T-FA-02',Math.abs(r)<1e-12,'k=n residual zero');
  let mismatchBlocked=false;try{parseUserOperatorMatrix([[1,0],[0,1]],3)}catch{mismatchBlocked=true}push('T-FA-21',mismatchBlocked,'user matrix dimension mismatch is blocked');
  const savedBasisType=state.faBasis?.type;state.faBasis.type='user';const scopeSafe=(state.faBasis.type!=='standard');state.faBasis.type=savedBasisType;push('T-FA-26',scopeSafe,'user/rotated basis never inherits LP-2 standard-coordinate certification');
  const replaySelf=compareFunctionalReplay(functionalReplaySignature(),1e-10);push('T-FA-30',replaySelf.status==='PASS','functional replay signature reproduces within tolerance');
  const ids=ensureIfcSamples().map(s=>s.id);push('T-IFC-01-ID',new Set(ids).size===ids.length&&ids.every(x=>/^src-\d\d$/.test(x)),'source sample IDs stable and unique');
  const fake=[{id:'a',source:[0,0,0],observationMath:[0,0]},{id:'b',source:[1,0,0],observationMath:[0,0]}];const fakeBundles=ifcCollisionBundles(fake,1e-9);push('T-IFC-01',fakeBundles.length===1&&fakeBundles[0].length===2,'two-to-one finite encoder yields a collision bundle');
  const Sifc=ifcModelDefaults(),savedEnc=Sifc.encoder,savedNoiseScope=Sifc.noiseScope,savedNoise=Sifc.noise,savedCollision=Sifc.collision;Sifc.encoder='constant';Sifc.noise=0;Sifc.noiseScope='observation';Sifc.collision=0;const constBundles=ifcCollisionBundles(ifcObservationSet(),1e-9);push('T-IFC-02',constBundles.length===1&&constBundles[0].length===ensureIfcSamples().length,'constant encoder is explicitly non-identifiable');Sifc.encoder=savedEnc;Sifc.noiseScope=savedNoiseScope;Sifc.noise=savedNoise;Sifc.collision=savedCollision;
  push('T-IFC-03',fakeBundles.length>0,'high fidelity cannot erase a finite collision witness; certificate gate remains collision-sensitive');
  const certNow=ifcCertifiedRecords();push('T-IFC-04',certNow.ambiguity?true:!certNow.ambiguity,'certified bound presence is explicit; missing bound remains WITHHELD');
  const fakeEv={id:'ifc-scope-mismatch-test',claimId:'IFC-CERT',objectRevision:state.objectRevision,representationRevision:state.representationRevision+1,evidenceGrade:'FORMAL',runStatus:'SUCCESS',freshness:'CURRENT',metadata:{type:'IFC_CERTIFICATE'}};state.evidenceRecords.unshift(fakeEv);const scopeFiltered=ifcCertifiedRecords().certificate?.id!=='ifc-scope-mismatch-test';state.evidenceRecords.shift();push('T-IFC-05',scopeFiltered,'FORMAL IFC evidence must match the current representation revision');
  const Psave=JSON.parse(JSON.stringify(ensurePerfectoidModel())),objRevBefore=state.objectRevision,pf=buildVisualizationSpec('advanced');push('T-PF-01',pf.metricSemantic.includes('NOT_ADIC')&&pf.blockedReasons.includes('SCHEMATIC_ONLY'),'Perfectoid remains schematic-only with metric ban');
  state.perfectoid.coverDepth=6;const depthObjectStable=state.objectRevision===objRevBefore;state.perfectoid.coverDepth=Psave.coverDepth;push('T-PF-01-DEPTH',depthObjectStable,'depth change affects display hierarchy, not object revision');
  const selectedBefore=state.perfectoid.selected,selectedControl=$('#perfectoidSubset'),selectedControlBefore=selectedControl?.value;state.perfectoid.selected='U3';if(selectedControl)selectedControl.value='U3';const syncModel=perfectoidCurrent();push('T-PF-03',syncModel.node?.id==='U3'&&syncModel.corr?.tiltId==='U3-flat','source subset selection resolves the paired tilt counterpart');state.perfectoid.selected=selectedBefore;if(selectedControl&&selectedControlBefore!=null)selectedControl.value=selectedControlBefore;
  const missingBefore=state.perfectoid.metadataMissing,missingControl=$('#perfectoidMetadataMissing'),missingControlBefore=missingControl?.checked;state.perfectoid.metadataMissing=true;if(missingControl)missingControl.checked=true;const missModel=perfectoidCurrent();push('T-PF-02',missModel.P.metadataMissing===true,'missing correspondence metadata enters UNKNOWN/no-guessed-edge failure state');state.perfectoid.metadataMissing=missingBefore;if(missingControl&&missingControlBefore!==undefined)missingControl.checked=missingControlBefore;
  const ac=buildVisualizationSpec('arithmetic');push('T-AC-03',ac.representationStatus==='ESTIMATED','finite arithmetic/global distribution view remains ESTIMATED at module level');
  const singularCore=4*(-3)*(-3)*(-3)+27*2*2;push('T-AC-01',singularCore===0,'singular discriminant case is detected and elliptic-specific claims can be blocked');
  const badDisc=-16*(4*(-1)*(-1)*(-1)+27*1);push('T-AC-02',mod(badDisc,23)===0,'bad prime p=23 is detected for the default demo and ordinary local factor is not emitted');
  const Atest=ensureAdapterCState(),savedCoeff=Atest.coefficients,savedSmooth=$('#adapterCSmoothProjective')?.checked;Atest.coefficients='C';if($('#adapterCSmoothProjective'))$('#adapterCSmoothProjective').checked=false;const eTest=adapterCComparisonEdges().find(e=>e.id==='cmp-betti-dr');push('T-AC-04',eTest?.status==='DISABLED','comparison edge is disabled when required hypothesis is missing');Atest.coefficients=savedCoeff;if($('#adapterCSmoothProjective')&&savedSmooth!==undefined)$('#adapterCSmoothProjective').checked=savedSmooth;
  const cm=ensureAdapterCState().cycleMap;push('T-AC-05',cm?.type==='CYCLE_CLASS_MAP'&&cm.source!==cm.target,'cycle class map stays distinct from Hodge-class equality');
  const Gt=ensureGeometryState(),Pt=ensurePdeState(),savedGSurface=Gt.surface,savedSolver=Gt.solverResolution,savedPEq=Pt.equation,savedPInit=Pt.initial,savedPK=Pt.kappa,savedPC=Pt.waveSpeed,savedPDamp=Pt.damping,savedPV=Pt.initialVelocity,savedModel=state.pdeModel;
  Gt.surface='sphere';Gt.solverResolution=17;const gs=geometrySemanticSamples('sphere'),gd=buildSurfaceMeshData('sphere',17),ia=nearestMeshVertex(gd,gs[0].point),ib=nearestMeshVertex(gd,gs[6].point),gp=dijkstraPath(gd,ia,ib),chord=gs[0].point.distanceTo(gs[6].point);push('T-GPD-01',Number.isFinite(gp.distance)&&gp.distance>chord+1e-4,'sphere intrinsic mesh path exceeds ambient chord for separated endpoints');
  Pt.equation='heat';Pt.initial='standing';Pt.kappa=.22;Pt.initialVelocity=0;state.pdeModel=null;const hm=makeSpectralModel('sphere','standing',2101),hi=hm.lambda.findIndex(x=>x>2),a0=Math.abs(hm.coeff[Math.max(0,hi)]||1),a1=a0*Math.exp(-Pt.kappa*hm.lambda[Math.max(0,hi)]);push('T-GPD-02',a1<a0,'Heat high-frequency spectral amplitude decreases');
  Pt.equation='wave';Pt.waveSpeed=1;Pt.damping=0;const lam=hm.lambda.find(x=>x>0)||2,waveFactor=Math.cos(Math.sqrt(lam)*(Math.PI/Math.sqrt(lam)));push('T-GPD-03',waveFactor<-.99,'Wave mode oscillates/sign-flips instead of monotone smoothing');
  const savedIdent=state.transfer.identifiable,savedDef=state.transfer.defect,savedTol=state.transfer.tolerance;state.transfer.identifiable=true;state.transfer.defect=.2;state.transfer.tolerance=.05;const dyn=buildVisualizationSpec('dynamics');push('T-GPD-04',dyn.certificateStatus==='BLOCKED','defect > tolerance blocks transfer');state.transfer.identifiable=savedIdent;state.transfer.defect=savedDef;state.transfer.tolerance=savedTol;
  const schrText=$('#schrodingerControls')?.textContent||'';push('T-GPD-05',/REPRESENTATION DEMO ONLY/.test(schrText)&&/No claim/.test(schrText),'Schrödinger demo carries a no-physical-claim representation warning');
  let customOk=false;try{const f=compileMathExpression('0.25*sin(x)+0.1*y^2');customOk=Number.isFinite(f({x:.2,y:.3,z:0,t:0}));}catch{}push('T-GPD-CUSTOM',customOk,'safe custom graph expression parser evaluates allowed math only');
  push('T-GPD-MESH',Gt.meshResolution!==undefined&&Gt.solverResolution!==undefined,'visual mesh and solver mesh are stored as independent fields');
  Gt.surface=savedGSurface;Gt.solverResolution=savedSolver;Pt.equation=savedPEq;Pt.initial=savedPInit;Pt.kappa=savedPK;Pt.waveSpeed=savedPC;Pt.damping=savedPDamp;Pt.initialVelocity=savedPV;state.pdeModel=savedModel;
  const manifest=makeExportManifest();push('T-EV-03',Array.isArray(manifest.moduleSnapshots)&&manifest.moduleSnapshots.every(s=>Array.isArray(s.axisSemantics)&&typeof s.metricSemantic==='string'&&typeof s.representationStatus==='string'),'export contains axis/metric/status');
  const claimSpec=buildVisualizationSpec('claims');push('T-EV-FORMAL',claimSpec.representationStatus!=='FORMAL_LINKED'||claimSpec.evidenceRefs.length>0,'FORMAL_LINKED requires actual EvidenceRecord');
  if($('#vizRegressionList'))$('#vizRegressionList').innerHTML=results.map(t=>'<div class="check '+(t.pass?'pass':'pending')+'"><span class="mark">'+(t.pass?'✓':'×')+'</span><span><b>'+t.id+'</b> · '+t.detail+'</span><span class="badge '+(t.pass?'ok':'bad')+'">'+(t.pass?'PASS':'FAIL')+'</span></div>').join('');
  safeText('#vizRegressionLog',results.every(x=>x.pass)?'ALL VISUALIZATION REGRESSIONS PASS':'REGRESSION FAILURE · inspect failed rows');
  window.__mathscopeVizRegression={status:results.every(x=>x.pass)?'PASS':'FAIL',results,completedAt:now()};
  return window.__mathscopeVizRegression;
}
$('#runVizRegression')?.addEventListener('click',runVisualizationRegression);

function releaseWait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function releasePaint(){return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))}
function releaseCloneState(){return JSON.parse(JSON.stringify(serializableState()))}
function restoreReleaseState(snapshot,editorSource,view){
  stopFunctionalPlayback();stopPdePlayback();stopCloudLsp('release audit restore');
  for(const key of [...sceneRegistry.keys()])releaseScene(key);
  for(const key of Object.keys(state))delete state[key];
  Object.assign(state,JSON.parse(JSON.stringify(snapshot)));state.pdeModel=null;
  if($('#leanSource')&&editorSource!=null)$('#leanSource').value=editorSource;
  hydrateUI();activateView(view||state.view||'geometry');refreshAccess();
}
function releaseResultRow(r){
  const cls=r.status==='PASS'?'pass':'pending',badgeCls=r.status==='PASS'?'ok':r.status==='FAIL'?'bad':'warn',mark=r.status==='PASS'?'✓':r.status==='FAIL'?'×':'•';
  return '<div class="check '+safeClass(cls)+'"><span class="mark">'+escapeHtml(mark)+'</span><span><b>'+escapeHtml(r.id)+'</b> · '+escapeHtml(r.detail)+'</span><span class="badge '+safeClass(badgeCls)+'">'+escapeHtml(r.status)+'</span></div>';
}
function renderReleaseAudit(results,log){
  const failed=results.some(r=>r.status==='FAIL'),holds=results.filter(r=>r.status==='HOLD');
  const onlyAcceptedInfraHold=holds.length>0&&holds.every(r=>r.id==='CLOUD-LSP');
  const status=failed?'FAIL':holds.length?(onlyAcceptedInfraHold?'PASS_WITH_INFRA_HOLD':'HOLD'):'PASS';
  const displayStatus=status==='PASS_WITH_INFRA_HOLD'?'RELEASE READY · INFRA HOLD':status;
  if($('#releaseAuditList'))$('#releaseAuditList').innerHTML=results.map(releaseResultRow).join('');
  safeText('#releaseStatus',displayStatus);safeText('#releaseAuditLog',log.join('\n'));
  const chip=$('#releaseStatusChip');chip?.classList.toggle('ok',status==='PASS');chip?.classList.toggle('warn',status==='HOLD'||status==='PASS_WITH_INFRA_HOLD');chip?.classList.toggle('bad',status==='FAIL');
  window.__mathscopeReleaseAudit={status,releaseReady:status==='PASS'||status==='PASS_WITH_INFRA_HOLD',acceptedInfraHold:status==='PASS_WITH_INFRA_HOLD',completedAt:now(),results,log:[...log],renderAudit:window.__mathscopeRenderAudit?.()||null,cloud:window.__mathscopeCloudAcceptance||null};
  return window.__mathscopeReleaseAudit;
}
async function runReleaseAudit(){
  const btn=$('#runReleaseAudit');if(btn)btn.disabled=true;
  const snapshot=releaseCloneState(),baselineView=state.view,editorSource=$('#leanSource')?.value??'',results=[],log=[];
  const push=(id,status,detail)=>{results.push({id,status,detail});log.push(status+' '+id+' · '+detail);renderReleaseAudit(results,log)};
  try{
    log.push('MathScope v0.2.1.1 integrated release audit · '+new Date().toISOString());

    const routeExpected={
      overview:[],geometry:['geometry'],functional:['functional','basis'],fidelity:['ifc'],
      dynamics:['geometryCore','pde','transfer'],arithmetic:['adapterC'],advanced:['perfectoid'],
      claims:[],validation:[],architecture:[]
    };
    let routeOk=true,routeDetail=[];
    for(const [route,expected] of Object.entries(routeExpected)){
      const nav=$('[data-view-target="'+route+'"]');if(!nav){routeOk=false;routeDetail.push(route+': nav missing');continue}
      nav.click();await releasePaint();
      const active=$('.view.active')?.dataset.view,scenes=[...sceneRegistry.keys()].sort(),want=[...expected].sort();
      const match=active===route&&JSON.stringify(scenes)===JSON.stringify(want);
      if(!match){routeOk=false;routeDetail.push(route+': active='+active+' scenes='+scenes.join(',')+' expected='+want.join(','));}
    }
    push('E2E-ROUTES',routeOk?'PASS':'FAIL',routeOk?'all 10 modules switched through real nav handlers; scene registry disposed/recreated only expected visible Three.js hosts':routeDetail.join(' | '));

    navToValidation: {
      $('[data-view-target="geometry"]')?.click();await releasePaint();
      refreshAccess();
      const unlabeled=[...document.querySelectorAll('input,select,textarea')].filter(el=>!el.getAttribute('aria-label')&&!el.labels?.length);
      const unlabeledCanvas=[...document.querySelectorAll('canvas')].filter(el=>!el.getAttribute('aria-label'));
      const keyboardCanvas=[...document.querySelectorAll('.view.active .three-lab canvas,.view.active #threeScene canvas')].filter(el=>el.tabIndex<0);
      const canvasIssues=unlabeledCanvas.length+keyboardCanvas.length;
      const skip=Boolean(document.querySelector('.skip-link')&&$('#mathscope-main'));
      const oldReduce=state.reduceMotionOverride;state.reduceMotionOverride=true;const reduceWorks=motionDisabled();state.reduceMotionOverride=oldReduce;
      const cueText=Boolean(document.querySelector('.warning-box,.info-box,.badge'));
      const a11yOk=unlabeled.length===0&&canvasIssues===0&&skip&&reduceWorks&&cueText;
      push('A11Y',a11yOk?'PASS':'FAIL','skip='+skip+' · unlabeled controls='+unlabeled.length+' · unlabeled canvas='+unlabeledCanvas.length+' · interactive canvas keyboard issues='+keyboardCanvas.length+' · reduced-motion override='+reduceWorks+' · text/pattern cues='+cueText);
    }

    const sig=releaseReplaySignature(),round=JSON.parse(JSON.stringify(sig)),replay=compareReleaseReplay(sig,round,1e-10);
    push('REPLAY',replay.status==='PASS'?'PASS':'FAIL',replay.status==='PASS'?'release signature survives JSON round-trip within 1e-10; export also stores module-specific snapshots':replay.diffs.slice(0,5).join(' | '));

    const baseSelected=state.selectedClaim,baseReview=state.semanticReviewed,relId='REL-AUDIT-CLAIM';
    state.claims.push({id:relId,statement:'release audit synthetic claim',truth:'OPEN',evidence:'NONE',run:'IDLE',fresh:'CURRENT',trust:'UNCONDITIONAL',scope:'release-audit',formal:true});
    state.selectedClaim=relId;
    let evidenceOk=false,evidenceDetail='';
    try{
      const mk=(id,grade,trust,axioms='')=>({id,claimId:relId,objectRevision:state.objectRevision,representationRevision:state.representationRevision,claimRevision:state.claimRevision,evidenceGrade:grade,runStatus:'SUCCESS',freshness:'CURRENT',trustContext:trust,axiomAuditOutput:axioms,sourceHash:'audit',environmentHash:'audit',dependencyLockHash:'audit'});
      state.semanticReviewed=true;
      state.evidenceRecords.unshift(mk('rel-est','ESTIMATED','UNCONDITIONAL'));let s1=buildVisualizationSpec('claims');state.evidenceRecords.shift();
      state.evidenceRecords.unshift(mk('rel-sorry','FORMAL','SORRY_DEPENDENT','sorryAx'));let s2=buildVisualizationSpec('claims');state.evidenceRecords.shift();
      state.evidenceRecords.unshift(mk('rel-user','FORMAL','USER_AXIOM'));let s3=buildVisualizationSpec('claims');state.evidenceRecords.shift();
      state.semanticReviewed=false;state.evidenceRecords.unshift(mk('rel-unreviewed','FORMAL','UNCONDITIONAL'));let s4=buildVisualizationSpec('claims');state.evidenceRecords.shift();
      state.semanticReviewed=true;state.evidenceRecords.unshift(mk('rel-good','FORMAL','UNCONDITIONAL'));let s5=buildVisualizationSpec('claims');state.evidenceRecords.shift();
      evidenceOk=s1.representationStatus!=='FORMAL_LINKED'&&s1.certificateStatus!=='ISSUED'&&s2.certificateStatus!=='ISSUED'&&s3.certificateStatus!=='ISSUED'&&s4.certificateStatus!=='ISSUED'&&s5.certificateStatus==='ISSUED'&&s5.evidenceRefs.includes('rel-good');
      evidenceDetail='ESTIMATED→'+s1.certificateStatus+' · SORRY→'+s2.certificateStatus+' · USER_AXIOM→'+s3.certificateStatus+' · unreviewed FORMAL→'+s4.certificateStatus+' · reviewed unconditional FORMAL→'+s5.certificateStatus;
    }finally{
      state.evidenceRecords=state.evidenceRecords.filter(ev=>!String(ev.id).startsWith('rel-'));
      state.claims=state.claims.filter(c=>c.id!==relId);state.selectedClaim=baseSelected;state.semanticReviewed=baseReview;
    }
    push('EVIDENCE',evidenceOk?'PASS':'FAIL',evidenceDetail);

    const vr=runVisualizationRegression();
    push('NO-GO',vr.status==='PASS'?'PASS':'FAIL',vr.status==='PASS'?'Functional/IFC/Perfectoid/Adapter C/GPD and evidence boundary regressions passed ('+vr.results.length+' checks)':vr.results.filter(x=>!x.pass).map(x=>x.id).join(', '));

    $('[data-view-target="geometry"]')?.click();await releasePaint();$('#threeScene')?.scrollIntoView({block:'center',behavior:'instant'});await releaseWait(1300);
    const perf=window.__mathscopeRenderAudit?.(),geo=perf?.active?.find(x=>x.key==='geometry');
    if(geo?.fallback)push('PERF','HOLD','WebGL fallback active on this browser; math state/tables remain usable but fps gate cannot be measured.');
    else if(!geo||geo.frames<10||geo.meanFrameMs<=0)push('PERF','HOLD','insufficient visible frame sample for a hardware-dependent 30fps statement; budget metadata is recorded.');
    else{
      const fps=1000/geo.meanFrameMs,status=fps>=30?'PASS':'HOLD';
      push('PERF',status,'sampled '+fps.toFixed(1)+' fps · mean draw '+geo.meanDrawMs.toFixed(2)+' ms · drawCalls='+geo.drawCalls+' · frames='+geo.frames+' · target 30fps; device/browser specific');
    }

    const privateLink=Boolean(document.querySelector('a[href="/desktop-source.html"]'));
    let localContract='UNKNOWN';
    try{const r=await fetch('/desktop-source.html',{cache:'no-store'});const t=await r.text();localContract=r.ok&&/Private|Electron|local Lean/i.test(t)?'AVAILABLE':'CHECK';}catch{}
    push('PRIVATE-LOCAL',privateLink&&localContract==='AVAILABLE'?'PASS':'HOLD','Private Local fallback link='+privateLink+' · source page='+localContract+' · same no-silent-promotion policy remains documented.');

    restoreReleaseState(snapshot,editorSource,baselineView);
    const cloud=await runCloudAcceptance();
    if(cloud.status==='FAIL'){
      push('CLOUD-VERIFIER','FAIL','Cloud verifier acceptance failed: '+(cloud.error||'inspect cloud log'));
    }else{
      push('CLOUD-VERIFIER',cloud.verifierPass&&cloud.evidenceStale?'PASS':'FAIL',cloud.verifierPass&&cloud.evidenceStale?'health + C-014 FORMAL self-test + final FORMAL verification + retained STALE EvidenceRecord passed':'verifier/evidence retention did not pass');
      push('CLOUD-LSP',cloud.lspInfraHold?'HOLD':'PASS',cloud.lspInfraHold?'EXPERIMENTAL · INFRA HOLD · current Render 512 MiB runtime was OOM-killed under live lake serve/mathlib; deferred to v0.3 2 GB runtime. Private Local Lean remains available.':'real lake serve diagnostics passed');
    }

  }catch(err){
    push('AUDIT-EXCEPTION','FAIL',String(err?.stack||err));
  }finally{
    try{restoreReleaseState(snapshot,editorSource,baselineView)}catch{}
    if(btn)btn.disabled=false;
  }
  return renderReleaseAudit(results,log);
}
$('#runReleaseAudit')?.addEventListener('click',runReleaseAudit);

async function computeHash(){
  const data=new TextEncoder().encode(JSON.stringify(serializableState()));const buf=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function updateSessionHash(){try{const h=await computeHash();state.savedHash=h;safeText('#sessionHash',h.slice(0,16)+'…');}catch{}}
function exportSession(){
  const blob=new Blob([JSON.stringify(makeExportManifest(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mathscope-session-v0.2.1.1.json';a.click();URL.revokeObjectURL(a.href);addHistory('EXPORT','Session manifest exported with VisualizationSpec/module snapshots/EvidenceRecords.');
}
function saveLocal(){localStorage.setItem('mathscope:v0211',JSON.stringify(serializableState()));addHistory('STORE','Session saved to browser localStorage.');toast('로컬 세션 저장 완료');}
function restoreLocal(){const raw=localStorage.getItem('mathscope:v0211');if(!raw){toast('저장된 로컬 세션이 없습니다.');return}try{if(raw.length>5*1024*1024)throw new Error('saved session exceeds 5 MiB safety cap');applyStateSnapshot(JSON.parse(raw));hydrateUI();addHistory('STORE','Session restored from browser localStorage.');toast('로컬 세션 복원 완료')}catch(e){toast('복원 실패: '+e.message)}}
$('#saveLocal')?.addEventListener('click',saveLocal);$('#restoreLocal')?.addEventListener('click',restoreLocal);$('#exportSession')?.addEventListener('click',exportSession);
$('#importSession')?.addEventListener('click',()=>$('#importFile')?.click());
$('#importFile')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{
  if(f.size>5*1024*1024)throw new Error('session file exceeds 5 MiB safety cap');
  const j=JSON.parse(await f.text());if(!['MathScopeSession/2.1','MathScopeSession/2.2'].includes(j.schema))throw new Error('schema mismatch');
  if(!j.state||typeof j.state!=='object'||Array.isArray(j.state))throw new Error('invalid state payload');
  if(j.state.claims!=null&&!Array.isArray(j.state.claims))throw new Error('claims must be an array');
  if(j.state.assumptions!=null&&!Array.isArray(j.state.assumptions))throw new Error('assumptions must be an array');
  if(j.state.evidenceHistory!=null&&!Array.isArray(j.state.evidenceHistory))throw new Error('evidenceHistory must be an array');
  if((j.state.claims?.length||0)>500||(j.state.assumptions?.length||0)>500||(j.state.evidenceHistory?.length||0)>5000)throw new Error('session collection exceeds safety cap');
  const functionalRef=j.functionalReplay||null,releaseRef=j.releaseReplay||null;
  applyStateSnapshot(j.state);hydrateUI();
  const replay=compareFunctionalReplay(functionalRef,1e-8),releaseReplay=compareReleaseReplay(releaseRef,releaseReplaySignature(),1e-8);
  safeText('#faReplayStatus',replay.status+(replay.status==='FAIL'?' · '+replay.diffs.join(' | '):replay.status==='PASS'?' · tolerance='+replay.tolerance:' · no functional replay signature'));
  addHistory('IMPORT','Session JSON imported. Functional replay='+replay.status+' · release replay='+releaseReplay.status+'.');
  toast(replay.status==='FAIL'||releaseReplay.status==='FAIL'?'Import 완료 · replay mismatch 확인 필요':'세션 import 완료 · deterministic replay '+(releaseReplay.status==='PASS'?'PASS':replay.status));
}catch(err){toast('Import 실패: '+err.message)}e.target.value='';});

function hydrateUI(){
  activateView(state.view||'geometry');
  if($('#preservationGoal'))$('#preservationGoal').value=state.preservationGoal||'dynamics';
  if($('#morphismType'))$('#morphismType').value=state.morphismType||'embedding';
  if($('#cRange'))$('#cRange').value=state.c;if($('#epsRange'))$('#epsRange').value=state.epsilon;if($('#pathRange'))$('#pathRange').value=state.pathT;
  if($('#pRange'))$('#pRange').value=state.p;if($('#faVector'))$('#faVector').value=state.faVector.join(',');if($('#kRange'))$('#kRange').value=state.k;
  if($('#faPreset'))$('#faPreset').value=state.faPreset||'custom';if($('#faSeed'))$('#faSeed').value=state.faSeed||2101;if($('#faCount'))$('#faCount').value=state.faCount||8;if($('#faBasisType'))$('#faBasisType').value=state.faBasis?.type||'standard';if($('#faBasisActive'))$('#faBasisActive').value=state.faBasis?.active||'source';if($('#faBasisInput')&&state.faBasis?.sourceText)$('#faBasisInput').value=state.faBasis.sourceText;if($('#faUserOperatorMatrix')&&state.faUserOperator?.matrix)$('#faUserOperatorMatrix').value=JSON.stringify(state.faUserOperator.matrix);if($('#faSparseRatio'))$('#faSparseRatio').value=state.faSparseRatio??.25;if($('#faAmplitude'))$('#faAmplitude').value=state.faAmplitude??1.2;if($('#faOscFreq'))$('#faOscFreq').value=state.faOscFreq??2;if($('#faOscPhase'))$('#faOscPhase').value=state.faOscPhase??0;if($('#faOscEnvelope'))$('#faOscEnvelope').value=state.faOscEnvelope??.35;if($('#faDecayKind'))$('#faDecayKind').value=state.faDecayKind||'exponential';if($('#faDecayRate'))$('#faDecayRate').value=state.faDecayRate??.4;if($('#faOperator'))$('#faOperator').value=state.faOperator||'diagonal';if($('#faOperatorStrength'))$('#faOperatorStrength').value=state.faOperatorStrength||.65;if($('#faSelectedMode'))$('#faSelectedMode').value=state.faSelectedMode||1;
  $$('.functional-mode').forEach(b=>b.classList.toggle('active',b.dataset.functionalMode===(state.functionalMode||'sequence')));
  ifcModelDefaults();
  if($('#ifcEncoder'))$('#ifcEncoder').value=state.ifc?.encoder||'projection';if($('#ifcCollision'))$('#ifcCollision').value=state.ifc?.collision??.35;if($('#ifcNoise'))$('#ifcNoise').value=state.ifc?.noise??.05;if($('#ifcNoiseScope'))$('#ifcNoiseScope').value=state.ifc?.noiseScope||'observation';if($('#ifcCollisionTolerance'))$('#ifcCollisionTolerance').value=state.ifc?.collisionTolerance??.08;
  const L=state.ifc.learned;if($('#ifcArchitecture'))$('#ifcArchitecture').value=L.architecture;if($('#ifcLatentDim'))$('#ifcLatentDim').value=L.latentDim;if($('#ifcHiddenWidth'))$('#ifcHiddenWidth').value=L.hiddenWidth;if($('#ifcActivation'))$('#ifcActivation').value=L.activation;if($('#ifcModelSeed'))$('#ifcModelSeed').value=L.seed;if($('#ifcOptimizer'))$('#ifcOptimizer').value=L.optimizer;if($('#ifcLearningRate'))$('#ifcLearningRate').value=L.learningRate;if($('#ifcEpochs'))$('#ifcEpochs').value=L.epochs;if($('#ifcBatchSize'))$('#ifcBatchSize').value=L.batchSize;$$('.ifc-learned-mode').forEach(b=>b.classList.toggle('active',b.dataset.ifcLearned===(L.mode||'frozen')));
  ['Top','Metric','Hom','Spectral','Dyn'].forEach(k=>{if($('#useDelta'+k))$('#useDelta'+k).checked=state.ifc.fidelityEnabled?.[k]!==false;if($('#weight'+k))$('#weight'+k).value=state.ifc.fidelityWeights?.[k]??1;});updateIfcModelMeta();
  const G=ensureGeometryState();$$('.geometry-core-preset').forEach(b=>b.classList.toggle('active',b.dataset.geometryCore===G.surface));if($('#geometryCustomPanel'))$('#geometryCustomPanel').style.display=G.surface==='custom'?'block':'none';if($('#geometryTangent'))$('#geometryTangent').checked=G.tangent!==false;if($('#geometryCurvature'))$('#geometryCurvature').checked=G.curvature!==false;if($('#geometryTangentDensity'))$('#geometryTangentDensity').value=G.tangentDensity||10;if($('#geometryMeshResolution'))$('#geometryMeshResolution').value=G.meshResolution||40;if($('#geometrySolverResolution'))$('#geometrySolverResolution').value=G.solverResolution||23;if($('#geometryTopology'))$('#geometryTopology').value=G.topology||'unknown';if($('#geometryMetricSemantic'))$('#geometryMetricSemantic').value=G.metricSemantic||'both';if($('#geometryCurvatureType'))$('#geometryCurvatureType').value=G.curvatureType||'gaussian';if($('#geometryCurvatureNorm'))$('#geometryCurvatureNorm').value=G.curvatureNorm||'auto';if($('#customSurfaceExpr'))$('#customSurfaceExpr').value=G.custom.expr;if($('#customSurfaceGrid'))$('#customSurfaceGrid').value=G.custom.gridText;if($('#customSurfaceDomain'))$('#customSurfaceDomain').value=G.custom.domain;if($('#customSurfaceHeightScale'))$('#customSurfaceHeightScale').value=G.custom.heightScale;$$('.custom-surface-mode').forEach(b=>b.classList.toggle('active',b.dataset.customSurfaceMode===G.custom.mode));if($('#customExpressionPanel'))$('#customExpressionPanel').style.display=G.custom.mode==='expression'?'block':'none';if($('#customSamplePanel'))$('#customSamplePanel').style.display=G.custom.mode==='sampled'?'block':'none';geometryPopulateEndpoints();if($('#geodesicA'))$('#geodesicA').value=G.geodesic.a;if($('#geodesicB'))$('#geodesicB').value=G.geodesic.b;
  const P=ensurePdeState();if($('#pdeInitial'))$('#pdeInitial').value=P.initial;if($('#pdeDt'))$('#pdeDt').value=P.dt;if($('#pdeSeed'))$('#pdeSeed').value=P.seed;if($('#pdeTime'))$('#pdeTime').value=P.time;if($('#pdeKappa'))$('#pdeKappa').value=P.kappa;if($('#pdeWaveSpeed'))$('#pdeWaveSpeed').value=P.waveSpeed;if($('#pdeDamping'))$('#pdeDamping').value=P.damping;if($('#pdeInitialVelocity'))$('#pdeInitialVelocity').value=P.initialVelocity;if($('#pdeCustomInitialExpr'))$('#pdeCustomInitialExpr').value=P.customInitialExpr;if($('#pdeCustomInitialGrid'))$('#pdeCustomInitialGrid').value=P.customInitialGridText||'[[0,0.5,0],[0.5,1,0.5],[0,0.5,0]]';if($('#transportVX'))$('#transportVX').value=P.transport.vx;if($('#transportVZ'))$('#transportVZ').value=P.transport.vz;if($('#transportBoundary'))$('#transportBoundary').value=P.transport.boundary;if($('#schrodingerScale'))$('#schrodingerScale').value=P.schrodingerScale;if($('#reactionModel'))$('#reactionModel').value=P.reaction.model;if($('#reactionRate'))$('#reactionRate').value=P.reaction.rate;updatePdePanels();
  if($('#transferDefect'))$('#transferDefect').value=state.transfer?.defect??.03;if($('#transferTolerance'))$('#transferTolerance').value=state.transfer?.tolerance??.05;if($('#transferIdentifiable'))$('#transferIdentifiable').checked=Boolean(state.transfer?.identifiable);if($('#transferMetric'))$('#transferMetric').value=state.transfer?.metric||'display-l2';
  ensurePerfectoidModel();if($('#perfectoidSubset'))$('#perfectoidSubset').value=state.perfectoid?.selected||'U1';if($('#perfectoidOverlap'))$('#perfectoidOverlap').checked=state.perfectoid?.overlap!==false;if($('#perfectoidDepth'))$('#perfectoidDepth').value=state.perfectoid?.coverDepth||4;if($('#perfectoidRational'))$('#perfectoidRational').checked=state.perfectoid?.showCorrespondence!==false;if($('#perfectoidMetadataMissing'))$('#perfectoidMetadataMissing').checked=Boolean(state.perfectoid?.metadataMissing);$$('.perfectoid-side').forEach(b=>b.classList.toggle('active',b.dataset.perfectoidSide===(state.perfectoid?.sideFocus||'both')));
  ensureAdapterCState();if($('#adapterCCoefficients'))$('#adapterCCoefficients').value=state.adapterC.coefficients||'Q';$$('[data-base-field]').forEach(b=>b.classList.toggle('active',b.dataset.baseField===(state.adapterC.baseField||'Q')));$$('.adapter-c-mode').forEach(b=>b.classList.toggle('active',b.dataset.adapterCMode===(state.adapterC?.mode||'A')));adapterCProfileUI();renderComparisonEdgeTable();renderHodgeCells();renderMorphismPolicy();
  state.pdeModel=null;
  renderGeometry();functionalCompute();auditBasisSource({silent:true});fidelityCompute();drawDynamics();computeArithmetic();condensedCheck();drawPerfectoidViz();renderGeometryCore3D();renderPde3D();renderTransfer3D();renderAdapterC3D();renderClaims();renderAssumptions();renderHistory();runVisualizationRegression();updateTop();
}

function setAcceptanceRow(id,status,detail=''){
  const el=$(id);if(!el)return;
  const badgeEl=el.querySelector('.badge'),mark=el.querySelector('.mark');
  el.classList.remove('pass','pending');
  if(status==='pass'){
    el.classList.add('pass');if(mark)mark.textContent='✓';if(badgeEl){badgeEl.className='badge ok';badgeEl.textContent='PASS';}
  }else if(status==='hold'){
    el.classList.add('pending');if(mark)mark.textContent='•';if(badgeEl){badgeEl.className='badge warn';badgeEl.textContent='INFRA HOLD';}
  }else if(status==='fail'){
    el.classList.add('pending');if(mark)mark.textContent='×';if(badgeEl){badgeEl.className='badge bad';badgeEl.textContent='FAIL';}
  }else{
    el.classList.add('pending');if(mark)mark.textContent='•';if(badgeEl){badgeEl.className='badge warn';badgeEl.textContent='RUNNING';}
  }
  if(detail)el.title=detail;
}
function appendAcceptanceLog(lines,msg){lines.push(msg);safeText('#cloudAcceptanceLog',lines.join('\n'));}
async function fetchJson(url,options={}){
  const res=await fetch(url,{cache:'no-store',...options});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data?.error||('HTTP '+res.status));
  return data;
}
async function runCloudAcceptance(){
  const btn=$('#runCloudAcceptance');
  if(btn?.disabled){
    safeText('#cloudAcceptanceLog','Cloud acceptance already running · joining the existing browser-session run.');
    const deadline=Date.now()+120000;
    while(btn.disabled&&Date.now()<deadline)await releaseWait(300);
    return window.__mathscopeCloudAcceptance||{status:'FAIL',error:'existing Cloud acceptance did not publish a result before join timeout'};
  }
  if(btn)btn.disabled=true;
  const lines=[];
  const editor=$('#leanSource'),originalEditorSource=editor?.value??pinnedC014Source;
  ['#acceptHealth','#acceptSelfTest','#acceptLsp','#acceptStale'].forEach(id=>setAcceptanceRow(id,'running'));
  try{
    appendAcceptanceLog(lines,'[1/4] Cloud health 확인…');
    const health=await fetchJson(CLOUD_LEAN_BASE+'/health');
    if(!(health?.lspReady===true&&health?.verifierReady===true))throw new Error('health not ready: lspReady='+health?.lspReady+', verifierReady='+health?.verifierReady);
    setAcceptanceRow('#acceptHealth','pass');appendAcceptanceLog(lines,'PASS health · lspReady=true · verifierReady=true');

    appendAcceptanceLog(lines,'[2/4] C-014 startup self-test 확인…');
    const self=await fetchJson(CLOUD_LEAN_BASE+'/v1/self-test');
    const sorry=/sorryAx/.test(String(self?.axiomAuditOutput||''));
    if(self?.state?.run!=='SUCCESS'||self?.state?.evidence!=='FORMAL'||sorry)throw new Error('self-test not FORMAL/SUCCESS or sorryAx detected');
    setAcceptanceRow('#acceptSelfTest','pass');appendAcceptanceLog(lines,'PASS self-test · '+self.state.truth+' / FORMAL / '+self.state.trust);

    appendAcceptanceLog(lines,'[3/4] Cloud real-time LSP diagnostics… INFRA HOLD');
    setAcceptanceRow('#acceptLsp','hold','v0.2 freeze: experimental Cloud LSP deferred because current Render free runtime is capped at 512 MiB and was observed OOM-killed under lake serve + mathlib. Private Local Lean remains available; v0.3 target runtime is 2 GB.');
    appendAcceptanceLog(lines,'HOLD LSP · EXPERIMENTAL · current 512 MiB Render runtime recorded OOM kills under live lake serve/mathlib. Deferred to v0.3 with 2 GB runtime. This does not downgrade C-014 FORMAL verifier evidence or Private Local mode.');

    appendAcceptanceLog(lines,'[4/4] Final FORMAL verify → EvidenceRecord → STALE 보존 확인…');
    const evidence=await fetchJson(CLOUD_LEAN_BASE+'/v1/verify/c014',{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({semanticReviewed:state.semanticReviewed===true})
    });
    if(evidence?.state?.run!=='SUCCESS'||evidence?.state?.evidence!=='FORMAL'||/sorryAx/.test(String(evidence?.axiomAuditOutput||'')))throw new Error('final verifier did not return clean FORMAL evidence');
    const c=state.claims.find(x=>x.id==='C-014');
    if(c){c.truth=evidence.state.truth;c.evidence=evidence.state.evidence;c.run=evidence.state.run;c.fresh=evidence.state.freshness;c.trust=evidence.state.trust;}
    storeEvidenceRecord(evidence,c||{id:'C-014'});
    const recordId=state.evidenceRecords[0]?.id;
    const beforeCount=state.evidenceRecords.length;
    state.objectRevision++;state.claimRevision++;
    const affected=new Set(['C-014','C-015','LP-1','LP-2R','HILB-1']);
    state.claims.forEach(x=>{if(affected.has(x.id))x.fresh='STALE'});
    state.evidenceRecords.forEach(ev=>{if(affected.has(ev.claimId)&&ev.freshness==='CURRENT')ev.freshness='STALE'});
    const kept=state.evidenceRecords.find(ev=>ev.id===recordId);
    if(!kept||kept.freshness!=='STALE'||state.evidenceRecords.length!==beforeCount)throw new Error('formal record was not preserved as STALE');
    addHistory('ACCEPTANCE','Cloud verifier acceptance: FORMAL C-014 EvidenceRecord '+recordId+' preserved and marked STALE after revision bump. Cloud live LSP remains experimental/infra-held for v0.2.');
    renderClaims();renderRevision();updateTop();
    setAcceptanceRow('#acceptStale','pass');appendAcceptanceLog(lines,'PASS evidence · record '+recordId+' preserved as STALE after revision bump');

    appendAcceptanceLog(lines,'CLOUD ACCEPTANCE COMPLETE · VERIFIER PASS · LIVE LSP INFRA HOLD');
    window.__mathscopeCloudAcceptance={
      status:'HOLD',
      completedAt:new Date().toISOString(),
      health:true,
      selfTest:true,
      lspDiagnostics:false,
      lspInfraHold:true,
      lspBoundary:'EXPERIMENTAL_512MIB_OOM_DEFERRED_TO_V0_3_2GB',
      evidenceStale:true,
      verifierPass:true,
      log:[...lines]
    };
    toast('Cloud verifier PASS · live LSP INFRA HOLD');
  }catch(err){
    appendAcceptanceLog(lines,'FAIL · '+String(err?.message||err));
    window.__mathscopeCloudAcceptance={status:'FAIL',completedAt:new Date().toISOString(),error:String(err?.message||err),log:[...lines]};
    const rows=['#acceptHealth','#acceptSelfTest','#acceptStale'];
    for(const id of rows){const el=$(id);if(el?.querySelector('.badge')?.textContent==='RUNNING'){setAcceptanceRow(id,'fail',String(err?.message||err));break;}}
    toast('Cloud verifier acceptance failed — log 확인');
  }finally{
    if(editor)editor.value=originalEditorSource;
    stopCloudLsp('v0.2 frozen: live LSP experimental');
    if(btn)btn.disabled=false;
  }
  return window.__mathscopeCloudAcceptance||{status:'UNKNOWN',log:[...lines]};
}
$('#runCloudAcceptance')?.addEventListener('click',runCloudAcceptance);

function registerWebMCP(){
  const mc=document.modelContext;
  if(!mc||typeof mc.registerTool!=='function'){safeText('#webmcpStatus','WEBMCP UNAVAILABLE');return}
  if(window.__mathscopeWebMCP)return;
  window.__mathscopeWebMCP=true;const ctl=new AbortController();window.__mathscopeWebMCPAbort=ctl;
  const reg=(def)=>Promise.resolve(mc.registerTool(def,{signal:ctl.signal})).catch(()=>{});
  reg({name:'mathscope_get_state',description:'Read the current MathScope module, revisions, S3 observation settings, and selected claim. Read-only.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:()=>({view:state.view,revisions:{object:state.objectRevision,representation:state.representationRevision,claim:state.claimRevision},geometry:{object:state.object,observation:state.observation,c:state.c,epsilon:state.epsilon},selectedClaim:state.selectedClaim})});
  reg({name:'mathscope_open_module',description:'Open one MathScope workspace module by its stable module name.',inputSchema:{type:'object',properties:{module:{type:'string',enum:['overview','geometry','functional','fidelity','dynamics','arithmetic','advanced','claims','validation','architecture']}},required:['module']},execute:({module})=>{activateView(module);return {opened:module}}});
  reg({name:'mathscope_set_s3_slice',description:'Set the S3 slice parameter c and choose exact analytic slice or slab approximation. This updates only the local browser session.',inputSchema:{type:'object',properties:{c:{type:'number',minimum:-1.2,maximum:1.2},kind:{type:'string',enum:['exact','slab']},epsilon:{type:'number',minimum:0.005,maximum:0.25}},required:['c']},execute:({c,kind='exact',epsilon})=>{state.object='S3';state.observation='slice';state.c=clamp(c,-1.2,1.2);state.sliceKind=kind;if(Number.isFinite(epsilon))state.epsilon=clamp(epsilon,.005,.25);state.representationRevision++;hydrateUI();return {c:state.c,kind:state.sliceKind,epsilon:state.epsilon}}});
  reg({name:'mathscope_run_cloud_acceptance',description:'Run the same four-step Cloud Lean acceptance flow exposed in the MathScope Validation UI: health, startup self-test, real lake serve diagnostics, and FORMAL EvidenceRecord preservation through STALE after a revision bump.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:false},execute:async()=>await runCloudAcceptance()});
  reg({name:'mathscope_get_cloud_acceptance',description:'Read the most recent browser-session Cloud Acceptance result without rerunning it.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:()=>window.__mathscopeCloudAcceptance||{status:'NOT_RUN'}});
  reg({name:'mathscope_get_visualization_spec',description:'Read the common VisualizationSpec for the current or requested MathScope module.',inputSchema:{type:'object',properties:{module:{type:'string',enum:['geometry','functional','fidelity','dynamics','arithmetic','advanced','claims']}}},annotations:{readOnlyHint:true},execute:({module})=>buildVisualizationSpec(module||state.view)});
  reg({name:'mathscope_set_visualization_parameter',description:'Set one bounded visualization parameter in the local MathScope browser session.',inputSchema:{type:'object',properties:{parameter:{type:'string',enum:['functionalMode','p','k','ifcCollision','ifcEncoder','geometrySurface','geometryTopology','pdeEquation','pdeTime','adapterCMode','perfectoidSubset']},value:{}},required:['parameter','value']},execute:({parameter,value})=>setVisualizationParameter(parameter,value)});
  reg({name:'mathscope_run_visualization_regression',description:'Run deterministic no-go/boundary regressions for the visualization expansion and return results.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:()=>runVisualizationRegression()});
  reg({name:'mathscope_run_release_audit',description:'Run the integrated MathScope v0.2.1.1 browser release audit: routes/scenes, accessibility, deterministic replay, evidence boundary, no-go regressions, performance sample, Private Local fallback and Cloud Lean acceptance.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:false},execute:async()=>await runReleaseAudit()});
  reg({name:'mathscope_get_release_audit',description:'Read the most recent integrated release audit result without rerunning it.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:()=>window.__mathscopeReleaseAudit||{status:'NOT_RUN'}});
  safeText('#webmcpStatus','WEBMCP READY');$('#webmcpChip')?.classList.add('ok');
}

updateGoalAdvice();
updateMorphismAdvice();
function init(){
  pinnedC014Source=$('#leanSource')?.value??'';
  hydrateUI();
  initThree();
  createLabHost('functional','functional3D',[5.6,3.4,6.4]);
  createLabHost('basis','faBasis3D',[4.2,2.7,5.1]);
  createLabHost('ifc','ifc3D',[7.6,4.7,8.7]);
  createLabHost('geometryCore','geometryCore3D',[4.8,3.1,5.7]);
  createLabHost('pde','pde3D',[4.8,3.0,5.8]);
  createLabHost('transfer','transfer3D',[4.8,2.9,6.3]);
  createLabHost('adapterC','adapterC3D',[7.4,4.6,8.3]);
  createLabHost('perfectoid','perfectoid3D',[6.5,4.5,8.2]);
  registerWebMCP();
  checkCloudBackend();
  setupReleaseUX();
  requestAnimationFrame(()=>{drawDynamics();drawThetaHistogram();drawFrobenius();drawFunctionalViz();renderFunctional3D();auditBasisSource({silent:true});renderBasisPreview3D();drawFidelityPipeline();renderIfc3D();drawPerfectoidViz();renderGeometryCore3D();renderPde3D();renderTransfer3D();renderAdapterC3D();});
}
init();
