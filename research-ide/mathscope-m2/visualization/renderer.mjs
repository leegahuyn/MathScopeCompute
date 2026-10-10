/** One CPU Canvas2D surface, event-driven redraw, shared exact HTML table. */
import {Scene3D,heatColor,palette} from '../../mathscope-extension/renderer.mjs';
import {numericValue,scalarText} from './observations.mjs';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const tick=n=>!Number.isFinite(n)?'—':Math.abs(n)>=10000||(n!==0&&Math.abs(n)<.001)?n.toExponential(3):String(Number(n.toPrecision(5)));
function range(values){let lo=Infinity,hi=-Infinity;for(const n of values)if(Number.isFinite(n)){lo=Math.min(lo,n);hi=Math.max(hi,n);}if(lo===Infinity)return [0,1];if(lo===hi){const pad=Math.abs(lo)*.05||.5;lo-=pad;hi+=pad;}return [lo,hi];}
function short(text,n){text=String(text??'');return text.length>n?text.slice(0,Math.max(1,n-1))+'…':text;}
function rounded(c,x,y,w,h,r=5){if(c.roundRect){c.beginPath();c.roundRect(x,y,w,h,r);}else{c.beginPath();c.rect(x,y,w,h);}}

/**
 * Scene3D-compatible interface. Camera work touches representationRevision only.
 * CPU 3D and chart routes read the same source-bound view and exact table.
 * WebGL is deliberately reported NOT_IMPLEMENTED, never silently claimed.
 */
export class SourceBoundScene extends Scene3D {
  constructor(canvas){
    super(canvas);this.presentation=null;this.representationRevision=0;this.cameraStamp=null;this.cameraListener=null;this.drawDurations=[];this.lastPicked=null;
    canvas.setAttribute('role','img');canvas.setAttribute('tabindex','0');
  }
  set(data){
    this.presentation=null;this.lastPicked=null;this.selected=null;
    for(const key of ['visualizationState','observationKind','inputHash','resultHash','sourceHash','modelHash','sampleHash','observationHash','ensembleHash','historyHash','configurationHash','sourceJobId','gpuPath','selectedSourcePath','representationRevision'])delete this.canvas.dataset[key];
    this.canvas.setAttribute('aria-label',data?.description||'현재 계산의 표시 자료입니다. 원본 실행 결속은 아직 설정되지 않았습니다.');
    return super.set(data);
  }
  setVisualization(view){
    this.presentation=view;this.lastPicked=null;
    this.canvas.dataset.selectedSourcePath='';
    const color=view.color?.range,scene={...view.scene};
    if(color)scene.points=(scene.points||[]).map(p=>{const n=numericValue(p.value);return {...p,color:p.color||(Number.isFinite(n)?heatColor((n-color[0])/(color[1]-color[0]||1)):palette[0])};});
    this.representationRevision=view.binding?.representationRevision||1;
    this.cameraStamp=JSON.stringify(this.getCamera());
    super.set(scene);
    this.canvas.dataset.visualizationState=view.state;
    this.canvas.dataset.observationKind=view.kind;
    this.canvas.dataset.inputHash=view.binding?.inputHash||'';
    this.canvas.dataset.resultHash=view.binding?.resultHash||'';
    this.canvas.dataset.sourceHash=view.binding?.sourceHash||'';
    for(const key of ['modelHash','sampleHash','observationHash','ensembleHash','historyHash','configurationHash'])this.canvas.dataset[key]=view.binding?.[key]||'';
    this.canvas.dataset.sourceJobId=view.binding?.jobId||'';
    this.canvas.dataset.gpuPath='NOT_IMPLEMENTED';
    this.canvas.setAttribute('aria-label',`${view.title}. ${view.description}. 원본 값은 바로 아래 수치표에 있습니다.`);
    return view;
  }
  getCamera(){return {yaw:this.yaw,pitch:this.pitch,zoom:this.zoom};}
  setCamera(camera){if(!camera||![camera.yaw,camera.pitch,camera.zoom].every(Number.isFinite))return false;this.yaw=camera.yaw;this.pitch=clamp(camera.pitch,-1.35,1.35);this.zoom=clamp(camera.zoom,.4,2.2);this.draw();return true;}
  onCameraChange(listener){this.cameraListener=typeof listener==='function'?listener:null;}
  getMetrics(){const a=(this.drawDurations||[]).slice().sort((a,b)=>a-b);return {renderer:'CPU_CANVAS2D',webgl:'NOT_IMPLEMENTED',samples:a.length,p95Milliseconds:a.length?a[Math.min(a.length-1,Math.ceil(a.length*.95)-1)]:null,targetMilliseconds:100,representationRevision:this.representationRevision};}
  draw(){
    const started=globalThis.performance?.now?.()??Date.now(),view=this.presentation;
    if(!view){super.draw();return;}
    const stamp=JSON.stringify(this.getCamera());
    if(this.cameraStamp&&stamp!==this.cameraStamp){this.representationRevision++;this.cameraStamp=stamp;this.cameraListener?.(this.getCamera());}
    this.canvas.dataset.representationRevision=String(this.representationRevision||1);
    if(view.kind==='SPATIAL_3D'||view.kind==='RELATION_3D'){
      super.draw();this.canvas.dataset.renderer=view.kind==='SPATIAL_3D'?'CPU_ORTHOGRAPHIC_PHYSICAL':'CPU_ORTHOGRAPHIC_RELATION';
      if(view.kind==='RELATION_3D'&&this.ctx&&this.width&&this.height){this.ctx.fillStyle='#081522';this.ctx.fillRect(0,this.height-24,this.width,24);this.ctx.fillStyle='#adc6d5';this.ctx.font='10px sans-serif';this.ctx.fillText('Typed data coordinates · diagram layout / profile attributes · camera only',12,this.height-10);}
    }else this.drawChart(view);
    const elapsed=(globalThis.performance?.now?.()??Date.now())-started;
    if(this.drawDurations){this.drawDurations.push(elapsed);if(this.drawDurations.length>120)this.drawDurations.shift();}
  }
  drawChart(view){
    const box=this.canvas.getBoundingClientRect(),c=this.ctx;
    if(!c||box.width<2||box.height<2)return;
    this.width=box.width;this.height=box.height;
    const dpr=Math.min(globalThis.devicePixelRatio||1,1.5),cw=Math.round(box.width*dpr),ch=Math.round(box.height*dpr);
    if(this.canvas.width!==cw)this.canvas.width=cw;if(this.canvas.height!==ch)this.canvas.height=ch;
    c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#081522';c.fillRect(0,0,box.width,box.height);
    this.projected=[];this.canvas.dataset.renderReady='false';
    const w=box.width,h=box.height,chart=view.chart;
    c.fillStyle='#e5f1f7';c.font='600 13px sans-serif';c.fillText(short(view.title,Math.floor((w-32)/8)),16,24);
    if(view.kind==='STATE'||!chart){
      c.fillStyle='#adc6d5';c.font='13px sans-serif';const text=view.description||'현재 결과에 연결된 관측을 기다립니다.';
      const length=Math.max(20,Math.floor((w-40)/9));for(let i=0;i<Math.min(5,Math.ceil(text.length/length));i++)c.fillText(text.slice(i*length,(i+1)*length),20,65+i*23);
    }else if(chart.kind==='SERIES')this.drawSeries(chart,w,h);
    else if(chart.kind==='MATRIX')this.drawMatrix(chart,w,h);
    else if(chart.kind==='INTERVALS')this.drawIntervals(chart,w,h);
    else if(chart.kind==='NETWORK')this.drawNetwork(chart,w,h);
    else if(chart.kind==='CHECKS')this.drawChecks(chart,w,h);
    else this.drawComparisonTable(chart,w,h);
    if(this.lastPicked){c.fillStyle='#173447';c.fillRect(10,29,w-20,29);c.fillStyle='#ffe2a2';c.font='11px monospace';c.fillText(short(this.lastPicked.label,Math.floor((w-38)/6.7)),18,48);}
    c.fillStyle='#adc6d5';c.font='10px sans-serif';
    c.fillText(short('Source-bound '+(view.binding?.jobId||'')+' · exact values in the table',Math.floor((w-24)/5.7)),12,h-10);
    this.canvas.dataset.renderer='CPU_CANVAS2D_'+(chart?.kind||'STATE');
    this.canvas.dataset.markCount=String(view.scene?.points?.length||chart?.items?.length||chart?.rows?.length||0);
    this.canvas.dataset.renderReady='true';
  }
  axes(chart,w,h,all){
    const c=this.ctx,left=w<420?54:68,right=w-24,top=62,bottom=h-58,xb=chart.xBounds||range(all.map(p=>p.x)),yb=chart.yBounds||range(all.map(p=>p.y));
    const X=x=>left+(x-xb[0])/(xb[1]-xb[0])*(right-left),Y=y=>bottom-(y-yb[0])/(yb[1]-yb[0])*(bottom-top);
    c.strokeStyle='#66879b';c.lineWidth=1;c.beginPath();c.moveTo(left,top);c.lineTo(left,bottom);c.lineTo(right,bottom);c.stroke();
    c.font='10px monospace';
    for(let i=0;i<=4;i++){const x=xb[0]+(xb[1]-xb[0])*i/4,y=yb[0]+(yb[1]-yb[0])*i/4;c.fillStyle='#adc6d5';c.fillText(tick(y),4,Y(y)+4);c.fillText(tick(x),clamp(X(x)-12,left-10,w-68),bottom+16);c.strokeStyle='#203b4d';c.beginPath();c.moveTo(left,Y(y));c.lineTo(right,Y(y));c.stroke();}
    c.fillStyle='#d5e6ef';c.font='11px sans-serif';c.fillText(short(chart.yLabel,Math.floor((w-20)/7)),left,top-12);c.fillText(short(chart.xLabel,Math.floor((w-30)/7)),left,bottom+36);
    return {X,Y,left,right,top,bottom};
  }
  drawSeries(chart,w,h){
    const c=this.ctx,all=chart.series.flatMap(s=>s.points).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
    if(!all.length){c.fillStyle='#adc6d5';c.fillText('표시 가능한 유한 표본이 없습니다. 정확표를 확인하세요.',20,62);return;}
    const a=this.axes(chart,w,h,all);
    for(const[j,s]of chart.series.entries()){
      const ps=s.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),color=s.color||palette[j%palette.length];
      c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1.8;c.setLineDash(s.dash||(j%2?[5,3]:[]));
      if(s.connect!==false){c.beginPath();ps.forEach((p,i)=>{if(i)c.lineTo(a.X(p.x),a.Y(p.y));else c.moveTo(a.X(p.x),a.Y(p.y));});c.stroke();}
      c.setLineDash([]);
      for(const p of ps){const x=a.X(p.x),y=a.Y(p.y);if(s.connect===false){c.globalAlpha=.22;c.fillRect(x-4,y,8,a.bottom-y);c.globalAlpha=1;}if(j%2)c.fillRect(x-2.5,y-2.5,5,5);else{c.beginPath();c.arc(x,y,2.5,0,2*Math.PI);c.fill();}this.projected.push({...p,pos:[p.x,p.y,0],xy:[x,y,0],label:p.label||s.label+': '+scalarText(p.y)});}
      c.font='10px sans-serif';c.fillText(short(s.label,Math.floor((w-30)/Math.max(2,chart.series.length)/6)),18+j*(w-36)/Math.max(2,chart.series.length),42);
    }
  }
  drawMatrix(chart,w,h){
    const c=this.ctx,rows=chart.values.length,cols=chart.values[0]?.length||0;if(!rows||!cols)return;
    const left=70,top=58,cell=Math.min((w-left-30)/cols,(h-top-56)/rows),width=cell*cols,values=chart.values.flat().map(numericValue),extent=Math.max(...values.filter(Number.isFinite).map(Math.abs),1);
    c.font='11px sans-serif';
    for(let j=0;j<cols;j++){c.fillStyle='#d5e6ef';c.fillText(short(chart.columnLabels[j],Math.max(4,Math.floor(cell/7))),left+j*cell+7,top-12);}
    for(let i=0;i<rows;i++){
      c.fillStyle='#d5e6ef';c.fillText(short(chart.rowLabels[i],9),8,top+(i+.5)*cell+4);
      for(let j=0;j<cols;j++){
        const v=chart.values[i][j],n=numericValue(v),x=left+j*cell,y=top+i*cell;
        c.fillStyle=Number.isFinite(n)?heatColor((n+extent)/(2*extent)):'#334658';c.fillRect(x+1,y+1,Math.max(0,cell-2),Math.max(0,cell-2));
        if(cell>=24){c.fillStyle='#06131e';c.font=Math.max(10,Math.min(19,cell*.22))+'px monospace';c.textAlign='center';c.fillText(short(scalarText(v),Math.floor(cell/7)),x+cell/2,y+cell/2+5);c.textAlign='left';}
        this.projected.push({pos:[j,i,0],xy:[x+cell/2,y+cell/2,0],value:v,label:chart.rowLabels[i]+', '+chart.columnLabels[j]+': '+scalarText(v),sourcePath:`${chart.sourceField}[${i}][${j}]`});
      }
    }
    c.fillStyle='#adc6d5';c.font='10px sans-serif';c.fillText(short('row / column are categorical indices · exact entries shown',Math.floor((width+left-12)/6)),left,top+rows*cell+23);
  }
  drawIntervals(chart,w,h){
    const c=this.ctx,top=62,row=Math.min(86,(h-94)/Math.max(1,chart.items.length)),left=80,right=w-30;
    chart.items.forEach((p,i)=>{
      const y=top+i*row+20;let lo=p.lower,hi=p.upper;
      if(![lo,hi,p.midpoint].every(Number.isFinite)||lo>hi)return;
      const d=hi-lo||Math.abs(lo)*.001||1,pad=.1*d,X=x=>left+(x-lo+pad)/(d+2*pad)*(right-left);
      c.fillStyle='#d5e6ef';c.font='12px sans-serif';c.fillText(p.label,12,y+4);c.strokeStyle=palette[i%palette.length];c.lineWidth=3;c.beginPath();c.moveTo(X(lo),y);c.lineTo(X(hi),y);c.stroke();
      for(const v of[lo,hi]){c.beginPath();c.moveTo(X(v),y-7);c.lineTo(X(v),y+7);c.stroke();}
      c.fillStyle='#fff1cb';c.beginPath();c.arc(X(p.midpoint),y,4,0,Math.PI*2);c.fill();c.font='10px monospace';c.fillStyle='#adc6d5';c.fillText(tick(lo),left,y+24);c.textAlign='right';c.fillText(tick(hi),right,y+24);c.textAlign='left';
      this.projected.push({pos:[i,p.midpoint,0],xy:[X(p.midpoint),y,0],label:p.label+': ['+p.lower+', '+p.upper+']',sourcePath:p.sourcePath});
    });
    c.fillStyle='#adc6d5';c.font='10px sans-serif';c.fillText('Each row uses its own interval scale. Exact endpoints are below.',16,h-34);
  }
  drawNetwork(chart,w,h){
    if(w<520){
      const names=new Map(chart.nodes.map(n=>[n.id,n.label]));
      this.drawComparisonTable({columns:['원본 노드','연결된 상위 노드'],rows:chart.nodes.map(n=>[n.label,chart.edges.filter(e=>e.to===n.id).map(e=>names.get(e.from)).join(', ')||'root'])},w,h);
      return;
    }
    const c=this.ctx,nodes=chart.nodes,depths=[...new Set(nodes.map(n=>n.x))].sort((a,b)=>a-b),single=depths.length===1,position=new Map();
    const left=single?w/2:76,top=58,bottom=h-46,nodeH=single?Math.min(29,(bottom-top)/Math.max(1,nodes.length)-5):28,nodeW=single?Math.min(w-44,520):Math.max(68,Math.min(150,(w-50)/Math.max(1,depths.length)-16));
    for(const n of nodes){const level=nodes.filter(x=>x.x===n.x),i=level.findIndex(x=>x.id===n.id),x=single?left:76+(w-152)*depths.indexOf(n.x)/Math.max(1,depths.length-1),y=top+(bottom-top)*(i+.5)/level.length;position.set(n.id,[x,y]);}
    c.strokeStyle='#799cad';c.lineWidth=1.5;
    for(const e of chart.edges){const a=position.get(e.from),b=position.get(e.to);if(!a||!b)continue;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,tip=[b[0]-dx/l*(single?nodeH/2:nodeW/2),b[1]-dy/l*(single?nodeH/2:nodeW/2)];c.beginPath();c.moveTo(tip[0],tip[1]);c.lineTo(tip[0]-6*dx/l+4*dy/l,tip[1]-6*dy/l-4*dx/l);c.lineTo(tip[0]-6*dx/l-4*dy/l,tip[1]-6*dy/l+4*dx/l);c.closePath();c.fillStyle='#799cad';c.fill();}
    for(const n of nodes){const[x,y]=position.get(n.id);rounded(c,x-nodeW/2,y-nodeH/2,nodeW,nodeH);c.fillStyle='#173b4b';c.fill();c.strokeStyle=palette[0];c.stroke();c.fillStyle='#e4f1f4';c.font='11px monospace';c.textAlign='center';c.fillText(short(n.label,Math.floor((nodeW-14)/6.4)),x,y+4);c.textAlign='left';this.projected.push({pos:[n.x,n.y,0],xy:[x,y,0],label:n.label,sourcePath:n.sourcePath});}
  }
  drawChecks(chart,w,h){
    const c=this.ctx,columns=w>850?3:w>500?2:1,maxRows=Math.max(1,Math.floor((h-82)/30)),limit=columns*maxRows,items=chart.items.slice(0,limit),cw=(w-30)/columns;
    items.forEach((p,i)=>{const col=Math.floor(i/maxRows),row=i%maxRows,x=15+col*cw,y=58+row*30; c.fillStyle=p.pass===true?'#87e1c8':p.pass===false?'#ffa6a0':'#f5d182';c.font='600 12px sans-serif';c.fillText(p.pass===true?'✓':p.pass===false?'×':'?',x,y);c.fillStyle='#d7e7ee';c.font='10px sans-serif';c.fillText(short(p.label,Math.floor((cw-25)/6)),x+20,y);this.projected.push({pos:[i,p.pass?1:0,0],xy:[x+10,y-4,0],label:p.label+' · '+p.status,sourcePath:p.sourcePath});});
    if(chart.items.length>items.length){c.fillStyle='#adc6d5';c.font='10px sans-serif';c.fillText(`전체 ${chart.items.length}개 중 ${items.length}개 표시 · 모든 결과는 수치표에 있습니다.`,16,h-31);}
  }
  drawComparisonTable(chart,w,h){
    const c=this.ctx,columns=chart.columns||[],rows=chart.rows||[],cw=(w-32)/Math.max(1,columns.length),limit=Math.min(rows.length,Math.floor((h-94)/41));
    c.font='600 11px sans-serif';c.fillStyle='#d5e6ef';columns.forEach((v,j)=>c.fillText(short(v,Math.floor(cw/7)-1),16+j*cw,54));
    for(let i=0;i<limit;i++){const y=73+i*41;c.fillStyle=i%2?'#0b1f2e':'#102938';c.fillRect(12,y-13,w-24,36);rows[i].forEach((v,j)=>{c.fillStyle='#e5f0f4';c.font='11px monospace';c.fillText(short(scalarText(v),Math.floor(cw/7)-1),16+j*cw,y+9);});}
    if(rows.length>limit){c.fillStyle='#adc6d5';c.font='10px sans-serif';c.fillText(`전체 ${rows.length}행 · 전체 값은 아래 표와 JSON에 보존됩니다.`,16,h-33);}
  }
  pick(e){
    if(!this.presentation||['SPATIAL_3D','RELATION_3D'].includes(this.presentation.kind)){super.pick(e);this.lastPicked=this.selected;this.canvas.dataset.selectedSourcePath=this.selected?.sourcePath||'';return;}
    const box=this.canvas.getBoundingClientRect(),x=e.clientX-box.left,y=e.clientY-box.top;let best=null,distance=20;
    for(const p of this.projected){const d=Math.hypot(p.xy[0]-x,p.xy[1]-y);if(d<distance){best=p;distance=d;}}
    this.lastPicked=best;this.canvas.dataset.selectedSourcePath=best?.sourcePath||'';
    if(best)this.canvas.setAttribute('aria-label',best.label+' · 원본 필드 '+(best.sourcePath||''));
    this.draw();
  }
}

/** Dynamic columns prevent exact non-geometric results from disappearing. */
export function renderObservationTable(head,body,view,{table:override}={}){
  if(!body)return {rows:0};const t=override||view.table,doc=body.ownerDocument||document;
  if(head){head.replaceChildren();const tr=head.tagName==='TR'?head:doc.createElement('tr');for(const column of t.columns){const th=doc.createElement('th');th.scope='col';th.textContent=typeof column==='string'?column:column.label;th.title=column.sourceField||'';tr.append(th);}if(tr!==head)head.append(tr);}
  body.replaceChildren();
  for(const[i,row]of t.rows.entries()){const tr=doc.createElement('tr');tr.dataset.sourcePath=t.sourcePaths?.[i]||'';for(const v of row){const td=doc.createElement('td');td.textContent=scalarText(v);td.style.overflowWrap='anywhere';tr.append(td);}body.append(tr);}
  if(!t.rows.length){const tr=doc.createElement('tr'),td=doc.createElement('td');td.colSpan=t.columns.length||1;td.textContent=view.description||'아직 결과가 없습니다.';tr.append(td);body.append(tr);}
  const element=body.closest?.('table');if(element){element.dataset.sourceJobId=view.binding?.jobId||'';element.dataset.inputHash=view.binding?.inputHash||'';element.dataset.totalRows=String(t.totalRows);element.dataset.displayedRows=String(t.rows.length);element.dataset.truncated=String(t.truncated);element.setAttribute('aria-label',t.title||'정확한 관측값');}
  return {rows:t.rows.length,totalRows:t.totalRows,truncated:t.truncated};
}

/** Optional source details, related exact tables, and semantic axis ledger. */
export function renderObservationDetails(container,view){
  if(!container)return;const doc=container.ownerDocument||document;container.replaceChildren();
  const block=(title,content)=>{const d=doc.createElement('details'),s=doc.createElement('summary');s.textContent=title;d.append(s,content);container.append(d);return d;};
  const pre=value=>{const p=doc.createElement('pre');p.textContent=JSON.stringify(value,null,2);p.style.whiteSpace='pre-wrap';p.style.overflowWrap='anywhere';return p;};
  block('축 · 단위 · 변환 · 원본 필드',pre(view.axisMetadata));
  for(const t of view.relatedTables||[]){const table=doc.createElement('table'),head=doc.createElement('thead'),body=doc.createElement('tbody');table.append(head,body);renderObservationTable(head,body,view,{table:t});block(t.title,table);}
  for(const d of view.details||[])block(d.title,pre(d.value));
}
