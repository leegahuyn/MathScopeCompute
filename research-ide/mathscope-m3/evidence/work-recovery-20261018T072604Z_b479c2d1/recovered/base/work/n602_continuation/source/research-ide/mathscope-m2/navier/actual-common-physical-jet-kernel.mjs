/** Cache coordinates per expression, not every expression/variable pair.
 * Large common backgrounds contain many bound FTC variables. The latter
 * Cartesian-product cache can exceed the JS Map entry limit without any
 * change in the mathematical graph. The inherited free-coordinate rules
 * retain all explicit function/Volterra arguments and remove bound integral
 * variables. They give the same structural independence test.
 */
import {ActualPulseThirdJetExpressions} from './actual-pulse-third-jet-kernel.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export class ActualCommonPhysicalJetExpressions extends ActualPulseThirdJetExpressions {
  dependsOn(id,variable){
    if(this.nodes[variable]?.op==='coordinate')return this.freeCoordinates(id).has(variable);
    return super.dependsOn(id,variable);
  }
  substitute(id,variable,value){
    if(id===variable)return value;
    // An absent free coordinate cannot be captured or changed. In particular,
    // each fresh FTC endpoint must not copy/cache the whole independent
    // background. Bound occurrences alone are not substitution targets.
    // All dependent replacements still use the inherited alpha-renaming,
    // moving limits, piecewise guards and original Volterra argument rules.
    if(this.nodes[variable]?.op==='coordinate'&&!this.freeCoordinates(id).has(variable))return id;
    return super.substitute(id,variable,value);
  }
}

/** Generic input-domain check, not a source or M_alpha certificate.
 * A fixed label's original representative is constant in slow calculus.
 * Only the private caller authenticates which six coordinates it supplies.
 */
export function assertSlowSignedTargetCoordinates(G,Sigma,coordinates){
  if(!Array.isArray(Sigma)||Sigma.length!==2||Sigma.some(x=>!Number.isSafeInteger(x)||!G.nodes[x]))
    fail('INVALID_INPUT','A signed local target has two existing expression roots on this actual physical graph.');
  const names=['R','Z','T','Xrep','etaRep','sRep'],allowed=names.map(n=>coordinates?.[n]);
  if(new Set(allowed).size!==6||allowed.some(x=>G.nodes[x]?.op!=='coordinate'))
    fail('INVALID_SOURCE_CONSTRUCTION','The original slow and fixed representative coordinates must come from the actual band.');
  const permit=new Set(allowed);
  if(Sigma.some(x=>[...G.freeCoordinates(x)].some(v=>!permit.has(v))))
    fail('INVALID_INPUT','The signed target may depend on the slow point and its fixed representative only; auxiliary, angular, mesh-template or unknown coordinates are outside this inverse.');
  return {allowedCoordinates:allowed,allowedNames:names,allAuxiliaryCoordinatesExcluded:true,
    frozenRepresentativeAllowed:true,targetRegularityClassVerified:false,sourceAuthenticated:false,pass:true};
}
