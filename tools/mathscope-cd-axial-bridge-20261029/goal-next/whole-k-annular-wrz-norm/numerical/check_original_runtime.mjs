/** Check the original dependency closure before loading any analytical replay. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sha} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [tree, manifest, out] = process.argv.slice(2);
assert(tree && manifest && out, 'Provide ORIGINAL_RUNTIME ORIGINAL_RUNTIME_MANIFEST OUTPUT');
const manifestSHA256 = '1744fe0e7b4ed30c44f23e76c599a395276982a4a92c66d639ccd617939242bf';
const pins = await load(manifest, manifestSHA256);
assert.equal(Object.keys(pins).length, 94);
for (const [relative, digest] of Object.entries(pins)) {
  assert.match(relative, /^research-ide\/[-a-z0-9_/]+\.(?:mjs|json)$/);
  assert.equal(sha(await readFile(resolve(tree, relative))), digest, relative);
}
for (const name of ['actual-leading-high-jets.mjs', 'actual-leading-high-jets-arithmetic.mjs',
  'actual-residual-order-induction-kernels.mjs', 'actual-residual-order-induction-norms.mjs',
  'actual-leading-all-order-jets.mjs', 'actual-continuation-exact-core.mjs',
  'actual-stress-direction-program.mjs', 'actual-covariance-sensitivity.mjs']) {
  assert.match(pins['research-ide/mathscope-m2/navier/' + name], /^[a-f0-9]{64}$/);
}
const receipt = {status: 'VERIFIED_ALL_ORIGINAL_RUNTIME_BYTES', files: 94, manifestSHA256,
  sourceCommit: 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'};
await writeFile(out, JSON.stringify(receipt, null, 2) + '\n');
console.log('PASS all 94 original source runtime files');
