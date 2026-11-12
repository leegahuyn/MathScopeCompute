import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [source, receiptPath] = process.argv.slice(2);
assert.ok(source && receiptPath, 'Pass source checkout directory and the prior C10 receipt.');
const bytes = await readFile(receiptPath);
const digest = createHash('sha256').update(bytes).digest('hex');
assert.equal(digest, 'a2937d2c2066946f3dbe0a1be2a883766266a0b984914b67780ab81e55eadcbb');
const receipt = JSON.parse(bytes);
const kernels = resolve(source, 'research-ide/mathscope-m2/navier/actual-residual-order-induction-kernels.mjs');
const {sourceAllOrderCutoffJets} = await import(pathToFileURL(kernels).href);
const sigma = sourceAllOrderCutoffJets({order: 11});
assert.equal(sigma.parameterExpressionSHA256, receipt.source.parameterExpressionSHA256);
const bumpSquare = 8n * BigInt(sigma.activation.ordinaryDerivativeBounds[1]);
const target = 2048n;
const radius = 65536n;
const ratio = 9n;
const shifted = target + ratio * radius;
function angularChecks(inverseEpsilon) {
  const fixedPointRemainder = bumpSquare * (shifted**2n + radius**2n);
  const contraction = 2n * bumpSquare * (ratio * shifted + radius);
  const cq = 8193n;
  const aq = bumpSquare * (ratio**2n + 1n);
  return {
    complexBallSelfMap: 4n * target * inverseEpsilon + fixedPointRemainder < radius * inverseEpsilon,
    complexDerivativeBelowOneQuarter: 4n * contraction < inverseEpsilon,
    realLinearCoefficientStaysNegative: 4n * bumpSquare * target * ratio < inverseEpsilon,
    realQuadraticConstantUpper: bumpSquare * target**2n < inverseEpsilon,
    realDiscriminantPositive: 16n * aq * cq < inverseEpsilon,
    realRootInsideComplexBall: 4n * cq < radius,
  };
}
const original = angularChecks(1n << 5800n);
assert.ok(Object.values(original).every(Boolean));
const mutation = angularChecks(2n);
assert.equal(mutation.complexBallSelfMap, false);
assert.equal(mutation.complexDerivativeBelowOneQuarter, false);

function factorial(k) {
  return Array.from({length: k}, (_, j) => BigInt(j + 1)).reduce((a, b) => a * b, 1n);
}
const expectedGamma = Array.from({length: 11}, (_, j) => String(factorial(j) * factorial(j + 1)));
assert.deepEqual(receipt.gammaDerivativeBounds, expectedGamma);
const seen = new Set();
let max = 0n;
for (const row of receipt.physicalRows) {
  const {branch, radialOrder: r, etaOrder: e} = row;
  assert.ok(r >= 0 && e >= 0 && r + e <= 10);
  const id = `${branch}/${r}/${e}`;
  assert.ok(!seen.has(id));
  seen.add(id);
  // Select the powers of x in the product (x+0)(x+1)...(x+r-1)
  // by enumerating all subsets instead of using the producer's recurrence.
  let coefficient = 0n;
  const taylor = receipt.branches[branch].map(BigInt);
  for (let subset = 0; subset < 2**r; subset++) {
    let derivativeOrder = 0;
    let term = 1n;
    for (let j = 0; j < r; j++) {
      if (subset & (1 << j)) derivativeOrder++;
      else term *= BigInt(j);
    }
    const prefix = taylor.slice(0, derivativeOrder + e + 1).reduce((a, b) => a + b, 0n);
    coefficient += term * factorial(derivativeOrder) * factorial(e) * prefix;
  }
  assert.equal(String(coefficient), row.coefficient, id);
  assert.equal(coefficient.toString(2).length, row.binaryDigits, id);
  if (coefficient > max) max = coefficient;
}
assert.equal(seen.size, 462);
assert.equal(max.toString(2).length, 193);
assert.ok(max < (1n << 193n));
assert.equal(receipt.maxBits, 193);
console.log(JSON.stringify({receiptSHA256: digest, originalAngular: original, mutatedAngularScaleRejected: true,
  independentPhysicalRows: seen.size, coefficientBits: max.toString(2).length, dyadicExponent: 65536 - 193}, null, 2));
