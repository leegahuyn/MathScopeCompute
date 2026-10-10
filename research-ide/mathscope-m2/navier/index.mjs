import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {iadd,isub,imul,idiv,iscale,ilog,point,nextUp,nextDown} from '../../mathscope-m1/navier/numerics.mjs';
import {integrateAffineTangentPulse} from './pulse-ode.mjs';
import {getChecklist} from './checklist.mjs';
import {coefficientIdentityAudit,sourceDimensionAudit,sourceCutoffCurlAudit,finiteBackgroundResidual} from './source-algebra.mjs';
import {SOURCE_PROFILE_ID,getPinnedSourceProfile,assertSourceProfile} from './source-profile.mjs';
import {sourceDyadicObservation,sourceTorusGeometry,evaluatedDerivativeContract,applyEvaluatedDerivatives,torusExactIdentityAudit} from './source-geometry.mjs';
import {sourceSupportAllocation} from './source-support.mjs';
import {backgroundPicardComponent,sourceMomentOperator} from './source-background.mjs';
import {referenceGaussianEnvelope} from './source-envelope.mjs';
import {getSourceCoreObservations} from './source-core-observations.mjs';
import {sourcePulseCurlAudit} from './source-pulse-curl.mjs';
import {evaluateLocalPotentialSum,cutoffConstantLedger} from './source-gluing.mjs';
import {evaluatePulseCutoffRemainder,defaultTailJet} from './source-tail.mjs';
import {actualBackgroundConstruction} from './actual-background.mjs';
import {actualMeanPatchPulseConstruction} from './actual-pulse-construction.mjs';
import {actualGlobalSourceConstruction} from './actual-global-source.mjs';
import {evaluateActualCorePoint} from './actual-core-evaluator.mjs';
import {buildActualPicardAcceptance,verifyActualPicardAcceptance} from './actual-picard-acceptance.mjs';
import {actualMeanPulseAmplitude} from './actual-pulse-amplitude-integrator.mjs';
import {actualContinuationConstruction} from './actual-continuation-construction.mjs';
import {actualMeanPulsePointwiseAssembly} from './actual-pulse-covariance-partition.mjs';
import {actualResidualOrderCertificate,verifyActualResidualOrderCertificate} from './actual-residual-order.mjs';
import {actualBackgroundMomentCertificate} from './actual-continuation-exact-certificate.mjs';
import {actualCovarianceFamilyCertificate} from './actual-covariance-source-certificate.mjs';
import {actualPulseSensitivityCertificate} from './actual-pulse-sensitivity.mjs';
import {actualCovarianceSensitivityCertificate} from './actual-covariance-sensitivity.mjs';
import {actualPulseJetCertificate} from './actual-pulse-jet-source.mjs';
import {actualFullCurlCertificate} from './actual-full-curl.mjs';

const PAPER={title:'Finite Time Blowup for Navier–Stokes',url:'https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf',sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'};
const PROFILE={id:'same-profile-2026-10-10.3',commit:'55dacb898f8c204bf0c5925ea901d75d6c2d0f46',assessmentSha256:'e57681b7bb751967b406ad440942728ecfd8fe47eb9672129ff19c8a7eb6634c',role:'ACCEPTED_N3_ARCHIVE_REFERENCE',globalEvaluator:false,description:'Archived N3 same-profile result. This identity is retained; the finite M2 component fixtures below do not substitute new numeric parameters into that profile.'};
const DIFFERENTIAL_KINDS=['ns.actual-covariance-sensitivity','ns.actual-pulse-jet','ns.actual-full-curl'];
const KINDS=[...DIFFERENTIAL_KINDS,'ns.actual-pulse-sensitivity','ns.actual-core-evaluation','ns.actual-global-source','ns.actual-continuation','ns.actual-background','ns.actual-picard-acceptance','ns.actual-moment-restoration','ns.actual-uniform-covariance','ns.actual-pulse-amplitude','ns.actual-covariance-matching','ns.actual-residual-order','ns.actual-mean-pulse','ns.background-recursion','ns.background-picard','ns.background-moments','ns.background-residual','ns.background-cutoffs','ns.potential-curl','ns.dyadic-charts','ns.source-core-charts','ns.torus-derivatives','ns.pulse-support','ns.pulse-ode','ns.pulse-covariance','ns.pulse-curl','ns.pulse-tail'];
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const finite=(v,name,lo=-1e6,hi=1e6)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)fail('INVALID_INPUT',name+' is outside the finite supported interval.');return v;};
const int=(v,name,lo,hi)=>{finite(v,name,lo,hi);if(!Number.isSafeInteger(v))fail('INVALID_INPUT',name+' must be an integer.');return v;};
const declaredConstant=(value,name)=>{if(value&&typeof value==='object'&&!Array.isArray(value)&&value.kind==='FLOAT64'&&Object.keys(value).every(k=>['kind','value'].includes(k)))return finite(value.value,name,1e-100,1e100);return finite(value,name,1e-100,1e100);};
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],scale=(a,s)=>a.map(x=>x*s),add=(a,b)=>a.map((v,i)=>v+b[i]),norm=a=>Math.hypot(...a);
const check=(id,pass,detail='')=>({id,pass:Boolean(pass),detail});
const axis=(label,kind='CATEGORICAL',unit='1',sourceField)=>({label,name:label,kind,unit,scale:'LINEAR',...(sourceField?{sourceField}:{})});
const result=(object,results,checks,visualization,blockers=[],grade='FINITE_NUMERICAL_COMPONENT')=>({status:blockers.length?'PARTIAL':'COMPLETED',evidenceGrade:grade,object,results,checks,visualization,blockers,sourceLedger:{paper:PAPER,n3Profile:PROFILE},scope:{finite:true,fullSameProfileN4:false,fullSameProfileN5:false,globalNavierStokesConstruction:false,formalPass:false}});

async function actualPulseSensitivity(input,ctx){
  const data=await actualPulseSensitivityCertificate({ellExact:'1',terms:0,...input},ctx);
  const output=result({kind:'ACTUAL_SOURCE_FIRST_SLOW_PULSE_SENSITIVITY',sourceProfile:data.sourceProfile},data,data.checks,
    {axes:[axis('source component'),axis('exact derivative expression'),axis('0')],points:[],lines:[],description:'Actual first slow R/Z/T derivative of the two source pulses, retaining the source matrix, initial frame and endpoint dependence.',lostInformation:['Expression identifiers are retained source program references, not evaluated numerical amplitudes.','Finite Volterra prefixes retain a nonzero tail. Covariance-weight derivatives, second slow derivatives, full curl and flat errors remain separate.']},[],'EXACT_SOURCE_FIRST_VARIATION_WITH_CONVERGENT_FUNCTIONAL_TAIL');
  return {...output,scope:{...output.scope,finite:false,...data.scope,formalPass:false},sourceHash:getPinnedSourceProfile().inputs.assembly.sha256,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; derivative program hash and reconstructible source inputs are retained in results.graph'};
}

async function actualDifferential(input,ctx,kind){
  const adapters={'ns.actual-covariance-sensitivity':actualCovarianceSensitivityCertificate,'ns.actual-pulse-jet':actualPulseJetCertificate,'ns.actual-full-curl':actualFullCurlCertificate};
  const data=await adapters[kind]({ellExact:'1',terms:kind==='ns.actual-pulse-jet'?1:0,...input},ctx);
  const output=result({kind:'ACTUAL_SOURCE_DIFFERENTIAL_EXTENSION',operation:kind,sourceProfile:data.sourceProfile},data,data.checks,
    {axes:[axis('source component'),axis('exact source expression'),axis('0')],points:[],lines:[],
      description:data.completedScope||'Exact actual-source differential expressions with their stated domains and convergence conditions.',
      lostInformation:['Expression identifiers are not evaluated numerical derivatives.','Positive covariance membership and global physical residual/flat-error conclusions require their separately stated proofs.']},[],
    kind==='ns.actual-full-curl'?'CONDITIONAL_ACTUAL_LOCAL_FULL_POTENTIAL_CURL':'EXACT_ACTUAL_SOURCE_DERIVATIVES_WITH_FUNCTIONAL_TAILS');
  return {...output,scope:{...output.scope,finite:false,...data.scope,formalPass:false},sourceHash:getPinnedSourceProfile().inputs.assembly.sha256,
    sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; the new compiler inputs and complete differential graph hash are retained in results.graph'};
}

function actualCore(input,ctx){
  const data=evaluateActualCorePoint({...input,bits:input.bits??ctx.precision?.bits??192},ctx),rows=data.phi.rows;
  const output=result({kind:'ACTUAL_N0_NONLINEAR_CORE_POINT',sourceProfile:data.profileId},data,[
    check('actual-nonlinear-error-retained',data.scope.positiveBanachErrorRetained&&!data.scope.comparisonReplacedActualPhi),
    check('actual-pressure-error-retained',data.scope.actualPressureAnalyticErrorRetained),
    check('directed-bigint-arithmetic',data.arithmetic.kind==='DIRECTED_BIGINT_DYADIC_INTERVAL'&&data.arithmetic.binary64UsedForDecisions===false),
    check('original-core-and-extension-distinguished',data.domain.B26CutoffApplied===false&&data.domain.actualPhysicalCollarEvaluated===false)
  ],{axes:[axis('mixed derivative row'),axis('normalized Phi derivative','NORMALIZED_FIELD_INTERVAL'),axis('0')],points:rows.map((s,i)=>({pos:[i,s.actualNonlinearInterval.displayEnclosure[0]/2+s.actualNonlinearInterval.displayEnclosure[1]/2,0],value:s.actualNonlinearInterval,label:s.quantity,sourceField:`result.results.phi.rows[${i}].actualNonlinearInterval`})),lines:[],description:'Actual nonlinear core intervals at the requested exact point, with separate comparison tail and nonlinear error.',lostInformation:['Different mixed derivatives use their stated normalization and are separate observations.','Y>4 is the natural analytic extension needed for B.26; the physical cutoff collar and global moment repairs are not evaluated.']},['The actual core point and its requested derivatives are enclosed; the full continuation, B.8 roots, global moment debts and positive-order repairs remain unfinished.'],'ACTUAL_SOURCE_DIRECTED_BIGINT_CORE_POINT_WITH_RETAINED_ANALYTIC_ERRORS');
  return {...output,sourceHash:data.sourceHash,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; point request, directed arithmetic and analytic source bounds are retained in results'};
}

function actualGlobalSource(input,ctx){
  ctx.checkCancelled?.();
  const data=actualGlobalSourceConstruction({profileId:input.sourceProfile??SOURCE_PROFILE_ID,eta:input.eta??.25,xi:input.xi??[.5,1,2,5,9]});
  for(const [i,row]of data.outerObservations.rows.entries())for(const[j,value]of row.values.entries())value.sourceField=`result.results.outerObservations.rows[${i}].values[${j}].interval`;
  const rows=data.outerObservations.rows,checks=[
    check('actual-nonzero-outer-source',rows.every(r=>r.actualUIsNonzero)),
    check('regular-integrals-and-boundary-retained',data.verification.allRootAndIntegralDefinitionsHaveExplicitProgramOperands),
    check('five-moment-shortcut-rejected',data.verification.endpointMomentShortcutExplicitlyRejected),
    check('full-debts-not-mislabeled-complete',!data.scope.actualFullMomentDebtsClosed&&!data.scope.actualIposInverseAppliedToFullDebts)
  ];
  const output=result({kind:'ACTUAL_N0_OUTER_SOURCE_AND_GLOBAL_MOMENT_REDUCTION',sourceProfile:data.profileId},data,checks,{axes:[axis('xi = lambda log(X/Xp)','NORMALIZED_SOURCE_COORDINATE'),axis('normalized actual outer field','NORMALIZED_FIELD_INTERVAL'),axis('0')],points:rows.flatMap((s,i)=>s.values.map((v,j)=>({pos:[s.xi,v.value,0],value:v.interval,label:v.quantity,sourceField:`result.results.outerObservations.rows[${i}].values[${j}].interval`}))),lines:[],description:'Actual outer-source observations and an exact weighted-Omega reduction with the axis contribution retained.',lostInformation:['The complete outer formula is compiled, but the complete global weighted integrals have not been numerically enclosed.','Small C.12 field omission bounds apply to the two functional values, not to every derivative or pulse shear.']},data.remaining.map(x=>x.obligation),'ACTUAL_SOURCE_OUTER_INTERVALS_AND_EXACT_GLOBAL_FUNCTIONAL_REDUCTION');
  return {...output,sourceHash:getPinnedSourceProfile().inputs.assembly.sha256,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; actual outer integral receipt and reduction sources remain in results'};
}

function actualContinuation(input,ctx){
  const data=actualContinuationConstruction({...input,bits:input.bits??ctx.precision?.bits??192},ctx),rows=data.actualAxialCell.rows;
  const checks=[check('whole-actual-core-moments',data.coreMoments.rows.length===21&&data.coreMoments.rows.every(r=>r.positiveNonlinearErrorRetained===true)),check('positive-reference-width-retained',data.reference.scope.actualPositiveCutoffWidthKept),check('whole-actual-axial-cell',data.actualAxialCell.scope.actualWholeAxialContinuationCellEnclosed&&!data.actualAxialCell.scope.actualUEquals4Eta),check('actual-comparison-checks',data.globalComparison.arithmeticChecks.every(r=>r.verified)),check('exact-debt-not-replaced-by-a-bound',data.nextOrderGate.allowed===false&&data.nextOrderGate.midpointOrA2SubstitutionAllowed===false)];
  const output=result({kind:'ACTUAL_CORE_MOMENTS_AND_SOURCE_CONTINUATION',sourceProfile:data.profileId},data,checks,
    {axes:[axis('independent actual field row'),axis('actual source cell interval','ACTUAL_FIELD_INTERVAL'),axis('0')],points:rows.map((r,i)=>({pos:[i,r.actualInterval.displayEnclosure[0]/2+r.actualInterval.displayEnclosure[1]/2,0],value:r.actualInterval,label:r.id+' · eta order '+r.etaDerivativeOrder,sourceField:`result.results.actualAxialCell.rows[${i}].actualInterval`})),lines:[],description:'Actual whole-core integrals, positive-width B.22 reference, actual U/M/V cell intervals and retained global weighted-moment displacement.',lostInformation:['B.22 reference integrals and actual continuation cell enclosures are separate observations.','A bounded nonzero global displacement does not choose an exact total moment debt or enable the next background order.']},data.remaining.map(x=>x.required),'ACTUAL_SOURCE_DIRECTED_INTERVAL_CONTINUATION_AND_GLOBAL_REMAINDER');
  return {...output,sourceHash:getPinnedSourceProfile().inputs.assembly.sha256,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; source continuation and analytic remainder bindings remain in results'};
}

function actualBackground(input,ctx){
  ctx.checkCancelled?.();
  const data=actualBackgroundConstruction({profileId:input.sourceProfile??SOURCE_PROFILE_ID,order:1,radialDegree:input.radialDegree??3,bits:input.tailBits??128}),samples=data.axisObservations.samples;
  const output=result({kind:'ACTUAL_SAME_SOURCE_ORDER_ONE_BACKGROUND',sourceProfile:data.profileId},data,data.verification.checks,
    {axes:[axis('component index'),axis('normalized first radial derivative','NORMALIZED_FIELD_INTERVAL'),axis('0')],points:samples.map((s,i)=>({pos:[i,s.value,0],value:s.value,label:s.quantity,sourceField:`results.axisObservations.samples[${i}].normalizedInterval`})),lines:samples.map((s,i)=>({points:[[i,s.displayEnclosure[0],0],[i,s.displayEnclosure[1],0]]})),description:'Actual source order-one derivatives, same common-collar bounds, and positive-core function enclosures. Components retain separate exact normalizations.',lostInformation:['The point enclosures cover selected positive radii and not the entire collar. Changing tailBits also changes those radii.','The full global moment debts and later corrected orders have not been constructed.']},data.remaining,'ACTUAL_SOURCE_INTERVAL_OBSERVATIONS_AND_WRITTEN_ANALYTIC_DERIVATION');
  return {...output,sourceHash:getPinnedSourceProfile().inputs.assembly.sha256,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; per-field producer and parameter hashes remain in results.axisObservations.sourceInputs'};
}
function actualPicardAcceptance(input,ctx){
  ctx.checkCancelled?.();
  const certificate=buildActualPicardAcceptance({profileId:input.sourceProfile??SOURCE_PROFILE_ID,order:1,bits:input.tailBits??128});
  const data={...certificate,verification:verifyActualPicardAcceptance(certificate),remaining:['Actual global moment repair, higher orders and full residual refinement are separate package obligations.']},samples=data.axisObservations.samples;
  const output=result({kind:'ACTUAL_FIXED_ORDER_PICARD_FINITE_ACCEPTANCE',sourceProfile:data.profileId,order:1},data,data.verification.checks,
    {axes:[axis('component index'),axis('normalized actual first derivative','NORMALIZED_FIELD_INTERVAL'),axis('0')],points:samples.map((s,i)=>({pos:[i,s.value,0],value:s.normalizedInterval,label:s.quantity,sourceField:`result.results.axisObservations.samples[${i}].normalizedInterval`})),lines:[],description:'Actual fixed-source n=1 equation, common collar, analytic strip, source-derived majorant, exact finite K expression and certified Picard tail.',lostInformation:['The exact finite K expression is retained; the enormous K-term sum has not been numerically evaluated.','The finite N4-03 acceptance does not certify later moment repairs, residual decay or the full N4 package.']},[],'CERTIFIED_FINITE_FIXED_ORDER_ANALYTIC_COMPUTATION');
  return {...output,scope:{...output.scope,finiteCriterion:'N4-03',finiteCriterionPass:true,supportedBackgroundOrders:[1],numericalKTermSumExecuted:false},sourceHash:getPinnedSourceProfile().inputs.assembly.sha256,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; source-byte bindings and exact finite acceptance remain in results'};
}
function actualMeanPulse(input,ctx){
  const data=actualMeanPatchPulseConstruction(input,ctx),rows=data.meanPatch.jets;
  const output=result({kind:'ACTUAL_SAME_SOURCE_MEAN_PATCH_PULSE_INPUTS',sourceProfile:data.profileId},data,data.checks,
    {axes:[axis('slow derivative index'),axis('normalized F derivative','NORMALIZED_FIELD_INTERVAL'),axis('0')],points:rows.map((s,i)=>({pos:[i,(s.normalizedFInterval[0]+s.normalizedFInterval[1])/2,0],value:(s.normalizedFInterval[0]+s.normalizedFInterval[1])/2,label:'d^('+s.multiIndex.join(',')+') F/Fscale',sourceField:`results.meanPatch.jets[${i}].normalizedFInterval`})),lines:rows.map((s,i)=>({points:[[i,s.normalizedFInterval[0],0],[i,s.normalizedFInterval[1],0]]})),description:'Actual preserved Imean velocity and normalized slow-coordinate derivatives, with the source growing datum and explicit local comparison bounds.',lostInformation:['The displayed reference log envelope is not a numerical integration of the actual homogeneous amplitude.','These source bounds cover Imean; full annular pulses, every slow derivative, and source covariance remain unfinished.']},[data.remaining],'ACTUAL_SOURCE_LOCAL_JETS_AND_LOCAL_ANALYTIC_PULSE_BOUNDS');
  return {...output,sourceHash:data.sourceHash,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; full local source bindings remain in results.sourceBindings'};
}

function actualCovarianceMatching(input,ctx){
  const data=actualMeanPulsePointwiseAssembly(input,ctx),rows=data.localMatch.rows;
  const checks=[...data.checks,...data.localMatch.checks,...data.localMatch.pulseCovariance.checks,...data.localMatch.meanStress.bounds.checks];
  const output=result({kind:'ACTUAL_SOURCE_COVARIANCE_STRESS_AND_POINTWISE_ASSEMBLY',sourceProfile:data.profileId},data,checks,
    {axes:[axis('source sign family'),axis('normalized positive squared amplitude','NORMALIZED_ACTUAL_COVARIANCE_WEIGHT'),axis('0')],points:rows.map((r,i)=>({pos:[i,r.normalizedSquaredAmplitude[0]/2+r.normalizedSquaredAmplitude[1]/2,0],value:r.normalizedSquaredAmplitude,label:r.sign,sourceField:`result.results.localMatch.rows[${i}].normalizedSquaredAmplitude`})),lines:[],description:'Actual source pulse covariance, complete heat-prepared stress, positive inverse weights and the complete active squared-partition sum at the certified representative.',lostInformation:['All enormous positive physical scales remain exact source expressions; plotted intervals are their normalized coefficients.','The pointwise identity does not certify every slow neighborhood, the full annulus, or a uniform background q threshold.']},['This local fixture computes the actual inverse and complete representative-point sum. The separate ns.actual-uniform-covariance certificate supplies the all-band source threshold, full-annulus inverse and global family; those conclusions are not added to this local result.'],'ACTUAL_SOURCE_COVARIANCE_WITH_POSITIVE_INVERSE_AND_COMPLETE_POINT_SUM');
  return {...output,scope:{...output.scope,actualLocalCovarianceMatched:true,actualPointwiseEquation730Verified:true,wholeAnnulusCovarianceMatched:false,sourceUniformQStarCertified:false},sourceHash:data.sourceHash,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; exact F-expression matching, pulse integral, heat debt and active-set proofs are retained in results'};
}

function actualPulseAmplitude(input,ctx){
  const data=actualMeanPulseAmplitude(input,ctx),rows=data.rows;
  const output=result({kind:'ACTUAL_HOMOGENEOUS_PULSE_AND_PHASE_FINITE_ACCEPTANCE',sourceProfile:data.profileId},data,[...data.checks,...data.sourceScales.checks],
    {axes:[axis('v/Ls','NORMALIZED_PULSE_COORDINATE'),axis('actual radial amplitude / P','NORMALIZED_ACTUAL_AMPLITUDE_INTERVAL'),axis('0')],points:rows.map((r,i)=>({pos:[r.pulseFraction,r.radialOverP[0]/2+r.radialOverP[1]/2,0],value:r.radialOverP,label:'actual x/P',sourceField:`result.results.rows[${i}].radialOverP`})),lines:[],description:'Actual source homogeneous growing pulse, original left datum and complete interval comparison, with its phase, moving frame, energy and continuous Gaussian bounds.',lostInformation:['The carrier and positive physical scales remain exact expressions. Normalized interval coordinates do not substitute finite values for them.','This finite representative test leaves general forcing, all slow derivatives and the full annular package outside its accepted scope.']},[],'CERTIFIED_ACTUAL_HOMOGENEOUS_PULSE_INTERVAL_COMPUTATION');
  return {...output,scope:{...output.scope,finiteCriteria:['N5-04','N5-05'],finiteCriteriaPass:true,certifiedRepresentativeEta:0,certifiedRepresentativeS:1,actualFullPulseInterval:true,generalForcingInverseComplete:false},sourceHash:data.sourceHash,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; actual completed-background restriction, phase program and source comparisons remain in results'};
}

function actualResidualOrder(input,ctx){
  ctx.checkCancelled?.();
  const data=actualResidualOrderCertificate({...input,bits:input.bits??ctx.precision?.bits??128},{...ctx,sourceHash:getPinnedSourceProfile().inputs.assembly.sha256});
  const verification=verifyActualResidualOrderCertificate(data);
  if(!data.pass||!verification.pass)fail('FAILED','The actual fixed-domain residual certificate failed its source-bound replay.');
  const output=result({kind:'ACTUAL_FIXED_SOURCE_RESIDUAL_ORDER_CERTIFICATE',sourceProfile:data.sourceProfile,orders:[0,1]},data,data.checks,
    {axes:[axis('fixed source q selection index k'),axis('normalized residual upper bound','SOURCE_RESIDUAL_NORM_BOUND'),axis('0')],points:data.timeRows.map((r,i)=>({pos:[r.k,r.displayEnclosure[1],0],value:r.N1NormUpperExact,label:'N=1 upper bound at q_'+r.k,sourceField:`result.results.timeRows[${i}].N1NormUpperExact`})),lines:[],description:'Direct actual-source PDE residual with fixed-domain N=0 and N=1 enclosures, source-derived norm expressions, and independent arithmetic/mesh parameters.',lostInformation:['The displayed bounds enclose the actual norms; they are not exact norm values.','The source-defined core compact is fixed across order, arithmetic precision, grid and q. At fixed q, eta varies over a space-time set through tau=q*(1-eta^2). The global repaired profile and all N are separate obligations.']},[],'ACTUAL_SOURCE_DIRECTED_RESIDUAL_INTERVALS_AND_ANALYTIC_NORM_CONSTANTS');
  return {...output,scope:{...output.scope,finiteCriterion:'N4-05',finiteCriterionPass:true,supportedBackgroundOrders:[0,1],sameFixedSourceDomain:true,actualCNmAndKmComputed:true,wholeProfileResidualComplete:false,allOrdersComplete:false},sourceHash:data.sourceHash,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; actual coefficient program, fixed coordinates and source-derived norm expressions are retained in results'};
}

async function actualMomentRestoration(input,ctx){
  ctx.checkCancelled?.();
  const data=await actualBackgroundMomentCertificate({...input,bits:input.bits??ctx.precision?.bits??128},ctx);
  const accepted=data.pass===true&&data.scope?.originalN404Complete===true;
  if(!accepted)fail('FAILED','The actual n=1/n=2 moment restoration, source ordering and stress support certificate did not pass.');
  const output=result({kind:'ACTUAL_FIRST_AND_SECOND_ORDER_MOMENT_RESTORATION',sourceProfile:data.profileId,orders:[1,2]},data,data.checks,
    {axes:[axis('ordered source endpoint','CATEGORICAL_SOURCE_ENDPOINT'),axis('order and stress component','CATEGORICAL_COMPONENT'),axis('0')],points:[],lines:[],description:'Actual n=1 and n=2 five-moment repairs, reconstructed fields and pressure, executed source-order gate and separate stress-support certificates.',lostInformation:['The continuous functionals and convergent solutions are retained as exact construction operands. Their signed numerical values have not been quadrature evaluated.','Support endpoints are drawn in their verified order; screen spacing is not physical distance.']},[],'ACTUAL_CONVERGENT_FUNCTION_CONSTRUCTION_AND_EXACT_RATIONAL_IDENTITIES');
  return {...output,scope:{...output.scope,finiteCriterion:'N4-04',finiteCriterionPass:accepted,supportedBackgroundOrders:[1,2],actualMomentIdentitiesVerified:true,numericalGlobalMomentQuadrature:false,allOrdersComplete:false},sourceHash:getPinnedSourceProfile().inputs.assembly.sha256,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; the exact compiled graph digest, root operands and proof traces are retained in results'};
}

async function actualUniformCovariance(input,ctx){
  ctx.checkCancelled?.();
  const data=await actualCovarianceFamilyCertificate(input,ctx);
  const accepted=data.pass===true&&data.scope?.originalN506Complete===true&&data.checks.every(r=>r.pass===true);
  if(!accepted)fail('FAILED','The actual uniform covariance family, source threshold, positive inverse and global partition identity did not pass.');
  const output=result({kind:'ACTUAL_SOURCE_UNIFORM_COVARIANCE_FAMILY',sourceProfile:data.profileId},data,data.checks,
    {axes:[axis('physical covariance component','CATEGORICAL_COMPONENT'),axis('exact global covariance identity residual','EXACT_FUNCTIONAL_IDENTITY'),axis('0')],points:data.uniformFamily.global730.exactResidual.map((value,i)=>({pos:[i,0,0],value,label:i===0?'theta':'z',sourceField:`result.results.uniformFamily.global730.exactResidual[${i}]`})),lines:[],description:'The two exact global covariance identities on the certified source domain, with actual H integrals, a common source q threshold and every slow box counted once.',lostInformation:['Zero denotes a source-bound functional covariance identity on 0<q<qStar; it is not a numerical Navier-Stokes PDE residual.','The displayed finite member exercises the same constructor. Its membership in the certified band domain and its positive weights have not been established.','Finite ordered-integral terms retain a nonzero convergent tail; no signed numerical whole-H quadrature is claimed.']},[],'ACTUAL_SOURCE_UNIFORM_FUNCTIONAL_COVARIANCE_AND_EXACT_GLOBAL_ASSEMBLY');
  return {...output,scope:{...output.scope,finite:false,originalCriterion:'N5-06',originalCriterionPass:accepted,actualUniformHColumnsCertified:true,sourceUniformQStarCertified:true,actualEveryCertifiedBoxPositiveInverse:true,globalEquation730Certified:true,strictPositiveWeightsOnlyOnOpenSupport:true,exactZeroWeightsAtFlatEdges:true,actualNumericalWholeHQuadrature:false,exercisedMemberProvedInCertifiedDomain:false,allSlowDerivativeBoundsComputed:false},sourceHash:getPinnedSourceProfile().inputs.assembly.sha256,sourceHashScope:'PINNED_N3_ACCEPTED_ASSEMBLY; exact source program, all-band domain, positive threshold, H roots, inverse and complete partition are bound in results'};
}

function backgroundRecursion(input,ctx){
  const N=int(input.maxOrder??2,'maxOrder',1,8),orders=[];for(let n=0;n<=N;n++){
    ctx.checkCancelled?.();const pairs=Array.from({length:n+1},(_,i)=>({i,j:n-i,role:n===0?'LEADING':i===0||i===n?'LINEAR_CURRENT_UNKNOWN':'KNOWN_REPAIRED_PREVIOUS_ORDER'}));
    orders.push({n,indices:{backgroundOrder:n,radialTaylorOrder:'independent k',etaDerivativeOrder:'independent m'},lambda:'2*'+n+'*h',physicalPowers:{uTheta:'-A+2*'+n+'*h',uZ:'-A+2*'+n+'*h',rUr:'2*'+n+'*h',pressure:'-2*A+2*'+n+'*h'},axis:{phi:n===0?'phi_0(0,eta)':0,U:n===0?'U_0(0,eta)':0,Pi:n===0?'Pi_0(0,eta), not Pi_0(X,eta)':0},pairs,angular:{left:'2*(X*phi_'+n+'_XX+2*phi_'+n+'_X)',time:'T[-A-1/2+lambda_'+n+'] phi_'+n,transport:pairs.map(p=>`V_${p.i}*(phi_${p.j}_X+phi_${p.j}/X)+U_${p.i}*Z[-A-1/2+lambda_${p.j}]phi_${p.j}`),axialViscosity:n?`-Z[-A-1/2+lambda_${n-1}-D] Z[-A-1/2+lambda_${n-1}] phi_${n-1}`:'0'},axial:{left:'2*(X*U_'+n+'_XX+U_'+n+'_X)',time:`T[-A+lambda_${n}]U_${n}`,transport:pairs.map(p=>`V_${p.i}*U_${p.j}_X+U_${p.i}*Z[-A+lambda_${p.j}]U_${p.j}`),pressure:`Z[-2A+lambda_${n}]Pi_${n}`,axialViscosity:n?`-Z[-A+lambda_${n-1}-D] Z[-A+lambda_${n-1}] U_${n-1}`:'0'},pressure:{derivative:'Pi_'+n+'_X',quadratic:pairs.map(p=>`C^-2*phi_${p.i}*phi_${p.j}`),radialCorrection:n?`-Omega_${n-1}/(2X)`:'0'},omega:{order:n,pairs,formula:`T[lambda_${n}]V_${n}+sum_(i+j=${n})[V_i*(V_j_X-V_j/(2X))+U_i*Z[lambda_j]V_j]-2X*V_${n}_XX`+(n?`-Z[lambda_${n-1}-D]Z[lambda_${n-1}]V_${n-1}`:'')},constructionState:n===0?'ARCHIVED_N3_SOURCE_REFERENCED':'NOT_SOLVED',reuseGuard:n>0?'DO_NOT_USE_FOR_NEXT_ORDER_UNTIL_ALL_FIVE_MOMENTS_ARE_REPAIRED':null});
  }
  const dimensionAudit=sourceDimensionAudit(),directPdeAudit=coefficientIdentityAudit(N),checks=[check('distinct-order-indices',true,'background n, radial k, eta m are separate keys'),check('physical-exponent-shift',dimensionAudit.pass,'Exact powers in the indeterminate h; the accepted source h is never replaced.'),check('direct-original-pde-coefficients',directPdeAudit.pass,'Independent cylindrical physical differentiation equals the source extractor, in exact BigInt rational differential polynomials.'),check('all-convolution-pairs',orders.every(o=>o.pairs.length===o.n+1),'All ordered i+j=n pairs, including both endpoints.'),check('n-minus-one-viscosity-and-pressure',orders.slice(1).every(o=>o.angular.axialViscosity.includes('phi_'+(o.n-1))&&o.pressure.radialCorrection===`-Omega_${o.n-1}/(2X)`),'Original (5.3)-(5.6) order shifts retained.')];
  return result({kind:'SOURCE_COEFFICIENT_RECURSION',sourceProfile:PROFILE.id},{orders,dimensionAudit,directPdeAudit,sourceProfileBinding:getPinnedSourceProfile(),operators:{T:'T_a f=L^-1*(-a*f+D*eta*d_eta(f)+X*d_X(f))',Z:'Z_a f=L^-1*(2*a*eta*f+d*d_eta(f)-2*eta*X*d_X(f))',d:'1-eta^2',L:'1-2*h*eta^2',E:'E_n=sqrt(2X)*phi_n/C'},sourceEquations:['5.1','5.2','5.3','5.4','5.5','5.6'],nextOrderGuard:{required:['same N3 evaluator','common-interval Picard tail','five repaired total moments','stress and pressure reconstruction'],satisfied:false}},checks,{axes:[axis('background order n'),axis('left order i'),axis('right order j')],points:orders.flatMap(o=>o.pairs.map(p=>({pos:[o.n,p.i,p.j],value:p.role==='KNOWN_REPAIRED_PREVIOUS_ORDER'?1:0,label:`n=${o.n}: (${p.i},${p.j}) ${p.role}`}))),lines:[],description:'Ordered coefficient-convolution graph. Categorical indices, not physical space.',lostInformation:['This graph is an executable source expression manifest, not solved coefficient functions.']},['N4-03/04 require a common-interval Picard solve and complete five-moment repairs before the next order.'],'SOURCE_EXPRESSION_MANIFEST');
}

function cutoffSchedule(input,ctx){
  const J=int(input.orders??4,'orders',1,10),P=finite(input.logPower??2,'logPower',0,32),g=finite(input.growth??.4,'growth',1e-8,20),C=input.constants??Array.from({length:J},(_,j)=>Array.from({length:j+2},(_,m)=>10**(j+m+1)));
  if(!Array.isArray(C)||C.length!==J)fail('INVALID_INPUT','constants requires one row per positive order.');
  const log2=ilog(point(2)),rows=[];let previous=0;
  for(let j=1;j<=J;j++){
    if(!Array.isArray(C[j-1])||C[j-1].length!==j+1)fail('INVALID_INPUT','Order j requires constants for every 0<=m<=j.');const cs=C[j-1].map((x,m)=>declaredConstant(x,`C[${j},${m}]`));
    const bBox=iscale(point(g),j/2);
    function evaluate(k){const t=iscale(log2,k),logDerivative=isub(idiv(point(P),iadd(point(1),t)),bBox),monotone=logDerivative[1]<=0,records=cs.map((c,m)=>{const bound=isub(iadd(ilog(point(c)),iscale(ilog(iadd(point(1),t)),P)),iscale(t,bBox));return {m,logBound:bound,targetLog:iscale(log2,-j),pass:bound[1]<=iscale(log2,-j)[0]};});return {k,t,monotone,logDerivative,records,pass:monotone&&records.every(x=>x.pass)};}
    let lo=previous+1,hi=lo;while(!evaluate(hi).pass){ctx.checkCancelled?.();hi*=2;if(hi>10000000)fail('PRECISION_REQUIRED','Cutoff log2 exponent exceeds the installed bound.');}while(lo<hi){const mid=Math.floor((lo+hi)/2);if(evaluate(mid).pass)hi=mid;else lo=mid+1;}const e=evaluate(lo);previous=lo;
    rows.push({j,log2a:lo,aExact:`2^${lo}`,logA:e.t,constantScope:'USER_DECLARED_BOUND_CONSTANTS',constants:cs,inequalities:e.records,allQBoundPassed:e.pass,monotonicDerivative:'P/(1+t)-g*j/2 <= 0 for t>=log(a_j)',monotonicity:{logDerivativeAtBoundary:e.logDerivative,boundaryPassed:e.monotone,logVariable:'t=-log(q)',validFor:'t>=log(a_j)',derivativeDecreasesBecause:'d/dt[P/(1+t)-g*j/2]=-P/(1+t)^2<=0 for P>=0',proofMethod:'OUTWARD_BOUNDARY_INTERVAL_PLUS_MONOTONICITY; NOT_FINITE_Q_SAMPLING'},validFor:`0<q<=2^(-${lo})`});
  }
  const log2q=finite(input.log2q??-rows.at(-1).log2a+.25,'log2q',-1e9,0),active=rows.filter(r=>r.log2a+log2q<0).map(r=>r.j),tailIndex=int(input.tailIndex??Math.min(2,J),'tailIndex',1,J),tail=rows[tailIndex-1],range=input.compactLog2qRange??[log2q,Math.min(0,log2q+.25)],potentials=input.potentials??rows.map(r=>[1/r.j,(-1)**r.j/(r.j+1),r.j/10]),localPotentialSum=evaluateLocalPotentialSum({log2a:rows.map(r=>r.log2a),log2qRange:range,log2q,potentials}),constantLedger=cutoffConstantLedger(rows);
  const blockers=localPotentialSum.activity.prefixComplete?[]:['N4-08 prefix exhausted: higher cutoffs may still be active on this requested compact domain. More of the doubling prefix is needed before exporting a complete local potential sum.'];
  return result({kind:'CONDITIONAL_SHRINKING_CUTOFF_AND_LOCAL_POTENTIAL_OPERATOR'}, {parameters:{orders:J,logPower:P,growth:g},rows,constantLedger,localPotentialSum,defaultPotentialRole:input.potentials?'SUPPLIED_INPUT_POTENTIAL_VALUES':'EXPLICIT_CONSTANT_VECTOR_OPERATOR_PROBE; NOT_N3_COEFFICIENTS',cutoff:{definition:'chi(s)=1 for s<=1/2, chi(s)=0 for s>=1; exact C-infinity exponential transition inside',potentialBeforeCurl:true},query:{log2q,activePositiveOrders:active,inactivePositiveOrders:rows.filter(r=>!active.includes(r.j)).map(r=>r.j),scope:localPotentialSum.activity.prefixComplete?'Exact active prefix; every omitted higher cutoff is identically zero for any doubling continuation.':'Only a finite prefix; a complete locally finite total is not certified.'},tailContract:{J:tailIndex,valid:log2q<-(tail.log2a+1),validOnEntireCompact:range[1]<-(tail.log2a+1),validDomain:`q<2^(-${tail.log2a+1})`,uncomputedHigherConstants:true,sourceInstanceCertified:false,allOrderSourceCertificate:false,sourceEquations:['5.35','5.39','5.42','5.43']}},[check('cutoff-doubling',rows.every((r,i)=>!i||r.log2a>=rows[i-1].log2a+1),'Exact powers of two.'),check('all-q-all-supplied-m',rows.every(r=>r.allQBoundPassed),'Outward interval log inequality on entire q<=1/a_j, not samples.'),check('complete-prefix-or-safe-refusal',localPotentialSum.activity.prefixComplete?localPotentialSum.localSum?.omittedHigherContributionExactlyZero:localPotentialSum.localSum===null,'No omitted positive-order coefficient is silently treated as zero.'),check('actual-cutoff-potential-sum',localPotentialSum.summands.length===J&&localPotentialSum.potentialBeforeCurl,'Each supplied potential is actually multiplied by its C-infinity cutoff before summation.')],{axes:[axis('order j'),axis('log2(a_j)','CATEGORICAL','log2','result.results.rows[*].log2a'),axis('0')],points:rows.map(r=>({pos:[r.j,r.log2a,0],value:r.log2a,label:`a_${r.j}=2^${r.log2a}`})),lines:[{points:rows.map(r=>[r.j,r.log2a,0])}],description:'Conditional scalar cutoff certificate plus an actual locally finite sum of the supplied potentials on an exhaustively covered compact domain.',lostInformation:['The supplied constants and potential values have not been derived from the archived N3 positive-order sequence.','Operator acceptance does not issue an all-order source background or verified source tail bound.']},blockers,'CONDITIONAL_OUTWARD_CUTOFF_AND_LOCALLY_FINITE_POTENTIAL_OPERATOR');
}

function backgroundPicard(input,ctx){
  ctx.checkCancelled?.();const data=backgroundPicardComponent(input);
  return result({kind:'SOURCE_PICARD_OPERATOR_AND_TAIL',sourceProfile:SOURCE_PROFILE_ID},data,[check('source-six-component-block',data.system.blockCertificate.allDiagonalKernelProductsVanish,'Exact sparse products certify A1*D*A1=0 including parameter derivatives.'),check('two-parity-tail',data.tail.pass,'Outward tail for explicitly declared Cn and analytic strip; it does not certify those constants for the actual profile.'),check('common-interval-not-shrunk',data.tail.commonIntervalUnchanged&&data.system.commonDomain.independentOfOrder)],{axes:[axis('Picard iteration k'),axis('log coefficient bound'),axis('0')],points:data.tail.rows.map(r=>({pos:[r.k,r.logTermBound[1],0],value:r.logTermBound[1],label:`k=${r.k}; eta derivatives<=${r.maximumEtaDerivatives}`})),lines:[{points:data.tail.rows.map(r=>[r.k,r.logTermBound[1],0])}],description:'Original (5.8) tail operator with explicitly declared analytic bound inputs.',lostInformation:['No actual source Cn or positive-order coefficient function has been evaluated.']},['N4-03 requires same-profile coefficient/source bounds on the recorded common radial interval and full eta strip.'],'EXACT_SOURCE_OPERATOR_WITH_CONDITIONAL_INTERVAL_TAIL');
}
function backgroundMoments(input,ctx){
  ctx.checkCancelled?.();const data=sourceMomentOperator(input),coefficients=[...data.uSolve.solution,...data.eSolve.solution];
  return result({kind:'SOURCE_FIVE_MOMENT_OPERATOR',sourceProfile:SOURCE_PROFILE_ID},data,[check('two-invertible-source-blocks',data.pass,'The exact source lambda is retained by a confluent U row; directed matrix enclosures avoid a false singularity from lambda underflow.'),check('source-support-ordering',data.bumps.every((b,i,a)=>!i||a[i-1].normalizedSupport[1]<b.normalizedSupport[0])&&data.bumps[0].normalizedSupport[0]>1&&data.bumps.at(-1).normalizedSupport[1]<Math.exp(2.5)),check('next-order-guard',data.nextOrderAllowed===false,'Actual source moment debts are unevaluated, so no corrected coefficient is reused.')],{axes:[axis('correction coefficient index'),axis('normalized coefficient'),axis('0')],points:coefficients.map((b,i)=>({pos:[i,(b[0]+b[1])/2,0],value:(b[0]+b[1])/2,label:`coefficient ${i+1}: [${b.join(', ')}]`})),lines:coefficients.map((b,i)=>({points:[[i,b[0],0],[i,b[1],0]]})),description:'Certified moment operator response to the explicitly supplied normalized debt probe.',lostInformation:['The shown debts are operator inputs, not evaluated moments of the archived background.','Both source lambda and radial normalization remain in the exported exact contract.']},['This operator probe does not construct an actual repaired coefficient. The separate ns.actual-moment-restoration example constructs and verifies actual orders one and two.'],'OUTWARD_INTERVAL_SOURCE_MOMENT_OPERATOR');
}
function backgroundResidual(input,ctx){
  ctx.checkCancelled?.();const data=finiteBackgroundResidual(input.maxOrder??2),rows=Object.entries(data.components).flatMap(([component,values],i)=>values.map((v,j)=>({...v,component,componentIndex:i,termIndex:j})));
  return result({kind:'ORIGINAL_PDE_FINITE_RESIDUAL_POLYNOMIAL',sourceProfile:SOURCE_PROFILE_ID},data,[check('original-pde-coefficient-identity',data.coefficientIdentityAudit.pass),check('uncomputed-constants-not-certified',data.verifiedTailBound===false&&data.CNm===null&&data.Km===null)],{axes:[axis('q exponent coefficient of h'),axis('exact differential monomial count'),axis('equation index')],points:rows.map(r=>({pos:[r.qExponent.hCoefficient,r.termCount,r.componentIndex],value:r.termCount,label:`${r.component}: r^${r.rPower} q^(${r.qExponent.exact}), ${r.termCount} monomials`})),lines:[],description:'Complete finite original-PDE expansion. Counts describe exact symbolic terms, not a numerical residual norm.',lostInformation:['Same-profile coefficients and stress are not yet substituted, so N refinement does not mean measured residual decay.']},['N4-05 requires repaired actual coefficients, R+div(T), independent numerical norm refinement and evaluated CNm/Km.'],'EXACT_FINITE_DIFFERENTIAL_POLYNOMIAL');
}
function torusDerivatives(input,ctx){
  assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID);ctx.checkCancelled?.();const contract=evaluatedDerivativeContract(input.ell??16,input.R??1),gradient=input.gradient??{R:1,Z:2,T:3,theta:4,Y1:5,Y2:6},applied=applyEvaluatedDerivatives(contract,gradient),identity=torusExactIdentityAudit(),rows=Object.entries(applied);
  return result({kind:'SOURCE_EVALUATED_TORUS_DERIVATIVES',sourceProfile:SOURCE_PROFILE_ID},{contract,gradient,gradientRole:'EXPLICIT_OPERATOR_PROBE; NOT_AN_EVALUATED_N3_JET',applied,identity,pointwiseEvaluationNotAverage:true},identity.checks.map(c=>check(c.id,c.pass)),{axes:[axis('derivative index'),axis('operator value on supplied gradient'),axis('0')],points:rows.map(([name,b],i)=>({pos:[i,(b[0]+b[1])/2,0],value:(b[0]+b[1])/2,label:name+': ['+b.join(', ')+']'})),lines:rows.map(([,b],i)=>({points:[[i,b[0],0],[i,b[1],0]]})),description:'Complete chain-rule operators with the actual source covering and exponent; an explicit gradient is used only to display their action.',lostInformation:['This is a derivative operator audit, not a sampled global profile derivative.']},[],'EXACT_QUADRATIC_FIELD_SOURCE_IDENTITIES_AND_OUTWARD_OPERATOR_ACTION');
}

function potentialCurl(input,ctx){
  const radius=finite(input.radius??2,'radius',.1,10),frequency=finite(input.frequency??2,'frequency',.1,20),N=int(input.grid??7,'grid',3,15),points=[],arrows=[];
  // A=(0,0,f(r)sin(kx)); f=(1-r^2/R^2)^4_+. Full curl includes derivatives of f.
  function field(x,y,z,omit=false){const s=1-(x*x+y*y+z*z)/(radius*radius);if(s<=0)return [0,0,0];const f=s**4,fx=-8*x*s**3/(radius*radius),fy=-8*y*s**3/(radius*radius),sn=Math.sin(frequency*x),cs=Math.cos(frequency*x);return omit?[0,-f*frequency*cs,0]:[fy*sn,-fx*sn-f*frequency*cs,0];}
  function div(x,y,z,h,omit=false){return [0,1,2].reduce((sum,k)=>{const a=[x,y,z],b=[x,y,z];a[k]+=h;b[k]-=h;return sum+(field(...a,omit)[k]-field(...b,omit)[k])/(2*h);},0);}
  const errors=[.04,.02,.01].map(h=>{let max=0;for(let i=1;i<=9;i++){const x=radius*(i/15-.3),y=radius*.21,z=radius*.13;max=Math.max(max,Math.abs(div(x,y,z,h)));}return {h,maxCartesianDivergence:max};});
  let negative=0;for(let i=0;i<N;i++)for(let j=0;j<N;j++)for(let k=0;k<N;k++){ctx.checkCancelled?.();const p=[i,j,k].map(t=>radius*(-1+2*t/(N-1))),v=field(...p);if(norm(v)>0){points.push({pos:p,value:norm(v),label:`curl A at (${p.map(x=>x.toFixed(2)).join(',')})`});arrows.push({pos:p,vector:v});}negative=Math.max(negative,Math.abs(div(...p,.001,true)));}
  return result({kind:'CUTOFF_POTENTIAL_CURL_FIXTURE'}, {potential:'A=(0,0,(1-|x|^2/R^2)^4_+ sin(k*x))',regularity:'C3 compact cutoff fixture, deliberately not a C-infinity Borel sum',curlRule:'curl(chi*A)=grad(chi) cross A + chi*curl(A)',errors,omittedCutoffDerivativeMaxDivergence:negative,sourceFormula:'5.45 exact source identity plus an independent Cartesian verification fixture',sourceCutoffCurl:sourceCutoffCurlAudit(1),negativeSourceCutoffCurl:sourceCutoffCurlAudit(1,{omitCutoffDerivative:true}),radius,frequency},[check('exact-source-5.45',sourceCutoffCurlAudit(1).pass,'Exact q-dependent potential cutoff includes the source chi-prime radial term.'),check('mixed-partial-identity',true,'div(curl A)=d_x d_y A_z-d_y d_x A_z=0 on every smooth piece, with matching derivatives through the collar'),check('independent-divergence-refinement',errors[2].maxCartesianDivergence<errors[0].maxCartesianDivergence/8,'Centered Cartesian divergence; expected second-order cancellation.'),check('negative-control-detects-missing-curl-term',negative>1e-3,'Multiplying velocity by cutoff alone loses divergence cancellation.')],{axes:[axis('x','PHYSICAL','fixture length'),axis('y','PHYSICAL','fixture length'),axis('z','PHYSICAL','fixture length')],points,arrows,lines:[],equalScale:true,description:'Actual compact-potential curl, including cutoff derivative terms.',lostInformation:['Finite verification fixture. It is not the same-profile infinite background or pulse from the paper.']},[]);
}

function dyadicCharts(input,ctx){
  if(input.h===undefined||input.sourceProfile!==undefined){
    const data=sourceDyadicObservation(input,ctx);data.actualCoreOverlap=getSourceCoreObservations({ell:input.ellStart??8});data.geometryOnly=false;data.leadingFieldNumericallyEvaluated='ACCEPTED_ETA_ZERO_CORE_SAMPLES_ONLY';data.actualCoreSelection='Separate pinned core samples at eta=0 and fixed overlap tau, not the geometry rows with user R/Z/T.';data.checks.push(check('actual-core-physical-field-overlap',data.actualCoreOverlap.verification.pass,'Both charts independently restore q, Y and the actual normalized physical swirl interval from the accepted N3 core receipt.'));
    return result({kind:'PINNED_N3_DYADIC_CHART',sourceProfile:SOURCE_PROFILE_ID},data,data.checks,{axes:[axis('r','PHYSICAL','length'),axis('z','PHYSICAL','length'),axis('tau=1-t','PHYSICAL','time')],points:data.rows.map(r=>({pos:[r.r,r.z,r.tau],value:r.ell,label:`ell=${r.ell}; actual h; k=${r.k}; cover=${r.covering.index}`})),lines:[{points:data.rows.map(r=>[r.r,r.z,r.tau])}],description:'Actual accepted N3 exponent and frozen labels; physical coordinates have directed enclosures and exact expressions.',lostInformation:['The display is a space-time chart; it does not introduce a third physical spatial axis.','The attached actualCoreOverlap evaluates separate pinned eta-zero core samples; its tau and coordinates are recorded independently of these geometry rows.']},[],'PINNED_SOURCE_OUTWARD_COORDINATE_IDENTITIES');
  }
  if(input.T===0)fail('UNSUPPORTED','tau=0 is the singular boundary, not a computed sample. Use a positive scaled time T.');
  const lo=int(input.ellStart??4,'ellStart',1,900),count=int(input.count??10,'count',1,50),h=finite(input.h??.005,'h',1e-8,.009999),R=finite(input.R??1,'R',.01,8),Z=finite(input.Z??.2,'Z',-8,8),T=finite(input.T??1,'T',Number.MIN_VALUE,8),D=.5-h,rows=[];
  if(lo+count>1000)fail('PRECISION_REQUIRED','Use logarithmic-only coordinates above ell=1000.');
  for(let l=lo;l<lo+count;l++){ctx.checkCancelled?.();const Q=2**(-l),eps=2**(-l*h),k=Math.ceil(eps**(-.5)),r=R*Math.sqrt(Q),z=Z*Q**D,tau=T*Q;if(![Q,eps,r,z,tau].every(Number.isFinite)||Q===0||r===0||tau===0||(Z!==0&&z===0))fail('PRECISION_REQUIRED','The positive physical coordinate underflowed or overflowed binary64. Use a logarithmic-only observation or a less extreme band.');rows.push({ell:l,QExact:`2^(-${l})`,Q,epsilon:eps,epsilonExact:`2^(-${l}*${h})`,Sstar:l*l,R,Z,T,r,z,tau,k,epsilonK2:eps*k*k,overlapAtNextBand:{R:R*Math.SQRT2,Z:Z*2**D,T:2*T,reconstructed:{r:R*Math.SQRT2*Math.sqrt(Q/2),z:Z*2**D*(Q/2)**D,tau:2*T*(Q/2)}}});}
  return result({kind:'DYADIC_CHART_CONTRACT'}, {rows,definitions:{Q:'2^-ell',epsilon:'Q^h',Sstar:'ell^2',R:'r/sqrt(Q)',Z:'z/Q^D',T:'tau/Q',physicalTime:'t=1-tau',auxiliaryTorus:'T^2 is an averaging variable, not a physical spatial dimension'},labelsFrozenDuringDifferentiation:true},[check('overlap-coordinate-identity',rows.every(r=>Math.abs(r.overlapAtNextBand.reconstructed.r-r.r)<1e-12&&Math.abs(r.overlapAtNextBand.reconstructed.z-r.z)<1e-12),'Same physical point in adjacent bands.'),check('carrier-frequency-window',rows.every(r=>r.epsilonK2>=1&&r.epsilonK2<=4),'For 0<epsilon<=1, k=ceil(epsilon^-1/2) gives 1<=epsilon*k^2<=4.')],{axes:[axis('r','PHYSICAL','length'),axis('z','PHYSICAL','length'),axis('tau=1-t','PHYSICAL','time')],points:rows.map(r=>({pos:[r.r,r.z,r.tau],value:r.ell,label:`ell=${r.ell}, Q=${r.QExact}`})),lines:[{points:rows.map(r=>[r.r,r.z,r.tau])}],description:'Physical (r,z,tau) for fixed scaled coordinates in explicitly selected dyadic bands.',lostInformation:['The display is a space-time chart, not three physical spatial axes.','The small fixture h is not substituted into the archived N3 profile.']},['N5-01 formulas and finite overlap check are implemented; original same-profile band selection remains unconnected.']);
}

function sourceCoreCharts(input,ctx){
  ctx.checkCancelled?.();const data=getSourceCoreObservations(input),points=data.samples.flatMap((sample,i)=>sample.chartPair.map((chart,j)=>({pos:[sample.YDisplay,(chart.restoredNormalizedInterval[0]+chart.restoredNormalizedInterval[1])/2,0],value:(chart.restoredNormalizedInterval[0]+chart.restoredNormalizedInterval[1])/2,label:`Y=${sample.sourceY}; chart ell=${chart.ell}; actual Phi interval`,sourceIndex:sample.sourceIndex,sourceField:`results.samples[${i}].chartPair[${j}].restoredNormalizedInterval`,sourceHash:sample.sourceHash,sourcePath:sample.sourcePath}))),lines=data.samples.flatMap(sample=>sample.chartPair.map(chart=>({points:[[sample.YDisplay,chart.restoredNormalizedInterval[0],0],[sample.YDisplay,chart.restoredNormalizedInterval[1],0]]})));
  return result({kind:'ACCEPTED_N3_CORE_PHYSICAL_CHART_OVERLAP',sourceProfile:SOURCE_PROFILE_ID},data,data.verification.checks,{axes:[axis('source Y = Lambda X','SOURCE_COORDINATE','1','result.results.samples[*].sourceY'),axis('normalized Phi interval','NORMALIZED_FIELD_INTERVAL','1','result.results.samples[*].normalizedRoundTripIntervals'),axis('0','CATEGORICAL')],points,lines,description:'Actual accepted eta-zero core intervals independently restored from two source dyadic charts. Error bars retain nonlinear, infinite-tail and arithmetic enclosures.',lostInformation:['Only the five pinned Y samples at eta=0 are evaluated; this is not a complete nonlinear profile-domain field evaluator.','Physical r and velocity have positive symbolic scale factors too small for binary64; plotting uses source Y and normalized Phi, without replacing physical values by zero.','Finite ell=8..900 chart observations do not certify the pulse q_star domain.']},[],'PINNED_ACTUAL_CORE_INTERVALS_AND_EXACT_PHYSICAL_SCALE_IDENTITY');
}

function pulseCurl(input,ctx){
  const data=sourcePulseCurlAudit(input,ctx);return result({kind:'SOURCE_HARMONIC_CURL_DIFFERENTIAL_OPERATOR'},data,data.checks,{axes:[axis('probe R','SCALED_COORDINATE'),axis('complex vector norm','OPERATOR_PROBE_VALUE'),axis('0')],points:data.samples.map((sample,i)=>({pos:[sample.R,sample.fullNorm,0],value:sample.fullNorm,label:`R=${sample.R}; full t+r_m`,sourceField:`results.samples[${i}].fullNorm`,sourceIndex:i})),lines:['tNorm','remainderNorm','fullNorm'].map(name=>({points:data.samples.map(sample=>[sample.R,sample[name],0])})),description:'Original C_m and full curl remainder on explicit smooth verification coefficients. Three series retain t_m, r_m and the full amplitude.',lostInformation:['The displayed coefficient probe is not the actual N3 background or a source growing-mode pulse.','The exact operator identity is verified; same-profile pulse class bounds and global covariance assembly remain separate.']},[],'EXACT_SOURCE_CURL_OPERATOR_WITH_INDEPENDENT_CARTESIAN_CHECKS');
}

function pulseSupport(input,ctx){
  assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID);ctx.checkCancelled?.();const data=sourceSupportAllocation(input.labels),rows=data.rectangles;
  return result({kind:'UNIFORM_SOURCE_PULSE_SUPPORT',sourceProfile:SOURCE_PROFILE_ID},data,[check('uniform-countable-palette',data.palette.pass,'Exact rational centers and one r0 work for all source mesh labels and every covering difference 0..4.'),check('every-source-label-pair',data.pairChecks.every(p=>p.auxiliarySupportsDisjoint),'Displayed pair checks are backed by the uniform full-mesh proof.'),check('normalized-haar-preserved',torusExactIdentityAudit().pass,'All inverse lifts cancel their Jacobians in a normalized Haar average.')],{axes:[axis('auxiliary Y1'),axis('auxiliary Y2'),axis('source label index')],points:rows.map((r,i)=>({pos:[...r.center,i],value:r.color,label:r.id+'; color='+r.color,sourceField:'results.rectangles['+i+'].center',sourceIndex:i})),lines:rows.map(r=>({points:r.corners})),description:'Actual rational source centers and enlarged supports. A single radius is certified for the complete countable source mesh.',lostInformation:['Auxiliary coordinates are not physical spatial dimensions.','Tiny rectangle width is retained in exact tables; support proof does not depend on screen pixels.']},[],'EXACT_RATIONAL_UNIFORM_SOURCE_SUPPORT_CERTIFICATE');
}

function pulseOde(input,ctx){
  const eps=finite(input.epsilon??.04,'epsilon',.0001,1),F=finite(input.F??1,'F',.01,5),FR=finite(input.FR??-3,'FR',-15,-.01),GR=finite(input.GR??0,'GR',-8,8),FZ=finite(input.FZ??0,'FZ',-8,8),GZ=finite(input.GZ??0,'GZ',-8,8),R=finite(input.R??1,'R',.2,5),u=finite(input.uStar??2,'uStar',.1,5),Ls=finite(input.length??8,'length',1,30),steps=int(input.steps??128,'steps',32,1024),sign=input.sign??1;if(steps%2)fail('INVALID_INPUT','steps must be even for the independent refinement comparison.');if(![1,-1].includes(sign))fail('INVALID_INPUT','sign must be +1 or -1.');
  const g=[R*FR,GR],gn=norm(g),N=scale(g,1/gn),Ktan=[-N[1],N[0]],lambda2=-2*F*N[0]*(2*F*N[0]+gn);if(!(lambda2>0))fail('INVALID_INPUT','The local source jet must have positive lambda0^2.');
  const lambda=Math.sqrt(lambda2),c=lambda/(2*F*N[0]),k=Math.ceil(eps**(-.5)),Bs=Math.sqrt(lambda/(eps*k*k*(1+u*u)**1.5)),ptilde=R*Bs*(Ktan[0]-sign*u*g[0]/(Ls*gn*gn)),kp0=Math.round(k*ptilde),kp=kp0||((k*ptilde)<0?-1:1),p=kp/k,pz=Bs*(Ktan[1]-sign*u*g[1]/(Ls*gn*gn)),x0=sign*Bs*u/2;
  const mat=[[0,-2*F,0],[2*F+R*FR,0,0],[GR,0,0]],mv=t=>mat.map(row=>dot(row,t)),normal=v=>[x0-v*(p*FR+pz*GR),p/R,pz-eps*v*(p*FZ+pz*GZ)],np=[-(p*FR+pz*GR),0,-eps*(p*FZ+pz*GZ)];
  function rhs(v,t){const n=normal(v),kt=mv(t),normalTerm=scale(n,(dot(n,kt)-dot(np,t))/dot(n,n)),d=eps*k*k*dot(n,n);return add(add(scale(kt,-1),normalTerm),scale(t,-d));}
  const mid=Ls/2,nm=normal(mid),tangent=norm(nm.slice(1)),Ka=[nm[1]/tangent,nm[2]/tangent],Na=[Ka[1],-Ka[0]],sa=nm[0]/tangent,seed=[1,-sa*Ka[0]+c*Math.sqrt(1+sa*sa)*Na[0],-sa*Ka[1]+c*Math.sqrt(1+sa*sa)*Na[1]],t0=scale(seed,1/norm(seed));
  const integrate=nsteps=>integrateAffineTangentPulse({matrix:mat,normalAtMidpoint:nm,normalDerivative:np,midpoint:mid,length:Ls,steps:nsteps,dampingCoefficient:eps*k*k,initial:t0,checkCancelled:ctx.checkCancelled});
  const fineRun=integrate(steps),coarseRun=integrate(steps/2),fine=fineRun.rows,coarse=coarseRun.rows;let diff=0,directionDiff=0,orth=0,energy=0;
  for(const [i,row]of fine.entries()){const n=normal(row.v),tt=row.t,rt=rhs(row.v,tt),d=eps*k*k*dot(n,n);orth=Math.max(orth,Math.abs(dot(n,tt))/norm(n));energy=Math.max(energy,Math.abs(dot(tt,rt)+dot(tt,mv(tt))+d));if(i%2===0){const old=coarse[i/2];diff=Math.max(diff,Math.abs(old.logScale-row.logScale));directionDiff=Math.max(directionDiff,norm(add(old.t,scale(tt,-1))));}}
  return result({kind:'SOURCE_PROJECTED_PULSE_ODE',datumRole:'FINITE_LOCAL_SHEAR_JET'}, {parameters:{eps,F,FR,GR,FZ,GZ,R,u,Ls,sign,k,kp,p,pz,Bs,lambda0:lambda,c0:c},equations:['7.2','7.3','7.4','7.5','7.6','7.8'],referenceEnvelope:referenceGaussianEnvelope({lambda0:lambda,u,length:Ls,samples:32}),initialConditionRole:'LOCAL_MIDPOINT_UNIT_POLARIZATION_FIXTURE; the actual Lemma 7.4 left growing-mode datum is not yet linked',phaseContract:{phase:'p*theta+pz*Z/epsilon+x0*R-v*(p*F+pz*G)',normal:'[x0-v*(p*FR+pz*GR),p/R,pz-epsilon*v*(p*FZ+pz*GZ)]',labelsFrozen:true,allThreeNormalComponentsRetained:true,missingAxialDerivativeWouldChangeNormal:Math.abs(eps*(p*FZ+pz*GZ))>0},samples:fine.map(x=>({...x,nPhi:normal(x.v),logAmplitude:x.logScale})),diagnostics:{...fineRun.diagnostics,maxRelativeOrthogonality:orth,maxEnergyIdentityResidual:energy,maxStepRefinementLogDifference:diff,maxStepRefinementDirectionDifference:directionDiff,refinement:{fineStepsPerHalf:steps,coarseStepsPerHalf:steps/2,comparedSamples:coarse.length,interpretation:'Empirical step comparison only; no rigorous integration-error bound.'},rigorousSolutionErrorBound:null},integrationMethod:fineRun.method,normalization:'||t(Ls/2)||=1; normalized tangent coordinates plus analytic scalar-damping integral and log envelope avoid silent underflow and backwards normal drift',sourceJetScope:'Local frozen values supplied explicitly. Uniform N3 profile bounds, slow derivatives and Gaussian constants are not inferred.'},[check('source-Bs-squared-definition',Math.abs(eps*k*k*Bs*Bs*(1+u*u)**1.5-lambda)<1e-10,'Source (7.2) specifies Bs squared, not Bs; a missing square root is rejected.'),check('reference-Gaussian-envelope',referenceGaussianEnvelope({lambda0:lambda,u,length:Ls}).pass,'The continuous reference P bound is certified for the explicit parameters; it is not a bound for the actual local ODE solution.'),check('integer-angular-frequency',Number.isInteger(kp)&&kp!==0,'k*p is the frozen nonzero integer kp.'),check('epsilon-frequency-window',eps*k*k>=1&&eps*k*k<=4),check('normal-constraint',orth<1e-10,'Explicit orthonormal tangent-frame reconstruction preserves nPhi dot t=0 up to binary64 rounding.'),check('energy-identity',energy<1e-8,'1/2 d||t||^2=-t dot Kt-d||t||^2, checked against the original Cartesian right-hand side.'),check('tangent-reconstruction-equation',fineRun.diagnostics.maxReconstructedRhsRelativeResidual<1e-10,'Independent Cartesian RHS equals E*yPrime+EPrime*y-d*E*y.'),check('step-refinement',diff<.05&&directionDiff<.01,'Both log amplitude and normalized direction are compared at common samples; this is not a certified integration-error bound.')],{axes:[axis('pulse coordinate v'),axis('log amplitude','CATEGORICAL','log norm'),axis('0')],points:fine.map(r=>({pos:[r.v,r.logScale,0],value:r.logScale,label:`v=${r.v.toFixed(4)}; log amplitude=${r.logScale.toPrecision(6)}`})),lines:[{points:fine.map(r=>[r.v,r.logScale,0])}],description:'Actual integrated projected ODE (7.5)-(7.6) in a parallel tangent frame, for the supplied local shear datum.',lostInformation:['Log amplitude is retained when an ordinary float would underflow.','No all-label Gaussian bound or certified ODE error is claimed.']},['N5-04/05 same-profile phase/frame bounds and rigorous ODE error/Gaussian bounds remain open for this executable module.']);
}

function covariance(input,ctx){
  const target=input.target??[-1,0],amplitude=finite(input.amplitude??1,'amplitude',.001,100),area=finite(input.liftedArea??1/64,'liftedArea',.0001,1/64),eps=finite(input.epsilon??.1,'epsilon',.0001,1);if(!Array.isArray(target)||target.length!==2)fail('INVALID_INPUT','target is a 2-component stress.');target.forEach((x,i)=>finite(x,'target '+i,-100,100));
  const tplus=[1,-1,1],tminus=[1,-1,-1],normal=[1,1,0],angularFactor=.5,jac=4-2*Math.SQRT2,c=amplitude*amplitude*area*angularFactor*jac,H=[[-c,-c],[c,-c]],det=2*c*c,y=[(-c*target[0]+c*target[1])/det,(-c*target[0]-c*target[1])/det],reconstructed=[H[0][0]*y[0]+H[0][1]*y[1],H[1][0]*y[0]+H[1][1]*y[1]],samples=128,integral=Array.from({length:samples},(_,i)=>Math.cos(2*Math.PI*i/samples)**2).reduce((a,b)=>a+b,0)/samples;
  const rows=[{family:'+',polarization:tplus,weight:y[0],covariance:H.map(r=>r[0])},{family:'-',polarization:tminus,weight:y[1],covariance:H.map(r=>r[1])}];
  return result({kind:'TWO_FAMILY_FINITE_COVARIANCE',datumRole:'EXPLICIT_LOCAL_POLARIZATION_FIXTURE'},{Hcov:H,determinant:det,weights:y,target,reconstructed,epsilonScaledStress:reconstructed.map(v=>eps*v),angularAverage:{exact:'1/2',discreteQuadrature:integral},haar:{Jg:[[3,1],[1,5]],det:14,...sourceTorusGeometry().haar,jacobian:'4-2*sqrt(2)',liftedArea:area,liftedAreaMeaning:'integral chi(xi)^2*psi(eta)^2 dxi deta on one injective band rectangle; all covering lifts are included globally'},families:rows,normal,cosineHalfFactor:angularFactor,sameLabelHarmonicsRetained:true,globalProfileMatching:false},[check('transverse-polarizations',dot(normal,tplus)===0&&dot(normal,tminus)===0),check('positive-two-family-weights',y.every(v=>v>0),'Cone failure is retained if either weight is nonpositive.'),check('covariance-matching',reconstructed.every((v,i)=>Math.abs(v-target[i])<1e-10)),check('angular-half-factor',Math.abs(integral-.5)<1e-12),check('negative-missing-half',Math.abs(2*reconstructed[0]-target[0])+Math.abs(2*reconstructed[1]-target[1])>1e-6)],{axes:[axis('stress r-theta','CATEGORICAL','stress'),axis('stress r-z','CATEGORICAL','stress'),axis('family index')],points:rows.map((r,i)=>({pos:[r.covariance[0],r.covariance[1],i],value:r.weight,label:`family ${r.family}, weight ${r.weight}`})).concat([{pos:[target[0],target[1],2],value:0,label:'target'}]),lines:rows.map((r,i)=>({points:[[0,0,i],[r.covariance[0],r.covariance[1],i]]})),description:'Two actual polarization covariance columns, their weights and the supplied target.',lostInformation:['Finite constant-polarization fixture; no matching to the archived nonconstant N3 stress has been proved.','Original pulse cutoff/curl remainders must be added before global residual use.']},['N5-06 requires the actual two pulse covariances and source-stress assembly; the generic N5-07 curl operator is verified separately.']);
}

function pulseTail(input,ctx){
  const c=finite(input.c??.2,'c',1e-6,10),C=finite(input.C??2,'C',0,20),M=finite(input.derivativeLoss??2,'derivativeLoss',0,100),N=int(input.targetPower??4,'targetPower',0,100),start=int(input.ellStart??8,'ellStart',1,10000),count=int(input.count??80,'count',1,500),rows=[],ln2=ilog(point(2));
  for(let ell=start;ell<start+count;ell++){ctx.checkCancelled?.();const bound=iadd(isub(imul(iscale(ln2,ell),iadd(point(M),point(N))),iscale(point(c),ell*ell)),iscale(ilog(point(ell)),2*C));rows.push({ell,Sstar:ell*ell,logBound:bound,relativeToQPower:N,dominationPassed:bound[1]<=0,machineUnderflow:bound[1]<Math.log(Number.MIN_VALUE)});}
  const derivative=ell=>iadd(isub(imul(iadd(point(M),point(N)),ln2),iscale(point(c),2*ell)),idiv(iscale(point(C),2),point(ell)));const threshold=rows.find(r=>r.logBound[1]<=0&&derivative(r.ell)[1]<0),monotone=threshold?{ellAtLeast:threshold.ell,logDerivativeUpper:derivative(threshold.ell)[1],derivativeDecreases:true}:null;
  const cutoffRemainder=evaluatePulseCutoffRemainder(input.residualJet??defaultTailJet()),envelopeLedger={scope:'DECLARED_GAUSSIAN_AND_DERIVATIVE_LOSS_PREMISES',inputPaths:['results.parameters.c','results.parameters.C','results.parameters.M'],sourceInstanceCertified:false,allOrderSourceCertificate:false,actualPulseGaussianBound:null,finiteJetValuesDoNotProveTheEnvelope:true,localJetNotBoundToSpecificEll:true,residualVsEnvelopeComparisonPerformed:false,requiredPremise:'On the cutoff collar, the chosen fixed derivative of the full (1-psi)*f_m+psi_prime*t_m is bounded by q^(-M)*Sstar^C*exp(-c*Sstar).'};
  return result({kind:'CONDITIONAL_CUTOFF_RESIDUAL_AND_FIXED_ORDER_LOG_TAIL'}, {parameters:{c,C,M,N},formula:'-c*ell^2+(M+N)*ell*log(2)+2*C*log(ell)',rows,cutoffRemainder,envelopeLedger,uniformAfterThreshold:monotone,allDerivativeOrdersInstantiated:false,retainedRemainder:'(1-psi)*f_m + psi_prime*t_m',constantScope:'Declared positive Gaussian constant and polynomial loss; not derived from the original ODE.'},[check('retains-nonzero-log-tail',rows.every(r=>Number.isFinite(r.logBound[0])&&Number.isFinite(r.logBound[1])),'No positive tail is converted to an exact zero.'),check('full-cutoff-residual-jets',cutoffRemainder.allTermsRetained&&cutoffRemainder.rows.length===cutoffRemainder.inputJet.derivativeOrder+1,'Every supplied forcing/amplitude/cutoff derivative participates in the actual complex interval residual.'),check('fixed-order-tail-threshold',Boolean(monotone),'The log expression decreases beyond the displayed threshold; no all-order shortcut.')],{axes:[axis('dyadic ell'),axis('log(tail / q^N)','CATEGORICAL','log ratio'),axis('0')],points:rows.map(r=>({pos:[r.ell,r.logBound[1],0],value:r.logBound[1],label:`ell=${r.ell}: log upper ${r.logBound[1]}`})),lines:[{points:rows.map(r=>[r.ell,r.logBound[1],0])}],description:'Conditional fixed-order flat-tail exponent with the full supplied cutoff residual jet retained and evaluated.',lostInformation:['The supplied Gaussian envelope remains a premise; its validity for the actual source pulse is not inferred from these finite jets.','Fixed m,N are checked; an all-order source construction is not issued.']},monotone?[]:['The displayed finite label window contains no certified all-later-label threshold. Extend its end to assess the declared fixed-order envelope.'],'CONDITIONAL_OUTWARD_RESIDUAL_JET_AND_FIXED_ORDER_BOUND');
}

const INPUT_FIELDS={
  'ns.actual-covariance-sensitivity':['sourceProfile','ellExact','slowCoordinate','derivativeOrder','terms'],
  'ns.actual-pulse-jet':['sourceProfile','ellExact','terms'],
  'ns.actual-full-curl':['sourceProfile','ellExact','terms'],
  'ns.actual-pulse-sensitivity':['sourceProfile','anchorOrder','ellExact','slowCoordinate','derivativeOrder','terms'],
  'ns.actual-core-evaluation':['sourceProfile','Y','eta','radialOrder','etaOrder','bits','degree'],
  'ns.actual-global-source':['sourceProfile','eta','xi'],
  'ns.actual-continuation':['sourceProfile','eta','XInterval','bits','degree'],
  'ns.actual-background':['sourceProfile','radialDegree','tailBits'],
  'ns.actual-picard-acceptance':['sourceProfile','tailBits'],
  'ns.actual-moment-restoration':['sourceProfile','terms','bits','etaOrder','heatIterations'],
  'ns.actual-uniform-covariance':['sourceProfile','anchorOrder','ellExact','terms'],
  'ns.actual-pulse-amplitude':['sourceProfile','y','sign','steps'],
  'ns.actual-covariance-matching':['sourceProfile','y','cells','cutoffCells','bits'],
  'ns.actual-residual-order':['sourceProfile','bits','mesh','maxDerivativeOrder','timeIndices'],
  'ns.actual-mean-pulse':['sourceProfile','y','eta','s','order','samples'],
  'ns.background-recursion':['maxOrder'],
  'ns.background-picard':['sourceProfile','n','Cn','a','rho','rhoPrime','terms'],
  'ns.background-moments':['sourceProfile','n','normalizedDebts'],
  'ns.background-residual':['maxOrder'],
  'ns.background-cutoffs':['orders','logPower','growth','constants','log2q','tailIndex','compactLog2qRange','potentials'],
  'ns.potential-curl':['radius','frequency','grid'],
  'ns.dyadic-charts':['sourceProfile','ellStart','count','h','R','Z','T'],
  'ns.source-core-charts':['sourceProfile','ell'],
  'ns.torus-derivatives':['sourceProfile','ell','R','gradient'],
  'ns.pulse-support':['sourceProfile','labels'],
  'ns.pulse-ode':['epsilon','F','FR','GR','FZ','GZ','R','uStar','length','steps','sign'],
  'ns.pulse-covariance':['target','amplitude','liftedArea','epsilon'],
  'ns.pulse-curl':['ell'],
  'ns.pulse-tail':['c','C','derivativeLoss','targetPower','ellStart','count','residualJet']
};
// These are installed finite-component domains, not uniform domains for the paper's profile.
const NUMERIC_FIELDS={
  'ns.actual-covariance-sensitivity':{terms:[0,0,true]},
  'ns.actual-pulse-jet':{terms:[0,1,true]},
  'ns.actual-full-curl':{terms:[0,0,true]},
  'ns.actual-pulse-sensitivity':{anchorOrder:[1,2,true],terms:[0,2,true]},
  'ns.actual-core-evaluation':{radialOrder:[0,2,true],etaOrder:[0,2,true],bits:[96,512,true],degree:[32,64,true]},
  'ns.actual-global-source':{eta:[-1,1]},
  'ns.actual-continuation':{bits:[96,512,true],degree:[32,64,true]},
  'ns.actual-background':{radialDegree:[1,6,true],tailBits:[16,4096,true]},
  'ns.actual-picard-acceptance':{tailBits:[16,4096,true]},
  'ns.actual-moment-restoration':{terms:[0,2,true],bits:[16,4096,true],etaOrder:[0,2,true],heatIterations:[0,2,true]},
  'ns.actual-uniform-covariance':{anchorOrder:[1,2,true],terms:[0,2,true]},
  'ns.actual-pulse-amplitude':{y:[.25,4.75],sign:[-1,1,true],steps:[8,256,true]},
  'ns.actual-covariance-matching':{y:[.25,4.75],cells:[64,512,true],cutoffCells:[64,512,true],bits:[16,4096,true]},
  'ns.actual-residual-order':{bits:[96,512,true],mesh:[4,32,true],maxDerivativeOrder:[0,6,true]},
  'ns.actual-mean-pulse':{y:[.25,4.75],eta:[-1,1],s:[.5,2],order:[1,3,true],samples:[4,256,true]},
  'ns.background-recursion':{maxOrder:[1,8,true]},
  'ns.background-picard':{n:[1,8,true],Cn:[1e-8,1e4],a:[1e-8,4],rho:[.0002,4],rhoPrime:[.0001,4],terms:[2,512,true]},
  'ns.background-moments':{n:[1,8,true]},
  'ns.background-residual':{maxOrder:[1,4,true]},
  'ns.background-cutoffs':{orders:[1,10,true],logPower:[0,32],growth:[1e-8,20],log2q:[-1e9,0],tailIndex:[1,10,true]},
  'ns.potential-curl':{radius:[.1,10],frequency:[.1,20],grid:[3,15,true]},
  'ns.dyadic-charts':{ellStart:[1,900,true],count:[1,50,true],h:[1e-8,.009999],R:[.01,8],Z:[-8,8],T:[0,8]},
  'ns.source-core-charts':{ell:[8,900,true]},
  'ns.torus-derivatives':{ell:[8,900,true],R:[.01,8]},
  'ns.pulse-support':{},
  'ns.pulse-ode':{epsilon:[.0001,1],F:[.01,5],FR:[-15,-.01],GR:[-8,8],FZ:[-8,8],GZ:[-8,8],R:[.2,5],uStar:[.1,5],length:[1,30],steps:[32,1024,true],sign:[-1,1,true]},
  'ns.pulse-covariance':{amplitude:[.001,100],liftedArea:[.0001,1/64],epsilon:[.0001,1]},
  'ns.pulse-curl':{ell:[4,20,true]},
  'ns.pulse-tail':{c:[1e-6,10],C:[0,20],derivativeLoss:[0,100],targetPower:[0,100,true],ellStart:[1,10000,true],count:[1,500,true]}
};
function finiteTree(value,path='input'){
  if(typeof value==='number'&&!Number.isFinite(value))fail('INVALID_INPUT',path+' must be finite.');
  if(Array.isArray(value))value.forEach((v,i)=>finiteTree(v,path+'['+i+']'));
  else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))finiteTree(v,path+'.'+k);
}
function exactPointRange(value,name,lower,upper){
  const raw=typeof value==='number'&&Number.isSafeInteger(value)?String(value):value;
  if(typeof raw!=='string'||raw.length>2500||!/^[-+]?\d+(\/\d+)?$/.test(raw))fail('INVALID_INPUT',name+' requires an exact rational string or safe integer.');
  let [n,d]=raw.split('/').map(BigInt);d??=1n;if(d===0n)fail('INVALID_INPUT',name+' has a zero denominator.');
  let a=n<0n?-n:n,b=d;while(b){const c=a%b;a=b;b=c;}n/=a;d/=a;
  if([n,d].some(x=>(x<0n?-x:x).toString(2).length>4096))fail('BUDGET_EXCEEDED',name+' exceeds the 4096-bit exact coordinate budget.');
  if(n*lower[1]<lower[0]*d||n*upper[1]>upper[0]*d)fail('INVALID_INPUT',name+' is outside the installed actual-source interval.');
}
export function validate(kind,input={}){
  try{
    if(!KINDS.includes(kind))fail('UNSUPPORTED','This N4/N5 adapter is not installed.');
    if(!input||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','Input must be an object.');
    const unknown=Object.keys(input).filter(k=>!INPUT_FIELDS[kind].includes(k));if(unknown.length)fail('INVALID_INPUT','Unknown '+kind+' input fields: '+unknown.join(', ')+'.');
    finiteTree(input);
    if(['ns.actual-uniform-covariance','ns.actual-pulse-sensitivity'].includes(kind)){
      if(input.anchorOrder!==undefined&&input.ellExact!==undefined)fail('INVALID_INPUT','Choose anchorOrder or ellExact, not both.');
      if(input.ellExact!==undefined){
        if(typeof input.ellExact!=='string'||input.ellExact.length>2048||!/^[0-9]+$/.test(input.ellExact)||BigInt(input.ellExact)<1n)fail('INVALID_INPUT','ellExact requires a positive exact integer string.');
        if(BigInt(input.ellExact)>128n)fail('BUDGET_EXCEEDED','The installed finite graph budget supports ellExact up to128. The all-band construction and its domain are recorded separately; missing coefficients are never set to zero.');
      }
    }
    if(kind==='ns.actual-pulse-sensitivity'){
      if(!['R','Z','T'].includes(input.slowCoordinate??'R'))fail('UNSUPPORTED','Choose a first slow R, Z or T derivative at fixed labels.');
      if((input.derivativeOrder??1)!==1)fail('UNSUPPORTED','Only first slow derivatives are installed; higher and mixed derivatives require a separate source contract.');
      if(input.anchorOrder!==undefined||(input.ellExact??'1')!=='1')fail('BUDGET_EXCEEDED','This browser release materializes the measured original ell=1 source graph. Other bands and anchors need a separately measured memory budget. No source coefficient is omitted.');
      if((input.terms??0)!==0)fail('BUDGET_EXCEEDED','This browser release retains the complete convergent derivative expression with a zero-term display prefix and its nonzero tail. Materializing positive terms exceeds the measured memory budget.');
    }
    if(DIFFERENTIAL_KINDS.includes(kind)){
      if((input.ellExact??'1')!=='1')fail('BUDGET_EXCEEDED','This differential release materializes the original ell=1 source. No higher-band positivity follows from this display choice.');
      if(kind==='ns.actual-covariance-sensitivity'&&(!['R','Z','T'].includes(input.slowCoordinate??'R')||(input.derivativeOrder??1)!==1))fail('UNSUPPORTED','The covariance adapter constructs one first R/Z/T derivative.');
    }
    if(kind==='ns.actual-covariance-matching')for(const field of ['cells','cutoffCells'])if(input[field]!==undefined&&![64,128,256,512].includes(input[field]))fail('INVALID_INPUT','Actual covariance cells must be 64,128,256 or 512.');
    if(kind==='ns.actual-pulse-amplitude'&&((input.sign!==undefined&&![1,-1].includes(input.sign))||(input.steps!==undefined&&(input.steps&(input.steps-1))!==0)))fail('INVALID_INPUT','Actual pulse sign must be +1 or -1 and steps must be 8,16,32,64,128 or 256.');
    if(kind==='ns.actual-residual-order'){
      if(input.mesh!==undefined&&![4,8,16,32].includes(input.mesh))fail('INVALID_INPUT','Use mesh 4,8,16 or 32 on the unchanged fixed source domain.');
      if(input.timeIndices!==undefined&&(!Array.isArray(input.timeIndices)||!input.timeIndices.length||input.timeIndices.length>8||input.timeIndices.some((v,i)=>!Number.isSafeInteger(v)||v<1||v>256||(i&&v<=input.timeIndices[i-1]))))fail('INVALID_INPUT','timeIndices must be one to eight strictly increasing integers from 1 to 256.');
    }
    if(input.sourceProfile!==undefined)assertSourceProfile(input.sourceProfile);
    for(const[k,[lo,hi,integer]]of Object.entries(NUMERIC_FIELDS[kind]))if(input[k]!==undefined)(integer?int:finite)(input[k],k,lo,hi);
    if(kind==='ns.actual-core-evaluation'){
      exactPointRange(input.Y??'4','Y',[0n,1n],[41n,10n]);
      const eta=input.eta===undefined?{kind:'RHO_SCALED',value:'1/8'}:input.eta;
      if(!eta||typeof eta!=='object'||Array.isArray(eta)||Object.keys(eta).some(k=>!['kind','value'].includes(k))||!['RHO_SCALED','J_SCALED','DIRECT_RATIONAL'].includes(eta.kind))fail('INVALID_INPUT','eta requires a supported exact chart {kind,value}.');
      exactPointRange(eta.value,'eta.value',eta.kind==='RHO_SCALED'?[-1n,4n]:[-1n,1n],eta.kind==='RHO_SCALED'?[1n,4n]:[1n,1n]);
    }
    if(kind==='ns.actual-global-source'&&input.xi!==undefined){
      if(!Array.isArray(input.xi)||input.xi.length<1||input.xi.length>16)fail('INVALID_INPUT','xi requires one to sixteen actual outer coordinates.');
      input.xi.forEach((v,i)=>finite(v,'xi['+i+']',1/50,10));
    }
    if(kind==='ns.actual-continuation'){
      exactPointRange(input.eta??'1/4','eta',[-1n,1n],[1n,1n]);
      const ends=input.XInterval??['1','100'];
      if(!Array.isArray(ends)||ends.length!==2)fail('INVALID_INPUT','XInterval requires two exact radial endpoints.');
      ends.forEach((v,i)=>exactPointRange(v,'XInterval['+i+']',[1n,1024n],[110n,1n]));
      const [[a,b=1n],[c,d=1n]]=ends.map(x=>String(x).split('/').map(BigInt));
      if(a*d>c*b)fail('INVALID_INPUT','The exact radial interval endpoints must be ordered.');
    }
    if(kind==='ns.background-cutoffs'){
      const J=input.orders??4;if(input.tailIndex!==undefined&&input.tailIndex>J)fail('INVALID_INPUT','tailIndex must not exceed the supplied positive orders.');
      if(input.constants!==undefined){if(!Array.isArray(input.constants)||input.constants.length!==J)fail('INVALID_INPUT','constants requires one row per positive order.');input.constants.forEach((row,j)=>{if(!Array.isArray(row)||row.length!==j+2)fail('INVALID_INPUT','Order j requires a constant for every 0<=m<=j.');row.forEach((c,m)=>declaredConstant(c,`constants[${j}][${m}]`));});}
    }
    if(kind==='ns.dyadic-charts'){
      const source=input.h===undefined||input.sourceProfile!==undefined;
      if(input.sourceProfile!==undefined&&input.h!==undefined)fail('INVALID_INPUT','The pinned source h cannot be replaced by an input parameter.');
      if(input.T===0&&(!source||input.Z===undefined||input.Z===0))fail('UNSUPPORTED','The singular boundary T=Z=0 has no source value. A one-sided nonzero-Z chart must be explicit.');
      const ell=int(input.ellStart??(source?8:4),'ellStart',source?8:1,900),count=int(input.count??(source?14:10),'count',1,50),T=finite(input.T??1,'T',0,8);
      if(ell+count-1>(source?900:1000)||T>0&&T*2**(-(ell+count-1))===0)fail('PRECISION_REQUIRED','Requested dyadic band requires a logarithmic-only observation; binary64 physical coordinates underflow.');
    }
    if(kind==='ns.pulse-ode'){
      if((input.steps??128)%2)fail('INVALID_INPUT','steps must be even.');if(![1,-1].includes(input.sign??1))fail('INVALID_INPUT','sign must be +1 or -1.');
      const F=input.F??1,g0=(input.R??1)*(input.FR??-3),g1=input.GR??0,gn=Math.hypot(g0,g1),n0=g0/gn;if(!(-2*F*n0*(2*F*n0+gn)>0))fail('INVALID_INPUT','The local source jet must have positive lambda0^2.');
    }
    if(kind==='ns.pulse-support'&&input.labels!==undefined)sourceSupportAllocation(input.labels);
    if(kind==='ns.torus-derivatives'&&input.gradient!==undefined){if(!input.gradient||typeof input.gradient!=='object'||Array.isArray(input.gradient)||Object.keys(input.gradient).some(k=>!['R','Z','T','theta','Y1','Y2'].includes(k))||['R','Z','T','theta','Y1','Y2'].some(k=>typeof input.gradient[k]!=='number'||!Number.isFinite(input.gradient[k])))fail('INVALID_INPUT','gradient must contain every independent-variable derivative R,Z,T,theta,Y1,Y2.');}
    if(kind==='ns.background-moments'&&input.normalizedDebts!==undefined){if(!Array.isArray(input.normalizedDebts)||input.normalizedDebts.length!==5)fail('INVALID_INPUT','Five normalized operator-probe debts are required.');input.normalizedDebts.forEach((x,i)=>finite(x,'debt '+i,-1e4,1e4));}
    if(kind==='ns.background-picard'&&(input.rhoPrime??.25)>=(input.rho??.5))fail('INVALID_INPUT','Use 0<rhoPrime<rho.');
    if(kind==='ns.pulse-covariance'&&input.target!==undefined){if(!Array.isArray(input.target)||input.target.length!==2)fail('INVALID_INPUT','target is a 2-component stress.');input.target.forEach((x,i)=>finite(x,'target '+i,-100,100));}
    return {ok:true};
  }catch(e){return {ok:false,code:e.code||'INVALID_INPUT',errors:[e.message]};}
}
function precisionContract(kind,value={},input={}){
  if(!value||typeof value!=='object'||Array.isArray(value))fail('INVALID_INPUT','precision must be an object.');
  const unknown=Object.keys(value).filter(k=>!['mode','bits'].includes(k));if(unknown.length)fail('UNSUPPORTED','This finite NS adapter does not implement requested tolerance/precision fields: '+unknown.join(', ')+'.');
  if(DIFFERENTIAL_KINDS.includes(kind)){
    if(!['AUTO','EXACT_CONSTRUCTIVE'].includes(value.mode??'AUTO')||value.bits!==undefined)fail('PRECISION_REQUIRED','These are exact differential source expressions and functional tails; an evaluated numerical enclosure at requested bits is not installed.');
    return {requested:value,arithmetic:'EXACT_ACTUAL_SOURCE_DIFFERENTIAL_EXPRESSIONS',arithmeticBits:null,fullResultExact:false,exactAlgebra:true,slowDerivativeOrder:kind==='ns.actual-covariance-sensitivity'?1:2,numericalWholeSourceEvaluation:false,finiteTermsAreNotTheSolution:true,formalPass:false};
  }
  if(kind==='ns.actual-pulse-sensitivity'){
    if(!['AUTO','EXACT_CONSTRUCTIVE'].includes(value.mode??'AUTO')||value.bits!==undefined)fail('PRECISION_REQUIRED','Use AUTO or EXACT_CONSTRUCTIVE without bits: the result is an exact source first-variation program and nonzero convergent tail, not numerical derivative quadrature.');
    return {requested:value,arithmetic:'EXACT_SOURCE_CHAIN_RULE_AND_CONVERGENT_BLOCK_VOLTERRA_EXPRESSIONS',arithmeticBits:null,fullResultExact:false,exactAlgebra:true,slowDerivativeOrder:1,numericalSensitivityQuadrature:false,finiteTermsAreNotTheSolution:true,formalPass:false};
  }
  if(kind==='ns.actual-uniform-covariance'){
    if(!['AUTO','EXACT_CONSTRUCTIVE'].includes(value.mode??'AUTO'))fail('PRECISION_REQUIRED','Use AUTO or EXACT_CONSTRUCTIVE for the exact source family and convergent integral expressions. Numerical whole-H quadrature is not installed.');
    if(value.bits!==undefined)fail('UNSUPPORTED','This certificate has no requested bit precision. terms changes the displayed finite Volterra prefix while its nonzero factorial tail remains.');
    return {requested:value,arithmetic:'EXACT_BIGINT_RATIONAL_IDENTITIES_AND_CONVERGENT_FUNCTION_OPERATIONS',arithmeticBits:null,fullResultExact:false,exactAlgebra:true,finiteTermsAreNotTheSolution:true,actualNumericalWholeHQuadrature:false,exercisedMemberProvedInCertifiedDomain:false,displayArithmetic:'EXACT_SOURCE_EXPRESSIONS_AND_CERTIFIED_DOMAIN_IDENTITIES',formalPass:false};
  }
  if(kind==='ns.actual-moment-restoration'){
    const mode=value.mode??'AUTO',targetBits=input.bits??value.bits??128;
    if(!['AUTO','EXACT_CONSTRUCTIVE'].includes(mode))fail('PRECISION_REQUIRED','Use AUTO or EXACT_CONSTRUCTIVE for exact function construction and algebraic identities. Numerical moment quadrature is not installed for this certificate.');
    int(targetBits,'analytic tail target bits',16,4096);
    if(value.bits!==undefined&&value.bits!==targetBits)fail('INVALID_INPUT','precision.bits and input.bits must agree on the analytic Picard-tail target.');
    return {requested:value,arithmetic:'EXACT_BIGINT_RATIONAL_IDENTITIES_AND_CONVERGENT_FUNCTION_OPERATIONS',arithmeticBits:null,analyticTailTargetBits:targetBits,fullResultExact:false,exactAlgebra:true,finiteTermsAreNotTheSolution:true,numericalGlobalMomentQuadrature:false,displayArithmetic:'SYMBOLIC_SOURCE_ENDPOINT_ORDER_AND_EXACT_TABLES',formalPass:false};
  }
  if(['ns.actual-core-evaluation','ns.actual-continuation','ns.actual-residual-order'].includes(kind)){
    const mode=value.mode??'AUTO',bits=input.bits??value.bits??(kind==='ns.actual-residual-order'?128:192);
    if(!['AUTO','DIRECTED_BIGINT'].includes(mode))fail('PRECISION_REQUIRED','The actual source calculation uses directed BigInt intervals; select AUTO or DIRECTED_BIGINT.');
    int(bits,'precision.bits',96,512);
    if(value.bits!==undefined&&value.bits!==bits)fail('INVALID_INPUT','precision.bits and input.bits must agree for the actual source calculation.');
    return {requested:value,arithmeticBits:bits,arithmetic:'DIRECTED_BIGINT_DYADIC_INTERVAL',coordinateInputMaximumBits:4096,displayArithmetic:'OUTWARD_BINARY64_FOR_DISPLAY_ONLY',fullResultExact:false,analyticErrorsRetained:true,rigorousOdeSolutionErrorBound:null,formalPass:false};
  }
  const mode=value.mode??'FLOAT64',bits=value.bits??53;
  if(kind==='ns.actual-covariance-matching'&&value.mode==='DIRECTED_BIGINT')fail('PRECISION_REQUIRED','The covariance quadrature uses outward binary64. input.bits controls only the exact source target enclosure exponent.');
  if(!['AUTO','FLOAT64','OUTWARD_FLOAT64'].includes(mode))fail('PRECISION_REQUIRED','Exact, arbitrary precision and FORMAL labels cannot replace the installed binary64 numerical/finite-expression backend.');
  if(!Number.isSafeInteger(bits)||bits<1)fail('INVALID_INPUT','precision.bits must be a positive safe integer.');
  if(bits>53)fail('PRECISION_REQUIRED','This NS backend has 53-bit binary64 arithmetic; no higher-precision solver is installed.');
  const outward=['ns.actual-global-source','ns.actual-continuation','ns.actual-background','ns.actual-picard-acceptance','ns.actual-pulse-amplitude','ns.actual-covariance-matching','ns.actual-mean-pulse','ns.background-cutoffs','ns.pulse-tail','ns.background-picard','ns.background-moments','ns.dyadic-charts','ns.source-core-charts','ns.torus-derivatives'].includes(kind);
  if(mode==='OUTWARD_FLOAT64'&&!outward)fail('PRECISION_REQUIRED','Outward scalar interval evaluation is available for scalar bounds/source operator and coordinate enclosures; this job does not provide a certified solution enclosure.');
  return {requested:value,arithmeticBits:53,arithmetic:outward?'OUTWARD_FLOAT64_SCALAR_INTERVALS':'FLOAT64_WITH_EXACT_INDEX_AND_SOURCE_EXPRESSIONS',fullResultExact:false,rigorousOdeSolutionErrorBound:['ns.actual-pulse-amplitude','ns.actual-covariance-matching'].includes(kind)?'ACTUAL_SOURCE_CELLWISE_POSITIVE_VOLTERRA_COMPARISON':null,...(kind==='ns.actual-covariance-matching'?{targetEnclosureExponent:input.bits??512,quadrature:'OUTWARD_GAUSSIAN_AND_TRANSVERSE_RECTANGLE_SUMS_WITH_NONZERO_TAIL',wholeResultArbitraryPrecision:false}: {}),formalPass:false};
}
function resourceEstimate(kind,input){
  const operations={
    'ns.actual-covariance-sensitivity':()=>45000000,
    'ns.actual-pulse-jet':()=>50000000,
    'ns.actual-full-curl':()=>50000000,
    'ns.actual-pulse-sensitivity':()=>40000000,
    'ns.actual-core-evaluation':()=>2000*(input.degree??48)*((input.radialOrder??2)+1)*((input.etaOrder??2)+1),
    'ns.actual-global-source':()=>3000000+10000*(input.xi?.length??5),
    'ns.actual-continuation':()=>4000000+5000*(input.degree??48),
    'ns.actual-background':()=>500000*((input.radialDegree??3)+1)**2,
    'ns.actual-picard-acceptance':()=>4000000,
    'ns.actual-moment-restoration':()=>30000000+5000000*(input.terms??0)+5000000*(input.heatIterations??0),
    'ns.actual-uniform-covariance':()=>40000000+5000000*(input.terms??1),
    'ns.actual-pulse-amplitude':()=>5000000+8000*(input.steps??64),
    'ns.actual-covariance-matching':()=>8000000+8000*((input.cells??256)+(input.cutoffCells??input.cells??256)),
    'ns.actual-residual-order':()=>2000000+10000*(input.mesh??8)+2000*(input.bits??128),
    'ns.actual-mean-pulse':()=>5000000+1000*(input.samples??32),
    'ns.background-recursion':()=>200000*(input.maxOrder??2)**2,
    'ns.background-picard':()=>10000*(input.terms??16),
    'ns.background-moments':()=>100000,
    'ns.background-residual':()=>300000*(input.maxOrder??2)**2,
    'ns.torus-derivatives':()=>30000,
    'ns.background-cutoffs':()=>5000*(input.orders??4)**2,
    'ns.potential-curl':()=>2000*(input.grid??7)**3,
    'ns.dyadic-charts':()=>500*(input.count??10),
    'ns.source-core-charts':()=>100000,
    'ns.pulse-support':()=>100000+500*(input.labels?.length??4)**2,
    'ns.pulse-ode':()=>8000*(input.steps??128),
    'ns.pulse-covariance':()=>12000,
    'ns.pulse-curl':()=>1800000,
    'ns.pulse-tail':()=>500*(input.count??80)
  }[kind]();
  const items=DIFFERENTIAL_KINDS.includes(kind)?10000:kind==='ns.actual-pulse-sensitivity'?2000:kind==='ns.actual-uniform-covariance'?100000:kind==='ns.actual-moment-restoration'?30000:kind==='ns.actual-residual-order'?12000+24*(input.mesh??8):kind==='ns.actual-covariance-matching'?25000+4*((input.cells??256)+(input.cutoffCells??input.cells??256)):kind==='ns.actual-continuation'?20000:kind==='ns.actual-core-evaluation'?2048:kind==='ns.actual-global-source'?10000+3*(input.xi?.length??5):kind==='ns.actual-pulse-amplitude'?12000+2*(input.steps??64):kind==='ns.actual-picard-acceptance'?12000:kind==='ns.actual-background'?2000*((input.radialDegree??3)+1):kind==='ns.actual-mean-pulse'?512+(input.samples??32):kind==='ns.pulse-ode'?2*(input.steps??128)+1:kind==='ns.potential-curl'?(input.grid??7)**3:kind==='ns.pulse-tail'?(input.count??80):kind==='ns.dyadic-charts'?(input.count??10):kind==='ns.source-core-charts'?10:kind==='ns.pulse-curl'?17:kind==='ns.pulse-support'?(input.labels?.length??4)**2:kind==='ns.background-recursion'?(input.maxOrder??2)+1:(input.orders??4);
  return {algorithmicOperationsEstimate:operations,outputItemsEstimate:items,policy:'STATIC_PREFLIGHT_ESTIMATE; NOT_A_MEASURED_OR_CERTIFIED_OPERATION_COUNT; RUNTIME_TIME_AND_BYTE_LIMITS_ENFORCED_BY_ENGINE'};
}
export function validateRequest(r){
  try{
    if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).some(k=>!['kind','input','precision','budget'].includes(k)))fail('INVALID_INPUT','Use a request envelope with kind, input, precision and budget only.');
    for(const key of ['input','precision','budget'])if(r[key]!==undefined&&(!r[key]||typeof r[key]!=='object'||Array.isArray(r[key])))fail('INVALID_INPUT',key+' must be an object.');
    const v=validate(r.kind,r.input??{});if(!v.ok)return v;
    const precision=precisionContract(r.kind,r.precision??{},r.input??{}),estimate=resourceEstimate(r.kind,r.input??{}),budget=r.budget??{};
    if(!budget||typeof budget!=='object'||Array.isArray(budget)||Object.keys(budget).some(k=>!['maxMillis','maxBytes','maxItems','maxOperations'].includes(k)))fail('INVALID_INPUT','Unknown NS M2 resource budget field.');
    for(const[k,v]of Object.entries(budget))if(!Number.isSafeInteger(v)||v<=0)fail('INVALID_INPUT',k+' must be a positive safe integer.');
    if(budget.maxOperations!==undefined&&estimate.algorithmicOperationsEstimate>budget.maxOperations||budget.maxItems!==undefined&&estimate.outputItemsEstimate>budget.maxItems)fail('BUDGET_EXCEEDED','Declared budget is below the finite NS job estimate. Reduce grid/steps/orders or increase the bounded budget.');
    return {ok:true,precision,estimate};
  }catch(e){return {ok:false,code:e.code||'INVALID_INPUT',errors:[e.message]};}
}
function finiteJson(value){
  if(typeof value==='number'){if(!Number.isFinite(value))fail('PRECISION_REQUIRED','A numerical result exceeded finite binary64 arithmetic.');return Number.isInteger(value)&&!Number.isSafeInteger(value)?{kind:'FLOAT64',value}:value;}
  if(Array.isArray(value))return value.map(finiteJson);
  if(value&&typeof value==='object'){if(value.kind==='FLOAT64'&&Object.keys(value).every(k=>['kind','value'].includes(k))){if(!Number.isFinite(value.value))fail('PRECISION_REQUIRED','A typed Float64 result is nonfinite.');return {kind:'FLOAT64',value:value.value};}return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,finiteJson(v)]));}
  return value;
}
export async function run(kind,input={},context={}){
  const v=validateRequest({kind,input,precision:context.precision??{},budget:context.budget??{}});if(!v.ok)return {kind,status:['UNSUPPORTED','PRECISION_REQUIRED','BUDGET_EXCEEDED'].includes(v.code)?v.code:'FAILED',checks:[],blockers:v.errors,message:v.errors.join(' ')};const map={'ns.actual-covariance-sensitivity':(a,c)=>actualDifferential(a,c,'ns.actual-covariance-sensitivity'),'ns.actual-pulse-jet':(a,c)=>actualDifferential(a,c,'ns.actual-pulse-jet'),'ns.actual-full-curl':(a,c)=>actualDifferential(a,c,'ns.actual-full-curl'),'ns.actual-pulse-sensitivity':actualPulseSensitivity,'ns.actual-core-evaluation':actualCore,'ns.actual-global-source':actualGlobalSource,'ns.actual-continuation':actualContinuation,'ns.actual-background':actualBackground,'ns.actual-picard-acceptance':actualPicardAcceptance,'ns.actual-moment-restoration':actualMomentRestoration,'ns.actual-uniform-covariance':actualUniformCovariance,'ns.actual-pulse-amplitude':actualPulseAmplitude,'ns.actual-covariance-matching':actualCovarianceMatching,'ns.actual-residual-order':actualResidualOrder,'ns.actual-mean-pulse':actualMeanPulse,'ns.background-recursion':backgroundRecursion,'ns.background-picard':backgroundPicard,'ns.background-moments':backgroundMoments,'ns.background-residual':backgroundResidual,'ns.torus-derivatives':torusDerivatives,'ns.background-cutoffs':cutoffSchedule,'ns.potential-curl':potentialCurl,'ns.dyadic-charts':dyadicCharts,'ns.source-core-charts':sourceCoreCharts,'ns.pulse-support':pulseSupport,'ns.pulse-ode':pulseOde,'ns.pulse-covariance':covariance,'ns.pulse-curl':pulseCurl,'ns.pulse-tail':pulseTail};
  try{const r=await map[kind](input,context),body=finiteJson({kind,moduleVersion:DIFFERENTIAL_KINDS.includes(kind)?'m2-ns-0.3.8':'m2-ns-0.3.7',...r,precisionLedger:v.precision,resourceEstimate:v.estimate});return {...body,resultHash:await sha256(body)};}
  catch(error){if([...DIFFERENTIAL_KINDS,'ns.actual-uniform-covariance','ns.actual-pulse-sensitivity'].includes(kind)&&error.code==='RESOURCE_LIMIT')return {kind,status:'BUDGET_EXCEEDED',checks:[],blockers:[error.message],message:error.message};if(['PRECISION_REQUIRED','UNSUPPORTED','INVALID_INPUT','BUDGET_EXCEEDED'].includes(error.code))return {kind,status:error.code==='INVALID_INPUT'?'FAILED':error.code,checks:[],blockers:[error.message],message:error.message};throw error;}
}
export async function runJob(r,context={}){return run(r.kind,r.input,{...context,precision:r.precision??context.precision??{},budget:r.budget??context.budget??{}});}
export function getExamples(){return [
  ['ns-m2-actual-pulse-jet','N5 · 실제 pulse R/Z/T 2차·혼합 미분 · 20성분 수렴계','ns.actual-pulse-jet',{sourceProfile:SOURCE_PROFILE_ID,ellExact:'1',terms:1}],
  ['ns-m2-actual-covariance-sensitivity','N5 · 실제 공분산·가중치의 1차 미분 · 비영 tail','ns.actual-covariance-sensitivity',{sourceProfile:SOURCE_PROFILE_ID,ellExact:'1',slowCoordinate:'R',derivativeOrder:1,terms:0}],
  ['ns-m2-actual-full-curl','N5 · 실제 국소 전체 curl · 양의 가중치 영역 조건부','ns.actual-full-curl',{sourceProfile:SOURCE_PROFILE_ID,ellExact:'1',terms:0}],
  ['ns-m2-actual-pulse-sensitivity','N5 · 실제 pulse의 1차 R/Z/T 미분·초기조건·수렴 tail','ns.actual-pulse-sensitivity',{sourceProfile:SOURCE_PROFILE_ID,ellExact:'1',slowCoordinate:'R',derivativeOrder:1,terms:0}],
  ['ns-m2-actual-core-evaluation','N4 · 실제 비선형 core 점·혼합 도함수·정확 구간','ns.actual-core-evaluation',{sourceProfile:SOURCE_PROFILE_ID,Y:'4',eta:{kind:'RHO_SCALED',value:'1/8'},radialOrder:2,etaOrder:2,bits:192,degree:48}],
  ['ns-m2-actual-global-source','N4 · 실제 외곽 장·전체 모멘트 적분의 정확 축소','ns.actual-global-source',{sourceProfile:SOURCE_PROFILE_ID,eta:.25,xi:[.5,1,2,5,9]}],
  ['ns-m2-actual-continuation','N4 · 실제 core 전체 적분·물리 구간·모멘트 오차','ns.actual-continuation',{sourceProfile:SOURCE_PROFILE_ID,eta:'1/4',XInterval:['1','100'],bits:192,degree:48}],
  ['ns-m2-actual-background','N4 · 실제 원본 1차 보정·양의 반경 구간·모멘트 기여','ns.actual-background',{sourceProfile:SOURCE_PROFILE_ID,radialDegree:3,tailBits:128}],
  ['ns-m2-actual-picard-acceptance','N4 · 실제 n=1 Picard 유한 합격·공통 구간·tail','ns.actual-picard-acceptance',{sourceProfile:SOURCE_PROFILE_ID,tailBits:128}],
  ['ns-m2-actual-moment-restoration','N4 · 실제 1·2차 모멘트 10개·소스 순서·응력 지지','ns.actual-moment-restoration',{sourceProfile:SOURCE_PROFILE_ID,terms:0,bits:128,etaOrder:2,heatIterations:0}],
  ['ns-m2-actual-uniform-covariance','N5 · 전체 실제 공분산·공통 q*·양의 역원·전역 (7.30)','ns.actual-uniform-covariance',{sourceProfile:SOURCE_PROFILE_ID,anchorOrder:1,terms:1}],
  ['ns-m2-actual-pulse-amplitude','N5 · 실제 성장 펄스·위상·에너지·Gaussian 구간','ns.actual-pulse-amplitude',{sourceProfile:SOURCE_PROFILE_ID,y:2.5,sign:1,steps:64}],
  ['ns-m2-actual-covariance-matching','N5 · 실제 공분산·응력·양의 역행렬·전체 활성 합','ns.actual-covariance-matching',{sourceProfile:SOURCE_PROFILE_ID,y:2.5,cells:256,cutoffCells:256,bits:512}],
  ['ns-m2-actual-residual-order','N4 · 같은 배경의 N=0/1 잔차·고정 영역·독립 정련','ns.actual-residual-order',{sourceProfile:SOURCE_PROFILE_ID,bits:128,mesh:8,maxDerivativeOrder:2,timeIndices:[4,8,12,16]}],
  ['ns-m2-actual-mean-pulse','N5 · 실제 Imean 장·국소 위상 상계·원문 성장 초기조건','ns.actual-mean-pulse',{sourceProfile:SOURCE_PROFILE_ID,y:2.5,eta:.25,s:1,order:3,samples:32}],
  ['ns-m2-recursion','N4 · 원래 PDE 직접 대입·exact coefficient 항등식','ns.background-recursion',{maxOrder:2}],
  ['ns-m2-picard','N4 · 원문 6성분 Picard operator·조건부 엄밀 tail','ns.background-picard',{sourceProfile:SOURCE_PROFILE_ID,n:1,Cn:.5,a:.25,rho:.5,rhoPrime:.25,terms:16}],
  ['ns-m2-moments','N4 · 실제 λ·Ipos의 5-moment 복구 operator','ns.background-moments',{sourceProfile:SOURCE_PROFILE_ID,n:1,normalizedDebts:[1,-.25,.125,-.5,.375]}],
  ['ns-m2-residual','N4 · 원래 PDE 유한 잔차 exact polynomial','ns.background-residual',{maxOrder:2}],
  ['ns-m2-cutoffs','N4 · 조건부 cutoff 인증·실제 locally finite potential 합','ns.background-cutoffs',{orders:4,logPower:2,growth:.4}],
  ['ns-m2-curl','N4/N5 · cutoff 후 실제 curl·divergence 검사','ns.potential-curl',{radius:2,frequency:2,grid:7}],
  ['ns-m2-dyadic','N5 · 실제 N3 h·dyadic chart·고정 label','ns.dyadic-charts',{sourceProfile:SOURCE_PROFILE_ID,ellStart:8,count:14}],
  ['ns-m2-core-charts','N5 · 실제 N3 core 구간·두 chart의 물리량 일치','ns.source-core-charts',{sourceProfile:SOURCE_PROFILE_ID,ell:16}],
  ['ns-m2-torus','N5 · 실제 torus 고유방향·chain rule·Haar','ns.torus-derivatives',{sourceProfile:SOURCE_PROFILE_ID,ell:16,R:1,gradient:{R:1,Z:2,T:3,theta:4,Y1:5,Y2:6}}],
  ['ns-m2-support','N5 · 모든 source label의 유리수 지지 분리 증명','ns.pulse-support',{sourceProfile:SOURCE_PROFILE_ID}],
  ['ns-m2-pulse-ode','N5 · 입력 계수의 projected ODE·log 진폭','ns.pulse-ode',{epsilon:.04,F:1,FR:-3,GR:0,R:1,uStar:2,length:8,steps:128}],
  ['ns-m2-covariance','N5 · 두 family 공분산·정규화 Haar·실제 Jacobian','ns.pulse-covariance',{target:[-1,0],amplitude:1,liftedArea:1/64,epsilon:.1}],
  ['ns-m2-pulse-curl','N5 · 원문 C_m·전체 r_m·Cartesian curl 대조','ns.pulse-curl',{ell:8}],
  ['ns-m2-tail','N5 · 전체 cutoff 잔차 jet·조건부 고정차수 flatness','ns.pulse-tail',{c:.2,C:2,derivativeLoss:2,targetPower:4,ellStart:8,count:80}]
].map(([id,label,kind,input])=>({id,label,request:{kind,input,...([...DIFFERENTIAL_KINDS,'ns.actual-uniform-covariance','ns.actual-pulse-sensitivity'].includes(kind)?{precision:{mode:'EXACT_CONSTRUCTIVE'},budget:{maxMillis:60000}}:{})}}));}
export function getCapabilities(){return {kinds:KINDS,n3Profile:PROFILE,paper:PAPER,sourceEquations:['5.1–5.8','5.10–5.16','5.25','5.37','5.45','6.1–6.19','7.2–7.8','7.13','7.17','7.22','7.27','7.30','7.40'],differentialExtension:{version:'0.3.8',slowDirections:['R','Z','T'],maximumSlowOrder:2,covarianceDerivativeOrder:1,sourceDisplayBands:['1'],fullCurl:'CONDITIONAL_LOCAL_FIXED_BOX',numericalDerivativeEnclosures:false,globalPhysicalResidualAndFlatErrors:false,newLeanResults:'14 universal differential algebra declarations; no actual-source analytic theorem'},implemented:'Actual fixed-label R/Z/T second and mixed pulse jets with exact time-uniform FTC functional bounds; actual covariance/target/inverse first derivatives; conditional actual local full potential curl retaining sqrt(epsilon), weight derivatives, transverse cutoff and cylindrical connection; actual fixed-label first slow R/Z/T pulse sensitivity, source-derived matrix derivative bounds, original initial frame and endpoint chain rules, with convergent nonzero functional tails; actual uniform source covariance family with internally generated common qStar, all-band completed C2 background, actual moving operators, convergent H integrals, positive inverse on the open annulus, flat endpoint extension and complete global (7.30); actual first/second-order convergent functions, ten restored continuous moments, twelve inner PDE identities, preheat/heat invariant, four stress supports and private prior-order gates; actual same-source N=0/1 fixed-core residual with computed CNm/Km, positive norm decrease and independent precision/mesh refinement; actual Imean homogeneous-pulse covariance with heat-prepared stress, exact positive inverse and complete representative-point partition sum; actual fixed-source n=1 Picard acceptance; actual completed-background Imean homogeneous pulse and moving frame with a certified full pulse interval; actual core-integral and source-continuation cells; actual n=0 nonlinear core point enclosures with directed BigInt arithmetic and retained analytic errors; actual outer-source intervals and exact weighted-moment reduction; actual order-one jets, common-collar analytic bounds and positive-core enclosures; actual Imean slow jets and local pulse bounds; source algebra, Picard/moment operators and dyadic/support identities',fullN4:false,fullN5:false,precision:'Exact BigInt rational differential polynomials and Q(sqrt(2)); outward IEEE754 operator/log intervals; source-bound positive Volterra comparison for ns.actual-pulse-amplitude; the separate ns.pulse-ode fixture uses RK4 and empirical convergence',precisionModes:['FLOAT64','AUTO','OUTWARD_FLOAT64 for scalar/source geometry/operator enclosures','DIRECTED_BIGINT with 96..512 bits for ns.actual-core-evaluation, ns.actual-continuation and ns.actual-residual-order','EXACT_CONSTRUCTIVE with 16..4096 analytic tail target bits for ns.actual-moment-restoration; signed numerical quadrature is not implied','EXACT_CONSTRUCTIVE without requested bits for ns.actual-uniform-covariance; finite Volterra terms retain a nonzero factorial tail'],checklist:getChecklist(),requiredNext:['extend the accepted fixed-core N=0/1 residual to the global repaired profile and higher N','materialize all slow Gaussian derivative bounds and the complete physical flat-error assembly beyond the accepted original criteria']};}
