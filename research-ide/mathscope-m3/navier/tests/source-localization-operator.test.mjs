import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SOURCE_NEAR_TERMINAL_ARCHIVE} from '../source-near-terminal-evidence-data.mjs';
import {executeLocalizationJetAlgebra} from '../localization-jet-algebra.mjs';
import {sourceLocalizationOperatorProof,assertSourceLocalizationOperatorProof,sourceLocalizationOperatorObservations,replayCapturedLocalizationCutoff} from '../source-localization-operator.mjs';

const proof=await sourceLocalizationOperatorProof({});
const alteredProgram=()=>structuredClone(SOURCE_NEAR_TERMINAL_ARCHIVE.certificate.formulaProgram);

test('the original fifteen velocity coefficients and pressure use the same captured cutoff and source fields',()=>{
  assert.equal(proof.sourceOperator.sharedFieldInstance,'ORIGINAL_PROP9_9_FINAL_FIELDS_ON_SAME_COMMON_DOMAIN');
  assert.equal(proof.sourceBinding.parameterExpressionSHA256,'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152');
  assert.equal(proof.coefficientBinding.sourceCutoff,proof.coefficientBinding.sourcePressure);
  assert.equal(proof.sourceOperator.velocity.reduce((n,row)=>n+row.terms.length,0),15);
  assert.deepEqual(proof.coefficientBinding.sourceFields,['A','B_e_theta','p_loc']);
  assert.equal(proof.sourceEvidence.sourceFiles.length,2);
  assert.equal(proof.sourceDomain.qBig,622791);
});

test('actual open cutoff gradients, all Hessian entries, tau sign and Laplacian are freshly replayed exactly',()=>{
  const replay=proof.cutoffReplay;
  assert.equal(replay.checks.length,18);
  assert.ok(replay.checks.every(row=>row.pass));
  assert.ok(replay.reconstructedNodes>100&&replay.reconstructedNodes<1000);
  assert.equal(replay.originalClosedConstantsNumericallySubstituted,false);
  assert.equal(replay.freshFullCommonSourceConstructorExecuted,false);
  assert.equal(replay.flatSeams.rows.length,5);
  assert.equal(replay.flatSeams.finiteJetValuesUsedToInferSmoothness,false);
});

test('complete residual, structural divergence and force pressure relation cancel as exact polynomials',()=>{
  assert.equal(proof.algebra.checks.length,8);
  assert.ok(proof.algebra.checks.every(row=>row.pass&&row.remainingMonomials.every(n=>n===0)));
  assert.ok(proof.algebra.statistics.forceMonomials>400);
  assert.ok(proof.algebra.statistics.forceDivergenceMonomials>200);
  assert.equal(proof.algebra.statistics.floatingPointDecisions,false);
  assert.equal(proof.algebra.localResidualAssumedZero,false);
  assert.equal(proof.algebra.arbitraryJetValuesAssumedToSatisfyPDE,false);
});

test('every nonzero commutator family has an actual omission witness, while g dot grad c cancels',()=>{
  assert.equal(proof.algebra.commutators.length,10);
  const zero=proof.algebra.commutators.filter(row=>row.monomialCount===0);
  assert.deepEqual(zero.map(row=>row.id),['curl-commutator-cutoff-advection']);
  assert.ok(proof.algebra.negativeControls.every(row=>row.nonzero&&row.residual.some(p=>p.length)));
  for(const row of proof.algebra.commutators.filter(row=>row.monomialCount))
    assert.ok(proof.algebra.negativeControls.some(control=>control.id==='omitted-'+row.id));
});

test('omitting a captured grad(c) cross A term or changing curl orientation fails substantive algebra',()=>{
  const omitted=structuredClone(proof.coefficientBinding.rows);omitted[0].terms.splice(2,1);
  assert.throws(()=>executeLocalizationJetAlgebra(omitted),error=>error.code==='LOCALIZATION_ALGEBRA_FAILED');
  const wrong=structuredClone(proof.coefficientBinding.rows);wrong[1].terms[0].coefficient.sign=-1;
  assert.throws(()=>executeLocalizationJetAlgebra(wrong),error=>error.code==='LOCALIZATION_ALGEBRA_FAILED');
});

test('a changed actual captured cutoff gradient is rejected by a fresh derivative comparison',()=>{
  const p=alteredProgram();p.sourceLocalizationProgramRoots.gradient_0=p.sourceLocalizationProgramRoots.gradient_1;
  assert.throws(()=>replayCapturedLocalizationCutoff(p),error=>error.code==='SOURCE_CUTOFF_DERIVATIVE_MISMATCH');
});

test('dropping the physical negative tau derivative and changing a support branch are rejected',()=>{
  const p=alteredProgram(),roots=p.sourceLocalizationProgramRoots,dt=p.nodes[roots.dt];
  assert.equal(dt.op,'multiply');
  roots.dt=dt.args.find(i=>p.nodes[i].op!=='rational');
  assert.throws(()=>replayCapturedLocalizationCutoff(p),error=>error.code==='SOURCE_CUTOFF_DERIVATIVE_MISMATCH');
  const changed=alteredProgram(),chi=changed.nodes[changed.sourceLocalizationProgramRoots.chiTime];
  chi.args[3]=chi.args[5];
  assert.throws(()=>replayCapturedLocalizationCutoff(changed),error=>error.code==='INVALID_SOURCE_CUTOFF');
});

test('the same-source nonzero force divergence survives all five observed exterior orders',()=>{
  const rows=proof.recordedNonzeroForceDivergence.sourceRows;
  assert.deepEqual(rows.map(row=>row.order),[0,1,2,3,4]);
  assert.ok(rows.every(row=>row.divergenceSign==='NEGATIVE'&&row.divergenceScale==='S_j'&&row.wholeGlobalJet===false));
  assert.equal(proof.proofScope.forceWasLerayProjected,false);
  assert.ok(proof.algebra.negativeControls.some(row=>row.id==='omitted-force-divergence-breaks-pressure-poisson'&&row.nonzero));
  assert.ok(proof.algebra.negativeControls.some(row=>row.id==='theta-dependent-cutoff-breaks-direct-field-solenoidality'&&row.nonzero));
});

test('caller field values and completion flags cannot become source authority',async()=>{
  await assert.rejects(sourceLocalizationOperatorProof({A:[0,0,0]}),error=>error.code==='INVALID_INPUT');
  await assert.rejects(sourceLocalizationOperatorProof({wholeN7Complete:true}),error=>error.code==='INVALID_INPUT');
  assert.throws(()=>assertSourceLocalizationOperatorProof(structuredClone(proof)),error=>error.code==='INVALID_SOURCE_PROOF');
  const flags=proof.proofScope;
  for(const key of ['fullFinalN6FieldNumericallyConstructed','wholeLocalizedForceValuesComputed','wholeGlobalTerminalJetsComputed','wholeKEnergyComputed','globalForceExtensionConstructed','wholeN7Complete','wholeM3Complete','newLeanExecuted'])
    assert.equal(flags[key],false,key);
});

test('the source proof is sealed and observations contain exact proof tables without field curves',()=>{
  assert.equal(assertSourceLocalizationOperatorProof(proof),true);
  const observations=sourceLocalizationOperatorObservations(proof);
  assert.deepEqual(observations.samples,[]);assert.deepEqual(observations.curves,[]);
  assert.equal(observations.operatorChecks.length,8);
  proof.proofScope.wholeLocalizedForceValuesComputed=true;
  assert.throws(()=>sourceLocalizationOperatorObservations(proof),error=>error.code==='INVALID_SOURCE_PROOF');
  proof.proofScope.wholeLocalizedForceValuesComputed=false;
  assert.equal(assertSourceLocalizationOperatorProof(proof),true);
});

if(process.env.MATHSCOPE_N7_OPERATOR_OUTPUT){
  fs.writeFileSync(process.env.MATHSCOPE_N7_OPERATOR_OUTPUT,JSON.stringify(proof,null,2)+'\n');
}
