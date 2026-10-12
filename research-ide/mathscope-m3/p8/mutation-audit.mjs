/** Executed finite negative controls. Unsupported analytic replays remain OPEN. */
import {runJob} from '../../mathscope-m2/arithmetic/index.mjs';
import {verifyMWResult} from '../../mathscope-m2/arithmetic/mw-frobenius.mjs';
import {verifyP8Binding} from './contracts.mjs';
import {buildM2ComparisonDiagram,validateComparisonDiagram} from './comparison.mjs';
import {NO_AUTHORITY,assertJSON,canonicalJSON,cloneJSON,shape,sha256,hashString,fail,freeze,issue} from './common.mjs';

export const MUTATION_CASES=Object.freeze(['bad-prime','frobenius-coefficient','truncation-bound','zero-box','rank-upper','comparison-assumption']);
const originalRequest={kind:'arithmetic.elliptic',input:{p:'5',backend:'mw'},precision:{N:3}};
const DEFAULT_GRAPH={direction:'PREREQUISITE_TO_DEPENDENT',nodes:['bad-prime','local-factor','frobenius-coefficient','trace','truncation-bound','certified-value','zero-box','zero-sum','explicit-formula','rank-upper','rank-equality','bsd','comparison-assumption','comparison-theorem','unrelated'],edges:[['bad-prime','local-factor'],['local-factor','trace'],['frobenius-coefficient','trace'],['truncation-bound','certified-value'],['zero-box','zero-sum'],['zero-sum','explicit-formula'],['rank-upper','rank-equality'],['rank-equality','bsd'],['comparison-assumption','comparison-theorem']].map(([from,to])=>({from,to}))};
const flip=hash=>(hash[0]==='0'?'1':'0')+hash.slice(1);

export function invalidateMutationDependents(graph,failedIds) {
  assertJSON(graph);shape(graph,['direction','nodes','edges'],[],'mutation dependency graph');
  if (graph.direction!=='PREREQUISITE_TO_DEPENDENT' || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges) || graph.nodes.length>1024 || graph.edges.length>4096 || new Set(graph.nodes).size!==graph.nodes.length || graph.nodes.some(n=>typeof n!=='string' || !n)) fail('INVALID_DEPENDENCY_GRAPH','Use a bounded graph with unique prerequisite-to-dependent node IDs.');
  const ids=new Set(graph.nodes), adjacency=new Map(graph.nodes.map(n=>[n,[]]));
  for(const edge of graph.edges){shape(edge,['from','to'],[],'dependency edge');if(!ids.has(edge.from)||!ids.has(edge.to))fail('INVALID_DEPENDENCY_GRAPH','Missing dependency endpoint.');adjacency.get(edge.from).push(edge.to);}
  const color=new Map();function visit(id){if(color.get(id)===1)fail('DEPENDENCY_CYCLE','Mutation invalidation requires an acyclic graph.');if(color.get(id)===2)return;color.set(id,1);for(const next of adjacency.get(id))visit(next);color.set(id,2);}graph.nodes.forEach(visit);
  if(!Array.isArray(failedIds)||failedIds.some(id=>!ids.has(id)))fail('UNKNOWN_FAILED_NODE','Every failed input must name a graph node.');
  const revoked=new Set(failedIds),queue=[...failedIds];for(let i=0;i<queue.length;i++)for(const next of adjacency.get(queue[i]))if(!revoked.has(next)){revoked.add(next);queue.push(next);}
  return freeze({revokedNodeIds:[...revoked].sort(),unchangedNodeIds:graph.nodes.filter(n=>!revoked.has(n)).sort(),states:graph.nodes.map(id=>({id,badgeState:revoked.has(id)?'REVOKED':'UNCHANGED_UNVERIFIED_METADATA',proofAuthorityIssued:false})),direction:graph.direction,...NO_AUTHORITY});
}

function p7Envelope(record) {
  if (!record || record.schema!=='MathScope.M3.P7Execution/1' || record.execution?.status!=='COMPLETED' || ['formalLeanProofIssued','wholeP7Complete','wholeM3Complete'].some(k=>record[k]!==false)) fail('P7_SCOPE_CONTRACT','Expected a completed finite P7 envelope without any formal or whole-milestone promotion.');
  hashString(record.recordSHA256,'P7 archived record hash');
}
function rational(value) {
  if(typeof value!=='string'||value.length>2048||! /^-?(?:0|[1-9][0-9]*)(?:\/[1-9][0-9]*)?$/.test(value))fail('INVALID_BRACKET','Zero bracket endpoints must be bounded exact rational strings.');
  const [n,d='1']=value.split('/');return [BigInt(n),BigInt(d)];
}
const compare=(a,b)=>a[0]*b[1]-b[0]*a[1];

/** This reads count/bracket structure only, never repeats FLINT analytic calculations. */
export function inspectP7ZeroStructure(record) {
  try {
    p7Envelope(record);
    if(!['p7.explicit_formula','p7.zeta_zeros'].includes(record.request?.kind))fail('P7_ZERO_KIND','Use a P7 zero certificate or explicit-formula record.');
    const zero=record.result?.zeroCertificate??record.result;
    if(zero?.schema!=='MathScope.P7.FiniteZeroCertificate/1'||!Number.isSafeInteger(zero.positiveZeroCount)||zero.positiveZeroCount<1||zero.positiveZeroCount>64||!Array.isArray(zero.hardyRoots)||zero.hardyRoots.length!==zero.positiveZeroCount)fail('ZERO_COUNT_MISMATCH','The positive zero count and exact Hardy bracket list disagree.');
    const count=zero.positiveZeroCount,saturation=zero.countSaturation;
    if(zero.contour?.zeroCountIncludingMultiplicity!==2*count||saturation?.positiveSignBrackets!==count||saturation?.conjugateNegativeBrackets!==count||saturation?.zerosInRectangleWithMultiplicity!==2*count||saturation?.remainingZerosInRectangle!==0)fail('ZERO_MULTIPLICITY_MISMATCH','Symmetric contour counts and positive/conjugate bracket coverage disagree.');
    const brackets=[];let previous=null;
    for(let i=0;i<count;i++){
      const root=zero.hardyRoots[i],lower=rational(root.lower),upper=rational(root.upper);
      if(root.positiveZeroIndex!==i+1||compare(lower,[0n,1n])<=0n||compare(lower,upper)>=0n||previous&&compare(previous,lower)>=0n||![-1,1].includes(root.lowerSign)||root.upperSign!==-root.lowerSign||root.oppositeSigns!==true||root.uniqueAndSimpleByTotalCount!==true)fail('ZERO_BOX_REJECTED','Root indices, disjoint exact brackets, opposite signs or multiplicity flags are inconsistent.');
      previous=upper;brackets.push({index:i+1,lower:root.lower,upper:root.upper,lowerSign:root.lowerSign,upperSign:root.upperSign});
    }
    return freeze({ok:true,status:'STRUCTURALLY_CONSISTENT_UNTRUSTED',archivedRecordSHA256:record.recordSHA256,brackets,positiveCount:count,analyticReplay:'OPEN_REQUIRES_FRESH_P7_FLINT_RUNNER',hashIntegrityVerified:false,wholeContourRecomputed:false,...NO_AUTHORITY});
  } catch(error){return freeze({ok:false,status:'ZERO_STRUCTURE_REJECTED',issues:[issue(error)],analyticReplay:'OPEN_REQUIRES_FRESH_P7_FLINT_RUNNER',hashIntegrityVerified:false,wholeContourRecomputed:false,...NO_AUTHORITY});}
}

export function inspectRankUpperEvidence(record) {
  try{
    p7Envelope(record);if(!['p7.elliptic_local','p7.elliptic_arithmetic'].includes(record.request?.kind))fail('P7_RANK_KIND','Use the arithmetic-rank record, not a central analytic derivative.');
    const rank=record.result?.arithmeticRank;if(!rank||typeof rank!=='object'||!Number.isSafeInteger(rank.lowerBound)||rank.lowerBound<0)fail('INVALID_RANK_RECORD','An explicit arithmetic-rank interval is required.');
    if(rank.upperBound===null&&rank.exactRank===null&&rank.selmerBoundComputed===false&&rank.descentPerformed===false)return freeze({ok:true,status:'OPEN_NO_ARITHMETIC_RANK_UPPER_CERTIFICATE',archivedRecordSHA256:record.recordSHA256,lowerBound:rank.lowerBound,upperBound:null,exactRank:null,arithmeticRankProved:false,...NO_AUTHORITY});
    if(record.request.kind==='p7.elliptic_arithmetic'){
      const certificate=rank.rankUpperCertificate;
      if(!certificate)fail('RANK_UPPER_CERTIFICATE_MISSING','The retained arithmetic-rank conclusion has lost its required descent certificate.');
      if(certificate.schema!=='MathScope.M3.P7.ArithmeticRankUpperCertificate/1'||certificate.status!=='CERTIFIED_ARITHMETIC_UPPER'||rank.descentPerformed!==true||rank.selmerBoundComputed!==true||!Number.isSafeInteger(rank.upperBound)||rank.upperBound<rank.lowerBound||certificate.upperBound!==rank.upperBound||rank.exactRank!==(rank.lowerBound===rank.upperBound?rank.lowerBound:null))fail('RANK_UPPER_INCONSISTENT','The exact arithmetic-rank interval and descent certificate disagree.');
      for(const name of ['twoSelmerRank','rationalTwoTorsionRank','casselsPairingRank'])if(!Number.isSafeInteger(certificate[name])||certificate[name]<0||certificate[name]>64)fail('RANK_UPPER_INCONSISTENT','Bounded exact Selmer and Cassels ranks are required.');
      if(certificate.rationalTwoTorsionRank>2||certificate.casselsPairingRank%2!==0||certificate.upperBound!==certificate.twoSelmerRank-certificate.rationalTwoTorsionRank-certificate.casselsPairingRank||certificate.freshProcessExecuted!==true||certificate.databaseLookupUsed!==false||certificate.analyticRankUsed!==false||certificate.BSDOrParityConjectureAssumed!==false||certificate.formalLeanProofIssued!==false)fail('RANK_UPPER_INCONSISTENT','The unconditional arithmetic certificate contract is inconsistent.');
      if(certificate.modelHash!==record.result.model?.minimalHash||certificate.originalModelHash!==record.result.model?.hash||!Array.isArray(certificate.exactTwoCovers)||certificate.exactTwoCovers.length!==certificate.twoSelmerRank||!Array.isArray(certificate.coverMapChecks)||certificate.coverMapChecks.length!==certificate.twoSelmerRank||certificate.coverMapChecks.some(c=>c.exactRationalMapIdentityChecked!==true))fail('RANK_UPPER_INCONSISTENT','The same-model complete 2-cover receipt is missing.');
      for(const key of ['certificateSHA256','pariReceiptSHA256','executionScriptSHA256','executionStdoutSHA256'])hashString(certificate[key],key);
      if(certificate.backend?.version!=='2.19.0'||certificate.backend.sourceArchiveSHA256!=='f317b9722eb5d9094a60303774f066f3a83e3ec1f170be8546c44d7583f30b6d')fail('RANK_UPPER_BACKEND','The arithmetic certificate has a different PARI source pin.');
      hashString(certificate.backend.binarySHA256,'observed PARI executable');
      return freeze({ok:true,status:'STRUCTURALLY_CONSISTENT_UNTRUSTED',archivedRecordSHA256:record.recordSHA256,lowerBound:rank.lowerBound,upperBound:rank.upperBound,exactRank:rank.exactRank,rankUpperCertificateSHA256:certificate.certificateSHA256,arithmeticReplay:'OPEN_REQUIRES_FRESH_P7_PARI_RUNNER',hashIntegrityVerified:false,descentRecomputed:false,arithmeticRankProved:false,...NO_AUTHORITY});
    }
    if(rank.upperBound!==null&&!record.result.rankUpperCertificate)fail('RANK_UPPER_CERTIFICATE_MISSING','An asserted arithmetic rank upper bound has no verifiable rank-upper certificate.');
    return freeze({ok:false,status:'OPEN_UNSUPPORTED_RANK_UPPER_VERIFIER',issues:[{code:'FRESH_RANK_UPPER_VERIFIER_REQUIRED',message:'An imported rank certificate cannot replace a implemented fresh descent/Selmer verifier.'}],arithmeticRankProved:false,...NO_AUTHORITY});
  }catch(error){return freeze({ok:false,status:'RANK_STRUCTURE_REJECTED',issues:[issue(error)],arithmeticRankProved:false,...NO_AUTHORITY});}
}

export async function runBindingMutationAudit(record,current) {
  const baseline=await verifyP8Binding(record,current);if(!baseline.ok)return freeze({status:'BASELINE_REJECTED',baseline,cases:[],...NO_AUTHORITY});
  const initial=cloneJSON(current), cases=[];
  const changes=[['source',x=>{x.sourceFiles[0].content+='\n';}],['environment',x=>{x.environment.runtimeLibrarySha256=flip(x.environment.runtimeLibrarySha256);}],['input',x=>{x.input={original:x.input,negativeControlChanged:true};}],['precision',x=>{x.precision.binaryBits=(x.precision.binaryBits??128)+1;x.claim.arithmetic.precision=cloneJSON(x.precision);}],['base',x=>{x.claim.object.baseRef.hash=flip(x.claim.object.baseRef.hash);}],['ring',x=>{x.claim.object.coefficientRingRef.hash=flip(x.claim.object.coefficientRingRef.hash);}]];
  for(const [name,change]of changes){const altered=cloneJSON(initial);change(altered);const check=await verifyP8Binding(record,altered);cases.push({name,negativeControlPassed:check.status==='STALE'&&check.mismatchedBindings.includes(name),status:check.status,mismatchedBindings:check.mismatchedBindings??[]});}
  return freeze({status:cases.every(c=>c.negativeControlPassed)?'BINDING_MUTATIONS_REJECTED':'FAILED',baseline,cases,trust:'INTEGRITY_CHECK_ONLY_NOT_PROOF',...NO_AUTHORITY});
}

function openCase(id,reason){return {id,negativeControlStatus:'NOT_EXECUTED',negativeControlPassed:null,mathematicalReplayStatus:'OPEN',reason,invalidated:null};}

export async function runMutationAudit(input={}) {
  assertJSON(input,1024*1024);shape(input,[],['cases','p7ZeroRecord','p7RankRecord'],'mutation audit input');
  const selected=input.cases??MUTATION_CASES;
  if(!Array.isArray(selected)||!selected.length||selected.length>MUTATION_CASES.length||new Set(selected).size!==selected.length||selected.some(id=>!MUTATION_CASES.includes(id)))fail('INVALID_MUTATION_CASES','Select distinct supported mutation case IDs.');
  const cases=[];let mw=null;
  for(const id of selected){
    if(id==='bad-prime'){
      const request={kind:'arithmetic.elliptic',input:{p:'2'},precision:{N:3}}, result=await runJob(request);
      const globalRequest={kind:'arithmetic.elliptic',input:{operation:'globalIdentity',p:'5',excludedPrimes:[2],primes:[3,5,7]}}, global=await runJob(globalRequest),omitted=cloneJSON(globalRequest);omitted.input.excludedPrimes=[];
      let omission=null;try{await runJob(omitted);}catch(error){omission=issue(error);}
      const rejected=result.status==='UNSUPPORTED'&&result.results.reduction?.status==='BAD_REDUCTION'&&omission?.code==='UNVERIFIED_GOOD_MODEL';
      cases.push({id,negativeControlStatus:rejected?'REJECTED_AT_MODEL_ADMISSION':'FAILED',negativeControlPassed:rejected,mathematicalReplayStatus:'EXECUTED_M2',request,source:{inputHash:result.provenance.inputHash,sourceHash:result.provenance.sourceHash,resultHash:result.resultHash},observed:{status:result.status,reduction:result.results.reduction.status},omittedBadPrime:{originalRequest:globalRequest,mutatedRequest:omitted,originalResultHash:global.resultHash,rejection:omission},invalidated:invalidateMutationDependents(DEFAULT_GRAPH,[id])});
    }else if(id==='frobenius-coefficient'||id==='truncation-bound'){
      mw??=await runJob(originalRequest);if(mw.status!=='COMPLETED')fail('M2_BASELINE_INCOMPLETE','A completed MW baseline is required before mutation.');const altered=cloneJSON(mw), field=id==='frobenius-coefficient'?'results.frobenius.matrix[0][0]':'results.precisionCertificate.omittedTermValuationLowerBound';
      if(id==='frobenius-coefficient')altered.results.frobenius.matrix[0][0]=String(BigInt(altered.results.frobenius.matrix[0][0])+1n);
      else delete altered.results.precisionCertificate.omittedTermValuationLowerBound;
      // Deliberately recompute a content hash: self-consistent rehashing is not replay.
      const {resultHash,...body}=altered;altered.resultHash=await sha256(body);
      const rerun=await runJob(originalRequest),verifier=verifyMWResult({...originalRequest.input,...originalRequest.precision},altered.results);
      let precisionGate=null;if(id==='truncation-bound'){const short=cloneJSON(originalRequest);short.input.terms=1;const insufficient=await runJob(short);precisionGate={request:short,status:insufficient.status,certificate:insufficient.results.precisionCertificate};}
      const changed=canonicalJSON(rerun)!==canonicalJSON(altered)&&verifier.pass===false&&(!precisionGate||precisionGate.status==='PRECISION_REQUIRED');
      cases.push({id,negativeControlStatus:changed?'REJECTED_BY_FRESH_EXACT_REPLAY':'FAILED',negativeControlPassed:changed,mathematicalReplayStatus:'EXECUTED_M2',field,request:cloneJSON(originalRequest),verifier,precisionGate,source:{inputHash:mw.provenance.inputHash,sourceHash:mw.provenance.sourceHash,resultHash:mw.resultHash,freshResultHash:rerun.resultHash,mutatedResultHash:altered.resultHash},unchangedBaseline:canonicalJSON(mw)===canonicalJSON(rerun),invalidated:invalidateMutationDependents(DEFAULT_GRAPH,[id])});
    }else if(id==='comparison-assumption'){
      const route={kind:'arithmetic.comparison',input:{operation:'perfectPrism',p:'3',target:'deRham'},precision:{N:3}},original=await buildM2ComparisonDiagram(route), altered=cloneJSON(original);altered.assumptions.shift();
      const check=await validateComparisonDiagram(altered,{expectedBinding:original.binding}),rejected=!check.ok&&check.invalidEdgeIds.length===original.edges.length;
      cases.push({id,negativeControlStatus:rejected?'REJECTED_AT_COMPARISON_EDGE':'FAILED',negativeControlPassed:rejected,mathematicalReplayStatus:'EXECUTED_M2',issues:check.issues,invalidEdgeIds:check.invalidEdgeIds,source:original.source,invalidated:invalidateMutationDependents(DEFAULT_GRAPH,[id])});
    }else if(id==='zero-box'){
      if(!input.p7ZeroRecord){cases.push(openCase(id,'A P7 record and a fresh Python/FLINT whole-contour replay are required. The M2 worker cannot certify zeta zeros.'));continue;}
      const baseline=inspectP7ZeroStructure(input.p7ZeroRecord);if(!baseline.ok){cases.push({id,negativeControlStatus:'BASELINE_REJECTED',negativeControlPassed:null,mathematicalReplayStatus:'OPEN',baseline,invalidated:invalidateMutationDependents(DEFAULT_GRAPH,[id])});continue;}
      const altered=cloneJSON(input.p7ZeroRecord),zero=altered.result.zeroCertificate??altered.result;zero.hardyRoots[0].upper=zero.hardyRoots[0].lower;
      const check=inspectP7ZeroStructure(altered);
      cases.push({id,negativeControlStatus:!check.ok?'REJECTED_STRUCTURAL_TAMPER_ONLY':'FAILED',negativeControlPassed:!check.ok,mathematicalReplayStatus:'OPEN_REQUIRES_FRESH_P7_FLINT_RUNNER',baseline,mutation:check,invalidated:invalidateMutationDependents(DEFAULT_GRAPH,[id])});
    }else{
      if(!input.p7RankRecord){cases.push(openCase(id,'Load a source-bound P7 arithmetic record with a valid descent upper certificate; actual mathematical replay requires the fresh Python/PARI runner.'));continue;}
      const baseline=inspectRankUpperEvidence(input.p7RankRecord);if(!baseline.ok){cases.push({id,negativeControlStatus:'BASELINE_REJECTED',negativeControlPassed:null,mathematicalReplayStatus:'OPEN',baseline,invalidated:invalidateMutationDependents(DEFAULT_GRAPH,[id])});continue;}
      if(baseline.upperBound!==null){
        const altered=cloneJSON(input.p7RankRecord);delete altered.result.arithmeticRank.rankUpperCertificate;
        const check=inspectRankUpperEvidence(altered);
        cases.push({id,negativeControlStatus:!check.ok?'REJECTED_MISSING_VALID_UPPER_CERTIFICATE':'FAILED',negativeControlPassed:!check.ok,mathematicalReplayStatus:'OPEN_REQUIRES_FRESH_P7_PARI_RUNNER',baseline,mutation:check,field:'result.arithmeticRank.rankUpperCertificate',operation:'DELETE_VALID_CERTIFICATE',invalidated:invalidateMutationDependents(DEFAULT_GRAPH,[id])});continue;
      }
      const altered=cloneJSON(input.p7RankRecord);altered.result.arithmeticRank.upperBound=baseline.lowerBound;altered.result.arithmeticRank.exactRank=baseline.lowerBound;
      const check=inspectRankUpperEvidence(altered);
      cases.push({id,negativeControlStatus:!check.ok?'REJECTED_MISSING_UPPER_CERTIFICATE':'FAILED',negativeControlPassed:!check.ok,mathematicalReplayStatus:'OPEN_NO_ARITHMETIC_RANK_UPPER_CERTIFICATE',baseline,mutation:check,invalidated:invalidateMutationDependents(DEFAULT_GRAPH,[id])});
    }
  }
  const failed=cases.some(c=>c.negativeControlStatus==='FAILED');
  return freeze({schema:'MathScope.M3.P8.MutationAudit/1',status:failed?'FAILED':'PARTIAL',cases,executedFiniteControls:cases.filter(c=>c.mathematicalReplayStatus==='EXECUTED_M2').length,openCases:cases.filter(c=>c.mathematicalReplayStatus.startsWith('OPEN')).map(c=>c.id),originalP8CriterionComplete:false,serializedAuthority:'UNTRUSTED_REQUIRES_REEXECUTION',...NO_AUTHORITY});
}
