(() => {
  'use strict';
  const root = document.getElementById('ms-a21-u1');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const $ = id => document.getElementById('ms-a21-' + id);
  const canvas = $('canvas'), ctx = canvas.getContext('2d');
  const defaults = {az:-.72, el:.58, y:4.1, mode:'surface'};
  let view = {...defaults}, rows = [], rawBytes = null, rawText = '', ready = false, queued = false, drag = null, frame = 0, requestId = 0;
  const fullHash = root.dataset.runHash;
  const mainDialog = document.getElementById('ms3ip');
  const existingNav = mainDialog?.querySelector('nav[aria-label="증거 영역"]');
  if (existingNav) existingNav.before(root);
  else if (mainDialog) mainDialog.append(root);
  const finite = (s, fallback, lo, hi) => {const n=Number(s); return Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):fallback;};
  const number = text => {const p=String(text).split('/');const n=Number(p[0])/(p[1]?Number(p[1]):1);if(!Number.isFinite(n))throw Error('유리수 표시 범위 오류');return n;};
  const interval = pair => {if(!Array.isArray(pair)||pair.length!==2)throw Error('구간 자료 오류');const a=pair.map(number);if(a[0]>a[1])throw Error('구간 순서 오류');return a;};
  const showInterval = a => '['+((Math.floor(a[0]*1e6)-1)/1e6).toFixed(6)+', '+((Math.ceil(a[1]*1e6)+1)/1e6).toFixed(6)+']';
  function readView() {
    if (!location.hash.startsWith('#m3-a21-u1')) return;
    const p=new URLSearchParams(location.hash.split('?')[1]||'');
    if (p.has('run')&&p.get('run')!==fullHash) throw Error('이 링크의 실행은 현재 실행과 다릅니다. 초기화하면 현재 실행으로 복구합니다.');
    view={az:finite(p.get('az')??defaults.az,defaults.az,-100,100),el:finite(p.get('el')??defaults.el,defaults.el,.15,1.25),y:finite(p.get('y')??defaults.y,defaults.y,.5,4.1),mode:p.get('mode')==='slice'?'slice':'surface'};
  }
  function writeView() {
    const p=new URLSearchParams({run:fullHash,y:view.y.toFixed(1),az:view.az.toFixed(3),el:view.el.toFixed(3),mode:view.mode});
    history.replaceState(null,'',location.pathname+location.search+'#m3-a21-u1?'+p);
  }
  function status(message,kind) {root.dataset.status=kind;$('status').textContent=message;}
  function path(points,fill,stroke='#ffffff80') {
    if(!points.length)return;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))ctx.lineTo(p[0],p[1]);
    if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function draw() {
    queued=false;if(!ready||!root.open||!ctx)return;
    const start=performance.now();
    const rect=canvas.getBoundingClientRect();if(rect.width<10)return;
    const w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle='#fbfdfb';ctx.fillRect(0,0,w,h);ctx.lineWidth=.7;
    const extent=Math.max(...rows.flatMap(r=>r.u.map(Math.abs)))*4.1*1.06;
    const scale=Math.min(w/4.1,(h-70)/3.4),ox=w/2,oy=(h-58)/2+12;
    function project(e,y,value) {
      const x=e*1.1,d=(y/4.1-.5)*1.65,z=value/extent*1.3;
      const a=x*Math.cos(view.az)-d*Math.sin(view.az),b=x*Math.sin(view.az)+d*Math.cos(view.az);
      return [ox+a*scale,oy+(b*Math.sin(view.el)-z*Math.cos(view.el))*scale,b*Math.cos(view.el)+z*Math.sin(view.el)];
    }
    function label(text,p,align='left',dx=3,dy=-4){ctx.font='11px system-ui';ctx.fillStyle='#284d40';ctx.textAlign=align;ctx.fillText(text,p[0]+dx,p[1]+dy);}
    if(view.mode==='surface') {
      for(let i=0;i<=4;i++){const e=-1+i/2;path([project(e,0,0),project(e,view.y,0)],null,'#bbcec2');}
      for(let i=0;i<=4;i++){const y=view.y*i/4;path([project(-1,y,0),project(1,y,0)],null,'#bbcec2');}
      const faces=[],ny=16;
      for(let i=0;i<rows.length-1;i++)for(let j=0;j<ny;j++) {
        const y0=view.y*j/ny,y1=view.y*(j+1)/ny,a=rows[i],b=rows[i+1];
        const va=(a.u[0]+a.u[1])/2,vb=(b.u[0]+b.u[1])/2;
        const ps=[project(a.e,y0,va*y0),project(b.e,y0,vb*y0),project(b.e,y1,vb*y1),project(a.e,y1,va*y1)];
        const v=(va+vb)*(y0+y1)/4/extent;
        faces.push({ps,depth:ps.reduce((s,p)=>s+p[2],0)/4,v});
      }
      faces.sort((a,b)=>b.depth-a.depth);
      for(const face of faces){const t=Math.min(1,Math.abs(face.v));const color=face.v>=0?`rgba(28,${125+Math.round(t*30)},125,.76)`:`rgba(190,${119+Math.round(t*23)},48,.76)`;path(face.ps,color,'#ffffff40');}
      ctx.lineWidth=1.2;path([project(-1,0,0),project(1,0,0)],null,'#47685a');path([project(-1,0,0),project(-1,view.y,0)],null,'#47685a');
      path([project(-1,0,-extent),project(-1,0,extent)],null,'#8a9e92');
      for(const v of [-extent,extent])label(v.toFixed(1),project(-1,0,v),'right',-8,4);
      label('η = −1',project(-1,0,0),'left',8,14);label('η = 1',project(1,0,0));label('Y = '+view.y.toFixed(1),project(-1,view.y,0),'left',8,14);
      ctx.textAlign='left';ctx.font='12px system-ui';ctx.fillStyle='#244f40';ctx.fillText('높이: Y·u₁/K',12,20);
    } else {
      const left=36,right=w-14,top=28,bottom=h-70,sy=v=>(top+bottom)/2-v/extent*(bottom-top)*.44,sx=e=>left+(e+1)/2*(right-left);
      path([[left,sy(0)],[right,sy(0)]],null,'#9fb6a9');path([[sx(0),top],[sx(0),bottom]],null,'#d1ddd5');
      const lower=rows.map(r=>[sx(r.e),sy(r.u[0]*view.y)]),upper=rows.map(r=>[sx(r.e),sy(r.u[1]*view.y)]);
      path([...lower,...upper.reverse()],'#b7d4c780',null);ctx.lineWidth=2;path(rows.map(r=>[sx(r.e),sy((r.u[0]+r.u[1])*view.y/2)]),null,'#18685b');
      ctx.fillStyle='#244f40';ctx.textAlign='left';ctx.font='12px system-ui';ctx.fillText('Y = '+view.y.toFixed(1)+' 단면 · Y·u₁/K',12,18);ctx.fillText('η −1',left,bottom+15);ctx.textAlign='right';ctx.fillText('η 1',right,bottom+15);
      ctx.textAlign='left';ctx.font='10px system-ui';ctx.fillText('+'+extent.toFixed(1),left,top+10);ctx.fillText('−'+extent.toFixed(1),left,bottom-4);
    }
    ctx.textAlign='left';ctx.font='10px system-ui';ctx.fillStyle='#6a5a35';ctx.fillText('CONDITIONAL · 첫 Taylor 기여 / 최종 속도장 아님',10,h-39);
    ctx.font='9px ui-monospace,monospace';ctx.fillStyle='#587063';ctx.fillText(fullHash.slice(0,32),10,h-24);ctx.fillText(fullHash.slice(32),10,h-11);
    frame++;root.dataset.frame=String(frame);root.dataset.renderMode='CPU_CANVAS_2D';root.dataset.viewMode=view.mode;root.dataset.yMax=view.y.toFixed(1);
    root.dataset.lastDrawMs=(performance.now()-start).toFixed(3);
    $('y-label').textContent=view.y.toFixed(2);
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(draw);}}
  function updateView(){if(!ready)return;view.y=finite($('y').value,4.1,.5,4.1);view.mode=$('mode').value==='slice'?'slice':'surface';writeView();schedule();}
  function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
  async function initialize() {
    const current=++requestId;
    ready=false;canvas.hidden=true;$('json').disabled=$('png').disabled=true;
    status('동일 실행 데이터의 SHA-256을 확인하고 있습니다.','loading');
    try {
      if(!crypto.subtle)throw Error('이 브라우저에서 실행 데이터의 무결성을 확인할 수 없습니다.');
      const encoded=document.getElementById('ms-a21-payload').textContent.trim();rawBytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
      const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',rawBytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
      if(current!==requestId)return;
      if(digest!==root.dataset.payloadSha)throw Error('실행 파일 해시가 다릅니다. 그림과 내보내기를 중단했습니다.');
      rawText=new TextDecoder().decode(rawBytes);const data=JSON.parse(rawText),r=data.result;
      if(data.run_hash_sha256!==fullHash||r.release!=='HOLD'||r.final_67_jets!==0||r.M3!=='62/64'||r.M4!=='0/16')throw Error('실행 범위 또는 원본 완료 상태가 다릅니다.');
      if(r.visualization?.scope!=='CONDITIONAL_ORIGINAL_FIRST_COEFFICIENT_PREFIX'||r.visualization.final_A_D_field_samples!==false)throw Error('원본 계수 표시 계약이 다릅니다.');
      rows=r.visualization.samples.map(s=>({e:number(s.eta),u:interval(s.u1_divided_K),p:interval(s.P0_divided_K)}));
      if(rows.length!==65||rows[0].e!==-1||rows.at(-1).e!==1||rows.some((x,i)=>i&&x.e<=rows[i-1].e))throw Error('샘플 영역 또는 순서가 다릅니다.');
      readView();$('y').value=String(view.y);$('mode').value=view.mode;
      const body=$('values');body.replaceChildren();for(const i of [0,16,32,48,64]){const s=rows[i],tr=document.createElement('tr');for(const text of [String(s.e),showInterval(s.u),showInterval(s.p)]){const td=document.createElement('td');td.textContent=text;tr.append(td);}body.append(tr);}
      const c=interval(r.quadrature.c0);$('readout').textContent='c₀ ≈ '+showInterval(c)+' · '+r.quadrature.cells+'셀 / '+r.quadrature.arithmetic_bits+'bit · u₁/K 식의 균일 잔여 < 2⁻³³';
      ready=true;canvas.hidden=!ctx;$('json').disabled=false;$('png').disabled=!ctx;
      root.dataset.verifiedRunHash=fullHash;status('실행·파일 해시 일치 · 원본 첫 계수의 구간 데이터 · 전체 수학 인증은 HOLD','verified');
      if(!ctx){root.dataset.renderMode='TABLE_ONLY';root.querySelector('.ms-a21-method').open=true;status('실행·파일 해시 일치 · Canvas 대신 표와 실행 JSON을 표시합니다. 전체 인증은 HOLD','verified');}
      schedule();openHash();
    } catch(error) {ready=false;status(error.message||'계산 데이터를 확인하지 못했습니다.','error');}
  }
  function openHash(){if(!location.hash.startsWith('#m3-a21-u1'))return;root.open=true;if(mainDialog&&!mainDialog.open)mainDialog.showModal();schedule();setTimeout(()=>root.scrollIntoView({block:'start',behavior:'instant'}),80);}
  root.addEventListener('toggle',schedule);$('y').addEventListener('input',updateView);$('mode').addEventListener('change',updateView);
  $('retry').addEventListener('click',initialize);
  $('close').addEventListener('click',()=>{if(mainDialog)mainDialog.close();});
  mainDialog?.addEventListener('close',()=>{drag=null;if(location.hash.startsWith('#m3-a21-u1'))history.replaceState(null,'',location.pathname+location.search);});
  $('reset').addEventListener('click',()=>{view={...defaults};writeView();initialize();});
  $('json').addEventListener('click',()=>{if(ready)download(new Blob([rawBytes],{type:'application/json'}),'mathscope-a21-u1-'+fullHash.slice(0,12)+'.json');});
  $('png').addEventListener('click',()=>{if(ready){draw();canvas.toBlob(blob=>{if(blob)download(blob,'mathscope-a21-u1-'+fullHash.slice(0,12)+'-conditional.png');},'image/png');}});
  $('share').addEventListener('click',()=>{if(!ready)return;writeView();const input=$('share-url');input.hidden=false;input.value=location.href;input.focus();input.select();});
  canvas.addEventListener('pointerdown',event=>{if(!ready||view.mode!=='surface'||event.button>0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;view.az+=(event.clientX-drag.x)*.008;view.el=finite(view.el+(event.clientY-drag.y)*.006,.58,.15,1.25);drag.x=event.clientX;drag.y=event.clientY;writeView();schedule();});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{drag=null;});
  canvas.addEventListener('keydown',event=>{if(!ready||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();if(event.key==='ArrowLeft')view.az-=.1;if(event.key==='ArrowRight')view.az+=.1;if(event.key==='ArrowUp')view.el=Math.min(1.25,view.el+.08);if(event.key==='ArrowDown')view.el=Math.max(.15,view.el-.08);writeView();schedule();});
  if(typeof ResizeObserver==='function')new ResizeObserver(schedule).observe(root);else window.addEventListener('resize',schedule);
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#m3-a21-u1'))initialize();});
  initialize();
})();
