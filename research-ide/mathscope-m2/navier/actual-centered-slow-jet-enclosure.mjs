/** Numerical first and mixed-second slow jets of the ORIGINAL weighted
 * radial pulse at one authenticated terminal witness. The moving frame,
 * complete pressure, both coupled modes, H, target and sqrt(H^-1 target)
 * are differentiated before the witness substitution. Centering removes
 * an exact positive solution factor; it never replaces that solution.
 */
import {prepareActualCenteredPulseEnclosure,assertActualCenteredPulseEnclosure,actualCenteredPulseEnclosureCertificateFromProgram} from './actual-centered-pulse-enclosure.mjs';
import {centeredPulseNumericalRequest} from './actual-centered-pulse-enclosure-kernel.mjs';
import {ActualCenteredSlowJetExpressions,terminalFiniteSlowFieldMajorant,terminalSlowMatrixPowerAudit,centeredSlowSlopeIdentityAudit,centeredSlowJetErrorAudit,
  centeredSecondScalarJet,centeredSecondInverseSqrtAudit,centeredSecondProductAudit,defineCenteredFullSecondVariation,encloseCenteredSlowJetCoefficients} from './actual-centered-slow-jet-enclosure-kernel.mjs';
import {centeredNormalizedFullFrameAudit,centeredTerminalTargetPowerAudit} from './actual-centered-slow-jet-source-bounds.mjs';
import {actualMovingPulseFrame} from './actual-covariance-matrix.mjs';
import {adiabaticExactBranchNormalizer} from './actual-adiabatic-pulse-center-kernel.mjs';
import {assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {heatSlowDerivativeIdentityAudit} from './actual-heat-scaled-enclosure.mjs';
import {terminalFieldSlowJetIdentityAudit} from './actual-terminal-field-scaled-enclosure.mjs';
import {ellOneSourceScalarIdentity} from './actual-covariance-ell-one-obstruction.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {disposableThirdJetCacheCopy,clearDisposableThirdJetCaches} from './actual-third-jet-ftc.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile,sourceExponentContract} from './source-profile.mjs';
import {directedArithmetic,rational as Q,readRational,qdiv,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),degree=a=>a.reduce((x,y)=>x+y,0),
  metadata=p=>{const{nodes,...rest}=p;return canonicalStringify(rest);},
  data=p=>canonicalStringify({request:p.request,sourceBinding:p.sourceBinding,coordinates:p.coordinates,sourceBounds:p.sourceBounds,heatField:p.heatField,
    algebra:p.algebra,pulses:p.pulses,covarianceChecks:p.covarianceChecks,inverse:p.inverse,centering:p.centering,rows:p.rows,roots:p.roots,numerics:p.numerics,checks:p.checks,proof:p.proof,scope:p.scope});
const progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodes:G?.nodes.length??0,...extra});};

function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','precisionBits','tolerance','maxCutoffCells'].includes(k)))
    fail('INVALID_INPUT','Only the pinned source, directed bits, exact rational tolerance and cutoff integration budget are accepted. No field, point, matrix, jet, weight or error premise is caller supplied.');
  const {sourceProfile=SOURCE_PROFILE_ID,...rest}=input;assertSourceProfile(sourceProfile);
  const controls=centeredPulseNumericalRequest(rest);
  // Cheap conditional preflight, with no source authority. The actual
  // centers below are taken only from the private source predecessor.
  encloseCenteredSlowJetCoefficients({precisionBits:controls.precisionBits,tolerance:controls.tolerance,weightedCenters:[{lower:'1/2',upper:'1/2'},{lower:'1/2',upper:'1/2'}]});
  const centeredTolerance=qtext(qdiv(readRational(controls.tolerance),Q(1024)));
  centeredPulseNumericalRequest({...controls,tolerance:centeredTolerance});
  return {sourceProfile,...controls,centeredTolerance};
}

function clearAncestorCaches(centered){
  const holders=new Set(),graphs=new Set(),visit=p=>{
    if(!p||typeof p!=='object'||holders.has(p))return;holders.add(p);if(p.G?.lookup instanceof Map)graphs.add(p.G);
    for(const k of ['selected','operator','background','prepared','bootstrap','completedOrderOne','actualHeat','leading','loop','pre','completed','orderOne','orderTwo','originalLeading'])visit(p[k]);
  };visit(centered);return [...graphs].map(clearDisposableThirdJetCaches);
}

/** The literal original schedule and its positive scalar integrals are
 * rebound here because the heat argument needs Xstar>XR and Rstar<Renv.
 * No selected pulse ell or frequency appears in this profile calculation.
 */
function bindOriginalOuterSchedule(G){
  const q=(n,d=1)=>G.q(n,d),one=G.one,h=G.parameter('h'),lam=G.parameter('lambda'),T=G.parameter('T'),B=G.parameter('BOuter'),Tf=G.parameter('Tf'),
    rho=G.mul(G.parameter('co'),h),alpha=G.neg(G.add(q(1,2),lam)),A=G.add(q(1,2),h),a=G.sub(one,lam),b=G.sub(one,h),hold=G.mul(q(-4),G.log(h));
  const integrate=body=>{const t=G.fresh('centered_slow_schedule_integral');return G.integral(body(t),t,G.zero,one);},
    primitive=x=>{if(x===G.zero)return G.zero;if(x===one)return q(1,2);const t=G.fresh('centered_slow_step_primitive');return G.integral(G.step(t),t,G.zero,x);};
  const Q0=G.div(G.sub(lam,h),a),Qsteep=G.mul(G.exp(G.neg(G.mul(a,q(1,2)))),G.add(Q0,integrate(s=>G.mul(G.exp(G.mul(a,G.sub(s,primitive(s)))),G.sub(G.add(lam,G.mul(a,G.step(s))),h))))),
    Qhold=G.add(Qsteep,G.mul(b,hold)),Qb=G.mul(G.exp(G.neg(G.mul(b,q(1,2)))),G.add(Qhold,integrate(s=>G.mul(G.exp(G.mul(b,primitive(s))),b,G.sub(one,G.step(s)))))),
    tp=G.fresh('centered_slow_Qterminal'),Qp=G.integral(G.div(G.mul(G.exp(G.mul(b,tp)),rho,G.step(G.div(G.sub(tp,one),q(2)),1)),G.mul(q(2),G.sub(one,rho))),tp,one,q(3)),
    wait=G.div(G.log(G.div(Qb,Qp)),b),fo=s=>G.sub(one,G.mul(rho,G.sub(one,G.step(G.div(G.sub(s,one),q(2))))));
  const specs=[['initial',one,s=>G.sub(G.mul(q(1,10),s),G.mul(q(3,5),primitive(s)))],['axialDecay',T,s=>G.mul(q(-1,2),s)],
    ['entry',one,s=>G.sub(G.mul(q(-1,2),s),G.mul(lam,primitive(s)))],['reservedPower',G.mul(q(60),B),s=>G.mul(alpha,s)],
    ['pulse',G.div(q(13),lam),s=>G.mul(alpha,s)],['interpolation',Tf,s=>G.sub(G.mul(alpha,s),G.mul(G.log(q(2)),G.step(G.div(s,Tf))))],
    ['angular',G.mul(q(30),B),s=>G.mul(alpha,s)],['steepen',one,s=>G.sub(G.mul(alpha,s),G.mul(G.sub(one,lam),primitive(s)))],
    ['steepPower',hold,s=>G.mul(q(-3,2),s)],['flatten',one,s=>G.add(G.mul(q(-3,2),s),G.mul(b,primitive(s)))],
    ['wait',wait,s=>G.mul(G.neg(A),s)],['terminal',q(3),s=>G.add(G.mul(G.neg(A),s),G.log(G.div(fo(s),G.sub(one,rho))))]];
  let y=G.zero,logA=G.zero;const rows=[];
  for(let j=0;j<specs.length;j++){
    const[id,length,delta]=specs[j],actual=G.outer.stages[j],end=G.add(y,length),nextLog=G.add(logA,delta(length)),
      comparisons=actual?[['length',length],['start',y],['end',end],['logAStart',logA],['logAEnd',nextLog]].map(([key,expected])=>({key,...ellOneSourceScalarIdentity(G,actual[key],expected)})):[];
    rows.push({id:'literal-stage-'+id,pass:actual?.id===id&&comparisons.length===5&&comparisons.every(c=>c.pass),comparisons});y=end;logA=nextLog;
  }
  rows.push(...[['Qb',Qb],['Qp',Qp],['terminalWait',wait]].map(([name,root])=>({id:'literal-A13-'+name,...ellOneSourceScalarIdentity(G,G.outer.roots[name],root)})));
  if(rows.some(r=>!r.pass))fail('INVALID_SOURCE_CONSTRUCTION','The original terminal scalar schedule does not bind.');
  return {roots:{Qsteep,Qhold,Qb,Qp,wait,endpoint:y},rows,pass:true,
    inequalities:'0<Qsteep<=4,1<Qb<=7+32008*T,rho<=Qp<1; wait=log(Qb/Qp)/(1-h)>0 and wait<=16006*T+34 forT>=128.',
    integralDerivation:'For the Qp integral,1<=exp((1-h)*s)<exp(3)<27 and1/(1-rho)<2. The step derivative integrates to2 on1..3, so rho<=Qp<54*rho<1. Qhold>=4(1-h)*log(1/h)>32004*T, while the positive flattening multiplier is>1/2; hence Qb>1. The upper estimates use exp(1/2)<2 and the same step symmetry. The displayed wait upper follows log(7+32008*T)-log(rho), divided by1-h, withT>=128 andh<2^-4096.',
    endpointDerivation:'Sum the literal lengths: endpoint=13exp(1000T)+122009T+135+wait. Thus endpoint+log110+20T<15exp(1000T)<logCSelected. Consequently XR<Xstar=Xb exp(-1/4)<Xb<CSelected^11, Rstar<CSelected^6<Renv. All preterminal amplitude endpoints decrease, so Etail<=Pstar.',
    actualParameterValuesReplaced:false};
}

function bindTerminalHeatAndField(centered,G,directions){
  const source=centered.selected,operator=source.operator,boot=operator.background.prepared.bootstrap,full=boot.actualHeat;assertActualHeatLeading(full);
  const heat=full.heat,{X,eta}=boot.constants,{R,Z,T}=source.coordinates,q=(n,d=1)=>G.q(n,d),h=source.constants.h,b=G.neg(G.add(G.one,h)),
    parameters=['R','Z','T','Xrep','etaRep','sRep'].map(n=>source.coordinates[n]),w=source.roots.witness,values=[w.R,G.zero,G.one,w.X,G.zero,G.one],
    at=body=>G.simultaneousSubstitute(body,parameters,values),rho=G.mul(G.parameter('co'),h),tailY=G.log(G.div(X,heat.Xtail)),
    fo=G.sub(G.one,G.mul(rho,G.sub(G.one,G.step(G.div(G.sub(tailY,G.one),q(2)))))),
    Ecl=G.mul(heat.Etail,G.exp(G.neg(G.mul(G.core.A,tailY))),G.div(fo,G.sub(G.one,rho))),
    loss=G.nodes[heat.heatLoss],integralId=loss?.op==='multiply'?loss.args.find(id=>G.nodes[id]?.op==='definite_integral'):undefined;
  if(integralId===undefined)fail('INVALID_SOURCE_CONSTRUCTION','The full original compactified heat integral is required.');
  const integral=G.nodes[integralId],v=integral.args[1],om=G.sub(G.one,v),u=G.div(v,om),density=G.mul(G.exp(G.add(G.neg(u),G.mul(h,G.log(u)))),G.pow(om,-2)),gamma=heat.gamma,
    sourceArgument=G.div(G.mul(q(2),G.sub(G.one,G.pow(eta,2))),X),sourcePower=G.exp(G.neg(G.mul(h,G.log(G.add(G.one,G.mul(sourceArgument,u)))))),
    profileBody=G.mul(density,sourcePower),lossBody=G.mul(density,G.sub(G.one,sourcePower)),
    partition=sourceGraphRationalIdentity(G,G.sub(density,G.add(profileBody,lossBody)),{atomicNodes:[density,sourcePower],maxTerms:10000}),
    z=G.div(G.mul(q(4),T),G.pow(R,2)),den=G.add(G.one,G.mul(z,u)),power=G.exp(G.neg(G.mul(h,G.log(den)))),H=G.div(G.integral(G.mul(density,power),v,G.zero,G.one),gamma),
    D1=G.div(G.integral(G.div(G.mul(density,u,power),den),v,G.zero,G.one),gamma),D2=G.div(G.integral(G.div(G.mul(density,G.pow(u,2),power),G.pow(den,2)),v,G.zero,G.one),gamma),
    D0=G.div(G.sub(G.one,H),G.mul(h,z)),chart=source.chart,s=chart.s,sv=G.monotoneSystems[chart.system].variable,powReal=(x,a)=>G.exp(G.mul(a,G.log(x))),
    chartEquation=G.sub(G.sub(sv,G.mul(G.pow(Z,2),powReal(sv,G.mul(q(2),h)))),T),
    // Retain the source producer's exp((-A-1/2)*log(s)) AST exactly.
    // exp(-(A+1/2)*log(s)) is equal analytically, but negating the
    // complete product creates a different nested exponent in this DAG.
    originalSlowScale=G.exp(G.mul(G.neg(G.add(source.constants.A,q(1,2))),G.log(s))),
    globalF=operator.background.prepared.records[0].global.F,globalDefinition=G.expressionSystems[G.nodes[globalF].args[0]],
    originalLeadingBody=G.expressionSystems[G.nodes[source.fields.F].args[0]].body,atLeading=G.simultaneousSubstitute(globalF,[operator.band.coordinates.X,operator.band.coordinates.eta],[chart.X,chart.eta]),
    F=at(source.fields.F),FR=at(G.derivative(source.fields.F,R)),GR=at(G.derivative(source.fields.G,R)),FZ=at(G.derivative(source.fields.F,Z)),
    gammaRayleigh=G.neg(at(source.frozen.c0)),alpha=G.pow(gammaRayleigh,2),gabs=at(source.frozen.gabs),lambda0=at(source.frozen.lambda0),
    normalizedStep={a:G.div(G.step(q(1,8)),q(256)),b:G.div(G.step(q(1,8),1),q(512)),c:G.neg(G.div(G.step(q(1,8),2),q(1024)))},
    f=G.sub(G.one,G.mul(h,normalizedStep.a)),Hstar=at(H),D1star=at(D1),D2star=at(D2),zstar=at(z),
    Atilde=G.sub(G.sub(G.one,G.div(normalizedStep.b,f)),G.div(G.mul(zstar,D1star),Hstar)),
    At=G.sub(G.add(G.sub(G.sub(G.div(normalizedStep.c,f),G.div(G.mul(h,G.pow(normalizedStep.b,2)),G.pow(f,2))),G.div(G.mul(zstar,D1star),Hstar)),
      G.div(G.mul(G.pow(zstar,2),G.add(G.one,h),D2star),Hstar)),G.div(G.mul(h,G.pow(zstar,2),G.pow(D1star,2)),G.pow(Hstar,2))),
    xi=G.div(At,Atilde),kappa=G.div(G.add(G.one,G.pow(source.constants.u,-2)),q(3)),
    muT=G.add(G.mul(G.sub(kappa,q(1,2)),G.sub(G.mul(h,Atilde),h)),G.mul(G.sub(G.div(kappa,q(2)),G.div(G.mul(h,Atilde),G.mul(q(2),G.add(G.one,G.mul(h,Atilde))))),xi)),
    muR=G.sub(G.add(q(3,2),G.neg(G.mul(q(2),kappa)),G.mul(G.sub(G.one,G.mul(q(2),kappa)),h)),G.mul(q(2),muT)),
    expectedLambdaSquared=G.mul(q(2),F,G.sub(gabs,G.mul(q(2),F))),lambdaNode=G.nodes[lambda0],
    rayleigh=lambdaNode?.op==='sqrt_positive'?sourceGraphRationalIdentity(G,G.sub(lambdaNode.args[0],expectedLambdaSquared),{atomicNodes:[F,gabs,...centered.midplane.actualN],maxTerms:10000}):{pass:false},
    schedule=bindOriginalOuterSchedule(G),audits={heat:heatSlowDerivativeIdentityAudit(G),field:terminalFieldSlowJetIdentityAudit(G)};
  // The Rayleigh check retains the actual N root. Its proved value(-1,0)
  // is an analytic midplane identity, so use that exact source consequence
  // when its original syntactic normal has not simplified to a rational.
  const rayleighWithN=lambdaNode?.op==='sqrt_positive'?sourceGraphRationalIdentity(G,G.sub(lambdaNode.args[0],G.neg(G.mul(q(2),F,centered.midplane.actualN[0],G.add(gabs,G.mul(q(2),F,centered.midplane.actualN[0]))))),{atomicNodes:[F,gabs,centered.midplane.actualN[0]],maxTerms:10000}):{pass:false};
  const checks=[
    {id:'private-full-heat-and-open-complete-terminal-equality',pass:centered.midplane.pass&&source.support.pass&&source.support.allPositiveOrdersCertifiedByCommonSupport&&globalDefinition.body===heat.finalF},
    {id:'same-original-positive-h-and-rho',pass:h===G.parameter('h')&&G.source.parametersExactExpressions.co.rational==='1/256'&&sourceExponentContract().positive&&sourceExponentContract().upperBoundExact==='2^-4096'},
    {id:'full-original-loss-integrand-gamma-and-endpoints',pass:ellOneSourceScalarIdentity(G,integral.args[0],lossBody).pass&&integral.args[2]===G.zero&&integral.args[3]===G.one&&heat.heatLoss===G.div(integralId,gamma)&&ellOneSourceScalarIdentity(G,gamma,G.integral(density,v,G.zero,G.one)).pass&&partition.pass},
    {id:'actual-heat-argument-and-terminal-cutoff',pass:heat.heatArgument===sourceArgument&&heat.Ecl===Ecl&&heat.heatCutoff===G.step(G.div(G.sub(tailY,q(1,5)),q(3,10)))},
    {id:'original-leading-slow-scale-before-every-derivative',pass:originalLeadingBody===G.mul(originalSlowScale,atLeading)&&sourceGraphRationalIdentity(G,G.sub(heat.exteriorExponent,b)).pass&&sourceGraphRationalIdentity(G,G.add(source.constants.A,q(1,2),b)).pass},
    {id:'original-implicit-chart-on-its-open-positive-domain',pass:G.monotoneSystems[chart.system].body===chartEquation&&chart.X===G.div(G.pow(R,2),G.mul(q(2),s))&&chart.eta===G.div(Z,powReal(s,G.sub(q(1,2),h)))},
    {id:'same-fixed-terminal-witness-and-representative',pass:w.X===G.mul(heat.Xb,G.exp(q(-1,4)))&&w.R===G.sqrt(G.mul(q(2),w.X))&&w.Z===G.zero&&w.T===G.one&&G.outer.stages.at(-1).length===q(3)&&same(centered.midplane.conclusions.N,['-1','0'])&&same(centered.midplane.conclusions.K,['0','-1'])},
    {id:'same-original-Rayleigh-root-with-its-proved-midplane-normal',pass:rayleighWithN.pass&&same(source.frozen.g0,[G.mul(source.frozen.Rrep,source.frozen.FR0),source.frozen.GR0])},
    {id:'literal-positive-terminal-scalar-schedule',pass:schedule.pass},
    {id:'full-Gamma-and-terminal-field-derivative-identities',pass:audits.heat.pass&&audits.field.pass},
    {id:'frozen-witness-moments-and-slopes-have-no-free-coordinates',pass:[h,zstar,Hstar,at(D0),D1star,D2star,F,FR,GR,FZ,gammaRayleigh,alpha,gabs,lambda0,muR,muT].every(root=>G.freeCoordinates(root).size===0)}];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The complete slow-jet heat/field source binding failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  return {at,parameters,values,public:{checks,pass:true,schedule,audits,roots:{originalHeatLoss:heat.heatLoss,originalGamma:gamma,originalHeatArgument:heat.heatArgument,
    originalHeatFactor:G.sub(G.one,heat.heatLoss),originalTerminalFo:fo,originalTerminalEcl:Ecl,originalLeadingBody,originalSlowScale,reducedCompleteHeat:H,
    reducedArgument:z,witnessArgument:zstar,witnessHeat:Hstar,normalizedMoments:{D0:at(D0),D1:D1star,D2:D2star},normalizedStep,f,Atilde,At,xi,mu:{R:muR,Z:G.zero,T:muT},
    actualF:F,actualFR:FR,actualGR:GR,actualFZ:FZ,Rstar:w.R,rayleighGamma:gammaRayleigh,actualAlpha:alpha,actualGabs:gabs,actualLambda0:lambda0},
    originalRayleighChecks:{withoutNormalReduction:rayleigh,withRetainedNormal:rayleighWithN},
    localEqualities:{field:'On this actual open terminal neighborhood F=exteriorAmplitude*(R^2/2)^(-1-h)*f_o(log(R^2/(2sXtail)))*H(4T/R^2). The original s^(-A-1/2) factor is included and cancels only by the positive real power law with X^(-1-h).',
      chart:'s-Z^2*s^(2h)=T, so2*(1-eta^2)/X=4T/R^2. At the fixed witness s=1,delta=1/4,y=11/4 and the reflected step argument is1/8.',
      heat:'The full positive Gamma integral, including the whole improper tail, has H=1-h*z*D0,H_prime=-h*D1,H_second=h*(1+h)*D2. All finite differentiated moments are dominated by the original Gamma density.',
      alpha:'alpha=-R*F_R/(2F)-1=h*Atilde. At Z=0,T=1, alpha_T=h*At, alpha_R*R=-2*alpha_T and F_T/F=alpha-h. Atilde and At above retain f, H, D1 and D2 before interval arithmetic.',
      slopes:'mu_i=((1+u^-2)/3)*(F_i/F+alpha_i/(2alpha))+R*FR_i/(2gabs), with D_R=Rstar*partial_R. Differentiating the complete comparison matrix INCLUDING d-dref gives mu_R and mu_T above. mu_Z=0 only describes the comparison; every actual epsilon/frame term is kept in the error.'},
    positiveParameterBounds:'0<h<2^-4096,0<zstar=2/Xstar<2^-2559,0<u^-2<2^-81922. Since f>1-h/256 and H>=1-h*z*(1+h),f*H>1/2. The closed interval endpoints0 in directed arithmetic are bounds only.',
    actualHeatOrMatrixReplacedByComparison:false,allSourceDerivativesFormedBeforeWitnessSubstitution:true}};
}

function bindPowerPremises(centered,G,heatField,directions){
  const source=centered.selected,c=source.constants,g=source.geometry,selection=source.selection,q=(n,d=1)=>G.q(n,d),
    profile=assertSourceProfile(source.request.sourceProfile),literals={co:{rational:'1/256'},lambda:{exp:{product:[{integer:-1000},{ref:'T'}]}},
      BOuter:{product:[{integer:1000},{ref:'T'}]},Tf:{integer:128},XR:{product:[{integer:110},{power:[{product:[{ref:'CSelected'},{ref:'Pstar'}]},10]}]},
      directionalMarginKappa:{power:[{ref:'C12EnvelopeR'},-10]}},
    rows=source.operator.direction.ratio.rows,find=id=>rows.find(r=>r.id===id),growth=find('frozen-growth-values'),normal=find('frozen-normal-and-c0'),field=find('leading-chart-F'),
    powReal=(x,a)=>G.exp(G.mul(a,G.log(x))),fieldAudit=terminalFiniteSlowFieldMajorant(),matrixAudit=terminalSlowMatrixPowerAudit(),targetAudit=centeredTerminalTargetPowerAudit(),
    {delta,factorEta}=centered.midplane.coordinates,profileTargets=[centered.midplane.importedOuterFactor.roots.outerTheta,centered.midplane.importedOuterFactor.roots.outerScaledZ],
    profileTargetJets=profileTargets.map(body=>centeredSecondScalarJet(G,body,[delta,factorEta])),
    frozen=[g.ell,g.S,g.Q,g.epsilon,g.k,g.ci,g.Ls,c.Bnorm,c.u,c.kappa,...source.families.flatMap(f=>[f.carrier.p,f.carrier.pz,f.carrier.x0,f.P])],
    frozenDerivativeChecks=frozen.map(root=>({root,derivatives:directions.map(d=>G.derivative(root,d)),pulseIndependent:root===source.families[0].P||root===source.families[1].P?null:!G.freeCoordinates(root).has(source.coordinates.v)})),
    checks=[...Object.entries(literals).map(([name,value])=>({id:'source-literal-'+name,pass:same(profile.parametersExactExpressions[name],value)})),
      {id:'private-original-concentration-and-positive-h',pass:centered.sourceBounds.pass&&centered.sourceBounds.contract.positive&&centered.sourceBounds.contract.notNumericallyReplaced&&centered.sourceBounds.roots.B===c.Bnorm},
      {id:'same-exact-frequency-and-positive-damping-scale',pass:g.Q===G.exp(G.neg(G.mul(g.ell,G.log(q(2)))))&&g.epsilon===powReal(g.Q,c.h)&&g.k===G.ceiling(G.inv(G.sqrt(g.epsilon)))&&
        g.Bs===G.sqrt(G.div(source.frozen.lambda0,G.mul(g.epsilon,G.pow(g.k,2),G.pow(G.sqrt(G.add(G.one,G.pow(c.u,2))),3))))},
      {id:'same-source-strong-ell-selector',pass:selection.ellMinimum===G.ceiling(G.maximum(q(8),selection.Sminimum,G.pow(G.div(q(64),c.h),2)))&&g.ell===G.add(selection.ellMinimum,q(8))&&g.S===G.pow(g.ell,2)},
      {id:'original-global-primitive-growth-and-inverse-ranges',pass:growth?.upper==='lambda0<R^83, |g0|<R^75'&&growth?.lower==='lambda0>R^-31, |g0|>R^-20'&&normal?.upper==='v_s<R^18, |c0|<R^10'&&normal?.lower==='|N_theta|>R^-14, |c0|>R^-6'&&field?.upper==='R^71'&&field?.lower==='R^-10'},
      {id:'complete-source-field-jet-majorants',pass:heatField.public.pass&&fieldAudit.pass&&matrixAudit.pass},
      {id:'original-full-target-factor-and-its-generated-profile-jets',pass:centered.midplane.importedOuterFactor.endpointIdentity.pass&&centered.midplane.importedOuterFactor.heightIdentity.pass&&
        source.operator.direction.program.exactFactorization.outer==='T0=exp(-4/delta^2)*delta^-3*(outerTheta,delta^6*outerZ)'&&profileTargetJets.every(j=>j.roots.length===6)&&targetAudit.pass},
      {id:'all-original-labels-length-and-P-are-slow-independent',pass:frozenDerivativeChecks.every(c=>c.derivatives.every(x=>x===G.zero))},
      {id:'same-full-Volterra-cone-and-original-cutoff-plateau',pass:source.decision.actualPositiveWeightsOnDeclaredTerminalDomain&&centered.sourceCutoffs.pass&&same(centered.sourceCutoffs.plateau,['Ls/4','3Ls/4'])&&centered.numerics.sourceErrorAudit.pass}];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','A source slow-jet power premise failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  return {checks,pass:true,fieldAudit,matrixAudit,targetAudit,profileTargets,profileTargetJets,frozenDerivativeChecks,
    roots:{B:c.Bnorm,S:g.S,Renv:c.Renv,u:c.u,L:g.Ls,k:g.k,epsilon:g.epsilon,Bs:g.Bs,curvature:centered.roots.curvature,A0:centered.roots.amplitudeScale},
    frequency:'The exact selector gives h*sqrt(ell)>=64. Therefore log(k)>=h*ell*log2/2>16log(ell)=8log(S), since log2>1/2 and log(ell)<sqrt(ell); k>S^8 and epsilon<4/S^16.',
    primitiveConversion:'The literal field identity and complete Gamma moments give all normalized F jets through five<Renv^73. The original source bounds yield Renv^-40<Bs<Renv^42,|c0| in(Renv^-6,Renv^10),lambda0 in(Renv^-31,Renv^83),gabs in(Renv^-20,Renv^75),Rstar in(Renv^-1,Renv),u=2Renv^10<Renv^11.',
    auxiliarySegment:'At this midplane G and every local slow derivative vanish, while FZ=0 at the point. After dividing the same positive frozen Bs, n_z=-1 for every tau in[0,1] and along the whole segment of inverseLength,epsilon,beta from actual to comparison. Every normal/tangent squared denominator is>=1. The derivative ledger includes up to one auxiliary derivative, so the multivariate mean-value estimate is valid without assuming source regularity outside the open slow chart.',
    exactRoundedTilt:'beta=L*p/Bs. At slow=rep the unrounded value is beta0=sign*u*Rstar/gabs=-sign*u/FRstar. The actual integer rounding gives |beta-beta0|<=L/(k*Bs)<Renv^40/S^7; |beta|<Renv^33. The original p is retained in every matrix and derivative.',
    comparisonSlope:'The complete normalized frame lemma, positive Bs cancellation and actual damping identity reduce only the COMPARISON diagonal to the displayed scalar formula. Since1/L<=B/S,epsilon<4/S^16 and|beta-beta0|<Renv^40/S^7, the source ledger bounds |D_i M11(v0)/g-mu_i|<=B^64/S. No actual coefficient is replaced by this comparison.',
    frameAndTarget:'The original normalized frame factors, their products in covariance, and the radial factor1+r retain both channels. The matrix/field reserves give each primitive normalized frame jet<B, while the complete Riccati first/second jets are<B^6,B^14; finite products through two cost at mostB^32. The copied outer factor, nested pressure/backward kernels and chart give each original target first/second jet divided by frozen tau and Ac or u<Renv^248<B. The strictly positive lower tau>Renv^-60 is used before division.',
    localUniformity:'The full FTC derivative envelopes are continuous in an open fixed-label terminal neighborhood. Their local boundedness justifies differentiating the original convergent ordered Volterra series and H integrals. Numerical power bounds are then applied at the selected point, uniformly over the entire original0<=v<=L.',
    boundedPrimitiveOrderOnly:'The fourth-order primitive reserve is used for M,M_i,M_ij,L*partial_v M_i and one auxiliary derivative of M_i, including Bprime. It does not certify every fourth slow derivative of M.',
    sourceAuthenticated:true,globalOrAllLabelDerivativeBound:false};
}

function bindFullFrame(G,source,family,directions,context){
  const {R,Z,v}=source.coordinates,g=source.geometry,c=source.constants,F=source.fields.F,FR=G.derivative(F,R),GR=G.derivative(source.fields.G,R),
    input={F,FR,GR,R,epsilon:g.epsilon,k:g.k,p:family.carrier.p,pz:family.carrier.pz,x0:family.carrier.x0,v,Ls:g.Ls,u:c.u,c0:source.frozen.c0,lambda0:source.frozen.lambda0,
      HR:family.phaseDerivatives.R,HZ:family.phaseDerivatives.Z,sign:family.sign},regenerated=actualMovingPulseFrame(G,input),normalization=adiabaticExactBranchNormalizer(G),normal=normalization.normalize,
    checks=family.frame.wMatrix.flatMap((row,i)=>row.map((body,j)=>({row:i,column:j,...ellOneSourceScalarIdentity(G,normal(body),normal(regenerated.wMatrix[i][j]))}))),
    phaseChecks=[[R,family.phaseDerivatives.R],[Z,family.phaseDerivatives.Z]].map(([axis,body])=>{
      const actual=normal(body),expected=normal(G.add(G.mul(family.carrier.p,G.derivative(source.fields.F,axis)),G.mul(family.carrier.pz,G.derivative(source.fields.G,axis))));
      return {axis,actual,expected,...sourceGraphRationalIdentity(G,G.sub(actual,expected),{atomicNodes:[normal(family.carrier.p),normal(family.carrier.pz),normal(G.derivative(source.fields.F,axis)),normal(G.derivative(source.fields.G,axis))],maxTerms:12000})};
    });
  if(checks.some(c=>!c.pass)||phaseChecks.some(c=>!c.pass))throw Object.assign(Error('The unchanged full source frame or exact frozen phase chain did not bind.'),{code:'INVALID_SOURCE_CONSTRUCTION',details:{sign:family.sign,checks,phaseChecks}});
  const branches=normalization.receipt([...family.frame.wMatrix.flat(),...regenerated.wMatrix.flat(),...phaseChecks.flatMap(c=>[c.actual,c.expected])]);
  progress(context,'slow-jets-original-full-frame-'+family.sign,G);
  return {input,retainedMatrix:family.frame.wMatrix,regeneratedMatrix:regenerated.wMatrix,checks,phaseChecks,branches,
    positiveScaleCancellation:'n=Bs*n_hat and nprime=Bs*n_hat_prime with the same positive frozen Bs. This cancels exactly from n(n^T K-nprime^T)/n^2,Ka,Na,sa,U,J,B,Bleft and Bprime. The actual damping becomes epsilon*k^2*Bs^2*|n_hat|^2=lambda0*|n_hat|^2/(1+u^2)^(3/2).',
    boundsOnlyLocalZeroIdentity:'Only the quantitative source-bound argument uses G=GR=GZ=0 on the proved common terminal exterior. The retained matrix and every generated derivative below still contain their original bodies.',
    fullPressureAndBasisConnectionRetained:true,actualBodyModified:false,pass:true};
}

function numericalConditioning(centered,bits){
  const A=directedArithmetic(bits),v=centered.numerics.values,H=[v.normalizedCovarianceTheta.map(x=>A.unpack(x)),v.normalizedCovarianceZ.map(x=>A.unpack(x))],
    det=A.sub(A.mul(H[0][0],H[1][1]),A.mul(H[0][1],H[1][0])),inverse=[[H[1][1],A.neg(H[0][1])],[A.neg(H[1][0]),H[0][0]]].map(row=>row.map(x=>A.div(x,det))),
    abs=x=>[x[0]>=0n?x[0]:x[1]<=0n?-x[1]:0n,(x[0]<0n?-x[0]:x[0])>(x[1]<0n?-x[1]:x[1])?(x[0]<0n?-x[0]:x[0]):(x[1]<0n?-x[1]:x[1])],
    rows=inverse.map(row=>row.map(abs).reduce((a,b)=>A.add(a,b),A.zero())),Y=v.normalizedInverseWeight.map(x=>A.unpack(x)),roots=Y.map(x=>A.sqrt(x));
  const checks=[{id:'actual-normalized-H-determinant-negative',pass:det[1]<0n},{id:'actual-normalized-H-infinity-inverse-at-most-one',pass:rows.every(x=>x[1]<=A.S)},
    {id:'actual-centered-inverse-weights-in-one-eighth-to-one-half',pass:Y.every(x=>8n*x[0]>=A.S&&2n*x[1]<=A.S)},
    {id:'actual-positive-square-roots-at-least-one-quarter',pass:roots.every(x=>4n*x[0]>=A.S)}];
  if(checks.some(c=>!c.pass))fail('PRECISION_REQUIRED','The original normalized inverse or positive-square-root conditioning is not separated.');
  return {checks,pass:true,H:H.map(row=>row.map(x=>A.pack(x))),determinant:A.pack(det),inverse:inverse.map(row=>row.map(x=>A.pack(x))),
    infinityRowBounds:rows.map(x=>A.pack(x)),inverseWeightBoxes:Y.map(x=>A.pack(x)),squareRootBoxes:roots.map(x=>A.pack(x)),
    source:'The private source-directed H and inverse boxes. Each sign has an independent interval box; equality of the two actual columns or weights is not assumed.',
    arithmetic:{bits,kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',binary64UsedForDecisions:false}};
}

function exactCentering(G,centered,source,inverse,directions,point){
  const q=(n,d=1)=>G.q(n,d),v=source.coordinates.v,v0=centered.roots.centerTime,m=centered.roots.massScale,tau=centered.roots.tau,A0=centered.roots.amplitudeScale,
    diagonal=[centered.roots.Ac,source.constants.u],centers=source.families.map(f=>G.covarianceValue(f.system,0,v0,G.covarianceSystems[f.system].parameters)),
    Hbar=source.target.H.map((row,j)=>row.map((x,i)=>G.div(x,G.mul(diagonal[j],m,G.pow(centers[i],2))))),
    Ybar=source.target.weights.map((y,i)=>G.div(G.mul(y,m,G.pow(centers[i],2)),tau)),Tbar=source.target.components.map((t,j)=>G.div(t,G.mul(diagonal[j],tau))),
    columnChecks=Hbar.flatMap((row,j)=>row.map((x,i)=>{
      const right=G.div(G.mul(source.target.H[j][i],source.target.weights[i]),G.mul(diagonal[j],tau)),
        atoms=[source.target.H[j][i],source.target.weights[i],diagonal[j],m,tau,centers[i]];
      return {row:j,column:i,left:G.mul(x,Ybar[i]),right,...sourceGraphRationalIdentity(G,G.sub(G.mul(x,Ybar[i]),right),{atomicNodes:atoms,maxTerms:12000})};
    })),
    Hjets=Hbar.map(row=>row.map(body=>centeredSecondScalarJet(G,body,directions))),Yjets=Ybar.map(body=>centeredSecondScalarJet(G,body,directions)),Tjets=Tbar.map(body=>centeredSecondScalarJet(G,body,directions)),
    centerJets=centers.map(body=>centeredSecondScalarJet(G,body,directions)),HvalueChecks=Hbar.flatMap((row,j)=>row.map((body,i)=>({row:j,column:i,...ellOneSourceScalarIdentity(G,point.at(body),centered.rows[i].roots.normalizedH[j])}))),
    YvalueChecks=Ybar.map((body,i)=>({column:i,...ellOneSourceScalarIdentity(G,point.at(body),centered.rows[i].roots.normalizedY)})),
    centerValueChecks=centers.map((root,i)=>({column:i,pass:point.at(root)===centered.rows[i].center.positiveUncomputedAmplitude})),
    scalar=G.fresh('centered_slow_positive_scalar_a'),ym=G.fresh('centered_slow_positive_scalar_y'),mm=G.fresh('centered_slow_positive_scalar_mass'),tt=G.fresh('centered_slow_positive_scalar_tau'),
    normalizedY=G.div(G.mul(ym,mm,G.pow(scalar,2)),tt),positiveSqrtArgument=sourceGraphRationalIdentity(G,G.sub(G.div(normalizedY,G.pow(scalar,2)),G.div(G.mul(ym,mm),tt)),{maxTerms:1000});
  if(columnChecks.some(c=>!c.pass)||HvalueChecks.some(c=>!c.pass)||YvalueChecks.some(c=>!c.pass)||centerValueChecks.some(c=>!c.pass)||!positiveSqrtArgument.pass)
    throw Object.assign(Error('The actual center factors must cancel before applying any numerical slow-jet bound.'),{code:'INVALID_SOURCE_CONSTRUCTION',details:{columnChecks,HvalueChecks,YvalueChecks,centerValueChecks,positiveSqrtArgument}});
  const wave=source.families.map((f,i)=>{
    const fullAtCenter=G.substitute(f.t[0],v,v0),ratio=G.div(fullAtCenter,centers[i]),product=centeredSecondProductAudit(G,{factors:[inverse.squareRoots[i].sigma,fullAtCenter],directions}),
      normalized=G.div(product.body,A0),normalizationProof={originalWeightedBody:product.body,positiveIdentityRight:G.mul(G.sqrt(Ybar[i]),ratio),
        statement:'Since a_i>0,y_i>0,m>0,tau>0 and A0=sqrt(tau/m), sqrt(y_i)/A0=sqrt(y_i*m*a_i^2/tau)/a_i. This identity holds on an open source neighborhood, so all first/mixed-second derivatives agree. Neither a_i nor its slow derivatives are held constant.',
        scalarArgumentCheck:positiveSqrtArgument,actualCenterDifferentiated:true,sourcePositiveDomainRetained:true},
      ratioJets=centeredSecondScalarJet(G,ratio,directions),normalJets=centeredSecondScalarJet(G,normalized,directions);
    return {sign:f.sign,fullAtCenter,ratio,ratioJets,product,normalized,normalJets,normalizationProof};
  });
  return {centers,centerJets,Hbar,Ybar,Tbar,Hjets,Yjets,Tjets,columnChecks,HvalueChecks,YvalueChecks,centerValueChecks,wave,
    originalHInverseAndTargetRetained:true,normalizedIdentity:'Hbar*Ybar=Tbar, Hbar_ji=H_ji/(D_j*m*a_i^2),Ybar_i=y_i*m*a_i^2/tau,Tbar_j=T_j/(D_j*tau),D=(Ac,u).',
    derivativePolicy:'The center a_i(R,Z,T)=w_plus_i(Ls/2;R,Z,T,fixed representative) remains a function during every derivative. The actual original positive inverse and sqrt bodies are independently materialized; centering is an exact analytic normalization.',
    sourceMatrixReplacedByGaussian:false,pass:true};
}

export function prepareActualCenteredSlowJetEnclosure(input={},context={}){
  const request=requestOf(input),centered=prepareActualCenteredPulseEnclosure({sourceProfile:request.sourceProfile,precisionBits:request.precisionBits,
    tolerance:request.centeredTolerance,maxCutoffCells:request.maxCutoffCells},context);
  return attachActualCenteredSlowJetEnclosure(centered,{precisionBits:request.precisionBits,tolerance:request.tolerance,maxCutoffCells:request.maxCutoffCells},context);
}

export function attachActualCenteredSlowJetEnclosure(centered,input={},context={}){
  assertActualCenteredPulseEnclosure(centered);
  const request=requestOf({sourceProfile:centered.request.sourceProfile,...input});
  if(request.precisionBits!==centered.request.precisionBits||qcompare(readRational(centered.request.tolerance),readRational(request.centeredTolerance))>0)
    fail('PRECISION_REQUIRED','The private centered source must use the same precision and a tolerance no larger than the requested slow-jet width divided by1024.');
  const source=centered.selected,sourceCount=centered.program.nodes.length,discarded=clearAncestorCaches(centered);assertActualCenteredPulseEnclosure(centered);
  progress(context,'slow-jets-private-centered-source-ready',centered.G,{discardedGraphCaches:discarded.length});
  const G=new ActualCenteredSlowJetExpressions(disposableThirdJetCacheCopy(centered.G),{maxNodes:3000000,checkCancelled:context.checkCancelled}),
    coordinates=structuredClone(source.coordinates),directions=['R','Z','T'].map(k=>coordinates[k]),v=coordinates.v,
    heat=bindTerminalHeatAndField(centered,G,directions),heatField=heat.public,sourceBounds=bindPowerPremises(centered,G,heat,directions),
    algebra={frame:centeredNormalizedFullFrameAudit(G),slopes:centeredSlowSlopeIdentityAudit(G),error:centeredSlowJetErrorAudit()},pulses=[];
  progress(context,'slow-jets-actual-heat-field-and-power-bounds',G);
  for(const family of source.families){
    const frameBinding=bindFullFrame(G,source,family,directions,context),variation=defineCenteredFullSecondVariation(G,{name:'ActualCenteredFullSecond_'+family.sign,originalSystem:family.system,directions});
    pulses.push({sign:family.sign,frameBinding,variation});
    progress(context,'slow-jets-full-matrix-and-FTC-'+family.sign,G,{dimension:variation.dimension,entryCount:variation.norms.flatMap(n=>n.entries.flat()).length});
    clearDisposableThirdJetCaches(G);
  }
  const covarianceChecks=[];
  for(const family of source.families)for(const component of[1,2]){
    const product=centeredSecondProductAudit(G,{factors:[G.pow(source.cutoffs.psi,2),family.t[0],family.t[component]],directions}),
      H=component===1?family.covariance.theta:family.covariance.z,jets=centeredSecondScalarJet(G,H,directions);
    for(const [index,orders]of jets.indices.entries()){
      const expected=G.mul(source.geometry.haarFactor,G.integral(product.roots[index],v,G.zero,source.geometry.Ls));
      covarianceChecks.push({sign:family.sign,component,orders,retained:jets.roots[index],expected,integrandProductCheck:product.checks[index],
        endpointDerivativeActuallyZero:true,pass:jets.roots[index]===expected&&product.checks[index].pass});
    }
  }
  if(covarianceChecks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','An actual H first/second derivative lost an integrand or fixed-endpoint term.');
  progress(context,'slow-jets-original-H-integrals',G);
  const inverse=centeredSecondInverseSqrtAudit(G,{matrix:source.target.H,target:source.target.components,directions});
  if(!same(inverse.weights,source.target.weights)||inverse.determinant!==source.target.determinant||!same(inverse.squareRoots.map(r=>r.sigma),source.target.squareRootWeights))
    fail('INVALID_SOURCE_CONSTRUCTION','The slow jets must consume the exact original source inverse and positive square-root weights.');
  progress(context,'slow-jets-original-inverse-and-positive-square-roots',G);
  const centering=exactCentering(G,centered,source,inverse,directions,heat),conditioning=numericalConditioning(centered,request.precisionBits),
    numerical=encloseCenteredSlowJetCoefficients({precisionBits:request.precisionBits,tolerance:request.tolerance,
      weightedCenters:centered.numerics.values.normalizedWeightedAmplitude.map(({lower,upper})=>({lower,upper}))},context),
    labels=['value','R','Z','T','RR','RZ','RT','ZZ','ZT','TT'],gL=G.mul(centered.roots.curvature,source.geometry.Ls),
    firstScale=G.mul(centered.roots.amplitudeScale,G.sqrt(gL)),secondScale=G.mul(centered.roots.amplitudeScale,gL),rows=[];
  for(const [familyIndex,wave]of centering.wave.entries())for(const [index,orders]of wave.product.indices.entries())if(index){
    const label=labels[index],atPoint=heat.at(wave.product.roots[index]),normalizedDirection=G.mul(G.pow(source.roots.witness.R,orders[0]),atPoint),
      scale=degree(orders)===1?firstScale:secondScale,coefficient=G.div(normalizedDirection,scale),n=numerical.rows.find(r=>r.sign===wave.sign&&r.derivative===label);
    if(!n||G.freeCoordinates(coefficient).size)fail('INVALID_SOURCE_CONSTRUCTION','Every directed slow row needs its same fully substituted original weighted derivative.');
    rows.push({sign:wave.sign,family:familyIndex,derivative:label,orders,order:degree(orders),originalWeightedDerivative:wave.product.roots[index],
      witnessDerivative:atPoint,normalizedDirectionDerivative:normalizedDirection,positiveExactScale:scale,coefficient,
      directedInterval:n.interval,width:n.width,toleranceMet:n.toleranceMet,comparison:n.comparison,nonzeroRemainderRetained:true,
      sourceWeightedProductCheck:wave.product.checks[index],allSourceJetsMaterializedBeforePointSubstitution:true});
  }
  const numerics={...numerical,conditioning,sourceCenterBoxes:centered.numerics.values.normalizedWeightedAmplitude,
    exactSourceBindings:rows.map(({sign,derivative,coefficient,positiveExactScale,directedInterval})=>({sign,derivative,coefficient,positiveExactScale,directedInterval})),
    sourceAuthenticatedByThisPrivateAdapter:true,normalization:{radialDirection:'D_R=Rstar*partial_R, with Rstar held constant during repeated differentiation; D_Z=partial_Z,D_T=partial_T.',
      first:'D_i(sqrt(y_sign)*t_r_sign(Ls/2))/(A0*sqrt(g*Ls))',second:'D_iD_j(sqrt(y_sign)*t_r_sign(Ls/2))/(A0*g*Ls)',
      A0:'sqrt(tau/massScale), massScale=r0^2/sqrt(g*Ls). Every geometry/target factor is its positive original expression.',
      error:'Every comparison zero has a positive interval radius; actual epsilon, higher coupled-mode responses and source target derivatives are not set to zero.'}};
  const roots={actualOriginalWeightedRadial:centering.wave.map(w=>w.product.body),actualNormalizedWeightedRadial:centering.wave.map(w=>w.normalized),
    originalH:source.target.H,originalTarget:source.target.components,originalWeights:inverse.weights,originalSquareRoots:inverse.squareRoots.map(x=>x.sigma),
    dynamicActualCenters:centering.centers,centeredH:centering.Hbar,centeredWeights:centering.Ybar,centeredTarget:centering.Tbar,
    centerTime:centered.roots.centerTime,Rstar:source.roots.witness.R,gL,A0:centered.roots.amplitudeScale,firstScale,secondScale,
    mu:heatField.roots.mu,sourceWeightedSlowJetCoefficients:rows.map(r=>r.coefficient),sourceWeightedSlowJetScales:rows.map(r=>r.positiveExactScale)},
    checks=[{id:'unchanged-private-centered-source',pass:true},{id:'full-actual-heat-field-and-original-profile-schedule',pass:heatField.pass},
      {id:'source-first-second-and-auxiliary-power-premises',pass:sourceBounds.pass},{id:'full-frame-damping-slope-and-Gaussian-algebra',pass:algebra.frame.pass&&algebra.slopes.pass&&algebra.error.pass},
      {id:'both-original-full-20-component-variations',pass:pulses.length===2&&pulses.every(p=>p.frameBinding.pass&&p.variation.dimension===20&&p.variation.allRequiredMatrixAndTimeDerivativeBodiesGenerated)},
      {id:'all40-original-H-integral-derivative-identities',pass:covarianceChecks.length===40&&covarianceChecks.every(c=>c.pass)},
      {id:'all20-original-inverse-and18-positive-sqrt-derivatives',pass:inverse.inverseChecks.length===20&&inverse.inverseChecks.every(c=>c.pass)&&inverse.squareRoots.every(x=>x.checks.length===9&&x.pass)},
      {id:'actual-positive-center-cancellation-before-derivatives',pass:centering.pass&&centering.wave.every(w=>w.product.pass&&w.normalizationProof.actualCenterDifferentiated)},
      {id:'actual-directed-H-and-sqrt-conditioning',pass:conditioning.pass},{id:'18-original-weighted-slow-rows-meet-their-width-and-sign',pass:rows.length===18&&rows.every(r=>r.toleranceMet&&r.nonzeroRemainderRetained)},
      {id:'unchanged-original-source-node-prefix',pass:same(G.nodes.slice(0,sourceCount),centered.program.nodes)}];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The final actual centered slow-jet certificate did not pass every source check.');
  const sourceBinding={sourceProfile:request.sourceProfile,parameterExpressionSHA256:centered.sourceBinding.parameterExpressionSHA256,
    compiler:'private original centered covariance -> full source second variations -> full H/inverse/sqrt AD -> directed centered weighted jets',
    sourceNodeCount:sourceCount,selectedEll:source.geometry.ell,originalFullVolterraMatrixRetained:true,originalPositiveHAndEpsilonRetained:true,
    originalNonzeroRoundedCarriersRetained:true,originalCompleteHAndTargetRetained:true,sourceDerivativeMatricesNeverCallerSupplied:true},
    proof={kind:'SOURCE_BOUND_COMPLETE_WEIGHTED_SLOW_JETS_WITH_DIRECTED_NONZERO_GAUSSIAN_REMAINDERS',heatAndField:heatField.localEqualities,
      primitiveBounds:sourceBounds,matrixAndTime:'Every original M,M_i,M_ij and their actual v derivatives is generated. Exact complete FTC integrals supply local uniform convergence premises. The numerical argument uses the separate source-bound finite power ledger, not evaluated FTC guesses.',
      fullTimeRiccati:algebra.error.riccati,gaussianAndInverse:algebra.error.derivation,exactCentering:centering.derivativePolicy,
      independentAlgebra:'Complete matrix/time conversion, damping slope, inverse, sqrt and products are checked as exact algebra. Fully specified expression shares are independently materialized to their actual AD bodies; they are not unspecified derivative oracles.',
      positiveDomain:'The same selected original small-q band on its open fixed-label terminal domain, evaluated at X=Xrep=Xb exp(-1/4),eta=etaRep=0,s=sRep=1,v=Ls/2. Positivity and the whole-interval cone belong to this private source. No external or generic source flag supplies authority.',
      limits:'The executed numerical rows enclose the first and symmetric second R/Z/T derivatives of the original weighted radial pulse after dividing by the displayed exact positive scales. They do not yet numerically evaluate those remaining scales, fast variables, phase/partition factors or the full physical curl.'},
    scope={actualWeightedRadialFirstSlowDerivativesNumericallyEnclosed:true,actualWeightedRadialSecondAndMixedSlowDerivativesNumericallyEnclosed:true,
      allOriginalMatrixAndHInverseSqrtDerivativeBodiesGenerated:true,originalCompleteTargetAndCoupledModesRetained:true,sourceBoundPositiveNonzeroError:true,
      exactPositiveDerivativeScalesRetained:true,remainingGeometryAndTargetScalesNumericallyEvaluated:false,unscaledHighRelativePrecision:false,
      otherTwoWeightedPulseComponentsNumericallyEnclosed:false,actualFastPulseDerivativesNumericallyEnclosed:false,actualHUncenteredDerivativeNumerics:false,
      actualFullCurlNumericalEnclosure:false,actualPhysicalPointViaTorusInverse:false,allSourceLabelsCovered:false,globalPhysicalResidual:false,
      wholeGNUMComplete:false,newLeanKernelProof:false,workerExecution:false,browserExecution:false,m3MayStart:false,
      actualHReplacedByZero:false,actualEpsilonReplacedByZero:false,actualRoundedCarrierReplaced:false};
  progress(context,'slow-jets-full-source-directed-rows-ready',G,{rowCount:rows.length});
  const packed=G.pack(roots,{schema:'MathScope.ActualCenteredSlowJetEnclosureProgram/1',compiler:'actual-centered-slow-jet-enclosure.mjs:attachActualCenteredSlowJetEnclosure',compilerInput:request,
    sourceBinding,coordinates,sourceBounds,heatField,algebra,pulses,covarianceChecks,inverse,centering,rows,numerics,checks,proof,scope}),{nodes,...rest}=packed,
    program={...structuredClone(rest),nodes:nodes.slice()},result={G,centered,request,sourceBinding,coordinates,sourceBounds,heatField,algebra,pulses,covarianceChecks,inverse,centering,rows,roots,numerics,checks,proof,scope,program};
  assertActualCenteredPulseEnclosure(centered);
  seals.set(result,{G,centered,count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),covariance:JSON.stringify(G.covarianceSystems),
    covarianceCount:G.covarianceSystems.length,jetCount:G.pulseJetSystems.length,jets:JSON.stringify(G.pulseJetSystems),program,programNodes:program.nodes,
    metadata:metadata(program),serialized:canonicalStringify(program),data:data(result)});
  clearDisposableThirdJetCaches(G);progress(context,'slow-jets-source-program-sealed',G);return result;
}

export function assertActualCenteredSlowJetEnclosure(p){
  const s=seals.get(p);
  if(!s||p.G!==s.G||p.centered!==s.centered||p.program!==s.program||p.program.nodes!==s.programNodes||metadata(p.program)!==s.metadata||data(p)!==s.data||
    JSON.stringify(p.program.nodes)!==s.nodes||JSON.stringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions)||
    JSON.stringify(s.G.covarianceSystems.slice(0,s.covarianceCount))!==s.covariance||JSON.stringify(s.G.pulseJetSystems.slice(0,s.jetCount))!==s.jets)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private original centered slow-jet program, not a copied report or altered source.');
  for(let j=0;j<s.jetCount;j++)s.G.assertPulseSecondVariation(j);assertActualCenteredPulseEnclosure(s.centered);return true;
}

export async function actualCenteredSlowJetEnclosureCertificateFromProgram(p,context={}){
  assertActualCenteredSlowJetEnclosure(p);const s=seals.get(p),centered=await actualCenteredPulseEnclosureCertificateFromProgram(p.centered,context);context.checkCancelled?.();
  return {schema:'MathScope.ActualCenteredSlowJetEnclosureCertificate/1',status:'COMPLETED',pass:true,request:p.request,sourceBinding:p.sourceBinding,
    graph:{sha256:await sha256(s.serialized),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).length,compiler:p.program.compiler,compilerInput:p.request,
      fixedCompilerPrefix:true,laterGraphAppendsExcluded:true,graphIncluded:false,originalCenteredSourceGraph:centered.graph},roots:p.roots,sourceBounds:p.sourceBounds,
    heatField:p.heatField,algebra:p.algebra,pulses:p.pulses,covarianceChecks:p.covarianceChecks,inverse:p.inverse,centering:p.centering,rows:p.rows,numerics:p.numerics,checks:p.checks,proof:p.proof,scope:p.scope};
}

export async function actualCenteredSlowJetEnclosure(input={},context={}){
  return actualCenteredSlowJetEnclosureCertificateFromProgram(prepareActualCenteredSlowJetEnclosure(input,context),context);
}
