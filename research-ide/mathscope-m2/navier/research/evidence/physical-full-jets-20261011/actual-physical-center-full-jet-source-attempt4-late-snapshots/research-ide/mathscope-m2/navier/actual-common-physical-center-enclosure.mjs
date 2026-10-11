/** One genuine physical center of the SAME common admissible family.
 * The original first-admissible band is used with a newly chosen permitted
 * terminal representative. Every H/t/target value is evaluated anew there.
 * Older point-specific numerical certificates are not transplanted.
 */
import {prepareActualCommonAdmissibleFamily,assertActualCommonAdmissibleFamily} from './actual-common-admissible-family.mjs';
import {actualCommonAdmissibleBand,assertActualCommonAdmissibleBand,actualCommonAdmissibleBandCertificate} from './actual-common-admissible-band.mjs';
import {ActualInnerCovarianceExpressions} from './actual-inner-covariance-flat-extension.mjs';
import {attachSourcePalette} from './actual-covariance-source-certificate.mjs';
import {assertOriginalSourceTorusMap} from './source-radial-phase-exponent.mjs';
import {fixedLabelSourcePartitionFactor} from './actual-physical-full-curl.mjs';
import {commonExteriorZeroAudit,commonCompletionSupportKernel} from './actual-admissible-terminal-covariance.mjs';
import {actualSupportOrderProof} from './actual-continuation-exact-support.mjs';
import {assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {copyOuterFactorProgram} from './actual-outer-covariance-flat-extension.mjs';
import {retainedOuterTargetFactorEvidence} from './actual-common-target-weighted-norms.mjs';
import {actualMovingPulseFrame,covarianceMatrixAlgebra} from './actual-covariance-matrix.mjs';
import {ellOneSourceScalarIdentity} from './actual-covariance-ell-one-obstruction.mjs';
import {adiabaticProjectedDiagonalAudit,adiabaticTransportIdentityAudit,adiabaticExactBranchNormalizer,adiabaticReplaceExactOperands} from './actual-adiabatic-pulse-center-kernel.mjs';
import {centeredReferenceGaussianBinding} from './actual-centered-pulse-enclosure-kernel.mjs';
import {physicalCenterFrequencyAudit,exactInversePhysicalTorusCenter,physicalCenterCurlAlgebra,physicalCenterCutoffPlateauAudit,enclosePhysicalCenterCoefficients} from './actual-physical-center-kernel.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {clearDisposableThirdJetCaches,disposableThirdJetCacheCopy} from './actual-third-jet-ftc.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile,sourceExponentContract} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),root=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x],
  cross=(G,a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))],
  data=p=>canonicalStringify({request:p.request,sourceBinding:p.sourceBinding,point:p.point,sourceBounds:p.sourceBounds,support:p.support,midplane:p.midplane,
    rows:p.rows,algebra:p.algebra,physical:p.physical,numerics:p.numerics,checks:p.checks,roots:p.roots,proof:p.proof,scope:p.scope});
function progress(context,stage,G,extra={}){context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});}
function requireAll(checks,message){if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION',message+': '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));}

/** The free-coordinate recurrence includes explicit function/Volterra
 * arguments and moving integral limits, and removes bound coordinates.
 * Therefore replacing an absent coordinate is exactly the identity. Keep
 * dependent substitutions and all noncoordinate replacements inherited;
 * in particular no source function body or rounded carrier is simplified.
 */
export class ActualPhysicalCenterExpressions extends ActualInnerCovarianceExpressions{
  substitute(id,variable,value){
    if(id===variable)return value;
    if(this.nodes[variable]?.op==='coordinate'&&!this.freeCoordinates(id).has(variable))return id;
    return super.substitute(id,variable,value);
  }
}

function bindCommonNumericalBounds(band,G){
  const f=band.family,c=band.constants,g=band.geometry,t=f.uniformCovariance.threshold,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    first=f.selector.rows[0],condition=t.conditions.find(r=>r.id==='actual-moving-frame-source-primitives'),contract=sourceExponentContract(),
    ratio=t.direction.ratio,need=id=>ratio.rows.find(r=>r.id===id),audit=physicalCenterFrequencyAudit(),checks=[
      {id:'private-common-family-and-original-first-admissible-band',pass:assertActualCommonAdmissibleFamily(f)&&band.request.ell==='first-admissible'&&g.ell===f.selector.ellA&&band.scope.actualBandInsideExplicitGamma},
      {id:'same-recursive-source-scale-and-band-integer',pass:g.ell===G.ceiling(G.div(G.add(G.log(q(4)),first.logScale),G.log(q(2))))&&
        Array.isArray(first.constraints)&&first.smallBand===G.mul(G.add(t.ellMinimum,q(10)),G.log(q(2)))},
      {id:'same-huge-band-and-source-C2-base',pass:condition?.lower===G.pow(c.Bnorm,512)&&t.ellMinimum===G.ceiling(G.maximum(q(8),t.Sminimum,G.pow(G.div(q(64),c.h),2)))&&g.S===G.pow(g.ell,2)&&c.E===G.pow(c.Bnorm,256)},
      {id:'original-positive-h-dyadic-frequency-and-palette',pass:contract.positive&&contract.notNumericallyReplaced&&contract.upperBoundExact==='2^-4096'&&c.h===G.parameter('h')&&
        g.Q===G.exp(G.neg(G.mul(g.ell,G.log(q(2)))))&&g.epsilon===power(g.Q,c.h)&&g.k===G.ceiling(G.inv(G.sqrt(g.epsilon)))&&
        g.ci===G.mul(power(g.Tg,g.paletteIndex),power(g.Q,G.add(G.one,c.h)))&&g.Ls===G.div(G.mul(q(2),g.r0),g.ci)},
      {id:'same-uniform-leading-growth-and-positive-denominators',pass:need('frozen-growth-values')?.upper==='lambda0<R^83, |g0|<R^75'&&need('frozen-growth-values')?.lower==='lambda0>R^-31, |g0|>R^-20'&&
        need('frozen-normal-and-c0')?.lower==='|N_theta|>R^-14, |c0|>R^-6'&&need('leading-chart-F')?.upper==='R^71'},
      {id:'source-Gaussian-and-Riccati-premises-are-uniform',pass:band.bounds.primitive===f.uniformCovariance.primitiveProof&&band.quantitative.sourceDeterminantScaleLower===f.uniformCovariance.inverse.determinantScaleLower&&
        g.haarFactor===G.mul(q(1,2),g.Dgeom,g.ci,band.cutoffs.transverseMass)&&c.u===G.div(q(2),c.kappa)},
      {id:'all-error-and-frequency-scales-are-source-only',pass:[c.Bnorm,c.E,g.S,g.ell,g.Q,g.epsilon,g.k,g.ci,g.Ls,c.u,c.Renv].every(x=>G.freeCoordinates(x).size===0)},
      {id:'finite-exact-frequency-reserve',pass:audit.pass}
    ];
  requireAll(checks,'The physical-center source numerical premises changed');
  return {checks,contract,audit,roots:{B:c.Bnorm,S:g.S,epsilon:g.epsilon,h:c.h,Ls:g.Ls,u:c.u,Renv:c.Renv},
    derivation:{band:'The literal common recursion contains log b1 >= (ellMinimum+10)*log2. Hence ellA=ceil(log2(4b1))>=ellMinimum+12, S>=B^1024 and ellA>=(64/h)^2. This is this common band, not the earlier terminal numerical band.',
      globalDomain:'ell0=ellMinimum+6, qGlobalStar=2^(-ell0-4). At1/2<Tsharp<2, q=Q*Tsharp<2Q<=qGlobalStar/2.',
      base:'B>=2^128 and B>=Renv^4096. The original source radius and reciprocal are<Renv<B. This follows from the actual annulus geometry Xa<=X<=Xb and the retained Xb<CSelected^11 bound, also used by the private direction ledger.',
      length:'2*r0*S<=Ls<2*r0*Tg*S<S and2*r0=2^-33>B^-1; thus S/B<Ls<S.',
      growth:'Renv^-31<lambda0<Renv^83, u=2Renv^10 and2<=u<B imply B^-1<g=3lambda0*u^2/(1+u^2)^(3/2)<B. Therefore g*Ls>B^1022.',
      cone:'The actual moving-frame and damping errors are at most B^256/S. The SAME invariant cone gives w_plus>0 and |w_minus/w_plus|<=B^260/S<=B^-764.',
      absoluteCenter:'The same band has k>S^8. The actual rounded b=b0+delta_b satisfies |delta_b|<=B^2/S^8 because Rchart>Renv^-1 and Bs>Renv^-40. Every generic adiabatic remainder is uniform in the new terminal midplane representative.',
      numericalReuse:'Only the generic inequalities and directed arithmetic routines are reused. Their point-dependent g, Ac, tau, Bs, F, phase, t and H roots are recomputed below.'},sourceAuthenticated:true,pass:true};
}

function bindSupport(band,G){
  const f=band.family,p=f.prepared,b=p.bootstrap,{X,eta}=b.constants,r=b.orderOne,q=(n,d=1)=>G.q(n,d),support=actualSupportOrderProof(b.completedOrderOne),
    lastU=G.mul(r.X0,G.pow(r.supports[1][1],2)),endpoints=[r.Xminus,r.Xkeep,r.Xcut,b.inner.aSquared,r.X0,r.IposRight,lastU,b.constants.Xv,r.Xplus];
  for(const pair of r.supports)for(const a of pair)endpoints.push(G.mul(r.X0,G.pow(a,2)));
  const observed=p.records.slice(1).map(row=>({order:row.order,roots:['F','U','M','Pi','v'].map(name=>row.global[name]),
    audit:commonExteriorZeroAudit(G,{X,eta,endpoints,roots:['F','U','M','Pi','v'].map(name=>row.global[name])})})),grammar=commonCompletionSupportKernel(G),full=b.actualHeat;
  assertActualHeatLeading(full);
  const delta=G.fresh('physical_center_outer_delta'),factorEta=G.fresh('physical_center_outer_eta'),outer=copyOuterFactorProgram(G,f.uniformCovariance.threshold.direction.program,delta,factorEta),
    endpoint=ellOneSourceScalarIdentity(G,outer.roots.Xb,full.heat.Xb),zeroAxial=G.substitute(outer.roots.outerScaledZ,factorEta,G.zero),
    checks=[{id:'same-original-first-order-support-and-arbitrary-completion-grammar',pass:support.pass&&grammar.pass&&observed.every(r=>r.audit.pass)},
      {id:'same-original-full-heat-leading-and-final-global-axial-moments',pass:full.program.leading.U===full.finalU&&full.program.leading.M===full.finalM&&full.program.leading.V===full.finalV&&
        full.program.scope.actualI1UniqueRootLimitCompiled&&full.program.scope.actualFinalGlobalU0M0V0Compiled&&full.values.length===5},
      {id:'actual-terminal-positive-target-and-axial-factor',pass:endpoint.pass&&zeroAxial===G.zero&&outer.originalParameterExpressionSHA256===f.sourceBinding.parameterExpressionSHA256},
      {id:'full-common-background-source-sums-are-retained',pass:band.background.rows.length===2&&band.background.rows[0].sourceRoots.F===p.records[1].global.F&&
        band.background.completeRadialCutoffCommutatorRetained&&band.target.raw.F===f.leading.F&&band.target.raw.M===full.finalM},
      {id:'original-terminal-after-common-positive-support',pass:G.outer.stages.find(r=>r.id==='interpolation')?.length===G.parameter('Tf')&&same(G.source.parametersExactExpressions.Tf,{integer:128})&&G.outer.stages.at(-1)?.id==='terminal'&&G.outer.stages.at(-1)?.length===q(3)}];
  requireAll(checks,'The common-source terminal support proof changed');
  return {coordinates:{X,eta,delta,factorEta},endpoints:{Xplus:r.Xplus,Xb:r.Xb,Xtail:full.heat.Xtail,Xv:full.constants.Xv},ordering:support,observed,grammar,
    fullHeat:{F:full.heat.finalF,Ecl:full.heat.Ecl,heatArgument:full.heat.heatArgument,U:full.finalU,M:full.finalM,V:full.finalV,gamma:outer.roots.gamma},
    outer:retainedOuterTargetFactorEvidence(outer),endpoint,zeroAxial,checks,pass:true,
    proof:'Every positive-order source profile and every finite derivative is identically zero on X>Xplus by the original common after-branches and full moment equations. Multiplying by this SAME b_n cutoff or its radial commutator leaves zero there. Leading U/M/V vanish after their actual Xv; heat changes only angular E. The full original target is retained and its eta factor gives T_z=0 at eta=0; T_theta>0 follows from the original terminal direction proof. No compact integrand is mistaken for a zero primitive.'};
}

function buildPhysicalPoint(band,G,sourceBounds,support){
  const c=band.constants,g=band.geometry,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),floor=x=>G.neg(G.ceiling(G.neg(x))),
    anchorX=G.mul(support.endpoints.Xb,G.exp(q(-1,4))),anchorR=G.sqrt(G.mul(q(2),anchorX)),anchor=[anchorR,G.zero,G.one],ell6=G.pow(g.ell,6),meshLabels=anchor.map(x=>floor(G.add(G.mul(ell6,x),q(1,2)))),
    template=attachSourcePalette({G,constants:c,geometry:g,coordinates:band.coordinates,families:band.families}),
    originalTorusMapBinding=assertOriginalSourceTorusMap(G,{h:c.h,Tg:g.Tg,physicalMap:template.physicalMap}),
    label=x=>G.simultaneousSubstitute(x,template.grid,meshLabels),
    rectangles=template.rectangleRows.map(row=>({...row,color:label(row.color),center:row.center.map(label),copy:row.copy.map(label),xi:label(row.xi),eta:label(row.eta),v:label(row.v)})),
    anchorYi=template.physicalMap.Yi.map(x=>G.simultaneousSubstitute(x,[band.coordinates.R,band.coordinates.Z,band.coordinates.T],anchor)),
    inverse=exactInversePhysicalTorusCenter(G,{Q:g.Q,Lambda:template.physicalMap.Lambda,Tg:g.Tg,paletteIndex:g.paletteIndex,dr:template.physicalMap.dr,Dgeom:g.Dgeom,
      basis:g.rectangleBasis,center:rectangles[0].center,anchorYi}),
    parameters=['R','Z','T','Xrep','etaRep','sRep'].map(n=>band.coordinates[n]),values=[inverse.slow.R,G.zero,inverse.slow.T,inverse.profile.X,G.zero,inverse.slow.T],
    at=body=>G.simultaneousSubstitute(body,parameters,values),epsilonRadial=power(g.epsilon,q(1,200000)),
    displacement={radial:G.mul(q(12),G.pow(c.Bnorm,2),g.S,epsilonRadial),time:G.mul(q(6),g.S,g.epsilon),
      logProfile:G.mul(q(64),G.pow(c.Bnorm,3),g.S,epsilonRadial),mesh:G.mul(G.pow(g.S,5),epsilonRadial)},
    meshOffsets=[band.coordinates.R,band.coordinates.Z,band.coordinates.T].map((x,j)=>G.sub(G.mul(ell6,x),meshLabels[j])),
    meshAxes=meshOffsets.map(x=>fixedLabelSourcePartitionFactor(G,x)),bandOffset=G.sub(G.neg(G.div(G.log(band.chart.qActual),G.log(q(2)))),g.ell),bandAxis=fixedLabelSourcePartitionFactor(G,bandOffset),
    cutoffBody=G.mul(bandAxis.value,...meshAxes.map(x=>x.value)),cutoffAt=at(cutoffBody),
    otherCenterDifference=rectangles[0].center.map((x,j)=>G.sub(x,rectangles[1].center[j])),otherXi=G.div(G.add(...g.rectangleBasis[0].map((x,j)=>G.mul(x,otherCenterDifference[j]))),g.Dgeom),
    centerDifferenceCheck=sourceGraphRationalIdentity(G,G.sub(otherCenterDifference[0],q(-1,1048576)),{maxTerms:10000}),
    checks=[{id:'same-original-band-map-and-universal-palette',pass:template.palette.pass&&template.torus.pass&&template.palette.commonToAllBandsAndLabels&&rectangles[0].sign===1&&rectangles[1].sign===-1},
      {id:'original-equation-6.2-radial-exponent',pass:originalTorusMapBinding.comparison.sameDrRoot&&originalTorusMapBinding.comparison.allSixExpectedBodiesMatched&&originalTorusMapBinding.parameterBindings.strictPositiveSourceRetained},
      {id:'exact-new-physical-point-inverts-the-original-map',pass:inverse.pass&&inverse.reconstructionChecks.every(r=>r.pass)&&inverse.timeIdentity.pass&&inverse.radiusSquareIdentity.pass},
      {id:'same-terminal-anchor-with-new-permitted-representative',pass:anchorX===G.mul(support.endpoints.Xb,G.exp(q(-1,4)))&&parameters.length===6&&values.length===6&&meshLabels.every(x=>G.freeCoordinates(x).size===0)},
      {id:'other-sign-is-outside-its-original-transverse-support',pass:centerDifferenceCheck.pass&&otherCenterDifference[1]===G.zero&&g.r0===q(1,1n<<34n)&&21n<34n},
      {id:'source-frequency-and-palette-prove-positive-inverse-domain',pass:sourceBounds.audit.pass&&sourceBounds.audit.power>=5&&sourceBounds.audit.bits>=16},
      {id:'point-and-cutoff-have-no-free-slow-or-auxiliary-coordinate',pass:[...values,...Object.values(inverse.physical),cutoffAt].every(x=>G.freeCoordinates(x).size===0)}];
  requireAll(checks,'The new actual physical center did not bind');
  return {at,parameters,values,public:{anchor:{X:anchorX,slow:anchor,usedOnlyToChooseNearestLift:true},meshLabels,templateGrid:template.grid,Yi:template.Yi,
    originalPhysicalMap:template.physicalMap,originalTorusMapBinding,rectangles,inverse,displacement,slowCutoff:{body:cutoffBody,value:cutoffAt,meshAxes,bandAxis,meshOffsets},
    otherSign:{centerDifference:otherCenterDifference,centerDifferenceCheck,xi:otherXi,lowerAbsoluteXi:'2^-21',supportRadius:'2^-34',excluded:true},checks,
    domainProof:{projection:'Each nearest lift coordinate differs from the original anchor Yi by at most1/2. The original vr/vt have l1 norm sqrt2 and Dgeom>1, hence both projected changes have absolute value<1.',
      positiveInverse:'The actual map passes the independent literal original (6.2) binding. Its radial coefficient is >epsilon^(-kappa_s)/(3S)>=epsilon^(-1/200000)/(3S), with original kappa_s=1/100000; Rstar and its reciprocal are<B. The radial anchor exceeds2, so its shifted coordinate is positive. The mean-value estimate in the frequency audit proves the displayed weaker radial bound and the exact inverse exists on r>0.',
      neighborhood:'All displayed positive displacement bounds are <2^-16384. Thus15/16<Tsharp<17/16, 3/16<log(Xb/Xsharp)<5/16, Xplus<Xsharp<Xb, and the exact implicit chart gives s=Tsharp,eta=0.',
      box:'The label is nearest to ell^6*(Rstar,0,1). The new mesh coordinate differs by<1/16, so its offset is in(-9/16,9/16), strictly inside the original support(-3/4,3/4). The selected point may be chosen as the box representative under original(6.8); no lattice-center requirement is introduced.',
      slowCutoff:'The band offset is -log2(Tsharp) with absolute value<1/4 and each mesh bump is positive. Its original complete three-translate denominator stays positive; eta_beta at the actual point is an exact positive source expression.',
      rectangle:'The chosen + rectangle has exact offset0 and v=Ls/2. For the other sign, delta center=(-2^-20,0); Dgeom<2 gives |xi_minus|>2^-21>r0. Every other active label is excluded by the same original all-band palette separation theorem.',
      commonGamma:sourceBounds.derivation.globalDomain},pass:true}};
}

function bindNewMidplane(band,G,point,support){
  const {at}=point,c=band.constants,q=(n,d=1)=>G.q(n,d),full=band.family.prepared.bootstrap.actualHeat,heat=full.heat,
    {X,eta}=band.family.prepared.bootstrap.constants,F=at(band.fields.F),FR=at(G.derivative(band.fields.F,band.coordinates.R)),
    F0=at(band.frozen.F0),FR0=at(band.frozen.FR0),GR=at(G.derivative(band.fields.G,band.coordinates.R)),GR0=at(band.frozen.GR0),
    FZ=at(G.derivative(band.fields.F,band.coordinates.Z)),GZ=at(G.derivative(band.fields.G,band.coordinates.Z)),
    R=point.public.inverse.slow.R,N=band.frozen.N.map(at),K=band.frozen.K.map(at),gabs=at(band.frozen.gabs),lambda0=at(band.frozen.lambda0),c0=at(band.frozen.c0),
    gamma=G.neg(c0),alpha=G.pow(gamma,2),Ac=at(band.quantitative.Ac),target=band.target.components.map(at),
    tau=G.neg(G.div(G.add(...N.map((x,j)=>G.mul(x,target[j]))),Ac)),
    actualS=at(band.chart.s),actualX=at(band.chart.X),actualEta=at(band.chart.eta),sv=G.monotoneSystems[band.chart.system].variable,
    chartAt=G.simultaneousSubstitute(G.monotoneSystems[band.chart.system].body,[band.coordinates.Z,band.coordinates.T],[G.zero,point.public.inverse.slow.T]),
    heatArgument=G.div(G.mul(q(2),G.sub(G.one,G.pow(eta,2))),X),evenHeatAtZero=G.substitute(G.derivative(heatArgument,eta),eta,G.zero),
    y=G.log(G.div(X,heat.Xtail)),rho=G.mul(G.parameter('co'),c.h),fo=G.sub(G.one,G.mul(rho,G.sub(G.one,G.step(G.div(G.sub(y,G.one),q(2)))))),
    Ecl=G.mul(heat.Etail,G.exp(G.neg(G.mul(G.core.A,y))),G.div(fo,G.sub(G.one,rho))),
    radicand=G.nodes[lambda0].op==='sqrt_positive'?G.nodes[lambda0].args[0]:null,
    lambdaCheck=radicand===null?{pass:false}:sourceGraphRationalIdentity(G,G.sub(radicand,G.neg(G.mul(q(2),F0,N[0],G.add(gabs,G.mul(q(2),F0,N[0]))))),{atomicNodes:[F0,N[0],gabs],maxTerms:10000}),
    c0Check=sourceGraphRationalIdentity(G,G.sub(c0,G.div(lambda0,G.mul(q(2),F0,N[0]))),{atomicNodes:[F0,N[0],lambda0],maxTerms:10000}),
    checks=[{id:'same-completed-and-leading-source-on-the-new-open-exterior',pass:support.pass&&support.observed.every(r=>r.audit.pass)&&band.fields.F!==undefined&&band.leadingFields.F!==undefined},
      {id:'original-chart-at-new-T-is-exactly-s-minus-T',pass:chartAt===G.sub(sv,point.public.inverse.slow.T)&&actualEta===G.zero},
      {id:'the-actual-full-terminal-heat-is-even-in-eta',pass:heat.Ecl===Ecl&&heat.heatArgument===heatArgument&&evenHeatAtZero===G.zero&&G.derivative(Ecl,eta)===G.zero},
      {id:'same-full-target-and-new-positive-Rayleigh-roots',pass:lambdaCheck.pass&&c0Check.pass&&band.target.raw.F===band.family.leading.F&&band.target.raw.M===full.finalM&&support.zeroAxial===G.zero},
      {id:'all-new-scalars-are-actually-evaluated-at-the-new-reference',pass:[F,FR,F0,FR0,GR,GR0,FZ,GZ,R,...N,...K,gabs,lambda0,c0,gamma,alpha,Ac,tau,...target,actualS,actualX].every(x=>G.freeCoordinates(x).size===0)}];
  requireAll(checks,'A point-dependent midplane source binding failed');
  return {roots:{F,FR,F0,FR0,GR,GR0,FZ,GZ,R,N,K,gabs,lambda0,c0,gamma,alpha,Ac,tau,target,actualS,actualX,actualEta,originalFo:fo,originalEcl:Ecl,originalHeatArgument:heatArgument},
    chartAt,lambdaCheck,c0Check,checks,pass:true,
    analyticEqualities:{point:'The original chart is evaluated at the new Rsharp,0,Tsharp and the same permitted representative. Uniqueness gives s=Tsharp; the proved positive-radius identity gives X=Xsharp.',
      completedLeading:'Every positive common-family profile and every finite derivative is zero on the certified terminal neighborhood. Thus actual F=F0, FR=FR0 and GR=GR0 there, although their unreduced original source expressions remain distinct nodes.',
      axial:'The actual five moment-completed U/M/V functions vanish after Xv<Xplus. Hence G=GR=GZ=0 on this neighborhood. This is the same full completed source, not a zero axial approximation.',
      evenness:'The original Ecl and gamma density depend on eta only through z=2(1-eta^2)/X; the actual chart is even in Z. Hence FZ=0 at Z=0 for every positive Tsharp in the proved interval.',
      frame:'The uniform original negative FR and positive F imply N=(-1,0), K=(0,-1), gabs=-R*FR. The same positive Rayleigh root gives lambda0^2=2F*(gabs-2F), gamma=-c0>0, lambda0=2F*gamma and gabs=2F*(1+gamma^2).',
      target:'The original full target retains its positive outer theta coefficient and eta factor in its axial coefficient, multiplied by the new positive s^(-A-1/2). Thus target_z=0, target_theta>0 and tau=target_theta/Ac>0.',
      scales:'Ac,g,tau,Bs and every actual Volterra center below use these NEW evaluated roots. No old T=1 or delta=1/4 numerical equality is asserted.'},
    oldPointSpecificCertificateReused:false,sourceZeroIdentitiesRestrictedToOpenTerminalMidplane:true};
}

function bindNewCenterFamily(band,G,point,mid,index,context){
  const f=band.families[index],sign=f.sign,g=band.geometry,c=band.constants,{at,values}=point,q=(n,d=1)=>G.q(n,d),v=band.coordinates.v,v0=G.div(g.Ls,q(2)),
    r=mid.roots,system=G.covarianceSystems[f.system],a=G.covarianceValue(f.system,0,v0,values),bOther=G.covarianceValue(f.system,1,v0,values),
    center=x=>G.simultaneousSubstitute(x,[v,...point.parameters],[v0,...values]),t=f.t.map(center),B=f.frame.B.map(row=>row.map(center)),P=center(f.P),
    centerChecks=t.map((x,j)=>sourceGraphRationalIdentity(G,G.sub(x,G.add(G.mul(B[j][0],a),G.mul(B[j][1],bOther))),{atomicNodes:[a,bOther,...B.flat()],maxTerms:12000})),
    H=band.target.H.map(row=>at(row[index])),mass=at(f.covariance.mass),weight=at(band.target.weights[index]),
    originalInput={F:r.F,FR:r.FR,GR:r.GR,R:r.R,epsilon:g.epsilon,k:g.k,p:at(f.carrier.p),pz:at(f.carrier.pz),x0:at(f.carrier.x0),v,Ls:g.Ls,u:c.u,c0:r.c0,lambda0:r.lambda0,
      HR:at(f.phaseDerivatives.R),HZ:at(f.phaseDerivatives.Z),sign},normalizer=adiabaticExactBranchNormalizer(G),normal=normalizer.normalize,
    input=Object.fromEntries(Object.entries(originalInput).map(([name,value])=>[name,name==='sign'?value:normal(value)])),
    retained=f.frame.wMatrix.map(row=>row.map(at)),normalized=retained.map(row=>row.map(normal)),regenerated=actualMovingPulseFrame(G,input),
    copiedChecks=normalized.flatMap((row,i)=>row.map((x,j)=>ellOneSourceScalarIdentity(G,x,normal(regenerated.wMatrix[i][j])))),
    phaseR=sourceGraphRationalIdentity(G,G.sub(input.HR,normal(G.add(G.mul(originalInput.p,r.FR),G.mul(originalInput.pz,r.GR)))),{atomicNodes:[input.p,input.pz,normal(r.FR),normal(r.GR)],maxTerms:12000}),
    phaseZ=sourceGraphRationalIdentity(G,G.sub(input.HZ,normal(G.add(G.mul(originalInput.p,r.FZ),G.mul(originalInput.pz,r.GZ)))),{atomicNodes:[input.p,input.pz,normal(r.FZ),normal(r.GZ)],maxTerms:12000}),
    tag='new_physical_center_'+(sign===1?'plus':'minus'),formal=Object.fromEntries(['F','gamma','Bs','b','R','epsilon','k','u','Ls','v'].map(n=>[n,G.fresh(tag+'_'+n)])),
    fg=G.mul(q(2),formal.F,G.add(G.one,G.pow(formal.gamma,2))),formalInput={F:formal.F,FR:G.neg(G.div(fg,formal.R)),GR:G.zero,R:formal.R,epsilon:formal.epsilon,k:formal.k,
      p:G.mul(formal.R,formal.Bs,formal.b),pz:G.neg(formal.Bs),x0:G.mul(q(sign,2),formal.Bs,formal.u),v:formal.v,Ls:formal.Ls,u:formal.u,c0:G.neg(formal.gamma),lambda0:G.mul(q(2),formal.F,formal.gamma),
      HR:G.neg(G.mul(formal.Bs,fg,formal.b)),HZ:G.zero,sign},formalFrame=actualMovingPulseFrame(G,formalInput),pairs=Object.keys(input).filter(n=>n!=='sign').map(n=>[input[n],formalInput[n]]),
    rewritten=normalized.map(row=>row.map(x=>adiabaticReplaceExactOperands(G,x,pairs))),rewriteChecks=rewritten.flatMap((row,i)=>row.map((x,j)=>ellOneSourceScalarIdentity(G,normal(x),normal(formalFrame.wMatrix[i][j])))),
    Bs=at(g.Bs),actualB=G.div(input.p,G.mul(r.R,Bs)),b0=G.div(G.mul(q(sign),c.u),G.mul(g.Ls,r.gabs)),
    gaussian=centeredReferenceGaussianBinding(G,{variable:v,length:g.Ls,u:c.u,lambda0:band.frozen.lambda0,lambda:f.frame.reference.lambda,dref:f.frame.reference.dref,sign}),
    n=f.frame.n.map(center),nt=center(f.frame.nt),n0=n[0],ntArgument=G.add(G.pow(n[1],2),G.pow(n[2],2)),constraintDefect=G.div(G.mul(n0,G.sub(G.pow(nt,2),ntArgument)),G.pow(nt,2)),
    constraintChecks=[0,1].map(j=>sourceGraphRationalIdentity(G,G.sub(G.add(...n.map((x,i)=>G.mul(x,B[i][j]))),constraintDefect),{atomicNodes:[...n,nt,center(f.frame.J[1][0])],maxTerms:30000})),
    checks=[{id:'same-original-coupled-system-and-unit-initial-data',pass:system.variable===v&&same(system.parameters,point.parameters)&&same(system.matrix,f.frame.wMatrix)&&same(system.initial,[G.one,G.zero])&&system.length===g.Ls},
      {id:'new-point-full-centers-and-original-moving-frame',pass:P===G.one&&centerChecks.every(x=>x.pass)&&G.nodes[a].op==='actual_covariance_volterra'&&a!==G.one},
      {id:'complete-original-moving-pressure-basis-and-damping-at-new-point',pass:copiedChecks.every(x=>x.pass)&&phaseR.pass&&phaseZ.pass&&rewriteChecks.every(x=>x.pass)},
      {id:'actual-frame-normal-constraint-before-positive-square-rule',pass:constraintChecks.every(x=>x.pass)&&G.nodes[nt].op==='sqrt_positive'},
      {id:'same-nonzero-rounded-angular-carrier-and-positive-Gaussian',pass:f.carrier.nonzeroAngularInteger&&f.carrier.roundingErrorUpper===G.inv(g.k)&&gaussian.pass&&actualB!==b0},
      {id:'new-source-integrals-and-inverse-weights-are-fully-substituted',pass:[a,bOther,...t,...H,mass,weight,Bs,actualB,b0].every(x=>G.freeCoordinates(x).size===0)}];
  requireAll(checks,'The new physical-center family '+sign+' failed');progress(context,'new-physical-center-full-family-'+sign,G);
  return {sign,system:f.system,center:{a,other:bOther,t,B,P,v0},retained:{H,mass,weight,weighted:t.map(x=>G.mul(G.sqrt(weight),x))},
    originalInput,retainedMatrix:retained,regeneratedMatrix:regenerated.wMatrix,copiedChecks,phaseR,phaseZ,
    formalBinding:{formal,formalInput,pairs,rewritten,rewriteChecks,sourceRelations:mid.analyticEqualities,actualMatrixReplaced:false},
    originalCarrier:{p:originalInput.p,pz:originalInput.pz,x0:originalInput.x0,roundedInteger:at(f.carrier.roundedInteger),Bs,b:actualB,b0,deltaB:G.sub(actualB,b0)},
    gaussian,normalConstraint:{n,nt,ntArgument,constraintDefect,constraintChecks,
      rule:'The retained positive nt is sqrt(n_theta^2+n_z^2); therefore nt^2=ntArgument and every B column is perpendicular to n. Its exact linear combination t is perpendicular too.'},
    branchNormalization:normalizer.receipt([...retained.flat(),...regenerated.wMatrix.flat()]),checks};
}

function bindPhysicalCurlValue(band,G,point,mid,rows,scales,context){
  const f=band.families[0],r=rows[0],g=band.geometry,c=band.constants,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    {R,Z,T,theta,v}=band.coordinates,xi=band.cutoffs.xi,v0=r.center.v0,{at,parameters,values}=point,
    speed=at(f.phaseSpeed),p=at(f.carrier.p),pz=at(f.carrier.pz),x0=at(f.carrier.x0),
    angle=G.div(G.sub(G.mul(v0,speed),G.add(G.div(G.mul(pz,G.zero),g.epsilon),G.mul(x0,point.public.inverse.slow.R))),p),
    atCenter=body=>G.simultaneousSubstitute(body,[...parameters,xi,v,theta],[...values,G.zero,v0,angle]),
    phaseAt=atCenter(f.phase),phaseCheck=sourceGraphRationalIdentity(G,phaseAt,{atomicNodes:[p,pz,x0,speed,v0,point.public.inverse.slow.R,g.epsilon],maxTerms:12000}),
    chiAt=atCenter(band.cutoffs.chi),psiAt=atCenter(band.cutoffs.psi),cutoffPlateau=physicalCenterCutoffPlateauAudit(G,{chi:band.cutoffs.chi,psi:band.cutoffs.psi,xi,v,Ls:g.Ls,r0:g.r0}),
    sigma=band.target.squareRootWeights[0],amplitude=G.mul(point.public.slowCutoff.body,G.sqrt(g.epsilon),sigma,band.cutoffs.chi,band.cutoffs.psi),
    normalCross=cross(G,f.frame.n,f.t),C=normalCross.map(x=>G.div(G.mul(amplitude,x),G.mul(g.k,f.frame.nSquared))),
    shared=C.map((body,j)=>G.share(body,[...parameters,xi,v],'ActualPhysicalCenterFullCoefficient_'+j)),
    bodyChecks=shared.map((value,j)=>{const node=G.nodes[value],definition=G.expressionSystems[node.args[0]],materialized=G.materializeExpressionFunction(...node.args);
      return {component:j,body:C[j],shared:value,materialized,bodyBound:definition.body===C[j],pass:materialized===C[j]&&definition.body===C[j]};}),
    radialPrimitive=G.mul(power(point.public.originalPhysicalMap.Lambda,g.paletteIndex),power(G.mul(G.sqrt(g.Q),R),point.public.originalPhysicalMap.dr)),
    radialFast=G.derivative(radialPrimitive,R),Dr=x=>G.add(G.derivative(x,R),G.mul(radialFast,G.derivative(x,xi))),Dz=x=>G.mul(g.epsilon,G.derivative(x,Z)),
    coefficientCurl=[G.neg(Dz(shared[1])),G.sub(Dz(shared[0]),Dr(shared[2])),G.add(Dr(shared[1]),G.div(shared[1],R))],
    leading=cross(G,f.frame.n,C).map(x=>G.neg(G.mul(g.k,x))),cosine=G.cosine(G.mul(g.k,f.phase)),sine=G.sine(G.mul(g.k,f.phase)),
    originalReal=leading.map((x,j)=>G.sub(G.mul(x,cosine),G.mul(coefficientCurl[j],sine))),
    originalAt=originalReal.map(atCenter),cosineAt=atCenter(cosine),sineAt=atCenter(sine),
    zeroPhaseValues=originalAt.map(x=>adiabaticReplaceExactOperands(G,x,[[cosineAt,G.one],[sineAt,G.zero]])),leadingAt=leading.map(atCenter),
    phaseZeroChecks=zeroPhaseValues.map((x,j)=>sourceGraphRationalIdentity(G,G.sub(x,leadingAt[j]),{atomicNodes:leadingAt,maxTerms:15000})),
    n=r.normalConstraint.n,n2=atCenter(f.frame.nSquared),dotNT=G.add(...n.map((x,j)=>G.mul(x,r.center.t[j]))),amplitudeAt=atCenter(amplitude),
    projectionChecks=leadingAt.map((x,j)=>sourceGraphRationalIdentity(G,G.sub(x,G.mul(amplitudeAt,G.sub(r.center.t[j],G.div(G.mul(n[j],dotNT),n2)))),
      {atomicNodes:[...n,...r.center.t,amplitudeAt,g.k],maxTerms:25000})),
    phaseGradient=[G.derivative(f.phase,R),G.div(G.derivative(f.phase,theta),R),G.mul(g.epsilon,G.derivative(f.phase,Z))],normalizer=adiabaticExactBranchNormalizer(G),
    phaseGradientChecks=phaseGradient.map((x,j)=>sourceGraphRationalIdentity(G,normalizer.normalize(G.sub(x,f.frame.n[j])),
      {atomicNodes:[f.carrier.p,f.carrier.pz,f.carrier.x0,...Object.values(f.phaseDerivatives),R,g.epsilon,v],maxTerms:15000})),
    physicalScale=power(g.Q,G.neg(c.A)),physicalValues=r.retained.weighted.map(x=>G.mul(physicalScale,point.public.slowCutoff.value,G.sqrt(g.epsilon),x)),
    componentScales=[scales.A0,G.mul(mid.roots.Ac,scales.A0),G.mul(c.u,scales.A0)].map(x=>G.mul(physicalScale,point.public.slowCutoff.value,G.sqrt(g.epsilon),x)),
    cartesian=[G.sub(G.mul(G.cosine(angle),physicalValues[0]),G.mul(G.sine(angle),physicalValues[1])),
      G.add(G.mul(G.sine(angle),physicalValues[0]),G.mul(G.cosine(angle),physicalValues[1])),physicalValues[2]],
    physicalPoint={r:point.public.inverse.physical.r,theta:angle,z:G.zero,t:point.public.inverse.physical.t,
      x:G.mul(point.public.inverse.physical.r,G.cosine(angle)),y:G.mul(point.public.inverse.physical.r,G.sine(angle))},
    pressureImaginary=G.mul(amplitude,G.add(...f.frame.pressureImaginaryRow.map((x,j)=>G.mul(x,f.t[j])))),originalPressure=G.neg(G.mul(pressureImaginary,sine)),pressureAt=atCenter(originalPressure),
    pressureZero=adiabaticReplaceExactOperands(G,pressureAt,[[sineAt,G.zero]]),
    checks=[{id:'original-angular-carrier-selects-an-exact-zero-phase',pass:phaseCheck.pass&&f.carrier.nonzeroAngularInteger&&G.freeCoordinates(angle).size===0},
      {id:'same-physical-center-fast-cutoffs-are-on-the-original-plateau',pass:cutoffPlateau.pass&&chiAt===cutoffPlateau.chiAt&&psiAt===cutoffPlateau.psiAt&&r.center.P===G.one&&point.public.otherSign.excluded},
      {id:'original-potential-body-is-retained-before-any-derivative',pass:bodyChecks.every(x=>x.pass)&&shared.every(x=>!G.freeCoordinates(x).has(theta))},
      {id:'actual-physical-phase-gradient-is-the-original-moving-normal',pass:phaseGradientChecks.every(x=>x.pass)},
      {id:'complete-curl-phase-zero-projection-is-exact',pass:phaseZeroChecks.every(x=>x.pass)&&projectionChecks.every(x=>x.pass)&&r.normalConstraint.constraintChecks.every(x=>x.pass)},
      {id:'wave-pressure-value-vanishes-only-by-the-proved-zero-phase',pass:pressureZero===G.zero},
      {id:'new-physical-point-and-evaluated-wave-values-are-auxiliary-free',pass:[...Object.values(physicalPoint),...physicalValues,...cartesian,...componentScales].every(x=>G.freeCoordinates(x).size===0)}];
  requireAll(checks,'The full physical curl VALUE did not bind to the new center');progress(context,'new-physical-center-full-real-curl-value',G);
  return {physicalPoint,angle,originalPhase:f.phase,phaseAt,phaseCheck,cutoffPlateau,originalAngularInteger:at(f.carrier.roundedInteger),
    originalPotentialCoefficient:C,shared,bodyChecks,radialPrimitive,radialFast,phaseGradient,phaseGradientChecks,
    coefficientCurl,originalReal,originalAt,cosineAt,sineAt,zeroPhaseValues,leadingAt,phaseZeroChecks,projectionChecks,
    physicalValues,cartesian,componentScales,pressure:{original:originalPressure,at:pressureAt,zeroPhaseValue:pressureZero},checks,
    proof:{actualMap:'The original nearest lift, original physical Yi, original slow chart, chosen box, and original angular carrier are all bound above. Xi=0 and v=Ls/2 result from exact inverse equations, not an arbitrary assignment of auxiliary coordinates.',
      fullCurl:'For C=eta_beta*sqrt(epsilon)*sqrt(y)*chi*psi*(n cross t)/(k*|n|^2), the real potential is -C*sin(kPhi). Its complete cylindrical curl has the retained coefficientCurl term and exact cosine principal part. The proved Phi=0 makes only the VALUE of the sine term zero.',
      constraint:'The original B columns obey n dot B_j=0 by the explicitly retained positive square-root relation. Thus n dot t=0 and the exact vector triple product reduces the principal value to eta_beta*sqrt(epsilon)*sqrt(y)*t.',
      wholeLocalSum:'Every different active label has disjoint enlarged auxiliary support under the same original universal palette. At this chosen center only the + label contributes to the oscillatory sum.',
      cartesian:'The exact angle and orthogonal cylindrical frame are retained. The three directed coefficient intervals are in that actual cylindrical frame; the Cartesian components above are exact rotated interval expressions, not independently rounded high-relative-precision decimals.',
      derivatives:'No derivative of the sine remainder, potential, pressure or nonlinear NS residual is discarded. This certificate encloses a value; the full derivative/residual graph remains a separate construction.'},
    valueOnly:true,actualCartesianFrameRetained:true,unscaledCartesianDecimalEnclosure:false};
}

export function attachActualCommonPhysicalCenterEnclosure(band,input={},context={}){
  assertActualCommonAdmissibleBand(band);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance','centerTolerance','maxCutoffCells','maxNodes'].includes(k)))
    fail('INVALID_INPUT','Only exact numerical controls and a finite graph budget are accepted; the point, band, H, target and error constants are source constructed.');
  const {maxNodes=4000000,...controls}=input;if(!Number.isSafeInteger(maxNodes)||maxNodes<1)fail('INVALID_INPUT','maxNodes is a finite positive resource budget.');
  const numerics=enclosePhysicalCenterCoefficients(controls,context),request={...numerics.request,maxNodes},count=band.G.nodes.length;
  clearDisposableThirdJetCaches(band.G);assertActualCommonAdmissibleBand(band);
  const G=new ActualPhysicalCenterExpressions(disposableThirdJetCacheCopy(band.G),{maxNodes,maxDerivativeOrder:128,checkCancelled:context.checkCancelled}),q=(n,d=1)=>G.q(n,d),
    sourceBounds=bindCommonNumericalBounds(band,G),support=bindSupport(band,G),point=buildPhysicalPoint(band,G,sourceBounds,support),midplane=bindNewMidplane(band,G,point,support);
  progress(context,'new-physical-center-map-support-and-midplane',G);
  const algebra={gaussianReference:null,diagonal:adiabaticProjectedDiagonalAudit(G),transport:adiabaticTransportIdentityAudit(G),curl:physicalCenterCurlAlgebra(G)},
    rows=[0,1].map(i=>bindNewCenterFamily(band,G,point,midplane,i,context)),g=band.geometry,c=band.constants,
    curvature=G.div(G.mul(q(3),midplane.roots.lambda0,G.pow(c.u,2)),G.pow(G.sqrt(G.add(G.one,G.pow(c.u,2))),3)),
    massScale=G.div(G.pow(g.r0,2),G.sqrt(G.mul(curvature,g.Ls))),A0=G.sqrt(G.div(midplane.roots.tau,massScale)),scales={g:curvature,Ls:g.Ls,massScale,A0,Ac:midplane.roots.Ac,u:c.u,tau:midplane.roots.tau},
    scaledRows=rows.map(row=>({sign:row.sign,pulse:[row.center.t[0],G.div(row.center.t[1],midplane.roots.Ac),G.div(row.center.t[2],c.u)],
      weighted:[G.div(row.retained.weighted[0],A0),G.div(row.retained.weighted[1],G.mul(midplane.roots.Ac,A0)),G.div(row.retained.weighted[2],G.mul(c.u,A0))],
      H:[G.div(row.retained.H[0],G.mul(midplane.roots.Ac,massScale)),G.div(row.retained.H[1],G.mul(c.u,massScale))],
      weight:G.div(G.mul(row.retained.weight,massScale),midplane.roots.tau),squareRootWeight:G.div(G.sqrt(row.retained.weight),A0),mass:G.div(row.retained.mass,massScale)})),
    physical=bindPhysicalCurlValue(band,G,point,midplane,rows,scales,context),roots={point:physical.physicalPoint,scales,scaledRows,
      actualH:[0,1].map(j=>rows.map(r=>r.retained.H[j])),actualWeights:rows.map(r=>r.retained.weight),actualCenters:rows.map(r=>r.center.a),
      scaledDeterminant:G.div(point.at(band.target.determinant),G.mul(midplane.roots.Ac,c.u,G.pow(massScale,2))),
      actualFullCurlValue:physical.physicalValues,actualFullCurlCartesianValue:physical.cartesian,positivePhysicalComponentScales:physical.componentScales},
    checks=[{id:'same-private-common-admissible-family-and-own-band',pass:assertActualCommonAdmissibleBand(band)&&band.family===band.commonFamily},
      {id:'source-bound-new-physical-point-support-and-all-positive-scales',pass:sourceBounds.pass&&support.pass&&point.public.pass&&midplane.pass},
      {id:'same-full-coupled-Volterra-H-and-target-at-the-new-point',pass:rows.length===2&&rows.every(r=>r.checks.every(x=>x.pass))},
      {id:'exact-generic-adiabatic-Gaussian-and-curl-algebra-bound',pass:algebra.diagonal.pass&&algebra.transport.pass&&algebra.curl.pass&&rows.every(r=>r.gaussian.pass)},
      {id:'directed-three-component-H-and-weight-coefficients',pass:numerics.pass&&numerics.rows.every(r=>r.toleranceMet)&&numerics.positiveRemaindersRetained},
      {id:'actual-full-curl-value-at-original-physical-map-and-phase',pass:physical.checks.every(r=>r.pass)},
      {id:'every-enclosed-scaled-quantity-is-a-fixed-original-source-expression',pass:scaledRows.every(row=>[...row.pulse,...row.weighted,...row.H,row.weight,row.squareRootWeight,row.mass].every(x=>G.freeCoordinates(x).size===0))&&G.freeCoordinates(roots.scaledDeterminant).size===0},
      {id:'copied-common-band-prefix-remains-unchanged',pass:same(G.nodes.slice(0,count),band.G.nodes.slice(0,count))}];
  requireAll(checks,'The final physical-center source certificate failed');
  const proof={kind:'SOURCE_BOUND_EXACT_PHYSICAL_CENTER_AND_DIRECTED_SCALED_VALUE_ENCLOSURES',
    uniformNumericalArgument:'The original Gaussian, Riccati cone, pressure/Bprime adiabatic diagonal and finite cutoff quadrature proofs hold at every proved terminal midplane point with slow=representative and the same uniform source bounds. The new point is in that domain; all actual center, H, target and geometric scale roots have been evaluated anew.',
    earlierKernelPointLabel:'The frozen generic centered audit prints its first adapter example delta=1/4,s=1. Its displayed Gaussian, cone, frame, target (1,0), length and rounding inequalities use none of these two equalities. The present explicit midplane and support bindings discharge the same mathematical hypotheses at the new point; they do not assert that the old literal example equals this point.',
    scopeOfTransfer:'There is no transfer of an old point-specific numerical value. Only general analytic estimates and independently directed arithmetic are shared. The old delta=1/4,T=1 point enters solely as an anchor for the integer torus lift and mesh label.',
    sign:'At N=(-1,0), K=(0,-1), both radial and theta center components are positive; the axial sign is the original family sign. The full H has positive theta row, positive/negative axial columns and negative determinant. Its actual inverse target weights are positive.',
    exactScales:'The retained positive Ac,u,g,Ls,tau,eta_beta and Q factors are not assigned guessed decimals. Each displayed rational interval encloses the dimensionless coefficient of its explicitly listed positive source factor.',
    physicalValue:physical.proof.fullCurl,physicalCoordinates:physical.proof.actualMap,
    limitations:'Only the actual + physical-center full curl VALUE is numerically enclosed. Both families H/t at the same frozen representative and pulse center are enclosed, but the inactive minus wave is not assigned a second physical point. Slow/fast derivative values, unscaled Cartesian high-relative-precision values, nonlinear residual values, all-label numerical coverage and M3 remain outside this certificate.'};
  const scope={sameCommonAdmissibleFamily:true,actualNewPhysicalCenterConstructed:true,actualOriginalInverseTorusMapBound:true,actualOriginalPhaseZeroBound:true,
    actualThreeComponentPulseCentersEnclosed:true,actualTwoFamilyCovarianceAndInverseScaledEnclosures:true,actualFullPhysicalCurlValueScaledEnclosure:true,
    originalNonzeroRoundedCarrierRetained:true,originalPositiveHAndEpsilonRetained:true,remainingExactPositiveScalesNumericallyEvaluated:false,
    slowOrMixedDerivativeValuesNumericallyEnclosed:false,fastDerivativeValuesNumericallyEnclosed:false,actualFullCurlDerivativeNumericalEnclosure:false,
    unscaledCartesianHighRelativePrecision:false,globalPhysicalResidualNumericallyEnclosed:false,allSourceLabelsNumericallyCovered:false,wholeGNUMComplete:false,
    oldPointCertificateTransplanted:false,hReplacedByZero:false,newLeanKernelProof:false,workerExecution:false,browserExecution:false,m3MayStart:false};
  const sourceBinding={sourceProfile:band.family.request.sourceProfile,parameterExpressionSHA256:band.family.sourceBinding.parameterExpressionSHA256,
    producer:'The unchanged private actual common family and its first-admissible band, with the same b_n and full original completed source.',
    commonSourcePrefixNodeCount:count,selectedBand:g.ell,oldTerminalBandUsed:false,oldDefaultX110UsedAsNumericalPoint:false,
    newRepresentativeAllowedByOriginalEquation:'6.8',newPointAndLabelsInternallyConstructed:true,bothActualSourceHColumnsReevaluated:true},
    result={G,band,family:band.family,request,sourceBinding,point:point.public,sourceBounds,support,midplane,rows,algebra,physical,numerics,checks,roots,proof,scope},
    packed=G.pack(roots,{schema:'MathScope.ActualCommonPhysicalCenterProgram/1',request,sourceBinding,point:point.public,sourceBounds,support,midplane,rows,algebra,physical,numerics,checks,proof,scope});
  result.program=JSON.parse(canonicalStringify(packed));assertActualCommonAdmissibleBand(band);
  seals.set(result,{G,band,family:band.family,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),covarianceCount:G.covarianceSystems.length,
    covariance:canonicalStringify(G.covarianceSystems),data:data(result),program:canonicalStringify(result.program)});
  progress(context,'actual-common-physical-center-source-sealed',G);return result;
}

export function prepareActualCommonPhysicalCenterEnclosure(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','precisionBits','tolerance','centerTolerance','maxCutoffCells','maxNodes'].includes(k)))
    fail('INVALID_INPUT','Use the pinned source and numerical/resource controls only; an actual point, field, H or membership flag cannot be supplied.');
  const {sourceProfile=SOURCE_PROFILE_ID,...numerics}=input;assertSourceProfile(sourceProfile);
  if(numerics.maxNodes!==undefined&&(!Number.isSafeInteger(numerics.maxNodes)||numerics.maxNodes<1))fail('INVALID_INPUT','maxNodes is a finite positive resource budget.');
  const family=prepareActualCommonAdmissibleFamily({sourceProfile,throughOrder:2,derivativeOrder:3,maxNodes:4000000},context),band=actualCommonAdmissibleBand(family,{},context);
  return attachActualCommonPhysicalCenterEnclosure(band,numerics,context);
}
export function assertActualCommonPhysicalCenterEnclosure(p){
  const s=seals.get(p);
  if(!s||p.G!==s.G||p.band!==s.band||p.family!==s.family||data(p)!==s.data||canonicalStringify(p.program)!==s.program||
    canonicalStringify(p.G.nodes.slice(0,s.count))!==s.nodes||!p.G.functionDefinitionsUnchanged(s.definitions)||
    canonicalStringify(p.G.covarianceSystems.slice(0,s.covarianceCount))!==s.covariance)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private actual physical-center construction, not a copied record, changed point, interval or pulse.');
  assertActualCommonAdmissibleBand(s.band);return true;
}
export async function actualCommonPhysicalCenterEnclosureCertificate(p){
  assertActualCommonPhysicalCenterEnclosure(p);const s=seals.get(p),band=await actualCommonAdmissibleBandCertificate(p.band);
  return {schema:'MathScope.ActualCommonPhysicalCenterCertificate/1',request:p.request,sourceBinding:p.sourceBinding,scope:p.scope,
    graph:{sha256:await sha256(s.program),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.program).length,fixedCompilerPrefix:true,originalCommonBandGraph:band.graph},
    point:p.point,sourceBounds:p.sourceBounds,support:p.support,midplane:p.midplane,rows:p.rows,algebra:p.algebra,physical:p.physical,
    numerics:p.numerics,checks:p.checks,roots:p.roots,proof:p.proof,pass:true};
}
