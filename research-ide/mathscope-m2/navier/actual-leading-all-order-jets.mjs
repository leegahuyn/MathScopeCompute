/** Arbitrary finite jets of the SAME completed leading axial source.
 *
 * Bounds are generated from the natural Banach series, actual B22/B26/B34,
 * the same B8 root, removable C1 variance, the same circle inverse, original
 * finite N, actual I1 root, and actual outer amplitude. Fixed order-6/order-12
 * estimates are not extrapolated. The bounds may exceed the original R.
 *
 * This is a bound producer, not a signed-moment evaluator or an all-order
 * positive coefficient/background/H certificate. See the accompanying proof.
 */
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {PINNED_N3} from './source-profile-data.mjs';
import {ActualSourceExpressions} from './actual-global-source-expressions.mjs';
import {sourceAllOrderCutoffJets} from './actual-residual-order-induction-kernels.mjs';
import {actualB8ContractionProof} from './actual-continuation-exact-b8.mjs';
import {actualI1ContractionProof} from './actual-continuation-exact-global.mjs';
import {prepareActualFullLeadingProgram,assertActualHeatLeading,actualHeatI2ContractionProof} from './actual-continuation-exact-heat.mjs';
import {ACTUAL_B8_PRECONDITIONER as B8PIN} from './actual-continuation-exact-b8-data.mjs';
import {factorial,readRational,qadd,qcompare,qtext,rational,fail} from './actual-continuation-arithmetic.mjs';
import {PositiveTaylorLedger,physicalXConversion} from './actual-leading-all-order-jets-arithmetic.mjs';

export const ACTUAL_LEADING_ALL_ORDER_BINDINGS=Object.freeze([
  {path:'mathscope-m1/navier/followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md',bytes:20071,sha256:'1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920'},
  {path:'mathscope-m1/navier/followup-20261010-same-datum-axis/REFERENCE_DERIVATIVE_BOUNDS.md',bytes:14028,sha256:'c4f47c6a156052a007a55992345faa47c7c47cb5606a46bff693f0b69d5054d9'},
  {path:'mathscope-m1/navier/followup-20261010-same-datum-axis/CONTINUATION_AND_NEW_DEBT.md',bytes:23134,sha256:'b2b4dfc3f1223e3a5e2bb09043dc649d48d2cda16813d6c719f7d47f6b0214e2'},
  {path:'mathscope-m1/navier/followup-20261010-same-datum-axis/GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md',bytes:12673,sha256:'f27e8d640e9b8e49805c0128c987f043d5667c298b2029dd061b820ae9e3117b'},
  {path:'mathscope-m1/navier/followup-20261010-symbolic-gluing/LOOP_DERIVATIVE_ENVELOPE.md',bytes:10357,sha256:'531e5addbe900564c22e0b44406c9c024e7d279c03a7188ea17431a567fe1250'},
  {path:'mathscope-m1/navier/followup-20261010-symbolic-gluing/C12_FREQUENCY_CONTRACT.md',bytes:12543,sha256:'1740353222f1a5ca727c2c8a2c7063bba8a990f9a4393754256d5c82f49f7a16'},
  {path:'mathscope-m1/navier/followup-20261010-outer-reselection/OUTER_DERIVATION.md',bytes:22237,sha256:'ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81'},
  {path:'mathscope-m1/navier/followup-20261010-final-stress-audit/HEAT_COMPENSATION_PROOF_EN.md',bytes:18440,sha256:'81446a5f1a6a18a4e1aa9a44fdc5695da1846a1c23fe412c9ac282af155688e3'},
]);

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
let compiledLeading=null;
function actualFunctionIdentity(context){
  context.checkCancelled?.();
  if(!compiledLeading)compiledLeading=prepareActualFullLeadingProgram({sourceProfile:SOURCE_PROFILE_ID,iterations:0},context);
  assertActualHeatLeading(compiledLeading);
  const p=compiledLeading.program,l=compiledLeading.loop.program;
  return {implementation:'actual-continuation-exact-heat.mjs:prepareActualFullLeadingProgram',
    profileId:p.profileId,parameterExpressionSHA256:p.parameterExpressionSHA256,
    U0RootName:'actualGlobalU0',U0Root:p.roots.actualGlobalU0,nodeCount:p.nodes.length,
    F0innerImplementation:'actual-continuation-exact-pregluing.mjs:functions.naturalF and functions.B26EAt / sqrt(2X)',
    sameOriginalN:l.modulation.originalNRetained,
    actualB8AndI1RootBodiesPresent:compiledLeading.normalizedDebts.length===5&&compiledLeading.loop.b8.program.B8.cancellation.allFiveMomentsRestoredExactlyInTheLimit&&Object.values(compiledLeading.proof.checks).every(Boolean),
    actualHeatI2RootBodyPresent:p.I2.rhs.length===3&&p.I2.meanUpperBoundUsedAsDebt===false&&p.heat.tailTruncated===false,
    rawFunctionGraphDifferentiatedAtRequestedOrder:false,
    meaning:'The bound recipe below is an independent majorant of these exact functions, with a generated finite-order recurrence.'};
}

function inputOf(input,context){
  if(input===null||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','Use an actual finite leading-jet request.');
  for(const k of Object.keys(input))if(!['sourceProfile','radialOrder','etaOrder'].includes(k))fail('INVALID_INPUT','A source, derivative bound, root, R or N cannot be replaced: '+k);
  const r=input.radialOrder??2,m=input.etaOrder??6,budget=context.jetOrderBudget??128;
  for(const [name,n]of [['radialOrder',r],['etaOrder',m],['jetOrderBudget',budget]])if(!Number.isSafeInteger(n)||n<0)fail('INVALID_INPUT',name+' must be a nonnegative safe integer.');
  if(!Number.isSafeInteger(r+m)||r+m+8>budget||budget>512)fail('RESOURCE_LIMIT','This finite request exceeds the declared derivative-resource budget. No missing derivative is set to zero.');
  assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID);return {r,m,n:r+m,budget};
}

function sourceChecks(source){
  const p=source.parametersExactExpressions;
  return [
    {id:'actual-source-parameter-hash',pass:source.parameterExpressionSHA256===PINNED_N3.parameterExpressionSHA256},
    {id:'same-natural-scales',pass:same(p.Lambda,{power:[{ref:'Q'},64]})&&same(p.rho,{quotient:[{power:[{ref:'sigmaStar'},2]},{integer:65536}]})},
    {id:'same-widths',pass:same(p.t1,{power:[{ref:'CSelected'},-120]})&&['kappa0','omega1','omega2'].every(k=>same(p[k],{ref:'t1'}))},
    {id:'same-R-and-finite-N',pass:same(p.sourceEnvelopeS,{power:[{ref:'CSelected'},100000]})&&same(p.C12EnvelopeR,{exp:{power:[{ref:'sourceEnvelopeS'},256]}})&&same(p.radialFrequencyN,{sum:[{integer:1},{ceil:{power:[{ref:'C12EnvelopeR'},50]}}]})},
    {id:'same-loop-variance-and-circle-scales',pass:same(p.loopDelta,{exp:{product:[{integer:-1},{power:[{ref:'sourceEnvelopeS'},16]}]}})&&same(p.loopMuMax,{power:[{ref:'sourceEnvelopeS'},12]})&&same(p.loopD0,{quotient:[{integer:1},{product:[{integer:8},{ref:'sourceEnvelopeS'}]}]})},
    {id:'same-positive-h-lambda',pass:same(p.h,{exp:{product:[{integer:-8002},{ref:'T'}]}})&&same(p.lambda,{exp:{product:[{integer:-1000},{ref:'T'}]}})},
    {id:'positive-interpolation-before-heat-edit',pass:same(p.Tf,{integer:128}),proof:'Xplus=Xv*e is inside the first unit of the positive 128-unit interpolation. Xtail and XK are later, so the heat edit itself vanishes on [0,Xplus]. Its full improper debt still enters I2.'},
    {id:'actual-common-collar-before-C12',pass:same(p.Xa,{quotient:[{integer:4},{ref:'Lambda'}]})&&same(p.sourceJLeft,{product:[{quotient:[{integer:4},{ref:'Lambda'}]},{exp:{quotient:[{ref:'t1'},{integer:16}]}}]})&&same(p.loopILeft,{product:[{quotient:[{integer:4},{ref:'Lambda'}]},{exp:{quotient:[{ref:'t1'},{integer:8}]}}]}),proof:'t1>0 gives Xa*exp(t1/16)<loopILeft= Xa*exp(t1/8). The B26 norm up to Xi is restricted to this actual unchanged collar.'},
    {id:'C-dominates-Q10000-for-coefficient-tube',pass:factorial(51)<(1n<<BigInt(260*200)),proof:'exp(Q^200)>Q^10200/51!>Q^10000; Q>=2^260. This is a value/tube bound, not a derivative-order absorption.'},
  ];
}

/** Return ordinary mixed physical-X/eta bounds, covering the requested
 * rectangle 0<=r'<=r,0<=m'<=m, from a total-degree bound of order r+m.
 */
export function actualLeadingAllOrderJets(input={},context={}){
  const request=inputOf(input,context),{r,m,n}=request,source=assertSourceProfile(),functionIdentity=actualFunctionIdentity(context);
  const primitive=sourceAllOrderCutoffJets({order:n+8,sourceProfile:SOURCE_PROFILE_ID},context),sigma=primitive.activation.ordinaryDerivativeBounds.map(BigInt);
  const G=new ActualSourceExpressions(),J=new PositiveTaylorLedger(G,context),q=(a,b=1)=>G.q(a,b),P=k=>G.parameter(k),one=G.one;
  const Q=P('Q'),rho=P('rho'),Lambda=P('Lambda'),C=P('CSelected'),S=P('sourceEnvelopeS'),N=P('radialFrequencyN'),R=P('C12EnvelopeR'),t1=P('t1'),lambda=P('lambda'),mu=P('muMoment'),XR=P('XR'),Pstar=P('Pstar'),sigmaStar=P('sigmaStar'),delta=P('loopDelta'),muMax=P('loopMuMax'),d0=P('loopD0');
  const Xa=G.div(q(4),Lambda),Xi=q(110),Xv=G.mul(XR,G.exp(G.add(P('T'),q(2),G.mul(q(60),P('BOuter')),G.div(q(13),lambda)))),Xmax=G.add(one,G.mul(q(3),Xv));
  // All pregluing/pulse radial intervals occur before Xv. The source lower
  // endpoint is Xa and XR>1. These explicit expressions avoid a fabricated
  // derivative-dependent envelope R or a change to the old N.
  const length=G.add(q(32),G.log(XR),G.log(Lambda),P('T'),G.mul(q(60),P('BOuter')),G.div(q(13),lambda)),Xjet=G.mul(q(3),Xmax),sqrtXjet=G.mul(q(3),G.sqrt(G.mul(q(2),Xmax))),invSqrtXjet=G.mul(q(3),G.sqrt(G.div(one,Xa)));
  const cache=new Map(),memo=(key,fn)=>{if(cache.has(key))return cache.get(key);context.checkCancelled?.();const value=fn();cache.set(key,value);return value;};
  const add=(label,k,...a)=>J.sum(label,k,...a),mul=(label,k,...a)=>J.product(label,k,...a),D=(label,k,a)=>J.derivative(label,k,a);
  const sigmaAt=(label,k,arg,shift=0,scale=one)=>{
    let root=G.zero,power=one;
    for(let j=0;j<=k;j++){root=G.add(root,G.mul(q(sigma[j+shift],factorial(j)),power));power=G.mul(power,arg);}
    return J.record(label,k,'actual square-seed cutoff finite Taylor composition',G.mul(scale,root),[arg,scale],{sourceDerivativeShift:shift,sourceLargestDerivative:k+shift});
  };
  const unitBump=(label,k,argumentBound=q(65536),prefactor=one)=>sigmaAt(label,k,argumentBound,1,prefactor);
  const geom=k=>memo('geom'+k,()=>{
    const eta=q(2),d=q(5),L=q(3),invL=J.inverse('L inverse',k,L,q(49,50)),f=J.inverse('actual f=(1+eta^2)^-1',k,q(5),one),uStar=q(10),H=G.add(G.mul(q(1),eta),G.mul(d,uStar)),den=G.add(G.pow(H,2),G.pow(sigmaStar,2));
    const zeta=G.mul(L,H,J.inverse('actual zeta denominator',k,den,G.pow(sigmaStar,2))),logGValue=G.add(G.log(C),G.mul(q(64),Lambda,G.pow(sigmaStar,-2)));
    const logg=k?G.add(logGValue,G.mul(Lambda,geom(k-1).zeta)):logGValue;
    return {eta,d,L,invL,f,uStar,zeta,logg,logGValue};
  });
  // Differentiate the actual B_rho coefficient sum, not its Bessel comparator.
  const natural=(k,physical=false)=>memo('natural'+k+physical,()=>{
    let root=G.zero;const coefficients=[];
    const stirling=Array.from({length:k+1},()=>[]);stirling[0][0]=1n;
    for(let i=1;i<=k;i++)for(let j=0;j<=i;j++)stirling[i][j]=BigInt(j)*(stirling[i-1][j]??0n)+(j?stirling[i-1][j-1]??0n:0n);
    for(let rr=0;rr<=k;rr++)for(let mm=0;mm+rr<=k;mm++){
      let a=G.zero;
      if(physical)a=G.mul(q(factorial(rr+mm)*2n**BigInt(rr+mm+1),20n**BigInt(rr)*factorial(rr)*factorial(mm)),G.pow(Lambda,rr));
      else for(let j=0;j<=rr;j++)if(stirling[rr][j])a=G.add(a,q(stirling[rr][j]*factorial(mm+j)*2n**BigInt(mm+j+1),4n**BigInt(j)*factorial(rr)*factorial(mm)));
      root=G.add(root,G.mul(Q,G.pow(rho,-mm),a));coefficients.push({radialOrder:rr,etaOrder:mm,coefficientRoot:a});
    }
    return J.record(physical?'actual natural physical total jet':'actual natural log-radius total jet',k,'B_rho positive differentiated geometric series on |Y|<=5',root,[Q,rho,Lambda],
      {actualNonlinearSeries:true,comparisonSubstituted:false,coordinate:physical?'physical X':'log X',coefficients,complexYAbsoluteUpper:5,etaDistanceUpper:'rho/4'});
  });
  const gNorm=k=>J.record('actual g eta jet',k,'Cauchy on the actual Omega tube; |g|<1 and radius >=rho',G.mul(q(2*(k+1)),G.pow(rho,-k)),[rho],{ordinaryDerivativeUpper:'2*m!*rho^-m',radialIndependent:true});
  const pressure=k=>J.record('actual A21 pressure jet',k,'positive-measure representation, |P|<=5K on |Im eta|<=1/16',G.mul(q(5),P('K'),J.geometric(q(32),k)),[P('K')],{cauchyRadius:'1/32',actualAllOuterEnergyAndInfiniteTailRetained:true});
  const moment=(label,k,F,U)=>{
    const densities=[U,G.mul(q(2),Xjet,F),G.mul(q(2),Xjet,U,F),G.add(G.pow(U,2),G.mul(Xjet,G.pow(F,2))),G.pow(F,2)];
    const rows=densities.map((v,j)=>J.record(label+' '+['M','I','J','S','Cp'][j],k,'actual physical-X prefix; eta integration and radial FTC',G.mul(q(4),Xmax,v),[v,Xmax],{density:['U','2X F','2X U F','U^2-X F^2','F^2'][j],axisRegular:true}));
    return {M:rows[0],I:rows[1],J:rows[2],S:rows[3],Cp:rows[4],rows};
  };
  const reference=k=>memo('ref'+k,()=>{
    const g=geom(k),nat=natural(k),nat1=natural(k+1),cut=sigmaAt('B22 actual cutoff',k,G.add(one,G.inv(t1))),invPhi=J.inverse('B22 actual Phi reciprocal',k,nat,q(1,4));
    const slope=mul('B22 Y PhiY/Phi',k,D('natural log radial derivative',k,nat1),invPhi),v=J.prefix('B22 literal log integral',k,G.mul(G.add(one,cut),slope),G.mul(q(2),t1));
    const logPhi=J.logarithm('actual log Phi at start',k,nat,q(1,4)),logR=G.add(logPhi,v),Rr=J.exponential('actual B22 Rr',k,logR,q(2));
    const Ur=G.add(g.uStar,G.div(nat,Lambda),J.prefix('B22 literal U integral',k,G.mul(G.add(one,cut),G.div(D('natural u log radial derivative',k,nat1),Lambda)),G.mul(q(2),t1)));
    const Fr=G.mul(gNorm(k),Rr),Pi=G.add(pressure(k),moment('reference prefix',k,Fr,Ur).Cp);
    return {Rr,Ur,Fr,Pi,l:G.mul(G.add(one,cut),slope),logR};
  });
  const refSource=k=>memo('refSource'+k,()=>{
    const a=reference(k),b=reference(k+1),g=geom(k),Ueta=D('reference U_eta',k,b.Ur),avgEta=Ueta,avg=a.Ur;
    const W=G.add(one,G.mul(q(2),g.eta,avg),G.mul(g.d,avgEta)),Hc=G.add(g.eta,G.mul(g.d,a.Ur)),logFeta=G.add(G.mul(Lambda,g.zeta),G.mul(D('reference Rr_eta',k,b.Rr),J.inverse('reference ratio Rr inverse',k,a.Rr,q(1,4))));
    const oneMinus=G.add(one,G.mul(q(2),g.eta,a.Ur)),Sq=G.add(G.mul(W,a.l),G.mul(P('h'),oneMinus),G.mul(Hc,logFeta));
    const Sn=G.add(G.mul(W,D('reference DyU',k,b.Ur)),G.mul(oneMinus,a.Ur),G.mul(Hc,Ueta),G.mul(g.d,D('reference Pi_eta',k,b.Pi)),G.mul(q(4),g.eta,a.Pi),G.mul(q(2),g.eta,Xjet,G.pow(a.Fr,2)));
    const ratio=G.mul(a.Rr,J.inverse('reference Rr denominator',k,a.Rr,q(1,4))),p1=G.mul(Xjet,g.invL,ratio,Sq),ns=G.mul(g.invL,Sn);
    return {p1:J.record('actual reference p1',k,'regular original source integral X/L*integral s Rr(sX)/Rr(X) Sq',p1,[Sq,ratio,g.invL,Xjet],{smallGDividedOut:false}),
      ns:J.record('actual reference ns',k,'regular original source integral L^-1*integral Sn',ns,[Sn,g.invL],{allSixSnTermsIncluded:true})};
  });
  const inner=k=>memo('inner'+k,()=>{
    const s=refSource(k),g=geom(k),control=sigmaAt('B26 original t1/omega controls',k,G.add(one,G.inv(t1))),kap=G.add(q(2),control),beta=G.add(one,control),blend=control;
    const shear=G.add(G.mul(G.add(one,blend),kap,s.p1),G.mul(q(4,5),blend)),I=J.prefix('B26 actual shear integral',k,shear,length),logF=G.add(g.logg,J.logarithm('actual Phi4 logarithm',k,natural(k),q(1,4)),G.mul(q(1,2),I));
    const F=J.exponential('actual B26 F',k,logF),U=G.add(g.uStar,G.div(natural(k),Lambda),J.prefix('actual B26 U integral',k,G.mul(q(1,2),kap,beta,Xjet,s.ns),length));
    const coreF=G.mul(gNorm(k),natural(k)),coreU=G.add(g.uStar,G.div(natural(k),Lambda));
    return {F: G.add(F,coreF),U:G.add(U,coreU),logF,E:G.mul(sqrtXjet,F),source:s,endpointLogE:G.add(logF,length,q(4))};
  });
  const prebase=k=>memo('prebase'+k,()=>{
    const a=inner(k),g=geom(k),step=sigmaAt('B34/axial-restoration/unit-width controls',k,G.mul(G.add(q(4),length),G.add(one,G.inv(P('Tsh'))))),logf=J.logarithm('actual log f',k,g.f,q(1,2));
    const shiftLog=G.add(G.log(C),length,G.mul(G.add(one,step),G.add(G.log(C),a.endpointLogE)),G.mul(step,logf));
    const shiftE=J.exponential('actual B34 endpoint-preserving E',k,shiftLog),restoredU=G.add(a.U,G.mul(G.add(q(8),a.U),step));
    const outerLog=G.add(P('logP'),G.mul(G.add(one,step),G.add(q(2),logf)),G.mul(q(8),length,G.add(one,step)),G.mul(q(8),P('T'))),outerE=J.exponential('literal initial-decay-entry-power and first interpolation unit E',k,outerLog,G.pow(C,2));
    const E=G.add(a.E,shiftE,outerE),F=G.add(a.F,G.mul(invSqrtXjet,G.add(shiftE,outerE))),U=G.add(a.U,restoredU,q(8));
    return {E,F,U,inner:a,moments:moment('actual incoming B8 and ideal prefixes',k,F,U)};
  });
  let maxPreconditioner=rational(0);
  for(const row of B8PIN.preconditioner){const s=row.reduce((v,x)=>{const a=readRational(x);return qadd(v,a[0]<0n?[-a[0],a[1]]:a);},rational(0));if(qcompare(s,maxPreconditioner)>0)maxPreconditioner=s;}
  const [pn,pd]=maxPreconditioner,PB=q(pn,pd),Bquadratic=B8PIN.quadraticPreconditionedBounds.map(x=>readRational(x)).reduce(qadd,rational(0)),BQ=q(...Bquadratic);
  const outer=k=>memo('outer'+k,()=>{
    const g=geom(k),coeff=G.mul(G.pow(C,32),J.geometric(q(8),k));
    const amplitude=J.implicit('actual outer positive Amp',k,G.mul(q(13),coeff),q(20,7),q(2));
    const R0=G.mul(q(14),G.add(one,sigmaAt('actual R0 initial scale 50',k,q(64))),G.add(one,sigmaAt('actual R0 terminal cutoff',k,one))),bump=unitBump('actual pulse endpoint beta',k,q(4),q(4));
    const pulse=G.mul(q(3),G.pow(C,2),g.f,G.add(G.mul(amplitude,R0),G.mul(q(2),coeff,G.add(one,amplitude),bump)));
    const logArg=J.logarithm('actual decay log(1+s)',k,G.add(q(2),P('T')),one),decay=G.mul(q(8),G.add(one,sigmaAt('actual axialDecay k(log(1+s)/Md)',k,G.div(logArg,P('Md')))));
    return {U:J.record('complete actual outer U',k,'literal decay and actual Amp/affine M,J pulse with exact zero exterior',G.add(q(8),decay,pulse),[pulse,decay,amplitude],
      {complexCoefficientNorm:G.pow(C,32),coefficientTubeRadius:'1/4',cauchyRadius:'1/8',realAmplitudeDerivativeLower:'7/20',sameAmplitudeBracket:['9/10','6/5'],infiniteEnergyTailIncluded:true,complexSqrtBranchAssumed:false}),amplitude};
  });
  const premod=k=>memo('premod'+k,()=>{
    const a=prebase(k),g=geom(k),M=a.moments,Ki=G.div(q(5),Pstar),XR32=G.sqrt(G.pow(XR,3)),Kn=G.mul(Pstar,g.f);
    // The comparison ideal F~X^(-2/5) is not bounded at the axis. Its
    // five exact primitives, rather than an invalid bounded-density rule,
    // give these endpoint bounds (x=exp(-7)<1).
    const idealI=G.mul(q(2),XR32,Kn),ideal=[G.mul(q(4),g.eta,XR),idealI,G.mul(q(4),g.eta,idealI),G.add(G.mul(q(16),G.pow(g.eta,2),XR),G.mul(XR,G.pow(Kn,2))),G.mul(q(3),G.pow(Kn,2))];
    const [dm,di,dj,ds,dp]=M.rows.map((v,j)=>G.add(v,ideal[j]));
    J.record('actual minus exact ideal B8 moments',k,'all five actual histories plus the exact ideal endpoint primitives',G.add(dm,di,dj,ds,dp),[...M.rows,...ideal],{idealAxisSingularDensityNotBoundedByActualF:true,idealEndpoint:'x=exp(-7)',idealCpPrimitive:'(5/2)*Keta^2*x^(1/5)'});
    const rows=[G.mul(dm,Ki,G.inv(XR)),G.mul(G.add(dj,G.mul(q(4),g.eta,di)),G.pow(Ki,2),G.inv(XR32)),G.mul(di,Ki,G.inv(XR32)),G.mul(G.add(ds,G.mul(q(8),g.eta,dm)),G.pow(Ki,2),G.inv(XR)),G.mul(dp,G.pow(Ki,2))].map(v=>G.div(v,mu));
    const rhs=G.add(...rows),equation=G.add(q(2),G.mul(PB,rhs),G.mul(q(20),mu,BQ));
    const root=J.implicit('same actual B8 root at arbitrary finite eta order',k,equation,q(2),q(5,1000000),5),bump=unitBump('actual B8 width1/4096 bumps',k,q(65536));
    const correction=G.mul(Pstar,g.f,mu,root,bump),U=G.add(a.U,correction,outer(k).U),E=G.add(a.E,correction),F=G.add(a.F,G.mul(invSqrtXjet,correction));
    return {U,E,F,moments:moment('actual full pre-C12 prefixes',k,F,U),B8root:root,B8normalizedDebtRows:rows};
  });
  const loopInput=k=>memo('loopInput'+k,()=>{
    const a=premod(k),b=premod(k+1),g=geom(k),invE=J.inverse('actual pre-loop E on J',k,a.E,G.pow(C,-3)),invAInput=G.pow(C,-122),Xinv=G.div(q(3),Xa),M=a.moments,Me=b.moments;
    const ar=G.add(one,G.mul(q(2),D('actual pre-loop DyE',k,b.E),invE)),bs=G.mul(q(2),D('actual pre-loop DyU',k,b.U),invE),invA=J.inverse('actual pre-loop a on J',k,ar,invAInput),ts=G.mul(bs,invA),vs=G.add(ar,G.mul(G.pow(bs,2),invA));
    const W=G.add(one,G.mul(q(2),g.eta,M.M,Xinv),G.mul(g.d,D('actual M_eta',k,Me.M),Xinv));
    const angular=G.add(M.I,G.mul(g.eta,D('actual I_eta',k,Me.I)),G.mul(g.d,D('actual J_eta',k,Me.J)),G.mul(q(2),g.eta,M.J)),p1=G.mul(g.invL,G.add(G.mul(Xjet,W),G.mul(angular,invE,invSqrtXjet)));
    const Pi=G.add(pressure(k),M.Cp),PiEta=G.add(D('actual P_eta',k,pressure(k+1)),D('actual Cp_eta',k,Me.Cp));
    const p2=G.mul(g.invL,invE,G.add(G.mul(Xjet,W,a.U),M.M,G.mul(g.eta,D('actual M_eta for p2',k,Me.M)),G.mul(q(4),g.eta,M.S),G.mul(g.d,D('actual S_eta',k,Me.S)),G.mul(Xjet,G.add(G.mul(q(4),g.eta,Pi),G.mul(g.d,PiEta)))));
    return {E:a.E,U:a.U,a:ar,bs,ts,vs,p1,p2,invA};
  });
  const tilt=k=>memo('tilt'+k,()=>{
    const Z=G.pow(S,13),E=G.exp(G.mul(q(2),Z)),Mnorm=G.mul(q(9),E),Mlower=G.exp(G.neg(G.mul(q(2),Z))),invM=J.inverse('actual exponential circle mean M inverse',k,Mnorm,Mlower),arg=G.mul(q(3),G.add(one,Z));
    const numerator=J.exponential('actual exp(z sin theta)',k,arg),normalized=G.mul(numerator,invM),ratio=G.mul(Mnorm,G.pow(invM,2));
    return {normalized,ratio,Mnorm,Z};
  });
  const loop=k=>memo('loop'+k,()=>{
    const a=loopInput(k),z0=G.pow(S,13),high=tilt(k+2),Qjet=G.mul(q((k+1)*(k+2)),high.ratio),Qlower=G.exp(G.neg(G.pow(S,14)));
    J.record('removable Q at p2=0',k,'integral_0^1 (1-s) R_second(s*z) ds',Qjet,[high.ratio],{requiredTiltOrder:k+2,divisionByP2:false,actualValueLower:Qlower});
    const cut=sigmaAt('actual C1 delta-width cutoff',k,G.mul(q(8),G.inv(delta),G.add(q(4),a.vs))),vStar=G.add(q(2),G.mul(q(1,2),delta)),rad=G.mul(G.add(vStar,a.vs),a.invA),radLower=G.div(delta,G.mul(q(4),S));
    const rnorm=G.mul(G.add(one,cut),J.squareRoot('actual nonzero branch r=sqrt((vStar-vs)/a)',k,rad,radLower)),target=G.add(a.vs,G.mul(G.pow(G.add(one,cut),2),G.add(vStar,a.vs)));
    const muVar=G.add(one,muMax),zin=G.mul(muVar,a.p2),composedQ=J.compose('Q(mu*p2) in actual implicit equation',k,Qjet,G.add(q(2),zin)),sq=J.squareRoot('actual sqrt Q(mu*p2)',k,composedQ,Qlower),equation=G.add(G.mul(d0,muVar,sq),rnorm);
    const muRoot=J.implicit('same nonnegative actual C1 mu root',k,equation,G.exp(G.pow(S,14)),muMax),tiltD=D('actual derivative of normalized tilt',k,tilt(k+1).normalized),zinRoot=G.mul(muRoot,a.p2);
    const t=G.add(a.ts,G.mul(d0,muRoot,J.compose('removable actual t integral',k,tiltD,G.add(q(3),zinRoot)))),invTarget=J.inverse('actual vTarget denominator',k,target,q(2)),density=G.mul(a.a,G.add(one,G.pow(t,2)),invTarget);
    const phi=J.prefix('actual circle lift on one period',k,density,q(8)),theta=J.implicit('same actual circle inverse lift',k,G.add(phi,q(2)),G.mul(q(16),G.pow(S,2)),q(16));
    const AtTheta=G.mul(q(1,2),a.a,G.add(phi,q(8))),BtTheta=G.mul(q(1,2),a.E,a.a,G.add(G.mul(a.ts,phi),J.prefix('actual B primitive t integral',k,t,q(8)))),meanA=G.mul(q(8),AtTheta,density),meanB=G.mul(q(8),BtTheta,density);
    const A=G.add(G.mul(q(1,2),a.a,G.add(q(2),theta)),meanA),B=G.add(G.mul(q(1,2),a.E,a.a,G.add(G.mul(q(2),a.ts),J.compose('actual B integral at inverse lift',k,J.prefix('actual t prefix',k,t,q(8)),G.add(q(2),theta)))),meanB);
    const phaseFactor=G.pow(G.add(one,N),k),physicalA=G.div(G.mul(phaseFactor,A),N),du=G.div(G.mul(phaseFactor,B),N),de=G.mul(a.E,G.add(one,J.exponential('actual finite-N E multiplier',k,physicalA)));
    J.record('actual fast phase substitution',k,'Dy^r B(y,eta,N*y)=sum binom(r,j) N^j B_(y^(r-j),phase^j)',du,[B,N],{factor:phaseFactor,etaPhaseDerivative:0,sameN:true,periodicValueBoundUsedOnOnePeriod:true});
    return {A,B,mu:muRoot,theta,du,de,source:a,Qjet,target,phaseFactor};
  });
  const final=k=>memo('final'+k,()=>{
    const a=premod(k),b=loop(k),g=geom(k),du=b.du,de=b.de,E=a.E,U=a.U;
    const densities=[G.mul(Xjet,du),G.mul(sqrtXjet,Xjet,de),G.mul(sqrtXjet,Xjet,G.add(G.mul(E,du),G.mul(U,de),G.mul(du,de))),G.mul(Xjet,G.add(G.mul(q(2),U,du),G.pow(du,2),G.mul(E,de),G.mul(q(1,2),G.pow(de,2)))),G.add(G.mul(E,de),G.mul(q(1,2),G.pow(de,2)))];
    const debts=densities.map((v,j)=>J.record('actual C12 debt '+j,k,'same-N actual density integral over fixed log-radius endpoints',G.mul(length,v),[v,length],{allQuadraticCrossTermsRetained:true}));
    const Kbase=G.mul(Pstar,G.exp(G.add(G.mul(q(-1,2),P('T')),q(-7,10),G.mul(q(-1,2),lambda),G.neg(G.mul(G.add(q(1,2),lambda),G.sub(G.mul(q(60),P('BOuter')),q(25))))))),Knorm=G.mul(Kbase,g.f),invK=G.div(q(5),Kbase),X0=P('X0I1'),X032=G.sqrt(G.pow(X0,3));
    const rows=[G.mul(debts[0],G.inv(X0),invK,G.inv(lambda)),G.mul(G.add(G.mul(debts[2],G.inv(X032),G.pow(invK,2)),G.mul(debts[0],G.inv(X0),invK)),G.pow(lambda,-2)),G.mul(debts[1],G.inv(X032),invK,G.inv(lambda)),G.mul(debts[3],G.inv(X0),G.pow(invK,2),G.inv(lambda)),G.mul(debts[4],G.pow(invK,2),G.inv(lambda))];
    const rhs=G.add(...rows),equation=G.add(one,G.mul(q(1n<<30n),rhs),G.mul(q(1n<<40n),lambda));
    const root=J.implicit('same actual continuous I1 root at arbitrary finite eta order',k,equation,q(2),q(5,1000000),5),bump=unitBump('actual unit-mass I1 width1/2 bumps',k,q(64),q(2)),repair=G.mul(Knorm,lambda,root,bump);
    return {U: G.add(U,du,repair),E:G.add(E,de,repair),I1root:root,normalizedDebtRows:rows,actualC12Debts:debts,repair,loop:b};
  });
  const heatActive=k=>memo('heatActive'+k,()=>{
    const h=P('h'),g=geom(k),X0=P('X0I2'),eStar=G.mul(Pstar,G.exp(G.add(G.mul(q(-1,2),P('T')),q(-7,10),G.mul(q(-1,2),lambda),G.neg(G.mul(G.add(q(1,2),lambda),G.sub(G.mul(q(60),P('BOuter')),q(20))))))),Knorm=G.mul(eStar,g.f),invK=G.div(q(5),eStar);
    // L(z)=E_Gamma(1+h)[1-(1+z*t)^(-h)]. At z>=0,
    // |L^(j)| <= (h)_j(1+h)_j. Z=2(1-eta^2)/X has
    // nonconstant eta Taylor norm <=6/X. Keep an explicit 1/X in
    // every derivative for the ACTUAL improper radial integral.
    let loss=G.mul(q(4),h),ph=one,p1h=one;const rows=[];
    for(let j=1;j<=k;j++){
      ph=G.mul(ph,G.add(h,q(j-1)));p1h=G.mul(p1h,G.add(h,q(j)));
      const term=G.mul(q(6n**BigInt(j),factorial(j)),ph,p1h);loss=G.add(loss,term);rows.push({order:j,gammaRatioRoot:p1h,fallingHeatRoot:ph,term});
    }
    J.record('actual heat loss arbitrary eta jet with radial decay',k,'Gamma recurrence and finite composition; X*[L(2d/X)]_eta,k <= loss',loss,[h],{gammaMomentRows:rows,constantTerm:'L(Z)<=4h/X',radialDecayRetained:'1/X',improperTailIncluded:true});
    const quadraticLoss=G.add(loss,G.mul(q(1,2),G.pow(loss,2)));
    // H4: eK<=eStar and eK*sqrt(XK)<=eStar*sqrt(X0), XK>=X0.
    // These are source value inequalities, valid before differentiation;
    // all eta derivatives were generated above, rather than borrowed from H9 C2.
    const heatI=G.div(G.mul(q(4),loss,eStar,G.sqrt(X0)),h),heatS=G.mul(q(4),G.pow(eStar,2),quadraticLoss),heatCp=G.div(heatS,X0);
    const X032=G.sqrt(G.pow(X0,3)),rhsRows=[G.mul(heatI,G.inv(lambda),G.inv(X032),invK),G.mul(heatS,G.inv(lambda),G.inv(X0),G.pow(invK,2)),G.mul(heatCp,G.inv(lambda),G.pow(invK,2))],equation=G.add(one,G.mul(q(1n<<30n),G.add(...rhsRows)),G.mul(q(1n<<40n),lambda));
    const root=J.implicit('same actual I2 heat compensating root at arbitrary eta order',k,equation,q(2),q(3,1000000),3),correction=G.mul(Knorm,lambda,root,unitBump('actual I2 unit-mass E bumps',k,q(64),q(2)));
    return {E:G.add(final(k).E,correction),I2root:root,loss,heatI,heatS,heatCp,normalizedDebtRows:rhsRows,correction,
      sourceH4:{XStar:X0,eStar,inequalities:['eK<=eStar','eK*sqrt(XK)<=eStar*sqrt(XStar)','XK>=XStar>=1'],source:'HEAT_COMPENSATION_PROOF_EN.md H2-H4'},
      radialIntegrals:{I:'integral_1^infinity x^(-1-h) dx=1/h',S:'integral_1^infinity x^(-1-2A) dx=1/(2A)<=1',Cp:'integral_1^infinity x^(-2-2A) dx=1/(1+2A)<=1'}};
  });
  const f=final(n),active=heatActive(n),inside=inner(n),core=natural(n,true),coreU=G.add(q(10),G.div(core,Lambda)),coreF=G.mul(gNorm(n),core),conversion=physicalXConversion(r,m),ordinary=q(factorial(n));
  const annulusFactor=G.mul(G.add(one,q(conversion.ordinaryCoefficient)),G.pow(G.add(one,G.inv(Xa)),r)),Ubound=G.add(G.mul(ordinary,coreU),G.mul(annulusFactor,f.U)),FinnerBound=G.add(G.mul(ordinary,coreF),G.mul(annulusFactor,inside.F));
  const FactiveBound=G.add(G.mul(ordinary,coreF),G.mul(annulusFactor,invSqrtXjet,active.E)),Xplus=G.mul(Xv,G.exp(one));
  const b8proof=actualB8ContractionProof(),i1proof=actualI1ContractionProof(),i2proof=actualHeatI2ContractionProof(),checks=[...sourceChecks(source),
    {id:'actual-source-program-internally-constructed',pass:functionIdentity.sameOriginalN&&functionIdentity.actualB8AndI1RootBodiesPresent&&functionIdentity.actualHeatI2RootBodyPresent},
    {id:'all-needed-source-step-derivatives-generated',pass:primitive.pass&&Math.max(...J.rows.map(x=>x.sourceLargestDerivative??0))<=primitive.order},
    {id:'same-B8-C0-root-positive-Jacobian',pass:Object.values(b8proof.checks).every(Boolean),proof:'The preconditioned Jacobian inverse is <2. The same C0 root is differentiated; no C^m small-ball premise is asserted.'},
    {id:'same-I1-C0-root-positive-Jacobian',pass:Object.values(i1proof.checks).every(Boolean),proof:'The exact continuous inverse is <2^30 and the preconditioned point Jacobian inverse is <2. Its old C2 smallness is used only to identify the C0 branch.'},
    {id:'same-I2-actual-heat-root',pass:Object.values(i2proof.checks).every(Boolean)&&functionIdentity.actualHeatI2RootBodyPresent,proof:'The actual improper heat debts, including their positive eta-dependent tails, define the same C0 root. New arbitrary eta derivatives use Gamma moments, not the old H9 C2 norm.'},
    {id:'source-function-and-bound-orders-separated',pass:J.rows.every(row=>row.order>=0&&row.order<=n+8)},
    {id:'physical-axis-removable-extension',pass:conversion.includesAllLogDerivatives&&G.nodes[Ubound]!==undefined&&G.nodes[FinnerBound]!==undefined},
  ];
  const roots={U0:Ubound,F0inner:FinnerBound,F0active:FactiveBound,U0LogTotal:f.U,F0innerLogTotal:inside.F,F0activeLogTotal:G.mul(invSqrtXjet,active.E),U0CorePhysicalTotal:coreU,F0CorePhysicalTotal:coreF,
    actualSourceR:R,actualSourceN:N,actualSourceXv:Xv,actualSourceXa:Xa,actualInnerXi:Xi,actualB8RootNorm:premod(n).B8root,actualI1RootNorm:f.I1root,actualMuRootNorm:f.loop.mu,actualCircleRootNorm:f.loop.theta};
  Object.assign(roots,{actualSourceXplus:Xplus,actualI2RootNorm:active.I2root,actualHeatLossEtaNormTimesX:active.loss,actualHeatIDebtNorm:active.heatI,actualHeatSDebtNorm:active.heatS,actualHeatCpDebtNorm:active.heatCp});
  return {schema:'MathScope.ActualLeadingAllOrderJets/1',profileId:SOURCE_PROFILE_ID,parameterExpressionSHA256:source.parameterExpressionSHA256,
    radialOrder:r,etaOrder:m,totalTaylorOrder:n,derivativeConvention:'ordinary physical X and ordinary eta',
    boundConvention:'Each returned scalar bounds every requested mixed derivative 0<=rPrime<=radialOrder, 0<=mPrime<=etaOrder; intermediate rows are total factorial Taylor norms.',
    etaEndpointConvention:'All eta derivatives at -1 and +1 are the continuous one-sided derivatives. The actual heat Laplace function is not asserted holomorphic across these endpoints.',
    normProgram:G.pack(roots,{schema:'MathScope.ActualLeadingAllOrderPositiveNormProgram/1',sourceFunctionIdentity:functionIdentity,ledger:J.rows}),
    bounds:{U0:{root:Ubound,domain:{X:['0','infinity'],eta:['-1','1'],exactZeroAfter:'Xv'},actualCompletedLeadingSource:true},
      F0inner:{root:FinnerBound,domain:{X:['0','sourceJLeft=Xa*exp(t1/16)'],eta:['-1','1'],includesNaturalAndActualB26:true,beforeC12:true},boundComputedOnLargerPreB26Domain:'0<=X<=Xi=110',completedLeadingEqualityOnlyBeforeC12:true,fullGlobalF0:false},
      F0active:{root:FactiveBound,domain:{X:['0','Xplus=Xv*exp(1)'],eta:['-1','1'],containsAllPositiveOrderVelocityCoefficientSupport:true,containsStressSupportFromOrder:2,containsFullFirstOrderAngularStressSupport:false},actualHeatI2CorrectionIncluded:true,actualHeatEditIsZeroOnThisDomain:true,fullGlobalF0:false}},
    sourceBindings:ACTUAL_LEADING_ALL_ORDER_BINDINGS,sourceFunctionIdentity:functionIdentity,
    primitive:{source:primitive.profileId,derivativeOrder:primitive.order,seedPower:primitive.activation.seedPower,
      ordinaryDerivativeBounds:primitive.activation.ordinaryDerivativeBounds,sourceDefinitionUnchanged:true},
    physicalConversion:conversion,rootProofs:{B8:b8proof,I1:i1proof,I2:i2proof},heatDerivativeProof:{sourceH4:active.sourceH4,radialIntegrals:active.radialIntegrals,actualGammaMomentRecurrence:true,allEtaOrdersGenerated:true,oldH9C2Extrapolated:false},
    checks,pass:checks.every(x=>x.pass),
    scope:{actualSameSourceFiniteLeadingJetsGenerated:true,arbitraryFiniteRecurrence:true,explicitResourceBudget:request.budget,
      fixedSixOrTwelveJetExtrapolation:false,oldRReselected:false,oldNReselected:false,highDerivativeBoundsMayExceedR:true,
      actualSignedDebtNumericallyEvaluated:false,actualF0OnAllPositiveOrderVelocitySupportBounded:true,actualF0OnStressSupportFromOrderTwoBounded:true,fullFirstOrderAngularStressSupportCovered:false,fullGlobalF0DerivativeBound:false,positiveOrderCoefficientNormProduced:false,
      allOrderCutoffScheduleProduced:false,completedBackgroundC2TailCertified:false,actualUniformHColumnsCertified:false,
      sourceUniformQStarCertified:false,originalN506Complete:false,formalKernelProof:false}};
}
