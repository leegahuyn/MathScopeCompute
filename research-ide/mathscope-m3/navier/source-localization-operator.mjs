/** A source-bound proof of (10.4)-(10.5), independent of enumerating the
 * final N6 field. The original operands remain named source operands.
 * Only the small captured Cartesian cutoff subgraph is reconstructed here.
 */
import {SOURCE_NEAR_TERMINAL_ARCHIVE,SOURCE_NEAR_TERMINAL_ARCHIVE_SHA256} from './source-near-terminal-evidence-data.mjs';
import {recordedSourceN7DomainExterior,sourceExteriorForceObservations} from './source-exterior-force-evidence.mjs';
import {ActualSourceExpressions} from '../../mathscope-m2/navier/actual-global-source-expressions.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {executeLocalizationJetAlgebra} from './localization-jet-algebra.mjs';

const NEAR_SHA='031746bd29798e382f88679d39ff6fcd86138eeaf42db0c0b7b53fa505020b05';
const DOMAIN_SHA='7dd8e216a7bdccd6cbb7b64a323d53e891560d999f87e13b92a1add2a0df5d5e';
const PARAMETER_SHA='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152';
const seals=new WeakMap(),copy=x=>structuredClone(x),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const hash=async x=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(x))))].map(n=>n.toString(16).padStart(2,'0')).join('');
const emptyInput=input=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)fail('INVALID_INPUT','The source localization operator, fields, conventions and domain are fixed. Caller values and proof flags are not accepted.');};

function flatSeamWitness(){
  let coefficients=[1n];const rows=[];
  for(let order=0;order<=4;order++){
    rows.push({order,coefficients:coefficients.map(String),limit:'0',
      bound:'For every monomial v^m, 0<=v^m*exp(-v)<=(m+1)!/v for v>0; v=1/u tends to +infinity.'});
    const next=Array(coefficients.length+2).fill(0n);
    coefficients.forEach((a,j)=>{next[j+2]+=a;if(j)next[j+1]-=BigInt(j)*a;});
    while(next.length>1&&next.at(-1)===0n)next.pop();coefficients=next;
  }
  return {rows,recurrence:'P_(n+1)=v^2*(P_n-P_n_prime)',
    denominator:'On 0<u<1, exp(-1/u)+exp(-1/(1-u))>0. At each endpoint the complementary exponential has a positive smooth limit.',
    conclusion:'The captured cutoff and its first four derivatives agree with their constant extensions at both seams. This supplies more derivatives than the force/divergence identities use.',
    finiteJetValuesUsedToInferSmoothness:false,analyticElementaryBoundUsed:true};
}

/** Replay exactly the open cutoff and generated coefficient derivatives.
 * Original positive tau0/z0 are opaque source constants, never finite
 * replacements. Algebraic operations involving them remain intact.
 */
export function replayCapturedLocalizationCutoff(program){
  const roots=program?.sourceLocalizationProgramRoots,ids=program?.sourceNodeIds,nodes=program?.nodes;
  if(!roots||!Array.isArray(nodes)||!Array.isArray(ids)||nodes.length!==ids.length||new Set(ids).size!==ids.length)
    fail('INVALID_SOURCE_CUTOFF','The complete captured cutoff program and source node map are required.');
  const G=new ActualSourceExpressions(),mapping=new Map(),constants=new Map(),
    coordinates=['x1','x2','z','tau'].map(k=>roots[k]),fixedConstants=new Set(['tau0','z0','qStar'].map(k=>roots[k]));
  const build=index=>{
    if(mapping.has(index))return mapping.get(index);
    const node=nodes[index];if(!node)fail('INVALID_SOURCE_CUTOFF','A captured cutoff node is missing.');
    const {op,args}=node;let out;
    if(op==='rational')out=G.q(...args);
    else if(fixedConstants.has(index)){
      out=G.var('original_closed_source_'+ids[index]);constants.set(index,out);
    }else if(op==='source_parameter')out=G.parameter(args[0]);
    else if(op==='coordinate')out=G.var(args[0]);
    else if(op==='add')out=G.add(...args.map(build));
    else if(op==='multiply')out=G.mul(...args.map(build));
    else if(op==='inverse')out=G.inv(build(args[0]));
    else if(op==='integer_power')out=G.pow(build(args[0]),args[1]);
    else if(op==='exp')out=G.exp(build(args[0]));
    else if(op==='smooth_piecewise')out=G.choose(...args.map(build));
    else fail('INVALID_SOURCE_CUTOFF','Unexpected operation in the small captured cutoff: '+op);
    mapping.set(index,out);if(G.nodes.length>6000)fail('RESOURCE_LIMIT','The open source cutoff replay exceeded 6000 nodes.');return out;
  };
  const c=build(roots.cutoff),xyz=coordinates.map(build),gradient=[0,1,2].map(i=>build(roots['gradient_'+i])),
    hessian=[0,1,2].map(i=>[0,1,2].map(j=>build(roots['hessian_'+i+'_'+j]))),dt=build(roots.dt),laplacian=build(roots.laplacian),
    guards=[roots.radialArgument,roots.axialArgument,roots.timeArgument].map(build),branches=[roots.chiRadial,roots.chiAxial,roots.chiTime].map(i=>nodes[i]);
  if(xyz.some((id,i)=>G.nodes[id].op!=='coordinate'||!G.nodes[id].args[0].startsWith(['n7_local_x1$','n7_local_x2$','n7_local_x3$','n7_local_tau$'][i])))
    fail('INVALID_SOURCE_CUTOFF','The recorded Cartesian/tau coordinate convention changed.');
  const rationalIs=(index,n,d=1)=>nodes[index]?.op==='rational'&&nodes[index].args[0]===String(n)&&nodes[index].args[1]===String(d);
  if(!branches.every(n=>n.op==='smooth_piecewise'&&rationalIs(n.args[1],1,2)&&rationalIs(n.args[2],1)&&rationalIs(n.args[3],1)&&rationalIs(n.args[5],0)))
    fail('INVALID_SOURCE_CUTOFF','The captured flat cutoff branches or support thresholds changed.');

  // Equality before branch splitting is already exact structural equality.
  // Otherwise every combination of the three recorded smooth branches is
  // checked by exact rational-function cancellation, with exp operands kept.
  const proof=(name,left,right)=>{
    const difference=G.sub(left,right);if(difference===G.zero)return {id:name,pass:true,method:'IDENTICAL_REPLAYED_EXPRESSION',branchChecks:[]};
    const rows=[];
    for(let code=0;code<27;code++){
      const state=[code%3,Math.floor(code/3)%3,Math.floor(code/9)%3],J=new ActualSourceExpressions(),memo=new Map();
      const at=id=>{
        if(memo.has(id))return memo.get(id);const {op,args}=G.nodes[id];let value;
        if(op==='rational')value=J.q(...args);else if(op==='coordinate')value=J.var(args[0]);else if(op==='source_parameter')value=J.parameter(args[0]);
        else if(op==='smooth_piecewise'){
          const axis=guards.indexOf(args[0]);if(axis<0)fail('INVALID_SOURCE_CUTOFF','A derivative introduced an unknown branch guard.');
          value=at(args[3+state[axis]]);
        }else if(op==='add')value=J.add(...args.map(at));else if(op==='multiply')value=J.mul(...args.map(at));
        else if(op==='inverse')value=J.inv(at(args[0]));else if(op==='integer_power')value=J.pow(at(args[0]),args[1]);
        else if(op==='exp')value=J.exp(at(args[0]));else fail('INVALID_SOURCE_CUTOFF','Unexpected branch-replay operation.');
        memo.set(id,value);return value;
      };
      const expression=at(difference),identity=sourceGraphRationalIdentity(J,expression,{maxTerms:8000});
      rows.push({state,pass:identity.pass,numeratorMonomials:identity.numeratorMonomials,denominatorMonomials:identity.denominatorMonomials});
    }
    if(rows.some(r=>!r.pass))fail('SOURCE_CUTOFF_DERIVATIVE_MISMATCH','The captured '+name+' differs from fresh exact differentiation.');
    return {id:name,pass:true,method:'ALL_27_RECORDED_BRANCH_COMBINATIONS_EXACT_RATIONAL',branchChecks:rows};
  };
  const checks=[
    proof('same-three-cutoff-product',c,G.mul(...[roots.chiRadial,roots.chiAxial,roots.chiTime].map(build))),
    proof('radial-squared-argument',guards[0],G.div(G.mul(G.q(2),G.add(G.pow(xyz[0],2),G.pow(xyz[1],2))),G.pow(build(roots.r0),2))),
    proof('axial-squared-argument',guards[1],G.div(G.mul(G.q(2),G.pow(xyz[2],2)),G.pow(build(roots.z0),2))),
    proof('positive-tau-argument',guards[2],G.div(xyz[3],build(roots.tau0))),
    ...gradient.map((value,i)=>proof('gradient-'+i,value,G.derivative(c,xyz[i]))),
    ...hessian.flatMap((row,i)=>row.map((value,j)=>proof('hessian-'+i+'-'+j,value,G.derivative(G.derivative(c,xyz[i]),xyz[j])))),
    proof('negative-tau-physical-time',dt,G.neg(G.derivative(c,xyz[3]))),
    proof('complete-cartesian-laplacian',laplacian,G.add(...hessian.map((row,i)=>row[i])))
  ];
  return {schema:'MathScope.N7.CapturedCutoffDifferentialReplay/1',sourceAuthenticated:false,checks,
    actualOpenCutoffReconstructed:true,originalClosedConstantsNumericallySubstituted:false,
    constantSourceNodes:[...constants.keys()].map(i=>ids[i]),sourceRoots:copy(roots),
    sourceCoordinates:coordinates.map(i=>({sourceNode:ids[i],name:nodes[i].args[0]})),
    reconstructedNodes:G.nodes.length,capturedNodesRead:mapping.size,flatSeams:flatSeamWitness(),
    denominatorPremises:['Original tau0>0 and z0>0 are retained from the verified source domain.','On each open transition 0<2*argument-1<1, both reciprocal arguments are positive.','The exponential sum in every transition denominator is strictly positive.'],
    allBranchSeamsHandledByExactFlatDefinition:true,freshFullCommonSourceConstructorExecuted:false};
}

function bindOperator(program,operator){
  const roots=program.sourceLocalizationProgramRoots,ids=program.sourceNodeIds,bySource=new Map(ids.map((id,i)=>[id,i])),
    c=ids[roots.cutoff],dc=[0,1,2].map(i=>ids[roots['gradient_'+i]]),permutations=[[1,2],[2,0],[0,1]],rows=[];
  const signed=(source,positive,sign)=>{
    if(sign===1)return source===positive;
    const index=bySource.get(source),node=program.nodes[index];
    return node?.op==='multiply'&&node.args.length===2&&node.args.some(i=>ids[i]===positive)&&
      node.args.some(i=>program.nodes[i]?.op==='rational'&&canonical(program.nodes[i].args)===canonical(['-1','1']));
  };
  if(operator?.schema!=='MathScope.N7.OriginalLocalizedFieldOperator/1'||operator.sharedFieldInstance!=='ORIGINAL_PROP9_9_FINAL_FIELDS_ON_SAME_COMMON_DOMAIN'
      ||canonical(operator.sourceFields)!==canonical(['A','B_e_theta','p_loc'])||operator.velocity?.length!==3||operator.pressure?.length!==1)
    fail('INVALID_SOURCE_OPERATOR','The recorded source field instance or operator structure changed.');
  for(let i=0;i<3;i++){
    const [j,k]=permutations[i],expected=[
      {field:'A',component:k,derivative:j,coefficient:{kind:'cutoff',sign:1},source:c},
      {field:'A',component:j,derivative:k,coefficient:{kind:'cutoff',sign:-1},source:c},
      {field:'A',component:k,derivative:null,coefficient:{kind:'gradient',coordinate:j,sign:1},source:dc[j]},
      {field:'A',component:j,derivative:null,coefficient:{kind:'gradient',coordinate:k,sign:-1},source:dc[k]},
      {field:'B_e_theta',component:i,derivative:null,coefficient:{kind:'cutoff',sign:1},source:c}
    ],actual=operator.velocity[i];
    if(actual.component!==i||actual.terms?.length!==5)fail('INVALID_SOURCE_OPERATOR','An actual curl product or direct-field term is missing.');
    expected.forEach((e,n)=>{const a=actual.terms[n];if(a.field!==e.field||a.component!==e.component||a.derivative!==e.derivative||!signed(a.coefficient,e.source,e.coefficient.sign))
      fail('INVALID_SOURCE_OPERATOR','The captured curl orientation, derivative or cutoff coefficient differs from (10.4).');});
    rows.push({component:i,terms:expected.map(({source,...e})=>e)});
  }
  const pressure=operator.pressure[0];if(pressure.field!=='p_loc'||pressure.derivative!==null||pressure.coefficient!==c)
    fail('INVALID_SOURCE_OPERATOR','The original pressure cutoff was changed or omitted.');
  return {rows,sourceCutoff:c,sourceGradient:dc,sourcePressure:pressure.coefficient,
    sourceVelocityCoefficients:operator.velocity.map(row=>row.terms.map(t=>t.coefficient)),sourceFields:copy(operator.sourceFields)};
}

export async function sourceLocalizationOperatorProof(input={}){
  emptyInput(input);
  if(SOURCE_NEAR_TERMINAL_ARCHIVE_SHA256!==NEAR_SHA||await hash(SOURCE_NEAR_TERMINAL_ARCHIVE)!==NEAR_SHA)
    fail('SOURCE_ARCHIVE_MISMATCH','The immutable captured localization operator archive changed.');
  const near=SOURCE_NEAR_TERMINAL_ARCHIVE,c=near.certificate,domain=await recordedSourceN7DomainExterior({}),
    exteriorObservation=sourceExteriorForceObservations(domain);
  if(domain.archiveSHA256!==DOMAIN_SHA||canonical(c.sourceBinding)!==canonical(domain.domain.sourceBinding)
      ||c.sourceBinding.parameterExpressionSHA256!==PARAMETER_SHA||near.gate.exitCode!==0||near.gate.nodeTests.passed!==10
      ||near.gate.nodeTests.failed!==0||near.gate.nodeTests.skipped!==0||near.independentVerification.status!=='PASS'
      ||near.independentVerification.checks.length!==38||!near.independentVerification.checks.every(r=>r.pass))
    fail('SOURCE_BINDING_MISMATCH','The source operator and verified original domain do not share the same executed source.');
  if(await hash(c.formulaProgram)!==c.graph.scalarProgramSHA256)
    fail('SOURCE_ARCHIVE_MISMATCH','The complete captured scalar program hash does not match its original execution.');
  const sourceRoots=c.formulaProgram.sourceLocalizationProgramRoots;
  if(c.formulaProgram.sourceNodeIds[sourceRoots.qStar]!==domain.domain.constants.qBig)
    fail('SOURCE_BINDING_MISMATCH','The recorded localization cutoff and domain qBig differ.');
  const binding=bindOperator(c.formulaProgram,c.localizationBinding.operator),cutoffReplay=replayCapturedLocalizationCutoff(c.formulaProgram),
    algebra=executeLocalizationJetAlgebra(binding.rows),
    sourceFiles=domain.sourceFiles.filter(r=>r.path.endsWith('/source-localization.mjs')||r.path.endsWith('/actual-global-source-expressions.mjs'));
  if(sourceFiles.length!==2||exteriorObservation.forceRows.length!==5||exteriorObservation.forceRows.some(row=>row.divergenceSign!=='NEGATIVE'))
    fail('SOURCE_BINDING_MISMATCH','The executed source cutoff or nonzero-divergence evidence is missing.');
  const result={schema:'MathScope.N7.SourceLocalizationOperatorProof/1',status:'ORIGINAL_LOCALIZATION_OPERATOR_AND_PRESSURE_IDENTITIES_EXECUTED',
    sourceBinding:copy(c.sourceBinding),sourceOperator:copy(c.localizationBinding.operator),coefficientBinding:binding,
    sourceEvidence:{nearTerminalArchiveSHA256:NEAR_SHA,sourceOperatorArtifact:copy(near.artifact),sourceOperatorReceipt:copy(near.receipt),
      sourceOperatorCapture:copy(near.sourceDependencyCapture),domainArchiveSHA256:DOMAIN_SHA,domainArtifact:copy(domain.domainArtifact),
      domainReceipt:copy(domain.receipt),domainCapture:copy(domain.sourceCapture),sourceFiles:copy(sourceFiles)},
    sourceDomain:{qBig:domain.domain.constants.qBig,support:copy(domain.domain.cutoffConclusions.support),
      compactK:copy(domain.domain.cutoffConclusions.compactK),initialZeroInterval:copy(domain.domain.cutoffConclusions.initialZeroInterval),
      sourceExistenceTheoremApplication:copy(domain.domain.domainProof),
      zeroExtension:'The exact operator is applied on the local source domain. Its support lies strictly inside, and the identically zero outside definition agrees on an open overlap.'},
    cutoffReplay,algebra,
    recordedNonzeroForceDivergence:{sourceArtifact:copy(domain.exteriorArtifact),sourceReceipt:copy(domain.receipt),
      sourceRows:copy(exteriorObservation.forceRows),originalHeatRestrictionOnly:true,
      meaning:'A separate observed original-source calculation has strictly nonzero div f. The universal operator proof retains this term; no Leray projection modifies the force.'},
    proofScope:{originalOperatorAuthenticated:true,exactDifferentialOperatorIdentitiesExecuted:true,allCutoffCommutatorsRetained:true,
      divLocalizedVelocityIdenticallyZero:true,forceDivergenceNeedNotVanish:true,forceWasLerayProjected:false,
      sourceFinalFieldsAreUniversalOperands:true,sourceFinalFieldSmoothnessTheoremExternal:true,
      fullFinalN6FieldNumericallyConstructed:false,wholeLocalizedForceValuesComputed:false,wholeGlobalTerminalJetsComputed:false,
      wholeKEnergyComputed:false,globalForceExtensionConstructed:false,wholeN7Complete:false,wholeM3Complete:false,newLeanExecuted:false},
    freshExactOperatorProofExecuted:true,freshFullSourceConstructorExecuted:false,recordedSourcePrerequisites:true};
  result.proofSHA256=await hash(result);seals.set(result,canonical(result));return result;
}

export function assertSourceLocalizationOperatorProof(result){
  if(!seals.has(result)||seals.get(result)!==canonical(result))fail('INVALID_SOURCE_PROOF','Use the unchanged privately sealed original localization operator proof.');return true;
}

export function sourceLocalizationOperatorObservations(result){
  assertSourceLocalizationOperatorProof(result);
  return {kind:'SOURCE_LOCALIZATION_OPERATOR_IDENTITIES',samples:[],curves:[],
    sourceBinding:copy(result.sourceBinding),sourceEvidence:copy(result.sourceEvidence),proofSHA256:result.proofSHA256,
    cutoffChecks:copy(result.cutoffReplay.checks),operatorChecks:copy(result.algebra.checks),
    commutators:result.algebra.commutators.map(({id,formula,monomialCount})=>({id,formula,monomialCount})),
    negativeControls:result.algebra.negativeControls.map(({id,nonzero})=>({id,nonzero})),
    sourceNonzeroDivergence:copy(result.recordedNonzeroForceDivergence),scope:copy(result.proofScope),
    freshExactOperatorProofExecuted:true,fullSourceFieldEnumerated:false};
}
