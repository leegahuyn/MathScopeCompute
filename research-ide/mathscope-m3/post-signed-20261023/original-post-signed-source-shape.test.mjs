import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveOriginalPostSignedSourceShape as resolve} from './original-post-signed-source-shape.mjs';
function fixture(){
 const base={};const G={nodes:Array.from({length:100},(_,i)=>({op:i<2?'coordinate':'source_parameter',args:[]})),baseGraph:base};
 const band={G:base};
 const current={G:base,band};
 const originalPressure={schema:'MathScope.N6.GlobalActualCurrentPressure/1',current,
   geometry:{Y:[0,1]},cover:{rows:Array.from({length:81},(_,i)=>({key:i})),
     proof:{allCrossLabelProductsVanish:true}}};
 const bump={copies:[{}, {}, {}],powers:[1,2,3,4,5],mu:[1,2,3,4,5],
   coefficients:{angularMatrix:[[1],[2],[3]],axialMatrix:[[1],[2]]},
   sourceRestriction:{positiveAAndFiveMuFromSource:true,originalPositiveLambdaRetained:true}};
 const template={schema:'MathScope.N6.GlobalActualMomentCurrent/1',current,bumps:bump};
 const initializedMean={schema:'MathScope.N6.GlobalActualInitializedMean/1',temporal:{pressure:originalPressure},template};
 const angular={schema:'MathScope.N6.GlobalActualInitializedAngular/1',mean:initializedMean,G};
 const meanVelocity={beta:2,v:3,gamma:4};
 const forced={schema:'MathScope.N6.GlobalActualForcedCurrent/1',G,input:angular,mean:{completeBetaVGamma:meanVelocity}};
 const covariance=Object.fromEntries(['rr','rtheta','rz','thetatheta','thetaz','zz'].map((k,i)=>[k,i+10]));
 const refreshedMean={mean:{fullAngularCovariance:covariance,P:20,Jtheta:21,Jz:22},
     pressure:{value:23},checks:[{pass:true}]};
 const updated={updatedCovariance:covariance,updatedMean:refreshedMean};
 const signed={schema:'MathScope.N6.PR30SourceBoundSigned162Successor/1',G,input:forced,constructed:{updated}};
 return {G,base,band,current,originalPressure,bump,template,initializedMean,angular,
   meanVelocity,forced,covariance,refreshedMean,updated,signed};
}
const rejected=fn=>{const x=fixture();fn(x);assert.throws(()=>resolve(x.signed),{code:'POST_SIGNED_ORIGINAL_SOURCE_SHAPE_MISMATCH'});};
test('true PR30 source hierarchy resolves same original 3 geometric copies, not 5',()=>{
 const x=fixture(),a=resolve(x.signed);
 assert.equal(a.forced,x.forced);assert.equal(a.band,x.band);
 assert.equal(a.meanVelocity,x.meanVelocity);assert.equal(a.bump,x.bump);
 assert.equal(a.postSignedMean,x.refreshedMean);
});
test('wrong nominal Signed schema is not accepted',()=>rejected(x=>{x.signed.schema='not private signed';}));
test('stale Forced graph is rejected',()=>rejected(x=>{x.forced.G={nodes:[]};}));
test('swapped initialized-angular object is rejected',()=>rejected(x=>{x.angular.G={nodes:[]};}));
test('different baseline private current template is rejected',()=>rejected(x=>{x.template.current={G:x.base};}));
test('four or five geometric copies cannot be treated as original FiveMap',()=>rejected(x=>{x.bump.copies.push({});}));
test('missing last original J moment is rejected',()=>rejected(x=>{delete x.refreshedMean.mean.Jz;}));
test('Signed updated covariance identity cannot be broken',()=>rejected(x=>{x.refreshedMean.mean.fullAngularCovariance={...x.covariance};}));
test('new source pressure is required',()=>rejected(x=>{x.refreshedMean.pressure.value=-1;}));
test('all 81 original labels are mandatory',()=>rejected(x=>{x.originalPressure.cover.rows.pop();}));
test('unproved checked full-pressure state is rejected',()=>rejected(x=>{x.refreshedMean.checks[0].pass=false;}));
test('one original torus coordinate cannot be elided',()=>rejected(x=>{x.originalPressure.geometry.Y=[0];}));
