/** Reuse the exact old mean namespace while retaining covariance epsilon factors. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeFineArithmeticModule} from './fine_arithmetic_module.mjs';

const [goal,runtime,slowReceipt,historicalPath,output,mode]=process.argv.slice(2);
assert.ok(process.argv.length===7||process.argv.length===8);
assert.ok(mode===undefined||mode==='deep-sum'||mode==='deep-sum-refined-Bnorm');
const evaluatorPath=resolve(goal,
  'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/evaluate_weighted_velocity.mjs');
const source=await readFile(evaluatorPath);
const evaluatorPin='987c0854a126cee2c889979bb9be46d7ca2f35ed0ec82fce2d48cb00e0824da8';
assert.equal(createHash('sha256').update(source).digest('hex'),evaluatorPin);
let text=source.toString();
if(mode?.startsWith('deep-sum')) {
  const originalImport="pathToFileURL(resolve(goal,\n  'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href";
  assert.equal(text.split(originalImport).length,2);
  text=text.replace(originalImport,JSON.stringify(await makeFineArithmeticModule(goal)));
}
const boundary='const C0 = N.mul(point(4), N.max(valueRoots.map(oldBound)));';
assert.equal(text.split(boundary).length,2);
const extension=await readFile(resolve(dirname(fileURLToPath(import.meta.url)),
  'covariance_scaled_mean_extension.mjs'),'utf8');
process.argv=[process.argv[0],process.argv[1],goal,runtime,slowReceipt,output+'.original67.json',output];
const context='const scaledMeanInputs='+JSON.stringify({historicalPath,evaluatorPin,mode:mode??'prior-coarse'})+';\n';
try {
  await import('data:text/javascript;base64,'+
    Buffer.from(text.split(boundary)[0]+context+extension).toString('base64'));
} catch (error) {
  console.error(error.name+': '+error.message);
  process.exitCode=1;
}
