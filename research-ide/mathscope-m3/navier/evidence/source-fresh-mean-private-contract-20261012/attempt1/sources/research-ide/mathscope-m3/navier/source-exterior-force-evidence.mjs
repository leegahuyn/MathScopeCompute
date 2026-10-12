import {SOURCE_EXTERIOR_DOMAIN_ARCHIVE,SOURCE_EXTERIOR_DOMAIN_ARCHIVE_SHA256} from './source-exterior-force-evidence-data.mjs';

const copy=x=>structuredClone(x),seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const emptyInput=input=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)fail('INVALID_INPUT','This archive has fixed original source inputs. Caller-supplied force, qStar, parameters or proof flags are not accepted.');};

/** Verify a compact recorded execution. The full inherited scalar graph is
 * retained at the pinned repository artifact rather than copied into the UI.
 */
export async function recordedSourceN7DomainExterior(input={}){
  emptyInput(input);const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(SOURCE_EXTERIOR_DOMAIN_ARCHIVE))),
    archiveSHA256=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(archiveSHA256!==SOURCE_EXTERIOR_DOMAIN_ARCHIVE_SHA256)fail('SOURCE_ARCHIVE_MISMATCH','The recorded original source domain/exterior archive changed.');
  const archive=copy(SOURCE_EXTERIOR_DOMAIN_ARCHIVE),{domain,exterior,gate}=archive,
    checks=[{id:'compact-source-archive-canonical-hash',pass:true,recordedOnly:true},
      {id:'observed-source-and-independent-exact-gates',pass:gate.pass&&gate.exitCode===0&&gate.nodeTests.passed===11&&gate.nodeTests.failed===0&&gate.nodeTests.skipped===0&&
        gate.sourceFilesUnchanged&&gate.independentStatus==='PASS'&&archive.independentVerification.checks.every(r=>r.pass),recordedOnly:true},
      {id:'all-initial-fixed-source-domain-premises',pass:domain.initialPrerequisites.length===5&&domain.checks.length===12&&domain.checks.every(r=>r.pass)&&
        domain.fixedMeanMap.source.actualImportedSourceExecuted&&domain.fixedMeanMap.checks.every(r=>r.pass)&&domain.constants.domainRatio==='1/64',recordedOnly:true},
      {id:'same-original-domain-source-and-exterior-source',pass:Object.entries(domain.sourceBinding).every(([key,value])=>canonical(value)===canonical(exterior.sourceBinding[key]))&&
        domain.sourceBinding.common6FamilyGraph.sha256===exterior.sourceBinding.common6FamilyGraph.sha256&&
        domain.domainProof.sourceTheoremAppliedToExecutedInitialPremises===true&&domain.domainProof.unknownHistoricalGammaValueUsed===false,recordedOnly:true},
      {id:'actual-exterior-pressure-and-nonzero-divergence-retained',pass:exterior.checks.every(r=>r.pass)&&exterior.scope.originalHeatRestrictionOnly&&
        exterior.scope.fullImproperPressureJetIntegralRetained&&exterior.rows.length===5&&exterior.rows.every(r=>r.actualSourceAmplitudeUsed&&
          r.midpoint.normalizedDivergence.sign==='STRICTLY_NEGATIVE'&&r.midpoint.normalizedTheta.tinyHRetained),recordedOnly:true},
      {id:'full-final-field-global-force-and-active-energy-not-claimed',pass:domain.scope.fullN6FinalPotentialsConstructed===false&&
        exterior.scope.wholeFinalN6FieldConstructed===false&&exterior.scope.wholeGlobalTerminalForceJetsConstructed===false&&
        exterior.scope.globalForceExtensionConstructed===false&&exterior.scope.wholeKEnergyNearTerminalComputed===false&&archive.scope.wholeN7Complete===false,recordedOnly:true}];
  if(checks.some(r=>!r.pass))fail('SOURCE_ARCHIVE_SCOPE_MISMATCH','The original source domain/exterior archive is missing a premise or enlarged its execution scope.');
  const result={...archive,schema:'MathScope.N7.RecordedSourceDomainExterior/1',status:'RECORDED_SOURCE_DOMAIN_AND_EXTERIOR_JETS_VERIFIED',
    viewLabel:'원본 cutoff 정의역 · 실제 heat 외곽의 종단 외력',archiveSHA256,recordedOnly:true,freshSourceConstructorExecuted:false,
    archiveVerification:{pass:true,canonicalSHA256:archiveSHA256,sourceBytesVerifiedWhenPackaged:true,
      meaning:'The compact observed record is rehashed now. Packaging checked every executed source file and complete raw artifact. The live large source constructor is not reexecuted in this view.'},
    domainPrerequisiteStatus:'EXECUTED_INITIAL_SOURCE_PREMISES_WITH_EXPLICIT_LEMMA9_7_APPLICATION',
    finalFieldIdentityStatus:'FINAL_NONZERO_N6_FIELD_CONSTRUCTION_NOT_EXECUTED',checks,
    completeN6:false,completeN7:false,fullFinalFieldConstructed:false,wholeLocalizedForceConstructed:false,
    wholeKEnergyNearTerminalComputed:false,globalForceExtensionConstructed:false,newLeanExecuted:false,wholeM3Complete:false};
  seals.set(result,canonical(result));return result;
}

/** N8 may consume this separate recorded prerequisite without changing its
 * historical source certificate or claiming that the final field exists as
 * an executed numerical object in this program.
 */
export async function recordedSourceLocalizationDomain(input={}){
  const archive=await recordedSourceN7DomainExterior(input);
  return {schema:'MathScope.N7.RecordedSourceLocalizationDomain/1',status:'RECORDED_FINAL_DOMAIN_PREREQUISITES_VERIFIED',
    recordedOnly:true,freshSourceConstructorExecuted:false,archiveSHA256:archive.archiveSHA256,
    domainArtifact:copy(archive.domainArtifact),sourceReceipt:copy(archive.receipt),sourceCapture:copy(archive.sourceCapture),
    domain:copy(archive.domain),gate:copy(archive.gate),archiveVerification:copy(archive.archiveVerification),
    sourceDomainChoiceJustified:true,externalSourceTheoremApplied:true,finalN6FieldConstructed:false,
    finalLocalizedNonzeroFieldIdentifiedByThisConsumer:false,completeN7:false,wholeM3Complete:false,newLeanExecuted:false};
}

export function sourceExteriorForceObservations(result){
  if(!seals.has(result)||seals.get(result)!==canonical(result))fail('INVALID_SOURCE_ARCHIVE','Use the unchanged verified recorded domain/exterior result.');
  const {domain,exterior}=result;
  return {kind:'SOURCE_DOMAIN_AND_EXTERIOR_TERMINAL_FORCE_JETS',samples:[],curves:[],
    contract:{sourceArtifact:copy(result.exteriorArtifact),domainArtifact:copy(result.domainArtifact),
      completeScalarProgram:copy(result.fullScalarProgram),recordedOnly:true,freshSourceConstructorExecuted:false,
      originalHeatExteriorRestrictionOnly:true,fullFinalN6FieldConstructed:false,wholeKEnergyNearTerminalComputed:false},
    domain:{qBigOverCommonQStar:'1/64',supportOverQBig:'1/4',strictHalfDomainGap:'1/4',
      initialZeroInterval:copy(domain.cutoffConclusions.initialZeroInterval),compactK:copy(domain.cutoffConclusions.compactK),
      unitPlateau:copy(domain.cutoffConclusions.unitPlateau),sourceTheoremPages:copy(domain.domainProof.sourcePages),
      initialPrerequisiteCount:domain.initialPrerequisites.length,allInitialChecksPass:domain.checks.every(r=>r.pass)},
    forceRows:exterior.rows.map(row=>({order:row.order,location:'z=0, r^2=3/8; original radial-cutoff midpoint',
      velocityPolynomial:copy(row.polynomials.velocityPolynomial),squarePolynomial:copy(row.polynomials.squarePolynomial),
      pressure:row.pressureJet,radial:row.midpoint.normalizedRadial.formula,theta:row.midpoint.normalizedTheta.formula,
      divergence:row.midpoint.normalizedDivergence.formula,radialSign:'POSITIVE',thetaSign:'NEGATIVE',divergenceSign:'NEGATIVE',
      radialScale:'S_j/r',thetaScale:'K_j',divergenceScale:'S_j',n:'2A+j',A:'1/2+h',
      amplitude:'Original c_infinity=sqrt(2)*actual M2 exteriorAmplitude',tinyPositiveHRetained:true,
      pressurePoissonIdentity:row.midpoint.originalPressurePoisson.equation,wholeGlobalJet:false})),
    initialZeroEnergy:copy(exterior.initialZeroBranch),globalForceExtension:copy(exterior.globalExtension),
    completeN6:false,completeN7:false,wholeM3Complete:false};
}
