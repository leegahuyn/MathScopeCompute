import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualAdmissibleTerminalCovariance,assertActualAdmissibleTerminalCovariance,actualAdmissibleTerminalCovarianceCertificateFromProgram} from '../actual-admissible-terminal-covariance.mjs';
import {assertActualCovarianceOperator} from '../actual-covariance-source-operator.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=file=>path.relative(repository,file).split(path.sep).join('/'),digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function sourceManifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];
  while(pending.length){
    const file=pending.pop();if(seen.has(file))continue;
    const bytes=fs.readFileSync(file),body=bytes.toString('utf8');seen.set(file,digest(bytes));
    const imports=[...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
    for(const m of imports)if(m[1].startsWith('.'))pending.push(path.resolve(path.dirname(file),m[1]));
  }
  const files=Object.fromEntries([...seen].map(([file,sha256])=>[relative(file),sha256]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Literal local import closure of this direct actual-source run, including this exact runner.',fileCount:seen.size,sha256:digest(canonicalStringify(files)),files};
}
const evidenceDirectory=process.env.MATHSCOPE_ADMISSIBLE_COVARIANCE_EVIDENCE_DIR,stem=process.env.MATHSCOPE_ADMISSIBLE_COVARIANCE_RECEIPT_STEM??'actual-admissible-terminal-covariance-source';
assert.match(stem,/^[a-z0-9-]+$/);const recordPath=evidenceDirectory?path.join(path.resolve(evidenceDirectory),stem+'.json'):null;
if(recordPath){fs.mkdirSync(path.dirname(recordPath),{recursive:true});assert.ok(!fs.existsSync(recordPath),'An existing receipt must never be overwritten.');}
const started=performance.now(),manifestBefore=sourceManifest(),sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),executed=[];
const sourceTest=(name,fn)=>test(name,async()=>{await fn();executed.push({id:name,pass:true});});let p;
try{p=prepareActualAdmissibleTerminalCovariance();}
catch(error){
  const failure={schema:'MathScope.ActualAdmissibleTerminalCovarianceSourceFailure/1',generatedAt:new Date().toISOString(),sourceCommit,sourceManifest:manifestBefore,
    sourceManifestUnchangedAfterRun:canonicalStringify(sourceManifest())===canonicalStringify(manifestBefore),failure:{code:error.code??null,message:error.message,stack:error.stack},
    elapsedMs:performance.now()-started,peakRSSBytes:process.resourceUsage().maxRSS*1024,actualCertificateIssued:false,pass:false,negativeControl:false};
  if(recordPath)fs.writeFileSync(recordPath,JSON.stringify(failure,null,2)+'\n',{flag:'wx'});throw error;
}

sourceTest('the copied new small-q source leaves the private original operator unchanged',()=>{
  assert.equal(assertActualAdmissibleTerminalCovariance(p),true);assert.equal(assertActualCovarianceOperator(p.operator),true);
  assert.notEqual(p.G,p.operator.G);assert.equal(p.operator.program.band.ellExact,'1');assert.ok(p.checks.every(x=>x.pass));
  assert.equal(p.families.length,2);assert.ok(p.families.every(f=>f.system>=p.operator.G.covarianceSystems.length));
});

sourceTest('all-order zero exterior is tied to actual first-order and later completed moment branches',()=>{
  assert.equal(p.support.pass,true);assert.equal(p.support.allPositiveOrdersCertifiedByCommonSupport,true);assert.equal(p.support.finitePrefixExtrapolated,false);
  assert.deepEqual(p.support.observedOrders.map(x=>x.order),[1,2,3]);
  assert.ok(p.support.observedOrders.every(x=>x.exterior.pass&&x.moments.every(Boolean)));
  assert.equal(p.support.universalGrammar.pass,true);assert.ok(p.support.universalGrammar.negativeControls.every(x=>x.correctlyRejected));
  assert.equal(p.support.allActiveCutoffsClaimedOff,false);
});

sourceTest('the selected exact band is threshold plus eight and its entire physical band is below qstar',()=>{
  const G=p.G,q=(n,d=1)=>G.q(n,d),g=p.geometry;
  assert.equal(g.ell,G.add(p.selection.ellMinimum,q(8)));assert.equal(g.S,G.pow(g.ell,2));
  assert.equal(g.Q,G.exp(G.neg(G.mul(g.ell,G.log(q(2))))));assert.notEqual(g.ell,p.operator.geometry.ell);
  assert.equal(p.selection.physicalBandQStarRatioUpper,q(1,8));
  assert.equal(p.decision.selectedSourceCovarianceDomainMember,true);assert.equal(p.decision.wholeSelectedPhysicalBandBelowSourceQStar,true);
  assert.equal(G.freeCoordinates(g.Q).size,0);assert.equal(p.selection.selectedIntegerMaterialized,false);
});

sourceTest('new pulse matrices retain the actual moving pressure basis carrier and covariance integrands',()=>{
  for(const f of p.families){
    const s=p.G.covarianceSystems[f.system];assert.deepEqual(s.matrix,f.frame.wMatrix);assert.deepEqual(s.initial,[p.G.one,p.G.zero]);
    assert.equal(s.length,p.geometry.Ls);assert.equal(s.normUpper,p.constants.matrixNorm);
    assert.notDeepEqual(f.frame.BPrime,[[p.G.zero,p.G.zero],[p.G.zero,p.G.zero],[p.G.zero,p.G.zero]]);
    assert.equal(p.G.nodes[f.covariance.theta].op,'multiply');assert.equal(f.initial.finitePartialSumUsed,false);
  }
});

sourceTest('actual full leading stress and shear stay connected to the exact inverse',()=>{
  assert.equal(p.target.raw.F,p.operator.background.prepared.records[0].global.F);
  assert.equal(p.target.raw.M,p.operator.background.prepared.bootstrap.finalM);
  assert.equal(p.target.raw.terms.thetaShear,p.G.mul(p.G.q(2),p.target.raw.coordinates.X,p.G.derivative(p.target.raw.F,p.target.raw.coordinates.X)));
  assert.ok(p.target.inverseChecks.every(x=>x.pass));assert.equal(p.target.weights.length,2);assert.equal(p.target.squareRootWeights.length,2);
});

sourceTest('the terminal same-point witness actually substitutes every free chart and representative coordinate',()=>{
  const G=p.G,w=p.roots.witness;
  assert.equal(w.X,G.mul(p.roots.terminalXb,G.exp(G.q(-1,4))));assert.equal(w.X,w.Xrep);
  for(const root of [...w.H.flat(),w.determinant,...w.weights,...w.squareRootWeights,...w.target,w.massLower,w.absoluteDeterminantLower,w.weightLowerWithoutH,w.weightUpperWithoutH])
    assert.equal(G.freeCoordinates(root).size,0);
  assert.equal(w.q,p.geometry.Q);assert.equal(p.constants.h,G.parameter('h'));
  assert.equal(p.decision.rigorousWholeHNumericalEnclosure,false);
});

sourceTest('determinant weight and square-root lower bounds have the correct exact orientation and factors',()=>{
  const G=p.G,q=(n,d=1)=>G.q(n,d),b=p.quantitative,c=p.constants;
  assert.equal(b.normalizedDeterminantLower,q(15,8));assert.equal(b.normalizedDeterminantUpper,q(17,8));
  assert.equal(b.normalizedWeightLower,G.div(c.kappa,q(64)));assert.equal(b.normalizedWeightUpper,q(2));
  assert.equal(b.uniformAbsoluteDeterminantLower,G.mul(q(15,8),b.Ac,c.u,G.pow(b.massLower,2)));
  assert.equal(b.signedDeterminantUpper,G.neg(b.absoluteDeterminantLower));
  assert.equal(b.weightLowerWithoutH,G.div(G.mul(c.kappa,p.target.targetScale),G.mul(q(64),b.massUpper)));
  assert.equal(b.squareRootWeightLowerWithoutH,G.sqrt(b.weightLowerWithoutH));
  assert.equal(p.decision.actualDeterminantSign,'NEGATIVE');assert.deepEqual(p.decision.actualInverseWeightSigns,['POSITIVE','POSITIVE']);
});

sourceTest('a changed actual inverse weight is rejected by an exact nonzero identity control',()=>{
  const G=p.G,wrong=p.target.Hy.map((x,i)=>G.add(x,G.mul(p.target.H[i][0],G.one))),
    controls=wrong.map((x,i)=>sourceGraphRationalIdentity(G,G.sub(x,p.target.components[i]),{atomicNodes:[...p.target.H.flat(),...p.target.components]}));
  assert.ok(controls.every(x=>!x.pass));
});

sourceTest('the result retains terminal open-domain restrictions and unknown original Gamma',()=>{
  assert.equal(p.decision.actualPositiveWeightsOnDeclaredTerminalDomain,true);assert.equal(p.decision.actualSmoothPositiveSquareRootWeightsOnOpenFixedLabelDomain,true);
  assert.equal(p.decision.unknownPaperGammaMembership,'NOT_EVALUATED');assert.equal(p.decision.arbitraryOriginalQbigAndEll0Evaluated,false);
  for(const key of ['allSourceBoxesCovered','flatEndpointExtensionCertifiedHere','wholeGPOSComplete','fullPhysicalResidualAndFlatErrorPackageComplete','newLeanKernelProof','m3MayStart'])assert.equal(p.decision[key],false);
});

sourceTest('copied certificates and promoted domain conclusions fail the private seal',()=>{
  assert.throws(()=>assertActualAdmissibleTerminalCovariance({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  p.decision.wholeGPOSComplete=true;assert.throws(()=>assertActualAdmissibleTerminalCovariance(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.decision.wholeGPOSComplete=false;
  const row=p.support.checks[0].pass;p.support.checks[0].pass=false;assert.throws(()=>assertActualAdmissibleTerminalCovariance(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.support.checks[0].pass=row;
  assert.equal(assertActualAdmissibleTerminalCovariance(p),true);
});

sourceTest('source nodes and new Volterra coefficient mutation fail authentication',()=>{
  const root=p.geometry.ell,old=p.G.nodes[root];p.G.nodes[root]={op:'rational',args:['1','1']};
  assert.throws(()=>assertActualAdmissibleTerminalCovariance(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.G.nodes[root]=old;
  const s=p.G.covarianceSystems[p.families[0].system],a=s.matrix[0][0];s.matrix[0][0]=p.G.zero;
  assert.throws(()=>assertActualAdmissibleTerminalCovariance(p),{code:'INVALID_SOURCE_CONSTRUCTION'});s.matrix[0][0]=a;
  assert.equal(assertActualAdmissibleTerminalCovariance(p),true);
});

sourceTest('program metadata node-array replacement and later appends are handled by a fixed compiler seal',async()=>{
  const nodes=p.program.nodes;p.program.nodes=nodes.slice();assert.throws(()=>assertActualAdmissibleTerminalCovariance(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.program.nodes=nodes;
  p.program.globalNSComplete=true;assert.throws(()=>assertActualAdmissibleTerminalCovariance(p),{code:'INVALID_SOURCE_CONSTRUCTION'});delete p.program.globalNSComplete;
  const before=await actualAdmissibleTerminalCovarianceCertificateFromProgram(p),count=p.program.nodes.length;p.G.fresh('later_independent_selected_band_append');
  assert.deepEqual(await actualAdmissibleTerminalCovarianceCertificateFromProgram(p),before);assert.equal(p.program.nodes.length,count);assert.ok(p.G.nodes.length>count);
});

test('receipt binds the actual selected source graph and unchanged local import closure',async()=>{
  assert.equal(executed.length,12);const certificate=await actualAdmissibleTerminalCovarianceCertificateFromProgram(p),manifestAfter=sourceManifest();assert.deepEqual(manifestAfter,manifestBefore);
  const record={schema:'MathScope.ActualAdmissibleTerminalCovarianceSourceTest/1',generatedAt:new Date().toISOString(),sourceCommit,
    command:['node','--max-old-space-size=2048','--test',relative(fileURLToPath(import.meta.url))],mode:'DIRECT_ACTUAL_SMALL_Q_TERMINAL_SOURCE_AND_WRITTEN_ANALYTIC_POSITIVITY',
    runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:manifestBefore,sourceManifestUnchangedAfterRun:true,
    certificate,executedChecks:[...executed,{id:'receipt binds the actual selected source graph and unchanged local import closure',pass:true}],executedTestGroupCount:13,
    elapsedMs:performance.now()-started,peakRSSBytes:process.resourceUsage().maxRSS*1024,pass:true,
    scope:{actualNewSmallQTerminalFamilyExecuted:true,originalSourceEllOnePulsePromoted:false,actualWrittenAnalyticTerminalDeterminantAndWeights:true,
      originalUnknownGammaMembershipEvaluated:false,numericalWholeHEnclosure:false,allSourceBoxesCovered:false,flatEndpointsCovered:false,newAnalyticLeanProof:false,wholeGPOSComplete:false,m3MayStart:false}};
  if(recordPath)fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({schema:record.schema,graph:certificate.graph,sourceManifestSHA256:manifestBefore.sha256,sourceFileCount:manifestBefore.fileCount,executedTestGroupCount:13,elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,pass:true}));
});
