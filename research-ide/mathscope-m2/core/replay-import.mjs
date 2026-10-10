import {sha256} from '../../mathscope-m0/contracts.mjs';
import {LIMITS,clone,bytes,normalizeRequest} from './registry.mjs';

// The download may contain indentation. The smaller canonical artifact budget
// is checked separately, before hashing or dispatching a mathematical job.
export const IMPORT_TEXT_MAX_BYTES=32*1024*1024;
const REQUIRED=['schema','request','inputHash','environment','result','resultHash','mathematicalHash','semanticHashPolicy','checkpoint','resumePolicy','trust','bundleHash'];
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
function checkDepth(value){
  const stack=[[value,0]];let nodes=0;
  while(stack.length){const [v,depth]=stack.pop();if(++nodes>1000000||depth>128)fail('IMPORT_STRUCTURE_LIMIT','실행 기록의 중첩 또는 항목 수가 가져오기 한도를 넘었습니다.');if(v&&typeof v==='object')for(const key of Object.keys(v))stack.push([v[key],depth+1]);}
}
export function parseReplayText(text){
  if(typeof text!=='string'||!text.trim())fail('IMPORT_JSON_REQUIRED','내보낸 M2 실행 JSON 파일을 선택하거나 내용을 붙여넣으세요.');
  if(text.length>IMPORT_TEXT_MAX_BYTES||new TextEncoder().encode(text).length>IMPORT_TEXT_MAX_BYTES)fail('IMPORT_TEXT_TOO_LARGE','가져오기 파일은 32 MiB 이하여야 합니다.');
  let value;try{value=JSON.parse(text.replace(/^\uFEFF/,''));}catch{fail('IMPORT_INVALID_JSON','올바른 JSON 형식이 아닙니다. 원본 실행 기록을 다시 선택하세요.');}
  checkDepth(value);
  if(!object(value))fail('IMPORT_BUNDLE_REQUIRED','M2 실행 기록 객체가 필요합니다. 실행 입력만 있는 JSON은 입력 편집기에 넣으세요.');
  return value;
}
export async function inspectReplayBundle(value,currentEnvironment){
  if(!object(value))fail('IMPORT_BUNDLE_REQUIRED','M2 실행 기록 객체가 필요합니다.');
  checkDepth(value);
  if(bytes(value)>LIMITS.maxBytes+1048576)fail('IMPORT_ARTIFACT_TOO_LARGE','Replay bundle exceeds the import byte limit.');
  const bundle=clone(value),{bundleHash,...body}=bundle;
  if(Object.keys(bundle).some(k=>!REQUIRED.includes(k))||REQUIRED.some(k=>!Object.hasOwn(bundle,k))||body.schema!=='MathScope.M2ReplayBundle/1'||await sha256(body)!==bundleHash)fail('IMPORT_BUNDLE_DIGEST','Replay bundle digest mismatch.');
  if(body.trust!=='UNTRUSTED_WHEN_SERIALIZED'||body.resumePolicy!=='RECOMPUTE_FROM_ORIGINAL_INPUT')fail('IMPORT_TRUST_POLICY','가져온 기록은 원래 입력으로 재계산해야 합니다. 파일의 검증 등급은 승계하지 않습니다.');
  const request=normalizeRequest(body.request);
  if(!object(body.result)||await sha256(request)!==body.inputHash||await sha256(body.result)!==body.resultHash)fail('IMPORT_RESULT_DIGEST','Replay input/result digest mismatch.');
  const {executionMetrics,...mathematicalBody}=body.result;
  if(body.semanticHashPolicy!=='EXCLUDES_TOP_LEVEL_EXECUTION_METRICS_ONLY'||await sha256(mathematicalBody)!==body.mathematicalHash)fail('IMPORT_MATH_DIGEST','Replay mathematical result digest mismatch.');
  const {hash:importedHash,...importedEnvironment}=body.environment||{};
  if(!object(body.environment)||!importedHash||await sha256(importedEnvironment)!==importedHash)fail('IMPORT_ENVIRONMENT_DIGEST','Replay requires the same installed source and environment. Imported environment digest mismatch.');
  const sameEnvironment=!!currentEnvironment&&importedHash===currentEnvironment.hash&&body.environment.workerSha256===currentEnvironment.workerSha256;
  return {bundle,request,summary:{schema:'MathScope.M2ImportInspection/1',kind:request.kind,inputHash:body.inputHash,originalMathematicalHash:body.mathematicalHash,originalResultStatus:body.result.status,importedVersion:body.environment.version,installedVersion:currentEnvironment?.version||null,importedEnvironmentHash:importedHash,installedEnvironmentHash:currentEnvironment?.hash||null,sameEnvironment,canReplay:sameEnvironment,canLoadInput:true,integrity:'HASHES_CONSISTENT',evidence:'UNTRUSTED_UNTIL_FRESH_RECOMPUTATION',importedEvidenceTrusted:false,automaticEvidenceSave:false,canonicalBytes:bytes(bundle)}};
}
