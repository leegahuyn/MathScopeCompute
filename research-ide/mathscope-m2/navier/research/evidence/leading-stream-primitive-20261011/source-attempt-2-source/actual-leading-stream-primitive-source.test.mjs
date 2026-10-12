import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {prepareActualLeadingStreamPrimitive,assertActualLeadingStreamPrimitive,leadingStreamPrimitiveCertificate,attachActualLeadingStreamPrimitive} from '../actual-leading-stream-primitive.mjs';
const start=performance.now();
const r=prepareActualLeadingStreamPrimitive({}, {onProgress:v=>console.log('# progress '+JSON.stringify(v))});
const certificate=await leadingStreamPrimitiveCertificate(r);
if(process.env.M2_LEADING_STREAM_EVIDENCE)writeFileSync(process.env.M2_LEADING_STREAM_EVIDENCE,JSON.stringify({certificate,elapsedMs:performance.now()-start,peakRSSBytes:process.resourceUsage().maxRSS*1024},null,2)+'\n');
test('one original constructor supplies every leading field and all branch bindings',()=>{
  assert.equal(assertActualLeadingStreamPrimitive(r),true);assert.ok(r.checks.length>=25);assert.ok(r.checks.every(c=>c.pass));
  assert.equal(r.roots.actualGlobalM0,r.leading.finalM);assert.equal(r.roots.actualGlobalU0,r.leading.finalU);assert.equal(r.roots.actualGlobalv0,r.leading.finalv);
});
test('all four complete pregluing mass histories and both actual root equations remain',()=>{
  assert.equal(r.parts.preC12.completeMassHistory.length,5);assert.notEqual(r.parts.preC12.b8Equation,r.G.zero);
  assert.notEqual(r.parts.I1.rootEquation,r.G.zero);assert.equal(r.parts.preC12.finiteRootIterateDeclaredExact,false);assert.equal(r.parts.I1.finiteRootIterateDeclaredExact,false);
});
test('outer FTC keeps three main ranges, two full bump prefixes and both affine moment rows',()=>{
  assert.equal(r.parts.outer.pass,true);assert.equal(r.parts.outer.originalCompletePrefixes.bumps.length,2);assert.equal(r.parts.outer.affineRows.length,2);
  assert.ok(r.parts.outer.affineRows.every(v=>v.pass));assert.equal(r.parts.outer.proof.compactIntegrandImpliesZeroPrimitive,false);
});
test('C12 keeps the original fast phase and its entire debt and the axis value survives',()=>{
  assert.ok(r.checks.some(c=>c.id==='original-C12-physical-fast-phase-retained'&&c.pass));
  assert.equal(r.parts.modulation.entireDebt,r.leading.actualDebts[0]);assert.equal(r.parts.modulation.intervalAverageSubstituted,false);
  assert.equal(r.parts.stream.axisBoundaryRetained,r.leading.roots.actualGlobalAxisVX);
});
test('the source mass and stream theorem leaves Omega, full pressure, flatness and Lean gates distinct',()=>{
  assert.equal(certificate.scope.actualGlobalLeadingMassPrimitiveIdentity,true);assert.equal(certificate.scope.actualGlobalLeadingStreamReconstruction,true);
  for(const k of ['actualOmegaPrefixSourceBinding','wholeGlobalPressureConvolutionIdentity','allOrderPhysicalResidualFlatness','newLeanKernelProof','wholeGN4Complete','m3MayStart'])assert.equal(certificate.scope[k],false,k);
});
test('copied certificates, modified reports and user supplied derivatives have no source authority',()=>{
  assert.throws(()=>assertActualLeadingStreamPrimitive({...r}),/private original/);
  r.scope.actualGlobalLeadingMassPrimitiveIdentity=false;assert.throws(()=>assertActualLeadingStreamPrimitive(r),/private original/);r.scope.actualGlobalLeadingMassPrimitiveIdentity=true;
  assert.equal(assertActualLeadingStreamPrimitive(r),true);
  assert.throws(()=>attachActualLeadingStreamPrimitive(r.leading,{derivative:0}),/No replacement/);
});
