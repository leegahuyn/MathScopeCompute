/** The original source-domain cutoff and the exact operator in (10.4).
 *
 * The cutoff is constructed on the authenticated common6/inner-growth graph.
 * Its application names the SAME final A, B e_theta and p_loc of (9.21).
 * Those final fields are external source-theorem inputs: this module does not
 * manufacture the unimplemented N6 correction sequence or its global force.
 */
import {prepareActualInnerGrowth,assertActualInnerGrowth,actualInnerGrowthCertificate} from './source-inner-growth.mjs';
import {sourceExponentContract} from '../../mathscope-m2/navier/source-profile.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const copy=x=>structuredClone(x);
const DEFAULT_TAUS=['1e-2','1e-4','1e-8','1e-12','1e-40','1e-1000'];
const metadata=x=>({schema:x.schema,request:x.request,sourceBinding:x.sourceBinding,constants:x.constants,
  cutoff:x.cutoff,regularity:x.regularity,domain:x.domain,fieldInputs:x.fieldInputs,operator:x.operator,
  decimalSamples:x.decimalSamples,innerPath:x.innerPath,checks:x.checks,scope:x.scope,formulaProgram:x.formulaProgram});

/** Exact decimal sign/magnitude parsing; no positive tau is inferred from t. */
export function exactLocalizationTau(value){
  if(typeof value!=='string'||value.length>256)fail('INVALID_TAU','Use a positive decimal string of at most 256 characters.');
  const m=value.match(/^\+?(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);
  if(!m)fail('INVALID_TAU','Use an exact positive decimal tau.');
  const coefficient=(m[1]+(m[2]??'')).replace(/^0+/,'');
  if(!coefficient)fail('TERMINAL_TIME_FORBIDDEN','tau=0 is not a source evaluation point.');
  const exponent=Number(m[3]??0),power=exponent-(m[2]??'').length;
  if(!Number.isSafeInteger(exponent)||Math.abs(exponent)>1000000)fail('RESOURCE_LIMIT','The decimal exponent budget is one million.');
  if(coefficient.length+power>0)fail('INVALID_TAU','The localization time domain requires 0<tau<1.');
  const numerical=Number(value);
  return {input:value,coefficient,powerOfTen:power,exactSign:'POSITIVE',
    exactExpression:'coefficient*10^powerOfTen',sourceOfTruth:'EXACT_DECIMAL_PAIR',
    displayTau:Number.isFinite(numerical)&&numerical>0?numerical:null,
    displayTime:1-numerical,displayTimeRoundedToOne:1-numerical===1,
    internalTauReconstructedFromDisplayedTime:false,underflowReplacedByZero:false};
}

function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='decimalTaus'))
    fail('INVALID_INPUT','Only decimal observation times may be selected. Original cutoff/source parameters are fixed.');
  const values=input.decimalTaus??DEFAULT_TAUS;
  if(!Array.isArray(values)||!values.length||values.length>32||new Set(values).size!==values.length)
    fail('INVALID_INPUT','Use 1..32 distinct exact decimal observation times.');
  values.forEach(exactLocalizationTau);return {decimalTaus:[...values]};
}

/** P_n(v)e^-v is the nth u derivative of exp(-1/u), v=1/u. */
export function flatExponentialJetPolynomial(order){
  if(!Number.isSafeInteger(order)||order<0||order>32)fail('RESOURCE_LIMIT','A finite smoothness witness supports orders 0..32.');
  let coefficients=[1n];
  for(let n=0;n<order;n++){
    const next=Array(coefficients.length+2).fill(0n);
    coefficients.forEach((a,j)=>{next[j+2]+=a;if(j)next[j+1]-=BigInt(j)*a;});
    while(next.length>1&&next.at(-1)===0n)next.pop();coefficients=next;
  }
  return {order,coefficients:coefficients.map(String),variable:'v=1/u',
    recurrence:'P_(n+1)(v)=v^2*(P_n(v)-P_n_prime(v))',
    flatnessProof:'For each monomial v^m, v^m*exp(-v)<=(m+1)!/v for v>0. Thus every derivative tends to zero as u decreases to zero.',
    allOrderRecurrence:true,finiteOrderDoesNotCapMathematicalSmoothness:true};
}

function extendScalarProgram(inner,G,roots){
  const program=copy(inner.formulaProgram),mapping=new Map(program.sourceNodeIds.map((id,i)=>[id,i]));
  function append(id){
    if(mapping.has(id))return mapping.get(id);const node=G.nodes[id];if(!node)fail('INVALID_SOURCE_CONSTRUCTION','Missing localization scalar expression.');
    const {op,args}=node;let out;
    if(['rational','source_parameter','coordinate'].includes(op))out=[...args];
    else if(['integer_power','source_step_derivative'].includes(op))out=[append(args[0]),args[1]];
    else if(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling','floor','sine','cosine','definite_integral','smooth_piecewise'].includes(op))out=args.map(append);
    else fail('INVALID_SOURCE_CONSTRUCTION','Unsupported localization scalar operation '+op);
    const next=program.nodes.length;program.nodes.push({op,args:out});program.sourceNodeIds.push(id);mapping.set(id,next);return next;
  }
  const localizationRoots=Object.fromEntries(Object.entries(roots).map(([name,id])=>[name,append(id)]));
  return {...program,schema:'MathScope.N7.SourceLocalizationScalarProgram/1',
    sourceInnerProgramRoots:program.roots,roots:localizationRoots,
    allScalarRootsHaveNoFreeCoordinates:false,
    coordinateDependentRootsExplicit:true,freeCoordinates:Object.fromEntries(Object.entries(roots).map(([name,id])=>[name,[...G.freeCoordinates(id)].map(x=>G.nodes[x].args[0])])),
    meaning:'Closed source constants plus the actual open Cartesian cutoff and its generated derivatives. Original inner-path expressions are retained, not numerically rounded.'};
}

function fixedSourceInputs(inner){
  const family=inner.family,prepared=family.prepared;
  return {schema:'MathScope.N7.OriginalLocalFieldInputs/1',sharedInstance:'ORIGINAL_PROP9_9_FINAL_FIELDS_ON_SAME_COMMON_DOMAIN',
    paper:copy(inner.sourceBinding.paper),reference:'(9.21), Theorem3.1(i), (10.1), (10.4)',
    externalExistenceAndSmoothness:{reference:'Proposition9.9 / Theorem3.1(i)',pages:[114,115,116,117,118],
      actualFinalN6FieldConstructedHere:false,callerProvidedFieldValuesAccepted:false},
    actualBackgroundSource:{commonFamilyGraph:copy(inner.sourceBinding.common6FamilyGraph),
      leadingF:prepared.records[0].global.F,leadingU:prepared.records[0].global.U,leadingM:prepared.bootstrap.finalM,
      leadingPressure:family.leading.Pi,commonSequence:copy(family.selector.recursiveDefinition),
      prefix:family.selector.rows.map((row,index)=>({order:row.order,b:row.scale,coefficientF:prepared.records[index+1].global.F,
        coefficientU:prepared.records[index+1].global.U,coefficientM:prepared.records[index+1].global.M})),
      unboundedCoefficientAndCommonSelectorRecipesRetained:true,finitePrefixCalledFullField:false},
    fields:[{id:'A',cartesianComponents:3,role:'vector potential',
      definition:'A_base plus the initialization and every supported stage potential with its original summation cutoff; A_base=(S/r)e_theta, S=sum_n chi(b_n*q) q^(1-A+2nh) M_n, including n=0 without a cutoff.',
      sourceLocation:'(9.21), (10.1)',axisRepresentation:'(S/r)e_theta=a(r^2,z,t)*(-x2,x1,0); annular potentials vanish near the axis.'},
      {id:'B_e_theta',cartesianComponents:3,role:'direct azimuthal field',
        definition:'The original background swirl plus all direct supported azimuthal means, with the same final summation cutoffs.',
        sourceLocation:'(9.21), (3.3)',axisymmetric:true,cartesianSmoothness:'Theorem3.1(i); no singular unit-vector value is introduced at r=0.'},
      {id:'p_loc',cartesianComponents:1,role:'pressure',definition:'The original background pressure plus every final pressure correction with the same summation cutoffs.',sourceLocation:'(9.21)'}]};
}

function localizationOperator(G,c,gradient,fieldInputs){
  const permutations=[[1,2],[2,0],[0,1]],rows=permutations.map(([j,k],i)=>({component:i,
    terms:[{field:'A',component:k,derivative:j,coefficient:c},{field:'A',component:j,derivative:k,coefficient:G.neg(c)},
      {field:'A',component:k,derivative:null,coefficient:gradient[j]},{field:'A',component:j,derivative:null,coefficient:G.neg(gradient[k])},
      {field:'B_e_theta',component:i,derivative:null,coefficient:c}]}));
  return {schema:'MathScope.N7.OriginalLocalizedFieldOperator/1',sharedFieldInstance:fieldInputs.sharedInstance,
    equation:'u=curl(c*A)+c*B_e_theta; p=c*p_loc',equivalentVelocity:'c*u_loc+grad(c) cross A',
    localApplicationDomain:'0<q<qStar, where the listed original source fields are defined.',
    globalDefinition:'Apply (10.4) on the original local domain and extend it identically by zero outside. The entire cutoff support lies in q<qStar/2, so the two definitions agree on an open overlap.',
    undefinedLocalFieldsMultipliedByZero:false,
    sourceFields:fieldInputs.fields.map(row=>row.id),velocity:rows,pressure:[{field:'p_loc',derivative:null,coefficient:c}],
    multiplicationBeforeCurl:true,allSpatialCutoffProductTermsRetained:true,
    sourceFieldValuesMaterialized:false,externalSourceIdentificationRequired:true,
    divergenceIdentity:'div curl(c*A)=0 and div(c*B_e_theta)=r^-1 partial_theta(c*B)=0, using the same original axisymmetric B and theta-independent cutoff.',
    zeroBranchProof:'Inside the original local domain, c=0 and all spatial cutoff derivatives vanish, so every operator coefficient is zero. Outside that domain the global definition is identically zero; no undefined local field is evaluated or multiplied by zero.',
    plateauProof:'c=1 and grad(c)=0 give the original curl(A)+B_e_theta and the same p_loc, with no omitted commutator.'};
}

export async function prepareActualSourceLocalization(input={},context={}){
  const request=requestOf(input),inner=context.inner??await prepareActualInnerGrowth({},context);assertActualInnerGrowth(inner);
  const innerCertificate=await actualInnerGrowthCertificate(inner),{G,family}=inner,q=(n,d=1)=>G.q(n,d),
    originalCount=G.nodes.length,originalPrefix=canonicalStringify(G.nodes),definitions=G.captureFunctionDefinitions(),
    {qStar,tau0,z0,r0}=inner.localization,{ellMinimum,ell0}=family.constants,
    h=G.parameter('h'),A=G.add(q(1,2),h),D=G.sub(q(1,2),h),exponent=sourceExponentContract(),
    expectedMinimum=G.ceiling(G.maximum(q(8),family.uniformCovariance.threshold.Sminimum,G.pow(G.div(q(64),h),2))),
    expectedQStar=G.exp(G.neg(G.mul(G.add(ell0,q(4)),G.log(q(2))))),
    x1=G.fresh('n7_local_x1'),x2=G.fresh('n7_local_x2'),z=G.fresh('n7_local_x3'),tau=G.fresh('n7_local_tau'),
    radialSquared=G.add(G.pow(x1,2),G.pow(x2,2)),radialArgument=G.div(G.mul(q(2),radialSquared),G.pow(r0,2)),
    axialArgument=G.div(G.mul(q(2),G.pow(z,2)),G.pow(z0,2)),timeArgument=G.div(tau,tau0),
    {coordinate:s,body}=inner.localization.cutoff,chi=argument=>G.substitute(body,s,argument),
    radial=chi(radialArgument),axial=chi(axialArgument),temporal=chi(timeArgument),spatial=G.mul(radial,axial),c=G.mul(spatial,temporal),
    spatialCoordinates=[x1,x2,z],gradient=spatialCoordinates.map(x=>G.derivative(c,x)),
    hessian=spatialCoordinates.map(x=>spatialCoordinates.map(y=>G.derivative(G.derivative(c,x),y))),
    dt=G.neg(G.derivative(c,tau)),laplacian=G.add(...hessian.map((row,i)=>row[i])),
    primitiveFirst=G.derivative(body,s),primitiveSecond=G.derivative(primitiveFirst,s),
    center=G.substitute(body,s,q(3,4)),centerFirst=G.substitute(primitiveFirst,s,q(3,4)),
    centerCheck=sourceGraphRationalIdentity(G,G.sub(center,q(1,2))),
    centerFirstCheck=sourceGraphRationalIdentity(G,G.add(centerFirst,q(4)));
  const checks=[{id:'same-private-inner-growth-and-common-source',pass:assertActualInnerGrowth(inner)&&same(innerCertificate.sourceBinding,inner.sourceBinding)},
    {id:'source-positive-h-and-exact-frequency-threshold',pass:exponent.positive&&exponent.upperBoundExact==='2^-4096'&&same(exponent.hExact,G.source.parametersExactExpressions.h)&&ellMinimum===expectedMinimum},
    {id:'same-smaller-global-qStar-for-entire-support',pass:ell0===G.add(ellMinimum,q(6))&&qStar===expectedQStar&&tau0===G.div(qStar,q(32))&&z0===G.exp(G.mul(D,G.log(tau0)))&&r0===G.one},
    {id:'actual-flat-time-cutoff-center-and-slope',pass:centerCheck.pass&&centerFirstCheck.pass},
    {id:'cutoff-is-smooth-in-Cartesian-squared-radius-and-z',pass:G.freeCoordinates(c).size===4&&G.freeCoordinates(radial).has(x1)&&G.freeCoordinates(radial).has(x2)&&!G.freeCoordinates(radial).has(z)&&!G.freeCoordinates(spatial).has(tau)},
    {id:'physical-time-derivative-keeps-negative-tau-chain-sign',pass:dt===G.neg(G.derivative(c,tau))}];
  if(checks.some(row=>!row.pass))fail('INVALID_SOURCE_CONSTRUCTION','Original cutoff source binding failed: '+checks.filter(row=>!row.pass).map(row=>row.id).join(', '));
  const fieldInputs=fixedSourceInputs(inner),operator=localizationOperator(G,c,gradient,fieldInputs),
    roots={qStar,tau0,z0,r0,h,A,D,ellMinimum,ell0,x1,x2,z,tau,radialSquared,radialArgument,axialArgument,timeArgument,
      chiRadial:radial,chiAxial:axial,chiTime:temporal,chiSpatial:spatial,cutoff:c,dt,laplacian,
      primitiveArgument:s,primitive:body,primitiveFirst,primitiveSecond,
      ...Object.fromEntries(gradient.map((id,i)=>['gradient_'+i,id])),
      ...Object.fromEntries(hessian.flatMap((row,i)=>row.map((id,j)=>['hessian_'+i+'_'+j,id]))),
      ...Object.fromEntries(operator.velocity.flatMap((row,i)=>row.terms.map((term,j)=>['operatorVelocity_'+i+'_'+j,term.coefficient]))),
      operatorPressure:c},decimalSamples=[];
  for(const value of request.decimalTaus){
    const parsed=exactLocalizationTau(value),K=-parsed.powerOfTen,
      integerDominance=(1n<<8204n)>4n*BigInt(K),logTau=G.add(G.log(q(BigInt(parsed.coefficient))),G.mul(q(parsed.powerOfTen),G.log(q(10)))),
      tauValue=G.exp(logTau),timeValue=G.sub(G.one,tauValue),radius=G.sqrt(G.mul(q(2),inner.point.Xin,tauValue)),
      physicalVelocityScale=G.exp(G.neg(G.mul(A,logTau)));
    if(!integerDominance)fail('RESOURCE_LIMIT','This decimal time needs a stronger explicit source threshold comparison.');
    const index=decimalSamples.length;Object.assign(roots,{['sampleLogTau_'+index]:logTau,['sampleTau_'+index]:tauValue,
      ['sampleTime_'+index]:timeValue,['sampleRadius_'+index]:radius,['sampleVelocityScale_'+index]:physicalVelocityScale});
    decimalSamples.push({...parsed,sourceTau:tauValue,sourceLogTau:logTau,sourceTime:timeValue,
      comparison:{K,sourceFrequencyLower:'ellMinimum>(64*2^4096)^2=2^8204',
        qStar:'2^(-(ellMinimum+10))',tau0:'2^(-(ellMinimum+15))',exactIntegerCheck:{left:'2^8204',right:String(4*K),pass:integerDominance},
        proof:'ellMinimum+10>4K and10^K<2^(4K) imply0<tau0<qStar<2^(-4K)<10^(-K)<=tau.',
        tauStrictlyAboveCutoffSupport:true,sourceLocalDomainContainsThisPoint:false},
      cutoffState:'EXACT_TEMPORAL_ZERO_EXTENSION',normalizedCoordinates:{X:inner.point.Xin,Y:inner.point.Y,eta:0,q:tauValue},
      physicalPosition:[radius,G.zero,G.zero],normalizedVelocity:{components:['0','0','0'],normalization:'q^A*u'},
      physicalVelocity:{components:['0','0','0'],positiveScale:physicalVelocityScale,scalingIdentity:'q^(-A)*0=0 exactly'},
      pressure:'0',valueMeaning:'The original localized zero extension is exactly zero on this initial interval. The unlocalized source field outside q<qStar is not evaluated.',
      missingSourceValuesSetToZero:false,sourceLocalVelocityEvaluated:false,localizedZeroBranchEvaluated:true,
      finiteDecimalUsedToRepresentActiveBlowupRegion:false});
  }
  const constants={qStar,tau0,z0,r0,h,A,D,ellMinimum,ell0},cutoff={coordinateSystem:'CARTESIAN_WITH_TAU=1-t',coordinates:{x1,x2,z,tau},
    primitive:copy(inner.localization.cutoff),arguments:{radial:radialArgument,axial:axialArgument,time:timeArgument},
    factors:{radial,axial,spatial,temporal},body:c,gradient,hessian,physicalTimeDerivative:dt,laplacian,
    formula:'c=chi(2*(x1^2+x2^2)/r0^2)*chi(2*x3^2/z0^2)*chi((1-t)/tau0)',
    originalLocalPotentialMultiplier:c,originalDirectAzimuthalMultiplier:c,originalPressureMultiplier:c},
    regularity={definition:'chi(s)=1-sigma1(2s-1), with exp(-1/u) for u>0 and the exact flat extensions.',
      derivativeRecurrence:flatExponentialJetPolynomial(8),
      denominator:'exp(-1/u)+exp(-1/(1-u))>0 on0<u<1; near either seam the complementary term has a strictly positive smooth limit.',
      conclusion:'The original primitive has matching derivatives of every order at1/2 and1. Composition with r^2,z^2,tau yields a C-infinity Cartesian cutoff, including r=0.',
      allOrderSmoothnessFromDefinition:true,numericalJetsUsedAsAllOrderProof:false,newLeanKernelProof:false},
    domain={sourceCoordinates:'tau=q*(1-eta^2), z=q^D*eta, X=r^2/(2q), q>0, |eta|<1',
      reference:'(3.2), (10.3)-(10.4)',paperPages:[7,117,118],sourceDInterval:'1/4<D<1/2',
      twoCaseProof:['If1-eta^2>=1/2 then q<=2*tau.',
        'Otherwise |eta|>1/sqrt(2), so q<(sqrt(2)*|z|)^(1/D)<=4*|z|^(1/D), since1/(2D)<2.'],
      uniformBound:'q<=4*(tau+|z|^(1/D))',
      supportMargin:'4*(tau0+z0^(1/D))=qStar/4<qStar/2',
      compactK:{definition:'{x1^2+x2^2<=r0^2/2, x3^2<=z0^2/2}',independentOfTime:true,
        strictlyInside:'{r<r0, |z|<z0}',containsVelocityAndPressureSupportByExactOperator:true},
      unitPlateau:{region:'{r<=r0/2, |z|<=z0/2,0<tau<=tau0/2}',cutoff:'1',allPositiveDerivatives:'0',spatialNeighborhoodFixed:true},
      initialZeroInterval:{time:'0<=t<=1-tau0',tau:'tau>=tau0',positiveLength:true,velocity:['0','0','0'],pressure:'0',reason:'The temporal cutoff and all its derivatives vanish.'},
      positiveTau0LessThanHalf:true,sourceThresholdReplacedByFiniteDecimal:false},
    innerPath={sourceInnerCertificateGraph:copy(innerCertificate.graph),plateau:inner.localization.plateau,
      rows:copy(inner.rows),sourceTheoremBridge:copy(inner.claims.originalLocalizedPath),
      allSelectedPathsInUnitPlateau:true,sourceVelocityRoundedToZero:false},
    scope={actualOriginalSourceCutoffConstructed:true,actualCartesianCutoffDerivativesConstructed:true,
      sameSourceDomainAndOriginalFieldOperatorBound:true,exactGlobalTemporalZeroBranchComputed:true,
      fullN6FinalPotentialsConstructed:false,nonzeroTransitionFieldValuesComputed:false,
      fullLocalizedForceConstructed:false,wholeN8ReconstructionComputed:false,
      externalSourceFinalFieldIdentificationRequired:true,newLeanKernelProof:false,wholeM3Complete:false,originalCriterionComplete:false};
  checks.push({id:'same-cutoff-applied-inside-curl-and-to-pressure',pass:operator.multiplicationBeforeCurl&&cutoff.originalLocalPotentialMultiplier===c&&cutoff.originalPressureMultiplier===c&&operator.velocity.every(row=>row.terms.length===5)},
    {id:'every-decimal-example-proved-in-exact-initial-zero-interval',pass:decimalSamples.every(row=>row.comparison.exactIntegerCheck.pass&&row.underflowReplacedByZero===false)},
    {id:'original-source-nodes-and-definitions-preserved',pass:canonicalStringify(G.nodes.slice(0,originalCount))===originalPrefix&&G.functionDefinitionsUnchanged(definitions)&&assertActualInnerGrowth(inner)});
  const result={G,inner,schema:'MathScope.N7.ActualSourceLocalization/1',request,sourceBinding:copy(inner.sourceBinding),constants,cutoff,regularity,domain,fieldInputs,operator,decimalSamples,innerPath,checks,scope,
    formulaProgram:extendScalarProgram(inner,G,roots)};
  if(checks.some(row=>!row.pass))fail('INVALID_SOURCE_CONSTRUCTION','The source cutoff or exact zero-branch gate failed.');
  seals.set(result,{G,inner,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),metadata:canonicalStringify(metadata(result))});
  context.onProgress?.({stage:'n7-actual-source-localization-sealed',nodes:G.nodes.length,scalarNodes:result.formulaProgram.nodes.length});return result;
}

export function assertActualSourceLocalization(result){
  const seal=seals.get(result);
  if(!seal||result.G!==seal.G||result.inner!==seal.inner||canonicalStringify(metadata(result))!==seal.metadata||canonicalStringify(seal.G.nodes.slice(0,seal.count))!==seal.prefix||!seal.G.functionDefinitionsUnchanged(seal.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private original source localization. Imported or edited records are not source fields.');
  assertActualInnerGrowth(seal.inner);return true;
}

export async function actualSourceLocalizationCertificate(result){
  assertActualSourceLocalization(result);return {...copy(metadata(result)),graph:{sourceFamily:copy(result.sourceBinding.common6FamilyGraph),
    constructedNodeCount:seals.get(result).count,scalarNodeCount:result.formulaProgram.nodes.length,
    scalarProgramSHA256:await sha256(canonicalStringify(result.formulaProgram))},
    verification:{status:'ACTUAL_SOURCE_CUTOFF_AND_ORIGINAL_FIELD_OPERATOR_EXECUTED',checksPass:result.checks.every(row=>row.pass),
      originalFinalN6FieldsNumericallyEvaluated:false,importedSourceAuthorityAdopted:false,newLeanExecuted:false}};
}
