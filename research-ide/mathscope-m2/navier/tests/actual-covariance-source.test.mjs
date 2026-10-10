import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {actualCovarianceFamilyCertificate,ACTUAL_COVARIANCE_CRITERION} from '../actual-covariance-source-certificate.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';
import {SOURCE_PROFILE_ID} from '../source-profile.mjs';

let first,small,repeated;
test.before(async()=>{
  first=await actualCovarianceFamilyCertificate({});
  small=await actualCovarianceFamilyCertificate({ellExact:'1',terms:1});
  repeated=await actualCovarianceFamilyCertificate({sourceProfile:SOURCE_PROFILE_ID,anchorOrder:1,terms:1});
  fs.writeFileSync('/tmp/actual-covariance-default.json',canonicalStringify(first));
  fs.writeFileSync('/tmp/actual-covariance-source-replay.json',JSON.stringify({schema:'MathScope.ActualCovarianceMixedReplay/1',requests:[{}, {ellExact:'1',terms:1}, {sourceProfile:SOURCE_PROFILE_ID,anchorOrder:1,terms:1}],graphs:[first.graph.sha256,small.graph.sha256,repeated.graph.sha256],thresholds:[first.uniformFamily.threshold.fixedSourceProgramSHA256,small.uniformFamily.threshold.fixedSourceProgramSHA256,repeated.uniformFamily.threshold.fixedSourceProgramSHA256],defaultEqualsExplicit:canonicalStringify(first)===canonicalStringify(repeated)}));
});

test('default, explicit small band, normalized default replay has no mutable-graph or metadata drift',()=>{
  assert.equal(canonicalStringify(first),canonicalStringify(repeated));
  assert.equal(first.graph.sha256,repeated.graph.sha256);assert.deepEqual(first.graph.rootIds,repeated.graph.rootIds);
  assert.notEqual(first.graph.sha256,small.graph.sha256);
  assert.equal(first.uniformFamily.threshold.fixedSourceProgramSHA256,small.uniformFamily.threshold.fixedSourceProgramSHA256);
});
test('the literal original criterion is retained and all actual source checks execute',()=>{
  const archived=JSON.parse(fs.readFileSync(new URL('../../evidence/original-m2-criteria.json',import.meta.url)));
  let found;const scan=x=>{if(x&&typeof x==='object'){if(x.id==='N5-06')found=x;Object.values(x).forEach(scan);}};scan(archived);
  assert.deepEqual(ACTUAL_COVARIANCE_CRITERION,found);assert(first.checks.length>=26);assert(first.checks.every(c=>c.pass&&c.id&&c.detail));
  assert.equal(first.scope.originalN506Complete,true);assert.equal(first.originalCriterion.status,'PASS');
});
test('every uniform positive claim has the full source domain; exercised members have no assumed positivity',()=>{
  for(const r of[first,small]){
    assert.equal(r.uniformFamily.certified,true);assert.match(r.uniformFamily.certifiedDomain.band,/ell>=ellMinimum/);
    assert.deepEqual(r.uniformFamily.certifiedDomain.representative.X,['Xa','Xb']);
    assert.equal(r.exercisedMember.certifiedBandMembership,false);assert.equal(r.exercisedMember.positivityOfThisMemberCertified,false);
    assert.equal(r.exercisedMember.determinantNonzeroForThisMemberCertified,false);
    assert.equal(r.scope.exercisedMemberProvedInCertifiedDomain,false);assert.equal(r.scope.allSlowDerivativeBoundsComputed,false);
    assert.equal(r.scope.fullNavierStokesSolutionOrRegularityClaim,false);
  }
});
test('physical H uses every normalization factor and exposes the full mass lower bound',()=>{
  assert.equal(first.normalizationRows.length,6);assert.equal(first.normalizationRows.find(r=>r.id==='angular-half').exactValue,'1/2');
  assert.equal(first.normalizationRows.find(r=>r.id==='normalized-haar').exactValue,'1');
  const c=first.uniformFamily.columns;assert.equal(c.actualMassLowerRoot,first.graph.rootIds.actualColumnMassLower);
  assert.notEqual(c.actualMassLowerRoot,c.gaussianMassCoefficientRoot);assert.match(c.actualMassLowerFormula,/haarFactor.*sqrt\(Ls\)/);
  assert.equal(c.physicalDeterminantSign,'negative');assert.equal(c.determinantNormalizedLower,'15/8');
});
test('full target shear and actual source inverse are retained; edges are exactly zero',()=>{
  assert.match(first.sourceProofs.target.shearRetained,/2X F_X/);assert.match(first.sourceProofs.target.shearRetained,/2X U_X/);
  assert(first.inverseRows.every(r=>r.openSupport==='strictly positive'&&/exactly0/.test(r.flatEndpoints)&&!r.exercisedMemberPositivityCertified));
  assert.deepEqual(first.uniformFamily.positiveInverse.exactResidual,['0','0']);
  assert.equal(first.uniformFamily.positiveInverse.flatEndpoints,'y_plus=y_minus=0');
});
test('the finite H display keeps all three actual integrals per sign and a genuine nonzero tail',()=>{
  assert.equal(first.finiteIntegralRows.length,6);assert.equal(new Set(first.finiteIntegralRows.map(r=>r.sign+':'+r.component)).size,6);
  for(const r of first.finiteIntegralRows){assert.equal(r.terms,1);assert.equal(r.finiteApproximationEqualsLimit,false);assert.equal(r.numericQuadratureExecuted,false);assert(r.absoluteErrorRoot>1);assert(r.factorialTailRoot>1);assert.match(r.tailFormula,/factorial|\(N\+1\)!/);}
  assert.equal(first.scope.actualNumericalWholeHQuadrature,false);assert.equal(first.scope.finiteHApproximationIsExactLimit,false);
});
test('the actual matrix power ledger retains both moving terms and the computed four budgets',()=>{
  assert.equal(first.operatorBoundsRows.length,188);assert(first.operatorBoundsRows.some(r=>r.label.startsWith('n_prime_')));
  assert(first.operatorBoundsRows.some(r=>r.label.startsWith('Bprime_')));
  assert(first.operatorBoundsRows.filter(r=>r.label.startsWith('projected_error_')).every(r=>r.e<=69));
  assert.match(first.sourceProofs.movingOperator.referenceDiagonal,/nprime and Bprime/);
});
test('all81 actual nearest-offset labels occur once and both signs remain inside each box',()=>{
  assert.equal(first.partitionRows.length,81);assert.equal(new Set(first.partitionRows.map(r=>r.key)).size,81);
  for(const r of first.partitionRows){assert.equal(r.countInGlobalSum,1);assert.deepEqual(r.signColumns,[1,-1]);assert.equal(r.actualLabel.grid.length,3);assert.equal(r.actualLabel.colors.length,2);assert.equal(r.actualLabel.countInGlobalSum,1);}
  assert.match(first.sourceProofs.actualPartitionCoordinates.identity,/floor/);assert.match(first.sourceProofs.actualPartitionCoordinates.profileCompatibility,/exactly/);
  assert(first.checks.find(r=>r.id==='actual-rectangle-and-physical-wave-composition').pass);
});
test('the global identity is the averaged physical covariance, not a claimed numerical PDE residual',()=>{
  const global=first.uniformFamily.global730;assert.deepEqual(global.exactResidual,['0','0']);assert.equal(global.eachSlowBoxCountedOnce,true);
  assert.equal(global.plusMinusAreColumnsInsideBox,true);assert.equal(global.allCrossLabelProductsVanish,true);assert.equal(global.allCandidateBoxes,81);
  assert.match(global.scope,/not a numerical Navier-Stokes PDE residual/);assert.match(global.activeBands.derivation,/ell0\+13\/4/);
});
test('the graph is reproducible without embedding or truncating it in the public result',()=>{
  assert(first.graph.nodeCount>300000);assert(first.graph.canonicalBytes>10000000);assert.equal(first.graph.graphIncluded,false);
  assert.equal(first.graph.volterraSystems,2);assert.equal(first.graph.sha256.length,64);
  assert(new TextEncoder().encode(canonicalStringify(first)).byteLength<8*1024*1024);
  const forbidden=['elapsed','wallTime','timestamp','cacheHit'];assert(forbidden.every(k=>!Object.hasOwn(first,k)));
  assert.equal(first.sourceBinding.parameterExpressionSHA256.length,64);
});
test('caller fields, assumed constants, invalid selectors and cancellation never create a certificate',async()=>{
  for(const input of[null,{h:0},{target:[1,0]},{sourceProfile:'fixture'},{anchorOrder:0},{anchorOrder:3},{ellExact:'0'},{ellExact:'1',anchorOrder:1},{ellExact:'129'},{ellExact:'1.5'},{terms:-1},{terms:3},{complete:true}])await assert.rejects(()=>actualCovarianceFamilyCertificate(input));
  await assert.rejects(()=>actualCovarianceFamilyCertificate({}, {checkCancelled(){throw Object.assign(Error('stop'),{code:'CANCELLED'});}}),e=>e.code==='CANCELLED');
});
