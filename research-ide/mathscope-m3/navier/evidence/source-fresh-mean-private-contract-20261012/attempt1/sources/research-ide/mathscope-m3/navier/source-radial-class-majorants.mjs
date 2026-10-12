/** Original Lemma8.2 and pressure(8.12): fixed source operator constants.
 *
 * The original cutoff, normalized rho, two Gaussian edges and fixed
 * common-torus phase are actual source expressions. The retained input
 * g_r/f seminorm is an explicit operand of the class composition. This
 * module never infers that input bound from a finite derivative sample.
 */
import {exactSlowChartOperators,exactSlowChartIdentityAudit} from '../../mathscope-m2/navier/actual-all-band-background-norm-kernel.mjs';
import {sourceAllOrderCutoffJets} from '../../mathscope-m2/navier/actual-residual-order-induction-kernels.mjs';
import {originalSourceRadialPhase,assertOriginalSourceTorusMap} from '../../mathscope-m2/navier/source-radial-phase-exponent.mjs';
import {originalMeanSeedFlatJets} from './source-fixed-mean-majorants.mjs';
import {prepareOriginalFourierClassMajorants,assertOriginalFourierClassMajorants,originalFourierClassMajorantCertificate} from './source-fourier-class-majorants.mjs';
import {recordedSourceN7DomainExterior,sourceExteriorForceObservations} from './source-exterior-force-evidence.mjs';
import {assertGlobalCurrentPressure} from './source-global-pressure.mjs';
import {assertGlobalInitializedMean} from './source-global-initial-mean.mjs';
import {globalGraphEqual} from './source-global-current.mjs';
import {radialFactorial,radialBinomial,radialBellMajorants,radialChangeOfVariablesMajorants,
  radialGaussianWeightMajorants,originalRadialClassDerivativeDemand} from './source-radial-class-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),attachments=new WeakMap(),copy=x=>structuredClone(x),
  fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),total=a=>a.reduce((s,n)=>s+n,0),
  record=p=>({schema:p.schema,request:p.request,source:p.source,geometry:p.geometry,phase:p.phase,cutoff:p.cutoff,rho:p.rho,
    chart:p.chart,change:p.change,weight:p.weight,rows:p.rows,pressureRows:p.pressureRows,pressureInput:p.pressureInput,
    roots:p.roots,checks:p.checks,scope:p.scope});

function requested(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','pole','ibpOrder','maxNodes','maxWork'].includes(k)))
    fail('Choose finite derivative, pole and IBP indices and explicit budgets only; no source norm or class flag is accepted.','INVALID_INPUT');
  const r={order:input.order??1,pole:input.pole??8,ibpOrder:input.ibpOrder??2,maxNodes:input.maxNodes??300000,maxWork:input.maxWork??200000};
  if(Object.values(r).some(n=>!Number.isSafeInteger(n)||n<0)||r.ibpOrder<1||r.maxNodes<5000||r.maxWork<1||
    !Number.isSafeInteger(r.order+2*r.ibpOrder+3)||BigInt(r.order+2*r.ibpOrder+4)**3n>BigInt(r.maxWork)||r.pole+1>r.maxWork)
    fail('The complete requested source operator inventory exceeds the explicit finite representation budget.','RESOURCE_LIMIT');
  return r;
}

/** Literal original slow chart, followed by an analytic fixed-polydisc
 * estimate of EVERY chart-coefficient derivative. This avoids repeatedly
 * expanding a high source derivative in every later operator product.
 * The original h<1/16 and the displayed complex radius are checked source
 * premises. These constants have no q, band or physical point input.
 */
function fixedSlowChartMajorants(G,{s,X,eta,h,Xa,Xb,order}){
  const q=(n,d=1)=>G.q(n,d),chart=exactSlowChartOperators(G,{s,X,eta,h}),identity=exactSlowChartIdentityAudit(G,{s,X,eta,h}),
    coefficients=chart.coefficients.map(row=>row.map((a,j)=>j===0?G.mul(s,a):a)),
    radius=G.inv(G.mul(q(16),G.add(G.one,G.inv(Xa)))),coefficientSup=G.mul(q(128),G.add(G.one,Xb)),
    coefficientJets=Array.from({length:order+1},(_,n)=>({order:n,
      bound:G.mul(q(radialFactorial(n)),coefficientSup,G.pow(radius,-n))})),
    throughOrder=[];
  for(let n=0;n<=order;n++){
    const leibnizPower=n*(n-1)/2;
    if(!Number.isSafeInteger(leibnizPower))fail('The complete chart product count exceeds its representation budget.','RESOURCE_LIMIT');
    throughOrder.push({order:n,coordinateDirectionCount:String(3n**BigInt(n)),leibnizCount:String(2n**BigInt(leibnizPower)),
      bound:G.mul(q(3n**BigInt(n)*2n**BigInt(leibnizPower)),...coefficientJets.slice(0,n).map(r=>r.bound)),
      sourceProfileDerivativeOrder:n,allMixedSlowOrderings:true});
  }
  return {coordinates:[s,X,eta],ordinaryCoefficients:coefficients,originalProfileBasisCoefficients:chart.coefficients,
    identity,independentBox:{lower:[q(1,2),G.div(Xa,q(2)),q(-1)],upper:[q(2),G.mul(q(2),Xb),G.one]},
    radius,coefficientSup,coefficientJets,throughOrder,
    analyticDomainProof:[
      'At every point of the independent real box, take the complex polydisc radius r=1/[16(1+1/Xa)]. It is less than1/16 and Xa/16. Thus Re(s)>7/16 and Re(X)>7Xa/16; the actual principal real powers extend holomorphically there.',
      'The original h=exp(-8002T), T>1 gives h<1/16 by exp(8002T)>1+8002T>16. Consequently0<D=1/2-h<1/2.',
      '|eta|<17/16 implies |2h eta²|<(1/8)*(17/16)²<1/2, so the actual denominator1-2h eta² has modulus>1/2.',
      '|s|<3, |s|^-1<3, |s^-D|<2, |s^(1-D)|<3 and |X|<2Xb+1/16 bound all nine displayed ordinary chart coefficients by128(1+Xb). The radial square root obeys the same bound.',
      'Multivariable Cauchy gives |partial^alpha a_ij|<=alpha!*coefficientSup*r^(-|alpha|)<=|alpha|!*coefficientSup*r^(-|alpha|).',
      'For ||g||_k=max_|alpha|<=k sup|partial^alpha g|, the full Leibniz sum gives ||D_i g||_k<=3*2^k*A_k*||g||_(k+1). Repeating yields3^m*2^(m(m-1)/2)*product_(k=0..m-1)A_k times the complete profile C^m norm.'
    ],sourceBodyCoefficientsRetained:true,sourceOnly:true,ordinaryCoefficientDerivativesBoundByCauchy:true,
    arbitraryCoefficientArraysAccepted:false};
}

/** The original sigma_2 has a literal quotient definition on (0,1).
 * Build every requested derivative of that definition by the full
 * reciprocal/Leibniz recurrence. The source primitive's old numerical
 * twelve-jet evaluator is neither called nor extrapolated here.
 */
export function originalRadialStepDerivativeProgram(G,{order=1,maxWork=200000}={}){
  if(!Number.isSafeInteger(order)||order<0||!Number.isSafeInteger(maxWork)||maxWork<1||
    BigInt(order+1)**3n>BigInt(maxWork))fail('The complete fixed step derivative program exceeds its explicit resource budget.','RESOURCE_LIMIT');
  const source=sourceAllOrderCutoffJets({order},{maxArithmeticOperations:maxWork}),q=(n,d=1)=>G.q(n,d),
    x=G.fresh('radial_class_original_sigma_x'),right=G.sub(G.one,x),
    seedAt=(row,arg)=>G.mul(G.exp(G.neg(G.pow(arg,-2))),
      G.add(...row.polynomial.map(term=>G.mul(q(term.coefficient),G.pow(arg,-term.power))))),
    leftJets=source.activation.seedDerivatives.map(row=>seedAt(row,x)),
    rightJets=source.activation.seedDerivatives.map(row=>G.mul(q(row.order%2?-1:1),seedAt(row,right))),
    denominatorJets=leftJets.map((a,j)=>G.add(a,rightJets[j])),reciprocal=[G.inv(denominatorJets[0])],
    reciprocalRows=[{order:0,terms:[],value:reciprocal[0]}],sigmaJets=[G.step(x)],rows=[];
  for(let n=1;n<=order;n++){
    const terms=Array.from({length:n},(_,k)=>({order:k+1,binomial:String(radialBinomial(n,k+1)),
      value:G.mul(q(radialBinomial(n,k+1)),denominatorJets[k+1],reciprocal[n-k-1])})),
      value=G.neg(G.mul(reciprocal[0],G.add(...terms.map(t=>t.value))));
    reciprocal.push(value);reciprocalRows.push({order:n,terms,value});
  }
  for(let n=0;n<=order;n++){
    const terms=Array.from({length:n+1},(_,k)=>({leftOrder:k,reciprocalOrder:n-k,binomial:String(radialBinomial(n,k)),
      value:G.mul(q(radialBinomial(n,k)),leftJets[k],reciprocal[n-k])})),
      interior=G.add(...terms.map(t=>t.value)),
      exactQuotientDerivative=G.choose(x,G.zero,G.one,G.zero,interior,n===0?G.one:G.zero);
    if(n>0)sigmaJets.push(exactQuotientDerivative);
    rows.push({order:n,terms,interior,exactQuotientDerivative,originalDerivative:sigmaJets[n],
      bound:q(source.activation.ordinaryDerivativeBounds[n]),completeQuotientDerivative:true,
      exteriorDerivativesZero:n>0});
  }
  return {schema:'MathScope.N6.OriginalRadialStepDerivativeProgram/1',order,x,source,
    sigma:sigmaJets[0],sigmaJets,leftJets,rightJets,denominatorJets,reciprocal,reciprocalRows,rows,
    stepBounds:rows.map(r=>r.bound),originalStepNotReplaced:true,
    originalDefinition:'sigma_2(x)=exp(-x^-2)/(exp(-x^-2)+exp(-(1-x)^-2)) on0<x<1, extended by0/1.',
    derivativeRule:'D^n(v^-1)=-v^-1*sum_(j=1..n) binom(n,j)*D^j(v)*D^(n-j)(v^-1); the full quotient product and both seed derivatives are retained.',
    sourcePrimitiveBinding:'The zero-order root is the unchanged original G.step(x); every higher row differentiates its literal interior definition and its flat exterior joins.',
    flatJoinProof:'The exact original exp(-1/x^2) seed is flat at0. Near either endpoint the complementary seed denominator stays positive, so the quotient derivatives match the recorded constant exterior branches.',
    finiteTwelveJetExtrapolation:false,arbitraryFiniteDerivativeRecipe:true,sourceAuthenticated:false};
}

function fixedCutoffAndRho(G,{geometry,rhoOrder:order,cutoffOrder,maxWork}){
  const {Xa,Xb,X0,x0,h,middleZetaInverse}=geometry,q=(n,d=1)=>G.q(n,d),
    s=G.fresh('radial_class_source_s'),X=G.fresh('radial_class_source_X'),eta=G.fresh('radial_class_source_eta'),u=G.fresh('radial_class_source_seed_u'),
    seed=G.choose(u,G.zero,G.one,G.zero,G.exp(G.neg(G.inv(G.mul(u,G.sub(G.one,u))))),G.zero),
    mass=G.mul(q(1,10),G.integral(seed,u,G.zero,G.one)),massLower=G.div(G.exp(q(-16,3)),q(20)),
    rhat=G.sqrt(G.mul(q(2),X)),argument=G.mul(q(10),G.sub(G.div(rhat,x0),G.one)),
    sigma=G.step(argument),seedAtArgument=G.substitute(seed,u,argument),
    rhoBody=G.div(seedAtArgument,G.mul(x0,G.sqrt(s),mass)),
    seedJets=originalMeanSeedFlatJets({order,maxWork}),seedBounds=seedJets.rows.map(row=>
      G.q(BigInt(row.numeratorL1)*radialFactorial(2*row.order))),
    step=originalRadialStepDerivativeProgram(G,{order:cutoffOrder,maxWork}),
    argumentDerivatives=Array.from({length:order+1},(_,n)=>n===0?argument:
      G.mul(q(10),G.inv(x0),rhat,G.pow(X,-n),...Array.from({length:n},(_,j)=>G.sub(q(1,2),q(j))))),
    argumentBounds=Array.from({length:order+1},(_,n)=>n===0?G.one:
      G.mul(q(10),G.inv(x0),G.sqrt(G.mul(q(4),Xb)),q(radialFactorial(n)),G.pow(G.div(q(2),Xa),n))),
    bell=radialBellMajorants(G,{derivatives:argumentBounds,order,maxWork}),
    actualBell=radialBellMajorants(G,{derivatives:argumentDerivatives,order,maxWork}),
    seedDerivativeBodies=seedJets.rows.map(row=>{
      const polynomial=G.add(...row.polynomial.map((coefficient,j)=>G.mul(G.q(coefficient),G.pow(u,j)))),
        interior=G.mul(polynomial,G.pow(G.mul(u,G.sub(G.one,u)),-2*row.order),G.exp(G.neg(G.inv(G.mul(u,G.sub(G.one,u))))));
      return G.choose(u,G.zero,G.one,G.zero,interior,G.zero);
    }),profileRows=Array.from({length:order+1},(_,n)=>{
      const sumOuter=outer=>G.add(...Array.from({length:n+1},(_,j)=>G.mul(bell.table[n][j],outer[j]))),
        actualSeedDerivative=G.add(...Array.from({length:n+1},(_,j)=>G.mul(actualBell.table[n][j],G.substitute(seedDerivativeBodies[j],u,argument))));
      return {order:n,seedDerivative:actualSeedDerivative,seedBound:sumOuter(seedBounds),
        everyOriginalChainTermRetained:true};
    }),cutoffProfileRows=Array.from({length:cutoffOrder+1},(_,n)=>({order:n,
      stepDerivative:G.add(...Array.from({length:n+1},(_,j)=>G.mul(actualBell.table[n][j],G.substitute(step.sigmaJets[j],step.x,argument)))),
      stepBound:n===0?G.one:G.add(...Array.from({length:n+1},(_,j)=>G.mul(bell.table[n][j],step.stepBounds[j]))),
      everyOriginalChainTermRetained:true})),sRows=Array.from({length:order+1},(_,n)=>({order:n,
      derivative:G.mul(G.exp(G.mul(q(-1,2),G.log(s))),G.pow(s,-n),...Array.from({length:n},(_,j)=>q(-2*j-1,2))),
      bound:q(radialFactorial(n+1)*2n**BigInt(n+1))})),
    chart=fixedSlowChartMajorants(G,{s,X,eta,h,Xa,Xb,order}),
    rhoProfileRows=Array.from({length:order+1},(_,n)=>{
      const derivatives=[];
      for(let a=0;a<=n;a++)for(let b=0;b<=n-a;b++)derivatives.push({orders:[a,b,0],
        actualDerivative:G.div(G.mul(sRows[a].derivative,profileRows[b].seedDerivative),G.mul(x0,mass)),
        bound:G.div(G.mul(sRows[a].bound,profileRows[b].seedBound),G.mul(x0,massLower))});
      return {order:n,derivatives,bound:G.maximum(G.one,...derivatives.map(r=>r.bound))};
    }),cutoffRows=Array.from({length:cutoffOrder+1},(_,n)=>({order:n,
      profileBound:G.maximum(G.one,...cutoffProfileRows.slice(0,n+1).map(r=>r.stepBound)),
      bound:G.mul(chart.throughOrder[n].bound,G.maximum(G.one,...cutoffProfileRows.slice(0,n+1).map(r=>r.stepBound)))})),
    rhoRows=Array.from({length:order+1},(_,n)=>({order:n,profileBound:rhoProfileRows[n].bound,
      ordinarySlowBound:G.mul(chart.throughOrder[n].bound,rhoProfileRows[n].bound),
      weightedSlowBound:G.mul(chart.throughOrder[n].bound,rhoProfileRows[n].bound,middleZetaInverse),
      targetWeight:'zeta (and therefore zeta*delta^(-B) for every B>=0)',torusDerivativesExactlyZero:true,
      ordinaryProfileDerivativeBeforeWeight:true}));
  return {chart,cutoff:{coordinates:{s,X,eta},argument,body:sigma,step,argumentDerivatives,argumentBounds,bell,actualBell,
    profileRows:cutoffProfileRows,rows:cutoffRows,requestedDerivativeOrder:cutoffOrder,
    sourceProfile:'chi_m=step(10*(sqrt(2X)/x0-1)), x0=sqrt(2X0)*exp(1/2).',
    support:'Every positive derivative is supported between X0*exp(1) and X0*exp(1)*121/100, with flat joins.'},
    rho:{coordinates:{s,X,eta,u},body:rhoBody,seed,seedAtArgument,seedJets,seedDerivativeBodies,seedBounds,mass,massLower,sRows,
      seedProfileRows:profileRows,profileRows:rhoProfileRows,rows:rhoRows,requestedDerivativeOrder:order,
      exactNormalization:'rho=seed(10*(sqrt(2X)/x0-1))/(sqrt(s)*x0*mass), mass=(1/10)*integral_0^1 seed(u)du.',
      positiveMassProof:'On[1/4,3/4], u(1-u)>=3/16, so seed>=exp(-16/3); its interval length1/2 and factor1/10 give mass>=exp(-16/3)/20>0.',
      seedBoundProof:'The retained exact derivative is P_j(u)*[u(1-u)]^(-2j)*exp(-1/[u(1-u)]). On[0,1], |P_j|<=its integer coefficient L1 norm and exp(x)>=x^(2j)/(2j)! gives the displayed finite derivative bound. The original flat seed recurrence proves every endpoint derivative zero.',
      sameStrictSourceCollarAsCutoff:true,allRequiredMixedSlowNormsConstructed:true,
      derivativeNormsAreExactExpressionBounds:true,numericalNormValuesComputed:false}};
}

export async function prepareOriginalRadialClassMajorants(input={},context={}){
  const request=requested(input),m=request.order,p=request.ibpOrder,n=m+2*p+3,
    fourier=await prepareOriginalFourierClassMajorants({order:m,inversePower:p,maxWork:request.maxWork}),
    archive=await recordedSourceN7DomainExterior();sourceExteriorForceObservations(archive);
  const mean=archive.domain.fixedMeanMap,G=fourier.G,q=(n,d=1)=>G.q(n,d),phase=originalSourceRadialPhase(G),{h,Lambda,Tg,rho,kappa,dr}=phase,
    phaseBinding=assertOriginalSourceTorusMap(G,{h,Tg,physicalMap:{Lambda,rho,dr}}),
    Xa=G.parameter('Xa'),Xb=G.mul(G.parameter('XR'),G.exp(G.outer.stages.at(-1).end)),X0=G.parameter('X0Imean'),
    x0=G.mul(G.sqrt(G.mul(q(2),X0)),G.exp(q(1,2))),innerRadius=G.sqrt(Xa),outerRadius=G.mul(q(2),G.sqrt(Xb)),
    power=(x,a)=>G.exp(G.mul(a,G.log(x))),innerU=power(innerRadius,dr),outerU=power(outerRadius,dr),
    B=G.add(q(2),innerRadius,G.inv(innerRadius),outerRadius,innerU,G.inv(innerU),outerU),
    width=G.log(G.div(Xb,Xa)),leftGap=G.log(G.div(G.mul(X0,G.exp(G.one)),Xa)),
    rightGap=G.log(G.div(Xb,G.mul(X0,G.exp(G.one),q(121,100)))),
    collar=G.inv(G.mul(q(4),G.add(G.one,G.inv(width),G.inv(leftGap),G.inv(rightGap)))),
    a=G.pow(G.parameter('t1'),2),b=q(4),middleZetaInverse=G.exp(G.div(G.add(a,b),G.pow(collar,2))),
    geometry={Xa,Xb,X0,x0,h,innerRadius,outerRadius,innerU,outerU,B,width,leftGap,rightGap,collar,a,b,middleZetaInverse,
      sourceChart:{s:['1/2','2'],eta:['-1','1'],X:['Xa','Xb']},
      meanSupport:{left:G.mul(X0,G.exp(G.one)),right:G.mul(X0,G.exp(G.one),q(121,100))},
      sourceGapProof:'The authenticated original reserved patch log(X/X0) in[0,5] lies strictly in(Xa,Xb). Its actual cutoff/seed support log(X/X0) in[1,1+2log(11/10)] is strictly inside because log(11/10)<1/10. Thus both recorded gaps and width are positive.',
      wholeOriginalRadialEnvelope:true},
    inverseScaleOverEpsilonS=G.mul(Lambda,G.exp(G.mul(q(2),rho,G.add(G.one,h),G.log(q(2))))),
    phaseRecord={...phase,binding:phaseBinding,inverseScaleOverEpsilonS,
      originalCommonIndex:'i0=floor(((1+h)*(ell_ref-2)*log2-2log(ell_ref-2))/log(Tg))',
      exactM:'M=Lambda^i0*Q_ref^(d_r/2)',referenceS:'S_ref=ell_ref^2',
      inverseBound:'M^-1 <= inverseScaleOverEpsilonS * epsilon_ref^kappa_s * S_ref^rho_g',
      factorization:'M^-1/(Lambda*2^(2rho_g(1+h))*epsilon_ref^kappa_s*S_ref^rho_g)=Lambda^(defect-1)*(1-2/ell_ref)^(2rho_g), 0<=defect<1.',
      proof:['Use the literal original d_r/2=(1+h)rho_g-h*kappa_s and the fixed i0 at ell_ref-2.',
        'floor(x)>=x-1 gives the factor Lambda and the two-band factor2^(2rho_g(1+h)).',
        '(ell_ref-2)^(2rho_g)<=ell_ref^(2rho_g)=S_ref^rho_g; all slow and torus derivatives freeze ell_ref and i0.'],
      drRangeProof:{range:['1','4'],strict:true,
        lambdaSquaredMinusTg:'14-9sqrt(2)>0 because14^2=196>162=(9sqrt(2))^2',
        rhoRange:'1/2<rho_g<1 because Lambda^2>Tg>Lambda>1',
        hRange:'0<h<1/16 from the exact exp(-8002T), T>1',
        conclusion:'d_r=2[rho_g+h(rho_g-kappa_s)]>1 and d_r<2(1+h)rho_g<4'},
      noContinuousBandScaleSubstituted:true,noNewCommonQThreshold:true},
    change=radialChangeOfVariablesMajorants(G,{order:n,radiusBase:B,dr,maxWork:request.maxWork}),
    weight=radialGaussianWeightMajorants(G,{innerExponent:a,outerExponent:b,width,collar,radiusBase:B,pole:request.pole,maxWork:request.maxWork}),
    fixed=fixedCutoffAndRho(G,{geometry,rhoOrder:n,cutoffOrder:m+1,maxWork:request.maxWork}),{cutoff,rho:rhoSource,chart}=fixed;
  const charge=stage=>{
    context.checkCancelled?.();if(G.nodes.length>request.maxNodes)fail('The complete original radial norm graph exceeded its explicit node budget.','RESOURCE_LIMIT');
    context.onProgress?.({stage,nodeCount:G.nodes.length});
  };charge('original-radial-fixed-cutoff-rho-and-chart-norms');
  const projectionConstant=G.mul(G.sub(outerRadius,innerRadius),weight.gaussianAbsorption),
    pressureInput=Array.from({length:n+1},(_,j)=>({order:j,
      wholeHaarProjectionConstant:projectionConstant,rhoWeightedNorm:rhoSource.rows[j].weightedSlowBound,
      productCoefficientSum:String(2n**BigInt(j)),
      constant:G.add(G.one,G.mul(q(2n**BigInt(j)),rhoSource.rows[j].weightedSlowBound,projectionConstant)),
      input:'The actual g_r and all its mixed coefficient derivatives through this order, with their common M_alpha seminorm.',
      output:'f=g_r-rho*P, P=whole_R Haar(g_r); the complete source product has the same epsilon and S powers and pole.',
      normalizedHaarMass:'1',PIndependentOfRAndY:true,sourceInputBoundInvented:false})),
    rows=change.exponents.map(e=>({e:e.e,orders:Array.from({length:m+1},(_,j)=>{
      const c=e.throughOrder[j],common=G.mul(q(3n**BigInt(j)),c.outputPrefactor,c.outputComposition),
        primitive=G.mul(q(2),common,cutoff.rows[j].bound,weight.supportedHalfLineConstant,c.transformedSource),
        remainders=Array.from({length:p},(_,k)=>{
          const inv=k+1,demand=originalRadialClassDerivativeDemand({outputOrder:j,ibpOrder:inv}),sourceOrder=demand.flatRemainderInputOrder,
            fourierConstant=fourier.rows[k].operatorConstant,
            constant=G.mul(common,cutoff.rows[j+1].bound,weight.wholeIntegralConstant,middleZetaInverse,
              fourierConstant,e.throughOrder[sourceOrder].transformedSource,G.pow(inverseScaleOverEpsilonS,inv));
          return {ibpOrder:inv,demand,constant,fourierConstant,
            epsilonExponentGain:G.mul(q(inv),kappa),addedSPower:G.mul(q(inv),rho),conservativeIntegerAddedSPower:inv,
            zeroFullWeightedHaarMomentRequired:true,allSlowDerivativesOfThatMomentRequired:true,
            sourceEndpointTermsRetainedUntilSmoothZeroExtension:true,
            estimate:'||D^I A_e f|| <= constant * inputNorm_(m+2p+3) * epsilon^(alpha+p*kappa_s) * S_ref^(b+p*rho_g) * zeta*delta^(-B).'};
        });
      return {order:j,primitiveConstant:primitive,primitiveInputOrder:j,zeroMomentNeededForPrimitive:false,
        epsilonExponentChange:0,addedSPower:0,poleChange:0,remainderRows:remainders,
        primitiveEstimate:'||D^I T_e f|| <= primitiveConstant * inputNorm_m * epsilon^alpha*S_ref^b*zeta*delta^(-B), |I|<=m.',
        productRule:'The factor3^m retains every derivative distribution between R^-e, the supported cutoff and the composed half-line integral; the two signed half-lines supply the factor2.'};
    })})),
    pressureRows=rows[0].orders.map(r=>({order:r.order,input:pressureInput[r.order],
      pressureConstant:G.mul(r.primitiveConstant,pressureInput[r.order].constant),
      cutoffRemainders:r.remainderRows.map(a=>({...a,input:pressureInput[a.demand.flatRemainderInputOrder],
        constant:G.mul(a.constant,pressureInput[a.demand.flatRemainderInputOrder].constant)})),
      zeroMomentIdentity:'whole_R Haar(g_r-rho*P)=P-P*whole_R rho=0, at every slow point.',
      completePressureEquation:'p_m=T_0(g_r-rho*P), with the original full radial torus shift and original rho.'})),
    checks=[
      {id:'same-recorded-original-source-parameters-and-domain',pass:archive.archiveVerification.pass&&mean.pass&&mean.checks.every(c=>c.pass)&&
        mean.source.parameterExpressionSHA256===G.source.parameterExpressionSHA256&&mean.source.paperSHA256===G.source.sourcePaperSHA256&&
        fourier.source.parameterExpressionSHA256===G.source.parameterExpressionSHA256},
      {id:'same-original-mean-patch-and-entire-slow-strip',pass:same(mean.executedSourceUniformBound.domain,{eta:[-1,1],s:[0.5,2],y:[0,5]})&&
        mean.profiles.potentialHullIncluded&&mean.profiles.smoothZeroExtension},
      {id:'literal-original-radial-phase-and-fixed-common-index',pass:phaseBinding.comparison.allSixExpectedBodiesMatched&&
        fourier.palette.noNewSmallnessThreshold&&phaseRecord.noContinuousBandScaleSubstituted},
      {id:'actual-original-slow-chart-and-full-mixed-coefficient-rule',pass:chart.identity.pass&&
        chart.ordinaryCoefficients.length===3&&chart.ordinaryCoefficients.every(r=>r.length===3)&&chart.throughOrder.length===n+1},
      {id:'actual-flat-cutoff-and-normalized-rho-bodies-and-jets',pass:rhoSource.seedJets.completeIntegerPolynomial&&
        rhoSource.rows.length===n+1&&rhoSource.seedBounds.length===n+1&&cutoff.step.originalStepNotReplaced&&
        cutoff.step.source.pass&&cutoff.step.source.parameterExpressionSHA256===G.source.parameterExpressionSHA256&&
        cutoff.rows.length===m+2&&cutoff.step.rows.every(r=>r.completeQuotientDerivative)&&
        cutoff.profileRows.every(r=>r.everyOriginalChainTermRetained)},
      {id:'both-Gaussian-primitive-inductions-retained',pass:[weight.inner,weight.outer].every(w=>w.rows.every(r=>r.positiveCoefficientCheck.pass))},
      {id:'all-three-original-radial-weights-and-full-IBP-demand',pass:same(rows.map(r=>r.e),[0,1,2])&&rows.every(e=>e.orders.every(r=>
        r.zeroMomentNeededForPrimitive===false&&r.remainderRows.every(a=>a.demand.flatRemainderInputOrder===r.order+2*a.ibpOrder+3)))},
      {id:'complete-pressure-rho-P-product-and-normalized-Haar-projection',pass:pressureRows.length===m+1&&pressureInput.length===n+1&&
        pressureRows.every(r=>r.cutoffRemainders.every(a=>a.input.order===a.demand.flatRemainderInputOrder))},
      {id:'all-generated-operator-constants-source-only',pass:[inverseScaleOverEpsilonS,projectionConstant,
        ...rows.flatMap(e=>e.orders.flatMap(r=>[r.primitiveConstant,...r.remainderRows.map(a=>a.constant)])),
        ...pressureRows.flatMap(r=>[r.pressureConstant,...r.cutoffRemainders.map(a=>a.constant)])].every(x=>G.freeCoordinates(x).size===0)},
      {id:'positive-original-h-retained-and-input-norm-never-invented',pass:same(G.source.parametersExactExpressions.h,{exp:{product:[{integer:-8002},{ref:'T'}]}})&&
        pressureInput.every(r=>r.sourceInputBoundInvented===false)}
    ];
  if(checks.some(c=>!c.pass))fail('A fixed original radial operator premise failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const roots={h,Lambda,Tg,rho,kappa,dr,Xa,Xb,X0,x0,B,collar,inverseScaleOverEpsilonS,projectionConstant,
    actualRho:rhoSource.body,actualRhoMass:rhoSource.mass,actualCutoff:cutoff.body};
  rows.forEach(e=>e.orders.forEach(r=>{roots['T_'+e.e+'_order_'+r.order]=r.primitiveConstant;
    r.remainderRows.forEach(a=>{roots['A_'+e.e+'_order_'+r.order+'_ibp_'+a.ibpOrder]=a.constant;});}));
  pressureRows.forEach(r=>{roots['pressure_order_'+r.order]=r.pressureConstant;});
  const result={schema:'MathScope.N6.ActualFixedRadialClassMajorants/1',G,fourier,request,
    source:{profileId:G.source.id,paperSHA256:G.source.sourcePaperSHA256,parameterExpressionSHA256:G.source.parameterExpressionSHA256,
      originalDomainArchiveSHA256:archive.archiveSHA256,originalDomainArtifact:copy(archive.domainArtifact),
      originalTemporalArchiveSHA256:fourier.source.actualTemporalArchiveSHA256,sourcePages:[90,91,92,93,94],sourceEquations:['8.5','8.7','8.8','8.9','8.10','8.12'],
      originalCutoffDefinition:'source-global-current.mjs:globalMeanGeometry',originalRadialPhaseDefinition:'source-global-pressure.mjs:completeSourceCover'},
    geometry,phase:phaseRecord,cutoff,rho:rhoSource,chart,change,weight,rows,
    pressureRows,pressureInput,roots,checks,
    scope:{actualOriginalFixedRadialOperatorConstantsConstructed:true,actualOriginalRhoAllRequestedMixedNormsConstructed:true,
      exactPressureNormalizationOperatorIncluded:true,allThreeOriginalRadialWeightsIncluded:true,
      allRequestedIBPAndSourceDerivativeOrdersRetained:true,arbitraryFiniteOrderRecipe:true,
      actualCurrentReconstructed:false,actualCurrentInputMClassNormsCertified:false,actualPhysicalCutoffFlatnessCertified:false,
      allOrderCurrentClassCertified:false,allFiniteCorrectionStagesConstructed:false,completeN6:false,newLeanKernelProof:false}};
  charge('original-radial-operator-class-constants-complete');
  const metadata=record(result),program=copy(G.pack(roots,{schema:'MathScope.N6.FixedRadialClassMajorantProgram/1',metadata}));
  seals.set(result,{G,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),record:canonicalStringify(metadata),program});
  return result;
}

export function assertOriginalRadialClassMajorants(p){
  const s=seals.get(p);if(!s||s.G!==p.G||s.record!==canonicalStringify(record(p))||s.nodes!==canonicalStringify(p.G.nodes.slice(0,s.count))||
    !p.G.functionDefinitionsUnchanged(s.definitions))fail('Use the unchanged private original fixed radial class operator.');
  assertOriginalFourierClassMajorants(p.fourier);return true;
}

export async function originalRadialClassMajorantCertificate(p){
  assertOriginalRadialClassMajorants(p);const seal=seals.get(p),program=copy(seal.program),encoded=canonicalStringify(program);
  return {...record(p),schema:'MathScope.N6.ActualFixedRadialClassMajorantCertificate/1',program,
    fourierSource:await originalFourierClassMajorantCertificate(p.fourier),
    graph:{sha256:await sha256(encoded),nodeCount:seal.count,canonicalBytes:new TextEncoder().encode(encoded).length},
    fixedSourceConstantsAreExpressionsNotNumericalValues:true};
}

function scalarDefinition(G,root){
  const n=G.nodes[root];if(!['actual_expression_partial','m3_aux_expression_partial'].includes(n?.op))return root;
  const [id,values,orders]=n.args;if(orders.some(Boolean))fail('An actual scalar zero-order defining body is required.');
  const d=G.expressionSystem?G.expressionSystem(id):G.expressionSystems[id];
  if(!d)fail('The complete actual scalar source definition is missing.');
  return same(values,d.parameters)?d.body:G.simultaneousSubstitute(d.body,d.parameters,values);
}

function pressureAttachment(input,kind,operator){
  assertOriginalRadialClassMajorants(operator);
  if(kind==='initial-pressure')assertGlobalCurrentPressure(input);else assertGlobalInitializedMean(input);
  const p=kind==='initial-pressure'?input:input.temporal.pressure,G=kind==='initial-pressure'?p.G:input.G,
    current=p.current,band=current.band,g=current.mean.geometry,geo=p.geometry,{R,Z,T,Y}=geo,
    q=(n,d=1)=>G.q(n,d),start=G.nodes.length,phase=originalSourceRadialPhase(G),
    baseEll=G.sub(band.coordinates.ell,q(2)),indexArg=G.div(G.sub(G.mul(G.add(G.one,phase.h),baseEll,G.log(q(2))),G.mul(q(2),G.log(baseEll))),G.log(phase.Tg)),
    index=G.neg(G.ceiling(G.neg(indexArg))),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    expectedPrimitive=G.mul(power(phase.Lambda,index),power(G.mul(G.sqrt(band.geometry.Q),R),phase.dr)),
    originalM=G.mul(power(phase.Lambda,index),power(band.geometry.Q,G.div(phase.dr,q(2)))),
    fixedDirections=[R,Z,T,...Y],
    originalMass=G.integral(G.substitute(g.unnormalized,R,g.radialVariable),g.radialVariable,g.innerRadius,g.outerRadius),
    massRatio=G.div(originalMass,g.rhoMass),massCheck=globalGraphEqual(G,massRatio,G.one,[g.rhoMass]),
    stages=kind==='initial-pressure'?[{name:'initial-pressure',pressure:p.pressure,gr:p.radial.gr,P:p.radial.P,
      haarGr:p.radial.actualAuxiliaryZeroMode,sourceChecks:p.checks,actualHaarByCover:true}]:
      Object.entries(input.stages).map(([name,s])=>({name,pressure:s.pressure,gr:s.mean.gr,P:s.mean.P,haarGr:s.mean.haarGr,
        sourceChecks:s.checks,actualHaarByCover:false})),
    sourceRows=stages.map(stage=>{
      const s=stage.pressure,body=G.sub(stage.gr,G.mul(g.rho,stage.P)),PDefinition=scalarDefinition(G,stage.P),pn=G.nodes[PDefinition],
        exactP=pn?.op==='definite_integral'?G.integral(G.substitute(stage.haarGr,R,pn.args[1]),pn.args[1],geo.innerRadius,geo.outerRadius):null,
        haarDefinition=scalarDefinition(G,stage.haarGr),expectedHaar=Y.reduce((f,y)=>G.integral(f,y,G.zero,G.one),stage.gr),
        actualPressure=G.sub(s.integrals.left,G.mul(g.chi,s.integrals.whole)),
        actualA0=G.mul(G.derivative(g.chi,R),s.integrals.whole),
        checks=[
          {id:'complete-actual-gr-rho-P-source',pass:s.source===body&&s.integrals.body===body&&s.rho===g.rho&&s.chi===g.chi},
          {id:'complete-original-radial-translation-and-endpoint',pass:s.integrals.originalRadialPrimitive===geo.radialPrimitive&&s.integrals.endpointCheck.pass&&
            same(s.integrals.shiftedY,Y.map((y,j)=>G.add(y,G.mul(s.integrals.shift,geo.vr[j]))))},
          {id:'exact-current-P-is-full-radial-Haar-integral',pass:exactP!==null&&exactP===PDefinition&&
            (stage.actualHaarByCover?p.cover.proof.haarInvariance.allSixRetained&&p.cover.proof.haarInvariance.normalizedMeasure:
              haarDefinition===expectedHaar)},
          {id:'complete-T0-and-cutoff-error-retained',pass:s.value===actualPressure&&s.cutoffRemainder===actualA0&&s.cutoffRemainderDeclaredZero===false},
          {id:'same-private-current-source-equations-and-slow-defect',pass:stage.sourceChecks.every(c=>c.pass)&&
            [R,...Y].every(x=>!G.freeCoordinates(stage.P).has(x))}
        ];
      return {name:stage.name,gr:stage.gr,P:stage.P,haarGr:stage.haarGr,PDefinition,exactP,haarDefinition,
        normalizedHaarDefinition:expectedHaar,actualHaarCoverReductionUsed:stage.actualHaarByCover,
        source:body,pressure:s.value,cutoffRemainder:s.cutoffRemainder,wholeShiftedSource:s.integrals.whole,
        originalIntegrals:s.integrals,checks,weightedMean:{e:0,rawProjectionP:stage.P,rhoMass:g.rhoMass,
          normalizedMass:massRatio,sourceValue:G.zero,
          proof:'Fubini and normalized Haar translation invariance give whole_R Haar(g_r-rho*P)=P-P*whole_R rho=0. The retained original mass proves whole_R rho=1. Every required slow derivative of this exact identity is zero.',
          rawIntegralDeclaredNumericallyZero:false,completeActualSourceBound:true},
        bounds:copy(operator.pressureRows),constantNamespace:'fixedRadial.G',actualInputClassNormCertified:false};
    }),checks=[
      {id:'same-private-source-and-original-parameter-program',pass:current.source.paperSHA256===operator.source.paperSHA256&&
        current.source.parameterExpressionSHA256===operator.source.parameterExpressionSHA256},
      {id:'literal-original-fixed-common-radial-phase',pass:geo.referenceBaseEll===baseEll&&geo.commonIndex===index&&
        geo.radialPrimitive===expectedPrimitive&&geo.radialFast===G.derivative(expectedPrimitive,R)&&
        fixedDirections.every(x=>!G.dependsOn(originalM,x))&&geo.vr[0]===G.one&&geo.vr[1]===G.sub(G.one,G.sqrt(q(2)))},
      {id:'whole-original-radial-envelope-and-source-cutoff',pass:geo.innerRadius===G.sqrt(G.parameter('Xa'))&&
        geo.outerRadius===G.mul(q(2),G.sqrt(band.chart.Xb))&&g.chi===G.step(g.argument)&&
        g.argument===G.mul(q(10),G.sub(G.div(R,G.mul(G.sqrt(g.s),g.x0)),G.one))&&
        g.x0===G.mul(G.sqrt(G.mul(q(2),G.parameter('X0Imean'))),G.exp(q(1,2)))},
      {id:'original-positive-normalized-rho-full-mass',pass:originalMass===g.rhoMass&&g.rho===G.div(g.unnormalized,g.rhoMass)&&
        massCheck.pass&&g.checks.every(c=>c.pass)&&current.target.compatibility.pressureMeanNormalization.positiveDenominator},
      {id:'every-complete-pressure-source-and-zero-Haar-moment',pass:sourceRows.every(row=>row.checks.every(c=>c.pass))},
      {id:'input-class-premise-remains-separate',pass:sourceRows.every(row=>row.actualInputClassNormCertified===false)&&
        operator.scope.actualCurrentInputMClassNormsCertified===false}
    ];
  if(checks.some(c=>!c.pass))fail('The original radial operator does not bind this actual pressure source: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const result={schema:'MathScope.N6.ActualPressureRadialClassOperatorAttachment/1',G,input,operator,kind,
    source:{paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,
      actualSourceGraphNamespace:kind==='initial-pressure'?'pressure.G':'initializedMean.G',fixedConstantGraphNamespace:'fixedRadial.G'},
    phase:{commonIndex:index,referenceBaseEll:baseEll,radialPrimitive:expectedPrimitive,M:originalM,
      factorizationRule:'(sqrt(Q_ref)*R)^d_r=Q_ref^(d_r/2)*R^d_r for the retained positive source radii.'},
    normalization:{originalMass,rhoMass:g.rhoMass,massRatio,massCheck,chi:g.chi,rho:g.rho,
      sourceProfilePullback:'R=sqrt(2sX), so R/(sqrt(s)*x0)=sqrt(2X)/x0 on the positive original annulus. The change u=10*(R/(sqrt(s)*x0)-1) gives the same fixed mass=(1/10)integral_0^1 seed.'},
    sourceRows,checks,
    scope:{actualCompletePressureBodiesBoundToFixedRadialOperator:true,actualAutomaticZeroHaarMomentsBound:true,
      actualRhoNormsAndFullPressureProductOperatorIncluded:true,actualCurrentInputMClassNormsCertified:false,
      actualPhysicalCutoffFlatnessCertified:false,allOrderCurrentClassCertified:false,completeN6:false}};
  const metadata={...result,G:null,input:null,operator:null};
  attachments.set(result,{G,input,operator,kind,start,count:G.nodes.length,nodes:canonicalStringify(G.nodes.slice(start)),
    definitions:G.captureFunctionDefinitions(),record:canonicalStringify(metadata)});return result;
}

export const attachGlobalPressureRadialClassOperator=(pressure,operator)=>pressureAttachment(pressure,'initial-pressure',operator);
export const attachGlobalInitializedMeanRadialClassOperator=(mean,operator)=>pressureAttachment(mean,'initialized-mean',operator);

export function assertPressureRadialClassOperator(p){
  const s=attachments.get(p);if(!s||s.G!==p.G||s.input!==p.input||s.operator!==p.operator||s.kind!==p.kind||
    s.record!==canonicalStringify({...p,G:null,input:null,operator:null})||s.nodes!==canonicalStringify(p.G.nodes.slice(s.start,s.count))||
    !p.G.functionDefinitionsUnchanged(s.definitions))fail('Use the unchanged private complete-pressure radial class attachment.');
  if(p.kind==='initial-pressure')assertGlobalCurrentPressure(p.input);else assertGlobalInitializedMean(p.input);
  assertOriginalRadialClassMajorants(p.operator);return true;
}
