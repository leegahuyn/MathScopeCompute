import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {sha256} from '../contracts.mjs';
import {reviewStudyRows} from '../study-review.mjs';
const outputName=process.argv[2]??'matched-study-review-attempt1',jobs=process.argv.slice(3);if(!/^[A-Za-z0-9._-]+$/.test(outputName)||!jobs.length||jobs.some(j=>!/^[A-Za-z0-9._-]+$/.test(j)))throw new Error('Usage: assemble-study-evidence.mjs NEW_OUTPUT_ID JOB_IDS...');
const dir=new URL('../evidence/scale-expansion/'+outputName+'/',import.meta.url);await mkdir(dir,{recursive:false});const rows=[],files=[],records=[];
for(const job of jobs){
 const url=new URL('../evidence/scale-expansion/'+job+'/result.json',import.meta.url),raw=await readFile(url,'utf8'),record=JSON.parse(raw);if(await sha256(record.result)!==record.resultHash)throw new Error('Stored result hash mismatch: '+job);
 for(const source of record.sourceFiles){const actual=await readFile(new URL(source.snapshot,url),'utf8');if(await sha256(actual)!==source.sha256)throw new Error('Stored source snapshot mismatch: '+job+'/'+source.snapshot);}
 rows.push(...record.result.rows);records.push(record);files.push({jobId:job,path:'research-ide/mathscope-m3/gauge/evidence/scale-expansion/'+job+'/result.json',fileSha256:await sha256(raw),resultHash:record.resultHash,sourceFiles:record.sourceFiles,originalExecution:record.execution});
}
const seen=new Set();for(const r of rows){if(seen.has(r.id))throw new Error('Duplicate row id would hide a replaced execution: '+r.id);seen.add(r.id);}
const review=await reviewStudyRows(rows),payload={schema:'MathScope.M3.SU2MatchedStudyReview/1',rows,review,sourceFiles:files,sourceAudit:{status:'ORIGINAL_RESULT_AND_SOURCE_SNAPSHOT_HASHES_MATCH',newNumericalExecution:false,reviewSourceSha256:await sha256(await readFile(new URL('../study-review.mjs',import.meta.url),'utf8')),protectedBaselineCommit:'d5a7b4daaeb2bef26f638817956f13c582e69ab8'},productionRequests:records.map(r=>({jobId:r.jobId,input:r.input,reusedIndependentReference:r.reusedIndependentReference}))};
const text=JSON.stringify({...payload,payloadHash:await sha256(payload)})+'\n',compressed=gzipSync(Buffer.from(text,'utf8'),{level:9,mtime:0});
await writeFile(new URL('review.json.gz',dir),compressed,{flag:'wx'});console.log(JSON.stringify({output:outputName,file:'review.json.gz',encoding:'GZIP_UTF8_JSON',fileSha256:createHash('sha256').update(compressed).digest('hex'),uncompressedSha256:await sha256(text),rows:rows.length,reviewHash:review.reviewHash,checks:review.scopeChecks,extrapolation:review.limits.spacing.extrapolation.status}));
