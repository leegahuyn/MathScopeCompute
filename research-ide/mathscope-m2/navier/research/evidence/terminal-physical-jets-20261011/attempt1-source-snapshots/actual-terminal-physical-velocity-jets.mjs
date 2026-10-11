/** Exact physical curl, spatial velocity jets through two, time through
 * one and the original pressure gradient for the authenticated selected
 * terminal member. This appends to the unchanged harmonic source. It
 * does not substitute an ell=1 pulse, a different cutoff background, a
 * finite Volterra sum, or a caller positivity flag.
 */
import {prepareActualTerminalHarmonicThirdJets,assertActualTerminalHarmonicThirdJets,actualTerminalHarmonicThirdJetsCertificateFromProgram} from './actual-terminal-harmonic-third-jets.mjs';
import {exactPhysicalVelocityJets} from './actual-physical-jet-kernel.mjs';
import {attachSourcePalette} from './actual-covariance-source-certificate.mjs';
import {actualPhysicalWaveExponentAudit} from './actual-physical-full-curl.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),names=['R','Z','T','theta','xi','v'];
const metadata=p=>{const{nodes,...rest}=p;return canonicalStringify(rest);};
const data=p=>canonicalStringify({request:p.request,coordinates:p.coordinates,geometry:p.geometry,rows:p.rows,roots:p.roots,checks:p.checks,domain:p.domain,scope:p.scope,sourceBinding:p.sourceBinding});
const progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};

/** The old producer supplies only the original rectangle basis formula.
 * Every band-dependent argument is supplied by the NEW authenticated
 * terminal member, including its Q, palette floor, ci, Ls and source grid.
 */
function originalPhysicalMap(G,harmonic){
  const p=harmonic.coefficientSource,source=p.source,g=source.geometry,c=source.constants,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    sqrt2=G.sqrt(q(2)),basis=[[G.one,G.sub(G.one,sqrt2)],[G.sub(sqrt2,G.one),G.one]],ancestorBasis=source.operator.geometry.rectangleBasis,
    coordinates={...source.coordinates,xi:source.cutoffs.xi},selected=[...names.map(n=>coordinates[n])],log2=G.log(q(2)),
    originalQ=G.exp(G.neg(G.mul(g.ell,log2))),originalEpsilon=power(g.Q,c.h),originalTg=G.add(q(4),sqrt2),
    originalPaletteQuotient=G.div(G.sub(G.mul(G.add(G.one,c.h),g.ell,log2),G.mul(q(2),G.log(g.ell))),G.log(g.Tg)),
    originalPaletteIndex=G.neg(G.ceiling(G.neg(originalPaletteQuotient))),originalCi=G.mul(power(g.Tg,g.paletteIndex),power(g.Q,G.add(G.one,c.h))),
    originalLs=G.div(G.mul(q(2),g.r0),g.ci),originalD=G.sub(q(4),G.mul(q(2),sqrt2)),
    rootChecks=[{id:'original-rectangle-basis',pass:same(basis,ancestorBasis)},
      {id:'actual-selected-band-Q-epsilon-and-Tg',pass:g.Q===originalQ&&g.epsilon===originalEpsilon&&g.Tg===originalTg&&g.Q!==source.operator.geometry.Q},
      {id:'actual-selected-band-palette-floor-ci-Ls',pass:g.paletteQuotient===originalPaletteQuotient&&g.paletteIndex===originalPaletteIndex&&g.ci===originalCi&&g.Ls===originalLs&&g.Dgeom===originalD},
      {id:'original-transverse-width',pass:g.r0===q(1,1n<<34n)}];
  if(rootChecks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The physical map lost its original basis or selected terminal band geometry.');
  const template=attachSourcePalette({G,geometry:{...g,rectangleBasis:basis},constants:c,coordinates:source.coordinates,families:source.families}),
    grid=p.slowCutoff.meshLabels,label=root=>G.simultaneousSubstitute(root,template.grid,grid),
    rectangles=template.rectangleRows.map(row=>({...row,color:label(row.color),center:row.center.map(label),copy:row.copy.map(label),xi:label(row.xi),eta:label(row.eta),v:label(row.v)})),
    physicalR=G.mul(G.sqrt(g.Q),coordinates.R),Lambda=G.sub(q(4),sqrt2),rho=G.div(G.log(Lambda),G.log(g.Tg)),
    dr=G.sub(G.mul(q(2),G.add(G.one,c.h),rho),G.div(c.h,q(100000))),
    radialPrimitive=G.mul(power(Lambda,g.paletteIndex),power(physicalR,dr)),timePrimitive=G.mul(power(g.Tg,g.paletteIndex),G.sub(G.one,G.mul(g.Q,coordinates.T))),
    expectedYi=[0,1].map(j=>G.add(G.mul(basis[0][j],radialPrimitive),G.mul(basis[1][j],timePrimitive))),radialFast=G.derivative(radialPrimitive,coordinates.R),
    radialFastFirst=G.derivative(radialFast,coordinates.R),radialFastSecond=G.derivative(radialFastFirst,coordinates.R),exponents=actualPhysicalWaveExponentAudit();
  const fixed={ell:g.ell,Q:g.Q,S:g.S,epsilon:g.epsilon,k:g.k,paletteIndex:g.paletteIndex,ci:g.ci,Ls:g.Ls,...Object.fromEntries(grid.map((x,j)=>['mesh'+j,x]))},
    fixedChecks=Object.entries(fixed).map(([name,body])=>({name,body,freeSlowOrFast:selected.some(x=>G.freeCoordinates(body).has(x)),derivatives:selected.map(x=>G.derivative(body,x))}));
  const phi=template.physicalMap,checks=[...rootChecks,
    {id:'selected-band-original-physical-map-bodies',pass:phi.r===physicalR&&phi.Lambda===Lambda&&phi.rho===rho&&phi.dr===dr&&same(phi.Yi,expectedYi)},
    {id:'original-exact-quadratic-basis-identities',pass:template.torus.pass&&template.palette.pass},
    {id:'same-original-fixed-mesh-as-potential',pass:grid.length===3&&rectangles.length===2&&same(grid,p.slowCutoff.meshLabels)&&rectangles.every((r,j)=>r.sign===source.families[j].sign)},
    {id:'fixed-labels-and-band-factors-actually-independent',pass:fixedChecks.every(c=>!c.freeSlowOrFast&&c.derivatives.every(x=>x===G.zero))},
    {id:'radial-fast-factor-differentiated-from-original-map',pass:radialFast!==G.zero&&radialFastFirst!==G.zero&&radialFastSecond!==G.zero&&selected.filter(x=>x!==coordinates.R).every(x=>!G.freeCoordinates(radialFast).has(x)&&G.derivative(radialFast,x)===G.zero)},
    {id:'exact-positive-Q-affine-h-physical-scales',pass:exponents.pass&&G.nodes[g.Q].op==='exp'&&c.h===G.parameter('h')}];
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual selected physical coordinate chain failed.');
  return {coordinates,basis,grid,templateGrid:template.grid,Yi:template.Yi,physicalMap:phi,rectangles,palette:template.palette,torus:template.torus,
    selectedBand:{ell:g.ell,Q:g.Q,S:g.S,epsilon:g.epsilon,k:g.k,paletteQuotient:g.paletteQuotient,paletteIndex:g.paletteIndex,ci:g.ci,Ls:g.Ls,r0:g.r0,Dgeom:g.Dgeom},
    radialPrimitive,timePrimitive,radialFast,radialFastFirst,radialFastSecond,fixedChecks,checks,exponents,
    chain:{basis:'v_r dot v_t=0; |v_r|^2=|v_t|^2=Dgeom. These are the exact original Q(sqrt2) identities bound to the retained basis roots.',
      radial:'xi=(v_r dot offset)/Dgeom, eta=(v_t dot offset)/Dgeom. Differentiating the original Yi in R gives xi_R=a(R), v_R=0, where a is actual AD of the retained radial primitive.',
      axial:'Yi is independent of Z. sqrt(Q)/Q^D=Q^h=epsilon, so the normalized axial derivative is epsilon*partial_Z.',
      time:'Yi_T=-Q*Tg^i*v_t; xi_T=0 and v_T=-Q*Tg^i/ci. ci=Tg^i*Q^(1+h), so (-epsilon)*v_T=1 exactly on Q>0. Hence normalized physical time is -epsilon*partial_T+partial_v.',
      positivePowerRule:'Q=exp(-ell*log2)>0. exp((1+h)logQ)=Q*exp(h*logQ); no decimal Q, log approximation or h=0 substitution is used.',
      nearestLift:'The integer copy is locally constant on each active source rectangle. Its half width is <3*r0<1/2, so the original cutoff support avoids the nearest-lift boundary. No derivative of integer reselection is used.',
      localOnly:true,ancestorEllOnePulseNotReused:true}};
}

/** A fully specified zero-order composition share avoids recopying a huge
 * source integral at each coordinate substitution. Its original value is
 * materialized and checked before composition. Later derivatives require
 * the explicit already constructed jet roots; no absent derivative is 0.
 */
function mapSourceScalar(G,body,map,rectangle,tag){
  const free=G.freeCoordinates(body),ordered=names.map(n=>map.coordinates[n]),parameters=[...ordered.filter(x=>free.has(x)),...[...free].filter(x=>!ordered.includes(x)).sort((a,b)=>a-b)],
    system=parameters.length?G.defineExpressionFunction({name:'ActualPhysicalComposition_'+tag+'_'+body,parameters,body,derivativeLimits:parameters.map(()=>0)}):null,
    originalValue=system===null?body:G.expressionValue(system,parameters),materialized=system===null?body:G.materializeExpressionFunction(system,parameters),
    values=parameters.map(x=>x===map.coordinates.xi?rectangle.xi:x===map.coordinates.v?rectangle.v:x),
    local=system===null?body:G.expressionValue(system,values),
    timeGuard=G.choose(rectangle.v,G.zero,map.selectedBand.Ls,G.zero,local,G.zero),
    transverseGuard=G.choose(rectangle.xi,G.neg(map.selectedBand.r0),map.selectedBand.r0,G.zero,timeGuard,G.zero),
    mapped=G.simultaneousSubstitute(transverseGuard,map.Yi,map.physicalMap.Yi),finalFree=G.freeCoordinates(mapped),
    eliminated=[map.coordinates.xi,map.coordinates.v,...map.Yi,...map.templateGrid].every(x=>!finalFree.has(x));
  if(materialized!==body||!eliminated)fail('INVALID_SOURCE_CONSTRUCTION','An original physical composition lost its body or retained a free fast/template coordinate.');
  return {body,system,parameters,originalValue,materialized,values,local,timeGuard,transverseGuard,mapped,originalBodyBound:true,independentAuxiliaryEliminated:true,
    unspecifiedOracle:false,zeroGuardBeforeVolterraEvaluation:true,slowDomainArtificiallyZeroExtended:false};
}

export function prepareActualTerminalPhysicalVelocityJets(input={},context={}){
  return attachActualTerminalPhysicalVelocityJets(prepareActualTerminalHarmonicThirdJets(input,context),context);
}

export function attachActualTerminalPhysicalVelocityJets(harmonic,context={}){
  assertActualTerminalHarmonicThirdJets(harmonic);const p=harmonic.coefficientSource,source=p.source,G=harmonic.G,sourceCount=harmonic.program.nodes.length,map=originalPhysicalMap(G,harmonic),
    {Q,epsilon,k}=source.geometry,{A,h}=source.constants,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    scales={potential:power(Q,G.sub(q(1,2),A)),velocity:power(Q,G.neg(A)),gradient:power(Q,G.neg(G.add(A,q(1,2)))),
      hessian:power(Q,G.neg(G.add(A,G.one))),time:power(Q,G.neg(G.add(A,G.one,h))),pressure:power(Q,G.mul(q(-2),A)),pressureGradient:power(Q,G.neg(G.add(G.mul(q(2),A),q(1,2))))},rows=[];
  progress(context,'physical-selected-original-map-bound',G);
  for(const[index,row]of harmonic.rows.entries()){
    const family=source.families[index],sigma=p.squareRoots[index].sigma,sourcePressureRow=family.frame.pressureImaginaryRow,
      pressureAmplitude=G.mul(p.slowCutoff.body,G.sqrt(epsilon),sigma,source.cutoffs.chi,source.cutoffs.psi),
      pressureImaginary=G.mul(pressureAmplitude,G.add(...sourcePressureRow.map((x,j)=>G.mul(x,family.t[j])))),
      pressure=G.neg(G.mul(pressureImaginary,row.harmonic.sine)),potential=row.harmonic.originalBodies.map(x=>x.real),
      jets=exactPhysicalVelocityJets(G,{...map.coordinates,epsilon,radialFast:map.radialFast,potential,pressure},context),rectangle=map.rectangles[index],mapped={},composition=[];
    if(row.fixedScale!==scales.potential||sigma!==source.target.squareRootWeights[index]||row.originalPhase!==family.phase||row.harmonic.k!==k)
      fail('INVALID_SOURCE_CONSTRUCTION','The physical source changed its actual scale, square-root weight, carrier or phase.');
    for(const name of ['potential','velocity','gradient','hessian','time','pressureGradient']){
      const shape=jets.roots[name],nested=Array.isArray(shape[0]);let count=0;
      const apply=body=>{const item=mapSourceScalar(G,G.mul(scales[name],body),map,rectangle,row.sign+'_'+name+'_'+count++);composition.push(item);return item.mapped;};
      mapped[name]=nested?shape.map(r=>r.map(apply)):shape.map(apply);
    }
    const pressureComposition=mapSourceScalar(G,G.mul(scales.pressure,pressure),map,rectangle,row.sign+'_pressure');composition.push(pressureComposition);mapped.pressure=pressureComposition.mapped;
    // Re(i*C*e^(ikPhi)) is the original m=+/-1 pair, each with its 1/2.
    const realHalfPair=potential.map(body=>[G.mul(q(1,2),body),G.mul(q(1,2),body)]),halfChecks=realHalfPair.map((parts,j)=>sourceGraphRationalIdentity(G,G.sub(G.add(...parts),potential[j]),{atomicNodes:[potential[j]],maxTerms:40000}));
    if(halfChecks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual real conjugate sum lost an original half factor.');
    rows.push({sign:row.sign,originalH:source.target.H,originalWeight:source.target.weights[index],originalSquareRoot:sigma,originalCoefficient:row.originalCoefficient,
      originalPhase:row.originalPhase,originalCarrier:k,potential,pressureAmplitude,sourcePressureRow,pressureImaginary,pressure,jets,rectangle,mapped,composition,realHalfPair,halfChecks,
      pressureFormula:'-eta_beta*sqrt(epsilon)*sqrt(y)*chi(xi)*psi(v)*(original pressureImaginaryRow dot t)*sin(k*Phi)',
      physicalOrdering:'Original real harmonic potential -> Cartesian rotation -> full independent slow/fast derivative operators -> original Q scales -> actual fixed-label rectangle -> original physical Yi.',
      inheritedExactVolterraLimit:true});
    progress(context,'physical-actual-velocity-jets-'+row.sign,G,{scalarCompositionCount:composition.length,partialBodyCount:jets.counts.usedBodyPartials});
  }
  const checks=[{id:'unchanged-private-harmonic-source',pass:assertActualTerminalHarmonicThirdJets(harmonic)},
    {id:'unchanged-original-harmonic-program-prefix',pass:same(G.nodes.slice(0,sourceCount),harmonic.program.nodes)},
    {id:'actual-selected-band-map-and-fixed-labels',pass:map.checks.every(c=>c.pass)},
    {id:'both-original-real-potential-bodies-before-Cartesian-curl',pass:rows.length===2&&rows.every((r,j)=>same(r.potential,harmonic.rows[j].harmonic.originalBodies.map(b=>b.real))&&r.originalPhase===source.families[j].phase&&r.jets.pass)},
    {id:'all-actual-space-two-time-one-and-pressure-gradient-bodies',pass:rows.every(r=>r.jets.counts.velocity===3&&r.jets.counts.gradient===9&&r.jets.counts.symmetricHessian===18&&r.jets.counts.time===3&&r.jets.counts.pressureGradient===3&&r.jets.counts.maxPotentialDerivativeOrderUsed===3&&r.jets.counts.spaceTimePotentialPartialUsed)},
    {id:'every-used-fast-slow-partial-bound-to-original-body',pass:rows.every(r=>[...r.jets.potentialBindings,r.jets.pressureBinding,r.jets.radialFastBinding].every(b=>b.originalBodyBound&&b.unspecifiedOracle===false&&b.partials.every(c=>c.pass)))},
    {id:'physical-mixed-and-divergence-curl-identities',pass:rows.every(r=>r.jets.checks.length===19&&r.jets.checks.every(c=>c.pass))},
    {id:'full-original-moving-pressure-row-retained',pass:rows.every((r,j)=>same(r.sourcePressureRow,source.families[j].frame.pressureImaginaryRow)&&r.jets.pressureBinding.body===r.pressure&&r.pressureAmplitude!==G.zero)},
    {id:'actual-physical-composition-eliminates-fast-auxiliary-coordinates',pass:rows.every(r=>r.composition.length===40&&r.composition.every(c=>c.originalBodyBound&&c.independentAuxiliaryEliminated&&c.zeroGuardBeforeVolterraEvaluation&&!c.slowDomainArtificiallyZeroExtended))},
    {id:'positive-h-Q-scales-and-original-conjugate-half-pair',pass:map.exponents.pass&&Object.values(scales).every(body=>names.every(name=>!G.freeCoordinates(body).has(map.coordinates[name])))&&rows.every(r=>r.halfChecks.every(c=>c.pass))},
    {id:'actual-original-positive-weights-full-H-and-slow-cutoff-retained',pass:p.scope.actualPositiveSqrtThirdJets&&p.scope.actualFullCovarianceTargetInverseThirdJets&&p.scope.originalSqrtEpsilonAndSlowCutoffRetained&&rows.every((r,j)=>r.originalWeight===source.target.weights[j]&&r.inheritedExactVolterraLimit)}];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','An authentic physical velocity derivative source binding failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const combinedPhysicalJets={};
  for(const name of ['potential','velocity','gradient','hessian','time','pressureGradient']){
    const first=rows[0].mapped[name],second=rows[1].mapped[name];
    combinedPhysicalJets[name]=Array.isArray(first[0])?first.map((row,j)=>row.map((x,k)=>G.add(x,second[j][k]))):first.map((x,j)=>G.add(x,second[j]));
  }
  combinedPhysicalJets.pressure=G.add(...rows.map(r=>r.mapped.pressure));
  const geometry={...map,scales,components:'Cartesian x,y,z after the exact cylindrical basis rotation',
    physicalCoordinates:'r=sqrt(Q)*R, z=Q^D*Z, t=1-Q*T; x=r*cos(theta), y=r*sin(theta). Q and all labels are frozen.',
    derivativeScales:'space:Q^-1/2, time:Q^-1-h, applied to the already scaled velocity Q^-A. Pressure uses Q^-2A.'},
    domain={...p.domain,physical:'The same selected small-q terminal member on Xplus<X<Xb, Xplus<Xrep<Xb, 1/2<s,srep<2, |eta|,|etaRep|<1 and the same fixed slow box. R>0.',
      fastSupport:'The original chi(xi) and psi(v) remain. Outside |xi|<r0 or 0<v<Ls the explicit zero guards precede Volterra evaluation. The fast cutoff is flat at those boundaries.',
      nearestLift:'Each supported rectangle is strictly inside its nearest-integer lift. Its label is frozen during differentiation; no derivative of floor or relabeling is used.',
      regularity:'The original coefficients and full H/target/positive square-root weights are smooth on this open terminal chart. The source-bound local uniform differentiated Volterra convergence and the ODE right hand side give the fast v jets used here.',
      slowEdges:'No zero extension at Xplus is inserted, and no value or derivative at y=0 is used. Slow stress boundary gluing and uniform cross-label estimates are separate.'},
    scope={actualSelectedSmallQTerminalSource:true,actualOriginalRealHarmonicAndPressureRetained:true,actualOriginalFastXiAndVJets:true,actualCartesianBasisConnectionTerms:true,
      actualFullPhysicalCurlConstructed:true,actualPhysicalSecondVelocityDerivativesConstructed:true,actualPhysicalFirstTimeVelocityDerivativeConstructed:true,actualPhysicalPressureGradientConstructed:true,
      actualSelectedBandPhysicalMapEvaluated:true,actualFixedLabelTwoSignSumConstructed:true,actualSourcePositiveSquareRootDomainConsumed:true,actualLocalDivergenceOfCurlProved:true,originalVolterraLimitUnchanged:true,
      numericalVelocityOrResidualEnclosed:false,wholeGNUMComplete:false,allLabelSeriesControlled:false,globalPhysicalResidual:false,flatErrorPackageComplete:false,fullSameProfileN5:false,
      differentStrengthenedBackgroundSubstituted:false,newAnalyticLeanKernelProof:false,workerExecution:false,browserExecution:false,m3MayStart:false},
    sourceBinding={...p.sourceBinding,harmonicProducer:'Unchanged private actual-terminal-harmonic-third-jets.mjs source',harmonicSourceNodeCount:sourceCount,
      mapProducer:'Original attachSourcePalette formula with EVERY band-dependent field replaced by the authenticated selected member and the exact same fixed mesh labels.',
      originalBodyPartialsMaterialized:true,commonDenominatorChecksOnlyAlgebra:true,numericalSourceValuesUsed:false},
    roots={geometry:{radialPrimitive:map.radialPrimitive,radialFast:map.radialFast,radialFastFirst:map.radialFastFirst,radialFastSecond:map.radialFastSecond,scales},
      uncomposedCartesianJets:rows.map(r=>r.jets.roots),physicalJets:rows.map(r=>r.mapped),combinedPhysicalJets,originalH:source.target.H,originalWeights:source.target.weights,originalSquareRoots:source.target.squareRootWeights};
  const result={G,harmonic,request:harmonic.request,coordinates:map.coordinates,geometry,rows,roots,checks,domain,scope,sourceBinding},packed=G.pack(roots,{schema:'MathScope.ActualTerminalPhysicalVelocityJetsProgram/1',
    compiler:'actual-terminal-physical-velocity-jets.mjs:prepareActualTerminalPhysicalVelocityJets',compilerInput:result.request,coordinates:result.coordinates,geometry,rows,checks,domain,scope,sourceBinding}),{nodes,...rest}=packed;
  result.program={...structuredClone(rest),nodes:nodes.slice()};
  seals.set(result,{G,harmonic,count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),program:result.program,programNodes:result.program.nodes,metadata:metadata(result.program),serialized:canonicalStringify(result.program),data:data(result)});
  progress(context,'physical-terminal-velocity-program-sealed',G);return result;
}

export function assertActualTerminalPhysicalVelocityJets(p){
  const s=seals.get(p);if(!s||p.G!==s.G||p.harmonic!==s.harmonic||p.program!==s.program||p.program.nodes!==s.programNodes||metadata(p.program)!==s.metadata||data(p)!==s.data||
    JSON.stringify(p.program.nodes)!==s.nodes||JSON.stringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private selected terminal physical program; copied records, edited jets, source geometry or completion flags have no authority.');
  assertActualTerminalHarmonicThirdJets(s.harmonic);return true;
}

export async function actualTerminalPhysicalVelocityJetsCertificateFromProgram(p,context={}){
  assertActualTerminalPhysicalVelocityJets(p);const s=seals.get(p),original=await actualTerminalHarmonicThirdJetsCertificateFromProgram(p.harmonic,context);context.checkCancelled?.();
  return {schema:'MathScope.ActualTerminalPhysicalVelocityJetsCertificate/1',status:'COMPLETED',pass:true,request:p.request,sourceBinding:p.sourceBinding,harmonicSourceGraph:original.graph,
    graph:{sha256:await sha256(s.serialized),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength,compiler:p.program.compiler,roots:p.roots,fixedCompilerPrefix:true,laterAppendsExcluded:true,graphIncluded:false},
    geometry:p.geometry,domain:p.domain,scope:p.scope,checks:p.checks,rows:p.rows.map(r=>({sign:r.sign,originalWeight:r.originalWeight,originalSquareRoot:r.originalSquareRoot,
      originalPhase:r.originalPhase,originalCarrier:r.originalCarrier,sourcePressureRow:r.sourcePressureRow,counts:r.jets.counts,roots:r.mapped,compositionCount:r.composition.length,
      exactPhysicalIdentityCount:r.jets.checks.length,allBodyPartialsMaterialized:r.jets.potentialBindings.every(b=>b.partials.every(c=>c.pass)),pressureFormula:r.pressureFormula,physicalOrdering:r.physicalOrdering}))};
}
