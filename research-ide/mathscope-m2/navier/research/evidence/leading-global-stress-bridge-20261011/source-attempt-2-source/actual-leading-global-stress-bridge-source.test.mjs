import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareActualLeadingGlobalStressBridge,assertActualLeadingGlobalStressBridge,actualLeadingGlobalStressBridgeCertificate} from '../actual-leading-global-stress-bridge.mjs';

const start=performance.now(),p=prepareActualLeadingGlobalStressBridge({order:2,maxNodes:2000000},{onProgress:r=>console.log(JSON.stringify(r))}),G=p.G;

test('the leading bridge uses the same original heat-prepared global fields and all-join M0 proof',()=>{
  assert.equal(assertActualLeadingGlobalStressBridge(p),true);assert.ok(p.checks.every(c=>c.pass));
  const b=p.source.primitives.prepared.bootstrap;
  assert.equal(p.target.M,b.finalM);assert.equal(p.mass.sourcePrimitive,p.source.stream.roots.actualGlobalM0);
  assert.equal(p.source.stream.scope.actualGlobalLeadingMassPrimitiveIdentity,true);
  assert.equal(p.source.stream.scope.actualLeadingContinuityIdentity,true);
  assert.equal(G.parameter('h'),G.core.h??G.parameter('h'));
  assert.notEqual(G.parameter('h'),G.zero);
});

test('all four literal moments retain the complete density, axis and mixed FTC',()=>{
  assert.deepEqual(Object.keys(p.primitives),['I','J','S','Cp']);
  for(const row of Object.values(p.primitives)){
    assert.equal(G.nodes[row.literal].op,'definite_integral');assert.equal(row.lower,G.zero);
    assert.equal(row.upper,p.target.coordinates.X);assert.equal(row.axisDatum,G.zero);
    assert.ok(Object.values(row.checks).every(c=>c.pass));
    assert.equal(row.constantAfterIntegrandSupportRetained,true);
  }
  assert.equal(p.target.Pi,G.add(G.core.P0,p.target.Cp));
  assert.equal(p.roots.actualPressureAxis,G.core.P0);
});

test('actual independent radial and both tangential residuals cancel after source-authenticated substitutions',()=>{
  assert.deepEqual(Object.keys(p.identities.actualChecks),['radial','theta','axial']);
  assert.ok(Object.values(p.identities.actualChecks).every(c=>c.pass));
  assert.ok(Object.values(p.identities.targetBindings).every(c=>c.pass));
  assert.ok(p.residual.reduced.theta.trace.length>0);
  assert.ok(p.residual.reduced.axial.trace.length>0);
  assert.equal(p.scope.actualLeadingFullStressDivergenceCancellation,true);
  assert.equal(p.residual.axialViscosityFirstAppearsAtOrderOne,true);
});

test('deleting either original radial shear is independently rejected on the actual source operands',()=>{
  assert.equal(p.identities.negativeControls.missingThetaShear.pass,false);
  assert.equal(p.identities.negativeControls.missingZShear.pass,false);
  assert.equal(p.identities.generic.pass,true);
  assert.equal(p.identities.generic.negativeControls.wrongBackwardSign.pass,false);
});

test('source receipts cannot be copied or promoted into the infinite residual result',()=>{
  assert.throws(()=>assertActualLeadingGlobalStressBridge({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const old=p.scope.fullInfiniteStrengthenedPhysicalResidualFlatness;p.scope.fullInfiniteStrengthenedPhysicalResidualFlatness=true;
  assert.throws(()=>assertActualLeadingGlobalStressBridge(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.scope.fullInfiniteStrengthenedPhysicalResidualFlatness=old;
  assert.equal(assertActualLeadingGlobalStressBridge(p),true);
  for(const k of ['actualPositiveOrderStressCancellations','fullInfiniteStrengthenedPhysicalResidualFlatness','wholeGN4Complete','m3MayStart','numericalValuesComputed','newLeanKernelProof'])assert.equal(p.scope[k],false);
});

test('a changed density or target invalidates the private source audit',()=>{
  const old=p.primitives.J.density;p.primitives.J.density=G.zero;
  assert.throws(()=>assertActualLeadingGlobalStressBridge(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.primitives.J.density=old;
  const shear=p.target.terms.thetaShear;p.target.terms.thetaShear=G.zero;
  assert.throws(()=>assertActualLeadingGlobalStressBridge(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.target.terms.thetaShear=shear;
  assert.equal(assertActualLeadingGlobalStressBridge(p),true);
});

test('fixed graph certificate is unchanged by independent later appends',async()=>{
  const certificate=await actualLeadingGlobalStressBridgeCertificate(p);G.fresh('after_leading_stress_audit');
  assert.deepEqual(await actualLeadingGlobalStressBridgeCertificate(p),certificate);
  if(process.env.M2_LEADING_STRESS_EVIDENCE)fs.writeFileSync(process.env.M2_LEADING_STRESS_EVIDENCE,JSON.stringify({schema:'MathScope.ActualLeadingGlobalStressBridgeSourceRun/1',at:new Date().toISOString(),certificate,elapsedSeconds:(performance.now()-start)/1000,peakRSSBytes:process.resourceUsage().maxRSS*1024,pass:true},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({pass:true,graph:certificate.graph,internalChecks:p.checks.length}));
});
