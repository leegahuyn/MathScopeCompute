/** Independent comparison of saved PUBLIC DOM cells with the completed
 * browser job and the previously observed module/Worker tables.
 * This imports only presentation/value-format helpers; it never constructs
 * a mathematical source graph or reruns a numerical job.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';
import {scalarText} from '../../visualization/observations.mjs';
import {actualPhysicalCenterPanels} from '../../visualization/actual-physical-center-panels.mjs';

const root=fileURLToPath(new URL('../../../../',import.meta.url)),
  m2=fileURLToPath(new URL('../../',import.meta.url)),
  base=fileURLToPath(new URL('../research/evidence/physical-center-runtime-20261011/',import.meta.url)),
  output=path.join(base,'browser-v80-panel-value-parity.json'),
  log=path.join(base,'browser-v80-panel-value-parity.log'),
  paths={dom:path.join(base,'browser-v80-panels-dom.json'),browser:path.join(base,'browser-v80-job.json'),
    module:path.join(base,'physical-center-attempt1-module-runtime.json'),worker:path.join(base,'physical-center-attempt1-worker-runtime.json')},
  read=p=>JSON.parse(fs.readFileSync(p,'utf8')),
  digest=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),
  relative=p=>path.relative(root,p).split(path.sep).join('/'),checks=[];
assert.equal(process.argv.length,2,'This verifier uses one fixed already observed v80 packet.');
assert.equal(fs.existsSync(output),false,'Do not overwrite an existing review.');
assert.equal(fs.existsSync(log),false,'Do not overwrite an existing review log.');
const inputs=Object.fromEntries(Object.entries(paths).map(([key,p])=>[key,{path:relative(p),sha256:digest(p)}])),
  startedAt=new Date().toISOString(),start=performance.now();
const checked=(id,fn)=>{const details=fn();checks.push({id,pass:true,...(details===undefined?{}:{details})});};
let result;
try{
  const dom=read(paths.dom),browserRecord=read(paths.browser),job=browserRecord.job,module=read(paths.module),worker=read(paths.worker);
  checked('completed-public-job-and-observed-module-worker-records',()=>{
    assert.equal(browserRecord.ok,true);assert.equal(job.status,'COMPLETED');assert.equal(job.result.status,'COMPLETED');
    assert.equal(job.result.results.status,'COMPLETED');assert.equal(job.result.results.pass,true);
    for(const r of [module,worker]){assert.equal(r.schema,'MathScope.M2.PhysicalCenterRuntimeCase/1');assert.equal(r.pass,true);
      assert.ok(r.checks.length>0&&r.checks.every(c=>c.pass));assert.equal(r.filesUnchangedDuringRun,true);}
    assert.equal(module.mode,'module');assert.equal(worker.mode,'worker');assert.equal(worker.moduleWorkerParity,true);
    assert.equal(dom.schema,'MathScopePublicPhysicalCenterDOMPanels/1');assert.equal(dom.publicVersion,80);
    assert.equal(dom.publicVersionHash,'4831474d');
    if(dom.jobId!==undefined)assert.equal(dom.jobId,job.id);
  });
  const certificateSHA256=await sha256(job.result.results),{executionMetrics,...mathematicalBody}=job.result,
    mathematicalHash=await sha256(mathematicalBody),inputHash=await sha256(job.request),resultHash=await sha256(job.result);
  checked('independently-rehashed-public-result-certificate-and-request',()=>{
    assert.equal(job.inputHash,inputHash);assert.equal(job.resultHash,resultHash);assert.equal(job.mathematicalHash,mathematicalHash);
    for(const r of [module,worker]){assert.equal(certificateSHA256,r.certificateSHA256);assert.equal(mathematicalHash,r.mathematicalHash);
      assert.deepEqual(job.request,r.request);assert.equal(r.originalNumericalCertificateSHA256,'46860eb0f5b4c4b891a4b2f1463e23d2e2ad75390ec12fe6cfb9751a5ed1266c');}
    assert.equal(job.result.results.sourceEvidence.installedEvidenceSHA256,module.installedEvidenceSHA256);
    assert.equal(job.result.results.sourceEvidence.installedEvidenceSHA256,worker.installedEvidenceSHA256);
    assert.equal(job.result.results.graph.sha256,module.originalPhysicalSourceGraphSHA256);
    return {inputHash,mathematicalHash,certificateSHA256,resultHash};
  });
  checked('recorded-module-and-worker-tables-and-runtime-source-bytes-identical',()=>{
    assert.deepEqual(module.panelRows,worker.panelRows);assert.deepEqual(module.runtimeSHA256,worker.runtimeSHA256);
    for(const [name,hash]of Object.entries(module.runtimeSHA256))assert.equal(digest(path.join(m2,name)),hash,name);
    assert.equal(module.workerSHA256,worker.workerSHA256);
    assert.equal(module.checkedSourcePathCells,4210);assert.equal(worker.checkedSourcePathCells,4210);
    assert.equal(module.displayLabels,36);assert.equal(worker.displayLabels,36);
    return {runtimeFiles:Object.keys(module.runtimeSHA256).length};
  });
  const expected=actualPhysicalCenterPanels(job),expectedCounts=[84,90,54,42,22,44,2,28,270,4,36],
    valueAt=source=>{
      assert.match(source,/^result\.results\./);
      let v=job;
      for(const segment of source.split('.')){
        assert.match(segment,/^[A-Za-z0-9_-]+$/);
        assert.ok(v!==null&&v!==undefined&&Object.hasOwn(v,segment),'Missing own source field: '+source);
        v=v[segment];
      }
      assert.notEqual(v,undefined,source);return v;
    };
  checked('presentation-rows-and-source-paths-match-the-observed-module-tables',()=>{
    assert.equal(expected.length,11);assert.equal(module.panelRows.length,11);
    assert.deepEqual(expected.map(p=>p.table.rows.length),expectedCounts);
    for(let k=0;k<expected.length;k++){
      const p=expected[k],record=module.panelRows[k];assert.equal(p.id,record.id);
      assert.deepEqual(p.table.rows,record.rows,p.id);assert.deepEqual(p.table.cellSourcePaths,record.cellSourcePaths,p.id);
      assert.equal(p.table.truncated,false);
    }
  });
  function compareDOM(observed){
    assert.equal(observed.panels.length,11);
    assert.equal(new Set(observed.panels.map(p=>p.panelKey)).size,11);
    let sourceCells=0,labels=0,rowCount=0;
    const panels=[];
    for(let k=0;k<expected.length;k++){
      const p=expected[k],t=p.table,d=observed.panels[k],stored=module.panelRows[k];
      assert.equal(d.panelKey,p.id);assert.equal(d.selectedValue,p.id);
      assert.deepEqual(d.columns,t.columns.map(c=>typeof c==='string'?c:c.label),p.id+' columns');
      assert.equal(d.rows.length,t.rows.length,p.id+' row count');
      assert.equal(d.tableMetadata.displayedRows,String(t.rows.length));assert.equal(d.tableMetadata.totalRows,String(t.totalRows));
      assert.equal(d.tableMetadata.truncated,'false');assert.equal(d.tableMetadata.sourceJobId,job.id);
      assert.equal(d.tableMetadata.inputHash,inputHash);
      assert.equal(d.note,`${t.rows.length}행을 모두 표시합니다. 전체 값과 모형은 내보내기 JSON에도 보관합니다.`);
      assert.equal(d.layout.documentScrollWidth,d.layout.documentWidth);
      assert.ok(d.layout.tableWidth>0&&d.layout.tableWidth<=d.layout.documentWidth);
      assert.equal(d.layout.firstCellOverflowWrap,'anywhere');assert.equal(d.layout.firstCellWhiteSpace,'pre-wrap');
      let panelSource=0,panelLabels=0;
      for(let i=0;i<t.rows.length;i++){
        const row=t.rows[i],display=d.rows[i];assert.equal(display.sourcePath,t.sourcePaths[i],p.id+' row source '+i);
        assert.equal(display.cells.length,t.columns.length);assert.equal(display.cells.length,row.length);
        for(let j=0;j<row.length;j++){
          const source=t.cellSourcePaths[i][j],actual=display.cells[j];assert.equal(typeof actual,'string');
          assert.equal(actual,scalarText(stored.rows[i][j]),`${p.id}[${i},${j}] module/DOM`);
          assert.equal(actual,scalarText(row[j]),`${p.id}[${i},${j}] presentation/DOM`);
          if(source){
            const raw=valueAt(source);assert.deepEqual(row[j],raw,source);
            assert.equal(actual,scalarText(raw),`${p.id}[${i},${j}] raw source/DOM`);
            sourceCells++;panelSource++;
          }else{
            assert.equal(p.id,'physical-center-evidence');assert.equal(j,0);
            assert.equal(actual,t.sourcePaths[i].slice('result.results.scope.'.length));
            labels++;panelLabels++;
          }
        }
        rowCount++;
      }
      panels.push({id:p.id,rows:t.rows.length,columns:t.columns.length,sourceCells:panelSource,displayLabels:panelLabels,
        rowSourcePathsCompared:true,columnOrderCompared:true,allTDTextContentExactlyMatches:true,
        sourceJobId:d.tableMetadata.sourceJobId,inputHash:d.tableMetadata.inputHash,truncated:false,
        documentWidth:d.layout.documentWidth,documentScrollWidth:d.layout.documentScrollWidth});
    }
    assert.equal(rowCount,676);assert.equal(sourceCells,4210);assert.equal(labels,36);
    return {panels,rowCount,sourceCells,displayLabels:labels,totalValueCells:sourceCells+labels};
  }
  const parity=compareDOM(dom);
  checked('all-public-DOM-source-cells-labels-columns-row-paths-and-binding-metadata-match',()=>parity);
  checked('exact-comparison-rejects-changed-cell-source-path-order-and-truncation',()=>{
    const d=structuredClone(dom),row=d.panels[0].rows[0],oldText=row.cells[1];
    row.cells[1]=oldText+'0';assert.throws(()=>compareDOM(d));row.cells[1]=oldText;
    const oldPath=row.sourcePath;row.sourcePath=oldPath+'0';assert.throws(()=>compareDOM(d));row.sourcePath=oldPath;
    [d.panels[0].rows[0],d.panels[0].rows[1]]=[d.panels[0].rows[1],d.panels[0].rows[0]];assert.throws(()=>compareDOM(d));
    [d.panels[0].rows[0],d.panels[0].rows[1]]=[d.panels[0].rows[1],d.panels[0].rows[0]];
    d.panels[0].tableMetadata.truncated='true';assert.throws(()=>compareDOM(d));
    return {negativeControls:4,storedDOMModified:false};
  });
  checked('source-evidence-current-arithmetic-and-scope-remain-distinct',()=>{
    const d=job.result.results;
    assert.equal(d.scope.runtimeReconstructedFullSourceGraph,false);assert.equal(d.numerics.sourceAuthenticated,false);
    assert.equal(d.unscaledDerivatives.sourceAuthenticated,false);assert.equal(d.unscaledDerivatives.arithmetic.productsRecomputed,true);
    assert.equal(d.negativeModeValues.sourceAuthenticated,false);assert.equal(d.coupledModeValues.sourceAuthenticated,false);
    for(const field of ['wholeGNUMComplete','userRequestedM2Complete','M3Started','globalResidualNumericallyEnclosed','newLeanKernelProof','rawUnscaledRelativeAccuracyClaimed'])assert.equal(d.scope[field],false);
    for(const p of expected){
      if(['physical-center-selector-scales','physical-center-coarse-point-factors','physical-center-absolute-values'].includes(p.id)){
        assert.equal(p.observation.freshNumericalRecomputation,false);assert.equal(p.observation.numericalValueOrigin,'PINNED_EXECUTED_SOURCE_VALUES');
      }
      if(p.id==='physical-center-unscaled-derivatives')assert.equal(p.observation.numericalValueOrigin,'FRESH_INTERVAL_PRODUCTS_WITH_PINNED_SCALES');
    }
  });
  checked('all-input-artifacts-remain-unchanged-after-review',()=>{
    for(const [k,p]of Object.entries(paths))assert.equal(digest(p),inputs[k].sha256);
  });
  result={schema:'MathScope.PublicV80PhysicalPanelValueParity/1',startedAt,finishedAt:new Date().toISOString(),
    pass:true,checks,inputs,reviewScript:{path:relative(fileURLToPath(import.meta.url)),sha256:digest(fileURLToPath(import.meta.url))},
    observedDOM:{schema:dom.schema,observedAt:dom.observedAt,url:dom.url,version:dom.publicVersion,versionHash:dom.publicVersionHash,jobId:job.id},
    hashes:{mathematicalHash,certificateSHA256,resultHash,inputHash,installedEvidenceSHA256:module.installedEvidenceSHA256,
      originalNumericalCertificateSHA256:module.originalNumericalCertificateSHA256,originalPhysicalSourceGraphSHA256:module.originalPhysicalSourceGraphSHA256},
    ...parity,elapsedMs:performance.now()-start,peakRSSBytes:process.resourceUsage().maxRSS*1024,
    formatRule:'Exact renderer scalarText(value); typed values and rational/exp/neg endpoints are not rounded, abbreviated, evaluated to binary64, or whitespace-normalized.',
    scope:{publicDOMValuesCompared:true,originalRawPathsCompared:true,recordedModuleWorkerByteParityConfirmed:true,
      newBrowserInteractionByThisScript:false,newNumericalJobExecutedByThisScript:false,newSourceConstructorExecuted:false,
      screenshotPixelReview:false,numericalOriginPoliciesReadFromCurrentPresentationCode:true,numericalOriginPolicyDOMAttributesCaptured:false,
      sameRequestAcrossDifferentRuntimeEnvironments:true,environmentHashesRequiredEqual:false,sourceAuthorityCreated:false,
      allSourceLabelsNumericallyCovered:false,globalResidualNumericallyEnclosed:false,wholeGNUMComplete:false,M2Complete:false,M3Started:false}};
}catch(error){
  result={schema:'MathScope.PublicV80PhysicalPanelValueParity/1',startedAt,finishedAt:new Date().toISOString(),pass:false,checks,inputs,
    error:{name:error.name,message:error.message,stack:error.stack},elapsedMs:performance.now()-start,peakRSSBytes:process.resourceUsage().maxRSS*1024};
  process.exitCode=1;
}
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const summary={pass:result.pass,checks:checks.length,rows:result.rowCount??null,sourceCells:result.sourceCells??null,displayLabels:result.displayLabels??null,
  output:relative(output),sha256:digest(output),peakRSSBytes:result.peakRSSBytes,...(result.error?{error:result.error.message}:{})};
fs.writeFileSync(log,JSON.stringify(summary)+'\n',{flag:'wx'});
console.log(JSON.stringify(summary));
