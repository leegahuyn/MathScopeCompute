/** Read the sealed original FiveMap source and construct an independently
 * polarized conservative cylindrical PDE residual. This binds expressions,
 * NOT the still-open mathematical equality or smooth forcing theorem. */
import {assertActualPostFiveFull3DPDE} from './source-postfive-full-3d-residual.mjs';
import {exactRealCylindricalPDE,originalCylindricalDifferentialOperators} from '../navier/source-harmonic-assembly.mjs';
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_ORIGINAL_POSTFIVE_SPLIT_SOURCE'});};
const isRoot=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes?.[x];
function cylindricalBilinear(G,D,a,b){
  const {Dr,Dz,angular,R}=D;
  const result=b.map(x=>G.add(G.mul(a[0],Dr(x)),G.mul(a[1],angular(x)),G.mul(a[2],Dz(x))));
  result[0]=G.sub(result[0],G.div(G.mul(a[1],b[1]),R));
  result[1]=G.add(result[1],G.div(G.mul(a[1],b[0]),R));
  return result;
}
export function buildSourcePostFiveDirectSplit(full){
  if(assertActualPostFiveFull3DPDE(full)!==true)fail('Require actual full 3D private source seal.');
  const {G,five}=full,geometry=full.source.exactOriginalPhysicalGeometry,
    source=five.temporal.frontier.signed.constructed.updated,
    previous=source.fullVelocity,oldPressure=source.fullPressure,
    delta=full.velocity.newMeanIncrements,deltaPressure=full.pressure.newMeanDelta;
  if(![previous,delta].every(v=>Array.isArray(v)&&v.length===3&&v.every(x=>isRoot(G,x)))||
     ![oldPressure,deltaPressure].every(x=>isRoot(G,x)))
    fail('Original predecessor full field and new mean pressure roots required.');
  const D=originalCylindricalDifferentialOperators(G,geometry);
  const original=exactRealCylindricalPDE(G,{geometry,velocity:previous,pressure:oldPressure});
  const increment=exactRealCylindricalPDE(G,{geometry,velocity:delta,pressure:deltaPressure});
  const crossAB=cylindricalBilinear(G,D,previous,delta);
  const crossBA=cylindricalBilinear(G,D,delta,previous);
  const conservativeDecomposed=previous.map((x,j)=>G.add(
    original.conservativeResidual[j],increment.conservativeResidual[j],
    crossAB[j],crossBA[j],G.mul(x,increment.divergence),G.mul(delta[j],original.divergence)));
  const direct=full.residual.conservative;
  if(!Array.isArray(direct)||direct.length!==3||!direct.every(x=>isRoot(G,x)))
    fail('Source-bound direct physical 3D residual missing.');
  const defects=direct.map((x,j)=>G.sub(x,conservativeDecomposed[j]));
  const divergenceDefect=G.sub(full.residual.divergence,
    G.add(original.divergence,increment.divergence));
  return {schema:'MathScope.N6.SourceBoundPostFiveDirectSplitAST/1',
    source:{full3DSourcePrivateSealValidated:true,
      originalSignedVelocityRoots:[...previous],originalSignedPressureRoot:oldPressure,
      freshMeanVelocityIncrementRoots:[...delta],freshMeanPressureDeltaRoot:deltaPressure},
    roots:{direct:[...direct],conservativeDecomposed,defects,divergenceDefect,
      oldConservative:[...original.conservativeResidual],
      incrementConservative:[...increment.conservativeResidual],
      bilinearOldNew:crossAB,bilinearNewOld:crossBA},
    checks:{allRootsValid:[...conservativeDecomposed,...defects,divergenceDefect].every(x=>isRoot(G,x)),
      actualOriginalRootIdentityProved:false,divergenceDefectProvedZero:false,
      actualRawResidualProvedZero:false,originalExternalForceRegularityProved:false},
    status:'SOURCE_BOUND_AST_CONSTRUCTED_EQUALITY_OPEN',release:'HOLD'};
}
