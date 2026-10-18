import {GLOBAL_SIGNED_ARCHIVE,GLOBAL_SIGNED_ARCHIVE_SHA256} from './source-global-signed-evidence-data.mjs';
const copy=x=>structuredClone(x),seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';

export async function recordedGlobalSigned(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)fail('INVALID_INPUT','This recorded source operator accepts no replacement target, H, amplitude or proof flag.');
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(GLOBAL_SIGNED_ARCHIVE))),
  digest=[...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
 if(digest!==GLOBAL_SIGNED_ARCHIVE_SHA256)fail('SOURCE_ARCHIVE_MISMATCH','The all-cover signed archive changed.');
 const value=copy(GLOBAL_SIGNED_ARCHIVE),s=value.summary,id=s.identity,
  checks=[{id:'recorded-archive-and-raw-lossless-artifact-bound',pass:value.sourceValidation.allRecordedArtifactBytesMatch&&value.sourceValidation.losslessRawArtifactVerified,recordedOnly:true},
   {id:'observed-thirteen-tests-and-230-unchanged-sources',pass:value.gate.pass&&value.gate.nodeTests.passed===13&&value.gate.nodeTests.failed===0&&value.sourceFileCount===230,recordedOnly:true},
   {id:'actual-fixed-H-and-a-no-caller-target',pass:s.rows.length===2&&s.source.newTargetOrWeightsAccepted===false&&s.rows.every(r=>r.noFreshSquareRootOfSignedTarget&&canonical(r.fixedOriginalH)===canonical(s.source.originalH)),recordedOnly:true},
   {id:'actual-global-B-equals-current-Sigma-through-complete-partition',pass:id.exactGlobalBilinearIdentityOnDeclaredAtlas&&id.completePrimaryRows.length===81&&id.localInverseChecks.every(c=>c.pass),recordedOnly:true},
   {id:'all-three-remainders-and-six-covariances-retained',pass:s.rows.every(r=>r.expansion.allThreeRemaindersRetained&&r.expansion.checks.length===6&&r.expansion.checks.every(c=>c.pass))&&s.checks.every(c=>c.pass),recordedOnly:true},
   {id:'historical-scope-not-rewritten-as-full-N6',pass:value.gate.originalN604Complete===false&&s.scope.originalN604Complete===false&&value.scope.completeN6===false&&value.scope.initializedJ0===false&&value.scope.allOrderSourceClassesCertified===false,recordedOnly:true}];
 if(checks.some(c=>!c.pass))fail('SOURCE_ARCHIVE_SCOPE_MISMATCH','The actual signed operator or its historical scope changed.');
 const result={...value,schema:'MathScope.N6.RecordedGlobalSigned/1',status:'RECORDED_ALL_COVER_SIGNED_OPERATOR_VERIFIED',
  archiveSHA256:digest,checks,recordedOnly:true,freshSourceConstructorExecuted:false,newLeanExecuted:false,
  completeN6:false,wholeM3Complete:false};seals.set(result,canonical(result));return result;
}

export function globalSignedObservations(result){
 if(!seals.has(result)||seals.get(result)!==canonical(result))fail('INVALID_SOURCE_ARCHIVE','Use the unchanged verified signed source archive.');
 const s=result.summary,id=s.identity;
 return {kind:'SOURCE_GLOBAL_SIGNED_OPERATOR',samples:[],curves:[],
  contract:{recordedOnly:true,freshSourceConstructorExecuted:false,sourceArtifact:copy(result.artifact),
   packedArtifact:copy(result.packedArtifact),numericalVelocitySamples:false,completeN6:false},
  sourceIdentity:copy(s.source),partitionCount:id.completePrimaryRows.length,
  identity:id.equation,meanPressureAndDefects:copy(s.updated.mean),
  covarianceRows:Object.keys(id.before).map(component=>({component,before:id.before[component],after:id.after[component],
   principal:id.primaryComputedByFullHaarAndCover[component],earlier:id.earlierInteraction[component],
   curl:id.curlInteraction[component],square:id.newIncrementSquare[component],representation:'Exact source expression-node references; not numerical tensor values.'})),
  fullArtifactURL:result.fullArtifactURL,packingInstructionsURL:result.packingInstructionsURL,
  historicalOriginalN604Complete:false,currentAssessmentPath:result.scope.currentAssessmentPath,
  initializedJ0:false,allOrderSourceClassesCertified:false,wholeM3Complete:false};
}
