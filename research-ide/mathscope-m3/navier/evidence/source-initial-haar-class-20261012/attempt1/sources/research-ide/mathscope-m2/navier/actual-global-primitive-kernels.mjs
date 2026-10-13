/** Generic exact rules for inspecting the original global primitives.
 * These rules have no source authority on their own.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

/** Alpha-equivalence of explicit bodies, treating named zero-order sharing
 * as a transparent expression wrapper. Bound variable names are immaterial;
 * integrands, endpoints, partial orders and every source operand are not.
 * Add/multiply association and order are normalized without cancelling any
 * function, integral, or branch. A retained source operand may be an atom;
 * its free coordinates are still transformed by the current environment.
 */
export function explicitPrimitiveBodyIdentity(G,left,right,{atomicNodes=[],maxVisits=300000}={}){
  if(left===right)return {schema:'MathScope.ExplicitPrimitiveBodyIdentity/1',left,right,normalForms:[left,right],pass:true,
    visited:0,canonicalNodeCount:0,identicalRetainedSourceNode:true,sharingNamesIgnored:true,boundNamesIgnored:true,
    sourceValuesReplaced:false,derivativeOrMomentIdentityAssumed:false};
  const atoms=new Set(atomicNodes),intern=new Map(),entries=[],cache=new Map();let visits=0;
  const node=(op,args)=>{const key=JSON.stringify([op,args]);if(intern.has(key))return intern.get(key);const id=entries.length;entries.push({op,args});intern.set(key,id);return id;};
  const arithmetic=(op,args)=>{
    const flattened=[];for(const a of args){const n=entries[a];if(n.op===op)flattened.push(...n.args);else flattened.push(a);}
    return node(op,flattened.sort((a,b)=>a-b));
  };
  const visit=(id,environment=new Map(),depth=0)=>{
    if(atoms.has(id))return node('source_operand',[id,[...G.freeCoordinates(id)].sort((a,b)=>a-b).map(c=>environment.get(c)??node('free_coordinate',[c]))]);
    // Only free coordinates of THIS node can affect its value. Keeping
    // irrelevant outer binders in the cache key re-expanded shared source
    // debts under thousands of equivalent environments.
    const key=id+'|'+depth+'|'+[...G.freeCoordinates(id)].sort((a,b)=>a-b).filter(k=>environment.has(k)).map(k=>k+':'+environment.get(k)).join(',');
    if(cache.has(key))return cache.get(key);
    if(++visits>maxVisits)fail('RESOURCE_LIMIT','Explicit primitive alpha-equivalence exceeded its declared visit budget.');
    const {op,args}=G.nodes[id];let out;
    if(op==='coordinate')out=environment.get(id)??node('free_coordinate',[id]);
    else if(op==='rational'||op==='source_parameter')out=node(op,args);
    else if(op==='definite_integral'){
      const local=new Map(environment),bound=node('bound_coordinate',[depth]);local.set(args[1],bound);
      out=node(op,[visit(args[0],local,depth+1),visit(args[2],environment,depth),visit(args[3],environment,depth)]);
    }else if(op==='actual_expression_partial'&&args[2].every(x=>x===0)){
      const s=G.expressionSystems[args[0]],local=new Map(environment),values=args[1].map(v=>visit(v,environment,depth));
      s.parameters.forEach((v,j)=>local.set(v,values[j]));out=visit(s.body,local,depth);
    }else if(op==='actual_expression_partial')out=node(op,[args[0],args[1].map(v=>visit(v,environment,depth)),args[2]]);
    else if(op==='integer_power'||op==='source_step_derivative')out=node(op,[visit(args[0],environment,depth),args[1]]);
    else if(op==='actual_natural_series')out=node(op,[args[0],visit(args[1],environment,depth),visit(args[2],environment,depth),args[3],args[4]]);
    else if(op==='actual_background_even_profile')out=node(op,[args[0],args[1],visit(args[2],environment,depth),visit(args[3],environment,depth),args[4],args[5]]);
    else if(op==='actual_background_picard')out=node(op,[args[0],args[1],visit(args[2],environment,depth),visit(args[3],environment,depth),args[4]]);
    else if(op==='actual_quadratic_root')out=node(op,[args[0],args[1],visit(args[2],environment,depth)]);
    else if(op==='actual_monotone_root')out=node(op,[args[0],...args.slice(1).map(v=>visit(v,environment,depth))]);
    else if(op==='add'||op==='multiply')out=arithmetic(op,args.map(v=>visit(v,environment,depth)));
    else out=node(op,args.map(v=>visit(v,environment,depth)));
    cache.set(key,out);return out;
  };
  const a=visit(left),b=visit(right);
  return {schema:'MathScope.ExplicitPrimitiveBodyIdentity/1',left,right,normalForms:[a,b],pass:a===b,
    visited:visits,canonicalNodeCount:entries.length,sharingNamesIgnored:true,boundNamesIgnored:true,
    sourceValuesReplaced:false,derivativeOrMomentIdentityAssumed:false};
}

/** Addition is canonically ordered by the expression graph. Match a source
 * primitive by its actual endpoint density, never by operand position.
 */
export function matchExplicitPrimitiveDensity(G,candidates,expectedDensity,{atomicNodes=[]}={}){
  if(!Array.isArray(candidates)||!G.nodes[expectedDensity]||candidates.some(id=>G.nodes[id]?.op!=='definite_integral'))
    fail('INVALID_INPUT','Use retained definite integrals and a retained endpoint density.');
  const matches=candidates.filter(id=>{const n=G.nodes[id],endpoint=G.substitute(n.args[0],n.args[1],n.args[3]);
    return explicitPrimitiveBodyIdentity(G,endpoint,expectedDensity,{atomicNodes}).pass;});
  if(matches.length!==1)fail('INVALID_SOURCE_CONSTRUCTION','The original source needs exactly one primitive with this literal endpoint density.');
  return matches[0];
}

/** Each radial bump uses R=sqrt(2X), u=R/Rb, dX=R dR.
 * The following identities retain arbitrary exponent p and coefficient.
 * For the pressure bump the exp-power factorization is the ordinary
 * positive-real identity (Rb*u)^p=Rb^p*u^p, separately stated below.
 */
export function originalRadialBumpPrimitiveIdentities(){
  const G=new ActualConvergentExpressions(),X=G.fresh('primitive_X'),Rb=G.fresh('primitive_Rb'),R=G.sqrt(G.mul(G.q(2),X)),
    u=G.div(R,Rb),coefficient=G.fresh('primitive_coefficient'),density=G.fresh('primitive_bump_value'),weight=G.fresh('primitive_power_u'),
    jacobian=G.derivative(u,X),massDerivative=G.mul(Rb,coefficient,u,density,jacobian),massExpected=G.div(G.mul(coefficient,density),Rb),
    scale=G.fresh('primitive_pressure_scale'),pressureDerivative=G.mul(scale,coefficient,weight,density,jacobian),pressureExpected=G.div(G.mul(scale,coefficient,weight,density),G.mul(Rb,R));
  const mass=sourceGraphRationalIdentity(G,G.sub(massDerivative,massExpected)),pressure=sourceGraphRationalIdentity(G,G.sub(pressureDerivative,pressureExpected)),
    omittedRadialJacobian=sourceGraphRationalIdentity(G,G.sub(G.mul(Rb,coefficient,density,jacobian),massExpected));
  if(!mass.pass||!pressure.pass||omittedRadialJacobian.pass)fail('INTERNAL_VALIDATION','The original radial bump Jacobian identity failed.');
  return {schema:'MathScope.OriginalRadialBumpPrimitiveIdentities/1',checks:{mass,pressure},negativeControls:{omittedRadialJacobian},pass:true,
    originalBump:'b_j(u)=sigma_2_prime((u-left_j)/width)/width',
    massStatement:'d_X[Rb*alpha_j*integral_left^u s*b_j(s)ds]=alpha_j*b_j(u)/Rb',
    pressureStatement:'d_X[2*ef*Rb^p*beta_j*integral_left^u s^p*b_j(s)ds]=2*ef*(sqrt(2X))^p*beta_j*b_j(u)/(Rb*sqrt(2X))',
    exponent:'p=-2-2*lambda, with the unchanged source lambda>0',
    positiveRealPowerRule:'Rb>0 and X>0 imply R=Rb*u>0 and R^p=Rb^p*u^p for every real p, by log(Rb*u)=log(Rb)+log(u).',
    exterior:'The original sigma_2 prime and all its jets vanish off each closed bump interval. Thus the constant/zero primitive branches have these same derivative jets.',
    sourceAuthenticated:false};
}

/** General n coefficient of the genuine even Picard primitive relation.
 * In xi: xi*d_xi K=-2*K-xi*d_xi U, so M=X*(U+K), X=xi^2,
 * has M_X=U. The coefficient n never enters this identity.
 */
export function originalEvenAveragePrimitiveIdentity(){
  const G=new ActualConvergentExpressions(),xi=G.fresh('average_xi'),U=G.fresh('average_U'),K=G.fresh('average_K'),Ux=G.fresh('average_Uxi'),
    Kx=G.sub(G.neg(G.div(G.mul(G.q(2),K),xi)),Ux),
    derivative=G.div(G.add(G.mul(G.q(2),xi,G.add(U,K)),G.mul(G.pow(xi,2),G.add(Ux,Kx))),G.mul(G.q(2),xi)),
    check=sourceGraphRationalIdentity(G,G.sub(derivative,U)),wrongSign=sourceGraphRationalIdentity(G,G.sub(G.div(G.add(G.mul(G.q(2),xi,G.add(U,K)),G.mul(G.pow(xi,2),G.add(Ux,G.add(G.neg(G.div(G.mul(G.q(2),K),xi)),Ux)))),G.mul(G.q(2),xi)),U));
  if(!check.pass||wrongSign.pass)fail('INTERNAL_VALIDATION','The original Picard average primitive identity failed.');
  return {schema:'MathScope.OriginalEvenAveragePrimitiveIdentity/1',check,wrongSign,pass:true,
    statement:'d_X[X*(U_n+K_n)]=U_n; the regular even extension supplies the X=0 limit.',
    integralAverage:'For n=1 the original source instead stores integral_0^1 U_n(tX)dt; changing variables s=tX gives the same primitive, including its continuous zero-axis limit.',
    allPositiveOrders:true,sourceAuthenticated:false};
}
