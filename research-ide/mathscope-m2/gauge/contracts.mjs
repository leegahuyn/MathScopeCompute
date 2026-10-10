/** Bounded M2 finite-lattice contracts. All representation arithmetic comes from M1. */
import {normalizeGroupSpec,createGroup,requireCondition} from '../../mathscope-m1/gauge/groups.mjs';
import {normalizeFieldSpec,seedGenerator} from '../../mathscope-m1/gauge/fields.mjs';

export const REVISION='m2-gauge-1.0.0';
export const KINDS=['gauge.lattice','gauge.ensemble','gauge.sampler-reference','gauge.lattice-refinement'];
export const LIMITS=Object.freeze({maxSites:4096,maxEnsembleSites:256,maxRawBytes:8388608,maxUpdates:1500000,maxLinkIntegrations:131072,maxRetainedSamples:4096,maxMilliseconds:60000});
export const SU2={family:'SU',parameter:2,globalForm:'SIMPLY_CONNECTED',representation:'DEFINING'};
const finite=(v,lo,hi)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi;
export function check(ok,code,message){requireCondition(ok,code,message);}
function knownKeys(object,allowed,name){check(Object.keys(object).every(k=>allowed.includes(k)),'INVALID_INPUT',`${name} contains an unsupported field. No unrecognized model/Delta/algorithm label is silently ignored.`);}
export function integer(v,lo,hi,name){check(Number.isInteger(v)&&v>=lo&&v<=hi,'INVALID_INPUT',`${name} must be an integer in [${lo},${hi}].`);return v;}
export function seed(v){check(typeof v==='string'&&v.length>0&&v.length<=200,'INVALID_INPUT','A nonempty seed of at most 200 characters is required.');return v;}
export function rngFromSeed(s){
  const uniform=seedGenerator(seed(s));
  return {uniform,open:()=>1-uniform(),integer(n){const cap=Math.floor(4294967296/n)*n;let x;do{x=Math.floor(uniform()*4294967296);}while(x>=cap);return x%n;},normal(){const u=1-uniform(),v=uniform();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}};
}
export function normalizeLattice(s){
  check(s&&typeof s==='object','INVALID_INPUT','An explicit lattice with Ns, Nt, as, at, boundaries and lengthUnit is required.');
  knownKeys(s,['Ns','Nt','as','at','spatialBoundary','temporalBoundary','lengthUnit','origin','storage'],'lattice');
  check(s.storage===undefined||s.storage==='DENSE_COMPLEX_FLOAT64_POSITIVE_LINKS','UNSUPPORTED','No sparse storage adapter is implemented.');
  integer(s.Ns,2,32,'Ns');integer(s.Nt,2,32,'Nt');
  check(finite(s.as,1e-6,1000)&&finite(s.at,1e-6,1000),'INVALID_INPUT','as and at must be finite positive spacings in [1e-6,1000].');
  check(['PERIODIC','OPEN'].includes(s.spatialBoundary)&&['PERIODIC','OPEN'].includes(s.temporalBoundary),'UNSUPPORTED','Boundary adapters are PERIODIC or OPEN (absent outward links), separately for space and Euclidean time.');
  check(typeof s.lengthUnit==='string'&&s.lengthUnit.length>0&&s.lengthUnit.length<=48,'INVALID_INPUT','An explicit length unit is required.');
  const origin=s.origin??[0,0,0,0];check(Array.isArray(origin)&&origin.length===4&&origin.every(v=>finite(v,-1e4,1e4)),'INVALID_INPUT','origin must have four finite coordinates.');
  return {Ns:s.Ns,Nt:s.Nt,as:s.as,at:s.at,spatialBoundary:s.spatialBoundary,temporalBoundary:s.temporalBoundary,lengthUnit:s.lengthUnit,origin:origin.slice(),storage:'DENSE_COMPLEX_FLOAT64_POSITIVE_LINKS'};
}
export function latticeEstimate(lattice,group){
  const V=lattice.Ns**3*lattice.Nt,d=group.matrixDimension;
  const links=3*(lattice.spatialBoundary==='PERIODIC'?V:(lattice.Ns-1)*lattice.Ns**2*lattice.Nt)+(lattice.temporalBoundary==='PERIODIC'?V:lattice.Ns**3*(lattice.Nt-1));
  return {sites:V,activeLinks:links,continuousLinkDegreesOfFreedom:links*group.dimension,complexStorageUpperBound:4*V*d*d,float64StorageUpperBytes:4*V*d*d*16,estimatedJSONBytes:Math.ceil(4*V*d*d*2*25+V*180+links*80),matrixDimension:d};
}
export function assertBudget(estimate,{ensemble=false,maxBytes=LIMITS.maxRawBytes,updates=0,integrations=0}={}){
  const cap=ensemble?LIMITS.maxEnsembleSites:LIMITS.maxSites;
  check(estimate.sites<=cap,'BUDGET_EXCEEDED',`Requested ${estimate.sites} sites exceed the explicit ${cap}-site ${ensemble?'ensemble':'lattice'} budget. Use smaller Ns/Nt; the source is never silently downsampled.`);
  check(estimate.estimatedJSONBytes<=Math.min(maxBytes,LIMITS.maxRawBytes),'BUDGET_EXCEEDED',`Estimated raw source export ${estimate.estimatedJSONBytes} bytes exceeds the budget. Reduce Ns/Nt or choose a smaller supported representation explicitly.`);
  check(updates<=LIMITS.maxUpdates,'BUDGET_EXCEEDED',`Requested ${updates} link proposals exceed ${LIMITS.maxUpdates}. Reduce sweep count, replicas, or lattice volume explicitly.`);
  check(integrations<=LIMITS.maxLinkIntegrations,'BUDGET_EXCEEDED',`Classical path integrations exceed ${LIMITS.maxLinkIntegrations} evaluation steps. Reduce volume or transportSteps explicitly.`);
}
export function normalizeView(s,lattice){s=s??{};knownKeys(s,['timeSlice','stride','quantity'],'view');return {timeSlice:integer(s.timeSlice??0,0,lattice.Nt-1,'view.timeSlice'),stride:integer(s.stride??1,1,16,'view.stride'),quantity:s.quantity??'actionDensity'};}
export function normalizeInput(kind,input){
  check(KINDS.includes(kind),'UNSUPPORTED','Unsupported M2 gauge kind.');
  check(input&&typeof input==='object'&&!Array.isArray(input),'INVALID_INPUT','Gauge input must be an object.');
  check(input.continuumCertificate===undefined&&input.claimQuantumMassGap!==true,'UNSUPPORTED','This module constructs finite lattice models and diagnostics; it cannot issue a continuum or quantum mass-gap certificate.');
  knownKeys(input,kind==='gauge.lattice'?['group','lattice','beta','measurement','view','initial','gaugeCheckSeed']:kind==='gauge.ensemble'?['group','lattice','beta','measurement','view','sampler']:kind==='gauge.sampler-reference'?['group','beta','seed','samples','burnIn','quadraturePanels']:['group','field','origin','spacing','levels','transportSteps'],'gauge input');
  const groupSpec=normalizeGroupSpec(input.group??SU2),group=createGroup(groupSpec);
  if(kind==='gauge.sampler-reference'){
    check(group.id==='SU2','UNSUPPORTED','The independent one-link Haar quadrature oracle is for actual SU(2), defining representation.');
    const beta=input.beta??2;check(finite(beta,0,20),'INVALID_INPUT','Reference beta must lie in [0,20].');
    return {group:groupSpec,beta,seed:seed(input.seed??'m2-single-link-reference'),samples:integer(input.samples??12000,128,100000,'samples'),burnIn:integer(input.burnIn??1000,0,50000,'burnIn'),quadraturePanels:integer(input.quadraturePanels??2048,128,16384,'quadraturePanels')};
  }
  if(kind==='gauge.lattice-refinement'){
    const field=normalizeFieldSpec(group,input.field),origin=input.origin??[.2,-.3,.1,.4],spacing=input.spacing??.4;
    check(Array.isArray(origin)&&origin.length===4&&origin.every(v=>finite(v,-100,100)),'INVALID_INPUT','refinement origin requires four finite coordinates.');
    check(finite(spacing,.0001,2),'INVALID_INPUT','Refinement spacing must lie in [.0001,2].');
    if(field.domain.kind==='R4_WINDOW')check(origin.every((v,j)=>v>=field.domain.bounds[j][0]&&v+spacing<=field.domain.bounds[j][1]),'INVALID_INPUT','Every refinement loop must remain inside the declared classical source window.');
    return {group:groupSpec,field,origin:origin.slice(),spacing,levels:integer(input.levels??4,2,6,'levels'),transportSteps:integer(input.transportSteps??8,1,32,'transportSteps')};
  }
  const lattice=normalizeLattice(input.lattice),beta=input.beta??2;
  check(finite(beta,0,1000),'INVALID_INPUT','Wilson beta must lie in [0,1000].');
  const measurement=input.measurement??'PLAQUETTE';check(['PLAQUETTE','CLOVER'].includes(measurement),'UNSUPPORTED','Implemented field-strength estimators: PLAQUETTE (O(a) based at a site) and symmetric CLOVER (O(a²) for smooth fields).');
  const view=normalizeView(input.view,lattice);check(['actionDensity','topologicalDensity','curvatureEnergyDensity'].includes(view.quantity),'INVALID_INPUT','view.quantity must select an actual measured site value.');
  const estimate=latticeEstimate(lattice,group),common={group:groupSpec,lattice,beta,measurement,view};
  if(kind==='gauge.ensemble'){
    const sampler=input.sampler??{},algorithm=sampler.algorithm??(group.id==='SU2'?'SU2_HAAR_METROPOLIS':'FULL_BASIS_LIE_METROPOLIS');
    knownKeys(sampler,['algorithm','seed','starts','burnIn','samples','thin','stepSize','maxLag','minimumESS','scan','flow'],'sampler');
    check(['SU2_HAAR_METROPOLIS','FULL_BASIS_LIE_METROPOLIS'].includes(algorithm),'UNSUPPORTED','Algorithms: SU2_HAAR_METROPOLIS or FULL_BASIS_LIE_METROPOLIS. Heatbath, HMC and subgroup algorithms are not implemented.');
    if(algorithm==='SU2_HAAR_METROPOLIS')check(group.id==='SU2','UNSUPPORTED','SU2_HAAR_METROPOLIS requires the full actual SU(2) group; an embedded SU(2) is not a sampler for a larger group.');
    const starts=sampler.starts??(group.id==='SU2'?['COLD','HOT_HAAR']:['COLD','DISORDERED_EXPONENTIAL']);
    check(Array.isArray(starts)&&starts.length>=1&&starts.length<=4&&starts.every(s=>['COLD','HOT_HAAR','DISORDERED_EXPONENTIAL'].includes(s)),'INVALID_INPUT','Provide 1..4 explicit replica starts: COLD, HOT_HAAR, or DISORDERED_EXPONENTIAL.');
    if(starts.includes('HOT_HAAR'))check(group.id==='SU2','UNSUPPORTED','A Haar hot-start constructor is implemented only for actual SU(2). Exponential starts for other groups are explicitly not Haar.');
    const settings={algorithm,seed:seed(sampler.seed??'m2-wilson-ensemble'),starts:starts.slice(),burnIn:integer(sampler.burnIn??32,0,10000,'burnIn'),samples:integer(sampler.samples??96,8,LIMITS.maxRetainedSamples,'samples'),thin:integer(sampler.thin??1,1,64,'thin'),stepSize:sampler.stepSize??.7,maxLag:integer(sampler.maxLag??64,2,512,'maxLag'),minimumESS:integer(sampler.minimumESS??50,20,1000,'minimumESS'),scan:'RANDOM_WITH_REPLACEMENT'};
    check(sampler.scan===undefined||sampler.scan===settings.scan,'UNSUPPORTED','The implemented scan selects each link uniformly with replacement.');
    check(finite(settings.stepSize,.000001,3),'INVALID_INPUT','stepSize must lie in [1e-6,3].');
    check(sampler.flow===undefined||sampler.flow===null,'UNSUPPORTED','No gradient flow adapter is implemented; a flow label cannot silently alter an ensemble.');
    const updates=estimate.activeLinks*(settings.burnIn+settings.samples*settings.thin)*starts.length;
    assertBudget(estimate,{ensemble:true,updates});return {...common,sampler:settings};
  }
  const initial=input.initial??{kind:'IDENTITY'},initialKind=initial.kind;
  knownKeys(initial,initialKind==='CLASSICAL_FIELD'?['kind','field','transportSteps']:initialKind==='EXPLICIT_LINKS'?['kind','links']:initialKind==='CENTER_HOLONOMY'?['kind','centerPower']:initialKind==='IDENTITY'?['kind']:['kind','seed'],'initial');
  check(['IDENTITY','PURE_GAUGE','CENTER_HOLONOMY','SEEDED_EXPONENTIAL','HOT_HAAR','CLASSICAL_FIELD','EXPLICIT_LINKS'].includes(initialKind),'UNSUPPORTED','No link initializer exists for the selected kind.');
  let init={kind:initialKind};
  if(['PURE_GAUGE','SEEDED_EXPONENTIAL','HOT_HAAR'].includes(initialKind))init.seed=seed(initial.seed??'m2-lattice-source');
  if(initialKind==='HOT_HAAR')check(group.id==='SU2','UNSUPPORTED','HOT_HAAR is implemented only for full SU(2).');
  if(initialKind==='CENTER_HOLONOMY'){
    check(group.spec.family==='SU'&&lattice.temporalBoundary==='PERIODIC','UNSUPPORTED','The central temporal-holonomy initializer requires SU(N), defining representation, and periodic Euclidean time.');
    init.centerPower=integer(initial.centerPower??1,0,group.spec.parameter-1,'centerPower');
  }
  if(initialKind==='CLASSICAL_FIELD'){
    init.field=normalizeFieldSpec(group,initial.field);init.transportSteps=integer(initial.transportSteps??8,1,32,'transportSteps');
    check(init.field.units.length===lattice.lengthUnit,'INVALID_INPUT','Field and lattice length units must match before discretization.');
    const bcs=[lattice.spatialBoundary,lattice.spatialBoundary,lattice.spatialBoundary,lattice.temporalBoundary],extents=[lattice.Ns*lattice.as,lattice.Ns*lattice.as,lattice.Ns*lattice.as,lattice.Nt*lattice.at];
    if(bcs.includes('PERIODIC'))check(init.field.domain.kind==='PERIODIC_TORUS'&&extents.every((L,j)=>Math.abs(L-init.field.domain.periods[j])<=1e-12*Math.max(1,L)),'UNSUPPORTED','Periodic lattice links require a periodic classical field with exactly matching periods. A BPST window cannot be periodically copied.');
    if(init.field.domain.kind==='R4_WINDOW'){
      const sizes=[lattice.Ns,lattice.Ns,lattice.Ns,lattice.Nt],a=[lattice.as,lattice.as,lattice.as,lattice.at];
      check(sizes.every((n,j)=>lattice.origin[j]>=init.field.domain.bounds[j][0]&&lattice.origin[j]+(n-1)*a[j]<=init.field.domain.bounds[j][1]),'INVALID_INPUT','Every open lattice link must remain inside the declared classical field window.');
    }
  }
  if(initialKind==='EXPLICIT_LINKS'){
    check(Array.isArray(initial.links)&&initial.links.length===estimate.sites*4,'INVALID_INPUT','Explicit links must contain 4V entries, using null only for absent outward open-boundary links.');
    init.links=structuredClone(initial.links);
  }
  assertBudget(estimate,{integrations:initialKind==='CLASSICAL_FIELD'?estimate.activeLinks*init.transportSteps*3:0});
  return {...common,initial:init,gaugeCheckSeed:seed(input.gaugeCheckSeed??'m2-independent-site-gauge')};
}
export function checkpoint(context,info){context.checkCancelled?.();context.onCheckpoint?.(info);}
export async function yieldToRuntime(context,info){checkpoint(context,info);await new Promise(resolve=>setTimeout(resolve,0));context.checkCancelled?.();}
