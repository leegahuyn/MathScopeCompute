/** Source equations for N6, with explicit separation between a finite
 * input operation and a completed reconstruction of the pinned field. */
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const SQRT2=Math.sqrt(2),VT=[SQRT2-1,1];
const clone=x=>JSON.parse(JSON.stringify(x));
const sum=xs=>xs.reduce((a,b)=>a+b,0);

export const NS_PAPER={url:'https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf',sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',pages:166};

/** Exact algebraic-number divisor. Its norm is a nonzero integer,
 * so cancellation in the irrational dot product cannot produce a zero. */
export function auxiliaryDivisor(k){
  if(!Array.isArray(k)||k.length!==2||k.some(x=>!Number.isSafeInteger(x)||Math.abs(x)>1000000))fail('INVALID_MODE','Auxiliary modes must be integer pairs bounded by 10^6.');
  const [a,b]=k;if(a===0&&b===0)fail('ZERO_MODE','N has a kernel at the zero auxiliary mode.');
  const A=BigInt(a),B=BigInt(b-a),integerNorm=B*B-2n*A*A;
  if(integerNorm===0n)fail('DIVISOR_ERROR','A nonzero auxiliary mode unexpectedly had zero algebraic norm.');
  const conjugate=(b-a)-SQRT2*a,inverse=conjugate/Number(integerNorm),normLower=1;
  return {mode:[...k],vt:[...VT],exactDot:{rational:b-a,sqrt2:a},integerNorm:integerNorm.toString(),inverse,
    inverseUpper:Math.abs(b-a)+SQRT2*Math.abs(a),normLower,
    expression:'1/(vt dot k) = ((k2-k1)-sqrt(2)*k1)/((k2-k1)^2-2*k1^2)'};
}

export function temporalMeanInverse(input={}){
  const {modes=[],c=1,completeFinitePolynomial=false,derivativeOrder=0,tailCutoff=1,CmPlus4Bound=null}=input;
  if(!finite(c)||c<=0||!Number.isInteger(derivativeOrder)||derivativeOrder<0||derivativeOrder>12)fail('INVALID_INPUT','Use c>0 and a derivative order from 0 through 12.');
  if(!Array.isArray(modes)||modes.length>4096)fail('RESOURCE_LIMIT','At most 4096 auxiliary Fourier modes are supported.');
  const seen=new Set(),out=[];let error=0;
  for(const row of modes){
    if(!row||!Array.isArray(row.coefficient)||row.coefficient.length!==2||row.coefficient.some(x=>!finite(x)))fail('INVALID_INPUT','A mode needs a finite complex coefficient.');
    const k=row.k,id=Array.isArray(k)?k.join(','):'';if(seen.has(id))fail('DUPLICATE_MODE','Combine duplicate Fourier coefficients before inversion.');seen.add(id);
    if(k?.[0]===0&&k?.[1]===0){if(row.coefficient.some(x=>x!==0))fail('NONZERO_AUXILIARY_MEAN','Remove the Haar mean before applying equation (8.20).');continue;}
    const divisor=auxiliaryDivisor(k),factor=divisor.inverse/(2*Math.PI*c),[re,im]=row.coefficient,increment=[-im*factor,re*factor],dot=1/divisor.inverse;
    const recovered=[-2*Math.PI*c*dot*increment[1],2*Math.PI*c*dot*increment[0]];
    error=Math.max(error,Math.abs(recovered[0]+re),Math.abs(recovered[1]+im));
    out.push({k:[...k],source:[re,im],increment,divisor,recoveredFastDerivative:recovered});
  }
  let conjugacyError=0;for(const row of out){const other=out.find(x=>x.k.every((k,i)=>k===-row.k[i]));if(!other){conjugacyError=Infinity;break;}conjugacyError=Math.max(conjugacyError,Math.abs(other.increment[0]-row.increment[0]),Math.abs(other.increment[1]+row.increment[1]));}
  if(conjugacyError>1e-11)fail('NONREAL_SOURCE','A real correction requires every conjugate mode pair.');
  let tail;
  if(completeFinitePolynomial)tail={kind:'EXACT_FINITE_SUPPORT',omittedCoefficientBound:0,validFor:'The supplied list defines a finite torus polynomial, not the complete paper source.'};
  else if(finite(CmPlus4Bound)&&CmPlus4Bound>=0&&Number.isInteger(tailCutoff)&&tailCutoff>=1){
    // 8n lattice points have |k|_infty=n. Differentiate in an axis
    // attaining n to bound Fhat by C_(m+4)/(2pi*n)^(m+4).
    const bound=8*(2+SQRT2)*CmPlus4Bound/((2*Math.PI)**5*c*tailCutoff);
    tail={kind:'CONDITIONAL_FOURIER_TAIL',bound,order:derivativeOrder,requiresDerivativeOrder:derivativeOrder+4,
      assumedCmPlus4Bound:CmPlus4Bound,cutoff:tailCutoff,formula:'8(2+sqrt(2))*||F||C^(m+4) / ((2pi)^5 c K)',assumptionVerified:false};
  }else tail={kind:'TAIL_UNAVAILABLE',bound:null,requiresDerivativeOrder:derivativeOrder+4};
  return {schema:'MathScope.N6.TemporalMeanInverse/1',reference:'(6.2), (6.7), (8.19)-(8.23)',paper:NS_PAPER,
    status:completeFinitePolynomial?'FINITE_POLYNOMIAL_EXECUTED':tail.bound!==null?'CONDITIONAL_TAIL_ESTIMATE':'FINITE_PREFIX_ONLY',
    c,vt:[...VT],zeroMode:[0,0],rows:out,maxCancellationError:error,conjugacyError,tail,
    axialRealization:{desiredGamma:'-c^-1 N^-1 E_z^circ',potential:'T1 gammaDesired',radial:'-epsilon partial_Z potential',actualGamma:'gammaDesired-A1 gammaDesired',cutoffRemainderRetained:true,appliedToPhysicalField:false},
    pressureMustBeRecomputed:true,slowTimeResidualRetained:'-epsilon partial_T delta',actualSourceMembershipVerified:false,completeN6Criterion:false};
}

function simpson(fn,a,b,n){const h=(b-a)/n;let s=fn(a)+fn(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*fn(a+i*h);return s*h/3;}
const bump=x=>x<=1||x>=1.1?0:Math.exp(-.01/((x-1)*(1.1-x)));
const moment=(p,n)=>simpson(x=>x**p*bump(x),1,1.1,n);

/** Actual five-equation matrix from Lemma8.7 on a normalized patch.
 * Returned numeric coefficients belong to the explicit finite parameters.
 * The pinned microscopic lambda is handled by symbolicMomentMap below. */
export function fiveMomentCorrection(input={}){
  const lambda=input.lambda??.2,a=input.a??1,d=input.d??.2,targets=input.targets??{P:.001,Jtheta:.0002,Jz:-.0004},n=input.quadratureIntervals??256;
  if(!finite(lambda)||lambda<=0||lambda>2||!finite(a)||a<=0||!finite(d)||d<=0||d>.5||!Number.isSafeInteger(n)||n<32||n>4096||n%2)fail('INVALID_INPUT','Use positive finite lambda,a,d and an even quadrature interval count 32..4096.');
  if(!targets||['P','Jtheta','Jz'].some(k=>!finite(targets[k])))fail('INVALID_INPUT','Three finite signed targets P,Jtheta,Jz are required.');
  const powers=[2,-2-2*lambda,-2*lambda,1,1-2*lambda],moments=powers.map(p=>moment(p,n)),fineMoments=powers.map(p=>moment(p,2*n));
  const nodes=powers.slice(0,3).map(p=>Math.exp(d*p)),rhs=[0,-targets.P/(2*a*moments[1]),targets.Jz/(a*moments[2])],u=[0,0,0];
  for(let i=0;i<3;i++){const others=[0,1,2].filter(j=>j!==i),[j,k]=others,den=(nodes[i]-nodes[j])*(nodes[i]-nodes[k]);u[2]+=rhs[i]/den;u[1]-=rhs[i]*(nodes[j]+nodes[k])/den;u[0]+=rhs[i]*nodes[j]*nodes[k]/den;}
  const axialRhs=-targets.Jtheta/(a*moments[4]),delta=-Math.expm1(-2*d*lambda),z1=-axialRhs/(Math.exp(d)*delta),z0=-Math.exp(d)*z1,z=[z0,z1];
  const profiles=(r,coefficients)=>sum(coefficients.map((v,j)=>v*Math.exp(-j*d)*bump(r/Math.exp(j*d))));
  const maxR=1.1*Math.exp(2*d),deltaV=r=>profiles(r,u),gammaD=r=>profiles(r,z),V=r=>a*r**(-1-2*lambda),integrate=fn=>simpson(fn,1,maxR,8*n);
  // Independent whole-radial quadrature, rather than reusing matrix multiplication.
  const measured=[integrate(r=>r*r*deltaV(r)),integrate(r=>r*gammaD(r)),integrate(r=>2*V(r)/r*deltaV(r)),integrate(r=>r*r*V(r)*gammaD(r)),integrate(r=>-r*V(r)*deltaV(r))];
  const expected=[0,0,-targets.P,-targets.Jtheta,-targets.Jz],errors=measured.map((v,i)=>Math.abs(v-expected[i])),normalization=Math.max(...Object.values(targets).map(Math.abs),1e-10);
  const nonlinear={Pnew:integrate(r=>deltaV(r)**2/r),JthetaNew:integrate(r=>r*r*gammaD(r)*deltaV(r)),JzNew:integrate(r=>r*gammaD(r)**2)-.5*integrate(r=>r*deltaV(r)**2)};
  const conditionWarning=1/delta>1e8,pass=Math.max(...errors)/normalization<2e-6&&!conditionWarning;
  return {schema:'MathScope.N6.FiveMomentCorrection/1',reference:'(8.24)-(8.27)',paper:NS_PAPER,
    parameterMode:'EXPLICIT_FINITE_NORMALIZED_PATCH',status:conditionWarning?'PRECISION_REQUIRED':pass?'FINITE_MOMENT_MAP_EXECUTED':'REFINEMENT_REQUIRED',
    input:{lambda,a,d,targets,quadratureIntervals:n},bump:{definition:'exp(-0.01/((x-1)(1.1-x))) on (1,1.1), otherwise zero',copies:'eta_j(x)=exp(-j*d) eta_0(x exp(-j*d))',supports:[0,1,2].map(j=>[Math.exp(j*d),1.1*Math.exp(j*d)])},
    powers,moments,momentRefinementErrors:moments.map((v,i)=>Math.abs(v-fineMoments[i])),angularCoefficients:u,axialCoefficients:z,
    axialScaledCoefficients:{scale:'1-exp(-2*d*lambda)',values:[axialRhs,-axialRhs/Math.exp(d)]},
    condition:{positiveAxialGap:delta,inverseGap:1/delta,lambdaUniform:false,conditionWarning,requiredPrecisionExplanation:'The axial inverse grows as lambda^-1. Fixed positive lambda is permitted; uniformity as lambda tends to zero is not asserted.'},
    rows:['angular momentum','axial flux','pressure defect','angular flux defect','axial flux defect'].map((name,i)=>({name,expected:expected[i],measured:measured[i],absoluteError:errors[i]})),
    normalizedFiveEquationError:Math.max(...errors)/normalization,pass,
    nonlinearRemainder:{scope:'Additional increment-only products. Old-mean and radial derivative terms must also be added for an actual state.',...nonlinear,notSetToZero:true},
    physicalNormalization:{azimuthal:'q^-A sum u_j eta_j(r/sqrt(q))',axial:'q^-A sum s_j eta_j(r/sqrt(q))',targetRows:['q^(2A) P_phys','q^(2A-3/2) Jtheta_phys','q^(2A-1) Jz_phys']},
    actualPinnedLambdaReplaced:false,appliedToPinnedPhysicalField:false,rigorousQuadratureEnclosure:false};
}

export function symbolicMomentMap(){
  return {schema:'MathScope.N6.SourceMomentMapSpecification/1',paper:NS_PAPER,reference:'Lemma8.7 and (8.24)-(8.25)',
    sourceProfile:'same-profile-2026-10-10.3',parameterExpressionSHA256:'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152',
    originalPositiveLambdaPreserved:true,actualMeanPatch:'X=X0Imean exp(y), 0<y<5',
    chosenProfiles:{x0:'sqrt(2 X0Imean)*exp(1/2)',d:'1/5',base:'eta0(x)=x0^-1 b(x/x0); b(s)=exp(-.01/((s-1)(11/10-s))) for 1<s<11/10',copies:'eta_j(x)=exp(-j/5) eta0(x exp(-j/5)), j=0,1,2',
      supportContainment:'log(X/X0Imean) in (1, 1+4/5+2 log(11/10)) subset (0,5)',supportMaximumLog:1+.8+2*Math.log(1.1),
      disjointness:'log(11/10)<1/5',disjoint:Math.log(1.1)<.2},
    moments:'mu_p=integral x^p eta0(x) dx > 0',
    a:'Kmean*(2 X0Imean)^(1/2+lambda)/(1+eta^2)',
    angular:{powers:['2','-2-2lambda','-2lambda'],nodes:['exp(2d)','exp((-2-2lambda)d)','exp(-2lambda d)'],
      rowDivisors:['mu_2','2 a mu_-2-2lambda','-a mu_-2lambda'],rowTargets:['0','-Pq','-Jzq'],
      inverse:'For r_i=target_i/rowDivisor_i, u_2=sum_i r_i/((z_i-z_j)(z_i-z_k)); u_1=-sum_i r_i(z_j+z_k)/den_i; u_0=sum_i r_i z_j z_k/den_i.',
      determinantNonzeroReason:'All mu are positive, a>0, and powers 2 > -2lambda > -2-2lambda are distinct for lambda>0.'},
    axial:{powers:['1','1-2lambda'],rowDivisors:['mu_1','a mu_1-2lambda'],r:'-Jthetaq/(a mu_1-2lambda)',
      delta:'1-exp(-2d lambda)>0',scaledCoefficients:['delta*s0=r','delta*s1=-r exp(-d)'],
      twoRowVerification:['delta*(s0+exp(d)*s1)=0','delta*(s0+exp(d-2d lambda)*s1)=r*delta'],
      condition:'For 0<2d lambda<=1: d lambda <= delta <= 2d lambda; 1/delta <= 1/(d lambda).',sourceDeltaRoundedToZero:false},
    evidenceLevel:'SOURCE_BOUND_EXPLICIT_CONSTRUCTION_WITH_SYMBOLIC_POSITIVE_FACTORS',
    currentDefectsApplied:false,sourceDerivativeBoundsInstantiated:false,completeN6Criterion:false,
    remaining:['Bind P,Jtheta,Jz from the same updated full-curl state.','Evaluate or enclose the positive source-scaled moments and target ratios.','Realize gamma with T1 and recompute all (8.3), (8.12), (8.15) quantities.']};
}

export function signedCovarianceIncrement(input={}){
  const H=input.H??[[2,.3],[.4,1.5]],a=input.amplitudes??[.8,1.2],epsilon=input.epsilon??.01,Sigma=input.target??[-.003,.002];
  if(!Array.isArray(H)||H.length!==2||H.some(r=>!Array.isArray(r)||r.length!==2||r.some(x=>!finite(x)))||!Array.isArray(a)||a.length!==2||a.some(x=>!finite(x)||x<=0)||!finite(epsilon)||epsilon<=0||!Array.isArray(Sigma)||Sigma.length!==2||Sigma.some(x=>!finite(x)))fail('INVALID_INPUT','A signed covariance update needs a finite 2x2 H, fixed positive amplitudes and epsilon.');
  const det=H[0][0]*H[1][1]-H[0][1]*H[1][0],size=Math.max(...H.flat().map(Math.abs));
  if(Math.abs(det)<=Number.EPSILON*size*size*16)fail('COVARIANCE_PRECISION','The determinant is unresolved at binary64 precision.');
  const b=Sigma.map(x=>x/epsilon),y=[(H[1][1]*b[0]-H[0][1]*b[1])/det,(H[0][0]*b[1]-H[1][0]*b[0])/det],delta=y.map((x,i)=>x/(2*a[i])),cross=H.map(row=>epsilon*sum(row.map((x,i)=>2*x*a[i]*delta[i]))),square=H.map(row=>epsilon*sum(row.map((x,i)=>x*delta[i]**2)));
  return {schema:'MathScope.N6.SignedCovarianceIncrement/1',paper:NS_PAPER,reference:'(7.31), (7.41), (9.13)',status:'FINITE_SIGNED_INVERSE_EXECUTED',H,amplitudes:[...a],epsilon,target:Sigma,determinant:det,deltaAmplitude:delta,crossCovariance:cross,squareCovariance:square,
    maxLinearError:Math.max(...cross.map((x,i)=>Math.abs(x-Sigma[i]))),fixedAmplitudesReselected:false,
    remainingRemainders:['B(oldWave-fixedPrimary,transverseIncrement)','B(oldWave,curlIncrementRemainder)','C(fullIncrement)'],
    fullIncrementSquareDiscarded:false,targetMembershipVerified:false,physicalCorrectionApplied:false,
    sourceMeaning:'H must already contain the angular factor 1/2 and normalized Haar/cutoff weights; this finite input is not automatically the pinned source H.'};
}

/** Exact decimal rational exponent bookkeeping from Proposition9.6.
 * This checks implications between class exponents; class membership and
 * derivative constants are separate obligations. */
export function correctionOrderLedger(stage=0){
  if(!Number.isInteger(stage)||stage<0||stage>1000)fail('INVALID_STAGE','A finite correction stage 0..1000 is required.');
  const denom=100000,k=1,sigma=20000+10000*stage,B=50000+sigma,C=100000+sigma,H=C-2*k;
  const groups={waveParticular:[B+50000-3*k,B+50000-k,2*B-k,B+40000],waveSigned:[B+50000-4*k,B+40000-k,B+50000-2*k,2*B-3*k],waveMean:[H],tangentialMean:[C+17000,H+100000-2*k],defects:[C+90000-4*k]};
  const rows=Object.entries(groups).map(([name,values])=>{const target=name.startsWith('wave')?B+10000:C+10000;return {name,numerators:values,denominator:denom,values:values.map(v=>v/denom),minimum:Math.min(...values)/denom,target:target/denom,margin:(Math.min(...values)-target)/denom,pass:Math.min(...values)>target};});
  return {schema:'MathScope.N6.CorrectionOrderLedger/1',reference:'Definition9.4, Proposition9.6, Lemmas9.7-9.8',stage,
    sigma:{numerator:sigma,denominator:denom},B:B/denom,C:C/denom,H:H/denom,nextB:(B+10000)/denom,nextC:(C+10000)/denom,rows,pass:rows.every(r=>r.pass),
    commonDomain:'the same 0<q<qbig, qbig<=qstar fixed before stage0',classMembershipVerified:false,
    physicalGain:`h*${stage}/10`,physicalDerivativeLoss:'ell_m=2A+(m+1)(1+3h/2)',
    constants:'C_(j,m), K_m, P_(j,m), flat-tail C_(j,m,N) are required; exponent arithmetic alone supplies none.',
    observedResidualDecrease:null,finiteStateConstructed:false};
}

export function harmonicLedger(input={}){
  const harmonics=input.harmonics??[-1,1],maxRetained=input.maxRetained??Math.max(...harmonics.map(Math.abs))*2;
  if(!Array.isArray(harmonics)||harmonics.length>512||harmonics.some(x=>!Number.isSafeInteger(x)||x===0)||!Number.isInteger(maxRetained)||maxRetained<1)fail('INVALID_HARMONICS','Use a finite nonzero harmonic set.');
  const unique=[...new Set(harmonics)].sort((a,b)=>a-b);if(unique.some(m=>!unique.includes(-m)))fail('CONJUGATE_PAIR_MISSING','Real waves require conjugate harmonics.');
  const products=[];for(const m of unique)for(const n of unique)products.push({left:m,right:n,generated:m+n});
  const generated=[...new Set(products.map(x=>x.generated))].sort((a,b)=>a-b),discarded=generated.filter(m=>Math.abs(m)>maxRetained);
  return {schema:'MathScope.N6.HarmonicLedger/1',input:unique,products,generated,angularMean:generated.includes(0),
    nonzero:generated.filter(x=>x!==0),retained:generated.filter(m=>Math.abs(m)<=maxRetained),discarded,
    maximumInput:Math.max(...unique.map(Math.abs)),maximumGenerated:Math.max(...generated.map(Math.abs)),
    status:discarded.length?'DISCARDED_MODE_BOUND_REQUIRED':'COMPLETE_FINITE_PRODUCT_SET',discardedModeBound:discarded.length?null:0,
    sameLabelProductsRetained:true,differentLabelProductsMayVanishOnlyWithSupportCertificate:true};
}

/** The projected inhomogeneous equation (7.13) on an explicit finite
 * piecewise-linear coefficient model. n' is derived from that same model.
 * This operation does not supply the missing source smooth-extension bound. */
export function harmonicResponse(input={}){
  const m=input.harmonic??1,carrier=input.carrier??3,steps=input.steps??256;
  const samples=input.samples??Array.from({length:9},(_,j)=>{const v=j/8;return {v,normal:[1,.2*v,1],K:[[0,-.4,0],[.7,0,0],[0,0,0]],damping:.1,source:[0,0,Math.sin(Math.PI*v)**2,0,0,0]};});
  if(!Number.isInteger(m)||m===0||Math.abs(m)>64||!finite(carrier)||carrier<=0||!Number.isInteger(steps)||steps<16||steps>8192||!Array.isArray(samples)||samples.length<2||samples.length>1024)fail('INVALID_INPUT','Use a nonzero integer harmonic, positive carrier and finite sampled coefficients.');
  for(let j=0;j<samples.length;j++){const s=samples[j];if(!finite(s.v)||(j>0&&s.v<=samples[j-1].v)||!Array.isArray(s.normal)||s.normal.length!==3||s.normal.some(x=>!finite(x))||!Array.isArray(s.K)||s.K.length!==3||s.K.some(r=>!Array.isArray(r)||r.length!==3||r.some(x=>!finite(x)))||!finite(s.damping)||s.damping<0||!Array.isArray(s.source)||s.source.length!==6||s.source.some(x=>!finite(x)))fail('INVALID_SAMPLES','Each sample needs increasing v, a nonzero normal, a real 3x3 K, nonnegative damping and a complex 3-vector source.');}
  if(samples[0].v!==0)fail('INITIAL_PATH','The sampled pulse path must start at v=0.');
  const coefficients=v=>{let j=0;while(j+2<samples.length&&v>samples[j+1].v)j++;const a=samples[j],b=samples[j+1],h=b.v-a.v,s=Math.max(0,Math.min(1,(v-a.v)/h)),lerp=(x,y)=>x+(y-x)*s,
    n=a.normal.map((x,i)=>lerp(x,b.normal[i])),np=a.normal.map((x,i)=>(b.normal[i]-x)/h),K=a.K.map((r,i)=>r.map((x,k)=>lerp(x,b.K[i][k]))),f=a.source.map((x,i)=>lerp(x,b.source[i])),d=lerp(a.damping,b.damping),n2=sum(n.map(x=>x*x));
    if(n2<1e-12)fail('NORMAL_DENOMINATOR','The sampled phase normal must stay nonzero.');return {n,np,K,f,d,n2};};
  const rhs=(v,t)=>{const {n,np,K,f,d,n2}=coefficients(v),out=Array(6).fill(0);for(let c=0;c<2;c++){
    const tt=[t[c],t[2+c],t[4+c]],ff=[f[c],f[2+c],f[4+c]],kt=K.map(r=>sum(r.map((x,i)=>x*tt[i]))),normalPart=(sum(n.map((x,i)=>x*kt[i]))-sum(np.map((x,i)=>x*tt[i])))/n2,nf=sum(n.map((x,i)=>x*ff[i]))/n2;
    for(let i=0;i<3;i++)out[2*i+c]=-kt[i]+n[i]*normalPart-m*m*d*tt[i]-ff[i]+n[i]*nf;
  }return out;};
  const run=count=>{let t=Array(6).fill(0),v=0;const end=samples.at(-1).v,dt=end/count,rows=[];for(let j=0;j<=count;j++){
    const C=coefficients(v),{n,np,K,f,n2}=C,normalError=Math.max(...[0,1].map(c=>Math.abs(sum(n.map((x,i)=>x*t[2*i+c]))))),pressure=[0,0],potential=Array(6).fill(0);
    for(let c=0;c<2;c++){const tt=[t[c],t[2+c],t[4+c]],kt=K.map(r=>sum(r.map((x,i)=>x*tt[i]))),num=sum(n.map((x,i)=>x*kt[i]))-sum(np.map((x,i)=>x*tt[i]))+sum(n.map((x,i)=>x*f[2*i+c]));pressure[1-c]+=(c===0?1:-1)*num/(carrier*m*n2);
      const cross=[n[1]*tt[2]-n[2]*tt[1],n[2]*tt[0]-n[0]*tt[2],n[0]*tt[1]-n[1]*tt[0]];for(let i=0;i<3;i++)potential[2*i+1-c]=(c===0?1:-1)*cross[i]/(carrier*m*n2);}
    rows.push({v,amplitude:[...t],norm:Math.sqrt(sum(t.map(x=>x*x))),normalError,pressure,potential});if(j===count)break;
    const add=(x,y,s)=>x.map((q,i)=>q+s*y[i]),k1=rhs(v,t),k2=rhs(v+dt/2,add(t,k1,dt/2)),k3=rhs(v+dt/2,add(t,k2,dt/2)),k4=rhs(v+dt,add(t,k3,dt));
    t=t.map((x,i)=>x+dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);v=(j+1)*dt;
  }return rows;};
  const rows=run(steps),fine=run(steps*2),refinementError=Math.sqrt(sum(rows.at(-1).amplitude.map((x,i)=>(x-fine.at(-1).amplitude[i])**2)));
  return {schema:'MathScope.N6.HarmonicResponse/1',paper:NS_PAPER,reference:'(7.13), Proposition7.2, Proposition9.6 step1',
    status:'FINITE_SAMPLED_AMPLITUDE_MODEL_EXECUTED',input:{harmonic:m,carrier,steps,samples},rows,
    refinement:{steps:steps*2,endpointDifference:refinementError,rigorousErrorBound:false},maximumNormalError:Math.max(...rows.map(r=>r.normalError)),
    zeroInitialData:true,normalDerivativeFromSameInterpolation:true,pressureRecovered:true,sourceProfileMemberVerified:false,
    sourceSupportedPotentialFormula:'psi(v) * i(n cross t)/(k*m*|n|^2) * exp(i*k*m*Phi)',fullPhysicalCurlApplied:false,
    missing:['Smooth source with complete slow and transverse derivative bounds.','Actual same-source phase/carrier and supported physical curl derivatives.','Temporal cutoff commutators and all new PDE products.']};
}

export function correctionAcceptance(){
  const modes=[{k:[1,0],coefficient:[.3,.2]},{k:[-1,0],coefficient:[.3,-.2]},{k:[12,-5],coefficient:[.02,.01]},{k:[-12,5],coefficient:[.02,-.01]}],temporal=temporalMeanInverse({modes,c:.7,completeFinitePolynomial:true}),moments=fiveMomentCorrection(),orders=[0,1,10].map(correctionOrderLedger),harmonics=harmonicLedger(),truncated=harmonicLedger({maxRetained:1}),signed=signedCovarianceIncrement();
  const response=harmonicResponse({harmonic:2,steps:64,samples:[0,1].map(v=>({v,normal:[0,0,1],K:[[0,0,0],[0,0,0],[0,0,0]],damping:.2,source:[1,0,0,0,0,0]}))}),responseExact=-(-Math.expm1(-.8))/.8,responseError=Math.abs(response.rows.at(-1).amplitude[0]-responseExact);
  let zeroRejected=false;try{temporalMeanInverse({modes:[{k:[0,0],coefficient:[1,0]}]});}catch(e){zeroRejected=e.code==='NONZERO_AUXILIARY_MEAN';}
  const symbolic=symbolicMomentMap(),checks=[{id:'N6-05-zero-mean-Fourier-cancellation',pass:temporal.maxCancellationError<1e-12},
    {id:'N6-03-projected-response-versus-exact-ODE',pass:responseError<1e-9&&response.maximumNormalError<1e-12},
    {id:'N6-04-signed-target-fixed-amplitudes-square-kept',pass:signed.maxLinearError<1e-12&&signed.squareCovariance.some(x=>x!==0)&&!signed.fixedAmplitudesReselected},
    {id:'N6-05-nonzero-mean-mutation',pass:zeroRejected},{id:'N6-06-five-independent-radial-integrals',pass:moments.pass},
    {id:'N6-06-source-patch-disjoint-bumps',pass:symbolic.chosenProfiles.disjoint&&symbolic.chosenProfiles.supportMaximumLog<5},
    {id:'N6-07-exact-rational-order-margins',pass:orders.every(x=>x.pass)},
    {id:'N6-03-generated-harmonics-retained',pass:harmonics.generated.includes(2)&&harmonics.generated.includes(-2)&&harmonics.angularMean},
    {id:'N6-03-truncation-without-bound-held',pass:truncated.status==='DISCARDED_MODE_BOUND_REQUIRED'&&truncated.discardedModeBound===null}];
  return {schema:'MathScope.N6.CorrectionAcceptance/1',checks,pass:checks.every(x=>x.pass),temporal,moments,orders,harmonics,symbolic,signed,response:{...response,exactEndpoint:responseExact,endpointError:responseError},actualFiniteStateConstructed:false,
    scope:'Executed finite operations and explicit source-bound construction. Initialization, four-stage source iteration, and local-field synthesis remain separate obligations.'};
}

export function cloneCorrectionInput(x){return clone(x);}
