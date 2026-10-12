/** Complete finite calculus and norm demand for the original radial force.
 *
 * These operations retain every original cylindrical connection and both
 * common-torus derivatives. Their generic outputs are conditional: only
 * the private same-current adapter can supply an authenticated W norm.
 */
import {originalSourceRadialPhase} from '../../mathscope-m2/navier/source-radial-phase-exponent.mjs';
import {createFactoredRationalVerifier} from './forced-rational-identity.mjs';
import {radialFactorial,radialBinomial} from './source-radial-class-kernel.mjs';

const fail=(message,code='INVALID_INPUT')=>{throw Object.assign(new Error(message),{code});},
  root=(G,x)=>Number.isSafeInteger(x)&&!!G?.nodes?.[x],
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be a finite nonnegative integer.','RESOURCE_LIMIT');return n;},
  sum=a=>a.reduce((s,n)=>s+n,0);

export function originalPressureClassDerivativeDemand(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','ibpOrder'].includes(k)))
    fail('Select finite output and integration-by-parts orders only.');
  const m=natural(input.order??0,'Output order'),p=natural(input.ibpOrder??0,'IBP order'),
    grOrder=p===0?m:m+2*p+3,covarianceOrder=grOrder+1;
  if(!Number.isSafeInteger(covarianceOrder+3))fail('The complete source derivative demand exceeds its representation range.','RESOURCE_LIMIT');
  return {schema:'MathScope.N6.OriginalPressureClassDerivativeDemand/1',order:m,ibpOrder:p,
    primitiveInputGrOrder:m,primitiveInputCovarianceOrder:m+1,
    cutoffRemainderInputGrOrder:p===0?null:grOrder,
    cutoffRemainderInputCovarianceOrder:p===0?null:covarianceOrder,
    requiredGrOrder:grOrder,requiredCommonYCovarianceOrder:covarianceOrder,
    requiredPrimaryOrder:covarianceOrder,requiredBackgroundSlowOrder:covarianceOrder+3,
    requiredTargetWeightedOrder:covarianceOrder+1,cutoffDerivativeOrder:m+1,
    allFiveMixedCoordinates:['R','Z','T','Y0','Y1'],
    inputMeaning:'The same complete pre-Haar angular covariance, including every full-curl square on all162 original rows.',
    radialForce:'g_r=-(partial_R+a L+1/R)W_rr-epsilon partial_Z W_rz+W_thetatheta/R',
    originalL:'L=partial_Y0+(1-sqrt(2))*partial_Y1',
    derivativeRule:'Every output derivative of g_r needs at most one additional derivative of the actual full covariance; all R derivatives of a and1/R remain in the full binomial product.',
    pressureRule:'T0 acts on the complete g_r-rho*P. Its orderm norm uses g_r throughm; the p-IBP A0 estimate additionally needs g_r throughm+2p+3.',
    noUnavailableSourceOrderAssumed:true,sourceAuthenticated:false};
}

/** Copy elementary exact constant programs between explicitly distinct
 * graph namespaces. Bound integral coordinates are alpha-renamed; every
 * integrand and endpoint remains. This supplies no authority by itself.
 */
export function copyClosedOriginalSourceConstants(from,to,roots,{maxWork=100000,name='pressure_class_constant'}={}){
  natural(maxWork,'Constant-copy work budget');
  if(maxWork<1||typeof from?.source?.parameterExpressionSHA256!=='string'||
    !/^[a-f0-9]{64}$/.test(from.source.parameterExpressionSHA256)||
    from.source.parameterExpressionSHA256!==to?.source?.parameterExpressionSHA256||
    !Array.isArray(roots)||roots.some(x=>!root(from,x)||from.freeCoordinates(x).size!==0))
    fail('Copy complete closed constants from the same original parameter program.');
  const mapping=new Map(),identities=[];let work=0;
  const copy=id=>{
    if(mapping.has(id))return mapping.get(id);
    if(++work>maxWork)fail('No source constant operation may be omitted at the copy limit.','RESOURCE_LIMIT');
    const n=from.nodes[id];if(!n)fail('A complete fixed source constant body is missing.');
    const {op,args}=n;let value;
    if(op==='rational')value=to.q(...args);
    else if(op==='source_parameter')value=to.parameter(args[0]);
    else if(op==='coordinate')value=to.fresh(name+'_bound');
    else if(op==='add')value=to.add(...args.map(copy));
    else if(op==='multiply')value=to.mul(...args.map(copy));
    else if(op==='inverse')value=to.inv(copy(args[0]));
    else if(op==='integer_power')value=to.pow(copy(args[0]),args[1]);
    else if(op==='exp')value=to.exp(copy(args[0]));
    else if(op==='log_positive')value=to.log(copy(args[0]));
    else if(op==='sqrt_positive')value=to.sqrt(copy(args[0]));
    else if(op==='maximum')value=to.maximum(...args.map(copy));
    else if(op==='ceiling')value=to.ceiling(copy(args[0]));
    else if(op==='source_step_derivative')value=to.step(copy(args[0]),args[1]);
    else if(op==='sine')value=to.sine(copy(args[0]));
    else if(op==='cosine')value=to.cosine(copy(args[0]));
    else if(op==='smooth_piecewise')value=to.choose(...args.map(copy));
    else if(op==='definite_integral')value=to.integral(copy(args[0]),copy(args[1]),copy(args[2]),copy(args[3]));
    else fail('An unsupported source operator cannot be copied as a numerical constant: '+op+'.','UNSUPPORTED_SOURCE_CONSTANT');
    mapping.set(id,value);identities.push({from:id,to:value,operation:op});return value;
  };
  const values=roots.map(copy);
  if(values.some(x=>to.freeCoordinates(x).size!==0))fail('A bound coordinate escaped its complete source integral.');
  return {roots:roots.map((sourceRoot,j)=>({sourceRoot,targetRoot:values[j]})),mapping,identities,work,
    parameterExpressionSHA256:from.source.parameterExpressionSHA256,
    allCopiedRootsClosed:true,allDefiningIntegrandsAndEndpointsRetained:true,
    sourceNumericalValuesUsed:false,sourceAuthenticated:false};
}

/** The actual discrete band gives an UPPER bound for the fast radial
 * multiplier, complementary to the fixed radial inverse's lower bound.
 * This identity is exact before any inequality is applied.
 */
export function originalRadialPhaseUpperFactorization(G,{ell}={}){
  if(!root(G,ell))fail('Retain the original reference band root.');
  const q=(n,d=1)=>G.q(n,d),p=originalSourceRadialPhase(G),{h,Lambda,Tg,rho,kappa,dr}=p,
    baseEll=G.sub(ell,q(2)),indexArgument=G.div(G.sub(G.mul(G.add(G.one,h),baseEll,G.log(q(2))),
      G.mul(q(2),G.log(baseEll))),G.log(Tg)),index=G.neg(G.ceiling(G.neg(indexArgument))),
    defect=G.sub(indexArgument,index),logQ=G.neg(G.mul(ell,G.log(q(2)))),
    logM=G.add(G.mul(index,G.log(Lambda)),G.mul(G.div(dr,q(2)),logQ)),
    logMOverEpsilonInverseKappa=G.add(logM,G.mul(kappa,h,logQ)),
    factors=[G.neg(G.mul(defect,G.log(Lambda))),
      G.neg(G.mul(q(2),rho,G.add(G.one,h),G.log(q(2)))),G.neg(G.mul(q(2),rho,G.log(baseEll)))],
    factorizedLog=G.add(...factors),
    identity=createFactoredRationalVerifier(G,{maxTerms:10000,maxProducts:100000})(G.sub(logMOverEpsilonInverseKappa,factorizedLog));
  if(!identity.pass)fail('The exact original floor-index radial scale did not factor.','INVALID_SOURCE_CONSTRUCTION');
  return {schema:'MathScope.N6.OriginalFastRadialScaleUpper/1',ell,baseEll,indexArgument,index,defect,
    h,Lambda,Tg,rho,kappa,dr,logQ,logM,logMOverEpsilonInverseKappa,factors,factorizedLog,identity,
    exactFactorization:'M*epsilon_ref^kappa_s=Lambda^(-defect)*2^(-2rho_g(1+h))*(ell_ref-2)^(-2rho_g)',
    bound:'0<M<=epsilon_ref^(-kappa_s)',upperConstant:G.one,additionalSPower:0,
    fixedBandRequired:true,requiredDomain:['ell_ref-2>=8','0<=defect<1','Lambda>1','rho_g>0','h>0'],
    proof:'Each displayed factor is at most1 on the original domain. All ordinary slow/common-Y derivatives freeze the original ell_ref, i0 and M; R derivatives fall only on R^d_r.',
    continuousBandScaleSubstituted:false,sourceAuthenticated:false};
}

export function exactCompleteRadialCovarianceForce(G,input){
  const {R,Z,T,Y,epsilon,radialFast:a,W}=input??{},directions=[R,Z,T,...(Y??[])];
  if(!Array.isArray(Y)||Y.length!==2||directions.some(x=>G.nodes[x]?.op!=='coordinate')||new Set(directions).size!==5||
    [epsilon,a,W?.rr,W?.rz,W?.thetatheta].some(x=>!root(G,x))||
    directions.some(x=>G.dependsOn(epsilon,x))||[Z,T,...Y].some(x=>G.dependsOn(a,x)))
    fail('Retain the five independent coordinates, fixed epsilon, original R-only fast multiplier and complete covariance.');
  const vr=[G.one,G.sub(G.one,G.sqrt(G.q(2)))],L=f=>G.add(...Y.map((y,j)=>G.mul(vr[j],G.derivative(f,y)))),
    Dr=f=>G.add(G.derivative(f,R),G.mul(a,L(f))),De=(f,e)=>G.add(Dr(f),G.div(G.mul(G.q(e),f),R)),
    slowRadial=G.derivative(W.rr,R),fastRadial=G.mul(a,L(W.rr)),connectionRR=G.div(W.rr,R),
    axial=G.mul(epsilon,G.derivative(W.rz,Z)),connectionTheta=G.div(W.thetatheta,R),
    value=G.add(G.neg(De(W.rr,1)),G.neg(axial),connectionTheta);
  return {schema:'MathScope.N6.ExactCompleteRadialCovarianceForce/1',coordinates:{R,Z,T,Y},epsilon,radialFast:a,vr,W,
    terms:{slowRadial,fastRadial,connectionRR,axial,connectionTheta},value,
    cylindricalSigns:[-1,-1,-1,-1,1],allFiveTermsRetained:true,sourceAuthenticated:false};
}

/** Executable full multi-index Leibniz identity, with every source jet
 * separately retained. Higher source jets are never replaced by zero.
 */
export function exactRadialCovarianceForceJet(G,input,{orders,maxWork=100000}={}){
  const force=exactCompleteRadialCovarianceForce(G,input),{R,Z,T,Y}=force.coordinates,
    directions=[R,Z,T,...Y],m=Array.isArray(orders)?sum(orders):-1;
  if(!Array.isArray(orders)||orders.length!==5||orders.some(n=>!Number.isSafeInteger(n)||n<0)||
    !Number.isSafeInteger(m)||!Number.isSafeInteger(maxWork)||maxWork<1||m+orders[0]+10>maxWork)
    fail('Retain a complete finite five-coordinate mixed derivative.','RESOURCE_LIMIT');
  let work=0;const derivative=(body,a)=>{
    for(let j=0;j<a.length;j++)for(let k=0;k<a[j];k++){
      if(++work>maxWork)fail('The complete radial source derivative exceeded its work budget.','RESOURCE_LIMIT');
      body=G.derivative(body,directions[j]);
    }return body;
  },raise=(a,j)=>a.map((n,k)=>n+(j===k?1:0)),lower=(a,j)=>a.map((n,k)=>n-(k===0?j:0)),
    radialRows=Array.from({length:orders[0]+1},(_,j)=>{
      const rest=lower(orders,j),aJet=derivative(force.radialFast,[j,0,0,0,0]),
        inverseRadiusJet=G.mul(G.q((j%2?-1n:1n)*radialFactorial(j)),G.pow(R,-j-1)),
        covarianceJets={rr:derivative(force.W.rr,rest),thetatheta:derivative(force.W.thetatheta,rest),
          auxiliary:Y.map((_,k)=>derivative(force.W.rr,raise(rest,k+3)))},binomial=String(radialBinomial(orders[0],j)),
        fast=G.mul(G.q(binomial),aJet,G.add(...force.vr.map((v,k)=>G.mul(v,covarianceJets.auxiliary[k])))),
        rr=G.mul(G.q(binomial),inverseRadiusJet,covarianceJets.rr),
        theta=G.mul(G.q(binomial),inverseRadiusJet,covarianceJets.thetatheta);
      return {coefficientRadialOrder:j,remainingOrders:rest,binomial,aJet,inverseRadiusJet,covarianceJets,fast,rr,theta};
    }),plain={radial:derivative(force.W.rr,raise(orders,0)),axial:G.mul(force.epsilon,derivative(force.W.rz,raise(orders,1)))},
    direct=derivative(force.value,orders),decomposed=G.add(G.neg(plain.radial),G.neg(plain.axial),
      ...radialRows.flatMap(r=>[G.neg(r.fast),G.neg(r.rr),r.theta])),
    identity=createFactoredRationalVerifier(G,{maxTerms:100000,maxProducts:1000000})(G.sub(direct,decomposed));
  return {schema:'MathScope.N6.ExactRadialCovarianceForceJet/1',force,orders:[...orders],order:m,radialRows,plain,direct,decomposed,identity,work,
    requiredCovarianceOrder:m+1,fullMultiIndexProductRule:true,sourceAuthenticated:false};
}

/** Positive majorant of that exact full product rule. Input norm and
 * coefficient envelopes remain explicit conditional operands here.
 */
export function radialCovarianceForceMajorant(G,{order,radiusBase:B,directPowerDerivativeBounds,inputNorm,maxWork=100000}={}){
  natural(order,'Output order');natural(maxWork,'Majorant work budget');
  if(maxWork<order+1||!root(G,B)||!root(G,inputNorm)||!Array.isArray(directPowerDerivativeBounds)||
    directPowerDerivativeBounds.length<order+2||directPowerDerivativeBounds.some(x=>!root(G,x)))
    fail('Keep the complete covariance norm and every fixed R^d_r derivative envelope.');
  const rows=Array.from({length:order+1},(_,j)=>({coefficientRadialOrder:j,binomial:String(radialBinomial(order,j)),
    inverseRadiusBound:G.mul(G.q(radialFactorial(j)),G.pow(B,j+1)),
    fastCoefficientBoundWithoutEpsilon:directPowerDerivativeBounds[j+1]})),
    inverseSum=G.add(...rows.map(r=>G.mul(G.q(r.binomial),r.inverseRadiusBound))),
    fastSum=G.add(...rows.map(r=>G.mul(G.q(r.binomial),r.fastCoefficientBoundWithoutEpsilon))),
    originalLNorm=G.sqrt(G.q(2)),multiplier=G.add(G.q(2),G.mul(G.q(2),inverseSum),G.mul(originalLNorm,fastSum)),
    constant=G.mul(inputNorm,multiplier);
  return {schema:'MathScope.N6.CompleteRadialCovarianceForceMajorant/1',order,inputNorm,radiusBase:B,
    directPowerDerivativeBounds:[...directPowerDerivativeBounds],rows,inverseSum,fastSum,originalLNorm,multiplier,constant,
    inputDerivativeOrder:order+1,inputEpsilonExponent:'1',outputEpsilonExponent:'1-kappa_s',
    addedSPower:0,boundaryPoleChange:0,weight:'zeta',
    plainTerms:['-partial_R W_rr','-epsilon partial_Z W_rz'],
    inverseRadiusTerms:['-W_rr/R','+W_thetatheta/R'],fastTerm:'-a*(partial_Y0+(1-sqrt2)*partial_Y1)W_rr',
    proof:[
      'For each total mixed order <=m, only the R entries can differentiate a or1/R. Every binomial(alpha_R,j) is <=binomial(m,j), and every covariance derivative has order <=m+1.',
      '|partial_R^j(1/R)|=j!*R^(-j-1)<=j!*B^(j+1). The complete original radial power bounds give |partial_R^j a|<=epsilon^(-kappa_s)*C_(j+1).',
      'The exact L coefficient l1 norm is1+|1-sqrt2|=sqrt2. Both auxiliary coordinates are retained.',
      'For0<epsilon<=1 and0<kappa_s<1, epsilon and epsilon² are <=epsilon^(1-kappa_s). This weakens the four nonfast terms safely without altering a source coefficient.',
      'The two plain terms, two inverse-radius terms and full fast binomial sum give exactly the displayed positive multiplier. No extra S power or pole is introduced by these fixed coefficient envelopes.'
    ],requiredPremises:['actual full W mixed norm throughm+1','0<epsilon<=1','0<kappa_s<1','B>=1 and R>=1/B',
      'fixed original M<=epsilon^(-kappa_s)','all displayed coefficient derivative bounds'],
    numericalInputNormAcceptedAsSourceAuthority:false,sourceAuthenticated:false};
}
