// Reserve the single heavy source-memory slot before running this file.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualCenteredPulseEnclosure,attachActualCenteredPulseEnclosure,assertActualCenteredPulseEnclosure,actualCenteredPulseEnclosureCertificateFromProgram} from '../actual-centered-pulse-enclosure.mjs';
import {actualAdmissibleTerminalCovarianceCertificateFromProgram} from '../actual-admissible-terminal-covariance.mjs';
import {centeredReferenceGaussianBinding} from '../actual-centered-pulse-enclosure-kernel.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';
import {readRational,rational as Q,qcompare,qsub} from '../actual-continuation-arithmetic.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

assert.ok(process.argv.length<=4);
const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=f=>path.relative(repository,f).split(path.sep).join('/'),digest=x=>createHash('sha256').update(x).digest('hex'),
  directory=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../research/evidence/centered-pulse-20261011/',import.meta.url)),stem=process.argv[3]??'actual-centered-pulse-enclosure-source';
assert.match(stem,/^[a-z0-9-]+$/);fs.mkdirSync(directory,{recursive:true});
const recordPath=path.join(directory,stem+'.json'),logPath=path.join(directory,stem+'.log');assert.ok(!fs.existsSync(recordPath)&&!fs.existsSync(logPath),'Never overwrite an earlier actual-source attempt.');
function manifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];while(pending.length){const f=pending.pop();if(seen.has(f))continue;const bytes=fs.readFileSync(f),body=bytes.toString('utf8');seen.set(f,digest(bytes));
    for(const m of [...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)])if(m[1].startsWith('.'))pending.push(path.resolve(path.dirname(f),m[1]));}
  const files=Object.fromEntries([...seen].map(([f,h])=>[relative(f),h]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Literal local import closure of this actual centered numerical source runner, including itself.',fileCount:seen.size,files,sha256:digest(canonicalStringify(files))};
}
const input={sourceProfile:SOURCE_PROFILE_ID,precisionBits:192,tolerance:'1/1000000000000',maxCutoffCells:4096},started=performance.now(),deadline=started+150000,
  record={schema:'MathScope.ActualCenteredPulseEnclosureSourceCheck/1',generatedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),
    command:[process.execPath,...process.execArgv,relative(fileURLToPath(import.meta.url)),...process.argv.slice(2)],input,inputSHA256:digest(canonicalStringify(input)),
    mode:'DIRECT_AUTHENTIC_TERMINAL_CENTERED_SCALED_NUMERICAL_ENCLOSURE',runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:manifest(),checks:[],progress:[]};
const log=value=>{const line=JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);},check=async(id,fn)=>{await fn();record.checks.push({id,pass:true});log({event:'CHECK',id,pass:true});},
  context={checkCancelled:()=>{if(performance.now()>deadline)throw Object.assign(Error('The single actual centered source exceeded its 150-second budget.'),{code:'RESOURCE_LIMIT'});},
    onProgress:step=>{global.gc?.();const row={...step,elapsedMs:performance.now()-started,rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed};record.progress.push(row);log({event:'PROGRESS',...row});}};
log({event:'START',inputSHA256:record.inputSHA256,sourceManifestSHA256:record.sourceManifest.sha256,sourceFiles:record.sourceManifest.fileCount});
try{
  const p=prepareActualCenteredPulseEnclosure(input,context),{G}=p,source=p.selected,q=(n,d=1)=>G.q(n,d),original=await actualAdmissibleTerminalCovarianceCertificateFromProgram(source);
  await check('unchanged-private-selected-source-and-pinned-graph-reproduced',()=>{
    assert.equal(assertActualCenteredPulseEnclosure(p),true);assert.equal(original.graph.sha256,'8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a');
    assert.equal(original.graph.nodeCount,234335);assert.ok(p.checks.every(x=>x.pass));assert.ok(p.sourceBounds.checks.every(x=>x.pass));
    assert.deepEqual(G.nodes.slice(0,source.program.nodes.length),source.program.nodes);assert.equal(p.sourceBinding.parameterExpressionSHA256,sourceExponentContract().parameterExpressionSHA256);
  });
  await check('positive-h-and-original-huge-selected-band-have-an-exact-B-power-lower-bound',()=>{
    const c=source.constants,g=source.geometry,s=source.selection;
    assert.equal(g.S,G.pow(g.ell,2));assert.equal(g.ell,G.add(s.ellMinimum,q(8)));assert.equal(s.conditions.find(x=>x.id==='actual-moving-frame-denominators-and-primitive-budget').lower,G.pow(c.Bnorm,512));
    assert.equal(p.sourceBounds.contract.positive,true);assert.equal(p.sourceBounds.contract.notNumericallyReplaced,true);assert.equal(p.sourceBounds.roots.E,G.pow(c.Bnorm,256));
    assert.equal(p.numerics.sourceErrorAudit.parameters.scalePower,1024);assert.ok(qcompare(readRational(p.numerics.sourceErrorAudit.parameters.completeMassRadius),Q(0))>0);
  });
  await check('actual-complete-target-midplane-normal-and-global-moment-support-are-bound',()=>{
    assert.ok(p.midplane.checks.every(x=>x.pass));assert.deepEqual(p.midplane.conclusions.N,['-1','0']);assert.deepEqual(p.midplane.conclusions.K,['0','-1']);
    assert.equal(p.midplane.importedOuterFactor.zeroAxialCoefficient,G.zero);assert.equal(p.midplane.importedOuterFactor.endpointIdentity.pass,true);assert.equal(p.midplane.importedOuterFactor.heightIdentity.pass,true);
    assert.deepEqual(p.midplane.retainedActualTarget,source.roots.witness.target);assert.equal(p.roots.tau,p.midplane.tau);assert.notEqual(p.roots.tau,G.zero);
    assert.match(p.midplane.derivation.axial,/full moment equations/);assert.equal(p.sourceBinding.originalFullTargetAndViscousShears,true);
  });
  await check('both-full-Volterra-centers-original-matrix-and-reference-Gaussian-are-preserved',()=>{
    for(const [i,r]of p.rows.entries()){
      const f=source.families[i],s=G.covarianceSystems[r.system];assert.equal(r.system,f.system);assert.deepEqual(s.matrix,f.frame.wMatrix);assert.deepEqual(s.initial,[G.one,G.zero]);
      assert.notEqual(r.center.positiveUncomputedAmplitude,G.one);assert.equal(G.nodes[r.center.positiveUncomputedAmplitude].op,'actual_covariance_volterra');
      assert.equal(r.center.P,G.one);assert.ok(r.center.bodyChecks.every(x=>x.pass));assert.ok(r.reference.checks.every(x=>x.pass));assert.ok(r.actualMChecks.every(x=>x.pass));
      assert.equal(r.reference.input.dref,f.frame.reference.dref);assert.equal(r.reference.input.lambda,f.frame.reference.lambda);assert.equal(r.reference.roots.derivative,G.derivative(r.reference.roots.rho,source.coordinates.v));
      assert.ok(r.checks.every(x=>x.pass));assert.ok(r.centeredColumnChecks.every(x=>x.pass));assert.equal(r.squareScales.pass,true);
    }
  });
  await check('full-original-H-and-inverse-values-are-scaled-quadratically-before-the-wave-cancellation',()=>{
    for(const [j,r]of p.rows.entries()){
      const a=r.center.positiveUncomputedAmplitude,a2=G.pow(a,2),H=source.roots.witness.H.map(row=>row[j]),y=source.roots.witness.weights[j];
      assert.deepEqual(r.retained.H,H);assert.equal(r.retained.y,y);assert.deepEqual(r.centered.H,H.map(h=>G.div(h,a2)));assert.equal(r.centered.weight,G.mul(a2,y));
      assert.equal(r.roots.absoluteMassScale,G.mul(a2,p.roots.massScale));assert.deepEqual(r.centered.t,r.center.t.map(t=>G.div(t,a)));
      assert.deepEqual(r.retained.weightedAmplitude,r.center.t.map(t=>G.mul(G.sqrt(y),t)));assert.equal(r.quotientCheck.pass,true);
    }
  });
  await check('original-cutoff-mass-and-Haar-half-factor-enter-every-reported-numerical-coefficient',()=>{
    assert.equal(p.sourceCutoffs.roots.transverseMass,source.cutoffs.transverseMass);assert.equal(p.sourceCutoffs.roots.haarFactor,source.geometry.haarFactor);
    assert.equal(p.sourceCutoffs.originalTransverseIntegralNotNormalizedToOne,true);assert.equal(p.sourceCutoffs.cancellation.pass,true);
    assert.equal(p.numerics.sigmaIntegral.proof.wholeCellDerivativeOrder,8);assert.equal(p.numerics.sigmaIntegral.errorBudget.toleranceMet,true);
    assert.equal(p.numerics.sigmaIntegral.request.tolerance,'1/128000000000000');assert.ok(p.numerics.sigmaIntegral.cells>4);assert.equal(p.scope.originalTransverseMassIncluded,true);
  });
  await check('directed-nontrivial-values-positive-denominators-and-every-requested-width-are-exercised',()=>{
    assert.equal(p.numerics.rows.length,14);for(const r of p.numerics.rows){assert.ok(r.toleranceMet);assert.ok(qcompare(qsub(readRational(r.interval.upper),readRational(r.interval.lower)),readRational(input.tolerance))<=0);}
    for(const b of p.numerics.values.normalizedWeightedAmplitude){assert.ok(qcompare(readRational(b.lower),Q(498,1000))>0);assert.ok(qcompare(readRational(b.upper),Q(499,1000))<0);}
    assert.equal(p.numerics.stability.determinantSeparatedFromZero,true);assert.ok(p.numerics.stability.positiveSquareRootInputs.every(b=>qcompare(readRational(b.lower),Q(0))>0));
    assert.equal(p.numerics.arithmetic.binary64UsedForDecisions,false);assert.equal(p.numerics.errorBudget.positiveTinyRemaindersRetained,true);
  });
  await check('whole-GNUM-jets-curl-and-unscaled-center-values-are-not-promoted',()=>{
    for(const name of ['actualCenteredNormalizedMassEnclosed','actualCenteredNormalizedHEnclosed','actualCenteredNormalizedInverseWeightsEnclosed','actualScaledWeightedCenterPulseEnclosed'])assert.equal(p.scope[name],true);
    for(const name of ['absoluteHHighRelativePrecision','absoluteInverseWeightHighRelativePrecision','originalCenterAmplitudesNumericallyEvaluated','remainingTargetAndGeometryScalesNumericallyEvaluated','slowOrFastPulseJetsNumericallyEnclosed','actualFullCurlNumericalEnclosure','globalPhysicalResidual','wholeGNUMComplete','allSourceLabelsCovered','newAnalyticLeanKernelProof','workerExecution','browserExecution','m3MayStart'])assert.equal(p.scope[name],false);
  });
  await check('forged-source-reports-edited-centers-damping-and-numerical-bounds-are-rejected',()=>{
    assert.throws(()=>attachActualCenteredPulseEnclosure({...source},input),{code:'INVALID_SOURCE_CONSTRUCTION'});assert.throws(()=>assertActualCenteredPulseEnclosure({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    const f=source.families[0];assert.throws(()=>centeredReferenceGaussianBinding(G,{variable:source.coordinates.v,length:source.geometry.Ls,u:source.constants.u,lambda0:source.frozen.lambda0,lambda:f.frame.reference.lambda,dref:G.zero,sign:1}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    const a=p.rows[0].center.positiveUncomputedAmplitude;try{p.rows[0].center.positiveUncomputedAmplitude=G.one;assert.throws(()=>assertActualCenteredPulseEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.rows[0].center.positiveUncomputedAmplitude=a;}
    const low=p.numerics.values.normalizedWeightedAmplitude[0].lower;try{p.numerics.values.normalizedWeightedAmplitude[0].lower='0';assert.throws(()=>assertActualCenteredPulseEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.numerics.values.normalizedWeightedAmplitude[0].lower=low;}
    const matrix=G.covarianceSystems[p.rows[0].system].matrix,old=matrix[0][0];try{matrix[0][0]=G.zero;assert.throws(()=>assertActualCenteredPulseEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{matrix[0][0]=old;}
    assert.equal(assertActualCenteredPulseEnclosure(p),true);
  });
  await check('later-unrelated-appends-keep-the-source-and-numerical-certificate-prefixes',async()=>{
    const before=await actualCenteredPulseEnclosureCertificateFromProgram(p);G.fresh('after_centered_enclosure_prefix');assert.deepEqual(await actualCenteredPulseEnclosureCertificateFromProgram(p),before);assert.deepEqual(await actualAdmissibleTerminalCovarianceCertificateFromProgram(source),original);
  });
  await check('the-executed-literal-import-closure-is-unchanged',()=>assert.deepEqual(manifest(),record.sourceManifest));
  record.certificate=await actualCenteredPulseEnclosureCertificateFromProgram(p);record.originalSelectedSourceGraph=original.graph;record.scope=p.scope;record.sourceManifestUnchangedAfterRun=true;record.pass=true;record.status='EXECUTED_VERIFIED_SCOPED';record.exitCode=0;
}catch(error){record.pass=false;record.status='FAILED';record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack};process.exitCode=1;}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',pass:record.pass,exitCode:record.exitCode,checks:record.checks,graph:record.certificate?.graph?{sha256:record.certificate.graph.sha256,nodeCount:record.certificate.graph.nodeCount,canonicalBytes:record.certificate.graph.canonicalBytes}:null,
  elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
