/** Export the complete actual background NS residual plus original stress.
 * This is the same additive common-band graph as the global source current.
 * It never transplants sibling M2 node identifiers and never declares the
 * uncorrected background NS polynomial or its flat residual to be zero.
 */
import {assertGlobalCurrentState,globalCurrentStateCertificate,globalGraphEqual} from './source-global-current.mjs';
import {materializeGlobalSourceClosure} from './source-global-expressions.mjs';
import {exactRealCylindricalPDE} from './source-harmonic-assembly.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});};

export async function exportGlobalOriginalBaseResidual(current,context={}){
  assertGlobalCurrentState(current);const G=current.G,band=current.band,{R,Z,T,theta,ell,v}=band.coordinates,
    {Q,epsilon}=band.geometry,{A,D}=band.constants,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    geometry={R,Z,T,theta,xi:band.cutoffs.xi,v,epsilon,radialFast:current.geometry.radialFast},
    velocity=[band.fields.b,G.mul(R,band.fields.F),band.fields.G],pressure=band.fields.pressure,
    direct=exactRealCylindricalPDE(G,{geometry,velocity,pressure}),
    partialR=x=>G.derivative(x,R),partialZ=x=>G.derivative(x,Z),partialT=x=>G.derivative(x,T),
    axial=x=>G.mul(epsilon,partialZ(x)),lap=x=>G.add(partialR(partialR(x)),G.div(partialR(x),R),G.mul(G.pow(epsilon,2),partialZ(partialZ(x)))),
    [b,V,U]=velocity,
    independent=[
      G.add(G.neg(G.mul(epsilon,partialT(b))),G.mul(b,partialR(b)),G.mul(U,axial(b)),G.neg(G.div(G.pow(V,2),R)),
        G.neg(G.mul(epsilon,G.sub(lap(b),G.div(b,G.pow(R,2))))),partialR(pressure)),
      G.add(G.neg(G.mul(epsilon,partialT(V))),G.mul(b,partialR(V)),G.mul(U,axial(V)),G.div(G.mul(b,V),R),
        G.neg(G.mul(epsilon,G.sub(lap(V),G.div(V,G.pow(R,2)))))),
      G.add(G.neg(G.mul(epsilon,partialT(U))),G.mul(b,partialR(U)),G.mul(U,axial(U)),G.neg(G.mul(epsilon,lap(U))),axial(pressure))],
    fullOriginalStress=current.mean.residual.fullOriginalStress,
    stressDivergence=[G.zero,G.add(partialR(fullOriginalStress[0]),G.div(G.mul(q(2),fullOriginalStress[0]),R)),
      G.add(partialR(fullOriginalStress[1]),G.div(fullOriginalStress[1],R))],
    normalized=direct.advectiveResidual.map((x,j)=>G.add(x,stressDivergence[j])),
    residualScale=power(Q,G.neg(G.add(G.mul(q(2),A),q(1,2)))),
    rotate=([r,t,z])=>[G.sub(G.mul(G.cosine(theta),r),G.mul(G.sine(theta),t)),
      G.add(G.mul(G.sine(theta),r),G.mul(G.cosine(theta),t)),z],
    physicalCartesian=rotate(normalized).map(x=>G.mul(residualScale,x)),
    physicalBackgroundNS=rotate(direct.advectiveResidual).map(x=>G.mul(residualScale,x)),
    physicalStressDivergence=rotate(stressDivergence).map(x=>G.mul(residualScale,x)),
    checks=[...independent.map((x,j)=>({id:'original-base-full-independent-cylindrical-momentum-'+j,...globalGraphEqual(G,x,direct.advectiveResidual[j])})),
      ...normalized.map((x,j)=>({id:'base-conservative-advective-difference-retains-divergence-'+j,
        ...globalGraphEqual(G,G.sub(direct.conservativeResidual[j],direct.advectiveResidual[j]),G.mul(velocity[j],direct.divergence))})),
      {id:'base-velocity-pressure-and-stress-are-the-same-private-source',pass:assertGlobalCurrentState(current)&&
        pressure===band.fields.pressure&&fullOriginalStress===current.mean.residual.fullOriginalStress},
      {id:'original-background-has-no-fast-or-angular-variables',pass:[...velocity,pressure,...fullOriginalStress].every(x=>
        [theta,geometry.xi,v].every(y=>!G.freeCoordinates(x).has(y)))},
      {id:'original-Q-and-epsilon-normalization-retained',pass:band.constants.A===G.add(q(1,2),band.constants.h)&&
        band.constants.D===G.sub(q(1,2),band.constants.h)&&epsilon===power(Q,band.constants.h)}];
  if(checks.some(x=>!x.pass))fail('The actual base residual lost an original source operand or physical normalization.');
  const roots={normalizedBackgroundVelocity:velocity,normalizedBackgroundPressure:pressure,normalizedOriginalStress:fullOriginalStress,
    normalizedBackgroundNS:direct.advectiveResidual,normalizedOriginalStressDivergence:stressDivergence,normalizedBaseResidual:normalized,
    backgroundDivergence:direct.divergence,physicalBaseResidual:physicalCartesian,physicalBackgroundNS,physicalStressDivergence,
    R,Z,T,theta,ell,Q,qActual:band.chart.qActual,s:band.chart.s,X:band.chart.X,eta:band.chart.eta,epsilon,A,D,
    physicalRadius:G.mul(G.sqrt(Q),R),physicalZ:G.mul(power(Q,D),Z),physicalTau:G.mul(Q,T),
    physicalVelocityScale:power(Q,G.neg(A)),physicalPressureScale:power(Q,G.mul(q(-2),A)),physicalResidualScale:residualScale},
    closure=materializeGlobalSourceClosure(G,Object.values(roots).flat(),{maxExpressions:100000,onProgress:context.onProgress});
  if(!closure.allRequestedSharedBodiesMaterialized)fail('An actual background residual derivative body was not generated.');
  const source=await globalCurrentStateCertificate(current),metadata={schema:'MathScope.N6.GlobalActualOriginalBaseResidual/1',
    source:{paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,
      currentGraph:source.graph,originalM2Modified:false,noSiblingGraphIDsTransplanted:true,
      activeCoefficientWindow:band.window,completeActivePrefix:band.background.rows,
      actualSourceDomain:current.domain,originalTimeCutoffAndMassCommutatorRetained:true},
    background:{velocity,pressure,stress:fullOriginalStress},direct,independent,stressDivergence,normalized,physicalCartesian,roots,checks,closure,
    definition:'E_B is the complete actual physical background NS polynomial plus divergence of the original full leading and positive stress.',
    scaling:{velocity:'Q^-A',pressure:'Q^(-2A)',residual:'Q^(-2A-1/2)',epsilon:'Q^h',physicalTimeDerivative:'-Q^-1 partial_T',
      cylindricalToCartesian:'(cos(theta)*Er-sin(theta)*Etheta, sin(theta)*Er+cos(theta)*Etheta, Ez)'},
    scope:{actualCompleteBaseResidualExpressionConstructed:true,completeSourceScalarProgramExported:true,
      actualOriginalBackgroundAndStressRetained:true,allRequestedSourceDerivativesMaterialized:true,
      residualDefinedAsZero:false,numericalResidualEnclosureComputed:false,
      selectedNearTerminalRaySubstituted:false,selectedRaySourceAtlasMembershipProved:false,
      allOrderFlatnessReprovedHere:false,finalCorrectedFieldConstructed:false,completeN6:false,wholeM3Complete:false}},
    packed=G.pack(roots,{schema:'MathScope.N6.GlobalOriginalBaseResidualScalarProgram/1',
      originalGlobalKernelDefinitions:G.globalKernelDefinitions(),capturedFunctionDefinitions:G.captureFunctionDefinitions()}),
    program=structuredClone(packed),canonical=canonicalStringify(program),
    result={...metadata,program,graph:{sha256:await sha256(canonical),nodeCount:program.nodes.length,canonicalBytes:new TextEncoder().encode(canonical).length},
      expressionNodeIdsAreNumericalValues:false,sourceProgramContainsAllNodeBodies:true};
  context.onProgress?.({stage:'global-original-base-residual-full-scalar-program-exported',nodeCount:G.nodes.length});return result;
}
