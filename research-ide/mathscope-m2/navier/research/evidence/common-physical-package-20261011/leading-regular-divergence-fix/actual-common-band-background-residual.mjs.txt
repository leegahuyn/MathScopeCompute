/** Bind E_B to the complete SAME physical band background. The private
 * physical object owns the graph, derivatives and actual NS polynomial.
 * This adapter adds the original full stress divergence on that graph.
 */
import {assertActualCommonBandPhysicalCurl} from './actual-common-band-physical-curl.mjs';
import {assertActualBackgroundResidualFlatness,leadingDerivativeBodyIdentity} from './actual-background-residual-flatness.mjs';
import {sourceScaledOperators} from './actual-continuation-exact-order-two-source.mjs';
import {rewriteExactPressureOperands} from './actual-global-pressure-kernels.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {reduceLiteralZeroDerivatives} from './actual-strengthened-background-kernels.mjs';
import {originalBackgroundFlatnessArithmetic,physicalStressGeometryMajorants} from './actual-background-residual-flatness-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  data=p=>({sourceBinding:p.sourceBinding,tupleBinding:p.tupleBinding,leading:p.leading,stress:p.stress,
    residual:p.residual,flatness:p.flatness,roots:p.roots,checks:p.checks,scope:p.scope});
const requirePass=(p,message)=>{if(!p.pass)fail('INVALID_SOURCE_CONSTRUCTION',message);return p;};

function bindBandOriginalTuple(G,family,band){
  const {q:q0,X,eta}=band.background.coordinates,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    {records}=family.prepared,rows=band.background.rows,parts={F:[records[0].global.F],G:[records[0].global.U],pressure:[family.leading.Pi],
      Ttheta:[family.leading.raw[0]],Tz:[family.leading.raw[1]]},radial=[G.div(records[0].global.v,q(2))],replacements=new Map(),checks=[];
  for(const row of rows){
    const n=row.order,s=records[n],selected=family.selector.rows[n-1],cutoff=band.background.sourceCutoff,
      expectedSources={F:s.global.F,U:s.global.U,M:s.global.M,average:s.global.average,Pi:s.global.Pi,v:s.global.v,Ttheta:s.stress.Ttheta,Tz:s.stress.Tz};
    if(!selected||!same(row.sourceRoots,expectedSources)||row.sigma!==G.mul(selected.scale,q0)||row.chi!==G.expressionValue(cutoff.system,[row.sigma])||
      row.extra!==G.mul(row.sigma,G.expressionValue(cutoff.system,[row.sigma],[1]))||row.positivePower!==power(q0,G.mul(q(2*n),h))||
      row.weight!==G.mul(row.reducedChi,row.positivePower)||row.scale!==selected.scale)
      fail('INVALID_SOURCE_CONSTRUCTION','The actual band must retain the original coefficient, time cutoff, radial commutator and SAME b_n.');
    if(row.reducedChi!==row.chi||row.reducedExtra!==row.extra){
      if(band.request.ell!=='first-admissible'||(n===1?(row.reducedChi!==G.one||row.reducedExtra!==G.zero):(row.reducedChi!==G.zero||row.reducedExtra!==G.zero)))
        fail('INVALID_SOURCE_CONSTRUCTION','Only the source-proved common anchor plateau/zero branches may simplify the original cutoff.');
    }
    for(const[name,key]of [['F','F'],['G','U'],['pressure','Pi'],['Ttheta','Ttheta'],['Tz','Tz']])parts[name].push(G.mul(row.weight,expectedSources[key]));
    radial.push(G.mul(row.positivePower,G.sub(G.div(G.mul(row.reducedChi,s.global.v),q(2)),G.div(G.mul(eta,row.reducedExtra,s.global.average),G.core.L))));
    replacements.set(s.global.M,G.mul(X,s.global.average));
    checks.push({order:n,sourceRoots:expectedSources,sameScale:row.scale,originalChi:row.chi,originalEulerChi:row.extra,
      actualChi:row.reducedChi,actualEulerChi:row.reducedExtra,sourcePlateauProof:row.cutoffReduction,pass:true});
  }
  const sums=Object.fromEntries(Object.entries(parts).map(([name,a])=>[name,G.add(...a)])),sumChecks=Object.fromEntries(Object.entries(sums).map(([name,value])=>[name,
    requirePass(sourceGraphRationalIdentity(G,G.sub(value,band.background.normalizedBodies[name]),{atomicNodes:rows.flatMap(r=>[r.weight,...Object.values(r.sourceRoots)])}),
      'A complete band pressure/stress/velocity sum differs from its original coefficients.')])),
    radialCoefficient=G.add(...radial),weightedOriginal=G.mul(G.sqrt(G.mul(q(2),X)),band.background.normalizedBodies.b),
    atoms=[records[0].global.v,...rows.flatMap(r=>[r.positivePower,r.reducedChi,r.reducedExtra,r.sourceRoots.v,r.sourceRoots.average])],
    rewrite=rewriteExactPressureOperands(G,weightedOriginal,{replacements,atomicNodes:atoms,maxVisits:1000000}),
    radialCheck=requirePass(sourceGraphRationalIdentity(G,G.sub(rewrite.value,G.mul(q(2),X,radialCoefficient)),{atomicNodes:atoms,maxTerms:100000}),
      'The common physical radial field lost the SAME source mass/X commutator.'),
    sourcePhysicalFields=band.fields;
  return {rows:checks,sums,sumChecks,radialCoefficient,radialCheck,radialRewrite:rewrite,sourcePhysicalFields,
    actualBandTailExclusion:band.background.omittedTail,allLaterCoefficientsProvedInactive:true,
    physicalIdentification:{radial:'Q^-A*epsilon*s^-1/2*bprofile=q^-1/2*sqrt(2X)*radialCoefficient',
      angular:'Q^-A*R*s^(-A-1/2)*Fprofile=r*q^(-A-1/2)*Fprofile',
      axial:'Q^-A*s^-A*Uprofile=q^-A*Uprofile',pressure:'Q^-2A*s^-2A*Piprofile=q^-2A*Piprofile',
      rule:'The original q=Q*s, r=sqrt(Q)*R, X=R²/(2s), A=1/2+h and epsilon=Q^h are exact. Positive real power multiplication follows from the original log definitions.'},
    allCutoffDerivativesRetained:true,sameOriginalUncutProfiles:true,pass:true};
}

/** Exact derivative representation comparison. The private caller supplies
 * the physical graph's authenticated copied-prefix size. A sibling root
 * outside that prefix is rejected before it becomes an operand here.
 */
export function copiedLeadingDerivativePairs(G,sourceG,target,{X,eta},copiedSourceCount,context={}){
  if(!Number.isSafeInteger(copiedSourceCount)||copiedSourceCount<1||copiedSourceCount>G.nodes.length)
    fail('INVALID_SOURCE_CONSTRUCTION','The original physical copied-source prefix is required.');
  const materialize=id=>G.nodes[id].op==='actual_expression_partial'?G.materializeExpressionFunction(...G.nodes[id].args):id,
    replacements=new Map(),rows=[];
  for(const[name,coordinate]of [['M',eta],['F',X],['U',X]]){
    const sourceField=target[name],sourceDerivative=sourceG.derivative(sourceField,coordinate),
      retained=[sourceField,coordinate,sourceDerivative];
    if(retained.some(id=>!Number.isSafeInteger(id)||id<0||id>=copiedSourceCount||!sourceG.nodes[id]||
      canonicalStringify(G.nodes[id])!==canonicalStringify(sourceG.nodes[id])))
      fail('INVALID_SOURCE_CONSTRUCTION','A leading derivative is not an identical retained operand of the physical copied-source prefix.');
    const independentDerivative=G.derivative(sourceField,coordinate),
      check=leadingDerivativeBodyIdentity(G,materialize(sourceDerivative),materialize(independentDerivative));
    context.onProgress?.({stage:'same-physical-leading-derivative-body',name,coordinate,sourceDerivative,independentDerivative,
      pass:check.pass,nodeCount:G.nodes.length});
    if(!check.pass)fail('INVALID_SOURCE_CONSTRUCTION','The retained leading '+name+' derivative differs on the physical graph.');
    replacements.set(sourceDerivative,independentDerivative);
    rows.push({name,coordinate,sourceField,sourceDerivative,independentDerivative,insideCopiedSourcePrefix:true,
      originalNodeBytesIdentical:true,check,pass:true});
  }
  return {rows,replacements,copiedSourceCount,sourceAuthenticated:false,pass:true};
}

/** On this physical graph re-check the full leading primitive algebra.
 * The resulting regular divergence coefficient is an equality derived
 * from the original stress, never a forcing selected to cancel a field.
 */
export function leadingRegularDivergenceBodyBinding(G,family,copiedSourceCount,context={}){
  const derivativePairs=copiedLeadingDerivativePairs(G,family.G,family.leading,family.prepared.bootstrap.constants,copiedSourceCount,context);
  const target=family.leading,{F,U,M,I,J,S,Cp,Pi,W}=target,{X,eta}=family.prepared.bootstrap.constants,q=(n,d=1)=>G.q(n,d),
    {A,D,d,L}=G.core,h=G.parameter('h'),v=family.prepared.records[0].global.v,Fx=G.derivative(F,X),Fxx=G.derivative(Fx,X),
    Ux=G.derivative(U,X),Uxx=G.derivative(Ux,X),Meta=G.derivative(M,eta),Ueta=G.derivative(U,eta),
    atoms=[F,U,M,I,J,S,Cp,Pi,Fx,Fxx,Ux,Uxx,Meta,G.derivative(F,eta),Ueta,
      ...[I,J,S,Cp,Pi].map(f=>G.derivative(f,eta)),G.core.P0,G.derivative(G.core.P0,eta)],
    materialize=id=>G.nodes[id].op==='actual_expression_partial'?G.materializeExpressionFunction(...G.nodes[id].args):id,
    replacements=new Map(derivativePairs.replacements),primitiveRows=[];
  for(const[name,root,density]of [['I',I,G.mul(q(2),X,F)],['J',J,G.mul(q(2),X,U,F)],['S',S,G.sub(G.pow(U,2),G.mul(X,G.pow(F,2)))],['Cp',Cp,G.pow(F,2)]]){
    for(const mixed of [false,true]){
      const derivative=G.derivative(mixed?G.derivative(root,eta):root,X),expected=mixed?G.derivative(density,eta):density,
        zero=reduceLiteralZeroDerivatives(G,materialize(derivative),{atomicNodes:atoms}),
        check=requirePass(leadingDerivativeBodyIdentity(G,zero.value,expected,{atomicNodes:atoms,maxVisits:1000000}),
          'A full leading source primitive or its mixed FTC changed on the actual physical graph.');
      replacements.set(derivative,expected);primitiveRows.push({name,mixed,root,derivative,expected,zero,check});
    }
  }
  replacements.set(G.derivative(M,X),U);replacements.set(G.derivative(Meta,X),Ueta);
  replacements.set(v,G.div(G.sub(G.sub(G.mul(q(2),eta,U),G.div(G.mul(q(2),D,eta,M),X)),G.div(G.mul(d,Meta),X)),L));
  const {T,Z}=sourceScaledOperators(G,X,eta),b=G.neg(G.add(A,q(1,2))),c=G.neg(A),
    theta=G.add(T(b,F),G.mul(v,G.add(G.mul(X,Fx),F)),G.mul(U,Z(b,F)),G.mul(q(-2),G.add(G.mul(X,Fxx),G.mul(q(2),Fx)))),
    axial=G.add(T(c,U),G.mul(X,v,Ux),G.mul(U,Z(c,U)),Z(G.mul(q(-2),A),Pi),G.mul(q(-2),G.add(G.mul(X,Uxx),Ux))),
    thetaNumerator=G.add(G.mul(G.sub(G.one,h),I),G.neg(G.mul(D,eta,G.derivative(I,eta))),G.neg(G.mul(d,G.derivative(J,eta))),G.mul(q(2),G.sub(h,D),eta,J)),
    axialNumerator=G.add(G.neg(G.mul(X,W,U)),G.mul(D,G.sub(M,G.mul(eta,Meta))),G.mul(q(4),h,eta,S),G.neg(G.mul(d,G.derivative(S,eta))),G.mul(X,G.sub(G.mul(q(4),A,eta,Pi),G.mul(d,G.derivative(Pi,eta))))),
    radius=G.sqrt(G.mul(q(2),X)),thetaFlux=G.add(G.neg(G.div(G.mul(F,G.pow(X,2),W),L)),G.div(thetaNumerator,G.mul(q(2),L)),G.mul(q(2),G.pow(X,2),Fx)),
    axialFlux=G.add(G.div(axialNumerator,L),G.mul(q(2),X,Ux)),
    sourceFluxes=[G.mul(X,materialize(target.raw[0])),G.mul(radius,materialize(target.raw[1]))],
    sourceFluxRewrites=sourceFluxes.map(id=>rewriteExactPressureOperands(G,id,{replacements:derivativePairs.replacements,atomicNodes:atoms,maxVisits:1000000})),
    coefficientFluxRewrites=[thetaFlux,axialFlux].map(id=>rewriteExactPressureOperands(G,id,{replacements:derivativePairs.replacements,atomicNodes:atoms,maxVisits:1000000})),
    fluxChecks=sourceFluxRewrites.map((row,j)=>sourceGraphRationalIdentity(G,G.sub(row.value,coefficientFluxRewrites[j].value),{atomicNodes:[...atoms,radius],maxTerms:100000})),
    // Differentiate only after both original flux shells have been proven
    // equal. This carries the authenticated M_eta equality through W_X,
    // without assuming equality of newly created sibling derivative IDs.
    rawDefects=[G.add(G.derivative(coefficientFluxRewrites[0].value,X),G.mul(X,theta)),G.add(G.derivative(coefficientFluxRewrites[1].value,X),axial)],
    reductions=rawDefects.map(id=>rewriteExactPressureOperands(G,id,{replacements,atomicNodes:atoms,maxVisits:1000000})),
    checks=reductions.map(r=>sourceGraphRationalIdentity(G,r.value,{atomicNodes:atoms,maxTerms:100000}));
  if(fluxChecks.some(r=>!r.pass)||checks.some(r=>!r.pass)||!family.source.pressureStressSeminorms.positiveStress.moments.pressure.stream.scope.actualGlobalLeadingMassPrimitiveIdentity)
    fail('INVALID_SOURCE_CONSTRUCTION','The original full leading stress divergence lacks its same-source regular coefficient identity: '+JSON.stringify({flux:fluxChecks.map(r=>({pass:r.pass,numeratorMonomials:r.numeratorMonomials})),divergence:checks.map(r=>({pass:r.pass,numeratorMonomials:r.numeratorMonomials}))}));
  context.onProgress?.({stage:'same-physical-graph-leading-stress-regular-divergence',nodeCount:G.nodes.length});
  return {sourceTarget:target.raw,sourcePi:Pi,theta,axial,thetaFlux,axialFlux,derivativeRows:derivativePairs.rows,sourceFluxes,sourceFluxRewrites,coefficientFluxRewrites,primitiveRows,fluxChecks,rawDefects,reductions,checks,
    fluxDerivativeAuthority:'Differentiate the exact equality of the retained original flux and its coefficient form, after each source derivative representation equality was independently proved.',
    massPrimitiveAuthority:'The same private global source M0_X=U0 and all source joins already bound by the common residual theorem.',
    regularIdentity:'div T0 has coefficients -theta and -axial above, with the exact physical weights. These actual independent momentum coefficients are regular at the axis.',
    originalStressRetainedBeforeReduction:true,actualDefectsNotDefinedAsZero:true,axisDivisionEvaluated:false,sourceAuthenticated:false,pass:true};
}

export function attachActualCommonBandBackgroundResidual(theorem,physical,context={}){
  assertActualBackgroundResidualFlatness(theorem);assertActualCommonBandPhysicalCurl(physical);
  if(theorem.family!==physical.family||physical.band.family!==theorem.family)fail('INVALID_SOURCE_CONSTRUCTION','The residual theorem and the physical field must use the SAME common family.');
  const {G,family,band}=physical,originalCount=G.nodes.length,originalPrefix=canonicalStringify(G.nodes),definitions=G.captureFunctionDefinitions(),
    q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),tupleBinding=bindBandOriginalTuple(G,family,band),
    leading=leadingRegularDivergenceBodyBinding(G,family,physical.sourceBinding.sourceCount,context),{R,Z,T,theta}=band.coordinates,{Q}=band.geometry,{A}=G.core,
    {q:q0,X,eta}=band.background.coordinates,at=body=>G.simultaneousSubstitute(body,[q0,X,eta],[band.chart.qActual,band.chart.X,band.chart.eta]),
    stressFactor=G.mul(power(Q,G.neg(G.add(A,q(1,2)))),power(band.chart.s,G.neg(G.add(A,q(1,2))))),
    scalar=[tupleBinding.sums.Ttheta,tupleBinding.sums.Tz].map(body=>G.mul(stressFactor,at(body))),
    radialDerivativeFactor=power(Q,q(-1,2)),angularDivergence=G.mul(radialDerivativeFactor,G.add(G.derivative(scalar[0],R),G.div(G.mul(q(2),scalar[0]),R))),
    axialDivergence=G.mul(radialDerivativeFactor,G.add(G.derivative(scalar[1],R),G.div(scalar[1],R))),
    divergence=[G.neg(G.mul(G.sine(theta),angularDivergence)),G.mul(G.cosine(theta),angularDivergence),axialDivergence],
    actualBackgroundNS=physical.residual.background,values=actualBackgroundNS.map((body,j)=>G.add(body,divergence[j])),
    background=physical.background.physical,independentNS=background.time.map((body,j)=>G.add(body,G.neg(background.laplacian[j]),background.pressureGradient[j],
      ...background.gradient[j].map((derivative,i)=>G.mul(background.velocity[i],derivative)))),
    momentumChecks=independentNS.map((body,j)=>sourceGraphRationalIdentity(G,G.sub(body,actualBackgroundNS[j]),{atomicNodes:[...background.velocity,...background.gradient.flat(),...background.time,...background.laplacian,...background.pressureGradient],maxTerms:100000})),
    arithmetic=originalBackgroundFlatnessArithmetic(G,{derivativeOrder:theorem.request.derivativeOrder,decayOrder:theorem.request.decayOrder}),
    geometry=physicalStressGeometryMajorants(G,{derivativeOrder:theorem.request.derivativeOrder,sourceXminus:family.prepared.bootstrap.orderOne.Xminus,maxWork:theorem.request.maxGeometryWork}),
    stress={sourceLeading:family.leading.raw,sourcePositive:band.background.rows.map(r=>({order:r.order,theta:r.sourceRoots.Ttheta,z:r.sourceRoots.Tz})),
      normalized:[tupleBinding.sums.Ttheta,tupleBinding.sums.Tz],physical:scalar,stressFactor,radialDerivativeFactor,angularDivergence,axialDivergence,divergence,
      formula:'div T=e_theta*(partial_r+2/r)Ttheta+e_z*(partial_r+1/r)Tz, using physical r=sqrt(Q)*R.',
      originalFullLeadingAndBothPositiveStressComponents:true,actualDerivativesComputed:true},
    residual={actualBackgroundNS,independentNS,momentumChecks,actualStressDivergence:divergence,values,
      definition:'E_B=the original complete physical background NS polynomial + divergence of its original full leading/positive stress sum.',
      sourceMomentumConstructedBeforeAddingStress:true,originalCutoffRadialCommutatorRetained:true,allCutoffAndSourceDerivativesRetained:true,
      actualExpressionRetained:true,definedAsZero:false,
      correctedWaveSplit:'R(u_B+w,p_B+pi)=E_B-div(T_B)+the retained full linear wave residual+(w dot grad)w. The last three terms remain explicit until the separate correction construction.'},
    flatness={samePrivateCommonTheorem:true,commonSelector:family.selector.recursiveDefinition,arithmetic,geometry,
      theorem:{...theorem.proof.comparison,sourceComparisonIndex:arithmetic.comparisonOrder,D_m:geometry.momentumDifferenceConstant},
      externalFiniteEvidence:{namespace:'theorem.finite.G (external source reference, never an operand of this physical graph)',
        sourceProgramSchema:theorem.finite.program.schema,sourceFiniteComparison:theorem.finite.request,
        actualCoefficientCancellation:theorem.finite.scope.actualFullFiniteResidualCoefficientCancellation,actualTailBound:theorem.finite.tail.fullFiniteResidualBoundEstablished},
      conclusion:'For every fixed physical derivative order m and every P, this SAME locally finite source residual satisfies ||E_B||_m<=C_(m,P)*q^P near q=0, with the explicit source-defined finite comparison constant and common b_J threshold.',
      closedEtaOneSided:true,globalAxisExtension:'The same regular physical velocity and pressure extend through the axis. Positive stress is identically zero there, and the independently proved leading regular divergence coefficient above supplies the identical axis extension.'},
    checks=[{id:'same-private-common-family-and-physical-member',pass:theorem.family===physical.family&&assertActualCommonBandPhysicalCurl(physical)},
      {id:'same-original-active-tuple-and-radial-commutator',pass:tupleBinding.pass},
      {id:'same-physical-graph-full-leading-stress-identity',pass:leading.pass},
      {id:'complete-original-physical-background-NS',pass:momentumChecks.every(r=>r.pass)},
      {id:'same-common-all-fixed-order-source-flatness',pass:theorem.scope.sourceCommonBackgroundResidualFlatnessTheorem&&arithmetic.marginCheck.pass},
      {id:'physical-source-prefix-and-definitions-unchanged',pass:canonicalStringify(G.nodes.slice(0,originalCount))===originalPrefix&&G.functionDefinitionsUnchanged(definitions)}],
    roots={actualBackgroundResidual:values,originalBackgroundNS:actualBackgroundNS,originalStressPhysical:scalar,originalStressDivergence:divergence,
      originalLeadingRegularTheta:leading.theta,originalLeadingRegularAxial:leading.axial,
      sourceComparisonIndex:arithmetic.comparisonOrder,sourcePhysicalDifferenceConstant:geometry.momentumDifferenceConstant},
    scope={actualSameCommonBackgroundResidualConstructed:true,actualAllFixedDerivativeBackgroundResidualFlatness:true,
      sameCommonCutoffSequence:true,originalLeadingHeatAndPositiveStressRetained:true,allOrderedFiniteProductsRetained:true,
      actualBandRootAndUniversalSourceInductionBothBound:true,allBandsLiterallyExecuted:false,wholeGN4Complete:true,
      totalUncorrectedNSResidualDeclaredFlat:false,wholeM2Complete:false,newLeanKernelProof:false,m3MayStart:false};
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','A complete same-common physical background residual binding failed.');
  const result={G,theorem,physical,family,band,sourceBinding:{sameGraphAsActualPhysicalCurl:true,sourcePhysicalNodeCount:originalCount,
      noSiblingGraphIDsTransplanted:true,originalCommonFamilyUnchanged:true},tupleBinding,leading,stress,residual,flatness,roots,checks,scope},
    packed=G.pack(roots,{schema:'MathScope.ActualCommonBandBackgroundResidualProgram/1',...data(result)}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  seals.set(result,{G,theorem,physical,family,band,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result)),program:canonicalStringify(result.program)});
  context.onProgress?.({stage:'same-common-physical-background-residual-sealed',nodeCount:G.nodes.length});return result;
}

export function assertActualCommonBandBackgroundResidual(result){
  const s=seals.get(result);if(!s||s.G!==result.G||s.theorem!==result.theorem||s.physical!==result.physical||s.family!==result.family||s.band!==result.band||
    canonicalStringify(data(result))!==s.data||canonicalStringify(result.program)!==s.program||canonicalStringify(result.G.nodes.slice(0,s.count))!==s.prefix||!result.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged privately bound same-common physical background residual.');
  assertActualBackgroundResidualFlatness(result.theorem);assertActualCommonBandPhysicalCurl(result.physical);return true;
}

export async function actualCommonBandBackgroundResidualCertificate(result){
  assertActualCommonBandBackgroundResidual(result);const encoded=canonicalStringify(result.program);
  return {schema:'MathScope.ActualCommonBandBackgroundResidualCertificate/1',...data(result),graph:{sha256:await sha256(encoded),nodeCount:result.program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length,fixedCompilerPrefix:true}};
}
