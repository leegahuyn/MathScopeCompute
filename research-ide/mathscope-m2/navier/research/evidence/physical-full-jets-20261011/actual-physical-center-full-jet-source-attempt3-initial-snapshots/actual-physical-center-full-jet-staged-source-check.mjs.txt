/** One observed process, one private original physical point. The original
 * construction is frozen at start; an additive numerical adapter may be
 * frozen and imported later. Its separate manifest and import time are
 * explicit. No serialized receipt or user-supplied point can replace p.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {prepareActualCommonPhysicalCenterEnclosure,assertActualCommonPhysicalCenterEnclosure,actualCommonPhysicalCenterEnclosureCertificate} from '../actual-common-physical-center-enclosure.mjs';
import {attachActualPhysicalCenterSlowSlopeEnclosure,assertActualPhysicalCenterSlowSlopeEnclosure,actualPhysicalCenterSlowSlopeEnclosureCertificate} from '../actual-physical-center-slow-slope-enclosure.mjs';
import {attachActualPhysicalCenterTargetEnclosure,assertActualPhysicalCenterTargetEnclosure,actualPhysicalCenterTargetEnclosureCertificate} from '../actual-physical-center-target-enclosure.mjs';
import {constructActualPhysicalCenterFiniteJetBodies,assertActualPhysicalCenterFiniteJetBodies,actualPhysicalCenterFiniteJetBodiesCertificate} from '../actual-physical-center-jet-bodies.mjs';
import {actualCommonSelectionArithmeticTrace} from '../actual-common-selection-arithmetic-trace.mjs';
import {SOURCE_PROFILE_ID} from '../source-profile.mjs';
import {rational as Q,readRational,qcompare,qsub} from '../actual-continuation-arithmetic.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

assert.equal(process.argv.length,4,'Supply the immutable output directory and a new attempt stem.');
const repository=fileURLToPath(new URL('../../../../',import.meta.url)),directory=path.resolve(process.argv[2]),stem=process.argv[3],
  relative=f=>path.relative(repository,f).split(path.sep).join('/'),digest=x=>createHash('sha256').update(x).digest('hex'),
  sourceRoot=fileURLToPath(new URL('../',import.meta.url));
assert.match(stem,/^[a-z0-9-]+$/);fs.mkdirSync(directory,{recursive:true});
const recordPath=path.join(directory,stem+'.json'),logPath=path.join(directory,stem+'.log'),controlPath=path.join(directory,stem+'-continue.json');
assert.ok(!fs.existsSync(recordPath)&&!fs.existsSync(logPath)&&!fs.existsSync(controlPath),'Preserve all earlier attempt bytes.');
function manifest(entry){
  const seen=new Map(),pending=[entry];
  while(pending.length){const f=pending.pop();if(seen.has(f))continue;const bytes=fs.readFileSync(f),body=bytes.toString('utf8');seen.set(f,digest(bytes));
    for(const m of body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g))
      if(m[1].startsWith('.'))pending.push(path.resolve(path.dirname(f),m[1]));}
  const files=Object.fromEntries([...seen].map(([f,h])=>[relative(f),h]).sort(([a],[b])=>a.localeCompare(b)));
  return {fileCount:seen.size,files,sha256:digest(canonicalStringify(files))};
}
const input={sourceProfile:SOURCE_PROFILE_ID,precisionBits:192,tolerance:'1/1000000000000000000',centerTolerance:'1/10000000000000000000000000000000000000000',maxCutoffCells:4096,maxNodes:5000000},
  slopeControls={precisionBits:192,tolerance:'1/1000000000000000'},
  targetControls={precisionBits:192,coefficientTolerance:'1/1000000000000',logCoordinateTolerance:'1/1000000000000',maxCells:1024},
  numericControls={precisionBits:192,tolerance:'1/1000000000000'},
  started=performance.now(),deadline=started+2400000,initialManifest=manifest(fileURLToPath(import.meta.url)),
  record={schema:'MathScope.ActualPhysicalCenterFullJetStagedSourceCheck/1',generatedAt:new Date().toISOString(),
    sourceCommitAtStart:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),
    command:[process.execPath,...process.execArgv,relative(fileURLToPath(import.meta.url)),...process.argv.slice(2)],
    input,slopeControls,targetControls,numericControls,inputSHA256:digest(canonicalStringify({input,slopeControls,targetControls,numericControls})),
    initialManifest,lateImportManifest:null,stagedImportMeaning:'Only the new numerical attachment is imported later, after it has been frozen and hash-checked. The original private p and finite body constructors execute once in this same process. Initial files must remain byte-identical throughout.',
    runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},checks:[],progress:[],certificates:{},partialAttachments:{},complete:false};
const write=(name,data)=>{const filename=path.join(directory,stem+'-'+name+'.json');fs.writeFileSync(filename,JSON.stringify(data,null,2)+'\n',{flag:'wx'});return {path:relative(filename),sha256:digest(fs.readFileSync(filename))};},
  log=value=>{const line=JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);},
  check=async(id,fn)=>{await fn();record.checks.push({id,pass:true});log({event:'CHECK',id,pass:true});},
  context={checkCancelled:()=>{if(performance.now()>deadline)throw Object.assign(Error('The actual staged source exceeded its forty-minute total resource budget.'),{code:'RESOURCE_LIMIT'});},
    captureEvidence:(name,data)=>{assert.match(name,/^[a-z0-9-]+$/);assert.ok(!record.partialAttachments[name]);
      record.partialAttachments[name]=write(name,{schema:'MathScope.ObservedPartialPhysicalSourceAttachment/1',
        originalSameProcess:true,finalSourcePassRequired:true,standaloneCompletionClaim:false,data});},
    onProgress:step=>{global.gc?.();const row={...step,elapsedMs:performance.now()-started,rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed};record.progress.push(row);log({event:'PROGRESS',...row});}};
write('preflight',{...record,controlPath:relative(controlPath)});
log({event:'START',inputSHA256:record.inputSHA256,sourceManifestSHA256:initialManifest.sha256,sourceFiles:initialManifest.fileCount});
try{
  const p=prepareActualCommonPhysicalCenterEnclosure(input,context);
  await check('one-original-private-physical-point-and-positive-full-H-weights',()=>{assert.equal(assertActualCommonPhysicalCenterEnclosure(p),true);assert.ok(p.checks.every(x=>x.pass));assert.equal(p.sourceBounds.contract.positive,true);});
  const shapeSeen=new Map(),sourceShape=value=>{
    if(value===undefined)return ['undefined'];if(value===null)return ['null'];
    if(['string','number','boolean'].includes(typeof value))return [typeof value,value];
    if(typeof value==='bigint')return ['bigint',String(value)];
    if(typeof value!=='object')return [typeof value];
    if(shapeSeen.has(value))return ['same-object-reference',shapeSeen.get(value)];shapeSeen.set(value,shapeSeen.size);
    return [Array.isArray(value)?'array':'object',Object.entries(value).map(([key,item])=>[key,sourceShape(item)])];
  };
  record.preparedSourceSchema=write('prepared-source-schema',{schema:'MathScope.ObservedOriginalPreparedRecordSchema/1',
    recordCount:p.family.prepared.records.length,typedRecords:sourceShape(p.family.prepared.records),
    purpose:'Read-only record shapes and literal source IDs, including optional undefined fields. This cannot recreate private source authority.',
    finalSourcePassRequired:true});
  record.selectionTrace=write('selection-trace',await actualCommonSelectionArithmeticTrace(p.family));
  record.certificates.physicalCenter=write('physical-value-certificate',await actualCommonPhysicalCenterEnclosureCertificate(p));
  const slopes=attachActualPhysicalCenterSlowSlopeEnclosure(p,slopeControls,context);
  await check('six-new-source-comparison-slopes-retain-positive-transfer-errors',()=>{assert.equal(assertActualPhysicalCenterSlowSlopeEnclosure(slopes),true);assert.equal(slopes.physicalCenter,p);assert.ok(slopes.checks.every(x=>x.pass));assert.equal(slopes.numerics.rows.length,6);});
  record.certificates.slopes=write('slopes-certificate',await actualPhysicalCenterSlowSlopeEnclosureCertificate(slopes));
  const target=await attachActualPhysicalCenterTargetEnclosure(p,targetControls,context);
  await check('original-complete-target-and-seven-positive-closed-scale-endpoints',()=>{assert.equal(assertActualPhysicalCenterTargetEnclosure(target),true);assert.equal(target.p,p);assert.ok(target.checks.every(x=>x.pass));assert.equal(target.numerics.rows.length,7);});
  record.certificates.target=write('target-certificate',await actualPhysicalCenterTargetEnclosureCertificate(target));
  const bodies=constructActualPhysicalCenterFiniteJetBodies(p,{maxNodes:5000000},context);
  await check('both-original-variations-and-all-270-finite-derivative-bodies',()=>{assert.equal(assertActualPhysicalCenterFiniteJetBodies(bodies),true);assert.equal(bodies.physicalCenter,p);assert.ok(bodies.checks.every(x=>x.pass));assert.equal(bodies.rows.length,228);assert.equal(bodies.physical.rows.length,42);});
  record.certificates.bodies=write('finite-bodies-certificate',await actualPhysicalCenterFiniteJetBodiesCertificate(bodies));
  log({event:'AWAITING_FROZEN_ADDITIVE_NUMERICAL_ADAPTER',controlPath:relative(controlPath),elapsedMs:performance.now()-started});
  while(!fs.existsSync(controlPath)){context.checkCancelled();await delay(1000);}
  const control=JSON.parse(fs.readFileSync(controlPath,'utf8')),adapterPath=path.join(sourceRoot,'actual-physical-center-full-jet-enclosure.mjs'),
    boundPath=path.join(sourceRoot,'actual-physical-center-jet-source-enclosure-bounds.mjs');
  assert.deepEqual(Object.keys(control).sort(),['adapterSHA256','boundsSHA256','operation'].sort());assert.equal(control.operation,'bind-and-check');
  assert.equal(digest(fs.readFileSync(adapterPath)),control.adapterSHA256);assert.equal(digest(fs.readFileSync(boundPath)),control.boundsSHA256);
  assert.deepEqual(manifest(fileURLToPath(import.meta.url)),initialManifest);
  record.lateImportManifest={...manifest(adapterPath),importedAt:new Date().toISOString(),control:write('accepted-late-import-control',control)};
  const adapter=await import('../actual-physical-center-full-jet-enclosure.mjs');
  log({event:'START_FROZEN_ADDITIVE_NUMERICAL_ADAPTER',elapsedMs:performance.now()-started,lateImportManifestSHA256:record.lateImportManifest.sha256});
  const result=adapter.attachActualPhysicalCenterFullJetEnclosure(bodies,slopes,target,numericControls,context);
  record.sourceDiagnostics=write('selector-source-diagnostics',{schema:'MathScope.ObservedPhysicalSourceDiagnosticAddendum/1',
    diagnostics:result.sourceBounds.diagnostics,sourceBinding:result.sourceBinding,
    initialManifestSHA256:initialManifest.sha256,lateImportManifestSHA256:record.lateImportManifest.sha256,
    authority:'Read-only original expression diagnostics. Source authentication additionally requires this same attempt final pass and observed exit zero.',
    finalSourcePassRequired:true,standaloneNumericalScaleCertificate:false});
  await check('same-new-point-bound-full-matrix-gaussian-riccati-target-and-phase-errors',()=>{assert.equal(result.sourceBounds.sourceAuthenticated,true);assert.ok(result.sourceBounds.checks.every(x=>x.pass));assert.equal(result.bodies,bodies);assert.equal(result.slopes,slopes);assert.equal(result.target,target);});
  await check('all-270-source-derivatives-have-directed-coefficients-at-requested-width',()=>{
    assert.equal(result.rows.length,270);assert.equal(new Set(result.rows.map(r=>r.rowKey)).size,270);
    for(const r of result.rows){assert.equal(r.toleranceMet,true);assert.equal(bodies.G.freeCoordinates(r.positiveExactScale).size,0);assert.equal(bodies.G.freeCoordinates(r.coefficient).size,0);
      assert.ok(qcompare(qsub(readRational(r.directedInterval.upper),readRational(r.directedInterval.lower)),readRational(numericControls.tolerance))<=0);
      assert.ok(qcompare(readRational(r.positiveErrorRadius),Q(0))>0);}
  });
  await check('forged-numerical-record-and-changed-interval-are-rejected',()=>{
    assert.throws(()=>adapter.assertActualPhysicalCenterFullJetEnclosure({...result}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    const first=result.rows[0],old=first.directedInterval.lower;
    try{first.directedInterval.lower='123';assert.throws(()=>adapter.assertActualPhysicalCenterFullJetEnclosure(result),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{first.directedInterval.lower=old;}
    assert.equal(adapter.assertActualPhysicalCenterFullJetEnclosure(result),true);
  });
  record.certificates.numerical=write('numerical-certificate',await adapter.actualPhysicalCenterFullJetEnclosureCertificate(result));
  await check('initial-and-late-source-bytes-are-unchanged',()=>{
    assert.deepEqual(manifest(fileURLToPath(import.meta.url)),initialManifest);
    const late=manifest(adapterPath);assert.equal(late.sha256,record.lateImportManifest.sha256);assert.deepEqual(late.files,record.lateImportManifest.files);
  });
  record.scope=result.scope;record.complete=true;record.pass=true;record.exitCode=0;
}catch(error){record.pass=false;record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack,...(error.details?{details:error.details}:{})};process.exitCode=1;}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',pass:record.pass,complete:record.complete,exitCode:record.exitCode,checks:record.checks,elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
