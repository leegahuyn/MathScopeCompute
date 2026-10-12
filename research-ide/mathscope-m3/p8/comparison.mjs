/** Supported M2 comparison diagrams; exact route checks do not import a Lean theorem. */
import {runJob} from '../../mathscope-m2/arithmetic/index.mjs';
import {NO_AUTHORITY,assertJSON,canonicalJSON,cloneJSON,shape,sha256,hashString,fail,freeze,issue} from './contracts.mjs';

const SCHEMA='MathScope.M3.P8.ComparisonDiagram/1';
const SOURCE={id:'S01',url:'https://people.mpim-bonn.mpg.de/scholze/prisms.pdf',method:'EXTERNAL_THEOREM'};
const ROUTES=Object.freeze({
  etale:['DERIVED_REDUCTION_MOD_PN','INVERT_PRISM_IDEAL','DERIVED_FROBENIUS_FIXED_POINTS'],
  etaleZp:['DERIVED_REDUCTION_MOD_PN','INVERT_PRISM_IDEAL','DERIVED_FROBENIUS_FIXED_POINTS','DERIVED_INVERSE_LIMIT_OVER_N'],
  deRham:['FROBENIUS_TWISTED_DERIVED_BASE_CHANGE_THETA','DERIVED_P_COMPLETION'],
  crystalline:['PRISM_MAP_TO_W_K','DERIVED_P_COMPLETED_BASE_CHANGE','CRYSTALLINE_COMPARISON']
});
const OPERATION={DERIVED_REDUCTION_MOD_PN:'TENSOR',INVERT_PRISM_IDEAL:'INVERSION',DERIVED_FROBENIUS_FIXED_POINTS:'DERIVED_FIXED_POINTS',DERIVED_INVERSE_LIMIT_OVER_N:'DERIVED_LIMIT',FROBENIUS_TWISTED_DERIVED_BASE_CHANGE_THETA:'FROBENIUS_TWIST',DERIVED_P_COMPLETION:'COMPLETION',PRISM_MAP_TO_W_K:'BASE_MAP',DERIVED_P_COMPLETED_BASE_CHANGE:'COMPLETED_TENSOR',CRYSTALLINE_COMPARISON:'QUASI_ISOMORPHISM'};

function normalizeRoute(request) {
  assertJSON(request,65536); shape(request,['kind','input'],['precision','budget'],'M2 route request');
  if (!request.input || typeof request.input!=='object' || Array.isArray(request.input)) fail('INVALID_ROUTE','Route input must be an object.');
  const allowed=request.kind==='arithmetic.projective' || request.kind==='arithmetic.comparison' && request.input.operation==='perfectPrism' || request.kind==='arithmetic.qDeRham' && request.input.operation==='cechP1';
  if (!allowed) fail('UNSUPPORTED_COMPARISON_ROUTE','Supported routes are projective, perfectPrism, and the actual cechP1 q-PD nerve.');
  return cloneJSON({kind:request.kind,input:request.input,precision:request.precision??{},budget:request.budget??{}});
}

async function makeRef(id,descriptor) { return {id,revision:'1',hash:await sha256({id,descriptor})}; }

export async function buildM2ComparisonDiagram(route,result) {
  const request=normalizeRoute(route), supplied=result===undefined?null:cloneJSON(result);
  // Rerun the bounded original M2 adapter. A supplied saved result is not authority.
  const fresh=await runJob(request);
  if (fresh.status!=='COMPLETED') fail('M2_COMPARISON_INCOMPLETE','Only a completed supported M2 result can supply this diagram.');
  if (supplied && canonicalJSON(supplied)!==canonicalJSON(fresh)) fail('M2_RESULT_MISMATCH','The supplied result differs from a fresh run of the original request.');
  const raw=fresh.results, nodes=[], edges=[], assumptions=[];
  const selectedBase=raw.base??raw.finitePerfectComparison?.base??{p:raw.object?.p??null,geometry:raw.object?.geometry??null,coefficientBase:'D = Z_p[[q-1]], with the original q-PD datum and prism ideal ([p]_q)'};
  const baseRef=await makeRef('selected-m2-base',selectedBase);
  const source={schema:fresh.schema,adapterVersion:fresh.version,kind:fresh.kind,inputHash:fresh.provenance.inputHash,resultHash:fresh.resultHash,sourceHash:fresh.provenance.sourceHash,verification:'FRESH_M2_RECOMPUTATION',serializedAuthority:'UNTRUSTED_REQUIRES_REEXECUTION'};
  async function assumption(name,statement,sourceRefs) {
    const body={id:`assumption:${name}`,revision:'1',statement,sourceRefs,evidenceMethod:'EXTERNAL_THEOREM',status:'SUPPORTED_BY_DECLARED_M2_SCOPE'};
    const hash=await sha256(body); assumptions.push({...body,hash}); return {id:body.id,revision:body.revision,hash};
  }
  async function node(name,label,ring,fieldPath,kind='PRISMATIC_VIA_COMPARISON') {
    const descriptor={ring,baseRef:cloneJSON(baseRef)}, ringId=`ring:${await sha256(descriptor)}`;
    const entry={id:name,label,objectKind:kind,baseRef:cloneJSON(baseRef),coefficientRingRef:await makeRef(ringId,descriptor),coefficientRing: ring,scope:'Only the explicitly supported completed M2 object and its finite observations.',sourceFieldPath:fieldPath};
    nodes.push(entry); return entry;
  }
  function edge(name,from,to,operation,sourceOperation,required,sourceTheoremRefs,detail) {
    edges.push({id:name,from:from.id,to:to.id,operation,sourceOperation,inputRingRef:cloneJSON(from.coefficientRingRef),outputRingRef:cloneJSON(to.coefficientRingRef),baseRef:cloneJSON(baseRef),requiredAssumptionRefs:cloneJSON(required),sourceTheoremRefs,detail,proofMethod:'EXTERNAL_THEOREM',formalComplete:false});
  }
  if (request.kind==='arithmetic.comparison') {
    const selected=raw.object.target, operations=ROUTES[selected];
    if (!operations || canonicalJSON(raw.route.orderedOperations)!==canonicalJSON(operations)) fail('INVALID_COMPARISON_ROUTE','Original M2 route and P8 adapter operation contract disagree.');
    const refs=[{...SOURCE,locator:'Theorems 1.8 and 3.10'}];
    const required=[
      await assumption('perfect-prism','The selected completed untilt determines the perfect prism (W(O_K^flat),(xi)); it is not a finite root level.',refs),
      await assumption('smooth-torus','R is the standard smooth formal torus over the same selected completed base.',refs),
      await assumption('derived-completion','The source retains derived (p,xi)-completion, and every route uses its prescribed derived operations.',refs)
    ];
    const N=raw.scope.displayedModPpower;
    const rings=selected==='etaleZp'?['A_inf','Compatible family {A_inf/p^n}_{n>=1}','Compatible family {(A_inf/p^n)[1/xi]}_{n>=1}','Compatible family {Z/p^n}_{n>=1}','Z_p']:selected==='etale'?['A_inf',`A_inf/p^${N}`,`(A_inf/p^${N})[1/xi]`,`Z/p^${N}`]:selected==='deRham'?['A_inf','O_K','O_K (p-completed)']:['A_inf','W(k) (prism map datum)','W(k)','W(k) (crystalline target)'];
    let previous=await node('source','Prismatic source Delta_(R/A_inf)',rings[0],'results.route.details.source');
    for (let i=0;i<operations.length;i++) {
      const operation=operations[i], next=await node(`stage:${i+1}`,operation,rings[i+1],`results.route.orderedOperations[${i}]`);
      const detail={...cloneJSON(raw.route.details),finiteObservationOnly:raw.scope.displayedModPpower,operationIndex:i,logicalScope:operation==='DERIVED_INVERSE_LIMIT_OVER_N'?'External comparison for the compatible family over every n; no limit is computed from the displayed single N.':'The named derived operation on the explicitly declared M2 model.'};
      edge(`edge:${i}`,previous,next,OPERATION[operation],operation,required,refs,detail); previous=next;
    }
  } else if (request.kind==='arithmetic.projective') {
    const comparison=raw.finitePerfectComparison;
    if (!comparison?.finitePerfectComplex || !comparison.geometry?.smooth || !comparison.geometry?.proper) fail('UNSUPPORTED_PROJECTIVE_RESULT','The actual finite-perfect projective comparison is required.');
    const refs=[{id:'STACKS_PROJECTIVE',url:'https://stacks.math.columbia.edu/tag/0FUN',locator:'Remark 50.14.2; Lemma 50.11.4',method:'EXTERNAL_THEOREM'},{id:'S02',url:'https://arxiv.org/abs/1110.5001',locator:'Theorem 3.6; Corollary 3.8',method:'EXTERNAL_THEOREM'},{...SOURCE,locator:'Theorem 1.8(1)'}];
    const required=[await assumption('projective-smooth-proper','The input is the standard smooth proper projective space with its declared lift over Z_p.',refs),await assumption('finite-perfect','The specified bounded complex consists of finite free Z_p modules.',refs),await assumption('crystalline-base','The crystalline prism has the exact declared prime and identity coefficient Frobenius.',refs)];
    const a=await node('finite-perfect','Finite perfect projective complex','Z_p','results.finitePerfectComparison.finitePerfectComplex','DERIVED_MODEL');
    const b=await node('de-rham','de Rham complex of the proper smooth lift','Z_p','results.finitePerfectComparison.comparisonMap');
    const c=await node('crystalline','Crystalline cohomology of the special fibre','Z_p','results.finitePerfectComparison.arrows[0]');
    const d=await node('prismatic','Prismatic comparison with identity coefficient Frobenius','Z_p','results.finitePerfectComparison.arrows[1]');
    edge('projective-bundle',a,b,'QUASI_ISOMORPHISM','PROJECTIVE_BUNDLE_FORMULA',required,[refs[0]],cloneJSON(comparison.comparisonMap));
    edge('smooth-lift',b,c,'QUASI_ISOMORPHISM','SMOOTH_PROPER_LIFT_COMPARISON',required,[refs[1]],cloneJSON(comparison.arrows[0]));
    edge('prismatic',c,d,'FROBENIUS_TWIST','CRYSTALLINE_PRISMATIC_COMPARISON',required,[refs[2]],cloneJSON(comparison.arrows[1]));
  } else {
    const comparison=raw.canonicalComparison;
    if (raw.object?.kind!=='Q_PD_SMALL_CECH_ALEXANDER_PROJECTIVE_LINE' || !raw.scope.canonicalQPDDescent || !comparison) fail('ACTUAL_QPD_REQUIRED','The actual q-PD nerve is required, not the separate cechModuleP1 diagnostic.');
    const refs=[{...SOURCE,locator:'Lemma 16.10; Remarks 16.15–16.16; Theorem 16.22'}];
    const required=[await assumption('qpd-envelope','The completed q-PD presentations retain their defining delta-closed relations and their flat, prism-generator-torsionfree scope.',refs),await assumption('qpd-smooth-framing','The input is the two standard smooth affine charts of P1 with their declared framing and inversion overlap.',refs),await assumption('qpd-descent','Canonical face, degeneracy and overlap maps are those of the actual completed q-PD nerve.',refs)];
    const ring='D = Z_p[[q-1]]';
    const a=await node('qpd-totalization','Full totalized q-PD envelope nerve',ring,'results.canonicalComparison.from');
    const b=await node('q-crystalline','Global q-crystalline structure complex',ring,'results.canonicalComparison.to');
    const m=await node('framed-double-complex',comparison.framedZigzag.middle,ring,'results.canonicalComparison.framedZigzag.middle','DERIVED_MODEL');
    const e=await node('form-zero-projection','E^bullet (projection to form degree zero)',ring,'results.canonicalComparison.framedZigzag.arrows[0]','DERIVED_MODEL');
    const q=await node('cech-zero-projection','Framed q-de Rham complex (projection to Cech degree zero)',ring,'results.canonicalComparison.framedZigzag.arrows[1]','DERIVED_MODEL');
    edge('canonical-descent',a,b,'QUASI_ISOMORPHISM','CANONICAL_QPD_DESCENT',required,refs,{localStep:cloneJSON(comparison.localStep),globalStep:cloneJSON(comparison.globalStep)});
    edge('form-zero',m,e,'QUASI_ISOMORPHISM','PROJECT_TO_FORM_DEGREE_ZERO',required,refs,{reason:comparison.framedZigzag.quasiIsomorphismReason});
    edge('cech-zero',m,q,'QUASI_ISOMORPHISM','PROJECT_TO_CECH_DEGREE_ZERO',required,refs,{reason:comparison.framedZigzag.quasiIsomorphismReason});
  }
  const body={schema:SCHEMA,route:request,source,baseRef,nodes,edges,assumptions,grade:'APPLIED_EXTERNAL_THEOREM',localKernelCheck:false,authority:'FRESH_BOUNDED_M2_COMPARISON_ONLY',...NO_AUTHORITY};
  return freeze({...body,binding:{sha256:await sha256(body),routeSha256:await sha256(request),sourceSha256:await sha256(source)}});
}

/** Rebuild the supported route. Rehashed forged diagrams still fail semantic comparison. */
export async function validateComparisonDiagram(diagram,{expectedBinding}={}) {
  const issues=[],invalidEdgeIds=[];
  try {
    assertJSON(diagram,4*1024*1024); diagram=cloneJSON(diagram);
    shape(diagram,['schema','route','source','baseRef','nodes','edges','assumptions','grade','localKernelCheck','authority','binding',...Object.keys(NO_AUTHORITY)],[],'comparison diagram');
    if (diagram.schema!==SCHEMA || diagram.grade!=='APPLIED_EXTERNAL_THEOREM' || diagram.localKernelCheck!==false || diagram.authority!=='FRESH_BOUNDED_M2_COMPARISON_ONLY' || Object.keys(NO_AUTHORITY).some(k=>diagram[k]!==false)) fail('COMPARISON_GRADE_PROMOTION','A structural comparison is not a new kernel theorem.');
    if (![diagram.nodes,diagram.edges,diagram.assumptions].every(Array.isArray)) fail('INVALID_DIAGRAM','Diagram collections must be arrays.');
    const fresh=await buildM2ComparisonDiagram(diagram.route);
    if (expectedBinding!==undefined) {
      const expected=typeof expectedBinding==='string'?expectedBinding:expectedBinding?.sha256;
      hashString(expected,'expected binding');
      if (fresh.binding.sha256!==expected) fail('STALE_COMPARISON','The requested route differs from the expected current binding.');
    }
    const nodeMap=new Map(diagram.nodes.map(n=>[n.id,n])), assumed=new Map(diagram.assumptions.map(a=>[a.id,a]));
    if (nodeMap.size!==diagram.nodes.length || assumed.size!==diagram.assumptions.length || new Set(diagram.edges.map(e=>e.id)).size!==diagram.edges.length) fail('DUPLICATE_DIAGRAM_ID','Diagram identities must be unique.');
    for (const original of fresh.edges) {
      const edge=diagram.edges.find(e=>e.id===original.id), from=edge&&nodeMap.get(edge.from), to=edge&&nodeMap.get(edge.to);
      let reason=null;
      if (!edge) reason='COMPARISON_STEP_MISSING';
      else if (!from || !to || canonicalJSON(edge.inputRingRef)!==canonicalJSON(from.coefficientRingRef) || canonicalJSON(edge.outputRingRef)!==canonicalJSON(to.coefficientRingRef) || canonicalJSON(edge.baseRef)!==canonicalJSON(from.baseRef) || canonicalJSON(edge.baseRef)!==canonicalJSON(to.baseRef)) reason='COMPOSABILITY_MISMATCH';
      else if (!Array.isArray(edge.requiredAssumptionRefs) || original.requiredAssumptionRefs.some(ref=>!edge.requiredAssumptionRefs.some(r=>canonicalJSON(r)===canonicalJSON(ref)) || !assumed.has(ref.id) || assumed.get(ref.id).hash!==ref.hash || canonicalJSON(assumed.get(ref.id))!==canonicalJSON(fresh.assumptions.find(a=>a.id===ref.id)))) reason='MISSING_OR_CHANGED_ASSUMPTION';
      else if (canonicalJSON(edge)!==canonicalJSON(original)) reason='COMPARISON_EDGE_CHANGED';
      if (reason) { invalidEdgeIds.push(original.id); issues.push({code:reason,edgeId:original.id,message:'The edge no longer has its required source, base map, ordered operation and conditions.'}); }
    }
    for (const key of ['nodes','edges','assumptions','source','baseRef','binding']) if (canonicalJSON(diagram[key])!==canonicalJSON(fresh[key])) issues.push({code:key==='binding'?'COMPARISON_BINDING_MISMATCH':'COMPARISON_DATA_CHANGED',field:key,message:`The ${key} differ from the fresh supported M2 route.`});
    return freeze({ok:issues.length===0,status:issues.length?'COMPARISON_REJECTED':'SUPPORTED_EXTERNAL_COMPARISON',issues,invalidEdgeIds,source:fresh.source,binding:fresh.binding,authority:'ROUTE_AND_DATA_CONSISTENCY_ONLY',...NO_AUTHORITY});
  } catch (error) { return freeze({ok:false,status:'COMPARISON_REJECTED',issues:[...issues,issue(error)],invalidEdgeIds,authority:'NONE',...NO_AUTHORITY}); }
}

export function invalidateComparisonAfterAssumptionChange(diagram,assumptionId) {
  assertJSON(diagram,4*1024*1024);
  if (!diagram.assumptions?.some(a=>a.id===assumptionId)) fail('ASSUMPTION_NOT_FOUND','The selected assumption is not in this diagram.');
  const direct=diagram.edges.filter(e=>e.requiredAssumptionRefs.some(ref=>ref.id===assumptionId)), edgeIds=new Set(direct.map(e=>e.id)), nodes=new Set(direct.map(e=>e.to));
  for (let changed=true;changed;) { changed=false; for (const edge of diagram.edges) if (nodes.has(edge.from) && !edgeIds.has(edge.id)) { edgeIds.add(edge.id); nodes.add(edge.to); changed=true; } }
  return freeze({schema:'MathScope.M3.P8.ComparisonInvalidation/1',status:'STALE',changedAssumptionId:assumptionId,invalidEdgeIds:[...edgeIds].sort(),invalidNodeIds:[...nodes].sort(),freshReplayRequired:true,oldBinding:cloneJSON(diagram.binding),...NO_AUTHORITY});
}
