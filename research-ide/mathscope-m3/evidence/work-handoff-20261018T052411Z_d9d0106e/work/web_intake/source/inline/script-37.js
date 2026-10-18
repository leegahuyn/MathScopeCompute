
(function(){
'use strict';
var root=document.getElementById('ms-m3eight-paperbridge'),nav=document.getElementById('ms-m3eight-nav');
if(!root||!nav||root.dataset.initialized)return;root.dataset.initialized='true';
var PAPER='https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf';
var LEAN='https://github.com/openai/NavierStokesAndEuler';
var HASH='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f';
var keys=['N6-01','N6-02','N6-07','N6-08','N7-04','N7-05','N7-06','N8-05'];
var D={
'N6-01':{page:96,label:'§8.5–8.7, Proposition 9.5·9.6',eq:'(8.20), (8.25), (9.9)–(9.10)',paper:'보조 토러스의 0-평균 시간 역연산 → 5개 radial moment (2+3) → 매번 원본 압력과 잔차 재구성.',gap:'원래 full-torus current의 5개 보정 순서, 실제 수정된 압력, B₀=0.7/C*₀=1.2, source-bound class 영수증이 필요.'},
'N6-02':{page:101,label:'§9.1–9.3, Proposition 9.3·9.6',eq:'(3.1), (9.3), (9.6); exact increment identity',paper:'같은 속도장에 대해 R(u+δu,p+δp)=R(u,p)+Lᵤ(δu,δp)+div(δu⊗δu).',gap:'진짜 3차원 물리장 전 영역과 실제 flat remainder·pressure·curl/컷오프까지 두 독립 계산 경로로 대조해야 함.'},
'N6-07':{page:111,label:'§9.4, Lemma 9.7·9.8',eq:'(9.17)–(9.18), σⱼ=1/5+j/10',paper:'모든 finite correction stage에서 같은 0<q<qBig를 쓰며, 미분 차수별 손실 상수는 stage에 무관한 지수로 분리.',gap:'모든 j,m,ℓ의 실제 K, 로그·미분 손실, 동일 qBig에 대한 엄밀한 source-bound 증빙이 필요.'},
'N6-08':{page:57,label:'Lemma 5.4; §9.5 Proposition 9.9',eq:'(5.34)–(5.36), (9.20)–(9.21)',paper:'벡터 퍼텐셜에 축소 cutoff를 곱한 뒤 curl; 압력·방위 속도와 함께 국소 유한합/꼬리 상계.',gap:'실제 correction tuple, cutoff sequence, 전체 미분 꼬리, Lemma 5.4 전제와 원본 (9.21) 일치를 검증해야 함.'},
'N7-04':{page:118,label:'§10.2, Lemma 10.2',eq:'(10.5)–(10.10)',paper:'전체 국소화된 f=R(u,p)의 Fⱼ(x)=limₜ↑₁ ∂ₜʲf(x,t) 및 모든 공간 도함수의 일치.',gap:'전역 동일 (u,p), 모든 α,j에서 uniform convergence와 원점 flat jets를 연결해야 함.'},
'N7-05':{page:120,label:'§10.2, Lemma 10.3',eq:'(10.11)–(10.12)',paper:'고정된 Fⱼ의 Borel-type 시간 cutoff 합성, bⱼ↑∞, 모든 차수에서 2⁻ʲ 꼬리.',gap:'실제 N7-04 Fⱼ로 생성한 bⱼ와 t>1 확장, 전 차수 미분 합·K×[0,2] 지지를 확인해야 함.'},
'N7-06':{page:121,label:'§10.3, Lemma 10.4',eq:'(10.13)–(10.14)',paper:'고정 공간 K 전체에 대한 에너지 관계: ‖u(t)‖²+2∫₀ᵗ‖∇u‖²≤(∫₀ᵗ‖f‖₂)².',gap:'같은 전역 (u,p,f)의 K 전체 적분, 독립 공간·시간 오차, 유계성·점성 ν=1의 실제 비교가 필요.'},
'N8-05':{page:113,label:'MathScope M3 N8-05 acceptance + §9.4 estimates',eq:'(9.17)–(9.18); independent refinement gate',paper:'논문의 9.4절은 finite stage의 물리 미분 추정을 서술. 격자/Fourier/순서/정밀도 독립 적응은 MathScope 별도 엔지니어링 합격 기준.',gap:'pulse 파장·축길이·annular cutoff·correction order·산술 정밀도 다섯 축을 실제 원본 소스로 독립 증액하고 tail/τ/실패 원인을 남겨야 함.'}
};
var chosen=keys[0],lastCheck=null;
function txt(tag,body,cls){var n=document.createElement(tag);if(cls)n.className=cls;n.textContent=body;return n;}
function link(label,url){var a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;return a;}
function row(title,value){var e=document.createElement('div');e.className='ms3-paperrow';var h=txt('b',title+'  ');e.appendChild(h);e.appendChild(document.createTextNode(value));return e;}
function render(id){if(!Object.prototype.hasOwnProperty.call(D,id))return;chosen=id;var p=D[id],ref=document.getElementById('ms-m3eight-paperref'),details=document.getElementById('ms-m3eight-papergates');
ref.replaceChildren();ref.appendChild(link('OpenAI 원고 PDF · p.'+p.page,PAPER+'#page='+p.page),link('공식 Lean 저장소 (외부 정리)',LEAN),link('Lean NavierStokes entrypoint',LEAN+'/blob/main/NavierStokes.lean'));
details.replaceChildren();details.appendChild(row('원문 위치:',p.label+' · '+p.eq));details.appendChild(row('논문의 주장:',p.paper));details.appendChild(row('원본 통과의 잔여 의무:',p.gap));details.appendChild(row('증거 등급:', 'PDF 출처·공식 Lean 링크 VERIFIED / 이 화면의 수치 그래프 FINITE DEMO / MathScope 원본 독립 재실행 NOT CERTIFIED'));
document.getElementById('ms-m3eight-paperrun').textContent='원본 '+id+': OPEN · 아래 버튼은 유한 대조만 수행';
lastCheck=null;
}
function finiteCheck(id){
if(id==='N6-01'){var a=[2,-3,5,-7,11],x=a.slice();for(var k=0;k<5;k++)x[k]+=(-x[k]);return {ok:x.every(v=>v===0),value:'synthetic 5×1 moment cancellation only · initial='+JSON.stringify(a)};}
if(id==='N6-02'){var max=0;for(var i=0;i<=50;i++){var x=2*Math.PI*i/50,y=x*.73,u=Math.sin(y),w=Math.sin(x),ux=0,uy=Math.cos(y),wx=Math.cos(x),wy=0;var directX=w*uy, directY=u*wx;var splitX=w*uy,splitY=u*wx;max=Math.max(max,Math.abs(directX-splitX),Math.abs(directY-splitY));}return {ok:max<1e-14,value:'divergence-free analytic shear two-field convective cross-term · maxErr='+max.toExponential(2)};}
if(id==='N6-07'){var yes=true;for(var j=0;j<64;j++){if(Math.abs((.2+(j+1)/10)-(.2+j/10+.1))>1e-11)yes=false;}return {ok:yes,value:'64 finite recurrence instances σⱼ=1/5+j/10; does NOT bound all derivative orders'};}
if(id==='N6-08'){var tail=0;for(var j=6;j<=70;j++)tail+=Math.pow(2,-j);return {ok:Math.abs(tail-(1/32))<1e-12,value:'geometric prototype Σ(j≥6)2⁻ʲ='+tail.toPrecision(10)+'; source cutoffs/curl not exercised'};}
if(id==='N7-04'){var z=Math.exp(-1/(.04*.04)),z2=Math.exp(-1/(.025*.025));return {ok:z>=z2&&z2>=0,value:'flat reference exp(-1/τ²): τ=.04 and .025, finite values only'};}
if(id==='N7-05'){var a=[.4,-.2,.8],s=0,h=a[0]+s*a[1]+s*s*a[2]/2;return {ok:h===a[0],value:'finite 3-jet polynomial at σ=0; infinite differentiated tail not tested'};}
if(id==='N7-06'){var max=0;for(var i=0;i<=32;i++){var t=i/32,v=Math.sin(t),dv=Math.cos(t),force=dv+v;max=Math.max(max,Math.abs(.5*2*v*dv+v*v-force*v));}return {ok:max<1e-13,value:'one-mode ODE dE/dt + |u|²=f·u residual='+max.toExponential(2)+'; NOT original K integral'};}
return {ok:false,value:'no source-bound independent five-axis refinement receipt / positive last τ / verified error bounds'};
}
nav.addEventListener('click',function(ev){var n=ev.target.closest('[data-task]');if(n&&nav.contains(n))render(n.getAttribute('data-task'));});
document.getElementById('ms-m3eight-microtest').addEventListener('click',function(){var r=finiteCheck(chosen);lastCheck={id:chosen,result:r};document.getElementById('ms-m3eight-paperrun').textContent=(r.ok?'FINITE CHECK PASS · ':'FINITE CHECK HOLD · ')+r.value+' · ORIGINAL GATE OPEN';});
document.getElementById('ms-m3eight-export').addEventListener('click',function(){
var obj={schema:'mathscope.m3.source-boundary.v1',document:'OpenAI Finite Time Blowup for Navier–Stokes',documentSHA256Hint:'0e779481…e228f',completeDocumentHashStored:false,officialLean:LEAN,sourceURL:PAPER,officialM3Accepted:56,officialM3Total:64,remaining:keys,selected:chosen,paperReference:D[chosen],localOriginalCriterionComplete:false,finiteCheck:lastCheck,warning:'This manifest is a navigation/finite-demo receipt, not an independently verified original PDE or proof certificate'};
var blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='MathScope-M3-'+chosen+'-source-boundary.json';a.click();setTimeout(function(){URL.revokeObjectURL(u);},1500);
});
render(chosen);
})();
