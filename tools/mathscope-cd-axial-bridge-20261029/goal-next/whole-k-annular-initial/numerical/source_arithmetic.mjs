import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function load(path, pin) {
  const bytes = await readFile(path);
  assert.equal(sha(bytes), pin, path);
  return JSON.parse(bytes);
}

export async function sourceArithmetic(tree, pins, method) {
  for (const [relative, pin] of Object.entries(pins)) {
    assert.equal(sha(await readFile(resolve(tree, relative))), pin, relative);
  }
  const navier = resolve(tree, 'research-ide/mathscope-m2/navier');
  const source = name => import(pathToFileURL(resolve(navier, name)).href);
  async function coarseArithmetic() {
    // Same directed changes used in the earlier higher-FTC comparison.
    const file = resolve(navier, 'actual-numerical-exponential-arithmetic.mjs');
    let js = await readFile(file, 'utf8');
    const product = '  function multiply(a,b){';
    const sum = '    const sa=sign(a),sb=sign(b),aa=absolute(a),bb=absolute(b);let cmp=compare(aa,bb,depth+1);';
    assert.equal(js.split(product).length, 2);
    assert.equal(js.split(sum).length, 2);
    js = js.replace('precisionBits<256', 'precisionBits<96').replace('Use 256..512', 'Use 96..512');
    js = js.replace(product, product + '\n' +
      '    if(sign(a.lower)>=0&&sign(b.lower)>=0){return {lower:mulPoints(a.lower,b.lower).lower,upper:mulPoints(a.upper,b.upper).upper};}');
    // For very large positive addends, max <= sum <= e * max.
    js = js.replace(sum, sum + '\n' +
      '    if(sa>0&&sb>0&&cmp!==null){const big=cmp>=0?a:b;if(big.kind==="exp"&&compare(big.argument,qpoint(Q(32)),depth+1)>0){const upper=addPoints(big.argument,one,depth+1).upper;return {lower:big,upper:expPoint(upper,depth+1)};}}');
    js = js.replace(/from\s+(['"])(\.[^'"]+)\1/g,
      (_, quote, dep) => 'from ' + quote + pathToFileURL(resolve(dirname(file), dep)).href + quote);
    return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
  }
  assert(method === undefined || method === 'coarse-upper');
  const [{numericalExponentialArithmetic}, {evaluateClosedArithmeticDefinitions}, {tracedArithmeticEvaluator}] =
    await Promise.all([
      method ? coarseArithmetic() : source('actual-numerical-exponential-arithmetic.mjs'),
      source('actual-closed-parameter-arithmetic.mjs'),
      source('actual-selection-arithmetic-enclosure-kernel.mjs'),
    ]);
  const N = numericalExponentialArithmetic({
    precisionBits: method ? 96 : 256, maxOperations: 100_000_000, maxMemoEntries: 250_000,
  });
  return {N, evaluateClosedArithmeticDefinitions, tracedArithmeticEvaluator};
}
