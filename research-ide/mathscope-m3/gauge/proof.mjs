import {createGroup} from '../../mathscope-m1/gauge/groups.mjs';
import {createField,evaluateField} from '../../mathscope-m1/gauge/fields.mjs';
import {defaultField} from './field-family.mjs';
import {check,text,positive,known,sha256,canonical,CONTINUUM_OBLIGATIONS} from './contracts.mjs';
import {PINNED_GAUGE_AUDIT,PINNED_GAUGE_SOURCES,PINNED_GAUGE_REAL_AUDIT,PINNED_GAUGE_REAL_RELEASE} from './proof-data.mjs';

const SEMANTICS=['DECLARED_GAP','YM_EXISTENCE','UNIQUE_VACUUM','FIELD_SPECTRUM_MODEL','RECONSTRUCTION_ON_DOMAIN','FULL_SPECTRUM_INCLUSION'];
const SEMANTIC_CONTRACTS={
 DECLARED_GAP:{quantifier:'FIXED_MODEL_FIXED_DELTA',meaning:'Every positive energy in the complete spectrum of the identified model is at least the specified positive Delta.'},
 YM_EXISTENCE:{quantifier:'EXISTS_MODEL_AND_SOME_POSITIVE_GAP',meaning:'There exists an identified nontrivial quantum Yang–Mills model and some positive gap; no chosen slider value is asserted.'},
 UNIQUE_VACUUM:{quantifier:'FIXED_MODEL_FULL_VACUUM',meaning:'The full ground eigenspace of this exact model is one-dimensional, with the declared vacuum used in the connected observable.'},
 FIELD_SPECTRUM_MODEL:{quantifier:'MODEL_DEFINITION',meaning:'The declared field family and declared finite spectrum belong to one explicitly identified effective-model definition; no quantum reconstruction is asserted.'},
 RECONSTRUCTION_ON_DOMAIN:{quantifier:'ALL_POINTS_IN_DECLARED_DOMAIN',meaning:'The declared reconstruction is a left inverse of the declared observation on every point of the specified source domain.'},
 FULL_SPECTRUM_INCLUSION:{quantifier:'ALL_POSITIVE_ORIGINAL_ENERGIES',meaning:'Every positive original-model energy belongs to the declared certified observed spectrum, covering the entire original nonvacuum space.'}
};
export async function registerAssumptions(records=[],models=[]){
 check(Array.isArray(records)&&records.length<=64&&Array.isArray(models),'ASSUMPTION_REGISTRY','The registry requires a bounded list of typed assumptions and explicit model checks.');const registry=[];
 for(const item of records){
  known(item,['id','semanticType','modelId','group','energyUnit','delta','quantifier','origin','sourceRevision','sourceHash','sourceRef','dependsOn','domain','statement'],'assumption');
  const id=text(item.id,'assumption id'),semanticType=text(item.semanticType,'semanticType');check(SEMANTICS.includes(semanticType),'BROAD_AXIOM_FORBIDDEN','Only fixed YM/gap/vacuum/model/reconstruction/spectrum semantics can be registered. An arbitrary Prop or universal truth axiom is prohibited.');
  check(['USER','PAPER','HEURISTIC','DEFINITION'].includes(item.origin),'ASSUMPTION_ORIGIN','Declare USER, PAPER, HEURISTIC or DEFINITION provenance.');
  ['modelId','group','energyUnit','sourceRevision','sourceHash'].forEach(k=>text(item[k],k));
  check(['FIXED_MODEL_FIXED_DELTA','EXISTS_MODEL_AND_SOME_POSITIVE_GAP','ALL_POINTS_IN_DECLARED_DOMAIN','FIXED_MODEL_FULL_VACUUM','MODEL_DEFINITION','ALL_POSITIVE_ORIGINAL_ENERGIES'].includes(item.quantifier),'QUANTIFIER_SCOPE','A typed exact quantifier is required; a slider cannot strengthen an existential assumption.');
  check(item.quantifier===SEMANTIC_CONTRACTS[semanticType].quantifier,'SEMANTIC_QUANTIFIER_MISMATCH','The quantifier must match the fixed mathematical meaning of this assumption type.');
  check(/^[0-9a-f]{64}$/i.test(item.sourceHash),'SOURCE_HASH_FORMAT','An assumption source hash must be a complete SHA-256 digest.');
  if(item.dependsOn!==undefined)check(Array.isArray(item.dependsOn)&&item.dependsOn.every(x=>typeof x==='string'),'ASSUMPTION_DEPENDENCIES','Dependent assumptions must be identified by a list of IDs.');
  if(semanticType==='DECLARED_GAP'){
   positive(item.delta,'assumed Delta');check(item.quantifier==='FIXED_MODEL_FIXED_DELTA','QUANTIFIER_SCOPE','A declared gap refers to one identified model and a specified Delta.');
   for(const m of models.filter(m=>m.modelId===item.modelId)){check(m.energyUnit===item.energyUnit,'UNIT_CONFLICT','Explicit conversion is required before comparing spectral assumptions in different units.');check(!m.positiveEnergies.some(e=>e>0&&e<item.delta),'CONFLICTING_GAP_ASSUMPTION','An existing positive energy lies below the asserted lower bound for this exact model.');}
  }
  if(semanticType==='YM_EXISTENCE')check(item.quantifier==='EXISTS_MODEL_AND_SOME_POSITIVE_GAP'&&item.delta===undefined,'EXISTENTIAL_GAP_NOT_SLIDER','The existing existence axiom asserts some model and some positive gap; it does not assert every selected slider Delta.');
  if(semanticType==='RECONSTRUCTION_ON_DOMAIN')check(item.domain&&item.quantifier==='ALL_POINTS_IN_DECLARED_DOMAIN','RECONSTRUCTION_DOMAIN','A reconstruction claim requires its explicit domain.');
  if(semanticType==='FULL_SPECTRUM_INCLUSION')check(item.quantifier==='ALL_POSITIVE_ORIGINAL_ENERGIES','SPECTRUM_DIRECTION','The original positive spectrum must be included in the observed certified spectrum, not the reverse.');
  check(!registry.some(x=>x.id===id),'DUPLICATE_ASSUMPTION','Assumption identifiers must be unique in a revision.');registry.push({...item,fixedMeaning:SEMANTIC_CONTRACTS[semanticType].meaning,statementRole:'User statement is an annotation; it cannot replace the fixed typed meaning.',revisionHash:await sha256(item),status:item.origin==='DEFINITION'?'MODEL_DEFINITION':'DECLARED_ASSUMPTION',theoremEstablished:false});
 }
 const byId=new Map(registry.map(r=>[r.id,r]));
 for(const r of registry)for(const id of r.dependsOn??[])check(byId.has(id),'MISSING_ASSUMPTION_DEPENDENCY','Every dependent assumption must exist in the same revision.');
 const visited=new Set(),active=new Set();
 const visit=id=>{check(!active.has(id),'CYCLIC_ASSUMPTION_DEPENDENCY','A circular assumption dependency is not a proof.');if(visited.has(id))return;active.add(id);for(const dep of byId.get(id).dependsOn??[])visit(dep);active.delete(id);visited.add(id);};
 for(const r of registry)visit(r.id);
 return {registry,registryHash:await sha256(registry),automaticExistenceTheorem:false,conditionalConclusionRequires:registry.filter(r=>r.origin!=='DEFINITION').map(r=>r.id)};
}
export async function projectionCounterexample(){
 const group={family:'SU',parameter:2,globalForm:'SIMPLY_CONNECTED',representation:'DEFINING'},a=defaultField(0),b=defaultField(0);a.center[3]=.5;b.center[3]=-.5;const fa=createField(createGroup(group),a),fb=createField(createGroup(group),b),points=[];
 for(const x of [-1,0,1])for(const y of [-1,0,1])for(const z of [-1,0,1]){const p=[x,y,z,0];points.push({x3:[x,y,z],sourceA:evaluateField(fa,p).density.topologicalDensity,sourceB:evaluateField(fb,p).density.topologicalDensity});}
 const off=[0,0,0,1],qa=evaluateField(fa,off).density.topologicalDensity,qb=evaluateField(fb,off).density.topologicalDensity;
 return {kind:'EXPLICIT_DISTINCT_4D_SOURCE_SAME_3D_SCALAR_VIEW',sourceA:{hash:await sha256(a),field:a},sourceB:{hash:await sha256(b),field:b},observation:'BPST topological-density slice at x4=0',points,sliceMaximumDifference:Math.max(...points.map(p=>Math.abs(p.sourceA-p.sourceB))),offSlice:{coordinate:off,valueA:qa,valueB:qb,different:Math.abs(qa-qb)>1e-10},analyticReason:'At x4=0 the squared distances to centers +1/2 and -1/2 are equal for all x1,x2,x3; at x4=1 they differ. Thus the slice density agrees everywhere, yet the four-dimensional sources differ.',marginalAlsoIdentical:'Integration over the entire x4 axis is translation invariant. A finite-window marginal need not agree unless the window symmetry supplies a separate argument.',conclusion:'A scalar 3D image does not determine the full 4D connection or its quantum spectrum.',leanTarget:'MathScope.M3.Gauge.projection_collision',leanScope:'The shipped point-projection theorem proves noninjectivity. The separate BPST density identity is derived from the displayed analytic formula, not claimed as kernel-checked Real analysis.'};
}
export function projectionClaimContract(input={}){
 known(input,['claimType','domain','observable','projection','fibreCertificate','reconstructionCertificate','spectrumInclusion','assumptionIds'],'projection claim');
 check(['OBSERVATION','CONDITIONAL_4D_PROPERTY','CONDITIONAL_GAP_TRANSFER'].includes(input.claimType),'CLAIM_TYPE','Only an observation or an explicitly conditional transfer can be exported.');
 text(input.observable,'observable');text(input.projection,'projection');check(input.domain,'CLAIM_DOMAIN','The exact original domain is required.');
 if(input.claimType==='CONDITIONAL_4D_PROPERTY')check(input.fibreCertificate||input.reconstructionCertificate,'FIBRE_OR_RECONSTRUCTION_REQUIRED','A picture match does not imply a four-dimensional property. Declare the required fibre-constancy or restricted-reconstruction hypothesis.');
 if(input.claimType==='CONDITIONAL_GAP_TRANSFER')check(input.spectrumInclusion?.direction==='ORIGINAL_POSITIVE_SUBSET_OBSERVED_POSITIVE'&&input.spectrumInclusion?.fullOriginalSpectrum===true,'FULL_SPECTRUM_INCLUSION_REQUIRED','One observed channel generally has the opposite inclusion direction. The complete original nonvacuum spectrum must be covered.');
 return {...input,status:input.claimType==='OBSERVATION'?'OBSERVATION_ONLY':'CONDITIONAL_CONTRACT_NOT_A_PROOF',formalVerified:false,assumptionIds:input.assumptionIds??[],kernelRequirements:['Exact claim type','Exact source and domain hash','Evidence for every supplied premise','A fresh or exactly matching source-bound kernel receipt'],prohibitedPromotion:'A user-supplied certificate-shaped object is a hypothesis until its own proof is checked.'};
}
export async function auditProofSources(edits={}){
 check(edits&&typeof edits==='object'&&!Array.isArray(edits),'SOURCE_EDITS','Source edits must map a known source path to complete text.');const unknown=Object.keys(edits).filter(path=>!PINNED_GAUGE_SOURCES.some(s=>s.path===path));check(!unknown.length,'UNKNOWN_PROOF_SOURCE','The audit cannot certify an unknown proof source.');
 const sourceChecks=[];for(const source of PINNED_GAUGE_SOURCES){const content=edits[source.path]??source.content,hash=await sha256(content);sourceChecks.push({path:source.path,kernelScope:source.kernelScope??'FINITE_AND_LEGACY',sha256:hash,recordedSha256:source.sha256,match:hash===source.sha256,status:hash===source.sha256?'PINNED_KERNEL_SOURCE_MATCH':'STALE_NEW_KERNEL_REQUIRED'});}
 const current=sourceChecks.every(s=>s.match),baseCurrent=sourceChecks.filter(s=>s.kernelScope==='FINITE_AND_LEGACY').every(s=>s.match),realCurrent=PINNED_GAUGE_REAL_AUDIT!==null&&sourceChecks.filter(s=>s.kernelScope.startsWith('REAL_FINITE')).every(s=>s.match);
 const realFiniteKernel={status:realCurrent?PINNED_GAUGE_REAL_AUDIT.status:PINNED_GAUGE_REAL_AUDIT?'UNVERIFIED_SOURCE_CHANGED':'NOT_NEWLY_KERNEL_CHECKED',newBrowserKernelExecution:false,observedCI:PINNED_GAUGE_REAL_RELEASE,modelScope:'Typed finite modelId, cutoff, complete Fin spectrum and exact whole vacuum; no Wilson full-Hilbert-space or continuum identification.',targets:PINNED_GAUGE_REAL_AUDIT?.targets??[],hypothesisRemovalControls:PINNED_GAUGE_REAL_AUDIT?.hypothesisRemovalControls??[],environment:PINNED_GAUGE_REAL_AUDIT?.environment??null,customAxioms:PINNED_GAUGE_REAL_AUDIT?.customAxioms??null,genericCertificateDoesNotVerifyEditedJSON:true};
 return {status:current?'PINNED_KERNEL_AUDIT_MATCH':'UNVERIFIED_SOURCE_CHANGED',newKernelExecution:false,sourceChecks,audit:PINNED_GAUGE_AUDIT,finiteKernelStatus:baseCurrent?PINNED_GAUGE_AUDIT.status:'UNVERIFIED',legacyCoreTen:PINNED_GAUGE_AUDIT.legacyCoreTen,standardAxioms:['propext','Classical.choice','Quot.sound'],userAxioms:PINNED_GAUGE_AUDIT.legacyCustomAxioms,groups:'Existing exact SU3 and compact G2 finite data are included in the protected M1 source audits.',realFiniteKernel,realExponentialAndLogarithmBridge:realCurrent?'SOURCE_MATCHED_OBSERVED_CI_KERNEL_PASS; finite weighted Real.exp sum, full nonvacuum log-ratio enclosure and their composed exponential bound. Edited numerical inputs retain separate proof obligations.':'UNVERIFIED_REAL_BRIDGE; a fresh matching kernel receipt is required.',continuumObligations:CONTINUUM_OBLIGATIONS,continuumGap:'OPEN_CONTINUUM'};
}
export async function runProofAudit(input={}){known(input,['edits','assumptions','spectralModels','projectionClaim'],'proof audit input');const audit=await auditProofSources(input.edits??{}),registry=await registerAssumptions(input.assumptions??[],input.spectralModels??[]),counterexample=await projectionCounterexample();return {kind:'proof-audit',status:'COMPLETED',sourceHash:await sha256({sourceChecks:audit.sourceChecks,registryHash:registry.registryHash}),evidenceGrade:audit.status==='PINNED_KERNEL_AUDIT_MATCH'?'FORMAL_FINITE_AND_EXPLICIT_CONDITIONAL':'UNVERIFIED',audit,assumptions:registry,projectionCounterexample:counterexample,projectionClaim:input.projectionClaim?projectionClaimContract(input.projectionClaim):null,continuumObligations:CONTINUUM_OBLIGATIONS,continuumGap:'OPEN_CONTINUUM'};}

export function revisionImpact(previous,next){
 const changed=[...new Set([...Object.keys(previous),...Object.keys(next)])].filter(k=>canonical(previous[k]??null)!==canonical(next[k]??null));
 const sceneOnly=changed.every(k=>['camera','independentColorScale'].includes(k));
 const assumedDeltaOnly=changed.every(k=>['deltas','delta'].includes(k))&&(next.mode??previous.mode)==='DECLARED_LOWER_BOUND';
 const unitsDeltaOnly=changed.every(k=>['deltas','delta'].includes(k))&&(next.mode??previous.mode)==='UNITS_RESCALING';
 return {changed,sceneStale:changed.length>0,originalFieldStale:changed.length>0&&!sceneOnly&&!assumedDeltaOnly&&!unitsDeltaOnly,observationStale:changed.length>0&&!sceneOnly&&!assumedDeltaOnly,assumptionStale:assumedDeltaOnly||changed.some(k=>['assumptions','mode','assumptionId','deltas','delta'].includes(k)),proofStale:changed.length>0&&!sceneOnly&&!unitsDeltaOnly,oldResultUsable:changed.length===0||sceneOnly,reason:sceneOnly?'Camera and color changes alter presentation only.':assumedDeltaOnly?'Only the declared gap assumption changes; the original field and samples are preserved.':unitsDeltaOnly?'Display units change without constructing a new physical source.':'Mathematical source or premise changes require recomputation and matching evidence.'};
}
