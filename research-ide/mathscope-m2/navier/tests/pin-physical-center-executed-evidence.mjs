/** Build-time projection of a COMPLETED, externally observed original
 * source run. No numerical interval in an imported replay can create this
 * artifact. Both import manifests and every certificate file are checked.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';

assert.equal(process.argv.length,3,'Supply one completed immutable source attempt number.');
const attempt=Number(process.argv[2]);assert.ok(Number.isSafeInteger(attempt)&&attempt>0);
const root=fileURLToPath(new URL('../../../../',import.meta.url)),base=fileURLToPath(new URL('../',import.meta.url)),
  stem='research-ide/mathscope-m2/navier/research/evidence/physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt'+attempt,
  read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8')),
  digestFile=async name=>sha256(fs.readFileSync(path.join(root,name),'utf8')),
  processFile=stem+'-process.json',sourceFile=stem+'.json',processRecord=read(processFile),source=read(sourceFile),
  allPassed=rows=>Array.isArray(rows)&&rows.length>0&&rows.every(row=>row.pass===true);
assert.equal(source.schema,'MathScope.ActualPhysicalCenterFullJetStagedSourceCheck/1');
assert.equal(source.pass,true);assert.equal(source.complete,true);assert.equal(source.exitCode,0);
assert.equal(source.checks.length,8);assert.ok(allPassed(source.checks));
assert.equal(processRecord.schema,'MathScope.ObservedPhysicalFullJetStagedProcess/1');
assert.equal(processRecord.pass,true);assert.equal(processRecord.complete,true);assert.equal(processRecord.exitCode,0);
assert.equal(processRecord.timeout,false);assert.equal(processRecord.source.path,sourceFile);
assert.equal(processRecord.source.sha256,await digestFile(sourceFile));
assert.equal(processRecord.log.sha256,await digestFile(processRecord.log.path));
assert.equal(source.log.sha256,await digestFile(source.log.path));
for(const manifest of [source.initialManifest,source.lateImportManifest]){
  assert.equal(manifest.sha256,await sha256(manifest.files));
  assert.equal(manifest.fileCount,Object.keys(manifest.files).length);
  for(const [file,hash]of Object.entries(manifest.files))assert.equal(await digestFile(file),hash,file);
}
for(const value of Object.values(source.certificates))assert.equal(await digestFile(value.path),value.sha256,value.path);
assert.equal(await digestFile(source.selectionTrace.path),source.selectionTrace.sha256);
assert.equal(await digestFile(source.sourceDiagnostics.path),source.sourceDiagnostics.sha256);
assert.equal(await digestFile(source.preparedSourceSchema.path),source.preparedSourceSchema.sha256);
for(const name of ['complete-derivative-source-bounds','first-selector-ftc-upper-bounds','closed-selector-and-physical-scales']){
  const ref=source.partialAttachments[name];assert.ok(ref);assert.equal(await digestFile(ref.path),ref.sha256);
  const attachment=read(ref.path);
  assert.equal(attachment.schema,'MathScope.ObservedPartialPhysicalSourceAttachment/1');
  assert.equal(attachment.originalSameProcess,true);assert.equal(attachment.finalSourcePassRequired,true);
  assert.equal(attachment.standaloneCompletionClaim,false);
}
const certificate=read(source.certificates.numerical.path),bodies=read(source.certificates.bodies.path),target=read(source.certificates.target.path),
  contract=sourceExponentContract();
assert.equal(certificate.schema,'MathScope.ActualPhysicalCenterFullJetEnclosureCertificate/1');
assert.equal(certificate.pass,true);assert.ok(allPassed(certificate.checks));
assert.equal(certificate.sourceBounds.sourceAuthenticated,true);assert.ok(allPassed(certificate.sourceBounds.checks));
assert.equal(certificate.sourceBinding.sourceProfile,SOURCE_PROFILE_ID);
assert.equal(certificate.sourceBinding.parameterExpressionSHA256,contract.parameterExpressionSHA256);
assert.equal(certificate.sourceBinding.sourceAuthenticated,true);
assert.equal(certificate.scope.actualOriginalCoupledVariations,true);
assert.equal(certificate.scope.actualSpatialCovariantHessianNumerics,true);
assert.equal(certificate.scope.angularMixedAndFrameConnectionsIncluded,true);
assert.equal(certificate.scope.hReplacedByZero,false);
assert.equal(certificate.scope.remainingSelectorAndPaletteScalesNumericallyClosed,true);
const selectorScales=certificate.sourceBounds.diagnostics.selectorScaleEnclosure;
assert.equal(selectorScales.schema,'MathScope.ActualCommonPositiveScaleEnclosure/1');
assert.equal(selectorScales.pass,true);assert.equal(selectorScales.sourceAuthenticated,true);assert.ok(allPassed(selectorScales.checks));
assert.equal(selectorScales.scope.all270ActualPositiveDerivativeScalesNumericallyEnclosed,true);
assert.equal(selectorScales.scope.allRequiredLogCoordinateWidthsChecked,true);
assert.equal(selectorScales.scope.sourceHReplacedByZero,false);
assert.equal(selectorScales.scope.originalSelectorOrBackgroundChanged,false);
assert.deepEqual(read(source.partialAttachments['closed-selector-and-physical-scales'].path).data,selectorScales);
assert.deepEqual(read(source.partialAttachments['first-selector-ftc-upper-bounds'].path).data,
  certificate.sourceBounds.diagnostics.firstSelectorFTCUpperBounds);
const key=row=>[row.quantity,row.sign??'physical',row.component,row.derivative].join(':'),
  bodyMap=new Map([...bodies.rows,...bodies.physical.rows].map(row=>[key(row),row]));
assert.equal(bodyMap.size,270);assert.equal(certificate.rows.length,270);
const fields=['rowKey','quantity','sign','component','derivative','order','originalDerivative','atPoint',
  'normalizedDirectionDerivative','phaseZeroDerivative','materializedDerivative','physicalValue','positiveExactScale','coefficient',
  'bodyDerivativeBinding','includesCylindricalFrameConnection','includesAngularDirectionConnection','positiveErrorRadius'];
const rows=certificate.rows.map(row=>{
  assert.equal(row.rowKey,key(row));assert.equal(row.bodyDerivativeBinding,true);
  const body=bodyMap.get(row.rowKey);assert.ok(body);
  for(const field of Object.keys(body))assert.deepEqual(row[field],body[field],row.rowKey+' '+field);
  assert.equal(row.sourceNumericalPremisesBound,true);assert.equal(row.toleranceMet,true);
  return Object.fromEntries(fields.filter(field=>row[field]!==undefined).map(field=>[field,row[field]]));
});
const scaleMap=new Map(selectorScales.rowScales.map(row=>[key(row),row]));
assert.equal(scaleMap.size,270);
for(const row of rows){const scale=scaleMap.get(row.rowKey);assert.ok(scale);assert.equal(scale.sourceRoot,row.positiveExactScale);
  assert.equal(scale.actualScaleRecipeBound,true);assert.equal(scale.toleranceMet,true);}
assert.equal(target.pass,true);assert.ok(allPassed(target.checks));
assert.equal(target.source.roots.tau,certificate.roots.originalTargetTau);
const pending=['actual-physical-center-runtime-numerics.mjs','actual-physical-center-jet-conditioning.mjs',
  'actual-physical-center-positive-scale-kernel.mjs','actual-physical-center-unscaled-numerics.mjs'].map(f=>path.join(base,f)),files={};
while(pending.length){
  const file=pending.pop(),relative=path.relative(root,file).split(path.sep).join('/');if(files[relative])continue;
  const text=fs.readFileSync(file,'utf8');files[relative]=await sha256(text);
  for(const match of text.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g))
    if(match[1].startsWith('.'))pending.push(path.resolve(path.dirname(file),match[1]));
}
// All numerical dependencies that also participated in the original proof
// must still be the exact executed bytes; a regenerated generic checksum
// cannot silently update an already executed mathematical premise.
for(const [file,hash]of Object.entries(files)){
  const executed=source.lateImportManifest.files[file]??source.initialManifest.files[file];
  if(executed)assert.equal(hash,executed,file);
}
const conditioning=fs.readFileSync(path.join(base,'actual-physical-center-jet-conditioning.mjs'),'utf8'),
  originalConditioning=fs.readFileSync(path.join(base,'actual-physical-center-jet-source-enclosure-bounds.mjs'),'utf8'),
  conditioningMarker='export function physicalCenterNumericalJetConditioning(values,bits){',
  bodyOf=text=>{const start=text.indexOf(conditioningMarker);assert.ok(start>=0);const end=text.indexOf('\n}',start);assert.ok(end>start);return text.slice(start,end+2);};
assert.equal(bodyOf(conditioning),bodyOf(originalConditioning));
const sortedFiles=Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b))),
  evidence={schema:'MathScope.InstalledPhysicalCenterSourceEvidence/1',authentication:'PINNED_EXECUTED_EXTERNAL_SOURCE_CERTIFICATE',
    sourceBinding:certificate.sourceBinding,graph:certificate.graph,roots:certificate.roots,rows,
    sourceScope:certificate.scope,sourceChecks:source.checks,numericalSourceChecks:certificate.checks,boundChecks:certificate.sourceBounds.checks,
    numericalCertificate:source.certificates.numerical,
    sourceDiagnostics:source.sourceDiagnostics,
    preparedSourceSchema:source.preparedSourceSchema,partialAttachments:source.partialAttachments,
    positiveSelectorScaleEvidence:Object.fromEntries(['schema','request','sourceBinding','rows','rowScales','absoluteValues','roots','checks','scope','proof','pass']
      .map(key=>[key,structuredClone(selectorScales[key])])),
    targetPositiveScalePremises:{roots:target.source.roots,scaleBounds:target.source.scaleBounds,
      certificate:source.certificates.target,proof:target.proof.numericalScales,powerReserve:target.proof.powerReserve},
    sourceRun:{path:sourceFile,sha256:await digestFile(sourceFile),sourceCommitAtStart:source.sourceCommitAtStart,
      generatedAt:source.generatedAt,elapsedMs:source.elapsedMs},
    sourceProcess:{path:processFile,sha256:await digestFile(processFile),exitCode:processRecord.exitCode,timeout:processRecord.timeout,
      complete:processRecord.complete,elapsedSeconds:processRecord.elapsedSeconds,peakRSSBytes:processRecord.peakRSSBytes,
      startedAt:processRecord.startedAt,finishedAt:processRecord.finishedAt},
    initialImportManifest:{sha256:source.initialManifest.sha256,fileCount:source.initialManifest.fileCount},
    lateImportManifest:{sha256:source.lateImportManifest.sha256,fileCount:source.lateImportManifest.fileCount,importedAt:source.lateImportManifest.importedAt},
    numericalAlgorithmManifest:{files:sortedFiles,fileCount:Object.keys(files).length,sha256:await sha256(sortedFiles),
      conditioningBodySHA256:await sha256(bodyOf(conditioning)),sourceOverlappingDependenciesUnchanged:true},
    policy:{userSerializedRecordsCannotAuthenticateSource:true,privateOriginalGraphTokenRecreated:false,
      everyJobRecomputesCoefficientNumericalPremises:true,allRowKeysAndNormalizersBound:true,
      originalSelectorScaleEndpointsPinnedFromObservedSource:true,everyJobRecomputesUnscaledDerivativeIntervalProducts:true,
      artifactRole:'Build-pinned executed external source evidence; not a new Lean proof or a runtime reconstruction of the original graph.'}};
const hash=await sha256(evidence),targetFile=path.join(base,'actual-physical-center-installed-evidence.mjs'),
  text='/** Generated only from the completed observed original source. Rebuild using tests/pin-physical-center-executed-evidence.mjs. */\n'+
    'export const INSTALLED_PHYSICAL_CENTER_EVIDENCE = '+canonicalStringify(evidence)+';\n'+
    'export const INSTALLED_PHYSICAL_CENTER_EVIDENCE_SHA256 = '+JSON.stringify(hash)+';\n';
fs.writeFileSync(targetFile,text);
console.log(JSON.stringify({pass:true,sourceFile,sourceSHA256:await digestFile(sourceFile),numericalCertificate:source.certificates.numerical,
  target:path.relative(root,targetFile),sha256:await sha256(text),evidenceSHA256:hash,rows:rows.length,numericalDependencies:Object.keys(files).length}));
