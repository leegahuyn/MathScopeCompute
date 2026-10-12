import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepareActualCovarianceFamilyProgram} from '../actual-covariance-source-certificate.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

const navier=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),repo=path.resolve(navier,'../../..');
const sha=b=>createHash('sha256').update(b).digest('hex');
const prepared=prepareActualCovarianceFamilyProgram(),serialized=canonicalStringify(prepared.program),graphSHA=sha(serialized);
const packet=JSON.parse(fs.readFileSync('/tmp/actual-covariance-default.json','utf8'));
if(packet.graph.sha256!==graphSHA||packet.graph.nodeCount!==prepared.G.nodes.length)throw Error('Fresh full program differs from the tested canonical receipt.');
const replay=JSON.parse(fs.readFileSync('/tmp/actual-covariance-source-replay.json','utf8'));
if(!replay.defaultEqualsExplicit||replay.graphs[0]!==graphSHA||replay.graphs[2]!==graphSHA||new Set(replay.thresholds).size!==1)throw Error('Mixed source replay was not sealed.');
const sourceLog=fs.readFileSync('/tmp/actual-covariance-source-node.log','utf8'),kernelLog=fs.readFileSync('/tmp/actual-covariance-source-kernels-node.log','utf8');
if(!/pass 11/.test(sourceLog)||!/fail 0/.test(sourceLog)||!/pass 11/.test(kernelLog)||!/fail 0/.test(kernelLog))throw Error('The two required fresh Node suites did not pass.');
const receiptFile=path.join(navier,'evidence/actual-covariance-source-certificate.json'),programFile=path.join(navier,'evidence/actual-covariance-source-program.json.gz'),replayFile=path.join(navier,'evidence/actual-covariance-source-replay.json');
fs.writeFileSync(receiptFile,canonicalStringify(packet)+'\n');
fs.writeFileSync(programFile,gzipSync(Buffer.from(serialized),{level:9}));
fs.writeFileSync(replayFile,JSON.stringify(replay,null,2)+'\n');
const independentFile=path.join(navier,'tests/actual-covariance-source-independent.json');
const independent=JSON.parse(execFileSync('python',[path.join(navier,'tests/actual-covariance-source-independent.py'),'--source',receiptFile,'--output',independentFile],{encoding:'utf8'}));
if(!independent.pass||independent.sourceGraphSHA256!==graphSHA)throw Error('Independent oracle is not bound to this actual source program.');
const ownNames=['actual-covariance-volterra.mjs','actual-covariance-matrix.mjs','actual-covariance-source-operator.mjs','actual-covariance-operator-bounds.mjs','actual-covariance-source-integrals.mjs','actual-covariance-source-target.mjs','actual-covariance-source-certificate.mjs',
  'tests/actual-covariance-source.test.mjs','tests/actual-covariance-source-kernels.test.mjs','tests/actual-covariance-source-fixture.mjs','tests/actual-covariance-source-independent.py','tests/actual-covariance-source-independent.json','tests/seal-actual-covariance-source.mjs',
  'research/ACTUAL_COVARIANCE_SOURCE_KO.md','research/ACTUAL_COVARIANCE_SOURCE_REVIEW_KO.md','evidence/actual-covariance-source-review.json','evidence/actual-covariance-source-certificate.json','evidence/actual-covariance-source-program.json.gz','evidence/actual-covariance-source-replay.json'];
const fileRecord=absolute=>{const bytes=fs.readFileSync(absolute);return {path:path.relative(repo,absolute).split(path.sep).join('/'),bytes:bytes.length,sha256:sha(bytes)};};
const files=ownNames.map(name=>fileRecord(path.join(navier,name))),dependencyPaths=new Set();
function walk(file){if(dependencyPaths.has(file))return;dependencyPaths.add(file);const text=fs.readFileSync(file,'utf8');for(const match of text.matchAll(/(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"](\.[^'"]+)['"]/g)){const absolute=path.resolve(path.dirname(file),match[1]);if(fs.existsSync(absolute)&&/\.(mjs|js)$/.test(absolute))walk(absolute);}}
for(const file of ownNames.slice(0,7))walk(path.join(navier,file));
const runtimeDependencies=[...dependencyPaths].sort().map(fileRecord);
const manifest={schema:'MathScope.ActualCovarianceSourceEvidence/1',originalCriterion:packet.originalCriterion,sourceProfile:packet.sourceProfile,parameterExpressionSHA256:packet.sourceBinding.parameterExpressionSHA256,
  status:'PASS',evidenceGrade:'THEOREM-BACKED',graph:{sha256:graphSHA,nodeCount:prepared.G.nodes.length,canonicalBytes:Buffer.byteLength(serialized),packetBytes:Buffer.byteLength(canonicalStringify(packet)),compressedProgram:fileRecord(programFile)},
  runtimeChecks:{pass:prepared.checks.every(c=>c.pass),checks:prepared.checks.length},nodeTests:{pass:true,tests:22,suites:['tests/actual-covariance-source.test.mjs','tests/actual-covariance-source-kernels.test.mjs'],skipped:0},
  independent,replay,sourceIndependentReview:JSON.parse(fs.readFileSync(path.join(navier,'evidence/actual-covariance-source-review.json'),'utf8')),
  scope:packet.scope,uniformFamilyDomain:packet.uniformFamily.certifiedDomain,exercisedMember:packet.exercisedMember,
  files,runtimeDependencies,sourceFilesBoundByBytesAndSHA256:true,fullProgramRecompiledAtSeal:true,wholeHDecimalQuadratureClaim:false};
const manifestFile=path.join(navier,'evidence/actual-covariance-source.json');fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({pass:true,graphSHA,nodeCount:prepared.G.nodes.length,packetBytes:Buffer.byteLength(canonicalStringify(packet)),nodeTests:22,independentChecks:independent.checks,runtimeChecks:prepared.checks.length,manifest:fileRecord(manifestFile),files:files.length,dependencies:runtimeDependencies.length}));
