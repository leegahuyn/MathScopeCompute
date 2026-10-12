import test from 'node:test';
import assert from 'node:assert/strict';
import {originalRepresentativeBoxReduction,finishOriginalBoxRepresentative} from '../source-global-representative.mjs';

// A separate ordinary-real numerical exercise of the geometric kernel.
// These artificial inputs NEVER provide original-source authority or a
// numeric certificate for the enormous fixed physical source constants.
const O={zero:0,one:1,q:(n,d=1)=>Number(n)/Number(d),add:(...x)=>x.reduce((a,b)=>a+b,0),
  mul:(...x)=>x.reduce((a,b)=>a*b,1),sub:(x,y)=>x-y,div:(x,y)=>x/y,neg:x=>-x,
  pow:(x,n)=>x**n,exp:Math.exp,log:Math.log,sqrt:Math.sqrt,maximum:(...x)=>Math.max(...x),
  choose:(x,l,r,a,m,b)=>x<=l?a:x>=r?b:m};
function select(box,h,Xa,Xb){
  const reduction=originalRepresentativeBoxReduction(O,{...box,Xa,Xb,h}),Z=reduction.Z,T=reduction.T;
  let left=.5,right=2;
  for(let k=0;k<90;k++){
    const mid=(left+right)/2;
    if(mid-Z*Z*mid**(2*h)<T)left=mid;else right=mid;
  }
  return {reduction,point:finishOriginalBoxRepresentative(O,reduction,(left+right)/2)};
}
function contains(box,p,Xa,Xb){
  for(const [key,name]of [['radiusBox','R'],['axialBox','Z'],['timeBox','T']])
    assert.ok(box[key][0]<p[name]&&p[name]<box[key][1],key+' contains selected '+name);
  assert.ok(.5<p.s&&p.s<2);assert.ok(Xa<p.X&&p.X<Xb);assert.ok(p.T>0&&Math.abs(p.eta)<1);
}

test('the interval construction stays in every tested original-shape active box, without using its generating point',()=>{
  let count=0;
  for(const h of [1/1000,1/32,1/17])for(const ell of [1,2,3,5])
    for(const s of [.62,.87,1.13,1.61])for(const eta of [-.93,-.17,0,.31,.94])for(const X of [.51,.91,1.3,3.99]){
      const Xa=.5,Xb=4,R=Math.sqrt(2*s*X),Z=s**(.5-h)*eta,T=s*(1-eta*eta),factor=ell**6,
        mesh=[R,Z,T].map(v=>Math.floor(v*factor+.5)),boxes=mesh.map(j=>[(j-.75)/factor,(j+.75)/factor]),
        box={radiusBox:boxes[0],axialBox:boxes[1],timeBox:boxes[2]},r=select(box,h,Xa,Xb);
      contains(box,r.point,Xa,Xb);
      assert.equal(r.reduction.sourceAuthenticated,false);
      assert.ok(Math.hypot(r.point.R-R,r.point.Z-Z,r.point.T-T)<4/factor);
      count++;
    }
  assert.equal(count,960);
});

test('negative-first is a fixed geometric choice even when both sign intervals exist',()=>{
  const box={radiusBox:[.8,2],axialBox:[-.4,.4],timeBox:[.4,1.4]},r=select(box,1/32,.25,4);
  assert.ok(r.reduction.negativeWidth>0&&r.reduction.positiveWidth>0);
  assert.ok(r.point.Z<0);
  assert.deepEqual(select(box,1/32,.25,4),r);
  contains(box,r.point,.25,4);
});

test('a positive-only box selects the other interval and retains the nonlinear h term',()=>{
  const box={radiusBox:[1,2],axialBox:[.41,.47],timeBox:[.4,.9]},r=select(box,1/17,.25,4);
  assert.ok(r.reduction.negativeWidth<=0&&r.reduction.positiveWidth>0);
  assert.ok(r.point.Z>.41);
  assert.ok(Math.abs(r.point.s-r.point.Z**2*r.point.s**(2/17)-r.point.T)<2e-15);
  contains(box,r.point,.25,4);
});

test('empty or merely touching boxes receive no nonempty-domain/source certificate',()=>{
  for(const radiusBox of [[-2,-1],[0,0],[4,4]]){
    const r=originalRepresentativeBoxReduction(O,{radiusBox,axialBox:[0,.1],timeBox:[0,.1],Xa:1,Xb:2,h:1/32});
    assert.equal(r.sourceAuthenticated,false);
    assert.equal(r.nonemptyActiveIntersectionRequired,true);
    assert.equal(Object.hasOwn(r,'certifiedNonempty'),false);
  }
});
