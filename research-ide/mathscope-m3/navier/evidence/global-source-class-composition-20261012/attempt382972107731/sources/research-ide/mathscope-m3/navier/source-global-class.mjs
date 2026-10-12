/** Source-bound all-finite class composition for the actual global signed
 * current update. A quantified bound-generation program is distinguished
 * from the finite norm roots actually expanded during this invocation.
 * No numerical norm, infinite list of executed graphs, or Lean proof is
 * inferred from an unexpanded program.
 */
import {assertGlobalSignedCurrent,globalSignedCurrentCertificate} from './source-global-signed.mjs';
import {assertGlobalCurrentState} from './source-global-current.mjs';
import {assertActualCommonAdmissibleFamily,prepareActualCommonAdmissibleFamily} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {assertActualCommonTargetWeightedNorms,actualCommonTargetWeightedNormCertificate} from '../../mathscope-m2/navier/actual-common-target-weighted-norms.mjs';
import {originalWeightedCovarianceJetPowers,doubleBoundaryGaussianPoleBound} from '../../mathscope-m2/navier/actual-global-wave-bound-kernel.mjs';
import {normalizedHomogeneousPulseBinding} from '../../mathscope-m2/navier/actual-pulse-gaussian-power-kernel.mjs';
import {originalPulseTimeCutoff,originalPulseTimeCutoffBounds} from '../../mathscope-m2/navier/actual-gaussian-flat-tail-kernel.mjs';
import {fixedLabelSourcePartitionFactor} from '../../mathscope-m2/navier/actual-physical-full-curl.mjs';
import {exactSlowProfileExpansion} from '../../mathscope-m2/navier/actual-all-band-background-norm-kernel.mjs';
import {rectangularSourceFTC} from '../../mathscope-m2/navier/actual-background-physical-seminorms.mjs';
import {originalSourceRadialPhase} from '../../mathscope-m2/navier/source-radial-phase-exponent.mjs';
import {sourceExponentContract} from '../../mathscope-m2/navier/source-profile.mjs';
import {factorial,rational as Q,qadd,qsub,qmul,qcompare,qtext} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),choose=(m,j)=>factorial(m)/(factorial(j)*factorial(m-j)),
  reserve=n=>n<=1n?0:(n-1n).toString(2).length,degree=(power,pole=0)=>({power,pole}),
  mul=(a,b)=>degree(a.power+b.power,a.pole+b.pole),times=(a,n)=>degree(a.power+reserve(n),a.pole),
  sum=rows=>degree(Math.max(...rows.map(x=>x.power))+reserve(BigInt(rows.length)),Math.max(...rows.map(x=>x.pole))),
  progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};

/** A proof kernel of every epsilon exponent used in (7.41). The exact
 * source radial fast loss is retained as1/100000, not rounded into h.
 */
export function originalSignedClassExponentAudit(){
  const kappa=Q(1,100000),half=Q(1,2),one=Q(1),alpha=qsub(Q(3,2),kappa),rho=qsub(one,kappa),
    primary=half,E=rho,linear=qsub(alpha,half),remainder=qsub(alpha,kappa),
    earlier=qadd(E,linear),curl=qadd(primary,remainder),square=qsub(qmul(Q(2),alpha),one),
    higherSquare=qmul(Q(2),rho),mixed=qadd(half,rho),
    rows=[['current mixed covariance',mixed,alpha],['current correction square',higherSquare,alpha],
      ['higher original stress',Q(3),alpha],['epsilon axial mean and pressure',Q(2),alpha],
      ['earlier interaction in7.41',earlier,Q(2n*100000n-2n,100000)],
      ['new curl interaction in7.41',curl,earlier],['new square in7.41',square,earlier]
    ].map(([name,value,lower])=>({name,value:qtext(value),lower:qtext(lower),margin:qtext(qsub(value,lower)),pass:qcompare(value,lower)>=0}));
  return {schema:'MathScope.N6.ExactSignedClassExponents/1',arithmetic:'BIGINT_RATIONAL',kappa:qtext(kappa),alpha:qtext(alpha),rho:qtext(rho),
    W0:qtext(primary),E:qtext(E),LSigma:qtext(linear),Rcurl:qtext(remainder),
    threeRemainders:[earlier,curl,square].map(qtext),physicalRadialDivergenceRemainders:[earlier,curl,square].map(x=>qtext(qsub(x,kappa))),
    strictImprovement:qtext(qsub(earlier,alpha)),conditions:['0<epsilon<=1','0<kappa_s<1/2'],rows,
    leadingCovarianceIdentityRequiredSeparately:true,radialMeanPreservationRequiresNoResidualFastCarrier:true,
    sourceAuthenticated:false,pass:rows.every(x=>x.pass)&&qcompare(qsub(earlier,alpha),Q(0))>0};
}

/** Every entry(p,d) means (K_m*S)^p*delta_*^(-d), with the stated epsilon,
 * zeta and Gaussian factors kept separate. Total-order binomial sums bound
 * every mixed multi-index: sum_|beta|=j binom(alpha,beta)=binom(m,j).
 * The returned source norm request specifies ALL required input orders.
 */
export function originalSignedClassDegreeProgram(input={}){
  if(!input||Object.keys(input).some(k=>!['order','maxWork'].includes(k)))fail('Select an exact finite derivative order and work budget only.','INVALID_INPUT');
  const order=input.order??0,maxWork=input.maxWork??100000;
  if(!Number.isSafeInteger(order)||order<0||!Number.isSafeInteger(maxWork)||maxWork<1||!Number.isSafeInteger(order+9))
    fail('Use a finite derivative order and exact integer work budget.','RESOURCE_LIMIT');
  if((order+9)**3>maxWork)fail('The requested all-finite class recurrence exceeds this explicit work budget.','RESOURCE_LIMIT');
  const oldOrder=order+3,wave=originalWeightedCovarianceJetPowers({order:oldOrder,maxWork}),
    product=(a,b,count)=>Array.from({length:count+1},(_,m)=>sum(Array.from({length:m+1},(_,j)=>times(mul(a[j],b[m-j]),choose(m,j))))),
    // At fixed q there are81 complete candidates, each containing2 signs.
    // This deliberately also counts zero candidates. Nearby ell differs
    // from the reference ell by at most1, hence S_label<=4*S_ref.
    globalize=(d,m)=>degree(3*d.power+m+12,d.pole),
    W=wave.curl,primary=wave.amplitude,E=wave.curl,
    covProduct=product(W,W,oldOrder),mean=covProduct.map((d,m)=>globalize(times(d,2n),m)),
    mixed=product(primary,E,oldOrder),squareE=product(E,E,oldOrder),
    defect=mixed.map((d,m)=>globalize(sum([times(d,2n),squareE[m]]),m)),
    geometry=Array.from({length:oldOrder+1},(_,m)=>degree(12*(m+1)**2)),
    geometryProduct=(rows,m)=>sum(Array.from({length:m+1},(_,j)=>times(mul(geometry[j],rows[m-j]),choose(m,j)))),
    // A complete radial integral no longer has the pointwise zeta factor.
    // Its bound uses the actual whole radius interval and the Gaussian
    // absorption constant for the largest input pole, both in K_m.
    wholeIntegral=(rows,m)=>degree(geometryProduct(rows,m).power+2),
    // Mean-patch factors, including rho/R^e, have compact interior support.
    // Their source-only derivative bound times the displayed inverse zeta
    // minimum on that patch restores ONE zeta factor to a scalar moment.
    meanPatchProduct=(scalarRows,m)=>geometryProduct(scalarRows,m),
    // Inner/outer Gaussian comparisons and all parameter/FTC derivatives
    // of the original compact inverse. This counts all lower derivatives
    // and both fixed R^e weights, with e=0,1,2, before taking a maximum.
    compactPrimitive=(rows,m)=>sum(Array.from({length:m+1},(_,j)=>times(mul(degree(12*(m+1)**2),rows[j]),choose(m,j)))),
    radialInverse=(rows,m)=>sum(Array.from({length:m+1},(_,j)=>times(mul(geometry[j],compactPrimitive(
      Array.from({length:m-j+1},(_,k)=>geometryProduct(rows,k)),m-j)),choose(m,j)))),
    gr=[],wholeP=[],pressureSource=[],pressure=[],Jtheta=[],Jz=[],cRhoP=[],momentTheta=[],momentZ=[],offDiagonalDefect=[],Sigma=[];
  for(let m=0;m<=order+2;m++){
    // gr=-(partial_R+1/R)Crr-epsilon*partial_Z Crz+Ctt/R.
    gr.push(sum([times(mean[m+1],2n),times(geometryProduct(mean,m),2n)]));
    wholeP.push(wholeIntegral(gr,m));
    pressureSource.push(sum([gr[m],meanPatchProduct(wholeP,m)]));
    pressure.push(radialInverse(pressureSource,m));
    Jtheta.push(wholeIntegral(mean,m));
    // Jz=int R*Czz-(1/2)*int R^2*gr, with both terms retained.
    Jz.push(sum([wholeIntegral(mean,m),wholeIntegral(gr,m)]));
    cRhoP.push(geometryProduct(wholeP,m));
    // The original stress is epsilon*T0 plus a full positive-order
    // remainder in M_3. Its n=1 derivative keeps pole3+3m.
    const higherStress=degree(12*(m+2)**2,3+3*m);
    offDiagonalDefect.push(sum([defect[m],higherStress]));
  }
  for(let m=0;m<=order+1;m++){
    momentTheta.push(Jtheta[m+1]);
    // epsilon*partial_Z(Jz+c_rho*P): c_rho is differentiated inside
    // the complete Leibniz product, rather than frozen after integration.
    momentZ.push(sum([Jz[m+1],cRhoP[m+1]]));
    const radialDefect=sum([offDiagonalDefect[m+1],times(geometryProduct(offDiagonalDefect,m),2n)]),
      epsilonAxial=mean[m+1],pressureAxial=pressure[m+1],
      meanCorrection=sum([meanPatchProduct(momentTheta,m),meanPatchProduct(momentZ,m)]),
      compatibleSource=sum([radialDefect,epsilonAxial,pressureAxial,meanCorrection]),
      previous=[...Sigma.map(x=>x.source),compatibleSource];
    Sigma.push({order:m,radialDefect,epsilonAxial,pressureAxial,meanCorrection,source:compatibleSource,bound:radialInverse(previous,m)});
  }
  const inverseA=[degree(1)],inverseARows=[];
  for(let m=1;m<=order+1;m++){
    const terms=Array.from({length:m},(_,j)=>times(mul(wave.sigma[j+1],inverseA[m-j-1]),choose(m,j+1))),
      upper=mul(inverseA[0],sum(terms));inverseA.push(upper);inverseARows.push({order:m,terms,upper});
  }
  const sigma=Sigma.map(x=>x.bound),HinvSigma=product(wave.inverse,sigma,order+1).map(x=>times(x,2n)),
    // The literal division by2 in delta_a is retained in the source;
    // ignoring its improvement is conservative after counting dimension2.
    deltaA=product(HinvSigma,inverseA,order+1),
    t=wave.mixed.powers.t.map(p=>degree(p+1)),cutoffs=Array.from({length:order+2},(_,j)=>degree(3*j+3)),
    amplitude=product(product(deltaA,t,order+1),cutoffs,order+1),
    nRows=wave.mixed.rows.filter(x=>x.label.startsWith('original n_')&&!x.label.startsWith('original n_prime')),
    n=Array.from({length:order+2},(_,j)=>degree(Math.max(...nRows.map(x=>x.powers[j])))),
    invN=wave.mixed.rows.find(x=>x.label==='original 1/|n|^2').powers.map(x=>degree(x)),
    potential=product(product(n,amplitude,order+1),invN,order+1).map(x=>mul(degree(2),x)),
    curlRemainder=Array.from({length:order+1},(_,m)=>sum([potential[m+1],
      ...Array.from({length:m+1},(_,j)=>times(mul(degree(1),potential[m+1-j]),choose(m,j))),
      ...Array.from({length:m+1},(_,j)=>times(mul(degree(1),potential[m-j]),choose(m,j)))])),
    fullIncrement=amplitude.slice(0,order+1).map((x,m)=>sum([x,curlRemainder[m]])),
    earlier=product(E,amplitude,order).map((x,m)=>globalize(x,m)),
    curl=product(W,curlRemainder,order).map((x,m)=>globalize(x,m)),
    newSquare=product(fullIncrement,fullIncrement,order).map((x,m)=>globalize(x,m)),
    exponents=originalSignedClassExponentAudit(),all=[...mean,...defect,...gr,...wholeP,...pressureSource,...pressure,...Jtheta,...Jz,...cRhoP,...momentTheta,...momentZ,...offDiagonalDefect,
      ...Sigma.map(x=>x.bound),...inverseA,...deltaA,...amplitude,...potential,...curlRemainder,...earlier,...curl,...newSquare],
    maxBoundaryPole=Math.max(...all.map(x=>x.pole)),maxPower=Math.max(...all.map(x=>x.power));
  if(all.some(x=>!Number.isSafeInteger(x.power)||!Number.isSafeInteger(x.pole)))fail('The finite class degree arithmetic exceeded its exact integer budget.','RESOURCE_LIMIT');
  return {schema:'MathScope.N6.AllFiniteSignedClassDegreeProgram/1',order,oldOrder,wave,mean,defect,geometry,gr,wholeP,pressureSource,pressure,Jtheta,Jz,cRhoP,momentTheta,momentZ,offDiagonalDefect,Sigma,
    inverseA,inverseARows,deltaA,amplitude,potential,curlRemainder,fullIncrement,earlier,curl,newSquare,exponents,maxBoundaryPole,maxPower,
    epsilonAndZetaAccounting:{Sigma:'epsilon^alpha*zeta',inverseA:'zeta^(-1/2)',deltaA:'epsilon^(alpha-1)*sqrt(zeta)',
      amplitude:'epsilon^(alpha-1/2)*sqrt(zeta)*P',potential:'epsilon^alpha*sqrt(zeta)*P',curlRemainder:'epsilon^(alpha-kappa_s)*sqrt(zeta)*P'},
    inverseARule:'D^m(1/a)=-(1/a)*sum_(j=1)^m binom(m,j)*(D^j a)*D^(m-j)(1/a), with actual fixed a>=sqrt(c_y*zeta).',
    radialRule:'Use the original compact supported radial inverse on zero-moment sources. Every parameter derivative has the same support and zero-moment property. Actual Gaussian integration constants for the largest displayed boundary pole enter K_m.',
    wholeMomentRule:'wholeP/Jtheta/Jz/cRhoP/momentTheta/momentZ are source-only-in-R scalar bounds with pole0; complete radial integration uses Gaussian absorption. Multiplication by actual rho/R^e on its fixed interior support restores zeta using the displayed positive minimum, before the compact inverse. No pointwise zeta factor is assigned to an unlocalized whole integral.',
    allCurrentOperationsBound:['two derivative and two radius terms in gr','whole P','rho*P and zero-mean pressure','both complete integrals in Jz','full product c_rho*P','separate theta/z moments','both weighted source corrections','actual compact inverse with e=1/2 weights'],
    sourceNormRequest:{backgroundDerivativeOrder:order+6,positiveStressDerivativeOrder:order+2,targetWeightedDerivativeOrder:order+4,
      cutoffAndChartDerivativeOrder:order+5,stablePulseDerivativeOrder:order+4,
      exactProducer:'prepareGlobalClassNormExpansion({order,coefficientOrder,finite budgets})',
      reason:'Sigma through m+1 needs old full-curl means through m+3; the original weighted-curl theorem at m+3 needs C_(m+6) and target jets through m+4.',
      sourceOnly:true,expanded:false,numericalValueComputed:false,mathematicalDerivativeOrderCap:null},
    quantifiedConclusion:'For every finite m, the source generator supplies finite K_m>=2. The listed actual coefficients then satisfy these polynomial-S/finite-pole bounds through m on the original source domain.',
    sourceAuthenticated:false,finiteExecutedOrdersDoNotImplyAllOrderTheorem:true,pass:exponents.pass};
}

/** Quantitative Gaussian primitive comparison, including its positive
 * constant. This is used on both original radial collars; the compact
 * middle and the fixed mean patch have ordinary source FTC bounds.
 */
export function originalGaussianPrimitiveMajorant(G,{a,pole=0}={}){
  if(!Number.isSafeInteger(a)||!G.nodes[a]||!Number.isSafeInteger(pole)||pole<0||pole>2048)
    fail('Use an original positive Gaussian exponent and a finite pole at most2048.','RESOURCE_LIMIT');
  if(G.isq(a)&&G.fraction(a)[0]<=0n)fail('The Gaussian exponent must be positive.');
  const q=(n,d=1)=>G.q(n,d),p=Math.max(0,pole-2),base=G.add(G.one,G.inv(a)),
    constant=G.mul(q(factorial(p+1)),G.pow(base,p+2)),rows=[];
  for(let n=0;n<=p;n++)rows.push({power:n,recurrence:n<2?'J_0(w)<=e^(-a*w^2)/(2*a*w), J_1(w)=e^(-a*w^2)/(2*a)':
    'J_n(w)=w^(n-1)*e^(-a*w^2)/(2*a)+(n-1)*J_(n-2)(w)/(2*a)',
    upperCoefficient:G.mul(q(factorial(n+1)),G.pow(base,n+2))});
  return {schema:'MathScope.N6.GaussianRadialPrimitiveMajorant/1',a,pole,constant,rows,
    bound:'For0<t<=1, integral_0^t exp(-a/u^2)*u^(-pole)du <=constant*exp(-a/t^2)*t^(-pole).',
    proof:['Substitute w=1/u. Since w>=1, replace w^(pole-2) by w^max(0,pole-2).',
      'Integrate Gaussian moments by parts. The displayed recurrence and1/(2a)<=1+1/a give J_p(w)<=constant*exp(-a*w^2)*w^max(p-1,0).',
      'max(p-1,0)<=pole and t<=1 give the stated conservative finite-pole bound.'],
    positiveExponentRequired:true,sourceAuthenticated:false,numericalIntegralComputed:false};
}

// The cutoff/chart majorant helper below is copied literally from the
// original common-family norm producer; its source body is kept reviewable.
export function globalClassSourceCutoffAndMapConstants(G,family,order){
  const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
  const q=(n,d=1)=>G.q(n,d),c=family.constants,n=order+2,
    offset=G.fresh('global_bound_fixed_partition_offset'),factor=fixedLabelSourcePartitionFactor(G,offset),
    partitionSystem=G.defineExpressionFunction({name:'ActualGlobalBoundOriginalPartition',parameters:[offset],body:factor.value,derivativeLimits:[n+2]}),
    partitionRows=Array.from({length:n+1},(_,j)=>({order:j,...rectangularSourceFTC(G,{body:G.expressionValue(partitionSystem,[offset],[j]),
      coordinates:[offset],lower:[q(-1)],upper:[G.one]})})),
    time=originalPulseTimeCutoffBounds(G,{order:n}),stepMax=G.maximum(G.one,...time.stepBounds),
    transverse=Array.from({length:n+1},(_,j)=>G.mul(G.pow(G.div(q(2),c.r0),j),time.stepBounds[j])),
    s=G.fresh('global_bound_chart_s'),X=G.fresh('global_bound_chart_X'),eta=G.fresh('global_bound_chart_eta'),
    chart=exactSlowProfileExpansion(G,{s,X,eta,h:c.h,multiplier:G.one,order:n,maxJetRequests:200000}),
    box={coordinates:[s,X,eta],lower:[q(1,2),G.div(c.Xa,q(2)),q(-1)],upper:[q(2),G.mul(q(2),c.Xb),G.one]},
    coefficientRows=[],memo=new Map();
  const norm=body=>{
    if(memo.has(body))return memo.get(body);
    const system=G.defineExpressionFunction({name:'ActualGlobalBoundChartCoefficient_'+body,parameters:box.coordinates,body,derivativeLimits:[3,3,3]}),
      actual=G.expressionValue(system,box.coordinates),materialized=G.materializeExpressionFunction(system,box.coordinates),
      ftc=rectangularSourceFTC(G,{body:actual,...box});
    if(materialized!==body)fail('INVALID_SOURCE_CONSTRUCTION','The original slow chart coefficient body was lost.');
    coefficientRows.push({body,system,materialized,...ftc});memo.set(body,ftc.bound);return ftc.bound;
  };
  // For every positive multi-index, D^alpha log(s) is exactly the
  // coefficient of E_s P in D^alpha P; E_s log(s)=1 and all later
  // E_s or X/eta profile derivatives vanish.
  const logChartRows=chart.rows.filter(r=>r.slowOrders.some(Boolean)).map(r=>{
    const t=r.terms.find(t=>same(t.profileOrders,[1,0,0]));
    return {orders:r.slowOrders,body:t?.coefficient??G.zero,bound:t?G.div(norm(t.coefficient),G.log(q(2))):G.zero};
  }),partitionMax=G.maximum(G.one,...partitionRows.map(r=>r.bound)),logChartMax=G.maximum(G.one,...logChartRows.map(r=>r.bound)),
    // The number of set partitions is <=j!, and each mixed chain term
    // has at most j factors. Four factors give the multinomial sum4^j.
    slowCutoff=G.mul(q(4n**BigInt(n)*factorial(n)),G.pow(partitionMax,n+4),G.pow(logChartMax,n+4)),
    {Lambda,rho,kappa,dr}=originalSourceRadialPhase(G,{h:c.h,Tg:c.Tg}),drAbs=G.sqrt(G.add(G.one,G.pow(dr,2))),
    Rlower=G.sqrt(G.div(c.Xa,q(2))),Rupper=G.sqrt(G.mul(q(8),c.Xb)),Rbase=G.add(q(2),Rlower,G.inv(Rlower),Rupper),
    radiusRows=Array.from({length:n+1},(_,j)=>({order:j,
      inverseRadius:G.mul(q(factorial(j)),G.pow(Rbase,j+1)),
      fastRadial:G.mul(G.pow(G.add(drAbs,q(j+1)),j+1),G.exp(G.mul(G.add(drAbs,q(j+1)),G.log(Rbase))))})),
    maximum=G.maximum(q(2),stepMax,slowCutoff,...transverse,...time.rows.map(r=>r.coefficient),
      ...radiusRows.flatMap(r=>[r.inverseRadius,r.fastRadial]),q(factorial(n)*2n**BigInt(n+4)));
  if(G.materializeExpressionFunction(partitionSystem,[offset])!==factor.value||G.freeCoordinates(maximum).size)
    fail('INVALID_SOURCE_CONSTRUCTION','All original cutoff/map norms must retain their actual body and be source-only.');
  return {order:n,factor,partitionSystem,partitionRows,time,transverse,chart,coefficientRows,logChartRows,slowCutoff,
    Lambda,rho,kappa,dr,Rlower,Rupper,Rbase,radiusRows,maximum,
    partition:'The exact fixed-label denominator is >=1/4 on its numerator support. Its guarded smooth function is defined on [-1,1] and has all fixed derivatives zero at the outer endpoints.',
    slow:'Each fixed jth slow cutoff derivative is <=slowCutoff*S^(3j). The band-factor argument uses the displayed log(s) derivatives; every mesh factor has affine argument ell^6 times its own coordinate.',
    transverseProof:'On either transition of the original chi(xi), |xi| is linear and its slope has magnitude1. The transition inner slope has magnitude2/r0; on the central plateau every positive derivative is zero.',
    fastRadialProof:'The actual palette i=floor(((1+h)*ell*log2-log S)/log Tg) gives Lambda^i*Q^(dr/2)<=epsilon^(-kappa_s)*S^(-rho)<=epsilon^(-kappa_s). Differentiate R^dr exactly; the displayed falling-product/radius bound controls every fixed derivative of a(R) after this single epsilon factor.',
    materializedCoefficientBodies:true,sourceOnly:true};
}

/** New constants for the actual mean-patch bump and the two radial
 * Gaussian collars. They have no band, mesh, or slow free coordinate.
 */
export function globalClassMeanAndRadialConstants(G,family,{order=0,pole=0}={}){
  if(!Number.isSafeInteger(order)||order<0||order>40)fail('Use a finite mean coefficient derivative order.','RESOURCE_LIMIT');
  const q=(n,d=1)=>G.q(n,d),c=family.constants,u=G.fresh('global_class_actual_mean_seed'),
    seed=G.choose(u,G.zero,G.one,G.zero,G.exp(G.neg(G.inv(G.mul(u,G.sub(G.one,u))))),G.zero),
    system=G.defineExpressionFunction({name:'GlobalClassActualMeanSeed',parameters:[u],body:seed,derivativeLimits:[order+2]}),
    seedRows=Array.from({length:order+1},(_,j)=>({order:j,...rectangularSourceFTC(G,{body:G.expressionValue(system,[u],[j]),coordinates:[u],lower:[G.zero],upper:[G.one]})})),
    massLower=G.div(G.exp(q(-16,3)),q(20)),X0=G.parameter('X0Imean'),x0=G.mul(G.sqrt(G.mul(q(2),X0)),G.exp(q(1,2))),
    lowerR=G.sqrt(c.Xa),upperR=G.mul(q(2),G.sqrt(c.Xb)),radiusBase=G.add(q(2),lowerR,G.inv(lowerR),upperR,x0,G.inv(x0)),
    width=G.log(G.div(c.Xb,c.Xa)),leftGap=G.log(G.div(G.mul(X0,G.exp(G.one)),c.Xa)),
    rightGap=G.log(G.div(c.Xb,G.mul(X0,G.exp(G.one),q(121,100)))),
    collar=G.inv(G.mul(q(4),G.add(G.one,G.inv(width),G.inv(leftGap),G.inv(rightGap)))),
    a=G.pow(c.t1,2),b=q(4),inner=originalGaussianPrimitiveMajorant(G,{a,pole}),outer=originalGaussianPrimitiveMajorant(G,{a:b,pole}),
    gaussianAbsorption=doubleBoundaryGaussianPoleBound(G,{innerExponent:a,outerExponent:b,pole}),
    middleZetaInverse=G.exp(G.div(G.add(a,b),G.pow(collar,2))),
    complementaryRatio=G.exp(G.div(G.add(a,b),G.pow(G.sub(width,collar),2))),
    finiteGeometry=G.mul(q(factorial(order+2)),G.pow(G.add(radiusBase,G.inv(massLower),G.inv(collar),q(20)),12*(order+2)**2)),
    maximum=G.maximum(q(2),...seedRows.map(x=>x.bound),G.inv(massLower),finiteGeometry,inner.constant,outer.constant,
      gaussianAbsorption.constant,middleZetaInverse,complementaryRatio);
  if(G.freeCoordinates(maximum).size)fail('A radial or mean-patch norm constant acquired a band or slow coordinate.');
  return {order,pole,seed,system,seedRows,massLower,X0,x0,lowerR,upperR,radiusBase,width,leftGap,rightGap,collar,
    inner,outer,gaussianAbsorption,middleZetaInverse,complementaryRatio,finiteGeometry,maximum,
    sourceMeanBody:'rho=seed(10*(R/(sqrt(s)*x0)-1))/(sqrt(s)*x0*mass), with the same fixed original X0Imean.',
    massProof:'Changing variable u=10*(R/(sqrt(s)*x0)-1) gives mass=(1/10)*integral_0^1 seed(u)du. On[1/4,3/4], u(1-u)>=3/16, so mass>=exp(-16/3)/20>0; the mass is independent of s.',
    collarProof:'The original reserved Imean patch is strictly inside(Xa,Xb). Thus width,leftGap,rightGap>0. The displayed positive collar is<1/4, width/4 and one fourth of either gap, so chi_m is0 on the inner collar and1 on the outer collar.',
    compactInverseProof:'On the inner collar use the forward Gaussian primitive. On the outer collar use the backward primitive, whose equality follows from the actual zero weighted moment and all its parameter derivatives. On the compact middle use the positive displayed zeta lower bound and the full integral sup norm.',
    weightedPrimitiveDerivativeProof:'Differentiate the original complete integral with fixed endpoints. R derivatives give actual endpoint values by FTC; Z,T derivatives differentiate its body. Derivatives of R^e, R^-e and chi_m use their full finite Leibniz sums. Every chi_m derivative is in the compact mean patch. The same argument applies to every fixed derivative order.',
    analyticPremises:['Original fixed Imean is strictly inside the original shell.','The weighted source and all its parameter derivatives have the zero full radial moment proved by the actual current FTC/support identities.'],
    sourceOnly:true,wholeRadialDomainUsed:true,numericalNormValuesComputed:false};
}

function classRequest(input={}){
  if(!input||Object.keys(input).some(k=>!['order','coefficientOrder','maxNodes','maxWork'].includes(k)))fail('Only finite derivative/coefficient orders and budgets are class norm inputs.','INVALID_INPUT');
  const r={order:input.order??0,coefficientOrder:input.coefficientOrder??1,maxNodes:input.maxNodes??4000000,maxWork:input.maxWork??200000};
  if(!Number.isSafeInteger(r.order)||r.order<0||r.order>32||!Number.isSafeInteger(r.coefficientOrder)||r.coefficientOrder<0||r.coefficientOrder>32||
    !Number.isSafeInteger(r.maxNodes)||r.maxNodes<1||!Number.isSafeInteger(r.maxWork)||r.maxWork<1)
    fail('Each requested norm order and representation budget must be a finite nonnegative integer.','RESOURCE_LIMIT');
  return r;
}

/** Executable expansion of the full norm request. This is intentionally a
 * separate, bounded computation: an unexpanded request is never displayed
 * as this result. Every higher source constant is actually generated here,
 * or the original finite resource error is propagated without a success.
 */
export function prepareGlobalClassNormExpansion(input={},context={}){
  const request=classRequest(input),program=originalSignedClassDegreeProgram({order:request.order,maxWork:request.maxWork}),need=program.sourceNormRequest,
    family=prepareActualCommonAdmissibleFamily({throughOrder:Math.max(2,request.coefficientOrder+1,need.positiveStressDerivativeOrder),
      derivativeOrder:need.backgroundDerivativeOrder,maxNodes:request.maxNodes,maxProfileJets:request.maxWork,maxJetRequests:request.maxWork},context),
    target=family.constructTargetWeightedNorms({derivativeOrder:need.targetWeightedDerivativeOrder,maxNodes:request.maxNodes,maxJetRequests:request.maxWork},context),
    G=target.G,q=(n,d=1)=>G.q(n,d),c=family.constants,
    coefficients=globalClassSourceCutoffAndMapConstants(G,family,request.order+3),
    radial=globalClassMeanAndRadialConstants(G,family,{order:need.cutoffAndChartDerivativeOrder,pole:program.maxBoundaryPole}),
    background=family.source.backgroundNorms.gaussianRows.find(x=>x.derivativeOrder===need.stablePulseDerivativeOrder),
    stress=family.source.pressureStressSeminorms,n1=stress.n1Weighted,
    weighted=stress.weightedStress??[],stressConstants=[...n1.bounds.slice(0,need.positiveStressDerivativeOrder+1),
      ...weighted.flatMap(x=>x.directWeightedBounds.slice(0,need.positiveStressDerivativeOrder+1))],
    E=G.pow(c.Bnorm,256),W=G.exp(G.mul(q(3),E,c.Lmax)),
    K=G.maximum(q(2),background?.B_m??G.zero,G.pow(W,request.order+6),G.inv(family.uniformCovariance.inverse.determinantScaleLower),
      G.inv(G.sqrt(family.uniformCovariance.positivity.weightOverZetaLower)),coefficients.maximum,radial.maximum,
      ...target.rows.map(x=>x.N_m),...stressConstants),
    checks=[{id:'same-genuine-all-finite-original-family',pass:assertActualCommonAdmissibleFamily(family)},
      {id:'actual-requested-high-background-norm',pass:!!background&&background.backgroundDerivativeOrder===need.backgroundDerivativeOrder},
      {id:'actual-requested-weighted-target-jets',pass:assertActualCommonTargetWeightedNorms(target)&&target.request.derivativeOrder===need.targetWeightedDerivativeOrder},
      {id:'actual-requested-n1-weighted-poles',pass:n1.bounds.length>need.positiveStressDerivativeOrder&&n1.poles[need.positiveStressDerivativeOrder]===3+3*need.positiveStressDerivativeOrder},
      {id:'complete-fixed-cutoff-chart-and-radial-norm-orders',pass:coefficients.order===need.cutoffAndChartDerivativeOrder&&radial.order===need.cutoffAndChartDerivativeOrder},
      {id:'source-only-finite-positive-common-base',pass:G.freeCoordinates(K).size===0}];
  if(checks.some(x=>!x.pass))fail('A requested higher source constant was not generated; the norm request remains unexpanded.');
  const result={schema:'MathScope.N6.ExpandedGlobalSignedClassNorms/1',G,family,target,request,program,coefficients,radial,background,
    stressConstants,E,W,K,checks,sourceNormRequest:{...need,expanded:true,numericalValueComputed:false},
    scope:{allRequestedSourceNormRootsConstructed:true,allOtherOrdersLiterallyExecuted:false,sourceNormNumbersEvaluated:false,
      actualSignedFieldAttached:false,newLeanKernelProof:false,originalN604Complete:false}};
  progress(context,'global-class-requested-higher-norms-expanded',G,{requestedOrder:request.order});return result;
}

function classData(p){return {schema:p.schema,source:p.source,domain:p.domain,finiteWitness:p.finiteWitness,sourcePulseBindings:p.sourcePulseBindings,
  leading:p.leading,current:p.current,signed:p.signed,degreeProgram:p.degreeProgram,quantifiedNormProgram:p.quantifiedNormProgram,
  flatness:p.flatness,checks:p.checks,scope:p.scope};}

/** Bind the original quantified source theorem to this privately generated
 * all-label current and signed update. A genuine m=0 wave-norm witness is
 * freshly expanded; the stronger C_(m+6) request for the composed bounds
 * is retained explicitly, not conflated with that finite witness.
 */
export function attachGlobalSourceClass(signed,context={}){
  assertGlobalSignedCurrent(signed);const state=signed.state,{G:PG,band}=state,family=band.family;
  assertActualCommonAdmissibleFamily(family);const target=family.constructTargetWeightedNorms({derivativeOrder:1,maxNodes:4000000,maxJetRequests:200000},context),
    G=target.G,q=(n,d=1)=>G.q(n,d),c=family.constants,coefficients=globalClassSourceCutoffAndMapConstants(G,family,0),
    radial=globalClassMeanAndRadialConstants(G,family,{order:2,pole:12}),
    wave=originalWeightedCovarianceJetPowers({order:0,maxWork:50000}),background=family.source.backgroundNorms.gaussianRows.find(x=>x.derivativeOrder===1),
    E=G.pow(c.Bnorm,256),W=G.exp(G.mul(q(3),E,c.Lmax)),
    haarLength=G.mul(q(2),G.sub(q(4),G.mul(q(2),G.sqrt(q(2)))),G.pow(c.r0,2)),
    K=G.maximum(q(2),background?.B_m??G.zero,G.pow(W,3),G.inv(family.uniformCovariance.inverse.determinantScaleLower),
      G.inv(G.sqrt(family.uniformCovariance.positivity.weightOverZetaLower)),haarLength,coefficients.maximum,radial.maximum,...target.rows.map(x=>x.N_m)),
    sourcePulseBindings=band.families.map(f=>{
      const original=PG.covarianceSystems[f.system],binding=normalizedHomogeneousPulseBinding(PG,{v:band.coordinates.v,length:band.geometry.Ls,
        lambda:f.frame.reference.lambda,dref:f.frame.reference.dref,damping:f.frame.actualDamping,projected:f.frame.projected,
        error:f.frame.projectedError,matrix:original.matrix,P:f.P,initial:original.initial},context),
        cutoff=originalPulseTimeCutoff(PG,band.coordinates.v,band.geometry.Ls),slowIndependent=['R','Z','T'].every(n=>!PG.freeCoordinates(f.P).has(band.coordinates[n]));
      return {graphNamespace:'actual-signed-source',sign:f.sign,originalSystem:f.system,matrix:original.matrix,amplitude:f.t,P:f.P,binding,slowIndependent,
        originalCutoffMatches:cutoff.psi===band.cutoffs.psi,initial:original.initial,fixedRepresentativeBeforeDifferentiation:true};
    }),degreeProgram=originalSignedClassDegreeProgram({order:0,maxWork:100000}),
    noPhaseRoots=state.local.rows.map(row=>({sign:row.sign,checks:Object.entries(row.mean).map(([name,id])=>({component:name,
      noFastOrAngularFreeCoordinate:[band.coordinates.theta,band.coordinates.v,band.cutoffs.xi].every(v=>!PG.freeCoordinates(id).has(v))})),
      actualBeforeAngularCoefficients:row.angularMean,reason:'The source angular mean is formed from real/imaginary coefficient products, not from the radial carrier phase. The same normalized Haar integral is then taken over its complete rectangle.'})),
    current={Sigma:state.target.Sigma,class:'M_(3/2-kappa_s)',noPhaseRoots,
      exactLeadingCancellation:signed.leading,actualFullCurrentMean:state.covariance.fullAuxiliaryMean,actualPressure:state.mean.pressure.value,
      actualWholeMoments:[state.mean.P,state.mean.Jtheta,state.mean.Jz],actualCompatibility:state.target.compatibility,
      derivation:['The same original all-finite weighted source theorem gives W0_as in W_(1/2), and the retained full curl has U=W0_as+E with E in W_(1-kappa_s).',
        'The separate actual H/inverse/full-partition identity is C(W0_as)=epsilon*T0_star. Therefore C(U)-epsilon*T0_star=B(W0_as,E)+C(E), in M_(3/2-kappa_s); the second term has the higher order2-2kappa_s.',
        'The actual source retains every positive-order stress and its radial cutoff commutator. Its leading-subtracted normalized stress is in M_3: first weighted n=1 poles are retained and all later cutoffs obey the same common diagonal source bounds.',
        'All original auxiliary means are phase-independent. Slow derivatives preserve their epsilon exponent; no derivative of a residual radial carrier is discarded. Diagonal covariances are in M_1; gr and the reconstructed mean pressure remain M_1.',
        'The epsilon*partial_Z terms in E, including the actual whole pressure and complete product Jz+c_rho*P, have order M_2. The corrected current source in Corollary8.5 therefore has order M_(3/2-kappa_s).',
        'The actual weighted sources have zero full radial moment. Their source-supported compact radial inverse preserves M_alpha by the displayed forward/backward Gaussian primitive comparison and the fixed mean-patch bounds. Hence both actual Sigma components belong to the claimed class.']},
    signedProof={H:signed.inverse.H,a:signed.inverse.a,target:signed.inverse.Sigma,deltaA:signed.inverse.deltaAmplitude,
      linearClass:'W_(alpha-1/2)',curlRemainderClass:'W_(alpha-kappa_s)',alpha:'3/2-kappa_s',
      actualThreeRemainders:{earlier:signed.assembly.identity.earlierInteraction,curl:signed.assembly.identity.curlInteraction,square:signed.assembly.identity.newIncrementSquare},
      threeClasses:['M_(2-2*kappa_s)','M_(2-2*kappa_s)','M_(2-2*kappa_s)'],
      proof:['H is the same uniformly invertible source matrix and a the same positive square root. H^-1 has polynomial-S jets. The displayed reciprocal-a recurrence uses a>=sqrt(c_y*zeta), never a new square root of signed Sigma.',
        'Since Sigma has epsilon^alpha*zeta and dividing by2*a removes only one sqrt(zeta), delta_a has epsilon^(alpha-1)*sqrt(zeta) with finite poles. Multiplication by sqrt(epsilon)*chi*psi*t gives L Sigma in W_(alpha-1/2).',
        'The same actual n cross amplitude/(k|n|^2) potential gains another sqrt(epsilon). Its full source curl has exactly the linear leading coefficient plus a remainder in W_(alpha-kappa_s); the original radial fast coefficient costs only the retained kappa_s.',
        'Apply the three separate all-label mean-product estimates to B(E,L Sigma), B(U,Rcurl), and C(V). Their exact exponents are alpha+1/2-kappa_s, alpha+1/2-kappa_s, and2alpha-1, all2-2kappa_s for the actual alpha. The source functions in all three terms were actually constructed, not replaced by their bound.']},
    quantifiedNormProgram={schema:'MathScope.N6.QuantifiedOriginalSourceNormProgram/1',variable:'arbitrary finite nonnegative integer m',
      producer:'source-global-class.mjs:prepareGlobalClassNormExpansion',degreeProducer:'source-global-class.mjs:originalSignedClassDegreeProgram',
      sourceConstructors:['actual-common-admissible-family.mjs:prepareActualCommonAdmissibleFamily','actual-common-target-weighted-norms.mjs:attachActualCommonTargetWeightedNorms',
        'actual-global-wave-bound-kernel.mjs:originalWeightedCovarianceJetPowers'],
      inputOrderRelations:degreeProgram.sourceNormRequest,constant:'K_m is the maximum of2 and every actually requested source norm, fixed geometric factor, stable propagator constant, inverse-H/positive-a lower bound reciprocal and radial Gaussian comparison constant.',
      sequenceIdentity:'The canonical coefficient and diagonal norm recipes are prefix coherent. Increasing a finite norm request does not reselect h, any original coefficient, fixed H/a, or the already fixed common b_n sequence.',
      termination:'For fixed m, all jet, binomial, reciprocal and Gaussian recurrences are finite. The exact source norm expressions are compact integrals of the retained smooth source functions, with their original endpoint regularity proofs. Finite computational budgets may reject an expansion; rejection supplies no bound value.',
      proofReferences:{paperPages:[69,70,71,72,79,80,81,82,83,84,85,86,87,90,91,92,93,94,95],equations:['6.4','6.5','7.19','7.27','7.31','7.40','7.41','8.18']},
      arbitraryBoundsAccepted:false,allIntegerGraphsLiterallyExecuted:false,largerNormRequestExecutedDuringThisWitness:false,
      finiteWitnessDoesNotProveQuantification:true,quantificationJustification:'The original uniform stable-Duhamel, inverse-H, positive-square-root and common-cutoff induction, combined with the displayed all-finite derivative/degree recurrences and the actual source operation binding.'},
    flatness={zeta:family.roots.zeta,actualInnerExponent:PG.pow(c.t1,2),actualOuterExponent:PG.q(4),
      sourcePositiveWeightLower:band.quantitative.sourceWeightOverZetaLower,
      proof:'Every fixed derivative is bounded by a source constant times sqrt(zeta) or zeta times a finite boundary pole. Each original positive Gaussian exponent absorbs every such pole. All derivatives therefore vanish at both shell edges; extend by zero before evaluating any inverse, square root, representative or local root outside support.',
      actualOuterGuards:state.local.rows.map(row=>row.guards),signedOuterGuards:signed.rows.map(row=>row.guards),
      etaEndpointsOneSided:true,negativeTimeHeatExtensionClaimed:false},
    checks=[{id:'same-private-source-current-and-signed-update',pass:assertGlobalSignedCurrent(signed)&&assertGlobalCurrentState(state)},
      {id:'genuine-common-quantified-source-theorem',pass:assertActualCommonAdmissibleFamily(family)&&family.uniformCovariance.universalAnalyticRecipeSourceBound&&family.scope.allFixedDerivativeClausesBySameRecipe},
      {id:'fresh-complete-original-leading-weighted-norm-witness',pass:assertActualCommonTargetWeightedNorms(target)&&target.family===family&&target.request.derivativeOrder===1&&target.checks.every(x=>x.pass)},
      {id:'fresh-original-C3-Gaussian-witness',pass:!!background&&background.backgroundDerivativeOrder===3&&wave.order===0},
      {id:'actual-two-original-stable-pulse-equations',pass:sourcePulseBindings.length===2&&sourcePulseBindings.every(x=>x.binding.checks.every(r=>r.pass)&&x.slowIndependent&&x.originalCutoffMatches&&same(x.initial,[PG.one,PG.zero]))},
      {id:'actual-leading-full-partition-cancellation-not-assumed-from-types',pass:signed.leading.leadingQuadraticDefectZero&&signed.leading.checks.every(x=>x.pass)},
      {id:'mean-radial-fast-phase-absent-after-actual-averages',pass:noPhaseRoots.every(x=>x.checks.every(y=>y.noFastOrAngularFreeCoordinate))},
      {id:'actual-current-full-moment-and-original-radial-inverse',pass:state.target.checks.every(x=>x.pass)&&state.target.compatibility.sourceSupport.allCrossedRadialLabelsRetained&&state.target.fullProductCRhoPInsideDerivative},
      {id:'all-three-exact-signed-remainders-and-fixed-source-amplitudes',pass:signed.scope.allThreeActualGlobalCovarianceRemaindersConstructed&&signed.scope.originalHandPositiveAFixed&&signed.checks.every(x=>x.pass)},
      {id:'exact-positive-h-and-unrounded-fast-loss',pass:sourceExponentContract().positive&&degreeProgram.exponents.kappa==='1/100000'&&degreeProgram.pass},
      {id:'finite-witness-norms-source-only-and-separate-from-unexpanded-C6',pass:G.freeCoordinates(K).size===0&&degreeProgram.sourceNormRequest.backgroundDerivativeOrder===6&&!degreeProgram.sourceNormRequest.expanded}];
  if(checks.some(x=>!x.pass))fail('The original quantified class theorem does not bind to this actual signed source: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const result={schema:'MathScope.N6.ActualGlobalSignedClassComposition/1',G,signed,target,
    source:{paperSHA256:state.source.paperSHA256,parameterExpressionSHA256:state.source.parameterExpressionSHA256,
      normGraphNamespace:'fresh-original-weighted-norms',fieldGraphNamespace:'actual-signed-source',integerRootIDsNeverTransplanted:true,
      originalCommonSequencePreserved:true,sourceOnlyUniformTheoremInstantiated:true},domain:state.domain,
    finiteWitness:{waveDerivativeOrder:0,targetDerivativeOrder:1,backgroundDerivativeOrder:3,wave,background,coefficients,radial,E,W,K,
      allTheseNormRootsActuallyConstructed:true,numericalNormsEvaluated:false,composedC6NormRequestLiterallyExpanded:false},
    sourcePulseBindings,leading:signed.leading,current,signed:signedProof,degreeProgram,quantifiedNormProgram,flatness,checks,
    scope:{actualSourceConstructiveAllOrderClassComposition:true,actualSigmaClass:'M_(3/2-kappa_s)',
      actualThreeRemainderClasses:['M_(2-2*kappa_s)','M_(2-2*kappa_s)','M_(2-2*kappa_s)'],
      allFiniteOrdersHaveAnExplicitSourceGenerator:true,finiteWitnessExecuted:true,allOrdersLiterallyExecuted:false,
      independentMathematicalReviewRequired:true,originalN604Complete:false,completeN6:false,numericalFieldEnclosureComputed:false,newLeanKernelProof:false}};
  // Keep the executable state reference out of the public signed proof.
  result.sourceSignedState=signed;
  seals.set(result,{G,signed,target,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(classData(result))});
  progress(context,'global-source-quantified-class-composition-sealed',G);return result;
}

export function assertGlobalSourceClass(result){
  const s=seals.get(result);
  if(!s||s.G!==result.G||s.signed!==result.sourceSignedState||s.target!==result.target||s.data!==canonicalStringify(classData(result))||
    s.prefix!==canonicalStringify(result.G.nodes.slice(0,s.count))||!result.G.functionDefinitionsUnchanged(s.definitions))
    fail('Use the unchanged source-bound global class composition, not a copied receipt or supplied norm.');
  assertActualCommonTargetWeightedNorms(result.target);assertGlobalSignedCurrent(result.sourceSignedState);return true;
}

export async function globalSourceClassCertificate(result){
  assertGlobalSourceClass(result);const s=seals.get(result),source=await globalSignedCurrentCertificate(result.sourceSignedState),target=await actualCommonTargetWeightedNormCertificate(result.target),
    data=classData(result),encoded=canonicalStringify({sourceSignedGraph:source.graph,targetGraph:target.graph,data,nodes:result.G.nodes,definitions:s.definitions});
  return {...data,sourceSignedGraph:source.graph,targetWitness:target,
    normGraph:{sha256:await sha256(encoded),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(encoded).length},
    sourceSignedReceiptIsNotTheExecutionAuthority:true,execution:'ACTUAL_SOURCE_CLASS_BINDING_AND_FRESH_FINITE_NORM_WITNESS'};
}

