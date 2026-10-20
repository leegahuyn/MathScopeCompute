/** New binding of EXISTING original A.13 bounds to recovered source nodes.
 * The existing integral consumer and its positive source h are reused.
 * This authenticates one saved A.13 subgraph, not an indexed caller frame,
 * a private physical point, a complete field, or an original M3 obligation.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve,relative,isAbsolute} from 'node:path';

const HERE=dirname(fileURLToPath(import.meta.url));
const REPO=resolve(HERE,'../../..');
export const INPUT_MANIFEST_SHA256='02554e5544ed39fd79b369462de85c1f863721c8adaac78d0eecebb60f3da6a9';
const CAP_PAYLOAD_SHA256='620925294060e0c821492c5bbf2dcc20cfcab2c83e9a937fa3798498813dec06';
const owners=new WeakMap();
const hash=b=>createHash('sha256').update(b).digest('hex');
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?
  '['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const same=(a,b)=>canonical(a)===canonical(b);
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_BINDING'});};

export function decodeBoundInputManifest(bytes){
  if(!(bytes instanceof Uint8Array)||hash(bytes)!==INPUT_MANIFEST_SHA256)
    fail('THE_COMPLETE_REVIEWED_INPUT_MANIFEST_CHANGED');
  return JSON.parse(Buffer.from(bytes).toString('utf8'));
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

function operands(record){
  if(['rational','coordinate','source_parameter'].includes(record.op))return [];
  if(['source_step_derivative','integer_power'].includes(record.op))return record.args.slice(0,1);
  if(['add','multiply','inverse','exp','log_positive','definite_integral'].includes(record.op))return record.args;
  fail('UNREVIEWED_RADIAL_OPERAND_GRAMMAR: '+record.op);
}

function authenticateSavedSubgraph(){
  const inputs=decodeBoundInputManifest(readFileSync(resolve(HERE,'SOURCE_BOUND_INPUTS.json')));
  for(const row of inputs.original_code_files)pinnedRead(row);
  const capsule=JSON.parse(pinnedRead(inputs.caller_capsule));
  if(capsule.payload_sha256!==CAP_PAYLOAD_SHA256)fail('WRONG_CALLER_CAPSULE_IDENTITY');
  const sourceMaps={};
  for(const [name,row] of Object.entries(inputs.current_recovered_source_files)){
    const bytes=pinnedRead(row);
    if(['closure','direct','transitive'].includes(name)){
      const data=JSON.parse(bytes);sourceMaps[name]=data[name==='transitive'?'newRecords':'records'];
    }
  }
  const selected=new Set(),pending=[0,1,...Object.values(inputs.root_names),276];
  while(pending.length){
    const id=pending.pop();if(selected.has(id))continue;
    const node=capsule.source_nodes[id];
    if(!Number.isSafeInteger(id)||id<0||!node)fail('MISSING_ACTUAL_RADIAL_RECORD: '+id);
    const origins=capsule.source_record_origins[id];
    if(!Array.isArray(origins)||origins.length===0)fail('MISSING_RECORD_ORIGIN: '+id);
    for(const origin of origins)if(!same(sourceMaps[origin]?.[id],node))fail('CURRENT_RECOVERED_RECORD_MISMATCH: '+id);
    selected.add(id);pending.push(...operands(node));
  }
  if(!same(capsule.source_nodes[276],{op:'inverse',args:[275]}))fail('ACTUAL_RECIPROCAL_NODE_CHANGED');
  const nodes=[...selected].sort((a,b)=>a-b).map(id=>({id,node:structuredClone(capsule.source_nodes[id])}));
  return {inputs,nodes,sourceRecordSHA256:hash(Buffer.from(canonical(nodes)))};
}

/** No replacement h, coefficient, cutoff, graph, or physical point is accepted. */
export async function bindRecoveredOriginalA13(...args){
  if(args.length)fail('THIS_BINDING_ACCEPTS_NO_CALLER_SOURCE_OR_PARAMETER');
  const source=authenticateSavedSubgraph(),base='research-ide/mathscope-m2/navier/';
  const [A13,arithmetic,closed,profile]=await Promise.all([
    import(pathToFileURL(sourcePath(base+'actual-original-a13-numerical-enclosure.mjs'))),
    import(pathToFileURL(sourcePath(base+'actual-numerical-exponential-arithmetic.mjs'))),
    import(pathToFileURL(sourcePath(base+'actual-closed-parameter-arithmetic.mjs'))),
    import(pathToFileURL(sourcePath(base+'source-profile.mjs'))),
  ]);
  const definitions=profile.getPinnedSourceProfile().parametersExactExpressions;
  const audit=A13.originalA13IntegralSourceAudit({nodes:source.nodes,rootNames:source.inputs.root_names,profileDefinitions:definitions});
  // These are the existing directed exponential endpoints, not floating point
  // samples or an h=0 limit. The original three-parameter traversal is small.
  const N=arithmetic.numericalExponentialArithmetic({precisionBits:256,maxOperations:100000,maxMemoEntries:4096});
  const parameters=closed.evaluateClosedArithmeticDefinitions(definitions,N,{names:['h']});
  const enclosed=A13.encloseRepresentedOriginalA13Integrals(audit,N,parameters.values);
  const h=parameters.values.get('h'),rho=N.div(h,N.point(256)),terminal=enclosed.values.get(275);
  const terminalClosed=N.toClosed(terminal),rhoClosed=N.toClosed(rho),upperClosed=N.toClosed(N.mul(N.point(54),rho));
  if(!same(terminalClosed.lower,rhoClosed.lower)||!same(terminalClosed.upper,upperClosed.upper))
    fail('REUSED_CONSUMER_SCALE_OR_FACTOR_CHANGED');
  const inverse=N.toClosed(N.div(N.one(),terminal));
  for(const interval of [N.toClosed(h),terminalClosed,inverse]){
    if(!arithmetic.closedNumericalExponentialEndpoint(interval.lower)||!arithmetic.closedNumericalExponentialEndpoint(interval.upper)||
       N.compareEndpoints(interval.lower,{rational:'0'})!==1)fail('NONPOSITIVE_OR_UNCLOSED_ORIGINAL_NUMERICAL_ENDPOINT');
  }
  // Normalize the source identity BEFORE interval arithmetic. Dividing two
  // independent copies of an h interval would discard the shared factor.
  const normalized={
    exactRelation:'node275 = h*K; node276 = h^(-1)*K^(-1)',
    K:{quantity:'node275/h',closedRationalBounds:['1/256','27/128']},
    inverseK:{quantity:'h*node276 = h/node275',closedRationalBounds:['128/27','256']},
    sourceCoefficient:'co=1/256',reusedOriginalConsumerFactor:'54',
    argumentDerivative:'node267 = sigma_2_prime((s-1)/2); derivative with respect to the step argument',
    changeOfVariables:'u=(s-1)/2; ds=2 du cancels the explicit denominator factor 2 in node272',
    positiveMeasure:'sigma_2_prime(u)>=0 and integral_0^1 sigma_2_prime(u)du=1',
    hRemainsStrictlyPositive:true,normalizationUsesExactSharedH:true,
    originalValueRelativeToleranceGuaranteed:false,
  };
  const report={
    schema:'MathScope.RecoveredOriginalA13Binding/1',pass:true,
    sourceAuthenticated:true,
    sourceAuthenticationScope:'Byte-pinned occurrence of the original A13 subgraph and reciprocal276 in the saved recovered source; no current indexed/physical caller authority is issued',
    originalBaselineCommit:source.inputs.original_baseline_commit,
    inputManifestSHA256:INPUT_MANIFEST_SHA256,callerCapsulePayloadSHA256:CAP_PAYLOAD_SHA256,
    sourceRecordCount:source.nodes.length,sourceRecordSHA256:source.sourceRecordSHA256,
    sourceNodeIds:source.nodes.map(row=>row.id),rootNames:structuredClone(source.inputs.root_names),
    inheritedSourceAudit:{pass:audit.pass,sourceAuthenticated:audit.sourceAuthenticated,parentGraphAuthenticationRequired:audit.parentGraphAuthenticationRequired,
      checks:structuredClone(audit.checks),integrals:structuredClone(audit.integrals),inequalities:structuredClone(audit.inequalities)},
    inheritedIntegralBounds:structuredClone(enclosed.rows),originalHClosedInterval:N.toClosed(h),
    node275ClosedInterval:terminalClosed,node276ClosedInterval:inverse,normalized,
    independentOriginalParameters:{h:structuredClone(definitions.h),lambda:structuredClone(definitions.lambda),co:structuredClone(definitions.co),
      T:structuredClone(definitions.T),Md:structuredClone(definitions.Md)},
    sourceStepFamily:'Original sigma_2 square-seed step, distinct from the sigma_1 outer cutoff',
    arithmetic:{precisionBits:256,parameterEvaluationOrder:parameters.evaluationOrder,report:N.report()},
    scope:{existingA13ProofAndConsumerReused:true,newRecoveredSubgraphBinding:true,newScaledReciprocalConnection:true,
      node275StrictlyPositive:true,node276FinitePositive:true,closedNumericalExponentialEndpoints:true,
      originalSourceParametersChanged:false,hReplacedByZero:false,nestedSigmaPrimitivesNumericallyRefined:false,
      originalIntegralValueRelativeToleranceGuaranteed:false,currentIndexedCallerAuthenticated:false,
      currentPhysicalPointAuthenticated:false,completeXbNumericallyEvaluated:false,wholeKNativeFieldCompleted:false,
      N7_06_closed:false,N8_05_closed:false,new_M3_closures:0,actual_global_last_resolved_tau:null},
  };
  // Check all imported original module bytes again after awaits/execution.
  for(const row of source.inputs.original_code_files)pinnedRead(row);
  owners.set(report,{serialized:canonical(report),audit,assertAudit:A13.assertOriginalA13IntegralSourceAudit});
  return report;
}

export function assertBoundRecoveredOriginalA13(report){
  const owner=owners.get(report);
  if(!owner||owner.serialized!==canonical(report))fail('USE_THE_UNCHANGED_PRIVATE_RECOVERED_A13_BINDING');
  owner.assertAudit(owner.audit);return true;
}

export function projectBoundRecoveredOriginalA13(report){
  assertBoundRecoveredOriginalA13(report);
  // Read the private snapshot after validation, never the mutable report a
  // second time: accessors may otherwise change fields between the two reads.
  return JSON.parse(owners.get(report).serialized);
}
