import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import {
  actualPositiveGlobalStressCertificate,
  assertActualPositiveGlobalStress,
  prepareActualPositiveGlobalStress,
} from '../../goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/actual-positive-global-stress.mjs';

const outputPath = process.argv[2];
assert.ok(outputPath, 'Supply a path for the compact JSON receipt.');
const input = { order: 3, maxNodes: 2200000 };
const proof = prepareActualPositiveGlobalStress(input, {
  onProgress: event => console.log(JSON.stringify(event)),
});
assert.equal(assertActualPositiveGlobalStress(proof), true);
const certificate = await actualPositiveGlobalStressCertificate(proof);
const prefix = proof.G.nodes.slice(0, 117100);
const prefixSHA256 = createHash('sha256').update(JSON.stringify(prefix)).digest('hex');
assert.equal(prefixSHA256, 'd125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116');
const axialStress = certificate.stressRows.filter(row => row.component === 'z');
const axialFTC = certificate.sourceFTC.rows.filter(row => row.component === 'z');
assert.deepEqual(axialStress.map(row => row.order), [1, 2, 3]);
assert.deepEqual(axialFTC.map(row => row.order), [1, 2, 3]);
for (const row of axialStress) {
  assert.equal(row.actualConservativeTotalReduced, proof.G.zero);
  assert.equal(row.allFixedDerivativeJetsMatch, true);
  assert.equal(row.pass, true);
}
assert.equal(certificate.sourceFTC.pass, true);
for (const row of axialFTC) {
  assert.equal(row.densityCheck.pass, true);
  assert.equal(row.primitiveCheck.pass, true);
  assert.equal(row.check.pass, true);
  assert.equal(row.negativeWrongSign.pass, false);
}
assert.equal(axialFTC[0].materializedDensity, 117047);
assert.equal(axialStress[0].originalTotal, 117075);
await writeFile(outputPath, JSON.stringify({
  input,
  programNodeCount: proof.G.nodes.length,
  prefixSHA256,
  certificate,
}, null, 2) + '\n');
console.log('PASS: pinned original positive stress guards through order 3 and unchanged order-one prefix');

