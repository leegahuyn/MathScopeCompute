import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [sourcePath,out]=process.argv.slice(2);
assert.ok(out,'Provide the original global-source-index.mjs and a fresh output path');
const sha=createHash('sha256').update(await readFile(sourcePath)).digest('hex');
assert.equal(sha,'a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f');
const {exactActiveTranslates}=await import(pathToFileURL(resolve(sourcePath)));
const shift=1n<<1024n;
const floors=(x,d)=>x>=0n?x/d:-((-x+d-1n)/d);
let sourceCalls=0,flatSupportSeams=0;
const rows=[];
for(const offset of [0n,shift,-shift]){
  for(let num=-16n;num<=16n;num++){
    const x=[16n*offset+num,16n];
    const answer=exactActiveTranslates(x);
    const wanted=[];
    for(let j=offset-2n;j<=offset+2n;j++){
      const distance=x[0]-j*x[1];
      if(-12n<distance&&distance<12n) wanted.push(String(j));
      if(distance===12n||distance===-12n){
        assert.ok(!answer.rows.some(row=>row.label===String(j)));
        flatSupportSeams++;
      }
    }
    assert.deepEqual(answer.rows.map(row=>row.label),wanted);
    assert.equal(answer.nearest,String(floors(x[0]+8n,16n)));
    assert.equal(answer.positiveCount,wanted.length);
    sourceCalls++;
    if(offset===0n) rows.push({coordinate:answer.coordinate,nearest:answer.nearest,active:answer.rows.map(x=>x.label)});
  }
}
await writeFile(out,JSON.stringify({schema:'MathScope.C108.OriginalPartitionIndexReplay/1',sourceSHA256:sha,
  sourceCalls,flatSupportSeams,exactShifts:['0','2^1024','-2^1024'],rows},null,2)+'\n',{flag:'wx'});
console.log(`PASS: ${sourceCalls} source translate calls, ${flatSupportSeams} exclusions at flat endpoints`);
