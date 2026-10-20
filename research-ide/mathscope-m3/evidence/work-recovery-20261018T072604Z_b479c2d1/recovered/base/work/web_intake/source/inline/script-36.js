
(function(){
'use strict';
if(document.documentElement.dataset.msM3EightInstalled==='1')return;
document.documentElement.dataset.msM3EightInstalled='1';
var ids=['N6-01','N6-02','N6-07','N6-08','N7-04','N7-05','N7-06','N8-05'];
var hints={
'N6-01':'다섯 모멘트의 순차 조정과 압력 갱신의 의존관계. 그래프는 독립 5성분 장난감 보정만 계산합니다.',
'N6-02':'직접 residual 대 선형화+이차항 분해를 비교합니다. 그래프는 1차원 정상 점성 모형이며 원본 3D PDE가 아닙니다.',
'N6-07':'단일 공통 q 정의역과 차수별 지수를 표시합니다. K(m,l), 로그 손실, 모든 차수 상계는 미평가입니다.',
'N6-08':'줄어드는 cutoff 지지집합, 활성 인덱스, 생략 항을 비교합니다. 아래 매끄러움은 유한 예제일 뿐 Lemma 5.4 증명이 아닙니다.',
'N7-04':'terminal flat function의 유한 0–2차 jet를 로그 크기로 관측합니다. 전체 공간 force, 모든 차수의 극한은 아직 미검증입니다.',
'N7-05':'(10.11)을 모방한 유한 2차 Taylor jet의 cutoff 접합입니다. 실제 b_j 선택과 모든 차수 꼬리는 미검증입니다.',
'N7-06':'전역 에너지 항등식의 구조를 한 모드 ODE에서 확인합니다. 실제 공간 K 전체의 적분은 이 그래프에 없습니다.',
'N8-05':'서로 독립된 grid·Fourier·차수·정밀도 변화의 오차 추정 예제입니다. 실제 원본 오차 bound가 아닙니다.'
};
var names={'N6-01':'다섯 radial moment','N6-02':'PDE residual 대조','N6-07':'공통 도메인·차수','N6-08':'축소 cutoff·tail','N7-04':'terminal force jets','N7-05':'t>1 force extension','N7-06':'전체 K 에너지 관문','N8-05':'독립 적응·정밀도'};
var warn={
'N6-01':'미검증: full-torus 시간 역연산, source current 실제 순서, 각 단계 최신 full pressure 및 B0=0.7 / C0*=1.2 / (9.9)-(9.10) 인증.',
'N6-02':'미검증: 같은 최종 (u,p)에 대한 독립 full physical PDE, pressure, flat tail, 모든 quadratic remainder 및 오차 예산.',
'N6-07':'미검증: 공통 q<qBig에서 모든 유한 단계의 실제 K(m,l), log powers, 미분 손실 및 uniform tail.',
'N6-08':'미검증: (9.21)의 정확한 합성 순서, curl, Lemma 5.4의 source-bound summable tail 및 (9.20).',
'N7-04':'미검증: 원본 전역 국소화 f에 대한 모든 F_j, ∂x^αF_j(0)=0의 모든 α 및 끝점 C∞ 상계.',
'N7-05':'미검증: 실제 F_j로부터 전 차수 b_j 선택, differentiated tail, t≤2 compact force support의 원본 증명.',
'N7-06':'미검증: 원본 고정 K 전체의 ||u||²·||∇u||²·〈f,u〉 적분과 (10.13), 독립 공간·시간 오차 결산.',
'N8-05':'미검증: 원본 pulse 파장, axial 길이, Fourier cutoff, correction order, arithmetic precision 독립 비교와 마지막 양의 τ·미포함 꼬리.'
};
var root=document.getElementById('ms-m3eight-dialog'),btn=document.getElementById('ms-m3eight-launch'),nav=document.getElementById('ms-m3eight-nav');
if(!root||!btn||!nav)return;
var original={};
try{var node=document.getElementById('ms-m4-data');if(node){var obj=JSON.parse(node.textContent);for(var i=0;i<(obj.criteria||[]).length;i++)original[obj.criteria[i].taskId]=obj.criteria[i];}}catch(e){}
var selected=ids[0],scale=4,axis='grid';
var $=function(id){return document.getElementById(id);};
function elt(tag,attrs,content){var n=document.createElement(tag);if(attrs)for(var k in attrs)n.setAttribute(k,attrs[k]);if(content!==undefined)n.textContent=String(content);return n;}
function svgEl(name,attrs){var n=document.createElementNS('http://www.w3.org/2000/svg',name);for(var k in attrs)n.setAttribute(k,attrs[k]);return n;}
function fmt(x){return Number.isFinite(x)?(Math.abs(x)<1e-4?x.toExponential(3):x.toPrecision(5)):'UNAVAILABLE';}
function chart(series,opts){
 var svg=$('ms-m3eight-svg');svg.replaceChildren();var all=[];
 for(var i=0;i<series.length;i++)for(var j=0;j<series[i].data.length;j++){var xy=series[i].data[j];if(Number.isFinite(xy[0])&&Number.isFinite(xy[1]))all.push(xy);}
 if(!all.length)return;
 var xmin=Math.min.apply(null,all.map(function(x){return x[0];})),xmax=Math.max.apply(null,all.map(function(x){return x[0];}));
 var ymin=opts&&Number.isFinite(opts.ymin)?opts.ymin:Math.min.apply(null,all.map(function(x){return x[1];})),ymax=opts&&Number.isFinite(opts.ymax)?opts.ymax:Math.max.apply(null,all.map(function(x){return x[1];}));
 if(xmin===xmax)xmax+=1;if(ymin===ymax){ymin-=1;ymax+=1;}var pad=(ymax-ymin)*.06;ymin-=pad;ymax+=pad;
 var X=function(x){return 58+(x-xmin)/(xmax-xmin)*675;},Y=function(y){return 236-(y-ymin)/(ymax-ymin)*209;};
 for(var j=0;j<5;j++){var y=27+(209*j/4),val=ymax-(y-27)/209*(ymax-ymin);svg.append(svgEl('line',{x1:58,x2:733,y1:y,y2:y,stroke:'#224658','stroke-width':1}));
 var l=svgEl('text',{x:51,y:y+4,fill:'#9dbdca','font-size':11,'text-anchor':'end'});l.textContent=Math.abs(val)<1e-3?val.toExponential(1):val.toFixed(2);svg.append(l);}
 for(var j=0;j<5;j++){var x=58+675*j/4;var l=svgEl('text',{x:x,y:257,fill:'#a7c6d0','font-size':11,'text-anchor':'middle'});l.textContent=(xmin+(xmax-xmin)*j/4).toFixed(2);svg.append(l);}
 var cols=['#63e5d0','#ffba6e','#86a6ff','#f18ad8','#e2e9f8'];
 for(var i=0;i<series.length;i++){var pts=series[i].data.filter(function(p){return Number.isFinite(p[0])&&Number.isFinite(p[1]);});if(!pts.length)continue;
 var line=svgEl('polyline',{points:pts.map(function(p){return X(p[0]).toFixed(2)+','+Y(p[1]).toFixed(2);}).join(' '),stroke:cols[i%cols.length],'stroke-width':i===0?2.8:2,'stroke-linejoin':'round','stroke-linecap':'round',fill:'none'});svg.append(line);
 if(pts.length<12)for(var k=0;k<pts.length;k++)svg.append(svgEl('circle',{cx:X(pts[k][0]),cy:Y(pts[k][1]),r:3,fill:cols[i%cols.length]}));
 var tx=svgEl('text',{x:62+(i%3)*223,y:278+Math.floor(i/3)*16,fill:cols[i%cols.length],'font-size':11});tx.textContent=series[i].name;svg.append(tx);
 }
 var xl=svgEl('text',{x:712,y:297,'text-anchor':'end',fill:'#b5dce4','font-size':11});xl.textContent=(opts&&opts.xlabel)||'parameter';svg.append(xl);
 svg.setAttribute('aria-label',(opts&&opts.label)||('유한 예제 '+selected+' 그래프'));
}
function rng(value,min,max,step,label){var box=$('ms-m3eight-controls');box.replaceChildren();var t=elt('label',{},label);var inp=elt('input',{type:'range',min:min,max:max,step:step,'aria-label':label});inp.value=String(value);
 var out=elt('strong',{},String(value));inp.addEventListener('input',function(){scale=Number(inp.value);out.textContent=inp.value;renderGraph();});box.append(t,inp,out);
 if(selected==='N8-05'){var lab=elt('label',{},'적응 축'),sel=elt('select',{'aria-label':'독립 변경할 적응 축'});['grid','Fourier','order','precision'].forEach(function(k){var op=elt('option',{value:k},k);sel.append(op);});sel.value=axis;sel.addEventListener('change',function(){axis=sel.value;renderGraph();});lab.append(sel);box.append(lab);}
}
function renderGraph(){
 var id=selected,S=[],meta='';
 if(id==='N6-01'){
 var m=[.38,-.23,.13,-.075,.044].map(function(x){return x*scale/4;}),rows=[[0,m.reduce(function(a,b){return a+Math.abs(b);},0)]];
 for(var i=0;i<5;i++){var z=m[i];m[i]=0;for(var j=i+1;j<5;j++)m[j]+=z*.08/(j-i+1);rows.push([i+1,m.reduce(function(a,b){return a+Math.abs(b);},0)]);}
 S=[{name:'toy residual moment L1',data:rows}];meta='5 toy corrections: '+rows.map(function(x){return x[1].toFixed(5);}).join(' → ')+'\n압력: 미평가 / 원본 full-torus current: 미평가';
 }else if(id==='N6-02'){
 var b=scale/100,direct=[],decomp=[],q=[],max=0,a=.4,nu=1;
 for(var i=0;i<=120;i++){var x=i*Math.PI*2/120,u=a*Math.sin(x),ux=a*Math.cos(x),uxx=-a*Math.sin(x),v=b*Math.sin(2*x),vx=2*b*Math.cos(2*x),vxx=-4*b*Math.sin(2*x),px=-.07*Math.sin(x),dpx=-.15*Math.sin(3*x);
 var p0=-nu*uxx+u*ux+px,L=-nu*vxx+u*vx+v*ux+dpx,Q=v*vx;
 var d=-nu*(uxx+vxx)+(u+v)*(ux+vx)+px+dpx,split=p0+L+Q;
 direct.push([x,d]);decomp.push([x,split]);q.push([x,Q]);max=Math.max(max,Math.abs(d-split));}
 S=[{name:'direct 1D residual',data:direct},{name:'decomposed 1D',data:decomp},{name:'quadratic toy',data:q}];meta='max |direct−decomposed| = '+fmt(max)+' (finite IEEE-754)\n1D toy: R(v,p)=−νv″+v v′+p′; 원본 3D NS 잔차 계산 아님.';
 }else if(id==='N6-07'){
 var q=scale/100,sg=[],line=[],lower=[];for(var j=0;j<=11;j++){sg.push([j,.2+j*.1]);line.push([j,.8]);lower.push([j,q]);}
 S=[{name:'σ_j=1/5+j/10',data:sg},{name:'qBig (illustrative .8)',data:line},{name:'selected q',data:lower}];
 meta='toy q = '+q.toFixed(2)+' < qBig=.80; g_j=h_j/10 — 실제 h_j 미제공\nK(m,ℓ), logarithmic losses, all-order uniform bound: UNVERIFIED';
 }else if(id==='N6-08'){
 var J=Math.round(scale),r0=.8;function chi(z){if(z<=.45)return 1;if(z>=1)return 0;var h=(z-.45)/.55;return 1-(h*h*(3-2*h));}
 for(var j=0;j<Math.min(J,5);j++){var r=r0*Math.pow(.55,j),points=[];for(var k=0;k<=150;k++){var x=k/150;points.push([x,chi(x/r)]);}S.push({name:'χ_'+j+' (r='+r.toFixed(3)+')',data:points});}
 meta='toy active levels = '+J+'; omitted amplitude Σ(j≥J)2^(−j) = '+fmt(Math.pow(2,1-J))+'\n실제 curl, Lemma 5.4 및 실제 tail 상계로 사용 금지.';
 }else if(id==='N7-04'){
 var mint=scale/100,pts=[[],[],[]];for(var i=0;i<=130;i++){var tau=mint+(1-mint)*i/130,expo=-1/(tau*tau)/Math.LN10,vals=[expo,Math.log10(2)-3*Math.log10(tau)+expo,Math.log10(Math.abs(4/Math.pow(tau,6)-6/Math.pow(tau,4))+1e-300)+expo];for(var j=0;j<3;j++)pts[j].push([tau,Math.max(-45,vals[j])]);}
 S=[{name:'log10|f|',data:pts[0]},{name:'log10|f_t|',data:pts[1]},{name:'log10|f_tt|',data:pts[2]}];meta='explicit toy f(t)=exp(−1/(1−t)^2) for t<1, f(t)=0 for t≥1\nτ_min='+mint.toFixed(2)+', 표시 0–2차; 원본 F_j(x) 전차수 미평가.';
 }else if(id==='N7-05'){
 var b=scale,F=[.25,-.35,.75],left=[],right=[],poly=[];function c(z){if(z<=.5)return 1;if(z>=1)return 0;var y=2*(z-.5);return 1-y*y*(3-2*y);}
 for(var i=0;i<=160;i++){var x=-.4+i*1.4/160,pol=F[0]+F[1]*x+F[2]*x*x/2;
 if(x<=0)left.push([x,pol]);if(x>=0){var v=F[0]*c(b*x)+F[1]*x*c((b+1)*x)+F[2]*x*x*c((b+2)*x)/2;right.push([x,v]);poly.push([x,pol]);}}
 S=[{name:'left finite jet',data:left},{name:'right finite cutoff',data:right},{name:'uncut Taylor',data:poly}];meta='toy b0='+b+', b1='+ (b+1)+', b2='+(b+2)+'; 3 matched Taylor jets at σ=0\ncutoff in demo C¹ only; 원본 C∞ extension이나 (10.12) 검증 아님.';
 }else if(id==='N7-06'){
 var n=Math.round(scale),u0=.4,f=.7,T=1,hh=T/n,IU=0,IW=0,energy=[],bal=[],maxDef=0;function u(t){return f+(u0-f)*Math.exp(-t);}
 for(var i=0;i<=n;i++){var t=i*hh,v=u(t),e=v*v/2,term=v*v,w=f*v;if(i){var v0=u(t-hh);IU+=.5*hh*(v0*v0+term);IW+=.5*hh*f*(v0+v);}var rec=u0*u0/2+IW-IU;energy.push([t,e]);bal.push([t,rec]);maxDef=Math.max(maxDef,Math.abs(e-rec));}
 S=[{name:'E(t) = ||u||²/2 toy',data:energy},{name:'E0+work−dissip. toy',data:bal}];meta='one-mode ODE u_t=−u+0.7, νk²=1.0; trapezoid N='+n+'\nmax |energy defect|='+fmt(maxDef)+'; 원본 K 전체 적분/상계는 미확인.';
 }else if(id==='N8-05'){
 var n=Math.round(scale),records=[],val=[];for(var i=1;i<=n;i++){var N=16*(i+1),K=8+i,m=2+i,p=16+i,err={grid:1/(N*N),Fourier:1/K,order:Math.pow(2,-m),precision:Math.pow(2,-p)};val.push([i,Math.log10(Math.max(1e-18,err[axis]))]);}
 S=[{name:'log10(toy '+axis+' bound)',data:val}];
 meta='independent axis='+axis+'; depth='+n+'; other axes fixed in interpretation\nactual annular tail: UNKNOWN / last resolved τ: NOT RECORDED / BUDGET: OPEN';
 }
 chart(S,{xlabel:({'N6-01':'finite update j','N6-02':'x on 1D torus','N6-07':'finite stage j','N6-08':'radial q','N7-04':'τ=1−t','N7-05':'σ=t−1','N7-06':'time t','N8-05':'refinement step'})[id],label:id+' finite bounded model, not original source proof'});
 $('ms-m3eight-metrics').textContent=meta;
}
function activate(id){
 if(ids.indexOf(id)<0)return;selected=id;var c=original[id]||{};
 for(var i=0;i<nav.children.length;i++)nav.children[i].setAttribute('aria-selected',nav.children[i].dataset.task===id?'true':'false');
 $('ms-m3eight-title').textContent=id+' · '+(c.title||names[id]);
 $('ms-m3eight-description').textContent=hints[id]+' · 아래 값은 공개 원본 증거에서 계산한 값이 아닌, 명시적으로 구분된 유한 분석 예제입니다.';
 $('ms-m3eight-original').textContent='원문 기준: '+(c.exactCriterion||'인수인계 PDF의 원문 기준 참조');
 $('ms-m3eight-warning').textContent=warn[id]+' 공식 판정: OPEN / M3 전체 56/64 유지.';
 var checks=$('ms-m3eight-checks');checks.replaceChildren();(c.requiredChecks||[id+' original source-bound proof']).forEach(function(k){checks.append(elt('li',{},k+' — OPEN (독립 증거 필요)'));});
 var links=$('ms-m3eight-links');links.replaceChildren();(c.links||[]).slice(0,4).forEach(function(x){if(typeof x.url==='string'&&/^https:\/\/github\.com\/leegahuyn\/MathScopeCompute\//.test(x.url)){links.append(elt('a',{href:x.url,target:'_blank',rel:'noopener noreferrer'},x.label||'GitHub 원본'));}});
 if(id==='N6-01'){scale=4;rng(scale,1,8,.5,'toy moment amplitude');}
 if(id==='N6-02'){scale=20;rng(scale,5,60,1,'toy δu amplitude ×100');}
 if(id==='N6-07'){scale=50;rng(scale,5,79,1,'sample q ×100');}
 if(id==='N6-08'){scale=5;rng(scale,2,8,1,'active cutoff count J');}
 if(id==='N7-04'){scale=15;rng(scale,4,40,1,'min positive τ ×100');}
 if(id==='N7-05'){scale=3;rng(scale,2,9,1,'finite cutoff parameter b₀');}
 if(id==='N7-06'){scale=48;rng(scale,8,200,4,'trapezoid time N');}
 if(id==='N8-05'){scale=16;axis='grid';rng(scale,4,50,1,'independent refinement steps');}
 renderGraph();
}
for(var i=0;i<ids.length;i++){var id=ids[i],n=elt('button',{type:'button','data-task':id,'role':'tab','aria-selected':'false'});n.append(document.createTextNode(id+' · '+names[id]));n.append(elt('small',{},'OPEN · finite visual check'));n.addEventListener('click',(function(x){return function(){activate(x);};})(id));nav.append(n);}
btn.addEventListener('click',function(){activate(selected);if(typeof root.showModal==='function'&&!root.open)root.showModal();else root.setAttribute('open','');});
$('ms-m3eight-close').addEventListener('click',function(){if(typeof root.close==='function')root.close();else root.removeAttribute('open');});
root.addEventListener('click',function(e){if(e.target===root&&typeof root.close==='function')root.close();});
var m3=document.getElementById('mathscopeResearchM3');
if(m3){var anchor=m3.querySelector('.m3-boundary');if(anchor){var open=elt('button',{type:'button',style:'border:1px solid #67cbd3;border-radius:8px;padding:6px 10px;background:#0e455a;color:#eaffff;cursor:pointer;margin-left:8px;'},'N6–N8 잔여 8개 시각화 ↗');open.addEventListener('click',function(){btn.click();});anchor.append(open);}}
activate('N6-01');
})();
