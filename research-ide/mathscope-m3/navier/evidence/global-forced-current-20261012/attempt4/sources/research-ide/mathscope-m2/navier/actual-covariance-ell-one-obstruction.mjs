/** A source-bound obstruction to NONNEGATIVE covariance weights in the
 * literal ell=1 display extension. The original theorem uses large bands;
 * this is not a counterexample to that theorem or a sign of det(H).
 *
 * Exact source bodies and rational identities are executable. Heat, support,
 * comparison and ODE inequalities are the written analytic proof retained
 * below. Neither numerical H quadrature nor a new Lean proof is claimed.
 */
import {prepareActualCovarianceBandAdmissibility,assertActualCovarianceBandAdmissibility} from './actual-covariance-band-admissibility.mjs';
import {attachActualCovarianceTarget} from './actual-covariance-source-target.mjs';
import {assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {actualMovingPulseFrame,covarianceMatrixAlgebra} from './actual-covariance-matrix.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {rational as Q,qadd,qmul,qdiv,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const metadata=program=>{const {nodes,...rest}=program;return canonicalStringify(rest);};
const binding=p=>canonicalStringify({request:p.request,roots:p.roots,sourceBinding:p.sourceBinding,checks:p.checks,proof:p.proof,decision:p.decision});
const sq=a=>qmul(a,a);

/** Alpha renaming of bound integration variables and associative/commutative
 * regrouping of addition/multiplication only. No heat value, branch or
 * nonzero expression is discarded. Needed because the complete heat producer
 * imports its A.13 integrals with fresh bound-variable names. */
export function ellOneSourceScalarIdentity(G,left,right){
  const cache=new Map();
  function encode(id,environment=[]){
    const cacheKey=id+'|'+environment.join(',');if(cache.has(cacheKey))return cache.get(cacheKey);
    const n=G.nodes[id];if(!n)fail('INVALID_INPUT','A scalar identity needs two existing source nodes.');
    const {op,args}=n;let result;
    if(op==='rational'||op==='source_parameter')result=[op,...args];
    else if(op==='coordinate'){const at=environment.lastIndexOf(id);result=at<0?[op,...args]:['bound',environment.length-1-at];}
    else if(op==='definite_integral')result=[op,encode(args[0],[...environment,args[1]]),encode(args[2],environment),encode(args[3],environment)];
    else if(op==='integer_power'||op==='source_step_derivative')result=[op,encode(args[0],environment),args[1]];
    else if(op==='add'||op==='multiply'){
      const pieces=[];const collect=x=>{const row=G.nodes[x];if(row.op===op)row.args.forEach(collect);else pieces.push(encode(x,environment));};
      args.forEach(collect);pieces.sort((a,b)=>canonicalStringify(a).localeCompare(canonicalStringify(b)));result=[op,...pieces];
    }else if(['inverse','exp','log_positive','sqrt_positive','smooth_piecewise'].includes(op))result=[op,...args.map(x=>encode(x,environment))];
    else result=['opaque-source-node',id];
    cache.set(cacheKey,result);return result;
  }
  return {schema:'MathScope.EllOneSourceScalarIdentity/1',left,right,pass:left===right||same(encode(left),encode(right)),
    operations:'Bound integral alpha renaming and exact additive/multiplicative regrouping only.',analyticValueSubstitution:false};
}

export function ellOneCovarianceObstructionArithmetic(){
  const alpha=Q(1,16),r=Q(1,32),z=Q(1,128),u=Q(2),one=Q(1);
  const initialPositiveRatioSquared=qmul(alpha,qmul(qadd(one,qdiv(Q(4),sq(u))),qadd(one,sq(z))));
  const m21PositivePart=qmul(alpha,qadd(sq(r),sq(z)));
  const rowOne=qadd(Q(2),qmul(Q(2),qmul(qadd(one,qmul(Q(2),alpha)),r)));
  const rowTwo=qadd(qmul(Q(2),qadd(one,alpha)),qmul(Q(2),r));
  const radialChange=Q(1,(1n<<29n)-1n),heatRatioOverH=Q(17,128);
  const rows=[
    {id:'initial-theta-positive-to-negative-ratio-below-one',upper:qtext(initialPositiveRatioSquared),pass:qcompare(initialPositiveRatioSquared,one)<0},
    {id:'M21-positive-part-below-one',upper:qtext(m21PositivePart),pass:qcompare(m21PositivePart,one)<0},
    {id:'first-matrix-row-below-four-F',upper:qtext(rowOne),pass:qcompare(rowOne,Q(4))<0},
    {id:'second-matrix-row-below-four-F',upper:qtext(rowTwo),pass:qcompare(rowTwo,Q(4))<0},
    {id:'Gronwall-radial-change-below-half',upper:qtext(radialChange),pass:qcompare(radialChange,Q(1,2))<0},
    {id:'heat-logarithmic-derivative-below-quarter-h',upper:qtext(heatRatioOverH),pass:qcompare(heatRatioOverH,Q(1,4))<0},
    {id:'terminal-step-logistic-exponent-below-minus-62',upper:qtext(Q(-3072,49)),pass:qcompare(Q(-3072,49),Q(-62))<0},
    {id:'terminal-step-logistic-slope-below-2pow11',upper:qtext(qadd(Q(1024),Q(1024,343))),pass:qcompare(qadd(Q(1024),Q(1024,343)),Q(2048))<0},
    {id:'F-amplitude-bound-below-one',pass:4n<220n},
    {id:'R-envelope-and-carrier-ratio-exponents',pass:100000*256===25600000&&25600000>=3&&5*3-6===9&&15*3-6===39},
    {id:'normal-ratio-drift-below-1-over-1024',upper:qtext(qmul(Q(17,8),Q(1,1n<<31n))),pass:qcompare(qmul(Q(17,8),Q(1,1n<<31n)),Q(1,1024))<0},
    {id:'normal-ratio-sum-below-used-one-over-32',pass:qcompare(Q(1,512),r)<0}
  ];
  return {schema:'MathScope.EllOneCovarianceObstructionArithmetic/1',arithmetic:'EXACT_BIGINT_RATIONAL',rows,pass:rows.every(x=>x.pass),
    actualSourceAuthenticated:false,heatAndHNumericallyEvaluated:false,formalKernelProof:false};
}

/** A generic exact identity audit. It cannot mint an actual-source witness. */
export function ellOneCovarianceReducedODEAudit(G){
  const q=(n,d=1)=>G.q(n,d),F=G.fresh('ell1_audit_F'),alpha=G.fresh('ell1_audit_alpha'),R=G.fresh('ell1_audit_R'),
    b=G.fresh('ell1_audit_b'),c=G.fresh('ell1_audit_c'),x0=G.fresh('ell1_audit_x0'),v=G.fresh('ell1_audit_v'),
    epsilon=G.fresh('ell1_audit_epsilon'),Ls=G.fresh('ell1_audit_Ls'),u=G.fresh('ell1_audit_u');
  const FR=G.neg(G.div(G.mul(q(2),G.add(G.one,alpha),F),R)),HR=G.mul(b,R,FR),
    frame=actualMovingPulseFrame(G,{F,FR,GR:G.zero,R,epsilon,k:q(2),p:G.mul(b,R),pz:c,x0,v,Ls,u,c0:G.neg(G.sqrt(alpha)),lambda0:G.mul(q(2),F,G.sqrt(alpha)),HR,HZ:G.zero,sign:1});
  const nr=G.add(x0,G.mul(q(2),G.add(G.one,alpha),F,b,v)),den=G.add(G.pow(nr,2),G.pow(b,2),G.pow(c,2));
  const reduced=[
    [G.neg(G.div(G.mul(q(2),F,G.add(G.one,G.mul(q(2),alpha)),nr,b),den)),G.div(G.mul(q(2),F,G.add(G.pow(b,2),G.pow(c,2))),den)],
    [G.div(G.mul(q(2),F,G.sub(G.mul(alpha,G.add(G.pow(nr,2),G.pow(c,2))),G.mul(G.add(G.one,alpha),G.pow(b,2)))),den),G.neg(G.div(G.mul(q(2),F,nr,b),den))]
  ];
  const atoms=[F,alpha,R,b,c,x0,v,epsilon,Ls,u],audit=body=>sourceGraphRationalIdentity(G,body,{atomicNodes:atoms,maxTerms:20000});
  const checks=[
    ...frame.n.map((x,j)=>({id:'normal-'+j,...audit(G.sub(x,[nr,b,c][j]))})),
    ...reduced.flatMap((row,i)=>row.map((x,j)=>({id:'reduced-matrix-'+i+'-'+j,...audit(G.sub(frame.Aphi[i][j],x))}))),
    ...[0,1,2].map(i=>({id:'closed-third-column-'+i,...audit(frame.Aphi[i][2])}))
  ];
  const omittedPressure=audit(G.sub(frame.Aphi[1][0],G.mul(q(2),alpha,F)));
  if(!checks.every(c=>c.pass)||omittedPressure.pass)fail('INTERNAL_VALIDATION','The exact reduced ell-one ODE or its omitted-pressure control failed.');
  return {schema:'MathScope.EllOneCovarianceReducedODE/1',variables:{F,alpha,R,b,c,x0,v,epsilon,Ls,u},frame,reduced,denominator:den,checks,
    negativeControl:{omitted:'moving-normal pressure projection in M21',check:omittedPressure,correctlyRejected:!omittedPressure.pass},
    denominatorProof:'b is nonzero in the source application, so nr^2+b^2+c^2>0.',sourceBoundByCaller:false,pass:true};
}

function literalParameterChecks(source){
  const p=source.parametersExactExpressions,expected={
    h:{exp:{product:[{integer:-8002},{ref:'T'}]}},co:{rational:'1/256'},logP:{product:[{integer:2},{ref:'T'}]},Pstar:{exp:{ref:'logP'}},
    lambda:{exp:{product:[{integer:-1000},{ref:'T'}]}},BOuter:{product:[{integer:1000},{ref:'T'}]},Tf:{integer:128},
    XR:{product:[{integer:110},{power:[{product:[{ref:'CSelected'},{ref:'Pstar'}]},10]}]},
    sourceEnvelopeS:{power:[{ref:'CSelected'},100000]},C12EnvelopeR:{exp:{power:[{ref:'sourceEnvelopeS'},256]}},directionalMarginKappa:{power:[{ref:'C12EnvelopeR'},-10]},
    logCSelected:{sum:[{product:[{integer:10},{log:{sum:[{integer:1},{ref:'BRefUpper'}]}}]},{power:[{ref:'Q'},200]}]},CSelected:{exp:{ref:'logCSelected'}},
    sigmaStar:{quotient:[{ref:'j0'},{integer:2000}]},j0:{power:[{ref:'h'},4]},K:{power:[{ref:'Pstar'},2]},
    Q:{quotient:[{product:[{integer:String(1n<<260n)},{ref:'K'}]},{power:[{ref:'sigmaStar'},2]}]}
  };
  return Object.entries(expected).map(([name,value])=>({id:'literal-parameter-'+name,pass:same(p[name],value),sourceParameter:name}));
}

function bindLiteralOuterSchedule(G){
  const q=(n,d=1)=>G.q(n,d),one=G.one,h=G.parameter('h'),lam=G.parameter('lambda'),T=G.parameter('T'),B=G.parameter('BOuter'),Tf=G.parameter('Tf'),
    rho=G.mul(G.parameter('co'),h),alpha=G.neg(G.add(q(1,2),lam)),A=G.add(q(1,2),h),a=G.sub(one,lam),b=G.sub(one,h),hold=G.mul(q(-4),G.log(h));
  const integrate=body=>{const t=G.fresh('ell1_source_schedule_integral');return G.integral(body(t),t,G.zero,one);};
  const S=x=>{if(x===G.zero)return G.zero;if(x===one)return q(1,2);const t=G.fresh('ell1_source_step_primitive');return G.integral(G.step(t),t,G.zero,x);};
  const Q0=G.div(G.sub(lam,h),a),Qsteep=G.mul(G.exp(G.neg(G.mul(a,q(1,2)))),G.add(Q0,integrate(s=>G.mul(G.exp(G.mul(a,G.sub(s,S(s)))),G.sub(G.add(lam,G.mul(a,G.step(s))),h))))),
    Qhold=G.add(Qsteep,G.mul(b,hold)),Qb=G.mul(G.exp(G.neg(G.mul(b,q(1,2)))),G.add(Qhold,integrate(s=>G.mul(G.exp(G.mul(b,S(s))),b,G.sub(one,G.step(s)))))),
    tp=G.fresh('ell1_source_Qterminal'),Qp=G.integral(G.div(G.mul(G.exp(G.mul(b,tp)),rho,G.step(G.div(G.sub(tp,one),q(2)),1)),G.mul(q(2),G.sub(one,rho))),tp,one,q(3)),
    wait=G.div(G.log(G.div(Qb,Qp)),b),fo=s=>G.sub(one,G.mul(rho,G.sub(one,G.step(G.div(G.sub(s,one),q(2))))));
  const specs=[
    ['initial',one,s=>G.sub(G.mul(q(1,10),s),G.mul(q(3,5),S(s)))],
    ['axialDecay',T,s=>G.mul(q(-1,2),s)],['entry',one,s=>G.sub(G.mul(q(-1,2),s),G.mul(lam,S(s)))],
    ['reservedPower',G.mul(q(60),B),s=>G.mul(alpha,s)],['pulse',G.div(q(13),lam),s=>G.mul(alpha,s)],
    ['interpolation',Tf,s=>G.sub(G.mul(alpha,s),G.mul(G.log(q(2)),G.step(G.div(s,Tf))))],
    ['angular',G.mul(q(30),B),s=>G.mul(alpha,s)],['steepen',one,s=>G.sub(G.mul(alpha,s),G.mul(G.sub(one,lam),S(s)))],
    ['steepPower',hold,s=>G.mul(q(-3,2),s)],['flatten',one,s=>G.add(G.mul(q(-3,2),s),G.mul(b,S(s)))],
    ['wait',wait,s=>G.mul(G.neg(A),s)],['terminal',q(3),s=>G.add(G.mul(G.neg(A),s),G.log(G.div(fo(s),G.sub(one,rho))))]
  ];
  let y=G.zero,logA=G.zero;const rows=[];
  for(let j=0;j<specs.length;j++){
    const [id,length,delta]=specs[j],actual=G.outer.stages[j],nextY=G.add(y,length),nextLog=G.add(logA,delta(length));
    const comparisons=actual?[['length',length],['start',y],['end',nextY],['logAStart',logA],['logAEnd',nextLog]].map(([key,expected])=>({key,...ellOneSourceScalarIdentity(G,actual[key],expected)})):[];
    rows.push({id:'literal-stage-'+id,pass:actual?.id===id&&comparisons.length===5&&comparisons.every(c=>c.pass),comparisons});y=nextY;logA=nextLog;
  }
  rows.push(...[['Qb',Qb],['Qp',Qp],['terminalWait',wait]].map(([key,value])=>({id:'literal-A13-'+key,...ellOneSourceScalarIdentity(G,G.outer.roots[key],value)})));
  return {roots:{Qsteep,Qhold,Qb,Qp,wait,endpoint:y},rows,pass:rows.every(c=>c.pass)};
}

const proofText=()=>({
  kind:'SOURCE_BOUND_WRITTEN_ANALYTIC_OBSTRUCTION_WITH_EXECUTED_RATIONAL_AND_ROOT_BINDINGS',
  witness:{ell:'1',s:'1',eta:'0',delta:'1/4',y:'11/4',X:'Xb*exp(-1/4)',R:'sqrt(2X)',Z:'0',T:'1',
    representative:'The same point is fixed as the box representative before any differentiation.',
    grid:'For any fixed mesh origin there is a nearest integer box with all offsets in [-1/2,1/2]. The actual bump is positive there. Equation (6.8) allows any fixed point in a box intersection, not only its center.',
    domain:'The radial-shell and local frozen representative geometry hold. The selected certified domain excludes ell=1. Independently, this witness has q=1/2, so the original conditions q<qbig<=2^(-ell0) exclude it for every ell0>=1. No unspecified ell0 or qbig value is treated as an executed input.'},
  exactLeadingReduction:{argument:'The authenticated band certificate proves c_n*q>1 for every positive-order canonical cutoff on all finite bands 1..128. All cutoff derivatives, including the extra stream term, vanish on a neighborhood. Completed F,G equal leading F,G exactly, with h kept positive.',
    terminal:'Xtail=Xb*exp(-3), hence y=log(X/Xtail)=11/4. The terminal heat cutoff is already 1 for y>=1/2. U,M,V and their derivatives vanish after Xv<Xtail. B8/C12/I1/I2 supports precede Xtail. The retained terminal E density gives E=Etail*exp(-A*y)*f_o(y)*H(2/X)/(1-rho).',
    chart:'At Z=0,T=1 the original strictly monotone chart equation has its exact root s=1. Evenness in Z of s and of the terminal heat argument gives F_Z=0; G=G_R=G_Z=0.'},
  heatAndAlpha:{definition:'H(z)=Gamma(1+h)^(-1) integral_0^infinity exp(-v)*v^h*(1+z*v)^(-h) dv; z=2/X, rho=h/256. This is exactly 1 minus the retained source heatLoss; no heat argument is set to zero.',
    gamma:'The positive gamma density integrates to one and has first moment 1+h, by integration by parts. Compactification v=t/(1-t) keeps the complete improper tail. All displayed first derivatives are dominated by exp(-v)*v^h times a fixed polynomial.',
    estimates:'For 0<h<1/16 and 0<z<=1/16, 1>=H>=1-h*(1+h)*z>1/2 and 0<-H_prime<=h*(1+h). Thus 0<-z*H_prime/H<17*h/128<h/4.',
    terminalStep:'At delta=1/4, f_o=1-rho*sigma(delta/2), sigma argument=1/8. The logistic exponent is -3072/49<-62 and its derivative is 1024+1024/343<2^11. Since e>2, 0<sigma_prime(1/8)<2^-51. Therefore 0<f_o_prime/f_o<h*2^-59<h/4.',
    conclusion:'alpha=-1-X*F_X/F=h+z*H_prime/H-f_o_prime/f_o lies strictly between h/2 and h. In particular 0<alpha<1/16, F>0, R*F_R=-2*(1+alpha)*F, and lambda0=2*F*sqrt(alpha)>0.'},
  amplitudeAndSize:{
    sourceScalars:'T>128, lambda=exp(-1000T), h=exp(-8002T), Pstar=exp(2T), C=exp(logCSelected), XR=110*(C*Pstar)^10, Eenv=exp(C^25600000).',
    wait:'The literal A.13 integrals have 0<Qsteep<=4, 1<Qb<=7+32008T and rho<=Qp<1. Thus wait=log(Qb/Qp)/(1-h)>0 and wait<=16006T+34 for T>=128. The explicit integral inequalities and source-root bindings are detailed in the accompanying proof document.',
    endpoint:'Sum all literal stage lengths: y_end=13*exp(1000T)+122009T+135+wait. Therefore y_end+log110+20T<15*exp(1000T). The exact scalar Qsource=2^260*2000^2*Pstar^2*h^-8 exceeds exp(64020T), so logCSelected>=Qsource^200>exp(12804000T)>15*exp(1000T). Hence Xb=110*C^10*Pstar^10*exp(y_end)<C^11 and R<sqrt(2)*C^(11/2)<=C^6.',
    amplitude:'The terminal-start amplitude Etail<=Pstar: the initial endpoint log increment is -1/5 and all subsequent preterminal endpoint increments are negative (wait>0); angular bumps vanish at their endpoints. At y=11/4, 0<f_o<=1, 1-rho>1/2 and H<=1 give F<=2*Pstar/sqrt(2XR)=2/(sqrt220*C^5*Pstar^4)<1.',
    noScalarRounding:'These are inequalities between original exact positive expressions, not evaluations of their enormous numerical values.'},
  carriers:{
    geometry:'The band certificate gives k=2, 1/2<epsilon<1, Ls=2^(-32+h)<2^-31. N=(-1,0), K=(0,-1), c0=-sqrt(alpha), u=2*Eenv^10.',
    rounding:'The literal pTilde has the chosen sign. floor(k*pTilde+1/2), with the source sign-preserving nonzero fallback, gives sign(p)=sign and |p|>=1/2. No symmetric tie rule or equality p=+/-1/2 is assumed. p and pz remain frozen with respect to slow coordinates and pulse time.',
    estimates:'Bs^2=F*sqrt(alpha)/(2*epsilon*(1+u^2)^(3/2))<1/(4*u^3). Since Eenv>C^3 and R<=C^6, R*Bs*u<1/(2*C^9)<=1/1024 and 2*R*Bs<1/(2*C^39)<=2^-40.',
    normal:'Set b=p/R, c=-Bs. Then nr=sign*Bs*u/2+2*(1+alpha)*F*b*v, ntheta=b, nz=c. On 0<=v<=Ls, nr/b>0, |nr/b|<1/512<1/32 and |c/b|<2^-40<1/128. The drift is at most (17/8)*2^-31<1/1024.'},
  pulseSign:{
    equation:'The actual moving-frame identities give t_prime=(Aphi-d*I)t, d=epsilon*k^2*|n|^2>=0; P_prime/P=lambda-dref and the retained w matrix cancel those reference scalars. With a(v)=exp(integral_0^v d)*t(v)/P(0), a_prime=Aphi*a and a(0)=B(0)e1.',
    closedSystem:'The first two components close because the third Aphi column is zero. With Dn=nr^2+b^2+c^2, M11=-2F(1+2alpha)nr*b/Dn, M12=2F(b^2+c^2)/Dn, M21=2F[alpha(nr^2+c^2)-(1+alpha)b^2]/Dn, M22=-2F*nr*b/Dn. The actual constructor and these identities are checked by exact rational arithmetic.',
    initial:'a_r(0)=1. The negative theta term has magnitude Bs*u*|b|/[2*(b^2+Bs^2)] and the positive term is sqrt(alpha)*sqrt(1+u^2/4)*Bs/sqrt(b^2+Bs^2). Their ratio squared is alpha*(1+4/u^2)*(1+(Bs/b)^2)<=16385/131072<1. Thus a_theta(0)<0 and |a_theta(0)|<=|nr(0)/b|<1.',
    interval:'M21<0 and ||M||infinity<4F. The initial two-vector norm is 1, so |a_r(v)-1|<=exp(4F*Ls)-1<1/(2^29-1)<1/2; here exp(x)<=1/(1-x) for 0<=x<1. Hence a_r>1/2. The scalar integrating-factor formula a_theta(v)=exp(integral M22)*(a_theta(0)+integral exp(-integral M22)*M21*a_r) is strictly negative. Restoring P(0)>0 and positive damping preserves both signs.'},
  targetAndCovariance:{
    target:'The exact full leading target includes the original I,J,S,Cp and both viscous shear terms, with every B8/C12/I1/I2/heat correction and the matching moment identities. On terminal y>=1/2 it is the stress of Appendix A.54. Every A.54 term is nonnegative because the full heat K>0, K_r<0 and f_o_prime>=0. At y=11/4 the boundary K*f_r is strictly positive, hence Ttheta>0. The source slow target factor s^(-A-1/2)=1 at this witness.',
    covariance:'Both source Htheta columns equal the positive Haar factor times integral_0^Ls psi(v)^2*t_r(v)*t_theta(v) dv. The actual psi is identically one on [Ls/4,3Ls/4]. Thus Htheta_plus<0 and Htheta_minus<0.',
    conclusion:'For every pair y_plus,y_minus>=0, the theta row of H*y is <=0, whereas Ttheta>0. Therefore H*y=T has no nonnegative solution at this actual literal ell=1 witness. If det(H) is nonzero, at least one inverse weight is negative; neither determinant nonvanishing nor individual inverse signs follow.'},
  boundaries:{originalTheorem:'The original large-band theorem is outside the witness domain and is not contradicted.',
    evaluator:'No quadrature of H, determinant, inverse weight or tiny source heat value is claimed.',
    formal:'This is a written analytic argument with executed source-body and exact rational checks, not a new analytic Lean kernel proof.',
    progression:'The user requested complete M2 before M3. This obstruction does not authorize M3 or mark the global NS residual/flat-error package complete.'}
});

/** No coordinates, fields, bounds or proof flags are caller inputs. */
export function attachActualEllOneCovarianceObstruction(band,context={}){
  assertActualCovarianceBandAdmissibility(band);if(band.request.ellExact!=='1')fail('UNSUPPORTED','This obstruction uses exactly ell=1.');
  const operator=band.operator,{G}=operator,source=assertSourceProfile(operator.sourceProfile),q=(n,d=1)=>G.q(n,d),
    bootstrap=operator.background.prepared.bootstrap,actualHeat=bootstrap.actualHeat,heat=actualHeat.heat;
  assertActualHeatLeading(actualHeat);context.checkCancelled?.();
  const {X,eta}=bootstrap.constants,h=G.parameter('h'),A=G.add(q(1,2),h),rho=G.mul(G.parameter('co'),h),XR=G.parameter('XR'),P=G.parameter('Pstar'),scalarEqual=(a,b)=>ellOneSourceScalarIdentity(G,a,b).pass;
  const last=G.outer.stages.at(-1),terminalPressure=G.pressure.stages.at(-1),s=G.log(G.div(X,heat.Xtail)),
    fo=G.sub(G.one,G.mul(rho,G.sub(G.one,G.step(G.div(G.sub(s,G.one),q(2)))))),
    Ecl=G.mul(heat.Etail,G.exp(G.neg(G.mul(A,s))),G.div(fo,G.sub(G.one,rho))),heatArgument=G.div(G.mul(q(2),G.sub(G.one,G.pow(eta,2))),X);
  const leadingCall=G.nodes[operator.background.prepared.records[0].global.F],leadingDefinition=G.expressionSystems[leadingCall?.args?.[0]],
    heatLossIntegral=G.nodes[heat.heatLoss]?.op==='multiply'?G.nodes[heat.heatLoss].args.find(id=>G.nodes[id]?.op==='definite_integral'):null;
  if(heatLossIntegral===undefined||heatLossIntegral===null)fail('INVALID_SOURCE_CONSTRUCTION','The original complete heat-loss integral is required.');
  const lossNode=G.nodes[heatLossIntegral],vHeat=lossNode.args[1],oneMinus=G.sub(G.one,vHeat),laplace=G.div(vHeat,oneMinus),weight=G.exp(G.add(G.neg(laplace),G.mul(h,G.log(laplace)))),
    lossBody=G.mul(weight,G.sub(G.one,G.exp(G.neg(G.mul(h,G.log(G.add(G.one,G.mul(heatArgument,laplace))))))),G.pow(oneMinus,-2));
  const gammaNode=G.nodes[heat.gamma],vg=gammaNode?.args?.[1],gm=vg===undefined?null:G.sub(G.one,vg),gv=gm===null?null:G.div(vg,gm),
    gammaBody=gv===null?null:G.mul(G.exp(G.add(G.neg(gv),G.mul(h,G.log(gv)))),G.pow(gm,-2));
  const witnessX=G.mul(heat.Xb,G.exp(q(-1,4))),witnessR=G.sqrt(G.mul(q(2),witnessX)),
    coordinates=[operator.coordinates.R,operator.coordinates.Z,operator.coordinates.T,operator.coordinates.Xrep,operator.coordinates.etaRep,operator.coordinates.sRep],
    values=[witnessR,G.zero,G.one,witnessX,G.zero,G.one],at=body=>G.simultaneousSubstitute(body,coordinates,values);
  const target=attachActualCovarianceTarget(operator,context),algebra=ellOneCovarianceReducedODEAudit(G),arithmetic=ellOneCovarianceObstructionArithmetic(),schedule=bindLiteralOuterSchedule(G);
  const {dot,mul}=covarianceMatrixAlgebra(G),g=operator.geometry,c=operator.constants,oc=operator.coordinates,powReal=(x,a)=>G.exp(G.mul(a,G.log(x)));
  const sameTree=(a,b)=>same(a,b),familyChecks=operator.families.flatMap(f=>{
    const n=[G.sub(f.carrier.x0,G.mul(oc.v,f.phaseDerivatives.R)),G.div(f.carrier.p,oc.R),G.sub(f.carrier.pz,G.mul(g.epsilon,oc.v,f.phaseDerivatives.Z))],nPrime=[G.neg(f.phaseDerivatives.R),G.zero,G.neg(G.mul(g.epsilon,f.phaseDerivatives.Z))],n2=dot(n,n),
      K=[[G.zero,G.neg(G.mul(q(2),operator.fields.F)),G.zero],[G.add(G.mul(q(2),operator.fields.F),G.mul(oc.R,G.derivative(operator.fields.F,oc.R))),G.zero,G.zero],[G.derivative(operator.fields.G,oc.R),G.zero,G.zero]],
      pressure=[0,1,2].map(j=>G.sub(G.add(...K.map((row,i)=>G.mul(n[i],row[j]))),nPrime[j])),
      Aphi=K.map((row,i)=>row.map((x,j)=>G.add(G.neg(x),G.div(G.mul(n[i],pressure[j]),n2)))),
      beta=operator.frozen.K.map((x,j)=>G.mul(c.Bs,G.sub(x,G.div(G.mul(q(f.sign),c.u,operator.frozen.N[j]),G.mul(g.Ls,operator.frozen.gabs))))),
      pTilde=G.mul(operator.frozen.Rrep,beta[0]),scaled=G.mul(g.k,pTilde),rounded=G.neg(G.ceiling(G.neg(G.add(scaled,q(1,2))))),fallback=G.choose(scaled,G.zero,G.zero,q(-1),G.one,G.one),nonzero=G.choose(rounded,q(-1,2),q(1,2),rounded,fallback,rounded),
      zs=f.w.map(x=>G.mul(f.P,x)),tt=mul(f.frame.B,zs.map(x=>[x])).map(row=>row[0]),system=G.covarianceSystems[f.system];
    return [
      {id:'actual-normal-and-pressure-'+f.sign,pass:sameTree(f.frame.n,n)&&sameTree(f.frame.nPrime,nPrime)&&sameTree(f.frame.principalK,K)&&sameTree(f.frame.Aphi,Aphi)},
      {id:'actual-rounded-frozen-carrier-'+f.sign,pass:f.carrier.pTilde===pTilde&&f.carrier.pz===beta[1]&&f.carrier.p===G.div(nonzero,g.k)&&f.carrier.x0===G.mul(q(f.sign,2),c.Bs,c.u)&&[f.carrier.p,f.carrier.pz].every(root=>[oc.R,oc.Z,oc.T,oc.v].every(x=>!G.freeCoordinates(root).has(x)))},
      {id:'actual-volterra-matrix-and-initial-'+f.sign,pass:!!system&&sameTree(system.matrix,f.frame.wMatrix)&&sameTree(system.initial,[G.one,G.zero])&&system.variable===oc.v&&system.length===g.Ls&&f.P===G.exp(f.logP)&&sameTree(f.t,tt)},
      {id:'actual-Htheta-sign-integrand-'+f.sign,pass:f.covariance.theta===G.mul(g.haarFactor,G.integral(G.mul(G.pow(operator.cutoffs.psi,2),f.t[0],f.t[1]),oc.v,G.zero,g.Ls))}
    ];
  });
  const rawCoordinates=target.raw.coordinates,terminalLocal=terminalPressure?.variable,terminalFo=terminalLocal===undefined?null:G.sub(G.one,G.mul(rho,G.sub(G.one,G.step(G.div(G.sub(terminalLocal,G.one),q(2)))))),
    terminalDensity=terminalLocal===undefined?null:G.exp(G.mul(q(2),G.add(last.logAStart,G.add(G.mul(G.neg(A),terminalLocal),G.log(G.div(terminalFo,G.sub(G.one,rho)))))));
  const checks=[
    {id:'private-actual-band-and-heat-producers',pass:true},...literalParameterChecks(source),
    {id:'source-parameter-map-unchanged',pass:same(G.source.parametersExactExpressions,source.parametersExactExpressions)},
    {id:'actual-leading-F-is-the-complete-heat-body',pass:leadingCall?.op==='actual_expression_partial'&&leadingCall.args[2].every(n=>n===0)&&leadingDefinition?.body===heat.finalF},
    {id:'literal-terminal-stage-and-endpoints',pass:last?.id==='terminal'&&last.length===q(3)&&last.end===G.add(last.start,q(3))&&heat.Xb===G.mul(XR,G.exp(last.end))&&scalarEqual(heat.Xtail,G.mul(XR,G.exp(last.start)))&&scalarEqual(heat.Etail,G.mul(P,G.exp(last.logAStart)))},
    {id:'terminal-full-pressure-density',pass:terminalPressure?.id==='terminal'&&terminalPressure.theta===G.zero&&terminalPressure.integrand===terminalDensity},
    {id:'literal-terminal-E-and-heat-argument',pass:heat.Ecl===Ecl&&heat.heatArgument===heatArgument},
    {id:'complete-Euler-gamma-integral',pass:gammaNode?.op==='definite_integral'&&scalarEqual(gammaNode.args[0],gammaBody)&&gammaNode.args[2]===G.zero&&gammaNode.args[3]===G.one},
    {id:'complete-heat-loss-integral-with-nonzero-argument',pass:lossNode.args[0]===lossBody&&lossNode.args[2]===G.zero&&lossNode.args[3]===G.one&&heat.heatLoss===G.div(heatLossIntegral,heat.gamma)},
    {id:'literal-terminal-heat-cutoff',pass:heat.heatCutoff===G.step(G.div(G.sub(s,q(1,5)),q(3,10)))&&scalarEqual(heat.XK,G.mul(heat.Xtail,G.exp(q(1,5))))},
    {id:'actual-envelope-and-Bs',pass:c.Renv===G.parameter('C12EnvelopeR')&&c.u===G.div(q(2),G.parameter('directionalMarginKappa'))&&c.Bs===G.sqrt(G.div(operator.frozen.lambda0,G.mul(g.epsilon,G.pow(g.k,2),G.pow(G.sqrt(G.add(G.one,G.pow(c.u,2))),3))))},
    {id:'chart-equation-keeps-source-h',pass:G.monotoneSystems[operator.chart.system]?.body===G.sub(G.sub(G.monotoneSystems[operator.chart.system].variable,G.mul(G.pow(oc.Z,2),powReal(G.monotoneSystems[operator.chart.system].variable,G.mul(q(2),h)))),oc.T)},
    {id:'actual-target-full-field-and-shear',pass:target.raw.F===operator.background.prepared.records[0].global.F&&target.raw.M===bootstrap.finalM&&target.raw.terms.thetaShear===G.mul(q(2),rawCoordinates.X,G.derivative(target.raw.F,rawCoordinates.X))&&target.targetChart.components[0]===G.mul(target.targetChart.factor,target.raw.atSlowProfile[0])},
    {id:'actual-longitudinal-positive-plateau',pass:operator.cutoffs.psi===G.mul(G.step(G.sub(G.div(G.mul(q(20),oc.v),g.Ls),q(4))),G.step(G.sub(q(16),G.div(G.mul(q(20),oc.v),g.Ls))))},
    {id:'actual-positive-Haar-factor',pass:g.Dgeom===G.sub(q(4),G.mul(q(2),G.sqrt(q(2))))&&g.haarFactor===G.mul(q(1,2),g.Dgeom,g.ci,operator.cutoffs.transverseMass)},
    ...familyChecks,...schedule.rows,{id:'generic-reduced-ODE-exact-checks',pass:algebra.pass},{id:'exact-rational-inequality-checks',pass:arithmetic.pass}
  ];
  if(!checks.every(c=>c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The ell-one obstruction source bindings differ: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const roots={witnessX,witnessR,witnessEta:G.zero,witnessS:G.one,h,rho,terminalFo:fo,terminalEcl:Ecl,heatArgument,heatLoss:heat.heatLoss,gamma:heat.gamma,
    actualCompletedFAtWitness:at(operator.fields.F),actualLeadingFAtWitness:at(operator.leadingFields.F),actualTargetThetaAtWitness:at(target.targetChart.components[0]),
    actualHthetaAtWitness:operator.families.map(f=>at(f.covariance.theta)),actualAphiAtWitness:operator.families.map(f=>f.frame.Aphi.map(row=>row.map(at))),
    actualFrozenCarriersAtWitness:operator.families.map(f=>({sign:f.sign,p:at(f.carrier.p),pz:at(f.carrier.pz),x0:at(f.carrier.x0)})),
    originalXtail:heat.Xtail,originalXb:heat.Xb,originalEtail:heat.Etail,originalOuterEndpoint:last.end,originalTerminalWait:G.outer.roots.terminalWait,
    originalQb:G.outer.roots.Qb,originalQp:G.outer.roots.Qp,sourceSchedule: schedule.roots,reducedODE:algebra.reduced};
  const proof=proofText(),decision={literalEllOneNonnegativeWeightObstruction:true,nonnegativeSolutionExists:false,
    actualHthetaColumnSigns:['NEGATIVE','NEGATIVE'],actualTargetThetaSign:'POSITIVE',
    actualDeterminantSign:'UNKNOWN',actualDeterminantNonzeroProved:false,actualIndividualInverseWeightSigns:['UNKNOWN','UNKNOWN'],
    ifInvertibleAtLeastOneWeightNegative:true,realPositiveSquareRootWeightPairImpossibleAtWitness:true,
    geometricBoxRepresentativeRuleCompatible:true,selectedCertifiedDomainMembership:false,originalGammaMembershipForEll0AtLeastOne:false,
    unspecifiedOriginalEll0AndQbigEvaluated:false,originalLargeBandTheoremCounterexample:false,
    wholeGPOSComplete:false,rigorousWholeHNumericalEnclosure:false,newLeanKernelProof:false,fullPhysicalResidualAndFlatErrorPackageComplete:false,m3MayStart:false};
  const request={sourceProfile:operator.sourceProfile,ellExact:'1',witness:'FIXED_TERMINAL_DELTA_ONE_QUARTER_ETA_ZERO_S_ONE'},
    sourceBinding={sourceProfile:operator.sourceProfile,parameterExpressionSHA256:operator.parameterExpressionSHA256,
      input:'Private actual band and heat producers; no supplied coefficient, coordinate, scalar bound or completion flag.',
      equationReferences:['6.8','7.1','7.2','7.27','7.29','A.13','A.52','A.54','A.56'],
      originalPDFSHA256:source.originalPdfSHA256??source.sourcePdfSHA256??'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
      scope:'Literal current ell=1 operator extension, with a geometrically permitted same-point representative. The selected certified domain is excluded; the original Gamma condition also excludes q=1/2 for every ell0>=1 and qbig<=2^(-ell0).'};
  const packed=G.pack(roots,{schema:'MathScope.ActualEllOneCovarianceObstructionProgram/1',compiler:'actual-covariance-ell-one-obstruction.mjs:attachActualEllOneCovarianceObstruction',compilerInput:request,sourceBinding,proof,decision,checks,algebra,arithmetic}),
    {nodes:liveNodes,...meta}=packed,program={...structuredClone(meta),nodes:liveNodes.slice()},result={G,band,operator,target,request,roots,sourceBinding,proof,decision,checks,algebra,arithmetic,program};
  seals.set(result,{G,band,operator,program,programNodes:program.nodes,programMetadata:metadata(program),serialized:canonicalStringify(program),
    count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:binding(result),algebra:canonicalStringify(algebra),arithmetic:canonicalStringify(arithmetic)});
  return result;
}

export function assertActualEllOneCovarianceObstruction(p){
  const s=seals.get(p);
  if(!s||p.G!==s.G||p.band!==s.band||p.operator!==s.operator||binding(p)!==s.data||p.program!==s.program||p.program.nodes!==s.programNodes||metadata(p.program)!==s.programMetadata||JSON.stringify(p.program.nodes)!==s.nodes||
    JSON.stringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions)||canonicalStringify(p.algebra)!==s.algebra||canonicalStringify(p.arithmetic)!==s.arithmetic)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private source-bound ell-one obstruction.');
  assertActualCovarianceBandAdmissibility(s.band);return true;
}

export function prepareActualEllOneCovarianceObstruction(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile'].includes(k)))fail('INVALID_INPUT','Only the pinned source profile is accepted; the exact witness is internal.');
  return attachActualEllOneCovarianceObstruction(prepareActualCovarianceBandAdmissibility({sourceProfile:input.sourceProfile??SOURCE_PROFILE_ID,ellExact:'1'},context),context);
}

export async function actualEllOneCovarianceObstructionCertificateFromProgram(p,context={}){
  assertActualEllOneCovarianceObstruction(p);const s=seals.get(p),hash=await sha256(s.serialized);context.checkCancelled?.();
  return {schema:'MathScope.ActualEllOneCovarianceObstructionCertificate/1',request:p.request,sourceBinding:p.sourceBinding,
    graph:{sha256:hash,nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength,compiler:p.program.compiler,compilerInput:p.request,roots:p.roots,
      graphIncluded:false,fixedCompilerPrefix:true,laterSourceAppendsExcluded:true},checks:p.checks,proof:p.proof,decision:p.decision,arithmetic:p.arithmetic,
    algebra:{checks:p.algebra.checks,negativeControl:p.algebra.negativeControl,denominatorProof:p.algebra.denominatorProof},pass:true,
    scope:'Source-bound written analytic nonnegative-solution obstruction in the ell=1 display extension; no determinant sign, original-theorem counterexample, numerical H enclosure, new Lean proof or M3 authorization.'};
}
