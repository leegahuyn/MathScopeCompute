/** Exact full mean equations and pressure for an updated velocity tuple.
 * All operands are retained expressions. Only a separate private source
 * wrapper may identify the tuple as the original Navier–Stokes current.
 */
import {exactFullAuxiliaryMeanPDE,originalFullMeanOperators} from './source-full-mean-equations.mjs';
import {shiftedRadialIntegrals} from './source-pressure.mjs';
import {globalGraphEqual} from './source-global-current.mjs';

const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_INPUT'});};
const scalar=(G,body,name)=>{const free=[...G.freeCoordinates(body)].sort((a,b)=>a-b);return free.length?G.share(body,free,name):body;};

export function exactNormalizedHaar(G,body,Y){
  if(!G.nodes[body]||!Array.isArray(Y)||Y.length!==2||Y[0]===Y[1]||Y.some(y=>G.nodes[y]?.op!=='coordinate'))
    fail('Normalized Haar integration requires the actual body and two distinct torus coordinates.');
  return Y.reduce((value,y)=>G.integral(value,y,G.zero,G.one),body);
}

export function exactWholeRadialIntegral(G,body,{R,innerRadius,outerRadius},tag='updated_mean'){
  const variable=G.fresh(tag+'_whole_radial');
  if(![body,R,innerRadius,outerRadius].every(x=>G.nodes[x]))fail('The complete radial envelope and source are required.');
  return G.integral(G.substitute(body,R,variable),variable,innerRadius,outerRadius);
}

export function reconstructUpdatedFullMeanPressure(G,{geometry,background,velocity,covariance,stress,rho,chi,tag='updated_full_mean'}={}){
  if(!G.nodes[rho]||!G.nodes[chi])fail('Retain both original pressure normalization and cutoff.');
  const {R,Z,T,Y,epsilon,radialFast:a,innerRadius,outerRadius,radialPrimitive}=geometry,{L}=originalFullMeanOperators(G,geometry);
  if([innerRadius,outerRadius].some(x=>!G.nodes[x]||[R,...Y].some(y=>G.freeCoordinates(x).has(y)))||
    !G.nodes[radialPrimitive]||[Z,T,...Y].some(y=>G.freeCoordinates(radialPrimitive).has(y)))
    fail('Original pressure requires a fixed radial envelope and a radial translation independent of Z, T and Y.');
  const
    input={geometry,background,velocity,covariance,stress},raw=exactFullAuxiliaryMeanPDE(G,input),
    gr=scalar(G,raw.gr,tag+'_complete_gr'),haarGr=scalar(G,exactNormalizedHaar(G,gr,Y),tag+'_haar_gr'),
    whole=body=>exactWholeRadialIntegral(G,body,geometry,tag),
    P=scalar(G,whole(haarGr),tag+'_P'),
    Jtheta=scalar(G,whole(exactNormalizedHaar(G,raw.fluxTheta,Y)),tag+'_Jtheta'),
    Jz=scalar(G,G.sub(whole(exactNormalizedHaar(G,raw.fluxZ,Y)),G.mul(G.q(1,2),whole(G.mul(G.pow(R,2),haarGr)))),tag+'_Jz'),
    source=G.sub(gr,G.mul(rho,P)),integrals=shiftedRadialIntegrals(G,{body:source,...geometry,tag:tag+'_pressure'}),
    auxiliaryIntegrals=shiftedRadialIntegrals(G,{body:L(gr),...geometry,tag:tag+'_pressure_L'}),
    slowZIntegrals=shiftedRadialIntegrals(G,{body:G.derivative(source,Z),...geometry,tag:tag+'_pressure_Z'}),
    value=G.sub(integrals.left,G.mul(chi,integrals.whole)),A0=G.mul(G.derivative(chi,R),integrals.whole),
    partialR=G.add(integrals.endpoint,G.neg(G.mul(a,auxiliaryIntegrals.left)),G.neg(A0),G.mul(chi,a,auxiliaryIntegrals.whole)),
    Lp=G.sub(auxiliaryIntegrals.left,G.mul(chi,auxiliaryIntegrals.whole)),Drp=G.add(partialR,G.mul(a,Lp)),
    innerBoundary=G.substitute(integrals.integrand,integrals.radialVariable,innerRadius),
    outerBoundary=G.substitute(integrals.integrand,integrals.radialVariable,outerRadius),
    innerZ=G.mul(innerBoundary,G.derivative(innerRadius,Z)),outerZ=G.mul(outerBoundary,G.derivative(outerRadius,Z)),
    leftZ=G.sub(slowZIntegrals.left,innerZ),wholeZ=G.add(slowZIntegrals.whole,outerZ,G.neg(innerZ)),
    pZ=G.sub(G.sub(leftZ,G.mul(G.derivative(chi,Z),integrals.whole)),G.mul(chi,wholeZ)),
    radial=G.sub(Drp,gr),Etheta=raw.Etheta,Ez=G.add(raw.Ez,G.mul(epsilon,pZ)),
    checks=[
      {id:'actual-updated-pressure-source-endpoint',pass:integrals.endpointCheck.pass&&auxiliaryIntegrals.endpointCheck.pass&&slowZIntegrals.endpointCheck.pass},
      {id:'actual-updated-pressure-full-radial-FTC',...globalGraphEqual(G,Drp,G.sub(source,A0),[source,A0,a,chi,auxiliaryIntegrals.left,auxiliaryIntegrals.whole])},
      {id:'actual-updated-radial-residual-retains-P-and-A0',...globalGraphEqual(G,radial,G.sub(G.neg(G.mul(rho,P)),A0),[gr,rho,P,A0,a,chi,auxiliaryIntegrals.left,auxiliaryIntegrals.whole])},
      {id:'actual-updated-defects-have-complete-normalized-Haar-mean',pass:[P,Jtheta,Jz].every(x=>Y.every(y=>!G.freeCoordinates(x).has(y)))},
      {id:'actual-updated-radial-defects-are-independent-of-R',pass:[P,Jtheta,Jz].every(x=>!G.freeCoordinates(x).has(R))},
      {id:'original-pressure-normalization-and-cutoff-have-no-auxiliary-variable',pass:[rho,chi].every(x=>Y.every(y=>!G.freeCoordinates(x).has(y)))},
      {id:'moving-envelope-Z-endpoint-terms-explicitly-retained',pass:wholeZ===G.add(slowZIntegrals.whole,outerZ,G.neg(innerZ))&&leftZ===G.sub(slowZIntegrals.left,innerZ)}
    ];
  if(checks.some(x=>!x.pass))fail('An updated full-pressure identity or complete integral failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return {schema:'MathScope.N6.UpdatedFullMeanPressure/1',velocity,
    mean:{raw,gr,haarGr,P,Jtheta,Jz,Etheta,Ez,radialResidual:radial,fullAngularCovariance:covariance,fullOriginalStress:stress,background,
      allOldAndQuadraticMeanTermsRetained:true,auxiliaryAveragingOnlyForThreeDefects:true},
    pressure:{source,value,rho,chi,integrals,auxiliaryIntegrals,slowZIntegrals,partialR,radialAuxiliaryDerivative:Lp,
      fullRadialDerivative:Drp,slowZDerivative:pZ,cutoffRemainder:A0,cutoffRemainderDeclaredZero:false,
      endpointTerms:{innerBoundary,outerBoundary,innerZ,outerZ,leftZ,wholeZ,
        endpointTermsDeclaredZero:false,sourceCompactSupportMayReduceThemAnalytically:true},
      fullReconstructionEquation:'p_m=T0(g_r-rho*P), after recomputing g_r and P from this complete updated velocity.',
      allAuxiliaryModesRetained:true,actualPressureDifferentiation:'Literal finite radial Leibniz rule, torus translation and original cutoff product rule.'},
    checks,sourceAuthenticated:false,fullPhysicalNonzeroAngularPDEConstructed:false,
    exactExpressionsAreNumericalEnclosures:false,allOrderClassBoundsEstablished:false};
}
