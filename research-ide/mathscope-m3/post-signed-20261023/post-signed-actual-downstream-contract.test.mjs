import test from 'node:test';
import assert from 'node:assert/strict';
import {attachActualPostSignedTemporalInverse,assertActualPostSignedTemporalInverse}
 from './source-signed-actual-temporal-inverse.mjs';
import {attachActualPostSignedFiveMap,assertActualPostSignedFiveMap}
 from './source-signed-actual-five-map.mjs';
import {exactFiveMomentCoefficients} from '../navier/source-global-moment.mjs';
import {ActualConvergentExpressions} from '../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';

test('post-Signed exact temporal AST rejects absent source private seal',()=>{
 assert.throws(()=>attachActualPostSignedTemporalInverse({}),{code:'INVALID_TEMPORAL_FRONTIER'});
});
test('post-Signed exact temporal AST rejects caller-supplied residuals',()=>{
 assert.throws(()=>attachActualPostSignedTemporalInverse({}, {sourceResidual:[0,0]}),
  {code:'INVALID_TEMPORAL_OPTIONS'});
});
test('post-Signed five-map AST rejects absent actual post-Signed temporal certificate',()=>{
 assert.throws(()=>attachActualPostSignedFiveMap({}),{code:'INVALID_POST_SIGNED_TEMPORAL_SEAL'});
});
test('post-Signed five-map refuses caller-provided reweighted target values',()=>{
 assert.throws(()=>attachActualPostSignedFiveMap({}, {targets:{P:0,Jtheta:0,Jz:0}}),
  {code:'INVALID_FIVEMAP_OPTIONS'});
});
test('generic post-Signed AST assertions never authenticate unrelated literal objects',()=>{
 assert.throws(()=>assertActualPostSignedTemporalInverse({}),{code:'INVALID_POST_SIGNED_TEMPORAL_SEAL'});
 assert.throws(()=>assertActualPostSignedFiveMap({}),{code:'INVALID_POST_SIGNED_FIVEMAP_SOURCE'});
});
test('same original three bump profiles generate an exact 3+2 FiveMap, independent of signed target values',()=>{
 const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),profiles=[q(3),q(1,2),q(1)],
   factors=[q(7),q(11),q(-13)],axialFactors=[q(5),q(23)],axialNode=q(2),axialRatio=q(3,4),
   targetA=[G.zero,q(-17),q(19)],targetZ=q(-29);
 const out=exactFiveMomentCoefficients(G,{angularNodes:profiles,angularFactors:factors,
   angularTargets:targetA,axialNode,axialRatio,axialFactors,axialTarget:targetZ});
 assert.equal(out.angular.length,3);
 assert.equal(out.axial.length,2);
 assert.equal(out.angularValues.length,3);
 assert.equal(out.axialValues.length,2);
 for(let i=0;i<3;i++)assert.equal(sourceGraphRationalIdentity(G,G.sub(out.angularValues[i],targetA[i])).pass,true);
 assert.equal(sourceGraphRationalIdentity(G,G.sub(out.axialValues[0],G.zero)).pass,true);
 assert.equal(sourceGraphRationalIdentity(G,G.sub(out.axialValues[1],targetZ)).pass,true);
});
