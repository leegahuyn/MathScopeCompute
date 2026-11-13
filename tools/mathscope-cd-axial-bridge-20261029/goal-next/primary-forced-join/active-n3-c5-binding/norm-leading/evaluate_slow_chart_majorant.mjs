/** Evaluate the common coefficient FTC upper from the original fixed parameters. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {load, sha, sourceArithmetic} from '../../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [runtime, thresholdsFile, upperFile, out] = process.argv.slice(2);
assert.ok(runtime && thresholdsFile && upperFile && out);
const thresholds = await load(thresholdsFile, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const upper = await readFile(upperFile);
const proof = JSON.parse(upper);
assert.equal(proof.status, 'PASS');
assert.equal(proof.faceBound, 'Each original nonconstant slow-chart coefficient FTC sum lies in [0,2^1521 H^119].');
const {N, evaluateClosedArithmeticDefinitions} = await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const lib = resolve(runtime, 'research-ide/mathscope-m2/navier/source-profile.mjs');
const {getPinnedSourceProfile} = await import(pathToFileURL(lib).href);
const profile = getPinnedSourceProfile();
const {values} = evaluateClosedArithmeticDefinitions(profile.parametersExactExpressions, N,
  {names: ['Lambda', 'C12EnvelopeR']});
const H = N.max([N.point('2'), values.get('Lambda'), values.get('C12EnvelopeR')]);
const result = N.mul(N.point((1n << 1521n).toString()), N.pow(H, 119));
const receipt = {schema: 'MathScope.OriginalSlowChartCoefficientFTCEnclosure/1', status: 'DIRECTED_COMMON_FTC_UPPER',
  parameterExpressionSHA256: profile.parameterExpressionSHA256, coefficientProofSHA256: sha(upper),
  H: N.toClosed(H), enclosure: {lower: {rational: '0'}, upper: N.toClosed(result).upper},
  arithmetic: N.report(), runtimeScope: 'Original explicit chart coefficients with the original radial envelope and parameter bounds.',
  fullKEnclosed: false, release: 'HOLD'};
await writeFile(out, JSON.stringify(receipt, null, 2) + '\n');
console.log(receipt.status);
