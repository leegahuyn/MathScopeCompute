import {SOURCE_NEAR_TERMINAL_ARCHIVE,SOURCE_NEAR_TERMINAL_ARCHIVE_SHA256} from './source-near-terminal-evidence-data.mjs';
import {recordedSourceLocalizationDomain} from './source-exterior-force-evidence.mjs';
import {recordedSourceCoreRestriction,assertRecordedSourceCoreRestriction,sourceCoreRestrictionObservations} from './source-core-restriction.mjs';

const copy=value=>structuredClone(value),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const seals=new WeakMap();

/** Revalidate the immutable full source run. This operation neither rebuilds
 * the large private common family nor adopts a caller's serialized proof.
 */
export async function recordedSourceNearTerminal(parameters={}){
  if(!parameters||typeof parameters!=='object'||Array.isArray(parameters)||Object.keys(parameters).length)
    fail('INVALID_INPUT','The original near-terminal archive has fixed source values. Choose the separate core-refinement operation to recompute allowed numerical controls.');
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(SOURCE_NEAR_TERMINAL_ARCHIVE))),
    archiveSHA256=[...new Uint8Array(hash)].map(value=>value.toString(16).padStart(2,'0')).join('');
  if(archiveSHA256!==SOURCE_NEAR_TERMINAL_ARCHIVE_SHA256)
    fail('SOURCE_ARCHIVE_MISMATCH','The observed three-component near-terminal source archive changed.');
  const archive=copy(SOURCE_NEAR_TERMINAL_ARCHIVE),c=archive.certificate,last=c.rows.at(-1),
    [domainEvidence,coreRestrictionEvidence]=await Promise.all([recordedSourceLocalizationDomain(),recordedSourceCoreRestriction()]),
    domain=domainEvidence.domain,
    capturedLocalizationQStar=c.formulaProgram.sourceNodeIds[c.formulaProgram.roots.qStar],
    sameOriginalBinding=canonical(c.sourceBinding)===canonical(domain.sourceBinding),
    sameOriginalDomainNode=capturedLocalizationQStar===domain.constants.qBig;
  if(!sameOriginalBinding||!sameOriginalDomainNode||domainEvidence.sourceDomainChoiceJustified!==true
      ||domainEvidence.externalSourceTheoremApplied!==true||domainEvidence.finalN6FieldConstructed!==false
      ||domainEvidence.finalLocalizedNonzeroFieldIdentifiedByThisConsumer!==false)
    fail('SOURCE_DOMAIN_ARCHIVE_MISMATCH','The separate recorded domain proof must retain the identical original source, fixed graph prefix and localization qStar without constructing a final N6 field.');
  assertRecordedSourceCoreRestriction(coreRestrictionEvidence);
  const core=coreRestrictionEvidence,sourceId=name=>c.formulaProgram.sourceNodeIds[c.formulaProgram.roots[name]],
    sameCoreSource=canonical(core.sourceBinding)===canonical(c.sourceBinding),
    sameCoreDomain=core.sourceDomain.qStar===capturedLocalizationQStar,
    sameCorePoint=c.point.Xin===sourceId('Xin')&&c.point.Xin===core.sourcePoint.Xin&&c.point.Y===core.sourcePoint.Y
      &&c.point.eta===core.sourcePoint.eta&&c.point.eta===0&&core.exactScalarIdentities.XinEqualsXaHalf.pass
      &&c.rows.every(row=>row.normalizedCoordinates.X===c.point.Xin&&row.normalizedCoordinates.eta===0
        &&row.normalizedCoordinates.theta==='0'&&row.unitLocalizationPlateau&&row.samePointAndTimeForAllComponents);
  if(!sameCoreSource||!sameCoreDomain||!sameCorePoint||!core.scope.allThreeVelocityComponentsRestrictionIdentified
      ||core.scope.fullFinalN6FieldConstructed!==false||!core.checks.every(row=>row.pass))
    fail('SOURCE_CORE_RESTRICTION_MISMATCH','The checked original support restriction must match the recorded source, qStar and every component at the same Xin/eta=0 point.');
  const result={...archive,schema:'MathScope.N8.RecordedSourceNearTerminal/1',status:'RECORDED_SOURCE_THREE_COMPONENT_CORE_IDENTITY_VERIFIED',
    recordedOnly:true,freshSourceConstructorExecuted:false,newExecution:false,
    newSupportProofExecuted:true,proofSHA256:core.proofSHA256,
    sourceArtifacts:{...copy(core.sourceArtifacts),nearTerminal:copy(archive.artifact),nearTerminalReceipt:copy(archive.receipt)},
    scope:copy(core.scope),coreRestrictionEvidence,
    viewLabel:'저장된 원래 내부 경로 · 세 속도 성분의 엄밀 구간',archiveSHA256,
    archiveVerification:{canonicalSHA256:archiveSHA256,pass:true,freshSourceConstructorExecuted:false,
      meaning:'The original observed source run and full formula archive are rehashed. Its source files and independent Fraction checks were verified when packaged.'},
    domainPrerequisiteEvidence:copy(domainEvidence),
    finalFieldBridge:{status:'SOURCE_CORE_RESTRICTION_IDENTIFIED_BY_CHECKED_SUPPORT_INDUCTION',
      sourceCutoffScope:'ORIGINAL_LOCALIZED_CORE_RESTRICTION_WITH_VERIFIED_SOURCE_DOMAIN',
      common6SourceQStar:domain.constants.commonQStar,capturedLocalizationQStar,
      domainInclusionAudit:{status:'VERIFIED_RECORDED_SOURCE_PREMISES',archiveContainsFinalProposition99DomainProof:false,
        separateRecordedDomainProofVerified:true,assertedMathematicalObstruction:false,
        archiveSHA256:domainEvidence.archiveSHA256,domainArtifact:copy(domainEvidence.domainArtifact),
        sourceReceipt:copy(domainEvidence.sourceReceipt),sourceCapture:copy(domainEvidence.sourceCapture),
        sourceDomainChoiceJustified:true,externalSourceTheoremApplied:true,
        sameOriginalSourceBinding:sameOriginalBinding,sameOriginalLocalizationQStar:sameOriginalDomainNode,
        initialPrerequisiteCount:domain.initialPrerequisites.length,domainCheckCount:domain.checks.length,
        exactRatios:{qBigOverCommonQStar:'1/64',supportUpperOverQBig:'1/4',strictHalfDomainGap:'1/4'},
        sourcePages:copy(domain.domainProof.sourcePages),references:copy(domain.domainProof.references),
        meaning:'A separate byte-verified original source execution checks the five fixed initial premises and twelve domain conditions, then explicitly applies Lemma9.7 and Proposition9.9 on this same qBig. The historical N8 archive is unchanged.'},
      allFinalCorrectionClassesConstructed:false,finalLocalizedFieldIdentified:false,
      finalLocalizedCoreRestrictionIdentified:true,allSpaceIdentityConstructed:false,
      coreRestriction:{proofSHA256:core.proofSHA256,newSupportProofExecuted:true,sameOriginalSourceBinding:sameCoreSource,
        sameOriginalDomainNode:sameCoreDomain,sameOriginalInnerPoint:sameCorePoint,
        allThreeVelocityComponentsRestrictionIdentified:true,openCore:core.coreIdentity.normalizedOpenCore,
        witnessCollar:core.coreIdentity.witnessCollar,sourceOperatorSupportInductionExecuted:true,
        historicalMeasurementFlagsUnchanged:true,nonzeroFinalFieldsConstructed:false},
      dependencies:copy(c.claims.finalLocalizedVelocity.dependencies),
      dependenciesMeaning:'The historical archive lists the original finite-construction/realization and localization theorems. The separate executed support induction now applies their precise original operator support on the open core; it does not construct the nonzero field elsewhere.',
      meaning:'Every original annular correction potential, direct mean and perturbation pressure vanishes on the same open core. The executed support induction retains all cutoff curl terms and all possibly nonzero global moments, so on the unit plateau every archived velocity component equals the corresponding original final localized core restriction. The nonzero final N6 field elsewhere remains unconstructed.'},
    lastResolvedTau:{depth:last.depth,exactSign:'POSITIVE',sourceNode:last.tau.expression,
      formulaRoot:c.formulaProgram.roots['tau_'+last.depth],formulaProgramSHA256:c.graph.scalarProgramSHA256,binary64:null,
      meaning:'Smallest positive source-expression tau among the archived inner-path enclosures. The separate executed support proof identifies these components with the original localized core restriction. This finite archived observation set does not limit the smaller positive tau in the analytic growth proof.'},
    nextRefinementLimit:{reason:'ARCHIVED_OBSERVATION_SET_EXHAUSTED',largestArchivedDepth:last.depth,
      numericTauUnderflowIsFailure:false,fullSpaceSourceReconstructionPending:true,sourceDomainPrerequisiteAuditStatus:'VERIFIED_SEPARATE_RECORDED_SOURCE',
      omittedPhysicsReplacedByZero:false},
    checks:[{id:'immutable-three-component-source-archive-hash',pass:true,recordedOnly:true},
      {id:'observed-node-and-independent-fraction-source-gates',pass:archive.gate.exitCode===0&&archive.gate.nodeTests.passed===10&&archive.gate.independentCheckCount>=38,recordedOnly:true},
      {id:'exact-positive-log-time-and-original-final-field-dependencies-retained',
        pass:c.scope.sourceLogTimeIsPrimary===true&&c.scope.sourceFinalFieldIdentificationExternal===true&&c.claims.finalLocalizedVelocity.dependencies.length===2,recordedOnly:true},
      {id:'separate-original-domain-premises-and-same-captured-localization',pass:sameOriginalBinding&&sameOriginalDomainNode
        &&domainEvidence.gate.pass&&domainEvidence.archiveVerification.pass&&domain.checks.every(row=>row.pass),recordedOnly:true},
      {id:'new-original-operator-core-support-induction-identifies-all-three-recorded-components',
        pass:sameCoreSource&&sameCoreDomain&&sameCorePoint&&core.scope.allThreeVelocityComponentsRestrictionIdentified,
        recordedSourceInputs:true,newSupportProofExecuted:true,freshSourceConstructorExecuted:false}],
    completeN6:false,completeN7:false,completeN8:false,newLeanProofIssued:false,wholeM3Complete:false};
  seals.set(result,canonical(result));return result;
}

export function sourceNearTerminalObservations(result){
  if(!seals.has(result)||seals.get(result)!==canonical(result)
      ||result?.schema!=='MathScope.N8.RecordedSourceNearTerminal/1'||result.recordedOnly!==true||result.freshSourceConstructorExecuted!==false
      ||result.finalFieldBridge?.domainInclusionAudit?.assertedMathematicalObstruction!==false||result.finalFieldBridge?.finalLocalizedFieldIdentified!==false
      ||result.finalFieldBridge.domainInclusionAudit.separateRecordedDomainProofVerified!==true
      ||result.finalFieldBridge.domainInclusionAudit.sameOriginalSourceBinding!==true
      ||result.finalFieldBridge.domainInclusionAudit.sameOriginalLocalizationQStar!==true
      ||result.domainPrerequisiteEvidence?.finalN6FieldConstructed!==false
      ||result.domainPrerequisiteEvidence.archiveSHA256!==result.finalFieldBridge.domainInclusionAudit.archiveSHA256
      ||result.newSupportProofExecuted!==true||result.finalFieldBridge.finalLocalizedCoreRestrictionIdentified!==true
      ||result.finalFieldBridge.coreRestriction.proofSHA256!==result.coreRestrictionEvidence?.proofSHA256
      ||result.proofSHA256!==result.coreRestrictionEvidence.proofSHA256)
    fail('INVALID_SOURCE_ARCHIVE','Expected the byte-verified original three-component source archive.');
  assertRecordedSourceCoreRestriction(result.coreRestrictionEvidence);
  const c=result.certificate,coreObservations=sourceCoreRestrictionObservations(result.coreRestrictionEvidence);
  return {kind:'SOURCE_THREE_COMPONENT_EXACT_ENCLOSURES',samples:[],curves:[],
    contract:{primaryTime:'s=-log(tau)',horizontalCoordinate:'source observation depth d',
      physicalTimeRepresentation:'EXACT_SCALAR_FORMULA_DAG_ONLY',physicalVelocityRepresentation:'EXACT_POSITIVE_SCALE_TIMES_RATIONAL_INTERVAL',
      componentNormalization:'radial: sqrt(Lambda)*tau^(1/2)*ur; azimuthal: (CSelected*sqrt(Lambda)/2)*tau^A*utheta; axial: tau^A*uz/j0',
      sourceArtifact:copy(result.artifact),formulaProgramSHA256:c.graph.scalarProgramSHA256,
      spatialSamplesGenerated:false,freshSourceConstructorExecuted:false,finalN6FieldIdentificationExternal:true,
      finalCoreRestrictionIdentificationExternal:false,finalLocalizedCoreRestrictionIdentified:true,
      newSupportProofExecuted:true,supportProofSHA256:result.proofSHA256,
      finalDomainInclusionProvedByThisArchive:false,separateRecordedDomainPrerequisiteVerified:true,
      sourceDomainArtifact:copy(result.domainPrerequisiteEvidence.domainArtifact),
      sourceDomainArchiveSHA256:result.domainPrerequisiteEvidence.archiveSHA256,
      domainPrerequisiteAuditStatus:'VERIFIED_SEPARATE_RECORDED_SOURCE',sourceCutoffScope:result.finalFieldBridge.sourceCutoffScope},
    claims:[{id:'N8-O-source-near-terminal',observable:'Three original inner-path velocity enclosures with normalized then physical scaling',
      equations:copy(c.leading.definitions),sourceOnly:true,recordedSourceGate:copy(result.gate),
      analyticSourceTail:{radial:c.tail.radial,tangentialAxial:c.tail.tangentialAxial,sampleDefinition:c.tail.sampleDefinition,proof:c.tail.exactErrorProof},
      externalFinalFieldIdentification:copy(c.claims.finalLocalizedVelocity),finalDomainInclusion:copy(result.finalFieldBridge),leanTheorem:null,newLeanExecuted:false,
      historicalFinalFieldIdentificationUnchanged:true,coreRestrictionIdentity:copy(coreObservations.coreIdentity),
      analyticGrowth:copy(coreObservations.analyticGrowth),newSupportProofExecuted:true,supportProofSHA256:result.proofSHA256,
      scope:'RECORDED_ACTUAL_THREE_COMPONENT_CORE_WITH_NEW_CHECKED_ORIGINAL_OPERATOR_SUPPORT_IDENTITY',
      completeN6:false,completeN8:false,wholeM3Complete:false}],coreRestrictionProof:coreObservations};
}
