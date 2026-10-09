import {assertValid,canonicalStringify,sha256,EVIDENCE_GRADES} from '../../mathscope-m0/contracts.mjs';
import {createNode,addNode,addEdge,referenceOf,verifyResearchM0Namespace} from '../../mathscope-m0/session.mjs';
import {clone,normalizeRequest,validateDomainRequest,M1_VERSION} from './registry.mjs';
import {REFERENCES} from './audit-data.mjs';
import {ANALYTIC_CONTRACTS} from './analytic-contracts.mjs';
import {WORKER_SHA256} from './worker-data.mjs';

const TYPES={'arithmetic.primes':'PrimeSetQuery','arithmetic.primeCertificate':'PrimeSetQuery','arithmetic.padic':'PadicObject','arithmetic.point':'PointComparison','arithmetic.p1':'P1Comparison','arithmetic.localFactors':'LocalFactorFamily','arithmetic.verify':'ValidationFixture','gauge.group':'GaugeGroup','gauge.field':'Connection4D','gauge.family':'StateFamily','gauge.holonomy':'Holonomy','gauge.spectral':'SpectralModel','ns.provenance':'NavierStokesComponent','ns.coordinates':'NavierStokesComponent','ns.heat':'NavierStokesComponent','ns.exterior':'NavierStokesComponent','ns.axis-series':'NavierStokesComponent','ns.moments':'NavierStokesComponent','ns.cone':'NavierStokesComponent','ns.benchmark':'NavierStokesComponent','ns.leading-profile':'LeadingProfileCandidate','ns.validate':'ValidationFixture','ns.axis-certificate':'NavierStokesComponent','ns.source-outer':'NavierStokesComponent','ns.controlled-continuation':'NavierStokesComponent','ns.admissible-loop':'NavierStokesComponent','ns.pressure-certificate':'NavierStokesComponent','ns.axis-source-certificate':'NavierStokesComponent','ns.radial-modulation':'NavierStokesComponent','ns.source-inner-gluing':'NavierStokesComponent'};
const sameRef=(a,b)=>a?.id===b?.id&&a?.revision===b?.revision&&a?.hash===b?.hash;
function current(ns,ref,kind){const n=ns.nodes.find(n=>sameRef(n,ref));if(!n||n.freshness!=='CURRENT'||(kind&&n.kind!==kind))throw Error('Referenced input was changed or quarantined: '+ref.id);return n;}
async function namespace(ns){const r=await verifyResearchM0Namespace(ns);if(!r.ok)throw Error('Session contract: '+r.errors.join('; '));}
const prepBody=p=>{const {preparationHash,...body}=p;return body;};
async function constructedComponents(job,raw){
  const nodes=[],sourceRefs=job.sourceRefs;
  if(raw.groupSpec?.schema==='MathScope.GaugeGroupSpec/1'){
    const id='m1-group:'+(await sha256({group:raw.groupSpec,sourceRefs})).slice(0,20),payload={...clone(raw.groupSpec),id,revision:id+':r1',sourceRefs,assumptionRefs:[]};
    const group=await createNode({kind:'GaugeGroupSpec',payload});nodes.push(group);
    if(raw.stateFamilySpec?.schema==='MathScope.StateFamilySpec/1'){
      const aidRefs=[];
      for(const record of raw.assumptionRecords||[]){const aid='m1-field-assumption:'+(await sha256({record,sourceRefs})).slice(0,16),a=await createNode({kind:'AssumptionSpec',payload:{...clone(record),id:aid,revision:aid+':r1',sourceRefs,usedBy:[]}});nodes.push(a);aidRefs.push(referenceOf(a));}
      const fid='m1-field-family:'+(await sha256({state:raw.stateFamilySpec,sourceRefs})).slice(0,20),family={...clone(raw.stateFamilySpec),id:fid,revision:fid+':r1',sourceRefs,assumptionRefs:[...job.assumptionRefs,...aidRefs],gaugeGroupRef:referenceOf(group)};
      if(family.fieldConstruction.embedding){family.fieldConstruction.embedding.codomainRef=referenceOf(group);family.fieldConstruction.embedding.sourceRefs=sourceRefs;}
      nodes.push(await createNode({kind:'StateFamilySpec',payload:family}));
    }
  }
  if(raw.status==='COMPLETED'&&raw.results&&['arithmetic.point','arithmetic.p1'].includes(job.adapter.id)){
    const input=job.input.input,p=String(input.p||3),D=job.input.precision.D||input.D||1,N=job.input.precision.N||input.N||4,isP1=job.adapter.id==='arithmetic.p1';
    const id='m1-prism:'+(await sha256({kind:job.adapter.id,p,D,N,sourceRefs})).slice(0,20);
    const payload={schema:'MathScope.PrismSpec/1',id,revision:id+':r1',sourceRefs,assumptionRefs:job.assumptionRefs,p,ring:{kind:'PADIC_INTEGER_RING',presentation:'Z_'+p+' = lim_N Z/'+p+'^N Z',completion:p+'-adic completion'},ideal:{generators:[p],presentation:'I=('+p+')'},delta:{rule:'delta(a)=(a-a^'+p+')/'+p,inputExtraDigits:1,convention:'Frobenius lift phi_A=id on Z_p'},frobenius:{rule:isP1?'t -> t^'+p+', s -> s^'+p+'; multiplication by p on the cohomology class [dt/t]':'Identity on H0 of the point',convention:'Crystalline absolute Frobenius; coefficient Frobenius phi_A=id',semilinear:true,cutoffRule:isP1?'C(D) -> C(pD); full source and target matrices retained':'No chart-weight cutoff is needed for the point'},geometricObject:{kind:isP1?'PROJECTIVE_SPACE':'POINT',presentation:isP1?'P^1/F_'+p+' with t,s=t^-1 and the smooth proper Z_p lift':'Spec F_'+p+' with lift Spf Z_'+p,dimension:isP1?1:0},hypotheses:{smooth:true,proper:true,details:['Standard smooth proper point/projective-line geometry.','The actual finite complex and contraction are attached to the domain result.','The completed geometric comparison retains its explicitly cited external theorem dependency.']},comparison:{status:'THEOREM_REFERENCE',theorem:'Bhatt-Scholze Theorem 1.8(1) and Bhatt-de Jong Theorem 3.6/Corollary 3.8; phi_A=id specializes the base twist.',sourceRefs},prismPredicate:{status:'THEOREM_REFERENCE',statement:'The bounded crystalline prism (Z_p,(p)); finite Z/p^N observations are coefficient reductions and are not themselves asserted to be prisms.',sourceRefs},scope:{kind:'FINITE',pAdic:{p,digits:N},series:{order:isP1?D:0}},semanticStatus:'COMPARISON_MODEL'};
    nodes.push(await createNode({kind:'PrismSpec',payload}));
  }
  return nodes;
}
function includesAssumedGap(value){if(!value||typeof value!=='object')return value==='ASSUMED_BOUND';return Object.values(value).some(includesAssumedGap);}
export function precisionContract(request){
  const p=request.precision;
  if(['ns.axis-certificate','ns.axis-source-certificate','ns.pressure-certificate'].includes(request.kind))return {kind:'EXACT',description:'Exact rational decisions and bounds for the explicitly specified local analytic datum; theorem correspondence remains a cited premise, and plot coordinates use binary64.',propagation:{domainPrecision:clone(p),displayOnly:'IEEE754 binary64 enclosure centers and logarithmic plotting coordinates'}};
  if(p.kind==='PADIC'&&Number.isSafeInteger(p.digits))return {kind:'PADIC',p:String(p.p||request.input.p||5),digits:p.digits,guardDigits:p.guardDigits||0,description:'The domain result records available input digits, requested output digits and actual losses.'};
  return {kind:request.kind.startsWith('arithmetic.')?'EXACT':'FLOAT64',description:request.kind.startsWith('arithmetic.')?'Exact integer/rational/finite-ring arithmetic; p-adic information loss is reported separately.':'Floating point evaluation with domain-specific truncation/residual/rounding diagnostics; no interval certification implied.',propagation:{domainPrecision:clone(p)}};
}
export async function prepareM1SessionJob(ns,input,environment,{id,assumptionRefs=[]}={}) {
  await namespace(ns);const request=normalizeRequest(input),valid=await validateDomainRequest(request);
  if(!valid.ok)throw Error('Domain input: '+(valid.errors||[valid.message]).map(e=>typeof e==='string'?e:e?.message||e?.code||'Invalid input').join('; '));
  if(!TYPES[request.kind])throw Error('No typed session adapter for this operation.');
  if(!environment?.workerSha256||!environment.hash)throw Error('Installed worker provenance is required.');
  const {hash:environmentHash,...environmentBody}=environment;
  if(environment.workerSha256!==WORKER_SHA256||await sha256(environmentBody)!==environmentHash)throw Error('The environment must match the installed static worker.');
  const explicitAssumptionRefs=clone(assumptionRefs);
  const plannedNodes=[],sourceId='m1-source:'+environment.workerSha256.slice(0,16);
  const source=await createNode({kind:'SourceManifest',payload:{schema:'MathScope.SourceManifest/1',id:sourceId,revision:sourceId+':r1',entries:[{id:'m1-static-domain-worker',kind:'CODE',title:'MathScope M1 statically bundled mathematical domain worker',uri:'urn:mathscope:m1:worker:'+environment.workerSha256,sha256:environment.workerSha256,availability:'AVAILABLE',version:M1_VERSION,locator:'Exact source exported in the M1 source archive'}]}});
  plannedNodes.push(source);const sourceRefs=[referenceOf(source)];assumptionRefs=clone(assumptionRefs);
  const citations=REFERENCES.filter(r=>r.domains?.includes(request.kind.split('.')[0]));
  if(citations.length){
    const sid='m1-papers:'+(await sha256(citations)).slice(0,16);
    const node=await createNode({kind:'SourceManifest',payload:{schema:'MathScope.SourceManifest/1',id:sid,revision:sid+':r1',entries:citations.map(r=>({id:r.id,kind:'PAPER',title:r.title,uri:r.url,sha256:r.sha256||null,availability:r.sha256?'AVAILABLE':'REFERENCED',locator:r.locator||null,version:r.version||null}))}});
    plannedNodes.push(node);sourceRefs.push(referenceOf(node));
  }
  for(const r of assumptionRefs)current(ns,r,'assumption');
  if(includesAssumedGap(request.input)){
    const assumptionId='m1-assume-gap:'+(await sha256({input:request.input,sourceRefs})).slice(0,16);
    const a=await createNode({kind:'AssumptionSpec',payload:{schema:'MathScope.AssumptionSpec/1',id:assumptionId,revision:assumptionId+':r1',statement:'The positive spectral lower bound declared in this exact finite input is ASSUMED: '+canonicalStringify(request.input),reason:'Conditional exploration. An input bound does not construct a continuum quantum Yang–Mills theory or prove its mass gap.',origin:'USER_AXIOM',status:'DECLARED',sourceRefs,usedBy:[],scope:{kind:'SYMBOLIC',definition:'Only the explicitly declared conditional spectral model'},introducedBy:'M1 explicit ASSUMED_BOUND mode'}});
    plannedNodes.push(a);assumptionRefs.push(referenceOf(a));
  }
  const objectType=TYPES[request.kind],domain=request.kind.startsWith('gauge.')?'GAUGE':request.kind.startsWith('ns.')?'PDE':['PointComparison','P1Comparison'].includes(objectType)?'COHOMOLOGY':objectType==='ValidationFixture'?'VERIFICATION':'ARITHMETIC';
  const scope={kind:'FINITE',finite:{description:'Explicit finite '+request.kind+' request; itemCount records the maximum retained items, with actual bounds and discretization in request.input.',itemCount:request.budget.maxItems}},precision=precisionContract(request);
  const mathematicalRequest={kind:request.kind,input:request.input,precision:request.precision},objectId='m1-object:'+(await sha256({mathematicalRequest,assumptionRefs,sourceRefs,scope,precision})).slice(0,20);
  const model=await createNode({kind:'M1ObjectSpec',payload:{schema:'MathScope.M1ObjectSpec/1',id:objectId,revision:objectId+':r1',sourceRefs,assumptionRefs,domain,objectType,description:objectType+' generated from the exact immutable request below.',request:mathematicalRequest,scope,precision,interpretation:{finiteComputation:true,externalComparison:['PointComparison','P1Comparison'].includes(objectType)||['ns.axis-certificate','ns.axis-source-certificate','ns.pressure-certificate'].includes(request.kind)?'THEOREM_REFERENCE':objectType==='LeadingProfileCandidate'?'REQUIRED':'NOT_USED',continuumClaim:false,universalProof:false}}});
  plannedNodes.push(model);
  const job={schema:'MathScope.ComputeJobSpec/1',id,modelRef:referenceOf(model),adapter:{id:request.kind,version:M1_VERSION},sourceRefs,assumptionRefs,scope,precision,seed:request.input.seed==null?null:String(request.input.seed),domain:{domain,objectType,sourceDimension:domain==='GAUGE'?4:domain==='PDE'?3:null},basis:{definition:'Exactly the representation, chart, coordinate and coefficient conventions in the immutable domain input.'},budget:Object.fromEntries(['maxMillis','maxBytes','maxItems','maxOperations'].map(k=>[k,request.budget[k]])),input:{...mathematicalRequest,domainBudget:request.budget}};
  assertValid('ComputeJobSpec',job);
  const prepared={schema:'MathScope.M1PreparedSessionJob/1',job,request,plannedNodes,baselineHash:ns.baselineHash,environment:clone(environment),explicitAssumptionRefs,inputHash:await sha256(request)};
  return {...prepared,preparationHash:await sha256(prepared)};
}
function gradeOf(receipt){const g=receipt.result.evidenceGrade||receipt.result.evidence?.grade;return ['COMPLETED','PARTIAL'].includes(receipt.status)?EVIDENCE_GRADES.includes(g)&&!['FORMAL PASS','THEOREM-BACKED'].includes(g)?g:'NUMERICAL INDICATOR':'UNKNOWN';}
export async function saveM1SessionJob(ns,prepared,receipt,engine) {
  await namespace(ns);
  if(prepared?.schema!=='MathScope.M1PreparedSessionJob/1'||await sha256(prepBody(prepared))!==prepared.preparationHash)throw Error('Prepared domain input was modified.');
  if(!await engine.verifyReceipt(receipt))throw Error('A fresh receipt from this installed engine is required; imported JSON cannot issue evidence.');
  const expected=await prepareM1SessionJob(ns,receipt.request,await engine.environment(),{id:receipt.id,assumptionRefs:prepared.explicitAssumptionRefs});
  if(expected.preparationHash!==prepared.preparationHash)throw Error('The source, mathematical object or assumption binding was modified.');
  if(receipt.id!==prepared.job.id||receipt.inputHash!==prepared.inputHash||receipt.environmentHash!==prepared.environment.hash||canonicalStringify(receipt.request)!==canonicalStringify(prepared.request))throw Error('Mathematical input, environment or job identity mismatch.');
  if(await sha256(receipt.result)!==receipt.resultHash)throw Error('Computed values changed after execution.');
  if(ns.baselineHash!==prepared.baselineHash)throw Error('Different session baseline.');
  let state=clone(ns);
  for(const n of prepared.plannedNodes){
    const prior=state.nodes.find(x=>x.id===n.id);
    if(prior){if(!sameRef(prior,n)||prior.freshness!=='CURRENT')throw Error('Planned mathematical input was revised: '+n.id);}
    else state=await addNode(state,{kind:n.kind,id:n.id,revision:n.revision,payload:n.payload},{allowUnresolvedRefs:false});
  }
  for(const ref of [...prepared.job.sourceRefs,...prepared.job.assumptionRefs,prepared.job.modelRef])current(state,ref);
  const j=prepared.job,raw=receipt.result,ledger=raw.errorLedger||raw.errorBudget||{};
  const components=await constructedComponents(j,raw);
  for(const component of components){
    const prior=state.nodes.find(n=>n.id===component.id);
    if(prior){if(!sameRef(prior,component)||prior.freshness!=='CURRENT')throw Error('A constructed mathematical object was revised: '+component.id);}
    else state=await addNode(state,{id:component.id,kind:component.kind,revision:component.revision,payload:component.payload},{allowUnresolvedRefs:false});
  }
  // Domain-internal references remain inside M0's existing opaque snapshot boundary.
  // Actual graph components are independently typed, rebound and linked above/below.
  const envelope={schema:'MathScope.ResultEnvelope/1',jobId:j.id,inputHash:receipt.inputHash,environmentHash:receipt.environmentHash,status:receipt.status,scope:j.scope,precision:j.precision,values:{domainResult:{schema:'MathScope.M1DomainSnapshot/1',contentHash:receipt.resultHash,snapshot:raw}},errorLedger:Object.fromEntries(['rounding','discretization','tail','residual','stability','statistical'].map(k=>[k,ledger[k]??{status:'SEE_DOMAIN_REPORT',meaning:'No numeric bound is inferred when the domain adapter does not report one.'}])),provenance:{modelRef:j.modelRef,sourceRefs:j.sourceRefs,assumptionRefs:j.assumptionRefs,adapter:j.adapter,seed:j.seed,domain:j.domain,basis:j.basis,environment:prepared.environment,domainInputHash:receipt.inputHash,domainResultHash:receipt.resultHash},evidence:{grade:gradeOf(receipt),scopeKind:j.precision.kind==='EXACT'?'exact-finite':'numerical',supportsCurrent:false,effectiveTrust:'BOUNDED_COMPUTATION_RECORD_NOT_FORMAL_AUTHORITY',statement:'Result of the exact recorded finite-domain request. Domain checks and open obligations remain attached. Graph metadata cannot establish a universal or continuum statement.',sourceRefs:j.sourceRefs,assumptionRefs:j.assumptionRefs},details:{domainStatus:raw.domainStatus??raw.status??null,replayAvailable:true}};
  envelope.details.requiredForInfiniteInferences=ANALYTIC_CONTRACTS.filter(c=>j.adapter.id.startsWith('ns.')?['series-termwise-derivative','axis-power-series','ns-profile-stability'].includes(c.id):j.adapter.id.startsWith('gauge.')?['continuum-limit','spectral-gap-semigroup'].includes(c.id):false);
  envelope.provenance.constructedObjectRefs=components.map(referenceOf);
  envelope.contentHash=await sha256(envelope);assertValid('ResultEnvelope',envelope);
  state=await addNode(state,{kind:'ComputeJobSpec',payload:j},{allowUnresolvedRefs:false});
  state=await addNode(state,{kind:'ResultEnvelope',id:'result:'+j.id,payload:envelope},{allowUnresolvedRefs:false});
  if(!state.edges.some(e=>e.id==='computes:'+j.id))state=await addEdge(state,{id:'computes:'+j.id,type:'COMPUTES',from:j.id,to:'result:'+j.id});
  for(const component of components){const id='component:'+component.id+':'+j.id;if(!state.edges.some(e=>e.id===id))state=await addEdge(state,{id,type:'DEPENDS_ON',from:component.id,to:'result:'+j.id});}
  return {namespace:state,modelRef:j.modelRef,resultId:'result:'+j.id,result:envelope};
}
