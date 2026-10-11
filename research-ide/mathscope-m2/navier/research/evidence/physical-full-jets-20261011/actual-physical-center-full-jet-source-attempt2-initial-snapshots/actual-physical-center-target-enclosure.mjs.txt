/** Numerical refinement at the SAME private actual physical center.
 * The regular target coefficient is evaluated by directed quadrature.  The
 * original positive Ac/tau/F/gamma/r/X scales receive numerical exponential
 * endpoints with a quantified iterated-logarithm width, not relative accuracy
 * in the original enormous or tiny value.  No band or scalar root is replaced.
 */
import {assertActualCommonPhysicalCenterEnclosure,prepareActualCommonPhysicalCenterEnclosure,actualCommonPhysicalCenterEnclosureCertificate} from './actual-common-physical-center-enclosure.mjs';
import {encloseTerminalTargetRegularCoefficient,terminalTargetPerturbationAudit} from './actual-terminal-target-coefficient-kernel.mjs';
import {encloseActualPositiveProfileLogs,assertActualPositiveProfileLogs,numericalExponentialInterval,numericalEndpointIsClosed} from './actual-positive-profile-log-enclosure.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {ellOneSourceScalarIdentity} from './actual-covariance-ell-one-obstruction.mjs';
import {directedArithmetic,rational as Q,readRational,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  data=r=>canonicalStringify({request:r.request,sourceBinding:r.sourceBinding,source:r.source,numerics:r.numerics,checks:r.checks,scope:r.scope,proof:r.proof});
function controlsOf(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','coefficientTolerance','logCoordinateTolerance','maxCells'].includes(k)))
    fail('INVALID_INPUT','Only directed numerical controls are accepted. The physical point and every positive source scale come from the private ancestor.');
  const request={precisionBits:input.precisionBits??192,coefficientTolerance:input.coefficientTolerance??'1/1000000000000',
    logCoordinateTolerance:input.logCoordinateTolerance??'1/1000000000000',maxCells:input.maxCells??1024};
  directedArithmetic(request.precisionBits);for(const k of ['coefficientTolerance','logCoordinateTolerance'])if(qcompare(readRational(request[k]),Q(0))<=0)fail('INVALID_INPUT','Numerical widths must be strictly positive.');
  return request;
}

/** Exact endpoint schedule, including the original sigma(1) value node.
 * A source authentication token is supplied only by the outer adapter. */
export function physicalTargetEndpointScheduleAudit(G){
  const q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),lambda=G.parameter('lambda'),T=G.parameter('T'),B=G.parameter('BOuter'),Tf=G.parameter('Tf'),rho=G.mul(G.parameter('co'),h),
    A=G.add(q(1,2),h),al=G.add(q(1,2),lambda),oneStep=G.step(G.one),interpolationStep=G.step(G.div(Tf,Tf)),stages=G.outer?.stages;
  if(!Array.isArray(stages)||stages.length!==12)fail('INVALID_SOURCE_CONSTRUCTION','The actual twelve-stage outer endpoint schedule is required.');
  const wait=stages.find(r=>r.id==='wait')?.length,expected=[
    ['initial',G.one,q(-1,5)],['axialDecay',T,G.mul(q(-1,2),T)],
    ['entry',G.one,G.neg(G.add(q(1,2),G.mul(q(1,2),lambda)))],
    ['reservedPower',G.mul(q(60),B),G.neg(G.mul(al,q(60),B))],
    ['pulse',G.div(q(13),lambda),G.neg(G.mul(al,G.div(q(13),lambda)))],
    ['interpolation',Tf,G.neg(G.add(G.mul(al,Tf),G.mul(G.log(q(2)),interpolationStep)))],
    ['angular',G.mul(q(30),B),G.neg(G.mul(al,q(30),B))],
    ['steepen',G.one,G.neg(G.add(G.one,G.mul(q(1,2),lambda)))],
    ['steepPower',G.mul(q(-4),G.log(h)),G.mul(q(6),G.log(h))],
    ['flatten',G.one,G.neg(G.add(G.one,G.mul(q(1,2),h)))],
    ['wait',wait,G.neg(G.mul(A,wait))],
    ['terminal',q(3),G.add(G.neg(G.mul(q(3),A)),G.log(G.div(G.sub(G.one,G.mul(rho,G.sub(G.one,oneStep))),G.sub(G.one,rho))))]
  ],rows=expected.map(([id,length,increment],i)=>{
    const actual=stages[i],difference=G.sub(G.sub(actual.logAEnd,actual.logAStart),increment),identity=sourceGraphRationalIdentity(G,difference,{maxTerms:30000,maxVisits:200000}),
      chain={actualStart:actual.start,actualEnd:actual.end,expectedStart:i?stages[i-1].end:G.zero,
        expectedEnd:G.add(actual.start,length),expectedLogAStart:i?stages[i-1].logAEnd:G.zero};
    return {id,actualLength:actual.length,expectedLength:length,actualLogAStart:actual.logAStart,actualLogAEnd:actual.logAEnd,expectedIncrement:increment,
      chain,identity,pass:actual.id===id&&actual.length===length&&identity.pass&&actual.start===chain.expectedStart&&actual.end===chain.expectedEnd&&actual.logAStart===chain.expectedLogAStart};
  });
  const interpolationArgumentIdentity=sourceGraphRationalIdentity(G,G.sub(G.div(Tf,Tf),G.one),{maxTerms:100});
  return {schema:'MathScope.PhysicalTargetActualEndpointScheduleAudit/1',rows,pass:rows.every(r=>r.pass)&&interpolationArgumentIdentity.pass,sourceAuthenticated:false,
    retainedSigmaOne:oneStep,retainedInterpolationStep:interpolationStep,interpolationArgumentIdentity,
    sigmaOneLaw:'The original square-seed step equals1 on[1,infinity). Both actual step(1) and step(Tf/Tf) nodes are retained; the latter argument is proved equal1 and Tf=128>0.',
    endpoint:stages.at(-1),rho,waitingLength:wait,
    inequalities:{everyIncrement:'-2*length < increment <0; initial/entry/steepen/flatten are checked directly, interpolation uses Tf=128 and log2<1, terminal uses0<rho<1/4096.',
      endpoint:'-2*yEnd<logAEnd<0; the pulse alone gives -logAEnd>(13/(2lambda)).',
      length:'The original A.13 positive Qb,Qp give0<wait<16006*T+34; yEnd<14*exp(1000*T).',
      profileComparison:'log C>exp(12804000*T)>28*exp(1000*T)>2*yEnd, so C^-1<EpowB=Pstar*exp(logAEnd)<Pstar<C.',
      originalPositiveH:'8002*T<log C implies h>C^-1. No old display ell is used.'}};
}

/** Alpha-renamed copies of the original outer schedule are compared without
 * evaluating their integrals or replacing unmatched function operands. */
export function physicalTargetOuterScaleBindingAudit(G,outer,schedule=physicalTargetEndpointScheduleAudit(G)){
  if(!outer?.roots||!schedule?.endpoint||!Array.isArray(outer.sourceKernels))
    fail('INVALID_INPUT','Use the complete retained outer source factor and endpoint schedule.');
  const endpoint=schedule.endpoint,expected={Xb:G.mul(G.parameter('XR'),G.exp(endpoint.end)),
    EpowB:G.mul(G.parameter('Pstar'),G.exp(endpoint.logAEnd)),rho:G.mul(G.parameter('co'),G.parameter('h'))},
    checks=Object.entries(expected).map(([name,root])=>({name,actual:outer.roots[name],expected:root,
      ...ellOneSourceScalarIdentity(G,outer.roots[name],root)})),
    kernels=outer.sourceKernels.filter(r=>['outer_viscous_stress','outer_inviscid_stress'].includes(r.name));
  return {schema:'MathScope.PhysicalTargetOuterScaleBindingAudit/1',checks,kernels,expected,
    pass:schedule.pass&&checks.every(r=>r.pass)&&kernels.length===2&&kernels.every(r=>r.m===-3&&G.nodes[r.root]),
    sourceAuthenticated:false,unmatchedAnalyticOperandsIdentified:false};
}

function bindSource(p,G){
  const {band}=p,c=band.constants,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),profile=G.source.parametersExactExpressions,
    schedule=physicalTargetEndpointScheduleAudit(G),outerScaleBinding=physicalTargetOuterScaleBindingAudit(G,p.support.outer,schedule),endpoint=schedule.endpoint,Xsharp=p.point.inverse.profile.X,Tsharp=p.point.inverse.slow.T,
    Xb=G.mul(G.parameter('XR'),G.exp(endpoint.end)),EpowB=G.mul(G.parameter('Pstar'),G.exp(endpoint.logAEnd)),
    delta=G.log(G.div(Xb,Xsharp)),r=G.sqrt(G.mul(q(2),Xsharp)),z=G.div(q(2),Xsharp),slow=power(Tsharp,G.neg(G.add(c.A,q(1,2)))),
    flat=G.exp(G.neg(G.div(q(4),G.pow(delta,2)))),Kstar=G.mul(EpowB,G.exp(G.mul(c.A,delta))),
    Ac=p.midplane.roots.Ac,tau=p.midplane.roots.tau,prefactor=G.div(G.mul(schedule.rho,Kstar,r,slow,flat),G.mul(q(4),Ac)),
    factorCoordinates=p.support.coordinates,outerTheta=G.simultaneousSubstitute(p.support.outer.roots.outerTheta,[factorCoordinates.delta,factorCoordinates.factorEta],[delta,G.zero]),
    sourceOuterTau=G.div(G.mul(slow,flat,outerTheta),G.mul(G.pow(delta,3),Ac)),
    sourceKernels=p.support.outer.sourceKernels.filter(r=>['outer_viscous_stress','outer_inviscid_stress'].includes(r.name)),
    normalizedActualTau=G.div(tau,prefactor),requiredCheck=(rows,id)=>rows.some(r=>r.id===id&&r.pass),audit=terminalTargetPerturbationAudit(),checks=[
      {id:'same-live-private-original-physical-center',pass:assertActualCommonPhysicalCenterEnclosure(p)&&p.scope.sameCommonAdmissibleFamily&&p.scope.actualOriginalInverseTorusMapBound&&p.scope.actualFullPhysicalCurlValueScaledEnclosure},
      {id:'literal-original-twelve-endpoint-source-formulas',pass:schedule.pass&&same(profile.BOuter,{product:[{integer:1000},{ref:'T'}]})&&same(profile.Tf,{integer:128})&&same(profile.co,{rational:'1/256'})},
      {id:'original-positive-profile-and-new-terminal-neighborhood',pass:p.sourceBounds.contract.positive&&p.sourceBounds.contract.upperBoundExact==='2^-4096'&&p.point.pass&&p.sourceBounds.audit.power===16384&&p.sourceBounds.audit.bits===16384&&p.sourceBounds.audit.pass},
      {id:'same-completed-source-and-full-heat-after-all-moments',pass:p.support.pass&&p.midplane.pass&&requiredCheck(p.midplane.checks,'same-completed-and-leading-source-on-the-new-open-exterior')&&requiredCheck(p.support.checks,'actual-terminal-positive-target-and-axial-factor')},
      {id:'actual-new-Rayleigh-and-full-target-scales',pass:tau===G.neg(G.div(G.add(...p.midplane.roots.N.map((x,j)=>G.mul(x,p.midplane.roots.target[j]))),Ac))&&p.roots.scales.tau===tau&&p.roots.scales.Ac===Ac&&p.midplane.c0Check.pass&&p.midplane.lambdaCheck.pass&&p.midplane.roots.actualEta===G.zero},
      {id:'original-backward-target-keeps-both-quarter-Laplace-kernels',pass:outerScaleBinding.pass&&sourceKernels.length===2&&sourceKernels.every(r=>r.m===-3&&G.nodes[r.root])&&p.support.outer.sourceEquationList.includes('A.54')&&p.support.outer.originalParameterExpressionSHA256===p.sourceBinding.parameterExpressionSHA256},
      {id:'all-refined-new-point-roots-have-no-free-coordinates',pass:[Xb,EpowB,delta,r,z,slow,flat,Kstar,prefactor,outerTheta,sourceOuterTau,normalizedActualTau].every(x=>G.freeCoordinates(x).size===0)},
      {id:'actual-positive-perturbation-inequalities-match-the-kernel',pass:audit.pass&&c.h===G.parameter('h')&&c.Renv===G.parameter('C12EnvelopeR')&&c.u===G.div(q(2),c.kappa)}
    ];
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The new physical target source binding failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return {checks,schedule,outerScaleBinding,roots:{X:Xsharp,T:Tsharp,r,z,delta,Xb,EpowB,rho:schedule.rho,Kstar,slow,flat,Ac,tau,g:p.roots.scales.g,
      F:p.midplane.roots.F,gamma:p.midplane.roots.gamma,prefactor,normalizedActualTau,sourceOuterTheta:outerTheta,sourceOuterTau},
    sourceKernels,perturbationAudit:audit,pass:true,
    sourceTargetIdentity:{kind:'SOURCE_BOUND_ORIGINAL_A54_AND_RESTORED_MOMENT_ANALYTIC_IDENTITY',actualTargetTau:tau,outerFactorTau:sourceOuterTau,
      proof:'The private physical-center proof binds the SAME complete original moments and the original backward A.54 factor on the proved open terminal neighborhood. The actual eta=0 makes profile L=1; all positive common corrections are zero after their actual endpoints. Thus the retained full target tau equals the newly evaluated outer factor. This is an analytic source identity, not a claim that two unsimplified AST nodes are literally equal.',
      unspecifiedEqualityOracleUsed:false,fullTargetNodeReplaced:false},
    scaleBounds:{Ac:['Renv^9','Renv^11'],tau:['Renv^-12','Renv^-8'],g:['Renv^-12','Renv^-8'],F:['C^-8','C^-5'],gamma:['sqrt(h/2)','sqrt(h)'],
      X:['C^10','C^11'],r:['C^5','C^6'],EpowB:['C^-1','C'],
      proof:'At the new point3/16<delta<5/16,15/16<T<17/16,X>XR andX<Xb<C^11. Original f and Gamma heat lie between1/2 and1. The source formula alpha=h-f_y/f+z*Hprime/H gives h/2<alpha<h using0<=sigmaPrime<=9 and the retained heat moment bounds. Hence gamma lies between sqrt(h/2) and sqrt(h). With u=2Renv^10,h>C^-1,Renv>C^100, one obtains Renv^9<Ac<Renv^11. The directed coefficient in(7,8), the displayed exact target prefactor, C^-1<EpowB<Pstar<C, rho=h/256>C^-2, exp(-4/delta^2)>C^-1 and1/2<slow<2 give Renv^-12<tau<Renv^-8. For the full source F=slow*EpowB*exp(A delta)*f*H/r, the LOWER estimate uses EpowB>C^-1,r<C^6 and slow*f*H>1/8>C^-1. The UPPER estimate uses EpowB<Pstar and the actual XR=110*(C*Pstar)^10, so r>sqrt(220)*C^5*Pstar^5 and F<4/(sqrt(220)*C^5*Pstar^4)<C^-5. Thus C^-8<F<C^-5. Substituting lambda0=2F gamma in g=3lambda0*u^2/(1+u^2)^(3/2) gives Renv^-12<g<Renv^-8.'}};
}

export async function attachActualPhysicalCenterTargetEnclosure(p,input={},context={}){
  assertActualCommonPhysicalCenterEnclosure(p);const request=controlsOf(input),G=p.G,source=bindSource(p,G),
    coefficient=encloseTerminalTargetRegularCoefficient({precisionBits:request.precisionBits,tolerance:request.coefficientTolerance,maxCells:request.maxCells},context),
    profile=await encloseActualPositiveProfileLogs({sourceProfile:p.sourceBinding.sourceProfile,precisionBits:request.precisionBits,logCoordinateTolerance:request.logCoordinateTolerance}),
    A=directedArithmetic(request.precisionBits),tiny=A.point(Q(1,1n<<4096n)),rows=[],lookup=name=>profile.rows.find(r=>r.name===name),
    add=(name,sourceRoot,base,height,small,sourceInequality)=>{
      const b=A.unpack(base.logCoordinateInterval),upper=A.add(b,tiny)[1],box=[b[0],upper],width=Q(upper-b[0],A.S);
      if(qcompare(width,readRational(request.logCoordinateTolerance))>0)fail('PRECISION_REQUIRED','The '+name+' numerical logarithm coordinate exceeds its required width.');
      const packed=A.pack(box),interval=numericalExponentialInterval({height,small,coordinate:{lower:packed.lower,upper:packed.upper}});
      rows.push({name,sourceRoot,sourceInequality,interval,logCoordinateInterval:packed,logCoordinateWidth:qtext(width),toleranceMet:true,
        endpointContainsOnlyNumericalConstants:numericalEndpointIsClosed(interval.lower)&&numericalEndpointIsClosed(interval.upper)});
    };
  assertActualPositiveProfileLogs(profile);
  if(qcompare(readRational(coefficient.actualCoefficientIfSourcePremisesBound.lower),Q(7))<=0||
    qcompare(readRational(coefficient.actualCoefficientIfSourcePremisesBound.upper),Q(8))>=0)
    fail('PRECISION_REQUIRED','The actual target coefficient must lie strictly between7 and8 before the source scale inequalities are emitted.');
  add('Ac',source.roots.Ac,lookup('C12EnvelopeR'),4,false,source.scaleBounds.Ac);
  add('tau',source.roots.tau,lookup('C12EnvelopeR'),4,true,source.scaleBounds.tau);
  add('g',source.roots.g,lookup('C12EnvelopeR'),4,true,source.scaleBounds.g);
  add('F',source.roots.F,lookup('CSelected'),3,true,source.scaleBounds.F);
  add('profileX',source.roots.X,lookup('CSelected'),3,false,source.scaleBounds.X);
  add('profileRadius',source.roots.r,lookup('CSelected'),3,false,source.scaleBounds.r);
  const gammaBase=A.add(A.point(1048576),A.logRational(Q(4001))),gammaCoordinate=A.pack([gammaBase[0],A.add(gammaBase,tiny)[1]]);
  add('gamma',source.roots.gamma,{logCoordinateInterval:gammaCoordinate},2,true,source.scaleBounds.gamma);
  const proof={normalization:source.perturbationAudit.exactNormalization,actualCoefficient:source.perturbationAudit.coefficient,
    coefficientEvaluation:'The regular coefficient is evaluated by outward midpoint Taylor degree11 with interval order12, a positive infinite Laplace tail, and a strictly positive2^-2400 radius for the actual new point, original h, full heat, viscous term and boundary term.',
    numericalScales:'The source inequalities bound Ac/tau/g between fixed positive powers of Renv, and F/X/r between fixed powers of C. For1<=a<=12, passing from Renv to Renv^a or Renv^-a changes the named fourth-level log coordinate by less2^-4096; the analogous third-level C bound holds. All final exp endpoint leaves are numerical rationals, not original source roots. Gamma uses -log(sqrt h)=4001*T and the factor1/sqrt2 changes its logarithm coordinate by the same conservative reserve.',
    powerReserve:'Write L1=log Renv=C^25600000, L2=log L1, L3=log L2. The power transformation changes log L3 by less log12/(L2*L3)<2^-4096. For C set K2=log(log C); log^3(C^a)-log^3(C)=log(1+log(a)/K2)<log12/K2<2^-4096. The small negative powers use the same named log(-log) coordinates. Exact positive source comparisons supply these lower bounds.',
    precision:'The guaranteed width is in each explicitly stated iterated-logarithm coordinate. Original-value relative accuracy is not claimed. The regular target coefficient separately has an ordinary absolute rational interval width.',
    remaining:'Actual ell/Q/epsilon/palette ci/Ls/J and their dependent absolute H/y scales remain outside this refinement. Their generic norm tower may exceed a fixed Renv power and is not guessed.'},
    scope={sameActualPhysicalCenter:true,actualTargetRegularCoefficientNumericallyEnclosed:true,actualPositiveAcTauGFGammaNumericalEndpoints:true,
      endpointLeavesAreNumericalConstants:true,positiveLowerEndpointsRetained:true,iteratedLogCoordinateWidthsChecked:true,originalValueRelativeAccuracy:false,
      actualBandEllNumericallyEnclosed:false,actualPaletteCiLsNumericallyEnclosed:false,wholeAbsoluteHAndWeightsNumericallyEnclosed:false,
      actualPhysicalCurlDerivativesNumericallyEnclosed:false,allSourceLabelsCovered:false,wholeGNUMComplete:false,M3Started:false},
    checks=[...source.checks,{id:'directed-regular-coefficient-and-positive-actual-remainders',pass:coefficient.pass&&coefficient.errorBudget.toleranceMet&&
      qcompare(readRational(coefficient.actualCoefficientIfSourcePremisesBound.lower),Q(7))>0&&qcompare(readRational(coefficient.actualCoefficientIfSourcePremisesBound.upper),Q(8))<0},
      {id:'original-profile-numerical-endpoints-and-every-source-scale-root',pass:profile.pass&&rows.length===7&&rows.every(r=>r.endpointContainsOnlyNumericalConstants&&r.toleranceMet&&G.freeCoordinates(r.sourceRoot).size===0)}],
    numerics={coefficient,profile,rows},sourceBinding={sourceProfile:p.sourceBinding.sourceProfile,parameterExpressionSHA256:p.sourceBinding.parameterExpressionSHA256,
      producer:'The unchanged private same-common-family physical center plus its original twelve-stage endpoint and full backward target source.',oldPointNumericalValueTransplanted:false,
      originalTargetTau:p.midplane.roots.tau,originalBand:p.band.geometry.ell},result={p,G,request,sourceBinding,source,numerics,checks,scope,proof};
  assertActualCommonPhysicalCenterEnclosure(p);seals.set(result,{p,G,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:data(result)});
  context.onProgress?.({stage:'actual-physical-center-target-and-positive-scale-numerics-sealed',nodeCount:G.nodes.length});return result;
}
export async function prepareActualPhysicalCenterTargetEnclosure(input={},context={}){
  const request=controlsOf(input),p=prepareActualCommonPhysicalCenterEnclosure({precisionBits:request.precisionBits,tolerance:request.coefficientTolerance},context);
  return attachActualPhysicalCenterTargetEnclosure(p,request,context);
}
export function assertActualPhysicalCenterTargetEnclosure(result){
  const s=seals.get(result);if(!s||result.p!==s.p||result.G!==s.G||data(result)!==s.data||canonicalStringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private new-point target refinement. A copied receipt or changed scale is not authenticated.');
  assertActualCommonPhysicalCenterEnclosure(s.p);return true;
}
export async function actualPhysicalCenterTargetEnclosureCertificate(result){
  assertActualPhysicalCenterTargetEnclosure(result);const s=seals.get(result),parent=await actualCommonPhysicalCenterEnclosureCertificate(result.p),program=canonicalStringify({nodes:s.G.nodes.slice(0,s.count),...JSON.parse(s.data)});
  return {schema:'MathScope.ActualPhysicalCenterTargetEnclosureCertificate/1',...JSON.parse(s.data),
    graph:{sha256:await sha256(program),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(program).length,fixedCompilerPrefix:true},actualPhysicalParentGraph:parent.graph,pass:true};
}
