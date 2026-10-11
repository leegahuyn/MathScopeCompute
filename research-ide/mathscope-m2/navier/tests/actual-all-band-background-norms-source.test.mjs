import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {prepareActualAllBandBackgroundNorms,assertActualAllBandBackgroundNorms,actualAllBandBackgroundNormCertificate} from '../actual-all-band-background-norms.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=f=>path.relative(repository,f).split(path.sep).join('/'),digest=b=>createHash('sha256').update(b).digest('hex');
function manifest(){const seen=new Map(),pending=[fileURLToPath(import.meta.url)];while(pending.length){const f=pending.pop();if(seen.has(f))continue;const b=fs.readFileSync(f),body=b.toString('utf8');seen.set(f,digest(b));
  for(const m of [...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)])if(m[1].startsWith('.'))pending.push(path.resolve(path.dirname(f),m[1]));}
  const files=Object.fromEntries([...seen].map(([f,h])=>[relative(f),h]).sort(([a],[b])=>a.localeCompare(b)));return{files,fileCount:seen.size,sha256:digest(canonicalStringify(files)),scope:'Literal local import closure; exact bytes before and after this source run.'};}
const evidence=process.env.MATHSCOPE_ALL_BAND_NORM_EVIDENCE_DIR,stem=process.env.MATHSCOPE_ALL_BAND_NORM_RECEIPT_STEM??'actual-all-band-background-norms-source',target=evidence?path.join(evidence,stem+'.json'):null;
if(target){assert.match(stem,/^[a-z0-9-]+$/);fs.mkdirSync(path.dirname(target),{recursive:true});assert.ok(!fs.existsSync(target),'Earlier source records are immutable.');}
const before=manifest(),start=performance.now(),sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),progress=[],executed=[];
const sourceTest=(id,fn)=>test(id,async()=>{try{await fn();executed.push({id,pass:true});}catch(e){executed.push({id,pass:false,message:e.message});throw e;}});let p,certificate;
try{p=prepareActualAllBandBackgroundNorms({derivativeOrder:2},{onProgress:r=>{const x={...r,elapsedMs:performance.now()-start,rssBytes:process.memoryUsage().rss};progress.push(x);console.log('# all-band-norm '+JSON.stringify(x));}});}
catch(e){const r={schema:'MathScope.ActualAllBandBackgroundNormSourceFailure/1',sourceCommit,sourceManifest:before,sourceManifestUnchangedAfterRun:canonicalStringify(manifest())===canonicalStringify(before),progress,
  error:{message:e.message,code:e.code??null,stack:e.stack},elapsedMs:performance.now()-start,peakRSSBytes:process.resourceUsage().maxRSS*1024,actualCertificateIssued:false,pass:false,designedNegativeControl:false};if(target)fs.writeFileSync(target,JSON.stringify(r,null,2)+'\n',{flag:'wx'});throw e;}

sourceTest('the live full source and all eleven internal norm bindings authenticate',()=>{
  assert.equal(assertActualAllBandBackgroundNorms(p),true);assert.equal(p.checks.length,11);assert.ok(p.checks.every(c=>c.pass));
  assert.equal(p.sourceBinding.actualFullLeadingDefinition,true);assert.equal(p.sourceBinding.originalSourceModulesChanged,false);
});
sourceTest('the full F0 heat and I2 body and full U0 are actually retained',()=>{
  const {G}=p,{bootstrap}=p.prepared;
  assert.equal(p.leading.definitions.F.body,bootstrap.actualHeat.heat.finalF);assert.equal(p.leading.definitions.U.body,bootstrap.finalU);
  for(const f of Object.values(p.leading.definitions)){const n=G.nodes[f.root];assert.equal(n.op,'actual_expression_partial');assert.equal(G.expressionSystems[n.args[0]].body,f.body);assert.equal(f.valueMaterialization,f.body);}
  assert.equal(p.heatRegularity.actualI2CorrectionRoot,bootstrap.actualHeat.heat.correction);assert.equal(p.heatRegularity.actualHeatLossRoot,bootstrap.actualHeat.heat.heatLoss);
  assert.notEqual(p.heatRegularity.actualHeatLossRoot,G.zero);assert.equal(p.heatRegularity.negativeZExtensionClaimed,false);
});
sourceTest('all raw leading mixed FTC faces and exact chart coefficient faces are present',()=>{
  assert.equal(p.leading.ftcRows.length,12);assert.ok(p.leading.ftcRows.every(x=>x.faces.length===4));
  assert.ok(p.coefficientFTC.length>10);assert.ok(p.coefficientFTC.every(x=>x.sourceConstant||x.faces.length===8));
  assert.equal(p.chart.audit.rows.length,9);assert.equal(p.chart.audit.commutators.length,9);assert.equal(p.chart.audit.pass,true);
  assert.ok(Object.values(p.coefficientExpansions).every(e=>e.rows.length===10&&e.includesCoefficientDerivatives));
});
sourceTest('each finite block keeps the actual first two orders and canonical all-order tail',()=>{
  assert.equal(p.normalizedBlocks.length,3);for(const b of p.normalizedBlocks){assert.equal(b.tailStarts,3);assert.deepEqual(b.finite.map(r=>r.order),[1,2]);}
  assert.equal(p.regularity.allFinitePositiveSourceOrders,true);assert.equal(p.scope.uniformUnderCanonicalCutoffEnlargement,true);
});
sourceTest('every C_m and emitted B_m is source only and no absent higher derivative is emitted',()=>{
  const {G}=p;assert.equal(p.rows.length,3);assert.deepEqual(p.rows.map(r=>r.derivativeOrder),[0,1,2]);
  for(const row of p.rows)for(const root of [row.Cslow,row.errorConstant,row.normalizedTailCoefficient])assert.equal(G.freeCoordinates(root).size,0);
  assert.equal(p.gaussianRows.length,1);assert.equal(p.gaussianRows[0].backgroundDerivativeOrder,2);assert.equal(p.gaussianRows[0].C_mPlusTwo,p.rows[2].Cslow);
  assert.equal(p.scope.actualAllBandHConstructed,false);assert.equal(p.scope.commonPhysicalSelectorAttached,false);assert.equal(p.scope.M3Started,false);
});
sourceTest('copied claims and changed program metadata cannot authenticate while appends keep issued SHA fixed',async()=>{
  assert.throws(()=>assertActualAllBandBackgroundNorms(structuredClone({rows:p.rows,scope:p.scope})),{code:'INVALID_SOURCE_CONSTRUCTION'});
  certificate=await actualAllBandBackgroundNormCertificate(p);p.program.callerAddedClaim=true;
  assert.throws(()=>assertActualAllBandBackgroundNorms(p),{code:'INVALID_SOURCE_CONSTRUCTION'});delete p.program.callerAddedClaim;
  p.G.fresh('unrelated_append_after_all_band_norm_certificate');
  const after=await actualAllBandBackgroundNormCertificate(p);assert.equal(after.graph.sha256,certificate.graph.sha256);assert.equal(after.graph.nodeCount,certificate.graph.nodeCount);
});
sourceTest('the source record preserves all checks and unchanged executed imports',()=>{
  const sourceManifest=manifest(),unchanged=canonicalStringify(sourceManifest)===canonicalStringify(before),pass=unchanged&&executed.every(x=>x.pass);
  const record={schema:'MathScope.ActualAllBandBackgroundNormSourceValidation/1',generatedAt:new Date().toISOString(),sourceCommit,sourceManifest:before,sourceManifestUnchangedAfterRun:unchanged,
    mode:'DIRECT_NODE_SOURCE',progress,certificate,executedChecks:[...executed,{id:'final-record',pass}],executedTestGroupCount:executed.length+1,
    elapsedMs:performance.now()-start,peakRSSBytes:process.resourceUsage().maxRSS*1024,pass,finiteSourceRegressionIsUniversalProof:false};
  if(target)fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n',{flag:'wx'});assert.equal(pass,true);assert.equal(record.executedTestGroupCount,7);
});
