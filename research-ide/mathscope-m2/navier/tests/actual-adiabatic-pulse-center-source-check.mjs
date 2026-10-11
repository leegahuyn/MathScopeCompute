// Reserve the one shared heavy-source slot before executing this runner.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualAdiabaticPulseCenterEnclosure,attachActualAdiabaticPulseCenterEnclosure,assertActualAdiabaticPulseCenterEnclosure,actualAdiabaticPulseCenterEnclosureCertificateFromProgram} from '../actual-adiabatic-pulse-center-enclosure.mjs';
import {assertActualCenteredPulseEnclosure,actualCenteredPulseEnclosureCertificateFromProgram} from '../actual-centered-pulse-enclosure.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';
import {readRational,rational as Q,qcompare,qsub} from '../actual-continuation-arithmetic.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

assert.ok(process.argv.length<=4);
const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=f=>path.relative(repository,f).split(path.sep).join('/'),digest=x=>createHash('sha256').update(x).digest('hex'),
  directory=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../research/evidence/adiabatic-pulse-center-20261011/',import.meta.url)),stem=process.argv[3]??'actual-adiabatic-pulse-center-source';
assert.match(stem,/^[a-z0-9-]+$/);fs.mkdirSync(directory,{recursive:true});
const recordPath=path.join(directory,stem+'.json'),logPath=path.join(directory,stem+'.log');assert.ok(!fs.existsSync(recordPath)&&!fs.existsSync(logPath),'Never overwrite an earlier actual-source attempt.');
function manifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];while(pending.length){const f=pending.pop();if(seen.has(f))continue;const bytes=fs.readFileSync(f),body=bytes.toString('utf8');seen.set(f,digest(bytes));
    for(const m of [...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)])if(m[1].startsWith('.'))pending.push(path.resolve(path.dirname(f),m[1]));}
  const files=Object.fromEntries([...seen].map(([f,h])=>[relative(f),h]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Literal local import closure of the actual absolute-center source runner including itself.',fileCount:seen.size,files,sha256:digest(canonicalStringify(files))};
}
const input={sourceProfile:SOURCE_PROFILE_ID,precisionBits:192,tolerance:'1/1000000000000',centerTolerance:'1/10000000000000000000000000000000000000000',maxCutoffCells:4096},
  started=performance.now(),deadline=started+170000,record={schema:'MathScope.ActualAdiabaticPulseCenterSourceCheck/1',generatedAt:new Date().toISOString(),
    sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),command:[process.execPath,...process.execArgv,relative(fileURLToPath(import.meta.url)),...process.argv.slice(2)],
    input,inputSHA256:digest(canonicalStringify(input)),mode:'DIRECT_ORIGINAL_FULL_VOL_TERRA_ABSOLUTE_CENTER_AND_SCALED_H_INVERSE',
    runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:manifest(),checks:[],progress:[]};
const log=value=>{const line=JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);},check=async(id,fn)=>{await fn();record.checks.push({id,pass:true});log({event:'CHECK',id,pass:true});},
  context={checkCancelled:()=>{if(performance.now()>deadline)throw Object.assign(Error('The single actual absolute-center source exceeded170seconds.'),{code:'RESOURCE_LIMIT'});},
    onProgress:step=>{global.gc?.();const row={...step,elapsedMs:performance.now()-started,rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed};record.progress.push(row);log({event:'PROGRESS',...row});}};
log({event:'START',inputSHA256:record.inputSHA256,sourceManifestSHA256:record.sourceManifest.sha256,sourceFiles:record.sourceManifest.fileCount});
try{
  const p=prepareActualAdiabaticPulseCenterEnclosure(input,context),{G}=p,centered=p.centered,selected=centered.selected,q=(n,d=1)=>G.q(n,d),
    original=await actualCenteredPulseEnclosureCertificateFromProgram(centered);
  await check('same-private-full-centered-program-and-original-source-graph',()=>{
    assert.equal(assertActualAdiabaticPulseCenterEnclosure(p),true);assert.equal(assertActualCenteredPulseEnclosure(centered),true);
    assert.equal(original.graph.sha256,'bfd72c11e7e2e854183de2a30294b9f6e93c1b956d7045a76c43c6e7a48e3f75');assert.equal(original.graph.nodeCount,245828);
    assert.equal(original.graph.originalSourceGraph.sha256,'8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a');
    assert.equal(p.sourceBinding.parameterExpressionSHA256,sourceExponentContract().parameterExpressionSHA256);assert.ok(p.checks.every(x=>x.pass));
  });
  await check('positive-original-h-epsilon-and-huge-band-supply-the-strong-frequency-bound',()=>{
    assert.ok(p.sourceBounds.checks.every(x=>x.pass));assert.equal(p.sourceBounds.exactFrequency.lower,'k>S^8');
    assert.equal(p.roots.u,selected.constants.u);assert.equal(p.sourceBinding.selectedEll,selected.geometry.ell);assert.equal(selected.geometry.k,G.ceiling(G.inv(G.sqrt(selected.geometry.epsilon))));
    assert.equal(p.sourceBounds.roots.h,G.parameter('h'));assert.equal(p.scope.hNumericallyReplacedByZero,false);assert.equal(p.scope.roundedCarrierReplacedByUnrounded,false);
  });
  await check('actual-terminal-heat-chart-axial-moments-and-Rayleigh-relations-are-bound',()=>{
    assert.ok(p.midplane.checks.every(x=>x.pass));assert.equal(p.midplane.roots.argumentEtaAtZero,G.zero);
    assert.equal(p.midplane.lambdaCheck.pass,true);assert.equal(p.midplane.c0Check.pass,true);
    assert.equal(p.midplane.actualSourceExpressionsReplacedByNumericalZero,false);assert.equal(p.midplane.sourceZeroIdentitiesRestrictedToOpenTerminalMidplane,true);
    assert.equal(p.midplane.roots.F,p.midplane.roots.F0);assert.equal(p.midplane.roots.FR,p.midplane.roots.FR0);
  });
  await check('each-original-matrix-entry-is-bound-before-and-after-the-symbolic-midplane-reduction',()=>{
    for(const [i,r]of p.rows.entries()){
      assert.equal(r.system,selected.families[i].system);assert.ok(r.copiedChecks.every(c=>c.pass));assert.ok(r.formalBodyBinding.rewriteChecks.every(c=>c.pass));
      assert.equal(r.formalBodyBinding.normalSquareIdentity.pass,true);assert.equal(r.formalBodyBinding.actualBodyUnchanged,true);assert.equal(r.formalBodyBinding.formalCarrierIsExactNormalizedRoundedCarrier,true);
      assert.equal(r.phaseR.pass,true);assert.equal(r.phaseZ.pass,true);assert.notEqual(r.primitives.deltaB,G.zero);assert.notEqual(r.roots.dampDifference,G.zero);
      assert.equal(r.branchNormalization.pass,true);assert.equal(r.branchNormalization.existingNodesModified,false);assert.equal(r.branchNormalization.approximateOrDomainBasedZeroUsed,false);
      assert.ok(r.branchNormalization.collapses.length>0);assert.ok(r.branchNormalization.collapses.every(c=>c.normalizedBranches.every(x=>x===c.result)));
      assert.equal(r.formalBodyBinding.wholeSourceOperandsRewrittenSimultaneously,true);
      assert.equal(r.roots.roundedInteger,G.simultaneousSubstitute(selected.families[i].carrier.roundedInteger,
        ['R','Z','T','Xrep','etaRep','sRep'].map(n=>selected.coordinates[n]),[selected.roots.witness.R,G.zero,G.one,selected.roots.witness.X,G.zero,G.one]));
    }
  });
  await check('the-complete-moving-pressure-basis-and-both-sign-transport-identities-pass',()=>{
    assert.equal(p.algebra.diagonal.checks.length,5);assert.ok(p.algebra.diagonal.checks.every(c=>c.pass));assert.ok(p.algebra.diagonal.negativeControls.every(c=>c.correctlyRejected&&!c.check.pass));
    assert.ok(p.algebra.transport.rows.every(r=>r.check.pass&&r.negativeControl.correctlyRejected));assert.equal(p.algebra.transport.exactAntiderivative,true);
  });
  await check('the-enclosed-centers-are-the-original-full-coupled-limits-with-unit-initial-data',()=>{
    for(const [i,r]of p.rows.entries()){
      assert.equal(r.actualCenter,centered.rows[i].center.positiveUncomputedAmplitude);assert.notEqual(r.actualCenter,G.one);assert.notEqual(r.actualCenter,G.zero);
      assert.equal(G.nodes[r.actualCenter].op,'actual_covariance_volterra');assert.deepEqual(G.covarianceSystems[r.system].initial,[G.one,G.zero]);
      assert.deepEqual(G.covarianceSystems[r.system].matrix,selected.families[i].frame.wMatrix);assert.notEqual(r.actualCenter,p.roots.exactReferenceCenter);
    }
    assert.equal(p.numerics.center.fullCoupledSolutionConditionalOnSourcePremises,true);assert.equal(p.sourceBinding.actualMatrixNotReplacedByComparison,true);
  });
  await check('all-positive-remainders-and-directed-absolute-center-widths-are-exercised',()=>{
    for(const name of ['diagonalLogUpper','couplingLogUpper','halfLogUpper','referenceCorrectionUpper','absoluteCenterRadius'])assert.ok(qcompare(readRational(p.numerics.center.errorAudit.parameters[name],200000),Q(0))>0);
    assert.equal(p.numerics.center.errorBudget.nonzeroSubUlpRemainderRoundedUp,true);assert.equal(p.numerics.center.arithmetic.binary64UsedForDecisions,false);
    for(const r of p.numerics.rows){assert.equal(r.toleranceMet,true);assert.ok(qcompare(qsub(readRational(r.interval.upper),readRational(r.interval.lower)),readRational(r.tolerance))<=0);}
    for(const box of p.numerics.values.absoluteCenter){assert.ok(qcompare(readRational(box.lower),Q(3535533905932737n,10000000000000000n))>0);assert.ok(qcompare(readRational(box.upper),Q(3535533905932739n,10000000000000000n))<0);}
  });
  await check('actual-H-mass-inverse-and-radial-center-use-the-new-nontrivial-centers',()=>{
    assert.equal(p.rescalingChecks.length,8);assert.ok(p.rescalingChecks.every(c=>c.pass));
    for(const box of p.numerics.values.massWithoutUnknownCenter){assert.ok(qcompare(readRational(box.lower),Q(251,1000))>0);assert.ok(qcompare(readRational(box.upper),Q(253,1000))<0);}
    for(const box of p.numerics.values.inverseWeightWithoutUnknownCenter){assert.ok(qcompare(readRational(box.lower),Q(1984,1000))>0);assert.ok(qcompare(readRational(box.upper),Q(1985,1000))<0);}
    assert.ok(qcompare(readRational(p.numerics.values.covarianceZWithoutUnknownCenter[0].lower),Q(0))>0);assert.ok(qcompare(readRational(p.numerics.values.covarianceZWithoutUnknownCenter[1].upper),Q(0))<0);
    assert.deepEqual(p.roots.absoluteRadialCenter,centered.rows.map(r=>r.center.t[0]));assert.equal(p.numerics.normalization.centerFactorsNowNumericallyEnclosed,true);
  });
  await check('remaining-H-target-scales-derivatives-curl-and-global-scope-stay-open',()=>{
    for(const k of ['actualOriginalFullPulseCentersNumericallyEnclosed','actualOriginalRadialCenterAmplitudeEnclosed','actualHMassInverseCoefficientsWithoutUnknownCenterEnclosed'])assert.equal(p.scope[k],true);
    for(const k of ['remainingTargetAndGeometryScalesNumericallyEvaluated','absoluteHHighRelativePrecision','absoluteInverseWeightHighRelativePrecision','slowOrMixedPulseDerivativeValuesNumericallyEnclosed','fastPulseDerivativeValuesNumericallyEnclosed','actualFullCurlNumericalEnclosure','wholePulseTimeDomainNumericallyEnclosed','allSourceLabelsCovered','globalPhysicalResidual','wholeGNUMComplete','newLeanKernelProof','workerExecution','browserExecution','m3MayStart'])assert.equal(p.scope[k],false);
    assert.equal(centered.scope.originalCenterAmplitudesNumericallyEvaluated,false);assert.equal(p.roots.massScale,centered.roots.massScale);assert.equal(p.roots.tau,centered.roots.tau);
  });
  await check('forged-programs-mutated-centers-omitted-source-matrix-and-edited-intervals-are-rejected',()=>{
    assert.throws(()=>attachActualAdiabaticPulseCenterEnclosure({...centered}),{code:'INVALID_SOURCE_CONSTRUCTION'});assert.throws(()=>assertActualAdiabaticPulseCenterEnclosure({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    const a=p.roots.originalCenters[0];try{p.roots.originalCenters[0]=G.one;assert.throws(()=>assertActualAdiabaticPulseCenterEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.roots.originalCenters[0]=a;}
    const lo=p.numerics.values.absoluteCenter[0].lower;try{p.numerics.values.absoluteCenter[0].lower='1';assert.throws(()=>assertActualAdiabaticPulseCenterEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.numerics.values.absoluteCenter[0].lower=lo;}
    const matrix=G.covarianceSystems[p.rows[0].system].matrix,m=matrix[0][1];try{matrix[0][1]=G.zero;assert.throws(()=>assertActualAdiabaticPulseCenterEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{matrix[0][1]=m;}
    const pass=p.rescalingChecks[0].pass;try{p.rescalingChecks[0].pass=false;assert.throws(()=>assertActualAdiabaticPulseCenterEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.rescalingChecks[0].pass=pass;}
    assert.equal(assertActualAdiabaticPulseCenterEnclosure(p),true);
  });
  await check('later-append-does-not-change-the-original-or-absolute-center-certificate',async()=>{
    const before=await actualAdiabaticPulseCenterEnclosureCertificateFromProgram(p);G.fresh('after_absolute_center_prefix');assert.deepEqual(await actualAdiabaticPulseCenterEnclosureCertificateFromProgram(p),before);
    assert.deepEqual(await actualCenteredPulseEnclosureCertificateFromProgram(centered),original);
  });
  await check('literal-import-closure-remains-unchanged',()=>assert.deepEqual(manifest(),record.sourceManifest));
  record.certificate=await actualAdiabaticPulseCenterEnclosureCertificateFromProgram(p);record.originalCenteredSourceGraph=original.graph;record.scope=p.scope;record.sourceManifestUnchangedAfterRun=true;
  record.pass=true;record.status='EXECUTED_VERIFIED_SCOPED';record.exitCode=0;
}catch(error){record.pass=false;record.status='FAILED';record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack,...(error.details?{details:error.details}:{})};process.exitCode=1;}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',pass:record.pass,exitCode:record.exitCode,checks:record.checks,graph:record.certificate?.graph?{sha256:record.certificate.graph.sha256,nodeCount:record.certificate.graph.nodeCount,canonicalBytes:record.certificate.graph.canonicalBytes}:null,
  elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
