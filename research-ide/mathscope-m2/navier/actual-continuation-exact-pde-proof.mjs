/** Actual Picard matrix -> original tangential equations.
 * The verification clears denominators of the retained source expressions.
 * It uses the infinite convergent solution operation, not a displayed finite
 * Picard iterate. Interior identities extend to the axis by the even kernel.
 */
import {assertActualFirstOrderCompleted} from './actual-continuation-exact-order-one.mjs';
import {assertActualSecondOrderCompleted} from './actual-continuation-exact-order-two.mjs';
import {sourceScaledOperators} from './actual-continuation-exact-order-two-source.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function actualInnerPDEIdentity(completed,{order=1}={}){
  if(order===1)assertActualFirstOrderCompleted(completed);else if(order===2)assertActualSecondOrderCompleted(completed);else fail('UNSUPPORTED','This receipt verifies the constructed actual orders one and two.');
  const {G,inner}=completed,{X,eta}=completed.constants,q=(n,d=1)=>G.q(n,d),{A,D,d,L}=G.core,nu=G.mul(q(2*order),G.parameter('h')),source=order===1?inner:completed.secondInner,system=G.picardSystems[source.system],xi=system.xi;
  const at=id=>G.substitute(id,X,G.pow(xi,2)),{Z}=sourceScaledOperators(G,X,eta),b=G.neg(G.add(A,q(1,2))),c=G.neg(A),beta=G.add(b,nu),gamma=G.add(c,nu),px=G.add(G.mul(q(-2),A),nu),XX=G.pow(xi,2);
  const F0=at(inner.F0),U0=at(inner.U0),v0=at(inner.v0),HF=at(G.add(inner.F0,G.mul(X,G.derivative(inner.F0,X)))),HU=at(G.mul(X,G.derivative(inner.U0,X))),ZF0=at(Z(b,inner.F0)),ZU0=at(Z(c,inner.U0));
  const viscF=order===1?at(Z(G.sub(b,D),Z(b,inner.F0))):null,viscU=order===1?at(Z(G.sub(c,D),Z(c,inner.U0))):null;
  const pKnown=at(order===1?G.mul(q(-1,2),inner.omegaOverX):source.pKnown),Ht=order===1?G.neg(viscF):at(source.Htheta),Hz=order===1?G.neg(viscU):at(source.Hz);
  const W=Array.from({length:6},(_,j)=>G.picardRoot(source.system,j,xi,eta)),We=Array.from({length:6},(_,j)=>G.picardRoot(source.system,j,xi,eta,1));
  const rhs=system.A0.map((row,i)=>G.add(system.forcing[i],...row.map((a,j)=>G.mul(a,W[j])),...system.A1[i].map((a,j)=>G.mul(a,We[j]))));
  const [F,U,K,Pi,Fxi,Uxi]=W,[Fe,Ue,Ke,Pie]=We,FX=G.div(Fxi,G.mul(q(2),xi)),UX=G.div(Uxi,G.mul(q(2),xi)),avg=G.add(U,K),avge=G.add(Ue,Ke);
  const vn=G.div(G.sub(G.sub(G.mul(q(2),eta,U),G.mul(q(2),eta,G.add(D,nu),avg)),G.mul(d,avge)),L);
  const time=(a,f,fe,fx)=>G.div(G.add(G.neg(G.mul(a,f)),G.mul(D,eta,fe),G.mul(XX,fx)),L),zz=(a,f,fe,fx)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(a,f),G.mul(XX,fx))),G.mul(d,fe)),L);
  // W4'+3 W4/xi=rhs4 and W5'+W5/xi=rhs5 turn the
  // original radial viscous terms into -rhs4/2 and -rhs5/2.
  const angular=G.add(time(beta,F,Fe,FX),G.mul(v0,G.add(G.mul(XX,FX),F)),G.mul(U0,zz(beta,F,Fe,FX)),G.mul(vn,HF),G.mul(U,ZF0),Ht,G.mul(q(-1,2),rhs[4]));
  const PiX=G.add(G.mul(q(2),F0,F),pKnown),axial=G.add(time(gamma,U,Ue,UX),G.mul(XX,v0,UX),G.mul(U0,zz(gamma,U,Ue,UX)),G.mul(vn,HU),G.mul(U,ZU0),zz(px,Pi,Pie,PiX),Hz,G.mul(q(-1,2),rhs[5]));
  const averageIdentity=G.sub(G.add(G.mul(q(2),xi,avg),G.mul(XX,G.sub(G.add(rhs[1],rhs[2]),G.div(G.mul(q(2),K),xi)))),G.mul(q(2),xi,U));
  const pressureIdentity=G.sub(rhs[3],G.mul(q(2),xi,PiX)),atomicNodes=[...W,...We,F0,U0,v0,HF,HU,ZF0,ZU0,pKnown,...(order===1?[viscF,viscU]:[Ht,Hz])];
  const expressions={FDerivative:G.sub(rhs[0],Fxi),UDerivative:G.sub(rhs[1],Uxi),average:averageIdentity,pressure:pressureIdentity,angular,axial};
  const checks=Object.fromEntries(Object.entries(expressions).map(([name,expression])=>[name,sourceGraphRationalIdentity(G,expression,{atomicNodes})]));
  const negative=sourceGraphRationalIdentity(G,G.sub(angular,Ht),{atomicNodes});
  const sourceChecks={systemOrder:system.order===order,sourceRhsPresent:system.forcing.length===6,sourceMatrixPresent:system.A0.length===6&&system.A1.length===6,
    zeroAxisDatum:system.zeroAxisDatum.every(v=>v===0),originalDiagonal:JSON.stringify(system.diagonal)==='[0,0,2,0,3,1]',
    actualSourceBound:system.tail.sourceBound===source[order===1?'C1':'C2'],positiveConvergenceModulus:system.tail.error!==G.zero&&system.tail.K!==G.zero,
    finiteDisplayedIterateNotUsed:W.every((id,j)=>G.nodes[id].op==='actual_background_picard'&&G.nodes[id].args[0]===source.system&&G.nodes[id].args[1]===j),
    sameCommonInterval:system.radialDomain[1]===G.sqrt(inner.aSquared),sourceLeadingF:system.sourceLeading.F0===F0,sourceLeadingU:system.sourceLeading.U0===U0,sourceLeadingV:system.sourceLeading.v0===v0,
    missingKnownForceRejected:!negative.pass};
  const pass=Object.values(checks).every(v=>v.pass)&&Object.values(sourceChecks).every(Boolean);
  if(!pass)fail('INTERNAL_VALIDATION','The actual Picard-to-PDE identity failed: '+Object.entries(checks).filter(([,v])=>!v.pass).map(([k])=>k).concat(Object.entries(sourceChecks).filter(([,v])=>!v).map(([k])=>k)).join(', '));
  return {schema:'MathScope.ActualInnerPDEIdentity/1',order,system:source.system,commonASquared:inner.aSquared,checks,sourceChecks,
    stateRoots:W,stateEtaRoots:We,actualForcing:system.forcing,negativeControl:{omission:'actual known angular forcing',check:negative,correctlyRejected:!negative.pass},
    meaning:'The original matrix rows, pressure reconstruction and streamfunction average imply the two actual tangential residuals are identically zero on the inner interval. The radial inverse is regular at xi=0; the axis extension is the implemented even-X profile kernel.',
    leftSupportUse:'Xminus<Xkeep<a^2. Both actual positive-order cutoffs equal one there and every Ipos correction is supported later. B8, C12, I1, I2 and the heat edit are outside this common source collar.',
    actualSourceValuesNumericallyEnclosed:false,finitePicardIterateCertifiedAsSolution:false,pass};
}
