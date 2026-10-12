/** Independent reduction of each generated system to the original PDE.
 * The nonlinear lower bodies are actual source roots; no matrix-coefficient
 * fixture or caller norm is substituted into the verification.
 */
import {assertActualOrderInduction,actualInductionLinearKernel} from './actual-residual-order-induction-source.mjs';
import {sourceScaledOperators} from './actual-continuation-exact-order-two-source.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function verifyActualInductionInnerEquations(prepared,{order=prepared?.order,kind='actual'}={}){
  assertActualOrderInduction(prepared);const record=prepared.records[order];
  if(!record||order<1||!['actual','auxiliary'].includes(kind))fail('INVALID_INPUT','Use a generated positive-order system.');
  const G=prepared.G,raw=kind==='actual'?record.raw:record.auxiliary,s=G.picardSystems[raw.system],q=(n,d=1)=>G.q(n,d),{X,eta}=prepared.bootstrap.constants,{A,D,d,L}=G.core,nu=G.mul(q(2*order),G.parameter('h')),xi=s.xi,XX=G.pow(xi,2),{Z}=sourceScaledOperators(G,X,eta),at=id=>G.substitute(id,X,XX);
  const leading=prepared.records[0][kind],b=G.neg(G.add(A,q(1,2))),c=G.neg(A),F0=at(leading.F),U0=at(leading.U),v0=at(leading.v),HF=at(G.add(leading.F,G.mul(X,G.derivative(leading.F,X)))),HU=at(G.mul(X,G.derivative(leading.U,X))),ZF0=at(Z(b,leading.F)),ZU0=at(Z(c,leading.U));
  const viscF=at(Z(G.sub(b,D),Z(b,leading.F))),viscU=at(Z(G.sub(c,D),Z(c,leading.U)));
  const Ht=raw.Htheta===undefined?G.neg(viscF):at(raw.Htheta),Hz=raw.Hz===undefined?G.neg(viscU):at(raw.Hz),pKnown=at(raw.pKnown??G.mul(q(-1,2),raw.omegaOverX));
  const W=Array.from({length:6},(_,j)=>G.picardRoot(raw.system,j,xi,eta)),We=Array.from({length:6},(_,j)=>G.picardRoot(raw.system,j,xi,eta,1));
  const rhs=s.A0.map((row,i)=>G.add(s.forcing[i],...row.map((v,j)=>G.mul(v,W[j])),...s.A1[i].map((v,j)=>G.mul(v,We[j]))));
  const[F,U,K,Pi,Fxi,Uxi]=W,[Fe,Ue,Ke,Pie]=We,FX=G.div(Fxi,G.mul(q(2),xi)),UX=G.div(Uxi,G.mul(q(2),xi)),avg=G.add(U,K),avge=G.add(Ue,Ke);
  const vn=G.div(G.sub(G.sub(G.mul(q(2),eta,U),G.mul(q(2),eta,G.add(D,nu),avg)),G.mul(d,avge)),L);
  const time=(ex,f,fe,fx)=>G.div(G.add(G.neg(G.mul(ex,f)),G.mul(D,eta,fe),G.mul(XX,fx)),L),zz=(ex,f,fe,fx)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(ex,f),G.mul(XX,fx))),G.mul(d,fe)),L);
  const theta=G.add(time(G.add(b,nu),F,Fe,FX),G.mul(v0,G.add(G.mul(XX,FX),F)),G.mul(U0,zz(G.add(b,nu),F,Fe,FX)),G.mul(vn,HF),G.mul(U,ZF0),Ht,G.mul(q(-1,2),rhs[4]));
  const PiX=G.add(G.mul(q(2),F0,F),pKnown),axial=G.add(time(G.add(c,nu),U,Ue,UX),G.mul(XX,v0,UX),G.mul(U0,zz(G.add(c,nu),U,Ue,UX)),G.mul(vn,HU),G.mul(U,ZU0),zz(G.add(G.mul(q(-2),A),nu),Pi,Pie,PiX),Hz,G.mul(q(-1,2),rhs[5]));
  const avgIdentity=G.sub(G.add(G.mul(q(2),xi,avg),G.mul(XX,G.sub(G.add(rhs[1],rhs[2]),G.div(G.mul(q(2),K),xi)))),G.mul(q(2),xi,U));
  const expressions={FDerivative:G.sub(rhs[0],Fxi),UDerivative:G.sub(rhs[1],Uxi),average:avgIdentity,pressure:G.sub(rhs[3],G.mul(q(2),xi,PiX)),theta,axial};
  const atomicNodes=[...W,...We,F0,U0,v0,HF,HU,ZF0,ZU0,pKnown,...(raw.Htheta===undefined?[viscF,viscU]:[Ht,Hz])],checks=Object.fromEntries(Object.entries(expressions).map(([name,body])=>[name,sourceGraphRationalIdentity(G,body,{atomicNodes})]));
  const negative=sourceGraphRationalIdentity(G,G.sub(theta,Ht),{atomicNodes}),norm=record.norm[kind];
  const bindings={sameOriginalH:nu===raw.lambda,actualSystemOrder:s.order===order,actualSourceBound:s.tail.sourceBound===norm.C,actualNormPositiveBody:G.nodes[norm.solutionNorm].op==='exp',
    originalDiagonal:JSON.stringify(s.diagonal)==='[0,0,2,0,3,1]',allRequestedLowerOrders:order===1&&kind==='actual'||s.lowerOrders?.length===order,
    actualKnownForceOmissionRejected:!negative.pass,distinctAuxiliarySystem:record.raw.system!==record.auxiliary.system};
  const pass=Object.values(checks).every(v=>v.pass)&&Object.values(bindings).every(Boolean);
  if(!pass)fail('INTERNAL_VALIDATION','The generated actual '+kind+' order '+order+' failed its independent PDE reduction: '+Object.entries(checks).filter(([,v])=>!v.pass).map(([k])=>k).concat(Object.entries(bindings).filter(([,v])=>!v).map(([k])=>k)).join(', '));
  return {schema:'MathScope.ActualInductionInnerPDE/1',order,kind,system:raw.system,checks,bindings,negative,
    scope:{actualGeneratedMatrixChecked:true,finiteNumericSampleUsed:false,arbitraryCoefficientFieldAssumed:false,formalLeanKernelProof:false},pass};
}

export function verifyActualInductionMoments(prepared,{order=prepared?.order}={}){
  assertActualOrderInduction(prepared);if(!Number.isSafeInteger(order)||order<2||order>prepared.order)fail('INVALID_INPUT','Use a generated order at least two.');
  const r=prepared.records[order].global,G=prepared.G;
  const checks=r.momentResiduals.map(body=>sourceGraphRationalIdentity(G,body,{atomicNodes:r.incoming}));
  const negative=sourceGraphRationalIdentity(G,G.sub(r.momentResiduals[2],r.correctionMoments[2]),{atomicNodes:r.incoming});
  const pass=checks.every(v=>v.pass)&&!negative.pass;if(!pass)fail('INTERNAL_VALIDATION','The actual generated five-moment inverse did not close.');
  return {order,checks,negative,actualIncomingBodies:r.incoming,actualCorrectionBodies:r.correctionMoments,
    actualContinuousInverseRetained:true,actualWholeLowerSupport:true,pass};
}

/** Leave nu=2*n*h INDETERMINATE. This verifies the exact algebra of the
 * same universal matrix body called by the actual source constructor.
 * It is the order-independent equation step in the induction. Actual
 * lower fields/forces and their convergence bounds are supplied by the
 * separate actual constructor, never by these symbolic verification slots.
 */
export function verifyActualInductionParametricKernel(prepared){
  assertActualOrderInduction(prepared);const {G}=prepared,q=(n,d=1)=>G.q(n,d),{X,eta}=prepared.bootstrap.constants,{A,D,d,L}=G.core,leading=prepared.records[0].actual,{Z}=sourceScaledOperators(G,X,eta);
  const nu=G.fresh('indeterminate_actual_order_exponent'),xi=G.fresh('indeterminate_actual_radial_coordinate'),p=G.fresh('actual_known_pressure_slot'),Ht=G.fresh('actual_known_theta_slot'),Hz=G.fresh('actual_known_axial_slot'),XX=G.pow(xi,2),at=v=>G.substitute(v,X,XX),b=G.neg(G.add(A,q(1,2))),c=G.neg(A);
  const kernel=actualInductionLinearKernel(G,{X,eta,xi,lambda:nu,F0:leading.F,U0:leading.U,v0:leading.v,pKnown:p,Htheta:Ht,Hz}),W=Array.from({length:6},(_,i)=>G.fresh('parametric_W_'+i)),We=Array.from({length:6},(_,i)=>G.fresh('parametric_Weta_'+i));
  const rhs=kernel.matrix0.map((row,i)=>G.add(at(kernel.rawForcing[i]),...row.map((v,j)=>G.mul(at(v),W[j])),...kernel.matrix1[i].map((v,j)=>G.mul(at(v),We[j]))));
  const [F,U,K,Pi,Fxi,Uxi]=W,[Fe,Ue,Ke,Pie]=We,FX=G.div(Fxi,G.mul(q(2),xi)),UX=G.div(Uxi,G.mul(q(2),xi)),avg=G.add(U,K),avge=G.add(Ue,Ke),v=G.div(G.sub(G.sub(G.mul(q(2),eta,U),G.mul(q(2),eta,G.add(D,nu),avg)),G.mul(d,avge)),L);
  const F0=at(leading.F),U0=at(leading.U),v0=at(leading.v),HF=at(kernel.Hf),HU=at(kernel.Hu),ZF=at(Z(b,leading.F)),ZU=at(Z(c,leading.U));
  const time=(e,f,fe,fx)=>G.div(G.add(G.neg(G.mul(e,f)),G.mul(D,eta,fe),G.mul(XX,fx)),L),zz=(e,f,fe,fx)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(e,f),G.mul(XX,fx))),G.mul(d,fe)),L),PiX=G.add(G.mul(q(2),F0,F),p);
  const theta=G.add(time(G.add(b,nu),F,Fe,FX),G.mul(v0,G.add(G.mul(XX,FX),F)),G.mul(U0,zz(G.add(b,nu),F,Fe,FX)),G.mul(v,HF),G.mul(U,ZF),Ht,G.mul(q(-1,2),rhs[4]));
  const axial=G.add(time(G.add(c,nu),U,Ue,UX),G.mul(XX,v0,UX),G.mul(U0,zz(G.add(c,nu),U,Ue,UX)),G.mul(v,HU),G.mul(U,ZU),zz(G.add(G.mul(q(-2),A),nu),Pi,Pie,PiX),Hz,G.mul(q(-1,2),rhs[5]));
  const average=G.sub(G.add(G.mul(q(2),xi,avg),G.mul(XX,G.sub(G.add(rhs[1],rhs[2]),G.div(G.mul(q(2),K),xi)))),G.mul(q(2),xi,U));
  const bodies={FDerivative:G.sub(rhs[0],Fxi),UDerivative:G.sub(rhs[1],Uxi),average,pressure:G.sub(rhs[3],G.mul(q(2),xi,PiX)),theta,axial},atoms=[...W,...We,F0,U0,v0,HF,HU,ZF,ZU,p,Ht,Hz,nu];
  const checks=Object.fromEntries(Object.entries(bodies).map(([k,v])=>[k,sourceGraphRationalIdentity(G,v,{atomicNodes:atoms})])),negative=sourceGraphRationalIdentity(G,G.sub(theta,Ht),{atomicNodes:atoms});
  const producerUsesThisKernel=prepared.records.slice(1).every((r,i)=>G.picardSystems[r.auxiliary.system].linearKernel===kernel.kernel&&(i===0||G.picardSystems[r.raw.system].linearKernel===kernel.kernel)),pass=Object.values(checks).every(c=>c.pass)&&!negative.pass&&producerUsesThisKernel;
  if(!pass)fail('INTERNAL_VALIDATION','The indeterminate-order universal source matrix failed its exact PDE identity.');
  return {schema:'MathScope.ActualInductionParametricPDE/1',kernel:kernel.kernel,indeterminateExponent:nu,meaning:'Identity for every real nu, applied to nu=2*n*h at every positive integer n.',checks,negative,producerUsesThisKernel,
    verificationSlots:{nu,xi,W,We,F0,U0,v0,HF,HU,ZF,ZU,pKnown:p,Htheta:Ht,Hz,eta,h:G.parameter('h')},
    actualKernelExpressions:{matrix0:kernel.matrix0.map(r=>r.map(at)),matrix1:kernel.matrix1.map(r=>r.map(at)),forcing:kernel.rawForcing.map(at),bodies},
    exactAlgebra:true,finiteOrderSamplesUsedForUniversalIdentity:false,actualSourceForcingReplaced:false,operatorVerificationSlotsOnly:true,pass};
}
