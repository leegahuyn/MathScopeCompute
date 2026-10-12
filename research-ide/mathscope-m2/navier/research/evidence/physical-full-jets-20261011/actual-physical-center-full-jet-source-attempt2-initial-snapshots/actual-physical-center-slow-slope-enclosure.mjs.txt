/** Source-bound comparison slopes at the newly constructed physical point.
 * This additive adapter keeps the original complete heat, positive h and
 * implicit chart. It transfers only smooth comparison coefficients. Actual
 * Volterra/weight/curl jet errors require the separate new-point adapter.
 */
import {assertActualCommonPhysicalCenterEnclosure,prepareActualCommonPhysicalCenterEnclosure,actualCommonPhysicalCenterEnclosureCertificate} from './actual-common-physical-center-enclosure.mjs';
import {assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {terminalFieldSlowJetIdentityAudit} from './actual-terminal-field-scaled-enclosure.mjs';
import {physicalCenterSlowSlopeNeighborhoodAudit,physicalCenterSlowSlopeIdentityAudit,enclosePhysicalCenterSlowSlopes} from './actual-physical-center-slow-slope-kernel.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {ellOneSourceScalarIdentity} from './actual-covariance-ell-one-obstruction.mjs';
import {sourceExponentContract,assertSourceProfile} from './source-profile.mjs';
import {directedArithmetic,rational as Q,readRational,qcompare,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  data=r=>canonicalStringify({request:r.request,sourceBinding:r.sourceBinding,source:r.source,roots:r.roots,numerics:r.numerics,
    neighborhood:r.neighborhood,checks:r.checks,proof:r.proof,scope:r.scope});
function controlsOf(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance'].includes(k)))
    fail('INVALID_INPUT','Only directed precision and an exact tolerance are inputs; use the private actual physical point.');
  const request={precisionBits:input.precisionBits??192,tolerance:input.tolerance??'1/1000000000000'};
  directedArithmetic(request.precisionBits);
  if(typeof request.tolerance!=='string'||qcompare(readRational(request.tolerance),Q(0))<=0)fail('INVALID_INPUT','Use a strictly positive exact rational tolerance.');
  return request;
}

/** The three derivative integrands and the original terminal step are
 * differentiated, not specified by a derivative oracle. delta and z are
 * temporarily independent; along the actual terminal profile the exact
 * derivative is d_delta+z*d_z since z=2exp(delta)/Xb.
 */
export function physicalCenterFactoredHeatSlopeBodies(G,{h,gamma,density,variable,u}){
  for(const x of[h,gamma,density,variable,u])if(!Number.isSafeInteger(x)||!G.nodes[x])fail('INVALID_INPUT','The retained original heat operands are required.');
  if(G.nodes[variable].op!=='coordinate')fail('INVALID_INPUT','The original compactified integral variable is required.');
  const q=(n,d=1)=>G.q(n,d),delta=G.fresh('new_physical_slope_delta'),z=G.fresh('new_physical_slope_heat_argument'),T=G.fresh('new_physical_slope_T'),
    den=G.add(G.one,G.mul(z,u)),power=G.exp(G.neg(G.mul(h,G.log(den)))),body=G.mul(density,power),
    momentBodies=[0,1,2,3].map(j=>G.div(G.mul(body,G.pow(u,j)),G.pow(den,j))),
    moments=momentBodies.map(x=>G.div(G.integral(x,variable,G.zero,G.one),gamma)),H=moments[0],
    heatDeltaOverH=[
      G.neg(G.mul(z,moments[1])),
      G.add(G.neg(G.mul(z,moments[1])),G.mul(G.pow(z,2),G.add(G.one,h),moments[2])),
      G.add(G.neg(G.mul(z,moments[1])),G.mul(q(3),G.pow(z,2),G.add(G.one,h),moments[2]),
        G.neg(G.mul(G.pow(z,3),G.add(G.one,h),G.add(q(2),h),moments[3])))],
    heatIntegrandDeltaOverH=[
      G.neg(G.mul(z,momentBodies[1])),
      G.add(G.neg(G.mul(z,momentBodies[1])),G.mul(G.pow(z,2),G.add(G.one,h),momentBodies[2])),
      G.add(G.neg(G.mul(z,momentBodies[1])),G.mul(q(3),G.pow(z,2),G.add(G.one,h),momentBodies[2]),
        G.neg(G.mul(G.pow(z,3),G.add(G.one,h),G.add(q(2),h),momentBodies[3])))],
    stepArgument=G.div(delta,q(2)),f=G.sub(G.one,G.mul(G.div(h,q(256)),G.step(stepArgument))),
    fDeltaOverH=[1,2,3].map(j=>G.neg(G.div(G.step(stepArgument,j),q(256n*(2n**BigInt(j)))))),
    D=x=>G.add(G.derivative(x,delta),G.mul(z,G.derivative(x,z))),checks=[];
  let actualHeat=body,actualStep=f;
  for(let j=0;j<3;j++){
    actualHeat=D(actualHeat);actualStep=D(actualStep);
    const heatCheck=sourceGraphRationalIdentity(G,G.sub(actualHeat,G.mul(h,heatIntegrandDeltaOverH[j])),{atomicNodes:[density,power],maxTerms:20000}),
      stepCheck=sourceGraphRationalIdentity(G,G.sub(actualStep,G.mul(h,fDeltaOverH[j])),{maxTerms:4000});
    checks.push({id:'complete-Gamma-integrand-delta-order-'+(j+1),actual:actualHeat,expected:G.mul(h,heatIntegrandDeltaOverH[j]),...heatCheck},
      {id:'original-terminal-step-delta-order-'+(j+1),actual:actualStep,expected:G.mul(h,fDeltaOverH[j]),...stepCheck});
  }
  const firstRatio=(a,a1,a2)=>G.sub(G.div(a2,a),G.div(G.mul(h,G.pow(a1,2)),G.pow(a,2))),
    secondRatio=(a,a1,a2,a3)=>G.add(G.div(a3,a),G.neg(G.div(G.mul(q(3),h,a1,a2),G.pow(a,2))),G.div(G.mul(q(2),G.pow(h,2),G.pow(a1,3)),G.pow(a,3))),
    Abar=G.add(G.one,G.div(fDeltaOverH[0],f),G.div(heatDeltaOverH[0],H)),
    AbarDelta=G.add(firstRatio(f,...fDeltaOverH),firstRatio(H,...heatDeltaOverH)),
    AbarDeltaDelta=G.add(secondRatio(f,...fDeltaOverH),secondRatio(H,...heatDeltaOverH)),xi=G.div(AbarDelta,Abar);
  if(checks.some(x=>!x.pass))fail('INTERNAL_VALIDATION','A complete heat or terminal-step differentiated integrand failed.');
  return {schema:'MathScope.PhysicalCenterFactoredHeatSlopeBodies/1',coordinates:{delta,z,T},roots:{h,gamma,density,variable,u,
    den,power,body,momentBodies,moments,H,f,stepArgument,fDeltaOverH,heatDeltaOverH,heatIntegrandDeltaOverH,Abar,AbarDelta,AbarDeltaDelta,xi},
    checks,pass:true,sourceAuthenticated:false,
    interpretation:'heatDeltaOverH and fDeltaOverH mean division by the strictly positive exponent h, not division by the heat function H. The complete normalized moments have all compactified endpoints0..1. Original-value h is never replaced by a numerical zero.',
    derivativeRule:'d/delta=partial_delta+z*partial_z at fixed Xb, with z=2exp(delta)/Xb. Linearity and Gamma domination transfer the checked integrand identities through the full improper integral.'};
}

/** Rational quotient differentiation underlying the h-factored bounds. */
export function physicalCenterFactoredRatioIdentityAudit(G){
  const q=(n,d=1)=>G.q(n,d),x=G.fresh('positive_ratio_delta'),h=G.fresh('positive_ratio_h'),
    f=G.fresh('positive_ratio_f'),a=[1,2,3].map(j=>G.fresh('positive_ratio_u'+j)),
    local=G.add(f,G.mul(h,a[0],x),G.mul(q(1,2),h,a[1],G.pow(x,2)),G.mul(q(1,6),h,a[2],G.pow(x,3))),
    ratio=G.div(G.derivative(local,x),G.mul(h,local)),
    first=G.sub(G.div(a[1],f),G.div(G.mul(h,G.pow(a[0],2)),G.pow(f,2))),
    second=G.add(G.div(a[2],f),G.neg(G.div(G.mul(q(3),h,a[0],a[1]),G.pow(f,2))),G.div(G.mul(q(2),G.pow(h,2),G.pow(a[0],3)),G.pow(f,3))),
    actualFirst=G.substitute(G.derivative(ratio,x),x,G.zero),actualSecond=G.substitute(G.derivative(G.derivative(ratio,x),x),x,G.zero),
    checks=[{id:'first-h-factored-logarithmic-derivative',...sourceGraphRationalIdentity(G,G.sub(actualFirst,first),{maxTerms:6000})},
      {id:'second-h-factored-logarithmic-derivative',...sourceGraphRationalIdentity(G,G.sub(actualSecond,second),{maxTerms:6000})}],
    omitted=sourceGraphRationalIdentity(G,G.sub(actualSecond,G.sub(second,G.neg(G.div(G.mul(q(3),h,a[0],a[1]),G.pow(f,2))))),{maxTerms:6000});
  if(checks.some(c=>!c.pass)||omitted.pass)fail('INTERNAL_VALIDATION','The positive h-factored quotient recurrence failed.');
  return {schema:'MathScope.PhysicalCenterFactoredRatioIdentityAudit/1',roots:{x,h,f,a,local,ratio,first,second},checks,
    negativeControl:{omitted:'The complete coefficient3 product in the second ratio derivative',correctlyRejected:!omitted.pass},pass:true,sourceAuthenticated:false};
}

function bindOriginalSource(p,G){
  const band=p.band,full=band.family.prepared.bootstrap.actualHeat;assertActualHeatLeading(full);
  const heat=full.heat,boot=band.family.prepared.bootstrap,{X,eta}=boot.constants,c=band.constants,
    {R,Z,T}=band.coordinates,q=(n,d=1)=>G.q(n,d),profile=assertSourceProfile(p.sourceBinding.sourceProfile),contract=sourceExponentContract(),
    h=c.h,rho=G.mul(G.parameter('co'),h),parameters=['R','Z','T','Xrep','etaRep','sRep'].map(k=>band.coordinates[k]),
    newR=p.point.inverse.slow.R,newT=p.point.inverse.slow.T,newX=p.point.inverse.profile.X,values=[newR,G.zero,newT,newX,G.zero,newT],
    at=x=>G.simultaneousSubstitute(x,parameters,values),Xb=heat.Xb,delta=G.log(G.div(Xb,newX)),newZ=G.div(q(2),newX),
    loss=G.nodes[heat.heatLoss],integralId=loss?.op==='multiply'?loss.args.find(id=>G.nodes[id]?.op==='definite_integral'):undefined;
  if(integralId===undefined)fail('INVALID_SOURCE_CONSTRUCTION','The original complete heat-loss integral is required.');
  const integral=G.nodes[integralId],variable=integral.args[1],om=G.sub(G.one,variable),u=G.div(variable,om),
    density=G.mul(G.exp(G.add(G.neg(u),G.mul(h,G.log(u)))),G.pow(om,-2)),gamma=heat.gamma,
    sourceArgument=G.div(G.mul(q(2),G.sub(G.one,G.pow(eta,2))),X),sourcePower=G.exp(G.neg(G.mul(h,G.log(G.add(G.one,G.mul(sourceArgument,u)))))),
    sourceBody=G.mul(density,sourcePower),lossBody=G.mul(density,G.sub(G.one,sourcePower)),
    partition=sourceGraphRationalIdentity(G,G.sub(density,G.add(sourceBody,lossBody)),{atomicNodes:[density,sourcePower],maxTerms:5000}),
    y=G.log(G.div(X,heat.Xtail)),fo=G.sub(G.one,G.mul(rho,G.sub(G.one,G.step(G.div(G.sub(y,G.one),q(2)))))),
    Ecl=G.mul(heat.Etail,G.exp(G.neg(G.mul(G.core.A,y))),G.div(fo,G.sub(G.one,rho))),
    chart=band.chart,s=chart.s,chartSystem=G.monotoneSystems[chart.system],sv=chartSystem.variable,
    pow=(x,a)=>G.exp(G.mul(a,G.log(x))),chartEquation=G.sub(G.sub(sv,G.mul(G.pow(Z,2),pow(sv,G.mul(q(2),h)))),T),
    globalF=band.family.prepared.records[0].global.F,globalDefinition=G.expressionSystems[G.nodes[globalF].args[0]],
    leadingBody=G.expressionSystems[G.nodes[band.leadingFields.F].args[0]].body,
    originalScale=pow(s,G.neg(G.add(c.A,q(1,2)))),expectedLeading=G.mul(originalScale,G.simultaneousSubstitute(globalF,[X,eta],[chart.X,chart.eta])),
    stage=G.outer.stages.at(-1),expectedXtail=G.mul(G.parameter('XR'),G.exp(stage.start)),expectedXb=G.mul(G.parameter('XR'),G.exp(stage.end)),
    endpointChecks=[{id:'same-original-terminal-start',...ellOneSourceScalarIdentity(G,heat.Xtail,expectedXtail)},
      {id:'same-original-terminal-end',...ellOneSourceScalarIdentity(G,Xb,expectedXb)},
      {id:'same-original-terminal-length-three',...sourceGraphRationalIdentity(G,G.sub(G.sub(stage.end,stage.start),q(3)),{maxTerms:10000})}],
    local=physicalCenterFactoredHeatSlopeBodies(G,{h,gamma,density,variable,u}),localValues=[delta,newZ,newT],localParameters=[local.coordinates.delta,local.coordinates.z,local.coordinates.T],
    localAt=x=>G.simultaneousSubstitute(x,localParameters,localValues),ratioAudit=physicalCenterFactoredRatioIdentityAudit(G),slopeAudit=physicalCenterSlowSlopeIdentityAudit(G),
    localAlpha=G.mul(h,local.roots.Abar),localAlphaT=G.div(G.mul(h,local.roots.AbarDelta),local.coordinates.T),
    slopeParameters=['h','alpha','xi','u','T'].map(k=>slopeAudit.coordinates[k]),slopeValues=[h,localAlpha,local.roots.xi,c.u,local.coordinates.T],
    localMu=Object.fromEntries(['R','Z','T'].map(k=>[k,G.simultaneousSubstitute(slopeAudit.roots.mu[k],slopeParameters,slopeValues)])),
    localNu=Object.fromEntries(['R','Z','T'].map(k=>[k,G.simultaneousSubstitute(slopeAudit.roots.nu[k],slopeParameters,slopeValues)])),
    Fbody=band.fields.F,FRbody=G.derivative(Fbody,R),alphaBody=G.sub(G.neg(G.div(G.mul(R,FRbody),G.mul(q(2),Fbody))),G.one),
    D={R:x=>G.mul(newR,G.derivative(x,R)),Z:x=>G.derivative(x,Z),T:x=>G.derivative(x,T)},
    sourceC=Object.fromEntries(['R','Z','T'].map(k=>[k,at(G.add(G.div(D[k](Fbody),Fbody),G.div(D[k](alphaBody),G.mul(q(2),alphaBody))))])),
    sourceD=Object.fromEntries(['R','Z','T'].map(k=>[k,at(G.div(D[k](FRbody),FRbody))])),
    kappa=G.div(G.add(G.one,G.pow(c.u,-2)),q(3)),IA=G.div(G.log(q(2)),q(3)),IB=G.sub(IA,q(7,72)),
    actualMu=Object.fromEntries(['R','Z','T'].map(k=>[k,G.sub(G.mul(kappa,sourceC[k]),G.div(sourceD[k],q(2)))])),
    actualNu=Object.fromEntries(['R','Z','T'].map(k=>[k,G.sub(G.mul(IA,sourceC[k]),G.mul(IB,sourceD[k]))])),
    actualAlpha=at(alphaBody),actualAlphaT=at(G.derivative(alphaBody,T)),fieldAudit=terminalFieldSlowJetIdentityAudit(G),
    literals={co:{rational:'1/256'},XR:{product:[{integer:110},{power:[{product:[{ref:'CSelected'},{ref:'Pstar'}]},10]}]},
      directionalMarginKappa:{power:[{ref:'C12EnvelopeR'},-10]}},
    originalNewArgument=G.simultaneousSubstitute(heat.heatArgument,[X,eta],[newX,G.zero]),
    roots={mu:actualMu,nu:actualNu,formulaMu:Object.fromEntries(Object.entries(localMu).map(([k,v])=>[k,localAt(v)])),
      formulaNu:Object.fromEntries(Object.entries(localNu).map(([k,v])=>[k,localAt(v)])),actualAlpha,actualAlphaT,actualRayleighAlpha:p.midplane.roots.alpha,
      h,Xb,newR,newT,newX,delta,newHeatArgument:newZ,originalNewArgument,originalF:p.midplane.roots.F,originalFR:p.midplane.roots.FR,
      alphaBody,originalFBody:Fbody,originalFRBody:FRbody,sourceC,sourceD,normalizedAlpha:localAt(local.roots.Abar),
      normalizedAlphaDelta:localAt(local.roots.AbarDelta),normalizedAlphaDeltaDelta:localAt(local.roots.AbarDeltaDelta),
      xi:localAt(local.roots.xi),factoredAlpha:localAt(localAlpha),factoredAlphaT:localAt(localAlphaT),
      f:localAt(local.roots.f),H:localAt(local.roots.H),moments:local.roots.moments.map(localAt),
      originalCompleteHeatLoss:heat.heatLoss,originalGamma:gamma,originalTerminalFo:fo,originalLeadingBody:leadingBody,originalSlowScale:originalScale},
    needed=id=>p.midplane.checks.some(r=>r.id===id&&r.pass),checks=[
      {id:'same-private-new-physical-point-and-original-source-profile',pass:assertActualCommonPhysicalCenterEnclosure(p)&&same(G.source.parametersExactExpressions,profile.parametersExactExpressions)&&
        p.scope.sameCommonAdmissibleFamily&&p.scope.actualOriginalInverseTorusMapBound&&p.point.pass},
      {id:'literal-positive-h-and-terminal-normalization',pass:contract.positive&&contract.notNumericallyReplaced&&contract.upperBoundExact==='2^-4096'&&h===G.parameter('h')&&
        Object.entries(literals).every(([key,v])=>same(profile.parametersExactExpressions[key],v))&&c.u===G.div(q(2),c.kappa)},
      {id:'original-improper-heat-loss-density-gamma-and-endpoints',pass:ellOneSourceScalarIdentity(G,integral.args[0],lossBody).pass&&integral.args[2]===G.zero&&integral.args[3]===G.one&&
        heat.heatLoss===G.div(integralId,gamma)&&ellOneSourceScalarIdentity(G,gamma,G.integral(density,variable,G.zero,G.one)).pass&&partition.pass},
      {id:'same-original-full-heat-and-terminal-step',pass:heat.heatArgument===sourceArgument&&heat.Ecl===Ecl&&heat.heatCutoff===G.step(G.div(G.sub(y,q(1,5)),q(3,10)))&&
        p.midplane.roots.originalFo===fo&&p.midplane.roots.originalEcl===Ecl&&originalNewArgument===newZ},
      {id:'same-source-terminal-length-and-positive-logarithms',pass:stage.id==='terminal'&&stage.length===q(3)&&endpointChecks.every(r=>r.pass)},
      {id:'complete-leading-body-and-original-slow-prefactor',pass:globalDefinition.body===heat.finalF&&ellOneSourceScalarIdentity(G,leadingBody,expectedLeading).pass&&
        sourceGraphRationalIdentity(G,G.add(c.A,q(1,2),heat.exteriorExponent)).pass&&sourceGraphRationalIdentity(G,G.add(heat.exteriorExponent,G.one,h)).pass},
      {id:'original-implicit-chart-and-positive-bracket',pass:chartSystem.body===chartEquation&&chart.X===G.div(G.pow(R,2),G.mul(q(2),s))&&chart.eta===G.div(Z,pow(s,G.sub(q(1,2),h)))&&
        chartSystem.left===q(1,2)&&chartSystem.right===q(2)&&needed('original-chart-at-new-T-is-exactly-s-minus-T')},
      {id:'full-completed-source-equals-leading-on-this-open-neighborhood',pass:p.support.pass&&p.midplane.pass&&needed('same-completed-and-leading-source-on-the-new-open-exterior')&&
        p.midplane.lambdaCheck.pass&&p.midplane.c0Check.pass&&p.point.inverse.slow.Z===G.zero},
      {id:'same-actual-anchor-and-exact-small-point-displacement',pass:p.point.anchor.X===G.mul(Xb,G.exp(q(-1,4)))&&same(p.point.anchor.slow,[G.sqrt(G.mul(q(2),p.point.anchor.X)),G.zero,G.one])&&
        p.sourceBounds.audit.pass&&p.sourceBounds.audit.power===16384&&p.sourceBounds.audit.bits===16384&&p.sourceBounds.contract.positive},
      {id:'complete-third-heat-integrands-and-positive-ratio-derivatives',pass:local.pass&&local.checks.length===6&&ratioAudit.pass&&fieldAudit.pass&&slopeAudit.pass},
      {id:'all-enclosed-comparison-roots-evaluate-at-the-new-six-coordinate-point',pass:[...Object.values(actualMu),...Object.values(actualNu),actualAlpha,actualAlphaT,
        ...Object.values(roots.formulaMu),...Object.values(roots.formulaNu),roots.f,roots.H,roots.xi,newR,newT,newX,delta].every(x=>G.freeCoordinates(x).size===0)}
    ];
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual new-point slow-slope source binding failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return {roots,checks,parameters,values,local,ratioAudit,slopeAudit,fieldAudit,endpointChecks,partition,pass:true,
    sourceEqualities:{completeHeat:'The checked full loss integrand plus full heat integrand equals the original Gamma density, so H=1-originalHeatLoss on the entire compactified improper interval. The new profile argument is exactly2/Xsharp.',
      terminal:'Original Xtail=XR*exp(start), Xb=XR*exp(end), end-start=3 and Xsharp>0 give y=log(Xsharp/Xtail)=3-delta. The actual square-seed step obeys sigma(1-x)=1-sigma(x), so original fo equals1-h*sigma(delta/2)/256; the original body itself is retained.',
      field:'On the authenticated open terminal neighborhood every completed positive-order term and its finite derivatives vanish. Retaining the original slow multiplier s^(-A-1/2) and using the positive real power law gives F=exteriorAmplitude*(R^2/2)^(-1-h)*f(delta)*H(4T/R^2). AtZ=0,s=T, delta=log(Xb*2T/R^2), so delta_T=1/T,R*delta_R=-2.',
      rayleigh:'The private original frame gives N=(-1,0),gabs=-R*FR,lambda0^2=2F*(gabs-2F),gamma=-c0=lambda0/(2F)>0. Hence actualRayleighAlpha equals actualAlpha=-R*FR/(2F)-1=h*Abar. Original alpha_T equals(h/T)*Abar_delta; both exact derivative and factored bodies are retained.',
      slopes:'For frozen D_R=Rsharp*partial_R andD_T=partial_T, c_i=D_iF/F+D_ialpha/(2alpha),d_i=D_iFR/FR. The full damping identity gives mu_i=kappa*c_i-d_i/2. Define the transport comparison coefficient nu_i=IA*c_i-IB*d_i with IA=log2/3 andIB=log2/3-7/72. These are the limiting comparison integrals; the original finite-u integrals differ by the separate positive8/u^2 and64/u^2 bounds. The checked original field chain and quotient identities make the constructed source field functionals mu/nu equal the displayed factored formula roots. They do not identify nu with the exact finite-u or actual Volterra logarithmic derivative. This is a source-bound analytic identity, not an assertion that unsimplified AST nodes are equal.',
      parity:'The even original chart and full heat imply c_Z=d_Z=mu_Z=nu_Z=0 atZ=0. This comparison identity does not set the actual full-matrix epsilon/frame or negative-mode derivatives to zero.'},
    sourceBounds:{positiveH:'0<h<2^-4096 from the exact source exponent contract.',
      originalHeatArgument:'The retained actual positive terminal schedule puts Xsharp>XR. The literal XR=110*(CSelected*Pstar)^10 and the same source CSelected>2^256,Pstar>1 give0<2/Xsharp<2^-2559<1/16. Every original A.13 length, including its positive wait, is retained by the source schedule and the common direction proof.',
      fixedU:'u=2/directionalMarginKappa=2*Renv^10 with the literal source Renv>2^4096 gives0<u^-2<2^-81922.',
      neighborhood:'The same private torus inverse proves each printed radial/time/log-profile/mesh displacement<2^-16384. Thus the entire segment from(1/4,1) to(deltaSharp,Tsharp) lies inside[3/16,5/16]x[15/16,17/16]. The derivative bound applies along this segment with the original source constants fixed.'},
    sourceAuthenticated:true,actualSolutionOrOldJetValueTransplanted:false};
}

export function attachActualPhysicalCenterSlowSlopeEnclosure(p,input={},context={}){
  assertActualCommonPhysicalCenterEnclosure(p);const request=controlsOf(input),G=p.G,source=bindOriginalSource(p,G),
    numerics=enclosePhysicalCenterSlowSlopes(request,context),audit=physicalCenterSlowSlopeNeighborhoodAudit(),
    neighborhood={delta:audit.domain.delta,T:audit.domain.T,heatArgument:audit.domain.heatArgument,
      anchor:{delta:'1/4',T:'1'},displacementUpper:'2^-16384',comparisonLipschitzUpper:'2^512',transferRadius:'2^-15000',
      fixedOriginalConstants:true,actualPointAndReference:p.point.inverse,localUniformFieldDomainOnly:true},
    sourceBinding={sourceProfile:p.sourceBinding.sourceProfile,parameterExpressionSHA256:p.sourceBinding.parameterExpressionSHA256,
      producer:'The same private original common-family physical center with its actual heat, field, chart, new representative and torus inverse.',
      sourcePrefixNodeCount:p.G.nodes.length,originalPositiveH:p.band.constants.h,originalBand:p.band.geometry.ell,
      originalSourcePointNumericsReused:false,oldActualSolutionOrJetTransferred:false},
    proof={kind:'SOURCE_BOUND_ANALYTIC_COMPARISON_WITH_EXECUTED_DIRECTED_INTERVALS',identities:source.sourceEqualities,
      neighborhood:audit.proof,sourceBounds:source.sourceBounds,
      accuracy:'Each returned comparison coefficient interval includes its numerical anchor interval, a strictly positive displacement radius, and all outward rounding. The alpha/h and alpha_T/h divisions are analytic factorizations; no interval containing0 is used as a denominator.',
      next:'The calling source adapter must independently bind the new complete matrices and their derivatives, whole-time Riccati/initial-layer, finite-positive-u transport errors8/u^2 and64/u^2, moving-frame, covariance inverse/sqrt and positive conditioning before applying these comparison intervals to actual jets. The generic table builder has no source authority.'},
    scope={sameActualPhysicalCenter:true,actualSourceHeatAndPositiveHBound:true,actualFullFieldComparisonRootsBound:true,
      actualNewPointMuNuNumericallyEnclosed:true,originalThirdHeatDerivativeIntegrandsChecked:true,
      uniformTerminalComparisonLipschitzBound:true,oldPointActualJetsTransferred:false,
      actualVolterraJetsNumericallyCertifiedHere:false,actualHWeightJetsNumericallyCertifiedHere:false,
      actualPhysicalCurlDerivativesNumericallyEnclosed:false,wholeGNUMComplete:false,M3Started:false},
    checks=[...source.checks,{id:'six-new-comparison-numerical-intervals-with-positive-transfer-error',pass:numerics.pass&&numerics.rows.length===6&&numerics.rows.every(x=>x.toleranceMet)},
      {id:'the-original-source-only-neighborhood-closes-the-lipschitz-budget',pass:audit.pass&&scope.oldPointActualJetsTransferred===false}],
    roots=source.roots,result={p,physicalCenter:p,G,request,sourceBinding,source,roots,numerics,neighborhood,checks,proof,scope};
  assertActualCommonPhysicalCenterEnclosure(p);
  seals.set(result,{p,G,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:data(result)});
  context.onProgress?.({stage:'actual-new-physical-center-source-slow-slopes-sealed',nodeCount:G.nodes.length,comparisonRows:numerics.rows.length});
  return result;
}
export function prepareActualPhysicalCenterSlowSlopeEnclosure(input={},context={}){
  const request=controlsOf(input),p=prepareActualCommonPhysicalCenterEnclosure(request,context);
  return attachActualPhysicalCenterSlowSlopeEnclosure(p,request,context);
}
export function assertActualPhysicalCenterSlowSlopeEnclosure(result){
  const s=seals.get(result);
  if(!s||result.p!==s.p||result.physicalCenter!==s.p||result.G!==s.G||data(result)!==s.data||canonicalStringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private new-point slow-slope adapter. Copied receipts, changed roots or caller numerical boxes are not source authentication.');
  assertActualCommonPhysicalCenterEnclosure(s.p);return true;
}
export async function actualPhysicalCenterSlowSlopeEnclosureCertificate(result){
  assertActualPhysicalCenterSlowSlopeEnclosure(result);const s=seals.get(result),parent=await actualCommonPhysicalCenterEnclosureCertificate(result.p),
    program=canonicalStringify({nodes:s.G.nodes.slice(0,s.count),...JSON.parse(s.data)});
  return {schema:'MathScope.ActualPhysicalCenterSlowSlopeEnclosureCertificate/1',...JSON.parse(s.data),
    graph:{sha256:await sha256(program),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(program).length,fixedCompilerPrefix:true},
    actualPhysicalParentGraph:parent.graph,pass:true};
}
