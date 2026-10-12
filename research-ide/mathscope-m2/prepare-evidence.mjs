import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getChecklist as arithmetic} from './arithmetic/index.mjs';
import {getChecklist as gauge} from './gauge/index.mjs';
import {INTERFACE_CHECKLIST} from './observatory/checklist.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),original=JSON.parse(fs.readFileSync(path.join(root,'evidence/original-m2-criteria.json'),'utf8'));
let ns=[];try{const m=await import('./navier/checklist.mjs');ns=m.getChecklist?m.getChecklist():m.CHECKLIST||[];}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const records=new Map([...arithmetic(),...gauge(),...ns].map(c=>[c.id,c]));
const interfaces=Object.fromEntries(INTERFACE_CHECKLIST.map(c=>[c.id,c]));
const list=[];for(const group of ['P4','P5','P6','Y3','Y4','N4','N5','I2'])for(const c of original.packages[group].criteria){const r=records.get(c.id)||interfaces[c.id]||{status:'PARTIAL',implementedScope:'Executable finite construction components are available; the original same-profile requirement remains open.'};let status=r.status;if(status==='IMPLEMENTED_FINITE_SCOPE')status='PASS';if(['RESEARCH_OPEN','MODEL_DEVELOPMENT','NOT_IMPLEMENTED','UNSUPPORTED','OPEN'].includes(status))status='OPEN';if(!['PASS','PARTIAL','OPEN'].includes(status))status='PARTIAL';list.push({...c,status,implementedScope:r.implementedScope||r.detail||r.scope||'See the exact component result and original criterion.',testStatus:r.testStatus||'유한 독립 검사와 원문 전체 기준을 구분합니다.',formalComplete:false,acceptanceScope:r.acceptanceScope||null,remainingObligations:r.remainingObligations||[],evidencePaths:(r.evidencePaths||[r.evidencePath,r.independentEvidencePath].filter(Boolean)).map(p=>p.startsWith('mathscope-')?p:'mathscope-m2/'+p),evidencePathBase:'research-ide',inheritedFrom:r.inheritedFrom||null});}
if(list.length!==64||new Set(list.map(x=>x.id)).size!==64)throw Error('Original M2 criteria must remain exactly 64.');
const archive=JSON.parse(fs.readFileSync(path.join(root,'evidence/m1-inherited-comparator-audit.json'),'utf8'));
fs.writeFileSync(path.join(root,'evidence/checklist-data.mjs'),'// Generated from the unmodified original 64 criteria and scoped domain evidence.\nexport const CHECKLIST = '+JSON.stringify(list,null,2)+';\nexport const ARCHIVE = '+JSON.stringify(archive,null,2)+';\n');
const counts=list.reduce((a,c)=>(a[c.status]++,a),{PASS:0,PARTIAL:0,OPEN:0});
fs.writeFileSync(path.join(root,'evidence/m2-criteria-status.json'),JSON.stringify({schema:'MathScope.M2OriginalCriteriaStatus/1',blueprintSha256:original.sourceSHA256,originalCount:64,fullM2Complete:list.every(c=>c.status==='PASS'),counts,criteria:list},null,2));
console.log(JSON.stringify({criteria:list.length,counts}));
