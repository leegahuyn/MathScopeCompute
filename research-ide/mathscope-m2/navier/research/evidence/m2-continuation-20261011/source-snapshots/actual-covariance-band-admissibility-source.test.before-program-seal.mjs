import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualCovarianceBandAdmissibility,assertActualCovarianceBandAdmissibility,certifyActualCovarianceBandAdmissibility,actualCovarianceBandAdmissibilityCertificateFromProgram} from '../actual-covariance-band-admissibility.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=file=>path.relative(repository,file).split(path.sep).join('/');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function sourceManifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];
  while(pending.length){
    const file=pending.pop();if(seen.has(file))continue;
    const bytes=fs.readFileSync(file),body=bytes.toString('utf8');seen.set(file,digest(bytes));
    const imports=[...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
    for(const match of imports)if(match[1].startsWith('.'))pending.push(path.resolve(path.dirname(file),match[1]));
  }
  const files=Object.fromEntries([...seen].map(([file,sha256])=>[relative(file),sha256]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Local literal import closure of this actual-source test, including the runner; built-in Node modules are identified by the runtime version.',fileCount:seen.size,sha256:digest(canonicalStringify(files)),files};
}
const evidenceDirectory=process.env.MATHSCOPE_BAND_EVIDENCE_DIR,recordPath=evidenceDirectory?path.join(path.resolve(evidenceDirectory),'actual-covariance-band-admissibility-source.json'):null;
if(recordPath){fs.mkdirSync(path.dirname(recordPath),{recursive:true});assert.ok(!fs.existsSync(recordPath),'An existing evidence receipt must not be overwritten.');}
const started=performance.now(),manifestBefore=sourceManifest(),sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),executed=[];
const sourceTest=(name,fn)=>test(name,async()=>{await fn();executed.push({id:name,pass:true});});

// One authentic source graph is shared by these checks. No second source graph
// is created to run the negative controls.
const p=prepareActualCovarianceBandAdmissibility({ellExact:'1'});

sourceTest('actual source threshold contains its positive-h frequency operand',()=>{
  assert.equal(assertActualCovarianceBandAdmissibility(p),true);
  assert.ok(p.checks.every(r=>r.pass));
  assert.equal(p.roots.frequencyMinimum,p.bounds.selection.frequencyMinimum);
  assert.equal(p.roots.ellMinimum,p.bounds.selection.ellMinimum);
  assert.equal(p.roots.qStar,p.bounds.selection.qStar);
  assert.equal(p.proof.positiveH.zeroSubstitutionUsed,false);
});

sourceTest('all finite bands are excluded without assigning a determinant or weight sign',()=>{
  assert.equal(p.decision.uniformTheoremMember,false);
  assert.equal(p.decision.uniformTheoremNonmembershipProved,true);
  assert.equal(p.decision.actualDeterminantSign,'UNKNOWN');
  assert.deepEqual(p.decision.actualWeightSigns,['UNKNOWN','UNKNOWN']);
  assert.equal(p.decision.actualPositiveWeightsProved,false);
  assert.equal(p.decision.squareRootWeightsOnThisMemberCertified,false);
  assert.equal(p.decision.m3MayStart,false);
});

sourceTest('the authenticated c1 operand gives exact inactive positive-order terms',()=>{
  const first=p.operator.background.cutoffs.rows[0];
  assert.equal(p.roots.actualC1,first.scale);
  assert.equal(p.operator.band.rows[0].sigma,p.G.mul(first.scale,p.operator.band.qVariable));
  assert.equal(p.decision.positiveOrderBackgroundCutoffsAllInactive,true);
  assert.equal(p.decision.completedFGExactlyLeadingOnFiniteBands,true);
  assert.equal(p.proof.exactLeadingBackgroundOnFiniteBands.generated128SourceGraphsClaimed,false);
  assert.equal(p.roots.actualCompleteTimeCutoffBody,p.G.expressionSystems[p.operator.band.cutoffSystem].body);
});

sourceTest('ell1 geometry is stated exactly with nonzero h',()=>{
  assert.deepEqual(Object.fromEntries(['Q','S','k','paletteIndex','ci','Ls'].map(k=>[k,p.proof.ellOneGeometry[k]])),
    {Q:'1/2',S:'1',k:'2',paletteIndex:'0',ci:'2^(-1-h)',Ls:'2^(-32+h)'});
});

sourceTest('copied authentic objects and a changed decision are rejected',()=>{
  assert.throws(()=>certifyActualCovarianceBandAdmissibility({...p.operator}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualCovarianceBandAdmissibility({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const before=p.decision.actualPositiveWeightsProved;
  p.decision.actualPositiveWeightsProved=true;
  assert.throws(()=>assertActualCovarianceBandAdmissibility(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
  p.decision.actualPositiveWeightsProved=before;
  assert.equal(assertActualCovarianceBandAdmissibility(p),true);
});

sourceTest('changing a threshold operand is rejected by the retained source graph',()=>{
  const id=p.roots.frequencyMinimum,old=p.G.nodes[id];
  p.G.nodes[id]={op:'rational',args:['0','1']};
  assert.throws(()=>assertActualCovarianceBandAdmissibility(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
  p.G.nodes[id]=old;
  assert.equal(assertActualCovarianceBandAdmissibility(p),true);
});

test('the source receipt preserves the compiled graph and unchanged import manifest',async()=>{
  assert.equal(executed.length,6);
  const certificate=await actualCovarianceBandAdmissibilityCertificateFromProgram(p),manifestAfter=sourceManifest();
  assert.deepEqual(manifestAfter,manifestBefore);
  assert.equal(certificate.graph.sha256.length,64);assert.ok(certificate.checks.every(row=>row.pass));
  const record={schema:'MathScope.ActualCovarianceBandAdmissibilitySourceTest/1',generatedAt:new Date().toISOString(),sourceCommit,
    command:['node','--test',relative(fileURLToPath(import.meta.url))],mode:'DIRECT_ACTUAL_SOURCE_AND_EXACT_DOMAIN_COMPARISONS',
    runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},
    sourceManifest:manifestBefore,sourceManifestUnchangedAfterRun:true,certificate,
    executedChecks:[...executed,{id:'the source receipt preserves the compiled graph and unchanged import manifest',pass:true}],
    executedTestGroupCount:7,elapsedMs:performance.now()-started,peakRSSBytes:process.resourceUsage().maxRSS*1024,pass:true,
    scope:{oneActualEllOneGraphExecuted:true,all128SourceGraphsExecuted:false,allFiniteBandNonmembershipWrittenProof:true,
      actualWeightSignsDetermined:false,originalHNumericallyEvaluated:false,newLeanKernelProof:false,wholeGPOSComplete:false,m3MayStart:false}};
  if(recordPath)fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({schema:record.schema,graph:certificate.graph,sourceManifestSHA256:manifestBefore.sha256,
    sourceFileCount:manifestBefore.fileCount,executedTestGroupCount:7,elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,pass:true}));
});
