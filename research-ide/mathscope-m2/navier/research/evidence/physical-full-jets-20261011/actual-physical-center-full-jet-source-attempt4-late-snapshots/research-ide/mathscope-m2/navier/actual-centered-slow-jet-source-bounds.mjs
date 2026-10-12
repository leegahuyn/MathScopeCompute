/** Explicit finite bounds for the centered slow numerical adapter.
 * Generic algebra and scalar bounds here do not authenticate a source.
 * The adapter separately binds original roots, the open terminal identity,
 * the complete Gamma density, original target factor and selected band.
 */
import {actualMovingPulseFrame,covarianceMatrixAlgebra} from './actual-covariance-matrix.mjs';
import {ellOneSourceScalarIdentity} from './actual-covariance-ell-one-obstruction.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {rational as Q,qadd,qmul,qdiv,qcompare,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';
import {adiabaticReplaceExactOperands} from './actual-adiabatic-pulse-center-kernel.mjs';
import {retainedCommonDenominatorIdentity} from './actual-third-jet-algebra.mjs';

/** The same complete moving frame in tau=v/L, after cancelling the
 *positive frozen normal scale Bs. The actual small coefficients remain.
 */
export function centeredNormalizedFullFrame(G,input){
  const names=['F','FR','FZ','R','tau','beta','inverseLength','epsilon','lambda0','c0','u','dampingScale'];
  if(!input||Object.keys(input).some(k=>!names.includes(k)&&k!=='sign')||names.some(k=>!Number.isSafeInteger(input[k])||!G.nodes[input[k]])||![1,-1].includes(input.sign)||G.nodes[input.tau].op!=='coordinate')
    fail('INVALID_INPUT','Supply the retained complete normalized frame inputs and an independent tau coordinate.');
  const {F,FR,FZ,R,tau,beta,inverseLength:l,epsilon,lambda0,c0,u,dampingScale,sign}=input,q=(n,d=1)=>G.q(n,d),{dot,transpose,mul,sub}=covarianceMatrixAlgebra(G),
    n=[G.sub(G.mul(q(sign,2),u),G.mul(tau,beta,FR)),G.div(G.mul(l,beta),R),G.sub(G.q(-1),G.mul(epsilon,tau,beta,FZ))],
    nTau=n.map(x=>G.derivative(x,tau)),nPrime=nTau.map(x=>G.mul(l,x)),nSquared=dot(n,n),
    K=[[G.zero,G.neg(G.mul(q(2),F)),G.zero],[G.add(G.mul(q(2),F),G.mul(R,FR)),G.zero,G.zero],[G.zero,G.zero,G.zero]],
    nTK=transpose(K).map(row=>dot(n,row)),pressureNumerator=nTK.map((x,j)=>G.sub(x,nPrime[j])),
    Aphi=K.map((row,i)=>row.map((x,j)=>G.add(G.neg(x),G.div(G.mul(n[i],pressureNumerator[j]),nSquared)))),
    nt=G.sqrt(G.add(G.pow(n[1],2),G.pow(n[2],2))),Ka=[G.div(n[1],nt),G.div(n[2],nt)],Na=[Ka[1],G.neg(Ka[0])],sa=G.div(n[0],nt),
    s=G.mul(q(sign),u,G.add(q(1,2),tau)),root=G.sqrt(G.add(G.one,G.pow(s,2))),c=G.mul(c0,root),
    U=[[G.one,G.zero],[G.neg(G.mul(sa,Ka[0])),Na[0]],[G.neg(G.mul(sa,Ka[1])),Na[1]]],J=[[G.one,G.one],[c,G.neg(c)]],
    Uleft=[[G.one,G.zero,G.zero],[G.zero,Na[0],Na[1]]],Jinverse=[[q(1,2),G.div(q(1,2),c)],[q(1,2),G.neg(G.div(q(1,2),c))]],
    B=mul(U,J),BPrime=B.map(row=>row.map(x=>G.mul(l,G.derivative(x,tau)))),Bleft=mul(Jinverse,Uleft),projected=mul(Bleft,sub(mul(Aphi,B),BPrime)),
    lambda=G.div(lambda0,root),d=G.mul(dampingScale,nSquared),dref=G.div(G.mul(lambda0,G.add(G.one,G.pow(s,2))),G.pow(G.sqrt(G.add(G.one,G.pow(u,2))),3)),
    wMatrix=projected.map((row,i)=>row.map((x,j)=>i===j?G.sub(x,G.add(lambda,G.sub(d,dref))):x));
  return {input,n,nTau,nPrime,nSquared,K,pressureNumerator,Aphi,nt,Ka,Na,sa,s,c,U,J,B,BPrime,Bleft,projected,lambda,d,dref,wMatrix,
    sourceAuthenticated:false,fullMovingPressureRetained:true,fullMovingBasisRetained:true};
}

export function centeredNormalizedFullFrameAudit(G){
  const q=(n,d=1)=>G.q(n,d),names=['F','FR','FZ','R','tau','beta','inverseLength','epsilon','lambda0','c0','u','frequency','v'],
    x=Object.fromEntries(names.map(n=>[n,G.fresh('centered_normalized_'+n)])),checks=[],rows=[];
  const length=G.fresh('centered_normalized_length');x.inverseLength=G.inv(length);
  for(const sign of[1,-1]){
    const input={...Object.fromEntries(names.slice(0,11).map(k=>[k,x[k]])),sign,dampingScale:G.mul(x.epsilon,G.pow(x.frequency,2))},
      normalized=centeredNormalizedFullFrame(G,input),p=G.mul(x.inverseLength,x.beta),
      rawInput={F:x.F,FR:x.FR,GR:G.zero,R:x.R,epsilon:x.epsilon,k:x.frequency,p,pz:q(-1),x0:G.mul(q(sign,2),x.u),v:x.v,Ls:length,u:x.u,c0:x.c0,lambda0:x.lambda0,
        HR:G.mul(p,x.FR),HZ:G.mul(p,x.FZ),sign},raw=actualMovingPulseFrame(G,rawInput),
      at=body=>G.substitute(body,x.tau,G.mul(x.inverseLength,x.v)),converted=normalized.wMatrix.map(row=>row.map(at)),replacements=[],partChecks=[];
    const pair=(name,left,right)=>{
      const l=adiabaticReplaceExactOperands(G,left,replacements),r=adiabaticReplaceExactOperands(G,right,replacements),structural=ellOneSourceScalarIdentity(G,l,r),
        check=structural.pass?structural:sourceGraphRationalIdentity(G,G.sub(l,r),{maxTerms:12000});
      partChecks.push({name,left,right,check,pass:check.pass});
      if(check.pass&&left!==right){const atom=G.isq(left)?left:G.fresh('centered_tau_identity_'+sign+'_'+name);replacements.push([left,atom],[right,atom]);}
      return check;
    };
    raw.n.forEach((body,j)=>pair('normal_'+j,body,at(normalized.n[j])));pair('normal_square',raw.nSquared,at(normalized.nSquared));
    pair('tangent_norm',raw.nt,at(normalized.nt));pair('reference_s',raw.s,at(normalized.s));
    const rawReferenceRoot=G.sqrt(G.add(G.one,G.pow(raw.s,2))),normalizedReferenceRoot=at(G.sqrt(G.add(G.one,G.pow(normalized.s,2))));
    pair('reference_root',rawReferenceRoot,normalizedReferenceRoot);pair('reference_c',raw.J[1][0],at(normalized.c));
    for(const key of['Aphi','B','BPrime','Bleft'])raw[key].forEach((row,i)=>row.forEach((body,j)=>pair(key+'_'+i+'_'+j,body,at(normalized[key][i][j]))));
    pair('lambda',raw.reference.lambda,at(normalized.lambda));pair('damping',raw.actualDamping,at(normalized.d));pair('reference_damping',raw.reference.dref,at(normalized.dref));
    const matrixChecks=raw.wMatrix.flatMap((row,i)=>row.map((body,j)=>({row:i,column:j,...pair('matrix_'+i+'_'+j,body,converted[i][j])})));
    checks.push(...matrixChecks.map(c=>({id:'complete-tau-conversion-'+sign+'-'+c.row+'-'+c.column,...c})),{id:'every-time-conversion-intermediate-'+sign,pass:partChecks.every(c=>c.pass)});
    rows.push({sign,rawInput,rawMatrix:raw.wMatrix,normalized,converted,matrixChecks,partChecks,exactOperandReplacements:replacements});
  }
  const F0=G.fresh('centered_comparison_F0'),gamma=G.fresh('centered_comparison_gamma'),
    alpha=G.pow(gamma,2),FR0=G.fresh('centered_comparison_FR0'),Fa=G.fresh('centered_comparison_local_F'),FRa=G.fresh('centered_comparison_local_FR'),Ra=G.fresh('centered_comparison_local_R'),
    D0=G.add(G.one,G.pow(x.u,2)),lambda0=G.mul(q(2),F0,gamma),lambda=G.div(lambda0,G.sqrt(D0)),dscale=G.div(lambda0,G.pow(G.sqrt(D0),3)),
    localAlpha=G.sub(G.neg(G.div(G.mul(Ra,FRa),G.mul(q(2),Fa))),G.one),comparison=[];
  for(const sign of[1,-1]){
    const beta=G.neg(G.div(G.mul(q(sign),x.u),FR0)),n=centeredNormalizedFullFrame(G,{F:Fa,FR:FRa,FZ:G.zero,R:Ra,tau:x.tau,beta,inverseLength:G.zero,
      epsilon:G.zero,lambda0,c0:G.neg(gamma),u:x.u,dampingScale:dscale,sign}),actual=G.substitute(n.wMatrix[0][0],x.tau,q(1,2)),
      sa=G.mul(q(sign,2),x.u,G.add(G.one,G.div(FRa,FR0))),D=G.add(G.one,G.pow(sa,2)),
      expected=G.sub(G.sub(G.mul(G.div(lambda,q(2)),G.div(Fa,F0),G.add(G.div(D0,D),G.div(localAlpha,alpha))),lambda),G.mul(lambda,G.sub(G.div(D,D0),G.one))),
      root=G.sqrt(D0),symbolicRoot=G.fresh('centered_comparison_positive_reference_root_'+sign),
      roots=[],seen=new Set(),scan=id=>{if(seen.has(id))return;seen.add(id);const n=G.nodes[id];
        if(n.op==='sqrt_positive'&&sourceGraphRationalIdentity(G,G.sub(n.args[0],D0),{maxTerms:3000}).pass)roots.push(id);
        if(['add','multiply','inverse','sqrt_positive','exp','log_positive'].includes(n.op))n.args.forEach(scan);else if(n.op==='integer_power')scan(n.args[0]);};
    scan(actual);scan(expected);
    const nSquare=G.substitute(n.nSquared,x.tau,q(1,2)),normalSquareCheck=sourceGraphRationalIdentity(G,G.sub(nSquare,D),{maxTerms:1000}),
      pairs=[...new Set(roots)].map(r=>[r,symbolicRoot]).concat([...new Set([D0,...roots.map(r=>G.nodes[r].args[0])])].map(r=>[r,G.pow(symbolicRoot,2)]),[[nSquare,D]]),
      left=adiabaticReplaceExactOperands(G,actual,pairs),right=adiabaticReplaceExactOperands(G,expected,pairs),
      check=retainedCommonDenominatorIdentity(G,left,right,{denominators:[D,FR0,F0,Fa,gamma,symbolicRoot],maxTerms:30000});
    comparison.push({sign,actual,expected,check,normalSquareCheck,positiveReferenceRoot:root,
      exactPositiveSquareRootRelation:{symbolicRoot,D0,roots,rule:'The same positive root r=sqrt(1+u^2)>0 has r^2=1+u^2. Every replaced radicand is independently identified with1+u^2; no freely supplied root value is used.'}});
    checks.push({id:'full-comparison-normal-square-'+sign,...normalSquareCheck},
      {id:'full-comparison-diagonal-including-damping-'+sign,...check});
  }
  if(checks.some(c=>!c.pass))throw Object.assign(Error('The complete time normalization or retained comparison diagonal failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', ')),{code:'INTERNAL_VALIDATION',checks});
  return {schema:'MathScope.CenteredNormalizedFullFrameAudit/1',checks,rows,comparison,pass:true,sourceAuthenticated:false,
    positiveScaleRule:'For frozen Bs>0, n=Bs*n_hat and n_prime=Bs*n_hat_prime. Thus n(n^T K-n_prime^T)/|n|^2, Ka,Na,sa,U,J,B,Bleft and the full basis connection are unchanged after cancelling Bs. Only damping retains epsilon*k^2*Bs^2, which the actual source sets exactly to lambda0/(1+u^2)^(3/2).',
    comparisonPolicy:'Only this explicit comparison expression sets inverseLength and epsilon to zero and beta to its reference value. No actual source node is changed; the positive mean-value remainder must be proved by the adapter.'};
}

/** A quantitative second-profile-jet extension of the retained outer
 *stress factors. The original nested heat/pressure/backward integrals are
 *all included; the small endpoint exponential is not divided numerically.
 */
export function centeredTerminalTargetPowerAudit(){
  const rows=[],put=(id,p,reason)=>{rows.push({id,power:p,reason});return p;},mul=(id,...p)=>put(id,p.reduce((a,b)=>a+b,0)+1,'Finite Leibniz sum through order two'),
    sum=(id,...p)=>put(id,Math.max(...p)+1,'Finite sum through order two'),J=(id,p,m)=>put(id,p+1,'Whole positive exp(-4t) moments of the retained J_(4,'+m+') kernel, through second derivative'),
    heat=put('K_and_three_profile_derivatives',75,'K=EpowB*exp(A*delta)*H; leading F<Renv^71, r<Renv, f_o>1/2, and full Gamma moments through four'),
    radial=put('radial_and_inverse',2,'Original r and its inverse plus the finite delta derivatives'),flat=put('regular_flat_prefactor',1,'go and its first three derivatives on0<=delta<=1/2 are<2^2048<Renv; the denominator is>=1/9'),
    coeff=put('bounded_polynomial_chart_coefficients',2,'rho,delta^j(j<=6),L^-1,eta and required derivatives; L=1-2h eta^2>1/2'),
    c=mul('c',coeff,flat),boundary=mul('theta_boundary',heat,c,radial),visc=J('theta_viscous_integral',mul('theta_viscous_integrand',radial,heat,c),-3),
    invisc=J('theta_inviscid_integral',mul('theta_inviscid_integrand',radial,radial,radial,heat,c),-3),
    theta=sum('theta',boundary,mul('theta_viscous',coeff,radial,radial,visc),mul('theta_inviscid',coeff,coeff,radial,radial,invisc)),
    pressure=mul('pressure',coeff,J('pressure_integral',mul('pressure_integrand',heat,heat,flat,c),-3)),
    axial=mul('scaled_axial',coeff,radial,J('axial_integral',mul('axial_integrand',radial,radial,pressure),0)),
    chart=put('source_chart_and_outer_exponential',8,'At delta=1/4 and eta=0, the exact implicit chart first/second jets and exp(-4/delta^2)*delta^-3 have finite constants<2^512<Renv, with the source s^(-A-1/2) factor retained'),
    raw=mul('complete_slow_target_through_two',Math.max(theta,axial),chart),normalized=put('target_divided_by_frozen_tau_Ac_or_u',raw+68,'tau>Renv^-60 and Ac>Renv^-6,u>1, including finite sums and target derivatives');
  const kernelRows=[0,Q(3,2)].map(k=>{k=Array.isArray(k)?k:Q(k);return {k:qtext(k),firstValue:qtext(qdiv(k,Q(16))),
    secondFirstDerivative:qtext(qdiv(qadd(qmul(Q(2),k),Q(3,2)),Q(16))),secondValue:qtext(qadd(qdiv(k,Q(8)),qdiv(qmul(k,qadd(k,Q(1))),Q(32))))};});
  if(normalized>=512)fail('INTERNAL_VALIDATION','The explicit terminal target jet bound exceeded its primitive reserve.');
  return {schema:'MathScope.CenteredTerminalTargetPowerAudit/1',rows,kernelRows,maximumPower:normalized,reserve:512,pass:true,sourceAuthenticated:false,
    sourcePremises:'Original outer factor and all its backward kernels, full source heat Gamma,0<h<2^-4096,rho=h/256, Xb<C^11<Renv^2, Renv>C^10, Renv>2^4096, positive actual outer theta coefficient>=C^-10.',
    kernelProof:'For s=delta/sqrt(1+delta^2*t), |s_delta|<=1 and |s_deltadelta|<=3t/2 on0<=delta<=1/2. For weight(1+delta^2*t)^(-k), |weight_delta|<=k*t and |weight_deltadelta|<=2k*t+k(k+1)t^2. Integral exp(-4t),t exp(-4t),t^2 exp(-4t) is1/4,1/16,1/32. The printed rows cover k=0 and3/2, including the nested pressure kernel. Mixed eta derivatives act on the retained integrand.',
    flatProof:'For j<=3, derivatives of exp(-4/delta^2) are a polynomial with finite integer coefficients times exp(-4/delta^2) and inverse powers of delta. The inequality x^n*exp(-x)<=n! controls these terms uniformly up to delta=0. The other flat argument is>=3/4, and its derivatives are bounded directly; denominator>=exp(-16/9)>1/9. Three inverse/product recurrences cost less than2^2048.',
    tauProof:'At the actual center N=(-1,0), btheta>=C^-10, s=1,Ac<4Renv^20. Since C^10<Renv and exp(-64)>2^-128>Renv^-1, tau=64exp(-64)*btheta/Ac>Renv^-60.',
    consequence:'Each first and second derivative of the actual target divided by the frozen tau and Ac or u is<Renv^512<B. Each normalized covariance frame factor, including actual Riccati ratio jets, is bounded by B^32 separately. These finite constants are not a global all-label theorem.'};
}
