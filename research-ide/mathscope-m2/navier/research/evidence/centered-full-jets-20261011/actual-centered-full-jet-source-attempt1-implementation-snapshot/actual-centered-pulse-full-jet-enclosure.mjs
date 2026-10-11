/** Additive continuation of the privately authenticated old terminal
 * witness: fast three-component weighted jets and the original uncentered a/H/y
 * slow jets. Every remaining geometric/target scale stays explicit.
 * This is not a physical torus inverse or an all-label numerical claim.
 */
import {prepareActualCenteredSlowJetEnclosure,assertActualCenteredSlowJetEnclosure,actualCenteredSlowJetEnclosureCertificateFromProgram} from './actual-centered-slow-jet-enclosure.mjs';
import {attachActualAdiabaticPulseCenterEnclosure,assertActualAdiabaticPulseCenterEnclosure,actualAdiabaticPulseCenterEnclosureCertificateFromProgram} from './actual-adiabatic-pulse-center-enclosure.mjs';
import {assertActualCenteredPulseEnclosure} from './actual-centered-pulse-enclosure.mjs';
import {centeredPulseNumericalRequest} from './actual-centered-pulse-enclosure-kernel.mjs';
import {centeredSecondScalarJet,centeredSecondProductAudit} from './actual-centered-slow-jet-enclosure-kernel.mjs';
import {centeredNormalizedFullFrame} from './actual-centered-slow-jet-source-bounds.mjs';
import {centeredWholeTimeReferenceFrameAudit,centeredWholeTimeSlowSlopeAudit,centeredFastStabilityPowerAudit,centeredUncenteredJetErrorAudit,
  centeredNormalizedAmplitudePowerAudit,centeredNormalizedAmplitudeReferenceAudit,centeredFastWeightedProductAudit,centeredUncenteredJetIdentityAudit,encloseCenteredThreeComponentJetCoefficients,
  encloseCenteredFastJetCoefficients,enclosePulseCenterLogSlopes,encloseCenterCovarianceSlowJetCoefficients} from './actual-centered-fast-jet-enclosure-kernel.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {ellOneSourceScalarIdentity} from './actual-covariance-ell-one-obstruction.mjs';
import {clearDisposableThirdJetCaches} from './actual-third-jet-ftc.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {rational as Q,readRational,qdiv,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),degree=a=>a.reduce((x,y)=>x+y,0),
  metadata=p=>{const{nodes,...rest}=p;return canonicalStringify(rest);},
  data=p=>canonicalStringify({request:p.request,sourceBinding:p.sourceBinding,coordinates:p.coordinates,roots:p.roots,sourceBounds:p.sourceBounds,algebra:p.algebra,
    logSlopes:p.logSlopes,fastFamilies:p.fastFamilies,uncenteredFamilies:p.uncenteredFamilies,rows:p.rows,numerics:p.numerics,checks:p.checks,proof:p.proof,scope:p.scope}),
  progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodes:G?.nodes.length??0,...extra});},
  labels=['value','R','Z','T','RR','RZ','RT','ZZ','ZT','TT'];

function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','precisionBits','tolerance','maxCutoffCells'].includes(k)))
    fail('INVALID_INPUT','Use only the pinned source, directed precision, exact rational tolerance and cutoff budget. No source point, field, center value, derivative or error premise is caller supplied.');
  const{sourceProfile=SOURCE_PROFILE_ID,...rest}=input;assertSourceProfile(sourceProfile);
  const control=centeredPulseNumericalRequest(rest),centerTolerance=qtext(qdiv(readRational(control.tolerance),Q(1048576)));
  centeredPulseNumericalRequest({...control,tolerance:centerTolerance});
  encloseCenteredFastJetCoefficients({precisionBits:control.precisionBits,tolerance:control.tolerance,weightedCenters:[{lower:'1/2',upper:'1/2'},{lower:'1/2',upper:'1/2'}]});
  return {sourceProfile,...control,centerTolerance};
}

function pointOf(G,source){
  const parameters=['R','Z','T','Xrep','etaRep','sRep'].map(k=>source.coordinates[k]),w=source.roots.witness,values=[w.R,G.zero,G.one,w.X,G.zero,G.one];
  return {parameters,values,at:body=>G.simultaneousSubstitute(body,parameters,values)};
}

/** Every added mean-value derivative is generated on the same full
 * normalized formula used by the already bound raw-frame conversion.
 * Its source port is explicit: only the three small auxiliaries move.
 * Original actual M and its time derivatives remain separate roots. */
function bindWholeTimePremises(G,slow,absolute,algebra,context){
  const centered=slow.centered,source=centered.selected,g=source.geometry,c=source.constants,v=source.coordinates.v,point=pointOf(G,source),
    heat=slow.heatField.roots,tau=G.fresh('full_center_actual_normalized_time'),names=['F','FR','FZ','R','beta','inverseLength','epsilon','lambda0','c0','u','dampingScale'],
    formal=Object.fromEntries(names.map(k=>[k,G.fresh('full_center_primitive_'+k)])),auxiliaries=['inverseLength','epsilon','beta'],rows=[];
  for(const [index,f]of source.families.entries()){
    const template=centeredNormalizedFullFrame(G,{...formal,tau,sign:f.sign}),jets=[];
    for(let order=0;order<=2;order++){
      const matrix=template.wMatrix.map(row=>row.map(body=>{let x=body;for(let j=0;j<order;j++)x=G.derivative(x,tau);return x;}));
      const scales=[G.neg(G.mul(formal.c0,G.sqrt(G.add(G.one,G.pow(formal.u,2))))),formal.u],
        amplitude=[1,2].map((component,j)=>template.B[component].map(body=>{let x=G.div(body,scales[j]);for(let k=0;k<order;k++)x=G.derivative(x,tau);return x;}));
      jets.push({order,matrix,amplitude,auxiliary:auxiliaries.map(name=>({name,coordinate:formal[name],matrix:matrix.map(row=>row.map(body=>G.derivative(body,formal[name]))),
        amplitude:amplitude.map(row=>row.map(body=>G.derivative(body,formal[name])))}))});
    }
    const original=G.covarianceSystems[f.system],actualTimeJets=[original.matrix];
    for(let j=1;j<=2;j++)actualTimeJets.push(actualTimeJets[j-1].map(row=>row.map(body=>G.derivative(body,v))));
    const directions=['R','Z','T'].map(k=>source.coordinates[k]),actualAmplitudeJets=[1,2].map((component,j)=>f.frame.B[component].map(body=>{
      const normalized=G.div(body,j===0?centered.roots.Ac:c.u),slowJets=centeredSecondScalarJet(G,normalized,directions),
        first=G.derivative(normalized,v),second=G.derivative(first,v),mixed=directions.map(d=>G.derivative(G.derivative(normalized,d),v));
      return {component,originalBody:body,normalized,slowJets,first,second,mixed};
    })),
      sourcePort={F:source.fields.F,FR:G.derivative(source.fields.F,source.coordinates.R),FZ:G.derivative(source.fields.F,source.coordinates.Z),R:source.coordinates.R,
      beta:G.div(G.mul(g.Ls,f.carrier.p),g.Bs),inverseLength:G.inv(g.Ls),epsilon:g.epsilon,lambda0:source.frozen.lambda0,c0:source.frozen.c0,u:c.u,
      dampingScale:G.div(source.frozen.lambda0,G.pow(G.sqrt(G.add(G.one,G.pow(c.u,2))),3))},
      zeroAuxiliaryComparison={inverseLength:G.zero,epsilon:G.zero,beta:G.neg(G.div(G.mul(G.q(f.sign),c.u),heat.actualFR))},
      sourceChecks=[{id:'same-original-matrix-and-unit-initial-data',pass:same(original.matrix,f.frame.wMatrix)&&same(original.initial,[G.one,G.zero])&&original.length===g.Ls&&original.variable===v},
        {id:'private-full-raw-frame-and-slow-phase-binding',pass:slow.pulses[index].frameBinding.pass&&slow.pulses[index].frameBinding.phaseChecks.every(x=>x.pass)&&slow.pulses[index].variation.allRequiredMatrixAndTimeDerivativeBodiesGenerated},
        {id:'private-actual-point-frame-and-rounded-carrier-body-binding',pass:absolute.rows[index].checks.every(x=>x.pass)&&absolute.rows[index].formalBodyBinding.actualBodyUnchanged&&absolute.rows[index].formalBodyBinding.formalCarrierIsExactNormalizedRoundedCarrier},
        {id:'same-positive-normal-scaling-and-full-damping',pass:g.Bs===G.sqrt(G.div(source.frozen.lambda0,G.mul(g.epsilon,G.pow(g.k,2),G.pow(G.sqrt(G.add(G.one,G.pow(c.u,2))),3))))},
        {id:'same-authenticated-complete-tau-conversion',pass:slow.algebra.frame.rows[index].partChecks.every(x=>x.pass)&&slow.algebra.frame.rows[index].normalized.fullMovingPressureRetained&&slow.algebra.frame.rows[index].normalized.fullMovingBasisRetained},
        {id:'all-added-auxiliary-and-two-time-jets-generated',pass:jets.length===3&&jets.every(j=>j.matrix.flat().every(x=>G.nodes[x])&&j.auxiliary.length===3&&j.auxiliary.every(a=>a.matrix.flat().every(x=>G.nodes[x])))&&actualTimeJets.flat(2).every(x=>G.nodes[x])},
        {id:'separate-actual-amplitude-slow-fast-and-auxiliary-jets-generated',pass:actualAmplitudeJets.flat().every(a=>a.slowJets.roots.length===10&&a.mixed.length===3&&G.nodes[a.first]&&G.nodes[a.second])&&
          jets.every(j=>j.amplitude.flat().every(x=>G.nodes[x])&&j.auxiliary.every(a=>a.amplitude.flat().every(x=>G.nodes[x])))&&algebra.amplitude.pass},
        {id:'same-frozen-positive-Ac-amplitude-normalizer',pass:ellOneSourceScalarIdentity(G,centered.roots.Ac,point.at(G.mul(G.neg(source.frozen.c0),G.sqrt(G.add(G.one,G.pow(c.u,2)))))).pass&&directions.every(d=>G.derivative(centered.roots.Ac,d)===G.zero)},
        {id:'center-lower-cone-and-frozen-cutoff-domain',pass:centered.sourceCutoffs.pass&&same(centered.sourceCutoffs.plateau,['Ls/4','3Ls/4'])&&source.decision.actualPositiveWeightsOnDeclaredTerminalDomain},
        {id:'same-original-matrix-time-derivative',pass:same(actualTimeJets[1],slow.pulses[index].variation.timeMatrix)},
        {id:'actual-base-point-fields-and-reference-are-frozen',pass:[heat.actualF,heat.actualFR,heat.actualAlpha,heat.rayleighGamma,heat.actualLambda0,heat.Rstar,c.Bnorm,g.S,g.Ls].every(root=>G.freeCoordinates(root).size===0)}];
    if(sourceChecks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The full-time fast source premise failed for sign '+f.sign+': '+sourceChecks.filter(x=>!x.pass).map(x=>x.id).join(', '));
    rows.push({sign:f.sign,formal,template,jets,sourcePort,sourcePortAtWitness:Object.fromEntries(Object.entries(sourcePort).map(([k,x])=>[k,point.at(x)])),
      comparisonOnlySmallAuxiliaries:zeroAuxiliaryComparison,actualOriginalTimeJets:actualTimeJets,actualAmplitudeJets,sourceChecks,pass:true});
    progress(context,'full-center-original-fast-matrix-and-auxiliary-jets-'+f.sign,G,{actualMatrixOrders:3,auxiliaryMatrixJets:9});
    clearDisposableThirdJetCaches(G);
  }
  const checks=[{id:'same-private-original-pulse-and-absolute-center',pass:absolute.centered===centered&&slow.centered===centered},
    {id:'actual-positive-parameters-and-field-reserve',pass:slow.sourceBounds.pass&&slow.sourceBounds.fieldAudit.order===5&&slow.sourceBounds.matrixAudit.computedMaximumPower===3313&&slow.sourceBounds.matrixAudit.upperPower===3840},
    {id:'whole-interval-comparison-identity-including-damping',pass:algebra.reference.pass&&algebra.slope.pass&&algebra.fast.pass&&algebra.amplitudeReference.pass},
    {id:'both-actual-source-ports-and-time-jets',pass:rows.length===2&&rows.every(r=>r.pass)},
    {id:'actual-centered-H-and-positive-inverse-conditioning',pass:slow.numerics.conditioning.pass&&absolute.rescalingChecks.every(c=>c.pass)}];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The complete fast source-bound packet is inconsistent.');
  return {schema:'MathScope.ActualCenteredFullJetSourceBounds/1',rows,checks,pass:true,sourceAuthenticated:true,
    sourcePrimitiveBounds:slow.sourceBounds,separateAmplitudePowerLedger:algebra.amplitude,roots:{B:c.Bnorm,S:g.S,L:g.Ls,u:c.u,g:centered.roots.curvature,Rstar:source.roots.witness.R},
    exactPort:'The privately bound complete original frame first cancels its positive frozen Bs. The already checked raw-frame/tau identity yields this same template with the listed source operands. At the fixed representative, G and every slow derivative vanish on the proven common exterior; N=(-1,0),K=(0,-1),pz=-Bs,x0=sign*u*Bs/2. The actual FR,FZ and their derivatives are retained until this local source equality is used. No independently supplied matrix is accepted.',
    derivativeReserve:'At most two tau derivatives plus one auxiliary derivative of M need at most four derivatives of the underlying primitive formula because Bprime contains one extra tau derivative. The bound Renv^3840<B for that printed primitive ledger therefore also covers the newly generated finite jets. This statement does not assert every fourth slow derivative of M.',
    errorMatrix:'The complete comparison is exactly diag(0,-2lambda) on0<=tau<=1. Thus each of its first two tau derivatives agrees identically. Mean-value integration in the retained inverseLength,epsilon,beta segment, with n_z=-1 and all normal/tangent denominators>=1, gives |partial_tau^j E|<=B^64/S forj=0,1,2. The positive errors1/L<=B/S,epsilon<4/S^16,|beta-beta0|<Renv^40/S^7 are never assigned zero in actual M.',
    referenceTimeJets:'lambda=lambda0/sqrt(1+u^2*(1/2+tau)^2); for0<=tau<=1,lambda,|lambda_tau|,|lambda_tautau|<B^2 andlambda>=1/B. Together with the private source cone this gives A_r<=-1/B.',
    slowForcing:'The full original M_i,M_ij,L*M_iv and local FTC convergence premises are inherited from the private second-variation program. They are uniformly bounded byB; the original whole-time ratio derivatives obey |r_i|<=B^6 and|r_ij|<=B^14.',
    centerLowerBound:'The actual a_sign is independently enclosed in[1/4,1/2] by the private absolute-center theorem on the SAME centered source. No numerically equal-looking center from another source object is accepted.',
    wholeInitialLayer:algebra.fast.initialLayer,sourceMatrixOrInitialLayerReplaced:false,allLabelsOrPhysicalPointClaim:false};
}

function bindCenterLogSlopes(G,slow,point,algebra,context){
  const centered=slow.centered,source=centered.selected,hf=slow.heatField.roots,v=source.coordinates.v,directions=['R','Z','T'].map(k=>source.coordinates[k]),
    Rstar=source.roots.witness.R,F=source.fields.F,FR=G.derivative(F,source.coordinates.R),alpha=G.sub(G.neg(G.div(G.mul(source.coordinates.R,FR),G.mul(G.q(2),F))),G.one),
    normalized=x=>directions.map((d,i)=>G.mul(i===0?Rstar:G.one,G.derivative(x,d))),
    Fderivatives=normalized(F),FRderivatives=normalized(FR),alphaDerivatives=normalized(alpha),
    c=Fderivatives.map((x,i)=>point.at(G.add(G.div(x,F),G.div(alphaDerivatives[i],G.mul(G.q(2),alpha))))),d=FRderivatives.map(x=>point.at(G.div(x,FR))),
    alphaT=G.mul(source.constants.h,hf.At),aa=G.mul(source.constants.h,hf.Atilde),fR=G.neg(G.mul(G.q(2),G.add(G.one,aa))),fT=G.sub(aa,source.constants.h),
    reducedC=[G.sub(fR,hf.xi),G.zero,G.add(fT,G.div(hf.xi,G.q(2)))],
    reducedD=[G.sub(G.sub(fR,G.one),G.div(G.mul(G.q(2),alphaT),G.add(G.one,aa))),G.zero,G.add(fT,G.div(alphaT,G.add(G.one,aa)))],
    IA=G.div(G.log(G.q(2)),G.q(3)),IB=G.sub(IA,G.q(7,72)),nu=reducedC.map((x,i)=>G.sub(G.mul(IA,x),G.mul(IB,reducedD[i]))),rows=[];
  for(const [index,f]of source.families.entries()){
    const w=f.w,ratio=G.div(w[1],w[0]),q=G.log(w[0]),M=G.covarianceSystems[f.system].matrix,rhs=G.add(M[0][0],G.mul(M[0][1],ratio)),
      actualTimeDerivative=G.derivative(q,v),qvCheck=sourceGraphRationalIdentity(G,G.sub(actualTimeDerivative,rhs),{atomicNodes:[...M.flat(),...w],maxTerms:20000}),
      center=slow.centering.centers[index],centerLog=G.log(center),centerRows=directions.map((axis,i)=>{
        const normalization=i===0?Rstar:G.one,derivative=G.mul(normalization,G.derivative(centerLog,axis)),
          integrand=G.mul(normalization,G.derivative(rhs,axis)),integral=G.integral(integrand,v,G.zero,centered.roots.centerTime),
          initial=G.substitute(G.mul(normalization,G.derivative(q,axis)),v,G.zero),qCenter=point.at(derivative),qIntegral=point.at(integral);
        return {direction:['R','Z','T'][i],dynamicCenterDerivative:derivative,wholeHalfPulseIntegrand:integrand,wholeHalfPulseIntegral:integral,
          zeroInitialDerivative:initial,actualAtPoint:qCenter,actualIntegralAtPoint:qIntegral,coefficient:G.div(qCenter,slow.roots.gL),
          exactFTCIdentity:'D_i log w_plus(v0)=Integral_0^v0 D_i(M11+M12*r)dv, with the retained unit initial datum and positive cone. The integral is exact; its value is bounded by the separate full-time comparison.',
          initialValueIsZero:initial===G.zero,actualDerivativeAndForcingRetained:true};
      });
    if(!qvCheck.pass||centerRows.some(x=>!x.initialValueIsZero||G.freeCoordinates(x.coefficient).size))
      throw Object.assign(Error('The actual half-pulse logarithmic derivative and its zero initial datum did not bind.'),{code:'INVALID_SOURCE_CONSTRUCTION',details:{sign:f.sign,qvCheck,centerRows}});
    rows.push({sign:f.sign,ratio,logPositiveMode:q,actualTimeDerivative,wholeTimeRhs:rhs,qvCheck,centerRows,pass:true});
    progress(context,'full-center-original-half-pulse-log-jets-'+f.sign,G);
  }
  return {schema:'MathScope.ActualPulseCenterLogSlopeBinding/1',roots:{actualF:F,actualFR:FR,actualAlpha:alpha,Fderivatives,FRderivatives,alphaDerivatives,c,d,reducedC,reducedD,IA,IB,nu},rows,
    fullTimeComparison:algebra.slope,pass:true,
    exactHeatAndFieldChain:'The private full heat/field identity gives alpha=h*Atilde,alpha_T=h*At,D_R alpha=-2alpha_T andF_T/F=alpha-h atZ=0,T=1. Hence c=(F_R*R/F-xi,0,F_T/F+xi/2),d=(F_R*R/F-1-2alpha_T/(1+alpha),0,F_T/F+alpha_T/(1+alpha)). The displayed unreduced roots are differentiated before the point substitution; their reduced formulas retain the original h, step and complete Gamma moments.',
    firstHalfIntegration:'Integrate the complete comparison M11_i/g fromtau=0 to1/2. Witht=1/2+tau,nu_i=IA*c_i-IB*d_i. The exact finite-u integral coefficients differ fromIA=log2/3 andIB=log2/3-7/72 by at most8/u^2 and64/u^2; these are positive bounds on the original finite-u difference.',
    originalModeRemainder:'The old whole-v Riccati proof bounds |q_i_prime-M11_i|<=B^264/S. The new mean-value frame comparison andg^-1<B give a total error<B^266/S after division bygL. The complete original q_ij satisfies |q_ij|/(gL)^2<=B^23/S. No q_ij or coupled mode is set to zero.',
    nonzeroError:'The combined normalized first-log-slope error is<2^-600 forS>=B^1024,B>=2^128 andu^-2<2^-81922. All parameter/fixed-label positivity assumptions are those of the same private source.'};
}

function bindFastFamily(G,slow,index,point,context){
  const centered=slow.centered,source=centered.selected,f=source.families[index],v=source.coordinates.v,directions=['R','Z','T'].map(k=>source.coordinates[k]),
    squareRoot=source.target.squareRootWeights[index],products=f.t.map((body,component)=>({component,...centeredFastWeightedProductAudit(G,{weight:squareRoot,radial:body,directions,variable:v})})),
    product=products[0],slowProducts=[1,2].map(component=>({component,...centeredSecondProductAudit(G,{factors:[squareRoot,G.substitute(f.t[component],v,centered.roots.centerTime)],directions})})),
    rho=G.sub(f.frame.reference.lambda,f.frame.reference.dref),rhoV=G.derivative(rho,v),Pv=G.derivative(f.P,v),Pvv=G.derivative(Pv,v),
    firstPCheck=sourceGraphRationalIdentity(G,G.sub(Pv,G.mul(f.P,rho)),{atomicNodes:[f.P,f.frame.reference.lambda,f.frame.reference.dref],maxTerms:15000}),
    secondPCheck=sourceGraphRationalIdentity(G,G.sub(Pvv,G.mul(f.P,G.add(G.pow(rho,2),rhoV))),{atomicNodes:[f.P,rhoV,f.frame.reference.lambda,f.frame.reference.dref],maxTerms:15000}),
    atCenter=x=>point.at(G.substitute(x,v,centered.roots.centerTime)),
    radialRepresentation=G.mul(f.P,G.add(f.w[0],f.w[1])),radialCheck=sourceGraphRationalIdentity(G,G.sub(f.t[0],radialRepresentation),{atomicNodes:[f.P,...f.w],maxTerms:15000}),
    reference=centered.rows[index].reference,checks=[{id:'original-radial-basis-row-is-one-one',pass:same(f.frame.B[0],[G.one,G.one])&&radialCheck.pass},
      {id:'weight-is-the-original-positive-sqrt-and-pulse-independent',pass:squareRoot===slow.inverse.squareRoots[index].sigma&&!G.freeCoordinates(squareRoot).has(v)&&G.derivative(squareRoot,v)===G.zero},
      {id:'every-full-fast-product-materializes-to-actual-AD',pass:products.length===3&&products.every(p=>p.pass&&p.rows.every(r=>r.bodyDerivativeBinding))},
      {id:'both-additional-components-full-slow-products-materialize',pass:slowProducts.length===2&&slowProducts.every(p=>p.pass&&p.checks.every(c=>c.bodyDerivativeBinding))},
      {id:'actual-envelope-first-and-second-derivative',pass:firstPCheck.pass&&secondPCheck.pass},
      {id:'same-exact-center-curvature-and-positive-root-relation',pass:reference.pass&&reference.checks.every(x=>x.pass)&&atCenter(f.P)===G.one},
      {id:'original-psi-cutoff-is-on-its-open-center-plateau',pass:centered.sourceCutoffs.pass&&same(centered.sourceCutoffs.plateau,['Ls/4','3Ls/4'])},
      {id:'same-source-three-component-center-value-box-and-orientation',pass:centered.rows[index].roots.normalizedWave.length===3&&same(centered.midplane.conclusions.N,['-1','0'])&&same(centered.midplane.conclusions.K,['0','-1'])}];
  if(checks.some(c=>!c.pass))throw Object.assign(Error('An original full fast weighted derivative failed its source binding.'),{code:'INVALID_SOURCE_CONSTRUCTION',details:{sign:f.sign,checks,firstPCheck,secondPCheck,radialCheck}});
  progress(context,'full-center-original-fast-products-'+f.sign,G);
  return {sign:f.sign,product,products,slowProducts,radialRepresentation,radialCheck,reference,
    centerValues:{originalWeighted:centered.rows[index].retained.weightedAmplitude,sourceNormalized:centered.rows[index].roots.normalizedWave,
      positiveCommonBox:centered.numerics.values.normalizedWeightedAmplitude[index],
      orientation:'The private source proves N=(-1,0),K=(0,-1). Therefore its three retained source-normalized value roots are W_r/A0,W_theta/(Ac*A0),sign*W_z/(u*A0). The same proved positive interval contains each independent actual value; the values are not identified with each other.'},
    actualEnvelope:{P:f.P,Pv,Pvv,rho,rhoV,
    atCenter:{P:atCenter(f.P),Pv:atCenter(Pv),Pvv:atCenter(Pvv)},firstPCheck,secondPCheck,
    analyticExactCenterValues:'P=1, P_v=0, P_vv=-g/Ls, by the independently bound same positive reference square root atv=Ls/2. Unsimplified actual derivative roots are retained.'},
    originalPsi:{body:source.cutoffs.psi,first:G.derivative(source.cutoffs.psi,v),second:G.derivative(G.derivative(source.cutoffs.psi,v),v),
      localValues:'psi=1 and its first/second v derivatives=0 on the original open plateau. This does not discard off-center cutoff tails.'},checks,pass:true};
}

export function prepareActualCenteredPulseFullJetEnclosure(input={},context={}){
  const request=requestOf(input),{centerTolerance,...slowInput}=request,slow=prepareActualCenteredSlowJetEnclosure(slowInput,context);
  progress(context,'full-center-private-complete-slow-predecessor-ready',slow.G);
  const absolute=attachActualAdiabaticPulseCenterEnclosure(slow.centered,{centerTolerance},context);
  return attachActualCenteredPulseFullJetEnclosure(slow,absolute,slowInput,context);
}

export function attachActualCenteredPulseFullJetEnclosure(slow,absolute,input={},context={}){
  assertActualCenteredSlowJetEnclosure(slow);assertActualAdiabaticPulseCenterEnclosure(absolute);
  const request=requestOf({sourceProfile:slow.request.sourceProfile,...input}),centered=slow.centered;
  if(absolute.centered!==centered||request.precisionBits!==slow.request.precisionBits||request.precisionBits!==absolute.request.precisionBits||
    qcompare(readRational(slow.request.tolerance),readRational(request.tolerance))>0||qcompare(readRational(absolute.request.centerTolerance),readRational(request.centerTolerance))>0)
    fail('INVALID_SOURCE_CONSTRUCTION','Both private numerical predecessors must belong to the very SAME original centered source, with sufficient matching precision.');
  // The private second-variation aliases cannot be inherited by copying a
  // descriptor. Append to their authenticated originating graph instead;
  // the frozen predecessor seal checks its fixed prefix and excludes later
  // appends. No original node, matrix, function body or source file changes.
  const source=centered.selected,sourceCount=slow.program.nodes.length,G=slow.G,
    coordinates=structuredClone(source.coordinates),directions=['R','Z','T'].map(k=>coordinates[k]),v=coordinates.v,point=pointOf(G,source),
    reference=centeredWholeTimeReferenceFrameAudit(G),algebra={reference,slope:centeredWholeTimeSlowSlopeAudit(G),fast:centeredFastStabilityPowerAudit(),uncenteredError:centeredUncenteredJetErrorAudit(),
      amplitude:centeredNormalizedAmplitudePowerAudit(),amplitudeReference:centeredNormalizedAmplitudeReferenceAudit(G,reference)},
    sourceBounds=bindWholeTimePremises(G,slow,absolute,algebra,context),logSlopes=bindCenterLogSlopes(G,slow,point,algebra,context),
    valueBoxes=absolute.numerics.values,ends=({lower,upper})=>({lower,upper}),controls={precisionBits:request.precisionBits,tolerance:request.tolerance,weightedCenters:centered.numerics.values.normalizedWeightedAmplitude.map(ends)},
    fastNumerics=encloseCenteredThreeComponentJetCoefficients(controls,context),logNumerics=enclosePulseCenterLogSlopes(controls,context),
    uncenteredNumerics=encloseCenterCovarianceSlowJetCoefficients({...controls,absoluteCenters:valueBoxes.absoluteCenter.map(ends),
      absoluteH:[valueBoxes.covarianceThetaWithoutUnknownCenter.map(ends),valueBoxes.covarianceZWithoutUnknownCenter.map(ends)],absoluteWeights:valueBoxes.inverseWeightWithoutUnknownCenter.map(ends)},context),
    fastFamilies=[],uncenteredFamilies=[],rows=[],g=centered.roots.curvature,L=source.geometry.Ls,gL=slow.roots.gL,A0=centered.roots.amplitudeScale,m=centered.roots.massScale,tau=centered.roots.tau,
    diagonal=[centered.roots.Ac,source.constants.u],Rstar=source.roots.witness.R,firstFastScale=G.mul(A0,G.sqrt(G.div(g,L))),secondFastScale=G.div(G.mul(A0,g),L),mixedFastScale=G.mul(A0,g);
  for(let i=0;i<2;i++){
    const family=bindFastFamily(G,slow,i,point,context);fastFamilies.push(family);
    for(const p of family.products)for(const r of p.rows){
      const component=p.component,n=fastNumerics.rows.find(n=>n.sign===family.sign&&n.derivative===r.id&&n.component===component&&n.kind==='fast'),atPoint=point.at(G.substitute(r.actual,v,centered.roots.centerTime)),
        derivative=G.mul(r.id==='Rv'?Rstar:G.one,atPoint),componentScale=component===0?G.one:component===1?diagonal[0]:diagonal[1],
        scale=G.mul(componentScale,r.id==='v'?firstFastScale:r.id==='vv'?secondFastScale:mixedFastScale),coefficient=G.div(derivative,scale);
      if(!n||G.freeCoordinates(coefficient).size)fail('INVALID_SOURCE_CONSTRUCTION','Every fast row must be its fully substituted original complete derivative.');
      rows.push({quantity:'weightedPulse',sign:family.sign,component,derivative:r.id,order:r.id==='v'?1:2,originalDerivative:r.actual,witnessDerivative:atPoint,
        normalizedDirectionDerivative:derivative,positiveExactScale:scale,coefficient,directedInterval:n.interval,width:n.width,toleranceMet:n.toleranceMet,
        nonzeroRemainderRetained:true,bodyDerivativeBinding:r.bodyDerivativeBinding,scope:'same original auxiliary pulse center; geometry scales retained'});
    }
    for(const p of family.slowProducts)for(let at=1;at<10;at++){
      const component=p.component,orders=p.indices[at],label=labels[at],n=fastNumerics.rows.find(n=>n.sign===family.sign&&n.derivative===label&&n.component===component&&n.kind==='slow'),
        root=p.roots[at],atPoint=point.at(root),derivative=G.mul(G.pow(Rstar,orders[0]),atPoint),componentScale=component===1?diagonal[0]:diagonal[1],
        scale=G.mul(componentScale,degree(orders)===1?slow.roots.firstScale:slow.roots.secondScale),coefficient=G.div(derivative,scale);
      if(!n||G.freeCoordinates(coefficient).size)fail('INVALID_SOURCE_CONSTRUCTION','Every added component slow jet must retain its exact original body.');
      rows.push({quantity:'weightedPulse',sign:family.sign,component,derivative:label,order:degree(orders),orders,originalDerivative:root,witnessDerivative:atPoint,
        normalizedDirectionDerivative:derivative,positiveExactScale:scale,coefficient,directedInterval:n.interval,width:n.width,toleranceMet:n.toleranceMet,
        nonzeroRemainderRetained:true,bodyDerivativeBinding:p.checks[at].bodyDerivativeBinding,scope:'same original weighted tangential/axial pulse; complete moving basis retained'});
    }
    const scaledH=source.target.H.map((row,j)=>G.div(row[i],G.mul(diagonal[j],m))),scaledY=G.div(G.mul(source.target.weights[i],m),tau),
      audit=centeredUncenteredJetIdentityAudit(G,{center:slow.centering.centers[i],values:[...scaledH.map((body,j)=>({kind:'H',body,component:j})),{kind:'y',body:scaledY,component:0}],directions}),
      originalJetBindings=[{quantity:'a',component:0,checks:audit.centerBodyBinding.directRoots.map((root,at)=>({orders:audit.centerBodyBinding.indices[at],retained:slow.centering.centerJets[i].roots[at],materialized:root,
          pass:root===slow.centering.centerJets[i].roots[at]}))},
        ...[0,1].map(j=>({quantity:'H',component:j,checks:audit.rows[j].bodyBinding.directRoots.map((root,at)=>{
          const retained=slow.inverse.matrixJets[at][j][i],scaled=G.div(retained,G.mul(diagonal[j],m));return {orders:slow.inverse.indices[at],retained,scaled,materialized:root,pass:root===scaled};})})),
        {quantity:'y',component:0,checks:audit.rows[2].bodyBinding.directRoots.map((root,at)=>{
          const retained=slow.inverse.weightJets[at][i],scaled=G.div(G.mul(retained,m),tau);return {orders:slow.inverse.indices[at],retained,scaled,materialized:root,pass:root===scaled};})}],
      positiveCenterChecks={sameOriginalCenter:point.at(slow.centering.centers[i])===absolute.roots.originalCenters[i],
        sameOriginalH:scaledH.map((body,j)=>ellOneSourceScalarIdentity(G,point.at(body),G.div(centered.rows[i].retained.H[j],G.mul(diagonal[j],m)))),
        sameOriginalWeight:ellOneSourceScalarIdentity(G,point.at(scaledY),G.div(G.mul(centered.rows[i].retained.y,m),tau))};
    if(!positiveCenterChecks.sameOriginalCenter||positiveCenterChecks.sameOriginalH.some(c=>!c.pass)||!positiveCenterChecks.sameOriginalWeight.pass||originalJetBindings.some(b=>b.checks.some(c=>!c.pass)))
      fail('INVALID_SOURCE_CONSTRUCTION','The uncentered values and derivative bodies must belong to the same private original H/y/center.');
    uncenteredFamilies.push({sign:source.families[i].sign,scaledH,scaledY,audit,positiveCenterChecks,originalJetBindings});
    const sourceJetRows=[{quantity:'a',component:0,roots:slow.centering.centerJets[i].roots},
      ...[0,1].map(j=>({quantity:'H',component:j,roots:slow.inverse.matrixJets.map(M=>M[j][i])})),{quantity:'y',component:0,roots:slow.inverse.weightJets.map(y=>y[i])}];
    for(const entry of sourceJetRows)for(let at=1;at<10;at++){
      const orders=slow.inverse.indices[at],label=labels[at],sign=source.families[i].sign,n=uncenteredNumerics.rows.find(r=>r.quantity===entry.quantity&&r.sign===sign&&r.component===entry.component&&r.derivative===label),
        root=entry.roots[at],atPoint=point.at(root),derivative=G.mul(G.pow(Rstar,orders[0]),atPoint),baseScale=entry.quantity==='a'?G.one:entry.quantity==='H'?G.mul(diagonal[entry.component],m):G.div(tau,m),
        scale=G.mul(baseScale,G.pow(gL,degree(orders))),coefficient=G.div(derivative,scale);
      if(!n||G.freeCoordinates(coefficient).size)fail('INVALID_SOURCE_CONSTRUCTION','Every uncentered slow row needs its same original full derivative body and scale.');
      rows.push({quantity:entry.quantity,sign,component:entry.component,derivative:label,order:degree(orders),orders,originalDerivative:root,witnessDerivative:atPoint,
        normalizedDirectionDerivative:derivative,positiveExactScale:scale,coefficient,directedInterval:n.interval,width:n.width,toleranceMet:n.toleranceMet,
        nonzeroRemainderRetained:true,bodyDerivativeBinding:originalJetBindings.find(b=>b.quantity===entry.quantity&&b.component===entry.component).checks[at].pass,
        scope:'the original uncentered a/H/y derivative; no unknown center amplitude remains in the coefficient'});
    }
    progress(context,'full-center-original-uncentered-derivatives-'+source.families[i].sign,G,{rows:rows.length});clearDisposableThirdJetCaches(G);
  }
  for(const f of logSlopes.rows)for(const row of f.centerRows){
    const n=logNumerics.rows.find(x=>x.direction===row.direction);row.directedInterval=n.coefficient;row.width=n.width;row.nonzeroRemainderRetained=true;
  }
  const roots={originalWeightedPulse:fastFamilies.map(f=>f.products.map(p=>p.actualBody)),originalH:source.target.H,originalWeights:source.target.weights,originalSquareRootWeights:source.target.squareRootWeights,
    originalDynamicCenters:slow.centering.centers,originalSourceTarget:source.target.components,centerTime:centered.roots.centerTime,Rstar,g,L,gL,A0,massScale:m,tau,Ac:diagonal[0],u:diagonal[1],
    firstFastScale,secondFastScale,mixedFastScale,sourceNumericalCoefficients:rows.map(r=>r.coefficient),sourceNumericalScales:rows.map(r=>r.positiveExactScale),sourceLogCenterCoefficients:logSlopes.rows.flatMap(f=>f.centerRows.map(r=>r.coefficient))},
    numerics={fast:fastNumerics,centerLogSlopes:logNumerics,uncentered:uncenteredNumerics,absoluteValueBoxes:valueBoxes,
      sourceAuthenticatedByThisPrivateAdapter:true,centerAmplitudeStillUnknown:false,remainingGeometryAndTargetScalesNumericallyEvaluated:false},
    checks=[{id:'unchanged-both-private-original-predecessors-and-common-centered-identity',pass:slow.centered===absolute.centered},
      {id:'source-bound-whole-time-matrix-jets-and-initial-layer',pass:sourceBounds.pass},
      {id:'original-half-pulse-logarithmic-derivatives-and-complete-heat-slopes',pass:logSlopes.pass&&logSlopes.rows.every(f=>f.qvCheck.pass&&f.centerRows.every(r=>r.initialValueIsZero))},
      {id:'both-full-fast-product-and-envelope-bindings',pass:fastFamilies.length===2&&fastFamilies.every(f=>f.pass)},
      {id:'all-original-uncentered-H-and-inverse-slow-product-identities',pass:uncenteredFamilies.length===2&&uncenteredFamilies.every(f=>f.audit.pass)},
      {id:'30-original-fast-36-added-component-slow-and72-uncentered-numerical-rows',pass:rows.length===138&&rows.filter(r=>r.quantity==='weightedPulse'&&r.derivative.includes('v')).length===30&&
        rows.filter(r=>r.quantity==='weightedPulse'&&!r.derivative.includes('v')).length===36&&rows.filter(r=>r.quantity!=='weightedPulse').length===72},
      {id:'all-source-root-intervals-meet-the-exact-width-with-positive-error',pass:rows.every(r=>r.bodyDerivativeBinding&&r.toleranceMet&&r.nonzeroRemainderRetained)},
      {id:'source-square-root-domain-and-absolute-center-denominators-remain-positive',pass:slow.numerics.conditioning.pass&&absolute.checks.every(x=>x.pass)},
      {id:'unchanged-full-authenticated-slow-source-prefix',pass:same(G.nodes.slice(0,sourceCount),slow.program.nodes)}];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The complete centered pulse numerical jet binding failed.');
  const sourceBinding={sourceProfile:request.sourceProfile,parameterExpressionSHA256:slow.sourceBinding.parameterExpressionSHA256,sourceNodeCount:sourceCount,
    selectedEll:source.geometry.ell,compiler:'private original full centered slow source + absolute center on the identical private point -> exact fast and uncentered slow derivatives -> directed numerical coefficients',
    originalFullMatrixPressureBasisTargetHInverseSqrtRetained:true,originalPositiveHAndEpsilonRetained:true,originalRoundedCarriersRetained:true,allSourceDerivativeRootsGeneratedBeforePoint:true,
    predecessorGraphsDistinctAfterTheirCommonPrefix:true,absolutePredecessorAppendedNodeIdsNeverImportedAsSlowGraphIds:true,
    privateSecondVariationAliasesRetainedInOriginatingGraph:true,originalNodePrefixUnchangedByLaterAppends:true},
    proof={kind:'SOURCE_BOUND_FAST_AND_UNCENTERED_SLOW_JETS_WITH_DIRECTED_POSITIVE_ERROR',sourceBounds,centerLog:logSlopes.firstHalfIntegration,
      fast:'For componentj, W_j=sqrt(y)*P*w_plus*(B_jplus+B_jminus*r). At the actual center P=1,P_v=0,P_vv=-g/L. Divide by the frozen positive component scaleDj=(1,Ac,u). Keeping every time/slow product yields W_jv/(Dj*A0*sqrt(g/L))=0+error, W_jvv/(Dj*A0*g/L)=-W_j/(Dj*A0)+error andD_iW_jv/(Dj*A0*g)=mu_i*W_j/(Dj*A0)+error. The stable Riccati derivative estimates retain the nonzero initialr_v(0),r_iv(0). The separate generated amplitude ledger controls allB_j derivatives, which are not dropped.',
      uncentered:algebra.uncenteredError.productProof,actualParameterConvention:'D_R=Rstar*partial_R with Rstar frozen before all repeated derivatives; D_Z=partial_Z,D_T=partial_T. g,L,Ac,m,tau,A0 are exact positive normalizers evaluated at the fixed original witness, not variables during these displayed derivative normalizations.',
      valueAuthentication:'The absolute a/H/y boxes come only from the private absolute-center program on the exact same private centered object. Its appended expression IDs are never confused with IDs in the separately extended slow graph. Original base a/H/y roots are checked before their interval boxes are used.',
      domains:'Open fixed-label original selected terminal member; evaluated atX=Xrep=Xb*exp(-1/4),eta=etaRep=0,s=sRep=1,v=Ls/2. This is the old auxiliary center, not a newly selected physical torus point.',
      numericalScope:'138 new scaled coefficients:30 v/vv/slow-v derivatives of all three weighted components,36 tangential/axial slow derivatives,18 a slow derivatives,36 H-entry slow derivatives,18 y slow derivatives. The original radial slow18-row predecessor remains separately authenticated. Six sign-specific first log-center coefficient roots are also retained. Axial negative-sign intervals change orientation; every component scale stays positive. All comparison zeros have nonzero outward enclosures.',
      limits:'The remaining positive geometry/target scales are not numerically evaluated by this module. xi/phase/physical lift and full physical curl derivatives require their own source-bound numerical extension. No all-label/global or new Lean kernel theorem is claimed.'},
    scope={actualWeightedRadialFastFirstAndSecondCoefficientsNumericallyEnclosed:true,actualWeightedRadialSlowFastMixedCoefficientsNumericallyEnclosed:true,
      actualUncenteredPulseCenterSlowAndMixedCoefficientsNumericallyEnclosed:true,actualUncenteredHSlowAndMixedCoefficientsNumericallyEnclosed:true,actualUncenteredWeightSlowAndMixedCoefficientsNumericallyEnclosed:true,
      actualAbsoluteCenterAmplitudeNumericallyEnclosed:true,originalCompleteTargetAndCoupledModesRetained:true,sourceBoundNonzeroInitialLayerAndGaussianErrors:true,
      samePrivateOldTerminalSourcePoint:true,remainingGeometryAndTargetScalesNumericallyEvaluated:false,allUnscaledHAndWeightNumbersEnclosed:false,
      allThreeWeightedPulseSlowFastAndMixedCoefficientsNumericallyEnclosed:true,otherTwoWeightedPulseComponentsNumericallyEnclosed:true,
      actualPhysicalPointViaTorusInverse:false,actualFullCurlNumericalEnclosure:false,allSourceLabelsCovered:false,
      globalPhysicalResidual:false,wholeGNUMComplete:false,newLeanKernelProof:false,workerExecution:false,browserExecution:false,m3MayStart:false,
      actualPositiveHReplacedByZero:false,actualEpsilonReplacedByZero:false,actualRoundedCarrierReplaced:false,sourceSecondLogDerivativeSetToZero:false};
  progress(context,'full-center-complete-source-directed-rows-ready',G,{rows:rows.length});
  const packed=G.pack(roots,{schema:'MathScope.ActualCenteredPulseFullJetEnclosureProgram/1',compiler:'actual-centered-pulse-full-jet-enclosure.mjs:attachActualCenteredPulseFullJetEnclosure',compilerInput:request,
    sourceBinding,coordinates,sourceBounds,algebra,logSlopes,fastFamilies,uncenteredFamilies,rows,numerics,checks,proof,scope}),{nodes,...rest}=packed,program={...structuredClone(rest),nodes:nodes.slice()},
    result={G,slow,absolute,centered,request,sourceBinding,coordinates,roots,sourceBounds,algebra,logSlopes,fastFamilies,uncenteredFamilies,rows,numerics,checks,proof,scope,program};
  assertActualCenteredSlowJetEnclosure(slow);assertActualAdiabaticPulseCenterEnclosure(absolute);assertActualCenteredPulseEnclosure(centered);
  seals.set(result,{G,slow,absolute,centered,count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),covariance:JSON.stringify(G.covarianceSystems),
    covarianceCount:G.covarianceSystems.length,jets:JSON.stringify(G.pulseJetSystems),jetCount:G.pulseJetSystems.length,program,programNodes:program.nodes,metadata:metadata(program),serialized:canonicalStringify(program),data:data(result)});
  clearDisposableThirdJetCaches(G);progress(context,'full-center-original-numerical-jet-program-sealed',G);return result;
}

export function assertActualCenteredPulseFullJetEnclosure(p){
  const s=seals.get(p);
  if(!s||p.G!==s.G||p.slow!==s.slow||p.absolute!==s.absolute||p.centered!==s.centered||p.program!==s.program||p.program.nodes!==s.programNodes||metadata(p.program)!==s.metadata||data(p)!==s.data||
    JSON.stringify(p.program.nodes)!==s.nodes||JSON.stringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions)||
    JSON.stringify(s.G.covarianceSystems.slice(0,s.covarianceCount))!==s.covariance||JSON.stringify(s.G.pulseJetSystems.slice(0,s.jetCount))!==s.jets)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private complete centered numerical jet program, never a copied report or modified interval/source.');
  assertActualCenteredSlowJetEnclosure(s.slow);assertActualAdiabaticPulseCenterEnclosure(s.absolute);return true;
}

export async function actualCenteredPulseFullJetEnclosureCertificateFromProgram(p,context={}){
  assertActualCenteredPulseFullJetEnclosure(p);const s=seals.get(p),slow=await actualCenteredSlowJetEnclosureCertificateFromProgram(p.slow,context),absolute=await actualAdiabaticPulseCenterEnclosureCertificateFromProgram(p.absolute,context);context.checkCancelled?.();
  return {schema:'MathScope.ActualCenteredPulseFullJetEnclosureCertificate/1',status:'COMPLETED',pass:true,request:p.request,sourceBinding:p.sourceBinding,
    graph:{sha256:await sha256(s.serialized),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).length,compiler:p.program.compiler,compilerInput:p.request,
      fixedCompilerPrefix:true,laterGraphAppendsExcluded:true,graphIncluded:false,originalSlowGraph:slow.graph,absoluteCenterGraph:absolute.graph},
    roots:p.roots,sourceBounds:p.sourceBounds,algebra:p.algebra,logSlopes:p.logSlopes,fastFamilies:p.fastFamilies,uncenteredFamilies:p.uncenteredFamilies,rows:p.rows,numerics:p.numerics,checks:p.checks,proof:p.proof,scope:p.scope};
}

export async function actualCenteredPulseFullJetEnclosure(input={},context={}){
  return actualCenteredPulseFullJetEnclosureCertificateFromProgram(prepareActualCenteredPulseFullJetEnclosure(input,context),context);
}
