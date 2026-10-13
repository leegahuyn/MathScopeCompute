import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog, inspectInvariants, inspectRefinement, runVerification } from './verify-fixtures.mjs';

test('catalog binds all thirteen supported fixtures to original claims, formulas and source paths', async () => {
  const c = await readCatalog();
  assert.equal(c.fixtures.length, 13);
  assert.equal(new Set(c.fixtures.map(x => x.id)).size, 13);
  for (const f of c.fixtures) { assert(['M1', 'M2'].includes(f.engine)); assert(f.claimId && f.formula && f.source.repoPath && f.source.page && f.source.url); }
  assert.equal(c.baseline.M3OriginalAccepted, 56);
  assert.equal(c.baseline.M4FinalAcceptance, 'UNCONFIRMED');
});

test('independent invariant checker rejects a forged point count and a forged Lie certificate', async () => {
  const c = await readCatalog();
  assert.equal(inspectInvariants(c.fixtures.find(x => x.id === 'point'), { status: 'COMPLETED', result: { results: { pointCount: '2' } } }).pass, false);
  assert.equal(inspectInvariants(c.fixtures.find(x => x.id === 'g2'), { status: 'COMPLETED', result: { group: { dimension: 14, matrixDimension: 7 }, verification: { ok: true, exactCertificate: { ok: false } } } }).pass, false);
});

test('refinement rejects reused input hashes and a growing exact omitted tail', () => {
  const row = (hash, tail) => ({ pass: true, inputHash: hash, observation: { tailRows: [{ Y: '1', phiTailUpper: tail }] } });
  assert.equal(inspectRefinement({ id: 'series', boundType: 'EXACT_LOCAL_ANALYTIC_TAIL' }, [row('same', '1/4'), row('same', '1/8')]).pass, false);
  assert.equal(inspectRefinement({ id: 'series', boundType: 'EXACT_LOCAL_ANALYTIC_TAIL' }, [row('a', '1/4'), row('b', '1/2')]).pass, false);
});

test('actual isolated browser Worker bytes match source modules and independent fixture/refinement checks', { timeout: 240000 }, async () => {
  const report = await runVerification({ outDir: process.env.M4_RELEASE_LAB_TEST_EVIDENCE_DIR || null });
  assert.equal(report.pass, true, JSON.stringify({ fixtures: report.fixtures.filter(x => !x.pass).map(x => ({ id: x.id, local: x.local, worker: x.worker, invariant: x.invariant })), refinements: report.refinements.filter(x => !x.assessment.pass).map(x => ({ id: x.id, assessment: x.assessment })) }));
  assert.equal(report.fixtures.length, 13);
  assert.equal(report.refinements.length, 6);
  assert.equal(report.scopes.wholeM3Complete, false);
  assert.equal(report.scopes.wholeM4Complete, false);
  assert.equal(report.scopes.externalReaderR107Verified, false);
});
