/** Original fixed-label wave, including its slow cutoff and physical map.
 *
 * The local source is authenticated by actual-full-curl.mjs. The original
 * palette and full integer partition are reused, but this constructor does
 * not copy the exercised ell=1 pulse to the other bands in that partition.
 * Positive-weight membership, all-band execution and global flat residual
 * estimates remain separate conclusions.
 */
import {prepareActualFullCurlProgram,assertActualFullCurlProgram,exactCylindricalHarmonicCurl,normalizeEqualPiecewiseBranches} from './actual-full-curl.mjs';
import {attachSourcePalette,attachActualSlowPartition} from './actual-covariance-source-certificate.mjs';
import {sourcePartitionBump} from './actual-covariance-global-assembly.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {rational as Q,qadd,qmul,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap();
const progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,...(G?{nodeCount:G.nodes.length}:{}),...extra});};
const root=(G,id)=>Number.isSafeInteger(id)&&id>=0&&!!G.nodes[id];
const same=(G,a,b,atomicNodes=[])=>{
  const n=normalizeEqualPiecewiseBranches(G,G.sub(a,b),atomicNodes);
  return {...sourceGraphRationalIdentity(G,n.normalized,{atomicNodes,maxTerms:40000}),equalBranchNormalization:n.identities};
};

/** Differentiate the actual product cutoff*C. The cutoff derivative is
 * generated from its body; no supplied gradient or curl is accepted.
 * The returned identity is generic until a private source adapter binds it.
 */
export function exactScalarCutoffHarmonicCurl(G,input,context={}){
  const keys=['R','Z','xi','epsilon','radialFast','k','normal','potential','cutoff'];
  if(!input||Object.keys(input).some(k=>!keys.includes(k))||!root(G,input.cutoff))fail('INVALID_INPUT','Use a retained scalar cutoff and the full cylindrical harmonic geometry.');
  const {cutoff,...geometry}=input;progress(context,'cutoff-base-curl-start',G);
  const base=exactCylindricalHarmonicCurl(G,geometry),{R,Z,xi,epsilon,radialFast}=geometry;
  progress(context,'cutoff-base-curl-done',G);
  const Dr=x=>G.add(G.derivative(x,R),G.mul(radialFast,G.derivative(x,xi))),Dz=x=>G.mul(epsilon,G.derivative(x,Z));
  const cutoffR=Dr(cutoff),cutoffZ=Dz(cutoff),potential=geometry.potential.map(x=>G.mul(cutoff,x));
  progress(context,'cutoff-full-curl-start',G);
  const full=exactCylindricalHarmonicCurl(G,{...geometry,potential});
  progress(context,'cutoff-full-curl-done',G);
  const C=geometry.potential,commutator=[G.neg(G.mul(cutoffZ,C[1])),G.sub(G.mul(cutoffZ,C[0]),G.mul(cutoffR,C[2])),G.mul(cutoffR,C[1])];
  const expectedLeading=base.leading.map(x=>G.mul(cutoff,x));
  const expectedRemainder=base.remainder.map((x,j)=>G.add(G.mul(cutoff,x),commutator[j]));
  // Arithmetic subexpressions must stay arithmetic: treating both a
  // polynomial and one of its derivatives as unrelated atoms can conceal
  // valid distributive identities. Retained shared source functions are
  // already opaque atoms in the rational checker without such overrides.
  const check=(id,a,b)=>{progress(context,id+'-start',G);const result={id,...same(G,a,b)};progress(context,id+'-done',G,{pass:result.pass});return result;};
  const checks=[...expectedLeading.map((x,j)=>check('cutoff-leading-'+j,full.leading[j],x)),
    ...expectedRemainder.map((x,j)=>check('cutoff-product-curl-'+j,full.remainder[j],x))];
  if(!checks.every(x=>x.pass))fail('INTERNAL_VALIDATION','The scalar cutoff curl lost a product or cylindrical connection term.');
  return {schema:'MathScope.ExactScalarCutoffHarmonicCurl/1',cutoff,cutoffR,cutoffZ,base,full,commutator,checks,
    formula:'curl(i*eta*C*exp(i*k*Phi)) = eta*curl(i*C*exp(i*k*Phi)) + i*(grad(eta) cross C)*exp(i*k*Phi)',
    coefficientFormula:'real=eta*leading; imaginary=eta*curlRemainder+[-D_z(eta)*C_theta,D_z(eta)*C_r-D_r(eta)*C_z,D_r(eta)*C_theta]',
    sourceAuthenticated:false,globalPhysicalResidualProved:false};
}

/** Exact powers in the pinned convention A=1/2+h, D=1/2-h.
 * These are affine polynomials in h, not evaluations of its tiny value.
 */
export function actualPhysicalWaveExponentAudit(){
  const add=(...xs)=>[0,1].map(j=>xs.reduce((s,x)=>qadd(s,x[j]),Q(0))),scale=(x,n,d=1)=>x.map(c=>qmul(c,Q(n,d))),neg=x=>scale(x,-1);
  const half=[Q(1,2),Q(0)],one=[Q(1),Q(0)],h=[Q(0),Q(1)],A=add(half,h),D=add(half,neg(h));
  const potential=add(half,neg(A)),velocity=neg(A),pressure=scale(A,-2),residual=neg(add(A,one,h));
  const rows=[
    {id:'potential-to-velocity',left:add(potential,neg(half)),right:velocity},
    {id:'axial-normalization',left:add(half,neg(D)),right:h},
    {id:'time-slow-normalization',left:add(one,h,neg(one)),right:h},
    {id:'pulse-time-fast-cancellation',left:add(h,one,neg(add(one,h))),right:[Q(0),Q(0)]},
    {id:'pressure-gradient-normalization',left:add(pressure,neg(half)),right:residual},
    {id:'quadratic-transport-normalization',left:add(scale(velocity,2),neg(half)),right:residual},
    {id:'viscosity-normalization',left:add(velocity,neg(one),neg(residual)),right:h}
  ].map(r=>({...r,left:r.left.map(qtext),right:r.right.map(qtext),difference:add(r.left,neg(r.right)).map(qtext),pass:add(r.left,neg(r.right)).every(x=>x[0]===0n)}));
  return {schema:'MathScope.ActualPhysicalWaveExponents/1',arithmetic:'BIGINT_RATIONAL_AFFINE_POLYNOMIALS_IN_H',rows,pass:rows.every(x=>x.pass),
    potentialScale:'Q^(1/2-A)',velocityScale:'Q^(-A)',pressureScale:'Q^(-2A)',physicalResidualScale:'Q^(-A-1-h)',
    normalizedResidual:'t_star*u+(u dot nabla_star)u-epsilon*Delta_star*u+nabla_star*p',hReplacedByZero:false};
}

/** The original chi_j, evaluated in the fixed offset x-j. On the support
 * of b(x-j), the same complete infinite denominator has only the three
 * translates j-1,j,j+1. Outside that support chi_j is identically zero.
 * Fixed endpoints avoid differentiating a changing nearest-integer label.
 * The zero guard also prevents evaluation of a vanishing truncated
 * denominator far outside the support.
 */
export function fixedLabelSourcePartitionFactor(G,offset){
  if(!root(G,offset))fail('INVALID_INPUT','A fixed-label source partition factor requires a retained offset.');
  const q=(n,d=1)=>G.q(n,d),relativeIndices=[-1,0,1],bumps=relativeIndices.map(j=>sourcePartitionBump(G,G.sub(offset,q(j))));
  const denominator=G.add(...bumps.map(x=>G.pow(x,2))),numerator=bumps[1],quotient=G.div(numerator,G.sqrt(denominator));
  const value=G.choose(offset,q(-3,4),q(3,4),G.zero,quotient,G.zero);
  return {offset,value,numerator,denominator,relativeIndices,bumps,activeOffsetInterval:[q(-3,4),q(3,4)],
    exactOriginalFactor:'chi_j(x)=b(x-j)/sqrt(sum_(k in Z)b(x-k)^2); outside |x-j|<3/4 the numerator and every boundary jet are zero.',
    completeDenominatorOnActiveSupport:'For |x-j|<=3/4 and |k-j|>=2, |x-k|>=5/4>3/4. Every omitted translate is exactly zero.',
    denominatorLowerOnActiveSupport:'The nearest integer to x lies among j-1,j,j+1, within distance1/2. Its bump is at least1/2, so the denominator is at least1/4.',
    derivativesOfIntegerReselectionUsed:false,zeroGuardBeforeDenominatorEvaluation:true};
}

/** One fixed beta=(ell,a), with the SAME original normalized factors.
 * The square root is applied to a positive denominator on the factor's
 * fixed support, not to b^2 at its flat boundary.
 */
function fixedLabelCutoff(G,operator,auxiliary,actualPartition){
  const {R,Z,T}=operator.coordinates,bandAxis=fixedLabelSourcePartitionFactor(G,G.sub(actualPartition.bandCoordinate,operator.geometry.ell));
  const bandNumerator=bandAxis.numerator,bandDenominator=bandAxis.denominator,bandFactor=bandAxis.value;
  const meshCoordinates=[R,Z,T].map(x=>G.mul(G.pow(operator.geometry.ell,6),x));
  const meshAxes=meshCoordinates.map((coordinate,j)=>{
    const offset=G.sub(coordinate,auxiliary.grid[j]),axis=fixedLabelSourcePartitionFactor(G,offset);
    return {coordinate,offset,fixedInteger:auxiliary.grid[j],numerator:axis.numerator,denominator:axis.denominator,factor:axis.value,axis};
  });
  const body=G.mul(bandFactor,...meshAxes.map(a=>a.factor)),parameters=[R,Z,T,...auxiliary.grid];
  const value=G.share(body,parameters,'ActualPhysicalFixedLabelSlowCutoff');
  const firstBodyDerivatives=[R,Z,T].map(x=>G.derivative(body,x)),firstSharedDerivatives=[R,Z,T].map(x=>G.derivative(value,x));
  const materializedFirstDerivatives=firstSharedDerivatives.map(id=>{const node=G.nodes[id];return node.op==='actual_expression_partial'?G.materializeExpressionFunction(...node.args):id;});
  if(materializedFirstDerivatives.some((x,j)=>x!==firstBodyDerivatives[j]))fail('INTERNAL_VALIDATION','The actual fixed-label cutoff derivative failed to materialize from its own body.');
  const mixedRZ=G.derivative(firstBodyDerivatives[0],Z),mixedZR=G.derivative(firstBodyDerivatives[1],R);
  if(G.dependsOn(value,operator.coordinates.theta)||G.dependsOn(value,operator.coordinates.v)||G.dependsOn(value,operator.cutoffs.xi))fail('INVALID_SOURCE_CONSTRUCTION','The original slow cutoff acquired an angular or auxiliary dependence.');
  return {value,body,parameters,bandAxis,bandNumerator,bandDenominator,bandFactor,meshAxes,
    firstBodyDerivatives,firstSharedDerivatives,materializedFirstDerivatives,mixedRZ,mixedZR,
    actualDerivativeBodiesMaterialized:true,derivativesOfIntegerReselectionUsed:false,
    sourceDefinition:'eta_beta=chi_ell(-log(q)/log2)*product_j chi_a_j(ell^6*C_ell,j), beta=(ell,a) fixed; chi_j=b(x-j)/sqrt(sum_k b(x-k)^2)',
    denominatorLower:'1/4 for each squared-bump sum on its active fixed-label support, using a nearest integer only in the proof.',
    exactZeroComplement:'Every omitted denominator translate is exactly zero. An active fixed numerator has a label among the complete source candidates.',
    smoothReindexing:'The fixed three-neighbor formula agrees with the full integer family on the numerator support. Its flat zero guard gives the same global factor without differentiating a reselected integer.',
    labelDomain:'a is a fixed integer triple; its original selected box intersects the active annulus and contains the frozen representative.'};
}

function mapSupportedScalar(G,operator,auxiliary,rectangle,body){
  const local=G.simultaneousSubstitute(body,[operator.cutoffs.xi,operator.coordinates.v],[rectangle.xi,rectangle.v]);
  const time=G.choose(rectangle.v,G.zero,operator.geometry.Ls,G.zero,local,G.zero);
  const transverse=G.choose(rectangle.xi,G.neg(operator.geometry.r0),operator.geometry.r0,G.zero,time,G.zero);
  const Xb=operator.background.prepared.bootstrap.actualHeat.heat.Xb;
  const shell=G.choose(operator.chart.X,G.parameter('Xa'),Xb,G.zero,transverse,G.zero);
  return G.simultaneousSubstitute(shell,auxiliary.Yi,auxiliary.physicalMap.Yi);
}

const binding=p=>canonicalStringify({request:p.request,slowCutoff:p.slowCutoff,geometry:p.geometry,rows:p.rows,domain:p.domain,scope:p.scope,checks:p.checks,roots:p.roots,assembly:p.assembly});

/** Attach to one internally constructed full source curl; no new source
 * job is started. The graph clone retains the original node IDs, so the
 * palette helpers receive the current graph with the original source data.
 */
export function attachActualPhysicalFullCurl(local,context={}){
  progress(context,'physical-source-authentication-start',local.G);assertActualFullCurlProgram(local);progress(context,'physical-source-authentication-done',local.G);
  const {G,operator:o}=local,startNode=G.nodes.length,operator={...o,G},q=(n,d=1)=>G.q(n,d);
  progress(context,'physical-palette-start',G);const auxiliary=attachSourcePalette(operator);progress(context,'physical-palette-done',G);
  const actualPartition=attachActualSlowPartition(operator);progress(context,'physical-slow-partition-done',G);
  const slowCutoff=fixedLabelCutoff(G,operator,auxiliary,actualPartition);progress(context,'physical-fixed-label-cutoff-done',G);
  const scalePotential=local.geometry.physicalPotentialScale,scaleVelocity=local.geometry.physicalVelocityScale;
  const scalePressure=G.exp(G.mul(G.neg(G.mul(q(2),o.constants.A)),G.log(o.geometry.Q))),exponents=actualPhysicalWaveExponentAudit(),rows=[];
  for(const source of local.rows){
    context.checkCancelled?.();const f=o.families.find(r=>r.sign===source.sign),rectangle=auxiliary.rectangleRows.find(r=>r.sign===source.sign);
    if(!f||!rectangle)fail('INVALID_SOURCE_CONSTRUCTION','The physical label must retain both original sign families.');
    progress(context,'physical-sign-start',G,{sign:source.sign});
    const joined=exactScalarCutoffHarmonicCurl(G,{...source.curl.geometry,potential:source.curl.potential,cutoff:slowCutoff.value},context);
    const phaseArgument=G.mul(o.geometry.k,f.phase),cos=G.cosine(phaseArgument),sin=G.sine(phaseArgument);
    const rawPressureImaginary=G.mul(slowCutoff.value,G.sqrt(o.geometry.epsilon),source.sigma,source.cutoff,
      G.add(...f.frame.pressureImaginaryRow.map((x,j)=>G.mul(x,f.t[j]))));
    const pressureParameters=[...source.potentialParameters,...auxiliary.grid];
    const pressureImaginary=G.share(rawPressureImaginary,pressureParameters,'ActualPhysicalPressureCoefficient_'+source.sign);
    const realPotential=joined.full.potential.map(x=>G.neg(G.mul(scalePotential,x,sin)));
    const realVelocity=joined.full.fullCoefficient.map(x=>G.mul(scaleVelocity,G.sub(G.mul(x.real,cos),G.mul(x.imaginary,sin))));
    const realPressure=G.neg(G.mul(scalePressure,pressureImaginary,sin));
    progress(context,'physical-potential-map-start',G,{sign:source.sign});
    const physicalPotential=realPotential.map(x=>mapSupportedScalar(G,o,auxiliary,rectangle,x));progress(context,'physical-potential-map-done',G,{sign:source.sign});
    const physicalVelocity=realVelocity.map(x=>mapSupportedScalar(G,o,auxiliary,rectangle,x));progress(context,'physical-velocity-map-done',G,{sign:source.sign});
    const physicalPressure=mapSupportedScalar(G,o,auxiliary,rectangle,realPressure);
    progress(context,'physical-pressure-map-done',G,{sign:source.sign});
    const conjugates=[1,-1].map(m=>({harmonic:m,angularInteger:G.mul(q(m),f.carrier.roundedInteger),
      phase:f.phase,carrier:o.geometry.k,
      potential:joined.full.potential.map(x=>({real:G.zero,imaginary:G.mul(q(m,2),x)})),
      velocity:joined.full.fullCoefficient.map(x=>({real:G.mul(q(1,2),x.real),imaginary:G.mul(q(m,2),x.imaginary)})),
      pressure:{real:G.zero,imaginary:G.mul(q(m,2),pressureImaginary)}}));
    const originalPhaseDefect=f.fullEikonalRemainder;
    rows.push({sign:source.sign,phase:f.phase,phaseArgument,rectangle,joined,pressureImaginary,rawPressureImaginary,pressureParameters,
      physicalPotential,physicalVelocity,physicalPressure,conjugates,originalPhaseDefect,
      sourceAmplitude:source.weightedCutoffAmplitude,originalPressureImaginaryRow:f.frame.pressureImaginaryRow,
      slowCutoffCurlCommutesWithoutRemainder:false,
      realWaveFormula:'Q^(-A)*(eta*leading*cos(k*Phi)-(eta*remainder+grad(eta) cross C)*sin(k*Phi))',
      pressureFormula:'-Q^(-2A)*eta*sqrt(epsilon)*sqrt(y)*chi*psi*(original pressureImaginaryRow dot t)*sin(k*Phi)',
      physicalMapOrder:'First multiply the original potential by eta_beta; differentiate on the independent local coordinates; compose xi,v with the original palette rectangle; substitute the physical Yi; apply the physical scale.'});
  }
  const mappedRoots=rows.flatMap(r=>[...r.physicalPotential,...r.physicalVelocity,r.physicalPressure]);
  const freeIndependentAuxiliary=mappedRoots.some(id=>{const c=G.freeCoordinates(id);return c.has(o.cutoffs.xi)||c.has(o.coordinates.v)||auxiliary.Yi.some(y=>c.has(y));});
  progress(context,'physical-mapped-free-coordinate-check-done',G);
  const geometry={source:'Original (6.3),(6.6),(6.9),(6.11),(7.3),(7.13),(7.38)',physicalMap:auxiliary.physicalMap,palette:auxiliary.palette,
    fixedLabel:{ell:o.geometry.ell,grid:auxiliary.grid,representative:[o.coordinates.Xrep,o.coordinates.etaRep,o.coordinates.sRep]},
    coordinateMeaning:'R=r/sqrt(Q), Z=z/Q^D, T=(1-t)/Q; physicalYi=Jg^i*(v_r*r^d_r+v_t*t). Returned cylindrical components are functions of these physical chart coordinates.',
    normalizedOperators:{radial:local.geometry.operator,axial:'epsilon*partial_Z',time:'-epsilon*partial_T+partial_v',angular:'R^-1*partial_theta'},
    mapIdentities:auxiliary.torus.chainRule,exponents,scalePotential,scaleVelocity,scalePressure};
  const assembly={candidateCount:actualPartition.labels.length,candidates:actualPartition.labels,actualPartition,
    formula:'Sum the fixed-label real physical curls once over every beta=(ell,a); each beta contains the two distinct sign rectangles, each represented by its m=+1,-1 conjugate pair.',
    completeIntegerPartitionReused:true,allIndexPaletteSeparationReused:auxiliary.palette.commonToAllBandsAndLabels,
    paletteSeparationDomain:'The original common palette theorem uses ell>=ell0>=8 and its source overlap hypotheses. Its formulas may be retained at ell=1 without proving that this exercised band meets those hypotheses.',
    paletteSeparationExercisedBandCertified:false,
    actualPulseInstancesGenerated:1,exercisedEll:local.request.ellExact,otherCandidatePulsesMaterialized:false,
    requiredAllBandConstruction:'For each active beta, construct its own actualBackgroundDyadicPrefix, representative, carrier, Volterra solution, H and weight before applying this operator. The one exercised source is not substituted into another beta.',
    sameLabelProducts:'Opposite harmonics of the same sign rectangle survive angular averaging. Curl/cutoff remainders and both ordered cross products must remain.',
    conditionalLocalFiniteness:'On a compact q>0 set, the original complete band/mesh supports give finitely many active labels. Each smooth source potential is curled before this finite local sum.'};
  const domain={...local.domain,additionalPhysicalConditions:[...local.domain.additionalConditions,
    slowCutoff.labelDomain,'Any all-label palette conclusion requires the original ell>=ell0>=8 and overlap hypotheses.',
    'The original flat square-root extension is required at Xa/Xb; the interior quotient formulas are not evaluated at zero weight.'],
    evaluatedPhysicalMap:true,positiveWeightDomainMembershipCertified:false,
    support:'The original fixed slow box, its original palette rectangle, and Xa<X<Xb. Explicit zero guards precede Volterra or square-root evaluation outside that support.',
    allIndexConclusion:'The full physical family has not been materialized by this one-member execution. Uniform smooth and flat bounds are independent gates.'};
  const scope={actualFixedLabelPhysicalCurlConstructed:true,actualSlowCutoffBeforeCurl:true,actualSlowCutoffCommutatorRetained:true,
    originalPaletteAndPhysicalMapReused:true,originalConjugateHalfFactorsRetained:true,originalPressureCoefficientRetained:true,
    originalNonzeroEikonalDefectRetained:true,independentAuxiliaryVariablesEliminated:!freeIndependentAuxiliary,
    allIndexPartitionConstructed:true,actualAllLabelPulseFamilyConstructed:false,exercisedBandPositiveWeightsCertified:false,
    physicalDivergenceConditionalOnOriginalSmoothDomain:true,globalDivergenceCertified:false,allFixedOrderFlatExtensionsCertified:false,
    fullPhysicalResidualAndFlatErrorPackageComplete:false,numericalPhysicalVelocityEnclosed:false,actualSourceAnalyticLeanTheorem:false,
    originalM2AcceptanceCountChanged:false,fullSameProfileN5:false};
  progress(context,'physical-final-checks-start',G);
  const checks=[{id:'authenticated-original-local-curl',pass:assertActualFullCurlProgram(local)},
    {id:'original-slow-cutoff-product-derivatives',pass:rows.every(r=>r.joined.checks.every(c=>c.pass))},
    {id:'weighted-potential-divergence-premises',pass:rows.every(r=>r.joined.full.divergence.checks.every(c=>c.pass))},
    {id:'actual-two-source-signs-and-conjugate-halves',pass:rows.length===2&&rows.every(r=>r.conjugates.length===2&&r.conjugates[0].harmonic===1&&r.conjugates[1].harmonic===-1)},
    {id:'original-physical-scaling',pass:exponents.pass&&auxiliary.torus.pass},
    {id:'source-map-removes-independent-auxiliary-coordinates',pass:!freeIndependentAuxiliary},
    {id:'complete-original-partition-without-copying-one-pulse',pass:actualPartition.labels.length===81&&assembly.actualPulseInstancesGenerated===1&&!assembly.otherCandidatePulsesMaterialized},
    {id:'no-domain-or-global-residual-promotion',pass:!scope.exercisedBandPositiveWeightsCertified&&!scope.actualAllLabelPulseFamilyConstructed&&!scope.fullPhysicalResidualAndFlatErrorPackageComplete}];
  if(!checks.every(c=>c.pass))fail('INTERNAL_VALIDATION','An actual fixed-label physical curl contract failed.');
  progress(context,'physical-final-checks-done',G);
  const roots={slowCutoff:slowCutoff.value,...Object.fromEntries(rows.flatMap(r=>[
    ...r.physicalPotential.map((x,j)=>['physical_potential_'+r.sign+'_'+j,x]),
    ...r.physicalVelocity.map((x,j)=>['physical_velocity_'+r.sign+'_'+j,x]),['physical_pressure_'+r.sign,r.physicalPressure],
    ...r.joined.commutator.map((x,j)=>['slow_cutoff_commutator_'+r.sign+'_'+j,x]),['original_eikonal_defect_'+r.sign,r.originalPhaseDefect]]))};
  const p={G,local,operator:o,request:local.request,auxiliary,slowCutoff,rows,geometry,assembly,domain,scope,checks,roots};
  progress(context,'physical-pack-start',G);
  p.program=G.pack(roots,{schema:'MathScope.ActualPhysicalFullCurlProgram/1',compiler:'actual-physical-full-curl.mjs:prepareActualPhysicalFullCurlProgram',compilerInput:p.request,
    sourceProfile:o.sourceProfile,parameterExpressionSHA256:o.parameterExpressionSHA256,geometry,slowCutoff,rows,assembly,domain,scope,checks});
  const {nodes,...metadata}=p.program;
  // A later consumer may append source nodes, but it must not rewrite this
  // receipt's published prefix or compiler metadata. Keep the private
  // certificate metadata independent of the public program object.
  p.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  seals.set(p,{G,local,startNode,nodeCount:G.nodes.length,addedNodes:JSON.stringify(G.nodes.slice(startNode)),definitions:G.captureFunctionDefinitions(),binding:binding(p),
    metadata:structuredClone(metadata),metadataBinding:canonicalStringify(metadata)});
  progress(context,'physical-source-constructed',G);
  return p;
}

export function prepareActualPhysicalFullCurlProgram(input={},context={}){
  progress(context,'original-local-full-curl-start');const local=prepareActualFullCurlProgram(input,context);progress(context,'original-local-full-curl-done',local.G);
  return attachActualPhysicalFullCurl(local,context);
}

export function assertActualPhysicalFullCurlProgram(p){
  const s=seals.get(p);if(!s||s.G!==p.G||s.local!==p.local||JSON.stringify(p.G.nodes.slice(s.startNode,s.nodeCount))!==s.addedNodes||!p.G.functionDefinitionsUnchanged(s.definitions)||binding(p)!==s.binding)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally constructed physical fixed-label source program.');
  const {nodes,...metadata}=p.program??{};
  if(!Array.isArray(nodes)||nodes.length!==s.nodeCount||nodes.some((node,j)=>node!==p.G.nodes[j])||canonicalStringify(metadata)!==s.metadataBinding)
    fail('INVALID_SOURCE_CONSTRUCTION','The physical curl receipt must retain its published source prefix and compiler metadata.');
  assertActualFullCurlProgram(p.local);return true;
}

export async function actualPhysicalFullCurlCertificateFromProgram(p,context={}){
  assertActualPhysicalFullCurlProgram(p);context.checkCancelled?.();const s=seals.get(p),{G}=p,serialized=canonicalStringify({...s.metadata,nodes:G.nodes.slice(0,s.nodeCount)});
  const expression=id=>({rootId:id,operation:G.nodes[id].op,arguments:structuredClone(G.nodes[id].args),valueKind:'Exact conditional source expression; no numerical enclosure'});
  return {schema:'MathScope.ActualPhysicalFullCurlCertificate/1',status:'COMPLETED',pass:true,request:p.request,
    sourceProfile:p.operator.sourceProfile,parameterExpressionSHA256:p.operator.parameterExpressionSHA256,
    completedScope:'One authentic fixed-label source curl with its original slow cutoff, real conjugates, pressure coefficient and evaluated physical map.',
    graph:{sha256:await sha256(serialized),nodeCount:s.nodeCount,serializedProgramBytes:new TextEncoder().encode(serialized).length,roots:p.roots,compiler:s.metadata.compiler,compilerInput:p.request,graphIncluded:false},
    geometry:p.geometry,domain:p.domain,scope:p.scope,checks:p.checks,
    physicalRows:p.rows.flatMap(r=>r.physicalVelocity.map((x,j)=>({sign:r.sign,component:['r','theta','z'][j],potential:expression(r.physicalPotential[j]),velocity:expression(x),
      slowCutoff:expression(p.slowCutoff.value),slowCutoffCommutator:expression(r.joined.commutator[j]),pressure:expression(r.physicalPressure)}))),
    divergenceRows:p.rows.map(r=>({sign:r.sign,realExpression:expression(r.joined.full.divergence.real),imaginaryExpression:expression(r.joined.full.divergence.imaginary),
      conditionalValue:[0,0],domainMembershipCertified:false,premises:r.joined.full.divergence.checks,theorem:r.joined.full.divergence.theorem})),
    assembly:{candidateCount:p.assembly.candidateCount,actualPulseInstancesGenerated:1,otherCandidatePulsesMaterialized:false,completeIntegerPartitionReused:true,
      paletteSeparationDomain:p.assembly.paletteSeparationDomain,paletteSeparationExercisedBandCertified:false,requiredAllBandConstruction:p.assembly.requiredAllBandConstruction},
    nextDependency:'Bind the full actual family and positive-weight domain; construct sufficient source jets and all-label Gaussian bounds; compute the original physical residual with background stress and retain every flat tail.'};
}

export async function actualPhysicalFullCurlCertificate(input={},context={}){
  return actualPhysicalFullCurlCertificateFromProgram(prepareActualPhysicalFullCurlProgram(input,context),context);
}
