// Re-check displayed source bindings against preserved, hash-verified runtime
// replay results. This does not re-run a source compiler or a browser worker.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeM2Visualization,listM2Panels} from '../visualization/m2-views.mjs';
import {sha256} from '../../mathscope-m0/contracts.mjs';

const root=new URL('../navier/research/evidence/differential-extension-20261011/',import.meta.url);
const resolve=(job,path)=>path.replace(/\[(\d+)\]/g,'.$1').split('.').reduce((x,k)=>x?.[k],job);
const cases=[];
for(const name of ['actual-covariance-sensitivity-source','actual-covariance-sensitivity-worker','actual-pulse-jet-worker','actual-full-curl-worker']){
  const text=fs.readFileSync(new URL(name+'-replay.json',root),'utf8'),bundle=JSON.parse(text);
  const {bundleHash,...body}=bundle;
  assert.equal(await sha256(body),bundleHash,'Preserved bundle digest');
  assert.equal(await sha256(bundle.result),bundle.resultHash,'Preserved calculation result digest');
  const runtimeText=fs.readFileSync(new URL(name+'-runtime.json',root),'utf8');
  const job={id:name,request:bundle.request,inputHash:bundle.inputHash,status:bundle.result.status,result:bundle.result,resultHash:bundle.resultHash};
  const panels=listM2Panels(job);
  let rows=0,sourcePathCells=0,displayLabelCells=0,emptyPlaceholderCells=0;
  for(const panel of panels){
    const view=makeM2Visualization(job,{panel:panel.id});
    assert.equal(view.state,'READY');
    for(const table of [view.table,...view.relatedTables])for(let i=0;i<table.rows.length;i++){
      assert.equal(typeof table.sourcePaths?.[i],'string');
      assert.notEqual(resolve(job,table.sourcePaths[i]),undefined,'The original row or property exists');
      rows++;
      for(let j=0;j<table.rows[i].length;j++){
        const value=table.rows[i][j],path=table.cellSourcePaths?.[i]?.[j];
        if(path){assert.deepEqual(value,resolve(job,path),path);sourcePathCells++;}
        else if(j===0&&table.columns[0]==='항목'&&typeof value==='string')displayLabelCells++;
        else {assert.equal(value,null,'An unbound value may only be an empty display placeholder');emptyPlaceholderCells++;}
      }
    }
  }
  assert.ok(sourcePathCells>0&&rows>0);
  cases.push({name,kind:bundle.request.kind,pass:true,replaySHA256:await sha256(text),resultHash:bundle.resultHash,
    runtimeRecordSHA256AtViewAudit:await sha256(runtimeText),panels:panels.length,rows,sourcePathCells,displayLabelCells,emptyPlaceholderCells,
    allCellsSourceBound:displayLabelCells+emptyPlaceholderCells===0,checkedCellsWithSourcePathsMatchSource:true,
    rowsSourceLinked:true,unboundCellsAreLabelsOrEmptyPlaceholders:true});
}
const record={schema:'MathScope.DifferentialReplayViewAudit/1',generatedAt:new Date().toISOString(),pass:true,
  command:'node research-ide/mathscope-m2/tests/differential-replay-view-audit.mjs',exitCode:0,
  sourceCompilationRerun:false,browserExecution:false,
  rendererSHA256:await sha256(fs.readFileSync(new URL('../visualization/actual-differential-panels.mjs',import.meta.url),'utf8')),
  cases};
fs.writeFileSync(new URL('replay-view-binding-audit.json',root),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify(record,null,2));
