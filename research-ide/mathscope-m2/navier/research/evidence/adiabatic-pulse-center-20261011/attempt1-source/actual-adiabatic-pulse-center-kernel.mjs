/** Exact diagonal reduction and directed arithmetic for an actual pulse
 * center. This generic layer does not authenticate its source premises.
 * The source adapter keeps the original rounded carrier and full solution.
 */
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {covarianceMatrixAlgebra} from './actual-covariance-matrix.mjs';
import {directedArithmetic,rational as Q,readRational,qadd,qsub,qmul,qdiv,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';

const dyadic=n=>Q(1,1n<<BigInt(n));

/** Use the rational parametrization b=2z/(1-z^2),
 * sqrt(1+b^2)=(1+z^2)/(1-z^2). Every real b is covered by
 * z=b/(sqrt(1+b^2)+1) in (-1,1). This makes the positive-root
 * relation explicit without treating a square root as a rational atom.
 */
export function adiabaticProjectedDiagonalAudit(G){
  if(!G||!Array.isArray(G.nodes))fail('INVALID_INPUT','Supply an exact expression builder.');
  const q=(n,d=1)=>G.q(n,d),f=G.fresh('adiabatic_twice_F'),alpha=G.fresh('adiabatic_alpha'),sa=G.fresh('adiabatic_normal_slope'),
    z=G.fresh('adiabatic_tangent_hyperbola'),c=G.fresh('adiabatic_nonzero_frame_c'),cp=G.fresh('adiabatic_frame_c_prime'),
    b=G.div(G.mul(q(2),z),G.sub(G.one,G.pow(z,2))),t=G.div(G.add(G.one,G.pow(z,2)),G.sub(G.one,G.pow(z,2))),
    nt2=G.add(G.one,G.pow(b,2)),normal=[sa,b,G.neg(G.one)],d=G.mul(f,G.add(G.one,alpha),b),normalPrime=[d,G.zero,G.zero],
    Dn=G.add(G.pow(sa,2),nt2),K=[[G.zero,G.neg(f),G.zero],[G.neg(G.mul(f,alpha)),G.zero,G.zero],[G.zero,G.zero,G.zero]],
    Bplus=[G.one,G.sub(G.neg(G.div(G.mul(sa,b),nt2)),G.div(c,t)),G.sub(G.div(sa,nt2),G.div(G.mul(c,b),t))],
    BplusPrime=[G.zero,G.sub(G.neg(G.div(G.mul(d,b),nt2)),G.div(cp,t)),G.sub(G.div(d,nt2),G.div(G.mul(cp,b),t))],
    BleftPlus=[q(1,2),G.neg(G.div(q(1,2),G.mul(c,t))),G.neg(G.div(b,G.mul(q(2),c,t)))],
    {dot,transpose}=covarianceMatrixAlgebra(G),pressure=transpose(K).map((row,j)=>G.sub(dot(normal,row),normalPrime[j])),
    Aphi=K.map((row,i)=>row.map((x,j)=>G.add(G.neg(x),G.div(G.mul(normal[i],pressure[j]),Dn)))),
    apply=(M,x)=>M.map(row=>dot(row,x)),actual=dot(BleftPlus,apply(Aphi,Bplus).map((x,j)=>G.sub(x,BplusPrime[j]))),
    expected=G.sub(G.sub(G.neg(G.div(G.mul(sa,d),Dn)),G.mul(G.div(f,q(2)),G.add(G.div(G.mul(c,t),Dn),G.div(alpha,G.mul(c,t))))),G.div(cp,G.mul(q(2),c))),
    audit=x=>sourceGraphRationalIdentity(G,x,{maxTerms:30000}),square=audit(G.sub(G.pow(t,2),nt2)),
    normalProjection=audit(G.sub(dot(BleftPlus,normal),G.div(sa,q(2)))),movingBasis=audit(G.sub(dot(BleftPlus,BplusPrime),G.div(cp,G.mul(q(2),c)))),
    exact=audit(G.sub(actual,expected)),noPressure=Aphi.map((row,i)=>row.map((x,j)=>G.add(x,G.div(G.mul(normal[i],normalPrime[j]),Dn)))),
    omittedPressure=audit(G.sub(dot(BleftPlus,apply(noPressure,Bplus).map((x,j)=>G.sub(x,BplusPrime[j]))),expected)),
    omittedBasis=audit(G.sub(dot(BleftPlus,apply(Aphi,Bplus)),expected));
  const gamma=G.fresh('adiabatic_positive_gamma'),root=G.fresh('adiabatic_positive_reference_root'),s=G.fresh('adiabatic_reference_s'),sp=G.fresh('adiabatic_reference_s_prime'),
    actualC=G.neg(G.mul(gamma,root)),actualCp=G.div(G.mul(actualC,s,sp),G.pow(root,2)),lambda=G.div(G.mul(f,gamma),root),
    reduced=G.simultaneousSubstitute(expected,[alpha,c,cp],[G.pow(gamma,2),actualC,actualCp]),
    stable=G.sub(reduced,lambda),closed=G.add(G.neg(G.div(G.mul(sa,d),Dn)),G.neg(G.div(G.mul(s,sp),G.mul(q(2),G.pow(root,2)))),
      G.mul(G.div(lambda,q(2)),G.sub(G.add(G.div(G.mul(G.pow(root,2),t),Dn),G.inv(t)),q(2)))),
    closedWithAlpha=G.substitute(closed,alpha,G.pow(gamma,2)),stableCheck=audit(G.sub(stable,closedWithAlpha));
  const checks=[{id:'positive-tangential-hyperbola-identity',...square},{id:'normal-projection-keeps-moving-pressure',...normalProjection},
    {id:'exact-moving-basis-scalar',...movingBasis},{id:'full-projected-diagonal-reduction',...exact},{id:'reference-diagonal-subtraction',...stableCheck}];
  if(checks.some(x=>!x.pass)||omittedPressure.pass||omittedBasis.pass)fail('INTERNAL_VALIDATION','The complete adiabatic diagonal or an omitted-term control failed.');
  return {schema:'MathScope.AdiabaticProjectedDiagonalAudit/1',roots:{f,alpha,sa,z,c,cp,b,t,d,Dn,K,normal,normalPrime,pressure,Aphi,Bplus,BplusPrime,BleftPlus,actual,expected,gamma,root,s,sp,lambda,stable,closed:closedWithAlpha},
    checks,negativeControls:[{omitted:'n-prime pressure term',check:omittedPressure,correctlyRejected:true},{omitted:'B-prime connection',check:omittedBasis,correctlyRejected:true}],
    squareRootRule:{parameter:'-1<z<1',inverse:'z=b/(sqrt(1+b^2)+1)',positiveT:'(1+z^2)/(1-z^2)>0',allFiniteRealB:true,
      referenceRoot:'root=sqrt(1+s^2)>0; its square is substituted explicitly as1+s^2 only by the source adapter.'},
    identity:'M11=-sA*sA_prime/(1+sA^2+b^2)-s*s_prime/(2*(1+s^2))+(lambda/2)*[(1+s^2)*sqrt(1+b^2)/(1+sA^2+b^2)+1/sqrt(1+b^2)-2]-(damping-dref)',
    hypotheses:'F>0, alpha>0, c=-sqrt(alpha)*sqrt(1+s^2), lambda0=2F*sqrt(alpha), sA_prime=2F*(1+alpha)*b; b is frozen in pulse time.',
    noPressureOrBasisTermDropped:true,sourceAuthenticated:false,pass:true};
}

export function adiabaticTransportIdentityAudit(G){
  const q=(n,d=1)=>G.q(n,d),tau=G.fresh('adiabatic_transport_tau'),u=G.fresh('adiabatic_transport_u'),rows=[];
  for(const sign of [1,-1]){
    const s=G.mul(q(sign),u,G.add(q(1,2),tau)),D=G.add(G.one,G.pow(s,2)),initial=G.add(G.one,G.div(G.pow(u,2),q(4))),
      logTransport=G.mul(q(-3,4),G.log(G.div(D,initial))),derivative=G.derivative(logTransport,tau),
      expected=G.mul(q(-3,2),G.div(G.mul(s,q(sign),u),D)),check=sourceGraphRationalIdentity(G,G.sub(derivative,expected)),
      omittedBasis=sourceGraphRationalIdentity(G,G.sub(derivative,G.neg(G.div(G.mul(s,q(sign),u),D))));
    rows.push({sign,s,D,initial,logTransport,derivative,expected,check,negativeControl:{omitted:'half of the logarithmic connection coefficient',check:omittedBasis,correctlyRejected:!omittedBasis.pass}});
  }
  if(rows.some(r=>!r.check.pass||!r.negativeControl.correctlyRejected))fail('INTERNAL_VALIDATION','The exact scalar transport or its connection-term control failed.');
  return {schema:'MathScope.AdiabaticTransportIdentityAudit/1',rows,center:'((1+u^2/4)/(1+u^2))^(3/4)',
    endpoint:'tau=0 has logTransport=0 and tau=1/2 has the displayed center.',positiveInput:'u>0 and every logarithm argument is positive',
    exactAntiderivative:true,sourceAuthenticated:false,pass:true};
}

export function adiabaticPulseCenterControls(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance'].includes(k)))fail('INVALID_INPUT','Only directed precisionBits and an exact rational tolerance are accepted.');
  const precisionBits=input.precisionBits??192,tolerance=input.tolerance??'1/10000000000000000000000000000000000000000';
  if(!Number.isSafeInteger(precisionBits)||precisionBits<96||precisionBits>512||typeof tolerance!=='string')fail('INVALID_INPUT','Use96..512 bits and an exact rational string.');
  const tol=readRational(tolerance);
  if(qcompare(tol,Q(0))<=0||qcompare(tol,Q(1,100))>0)fail('INVALID_INPUT','The center interval-width tolerance lies in(0,1/100].');
  if(qcompare(tol,dyadic(precisionBits-20))<0)fail('PRECISION_REQUIRED','The requested tolerance leaves insufficient directed nonlinear rounding budget.');
  return {precisionBits,tolerance:qtext(tol)};
}

/** All constants are finite exact rational comparisons. The adapter must
 * prove the B/S/source premises using the original parameter expressions.
 */
export function adiabaticPulseCenterErrorAudit(){
  const rows=[],check=(id,left,relation,right)=>{const cmp=qcompare(left,right);rows.push({id,left:qtext(left),relation,right:qtext(right),pass:relation==='<'?cmp<0:relation==='='?cmp===0:cmp<=0});};
  // For |b|<=1, |delta s|<=1, u>=2, the diagonal error is bounded by
  // L*g*|delta b|/2 +u*|delta s|+u*b^2/2
  // + B*L*((5/2)*b^2+(4u+2)*|delta s|).
  const B=Q(2),pow=n=>Q(1n<<BigInt(n)),diagonalCoefficient=qadd(qadd(Q(1,2),Q(1)),qadd(Q(1,2),qadd(Q(5,2),Q(6)))),
    basePower=128,scalePower=1024,diagonalPower=14,conePower=260,offDiagonalPower=256,
    diagonalLog=dyadic(basePower*(scalePower-diagonalPower)),couplingLog=dyadic(basePower*(scalePower-conePower-offDiagonalPower)),
    halfLog=qdiv(qadd(diagonalLog,couplingLog),Q(2)),uInverseSquare=dyadic(81922),referenceCorrection=qmul(Q(3),uInverseSquare),
    absoluteRadius=dyadic(8192),total=qadd(qmul(Q(2),halfLog),referenceCorrection);
  check('finite-diagonal-coefficients-fit-B-power-reserve',diagonalCoefficient,'<',pow(14-9));
  check('actual-small-tangent-and-normal-perturbations',qmul(Q(2),dyadic(basePower*(scalePower-3))),'<=',Q(1));
  check('strong-source-frequency-exponent',Q(64,4),'=',Q(16));
  check('u-positive-finite-inverse-square',Q(81922),'=',Q(2*(1+10*4096)));
  check('small-log-error',halfLog,'<',Q(1,2));
  check('positive-full-center-error-budget',total,'<',absoluteRadius);
  check('nonzero-center-lower-before-directed-rounding',absoluteRadius,'<',Q(1,16));
  return {schema:'MathScope.AdiabaticPulseCenterErrorAudit/1',checks:rows,pass:rows.every(x=>x.pass),
    premises:{sourceAuthenticated:false,B:'B>=2^128 and B>=Renv^4096',S:'S=ell^2>=B^1024',positiveBand:'S/B<=Ls<=S',
      primitiveBounds:'2<=u<B, B^-1<gabs<B, 0<lambda0<B, 1/(R*Bs)<B^2',
      carrier:'The original nearest nonzero integer obeys|p-pTilde|<=1/k and the original selector gives k>S^8.',
      normal:'b=p/(R*Bs), b0=sign*u/(Ls*gabs), delta_b=b-b0. Thus|delta_b|<=B^2/S^8, |b|<=B^4/S, |sA-s|<=B^3/S^7 on0<=v<=Ls/2.',
      movingMatrix:'The exact diagonal formula above, M12=E12 with|E12|<=B^256/S, actual damping-dref retained.',
      fullSolution:'w(0)=(1,0), w_plus>0, |w_minus/w_plus|<=B^260/S for the same actual Volterra system.',
      environment:'Renv>2^4096, u=2*Renv^10, so u^-2<2^-81922.'},
    derivation:{frequency:'ell>=(64/h)^2 gives h*sqrt(ell)>=64. log2>1/2 and log(ell)<sqrt(ell) for ell>=8 imply log(k)>=h*ell*log2/2>16*sqrt(ell)>16*log(ell)=8*log(S), hence k>S^8. No giant integer or positive h is rounded.',
      scalar:'Since w_plus>0, d_tau log(w_plus)=Ls*M11+Ls*M12*(w_minus/w_plus). The exact reduced diagonal differs from -(3/2)*s*sign*u/(1+s^2) by at most B^14/S; the full coupling is at most B^516/S.',
      elementary:'For t=sqrt(1+b^2), |t-1|<=b^2/2, t<=2 and |sA/(1+sA^2+b^2)-s/(1+s^2)|<=|sA-s|+b^2/2. Also|D*t/Dn+1/t-2|<=3b^2+(4u+2)|sA-s|.',
      damping:'epsilon*k^2*Bs^2=lambda0/(1+u^2)^(3/2). Thus|Ls*(damping-dref)|<=B*Ls*(b^2+(2u+1)|sA-s|); its sign is not discarded.',
      integrated:'Integral_0^(1/2) -(3/2)*s*s_tau/(1+s^2) d_tau=-(3/4)*log((1+u^2)/(1+u^2/4)). Thus a_sign=Aref*exp(e_sign), |e_sign|<=halfLog.',
      reference:'Aref=((1+u^2/4)/(1+u^2))^(3/4). The inner ratio is1/4+3/(4*(1+u^2)); on[1/4,1], the derivative of x^(3/4) is<3, so0<Aref-1/(2*sqrt2)<3/u^2.',
      exponential:'For |e|<=1/2, |exp(e)-1|<=2|e|. Aref<=1, hence|a_sign-1/(2*sqrt2)|<=2*halfLog+3/u^2<2^-8192. Every remainder is strictly positive.'},
    parameters:{basePower,scalePower,diagonalPower,conePower,offDiagonalPower,diagonalLogUpper:qtext(diagonalLog),couplingLogUpper:qtext(couplingLog),halfLogUpper:qtext(halfLog),
      referenceCorrectionUpper:qtext(referenceCorrection),absoluteCenterRadius:qtext(absoluteRadius)},
    actualSourceAuthenticated:false,wholeGNUMComplete:false};
}

export function encloseAdiabaticPulseCenters(input={}){
  const request=adiabaticPulseCenterControls(input),A=directedArithmetic(request.precisionBits),audit=adiabaticPulseCenterErrorAudit(),
    reference=A.div(A.one(),A.mul(A.point(2),A.sqrt(A.point(2)))),radius=readRational(audit.parameters.absoluteCenterRadius),
    center=A.widen(reference,radius),centerSquared=A.mul(center,center),inverseCenterSquared=A.div(A.one(),centerSquared),
    boxes={center,centerSquared,inverseCenterSquared},rows=Object.entries(boxes).map(([name,box])=>({name,interval:A.pack(box),width:qtext(Q(box[1]-box[0],A.S))}));
  if(!audit.pass||center[0]<=0n)fail('INTERNAL_VALIDATION','The original center error audit did not yield a positive interval.');
  for(const row of rows)if(qcompare(readRational(row.width),readRational(request.tolerance))>0)fail('PRECISION_REQUIRED','The complete '+row.name+' enclosure exceeds the requested width.');
  return {schema:'MathScope.AdiabaticPulseCenterNumerics/1',request,rows,reference:A.pack(reference),values:Object.fromEntries(rows.map(r=>[r.name,r.interval])),
    errorAudit:audit,errorBudget:{tolerance:request.tolerance,originalPositiveAnalyticRadius:qtext(radius),directedRoundingIncluded:true,
      eachPropagatedWidthChecked:true,nonzeroSubUlpRemainderRoundedUp:true,numericalQuadratureRequired:false,exactIntegratedTransportUsed:true},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false},
    fullCoupledSolutionConditionalOnSourcePremises:true,sourceAuthenticated:false,wholeGNUMComplete:false,pass:true};
}
