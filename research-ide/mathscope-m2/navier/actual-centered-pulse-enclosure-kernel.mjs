/** Directed arithmetic for the centered actual-pulse normalization.
 * This layer is a conditional lemma, never an actual-source token. The
 * separate adapter must bind every positive source scale and error premise.
 */
import {directedArithmetic,rational as Q,readRational,qadd,qsub,qmul,qdiv,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {encloseSigmaSquareIntegral} from './actual-cutoff-mass-enclosure.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';

const dyadic=n=>Q(1,1n<<BigInt(n)),abs=x=>x[0]<0n?[-x[0],x[1]]:x;
const pack=(A,x)=>A.pack(x),width=(A,x)=>Q(x[1]-x[0],A.S);

export function centeredReferenceGaussianBinding(G,input){
  const names=['variable','length','u','lambda0','lambda','dref','sign'];
  if(!G||!Array.isArray(G.nodes)||!input||Object.keys(input).some(k=>!names.includes(k))||names.slice(0,-1).some(k=>!Number.isSafeInteger(input[k])||!G.nodes[input[k]])||![1,-1].includes(input.sign))
    fail('INVALID_INPUT','Supply the complete actual reference lambda and damping expressions, their variable and fixed scales.');
  const {variable:v,length:L,u,lambda0,lambda,dref,sign}=input,q=(n,d=1)=>G.q(n,d),
    s=G.mul(q(sign),u,G.add(q(1,2),G.div(v,L))),sp=G.div(G.mul(q(sign),u),L),
    r0=G.sqrt(G.add(G.one,G.pow(u,2))),r=G.sqrt(G.add(G.one,G.pow(s,2))),
    expectedLambda=G.div(lambda0,r),expectedDamping=G.div(G.mul(lambda0,G.add(G.one,G.pow(s,2))),G.pow(r0,3));
  if(lambda!==expectedLambda||dref!==expectedDamping)fail('INVALID_SOURCE_CONSTRUCTION','The original reference damping and its exact center cannot be dropped or replaced.');
  if([L,u,lambda0].some(root=>G.freeCoordinates(root).has(v)))fail('INVALID_INPUT','The reference scales must be frozen in pulse time.');
  const rho=G.sub(lambda,dref),derivative=G.derivative(rho,v),expectedDerivative=G.neg(G.mul(lambda0,s,sp,G.add(G.pow(r,-3),G.mul(q(2),G.pow(r0,-3))))),
    derivativeCheck=sourceGraphRationalIdentity(G,G.sub(derivative,expectedDerivative),{atomicNodes:[lambda0,s,sp,r,r0,L,u],maxTerms:10000}),
    center=G.div(L,q(2)),rhoAtCenter=G.substitute(rho,v,center),g=G.div(G.mul(q(3),lambda0,G.pow(u,2)),G.pow(r0,3)),
    actualCenterRoot=G.substitute(r,v,center),centerArgumentCheck=sourceGraphRationalIdentity(G,G.sub(G.nodes[actualCenterRoot].args[0],G.nodes[r0].args[0]),{atomicNodes:[u,L],maxTerms:10000}),
    normalizedRhoAtCenter=G.substitute(rhoAtCenter,actualCenterRoot,r0),
    centerRemainder=G.div(G.mul(lambda0,G.sub(G.pow(r0,2),G.add(G.one,G.pow(u,2)))),G.pow(r0,3)),
    centerCheck=sourceGraphRationalIdentity(G,G.sub(normalizedRhoAtCenter,centerRemainder),{atomicNodes:[lambda0,r0,u,L],maxTerms:10000}),
    slopeAtCenter=G.substitute(derivative,v,center),normalizedSlopeAtCenter=G.substitute(slopeAtCenter,actualCenterRoot,r0),
    slopeCheck=sourceGraphRationalIdentity(G,G.add(normalizedSlopeAtCenter,G.div(g,L)),{atomicNodes:[lambda0,r0,u,L],maxTerms:10000});
  if(!derivativeCheck.pass||!centerArgumentCheck.pass||!centerCheck.pass||!slopeCheck.pass)fail('INVALID_SOURCE_CONSTRUCTION','The reference Gaussian derivative/center identities failed.');
  return {schema:'MathScope.CenteredReferenceGaussianBinding/1',input:{...input},roots:{s,sPrime:sp,root:r,centerRoot:r0,rho,derivative,center,rhoAtCenter,g,slopeAtCenter},
    checks:[{id:'literal-reference-with-full-damping',pass:true},{id:'actual-reference-derivative',...derivativeCheck},{id:'exact-equal-center-sqrt-arguments',...centerArgumentCheck},{id:'center-cancellation-before-sqrt-rule',...centerCheck},{id:'exact-center-curvature',...slopeCheck}],
    positiveSquareRootRule:{root:r0,argument:G.add(G.one,G.pow(u,2)),argumentStrictlyPositive:true,
      equalCenterRoot:actualCenterRoot,argumentIdentity:centerArgumentCheck,normalizedRhoAtCenter,normalizedSlopeAtCenter,
      statement:'The exact positive real root squared is its argument. The rational center check retains this separate relation and does not treat it as a free rational identity.'},
    pass:true,sourceAuthenticated:false};
}

export function centeredPulseNumericalRequest(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance','maxCutoffCells'].includes(k)))
    fail('INVALID_INPUT','Use directed precisionBits, an exact rational tolerance, and maxCutoffCells only. No matrix, amplitude or smallness bound is caller supplied.');
  const precisionBits=input.precisionBits??192,tolerance=input.tolerance??'1/1000000000000',maxCutoffCells=input.maxCutoffCells??4096;
  if(!Number.isSafeInteger(precisionBits)||precisionBits<96||precisionBits>512)fail('INVALID_INPUT','Use 96..512 directed precision bits.');
  if(typeof tolerance!=='string')fail('INVALID_INPUT','Tolerance is an exact rational string, never a floating Number.');
  const tol=readRational(tolerance);
  if(qcompare(tol,Q(0))<=0||qcompare(tol,Q(1,100))>0)fail('INVALID_INPUT','The coefficient interval-width tolerance must lie in (0,1/100].');
  if(qcompare(tol,dyadic(precisionBits-40))<0)fail('PRECISION_REQUIRED','The requested tolerance leaves insufficient directed-rounding and cutoff budgets.');
  if(!Number.isSafeInteger(maxCutoffCells)||maxCutoffCells<4||maxCutoffCells>4096||(maxCutoffCells&(maxCutoffCells-1)))fail('INVALID_INPUT','maxCutoffCells is a power of two from 4 through 4096.');
  return {precisionBits,tolerance:qtext(tol),maxCutoffCells};
}

/** atan(1/d)=sum(-1)^k/((2k+1)d^(2k+1)); the signed first
 * omitted term encloses the entire remainder. All products are exact
 * integers; only conversion into the dyadic accumulator rounds outward.
 */
function reciprocalAtan(A,d){
  const divisor=BigInt(d),square=divisor*divisor;let power=divisor,sum=A.zero(),terms=0;
  for(;;){
    const term=Q(1n,BigInt(2*terms+1)*power);
    if(qcompare(term,dyadic(A.bits+12))<=0){
      const remainder=A.point(term),positive=terms%2===0;
      return {interval:positive?[sum[0],sum[1]+remainder[1]]:[sum[0]-remainder[1],sum[1]],
        terms,denominator:String(d),nextTerm:qtext(term),remainderSign:positive?'NONNEGATIVE':'NONPOSITIVE'};
    }
    sum=A.add(sum,A.point(terms%2?qmul(Q(-1),term):term));terms++;power*=square;
    if(terms>512)fail('RESOURCE_LIMIT','The directed Machin series exhausted its explicit term budget.');
  }
}

export function encloseGaussianWholeMass({precisionBits=192}={}){
  const A=directedArithmetic(precisionBits),first=reciprocalAtan(A,5),second=reciprocalAtan(A,239),
    pi=A.sub(A.mul(A.point(16),first.interval),A.mul(A.point(4),second.interval)),root=A.sqrt(pi),
    tanTwo=Q(5,12),tanFour=qdiv(qmul(Q(2),tanTwo),qsub(Q(1),qmul(tanTwo,tanTwo))),
    machinTangent=qdiv(qsub(tanFour,Q(1,239)),qadd(Q(1),qmul(tanFour,Q(1,239))));
  if(qcompare(machinTangent,Q(1))!==0||pi[0]<=3n*A.S||pi[1]>=4n*A.S)fail('INTERNAL_VALIDATION','The Machin angle/quadrant audit failed.');
  return {schema:'MathScope.GaussianWholeMassDirectedKernel/1',pi:pack(A,pi),mass:pack(A,root),
    proof:{identity:'pi=16*atan(1/5)-4*atan(1/239)',tanDouble:qtext(tanTwo),tanQuadruple:qtext(tanFour),tanDifference:qtext(machinTangent),
      quadrant:'0<4*atan(1/5)-atan(1/239)<4/5<pi/2; its tangent is exactly1, so the angle is pi/4.',
      series:[first,second].map(({interval,...row})=>row),
      gaussian:'Integral over the whole real line of exp(-x^2) equals sqrt(pi); it follows by nonnegative Fubini and polar coordinates, or DLMF7.2.1/7.2.2 at zero.',
      squareRoot:'Integer floor/ceiling square roots of the dyadic endpoints; no library decimal is used as a bound.'},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false},
    sourceAuthenticated:false,conditionalNumericalKernel:true,pass:true};
}

/** Exact rational comparison of the finite constants in the proof below.
 * The assumptions are deliberately printed and must be source-bound.
 */
export function centeredGaussianErrorAudit(){
  const rows=[],check=(id,left,relation,right)=>{const c=qcompare(left,right);rows.push({id,left:qtext(left),relation,right:qtext(right),pass:relation==='<'?c<0:relation==='<='?c<=0:c===0});};
  const M=64,basePower=128,scalePower=1024,Epower=256,conePower=260,
    gaussianCore= qmul(Q(100n*BigInt(M)**3n,3),dyadic(basePower*511)),
    logWCore=qmul(Q(2*M),dyadic(basePower*254)),
    cone=dyadic(basePower*(scalePower-conePower)),combinedLog=qadd(gaussianCore,logWCore),
    // |exp(a)-1|<=2|a| for |a|<=1/2, |(1+r)^2-1|<=3|r|;
    // exp(a)<=2 and (1+r)^2<=4 give this conservative joint error.
    coreAbsolute=qmul(Q(2*M),qadd(qmul(Q(8),combinedLog),qmul(Q(6),cone))),
    actualTail=qmul(Q(24,M),dyadic(Math.floor(M*M/6))),referenceTail=qmul(Q(1,M),dyadic(M*M)),
    total=qadd(coreAbsolute,qadd(actualTail,referenceTail)),massRadius=dyadic(640),smallRadius=dyadic(8192);
  check('positive-curvature-normalized-lower',Q(1,3),'<=',Q(1));
  check('whole-band-curvature-upper',qmul(Q(3,6),Q(8+2)),'<=',Q(5));
  check('whole-band-curvature-Lipschitz',qadd(Q(10,3),Q(72)),'<',Q(100));
  check('central-window-inside-original-psi-plateau',Q(4*M),'<',Q(1n<<BigInt(basePower*511)));
  check('core-log-remainder-less-than-half',combinedLog,'<',Q(1,2));
  check('scalar-center-slope-tail-completion',Q(12),'<',Q(M));
  check('core-error-smaller-than-declared-small-radius',coreAbsolute,'<',smallRadius);
  check('complete-Gaussian-mass-remainder',total,'<',massRadius);
  check('midpoint-cone-and-frame-errors',qmul(Q(8),dyadic(basePower*763)),'<',smallRadius);
  check('source-column-error',dyadic(40967),'<',smallRadius);
  check('geometric-length-upper-is-below-one',Q(12,1n<<34n),'<',Q(1));
  return {schema:'MathScope.CenteredGaussianErrorAudit/1',pass:rows.every(r=>r.pass),rows,
    premises:{sourceAuthenticated:false,B:'B>=2^128 and B>=Renv^4096',S:'S=ell^2>=B^1024',
      sourceMatrix:'M=diag(0,-2*lambda)+Eactual-(d-dref)I, |Eactual_ij|,|d-dref|<=B^256/S',
      sourceFrame:'|Ka-K|,|Na-N|,|sa-s|<=B^256/S; all frozen c0/lambda bounds and original sign convention retained.',
      cone:'w_plus>0 and |w_minus/w_plus|<=B^260/S<=1/2',
      gaussianScales:'B^-1<g<B, S/B<=Ls<=S, hence g*Ls>=B^1022',
      selectedPoint:'slow=representative; eta=0,s=1,X=Xb*exp(-1/4); v0=Ls/2',
      normalizedTarget:'C*v=(1,0), |C-[[1,1],[-1,1]]|_max<=kappa/128<2^-8192',
      originalCutoff:'0<=psi<=1 and psi=1 on [Ls/4,3Ls/4]'},
    method:{center:'a_sign=w_plus_sign(Ls/2)>0; neither a_sign nor w_plus is replaced by1.',
      scalarGrowth:'|(log(w_plus/a_sign))_v|<=3*B^256/S; in x=(v-Ls/2)*sqrt(g/Ls), its coefficient beta<=B^-254.',
      curvature:'g=3*lambda0*u^2/(1+u^2)^(3/2), alpha=u^2/(1+u^2), zeta=1+(v-Ls/2)/Ls. Then -Ls*(lambda-dref)_v/g=q(zeta)=zeta*((1+alpha*(zeta^2-1))^(-3/2)+2)/3.',
      wholeBand:'q>=1/3 implies P^2<=exp(-x^2/3).',
      core:'For |x|<=64, |log(P^2)+x^2|<=100*|x|^3/(3*sqrt(g*Ls)). Combine with the scalar center ratio and the invariant cone, then integrate over length128.',
      tail:'For |x|>=64 and beta<=1, P^2*(w_plus/a)^2*(1+r)^2<=4*exp(-x^2/6). Both tails are <=24/64*exp(-64^2/6)<(24/64)*2^-682. The reference Gaussian has both tails <=2^-4096/64.',
      exponentBounds:'e>2 gives every displayed positive rational tail; no original exponential is set to zero.'},
    parameters:{centralRadius:M,basePower,scalePower,operatorPower:Epower,conePower,
      coreAbsoluteUpper:qtext(coreAbsolute),actualOmittedTailUpper:qtext(actualTail),referenceOmittedTailUpper:qtext(referenceTail),
      completeMassRadius:qtext(massRadius),componentAndMatrixRadius:qtext(smallRadius)},
    actualSourceAuthenticated:false,wholeSourceGNUMComplete:false};
}

/** H=Htilde diag(a_+^2,a_-^2). This small algebra audit only
 * proves the column scaling. Positivity of a and of the actual inverse
 * weights is a separate premise of the positive-square-root identity.
 */
export function centeredColumnScalingAudit({H,target,centerScales}={}){
  if(!Array.isArray(H)||H.length!==2||H.some(r=>!Array.isArray(r)||r.length!==2)||!Array.isArray(target)||target.length!==2||!Array.isArray(centerScales)||centerScales.length!==2)
    fail('INVALID_INPUT','Use one complete2x2 rational matrix, target pair and positive center pair.');
  const a=centerScales.map(x=>readRational(x)),M=H.map(r=>r.map(x=>readRational(x))),T=target.map(x=>readRational(x));
  if(a.some(x=>qcompare(x,Q(0))<=0))fail('INVALID_INPUT','Positive original center scales are required; a negative scale cannot cancel through its positive square root.');
  const inverseApply=B=>{const det=qsub(qmul(B[0][0],B[1][1]),qmul(B[0][1],B[1][0]));if(!det[0])fail('INVALID_INPUT','The column-scaling audit requires a nonzero determinant.');return [qdiv(qsub(qmul(B[1][1],T[0]),qmul(B[0][1],T[1])),det),qdiv(qsub(qmul(B[0][0],T[1]),qmul(B[1][0],T[0])),det)];};
  const squared=a.map(x=>qmul(x,x)),tilde=M.map(r=>r.map((x,j)=>qdiv(x,squared[j]))),y=inverseApply(M),yt=inverseApply(tilde),expected=y.map((x,j)=>qmul(x,squared[j]));
  return {schema:'MathScope.CenteredColumnScalingAudit/1',weights:y.map(qtext),normalizedWeights:yt.map(qtext),expected:expected.map(qtext),
    pass:yt.every((x,j)=>qcompare(x,expected[j])===0),positiveWeights:y.every(x=>qcompare(x,Q(0))>0),
    identity:'Htilde=H*diag(a^-2), ytilde=diag(a^2)*y. If a>0,y>0, sqrt(y)*t=sqrt(ytilde)*(t/a).',
    incorrectLinearColumnScaleRejected:yt.some((x,j)=>qcompare(x,qmul(a[j],y[j]))!==0),sourceAuthenticated:false};
}

/** Numerical coefficients only. The source adapter authenticates their
 * analytic premises and connects them to its original mass/H/y/t roots.
 */
export function encloseCenteredPulseCoefficients(input={},context={}){
  const request=centeredPulseNumericalRequest(input),A=directedArithmetic(request.precisionBits),tol=readRational(request.tolerance),
    audit=centeredGaussianErrorAudit(),gaussian=encloseGaussianWholeMass({precisionBits:request.precisionBits});
  if(!audit.pass)fail('INTERNAL_VALIDATION','The centered Gaussian exact error audit failed.');
  const sigma=encloseSigmaSquareIntegral({precisionBits:request.precisionBits,tolerance:qtext(qdiv(tol,Q(128))),maxCells:request.maxCutoffCells},context),
    cutoff=A.add(A.point(Q(1,2)),A.unpack(sigma.integral)),Dg=A.sub(A.point(4),A.mul(A.point(2),A.sqrt(A.point(2)))),
    d=A.widen(A.unpack(gaussian.mass),readRational(audit.parameters.completeMassRadius)),mass=A.mul(A.mul(Dg,cutoff),d),
    e=readRational(audit.parameters.componentAndMatrixRadius),one=A.widen(A.one(),e),minusOne=A.widen(A.point(-1),e),
    C=[[one,one],[minusOne,one]],det=A.sub(A.mul(C[0][0],C[1][1]),A.mul(C[0][1],C[1][0])),
    normalizedWeights=[A.div(C[1][1],det),A.div(A.neg(C[1][0]),det)],
    inverseCoefficients=normalizedWeights.map(x=>A.div(x,mass)),amplitudes=inverseCoefficients.map(x=>A.mul(A.sqrt(x),one)),
    firstRow=C[0].map(x=>A.mul(x,mass)),secondRow=C[1].map(x=>A.neg(A.mul(x,mass))),
    outputs={gaussianMass:d,normalizedMass:mass,normalizedCovarianceTheta:firstRow,normalizedCovarianceZ:secondRow,
      normalizedInverseWeight:inverseCoefficients,normalizedWeightedRadialAmplitude:amplitudes,normalizedWeightedNormalAmplitude:amplitudes,normalizedWeightedSignedTangentAmplitude:amplitudes};
  if(Dg[0]<=0n||mass[0]<=0n||det[0]<=0n||normalizedWeights.some(x=>x[0]<=0n)||inverseCoefficients.some(x=>x[0]<=0n))
    fail('PRECISION_REQUIRED','A source positive denominator or square-root input was not separated from zero by directed arithmetic.');
  const rows=[];
  for(const [name,boxes]of Object.entries(outputs))for(const [index,box]of(typeof boxes[0]==='bigint'?[boxes]:boxes).entries()){
    const w=width(A,box);if(qcompare(w,tol)>0)fail('PRECISION_REQUIRED','The complete propagated '+name+' enclosure is wider than the requested tolerance.');
    rows.push({name,index,interval:pack(A,box),width:qtext(w),toleranceMet:true});
  }
  return {schema:'MathScope.CenteredPulseCoefficientNumerics/1',request,rows,
    values:{gaussianMass:pack(A,d),normalizedMass:pack(A,mass),normalizedCovarianceTheta:firstRow.map(x=>pack(A,x)),normalizedCovarianceZ:secondRow.map(x=>pack(A,x)),
      normalizedInverseWeight:inverseCoefficients.map(x=>pack(A,x)),normalizedWeightedAmplitude:amplitudes.map(x=>pack(A,x))},
    normalization:{mass:'mass_sign/(a_sign^2*r0^2/sqrt(g*Ls))',Htheta:'Htheta_sign/(Ac*a_sign^2*r0^2/sqrt(g*Ls))',
      Hz:'Hz_sign/(u*a_sign^2*r0^2/sqrt(g*Ls)) at N=(-1,0),K=(0,-1)',
      y:'y_sign*a_sign^2*r0^2/(tau*sqrt(g*Ls))',
      radial:'sqrt(y_sign)*t_r_sign(Ls/2) / (sqrt(tau)*(g*Ls)^(1/4)/r0)',
      normal:'-N dot (sqrt(y_sign)*t_tan_sign(Ls/2)) / (Ac*sqrt(tau)*(g*Ls)^(1/4)/r0)',
      signedTangent:'-sign*K dot (sqrt(y_sign)*t_tan_sign(Ls/2)) / (u*sqrt(tau)*(g*Ls)^(1/4)/r0)',
      unknownCenterFactorsCancelOnlyInWeightedAmplitude:true,unknownTargetScaleNumericallyEvaluated:false},
    sourceErrorAudit:audit,gaussian,sigmaIntegral:sigma,
    stability:{normalizedC:C.map(r=>r.map(x=>pack(A,x))),normalizedDeterminant:pack(A,det),normalizedMassWeights:normalizedWeights.map(x=>pack(A,x)),
      determinantSeparatedFromZero:true,positiveSquareRootInputs:inverseCoefficients.map(x=>pack(A,x)),allSourceMassAndWaveScalesStrictlyPositiveAreAdapterPremises:true},
    errorBudget:{tolerance:request.tolerance,cutoffIntegral:sigma.errorBudget,cutoffRequestedWidth:qtext(qdiv(tol,Q(128))),
      gaussianAnalyticRadius:audit.parameters.completeMassRadius,coneFrameAndColumnRadius:audit.parameters.componentAndMatrixRadius,
      elementarySeries:gaussian.proof.series,outwardNonlinearPropagation:true,everyOutputWidthChecked:true,
      positiveTinyRemaindersRetained:true,tinyErrorPolicy:'A nonzero error below one dyadic ulp is rounded up, never set to zero.'},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,additionalOperations:A.operations(),binary64UsedForDecisions:false},
    sourceAuthenticated:false,wholeGNUMComplete:false,pass:true};
}
