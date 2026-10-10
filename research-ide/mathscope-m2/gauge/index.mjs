/** Additive M2 gauge facade; protected M1 code is imported, never rewritten. */
import {createGroup,availableGroups} from '../../mathscope-m1/gauge/groups.mjs';
import {sha256} from '../../mathscope-m0/contracts.mjs';
import {KINDS,LIMITS,REVISION,SU2,normalizeInput,latticeEstimate,assertBudget,check} from './contracts.mjs';
import {runLattice} from './lattice.mjs';
import {runCertifiedRefinement as runRefinement} from './refinement.mjs';
import {runEnsemble,runSingleLinkReference} from './ensemble.mjs';
import {runReflection,REFLECTION_SOURCE} from './reflection.mjs';
import {runTransfer} from './transfer.mjs';
import {runSmallLatticeReference} from './reference.mjs';
import {runVolumeRefinement} from './volume.mjs';

export const SOURCES=[
  {id:'BLUEPRINT_Y3_Y4',kind:'USER_SUPPLIED_SPECIFICATION',title:'MathScope Research IDE Blueprint v1',pages:[41,42,43,44],sha256:'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac'},
  {id:'YM-R07',title:'Gauge Theory, Chapter 4: Lattice Gauge Theory',author:'David Tong',url:'https://davidtong.org/pdfs/teaching/gauge-theory/gauge4.pdf',locator:'§4.2.1–4.2.2, printed pp.206–212, Wilson links/action and normalized Haar measure',evidenceGrade:'THEOREM_REFERENCE'},
  {...REFLECTION_SOURCE,evidenceGrade:'MODEL_SPECIFIC_HYPOTHESIS_MAPPING_AVAILABLE'},
  {id:'DLMF-I-SERIES',title:'NIST Digital Library of Mathematical Functions, modified Bessel definitions and integrals',url:'https://dlmf.nist.gov/10.25.E2',locator:'Equation 10.25.2; Haar radial integral from https://dlmf.nist.gov/10.32.E2',evidenceGrade:'FORMULA_REFERENCE_WITH_EXPLICIT_SERIES_REMAINDERS'},
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
  {id:'Y3-06',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Actual full-Lie plaquette/clover curvature, energy and real charge converge as both spacings shrink. Independent analytic-derivative local fixtures and a fixed physical 4D box integral retain every source link/cell and directed error budgets. Observed clover order two is distinguished from the conservative order-one bound; real Q is never rounded into an integer certificate.'},
  {id:'Y3-07',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Every classical M1 link has separate source-specific midpoint/trapezoidal integration, source evaluation, matrix exponential truncation/roundoff, product and boundary errors. Exact rational group data determine each of the fourteen representation bounds. Local rho/a and fixed-volume refinements are checked against independent BPST primitives/densities; finite-path/window bounds are not exported as arbitrary continuum theorems.'},
  {id:'Y3-08',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Source allocation and JSON budgets checked before constructing arrays; raw links remain complete while x4 slice/stride changes only the observation hash.'},
  {id:'Y4-01',status:'IMPLEMENTED_FINITE_SCOPE',detail:'The finite normalized Haar-product Gibbs measure has an explicit positive partition-function bound; underflow is recorded in log scale.'},
  {id:'Y4-02',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Full SU(2) Haar or symmetric full-basis Lie exponential random-scan Metropolis; target action difference and proposal symmetry are explicit.'},
  {id:'Y4-03',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Both real SU(2) proposal algorithms meet independent Bessel/Haar one-link references. A nonzero-beta full 2×2×2×2 open lattice is compared with separate quaternion product-Haar importance sampling, predeclared Bernstein/Hoeffding intervals and pure-gauge controls. Wrong distribution/action controls fail; other-group quantitative validation is not inferred from these fixtures.'},
  {id:'Y4-04',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Two starts pass recorded burn-in, acceptance, action/loop/real-topology, split-Rhat, segment/replica mean and ESS gates on the declared small reference fixture. Separate real-charge mobility diagnostics reject long stagnant histories. Inadequate short production examples remain PARTIAL; these finite diagnostic passes do not prove general thermal equilibrium or integer topological-sector mixing.'},
  {id:'Y4-05',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Per-observable autocorrelation window, tau_int, ESS and batch-mean cross-check; insufficient ESS and constant/stalled series do not receive a confidence interval.'},
  {id:'Y4-06',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Six explicit model/action/Haar/boundary/algebra hypotheses map to Lüscher 1977, §II, Propositions 1–2. Direct SU(N) periodic isotropic application is distinguished from the displayed compact-group/anisotropic/open-boundary derivation. Negative beta, arbitrary measure, gauge-variant algebra and extra action terms cannot receive an application status. Finite numeric PSD matrices are not the proof.'},
  {id:'Y4-07',status:'IMPLEMENTED_FINITE_SCOPE',detail:'The infinite-dimensional gauge-invariant L² space is retained explicitly. The full SU(2) open spatial cube has an exhaustively enumerated total-spin-weight≤5 Gauss basis of seven states. Its positive Gram companion has separate deterministic omitted-spin, independent-Haar cubature and arithmetic errors; symmetry and finite real-time unitarity are checked. Unsupported graphs/cutoffs are rejected, and Euclidean transfer is not called unitary.'},
  {id:'Y4-08',status:'IMPLEMENTED_FINITE_SCOPE',detail:'Group/action/beta/spacing/volume/boundary, algorithm, seed, starts, flow=null, retained sample hashes and final raw configurations are sealed; source versus observation revisions are distinct.'}
];
// Paths are relative to research-ide, as in the central arithmetic checklist.
// These are the per-criterion paths in the preserved domain receipt. Keep the
// receipt itself in every row so the source/test links are not mistaken for a
// fresh execution or an automatically issued mathematical certificate.
const CRITERION_SOURCE_EVIDENCE={
  'Y3-01':['mathscope-m2/gauge/tests/gauge.test.mjs','mathscope-m2/gauge/contracts.mjs'],
  'Y3-02':['mathscope-m2/gauge/tests/gauge.test.mjs','mathscope-m2/gauge/tests/independent.py','mathscope-m2/gauge/lattice.mjs'],
  'Y3-03':['mathscope-m2/gauge/tests/gauge.test.mjs','mathscope-m2/gauge/tests/independent.py','mathscope-m2/gauge/quaternion-oracle.mjs'],
  'Y3-04':['mathscope-m2/gauge/tests/gauge.test.mjs','mathscope-m2/gauge/README_KO.md','mathscope-m1/gauge/lean/MathScope/M1/Gauge/Transport.lean'],
  'Y3-05':['mathscope-m2/gauge/tests/gauge.test.mjs','mathscope-m2/gauge/tests/independent.py','mathscope-m2/gauge/lattice.mjs'],
  'Y3-06':['mathscope-m2/gauge/refinement.mjs','mathscope-m2/gauge/volume.mjs','mathscope-m2/gauge/tests/certification.test.mjs','mathscope-m2/gauge/tests/independent-certification.py'],
  'Y3-07':['mathscope-m2/gauge/transport-certificates.mjs','mathscope-m2/gauge/enclosures.mjs','mathscope-m2/gauge/tests/certification.test.mjs','mathscope-m2/gauge/tests/independent-certification.py'],
  'Y3-08':['mathscope-m2/gauge/tests/gauge.test.mjs','mathscope-m2/gauge/tests/visualization.test.mjs','mathscope-m2/gauge/tests/worker.test.mjs'],
  'Y4-01':['mathscope-m2/gauge/lattice.mjs','mathscope-m2/gauge/tests/gauge.test.mjs'],
  'Y4-02':['mathscope-m2/gauge/ensemble.mjs','mathscope-m2/gauge/tests/gauge.test.mjs','mathscope-m2/gauge/tests/certification.test.mjs'],
  'Y4-03':['mathscope-m2/gauge/reference.mjs','mathscope-m2/gauge/quaternion-oracle.mjs','mathscope-m2/gauge/enclosures.mjs','mathscope-m2/gauge/tests/certification.test.mjs','mathscope-m2/gauge/tests/independent-certification.py'],
  'Y4-04':['mathscope-m2/gauge/statistics.mjs','mathscope-m2/gauge/ensemble.mjs','mathscope-m2/gauge/tests/certification.test.mjs'],
  'Y4-05':['mathscope-m2/gauge/statistics.mjs','mathscope-m2/gauge/tests/gauge.test.mjs','mathscope-m2/gauge/tests/certification.test.mjs'],
  'Y4-06':['mathscope-m2/gauge/reflection.mjs','mathscope-m2/gauge/tests/certification.test.mjs','mathscope-m2/gauge/README_KO.md'],
  'Y4-07':['mathscope-m2/gauge/transfer.mjs','mathscope-m2/gauge/enclosures.mjs','mathscope-m2/gauge/tests/certification.test.mjs','mathscope-m2/gauge/tests/independent-certification.py'],
  'Y4-08':['mathscope-m2/gauge/ensemble.mjs','mathscope-m2/gauge/tests/gauge.test.mjs','mathscope-m2/gauge/tests/visualization.test.mjs','mathscope-m2/gauge/tests/worker.test.mjs']
};
const CRITERION_RECEIPT_PATH='mathscope-m2/gauge/evidence/criterion-completion.json';
const HISTORICAL_GAUGE_TEST_EVIDENCE=[
  'mathscope-m2/gauge/evidence/tests.tap',
  'mathscope-m2/gauge/evidence/independent-validation.json',
  'mathscope-m2/gauge/evidence/certification-independent-validation.json'
];
export function getChecklist(){return CHECKLIST.map(row=>({
  ...structuredClone(row),
  implementedScope:row.detail,
  testStatus:'기존 도메인 인수 receipt와 보존된 수치·독립 검사 로그를 승계합니다. 이 메타데이터 조회는 새 수치 검사 또는 Lean 실행이 아닙니다.',
  acceptanceScope:'원문 유한 기준의 명시된 알고리즘·검증 사례 범위입니다. 개별 실행의 PARTIAL/UNSUPPORTED 상태와 이론·극한의 미해결 범위는 보존합니다.',
  evidencePathBase:'research-ide',
  inheritedFrom:{path:CRITERION_RECEIPT_PATH,criterionId:row.id,status:row.status,newExecution:false},
  evidencePaths:[CRITERION_RECEIPT_PATH,...CRITERION_SOURCE_EVIDENCE[row.id],...HISTORICAL_GAUGE_TEST_EVIDENCE,...(row.id==='Y3-04'?['mathscope-m1/gauge/lean/transport-audit.log']:[])]
}));}
function workEstimate(kind,input){
  const group=createGroup(input.group),d=group.matrixDimension;
  if(kind==='gauge.volume-refinement')return {algorithmicOperationsEstimate:input.cellCounts.reduce((s,n)=>s+4*n*(n+1)**3*input.transportSteps*3*28*12*d**3+(n+1)**4*6*500*d**3,0)+input.referencePanels**4*128,items:input.cellCounts.reduce((s,n)=>s+4*n*(n+1)**3+n**4,0)};
  if(kind==='gauge.reflection-positivity')return {algorithmicOperationsEstimate:10000,items:6};
  if(kind==='gauge.transfer-cutoff')return {algorithmicOperationsEstimate:input.quadratureSamples*5000+500000,items:input.quadratureSamples+49};
  if(kind==='gauge.small-lattice-reference'){const chain=workEstimate('gauge.ensemble',input);return {...chain,algorithmicOperationsEstimate:chain.algorithmicOperationsEstimate+input.oracleSamples*3500,items:chain.items+input.oracleSamples};}
  if(kind==='gauge.sampler-reference')return {algorithmicOperationsEstimate:(input.samples+input.burnIn)*(input.algorithm==='FULL_BASIS_LIE_METROPOLIS'?3000:300)+input.quadraturePanels*24,items:input.samples};
  if(kind==='gauge.lattice-refinement')return {algorithmicOperationsEstimate:input.levels*6*4*(input.measurement==='CLOVER'?4:1)*input.transportSteps*3*28*12*d**3,items:input.levels};
  const est=latticeEstimate(input.lattice,group),membershipCost=group.id==='G2'?50000:64*d**3,base=est.activeLinks*(membershipCost+96*d**3)+est.sites*6*64*d**3;
  if(kind==='gauge.ensemble'){
    const sweeps=(input.sampler.burnIn+input.sampler.samples*input.sampler.thin)*input.sampler.starts.length,updates=est.activeLinks*sweeps;
    return {...est,estimatedJSONBytes:est.estimatedJSONBytes*input.sampler.starts.length+sweeps*480,algorithmicOperationsEstimate:base+updates*6*32*d**3+sweeps*est.sites*6*32*d**3*(input.measurement==='CLOVER'?5:2),items:est.activeLinks+input.sampler.samples*input.sampler.starts.length,updates};
  }
  const integration=input.initial.kind==='CLASSICAL_FIELD'?est.activeLinks*input.initial.transportSteps*3*28*12*d**3:0;
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
    if(report.estimate.sites!==undefined)assertBudget(report.estimate,{ensemble:['gauge.ensemble','gauge.small-lattice-reference'].includes(request.kind),maxBytes:budget.maxBytes,updates:report.estimate.updates??0});
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
  const started=Date.now(),baseCheck=context.checkCancelled,deadline=request.budget?.maxMillis??LIMITS.maxMilliseconds,hooks={...context,budget:request.budget??context.budget,checkCancelled(){baseCheck?.();check(Date.now()-started<=deadline,'BUDGET_EXCEEDED','The explicit gauge runtime time budget was reached.');}},handlers={'gauge.lattice':runLattice,'gauge.ensemble':runEnsemble,'gauge.sampler-reference':runSingleLinkReference,'gauge.lattice-refinement':runRefinement,'gauge.reflection-positivity':runReflection,'gauge.transfer-cutoff':runTransfer,'gauge.small-lattice-reference':runSmallLatticeReference,'gauge.volume-refinement':runVolumeRefinement};
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
export function getCapabilities(){return {domain:'gauge',version:REVISION,kinds:KINDS,supportedGroups:availableGroups(),limits:LIMITS,initializers:['IDENTITY','PURE_GAUGE','CENTER_HOLONOMY (SU(N), periodic temporal boundary)','SEEDED_EXPONENTIAL','HOT_HAAR (full SU2 only)','CLASSICAL_FIELD','EXPLICIT_LINKS'],latticeBoundaries:['PERIODIC','OPEN'],measurements:['PLAQUETTE','CLOVER'],samplers:['SU2_HAAR_METROPOLIS','FULL_BASIS_LIE_METROPOLIS'],precision:'FLOAT64_WITH_DIRECTED_SOURCE_ENCLOSURES_AND_ACTUAL_RESIDUALS',certifiedScopes:['Fourteen source-specific faithful group representation link error bounds','Local classical plaquette/clover curvature and density refinement','Fixed-volume embedded-BPST energy and real-charge integrals','Model-specific Wilson reflection factorization','SU2 open spatial cube total-spin-weight-five transfer operator','Independent SU2 one-link and nonzero-beta 4D reference intervals'],unsupported:['Unimplemented M1 group/representation adapters','HMC, heatbath or subgroup sampling labels','Naive periodic copying of BPST','Certified equilibrium/topological-sector mixing from a short chain','Source rules without a declared derivative/integration certificate or quantum continuum limits','Reflection-positivity theorem application without its model-specific hypothesis mapping','Transfer graphs, groups or cutoff weights outside the explicitly enumerated SU2 open cube sector','Continuum quantum Yang–Mills theory or mass gap'],checklist:getChecklist(),references:SOURCES};}
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
    make('m2-bpst-clover-anisotropic','BPST · clover, both spacings, energy/topology error bounds','gauge.lattice-refinement',{group:SU2,field:field(),origin:[.2,-.3,.1,.4],spacing:.2,temporalRatio:1.5,measurement:'CLOVER',levels:4,transportSteps:8}),
    make('m2-bpst-fixed-volume','BPST · fixed 4D volume, energy and real-charge convergence','gauge.volume-refinement',{group:SU2,field:field(),origin:[-.5,-.5,-.5,-.375],spatialLength:1,temporalLength:.75,cellCounts:[1,2,3],transportSteps:2,referencePanels:20}),
    make('m2-su2-wilson-ensemble','SU(2) · Haar Metropolis, independent starts and ESS diagnostics','gauge.ensemble',{...base,beta:1,sampler:{algorithm:'SU2_HAAR_METROPOLIS',seed:'m2-wilson-2026',starts:['COLD','HOT_HAAR'],burnIn:32,samples:96,thin:1,maxLag:24,minimumESS:50}}),
    make('m2-wilson-reflection-audit','Wilson · theorem hypotheses and exact reflection factorization','gauge.reflection-positivity',{group:SU2,lattice,beta:2}),
    make('m2-su2-cube-transfer-cutoff','SU(2) · physical cube spin cutoff and transfer error','gauge.transfer-cutoff',{group:SU2,lattice:{...lattice,spatialBoundary:'OPEN',temporalBoundary:'OPEN'},beta:.5,quadratureSamples:4096,seed:'m2-transfer-cube',cutoffWeight:5,failureProbability:.001,maxOperatorError:.1}),
    make('m2-su2-small-lattice-reference','SU(2) · nonzero beta, independent 4D Haar reference','gauge.small-lattice-reference',{group:SU2,lattice:{...lattice,spatialBoundary:'OPEN',temporalBoundary:'OPEN'},beta:.02,oracleSamples:4096,seed:'m2-independent-small-lattice',failureProbability:.001}),
    make('m2-su2-lie-reference','SU(2) · symmetric full-basis proposal against independent Bessel/Haar oracle','gauge.sampler-reference',{group:SU2,beta:2,seed:'m2-lie-reference',algorithm:'FULL_BASIS_LIE_METROPOLIS',stepSize:1.5,samples:12000,burnIn:1000,quadraturePanels:2048}),
    make('m2-su2-haar-reference','SU(2) · independent one-link Haar quadrature reference','gauge.sampler-reference',{group:SU2,beta:2,seed:'m2-haar-reference-2026',samples:12000,burnIn:1000,quadraturePanels:2048})
  ];
}
