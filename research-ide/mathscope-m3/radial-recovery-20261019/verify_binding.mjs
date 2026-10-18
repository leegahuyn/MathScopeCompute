/** Scoped regression/source checks; optional output directory is never overwritten. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  bindRecoveredOriginalA13,assertBoundRecoveredOriginalA13,
  projectBoundRecoveredOriginalA13,decodeBoundInputManifest,INPUT_MANIFEST_SHA256,
} from './bind_original_a13.mjs';

const HERE=dirname(fileURLToPath(import.meta.url)),REPO=resolve(HERE,'../../..');
const hash=b=>createHash('sha256').update(b).digest('hex');
const args=process.argv.slice(2);
if(args.length!==0&&(args.length!==2||args[0]!=='--output-dir'||!args[1]))
  throw new Error('Usage: node verify_binding.mjs [--output-dir NEW_OR_EMPTY_DIRECTORY]');
const output=args.length?resolve(args[1]):null;
const names=['BOUND_ORIGINAL_A13.json','RADIAL_BINDING_VALIDATION.json'];
if(output&&names.some(name=>existsSync(resolve(output,name))))throw new Error('EXISTING_EVIDENCE_WILL_NOT_BE_OVERWRITTEN');
const start=performance.now(),startedAt=new Date().toISOString(),checks=[],negative=[];
function check(name,condition,detail={}){
  checks.push({name,pass:Boolean(condition),...detail});assert.ok(condition,name);
}
function rejected(name,operation){
  let caught=false;
  try{operation();}catch(error){caught=true;negative.push({name,rejected:true,errorCode:error.code??null,message:error.message});}
  assert.ok(caught,'Negative control accepted: '+name);
}
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a<0n?-a:a;};
function rational(text){const [n,d=1n]=text.split('/').map(BigInt);return [n,d];}
function inverse(text){const [n,d]=rational(text),g=gcd(n,d);return n/g===1n?String(d/g):String(d/g)+'/'+String(n/g);}
function multiply(a,b){const [an,ad]=rational(a),[bn,bd]=rational(b),n=an*bn,d=ad*bd,g=gcd(n,d);return d/g===1n?String(n/g):String(n/g)+'/'+String(d/g);}
function closedEndpoint(x){
  if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length!==1)return false;
  if(Object.hasOwn(x,'rational'))return /^-?\d+(?:\/\d+)?$/.test(x.rational);
  if(Object.hasOwn(x,'exp'))return closedEndpoint(x.exp);
  if(Object.hasOwn(x,'neg'))return closedEndpoint(x.neg);
  return false;
}
const inputRaw=readFileSync(resolve(HERE,'SOURCE_BOUND_INPUTS.json')),inputs=decodeBoundInputManifest(inputRaw);
const relevant=[resolve(HERE,'SOURCE_BOUND_INPUTS.json'),resolve(HERE,'bind_original_a13.mjs'),resolve(HERE,'verify_binding.mjs'),
  ...inputs.original_code_files.map(r=>resolve(REPO,r.path)),...Object.values(inputs.current_recovered_source_files).map(r=>resolve(REPO,r.path)),resolve(REPO,inputs.caller_capsule.path)];
const before=Object.fromEntries([...new Set(relevant)].map(path=>[relative(REPO,path),hash(readFileSync(path))]));
const binding=await bindRecoveredOriginalA13(),projected=projectBoundRecoveredOriginalA13(binding);
check('private_recovered_binding_passes',assertBoundRecoveredOriginalA13(binding)===true&&binding.pass);
check('exact_recovered77_record_subgraph',binding.sourceRecordCount===77&&binding.sourceNodeIds.includes(275)&&binding.sourceNodeIds.includes(276));
check('original_three_integral_ids',JSON.stringify(binding.inheritedSourceAudit.integrals.map(r=>r.root))==='[239,257,275]');
check('original_nested_binders_retained',binding.sourceNodeIds.includes(229)&&binding.sourceNodeIds.includes(249));
check('all_ten_original_consumer_source_checks_pass',binding.inheritedSourceAudit.checks.length===10&&binding.inheritedSourceAudit.checks.every(r=>r.pass));
check('inherited_source_form_authority_unchanged',binding.inheritedSourceAudit.sourceAuthenticated===false&&binding.inheritedSourceAudit.parentGraphAuthenticationRequired===true);
check('new_authority_explicitly_subgraph_only',binding.sourceAuthenticated===true&&binding.sourceAuthenticationScope.includes('no current indexed/physical caller authority'));
check('original_argument_derivative_and_explicit_half',binding.normalized.argumentDerivative.includes('step argument')&&binding.normalized.changeOfVariables.includes('ds=2 du'));
check('original_square_seed_step_retained',binding.sourceStepFamily.includes('sigma_2')&&binding.sourceStepFamily.includes('distinct from the sigma_1'));
const K=binding.normalized.K.closedRationalBounds,J=binding.normalized.inverseK.closedRationalBounds;
check('normalization_reuses54_and_co',K[0]==='1/256'&&multiply('54',K[0])===K[1]&&binding.normalized.reusedOriginalConsumerFactor==='54');
check('exact_scaled_inverse_order',J[0]===inverse(K[1])&&J[1]===inverse(K[0]));
check('normalization_keeps_shared_positive_h',binding.normalized.hRemainsStrictlyPositive&&binding.normalized.normalizationUsesExactSharedH);
for(const [name,interval] of Object.entries({h:binding.originalHClosedInterval,node275:binding.node275ClosedInterval,node276:binding.node276ClosedInterval})){
  check('closed_original_exponential_endpoints_'+name,closedEndpoint(interval.lower)&&closedEndpoint(interval.upper));
  check('no_zero_or_unknown_lower_'+name,JSON.stringify(interval.lower)!=='{"rational":"0"}'&&!JSON.stringify(interval).includes('"ref"'));
}
check('parameter_traversal_is_original_Md_T_h',JSON.stringify(binding.arithmetic.parameterEvaluationOrder)==='["Md","T","h"]');
check('original_h_definition_preserved',JSON.stringify(binding.independentOriginalParameters.h)==='{"exp":{"product":[{"integer":-8002},{"ref":"T"}]}}');
check('original_co_definition_preserved',JSON.stringify(binding.independentOriginalParameters.co)==='{"rational":"1/256"}');
check('coarse_original_integral_precision_label',binding.inheritedIntegralBounds.every(r=>r.originalIntegralValueRelativeToleranceGuaranteed===false)&&binding.normalized.originalValueRelativeToleranceGuaranteed===false);
check('global_point_field_and_status_not_promoted',binding.scope.currentIndexedCallerAuthenticated===false&&binding.scope.currentPhysicalPointAuthenticated===false&&binding.scope.completeXbNumericallyEvaluated===false&&binding.scope.wholeKNativeFieldCompleted===false&&binding.scope.N7_06_closed===false&&binding.scope.N8_05_closed===false&&binding.scope.new_M3_closures===0&&binding.scope.actual_global_last_resolved_tau===null);
for(const input of [{h:0},{h:'1/8192'},{sourceAuthenticated:true},{root:275},undefined]){
  let caught=false;try{await bindRecoveredOriginalA13(input);}catch(error){caught=true;negative.push({name:'caller replacement rejected '+JSON.stringify(input),rejected:true,errorCode:error.code,message:error.message});}
  assert.ok(caught,'Caller replacement was accepted');
}
rejected('unowned pass flag',()=>assertBoundRecoveredOriginalA13({pass:true,sourceAuthenticated:true}));
rejected('cloned authority object',()=>assertBoundRecoveredOriginalA13(structuredClone(binding)));
rejected('public projection is observation only',()=>assertBoundRecoveredOriginalA13(projected));
const saved=binding.normalized.inverseK.closedRationalBounds[0];binding.normalized.inverseK.closedRationalBounds[0]='0';
rejected('changed normalized reciprocal',()=>assertBoundRecoveredOriginalA13(binding));binding.normalized.inverseK.closedRationalBounds[0]=saved;
check('restored_original_private_instance',assertBoundRecoveredOriginalA13(binding)===true);
const savedScope=binding.scope;let getterReads=0;
Object.defineProperty(binding,'scope',{enumerable:true,configurable:true,get(){
  getterReads++;return getterReads===1?savedScope:{...savedScope,wholeKNativeFieldCompleted:true,N7_06_closed:true};
}});
const guardedProjection=projectBoundRecoveredOriginalA13(binding);
check('projection_reads_mutable_scope_once',getterReads===1);
check('projection_uses_sealed_snapshot_after_getter_check',guardedProjection.scope.wholeKNativeFieldCompleted===false&&guardedProjection.scope.N7_06_closed===false);
Object.defineProperty(binding,'scope',{value:savedScope,writable:true,enumerable:true,configurable:true});
for(const [name,change] of [
  ['original source h',d=>d.source_parameters.h='0'],
  ['original root275',d=>d.root_names.A13TerminalIntegral=1],
  ['source code selfhash',d=>{d.original_code_files[0].sha256='0'.repeat(64);d.selfReportedSHA256=hash(Buffer.from(JSON.stringify(d)));}],
]){
  const modified=structuredClone(inputs);change(modified);const bytes=Buffer.from(JSON.stringify(modified));
  rejected('tampered pinned manifest '+name,()=>decodeBoundInputManifest(bytes));
}
rejected('text instead of exact manifest bytes',()=>decodeBoundInputManifest(inputRaw.toString('utf8')));
const after=Object.fromEntries([...new Set(relevant)].map(path=>[relative(REPO,path),hash(readFileSync(path))]));
check('all_original_and_new_source_bytes_unchanged',JSON.stringify(before)===JSON.stringify(after));
const report={schema:'MathScope.RadialBindingValidation/1',status:'PASS',startedAt,endedAt:new Date().toISOString(),
  runtime:{node:process.version},checks,negativeControls:negative,sourceSha256Before:before,sourceSha256After:after,
  inputManifestSHA256:INPUT_MANIFEST_SHA256,sourceRecordSHA256:binding.sourceRecordSHA256,
  reusedProof:'Original A13 source audit and interval consumer, including factor54 and positive exact h',
  scope:'New recovered subgraph authentication and shared-h normalized inverse only; inherited coarse bounds, no whole-field or relative-precision acceptance',
  outputPolicy:'No output files unless --output-dir is passed; existing evidence filenames are rejected before execution',
  summary:{checksPassed:checks.length,negativeControlsPassed:negative.length,sourceRecords:77,elapsedMilliseconds:performance.now()-start,newM3Closures:0,actualGlobalLastResolvedTau:null}};
if(output){mkdirSync(output,{recursive:true});writeFileSync(resolve(output,names[0]),JSON.stringify(projected,null,2)+'\n',{flag:'wx'});writeFileSync(resolve(output,names[1]),JSON.stringify(report,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({status:'PASS',...report.summary,inputManifestSHA256:INPUT_MANIFEST_SHA256,outputDirectory:output},null,2));
