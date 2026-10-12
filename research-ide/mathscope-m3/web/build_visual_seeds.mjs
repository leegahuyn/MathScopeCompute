// Produce display extracts from actual archived executions; never manufacture runs.
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url)),m3=path.dirname(root);
const context=vm.createContext({});
vm.runInContext(readFileSync(path.join(root,'p7-visual-models.js'),'utf8'),context);
const models=context.MathScopeP7VisualModels;
const names=['elliptic-local','zeta-2','explicit-psi','operator-reference','central-11a1','central-37a1','taylor-zeta'];
const titles={'elliptic-local':'37a1 · 소수별 인자와 유리점','zeta-2':'ζ(2) · 미분과 복소 구간','explicit-psi':'ψ(10.5) · T=30 영점·명시적 공식','operator-reference':'ℓ² 대각 연산자 · 유한 계약','central-11a1':'11a1 · 중심값과 해석적 랭크','central-37a1':'37a1 · 중심값과 해석적 랭크','taylor-zeta':'ζ · 유한 변위 Taylor 나머지'};
const commit='bffb0db10934dc21ade349c76df7e911c34a9e55';
const sourceFiles=[];
const records=names.map(name=>{
  const relative='evidence/resume-20261012/attempt2/'+name+'.json.gz';
  const bytes=readFileSync(path.join(m3,relative)),full=JSON.parse(gunzipSync(bytes));
  const archiveURL='https://github.com/leegahuyn/MathScopeCompute/blob/'+commit+'/research-ide/mathscope-m3/'+relative;
  full.visualSource={mode:'ARCHIVED_EXAMPLE',archiveURL,title:titles[name],current:false};
  full.visualArchive={archiveReference:archiveURL};
  const compact=models.compactRecord(full);
  sourceFiles.push({path:relative,gzipSHA256:createHash('sha256').update(bytes).digest('hex'),recordSHA256:full.recordSHA256,compactBytes:Buffer.byteLength(JSON.stringify(compact)),fullBytes:gunzipSync(bytes).length});
  return compact;
});
const progress=JSON.parse(readFileSync(path.join(m3,'P7_PROGRESS.json'),'utf8'));
const payload={schema:'MathScope.M3.P7VisualArchive/1',sourceCommit:commit,authority:'DISPLAY_EXTRACTS_ONLY_ORIGINAL_RECORDS_REQUIRE_REEXECUTION',currentLiveVerification:false,proofStatusPromoted:false,sourceFiles,capabilities:{criteria:progress.criteria},records};
writeFileSync(path.join(root,'p7-visual-seeds.json'),JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify({bytes:Buffer.byteLength(JSON.stringify(payload)),sourceFiles,models:Array.from({length:8},(_,i)=>{const criterion='P7-0'+(i+1),m=models.build({criterion,records,capabilities:payload.capabilities});return {criterion,points:m.points.length,lines:m.lines.length,enclosures:m.enclosures.length,rows:m.table.rows.length,status:m.status};})},null,2));
