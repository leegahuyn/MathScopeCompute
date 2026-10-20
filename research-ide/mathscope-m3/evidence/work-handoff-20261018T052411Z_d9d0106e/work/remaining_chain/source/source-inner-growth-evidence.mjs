import {INNER_GROWTH_ARCHIVE,INNER_GROWTH_ARCHIVE_SHA256} from './source-inner-growth-evidence-data.mjs';

const copy=value=>JSON.parse(JSON.stringify(value));
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};

/** Read the byte-verified archive. No source constructor or theorem is rerun. */
export async function recordedInnerGrowth(parameters={}){
  if(!parameters||typeof parameters!=='object'||Array.isArray(parameters)||Object.keys(parameters).length)
    fail('INVALID_INPUT','The recorded original N7 path has fixed source parameters and accepts no replacement certificate, depth or numerical tau.');
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(INNER_GROWTH_ARCHIVE))),
    sha256=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(sha256!==INNER_GROWTH_ARCHIVE_SHA256)fail('SOURCE_ARCHIVE_MISMATCH','The original N7 source archive changed.');
  const archive=copy(INNER_GROWTH_ARCHIVE),certificate=archive.certificate;
  return {...archive,schema:'MathScope.N7.RecordedInnerGrowth/1',
    status:'RECORDED_SOURCE_INNER_GROWTH_VERIFIED',recordedOnly:true,freshSourceConstructorExecuted:false,
    viewLabel:'저장된 실제 실행 자료 · 출처 검증',archiveSHA256:sha256,
    archiveVerification:{canonicalSHA256:sha256,pass:true,freshSourceConstructorExecuted:false,
      meaning:'The packaged immutable archive was hashed again. Its source/artifact files were byte-checked when this bundle was built.'},
    checks:[{id:'immutable-source-archive-hash',pass:true,recordedOnly:true},
      {id:'recorded-source-constructor-eight-and-independent-fraction-nine',pass:archive.gate.nodeTests.passed===8&&archive.gate.independentFractionChecks===9,recordedOnly:true},
      {id:'exact-source-path-and-external-localization-bridge-retained',pass:certificate.scope.exactPositiveTauAndPath&&certificate.scope.sourcePaperTheoremsUsedAsExternalDependencies,recordedOnly:true}],
    completeN6:false,completeN7:false,newLeanProofIssued:false,wholeM3Complete:false};
}

/** Formula node IDs are never passed off as physical sample coordinates. */
export function innerGrowthObservations(result){
  if(result?.schema!=='MathScope.N7.RecordedInnerGrowth/1'||result.recordedOnly!==true||result.freshSourceConstructorExecuted!==false)
    fail('INVALID_SOURCE_ARCHIVE','Expected the verified, recorded original N7 inner restriction.');
  const c=result.certificate;
  return {kind:'SOURCE_INNER_GROWTH_EXACT_ENCLOSURES',samples:[],curves:[],
    contract:{quantity:c.rows[0].normalizedQuantity,horizontalCoordinate:'source observation depth d',
      physicalTimeRepresentation:'EXACT_SCALAR_FORMULA_DAG_ONLY',enclosureMeaning:'RIGOROUS_SOURCE_BOUND_INTERVAL_WITH_EXPLICIT_LOCALIZED_FIELD_BRIDGE',
      sourceArtifact:copy(result.artifact),formulaProgramSHA256:c.graph.scalarProgramSHA256,
      fullFormulaProgram:'results.certificate.formulaProgram',spatialSamplesGenerated:false,
      finitePlotUsedAsBlowupProof:false,freshSourceConstructorExecuted:false},
    claims:[{id:'N7-O-inner-growth',observable:'Original inner-path scaled azimuthal velocity',
      equation:c.remainder.inequality,reference:{blueprint:{source:'MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf',
        sha256:'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac',page:64,criteria:['N7-07']},
        paper:{...c.sourceBinding.paper,pagesUsed:[116,118,124]}},
      recordedSourceGate:copy(result.gate),sourceAnalyticCertificate:{kind:'ORIGINAL_BACKGROUND_INNER_RESTRICTION',
        leadingPositiveLower:c.leading.formula,remainder:c.remainder.inequality,sourceAllOrderTailRetained:true},
      externalFinalFieldIdentification:copy(c.claims.originalLocalizedPath),leanTheorem:null,newLeanExecuted:false,
      scope:'SOURCE_BOUND_INNER_PATH_WITH_EXTERNAL_FINAL_LOCALIZATION_BRIDGE',
      completeN6:false,wholeM3Complete:false,
      meaning:'The displayed intervals follow from the original positive core enclosure and explicit all-order remainder. The final localized field is identified by the listed source theorems; the browser revalidates the archive and does not reconstruct the whole N6 field.'}]};
}
