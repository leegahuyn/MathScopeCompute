/** Original temporal mean realization, including the full T1 cutoff.
 * The supplied Fourier solutions are exact expressions, not finite sums.
 * This calculus kernel grants no source authenticity to those operands.
 */
import {originalFullMeanOperators} from './source-full-mean-equations.mjs';
import {shiftedRadialIntegrals} from './source-pressure.mjs';
import {globalGraphEqual} from './source-global-current.mjs';

const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_INPUT'});};

export function realizeOriginalTemporalPotential(G,{geometry,inverseTheta,inverseZ,tag='temporal'}={}){
  if(![inverseTheta,inverseZ].every(x=>Number.isSafeInteger(x)&&G.nodes[x]))
    fail('Retain both exact original Fourier inverse components.');
  const {R,Z,Y,epsilon,ci,chi,radialFast:a}=geometry,{L,Dr,Dz,De}=originalFullMeanOperators(G,geometry),
    deltaV=G.neg(G.div(inverseTheta,ci)),gammaDesired=G.neg(G.div(inverseZ,ci)),weighted=G.mul(R,gammaDesired),
    integrals=shiftedRadialIntegrals(G,{body:weighted,...geometry,tag:tag+'_T1'}),
    angularIntegrals=shiftedRadialIntegrals(G,{body:L(weighted),...geometry,tag:tag+'_T1_L'}),
    rawPsi=G.div(G.sub(integrals.left,G.mul(chi,integrals.whole)),R),
    free=[...G.freeCoordinates(rawPsi)].sort((a,b)=>a-b),psi=free.length?G.share(rawPsi,free,tag+'_actual_meridional_potential'):rawPsi,
    beta=G.neg(Dz(psi)),gamma=De(psi,1),
    // Explicit endpoint/phase/cutoff derivative of the retained T1 body.
    numerator=G.sub(integrals.left,G.mul(chi,integrals.whole)),
    partialRnumerator=G.add(integrals.endpoint,G.neg(G.mul(a,angularIntegrals.left)),
      G.neg(G.mul(G.derivative(chi,R),integrals.whole)),G.mul(chi,a,angularIntegrals.whole)),
    Lnumerator=G.sub(angularIntegrals.left,G.mul(chi,angularIntegrals.whole)),
    radialNumerator=G.add(partialRnumerator,G.mul(a,Lnumerator)),
    cutoffRemainder=G.div(G.mul(G.derivative(chi,R),integrals.whole),R),
    realizedGammaFromFTC=G.div(radialNumerator,R),
    gammaIdentity=globalGraphEqual(G,realizedGammaFromFTC,G.sub(gammaDesired,cutoffRemainder),
      [R,a,chi,gammaDesired,integrals.whole,angularIntegrals.left,angularIntegrals.whole]),
    divergence=G.add(De(beta,1),Dz(gamma)),divergenceIdentity=globalGraphEqual(G,divergence,G.zero),
    originalScaleIdentity=globalGraphEqual(G,G.mul(ci,deltaV),G.neg(inverseTheta),[ci,inverseTheta]),
    slowTime={angular:G.neg(G.mul(epsilon,G.derivative(deltaV,geometry.T))),
      axial:G.neg(G.mul(epsilon,G.derivative(gamma,geometry.T)))};
  if(!gammaIdentity.pass||!divergenceIdentity.pass||!originalScaleIdentity.pass)
    fail('The actual temporal meridional potential lost a phase, scale, cutoff or divergence term.');
  return {schema:'MathScope.N6.TemporalMeridionalPotential/1',inverseTheta,inverseZ,
    velocity:{beta,v:deltaV,gamma},gammaDesired,weighted,rawPsi,psi,integrals,angularIntegrals,
    explicitRadialDerivative:{numerator,partialRnumerator,Lnumerator,radialNumerator,realizedGammaFromFTC},
    cutoffRemainder,cutoffRemainderDeclaredZero:false,
    checks:[{id:'original-ci-inverse-factor',...originalScaleIdentity},{id:'original-T1-endpoint-and-A1',...gammaIdentity},
      {id:'complete-meridional-incompressibility',...divergenceIdentity}],
    slowTime,slowTimeTermsRetained:true,
    equations:['(8.14)','(8.20)'],
    physicalIdentity:'Delta gamma=gamma_d-A1(gamma_d); Delta beta=-epsilon*partial_Z T1(gamma_d).',
    zeroMeanDerivation:'The inverse has zero Haar mean for each slow point. Normalized Haar translation invariance and Fubini keep T1 and every slow/radial derivative at zero mean.',
    zeroMeanProofRequiresSourceInverse:true,sourceAuthenticated:false};
}
