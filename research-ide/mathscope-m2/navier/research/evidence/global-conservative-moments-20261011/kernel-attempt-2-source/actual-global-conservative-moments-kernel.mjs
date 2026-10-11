/** Independent algebra behind the original (5.10)--(5.21).
 * These identities accept no source fields or completion flags.  Their
 * indeterminate exponents describe every order; the additive source
 * adapter must separately bind each actual coefficient and primitive.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {reduceLiteralZeroDerivatives} from './actual-strengthened-background-kernels.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

function radialDerivative(G,rules){
  const cache=new Map(),visit=id=>{
    if(rules.has(id))return rules.get(id);if(cache.has(id))return cache.get(id);
    const {op,args}=G.nodes[id];let value;
    if(['rational','coordinate','source_parameter'].includes(op))value=G.zero;
    else if(op==='add')value=G.add(...args.map(visit));
    else if(op==='multiply')value=G.add(G.mul(visit(args[0]),args[1]),G.mul(args[0],visit(args[1])));
    else if(op==='inverse')value=G.neg(G.mul(G.pow(args[0],-2),visit(args[0])));
    else if(op==='integer_power')value=G.mul(G.q(args[1]),G.pow(args[0],args[1]-1),visit(args[0]));
    else fail('UNSUPPORTED','The conservative kernel differentiates rational differential polynomials only.');
    cache.set(id,value);return value;
  };return visit;
}
const verify=(G,body)=>sourceGraphRationalIdentity(G,body,{maxTerms:100000});
const requireChecks=(checks,negative,label)=>{
  if(!Object.values(checks).every(c=>c.pass)||Object.values(negative).some(c=>c.pass))
    fail('INTERNAL_VALIDATION','The independent '+label+' identity or a negative control failed.');
};

/** The ORIGINAL axial Omega moment uses X*OmegaOverX/2. Its boundary
 * term is not the pressure primitive's boundary term multiplied by X:
 * the intervening integration by parts matters.
 */
export function originalLeadingOmegaFluxIdentity(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),{A,D,d,L,eta}=G.core,
    X=G.fresh('omega_flux_X'),names=['U','UX','Ueta','v','vX','vXX','veta','J0','J0eta','H0','H0eta','K1'],
    s=Object.fromEntries(names.map(k=>[k,G.fresh('omega_flux_'+k)])),
    dx=radialDerivative(G,new Map([[X,G.one],[s.U,s.UX],[s.v,s.vX],[s.vX,s.vXX],
      [s.J0,G.mul(X,s.v)],[s.J0eta,G.mul(X,s.veta)],
      [s.H0,G.mul(X,s.U,s.v)],[s.H0eta,G.mul(X,G.add(G.mul(s.Ueta,s.v),G.mul(s.U,s.veta)))],
      [s.K1,G.mul(X,G.pow(s.v,2))]])),
    moment=G.sub(G.div(G.add(G.mul(D,eta,s.J0eta),G.neg(s.J0),G.mul(d,s.H0eta),G.mul(q(2),D,eta,s.H0)),G.mul(q(2),L)),G.mul(q(1,4),s.K1)),
    boundary=G.mul(G.pow(X,2),G.add(G.div(s.v,G.mul(q(2),L)),G.neg(G.div(G.mul(eta,s.U,s.v),L)),G.mul(q(1,2),G.pow(s.v,2)),G.neg(s.vX))),
    prefix=G.add(moment,boundary),vPlus=G.add(s.v,G.mul(X,s.vX)),
    omegaOverX=G.add(G.div(G.add(G.mul(D,eta,s.veta),vPlus),L),
      G.mul(s.v,G.add(G.mul(q(1,2),s.v),G.mul(X,s.vX))),
      G.div(G.mul(s.U,G.sub(G.mul(d,s.veta),G.mul(q(2),eta,vPlus))),L),
      G.mul(q(-2),G.add(G.mul(q(2),s.vX),G.mul(X,s.vXX)))),
    continuityNumerator=G.add(G.mul(L,vPlus),G.mul(d,s.Ueta),G.mul(q(-2),A,eta,s.U),G.mul(q(-2),eta,X,s.UX)),
    expectedDefect=G.div(G.mul(X,s.v,continuityNumerator),G.mul(q(2),L)),
    defect=G.sub(dx(prefix),G.mul(q(1,2),X,omegaOverX)),
    checks={factorization:verify(G,G.sub(defect,expectedDefect))},
    negative={omittedViscousBoundary:verify(G,G.sub(G.sub(dx(G.add(prefix,G.mul(G.pow(X,2),s.vX))),G.mul(q(1,2),X,omegaOverX)),expectedDefect)),
      wrongOmegaWeight:verify(G,G.sub(G.sub(dx(prefix),G.mul(q(1,2),omegaOverX)),expectedDefect)),
      unprovedContinuity:verify(G,defect)};
  requireChecks(checks,negative,'weighted Omega flux');
  return {schema:'MathScope.OriginalLeadingOmegaFluxIdentity/1',pass:true,checks,negativeControls:negative,
    identity:'Q_Omega,X - X*OmegaOverX/2 = X*v/(2L) * [L*(v+X*v_X)+d*U_eta-2*A*eta*U-2*eta*X*U_X]',
    prefix:'[D*eta*J0_eta-J0+d*H0_eta+2*D*eta*H0]/(2L)-K1/4 + X^2*(v/(2L)-eta*U*v/L+v^2/2-v_X)',
    primitives:{J0_X:'X*v',J0eta_X:'X*v_eta',H0_X:'X*U*v',H0eta_X:'X*(U_eta*v+U*v_eta)',K1_X:'X*v^2'},
    boundaryAtAxis:'The genuine regular source jets make the X^2 boundary zero; each prefix has equal endpoints.',
    boundaryAtExterior:'Every boundary term vanishes only after actual v and its derivatives have ended.',
    sourceWholeFluxAuthenticated:false,sourceContinuityAuthenticated:false,newLeanKernelProof:false};
}

/** Keep both possible mass defects, for arbitrary nu=2*n*h. */
export function originalPositiveContinuityDefectIdentity(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),{A,D,d,L,eta}=G.core,
    X=G.fresh('positive_mass_X'),nu=G.fresh('positive_mass_nu'),names=['U','UX','Ueta','M','Meta','delta','deltaEta'],
    s=Object.fromEntries(names.map(k=>[k,G.fresh('positive_mass_'+k)])),
    dx=radialDerivative(G,new Map([[X,G.one],[s.U,s.UX],[s.M,G.add(s.U,s.delta)],[s.Meta,G.add(s.Ueta,s.deltaEta)]])),
    v=G.div(G.sub(G.mul(q(2),eta,s.U),G.div(G.add(G.mul(q(2),eta,G.add(D,nu),s.M),G.mul(d,s.Meta)),X)),L),
    continuity=G.add(G.mul(L,dx(G.mul(X,v))),G.mul(q(2),eta,G.sub(G.mul(G.add(G.neg(A),nu),s.U),G.mul(X,s.UX))),G.mul(d,s.Ueta)),
    expected=G.neg(G.add(G.mul(q(2),eta,G.add(D,nu),s.delta),G.mul(d,s.deltaEta))),
    checks={factorization:verify(G,G.sub(continuity,expected))},
    wrongV=G.div(G.sub(G.mul(q(2),eta,s.U),G.div(G.add(G.mul(q(2),eta,D,s.M),G.mul(d,s.Meta)),X)),L),
    wrong=G.add(G.mul(L,dx(G.mul(X,wrongV))),G.mul(q(2),eta,G.sub(G.mul(G.add(G.neg(A),nu),s.U),G.mul(X,s.UX))),G.mul(d,s.Ueta)),
    negative={omittedOrderExponent:verify(G,G.sub(wrong,expected)),unprovedMass:verify(G,continuity)};
  requireChecks(checks,negative,'positive stream continuity');
  return {schema:'MathScope.OriginalPositiveContinuityDefectIdentity/1',pass:true,checks,negativeControls:negative,
    indeterminateExponent:true,appliedExponent:'nu=2*n*h for every positive integer n',
    definition:'v=[2*eta*U-(2*eta*(D+nu)*M+d*M_eta)/X]/L',
    identity:'L*[partial_X(X*v)+Z_(-A+nu)U] = -2*eta*(D+nu)*(M_X-U)-d*partial_eta(M_X-U)',
    actualMassAndAverageSourceBound:false,axisDivisionEvaluated:false,newLeanKernelProof:false};
}

/** Pairwise conservative identities with nu_i and nu_j indeterminate.
 * Includes the complete continuity defect, so an unproved divergence-free
 * premise cannot silently disappear from the actual residual.
 */
export function originalConservativePairAndWeightIdentities(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),{A,D,d,L,eta}=G.core,
    X=G.fresh('conservative_X'),ni=G.fresh('conservative_nu_i'),nj=G.fresh('conservative_nu_j'),a=G.fresh('conservative_weight_exponent'),
    names=['Ui','UiX','Uieta','vi','viX','Fj','FjX','Fjeta','Uj','UjX','Ujeta','f','fX','fXX','feta','Pi','PiX'],
    s=Object.fromEntries(names.map(k=>[k,G.fresh('conservative_'+k)])),
    dx=radialDerivative(G,new Map([[X,G.one],[s.Ui,s.UiX],[s.vi,s.viX],[s.Fj,s.FjX],[s.Uj,s.UjX],[s.f,s.fX],[s.fX,s.fXX],[s.Pi,s.PiX]])),
    Z=(e,f,fx,fe)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(e,f),G.mul(X,fx))),G.mul(d,fe)),L),
    T=(e,f,fx,fe)=>G.div(G.add(G.neg(G.mul(e,f)),G.mul(D,eta,fe),G.mul(X,fx)),L),
    Zbar=(e,f,fe)=>G.div(G.add(G.mul(q(2),e,eta,f),G.mul(d,fe)),L),
    Tbar=(e,f,fe)=>G.div(G.add(G.neg(G.mul(e,f)),G.mul(D,eta,fe)),L),
    b=G.neg(G.add(A,q(1,2))),c=G.neg(A),
    delta=G.add(dx(G.mul(X,s.vi)),Z(G.add(c,ni),s.Ui,s.UiX,s.Uieta)),
    angularPair=G.add(G.mul(s.vi,G.add(G.mul(X,s.FjX),s.Fj)),G.mul(s.Ui,Z(G.add(b,nj),s.Fj,s.FjX,s.Fjeta))),
    axialPair=G.add(G.mul(X,s.vi,s.UjX),G.mul(s.Ui,Z(G.add(c,nj),s.Uj,s.UjX,s.Ujeta))),
    angularFlux=G.add(dx(G.mul(q(2),G.pow(X,2),s.vi,s.Fj)),G.mul(q(2),X,Z(G.add(b,c,ni,nj),G.mul(s.Ui,s.Fj),G.add(G.mul(s.UiX,s.Fj),G.mul(s.Ui,s.FjX)),G.add(G.mul(s.Uieta,s.Fj),G.mul(s.Ui,s.Fjeta))))),
    axialFlux=G.add(dx(G.mul(X,s.vi,s.Uj)),Z(G.add(G.mul(q(2),c),ni,nj),G.mul(s.Ui,s.Uj),G.add(G.mul(s.UiX,s.Uj),G.mul(s.Ui,s.UjX)),G.add(G.mul(s.Uieta,s.Uj),G.mul(s.Ui,s.Ujeta)))),
    weight2=G.mul(q(2),X,s.f),weight2eta=G.mul(q(2),X,s.feta),
    expressions={angularPair:G.sub(G.sub(G.mul(q(2),X,angularPair),angularFlux),G.neg(G.mul(q(2),X,delta,s.Fj))),
      axialPair:G.sub(G.sub(axialPair,axialFlux),G.neg(G.mul(delta,s.Uj))),
      timeWeight2:G.sub(G.mul(q(2),X,T(a,s.f,s.fX,s.feta)),G.add(Tbar(G.add(a,q(2)),weight2,weight2eta),dx(G.div(G.mul(q(2),G.pow(X,2),s.f),L)))),
      timeWeight1:G.sub(T(a,s.f,s.fX,s.feta),G.add(Tbar(G.add(a,q(1)),s.f,s.feta),dx(G.div(G.mul(X,s.f),L)))),
      axialWeight2:G.sub(G.mul(q(2),X,Z(a,s.f,s.fX,s.feta)),G.add(Zbar(G.add(a,q(2)),weight2,weight2eta),dx(G.neg(G.div(G.mul(q(4),eta,G.pow(X,2),s.f),L))))),
      axialWeight1:G.sub(Z(a,s.f,s.fX,s.feta),G.add(Zbar(G.add(a,q(1)),s.f,s.feta),dx(G.neg(G.div(G.mul(q(2),eta,X,s.f),L))))),
      angularRadialViscosity:G.sub(G.mul(q(-4),X,G.add(G.mul(X,s.fXX),G.mul(q(2),s.fX))),dx(G.mul(q(-4),G.pow(X,2),s.fX))),
      axialRadialViscosity:G.sub(G.mul(q(-2),G.add(G.mul(X,s.fXX),s.fX)),dx(G.mul(q(-2),X,s.fX))),
      pressureIntegrationByParts:G.sub(dx(G.mul(X,s.Pi)),G.add(s.Pi,G.mul(X,s.PiX)))},
    checks=Object.fromEntries(Object.entries(expressions).map(([k,v])=>[k,verify(G,v)])),
    negative={discardedAngularContinuity:verify(G,G.sub(G.mul(q(2),X,angularPair),angularFlux)),
      discardedAxialContinuity:verify(G,G.sub(axialPair,axialFlux)),
      missingRadialAngularWeight:verify(G,G.sub(angularPair,angularFlux)),
      wrongPressureIntegrationSign:verify(G,G.sub(dx(G.mul(X,s.Pi)),G.sub(s.Pi,G.mul(X,s.PiX))))};
  requireChecks(checks,negative,'conservative pair and radial weights');
  return {schema:'MathScope.OriginalConservativePairAndWeightIdentities/1',pass:true,checks,negativeControls:negative,
    pairExponents:'nu_i, nu_j remain indeterminate. The actual convolution uses nu_i+nu_j=2*n*h for every ordered pair i+j=n.',
    continuityDefect:'delta_i=partial_X(X*v_i)+Z_(-A+nu_i)U_i',
    angularIdentity:'2X*[v_i*(X*F_jX+F_j)+U_i*Z_(b+nu_j)F_j] = partial_X(2X^2*v_i*F_j)+2X*Z_(b-A+nu_i+nu_j)(U_i*F_j)-2X*delta_i*F_j',
    axialIdentity:'X*v_i*U_jX+U_i*Z_(-A+nu_j)U_j = partial_X(X*v_i*U_j)+Z_(-2A+nu_i+nu_j)(U_i*U_j)-delta_i*U_j',
    weightedIntegration:'For w=1 or2, integral w*X^(w-1)*T_a f = Tbar_(a+w) integral w*X^(w-1)*f plus [w*X^w*f/L]; replace T by Z and the boundary by [-2*w*eta*X^w*f/L].',
    pressureMoment:'integral Pi = -integral X*Pi_X + [X*Pi]; the boundary is separately source-bound.',
    boundaryTermsRetained:true,sourceGlobalMomentsAuthenticated:false,newLeanKernelProof:false};
}

/** Exact continuous moment row transformation. The lambda denominator
 * never enters this identity; zero or nonzero lambda use the same FTC.
 */
export function originalConfluentBumpMomentIdentity(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),x=G.fresh('confluent_moment_x'),lambda=G.fresh('confluent_moment_lambda'),t=G.fresh('confluent_moment_t'),
    I=G.integral(G.exp(G.mul(q(-2),lambda,t)),t,G.zero,G.log(x)),power=G.exp(G.mul(q(-2),lambda,G.log(x))),
    difference=G.sub(G.sub(G.one,G.mul(q(2),lambda,I)),power),
    derivative=G.derivative(difference,x),reduced=reduceLiteralZeroDerivatives(G,derivative),
    atOne=G.substitute(difference,x,G.one),checks={derivative:verify(G,reduced.value),valueAtOne:verify(G,atOne)},
    omittedFactor=G.sub(G.sub(G.one,I),power),wrong=reduceLiteralZeroDerivatives(G,G.derivative(omittedFactor,x)),
    negative={omittedTwoLambda:verify(G,wrong.value)};
  requireChecks(checks,negative,'continuous confluent moment');
  return {schema:'MathScope.OriginalConfluentBumpMomentIdentity/1',pass:true,checks,negativeControls:negative,
    identity:'x^(1-2*lambda)=x-2*lambda*x*integral_0^log(x) exp(-2*lambda*s) ds, x>0',
    matrixConsequence:'The original weighted U row is Umat[0]-2*lambda*Umat[1], for the FULL continuous bump integrals.',
    proof:'The difference after division by x has derivative zero and value zero at x=1; multiply by each original smooth bump and integrate on its positive support.',
    finitePointMomentSubstitution:false,positiveRealDomainRequired:true,actualMatrixOperandsAuthenticated:false,newLeanKernelProof:false};
}

/** Five separate density Jacobians. Positive-real exponent addition
 * identifies P*Q=(Rbase*u)^p, p=-2-2lambda, in the source adapter.
 * No delta-function or midpoint replaces the continuous bump B(u).
 */
export function originalIposFiveDensityJacobianIdentity(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),
    names=['Rbase','u','ef','P','Q','B','alpha','beta'],s=Object.fromEntries(names.map(k=>[k,G.fresh('five_jacobian_'+k)])),
    R=G.mul(s.Rbase,s.u),X=G.div(G.pow(R,2),q(2)),jac=G.mul(G.pow(s.Rbase,2),s.u),F0=G.mul(s.ef,s.P,s.Q),
    dU=G.div(G.mul(s.alpha,s.B),s.Rbase),dF=G.div(G.mul(s.beta,s.B),G.mul(s.Rbase,R)),
    observed=[G.mul(dU,jac),G.mul(q(2),X,dF,jac),G.mul(q(2),F0,dF,jac),G.mul(q(2),X,F0,dU,jac),G.neg(G.mul(q(2),X,F0,dF,jac))],
    expected=[G.mul(s.Rbase,s.u,s.alpha,s.B),G.mul(G.pow(s.Rbase,2),G.pow(s.u,2),s.beta,s.B),
      G.mul(q(2),s.ef,s.P,s.Q,s.beta,s.B),
      G.mul(s.ef,G.pow(s.Rbase,3),s.P,G.pow(s.u,3),s.Q,s.alpha,s.B),
      G.neg(G.mul(s.ef,G.pow(s.Rbase,2),s.P,G.pow(s.u,2),s.Q,s.beta,s.B))],
    checks=Object.fromEntries(observed.map((v,j)=>['moment'+(j+1),verify(G,G.sub(v,expected[j]))])),
    negative={omittedRadialJacobian:verify(G,G.sub(dU,expected[0])),
      omittedCentrifugalTwo:verify(G,G.sub(G.mul(F0,dF,jac),expected[2])),
      wrongAxialPressureSign:verify(G,G.add(observed[4],expected[4]))};
  requireChecks(checks,negative,'five Ipos density Jacobians');
  return {schema:'MathScope.OriginalIposFiveDensityJacobianIdentity/1',pass:true,checks,negativeControls:negative,
    substitution:'X=(Rbase*u)^2/2; dX=Rbase^2*u du; dU=alpha*B(u)/Rbase; dF=beta*B(u)/(Rbase^2*u)',
    identities:['m1: Rbase*u*alpha*B','m2: Rbase^2*u^2*beta*B','m3: 2*ef*Rbase^p*u^p*beta*B',
      'm4: ef*Rbase^(p+3)*u^(p+3)*alpha*B','m5: -ef*Rbase^(p+2)*u^(p+2)*beta*B'],
    sourcePowerRuleRequired:'P=Rbase^p, Q=u^p, p=-2-2lambda; both radii are strictly positive.',
    actualBumpBodiesAuthenticated:false,wholeMomentsReplacedBySamples:false,newLeanKernelProof:false};
}
