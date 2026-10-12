/** Original homogeneous pulse tails and their exact positive Gaussian bound.
 * The executed amplitude is the private admissible terminal source, not an
 * approximate Gaussian. All-label mesh geometry is authenticated separately
 * from the still-required all-label amplitude/residual assembly.
 */
import {prepareActualAdmissibleTerminalCovariance,assertActualAdmissibleTerminalCovariance,actualAdmissibleTerminalCovarianceCertificateFromProgram} from './actual-admissible-terminal-covariance.mjs';
import {originalPulseTimeCutoff,differentiatedOriginalPulseTail,originalPulseTimeCutoffBounds,gaussianFlatSummabilityRecipe} from './actual-gaussian-flat-tail-kernel.mjs';
import {homogeneousPulseGaussianPowerAudit,normalizedHomogeneousPulseBinding} from './actual-pulse-gaussian-power-kernel.mjs';
import {ActualCovarianceExpressions} from './actual-covariance-volterra.mjs';
import {clearDisposableThirdJetCaches,disposableThirdJetCacheCopy} from './actual-third-jet-ftc.mjs';
import {attachSourcePalette,attachActualSlowPartition} from './actual-covariance-source-certificate.mjs';
import {assertSourceSquaredProductPartition} from './actual-covariance-global-assembly.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {sourceExponentContract} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),
  metadata=p=>{const {nodes,...rest}=p;return canonicalStringify(rest);},
  data=p=>canonicalStringify({request:p.request,coordinates:p.coordinates,rows:p.rows,bounds:p.bounds,geometry:p.geometry,roots:p.roots,checks:p.checks,domain:p.domain,proof:p.proof,scope:p.scope,sourceBinding:p.sourceBinding}),
  progress=(context,stage,G)=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length});},
  binomial=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));

/** An independent coordinate has exactly zero derivative, including the
 * retained constant branches of frozen labels. Only this copied graph uses
 * the shortcut; no source node or original function definition is changed.
 */
export class ActualGaussianPulseExpressions extends ActualCovarianceExpressions {
  derivative(id,variable){if(!this.dependsOn(id,variable))return this.zero;return super.derivative(id,variable);}
}

export function prepareActualPulseGaussianTail(input={},context={}){
  return attachActualPulseGaussianTail(prepareActualAdmissibleTerminalCovariance(input,context),context);
}

export function attachActualPulseGaussianTail(source,context={}){
  assertActualAdmissibleTerminalCovariance(source);const p=source;clearDisposableThirdJetCaches(p.G);assertActualAdmissibleTerminalCovariance(p);
  const G=new ActualGaussianPulseExpressions(disposableThirdJetCacheCopy(p.G),{maxNodes:3000000,checkCancelled:context.checkCancelled}),sourceCount=p.program.nodes.length,q=(n,d=1)=>G.q(n,d),
    order=2,{v,R,Z,T}=p.coordinates,{Ls,ell,S,r0}=p.geometry,{Bnorm:B,Renv,u}=p.constants,
    E=G.pow(B,256),Ed=E,Lmin=p.geometry.lengthRatioBounds[0],Lmax=p.geometry.lengthRatioBounds[1],
    W=G.exp(G.mul(G.add(G.mul(q(2),E),Ed),Lmax)),lambdaLower=G.pow(Renv,-31),gaussianLower=G.div(lambdaLower,G.mul(q(4),u)),
    a=G.div(G.mul(gaussianLower,Lmin),q(16)),powerAudit=homogeneousPulseGaussianPowerAudit({order}),cutoffBounds=originalPulseTimeCutoffBounds(G,{order}),
    tConstants=powerAudit.powers.t.map(power=>G.mul(G.pow(B,power),W)),uniformTailConstants=Array.from({length:order+1},(_,m)=>G.add(...Array.from({length:m+1},(_,j)=>G.mul(q(binomial(m,j)),cutoffBounds.rows[j+1].coefficient,tConstants[m-j])))),
    tailConstantsWithLength=Array.from({length:order+1},(_,m)=>G.add(...Array.from({length:m+1},(_,j)=>G.mul(q(binomial(m,j)),cutoffBounds.rows[j+1].coefficient,G.pow(Ls,-j-1),tConstants[m-j])))),
    gaussianAtCutoff=G.exp(G.neg(G.mul(a,S))),rows=[];
  progress(context,'gaussian-original-bound-constants',G);
  for(const family of p.families){
    progress(context,'gaussian-matrix-binding-start-'+family.sign,G);
    const system=G.covarianceSystems[family.system],binding=normalizedHomogeneousPulseBinding(G,{v,length:Ls,lambda:family.frame.reference.lambda,dref:family.frame.reference.dref,
      damping:family.frame.actualDamping,projected:family.frame.projected,error:family.frame.projectedError,matrix:system.matrix,P:family.P,initial:system.initial},context);
    progress(context,'gaussian-matrix-binding-done-'+family.sign,G);
    const originalCutoff=originalPulseTimeCutoff(G,v,Ls),components=family.t.map((amplitude,j)=>{
      progress(context,'gaussian-tail-component-start-'+family.sign+'-'+j,G);
      // The shared operation retains the exact original body and every free
      // coordinate. It keeps the independent product-rule comparison small;
      // the full actual derivatives are materialized and checked just below.
      const parameters=[...new Set([v,...G.freeCoordinates(amplitude)])].sort((a,b)=>a-b),
        shared=G.share(amplitude,parameters,'ActualGaussianOriginalAmplitude_'+family.sign+'_'+j),
        system=G.nodes[shared].args[0],result=differentiatedOriginalPulseTail(G,{v,length:Ls,psi:p.cutoffs.psi,forcing:G.zero,amplitude:shared,order},context),
        materializations=[];
      let raw=amplitude;
      for(let m=0;m<=order;m++){
        progress(context,'gaussian-original-amplitude-materialize-'+family.sign+'-'+j+'-'+m,G);
        if(m)raw=G.derivative(raw,v);
        const orders=parameters.map(x=>x===v?m:0),jet=G.expressionValue(system,parameters,orders),
          materialized=G.materializeExpressionFunction(system,parameters,orders),
          sameRetainedBody=materialized===raw,sharedJetIsExact=result.amplitudeJets[m]===jet;
        if(!sameRetainedBody||!sharedJetIsExact)fail('INVALID_SOURCE_CONSTRUCTION','A shared original pulse jet differs from its retained actual derivative body.');
        materializations.push({order:m,sharedJet:jet,materialized,rawActualDerivative:raw,sameRetainedBody,sharedJetIsExact});
      }
      result.originalAmplitudeBinding={body:amplitude,shared,system,parameters,materializations,callerJetsAccepted:false,bodyChanged:false};
      progress(context,'gaussian-tail-component-done-'+family.sign+'-'+j,G);return result;
    }),
      envelopeSlowIndependent=[R,Z,T].map(variable=>({variable,independent:!G.dependsOn(family.P,variable)})),
      supportMapped=components.map(component=>component.rows.map(row=>G.choose(v,G.zero,Ls,G.zero,row.direct,G.zero)));
    rows.push({sign:family.sign,system:family.system,originalAmplitude:family.t,originalP:family.P,originalLogP:family.logP,binding,originalCutoff,components,envelopeSlowIndependent,supportMapped,
      homogeneousForcing:G.zero,actualSourceInitial:system.initial,finiteDisplayApproximationUsed:false,
      tail:'psi_prime*t, with all original pulse derivatives; homogeneous f is exactly zero, so only the first term of (7.40) vanishes.',
      zeroExtension:'psi_prime and every positive derivative vanish near v=0 and v=Ls. Extend the differentiated localized tail by zero there; no temporal zero extension of bare t is asserted.'});
    progress(context,'gaussian-actual-pulse-sign-'+family.sign,G);
  }
  // Reuse the source operator's rectangle basis, while retaining this new
  // small-q geometry, chart and both independently constructed pulse systems.
  const geometryView={...p.operator,G,geometry:{...p.operator.geometry,...p.geometry},coordinates:p.coordinates,chart:p.chart,constants:p.constants,families:p.families},
    auxiliary=attachSourcePalette(geometryView),actualPartition=attachActualSlowPartition(geometryView),
    Xb=p.support.endpoints.Xb,coordinateBounds=[G.mul(q(2),G.sqrt(Xb)),q(2),q(2)],
    boxCountCoefficient=G.mul(...coordinateBounds.map(bound=>G.add(G.mul(q(2),bound),q(3)))),signedBoxCountCoefficient=G.mul(q(2),boxCountCoefficient),
    signedBoxCountAtBand=G.mul(signedBoxCountCoefficient,G.pow(ell,18)),
    flat=gaussianFlatSummabilityRecipe(G,{gaussian:a,polynomialOrder:0,powerLoss:0,flatOrder:10,firstBand:p.selection.ellMinimum}),
    meshSum=gaussianFlatSummabilityRecipe(G,{gaussian:a,polynomialOrder:18,powerLoss:0,flatOrder:10,firstBand:p.selection.ellMinimum}),
    gaussianIdentity=sourceGraphRationalIdentity(G,G.sub(a,G.div(G.mul(r0,lambdaLower),G.mul(q(32),u))),{atomicNodes:[lambdaLower,u]}),
    constants=[W,a,...tConstants,...uniformTailConstants,...cutoffBounds.rows.map(r=>r.coefficient),boxCountCoefficient,signedBoxCountCoefficient,flat.roots.constant,meshSum.roots.constant,meshSum.roots.tail];
  progress(context,'gaussian-all-label-geometry',G);
  const geometry={auxiliary,actualPartition,coordinateBounds,boxCountCoefficient,signedBoxCountCoefficient,signedBoxCountAtBand,
    meshCountPower:18,maximumPositiveSlowLabelsAtPoint:16,maximumSignedLabelsAtPoint:32,candidateSlowLabels:actualPartition.labels.length,
    countProof:'A source box at band ell has mesh center a/ell^6 and intersects |R|<=2sqrt(Xb), |Z|<=2, |T|<=2. Thus |a_j|<=M_j ell^6+3/4. Each coordinate has at most (2M_j+3)ell^6 integers; the product contributes ell^18. Multiply by two sign rectangles only once.',
    pointOverlapProof:'The original one-dimensional bump has strict support |x-j|<3/4. At most two integers are positive at each real x. One band factor and three mesh factors therefore give at most 2^4=16 positive beta labels, each with two signs. All boundary jets are zero, so the same count bounds nonzero fixed-label derivative terms.',
    sourcePaletteOnlyKillsDifferentLabels:true,sameLabelNonlinearProductsRetained:true};
  const checks=[
    {id:'unchanged-private-selected-terminal-source',pass:assertActualAdmissibleTerminalCovariance(p)},
    {id:'unchanged-actual-source-prefix',pass:same(G.nodes.slice(0,sourceCount),p.program.nodes)},
    {id:'original-positive-h-not-rounded',pass:sourceExponentContract().positive&&sourceExponentContract().notNumericallyReplaced&&p.constants.h===G.parameter('h')},
    {id:'both-original-full-Volterra-systems-and-envelopes',pass:rows.length===2&&rows.every((r,i)=>same(r.originalAmplitude,p.families[i].t)&&r.originalP===p.families[i].P&&r.binding.checks.every(c=>c.pass)&&same(r.actualSourceInitial,[G.one,G.zero]))},
    {id:'original-normalized-moving-matrix-body',pass:rows.every((r,i)=>same(G.covarianceSystems[r.system].matrix,p.families[i].frame.wMatrix))},
    {id:'same-source-norm-and-admissible-selector-premises',pass:p.checks.some(c=>c.id==='source-Bnorm-has-the-fixed-all-band-definition'&&c.pass)&&p.checks.some(c=>c.id==='actual-source-frame-and-concentration-premises-consumed'&&c.pass)&&p.selection.selectedCertifiedDomainMember},
    {id:'original-cutoff-and-all-tail-derivatives-through-two',pass:rows.every(r=>r.originalCutoff.psi===p.cutoffs.psi&&r.components.every(c=>c.rows.length===3&&c.rows.every(j=>j.identity.pass&&j.forcingTail===G.zero)&&c.originalAmplitudeBinding.materializations.every(j=>j.sameRetainedBody&&j.sharedJetIsExact)))},
    {id:'fixed-representative-envelope-has-no-slow-derivative',pass:rows.every(r=>r.envelopeSlowIndependent.every(c=>c.independent))},
    {id:'uniform-fixed-positive-constants-have-no-free-coordinate',pass:constants.every(root=>G.freeCoordinates(root).size===0)},
    {id:'original-Gaussian-tail-distance-and-palette-length',pass:gaussianIdentity.pass&&same(p.geometry.lengthRatioBounds,[G.mul(q(2),r0),G.mul(q(2),r0,p.geometry.Tg)])&&p.selection.conditions.some(c=>c.id==='pulse-length-at-least-one')},
    {id:'complete-original-label-palette-and-actual-partition',pass:auxiliary.palette.pass&&auxiliary.palette.commonToAllBandsAndLabels&&actualPartition.labels.length===81&&assertSourceSquaredProductPartition(G,actualPartition.partition)&&actualPartition.noIndependentOffsetCoordinates},
    {id:'finite-fast-derivative-power-and-positive-infinite-tail',pass:powerAudit.pass&&flat.pass&&meshSum.pass&&meshSum.roots.tail!==G.zero}
  ];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','An original Gaussian pulse-tail source binding failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const bounds={order,sourceNorm:B,E,Ed,Lmin,Lmax,lambdaLower,gaussianLower,a,W,powerAudit,cutoffBounds,tConstants,uniformTailConstants,tailConstantsWithLength,gaussianAtCutoff,gaussianIdentity,flat,meshSum,
    actualFastJets:'For this private actual terminal source, ||D_v^j t||_infinity<=tConstants[j]*P(v). The source norm and lower bounds are uniform over its declared same-box domain and both signs.',
    actualLocalizedTail:'For m=0,1,2, ||D_v^m(psi_prime*t)||_infinity<=uniformTailConstants[m]*exp(-a*ell^2). The sharper bound keeps the displayed powers of Ls.',
    signedAllMeshSeries:'If every actual label amplitude obeys these same source constants, its signed per-band absolute sum is bounded by signedBoxCountCoefficient*uniformTailConstants[m]*ell^18*exp(-a*ell^2). The exact positive infinite tail and q^N constant are displayed; uniform authentication of every amplitude is a separate source assembly obligation.'};
  const domain={source:p.proof.boundaries.local,selectedBand:p.geometry.ell,selectedQ:p.geometry.Q,selectedBelowSourceQStar:p.selection.wholeSelectedPhysicalBandBelowSourceQStar??p.decision.wholeSelectedPhysicalBandBelowSourceQStar,
    slowPoint:'The same open terminal annulus Xplus<X<Xb, same representative box, |Delta(R,Z,T)|<=4/S^3, 1/2<=s<=2, |eta|<=1.',
    pulse:'0<=v<=Ls; the tail and every temporal derivative extend by zero because its temporal support is separated from both endpoints.',
    sourceMesh:'The unchanged entire integer mesh and palette; 81 candidates describe one local evaluation, not 81 evaluations of this one pulse.'};
  const proof={
    amplitude:'The private source supplies the exact projected moving matrix, damping, nonzero initial datum and original P. The checked decomposition has first diagonal zero and second diagonal -2lambda, up to E_actual-(d-dref)I. Its infinity logarithmic norm is at most (2E+Ed)/S, so the full Volterra limit satisfies ||w||<=W. No finite partial sum is used.',
    jets:'The finite power ledger differentiates the original n, K, Aphi, U, J, B, Bleft and projected matrix. All divisions retain the original uniform normal/c0 lower bounds. Apply w_(m+1)=sum binom M_(j)w_(m-j), P_prime=(lambda-dref)P, then t=B*P*w. Constants depend on the requested finite order; the small-q threshold does not change.',
    cutoff:'The original psi=sigma_2(20v/Ls-4)*sigma_2(16-20v/Ls) equals one on [Ls/4,3Ls/4]. Every differentiated tail term includes a positive psi derivative and is supported at distance at least Ls/4 from the midpoint. Hence P<=exp(-gaussianLower*Ls/16)<=exp(-a*ell^2), with a=r0*Renv^-31/(32u)>0.',
    originalStep:'Each fixed step derivative is bounded by 1+integral_0^1(sigma_2^(j+1))^2, by FTC and Cauchy-Schwarz. Leibniz gives the exact cutoff constants, including powers 20^j and the inverse length. The latter is at most one because the original selector imposes Ls>=1.',
    countAndFlat:'The all-integer mesh count and finite palette are independent of the pulse instance. Gaussian decay beats each prescribed ell power and q inverse power by the displayed completed Young square. The positive infinite tail uses (J+d)^2-J^2>=(2J+1)d. This arithmetic never sets a tail to zero.',
    limits:'This packet establishes the actual bare homogeneous tail and fast-v jets on the authenticated terminal domain. Covariance square-root/slow-cutoff derivatives, all-label amplitude authentication, physical pullback losses, same-label nonlinear products and the final global residual remain separate.'};
  const scope={actualSelectedTerminalHomogeneousPulse:true,actualFullVolterraSolutionUsed:true,actualOriginalTemporalTailThroughSecondOrder:true,actualTerminalFastDerivativeGaussianBound:true,
    actualPositiveGaussianExponentRetained:true,originalAllIntegerMeshAndPaletteBound:true,allFiniteOrderFastJetKernelAvailable:true,
    executedFastDerivativeOrder:order,allLabelAmplitudeBoundsAuthenticated:false,actualSlowDerivativeGaussianBounds:false,
    covarianceWeightDerivativesInTail:false,physicalPullbackDerivativeLossesIncluded:false,globalPhysicalResidualFlatness:false,
    wholeGN5Complete:false,wholeGNUMComplete:false,newLeanKernelProof:false,workerExecution:false,browserExecution:false,m3MayStart:false};
  const sourceBinding={...p.sourceBinding,producer:'Private actual-admissible-terminal-covariance source; exact normalized matrix/envelope binding, original cutoff body and full Volterra solution.',
    sourceCompiler:p.program.compiler,sourceNodeCount:sourceCount,sourceEquations:['7.12','7.16','7.19','7.20','7.40'],sourceChanged:false,
    suppliedAmplitudeOrConstantAccepted:false,GaussianReferenceSubstitutedForActualAmplitude:false};
  const roots={sourceNorm:B,ell,S,Ls,E,Ed,W,a,lambdaLower,gaussianLower,gaussianAtCutoff,tConstants,uniformTailConstants,tailConstantsWithLength,
    tailRows:rows.map(r=>r.components.map(c=>c.rows.map(j=>j.direct))),zeroExtendedTailRows:rows.map(r=>r.supportMapped),
    originalAmplitudes:rows.map(r=>r.originalAmplitude),originalEnvelopes:rows.map(r=>r.originalP),
    signedBoxCountCoefficient,signedBoxCountAtBand,flatConstant:flat.roots.constant,infiniteMeshTail:meshSum.roots.tail};
  const result={G,source:p,request:p.request,coordinates:p.coordinates,rows,bounds,geometry,roots,checks,domain,proof,scope,sourceBinding},
    packed=G.pack(roots,{schema:'MathScope.ActualPulseGaussianTailProgram/1',compiler:'actual-pulse-gaussian-tail.mjs:prepareActualPulseGaussianTail',compilerInput:p.request,
      coordinates:p.coordinates,rows,bounds,geometry,checks,domain,proof,scope,sourceBinding}),{nodes,...rest}=packed,program={...structuredClone(rest),nodes:nodes.slice()};
  result.program=program;seals.set(result,{G,source:p,count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),covarianceCount:G.covarianceSystems.length,covariance:JSON.stringify(G.covarianceSystems),
    program,programNodes:program.nodes,metadata:metadata(program),serialized:canonicalStringify(program),data:data(result)});
  progress(context,'gaussian-original-tail-program-sealed',G);return result;
}

export function assertActualPulseGaussianTail(p){
  const s=seals.get(p);
  if(!s||p.G!==s.G||p.source!==s.source||p.program!==s.program||p.program.nodes!==s.programNodes||metadata(p.program)!==s.metadata||JSON.stringify(p.program.nodes)!==s.nodes||
    JSON.stringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions)||JSON.stringify(s.G.covarianceSystems.slice(0,s.covarianceCount))!==s.covariance||data(p)!==s.data)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private actual Gaussian source; copied claims, changed pulse/cutoff bodies or modified constants are not authority.');
  assertActualAdmissibleTerminalCovariance(s.source);return true;
}

export async function actualPulseGaussianTailCertificateFromProgram(p,context={}){
  assertActualPulseGaussianTail(p);const s=seals.get(p),original=await actualAdmissibleTerminalCovarianceCertificateFromProgram(p.source,context),hash=await sha256(s.serialized);context.checkCancelled?.();
  return {schema:'MathScope.ActualPulseGaussianTailCertificate/1',pass:true,request:p.request,sourceBinding:p.sourceBinding,sourceGraph:original.graph,
    graph:{sha256:hash,nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength,compiler:p.program.compiler,roots:p.roots,graphIncluded:false,fixedCompilerPrefix:true,laterAppendsExcluded:true},
    domain:p.domain,proof:p.proof,scope:p.scope,checks:p.checks,bounds:p.bounds,
    rows:p.rows.map(r=>({sign:r.sign,system:r.system,originalAmplitude:r.originalAmplitude,originalP:r.originalP,binding:r.binding,components:r.components,envelopeSlowIndependent:r.envelopeSlowIndependent,
      supportMapped:r.supportMapped,finiteDisplayApproximationUsed:r.finiteDisplayApproximationUsed,zeroExtension:r.zeroExtension})),
    mesh:{coordinateBounds:p.geometry.coordinateBounds,boxCountCoefficient:p.geometry.boxCountCoefficient,signedBoxCountCoefficient:p.geometry.signedBoxCountCoefficient,signedBoxCountAtBand:p.geometry.signedBoxCountAtBand,
      meshCountPower:18,maximumPositiveSlowLabelsAtPoint:16,maximumSignedLabelsAtPoint:32,candidateSlowLabels:p.geometry.candidateSlowLabels,countProof:p.geometry.countProof,pointOverlapProof:p.geometry.pointOverlapProof,
      palettePass:p.geometry.auxiliary.palette.pass,allLabelsPalette:p.geometry.auxiliary.palette.commonToAllBandsAndLabels,allActualAmplitudesCertified:false}};
}
