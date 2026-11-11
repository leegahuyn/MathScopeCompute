import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [rootArg, outputArg] = process.argv.slice(2);
assert(rootArg && outputArg);
const root = resolve(rootArg);
const source = resolve(root, 'source');
const m4 = 'research-ide/mathscope-m4/';
const m0 = 'research-ide/mathscope-m0/';
const read = path => readFile(resolve(source, path));
const load = path => import(pathToFileURL(resolve(source, path)));
const parse = bytes => JSON.parse(bytes);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const { buildFormalClaims } = await load(m4 + 'formal-claims.mjs');
const { CORE_RUN, verifyCoreKernelReplay } = await load(m4 + 'kernel-evidence.mjs');
const { M4_CRITERIA } = await load(m4 + 'criteria.mjs');
const criteria = M4_CRITERIA.find(row => row.id === 'I3-08');
const original = parse(await read(m4 + 'recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json'));
const originalRow = original.rows.find(row => row.id === criteria.id);
assert.equal(originalRow.source_page, 20);
assert.equal(original.originalSource.page_count, 99);
assert.match(originalRow.original_acceptance, /claim ID.*양화사.*근사 범위/u);

const kernel = await verifyCoreKernelReplay();
assert.equal(kernel.verified, true, kernel.status);
const claims = buildFormalClaims(kernel);
const pinned = parse(await read(CORE_RUN.directory + '/receipt.json'));
assert.equal(claims.length, 11);
assert.equal(new Set(claims.map(x => x.claimId)).size, 11);
const rows = [];
for (const claim of claims) {
  const exact = kernel.targets.find(t => t.target === claim.expert.target);
  const audited = pinned.targets.find(t => t.target === exact.target);
  assert.equal(claim.expert.targetType, exact.targetType);
  assert.equal(claim.expert.targetType, audited.targetType);
  assert.deepEqual(claim.expert.axioms, audited.axioms);
  assert.deepEqual(claim.expert.userAxioms, audited.userAxioms);
  assert.ok(claim.expert.counterexampleCondition);
  assert.ok(claim.student.explanation);
  assert.ok(claim.shared.quantifier && claim.shared.approximationScope && claim.shared.scope);
  for (const [key, value] of Object.entries(claim.shared)) {
    assert.equal(claim.student[key], value);
    assert.equal(claim.expert[key], value);
  }
  assert.equal(claim.receiptSha256, CORE_RUN.receiptSha256);
  assert.equal(claim.grantsOriginalCriterionAcceptance, false);
  const path = claim.sourceFile.split('/MathScope/').at(-1);
  const matchedSource = pinned.sources.find(row => row.path === 'MathScope/' + path);
  const actualSourceSha256 = sha(await read(claim.sourceFile));
  assert.equal(matchedSource.sha256, actualSourceSha256, claim.sourceFile);
  rows.push({ claimId: claim.claimId, shared: claim.shared, grade: claim.grade,
    expertTarget: exact.target, source: claim.sourceFile, actualSourceSha256,
    hasWorkedExample: claim.student.example !== null });
}

const analytic = claims.find(row => row.criterionIds.includes('I3-08'));
assert.equal(analytic.claimId, 'M4.ANALYTIC.UNIFORM_LIMIT_CONTINUITY');
assert.equal(analytic.grade, 'CONDITIONAL_FORMAL');
assert.deepEqual(analytic.shared.assumptionIds, [
  'PRECISION_BALL_REFLEXIVE_SYMMETRIC_TRIANGLE_FINER',
  'UNIFORM_CONVERGENCE_ALL_DOMAIN', 'UNIFORM_CONTINUITY_EVERY_APPROXIMANT']);
const definition = (await read(m4 + 'lean/MathScope/M4/Defs.lean')).toString('utf8');
const proof = (await read(analytic.sourceFile)).toString('utf8');
assert.match(definition, /∀ k, ∃ N, ∀ n, N ≤ n → ∀ x,/u);
assert.match(definition, /∀ k, ∃ l, ∀ x y,/u);
assert.match(proof, /hUniform \(k\+2\)/);
assert.match(proof, /hContinuous N \(k\+2\)/);
assert.match(analytic.student.example, /k=3.*k\+2=5.*공통 N.*모든 x,y/u);
assert.match(analytic.expert.targetType, /\{X Y : Type\}[\s\S]*hUniform[\s\S]*hContinuous : ∀ \(n : Nat\),/u);
const finite = claims.find(row => row.claimId === 'M4.FINITE.GENERATED_VECTOR');
assert.equal(finite.grade, 'EXACT_FINITE');
assert.match(finite.expert.targetType, /a := 2, b := -3, c := 5, d := 7/);
const m0Definitions = (await read(m0 + 'lean/MathScope/M0/Defs.lean')).toString('utf8');
assert.match(m0Definitions, /⟨v.b, v.d, v.d, v.c - v.a, -v.b⟩/u);
assert.match(m0Definitions, /⟨-v.v \+ v.w, 0, -v.u - v.y⟩/u);
const [a,b,c,d] = [2n,-3n,5n,7n];
const [u,v,w,x,y] = [b,d,d,c-a,-b];
const finiteExample = { input:[a,b,c,d].map(String), d0:[u,v,w,x,y].map(String), d1:[-v+w,0n,-u-y].map(String) };
assert.deepEqual(finiteExample.d1, ['0','0','0']);
assert.match(finite.student.example, /\(−3,7,7,3,3\).*\(0,0,0\)/u);
const conditional = claims.find(row => row.grade === 'USER_AXIOM_CONDITIONAL');
assert.deepEqual(conditional.shared.assumptionIds, conditional.expert.userAxioms);
assert.deepEqual(conditional.expert.userAxioms, ['MathScope.M4.Conditional.assumedComplete']);

const serialized = structuredClone(kernel);
assert.throws(() => buildFormalClaims(serialized), /raw kernel evidence/);
const mutate = reader => async path => {
  const original = await read(path);
  return path === reader ? Buffer.concat([original, Buffer.from(' ')]) : original;
};
const [changedSource, changedLog] = await Promise.all([
  verifyCoreKernelReplay({readCurrentSource: mutate(analytic.sourceFile)}),
  verifyCoreKernelReplay({readArtifact: mutate(CORE_RUN.directory + '/compile-MathScope-M4-Analytic.log')}),
]);
assert.match(changedSource.status, /^CURRENT_SOURCE_STALE:/);
assert.match(changedLog.status, /^ARTIFACT_HASH_MISMATCH:/);
assert.throws(() => buildFormalClaims(changedSource), /raw kernel evidence/);
assert.throws(() => buildFormalClaims(changedLog), /raw kernel evidence/);
const viewData = parse(await readFile(resolve(root,'model.json')));
assert.equal(viewData.status, kernel.status);
assert.deepEqual(viewData.claims, claims);

const receipt = {
  schema: 'MathScope.M4.I308.ClaimParityReadback/1', criterionId: criteria.id,
  originalBlueprintPage: originalRow.source_page, originalCriterion: originalRow.original_acceptance,
  checks: Object.fromEntries(criteria.checks.map(id => [id, 'PASS'])),
  originalMatrixSHA256: sha(await read(m4 + 'recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json')),
  kernelReceiptSHA256: kernel.receiptSha256, currentKernelExecuted: kernel.currentKernelExecuted,
  exactClaims: rows, finiteExample, controls: {serializedRejected:true, changedSource:changedSource.status, changedLog:changedLog.status},
  scope: 'Eleven claims projected from the exact archived core replay; precision metrics and finite algebra at their stated scope.',
  grantsOriginalCriterionAcceptance: false, publicationConfirmed:false,
  verdict:'PASS_SHARED_AUTHENTIC_CLAIM_AND_SCOPE_PARITY',
};
await writeFile(outputArg, JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({ verifiedClaims: rows.length, examples:rows.filter(x=>x.hasWorkedExample).length,
  controls: Object.keys(receipt.controls).length, verdict: receipt.verdict }));

