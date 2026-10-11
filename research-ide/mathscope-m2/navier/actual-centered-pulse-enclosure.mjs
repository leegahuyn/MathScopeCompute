/** Actual source centered covariance and weighted pulse enclosures.
 *
 * At the fixed original terminal witness the full Volterra center a_sign
 * is kept. It cancels exactly from sqrt(y_sign)*t_sign. The reported
 * rational intervals concern scaled actual quantities; neither a_sign
 * nor the remaining positive target/geometry scale is numerically guessed.
 */
import {prepareActualAdmissibleTerminalCovariance,assertActualAdmissibleTerminalCovariance,actualAdmissibleTerminalCovarianceCertificateFromProgram} from './actual-admissible-terminal-covariance.mjs';
import {ActualCovarianceExpressions} from './actual-covariance-volterra.mjs';
import {assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {copyOuterFactorProgram} from './actual-outer-covariance-flat-extension.mjs';
import {ellOneSourceScalarIdentity} from './actual-covariance-ell-one-obstruction.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {disposableThirdJetCacheCopy,clearDisposableThirdJetCaches} from './actual-third-jet-ftc.mjs';
import {centeredPulseNumericalRequest,centeredReferenceGaussianBinding,encloseCenteredPulseCoefficients} from './actual-centered-pulse-enclosure-kernel.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile,sourceExponentContract} from './source-profile.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  meta=p=>{const{nodes,...rest}=p;return canonicalStringify(rest);},
  binding=p=>canonicalStringify({request:p.request,sourceBinding:p.sourceBinding,roots:p.roots,sourceBounds:p.sourceBounds,
    sourceCutoffs:p.sourceCutoffs,midplane:p.midplane,rows:p.rows,numerics:p.numerics,checks:p.checks,proof:p.proof,scope:p.scope});
class CenteredSourceExpressions extends ActualCovarianceExpressions{
  derivative(id,variable){if(!this.dependsOn(id,variable))return this.zero;return super.derivative(id,variable);}
}
function progress(context,stage,G,extra={}){context.checkCancelled?.();context.onProgress?.({stage,nodes:G.nodes.length,...extra});}
function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','precisionBits','tolerance','maxCutoffCells'].includes(k)))
    fail('INVALID_INPUT','Only the pinned source and directed numerical controls are accepted. The point, band, H, target and center values are fixed by the actual producer.');
  const {sourceProfile=SOURCE_PROFILE_ID,...controls}=input;assertSourceProfile(sourceProfile);return {sourceProfile,...centeredPulseNumericalRequest(controls)};
}

function bindSourceBounds(p,G){
  const {geometry:g,constants:c,selection:s,operator}=p,q=(n,d=1)=>G.q(n,d),source=assertSourceProfile(p.request.sourceProfile),v=source.parametersExactExpressions,
    condition=s.conditions.find(x=>x.id==='actual-moving-frame-denominators-and-primitive-budget'),E=G.pow(c.Bnorm,256),contract=sourceExponentContract(),
    literals={h:{exp:{product:[{integer:-8002},{ref:'T'}]}},T:{sum:[{exp:{ref:'Md'}},{integer:10}]},
      logP:{product:[{integer:2},{ref:'T'}]},Pstar:{exp:{ref:'logP'}},K:{power:[{ref:'Pstar'},2]},j0:{power:[{ref:'h'},4]},
      sigmaStar:{quotient:[{ref:'j0'},{integer:2000}]},Q:{quotient:[{product:[{integer:String(1n<<260n)},{ref:'K'}]},{power:[{ref:'sigmaStar'},2]}]},
      BRefUpper:{power:[{ref:'Q'},300]},logCSelected:{sum:[{product:[{integer:10},{log:{sum:[{integer:1},{ref:'BRefUpper'}]}}]},{power:[{ref:'Q'},200]}]},
      CSelected:{exp:{ref:'logCSelected'}},sourceEnvelopeS:{power:[{ref:'CSelected'},100000]},C12EnvelopeR:{exp:{power:[{ref:'sourceEnvelopeS'},256]}},
      directionalMarginKappa:{power:[{ref:'C12EnvelopeR'},-10]}};
  const literalChecks=Object.entries(literals).map(([name,expression])=>({id:'source-parameter-'+name,pass:same(v[name],expression)}));
  const checks=[...literalChecks,
    {id:'positive-original-h-contract',pass:contract.profileId===p.request.sourceProfile&&contract.parameterExpressionSHA256===operator.parameterExpressionSHA256&&contract.positive&&contract.notNumericallyReplaced&&contract.upperBoundExact==='2^-4096'&&c.h===G.parameter('h')},
    {id:'same-fixed-source-envelope-and-concentration-base',pass:c.Renv===G.parameter('C12EnvelopeR')&&c.kappa===G.parameter('directionalMarginKappa')&&c.u===G.div(q(2),c.kappa)&&
      c.Bnorm===G.add(q(1n<<128n),G.pow(c.Renv,4096),...['FGErrorConstant','bTotalConstant','FTotalConstant','GTotalConstant'].map(name=>operator.background.roots[name]),operator.background.chart.operatorA,operator.background.chart.operatorB)},
    {id:'actual-selector-gives-S-at-least-B-power-1024',pass:condition?.lower===G.pow(c.Bnorm,512)&&s.Sminimum===G.maximum(...s.conditions.map(x=>x.lower))&&
      s.ellMinimum===G.ceiling(G.maximum(q(8),s.Sminimum,G.pow(G.div(q(64),c.h),2)))&&g.ell===G.add(s.ellMinimum,q(8))&&g.S===G.pow(g.ell,2)},
    {id:'original-palette-ratio-and-positive-length',pass:g.r0===q(1,1n<<34n)&&g.Tg===G.add(q(4),G.sqrt(q(2)))&&g.Ls===G.div(G.mul(q(2),g.r0),g.ci)&&
      same(g.lengthRatioBounds,[G.mul(q(2),g.r0),G.mul(q(2),g.r0,g.Tg)])},
    {id:'actual-positive-cone-column-and-frame-bounds',pass:p.decision.actualPositiveWeightsOnDeclaredTerminalDomain&&p.support.allPositiveOrdersCertifiedByCommonSupport&&
      p.quantitative.maximumColumnError===G.div(c.kappa,q(128))&&p.proof.sourceTransfer.originalBounds.fixedSourceInputs.sourceNorm===c.Bnorm&&operator.direction.ratio.pass},
    {id:'all-source-error-scales-fixed-in-slow-and-pulse-coordinates',pass:[E,c.Bnorm,g.S,g.Ls,c.u,c.kappa].every(root=>G.freeCoordinates(root).size===0)}];
  if(!checks.every(x=>x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The centered numerical source bounds changed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return {checks,roots:{B:c.Bnorm,S:g.S,E,Renv:c.Renv,kappa:c.kappa,u:c.u,lambdaLower:G.pow(c.Renv,-31),lambdaUpper:G.pow(c.Renv,83)},contract,
    derivation:{base:'All actual source norm summands are positive/nonnegative, hence B>=2^128 and B>=Renv^4096.',
      selector:'The literal source maximum contains B^512. ell=ceil(max(8,Sminimum,(64/h)^2))+8 is therefore >=B^512, so S=ell^2>=B^1024. No logarithm, ceiling or huge integer is evaluated in binary64.',
      margin:'The pinned parameter chain has 0<h<1, T>10, Pstar>1, K>1, 0<sigmaStar<1 and the quality parameter Q>2^260. Thus CSelected>2 and Renv=exp(CSelected^25600000)>2^4096; kappa=Renv^-10<2^-40960 and kappa/128<2^-40967.',
      length:'The original palette gives 2*r0*S<=Ls<2*r0*(4+sqrt(2))*S<S, and 2*r0=2^-33>B^-1.',
      curvature:'u=2*Renv^10>=2 and Renv^-31<=lambda0<=Renv^83. g=3*lambda0*u^2/(1+u^2)^(3/2) lies between lambda0/u and 3*lambda0/u, hence B^-1<g<B. Therefore g*Ls>=B^1022.',
      cone:'lambdaFloor=lambdaLower/(2u), coneK=4*B^256/lambdaFloor=8*B^256*u/lambdaLower<B^260. The actual invariant Riccati cone gives |r|<=B^-764 and w_plus>0.',
      scalar:'In the actual M11=E11-(d-dref), M12=E12, the cone gives |(log w_plus)_v|<=3*B^256/S. After x=(v-Ls/2)*sqrt(g/Ls), beta<=3*B^(256+1/2)/sqrt(S)<B^-254.',
      midpointFrame:'At v0, s=sign*u and c=c0*sqrt(1+u^2)=-Ac. The actual B columns retain -sa*Ka and +/-c*Na. With |Ka-K|,|Na-N|,|sa-s|<=B^-768, |r|<=B^-764, B^-1<Ac,u<B^2, each normalized radial, normal or signed tangent center component differs from1 by <8*B^-763<2^-8192.',
      solution:'All inequalities apply to the full original Volterra solutions. No finite sum, unit amplitude, constant coefficient ODE, or Gaussian limit is substituted.'},
    pass:true,sourceAuthenticated:true};
}

function bindCutoffs(p,G){
  const {geometry:g,cutoffs:c,coordinates:{v}}=p,q=(n,d=1)=>G.q(n,d),a=G.sqrt(G.pow(G.div(c.xi,g.r0),2)),
    chi=G.choose(a,q(1,4),q(3,4),G.one,G.step(G.sub(q(3,2),G.mul(q(2),a))),G.zero),
    psi=G.mul(G.step(G.sub(G.div(G.mul(q(20),v),g.Ls),q(4))),G.step(G.sub(q(16),G.div(G.mul(q(20),v),g.Ls)))),
    mass=G.integral(G.pow(chi,2),c.xi,G.neg(g.r0),g.r0),haar=G.mul(q(1,2),g.Dgeom,g.ci,mass),
    cancellation=sourceGraphRationalIdentity(G,G.sub(G.mul(haar,g.Ls),G.mul(g.Dgeom,g.r0,mass)),{atomicNodes:[g.Dgeom,g.ci,g.r0,mass],maxTerms:10000});
  if(chi!==c.chi||psi!==c.psi||mass!==c.transverseMass||haar!==g.haarFactor||!cancellation.pass)fail('INVALID_SOURCE_CONSTRUCTION','The original cutoff branches, full transverse mass or Haar half-factor changed.');
  return {roots:{chi,psi,transverseMass:mass,haarFactor:haar},cancellation,
    plateau:['Ls/4','3Ls/4'],cutoffReduction:'Integral chi(xi)^2 dxi=r0*(1/2+Integral_0^1 sigma(s)^2 ds).',
    originalStep:'sigma(s)=exp(-s^-2)/(exp(-s^-2)+exp(-(1-s)^-2)) on0<s<1; flat values0/1 outside.',
    literalOriginalBranches:true,originalTransverseIntegralNotNormalizedToOne:true,pass:true};
}

function bindMidplane(p,G){
  const q=(n,d=1)=>G.q(n,d),boot=p.operator.background.prepared.bootstrap,full=boot.actualHeat;assertActualHeatLeading(full);
  const heat=full.heat,{X,eta}=boot.constants,c=p.constants,delta=G.fresh('actual_centered_outer_delta'),factorEta=G.fresh('actual_centered_outer_eta'),
    imported=copyOuterFactorProgram(G,p.operator.direction.program,delta,factorEta),
    endpoint=ellOneSourceScalarIdentity(G,imported.roots.Xb,heat.Xb),
    height=ellOneSourceScalarIdentity(G,imported.roots.EpowB,G.mul(G.parameter('Pstar'),G.exp(G.outer.stages.at(-1).logAEnd))),
    zeroAxialCoefficient=G.substitute(imported.roots.outerScaledZ,factorEta,G.zero),
    thetaCoefficient=G.simultaneousSubstitute(imported.roots.outerTheta,[factorEta,delta],[G.zero,q(1,4)]),
    witness=p.roots.witness,parameters=['R','Z','T','Xrep','etaRep','sRep'].map(n=>p.coordinates[n]),
    values=[witness.R,G.zero,G.one,witness.X,G.zero,G.one],at=body=>G.simultaneousSubstitute(body,parameters,values),
    Fbody=G.expressionSystems[G.nodes[p.operator.leadingFields.F].args[0]].body,
    Gbody=G.expressionSystems[G.nodes[p.operator.leadingFields.G].args[0]].body,
    actualN=p.frozen.N.map(at),actualK=p.frozen.K.map(at),Ac=at(p.quantitative.Ac),
    tau=G.neg(G.div(G.add(...actualN.map((n,j)=>G.mul(n,witness.target[j]))),Ac)),
    sourceTargetFactor=p.operator.direction.program.exactFactorization;
  const checks=[
    {id:'private-full-heat-leading-source',pass:true},
    {id:'same-exact-terminal-endpoint-height-and-full-gamma',pass:endpoint.pass&&height.pass&&imported.roots.gamma!==G.zero&&imported.originalParameterExpressionSHA256===p.operator.parameterExpressionSHA256},
    {id:'actual-outer-target-axial-factor-is-zero-at-midplane',pass:zeroAxialCoefficient===G.zero&&sourceTargetFactor.outer==='T0=exp(-4/delta^2)*delta^-3*(outerTheta,delta^6*outerZ)'},
    {id:'original-terminal-witness-and-positive-support',pass:witness.X===G.mul(heat.Xb,G.exp(q(-1,4)))&&witness.R===G.sqrt(G.mul(q(2),witness.X))&&witness.Z===G.zero&&witness.T===G.one&&
      p.support.pass&&p.support.endpoints.Xb===heat.Xb&&G.outer.stages.at(-1)?.id==='terminal'&&G.outer.stages.at(-1)?.length===q(3)},
    {id:'actual-global-axial-support-retains-full-moment-root-limit',pass:full.program.leading.U===full.finalU&&full.program.leading.M===full.finalM&&full.program.leading.V===full.finalV&&
      G.expressionSystems[G.nodes[p.operator.background.prepared.records[0].global.U].args[0]].body===full.finalU&&
      full.program.scope.actualI1UniqueRootLimitCompiled&&full.program.scope.actualFinalGlobalU0M0V0Compiled&&full.values.length===5&&full.values.every(root=>G.nodes[root].op==='actual_quadratic_root')},
    {id:'actual-leading-field-and-frozen-normal-definitions',pass:p.fields.F===p.operator.leadingFields.F&&p.fields.G===p.operator.leadingFields.G&&
      same(p.frozen.g0,[G.mul(p.frozen.Rrep,p.frozen.FR0),p.frozen.GR0])&&p.frozen.gabs===G.sqrt(G.add(...p.frozen.g0.map(x=>G.mul(x,x))))&&
      same(p.frozen.N,p.frozen.g0.map(x=>G.div(x,p.frozen.gabs)))&&same(p.frozen.K,[G.neg(p.frozen.N[1]),p.frozen.N[0]])&&p.operator.direction.ratio.rows.some(x=>x.id==='same-leading-shear-values')},
    {id:'full-actual-target-and-both-viscous-terms-retained',pass:p.target.raw.F===p.operator.background.prepared.records[0].global.F&&p.target.raw.M===full.finalM&&p.target.components.length===2&&p.target.inverseChecks.every(x=>x.pass)},
    {id:'complete-midplane-root-substitution',pass:[...actualN,...actualK,Ac,tau,thetaCoefficient,...witness.target].every(root=>G.freeCoordinates(root).size===0)}];
  if(!checks.every(x=>x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual centered terminal/midplane binding failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return {parameters,values,at,public:{checks,coordinates:{X,eta,delta,factorEta},actualN,actualK,Ac,tau,
    retainedActualTarget:witness.target,actualLeadingBodies:{F:Fbody,G:Gbody},originalFullAxial:{U:full.finalU,M:full.finalM,V:full.finalV,Xv:full.constants.Xv},
    importedOuterFactor:{roots:imported.roots,endpointIdentity:endpoint,heightIdentity:height,thetaCoefficient,zeroAxialCoefficient,sourceKernelCount:imported.sourceKernelCount},
    derivation:{axial:'The private moment-completed global U/M/V are identically zero after their actual Xv. Heat changes E only. The selected witness is after Xplus>Xv and before Xb, so the original leading slow G and all its local slow derivatives vanish. This uses the full moment equations; a compact integrand alone does not annihilate a primitive.',
      normal:'The same source closed-annulus shear proof has -R*F_R/F>0, and F>0. With G_R=0 and R>0, g0=(R*F_R,0) has negative first component. The original normalization therefore gives N=(-1,0), K=(0,-1). These are analytic consequences of the retained full bodies, not numerical substitutions into the graph.',
      target:'The original backward outer stress identity, derived with the full heat and moment restoration, is exp(-4/delta^2)*delta^-3*(b_theta,delta^6*b_z). Its actual copied b_z contains the explicit eta factor and becomes exactly0 at eta=0; b_theta>0 by the source outer direction proof. The physical chart factor is1 at s=1. Thus actual T_z=0,T_theta>0 and tau=T_theta/Ac>0.',
      inverse:'The same frozen N,K and target are used in C. Hence at this witness C*(mass_sign*y_sign/tau)=(1,0), with the source C entry error <=kappa/128. No external target or inverse matrix is supplied.'},
    conclusions:{N:['-1','0'],K:['0','-1'],actualTargetAxial:'0',actualTargetTheta:'STRICTLY_POSITIVE',tau:'STRICTLY_POSITIVE'},pass:true}};
}

export function prepareActualCenteredPulseEnclosure(input={},context={}){
  const request=requestOf(input),selected=prepareActualAdmissibleTerminalCovariance({sourceProfile:request.sourceProfile},context);
  return attachActualCenteredPulseEnclosure(selected,request,context);
}

export function attachActualCenteredPulseEnclosure(selected,input={},context={}){
  assertActualAdmissibleTerminalCovariance(selected);const request=requestOf(input);
  if(request.sourceProfile!==selected.request.sourceProfile)fail('INVALID_SOURCE_CONSTRUCTION','The selected covariance and numerical enclosure must use the same pinned source.');
  const sourceCount=selected.program.nodes.length,G=new CenteredSourceExpressions(disposableThirdJetCacheCopy(selected.G),{maxNodes:3000000,checkCancelled:context.checkCancelled}),
    q=(n,d=1)=>G.q(n,d),sourceBounds=bindSourceBounds(selected,G),sourceCutoffs=bindCutoffs(selected,G);
  progress(context,'centered-source-bounds-and-original-cutoffs',G);
  const mid=bindMidplane(selected,G),{at,parameters,values}=mid,midplane=mid.public,g=selected.geometry,c=selected.constants,v=selected.coordinates.v,v0=G.div(g.Ls,q(2)),
    centerG=at(G.div(G.mul(q(3),selected.frozen.lambda0,G.pow(c.u,2)),G.pow(G.sqrt(G.add(G.one,G.pow(c.u,2))),3))),
    massScale=G.div(G.pow(g.r0,2),G.sqrt(G.mul(centerG,g.Ls))),amplitudeScale=G.div(G.mul(G.sqrt(midplane.tau),G.sqrt(G.sqrt(G.mul(centerG,g.Ls)))),g.r0),
    rows=[];
  progress(context,'centered-terminal-midplane-full-target',G);
  for(const [index,f]of selected.families.entries()){
    context.checkCancelled?.();
    const reference=centeredReferenceGaussianBinding(G,{variable:v,length:g.Ls,u:c.u,lambda0:selected.frozen.lambda0,lambda:f.frame.reference.lambda,dref:f.frame.reference.dref,sign:f.sign}),
      system=G.covarianceSystems[f.system],a=G.covarianceValue(f.system,0,v0,values),b=G.covarianceValue(f.system,1,v0,values),
      centerP=G.substitute(f.P,v,v0),centerT=f.t.map(body=>G.simultaneousSubstitute(body,[v,...parameters],[v0,...values])),
      Bcenter=f.frame.B.map(row=>row.map(body=>G.simultaneousSubstitute(body,[v,...parameters],[v0,...values]))),
      linearCenter=Bcenter.map(row=>G.add(G.mul(row[0],a),G.mul(row[1],b))),
      centerChecks=centerT.map((body,j)=>sourceGraphRationalIdentity(G,G.sub(body,linearCenter[j]),{atomicNodes:[a,b,...Bcenter.flat()],maxTerms:15000})),
      H=selected.roots.witness.H.map(row=>row[index]),mass=at(f.covariance.mass),y=selected.roots.witness.weights[index],
      a2=G.pow(a,2),absoluteMassScale=G.mul(a2,massScale),normalizedMass=G.div(mass,absoluteMassScale),
      normalizedH=[G.div(H[0],G.mul(midplane.Ac,absoluteMassScale)),G.div(H[1],G.mul(c.u,absoluteMassScale))],
      normalizedY=G.div(G.mul(y,absoluteMassScale),midplane.tau),
      weighted=centerT.map(x=>G.mul(G.sqrt(y),x)),normal=G.neg(G.add(...midplane.actualN.map((n,j)=>G.mul(n,weighted[j+1])))),
      signedTangent=G.mul(q(-f.sign),G.add(...midplane.actualK.map((n,j)=>G.mul(n,weighted[j+1])))),
      normalizedWave=[G.div(weighted[0],amplitudeScale),G.div(normal,G.mul(midplane.Ac,amplitudeScale)),G.div(signedTangent,G.mul(c.u,amplitudeScale))],
      centeredH=H.map(x=>G.div(x,a2)),centeredWeight=G.mul(a2,y),centeredT=centerT.map(x=>G.div(x,a)),
      actualMChecks=f.frame.wMatrix.flatMap((row,i)=>row.map((x,j)=>{const expected=G.sub(G.add(f.frame.projectedError[i][j],i===1&&j===1?G.mul(q(-2),f.frame.reference.lambda):G.zero),i===j?G.sub(f.frame.actualDamping,f.frame.reference.dref):G.zero);
        return {row:i,column:j,...sourceGraphRationalIdentity(G,G.sub(x,expected),{atomicNodes:[...f.frame.projected.flat(),f.frame.reference.lambda,f.frame.reference.dref,f.frame.actualDamping],maxTerms:15000})};})),
      algebraAtoms=[...H,a,y,midplane.tau,massScale],centeredColumnChecks=H.map((x,j)=>sourceGraphRationalIdentity(G,G.sub(G.mul(centeredH[j],centeredWeight),G.mul(x,y)),{atomicNodes:algebraAtoms,maxTerms:10000})),
      quotientCheck=sourceGraphRationalIdentity(G,G.sub(G.mul(normalizedY,midplane.tau),G.mul(y,a2,massScale)),{atomicNodes:algebraAtoms,maxTerms:10000}),
      squareScales=sourceGraphRationalIdentity(G,G.sub(G.mul(G.div(g.Ls,centerG),G.mul(centerG,g.Ls)),G.pow(g.Ls,2)),{atomicNodes:[g.Ls,centerG],maxTerms:10000});
    const checks=[
      {id:'same-full-actual-volterra-system',pass:system.variable===v&&same(system.parameters,parameters)&&same(system.matrix,f.frame.wMatrix)&&same(system.initial,[G.one,G.zero])&&system.length===g.Ls&&system.normUpper===c.matrixNorm},
      {id:'actual-positive-center-not-replaced-by-one',pass:G.nodes[a].op==='actual_covariance_volterra'&&a!==G.one&&a!==G.zero&&same(G.nodes[a].args,[f.system,0,v0,values])},
      {id:'exact-full-original-center-amplitude',pass:centerP===G.one&&centerChecks.every(x=>x.pass)},
      {id:'full-stable-matrix-including-moving-frame-and-damping',pass:actualMChecks.every(x=>x.pass)},
      {id:'quadratic-center-column-and-weight-cancellation',pass:centeredColumnChecks.every(x=>x.pass)&&quotientCheck.pass&&squareScales.pass},
      {id:'all-center-and-enclosed-quantity-roots-are-fully-substituted',pass:[a,b,...centerT,mass,y,...normalizedH,normalizedY,...normalizedWave].every(root=>G.freeCoordinates(root).size===0)}];
    if(!checks.every(x=>x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual centered family '+f.sign+' failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
    rows.push({sign:f.sign,system:f.system,reference,center:{time:v0,positiveUncomputedAmplitude:a,otherAmplitude:b,ratio:G.div(b,a),P:centerP,t:centerT,B:Bcenter,bodyChecks:centerChecks},
      retained:{H,mass,y,weightedAmplitude:weighted},centered:{H:centeredH,weight:centeredWeight,t:centeredT},
      roots:{absoluteMassScale,normalizedMass,normalizedH,normalizedY,normalizedWave},actualMChecks,centeredColumnChecks,quotientCheck,squareScales,checks});
    progress(context,'centered-actual-family-bound',G,{sign:f.sign});
  }
  const numerics=encloseCenteredPulseCoefficients({precisionBits:request.precisionBits,tolerance:request.tolerance,maxCutoffCells:request.maxCutoffCells},context),
    roots={sourceWitness:selected.roots.witness,centerTime:v0,curvature:centerG,sourceLength:g.Ls,r0:g.r0,Ac:midplane.Ac,tau:midplane.tau,massScale,amplitudeScale,
      originalCenterAmplitudes:rows.map(r=>r.center.positiveUncomputedAmplitude),normalizedMass:rows.map(r=>r.roots.normalizedMass),
      normalizedH:rows.map(r=>r.roots.normalizedH),normalizedWeights:rows.map(r=>r.roots.normalizedY),normalizedWeightedCenterAmplitude:rows.map(r=>r.roots.normalizedWave)},
    checks=[{id:'unchanged-private-selected-terminal-covariance',pass:true},{id:'positive-original-h-and-source-S-power',pass:sourceBounds.pass},
      {id:'literal-original-cutoffs-and-full-Haar',pass:sourceCutoffs.pass},{id:'full-actual-midplane-target-and-normal',pass:midplane.pass},
      {id:'two-original-full-volterra-center-bindings',pass:rows.length===2&&rows.every(r=>r.checks.every(x=>x.pass))},
      {id:'directed-sigma-Gaussian-C-inverse-and-sqrt-coefficients',pass:numerics.pass&&numerics.rows.every(r=>r.toleranceMet)},
      {id:'source-node-prefix-is-unchanged',pass:same(G.nodes.slice(0,sourceCount),selected.program.nodes)}];
  const proof={kind:'SOURCE_BOUND_CENTERED_NORMALIZATION_WITH_DIRECTED_COEFFICIENT_INTERVALS',
    centeredSolution:'a_sign=w_plus_sign(v0)>0 is the same full source solution at v0=Ls/2. Write t=a_sign*t_tilde and H_sign=a_sign^2*H_tilde_sign. H*y=T gives y_tilde_sign=a_sign^2*y_sign. Positive square-root multiplicativity then gives sqrt(y_sign)*t_sign=sqrt(y_tilde_sign)*t_tilde_sign.',
    Gaussian:numerics.sourceErrorAudit.method,sourceBounds:sourceBounds.derivation,midplane:midplane.derivation,
    mass:'For x=(v-v0)*sqrt(g/Ls), the full normalized longitudinal integral d_sign=Integral psi^2*P^2*(w_plus/a_sign)^2*(1+r)^2 dx differs from sqrt(pi) by less than2^-640. Original finite endpoints and nonconstant coefficients are included in the bound.',
    exactHaar:'The literal identity haar*Ls=Dgeom*r0*Integral chi^2, the source chi reduction Integral chi^2=r0*(1/2+I), and sqrt(Ls/g)*sqrt(g*Ls)=Ls give mass_sign=a_sign^2*r0^2/sqrt(g*Ls) * Dgeom*(1/2+I)*d_sign.',
    exactScales:'Every square root uses a strictly positive actual scale. Define A0=sqrt(tau)*(g*Ls)^(1/4)/r0. At v0 the actual weighted radial component/A0, the normal projection/(Ac*A0), and signed tangent projection/(u*A0) lie in the reported positive rational intervals. The original center amplitude cancels algebraically. tau,g,Ls remain exact unevaluated source factors.',
    numerical:'Machin alternating rational series and integer outward square roots give sqrt(pi); the original sigma-square integral uses whole-cell eighth derivative Taylor remainders and nonzero endpoint tails. All inverse/sqrt operations use directed intervals whose denominators and positive inputs exclude zero. Each resulting coefficient width is checked against the exact requested tolerance.',
    limitations:'The absolute mass/H entries retain a_sign^2, and absolute weights retain its reciprocal. No unscaled high-relative-precision values of these quantities or of tau,g,Ls are asserted. This construction encloses values at one original witness and its pulse center; it does not numerically enclose the full slow/fast jets or curl.'};
  const sourceBinding={sourceProfile:request.sourceProfile,parameterExpressionSHA256:selected.operator.parameterExpressionSHA256,compiler:'prepareActualAdmissibleTerminalCovariance',
    sourceNodeCount:sourceCount,ell:selected.geometry.ell,sourceSelectedEllMinimum:selected.selection.ellMinimum,
    sameActualLeadingCompletedTerminalNeighborhood:true,originalFullTargetAndViscousShears:true,originalNonzeroRoundedCarriers:true,
    exactOriginalHAndFullVolterraLimits:true,originalPositiveExponentRetained:true,unevaluatedCenterValuesRetained:true,normalizedCoefficientConditionsSuppliedByCaller:false};
  const scope={actualSelectedTerminalCovarianceSourceAuthenticated:true,actualCenteredNormalizedMassEnclosed:true,actualCenteredNormalizedHEnclosed:true,
    actualCenteredNormalizedInverseWeightsEnclosed:true,actualScaledWeightedCenterPulseEnclosed:true,originalTransverseMassIncluded:true,
    sourceErrorRemainderNumericallyPositive:true,absoluteHHighRelativePrecision:false,absoluteInverseWeightHighRelativePrecision:false,
    originalCenterAmplitudesNumericallyEvaluated:false,remainingTargetAndGeometryScalesNumericallyEvaluated:false,
    wholePulseTimeDomainNumericallyEnclosed:false,slowOrFastPulseJetsNumericallyEnclosed:false,actualFullCurlNumericalEnclosure:false,
    globalPhysicalResidual:false,wholeGNUMComplete:false,allSourceLabelsCovered:false,newAnalyticLeanKernelProof:false,workerExecution:false,browserExecution:false,m3MayStart:false,
    originalHNumericallyReplacedByZero:false,hNumericallyReplacedByZero:false};
  if(!checks.every(x=>x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The final centered source checks failed.');
  const packed=G.pack(roots,{schema:'MathScope.ActualCenteredPulseEnclosureProgram/1',compiler:'actual-centered-pulse-enclosure.mjs:attachActualCenteredPulseEnclosure',compilerInput:request,
    sourceBinding,sourceBounds,sourceCutoffs,midplane,rows,numerics,checks,proof,scope}),{nodes,...rest}=packed,program={...structuredClone(rest),nodes:nodes.slice()},
    result={G,selected,request,sourceBinding,roots,sourceBounds,sourceCutoffs,midplane,rows,numerics,checks,proof,scope,program};
  assertActualAdmissibleTerminalCovariance(selected);
  seals.set(result,{G,selected,count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),covarianceCount:G.covarianceSystems.length,
    covariance:JSON.stringify(G.covarianceSystems),program,programNodes:program.nodes,metadata:meta(program),serialized:canonicalStringify(program),binding:binding(result)});
  clearDisposableThirdJetCaches(G);progress(context,'centered-actual-numerical-program-sealed',G);return result;
}

export function assertActualCenteredPulseEnclosure(p){
  const s=seals.get(p);if(!s||p.G!==s.G||p.selected!==s.selected||p.program!==s.program||p.program.nodes!==s.programNodes||meta(p.program)!==s.metadata||binding(p)!==s.binding||
    JSON.stringify(p.program.nodes)!==s.nodes||JSON.stringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions)||
    JSON.stringify(s.G.covarianceSystems.slice(0,s.covarianceCount))!==s.covariance)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private original centered source program; copied bounds or modified solution bodies are not numerical certificates.');
  assertActualAdmissibleTerminalCovariance(s.selected);return true;
}

export async function actualCenteredPulseEnclosureCertificateFromProgram(p,context={}){
  assertActualCenteredPulseEnclosure(p);const s=seals.get(p),source=await actualAdmissibleTerminalCovarianceCertificateFromProgram(p.selected,context);context.checkCancelled?.();
  return {schema:'MathScope.ActualCenteredPulseEnclosureCertificate/1',request:p.request,sourceBinding:p.sourceBinding,
    graph:{sha256:await sha256(s.serialized),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength,compiler:p.program.compiler,compilerInput:p.request,
      graphIncluded:false,fixedCompilerPrefix:true,laterGraphAppendsExcluded:true,originalSourceGraph:source.graph},roots:p.roots,
    numerics:p.numerics,checks:p.checks,sourceBounds:p.sourceBounds,sourceCutoffs:p.sourceCutoffs,midplane:p.midplane,
    families:p.rows.map(r=>({sign:r.sign,system:r.system,center:r.center,retained:r.retained,centered:r.centered,roots:r.roots,checks:r.checks,reference:r.reference})),
    proof:p.proof,scope:p.scope,pass:true};
}

export async function actualCenteredPulseEnclosure(input={},context={}){
  return actualCenteredPulseEnclosureCertificateFromProgram(prepareActualCenteredPulseEnclosure(input,context),context);
}
