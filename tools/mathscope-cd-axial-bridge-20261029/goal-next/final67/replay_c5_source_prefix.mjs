import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [modulePath, output] = process.argv.slice(2);
assert.ok(modulePath && output);
const original = await import(pathToFileURL(modulePath));
const started = Date.now();
const history = [];
const seen = new Set();
const context = {
  checkCancelled() {
    if (Date.now() - started > 10 * 60_000) throw new Error('source prefix duration exceeded 10 minutes');
    if (process.memoryUsage().rss > 5 * 1024 ** 3) throw new Error('source prefix exceeded 5 GiB RSS');
  },
  onProgress(row) {
    context.checkCancelled();
    if (row.stage && !seen.has(row.stage)) {
      seen.add(row.stage);
      const item = { stage: row.stage, nodeCount: row.nodeCount ?? null };
      history.push(item);
      console.log(JSON.stringify(item));
    }
  }
};
const request = { throughOrder: 2, derivativeOrder: 5, maxNodes: 4000000 };
const family = original.prepareActualCommonAdmissibleFamily(request, context);
assert.equal(original.assertActualCommonAdmissibleFamily(family), true);
assert.equal(family.request.throughOrder, 2);
assert.equal(family.request.derivativeOrder, 5);
const { G } = family;
const norms = family.source.backgroundNorms;
assert.equal(norms.request.derivativeOrder, 5);
assert.deepEqual(norms.rows.map(row => row.derivativeOrder), [0, 1, 2, 3, 4, 5]);
assert.equal(norms.gaussianRows.length, 4);
for (const [index, row] of norms.gaussianRows.entries()) {
  assert.equal(row.derivativeOrder, index);
  assert.equal(row.backgroundDerivativeOrder, index + 2);
  assert.equal(G.freeCoordinates(row.B_m).size, 0);
}
assert.ok(norms.checks.every(check => check.pass));
const receipt = {
  schema: 'MathScope.M3.OriginalCommonBackgroundC5Prefix/1',
  request: family.request, graphNodes: G.nodes.length,
  moduleSHA256: createHash('sha256').update(readFileSync(modulePath)).digest('hex'),
  fixedSourceOnlyBackgroundGaussianRows: norms.gaussianRows,
  fixedSourceOnlyBackgroundChecks: norms.checks,
  commonConstants: family.constants, constructionStages: history,
  proofPrefixOnly: true, actualCurrentUncutSeminormCertified: false, actualScaleSelected: false,
  finalJets: 0, release: 'HOLD'
};
writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ graphNodes: G.nodes.length, gaussianRows: norms.gaussianRows.length,
  verifiedDerivativeOrder: 5 }));
