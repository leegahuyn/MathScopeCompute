/** Exact source cutoff transport for (10.22) and Corollary 10.6.
 *
 * This consumes the privately authenticated original localization. It
 * constructs its actual transformed cutoff and field-operator coefficients.
 * The final N6 fields, extended force and energy estimates remain explicit
 * prerequisites. A scaling identity is not a completed Navier solution.
 */
import {assertActualSourceLocalization,actualSourceLocalizationCertificate} from './source-localization.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};

function floorSqrt(n){
  if(n<0n)fail('INVALID_INPUT','A support comparison needs a nonnegative integer.');
  if(n<2n)return n;
  let x=1n<<BigInt(Math.ceil(n.toString(2).length/2));
  for(;;){const y=(x+n/x)/2n;if(y>=x)return x;x=y;}
}

/** Exact rational viscosity and an integer support shrink; no binary64
 * value is used to establish positivity, containment or a strict gap.
 */
export function exactPeriodizationRequest(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['viscosity','spatialScale'].includes(k)))
    fail('INVALID_INPUT','Only exact viscosity and the spatial shrink may be selected; source fields and completed proof flags are not inputs.');
  const value=input.viscosity??'1';
  if(typeof value!=='string'||value.length>257)fail('INVALID_VISCOSITY','Use a positive integer or rational string of at most 257 characters.');
  const match=value.match(/^([1-9]\d*)(?:\/([1-9]\d*))?$/);
  if(!match||match[1].length>128||(match[2]?.length??0)>128)fail('INVALID_VISCOSITY','Use exact positive numerator and denominator, each at most 128 digits.');
  let numerator=BigInt(match[1]),denominator=BigInt(match[2]??'1');const divisor=gcd(numerator,denominator);
  numerator/=divisor;denominator/=divisor;
  const required=floorSqrt(4n*numerator/denominator)+1n;
  let lambda=required>1n?required:2n;
  if(input.spatialScale!==undefined){
    if(typeof input.spatialScale!=='string'||!/^([1-9]\d*)$/.test(input.spatialScale)||input.spatialScale.length>128)
      fail('INVALID_SPATIAL_SCALE','Use an exact positive integer spatial scale.');
    lambda=BigInt(input.spatialScale);
  }
  if(lambda<=1n||lambda*lambda*denominator<=4n*numerator)
    fail('OVERLAPPING_SUPPORT','Require lambda>1 and lambda^2>4*nu so the conservative source support box lies strictly inside the unit cube.');
  const d=lambda*lambda,margin=d*denominator-4n*numerator;
  return {viscosity:{numerator:String(numerator),denominator:String(denominator)},spatialScale:String(lambda),
    t0:{numerator:String(d-1n),denominator:String(d)},forceTimeUpper:{numerator:String(d+1n),denominator:String(d)},
    support:{strictSquaredMarginNumerator:String(margin),denominator:String(d*denominator),
      expression:'1-4*nu/lambda^2>0',strictlyPositive:margin>0n,originalConservativeHalfWidths:['1','1','1']},
    arithmetic:'Exact reduced positive rational nu and integer lambda; no floating-point support test.'};
}

/** A monomial is nu^(nuHalfPower/2)*lambda^lambdaPower. This independent
 * exponent calculation records the complete chain rule and volume/time
 * Jacobians. Applying the identities still requires the SAME source fields.
 */
export function periodizationScaleLedger(){
  const m=(n,l)=>({nuHalfPower:n,lambdaPower:l}),times=(...xs)=>xs.reduce((a,b)=>m(a.nuHalfPower+b.nuHalfPower,a.lambdaPower+b.lambdaPower),m(0,0)),
    pow=(x,n)=>m(n*x.nuHalfPower,n*x.lambdaPower),u=m(1,1),p=m(2,2),f=m(1,3),nu=m(2,0),dx=m(-1,1),dt=m(0,2),
    volume=pow(dx,-3),timeMeasure=pow(dt,-1),energy=times(pow(u,2),volume),
    momentum={time:times(u,dt),advection:times(pow(u,2),dx),viscosity:times(nu,u,pow(dx,2)),pressure:times(p,dx),force:f},
    pressurePoisson={pressure:times(p,pow(dx,2)),quadraticVelocity:times(pow(u,2),pow(dx,2)),forceDivergence:times(f,dx)},
    energyTerms={kinetic:energy,dissipation:times(nu,pow(times(u,dx),2),volume,timeMeasure),
      forceWork:times(f,u,volume,timeMeasure),squaredTimeIntegralForceL2:times(pow(f,2),volume,pow(timeMeasure,2))};
  return {schema:'MathScope.N7.ExactPeriodizationScaleLedger/1',factors:{u,p,f,nu,dx,dt,volume,timeMeasure},momentum,pressurePoisson,energyTerms,
    checks:[{id:'all-five-momentum-terms-have-the-same-factor',pass:Object.values(momentum).every(x=>same(x,f))},
      {id:'pressure-Poisson-keeps-force-divergence',pass:Object.values(pressurePoisson).every(x=>same(x,m(0,4)))},
      {id:'whole-space-and-time-energy-Jacobians-match',pass:Object.values(energyTerms).every(x=>same(x,m(5,-1)))}],
    sourcePDEOrEnergyExecuted:false};
}

function extendProgram(base,G,roots){
  const result=structuredClone(base),map=new Map(result.sourceNodeIds.map((id,i)=>[id,i]));
  const append=id=>{
    if(map.has(id))return map.get(id);
    const node=G.nodes[id];if(!node)fail('INVALID_SOURCE_CONSTRUCTION','A transported source scalar root is missing.');
    let args;
    if(['rational','coordinate','source_parameter'].includes(node.op))args=[...node.args];
    else if(['integer_power','source_step_derivative'].includes(node.op))args=[append(node.args[0]),node.args[1]];
    else if(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling','floor','sine','cosine','definite_integral','smooth_piecewise'].includes(node.op))args=node.args.map(append);
    else fail('UNSUPPORTED','The exact periodization scalar program cannot drop '+node.op+'.');
    const at=result.nodes.length;result.nodes.push({op:node.op,args});result.sourceNodeIds.push(id);map.set(id,at);return at;
  };
  const previousRoots=result.roots;result.roots=Object.fromEntries(Object.entries(roots).map(([name,id])=>[name,append(id)]));
  result.schema='MathScope.N7.SourcePeriodizationScalarProgram/1';result.sourceLocalizationRoots=previousRoots;
  result.freeCoordinates=Object.fromEntries(Object.entries(roots).map(([name,id])=>[name,[...G.freeCoordinates(id)].map(x=>G.nodes[x].args[0])]));
  result.meaning='Exact original cutoff transported to the unit torus, with unchanged original source constants and a positive tau coordinate.';
  return result;
}

const data=x=>({schema:x.schema,request:x.request,sourceBinding:x.sourceBinding,coordinates:x.coordinates,scales:x.scales,
  cutoff:x.cutoff,operator:x.operator,support:x.support,time:x.time,path:x.path,energy:x.energy,comparison:x.comparison,
  scaleLedger:x.scaleLedger,checks:x.checks,scope:x.scope,formulaProgram:x.formulaProgram});

export function attachActualSourcePeriodization(localization,input={}){
  assertActualSourceLocalization(localization);const request=exactPeriodizationRequest(input),{G}=localization,
    prefixCount=G.nodes.length,prefix=canonicalStringify(G.nodes),definitions=G.captureFunctionDefinitions(),q=(a,b=1)=>G.q(a,b),
    nu=q(BigInt(request.viscosity.numerator),BigInt(request.viscosity.denominator)),lambda=q(BigInt(request.spatialScale)),
    sqrtNu=G.sqrt(nu),spacePullback=G.div(lambda,sqrtNu),timePullback=G.pow(lambda,2),inverseTime=G.inv(timePullback),
    velocityScale=G.mul(lambda,sqrtNu),pressureScale=G.mul(timePullback,nu),forceScale=G.mul(G.pow(lambda,3),sqrtNu),
    energyScale=G.div(G.mul(G.pow(nu,2),sqrtNu),lambda),
    x=[1,2,3].map(j=>G.fresh('n7_periodic_x'+j)),tau=G.fresh('n7_periodic_tau'),
    originalX=x.map(v=>G.mul(spacePullback,v)),originalTau=G.mul(timePullback,tau),originalTime=G.sub(G.one,originalTau),
    src=localization.cutoff.coordinates,from=[src.x1,src.x2,src.z,src.tau],to=[...originalX,originalTau],
    at=root=>G.simultaneousSubstitute(root,from,to),cutoff=at(localization.cutoff.body),
    gradient=x.map(v=>G.derivative(cutoff,v)),dt=G.neg(G.derivative(cutoff,tau)),
    t0=G.sub(G.one,inverseTime),forceEnd=G.add(G.one,inverseTime),
    halfWidth=G.div(sqrtNu,lambda),gap=G.sub(G.one,G.mul(q(2),halfWidth)),
    originalInitialTau=localization.constants.tau0,initialZeroTau=G.mul(inverseTime,originalInitialTau),
    initialZeroUntil=G.sub(G.one,initialZeroTau),
    velocity=localization.operator.velocity.map(row=>({component:row.component,terms:row.terms.map(term=>({...term,
      coefficient:G.mul(velocityScale,at(term.coefficient)),derivativeCoordinate:'ORIGINAL_SOURCE_CARTESIAN_COORDINATE'}))})),
    pressure=localization.operator.pressure.map(term=>({...term,coefficient:G.mul(pressureScale,at(term.coefficient))})),
    pathTau=G.fresh('n7_periodic_original_path_tau'),pathX=G.mul(halfWidth,G.sqrt(G.mul(q(2),localization.inner.point.Xin,pathTau))),
    pathTime=G.sub(G.one,G.mul(inverseTime,pathTau)),pathVelocityScale=G.mul(velocityScale,G.exp(G.neg(G.mul(localization.constants.A,G.log(pathTau))))),
    ledger=periodizationScaleLedger(),
    checks=[...ledger.checks,
      {id:'same-authenticated-source-localization',pass:assertActualSourceLocalization(localization)},
      {id:'original-compact-bound-uses-actual-r0-and-positive-z0',pass:localization.constants.r0===G.one&&localization.domain.positiveTau0LessThanHalf&&localization.domain.sourceDInterval==='1/4<D<1/2'},
      {id:'strict-integer-support-gap',pass:request.support.strictlyPositive&&BigInt(request.support.strictSquaredMarginNumerator)>0n},
      {id:'original-time-one-is-preserved',pass:same(request.t0,{numerator:String(BigInt(request.spatialScale)**2n-1n),denominator:String(BigInt(request.spatialScale)**2n)})},
      {id:'same-source-curl-commutator-and-pressure-coefficients-retained',pass:velocity.every(row=>row.terms.length===5)&&pressure.length===1&&localization.operator.allSpatialCutoffProductTermsRetained},
      {id:'original-scalar-and-function-prefix-unchanged',pass:canonicalStringify(G.nodes.slice(0,prefixCount))===prefix&&G.functionDefinitionsUnchanged(definitions)&&assertActualSourceLocalization(localization)}];
  if(checks.some(row=>!row.pass))fail('INVALID_SOURCE_CONSTRUCTION','An actual source transport identity or input binding failed.');
  const roots={nu,lambda,sqrtNu,spacePullback,timePullback,inverseTime,velocityScale,pressureScale,forceScale,energyScale,
    x1:x[0],x2:x[1],x3:x[2],tau,originalX1:originalX[0],originalX2:originalX[1],originalX3:originalX[2],originalTau,originalTime,
    cutoff,dt,t0,forceEnd,halfWidth,gap,initialZeroTau,initialZeroUntil,pathTau,pathX,pathTime,pathVelocityScale,
    ...Object.fromEntries(gradient.map((v,i)=>['gradient_'+i,v])),
    ...Object.fromEntries(velocity.flatMap(row=>row.terms.map((term,j)=>['velocityCoefficient_'+row.component+'_'+j,term.coefficient]))),
    pressureCoefficient:pressure[0].coefficient},
    result={schema:'MathScope.N7.ActualSourcePeriodization/1',G,localization,request,
      sourceBinding:{paper:structuredClone(localization.sourceBinding.paper),pages:[121,122,123,124,125,126],
        references:['Lemma10.5','(10.22)','(10.23)','Corollary10.6'],
        commonFamilyGraph:structuredClone(localization.sourceBinding.common6FamilyGraph),
        innerPathGraph:structuredClone(localization.innerPath.sourceInnerCertificateGraph),
        sameOriginalFieldInstance:localization.fieldInputs.sharedInstance,originalSourcePrefixCount:prefixCount},
      coordinates:{physical:x,positiveTau:tau,originalPhysical:originalX,originalTau,originalTime,
        originalTimeFormula:'lambda^2*(t-(1-lambda^-2))=1-lambda^2*tau',
        displayTimeIsNotSourceOfTau:true},
      scales:{nu,lambda,sqrtNu,spacePullback,timePullback,velocity:velocityScale,pressure:pressureScale,force:forceScale,wholeEnergy:energyScale},
      cutoff:{body:cutoff,gradient,physicalTimeDerivative:dt,sourceBody:localization.cutoff.body,
        actualSourceSubstitutionExecuted:true,formula:'c(lambda*x/sqrt(nu), lambda^2*tau)'},
      operator:{velocity,pressure,sourceFields:structuredClone(localization.operator.sourceFields),
        originalCoordinateDerivativesRetained:true,actualFinalFieldValuesComputed:false,
        force:{sameInstance:'ORIGINAL_N7_EXTENDED_FORCE_OF_THE_SAME_LOCALIZED_FIELDS',coefficient:forceScale,
          formula:'lambda^3*sqrt(nu)*f(lambda*x/sqrt(nu),lambda^2*(t-t0))',sourceForceConstructed:false},
        potentialIdentity:'curl_x(nu*(c*A)(y,s))+lambda*sqrt(nu)*(c*B_e_theta)(y,s)',
        arbitraryLerayProjectionApplied:false},
      support:{periods:['1','1','1'],domain:'R^3/Z^3',fundamentalCube:'(-1/2,1/2)^3',
        originalConservativeBox:'K subset [-1,1]^3 because r0=1,0<z0<1 and the actual squared-radius cutoff support is smaller.',
        transformedHalfWidthUpper:halfWidth,strictGap:gap,exactContainment:request.support,
        translates:'u_tilde(x+k,t), p_tilde(x+k,t), f_tilde(x+k,t), k in Z^3',
        atMostNonzeroTranslatesAtOnePoint:1,nonlinearCrossTerms:'All products of distinct translates vanish by the same positive support gap, including derivative supports.',
        smoothSumPremise:'Every individual source field and its derivatives have the stated smooth compact support. This is an unresolved final-field premise, not a finite sample inference.',
        N8TwoPiGalerkinDomainSubstituted:false,originalUnitTorusPreserved:true},
      time:{t0,forceEnd,initialZeroUntil,initialZeroTau,terminalTime:'1',velocityDefinedOnlyBeforeOne:true,
        preShiftBranch:'Return the exact zero field for t<t0 before evaluating any unshifted source field.',
        fieldSeam:'The actual original cutoff is zero on an interval after original t=0; its transformed coefficients vanish on an interval around t0.',
        extendedForceSupport:'[t0,1+lambda^-2], conditional on the actual original Lemma10.3 force support [0,2].',
        postTerminalVelocityExtensionClaimed:false},
      path:{originalPositiveTau:pathTau,position:[pathX,G.zero,G.zero],time:pathTime,velocityScale:pathVelocityScale,
        originalXin:localization.inner.point.Xin,originalE0:localization.inner.leading.actualE0,
        originalRemainder:structuredClone(localization.inner.remainder),
        originalLocalizedFieldIdentification:'EXTERNAL_PROP9_9_AND_10_1_NOT_DISCHARGED_BY_THIS_TRANSPORT',
        actualSourcePathScalesConstructed:true,wholeLocalizedVelocityComputed:false},
      energy:{commonFactor:energyScale,formula:'nu^(5/2)/lambda',timeIntegralJacobianRetained:true,
        wholeSpaceJacobianRetained:true,sourceWholeKEnergyAvailable:false,finiteCoreEnergyUsedAsWholeEnergy:false},
      comparison:{wholeSpace:{reference:'Lemma10.5',fixedInterval:'[0,T], T<1',sameForceAndZeroDatumRequired:true,
          boundedKineticEnergyRequired:true,pressureGradientControlRequired:true,
          pressureMethod:'Difference pressure gradient is identified with the Riesz-transform pressure in H^-3; weighted cutoff pressure flux tends to zero before Gronwall.'},
        periodic:{reference:'Corollary10.6',sameTransformedForceRequired:true,sameZeroDatumRequired:true,periodicPressureRequired:true,
          localDifferenceBound:'(1/2)d_t||w||_2^2+nu||grad w||_2^2<=||grad U||_infinity||w||_2^2'},
        unresolved:['The complete same N6/N7 localized velocity and pressure.','The source-derived all-order force extension of Lemma10.3.','Whole-K source energy, smoothness and comparison hypotheses.'],
        originalComparisonConclusionIssued:false,callerSuppliedPremiseBooleansAccepted:false},
      scaleLedger:ledger,checks,
      scope:{actualSourceCutoffTransportExecuted:true,exactViscosityAndSupportSelectionExecuted:true,originalFinalN6FieldConstructed:false,
        fullLocalizedForceConstructed:false,wholeEnergyRefinementExecuted:false,originalN708Complete:false,wholeM3Complete:false,newLeanExecuted:false},
      formulaProgram:extendProgram(localization.formulaProgram,G,roots)};
  seals.set(result,{G,localization,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result))});
  return result;
}

export function assertActualSourcePeriodization(result){
  const seal=seals.get(result);
  if(!seal||result.G!==seal.G||result.localization!==seal.localization||canonicalStringify(data(result))!==seal.data||
    canonicalStringify(seal.G.nodes.slice(0,seal.count))!==seal.prefix||!seal.G.functionDefinitionsUnchanged(seal.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged privately constructed transport of the original localization.');
  assertActualSourceLocalization(seal.localization);return true;
}

export async function actualSourcePeriodizationCertificate(result){
  assertActualSourcePeriodization(result);const original=await actualSourceLocalizationCertificate(result.localization);
  return {...structuredClone(data(result)),graph:{sourceLocalization:original.graph,constructedNodeCount:seals.get(result).count,
    scalarNodeCount:result.formulaProgram.nodes.length,scalarProgramSHA256:await sha256(canonicalStringify(result.formulaProgram))},
    verification:{status:'ACTUAL_SOURCE_TRANSPORT_WITH_EXPLICIT_PENDING_FINAL_FIELDS',checksPass:result.checks.every(row=>row.pass),
      actualSourceConstructorExecuted:true,numericalPeriodicVelocityComputed:false,newLeanExecuted:false}};
}
