/** Source-bound normalized pressure with the actual radial torus shift.
 *
 * The finite source member is kept periodic in its original Yi variables.
 * The pressure uses the full angular covariance before auxiliary averaging.
 * No nearest-integer lift is differentiated. Smooth derivatives are formed
 * from the original compact local body before periodic zero extension.
 */
import {assertActualCurrentMeanState} from './source-current-state.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {normalizeEqualPiecewiseBranches} from '../../mathscope-m2/navier/actual-full-curl.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap();
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});};
const record=p=>({schema:p.schema,source:p.source,geometry:p.geometry,rows:p.rows,covariance:p.covariance,radial:p.radial,pressure:p.pressure,residual:p.residual,checks:p.checks,scope:p.scope});
const dot=(G,a,b)=>G.add(...a.map((x,i)=>G.mul(x,b[i])));

function identity(G,left,right,atomicNodes=[]){
  const normalized=normalizeEqualPiecewiseBranches(G,G.sub(left,right),atomicNodes);
  return {...sourceGraphRationalIdentity(G,normalized.normalized,{atomicNodes,maxTerms:160000}),left,right,equalBranchNormalization:normalized.identities};
}

function shared(G,body,name){
  const coordinates=[...G.freeCoordinates(body)].sort((a,b)=>a-b);
  return coordinates.length?G.share(body,coordinates,name):body;
}

/** Materialize the shifted integral in (8.5) for a retained body.
 * This reusable calculus helper grants no source or support authority.
 * The private caller below binds the original periodic body and proves
 * that its fixed endpoints enclose the whole active shell.
 * This explicit integral does not turn a Fourier/radial tail into zero.
 */
export function shiftedRadialIntegrals(G,{body,R,Y,radialPrimitive,vr,innerRadius,outerRadius,tag}){
  const r=G.fresh('n6_shifted_radial_'+tag),shift=G.sub(G.substitute(radialPrimitive,R,r),radialPrimitive),
    shiftedY=Y.map((y,j)=>G.add(y,G.mul(shift,vr[j]))),
    integrand=G.simultaneousSubstitute(body,[R,...Y],[r,...shiftedY]),
    left=G.integral(integrand,r,innerRadius,R),whole=G.integral(integrand,r,innerRadius,outerRadius),
    rawEndpoint=G.substitute(integrand,r,R),endpointShift=G.substitute(shift,r,R),
    endpointShiftCheck=identity(G,endpointShift,G.zero,[radialPrimitive]);
  if(!endpointShiftCheck.pass)fail('The original radial torus translation does not vanish at its own endpoint.');
  // The inherited graph deliberately has no general analytic simplifier.
  // Substituting r=R in phi(r)-phi(R) can retain add(phi(R),-phi(R))
  // inside a sine, a shared function argument or a periodic lift. First
  // prove this exact rational identity, then apply expression congruence.
  // Never replace an unverified endpoint, Fourier term or integral by zero.
  const endpoint=endpointShift===G.zero?rawEndpoint:G.substitute(rawEndpoint,endpointShift,G.zero);
  return {body,radialVariable:r,shift,shiftedY,integrand,left,whole,rawEndpoint,endpoint,
    originalRadialPrimitive:radialPrimitive,endpointShift,endpointShiftCheck,
    endpointReduction:{rule:'Substitution congruence using the verified exact identity phi(R)-phi(R)=0.',
      replacedExpression:endpointShift,replacement:G.zero,changesSourceBody:false},
    endpointCheck:identity(G,endpoint,body,[body]),
    fixedPhysicalZT:true,sourceAuthenticated:false,
    supportPremise:'The calling source constructor must prove that these fixed endpoints enclose the whole zero-extended source.'};
}

export function attachActualCurrentPressure(state,context={}){
  assertActualCurrentMeanState(state);
  const {G,physical}=state,{R,Z,T,xi,v}=physical.geometry.coordinates,Y=physical.geometry.Yi,
    {epsilon,Dgeom,ci}=physical.band.geometry,q=(n,d=1)=>G.q(n,d),
    vr=physical.geometry.basis[0],vt=physical.geometry.basis[1],
    a=physical.geometry.radialFast,radialPrimitive=physical.geometry.radialPrimitive,
    Dr=f=>G.add(G.derivative(f,R),G.mul(a,G.derivative(f,xi))),Dz=f=>G.mul(epsilon,G.derivative(f,Z)),
    De=(f,e)=>G.add(Dr(f),G.div(G.mul(q(e),f),R)),
    periodize=(body,rectangle)=>G.simultaneousSubstitute(body,[xi,v],[rectangle.xi,rectangle.v]),
    rows=[],covariance=Object.fromEntries(state.covariance.components.map(name=>[name,[]]));
  for(const row of state.rows){
    const W=row.angularMean,localGr=G.add(G.neg(De(W.rr,1)),G.neg(Dz(W.rz)),G.div(W.thetatheta,R)),
      localGrR=G.derivative(localGr,R),localGrZ=G.derivative(localGr,Z),localGrXi=G.derivative(localGr,xi),
      localTheta=G.add(De(W.rtheta,2),Dz(W.thetaz)),localZ=G.add(De(W.rz,1),Dz(W.zz)),
      full=periodize(localGr,row.rectangle),slowZ=periodize(localGrZ,row.rectangle),radialAuxiliary=periodize(localGrXi,row.rectangle),
      angularResidual=periodize(localTheta,row.rectangle),axialWithoutPressure=periodize(localZ,row.rectangle);
    for(const name of state.covariance.components)covariance[name].push(periodize(W[name],row.rectangle));
    rows.push({sign:row.sign,rectangle:row.rectangle,localGr,localGrR,localGrZ,localGrXi,full,slowZ,radialAuxiliary,
      localTheta,localZ,angularResidual,axialWithoutPressure,
      derivativeOrder:'Differentiate compact local bodies first, then take the original periodic zero extension.',
      noDerivativeOfNearestIntegerLift:true});
    context.onProgress?.({stage:'n6-full-torus-current-radial-source-'+row.sign,nodeCount:G.nodes.length});
  }
  for(const name of state.covariance.components)covariance[name]=G.add(...covariance[name]);
  const gr=G.add(...rows.map(r=>r.full)),grZ=G.add(...rows.map(r=>r.slowZ)),Lgr=G.add(...rows.map(r=>r.radialAuxiliary)),
    P=state.mean.P,{rho,cRho,chi,innerRadius,outerRadius}=state.mean.geometry,
    f=G.sub(gr,G.mul(rho,P)),fZ=G.sub(grZ,G.add(G.mul(G.derivative(rho,Z),P),G.mul(rho,G.derivative(P,Z)))),
    geometry={R,Z,T,Y:[...Y],vr:[...vr],vt:[...vt],Dgeom,ci,radialPrimitive,radialFast:a,innerRadius,outerRadius},
    integrals=shiftedRadialIntegrals(G,{body:f,...geometry,tag:'pressure'}),
    radialAuxiliaryIntegrals=shiftedRadialIntegrals(G,{body:Lgr,...geometry,tag:'radial_auxiliary'}),
    slowZIntegrals=shiftedRadialIntegrals(G,{body:fZ,...geometry,tag:'slow_Z'}),
    p=G.sub(integrals.left,G.mul(chi,integrals.whole)),A0=G.mul(G.derivative(chi,R),integrals.whole),
    // This is the literal Leibniz/translation derivative. Its integrands
    // use the materialized local source derivative above. The two a*L
    // terms cancel; neither the cutoff error nor its source is dropped.
    partialR=G.add(integrals.endpoint,G.neg(G.mul(a,radialAuxiliaryIntegrals.left)),G.neg(A0),G.mul(chi,a,radialAuxiliaryIntegrals.whole)),
    Lp=G.sub(radialAuxiliaryIntegrals.left,G.mul(chi,radialAuxiliaryIntegrals.whole)),
    directDr=G.add(partialR,G.mul(a,Lp)),expectedDr=G.sub(f,A0),
    pZ=G.sub(G.sub(slowZIntegrals.left,G.mul(G.derivative(chi,Z),integrals.whole)),G.mul(chi,slowZIntegrals.whole)),
    pressureCheck=identity(G,directDr,expectedDr,[f,A0,a,chi,radialAuxiliaryIntegrals.left,radialAuxiliaryIntegrals.whole]),
    incorrectWithoutCutoff=identity(G,directDr,f,[f,A0,a,chi,radialAuxiliaryIntegrals.left,radialAuxiliaryIntegrals.whole]),
    Sigma=state.mean.residual.fullOriginalStress,slowDe=(f,e)=>G.add(G.derivative(f,R),G.div(G.mul(q(e),f),R)),
    Etheta=G.sub(G.add(...rows.map(r=>r.angularResidual)),slowDe(Sigma[0],2)),
    Ez=G.sub(G.add(...rows.map(r=>r.axialWithoutPressure),G.mul(epsilon,pZ)),slowDe(Sigma[1],1)),
    radialResidual=G.sub(directDr,gr),expectedRadialResidual=G.sub(G.neg(G.mul(rho,P)),A0),
    radialResidualCheck=identity(G,radialResidual,expectedRadialResidual,[gr,rho,P,A0,a,chi,radialAuxiliaryIntegrals.left,radialAuxiliaryIntegrals.whole]),
    sqrtTwo=G.sqrt(q(2)),lengthResidual=identity(G,G.sub(dot(G,vr,vr),Dgeom),G.sub(G.pow(sqrtTwo,2),q(2))),
    geometryChecks=[{id:'original-radial-torus-direction-length',pass:lengthResidual.pass&&G.nodes[sqrtTwo].op==='sqrt_positive'&&G.nodes[sqrtTwo].args[0]===q(2),
        clearedIdentity:lengthResidual,squareRootPremise:'The actual positive square root of the rational2 has square2.'},
      {id:'original-radial-time-directions-orthogonal',...identity(G,dot(G,vr,vt),G.zero)},
      {id:'same-original-physical-radial-primitive',pass:G.derivative(radialPrimitive,R)===a},
      {id:'fixed-band-radial-shift-independent-of-Z-T-Y',pass:[Z,T,...Y].every(x=>!G.freeCoordinates(radialPrimitive).has(x))},
      {id:'current-pressure-defect-independent-of-auxiliary-variable',pass:Y.every(x=>!G.freeCoordinates(P).has(x))},
      {id:'actual-full-radial-source-still-depends-on-auxiliary-torus',pass:Y.some(x=>G.freeCoordinates(gr).has(x))}],
    checks=[...geometryChecks,
      {id:'shifted-source-endpoint-is-original-source',pass:integrals.endpointCheck.pass&&radialAuxiliaryIntegrals.endpointCheck.pass&&slowZIntegrals.endpointCheck.pass},
      {id:'actual-pressure-full-radial-identity',...pressureCheck},
      {id:'actual-pressure-residual-retains-rho-P-and-A0',...radialResidualCheck},
      {id:'omitted-radial-cutoff-error-negative-control',pass:!incorrectWithoutCutoff.pass,incorrectIdentity:incorrectWithoutCutoff},
      {id:'all-current-full-covariances-in-original-torus',pass:state.covariance.components.every(n=>Y.some(y=>G.freeCoordinates(covariance[n]).has(y)))},
      {id:'source-prefix-remains-private-and-unchanged',pass:assertActualCurrentMeanState(state)}];
  if(checks.some(c=>!c.pass))fail('The actual pressure source checks failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const result={schema:'MathScope.N6.ActualCurrentPressure/1',G,state,
    source:{samePrivateSourceState:true,actualOriginalPotentialCurls:true,sourceParametersReplaced:false,
      paperSHA256:state.source.paperSHA256,parameterExpressionSHA256:state.source.parameterExpressionSHA256},
    geometry,rows,covariance,radial:{gr,grZ,Lgr,P,auxiliaryAverage:state.mean.gr},
    pressure:{f,rho,cRho,chi,integrals,radialAuxiliaryIntegrals,slowZIntegrals,value:p,cutoffRemainder:A0,
      partialR,radialAuxiliaryDerivative:Lp,fullRadialDerivative:directDr,slowZDerivative:pZ,
      radialIdentity:pressureCheck,auxiliaryZeroMode:state.mean.pressure.value,
      definingEquation:'p_m=T_0(g_r-rho*P), with the original fixed-physical-(z,t) radial torus translation.',
      derivativeRule:'Partial_R I f=f-a I(Lf); L I f=I(Lf); partial_Z Ic f=Ic(partial_Z f)-(partial_Z chi)*Jf.',
      cutoffRemainderDeclaredZero:false,cutoffRemainderAllOrderFlatBoundAttached:false},
    residual:{Etheta,Ez,radial:radialResidual,expectedRadial:expectedRadialResidual,fullOriginalStress:Sigma,
      pressureReconstructedBeforeTangentialResidual:true,backgroundFlatResidualSeparate:true,
      nonzeroAngularResidualSeparate:true,fullPDEDeclaredSolved:false},checks,
    scope:{actualFullAngularMeanPressureConstructed:true,allAuxiliaryModesRetainedInPressure:true,
      actualCurrentTangentialMeanResidualConstructed:true,oneOriginalBandAndMeshMember:true,
      allBandsAndLabelsAssembled:false,actualTemporalUpdateApplied:false,actualFiveMomentUpdateApplied:false,
      initializedJ0:false,completeN6:false,numericalEnclosureComputed:false,newLeanProofIssued:false}};
  const count=G.nodes.length;
  seals.set(result,{G,state,count,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),record:canonicalStringify(record(result))});
  context.onProgress?.({stage:'n6-current-full-pressure-and-residual-sealed',nodeCount:count});
  return result;
}

export function assertActualCurrentPressure(p){
  const s=seals.get(p);
  if(!s||s.G!==p.G||s.state!==p.state||s.record!==canonicalStringify(record(p))||
    s.prefix!==canonicalStringify(p.G.nodes.slice(0,s.count))||!p.G.functionDefinitionsUnchanged(s.definitions))
    fail('Use the unchanged privately reconstructed actual pressure; serialized fields or derivative arrays are not accepted.');
  assertActualCurrentMeanState(s.state);return true;
}

export async function actualCurrentPressureCertificate(p){
  assertActualCurrentPressure(p);const s=seals.get(p),data=record(p),encoded=canonicalStringify({metadata:data,nodes:p.G.nodes.slice(0,s.count),definitions:s.definitions});
  return {...data,graph:{sha256:await sha256(encoded),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(encoded).length},
    execution:'ACTUAL_SOURCE_EXPRESSION_CONSTRUCTION',expressionIsNumericalValue:false,
    remaining:['Original temporal mean inverse and divergence-free axial realization.','Five-moment correction of the newly updated state.','All-label assembly and every required derivative/tail constant.']};
}
