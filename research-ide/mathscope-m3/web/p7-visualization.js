/* One lazy, demand-rendered P7 scene. Numeric coordinates are display approximations only. */
(()=>{
  'use strict';
  const VERSION='1.1.0',LIMITS={points:4096,lines:512,lineVertices:16384,meshes:32,triangles:8192,enclosures:512,labels:18,tablePage:40};
  const COLORS={primary:'#6ee0c8',comparison:'#91bcff',open:'#e9bc77',reference:'#c1cdd5'};
  const xyz=v=>Array.isArray(v)&&v.length===3&&v.every(x=>typeof x==='number'&&Number.isFinite(x));
  const criterionOK=id=>/^P7-0[1-8]$/.test(id||'');
  const color=item=>typeof item.color==='string'&&/^#[\da-f]{6}$/i.test(item.color)?item.color:COLORS[item.role]||COLORS.primary;
  const text=value=>typeof value==='string'?value:value===undefined?'—':JSON.stringify(value,null,2);
  const short=(value,max=32000)=>{const s=text(value);return s.length>max?s.slice(0,max)+'\n… 표시 길이 제한 · 전체 원본은 실행 기록에서 확인하세요.':s;};
  const number=value=>value===0?'0':Math.abs(value)>=1e5||Math.abs(value)<1e-4?value.toExponential(3):Number(value.toPrecision(6)).toString();
  let modulesPromise=null,currentMount=null;
  function modules(){return modulesPromise||(modulesPromise=Promise.all([import('three'),import('three/addons/controls/OrbitControls.js')]).catch(error=>{modulesPromise=null;throw error;}));}
  const minus=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
  function viewBasis(camera){const back=unit(minus(camera.position,camera.target)),right=unit(cross(camera.up,back));return {back,right,up:cross(back,right)};}
  function projection(camera,width,height){
    const basis=viewBasis(camera),halfY=2.7/camera.zoom,halfX=halfY*width/height;
    return p=>{const v=minus(p,camera.target),depth=dot(minus(camera.position,p),basis.back);return {x:width/2+dot(v,basis.right)*width/(2*halfX),y:height/2-dot(v,basis.up)*height/(2*halfY),depth};};
  }
  function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
  function triangleContains(p,vertices){const sides=vertices.map((a,i)=>{const b=vertices[(i+1)%3];return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);});return sides.some(v=>v!==0)&&!(sides.some(v=>v<0)&&sides.some(v=>v>0));}
  function prepare(model){
    if(!model||!criterionOK(model.criterion)||model.proofStatusPromoted!==false||model.visualApproximation!==true)throw Error('표시 모델의 조건·근사·증명 경계가 올바르지 않습니다.');
    const out={points:[],lines:[],meshes:[],enclosures:[],records:[],warnings:[],domains:[],axes:[],count:0};let skipped=0,lineVertices=0,triangles=0;
    const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
    const include=p=>{for(let i=0;i<3;i++){low[i]=Math.min(low[i],p[i]);high[i]=Math.max(high[i],p[i]);}};
    const add=(kind,item,center)=>{const index=out.records.length;out.records.push({kind,item,center,index});return index;};
    const bounded=(name,max)=>{const a=Array.isArray(model[name])?model[name]:[];if(a.length>max)out.warnings.push(name+': '+max+'개 표시 상한을 적용했습니다. 전체 원본은 실행 기록을 확인하세요.');return a.slice(0,max);};
    for(const item of bounded('points',LIMITS.points)){if(!item||!xyz(item.position)){skipped++;continue;}const p=item.position.slice();include(p);out.points.push({item,p,index:add('점',item,p)});out.count++;}
    for(const item of bounded('lines',LIMITS.lines)){
      if(!item||!Array.isArray(item.vertices)){skipped++;continue;}const segments=[];let first=null;
      for(let i=1;i<item.vertices.length;i++){
        if(lineVertices+2>LIMITS.lineVertices){skipped+=item.vertices.length-i;break;}
        const a=item.vertices[i-1],b=item.vertices[i];if(!xyz(a)||!xyz(b)){skipped++;continue;}
        segments.push(a.slice(),b.slice());include(a);include(b);first=first||a.slice();lineVertices+=2;
      }
      if(!segments.length)continue;out.lines.push({item,segments,index:add('선',item,first)});out.count+=segments.length/2;
    }
    for(const item of bounded('meshes',LIMITS.meshes)){
      if(!item||!Array.isArray(item.vertices)||!Array.isArray(item.triangles)){skipped++;continue;}const vertices=[];let first=null;
      for(let ti=0;ti<item.triangles.length;ti++){
        if(triangles>=LIMITS.triangles){skipped+=item.triangles.length-ti;break;}const t=item.triangles[ti];
        if(!Array.isArray(t)||t.length!==3||!t.every(i=>Number.isInteger(i)&&i>=0&&i<item.vertices.length&&xyz(item.vertices[i]))){skipped++;continue;}
        for(const i of t){const p=item.vertices[i];vertices.push(p.slice());include(p);first=first||p.slice();}triangles++;
      }
      if(!vertices.length)continue;out.meshes.push({item,vertices,index:add('면',item,first)});out.count+=vertices.length/3;
    }
    for(const item of bounded('enclosures',LIMITS.enclosures)){
      if(!item||!xyz(item.min)||!xyz(item.max)||item.min.some((v,i)=>v>item.max[i])){skipped++;continue;}
      const a=item.min.slice(),b=item.max.slice();include(a);include(b);const center=a.map((v,i)=>v/2+b[i]/2);
      out.enclosures.push({item,min:a,max:b,index:add('구간',item,center)});out.count++;
    }
    for(let i=0;i<3;i++){
      const axis=Array.isArray(model.axes)?model.axes[i]||{}:{};let a=low[i],b=high[i];
      if(Array.isArray(axis.domain)&&axis.domain.length===2&&axis.domain.every(Number.isFinite)&&axis.domain[0]<=axis.domain[1]){a=Math.min(a,axis.domain[0]);b=Math.max(b,axis.domain[1]);}
      out.domains.push(Number.isFinite(a)&&Number.isFinite(b)?[a,b]:null);out.axes.push(axis);
    }
    if(skipped)out.warnings.push('비유한 좌표·결측 연결 또는 표시 예산을 초과한 요소 '+skipped+'개를 그리지 않았습니다. 결측치를 0으로 채우거나 빈 구간을 연결하지 않았습니다.');
    out.skipped=skipped;out.lineVertices=lineVertices;out.triangles=triangles;return out;
  }
  function mount(host,options={}){
    if(typeof host==='string')host=document.querySelector(host);if(!host)throw Error('P7 3D host is required');
    currentMount?.dispose();const abort=new AbortController(),signal=abort.signal;
    const $=name=>host.querySelector('[data-p7v="'+name+'"]'),buttons=Array.from(host.querySelectorAll('[data-p7v-criterion]'));
    if(!$('canvas-host')||!$('audit'))throw Error('P7 visualization HTML template is missing');
    const media=matchMedia('(prefers-reduced-motion: reduce)'),view=host.closest('.view');
    let model=null,prepared=null,selected=-1,page=0,disposed=false,inViewport=false,loading=false,frame=null,three=null,sceneState=null,lastCriterion='P7-01',frames=0,generation=0,drawnGeneration=-1;
    let labels=[],rows=[],columns=[],notices=[],state='idle',dragStart=null,savedCamera=null,preferCanvas=false,fallbackReason=null;
    const set=(name,value)=>{$(name).textContent=text(value);};
    function cameraSnapshot(){if(!sceneState)return null;const {camera,controls,backend}=sceneState;return backend==='CANVAS2D'?{position:camera.position.slice(),target:camera.target.slice(),up:camera.up.slice(),zoom:camera.zoom}:{position:camera.position.toArray(),target:controls.target.toArray(),up:camera.up.toArray(),zoom:camera.zoom};}
    function audit(){return {schema:'MathScope.M3.P7.VisualizationAudit/1',version:VERSION,criterion:lastCriterion,state,renderer:sceneState?.backend||null,projection:'ORTHOGRAPHIC',fallbackReason,frames,modelRevision:generation,drawnRevision:drawnGeneration,currentModelRendered:!!sceneState&&generation===drawnGeneration,webGLRendered:sceneState?.backend==='WEBGL'&&generation===drawnGeneration,canvasCount:$('canvas-host').querySelectorAll('canvas').length,rendered:prepared?{points:prepared.points.length,lines:prepared.lines.length,lineVertices:prepared.lineVertices,meshes:prepared.meshes.length,triangles:prepared.triangles,enclosures:prepared.enclosures.length}:null,skipped:prepared?.skipped||0,selectedId:prepared?.records[selected]?.item.id||null,reducedMotion:media.matches,continuousAnimation:false,sourceModelStatus:model?.status||null,criterionStatus:model?.criterionStatus||null,displayDomains:prepared?.domains||[],camera:cameraSnapshot(),pixelRatio:sceneState?.pixelRatio||null,drawCalls:sceneState?.backend==='CANVAS2D'?sceneState.drawCalls:sceneState?.renderer.info.render.calls||0,canvasOcclusion:sceneState?.backend==='CANVAS2D'?'PAINTER_DEPTH_ORDER':null,proofStatusPromoted:false,visualApproximation:true};}
    function syncAudit(){host.dataset.p7vReady=state;host.dataset.p7vCriterion=lastCriterion;set('audit',audit());}
    function notice(message){set('notice',message);}
    function sceneNotice(){notice((prepared?.count?prepared.records.length+'개 표시 항목 · 흰 십자는 선택 표시입니다.':'실행된 3D 좌표가 없습니다. 열린 조건과 원본 표를 확인하세요.')+(notices.length?' 표시 제한·생략 내역이 있습니다.':'')+(sceneState?.backend==='CANVAS2D'?' Canvas2D로 같은 3D 좌표를 직교 투영합니다. WebGL 실행 결과가 아닙니다.':''));}
    function active(){return !disposed&&host.isConnected&&!document.hidden&&(!view||view.classList.contains('active'))&&inViewport;}
    function fallback(message,next='fallback'){state=next;$('fallback').hidden=false;set('fallback',message);syncAudit();}
    function stopFrame(){if(frame!==null){cancelAnimationFrame(frame);frame=null;}}
    function disposeTree(root){if(!root)return;const geos=new Set(),mats=new Set();root.traverse(x=>{if(x.geometry)geos.add(x.geometry);for(const m of Array.isArray(x.material)?x.material:[x.material])if(m)mats.add(m);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}
    function releaseScene(){stopFrame();drawnGeneration=-1;if(!sceneState)return;savedCamera=cameraSnapshot();sceneState.listeners.abort();sceneState.ro.disconnect();if(sceneState.backend==='WEBGL'){sceneState.controls.removeEventListener('change',requestRender);sceneState.controls.dispose();disposeTree(sceneState.scene);sceneState.renderer.dispose();}sceneState.canvas.remove();sceneState=null;dragStart=null;labels=[];$('labels').replaceChildren();}
    function transform(p){return p.map((v,i)=>{const [a,b]=prepared.domains[i];if(a===b)return 0;const scale=Math.max(Math.abs(a),Math.abs(b),Number.MIN_VALUE);return ((v/scale-a/scale)/(b/scale-a/scale)-.5)*3.2;});}
    function axisName(i){const a=prepared.axes[i];return ['X','Y','Z'][i]+' · '+(a.label||'미지정 축')+(a.unit?' ('+a.unit+')':'');}
    function projectLabels(){
      if(!sceneState)return;const {camera,canvas,backend}=sceneState,w=sceneState.width||canvas.clientWidth,h=sceneState.height||canvas.clientHeight,placed=[],project=backend==='CANVAS2D'?projection(camera,w,h):null;
      const priority={axis:0,annotation:1,tick:2};
      for(const label of labels.slice().sort((a,b)=>priority[a.el.dataset.kind]-priority[b.el.dataset.kind])){
        const p=project?project(label.position):new three.Vector3(...label.position).project(camera),x=project?p.x:(p.x*.5+.5)*w,y=project?p.y:(-p.y*.5+.5)*h;
        label.el.hidden=(project?p.depth<.01||p.depth>100:p.z<-1||p.z>1)||x<0||x>w||y<0||y>h;if(label.el.hidden)continue;
        const ew=label.el.offsetWidth,eh=label.el.offsetHeight,cx=Math.max(ew/2+5,Math.min(w-ew/2-5,x)),cy=Math.max(eh/2+5,Math.min(h-eh/2-5,y));
        const rect={left:cx-ew/2-3,right:cx+ew/2+3,top:cy-eh/2-3,bottom:cy+eh/2+3};
        label.el.hidden=placed.some(r=>rect.left<r.right&&rect.right>r.left&&rect.top<r.bottom&&rect.bottom>r.top);
        label.el.style.left=cx+'px';label.el.style.top=cy+'px';if(!label.el.hidden)placed.push(rect);
      }
    }
    function requestRender(){if(frame!==null||!sceneState||!active())return;frame=requestAnimationFrame(()=>{frame=null;if(!sceneState||!active()||!sceneState.width||!sceneState.height)return;try{if(sceneState.backend==='CANVAS2D')drawCanvas();else sceneState.renderer.render(sceneState.scene,sceneState.camera);frames++;drawnGeneration=generation;projectLabels();state='ready';$('fallback').hidden=true;sceneNotice();syncAudit();}catch(error){const webgl=sceneState?.backend==='WEBGL';releaseScene();if(webgl){preferCanvas=true;fallbackReason='WEBGL_RENDER_FAILED';openCanvas();}else fallback('3D 투영을 그리지 못했습니다. 원본 표는 유지됩니다. 다시 열기로 재시도하세요.');}});}
    function label(position,value,kind='tick'){if(!sceneState)return;const el=document.createElement('span');el.className='p7v-axis-label';el.dataset.kind=kind;el.textContent=value;$('labels').append(el);labels.push({position:position.slice(),el});}
    function objectLine(vertices,material,recordIndex){const geometry=new three.BufferGeometry().setFromPoints(vertices.map(p=>new three.Vector3(...p)));const line=new three.LineSegments(geometry,material);if(material.isLineDashedMaterial)line.computeLineDistances();if(recordIndex!==undefined)line.userData.recordIndex=recordIndex;return line;}
    function axisGeometry(){
      const axes=[],grid=[];
      for(let i=0;i<3;i++){const a=[-1.6,-1.6,-1.6],b=a.slice();b[i]=1.6;axes.push(a,b);const end=b.slice();end[i]=1.8;label(end,axisName(i),'axis');
        const d=prepared.domains[i]||[0,0],ticks=Array.isArray(prepared.axes[i].ticks)?prepared.axes[i].ticks.slice(0,6):[0,.5,1].map(t=>({value:d[0]*(1-t)+d[1]*t,label:number(d[0]*(1-t)+d[1]*t)}));
        const used=new Set();for(const tick of ticks){if(!Number.isFinite(tick.value)||used.has(tick.value))continue;used.add(tick.value);const p=a.slice(),domain=prepared.domains[i];if(!domain)continue;const scale=Math.max(Math.abs(domain[0]),Math.abs(domain[1]),Number.MIN_VALUE);p[i]=domain[0]===domain[1]?0:((tick.value/scale-domain[0]/scale)/(domain[1]/scale-domain[0]/scale)-.5)*3.2;label(p,String(tick.label??number(tick.value)));}
      }
      for(const n of [-1.6,-.8,0,.8,1.6])grid.push([n,-1.6,-1.6],[n,-1.6,1.6],[-1.6,-1.6,n],[1.6,-1.6,n]);
      return {axes,grid};
    }
    function makeAxes(group){
      const {axes,grid}=axisGeometry();group.add(objectLine(axes,new three.LineBasicMaterial({color:'#577481'})));group.add(objectLine(grid,new three.LineBasicMaterial({color:'#294450',transparent:true,opacity:.5})));
    }
    function select(index){
      if(!prepared?.records.length)index=-1;else index=Math.max(-1,Math.min(prepared.records.length-1,index));selected=index;
      $('selection').value=index<0?'':String(index);const record=prepared?.records[index];
      if(record){set('selection-summary',(record.item.label||record.item.id||'항목')+' · '+record.kind+(record.item.collapseToDisplayPoint?' · 표시 좌표에서 구간 경계가 겹칩니다. 원본 폭을 확인하세요.':''));set('selection-detail',short({exact:record.item.exact,source:record.item.source,displayCoordinates:record.item.position||record.item.vertices||{min:record.item.min,max:record.item.max},visualApproximation:true,proofStatusPromoted:false}));}
      else{set('selection-summary','선택한 항목이 없습니다.');set('selection-detail','');}
      if(sceneState){if(sceneState.backend==='WEBGL'&&sceneState.selection){sceneState.selection.visible=!!record;if(record)sceneState.selection.position.set(...transform(record.center));}requestRender();}syncAudit();
    }
    function applyCamera(value){
      if(!sceneState)return;const {camera,controls,backend}=sceneState;
      if(backend==='CANVAS2D'){camera.position=value.position.slice();camera.target=value.target.slice();camera.up=value.up.slice();camera.zoom=value.zoom;}
      else{controls.target.set(...value.target);camera.position.set(...value.position);camera.up.set(...value.up);camera.zoom=value.zoom;camera.updateProjectionMatrix();camera.lookAt(...value.target);controls.update();}
      requestRender();
    }
    function resetCamera(mode='reset'){
      applyCamera({position:mode==='front'?[0,0,7]:mode==='top'?[0,7,.001]:[5.1,3.5,5.7],target:[0,0,0],up:mode==='top'?[0,0,-1]:[0,1,0],zoom:1});
    }
    function zoom(factor){const camera=cameraSnapshot();if(camera){camera.zoom=Math.max(.4,Math.min(8,camera.zoom*factor));applyCamera(camera);}}
    function rotateCamera(thetaDelta,phiDelta){
      const camera=cameraSnapshot();if(!camera)return;const up=unit(camera.up),reference=Math.abs(up[2])<.9?[0,0,1]:[0,1,0],z=unit(minus(reference,up.map(v=>v*dot(reference,up)))),x=cross(up,z),offset=minus(camera.position,camera.target),r=Math.hypot(...offset);
      const theta=Math.atan2(dot(offset,x),dot(offset,z))+thetaDelta,phi=Math.max(.025,Math.min(Math.PI-.025,Math.acos(Math.max(-1,Math.min(1,dot(offset,up)/r)))+phiDelta));
      camera.position=camera.target.map((v,i)=>v+r*(x[i]*Math.sin(phi)*Math.sin(theta)+up[i]*Math.cos(phi)+z[i]*Math.sin(phi)*Math.cos(theta)));applyCamera(camera);
    }
    function panCamera(dx,dy){
      const camera=cameraSnapshot();if(!camera||!sceneState.height)return;const basis=viewBasis(camera),scale=5.4/(sceneState.height*camera.zoom),delta=basis.right.map((v,i)=>-dx*scale*v+dy*scale*basis.up[i]);
      camera.position=camera.position.map((v,i)=>v+delta[i]);camera.target=camera.target.map((v,i)=>v+delta[i]);applyCamera(camera);
    }
    function buildGeometry(){
      if(!sceneState||!prepared)return;drawnGeneration=-1;if(sceneState.backend==='CANVAS2D'){buildCanvasGeometry();return;}const {scene}=sceneState;
      if(sceneState.group){scene.remove(sceneState.group);disposeTree(sceneState.group);}const group=new three.Group();sceneState.group=group;scene.add(group);labels=[];$('labels').replaceChildren();sceneState.pickables=[];makeAxes(group);
      if(prepared.points.length){
        const positions=[],colors=[];for(const p of prepared.points){positions.push(...transform(p.p));const c=new three.Color(color(p.item));colors.push(c.r,c.g,c.b);}
        const geometry=new three.BufferGeometry();geometry.setAttribute('position',new three.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new three.Float32BufferAttribute(colors,3));
        const points=new three.Points(geometry,new three.PointsMaterial({size:7,sizeAttenuation:false,vertexColors:true}));points.userData.pointIndices=prepared.points.map(p=>p.index);group.add(points);sceneState.pickables.push(points);
      }
      for(const line of prepared.lines){const material=line.item.dashed||line.item.role==='open'?new three.LineDashedMaterial({color:color(line.item),dashSize:.07,gapSize:.045}):new three.LineBasicMaterial({color:color(line.item)});const object=objectLine(line.segments.map(transform),material,line.index);group.add(object);sceneState.pickables.push(object);}
      for(const mesh of prepared.meshes){const geometry=new three.BufferGeometry();geometry.setAttribute('position',new three.Float32BufferAttribute(mesh.vertices.flatMap(transform),3));const object=new three.Mesh(geometry,new three.MeshBasicMaterial({color:color(mesh.item),side:three.DoubleSide,transparent:true,opacity:.6,wireframe:!!mesh.item.wireframe}));object.userData.recordIndex=mesh.index;group.add(object);sceneState.pickables.push(object);}
      for(const enclosure of prepared.enclosures){
        const a=transform(enclosure.min),b=transform(enclosure.max),size=a.map((v,i)=>Math.max(0,b[i]-v)),center=a.map((v,i)=>(v+b[i])/2),geometry=new three.BoxGeometry(...size);
        const object=new three.LineSegments(new three.EdgesGeometry(geometry),new three.LineBasicMaterial({color:color(enclosure.item)}));geometry.dispose();object.position.set(...center);object.userData.recordIndex=enclosure.index;group.add(object);sceneState.pickables.push(object);
        if(size.every(v=>v===0)){const g=new three.BufferGeometry().setFromPoints([new three.Vector3(...center)]),p=new three.Points(g,new three.PointsMaterial({color:color(enclosure.item),size:6,sizeAttenuation:false}));p.userData.recordIndex=enclosure.index;group.add(p);sceneState.pickables.push(p);}
      }
      const cross=[];for(let i=0;i<3;i++){const a=[0,0,0],b=[0,0,0];a[i]=-.075;b[i]=.075;cross.push(a,b);}const selection=objectLine(cross,new three.LineBasicMaterial({color:'#ffffff',depthTest:false}));selection.renderOrder=10;group.add(selection);sceneState.selection=selection;selection.visible=false;
      for(const entry of (Array.isArray(model.labels)?model.labels:[]).slice(0,LIMITS.labels))if(xyz(entry.position))label(transform(entry.position),String(entry.text||entry.label||''),'annotation');
      select(selected);requestRender();
    }
    // Both backends consume the same finite, bounded prepared geometry. No
    // interpolation bridges missing coordinates and no mathematical data changes.
    function buildCanvasGeometry(){
      labels=[];$('labels').replaceChildren();const {axes,grid}=axisGeometry(),geometry=[],background=[];
      const segments=(target,vertices,style)=>{for(let i=0;i<vertices.length;i+=2)target.push({kind:'line',vertices:vertices.slice(i,i+2),...style});};
      segments(background,grid,{color:'#294450',opacity:.5});segments(background,axes,{color:'#577481'});
      for(const point of prepared.points)geometry.push({kind:'point',vertices:[transform(point.p)],color:color(point.item),index:point.index,radius:3.5});
      for(const line of prepared.lines)segments(geometry,line.segments.map(transform),{color:color(line.item),index:line.index,dashed:line.item.dashed||line.item.role==='open'});
      for(const mesh of prepared.meshes){const vertices=mesh.vertices.map(transform);for(let i=0;i<vertices.length;i+=3)geometry.push({kind:'triangle',vertices:vertices.slice(i,i+3),color:color(mesh.item),index:mesh.index,wireframe:!!mesh.item.wireframe,opacity:.6});}
      for(const enclosure of prepared.enclosures){
        const a=transform(enclosure.min),b=transform(enclosure.max),corners=Array.from({length:8},(_,i)=>[0,1,2].map(axis=>i&(1<<axis)?b[axis]:a[axis])),vertices=[];
        for(let i=0;i<8;i++)for(let axis=0;axis<3;axis++)if(!(i&(1<<axis)))vertices.push(corners[i],corners[i|(1<<axis)]);
        segments(geometry,vertices,{color:color(enclosure.item),index:enclosure.index});
        if(a.every((v,i)=>v===b[i]))geometry.push({kind:'point',vertices:[a],color:color(enclosure.item),index:enclosure.index,radius:3});
      }
      sceneState.geometry=geometry;sceneState.background=background;sceneState.projected=[];
      for(const entry of (Array.isArray(model.labels)?model.labels:[]).slice(0,LIMITS.labels))if(xyz(entry.position))label(transform(entry.position),String(entry.text||entry.label||''),'annotation');
      select(selected);requestRender();
    }
    function drawCanvas(){
      const s=sceneState,{context:ctx,width:w,height:h,camera,pixelRatio}=s,project=projection(camera,w,h);s.drawCalls=0;
      ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#06131c';ctx.fillRect(0,0,w,h);ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
      const projectPrimitive=entry=>{const vertices=entry.vertices.map(project);return {...entry,vertices,depth:vertices.reduce((sum,p)=>sum+p.depth,0)/vertices.length};};
      const visible=entry=>entry.vertices.every(p=>p.depth>=.01&&p.depth<=100)&&Math.min(...entry.vertices.map(p=>p.x))<=w+4&&Math.max(...entry.vertices.map(p=>p.x))>=-4&&Math.min(...entry.vertices.map(p=>p.y))<=h+4&&Math.max(...entry.vertices.map(p=>p.y))>=-4;
      const draw=entry=>{
        ctx.globalAlpha=entry.opacity??1;ctx.strokeStyle=ctx.fillStyle=entry.color;ctx.lineWidth=entry.selected?2:1.3;ctx.setLineDash(entry.dashed?[6,4]:[]);ctx.beginPath();const [first]=entry.vertices;
        if(entry.kind==='point'){ctx.arc(first.x,first.y,entry.radius,0,Math.PI*2);ctx.fill();}
        else{ctx.moveTo(first.x,first.y);for(const p of entry.vertices.slice(1))ctx.lineTo(p.x,p.y);if(entry.kind==='triangle')ctx.closePath();if(entry.kind==='triangle'&&!entry.wireframe)ctx.fill();else ctx.stroke();}s.drawCalls++;
      };
      s.background.map(projectPrimitive).filter(visible).forEach(draw);
      // Painter ordering is a display approximation, explicitly reported in the
      // audit. Exact intervals, witnesses and source fields remain in HTML.
      s.projected=s.geometry.map(projectPrimitive).filter(visible).sort((a,b)=>b.depth-a.depth);s.projected.forEach(draw);
      const record=prepared.records[selected];if(record){const center=transform(record.center);for(let i=0;i<3;i++){const a=center.slice(),b=center.slice();a[i]-=.075;b[i]+=.075;const mark=projectPrimitive({kind:'line',vertices:[a,b],color:'#ffffff',selected:true});if(visible(mark))draw(mark);}}
      ctx.restore();ctx.globalAlpha=1;ctx.setLineDash([]);
    }
    function pick(event){
      if(!sceneState||drawnGeneration!==generation||!dragStart||dragStart.moved||Math.hypot(event.clientX-dragStart.x,event.clientY-dragStart.y)>5)return;
      const rect=sceneState.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
      if(sceneState.backend==='CANVAS2D'){
        const pointer={x:(event.clientX-rect.left)*sceneState.width/rect.width,y:(event.clientY-rect.top)*sceneState.height/rect.height},radius=event.pointerType==='touch'?22:10;let best=null;
        for(const entry of sceneState.projected){const v=entry.vertices;let distance;
          if(entry.kind==='point')distance=Math.hypot(pointer.x-v[0].x,pointer.y-v[0].y);
          else if(entry.kind==='triangle'&&!entry.wireframe&&triangleContains(pointer,v))distance=0;
          else distance=Math.min(...(entry.kind==='triangle'?[0,1,2]:[0]).map(i=>segmentDistance(pointer,v[i],v[(i+1)%v.length])));
          if(distance<=radius&&(!best||distance<best.distance-1e-8||(Math.abs(distance-best.distance)<=1e-8&&entry.depth<best.depth)))best={distance,depth:entry.depth,index:entry.index};
        }if(best)select(best.index);return;
      }
      const pointer=new three.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),ray=new three.Raycaster();ray.params.Points.threshold=.065;ray.params.Line.threshold=.035;ray.setFromCamera(pointer,sceneState.camera);const hit=ray.intersectObjects(sceneState.pickables,false)[0];if(hit)select(hit.object.userData.pointIndices?hit.object.userData.pointIndices[hit.index]:hit.object.userData.recordIndex);
    }
    function bindInput(canvas,sceneSignal,canvasOrbit=false){
      const finish=event=>{if(!dragStart||event.pointerId!==dragStart.id)return;dragStart=null;if(canvasOrbit&&canvas.hasPointerCapture?.(event.pointerId))try{canvas.releasePointerCapture(event.pointerId);}catch{}};
      canvas.addEventListener('pointerdown',event=>{if(event.isPrimary===false||event.button!==0)return;dragStart={x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,id:event.pointerId,moved:false};if(canvasOrbit)try{canvas.setPointerCapture(event.pointerId);}catch{}},{signal:sceneSignal});
      canvas.addEventListener('pointermove',event=>{if(!dragStart||event.pointerId!==dragStart.id)return;const dx=event.clientX-dragStart.lastX,dy=event.clientY-dragStart.lastY;dragStart.moved=dragStart.moved||Math.hypot(event.clientX-dragStart.x,event.clientY-dragStart.y)>5;dragStart.lastX=event.clientX;dragStart.lastY=event.clientY;if(canvasOrbit&&dragStart.moved){if(event.shiftKey)panCamera(dx,dy);else rotateCamera(-dx*.008,-dy*.008);event.preventDefault();}},{signal:sceneSignal});
      canvas.addEventListener('pointerup',event=>{if(!dragStart||event.pointerId!==dragStart.id)return;pick(event);finish(event);},{signal:sceneSignal});
      canvas.addEventListener('pointercancel',finish,{signal:sceneSignal});canvas.addEventListener('lostpointercapture',finish,{signal:sceneSignal});
      canvas.addEventListener('keydown',event=>{if(!sceneState)return;let handled=true;
        if(event.key==='ArrowLeft')rotateCamera(-.13,0);else if(event.key==='ArrowRight')rotateCamera(.13,0);else if(event.key==='ArrowUp')rotateCamera(0,-.13);else if(event.key==='ArrowDown')rotateCamera(0,.13);else if(event.key==='+'||event.key==='=')zoom(1.2);else if(event.key==='-')zoom(1/1.2);else if(event.key==='Home')resetCamera();else if(event.key==='[')select(selected-1);else if(event.key===']')select(selected+1);else if(event.key==='Escape')select(-1);else handled=false;
        if(handled)event.preventDefault();
      },{signal:sceneSignal});
    }
    function accessibleCanvas(canvas){canvas.tabIndex=0;canvas.style.touchAction='pan-y pinch-zoom';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','P7 표시용 3D 좌표의 직교 투영. 방향키로 회전, +와 -로 확대·축소, Home으로 초기화합니다. 정확한 값은 동일 데이터 표를 읽으세요.');canvas.setAttribute('aria-describedby','p7v-navigation-help p7v-scale-note');}
    function openCanvas(){
      if(!active()||!prepared?.count||sceneState)return;
      const canvas=document.createElement('canvas');let context;
      try{
        context=canvas.getContext('2d');if(!context)throw Error('Canvas2D unavailable');accessibleCanvas(canvas);
        const camera={position:[5.1,3.5,5.7],target:[0,0,0],up:[0,1,0],zoom:1},listeners=new AbortController(),pixelRatio=Math.min(globalThis.devicePixelRatio||1,1.5);
        const resize=()=>{if(sceneState?.canvas!==canvas)return;const width=$('scene').clientWidth,height=$('scene').clientHeight;if(!width||!height){sceneState.width=sceneState.height=0;drawnGeneration=-1;return;}canvas.style.width=width+'px';canvas.style.height=height+'px';canvas.width=Math.round(width*pixelRatio);canvas.height=Math.round(height*pixelRatio);sceneState.width=width;sceneState.height=height;requestRender();};
        const ro=new ResizeObserver(resize);sceneState={backend:'CANVAS2D',canvas,context,camera,listeners,ro,pixelRatio,width:0,height:0,drawCalls:0,geometry:[],background:[],projected:[]};drawnGeneration=-1;$('canvas-host').append(canvas);ro.observe($('scene'));bindInput(canvas,listeners.signal,true);resize();if(savedCamera)applyCamera(savedCamera);else resetCamera();buildGeometry();
      }catch(error){releaseScene();canvas.remove();fallback('이 환경에서 3D 투영을 열지 못했습니다. 동일 데이터 표·원본·출처를 계속 확인할 수 있습니다.');}
    }
    async function ensureScene(){
      if(!active()||!prepared?.count||sceneState||loading)return;if(preferCanvas){openCanvas();return;}loading=true;state='loading';fallback('3D 엔진을 준비하고 있습니다. 원본 표는 바로 읽을 수 있습니다.','loading');let pendingRenderer=null,pendingControls=null;
      try{
        const [T,orbit]=await modules();if(!active()||!prepared?.count)return;three=T;
        const renderer=pendingRenderer=new three.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:false}),pixelRatio=Math.min(globalThis.devicePixelRatio||1,1.5);renderer.setPixelRatio(pixelRatio);renderer.setClearColor('#06131c',1);
        const scene=new three.Scene(),camera=new three.OrthographicCamera(-3,3,3,-3,.01,100),canvas=renderer.domElement;accessibleCanvas(canvas);$('canvas-host').append(canvas);
        const controls=pendingControls=new orbit.OrbitControls(camera,canvas);controls.enableDamping=false;controls.enableZoom=false;controls.minPolarAngle=.025;controls.maxPolarAngle=Math.PI-.025;
        const resize=()=>{if(sceneState?.canvas!==canvas)return;const width=$('scene').clientWidth,height=$('scene').clientHeight;if(!width||!height){sceneState.width=sceneState.height=0;drawnGeneration=-1;return;}renderer.setSize(width,height,false);sceneState.width=width;sceneState.height=height;const aspect=width/height;camera.left=-2.7*aspect;camera.right=2.7*aspect;camera.top=2.7;camera.bottom=-2.7;camera.updateProjectionMatrix();requestRender();};
        const ro=new ResizeObserver(resize),listeners=new AbortController(),sceneSignal=listeners.signal;sceneState={backend:'WEBGL',scene,camera,canvas,renderer,controls,ro,listeners,pixelRatio,width:0,height:0,group:null,pickables:[],selection:null};drawnGeneration=-1;fallbackReason=null;ro.observe($('scene'));controls.addEventListener('change',requestRender);bindInput(canvas,sceneSignal);
        canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();releaseScene();preferCanvas=true;fallbackReason='WEBGL_CONTEXT_LOST';openCanvas();},{signal:sceneSignal});
        resize();if(savedCamera)applyCamera(savedCamera);else resetCamera();buildGeometry();
      }catch(error){if(sceneState)releaseScene();else{pendingControls?.dispose();pendingRenderer?.dispose();pendingRenderer?.domElement.remove();}preferCanvas=true;fallbackReason='WEBGL_UNAVAILABLE';openCanvas();}
      finally{loading=false;syncAudit();}
    }
    function renderTable(){
      const count=rows.length,pages=Math.max(1,Math.ceil(count/LIMITS.tablePage));page=Math.max(0,Math.min(page,pages-1));$('table-head').replaceChildren();$('table-body').replaceChildren();const header=document.createElement('tr');for(const name of columns){const th=document.createElement('th');th.scope='col';th.textContent=String(name);header.append(th);}$('table-head').append(header);
      for(const row of rows.slice(page*LIMITS.tablePage,(page+1)*LIMITS.tablePage)){const tr=document.createElement('tr');for(let i=0;i<columns.length;i++){const td=document.createElement('td'),pre=document.createElement('pre');pre.textContent=short(Array.isArray(row)?row[i]:row?.[columns[i]],12000);td.append(pre);tr.append(td);}$('table-body').append(tr);}
      set('table-page',count+'개 항목 · '+(page+1)+' / '+pages+'쪽');host.querySelector('[data-p7v-action="table-previous"]').disabled=page===0;host.querySelector('[data-p7v-action="table-next"]').disabled=page>=pages-1;
    }
    function renderDOM(){
      set('title',model.title||lastCriterion);set('status',(model.criterionStatus||'OPEN')+' · '+(model.status==='RECORDED_EVIDENCE_VISUALIZED'?'기록 시각화':model.status||'실행 전'));set('summary',model.summary||'정확한 원본 값과 표시용 좌표를 구분하여 읽으세요.');set('table-caption',lastCriterion+' · '+(model.title||'원본 데이터'));set('provenance',short({provenance:model.provenance,proofStatusPromoted:false,visualApproximation:true},64000));
      $('axes').replaceChildren();prepared.axes.forEach((axis,i)=>{const row=document.createElement('div');row.className='p7v-axis-description';const strong=document.createElement('strong');strong.textContent=axisName(i);row.append(strong);const d=prepared.domains[i];row.append(document.createTextNode((axis.type==='category'?'범주':axis.type==='schematic'?'관계 도식':'수치 좌표')+' · '+(d?number(d[0])+' → '+number(d[1]):'실행 좌표 없음')));$('axes').append(row);});
      const omissions=[...(Array.isArray(model.omissions)?model.omissions:[]),...(Array.isArray(model.caveats)?model.caveats:[]),...prepared.warnings];$('omissions').replaceChildren();for(const message of omissions.length?omissions:['표시 모델에 추가 생략 항목이 없습니다. 전체 P7 완료나 새로운 증명은 발급하지 않습니다.']){const li=document.createElement('li');li.textContent=short(message,3000);$('omissions').append(li);}
      $('selection').replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='선택 안 함';$('selection').append(empty);for(const record of prepared.records){const option=document.createElement('option');option.value=String(record.index);option.textContent=record.kind+' · '+(record.item.label||record.item.id||record.index);$('selection').append(option);}
      if(model.table&&Array.isArray(model.table.columns)&&Array.isArray(model.table.rows)){columns=model.table.columns;rows=model.table.rows;}
      else{columns=['표시 항목','유형','정확한 원본','출처'];rows=prepared.records.map(r=>[r.item.label||r.item.id,r.kind,r.item.exact,r.item.source]);}
      page=0;renderTable();set('table-note','원본 표는 3D 사용 가능 여부와 관계없이 유지됩니다. 좌표를 만들지 못한 조건은 OPEN으로 남으며, 미실행 값을 0으로 채우지 않습니다.');select(-1);
      notices=prepared.warnings;sceneNotice();
    }
    function setCriterion(id,notify=false){if(!criterionOK(id))return false;lastCriterion=id;for(const b of buttons){const selected=b.dataset.p7vCriterion===id;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;}host.querySelector('[role="tabpanel"]').setAttribute('aria-labelledby','p7v-tab-'+id.slice(-2));syncAudit();if(notify)options.onSelect?.(id);return true;}
    function clear(message='입력·소스가 바뀌었습니다. 새 실행 결과를 연결하세요.'){
      generation++;model=null;prepared=null;selected=-1;rows=[];columns=[];releaseScene();savedCamera=null;fallback(message,'empty');set('status','NOT_RUN');set('summary',message);set('selection-summary','선택한 항목이 없습니다.');set('selection-detail','');set('provenance','');$('selection').replaceChildren();$('axes').replaceChildren();$('omissions').replaceChildren();renderTable();notice(message);syncAudit();
    }
    function setModel(value){
      let next;try{next=prepare(value);}catch(error){clear(error.message);return {ok:false,error:error.message};}
      generation++;const changed=model?.criterion!==value.criterion;if(changed)savedCamera=null;model=value;prepared=next;setCriterion(value.criterion);renderDOM();fallback('선택한 조건의 3D 좌표를 준비하고 있습니다.','prepared');if(!next.count){releaseScene();savedCamera=null;fallback('이 조건에는 실행된 수치 좌표가 없습니다. 미실행 값은 0이 아닙니다. 아래 표에서 OPEN 조건을 확인하세요.','empty');}
      else if(sceneState){buildGeometry();if(changed)resetCamera();}else ensureScene();syncAudit();return {ok:true,items:next.records.length,skipped:next.skipped};
    }
    function visibility(){if(!active()){stopFrame();if(view&&!view.classList.contains('active')){releaseScene();if(prepared?.count)fallback('다시 열면 선택한 조건의 3D를 복구합니다.','inactive');}}else if(sceneState)requestRender();else ensureScene();}
    for(const b of buttons){b.addEventListener('click',()=>setCriterion(b.dataset.p7vCriterion,true),{signal});b.addEventListener('keydown',e=>{let i=buttons.indexOf(b);if(e.key==='ArrowRight')i=(i+1)%buttons.length;else if(e.key==='ArrowLeft')i=(i+buttons.length-1)%buttons.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=buttons.length-1;else return;e.preventDefault();buttons[i].focus();setCriterion(buttons[i].dataset.p7vCriterion,true);},{signal});}
    $('selection').addEventListener('change',()=>select($('selection').value===''?-1:Number($('selection').value)),{signal});
    for(const b of host.querySelectorAll('[data-p7v-action]'))b.addEventListener('click',()=>{const action=b.dataset.p7vAction;if(action==='reset'||action==='front'||action==='top')resetCamera(action);else if(action==='zoom-in')zoom(1.2);else if(action==='zoom-out')zoom(1/1.2);else if(action==='previous')select(selected-1);else if(action==='next')select(selected+1);else if(action==='table-previous'){page--;renderTable();}else if(action==='table-next'){page++;renderTable();}else if(action==='retry'){releaseScene();preferCanvas=false;ensureScene();}},{signal});
    const io=new IntersectionObserver(entries=>{inViewport=entries.some(e=>e.isIntersecting);visibility();},{rootMargin:'100px'});io.observe($('scene'));
    const mo=new MutationObserver(visibility);if(view)mo.observe(view,{attributes:true,attributeFilter:['class']});
    document.addEventListener('visibilitychange',visibility,{signal});window.addEventListener('pagehide',()=>{releaseScene();state='inactive';syncAudit();},{signal});window.addEventListener('pageshow',visibility,{signal});media.addEventListener?.('change',syncAudit,{signal});
    function dispose(){if(disposed)return;disposed=true;abort.abort();io.disconnect();mo.disconnect();releaseScene();model=null;prepared=null;rows=[];state='disposed';syncAudit();if(currentMount===api)currentMount=null;}
    const api={setModel,setCriterion,clear,dispose,audit};currentMount=api;syncAudit();return api;
  }
  window.MathScopeP7Visualization={version:VERSION,mount,inspectModel(model){const value=prepare(model);return {items:value.records.length,geometryCount:value.count,domains:value.domains,skipped:value.skipped,warnings:value.warnings,proofStatusPromoted:false,visualApproximation:true};}};
})();
