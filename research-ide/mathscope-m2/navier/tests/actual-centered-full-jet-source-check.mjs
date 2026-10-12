// Coordinate the single shared actual-source slot before running this file.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualCenteredPulseFullJetEnclosure,attachActualCenteredPulseFullJetEnclosure,assertActualCenteredPulseFullJetEnclosure,actualCenteredPulseFullJetEnclosureCertificateFromProgram} from '../actual-centered-pulse-full-jet-enclosure.mjs';
import {assertActualCenteredSlowJetEnclosure,actualCenteredSlowJetEnclosureCertificateFromProgram} from '../actual-centered-slow-jet-enclosure.mjs';
import {assertActualAdiabaticPulseCenterEnclosure,actualAdiabaticPulseCenterEnclosureCertificateFromProgram} from '../actual-adiabatic-pulse-center-enclosure.mjs';
import {actualCenteredPulseEnclosureCertificateFromProgram} from '../actual-centered-pulse-enclosure.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';
import {readRational,rational as Q,qcompare,qsub} from '../actual-continuation-arithmetic.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

assert.ok(process.argv.length<=4);
const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=f=>path.relative(repository,f).split(path.sep).join('/'),digest=x=>createHash('sha256').update(x).digest('hex'),
  directory=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../research/evidence/centered-full-jets-20261011/',import.meta.url)),stem=process.argv[3]??'actual-centered-full-jet-source';
assert.match(stem,/^[a-z0-9-]+$/);fs.mkdirSync(directory,{recursive:true});
const recordPath=path.join(directory,stem+'.json'),logPath=path.join(directory,stem+'.log'),preflightPath=path.join(directory,stem+'-preflight.json');
assert.ok([recordPath,logPath,preflightPath].every(p=>!fs.existsSync(p)),'Never overwrite a preceding actual-source attempt.');
function manifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];while(pending.length){const f=pending.pop();if(seen.has(f))continue;const bytes=fs.readFileSync(f),body=bytes.toString('utf8');seen.set(f,digest(bytes));
    for(const m of [...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)])if(m[1].startsWith('.'))pending.push(path.resolve(path.dirname(f),m[1]));}
  const files=Object.fromEntries([...seen].map(([f,h])=>[relative(f),h]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Literal local import closure of the original three-component fast and uncentered slow-jet runner, including the runner itself.',fileCount:seen.size,files,sha256:digest(canonicalStringify(files))};
}
const input={sourceProfile:SOURCE_PROFILE_ID,precisionBits:192,tolerance:'1/1000000000000',maxCutoffCells:4096},
  started=performance.now(),deadline=started+540000,record={schema:'MathScope.ActualCenteredFullJetSourceCheck/1',generatedAt:new Date().toISOString(),
    sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),command:[process.execPath,...process.execArgv,relative(fileURLToPath(import.meta.url)),...process.argv.slice(2)],
    input,inputSHA256:digest(canonicalStringify(input)),mode:'DIRECT_ORIGINAL_THREE_COMPONENT_WEIGHTED_FAST_AND_UNCENTERED_A_H_Y_SLOW_JETS',
    runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:manifest(),checks:[],progress:[]};
fs.writeFileSync(preflightPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
const log=value=>{const line=JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);},check=async(id,fn)=>{await fn();record.checks.push({id,pass:true});log({event:'CHECK',id,pass:true});},
  context={checkCancelled:()=>{if(performance.now()>deadline)throw Object.assign(Error('The single actual centered full-jet constructor exceeded540seconds.'),{code:'RESOURCE_LIMIT'});},
    onProgress:step=>{global.gc?.();const row={...step,elapsedMs:performance.now()-started,rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed};record.progress.push(row);log({event:'PROGRESS',...row});}};
log({event:'START',inputSHA256:record.inputSHA256,sourceManifestSHA256:record.sourceManifest.sha256,sourceFiles:record.sourceManifest.fileCount});
try{
  const p=prepareActualCenteredPulseFullJetEnclosure(input,context),{G,slow,absolute,centered}=p,source=centered.selected,
    original=await actualCenteredPulseEnclosureCertificateFromProgram(centered),oldSlow=await actualCenteredSlowJetEnclosureCertificateFromProgram(slow),
    originalAbsolute=await actualAdiabaticPulseCenterEnclosureCertificateFromProgram(absolute);
  await check('same-private-original-source-and-the-sealed-slow-predecessor-reproduce-exactly',()=>{
    assert.equal(assertActualCenteredPulseFullJetEnclosure(p),true);assert.equal(assertActualCenteredSlowJetEnclosure(slow),true);assert.equal(assertActualAdiabaticPulseCenterEnclosure(absolute),true);
    assert.equal(original.graph.originalSourceGraph.sha256,'8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a');
    assert.equal(oldSlow.graph.sha256,'c4d8b3daca26c061ae227a6744654d41c67b6ffa98a8d7c62dfd518f52e04a00');
    assert.equal(p.sourceBinding.parameterExpressionSHA256,sourceExponentContract().parameterExpressionSHA256);assert.equal(p.sourceBinding.selectedEll,source.geometry.ell);
    assert.equal(slow.centered,absolute.centered);assert.equal(p.G,slow.G);assert.notEqual(absolute.G,p.G);assert.ok(p.checks.every(c=>c.pass));
  });
  await check('both-original-full-matrices-keep-private-20-component-aliases-and-fixed-source-data',()=>{
    for(const [i,pulse]of slow.pulses.entries()){
      const f=source.families[i],original=G.covarianceSystems[f.system];assert.deepEqual(original.matrix,f.frame.wMatrix);assert.deepEqual(original.initial,[G.one,G.zero]);
      assert.equal(original.length,source.geometry.Ls);assert.equal(G.pulseJetAliases.get(f.system),pulse.variation.system);assert.equal(G.assertPulseSecondVariation(pulse.variation.system),true);
      assert.equal(pulse.variation.dimension,20);assert.equal(pulse.variation.norms.flatMap(n=>n.entries.flat()).length,40);
      assert.ok(pulse.variation.norms.every(n=>n.entries.flat().every(e=>e.actualBodyBinding&&e.actualTimeDerivativeBinding)));
    }
    assert.equal(p.sourceBinding.privateSecondVariationAliasesRetainedInOriginatingGraph,true);
    assert.equal(p.sourceBinding.absolutePredecessorAppendedNodeIdsNeverImportedAsSlowGraphIds,true);
  });
  await check('whole-time-fast-mean-value-premises-and-separate-moving-amplitude-jets-come-from-actual-bodies',()=>{
    assert.ok(p.sourceBounds.checks.every(c=>c.pass));assert.equal(p.sourceBounds.sourceMatrixOrInitialLayerReplaced,false);
    assert.equal(p.algebra.amplitude.maximumPower,1132);assert.ok(p.algebra.amplitude.checks.every(c=>c.pass));assert.equal(p.algebra.amplitude.originalMovingFrameDerivativesSetToZero,false);
    for(const [i,row]of p.sourceBounds.rows.entries()){
      assert.ok(row.sourceChecks.every(c=>c.pass));assert.equal(row.sourcePort.F,source.fields.F);assert.equal(row.sourcePort.FR,G.derivative(source.fields.F,source.coordinates.R));
      assert.equal(row.actualOriginalTimeJets.length,3);assert.deepEqual(row.actualOriginalTimeJets[1],slow.pulses[i].variation.timeMatrix);
      assert.equal(row.jets.length,3);assert.ok(row.jets.every(j=>j.auxiliary.length===3&&j.amplitude.flat().every(id=>G.nodes[id])));
      assert.equal(row.actualAmplitudeJets.flat().length,4);assert.ok(row.actualAmplitudeJets.flat().every(a=>a.slowJets.roots.length===10&&a.mixed.length===3));
    }
    assert.match(p.algebra.fast.initialLayer.initialValues,/need not be zero/);assert.ok(qcompare(readRational(p.algebra.fast.positiveNormalizedError,200000),Q(0))>0);
  });
  await check('actual-half-pulse-log-derivatives-retain-complete-damping-and-integrated-center-slopes',()=>{
    assert.ok(p.algebra.slope.rows.every(r=>r.check.pass&&r.negativeControl.correctlyRejected));
    assert.equal(p.algebra.slope.integration.limitIB,'log(2)/3-7/72');assert.equal(p.logSlopes.rows.length,2);
    for(const row of p.logSlopes.rows){assert.ok(row.qvCheck.pass);assert.equal(row.centerRows.length,3);for(const jet of row.centerRows){
      assert.equal(jet.zeroInitialDerivative,G.zero);assert.equal(jet.actualDerivativeAndForcingRetained,true);assert.equal(G.freeCoordinates(jet.coefficient).size,0);
      assert.ok(G.nodes[jet.wholeHalfPulseIntegral]);assert.equal(jet.nonzeroRemainderRetained,true);
    }}
    const nu=p.numerics.centerLogSlopes.rows,radial=nu.find(r=>r.direction==='R'),time=nu.find(r=>r.direction==='T');
    assert.ok(qcompare(readRational(radial.coefficient.lower),Q(-61,1000))>0);assert.ok(qcompare(readRational(radial.coefficient.upper),Q(-60,1000))<0);
    assert.ok(qcompare(readRational(time.coefficient.upper),Q(0))<0);assert.equal(p.scope.sourceSecondLogDerivativeSetToZero,false);
  });
  await check('all30-fast-products-and36-additional-slow-products-materialize-to-full-original-AD',()=>{
    for(const [i,f]of p.fastFamilies.entries()){
      assert.ok(f.checks.every(c=>c.pass));assert.equal(f.products.length,3);assert.equal(f.slowProducts.length,2);
      for(const product of f.products){assert.equal(product.weight,source.target.squareRootWeights[i]);assert.equal(product.radial,source.families[i].t[product.component]);
        assert.ok(product.rows.every(r=>r.pass&&r.bodyDerivativeBinding&&r.actual===r.materialized));assert.equal(product.rows.length,5);
      }
      assert.ok(f.slowProducts.every(product=>product.checks.length===10&&product.checks.every(c=>c.pass&&c.bodyDerivativeBinding)));
      assert.ok(f.actualEnvelope.firstPCheck.pass&&f.actualEnvelope.secondPCheck.pass);assert.equal(f.actualEnvelope.atCenter.P,G.one);
      assert.ok(f.reference.pass);assert.deepEqual(centered.sourceCutoffs.plateau,['Ls/4','3Ls/4']);
    }
  });
  await check('original-a-H-y-jets-and-moving-center-identities-are-bound-with-no-unknown-center-amplitude',()=>{
    assert.equal(p.uncenteredFamilies.length,2);for(const f of p.uncenteredFamilies){
      assert.ok(f.audit.pass);assert.equal(f.audit.rows.length,3);assert.ok(f.audit.rows.every(r=>r.checks.length===9&&r.checks.every(c=>c.pass&&c.bodyDerivativeBinding)));
      assert.equal(f.originalJetBindings.length,4);assert.ok(f.originalJetBindings.every(b=>b.checks.length===10&&b.checks.every(c=>c.pass)));
      assert.ok(f.positiveCenterChecks.sameOriginalCenter&&f.positiveCenterChecks.sameOriginalH.every(c=>c.pass)&&f.positiveCenterChecks.sameOriginalWeight.pass);
    }
    assert.equal(p.numerics.centerAmplitudeStillUnknown,false);assert.deepEqual(p.numerics.absoluteValueBoxes,absolute.numerics.values);
    assert.deepEqual(p.roots.originalWeights,source.target.weights);assert.deepEqual(p.roots.originalH,source.target.H);assert.deepEqual(p.roots.originalSourceTarget,source.target.components);
  });
  await check('138-new-source-coefficients-have-directed-widths-positive-errors-and-closed-positive-scales',()=>{
    assert.equal(p.rows.length,138);assert.equal(p.rows.filter(r=>r.quantity==='weightedPulse'&&r.derivative.includes('v')).length,30);
    assert.equal(p.rows.filter(r=>r.quantity==='weightedPulse'&&!r.derivative.includes('v')).length,36);
    assert.equal(p.rows.filter(r=>r.quantity==='a').length,18);assert.equal(p.rows.filter(r=>r.quantity==='H').length,36);assert.equal(p.rows.filter(r=>r.quantity==='y').length,18);
    const keys=new Set();for(const r of p.rows){const key=[r.quantity,r.sign,r.component,r.derivative].join(':');assert.ok(!keys.has(key));keys.add(key);
      assert.equal(G.freeCoordinates(r.coefficient).size,0);assert.equal(G.freeCoordinates(r.positiveExactScale).size,0);assert.notEqual(r.positiveExactScale,G.zero);
      assert.equal(r.bodyDerivativeBinding,true);assert.equal(r.toleranceMet,true);assert.equal(r.nonzeroRemainderRetained,true);
      assert.ok(qcompare(readRational(r.width),Q(0))>0);assert.ok(qcompare(qsub(readRational(r.directedInterval.upper),readRational(r.directedInterval.lower)),readRational(p.request.tolerance))<=0);
    }
    assert.equal(slow.rows.length,18);assert.equal(p.scope.allThreeWeightedPulseSlowFastAndMixedCoefficientsNumericallyEnclosed,true);
  });
  await check('signed-axial-fast-jets-and-original-H-y-derivative-signs-are-distinguished',()=>{
    for(const sign of[1,-1])for(const component of[0,1,2]){
      const set=p.rows.filter(r=>r.quantity==='weightedPulse'&&r.sign===sign&&r.component===component),find=id=>set.find(r=>r.derivative===id),orientation=component===2?sign:1;
      for(const id of['vv','Tv']){const row=find(id);assert.ok(qcompare(readRational(orientation===1?row.directedInterval.upper:row.directedInterval.lower),Q(0))*orientation<0);}
      const rv=find('Rv');assert.ok(qcompare(readRational(orientation===1?rv.directedInterval.lower:rv.directedInterval.upper),Q(0))*orientation>0);
      for(const id of['v','Zv']){const row=find(id);assert.ok(qcompare(readRational(row.directedInterval.lower),Q(0))<0&&qcompare(readRational(row.directedInterval.upper),Q(0))>0);}
    }
    for(const r of p.rows.filter(r=>r.quantity!=='weightedPulse'&&r.derivative==='R')){
      const negative=r.quantity==='a'||r.quantity==='H'&&!(r.component===1&&r.sign===-1);
      assert.ok(qcompare(readRational(negative?r.directedInterval.upper:r.directedInterval.lower),Q(0))*(negative?-1:1)>0);
    }
  });
  await check('same-old-auxiliary-point-and-uncomputed-geometric-physical-scopes-remain-explicit',()=>{
    for(const key of['actualUncenteredPulseCenterSlowAndMixedCoefficientsNumericallyEnclosed','actualUncenteredHSlowAndMixedCoefficientsNumericallyEnclosed','actualUncenteredWeightSlowAndMixedCoefficientsNumericallyEnclosed',
      'actualAbsoluteCenterAmplitudeNumericallyEnclosed','originalCompleteTargetAndCoupledModesRetained','sourceBoundNonzeroInitialLayerAndGaussianErrors','samePrivateOldTerminalSourcePoint'])assert.equal(p.scope[key],true);
    for(const key of['remainingGeometryAndTargetScalesNumericallyEvaluated','allUnscaledHAndWeightNumbersEnclosed','actualPhysicalPointViaTorusInverse','actualFullCurlNumericalEnclosure','allSourceLabelsCovered',
      'globalPhysicalResidual','wholeGNUMComplete','newLeanKernelProof','workerExecution','browserExecution','m3MayStart','actualPositiveHReplacedByZero','actualEpsilonReplacedByZero','actualRoundedCarrierReplaced'])assert.equal(p.scope[key],false);
    assert.equal(p.sourceBinding.originalFullMatrixPressureBasisTargetHInverseSqrtRetained,true);assert.equal(p.sourceBinding.originalPositiveHAndEpsilonRetained,true);
    assert.equal(p.sourceBinding.originalRoundedCarriersRetained,true);
  });
  await check('copied-predecessors-forged-coefficients-and-source-matrix-mutations-are-rejected',()=>{
    assert.throws(()=>attachActualCenteredPulseFullJetEnclosure({...slow},absolute),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>attachActualCenteredPulseFullJetEnclosure(slow,{...absolute}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>assertActualCenteredPulseFullJetEnclosure({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    const root=p.rows[0].coefficient;try{p.rows[0].coefficient=G.zero;assert.throws(()=>assertActualCenteredPulseFullJetEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.rows[0].coefficient=root;}
    const lo=p.rows[0].directedInterval.lower;try{p.rows[0].directedInterval.lower='0';assert.throws(()=>assertActualCenteredPulseFullJetEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.rows[0].directedInterval.lower=lo;}
    assert.throws(()=>{G.covarianceSystems[source.families[0].system].matrix[0][1]=G.zero;},TypeError);assert.equal(assertActualCenteredPulseFullJetEnclosure(p),true);
  });
  await check('later-appends-preserve-all-four-authenticated-compiler-prefixes',async()=>{
    const before=await actualCenteredPulseFullJetEnclosureCertificateFromProgram(p);G.fresh('after_full_center_jet_prefix');
    assert.deepEqual(await actualCenteredPulseFullJetEnclosureCertificateFromProgram(p),before);
    assert.deepEqual(await actualCenteredSlowJetEnclosureCertificateFromProgram(slow),oldSlow);
    assert.deepEqual(await actualAdiabaticPulseCenterEnclosureCertificateFromProgram(absolute),originalAbsolute);
    assert.deepEqual(await actualCenteredPulseEnclosureCertificateFromProgram(centered),original);
  });
  await check('literal-local-import-closure-remains-unchanged',()=>assert.deepEqual(manifest(),record.sourceManifest));
  record.certificate=await actualCenteredPulseFullJetEnclosureCertificateFromProgram(p);record.originalCenteredSourceGraph=original.graph;record.scope=p.scope;
  record.sourceManifestUnchangedAfterRun=true;record.pass=true;record.status='EXECUTED_VERIFIED_SCOPED';record.exitCode=0;
}catch(error){record.pass=false;record.status='FAILED';record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack,...(error.details?{details:error.details}:{})};process.exitCode=1;}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',pass:record.pass,exitCode:record.exitCode,checks:record.checks,graph:record.certificate?.graph?{sha256:record.certificate.graph.sha256,nodeCount:record.certificate.graph.nodeCount,canonicalBytes:record.certificate.graph.canonicalBytes}:null,
  elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
