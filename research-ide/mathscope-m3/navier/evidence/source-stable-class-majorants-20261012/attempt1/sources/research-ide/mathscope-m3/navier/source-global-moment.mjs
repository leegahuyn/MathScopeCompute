/** Five original mean-patch bumps applied to the AUTHENTICATED global P/J.
 *
 * This is an actual source update of the pre-temporal, zero auxiliary-mean
 * current. It is deliberately not the initialized j=0 state: (8.20) must
 * first be applied to the full nonzero auxiliary modes for that claim.
 * Every nonlinear term, the entire original background and all six
 * all-label Haar covariances remain in the recomputed mean equations.
 */
import {assertGlobalCurrentState,globalCurrentStateCertificate,globalMeanGeometry,globalGraphEqual,shareGlobalScalar} from './source-global-current.mjs';
import {sourceMeanMomentBridge} from './source-mean-map.mjs';
import {actualMeanPatchDefinitions} from '../../mathscope-m2/navier/actual-pulse-meanpatch.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});};
const progress=(context,stage,G)=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length});};
const meanNames=['beta','v','gamma'],covarianceNames=['rr','rtheta','rz','thetatheta','thetaz','zz'];
const valid=(G,values)=>values.every(x=>Number.isSafeInteger(x)&&G.nodes[x]);

/** Lagrange inverse of the three geometric copies and the factored axial
 * inverse. All operands are exact graph nodes. Nonzero denominators are a
 * separate source obligation; this algebraic routine issues no authority.
 */
export function exactFiveMomentCoefficients(G,{angularNodes,angularFactors,angularTargets,axialNode,axialRatio,axialFactors,axialTarget}={}){
  if(![angularNodes,angularFactors,angularTargets].every(a=>Array.isArray(a)&&a.length===3)||
    !Array.isArray(axialFactors)||axialFactors.length!==2||
    !valid(G,[...angularNodes,...angularFactors,...angularTargets,axialNode,axialRatio,...axialFactors,axialTarget]))
    fail('Use three complete geometric moment rows and two complete axial rows.');
  const z=angularNodes,normalizedTargets=angularTargets.map((x,i)=>G.div(x,angularFactors[i])),
    inverse=Array.from({length:3},()=>[]);
  for(let i=0;i<3;i++){
    const [j,k]=[0,1,2].filter(j=>j!==i),den=G.mul(G.sub(z[i],z[j]),G.sub(z[i],z[k]));
    inverse[0][i]=G.div(G.mul(z[j],z[k]),den);
    inverse[1][i]=G.neg(G.div(G.add(z[j],z[k]),den));
    inverse[2][i]=G.inv(den);
  }
  const angular=inverse.map(row=>G.add(...row.map((x,i)=>G.mul(x,normalizedTargets[i])))),
    angularMatrix=z.map((x,i)=>[G.one,x,G.pow(x,2)].map(y=>G.mul(angularFactors[i],y))),
    angularValues=angularMatrix.map(row=>G.add(...row.map((x,j)=>G.mul(x,angular[j])))),
    gap=G.sub(G.one,axialRatio),r=G.div(axialTarget,axialFactors[1]),
    axial=[G.div(r,gap),G.neg(G.div(r,G.mul(axialNode,gap)))],
    axialMatrix=[[axialFactors[0],G.mul(axialFactors[0],axialNode)],
      [axialFactors[1],G.mul(axialFactors[1],axialNode,axialRatio)]],
    axialValues=axialMatrix.map(row=>G.add(...row.map((x,j)=>G.mul(x,axial[j])))),
    atoms=[...z,...angularFactors,...angularTargets,axialNode,axialRatio,...axialFactors,axialTarget],
    check=(a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes:atoms,maxTerms:180000}),
    checks=[...angularValues.map((x,i)=>({id:'angular-moment-'+i,...check(x,angularTargets[i])})),
      {id:'axial-zero-weighted-moment',...check(axialValues[0],G.zero)},
      {id:'axial-target-moment',...check(axialValues[1],axialTarget)}];
  if(checks.some(x=>!x.pass))fail('The exact five-row inverse failed.');
  return {angular,axial,inverse,angularMatrix,axialMatrix,angularValues,axialValues,normalizedTargets,gap,r,checks,
    nonzeroDenominators:[...angularFactors,...axialFactors,axialNode,gap,
      G.sub(z[0],z[1]),G.sub(z[0],z[2]),G.sub(z[1],z[2])],
    sourceAuthenticated:false,binary64ExponentialsSubtracted:false,sourceLambdaReplaced:false};
}

/** Complete Haar-zero-mode equations (8.3). They are obtained from the
 * full equations by averaging: auxiliary derivatives integrate to zero.
 * This routine does not replace the nonzero auxiliary modes by zero in a
 * purported full PDE residual. pressure is the newly reconstructed mean.
 */
export function exactAuxiliaryMeanPDE(G,{coordinates,epsilon,background,velocity,covariance,stress,pressure=G.zero}={}){
  const {R,Z,T}=coordinates??{},b=background?.b,V=background?.V,G0=background?.G,
    beta=velocity?.beta,v=velocity?.v,gamma=velocity?.gamma,W=covariance;
  if(!W||!Array.isArray(stress)||stress.length!==2||!valid(G,[R,Z,T,epsilon,b,V,G0,beta,v,gamma,...covarianceNames.map(n=>W[n]),...stress,pressure]))
    fail('Retain every background, mean-velocity, full-curl covariance and stress operand.');
  const dR=x=>G.derivative(x,R),Dz=x=>G.mul(epsilon,G.derivative(x,Z)),time=x=>G.neg(G.mul(epsilon,G.derivative(x,T))),
    De=(x,e)=>G.add(dR(x),G.div(G.mul(G.q(e),x),R)),
    lap=x=>G.add(dR(dR(x)),G.div(dR(x),R),Dz(Dz(x))),lapVector=x=>G.sub(lap(x),G.div(x,G.pow(R,2))),
    gr=G.add(G.neg(time(beta)),G.neg(De(G.add(G.mul(G.q(2),b,beta),G.pow(beta,2),W.rr),1)),
      G.neg(Dz(G.add(G.mul(b,gamma),G.mul(G0,beta),G.mul(beta,gamma),W.rz))),
      G.div(G.add(G.mul(G.q(2),V,v),G.pow(v,2),W.thetatheta),R),G.mul(epsilon,lapVector(beta))),
    Etheta=G.add(time(v),De(G.add(G.mul(b,v),G.mul(beta,V),G.mul(beta,v),W.rtheta),2),
      Dz(G.add(G.mul(G0,v),G.mul(V,gamma),G.mul(gamma,v),W.thetaz)),G.neg(G.mul(epsilon,lapVector(v))),G.neg(De(stress[0],2))),
    Ez=G.add(time(gamma),De(G.add(G.mul(b,gamma),G.mul(beta,G0),G.mul(beta,gamma),W.rz),1),
      Dz(G.add(G.mul(G.q(2),G0,gamma),G.pow(gamma,2),W.zz,pressure)),G.neg(G.mul(epsilon,lap(gamma))),G.neg(De(stress[1],1))),
    fluxTheta=G.mul(G.pow(R,2),G.add(G.mul(G0,v),G.mul(V,gamma),G.mul(gamma,v),W.thetaz)),
    fluxZ=G.mul(R,G.add(G.mul(G.q(2),G0,gamma),G.pow(gamma,2),W.zz)),
    divergence=G.add(De(beta,1),Dz(gamma));
  return {gr,Etheta,Ez,fluxTheta,fluxZ,divergence,
    equations:['8.3','8.15'],allBackgroundAndSixCovarianceTermsRetained:true,
    auxiliaryMode:'COMPLETE_HAAR_ZERO_MODE',fullNonzeroAuxiliaryResidualConstructed:false};
}

/** Independent expansion (8.26)-(8.27). The outputs are the actual
 * nonlinear remainders; no remainder is declared zero after cancelling
 * the five linear rows. The small kernel can also be checked on arbitrary
 * polynomial fields, independently of the expensive source constructor.
 */
export function exactMeanMomentRemainders(G,{coordinates,epsilon,background,previous,increment}={}){
  const {R,Z,T}=coordinates??{},b=background?.b,V=background?.V,G0=background?.G,
    beta=previous?.beta,v=previous?.v,gamma=previous?.gamma,db=increment?.beta,dv=increment?.v,dg=increment?.gamma;
  if(!valid(G,[R,Z,T,epsilon,b,V,G0,beta,v,gamma,db,dv,dg]))fail('Use all three old mean components and all three actual increments.');
  const dR=x=>G.derivative(x,R),Dz=x=>G.mul(epsilon,G.derivative(x,Z)),De=x=>G.add(dR(x),G.div(x,R)),
    lapVector=x=>G.sub(G.add(dR(dR(x)),G.div(dR(x),R),Dz(Dz(x))),G.div(x,G.pow(R,2))),
    terms={time:G.mul(epsilon,G.derivative(db,T)),
      radial:G.neg(De(G.add(G.mul(G.q(2),b,db),G.mul(G.q(2),beta,db),G.pow(db,2)))),
      axial:G.neg(Dz(G.add(G.mul(b,dg),G.mul(G0,db),G.mul(beta,dg),G.mul(gamma,db),G.mul(db,dg)))),
      angular:G.div(G.add(G.mul(G.q(2),v,dv),G.pow(dv,2)),R),viscous:G.mul(epsilon,lapVector(db))},
    Rg=G.add(...Object.values(terms)),JthetaIntegrand=G.mul(G.pow(R,2),G.add(G.mul(gamma,dv),G.mul(v,dg),G.mul(dg,dv))),
    JzVelocityIntegrand=G.mul(R,G.add(G.mul(G.q(2),gamma,dg),G.pow(dg,2))),
    linear={PIntegrand:G.div(G.mul(G.q(2),V,dv),R),
      JthetaIntegrand:G.mul(G.pow(R,2),G.add(G.mul(G0,dv),G.mul(V,dg))),
      JzIntegrand:G.sub(G.mul(G.q(2),R,G0,dg),G.mul(R,V,dv))};
  return {Rg,terms,JthetaIntegrand,JzVelocityIntegrand,linear,
    allOldNewAndQuadraticTermsRetained:true,nonlinearRemaindersDeclaredZero:false,sourceAuthenticated:false};
}

function sourceBumps(state){
  const {G,band}=state,g=globalMeanGeometry(G,band),q=(n,d=1)=>G.q(n,d),{R,Z,T}=g,
    lambda=G.parameter('lambda'),A=band.constants.A,d=q(1,5),x=G.fresh('global_five_moment_x'),t=G.fresh('global_five_moment_t'),
    bump=G.choose(t,G.zero,G.one,G.zero,G.exp(G.neg(G.inv(G.mul(t,G.sub(G.one,t))))),G.zero),
    eta0=G.div(G.substitute(bump,t,G.mul(q(10),G.sub(G.div(x,g.x0),G.one))),g.x0),
    powers=[q(2),G.neg(G.add(q(2),G.mul(q(2),lambda))),G.neg(G.mul(q(2),lambda)),G.one,G.sub(G.one,G.mul(q(2),lambda))],
    mu=powers.map(p=>G.integral(G.mul(g.power(x,p),eta0),x,g.x0,G.mul(q(11,10),g.x0))),
    sourceT=G.parameter('T'),logK=G.add(G.mul(q(-59997,2),sourceT),q(33,10),G.mul(G.sub(q(15,2),G.mul(q(60000),sourceT)),lambda)),
    K=G.exp(logK),a=G.div(G.mul(K,g.power(G.mul(q(2),g.X0),G.add(q(1,2),lambda))),G.add(G.one,G.pow(band.chart.eta,2))),
    s=g.s,targets={P:G.mul(g.power(s,G.mul(q(2),A)),state.mean.P),
      Jtheta:G.mul(g.power(s,G.sub(G.mul(q(2),A),q(3,2))),state.mean.Jtheta),
      Jz:G.mul(g.power(s,G.sub(G.mul(q(2),A),G.one)),state.mean.Jz)},
    angularNodes=powers.slice(0,3).map(p=>G.exp(G.mul(d,p))),axialNode=G.exp(d),axialRatio=G.exp(G.mul(q(-2),d,lambda)),
    coefficients=exactFiveMomentCoefficients(G,{angularNodes,angularFactors:[mu[0],G.mul(q(2),a,mu[1]),G.neg(G.mul(a,mu[2]))],
      angularTargets:[G.zero,G.neg(targets.P),G.neg(targets.Jz)],axialNode,axialRatio,axialFactors:[mu[3],G.mul(a,mu[4])],axialTarget:G.neg(targets.Jtheta)}),
    copies=[0,1,2].map(j=>{const logScale=G.mul(q(j),d),scale=G.exp(logScale),profile=G.div(G.substitute(eta0,x,G.div(x,scale)),scale),
      inQ=G.mul(g.power(s,G.neg(A)),G.substitute(profile,x,G.div(R,G.sqrt(s))));
      return {j,logScale,scale,profile,inQ,support:[G.mul(g.x0,scale),G.mul(q(11,10),g.x0,scale)]};}),
    deltaV=G.add(...coefficients.angular.map((c,j)=>G.mul(c,copies[j].inQ))),
    gammaDesired=G.add(...coefficients.axial.map((c,j)=>G.mul(c,copies[j].inQ))),
    exponentChecks=[{id:'angular-node-exponent-2',...globalGraphEqual(G,G.mul(d,powers[0]),q(2,5))},
      {id:'axial-exponential-ratio-keeps-original-lambda',...globalGraphEqual(G,G.add(d,G.mul(q(-2),d,lambda)),G.mul(d,powers[4]))}],
    restriction=sourceMeanMomentBridge({panels:32,derivativeOrder:3}),definitions=actualMeanPatchDefinitions();
  if(!restriction.pass||!restriction.exactSource.lambdaPositive||definitions.sourceProfile!==band.family.request.sourceProfile||
    definitions.sourceHash!==restriction.source.assembly.sha256||G.source.parameterExpressionSHA256!==restriction.source.parameterExpressionSHA256)
    fail('The unchanged original reserved mean patch does not match the global source.');
  const momentRows=[
    {id:'angular-velocity-moment',raw:g.integrate(G.mul(G.pow(R,2),deltaV)),
      normalized:G.mul(g.power(s,G.sub(q(3,2),A)),coefficients.angularValues[0]),target:G.zero},
    {id:'axial-velocity-moment',raw:g.integrate(G.mul(R,gammaDesired)),
      normalized:G.mul(g.power(s,G.sub(G.one,A)),coefficients.axialValues[0]),target:G.zero},
    {id:'radial-pressure-linear-moment',raw:g.integrate(G.div(G.mul(q(2),G.mul(R,band.fields.F),deltaV),R)),
      normalized:G.mul(g.power(s,G.mul(q(-2),A)),coefficients.angularValues[1]),target:G.neg(state.mean.P)},
    {id:'angular-axial-linear-moment',raw:g.integrate(G.mul(G.pow(R,2),G.add(G.mul(band.fields.G,deltaV),G.mul(R,band.fields.F,gammaDesired)))),
      normalized:G.mul(g.power(s,G.sub(q(3,2),G.mul(q(2),A))),coefficients.axialValues[1]),target:G.neg(state.mean.Jtheta)},
    {id:'axial-pressure-linear-moment',raw:g.integrate(G.sub(G.mul(q(2),R,band.fields.G,gammaDesired),G.mul(G.pow(R,2),band.fields.F,deltaV))),
      normalized:G.mul(g.power(s,G.sub(G.one,G.mul(q(2),A))),coefficients.angularValues[2]),target:G.neg(state.mean.Jz)}];
  // In the nonzero rows, q-to-Q factors cancel by exp(u)exp(-u)=1.
  // Record their literal exponent cancellation, never rounded scales.
  const chartPowers=[G.mul(q(2),A),G.sub(G.mul(q(2),A),q(3,2)),G.sub(G.mul(q(2),A),G.one)],
    chartChecks=chartPowers.map((p,j)=>({id:'q-Q-moment-normalization-'+j,...globalGraphEqual(G,G.add(p,G.neg(p)),G.zero)}));
  return {g,R,Z,T,lambda,A,d,x,eta0,powers,mu,K,logK,a,targets,coefficients,copies,deltaV,gammaDesired,momentRows,exponentChecks,chartChecks,
    sourceRestriction:{paperEquations:['5.44','8.24','8.25'],sourceProfile:definitions.sourceProfile,assemblySHA256:definitions.sourceHash,
      actualBackgroundRoots:band.fields,actualMeanPatchDefinitions:definitions.exact,restriction,
      positiveAAndFiveMuFromSource:true,originalPositiveLambdaRetained:true,
      derivation:['Restrict the unchanged completed background to its preserved Imean patch: Gq=0 and Vq=a*x^(-1-2lambda).',
        'Each actual bump and the hull of its radial potential lie strictly inside that original patch, as certified by the displayed source support inequalities.',
        'Change variable x=exp(j/5)*u in each retained raw bump integral; its Jacobian cancels the prefactor exp(-j/5). The p-th moment is exp(j*p/5)*mu_p.',
        'The retained exact five-row inverse gives zero for the two velocity moments and the negatives of the actual global P,Jtheta,Jz. Apply the displayed q-to-Q powers; their exponents cancel exactly.'],
      mechanicalRawIntegralReduction:false,inheritedAnalyticalRestrictionAndChangeOfVariablesUsed:true}};
}

const stateData=s=>({schema:s.schema,source:s.source,bumps:s.bumps,potential:s.potential,velocity:s.velocity,mean:s.mean,
  nonlinear:s.nonlinear,checks:s.checks,scope:s.scope});

export function attachGlobalMomentCurrent(current,context={}){
  assertGlobalCurrentState(current);const {G,band}=current,start=G.nodes.length,
    bump=sourceBumps(current),{g,R,Z,T}=bump,epsilon=band.geometry.epsilon,
    deltaV=shareGlobalScalar(G,bump.deltaV,'GlobalActualFiveBumpAngular'),
    gammaDesired=shareGlobalScalar(G,bump.gammaDesired,'GlobalActualFiveBumpAxial'),
    weighted=G.mul(R,gammaDesired),primitive=g.primitive(weighted),whole=g.integrate(weighted),
    psi=G.div(primitive,R),compactPsi=G.div(G.sub(primitive,G.mul(g.chi,whole)),R),
    deltaBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z))),realizedGamma=G.add(G.derivative(psi,R),G.div(psi,R)),
    actualGamma=gammaDesired,increment={beta:shareGlobalScalar(G,deltaBeta,'GlobalActualFiveBumpRadial'),v:deltaV,gamma:actualGamma},
    gammaCheck=globalGraphEqual(G,realizedGamma,gammaDesired,[R,primitive,gammaDesired]),
    divergenceCheck=globalGraphEqual(G,G.add(G.derivative(deltaBeta,R),G.div(deltaBeta,R),G.mul(epsilon,G.derivative(actualGamma,Z))),G.zero),
    previous=current.mean.initialMeanVelocity,velocity=Object.fromEntries(meanNames.map(n=>[n,G.add(previous[n],increment[n])])),
    background={b:band.fields.b,V:G.mul(R,band.fields.F),G:band.fields.G},covariance=current.covariance.fullAuxiliaryMean,stress=current.mean.residual.fullOriginalStress,
    pre=exactAuxiliaryMeanPDE(G,{coordinates:{R,Z,T},epsilon,background,velocity:previous,covariance,stress,pressure:current.mean.pressure.value}),
    withoutPressure=exactAuxiliaryMeanPDE(G,{coordinates:{R,Z,T},epsilon,background,velocity,covariance,stress}),
    gr=shareGlobalScalar(G,withoutPressure.gr,'GlobalAfterFiveMoment_gr'),P=shareGlobalScalar(G,g.integrate(gr),'GlobalAfterFiveMoment_P'),
    pressureSource=G.sub(gr,G.mul(g.rho,P)),pressurePrimitive=g.primitive(pressureSource),pressureWhole=g.integrate(pressureSource),
    pressure=G.sub(pressurePrimitive,G.mul(g.chi,pressureWhole)),cutoffRemainder=G.mul(G.derivative(g.chi,R),pressureWhole),
    pressureCheck=globalGraphEqual(G,G.derivative(pressure,R),G.sub(pressureSource,cutoffRemainder),[gr,P,g.rho,pressureWhole]),
    updated=exactAuxiliaryMeanPDE(G,{coordinates:{R,Z,T},epsilon,background,velocity,covariance,stress,pressure}),
    Jtheta=shareGlobalScalar(G,g.integrate(updated.fluxTheta),'GlobalAfterFiveMoment_Jtheta'),
    Jz=shareGlobalScalar(G,G.sub(g.integrate(updated.fluxZ),G.mul(G.q(1,2),g.integrate(G.mul(G.pow(R,2),gr)))),'GlobalAfterFiveMoment_Jz'),
    nonlinear=exactMeanMomentRemainders(G,{coordinates:{R,Z,T},epsilon,background,previous,increment}),
    unsharedUpdated=exactAuxiliaryMeanPDE(G,{coordinates:{R,Z,T},epsilon,background,
      velocity:Object.fromEntries(meanNames.map(n=>[n,G.add(previous[n],increment[n])])),covariance,stress,pressure}),
    expansionChecks=[
      {id:'same-authenticated-current-gr',...globalGraphEqual(G,pre.gr,current.mean.grBody,[...Object.values(covariance)])},
      {id:'complete-nonlinear-radial-expansion-8.26',...globalGraphEqual(G,G.sub(G.sub(unsharedUpdated.gr,pre.gr),nonlinear.linear.PIntegrand),nonlinear.Rg)},
      {id:'complete-nonlinear-angular-flux-expansion-8.27',...globalGraphEqual(G,G.sub(G.sub(unsharedUpdated.fluxTheta,pre.fluxTheta),nonlinear.linear.JthetaIntegrand),nonlinear.JthetaIntegrand)},
      {id:'complete-nonlinear-axial-flux-expansion-8.27',...globalGraphEqual(G,G.sub(unsharedUpdated.fluxZ,pre.fluxZ),
        G.add(G.mul(G.q(2),R,background.G,increment.gamma),nonlinear.JzVelocityIntegrand))}],
    remainderDefects={P:g.integrate(nonlinear.Rg),Jtheta:g.integrate(nonlinear.JthetaIntegrand),
      Jz:G.sub(g.integrate(nonlinear.JzVelocityIntegrand),G.mul(G.q(1,2),g.integrate(G.mul(G.pow(R,2),nonlinear.Rg))))},
    checks=[...bump.coefficients.checks,...bump.exponentChecks,...bump.chartChecks,...expansionChecks,
      {id:'actual-axial-potential-FTC',...gammaCheck},{id:'actual-three-component-incompressibility',...divergenceCheck},
      {id:'actual-recomputed-pressure-FTC',...pressureCheck},
      {id:'actual-all-label-defects-used-without-caller-target',pass:bump.targets.P!==G.zero&&current.target.actualCurrentResidualUsed&&current.scope.all81PointCandidatesRetained},
      {id:'same-original-full-background-and-all-six-covariances',pass:covarianceNames.every(n=>covariance[n]===current.covariance.fullAuxiliaryMean[n])&&stress===current.mean.residual.fullOriginalStress},
      {id:'source-increments-are-auxiliary-independent',pass:Object.values(increment).every(x=>[...G.freeCoordinates(x)].every(v=>[R,Z,T,band.coordinates.ell].includes(v)))}];
  if(checks.some(x=>!x.pass))fail('An actual global five-moment source identity failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const state={schema:'MathScope.N6.GlobalActualMomentCurrent/1',G,current,
    source:{paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,
      prefixNodeCount:start,actualGlobalDefectRoots:{P:current.mean.P,Jtheta:current.mean.Jtheta,Jz:current.mean.Jz},
      callerSuppliedTargets:false,originalLambda:G.parameter('lambda'),originalM2Modified:false,
      phase:'ORIGINAL_PRIMARY_GLOBAL_CURRENT_BEFORE_TEMPORAL_INVERSE'},
    bumps:Object.fromEntries(Object.entries(bump).filter(([name])=>name!=='g')),
    potential:{weighted,primitive,whole,compactPsi,psi,deltaBeta,gammaDesired,realizedGamma,
      weightedWholeNormalization:bump.momentRows[1],gammaCheck,divergenceCheck,
      zeroCutoffRemainderReason:'The actual p=1 geometric-bump row is exactly zero. Change of variables gives whole=0; hence the compact radial inverse equals primitive/R.',
      analyticalIntegralReductionUsed:true,wholeRawIntegralDiscarded:false},
    velocity:{previous,increment,updated:velocity},
    mean:{background,covariance,fullOriginalStress:stress,gr,P,Jtheta,Jz,
      pressure:{source:pressureSource,primitive:pressurePrimitive,totalSource:pressureWhole,value:pressure,cutoffRemainder,check:pressureCheck,
        kind:'ACTUAL_COMPLETE_GLOBAL_AUXILIARY_ZERO_MODE',fullNonzeroAuxiliaryPressureConstructed:false},
      residual:updated,fullBackgroundFlatResidualRetainedSeparately:band.background},
    nonlinear:{...nonlinear,sourceAuthenticated:true,expansionChecks,remainderDefects,
      relationToRecomputedDefects:'Use the five actual linear-row identities, then integral additivity in (8.26)-(8.27). Pnew,Jtheta_new,Jz_new equal these retained nonlinear remainder integrals.',
      allNonlinearTermsRecomputed:true,mechanicalRawIntegralReduction:false},checks,
    scope:{actualOriginalGlobalFiveMomentUpdateConstructed:true,actualCompleteMeanResidualAndPressureRecomputed:true,
      actualAllLabelTargetsUsed:true,arbitraryGenericArraysUsedAsSource:false,originalPositiveLambdaRetained:true,
      temporalMeanInverseApplied:false,initializedJ0:false,fullNonzeroAuxiliaryPressureConstructed:false,
      allOrderTargetClassBoundsCertified:false,completeN6:false,numericalFieldEnclosuresComputed:false,newLeanKernelProof:false}};
  seals.set(state,{G,current,start,count:G.nodes.length,delta:canonicalStringify(G.nodes.slice(start)),
    definitions:G.captureFunctionDefinitions(),data:canonicalStringify(stateData(state))});
  progress(context,'global-source-five-moments-and-entire-nonlinear-mean-recomputed',G);return state;
}

export function assertGlobalMomentCurrent(state){
  const s=seals.get(state);
  if(!s||s.G!==state.G||s.current!==state.current||s.data!==canonicalStringify(stateData(state))||
    s.delta!==canonicalStringify(state.G.nodes.slice(s.start,s.count))||!state.G.functionDefinitionsUnchanged(s.definitions))
    fail('Use the unchanged privately constructed original global five-moment state.');
  assertGlobalCurrentState(state.current);return true;
}

export async function globalMomentCurrentCertificate(state){
  assertGlobalMomentCurrent(state);const s=seals.get(state),data=stateData(state),source=await globalCurrentStateCertificate(state.current),
    encoded=canonicalStringify({sourceGraph:source.graph,data,nodes:state.G.nodes.slice(s.start,s.count),definitions:s.definitions});
  return {...data,sourceCurrent:source,
    graph:{sha256:await sha256(encoded),nodeCount:s.count,deltaNodeCount:s.count-s.start,canonicalBytes:new TextEncoder().encode(encoded).length},
    execution:'ACTUAL_SOURCE_BUMP_COEFFICIENTS_POTENTIAL_AND_NONLINEAR_MEAN_EXPRESSIONS',numericalValuesOrEnclosures:false};
}
