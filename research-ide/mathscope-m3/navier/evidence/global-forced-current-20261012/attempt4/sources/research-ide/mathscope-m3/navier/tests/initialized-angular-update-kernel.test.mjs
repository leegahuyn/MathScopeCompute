import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {GlobalSourceExpressions} from '../source-global-expressions.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {SourceCoupledExpressions} from '../source-coupled-expressions.mjs';
import {exactOriginalAngularLift} from '../source-initialized-angular.mjs';
import {exactHarmonicComplexAlgebra,exactAngularResidualUpdate} from '../source-harmonic-assembly.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {verifyCompleteAngularResidualUpdate} from '../source-angular-update-verification.mjs';

function fixture(delta=4){
  const base=new GlobalSourceExpressions(new ActualConvergentExpressions(),{maxNodes:300000,maximumSlowOrder:16}),
    G=new SourceCoupledExpressions(new AuxiliarySourceExpressions(base,{maximumOrder:16})),
    [R,Z,T,theta,y0,y1,c0,c1,d0,d1]=['R','Z','T','theta','y0','y1','c0','c1','d0','d1'].map(x=>G.fresh(x)),
    rad=G.sqrt(G.q(2)),input={R,Z,T,theta,Y:[y0,y1],center:[c0,c1],copy:[d0,d1],levelDifference:delta,
      vr:[G.one,G.sub(G.one,rad)],vt:[G.sub(rad,G.one),G.one],Dgeom:G.sub(G.q(4),G.mul(G.q(2),rad)),
      Lambda:G.sub(G.q(4),rad),Tg:G.add(G.q(4),rad),ci:G.q(3,2),r0:G.q(1,10),epsilon:G.q(2,5),radialFast:G.add(G.one,R)},
    lift=exactOriginalAngularLift(G,input),C=exactHarmonicComplexAlgebra(G),parameters=[R,Z,T,y0,y1],
    share=(body,name)=>G.share(body,parameters,name),complex=(real,imaginary,name)=>C.value(share(real,name+'_real'),share(imaginary,name+'_imaginary')),
    positive={m:1,velocity:[complex(G.mul(R,y0),G.add(Z,y1),'wave_r'),complex(G.mul(T,y0),G.mul(R,y1),'wave_theta'),
      complex(G.add(R,T,y0),G.mul(Z,y1),'wave_z')],pressure:complex(G.mul(R,Z),G.mul(T,y0,y1),'wave_pressure')},
    negative={m:-1,velocity:positive.velocity.map(C.conjugate),pressure:C.conjugate(positive.pressure)},
    mean=[G.mul(R,G.exp(Z)),G.add(T,G.sine(y0)),G.mul(Z,y1)].map((x,j)=>C.value(share(x,'whole_mean_'+j))),
    previous=[{m:0,velocity:mean,pressure:C.value(share(G.exp(G.add(R,Z,y0)),'whole_mean_pressure'))}],
    phase=G.add(theta,G.mul(R,lift.xi),G.mul(T,lift.v),Z),k=G.q(2),
    oldFlatResidual=[{m:0,value:[C.value(G.exp(R)),C.value(G.exp(Z)),C.value(G.exp(T))]}],
    options={geometry:lift.geometry,phase,k,previous,increment:[positive,negative],oldFlatResidual},
    update=exactAngularResidualUpdate(G,options);
  return {G,C,input,lift,options,update,positive,negative};
}

test('the complete second-order PDE update retains every original lift and uses the exact quadratic coefficient field',()=>{
  for(let delta=0;delta<=4;delta++){
    const {G,update}=fixture(delta),result=verifyCompleteAngularResidualUpdate(G,update);
    assert.equal(result.pass,true,'delta='+delta);assert.deepEqual(result.modes,[-2,-1,0,1,2]);
    assert.equal(result.checks.length,30);assert.equal(result.actualDirectMinusDecomposedRecomputed,true);
    assert.equal(result.extraSourceRelationsAssumed,false);assert.equal(result.sourceAuthenticated,false);
    assert.ok(result.checks.every(c=>c.declaredDefectMatches&&c.numeratorMonomials===0&&c.productsUsed<=3000000));
  }
});

test('discarding pressure or the quadratic remainder is rejected even when an old declared defect is zero',()=>{
  const {G,C,options,update}=fixture(),wrongPressure=exactAngularResidualUpdate(G,{...options,
    increment:options.increment.map(r=>({...r,pressure:C.zero}))}),
    pressureMismatch={...update,direct:wrongPressure.direct},
    quadraticAt=new Map(update.newQuadraticRemainder.map(r=>[r.m,r.value])),
    missingQuadratic={...update,decomposed:update.decomposed.map(r=>({m:r.m,value:r.value.map((z,j)=>{
      const term=quadraticAt.get(r.m)?.[j]??C.zero;return C.sub(z,term);
    })}))};
  const p=verifyCompleteAngularResidualUpdate(G,pressureMismatch),q=verifyCompleteAngularResidualUpdate(G,missingQuadratic);
  assert.equal(p.pass,false);assert.ok(p.checks.some(c=>!c.declaredDefectMatches&&c.numeratorMonomials>0));
  assert.equal(q.pass,false);assert.ok(q.checks.some(c=>Math.abs(c.m)===2&&c.numeratorMonomials>0));
  const missing={...update,direct:update.direct.filter(r=>r.m!==2)};
  assert.throws(()=>verifyCompleteAngularResidualUpdate(G,missing),{code:'INVALID_INPUT'});
});

test('literal delta4 rational expansion is bounded without increasing the proof budget or omitting a source coefficient',()=>{
  const {G,update}=fixture(),limit=100000,
    legacy=createFactoredRationalVerifier(G,{maxTerms:180000,maxProducts:limit});
  assert.throws(()=>update.defect.forEach(r=>r.value.forEach(z=>['real','imaginary'].forEach(p=>legacy(z[p])))),{code:'RESOURCE_LIMIT'});
  const result=verifyCompleteAngularResidualUpdate(G,update,{maxProducts:limit});
  assert.equal(result.pass,true);assert.ok(result.checks.every(c=>c.productsUsed<limit));
  assert.equal(result.algebraicErrorIfPassing,'0');assert.deepEqual(result.finiteAngularModesDiscarded,[]);
});
