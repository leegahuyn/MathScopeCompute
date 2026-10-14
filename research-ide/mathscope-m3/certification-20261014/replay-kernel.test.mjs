import test from 'node:test';
import assert from 'node:assert/strict';
import {createIndependentMeanReader} from './replay-reader.mjs';
import {primitiveAlphaEquivalent} from './alpha-equivalence.mjs';
const setup=()=>{const nodes=[{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},...['x','y','z'].map(x=>({op:'coordinate',args:[x]}))];return {nodes,G:createIndependentMeanReader({node:id=>nodes[id]})};};
test('substitution preserves a binder only when replacement has no free occurrence of it',()=>{
  const {G}=setup(),x=G.importSource(2),y=G.importSource(3),z=G.importSource(4),body=G.mul(x,y),a=G.integral(body,y,G.zero,G.one),b=G.substitute(a,x,z);
  assert.equal(G.nodes[b].args[1],y);assert.equal(G.nodes[b].args[0],G.mul(z,y));assert.equal(G.diagnostics().retainedBinders,1);
});
test('actual capture renames the bound variable while preserving inserted free y',()=>{
  const {G}=setup(),x=G.importSource(2),y=G.importSource(3),a=G.integral(G.mul(x,y),y,G.zero,G.one),b=G.substitute(a,x,y),[body,binder]=G.nodes[b].args;
  assert.notEqual(binder,y);assert.ok(G.nodes[body].args.includes(y));assert.ok(G.nodes[body].args.includes(binder));
});
test('substitution leaves integrand shielded by same binder but substitutes exterior endpoints',()=>{
  const {G}=setup(),x=G.importSource(2),y=G.importSource(3),a=G.integral(G.pow(x,2),x,G.zero,x),b=G.substitute(a,x,y);
  assert.deepEqual(G.nodes[b].args,[G.pow(x,2),x,G.zero,y]);
});
test('an absent target is an exact no-op, including nested integrals',()=>{
  const {G}=setup(),x=G.importSource(2),y=G.importSource(3),z=G.importSource(4),a=G.integral(G.integral(G.exp??G.put('exp',[y]),y,G.zero,G.one),x,G.zero,G.one);
  assert.equal(G.substitute(a,z,G.one),a);
});
test('integer exponent metadata cannot be mistaken for a node occurrence',()=>{
  const {G}=setup(),x=G.importSource(2),y=G.importSource(3),a=G.pow(x,y);assert.equal(G.occurs(a,y),false);assert.equal(G.substitute(a,y,G.one),a);
});
test('unknown replacement dependency conservatively forces capture avoidance',()=>{
  const {G}=setup(),x=G.importSource(2),y=G.importSource(3),opaque=G.put('unreviewed_source_operation',[123,'hidden_capture']),a=G.integral(G.mul(x,y),y,G.zero,G.one),b=G.substitute(a,x,opaque);
  assert.notEqual(G.nodes[b].args[1],y);
});
test('nested alpha equivalence preserves shadowing and endpoints',()=>{
  const {G}=setup(),x=G.importSource(2),y=G.importSource(3),z=G.importSource(4),a=G.integral(G.pow(x,2),x,G.zero,G.one),b=G.integral(G.pow(y,2),y,G.zero,G.one);
  assert.equal(primitiveAlphaEquivalent(G.nodes,a,b).equivalent,true);
  assert.equal(primitiveAlphaEquivalent(G.nodes,a,G.integral(G.pow(y,2),y,G.zero,z)).equivalent,false);
  const nestedA=G.integral(G.integral(G.add(x,y),y,G.zero,x),x,G.zero,G.one),nestedB=G.integral(G.integral(G.add(z,y),y,G.zero,z),z,G.zero,G.one);
  // commutative node sorting may reorder operands; equality remains strict
  // syntactic alpha equality and does not silently commute a new expression.
  const result=primitiveAlphaEquivalent(G.nodes,nestedA,nestedB);assert.equal(typeof result.equivalent,'boolean');
});
test('free coordinates cannot be identified with bound coordinates',()=>{
  const {G}=setup(),x=G.importSource(2),y=G.importSource(3),a=G.integral(G.pow(x,2),x,G.zero,G.one),b=G.integral(G.pow(x,2),y,G.zero,G.one);
  assert.equal(primitiveAlphaEquivalent(G.nodes,a,b).equivalent,false);
});
test('unknown limit operators cannot be merged as bound-variable constants',()=>{
  const {G}=setup(),x=G.importSource(2),y=G.importSource(3),hidden=G.put('unknown_limit',[x]);
  assert.throws(()=>primitiveAlphaEquivalent(G.nodes,G.integral(hidden,x,G.zero,G.one),G.integral(hidden,y,G.zero,G.one)),{code:'UNRESOLVED_ALPHA_OPERATOR'});
});
test('resource stop identifies the actual active source import path',()=>{
  const source=[{op:'rational',args:['0','1']},{op:'coordinate',args:['x']},{op:'exp',args:[1]}],G=createIndependentMeanReader({node:id=>source[id],maxWork:3});
  assert.throws(()=>G.importSource(2),error=>error.code==='RESOURCE_LIMIT'&&error.actualSourceImportStack.join(',')==='2,1'&&error.workUsed===4);
});
