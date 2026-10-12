import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualCovarianceBandAdmissibility,assertActualCovarianceBandAdmissibility,actualCovarianceBandAdmissibilityCertificateFromProgram} from '../actual-covariance-band-admissibility.mjs';
import {attachActualEllOneCovarianceObstruction,assertActualEllOneCovarianceObstruction,actualEllOneCovarianceObstructionCertificateFromProgram} from '../actual-covariance-ell-one-obstruction.mjs';
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
  return {scope:'Literal local import closure of this one actual-source execution, including this runner.',fileCount:seen.size,sha256:digest(canonicalStringify(files)),files};
}
const evidenceDirectory=process.env.MATHSCOPE_OBSTRUCTION_EVIDENCE_DIR,stem=process.env.MATHSCOPE_OBSTRUCTION_RECEIPT_STEM??'actual-covariance-ell-one-obstruction-source';
assert.match(stem,/^[a-z0-9-]+$/);
const recordPath=evidenceDirectory?path.join(path.resolve(evidenceDirectory),stem+'.json'):null;
if(recordPath){fs.mkdirSync(path.dirname(recordPath),{recursive:true});assert.ok(!fs.existsSync(recordPath),'An existing receipt must never be overwritten.');}
const started=performance.now(),manifestBefore=sourceManifest(),sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),executed=[];
const sourceTest=(name,fn)=>test(name,async()=>{await fn();executed.push({id:name,pass:true});});
let band,p,bandBefore;
try{
  band=prepareActualCovarianceBandAdmissibility({ellExact:'1'});
  bandBefore=await actualCovarianceBandAdmissibilityCertificateFromProgram(band);
  p=attachActualEllOneCovarianceObstruction(band);
}catch(error){
  const failed={schema:'MathScope.ActualEllOneCovarianceObstructionSourceFailure/1',generatedAt:new Date().toISOString(),sourceCommit,sourceManifest:manifestBefore,
    sourceManifestUnchangedAfterRun:canonicalStringify(sourceManifest())===canonicalStringify(manifestBefore),
    failure:{code:error.code??null,message:error.message,stack:error.stack},elapsedMs:performance.now()-started,peakRSSBytes:process.resourceUsage().maxRSS*1024,
    actualCertificateIssued:false,pass:false,negativeControl:false};
  if(recordPath)fs.writeFileSync(recordPath,JSON.stringify(failed,null,2)+'\n',{flag:'wx'});
  throw error;
}

sourceTest('private band threshold and exact leading reduction survive all witness appends',async()=>{
  assert.equal(assertActualCovarianceBandAdmissibility(band),true);
  assert.deepEqual(await actualCovarianceBandAdmissibilityCertificateFromProgram(band),bandBefore);
  assert.equal(band.decision.uniformTheoremNonmembershipProved,true);assert.equal(band.decision.completedFGExactlyLeadingOnFiniteBands,true);
  assert.equal(band.decision.actualDeterminantSign,'UNKNOWN');assert.deepEqual(band.decision.actualWeightSigns,['UNKNOWN','UNKNOWN']);
});

sourceTest('the updated band seal rejects replacement nodes and added program metadata',()=>{
  const original=band.program.nodes;band.program.nodes=original.slice();
  assert.throws(()=>assertActualCovarianceBandAdmissibility(band),{code:'INVALID_SOURCE_CONSTRUCTION'});band.program.nodes=original;
  band.program.unapprovedComplete=true;assert.throws(()=>assertActualCovarianceBandAdmissibility(band),{code:'INVALID_SOURCE_CONSTRUCTION'});delete band.program.unapprovedComplete;
  assert.equal(assertActualCovarianceBandAdmissibility(band),true);
});

sourceTest('the actual terminal schedule heat target and both family roots are matched',()=>{
  assert.equal(assertActualEllOneCovarianceObstruction(p),true);assert.ok(p.checks.every(row=>row.pass));
  assert.equal(p.checks.filter(row=>row.id.startsWith('literal-stage-')).length,12);
  assert.equal(p.checks.filter(row=>row.id.startsWith('literal-A13-')).length,3);
  assert.equal(p.checks.filter(row=>row.id.startsWith('actual-Htheta-sign-integrand-')).length,2);
});

sourceTest('the exact witness retains a positive h and full nonzero heat argument',()=>{
  const G=p.G,q=(n,d=1)=>G.q(n,d);
  assert.equal(p.roots.h,G.parameter('h'));assert.notEqual(p.roots.heatArgument,G.zero);
  assert.equal(p.roots.witnessX,G.mul(p.roots.originalXb,G.exp(q(-1,4))));
  assert.equal(p.roots.witnessR,G.sqrt(G.mul(q(2),p.roots.witnessX)));
  assert.equal(p.roots.witnessEta,G.zero);assert.equal(p.roots.witnessS,G.one);
  assert.equal(p.proof.witness.y,'11/4');assert.equal(p.proof.witness.delta,'1/4');
});

sourceTest('actual same-point source function roots remain unevaluated functional expressions',()=>{
  assert.equal(p.roots.actualHthetaAtWitness.length,2);assert.equal(p.roots.actualAphiAtWitness.length,2);
  assert.equal(p.roots.actualFrozenCarriersAtWitness.length,2);
  for(const id of [p.roots.actualCompletedFAtWitness,p.roots.actualLeadingFAtWitness,p.roots.actualTargetThetaAtWitness,...p.roots.actualHthetaAtWitness]){
    assert.ok(Number.isSafeInteger(id)&&p.G.nodes[id]);assert.notEqual(p.G.nodes[id].op,'rational');
    assert.equal(p.G.freeCoordinates(id).size,0,'Every slow and representative coordinate is actually replaced.');
  }
  const pulse=p.operator.coordinates.v;
  for(const matrix of p.roots.actualAphiAtWitness)for(const row of matrix)for(const id of row)
    assert.ok([...p.G.freeCoordinates(id)].every(x=>x===pulse),'Only the actual pulse time may remain free in Aphi.');
  for(const carrier of p.roots.actualFrozenCarriersAtWitness)for(const key of ['p','pz','x0'])assert.equal(p.G.freeCoordinates(carrier[key]).size,0);
  assert.equal(p.decision.rigorousWholeHNumericalEnclosure,false);
});

sourceTest('the conclusion is nonnegative-solution obstruction with determinant signs separated',()=>{
  assert.equal(p.decision.literalEllOneNonnegativeWeightObstruction,true);assert.equal(p.decision.nonnegativeSolutionExists,false);
  assert.deepEqual(p.decision.actualHthetaColumnSigns,['NEGATIVE','NEGATIVE']);assert.equal(p.decision.actualTargetThetaSign,'POSITIVE');
  assert.equal(p.decision.actualDeterminantSign,'UNKNOWN');assert.equal(p.decision.actualDeterminantNonzeroProved,false);
  assert.deepEqual(p.decision.actualIndividualInverseWeightSigns,['UNKNOWN','UNKNOWN']);assert.equal(p.decision.ifInvertibleAtLeastOneWeightNegative,true);
});

sourceTest('original Gamma theorem scope and the user M2 before M3 order remain explicit',()=>{
  assert.equal(p.decision.geometricBoxRepresentativeRuleCompatible,true);assert.equal(p.decision.selectedCertifiedDomainMembership,false);
  assert.equal(p.decision.originalGammaMembershipForEll0AtLeastOne,false);assert.equal(p.decision.unspecifiedOriginalEll0AndQbigEvaluated,false);
  assert.equal(p.decision.originalLargeBandTheoremCounterexample,false);assert.equal(p.decision.wholeGPOSComplete,false);
  assert.equal(p.decision.newLeanKernelProof,false);assert.equal(p.decision.fullPhysicalResidualAndFlatErrorPackageComplete,false);assert.equal(p.decision.m3MayStart,false);
});

sourceTest('the omitted moving-normal pressure term fails the executed algebraic control',()=>{
  assert.equal(p.algebra.pass,true);assert.ok(p.algebra.checks.every(row=>row.pass));
  assert.equal(p.algebra.negativeControl.check.pass,false);assert.equal(p.algebra.negativeControl.correctlyRejected,true);
  assert.ok(p.arithmetic.rows.every(row=>row.pass));
});

sourceTest('copied or promoted obstruction results and altered source nodes are rejected',()=>{
  assert.throws(()=>assertActualEllOneCovarianceObstruction({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  p.decision.originalLargeBandTheoremCounterexample=true;
  assert.throws(()=>assertActualEllOneCovarianceObstruction(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.decision.originalLargeBandTheoremCounterexample=false;
  const root=p.roots.originalEtail,before=p.G.nodes[root];p.G.nodes[root]={op:'rational',args:['1','1']};
  assert.throws(()=>assertActualEllOneCovarianceObstruction(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.G.nodes[root]=before;
  assert.equal(assertActualEllOneCovarianceObstruction(p),true);
});

sourceTest('obstruction program node replacement and metadata promotion are rejected',()=>{
  const nodes=p.program.nodes;p.program.nodes=nodes.slice();assert.throws(()=>assertActualEllOneCovarianceObstruction(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.program.nodes=nodes;
  p.program.provedAllNS=true;assert.throws(()=>assertActualEllOneCovarianceObstruction(p),{code:'INVALID_SOURCE_CONSTRUCTION'});delete p.program.provedAllNS;
  assert.equal(assertActualEllOneCovarianceObstruction(p),true);
});

sourceTest('later independent graph appends preserve both sealed certificates',async()=>{
  const before=await actualEllOneCovarianceObstructionCertificateFromProgram(p),count=p.program.nodes.length;
  p.G.fresh('after_source_obstruction_receipt');
  assert.deepEqual(await actualEllOneCovarianceObstructionCertificateFromProgram(p),before);
  assert.deepEqual(await actualCovarianceBandAdmissibilityCertificateFromProgram(band),bandBefore);
  assert.equal(p.program.nodes.length,count);assert.equal(p.G.nodes.length,count+1);
});

test('receipt retains the actual source import manifest and sealed program hashes',async()=>{
  assert.equal(executed.length,11);const certificate=await actualEllOneCovarianceObstructionCertificateFromProgram(p),manifestAfter=sourceManifest();
  assert.deepEqual(manifestAfter,manifestBefore);
  const record={schema:'MathScope.ActualEllOneCovarianceObstructionSourceTest/1',generatedAt:new Date().toISOString(),sourceCommit,
    command:['node','--max-old-space-size=2048','--test',relative(fileURLToPath(import.meta.url))],mode:'DIRECT_ACTUAL_SOURCE_WRITTEN_ANALYTIC_OBSTRUCTION_AND_EXACT_IDENTITIES',
    runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:manifestBefore,sourceManifestUnchangedAfterRun:true,
    bandCertificate:bandBefore,certificate,executedChecks:[...executed,{id:'receipt retains the actual source import manifest and sealed program hashes',pass:true}],
    executedTestGroupCount:12,elapsedMs:performance.now()-started,peakRSSBytes:process.resourceUsage().maxRSS*1024,pass:true,
    scope:{oneActualEllOneGraphExecuted:true,originalGammaCounterexample:false,sourceBoundWrittenAnalyticObstruction:true,numericalWholeHEnclosure:false,
      determinantSignDetermined:false,individualInverseSignsDetermined:false,updatedBandProgramSealExecuted:true,all128GraphsExecuted:false,wholeGPOSComplete:false,m3MayStart:false}};
  if(recordPath)fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({schema:record.schema,graph:certificate.graph,sourceManifestSHA256:manifestBefore.sha256,sourceFileCount:manifestBefore.fileCount,
    executedTestGroupCount:12,elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,pass:true}));
});
