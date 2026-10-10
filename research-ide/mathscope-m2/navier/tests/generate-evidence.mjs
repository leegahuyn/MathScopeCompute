import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {getExamples,getCapabilities} from '../index.mjs';
import {getChecklist,BLUEPRINT_SOURCE} from '../checklist.mjs';
import {executeDomain,requestHash} from '../../core/registry.mjs';
import {sha256,canonicalStringify} from '../../../mathscope-m0/contracts.mjs';
import {makeM2Visualization,listM2Panels} from '../../visualization/m2-views.mjs';
import {coefficientIdentityAudit,sourceDimensionAudit,sourceCutoffCurlAudit,finiteBackgroundResidual} from '../source-algebra.mjs';
import {sourceTorusGeometry,torusExactIdentityAudit} from '../source-geometry.mjs';
import {uniformSupportPalette} from '../source-support.mjs';
import {sourceMomentOperator,picardTailBound,sourcePicardSystem} from '../source-background.mjs';
import {getPinnedSourceProfile,validateParameterGraph} from '../source-profile.mjs';
import {getSourceCoreObservations} from '../source-core-observations.mjs';
import {sourcePulseCurlAudit} from '../source-pulse-curl.mjs';
import {evaluateLocalPotentialSum} from '../source-gluing.mjs';
import {evaluatePulseCutoffRemainder,defaultTailJet} from '../source-tail.mjs';

const base=new URL('../',import.meta.url),out=new URL('../evidence/',import.meta.url);
await mkdir(out,{recursive:true});
const testSuites=['navier.test.mjs','source.test.mjs','source-core.test.mjs','source-pulse-curl.test.mjs','source-contract.test.mjs','actual-background.test.mjs','actual-pulse.test.mjs','actual-core-evaluator.test.mjs','actual-global-source.test.mjs','actual-picard-acceptance.test.mjs','actual-pulse-amplitude.test.mjs','actual-continuation.test.mjs'];
const testResult=spawnSync(process.execPath,['--test','--test-reporter=tap',...testSuites.map(name=>fileURLToPath(new URL(name,import.meta.url)))],{encoding:'utf8'});
await writeFile(new URL('tests.tap',out),testResult.stdout+testResult.stderr);
if(testResult.status!==0)throw Error('N4/N5 regression tests failed; evidence is not sealed.');
const totalTests=Number(/^# tests (\d+)$/m.exec(testResult.stdout)?.[1]),passedTests=Number(/^# pass (\d+)$/m.exec(testResult.stdout)?.[1]);if(!totalTests||totalTests!==passedTests)throw Error('The test count is not a complete passing run.');
const independentInput={residual:finiteBackgroundResidual(2),support:uniformSupportPalette(),geometry:sourceTorusGeometry(),moments:sourceMomentOperator(),picardTail:picardTailBound()};
const independent=spawnSync('python',[fileURLToPath(new URL('./source-independent-checks.py',import.meta.url))],{encoding:'utf8',input:JSON.stringify(independentInput)});if(independent.status!==0)throw Error('Independent source checks failed: '+independent.stderr);
const independentEvidence=JSON.parse(independent.stdout);if(!independentEvidence.pass)throw Error('Independent checker did not accept.');await writeFile(new URL('source-independent-checks.json',out),JSON.stringify(independentEvidence,null,2)+'\n');
const additionalIndependent=[];
const newSourcePaths=[];
// New finite certificates have different manifest formats. Each bound byte
// is checked before its independently executed receipt is included.
const picardText=await readFile(new URL('actual-picard-acceptance.json',out),'utf8'),picardReceipt=JSON.parse(picardText);
for(const f of picardReceipt.artifacts){const p=f.path.replace(/^navier\//,'');if(await sha256(await readFile(new URL(p,base),'utf8'))!==f.sha256)throw Error('Stale actual Picard source: '+f.path);newSourcePaths.push(p);}
if(picardReceipt.independentValidation.checks!==picardReceipt.independentValidation.passed||!picardReceipt.independentValidation.results.every(c=>c.pass===true)||!picardReceipt.runtimeVerification.pass)throw Error('Incomplete actual Picard independent acceptance.');
additionalIndependent.push({file:'actual-picard-acceptance.json',checks:picardReceipt.independentValidation.passed,sha256:await sha256(picardText),verification:'INDEPENDENT_LAURENT_FRACTION_RECEIPT_WITH_CURRENT_PRODUCER_HASHES'});
for(const [manifestName,listKey,prefix] of [['actual-pulse-amplitude-manifest.json','artifacts',''],['tests/actual-continuation-manifest.json','files','research-ide/mathscope-m2/navier/']]){
  const serialized=await readFile(new URL(manifestName,base),'utf8'),manifest=JSON.parse(serialized);newSourcePaths.push(manifestName);
  for(const f of manifest[listKey]){const p=prefix?f.path.replace(prefix,''):f.path;const bytes=await readFile(new URL(p,base),'utf8');if(await sha256(bytes)!==f.sha256)throw Error('Stale actual finite source manifest: '+f.path);newSourcePaths.push(p);}
}
{
  const processResult=spawnSync('python',[fileURLToPath(new URL('./actual-pulse-amplitude-independent.py',import.meta.url))],{encoding:'utf8'});
  if(processResult.status!==0)throw Error('Independent actual amplitude failed: '+processResult.stderr);
  const audit=JSON.parse(processResult.stdout);if(!audit.pass||audit.checks!==618)throw Error('Incomplete actual amplitude audit.');
  const body={schema:'MathScope.ActualPulseAmplitudeIndependentAudit/1',...audit,inputSHA256:await sha256(await readFile(new URL('./actual-pulse-amplitude-independent.json',import.meta.url),'utf8')),checkerSHA256:await sha256(await readFile(new URL('./actual-pulse-amplitude-independent.py',import.meta.url),'utf8')),sourceManifest:'navier/actual-pulse-amplitude-manifest.json',sourceManifestSHA256:await sha256(await readFile(new URL('actual-pulse-amplitude-manifest.json',base),'utf8'))};
  const serialized=JSON.stringify(body,null,2)+'\n',file='actual-pulse-amplitude-independent.json';await writeFile(new URL(file,out),serialized);additionalIndependent.push({file,checks:body.checks,sha256:await sha256(serialized),verification:'EXECUTED_INDEPENDENT_FRACTION_DECIMAL_AUDIT_WITH_SOURCE_BINDINGS'});
}
{
  const file='actual-continuation-independent.json',serialized=await readFile(new URL(file,import.meta.url),'utf8'),audit=JSON.parse(serialized);
  if(!audit.pass||audit.checksPassed!==audit.checksTotal||audit.checks.length!==audit.checksTotal||!audit.checks.every(c=>c.pass===true))throw Error('Incomplete actual continuation audit.');
  await writeFile(new URL(file,out),serialized);additionalIndependent.push({file,checks:audit.checksPassed,sha256:await sha256(serialized),verification:'FROZEN_INDEPENDENT_FRACTION_DECIMAL_RECEIPT_WITH_CURRENT_PRODUCER_HASHES'});
}
// Reuse independently executed, frozen receipts only after checking every
// producer/source byte they bind. Regenerate those receipts with their own
// --output commands whenever one of the bound files changes.
const actualManifest=JSON.parse(await readFile(new URL('./actual-background-manifest.json',import.meta.url),'utf8'));
for(const file of actualManifest.files){
  const bytes=await readFile(new URL('../../'+file.path,import.meta.url),'utf8');
  if(await sha256(bytes)!==file.sha256)throw Error('Frozen actual-background evidence is stale: '+file.path);
}
const pulseReceipt=JSON.parse(await readFile(new URL('./actual-pulse-independent.json',import.meta.url),'utf8'));
for(const file of pulseReceipt.files){
  const bytes=await readFile(new URL('../../../../'+file.path,import.meta.url),'utf8');
  if(await sha256(bytes)!==file.sha256)throw Error('Frozen actual-pulse evidence is stale: '+file.path);
}
const extendedManifests=[];
for(const manifestPath of ['../actual-core-evaluator-manifest.json','./actual-global-source-manifest.json']){
  const manifest=JSON.parse(await readFile(new URL(manifestPath,import.meta.url),'utf8'));
  for(const file of manifest.files){
    if(await sha256(await readFile(new URL('../../../../'+file.path,import.meta.url),'utf8'))!==file.sha256)throw Error('Frozen actual-source manifest is stale: '+file.path);
  }
  extendedManifests.push(manifest);
}
for(const [name,countKey]of [['actual-background-independent.json','total'],['actual-pulse-independent.json','checkCount'],['actual-global-source-independent.json','total']]){
  const serialized=await readFile(new URL(name,import.meta.url),'utf8'),data=JSON.parse(serialized);
  if(!data.pass||!Number.isSafeInteger(data[countKey])||data.checks.length!==data[countKey]||!data.checks.every(c=>c.pass===true))throw Error('Incomplete independent actual-source receipt: '+name);
  await writeFile(new URL(name,out),serialized);
  additionalIndependent.push({file:name,checks:data[countKey],sha256:await sha256(serialized),verification:'FROZEN_INDEPENDENT_RECEIPT_WITH_CURRENT_PRODUCER_HASHES'});
}
{
  const name='actual-core-evaluator-independent.json',serialized=await readFile(new URL(name,import.meta.url),'utf8'),data=JSON.parse(serialized);
  if(data.failed!==0||!Number.isSafeInteger(data.passed)||data.passed!==extendedManifests[0].checks.independentFraction.passed||!data.outputDigest)throw Error('Incomplete independent actual-core receipt.');
  await writeFile(new URL(name,out),serialized);
  additionalIndependent.push({file:name,checks:data.passed,sha256:await sha256(serialized),verification:'FROZEN_INDEPENDENT_FRACTION_RECEIPT_WITH_CURRENT_RUNTIME_VERIFIER_AND_OUTPUT_DIGEST'});
}
const coreInput={observations:[8,16,900].map(ell=>getSourceCoreObservations({ell}))},contractInput={sums:[-3.75,-3.5,-3.25].map(log2q=>evaluateLocalPotentialSum({log2a:[2,3,4],log2qRange:[log2q,log2q+.125],log2q,potentials:[[1,2,3],[2,-1,1],[3,0,4]]})),tails:[0,2,4].map(m=>evaluatePulseCutoffRemainder(defaultTailJet(m)))};
for(const [script,file,input]of [['source-core-independent.py','source-core-independent.json',coreInput],['source-contract-independent.py','source-contract-independent.json',contractInput]]){
  const run=spawnSync('python',[fileURLToPath(new URL(script,import.meta.url))],{encoding:'utf8',input:JSON.stringify(input)});if(run.status!==0)throw Error(script+' failed: '+run.stderr);const data=JSON.parse(run.stdout);if(!data.pass)throw Error(script+' did not accept.');const serialized=JSON.stringify(data,null,2)+'\n';await writeFile(new URL(file,out),serialized);additionalIndependent.push({file,checks:data.total,sha256:await sha256(serialized)});
}
const exactEvidence={schema:'MathScope.NavierSourceExactEvidence/2',sourceProfile:getPinnedSourceProfile(),parameterGraph:validateParameterGraph(),dimensions:sourceDimensionAudit(),coefficientPde:coefficientIdentityAudit(2),coefficientNegativeControls:['omit-axial-viscosity','omit-pressure-shift','omit-cylindrical-connection'].map(negativeControl=>coefficientIdentityAudit(2,{negativeControl})),sourceCutoffCurl:sourceCutoffCurlAudit(1),sourceCutoffNegative:sourceCutoffCurlAudit(1,{omitCutoffDerivative:true}),torus:torusExactIdentityAudit(),torusNegativeControls:[torusExactIdentityAudit({omitFastChainRule:true}),torusExactIdentityAudit({wrongGlobalHaarFactor:true})],uniformSupport:uniformSupportPalette(),picardSystem:sourcePicardSystem(1),sourceCoreProvenance:coreInput.observations[0].provenance,sourceCoreVerification:coreInput.observations.map(x=>({ell:x.domain.chosenPrimaryBand,...x.verification})),sourcePulseCurl:sourcePulseCurlAudit(),independentCheckFiles:['source-independent-checks.json',...additionalIndependent.map(x=>x.file)],newLeanExecution:false,sourceInstanceCertified:false,allOrderSourceCertificate:false,globalNavierStokesConstruction:false};
await writeFile(new URL('source-exact-identities.json',out),JSON.stringify(exactEvidence,null,2)+'\n');
const records=[];
for(const example of getExamples()){
  const result=await executeDomain(example.request),job={id:example.id,request:example.request,inputHash:await requestHash(example.request),result,status:result.status,resultHash:await sha256(result)},view=makeM2Visualization(job);
  await writeFile(new URL(example.id+'.json',out),JSON.stringify(job,null,2)+'\n');
  const panels=listM2Panels(job).map(panel=>{const v=makeM2Visualization(job,{panel:panel.id});return {id:panel.id,title:v.title,state:v.state,kind:v.kind,tableRows:v.table.rows.length,points:v.scene.points.length,lines:v.scene.lines.length,arrows:v.scene.arrows.length,sourcePaths:v.table.sourcePaths};});
  records.push({id:example.id,kind:example.request.kind,status:result.status,inputHash:job.inputHash,resultHash:job.resultHash,checks:result.checks,scope:result.scope,visualization:{state:view.state,kind:view.kind,tableRows:view.table.rows.length,points:view.scene.points.length,lines:view.scene.lines.length,arrows:view.scene.arrows.length,axisMetadata:view.axisMetadata,panels},diagnostics:result.results.diagnostics??null});
}
const sourceFiles=['index.mjs','pulse-ode.mjs','checklist.mjs','source-algebra.mjs','source-background.mjs','source-envelope.mjs','source-geometry.mjs','source-profile.mjs','source-profile-data.mjs','source-support.mjs','source-core-data.mjs','source-core-observations.mjs','source-pulse-curl.mjs','source-gluing.mjs','source-tail.mjs','README_KO.md','PROOF_OBLIGATIONS_KO.md','research/SOURCE_PULSE_CURL_OPERATOR.md',...testSuites.map(name=>'tests/'+name),'tests/source-independent-checks.py','tests/source-core-independent.py','tests/source-contract-independent.py','tests/build-source-binding.py','tests/build-source-core-binding.py','tests/generate-evidence.mjs','tests/fixtures/original-n4-n5.json'],sourceHashes={};
sourceFiles.push(...[...new Set([...actualManifest.files.map(f=>f.path.replace(/^navier\//,'')),...pulseReceipt.files.map(f=>f.path.replace(/^research-ide\/mathscope-m2\/navier\//,'')),'tests/actual-background-manifest.json','research/RESUMED_SOURCE_AUDIT_KO.md'])].filter(p=>!sourceFiles.includes(p)));
sourceFiles.push(...[...new Set([...extendedManifests.flatMap(m=>m.files.map(f=>f.path.replace(/^research-ide\/mathscope-m2\/navier\//,''))),'actual-core-evaluator-manifest.json','tests/actual-global-source-manifest.json','research/ACTUAL_CORE_INDEPENDENT_REVIEW_KO.md'])].filter(p=>!sourceFiles.includes(p)));
sourceFiles.push(...[...new Set([...newSourcePaths,'research/FINITE_CRITERIA_REAUDIT_KO.md'])].filter(p=>!sourceFiles.includes(p)));
for(const name of sourceFiles)sourceHashes[name]=await sha256(await readFile(new URL(name,base),'utf8'));
const convergence=[];
for(const steps of[32,64,128,256]){const r=await executeDomain({kind:'ns.pulse-ode',input:{steps}});convergence.push({stepsPerHalf:steps,...r.results.diagnostics});}
const negativeCovariance=await executeDomain({kind:'ns.pulse-covariance',input:{target:[1,0]}});
const checklist=getChecklist(),criterionCounts=Object.fromEntries(['PASS','PARTIAL','OPEN'].map(status=>[status,checklist.filter(x=>x.status===status).length]));
const independentTotal=independentEvidence.total+additionalIndependent.reduce((n,x)=>n+x.checks,0);
const body={schema:'MathScope.M2.NavierAcceptance/3',generatedAt:new Date().toISOString(),source:BLUEPRINT_SOURCE,sourceHashes,testEvidence:{runner:'node --test --test-reporter=tap',suites:testSuites,file:'tests.tap',total:totalTests,pass:passedTests,fail:0,sha256:await sha256(testResult.stdout+testResult.stderr),scope:'LOCAL_NODE_DOMAIN_AND_ENGINE_REPLAY; browser/worker integration is verified separately by the page build.'},independentEvidence:{file:'source-independent-checks.json',sha256:await sha256(JSON.stringify(independentEvidence,null,2)+'\n'),checks:independentEvidence.total,exactPhysicalPdeComparisons:independentEvidence.pdeExactMatches,additional:additionalIndependent,totalChecks:independentTotal},exactSourceEvidence:{file:'source-exact-identities.json',sha256:await sha256(JSON.stringify(exactEvidence,null,2)+'\n')},archive:getCapabilities().n3Profile,examples:records,convergence,negativeControls:{outsideCone:{status:negativeCovariance.status,weights:negativeCovariance.results.weights,checks:negativeCovariance.checks}},checklist,criterionCounts,acceptance:'ORIGINAL_FINITE_CRITERIA_WITH_SOURCE_BOUND_PICARD_PHASE_AND_HOMOGENEOUS_PULSE_CERTIFICATES; REMAINING_ACTUAL_SOURCE_OBLIGATIONS_ARE_SEPARATE',packageCompletionGate:false,sourceInstanceCertified:false,allOrderSourceCertificate:false,fullN4:false,fullN5:false,formalComplete:false,globalNavierStokesConstruction:false};
await writeFile(new URL('acceptance.json',out),JSON.stringify({...body,artifactHash:await sha256(canonicalStringify(body))},null,2)+'\n');
process.stdout.write(JSON.stringify({tests:totalTests,passed:passedTests,independentChecks:independentTotal,examples:records.length,criterionCounts:body.criterionCounts,sourceFiles:sourceFiles.length,output:fileURLToPath(out)},null,2)+'\n');
