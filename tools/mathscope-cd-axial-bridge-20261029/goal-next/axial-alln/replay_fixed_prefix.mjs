/** Inspect the authenticated source axial integrals at every requested finite order. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime, orderText, maxNodesText, output] = process.argv.slice(2);
const order = Number(orderText), maxNodes = Number(maxNodesText);
assert.ok(output && Number.isSafeInteger(order) && order >= 1 && Number.isSafeInteger(maxNodes));
const modulePath = resolve(runtime, 'research-ide/mathscope-m2/navier/actual-positive-global-stress.mjs');
const bytes = await readFile(modulePath);
const gitBlob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
assert.equal(gitBlob, '5588d2af5af77e7cfd9d29b3e47a6b83c3a51588');
const {prepareActualPositiveGlobalStress, assertActualPositiveGlobalStress} =
  await import(pathToFileURL(modulePath).href);
const proof = prepareActualPositiveGlobalStress({order, maxNodes}, {
  onProgress(event) { console.log(JSON.stringify(event)); },
});
assert.equal(assertActualPositiveGlobalStress(proof), true);
const {G} = proof;
const prefix = createHash('sha256').update(JSON.stringify(G.nodes.slice(0, 117100))).digest('hex');
assert.equal(prefix, 'd125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116');
const axial = proof.stressRows.filter(row => row.component === 'z');
const sourceFTC = proof.sourceFTC.rows.filter(row => row.component === 'z');
assert.deepEqual(axial.map(row => row.order), Array.from({length: order}, (_, j) => j + 1));
assert.deepEqual(sourceFTC.map(row => row.order), axial.map(row => row.order));
const rows = axial.map((row, j) => {
  const replay = sourceFTC[j];
  assert.ok(row.pass && replay.densityCheck.pass && replay.primitiveCheck.pass && replay.check.pass);
  assert.equal(replay.negativeWrongSign.pass, false);
  assert.equal(row.actualConservativeTotalReduced, G.zero);
  assert.equal(row.wholeDensityCheck.pass, true);
  assert.equal(row.backwardSign.pass, true);
  if (row.order > 1) assert.equal(row.originalTotal, null);
  const whole = G.nodes[row.actualWholeResidualIntegral];
  assert.equal(whole.op, 'definite_integral');
  return {
    order: row.order, density: replay.materializedDensity, originalStoredTotal: row.originalTotal,
    wholeIntegral: row.actualWholeResidualIntegral,
    forwardIntegral: row.sourceForwardIntegral, backwardIntegral: row.sourceBackwardIntegral,
    literalWholeOperands: whole.args, conservativeReduction: row.actualConservativeTotalReduced,
    sourceFTC: replay,
  };
});
assert.equal(rows[0].density, 117047);
assert.equal(rows[0].originalStoredTotal, 117075);
const receipt = {
  schema: 'MathScope.OriginalAxialFixedPrefixReplay/1',
  status: 'VERIFIED_FINITE_SOURCE_BINDINGS_CONDITIONAL_MOMENT_REDUCTION',
  order, nodeCount: G.nodes.length, sourceModuleGitBlob: gitBlob, prefixSHA256: prefix, rows,
  scope: 'Actual positive-stress issuer and literal finite axial bindings. The conservative zero reduction uses the source moment, regularity and integral contracts. Arbitrary n, derivative limit interchange and full cutoff are independent.',
  release: 'HOLD',
};
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({status: receipt.status, order, nodeCount: G.nodes.length}));
