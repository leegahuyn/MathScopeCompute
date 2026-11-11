import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getShippedProofBundle, proofSha256 } from './source/research-ide/mathscope-m0/proof.mjs';
import {
  assessM4Acceptance, requiredKernelArtifacts, verifyCriterionEvidence,
  verifyPinnedKernelArtifacts, isVerifiedKernelArtifactReceipt,
} from './source/research-ide/mathscope-m4/acceptance.mjs';
import { runJob } from './source/research-ide/mathscope-m1/arithmetic/index.mjs';
import {
  recordedSourceN7DomainExterior, sourceExteriorForceObservations,
} from './source/research-ide/mathscope-m3/navier/source-exterior-force-evidence.mjs';

const [repoArg, output] = process.argv.slice(2);
assert(repoArg && output, 'Usage: node evidence_cases.mjs REPO OUTPUT');
const repo = resolve(repoArg), digest = data => createHash('sha256').update(data).digest('hex');
const pin = JSON.parse(await readFile(new URL('./source-pin.json', import.meta.url)));
const gitArtifact = path => execFileSync('git', ['-c', 'core.longpaths=true', '-C', repo, 'show', pin.sourceCommit + ':' + path],
  { maxBuffer: 16 * 1024 * 1024 });
for (const [path, binding] of Object.entries(pin.files)) {
  const local = await readFile(new URL('./source/' + path, import.meta.url));
  assert.equal(local.byteLength, binding.bytes, path);
  assert.equal(digest(local), binding.sha256, path);
  assert.equal(digest(gitArtifact(path)), binding.sha256, path);
}
const matrixPath = 'research-ide/mathscope-m4/recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json';
const matrixBytes = gitArtifact(matrixPath);
const exact = matrixBytes.toString('utf8').match(/"id": "R1-06"\s*,\s*"title": [^\n]*\s*"source_page": 68\s*,\s*"original_acceptance": ([^\n]+),/);
assert(exact);
const originalCriterion = JSON.parse(exact[1]);
assert.match(originalCriterion, /조작된 PASS.*theorem type.*prime certificate.*force\/cutoff/);
const coreEvidence = getShippedProofBundle('m0-finite-d2');
const checked = await verifyPinnedKernelArtifacts(coreEvidence.jobSpec, coreEvidence, gitArtifact);
assert.equal(checked.code, 'HISTORICAL_KERNEL_ARTIFACTS_MATCH');
assert.equal(isVerifiedKernelArtifactReceipt(checked.receipt), true);
const controls = [];
const record = (label, code, runtimeReason, explanation) => {
  assert.equal(typeof runtimeReason, 'string');
  assert(runtimeReason.length > 8);
  const row = { label, code, runtimeReason, explanation };
  controls.push(row);
  console.log(JSON.stringify(row));
};
const serialized = JSON.parse(JSON.stringify(checked.receipt));
assert.equal(isVerifiedKernelArtifactReceipt(serialized), false);
const forgedBytes = Buffer.from(JSON.stringify({ ...serialized, status: 'PASS', publicationConfirmed: true }));
const forgedCandidate = {
  schemaVersion: 'mathscope.m4.criterion-evidence/1', criterionId: 'R1-06',
  artifacts: [{ path: 'forged.json', sha256: digest(forgedBytes) }],
};
const forged = await verifyCriterionEvidence(forgedCandidate, () => forgedBytes);
assert.equal(forged.code, 'CRITERION_REVIEW_REQUIRED');
const badAssessment = await assessM4Acceptance({ criterionReceipts: [{ ...serialized, criterionId: 'R1-06', status: 'PASS' }] });
assert.equal(badAssessment.newlyAcceptedCriteriaInThisAudit, 0);
assert.equal(badAssessment.publicationConfirmed, false);
record('fabricated_serialized_pass', forged.code, forged.reason,
  'The supplied PASS has a matching checksum but no independently reviewed criterion receipt.');

const rawSource = requiredKernelArtifacts(coreEvidence).find(row => row.roles.includes('SOURCE'));
assert(rawSource);
const wrongSource = await verifyPinnedKernelArtifacts(coreEvidence.jobSpec, coreEvidence, path => path === rawSource.path
  ? Buffer.concat([gitArtifact(path), Buffer.from(' ')]) : gitArtifact(path));
assert.equal(wrongSource.code, 'ARTIFACT_HASH_MISMATCH');
assert.equal(wrongSource.path, rawSource.path);
assert.equal(wrongSource.expectedSha256, rawSource.sha256);
assert.notEqual(wrongSource.expectedSha256, wrongSource.actualSha256);
record('wrong_original_source_hash', wrongSource.code, wrongSource.reason,
  'One extra byte changes the exact original Lean source hash.');

const alteredType = structuredClone(coreEvidence);
alteredType.audit.targetType = 'False';
assert.notEqual(coreEvidence.audit.targetType, alteredType.audit.targetType);
const wrongType = await verifyPinnedKernelArtifacts(alteredType.jobSpec, alteredType, gitArtifact);
assert.equal(wrongType.code, 'UNTRUSTED_IMPORTED');
record('theorem_type_changed', wrongType.code, wrongType.reason,
  'The type was changed to False while the target identifier and original source were retained.');
const coreAfter = await verifyPinnedKernelArtifacts(coreEvidence.jobSpec, coreEvidence, gitArtifact);
assert.deepEqual(coreAfter.receipt, checked.receipt);
assert.equal(isVerifiedKernelArtifactReceipt(checked.receipt), true);

const primeRequest = { kind: 'arithmetic.primeCertificate', input: { n: '97' }, budget: { maxOperations: 100000 } };
const generated = await runJob(primeRequest);
assert.equal(generated.results.status, 'PRIME_CERTIFIED');
const original = generated.results.certificate;
assert.equal(original.n, '97');
const verify = certificate => runJob({
  kind: 'arithmetic.verify', input: { type: 'primeCertificate', certificate }, budget: { maxOperations: 100000 },
});
const primeBefore = await verify(original);
assert.equal(primeBefore.results.status, 'PRIME_CERTIFIED');
const badWitness = structuredClone(original);
badWitness.witness = '1';
const badFactors = structuredClone(original);
badFactors.factors[0].exponent -= 1;
for (const [label, bad, why] of [
  ['forged_prime_witness', badWitness, 'The claimed Lucas witness is 1, below the required bound of 2.'],
  ['forged_prime_factorization', badFactors, 'The supplied factor powers multiply to 48, while 97 − 1 equals 96.'],
]) {
  const badPrime = await verify(bad);
  assert.equal(badPrime.results.pass, false);
  assert.equal(badPrime.results.status, 'UNKNOWN');
  assert.equal(badPrime.checks[0].pass, false);
  assert.equal(badPrime.evidence.formalComplete, false);
  record(label, badPrime.results.status, badPrime.results.scope, why);
}
const product = badFactors.factors.reduce((p, term) => p * BigInt(term.q) ** BigInt(term.exponent), 1n);
assert.equal(product, 48n);
const primeAfter = await verify(original);
assert.equal(primeAfter.resultHash, primeBefore.resultHash);
assert.deepEqual(primeAfter.results, primeBefore.results);

const observedArchive = await recordedSourceN7DomainExterior();
const archivedBefore = sourceExteriorForceObservations(observedArchive);
assert.equal(archivedBefore.forceRows.length, 5);
for (const [label, supplied] of [
  ['attempted_foreign_force_override', { force: [0, 0, 0] }],
  ['attempted_foreign_cutoff_override', { qStar: '1/8' }],
]) {
  await assert.rejects(() => recordedSourceN7DomainExterior(supplied), error => {
    assert.equal(error.code, 'INVALID_INPUT');
    record(label, error.code, error.message, 'The fixed source observation cannot be replaced by caller-provided values.');
    return true;
  });
}
const archivedAfter = sourceExteriorForceObservations(observedArchive);
assert.deepEqual(archivedAfter, archivedBefore);

await writeFile(output, JSON.stringify({
  schema: 'MathScope.M4.R106.OriginalEvidenceBoundaries/1',
  criterionId: 'R1-06',
  sourceCommit: pin.sourceCommit,
  originalBlueprintPage: 68,
  originalCriterion,
  matrixSHA256: digest(matrixBytes),
  checkedSourceFiles: Object.keys(pin.files).length,
  status: 'PASS',
  controls,
  preserved: {
    exactM0KernelArtifactReceipt: checked.receipt.artifactsDigest,
    finitePrimeVerification: primeBefore.resultHash,
    fixedExteriorObservation: await proofSha256(archivedBefore),
    originalSourceBindingAndObservationBytesUnchanged: true,
  },
  publicationConfirmed: false,
}, null, 2) + '\n', 'utf8');
