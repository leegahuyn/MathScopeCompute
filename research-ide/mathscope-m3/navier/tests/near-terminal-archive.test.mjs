import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordedSourceNearTerminal,sourceNearTerminalObservations} from '../source-near-terminal-evidence.mjs';
import {SOURCE_NEAR_TERMINAL_ARCHIVE,SOURCE_NEAR_TERMINAL_ARCHIVE_SHA256} from '../source-near-terminal-evidence-data.mjs';

const actual=JSON.parse(readFileSync(new URL('../evidence/source-near-terminal-20261012/attempt2/near-terminal.json',import.meta.url)));

test('the archive retains every actual source interval and scalar expression without a new constructor',async()=>{
  const result=await recordedSourceNearTerminal();
  assert.equal(result.archiveSHA256,SOURCE_NEAR_TERMINAL_ARCHIVE_SHA256);
  assert.deepEqual(result.certificate,actual);assert.equal(result.recordedOnly,true);
  assert.equal(result.freshSourceConstructorExecuted,false);assert.equal(result.gate.nodeTests.passed,10);
  assert.ok(result.gate.independentCheckCount>=38);assert.equal(result.completeN8,false);
  assert.equal(result.lastResolvedTau.depth,12);assert.equal(result.lastResolvedTau.exactSign,'POSITIVE');
  assert.equal(result.lastResolvedTau.binary64,null);assert.equal(result.nextRefinementLimit.numericTauUnderflowIsFailure,false);
  assert.equal(result.lastResolvedTau.sourceNode,actual.rows.at(-1).tau.expression);
  assert.equal(result.lastResolvedTau.formulaRoot,actual.formulaProgram.roots.tau_12);
  assert.equal(result.nextRefinementLimit.reason,'ARCHIVED_OBSERVATION_SET_EXHAUSTED');
  assert.equal(result.finalFieldBridge.domainInclusionAudit.assertedMathematicalObstruction,false);
  assert.equal(result.finalFieldBridge.finalLocalizedFieldIdentified,false);
  assert.equal(result.finalFieldBridge.finalLocalizedCoreRestrictionIdentified,true);
  assert.equal(result.newSupportProofExecuted,true);assert.equal(result.coreRestrictionEvidence.sourcePoint.Xin,actual.point.Xin);
  assert.equal(result.coreRestrictionEvidence.sourceDomain.qStar,actual.formulaProgram.sourceNodeIds[actual.formulaProgram.roots.qStar]);
  assert.equal(result.proofSHA256,result.coreRestrictionEvidence.proofSHA256);
  assert.equal(result.scope.fullFinalN6FieldConstructed,false);
  assert.equal(result.nextRefinementLimit.sourceDomainPrerequisiteAuditStatus,'VERIFIED_SEPARATE_RECORDED_SOURCE');
  assert.equal(result.finalFieldBridge.domainInclusionAudit.separateRecordedDomainProofVerified,true);
  assert.equal(result.finalFieldBridge.domainInclusionAudit.sameOriginalSourceBinding,true);
  assert.equal(result.finalFieldBridge.domainInclusionAudit.sameOriginalLocalizationQStar,true);
  assert.equal(result.domainPrerequisiteEvidence.sourceDomainChoiceJustified,true);
  assert.equal(result.domainPrerequisiteEvidence.finalN6FieldConstructed,false);
  assert.equal(result.domainPrerequisiteEvidence.gate.nodeTests.passed,11);
  result.certificate.rows[0].components[0].interval.lower='0';
  assert.deepEqual((await recordedSourceNearTerminal()).certificate,actual,'consumer copies cannot alter the actual source archive');
});

test('caller certificates and mutated source archives cannot bypass byte validation',async()=>{
  for(const value of [null,[],{depths:[0]},{tau:0},{certificate:actual}])
    await assert.rejects(recordedSourceNearTerminal(value),{code:'INVALID_INPUT'});
  const interval=SOURCE_NEAR_TERMINAL_ARCHIVE.certificate.rows[0].components[0].interval,before=interval.lower;
  try{interval.lower='0';await assert.rejects(recordedSourceNearTerminal(),{code:'SOURCE_ARCHIVE_MISMATCH'});}
  finally{interval.lower=before;}
});

test('observation contracts preserve separate radial and tangential remainders and the final-field bridge',async()=>{
  const result=await recordedSourceNearTerminal(),observations=sourceNearTerminalObservations(result);
  assert.deepEqual(observations.samples,[]);assert.deepEqual(observations.curves,[]);
  assert.equal(observations.contract.physicalTimeRepresentation,'EXACT_SCALAR_FORMULA_DAG_ONLY');
  assert.equal(observations.contract.physicalVelocityRepresentation,'EXACT_POSITIVE_SCALE_TIMES_RATIONAL_INTERVAL');
  const claim=observations.claims[0];assert.match(claim.analyticSourceTail.radial,/3h/);
  assert.match(claim.analyticSourceTail.tangentialAxial,/2h/);
  assert.equal(claim.externalFinalFieldIdentification.dependencies.length,2);
  assert.equal(claim.finalDomainInclusion.domainInclusionAudit.archiveContainsFinalProposition99DomainProof,false);
  assert.equal(observations.contract.finalDomainInclusionProvedByThisArchive,false);
  assert.equal(observations.contract.separateRecordedDomainPrerequisiteVerified,true);
  assert.equal(observations.contract.sourceDomainArtifact.sha256,result.domainPrerequisiteEvidence.domainArtifact.sha256);
  assert.equal(observations.contract.domainPrerequisiteAuditStatus,'VERIFIED_SEPARATE_RECORDED_SOURCE');
  assert.equal(observations.contract.finalCoreRestrictionIdentificationExternal,false);
  assert.equal(observations.contract.supportProofSHA256,result.proofSHA256);
  assert.equal(observations.coreRestrictionProof.coreIdentity.allSpatialAndTimeDerivativesOfAnnularTermsZero,true);
  assert.equal(claim.historicalFinalFieldIdentificationUnchanged,true);
  assert.equal(claim.leanTheorem,null);assert.equal(claim.completeN6,false);assert.equal(claim.completeN8,false);
  for(const row of result.certificate.rows){assert.equal(row.components.length,3);
    assert.equal(row.tau.binary64,null);assert.equal(row.samePointAndTimeForAllComponents,true);
    assert.ok(row.components.every(component=>component.interval.midpointUsed===false&&component.physicalVelocity.binary64===null));}
});

test('the new core bridge rejects copied, changed, omitted or unrelated proof evidence',async()=>{
  const source=await recordedSourceNearTerminal();
  assert.throws(()=>sourceNearTerminalObservations({...source}),{code:'INVALID_SOURCE_ARCHIVE'});
  for(const change of [value=>{value.coreRestrictionEvidence.sourcePoint.Xin++;},
    value=>{value.coreRestrictionEvidence.sourceDomain.qStar++;},
    value=>{value.coreRestrictionEvidence.scope.fullFinalN6FieldConstructed=true;},
    value=>{value.coreRestrictionEvidence.supportInduction.trace.find(row=>row.operator==='FULL_RADIAL_MOMENT').zeroOnOpenCore=true;},
    value=>{value.coreRestrictionEvidence=null;},value=>{value.finalFieldBridge.finalLocalizedCoreRestrictionIdentified=false;},
    value=>{value.proofSHA256='0'.repeat(64);}]){
    const result=await recordedSourceNearTerminal();change(result);
    assert.throws(()=>sourceNearTerminalObservations(result),{code:'INVALID_SOURCE_ARCHIVE'});
  }
});

test('separate domain evidence cannot be presented as a constructed final field or a different source domain',async()=>{
  for(const change of [value=>{value.domainPrerequisiteEvidence.finalN6FieldConstructed=true;},
    value=>{value.finalFieldBridge.domainInclusionAudit.separateRecordedDomainProofVerified=false;},
    value=>{value.finalFieldBridge.domainInclusionAudit.sameOriginalLocalizationQStar=false;},
    value=>{value.finalFieldBridge.domainInclusionAudit.sameOriginalSourceBinding=false;},
    value=>{value.finalFieldBridge.domainInclusionAudit.archiveSHA256='0'.repeat(64);}]){
    const result=await recordedSourceNearTerminal();change(result);
    assert.throws(()=>sourceNearTerminalObservations(result),{code:'INVALID_SOURCE_ARCHIVE'});
  }
});
