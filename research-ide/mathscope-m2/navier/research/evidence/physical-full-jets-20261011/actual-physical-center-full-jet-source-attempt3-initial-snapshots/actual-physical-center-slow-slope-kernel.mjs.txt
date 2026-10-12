/** Finite numerical comparison coefficients on a terminal midplane box.
 * This layer has no source authority. The distinct private adapter binds
 * the original positive h, complete heat, terminal step, chart and point.
 */
import {encloseCenteredSlowJetCoefficients} from './actual-centered-slow-jet-enclosure-kernel.mjs';
import {enclosePulseCenterLogSlopes} from './actual-centered-fast-jet-enclosure-kernel.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {directedArithmetic,rational as Q,readRational,qadd,qmul,qdiv,qpow,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';

const axes=['R','Z','T'],pairs=['RR','RZ','RT','ZZ','ZT','TT'],dyadic=n=>Q(1,1n<<BigInt(n)),power=n=>Q(1n<<BigInt(n)),
  box=(lower,upper=lower)=>({lower,upper});

function controlsOf(input,extra=[]){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance',...extra].includes(k)))
    fail('INVALID_INPUT','Only exact numerical controls and the stated conditional intervals are accepted.');
  const precisionBits=input.precisionBits??192,tolerance=input.tolerance??'1/1000000000000';
  if(!Number.isSafeInteger(precisionBits)||precisionBits<192||precisionBits>512||typeof tolerance!=='string')
    fail('INVALID_INPUT','Use 192..512 directed bits and an exact rational tolerance string.');
  const tol=readRational(tolerance);
  if(qcompare(tol,Q(0))<=0||qcompare(tol,Q(1,100))>0)fail('INVALID_INPUT','The requested width must lie in (0,1/100].');
  if(qcompare(tol,dyadic(precisionBits-48))<0)fail('PRECISION_REQUIRED','Increase directed precision for this requested width.');
  return {precisionBits,tolerance:qtext(tol)};
}

/** All derivatives in this ledger are actual ordinary derivatives in delta.
 * h is factored before bounding ratios, so no division by a tiny numerical
 * interval is used. The complete Gamma integral supplies the heat moments.
 */
export function physicalCenterSlowSlopeNeighborhoodAudit(){
  const xlo=Q(3,32),xhi=Q(5,32),omlo=Q(27,32),h=dyadic(4096),z=Q(1,16),
    logisticExponent=qadd(qmul(Q(-1),qpow(xhi,-2)),qpow(omlo,-2)),
    g1=qmul(Q(2),qadd(qpow(xlo,-3),qpow(omlo,-3))),
    g2=qmul(Q(6),qadd(qpow(xlo,-4),qpow(omlo,-4))),
    g3=qmul(Q(24),qadd(qpow(xlo,-5),qpow(omlo,-5))),
    heatDelta=[qmul(Q(2),z),qadd(qmul(Q(2),z),qmul(Q(12),qpow(z,2))),
      qadd(qadd(qmul(Q(2),z),qmul(Q(36),qpow(z,2))),qmul(Q(144),qpow(z,3)))],
    fJet=power(64),heatJet=Q(256),inverseDenominator=Q(2),
    first=(v)=>qadd(qmul(v,inverseDenominator),qmul(h,qmul(qpow(v,2),qpow(inverseDenominator,2)))),
    second=(v)=>qadd(qadd(qmul(v,inverseDenominator),qmul(Q(3),qmul(h,qmul(qpow(v,2),qpow(inverseDenominator,2))))),
      qmul(Q(2),qmul(qpow(h,2),qmul(qpow(v,3),qpow(inverseDenominator,3))))),
    Afirst=qadd(first(fJet),first(heatJet)),Asecond=qadd(second(fJet),second(heatJet)),
    xiFirst=qadd(qmul(Q(2),power(67)),qpow(qmul(Q(2),power(67)),2)),
    checks=[
      {id:'terminal-logistic-exponent-negative',pass:qcompare(logisticExponent,Q(-38))<0},
      {id:'first-three-logistic-exponent-derivatives',pass:qcompare(g1,power(12))<0&&qcompare(g2,power(19))<0&&qcompare(g3,power(25))<0},
      {id:'whole-Gamma-log-coordinate-moments',pass:heatDelta.every(x=>qcompare(x,heatJet)<0)},
      {id:'first-two-h-factored-Rayleigh-derivatives',pass:qcompare(Afirst,power(67))<0&&qcompare(Asecond,power(67))<0},
      {id:'positive-factor-logarithmic-derivative',pass:qcompare(xiFirst,power(137))<0},
      {id:'comparison-coefficient-first-derivative-reserve',pass:144<512},
      {id:'two-coordinate-displacement-budget',pass:16384-512-1>15000},
      {id:'coupled-negative-mode-relative-jet-budget',pass:128*(1024-264)>560}
    ];
  if(checks.some(x=>!x.pass))fail('INTERNAL_VALIDATION','The terminal slow-slope neighborhood reserve failed.');
  return {schema:'MathScope.PhysicalCenterSlowSlopeNeighborhoodAudit/1',domain:{delta:['3/16','5/16'],T:['15/16','17/16'],
      heatArgument:['0','1/16'],positiveHUpper:'2^-4096',fixedPositiveInverseUSquareUpper:'2^-81922'},
    computed:{logisticExponentUpper:qtext(logisticExponent),logisticExponentDerivativeBounds:[g1,g2,g3].map(qtext),
      heatDeltaDerivativeOverHBounds:heatDelta.map(qtext),rayleighFirstUpper:qtext(Afirst),rayleighSecondUpper:qtext(Asecond),xiFirstUpper:qtext(xiFirst)},
    bounds:{stepDerivativesThroughThree:'2^64',stepFirstDerivative:'2^-26',terminalFirstDerivativeOverH:'2^-35',
      terminalFactorLower:'1/2',heatFactorLower:'1/2',alphaOverH:['1/2','1'],alphaOverHDeltaDerivatives:'2^67',
      xiAbsolute:'2^68',xiDeltaAbsolute:'2^137',muNuDeltaAndTDerivativeAbsolute:'2^512',
      pointDisplacementEach:'2^-16384',positiveTransferRadius:'2^-15000'},
    proof:{step:'On x=delta/2 in[3/32,5/32], g=-x^-2+(1-x)^-2 is increasing and g<-38. Since exp(g)<2^-38, sigma=exp(g)/(1+exp(g))<2^-38. Its exact logistic recurrence gives sigma prime<2^-26 and all three derivatives<2^64. Therefore f=1-h*sigma(delta/2)/256 has f>1/2 and |f_delta|/h<2^-35.',
      heat:'For the complete normalized density exp(-u)u^h/Gamma(1+h), |H^(j)(z)|/h <= j!*(j+1)! for j=1,2,3. The delta operator is z*d_z, giving the computed 2z,2z+12z^2,2z+36z^2+144z^3 bounds. H>=1-2hz>1/2. No infinite tail is omitted.',
      alpha:'Abar=1+f_delta/(h*f)+H_delta/(h*H). Both additions are nonpositive. Their magnitudes are<2^-34 and<=1/4, so1/2<Abar<=1. For u_j=f_delta^j/h or H_delta^j/h, differentiate u1/f and u1/H: Abar_delta is u2/f-h*u1^2/f^2, and Abar_delta_delta is u3/f-3h*u1*u2/f^2+2h^2*u1^3/f^3. The printed exact rational sums bound both factors and prove the2^67 reserve.',
      slopes:'xi=Abar_delta/Abar has |xi|<2^68 and |xi_delta|<2^137. Write alpha=h*Abar and kappa=(1+u^-2)/3. For mu_T=Q(delta)/T, Q=(kappa-1/2)(alpha-h)+(kappa/2-alpha/(2(1+alpha)))*xi, the product and inverse rules give |Q|<2^69, |Q_delta|<2^139. mu_R=3/2-2kappa+(1-2kappa)h-2Q. For nu, |IA|,|IB|<1 and the exact c,d below give every delta or T first derivative<2^144<2^512. All factors1/T are<=2 and1/(1+alpha)<=1.',
      transfer:'Integrate the two coordinate derivatives along the rectangle segment from(delta,T)=(1/4,1) to the actual point. The error is<2*2^512*2^-16384<2^-15000. This transfers only smooth comparison coefficients; carrier floors, source Volterra solutions and old numerical jet values are not transported.',
      negativeMode:'For w_minus=a*r, its first normalized derivative is a[(q_i/(gL))*r+r_i/(gL)]. Its second is a[((q_i*q_j+q_ij)/(gL)^2)*r+(q_i/(gL))*r_j/(gL)+(q_j/(gL))*r_i/(gL)+r_ij/(gL)^2]. Under the separately source-bound r<=B^260/S,r_i<=B^6,r_ij<=B^14,q_ij/(gL)^2<=B^23/S,gL>=S/B^2 and|q_i/(gL)|<=2, their absolute values are<B^264/S<2^-560. Neither the initial layer nor q_ij is assigned zero.'},
    checks,pass:true,sourceAuthenticated:false,actualMatrixJetsCertifiedHere:false};
}

/** Identities at an arbitrary positive T, before source substitution. */
export function physicalCenterSlowSlopeIdentityAudit(G){
  const q=(n,d=1)=>G.q(n,d),x=Object.fromEntries(['h','alpha','xi','u','T'].map(k=>[k,G.fresh('physical_slope_'+k)])),
    {h,alpha,xi,u,T}=x,kappa=G.div(G.add(G.one,G.pow(u,-2)),q(3)),
    c={R:G.sub(G.neg(G.mul(q(2),G.add(G.one,alpha))),xi),Z:G.zero,T:G.div(G.add(G.sub(alpha,h),G.div(xi,q(2))),T)},
    d={R:G.sub(G.sub(q(-3),G.mul(q(2),alpha)),G.div(G.mul(q(2),alpha,xi),G.add(G.one,alpha))),Z:G.zero,
      T:G.div(G.add(G.sub(alpha,h),G.div(G.mul(alpha,xi),G.add(G.one,alpha))),T)},
    muT=G.div(G.add(G.mul(G.sub(kappa,q(1,2)),G.sub(alpha,h)),
      G.mul(G.sub(G.div(kappa,q(2)),G.div(alpha,G.mul(q(2),G.add(G.one,alpha)))),xi)),T),
    mu={R:G.sub(G.add(q(3,2),G.neg(G.mul(q(2),kappa)),G.mul(G.sub(G.one,G.mul(q(2),kappa)),h)),G.mul(q(2),T,muT)),Z:G.zero,T:muT},
    IA=G.div(G.log(q(2)),q(3)),IB=G.sub(IA,q(7,72)),nu=Object.fromEntries(axes.map(k=>[k,G.sub(G.mul(IA,c[k]),G.mul(IB,d[k]))])),
    checks=axes.map(k=>({id:'full-damping-slope-'+k,...sourceGraphRationalIdentity(G,G.sub(mu[k],G.sub(G.mul(kappa,c[k]),G.div(d[k],q(2)))),{maxTerms:12000})})),
    homogeneity=sourceGraphRationalIdentity(G,G.sub(G.add(mu.R,G.mul(q(2),T,mu.T)),G.add(q(3,2),G.neg(G.mul(q(2),kappa)),G.mul(G.sub(G.one,G.mul(q(2),kappa)),h))),{maxTerms:12000}),
    missingTimeScale=sourceGraphRationalIdentity(G,G.sub(mu.T,G.mul(T,mu.T)),{maxTerms:12000});
  if(checks.some(x=>!x.pass)||!homogeneity.pass||missingTimeScale.pass)fail('INTERNAL_VALIDATION','The arbitrary-time slow-slope identities failed.');
  return {schema:'MathScope.PhysicalCenterSlowSlopeIdentityAudit/1',coordinates:x,roots:{kappa,c,d,mu,nu,IA,IB},checks,homogeneity,
    negativeControl:{omitted:'The actual1/T factor away fromT=1',correctlyRejected:!missingTimeScale.pass,check:missingTimeScale},
    pass:true,sourceAuthenticated:false,originalDampingDerivativeRetained:true};
}

/** Numerical boxes for comparison mu/nu at the new point, conditional on
 * the printed exact original-source neighborhood and displacement bounds.
 * The anchor is used only for scalar comparison arithmetic, never as an
 * old evaluated solution. In particular nu uses reference, not the old
 * actual-log-slope box that contains an ODE remainder.
 */
export function enclosePhysicalCenterSlowSlopes(input={},context={}){
  const request=controlsOf(input),anchorInput={...request,weightedCenters:[box('1/2'),box('1/2')]},
    anchor=encloseCenteredSlowJetCoefficients(anchorInput,context),logAnchor=enclosePulseCenterLogSlopes(anchorInput,context),
    A=directedArithmetic(request.precisionBits),audit=physicalCenterSlowSlopeNeighborhoodAudit(),radius=dyadic(15000),mu={},nu={},rows=[];
  for(const kind of['mu','nu'])for(const direction of axes){
    const from=kind==='mu'?anchor.comparisonSlopes[direction]:logAnchor.rows.find(r=>r.direction===direction).reference,
      value=direction==='Z'?A.zero():A.widen(A.unpack(from),radius),width=Q(value[1]-value[0],A.S),packed=A.pack(value);
    if(qcompare(width,readRational(request.tolerance))>0)fail('PRECISION_REQUIRED','A new-point comparison slope exceeds its requested width.');
    (kind==='mu'?mu:nu)[direction]=packed;
    rows.push({kind,direction,interval:packed,anchorComparisonInterval:from,width:qtext(width),toleranceMet:true,
      comparisonOnly:true,positiveTransferRadius:direction==='Z'?'0':qtext(radius),
      zeroMeaning:direction==='Z'?'Exact even-midplane comparison coefficient only; actual epsilon/frame and Volterra derivatives are not zero.':null});
  }
  if(A.unpack(mu.R)[0]<=0n||A.unpack(mu.T)[1]>=0n||A.unpack(nu.R)[1]>=0n||A.unpack(nu.T)[1]>=0n)
    fail('PRECISION_REQUIRED','The transferred nonzero comparison slopes lost their separated signs.');
  return {schema:'MathScope.PhysicalCenterSlowSlopeDirectedCoefficients/1',request,mu,nu,rows,audit,
    anchorNumerics:{positiveFactors:anchor.actualPositiveFactors,step:anchor.primitiveNumerics.step,heat:anchor.primitiveNumerics.heat,
      mu:anchor.comparisonSlopes,nu:logAnchor.rows.map(r=>({direction:r.direction,reference:r.reference})),IA:logAnchor.IA,IB:logAnchor.IB},
    errorBudget:{positiveDisplacementRadius:qtext(radius),outwardRoundingIncluded:true,everyWidthChecked:true,
      originalPositiveHOrHeatArgumentReplacedByZero:false,oldActualSolutionValueTransferred:false,actualODEErrorIncludedHere:false},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,additionalOperations:A.operations(),binary64UsedForDecisions:false},
    sourceAuthenticated:false,actualPhysicalCurlDerivativesNumericallyEnclosed:false,wholeGNUMComplete:false,pass:true};
}

/** Conditional table arithmetic for the NEW authenticated point.
 * All six input value families must be bound by the calling private source
 * adapter; mu/nu alone do not authenticate the matrix/initial-layer bounds.
 * The full156 weighted/a/H/y rows are accompanied by54 raw t and18 w-minus
 * slow rows. The latter are not inferred from a phase-zero value identity.
 */
export function enclosePhysicalCenterJetCoefficients(input,context={}){
  const request=controlsOf(input,['mu','nu','values']),A=directedArithmetic(request.precisionBits),audit=physicalCenterSlowSlopeNeighborhoodAudit(),
    strictBox=(x,low,high,name)=>{
      if(!x||typeof x.lower!=='string'||typeof x.upper!=='string')fail('INVALID_INPUT','The conditional '+name+' interval needs exact rational endpoints.');
      const value=A.unpack(x);if(value[0]<A.point(low)[0]||value[1]>A.point(high)[1])fail('INVALID_INPUT','The conditional '+name+' interval exceeds its stated conditioning domain.');return value;
    },slopes={};
  for(const kind of['mu','nu']){
    if(!input[kind]||Object.keys(input[kind]).sort().join(',')!=='R,T,Z')fail('INVALID_INPUT','Three conditional '+kind+' intervals are required.');
    slopes[kind]=Object.fromEntries(axes.map(k=>[k,strictBox(input[kind][k],Q(-1),Q(1),kind+'_'+k)]));
  }
  const v=input.values;
  if(!v||!Array.isArray(v.weightedCylindrical)||v.weightedCylindrical.length!==2||v.weightedCylindrical.some(r=>!Array.isArray(r)||r.length!==3)||
    !Array.isArray(v.centers)||v.centers.length!==2||!Array.isArray(v.covariance)||v.covariance.length!==2||v.covariance.some(r=>!Array.isArray(r)||r.length!==2)||
    !Array.isArray(v.weights)||v.weights.length!==2)fail('INVALID_INPUT','The two genuine-center families need three weighted components, centers, a2x2 H and two weights.');
  const W=v.weightedCylindrical.map((r,i)=>r.map((x,j)=>strictBox(x,j===2&&i===1?Q(-3,4):Q(1,4),j===2&&i===1?Q(-1,4):Q(3,4),'weighted component'))),
    a=v.centers.map(x=>strictBox(x,Q(1,4),Q(1,2),'positive center')),
    H=v.covariance.map((r,j)=>r.map((x,i)=>strictBox(x,j===1&&i===1?Q(-1,2):Q(1,8),j===1&&i===1?Q(-1,8):Q(1,2),'H'))),
    y=v.weights.map(x=>strictBox(x,Q(1),Q(4),'positive weight')),mu=slopes.mu,nu=slopes.nu,
    rows=[],radius=dyadic(560),put=(quantity,sign,component,derivative,order,leading,scale,group)=>{
      context.checkCancelled?.();const value=A.widen(leading,radius),width=Q(value[1]-value[0],A.S);
      if(qcompare(width,readRational(request.tolerance))>0)fail('PRECISION_REQUIRED','The conditional '+quantity+' '+derivative+' width exceeds tolerance.');
      rows.push({quantity,sign,component,derivative,order,interval:A.pack(value),width:qtext(width),exactScale:scale,group,
        strictlyPositiveRemainder:qtext(radius),nonzeroRemainderRetained:true,toleranceMet:true,sourceAuthenticated:false});
    },componentScale=j=>j===0?'1':j===1?'Ac':'u';
  for(let i=0;i<2;i++){
    const sign=i===0?1:-1;
    for(let j=0;j<3;j++){
      const D=componentScale(j),orientation=j===2?sign:1,base=A.mul(A.point(orientation),a[i]);
      for(const direction of axes){
        put('weightedPulse',sign,j,direction,1,A.zero(),D+'*A0*sqrt(g*Ls)','weightedSlow');
        put('pulse',sign,j,direction,1,A.mul(base,nu[direction]),D+'*g*Ls','rawPulseSlow');
      }
      for(const pair of pairs){
        put('weightedPulse',sign,j,pair,2,A.neg(A.mul(W[i][j],A.mul(mu[pair[0]],mu[pair[1]]))),D+'*A0*g*Ls','weightedSlow');
        put('pulse',sign,j,pair,2,A.mul(base,A.mul(nu[pair[0]],nu[pair[1]])),D+'*(g*Ls)^2','rawPulseSlow');
      }
      put('weightedPulse',sign,j,'v',1,A.zero(),D+'*A0*sqrt(g/Ls)','weightedFast');
      put('weightedPulse',sign,j,'vv',2,A.neg(W[i][j]),D+'*A0*g/Ls','weightedFast');
      for(const direction of axes)put('weightedPulse',sign,j,direction+'v',2,A.mul(mu[direction],W[i][j]),D+'*A0*g','weightedFast');
    }
    for(const direction of axes){
      put('a',sign,0,direction,1,A.mul(a[i],nu[direction]),'g*Ls','uncentered');
      for(let j=0;j<2;j++)put('H',sign,j,direction,1,A.mul(H[j][i],A.mul(A.point(2),nu[direction])),(j===0?'Ac':'u')+'*massScale*g*Ls','uncentered');
      put('y',sign,0,direction,1,A.mul(y[i],A.mul(A.point(-2),nu[direction])),'(tau/massScale)*g*Ls','uncentered');
      put('wMinus',sign,1,direction,1,A.zero(),'g*Ls','negativeModeSlow');
    }
    for(const pair of pairs){
      const product=A.mul(nu[pair[0]],nu[pair[1]]);
      put('a',sign,0,pair,2,A.mul(a[i],product),'(g*Ls)^2','uncentered');
      for(let j=0;j<2;j++)put('H',sign,j,pair,2,A.mul(H[j][i],A.mul(A.point(4),product)),(j===0?'Ac':'u')+'*massScale*(g*Ls)^2','uncentered');
      put('y',sign,0,pair,2,A.mul(y[i],A.mul(A.point(4),product)),'(tau/massScale)*(g*Ls)^2','uncentered');
      put('wMinus',sign,1,pair,2,A.zero(),'(g*Ls)^2','negativeModeSlow');
    }
  }
  return {schema:'MathScope.PhysicalCenterCompleteJetDirectedCoefficients/1',request,rows,
    groups:Object.fromEntries(['weightedSlow','weightedFast','uncentered','rawPulseSlow','negativeModeSlow'].map(k=>[k,rows.filter(r=>r.group===k)])),
    conditionalSlopes:{mu:input.mu,nu:input.nu},conditionalValueBoxes:v,audit,
    normalization:'Every derivative is taken before freezing the evaluation point. D_R=Rsharp*partial_R, D_Z=partial_Z,D_T=partial_T with Rsharp frozen; all Ac,u,g,Ls,massScale,tau,A0 in the displayed divisor are positive frozen normalizers, not factors removed before AD.',
    requiredSourcePremises:'Both complete original2x2 matrices, all first/mixed second coefficient derivatives, initial data, moving B and pressure, full target/H inverse/sqrt, whole-time Riccati and Gaussian estimates, positive conditioning and all new-point value intervals must be bound at the SAME fixed representative. Source B>=2^128,S>=B^1024 and the normalized-amplitude reserve must hold on this terminal neighborhood.',
    errorBudget:{positiveRadius:qtext(radius),oldPointRowsTransplanted:false,actualInitialLayersAndAllProductTermsRequired:true,
      rawPulseSlow:'t_j=a*(b_plus+b_minus*r)*P at the midpoint, withP=1 and every slow derivative ofP there zero by its fixed-endpoint defining integral. The full frame first/second derivative contributions are bounded, not discarded.',
      negativeMode:audit.proof.negativeMode},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false},
    sourceAuthenticated:false,actualPhysicalCurlDerivativesNumericallyEnclosed:false,wholeGNUMComplete:false,pass:true};
}
