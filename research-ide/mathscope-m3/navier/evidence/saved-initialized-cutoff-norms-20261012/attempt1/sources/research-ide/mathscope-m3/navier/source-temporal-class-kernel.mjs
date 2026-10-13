/** Exact finite class calculus for the ORIGINAL temporal mean update.
 *
 * The two Fourier desired velocities, the full T1 realization, its A1
 * remainder and slow time terms have distinct derivative demands. No
 * input seminorm is supplied by this generic arithmetic kernel.
 */
import {createFactoredRationalVerifier} from './forced-rational-identity.mjs';

const fail=(message,code='INVALID_INPUT')=>{throw Object.assign(new Error(message),{code});},
  root=(G,x)=>Number.isSafeInteger(x)&&!!G?.nodes?.[x],
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be a finite nonnegative integer.','RESOURCE_LIMIT');return n;};

export function originalTemporalClassDerivativeDemand(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','ibpOrder'].includes(k)))
    fail('Choose finite output and radial integration-by-parts orders only.');
  const m=natural(input.order??0,'Output order'),p=natural(input.ibpOrder??0,'IBP order'),
    outputWithSlowTime=m+1,desiredOrder=p===0?outputWithSlowTime:outputWithSlowTime+2*p+3,
    residualOrder=desiredOrder+4;
  if(!Number.isSafeInteger(residualOrder))fail('The full temporal source derivative demand exceeds its representation range.','RESOURCE_LIMIT');
  return {schema:'MathScope.N6.OriginalTemporalClassDerivativeDemand/1',order:m,ibpOrder:p,
    requiredDesiredVelocityOrder:desiredOrder,requiredResidualPairOrder:residualOrder,
    requiredFixedFourierOrder:desiredOrder,requiredFixedRadialOutputOrder:outputWithSlowTime,
    fixedRadialIBPOrder:Math.max(1,p),requiredCutoffDerivativeOrder:m+2,
    baseDesiredInputOrder:m+4,actualRadialVelocityInputOrder:m+5,
    actualSlowTimeInputOrder:m+5,unimprovedFastCutoffInputOrder:m+5,
    improvedFastCutoffInputOrder:p===0?null:m+2*p+8,
    equations:['8.14','8.19','8.20','8.21','8.22'],
    derivativeAccounting:[
      'Each desired Delta v or gamma_d derivative of total orderj needs the complete original E component throughj+4.',
      'T1 at orderj preserves this input order. Delta beta=-epsilon partial_Z T1 gamma_d needs T1 throughj+1.',
      'Delta gamma=gamma_d-A1 gamma_d. The unimproved A1 bound needs gamma_d throughj; its complete fixed-u integral has no extra M derivative factor.',
      'The retained slow-time derivatives and ci0*N*(-A1 gamma_d) need the corresponding desired velocities throughj+1.',
      'For p positive radial IBPs, an A1 derivative of orderj+1 needs gamma_d throughj+1+2p+3, hence E_z throughj+2p+8.'
    ],noUniformInputNormAssumed:true,sourceAuthenticated:false};
}

/** A second bound for the same actual common normalization. The Fourier
 * inverse uses ci0^-1<=C*S; bounding its fast cutoff remainder uses ci0<=1.
 * Both retain the literal floor at ell_ref-2.
 */
export function originalCommonCiUpperFactorization(G,{ell}={}){
  if(!root(G,ell))fail('Retain the actual fixed original reference band root.');
  const q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),Tg=G.add(q(4),G.sqrt(q(2))),
    baseEll=G.sub(ell,q(2)),log2=G.log(q(2)),
    indexArgument=G.div(G.sub(G.mul(G.add(G.one,h),baseEll,log2),G.mul(q(2),G.log(baseEll))),G.log(Tg)),
    index=G.neg(G.ceiling(G.neg(indexArgument))),defect=G.sub(indexArgument,index),
    logQ=G.neg(G.mul(ell,log2)),logCi=G.add(G.mul(index,G.log(Tg)),G.mul(G.add(G.one,h),logQ)),
    factors=[G.neg(G.mul(defect,G.log(Tg))),G.neg(G.mul(q(2),G.add(G.one,h),log2)),G.neg(G.mul(q(2),G.log(baseEll)))],
    factorizedLog=G.add(...factors),
    identity=createFactoredRationalVerifier(G,{maxTerms:10000,maxProducts:100000})(G.sub(logCi,factorizedLog));
  if(!identity.pass)fail('The complete original common-ci floor-index identity failed.','INVALID_SOURCE_CONSTRUCTION');
  return {schema:'MathScope.N6.OriginalCommonCiUpper/1',ell,baseEll,h,Tg,indexArgument,index,defect,logQ,logCi,factors,factorizedLog,identity,
    exactFactorization:'ci0=Tg^(-defect)*2^(-2*(1+h))*(ell_ref-2)^(-2)',
    bound:'0<ci0<=1',upperConstant:G.one,
    requiredDomain:['ell_ref-2>=8','0<=defect<1','Tg>1','h>0'],
    proof:'All three positive factors are <=1 on the authenticated original common domain. The coefficient differentiation holds ell_ref and i0 fixed.',
    continuousSSubstitutedForReferenceBand:false,sourceAuthenticated:false};
}

/** Full raw A_e norm from the original shifted whole integral. This
 * repeats no symbolic source assumption: every operand is a fixed
 * operator constant which the private wrapper must authenticate.
 */
export function originalRawTemporalCutoffMajorant(G,{order,outputPrefactor,outputComposition,
  cutoffDerivative,wholeIntegral,middleZetaInverse,transformedSource}={}){
  natural(order,'Cutoff derivative order');
  const factors=[outputPrefactor,outputComposition,cutoffDerivative,wholeIntegral,middleZetaInverse,transformedSource];
  if(factors.some(x=>!root(G,x)))fail('Retain all six fixed coefficient and integral constants for the complete A1 remainder.');
  return {order,productCoefficientSum:String(3n**BigInt(order)),factors,
    constant:G.mul(G.q(3n**BigInt(order)),...factors),
    sourceDerivativeOrder:order,epsilonExponentChange:0,addedSPower:0,
    fixedShift:'F(U+u,Y+M*u*v_r) at fixedu; all U,Z,T,Y derivatives act on F, and the cutoff is independent ofY.',
    endpointScope:'The actual source and every derivative have their smooth zero extension; no moving-shell endpoint is discarded without that premise.',
    positiveIBPGainUsed:false,sourceAuthenticated:false};
}

/** Exact finite products after all actual source and operator norms have
 * been bound. Each record is a THROUGH-order norm. Epsilon exponents are
 * the original initial alpha=1-kappa_s, without evaluating tiny h.
 */
export function composeOriginalTemporalClassRows(G,{order,desiredRows,radialRows}={}){
  natural(order,'Temporal output order');
  if(!Array.isArray(desiredRows)||!Array.isArray(radialRows)||desiredRows.length<order+2||radialRows.length<order+2)
    fail('Retain both desired components and the full T1/A1 constants through output order plus one.','RESOURCE_LIMIT');
  const valid=f=>f&&root(G,f.constant)&&Number.isSafeInteger(f.power)&&f.power>=0&&Number.isSafeInteger(f.pole)&&f.pole>=0&&
    f.epsilonExponent==='1-kappa_s'&&f.weight==='zeta'&&f.gaussian==='1';
  for(let j=0;j<=order+1;j++)if(desiredRows[j].order!==j||radialRows[j].order!==j||
    !valid(desiredRows[j].v)||!valid(desiredRows[j].gammaDesired)||
    !root(G,radialRows[j].primitiveConstant)||!root(G,radialRows[j].rawCutoffConstant))
    fail('Use complete compatible through-order initial temporal class operands.');
  const times=(f,c,epsilon=0)=>({...f,constant:G.mul(f.constant,c),epsilonExponent:epsilon?'2-kappa_s':'1-kappa_s'}),
    sum=(a,b)=>({constant:G.add(a.constant,b.constant),power:Math.max(a.power,b.power),pole:Math.max(a.pole,b.pole),
      epsilonExponent:'1-kappa_s',weight:'zeta',gaussian:'1',
      exactLowerOrderAdjustment:'S_ref>=1 and delta_*=min(1,da,db)<=1.'}),
    extended=Array.from({length:order+2},(_,j)=>{
      const desired=desiredRows[j],fixed=radialRows[j],psi=times(desired.gammaDesired,fixed.primitiveConstant),
        cutoffA1=times(desired.gammaDesired,fixed.rawCutoffConstant),gamma=sum(desired.gammaDesired,cutoffA1);
      return {order:j,v:{...desired.v},gammaDesired:{...desired.gammaDesired},psi,cutoffA1,gamma};
    }),rows=extended.slice(0,order+1).map((r,j)=>({order:j,fields:{
      v:r.v,gammaDesired:r.gammaDesired,psi:r.psi,cutoffA1:r.cutoffA1,gamma:r.gamma,
      beta:times(extended[j+1].psi,G.one,1),slowTimeAngular:times(extended[j+1].v,G.one,1),
      slowTimeAxial:times(extended[j+1].gamma,G.one,1),
      fastTimeAxialCutoff:times(extended[j+1].cutoffA1,G.sqrt(G.q(2)))},
      desiredInputOrders:{v:j+4,gamma:j+4,beta:j+5,slowTime:j+5,fastTimeAxialCutoff:j+5},
      fullGammaIsDesiredMinusActualA1:true,rawCutoffDeclaredZero:false,
      fastCutoffBound:'ci0<=1 and |sqrt2-1|+1=sqrt2; both original torus derivatives ofA1 remain.',
      physicalRadialVelocityGainsOriginalEpsilon:true}));
  return {schema:'MathScope.N6.OriginalTemporalClassFiniteProducts/1',order,rows,extended,
    allFullPotentialAndSlowTimeTermsRetained:true,flatA1InferredFromUnimprovedNorm:false,
    callerNormsGrantedSourceAuthority:false,sourceAuthenticated:false};
}
