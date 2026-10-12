// Compare observed live UI cells and WebMCP exports against immutable v75 runs.
// This is deployment/representation evidence, not a mathematical theorem.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {actualContinuationPanels} from '../visualization/actual-continuation-panels.mjs';
import {scalarText} from '../visualization/observations.mjs';
import {sha256} from '../../mathscope-m0/contracts.mjs';

const out=new URL('../navier/research/evidence/m2-continuation-20261011/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,out)));
const observed=read('browser-observation.json'),runs=new Map(),panelChecks=[];
for(const row of observed.jobs){
  const replay=read(row.kind.slice(3)+'-worker-replay.json');
  const run=read(row.kind.slice(3)+'-worker-runtime.json');
  assert.equal(row.status,'COMPLETED');assert.equal(row.allChecksPass,true);
  for(const key of ['inputHash','mathematicalHash'])assert.equal(row[key],replay[key]);
  assert.equal(row.certificateSHA256,await sha256(replay.result.results));
  assert.equal(row.certificateSHA256,run.certificateSHA256);
  assert.equal(row.workerSHA256,replay.environment.workerSha256);
  assert.equal(row.checks,replay.result.checks.length);
  runs.set(row.kind,{...replay,status:row.status});
}
for(const p of observed.panels){
  const job=runs.get(p.kind),panel=actualContinuationPanels(job).find(x=>x.title===p.panel);
  assert.ok(panel,p.panel);
  const cells=panel.table.rows.flatMap(row=>row.map(scalarText));
  const digest=createHash('sha256').update(JSON.stringify(cells)).digest('hex');
  assert.equal(digest,p.displayedCellsSHA256,p.panel+' DOM text matches source/Worker rendering');
  let values=0,labels=0;
  for(let i=0;i<panel.table.rows.length;i++)for(let j=0;j<panel.table.rows[i].length;j++){
    const path=panel.table.cellSourcePaths[i][j];
    if(!path){labels++;continue;}
    const value=path.split('.').reduce((v,k)=>v?.[k],job);
    assert.deepEqual(value,panel.table.rows[i][j]);values++;
  }
  assert.equal(values,p.sourceValuesCompared);assert.equal(labels,p.unboundDisplayLabels);
  panelChecks.push({...p,allObservedCellsMatchCurrentSourceRendering:true,allSourceValuePathsMatch:true});
}
assert.equal(panelChecks.reduce((n,p)=>n+p.sourceValuesCompared,0),60);
assert.equal(panelChecks.reduce((n,p)=>n+p.unboundDisplayLabels,0),55);
const result={...observed,schema:'MathScope.M2.Continuation.LiveBrowser/1',
  status:'EXECUTED_SCOPED_WITH_RECORDED_UI_LAYOUT_ISSUE',
  comparedAt:new Date().toISOString(),sourceWorkerBrowserMathematicalHashesAgree:true,
  sourceWorkerBrowserCertificateHashesAgree:true,panels:panelChecks,
  allValueCellsSourceBound:true,allCellsSourceBound:false,
  validationScript:'research-ide/mathscope-m2/tests/verify-continuation-browser.mjs',
  evidenceTransport:'Observed WebMCP/DOM values and small digest records were returned by the browser tool; full exported files and screenshot did not synchronize.'};
fs.writeFileSync(new URL('browser-qa.json',out),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({jobs:2,panels:5,sourceValuesCompared:60,unboundLabels:55,sourceWorkerBrowserParity:true,layoutIssuePending:true}));
