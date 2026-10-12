/** Absolute centers of the original full two-channel pulse at the selected
 * terminal witness. The source matrix is never replaced by its limiting
 * diagonal: its rounded-carrier, moving-pressure, moving-basis, damping
 * and second-channel errors are all bounded before directed evaluation.
 */
import {prepareActualCenteredPulseEnclosure,assertActualCenteredPulseEnclosure,actualCenteredPulseEnclosureCertificateFromProgram} from './actual-centered-pulse-enclosure.mjs';
import {centeredPulseNumericalRequest} from './actual-centered-pulse-enclosure-kernel.mjs';
import {adiabaticProjectedDiagonalAudit,adiabaticTransportIdentityAudit,adiabaticPulseCenterControls,encloseAdiabaticPulseCenters,adiabaticExactBranchNormalizer,adiabaticReplaceExactOperands} from './actual-adiabatic-pulse-center-kernel.mjs';
import {actualMovingPulseFrame} from './actual-covariance-matrix.mjs';
import {ellOneSourceScalarIdentity} from './actual-covariance-ell-one-obstruction.mjs';
import {assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {clearDisposableThirdJetCaches} from './actual-third-jet-ftc.mjs';
import {directedArithmetic,rational as Q,readRational,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  metadata=p=>{const{nodes,...rest}=p;return canonicalStringify(rest);},
  binding=p=>canonicalStringify({request:p.request,sourceBinding:p.sourceBinding,roots:p.roots,sourceBounds:p.sourceBounds,midplane:p.midplane,rows:p.rows,algebra:p.algebra,numerics:p.numerics,rescalingChecks:p.rescalingChecks,checks:p.checks,proof:p.proof,scope:p.scope});
function progress(context,stage,G,extra={}){context.checkCancelled?.();context.onProgress?.({stage,nodes:G.nodes.length,...extra});}
function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','precisionBits','tolerance','centerTolerance','maxCutoffCells'].includes(k)))
    fail('INVALID_INPUT','Only the pinned source and exact directed numerical controls are accepted. No center, matrix, carrier, reference point or error premise is supplied by the caller.');
  const{sourceProfile=SOURCE_PROFILE_ID,centerTolerance='1/10000000000000000000000000000000000000000',...rest}=input;assertSourceProfile(sourceProfile);
  const controls=centeredPulseNumericalRequest(rest),center=adiabaticPulseCenterControls({precisionBits:controls.precisionBits,tolerance:centerTolerance});
  return {sourceProfile,...controls,centerTolerance:center.tolerance};
}

function sourcePrimitiveBounds(p,G){
  const source=p.selected,c=source.constants,g=source.geometry,selection=source.selection,q=(n,d=1)=>G.q(n,d),powReal=(x,a)=>G.exp(G.mul(a,G.log(x))),
    rows=source.operator.direction.ratio.rows,need=id=>rows.find(r=>r.id===id),growth=need('frozen-growth-values'),normal=need('frozen-normal-and-c0'),field=need('leading-chart-F');
  const checks=[
    {id:'private-centered-source-and-positive-h',pass:p.sourceBounds.pass&&p.sourceBounds.contract.positive&&p.sourceBounds.contract.notNumericallyReplaced},
    {id:'exact-original-dyadic-and-rounded-frequency',pass:g.Q===G.exp(G.neg(G.mul(g.ell,G.log(q(2)))))&&g.epsilon===powReal(g.Q,c.h)&&g.k===G.ceiling(G.inv(G.sqrt(g.epsilon)))},
    {id:'same-strong-ell-frequency-condition',pass:selection.ellMinimum===G.ceiling(G.maximum(q(8),selection.Sminimum,G.pow(G.div(q(64),c.h),2)))&&g.ell===G.add(selection.ellMinimum,q(8))&&g.S===G.pow(g.ell,2)},
    {id:'actual-leading-growth-and-denominator-range',pass:growth?.upper==='lambda0<R^83, |g0|<R^75'&&growth?.lower==='lambda0>R^-31, |g0|>R^-20'&&normal?.upper==='v_s<R^18, |c0|<R^10'&&normal?.lower==='|N_theta|>R^-14, |c0|>R^-6'&&field?.upper==='R^71'},
    {id:'actual-positive-Bs-square-root-and-original-damping-scale',pass:g.Bs===G.sqrt(G.div(source.frozen.lambda0,G.mul(g.epsilon,G.pow(g.k,2),G.pow(G.sqrt(G.add(G.one,G.pow(c.u,2))),3))))},
    {id:'frozen-error-scales-independent-of-the-pulse',pass:[c.Bnorm,g.S,g.Ls,g.k,g.epsilon,c.u].every(root=>G.freeCoordinates(root).size===0)}];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','An absolute-center source primitive changed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  return {checks,roots:{B:c.Bnorm,S:g.S,Ls:g.Ls,k:g.k,epsilon:g.epsilon,u:c.u,Renv:c.Renv,h:c.h},pass:true,
    exactFrequency:{lower:'k>S^8',proof:'log(k)>=h*ell*log(2)/2. The same original ell maximum implies h*sqrt(ell)>=64. Since log2>1/2 and log(ell)<sqrt(ell) for ell>=8, log(k)>16*log(ell)=8*log(S). No floor/ceiling is replaced by a decimal.'},
    primitiveRanges:{u:'2<=u=2*Renv^10<B',gabs:'Renv^-20<gabs<Renv^75, hence B^-1<gabs<B',lambda0:'0<lambda0<Renv^83<B',
      inverseNormalScale:'Rchart>Renv^-1, Bs>Renv^-40, hence1/(Rchart*Bs)<Renv^41<B^2',length:'S/B<=Ls<=S',sourceNorm:'B>=2^128 and B>=Renv^4096',sourceScale:'S>=B^1024'},
    boundsAppliedTo:'The same selected actual band and fixed terminal representative; no new ell or frequency is requested.',originalPositiveParametersNumericallyEvaluated:false};
}

function midplaneReduction(p,G){
  const source=p.selected,operator=source.operator,full=operator.background.prepared.bootstrap.actualHeat;assertActualHeatLeading(full);
  const heat=full.heat,{X,eta}=operator.background.prepared.bootstrap.constants,q=(n,d=1)=>G.q(n,d),c=source.constants,
    parameters=['R','Z','T','Xrep','etaRep','sRep'].map(n=>source.coordinates[n]),w=source.roots.witness,
    values=[w.R,G.zero,G.one,w.X,G.zero,G.one],at=body=>G.simultaneousSubstitute(body,parameters,values),
    F=at(source.fields.F),FR=at(G.derivative(source.fields.F,source.coordinates.R)),GR=at(G.derivative(source.fields.G,source.coordinates.R)),
    FZ=at(G.derivative(source.fields.F,source.coordinates.Z)),GZ=at(G.derivative(source.fields.G,source.coordinates.Z)),
    F0=at(source.frozen.F0),FR0=at(source.frozen.FR0),GR0=at(source.frozen.GR0),N=source.frozen.N.map(at),K=source.frozen.K.map(at),
    gabs=at(source.frozen.gabs),lambda0=at(source.frozen.lambda0),c0=at(source.frozen.c0),gamma=G.neg(c0),alpha=G.pow(gamma,2),f=G.mul(q(2),F),
    tailY=G.log(G.div(X,heat.Xtail)),rho=G.mul(G.parameter('co'),c.h),fo=G.sub(G.one,G.mul(rho,G.sub(G.one,G.step(G.div(G.sub(tailY,G.one),q(2)))))),
    Ecl=G.mul(heat.Etail,G.exp(G.neg(G.mul(G.core.A,tailY))),G.div(fo,G.sub(G.one,rho))),
    argument=G.div(G.mul(q(2),G.sub(G.one,G.pow(eta,2))),X),argumentEtaAtZero=G.substitute(G.derivative(argument,eta),eta,G.zero),
    chart=operator.chart,sv=G.monotoneSystems[chart.system].variable,powReal=(x,a)=>G.exp(G.mul(a,G.log(x))),
    chartEquation=G.sub(G.sub(sv,G.mul(G.pow(source.coordinates.Z,2),powReal(sv,G.mul(q(2),c.h)))),source.coordinates.T),
    chartAtMidplane=G.simultaneousSubstitute(chartEquation,[source.coordinates.Z,source.coordinates.T],[G.zero,G.one]),
    lambdaArgument=G.nodes[lambda0].op==='sqrt_positive'?G.nodes[lambda0].args[0]:null,
    lambdaCheck=lambdaArgument===null?{pass:false}:sourceGraphRationalIdentity(G,G.sub(lambdaArgument,G.neg(G.mul(f,N[0],G.add(gabs,G.mul(f,N[0]))))),{atomicNodes:[F,N[0],gabs],maxTerms:10000}),
    c0Check=sourceGraphRationalIdentity(G,G.sub(c0,G.div(lambda0,G.mul(f,N[0]))),{atomicNodes:[F,N[0],lambda0],maxTerms:10000}),
    leadingCall=G.nodes[operator.background.prepared.records[0].global.F],leadingDefinition=leadingCall?.op==='actual_expression_partial'?G.expressionSystems[leadingCall.args[0]]:null;
  const checks=[
    {id:'same-private-full-heat-and-terminal-neighborhood',pass:p.midplane.pass&&source.support.pass&&source.support.allPositiveOrdersCertifiedByCommonSupport&&w.X===G.mul(heat.Xb,G.exp(q(-1,4)))},
    {id:'same-leading-values-at-frozen-representative',pass:F===F0&&FR===FR0&&GR===GR0&&source.fields.F===operator.leadingFields.F&&source.fields.G===operator.leadingFields.G},
    {id:'original-leading-profile-is-full-heat-F',pass:leadingDefinition?.body===heat.finalF},
    {id:'original-terminal-step-and-positive-full-heat-evenness',pass:heat.Ecl===Ecl&&heat.heatArgument===argument&&argumentEtaAtZero===G.zero&&G.derivative(Ecl,eta)===G.zero&&
      G.outer.stages.at(-1)?.id==='terminal'&&G.outer.stages.at(-1)?.length===q(3)&&p.midplane.importedOuterFactor.zeroAxialCoefficient===G.zero},
    {id:'original-monotone-chart-gives-exact-midplane-s-one',pass:G.monotoneSystems[chart.system].body===chartEquation&&chartAtMidplane===G.sub(sv,G.one)},
    {id:'same-source-global-moment-restored-axial-zero-exterior',pass:p.midplane.originalFullAxial.U===full.finalU&&p.midplane.originalFullAxial.M===full.finalM&&p.midplane.originalFullAxial.V===full.finalV&&
      same(p.midplane.conclusions.N,['-1','0'])&&same(p.midplane.conclusions.K,['0','-1'])},
    {id:'original-positive-Rayleigh-root-and-c0-definitions',pass:lambdaCheck.pass&&c0Check.pass&&same(source.frozen.g0,[G.mul(source.frozen.Rrep,source.frozen.FR0),source.frozen.GR0])},
    {id:'every-source-primitive-is-pulse-independent-at-the-witness',pass:[F,FR,GR,FZ,GZ,F0,gabs,lambda0,c0,gamma,alpha,w.R].every(root=>G.freeCoordinates(root).size===0)}];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The exact absolute-center midplane reduction failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  return {at,parameters,values,public:{checks,pass:true,roots:{F,FR,GR,FZ,GZ,F0,FR0,GR0,R:w.R,N,K,gabs,lambda0,c0,gamma,alpha,twiceF:f,originalTerminalFo:fo,originalTerminalEcl:Ecl,originalHeatArgument:argument,argumentEtaAtZero,chartAtMidplane},
    lambdaCheck,c0Check,
    analyticEqualities:{source:'The exact same original leading slow F is used at the representative and evaluation point; every positive-order field vanishes on the shared open terminal exterior.',
      axial:'The same privately moment-restored U/M/V vanish identically after Xv. The selected terminal neighborhood lies after Xplus>Xv. Thus actual G=G_R=G_Z=0, with their full original roots retained.',
      evenness:'On the original terminal stage all preceding local repairs have ended, and the complete F is Ecl(X)*H(2*(1-eta^2)/X)/sqrt(2X). Ecl and the original gamma density are eta independent. The heat factor is even in eta. The unique original chart s-Z^2*s^(2h)-T=0 is even in Z. At Z=0,T=1 this proves F_Z=0 and s=1 on the actual smooth chart.',
      frame:'The source FR is negative, hence with GR=0, N=(-1,0),K=(0,-1),gabs=-R*FR. The retained positive square root gives lambda0^2=2F*(gabs-2F); c0=-lambda0/(2F). Thus gamma=-c0>0, alpha=gamma^2, lambda0=2F*gamma, gabs=2F*(1+alpha).',
      phase:'p and pz are frozen in slow coordinates. HR=p*FR+pz*GR=-(Bs*gabs)*b and HZ=p*FZ+pz*GZ=0, with b=p/(R*Bs). No phase carrier is replaced by its unrounded value.'},
    actualSourceExpressionsReplacedByNumericalZero:false,sourceZeroIdentitiesRestrictedToOpenTerminalMidplane:true}};
}

function bindFamily(p,G,mid,index,context){
  const source=p.selected,family=source.families[index],sign=family.sign,g=source.geometry,c=source.constants,{at}=mid,
    {F,FR,GR,R,gabs,lambda0,c0,gamma,alpha}=mid.public.roots,v=source.coordinates.v,q=(n,d=1)=>G.q(n,d),
    originalInput={F,FR,GR,R,epsilon:g.epsilon,k:g.k,p:at(family.carrier.p),pz:at(family.carrier.pz),x0:at(family.carrier.x0),v,Ls:g.Ls,u:c.u,c0,lambda0,
      HR:at(family.phaseDerivatives.R),HZ:at(family.phaseDerivatives.Z),sign},
    normalization=adiabaticExactBranchNormalizer(G),normal=normalization.normalize,input=Object.fromEntries(Object.entries(originalInput).map(([name,value])=>[name,name==='sign'?value:normal(value)])),
    retained=family.frame.wMatrix.map(row=>row.map(at)),normalizedRetained=retained.map(row=>row.map(normal)),regenerated=actualMovingPulseFrame(G,input),
    normalizedRegenerated=regenerated.wMatrix.map(row=>row.map(normal)),
    copiedChecks=normalizedRetained.flatMap((row,i)=>row.map((body,j)=>({row:i,column:j,originalLeft:retained[i][j],originalRight:regenerated.wMatrix[i][j],...ellOneSourceScalarIdentity(G,body,normalizedRegenerated[i][j])}))),
    phaseR=sourceGraphRationalIdentity(G,G.sub(input.HR,normal(G.add(G.mul(originalInput.p,FR),G.mul(originalInput.pz,GR)))),{atomicNodes:[input.p,input.pz,normal(FR),normal(GR)],maxTerms:12000}),
    phaseZ=sourceGraphRationalIdentity(G,G.sub(input.HZ,normal(G.add(G.mul(originalInput.p,mid.public.roots.FZ),G.mul(originalInput.pz,mid.public.roots.GZ)))),{atomicNodes:[input.p,input.pz,normal(mid.public.roots.FZ),normal(mid.public.roots.GZ)],maxTerms:12000}),
    Bs=at(g.Bs),b=G.div(input.p,G.mul(R,Bs)),b0=G.div(G.mul(q(sign),c.u),G.mul(g.Ls,gabs)),deltaB=G.sub(b,b0),
    s=G.mul(q(sign),c.u,G.add(q(1,2),G.div(v,g.Ls))),sa=G.add(G.mul(q(sign,2),c.u),G.mul(v,gabs,b)),d=G.mul(gabs,b),
    Ds=G.add(G.one,G.pow(s,2)),Dn=G.add(G.one,G.pow(sa,2),G.pow(b,2)),t=G.sqrt(G.add(G.one,G.pow(b,2))),
    lambda=G.div(lambda0,G.sqrt(Ds)),dampDifference=G.mul(G.div(lambda0,G.pow(G.sqrt(G.add(G.one,G.pow(c.u,2))),3)),G.sub(Dn,Ds)),
    exactClosedM11=G.sub(G.add(G.neg(G.div(G.mul(sa,d),Dn)),G.neg(G.div(G.mul(s,q(sign),c.u),G.mul(q(2),g.Ls,Ds))),
      G.mul(G.div(lambda,q(2)),G.sub(G.add(G.div(G.mul(Ds,t),Dn),G.inv(t)),q(2)))),dampDifference),
    principalTransport=G.mul(q(-3,2),G.div(G.mul(s,q(sign),c.u),G.mul(g.Ls,Ds))),actualCenter=p.rows[index].center.positiveUncomputedAmplitude,
    originalSystem=G.covarianceSystems[family.system];
  // A symbolic substitution into the complete ACTUAL matrix verifies that
  // the generic diagonal lemma consumes these very fields and connections.
  // It is not a numerical/source substitution: every actual root above is
  // retained, and the new formal b stands for the exact p/(R*Bs), not b0.
  const tag='adiabatic_source_'+(sign===1?'plus':'minus'),formal={F:G.fresh(tag+'_F'),gamma:G.fresh(tag+'_gamma'),Bs:G.fresh(tag+'_Bs'),b:G.fresh(tag+'_b'),
    R:G.fresh(tag+'_R'),epsilon:G.fresh(tag+'_epsilon'),k:G.fresh(tag+'_k'),u:G.fresh(tag+'_u'),Ls:G.fresh(tag+'_Ls'),v:G.fresh(tag+'_v')},
    formalG=G.mul(q(2),formal.F,G.add(G.one,G.pow(formal.gamma,2))),formalInput={F:formal.F,FR:G.neg(G.div(formalG,formal.R)),GR:G.zero,R:formal.R,epsilon:formal.epsilon,k:formal.k,
      p:G.mul(formal.R,formal.Bs,formal.b),pz:G.neg(formal.Bs),x0:G.mul(q(sign,2),formal.Bs,formal.u),v:formal.v,Ls:formal.Ls,u:formal.u,c0:G.neg(formal.gamma),lambda0:G.mul(q(2),formal.F,formal.gamma),
      HR:G.neg(G.mul(formal.Bs,formalG,formal.b)),HZ:G.zero,sign},names=Object.keys(input).filter(k=>k!=='sign'),
    formalFrame=actualMovingPulseFrame(G,formalInput),formalPairs=names.map(k=>[input[k],formalInput[k]]),
    substituted=normalizedRetained.map(row=>row.map(root=>adiabaticReplaceExactOperands(G,root,formalPairs))),
    rewriteChecks=substituted.flatMap((row,i)=>row.map((body,j)=>({row:i,column:j,...ellOneSourceScalarIdentity(G,normal(body),normal(formalFrame.wMatrix[i][j]))}))),
    formalNormalSquare=G.mul(G.pow(formal.Bs,2),G.add(G.one,G.pow(formal.b,2),G.pow(G.add(G.mul(q(sign,2),formal.u),G.mul(formal.v,formalG,formal.b)),2))),
    normalSquareIdentity=sourceGraphRationalIdentity(G,G.sub(formalFrame.nSquared,formalNormalSquare),
      {atomicNodes:[formal.Bs,formalG,formal.b,formal.u,formal.v],maxTerms:12000});
  const checks=[
    {id:'same-complete-actual-matrix-after-frozen-point-substitution',pass:copiedChecks.every(c=>c.pass)},
    {id:'original-phase-R-and-Z-differentiation',pass:phaseR.pass&&phaseZ.pass},
    {id:'complete-original-matrix-symbolically-matches-midplane-lemma',pass:rewriteChecks.every(c=>c.pass)},
    {id:'positive-normal-scale-cancels-quadratically-before-frame-normalization',pass:normalSquareIdentity.pass},
    {id:'same-positive-center-full-Volterra-system-and-initial-data',pass:originalSystem.variable===v&&same(originalSystem.matrix,family.frame.wMatrix)&&same(originalSystem.initial,[G.one,G.zero])&&originalSystem.length===g.Ls&&
      same(G.nodes[actualCenter].args,[family.system,0,p.roots.centerTime,mid.values])&&G.nodes[actualCenter].op==='actual_covariance_volterra'},
    {id:'unrounded-carrier-used-only-in-a-retained-error-difference',pass:family.carrier.roundingErrorUpper===G.inv(g.k)&&b!==b0&&deltaB!==G.zero&&[input.p,input.pz,input.x0,Bs,b,b0].every(root=>G.freeCoordinates(root).size===0)},
    {id:'actual-enclosed-center-has-no-free-coordinate',pass:G.freeCoordinates(actualCenter).size===0}];
  const branchNormalization=normalization.receipt([...retained.flat(),...regenerated.wMatrix.flat(),originalInput.HR,originalInput.HZ]);
  if(checks.some(c=>!c.pass))throw Object.assign(Error('The absolute-center family '+sign+' failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', ')),
    {code:'INVALID_SOURCE_CONSTRUCTION',details:{sign,checks,copiedChecks,phaseR,phaseZ,rewriteChecks,branchNormalization}});
  progress(context,'adiabatic-original-family-diagonal-bound',G,{sign});
  return {sign,system:family.system,actualCenter,retainedMatrix:retained,regeneratedMatrix:regenerated.wMatrix,normalizedRetainedMatrix:normalizedRetained,normalizedRegeneratedMatrix:normalizedRegenerated,
    originalInput,branchNormalization,copiedChecks,phaseR,phaseZ,
    primitives:{...input,Bs,b,b0,deltaB,s,sa,sPrime:G.div(G.mul(q(sign),c.u),g.Ls),actualSlopePrime:d,gabs,gamma,alpha,Ds,Dn,t},
    roots:{exactClosedM11,principalTransport,dampDifference,fullDiagonalRemainder:G.sub(retained[0][0],principalTransport),unroundedCarrier:at(family.carrier.pTilde),roundedInteger:at(family.carrier.roundedInteger)},
    formalBodyBinding:{formal,formalInput,formalPairs,substituted,formalMatrix:formalFrame.wMatrix,rewriteChecks,normalSquareIdentity,
      actualBodyUnchanged:true,formalCarrierIsExactNormalizedRoundedCarrier:true,zeroHigherJetsOrRoundingErrorAssumed:false,
      exactAllEqualBranchCongruenceApplied:true,wholeSourceOperandsRewrittenSimultaneously:true,
      positiveScaleRule:'Bs>0 implies sqrt(Bs^2*(1+b^2))=Bs*sqrt(1+b^2); normal/Aphi/B/Bleft/Bprime reduce to the generic exact lemma with every connection term retained.'},
    checks};
}

function propagate(p,centerNumerics,request){
  const A=directedArithmetic(request.precisionBits),center=A.unpack(centerNumerics.values.center),a2=A.unpack(centerNumerics.values.centerSquared),ia2=A.unpack(centerNumerics.values.inverseCenterSquared),
    old=p.numerics.values,mass=A.mul(a2,A.unpack(old.normalizedMass)),theta=old.normalizedCovarianceTheta.map(x=>A.mul(a2,A.unpack(x))),z=old.normalizedCovarianceZ.map(x=>A.mul(a2,A.unpack(x))),
    weight=old.normalizedInverseWeight.map(x=>A.mul(ia2,A.unpack(x))),one=A.widen(A.one(),Q(1,1n<<8192n)),radial=A.mul(center,one),
    outputs={absoluteCenter:[center,center],absoluteCenterSquared:[a2,a2],massWithoutUnknownCenter:[mass,mass],covarianceThetaWithoutUnknownCenter:theta,covarianceZWithoutUnknownCenter:z,
      inverseWeightWithoutUnknownCenter:weight,absoluteRadialCenter:[radial,radial]},rows=[];
  for(const[name,boxes]of Object.entries(outputs))for(const[index,box]of boxes.entries()){
    const width=Q(box[1]-box[0],A.S),tolerance=name==='absoluteCenter'||name==='absoluteCenterSquared'||name==='absoluteRadialCenter'?request.centerTolerance:request.tolerance;
    if(qcompare(width,readRational(tolerance))>0)fail('PRECISION_REQUIRED','The propagated '+name+' interval exceeds its requested tolerance.');
    rows.push({name,index,interval:A.pack(box),width:qtext(width),tolerance,toleranceMet:true});
  }
  if(mass[0]<=0n||weight.some(x=>x[0]<=0n)||radial[0]<=0n)fail('PRECISION_REQUIRED','An original mass, weight or center lost its positive denominator.');
  return {schema:'MathScope.ActualAdiabaticCenterPropagatedNumerics/1',center:centerNumerics,rows,values:Object.fromEntries(Object.entries(outputs).map(([k,boxes])=>[k,boxes.map(x=>A.pack(x))])),
    normalization:{absoluteCenter:'w_plus_sign(Ls/2), from the full original coupled Volterra solution',mass:'mass_sign/(r0^2/sqrt(g*Ls))',
      covarianceTheta:'Htheta_sign/(Ac*r0^2/sqrt(g*Ls))',covarianceZ:'Hz_sign/(u*r0^2/sqrt(g*Ls))',inverseWeight:'y_sign*r0^2/(tau*sqrt(g*Ls))',
      absoluteRadialCenter:'t_r_sign(Ls/2), where the exact original P(Ls/2)=1',centerFactorsNowNumericallyEnclosed:true,targetAndGeometryScalesRemainExact:true},
    sourceGaussianAndCutoffErrorBudget:p.numerics.errorBudget,positiveSquareRootDomainsAndConditionBounds:p.numerics.stability,
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,additionalOperations:A.operations(),binary64UsedForDecisions:false},
    everyOutputWidthChecked:true,wholeGNUMComplete:false};
}

export function prepareActualAdiabaticPulseCenterEnclosure(input={},context={}){
  const request=requestOf(input),{centerTolerance,...centeredInput}=request;
  encloseAdiabaticPulseCenters({precisionBits:request.precisionBits,tolerance:centerTolerance});
  return attachActualAdiabaticPulseCenterEnclosure(prepareActualCenteredPulseEnclosure(centeredInput,context),{centerTolerance},context);
}

export function attachActualAdiabaticPulseCenterEnclosure(centered,input={},context={}){
  assertActualCenteredPulseEnclosure(centered);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='centerTolerance'))fail('INVALID_INPUT','The private centered source determines every field and coefficient request; only an exact centerTolerance can be added.');
  const request=requestOf({...centered.request,...input}),G=centered.G,sourceCount=centered.program.nodes.length,q=(n,d=1)=>G.q(n,d),sourceBounds=sourcePrimitiveBounds(centered,G),mid=midplaneReduction(centered,G),
    algebra={diagonal:adiabaticProjectedDiagonalAudit(G),transport:adiabaticTransportIdentityAudit(G)};
  progress(context,'adiabatic-positive-source-and-exact-diagonal-algebra',G);
  const rows=centered.rows.map((_,i)=>bindFamily(centered,G,mid,i,context)),centerNumerics=encloseAdiabaticPulseCenters({precisionBits:request.precisionBits,tolerance:request.centerTolerance}),
    numerics=propagate(centered,centerNumerics,request),u=centered.selected.constants.u,
    ratio=G.div(G.add(G.one,G.div(G.pow(u,2),q(4))),G.add(G.one,G.pow(u,2))),exactReferenceCenter=G.sqrt(G.sqrt(G.pow(ratio,3))),
    roots={originalCenters:rows.map(r=>r.actualCenter),originalOtherCenters:centered.rows.map(r=>r.center.otherAmplitude),originalCenterSquared:rows.map(r=>G.pow(r.actualCenter,2)),
      exactReferenceCenter,centerTime:centered.roots.centerTime,massScale:centered.roots.massScale,Ac:centered.roots.Ac,tau:centered.roots.tau,u,
      scaledMass:centered.rows.map(r=>G.div(r.retained.mass,centered.roots.massScale)),
      scaledH:centered.rows.map(r=>[G.div(r.retained.H[0],G.mul(centered.roots.Ac,centered.roots.massScale)),G.div(r.retained.H[1],G.mul(u,centered.roots.massScale))]),
      scaledWeights:centered.rows.map(r=>G.div(G.mul(r.retained.y,centered.roots.massScale),centered.roots.tau)),absoluteRadialCenter:centered.rows.map(r=>r.center.t[0])},
    rescalingChecks=centered.rows.flatMap((r,i)=>{
      const atoms=[r.actualCenter,...r.retained.H,r.retained.mass,r.retained.y,centered.roots.massScale,centered.roots.Ac,centered.roots.tau,u,r.center.positiveUncomputedAmplitude].filter(Number.isSafeInteger),
        a2=roots.originalCenterSquared[i],audit=x=>sourceGraphRationalIdentity(G,x,{atomicNodes:atoms,maxTerms:15000});
      return [{id:'actual-mass-center-factor-'+i,...audit(G.sub(roots.scaledMass[i],G.mul(a2,r.roots.normalizedMass)))},
        ...[0,1].map(j=>({id:'actual-H-center-factor-'+i+'-'+j,...audit(G.sub(roots.scaledH[i][j],G.mul(a2,r.roots.normalizedH[j])))})),
        {id:'actual-inverse-center-factor-'+i,...audit(G.sub(roots.scaledWeights[i],G.div(r.roots.normalizedY,a2)))}];
    }),checks=[
      {id:'unchanged-private-centered-original-source',pass:true},{id:'source-strong-frequency-and-positive-primitive-bounds',pass:sourceBounds.pass},
      {id:'original-midplane-fields-phase-and-Rayleigh-identities',pass:mid.public.pass},
      {id:'complete-pressure-basis-diagonal-and-transport-algebra',pass:algebra.diagonal.pass&&algebra.transport.pass},
      {id:'both-original-full-matrix-and-center-bindings',pass:rows.length===2&&rows.every(r=>r.checks.every(c=>c.pass))},
      {id:'nonzero-source-remainders-and-directed-absolute-centers',pass:centerNumerics.pass&&centerNumerics.errorAudit.pass&&numerics.rows.every(r=>r.toleranceMet)},
      {id:'exact-original-H-mass-and-inverse-rescaling',pass:rescalingChecks.every(c=>c.pass)},
      {id:'all-enclosed-source-roots-are-fully-substituted',pass:[...roots.originalCenters,...roots.scaledMass,...roots.scaledH.flat(),...roots.scaledWeights,...roots.absoluteRadialCenter].every(root=>G.freeCoordinates(root).size===0)},
      {id:'unchanged-authenticated-source-node-prefix',pass:same(G.nodes.slice(0,sourceCount),centered.program.nodes)}];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The final absolute-center binding failed.');
  const proof={kind:'SOURCE_BOUND_EXACT_ADIABATIC_DIAGONAL_AND_DIRECTED_ABSOLUTE_CENTER',
    midplane:mid.public.analyticEqualities,diagonal:algebra.diagonal.identity,transport:algebra.transport,
    errorDerivation:centerNumerics.errorAudit.derivation,
    fullSolution:'The invariant cone is proved for the same full original system and w_plus(0)=1. Integrating its actual scalar logarithmic equation includes M12*w_minus/w_plus. The limiting diagonal is an explicit comparison, never the actual matrix or a substituted solution.',
    originalRounding:'At slow=representative, b=b0+delta_b with b0=sign*u/(Ls*gabs). The unrounded tilt controls only a difference bound. The actual p, nonzero rounded integer, pz, positive epsilon, h and ell remain in the original system and every exact center root.',
    sourceNormalization:'An appended exact congruence identifies each original all-equal smooth-piecewise branch with its common value; every original matrix, rounding value and nonconstant branch is retained. Simultaneous replacement of complete operands then verifies all four complete matrix entries against the same actualMovingPulseFrame routine with the source midplane identities. Positive Bs removes only a common normal scale. The generic hyperbola proof applies to every finite exact b, including the retained rounded one.',
    bound:'The actual log center differs from log Aref by at most halfLog>0. Aref differs from1/(2sqrt2) by at most3/u^2>0. The combined absolute radius is bounded by2^-8192. Directed BigInt square roots and outward arithmetic enclose each actual center, its square and inverse square.',
    covariance:'Multiply the earlier directed source-normalized mass/H intervals by these actual a_sign^2 intervals, and divide the inverse coefficients by them. This removes the previously uncomputed Volterra center factors. The original positive massScale, Ac, u and tau remain exact expressions.',
    limitations:'Only the two full centers and radial pulse amplitude at this fixed original terminal witness are absolutely numerically enclosed. H/y coefficients still retain their explicit positive target and geometric scales. Slow/mixed/fast derivative values, the full physical curl numerical enclosure, all labels and global residual are not certified here.'};
  const sourceBinding={sourceProfile:request.sourceProfile,parameterExpressionSHA256:centered.sourceBinding.parameterExpressionSHA256,
    compiler:'prepareActualCenteredPulseEnclosure -> attachActualAdiabaticPulseCenterEnclosure',sourceNodeCount:sourceCount,selectedEll:centered.selected.geometry.ell,
    sameOriginalFullVolterraLimit:true,exactRoundedAngularCarrierRetained:true,actualPositiveHAndEpsilonRetained:true,actualMatrixNotReplacedByComparison:true,
    scalarAntiderivativeEvaluatedExactly:true,unknownCenterFactorsNumericallyEnclosed:true};
  const scope={actualOriginalFullPulseCentersNumericallyEnclosed:true,actualOriginalRadialCenterAmplitudeEnclosed:true,actualAbsoluteCenterSquaredAndInverseEnclosed:true,
    actualHMassInverseCoefficientsWithoutUnknownCenterEnclosed:true,originalPositiveParametersRetained:true,wholeSourceNumericalErrorBudgetIncludesCoupledMode:true,
    remainingTargetAndGeometryScalesNumericallyEvaluated:false,absoluteHHighRelativePrecision:false,absoluteInverseWeightHighRelativePrecision:false,
    slowOrMixedPulseDerivativeValuesNumericallyEnclosed:false,fastPulseDerivativeValuesNumericallyEnclosed:false,actualFullCurlNumericalEnclosure:false,
    wholePulseTimeDomainNumericallyEnclosed:false,allSourceLabelsCovered:false,globalPhysicalResidual:false,wholeGNUMComplete:false,newLeanKernelProof:false,workerExecution:false,browserExecution:false,m3MayStart:false,
    hNumericallyReplacedByZero:false,roundedCarrierReplacedByUnrounded:false};
  const packed=G.pack(roots,{schema:'MathScope.ActualAdiabaticPulseCenterEnclosureProgram/1',compiler:'actual-adiabatic-pulse-center-enclosure.mjs:attachActualAdiabaticPulseCenterEnclosure',compilerInput:request,
    sourceBinding,sourceBounds,midplane:mid.public,rows,algebra,numerics,rescalingChecks,checks,proof,scope}),{nodes,...rest}=packed,program={...structuredClone(rest),nodes:nodes.slice()},
    result={G,centered,request,roots,sourceBinding,sourceBounds,midplane:mid.public,rows,algebra,numerics,rescalingChecks,checks,proof,scope,program};
  assertActualCenteredPulseEnclosure(centered);
  seals.set(result,{G,centered,count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),covarianceCount:G.covarianceSystems.length,
    covariance:JSON.stringify(G.covarianceSystems),program,programNodes:program.nodes,metadata:metadata(program),serialized:canonicalStringify(program),binding:binding(result)});
  clearDisposableThirdJetCaches(G);progress(context,'adiabatic-actual-center-program-sealed',G);return result;
}

export function assertActualAdiabaticPulseCenterEnclosure(p){
  const s=seals.get(p);if(!s||p.G!==s.G||p.centered!==s.centered||p.program!==s.program||p.program.nodes!==s.programNodes||metadata(p.program)!==s.metadata||binding(p)!==s.binding||
    JSON.stringify(p.program.nodes)!==s.nodes||JSON.stringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions)||
    JSON.stringify(s.G.covarianceSystems.slice(0,s.covarianceCount))!==s.covariance)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private actual absolute-center program, not a copied report or changed source body.');
  assertActualCenteredPulseEnclosure(s.centered);return true;
}

export async function actualAdiabaticPulseCenterEnclosureCertificateFromProgram(p,context={}){
  assertActualAdiabaticPulseCenterEnclosure(p);const s=seals.get(p),centered=await actualCenteredPulseEnclosureCertificateFromProgram(p.centered,context);context.checkCancelled?.();
  return {schema:'MathScope.ActualAdiabaticPulseCenterEnclosureCertificate/1',request:p.request,sourceBinding:p.sourceBinding,
    graph:{sha256:await sha256(s.serialized),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength,compiler:p.program.compiler,compilerInput:p.request,
      fixedCompilerPrefix:true,laterGraphAppendsExcluded:true,graphIncluded:false,originalCenteredSourceGraph:centered.graph},roots:p.roots,sourceBounds:p.sourceBounds,midplane:p.midplane,
    families:p.rows,algebra:p.algebra,numerics:p.numerics,rescalingChecks:p.rescalingChecks,checks:p.checks,proof:p.proof,scope:p.scope,pass:true};
}

export async function actualAdiabaticPulseCenterEnclosure(input={},context={}){
  return actualAdiabaticPulseCenterEnclosureCertificateFromProgram(prepareActualAdiabaticPulseCenterEnclosure(input,context),context);
}
