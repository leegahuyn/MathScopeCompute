import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {implementationPin} from '../../../research-ide/mathscope-m3/navier/implementation-pin.mjs';
import {inheritedSource} from '../../../research-ide/mathscope-m3/navier/source-inheritance.mjs';

// Read-only validation. The Linux builders and Worker tests are unchanged.
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
const readJSON=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const row=path=>{const raw=fs.readFileSync(path);return {path,bytes:raw.length,sha256:sha(raw)};};
const assertRow=(expected,path=expected.path)=>{const actual=row(path);assert.equal(actual.bytes,expected.bytes,path);assert.equal(actual.sha256,expected.sha256,path);};
const web='research-ide/mathscope-m3/web/';
const enginePath=web+'extended-engine.bundle.js', dataPath=web+'extended-build-data.json';
const expectedAssets=[
  {path:enginePath,bytes:12261640,sha256:'0102abd3a05a5f756f126f0c6972b9fbf7f916043171c91722394bf9b4198205'},
  {path:dataPath,bytes:344699,sha256:'5f95dce24158487843eb19cf5459a4b3de002823279b21b946fdf8764ebb5223'},
];
expectedAssets.forEach(x=>assertRow(x));
const build=readJSON(dataPath), old=JSON.parse(execFileSync('git',['show','HEAD:'+dataPath],{maxBuffer:1048576}).toString('utf8'));
assert.equal(build.schema,'MathScope.M3.ExtendedBuild/1');
assert.equal(build.wholeM3Complete,false);
assert.equal(build.criteria.length,48);
assert.deepEqual({...build,sourceBinding:null},{...old,sourceBinding:null},'Only source-binding metadata may change in this candidate.');
const binding=build.sourceBinding, files=binding.files;
assert.equal(binding.schema,'MathScope.M3.ExtendedSourceBinding/1');
assert.equal(binding.branch,'mathscope-m3-resume-20261013');
assert.equal(binding.p7SourceChanged,false);
assert.equal(new Set(files.map(x=>x.path)).size,files.length);
assert.deepEqual(files.map(x=>x.path),old.sourceBinding.files.map(x=>x.path));
assert.equal(sha(stable(files)),binding.manifestSHA256);
assert.equal(binding.manifestSHA256,'192762b641188525167acb2c827d6933e66e7274a72b93e03508425b163e72a9');
for(const x of files){assert.ok(!x.path.includes('..')&&!x.path.startsWith('/')&&!x.path.includes('\\'));assertRow(x,'research-ide/'+x.path);}
const delta=files.filter((x,i)=>stable(x)!==stable(old.sourceBinding.files[i]));
assert.deepEqual(delta.map(x=>x.path),['mathscope-m3/navier/implementation-pin.mjs']);
const pinPath='research-ide/mathscope-m3/navier/implementation-pin.mjs';
assertRow({path:pinPath,bytes:19811,sha256:'d9de0c6360de87d32b0fbef7b0b1eb0efb7bb61844bc16dcdc7a800fbb0ba7e9'});
assert.equal(implementationPin.files.length,117);
assert.equal(implementationPin.sha256,'af3b228423340a1711fc1a6729b88912063b22e8c9067b767ffef5e0fc1ebdd1');
assert.equal(sha(stable(implementationPin.files)),implementationPin.sha256);
const rootModules=fs.readdirSync('research-ide/mathscope-m3/navier').filter(x=>x.endsWith('.mjs')).sort().map(x=>'research-ide/mathscope-m3/navier/'+x);
assert.equal(rootModules.length,118);
assert.deepEqual(implementationPin.files.map(x=>x.path),rootModules.filter(x=>x!==pinPath));
implementationPin.files.forEach(x=>assertRow(x));
const capture=readJSON('research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291/source-bytes-before.json');
assert.equal(capture.files.length,155);
assert.equal(capture.files.some(x=>x.path===pinPath),false);
capture.files.forEach(x=>assertRow(x));
const {sourceFileChecks,...small}=readJSON('research-ide/mathscope-m3/navier/source-inheritance.json');
small.sourceFileCheckCount=sourceFileChecks.length;
assert.deepEqual(inheritedSource,small);
const m2=[
  {path:'research-ide/mathscope-m2/navier/research/evidence/m2-final-completion-20261011/M2_FINAL_COMPLETION.json',bytes:10121,sha256:'aad34e553582c48778684e9b2ddd18e7fcdb016e9282f44c5f39a3b670586ad7'},
  {path:'research-ide/mathscope-m2/navier/research/evidence/common-physical-package-20261011/actual-common-physical-package-source-attempt6.json',bytes:4495330,sha256:'ac98143158c9e7abc6bd656e687269f183bb803ecdc036edb8a3937edc24bc01'},
  {path:'research-ide/mathscope-m2/navier/research/evidence/physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt4.json',bytes:161629,sha256:'88f7cf6fe5af934d6b3bcacc8ad975e86bd0b37fee2110b9db8c73e72acb129e'},
];
m2.forEach(x=>assertRow(x));
const linuxDir='docs/evidence/metadata-phase4-20261013/linux-generated-assets/attempt-202610131142193402430000/';
const linux=readJSON(linuxDir+'receipt.json');
assert.equal(linux.passed,true);assert.equal(linux.sourceStable,true);
assert.equal(linux.published,false);assert.equal(linux.publicV103WorkerReplaced,false);
assert.equal(linux.mathematicalCriteriaPromoted,false);
assert.deepEqual(linux.modulesBefore,linux.modulesAfter);
assert.equal(linux.modulesAfter.length,118);
assert.deepEqual(linux.modulesAfter.map(x=>x.path),rootModules);
linux.modulesAfter.forEach(x=>assertRow(x));
assert.deepEqual(linux.outputsAfter,expectedAssets);
assert.equal(linux.sourceManifestSHA256,binding.manifestSHA256);
for(let i=0;i<linux.commands.length;i++){const x=linux.commands[i];assert.equal(x.exitCode,0);assert.equal(x.timeout,false);assert.equal(sha(fs.readFileSync(linuxDir+i+'-stdout.log')),x.stdoutSHA256);assert.equal(sha(fs.readFileSync(linuxDir+i+'-stderr.log')),x.stderrSHA256);}
for(const x of linux.outputsBefore){const blob=execFileSync('git',['show','HEAD:'+x.path],{maxBuffer:16777216});assert.equal(blob.length,x.bytes);assert.equal(sha(blob),x.sha256);}
const testPath=web+'tests/extended-worker.test.mjs', testRaw=fs.readFileSync(testPath), originalTest=execFileSync('git',['show','HEAD:'+testPath]);
assert.deepEqual(testRaw,originalTest,'The eleven Worker tests must remain unchanged.');
// The exact validators above must reject source and digest mutation.
assert.throws(()=>assertRow({...delta[0],bytes:delta[0].bytes+1},pinPath));
assert.throws(()=>assertRow({...delta[0],sha256:'0'.repeat(64)},pinPath));
assert.notEqual(sha(stable(files.map((x,i)=>i===0?{...x,sha256:'0'.repeat(64)}:x))),binding.manifestSHA256);
console.log(JSON.stringify({schema:'MathScope.M3.GeneratedAssetIndependentCheck/1',status:'PASS',assets:expectedAssets,sourceManifestSHA256:binding.manifestSHA256,boundSourceFiles:files.length,sourceBindingMembershipUnchanged:true,changedBindingPaths:delta.map(x=>x.path),rootModules:118,implementationPinRows:117,implementationPinSHA256:implementationPin.sha256,original155SourceBytesMatched:true,m2Receipts:m2,original48CriteriaUnchanged:true,linuxBuilderLogsAuthenticated:true,workerTestUnchanged:row(testPath),negativeControls:{changedByteCountRejected:true,changedSourceSHARejected:true,changedManifestRowRejected:true},published:false,publicV103WorkerReplaced:false,mathematicalCriteriaPromoted:false}));
