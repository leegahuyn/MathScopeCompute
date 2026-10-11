/** The ORIGINAL common-cutoff background has a flat physical residual.
 * A finite query authenticates the coefficient and norm constructors.
 * The all-fixed-order conclusion is their well-founded source induction
 * with the SAME b_n, not a claim that infinitely many graphs were run.
 */
import {assertActualCommonAdmissibleFamily} from './actual-common-admissible-family.mjs';
import {attachActualFiniteGlobalResidual,assertActualFiniteGlobalResidual} from './actual-global-finite-residual.mjs';
import {originalCutoffStreamContinuityIdentity,originalBackgroundFlatnessArithmetic,physicalStressGeometryMajorants} from './actual-background-residual-flatness-kernel.mjs';
import {explicitPrimitiveBodyIdentity} from './actual-global-primitive-kernels.mjs';
import {rewriteExactPressureOperands} from './actual-global-pressure-kernels.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  data=p=>({request:p.request,sourceBinding:p.sourceBinding,sameSequence:p.sameSequence,leadingBinding:p.leadingBinding,
    continuity:p.continuity,tupleTail:p.tupleTail,arithmetic:p.arithmetic,geometry:p.geometry,proof:p.proof,roots:p.roots,checks:p.checks,scope:p.scope});

/** Proof-only equality of retained derivative bodies. The source AD keeps
 * all-zero piecewise derivatives; the independent audit omits them before
 * differentiation. Descend through EVERY branch and the literal integral
 * body, preserving the selector, limits and bound coordinate. No nonzero
 * compact primitive is erased and no branch/support value is selected.
 */
export function leadingDerivativeBodyIdentity(G,left,right,{atomicNodes=[],maxVisits=1000000}={}){
  const direct=explicitPrimitiveBodyIdentity(G,left,right,{atomicNodes,maxVisits});
  if(direct.pass)return {left,right,direct,pass:true,sourceAuthenticated:false};
  const atoms=new Set(atomicNodes),cache=new Map(),trace=[];let visits=0;
  const visit=id=>{
    if(atoms.has(id))return id;if(cache.has(id))return cache.get(id);
    if(++visits>maxVisits)fail('RESOURCE_LIMIT','The leading derivative body comparison exhausted its literal-expression budget.');
    const {op,args}=G.nodes[id];let value=id;
    if(op==='add')value=G.add(...args.map(visit));
    else if(op==='multiply')value=G.mul(...args.map(visit));
    else if(op==='inverse')value=G.inv(visit(args[0]));
    else if(op==='integer_power')value=G.pow(visit(args[0]),args[1]);
    else if(op==='sqrt_positive')value=G.sqrt(visit(args[0]));
    else if(op==='smooth_piecewise'){
      const branches=args.slice(3).map(visit);
      value=branches.every(id=>id===G.zero)?G.zero:G.choose(args[0],args[1],args[2],...branches);
    }
    else if(op==='definite_integral')value=G.integral(visit(args[0]),args[1],args[2],args[3]);
    // Opaque source functions and their nonzero jets remain unchanged.
    if(value===G.zero&&id!==G.zero)trace.push({root:id,operation:op,rule:'literal zero arithmetic or every original branch/integrand is zero'});
    cache.set(id,value);return value;
  };
  const reducedLeft=visit(left),reducedRight=visit(right),body=explicitPrimitiveBodyIdentity(G,reducedLeft,reducedRight,{atomicNodes,maxVisits});
  return {left,right,direct,reducedLeft,reducedRight,body,visits,trace,pass:body.pass,
    everyOriginalBranchRetained:true,integralLimitsAndBoundVariablesRetained:true,
    nonzeroCompactPrimitiveReplaced:false,sourceAuthenticated:false};
}

function captureLeadingDerivatives(family){
  const {G,leading}=family,{X,eta}=family.prepared.bootstrap.constants;
  // This must precede the independent copy. A new derivative made on the
  // sibling source after copying would not be a root in the audit graph.
  return [['M',eta],['F',X],['U',X]].map(([name,coordinate])=>({name,coordinate,
    sourceField:leading[name],sourceDerivative:G.derivative(leading[name],coordinate)}));
}

/** Generic body comparison only. The private caller supplies the original
 * source derivatives captured BEFORE its unchanged prefix is copied.
 */
export function leadingTargetBodyBinding(G,left,right,sourceDerivatives,{X,eta},context={}){
  const rows=[],replacements=new Map();
  const materialize=id=>G.nodes[id].op==='actual_expression_partial'?G.materializeExpressionFunction(...G.nodes[id].args):id;
  const derivativeRows=sourceDerivatives.map(row=>{
    if(left[row.name]!==row.sourceField||right[row.name]!==row.sourceField||!G.nodes[row.sourceDerivative]||
      !((row.name==='M'&&row.coordinate===eta)||(['F','U'].includes(row.name)&&row.coordinate===X)))
      fail('INVALID_SOURCE_CONSTRUCTION','The original full leading derivative must be a retained copied-source operand.');
    const independentDerivative=G.derivative(right[row.name],row.coordinate),
      check=leadingDerivativeBodyIdentity(G,materialize(row.sourceDerivative),materialize(independentDerivative));
    context.onProgress?.({stage:'same-common-leading-derivative-body',name:row.name,coordinate:row.coordinate,
      commonSource:row.sourceDerivative,independentSource:independentDerivative,pass:check.pass,nodeCount:G.nodes.length});
    if(!check.pass)fail('INVALID_SOURCE_CONSTRUCTION','The original leading '+row.name+' derivative body differs after literal zero normalization: '+JSON.stringify({common:row.sourceDerivative,independent:independentDerivative,normalForms:check.body?.normalForms}));
    replacements.set(row.sourceDerivative,independentDerivative);
    return {...row,independentDerivative,check,pass:true};
  });
  if(derivativeRows.length!==3||new Set(derivativeRows.map(row=>row.name)).size!==3)
    fail('INVALID_SOURCE_CONSTRUCTION','The leading shell requires M_eta and both original radial shear derivatives.');
  for(const name of ['I','J','S','Cp','Pi'])for(const derivativeOrder of [0,1]){
    const a=derivativeOrder?G.derivative(left[name],eta):left[name],b=derivativeOrder?G.derivative(right[name],eta):right[name],
      known=rewriteExactPressureOperands(G,materialize(a),{replacements,maxVisits:1000000}),
      check=explicitPrimitiveBodyIdentity(G,known.value,materialize(b),{maxVisits:1000000});
    context.onProgress?.({stage:'same-common-leading-primitive-body',name,derivativeOrder,pass:check.pass,nodeCount:G.nodes.length});
    if(!check.pass)fail('INVALID_SOURCE_CONSTRUCTION','The common and independent full leading '+name+' primitive/eta body differ.');
    rows.push({name,derivativeOrder,commonSource:a,independentSource:b,known,check});replacements.set(a,b);
  }
  const atoms=[...['F','U','M','I','J','S','Cp','Pi'].map(k=>right[k]),...['F','U','M','I','J','S','Cp','Pi'].map(k=>G.derivative(right[k],eta)),
    G.derivative(right.F,X),G.derivative(right.U,X)],
    stresses=left.raw.map((root,j)=>{
      const commonBody=materialize(root),independentBody=materialize(right.raw[j]),
        rewrite=rewriteExactPressureOperands(G,commonBody,{replacements,atomicNodes:atoms,maxVisits:1000000}),
        check=sourceGraphRationalIdentity(G,G.sub(rewrite.value,independentBody),{atomicNodes:atoms,maxTerms:100000});
      context.onProgress?.({stage:'same-common-leading-stress-shell',component:j,commonSource:root,independentSource:right.raw[j],
        pass:check.pass,numeratorMonomials:check.numeratorMonomials,nodeCount:G.nodes.length});
      if(!check.pass)fail('INVALID_SOURCE_CONSTRUCTION','The common leading stress must retain every original moment, axis pressure and both shear terms: '+JSON.stringify({component:j,common:root,independent:right.raw[j],numeratorMonomials:check.numeratorMonomials}));
      return {component:j,commonSource:root,independentSource:right.raw[j],commonBody,independentBody,rewrite,check};
    });
  if(left.F!==right.F||left.U!==right.U||left.M!==right.M||!left.bothShearTermsRetained||!right.bothShearTermsRetained)
    fail('INVALID_SOURCE_CONSTRUCTION','The exact same original full leading fields are required.');
  return {derivatives:derivativeRows,primitives:rows,stresses,fullHeatAndI2Retained:true,originalPressureAxisRetained:true,bothShearsRetained:true,pass:true,sourceAuthenticated:false,
    graphNamespace:'The finite audit copies the full family graph before adding its independent leading primitives. All common IDs are retained prefix IDs; fresh audit IDs are never transplanted to the family.'};
}

function bindSameDiagonal(G,family){
  const h=G.parameter('h'),q=(n,d=1)=>G.q(n,d),rows=[];
  for(const selected of family.selector.rows){
    const n=selected.order,sourceVelocity=family.norms.velocityRows[n-1],sourceStress=family.norms.pressureStressRows[n-1],clauses=[];
    for(let m=0;m<=n;m++)for(const[kind,bound]of [['velocity-potential-physical',sourceVelocity.bounds[m]],['pressure-stress-physical',sourceStress.bounds[m]]]){
      const matches=selected.constraints.filter(c=>c.kind===kind&&c.derivativeOrder===m),expected=G.div(G.add(G.mul(q(n),G.log(q(2))),G.log(bound)),G.mul(q(n),h));
      if(matches.length!==1||matches[0].bound!==bound||matches[0].requiredLog!==expected||!G.nodes[selected.logScale].args.includes(expected))
        fail('INVALID_SOURCE_CONSTRUCTION','A physical tail must use its actual bound in the SAME recursive common diagonal scale.');
      clauses.push({kind,derivativeOrder:m,actualBound:bound,actualRequiredLog:expected,sourceClause:matches[0],pass:true});
    }
    const predecessor=n===1?G.zero:family.selector.rows[n-2].logScale,
      growth=G.add(predecessor,G.log(q(n===2?16:2)));
    if(selected.previousLogScale!==predecessor||selected.growth!==growth||selected.scale!==G.exp(selected.logScale)||!G.nodes[selected.logScale].args.includes(growth))
      fail('INVALID_SOURCE_CONSTRUCTION','The same common sequence must retain its newly chosen predecessor.');
    rows.push({order:n,scale:selected.scale,logScale:selected.logScale,previousLogScale:predecessor,growth,clauses,
      physicalGain:sourceVelocity.gain,physicalLosses:sourceVelocity.losses,
      originalRadialCommutatorIncluded:sourceVelocity.components.some(c=>c.name==='extra_stream_x1')&&sourceVelocity.components.some(c=>c.name==='extra_stream_x2'),
      pressureAndBothStressComponentsIncluded:sourceStress.components.length===3,pass:true});
  }
  if(rows.some(r=>!r.originalRadialCommutatorIncluded||!r.pressureAndBothStressComponentsIncluded))fail('INVALID_SOURCE_CONSTRUCTION','The complete physical tuple must precede common residual summation.');
  return {rows,sourceRecursiveDefinition:family.selector.recursiveDefinition,sameActualScaleAtEveryUse:true,
    noSecondResidualSelector:true,positiveH:family.selector.positiveSourceH,
    induction:'At n choose the maximum of the original c_n, the NEW preceding common scale (factor16 at n2, then2), and every actual finite physical/weighted source norm through m<=n. Since h>0 and each source norm is finite, the step exists. Every later bound refers to these very b_n.',
    outsideExecutedPrefix:'The same well-founded original coefficient, complete jet/FTC and maximum recursion defines every finite index. No unconstructed coefficient or bound is assigned a numerical value.',pass:true};
}

export function attachActualBackgroundResidualFlatness(family,input={},context={}){
  assertActualCommonAdmissibleFamily(family);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['truncationOrder','derivativeOrder','decayOrder','maxWords','maxPairs','maxProfileJets','maxJetRequests','maxGeometryWork'].includes(k)))
    fail('INVALID_INPUT','Only finite comparison orders and explicit representation budgets may be selected.');
  const request={truncationOrder:input.truncationOrder??family.request.throughOrder,derivativeOrder:input.derivativeOrder??0,
    decayOrder:input.decayOrder??1,maxWords:input.maxWords??4096,maxPairs:input.maxPairs??100000,
    maxProfileJets:input.maxProfileJets??60000,maxJetRequests:input.maxJetRequests??600000,maxGeometryWork:input.maxGeometryWork??200000};
  for(const[k,v]of Object.entries(request))if(!Number.isSafeInteger(v)||v<(['derivativeOrder','decayOrder'].includes(k)?0:1))fail('INVALID_INPUT','Comparison/decay orders are finite nonnegative integers and work budgets are positive.');
  const positive=family.source.pressureStressSeminorms.positiveStress,sourceLeadingDerivatives=captureLeadingDerivatives(family),
    finite=attachActualFiniteGlobalResidual(positive,{truncationOrder:request.truncationOrder,derivativeOrder:request.derivativeOrder,
      maxWords:request.maxWords,maxPairs:request.maxPairs,maxProfileJets:request.maxProfileJets,maxJetRequests:request.maxJetRequests},context),
    G=finite.G,q=(n,d=1)=>G.q(n,d),m=request.derivativeOrder,
    sameSequence=bindSameDiagonal(G,family),leadingBinding=leadingTargetBodyBinding(G,family.leading,finite.leading.target,sourceLeadingDerivatives,family.prepared.bootstrap.constants,context),
    arithmetic=originalBackgroundFlatnessArithmetic(G,{derivativeOrder:m,decayOrder:request.decayOrder}),
    geometry=physicalStressGeometryMajorants(G,{derivativeOrder:m,sourceXminus:family.prepared.bootstrap.orderOne.Xminus,maxWork:request.maxGeometryWork}),
    cutoff=originalCutoffStreamContinuityIdentity(),continuityRows=positive.moments.continuity.map(row=>{
      const source=family.prepared.records[row.order].global,mass=positive.moments.pressure.primitives.rows[row.order-1].mass;
      if(!row.pass||!mass.pass||row.sourceU!==source.U||row.sourceM!==source.M||row.sourcev!==source.v||row.sourceAverage!==source.average)
        fail('INVALID_SOURCE_CONSTRUCTION','The radial cutoff commutator needs the same actual continuity and whole mass primitive.');
      return {order:row.order,originalContinuityDefect:row.originalContinuityDefect,actualMassPrimitive:mass.source,
        actualU:source.U,actualM:source.M,actualAverage:source.average,actualv:source.v,sourceProof:row,pass:true};
    }),continuity={kernel:cutoff,rows:continuityRows,leadingGlobalStream:positive.moments.pressure.stream.parts.stream,
      sourceLeadingContinuity:positive.moments.pressure.stream.scope.actualLeadingContinuityIdentity,
      result:'Each complete cut velocity has zero divergence by the displayed original continuity and M_X=U defects. The same χ and Euler χ′ appear in every derivative. Local finiteness permits summing and all physical derivatives commute.',
      originalAverageRegularAtAxis:true,leadingAndEveryGeneratedPositiveOrder:true,pass:true},
    tupleTail={fields:['velocity','pressure','stress_theta','stress_z'],sourcePhysicalDerivativeLoss:'2*A+r, independent of coefficient index n',
      cutoff:'Original chi(b_n*q)=1 for b_n*q<=1/2 and0 for b_n*q>=1, with all derivatives flat at both joins.',
      localFiniteness:'b_n>=2^n makes the same full tuple and every physical derivative locally a finite sum for q>0.',
      bound:'For every fixed r and J>=max(1,r), ||tuple_B-tuple^[J]||_r<=2^-J*q^((J+1)*h-(2*A+r)) whenever 0<q<min(1,1/(2*b_J)).',
      proof:['For each nonzero nth cut term/jet, q<=1/b_n. Its actual B_(n,r) then gives B_(n,r)*q^(n*h)<=2^-n.',
        'The source positive-jet rules already include all Euler derivatives of chi and the extra radial stream term; no derivative of a weakened bound is taken.',
        'For n>J>=r, q^(n*h)<=q^((J+1)*h), and the exact sum of2^-n is2^-J.',
        'Every n<=J cut term is its original uncut term on the common first-J plateau, including the zero radial commutator there. Thus the tail is the actual difference from that uncut finite tuple.'],
      originalLeadingFullHeatCancelsInDifference:true,stressDifferenceAnnulus:[family.prepared.bootstrap.orderOne.Xminus,family.prepared.bootstrap.orderOne.Xb],
      firstStressEndpoint:'The first positive stress is the original complete heat-renormalized coefficient. Its global smooth joins and its physical Cartesian FTC constants were proved before entering this same selector.',
      n1WeightedPoleNotDropped:family.norms.n1Weighted.poles,
      allFixedDerivativeSourceRecipe:true,allInfiniteNodesLiterallyMaterialized:false},
    proof={residualDefinition:'E_B=partial_t u_B-Delta u_B+(u_B dot grad)u_B+grad p_B+div(T_B), evaluated from the original common-cutoff tuple. No residual is defined to be zero.',
      finiteIdentity:'The source coefficient expansion retains all ordered products and viscosity shifts. Each n<=J defect is separately bound to the independent actual leading/positive pressure and stress identities. Every n>J coefficient is retained, giving the complete finite residual bound.',
      comparison:{derivativeOrder:m,decayOrder:request.decayOrder,sourceComparisonIndex:arithmetic.comparisonOrder,
        indexDefinition:'J=max(m+2,ceil((P+2+2*(2*A+m+2)+(m+1))/h))',
        finiteConstantProducer:'attachActualFiniteGlobalResidual on the SAME original source through J, at derivativeOrder m. Its tail.bound is C_fin(J,m) and its partialVelocity.bound is C_u(J,m+2).',
        exactFlatConstant:'C_flat(m,P)=C_fin(J,m)+D_m*2^(-J)*(C_u(J,m+2)+2)',D_m:geometry.momentumDifferenceConstant,
        exactThreshold:'q_mP=min(1,1/(2*b_J)), with b_J from this very same common recursion.',
        bound:'||E_B||_m<=C_flat(m,P)*q^(P+2)<=C_flat(m,P)*q^P for0<q<q_mP.',
        constantsSourceDefinitionExact:true,symbolicIndexNumericallyMaterialized:false,missingFiniteConstantInvented:false,
        executedFiniteComparisonIndex:request.truncationOrder,executedFiniteIndexNotAssertedEqualToSymbolicJ:true},
      nonlinearStep:'Use the independently expanded momentum-difference identity including both mixed transports and (e dot grad)e. Put r=m+2,K=2*A+r,H=m+1. Since tau=(J+1)h-K>P+2+K+H, the tuple tail e<=2^-J*q^tau and the actual finite velocity C_u*q^-K give the bound D_m*2^-J*(C_u+2)*q^(tau-H-K).',
      radialGeometry:'The full Cartesian cylindrical stress-divergence coefficients and all their derivatives through m are bounded by the exact positive monomial recurrence on r>=sqrt(2*q*Xminus). Outside this annulus the stress difference is identically zero, so no singular axis bound is used.',
      leadingExterior:'The residual comparison is supported where a positive-order coefficient, a source cutoff derivative, or the compact leading v0 appears. The untouched full heat exterior has its original exact heat cancellation; it is never truncated.',
      allFiniteInduction:['For arbitrary positive n the original source constructor solves the same Picard system and continuous five-moment inverse. The indeterminate conservation identities and original signed FTC then give its global stress/pressure cancellation.',
        'For arbitrary finite m, ordinary source differentiation and complete rectangular FTC produce the physical velocity/pressure/stress bounds. All finite heat derivatives retain their convergent source domination; explicit work limits merely stop a finite execution.',
        'Apply the fixed common b_n recursion to those actual norms. For every m,P the displayed exact finite J exists because the original h is positive.',
        'Apply the universal finite convolution ledger, physical derivative recurrence and exact nonlinear difference to that J. The loss is independent of J. This proves all fixed physical derivatives and all powers, not an inference from the finite sample.'],
      endpoints:'All eta endpoints use the source one-sided heat jets. The regular Cartesian source gives the axis limits. Every positive stress is zero on a whole axis neighbourhood; leading stress divergence has its independently proved regular coefficient representative.',
      suppliedForcingToMakeResidualZero:false,newLeanKernelProof:false},
    checks=[{id:'private-common-source-family',pass:assertActualCommonAdmissibleFamily(family)},
      {id:'complete-actual-finite-residual-cancellation-and-bound',pass:assertActualFiniteGlobalResidual(finite)&&finite.tail.fullFiniteResidualBoundEstablished},
      {id:'same-full-leading-target-body-and-shears',pass:leadingBinding.pass},
      {id:'same-recursive-physical-norm-sequence',pass:sameSequence.pass},
      {id:'same-source-cutoff-stream-continuity',pass:cutoff.pass&&continuityRows.every(r=>r.pass)&&continuity.sourceLeadingContinuity},
      {id:'complete-Cartesian-coefficients-and-nonlinear-difference',pass:finite.generic.cartesian.pass&&finite.generic.scaling.pass&&arithmetic.genericMomentumDifference.pass},
      {id:'strict-positive-original-h-exponent-comparison',pass:family.selector.positiveSourceH.positive&&arithmetic.marginCheck.pass&&!arithmetic.hReplacedByZero},
      {id:'source-exact-no-free-coordinate-majorants',pass:[geometry.momentumDifferenceConstant,finite.tail.bound,finite.partialVelocity.bound].every(id=>G.freeCoordinates(id).size===0)}],
    roots={sourceComparisonIndex:arithmetic.comparisonOrder,actualFiniteResidualBound:finite.tail.bound,actualFiniteResidualGain:finite.tail.gain,
      actualFiniteResidualLoss:finite.tail.loss,actualFiniteVelocityBound:finite.partialVelocity.bound,
      actualStressGeometryConstant:geometry.stressConstant,actualMomentumDifferenceConstant:geometry.momentumDifferenceConstant},
    scope={sourceCommonBackgroundResidualFlatnessTheorem:true,sameCommonAllFixedDerivativeTupleTail:true,
      allFinitePhysicalResidualLossIndependentOfComparisonOrder:true,allOrderedConvolutionAndCutoffCommutatorsRetained:true,
      actualFiniteCoefficientEvidence:true,allFixedOrdersBySourceInduction:true,allInfiniteGraphsLiterallyExecuted:false,
      mathematicalDerivativeOrderCap:null,mathematicalTruncationOrderCap:null,
      sourceNumericalConstantsEvaluated:false,actualBandResidualAttached:false,wholeGN4Complete:false,wholeM2Complete:false,newLeanKernelProof:false,m3MayStart:false};
  if(checks.some(r=>!r.pass))fail('INVALID_SOURCE_CONSTRUCTION','An original common background residual prerequisite failed: '+checks.filter(r=>!r.pass).map(r=>r.id).join(', '));
  const result={G,family,finite,request,sourceBinding:{oneCommonOriginalFamily:true,sourceParameterExpressionSHA256:family.sourceBinding.parameterExpressionSHA256,
      copiedFamilyNodeCount:family.program.nodes.length,unrelatedCutoffSequenceUsed:false,sourceFiniteComparisonOnly:request.truncationOrder},
    sameSequence,leadingBinding,continuity,tupleTail,arithmetic,geometry,proof,roots,checks,scope},
    packed=G.pack(roots,{schema:'MathScope.ActualBackgroundResidualFlatnessProgram/1',...data(result)}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  seals.set(result,{G,family,finite,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result)),program:canonicalStringify(result.program)});
  context.onProgress?.({stage:'same-common-background-residual-flatness-theorem-sealed',nodeCount:G.nodes.length});return result;
}

export function assertActualBackgroundResidualFlatness(result){
  const s=seals.get(result);if(!s||s.G!==result.G||s.family!==result.family||s.finite!==result.finite||canonicalStringify(data(result))!==s.data||
    canonicalStringify(result.program)!==s.program||canonicalStringify(result.G.nodes.slice(0,s.count))!==s.prefix||!result.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private same-common-source residual flatness theorem.');
  assertActualCommonAdmissibleFamily(result.family);assertActualFiniteGlobalResidual(result.finite);return true;
}

export async function actualBackgroundResidualFlatnessCertificate(result){
  assertActualBackgroundResidualFlatness(result);const encoded=canonicalStringify(result.program);
  return {schema:'MathScope.ActualBackgroundResidualFlatnessCertificate/1',...data(result),graph:{sha256:await sha256(encoded),nodeCount:result.program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length,fixedCompilerPrefix:true}};
}
