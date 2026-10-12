import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const source=await fs.readFile(new URL('../web/p7-visualization.js',import.meta.url),'utf8');
const modelContext={window:{}};
vm.runInNewContext(await fs.readFile(new URL('../web/p7-visual-models.js',import.meta.url),'utf8'),modelContext);
const seeds=JSON.parse(await fs.readFile(new URL('../web/p7-visual-seeds.json',import.meta.url),'utf8'));
const plain=value=>JSON.parse(JSON.stringify(value));
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

// The actual renderer mounts against a recording Canvas2D context. No copied
// projection code or GPU/pixel/browser acceptance is substituted for execution.
function harness({canvasAvailable=true,importMode='unavailable'}={}){
  class Target{
    handlers=new Map();
    addEventListener(name,fn,{signal}={}){const list=this.handlers.get(name)||[];list.push({fn,signal});this.handlers.set(name,list);}
    emit(name,props={}){const event={button:0,pointerId:1,isPrimary:true,pointerType:'mouse',clientX:0,clientY:0,preventDefault(){this.prevented=true;},...props};for(const {fn,signal}of this.handlers.get(name)||[])if(!signal?.aborted)fn(event);return event;}
  }
  class Element extends Target{
    constructor(tag='div'){super();this.tag=tag;this.children=[];this.style={};this.dataset={};this.textContent='';this.value='';this.hidden=false;this.isConnected=true;this.offsetWidth=90;this.offsetHeight=22;this.clientWidth=800;this.clientHeight=400;this.captured=new Set();this.scale=1;this.attrs={};}
    append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    replaceChildren(...children){for(const child of this.children)child.parent=null;this.children=[];this.append(...children);}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;this.isConnected=false;}
    setAttribute(name,value){this.attrs[name]=value;}
    querySelectorAll(tag){return this.children.flatMap(child=>[...(child.tag===tag?[child]:[]),...child.querySelectorAll(tag)]);}
    getBoundingClientRect(){return {left:20,top:40,width:(parseFloat(this.style.width)||this.clientWidth)*this.scale,height:(parseFloat(this.style.height)||this.clientHeight)*this.scale};}
    setPointerCapture(id){this.captured.add(id);}
    hasPointerCapture(id){return this.captured.has(id);}
    releasePointerCapture(id){this.captured.delete(id);this.emit('lostpointercapture',{pointerId:id});}
    focus(){this.focused=true;}
    getContext(kind){if(kind!=='2d'||!canvasAvailable)return null;if(!this.context){const ctx={calls:[],path:[],dash:[]};
      for(const name of ['setTransform','clearRect','fillRect','save','rect','clip','restore'])ctx[name]=(...args)=>{if(name==='clearRect')ctx.calls=[];ctx.calls.push({name,args});};
      ctx.beginPath=()=>{ctx.path=[];};for(const name of ['moveTo','lineTo','arc','closePath'])ctx[name]=(...args)=>ctx.path.push({name,args});ctx.setLineDash=value=>{ctx.dash=value.slice();};
      ctx.stroke=()=>ctx.calls.push({name:'stroke',path:plain(ctx.path),color:ctx.strokeStyle,dash:plain(ctx.dash),alpha:ctx.globalAlpha});ctx.fill=()=>ctx.calls.push({name:'fill',path:plain(ctx.path),color:ctx.fillStyle,alpha:ctx.globalAlpha});this.context=ctx;
    }return this.context;}
  }
  class Controller{signal={aborted:false};abort(){this.signal.aborted=true;}}
  const frames=new Map(),observers={io:[],mo:[],ro:[]},stats={webglAttempts:0};let frameId=0;
  const observer=kind=>class{constructor(fn){this.fn=fn;this.disconnected=false;observers[kind].push(this);}observe(){}disconnect(){this.disconnected=true;}trigger(value){if(!this.disconnected)this.fn(value);}};
  const document=new Target();document.hidden=false;document.createElement=tag=>new Element(tag);document.createTextNode=value=>Object.assign(new Element('text'),{textContent:value});
  const window=new Target(),keys=['canvas-host','scene','labels','fallback','audit','notice','selection','selection-summary','selection-detail','title','status','summary','table-caption','provenance','axes','omissions','table-head','table-body','table-page','table-note'],els=Object.fromEntries(keys.map(key=>[key,new Element()]));
  const actions=Object.fromEntries(['reset','front','top','zoom-in','zoom-out','retry','previous','next','table-previous','table-next'].map(action=>{const button=new Element('button');button.dataset.p7vAction=action;return [action,button];}));
  const tabs=Array.from({length:8},(_,i)=>{const button=new Element('button');button.dataset.p7vCriterion='P7-0'+(i+1);return button;}),panel=new Element(),view={active:true,classList:{contains(){return view.active;}}},host=new Element();
  host.closest=()=>view;host.querySelector=selector=>{const field=selector.match(/data-p7v="([^"]+)"/),action=selector.match(/data-p7v-action="([^"]+)"/);return field?els[field[1]]:action?actions[action[1]]:selector==='[role="tabpanel"]'?panel:null;};host.querySelectorAll=selector=>selector==='[data-p7v-criterion]'?tabs:Object.values(actions);
  const context=vm.createContext({window,document,AbortController:Controller,IntersectionObserver:observer('io'),MutationObserver:observer('mo'),ResizeObserver:observer('ro'),devicePixelRatio:3,matchMedia:()=>({matches:true}),requestAnimationFrame(fn){const id=++frameId;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);}});
  const importModuleDynamically=importMode==='disabled'?async specifier=>{
    // A dependency whose constructor throws the actual browser failure class.
    // The byte-for-byte renderer source, including both imports, is unchanged.
    const names=specifier==='three'?['WebGLRenderer']:['OrbitControls'];
    const module=new vm.SyntheticModule(names,function(){this.setExport(names[0],class{constructor(){stats.webglAttempts++;throw Error('THREE.WebGLRenderer: GL_RENDERER=Disabled');}});},{context});await module.link(()=>{});await module.evaluate();return module;
  }:undefined;
  vm.runInContext(source,context,{timeout:2000,importModuleDynamically});const api=window.MathScopeP7Visualization.mount(host);
  const flush=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());};
  const settle=async()=>{await new Promise(setImmediate);flush();};
  const visibility=visible=>observers.io[0].trigger([{isIntersecting:visible}]);visibility(true);
  return {api,els,actions,tabs,stats,frames,observers,window,document,view,context,flush,settle,visibility,canvas:()=>els['canvas-host'].children[0],route(active){view.active=active;observers.mo[0].trigger();},resize(width,height){els.scene.clientWidth=width;els.scene.clientHeight=height;observers.ro.at(-1).trigger();},audit:()=>plain(api.audit()),detail:()=>JSON.parse(els['selection-detail'].textContent)};
}

const point=(id,position)=>({id,label:'exact '+id,position,exact:{testFixture:id},source:{fieldPath:'points.'+id,recordSHA256:'synthetic-renderer-test-only'}});
const fixture=(extra={})=>({criterion:'P7-01',criterionStatus:'PARTIAL',status:'RECORDED_EVIDENCE_VISUALIZED',proofStatusPromoted:false,visualApproximation:true,axes:[0,1,2].map(i=>({label:'axis '+i,type:'number',unit:''})),points:[point('a',[0,0,0])],lines:[],meshes:[],enclosures:[],provenance:[{recordSHA256:'synthetic-renderer-test-only'}],...extra});
const click=(canvas,x,y,props={})=>{const rect=canvas.getBoundingClientRect(),event={clientX:rect.left+x*canvas.scale,clientY:rect.top+y*canvas.scale,...props};canvas.emit('pointerdown',event);canvas.emit('pointerup',event);};
const arcs=h=>h.canvas().context.calls.filter(call=>call.name==='fill').flatMap(call=>call.path.filter(path=>path.name==='arc'));

test('all eight P7 views paint actual archived source geometry without WebGL and retain exact selection',async()=>{
  const h=harness();
  for(let i=1;i<=8;i++){
    const criterion='P7-0'+i,model=freeze(modelContext.window.MathScopeP7VisualModels.build({criterion,records:seeds.records,capabilities:seeds.capabilities})),before=JSON.stringify(model),inspection=h.context.window.MathScopeP7Visualization.inspectModel(model);
    assert.equal(h.api.setModel(model).ok,true);await h.settle();const audit=h.audit();
    assert.equal(audit.renderer,'CANVAS2D');assert.equal(audit.projection,'ORTHOGRAPHIC');assert.equal(audit.webGLRendered,false);assert.equal(audit.state,'ready');assert.equal(audit.currentModelRendered,true);assert.equal(audit.canvasCount,1);assert.ok(audit.drawCalls>13,criterion);assert.equal(audit.skipped,inspection.skipped);
    assert.equal(audit.rendered.points,model.points.length);assert.equal(audit.rendered.enclosures,model.enclosures.length);
    const item=[...model.points,...model.lines,...model.meshes,...model.enclosures][0];h.els.selection.value='0';h.els.selection.emit('change');assert.deepEqual(h.detail().exact,plain(item.exact));assert.deepEqual(h.detail().source,plain(item.source));
    h.canvas().emit('keydown',{key:'ArrowRight'});h.actions['zoom-in'].emit('click');await h.settle();assert.equal(JSON.stringify(model),before);assert.equal(h.audit().proofStatusPromoted,false);assert.equal(h.audit().visualApproximation,true);assert.ok(h.els.notice.textContent.includes('Canvas2D'));assert.ok(h.els['table-body'].children.length>0);
  }h.api.dispose();
});

test('independent orthographic coordinates, CSS-scaled pointer hits and DPR resizing agree',async()=>{
  const h=harness(),model=freeze(fixture({points:[point('lo',[-2,7,0]),point('mid',[4,7,2]),point('hi',[10,7,4])]}));h.api.setModel(model);await h.settle();
  const positions=arcs(h).map(path=>path.args.slice(0,2)),[x,y,z]=h.audit().camera.position,r=Math.hypot(x,y,z),theta=Math.atan2(x,z),phi=Math.acos(y/r),scale=200/2.7;
  // Independent yaw/pitch expression; the constant Y axis remains zero in
  // display space while each nonconstant source domain spans [-1.6,1.6].
  const expected=[-1.6,0,1.6].map(v=>[400+(Math.cos(theta)*v-Math.sin(theta)*v)*scale,200-(-Math.cos(phi)*Math.sin(theta)*v-Math.cos(phi)*Math.cos(theta)*v)*scale]);
  for(const p of expected)assert.ok(positions.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<1e-9));
  const canvas=h.canvas();canvas.scale=.5;click(canvas,400,200);assert.equal(h.audit().selectedId,'mid');assert.deepEqual(h.detail().displayCoordinates,[4,7,2]);assert.deepEqual(h.detail().source,plain(model.points[1].source));assert.equal(canvas.captured.size,0);
  assert.equal(canvas.width,1200);assert.equal(canvas.height,600);assert.equal(h.audit().pixelRatio,1.5);assert.equal(canvas.style.touchAction,'pan-y pinch-zoom');assert.equal(canvas.handlers.has('wheel'),false);
  h.resize(360,330);await h.settle();assert.equal(canvas.width,540);assert.equal(canvas.height,495);assert.ok(arcs(h).some(path=>Math.hypot(path.args[0]-180,path.args[1]-165)<1e-9));h.api.dispose();
});

test('missing vertices stay disconnected and dashed line picking returns the original source',async()=>{
  const line={id:'gapped-line',label:'missing interval',vertices:[[-3,0,0],[-1,0,0],null,[1,0,0],[3,0,0]],role:'open',exact:{gap:'not evaluated'},source:{fieldPath:'line-with-missing-vertices',recordSHA256:'synthetic-renderer-test-only'}},model=freeze(fixture({points:[],lines:[line]})),before=JSON.stringify(model),h=harness();h.api.setModel(model);await h.settle();h.actions.front.emit('click');await h.settle();
  const strokes=h.canvas().context.calls.filter(call=>call.name==='stroke'&&call.color==='#e9bc77');assert.equal(strokes.length,2);assert.ok(strokes.every(call=>call.path.length===2));assert.deepEqual(strokes[0].dash,[6,4]);assert.equal(h.audit().rendered.lineVertices,4);assert.equal(h.audit().skipped,2);
  click(h.canvas(),400,200);assert.equal(h.audit().selectedId,null);const [a,b]=strokes[0].path.map(path=>path.args);click(h.canvas(),(a[0]+b[0])/2,(a[1]+b[1])/2);assert.equal(h.audit().selectedId,'gapped-line');assert.deepEqual(h.detail().displayCoordinates,plain(line.vertices));assert.deepEqual(h.detail().exact,plain(line.exact));assert.equal(JSON.stringify(model),before);h.api.dispose();
});

test('full box edges, collapsed interval markers and mesh faces retain source-bound picking',async()=>{
  const box={id:'box',min:[-2,-1,-3],max:[2,1,3],role:'comparison',exact:{intervals:['[-2,2]','[-1,1]','[-3,3]']},source:{fieldPath:'enclosures.0'}},collapsed={id:'collapsed',min:[0,0,0],max:[0,0,0],role:'reference',collapseToDisplayPoint:true,exact:{originalWidth:'1e-1000'},source:{fieldPath:'enclosures.1'}};
  const h=harness(),model=freeze(fixture({points:[],enclosures:[box,collapsed]})),before=JSON.stringify(model);h.api.setModel(model);await h.settle();h.actions.front.emit('click');await h.settle();
  assert.equal(h.canvas().context.calls.filter(call=>call.name==='stroke'&&call.color==='#91bcff').length,12);assert.equal(arcs(h).length,1);click(h.canvas(),400-1.6*200/2.7,200);assert.equal(h.audit().selectedId,'box');assert.deepEqual(h.detail().displayCoordinates,{min:box.min,max:box.max});
  click(h.canvas(),415,200,{pointerType:'touch'});assert.equal(h.audit().selectedId,'collapsed');assert.deepEqual(h.detail().exact,{originalWidth:'1e-1000'});assert.ok(h.els['selection-summary'].textContent.includes('원본 폭'));assert.equal(JSON.stringify(model),before);
  const mesh={id:'mesh',vertices:[[-1,-1,0],[1,-1,0],[0,1,0]],triangles:[[0,1,2],[0,99,2]],exact:{triangle:'source face'},source:{fieldPath:'meshes.0'}};h.api.setModel(fixture({points:[],meshes:[mesh]}));await h.settle();h.actions.front.emit('click');await h.settle();assert.equal(h.audit().rendered.triangles,1);assert.equal(h.audit().skipped,1);assert.ok(h.canvas().context.calls.some(call=>call.name==='fill'&&call.path.some(path=>path.name==='closePath')));click(h.canvas(),400,200);assert.equal(h.audit().selectedId,'mesh');assert.deepEqual(h.detail().source,mesh.source);h.api.dispose();
});

test('camera controls, drag cancellation, named views and pan only affect presentation',async()=>{
  const h=harness(),model=freeze(fixture({points:[point('first',[0,0,0]),point('second',[1,2,3])]})),before=JSON.stringify(model);h.api.setModel(model);await h.settle();const initial=h.audit().camera,canvas=h.canvas();
  assert.equal(canvas.tabIndex,0);assert.equal(canvas.attrs.role,'img');canvas.emit('keydown',{key:'ArrowLeft'});canvas.emit('keydown',{key:'ArrowDown'});canvas.emit('keydown',{key:'+'});assert.equal(h.frames.size,1);assert.notDeepEqual(h.audit().camera.position,initial.position);assert.equal(h.audit().camera.zoom,1.2);canvas.emit('keydown',{key:']'});canvas.emit('keydown',{key:']'});assert.equal(h.audit().selectedId,'second');await h.settle();
  canvas.emit('pointerdown',{clientX:100,clientY:100});canvas.emit('pointermove',{clientX:150,clientY:120});const afterDrag=h.audit().camera;canvas.emit('pointercancel');canvas.emit('pointermove',{clientX:210,clientY:170});assert.deepEqual(h.audit().camera,afterDrag);canvas.emit('pointerup',{clientX:210,clientY:170});assert.equal(h.audit().selectedId,'second');
  canvas.emit('pointerdown',{clientX:100,clientY:100});canvas.emit('pointermove',{clientX:150,clientY:110,shiftKey:true});const afterPan=h.audit().camera;assert.notDeepEqual(afterPan.target,afterDrag.target);assert.deepEqual(afterPan.position.map((v,i)=>v-afterPan.target[i]),afterDrag.position.map((v,i)=>v-afterDrag.target[i]));canvas.emit('lostpointercapture');canvas.emit('pointermove',{clientX:250,clientY:190});assert.deepEqual(h.audit().camera,afterPan);
  for(const [action,position,up]of [['front',[0,0,7],[0,1,0]],['top',[0,7,.001],[0,0,-1]]]){h.actions[action].emit('click');await h.settle();assert.deepEqual(h.audit().camera.position,position);assert.deepEqual(h.audit().camera.up,up);assert.equal(h.audit().camera.zoom,1);canvas.emit('keydown',{key:'ArrowRight'});await h.settle();assert.ok(h.audit().camera.position.every(Number.isFinite));assert.ok(arcs(h).every(path=>path.args.every(Number.isFinite)));}
  canvas.emit('keydown',{key:'Home'});await h.settle();assert.deepEqual(h.audit().camera,initial);assert.equal(JSON.stringify(model),before);assert.equal(h.frames.size,0);assert.equal(h.audit().continuousAnimation,false);h.api.dispose();
});

test('route, visibility, zero-size and stale resize callbacks preserve one canvas and truthful readiness',async()=>{
  const h=harness();h.api.setModel(fixture());await h.settle();h.actions.top.emit('click');h.actions['zoom-in'].emit('click');await h.settle();const camera=h.audit().camera,oldCanvas=h.canvas(),oldObserver=h.observers.ro[0],frames=h.audit().frames;
  h.route(false);assert.equal(h.audit().canvasCount,0);assert.equal(h.audit().currentModelRendered,false);assert.equal(h.audit().camera,null);assert.equal(h.frames.size,0);assert.ok(oldObserver.disconnected);
  h.route(true);assert.equal(h.audit().currentModelRendered,false);await h.settle();assert.equal(h.audit().canvasCount,1);assert.notEqual(h.canvas(),oldCanvas);assert.deepEqual(h.audit().camera,camera);assert.equal(h.audit().frames,frames+1);oldObserver.fn();assert.equal(h.frames.size,0);
  h.document.hidden=true;h.document.emit('visibilitychange');h.actions['zoom-in'].emit('click');assert.equal(h.frames.size,0);h.document.hidden=false;h.document.emit('visibilitychange');await h.settle();h.visibility(false);h.actions['zoom-out'].emit('click');assert.equal(h.frames.size,0);h.visibility(true);await h.settle();
  h.resize(0,0);assert.equal(h.audit().currentModelRendered,false);h.actions['zoom-in'].emit('click');await h.settle();assert.equal(h.audit().currentModelRendered,false);h.resize(360,330);await h.settle();assert.equal(h.audit().currentModelRendered,true);
  h.actions.retry.emit('click');await h.settle();assert.equal(h.audit().canvasCount,1);h.api.clear();assert.equal(h.audit().canvasCount,0);assert.equal(h.audit().currentModelRendered,false);h.api.setModel(fixture());h.api.dispose();await h.settle();assert.equal(h.audit().canvasCount,0);assert.equal(h.audit().state,'disposed');assert.ok(h.observers.io.every(value=>value.disconnected));assert.ok(h.observers.mo.every(value=>value.disconnected));assert.ok(h.observers.ro.every(value=>value.disconnected));assert.equal(h.frames.size,0);
});

test('unavailable Canvas2D, missing coordinates and rejected proof claims keep honest HTML fallback',async()=>{
  const h=harness({canvasAvailable:false});h.api.setModel(fixture());await h.settle();assert.equal(h.audit().renderer,null);assert.equal(h.audit().currentModelRendered,false);assert.equal(h.audit().canvasCount,0);h.els.selection.value='0';h.els.selection.emit('change');assert.deepEqual(h.detail().exact,{testFixture:'a'});h.api.dispose();
  const empty=harness(),model=fixture({points:[point('missing',[NaN,0,0])],table:{columns:['Exact condition'],rows:[['Not evaluated']]}});empty.api.setModel(model);await empty.settle();assert.equal(empty.audit().state,'empty');assert.equal(empty.audit().canvasCount,0);assert.equal(empty.audit().rendered.points,0);assert.equal(empty.els['table-body'].children.length,1);assert.ok(empty.els['table-note'].textContent.includes('0으로 채우지'));assert.equal(empty.api.setModel({...fixture(),proofStatusPromoted:true}).ok,false);assert.equal(empty.audit().currentModelRendered,false);empty.api.dispose();
});

test('an explicit WebGL constructor failure opens the same Canvas2D renderer',async()=>{
  // Only this dependency-constructor probe needs Node's experimental VM module
  // loader. The standard suite and production renderer have no new dependency.
  const child="import vm from 'node:vm';import assert from 'node:assert/strict';\nconst source="+JSON.stringify(source)+";\nconst plain="+plain.toString()+";\nconst harness="+harness.toString()+";\nconst h=harness({importMode:'disabled'});h.api.setModel("+JSON.stringify(fixture())+");await h.settle();assert.equal(h.stats.webglAttempts,1);assert.equal(h.audit().renderer,'CANVAS2D');assert.equal(h.audit().webGLRendered,false);assert.equal(h.audit().currentModelRendered,true);assert.equal(h.audit().canvasCount,1);assert.equal(h.audit().fallbackReason,'WEBGL_UNAVAILABLE');h.api.dispose();console.log('WEBGL_DISABLED_CANVAS_READY');";
  const {stdout}=await promisify(execFile)(process.execPath,['--experimental-vm-modules','--input-type=module','-e',child],{timeout:15000,maxBuffer:1024*1024});assert.ok(stdout.includes('WEBGL_DISABLED_CANVAS_READY'));
});
