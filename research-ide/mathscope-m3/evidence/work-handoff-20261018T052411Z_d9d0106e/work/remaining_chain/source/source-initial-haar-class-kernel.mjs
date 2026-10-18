/** Complete auxiliary-Haar initial residual, after the original leading
 * covariance cancellation. The full higher stress, curl covariance and
 * axial pressure term remain in the displayed equations and envelopes.
 */
import {radialBinomial,radialFactorial} from './source-radial-class-kernel.mjs';
import {createFactoredRationalVerifier} from './forced-rational-identity.mjs';

const fail=(message,code='INVALID_INPUT')=>{throw Object.assign(new Error(message),{code});},
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be a finite nonnegative integer.','RESOURCE_LIMIT');return n;},
  root=(G,id)=>Number.isSafeInteger(id)&&!!G?.nodes?.[id],copy=x=>structuredClone(x),
  only=(x,keys)=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.includes(k)))
    fail('Retain only the complete original Haar operands and finite request.');};

export function originalInitialHaarResidualDemand(input={}){
  only(input,['order']);const m=natural(input.order??0,'Initial Haar order');
  if(!Number.isSafeInteger(m+5))fail('The finite Haar source derivative demand exceeds its exact integer representation.','RESOURCE_LIMIT');
  return {schema:'MathScope.N6.OriginalInitialHaarResidualDemand/1',order:m,
    requiredPrimaryHaarOrder:m+1,requiredHigherStressOrder:m+1,requiredFullPressureOrder:m+1,
    requiredCommonYOrder:m+2,requiredTargetWeightedOrder:m+3,requiredBackgroundSlowOrder:m+5,
    originalLeadingCovarianceIdentityRequired:true,fullHigherStressAndCurlCovarianceRetained:true,
    originalLeadingCancellationDifferentiatesTheWholeSquaredPartition:true,
    torusDerivativeAverage:'The complete smooth periodic Haar integral of each Y derivative is zero.',
    sourceAuthenticated:false};
}

/** Exact (9.11) splitting. The caller supplies the actual complete Haar
 * fields; this identity does not by itself authenticate their origin.
 */
export function exactInitialHaarResidualSplit(G,input){
  only(input,['R','Z','T','epsilon','haarCovariance','leadingStress','higherStress','haarPressure']);
  const {R,Z,T,epsilon:e,haarCovariance:W,leadingStress:S0,higherStress:SH,haarPressure:p}=input;
  if([R,Z,T].some(x=>G.nodes[x]?.op!=='coordinate')||new Set([R,Z,T]).size!==3||
    !Array.isArray(S0)||S0.length!==2||!Array.isArray(SH)||SH.length!==2||
    [e,W?.rtheta,W?.rz,W?.thetaz,W?.zz,...S0,...SH,p].some(x=>!root(G,x))||
    [R,Z,T].some(x=>G.dependsOn(e,x)))fail('Use the full slow Haar covariance, both original stress orders and complete pressure.');
  const D=(f,c)=>G.add(G.derivative(f,R),G.div(G.mul(G.q(c),f),R)),
    verify=createFactoredRationalVerifier(G,{maxTerms:100000,maxProducts:1000000}),
    rows=[{name:'Etheta',connection:2,radial:W.rtheta,axial:W.thetaz,index:0},
      {name:'Ez',connection:1,radial:W.rz,axial:W.zz,index:1}].map(r=>{
      const fullStress=G.add(S0[r.index],SH[r.index]),covarianceRemainder=G.sub(r.radial,S0[r.index]),
        terms={radialCurlCovariance:D(covarianceRemainder,r.connection),higherOriginalStress:G.neg(D(SH[r.index],r.connection)),
          fullAxialCovariance:G.mul(e,G.derivative(r.axial,Z)),fullAxialPressure:r.name==='Ez'?G.mul(e,G.derivative(p,Z)):G.zero},
        decomposed=G.add(...Object.values(terms)),direct=G.add(D(G.sub(r.radial,fullStress),r.connection),
          G.mul(e,G.derivative(G.add(r.axial,...(r.name==='Ez'?[p]:[])),Z))),identity=verify(G.sub(direct,decomposed));
      return {...r,fullStress,leadingStress:S0[r.index],higherStress:SH[r.index],covarianceRemainder,terms,direct,decomposed,identity};
    });
  if(rows.some(r=>!r.identity.pass))fail('The complete original Haar splitting failed.','INVALID_SOURCE_CONSTRUCTION');
  return {schema:'MathScope.N6.ExactInitialHaarResidualSplit/1',input:copy(input),rows,
    leadingPartSeparatedByExactAlgebra:true,curlCovarianceRemainderDeclaredZero:false,
    higherOriginalStressDeclaredZero:false,fullPressureDerivativeRetained:true,
    actualPrimaryCovarianceIdentityStillRequired:true,sourceAuthenticated:false};
}

/** Through-order mixed C^m product envelopes. The source primary norm
 * gives epsilon^(2-2*kappa_s) for the exact curl-square remainder. The
 * paper's weaker epsilon^(3/2-2*kappa_s) is retained as a visible target.
 */
export function composeOriginalInitialHaarResidualRows(G,input={}){
  only(input,['order','radiusBase','covarianceRemainderRows','fullHaarCovarianceRows','higherStressRows','pressureRows','maxWork']);
  const m=natural(input.order??0,'Initial Haar norm order'),maxWork=natural(input.maxWork??100000,'Finite Haar work budget'),
    B=input.radiusBase,closed=id=>root(G,id)&&G.freeCoordinates(id).size===0&&
      !(G.nodes[id].op==='rational'&&BigInt(G.nodes[id].args[0])<0n);
  if(!maxWork||!closed(B)||BigInt(m+2)**2n>BigInt(maxWork))fail('The complete initial Haar norm exceeds its finite work budget.','RESOURCE_LIMIT');
  const read=(rs,exponent,name)=>{
    if(!Array.isArray(rs)||rs.length<m+2||rs.slice(0,m+2).some((r,j)=>r.order!==j||!r.field))
      fail('Generate the entire '+name+' through order '+(m+1)+'.','RESOURCE_LIMIT');
    return rs.slice(0,m+2).map(r=>{const f=r.field;
      if(!closed(f.constant)||!Number.isSafeInteger(f.power)||f.power<0||!Number.isSafeInteger(f.pole)||f.pole<0||
        f.weight!=='zeta'||f.epsilonExponent!==exponent)fail('Use the complete weighted '+name+' source norm.');return copy(f);});
  },remainder=read(input.covarianceRemainderRows,'2-2*kappa_s','Haar curl covariance remainder'),
    covariance=read(input.fullHaarCovarianceRows,'1','full Haar covariance'),
    higher=read(input.higherStressRows,'3','higher original stress'),
    pressure=read(input.pressureRows,'1-kappa_s','full shifted pressure'),
    inverse=Array.from({length:m+1},(_,j)=>G.mul(G.q(radialFactorial(j)),G.pow(B,j+1))),
    connection=(rs,j,c)=>G.mul(G.q(c),G.add(...Array.from({length:j+1},(_,k)=>
      G.mul(G.q(radialBinomial(j,k)),inverse[k],rs[j-k].constant)))),
    rows=Array.from({length:m+1},(_,j)=>{
      const fields=Object.fromEntries([['Etheta',2],['Ez',1]].map(([name,c])=>{
        const terms={curlSlowRadial:remainder[j+1].constant,curlConnection:connection(remainder,j,c),
          higherStressSlowRadial:higher[j+1].constant,higherStressConnection:connection(higher,j,c),
          fullAxialCovariance:covariance[j+1].constant,fullAxialPressure:name==='Ez'?pressure[j+1].constant:G.zero},
          inputs=[...remainder.slice(0,j+2),...higher.slice(0,j+2),covariance[j+1],...(name==='Ez'?[pressure[j+1]]:[])];
        return [name,{constant:G.add(...Object.values(terms)),power:Math.max(...inputs.map(f=>f.power)),
          pole:Math.max(...inputs.map(f=>f.pole)),epsilonExponent:'2-2*kappa_s',epsilonExponentExact:'99999/50000',
          conservativePaperExponent:'3/2-2*kappa_s',conservativePaperExponentExact:'74999/50000',
          originalRequiredExponent:'149/100',positiveMarginOverOriginalRequirement:'499/50000',
          weight:'zeta',gaussian:'1',terms,
          retainedTermExponents:{curlSlowRadial:'2-2*kappa_s',curlConnection:'2-2*kappa_s',
            higherStressSlowRadial:'3',higherStressConnection:'3',fullAxialCovariance:'2',
            fullAxialPressure:name==='Ez'?'2-kappa_s':null}}];
      }));return {order:j,fields,completeInverseRadiusLeibnizTerms:j+1};
    });
  return {schema:'MathScope.N6.OriginalInitialHaarResidualNormRows/1',order:m,rows,inverseRadiusBounds:inverse,
    inputs:{remainder,covariance,higher,pressure},
    leadingCancellationRequired:'For rtheta and rz, the complete leading primary Haar covariance equals the original leading stress Sigma^(0), on the complete squared partition.',
    originalTorusDerivativesVanishOnlyUnderCompletePeriodicHaar:true,
    exactCurlSquareRemainderUsed:true,originalFullStressAndPressureRetained:true,
    zeroInitialMeanVelocityRequired:true,sourceAuthenticated:false,
    proof:['Apply every mixed derivative of total order at most m to the two full identities (9.11).',
      'Each slow derivative consumes the next through-order input. For c/R, the full radial Leibniz sum has coefficients binomial(m,k)*c*k!*B^(k+1).',
      'The actual primary identity cancels only the leading tensor. Every curl covariance remainder remains with exponent 2-2*kappa_s.',
      'The higher stress exponent3, full axial covariance exponent2 and complete axial pressure exponent2-kappa_s can be weakened to 2-2*kappa_s because 0<epsilon<=1.',
      'S_ref>=1 and delta_*<=1 permit the largest complete input degree and pole. No derivative of a partition or pressure mode is deleted.',
      'The original kappa_s=1/100000 gives 3/2-2*kappa_s-149/100=499/50000>0.']};
}
