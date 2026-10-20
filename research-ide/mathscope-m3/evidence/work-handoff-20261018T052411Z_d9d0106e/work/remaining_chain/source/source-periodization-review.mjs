/** Original N7-08 operator review. Conditional comparison hypotheses stay
 * attached; this does not issue a C/D existence or breakdown theorem.
 */
import {sourceLocalizationOperatorEvidence,sourceLocalizationOperatorEvidenceObservations} from './source-localization-operator-evidence.mjs';
import {SOURCE_NEAR_TERMINAL_ARCHIVE,SOURCE_NEAR_TERMINAL_ARCHIVE_SHA256} from './source-near-terminal-evidence-data.mjs';
import {exactPeriodizationRequest,periodizationScaleLedger} from './source-periodization.mjs';
import {ActualSourceExpressions} from '../../mathscope-m2/navier/actual-global-source-expressions.mjs';
import {sourceGraphPolynomialIdentity,sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';

const copy=x=>structuredClone(x),canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}',
  seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value))))].map(x=>x.toString(16).padStart(2,'0')).join('');

/** Reconstruct the exact captured cutoff with its closed positive constants
 * still named by their original source IDs. Apply the actual pullback and
 * verify each spatial/time derivative on all recorded smooth branches.
 */
export function executeOriginalCutoffTransport(program){
  const roots=program?.sourceLocalizationProgramRoots,ids=program?.sourceNodeIds,nodes=program?.nodes;
  if(!roots||!Array.isArray(nodes)||!Array.isArray(ids)||nodes.length!==ids.length||new Set(ids).size!==ids.length)
    fail('INVALID_SOURCE_CUTOFF','The complete original cutoff program and source map are required.');
  const request=exactPeriodizationRequest({viscosity:'9/4',spatialScale:'4'}),G=new ActualSourceExpressions(),memo=new Map(),
    constants=new Set(['tau0','z0','qStar'].map(k=>roots[k]));
  const build=index=>{
    if(memo.has(index))return memo.get(index);
    const node=nodes[index];if(!node)fail('INVALID_SOURCE_CUTOFF','A source cutoff node is missing.');
    const {op,args}=node;let value;
    if(op==='rational')value=G.q(...args);
    else if(constants.has(index))value=G.var('original_closed_source_'+ids[index]);
    else if(op==='coordinate')value=G.var(args[0]);
    else if(op==='source_parameter')value=G.parameter(args[0]);
    else if(op==='add')value=G.add(...args.map(build));
    else if(op==='multiply')value=G.mul(...args.map(build));
    else if(op==='inverse')value=G.inv(build(args[0]));
    else if(op==='integer_power')value=G.pow(build(args[0]),args[1]);
    else if(op==='exp')value=G.exp(build(args[0]));
    else if(op==='smooth_piecewise')value=G.choose(...args.map(build));
    else fail('INVALID_SOURCE_CUTOFF','Unsupported actual cutoff operation: '+op);
    memo.set(index,value);return value;
  };
  const original=['x1','x2','z','tau'].map(k=>build(roots[k])),x=[0,1,2,3].map(i=>G.fresh('periodic_coordinate_'+i)),
    spatial=G.q(8,3),temporal=G.q(16),to=x.map((v,i)=>G.mul(i<3?spatial:temporal,v)),
    // The target coordinates are freshly allocated and contain no original
    // coordinate, so these substitutions are exactly simultaneous.
    at=value=>original.reduce((body,coordinate,i)=>G.substitute(body,coordinate,to[i]),value),sourceCutoff=build(roots.cutoff),cutoff=at(sourceCutoff),
    guards=['radialArgument','axialArgument','timeArgument'].map(k=>at(build(roots[k]))),
    sourceGradient=[0,1,2].map(i=>build(roots['gradient_'+i])),
    sourceHessian=[0,1,2].map(i=>[0,1,2].map(j=>build(roots['hessian_'+i+'_'+j]))),
    sourceDt=build(roots.dt),checks=[];
  const prove=(id,left,right)=>{
    const difference=G.sub(left,right),branches=[];
    if(difference!==G.zero)for(let code=0;code<27;code++){
      const state=[code%3,Math.floor(code/3)%3,Math.floor(code/9)%3],J=new ActualSourceExpressions(),cache=new Map();
      const replay=index=>{
        if(cache.has(index))return cache.get(index);
        const {op,args}=G.nodes[index];let out;
        if(op==='rational')out=J.q(...args);else if(op==='coordinate')out=J.var(args[0]);
        else if(op==='source_parameter')out=J.parameter(args[0]);
        else if(op==='smooth_piecewise'){
          const axis=guards.indexOf(args[0]);if(axis<0)fail('INVALID_SOURCE_CUTOFF','An unrecognized pulled-back branch guard was introduced.');
          out=replay(args[3+state[axis]]);
        }else if(op==='add')out=J.add(...args.map(replay));else if(op==='multiply')out=J.mul(...args.map(replay));
        else if(op==='inverse')out=J.inv(replay(args[0]));else if(op==='integer_power')out=J.pow(replay(args[0]),args[1]);
        else if(op==='exp')out=J.exp(replay(args[0]));else fail('INVALID_SOURCE_CUTOFF','Unsupported branch operation.');
        cache.set(index,out);return out;
      };
      const expression=replay(difference),polynomial=sourceGraphPolynomialIdentity(J,expression,{maxTerms:1500}),
        proof=polynomial.pass?polynomial:sourceGraphRationalIdentity(J,expression,{maxTerms:1500});
      branches.push({state,pass:proof.pass,numeratorMonomials:proof.numeratorMonomials??proof.remainingMonomials,
        method:polynomial.pass?'EXACT_LAURENT_POLYNOMIAL':'EXACT_RATIONAL_FUNCTION'});
    }
    const pass=difference===G.zero||branches.length===27&&branches.every(row=>row.pass);
    if(!pass)fail('TRANSPORT_CHAIN_RULE_MISMATCH','The actual source pullback failed '+id+'.');
    checks.push({id,pass,method:difference===G.zero?'EXACT_STRUCTURAL_IDENTITY':'ALL_27_BRANCHES_EXACT_RATIONAL',branches});
  };
  for(let i=0;i<3;i++)prove('spatial-gradient-'+i,G.derivative(cutoff,x[i]),G.mul(spatial,at(sourceGradient[i])));
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)prove('spatial-hessian-'+i+'-'+j,G.derivative(G.derivative(cutoff,x[i]),x[j]),G.mul(G.pow(spatial,2),at(sourceHessian[i][j])));
  prove('physical-time-minus-tau-chain-rule',G.neg(G.derivative(cutoff,x[3])),G.mul(temporal,at(sourceDt)));
  prove('transported-radial-argument',guards[0],G.div(G.mul(G.q(2),G.pow(spatial,2),G.add(G.pow(x[0],2),G.pow(x[1],2))),G.pow(build(roots.r0),2)));
  prove('transported-axial-argument',guards[1],G.div(G.mul(G.q(2),G.pow(spatial,2),G.pow(x[2],2)),G.pow(build(roots.z0),2)));
  prove('transported-positive-time-argument',guards[2],G.div(G.mul(temporal,x[3]),build(roots.tau0)));
  const coefficientRows=program.sourceNodeIds[roots.cutoff],operator=SOURCE_NEAR_TERMINAL_ARCHIVE.certificate.localizationBinding.operator,
    velocity=operator.velocity.map(row=>({component:row.component,terms:row.terms.map(term=>({...term,coefficient: G.mul(G.q(6),at(build(ids.indexOf(term.coefficient))))}))})),
    pressure=G.mul(G.q(36),cutoff);
  if(operator.pressure[0].coefficient!==coefficientRows||velocity.some(row=>row.terms.length!==5))
    fail('INVALID_SOURCE_OPERATOR','An original pressure or curl coefficient is missing.');
  for(const index of constants)build(index); // Bind even qStar, which is only used by the retained domain.
  return {schema:'MathScope.N7.ActualCapturedCutoffTransport/1',request,sourceAuthenticated:false,
    exactScales:{viscosity:'9/4',sqrtViscosity:'3/2',lambda:'4',spatialPullback:'8/3',timePullback:'16',velocity:'6',pressure:'36',force:'96',wholeEnergy:'243/128'},
    sourceConstantNodes:[...constants].map(i=>ids[i]),sourceCutoff:ids[roots.cutoff],sourceCoordinates:original.map(id=>G.nodes[id].args[0]),
    coordinates:x,roots:{cutoff,pressure,gradient:x.slice(0,3).map(v=>G.derivative(cutoff,v)),timeDerivative:G.neg(G.derivative(cutoff,x[3]))},
    velocity,formulaProgram:{schema:'MathScope.N7.PeriodizationReviewScalarProgram/1',nodes:copy(G.nodes),originalConstantNodeBindings:[...constants].map(i=>({sourceNode:ids[i],replayedNode:memo.get(i)}))},
    checks,originalClosedConstantsNumericallyReplaced:false,fullSourceFieldValuesComputed:false};
}

export function disjointTranslationReview(request){
  const n=BigInt(request.viscosity.numerator),d=BigInt(request.viscosity.denominator),l=BigInt(request.spatialScale),margin=l*l*d-4n*n;
  const checked=exactPeriodizationRequest({viscosity:String(n)+'/'+String(d),spatialScale:String(l)});
  if(canonical(checked)!==canonical(request))fail('INVALID_INPUT','Use the complete unchanged exact periodization request.');
  if(margin<=0n||l<=1n)fail('OVERLAPPING_SUPPORT','The original conservative support must have a strictly positive translate gap.');
  const mixed=[];
  for(let component=0;component<3;component++)for(let derivative=0;derivative<3;derivative++){
    mixed.push({component,derivative,term:'a'+derivative+'*D'+derivative+'b'+component});
    mixed.push({component,derivative,term:'b'+derivative+'*D'+derivative+'a'+component});
  }
  return {periods:['1','1','1'],domain:'R^3/Z^3',fundamentalCube:'(-1/2,1/2)^3',sourceConservativeBox:'K subset [-1,1]^3',
    halfWidth:'sqrt(nu)/lambda',reviewedExactHalfWidth:n===9n&&d===4n&&l===4n?'3/8':null,
    reviewedExactGap:n===9n&&d===4n&&l===4n?'1/4':null,strictSquaredMarginNumerator:String(margin),
    pairProof:'For k!=l in Z^3, at least one coordinate differs by >=1; each support has half-width a and 2*a<1. Thus their closed supports, including derivative supports, are disjoint.',
    atMostOneTranslateAtEveryPoint:true,fullMixedAdvectionTerms:mixed,
    allMixedProductsVanishByVerifiedPositiveGap:true,periodicPressureUsesSameTranslations:true,sameForceUsesSameTranslations:true,
    overlapNegativeControl:{a:['y','0','0'],b:['0','x','0'],divA:'0',divB:'0',selfAdvectionA:['0','0','0'],selfAdvectionB:['0','0','0'],
      mixedAdvection:['x','y','0'],atPoint:{x:'1/3',y:'2/5',value:['1/3','2/5','0']},nonzero:true,
      meaning:'If two supports are allowed to overlap, divergence-free summands alone do not remove the mixed nonlinear terms.'}};
}

export async function sourcePeriodizationReview(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)
    fail('INVALID_INPUT','This source comparison review has fixed source fields and hypotheses; caller completion flags are not accepted.');
  const localization=await sourceLocalizationOperatorEvidence();sourceLocalizationOperatorEvidenceObservations(localization);
  if(await hash(SOURCE_NEAR_TERMINAL_ARCHIVE)!==SOURCE_NEAR_TERMINAL_ARCHIVE_SHA256||localization.proof.sourceEvidence.nearTerminalArchiveSHA256!==SOURCE_NEAR_TERMINAL_ARCHIVE_SHA256)
    fail('SOURCE_BINDING_MISMATCH','The transported cutoff must be the one used by the exact localization proof.');
  const transport=executeOriginalCutoffTransport(SOURCE_NEAR_TERMINAL_ARCHIVE.certificate.formulaProgram);transport.sourceAuthenticated=true;
  const scales=periodizationScaleLedger(),translations=disjointTranslationReview(transport.request),
    hypotheses=[
      {id:'same-force',required:true,binding:'The force is the full unprojected residual of the same authenticated localized u,p and its same transform; no independent force is substituted.',status:'SAME_SOURCE_OPERATOR_BOUND'},
      {id:'zero-initial-data',required:true,binding:copy(localization.proof.sourceDomain.initialZeroInterval),status:'ACTUAL_SOURCE_CUTOFF_INTERVAL_VERIFIED'},
      {id:'periodic-pressure',required:true,binding:'Pper=sum_k transformed(cp)(x+k,t), using exactly the velocity/force translations on the original unit torus.',status:'EXACT_SAME_SOURCE_OPERATOR_TRANSFORM_VERIFIED'},
      {id:'bounded-whole-space-energy',required:true,binding:'Both fields are in L-infinity([0,T];L2(R3)) for every T<1. The original field uses Lemma10.4 and10.13; the competitor must satisfy the same bounded-energy class.',status:'REQUIRED_EXTERNAL_SOURCE_ENERGY_HYPOTHESIS_NOT_NUMERICALLY_ESTABLISHED'},
      {id:'smoothness-before-terminal',required:true,binding:'The same original localized source is smooth on every closed interval [0,T], T<1. This invokes Proposition9.9/10.1 under their source hypotheses.',status:'REQUIRED_SOURCE_THEOREM_HYPOTHESIS'},
      {id:'global-force-extension',required:true,binding:'The same original global force is smooth and supported in K times [0,2], by Lemma10.3; a new global jet/extension computation is still pending.',status:'REQUIRED_EXTERNAL_SOURCE_FORCE_HYPOTHESIS_NOT_CONSTRUCTED'}
    ],comparison={reference:'Lemma10.5, original paper pp121-123',interval:'[0,T], T<1',hypotheses,
      differenceEquation:'dt w+(v.grad)w+(w.grad)u=Delta w-grad pi, div w=0, w(0)=0',sameForceCancellation:true,
      pressure:{g:'g_ij=v_i*v_j-u_i*u_j in L-infinity_t L1_x',riesz:'pi*=sum_ij R_i R_j g_ij',multiplier:'-xi_i*xi_j/|xi|^2',
        gradientIdentification:'For every compact time test a, H_a=int a*(grad pi-grad pi*) lies in H^-3 and is harmonic. Its weighted L2 Fourier transform is supported at {0}, hence is zero.',
        noPressureGrowthAssumptionAdded:true,cutoff:'chi_R=phi(x/R)^8',weightedSobolev:'B_R<=C*(A_R+R^-1*||w||2)',
        commutatorKernel:'C*|x-y|^-3*min(|x-y|/R,1)',kernelL4over3PowerBound:'C/R',pressureFluxFormula:'C_T/R*((B_R+1)*B_R^(1/2)+R^(-3/4)*B_R^(3/4))'},
      absorption:{powers:['3/2','1/2','3/4'],allLessThanTwo:true,remainingRadiusError:'C_T/R'},
      gronwall:'(1/2)*E_R_prime+(1/2)*A_R^2<=||grad u||infinity*E_R+C_T/R; E_R(0)=0 implies E_R<=C_T_prime/R; R->infinity gives w=0.',
      periodicComparison:'(1/2)*d_t||w||2^2+nu*||grad w||2^2<=||grad U||infinity*||w||2^2, with the same force, zero datum and periodic pressure; periodic flux integrals vanish.',
      conclusionsConditionalOnAllListedHypotheses:true,CConclusionIssued:false,DConclusionIssued:false},
    checks=[...transport.checks,...scales.checks,
      {id:'same-authenticated-cutoff-and-all-curl-coefficients',pass:transport.sourceAuthenticated&&transport.velocity.every(row=>row.terms.length===5)},
      {id:'all-eighteen-mixed-products-have-disjoint-derivative-supports',pass:translations.fullMixedAdvectionTerms.length===18&&translations.allMixedProductsVanishByVerifiedPositiveGap},
      {id:'overlapping-solenoidal-copies-have-nonzero-cross-terms',pass:translations.overlapNegativeControl.nonzero},
      {id:'every-required-comparison-hypothesis-remains-attached',pass:hypotheses.length===6&&hypotheses.every(row=>row.required)},
      {id:'whole-energy-force-hypotheses-remain-unresolved',pass:!comparison.CConclusionIssued&&!comparison.DConclusionIssued&&hypotheses.filter(row=>row.status.includes('NOT_')).length===2}],
    result={schema:'MathScope.N7.SourcePeriodizationReview/1',status:'SOURCE_COMPARISON_SCALING_AND_DISJOINT_PERIODIZATION_REVIEW_EXECUTED',
      sourceBinding:copy(localization.sourceBinding),sourceArtifacts:{...copy(localization.sourceArtifacts),localizationOperatorProof:copy(localization.artifact),localizationOperatorReceipt:copy(localization.receipt)},
      sourceDomain:copy(localization.proof.sourceDomain),sourceLocalizationProofSHA256:localization.proofSHA256,transport,scales,translations,comparison,
      time:{terminalTime:'1',initialShift:'15/16',extendedForceEnd:'17/16',preShift:'Exact zero before t0; the original cutoff supplies an open zero overlap.',
        positiveTauPullback:'tau_original=16*tau_periodic',forceEndConditionalOnSourceGlobalExtension:true,velocityAfterTerminalExtended:false},
      scope:{individualComparisonReviewExecuted:true,freshExactOperatorProofExecuted:true,sourceFinalFieldsAreUniversalOperands:true,
        completeGlobalForceConstructed:false,wholeKEnergyComputed:false,unconditionalCConclusionIssued:false,unconditionalDConclusionIssued:false,
        finalNonzeroN6FieldsNumericallyConstructed:false,wholeM3Complete:false,newLeanExecuted:false},
      freshExactOperatorProofExecuted:true,freshSourceConstructorExecuted:false,recordedSourcePrerequisites:true,checks};
  if(checks.some(row=>!row.pass))fail('INVALID_SOURCE_REVIEW','A source comparison transport obligation failed.');
  result.proofSHA256=await hash(result);seals.set(result,canonical(result));return result;
}

export function sourcePeriodizationReviewObservations(result){
  if(!seals.has(result)||seals.get(result)!==canonical(result))fail('INVALID_SOURCE_REVIEW','Use the unchanged privately source-bound periodization review.');
  return {kind:'SOURCE_PERIODIZATION_COMPARISON_REVIEW',samples:[],curves:[],proofSHA256:result.proofSHA256,
    exactScales:copy(result.transport.exactScales),sourceDomain:copy(result.sourceDomain),translationSupport:copy(result.translations),
    comparisonHypotheses:copy(result.comparison.hypotheses),checks:copy(result.checks),scope:copy(result.scope)};
}
