import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {runJob} from '../../mathscope-m2/arithmetic/index.mjs';
import {buildM2ComparisonDiagram} from '../p8/comparison.mjs';

const source=await fs.readFile(new URL('../web/p8-visualization.js',import.meta.url),'utf8');
const modelContext={window:{}};
vm.runInNewContext(await fs.readFile(new URL('../web/p8-visual-models.js',import.meta.url),'utf8'),modelContext);
const plain=x=>JSON.parse(JSON.stringify(x));
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};

// This runs the actual mounted renderer with a recording Canvas2D context. The
// unavailable dynamic import exercises its real fallback branch, not a copied
// projection implementation. Browser visual acceptance is recorded separately.
function harness({canvasAvailable=true}={}){
  class Target{
    handlers=new Map();
    addEventListener(name,fn,{signal}={}){const list=this.handlers.get(name)||[];list.push({fn,signal});this.handlers.set(name,list);}
    emit(name,props={}){const e={button:0,pointerId:1,isPrimary:true,pointerType:'mouse',clientX:0,clientY:0,preventDefault(){this.prevented=true;},...props};for(const {fn,signal}of this.handlers.get(name)||[])if(!signal?.aborted)fn(e);return e;}
  }
  class Element extends Target{
    constructor(tag='div'){super();this.tag=tag;this.children=[];this.style={};this.dataset={};this.textContent='';this.value='';this.hidden=false;this.isConnected=true;this.offsetWidth=90;this.offsetHeight=22;this.clientWidth=800;this.clientHeight=400;this.captured=new Set();this.scale=1;this.attrs={};}
    append(child){child.parent=this;this.children.push(child);}
    replaceChildren(...children){for(const child of this.children)child.parent=null;this.children=[];children.forEach(c=>this.append(c));}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;this.isConnected=false;}
    setAttribute(name,value){this.attrs[name]=value;}
    querySelectorAll(tag){return this.children.flatMap(c=>[...(c.tag===tag?[c]:[]),...c.querySelectorAll(tag)]);}
    getBoundingClientRect(){return{left:20,top:40,width:(parseFloat(this.style.width)||this.clientWidth)*this.scale,height:(parseFloat(this.style.height)||this.clientHeight)*this.scale};}
    setPointerCapture(id){this.captured.add(id);}
    hasPointerCapture(id){return this.captured.has(id);}
    releasePointerCapture(id){this.captured.delete(id);this.emit('lostpointercapture',{pointerId:id});}
    getContext(kind){if(kind!=='2d'||!canvasAvailable)return null;if(!this.context){const c={calls:[],path:[],dash:[]};
      for(const name of ['setTransform','clearRect','fillRect','save','rect','clip','restore'])c[name]=(...args)=>{if(name==='clearRect')c.calls=[];c.calls.push({name,args});};
      c.beginPath=()=>{c.path=[];};c.moveTo=(...args)=>c.path.push({name:'moveTo',args});c.lineTo=(...args)=>c.path.push({name:'lineTo',args});c.arc=(...args)=>c.path.push({name:'arc',args});c.setLineDash=v=>{c.dash=v.slice();};
      c.stroke=()=>c.calls.push({name:'stroke',path:plain(c.path),color:c.strokeStyle,dash:plain(c.dash)});c.fill=()=>c.calls.push({name:'fill',path:plain(c.path),color:c.fillStyle});this.context=c;
    }return this.context;}
  }
  class Controller{signal={aborted:false};abort(){this.signal.aborted=true;}}
  const frames=new Map(),observers={io:[],mo:[],ro:[]};let frameId=0;
  const observer=kind=>class{constructor(fn){this.fn=fn;this.disconnected=false;observers[kind].push(this);}observe(){}disconnect(){this.disconnected=true;}trigger(value){if(!this.disconnected)this.fn(value);}};
  const document=new Target();document.hidden=false;document.createElement=tag=>new Element(tag);
  const window=new Target(),keys=['canvas','scene','labels','fallback','lod','select','axes','detail','audit','render-note'],els=Object.fromEntries(keys.map(k=>[k,new Element()]));els.lod.value='200';
  const buttons=Object.fromEntries(['reset','in','out','retry'].map(action=>{const b=new Element('button');b.dataset.p8Camera=action;return[action,b];}));
  const view={active:true,classList:{contains(){return view.active;}}},host=new Element();host.closest=()=>view;host.querySelector=selector=>els[selector.match(/data-p8v="([^"]+)"/)[1]];host.querySelectorAll=()=>Object.values(buttons);
  const context={window,document,AbortController:Controller,IntersectionObserver:observer('io'),MutationObserver:observer('mo'),ResizeObserver:observer('ro'),devicePixelRatio:3,matchMedia:()=>({matches:true}),requestAnimationFrame(fn){const id=++frameId;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);}};
  vm.runInNewContext(source,context,{timeout:2000});const api=window.MathScopeP8Visualization.mount(host);
  const flush=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());};
  const settle=async()=>{await new Promise(setImmediate);flush();};
  const visibility=visible=>observers.io[0].trigger([{isIntersecting:visible}]);visibility(true);
  return{api,els,buttons,frames,observers,window,document,view,context,flush,settle,visibility,canvas:()=>els.canvas.children[0],route(active){view.active=active;observers.mo[0].trigger();},resize(width,height){els.scene.clientWidth=width;els.scene.clientHeight=height;observers.ro.at(-1).trigger();},audit:()=>plain(api.audit()),detail:()=>JSON.parse(els.detail.textContent)};
}

const point=(id,position)=>({id,label:'exact '+id,position,role:'data',exact:{testFixture:id},source:{fieldPath:'points.'+id,recordSHA256:'synthetic-renderer-test-only'}});
const fixture=(points=[point('a',[0,0,0])],lines=[])=>({schema:'MathScope.M3.P8.VisualModel/1',view:'renderer-test',axes:[0,1,2].map(i=>({label:'axis '+i,type:'test',unit:''})),points,lines,provenance:[{recordSHA256:'synthetic-renderer-test-only'}],certificateIssued:false,formalComplete:false});
const click=(canvas,x,y,props={})=>{const r=canvas.getBoundingClientRect(),e={clientX:r.left+x*canvas.scale,clientY:r.top+y*canvas.scale,...props};canvas.emit('pointerdown',e);canvas.emit('pointerup',e);};
const arcs=h=>h.canvas().context.calls.filter(c=>c.name==='fill').flatMap(c=>c.path.filter(p=>p.name==='arc'));

test('actual inherited data for all four views and the typed diagram render without WebGL and retain exact sources',async()=>{
  const request=(kind,input)=>({kind,input,precision:{N:4},budget:{}});
  const actual={projective:await runJob(request('arithmetic.projective',{p:'3',n:2,m:1})),ordinary:await runJob(request('arithmetic.elliptic',{p:'5',m:1})),tower:await runJob(request('arithmetic.perfectoidTower',{p:'3',M:4,V:8}))};
  const h=harness();
  for(const [name,view]of [['projective','degree-basis-valuation'],['ordinary','hodge-newton'],['projective','prime-degree-frobenius'],['tower','refinement-tower'],['projective','comparison-diagram']]){
    const record={schema:'MathScope.M3.P8.Execution/1',request:{kind:'p8.visual_structure',input:{view}},execution:{status:'COMPLETED'},scope:{wholeM3Complete:false,wholeP8Complete:false},result:{inheritedM2:actual[name]},sourceBinding:{testHarness:'actual M2 result; test display envelope is not an execution receipt'},recordSHA256:'test-envelope-'+view};
    if(view==='comparison-diagram'){record.request.kind='p8.comparison';record.result={diagram:await buildM2ComparisonDiagram(request('arithmetic.comparison',{operation:'perfectPrism',p:'3',target:'etale'}))};}
    const model=freeze(modelContext.window.MathScopeP8VisualModels.build({record,view})),before=JSON.stringify(model);assert.equal(h.api.setModel(model).ok,true);await h.settle();
    const audit=h.audit();assert.equal(audit.renderer,'CANVAS2D');assert.equal(audit.state,'READY');assert.equal(audit.currentModelRendered,true);assert.equal(audit.canvasCount,1);assert.equal(audit.displayedPoints,model.points.length);assert.equal(audit.displayedLines,model.lines.length);assert.ok(arcs(h).length>0,view);assert.ok(arcs(h).every(a=>a.args.every(Number.isFinite)));
    h.els.select.value='0';h.els.select.emit('change');assert.deepEqual(h.detail().exact,plain(model.points[0].exact));assert.deepEqual(h.detail().source,plain(model.points[0].source));
    h.canvas().emit('keydown',{key:'ArrowRight'});h.buttons.in.emit('click');h.els.lod.value='1000';h.els.lod.emit('change');await h.settle();
    assert.equal(JSON.stringify(model),before);assert.equal(h.audit().sourceRecord,record.recordSHA256);assert.equal(h.audit().certificateIssued,false);assert.equal(h.audit().formalComplete,false);
  }h.api.dispose();
});

test('per-axis normalization, orthographic projection and hit coordinates agree with the drawn source point',async()=>{
  const h=harness(),m=freeze(fixture([point('lo',[-2,7,0]),point('mid',[4,7,2]),point('hi',[10,7,4])]));h.api.setModel(m);await h.settle();
  const positions=arcs(h).map(p=>p.args.slice(0,2)),camera=h.audit().camera,[x,y,z]=camera.position,r=Math.hypot(x,y,z),theta=Math.atan2(x,z),phi=Math.acos(y/r);
  // Independent yaw/pitch form of the orthographic view matrix; the constant Y
  // domain maps to zero instead of inventing variation or dividing by zero.
  const expected=[-1.6,0,1.6].map(v=>[400+(Math.cos(theta)*v-Math.sin(theta)*v)*400/6,200-(-Math.cos(phi)*Math.sin(theta)*v-Math.cos(phi)*Math.cos(theta)*v)*200/3]);
  for(const p of expected)assert.ok(positions.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<1e-9));
  h.canvas().scale=.5;click(h.canvas(),400,200);assert.equal(h.audit().selectedId,'mid');assert.deepEqual(h.detail().displayCoordinates,[4,7,2]);assert.deepEqual(h.detail().source,plain(m.points[1].source));assert.equal(h.canvas().captured.size,0);
  const c=h.canvas();assert.equal(c.width,1200);assert.equal(c.height,600);assert.equal(h.audit().pixelRatio,1.5);assert.equal(c.style.touchAction,'pan-y pinch-zoom');assert.equal(c.handlers.has('wheel'),false);
  h.resize(360,330);await h.settle();assert.equal(c.width,540);assert.equal(c.height,495);assert.equal(h.audit().currentModelRendered,true);assert.ok(arcs(h).some(p=>Math.hypot(p.args[0]-180,p.args[1]-165)<1e-9));h.api.dispose();
});

test('directed and open edges use actual segment topology, dashed display and source-bound picking',async()=>{
  const edge={id:'map',label:'exact map',vertices:[[-2,0,0],[2,0,0]],role:'open',directed:true,exact:{operation:'test map',requiredAssumptionRefs:['test-assumption']},source:{fieldPath:'diagram.edges.0',recordSHA256:'synthetic-renderer-test-only'}};
  const h=harness(),m=freeze(fixture([], [edge]));h.api.setModel(m);await h.settle();
  const edgeStroke=h.canvas().context.calls.find(c=>c.name==='stroke'&&c.color==='#e9bc77'&&c.dash.length);assert.deepEqual(edgeStroke.dash,[6,4]);assert.equal(edgeStroke.path.length,2);assert.ok(h.canvas().context.calls.some(c=>c.name==='stroke'&&c.color==='#e9bc77'&&c.path.length===3));
  click(h.canvas(),400,200,{pointerType:'touch'});assert.equal(h.audit().selectedId,'map');assert.deepEqual(h.detail().exact,plain(edge.exact));assert.deepEqual(h.detail().displayCoordinates,plain(edge.vertices));assert.equal(h.audit().displayedLines,1);h.api.dispose();
});

test('200/1000 point and 200 line limits do not remove hidden entries or promote display authority',async()=>{
  const points=Array.from({length:1201},(_,i)=>point(String(i),[i,Math.sin(i),i%17])),lines=Array.from({length:230},(_,i)=>({id:'edge'+i,label:'edge '+i,vertices:[[i,0,0],[i+1,1,1]],exact:{testFixture:i},source:{fieldPath:'lines.'+i}}));
  const m=freeze(fixture(points,lines)),before=JSON.stringify(m),h=harness();h.api.setModel(m);await h.settle();assert.equal(h.audit().displayedPoints,200);assert.equal(h.audit().displayedLines,200);assert.equal(h.els.select.children.length,1432);
  h.els.select.value='1001';h.els.select.emit('change');assert.equal(h.audit().selectedId,'1001');assert.deepEqual(h.detail().exact,{testFixture:'1001'});
  h.els.lod.value='1000';h.els.lod.emit('change');await h.settle();assert.equal(h.audit().displayedPoints,1000);assert.equal(h.audit().lod,1000);assert.equal(h.audit().selectedId,'1001');assert.deepEqual(h.detail().source,plain(points[1001].source));assert.equal(JSON.stringify(m),before);h.api.dispose();
});

test('keyboard, drag, cancellation and reset change camera only and coalesce rendering into one frame',async()=>{
  const m=freeze(fixture([point('first',[0,0,0]),point('second',[1,2,3])])),before=JSON.stringify(m),h=harness();h.api.setModel(m);await h.settle();const initial=h.audit().camera,c=h.canvas();
  assert.equal(c.tabIndex,0);assert.equal(c.attrs.role,'img');assert.ok(c.attrs['aria-label'].includes('방향키'));
  c.emit('keydown',{key:'ArrowLeft'});c.emit('keydown',{key:'ArrowDown'});c.emit('keydown',{key:'+'});assert.equal(h.frames.size,1);assert.notDeepEqual(h.audit().camera.position,initial.position);assert.equal(h.audit().camera.zoom,1.2);c.emit('keydown',{key:']'});assert.equal(h.audit().selectedId,'first');c.emit('keydown',{key:']'});assert.equal(h.audit().selectedId,'second');await h.settle();
  c.emit('pointerdown',{clientX:100,clientY:100});c.emit('pointermove',{clientX:150,clientY:120});const afterDrag=h.audit().camera;c.emit('pointercancel');c.emit('pointermove',{clientX:200,clientY:180});assert.deepEqual(h.audit().camera,afterDrag);c.emit('pointerup',{clientX:200,clientY:180});assert.equal(h.audit().selectedId,'second');
  c.emit('keydown',{key:'Home'});await h.settle();assert.deepEqual(h.audit().camera,initial);assert.equal(JSON.stringify(m),before);assert.equal(h.frames.size,0);assert.equal(h.audit().continuousAnimation,false);h.api.dispose();
});

test('inactive routes release the single canvas and restore camera without claiming an unpainted frame',async()=>{
  const h=harness();h.api.setModel(fixture());await h.settle();h.canvas().emit('keydown',{key:'ArrowUp'});await h.settle();const camera=h.audit().camera,frames=h.audit().frames;
  h.route(false);assert.equal(h.audit().canvasCount,0);assert.equal(h.audit().currentModelRendered,false);assert.equal(h.audit().camera,null);assert.equal(h.frames.size,0);assert.ok(h.observers.ro[0].disconnected);
  h.route(true);assert.equal(h.audit().currentModelRendered,false);await h.settle();assert.equal(h.audit().canvasCount,1);assert.equal(h.audit().currentModelRendered,true);assert.deepEqual(h.audit().camera,camera);assert.equal(h.audit().frames,frames+1);
  h.document.hidden=true;h.document.emit('visibilitychange');h.buttons.in.emit('click');assert.equal(h.frames.size,0);h.document.hidden=false;h.document.emit('visibilitychange');await h.settle();
  h.visibility(false);h.buttons.in.emit('click');assert.equal(h.frames.size,0);h.visibility(true);await h.settle();h.buttons.in.emit('click');assert.equal(h.frames.size,1);h.api.dispose();assert.equal(h.frames.size,0);assert.equal(h.audit().canvasCount,0);assert.equal(h.audit().state,'DISPOSED');assert.ok(h.observers.io.every(o=>o.disconnected));assert.ok(h.observers.mo.every(o=>o.disconnected));assert.ok(h.observers.ro.every(o=>o.disconnected));h.flush();assert.equal(h.audit().currentModelRendered,false);
});

test('unavailable Canvas2D and empty or invalid display inputs keep exact HTML data without false readiness',async()=>{
  const h=harness({canvasAvailable:false});h.api.setModel(fixture());await h.settle();assert.equal(h.audit().renderer,null);assert.equal(h.audit().currentModelRendered,false);assert.equal(h.audit().canvasCount,0);h.els.select.value='0';h.els.select.emit('change');assert.deepEqual(h.detail().exact,{testFixture:'a'});h.api.dispose();
  const b=harness();b.api.setModel(fixture([point('nan',[NaN,0,0])]));await b.settle();assert.equal(b.audit().displayedPoints,0);assert.equal(b.audit().canvasCount,0);assert.equal(b.audit().state,'NOT_RUN');assert.equal(b.api.setModel({...fixture(),formalComplete:true}).ok,false);assert.equal(b.audit().currentModelRendered,false);b.api.dispose();
});
