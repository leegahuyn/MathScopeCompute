/** Exact Cartesian curl and velocity jets of a retained real cylindrical
 * potential on independent (R,Z,T,theta,xi,v) coordinates.  This layer is
 * generic: authenticating a source member and its physical map belongs to
 * the private source adapter. Every local analytic share has an explicit
 * body; all partials actually used below are materialized from that body.
 */
import {retainedCommonDenominatorIdentity} from './actual-third-jet-algebra.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const root=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x];
const total=a=>a.reduce((s,n)=>s+n,0);
const progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};
const pairs=[[0,0],[0,1],[0,2],[1,1],[1,2],[2,2]];

function bindBody(G,body,coordinates,name,maxOrder){
  const free=G.freeCoordinates(body),parameters=[...coordinates.filter(x=>free.has(x)),...[...free].filter(x=>!coordinates.includes(x)).sort((a,b)=>a-b)];
  const derivativeLimits=parameters.map(x=>coordinates.includes(x)?maxOrder:0),system=parameters.length?G.defineExpressionFunction({name,parameters,body,derivativeLimits}):null,
    value=system===null?body:G.expressionValue(system,parameters);
  return {name,body,parameters,derivativeLimits,system,value,maxOrder,partials:[],unspecifiedOracle:false};
}

/** Expand these local shares only. Original source integrals, Volterra
 * roots, exact chart inverses and other source functions are untouched.
 * Checking the actual materialized partial independently of the algebra
 * is the analytic-body responsibility of this caller, not of the common
 * denominator identity helper used below.
 */
function instantiateUsedBodies(G,roots,bindings,coordinates){
  const local=new Map(bindings.filter(b=>b.system!==null).map(b=>[b.system,b])),memo=new Map(),partialMemo=new Map();
  function visit(id){
    if(memo.has(id))return memo.get(id);const {op,args}=G.nodes[id];let value=id;
    if(op==='actual_expression_partial'&&local.has(args[0])){
      const binding=local.get(args[0]);
      if(args[1].some((x,j)=>x!==binding.parameters[j])||total(args[2])>binding.maxOrder||args[2].some((n,j)=>n&&!coordinates.includes(binding.parameters[j])))
        fail('INTERNAL_VALIDATION','A physical partial escaped its declared independent-coordinate order budget.');
      if(!partialMemo.has(id)){
        const materialized=G.materializeExpressionFunction(...args);let direct=binding.body;
        for(let j=0;j<binding.parameters.length;j++)for(let k=0;k<args[2][j];k++)direct=G.derivative(direct,binding.parameters[j]);
        const check={root:id,orders:[...args[2]],order:total(args[2]),materialized,direct,pass:materialized===direct};
        if(!check.pass)fail('INTERNAL_VALIDATION','A physical partial failed to materialize from its retained original body.');
        binding.partials.push(check);partialMemo.set(id,materialized);
      }
      value=partialMemo.get(id);
    }else if(op==='add')value=G.add(...args.map(visit));
    else if(op==='multiply')value=G.mul(...args.map(visit));
    else if(op==='inverse')value=G.inv(visit(args[0]));
    else if(op==='integer_power')value=G.pow(visit(args[0]),args[1]);
    else if(op==='sine')value=G.sine(visit(args[0]));
    else if(op==='cosine')value=G.cosine(visit(args[0]));
    else if(op==='sqrt_positive')value=G.sqrt(visit(args[0]));
    memo.set(id,value);return value;
  }
  const values=roots.map(visit);
  for(const binding of bindings){
    const materialized=binding.system===null?binding.body:G.materializeExpressionFunction(binding.system,binding.parameters);
    binding.originalBodyMaterialization=materialized;binding.originalBodyBound=materialized===binding.body;
    if(!binding.originalBodyBound)fail('INTERNAL_VALIDATION','A physical body share lost its original value.');
  }
  return {values,materialize:visit,partialCount:partialMemo.size};
}

/** Cartesian components are formed BEFORE differentiating the potential.
 * The coordinate coefficients cos(theta), sin(theta), 1/R and a(R) are
 * differentiated on every subsequent application. In particular a_R and
 * a_RR, angular connection terms, and fast v derivatives are retained.
 */
export function exactPhysicalVelocityJets(G,input,context={}){
  const names=['R','Z','T','theta','xi','v'],allowed=[...names,'epsilon','radialFast','potential','pressure'];
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))
    fail('INVALID_INPUT','Supply only retained potential/pressure bodies and the actual independent-coordinate geometry; caller derivative arrays are not accepted.');
  const coordinates=names.map(k=>input[k]),{R,Z,T,theta,xi,v,epsilon,radialFast,potential,pressure}=input;
  if(new Set(coordinates).size!==6||coordinates.some(x=>G.nodes[x]?.op!=='coordinate')||!Array.isArray(potential)||potential.length!==3||[...potential,pressure,epsilon,radialFast].some(x=>!root(G,x)))
    fail('INVALID_INPUT','Use six distinct coordinates, three real cylindrical potential bodies, one scalar pressure body and exact geometry roots.');
  if(coordinates.some(x=>G.freeCoordinates(epsilon).has(x)||G.derivative(epsilon,x)!==G.zero)||coordinates.filter(x=>x!==R).some(x=>G.freeCoordinates(radialFast).has(x)||G.derivative(radialFast,x)!==G.zero))
    fail('INVALID_INPUT','Epsilon must be frozen and radialFast may depend only on R and fixed source parameters.');
  const c=G.cosine(theta),s=G.sine(theta),cartesianPotential=[G.sub(G.mul(c,potential[0]),G.mul(s,potential[1])),G.add(G.mul(s,potential[0]),G.mul(c,potential[1])),potential[2]],
    potentialBindings=cartesianPotential.map((body,j)=>bindBody(G,body,coordinates,'PhysicalCartesianPotential_'+j+'_'+body,3)),
    pressureBinding=bindBody(G,pressure,coordinates,'PhysicalScalarPressure_'+pressure,1),radialFastBinding=bindBody(G,radialFast,coordinates,'PhysicalRadialFast_'+radialFast,2),
    bindings=[...potentialBindings,pressureBinding,radialFastBinding],a=radialFastBinding.value,
    Dr=x=>G.add(G.derivative(x,R),G.mul(a,G.derivative(x,xi))),Dtheta=x=>G.div(G.derivative(x,theta),R),
    Dx=x=>G.sub(G.mul(c,Dr(x)),G.mul(s,Dtheta(x))),Dy=x=>G.add(G.mul(s,Dr(x)),G.mul(c,Dtheta(x))),Dz=x=>G.mul(epsilon,G.derivative(x,Z)),
    Dt=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.derivative(x,v)),spatial=[Dx,Dy,Dz],A=potentialBindings.map(b=>b.value),
    velocity=[G.sub(Dy(A[2]),Dz(A[1])),G.sub(Dz(A[0]),Dx(A[2])),G.sub(Dx(A[1]),Dy(A[0]))],
    gradient=velocity.map(component=>spatial.map(D=>D(component))),hessian=velocity.map((component,j)=>pairs.map(([i,k])=>spatial[k](gradient[j][i]))),
    time=velocity.map(Dt),pressureGradient=spatial.map(D=>D(pressureBinding.value)),divergence=G.add(...velocity.map((x,j)=>spatial[j](x))),checks=[];
  const same=(left,right)=>retainedCommonDenominatorIdentity(G,left,right,{denominators:[R],maxTerms:160000});
  const divergenceCheck=same(divergence,G.zero);
  checks.push({id:'cartesian-divergence-of-curl',...divergenceCheck});
  for(let component=0;component<3;component++)for(const[i,k]of pairs)if(i!==k)
    checks.push({id:'mixed-velocity-'+component+'-'+i+'-'+k,component,axes:[i,k],...same(spatial[k](gradient[component][i]),spatial[i](gradient[component][k]))});
  // These commutators also certify the time derivative on the same map.
  // They use the actual frozen epsilon and actual R-only radialFast.
  for(let component=0;component<3;component++)for(let axis=0;axis<3;axis++)
    checks.push({id:'space-time-potential-'+component+'-'+axis,component,axis,...same(Dt(spatial[axis](A[component])),spatial[axis](Dt(A[component])))});
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','The exact physical derivative algebra lost a coordinate coefficient, mixed partial or basis connection.');
  progress(context,'physical-generic-formal-curl-and-commutators',G,{identityCount:checks.length});
  const groups=[A,velocity,gradient.flat(),hessian.flat(),time,pressureGradient,[divergence],checks.flatMap(c=>[c.left,c.right])],flat=groups.flat(),materialization=instantiateUsedBodies(G,flat,bindings,coordinates),map=materialization.materialize;
  progress(context,'physical-generic-body-partials-materialized',G,{partialCount:materialization.partialCount});
  const roots={potential:cartesianPotential,velocity:velocity.map(map),gradient:gradient.map(row=>row.map(map)),hessian:hessian.map(row=>row.map(map)),time:time.map(map),pressure,pressureGradient:pressureGradient.map(map),divergence:map(divergence)};
  const degreeUsed=Math.max(0,...potentialBindings.flatMap(b=>b.partials.map(p=>p.order))),spaceTimeUsed=potentialBindings.flatMap(b=>b.partials).some(p=>{
    const b=potentialBindings.find(b=>b.partials.includes(p));return p.orders.some((n,j)=>n&&[T,v].includes(b.parameters[j]));
  });
  return {schema:'MathScope.ExactPhysicalVelocityJets/1',coordinates:Object.fromEntries(names.map((name,j)=>[name,coordinates[j]])),epsilon,radialFast,cylindricalPotential:[...potential],cartesianPotential,
    potentialBindings,pressureBinding,radialFastBinding,roots,formal:{potential:A,velocity,gradient,hessian,time,pressureGradient,divergence},checks,pass:true,
    components:['x','y','z'],spatialDirections:['x','y','z'],hessianAxes:pairs.map(([i,j])=>[['x','y','z'][i],['x','y','z'][j]]),
    counts:{velocity:3,gradient:9,symmetricHessian:18,time:3,pressureGradient:3,usedBodyPartials:materialization.partialCount,maxPotentialDerivativeOrderUsed:degreeUsed,spaceTimePotentialPartialUsed:spaceTimeUsed},
    operators:{radial:'D_r=partial_R+a(R)*partial_xi',x:'D_x=cos(theta)*D_r-sin(theta)/R*partial_theta',y:'D_y=sin(theta)*D_r+cos(theta)/R*partial_theta',z:'D_z=epsilon*partial_Z',time:'D_t=-epsilon*partial_T+partial_v'},
    bodyBindingResponsibility:'The exact polynomial checker uses the local symbols as atoms. This caller separately materializes every used partial to canonical AD of its fully specified actual input body.',
    domain:'R>0; epsilon is frozen; a depends only on R and frozen parameters; the retained bodies have the indicated spatial C3 and mixed space-time C2 regularity on a common open chart. All statements are local until an authentic physical map and source domain are bound.',
    sourceAuthenticated:false,physicalMapAuthenticated:false,actualSourceRegularityProved:false,numericalEnclosureEvaluated:false,globalResidualProved:false,
    finiteApproximationSubstitutedForExactBody:false,unrequestedHigherJetsDeclaredZero:false};
}
