// Reserve the one shared actual-source slot before executing this file.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualCenteredSlowJetEnclosure,attachActualCenteredSlowJetEnclosure,assertActualCenteredSlowJetEnclosure,actualCenteredSlowJetEnclosureCertificateFromProgram} from '../actual-centered-slow-jet-enclosure.mjs';
import {assertActualCenteredPulseEnclosure,actualCenteredPulseEnclosureCertificateFromProgram} from '../actual-centered-pulse-enclosure.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';
import {readRational,rational as Q,qcompare,qsub} from '../actual-continuation-arithmetic.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

assert.ok(process.argv.length<=4);
const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=f=>path.relative(repository,f).split(path.sep).join('/'),digest=x=>createHash('sha256').update(x).digest('hex'),
  directory=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../research/evidence/centered-slow-jets-20261011/',import.meta.url)),stem=process.argv[3]??'actual-centered-slow-jet-source';
assert.match(stem,/^[a-z0-9-]+$/);fs.mkdirSync(directory,{recursive:true});
const recordPath=path.join(directory,stem+'.json'),logPath=path.join(directory,stem+'.log');assert.ok(!fs.existsSync(recordPath)&&!fs.existsSync(logPath),'Never overwrite an earlier actual-source attempt.');
function manifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];while(pending.length){const f=pending.pop();if(seen.has(f))continue;const bytes=fs.readFileSync(f),body=bytes.toString('utf8');seen.set(f,digest(bytes));
    for(const m of [...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)])if(m[1].startsWith('.'))pending.push(path.resolve(path.dirname(f),m[1]));}
  const files=Object.fromEntries([...seen].map(([f,h])=>[relative(f),h]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Literal local import closure of the actual original centered slow-jet runner including itself.',fileCount:seen.size,files,sha256:digest(canonicalStringify(files))};
}
const input={sourceProfile:SOURCE_PROFILE_ID,precisionBits:192,tolerance:'1/1000000000000',maxCutoffCells:4096},
  started=performance.now(),deadline=started+300000,record={schema:'MathScope.ActualCenteredSlowJetSourceCheck/1',generatedAt:new Date().toISOString(),
    sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),command:[process.execPath,...process.execArgv,relative(fileURLToPath(import.meta.url)),...process.argv.slice(2)],
    input,inputSHA256:digest(canonicalStringify(input)),mode:'DIRECT_ORIGINAL_FULL_VOL_TERRA_H_INVERSE_SQRT_WEIGHTED_RADIAL_SLOW_JETS',
    runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:manifest(),checks:[],progress:[]};
const log=value=>{const line=JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);},check=async(id,fn)=>{await fn();record.checks.push({id,pass:true});log({event:'CHECK',id,pass:true});},
  context={checkCancelled:()=>{if(performance.now()>deadline)throw Object.assign(Error('The single actual centered slow-jet constructor exceeded300seconds.'),{code:'RESOURCE_LIMIT'});},
    onProgress:step=>{global.gc?.();const row={...step,elapsedMs:performance.now()-started,rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed};record.progress.push(row);log({event:'PROGRESS',...row});}};
log({event:'START',inputSHA256:record.inputSHA256,sourceManifestSHA256:record.sourceManifest.sha256,sourceFiles:record.sourceManifest.fileCount});
try{
  const p=prepareActualCenteredSlowJetEnclosure(input,context),{G}=p,centered=p.centered,source=centered.selected,original=await actualCenteredPulseEnclosureCertificateFromProgram(centered);
  await check('same-private-original-small-q-source-and-positive-parameter-profile',()=>{
    assert.equal(assertActualCenteredSlowJetEnclosure(p),true);assert.equal(assertActualCenteredPulseEnclosure(centered),true);
    assert.equal(original.graph.originalSourceGraph.sha256,'8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a');
    assert.equal(p.sourceBinding.parameterExpressionSHA256,sourceExponentContract().parameterExpressionSHA256);assert.equal(p.sourceBinding.selectedEll,source.geometry.ell);
    assert.equal(p.sourceBinding.originalPositiveHAndEpsilonRetained,true);assert.ok(p.checks.every(c=>c.pass));
  });
  await check('complete-original-Gamma-terminal-scale-chart-and-schedule-bind-before-derivatives',()=>{
    assert.ok(p.heatField.checks.every(c=>c.pass));assert.equal(p.heatField.schedule.rows.length,15);assert.ok(p.heatField.schedule.rows.every(c=>c.pass));
    assert.equal(p.heatField.originalRayleighChecks.withRetainedNormal.pass,true);assert.equal(p.heatField.actualHeatOrMatrixReplacedByComparison,false);
    assert.equal(p.heatField.roots.originalHeatLoss,source.operator.background.prepared.bootstrap.actualHeat.heat.heatLoss);
    assert.equal(p.heatField.roots.originalGamma,source.operator.background.prepared.bootstrap.actualHeat.heat.gamma);
    for(const root of Object.values(p.heatField.roots.normalizedMoments))assert.equal(G.freeCoordinates(root).size,0);
    assert.ok(p.heatField.audits.field.negativeControls.every(c=>c.correctlyRejected));
  });
  await check('every-power-premise-retains-actual-fields-pressure-target-and-frozen-rounding',()=>{
    assert.ok(p.sourceBounds.checks.every(c=>c.pass));assert.equal(p.sourceBounds.fieldAudit.order,5);assert.equal(p.sourceBounds.matrixAudit.computedMaximumPower,3313);
    assert.equal(p.sourceBounds.targetAudit.maximumPower,248);assert.ok(p.sourceBounds.profileTargetJets.every(j=>j.roots.length===6));
    assert.ok(p.sourceBounds.frozenDerivativeChecks.every(c=>c.derivatives.every(x=>x===G.zero)));
    assert.equal(p.algebra.error.riccati.entireTimeInterval,true);assert.equal(p.algebra.error.riccati.centeredExpansionRestrictedToGaussianCore,false);
    assert.ok(p.algebra.slopes.negativeControls.every(c=>c.correctlyRejected));
  });
  await check('both20-component-systems-alias-the-unchanged-full-original-pulse-with40-FTC-bodies-each',()=>{
    for(const [i,r]of p.pulses.entries()){
      assert.equal(r.variation.originalSystem,source.families[i].system);assert.equal(r.variation.dimension,20);assert.equal(r.variation.norms.length,10);
      assert.equal(r.variation.norms.flatMap(n=>n.entries.flat()).length,40);assert.ok(r.variation.norms.every(n=>n.entries.flat().every(e=>e.actualBodyBinding&&e.actualTimeDerivativeBinding)));
      assert.deepEqual(G.covarianceSystems[r.variation.originalSystem].matrix,source.families[i].frame.wMatrix);
      assert.deepEqual(G.pulseJetSystems[r.variation.system].initial,[G.one,G.zero]);assert.equal(G.pulseJetAliases.get(r.variation.originalSystem),r.variation.system);
      assert.ok(r.frameBinding.checks.every(c=>c.pass));assert.ok(r.frameBinding.phaseChecks.every(c=>c.pass));assert.equal(r.frameBinding.actualBodyModified,false);
    }
  });
  await check('all40-actual-H-integral-jets-20-inverse-and18-sqrt-identities-materialize-to-original-AD',()=>{
    assert.equal(p.covarianceChecks.length,40);assert.ok(p.covarianceChecks.every(c=>c.pass&&c.retained===c.expected&&c.integrandProductCheck.bodyDerivativeBinding));
    assert.equal(p.inverse.inverseChecks.length,20);assert.ok(p.inverse.inverseChecks.every(c=>c.pass&&c.bodyDerivativeBinding));
    assert.deepEqual(p.inverse.weights,source.target.weights);assert.deepEqual(p.inverse.squareRoots.map(s=>s.sigma),source.target.squareRootWeights);
    assert.ok(p.inverse.squareRoots.every(s=>s.checks.length===9&&s.checks.every(c=>c.pass&&c.bodyDerivativeBinding)));
  });
  await check('dynamic-centers-are-differentiated-and-cancel-only-by-exact-positive-identities',()=>{
    assert.ok(p.centering.columnChecks.every(c=>c.pass));assert.ok(p.centering.HvalueChecks.every(c=>c.pass));assert.ok(p.centering.YvalueChecks.every(c=>c.pass));
    for(const [i,row]of p.centering.wave.entries()){
      assert.equal(row.normalizationProof.actualCenterDifferentiated,true);assert.equal(row.normalizationProof.scalarArgumentCheck.pass,true);
      assert.equal(G.nodes[p.centering.centers[i]].op,'actual_covariance_volterra');assert.ok(p.centering.centerJets[i].roots.slice(1).some(x=>x!==G.zero));
      assert.equal(row.product.roots.length,10);assert.ok(row.product.checks.every(c=>c.pass&&c.bodyDerivativeBinding));
    }
    assert.equal(p.numerics.conditioning.pass,true);assert.ok(p.numerics.conditioning.checks.every(c=>c.pass));
  });
  await check('18-directed-actual-weighted-jets-have-fully-bound-roots-and-nonzero-errors',()=>{
    assert.equal(p.rows.length,18);for(const r of p.rows){
      assert.equal(G.freeCoordinates(r.coefficient).size,0);assert.equal(G.freeCoordinates(r.positiveExactScale).size,0);
      assert.equal(r.allSourceJetsMaterializedBeforePointSubstitution,true);assert.equal(r.sourceWeightedProductCheck.bodyDerivativeBinding,true);
      assert.equal(r.toleranceMet,true);assert.equal(r.nonzeroRemainderRetained,true);
      assert.ok(qcompare(qsub(readRational(r.directedInterval.upper),readRational(r.directedInterval.lower)),readRational(p.request.tolerance))<=0);
      assert.ok(qcompare(readRational(r.width),Q(0))>0);
    }
    assert.ok(qcompare(readRational(p.numerics.errorBudget.originalPositiveWaveJetRadius,200000),Q(0))>0);
    assert.equal(p.numerics.actualPositiveFactors.actualPositiveHReplacedByZero,false);assert.equal(p.numerics.arithmetic.binary64UsedForDecisions,false);
  });
  await check('actual-RR-RT-TT-signs-are-separated-and-zero-comparisons-remain-intervals',()=>{
    for(const sign of [1,-1]){
      const rows=p.rows.filter(r=>r.sign===sign),find=id=>rows.find(r=>r.derivative===id);
      assert.ok(qcompare(readRational(find('RR').directedInterval.lower),Q(-347,1000))>0);assert.ok(qcompare(readRational(find('RR').directedInterval.upper),Q(-345,1000))<0);
      assert.ok(qcompare(readRational(find('RT').directedInterval.lower),Q(4,10n**26n))>0);assert.ok(qcompare(readRational(find('RT').directedInterval.upper),Q(5,10n**26n))<0);
      assert.ok(qcompare(readRational(find('TT').directedInterval.upper),Q(0))<0);
      for(const id of ['R','Z','T','RZ','ZZ','ZT']){assert.ok(qcompare(readRational(find(id).directedInterval.lower),Q(0))<0);assert.ok(qcompare(readRational(find(id).directedInterval.upper),Q(0))>0);}
    }
  });
  await check('uncomputed-scales-fast-variables-physical-lift-and-full-GNUM-remain-explicitly-open',()=>{
    for(const key of ['actualWeightedRadialFirstSlowDerivativesNumericallyEnclosed','actualWeightedRadialSecondAndMixedSlowDerivativesNumericallyEnclosed','allOriginalMatrixAndHInverseSqrtDerivativeBodiesGenerated'])assert.equal(p.scope[key],true);
    for(const key of ['remainingGeometryAndTargetScalesNumericallyEvaluated','unscaledHighRelativePrecision','otherTwoWeightedPulseComponentsNumericallyEnclosed','actualFastPulseDerivativesNumericallyEnclosed',
      'actualHUncenteredDerivativeNumerics','actualFullCurlNumericalEnclosure','actualPhysicalPointViaTorusInverse','allSourceLabelsCovered','globalPhysicalResidual','wholeGNUMComplete','newLeanKernelProof','workerExecution','browserExecution','m3MayStart'])assert.equal(p.scope[key],false);
    assert.equal(p.scope.actualEpsilonReplacedByZero,false);assert.equal(p.scope.actualRoundedCarrierReplaced,false);
  });
  await check('copied-source-forged-jet-interval-and-immutable-matrix-controls-reject',()=>{
    assert.throws(()=>attachActualCenteredSlowJetEnclosure({...centered}),{code:'INVALID_SOURCE_CONSTRUCTION'});assert.throws(()=>assertActualCenteredSlowJetEnclosure({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    const original=p.rows[0].coefficient;try{p.rows[0].coefficient=G.zero;assert.throws(()=>assertActualCenteredSlowJetEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.rows[0].coefficient=original;}
    const lower=p.rows[0].directedInterval.lower;try{p.rows[0].directedInterval.lower='0';assert.throws(()=>assertActualCenteredSlowJetEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.rows[0].directedInterval.lower=lower;}
    assert.throws(()=>{G.covarianceSystems[p.pulses[0].variation.originalSystem].matrix[0][1]=G.zero;},TypeError);
    const copy=G.pulseJetAliases;copy.clear();assert.equal(G.pulseJetAliases.size,2);assert.equal(assertActualCenteredSlowJetEnclosure(p),true);
  });
  await check('later-appends-do-not-change-either-authenticated-certificate',async()=>{
    const before=await actualCenteredSlowJetEnclosureCertificateFromProgram(p);G.fresh('after_centered_slow_prefix');assert.deepEqual(await actualCenteredSlowJetEnclosureCertificateFromProgram(p),before);
    assert.deepEqual(await actualCenteredPulseEnclosureCertificateFromProgram(centered),original);
  });
  await check('literal-import-closure-remains-unchanged',()=>assert.deepEqual(manifest(),record.sourceManifest));
  record.certificate=await actualCenteredSlowJetEnclosureCertificateFromProgram(p);record.originalCenteredSourceGraph=original.graph;record.scope=p.scope;
  record.sourceManifestUnchangedAfterRun=true;record.pass=true;record.status='EXECUTED_VERIFIED_SCOPED';record.exitCode=0;
}catch(error){record.pass=false;record.status='FAILED';record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack,...(error.details?{details:error.details}:{})};process.exitCode=1;}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',pass:record.pass,exitCode:record.exitCode,checks:record.checks,graph:record.certificate?.graph?{sha256:record.certificate.graph.sha256,nodeCount:record.certificate.graph.nodeCount,canonicalBytes:record.certificate.graph.canonicalBytes}:null,
  elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
