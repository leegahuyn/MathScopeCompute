import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const path = process.argv[2] ?? new URL('./whole-k-angular.json', import.meta.url);
const bytes = readFileSync(path);
const digest = createHash('sha256').update(bytes).digest('hex');
assert.equal(digest, 'f9d6240fa7214d9fcb1254dd2b8a289723fdc0f4d08ee556dee8f7f8bb5d958a');

const source = JSON.parse(bytes);
assert.equal(source.status, 'SOURCE_EXACT_PARTIAL_REDUCTION');
assert.equal(source.graph, 'b68d5de9a1b03f4eb393eda5c1af8591a39237b66fc94edaf6d65959e3a70ab7');
assert.equal(source.registry, 'f8440a02d382dc2e07c9f074d4dbe1e3ab4f8e3697f9c92644bd0bc1ae45a6f1');
const {wave} = source;
assert.equal(wave.rowApplications, 486);
assert.equal(wave.ownCharts.length, 30);
for (const chart of wave.ownCharts) {
  assert.equal(chart.termCount, 5);
  assert.deepEqual(chart.mAbs, [1, 2]);
}
assert.deepEqual(wave.frequencyTermCountsByAbsM, {'1': 90, '2': 60});
assert.equal(wave.checkedGuardAndActualArgumentRoots, 420);

// These exact arithmetic controls use twice the complex Fourier coefficient.
function spectrum(terms) {
  const coefficients = new Map();
  for (const [kind, frequency, amplitude] of terms) {
    assert(kind === 'cos' || kind === 'sin');
    assert(frequency > 0n);
    for (const sign of [-1n, 1n]) {
      const n = sign * frequency;
      let [real, imaginary] = coefficients.get(n) ?? [0n, 0n];
      if (kind === 'cos') {
        real += amplitude;
      } else {
        imaginary -= sign * amplitude;
      }
      coefficients.set(n, [real, imaginary]);
    }
  }
  return coefficients;
}

function fourTimesTail(coefficients, cutoff) {
  let sum = 0n;
  for (const [n, [real, imaginary]] of coefficients) {
    if (n < -cutoff || n > cutoff) sum += real ** 2n + imaginary ** 2n;
  }
  return sum;
}

const collision = spectrum([
  ['cos', 2n, 3n], ['cos', 2n, -3n], ['sin', 2n, 4n], ['sin', 2n, -4n],
]);
assert.equal(fourTimesTail(collision, 0n), 0n);
const sample = spectrum([['cos', 20n, 3n], ['sin', 40n, 2n]]);
assert.equal(fourTimesTail(sample, 16n), 26n);
assert.equal(fourTimesTail(sample, 32n), 8n);
assert.equal(fourTimesTail(sample, 40n), 0n);

const receipt = {
  status: 'SOURCE_BOUND_SYMBOLIC_LOCAL_FOURIER_TAIL',
  receiptSHA256: digest,
  graph: source.graph,
  registry: source.registry,
  actualIndexedComponentRows: wave.rowApplications,
  actualOwnCharts: wave.ownCharts.length,
  trigPerRow: 5,
  perRowAllowedHarmonics: [1, 2],
  sourceAngleIndependentGuardRoots: wave.checkedGuardAndActualArgumentRoots,
  actualSupportBound: 'At each admitted slow point, Omega is the maximum absolute winding of all 162 actual rows.',
  cutoffFormula: 'The normalized L2 tail is the sum of squared complex coefficients for |n|>M after adding all contributions at equal n, over all three components.',
  finiteTail: 'Zero for cylindrical M>=2 Omega and Cartesian M>=2 Omega+1.',
  sourceMajorant: 'The normalized squared angular tail is bounded by the square of the sum of absolute values of the 486*5 real harmonic amplitudes.',
  tests: {
    collisionExactZero: true,
    sampleTailTimesFourAt16: 26,
    sampleTailTimesFourAt32: 8,
    sampleTailTimesFourAt40: 0,
    fixtures: 'synthetic exact integer controls',
  },
  scope: 'Admitted N1 first-correction gauge only. Actual winding values, amplitude intervals, slow-variable majorant, numerical 16-to-32 energy comparison, and final-field tail are open.',
};
console.log(JSON.stringify(receipt, null, 2));
