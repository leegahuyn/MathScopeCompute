/** Cheap scoped source, exact-identity, interval and authority controls.
 * Default: stdout only. --output-dir requires previously unused filenames.
 * This verifier does not invoke the old 700/3407-record producers.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bindRecoveredLogRadius,assertBoundRecoveredLogRadius,projectBoundRecoveredLogRadius,
  decodeLogRadiusInputManifest,INPUT_MANIFEST_SHA256} from './bind_logradius.mjs';

const HERE=dirname(fileURLToPath(import.meta.url)),REPO=resolve(HERE,'../../..');
const args=process.argv.slice(2);
if(args.length!==0&&(args.length!==2||args[0]!=='--output-dir'||!args[1]))
  throw new Error('Usage: node verify_logradius.mjs [--output-dir NEW_OR_EMPTY_DIRECTORY]');
const output=args.length?resolve(args[1]):null,names=['BOUND_LOGRADIUS.json','LOGRADIUS_VALIDATION.json'];
if(output&&names.some(name=>existsSync(resolve(output,name))))throw new Error('EXISTING_EVIDENCE_WILL_NOT_BE_OVERWRITTEN');
const hash=b=>createHash('sha256').update(b).digest('hex');
const start=performance.now(),startedAt=new Date().toISOString(),checks=[],negative=[];
function check(name,condition,detail={}){checks.push({name,pass:Boolean(condition),...detail});assert.ok(condition,name);}
function rejected(name,operation){
  let caught=false;try{operation();}catch(error){caught=true;negative.push({name,rejected:true,errorCode:error.code??null,message:error.message});}
  assert.ok(caught,'Negative control accepted: '+name);
}
const inputBytes=readFileSync(resolve(HERE,'SOURCE_BOUND_INPUTS.json')),inputs=decodeLogRadiusInputManifest(inputBytes);
const pinned=[...inputs.radial_binding_files,...inputs.original_code_files,inputs.caller_capsule,...Object.values(inputs.current_recovered_source_files)];
const files=[resolve(HERE,'bind_logradius.mjs'),resolve(HERE,'verify_logradius.mjs'),resolve(HERE,'SOURCE_BOUND_INPUTS.json'),
  ...pinned.map(row=>resolve(REPO,row.path))];
const snapshot=()=>Object.fromEntries([...new Set(files)].map(path=>[relative(REPO,path),hash(readFileSync(path))]));
const before=snapshot();
const binding=await bindRecoveredLogRadius(),publicView=projectBoundRecoveredLogRadius(binding);
check('private_saved_scalar_binding_passes',binding.pass&&assertBoundRecoveredLogRadius(binding)===true);
check('record_scope_57_trace_60_connection_21_new_arithmetic',binding.executionTraceRecordCount===57&&binding.authenticatedConnectionRecordCount===60&&binding.newArithmeticRecordIds.length===21);
check('six_original_output_roots',JSON.stringify(binding.rows.map(r=>r.root))==='[259,277,278,279,280,319]');
check('actual_original_parameter_domain_is_separated',Object.values(binding.domainChecks).every(Boolean));
check('original_77_record_A13_binding_reused',binding.inheritedA13.sourceRecordCount===77&&binding.inheritedA13.normalized.reusedOriginalConsumerFactor==='54');
check('original_sigma_integral_bounds_reused',JSON.stringify(binding.inheritedA13.numericalIntegralBounds.map(r=>r.root))==='[239,257,275]');
check('original_source_form_consumer_authority_scope_retained',binding.inheritedA13.sourceFormAuditAuthenticated===false&&binding.inheritedA13.sourceFormParentGraphAuthenticationRequired===true);
check('generic_traced_arithmetic_authority_stays_conditional',binding.arithmetic.traversal.sourceAuthenticated===false&&binding.arithmetic.traversal.boundaryPremisesProvedHere===false);
check('only_three_original_boundaries_consumed',JSON.stringify(binding.arithmetic.traversal.conditionalBoundaryIntervalsConsumed)==='[239,257,275]');
check('no_coordinates_or_XR_evaluated',JSON.stringify(binding.arithmetic.parameterEvaluationOrder)==='["Md","T","BOuter","lambda","h","Tf"]'&&!binding.originalParameterIntervals.some(r=>r.name==='XR'));
check('original_logradius_wrapper_retained_without_evaluation',JSON.stringify(binding.unevaluatedInterpretationRecordIds)==='[12,28825,28826]'&&binding.scope.completeXbNumericallyEvaluated===false);
check('fixed54_is_not_precision_refinement',binding.errorScope.inheritedNormalizedLogWidth==='log(54)'&&binding.errorScope.arithmeticBitsAloneRefineIntegralBounds===false&&binding.errorScope.additionalNumericalEndpointInflationRetained===true);
check('widths_report_no_new_acceptance_threshold',binding.rows.every(r=>r.coordinateObservation.acceptanceThreshold===null&&r.coordinateObservation.toleranceClaim===false&&r.originalValueRelativeToleranceGuaranteed===false));
check('all_public_report_objects_are_frozen',Object.isFrozen(binding)&&Object.isFrozen(binding.scope)&&Object.isFrozen(binding.rows)&&binding.rows.every(r=>Object.isFrozen(r.interval)&&Object.isFrozen(r.interval.lower)));
check('global_physical_frame_and_original_status_stay_open',binding.scope.currentIndexedCallerAuthenticated===false&&binding.scope.currentPhysicalPointAuthenticated===false&&binding.scope.ellAndMeshDecisionsEvaluated===false&&binding.scope.wholeKNativeFieldCompleted===false&&binding.scope.N7_06_closed===false&&binding.scope.N8_05_closed===false&&binding.scope.new_M3_closures===0&&binding.scope.actual_global_last_resolved_tau===null);

// Check the complete original 319 affine wrapper with exact rational algebra.
// Stop only at its original wait, inverse-lambda and log-h subexpressions.
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
const q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];};
const qa=(a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const qm=(a,b)=>q(a[0]*b[0],a[1]*b[1]);
const qt=a=>a[1]===1n?String(a[0]):String(a[0])+'/'+String(a[1]);
const records=new Map(inputs.execution_trace.map(r=>[r.id,r.node]));
const atoms=new Map([[6,'T'],[7,'BOuter'],[13,'Tf'],[102,'inverseLambda'],[185,'logH'],[280,'wait']]);
const addAffine=(a,b)=>{const out=new Map(a);for(const[k,v]of b)out.set(k,qa(out.get(k)??q(0),v));return out;};
const multiplyAffine=(a,b)=>{
  const variable=m=>[...m].some(([k,v])=>k!=='constant'&&v[0]!==0n);
  assert.ok(!variable(a)||!variable(b),'Expected a literal affine source wrapper');
  if(variable(a))[a,b]=[b,a];const factor=a.get('constant')??q(0);
  return new Map([...b].map(([k,v])=>[k,qm(factor,v)]));
};
function affine(id){
  if(atoms.has(id))return new Map([[atoms.get(id),q(1)]]);
  const n=records.get(id);assert.ok(n,'Missing original wrapper node');
  if(n.op==='rational')return new Map([['constant',q(...n.args)]]);
  if(n.op==='add')return n.args.map(affine).reduce(addAffine,new Map());
  if(n.op==='multiply')return n.args.map(affine).reduce(multiplyAffine,new Map([['constant',q(1)]]));
  throw new Error('Unexpected original wrapper operator '+n.op);
}
const coefficients=Object.fromEntries([...affine(319)].filter(([,v])=>v[0]!==0n).map(([k,v])=>[k,qt(v)]).sort());
assert.deepEqual(coefficients,{BOuter:'90',T:'1',Tf:'1',constant:'7',inverseLambda:'13',logH:'-4',wait:'1'});
check('independent_exact_AST319_affine_coefficients',true,{coefficients});
check('exact_original_substitution_gives_122009T_and135',qt(qa(qa(q(1),qm(q(90),q(1000))),qm(q(-4),q(-8002))))==='122009'&&qt(qa(q(7),q(128)))==='135');

// An independently ordered recurrence at 512 bits checks the six enclosures.
// It reuses the SAME original coarse integral premises, not a synthetic field.
const {numericalExponentialArithmetic,closedNumericalExponentialEndpoint}=await import('../../mathscope-m2/navier/actual-numerical-exponential-arithmetic.mjs');
const {getPinnedSourceProfile}=await import('../../mathscope-m2/navier/source-profile.mjs');
const {evaluateClosedArithmeticDefinitions}=await import('../../mathscope-m2/navier/actual-closed-parameter-arithmetic.mjs');
const {tracedArithmeticEvaluator}=await import('../../mathscope-m2/navier/actual-selection-arithmetic-enclosure-kernel.mjs');
const N=numericalExponentialArithmetic({precisionBits:512,maxOperations:200000,maxMemoEntries:8192});
const pp=evaluateClosedArithmeticDefinitions(getPinnedSourceProfile().parametersExactExpressions,N,{names:['h','lambda','T']});
const h=pp.values.get('h'),lambda=pp.values.get('lambda'),T=pp.values.get('T'),one=N.one();
const a=N.sub(one,lambda),b=N.sub(one,h),L=N.mul(N.point(-4),N.log(h));
const I=new Map(binding.inheritedA13.numericalIntegralBounds.map(r=>[r.root,N.fromClosed(r.numericalInterval)]));
const Q0=N.div(N.sub(lambda,h),a);
const Qsteep=N.mul(N.exp(N.div(N.neg(a),N.point(2))),N.add(Q0,I.get(239)));
const Qb=N.mul(N.exp(N.div(N.neg(b),N.point(2))),N.add(N.add(Qsteep,N.mul(b,L)),I.get(257)));
const ratio=N.div(Qb,I.get(275)),logRatio=N.log(ratio),inverseB=N.inverse(b),wait=N.div(logRatio,b);
const logRadius=N.add(N.add(N.mul(N.point(13),N.exp(N.mul(N.point(1000),T))),N.mul(N.point(122009),T)),N.add(N.point(135),wait));
const independent=new Map([[259,Qb],[277,ratio],[278,logRatio],[279,inverseB],[280,wait],[319,logRadius]]);
const overlap=(x,y)=>[-1,0].includes(N.compareEndpoints(x.lower,y.upper))&&[-1,0].includes(N.compareEndpoints(y.lower,x.upper));
for(const row of binding.rows){
  check('closed_ordered_strictly_positive_original_output_'+row.root,closedNumericalExponentialEndpoint(row.interval.lower)&&closedNumericalExponentialEndpoint(row.interval.upper)&&N.compareEndpoints(row.interval.lower,{rational:'0'})===1&&[-1,0].includes(N.compareEndpoints(row.interval.lower,row.interval.upper)));
  check('independent512_original_recurrence_overlaps_AST_'+row.root,overlap(row.interval,N.toClosed(independent.get(row.root))));
}
check('actual_ratio_lower_exceeds_one',N.compareEndpoints(binding.rows.find(r=>r.root===277).interval.lower,{rational:'1'})===1);
const K=N.fromClosed({lower:{rational:'1/256'},upper:{rational:'27/128'}});
const normalizedWait=N.div(N.add(N.mul(N.point(8002),T),N.sub(N.log(Qb),N.log(K))),b);
check('shared_h_normalized_wait_independently_overlaps_original_AST',overlap(binding.rows.find(r=>r.root===280).interval,N.toClosed(normalizedWait)));
const coarseLower=N.div(L,N.point(4)),coarseUpper=N.add(L,N.point('137/30'));
const actualQb=binding.rows.find(r=>r.root===259).interval;
check('executed_Qb_stays_inside_analytic_L_over4_to_L_plus137_over30',N.compareEndpoints(actualQb.lower,N.toClosed(coarseLower).lower)===1&&N.compareEndpoints(actualQb.upper,N.toClosed(coarseUpper).upper)===-1);

for(const value of [undefined,null,{h:0},{boundaries:{275:1}},{precisionBits:512},{sourceAuthenticated:true},{scope:{N7_06_closed:true}}]){
  let caught=false;try{await bindRecoveredLogRadius(value);}catch(error){caught=true;negative.push({name:'replacement source or premise '+JSON.stringify(value),rejected:true,errorCode:error.code??null,message:error.message});}
  assert.ok(caught,'A caller replacement was accepted');
}
rejected('unowned pass and source flag',()=>assertBoundRecoveredLogRadius({pass:true,sourceAuthenticated:true}));
rejected('cloned authority',()=>assertBoundRecoveredLogRadius(structuredClone(binding)));
rejected('serialized authority',()=>assertBoundRecoveredLogRadius(JSON.parse(JSON.stringify(binding))));
rejected('public projection is observation only',()=>assertBoundRecoveredLogRadius(publicView));
rejected('proxy is not private authority',()=>assertBoundRecoveredLogRadius(new Proxy(binding,{})));
rejected('frozen scope cannot be promoted',()=>{binding.scope.N7_06_closed=true;});
rejected('frozen scope cannot become an alternating getter',()=>Object.defineProperty(binding,'scope',{enumerable:true,get:()=>({wholeKNativeFieldCompleted:true})}));
rejected('frozen numerical premise cannot be replaced',()=>{binding.inheritedA13.numericalIntegralBounds[2].numericalInterval.lower={rational:'0'};});
rejected('frozen output cannot be changed',()=>{binding.rows[0].interval.lower={rational:'0'};});
for(const[name,change]of [
  ['actual319 operand',x=>{x.execution_trace.find(r=>r.id===319).node.args=[1,294];}],
  ['original275 boundary',x=>{x.non_arithmetic_boundary_ids=[239,257,1];}],
  ['positive h definition',x=>{x.original_parameter_definitions.h={integer:0};}],
  ['fixed factor54',x=>{x.normalization.factor=1;}],
  ['source code selfhash',x=>{x.original_code_files[0].sha256='0'.repeat(64);x.selfhash=hash(Buffer.from(JSON.stringify(x)));}],
  ['Xb interpretation link',x=>{x.unevaluated_Xb_interpretation_link.find(r=>r.id===28825).node.args=[280];}],
]){
  const changed=structuredClone(inputs);change(changed);
  rejected('modified input manifest '+name,()=>decodeLogRadiusInputManifest(Buffer.from(JSON.stringify(changed))));
}
rejected('text cannot substitute manifest bytes',()=>decodeLogRadiusInputManifest(inputBytes.toString('utf8')));
const terminalRow=inputs.execution_trace.find(r=>r.id===275);
const bareTrace={nodes:[{id:275,node:terminalRow.node}],nonArithmeticBoundaries:[{id:275}]};
rejected('generic trace missing original integral boundary',()=>tracedArithmeticEvaluator(bareTrace,N).value(275));
const bare=tracedArithmeticEvaluator(bareTrace,N,{boundaries:new Map([[275,N.one()]])});bare.value(275);
check('generic_foreign_boundary_is_not_a_source_proof',bare.report().sourceAuthenticated===false&&bare.report().boundaryPremisesProvedHere===false);
rejected('generic foreign boundary has no wrapper authority',()=>assertBoundRecoveredLogRadius(bare.report()));
check('private_binding_remains_valid_after_negative_controls',assertBoundRecoveredLogRadius(binding)===true);
const after=snapshot();check('original_frozen_and_new_source_bytes_unchanged',JSON.stringify(before)===JSON.stringify(after));
const report={schema:'MathScope.RecoveredLogRadiusValidation/1',status:'PASS',startedAt,endedAt:new Date().toISOString(),
  runtime:{node:process.version},checks,negativeControls:negative,sourceSHA256Before:before,sourceSHA256After:after,
  inputManifestSHA256:INPUT_MANIFEST_SHA256,sourceRecordSHA256:binding.sourceRecordSHA256,
  independentRecurrence:{precisionBits:512,arithmetic:N.report(),sameOriginalIntegralBounds:true,
    comparisonIsM3Acceptance:false,originalIntegralRelativePrecisionGuaranteed:false},
  outputPolicy:'No output files without --output-dir; existing evidence filenames are rejected before execution',
  scope:'Saved scalar A13-to-logradius connection only; no whole Xb relative error, actual frame or M3/M4 acceptance',
  summary:{checksPassed:checks.length,negativeControlsPassed:negative.length,traceRecords:57,connectionRecords:60,
    elapsedMilliseconds:performance.now()-start,newM3Closures:0,actual_global_last_resolved_tau:null}};
if(output){
  mkdirSync(output,{recursive:true});
  writeFileSync(resolve(output,names[0]),JSON.stringify(publicView,null,2)+'\n',{flag:'wx'});
  writeFileSync(resolve(output,names[1]),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
}
process.stdout.write(JSON.stringify({status:report.status,...report.summary})+'\n');
