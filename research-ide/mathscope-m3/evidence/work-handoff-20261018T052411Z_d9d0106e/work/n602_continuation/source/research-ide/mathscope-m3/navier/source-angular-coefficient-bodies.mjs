/** Exact retained-body operands for the full finite angular PDE update.
 *
 * A nested forced pressure is a genuine function, together with its full
 * defining body and every independent argument. Giving that function a
 * name before differentiating does not replace any coefficient or jet.
 * The two PDE paths use the SAME named functions. Their update identity
 * is then a finite polynomial in actual function jets, rather than an
 * expansion of every nested normal-pressure denominator.
 */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {exactHarmonicComplexAlgebra,exactAngularResidualUpdate} from './source-harmonic-assembly.mjs';
import {verifyCompleteAngularResidualUpdate} from './source-angular-update-verification.mjs';
import {createQuadraticSourceVerifier} from './source-quadratic-identity.mjs';

const seals=new WeakMap(),parts=['real','imaginary'],fail=(message,code='INVALID_INPUT')=>{
  throw Object.assign(new Error(message),{code});
};
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),root=(G,x)=>Number.isSafeInteger(x)&&!!G.nodes[x];
const record=s=>({schema:s.schema,original:s.original,retained:s.retained,bindings:s.bindings,checks:s.checks,scope:s.scope});

export function retainExactAngularUpdateBodies(G,input,{name='CompleteAngularUpdate'}={}){
  if(!input||Object.keys(input).some(k=>!['geometry','phase','k','previous','increment','oldFlatResidual'].includes(k))||
    G.nodes[input.geometry?.theta]?.op!=='coordinate'||![input.phase,input.k].every(x=>root(G,x))||
    typeof G.defineExpressionFunction!=='function'||typeof G.expressionSystem!=='function'||typeof G.expressionValue!=='function')
    fail('Retain the complete original finite update and an exact defining-body graph.');
  const C=exactHarmonicComplexAlgebra(G),theta=input.geometry.theta,bindings=[],byBody=new Map(),
    checkRows=(rows,role,flat=false)=>{
      if(!Array.isArray(rows)||(!flat&&!rows.length)||rows.length>257||new Set(rows.map(r=>r?.m)).size!==rows.length)
        fail('Every finite '+role+' mode must be retained exactly once.');
      for(const row of rows){
        const expected=flat?['m','value']:['m','velocity','pressure'],v=flat?row?.value:row?.velocity;
        if(!row||Object.keys(row).some(k=>!expected.includes(k))||!Number.isSafeInteger(row.m)||!Array.isArray(v)||v.length!==3||
          !v.every(C.check)||!flat&&!C.check(row.pressure))fail('Retain all three complex components and explicit pressure for '+role+'.');
        if([...v,...(flat?[]:[row.pressure])].some(z=>parts.some(p=>G.freeCoordinates(z[p]).has(theta))))
          fail('A retained angular coefficient must remain independent of the angular coordinate.');
      }
    };
  checkRows(input.previous,'previous');checkRows(input.increment,'increment');checkRows(input.oldFlatResidual,'old-flat',true);
  const share=(body,location)=>{
    let retained=byBody.get(body);
    if(!retained){
      const parameters=[...G.freeCoordinates(body)].sort((a,b)=>a-b);
      if(body===G.zero)retained={body,root:body,system:null,parameters,derivativeLimits:[],literalZero:true};
      else{
        const system=G.defineExpressionFunction({name:name+'_'+bindings.length,parameters,body}),definition=G.expressionSystem(system),
          value=G.expressionValue(system,parameters);
        if(definition.body!==body||!same(definition.parameters,parameters)||!same(G.nodes[value]?.args?.[1],parameters)||
          G.nodes[value]?.args?.[2]?.some(n=>n!==0))fail('The exact whole coefficient was not retained at its own arguments.','INVALID_SOURCE_CONSTRUCTION');
        retained={body,root:value,system,parameters,derivativeLimits:[...definition.derivativeLimits],literalZero:false};
      }
      byBody.set(body,retained);
    }
    bindings.push({...location,...structuredClone(retained),completeFreeCoordinateTuple:true,wholeDefiningBodyRetained:true});return retained.root;
  },complex=(z,where)=>Object.fromEntries(parts.map(part=>[part,share(z[part],{...where,part})])),
    state=(rows,role)=>rows.map(row=>({m:row.m,velocity:row.velocity.map((z,component)=>complex(z,{role,m:row.m,component})),
      pressure:complex(row.pressure,{role,m:row.m,component:'pressure'})})),
    retained={geometry:structuredClone(input.geometry),phase:input.phase,k:input.k,
      previous:state(input.previous,'previous'),increment:state(input.increment,'increment'),
      oldFlatResidual:input.oldFlatResidual.map(row=>({m:row.m,value:row.value.map((z,component)=>complex(z,{role:'old-flat',m:row.m,component}))}))},
    checks=[{id:'complete-original-coefficient-body-and-own-argument-bindings',pass:bindings.every(b=>b.wholeDefiningBodyRetained&&b.completeFreeCoordinateTuple)},
      {id:'previous-increment-pressure-and-old-flat-inventories-retained',pass:['previous','increment','oldFlatResidual'].every(k=>same(input[k].map(r=>r.m),retained[k].map(r=>r.m)))},
      {id:'every-complex-component-and-pressure-has-a-source-root',pass:bindings.length===8*(input.previous.length+input.increment.length)+6*input.oldFlatResidual.length}],
    result={schema:'MathScope.N6.ExactRetainedAngularCoefficientBodies/1',original:structuredClone(input),retained,bindings,checks,
      scope:{wholeActualBodyRetained:true,allIndependentArgumentsRetained:true,sharedBodiesUsedBeforePhysicalDifferentiation:true,
        sourceAuthenticated:false,numericalValuesSubstituted:false,compositeRootsDeclaredIndependentInOriginalGraph:false,
        pressureOrQuadraticTermsOmitted:false,fullMixedDerivativeClosureAudited:false,allOrderClassBoundEstablished:false}};
  seals.set(result,{G,record:canonicalStringify(record(result))});assertExactAngularUpdateBodies(G,result);return result;
}

export function assertExactAngularUpdateBodies(G,s){
  const seal=seals.get(s);
  if(!seal||seal.G!==G||seal.record!==canonicalStringify(record(s)))
    fail('Use the unchanged private whole-body binding for this exact graph.','INVALID_SOURCE_CONSTRUCTION');
  for(const b of s.bindings){
    if(b.literalZero){if(b.body!==G.zero||b.root!==G.zero||b.system!==null)fail('A nonzero coefficient cannot be relabelled as a literal zero.','INVALID_SOURCE_CONSTRUCTION');continue;}
    const definition=G.expressionSystem(b.system),node=G.nodes[b.root];
    if(definition.body!==b.body||!same(definition.parameters,b.parameters)||!same(definition.derivativeLimits,b.derivativeLimits)||
      node?.args?.[0]!==b.system||!same(node?.args?.[1],b.parameters)||!same(node?.args?.[2],b.parameters.map(()=>0))||
      !same([...G.freeCoordinates(b.body)].sort((a,b)=>a-b),b.parameters))
      fail('A whole coefficient body, physical argument or derivative limit changed.','INVALID_SOURCE_CONSTRUCTION');
  }
  return true;
}

/** Both exact PDE paths are constructed after the complete source bodies
 * have been named. No already asserted cancellation is hidden in a body.
 * The original roots and named roots are linked by executed definition,
 * argument and derivative-limit checks, not a caller-supplied equation.
 */
export function exactRetainedBodyAngularUpdate(G,input,{name='CompleteAngularUpdate',...limits}={}){
  const operands=retainExactAngularUpdateBodies(G,input,{name}),
    update=exactAngularResidualUpdate(G,operands.retained),
    proof=verifyCompleteAngularResidualUpdate(G,update,{prefix:name,...limits});
  assertExactAngularUpdateBodies(G,operands);
  return {schema:'MathScope.N6.ExactRetainedBodyAngularUpdate/1',operands,update,
    verification:{...proof,retainedBodyBindings:record(operands),sameCompleteCoefficientFunctionsInBothPDEPaths:true,
      wholeSourceBodiesReplacedByNumericalSamples:false,originalGraphCompositeAtomEquationsAdded:false,
      fullMixedDerivativeMaterializationStillRequired:true},
    checks:[...operands.checks,...proof.checks],pass:operands.checks.every(x=>x.pass)&&proof.pass,
    sourceAuthenticated:false,numericalWholeFieldEnclosure:false,allOrderClassBoundEstablished:false};
}

/** Finite state bookkeeping before physical derivatives. The named scalar
 * bodies may, for example, be the complete old and freshly rebuilt mean
 * pressures in p_old + (p_new-p_old). The identity must hold for arbitrary
 * values of those bodies; no equation between them is added. This avoids
 * requiring the expression graph to perform additive cancellation itself.
 */
export function verifyExactAngularStateEquality(G,left,right,{retainedScalarBodies=[]}={}){
  const C=exactHarmonicComplexAlgebra(G),check=rows=>Array.isArray(rows)&&rows.length&&new Set(rows.map(r=>r.m)).size===rows.length&&
    rows.every(r=>Number.isSafeInteger(r.m)&&Array.isArray(r.velocity)&&r.velocity.length===3&&r.velocity.every(C.check)&&C.check(r.pressure));
  if(!check(left)||!check(right)||!Array.isArray(retainedScalarBodies)||retainedScalarBodies.some(x=>!root(G,x)))
    fail('A state comparison retains every complex velocity and physical pressure coefficient.');
  const L=new Map(left.map(r=>[r.m,r])),R=new Map(right.map(r=>[r.m,r])),modes=[...L.keys()].sort((a,b)=>a-b);
  if(R.size!==L.size||modes.some(m=>!R.has(m)))fail('The two complete state inventories differ.');
  const verify=createQuadraticSourceVerifier(G,{atomicNodes:retainedScalarBodies,maxTerms:30000,maxProducts:300000}),checks=[];
  for(const m of modes)for(const component of [0,1,2,'pressure'])for(const part of parts){
    const a=component==='pressure'?L.get(m).pressure:L.get(m).velocity[component],b=component==='pressure'?R.get(m).pressure:R.get(m).velocity[component],
      expression=G.sub(a[part],b[part]);
    checks.push({id:'complete-state-'+m+'-'+component+'-'+part,m,component,part,left:a[part],right:b[part],...verify(expression)});
  }
  return {schema:'MathScope.N6.ExactCompleteAngularStateEquality/1',modes,checks,pass:checks.every(x=>x.pass),
    retainedScalarBodies:[...retainedScalarBodies],identityValidForArbitraryRetainedScalarBodies:true,
    sourceBodyRelationsAssumed:false,numericalBodyValuesUsed:false,sourceAuthenticated:false};
}
