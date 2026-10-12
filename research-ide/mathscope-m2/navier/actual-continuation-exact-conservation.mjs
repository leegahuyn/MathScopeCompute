/** Actual moment identities -> the conservative stress total identities.
 * Every zero family below has an executed algebraic proof on its actual
 * expression body. No constant-zero caller receipt is accepted.
 */
import {assertActualFirstOrderCompleted} from './actual-continuation-exact-order-one.mjs';
import {assertActualSecondOrderCompleted} from './actual-continuation-exact-order-two.mjs';
import {assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {actualLeadingSubtractedAngularProof} from './actual-continuation-exact-leading-conservation.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function actualConservativeMomentProof(first,second,heat){
  assertActualFirstOrderCompleted(first);assertActualSecondOrderCompleted(second);assertActualHeatLeading(heat);
  const {G}=first;if(second.G!==G||heat.G!==G)fail('INVALID_SOURCE_CONSTRUCTION','Both actual orders and the complete heat field must share their original source graph.');
  const q=(n,d=1)=>G.q(n,d),{eta,lambda}=first.constants,{D,d,L}=G.core,h=G.parameter('h'),r1=first.orderOne,r2=second.orderTwo,zeroSystems=new Map(),zeroFamilies=[];
  const sourceProofs=new Map();
  function checkedFamily(name,body,atomicNodes,source,normalization=null){
    if(normalization&&(normalization.originalRoot!==body||!normalization.pass||!normalization.analyticRewrite?.verified))fail('INVALID_SOURCE_CONSTRUCTION','An actual zero-family analytic normalization must retain its proved original body.');
    const check=normalization?normalization.check:sourceGraphRationalIdentity(G,body,{atomicNodes});if(!check.pass)fail('INTERNAL_VALIDATION','The actual zero function '+name+' did not cancel.');
    const system=G.defineExpressionFunction({name,parameters:[eta],body,derivativeLimits:[2]}),value=G.expressionValue(system,[eta]);
    zeroSystems.set(system,{body,check});zeroFamilies.push({name,body,system,value,check,source,...(normalization?{analyticNormalization:normalization}: {})});return value;
  }
  const moments=[];
  for(const [order,r] of [[1,r1],[2,r2]]){
    const residuals=r.momentResiduals??r.residuals;
    moments[order]=residuals.map((body,j)=>{
      const value=checkedFamily('ActualCorrectedMoment_'+order+'_'+(j+1),body,r.moments,{order,moment:j+1,incoming:r.moments[j],correction:r.correctionMoments[j]});
      sourceProofs.set(order+':'+j,zeroFamilies.at(-1));return value;
    });
  }
  const leading=first.originalLeading,b8=leading.loop.b8,pre=leading.pre;
  const b8M=G.add(pre.discrepancy[0],G.mul(pre.constants.XR,pre.constants.Keta,pre.constants.mu,G.quadraticSystems[b8.system].rhs[0]));
  const b8MCheck=sourceGraphRationalIdentity(G,b8M,{atomicNodes:[pre.discrepancy[0]]});
  const i1M=G.add(leading.actualDebts[0],G.mul(leading.constants.X0,leading.constants.K,lambda,G.quadraticSystems[leading.system].rhs[0]));
  const i1MCheck=sourceGraphRationalIdentity(G,i1M,{atomicNodes:[leading.actualDebts[0]]});
  const pulse=G.outer.equations.pulse,amplitude=G.outer.roots.amplitude;
  const pulseResiduals=pulse.linear.map((row,i)=>G.sub(G.add(...row.map((v,j)=>G.mul(v,pulse.coefficients[j]))),G.add(pulse.incoming[i],G.mul(amplitude,pulse.perAmplitude[i]))));
  const pulseChecks=pulseResiduals.map(body=>sourceGraphRationalIdentity(G,body,{atomicNodes:[amplitude,...pulse.incoming,...pulse.perAmplitude]}));
  const angular=G.outer.equations.angular,angularResidual=G.sub(G.add(...angular.linear[0].map((v,j)=>G.mul(v,angular.coefficients[j]))),angular.target[0]);
  const angularCheck=sourceGraphRationalIdentity(G,angularResidual,{atomicNodes:[angular.coefficients[1],angular.target[0]]});
  const expectedWait=G.div(G.log(G.div(G.outer.roots.Qb,G.outer.roots.Qp)),G.sub(G.one,h)),waitBinding=expectedWait===G.outer.roots.terminalWait;
  const H=heat.heat,heatSystem=G.quadraticSystems[H.system],heatDebts=[H.heatI,H.heatS,H.heatCp],heatBodies=heatDebts.map((v,j)=>G.add(v,G.mul(lambda,H.norm[j],heatSystem.rhs[j])));
  const heatChecks=heatBodies.map((body,j)=>sourceGraphRationalIdentity(G,body,{atomicNodes:[heatDebts[j],H.norm[j]]}));
  const sourceRootChecks={B8Contraction:Object.values(b8.proof.checks).every(Boolean),I1Contraction:Object.values(leading.proof.checks).every(Boolean),I2Contraction:Object.values(H.proof.checks).every(Boolean),
    actualB8MassCancellation:b8MCheck.pass,actualI1MassCancellation:i1MCheck.pass,actualOuterPulseMassAndMixedMoments:pulseChecks.every(c=>c.pass),
    actualOuterAngularLinearMoment:angularCheck.pass,actualTerminalWaitExpression:waitBinding,actualWholeHeatMomentCancellation:heatChecks.every(c=>c.pass),
    heatTailNotTruncated:heat.program.heat.tailTruncated===false,actualHeatRootOperands:H.values.every((id,j)=>G.nodes[id].op==='actual_quadratic_root'&&G.nodes[id].args[0]===H.system&&G.nodes[id].args[1]===j),
    actualIposInverseNonzero:Object.values(r1.proof.checks).every(Boolean)};
  if(!Object.values(sourceRootChecks).every(Boolean))fail('INTERNAL_VALIDATION','The actual leading conservative moment chain failed: '+Object.entries(sourceRootChecks).filter(([,v])=>!v).map(([k])=>k).join(', '));
  // The fixed-point equations replace the polynomial in the ACTUAL roots
  // by its ACTUAL rhs, not by an iterate or a norm upper bound. B8/I1 keep
  // the source A.2 flux, whose two literal pulse equations are checked above.
  const leadingMassBody=G.add(b8M,i1M,pulseResiduals[0]),leadingMass=checkedFamily('ActualLeadingAxialTotal',leadingMassBody,[pre.discrepancy[0],leading.actualDebts[0],amplitude,...pulse.incoming,...pulse.perAmplitude],{source:'A.2 outer flux, B.8, C.12/I1; I2 and heat change E only.'});
  const leadingAngularProof=actualLeadingSubtractedAngularProof(first,heat);
  const leadingAngular=checkedFamily('ActualLeadingHeatSubtractedAngularTotal',leadingAngularProof.originalRoot,[],{source:'Actual A.11 angular reset, A.13 terminal primitive, B8/I1 angular corrections and H8-H14/I2; the complete original subtracted moment (5.19).',heatDebt:H.heatI,heatCorrectionRootSystem:H.system},leadingAngularProof);
  const Tbar=(a,m)=>G.div(G.add(G.neg(G.mul(a,m)),G.mul(D,eta,G.derivative(m,eta))),L);
  const Zbar=(a,m)=>G.div(G.add(G.mul(q(2),a,eta,m),G.mul(d,G.derivative(m,eta))),L);
  const totals=[];
  for(const order of [1,2]){
    const nu=G.mul(q(2*order),h),previousNu=G.mul(q(2*(order-1)),h),m=moments[order],previousM1=order===1?leadingMass:moments[1][0],previousM2=order===1?leadingAngular:moments[1][1],angularWeight=G.add(q(1,2),G.mul(q(-2),h),nu);
    const theta=G.sub(G.add(Tbar(G.add(G.sub(G.one,h),nu),m[1]),Zbar(angularWeight,m[3])),Zbar(angularWeight,Zbar(G.add(G.sub(G.one,h),previousNu),previousM2)));
    const zz=G.sub(G.add(Tbar(G.add(D,nu),m[0]),Zbar(G.sub(nu,G.mul(q(2),h)),m[4])),Zbar(previousNu,Zbar(G.add(D,previousNu),previousM1)));
    totals.push({order,theta,z:zz,actualCurrentMomentResidualBodies:(order===1?r1.momentResiduals:r2.residuals),lowerFamilies:[previousM2,previousM1]});
  }
  const cache=new Map(),trace=[];
  function reduce(id){
    if(cache.has(id))return cache.get(id);const{op,args}=G.nodes[id];let out=id;
    if(op==='actual_expression_partial'&&zeroSystems.has(args[0])&&args[1].length===1&&args[1][0]===eta){
      const proof=zeroSystems.get(args[0]);if(G.expressionSystems[args[0]].body!==proof.body||!proof.check.pass)fail('INVALID_SOURCE_CONSTRUCTION','The actual zero-family body changed.');
      out=G.zero;trace.push({node:id,system:args[0],body:proof.body,etaOrder:args[2][0],rule:'derivative of the proved identical-zero actual moment function'});
    }else if(op==='add')out=G.add(reduce(args[0]),reduce(args[1]));
    else if(op==='multiply'){const a=reduce(args[0]);out=a===G.zero?G.zero:G.mul(a,reduce(args[1]));}
    else if(op==='inverse')out=G.inv(reduce(args[0]));
    else if(op==='integer_power')out=G.pow(reduce(args[0]),args[1]);
    cache.set(id,out);return out;
  }
  const reductions=totals.map(row=>({...row,thetaReduced:reduce(row.theta),zReduced:reduce(row.z)}));
  const pass=reductions.every(row=>row.thetaReduced===G.zero&&row.zReduced===G.zero);
  if(!pass)fail('INTERNAL_VALIDATION','The actual conservative stress moment identities did not reduce to zero.');
  return {schema:'MathScope.ActualConservativeMomentProof/1',zeroFamilies,sourceRootChecks,
    leading:{B8Mass:{body:b8M,check:b8MCheck},I1Mass:{body:i1M,check:i1MCheck},outerPulse:pulseResiduals.map((body,j)=>({body,check:pulseChecks[j]})),outerAngular:{body:angularResidual,check:angularCheck},terminalWait:{actual:G.outer.roots.terminalWait,expected:expectedWait,pass:waitBinding},heat:heatBodies.map((body,j)=>({body,actualDebt:heatDebts[j],check:heatChecks[j]})),actualI2RootSystem:H.system,actualI2PolynomialResiduals:heat.program.I2.residual},
    leadingAngularProof,totals:reductions,rewriteTrace:trace,source:'Original (5.19)-(5.21), Lemma5.2; the conservative identities follow by radial integration by parts with the displayed compact support and the complete source heat-subtracted moment.',
    operators:{Tbar:'(-a*m+D*eta*d_eta m)/L',Zbar:'(2*a*eta*m+d*d_eta m)/L',theta:'Tbar_(1-h+nu_n)m_n2 + Zbar_(1/2-2h+nu_n)m_n4 - Zbar_(1/2-2h+nu_n) Zbar_(1-h+nu_(n-1))m_(n-1)2',z:'Tbar_(D+nu_n)m_n1 + Zbar_(nu_n-2h)m_n5 - Zbar_(nu_(n-1)) Zbar_(D+nu_(n-1))m_(n-1)1'},
    correctedMomentSourceProofs:[...sourceProofs].map(([key,value])=>({key,...value})),
    denominatorObligations:{IposDeterminants:r1.proof,otherScales:'Rbase>0, ef>0, lambda>0, L>=1-2h>0 on the real source eta interval; Qb,Qp>0 in the source-order proof. No denominator is proved nonzero merely by rational cancellation.'},
    numericQuadratureValuesUsed:false,finiteImplicitIteratesSubstituted:false,pass};
}
