/** Repository evidence generator; never imported by a browser runtime. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {actualBackgroundMomentCertificate} from '../actual-continuation-exact-certificate.mjs';

const here=dirname(fileURLToPath(import.meta.url)),repo=resolve(here,'../../../..'),base=resolve(here,'..');
const suites=['actual-continuation-exact.test.mjs','actual-continuation-global.test.mjs','actual-continuation-stress.test.mjs','actual-continuation-functions.test.mjs','actual-continuation-certificate.test.mjs'];
const nodeRun=spawnSync(process.execPath,['--test','--test-reporter=tap',...suites.map(p=>resolve(here,p))],{cwd:repo,encoding:'utf8',maxBuffer:16*1024*1024,timeout:120000});
const tap=(nodeRun.stdout??'')+(nodeRun.stderr??'');
await writeFile(resolve(here,'actual-continuation-test-results.tap'),tap);
if(nodeRun.error||nodeRun.status!==0)throw Error('Actual continuation Node validation failed: '+(nodeRun.error?.message??tap.slice(-3000)));
const tests=Number(tap.match(/^# tests (\d+)$/m)?.[1]),passed=Number(tap.match(/^# pass (\d+)$/m)?.[1]),failed=Number(tap.match(/^# fail (\d+)$/m)?.[1]);
if(tests!==49||passed!==49||failed!==0)throw Error('Unexpected actual continuation test totals.');
const py=spawnSync('python',[resolve(here,'actual-continuation-conservation-independent.py'),resolve(here,'actual-continuation-conservation-independent.json')],{cwd:repo,encoding:'utf8',timeout:120000});
if(py.error||py.status!==0)throw Error('Independent Fraction conservation validation failed: '+py.stderr);
const independent=JSON.parse(await readFile(resolve(here,'actual-continuation-conservation-independent.json'),'utf8'));
if(!independent.pass||independent.identityChecks!==12||independent.negativeControls!==12)throw Error('Unexpected independent conservation totals.');
const started=performance.now(),certificate=await actualBackgroundMomentCertificate(),elapsedMs=performance.now()-started;
const publicBytes=new TextEncoder().encode(JSON.stringify(certificate)).length;
const upperStarted=performance.now(),upper=await actualBackgroundMomentCertificate({terms:2,bits:4096,etaOrder:2,heatIterations:2}),upperElapsedMs=performance.now()-upperStarted;
if(!certificate.pass||!upper.pass)throw Error('The actual constructive certificate did not pass.');
const evidence={schema:'MathScope.ActualMomentRestorationEvidence/1',criterion:'N4-04',sourceProfile:certificate.profileId,parameterExpressionSHA256:certificate.parameterExpressionSHA256,
  validation:{node:{tests,passed,failed,report:'tests/actual-continuation-test-results.tap'},independent:{identityChecks:12,negativeControls:12,pass:independent.pass,report:'tests/actual-continuation-conservation-independent.json'},
    defaultExecution:{elapsedMs,publicBytes,nodeCount:certificate.graph.nodeCount,fullProgramBytes:certificate.graph.serializedProgramBytes,fullProgramSHA256:certificate.graph.sha256},
    maximumPublicInput:{request:upper.request,elapsedMs:upperElapsedMs,publicBytes:new TextEncoder().encode(JSON.stringify(upper)).length,nodeCount:upper.graph.nodeCount,fullProgramBytes:upper.graph.serializedProgramBytes,fullProgramSHA256:upper.graph.sha256,pass:upper.pass},
    runtime:{node:process.version,platform:process.platform,architecture:process.arch},browserValidationIncluded:false},
  scope:{exactActualOrders:[1,2],originalFiniteN404CriterionVerified:true,allOrdersConstructed:false,signedGlobalMomentValuesNumericallyEnclosed:false,formalNSThereomProved:false},
  certificate,pass:true};
await mkdir(resolve(base,'evidence'),{recursive:true});
const evidencePath=resolve(base,'evidence/actual-moment-restoration.json');
await writeFile(evidencePath,JSON.stringify(evidence,null,2)+'\n');

const digest=bytes=>createHash('sha256').update(bytes).digest('hex'),seen=new Map();
async function dependencies(path){
  if(seen.has(path))return;
  const bytes=await readFile(path),source=bytes.toString('utf8');
  seen.set(path,{path:relative(repo,path),bytes:bytes.length,sha256:digest(bytes)});
  const imports=[...source.matchAll(/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g)].map(m=>m[1]);
  for(const name of imports){
    if(!name.startsWith('.'))throw Error('Unexpected browser-runtime external import '+name+' in '+path);
    await dependencies(resolve(dirname(path),name));
  }
}
await dependencies(resolve(base,'actual-continuation-exact-certificate.mjs'));
const evidenceFiles=[evidencePath,resolve(base,'research/ACTUAL_MOMENT_RESTORATION_KO.md'),resolve(here,'seal-actual-continuation.mjs'),resolve(here,'actual-continuation-conservation-independent.py'),resolve(here,'actual-continuation-conservation-independent.json'),resolve(here,'actual-continuation-test-results.tap'),...suites.map(p=>resolve(here,p))];
const artifacts=[];for(const path of evidenceFiles){const bytes=await readFile(path);artifacts.push({path:relative(repo,path),bytes:bytes.length,sha256:digest(bytes)});}
const manifest={schema:'MathScope.ActualContinuationExactManifest/1',entry:relative(repo,resolve(base,'actual-continuation-exact-certificate.mjs')),profileId:certificate.profileId,
  runtimeDependencies:[...seen.values()].sort((a,b)=>a.path.localeCompare(b.path)),artifacts:artifacts.sort((a,b)=>a.path.localeCompare(b.path)),
  program:{sha256:certificate.graph.sha256,nodeCount:certificate.graph.nodeCount,bytes:certificate.graph.serializedProgramBytes,request:certificate.request},
  meaning:'Frozen source-file hashes plus the reproducible complete actual function-program digest. No live HTML digest or numerical signed-moment value is asserted.',
  validation:{nodeTests:tests,independentExactIdentities:12,independentNegativeControls:12,browserTestsIncluded:false},pass:true};
await writeFile(resolve(here,'actual-continuation-exact-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({pass:true,nodeTests:tests,independent:24,default:{elapsedMs,publicBytes,...manifest.program},upper:{elapsedMs:upperElapsedMs,request:upper.request,nodeCount:upper.graph.nodeCount,publicBytes:evidence.validation.maximumPublicInput.publicBytes},runtimeFiles:seen.size}));
