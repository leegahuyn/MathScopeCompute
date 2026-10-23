import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Source-shaped mock preflight: no real original private seal is granted here.
const source=readFileSync(new URL('./source-postfive-direct-split.mjs',import.meta.url),'utf8')
  .replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'');
const G={nodes:[]};
G.atom=()=>{const id=G.nodes.length;G.nodes.push({op:'atom',args:[]});return id;};
for(const name of ['add','sub','mul','div'])G[name]=(...args)=>{
  const id=G.nodes.length;G.nodes.push({op:name,args});return id;};
G.zero=G.atom();
const geometry={R:G.atom()},prior=[G.atom(),G.atom(),G.atom()],oldPressure=G.atom(),
  increments=[G.atom(),G.atom(),G.atom()],newPressure=G.atom(),
  direct=[G.atom(),G.atom(),G.atom()],divergence=G.atom();
const sourceShape={G,fixtureSeal:true,
  five:{temporal:{frontier:{signed:{constructed:{updated:{fullVelocity:prior,fullPressure:oldPressure}}}}}},
  source:{exactOriginalPhysicalGeometry:geometry},
  velocity:{newMeanIncrements:increments},pressure:{newMeanDelta:newPressure},
  residual:{conservative:direct,divergence}};
const deps={
 assertActualPostFiveFull3DPDE:x=>{if(!x?.fixtureSeal)throw Error('mock seal missing');return true;},
 originalCylindricalDifferentialOperators:()=>({Dr:()=>G.atom(),Dz:()=>G.atom(),angular:()=>G.atom(),R:geometry.R}),
 exactRealCylindricalPDE:()=>({conservativeResidual:[G.atom(),G.atom(),G.atom()],divergence:G.atom()})};
const {buildSourcePostFiveDirectSplit:build}=new Function(...Object.keys(deps),
 source+'\nreturn {buildSourcePostFiveDirectSplit};')(...Object.values(deps));
test('unsealed original field rejected in synthetic preflight',()=>assert.throws(()=>build({}),/mock seal missing/));
test('independent split preserves actual source roots and never upgrades equality',()=>{
 const r=build(sourceShape);
 assert.deepEqual(r.source.originalSignedVelocityRoots,prior);
 assert.equal(r.source.originalSignedPressureRoot,oldPressure);
 assert.equal(r.source.freshMeanPressureDeltaRoot,newPressure);
 assert.deepEqual(r.roots.direct,direct);
 assert.equal(r.roots.conservativeDecomposed.length,3);
 assert.equal(r.roots.defects.length,3);
 assert.equal(r.checks.allRootsValid,true);
 assert.equal(r.checks.actualOriginalRootIdentityProved,false);
 assert.equal(r.status,'SOURCE_BOUND_AST_CONSTRUCTED_EQUALITY_OPEN');
});
test('missing new field root fails closed',()=>{
 const changed={...sourceShape,velocity:{newMeanIncrements:[null,...increments.slice(1)]}};
 assert.throws(()=>build(changed),{code:'INVALID_ORIGINAL_POSTFIVE_SPLIT_SOURCE'});
});
