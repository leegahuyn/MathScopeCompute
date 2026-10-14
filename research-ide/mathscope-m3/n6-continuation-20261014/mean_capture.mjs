/** Source-bound continuation of the 35 saved mean capture boundaries.
 * This grammar proves syntax/capture absence only. Limits and derivatives
 * still require the separately recorded analytic hypotheses.
 */
import {createHash} from 'node:crypto';
import {createFunctionalAlphaNormalizer} from '../mean-equivalence-20261014/alpha-functional-equivalence.mjs';
import {inspectMeanDefiningCaptures} from '../mean-equivalence-20261014/mean-functional-equivalence.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const fail=(message,code='UNREVIEWED_CAPTURE_GRAMMAR')=>{throw Object.assign(new Error(message),{code});};
const require=(ok,message)=>{if(!ok)fail(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ids=xs=>{require(Array.isArray(xs)&&xs.every(x=>Number.isSafeInteger(x)&&x>=0),'Source scalar IDs must be explicit nonnegative integers.');return xs;};
const keys=(record,expected)=>require(record&&same(Object.keys(record).sort(),[...expected].sort()),'Unreviewed defining-record fields must remain a capture boundary.');

export function createMeanLimitCaptureRules({definitions,sourceNode}){
  const records=new Map();
  const register=(key,definition,operands)=>{const row={key,definition,definitionSHA256:hash(definition),sourceOperands:ids(operands)};
    if(records.has(key))require(same(records.get(key),row),'A hidden definition changed during the capture walk.');else records.set(key,row);return row.sourceOperands;};
  const profile=id=>{
    const n=sourceNode(id),a=n.args;require(['actual_background_even_profile','actual_background_picard'].includes(n.op),'Wrong profile source call.');
    require(Number.isSafeInteger(a[0])&&a[0]>=0&&definitions.picard?.[a[0]],'Missing exact Picard registry.');
    // Only system zero is reachable in the prior mean capture result. Other
    // systems have a different lower-order grammar and deliberately stay open.
    if(a[0]!==0)return {primitiveBodyClosureProved:false};
    const d=definitions.picard[0];
    keys(d,['name','order','xi','eta','diagonal','A0','A1','forcing','zeroAxisDatum','unknowns','radialDomain','sourceLeading','tail','solutionNorm','actualSourceInputs','sourceEquations','leadingReferenceSubstitution','callerSuppliedForcing']);
    keys(d.sourceLeading,['F0','U0','v0','omega0OverX']);
    keys(d.tail,['sourceMajorant','sourceBound','sourceStrip','solutionStrip','loss','Kcondition','Kprecision','K','etaOrder','error','target','proof','sourceTruncationIndexNumericallyMaterialized','tailIsForTheCertifiedIndexNotForDisplayedTerms']);
    keys(d.solutionNorm,['commonCollar','naturalExtensionToY5','naturalExtensionNotUsedAsActualActivation']);
    require(d.order===1&&same(d.diagonal,[0,0,2,0,3,1])&&d.A0.length===6&&d.A1.length===6&&d.A0.every(r=>r.length===6)&&d.A1.every(r=>r.length===6)&&d.forcing.length===6&&d.zeroAxisDatum.length===6,'Changed original six-component Picard signature.');
    // These exact producer fields are labels/provenance and numeric orders,
    // never scalar IDs. Type/value guards prevent an omitted dependency from
    // being smuggled into a field that the grammar treats as metadata.
    require(typeof d.name==='string'&&d.name.length>0&&d.unknowns.length===6&&d.unknowns.every(x=>typeof x==='string')&&d.radialDomain.length===2&&same(d.sourceEquations,['5.2','5.3','5.4','5.5','5.6','5.7','5.8'])&&d.leadingReferenceSubstitution===false&&d.callerSuppliedForcing===false,'Changed Picard metadata or source-selection signature.');
    require(d.tail.sourceMajorant==='actual-background-majorant.mjs:actualBackgroundMajorant'&&typeof d.tail.proof==='string'&&d.tail.proof.length>0&&Number.isSafeInteger(d.tail.etaOrder)&&d.tail.etaOrder>=0&&d.tail.etaOrder<=4&&d.tail.sourceTruncationIndexNumericallyMaterialized===false&&d.tail.tailIsForTheCertifiedIndexNotForDisplayedTerms===true&&d.solutionNorm.naturalExtensionNotUsedAsActualActivation===true,'Changed Picard limit metadata meaning.');
    keys(d.actualSourceInputs,['axisProof','axisEnvelope','axisProducer','pressure','activation','stepDerivative','continuation']);
    for(const row of Object.values(d.actualSourceInputs)){keys(row,['path','sha256','bytes']);require(typeof row.path==='string'&&row.path.length>0&&typeof row.sha256==='string'&&/^[0-9a-f]{64}$/.test(row.sha256)&&Number.isSafeInteger(row.bytes)&&row.bytes>=0,'Source provenance must be text/hash/byte count, never hidden scalar dependencies.');}
    require(Number.isSafeInteger(a[1])&&a[1]>=0&&a[1]<(n.op==='actual_background_even_profile'?4:6),'Changed Picard component.');
    if(n.op==='actual_background_even_profile')require(a.length===6&&Number.isSafeInteger(a[4])&&a[4]>=0&&a[4]<=4&&Number.isSafeInteger(a[5])&&a[5]>=0&&a[5]<=8,'Changed supported even-profile derivative tuple.');
    else require(a.length===5&&Number.isSafeInteger(a[4])&&a[4]>=0&&a[4]<=12,'Changed supported Picard derivative tuple.');
    const operands=[d.xi,d.eta,...d.A0.flat(),...d.A1.flat(),...d.forcing,...d.zeroAxisDatum,...d.radialDomain,...Object.values(d.sourceLeading),...['sourceBound','sourceStrip','solutionStrip','loss','Kcondition','Kprecision','K','error','target'].map(k=>d.tail[k]),d.solutionNorm.commonCollar,d.solutionNorm.naturalExtensionToY5];
    return {primitiveBodyClosureProved:true,actualArgumentSourceNodes:[a[2],a[3],...register('picard:0',d,operands)]};
  };
  const covariance=id=>{
    const n=sourceNode(id),a=n.args;require(n.op==='actual_covariance_volterra'&&a.length===4&&Number.isSafeInteger(a[0])&&a[0]>=0&&[0,1].includes(a[1])&&Array.isArray(a[3]),'Changed covariance call signature.');
    const matches=definitions.m3GlobalPulses?.filter(d=>d.covariance===a[0])??[];
    require(matches.length===1,'A unique saved original covariance definition is required.');
    const wrapper=matches[0],d=JSON.parse(wrapper.originalDefinition);
    keys(wrapper,['covariance','variable','parameters','directions','directionParameterIndices','matrix','initial','left','length','originalDefinition','equation','exactSolution','matrixDerivativesSuppliedByCaller','sourceAuthenticated']);
    keys(d,['name','variable','parameters','matrix','normUpper','length','initial','implementation','derivativeImplementation','solution','normConvention','coefficientNormMustBeBoundBySource','displayedPartialSumIsExactSolution']);
    require(same(d.parameters,wrapper.parameters)&&same(d.matrix,wrapper.matrix)&&d.variable===wrapper.variable&&d.length===wrapper.length&&same(d.initial,wrapper.initial),'Changed global/original covariance binding.');
    require(d.matrix.length===2&&d.matrix.every(r=>r.length===2)&&d.initial.length===2&&d.parameters.length===a[3].length&&new Set(d.parameters).size===d.parameters.length&&!d.parameters.includes(d.variable),'Changed full Volterra parameter or coefficient tuple.');
    require(typeof d.name==='string'&&typeof d.solution==='string'&&typeof d.normConvention==='string'&&d.implementation==='actual-covariance-volterra.mjs:covariancePartialSum'&&d.derivativeImplementation==='actual-covariance-volterra.mjs:covarianceRhs'&&d.coefficientNormMustBeBoundBySource===true&&d.displayedPartialSumIsExactSolution===false,'Changed original Volterra limit meaning.');
    require(sourceNode(d.initial[0])?.op==='rational'&&same(sourceNode(d.initial[0]).args,['1','1'])&&sourceNode(d.initial[1])?.op==='rational'&&same(sourceNode(d.initial[1]).args,['0','1'])&&wrapper.left===d.initial[1]&&Array.isArray(wrapper.directions)&&wrapper.directions.length===wrapper.directionParameterIndices.length&&same(wrapper.directionParameterIndices,wrapper.directions.map(x=>d.parameters.indexOf(x)))&&wrapper.directionParameterIndices.every(x=>x>=0)&&typeof wrapper.equation==='string'&&typeof wrapper.exactSolution==='string'&&wrapper.matrixDerivativesSuppliedByCaller===false&&wrapper.sourceAuthenticated===false,'Changed original initial datum, integration endpoint or differentiated-direction binding.');
    const operands=[d.variable,...d.parameters,...d.matrix.flat(),d.normUpper,d.length,...d.initial];
    return {primitiveBodyClosureProved:true,actualArgumentSourceNodes:[a[2],...ids(a[3]),...register('covariance:'+a[0],d,operands)]};
  };
  return {rules:[{sourceOperation:'actual_background_even_profile',sourceClosure:profile},{sourceOperation:'actual_background_picard',sourceClosure:profile},{sourceOperation:'actual_covariance_volterra',sourceClosure:covariance}],diagnostics:()=>[...records.values()].sort((a,b)=>a.key.localeCompare(b.key))};
}

function recheck(mean,definitions,sourceNode){
  const stageRows=Array.isArray(mean.rows)?mean.rows:mean.rows?.retained;require(stageRows?.length===2,'Both complete prior source stages are required.');
  const result=[];
  for(const stage of ['temporal','moments']){
    const original=stageRows.find(r=>r.stage===stage),cp=mean.remainingAtomCheckpoints.find(r=>r.stage===stage)?.checkpoint;
    require(cp?.completeReviewedOperandCheckpoint===true&&!cp.limitStop,'The complete saved operand closure is required.');
    const g=createFunctionalAlphaNormalizer({rows:cp.reviewedOperandRows,definitions,sourceNode,maxWork:300000}),comparisons={};
    for(const [field,old]of Object.entries(original.comparisons)){
      if(old.pass){comparisons[field]={priorByteAuthenticatedSymbolicMatchPreserved:true,recomputed:false};continue;}
      const terms=Array.isArray(old.numerator)?old.numerator:old.numerator?.retained;require(Array.isArray(terms)&&!old.numerator?.omitted&&terms.length===old.numeratorMonomials,'Actual retained numerator is incomplete.');
      let value=g.q(0);
      for(const term of terms){const [n,d='1']=term.coefficient.split('/');let product=g.q(n,d);
        for(const factor of term.monomial.split(',').filter(Boolean)){const [node,power]=factor.split(':').map(Number);require(Number.isSafeInteger(power)&&power>=0,'Invalid actual monomial degree.');product=g.mul(product,g.pow(g.visit(node),power));}value=g.add(value,product);}
      comparisons[field]={priorByteAuthenticatedSymbolicMatchPreserved:true,recomputed:true,proof:g.verify(value)};
    }
    const diagnostics=g.diagnostics();result.push({stage,comparisons,normalizationWork:diagnostics.work,integralEqualities:diagnostics.integralProofs,operatorBindings:diagnostics.operatorBindings,domainRequirements:diagnostics.domainRequirements});
  }
  return result;
}

export function auditMeanCaptureContinuation({mean,prior,definitions,sourceNode,naturalRule}){
  require(mean.replayStrategy==='original'&&mean.allOriginalMaximumValuesRetained===true&&prior.formalDefinedExpressionComparisonsMatched===8,'Use the original passed source mean bytes.');
  const compared=recheck(mean,definitions,sourceNode),seen=new Map(),provider=id=>{const n=sourceNode(id);seen.set(id,n);return n;};
  require(compared.every(r=>Object.values(r.comparisons).every(c=>!c.recomputed||c.proof.pass)),'Previously matched actual numerators no longer match.');
  const limits=createMeanLimitCaptureRules({definitions,sourceNode:provider});
  const capture=inspectMeanDefiningCaptures({sourceNode:provider,definitions,operatorBindings:compared.flatMap(r=>r.operatorBindings),freshBinderSourceIDs:prior.capture.freshBinderSourceIDs,maxNodes:500000,maxWork:2000000,sourceCaptureRules:[naturalRule,...limits.rules]});
  const sourceRows=[...seen].sort((a,b)=>a[0]-b[0]);
  const inventory=Object.fromEntries(['inverse','log_positive','sqrt_positive','definite_integral','actual_monotone_root','actual_quadratic_root','actual_natural_series','actual_background_even_profile','actual_covariance_volterra','source_step_derivative','smooth_piecewise','maximum','ceiling'].map(op=>{
    const rows=sourceRows.filter(([,n])=>n.op===op).map(([sourceNode,node])=>({sourceNode,node}));return [op,{count:rows.length,sha256:hash(rows),rows}];}));
  return {schema:'MathScope.N6.MeanCaptureContinuation/1',status:capture.allHiddenCaptureClosureProved?'FRESH_RADIAL_BINDER_CAPTURE_ABSENCE_CERTIFIED_ANALYTIC_PREMISES_OPEN':'FRESH_RADIAL_BINDER_CAPTURE_UNRESOLVED',source:mean.source,
    priorEightSymbolicMatchesPreserved:true,remainingFourNumeratorsRechecked:4,comparisons:compared,capture,expandedLimitDefinitions:limits.diagnostics(),domainInventory:inventory,
    reviewedSourceRows:sourceRows.length,reviewedSourceRowsSHA256:hash(sourceRows),
    analyticObligations:[
      {kind:'DIVISION_LOG_SQRT_DOMAINS',actualInventory:['inverse','log_positive','sqrt_positive'],proved:false,required:'Every inverse operand nonzero, every log operand positive and every positive square-root branch valid on the whole actual source domain.'},
      {kind:'INTEGRAL_LEIBNIZ_FTC',actualInventory:['definite_integral'],proved:false,required:'Actual source bodies integrable; differentiated integrals and moving endpoints satisfy Leibniz/FTC and zero extensions have required regularity.'},
      {kind:'IMPLICIT_BRANCH',actualInventory:['actual_monotone_root','actual_quadratic_root'],proved:false,required:'Endpoint/bracket and selected branch, invertible full Jacobian and actual argument domain for every reachable call.'},
      {kind:'NATURAL_SERIES_DOMAIN',actualInventory:['actual_natural_series'],proved:false,required:'Locally uniform coefficient convergence and differentiability in a common actual argument neighborhood; selected node 4483 proof alone does not discharge all calls.'},
      {kind:'PICARD_VOLterra_DOMAIN',actualInventory:['actual_background_even_profile','actual_covariance_volterra'],proved:false,required:'Original coefficient norm, convergence and parameter/radial differentiability premises for the exact infinite limits, including axis regularity of even profiles.'},
      {kind:'CUTOFF_MAXIMUM_CEILING',actualInventory:['smooth_piecewise','source_step_derivative','maximum','ceiling'],proved:false,required:'Collar/endpoint regularity and local constancy or admitted parameter treatment wherever maximum/ceiling expressions are differentiated.'},
      {kind:'SOURCE_CLASS_SUPPORT',proved:false,required:'The original j=0 W/M/S classes, B0=.7, C0*=1.2, moments, support and full Cartesian PDE are separate obligations.'}
    ],
    scope:{allOriginalMaximumValuesRetained:true,heavyMeanReplayRepeated:false,oldProducerModified:false,freshBinderCaptureAbsenceProved:capture.allHiddenCaptureClosureProved===true,allFunctionDefinitionsSemanticallyWellDefinedProved:false,actualMathematicalIdentitiesCertified:false,allAnalyticDomainsProved:false,originalN601Complete:false,originalN602Complete:false,completeN6:false,originalCountsChanged:false},
    limitation:'The complete reviewed defining grammar excludes the four newly introduced radial binders. It does not certify arbitrary hidden-coordinate closure, limit existence, smoothness, the source domain, all denominator hypotheses, source classes or the whole PDE. The eight equations remain symbolic identities with analytic prerequisites.'};
}
