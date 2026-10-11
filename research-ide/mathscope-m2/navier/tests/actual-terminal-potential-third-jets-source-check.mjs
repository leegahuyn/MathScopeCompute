// One actual source per process. Reserve the heavy-memory slot first.
// node --expose-gc --max-old-space-size=2304 <this file> [new directory] [new stem]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualTerminalPotentialThirdJets,assertActualTerminalPotentialThirdJets,actualTerminalPotentialThirdJetsCertificateFromProgram} from '../actual-terminal-potential-third-jets.mjs';
import {assertActualAdmissibleTerminalCovariance,actualAdmissibleTerminalCovarianceCertificateFromProgram} from '../actual-admissible-terminal-covariance.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

assert.ok(process.argv.length<=4);
const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=file=>path.relative(repository,file).split(path.sep).join('/'),digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const directory=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../research/evidence/terminal-third-jets-20261011/',import.meta.url)),stem=process.argv[3]??'actual-terminal-potential-third-jets-source';
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
const record={schema:'MathScope.ActualTerminalPotentialThirdJetsSourceCheck/1',generatedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),
  command:[process.execPath,...process.execArgv,relative(fileURLToPath(import.meta.url)),...process.argv.slice(2)],input,inputSHA256:digest(canonicalStringify(input)),
  mode:'DIRECT_AUTHENTIC_SELECTED_TERMINAL_SOURCE_THIRD_JETS',runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:manifest(),checks:[],progress:[]};
const log=value=>{const line=JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);};
const check=async(id,fn)=>{await fn();record.checks.push({id,pass:true});log({event:'CHECK',id,pass:true});};
const context={checkCancelled:()=>{if(performance.now()>deadline)throw Object.assign(Error('The reserved source execution exceeded its explicit 180-second budget.'),{code:'RESOURCE_LIMIT'});},onProgress:p=>{
  global.gc?.();const row={...p,elapsedMs:performance.now()-started,rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed};record.progress.push(row);log({event:'PROGRESS',...row});
}};
log({event:'START',inputSHA256:record.inputSHA256,sourceManifestSHA256:record.sourceManifest.sha256,sourceFiles:record.sourceManifest.fileCount});
try{
  const p=prepareActualTerminalPotentialThirdJets(input,context),{G}=p,source=p.source,directions=['R','Z','T'].map(x=>p.coordinates[x]),sourceCertificate=await actualAdmissibleTerminalCovarianceCertificateFromProgram(source);
  await check('private-actual-small-q-terminal-member-and-original-source-prefix',()=>{
    assert.equal(assertActualTerminalPotentialThirdJets(p),true);assert.equal(assertActualAdmissibleTerminalCovariance(source),true);
    assert.equal(p.checks.length,13);assert.ok(p.checks.every(x=>x.pass));assert.equal(p.sourceBinding.sourceProfile,SOURCE_PROFILE_ID);
    assert.equal(p.sourceBinding.parameterExpressionSHA256,sourceExponentContract().parameterExpressionSHA256);
    assert.equal(source.decision.selectedSourceCovarianceDomainMember,true);assert.equal(source.decision.actualPositiveWeightsOnDeclaredTerminalDomain,true);
    assert.deepEqual(G.nodes.slice(0,source.program.nodes.length),source.program.nodes);
  });
  await check('two-authentic-forty-component-jets-alias-the-full-original-pulses',()=>{
    assert.equal(p.pulses.length,2);
    for(const[at,pulse]of p.pulses.entries()){
      const system=G.pulseThirdJetSystems[pulse.system],family=source.families[at];assert.equal(system.dimension,40);assert.equal(system.blocks.length,20);
      assert.equal(system.blocks.filter(x=>x.degree===3).length,10);assert.equal(G.pulseThirdJetAliases.get(family.system),pulse.system);
      assert.deepEqual(system.matrix,family.frame.wMatrix);assert.deepEqual(pulse.w,family.w);assert.deepEqual(system.initial,[G.one,G.zero]);assert.equal(system.left,G.zero);
      assert.ok(system.augmentedInitial.slice(2).every(x=>x===G.zero));assert.equal(system.length,source.geometry.Ls);
      assert.equal(G.nodes[pulse.w[0]].op,'actual_covariance_volterra');assert.equal(G.nodes[pulse.wJets[19][0]].op,'actual_pulse_third_jet_volterra');
    }
  });
  await check('all-original-third-matrix-basis-and-pulse-time-FTC-bodies-are-retained',()=>{
    for(const pulse of p.pulses){
      assert.equal(pulse.bounds.matrixNorms.length,20);assert.equal(pulse.basisNorms.length,20);assert.equal(pulse.referenceEnvelopeFirst.every(x=>x===G.zero),true);
      for(const [norms,matrices]of[[pulse.bounds.matrixNorms,pulse.matrixJet.matrices],[pulse.basisNorms,pulse.basisJet.matrices]])for(let a=0;a<20;a++)for(let i=0;i<matrices[a].length;i++)for(let j=0;j<2;j++){
        const e=norms[a].entries[i][j];assert.equal(e.originalExpression,matrices[a][i][j]);assert.equal(e.originalTimeDerivative,G.derivative(e.originalExpression,p.coordinates.v));
        assert.equal(e.actualBodyBinding,true);assert.equal(e.actualTimeDerivativeBinding,true);assert.equal(e.originalInitialSubstitutionRecipeRetained,true);
        assert.equal(G.freeCoordinates(e.upper).has(p.coordinates.v),false);assert.equal(e.numericalIntegralEvaluated,false);assert.equal(e.sourceAuthenticated,false);
      }
      assert.ok(pulse.jets.every(row=>row.checks.every(c=>c.pass&&c.bodyDerivativeBinding)));assert.ok(pulse.jets.every(row=>row.absoluteTail!==G.zero));
    }
  });
  await check('all-eighty-full-covariance-derivatives-retain-the-complete-integrand',()=>{
    assert.equal(p.covarianceChecks.length,80);assert.ok(p.covarianceChecks.every(x=>x.pass&&x.root===x.expected&&x.integrandProductCheck.pass));
    assert.deepEqual(p.inverse.matrix,source.target.H);assert.deepEqual(p.inverse.target,source.target.components);
    assert.equal(p.sourceBinding.finiteSumUsedAsExactSolution,false);assert.equal(p.inverse.numericalInverseEvaluated,false);
  });
  await check('all-target-inverse-and-positive-square-root-third-jets-bind-the-original-bodies',()=>{
    assert.equal(p.inverse.checks.length,40);assert.ok(p.inverse.checks.every(c=>c.pass&&c.bodyDerivativeBinding&&c.algebra.originalDenominatorBodiesExpanded));
    assert.deepEqual(p.inverse.weights,source.target.weights);assert.equal(p.inverse.determinant,source.target.determinant);
    assert.deepEqual(p.squareRoots.map(x=>x.sigma),source.target.squareRootWeights);
    for(const sigma of p.squareRoots){assert.equal(sigma.checks.length,19);assert.ok(sigma.checks.every(c=>c.pass&&c.bodyDerivativeBinding));assert.equal(sigma.endpointsExcludedFromMiddleSum,true);}
    const bindings=[...p.inverse.bodyBindings,...p.squareRoots.map(x=>x.bodyBinding),...p.pulses.flatMap(x=>x.amplitudeBodyBindings)];
    assert.ok(bindings.every(b=>b.pass&&!b.unspecifiedOracle&&b.checks.length===20&&b.checks.every(c=>c.pass)));
  });
  await check('sixty-original-cutoff-frame-weighted-potential-roots-per-sign',()=>{
    for(const potential of p.potentials){
      assert.equal(potential.jets.length,20);assert.equal(potential.thirdSlowRootsPerSign,60);assert.equal(potential.jets.filter(x=>x.degree===3).length,10);
      assert.ok(potential.jets.every(x=>x.roots.length===3&&x.checks.every(c=>c.bodyEquality.pass&&c.product.pass&&c.product.bodyDerivativeBinding)));
      assert.ok(potential.valueChecks.every(c=>c.pass));assert.ok(potential.phaseChecks.every(c=>c.pass));assert.equal(potential.slowCutoff,p.slowCutoff.body);
    }
    assert.equal(p.slowCutoff.jet.roots.length,20);assert.ok(p.slowCutoff.meshLabels.every(x=>directions.every(d=>G.derivative(x,d)===G.zero)));
    assert.equal(p.slowCutoff.globalLabelSumConstructed,false);assert.equal(p.scope.originalSqrtEpsilonAndSlowCutoffRetained,true);
  });
  await check('first-integral-display-and-terms-zero-use-their-separate-functional-tails',()=>{
    for(const pulse of p.pulses){
      assert.equal(pulse.finite.terms,1);assert.equal(pulse.finite.rows.length,1);assert.equal(pulse.finite.values.length,40);
      assert.equal(pulse.finite.numericalIntegralEvaluated,false);assert.equal(pulse.finite.finiteSumIsExactSolution,false);assert.equal(pulse.finite.tailAppliesToAll40Components,true);
      const zero=G.pulseThirdJetPartialSum(pulse.system,{terms:0});assert.deepEqual(zero.values,G.pulseThirdJetSystems[pulse.system].augmentedInitial);assert.notEqual(zero.tail,G.zero);
    }
    assert.equal(assertActualTerminalPotentialThirdJets(p),true);
  });
  await check('open-positive-domain-and-historical-background-scope-do-not-promote-N5-or-M3',()=>{
    assert.deepEqual(G.nodes[source.constants.h],{op:'source_parameter',args:['h']});assert.equal(p.sourceBinding.originalPositiveHParameterUnchanged,true);
    assert.match(p.domain.restriction,/Open terminal chart/);assert.match(p.domain.boundary,/no T<0/);assert.match(p.domain.originalSource,/canonical c_n/);
    for(const key of['wholePotentialPhysicalSpaceTimeJetClaim','actualPhysicalSecondVelocityDerivativesConstructed','wholeGNUMComplete','commonGlobalHigherJetBound','allLabelSeriesControlled','globalPhysicalResidual','flatErrorPackageComplete','fullSameProfileN5','differentStrengthenedBackgroundSubstituted','newLeanKernelProof','workerExecution','browserExecution','m3MayStart'])assert.equal(p.scope[key],false);
  });
  await check('copies-and-mutated-covariance-checks-or-completion-scope-lose-source-authority',()=>{
    assert.throws(()=>assertActualTerminalPotentialThirdJets({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    try{p.covarianceChecks[0].pass=false;assert.throws(()=>assertActualTerminalPotentialThirdJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.covarianceChecks[0].pass=true;}
    try{p.scope.fullSameProfileN5=true;assert.throws(()=>assertActualTerminalPotentialThirdJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.scope.fullSameProfileN5=false;}
    const binding=p.inverse.bodyBindings.find(x=>x.system!==null),definition=G.expressionSystems[binding.system],body=definition.body;
    try{definition.body=G.zero;assert.throws(()=>assertActualTerminalPotentialThirdJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{definition.body=body;}
    assert.equal(assertActualTerminalPotentialThirdJets(p),true);
  });
  await check('program-array-edits-are-rejected-and-later-appends-preserve-both-authentic-prefixes',async()=>{
    const nodes=p.program.nodes;try{p.program.nodes=nodes.slice();assert.throws(()=>assertActualTerminalPotentialThirdJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.program.nodes=nodes;}
    const before=await actualTerminalPotentialThirdJetsCertificateFromProgram(p);G.fresh('after_third_potential_sealed_prefix');
    assert.deepEqual(await actualTerminalPotentialThirdJetsCertificateFromProgram(p),before);assert.deepEqual(await actualAdmissibleTerminalCovarianceCertificateFromProgram(source),sourceCertificate);
  });
  await check('literal-source-and-runner-import-bytes-remain-unchanged',()=>assert.deepEqual(manifest(),record.sourceManifest));
  record.certificate=await actualTerminalPotentialThirdJetsCertificateFromProgram(p);record.originalSourceGraph=sourceCertificate.graph;
  record.scope=p.scope;record.sourceManifestUnchangedAfterRun=true;record.pass=true;record.status='EXECUTED_VERIFIED_SCOPED';record.exitCode=0;
}catch(error){record.pass=false;record.status='FAILED';record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack};process.exitCode=1;}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',pass:record.pass,exitCode:record.exitCode,checks:record.checks,graph:record.certificate?.graph?{sha256:record.certificate.graph.sha256,nodeCount:record.certificate.graph.nodeCount,canonicalBytes:record.certificate.graph.canonicalBytes}:null,
  elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
