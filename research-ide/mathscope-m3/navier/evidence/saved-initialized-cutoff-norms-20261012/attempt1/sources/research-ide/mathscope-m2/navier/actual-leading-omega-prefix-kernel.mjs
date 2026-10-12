/** Independent exact differential-polynomial bridge for the ORIGINAL
 * order-one pressure Omega prefix. This kernel supplies no source fields.
 * Its vanishing premise is the explicit source mass/continuity identity,
 * not a user flag or a definition of the desired residual.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

function formalXDerivative(G,rules){
  const cache=new Map(),visit=id=>{
    if(rules.has(id))return rules.get(id);if(cache.has(id))return cache.get(id);
    const {op,args}=G.nodes[id];let value;
    if(['coordinate','source_parameter','rational'].includes(op))value=G.zero;
    else if(op==='add')value=G.add(...args.map(visit));
    else if(op==='multiply')value=G.add(G.mul(visit(args[0]),args[1]),G.mul(args[0],visit(args[1])));
    else if(op==='inverse')value=G.neg(G.mul(G.pow(args[0],-2),visit(args[0])));
    else if(op==='integer_power')value=G.mul(G.q(args[1]),G.pow(args[0],args[1]-1),visit(args[0]));
    else fail('UNSUPPORTED','The independent Omega prefix kernel expects a rational differential polynomial.');
    cache.set(id,value);return value;
  };return visit;
}

export function originalLeadingOmegaPrefixIdentity(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),{A,D,d,L,eta}=G.core,X=G.fresh('omega_identity_X'),
    names=['U','UX','Ueta','v','vX','vXX','veta','J','Jeta','H','Heta','K','axisVX'],
    s=Object.fromEntries(names.map(name=>[name,G.fresh('omega_identity_'+name)]));
  const rules=new Map([[X,G.one],[s.U,s.UX],[s.v,s.vX],[s.vX,s.vXX],[s.J,s.v],[s.Jeta,s.veta],
    [s.H,G.mul(s.U,s.v)],[s.Heta,G.add(G.mul(s.Ueta,s.v),G.mul(s.U,s.veta))],[s.K,G.pow(s.v,2)]]),dx=formalXDerivative(G,rules),
    moment=G.div(G.add(G.mul(D,eta,s.Jeta),G.mul(d,s.Heta),G.mul(q(-2),A,eta,s.H)),G.mul(q(2),L)),
    boundary=G.add(G.div(G.mul(X,s.v),G.mul(q(2),L)),G.neg(G.div(G.mul(eta,X,s.U,s.v),L)),
      G.mul(q(1,2),X,G.pow(s.v,2)),G.neg(s.v),G.neg(G.mul(X,s.vX))),
    prefix=G.add(moment,G.mul(q(1,4),s.K),boundary,s.axisVX),
    vPlus=G.add(s.v,G.mul(X,s.vX)),
    omegaOverX=G.add(G.div(G.add(G.mul(D,eta,s.veta),vPlus),L),
      G.mul(s.v,G.add(G.mul(q(1,2),s.v),G.mul(X,s.vX))),
      G.div(G.mul(s.U,G.sub(G.mul(d,s.veta),G.mul(q(2),eta,vPlus))),L),
      G.mul(q(-2),G.add(G.mul(q(2),s.vX),G.mul(X,s.vXX)))),
    continuity=G.add(G.mul(L,vPlus),G.mul(d,s.Ueta),G.mul(q(-2),A,eta,s.U),G.mul(q(-2),eta,X,s.UX)),
    derivative=dx(prefix),defect=G.sub(derivative,G.mul(q(1,2),omegaOverX)),factoredDefect=G.div(G.mul(s.v,continuity),G.mul(q(2),L)),
    factorization=sourceGraphRationalIdentity(G,G.sub(defect,factoredDefect)),
    missingRadialBoundary=sourceGraphRationalIdentity(G,G.sub(G.sub(dx(G.add(prefix,G.mul(X,s.vX))),G.mul(q(1,2),omegaOverX)),factoredDefect)),
    wrongOmegaSign=sourceGraphRationalIdentity(G,G.sub(G.add(derivative,G.mul(q(1,2),omegaOverX)),factoredDefect)),
    unprovedContinuity=sourceGraphRationalIdentity(G,defect);
  if(!factorization.pass||missingRadialBoundary.pass||wrongOmegaSign.pass||unprovedContinuity.pass)
    fail('INTERNAL_VALIDATION','The independent original Omega-prefix factorization or its negative controls failed.');
  return {schema:'MathScope.OriginalLeadingOmegaPrefixIdentity/1',pass:true,
    factorization,negativeControls:{missingRadialBoundary,wrongOmegaSign,unprovedContinuity},
    sourceFormula:'actual-continuation-exact-order-one.mjs: pressurePrefix / omegaOverX, before its constant closure branch',
    identities:{J_X:'v',H_X:'U*v',K_X:'v^2',mixed:'(J_eta)_X=v_eta; (H_eta)_X=U_eta*v+U*v_eta',
      defect:'partial_X P_Omega - Omega0/(2X) = v/[2L] * [L*(v+X*v_X)+d*U_eta-2*A*eta*U-2*eta*X*U_X]'},
    retainedTerms:['D*eta*J_eta','d*H_eta','-2*A*eta*H','K/4','X*v/(2L)','-eta*X*U*v/L','X*v^2/2','-v','-X*v_X','axisVX'],
    axisConstantDerivativeZero:true,axisConstantValueCheckedHere:false,sourceFieldsAuthenticated:false,
    noNumericalSamples:true,newLeanKernelProof:false};
}

/** Also retain a possible mass defect. This verifies exactly WHAT must be
 * supplied by the actual global source before the preceding defect is0.
 */
export function originalLeadingMassContinuityDefect(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),{A,D,d,L,eta}=G.core,X=G.fresh('mass_continuity_X'),
    names=['U','UX','Ueta','M','Meta','delta','deltaEta'],s=Object.fromEntries(names.map(name=>[name,G.fresh('mass_continuity_'+name)])),
    rules=new Map([[X,G.one],[s.U,s.UX],[s.M,G.add(s.U,s.delta)],[s.Meta,G.add(s.Ueta,s.deltaEta)]]),dx=formalXDerivative(G,rules),
    v=G.div(G.sub(G.sub(G.mul(q(2),eta,s.U),G.div(G.mul(q(2),D,eta,s.M),X)),G.div(G.mul(d,s.Meta),X)),L),
    continuity=G.add(G.mul(L,dx(G.mul(X,v))),G.mul(d,s.Ueta),G.mul(q(-2),A,eta,s.U),G.mul(q(-2),eta,X,s.UX)),
    expected=G.neg(G.add(G.mul(q(2),D,eta,s.delta),G.mul(d,s.deltaEta))),
    check=sourceGraphRationalIdentity(G,G.sub(continuity,expected)),
    omittedEtaMass=G.div(G.sub(G.mul(q(2),eta,s.U),G.div(G.mul(q(2),D,eta,s.M),X)),L),
    missingEtaCheck=sourceGraphRationalIdentity(G,G.sub(G.add(G.mul(L,dx(G.mul(X,omittedEtaMass))),G.mul(d,s.Ueta),G.mul(q(-2),A,eta,s.U),G.mul(q(-2),eta,X,s.UX)),expected));
  if(!check.pass||missingEtaCheck.pass)fail('INTERNAL_VALIDATION','The source mass/continuity defect or its eta negative control failed.');
  return {schema:'MathScope.OriginalLeadingMassContinuityDefect/1',pass:true,check,negativeControls:{missingEtaMass:missingEtaCheck},
    definitions:{delta:'partial_X M-U',deltaEta:'partial_eta(partial_X M-U)',
      v:'[2*eta*U-(2*D*eta*M+d*M_eta)/X]/L'},
    identity:'L*(v+X*v_X)+d*U_eta-2*A*eta*U-2*eta*X*U_X = -2*D*eta*delta-d*delta_eta',
    consequence:'The original source identities M_X=U and its eta derivative make the original Omega-prefix defect zero on X>0; the genuine regular source axis limit is a separate boundary check.',
    sourceFieldsAuthenticated:false,actualMassIdentityAssumedByThisKernel:false,zeroMassDefectRequiredForZeroContinuity:true,newLeanKernelProof:false};
}
