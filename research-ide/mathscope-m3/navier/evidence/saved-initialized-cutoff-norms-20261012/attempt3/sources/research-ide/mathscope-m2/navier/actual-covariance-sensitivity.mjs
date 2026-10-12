/** First slow derivative of the genuine source covariance integrals.
 * The fixed-label source adapter takes no matrices, derivatives or bounds
 * from a caller. Its inverse is a rational identity on det(H) != 0; the
 * exercised ell=1 member is not asserted to lie below the certified qStar.
 */
import {prepareActualPulseSensitivityProgram,assertActualPulseSensitivityProgram} from './actual-pulse-sensitivity.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap();
const components=[['theta',1],['z',2],['mass',0]];
const same=(G,a,b,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes,maxTerms:40000});
const requireRoots=(G,roots)=>{if(roots.some(x=>!Number.isSafeInteger(x)||!G.nodes[x]))fail('INVALID_INPUT','Every operand must be a retained expression root.');};

/** Generic Leibniz kernel. This proves expression identities, not source
 * authenticity, differentiability or a numerical integral enclosure.
 * In particular, moving endpoints and the prefactor are never assumed fixed.
 */
export function covarianceIntegralFirstDerivative(G,input){
  const keys=['amplitude','cutoff','factor','variable','parameter','left','right'];
  if(!input||Object.keys(input).some(k=>!keys.includes(k))||input.amplitude?.length!==3)fail('INVALID_INPUT','Use three amplitude components and explicit integral geometry.');
  const {amplitude,cutoff,factor,variable,parameter,left,right}=input;
  requireRoots(G,[...amplitude,cutoff,factor,variable,parameter,left,right]);
  if(G.nodes[variable].op!=='coordinate'||G.nodes[parameter].op!=='coordinate'||variable===parameter)fail('INVALID_INPUT','Integration time and differentiated parameter must be distinct coordinates.');
  if([left,right,factor].some(x=>G.dependsOn(x,variable)))fail('INVALID_INPUT','Endpoints and the exterior prefactor cannot depend on their bound integration coordinate.');
  const amplitudeDerivative=amplitude.map(x=>G.derivative(x,parameter));
  const cutoffDerivative=G.derivative(cutoff,parameter),factorDerivative=G.derivative(factor,parameter);
  const leftDerivative=G.derivative(left,parameter),rightDerivative=G.derivative(right,parameter);
  const atom=[...amplitude,...amplitudeDerivative,cutoff,cutoffDerivative];
  const rows=components.map(([component,j])=>{
    const density=j===0?G.pow(amplitude[0],2):G.mul(amplitude[0],amplitude[j]);
    // Preserve the precise product/power form used by the original H builder.
    const integrand=j===0?G.mul(G.pow(cutoff,2),density):G.mul(G.pow(cutoff,2),amplitude[0],amplitude[j]);
    const densityDerivative=G.add(G.mul(amplitudeDerivative[0],amplitude[j]),G.mul(amplitude[0],amplitudeDerivative[j]));
    const productDerivative=G.add(G.mul(G.q(2),cutoff,cutoffDerivative,density),G.mul(G.pow(cutoff,2),densityDerivative));
    const integrandDerivative=G.derivative(integrand,parameter),productCheck=same(G,integrandDerivative,productDerivative,atom);
    const integral=G.integral(integrand,variable,left,right),original=G.mul(factor,integral);
    // Do not evaluate endpoints whose derivative is exactly zero: their
    // removable/inactive branches may not be numerically evaluable there.
    const upperBoundary=rightDerivative===G.zero?G.zero:G.mul(G.substitute(integrand,variable,right),rightDerivative);
    const lowerBoundary=leftDerivative===G.zero?G.zero:G.mul(G.substitute(integrand,variable,left),leftDerivative);
    const interior=G.integral(integrandDerivative,variable,left,right);
    const derivative=G.add(G.mul(factorDerivative,integral),G.mul(factor,G.add(interior,upperBoundary,G.neg(lowerBoundary))));
    const directDerivative=G.derivative(original,parameter),leibnizCheck=same(G,directDerivative,derivative);
    if(!productCheck.pass||!leibnizCheck.pass)fail('INTERNAL_VALIDATION','Covariance differentiation lost a product, prefactor or moving endpoint term.');
    return {component,index:j,original,integral,integrand,density,integrandDerivative,productDerivative,densityDerivative,
      derivative,directDerivative,interior,upperBoundary,lowerBoundary,productCheck,leibnizCheck};
  });
  return {schema:'MathScope.CovarianceIntegralFirstDerivative/1',variable,parameter,left,right,factor,cutoff,amplitude:[...amplitude],
    amplitudeDerivative,cutoffDerivative,factorDerivative,leftDerivative,rightDerivative,rows,
    sourceAuthenticated:false,analyticPremises:['The displayed amplitude and cutoff are C1 on the moving compact integration domain.','The first parameter derivative is locally dominated; endpoint traces exist.'],
    formula:'d_a [h integral_l^r psi^2 t_r t_j] = h_a integral_l^r psi^2 t_r t_j + h [integral_l^r d_a(psi^2 t_r t_j) + (psi^2 t_r t_j)(r) r_a - (psi^2 t_r t_j)(l) l_a]'};
}

/** A 2x2 inverse and its actual body derivative. There is no caller-supplied
 * derivative matrix, determinant bound or positivity certificate.
 */
export function covarianceInverseFirstDerivative(G,input){
  if(!input||Object.keys(input).some(k=>!['matrix','target','parameter'].includes(k))||input.matrix?.length!==2||input.matrix.some(r=>r.length!==2)||input.target?.length!==2)fail('INVALID_INPUT','Use one explicit 2x2 matrix, a two-component target and a parameter.');
  const {matrix:H,target:T,parameter}=input;requireRoots(G,[...H.flat(),...T,parameter]);
  if(G.nodes[parameter].op!=='coordinate')fail('INVALID_INPUT','The inverse derivative parameter must be a coordinate.');
  const Ha=H.map(r=>r.map(x=>G.derivative(x,parameter))),Ta=T.map(x=>G.derivative(x,parameter));
  const determinant=G.sub(G.mul(H[0][0],H[1][1]),G.mul(H[0][1],H[1][0]));
  if(G.isq(determinant)&&G.fraction(determinant)[0]===0n)fail('SINGULAR_COVARIANCE','The supplied expression matrix is identically singular.');
  const adjugate=[[H[1][1],G.neg(H[0][1])],[G.neg(H[1][0]),H[0][0]]];
  const multiply=(M,v)=>M.map(row=>G.add(...row.map((x,j)=>G.mul(x,v[j]))));
  const solve=rhs=>multiply(adjugate,rhs).map(x=>G.div(x,determinant));
  const weights=solve(T),matrixDerivativeTimesWeight=multiply(Ha,weights),rhs=Ta.map((x,j)=>G.sub(x,matrixDerivativeTimesWeight[j]));
  const weightDerivative=solve(rhs),directWeightDerivative=weights.map(x=>G.derivative(x,parameter));
  const atoms=[...H.flat(),...Ha.flat(),...T,...Ta];
  const valueChecks=multiply(H,weights).map((x,j)=>same(G,x,T[j],atoms));
  const derivativeChecks=multiply(H,weightDerivative).map((x,j)=>same(G,G.add(x,matrixDerivativeTimesWeight[j]),Ta[j],atoms));
  const directChecks=weightDerivative.map((x,j)=>same(G,x,directWeightDerivative[j],atoms));
  if(![...valueChecks,...derivativeChecks,...directChecks].every(x=>x.pass))fail('INTERNAL_VALIDATION','The covariance inverse or its differentiated equation failed its rational identity check.');
  return {schema:'MathScope.CovarianceInverseFirstDerivative/1',matrix:H.map(r=>[...r]),target:[...T],parameter,matrixDerivative:Ha,targetDerivative:Ta,
    determinant,adjugate,weights,matrixDerivativeTimesWeight,rhs,weightDerivative,directWeightDerivative,valueChecks,derivativeChecks,directChecks,
    identity:'y_a = H^-1 (T_a - H_a y), y=H^-1 T',
    domain:{required:'det(H) != 0',nonzeroDeterminantProved:false,positiveWeightsProved:false},
    sourceAuthenticated:false,squareRootsConstructed:false,newLeanKernelProof:false};
}

// The same full leading target as actual-covariance-source-target.mjs. This
// construction must run on sensitivity.G: operator.G is the earlier graph,
// so appended nodes on that graph cannot be reused as sensitivity root IDs.
// The complete prefixes, pressure datum and BOTH shear terms are retained.
export function actualLeadingTargetOnSensitivityGraph(G,operator){
  const {background,chart,constants:c}=operator,{X,eta}=background.prepared.bootstrap.constants,q=(n,d=1)=>G.q(n,d);
  const F=background.prepared.records[0].global.F,U=background.prepared.records[0].global.U,M=background.prepared.bootstrap.finalM;
  const prefix=(name,body)=>{const t=G.fresh('actual_covariance_sensitivity_target_'+name);return G.share(G.integral(G.substitute(body,X,t),t,G.zero,X),[X,eta],'ActualCovarianceSensitivityTargetPrefix_'+name);};
  const I=prefix('I',G.mul(q(2),X,F)),J=prefix('J',G.mul(q(2),X,U,F));
  const S=prefix('S',G.sub(G.pow(U,2),G.mul(X,G.pow(F,2)))),Cp=prefix('Cp',G.pow(F,2));
  const d=G.sub(G.one,G.pow(eta,2)),L=G.sub(G.one,G.mul(q(2),c.h,G.pow(eta,2))),Pi=G.add(G.core.P0,Cp);
  const W=G.sub(G.one,G.div(G.add(G.mul(q(2),c.D,eta,M),G.mul(d,G.derivative(M,eta))),X)),sqrt2X=G.sqrt(G.mul(q(2),X));
  const angularNumerator=G.add(G.mul(G.sub(G.one,c.h),I),G.neg(G.mul(c.D,eta,G.derivative(I,eta))),G.neg(G.mul(d,G.derivative(J,eta))),G.mul(q(2),G.sub(c.h,c.D),eta,J));
  const thetaStock=G.neg(G.div(G.mul(F,X,W),L)),thetaMoment=G.div(angularNumerator,G.mul(q(2),X,L)),thetaShear=G.mul(q(2),X,G.derivative(F,X));
  const axialNumerator=G.add(G.neg(G.mul(X,W,U)),G.mul(c.D,G.sub(M,G.mul(eta,G.derivative(M,eta)))),G.mul(q(4),c.h,eta,S),G.neg(G.mul(d,G.derivative(S,eta))),G.mul(X,G.sub(G.mul(q(4),c.A,eta,Pi),G.mul(d,G.derivative(Pi,eta)))));
  const zMoment=G.div(axialNumerator,G.mul(L,sqrt2X)),zShear=G.div(G.mul(q(2),X,G.derivative(U,X)),sqrt2X);
  const raw=[G.add(thetaStock,thetaMoment,thetaShear),G.add(zMoment,zShear)].map((body,j)=>G.share(body,[X,eta],'ActualCovarianceSensitivityFullLeadingTarget_'+j));
  const factor=G.exp(G.mul(G.neg(G.add(c.A,q(1,2))),G.log(chart.s)));
  const target=raw.map(body=>G.mul(factor,G.simultaneousSubstitute(body,[X,eta],[chart.X,chart.eta])));
  return {sourceModule:'actual-covariance-source-target.mjs:attachActualCovarianceTarget',definition:'s^(-A-1/2)*T0(X,eta)',
    coordinates:{X,eta},F,U,M,I,J,S,Cp,Pi,W,raw,chartFactor:factor,components:target,
    terms:{thetaStock,thetaMoment,thetaShear,zMoment,zShear},
    originalCompletedSourceRetained:true,actualHeatPreparedPressureRetained:true,bothShearTermsRetained:true};
}

const binding=r=>canonicalStringify({request:r.request,rows:r.rows,target:r.target,inverse:r.inverse,roots:r.roots,checks:r.checks,scope:r.scope,domain:r.domain});

/** Reuse one authenticated pulse graph, avoiding a second heavy source run. */
export function attachActualCovarianceSensitivity(pulse,context={}){
  assertActualPulseSensitivityProgram(pulse);context.checkCancelled?.();
  const {G,operator:o,request}=pulse,startNode=G.nodes.length,startExpression=G.expressionSystems.length;
  const parameter=o.coordinates[request.slowCoordinate],variable=o.coordinates.v,rows=[];
  for(const f of o.families){
    context.checkCancelled?.();const variation=pulse.rows.find(r=>r.sign===f.sign);
    if(!variation)fail('INVALID_SOURCE_CONSTRUCTION','A source covariance family has no authenticated first variation.');
    const geometry={factor:o.geometry.haarFactor,cutoff:o.cutoffs.psi,variable,parameter,left:G.zero,right:o.geometry.Ls};
    const exact=covarianceIntegralFirstDerivative(G,{...geometry,amplitude:f.t});
    if(exact.factorDerivative!==G.zero||exact.cutoffDerivative!==G.zero||exact.leftDerivative!==G.zero||exact.rightDerivative!==G.zero)fail('INVALID_SOURCE_CONSTRUCTION','A frozen source label unexpectedly moved its Haar, cutoff or time endpoints.');
    if(!exact.rows.every(r=>r.original===f.covariance[r.component]))fail('INVALID_SOURCE_CONSTRUCTION','The differentiated covariance integral is not the retained original source integral.');
    const finiteAmplitude=f.frame.B.map(row=>G.mul(f.P,G.add(...row.map((x,j)=>G.mul(x,variation.finite.values[j])))));
    const finite=covarianceIntegralFirstDerivative(G,{...geometry,amplitude:finiteAmplitude});
    const finiteDerivativeChecks=finite.amplitudeDerivative.map((x,j)=>same(G,x,variation.finiteAmplitudeDerivative[j]));
    if(!finiteDerivativeChecks.every(c=>c.pass))fail('INTERNAL_VALIDATION','The finite covariance derivative lost its actual moving-frame contribution.');
    const s=G.pulseSensitivitySystems[variation.system],K=s.bounds.augmentedMatrixNorm,I=s.bounds.augmentedInitialNorm,L=o.geometry.Ls;
    const wholeAugmentedNorm=G.mul(I,G.exp(G.mul(K,L))),B=variation.bounds.basisNorm,D=G.add(B,variation.bounds.basisDerivativeNorm),E=variation.finite.tail;
    // Uniform product error: two differentiated products, each with two
    // errors. Keep P^2 in the integral rather than silently discarding it.
    const envelopeSquaredIntegral=G.integral(G.mul(G.pow(o.cutoffs.psi,2),G.pow(f.P,2)),variable,G.zero,L);
    const absoluteError=G.mul(G.q(4),o.geometry.haarFactor,B,D,wholeAugmentedNorm,E,envelopeSquaredIntegral);
    const coarseAbsoluteError=G.mul(G.q(4),o.geometry.haarFactor,B,D,wholeAugmentedNorm,E,L);
    if(E===G.zero||absoluteError===G.zero)fail('INVALID_SOURCE_CONSTRUCTION','A finite covariance derivative cannot lose its nonzero Volterra remainder.');
    rows.push({sign:f.sign,exact,finite,finiteDerivativeChecks,finiteTerms:request.terms,
      exactDerivativeRoots:exact.rows.map(r=>r.derivative),finiteDerivativeRoots:finite.rows.map(r=>r.derivative),
      derivativeEnclosures:finite.rows.map(r=>[G.sub(r.derivative,absoluteError),G.add(r.derivative,absoluteError)]),
      tail:{absoluteError,coarseAbsoluteError,envelopeSquaredIntegral,basisNorm:B,basisDerivativeNorm:variation.bounds.basisDerivativeNorm,
        wholeAugmentedNorm,factorialTail:E,augmentedMatrixNorm:K,augmentedInitialNorm:I,length:L,
        formula:'4*haarFactor*B*(B+Ba)*I*exp((K+Ka)*L)*tail_N*Integral_0^L psi^2*P^2 dv',
        convergence:'For fixed original source and finite band, tail_N=I*exp((K+Ka)*L)*((K+Ka)*L)^(N+1)/(N+1)! tends to zero.',
        productProof:'Each differentiated density has two products. Both the exact and finite augmented vectors are bounded by I exp((K+Ka)L); their difference is bounded by tail_N. The two product differences give 4 B(B+Ba) I exp((K+Ka)L) tail_N P^2.',
        envelopeProof:'P(mid)=1; |sref|=u*(1/2+v/L). lambda-dref is nonnegative before mid and nonpositive after mid. Hence 0<P<=1 on [0,L], and 0<=psi<=1 gives Integral psi^2 P^2<=L.',
        sourceDerived:true,suppliedConstants:false,errorTendsToZero:true,fixedComparisonFloor:false,numericalWholeIntegralEnclosure:false}});
  }
  const target=actualLeadingTargetOnSensitivityGraph(G,o),H=[o.families.map(f=>f.covariance.theta),o.families.map(f=>f.covariance.z)];
  const inverse=covarianceInverseFirstDerivative(G,{matrix:H,target:target.components,parameter});
  const derivativeBindingChecks=H.flatMap((r,i)=>r.map((_,j)=>same(G,inverse.matrixDerivative[i][j],rows[j].exact.rows[i].derivative)));
  const scope={actualSourceFirstCovarianceDerivativeConstructed:true,actualThetaZMassIntegralsDifferentiated:true,
    originalHaarAndCutoffPreserved:true,frozenLabelEndpointDerivativesComputed:true,actualFullLeadingTargetDerivativeConstructed:true,
    actualInverseWeightDerivativeConstructed:true,inverseDerivativeConditionalOnNonzeroDeterminant:true,
    sourceDerivedConvergentDerivativeIntegralTail:true,positiveWeightsOfExercisedMemberCertified:false,squareRootWeightsConstructed:false,
    firstSlowDerivativeOrder:1,secondSlowDerivativeConstructed:false,actualNumericalWholeHQuadrature:false,
    actualSourceFullCurlComplete:false,fullPhysicalResidualAndFlatErrorPackageComplete:false,newLeanKernelProof:false,
    originalM2AcceptanceCountChanged:false};
  const domain={...structuredClone(pulse.domain),inverse:'Only on det(H) != 0; the identity is rational, not an unconditional invertibility assertion.',
    sourceCertifiedPositiveDomain:'The existing original family theorem separately applies for ell>=ellMinimum (q<qStar), in the same selected box and open stress annulus Xa<X<Xb.',
    exercisedMember:{ellExact:request.ellExact,certifiedBandMembership:false,determinantNonzeroCertified:false,positiveWeightsCertified:false},
    squareRootWeights:'No square roots of inverse weights are constructed or declared positive for the exercised member.',
    integralDerivative:'Ordinary first slow derivative on the fixed compact pulse interval; exact functional construction and factorial enclosure, not evaluated decimal quadrature.'};
  const checks=[
    {id:'genuine-source-covariance-bodies',pass:rows.every(r=>r.exact.rows.every(x=>x.original===o.families.find(f=>f.sign===r.sign).covariance[x.component]))},
    {id:'full-product-and-endpoint-calculus',pass:rows.every(r=>r.exact.rows.every(x=>x.productCheck.pass&&x.leibnizCheck.pass))},
    {id:'fixed-label-geometry-computed',pass:rows.every(r=>[r.exact.factorDerivative,r.exact.cutoffDerivative,r.exact.leftDerivative,r.exact.rightDerivative].every(x=>x===G.zero))},
    {id:'finite-source-amplitude-derivative',pass:rows.every(r=>r.finiteDerivativeChecks.every(x=>x.pass))},
    {id:'nonzero-convergent-integral-tail',pass:rows.every(r=>r.tail.absoluteError!==G.zero&&r.tail.factorialTail!==G.zero&&r.tail.sourceDerived&&r.tail.errorTendsToZero)},
    {id:'full-target-pressure-and-shear',pass:target.originalCompletedSourceRetained&&target.actualHeatPreparedPressureRetained&&target.bothShearTermsRetained},
    {id:'inverse-includes-Ha-times-y',pass:[...inverse.valueChecks,...inverse.derivativeChecks,...inverse.directChecks,...derivativeBindingChecks].every(x=>x.pass)},
    {id:'exercised-domain-not-promoted',pass:!domain.exercisedMember.certifiedBandMembership&&!domain.exercisedMember.positiveWeightsCertified&&!scope.actualSourceFullCurlComplete}
  ];
  if(!checks.every(x=>x.pass))fail('INTERNAL_VALIDATION','The actual covariance sensitivity source contract failed.');
  const roots={...Object.fromEntries(rows.flatMap(r=>[
    ...r.exact.rows.map(x=>['dH_'+r.sign+'_'+x.component,x.derivative]),
    ...r.finite.rows.map(x=>['finite_dH_'+r.sign+'_'+x.component,x.derivative]),
    ['dH_error_'+r.sign,r.tail.absoluteError],['dH_coarse_error_'+r.sign,r.tail.coarseAbsoluteError]
  ])),targetTheta:target.components[0],targetZ:target.components[1],targetDerivativeTheta:inverse.targetDerivative[0],targetDerivativeZ:inverse.targetDerivative[1],
    determinant:inverse.determinant,weightPlus:inverse.weights[0],weightMinus:inverse.weights[1],weightDerivativePlus:inverse.weightDerivative[0],weightDerivativeMinus:inverse.weightDerivative[1]};
  const result={G,pulse,operator:o,request,rows,target,inverse,roots,checks,scope,domain};
  result.program=G.pack(roots,{schema:'MathScope.ActualCovarianceSensitivityProgram/1',compiler:'actual-covariance-sensitivity.mjs:prepareActualCovarianceSensitivityProgram',
    compilerInput:request,sourceProfile:request.sourceProfile,parameterExpressionSHA256:o.parameterExpressionSHA256,domain,scope,checks,rows,target,inverse});
  seals.set(result,{G,pulse,startNode,nodeCount:G.nodes.length,nodes:JSON.stringify(G.nodes.slice(startNode)),startExpression,expressionCount:G.expressionSystems.length,
    expressions:JSON.stringify(G.expressionSystems.slice(startExpression)),data:binding(result)});
  return result;
}

export function prepareActualCovarianceSensitivityProgram(input={},context={}){
  return attachActualCovarianceSensitivity(prepareActualPulseSensitivityProgram(input,context),context);
}

export function assertActualCovarianceSensitivityProgram(result){
  const s=seals.get(result);
  if(!s||result.G!==s.G||result.pulse!==s.pulse||JSON.stringify(s.G.nodes.slice(s.startNode,s.nodeCount))!==s.nodes||
    JSON.stringify(s.G.expressionSystems.slice(s.startExpression,s.expressionCount))!==s.expressions||binding(result)!==s.data)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally generated actual covariance sensitivity; copied or edited receipts are not source certificates.');
  assertActualPulseSensitivityProgram(s.pulse);return true;
}

export async function actualCovarianceSensitivityCertificate(input={},context={}){
  const prepared=prepareActualCovarianceSensitivityProgram(input,context);assertActualCovarianceSensitivityProgram(prepared);context.checkCancelled?.();
  const {G,program,request,rows,inverse,domain,scope,checks}=prepared,serialized=canonicalStringify(program),digest=await sha256(serialized);context.checkCancelled?.();
  return {schema:'MathScope.ActualCovarianceSensitivityCertificate/1',status:'COMPLETED',pass:true,request,
    sourceProfile:request.sourceProfile,parameterExpressionSHA256:prepared.operator.parameterExpressionSHA256,
    completedScope:'Actual first fixed-label slow derivatives of the two original covariance columns and masses; full leading target derivative and inverse derivative on det(H) != 0.',
    domain,scope,checks,graph:{sha256:digest,nodeCount:G.nodes.length,canonicalBytes:new TextEncoder().encode(serialized).byteLength,roots:program.roots,
      compiler:program.compiler,compilerInput:request,graphIncluded:false},
    integralRows:rows.flatMap(r=>r.exact.rows.map((x,j)=>({sign:r.sign,component:x.component,originalRoot:x.original,derivativeRoot:x.derivative,
      finiteDerivativeRoot:r.finite.rows[j].derivative,absoluteErrorRoot:r.tail.absoluteError,lowerRoot:r.derivativeEnclosures[j][0],upperRoot:r.derivativeEnclosures[j][1],
      originalHaarRoot:r.exact.factor,originalCutoffRoot:r.exact.cutoff,endpointDerivatives:[r.exact.leftDerivative,r.exact.rightDerivative],productCheck:x.productCheck.pass,leibnizCheck:x.leibnizCheck.pass}))),
    tailRows:rows.map(r=>({sign:r.sign,...r.tail})),
    inverse:{matrixRoots:inverse.matrix,matrixDerivativeRoots:inverse.matrixDerivative,targetRoots:inverse.target,targetDerivativeRoots:inverse.targetDerivative,
      determinantRoot:inverse.determinant,weightRoots:inverse.weights,weightDerivativeRoots:inverse.weightDerivative,identity:inverse.identity,
      domain:inverse.domain,squareRootsConstructed:false,rationalChecks:[...inverse.valueChecks,...inverse.derivativeChecks,...inverse.directChecks].every(x=>x.pass)},
    target:{sourceModule:prepared.target.sourceModule,definition:prepared.target.definition,terms:prepared.target.terms,bothShearTermsRetained:true},
    interpretation:'The output roots denote retained exact convergent source expressions. The finite approximant has a nonzero absolute tail. This does not evaluate the whole original H, certify ell=1 positivity, construct the full curl, or prove global residual flatness.'};
}
