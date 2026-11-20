import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,output]=process.argv.slice(2);
assert.ok(output);
const index=resolve(runtime,'global-source-index.mjs');
const hash=createHash('sha256').update(await readFile(index)).digest('hex');
assert.equal(hash,'a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f');
const {exactActiveTranslates}=await import(pathToFileURL(index));
const inputs=[
  {localLogOffset:'1/2',physicalMeaning:'dyadic minimal failing offset',active:['0','1']},
  {localLogOffset:'0',physicalMeaning:'own center and reference closed endpoint',active:['0']},
  {localLogOffset:'-1/8',physicalMeaning:'joint strict and fixed reference need not be a positive own row',active:['0']},
  {localLogOffset:'-1/2',physicalMeaning:'both adjacent original partition labels overlap',active:['-1','0']},
  {localLogOffset:'3/4',physicalMeaning:'first flat own endpoint',active:['1']},
  {localLogOffset:'-3/4',physicalMeaning:'second flat own endpoint',active:['-1']},
];
for(const row of inputs){
  const output=exactActiveTranslates(row.localLogOffset);
  assert.deepEqual(output.rows.map(r=>r.label),row.active);
  row.call=output;
}
await writeFile(output,JSON.stringify({schema:'MathScope.C121.OriginalPositiveBandCallControls/1',sourceSHA256:hash,inputs},null,2)+'\n',{flag:'wx'});
console.log('PASS six exact original band calls including the open-edge and joint-admission controls');
