import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const OUT=dirname(fileURLToPath(import.meta.url));
const REPO='/workspace/scratch/00fe7982b3e1/MathScopeCompute';
const UNIT=resolve(REPO,'research-ide/mathscope-m3/logradius-recovery-20261019');
const hash=b=>createHash('sha256').update(b).digest('hex');
const audit=JSON.parse(readFileSync(resolve(OUT,'SOURCE_READ_AUDIT.json')));
const pins=[...audit.moduleSnapshots,...audit.pinResults];
const snapshot=()=>Object.fromEntries(pins.map(row=>[row.path,hash(readFileSync(resolve(REPO,row.path)))]));
const before=snapshot(),checks=[],negative=[];
const check=(name,test,detail={})=>{assert.ok(test,name);checks.push({name,pass:true,...detail});};
const rejects=(name,fn)=>{let e;try{fn();}catch(error){e=error;}assert.ok(e,name);negative.push({name,rejected:true,code:e.code??null,message:e.message});};
for(const row of pins)assert.equal(before[row.path],row.sha256,row.path);
const startedAt=new Date().toISOString(),start=performance.now();
const mod=await import(pathToFileURL(resolve(UNIT,'bind_logradius.mjs')));
const binding=await mod.bindRecoveredLogRadius();
check('actual_private_binding_is_issued',binding.pass===true&&mod.assertBoundRecoveredLogRadius(binding)===true);
const walkFrozen=(x,seen=new Set())=>{if(!x||typeof x!=='object'||seen.has(x))return true;seen.add(x);return Object.isFrozen(x)&&Object.values(x).every(v=>walkFrozen(v,seen));};
check('every_nested_report_object_is_frozen',walkFrozen(binding));
function endpointSign(e,depth=0){
 assert.ok(depth<128&&e&&typeof e==='object'&&!Array.isArray(e));
 const keys=Object.keys(e);assert.equal(keys.length,1);
 if(keys[0]==='rational'){
  assert.match(e.rational,/^-?\d+(?:\/[1-9]\d*)?$/);
  const [n,d='1']=e.rational.split('/');assert.ok(BigInt(d)>0n);
  return BigInt(n)<0n?-1:BigInt(n)>0n?1:0;
 }
 if(keys[0]==='exp'){endpointSign(e.exp,depth+1);return 1;}
 if(keys[0]==='neg')return -endpointSign(e.neg,depth+1);
 assert.fail('Unclosed symbolic endpoint');
}
check('six_rows_have_independently_parsed_finite_positive_endpoints',
 JSON.stringify(binding.rows.map(r=>r.root))==='[259,277,278,279,280,319]'&&
 binding.rows.every(r=>endpointSign(r.interval.lower)===1&&endpointSign(r.interval.upper)===1));
check('precise_source_scope_and_original_open_states_are_retained',
 binding.executionTraceRecordCount===57&&binding.authenticatedConnectionRecordCount===60&&
 binding.inheritedA13.sourceRecordCount===77&&binding.inheritedA13.sourceFormAuditAuthenticated===false&&
 binding.inheritedA13.sourceFormParentGraphAuthenticationRequired===true&&
 binding.arithmetic.traversal.sourceAuthenticated===false&&binding.arithmetic.traversal.boundaryPremisesProvedHere===false&&
 binding.scope.new_M3_closures===0&&binding.scope.actual_global_last_resolved_tau===null&&
 ['N7_06_closed','N8_05_closed','wholeKNativeFieldCompleted','completeXbNumericallyEvaluated',
 'currentIndexedCallerAuthenticated','currentPhysicalPointAuthenticated','ellAndMeshDecisionsEvaluated'].every(k=>binding.scope[k]===false));
check('input_T_is_original_parameter_and_XR_remains_unevaluated',
 JSON.stringify(binding.arithmetic.traversal.sourceParametersNumericallyConsumed)==='["BOuter","T","Tf","h","lambda"]'&&
 !binding.originalParameterIntervals.some(x=>x.name==='XR'));
check('fixed_integral_error_is_not_an_arithmetic_accuracy_claim',
 binding.errorScope.reusedFactor54===true&&binding.errorScope.integralRefinementPerformed===false&&
 binding.errorScope.inheritedNormalizedLogWidth==='log(54)'&&binding.errorScope.additionalNumericalEndpointInflationRetained===true&&
 binding.errorScope.arithmeticBitsAloneRefineIntegralBounds===false&&
 binding.rows.every(r=>r.coordinateObservation.acceptanceThreshold===null&&r.coordinateObservation.toleranceClaim===false));
const originalProjection=mod.projectBoundRecoveredLogRadius(binding);
rejects('alternating_getter_cannot_replace_frozen_scope',()=>Object.defineProperty(binding,'scope',{enumerable:true,get(){return {N7_06_closed:true};}}));
check('Reflect_set_cannot_promote_status',Reflect.set(binding.scope,'N7_06_closed',true)===false&&binding.scope.N7_06_closed===false);
originalProjection.scope.N7_06_closed=true;
originalProjection.rows[0].interval.lower={rational:'0'};
rejects('mutated_projection_cannot_become_authority',()=>mod.assertBoundRecoveredLogRadius(originalProjection));
rejects('serialized_original_cannot_become_authority',()=>mod.assertBoundRecoveredLogRadius(JSON.parse(JSON.stringify(binding))));
const newProjection=mod.projectBoundRecoveredLogRadius(binding);
check('public_mutation_does_not_change_private_projection',newProjection.scope.N7_06_closed===false&&endpointSign(newProjection.rows[0].interval.lower)===1&&mod.assertBoundRecoveredLogRadius(binding)===true);
const manifest=readFileSync(resolve(UNIT,'SOURCE_BOUND_INPUTS.json'));
rejects('BOM_changed_manifest_bytes_are_rejected',()=>mod.decodeLogRadiusInputManifest(Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),manifest])));
let replacementError;
try{await mod.bindRecoveredLogRadius(undefined);}catch(e){replacementError=e;}
assert.ok(replacementError);
negative.push({name:'explicit_undefined_is_a_forbidden_replacement_argument',rejected:true,code:replacementError.code,message:replacementError.message});
const after=snapshot();
check('all_34_reviewed_source_and_pin_rows_stable',JSON.stringify(before)===JSON.stringify(after),{snapshotEntries:Object.keys(before).length});
const receipt={schema:'MathScope.IndependentLogRadiusAPISpotChecks/1',status:'PASS',startedAt,endedAt:new Date().toISOString(),
 runtime:{node:process.version},checks,negativeControls:negative,sourceSHA256Before:before,sourceSHA256After:after,
 summary:{checksPassed:checks.length,negativeControlsPassed:negative.length,elapsedMilliseconds:performance.now()-start},
 scope:'One actual bound saved scalar connection plus small independent endpoint parser and API negative controls. No full verifier or 700/3407 historical producer rerun; not original mathematical acceptance.'};
writeFileSync(resolve(OUT,'INDEPENDENT_API_CHECKS.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
writeFileSync(resolve(OUT,'OBSERVED_BOUND_LOGRADIUS.json'),JSON.stringify(newProjection,null,2)+'\n',{flag:'wx'});
process.stdout.write(JSON.stringify({status:receipt.status,...receipt.summary})+'\n');
