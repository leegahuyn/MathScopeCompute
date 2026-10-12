// Reserve the shared heavy-source slot before running without --interfaces-only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualCommonPhysicalCenterEnclosure,attachActualCommonPhysicalCenterEnclosure,
  assertActualCommonPhysicalCenterEnclosure,actualCommonPhysicalCenterEnclosureCertificate} from '../actual-common-physical-center-enclosure.mjs';
import {assertActualCommonAdmissibleFamily} from '../actual-common-admissible-family.mjs';
import {assertActualCommonAdmissibleBand} from '../actual-common-admissible-band.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';
import {readRational,rational as Q,qcompare,qsub} from '../actual-continuation-arithmetic.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

if(process.argv[2]==='--interfaces-only'){
  for(const input of [{H:[[1,1],[1,-1]]},{point:{R:1,Z:0,T:1}},{sourceAuthenticated:true},{maxNodes:0}])
    assert.throws(()=>prepareActualCommonPhysicalCenterEnclosure(input),{code:'INVALID_INPUT'});
  assert.throws(()=>attachActualCommonPhysicalCenterEnclosure({}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualCommonPhysicalCenterEnclosure({}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  console.log('Physical-center source runner interfaces: 6 rejection cases PASS; no source constructor executed.');
  process.exit(0);
}

assert.ok(process.argv.length<=4);
const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=f=>path.relative(repository,f).split(path.sep).join('/'),digest=x=>createHash('sha256').update(x).digest('hex'),
  directory=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../research/evidence/physical-center-20261011/',import.meta.url)),stem=process.argv[3]??'actual-common-physical-center-source';
assert.match(stem,/^[a-z0-9-]+$/);fs.mkdirSync(directory,{recursive:true});
const recordPath=path.join(directory,stem+'.json'),logPath=path.join(directory,stem+'.log');
assert.ok(!fs.existsSync(recordPath)&&!fs.existsSync(logPath),'Earlier actual-source records must not be overwritten.');
function manifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];
  while(pending.length){const f=pending.pop();if(seen.has(f))continue;const bytes=fs.readFileSync(f),body=bytes.toString('utf8');seen.set(f,digest(bytes));
    for(const m of [...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)])
      if(m[1].startsWith('.'))pending.push(path.resolve(path.dirname(f),m[1]));}
  const files=Object.fromEntries([...seen].map(([f,h])=>[relative(f),h]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Literal local import closure of this new actual common-family physical-center runner.',fileCount:seen.size,files,sha256:digest(canonicalStringify(files))};
}
const input={sourceProfile:SOURCE_PROFILE_ID,precisionBits:192,tolerance:'1/1000000000000',centerTolerance:'1/10000000000000000000000000000000000000000',maxCutoffCells:4096,maxNodes:4000000},
  started=performance.now(),deadline=started+900000,record={schema:'MathScope.ActualCommonPhysicalCenterSourceCheck/1',generatedAt:new Date().toISOString(),
    sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),command:[process.execPath,...process.execArgv,relative(fileURLToPath(import.meta.url)),...process.argv.slice(2)],
    input,inputSHA256:digest(canonicalStringify(input)),mode:'ACTUAL_COMMON_FAMILY_NEW_PHYSICAL_CENTER_THREE_COMPONENT_H_INVERSE_AND_FULL_CURL_VALUE',
    runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:manifest(),checks:[],progress:[]};
const log=value=>{const line=JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);},
  check=async(id,fn)=>{await fn();record.checks.push({id,pass:true});log({event:'CHECK',id,pass:true});},
  context={checkCancelled:()=>{if(performance.now()>deadline)throw Object.assign(Error('This single actual-source construction exceeded its 900-second budget.'),{code:'RESOURCE_LIMIT'});},
    onProgress:step=>{global.gc?.();const row={...step,elapsedMs:performance.now()-started,rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed};record.progress.push(row);log({event:'PROGRESS',...row});}};
log({event:'START',inputSHA256:record.inputSHA256,sourceManifestSHA256:record.sourceManifest.sha256,sourceFiles:record.sourceManifest.fileCount});
try{
  const p=prepareActualCommonPhysicalCenterEnclosure(input,context),{G,band,family}=p,q=(n,d=1)=>G.q(n,d),before=await actualCommonPhysicalCenterEnclosureCertificate(p);
  await check('one-private-common-family-and-its-original-first-admissible-band',()=>{
    assert.equal(assertActualCommonAdmissibleFamily(family),true);assert.equal(assertActualCommonAdmissibleBand(band),true);assert.equal(assertActualCommonPhysicalCenterEnclosure(p),true);
    assert.equal(band.family,family);assert.equal(band.geometry.ell,family.selector.ellA);assert.equal(band.request.ell,'first-admissible');
    assert.equal(p.sourceBinding.oldTerminalBandUsed,false);assert.equal(p.sourceBinding.oldDefaultX110UsedAsNumericalPoint,false);
    assert.equal(p.sourceBinding.parameterExpressionSHA256,sourceExponentContract().parameterExpressionSHA256);assert.ok(p.checks.every(x=>x.pass));
  });
  await check('positive-source-h-and-exact-palette-prove-the-new-inverse-map-neighborhood',()=>{
    assert.equal(p.sourceBounds.roots.h,G.parameter('h'));assert.ok(p.sourceBounds.checks.every(x=>x.pass));assert.equal(p.sourceBounds.audit.pass,true);
    assert.equal(p.sourceBounds.audit.hReplacedByZero,false);assert.ok(qcompare(readRational(p.sourceBounds.audit.positiveErrorUpper),Q(0))>0);
    const inverse=p.point.inverse;assert.ok(inverse.reconstructionChecks.every(x=>x.pass));assert.equal(inverse.timeIdentity.pass,true);assert.equal(inverse.radiusSquareIdentity.pass,true);
    assert.notEqual(inverse.slow.T,G.one);assert.notEqual(inverse.profile.X,p.point.anchor.X);assert.equal(inverse.slow.Z,G.zero);
    assert.equal(p.point.meshLabels.length,3);assert.ok(p.point.meshLabels.every(x=>G.freeCoordinates(x).size===0));
    assert.equal(p.point.otherSign.excluded,true);assert.equal(p.point.otherSign.centerDifferenceCheck.pass,true);
  });
  await check('new-representative-and-evaluation-are-the-same-permitted-physical-point',()=>{
    const inverse=p.point.inverse,values=[inverse.slow.R,G.zero,inverse.slow.T,inverse.profile.X,G.zero,inverse.slow.T],parameters=['R','Z','T','Xrep','etaRep','sRep'].map(n=>band.coordinates[n]);
    assert.equal(p.midplane.chartAt,G.sub(G.monotoneSystems[band.chart.system].variable,inverse.slow.T));
    assert.equal(p.midplane.roots.F,G.simultaneousSubstitute(band.fields.F,parameters,values));
    for(const r of p.rows){const node=G.nodes[r.center.a];assert.equal(node.op,'actual_covariance_volterra');assert.deepEqual(node.args[3],values);}
    for(const x of [...Object.values(p.physical.physicalPoint),p.point.slowCutoff.value])assert.equal(G.freeCoordinates(x).size,0);
    assert.equal(p.midplane.oldPointSpecificCertificateReused,false);assert.equal(p.scope.oldPointCertificateTransplanted,false);
  });
  await check('same-full-heat-completed-support-and-new-positive-target-rayleigh-scales',()=>{
    assert.ok(p.support.checks.every(x=>x.pass));assert.ok(p.support.observed.every(x=>x.audit.pass));assert.ok(p.midplane.checks.every(x=>x.pass));
    assert.equal(p.midplane.lambdaCheck.pass,true);assert.equal(p.midplane.c0Check.pass,true);assert.equal(p.support.zeroAxial,G.zero);
    assert.equal(band.target.raw.F,family.leading.F);assert.equal(band.target.raw.M,family.prepared.bootstrap.actualHeat.finalM);
    assert.notEqual(p.midplane.roots.F,G.zero);assert.notEqual(p.midplane.roots.tau,G.zero);assert.equal(p.midplane.sourceZeroIdentitiesRestrictedToOpenTerminalMidplane,true);
  });
  await check('both-full-moving-matrices-normal-constraints-and-rounded-carriers-bind-at-new-point',()=>{
    for(const [i,r]of p.rows.entries()){
      assert.equal(r.system,band.families[i].system);assert.deepEqual(G.covarianceSystems[r.system].matrix,band.families[i].frame.wMatrix);
      assert.deepEqual(G.covarianceSystems[r.system].initial,[G.one,G.zero]);assert.ok(r.copiedChecks.every(c=>c.pass));assert.ok(r.formalBinding.rewriteChecks.every(c=>c.pass));
      assert.ok(r.normalConstraint.constraintChecks.every(c=>c.pass));assert.equal(G.nodes[r.normalConstraint.nt].op,'sqrt_positive');
      assert.equal(r.phaseR.pass,true);assert.equal(r.phaseZ.pass,true);assert.equal(r.gaussian.pass,true);assert.notEqual(r.originalCarrier.deltaB,G.zero);
      assert.equal(r.branchNormalization.existingNodesModified,false);assert.equal(r.branchNormalization.approximateOrDomainBasedZeroUsed,false);
    }
  });
  await check('actual-two-column-H-inverse-centers-and-all-three-pulse-components-are-substituted',()=>{
    const coordinates=['R','Z','T','Xrep','etaRep','sRep'].map(n=>band.coordinates[n]),values=[p.point.inverse.slow.R,G.zero,p.point.inverse.slow.T,p.point.inverse.profile.X,G.zero,p.point.inverse.slow.T],
      at=x=>G.simultaneousSubstitute(x,coordinates,values);
    for(const [i,r]of p.rows.entries()){
      assert.deepEqual(r.retained.H,band.target.H.map(row=>at(row[i])));assert.equal(r.retained.weight,at(band.target.weights[i]));assert.equal(r.retained.mass,at(band.families[i].covariance.mass));
      assert.equal(r.center.P,G.one);assert.notEqual(r.center.a,G.one);assert.notEqual(r.center.a,G.zero);
      for(const x of [...r.center.t,...r.retained.H,r.retained.weight,r.retained.mass,...Object.values(p.roots.scaledRows[i]).flat().filter(x=>Number.isSafeInteger(x)&&x>=0)])
        if(G.nodes[x])assert.equal(G.freeCoordinates(x).size,0);
    }
    assert.equal(p.roots.scales.Ac,p.midplane.roots.Ac);assert.equal(p.roots.scales.tau,p.midplane.roots.tau);
  });
  await check('directed-H-determinant-inverse-square-root-and-three-component-enclosures-have-positive-remainders',()=>{
    assert.equal(p.numerics.positiveRemaindersRetained,true);assert.equal(p.numerics.arithmetic.binary64UsedForDecisions,false);
    for(const r of p.numerics.rows){assert.equal(r.toleranceMet,true);assert.ok(qcompare(qsub(readRational(r.interval.upper),readRational(r.interval.lower)),readRational(r.tolerance))<=0);}
    assert.ok(qcompare(readRational(p.numerics.values.determinant[0].upper),Q(0))<0);
    for(const x of p.numerics.values.squareRootWeights)assert.ok(qcompare(readRational(x.lower),Q(0))>0);
    for(const [i,sign]of [1,-1].entries()){
      for(const j of [0,1])assert.ok(qcompare(readRational(p.numerics.values.pulseCylindrical[i][j].lower),Q(353,1000))>0);
      const z=p.numerics.values.pulseCylindrical[i][2];assert.ok(sign===1?qcompare(readRational(z.lower),Q(0))>0:qcompare(readRational(z.upper),Q(0))<0);
      assert.ok(qcompare(readRational(p.numerics.values.weightedCylindrical[i][0].lower),Q(498,1000))>0);
    }
  });
  await check('exact-original-phase-zero-retains-coefficient-curl-pressure-and-cartesian-frame',()=>{
    assert.equal(p.physical.phaseCheck.pass,true);assert.ok(p.physical.phaseGradientChecks.every(c=>c.pass));
    assert.equal(p.physical.cutoffPlateau.pass,true);assert.ok(p.physical.cutoffPlateau.argumentChecks.every(c=>c.pass));
    assert.equal(p.physical.cutoffPlateau.originalPsiValueReplaced,false);
    assert.ok(p.physical.phaseZeroChecks.every(c=>c.pass));assert.ok(p.physical.projectionChecks.every(c=>c.pass));assert.ok(p.physical.bodyChecks.every(c=>c.pass));
    assert.equal(p.physical.coefficientCurl.length,3);assert.ok(p.physical.coefficientCurl.some(x=>x!==G.zero));assert.equal(p.physical.pressure.zeroPhaseValue,G.zero);
    assert.equal(p.physical.actualCartesianFrameRetained,true);assert.equal(p.physical.valueOnly,true);
    assert.equal(p.algebra.curl.negativeControl.correctlyRejected,true);assert.equal(p.algebra.curl.derivativesOfCurlRemainderDiscarded,false);
  });
  await check('source-values-and-numerical-scope-do-not-promote-derivatives-or-whole-M2',()=>{
    for(const key of ['sameCommonAdmissibleFamily','actualNewPhysicalCenterConstructed','actualThreeComponentPulseCentersEnclosed','actualTwoFamilyCovarianceAndInverseScaledEnclosures','actualFullPhysicalCurlValueScaledEnclosure'])assert.equal(p.scope[key],true);
    for(const key of ['remainingExactPositiveScalesNumericallyEvaluated','slowOrMixedDerivativeValuesNumericallyEnclosed','fastDerivativeValuesNumericallyEnclosed','actualFullCurlDerivativeNumericalEnclosure','globalPhysicalResidualNumericallyEnclosed','allSourceLabelsNumericallyCovered','wholeGNUMComplete','oldPointCertificateTransplanted','hReplacedByZero','newLeanKernelProof','workerExecution','browserExecution','m3MayStart'])assert.equal(p.scope[key],false);
  });
  await check('copied-record-mutated-point-interval-matrix-and-program-metadata-cannot-forge-a-source-certificate',()=>{
    assert.throws(()=>assertActualCommonPhysicalCenterEnclosure({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>attachActualCommonPhysicalCenterEnclosure({...band}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    const mutation=(object,key,value)=>{const old=object[key];try{object[key]=value;assert.throws(()=>assertActualCommonPhysicalCenterEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[key]=old;}};
    mutation(p.point.inverse.slow,'T',G.one);mutation(p.numerics.values.weights[0],'lower','1');mutation(G.covarianceSystems[p.rows[0].system].matrix[0],1,G.zero);
    mutation(p.program,'sourceBinding',{...p.program.sourceBinding,oldPointCertificateTransplanted:true});
    assert.equal(assertActualCommonPhysicalCenterEnclosure(p),true);
  });
  await check('new-appended-expressions-cannot-change-the-issued-compiler-prefix',async()=>{
    G.fresh('after_actual_physical_center_certificate');const after=await actualCommonPhysicalCenterEnclosureCertificate(p);assert.deepEqual(after,before);
    assert.equal(after.graph.fixedCompilerPrefix,true);assert.equal(after.graph.originalCommonBandGraph.sha256,before.graph.originalCommonBandGraph.sha256);
  });
  await check('every-literal-runtime-import-is-unchanged',()=>assert.deepEqual(manifest(),record.sourceManifest));
  record.certificate=before;record.scope=p.scope;record.sourceManifestUnchangedAfterRun=true;record.pass=true;record.status='EXECUTED_VERIFIED_SCOPED';record.exitCode=0;
}catch(error){record.pass=false;record.status='FAILED';record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack,...(error.details?{details:error.details}:{})};process.exitCode=1;}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',pass:record.pass,exitCode:record.exitCode,checks:record.checks,graph:record.certificate?.graph??null,elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
