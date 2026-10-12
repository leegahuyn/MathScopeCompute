import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {GlobalSourceExpressions} from '../source-global-expressions.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {SourceCoupledExpressions} from '../source-coupled-expressions.mjs';
import {exactOriginalAngularLift,originalFixedLiftPulsePath,attachGlobalInitializedAngular} from '../source-initialized-angular.mjs';
import {originalForcedPulsePath} from '../source-forced-pulse.mjs';
import {createQuadraticSourceVerifier} from '../source-quadratic-identity.mjs';

function fixture(){
  const base=new GlobalSourceExpressions(new ActualConvergentExpressions(),{maxNodes:300000,maximumSlowOrder:16}),
    G=new SourceCoupledExpressions(new AuxiliarySourceExpressions(base,{maximumOrder:16})),
    [R,Z,T,theta,y0,y1,c0,c1,d0,d1,w]=['R','Z','T','theta','y0','y1','c0','c1','d0','d1','w'].map(x=>G.fresh(x)),
    r=G.sqrt(G.q(2)),input={R,Z,T,theta,Y:[y0,y1],center:[c0,c1],copy:[d0,d1],
      vr:[G.one,G.sub(G.one,r)],vt:[G.sub(r,G.one),G.one],Dgeom:G.sub(G.q(4),G.mul(G.q(2),r)),
      Lambda:G.sub(G.q(4),r),Tg:G.add(G.q(4),r),ci:G.q(3,2),r0:G.q(1,10),epsilon:G.q(2,5),radialFast:G.add(G.one,R)};
  return {G,input,w};
}

test('every original integer covering branch retains both complete common-Y derivative columns and the exact pulse normalization',()=>{
  const {G,input,w}=fixture();
  for(let levelDifference=0;levelDifference<=4;levelDifference++){
    const lift=exactOriginalAngularLift(G,{...input,levelDifference}),path=originalFixedLiftPulsePath(G,{lift,w});
    assert.ok(lift.checks.every(x=>x.pass));assert.ok(path.checks.every(x=>x.pass));
    assert.equal(lift.geometry.radialFast,G.div(input.radialFast,G.pow(input.Lambda,levelDifference)));
    assert.equal(lift.geometry.ci,G.div(input.ci,G.pow(input.Tg,levelDifference)));
    assert.equal(lift.fullCommonTorusPreimageRetained,true);assert.equal(lift.sourceAuthenticated,false);
    assert.equal(createQuadraticSourceVerifier(G)(G.sub(path.atPulse,w)).pass,true);
  }
});

test('a nonconstant full source keeps the original transverse basepoint when its whole body follows H_w',()=>{
  const {G,input,w}=fixture(),lift=exactOriginalAngularLift(G,{...input,levelDifference:3}),
    path=originalFixedLiftPulsePath(G,{lift,w}),
    body=G.add(G.mul(input.R,G.pow(lift.xi,2)),G.mul(input.Z,lift.v),G.mul(input.Y[0],input.Y[1])),
    actual=G.simultaneousSubstitute(body,input.Y,path.Hw),wrong=G.substitute(body,lift.v,w),
    expected=G.add(G.mul(input.R,G.pow(lift.xi,2)),G.mul(input.Z,w),G.mul(...path.Hw)),
    same=(a,b)=>createQuadraticSourceVerifier(G,{maxTerms:100000})(G.sub(a,b)).pass;
  assert.equal(same(actual,expected),true);assert.equal(same(actual,wrong),false);
  assert.ok(input.Y.every(y=>G.freeCoordinates(actual).has(y)));
});

test('wrong source eigenvalues, noninteger palette branches and serialized initialized fields acquire no original authority',()=>{
  const {G,input}=fixture();
  assert.throws(()=>exactOriginalAngularLift(G,{...input,levelDifference:2,Lambda:G.q(5)}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>exactOriginalAngularLift(G,{...input,levelDifference:5}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactOriginalAngularLift(G,{...input,levelDifference:1,copy:[G.zero,G.one]}),{code:'INVALID_INPUT'});
  assert.throws(()=>attachGlobalInitializedAngular({G,stages:{moments:{velocity:{beta:G.zero,v:G.zero,gamma:G.zero}}}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const lift=exactOriginalAngularLift(G,{...input,levelDifference:3}),w=G.fresh('w');
  assert.throws(()=>originalFixedLiftPulsePath(G,{lift:{...lift},w}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  // The historical rational-only helper is preserved: its generic scope
  // does not silently claim the original sqrt(2) integer-cover relation.
  assert.throws(()=>originalForcedPulsePath(G,{Y:input.Y,pulse:lift.v,w,ci:input.ci,Tg:input.Tg,levelDifference:3}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
