/** Execute the saved original scalar Qb -> wait -> log(Xb/XR) graph.
 * The existing A.13 proof/consumer/binding and generic traced arithmetic
 * evaluator are reused. No original integral is replaced by zero, a sample,
 * or a new cutoff, and no actual indexed/physical caller is asserted here.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve,relative,isAbsolute} from 'node:path';

const HERE=dirname(fileURLToPath(import.meta.url)),REPO=resolve(HERE,'../../..');
export const INPUT_MANIFEST_SHA256='c42dd7c8c6cbd442597f30ea6cc58022ba280c8ea36021ad1eb93b90c653f368';
const owners=new WeakMap();
const hash=b=>createHash('sha256').update(b).digest('hex');
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?
  '['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const same=(a,b)=>canonical(a)===canonical(b);
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_LOGRADIUS_BINDING'});};
function deepFreeze(value){
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    for(const child of Object.values(value))deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Public decoding only validates exact reviewed bytes; it issues no authority. */
export function decodeLogRadiusInputManifest(bytes){
  if(!(bytes instanceof Uint8Array))fail('EXACT_MANIFEST_BYTES_REQUIRED');
  const snapshot=Buffer.from(bytes);
  if(hash(snapshot)!==INPUT_MANIFEST_SHA256)fail('THE_COMPLETE_REVIEWED_LOGRADIUS_MANIFEST_CHANGED');
  return JSON.parse(snapshot.toString('utf8'));
}

function sourcePath(path){
  const absolute=resolve(REPO,path),rel=relative(REPO,absolute);
  if(isAbsolute(path)||rel==='..'||rel.startsWith('../'))fail('SOURCE_PATH_OUTSIDE_REPOSITORY');
  return absolute;
}
function pinnedRead(row){
  const bytes=readFileSync(sourcePath(row.path));
  if(bytes.length!==row.bytes||hash(bytes)!==row.sha256)fail('SOURCE_BYTES_CHANGED: '+row.path);
  return bytes;
}
function originalChildren(node){
  if(['rational','source_parameter'].includes(node.op))return [];
  if(['add','multiply','inverse','exp','log_positive'].includes(node.op))return node.args;
  fail('UNDECLARED_NONARITHMETIC_SOURCE_NODE: '+node.op);
}

function authenticate(){
  const inputBytes=readFileSync(resolve(HERE,'SOURCE_BOUND_INPUTS.json'));
  const inputs=decodeLogRadiusInputManifest(inputBytes);
  const pins=[...inputs.radial_binding_files,...inputs.original_code_files,inputs.caller_capsule,
    ...Object.values(inputs.current_recovered_source_files)];
  const pinnedBytes=new Map(pins.map(row=>[row.path,pinnedRead(row)]));
  const capsule=JSON.parse(pinnedBytes.get(inputs.caller_capsule.path));
  const actual=JSON.parse(pinnedBytes.get(inputs.current_recovered_source_files.closure.path)).records;
  const records=[...inputs.execution_trace,...inputs.unevaluated_Xb_interpretation_link];
  const recordMap=new Map();
  for(const row of records){
    if(recordMap.has(row.id)||!Number.isSafeInteger(row.id)||row.id<0||
       !same(row.node,actual[row.id])||!same(row.node,capsule.source_nodes[row.id])||
       !same(row.origins,['closure'])||!same(capsule.source_record_origins[row.id],row.origins))
      fail('ORIGINAL_LOGRADIUS_RECORD_OR_ORIGIN_CHANGED: '+row.id);
    recordMap.set(row.id,row.node);
  }
  const stopIds=new Set(inputs.non_arithmetic_boundary_ids),seen=new Set(),pending=Object.values(inputs.output_roots);
  while(pending.length){
    const id=pending.pop();if(seen.has(id))continue;
    const node=recordMap.get(id);if(!node)fail('MISSING_ACTUAL_LOGRADIUS_OPERAND: '+id);
    seen.add(id);
    if(stopIds.has(id)){
      if(node.op!=='definite_integral')fail('A13_BOUNDARY_IS_NO_LONGER_AN_INTEGRAL');
    }else pending.push(...originalChildren(node));
  }
  if(!same([...seen].sort((a,b)=>a-b),inputs.execution_trace.map(r=>r.id)))fail('INCOMPLETE_OR_EXTRA_EXECUTION_TRACE');
  if(!same(recordMap.get(28825),{op:'exp',args:[319]})||
     !same(recordMap.get(28826),{op:'multiply',args:[12,28825]})||
     !same(recordMap.get(12),{op:'source_parameter',args:['XR']}))fail('ORIGINAL_XB_INTERPRETATION_CHANGED');
  return {inputs,pins,inputBytes,recordSHA256:hash(Buffer.from(canonical(records))),
    trace:{nodes:inputs.execution_trace.map(({id,node})=>({id,node})),
      nonArithmeticBoundaries:inputs.non_arithmetic_boundary_ids.map(id=>({id,op:'definite_integral'}))}};
}

const rationalTextDifference=(upper,lower)=>{
  const [un,ud=1n]=upper.split('/').map(BigInt),[ln,ld=1n]=lower.split('/').map(BigInt);
  let n=un*ld-ln*ud,d=ud*ld,a=n<0n?-n:n,b=d;
  while(b)[a,b]=[b,a%b];n/=a;d/=a;return d===1n?String(n):String(n)+'/'+String(d);
};
function coordinateObservation(N,interval){
  let current=interval;
  for(let depth=0;depth<=8;depth++){
    const closed=N.toClosed(current);
    if(Object.hasOwn(closed.lower,'rational')&&Object.hasOwn(closed.upper,'rational'))
      return {coordinateDefinition:depth===0?'value':'log^'+depth+'(value)',logarithmCount:depth,
        coordinate:{lower:closed.lower.rational,upper:closed.upper.rational},
        coordinateWidth:rationalTextDifference(closed.upper.rational,closed.lower.rational),
        acceptanceThreshold:null,toleranceClaim:false,originalValueRelativeToleranceGuaranteed:false};
    if(depth===8||N.compareEndpoints(closed.lower,{rational:'0'})!==1)break;
    current=N.log(current);
  }
  return {coordinateDefinition:null,acceptanceThreshold:null,toleranceClaim:false,
    originalValueRelativeToleranceGuaranteed:false,reason:'No regular coordinate found within the diagnostic depth budget'};
}

/** No caller graph, boundary value, parameter, precision setting or status is accepted. */
export async function bindRecoveredLogRadius(...args){
  if(args.length)fail('THIS_BINDING_ACCEPTS_NO_REPLACEMENT_SOURCE_OR_PREMISE');
  const source=authenticate(),base='research-ide/mathscope-m2/navier/';
  const [radial,arithmetic,closed,profile,kernel]=await Promise.all([
    import(pathToFileURL(sourcePath('research-ide/mathscope-m3/radial-recovery-20261019/bind_original_a13.mjs'))),
    import(pathToFileURL(sourcePath(base+'actual-numerical-exponential-arithmetic.mjs'))),
    import(pathToFileURL(sourcePath(base+'actual-closed-parameter-arithmetic.mjs'))),
    import(pathToFileURL(sourcePath(base+'source-profile.mjs'))),
    import(pathToFileURL(sourcePath(base+'actual-selection-arithmetic-enclosure-kernel.mjs'))),
  ]);
  const originalA13=await radial.bindRecoveredOriginalA13();
  const inherited=radial.projectBoundRecoveredOriginalA13(originalA13);
  if(!inherited.pass||!inherited.sourceAuthenticated||inherited.sourceRecordCount!==77||
     inherited.normalized.reusedOriginalConsumerFactor!=='54'||inherited.scope.hReplacedByZero)
    fail('UNCHANGED_PRIVATE_ORIGINAL_A13_PREMISES_REQUIRED');
  const definitions=profile.getPinnedSourceProfile().parametersExactExpressions;
  for(const [name,definition] of Object.entries(source.inputs.original_parameter_definitions))
    if(!same(definitions[name],definition))fail('ORIGINAL_PARAMETER_DEFINITION_CHANGED: '+name);
  const N=arithmetic.numericalExponentialArithmetic({precisionBits:256,maxOperations:200000,maxMemoEntries:8192});
  const parameters=closed.evaluateClosedArithmeticDefinitions(definitions,N,{names:source.inputs.requested_parameter_names});
  const h=parameters.values.get('h'),lambda=parameters.values.get('lambda'),T=parameters.values.get('T');
  if(!same(N.toClosed(h),inherited.originalHClosedInterval))fail('INHERITED_ORIGINAL_H_ENDPOINTS_CHANGED');
  const domainChecks={
    TGreaterThan128:N.compareEndpoints(N.toClosed(T).lower,{rational:'128'})===1,
    hStrictlyPositive:N.compareEndpoints(N.toClosed(h).lower,{rational:'0'})===1,
    lambdaGreaterThanH:N.compareEndpoints(N.toClosed(lambda).lower,N.toClosed(h).upper)===1,
    lambdaLessThanOneSixteenth:N.compareEndpoints(N.toClosed(lambda).upper,{rational:'1/16'})===-1,
  };
  if(Object.values(domainChecks).some(pass=>!pass))fail('ORIGINAL_PARAMETER_DOMAIN_NOT_SEPARATED');
  const boundaries=new Map(inherited.inheritedIntegralBounds.map(row=>[row.root,N.fromClosed(row.numericalInterval)]));
  if(!same([...boundaries.keys()],[239,257,275]))fail('ORIGINAL_A13_BOUNDARY_IDENTITIES_CHANGED');
  const evaluation=kernel.tracedArithmeticEvaluator(source.trace,N,{parameters:parameters.values,boundaries,maxNodeVisits:256});
  const rows=Object.entries(source.inputs.output_roots).map(([name,root])=>{
    const interval=evaluation.value(root),endpoints=N.toClosed(interval);
    if(!arithmetic.closedNumericalExponentialEndpoint(endpoints.lower)||
       !arithmetic.closedNumericalExponentialEndpoint(endpoints.upper)||
       N.compareEndpoints(endpoints.lower,{rational:'0'})!==1)fail('NONPOSITIVE_OR_UNCLOSED_RESULT: '+root);
    return {name,root,interval:endpoints,strictlyPositiveLower:true,finiteUpper:true,
      coordinateObservation:coordinateObservation(N,interval),originalValueRelativeToleranceGuaranteed:false};
  });
  if(N.compareEndpoints(rows.find(r=>r.root===277).interval.lower,{rational:'1'})!==1)
    fail('ACTUAL_QB_OVER_QP_NOT_SEPARATED_ABOVE_ONE');
  const traversal=evaluation.report();
  if(traversal.visitedNodes!==57||!same(traversal.conditionalBoundaryIntervalsConsumed,[239,257,275])||
     !same(traversal.sourceParametersNumericallyConsumed,['BOuter','T','Tf','h','lambda']))
    fail('EXECUTED_TRACE_SCOPE_CHANGED');
  const report={
    schema:'MathScope.RecoveredOriginalLogRadiusBinding/1',pass:true,sourceAuthenticated:true,
    sourceAuthenticationScope:'Byte-pinned saved scalar subgraph and inherited original A13 premises; no current indexed/physical caller authority',
    originalBaselineCommit:source.inputs.original_baseline_commit,inputManifestSHA256:INPUT_MANIFEST_SHA256,
    sourceRecordSHA256:source.recordSHA256,executionTraceRecordCount:57,authenticatedConnectionRecordCount:60,
    newArithmeticRecordIds:source.inputs.new_arithmetic_record_ids,
    unevaluatedInterpretationRecordIds:source.inputs.additional_interpretation_record_ids,
    rootNames:source.inputs.output_roots,rows,domainChecks,
    inheritedA13:{inputManifestSHA256:inherited.inputManifestSHA256,sourceRecordSHA256:inherited.sourceRecordSHA256,
      sourceRecordCount:77,sourceAuthenticationScope:inherited.sourceAuthenticationScope,
      sourceFormAuditAuthenticated:inherited.inheritedSourceAudit.sourceAuthenticated,
      sourceFormParentGraphAuthenticationRequired:inherited.inheritedSourceAudit.parentGraphAuthenticationRequired,
      numericalIntegralBounds:inherited.inheritedIntegralBounds,normalized:inherited.normalized,
      expensiveHistoricalProducersRerun:false},
    originalParameterDefinitions:source.inputs.original_parameter_definitions,
    originalParameterIntervals:parameters.evaluationOrder.map(name=>({name,interval:N.toClosed(parameters.values.get(name))})),
    exactIdentities:{
      holdLength:'L=-4*log(h)=32008*T',
      Qb:'exp(-(1-h)/2)*(exp(-(1-lambda)/2)*((lambda-h)/(1-lambda)+I239)+(1-h)*L+I257)',
      terminalWait:'node280=(log(node259)-log(node275))/(1-h)=(8002*T+log(Qb)-log(K))/(1-h), K=Qp/h',
      logRadiusOverXR:'node319=13*exp(1000*T)+122009*T+135+node280',
      XbInterpretation:'node28826=XR*exp(node319); only this source identity is authenticated, neither node28825 nor node28826 is evaluated',
    },
    errorScope:{reusedFactor54:true,integralRefinementPerformed:false,
      KBounds:['1/256','27/128'],inheritedNormalizedLogWidth:'log(54)',
      additionalNumericalEndpointInflationRetained:true,
      arithmeticBitsAloneRefineIntegralBounds:false,
      coordinateWidthsAreObservedWithoutAnAcceptanceThreshold:true,
      originalIntegralRelativeToleranceGuaranteed:false,wholeXbRelativeToleranceGuaranteed:false},
    arithmetic:{precisionBits:256,parameterEvaluationOrder:parameters.evaluationOrder,
      parameterExpressionVisits:parameters.expressionVisits,traversal,report:N.report()},
    nextUnresolved:{
      fullRadius:'Evaluate the original XR definition and its exact dependency graph before node28826; preserve the log-radius uncertainty when exponentiating.',
      currentFrame:'Authenticate actual external Z/T and physical coordinates, ell>=ell0, active band/mesh choices and representative guards in their original lexical frames.',
      precision:'Refining the fixed original A13 bounds requires a separate controlled evaluation of their exact nested sigma integrals; no new threshold is introduced here.',
    },
    scope:{existingA13ProofAndConsumerReused:true,existingTracedEvaluatorReused:true,newSavedScalarConnection:true,
      originalHStrictlyPositive:true,hReplacedByZero:false,originalSourceParametersChanged:false,
      QbRatioWaitLogRadiusNumericallyEnclosed:true,closedNumericalExponentialEndpoints:true,
      nestedSigmaPrimitivesNumericallyRefined:false,originalIntegralValueRelativeToleranceGuaranteed:false,
      completeXbNumericallyEvaluated:false,wholeXbRelativeToleranceGuaranteed:false,
      currentIndexedCallerAuthenticated:false,currentPhysicalPointAuthenticated:false,
      ellAndMeshDecisionsEvaluated:false,wholeKNativeFieldCompleted:false,
      N7_06_closed:false,N8_05_closed:false,new_M3_closures:0,actual_global_last_resolved_tau:null},
  };
  // Authentication is checked on both sides of all awaits and computation.
  if(hash(readFileSync(resolve(HERE,'SOURCE_BOUND_INPUTS.json')))!==INPUT_MANIFEST_SHA256)fail('INPUT_MANIFEST_CHANGED_DURING_EXECUTION');
  for(const row of source.pins)pinnedRead(row);
  radial.assertBoundRecoveredOriginalA13(originalA13);
  deepFreeze(report);
  owners.set(report,{serialized:canonical(report),originalA13,assertA13:radial.assertBoundRecoveredOriginalA13});
  return report;
}

export function assertBoundRecoveredLogRadius(report){
  const owner=owners.get(report);
  if(!owner||owner.serialized!==canonical(report))fail('USE_THE_UNCHANGED_PRIVATE_LOGRADIUS_BINDING');
  owner.assertA13(owner.originalA13);return true;
}
export function projectBoundRecoveredLogRadius(report){
  assertBoundRecoveredLogRadius(report);
  return JSON.parse(owners.get(report).serialized);
}
