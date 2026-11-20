import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const suffix = '/mathscope-m2/navier/actual-global-primitive-kernels.mjs';
const pin = 'efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59';
const bridge = new URL('./primitive_budget_bridge.mjs', import.meta.url).href;
const original = '  const a=visit(left),b=visit(right);';
const replacement = `  let a,b;
  try { a=visit(left); b=visit(right); }
  catch (error) {
    if (error.code!=='RESOURCE_LIMIT' ||
        error.message!=='Explicit primitive alpha-equivalence exceeded its declared visit budget.') throw error;
    return exactPythonPrimitiveFallback(G,left,right,atomicNodes,maxVisits);
  }`;

registerHooks({load(url, context, next) {
  const result = next(url, context);
  if (!url.endsWith(suffix)) return result;
  const bytes = readFileSync(fileURLToPath(url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), pin);
  const body = bytes.toString('utf8');
  assert.equal(body.split(original).length, 2);
  console.log(JSON.stringify({diagnostic: 'installed-exact-budget-fallback', primitiveSourceSHA256: pin}));
  return {...result,
    source: `import { exactPythonPrimitiveFallback } from ${JSON.stringify(bridge)};\n` +
      body.replace(original, replacement)};
}});
