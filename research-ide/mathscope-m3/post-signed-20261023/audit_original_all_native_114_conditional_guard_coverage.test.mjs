import test from 'node:test';
import assert from 'node:assert/strict';
import {conditionalNodeMask} from './audit_original_all_native_114_conditional_guard_coverage.mjs';

const coord=new Map([[27,1n],[90,2n]]);
test('selected BEFORE at original Xa removes source natural dependency conditionally',()=>{
 const node={op:'smooth_piecewise',args:[27,3617,3618,44,45,46]};
 assert.equal(conditionalNodeMask(node,[0n,0n,0n,1n,0n,0n],0n,coord),0n);
});
test('selected INSIDE at original Xa exp(2t1) removes matching source coordinate',()=>{
 const node={op:'smooth_piecewise',args:[90,3624,3627,44,45,46]};
 assert.equal(conditionalNodeMask(node,[0n,0n,0n,0n,2n,0n],0n,coord),0n);
});
test('unproved global right endpoint does not silence inside natural call',()=>{
 const node={op:'smooth_piecewise',args:[90,3624,28824,44,45,46]};
 assert.equal(conditionalNodeMask(node,[0n,0n,0n,0n,2n,0n],0n,coord),2n);
});
test('guard for a different coordinate never erases natural-series input',()=>{
 const node={op:'smooth_piecewise',args:[27,3617,3627,44,45,46]};
 assert.equal(conditionalNodeMask(node,[0n,0n,0n,0n,2n,0n],0n,coord),2n);
});
test('AFTER branch is never protected by earlier finite-radius upper bound',()=>{
 const node={op:'smooth_piecewise',args:[27,3617,3627,44,45,46]};
 assert.equal(conditionalNodeMask(node,[0n,0n,0n,0n,0n,1n],0n,coord),1n);
});
test('natural-series call occurring in condition is never erased',()=>{
 const node={op:'smooth_piecewise',args:[27,3617,3627,44,45,46]};
 assert.equal(conditionalNodeMask(node,[1n,0n,0n,1n,0n,0n],0n,coord),1n);
});
test('outer different coordinate does not prove original x-domain',()=>{
 const node={op:'smooth_piecewise',args:[28,3617,3627,44,45,46]};
 assert.equal(conditionalNodeMask(node,[0n,0n,0n,1n,0n,0n],0n,coord),1n);
});
test('normal source DAG propagates unprotected series bit',()=>{
 assert.equal(conditionalNodeMask({op:'add',args:[0,1]},[4n,8n],0n,coord),12n);
});
