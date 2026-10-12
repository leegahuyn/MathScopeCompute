/** Checks a trusted build's recorded CI receipt; never executes or authenticates a proof. */
import {assertJSON,canonicalJSON,sha256,shape,freeze} from './common.mjs';

const HASH=/^[a-f0-9]{64}$/, COMMIT=/^[a-f0-9]{40}$/;
const STANDARD=['Classical.choice','Quot.sound','propext'];
const SOURCE_PREFIX='mathscope-m3/p8/';
const TARGET_PREFIX='MathScope.P8.';
const safePath=p=>typeof p==='string'&&/^[A-Za-z0-9_./-]+$/.test(p)&&!p.startsWith('/')&&!p.split('/').some(x=>x==='.'||x==='..'||!x);
const same=(a,b)=>canonicalJSON(a)===canonicalJSON(b);
const hash=(x,label)=>{if(typeof x!=='string'||!HASH.test(x))throw Error(label+' must be a SHA-256.');};
const required=(condition,message)=>{if(!condition)throw Error(message);};
const sorted=x=>x.slice().sort();
const noAuthority={freshKernelExecuted:false,formalLeanProofIssued:false,certificateIssued:false,wholeP8Complete:false,wholeM3Complete:false};

function uniqueRows(rows,key,label){
  required(Array.isArray(rows)&&rows.length>0&&rows.length<=512,label+' must be nonempty and bounded.');
  const map=new Map();for(const row of rows){required(row&&typeof row==='object'&&!Array.isArray(row),label+' row must be an object.');required(typeof row[key]==='string'&&!map.has(row[key]),label+' has an invalid or duplicate identity.');map.set(row[key],row);}return map;
}
function ciCheck(ci){
  shape(ci,['repository','commit','runId','url'],[],'expected CI identity');
  required(ci.repository==='leegahuyn/MathScopeCompute','Unexpected CI repository.');
  required(typeof ci.commit==='string'&&COMMIT.test(ci.commit),'CI commit must be an exact commit SHA.');
  required((typeof ci.runId==='string'&&/^[1-9][0-9]{0,19}$/.test(ci.runId))||(Number.isSafeInteger(ci.runId)&&ci.runId>0),'CI run ID is invalid.');
  required(ci.url===`https://github.com/${ci.repository}/actions/runs/${ci.runId}`,'CI URL must name the exact expected repository and run.');
}
function checkAxioms(target){
  shape(target.axioms,['all','standard','custom'],[],'target axiom report');
  for(const values of Object.values(target.axioms))required(Array.isArray(values)&&values.length<=32&&values.every(x=>typeof x==='string')&&new Set(values).size===values.length,'Malformed or duplicate target axioms.');
  required(target.axioms.all.every(x=>STANDARD.includes(x)),'Unconditional finite target contains a custom, native, or placeholder axiom.');
  required(target.axioms.custom.length===0&&same(sorted(target.axioms.all),sorted(target.axioms.standard)),'Target axiom partition is inconsistent.');
}

export async function validateRecordedLean(evidence,sourceBinding,expectedContract){
  if(!evidence||evidence.status==='NOT_YET_RECORDED')return freeze({ok:false,status:'NO_RECORDED_AUDIT',issues:[],...noAuthority});
  const issues=[];let stale=false;
  try{
    assertJSON({evidence,sourceBinding,expectedContract},16*1024*1024);
    shape(expectedContract,['schema','sourceFiles','targets','pins','negativeNames','input','inputManifestSha256','generatedSourceSHA256','ci','auditSHA256'],[],'expected Lean contract');
    required(expectedContract.schema==='MathScope.M3.P8.ExpectedLeanContract/1','Unexpected Lean contract schema.');
    required(evidence.status==='RECORDED_CI_AUDIT','Unsupported recorded evidence status.');
    ciCheck(expectedContract.ci);ciCheck(evidence.ci);required(same(evidence.ci,expectedContract.ci),'Recorded CI identity differs from the trusted build contract.');
    hash(expectedContract.auditSHA256,'audit digest');
    const audit=evidence.audit;
    required(audit&&audit.schema==='MathScope.M3.P8.LeanAudit/1','Missing finite Lean audit schema.');
    required(await sha256(audit)===expectedContract.auditSHA256,'Recorded audit differs from the expected CI artifact digest.');
    required(audit.status==='KERNEL_CHECKED_FINITE_SCOPES'&&audit.serializedAuthority==='UNTRUSTED_REQUIRES_REEXECUTION','Recorded audit has an invalid status or serialization authority.');
    required(audit.absenceOfSorry===true&&Array.isArray(audit.customAxioms)&&audit.customAxioms.length===0,'Recorded audit permits placeholders or custom axioms.');
    for(const flag of ['wholeP8Complete','wholeM3Complete','globalRHProved','globalBSDProved'])required(audit[flag]===false,'Recorded audit escalates its finite scope.');

    const sources=uniqueRows(audit.sourceFiles,'path','Audit sources');
    const expectedSources=uniqueRows(expectedContract.sourceFiles,'path','Expected sources');
    required(same(audit.sourceFiles,expectedContract.sourceFiles),'Audit source set differs from the complete expected source set.');
    hash(audit.sourceManifestSha256,'source manifest digest');required(await sha256(audit.sourceFiles)===audit.sourceManifestSha256,'Source manifest digest is invalid.');
    const bundled=uniqueRows(sourceBinding.files,'path','Bundled sources');
    required(sourceBinding.schema==='MathScope.M3.P8.SourceBinding/1'&&await sha256(sourceBinding.files)===sourceBinding.manifestSHA256,'Bundled source manifest digest is invalid.');
    for(const row of sources.values()){
      shape(row,['path','sha256'],[],'source manifest entry');required(safePath(row.path),'Unsafe audit source path.');hash(row.sha256,'source hash');
      const current=bundled.get(SOURCE_PREFIX+row.path);
      if(!current||current.sha256!==row.sha256){stale=true;issues.push('Current source differs: '+row.path);}
    }
    const requiredSources=['lean/Audit.lean','lean/lakefile.lean','lean/lean-toolchain','lean/pins.json','lean/finite-input.json','lean/MathScope/M1/Arithmetic/Algebra.lean','lean/MathScope/M1/Arithmetic/Precision.lean','lean/MathScope/P8/Finite.lean','lean/MathScope/P8/Generated.lean','finite-certificates.mjs','tools/generate_finite.mjs','tools/audit_lean.py'];
    for(const path of requiredSources)required(sources.has(path),'Required producer/consumer source omitted: '+path);
    for(const row of bundled.values()){required(safePath(row.path)&&Number.isSafeInteger(row.bytes)&&row.bytes>=0,'Invalid bundled source entry.');hash(row.sha256,'bundled source hash');}

    required(same(evidence.input,expectedContract.input),'Recorded input differs from expected compiled input.');
    hash(expectedContract.inputManifestSha256,'input manifest digest');
    required(audit.inputManifestSha256===expectedContract.inputManifestSha256&&sources.get('lean/finite-input.json').sha256===expectedContract.inputManifestSha256,'Exact serialized finite input does not match the compiled source manifest.');
    hash(expectedContract.generatedSourceSHA256,'generated source digest');
    required(evidence.generatedSourceSHA256===expectedContract.generatedSourceSHA256&&sources.get('lean/MathScope/P8/Generated.lean').sha256===expectedContract.generatedSourceSHA256,'Generated Lean source hash does not match the exact compiled source.');

    const metadata=uniqueRows(expectedContract.targets,'name','Expected targets');
    const targets=uniqueRows(audit.targets,'name','Actual targets');
    required(metadata.size===12&&targets.size===metadata.size,'The twelve unconditional consumer targets must all be present.');
    required(same(audit.consumerManifest,expectedContract.targets)&&await sha256(audit.consumerManifest)===audit.consumerManifestSha256,'Consumer manifest is missing or inconsistent.');
    for(const [name,meta] of metadata){
      shape(meta,['name','propositionId','scope','sourceFile'],[],'expected target metadata');
      required(name.startsWith(TARGET_PREFIX)&&typeof meta.propositionId==='string'&&meta.propositionId.startsWith('P8.FINITE.')&&typeof meta.scope==='string'&&safePath(meta.sourceFile),'Malformed finite consumer metadata.');
      const target=targets.get(name);required(target,'Expected target omitted: '+name);
      for(const key of Object.keys(meta))required(target[key]===meta[key],'Target metadata changed: '+name+'/'+key);
      required(typeof target.type==='string'&&target.type.startsWith(name)&&target.type.includes(' :')&&target.type.length<65536,'Missing exact printed target type: '+name);
      required(await sha256(target.type)===target.typeSha256,'Printed target type digest differs: '+name);
      required(sources.has(meta.sourceFile)&&target.sourceSha256===sources.get(meta.sourceFile).sha256,'Target source differs: '+name);
      checkAxioms(target);
    }

    required(Array.isArray(expectedContract.negativeNames)&&expectedContract.negativeNames.length===8&&new Set(expectedContract.negativeNames).size===8,'The eight required negative controls must be declared.');
    const negatives=uniqueRows(audit.negativeControls,'name','Negative controls');
    required(same([...negatives.keys()],expectedContract.negativeNames),'Negative controls are missing, repeated, or changed.');
    for(const [name,row] of negatives){
      required(/^Negative[A-Za-z]+$/.test(name)&&sources.has('lean/'+name+'.lean'),'Negative-control source missing.');
      required(row.expectedRejected===true&&row.rejected===true&&Number.isSafeInteger(row.exitCode)&&row.exitCode>0,'Negative control did not reject.');
      required(row.sourceSha256===sources.get('lean/'+name+'.lean').sha256&&row.logFile===name+'.log','Negative-control source/log binding changed.');hash(row.logSha256,'negative log digest');
    }
    required(Array.isArray(audit.builds)&&audit.builds.length===4,'Missing successful local module builds.');
    const builds=uniqueRows(audit.builds,'module','Module builds');
    for(const name of ['MathScope.M1.Arithmetic.Algebra','MathScope.M1.Arithmetic.Precision','MathScope.P8.Finite','MathScope.P8.Generated']){
      const row=builds.get(name);required(row&&row.exitCode===0,'Required module build did not succeed.');
      const path='lean/'+name.replaceAll('.','/')+'.lean';required(row.sourceSha256===sources.get(path)?.sha256,'Compiled module source binding differs.');hash(row.oleanSha256,'compiled artifact hash');hash(row.logSha256,'build log hash');
    }
    required(audit.consumerAudit?.exitCode===0,'Fresh consumer audit did not succeed.');hash(audit.consumerAudit.logSha256,'consumer log hash');
    const env=audit.environment,pins=expectedContract.pins;
    required(env&&pins&&env.leanCommit===pins.leanCommit&&env.mathlibCommit===pins.mathlibCommit&&COMMIT.test(pins.leanCommit)&&COMMIT.test(pins.mathlibCommit),'Pinned Lean/mathlib commits differ.');
    required(typeof pins.leanVersion==='string'&&/^\d+\.\d+\.\d+$/.test(pins.leanVersion)&&typeof env.leanVersion==='string'&&new RegExp('version\\s+'+pins.leanVersion.replaceAll('.','\\.')+'(?:\\D|$)').test(env.leanVersion)&&env.leanVersion.includes(pins.leanCommit.slice(0,12)),'Pinned Lean version/commit report differs.');
    required(env.kernelModified===false&&env.runtimeModified===false&&Number.isSafeInteger(env.importedModuleCount)&&env.importedModuleCount>0,'Kernel/runtime/import closure is not intact.');
    for(const key of ['leanBinarySha256','runtimeLibrarySha256','lakeManifestSha256','importClosureSha256'])hash(env[key],key);
  }catch(error){issues.push(String(error.message||error));}
  return freeze({ok:issues.length===0,status:issues.length?(stale?'RECORDED_AUDIT_SOURCE_STALE':'RECORDED_AUDIT_INVALID'):'RECORDED_AUDIT_CONTRACT_MATCH',issues,...noAuthority});
}
