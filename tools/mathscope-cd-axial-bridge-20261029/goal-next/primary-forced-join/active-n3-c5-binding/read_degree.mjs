import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

assert.equal(process.argv.length, 3);
const file = resolve(process.argv[2], 'mathscope-m3/navier/source-primary-class-majorants.mjs');
const sha = createHash('sha256').update(await readFile(file)).digest('hex');
const { originalPrimaryClassDegreeProgram } = await import(pathToFileURL(file));
const result = originalPrimaryClassDegreeProgram({ order: 5, targetPoles: [3, 6, 9, 12, 15, 18, 21] });
const { weighted, invNormal } = result;
const { rows, powers } = weighted.mixed;
const normal = rows.filter(row => row.label.startsWith('original n_') && !row.label.startsWith('original n_prime'));
const maxByOrder = regex => {
  const matched = rows.filter(row => regex.test(row.label));
  assert.equal(matched.length, 6);
  return Array.from({ length: 5 }, (_, j) => Math.max(...matched.map(row => row.powers[j])));
};
assert.equal(normal.length, 3);
console.log(JSON.stringify({ sourceSHA256: sha, normal, invNormal, primary: weighted.amplitude.slice(0, 6),
  potential: weighted.potential.slice(0, 6), curlRemainder: weighted.curl, homogeneousPressure: result.pressure,
  B: maxByOrder(/^original B [0-2][01]$/), Bleft: maxByOrder(/^original Bleft [01][0-2]$/),
  wMatrix: powers.matrix.slice(0, 5), P: powers.P.slice(0, 5),
  rho: rows.find(row => row.label === 'original log P derivative').powers.slice(0, 5),
  pressureNumerator: result.pressureNumerator.slice(0, 5) }));
