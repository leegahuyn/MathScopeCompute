/** Finite jets of the COMPLETE real curl at a proved zero phase.
 * This is conditional algebra and directed arithmetic. The source adapter
 * must bind the actual potential, positive scales and every finite bound.
 * In particular a vanishing sine VALUE never deletes its derivatives.
 */
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {adiabaticReplaceExactOperands} from './actual-adiabatic-pulse-center-kernel.mjs';
import {physicalCenterFrequencyAudit} from './actual-physical-center-kernel.mjs';
import {directedArithmetic,rational as Q,readRational,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';

const root=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x];

/** Product rule for any two derivations, including variable-coefficient
 * physical coordinate fields. The order in D_i D_j is retained explicitly.
 * K here is curl(C), including the original 1/k in the potential C.
 */
export function phaseZeroCompleteCurlJet(G,{leading,coefficientCurl,phase,frequency,operators}={}){
  if(![leading,coefficientCurl,phase,frequency].every(x=>root(G,x))||!Array.isArray(operators)||operators.length<1||operators.length>4||
    operators.some(x=>!x||typeof x.name!=='string'||typeof x.apply!=='function'))
    fail('INVALID_INPUT','Use the complete leading and coefficient-curl bodies, original phase/frequency and one through four actual derivations.');
  const cos=G.cosine(G.mul(frequency,phase)),sin=G.sine(G.mul(frequency,phase)),original=G.sub(G.mul(leading,cos),G.mul(coefficientCurl,sin)),
    zeroPhase=body=>adiabaticReplaceExactOperands(G,body,[[cos,G.one],[sin,G.zero]]),
    phaseFirst=operators.map(D=>D.apply(phase)),leadingFirst=operators.map(D=>D.apply(leading)),curlFirst=operators.map(D=>D.apply(coefficientCurl)),
    first=operators.map((D,i)=>{
      const actual=D.apply(original),atZeroPhase=zeroPhase(actual),expected=G.sub(leadingFirst[i],G.mul(frequency,coefficientCurl,phaseFirst[i])),
        check=sourceGraphRationalIdentity(G,G.sub(atZeroPhase,expected),{maxTerms:20000});
      return {direction:D.name,originalDerivative:actual,zeroPhaseDerivative:atZeroPhase,expected,phaseDerivative:phaseFirst[i],leadingDerivative:leadingFirst[i],
        coefficientCurlDerivative:curlFirst[i],check,pass:check.pass};
    }),second=[];
  for(let i=0;i<operators.length;i++)for(let j=i;j<operators.length;j++){
    const Di=operators[i],Dj=operators[j],originalDerivative=Di.apply(first[j].originalDerivative),atZeroPhase=zeroPhase(originalDerivative),
      phaseSecond=Di.apply(phaseFirst[j]),leadingSecond=Di.apply(leadingFirst[j]),
      principal=G.neg(G.mul(G.pow(frequency,2),leading,phaseFirst[i],phaseFirst[j])),
      correction=G.neg(G.mul(frequency,G.add(G.mul(curlFirst[i],phaseFirst[j]),G.mul(curlFirst[j],phaseFirst[i]),G.mul(coefficientCurl,phaseSecond)))),
      expected=G.add(leadingSecond,principal,correction),check=sourceGraphRationalIdentity(G,G.sub(atZeroPhase,expected),{maxTerms:35000});
    second.push({directions:[Di.name,Dj.name],originalDerivative,zeroPhaseDerivative:atZeroPhase,expected,phaseSecond,leadingSecond,principal,correction,
      coefficientCurlFirst:[curlFirst[i],curlFirst[j]],check,pass:check.pass});
  }
  if(first.some(r=>!r.pass)||second.some(r=>!r.pass))fail('INTERNAL_VALIDATION','A complete zero-phase curl derivative lost a phase or coefficient-curl term.');
  return {schema:'MathScope.PhaseZeroCompleteCurlJet/1',leading,coefficientCurl,phase,frequency,original,cos,sin,first,second,
    proof:'Differentiate L*cos(k*Phi)-curl(C)*sin(k*Phi) before using the proved phase value. First derivatives retain -k*curl(C)*D(Phi). Second derivatives retain both first curl(C) derivatives and D_i D_j(Phi). Only the second derivative of curl(C), multiplied by sin(k*Phi)=0, vanishes at this point.',
    coefficientOrderNeededForNumericalValues:2,phaseOrderNeededForNumericalValues:3,totalPotentialOrderForSecondCurlJet:3,
    thirdCoefficientDerivativeTermHasZeroSineFactorAtThisPoint:true,
    coefficientCurlOrItsFirstDerivativesDiscarded:false,sourceAuthenticated:false,pass:true};
}

/** Covariant angular derivatives of a vector written in its cylindrical
 * components. With J(V)=(-V_theta,V_r,0), N_theta V=angular(V)+J(V)/R.
 * The Hessian in two angular DIRECTIONS additionally contains Dr(V)/R:
 * the direction e_theta itself satisfies nabla_theta e_theta=-e_r/R.
 * The angular operator supplied here acts on scalars as (1/R)*partial_theta.
 * All derivatives are formed on the complete vector before phase evaluation.
 */
export function phaseZeroCylindricalAngularCurlJet(G,{leading,coefficientCurl,phase,frequency,radius,operators,angular}={}){
  const validVector=xs=>Array.isArray(xs)&&xs.length===3&&xs.every(x=>root(G,x));
  if(!validVector(leading)||!validVector(coefficientCurl)||![phase,frequency,radius].every(x=>root(G,x))||
    typeof angular!=='function'||!Array.isArray(operators)||operators.length!==3||
    operators.some((x,i)=>!x||x.name!==['r','z','t'][i]||typeof x.apply!=='function'))
    fail('INVALID_INPUT','Use three complete cylindrical vector components, the original phase/frequency/radius, r/z/t derivations and the scalar angular derivation.');
  const Dr=operators[0].apply,J=V=>[G.neg(V[1]),V[0],G.zero],
    N=V=>{const rotated=J(V);return V.map((x,j)=>G.add(angular(x),G.div(rotated[j],radius)));},
    cos=G.cosine(G.mul(frequency,phase)),sin=G.sine(G.mul(frequency,phase)),
    original=leading.map((x,j)=>G.sub(G.mul(x,cos),G.mul(coefficientCurl[j],sin))),
    zeroPhase=body=>adiabaticReplaceExactOperands(G,body,[[cos,G.one],[sin,G.zero]]),
    phaseAngularFirst=angular(phase),phaseFirst=operators.map(D=>D.apply(phase)),
    leadingAngular=N(leading),curlAngular=N(coefficientCurl),originalAngular=N(original),
    first=originalAngular.map((originalDerivative,component)=>{
      const zeroPhaseDerivative=zeroPhase(originalDerivative),expected=G.sub(leadingAngular[component],G.mul(frequency,coefficientCurl[component],phaseAngularFirst)),
        check=sourceGraphRationalIdentity(G,G.sub(zeroPhaseDerivative,expected),{maxTerms:35000});
      return {component,direction:'theta',order:1,originalDerivative,zeroPhaseDerivative,expected,phaseDerivative:phaseAngularFirst,
        leadingDerivative:leadingAngular[component],coefficientCurlDerivative:curlAngular[component],check,pass:check.pass,
        includesCylindricalFrameConnection:true};
    }),second=[],phaseMixed=[];
  for(let i=0;i<operators.length;i++){
    const D=operators[i],phaseSecond=D.apply(phaseAngularFirst);phaseMixed.push({directions:[D.name,'theta'],original:phaseSecond});
    for(let component=0;component<3;component++){
      const originalDerivative=D.apply(originalAngular[component]),zeroPhaseDerivative=zeroPhase(originalDerivative),leadingSecond=D.apply(leadingAngular[component]),
        coefficientCurlFirst=[D.apply(coefficientCurl[component]),curlAngular[component]],
        principal=G.neg(G.mul(G.pow(frequency,2),leading[component],phaseFirst[i],phaseAngularFirst)),
        correction=G.neg(G.mul(frequency,G.add(G.mul(coefficientCurlFirst[0],phaseAngularFirst),G.mul(coefficientCurlFirst[1],phaseFirst[i]),
          G.mul(coefficientCurl[component],phaseSecond)))),expected=G.add(leadingSecond,principal,correction),
        check=sourceGraphRationalIdentity(G,G.sub(zeroPhaseDerivative,expected),{maxTerms:50000});
      second.push({component,directions:[D.name,'theta'],order:2,originalDerivative,zeroPhaseDerivative,expected,leadingSecond,phaseSecond,
        principal,correction,coefficientCurlFirst,check,pass:check.pass,includesCylindricalFrameConnection:true});
    }
  }
  const originalAngularTwice=N(originalAngular),leadingAngularTwice=N(leadingAngular),
    phaseAngularSecond=G.add(angular(phaseAngularFirst),G.div(Dr(phase),radius));
  for(let component=0;component<3;component++){
    const directionConnection=G.div(Dr(original[component]),radius),
      originalDerivative=G.add(originalAngularTwice[component],directionConnection),zeroPhaseDerivative=zeroPhase(originalDerivative),
      leadingSecond=G.add(leadingAngularTwice[component],G.div(Dr(leading[component]),radius)),
      principal=G.neg(G.mul(G.pow(frequency,2),leading[component],G.pow(phaseAngularFirst,2))),
      correction=G.neg(G.mul(frequency,G.add(G.mul(G.q(2),curlAngular[component],phaseAngularFirst),G.mul(coefficientCurl[component],phaseAngularSecond)))),
      expected=G.add(leadingSecond,principal,correction),check=sourceGraphRationalIdentity(G,G.sub(zeroPhaseDerivative,expected),{maxTerms:65000});
    second.push({component,directions:['theta','theta'],order:2,originalDerivative,zeroPhaseDerivative,expected,leadingSecond,phaseSecond:phaseAngularSecond,
      principal,correction,coefficientCurlFirst:[curlAngular[component],curlAngular[component]],directionConnection,
      zeroPhaseDirectionConnection:zeroPhase(directionConnection),check,pass:check.pass,includesCylindricalFrameConnection:true,
      includesAngularDirectionConnection:true});
  }
  if(first.some(x=>!x.pass)||second.some(x=>!x.pass))fail('INTERNAL_VALIDATION','A complete cylindrical angular curl derivative lost a phase, vector-basis or direction-basis term.');
  return {schema:'MathScope.PhaseZeroCylindricalAngularCurlJet/1',leading,coefficientCurl,phase,frequency,radius,original,cos,sin,first,second,
    phaseFirst,phaseAngularFirst,phaseMixed,phaseAngularSecond,
    proof:'Use N_theta V=(partial_theta V+J(V))/R on the complete vector. The mixed rows are D_i(N_theta V). The theta-theta Hessian is N_theta(N_theta V)+D_r(V)/R. Differentiate before imposing cos(k Phi)=1 and sin(k Phi)=0; keep both repeated product terms and the scalar covariant phase Hessian.',
    coefficientOrderNeededForNumericalValues:2,phaseOrderNeededForNumericalValues:3,totalPotentialOrderForSecondCurlJet:3,
    thirdCoefficientDerivativeTermHasZeroSineFactorAtThisPoint:true,sourceAuthenticated:false,pass:true};
}

export function phaseZeroCompleteCurlJetAlgebraAudit(G){
  const coordinates=['r','z','t'].map(n=>G.fresh('complete_curl_jet_'+n)),[r,z,t]=coordinates,
    coefficients=Array.from({length:9},(_,j)=>G.fresh('complete_curl_jet_constant_'+j)),
    bodies=[G.add(coefficients[0],G.mul(coefficients[1],r),G.mul(coefficients[2],z,t),G.pow(r,2)),
      G.add(coefficients[3],G.mul(coefficients[4],z),G.mul(coefficients[5],r,t),G.pow(t,2)),
      G.add(G.mul(coefficients[6],r),G.mul(coefficients[7],z),G.mul(coefficients[8],t),G.mul(r,z),G.mul(z,t),G.pow(r,2))],
    shared=bodies.map((body,j)=>{const parameters=[...coordinates,...coefficients],system=G.defineExpressionFunction({name:'CompleteCurlJetAudit_'+j,parameters,body,derivativeLimits:parameters.map(x=>coordinates.includes(x)?3:0)});
      return {system,body,value:G.expressionValue(system,parameters)};}),
    k=G.fresh('complete_curl_jet_frequency'),operators=coordinates.map((coordinate,i)=>({name:['r','z','t'][i],apply:x=>G.derivative(x,coordinate)})),
    audit=phaseZeroCompleteCurlJet(G,{leading:shared[0].value,coefficientCurl:shared[1].value,phase:shared[2].value,frequency:k,operators}),
    negativeFirst=sourceGraphRationalIdentity(G,G.sub(audit.first[0].expected,audit.first[0].leadingDerivative),{maxTerms:5000}),
    repeated=audit.second[0],omittedOneMixed=G.sub(repeated.expected,G.neg(G.mul(k,repeated.coefficientCurlFirst[0],audit.first[0].phaseDerivative))),
    negativeRepeated=sourceGraphRationalIdentity(G,G.sub(repeated.expected,omittedOneMixed),{maxTerms:5000}),
    nonconstantCoefficient=G.materializeExpressionFunction(shared[1].system,[...coordinates,...coefficients],[0,1,0,...coefficients.map(()=>0)]),
    nonzeroPhaseHessian=G.materializeExpressionFunction(shared[2].system,[...coordinates,...coefficients],[1,1,0,...coefficients.map(()=>0)]),
    checks=[{id:'all-first-complete-curl-product-identities',pass:audit.first.every(r=>r.pass)},
      {id:'all-repeated-and-mixed-second-complete-curl-identities',pass:audit.second.every(r=>r.pass)},
      {id:'dropping-the-zero-value-sine-remainder-derivative-is-rejected',pass:!negativeFirst.pass},
      {id:'dropping-one-of-two-repeated-product-terms-is-rejected',pass:!negativeRepeated.pass},
      {id:'audit-has-a-nonconstant-coefficient-and-mixed-phase',pass:nonconstantCoefficient!==G.zero&&nonzeroPhaseHessian===G.one}];
  if(checks.some(r=>!r.pass))fail('INTERNAL_VALIDATION','The independent complete-curl finite-jet algebra audit failed.');
  return {schema:'MathScope.PhaseZeroCompleteCurlJetAlgebraAudit/1',audit,shared,coordinates,checks,negativeControls:{missingSineDerivative:negativeFirst,missingRepeatedTerm:negativeRepeated},
    sourceAuthenticated:false,pass:true};
}

/** Independent variable-coefficient cylindrical calculus. Xi may occur in
 * every potential component; Dr includes its original fast chain term.
 * This checks the geometric 1/R term before imposing any phase value.
 */
export function completeCylindricalCurlDifferentialAudit(G){
  const [R,Z,T,theta,xi,v]=['R','Z','T','theta','xi','v'].map(n=>G.fresh('complete_cylindrical_'+n)),
    parameters=[R,Z,T,theta,xi,v],eps=G.fresh('complete_cylindrical_frozen_epsilon'),radialFast=G.mul(G.q(2),R),
    bodies=[G.mul(R,Z,theta),G.add(G.mul(xi,v),G.mul(R,theta,T)),G.add(G.mul(R,xi),G.mul(Z,theta,v))],
    components=bodies.map((body,j)=>{const system=G.defineExpressionFunction({name:'CompleteCylindricalPotential_'+j,parameters,body,derivativeLimits:parameters.map(()=>3)});return G.expressionValue(system,parameters);}),
    Dr=x=>G.add(G.derivative(x,R),G.mul(radialFast,G.derivative(x,xi))),Dz=x=>G.mul(eps,G.derivative(x,Z)),Da=x=>G.div(G.derivative(x,theta),R),
    curl=[G.sub(Da(components[2]),Dz(components[1])),G.sub(Dz(components[0]),Dr(components[2])),
      G.sub(G.add(Dr(components[1]),G.div(components[1],R)),Da(components[0]))],
    divergence=G.add(Dr(curl[0]),G.div(curl[0],R),Da(curl[1]),Dz(curl[2])),check=sourceGraphRationalIdentity(G,divergence,{maxTerms:20000}),
    missingConnection=G.sub(divergence,Dz(G.div(components[1],R))),negative=sourceGraphRationalIdentity(G,missingConnection,{maxTerms:20000}),
    checks=[{id:'full-variable-coefficient-cylindrical-curl-is-divergence-free',pass:check.pass},
      {id:'omitted-cylindrical-connection-is-detected',pass:!negative.pass}];
  if(checks.some(x=>!x.pass))fail('INTERNAL_VALIDATION','The full cylindrical differential identity failed.');
  return {schema:'MathScope.CompleteCylindricalCurlDifferentialAudit/1',parameters,eps,radialFast,components,curl,divergence,check,negative,checks,
    geometricConnectionRetained:true,fastTransverseChainRetained:true,sourceAuthenticated:false,pass:true};
}

/** A deliberately explicit conditional polynomial reserve. None of the
 * premise exponents is inferred from a numerical sample or crude exp(B*S).
 * The source adapter must prove the normalized local jet premises on its
 * own terminal neighborhood before this implication may be used.
 */
export function physicalCenterCompleteCurlErrorPowerAudit(){
  const rows=[],put=(id,B,S,reason)=>{const x={id,B,S,reason};rows.push(x);return x;},
    product=(id,...x)=>put(id,x.reduce((a,b)=>a+b.B,0)+1,x.reduce((a,b)=>a+b.S,0),'Finite Leibniz/product sum through order two'),
    scalar=put('source_scalar_and_reciprocal',16,0,'Frozen radius, Bs, u, Ac ratios, normalized phase coefficients and their reciprocals'),
    weighted=put('weighted_pulse_jets_through_two',512,4,'Required source-bound centered Gaussian/Riccati and inverse-weight finite jet estimate'),
    partition=put('original_slow_partition_relative_jets_through_two',8,6,'Original finite bump quotient, positive at offsets |x|<9/16; mesh derivative ell^6=S^3 per order'),
    normal=put('normal_and_inverse_square_jets_through_two',64,0,'Original n_z=-Bs at the midplane, actual frozen rounded carrier, original field jets'),
    leading=product('normalized_complete_leading_jets',scalar,weighted,partition,normal),
    potential=product('k_times_normalized_potential_jets',scalar,weighted,partition,normal),
    coefficientCurl=product('normalized_k_times_coefficient_curl_and_first_jets',potential,scalar),
    phase=put('phase_first_and_second_normalized_jets',64,2,'The actual positive angular phase scale is pTilde/R. The covariant theta-theta phase Hessian includes Dr(Phi)/R, whose normalization by (pTilde/R)^2 retains two pulse-length powers'),
    first=product('first_derivative_nonoscillatory_error_before_1_over_k',leading,coefficientCurl,phase),
    second=product('second_derivative_nonprincipal_error_before_1_over_k',leading,coefficientCurl,phase,phase),
    maximumB=Math.max(...rows.map(x=>x.B)),maximumS=Math.max(...rows.map(x=>x.S)),absorbedS=maximumS+Math.ceil(maximumB/1024)+4,
    frequency=physicalCenterFrequencyAudit({power:16384,bits:16384}),
    checks=[{id:'finite-local-jet-reserve-fits-strong-band-power',pass:absorbedS<16384},
      {id:'exact-positive-frequency-reserve',pass:frequency.pass},
      {id:'error-budget-leaves-directed-arithmetic-room',pass:16384-8>512}];
  return {schema:'MathScope.PhysicalCenterCompleteCurlErrorPowerAudit/1',rows,maximumB,maximumS,absorbedS,frequency,checks,pass:checks.every(x=>x.pass),
    premise:'The source adapter must establish every first four rows and the source phase row for the actual representative with all original weights. B>=2^128, S>=B^1024, k>=epsilon^-1/2, and both original fast cutoffs have a constant plateau at the actual point.',
    implication:'Finite sums of these bounds are <S^16384. Since1/k<=sqrt(epsilon)<epsilon^(1/200000), their positive normalized contribution is <2^-16384. Original phase-scale roundoff errors require their separate same-source frequency binding. The final coefficient reserve2^-512 includes these errors without setting them to zero.',
    unprovedPremisesCannotAuthenticateSource:true,sourceAuthenticated:false};
}

/** Natural high-frequency normalization: first derivative /(V*k*Omega_i)
 * and second derivative /(V*k^2*Omega_i*Omega_j), with exact physical
 * coordinate scale factors supplied and authenticated only by the adapter.
 * The numerical first intervals retain all lower-order terms as a positive
 * error; second intervals retain the nonzero original principal phase term.
 */
export function enclosePhysicalCompleteCurlJetCoefficients(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance','velocityCoefficients'].includes(k)))
    fail('INVALID_INPUT','Supply only directed arithmetic controls and three generic velocity coefficient intervals.');
  const {precisionBits=192,tolerance='1/1000000000000',velocityCoefficients}=input,
    A=directedArithmetic(precisionBits),tol=readRational(tolerance),reserve=Q(1,1n<<512n);
  if(qcompare(tol,Q(0))<=0||qcompare(tol,Q(1,100))>0||!Array.isArray(velocityCoefficients)||velocityCoefficients.length!==3)
    fail('INVALID_INPUT','Use three finite coefficient intervals and a positive requested width at most1/100.');
  const centers=velocityCoefficients.map(x=>A.unpack(x));
  if(centers.some(x=>x[0]<-A.S*2n||x[1]>A.S*2n))fail('INVALID_INPUT','This finite source implication requires absolute velocity coefficients at most2.');
  const directions=['r','z','t','theta'],phaseSigns=[1,-1,-1,1],first=[],second=[],angular=[],pack=(box,details)=>{
    const width=Q(box[1]-box[0],A.S);
    if(qcompare(width,tol)>0)fail('PRECISION_REQUIRED','The complete physical curl coefficient interval is wider than requested.');
    return {...details,coefficient:A.pack(box),width:qtext(width),tolerance,toleranceMet:true};
  };
  for(let component=0;component<3;component++){
    for(const direction of directions.slice(0,3))first.push(pack(A.widen(A.zero(),reserve),{component,direction,order:1,principalValue:'0',nonzeroErrorRetained:true}));
    angular.push(pack(A.widen(A.zero(),reserve),{component,direction:'theta',order:1,includesCylindricalFrameConnection:true,nonzeroErrorRetained:true}));
    for(let i=0;i<directions.length;i++)for(let j=i;j<directions.length;j++){
      const sign=-phaseSigns[i]*phaseSigns[j],box=A.widen(sign===1?centers[component]:A.neg(centers[component]),reserve);
      second.push(pack(box,{component,directions:[directions[i],directions[j]],order:2,principalSign:sign,nonzeroErrorRetained:true,
        includesCylindricalFrameConnection:i===3||j===3,includesAngularDirectionConnection:i===3&&j===3}));
    }
  }
  const power=physicalCenterCompleteCurlErrorPowerAudit();
  return {schema:'MathScope.PhysicalCompleteCurlJetCoefficientNumerics/1',request:{precisionBits,tolerance:qtext(tol)},velocityCoefficients,
    first,angular,second,rows:[...first,...angular,...second],positiveRemainder:qtext(reserve),power,
    normalization:{first:'V_j*k*Omega_i times the original physical coordinate scale',second:'V_j*k^2*Omega_i*Omega_j times both original physical coordinate scales',
      angular:'V_j*k*Omega_theta times the original radial physical coordinate scale; both vector-basis and direction-basis connection terms are included in second angular derivatives',
      frequency:'Omega_r=Bs*u>0, Omega_z=Bs>0, Omega_t=pTilde*F>0, Omega_theta=pTilde/R>0, pTilde=R*Bs*u/(Ls*gabs)>0; actual phase signs are +,-,-,+ and the original rounded p remains in every source derivative'},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false},
    sourceAuthenticated:false,actualPhysicalPointCertified:false,positiveExactScalesNumericallyEvaluated:false,
    coefficientCurlDerivativeDiscarded:false,wholeGNUMComplete:false,pass:true};
}
