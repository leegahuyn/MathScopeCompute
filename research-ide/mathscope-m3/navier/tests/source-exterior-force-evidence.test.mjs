import test from 'node:test';
import assert from 'node:assert/strict';
import {SOURCE_EXTERIOR_DOMAIN_ARCHIVE} from '../source-exterior-force-evidence-data.mjs';
import {recordedSourceN7DomainExterior,recordedSourceLocalizationDomain,sourceExteriorForceObservations} from '../source-exterior-force-evidence.mjs';

test('recorded N7 domain/exterior consumer rehashes the source record and keeps complete raw artifact links',async()=>{
  const result=await recordedSourceN7DomainExterior();
  assert.equal(result.recordedOnly,true);assert.equal(result.freshSourceConstructorExecuted,false);assert.ok(result.checks.every(r=>r.pass));
  assert.equal(result.gate.nodeTests.passed,11);assert.equal(result.gate.sourceFilesUnchanged,true);
  assert.equal(result.domain.initialPrerequisites.length,5);assert.equal(result.domain.checks.length,12);
  assert.equal(result.completeN7,false);assert.equal(result.wholeKEnergyNearTerminalComputed,false);assert.equal(result.globalForceExtensionConstructed,false);
  assert.equal('formulaProgram' in result.exterior,false);assert.equal(result.fullScalarProgram.fullArtifactRetainedInRepository,true);
  assert.equal(result.fullScalarProgram.completeFormulaProgramIncludedInThisRecord,false);
  assert.match(result.exteriorArtifact.sha256,/^[a-f0-9]{64}$/);assert.match(result.domainArtifact.sha256,/^[a-f0-9]{64}$/);
  assert.equal(result.fullScalarProgram.scalarProgramSHA256,result.exterior.graph.scalarProgramSHA256);
});

test('source archive input overrides, removed initial premises and mutated recorded fields are rejected',async()=>{
  for(const input of [{qStar:'1e-12'},{h:0},{force:[0,0,0]},{proof:true}])await assert.rejects(recordedSourceN7DomainExterior(input),{code:'INVALID_INPUT'});
  const last=SOURCE_EXTERIOR_DOMAIN_ARCHIVE.domain.initialPrerequisites.pop();
  try{await assert.rejects(recordedSourceN7DomainExterior(),{code:'SOURCE_ARCHIVE_MISMATCH'});}
  finally{SOURCE_EXTERIOR_DOMAIN_ARCHIVE.domain.initialPrerequisites.push(last);}
  const result=await recordedSourceN7DomainExterior();result.exterior.rows[0].midpoint.normalizedDivergence.sign='ZERO';
  assert.throws(()=>sourceExteriorForceObservations(result),{code:'INVALID_SOURCE_ARCHIVE'});
});

test('browser observations expose exact ratios and all five source jets with restricted scope',async()=>{
  const result=await recordedSourceN7DomainExterior(),observations=sourceExteriorForceObservations(result),domain=await recordedSourceLocalizationDomain();
  assert.equal(observations.forceRows.length,5);assert.deepEqual(observations.forceRows.map(r=>r.order),[0,1,2,3,4]);
  assert.equal(observations.domain.qBigOverCommonQStar,'1/64');assert.equal(observations.domain.supportOverQBig,'1/4');
  assert.ok(observations.forceRows.every(r=>r.divergenceSign==='NEGATIVE'&&r.tinyPositiveHRetained&&!r.wholeGlobalJet));
  assert.deepEqual(observations.samples,[]);assert.deepEqual(observations.curves,[]);
  assert.equal(domain.recordedOnly,true);assert.equal(domain.sourceDomainChoiceJustified,true);assert.equal(domain.externalSourceTheoremApplied,true);
  assert.equal(domain.finalN6FieldConstructed,false);assert.equal(domain.finalLocalizedNonzeroFieldIdentifiedByThisConsumer,false);
  assert.equal(domain.domainArtifact.sha256,result.domainArtifact.sha256);assert.equal(domain.archiveSHA256,result.archiveSHA256);
});
