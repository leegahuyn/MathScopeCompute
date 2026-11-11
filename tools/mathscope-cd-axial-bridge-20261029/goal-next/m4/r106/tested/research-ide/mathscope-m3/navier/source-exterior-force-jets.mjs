/** Actual original heat-exterior force jets, source pp.119-120 (10.7)-(10.10).
 *
 * This computes a nonzero, positive-radius restriction of the terminal force.
 * It does not replace the unconstructed final N6 field or the global F_j. The
 * coefficient c_infinity is recovered from the privately authenticated M2
 * heat matching, never chosen as a display normalization.
 */
import {prepareActualSourceLocalization,assertActualSourceLocalization,actualSourceLocalizationCertificate} from './source-localization.mjs';
import {attachActualSourceLocalizationDomain,assertActualSourceLocalizationDomain,actualSourceLocalizationDomainCertificate} from './source-localization-domain.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),copy=x=>structuredClone(x);
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const polyAdd=(a,b)=>Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]??0n)+(b[i]??0n));
const polyScale=(a,b)=>a.map(x=>x*b);
const polyMul=(a,b)=>{const out=Array(a.length+b.length-1).fill(0n);a.forEach((v,i)=>b.forEach((w,j)=>{out[i+j]+=v*w;}));return out;};
const choose=(n,k)=>{let out=1n;for(let j=1;j<=k;j++)out=out*BigInt(n-j+1)/BigInt(j);return out;};

/** Integer coefficient polynomials. P_j=(h)_j(1+h)_j and
 * D_j=sum_k binom(j,k)P_k P_(j-k). No tiny positive h is rounded to zero.
 */
export function exteriorTerminalPolynomials(order){
  if(!Number.isSafeInteger(order)||order<0||order>12)fail('RESOURCE_LIMIT','Finite exterior jets support orders 0 through 12.');
  const all=[[1n]];
  for(let j=0;j<order;j++)all.push(polyMul(all.at(-1),[BigInt(j*(j+1)),BigInt(2*j+1),1n]));
  let square=[0n];
  for(let k=0;k<=order;k++)square=polyAdd(square,polyScale(polyMul(all[k],all[order-k]),choose(order,k)));
  return {order,variable:'h',velocityPolynomial:all[order].map(String),squarePolynomial:square.map(String),
    velocityRecurrence:'P_(j+1)=(h+j)*(h+j+1)*P_j; P_0=1',
    squareRule:'D_j=sum_(k=0)^j binom(j,k)*P_k*P_(j-k)',
    timeConvention:'partial_t^j=(-1)^j partial_tau^j; the heat derivative contributes the cancelling (-1)^j.',
    positiveForActualSourceH:true,positivityPremise:'h>0',finiteOrderIsNotWholeGlobalTerminalJetAuthority:true};
}

function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='orders'))
    fail('INVALID_INPUT','Only finite derivative orders may be chosen; heat constants, force values and proof flags are not inputs.');
  const orders=input.orders??[0,1,2,3,4];
  if(!Array.isArray(orders)||!orders.length||orders.length>13||new Set(orders).size!==orders.length)
    fail('INVALID_INPUT','Use distinct terminal derivative orders.');
  orders.forEach(exteriorTerminalPolynomials);return {orders:[...orders].sort((a,b)=>a-b)};
}

/** Exact algebra kernel used by the authenticated source attachment below.
 * Its inputs can be symbolic test fields; the return value grants no source
 * authority. The original A=1/2+h relation and pressure normalization are
 * fixed here, while the actual heat coefficient and cutoff come from M2/N7.
 */
export function exactExteriorTerminalJetKernel(G,{h,cInfinity,radius,cutoff,order}){
  const q=(n,d=1)=>G.q(n,d),A=G.add(q(1,2),h),s=G.div(G.pow(radius,2),q(2)),c=cutoff,
    cr=G.derivative(c,radius),crr=G.derivative(cr,radius),lapC=G.add(crr,G.div(cr,radius)),
    polynomials=exteriorTerminalPolynomials(order),
    polynomial=coefficients=>G.add(...coefficients.map((a,j)=>G.mul(q(BigInt(a)),G.pow(h,j)))),
    P=polynomial(polynomials.velocityPolynomial),D=polynomial(polynomials.squarePolynomial),
    kExponent=G.add(A,q(order)),n=G.add(G.mul(q(2),A),q(order)),
    K=G.mul(cInfinity,q(1n<<BigInt(order)),P,G.exp(G.neg(G.mul(kExponent,G.log(s))))),
    square=G.mul(G.pow(cInfinity,2),q(1n<<BigInt(order)),D,G.exp(G.neg(G.mul(n,G.log(s))))),
    pressure=G.neg(G.div(square,G.mul(q(2),n))),Kr=G.neg(G.div(G.mul(q(2),kExponent,K),radius)),
    forceRadial=G.add(G.mul(cr,pressure),G.div(G.mul(c,G.sub(G.one,c),square),radius)),
    forceTheta=G.neg(G.add(G.mul(q(2),cr,Kr),G.mul(lapC,K))),forceAxial=G.zero,
    localizedPressure=G.mul(c,pressure),divForce=G.div(G.derivative(G.mul(radius,forceRadial),radius),radius),
    lapPressure=G.add(G.derivative(G.derivative(localizedPressure,radius),radius),G.div(G.derivative(localizedPressure,radius),radius)),
    divDivVelocitySquare=G.neg(G.div(G.derivative(G.mul(G.pow(c,2),square),radius),radius)),
    check=difference=>sourceGraphRationalIdentity(G,difference,{atomicNodes:[h],maxTerms:180000}),
    checks={radial:check(G.sub(G.derivative(K,radius),Kr)),
      pressure:check(G.sub(G.derivative(pressure,radius),G.div(square,radius))),
      poisson:check(G.sub(G.add(lapPressure,divDivVelocitySquare),divForce))},
    radialNormalized=G.add(q(1,4),G.div(q(3),n)),thetaNormalized=G.neg(G.mul(q(64),G.add(h,q(order)))),
    divergenceNormalized=G.sub(G.sub(G.div(q(16),n),q(16)),G.mul(q(4,3),n)),
    lapPressureNormalized=G.sub(G.sub(G.div(q(16),n),q(32)),G.mul(q(8,3),n)),
    divDivNormalized=G.add(q(16),G.mul(q(4,3),n));
  return {order,polynomials,checks,sourceAuthenticated:false,expressions:{A,s,c,cr,crr,lapC,P,D,n,K,square,pressure,Kr,
    forceRadial,forceTheta,forceAxial,localizedPressure,divForce,lapPressure,divDivVelocitySquare,
    radialNormalized,thetaNormalized,divergenceNormalized,lapPressureNormalized,divDivNormalized}};
}

function appendScalarProgram(base,G,roots){
  const out=copy(base),map=new Map(out.sourceNodeIds.map((id,index)=>[id,index]));
  const append=id=>{
    if(map.has(id))return map.get(id);const node=G.nodes[id];if(!node)fail('INVALID_SOURCE_CONSTRUCTION','A terminal-force source node is missing.');
    let args;
    if(['rational','coordinate','source_parameter'].includes(node.op))args=[...node.args];
    else if(['integer_power','source_step_derivative'].includes(node.op))args=[append(node.args[0]),node.args[1]];
    else if(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling','floor','sine','cosine','definite_integral','smooth_piecewise'].includes(node.op))args=node.args.map(append);
    else fail('UNSUPPORTED','An actual exterior expression cannot omit '+node.op+'.');
    const at=out.nodes.length;out.nodes.push({op:node.op,args});out.sourceNodeIds.push(id);map.set(id,at);return at;
  };
  out.schema='MathScope.N7.SourceExteriorForceJetScalarProgram/1';out.sourceLocalizationRoots=out.roots;
  out.roots=Object.fromEntries(Object.entries(roots).map(([name,id])=>[name,append(id)]));
  out.freeCoordinates=Object.fromEntries(Object.entries(roots).map(([name,id])=>[name,[...G.freeCoordinates(id)].map(x=>G.nodes[x].args[0])]));
  out.meaning='Exact original matched heat coefficient, positive-radius terminal force and pressure jets, with the actual smooth radial cutoff. Terminal velocity at the singular origin is never evaluated.';
  return out;
}

const data=x=>({schema:x.schema,request:x.request,sourceBinding:x.sourceBinding,constants:x.constants,domain:x.domain,sourceDomainBridge:x.sourceDomainBridge,
  cutoff:x.cutoff,rows:x.rows,initialZeroBranch:x.initialZeroBranch,globalExtension:x.globalExtension,checks:x.checks,scope:x.scope,formulaProgram:x.formulaProgram});

export async function attachActualExteriorForceJets(localization,input={}){
  assertActualSourceLocalization(localization);const request=requestOf(input),{G,inner}=localization,
    domainBridge=await attachActualSourceLocalizationDomain(localization),domainCertificate=await actualSourceLocalizationDomainCertificate(domainBridge),
    sourceCount=G.nodes.length,sourcePrefix=canonicalStringify(G.nodes),sourceDefinitions=G.captureFunctionDefinitions(),
    localCertificate=await actualSourceLocalizationCertificate(localization),q=(n,d=1)=>G.q(n,d),h=localization.constants.h,A=localization.constants.A,
    actualHeat=inner.family.prepared.bootstrap.actualHeat,heat=actualHeat.heat,eta=inner.family.prepared.bootstrap.constants.eta,
    amplitude=G.substitute(heat.exteriorAmplitude,eta,G.zero),cInfinity=G.mul(G.sqrt(q(2)),amplitude),Xheat=heat.Xb,
    radius=G.fresh('n7_exterior_force_radius'),s=G.div(G.pow(radius,2),q(2)),
    primitive=localization.cutoff.primitive,chi=argument=>G.substitute(primitive.body,primitive.coordinate,argument),
    c=chi(G.mul(q(2),G.pow(radius,2))),cr=G.derivative(c,radius),crr=G.derivative(cr,radius),lapC=G.add(crr,G.div(cr,radius)),
    midpoint=q(3,4),chiMid=G.substitute(primitive.body,primitive.coordinate,midpoint),
    chiPrimeMid=G.substitute(G.derivative(primitive.body,primitive.coordinate),primitive.coordinate,midpoint),
    chiSecondMid=G.substitute(G.derivative(G.derivative(primitive.body,primitive.coordinate),primitive.coordinate),primitive.coordinate,midpoint),
    radiusSquaredMidpoint=q(3,8),radiusMidpoint=G.sqrt(radiusSquaredMidpoint),sMidpoint=q(3,16),
    positiveTimeCeiling=G.inv(G.add(q(4),G.div(q(4),localization.constants.tau0),G.mul(q(32),Xheat))),
    roots={h,A,cInfinity,originalExteriorAmplitude:heat.exteriorAmplitude,amplitude,Xheat,radius,s,cutoff:c,cutoffRadial:cr,cutoffRadial2:crr,
      cutoffLaplacian:lapC,radiusSquaredMidpoint,radiusMidpoint,sMidpoint,chiMid,chiPrimeMid,chiSecondMid,positiveTimeCeiling,
      ...Object.fromEntries(Object.entries(domainBridge.constants).filter(([,id])=>Number.isSafeInteger(id)).map(([name,id])=>['sourceDomain_'+name,id]))},
    checks=[{id:'same-private-localization-and-original-matched-heat',pass:assertActualSourceLocalization(localization)&&actualHeat.roots.actualHeatExteriorAmplitude===heat.exteriorAmplitude&&actualHeat.roots.actualHeatExteriorStart===Xheat},
      {id:'matched-exterior-amplitude-independent-of-eta',pass:G.derivative(heat.exteriorAmplitude,eta)===G.zero&&G.freeCoordinates(amplitude).size===0},
      {id:'original-radial-cutoff-has-the-exact-nontrivial-midpoint-jets',pass:sourceGraphRationalIdentity(G,G.sub(chiMid,q(1,2))).pass&&sourceGraphRationalIdentity(G,G.add(chiPrimeMid,q(4))).pass&&sourceGraphRationalIdentity(G,chiSecondMid).pass}],rows=[];
  for(const order of request.orders){
    const kernel=exactExteriorTerminalJetKernel(G,{h,cInfinity,radius,cutoff:c,order}),{polynomials}=kernel,
      {P,D,n,K,square,pressure,Kr,forceRadial,forceTheta,forceAxial,localizedPressure,divForce,lapPressure,divDivVelocitySquare,
        radialNormalized,thetaNormalized,divergenceNormalized,lapPressureNormalized,divDivNormalized}=kernel.expressions,
      midpointK=G.substitute(K,radius,radiusMidpoint),midpointSquare=G.substitute(square,radius,radiusMidpoint),
      midpointForceRadial=G.mul(G.div(midpointSquare,radiusMidpoint),radialNormalized),midpointForceTheta=G.mul(midpointK,thetaNormalized),
      midpointDivForce=G.mul(midpointSquare,divergenceNormalized);
    checks.push({id:'order-'+order+'-heat-radial-derivative',pass:kernel.checks.radial.pass},
      {id:'order-'+order+'-pressure-improper-integral-derivative',pass:kernel.checks.pressure.pass},
      {id:'order-'+order+'-Poisson-keeps-force-divergence',pass:kernel.checks.poisson.pass});
    const expressions={P,D,n,K,square,pressure,Kr,forceRadial,forceTheta,forceAxial,localizedPressure,divForce,lapPressure,divDivVelocitySquare,
      radialNormalized,thetaNormalized,divergenceNormalized,lapPressureNormalized,divDivNormalized,midpointK,midpointSquare,midpointForceRadial,midpointForceTheta,midpointDivForce};
    for(const [name,id] of Object.entries(expressions))roots['order_'+order+'_'+name]=id;
    rows.push({order,polynomials,expressions,
      heatJet:'K_j=c_infinity*2^j*(h)_j*(1+h)_j*s^(-A-j), s=r^2/2',
      squareJet:'S_j=partial_t^j(K^2)=c_infinity^2*2^j*D_j*s^(-2A-j)',
      pressureJet:'p_j=-S_j/[2*(2A+j)]=-integral_r^infinity S_j(rho)/rho d rho',
      forceJet:{radial:'chi_r*p_j+chi*(1-chi)*S_j/r',theta:'-2*chi_r*partial_r(K_j)-(chi_rr+chi_r/r)*K_j',axial:'0 on the z=0 exterior restriction'},
      midpoint:{position:[radiusMidpoint,G.zero,G.zero],radiusSquared:radiusSquaredMidpoint,
        normalizedRadial:{scale:'S_j/r_mid>0',expression:radialNormalized,formula:'1/4+3/(2A+j)',sign:'STRICTLY_POSITIVE'},
        normalizedTheta:{scale:'K_j>0',expression:thetaNormalized,formula:'-64*(h+j)',sign:'STRICTLY_NEGATIVE',tinyHRetained:true},
        normalizedDivergence:{scale:'S_j>0',expression:divergenceNormalized,formula:'16/(2A+j)-16-(4/3)*(2A+j)',sign:'STRICTLY_NEGATIVE',
          proof:'2A+j=1+2h+j>1, hence16/(2A+j)<16 and the last term is negative.'},
        originalPressurePoisson:{laplacian:lapPressureNormalized,divDivVelocitySquare:divDivNormalized,forceDivergence:divergenceNormalized,
          equation:'Delta(chi*p_j)+partial_i partial_k(partial_t^j(u_i*u_k))=div F_j',holdsExactly:true}},
      actualSourceAmplitudeUsed:true,numericalGlobalFieldFilledIn:false,terminalLimitIsAwayFromSingularOrigin:true});
  }
  checks.push({id:'source-prefix-and-all-existing-function-definitions-preserved',pass:canonicalStringify(G.nodes.slice(0,sourceCount))===sourcePrefix&&G.functionDefinitionsUnchanged(sourceDefinitions)&&assertActualSourceLocalization(localization)});
  if(checks.some(row=>!row.pass))fail('INVALID_SOURCE_CONSTRUCTION','An actual exterior-force identity failed: '+checks.filter(row=>!row.pass).map(row=>row.id).join(', '));
  const result={schema:'MathScope.N7.ActualExteriorForceJets/1',G,localization,domainBridge,request,
    sourceDomainBridge:domainCertificate,
    sourceBinding:{...copy(localization.sourceBinding),references:['(10.4)','(10.5)','(10.7)','(10.8)','(10.10)','(A.32)-(A.38)'],pages:[118,119,120,138],
      commonFamilyGraph:copy(localization.sourceBinding.common6FamilyGraph),originalMatchedHeatRoot:heat.exteriorAmplitude,
      cInfinityFormula:'sqrt(2)*actualHeat.exteriorAmplitude, derived from E=sqrt(2X)*F and u_theta=q^-A E.',
      arbitraryDisplayNormalizationAccepted:false},
    constants:{h,A,cInfinity,originalExteriorAmplitude:heat.exteriorAmplitude,Xheat,radiusSquaredMidpoint,radiusMidpoint,sMidpoint,positiveTimeCeiling},
    domain:{actualComputedComponent:'THE_AUTHENTICATED_ORIGINAL_MATCHED_HEAT_EXTERIOR_WITH_THE_ORIGINAL_LOCALIZATION_CUTOFF',
      radialRestriction:'r>0, z=0, X=r^2/(2*tau)>=Xheat',timeRestriction:'0<tau<positiveTimeCeiling; near the chosen midpoint chi_t=1',
      uniformPositiveTimeProof:'For r>=1/2, tau<1/(32*Xheat) gives X>4*Xheat; tau<tau0/4 leaves the temporal cutoff on its unit plateau.',
      terminalEvaluation:'Only finite force/pressure/heat limits at r>0 are constructed; u(0,1) and the global terminal velocity are not evaluated.',
      finalN6Identification:{status:'EXTERNAL_SOURCE_THEOREM_DEPENDENCY',references:['Theorem3.1 exterior identity (3.5)','Proposition9.9 fixed annular supports','Proposition10.1 same cutoff'],
        allAnnularCorrectionsConstructedHere:false,
        sourceDomainBridge:'The attached unchanged common6 and original mean-map premises justify a permitted qbig via Lemma9.7; Proposition9.9 uses qStar=qbig.',
        finalN6FieldNumericallyInstantiatedOnChosenDomain:false,
        sourceHeatRestrictionDoesNotRequireTheUnconstructedN6Domain:true},
      pressureIntegralTail:'At order j the exact terminal integrand has exponent2A+j>0, so its entire improper tail is integrated explicitly, without a finite radial cutoff.',
      heatLimitJustification:'The (A.32) differentiated integrand is dominated by e^-v*v^(h+j) times a fixed positive-radius constant; Gamma recurrence yields P_j.'},
    cutoff:{primitive:copy(primitive),body:c,radialDerivative:cr,radialSecondDerivative:crr,scalarRadialLaplacian:lapC,
      midpoint:{argument:midpoint,chi:chiMid,chiPrime:chiPrimeMid,chiSecond:chiSecondMid,radialDerivative:'-16*r_mid',scalarLaplacian:'-32'},
      sourceCutoffChanged:false,cutoffTermsDiscarded:false},rows,
    initialZeroBranch:{domain:copy(localization.domain.initialZeroInterval),force:['0','0','0'],everyFiniteForceDerivative:'0',
      wholeKEnergy:'0',wholeKDissipation:'0',wholeKForcingWork:'0',
      reason:'The temporal cutoff and every derivative vanish identically throughout an initial time interval on the entire compact K.',
      finalFieldIdentification:'These are exact values of the constructed common-source localization zero branch. Identifying its nonzero branch and chosen domain with the final N6 field remains unexecuted.',
      activeNearTerminalWholeKEnergyComputed:false},
    globalExtension:{status:'NEEDS_COMPLETE_GLOBAL_TERMINAL_JETS_AND_NORMS',reference:'(10.11)-(10.12)',
      available:'Actual matched heat exterior terminal jets on a positive-radius restriction.',
      missing:['Actual complete final N6 A/B/p and all updated pressure/PDE jets.','Global F_j on every point of K, with compatible all-order limits.','Certified global C^a norms of F_j and derivative bounds for the fixed chi_0.','Original increasing integer b_j selected from those bounds.'],
      exteriorRowsSubstitutedForWholeFj:false,forceAfterTerminalTimeConstructed:false},checks,
    scope:{actualMatchedExteriorForceJetsConstructed:true,actualNonzeroForceDivergenceConstructed:true,fullImproperPressureJetIntegralRetained:true,
      originalHeatRestrictionOnly:true,wholeFinalN6FieldConstructed:false,wholeGlobalTerminalForceJetsConstructed:false,
      sourceBoundCommonDomainChoiceJustified:domainBridge.scope.sourceBoundCommonDomainChoiceJustified,
      wholeKEnergyNearTerminalComputed:false,globalForceExtensionConstructed:false,newLeanExecuted:false,originalCriterionComplete:false,wholeM3Complete:false},
    formulaProgram:appendScalarProgram(localCertificate.formulaProgram,G,roots)};
  seals.set(result,{G,localization,domainBridge,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),metadata:canonicalStringify(data(result))});return result;
}

export async function prepareActualExteriorForceJets(input={},context={}){
  const request=requestOf(input),localization=context.localization??await prepareActualSourceLocalization({},context);
  return attachActualExteriorForceJets(localization,request);
}

export function assertActualExteriorForceJets(result){
  const seal=seals.get(result);
  if(!seal||result.G!==seal.G||result.localization!==seal.localization||result.domainBridge!==seal.domainBridge||canonicalStringify(data(result))!==seal.metadata||
    canonicalStringify(seal.G.nodes.slice(0,seal.count))!==seal.prefix||!seal.G.functionDefinitionsUnchanged(seal.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged privately constructed original heat-exterior force jets.');
  assertActualSourceLocalization(seal.localization);assertActualSourceLocalizationDomain(seal.domainBridge);return true;
}

export async function actualExteriorForceJetsCertificate(result){
  assertActualExteriorForceJets(result);return {...copy(data(result)),graph:{constructedNodeCount:seals.get(result).count,
    scalarNodeCount:result.formulaProgram.nodes.length,scalarProgramSHA256:await sha256(canonicalStringify(result.formulaProgram))},
    verification:{status:'ACTUAL_SOURCE_EXTERIOR_TERMINAL_FORCE_JETS_EXECUTED',checksPass:result.checks.every(row=>row.pass),
      forceDivergenceNotForcedToZero:true,actualFinalN6FieldsNumericallyEvaluated:false,globalForceExtensionExecuted:false,newLeanExecuted:false}};
}
