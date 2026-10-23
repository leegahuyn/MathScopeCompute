import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {finiteAuxiliaryInverse,exactAuxiliaryPi} from '../navier/source-auxiliary-fourier.mjs';
import {checkActualFiniteAuxiliaryIdentity} from '../navier/source-global-temporal.mjs';

function fixture(){
 const G=new ActualConvergentExpressions(),Y=[G.fresh('temporal_test_y0'),G.fresh('temporal_test_y1')],
   twoPi=G.mul(G.q(2),exactAuxiliaryPi(G).value),a=G.fresh('slow_parameter'),
   body=G.mul(a,G.cosine(G.mul(twoPi,Y[0])));
 return {G,Y,body};
}
test('original native finite Fourier operator preserves exact modes and source operator identity',()=>{
 const {G,Y,body}=fixture(),f=finiteAuxiliaryInverse(G,{body,Y,cutoff:1,derivativeOrders:[0,1]});
 assert.equal(f.rows.length,4);assert.equal(f.fullLatticeModeCount,8);
 assert.equal(f.zeroMode.inverted,false);assert.equal(f.omittedTailRetained,true);
 assert.equal(f.finiteSumClaimedWholeInverse,false);
 assert.equal(checkActualFiniteAuxiliaryIdentity(G,f).pass,true);
 assert.deepEqual(f.tails.map(x=>x.sourceDerivativeOrder),[4,5]);
 assert.ok(f.tails.every(x=>!x.omittedModesSetToZero&&x.tailTendsToZero));
});
test('native inverse refuses zero cutoff and caller-supplied fabricated bounds',()=>{
 const {G,Y,body}=fixture();
 assert.throws(()=>finiteAuxiliaryInverse(G,{body,Y,cutoff:0}),{code:'RESOURCE_LIMIT'});
 assert.throws(()=>finiteAuxiliaryInverse(G,{body,Y,cutoff:1,bound:0}),{code:'INVALID_INPUT'});
});
