import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getChecklist as arithmetic} from './arithmetic/index.mjs';
import {getChecklist as gauge} from './gauge/index.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),original=JSON.parse(fs.readFileSync(path.join(root,'evidence/original-m2-criteria.json'),'utf8'));
let ns=[];try{const m=await import('./navier/checklist.mjs');ns=m.getChecklist?m.getChecklist():m.CHECKLIST||[];}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const records=new Map([...arithmetic(),...gauge(),...ns].map(c=>[c.id,c]));
const interfaces={
  'I2-01':{status:'PARTIAL',implementedScope:'Typed axes, source fields, units and stored log transforms are displayed; categorical, spectral, Euclidean x4 and physical coordinates are kept distinct. Cross-domain contract coverage is being verified.'},
  'I2-02':{status:'PARTIAL',implementedScope:'Existing scalar slices, scalar marginals and Wilson observations retain their own contracts and loss notes. New lattice output is explicitly a scalar x4 slice; no uncertified reconstruction is enabled.'},
  'I2-03':{status:'PARTIAL',implementedScope:'Two completed M1 runs can be compared with a shared camera, bounds, colors and separate model/sample/observation hashes. A unified Delta-dependent ensemble family and correlator comparison remain to be integrated.'},
  'I2-04':{status:'PARTIAL',implementedScope:'Exact complex tables and selectable basis differential/Frobenius/filtration traces are connected. General higher-dimensional kernel/image and coherent comparison certificates remain incomplete.'},
  'I2-05':{status:'PARTIAL',implementedScope:'Deterministic full-range LOD, disjoint prime tiles, explicit uncomputed intervals, viewport navigation and exact bounded interval recomputation are implemented; browser acceptance is recorded separately.'},
  'I2-06':{status:'PARTIAL',implementedScope:'Physical/similarity coordinate contracts and out-of-domain states remain explicit. Full same-tau dual field views with fixed physical viewport and common color controls are not yet constructed.'},
  'I2-07':{status:'PARTIAL',implementedScope:'Camera revisions do not alter computation; changed input closes the old observation, historical jobs restore their own requests, and saves check owned receipts and live session revisions. Browser acceptance is recorded separately.'},
  'I2-08':{status:'PARTIAL',implementedScope:'Keyboard controls, exact HTML tables, non-color markers, reset and deterministic LOD use CPU Canvas2D with measured draw timing. WebGL path and CPU/GPU parity remain unimplemented.'}
};
const list=[];for(const group of ['P4','P5','P6','Y3','Y4','N4','N5','I2'])for(const c of original.packages[group].criteria){const r=records.get(c.id)||interfaces[c.id]||{status:'PARTIAL',implementedScope:'Executable finite construction components are available; the original same-profile requirement remains open.'};let status=r.status;if(status==='IMPLEMENTED_FINITE_SCOPE')status='PASS';if(['RESEARCH_OPEN','MODEL_DEVELOPMENT','NOT_IMPLEMENTED','UNSUPPORTED','OPEN'].includes(status))status='OPEN';if(!['PASS','PARTIAL','OPEN'].includes(status))status='PARTIAL';list.push({...c,status,implementedScope:r.implementedScope||r.detail||r.scope||'See the exact component result and original criterion.',testStatus:r.testStatus||'유한 독립 검사와 원문 전체 기준을 구분합니다.',formalComplete:false});}
if(list.length!==64||new Set(list.map(x=>x.id)).size!==64)throw Error('Original M2 criteria must remain exactly 64.');
const archive=JSON.parse(fs.readFileSync(path.join(root,'evidence/m1-inherited-comparator-audit.json'),'utf8'));
fs.writeFileSync(path.join(root,'evidence/checklist-data.mjs'),'// Generated from the unmodified original 64 criteria and scoped domain evidence.\nexport const CHECKLIST = '+JSON.stringify(list,null,2)+';\nexport const ARCHIVE = '+JSON.stringify(archive,null,2)+';\n');
fs.writeFileSync(path.join(root,'evidence/m2-criteria-status.json'),JSON.stringify({schema:'MathScope.M2OriginalCriteriaStatus/1',blueprintSha256:original.sourceSHA256,originalCount:64,fullM2Complete:list.every(c=>c.status==='PASS'),counts:list.reduce((a,c)=>(a[c.status]=(a[c.status]||0)+1,a),{}),criteria:list},null,2));
console.log(JSON.stringify({criteria:list.length,counts:list.reduce((a,c)=>(a[c.status]=(a[c.status]||0)+1,a),{})}));
