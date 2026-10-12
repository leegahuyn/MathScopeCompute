// One actual source per process. Reserve the heavy-memory slot first.
// node --expose-gc --max-old-space-size=2304 <this file> [new directory] [new stem]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualTerminalHarmonicThirdJets,assertActualTerminalHarmonicThirdJets,actualTerminalHarmonicThirdJetsCertificateFromProgram} from '../actual-terminal-harmonic-third-jets.mjs';
import {assertActualTerminalPotentialThirdJets,actualTerminalPotentialThirdJetsCertificateFromProgram} from '../actual-terminal-potential-third-jets.mjs';
import {differentiatedThirdScalarJet} from '../actual-pulse-third-jet-kernel.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

assert.ok(process.argv.length<=4);
const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=file=>path.relative(repository,file).split(path.sep).join('/'),digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const directory=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../research/evidence/terminal-harmonic-third-jets-20261011/',import.meta.url)),stem=process.argv[3]??'actual-terminal-harmonic-third-jets-source';
assert.match(stem,/^[a-z0-9-]+$/);fs.mkdirSync(directory,{recursive:true});
const recordPath=path.join(directory,stem+'.json'),logPath=path.join(directory,stem+'.log');assert.ok(!fs.existsSync(recordPath)&&!fs.existsSync(logPath),'Never overwrite a previous actual-source attempt.');
function manifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];
  while(pending.length){
    const file=pending.pop();if(seen.has(file))continue;const bytes=fs.readFileSync(file),body=bytes.toString('utf8');seen.set(file,digest(bytes));
    const imports=[...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
    for(const match of imports)if(match[1].startsWith('.'))pending.push(path.resolve(path.dirname(file),match[1]));
  }
  const files=Object.fromEntries([...seen].map(([file,sha256])=>[relative(file),sha256]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Literal direct source runner import closure, including its own bytes; Node identifies built-in modules.',fileCount:seen.size,sha256:digest(canonicalStringify(files)),files};
}
const input={sourceProfile:SOURCE_PROFILE_ID,terms:1},started=performance.now(),deadline=started+180000;
const record={schema:'MathScope.ActualTerminalHarmonicThirdJetsSourceCheck/1',generatedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),
  command:[process.execPath,...process.execArgv,relative(fileURLToPath(import.meta.url)),...process.argv.slice(2)],input,inputSHA256:digest(canonicalStringify(input)),
  mode:'DIRECT_AUTHENTIC_SELECTED_TERMINAL_SOURCE_HARMONIC_THIRD_JETS',runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:manifest(),checks:[],progress:[]};
const log=value=>{const line=JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);};
const check=async(id,fn)=>{await fn();record.checks.push({id,pass:true});log({event:'CHECK',id,pass:true});};
const context={checkCancelled:()=>{if(performance.now()>deadline)throw Object.assign(Error('The reserved source execution exceeded its explicit 180-second budget.'),{code:'RESOURCE_LIMIT'});},onProgress:p=>{
  global.gc?.();const row={...p,elapsedMs:performance.now()-started,rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed};record.progress.push(row);log({event:'PROGRESS',...row});
}};
log({event:'START',inputSHA256:record.inputSHA256,sourceManifestSHA256:record.sourceManifest.sha256,sourceFiles:record.sourceManifest.fileCount});
try{
  const p=prepareActualTerminalHarmonicThirdJets(input,context),{G}=p,source=p.coefficientSource,directions=['R','Z','T'].map(x=>p.coordinates[x]);
  const originalCertificate=await actualTerminalPotentialThirdJetsCertificateFromProgram(source);
  await check('private-actual-harmonic-source-retains-the-frozen-successful-C-source-graph',()=>{
    assert.equal(assertActualTerminalHarmonicThirdJets(p),true);assert.equal(assertActualTerminalPotentialThirdJets(source),true);
    assert.equal(p.checks.length,8);assert.ok(p.checks.every(c=>c.pass));assert.equal(p.sourceBinding.sourceProfile,SOURCE_PROFILE_ID);
    assert.equal(p.sourceBinding.parameterExpressionSHA256,sourceExponentContract().parameterExpressionSHA256);
    assert.equal(originalCertificate.graph.sha256,'e96bcba6819970cf60fc32613a753a70775ea7f44592ecdcf8c0129cc8c7f688');
    assert.equal(originalCertificate.graph.nodeCount,363295);assert.equal(originalCertificate.graph.canonicalBytes,15756568);
    assert.deepEqual(G.nodes.slice(0,source.program.nodes.length),source.program.nodes);
  });
  await check('two-original-C-phase-carrier-bodies-generate-all120-real-harmonic-roots-per-sign',()=>{
    assert.equal(p.rows.length,2);
    for(const[rIndex,r]of p.rows.entries()){
      const original=source.potentials[rIndex],h=r.harmonic;assert.equal(r.sign,original.sign);assert.deepEqual(h.coefficient,original.body);
      assert.equal(h.phase,original.phase);assert.equal(h.k,source.source.geometry.k);assert.deepEqual(h.directions,directions);
      assert.equal(h.jets.length,20);assert.equal(h.jets.filter(j=>j.degree===3).length,10);assert.equal(h.jets.flatMap(j=>j.roots).length*2,120);
      for(let c=0;c<3;c++){
        assert.equal(h.originalBodies[c].real,G.neg(G.mul(original.body[c],G.sine(G.mul(h.k,original.phase)))));
        assert.equal(h.originalBodies[c].imaginary,G.mul(original.body[c],G.cosine(G.mul(h.k,original.phase))));
        assert.ok(h.coefficientBindings[c].directRoots.every((x,at)=>x===original.jets[at].roots[c]));
      }
      assert.ok(h.jets.every(j=>j.checks.every(c=>c.real.pass&&c.imaginary.pass&&c.real.bodyDerivativeBinding&&c.imaginary.bodyDerivativeBinding)));
    }
  });
  await check('all-actual-phase-and-coefficient-shares-materialize-their-direct-derivative-bodies',()=>{
    for(const r of p.rows)for(const binding of[r.harmonic.phaseBinding,...r.harmonic.coefficientBindings]){
      assert.equal(binding.unspecifiedOracle,false);assert.equal(binding.sourceAuthenticated,false);
      assert.equal(binding.checks.length,20);assert.ok(binding.checks.every(c=>c.pass&&c.materialized===c.retained));
      if(binding.system!==null)assert.equal(G.expressionSystems[binding.system].body,binding.body);
    }
    for(const r of p.rows)assert.deepEqual(r.harmonic.phaseBinding.directRoots,differentiatedThirdScalarJet(G,r.originalPhase,directions).roots);
  });
  await check('all30-phase-and90-component-edges-retain-repeated-and-fully-mixed-chain-terms',()=>{
    for(const r of p.rows){
      const h=r.harmonic;assert.equal(h.phaseRecurrenceChecks.length,30);assert.equal(h.recurrenceChecks.length,90);
      assert.ok([...h.phaseRecurrenceChecks,...h.recurrenceChecks].every(c=>c.real.pass&&c.imaginary.pass));
      for(const alpha of [[3,0,0],[0,3,0],[0,0,3],[1,1,1]])assert.ok(h.recurrenceChecks.some(c=>c.orders.join(',')===alpha.join(',')));
      assert.equal(h.exponentialJets.length,20);assert.ok(h.phaseBinding.checks.every(c=>c.pass));
    }
  });
  await check('the-full-original-weight-cutoff-moving-frame-and-Volterra-limit-remain-in-C',()=>{
    assert.equal(source.scope.originalMovingPressureAndFrameTermsRetained,true);
    assert.equal(source.scope.originalSqrtEpsilonAndSlowCutoffRetained,true);assert.equal(source.scope.actualFullCovarianceTargetInverseThirdJets,true);
    assert.deepEqual(G.nodes[source.source.constants.h],{op:'source_parameter',args:['h']});
    assert.ok(source.pulses.every(pulse=>pulse.finite.terms===1&&!pulse.finite.finiteSumIsExactSolution));
    assert.ok(p.rows.every(r=>r.harmonic.finiteApproximationSubstitutedForExactBody===false));
    assert.ok(p.rows.every(r=>r.bodyChecks.every(c=>c.originalBody&&c.allTwentyOriginalCoefficientJets)));
  });
  await check('the-original-frozen-Q-potential-scale-multiplies-every-exact-harmonic-jet',()=>{
    for(const r of p.rows){
      assert.ok(r.fixedScaleChecks.every(c=>c.actuallyIndependent&&c.derivative===G.zero));
      for(let c=0;c<3;c++)for(const part of ['real','imaginary']){
        const actual=differentiatedThirdScalarJet(G,r.scaledBodies[c][part],directions);
        for(let at=0;at<20;at++)assert.equal(r.scaledRoots[at].roots[c][part],actual.roots[at]);
      }
    }
    assert.equal(assertActualTerminalHarmonicThirdJets(p),true);
  });
  await check('only-RZT-slow-harmonic-derivatives-are-certified-on-the-original-open-positive-chart',()=>{
    assert.match(p.domain.restriction,/Open terminal chart/);assert.match(p.domain.harmonic,/Xi, pulse time v and theta remain independent/);
    assert.match(p.domain.originalSource,/canonical c_n/);
    for(const field of ['actualFastXiAndPulseTimeJetAssembly','actualPhysicalSecondVelocityDerivativesConstructed','fullPhysicalSpaceTimePotentialJet','allLabelSeriesControlled','globalPhysicalResidual','flatErrorPackageComplete','wholeGNUMComplete','fullSameProfileN5','differentStrengthenedBackgroundSubstituted','newLeanKernelProof','workerExecution','browserExecution','m3MayStart'])assert.equal(p.scope[field],false);
    assert.ok(p.rows.every(r=>!r.harmonic.numericalEnclosureEvaluated));
  });
  await check('copied-reports-changed-phase-body-and-omitted-jet-terms-lose-private-source-authority',()=>{
    assert.throws(()=>assertActualTerminalHarmonicThirdJets({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    const h=p.rows[0].harmonic,old=h.jets[19].roots[0].real;
    try{h.jets[19].roots[0].real=G.add(old,G.one);assert.throws(()=>assertActualTerminalHarmonicThirdJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{h.jets[19].roots[0].real=old;}
    const definition=G.expressionSystems[h.phaseBinding.system],oldBody=definition.body;
    try{definition.body=G.zero;assert.throws(()=>assertActualTerminalHarmonicThirdJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{definition.body=oldBody;}
    assert.equal(assertActualTerminalHarmonicThirdJets(p),true);
  });
  await check('broadened-N5-completion-and-replaced-program-node-arrays-are-rejected',()=>{
    try{p.scope.fullSameProfileN5=true;assert.throws(()=>assertActualTerminalHarmonicThirdJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.scope.fullSameProfileN5=false;}
    const nodes=p.program.nodes;
    try{p.program.nodes=nodes.slice();assert.throws(()=>assertActualTerminalHarmonicThirdJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.program.nodes=nodes;}
    assert.equal(assertActualTerminalHarmonicThirdJets(p),true);
  });
  await check('later-independent-appends-keep-both-issued-certificate-prefixes-unchanged',async()=>{
    const before=await actualTerminalHarmonicThirdJetsCertificateFromProgram(p);G.fresh('after_harmonic_third_sealed_prefix');
    assert.deepEqual(await actualTerminalHarmonicThirdJetsCertificateFromProgram(p),before);
    assert.deepEqual(await actualTerminalPotentialThirdJetsCertificateFromProgram(source),originalCertificate);
  });
  await check('literal-harmonic-and-frozen-source-import-bytes-remain-unchanged',()=>assert.deepEqual(manifest(),record.sourceManifest));
  record.certificate=await actualTerminalHarmonicThirdJetsCertificateFromProgram(p);record.originalCoefficientSourceGraph=originalCertificate.graph;
  record.scope=p.scope;record.sourceManifestUnchangedAfterRun=true;record.pass=true;record.status='EXECUTED_VERIFIED_SCOPED';record.exitCode=0;
}catch(error){record.pass=false;record.status='FAILED';record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack};process.exitCode=1;}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',pass:record.pass,exitCode:record.exitCode,checks:record.checks,graph:record.certificate?.graph?{sha256:record.certificate.graph.sha256,nodeCount:record.certificate.graph.nodeCount,canonicalBytes:record.certificate.graph.canonicalBytes}:null,
  elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
