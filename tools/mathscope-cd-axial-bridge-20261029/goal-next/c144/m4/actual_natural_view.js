(() => {
  'use strict';
  const root=document.getElementById('ms-natural-solution');if(!root||root.dataset.initialized)return;root.dataset.initialized='true';
  const $=id=>document.getElementById('ms-natural-'+id),canvas=$('canvas'),ctx=canvas.getContext('2d');
  const defaults={component:'phi_core',mode:'surface',layer:16,az:-.72,el:.58};
  let view={...defaults},grid=null,bytes=null,ready=false,request=0,queued=false,drag=null,frame=0,dialog=null;
  const fullHash=root.dataset.runHash;
  const finite=(x,d,l,h)=>Number.isFinite(Number(x))?Math.max(l,Math.min(h,Number(x))):d;
  const number=s=>{const p=String(s).split('/'),n=Number(p[0])/(p[1]?Number(p[1]):1);if(!Number.isFinite(n))throw Error('표시할 유리수의 범위 오류');return n;};
  const interval=x=>{if(!Array.isArray(x)||x.length!==2)throw Error('구간 형식 오류');const p=x.map(number);if(p[0]>p[1])throw Error('구간 순서 오류');return p;};
  const decode=id=>Uint8Array.from(atob(document.getElementById(id).textContent.trim()),c=>c.charCodeAt(0));
  const sha=async raw=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',raw))].map(n=>n.toString(16).padStart(2,'0')).join('');
  const midpoint=p=>(p[0]+p[1])/2;
  function status(text,kind){root.dataset.status=kind;$('status').textContent=text;}
  function readView(){
    if(!location.hash.startsWith('#m3-natural'))return;
    const p=new URLSearchParams(location.hash.split('?')[1]||'');
    if(p.has('run')&&p.get('run')!==fullHash)throw Error('이 보기 링크의 실행이 다릅니다. 초기화하면 현재 실행으로 복구합니다.');
    view={component:['phi_core','phi_wide','u'].includes(p.get('component'))?p.get('component'):'phi_core',mode:p.get('mode')==='slice'?'slice':'surface',
      layer:Math.round(finite(p.get('layer')??16,16,0,16)),az:finite(p.get('az')??defaults.az,defaults.az,-100,100),el:finite(p.get('el')??defaults.el,defaults.el,.15,1.25)};
  }
  function writeView(){const p=new URLSearchParams({run:fullHash,component:view.component,mode:view.mode,layer:view.layer,az:view.az.toFixed(3),el:view.el.toFixed(3)});history.replaceState(null,'',location.pathname+location.search+'#m3-natural?'+p);}
  function openHash(){if(!location.hash.startsWith('#m3-natural'))return;root.open=true;if(dialog&&!dialog.open)dialog.showModal();schedule();setTimeout(()=>root.scrollIntoView({block:'start',behavior:'instant'}),80);}
  function dataset(){
    if(view.component==='u')return {xs:grid.eta,frames:grid.u,axis:'η',height:'actual natural u/K',extent:grid.uExtent,min:-1,max:1};
    const core=view.component==='phi_core',indices=grid.xi.map((x,i)=>i).filter(i=>!core||Math.abs(grid.xi[i]+2/9)<=12/9000+1e-13);
    return {xs:indices.map(i=>core?9000*(grid.xi[i]+2/9):grid.xi[i]),frames:grid.phi.map(row=>indices.map(i=>row[i])),
      axis:core?'s = 9000(η/h⁴ + 2/9)':'ξ = η/h⁴',height:'actual natural Phi',extent:1.05,min:core?-12:-.5,max:core?12:.25};
  }
  function path(points,fill,stroke='#ffffff70'){
    if(!points.length)return;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))ctx.lineTo(p[0],p[1]);
    if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function draw(){
    queued=false;if(!ready||!root.open||!ctx)return;const start=performance.now(),rect=canvas.getBoundingClientRect();if(rect.width<10)return;
    const w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle='#fbfdfb';ctx.fillRect(0,0,w,h);ctx.lineWidth=.7;
    const data=dataset(),Y=grid.ys[view.layer],scale=Math.min(w/4.3,(h-74)/3.7),ox=w/2,oy=(h-60)/2+20;
    const project=(x,y,v)=>{const a=((x-data.min)/(data.max-data.min)*2-1)*1.1,d=(y/4.1-.5)*1.65,z=v/data.extent*1.3;
      const p=a*Math.cos(view.az)-d*Math.sin(view.az),q=a*Math.sin(view.az)+d*Math.cos(view.az);
      return [ox+p*scale,oy+(q*Math.sin(view.el)-z*Math.cos(view.el))*scale,q*Math.cos(view.el)+z*Math.sin(view.el)];};
    const label=(s,p,align='left',dx=4,dy=-4)=>{ctx.font='11px system-ui';ctx.fillStyle='#284d40';ctx.textAlign=align;ctx.fillText(s,p[0]+dx,p[1]+dy);};
    if(view.mode==='surface'){
      for(let i=0;i<=4;i++){const x=data.min+(data.max-data.min)*i/4;path([project(x,0,0),project(x,Y,0)],null,'#bbcec2');}
      for(let i=0;i<=4;i++){const y=Y*i/4;path([project(data.min,y,0),project(data.max,y,0)],null,'#bbcec2');}
      const faces=[];
      for(let j=0;j<view.layer;j++)for(let i=0;i<data.xs.length-1;i++){
        const values=[data.frames[j][i],data.frames[j][i+1],data.frames[j+1][i+1],data.frames[j+1][i]].map(midpoint);
        const ps=[project(data.xs[i],grid.ys[j],values[0]),project(data.xs[i+1],grid.ys[j],values[1]),project(data.xs[i+1],grid.ys[j+1],values[2]),project(data.xs[i],grid.ys[j+1],values[3])];
        faces.push({ps,depth:ps.reduce((s,p)=>s+p[2],0)/4,v:values.reduce((a,b)=>a+b,0)/4/data.extent});
      }
      faces.sort((a,b)=>b.depth-a.depth);for(const f of faces){const t=Math.min(1,Math.abs(f.v));path(f.ps,f.v>=0?`rgba(28,${120+Math.round(t*40)},125,.78)`:`rgba(190,${119+Math.round(t*23)},48,.78)`,'#ffffff50');}
      ctx.lineWidth=1.2;path([project(data.min,0,0),project(data.max,0,0)],null,'#47685a');path([project(data.min,0,0),project(data.min,Y,0)],null,'#47685a');
      const lower=view.component==='u'?-data.extent:0;path([project(data.min,0,lower),project(data.min,0,data.extent)],null,'#8a9e92');
      const digits=view.component==='u'?1:2;label(lower.toFixed(digits),project(data.min,0,lower),'right',-8,4);label(data.extent.toFixed(digits),project(data.min,0,data.extent),'right',-8,4);
      label(String(data.min),project(data.min,0,0),'left',8,14);label(String(data.max),project(data.max,0,0));if(view.layer>0)label('Y = '+Y.toFixed(5),project(data.min,Y,0),'left',8,14);
      if(view.layer===0)path(data.xs.map((x,i)=>project(x,0,midpoint(data.frames[0][i]))),null,'#18685b');
    }else{
      const left=38,right=w-14,top=30,bottom=h-74,minZ=view.component==='u'?-data.extent:0,maxZ=data.extent;
      const sx=x=>left+(x-data.min)/(data.max-data.min)*(right-left),sy=z=>bottom-(z-minZ)/(maxZ-minZ)*(bottom-top);
      path([[left,sy(0)],[right,sy(0)]],null,'#9fb6a9');const row=data.frames[view.layer];
      path([...row.map((p,i)=>[sx(data.xs[i]),sy(p[0])]),...row.map((p,i)=>[sx(data.xs[i]),sy(p[1])]).reverse()],'#b7d4c790',null);
      ctx.lineWidth=2;path(row.map((p,i)=>[sx(data.xs[i]),sy(midpoint(p))]),null,'#18685b');
      label(String(data.min),[left,bottom+19]);label(String(data.max),[right,bottom+19],'right',0,-4);
      const digits=view.component==='u'?1:2;label(minZ.toFixed(digits),[left,bottom],'right',-6,0);label(maxZ.toFixed(digits),[left,top],'right',-6,0);
    }
    ctx.font='12px system-ui';ctx.textAlign='left';ctx.fillStyle='#244f40';ctx.fillText(data.height+' · '+data.axis,12,20);
    ctx.font='10px system-ui';ctx.fillStyle='#6a5a35';ctx.fillText('CONDITIONAL · 실제 natural 해 / 최종 A–D 속도장 아님',10,h-39);
    ctx.font='9px ui-monospace,monospace';ctx.fillStyle='#587063';ctx.fillText(fullHash.slice(0,32),10,h-24);ctx.fillText(fullHash.slice(32),10,h-11);
    root.dataset.frame=String(++frame);root.dataset.renderMode='CPU_CANVAS_2D';root.dataset.component=view.component;root.dataset.viewMode=view.mode;root.dataset.layer=String(view.layer);root.dataset.lastDrawMs=(performance.now()-start).toFixed(3);
    $('y-label').textContent=Y.toFixed(5);$('readout').textContent=data.height+' · '+data.axis+' · '+data.xs.length+'개 축 샘플 × '+(view.layer+1)+'개 Y층 · 비선형 correction 포함';
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(draw);}}
  function update(){if(!ready)return;view.component=$('component').value;view.mode=$('mode').value;view.layer=Number($('y').value);writeView();schedule();}
  const displayInterval=p=>{const magnitude=Math.max(...p.map(Math.abs)),unit=10**(Math.floor(Math.log10(magnitude||1))-6);return '['+((Math.floor(p[0]/unit)-1)*unit).toExponential(6)+', '+((Math.ceil(p[1]/unit)+1)*unit).toExponential(6)+']';};
  async function initialize(){
    const current=++request;ready=false;canvas.hidden=true;$('json').disabled=$('png').disabled=true;status('계산과 두 부모 실행의 해시를 확인하고 있습니다.','loading');
    try{
      const raw=decode('ms-natural-payload');if(await sha(raw)!==root.dataset.payloadSha)throw Error('실제 해 실행 파일의 해시가 다릅니다. 표시와 내보내기를 중단했습니다.');
      const data=JSON.parse(new TextDecoder().decode(raw)),r=data.result;
      const normRaw=decode('ms-brho-payload'),pressureRaw=decode('ms-a21-payload');
      if(await sha(normRaw)!==data.whole_Brho_file_sha256||await sha(pressureRaw)!==data.pressure_file_sha256)throw Error('부모 norm 또는 압력 실행 파일이 다릅니다.');
      const norm=JSON.parse(new TextDecoder().decode(normRaw)),pressure=JSON.parse(new TextDecoder().decode(pressureRaw));
      if(norm.run_hash_sha256!==data.whole_Brho_run_hash_sha256||pressure.run_hash_sha256!==data.pressure_run_hash_sha256||norm.pressure_run_hash_sha256!==data.pressure_run_hash_sha256)throw Error('세 실행의 참조가 다릅니다.');
      if(current!==request)return;
      if(data.run_hash_sha256!==fullHash||r.schema!=='MathScope.M3.ActualNatural33AxisAndSolutionGrid/1'||r.release!=='HOLD'||r.final_67_jets!==0||r.M3!=='62/64'||r.M4!=='0/16'||r.new_runtime_global_call_domain_certifications!==0)throw Error('실제 해와 최종 인증의 경계가 다릅니다.');
      const v=r.visualization;if(v.scope!=='ACTUAL_ORIGINAL_NATURAL_SOLUTION_ON_EXPLICIT_DOMAIN'||!v.full_nonlinear_solution_enclosures||v.final_A_D_field_samples!==false)throw Error('표시 데이터의 수학적 범위가 다릅니다.');
      grid={ys:v.Y_values.map(number),xi:v.Phi_microchart.xi_values.map(number),eta:v.u_chart.eta_values.map(number),phi:v.Phi_microchart.frames.map(row=>row.map(interval)),u:v.u_chart.frames.map(row=>row.map(interval))};
      if(grid.ys.length!==17||grid.xi.length!==74||grid.eta.length!==65||grid.phi.length!==17||grid.u.length!==17||grid.ys[0]!==0||grid.ys[16]!==4.1||grid.phi.some(row=>row.length!==74)||grid.u.some(row=>row.length!==65))throw Error('실제 해 표본 영역이 다릅니다.');
      grid.uExtent=Math.ceil(Math.max(...grid.u.flat().flatMap(p=>p.map(Math.abs)))*1.06*2)/2;readView();$('component').value=view.component;$('mode').value=view.mode;$('y').value=String(view.layer);
      const table=$('values');table.replaceChildren();if(r.source_33_axis_evaluations.length!==33)throw Error('원본33개 축 평가가 다릅니다.');
      for(const row of r.source_33_axis_evaluations){if(row.evaluation_eta!=='0'||row.global_runtime_call_support_certified!==false)throw Error('축 평가의 범위가 다릅니다.');const tr=document.createElement('tr'),value=row.value;
        const scale=row.component==='Phi'?'h^(4m) 곱':value.exact_positive_divisor+' 나눔';
        for(const text of [String(row.node_id),row.component,String(row.m),scale,displayInterval(interval(value.enclosure))]){const td=document.createElement('td');td.textContent=text;tr.append(td);}table.append(tr);}
      bytes=raw;ready=true;canvas.hidden=!ctx;$('json').disabled=false;$('png').disabled=!ctx;root.dataset.verifiedRunHash=fullHash;
      status('세 실행의 해시·참조 일치 · 실제 비선형 구간값 · 최종장 RELEASE HOLD','verified');
      if(!ctx){root.dataset.renderMode='TABLE_ONLY';root.querySelector('.ms-natural-method').open=true;status('세 실행 검증 일치 · Canvas 대신 표와 JSON을 표시합니다. 최종장 HOLD','verified');}
      schedule();openHash();
    }catch(error){if(current===request)status(error.message||'실제 해 데이터를 확인하지 못했습니다.','error');}
  }
  function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
  root.addEventListener('toggle',schedule);for(const id of ['component','mode','y'])$(id).addEventListener(id==='y'?'input':'change',update);
  $('retry').addEventListener('click',initialize);$('reset').addEventListener('click',()=>{view={...defaults};writeView();initialize();});$('close').addEventListener('click',()=>dialog?.close());
  $('json').addEventListener('click',()=>{if(ready)download(new Blob([bytes],{type:'application/json'}),'mathscope-actual-natural-'+fullHash.slice(0,12)+'.json');});
  $('png').addEventListener('click',()=>{if(ready&&ctx){draw();canvas.toBlob(blob=>{if(blob)download(blob,'mathscope-actual-natural-'+fullHash.slice(0,12)+'-conditional.png');},'image/png');}});
  $('share').addEventListener('click',()=>{if(!ready)return;writeView();const i=$('share-url');i.hidden=false;i.value=location.href;i.focus();i.select();});
  canvas.addEventListener('pointerdown',e=>{if(!ready||view.mode!=='surface'||e.button>0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;view.az+=(e.clientX-drag.x)*.008;view.el=finite(view.el+(e.clientY-drag.y)*.006,.58,.15,1.25);drag.x=e.clientX;drag.y=e.clientY;writeView();schedule();});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{drag=null;});
  canvas.addEventListener('keydown',e=>{if(!ready||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')view.az-=.1;if(e.key==='ArrowRight')view.az+=.1;if(e.key==='ArrowUp')view.el=Math.min(1.25,view.el+.08);if(e.key==='ArrowDown')view.el=Math.max(.15,view.el-.08);writeView();schedule();});
  if(typeof ResizeObserver==='function')new ResizeObserver(schedule).observe(root);else window.addEventListener('resize',schedule);
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#m3-natural')){initialize();openHash();}});
  function start(){dialog=document.getElementById('ms3ip');const previous=document.getElementById('ms-a21-u1');if(previous)previous.before(root);else dialog.append(root);
    dialog.addEventListener('close',()=>{drag=null;if(location.hash.startsWith('#m3-natural'))history.replaceState(null,'',location.pathname+location.search);});initialize();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
