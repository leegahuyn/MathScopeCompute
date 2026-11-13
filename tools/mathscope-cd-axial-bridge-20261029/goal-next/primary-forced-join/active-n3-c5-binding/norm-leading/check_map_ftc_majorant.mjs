/** Exact integer upper bounds for the original partition and pulse-step FTC inputs. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha} from '../../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [runtime, output] = process.argv.slice(2);
assert.ok(runtime && output);
const pins = {
  'mathscope-m3/navier/source-global-class.mjs': 'f07341f299b2b9cd24844c4d738b5c6605816bdaf4eeca317b80618b27ed7095',
  'mathscope-m2/navier/actual-covariance-global-assembly.mjs': 'bd0f09f78a2f93cad9fdb679ba25509ecb2891ba86eee1bc3e57df6da74e37cc',
  'mathscope-m2/navier/actual-gaussian-flat-tail-kernel.mjs': 'aa100d47e54442be8c24f167a160816d31c883ddfdc4f0a3274b496c9b3c7a53',
  'mathscope-m2/navier/actual-residual-order-induction-kernels.mjs': '97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef',
  'mathscope-m2/navier/actual-physical-full-curl.mjs': '539753a76375338653ff7420752270b600dc8c78893212ce541c47484b2f6454',
};
const sources = {};
for (const [path, pin] of Object.entries(pins)) {
  const raw = await readFile(resolve(runtime, 'research-ide', path));
  assert.equal(sha(raw), pin, path);
  sources[path.split('/').at(-1)] = raw.toString('utf8');
}
assert.match(sources['source-global-class.mjs'], /n=order\+2,\s+offset=G\.fresh/);
assert.match(sources['source-global-class.mjs'], /coordinates:\[offset\],lower:\[q\(-1\)\],upper:\[G\.one\]/);
assert.match(sources['actual-physical-full-curl.mjs'], /denominator=G\.add\(\.\.\.bumps\.map\(x=>G\.pow\(x,2\)\)\)/);
assert.match(sources['actual-physical-full-curl.mjs'], /G\.choose\(offset,q\(-3,4\),q\(3,4\),G\.zero,quotient,G\.zero\)/);
assert.match(sources['actual-covariance-global-assembly.mjs'], /G\.step\(G\.sub\(G\.q\(3,2\),G\.mul\(G\.q\(2\),abs\)\)\)/);
assert.match(sources['actual-gaussian-flat-tail-kernel.mjs'], /G\.integral\(G\.pow\(sigmaJets\[j\+1\],2\),x,G\.zero,G\.one\)/);

const kernel = resolve(runtime, 'research-ide/mathscope-m2/navier/actual-residual-order-induction-kernels.mjs');
const {sourceAllOrderCutoffJets} = await import(pathToFileURL(kernel).href);
const source = sourceAllOrderCutoffJets({order: 9});
assert.equal(source.pass, true);
const S = source.timeStep.ordinaryDerivativeBounds.map(BigInt);
const bump = S.map((d, j) => d << BigInt(j));
const choose = (n, k) => {
  let x = 1n;
  for (let j = 1; j <= k; j++) x = x * BigInt(n + 1 - j) / BigInt(j);
  return x;
};
const factorial = n => Array.from({length: n}, (_, j) => BigInt(j + 1)).reduce((a, b) => a*b, 1n);
const conv = (a, b, n) => Array.from({length: n + 1}, (_, j) => choose(n, j) * a[j] * b[n-j])
  .reduce((s, x) => s+x, 0n);
const D = bump.slice(0, 9).map((_, n) => 3n * conv(bump, bump, n));
const bell = Array.from({length: 9}, () => Array(9).fill(0n));
bell[0][0] = 1n;
for (let n = 1; n <= 8; n++) {
  for (let k = 1; k <= n; k++) {
    for (let j = 1; j <= n-k+1; j++) bell[n][k] += choose(n-1, j-1) * D[j] * bell[n-j][k-1];
  }
}
// The scalar derivatives of z^-1/2 on z>=1/4 are at most 2*4^k*k!.
const inverseRoot = bell.map((row, n) => row.slice(0, n+1).reduce((s, b, k) =>
  s + 2n * (4n ** BigInt(k)) * factorial(k) * b, 0n));
const quotient = inverseRoot.map((_, n) => conv(bump, inverseRoot, n));
const partition = quotient.slice(0, 8).map((_, n) => (3n * (1n + (quotient[n] > quotient[n+1] ? quotient[n] : quotient[n+1]))).toString());
const time = Array.from({length: 8}, (_, j) => ({derivativeOrder: j + 2, integralUpper: (S[j+2] ** 2n).toString()}));
const receipt = {schema: 'MathScope.OriginalPartitionAndStepFTCUpper/1', status: 'PASS', sourcePins: pins,
  parameterExpressionSHA256: source.parameterExpressionSHA256,
  partitionUpper: partition, timeStepSquareIntegrals: time,
  partitionProof: 'Translate three original bumps. On the numerator support D>=1/4. Leibniz and Bell polynomials bound the quotient derivatives through order eight. The original flat guard gives zero outside. The one-dimensional anchored rectangle has length two, so its face sum is bounded by 3 times one plus the maximum of two consecutive derivatives.',
  timeProof: 'The original sigma_j derivative is bounded by the linear-seed recurrence. The unit-interval square integral is at most the square of that bound.',
  scope: 'These are upper bounds for the original partition and step-square operands only. Bind their actual IDs before using them to evaluate a K operand.',
  release: 'HOLD'};
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n');
console.log('PASS original partition derivative FTC and eight pulse-step squared integral bounds');
