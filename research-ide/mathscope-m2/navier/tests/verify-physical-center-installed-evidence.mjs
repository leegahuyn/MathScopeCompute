/** Required build gate: the installed numerical algorithms must still be
 * the exact bytes paired with the executed external source certificate.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {INSTALLED_PHYSICAL_CENTER_EVIDENCE as evidence,INSTALLED_PHYSICAL_CENTER_EVIDENCE_SHA256 as expected} from '../actual-physical-center-installed-evidence.mjs';
import {sha256} from '../../../mathscope-m0/contracts.mjs';
import {ORIGINAL_RADIAL_PHASE_SPECIFICATION} from '../source-radial-phase-exponent.mjs';
import {readExecutedArtifact} from './executed-source-artifact-files.mjs';

const root=fileURLToPath(new URL('../../../../',import.meta.url)),
  fileDigest=async name=>sha256(readExecutedArtifact(root,name).toString('utf8')),
  read=name=>JSON.parse(readExecutedArtifact(root,name).toString('utf8'));
assert.equal(await sha256(evidence),expected,'The installed source evidence was changed after pinning.');
assert.equal(evidence.schema,'MathScope.InstalledPhysicalCenterSourceEvidence/1');
assert.equal(evidence.authentication,'PINNED_EXECUTED_EXTERNAL_SOURCE_CERTIFICATE');
const manifest=evidence.numericalAlgorithmManifest;
assert.equal(manifest.fileCount,Object.keys(manifest.files).length);
assert.equal(manifest.sha256,await sha256(manifest.files));
for(const [name,hash]of Object.entries(manifest.files))assert.equal(await fileDigest(name),hash,name+' changed after its original-source compatibility check.');
for(const ref of [evidence.sourceRun,evidence.sourceProcess,evidence.numericalCertificate,evidence.targetPositiveScalePremises.certificate,
  evidence.sourceDiagnostics,evidence.preparedSourceSchema,evidence.originalTorusMap,...Object.values(evidence.partialAttachments)])
  assert.equal(await fileDigest(ref.path),ref.sha256,ref.path+' no longer matches its executed proof.');
const marker='export function physicalCenterNumericalJetConditioning(values,bits){',
  body=name=>{const text=fs.readFileSync(path.join(root,'research-ide/mathscope-m2/navier',name),'utf8'),start=text.indexOf(marker),end=text.indexOf('\n}',start);
    assert.ok(start>=0&&end>start);return text.slice(start,end+2);},
  currentBody=body('actual-physical-center-jet-conditioning.mjs');
assert.equal(await sha256(currentBody),manifest.conditioningBodySHA256);
assert.equal(currentBody,body('actual-physical-center-jet-source-enclosure-bounds.mjs'));
const source=read(evidence.sourceRun.path);
assert.equal(source.pass,true);assert.equal(source.complete,true);assert.equal(source.exitCode,0);
assert.equal(source.checks.length,8);assert.ok(source.checks.every(check=>check.pass));
assert.equal(source.initialManifest.sha256,evidence.initialImportManifest.sha256);
assert.equal(source.lateImportManifest.sha256,evidence.lateImportManifest.sha256);
assert.deepEqual(source.originalTorusMap,evidence.originalTorusMap);
const originalTorusMap=read(evidence.originalTorusMap.path),physicalCenter=read(source.certificates.physicalCenter.path);
assert.equal(await fileDigest(source.certificates.physicalCenter.path),source.certificates.physicalCenter.sha256);
assert.deepEqual(evidence.originalTorusMapBinding,originalTorusMap);
assert.deepEqual(originalTorusMap,physicalCenter.point.originalTorusMapBinding);
assert.deepEqual(originalTorusMap.specification,ORIGINAL_RADIAL_PHASE_SPECIFICATION);
assert.equal(originalTorusMap.roots.actualDr,physicalCenter.point.originalPhysicalMap.dr);
assert.equal(originalTorusMap.roots.dr,physicalCenter.point.inverse.input.dr);
assert.equal(originalTorusMap.parameterBindings.strictPositiveSourceRetained,true);
assert.equal(originalTorusMap.comparison.allSixExpectedBodiesMatched,true);
assert.equal(originalTorusMap.comparison.oldMissingFactorAccepted,false);
assert.equal(evidence.policy.originalPhysicalRadialEquationRequired,true);
assert.equal(evidence.policy.legacyMissingRadialFactorExecutionAccepted,false);
const certificate=read(evidence.numericalCertificate.path),
  actualScales=certificate.sourceBounds.diagnostics.selectorScaleEnclosure;
for(const [key,value]of Object.entries(evidence.positiveSelectorScaleEvidence))assert.deepEqual(value,actualScales[key],key);
assert.equal(actualScales.pass,true);assert.ok(actualScales.checks.every(check=>check.pass));
console.log(JSON.stringify({pass:true,evidenceSHA256:expected,numericalFiles:manifest.fileCount,
  numericalAlgorithmManifestSHA256:manifest.sha256,originalSourceCertificateSHA256:evidence.numericalCertificate.sha256,
  currentNumericalBytesMatchPinnedSourceEvidence:true}));
