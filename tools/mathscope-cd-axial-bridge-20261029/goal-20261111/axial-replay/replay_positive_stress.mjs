// Replay the exact producer and export the shared prefix identity, not just root IDs.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import {
  prepareActualPositiveGlobalStress,
  assertActualPositiveGlobalStress,
  actualPositiveGlobalStressCertificate,
} from './source/research-ide/mathscope-m2/navier/actual-positive-global-stress.mjs';

const out = process.argv[2];
if (!out) throw new Error('Usage: node replay_positive_stress.mjs <output.json>');
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const observed = prepareActualPositiveGlobalStress({order: 2, maxNodes: 2200000}, {
  onProgress: ({phase, order, nodes}) => console.log(JSON.stringify({phase, order, nodes})),
});
assert.equal(assertActualPositiveGlobalStress(observed), true);
const cert = await actualPositiveGlobalStressCertificate(observed);
const prefix = observed.G.nodes.slice(0, 117100);
const prefixSHA256 = sha(prefix);
assert.equal(prefixSHA256, 'd125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116');
const ftc = cert.sourceFTC.rows.find(row => row.order === 1 && row.component === 'z');
const stress = cert.stressRows.find(row => row.order === 1 && row.component === 'z');
assert.equal(ftc.materializedDensity, 117047);
assert.equal(ftc.raw, 117045);
assert.deepEqual(ftc.openDomain, [28814, 28824]);
assert.equal(stress.originalTotal, 117075);
assert.equal(stress.actualConservativeTotalReduced, observed.G.zero);
assert.equal(stress.allFixedDerivativeJetsMatch, true);
assert.equal(stress.pass, true);

const roots = [0, 28814, 28824, 117045, 117047, 117057, 117059, 117066, 117067, 117069, 117075];
const selectedNodes = Object.fromEntries(roots.map(id => [id, prefix[id]]));
await writeFile(out, JSON.stringify({prefixLength: prefix.length, prefixSHA256, selectedNodes,
  fixture: {order: 2, maxNodes: 2200000}, cert}, null, 2) + '\n');
console.log('PASS: original positive stress replay, exact 117100-node prefix, order-one axial roots');
