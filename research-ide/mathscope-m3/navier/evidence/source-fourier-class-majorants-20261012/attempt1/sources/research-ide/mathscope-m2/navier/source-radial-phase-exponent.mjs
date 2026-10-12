/** Original physical radial exponent, Navier--Stokes (6.2), printed p.63.
 *
 * The outer factor 2 multiplies BOTH terms.  Keeping this recipe shared by
 * the exact source and interval observation prevents the former lost factor
 * from defining a different physical torus.  No value of h is rounded here.
 * A literal equation audit below does not certify an entire physical field.
 */
import {getPinnedSourceProfile} from './source-profile.mjs';

const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});};
const exact=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export const ORIGINAL_RADIAL_PHASE_SPECIFICATION=Object.freeze({
  schema:'MathScope.OriginalRadialPhaseSpecification/1',
  paperSHA256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
  printedPage:63,equations:Object.freeze(['6.2','6.6']),
  kappa:'1/100000',formula:'2*((1+h)*rho_g-h*kappa_s)',
  rho:'log(4-sqrt(2))/log(4+sqrt(2))',
  coveringIdentity:'M_i=r_c^(-rho_g)*epsilon^(-kappa_s)*S^(-rho_g), 1<=r_c<T_g',
  omittedFactorFormula:'2*(1+h)*rho_g-h*kappa_s'
});

/** This is the single arithmetic definition. O can be the original source
 * graph or directed interval operations; kappa is supplied as an exact
 * rational or a directed enclosure of that same rational.
 */
export function originalRadialPhaseExponentRecipe(O,{h,rho,kappa}){
  return O.mul(O.q(2),O.sub(O.mul(O.add(O.one,h),rho),O.mul(h,kappa)));
}

/** Build the original roots on the caller's own graph.  h and T_g are
 * checked, not caller-selected free constants.  The equation audit also
 * checks the node bodies independently of the graph's hash-consing cache.
 */
export function originalSourceRadialPhase(G,input={}){
  if(!G||typeof G.q!=='function'||typeof G.parameter!=='function'||!Array.isArray(G.nodes)||
    !input||Object.keys(input).some(k=>!['h','Tg'].includes(k)))
    fail('Use one original source graph, its pinned h and optional original T_g root.');
  const h=input.h??G.parameter('h'),sqrt2=G.sqrt(G.q(2)),Lambda=G.sub(G.q(4),sqrt2),Tg=G.add(G.q(4),sqrt2);
  if(h!==G.parameter('h')||(input.Tg!==undefined&&input.Tg!==Tg))
    fail('The physical radial exponent must retain the original positive h and T_g=4+sqrt(2).');
  const rho=G.div(G.log(Lambda),G.log(Tg)),kappa=G.q(1,100000),
    dr=originalRadialPhaseExponentRecipe(G,{h,rho,kappa});
  return {h,Lambda,Tg,rho,kappa,dr};
}

// A small independently specified syntax tree.  It does not call G.node,
// does not trust G.lookup, and preserves binary parentheses.  Only binary
// add/multiply are commutative; no analytic operand is atomized or erased.
const term=(op,...args)=>({op,args}),q=n=>term('rational',String(n),'1'),
  mul=(a,b)=>term('multiply',a,b),add=(a,b)=>term('add',a,b),
  sub=(a,b)=>add(a,mul(q(-1),b)),div=(a,b)=>mul(a,term('inverse',b));
function expectedSyntax(){
  const h=term('source_parameter','h'),sqrt2=term('sqrt_positive',q(2)),
    Lambda=sub(q(4),sqrt2),Tg=add(q(4),sqrt2),
    rho=div(term('log_positive',Lambda),term('log_positive',Tg)),
    kappa=term('rational','1','100000'),
    dr=mul(q(2),sub(mul(add(q(1),h),rho),mul(h,kappa)));
  return {h,Lambda,Tg,rho,kappa,dr};
}
function syntaxKey(node){
  if(!node||typeof node.op!=='string'||!Array.isArray(node.args))fail('A radial exponent syntax node is missing.');
  const args=['rational','source_parameter'].includes(node.op)?node.args:
    node.args.map(syntaxKey);
  if(['add','multiply'].includes(node.op))args.sort();
  return JSON.stringify([node.op,args]);
}
function literalClosure(G,roots){
  const visiting=new Set(),seen=new Map(),keys=new Map(),allowed=new Set(['rational','source_parameter','add','multiply','inverse','sqrt_positive','log_positive']);
  const visit=id=>{
    if(keys.has(id))return keys.get(id);
    if(!Number.isSafeInteger(id)||!G.nodes[id]||visiting.has(id)||seen.size+visiting.size>128)
      fail('The original radial exponent requires a finite acyclic literal arithmetic closure.');
    const n=G.nodes[id];if(!allowed.has(n.op)||!Array.isArray(n.args))fail('A radial exponent operand was replaced by another operation.');
    const arity={rational:2,source_parameter:1,add:2,multiply:2,inverse:1,sqrt_positive:1,log_positive:1}[n.op];
    if(n.args.length!==arity)fail('A radial exponent operand has the wrong arity.');
    visiting.add(id);
    const args=['rational','source_parameter'].includes(n.op)?[...n.args]:n.args.map(visit);
    if(['add','multiply'].includes(n.op))args.sort();
    const key=JSON.stringify([n.op,args]);keys.set(id,key);visiting.delete(id);
    seen.set(id,{id,op:n.op,args:[...n.args]});return key;
  };
  for(const root of Object.values(roots))visit(root);
  return {keys,nodes:[...seen.values()].sort((a,b)=>a.id-b.id)};
}

/** Directly compare an ACTUAL retained map against (6.2).  This consumes G
 * and literal roots, never a saved flag.  Call the private parent/source
 * authenticator first.  The returned JSON is an equation-binding record;
 * it makes no claim that the rest of a physical graph has been executed.
 */
export function assertOriginalSourceTorusMap(G,input){
  if(!input||Object.keys(input).some(k=>!['h','Tg','physicalMap'].includes(k))||!input.physicalMap)
    fail('Use the actual retained physicalMap with its original h and T_g.');
  const expected=originalSourceRadialPhase(G,{h:input.h,Tg:input.Tg}),actual=input.physicalMap;
  for(const name of ['Lambda','rho','dr'])if(actual[name]!==expected[name])
    fail('The retained physical map does not satisfy original (6.2): '+name+'.');
  const closure=literalClosure(G,expected),syntax=expectedSyntax();
  for(const [name,root] of Object.entries(expected))if(closure.keys.get(root)!==syntaxKey(syntax[name]))
    fail('The physical-map arithmetic body differs from the original literal equation: '+name+'.');
  const pinned=getPinnedSourceProfile(),source=G.source;
  if(source?.id!==pinned.id||source?.parameterExpressionSHA256!==pinned.parameterExpressionSHA256)
    fail('The radial exponent uses another source-parameter profile.');
  const names=['h','T','Md'],definitions=Object.fromEntries(names.map(name=>[name,source.parametersExactExpressions?.[name]]));
  for(const name of names)if(!exact(definitions[name],pinned.parametersExactExpressions[name]))
    fail('The original positive h definition was changed at '+name+'.');
  return {schema:'MathScope.OriginalPhysicalTorusRadialEquationBinding/1',
    specification:{...ORIGINAL_RADIAL_PHASE_SPECIFICATION,equations:[...ORIGINAL_RADIAL_PHASE_SPECIFICATION.equations]},
    roots:{...expected,actualDr:actual.dr},nodes:closure.nodes,
    parameterBindings:{profileId:source.id,parameterExpressionSHA256:source.parameterExpressionSHA256,
      definitions:structuredClone(definitions),expandedH:'exp(-8002*(exp(1048576)+10))',strictPositiveSourceRetained:true},
    comparison:{method:'Literal typed arithmetic trees, preserving original binary parentheses and only commuting binary add/multiply.',
      sameDrRoot:actual.dr===expected.dr,allSixExpectedBodiesMatched:true,oldMissingFactorAccepted:false},
    scope:{radialExponentEquationOnly:true,privateParentAuthenticationRequired:true,sourceNumericValueEvaluated:false,
      fullPhysicalGraphExecutionProved:false,newM2CompletionClaim:false}};
}
