import {mkdir,mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
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
import {evaluateActualMeanStress,verifyActualMeanStress} from '../actual-mean-stress.mjs';
import {actualResidualOrderCertificate,verifyActualResidualOrderCertificate} from '../actual-residual-order.mjs';
import {actualBackgroundMomentCertificate} from '../actual-continuation-exact-certificate.mjs';
import {actualCovarianceFamilyCertificate} from '../actual-covariance-source-certificate.mjs';

const base=new URL('../',import.meta.url),out=new URL('../evidence/',import.meta.url);
await mkdir(out,{recursive:true});
const testSuites=['navier.test.mjs','source.test.mjs','source-core.test.mjs','source-pulse-curl.test.mjs','source-contract.test.mjs','actual-background.test.mjs','actual-pulse.test.mjs','actual-core-evaluator.test.mjs','actual-global-source.test.mjs','actual-picard-acceptance.test.mjs','actual-pulse-amplitude.test.mjs','actual-continuation.test.mjs','actual-mean-stress.test.mjs','actual-pulse-covariance.test.mjs','actual-pulse-covariance-matching.test.mjs','actual-residual-order.test.mjs','actual-covariance-uniform.test.mjs','actual-leading-high-jets.test.mjs','actual-stress-direction.test.mjs'];
testSuites.push('actual-continuation-exact.test.mjs','actual-continuation-global.test.mjs','actual-continuation-stress.test.mjs','actual-continuation-functions.test.mjs','actual-continuation-certificate.test.mjs');
// These 66 tests support the completed-background/H construction. Their
// standalone receipts retain their narrower scopes when the final H gate
// is attached later; a conditional lemma is not counted as an actual H.
testSuites.push('actual-leading-all-order.test.mjs','actual-leading-enlarged-c2.test.mjs','actual-residual-order-induction.test.mjs','actual-residual-order-induction-background.test.mjs','actual-covariance-concentration.test.mjs','actual-covariance-global-assembly.test.mjs');
testSuites.push('actual-covariance-source.test.mjs','actual-covariance-source-kernels.test.mjs');
const testResult=spawnSync(process.execPath,['--test','--test-reporter=tap',...testSuites.map(name=>fileURLToPath(new URL(name,import.meta.url)))],{encoding:'utf8',maxBuffer:16*1024*1024});
await writeFile(new URL('tests.tap',out),testResult.stdout+testResult.stderr);
if(testResult.status!==0)throw Error('N4/N5 regression tests failed; evidence is not sealed.');
const totalTests=Number(/^# tests (\d+)$/m.exec(testResult.stdout)?.[1]),passedTests=Number(/^# pass (\d+)$/m.exec(testResult.stdout)?.[1]);if(!totalTests||totalTests!==passedTests)throw Error('The test count is not a complete passing run.');
const independentInput={residual:finiteBackgroundResidual(2),support:uniformSupportPalette(),geometry:sourceTorusGeometry(),moments:sourceMomentOperator(),picardTail:picardTailBound()};
const independent=spawnSync('python',[fileURLToPath(new URL('./source-independent-checks.py',import.meta.url))],{encoding:'utf8',input:JSON.stringify(independentInput)});if(independent.status!==0)throw Error('Independent source checks failed: '+independent.stderr);
const independentEvidence=JSON.parse(independent.stdout);if(!independentEvidence.pass)throw Error('Independent checker did not accept.');await writeFile(new URL('source-independent-checks.json',out),JSON.stringify(independentEvidence,null,2)+'\n');
const additionalIndependent=[];
const newSourcePaths=[];
const supportingSourceEvidence=[];
{
  const manifestPath='tests/actual-continuation-exact-manifest.json',manifestText=await readFile(new URL(manifestPath,base),'utf8'),manifest=JSON.parse(manifestText),manifestHash=await sha256(manifestText);
  if(manifestHash!=='40f8c7494543caf8e7c7c5d23fbb94b8b779a06b473676d2e26ad0a7c5bff431'||!manifest.pass)throw Error('The frozen actual moment construction manifest changed.');
  newSourcePaths.push(manifestPath);
  const files=[...manifest.runtimeDependencies,...manifest.artifacts];
  for(const f of files){
    const path=f.path.startsWith('research-ide/mathscope-m2/navier/')?f.path.slice('research-ide/mathscope-m2/navier/'.length):'../../'+f.path.replace(/^research-ide\//,'');
    const source=await readFile(new URL(path,base),'utf8');
    if(new TextEncoder().encode(source).length!==f.bytes||await sha256(source)!==f.sha256)throw Error('Stale actual moment construction source: '+f.path);
    newSourcePaths.push(path);
  }
  const independentPath='actual-continuation-conservation-independent.py',run=spawnSync('python',[fileURLToPath(new URL(independentPath,import.meta.url))],{encoding:'utf8'});
  if(run.status!==0)throw Error('Independent actual conservative identity check failed: '+run.stderr);
  const audit=JSON.parse(run.stdout),details=JSON.parse(await readFile(new URL('actual-continuation-conservation-independent.json',import.meta.url),'utf8'));
  if(!audit.pass||audit.identityChecks!==12||audit.negativeControls!==12||details.manufacturedFieldsAreActualSource!==false||details.actualGlobalNumericMomentClaimed!==false||!details.checks.every(r=>r.exactResidual==='0')||!details.negative.every(r=>r.nonzeroError!=='0'))throw Error('Incomplete or overstated independent moment conservation audit.');
  const evidenceText=await readFile(new URL('actual-moment-restoration.json',out),'utf8'),evidence=JSON.parse(evidenceText),current=await actualBackgroundMomentCertificate(manifest.program.request),stored=evidence.certificate;
  if(canonicalStringify(current)!==canonicalStringify(stored)||current.graph.sha256!==manifest.program.sha256||current.graph.nodeCount!==manifest.program.nodeCount||current.graph.serializedProgramBytes!==manifest.program.bytes)throw Error('The actual complete moment function program did not reproduce the frozen receipt.');
  if(!current.pass||!current.scope.originalN404Complete||current.scope.allOrdersConstructed!==false||current.scope.globalSignedMomentValuesNumericallyEnclosed!==false)throw Error('Actual moment construction scope differs from its executed finite criterion.');
  const file='actual-moment-restoration-executed.json',body={schema:'MathScope.ActualMomentRestorationExecutedAudit/1',pass:true,checks:24,
    independentConservativeIdentity:{...details,scope:'Independent polynomial fields check the universal radial integration-by-parts identities, not numerical values of the actual N3 moments.'},
    sourceManifest:{path:'navier/'+manifestPath,sha256:manifestHash},sourceByteVerification:{checkedFiles:files.length,match:true},
    actualSourceReplay:{fullProgramSHA256:current.graph.sha256,fullProgramNodes:current.graph.nodeCount,fullProgramBytes:current.graph.serializedProgramBytes,compactReceiptSHA256:await sha256(canonicalStringify(current)),match:true},
    actualChecks:{moments:current.momentIdentities.length,innerPDE:current.scope.actualInnerPDEIdentitiesChecked,stressSupports:current.supportRows.length,sourceGates:current.sourceGates,preHeatAndHeatInvariant:current.conservation.pass},
    scope:current.scope};
  const serialized=JSON.stringify(body,null,2)+'\n';await writeFile(new URL(file,out),serialized);
  additionalIndependent.push({file,checks:24,sha256:await sha256(serialized),verification:'EXECUTED_INDEPENDENT_FRACTION_CONSERVATIVE_IDENTITIES_PLUS_ACTUAL_SOURCE_FUNCTION_PROGRAM_REPLAY_AND_ALL_BOUND_BYTE_HASHES'});
}
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
// Covariance and stress are source producers with separately executed oracles.
// Verify their complete frozen inputs before accepting any independent result.
for(const manifestName of ['actual-pulse-covariance-manifest.json','actual-pulse-covariance-matching-manifest.json']){
  const manifest=JSON.parse(await readFile(new URL(manifestName,base),'utf8'));newSourcePaths.push(manifestName);
  for(const f of [...manifest.artifacts,...(manifest.frozenAmplitudeInputs||[]),...(manifest.frozenInputs||[])]){
    const bytes=await readFile(new URL(f.path,base),'utf8');
    if(await sha256(bytes)!==f.sha256)throw Error('Stale actual covariance source: '+f.path);
    newSourcePaths.push(f.path);
  }
}
for(const [stem,countKey,count,manifestName] of [
  ['actual-pulse-covariance','checks',294,'actual-pulse-covariance-manifest.json'],
  ['actual-pulse-covariance-matching','passed',1195,'actual-pulse-covariance-matching-manifest.json'],
]){
  const script=stem+'-independent.py',input=stem+'-independent.json';
  const executed=spawnSync('python',[fileURLToPath(new URL(script,import.meta.url))],{encoding:'utf8'});
  if(executed.status!==0)throw Error('Independent '+stem+' failed: '+executed.stderr);
  const audit=JSON.parse(executed.stdout);
  if(audit[countKey]!==count||audit.pass===false||(audit.failed??0)!==0)throw Error('Incomplete independent '+stem+' acceptance.');
  const body={schema:'MathScope.ExecutedActualCovarianceIndependentAudit/1',...audit,checks:count,inputSHA256:await sha256(await readFile(new URL(input,import.meta.url),'utf8')),checkerSHA256:await sha256(await readFile(new URL(script,import.meta.url),'utf8')),sourceManifest:'navier/'+manifestName,sourceManifestSHA256:await sha256(await readFile(new URL(manifestName,base),'utf8'))};
  const serialized=JSON.stringify(body,null,2)+'\n',file=stem+'-independent.json';await writeFile(new URL(file,out),serialized);
  additionalIndependent.push({file,checks:count,sha256:await sha256(serialized),verification:'EXECUTED_INDEPENDENT_FRACTION_DECIMAL_WITH_ALL_CURRENT_SOURCE_AND_FIXTURE_HASHES'});
}
{
  const frozenFile='actual-mean-stress.json',frozenText=await readFile(new URL(frozenFile,out),'utf8'),frozen=JSON.parse(frozenText),frozenSHA256=await sha256(frozenText);
  if(frozenSHA256!=='130a3e7f468f519f5d769abf104f4c032ed84597fbc89160a794e17aacdf826f')throw Error('The frozen actual stress receipt changed; review and regenerate its source binding first.');
  newSourcePaths.push('evidence/'+frozenFile);
  for(const f of frozen.files){const p=f.path.replace(/^research-ide\/mathscope-m2\/navier\//,'');if(await sha256(await readFile(new URL(p,base),'utf8'))!==f.sha256)throw Error('Stale actual stress source: '+f.path);newSourcePaths.push(p);}
  const executed=spawnSync('python',[fileURLToPath(new URL('actual-mean-stress-independent.py',import.meta.url))],{encoding:'utf8'});
  if(executed.status!==0)throw Error('Independent actual stress failed: '+executed.stderr);
  const audit=JSON.parse(executed.stdout);if(!audit.pass||audit.checks!==700)throw Error('Incomplete actual stress acceptance.');
  // The checker's stdout deliberately omits files and receipt. The complete
  // frozen file, current independent execution and current source replay are
  // three separately verified records; do not assume the same JSON shape.
  const expectedAudit=Object.fromEntries(Object.entries(frozen).filter(([k])=>!['files','receipt'].includes(k)));
  if(canonicalStringify(audit)!==canonicalStringify(expectedAudit))throw Error('Independent actual stress output differs from the current bound receipt.');
  const replay=verifyActualMeanStress(frozen.receipt),current=evaluateActualMeanStress(frozen.receipt.input);
  const storedHash=await sha256(canonicalStringify(frozen.receipt)),currentHash=await sha256(canonicalStringify(current));
  if(!replay.pass||storedHash!==currentHash)throw Error('Current actual stress producer does not replay the retained receipt.');
  const file='actual-mean-stress-executed.json',body={...audit,schema:'MathScope.ActualMeanStressExecutedAudit/1',frozenEvidence:{path:'navier/evidence/'+frozenFile,sha256:frozenSHA256},sourceByteVerification:{checkedFiles:frozen.files,match:true},independentExecution:{command:'python navier/tests/actual-mean-stress-independent.py',scriptSHA256:await sha256(await readFile(new URL('actual-mean-stress-independent.py',import.meta.url),'utf8')),stdoutKeys:Object.keys(audit).sort(),pass:audit.pass,checks:audit.checks},receiptReplay:{input:frozen.receipt.input,storedHash,currentHash,match:true,verification:replay.reason}};
  const serialized=JSON.stringify(body,null,2)+'\n';await writeFile(new URL(file,out),serialized);
  additionalIndependent.push({file,checks:audit.checks,sha256:await sha256(serialized),verification:'EXECUTED_INDEPENDENT_FRACTION_DECIMAL_HEAT_STRESS_WITH_CURRENT_SOURCE_HASHES'});
}
{
  const manifestName='actual-residual-order-manifest.json',manifestText=await readFile(new URL(manifestName,base),'utf8'),manifest=JSON.parse(manifestText);
  if(await sha256(manifestText)!=='c1df40d366fc44b7fa0514c32e659691125c4cd8c699a739a5ee4e87adebe2d3')throw Error('The independently reviewed residual manifest changed.');
  newSourcePaths.push(manifestName);
  const boundFiles=[...manifest.artifacts,...manifest.dependencyFiles,...Object.values(manifest.sourceInputs).map(f=>({...f,path:'../../'+f.path}))];
  for(const f of boundFiles){if(await sha256(await readFile(new URL(f.path,base),'utf8'))!==f.sha256)throw Error('Stale fixed-domain residual source: '+f.path);newSourcePaths.push(f.path);}
  const executed=spawnSync('python',[fileURLToPath(new URL('actual-residual-order-independent.py',import.meta.url))],{encoding:'utf8'});
  if(executed.status!==0)throw Error('Independent actual residual failed: '+executed.stderr);
  const audit=JSON.parse(executed.stdout),details=JSON.parse(await readFile(new URL('actual-residual-order-independent.json',import.meta.url),'utf8'));
  if(!audit.pass||audit.checks!==1544||details.details.length!==1544||!details.details.every(c=>c.pass===true))throw Error('Incomplete independent fixed-domain residual acceptance.');
  for(const f of manifest.artifacts)if(await sha256(await readFile(new URL(f.path,base),'utf8'))!==f.sha256)throw Error('Residual replay changed its bound artifact: '+f.path);
  const receipt=actualResidualOrderCertificate(),replay=verifyActualResidualOrderCertificate(receipt);
  if(!receipt.pass||!replay.pass||!manifest.finiteAcceptance.accepted||receipt.scope.wholeProfileResidualComplete!==false||receipt.scope.allNResidualComplete!==false)throw Error('Residual finite scope or current producer replay failed.');
  const file='actual-residual-order-independent.json',body={...details,sourceManifest:'navier/'+manifestName,sourceManifestSHA256:await sha256(manifestText),sourceByteVerification:{checkedFiles:boundFiles.length,match:true},currentReceiptReplay:{pass:true,sha256:await sha256(canonicalStringify(receipt)),sourceChecks:receipt.checks.length,finiteCriterion:'N4-05',wholeProfileResidualComplete:false,allNResidualComplete:false}};
  const serialized=JSON.stringify(body,null,2)+'\n';await writeFile(new URL(file,out),serialized);
  additionalIndependent.push({file,checks:audit.checks,sha256:await sha256(serialized),verification:'EXECUTED_INDEPENDENT_FRACTION_ACTUAL_RESIDUAL_WITH_FIXED_COORDINATES_SOURCE_BOUNDS_AND_CURRENT_BYTE_BINDINGS'});
}
{
  const frozenFile='actual-covariance-uniform.json',frozenText=await readFile(new URL(frozenFile,out),'utf8'),frozen=JSON.parse(frozenText),frozenSHA256=await sha256(frozenText);
  if(frozenSHA256!=='e1779d4e80dfd9fde606707dbcce04367525d9b1a83cb7c5765a19aeda5269bf')throw Error('The frozen uniform covariance subclaim changed.');
  newSourcePaths.push('evidence/'+frozenFile);
  for(const f of frozen.files){const p=f.path.replace(/^research-ide\/mathscope-m2\/navier\//,'');if(await sha256(await readFile(new URL(p,base),'utf8'))!==f.sha256)throw Error('Stale covariance subclaim source: '+f.path);newSourcePaths.push(p);}
  const executed=spawnSync('python',[fileURLToPath(new URL('actual-covariance-uniform-independent.py',import.meta.url))],{encoding:'utf8'});
  if(executed.status!==0)throw Error('Independent covariance subclaim failed: '+executed.stderr);
  const audit=JSON.parse(executed.stdout),expected=Object.fromEntries(Object.entries(frozen).filter(([k])=>!['files','receipt'].includes(k)));
  if(!audit.pass||audit.checks!==1814||canonicalStringify(audit)!==canonicalStringify(expected)||audit.originalN506Complete!==false)throw Error('Incomplete or overstated uniform covariance subclaim.');
  const rerun=spawnSync(process.execPath,[fileURLToPath(new URL('actual-covariance-uniform-fixture.mjs',import.meta.url))],{encoding:'utf8'});
  if(rerun.status!==0)throw Error('Current covariance subclaim fixture failed: '+rerun.stderr);
  const current=JSON.parse(rerun.stdout),storedHash=await sha256(canonicalStringify(frozen.receipt)),currentHash=await sha256(canonicalStringify(current));
  if(storedHash!==currentHash||current.source.scope.sourceUniformQStarCertified!==false||current.source.scope.originalN506Complete!==false)throw Error('Current covariance subclaim differs from its preserved receipt or claims missing source bounds.');
  const file='actual-covariance-uniform-executed.json',body={...audit,frozenEvidence:{path:'navier/evidence/'+frozenFile,sha256:frozenSHA256},sourceByteVerification:{checkedFiles:frozen.files,match:true},receiptReplay:{storedHash,currentHash,match:true},scope:'Exact robust inverse budgets and frozen operator algebra; no whole-annulus covariance or original N5-06 completion is claimed.'};
  const serialized=JSON.stringify(body,null,2)+'\n';await writeFile(new URL(file,out),serialized);
  additionalIndependent.push({file,checks:audit.checks,sha256:await sha256(serialized),verification:'EXECUTED_INDEPENDENT_BERNSTEIN_FRACTION_GAUSS_JORDAN_SUBCLAIM_WITH_CURRENT_SOURCE_HASHES'});
}
// These two frozen analytic subclaims use different oracle stdout shapes.
// Execute each oracle, compare its complete available record and replay the
// retained source program. Also bind transitive local producer imports so a
// later source-compiler change cannot silently keep the old evidence seal.
for(const spec of [
  {stem:'actual-leading-high-jets',sha256:'f5c8b57da4e5644b6acf36ce0fe99091970d71a58eeaf4ebbd362bb4315e7800',checks:573,stdoutOmitsReceipt:true,fixtureReceipt:false},
  {stem:'actual-stress-direction',sha256:'c5b8c2c6f78474f2a03b2b56befaf7bacf7986eb219a8e858dcf0161c33087e2',checks:1487,stdoutOmitsReceipt:false,fixtureReceipt:true},
]){
  const frozenFile=spec.stem+'.json',frozenText=await readFile(new URL(frozenFile,out),'utf8'),frozen=JSON.parse(frozenText),frozenHash=await sha256(frozenText);
  if(frozenHash!==spec.sha256)throw Error('The frozen analytic subclaim changed: '+spec.stem);
  newSourcePaths.push('evidence/'+frozenFile);
  const dependencyPaths=new Set();
  async function bindLocalDependency(path){
    if(dependencyPaths.has(path))return;
    dependencyPaths.add(path);newSourcePaths.push(path);
    if(!path.endsWith('.mjs'))return;
    const source=await readFile(new URL(path,base),'utf8');
    for(const match of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){
      if(!match[1].startsWith('.'))continue;
      const dep=new URL(match[1],new URL(path,base));
      if(dep.href.startsWith(base.href))await bindLocalDependency(dep.href.slice(base.href.length));
      else{
        const allowed=['../../mathscope-m1/navier/numerics.mjs'];
        const outside=allowed.find(path=>new URL(path,base).href===dep.href);
        if(!outside)throw Error('Subclaim import requires an explicit external source binding: '+dep.href);
        await bindLocalDependency(outside);
      }
    }
  }
  for(const f of frozen.files){
    const path=f.path.replace(/^(?:research-ide\/)?mathscope-m2\/navier\//,'');
    const bytes=await readFile(new URL(path,base),'utf8');
    if(await sha256(bytes)!==f.sha256)throw Error('Stale analytic subclaim source: '+f.path);
    await bindLocalDependency(path);
  }
  const script=spec.stem+'-independent.py',executed=spawnSync('python',[fileURLToPath(new URL(script,import.meta.url))],{encoding:'utf8',maxBuffer:16*1024*1024});
  if(executed.status!==0)throw Error('Independent analytic subclaim failed: '+spec.stem+' '+executed.stderr);
  const audit=JSON.parse(executed.stdout),expected=spec.stdoutOmitsReceipt?Object.fromEntries(Object.entries(frozen).filter(([key])=>key!=='receipt')):frozen;
  if(!audit.pass||audit.checks!==spec.checks||canonicalStringify(audit)!==canonicalStringify(expected)||audit.scope.originalN506Complete!==false)throw Error('Analytic subclaim oracle differs from its frozen scope or source: '+spec.stem);
  const rerun=spawnSync(process.execPath,[fileURLToPath(new URL(spec.stem+'-fixture.mjs',import.meta.url))],{encoding:'utf8',maxBuffer:16*1024*1024});
  if(rerun.status!==0)throw Error('Analytic subclaim fixture failed: '+spec.stem+' '+rerun.stderr);
  const replay=JSON.parse(rerun.stdout),current=spec.fixtureReceipt?replay.receipt:replay,storedHash=await sha256(canonicalStringify(frozen.receipt)),currentHash=await sha256(canonicalStringify(current));
  if(storedHash!==currentHash||storedHash!==frozen.receiptCanonicalSHA256||current.scope.originalN506Complete!==false)throw Error('Analytic subclaim source receipt or scope changed: '+spec.stem);
  const file=spec.stem+'-executed.json',body={schema:'MathScope.ExecutedActualAnalyticSubclaim/1',pass:true,checks:spec.checks,categories:audit.categories,scope:audit.scope,
    frozenEvidence:{path:'navier/evidence/'+frozenFile,sha256:frozenHash},sourceByteVerification:{checkedFiles:frozen.files,transitiveImports:[...dependencyPaths].sort(),match:true},
    independentExecution:{script,stdoutOmitsReceipt:spec.stdoutOmitsReceipt,completeAvailableRecordMatches:true},receiptReplay:{storedHash,currentHash,match:true},
    meaning:'Actual source derivative or closed-support direction bound only. The full background frame, uniform H columns, q-star and original N5-06 completion require separate executed certificates.'};
  const serialized=JSON.stringify(body,null,2)+'\n';await writeFile(new URL(file,out),serialized);
  additionalIndependent.push({file,checks:spec.checks,sha256:await sha256(serialized),verification:'EXECUTED_INDEPENDENT_FRACTION_SOURCE_SUBCLAIM_WITH_TRANSITIVE_IMPORT_HASHES_AND_CURRENT_PROGRAM_REPLAY'});
}
// BEGIN FROZEN_SUPPORTING_CERTIFICATES
// Preserve the original subclaim files byte for byte. Release audits are
// written under new names after current source replay and independent runs.
{
  const sourceRoot=new URL('../../',base),verifiedFiles=new Map();
  const relativeSourcePath=path=>{
    const p=path.replace(/^research-ide\//,'');
    const url=p.startsWith('mathscope-')?new URL(p,sourceRoot):new URL(p.replace(/^navier\//,''),base);
    if(!url.href.startsWith(sourceRoot.href))throw Error('Supporting source is outside the reviewed research tree: '+path);
    return url.href.startsWith(base.href)?url.href.slice(base.href.length):'../../'+url.href.slice(sourceRoot.href.length);
  };
  const currentFile=async path=>{
    path=relativeSourcePath(path);const text=await readFile(new URL(path,base),'utf8');
    const record={path,bytes:new TextEncoder().encode(text).length,sha256:await sha256(text)};
    newSourcePaths.push(path);return record;
  };
  const bindFile=async (file,reviewedReplacement=null)=>{
    const actual=await currentFile(file.path),same=actual.sha256===file.sha256&&(file.bytes===undefined||actual.bytes===file.bytes);
    if(!same&&(!reviewedReplacement||actual.sha256!==reviewedReplacement.sha256||actual.bytes!==reviewedReplacement.bytes))throw Error('Stale frozen supporting source: '+file.path);
    verifiedFiles.set(actual.path,actual);
    return {...actual,...(!same?{historicalDependency:{bytes:file.bytes,sha256:file.sha256},reviewedCurrentBinding:'navier/evidence/actual-residual-order-induction.json'}:{})};
  };
  const frozen=async (file,expectedSHA256)=>{
    const text=await readFile(new URL(file,out),'utf8'),hash=await sha256(text);
    if(hash!==expectedSHA256)throw Error('A frozen supporting receipt changed: '+file);
    newSourcePaths.push('evidence/'+file);return {file,text,sha256:hash,data:JSON.parse(text)};
  };
  const run=async (command,args,options={})=>{
    const result=spawnSync(command,args,{encoding:'utf8',timeout:240000,maxBuffer:128*1024*1024,...options});
    if(result.error||result.status!==0)throw Error('Supporting certificate execution failed: '+command+' '+args.join(' ')+' '+(result.error?.message??'')+' '+result.stderr);
    return result;
  };
  const imports=new Map();
  async function bindImports(path){
    path=relativeSourcePath(path);if(imports.has(path))return;
    const actual=await currentFile(path);imports.set(path,actual);
    if(!path.endsWith('.mjs'))return;
    const text=await readFile(new URL(path,base),'utf8');
    for(const match of text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){
      if(!match[1].startsWith('.'))continue;
      const url=new URL(match[1],new URL(path,base));
      if(!url.href.startsWith(sourceRoot.href))throw Error('Supporting import is outside the reviewed source tree: '+url.href);
      await bindImports(url.href.startsWith(base.href)?url.href.slice(base.href.length):'../../'+url.href.slice(sourceRoot.href.length));
    }
  }
  const writeAudit=async (file,body,{nodeTests,independentChecks=0}={})=>{
    const serialized=JSON.stringify(body,null,2)+'\n',hash=await sha256(serialized);await writeFile(new URL(file,out),serialized);
    newSourcePaths.push('evidence/'+file);
    supportingSourceEvidence.push({file,sha256:hash,nodeTests,independentChecks,scope:body.scope});
    if(independentChecks)additionalIndependent.push({file,checks:independentChecks,sha256:hash,verification:'EXECUTED_CURRENT_SOURCE_REPLAY_AND_INDEPENDENT_FRACTION_DECIMAL_WITH_FROZEN_RECEIPT_AND_TRANSITIVE_BYTE_BINDINGS'});
  };
  // The later combined induction manifest pins the current imported kernel.
  // The earlier leading-jet receipt explicitly treats dependency hashes as
  // historical until this combined re-verification. Its six owned files and
  // every original source document must still match their original hashes.
  const inductionFrozen=await frozen('actual-residual-order-induction.json','d79935327a0bc6d8c2bb7900b46b326888ef63326a7f6b14b9d3d96bc29ad3d6'),im=inductionFrozen.data;
  if(!im.pass||im.nodeTests.tests!==26||im.nodeTests.pass!==26||im.nodeTests.fail!==0||im.independentChecks.checks!==4181)throw Error('Incomplete frozen actual induction evidence.');
  const inductionBoundFiles=[];
  for(const file of [...im.files,...im.runtimeDependencies,...im.evidenceFiles,...Object.values(im.dependencies)])inductionBoundFiles.push(await bindFile(file));
  const approvedCurrent=new Map(inductionBoundFiles.map(file=>[file.path,file]));
  {
    const f=await frozen('actual-leading-all-order-jets.json','5fad2c150066a8fcf8e57a52ded316d960da9b8bcf01552162628b820d3db492'),r=f.data;
    if(!r.pass||r.checks!==2597||r.nodeTests.pass!==16||r.nodeTests.fail!==0)throw Error('Incomplete frozen arbitrary-leading-jet evidence.');
    const files=[];
    for(const file of [...r.files,...r.sourceBindings])files.push(await bindFile(file));
    for(const file of r.dependencyFiles)files.push(await bindFile(file,approvedCurrent.get(relativeSourcePath(file.path))));
    for(const file of r.files)await bindImports(file.path);
    const command=fileURLToPath(new URL('actual-leading-all-order-independent.py',import.meta.url)),executed=await run('python3',[command]),audit=JSON.parse(executed.stdout);
    const fixture=JSON.parse((await run(process.execPath,[fileURLToPath(new URL('actual-leading-all-order-fixture.mjs',import.meta.url))])).stdout);
    const currentHash=await sha256(canonicalStringify(fixture.receipt)),storedHash=await sha256(canonicalStringify(r.receipt));
    if(!audit.pass||audit.checks!==2597||audit.failed.length!==0||audit.rows.length!==2597||!audit.rows.every(x=>x.pass===true)||
      audit.receiptSHA256!==currentHash||fixture.receiptSHA256!==currentHash||currentHash!==storedHash||storedHash!==r.receiptCanonicalSHA256||
      canonicalStringify(fixture.summaryRequests)!==canonicalStringify(r.summaryRequests)||canonicalStringify(fixture.receipt.scope)!==canonicalStringify(r.scope)||
      fixture.receipt.scope.originalN506Complete!==false||fixture.receipt.scope.completedBackgroundC2TailCertified!==false)throw Error('Actual leading all-order source, independent oracle or preserved scope did not replay.');
    await writeAudit('actual-leading-all-order-jets-executed.json',{schema:'MathScope.ActualLeadingAllOrderReleaseAudit/1',pass:true,checks:2597,
      frozenEvidence:{path:'navier/evidence/'+f.file,sha256:f.sha256},sourceByteVerification:{files,match:true,historicalDependencyRevisionsReverified:true},
      independentExecution:audit,receiptReplay:{storedHash,currentHash,summaryRequests:fixture.summaryRequests,match:true},scope:r.scope},
      {nodeTests:16,independentChecks:2597});
  }
  {
    const f=await frozen('actual-leading-enlarged-c2.json','5d2fd4d011261f535f1117caa20fd8d72fdcf0efee586bd0761e6616f6d05c92'),r=f.data;
    if(!r.pass||r.nodeTests.pass!==8||r.nodeTests.fail!==0||r.independentReview.separatePythonAuditClaimed!==false)throw Error('Incomplete or overstated frozen enlarged C2 evidence.');
    const files=[];for(const file of [...r.files,...r.receipt.sourceBindings])files.push(await bindFile(file));
    for(const file of r.files)await bindImports(file.path);
    const {actualLeadingEnlargedC2}=await import(new URL('actual-leading-enlarged-c2.mjs',base)),current=actualLeadingEnlargedC2();
    const currentHash=await sha256(canonicalStringify(current)),storedHash=await sha256(canonicalStringify(r.receipt));
    if(!current.pass||currentHash!==storedHash||storedHash!==r.receiptCanonicalSHA256||current.scope.actualUniformHColumnsCertified!==false||current.scope.sourceUniformQStarCertified!==false||current.scope.originalN506Complete!==false)throw Error('Actual enlarged leading C2 changed its program or covariance scope.');
    await writeAudit('actual-leading-enlarged-c2-executed.json',{schema:'MathScope.ActualLeadingEnlargedC2ReleaseAudit/1',pass:true,
      frozenEvidence:{path:'navier/evidence/'+f.file,sha256:f.sha256},sourceByteVerification:{files,match:true},receiptReplay:{storedHash,currentHash,match:true},
      independentPythonChecksClaimed:0,scope:current.scope},{nodeTests:8});
  }
  {
    const fixture=await run(process.execPath,[fileURLToPath(new URL('actual-residual-order-induction-fixture.mjs',import.meta.url))]);
    const independent=await run('python3',[fileURLToPath(new URL('actual-residual-order-induction-independent.py',import.meta.url))],{input:fixture.stdout}),audit=JSON.parse(independent.stdout);
    const independentStored=JSON.parse(await readFile(new URL('actual-residual-order-induction-independent.json',out),'utf8'));
    if(!audit.pass||audit.checks!==4181||canonicalStringify(audit)!==canonicalStringify(im.independentChecks)||canonicalStringify(audit)!==canonicalStringify(independentStored))throw Error('The arbitrary-order source/convolution/cutoff independent audit did not reproduce its frozen record.');
    const {prepareActualCompletedBackgroundC2,actualBackgroundSymbolicPrefix,actualBackgroundDyadicPrefix}=await import(new URL('actual-residual-order-induction-background.mjs',base));
    const result=prepareActualCompletedBackgroundC2({order:4}),G=result.G,programNodeCount=G.nodes.length,programCanonicalSHA256=await sha256(canonicalStringify(result.program)),
      functionCounts={picard:G.picardSystems.length,shared:G.expressionSystems.length,quadratic:G.quadraticSystems.length,monotone:G.monotoneSystems.length};
    const dyadic=actualBackgroundSymbolicPrefix(result,{anchorOrder:1,dyadicBand:true,derivativeOrder:2}),arbitrary=actualBackgroundDyadicPrefix(result,{ellExact:'4',derivativeOrder:2});
    const receipt={schema:'MathScope.ActualResidualOrderInductionExecuted/1',input:{order:4},profileId:result.program.profileId,parameterExpressionSHA256:result.program.parameterExpressionSHA256,
      programCanonicalSHA256,programNodeCount,functionCounts,positiveNormRoots:result.roots,
      proofs:{checks:result.checks,pass:result.pass,parametricPDE:result.parametricPDE,
        actualAndAuxiliary:result.systems.map(s=>({order:s.order,kind:s.kind,system:s.system,checks:s.checks,bindings:s.bindings,negative:s.negative,pass:s.pass})),
        actualMoments:result.moments,potential:result.potential,support:{pass:result.support.pass,rows:result.support.rows,sourceOrder:result.support.sourceOrder,bareLocalizedIntegralProvedZero:result.support.bareLocalizedIntegralProvedZero}},
      allOrderInduction:result.induction,canonicalPrefix:result.cutoffs.rows.map(row=>({order:row.order,logScale:row.logScale,scale:row.scale,canonicalNormRequest:row.canonicalNormRequest,selectedByLaterPrefix:row.selectedByLaterPrefix,sourceCoefficientRoots:row.sourceCoefficientRoots})),
      chart:{domain:result.chart.domain,chart:result.chart.chart,exactFields:result.chart.exactFields,roots:result.chart.roots,bounds:result.chart.bounds,derivation:result.chart.derivation,scope:result.chart.scope},
      observations:{anchor:{kind:dyadic.bandSelection.kind,ell:dyadic.ell,Q:dyadic.Q,rows:dyadic.rows.map(row=>row.order),derivativeOrder:dyadic.derivativeOrder,jetCounts:Object.fromEntries(Object.entries(dyadic.jets).map(([k,v])=>[k,v.length])),inactiveTail:dyadic.exactInactiveTail,plateau:dyadic.exactPlateau,
          qDerivativePreserved:dyadic.qDerivativePreserved,thisFiniteBandEqualsAllBands:dyadic.thisFiniteBandEqualsAllBands},
        arbitraryInteger:{ellExact:arbitrary.ellExact,rows:arbitrary.rows.map(row=>row.order),inactiveTail:arbitrary.exactInactiveTail,algorithmDefinedForEveryFiniteIntegerEll:arbitrary.algorithmDefinedForEveryFiniteIntegerEll,sameCanonicalSequenceAsAnchorFamily:arbitrary.sameCanonicalSequenceAsAnchorFamily}},
      graphInterpretation:'Node identifiers are bindings in the replayable source program identified by programCanonicalSHA256. The complete program is generated by the attached source code; this small evidence file is not a replacement program or numeric interval evaluator.',
      scope:result.program.scope};
    const stored=JSON.parse(await readFile(new URL('actual-residual-order-induction-executed.json',out),'utf8')),
      currentHash=await sha256(canonicalStringify(receipt)),storedHash=await sha256(canonicalStringify(stored));
    if(!result.pass||programCanonicalSHA256!==im.programCanonicalSHA256||programNodeCount!==im.programNodeCount||
      currentHash!==storedHash||storedHash!==im.executedReceiptCanonicalSHA256||canonicalStringify(receipt.scope)!==canonicalStringify(im.scope)||
      receipt.scope.weightedStressSelectorComputed!==false||receipt.scope.physicalResidualSelectorComputed!==false||receipt.scope.fullOriginalProposition55Certified!==false||receipt.scope.originalN506Complete!==false)throw Error('Actual all-order completed C2 program or its preserved narrower scope did not replay.');
    for(const file of im.files)await bindImports(file.path);
    await writeAudit('actual-residual-order-induction-release-executed.json',{schema:'MathScope.ActualCompletedBackgroundReleaseAudit/1',pass:true,checks:4181,
      frozenEvidence:{path:'navier/evidence/'+inductionFrozen.file,sha256:inductionFrozen.sha256},sourceByteVerification:{files:inductionBoundFiles,match:true},
      independentExecution:audit,receiptReplay:{storedHash,currentHash,programCanonicalSHA256,programNodeCount,match:true},scope:receipt.scope},{nodeTests:26,independentChecks:4181});
  }
  {
    const files=[];for(const f of [
      {path:'actual-covariance-concentration.mjs',sha256:'154460fb7d11eee113a2bd7f4d5a0f839824331f955775923291d4ab14104934'},
      {path:'tests/actual-covariance-concentration.test.mjs',sha256:'306774894ab1322005dd423252c65989e8f935ad3b5b8195d3486925ce7687b9'}
    ]){files.push(await bindFile(f));await bindImports(f.path);}
    const {covarianceConcentrationScalarAudit}=await import(new URL('actual-covariance-concentration.mjs',base)),scalar=covarianceConcentrationScalarAudit();
    if(!scalar.pass||scalar.checks.length!==12||!scalar.checks.every(r=>r.pass)||scalar.sourceFieldCertificate!==false)throw Error('The conditional continuum covariance lemma lost its exact scalar checks or scope.');
    await writeAudit('actual-covariance-concentration-executed.json',{schema:'MathScope.CovarianceConcentrationLemmaReleaseAudit/1',pass:true,sourceByteVerification:{files,match:true},scalar,
      independentPythonChecksClaimed:0,scope:{conditionalAnalyticLemma:true,actualOperatorBoundsProducedHere:false,actualUniformHColumnsCertified:false,sourceUniformQStarCertified:false,originalN506Complete:false,numericQuadratureExecuted:false,formalKernelProof:false}},{nodeTests:8});
  }
  {
    const f=await frozen('actual-covariance-global-assembly.json','58a3cccfc8f602c21d4c78cac50c71c1a5fb64cf252f1507d226dfead858ac96'),r=f.data;
    if(r.nodeTests.tests!==8||r.nodeTests.pass!==8||r.nodeTests.fail!==0||r.independentPythonChecksClaimed!==0)throw Error('Incomplete or overstated frozen global assembly lemma.');
    const files=[];for(const file of r.files){files.push(await bindFile(file));await bindImports(file.path);}
    const {ActualSourceExpressions}=await import(new URL('actual-global-source-expressions.mjs',base)),
      {sourceSquaredProductPartition,covarianceGlobalAssemblyRecipe}=await import(new URL('actual-covariance-global-assembly.mjs',base));
    const G=new ActualSourceExpressions(),coordinates=Array.from({length:10},(_,i)=>G.var('partition_offset_'+i)),h=G.parameter('h'),q=G.var('q'),ell=G.var('ell'),
      bandQ=G.exp(G.neg(G.mul(ell,G.log(G.q(2))))),target=[G.var('T0theta'),G.var('T0z')],
      partition=sourceSquaredProductPartition(G,{bandOffset:coordinates[0],meshOffsets:[coordinates.slice(1,4),coordinates.slice(4,7),coordinates.slice(7,10)]}),
      assembly=covarianceGlobalAssemblyRecipe(G,{h,q,Q:bandQ,target,partition}),program=G.pack({partition:partition.expandedSquaredSum,...assembly.roots}),
      receipt={schema:'MathScope.ExactCovarianceGlobalAssemblyLemma/1',program,partition,assembly},currentHash=await sha256(canonicalStringify(receipt)),storedHash=await sha256(canonicalStringify(r.receipt));
    if(currentHash!==storedHash||storedHash!==r.receiptSHA256||!assembly.checks.every(x=>x.pass)||assembly.scope.conditionalAssemblyLemma!==true||assembly.scope.actualEveryBoxHCertified!==false||assembly.scope.sourceUniformQStarCertified!==false||assembly.scope.actualGlobalEquation730Certified!==false||assembly.scope.originalN506Complete!==false)throw Error('The complete partition/physical-scale lemma changed its source-independent receipt or scope.');
    await writeAudit('actual-covariance-global-assembly-executed.json',{schema:'MathScope.CovarianceGlobalAssemblyLemmaReleaseAudit/1',pass:true,
      frozenEvidence:{path:'navier/evidence/'+f.file,sha256:f.sha256},sourceByteVerification:{files,match:true},receiptReplay:{storedHash,currentHash,match:true},
      independentPythonChecksClaimed:0,scope:assembly.scope},{nodeTests:8});
  }
  // The main acceptance binds these current transitive bytes as well. All
  // historical source receipts remain unchanged, including their false H,
  // q-star, weighted-stress and full-Proposition-5.5 subclaims.
  const transitive=[...imports.values()].sort((a,b)=>a.path.localeCompare(b.path));
  supportingSourceEvidence.push({kind:'CURRENT_TRANSITIVE_SUPPORTING_SOURCE_BYTES',files:transitive,independentChecks:0});
}
// END FROZEN_SUPPORTING_CERTIFICATES
// The final actual-source family closes N5-06. Its universal domain is
// certified by the retained source construction, not by promoting the
// finite displayed member or the independent numeric fixtures to a family.
{
  const manifestPath='evidence/actual-covariance-source.json',manifestBytes=await readFile(new URL(manifestPath,base)),
    manifestSHA256=createHash('sha256').update(manifestBytes).digest('hex'),manifest=JSON.parse(manifestBytes.toString('utf8')),
    repo=new URL('../../../',base),boundFiles=new Map();
  if(manifestSHA256!=='d321fd9151e495abb48c5d1f6a49ebde9d4720b300845aa428ae49fbb11ea36a'||
    manifest.status!=='PASS'||manifest.evidenceGrade!=='THEOREM-BACKED'||manifest.nodeTests.tests!==22||
    manifest.nodeTests.skipped!==0||!manifest.nodeTests.pass||manifest.wholeHDecimalQuadratureClaim!==false)throw Error('The frozen actual covariance source manifest changed or overstates its evidence.');
  newSourcePaths.push(manifestPath);
  for(const file of [...manifest.files,...manifest.runtimeDependencies,...manifest.sourceIndependentReview.sourceFiles]){
    const url=new URL(file.path,repo),bytes=await readFile(url),digest=createHash('sha256').update(bytes).digest('hex');
    if(bytes.length!==file.bytes||digest!==file.sha256)throw Error('Stale actual covariance source bytes: '+file.path);
    boundFiles.set(file.path,{path:file.path,bytes:bytes.length,sha256:digest});
    newSourcePaths.push(relative(fileURLToPath(base),fileURLToPath(url)).replaceAll('\\','/'));
  }
  const compressed=await readFile(new URL(manifest.graph.compressedProgram.path,repo)),programBytes=gunzipSync(compressed),
    programSHA256=createHash('sha256').update(programBytes).digest('hex'),program=JSON.parse(programBytes.toString('utf8'));
  if(programSHA256!==manifest.graph.sha256||programBytes.length!==manifest.graph.canonicalBytes||
    program.nodes.length!==manifest.graph.nodeCount||program.parameterExpressionSHA256!==manifest.parameterExpressionSHA256)throw Error('The retained full actual covariance graph does not match its sealed manifest.');
  const current=await actualCovarianceFamilyCertificate(),stored=JSON.parse(await readFile(new URL('actual-covariance-source-certificate.json',out),'utf8')),
    currentCanonical=canonicalStringify(current),storedCanonical=canonicalStringify(stored);
  if(currentCanonical!==storedCanonical||Buffer.byteLength(currentCanonical)!==manifest.graph.packetBytes||
    current.graph.sha256!==programSHA256||current.graph.nodeCount!==program.nodes.length||
    current.graph.canonicalBytes!==programBytes.length||canonicalStringify(current.graph.rootIds)!==canonicalStringify(program.roots))throw Error('The final actual covariance family did not reproduce the complete sealed graph and compact receipt.');
  const s=current.scope,e=current.exercisedMember;
  if(!current.pass||current.checks.length!==26||!current.checks.every(c=>c.pass)||!current.uniformFamily.certified||
    !s.originalN506Complete||!s.actualSourceFamilyAuthenticated||!s.actualUniformHColumnsCertified||!s.actualEveryCertifiedBoxPositiveInverse||
    !s.sourceUniformQStarCertified||!s.globalEquation730Certified||s.actualNumericalWholeHQuadrature!==false||
    s.allSlowDerivativeBoundsComputed!==false||s.fullNavierStokesSolutionOrRegularityClaim!==false||s.newLeanKernelProof!==false||
    s.exercisedMemberProvedInCertifiedDomain!==false||e.certifiedBandMembership!==false||
    e.determinantNonzeroForThisMemberCertified!==false||e.positivityOfThisMemberCertified!==false||
    e.finiteTermsEqualSolution!==false||e.nonzeroTailRetained!==true||
    canonicalStringify(s)!==canonicalStringify(manifest.scope)||
    canonicalStringify(current.uniformFamily.global730.exactResidual)!==canonicalStringify(['0','0']))throw Error('The final actual covariance family lost its certified scope or retained an overstated finite-member claim.');
  const review=JSON.parse(await readFile(new URL('actual-covariance-source-review.json',out),'utf8')),
    replay=JSON.parse(await readFile(new URL('actual-covariance-source-replay.json',out),'utf8'));
  if(canonicalStringify(review)!==canonicalStringify(manifest.sourceIndependentReview)||!review.execution.allPass||
    canonicalStringify(replay)!==canonicalStringify(manifest.replay)||!replay.defaultEqualsExplicit||
    replay.graphs[0]!==programSHA256||replay.graphs[2]!==programSHA256||new Set(replay.thresholds).size!==1)throw Error('The bound source review or mixed-request replay is inconsistent with the release.');
  // Execute the independent oracle against this newly reconstructed packet.
  // Its default /tmp input is deliberately not used by release generation.
  const temporary=await mkdtemp(join(tmpdir(),'mathscope-actual-covariance-release-'));
  let audit;
  try{
    const input=join(temporary,'actual-source.json');await writeFile(input,currentCanonical+'\n');
    const executed=spawnSync('python',[fileURLToPath(new URL('actual-covariance-source-independent.py',import.meta.url)),'--source',input],{encoding:'utf8',maxBuffer:4*1024*1024});
    if(executed.status!==0)throw Error('Independent final actual covariance checks failed: '+executed.stderr);
    audit=JSON.parse(executed.stdout);
  }finally{await rm(temporary,{recursive:true,force:true});}
  const independentStored=JSON.parse(await readFile(new URL('actual-covariance-source-independent.json',import.meta.url),'utf8'));
  if(!audit.pass||audit.checks!==1144||audit.sourceGraphSHA256!==programSHA256||
    audit.sourceParameterSHA256!==manifest.parameterExpressionSHA256||
    canonicalStringify(audit)!==canonicalStringify(manifest.independent)||
    canonicalStringify(audit)!==canonicalStringify(independentStored))throw Error('The independently executed final source oracle differs from its frozen result.');
  const file='actual-covariance-source-executed.json',body={schema:'MathScope.ActualCovarianceSourceReleaseAudit/1',pass:true,
    originalCriterion:current.originalCriterion,evidenceGrade:'THEOREM-BACKED',checks:audit.checks,
    sourceManifest:{path:'navier/'+manifestPath,sha256:manifestSHA256},
    sourceByteVerification:{files:[...boundFiles.values()],match:true},
    retainedFullGraph:{compressed:manifest.graph.compressedProgram,sha256:programSHA256,canonicalBytes:programBytes.length,nodeCount:program.nodes.length,rootIdsMatch:true},
    currentSourceReplay:{request:current.graph.compilerInput,compactReceiptSHA256:await sha256(currentCanonical),graphSHA256:current.graph.sha256,match:true},
    runtimeChecks:{pass:true,checks:current.checks.length},independentExecution:audit,
    mixedRequestReplay:replay,independentSourceReview:{path:'navier/evidence/actual-covariance-source-review.json',allPass:review.execution.allPass,countedInIndependentTotal:false},
    uniformFamilyDomain:current.uniformFamily.certifiedDomain,exercisedMember:e,scope:s};
  const serialized=JSON.stringify(body,null,2)+'\n';await writeFile(new URL(file,out),serialized);
  additionalIndependent.push({file,checks:audit.checks,sha256:await sha256(serialized),verification:'EXECUTED_INDEPENDENT_FRACTION_DECIMAL_ACTUAL_SOURCE_AUDIT_PLUS_FULL_SOURCE_GRAPH_REPLAY_AND_ALL_CURRENT_BOUND_BYTE_HASHES'});
  supportingSourceEvidence.push({kind:'FINAL_ACTUAL_COVARIANCE_SOURCE_FAMILY',file,nodeTests:22,independentChecks:1144,runtimeChecks:26,
    originalCriterion:'N5-06',originalCriterionComplete:true,uniformFamilyDomain:current.uniformFamily.certifiedDomain,scope:s});
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
for(const name of sourceFiles)sourceHashes[name]=createHash('sha256').update(await readFile(new URL(name,base))).digest('hex');
const convergence=[];
for(const steps of[32,64,128,256]){const r=await executeDomain({kind:'ns.pulse-ode',input:{steps}});convergence.push({stepsPerHalf:steps,...r.results.diagnostics});}
const negativeCovariance=await executeDomain({kind:'ns.pulse-covariance',input:{target:[1,0]}});
const checklist=getChecklist(),criterionCounts=Object.fromEntries(['PASS','PARTIAL','OPEN'].map(status=>[status,checklist.filter(x=>x.status===status).length]));
const independentTotal=independentEvidence.total+additionalIndependent.reduce((n,x)=>n+x.checks,0);
const body={schema:'MathScope.M2.NavierAcceptance/3',generatedAt:new Date().toISOString(),source:BLUEPRINT_SOURCE,sourceHashes,testEvidence:{runner:'node --test --test-reporter=tap',suites:testSuites,file:'tests.tap',total:totalTests,pass:passedTests,fail:0,sha256:await sha256(testResult.stdout+testResult.stderr),scope:'LOCAL_NODE_DOMAIN_AND_ENGINE_REPLAY; browser/worker integration is verified separately by the page build.'},independentEvidence:{file:'source-independent-checks.json',sha256:await sha256(JSON.stringify(independentEvidence,null,2)+'\n'),checks:independentEvidence.total,exactPhysicalPdeComparisons:independentEvidence.pdeExactMatches,additional:additionalIndependent,totalChecks:independentTotal},supportingSourceEvidence,exactSourceEvidence:{file:'source-exact-identities.json',sha256:await sha256(JSON.stringify(exactEvidence,null,2)+'\n')},archive:getCapabilities().n3Profile,examples:records,convergence,negativeControls:{outsideCone:{status:negativeCovariance.status,weights:negativeCovariance.results.weights,checks:negativeCovariance.checks}},checklist,criterionCounts,acceptance:'ALL_16_ORIGINAL_N4_N5_CRITERIA_COMPLETE_WITH_SOURCE_BOUND_CONSTRUCTIONS_AND_UNIFORM_ACTUAL_COVARIANCE_FAMILY; FULL_PHYSICAL_PDE_AND_NEW_LEAN_PROOF_ARE_OUTSIDE_THIS_GATE',originalCriteriaComplete:criterionCounts.PASS===16&&criterionCounts.PARTIAL===0&&criterionCounts.OPEN===0,packageCompletionGate:false,sourceInstanceCertified:false,allOrderSourceCertificate:false,fullN4:false,fullN5:false,formalComplete:false,globalNavierStokesConstruction:false};
await writeFile(new URL('acceptance.json',out),JSON.stringify({...body,artifactHash:await sha256(canonicalStringify(body))},null,2)+'\n');
process.stdout.write(JSON.stringify({tests:totalTests,passed:passedTests,independentChecks:independentTotal,examples:records.length,criterionCounts:body.criterionCounts,sourceFiles:sourceFiles.length,output:fileURLToPath(out)},null,2)+'\n');
