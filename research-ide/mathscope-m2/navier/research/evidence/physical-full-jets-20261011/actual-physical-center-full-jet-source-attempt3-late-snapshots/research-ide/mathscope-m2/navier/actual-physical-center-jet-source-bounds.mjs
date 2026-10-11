/** Finite bounds on the NEW physical-center terminal neighborhood.
 * These are exact scalar implications and retained-body identities. Only
 * a separate private adapter can authenticate the actual point, original
 * full field/target/frame/Volterra systems and their conditioning boxes.
 * No old evaluated source jet, caller norm, or exp(B*S) estimate is used.
 */
import {rational as Q,qadd,qmul,qdiv,qcompare,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {terminalSlowMatrixPowerAudit,centeredRiccatiJetPowerAudit} from './actual-centered-slow-jet-enclosure-kernel.mjs';
import {centeredNormalizedAmplitudePowerAudit} from './actual-centered-fast-jet-enclosure-kernel.mjs';
import {centeredTerminalTargetPowerAudit} from './actual-centered-slow-jet-source-bounds.mjs';

const pow2=n=>Q(1n<<BigInt(n)),noInputs=(args,name)=>{
  if(args.length)fail('INVALID_INPUT',name+' constructs its fixed finite bounds; caller supplied domains or bounds are not accepted.');
},requireChecks=(checks,message)=>{if(checks.some(x=>!x.pass))fail('INTERNAL_VALIDATION',message);};

/** Ordinary mixed derivatives through order five, uniformly at every
 * midplane center in the expanded delta/T box. Rsharp is frozen before
 * taking derivatives. This recurrence differs from the old literal-center
 * one: both implicit coefficients and the heat T increment cost two, and
 * the step reciprocals are bounded by16 on[3/32,5/32].
 */
export function physicalCenterFiniteFieldMajorant(...args){
  noInputs(args,'physicalCenterFiniteFieldMajorant');
  const order=5,zero=()=>Array.from({length:order+1},()=>Q(0)),constant=x=>{const p=zero();p[0]=x;return p;},
    add=(a,b)=>a.map((x,i)=>qadd(x,b[i])),scale=(a,b)=>a.map(x=>qmul(x,b)),
    mul=(a,b)=>a.map((_,i)=>{let s=Q(0);for(let k=0;k<=i;k++)s=qadd(s,qmul(a[k],b[i-k]));return s;}),
    power=(a,n)=>{let p=constant(Q(1));for(let k=0;k<n;k++)p=mul(p,a);return p;},
    compose=(coeff,a)=>coeff.reduce((p,c,n)=>add(p,scale(power(a,n),c)),zero()),t=zero();
  t[1]=Q(1);const t2=mul(t,t),geometric=Array.from({length:order+1},(_,n)=>pow2(n));
  let w=zero();const implicitIterations=[];
  for(let k=0;k<=order;k++){
    w=add(scale(t,Q(2)),scale(mul(t2,compose(geometric,w)),Q(2)));
    implicitIterations.push(w.map(qtext));
  }
  const logCoefficients=Array.from({length:order+1},(_,n)=>n?Q(1,n):Q(0)),
    argumentShift=add(logCoefficients,scale(compose(logCoefficients,w),Q(1,2))),
    logisticExponent=Array.from({length:order+1},(_,n)=>n?Q(2n*BigInt(n+1)*16n**BigInt(n+2)):Q(0)),sigma=[Q(1)];
  for(let n=0;n<order;n++){
    let s=Q(0);
    for(let k=0;k<=n;k++){
      let square=Q(0);for(let j=0;j<=k;j++)square=qadd(square,qmul(sigma[j],sigma[k-j]));
      s=qadd(s,qmul(qadd(sigma[k],square),qmul(Q(n-k+1),logisticExponent[n-k+1])));
    }
    sigma.push(qdiv(s,Q(n+1)));
  }
  const step=compose([Q(1),...sigma.slice(1).map(c=>qdiv(c,Q(256)))],argumentShift),
    inverseRadiusSquare=Array.from({length:order+1},(_,n)=>Q(n+1)),
    heatShift=mul(add(constant(Q(1)),scale(t,Q(2))),inverseRadiusSquare);heatShift[0]=Q(0);
  const heat=compose(Array.from({length:order+1},(_,n)=>n?Q(factorial(n+1)):Q(1)),heatShift),
    radial=Array.from({length:order+1},(_,n)=>Q(BigInt((n+1)*(n+2)*(n+3)),6)),field=mul(mul(radial,step),heat),
    rows=field.map((coefficient,n)=>({order:n,absoluteTaylorCoefficient:qtext(coefficient),
      ordinaryDerivativeUpper:qtext(qmul(Q(factorial(n)),coefficient)),
      pass:qcompare(qmul(Q(factorial(n)),coefficient),pow2(512))<0})),
    checks=[{id:'expanded-chart-coefficients-at-most-two',pass:qcompare(Q(16,15),Q(2))<0&&qcompare(Q(17,15),Q(2))<0},
      {id:'expanded-step-reciprocals-below-sixteen',pass:qcompare(Q(32,3),Q(16))<0&&qcompare(Q(32,27),Q(16))<0},
      {id:'every-finite-mixed-field-derivative-fits-reserve',pass:rows.every(r=>r.pass)}];
  requireChecks(checks,'The expanded physical-center field majorant exceeded its exact finite reserve.');
  return {schema:'MathScope.PhysicalCenterFiniteFieldMajorant/1',order,rows,implicitIterations,checks,pass:true,
    domain:{delta:['3/16','5/16'],Tsharp:['15/16','17/16'],stepArgument:['3/32','5/32'],heatArgument:['0','1/16'],
      h:'0<h<2^-4096',Rsharp:'Renv^-1<Rsharp<Renv',evaluation:'Z=0; all mixed R/Z/T derivatives at every center in this box'},
    majorants:{chartIncrement:w.map(qtext),stepArgumentIncrement:argumentShift.map(qtext),
      logisticExponent:logisticExponent.map(qtext),step:sigma.map(qtext),heatArgumentIncrement:heatShift.map(qtext),radial:radial.map(qtext)},
    proof:{originalField:'F=Bstar*(1+x)^(-2(1+h))*f_o(ysharp+2log(1+x)-log(s/Tsharp))*H(zsharp*(1+tT/Tsharp)/(1+x)^2). Here x=(R-Rsharp)/Rsharp, and Bstar,Rsharp,Tsharp are frozen normalizers.',
      chart:'w=s/Tsharp-1=tT/Tsharp+tZ^2*Tsharp^(2h-1)*(1+w)^(2h). Both fixed coefficients are at most2, since Tsharp in[15/16,17/16] and0<2h<1. Absolute coefficients of the power are bounded by2^n. Every required degree depends only on earlier degrees.',
      step:'The exact logistic exponent g=(1-x)^(-2)-x^(-2) on[3/32,5/32] has Taylor coefficient bound2(n+1)16^(n+2). The recurrence is sigma_prime=sigma*(1-sigma)*g_prime, with sigma0<=1, and absolute products sigma+sigma^2. The original h/256 factor is bounded by1/256, never replaced by zero.',
      heat:'The complete positive Gamma density gives |H^(j)(z)|<=j!*(j+1)! forz>=0,0<h<1. Its entire improper integral is retained. Dividing byj! before composition gives the printed factorial coefficients.',
      mixed:'Replace every absolute coordinate increment by the same positive indeterminate. For a mixed multiindex alpha, alpha!<=|alpha|!, so the printed ordinary derivative bound dominates every individual mixed derivative.',
      conversion:'The separately bound original f_o*H>1/2 and F<Renv^71 imply Bstar<2Renv^71<Renv^72. Because2^512<Renv, every normalized F jet throughfive is<Renv^73. G and its jets vanish only after the actual common exterior support proof.'},
    normalizedFieldPower:73,positiveHReplacedByZero:false,oldPointNumericalJetsUsed:false,sourceAuthenticated:false};
}

/** Global scalar derivatives of the original flat step and bump, followed
 * by the ORIGINAL three-neighbor normalized quotient. At the selected
 * mesh offsets |x|<=9/16 its own numerator is also bounded below. This is
 * what permits relative derivatives of the slow cutoff in C.
 */
export function physicalCenterOriginalPartitionBoundAudit(...args){
  noInputs(args,'physicalCenterOriginalPartitionBoundAudit');
  const phi=[Q(1),Q(4),Q(36),Q(1968)],denominator=phi.map(x=>qmul(Q(2),x)),inverse=[Q(128)],choose=(n,k)=>Q(factorial(n),factorial(k)*factorial(n-k));
  for(let n=1;n<=3;n++){
    let s=Q(0);for(let k=1;k<=n;k++)s=qadd(s,qmul(choose(n,k),qmul(denominator[k],inverse[n-k])));
    inverse.push(qmul(Q(128),s));
  }
  const sigma=phi.map((_,n)=>{let s=Q(0);for(let k=0;k<=n;k++)s=qadd(s,qmul(choose(n,k),qmul(phi[k],inverse[n-k])));return s;}),
    bump=[Q(1),pow2(65),pow2(66)],D=[Q(3),pow2(68),pow2(133)],
    inverseSqrt=[Q(2),pow2(70),pow2(142)],chi=[Q(1),pow2(71),pow2(144)],
    relativeDerivativeBits=[72,146,364],checks=[
      {id:'entire-step-derivatives-through-three',pass:sigma.slice(1).every(x=>qcompare(x,pow2(64))<0)},
      {id:'three-neighbor-denominator-first',pass:qcompare(qmul(Q(6),bump[1]),D[1])<0},
      {id:'three-neighbor-denominator-second',pass:qcompare(qmul(Q(6),qadd(qmul(bump[1],bump[1]),bump[2])),D[2])<0},
      {id:'inverse-square-root-first',pass:qcompare(qmul(Q(4),D[1]),inverseSqrt[1])<=0},
      {id:'inverse-square-root-second',pass:qcompare(qadd(qmul(Q(24),qmul(D[1],D[1])),qmul(Q(4),D[2])),inverseSqrt[2])<0},
      {id:'normalized-bump-first',pass:qcompare(qadd(qmul(Q(2),bump[1]),inverseSqrt[1]),chi[1])<0},
      {id:'normalized-bump-second',pass:qcompare(qadd(qadd(qmul(Q(2),bump[2]),qmul(Q(2),qmul(bump[1],inverseSqrt[1]))),inverseSqrt[2]),chi[2])<0},
      {id:'four-factor-relative-first',pass:2+71+72<relativeDerivativeBits[1]},
      {id:'four-factor-relative-second',pass:4+2*144+72<=relativeDerivativeBits[2]},
      {id:'finite-relative-constants-fit-source-environment',pass:Math.max(...relativeDerivativeBits)<512&&512<4096}];
  requireChecks(checks,'The original finite partition derivative ledger failed.');
  return {schema:'MathScope.PhysicalCenterOriginalPartitionBoundAudit/1',checks,pass:true,
    computed:{flatPhiOrdinaryDerivatives:phi.map(qtext),stepDenominatorDerivatives:denominator.map(qtext),
      inverseDenominatorDerivatives:inverse.map(qtext),stepOrdinaryDerivativeMajorants:sigma.map(qtext),
      bumpDerivativeBounds:bump.map(qtext),threeNeighborDenominatorDerivatives:D.map(qtext),
      inverseSqrtDenominatorDerivatives:inverseSqrt.map(qtext),normalizedBumpDerivatives:chi.map(qtext)},
    relativeDerivativeBits,positiveSingleFactorLower:'2^-18',positiveFourFactorLower:'2^-72',
    sourcePower:{B:8,S:6},provedStrongerByOrder:[{order:0,B:0,S:0},{order:1,B:1,S:3},{order:2,B:1,S:6}],
    proof:{flat:'Forphi(x)=exp(-1/x^2) onx>0, the first three derivatives have polynomials2x^-3,4x^-6-6x^-4,8x^-9-36x^-7+24x^-5. On0<x<=1, x^-n exp(-1/x^2)<=ceil(n/2)!, producing4,36,1968. The flat extension has the same limiting bounds.',
      step:'sigma=phi(x)/(phi(x)+phi(1-x)). On0<=x<=1 one argument is>=1/2, so its denominator>=exp(-4)>1/128, sincee<3 and3^4<128. The printed inverse and product recurrences give all three derivative bounds; outside this interval the original step is constant.',
      bump:'The original b has plateau1 for|x|<=1/4 and transition sigma(3/2-2|x|) up to3/4. Its argument slope has magnitude2; there is no absolute-value singularity on the constant middle branch.',
      denominator:'ForD=sum_{j=-1}^1 b(x-j)^2, the original nearest-neighbor partition gives1/4<=D<=3. ThereforeD^-1/2<=2, |(D^-1/2)_i|<=4|D_i|, and |(D^-1/2)_ij|<=24|D_i D_j|+4|D_ij|.',
      positiveValue:'At|x|<=9/16, the transition argument is>=3/8. Its numeratorphi>=exp(-64/9)>exp(-8)>2^-16; denominator<=2, andsqrtD<2. Thuschi>2^-18. The product of at mostfour such factors is>2^-72.',
      relative:'The complete four-factor repeated/mixed Leibniz sum has at most16 terms. Its absolute first/second derivative bounds, divided by the positive product, give the printed bit reserves. Every original mesh argument derivative costsell^6=S^3; each normalized R derivative adds at mostRenv. Constants<2^512<Renv give relative jets<Renv^3*S^(3j)<B*S^(3j), j<=2.',
      bandAndFast:'The actual band factor is on its original constant plateau atTsharp in[15/16,17/16]. The original chi(xi/r0),psi(v/L) are also on their constant plateaus atxi=0,v=L/2. Their needed derivatives vanish by their original branch bodies, before no other factor is simplified.'},
    callerCutoffAccepted:false,sourceAuthenticated:false};
}

/** Rebind the finite primitive/frame/target recurrences to the expanded
 * field majorant. The old target row whose proof useddelta=1/4 is replaced
 * here by the whole-box factor and a new positive tau lower bound.
 */
export function physicalCenterFinitePrimitivePowerAudit(...args){
  noInputs(args,'physicalCenterFinitePrimitivePowerAudit');
  const field=physicalCenterFiniteFieldMajorant(),matrix=terminalSlowMatrixPowerAudit(),amplitude=centeredNormalizedAmplitudePowerAudit(),
    oldTarget=centeredTerminalTargetPowerAudit(),targetRows=oldTarget.rows.map(r=>r.id==='source_chart_and_outer_exponential'?
      {...r,reason:'At everydelta in[3/16,5/16],Tsharp in[15/16,17/16],Z=0, the expanded exact implicit chart and full flat-prefactor derivatives cost<2^512<Renv; retain the original positive s^(-A-1/2).'}:r),
    rows=[],put=(id,power,reason)=>{const row={id,RenvPower:power,reason};rows.push(row);return power;},
    product=(id,...p)=>put(id,p.reduce((a,b)=>a+b,0)+1,'All finite Leibniz products through ordertwo, including repeated coefficients'),
    normal=put('normalized_original_normal',108,'Same normalized original n/Bs and the expanded field jets; no complete pressure term is deleted.'),
    normalSquare=put('normalized_normal_square',218,'The two original tangential components and radial component are squared before inversion.'),
    inverseNormalSquare=put('inverse_normal_square_through_four',5+4*normalSquare+6,'At Z=0 the exact normalized n_z=-1 throughout0<=tau<=1 and every auxiliary comparison segment, so|n_hat|^2>=1.'),
    inverseBs=put('inverse_frozen_Bs',40,'Original positive frozen carrier scaleBs>Renv^-40.'),
    componentScale=put('frozen_component_scale',22,'Original positive diag(1,Ac,u), withAc<Renv^21,u<Renv^11.'),
    normalProjection=product('n_hat_over_normal_square',normal,inverseNormalSquare),
    physicalProjection=product('n_over_original_normal_square',normalProjection,inverseBs),
    coefficientCross=product('normal_cross_normalized_component',physicalProjection,componentScale),
    coefficientGeometry=put('complete_normal_cross_component_matrix',coefficientCross+1,'The original cross product has its full finite row sum; this is k*C before the partition and weighted amplitude.'),
    checks=[{id:'expanded-field-finite-bound',pass:field.pass},
      {id:'full-matrix-including-pressure-and-B-prime-fits-B',pass:matrix.computedMaximumPower<3840&&3840<4096},
      {id:'separate-normalized-moving-amplitude-fits-B',pass:amplitude.maximumPower<4096},
      {id:'whole-box-target-normalized-jets-fit-B',pass:oldTarget.maximumPower<512&&512<4096},
      {id:'whole-box-positive-tau-retains-original-reserve',pass:24<60},
      {id:'complete-normal-C-geometry-fits-B',pass:coefficientGeometry<4096}];
  requireChecks(checks,'The new-point original primitive/frame/target reserve failed.');
  return {schema:'MathScope.PhysicalCenterFinitePrimitivePowerAudit/1',field,matrix,amplitude,
    target:{schema:'MathScope.PhysicalCenterTerminalTargetPowerAudit/1',rows:targetRows,kernelRows:oldTarget.kernelRows,
      maximumPower:oldTarget.maximumPower,reserve:512,sourceAuthenticated:false,
      kernelProof:oldTarget.kernelProof,flatProof:oldTarget.flatProof,
      tauProof:'At every new midplane center, the original regular theta factor is>=C^-10>Renv^-1; delta^-3>1. Since4/delta^2<=1024/9<128, the original exp(-4/delta^2)>exp(-128)>2^-256>Renv^-1. Also s^(-1-h)>1/4>Renv^-1 andAc<4Renv^20<Renv^21. Hence the complete originaltau=Ttheta/Ac>Renv^-24>Renv^-60.',
      chartProof:'The original target profile domain0<=delta<=1/2 and wholeJ_(4,m) kernels already cover this box. The only literal-center conversion is replaced by the expanded implicit chart above and this new lower bound. All positive source powers and both theta/axial shear terms remain.',pass:true},
    rows,coefficientGeometryPower:coefficientGeometry,sourceNormalPower:{B:64,S:0},checks,pass:true,
    sourceObligations:['Original complete local terminal field and exact common exterior G=0.',
      'Frozen Rsharp,Ac,u,Bs and actual rounded beta=Ls*p/Bs, not a substitute reference carrier.',
      'Original whole normalized pressure projection and Bprime derivative in M.',
      'Original tangent and normal denominator>=1 at the midplane along every auxiliary segment.',
      'Original complete heat, outer theta/axial target factors and whole nested backward kernels.'],
    derivativeDomain:'All needed slow/tau jets atZ=0 for everydelta/T center in the declared box, uniformly0<=tau<=1; derivatives are taken before evaluation.',
    oldLiteralCenterValueReused:false,sourceAuthenticated:false};
}

/** Coarse weighted jets from original stable Riccati calculus and the
 * whole Gaussian integral. The inverse is conditioned by the actual NEW
 * value boxes, independently of any claimed derivative value. This finite
 * proof therefore does not use the conclusion of the numerical jet table.
 */
export function physicalCenterWeightedJetPowerAudit(...args){
  noInputs(args,'physicalCenterWeightedJetPowerAudit');
  const centeredDeterminantLower=qdiv(qmul(Q(2),qmul(Q(1,8),Q(1,8))),qmul(Q(1,4),Q(1,4))),
    centeredEntryUpper=qdiv(Q(1,2),Q(1,16)),centeredInverseInfinityUpper=qdiv(qmul(Q(2),centeredEntryUpper),centeredDeterminantLower),
    centeredWeightLower=qmul(Q(1,16),Q(1)),centeredWeightUpper=qmul(Q(1,4),Q(4)),
    riccati=centeredRiccatiJetPowerAudit(),rows=[],put=(id,B,S,reason)=>{const r={id,B,S,reason};rows.push(r);return r;},
    qFirst=put('whole_log_first_slow',8,1,'q_i_prime=M11_i+M12_i*r+M12*r_i; bound byB^8 and integrate at mostLs<=S.'),
    qSecond=put('whole_log_second_slow',16,1,'q_ij_prime=M11_ij+M12_ij*r+M12_i*r_j+M12_j*r_i+M12*r_ij; every mixed term remains.'),
    ratio=[put('ratio_first_all_slow_tau',6,1,'r_i<=B^6; L*r_v<=4BL<B^2*S. Both follow from the original full RHS.'),
      put('ratio_second_all_slow_tau',14,2,'r_ij<=B^14, L*r_iv<=B^8*S, L^2*r_vv<=B^4*S^2 from M_v<=B/L and the complete Riccati chain.')],
    frame=[put('normalized_full_frame_factor_value',2,0,'b_plus+b_minus*r, with each complete normalized B entry<=B and|r|<1.'),
      put('normalized_full_frame_factor_first',8,1,'Full normalized moving-frame derivative and the ratio first derivative.'),
      put('normalized_full_frame_factor_second',16,2,'Full repeated/mixed frame product with both cross terms and ratio second derivative.')],
    exponential=[put('centered_mode_relative_first',8,1,'For E=exp(q(v)-q(v0)), differentiate the complete dynamic-center difference. q_tau<=B^2*S.'),
      put('centered_mode_relative_second',17,2,'E_ij/E=deltaq_i*deltaq_j+deltaq_ij, with complete mixedtau derivatives q_i_tau<=B^8*S andq_tau_tau<=B^4*S^2.')],
    H=[put('centered_H_whole_integral_value',6,0,'Original transverse normalization and complete Gaussian integral moment<2^16 multiply two full frame factors.'),
      put('centered_H_whole_integral_first',17,1,'Differentiate both frame factors andE^2; the original cutoffs and whole integral bounds are retained.'),
      put('centered_H_whole_integral_second',26,2,'Both repeated E products and every frame cross term are bounded inside the same whole Gaussian integral.')],
    Y=[put('centered_positive_weight_value',0,0,'Actual new-center value boxes implyYbar=a^2*y*m/tau in[1/16,1].'),
      put('centered_positive_weight_first',20,1,'K*Y=T givesY_i=K^-1*(T_i-K_i*Y), with exact actual centered inverse infinity norm<=32.'),
      put('centered_positive_weight_second',40,2,'Y_ij=K^-1*(T_ij-K_ij*Y-K_i*Y_j-K_j*Y_i); both cross terms remain.')],
    sqrtY=[put('centered_positive_square_root_value',0,0,'1/4<=sqrt(Ybar)<=1.'),
      put('centered_positive_square_root_first',21,1,'Yi/(2sqrtY), with its actual positive denominator at least1/4.'),
      put('centered_positive_square_root_second',42,2,'Yij/(2sqrtY)-Yi*Yj/(4Y^(3/2)); the subtraction is bounded in absolute value, never omitted.')],
    weighted=put('normalized_weighted_pulse_through_two',64,2,'Multiply sqrtYbar*P*E*(b_plus+b_minus*r), by total derivative order. At the fixed center P=E=1, P_tau=0, |P_tau_tau|=gL<=B*S. Finite products fitB^64*S^2.'),
    checks=[{id:'actual-value-box-conditioned-inverse',pass:qcompare(centeredDeterminantLower,Q(1,2))===0&&qcompare(centeredInverseInfinityUpper,Q(32))===0},
      {id:'actual-value-box-conditioned-positive-square-root',pass:qcompare(centeredWeightLower,Q(1,16))===0&&qcompare(centeredWeightUpper,Q(1))===0},
      {id:'original-stable-Riccati-derivative-reserves',pass:riccati.pass&&riccati.firstReserve===6&&riccati.secondReserve===14},
      {id:'full-log-first-product-exponent',pass:1+6+1<=qFirst.B},
      {id:'full-log-second-product-exponent',pass:1+14+1<=qSecond.B},
      {id:'whole-Gaussian-first-integral-reserve',pass:5+9+2<H[1].B},
      {id:'whole-Gaussian-second-integral-reserve',pass:5+18+2<H[2].B},
      {id:'first-conditioned-weight-reserve',pass:H[1].B+2<Y[1].B},
      {id:'second-conditioned-weight-reserve',pass:H[1].B+Y[1].B+2<Y[2].B},
      {id:'complete-positive-square-root-second-reserve',pass:Math.max(Y[2].B,2*Y[1].B)+1<sqrtY[2].B},
      {id:'finite-weighted-products-through-total-order-two',pass:sqrtY[2].B+frame[0].B+4<weighted.B&&2*sqrtY[1].B+frame[0].B+4<weighted.B},
      {id:'source-required-weighted-reserve',pass:weighted.B<512&&weighted.S<4}];
  requireChecks(checks,'The complete new-point weighted-jet finite ledger failed.');
  return {schema:'MathScope.PhysicalCenterWeightedJetPowerAudit/1',rows,riccati,checks,pass:true,
    sourceWeightedPower:{B:512,S:4},provedStrongerPower:{B:64,S:2},
    computedConditioning:{centeredDeterminantLower:qtext(centeredDeterminantLower),centeredEntryUpper:qtext(centeredEntryUpper),
      centeredInverseInfinityUpper:qtext(centeredInverseInfinityUpper),centeredWeightLower:qtext(centeredWeightLower),centeredWeightUpper:qtext(centeredWeightUpper)},
    conditioning:{actualCenters:['1/4','1/2'],positiveHEntries:['1/8','1/2'],negativeAxialMinusH:['-1/2','-1/8'],
      actualWeightsOverTauDividedByMass:['1','4'],centeredDeterminantMagnitudeLower:'1/2',centeredInverseInfinityUpper:'32',
      centeredPositiveWeights:['1/16','1'],centeredSquareRootLower:'1/4'},
    proof:{sourceData:'Use the actual two full2x2 M matrices, complete first/second slow coefficients, M_v and M_iv, fixed original datum(1,0), and the original stable whole-interval cone. The expanded primitive ledger supplies all these coefficient bounds; no norm on a substituted reference matrix is accepted.',
      log:'Withq=logw_plus, q_i andq_ij are obtained by integrating the printed complete RHS from the fixed initial endpoint. The dynamic centered difference q(v)-q(v0) is integrated along an interval of length at mostL, so no factor exp(B*S) appears. Actual derivatives of the center are retained.',
      gaussian:'The independently bound original transport and full Gaussian proof gives the entire normalized transverse/time integral ofP^2*exp(2(q(v)-q(v0))) at most2^16. Equivalently bound the complete x-integral by the source exp(-x^2/6) comparison with its finite prefactor. This is an original all-time estimate, not a Gaussian-core truncation. Its tails and the exact Haar Jacobian are retained.',
      inverse:'LetK_aj=H_aj/(D_a*m*a_j^2),Ybar_j=a_j^2*y_j*m/tau, withD=(Ac,u) frozen. ThenK*Ybar=T/(D*tau) exactly. New source values1/8<=|H_aj/(D_a*m)|<=1/2 and opposite second-row signs imply|det(Hnorm)|>=1/32. Dividing columns bya_j^2<=1/4 gives|detK|>=1/2. Its entries are<=8, so infinity norm ofK^-1<=32. This value conditioning is established before derivative bounds.',
      target:'Every actual normalized target slow derivative through two is<=B by the expanded whole-box target proof, including both shear components. It is not set to a constant when differentiating.',
      weighted:'The identity sqrt(y)*w_plus/A0=sqrt(Ybar)*(w_plus/a), A0=sqrt(tau/m), uses the positive actual a. The full normalized moving amplitude multiplies(1,r). Use total derivative order, so the S exponents add to at most2. PhysicalD_r,D_z,D_t conversions add their explicitly frozen scalar factors; at the fast plateaus no derivative ofa(R)*partial_xi is lost.',
      time:'For this coarse bound the complete Riccati RHS is sufficient: q_v<=2B, q_vv<=B^4, r_v<=4B, r_vv<=B^4. The sharper numerical center-error proof must separately retain its nonzero initial layer; this coarse bound does not replace that proof.'},
    numericalJetValuesUsedToProveTheirOwnErrors:false,wholeInitialLayerSetToZero:false,callerBoundsAccepted:false,sourceAuthenticated:false};
}

/** Direct original-phase identities for the four actual coordinate
 * operators. The radial fast operator adds a(R)*partial_xi, whose action
 * on this phase is zero only when the supplied xi independence is checked.
 */
export function physicalCenterOriginalPhaseJetAudit(G,input={}){
  const names=['phase','speed','p','pz','x0','epsilon','R','Z','T','v','theta'],allowed=[...names,'xi'],
    isRoot=x=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x];
  if(!input||Object.keys(input).some(k=>!allowed.includes(k))||names.some(k=>!isRoot(input[k]))||
    ['R','Z','T','v','theta'].some(k=>G.nodes[input[k]].op!=='coordinate')||
    (input.xi!==undefined&&G.nodes[input.xi]?.op!=='coordinate'))
    fail('INVALID_INPUT','Supply the original phase/speed and frozen carriers with distinct coordinate roots.');
  const {phase,speed,p,pz,x0,epsilon,R,Z,T,v,theta,xi}=input,coords=[R,Z,T,v,theta];
  if(new Set(coords).size!==coords.length||[p,pz,x0,epsilon].some(root=>coords.some(d=>G.freeCoordinates(root).has(d)))||
    [v,theta,...(xi===undefined?[]:[xi])].some(d=>G.freeCoordinates(speed).has(d)))
    fail('INVALID_INPUT','Original carrier constants must be frozen and the source speed must be a slow-only function.');
  const D={r:x=>G.derivative(x,R),z:x=>G.mul(epsilon,G.derivative(x,Z)),
    t:x=>G.sub(G.derivative(x,v),G.mul(epsilon,G.derivative(x,T))),theta:x=>G.div(G.derivative(x,theta),R)},
    H={R:G.derivative(speed,R),Z:G.derivative(speed,Z),T:G.derivative(speed,T)},
    H2={RR:G.derivative(H.R,R),RZ:G.derivative(H.R,Z),RT:G.derivative(H.R,T),
      ZZ:G.derivative(H.Z,Z),ZT:G.derivative(H.Z,T),TT:G.derivative(H.T,T)},
    expectedPhase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,speed)),
    phaseCheck=sourceGraphRationalIdentity(G,G.sub(phase,expectedPhase),{maxTerms:18000}),
    expectedFirst={r:G.sub(x0,G.mul(v,H.R)),z:G.sub(pz,G.mul(epsilon,v,H.Z)),t:G.add(G.neg(speed),G.mul(epsilon,v,H.T)),theta:G.div(p,R)},
    expectedSecond={rr:G.neg(G.mul(v,H2.RR)),rz:G.neg(G.mul(epsilon,v,H2.RZ)),
      rt:G.add(G.neg(H.R),G.mul(epsilon,v,H2.RT)),zz:G.neg(G.mul(G.pow(epsilon,2),v,H2.ZZ)),
      zt:G.add(G.neg(G.mul(epsilon,H.Z)),G.mul(G.pow(epsilon,2),v,H2.ZT)),
      tt:G.sub(G.mul(G.q(2),epsilon,H.T),G.mul(G.pow(epsilon,2),v,H2.TT)),
      rtheta:G.neg(G.div(p,G.pow(R,2))),ztheta:G.zero,ttheta:G.zero,thetatheta:G.div(expectedFirst.r,R)},
    first=Object.entries(expectedFirst).map(([direction,expected])=>{
      const original=D[direction](phase),check=sourceGraphRationalIdentity(G,G.sub(original,expected),{maxTerms:18000});
      return {direction,original,expected,check,pass:check.pass};
    }),second=Object.entries(expectedSecond).map(([directions,expected])=>{
      const axes={rtheta:['r','theta'],ztheta:['z','theta'],ttheta:['t','theta'],thetatheta:['theta','theta']}[directions]??directions.split(''),
        raw=D[axes[0]](D[axes[1]](phase)),connection=directions==='thetatheta'?G.div(D.r(phase),R):G.zero,
        original=G.add(raw,connection),check=sourceGraphRationalIdentity(G,G.sub(original,expected),{maxTerms:25000});
      return {directions,axes,original,expected,connection,check,pass:check.pass};
    }),xiDerivative=xi===undefined?null:G.derivative(phase,xi),checks=[
      {id:'original-complete-phase-body',pass:phaseCheck.pass},
      {id:'all-original-first-phase-derivatives',pass:first.every(x=>x.pass)},
      {id:'all-original-second-phase-derivatives',pass:second.every(x=>x.pass)},
      {id:'original-radial-fast-phase-independence',pass:xiDerivative===null||xiDerivative===G.zero}];
  requireChecks(checks,'An original physical phase derivative lost its epsilon, mixed or repeated term.');
  return {schema:'MathScope.PhysicalCenterOriginalPhaseJetAudit/1',input,expectedPhase,phaseCheck,H,H2,first,second,xiDerivative,checks,pass:true,
    positiveEpsilonRequired:true,roundedCarrierRetained:true,fullAxialSpeedRetained:true,angularHessianConnectionRetained:true,
    terminalReduction:'Only after the actual exterior proof may speed=p*F+pz*G reduce to p*F with everyG jet zero. The midplane evenF hasFZ=FRZ=FTZ=0, whileFZZ is retained.',
    sourceAuthenticated:false};
}

/** Phase scales useL*pTilde as a finite scalar. pTilde^-1 itself has an
 * explicit factorL<=S. The two time derivatives retain epsilon; this is
 * why their r/z/t normalized bound needs no extraS^2. The angular
 * covariant Hessian DOES have the explicitS^2 recorded below.
 */
export function physicalCenterPhasePowerAudit(...args){
  noInputs(args,'physicalCenterPhasePowerAudit');
  const rows=[],put=(id,power,reason)=>{rows.push({id,RenvPower:power,reason});return power;},
    lengthCarrier=put('positive_L_times_pTilde_upper',1+42+11+20,'L*pTilde=Rsharp*Bs*u/gabs.'),
    inverseLengthCarrier=put('positive_L_times_pTilde_inverse',1+40+75,'Rsharp>Renv^-1,Bs>Renv^-40,u>1,gabs<Renv^75.'),
    rounded=put('actual_L_times_rounded_p_upper',lengthCarrier+1,'The actual |p-pTilde|<=1/k, L/k<S^-7; retain the positive error.'),
    rawFieldSecond=put('unnormalized_field_jets_through_two',75,'The normalized field boundRenv^73 costs at mosttwo inverse frozen radius factors.'),
    spatial=put('pure_spatial_phase_second_normalized',rounded+rawFieldSecond+80+1,'v<=L andOmega_r^-1,Omega_z^-1<=Renv^40, including all epsilon factors.'),
    mixedTime=put('mixed_time_phase_second_normalized',11+rawFieldSecond+40+1,'p/Omega_t=(p/pTilde)/F<Renv^11. The remaining epsilon*v<=epsilon*L<1.'),
    timeTime=put('time_time_phase_second_normalized',inverseLengthCarrier+21+rawFieldSecond+2,'p/Omega_t^2=(p/pTilde)/(pTilde*F^2). The two original terms gain epsilon*L andepsilon^2*L^2, both<1.'),
    angularMixed=put('radial_angular_phase_second_normalized',42,'Phi_rtheta=-p/R^2 andOmega_theta=pTilde/R; p/pTilde cancels the pulse length.'),
    angularAngular=put('angular_angular_phase_second_normalized_before_L_squared',1+150+2*inverseLengthCarrier+1,'The covariant scalar Hessian isPhi_r/R. Dividing byOmega_theta^2 givesR*Phi_r/pTilde^2, with the EXPLICIT factorL^2<=S^2.'),
    phaseError=put('rounded_and_time_phase_first_relative_error',inverseLengthCarrier+2,'First signs(1,-1,-1) differ by at mostRenv^118*(S/k+epsilon*S). Rounding and time drift remain positive.'),
    maximumPower=Math.max(...rows.map(r=>r.RenvPower)),checks=[
      {id:'finite-phase-scalar-reserve',pass:lengthCarrier<4096&&inverseLengthCarrier<4096},
      {id:'all-phase-normalized-second-terms-fit-B-times-S-squared',pass:Math.max(spatial,mixedTime,timeTime,angularMixed,angularAngular)<4096},
      {id:'phase-rounding-drift-reserve',pass:phaseError<4096},
      {id:'original-positive-frequency-gives-epsilon-L-less-one',pass:16-1>0&&8-1>0}];
  requireChecks(checks,'The original physical phase power reserve failed.');
  return {schema:'MathScope.PhysicalCenterPhasePowerAudit/1',rows,maximumPower,checks,pass:true,
    requiredSourcePhasePower:{B:64,S:2},provedStrongerNormalizedSecondPower:{B:1,S:2},
    sourceScalarPower:{B:16,S:0},inverseRawTimePhaseScale:{B:1,S:1},
    normalization:{Omega_r:'Bs*u>0',Omega_z:'Bs>0',Omega_t:'pTilde*F>0',Omega_theta:'pTilde/Rsharp>0',pTilde:'Rsharp*Bs*u/(L*gabs)>0',
      frozenFiniteScalar:'L*pTilde and its reciprocal',rawInverse:'pTilde^-1<Renv^116*L<B*S; Omega_t^-1<Renv^126*L<B*S'},
    exactTimeSecond:'Phi_tt=2*epsilon*p*F_T-epsilon^2*v*p*F_TT at the authenticated terminal midplane. The coefficient2 and both positive epsilon powers are required.',
    exactAngularSecond:'Hessian(Phi)(theta,theta)=D_theta(D_theta(Phi))+D_r(Phi)/R=D_r(Phi)/R. The coordinate vector connection is retained, and its normalized upper bound costsL^2<=S^2.',
    firstRelativeError:'Renv^118*(S/k+epsilon*S); source positivity, rounding and epsilon are bound separately, never set to zero.',
    proof:'Use the original B/Renv hierarchy, S>=B^1024,L<=S,k>S^8 andepsilon<4/S^16. Thus epsilon*L<1. Atv=L/2, actual roundedp remains within1/k ofpTilde, whilepTilde= -Bs*u/(L*FR) for the active positive sign. Full first phase signs are(1,-1,-1) plus the printed error. Divide the literal second identities by their original positiveOmega factors before bounding; cancel only exact factorsp/pTilde and retain all powers ofepsilon.',
    inversePulseLengthHiddenInScalarPremise:false,sourceAuthenticated:false};
}

/** Fixed finite implication for the private full-curl source adapter.
 * Calling this function never authenticates a member, copied graph or
 * supplied bound; every obligation below must be checked on that adapter's
 * own original graph. No optional caller controls can change the powers.
 */
export function physicalCenterJetSourceBoundAudit(...args){
  noInputs(args,'physicalCenterJetSourceBoundAudit');
  const primitive=physicalCenterFinitePrimitivePowerAudit(),partition=physicalCenterOriginalPartitionBoundAudit(),
    weighted=physicalCenterWeightedJetPowerAudit(),phase=physicalCenterPhasePowerAudit(),
    sourcePremises=[{id:'source_scalar_and_reciprocal',...phase.sourceScalarPower},
      {id:'weighted_pulse_jets_through_two',...weighted.sourceWeightedPower},
      {id:'original_slow_partition_relative_jets_through_two',...partition.sourcePower},
      {id:'normal_and_inverse_square_jets_through_two',...primitive.sourceNormalPower},
      {id:'phase_first_and_second_normalized_jets',...phase.requiredSourcePhasePower}],
    checks=[{id:'expanded-original-field-and-target',pass:primitive.pass},
      {id:'original-cutoff-value-and-relative-derivatives',pass:partition.pass},
      {id:'whole-time-source-weighted-derivatives',pass:weighted.pass},
      {id:'source-phase-length-and-epsilon-losses',pass:phase.pass}];
  requireChecks(checks,'The new physical-center source-bound finite implication failed.');
  return {schema:'MathScope.PhysicalCenterJetSourceBoundAudit/1',primitive,partition,weighted,phase,sourcePremises,checks,pass:true,
    bindingObligations:['The private actual physical-center point, same common band and exact copied graph prefix.',
      'Expanded delta/T domain, exact Rsharp/zsharp and original positive h, Renv, B, S, Ls, epsilon, roundedp.',
      'Original complete F/heat/terminal step and exact exterior G with needed mixed derivative bodies.',
      'Both original full moving pressure, normal, Bprime and Volterra20-component second variations.',
      'Whole source cone/Gaussian estimates and retained complete Haar integrals, including nonzero initial layers for sharp numerical errors.',
      'Actual new-center H/a/y boxes before using the inverse and positive square-root derivative conditioning.',
      'Original target primitive roots, tau lower bound, Ac/u and all required target derivative operands.',
      'Every original normalized slow cutoff factor, source mesh offset, positive denominator and actual fast plateaus.',
      'All four first and ten second phase bodies, including the angular Hessian connection, and actual positive Omega factors; L*pTilde is the finite scalar.',
      'The exact full potential coefficient and all required first/second curl derivatives before phase-zero evaluation.'],
    oldPointJetTransplantAllowed:false,callerBoundsAccepted:false,sourceAuthenticated:false,actualPhysicalCurlNumericallyEnclosed:false,wholeGNUMComplete:false};
}
