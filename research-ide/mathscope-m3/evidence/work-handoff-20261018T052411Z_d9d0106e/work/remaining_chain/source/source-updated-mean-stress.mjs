/** Corollary8.5 on a complete updated angular mean.
 *
 * The two stresses are built from the newly reconstructed full pressure
 * and its current E/P/J. Generic input does not receive source authority.
 * The complete weighted moments, torus faces, radial endpoint fluxes,
 * pressure moment and cutoff errors remain expressions. Only a separately
 * authenticated shell/periodicity/conservation proof may reduce them.
 */
import {exactFullAuxiliaryMeanPDE,originalFullMeanOperators} from './source-full-mean-equations.mjs';
import {exactNormalizedHaar} from './source-updated-mean-pressure.mjs';
import {globalGraphEqual} from './source-global-current.mjs';

const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_INPUT'});};
const present=(G,x)=>Number.isSafeInteger(x)&&!!G.nodes[x];

/** Exact integral of an auxiliary derivative by the two opposite faces.
 * It is retained for nonperiodic controls; periodicity is never assumed
 * merely because the coordinates are called auxiliary torus coordinates.
 */
export function exactHaarDerivativeFaces(G,body,Y,index){
  if(!present(G,body)||!Array.isArray(Y)||Y.length!==2||Y[0]===Y[1]||Y.some(y=>G.nodes[y]?.op!=='coordinate')||![0,1].includes(index))
    fail('An actual body, both distinct auxiliary coordinates and one face direction are required.');
  const y=Y[index],other=Y[1-index],right=G.substitute(body,y,G.one),left=G.substitute(body,y,G.zero),
    difference=G.sub(right,left),value=G.integral(difference,other,G.zero,G.one);
  return {body,direction:y,otherDirection:other,left,right,difference,value,
    identity:'Haar(partial_yj f)=integral_0^1[f(yj=1)-f(yj=0)]dy_other',
    periodicFacesDeclaredEqual:false,sourceAuthenticated:false};
}

export function reconstructUpdatedMeanStress(G,{geometry,stage,tag='updated_mean_stress'}={}){
  const O=originalFullMeanOperators(G,geometry),{R,Z,T,Y,Dr,Dz,time,De}=O,
    {epsilon,ci,vr,vt,radialFast:a,innerRadius,outerRadius}=geometry,
    coordinates=[R,Z,T,...Y],independent=(body,vars)=>present(G,body)&&vars.every(x=>!G.freeCoordinates(body).has(x));
  if(![innerRadius,outerRadius,epsilon,ci,...vr,...vt].every(x=>independent(x,coordinates))||
    !independent(a,[Z,T,...Y])||stage?.schema!=='MathScope.N6.UpdatedFullMeanPressure/1')
    fail('Use a complete updated pressure stage and the original fixed-envelope, fixed-label normalized derivative geometry.');
  const {velocity}=stage,{background,fullAngularCovariance:W,fullOriginalStress:stress}=stage.mean??{},
    {rho,chi,value:pressure,slowZDerivative:pZ}=stage.pressure??{},
    {P,Jtheta,Jz}=stage.mean??{};
  if(![rho,chi,pressure,pZ,P,Jtheta,Jz].every(x=>present(G,x))||![rho,chi].every(x=>independent(x,Y))||
    ![P,Jtheta,Jz].every(x=>independent(x,[R,...Y])))
    fail('Retain the latest complete P/J, full mean pressure, fixed normalized bump and cutoff.');
  const raw=exactFullAuxiliaryMeanPDE(G,{geometry,background,velocity,covariance:W,stress}),
    freshRows=['gr','Etheta','Ez','fluxTheta','fluxZ'],
    exactCurrentRows=freshRows.every(name=>raw[name]===stage.mean.raw?.[name])&&stage.mean.Etheta===raw.Etheta&&
      stage.mean.Ez===G.add(raw.Ez,G.mul(epsilon,pZ));
  if(!exactCurrentRows)fail('The tangential stress must use the same complete updated mean equations and its newly reconstructed pressure.');
  const radialVariable=geometry.radialVariable??G.fresh(tag+'_radial'),q=(n,d=1)=>G.q(n,d);
  if(G.nodes[radialVariable]?.op!=='coordinate'||coordinates.includes(radialVariable))fail('The radial integration variable must be distinct and bound.');
  const at=(body,r)=>G.substitute(body,R,r),
    whole=body=>G.integral(at(body,radialVariable),radialVariable,innerRadius,outerRadius),
    primitive=body=>G.integral(at(body,radialVariable),radialVariable,innerRadius,R),
    haar=body=>exactNormalizedHaar(G,body,Y),
    rhoMass=whole(rho),cRho=G.mul(q(1,2),whole(G.mul(G.pow(R,2),rho))),
    targets=[G.mul(epsilon,G.derivative(Jtheta,Z)),G.mul(epsilon,G.derivative(G.add(Jz,G.mul(cRho,P)),Z))],
    sigma=[G.div(rho,G.pow(R,2)),G.div(rho,R)],
    b=background.b,V=background.V,G0=background.G,{beta,v,gamma}=velocity,
    radialFluxes=[
      G.sub(G.mul(G.pow(R,2),G.add(G.mul(b,v),G.mul(beta,V),G.mul(beta,v),W.rtheta,G.neg(stress[0]))),
        G.mul(epsilon,G.sub(G.mul(G.pow(R,2),Dr(v)),G.mul(R,v)))),
      G.sub(G.mul(R,G.add(G.mul(b,gamma),G.mul(beta,G0),G.mul(beta,gamma),W.rz,G.neg(stress[1]))),G.mul(epsilon,R,Dr(gamma)))],
    axialFluxes=[G.sub(raw.fluxTheta,G.mul(epsilon,G.pow(R,2),Dz(v))),G.sub(raw.fluxZ,G.mul(epsilon,R,Dz(gamma)))],
    weightedVelocities=[G.mul(G.pow(R,2),v),G.mul(R,gamma)],
    weightedRawResiduals=[G.mul(G.pow(R,2),raw.Etheta),G.mul(R,raw.Ez)],
    pointwiseBalances=weightedVelocities.map((w,j)=>G.add(time(w),Dr(radialFluxes[j]),Dz(axialFluxes[j]))),
    pointwiseChecks=pointwiseBalances.map((right,j)=>({id:'complete-weighted-'+['theta','z'][j]+'-conservative-flux',
      ...globalGraphEqual(G,weightedRawResiduals[j],right)}));
  if(pointwiseChecks.some(x=>!x.pass))fail('A complete weighted mean equation lost a time, cylindrical, stress or viscous flux.');

  const conservation=weightedVelocities.map(w=>whole(haar(w))),
    pressureMoment=whole(G.mul(R,haar(pressure))),radialSourceMoment=G.mul(q(1,2),whole(G.mul(G.pow(R,2),stage.mean.haarGr))),
    pressureMomentDefect=G.sub(G.add(pressureMoment,radialSourceMoment),G.mul(cRho,P)),
    rows=[2,1].map((weight,j)=>{
      const name=['theta','z'][j],residual=[stage.mean.Etheta,stage.mean.Ez][j],mean=haar(residual),
        weightedMean=G.mul(G.pow(R,weight),mean),moment=whole(weightedMean),
        source=G.sub(mean,G.mul(sigma[j],targets[j])),weightedSource=G.mul(G.pow(R,weight),source),
        left=primitive(weightedSource),total=whole(weightedSource),compact=G.sub(left,G.mul(chi,total)),
        value=G.neg(G.div(compact,G.pow(R,weight))),cutoff=G.div(G.mul(G.derivative(chi,R),total),G.pow(R,weight)),
        primitiveDerivative=G.sub(weightedSource,G.mul(G.derivative(chi,R),total)),
        radialDerivative=G.sub(G.div(G.mul(q(weight),compact),G.pow(R,weight+1)),G.div(primitiveDerivative,G.pow(R,weight))),
        weightedDivergence=G.add(radialDerivative,G.div(G.mul(q(weight),value),R)),
        expectedDivergence=G.add(G.neg(source),cutoff),
        sourceLinearity=globalGraphEqual(G,weightedSource,G.sub(weightedMean,G.mul(rho,targets[j])),[rho,targets[j],mean,R]),
        divergenceCheck=globalGraphEqual(G,weightedDivergence,expectedDivergence,[compact,total,source,R,G.derivative(chi,R)]),
        radialBoundary=haar(G.sub(at(radialFluxes[j],outerRadius),at(radialFluxes[j],innerRadius))),
        timeFaces=Y.map((_,d)=>exactHaarDerivativeFaces(G,weightedVelocities[j],Y,d)),
        radialFaces=Y.map((_,d)=>exactHaarDerivativeFaces(G,radialFluxes[j],Y,d)),
        terms={slowTime:G.neg(G.mul(epsilon,G.derivative(conservation[j],T))),
          axialViscosity:G.neg(G.mul(G.pow(epsilon,3),G.derivative(G.derivative(conservation[j],Z),Z))),
          radialBoundary,
          fastTimeFaces:whole(G.mul(ci,G.add(...timeFaces.map((f,d)=>G.mul(vt[d],f.value))))),
          radialTorusFaces:whole(G.mul(a,G.add(...radialFaces.map((f,d)=>G.mul(vr[d],f.value))))),
          pressureMoment:j?G.mul(epsilon,G.derivative(pressureMomentDefect,Z)):G.zero},
        compatibilityDifference=G.sub(moment,targets[j]),compatibilityRemainder=G.add(...Object.values(terms));
      if(!sourceLinearity.pass||!divergenceCheck.pass||![mean,source,total,value].every(x=>independent(x,Y))||!independent(total,[R]))
        fail('A weighted tangential primitive or complete auxiliary mean was altered.');
      return {name,weight,residual,mean,moment,target:targets[j],sigma:sigma[j],source,weightedSource,
        integrals:{radialVariable,innerRadius,outerRadius,left,whole:total,compact},value,radialDerivative,
        weightedDivergence,expectedDivergence,cutoffRemainder:cutoff,sourceLinearity,divergenceCheck,
        exactLinearity:{rawWhole:total,expandedWhole:G.sub(moment,G.mul(rhoMass,targets[j])),
          radialIndependentTarget:independent(targets[j],[R]),checkedIntegrandIdentity:sourceLinearity,
          mechanicalIntegralReduction:false},
        compatibility:{difference:compatibilityDifference,remainder:compatibilityRemainder,terms,
          timeFaces,radialFaces,conservationMoment:conservation[j],
          derivation:['The complete pointwise weighted conservative-flux identity is checked before integration.',
            'Finite radial FTC and auxiliary FTC retain both endpoint and torus face terms.',
            'Fixed radial limits and fixed epsilon permit slow differentiation of each retained whole moment.',
            'For z, the full pressure moment defect keeps the whole product c_rho*P inside partial_Z.'],
          boundaryOrMomentRemaindersDeclaredZero:false,mechanicalIntegralReduction:false},
        auxiliaryIndependenceProvesRadialShiftTrivial:true,cutoffRemainderDeclaredZero:false,
        compactSupportEstablished:false,sourceAuthenticated:false};
    });
  return {schema:'MathScope.N6.UpdatedFullMeanTangentialStress/1',geometry,velocity,meanInput:{P,Jtheta,Jz,
      Etheta:stage.mean.Etheta,Ez:stage.mean.Ez,pressure,pressureZ:pZ,fullCovariance:W,fullOriginalStress:stress},
    rho,chi,rhoMass,cRho,sigma,targets,rows,Sigma:rows.map(r=>r.value),
    fluxes:{radial:radialFluxes,axial:axialFluxes,weightedVelocities,weightedRawResiduals,pointwiseBalances},
    conservation,pressureMoment:{pressureMoment,radialSourceMoment,defect:pressureMomentDefect,fullProduct:G.mul(cRho,P)},
    checks:[{id:'same-complete-updated-mean-and-pressure',pass:exactCurrentRows},...pointwiseChecks,
      ...rows.flatMap(r=>[{id:r.name+'-complete-source-subtraction',...r.sourceLinearity},{id:r.name+'-weighted-primitive-FTC',...r.divergenceCheck}])],
    originalEquations:['8.3','8.15','8.16','8.18'],
    baseFlatResidualRemainsSeparate:true,allPressureAndNonlinearMeanTermsRetained:true,
    genericConservationPeriodicityAndShellSupportAssumed:false,
    everyCutoffOrCompatibilityRemainderDeclaredZero:false,sourceAuthenticated:false,
    allOrderClassBoundsEstablished:false,completeFourStepCycle:false,initializedJ0:false,completeN6:false};
}
