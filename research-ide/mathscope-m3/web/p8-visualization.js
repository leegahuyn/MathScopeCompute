/* P8 owns one lazy scene, separate from the frozen P7 renderer. Both backends
   consume the same retained source entries and independently normalized axes. */
(()=>{'use strict';let modules;
  const finitePoint=p=>Array.isArray(p)&&p.length===3&&p.every(x=>typeof x==='number'&&Number.isFinite(x));
  const colors={data:'#6ee0c8',comparison:'#91bcff',reference:'#becbd2',open:'#e9bc77'};
  const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
  const initialCamera=()=>({position:[5,3.6,5.8],target:[0,0,0],zoom:1});
  function mount(host){
    const $=key=>host.querySelector('[data-p8v="'+key+'"]'),view=host.closest('.view'),abort=new AbortController(),signal=abort.signal;
    let model=null,scene=null,T=null,inView=false,loading=false,raf=null,disposed=false,revision=0,drawn=-1,frames=0,selected=-1,items=[],labels=[],domains=[],state='NOT_RUN',savedCamera=null,preferCanvas=false;
    const text=(key,value)=>{$(key).textContent=typeof value==='string'?value:JSON.stringify(value,null,2);};
    const active=()=>!disposed&&host.isConnected&&!document.hidden&&inView&&(!view||view.classList.contains('active'));
    const cameraSnapshot=()=>!scene?null:scene.kind==='CANVAS2D'?{position:scene.camera.position.slice(),target:scene.camera.target.slice(),zoom:scene.camera.zoom}:{position:scene.camera.position.toArray(),target:scene.controls.target.toArray(),zoom:scene.camera.zoom};
    const lodLimit=()=>Math.min(1000,Math.max(50,Number($('lod').value)||200));
    const audit=()=>({schema:'MathScope.M3.P8.VisualizationAudit/1',state,renderer:scene?.kind||null,modelRevision:revision,drawnRevision:drawn,currentModelRendered:!!scene&&revision===drawn,frames,canvasCount:$('canvas').querySelectorAll('canvas').length,view:model?.view||null,sourceRecord:model?.provenance?.[0]?.recordSHA256||null,pointCount:model?.points?.length||0,displayedPoints:scene?.shownPoints||0,lineCount:model?.lines?.length||0,displayedLines:scene?.shownLines||0,lod:lodLimit(),pixelRatio:scene?.pixelRatio||null,selectedId:items[selected]?.item?.id||null,camera:cameraSnapshot(),reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches,continuousAnimation:false,drawCalls:scene?.kind==='CANVAS2D'?scene.drawCalls:scene?.renderer.info.render.calls||0,certificateIssued:false,formalComplete:false});
    function sync(){host.dataset.p8vState=state;text('audit',audit());}
    function fallback(message,next='FALLBACK'){state=next;text('fallback',message);$('fallback').hidden=false;sync();}
    function disposeTree(root){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)ms.add(m);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
    function release(){
      if(raf!==null)cancelAnimationFrame(raf);raf=null;drawn=-1;if(!scene)return;savedCamera=cameraSnapshot();
      scene.abort.abort();scene.ro.disconnect();
      if(scene.kind==='WEBGL'){scene.controls.removeEventListener('change',render);scene.controls.dispose();disposeTree(scene.root);scene.renderer.dispose();}
      scene.canvas.remove();scene=null;labels=[];$('labels').replaceChildren();
    }
    function transform(p){return p.map((v,i)=>{const [a,b]=domains[i];if(a===b)return 0;const s=Math.max(Math.abs(a),Math.abs(b),Number.MIN_VALUE);return ((v/s-a/s)/(b/s-a/s)-.5)*3.2;});}
    // The Canvas projection uses the same orthographic frustum and world axes as
    // THREE. Its depth orders marks only; it never changes any source coordinate.
    function softwareProject(position){
      const c=scene.camera,forward=unit(sub(c.target,c.position)),right=unit(cross(forward,[0,1,0])),up=cross(right,forward),offset=sub(position,c.target);
      const nx=dot(offset,right)*c.zoom/scene.halfX,ny=dot(offset,up)*c.zoom/scene.halfY,depth=dot(sub(position,c.position),forward);
      return{x:(nx*.5+.5)*scene.width,y:(-.5*ny+.5)*scene.height,depth,visible:depth>=.01&&depth<=100&&Math.abs(nx)<=1&&Math.abs(ny)<=1};
    }
    function project(position){
      if(scene.kind==='CANVAS2D')return softwareProject(position);
      const p=new T.Vector3(...position).project(scene.camera);
      return{x:(p.x*.5+.5)*scene.width,y:(-.5*p.y+.5)*scene.height,visible:p.z>=-1&&p.z<=1&&Math.abs(p.x)<=1&&Math.abs(p.y)<=1};
    }
    function projectedLabels(){
      const placed=[];for(const l of labels){const p=project(l.position),w=scene.width,h=scene.height;let x=p.x,y=p.y;l.el.hidden=!p.visible;if(l.el.hidden)continue;
        const ew=l.el.offsetWidth,eh=l.el.offsetHeight;x=Math.max(ew/2+5,Math.min(w-ew/2-5,x));y=Math.max(eh/2+5,Math.min(h-eh/2-5,y));
        const r={l:x-ew/2-3,r:x+ew/2+3,t:y-eh/2-3,b:y+eh/2+3};l.el.hidden=placed.some(z=>r.l<z.r&&r.r>z.l&&r.t<z.b&&r.b>z.t);l.el.style.left=x+'px';l.el.style.top=y+'px';if(!l.el.hidden)placed.push(r);
      }
    }
    function drawCanvas(){
      const s=scene,c=s.context;s.drawCalls=0;c.setTransform(s.pixelRatio,0,0,s.pixelRatio,0,0);c.clearRect(0,0,s.width,s.height);c.fillStyle='#071721';c.fillRect(0,0,s.width,s.height);
      c.save();c.beginPath();c.rect(0,0,s.width,s.height);c.clip();
      const path=(vertices,color,dashed=false,width=1.5)=>{c.beginPath();vertices.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dashed?[6,4]:[]);c.stroke();s.drawCalls++;};
      for(const axis of s.axes)path(axis.map(softwareProject),'#557380',false,1);
      s.projectedLines=s.lines.map(entry=>({...entry,screen:entry.vertices.map(softwareProject)}));
      // Back-to-front ordering is deterministic. Hit testing uses these same
      // projected segments, retaining the original entry index even across LOD.
      const orderedLines=s.projectedLines.slice().sort((a,b)=>b.screen.reduce((n,p)=>n+p.depth,0)/b.screen.length-a.screen.reduce((n,p)=>n+p.depth,0)/a.screen.length);
      for(const entry of orderedLines){path(entry.screen,entry.color,entry.dashed);if(entry.directed){const end=entry.screen.at(-1);let prev=entry.screen.at(-2),i=entry.screen.length-2;while(i>0&&Math.hypot(end.x-prev.x,end.y-prev.y)<1)prev=entry.screen[--i];const dx=end.x-prev.x,dy=end.y-prev.y,length=Math.hypot(dx,dy);if(length>1){const size=Math.min(9,length*.3),ux=dx/length,uy=dy/length;path([{x:end.x-size*ux+size*.45*uy,y:end.y-size*uy-size*.45*ux},end,{x:end.x-size*ux-size*.45*uy,y:end.y-size*uy+size*.45*ux}],entry.color,false);}}}
      s.projectedPoints=s.points.map(entry=>({...entry,...softwareProject(entry.position)}));
      for(const entry of s.projectedPoints.slice().sort((a,b)=>b.depth-a.depth)){if(!entry.visible)continue;c.beginPath();c.arc(entry.x,entry.y,4,0,Math.PI*2);c.fillStyle=entry.color;c.fill();s.drawCalls++;}
      const selectedEntry=items[selected];if(selectedEntry){const center=transform(selectedEntry.center);for(let i=0;i<3;i++){const a=center.slice(),b=center.slice();a[i]-=.065;b[i]+=.065;path([softwareProject(a),softwareProject(b)],'#ffffff',false,2);}}
      c.restore();
    }
    function render(){
      if(raf!==null||!scene||!active())return;raf=requestAnimationFrame(()=>{raf=null;if(!scene||!active())return;
        try{if(scene.kind==='CANVAS2D')drawCanvas();else scene.renderer.render(scene.root,scene.camera);frames++;drawn=revision;state='READY';$('fallback').hidden=true;projectedLabels();sync();}
        catch{const webgl=scene.kind==='WEBGL';release();if(webgl&&active()){preferCanvas=true;startCanvas();}else fallback('3D를 그리지 못했습니다. 정확한 표와 출처를 계속 확인할 수 있습니다.');}
      });
    }
    function addLabel(pos,value){const el=document.createElement('span');el.className='p8-axis-label';el.textContent=value;$('labels').append(el);labels.push({el,position:pos});}
    function line(vertices,color,dashed=false){const g=new T.BufferGeometry().setFromPoints(vertices.map(p=>new T.Vector3(...p))),m=dashed?new T.LineDashedMaterial({color,dashSize:.07,gapSize:.04}):new T.LineBasicMaterial({color}),o=new T.Line(g,m);if(dashed)o.computeLineDistances();return o;}
    function choose(index){
      selected=items[index]?index:-1;$('select').value=selected<0?'':String(selected);const entry=items[selected];text('detail',entry?{label:entry.item.label,exact:entry.item.exact,source:entry.item.source,displayCoordinates:entry.item.position||entry.item.vertices,certificateIssued:false}:{});
      if(scene){if(scene.kind==='WEBGL'&&scene.selection){scene.selection.visible=!!entry;if(entry)scene.selection.position.set(...transform(entry.center));}render();}sync();
    }
    function applyCamera(value){
      if(!scene)return;if(scene.kind==='CANVAS2D')scene.camera={position:value.position.slice(),target:value.target.slice(),zoom:value.zoom};
      else{scene.controls.target.set(...value.target);scene.camera.up.set(0,1,0);scene.camera.position.set(...value.position);scene.camera.zoom=value.zoom;scene.camera.updateProjectionMatrix();scene.controls.update();}render();
    }
    function reset(){savedCamera=initialCamera();applyCamera(savedCamera);}
    function zoom(factor){if(!scene)return;const c=cameraSnapshot();c.zoom=Math.max(.4,Math.min(6,c.zoom*factor));applyCamera(c);}
    function rotate(theta,phi){
      if(!scene)return;const c=cameraSnapshot(),v=sub(c.position,c.target),r=Math.hypot(...v),t=Math.atan2(v[0],v[2])+theta,p=Math.max(.04,Math.min(Math.PI-.04,Math.acos(Math.max(-1,Math.min(1,v[1]/r)))+phi));
      c.position=[r*Math.sin(p)*Math.sin(t),r*Math.cos(p),r*Math.sin(p)*Math.cos(t)].map((n,i)=>n+c.target[i]);applyCamera(c);
    }
    function geometry(){
      if(!scene||!model)return;labels=[];$('labels').replaceChildren();
      const points=items.filter(x=>x.type==='point'),count=Math.min(points.length,lodLimit()),subset=count===points.length?points:Array.from({length:count},(_,i)=>points[Math.floor(i*(points.length-1)/Math.max(1,count-1))]),lines=items.filter(x=>x.type==='line').slice(0,200);
      scene.shownPoints=subset.length;scene.shownLines=lines.length;
      const axes=[];for(let i=0;i<3;i++){const a=[-1.6,-1.6,-1.6],b=a.slice();b[i]=1.6;axes.push([a,b]);const end=b.slice();end[i]=1.77;addLabel(end,['X','Y','Z'][i]+' · '+model.axes[i].label);}
      if(scene.kind==='CANVAS2D'){
        scene.axes=axes;scene.points=subset.map(e=>({index:e.index,position:transform(e.center),color:colors[e.item.role]||colors.data}));
        scene.lines=lines.map(e=>({index:e.index,vertices:e.item.vertices.map(transform),color:colors[e.item.role]||colors.data,dashed:e.item.role==='open',directed:!!e.item.directed}));scene.projectedPoints=[];scene.projectedLines=[];
      }else{
        if(scene.group){scene.root.remove(scene.group);disposeTree(scene.group);}const g=new T.Group();scene.group=g;scene.root.add(g);scene.pickables=[];
        axes.forEach(a=>g.add(line(a,'#557380')));
        if(subset.length){const pos=[],rgb=[];subset.forEach(e=>{pos.push(...transform(e.center));const c=new T.Color(colors[e.item.role]||colors.data);rgb.push(c.r,c.g,c.b);});const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(pos,3));pg.setAttribute('color',new T.Float32BufferAttribute(rgb,3));const object=new T.Points(pg,new T.PointsMaterial({size:8,sizeAttenuation:false,vertexColors:true}));object.userData.indices=subset.map(e=>e.index);g.add(object);scene.pickables.push(object);}
        for(const entry of lines){const vertices=entry.item.vertices.map(transform),color=colors[entry.item.role]||colors.data,object=line(vertices,color,entry.item.role==='open');object.userData.index=entry.index;g.add(object);scene.pickables.push(object);if(entry.item.directed){const a=new T.Vector3(...vertices.at(-2)),b=new T.Vector3(...vertices.at(-1)),direction=b.clone().sub(a),length=direction.length();if(length>.001)g.add(new T.ArrowHelper(direction.normalize(),a,length,color,Math.min(.14,length*.22),Math.min(.065,length*.12)));}}
        const selection=new T.Group();for(let i=0;i<3;i++){const a=[0,0,0],b=a.slice();a[i]=-.065;b[i]=.065;selection.add(line([a,b],'#ffffff'));}g.add(selection);scene.selection=selection;selection.visible=false;
      }
      choose(selected);text('render-note',(scene.kind==='CANVAS2D'?'Canvas2D · 동일 좌표의 3D 투영 · ':'WebGL · ')+subset.length+' / '+points.length+'개 점 · '+lines.length+'개 선 (최대 200). LOD는 표와 수학 원본을 바꾸지 않습니다. 흰 십자는 선택 표시입니다.');render();
    }
    function prepareCanvas(canvas){
      canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','P8 표시용 3D. 방향키 회전, +와 - 확대, Home 초기화, 대괄호로 항목 선택. 정확한 값과 출처는 표와 선택 항목에 있습니다.');$('canvas').append(canvas);
    }
    function keyboard(canvas,sceneSignal){
      canvas.addEventListener('keydown',e=>{if(!scene)return;let used=true;
        if(e.key==='ArrowLeft')rotate(-.13,0);else if(e.key==='ArrowRight')rotate(.13,0);else if(e.key==='ArrowUp')rotate(0,-.13);else if(e.key==='ArrowDown')rotate(0,.13);else if(e.key==='+'||e.key==='=')zoom(1.2);else if(e.key==='-')zoom(1/1.2);else if(e.key==='Home')reset();else if(e.key==='[')choose(selected-1);else if(e.key===']')choose(selected+1);else used=false;
        if(used)e.preventDefault();
      },{signal:sceneSignal});
    }
    function canvasPick(x,y,coarse){
      const limit=coarse?18:12;let best=null;
      for(const p of scene.projectedPoints){const distance=Math.hypot(x-p.x,y-p.y);if(p.visible&&distance<=limit&&(!best||distance<best.distance||distance===best.distance&&p.depth<best.depth))best={index:p.index,distance,depth:p.depth};}
      if(best)return best.index;
      const segmentLimit=coarse?12:7;
      for(const l of scene.projectedLines)for(let i=1;i<l.screen.length;i++){const a=l.screen[i-1],b=l.screen[i],dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/den)):0,distance=Math.hypot(x-a.x-t*dx,y-a.y-t*dy);if(distance<=segmentLimit&&(!best||distance<best.distance))best={index:l.index,distance};}
      return best?.index;
    }
    function canvasPointers(canvas,sceneSignal){
      let drag=null;
      const local=e=>{const r=canvas.getBoundingClientRect();return[(e.clientX-r.left)*scene.width/r.width,(e.clientY-r.top)*scene.height/r.height];};
      const cancel=()=>{drag=null;};
      canvas.addEventListener('pointerdown',e=>{if(!scene||e.isPrimary===false||e.button!==0)return;drag={id:e.pointerId,start:[e.clientX,e.clientY],last:[e.clientX,e.clientY],moved:false};canvas.setPointerCapture(e.pointerId);},{signal:sceneSignal});
      canvas.addEventListener('pointermove',e=>{if(!scene||!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.last[0],dy=e.clientY-drag.last[1];if(Math.hypot(e.clientX-drag.start[0],e.clientY-drag.start[1])>5)drag.moved=true;if(drag.moved)rotate(-dx*.008,-dy*.008);drag.last=[e.clientX,e.clientY];},{signal:sceneSignal});
      canvas.addEventListener('pointerup',e=>{if(!scene||!drag||drag.id!==e.pointerId)return;const clicked=!drag.moved&&Math.hypot(e.clientX-drag.start[0],e.clientY-drag.start[1])<=5;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(clicked){const [x,y]=local(e),index=canvasPick(x,y,e.pointerType==='touch');if(index!==undefined)choose(index);}},{signal:sceneSignal});
      canvas.addEventListener('pointercancel',cancel,{signal:sceneSignal});canvas.addEventListener('lostpointercapture',cancel,{signal:sceneSignal});
    }
    function startCanvas(){
      if(!active()||!items.length||scene)return;
      try{
        const canvas=document.createElement('canvas'),context=canvas.getContext('2d');if(!context)throw new Error('Canvas2D unavailable');prepareCanvas(canvas);
        // Vertical gestures and pinch remain browser-owned; horizontal drags orbit.
        // Buttons and keyboard provide zoom/rotation without gesture capture.
        canvas.style.touchAction='pan-y pinch-zoom';
        const sceneAbort=new AbortController(),resize=()=>{if(!scene||scene.canvas!==canvas)return;const w=$('scene').clientWidth,h=$('scene').clientHeight;if(!w||!h)return;
          scene.width=w;scene.height=h;scene.halfX=3*Math.max(1,w/h);scene.halfY=3*Math.max(1,h/w);scene.pixelRatio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(w*scene.pixelRatio));canvas.height=Math.max(1,Math.round(h*scene.pixelRatio));canvas.style.width=w+'px';canvas.style.height=h+'px';render();};
        const ro=new ResizeObserver(resize);scene={kind:'CANVAS2D',canvas,context,camera:savedCamera?{position:savedCamera.position.slice(),target:savedCamera.target.slice(),zoom:savedCamera.zoom}:initialCamera(),abort:sceneAbort,ro,width:1,height:1,halfX:3,halfY:3,pixelRatio:1,drawCalls:0,shownPoints:0,shownLines:0,points:[],lines:[],axes:[],projectedPoints:[],projectedLines:[]};
        ro.observe($('scene'));keyboard(canvas,sceneAbort.signal);canvasPointers(canvas,sceneAbort.signal);resize();geometry();
      }catch{release();fallback('이 환경에서 3D를 열지 못했습니다. 동일 데이터 표와 출처를 확인하세요.');}
    }
    async function ensure(){
      if(!active()||!items.length||scene||loading)return;loading=true;fallback('3D 엔진을 준비하고 있습니다.','LOADING');
      try{
        if(preferCanvas){startCanvas();return;}
        modules=modules||Promise.all([import('three'),import('three/addons/controls/OrbitControls.js')]).catch(e=>{modules=null;throw e;});const [three,orbit]=await modules;if(!active()||!items.length)return;T=three;
        const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor('#071721');const canvas=renderer.domElement;prepareCanvas(canvas);
        const root=new T.Scene(),camera=new T.OrthographicCamera(-3,3,3,-3,.01,100),controls=new orbit.OrbitControls(camera,canvas),sceneAbort=new AbortController();controls.enableDamping=false;controls.enableZoom=false;controls.minPolarAngle=.04;controls.maxPolarAngle=Math.PI-.04;
        const resize=()=>{if(!scene||scene.canvas!==canvas)return;const w=$('scene').clientWidth,h=$('scene').clientHeight;if(!w||!h)return;scene.width=w;scene.height=h;scene.pixelRatio=Math.min(devicePixelRatio||1,1.5);renderer.setPixelRatio(scene.pixelRatio);renderer.setSize(w,h,false);const halfX=3*Math.max(1,w/h),halfY=3*Math.max(1,h/w);camera.left=-halfX;camera.right=halfX;camera.top=halfY;camera.bottom=-halfY;camera.updateProjectionMatrix();render();};
        const ro=new ResizeObserver(resize);scene={kind:'WEBGL',canvas,root,camera,renderer,controls,abort:sceneAbort,ro,width:1,height:1,pixelRatio:1,group:null,pickables:[],selection:null,shownPoints:0,shownLines:0};ro.observe($('scene'));controls.addEventListener('change',render);let start;
        canvas.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY];},{signal:sceneAbort.signal});canvas.addEventListener('pointerup',e=>{const initial=start;start=null;if(!scene||!initial||Math.hypot(e.clientX-initial[0],e.clientY-initial[1])>5)return;const rect=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.params.Points.threshold=.07;ray.params.Line.threshold=.04;ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);const hit=ray.intersectObjects(scene.pickables)[0];if(hit)choose(hit.object.userData.indices?hit.object.userData.indices[hit.index]:hit.object.userData.index);},{signal:sceneAbort.signal});
        canvas.addEventListener('pointercancel',()=>{start=null;},{signal:sceneAbort.signal});keyboard(canvas,sceneAbort.signal);
        canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();release();preferCanvas=true;startCanvas();},{signal:sceneAbort.signal});resize();applyCamera(savedCamera||initialCamera());geometry();
      }catch{release();preferCanvas=true;startCanvas();}finally{loading=false;sync();}
    }
    function clear(message='실제 계산을 실행하면 구조가 표시됩니다.'){
      revision++;model=null;items=[];selected=-1;release();savedCamera=null;$('select').replaceChildren();$('axes').replaceChildren();text('detail',{});fallback(message,'NOT_RUN');
    }
    function setModel(next){
      if(!next||next.schema!=='MathScope.M3.P8.VisualModel/1'||next.certificateIssued!==false||next.formalComplete!==false){clear('표시 계약이 올바르지 않습니다.');return{ok:false};}
      revision++;model=next;items=[];selected=-1;savedCamera=null;const positions=[];
      for(const item of (next.points||[]).slice(0,4096))if(finitePoint(item.position)){items.push({type:'point',item,center:item.position,index:items.length});positions.push(item.position);}
      let lineVertices=0;for(const item of (next.lines||[]).slice(0,512))if(Array.isArray(item.vertices)&&item.vertices.length>=2&&item.vertices.length<=1024&&lineVertices+item.vertices.length<=16384&&item.vertices.every(finitePoint)){items.push({type:'line',item,center:item.vertices[0],index:items.length});positions.push(...item.vertices);lineVertices+=item.vertices.length;}
      domains=[0,1,2].map(i=>positions.length?positions.reduce(([lo,hi],p)=>[Math.min(lo,p[i]),Math.max(hi,p[i])],[Infinity,-Infinity]):[0,0]);
      $('select').replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent='선택 안 함';$('select').append(blank);for(const e of items){const o=document.createElement('option');o.value=String(e.index);o.textContent=e.item.label;$('select').append(o);}
      $('axes').replaceChildren();next.axes.forEach((a,i)=>{const d=document.createElement('p');d.textContent=['X','Y','Z'][i]+' · '+a.label+' ['+a.type+'] '+(a.unit||'')+' · '+domains[i].join(' → ');$('axes').append(d);});text('detail',{});
      fallback(items.length?'선택한 구조의 새 프레임을 준비합니다.':'실행된 호환 좌표가 없습니다. 원본 표와 미실행 상태를 확인하세요.',items.length?'PREPARED':'NOT_RUN');if(!items.length){release();savedCamera=null;}else if(scene){geometry();reset();}else ensure();sync();return{ok:true,items:items.length};
    }
    const visibility=()=>{if(!active()){if(raf!==null)cancelAnimationFrame(raf);raf=null;if(view&&!view.classList.contains('active')){release();if(items.length)fallback('P8 화면으로 돌아오면 3D를 복구합니다.','INACTIVE');}}else if(scene)render();else ensure();};
    const io=new IntersectionObserver(entries=>{inView=entries.some(e=>e.isIntersecting);visibility();},{rootMargin:'100px'});io.observe($('scene'));const mo=new MutationObserver(visibility);if(view)mo.observe(view,{attributes:true,attributeFilter:['class']});
    $('select').addEventListener('change',()=>choose($('select').value===''?-1:Number($('select').value)),{signal});$('lod').addEventListener('change',geometry,{signal});
    for(const b of host.querySelectorAll('[data-p8-camera]'))b.addEventListener('click',()=>{const action=b.dataset.p8Camera;if(action==='reset')reset();else if(action==='in')zoom(1.2);else if(action==='out')zoom(1/1.2);else{release();preferCanvas=false;ensure();}},{signal});
    document.addEventListener('visibilitychange',visibility,{signal});window.addEventListener('pagehide',release,{signal});window.addEventListener('pageshow',visibility,{signal});
    function dispose(){disposed=true;abort.abort();io.disconnect();mo.disconnect();release();model=null;items=[];state='DISPOSED';sync();}
    clear();return{setModel,clear,dispose,audit};
  }
  window.MathScopeP8Visualization=Object.freeze({version:'1.1.0',mount});
})();
