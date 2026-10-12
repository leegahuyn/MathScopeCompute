import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {physicalCenterFactoredHeatSlopeBodies,physicalCenterFactoredRatioIdentityAudit,
  attachActualPhysicalCenterSlowSlopeEnclosure,prepareActualPhysicalCenterSlowSlopeEnclosure,
  assertActualPhysicalCenterSlowSlopeEnclosure} from '../actual-physical-center-slow-slope-enclosure.mjs';

const fixture=()=>{
  const G=new ActualConvergentExpressions(),h=G.parameter('h'),v=G.fresh('gamma_compact_v'),oneMinus=G.sub(G.one,v),u=G.div(v,oneMinus),
    density=G.mul(G.exp(G.add(G.neg(u),G.mul(h,G.log(u)))),G.pow(oneMinus,-2)),gamma=G.integral(density,v,G.zero,G.one),
    p=physicalCenterFactoredHeatSlopeBodies(G,{h,gamma,density,variable:v,u});
  return {G,h,v,u,density,gamma,p};
};

test('the original compactified heat integrands through three are differentiated with the real positive h',()=>{
  const {G,h,p}=fixture();assert.equal(p.pass,true);assert.equal(p.sourceAuthenticated,false);assert.equal(p.checks.length,6);
  assert.ok(p.checks.every(x=>x.pass));assert.equal(p.roots.h,h);assert.equal(p.roots.moments.length,4);
  for(const r of p.roots.moments){const n=G.nodes[r];assert.ok(G.freeCoordinates(r).has(p.coordinates.z));assert.notEqual(r,G.one);assert.notEqual(n.op,'rational');}
  assert.match(p.interpretation,/strictly positive exponent h/);assert.match(p.derivativeRule,/full improper integral/);
});

test('the third Gamma delta derivative rejects a missing coefficient3 mixed term',()=>{
  const {G,h,p}=fixture(),r=p.roots,{z}=p.coordinates,third=p.checks.find(x=>x.id==='complete-Gamma-integrand-delta-order-3'),
    removed=G.mul(G.q(3),h,G.pow(z,2),G.add(G.one,h),r.momentBodies[2]),
    wrong=G.sub(third.expected,removed),check=sourceGraphRationalIdentity(G,G.sub(third.actual,wrong),{atomicNodes:[r.density,r.power],maxTerms:20000});
  assert.equal(check.pass,false);
});

test('the positive quotient factors retain all second-derivative inverse terms',()=>{
  const p=physicalCenterFactoredRatioIdentityAudit(new ActualConvergentExpressions());assert.equal(p.pass,true);
  assert.ok(p.checks.every(x=>x.pass));assert.equal(p.negativeControl.correctlyRejected,true);assert.equal(p.sourceAuthenticated,false);
});

test('a copied source-like object cannot authenticate the new point or replace h and tolerance',()=>{
  assert.throws(()=>attachActualPhysicalCenterSlowSlopeEnclosure({G:new ActualConvergentExpressions(),scope:{sameActualPhysicalCenter:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualPhysicalCenterSlowSlopeEnclosure({numerics:{mu:{R:0}}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>prepareActualPhysicalCenterSlowSlopeEnclosure({h:'0'}),{code:'INVALID_INPUT'});
  assert.throws(()=>prepareActualPhysicalCenterSlowSlopeEnclosure({tolerance:1e-12}),{code:'INVALID_INPUT'});
});
