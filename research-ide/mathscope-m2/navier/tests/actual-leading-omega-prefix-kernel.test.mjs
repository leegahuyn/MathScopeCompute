import test from 'node:test';
import assert from 'node:assert/strict';
import {originalLeadingOmegaPrefixIdentity,originalLeadingMassContinuityDefect} from '../actual-leading-omega-prefix-kernel.mjs';

test('the original whole Omega prefix has exactly its divergence defect, including both radial boundary terms',()=>{
  const r=originalLeadingOmegaPrefixIdentity();assert.equal(r.factorization.pass,true);
  for(const c of Object.values(r.negativeControls))assert.equal(c.pass,false);
  assert.equal(r.retainedTerms.length,10);assert.equal(r.sourceFieldsAuthenticated,false);
  assert.equal(r.axisConstantValueCheckedHere,false);
});

test('the full eta-dependent mass reconstruction gives the exact continuity defect and rejects its omitted eta term',()=>{
  const r=originalLeadingMassContinuityDefect();assert.equal(r.check.pass,true);
  assert.equal(r.negativeControls.missingEtaMass.pass,false);
  assert.equal(r.actualMassIdentityAssumedByThisKernel,false);assert.equal(r.sourceFieldsAuthenticated,false);
});
