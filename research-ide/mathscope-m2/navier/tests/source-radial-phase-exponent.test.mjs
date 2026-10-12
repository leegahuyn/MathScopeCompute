import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {originalRadialPhaseExponentRecipe,originalSourceRadialPhase,assertOriginalSourceTorusMap,ORIGINAL_RADIAL_PHASE_SPECIFICATION} from '../source-radial-phase-exponent.mjs';
import {point,iadd,isub,imul,idiv} from '../../../mathscope-m1/navier/numerics.mjs';

const err={code:'INVALID_SOURCE_CONSTRUCTION'},fixture=()=>{
  const G=new ActualSourceExpressions(),p=originalSourceRadialPhase(G);
  return {G,p,map:{Lambda:p.Lambda,rho:p.rho,dr:p.dr}};
};
const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:1000}).pass;

test('the exact source retains the original outer parentheses, kappa and strictly positive h definition',()=>{
  const {G,p,map}=fixture(),binding=assertOriginalSourceTorusMap(G,{h:p.h,Tg:p.Tg,physicalMap:map});
  const independent=G.mul(G.q(2),G.sub(G.mul(G.add(G.one,p.h),p.rho),G.div(p.h,G.q(100000))));
  assert.equal(p.dr,independent);assert.deepEqual(G.nodes[p.kappa],{op:'rational',args:['1','100000']});
  assert.equal(binding.comparison.allSixExpectedBodiesMatched,true);
  assert.equal(binding.parameterBindings.expandedH,'exp(-8002*(exp(1048576)+10))');
  assert.equal(binding.scope.fullPhysicalGraphExecutionProved,false);
  assert.equal(ORIGINAL_RADIAL_PHASE_SPECIFICATION.formula,'2*((1+h)*rho_g-h*kappa_s)');
});

test('the previous missing factor is rejected and its exact nonzero discrepancy is h*kappa',()=>{
  const {G,p,map}=fixture(),old=G.sub(G.mul(G.q(2),G.add(G.one,p.h),p.rho),G.mul(p.h,p.kappa));
  assert.throws(()=>assertOriginalSourceTorusMap(G,{h:p.h,Tg:p.Tg,physicalMap:{...map,dr:old}}),err);
  assert.equal(equal(G,G.sub(old,p.dr),G.mul(p.h,p.kappa)),true);
  assert.equal(equal(G,old,p.dr),false);assert.notEqual(p.h,G.zero);
});

test('the covering identity has epsilon exponent minus kappa, and the old half exponent fails',()=>{
  const {G,p}=fixture(),logQ=G.var('logQ'),logS=G.var('logS'),logRatio=G.var('log_covering_ratio'),
    paletteLog=G.mul(p.rho,G.sub(G.sub(G.neg(G.mul(G.add(G.one,p.h),logQ)),logS),logRatio)),
    logM=G.add(paletteLog,G.mul(G.div(p.dr,G.q(2)),logQ)),
    expected=G.neg(G.add(G.mul(p.kappa,p.h,logQ),G.mul(p.rho,logS),G.mul(p.rho,logRatio))),
    half=G.neg(G.add(G.mul(G.q(1,2),p.kappa,p.h,logQ),G.mul(p.rho,logS),G.mul(p.rho,logRatio)));
  assert.equal(equal(G,logM,expected),true);assert.equal(equal(G,logM,half),false);
  assert.equal(equal(G,G.sub(G.div(p.dr,G.q(2)),G.mul(G.add(G.one,p.h),p.rho)),G.neg(G.mul(p.h,p.kappa))),true);
});

test('zero h and altered geometric constants are not accepted as source replacements',()=>{
  const {G,p,map}=fixture();
  assert.throws(()=>originalSourceRadialPhase(G,{h:G.zero,Tg:p.Tg}),err);
  assert.throws(()=>originalSourceRadialPhase(G,{h:p.h,Tg:G.q(5)}),err);
  assert.throws(()=>assertOriginalSourceTorusMap(G,{h:p.h,Tg:p.Tg,physicalMap:{...map,rho:G.zero}}),err);
});

test('a stale hash-cons cache cannot hide mutation of an original exponent operand',()=>{
  const {G,p,map}=fixture(),saved=structuredClone(G.nodes[p.kappa]);
  G.nodes[p.kappa]={op:'rational',args:['1','200000']};
  assert.throws(()=>assertOriginalSourceTorusMap(G,{h:p.h,Tg:p.Tg,physicalMap:map}),err);
  G.nodes[p.kappa]=saved;
  assert.equal(assertOriginalSourceTorusMap(G,{h:p.h,Tg:p.Tg,physicalMap:map}).comparison.sameDrRoot,true);
});

test('changing the source h definition is rejected even when the source_parameter root is unchanged',()=>{
  const {G,p,map}=fixture();G.source.parametersExactExpressions.h={integer:0};
  assert.throws(()=>assertOriginalSourceTorusMap(G,{h:p.h,Tg:p.Tg,physicalMap:map}),err);
});

test('the same recipe gives an outward finite interval that excludes the old half correction',()=>{
  const O={one:point(1),q:point,add:iadd,sub:isub,mul:imul},h=point(1/16),rho=point(1/2),kappa=idiv(point(1),point(100000)),
    actual=originalRadialPhaseExponentRecipe(O,{h,rho,kappa}),correct=idiv(point(849999),point(800000)),
    old=idiv(point(1699999),point(1600000));
  assert.ok(actual[0]<=correct[0]&&actual[1]>=correct[1]);assert.ok(actual[1]<old[0]);
});

test('literal audit records survive unrelated append and contain no shared mutable source nodes',()=>{
  const {G,p,map}=fixture(),first=assertOriginalSourceTorusMap(G,{h:p.h,Tg:p.Tg,physicalMap:map}),before=JSON.stringify(first);
  G.exp(G.q(7));assert.equal(JSON.stringify(assertOriginalSourceTorusMap(G,{h:p.h,Tg:p.Tg,physicalMap:map})),before);
  first.nodes[0].args[0]='mutated receipt';assert.notEqual(G.nodes[first.nodes[0].id].args[0],'mutated receipt');
});
