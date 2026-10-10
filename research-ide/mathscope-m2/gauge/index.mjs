/** Additive M2 gauge facade; protected M1 code is imported, never rewritten. */
import {createGroup,availableGroups} from '../../mathscope-m1/gauge/groups.mjs';
import {sha256} from '../../mathscope-m0/contracts.mjs';
import {KINDS,LIMITS,REVISION,SU2,normalizeInput,latticeEstimate,assertBudget,check} from './contracts.mjs';
import {runLattice,runRefinement} from './lattice.mjs';
import {runEnsemble,runSingleLinkReference} from './ensemble.mjs';

export const SOURCES=[
  {id:'BLUEPRINT_Y3_Y4',kind:'USER_SUPPLIED_SPECIFICATION',title:'MathScope Research IDE Blueprint v1',pages:[41,42,43,44],sha256:'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac'},
  {id:'YM-R07',title:'Gauge Theory, Chapter 4: Lattice Gauge Theory',author:'David Tong',url:'https://davidtong.org/pdfs/teaching/gauge-theory/gauge4.pdf',locator:'§4.2.1–4.2.2, printed pp.206–212, Wilson links/action and normalized Haar measure',evidenceGrade:'THEOREM_REFERENCE'},
  {id:'YM-R08',title:'Construction of a selfadjoint, strictly positive transfer matrix for Euclidean lattice gauge theories',author:'Martin Lüscher',url:'https://doi.org/10.1007/BF01614090',locator:'1977; exact model-specific hypothesis mapping is not completed',evidenceGrade:'REFERENCE_ONLY_NOT_APPLIED'},
  {id:'YM-MC01',title:'Monte Carlo errors with less errors',author:'Ulli Wolff',url:'https://arxiv.org/abs/hep-lat/0306017',locator:'Autocorrelation and error-analysis background. This implementation uses the explicitly documented paired-correlation and batch-mean estimator, not a claim to reproduce the full paper implementation.',evidenceGrade:'METHOD_REFERENCE'},
  {id:'M1_GROUP_SOURCE',kind:'LOCAL_CODE_DEPENDENCY',path:'../../mathscope-m1/gauge/groups.mjs',role:'Actual full compact group and faithful representation; exact M1 matrix data hashes are embedded in each model.'},
  {id:'M1_TRANSPORT_LAWS',kind:'HISTORICAL_FORMAL_AUDIT',path:'../../mathscope-m1/gauge/lean/MathScope/M1/Gauge/Transport.lean',audit:'../../mathscope-m1/gauge/lean/transport-audit.log',newKernelExecution:false}
];
export const CHECKLIST=[
  {id:'Y3-01',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Ns, Nt, spatial/Euclidean-time spacing and boundaries, anisotropy, representation, physical extents, site count and continuous group degrees of freedom are distinct.'},
  {id:'Y3-02',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Oriented group products, inverse and empty paths use U_xy:y→x. Classical links retain ordered-midpoint approximation and refinement diagnostics.'},
  {id:'Y3-03',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Actual ordered plaquettes, arbitrary signed paths, identity, pure gauge and nontrivial central temporal holonomy fixtures.'},
  {id:'Y3-04',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Site-wise transformation recomputes every plaquette and the total action. M1 lawful-group adjacent telescoping theorem is reused with its historical audit; no new browser kernel execution.'},
  {id:'Y3-05',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Wilson real character for every shipped faithful group representation; basic invariant form determines bare coupling and anisotropic coefficients.'},
  {id:'Y3-06',status:'PARTIAL',detail:'Actual Lie-projected plaquette/clover curvature, energy and unrounded charge are measured. A local BPST refinement oracle is available; general continuum/topological convergence is not certified.'},
  {id:'Y3-07',status:'PARTIAL',detail:'Actual M1 field→link midpoint transport, trapezoidal comparison and exponential/group residuals. No general certified boundary or integration-error bound is claimed.'},
  {id:'Y3-08',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Source allocation and JSON budgets checked before constructing arrays; raw links remain complete while x4 slice/stride changes only the observation hash.'},
  {id:'Y4-01',status:'IMPLEMENTED_FINITE_SCOPE',detail:'The finite normalized Haar-product Gibbs measure has an explicit positive partition-function bound; underflow is recorded in log scale.'},
  {id:'Y4-02',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Full SU(2) Haar or symmetric full-basis Lie exponential random-scan Metropolis; target action difference and proposal symmetry are explicit.'},
  {id:'Y4-03',status:'PARTIAL',detail:'Independent SU(2) one-link angular quadrature and product-Haar beta=0 lattice tests. Nonzero-beta multi-link and other-group quantitative reference validation remain open.'},
  {id:'Y4-04',status:'PARTIAL',detail:'Independent starts, warmup, acceptance, action/loop/topology history and segment/replica diagnostics are implemented; finite short chains do not certify equilibration or topological-sector mixing.'},
  {id:'Y4-05',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Per-observable autocorrelation window, tau_int, ESS and batch-mean cross-check; insufficient ESS and constant/stalled series do not receive a confidence interval.'},
  {id:'Y4-06',status:'RESEARCH_OPEN',detail:'Model-specific reflection-positivity theorem/observable-algebra/boundary mapping is not complete. No numerical matrix is promoted to a proof.'},
  {id:'Y4-07',status:'MODEL_DEVELOPMENT',detail:'Infinite-dimensional gauge-invariant L² group Hilbert space is explicitly identified. No finite transfer matrix is fabricated without cutoff, basis, Gauss constraints and error controls.'},
  {id:'Y4-08',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Group/action/beta/spacing/volume/boundary, algorithm, seed, starts, flow=null, retained sample hashes and final raw configurations are sealed; source versus observation revisions are distinct.'}
];
export function getChecklist(){return structuredClone(CHECKLIST);}
function workEstimate(kind,input){
  const group=createGroup(input.group),d=group.matrixDimension;
  if(kind==='gauge.sampler-reference')return {algorithmicOperationsEstimate:(input.samples+input.burnIn)*300+input.quadraturePanels*24,items:input.samples};
  if(kind==='gauge.lattice-refinement')return {algorithmicOperationsEstimate:input.levels*6*4*input.transportSteps*3*28*12*d**3,items:input.levels};
  const est=latticeEstimate(input.lattice,group),membershipCost=group.id==='G2'?50000:64*d**3,base=est.activeLinks*(membershipCost+96*d**3)+est.sites*6*64*d**3;
  if(kind==='gauge.ensemble'){
    const sweeps=(input.sampler.burnIn+input.sampler.samples*input.sampler.thin)*input.sampler.starts.length,updates=est.activeLinks*sweeps;
    return {...est,estimatedJSONBytes:est.estimatedJSONBytes*input.sampler.starts.length+sweeps*480,algorithmicOperationsEstimate:base+updates*6*32*d**3+sweeps*est.sites*6*32*d**3*(input.measurement==='CLOVER'?5:2),items:est.activeLinks+input.sampler.samples*input.sampler.starts.length,updates};
  }
  const integration=input.initial.kind==='CLASSICAL_FIELD'?est.activeLinks*input.initial.transportSteps*28*12*d**3:0;
  return {...est,algorithmicOperationsEstimate:base+integration,items:est.activeLinks+est.sites};
}
export function validate(kind,input={}){
  try{const normalizedInput=normalizeInput(kind,input);return {ok:true,valid:true,normalizedInput,estimate:workEstimate(kind,normalizedInput),errors:[]};}
  catch(error){return {ok:false,valid:false,code:error.code??'INVALID_INPUT',errors:[{code:error.code??'INVALID_INPUT',message:error.message}]};}
}
export function validateRequest(request){
  const report=validate(request?.kind,request?.input);if(!report.ok)return report;
  try{
    if(request.precision&&Object.keys(request.precision).length)check((request.precision.mode??'FLOAT64')==='FLOAT64'&&Object.keys(request.precision).every(k=>['mode','tolerance'].includes(k))&&(request.precision.tolerance===undefined||request.precision.tolerance===1e-10),'UNSUPPORTED','M2 gauge uses Float64 and its fixed 1e-10 gauge covariance tolerance. A different precision certificate cannot be selected by relabeling an input.');
    const budget=request.budget??{};if(budget.maxOperations!==undefined)check(report.estimate.algorithmicOperationsEstimate<=budget.maxOperations,'BUDGET_EXCEEDED',`Estimated gauge algebraic work ${report.estimate.algorithmicOperationsEstimate} exceeds maxOperations=${budget.maxOperations}; reduce volume, sweeps or representation size explicitly.`);
    if(budget.maxItems!==undefined)check(report.estimate.items<=budget.maxItems,'BUDGET_EXCEEDED','Source/sample item count exceeds maxItems.');
    if(report.estimate.sites!==undefined)assertBudget(report.estimate,{ensemble:request.kind==='gauge.ensemble',maxBytes:budget.maxBytes,updates:report.estimate.updates??0});
    return report;
  }catch(error){return {ok:false,valid:false,code:error.code??'INVALID_INPUT',errors:[{code:error.code??'INVALID_INPUT',message:error.message}]};}
}
export async function run(kind,input={},context={}){return runJob({kind,input,precision:context.precision??{},budget:context.budget??{}},context);}
function jsonSafe(value){
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number'){check(Number.isFinite(value),'FAILED','A nonfinite result cannot be serialized as mathematical evidence.');return Number.isInteger(value)&&!Number.isSafeInteger(value)?{kind:'FLOAT64',value}:value;}
  if(ArrayBuffer.isView(value))return Array.from(value,jsonSafe);
  if(Array.isArray(value))return value.map(jsonSafe);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,jsonSafe(v)]));
  check(false,'FAILED','Unsupported result value in gauge evidence.');
}
export async function runJob(request,context={}){
  const report=validateRequest(request);if(!report.ok)throw Object.assign(Error(report.errors[0].message),{code:report.code});
  const started=Date.now(),baseCheck=context.checkCancelled,deadline=request.budget?.maxMillis??LIMITS.maxMilliseconds,hooks={...context,budget:request.budget??context.budget,checkCancelled(){baseCheck?.();check(Date.now()-started<=deadline,'BUDGET_EXCEEDED','The explicit gauge runtime time budget was reached.');}},handlers={'gauge.lattice':runLattice,'gauge.ensemble':runEnsemble,'gauge.sampler-reference':runSingleLinkReference,'gauge.lattice-refinement':runRefinement};
  hooks.checkCancelled();const data=await handlers[request.kind](report.normalizedInput,hooks);hooks.checkCancelled();
  // Seal observation data independently of display LOD and of final links.
  // In particular, a one-link chain index and a refinement spacing are not
  // additional physical dimensions of a four-dimensional lattice.
  if(!data.modelHash&&data.model)data.modelHash=await sha256(jsonSafe(data.model));
  if(!data.modelHash&&data.fieldSpec)data.modelHash=await sha256(jsonSafe({field:data.fieldSpec,group:report.normalizedInput.group,fixedPhysicalPoint:report.normalizedInput.origin}));
  const sourceSamples=data.measurements?.sites??data.history??data.levels;
  if(!data.sampleHash&&sourceSamples)data.sampleHash=await sha256(jsonSafe(sourceSamples));
  if(data.visualization&&!data.visualization.observationHash){
    const observation=request.kind==='gauge.sampler-reference'?{kind:'RETAINED_ONE_LINK_CHAIN',sourceFields:['history[*].sample','history[*].normalizedTrace'],coordinateTypes:['ALGORITHM_ITERATION','OBSERVABLE'],physicalTime:false}:request.kind==='gauge.lattice-refinement'?{kind:'LOCAL_CURVATURE_REFINEMENT',sourceFields:['levels[*].spacing','levels[*].curvatureAbsoluteError'],coordinateTypes:['PHYSICAL_LENGTH','NUMERIC_ERROR'],fixedPhysicalPoint:report.normalizedInput.origin}:data.visualization.observation;
    if(observation){data.visualization.observation=observation;data.visualization.observationHash=await sha256({sourceHash:data.sourceHash,observation});}
  }
  return jsonSafe({schema:'MathScope.M2.GaugeResult/1',version:REVISION,kind:request.kind,request:{kind:request.kind,input:report.normalizedInput,precision:{mode:'FLOAT64',tolerance:1e-10},budget:request.budget??{}},requestHash:await sha256({kind:request.kind,input:report.normalizedInput}),...data,references:SOURCES,proofBoundary:{finiteNumericalModel:'Actual stored group matrices, paths and sampled finite observables within declared tolerances.',formalSource:'Previously audited M1 group telescoping source is referenced; this execution does not rerun a Lean kernel.',quantumContinuum:'NOT_CONSTRUCTED',massGap:'NOT_PROVED'},executionMetrics:{elapsedMilliseconds:Date.now()-started,algorithmicOperationsEstimate:report.estimate.algorithmicOperationsEstimate}});
}
export function getCapabilities(){return {domain:'gauge',version:REVISION,kinds:KINDS,supportedGroups:availableGroups(),limits:LIMITS,initializers:['IDENTITY','PURE_GAUGE','CENTER_HOLONOMY (SU(N), periodic temporal boundary)','SEEDED_EXPONENTIAL','HOT_HAAR (full SU2 only)','CLASSICAL_FIELD','EXPLICIT_LINKS'],latticeBoundaries:['PERIODIC','OPEN'],measurements:['PLAQUETTE','CLOVER'],samplers:['SU2_HAAR_METROPOLIS','FULL_BASIS_LIE_METROPOLIS'],precision:'FLOAT64_WITH_ACTUAL_RESIDUALS',unsupported:['Unimplemented M1 group/representation adapters','HMC, heatbath or subgroup sampling labels','Naive periodic copying of BPST','Certified equilibrium/topological-sector mixing from a short chain','General certified continuum discretization error','Reflection-positivity theorem application without its model-specific hypothesis mapping','Finite transfer matrix without explicit cutoff/basis/Gauss/error data','Continuum quantum Yang–Mills theory or mass gap'],checklist:getChecklist(),references:SOURCES};}
function field(){return {kind:'EMBEDDED_BPST',embedding:'canonical-su2',rho:1,center:[0,0,0,0],gaugeConvention:'D=d+A',coupling:{g:1,normalization:'BASIC_FORM'},domain:{kind:'R4_WINDOW',bounds:[[-4,4],[-4,4],[-4,4],[-4,4]],boundary:'OPEN_RESTRICTION'},units:{length:'ell0',hbarC:1},perturbation:null};}
export function getExamples(){
  const lattice={Ns:2,Nt:2,as:.5,at:.5,spatialBoundary:'PERIODIC',temporalBoundary:'PERIODIC',lengthUnit:'ell0',origin:[0,0,0,0]},base={group:SU2,lattice,beta:2,measurement:'PLAQUETTE',view:{timeSlice:0,quantity:'actionDensity',stride:1}},make=(id,label,kind,input)=>({id,label,request:{kind,input,precision:{mode:'FLOAT64'},budget:{maxMillis:60000,maxOperations:50000000,maxBytes:8388608,maxItems:250000}}});
  return [
    make('m2-su2-identity-lattice','SU(2) · 4D identity lattice and exact flat baseline','gauge.lattice',{...base,initial:{kind:'IDENTITY'}}),
    make('m2-su2-center-holonomy','SU(2) · flat plaquettes with nontrivial temporal holonomy','gauge.lattice',{...base,initial:{kind:'CENTER_HOLONOMY',centerPower:1}}),
    make('m2-su2-pure-gauge','SU(2) · nonconstant site gauge frames, invariant action','gauge.lattice',{...base,initial:{kind:'PURE_GAUGE',seed:'m2-pure-gauge'}}),
    make('m2-g2-wilson-lattice','G2 · actual 7×7 links, Wilson action and Lie-projected curvature','gauge.lattice',{...base,group:{family:'G2',parameter:2,globalForm:'ADJOINT',representation:'REAL_7'},initial:{kind:'SEEDED_EXPONENTIAL',seed:'m2-g2-lattice'}}),
    make('m2-bpst-lattice','BPST · classical field to open links and scalar slice','gauge.lattice',{...base,lattice:{...lattice,Ns:3,Nt:3,spatialBoundary:'OPEN',temporalBoundary:'OPEN',origin:[-.5,-.5,-.5,-.5]},initial:{kind:'CLASSICAL_FIELD',field:field(),transportSteps:4}}),
    make('m2-bpst-refinement','BPST · increasing rho/a, actual curvature convergence','gauge.lattice-refinement',{group:SU2,field:field(),origin:[.2,-.3,.1,.4],spacing:.4,levels:4,transportSteps:8}),
    make('m2-su2-wilson-ensemble','SU(2) · Haar Metropolis, independent starts and ESS diagnostics','gauge.ensemble',{...base,beta:1,sampler:{algorithm:'SU2_HAAR_METROPOLIS',seed:'m2-wilson-2026',starts:['COLD','HOT_HAAR'],burnIn:32,samples:96,thin:1,maxLag:24,minimumESS:50}}),
    make('m2-su2-haar-reference','SU(2) · independent one-link Haar quadrature reference','gauge.sampler-reference',{group:SU2,beta:2,seed:'m2-haar-reference-2026',samples:12000,burnIn:1000,quadraturePanels:2048})
  ];
}
