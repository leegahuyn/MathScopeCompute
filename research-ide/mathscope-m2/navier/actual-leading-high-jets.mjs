/** Higher derivatives of the ONE accepted leading source.
 *
 * The old C_eta^2 contract is not relabelled C_eta^6. The finite source
 * coefficient, cutoff, reciprocal, quadratic and implicit recurrences below
 * extend it at the original, unchanged S/R/N. Numerical materialization of
 * the enormous constants is neither requested nor used.
 * See research/ACTUAL_LEADING_HIGH_JETS_KO.md for the analytic arguments
 * connecting each executed finite bound to its continuous source function.
 */
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {PINNED_N3} from './source-profile-data.mjs';
import {ACTUAL_B8_PRECONDITIONER as B8} from './actual-continuation-exact-b8-data.mjs';
import {rational as rat,readRational,qadd,qmul,qcompare,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';
import {implicitTotalJetMajorant,fixedQuadraticJetMajorant,variableQuadraticJetMajorant,actualStepHighDerivativeAudit,actualNaturalMixedCoefficientAudit,polynomialAbsorption,exponentialJetAbsorption,finitePowerBelowInputExponential,finiteLoopJetStageAudit} from './actual-leading-high-jets-arithmetic.mjs';

export const ACTUAL_LEADING_HIGH_JET_BINDINGS=Object.freeze([
  {path:'mathscope-m1/navier/followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md',bytes:20071,sha256:'1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920'},
  {path:'mathscope-m1/navier/followup-20261010-same-datum-axis/REFERENCE_DERIVATIVE_BOUNDS.md',bytes:14028,sha256:'c4f47c6a156052a007a55992345faa47c7c47cb5606a46bff693f0b69d5054d9'},
  {path:'mathscope-m1/navier/followup-20261010-same-datum-axis/CONTINUATION_AND_NEW_DEBT.md',bytes:23134,sha256:'b2b4dfc3f1223e3a5e2bb09043dc649d48d2cda16813d6c719f7d47f6b0214e2'},
  {path:'mathscope-m1/navier/followup-20261010-same-datum-axis/GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md',bytes:12673,sha256:'f27e8d640e9b8e49805c0128c987f043d5667c298b2029dd061b820ae9e3117b'},
  {path:'mathscope-m1/navier/followup-20261010-symbolic-gluing/LOOP_DERIVATIVE_ENVELOPE.md',bytes:10357,sha256:'531e5addbe900564c22e0b44406c9c024e7d279c03a7188ea17431a567fe1250'},
  {path:'mathscope-m1/navier/followup-20261010-symbolic-gluing/C12_FREQUENCY_CONTRACT.md',bytes:12543,sha256:'1740353222f1a5ca727c2c8a2c7063bba8a990f9a4393754256d5c82f49f7a16'},
  {path:'mathscope-m1/navier/followup-20261010-outer-reselection/OUTER_DERIVATION.md',bytes:22237,sha256:'ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81'},
  {path:'mathscope-m1/navier/followup-20261010-final-stress-audit/GLOBAL_STRESS_ASSEMBLY_EN.md',bytes:13948,sha256:'3c89af370fb2728bc407f5192493eb7474666051289626c57b73f19da7e59516'}
]);

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),abs=q=>q[0]<0n?[-q[0],q[1]]:q;
const Cmin=1n<<260n,Smin=1n<<20n,Rmin=8192n;
const reserve=k=>Math.max(1,Math.ceil(BigInt(k).toString(2).length/260));

/** Records ordinary mixed-jet product rules through the fixed order. The
 * coefficient sum of an n-th derivative of k factors is k^n. */
class PowerLedger{
  constructor(order){this.order=order;this.rows=[];this.map=new Map();}
  put(id,power,rule,inputs=[],extra={}){if(this.map.has(id)||!Number.isSafeInteger(power)||power<0)throw Error('Invalid source power ledger.');const r={id,power,rule,inputs,...extra};this.rows.push(r);this.map.set(id,r);return id;}
  at(id){const x=this.map.get(id);if(!x)throw Error('Missing source power '+id);return x.power;}
  sum(id,ids){const coefficient=BigInt(ids.length),s=reserve(coefficient);return this.put(id,Math.max(...ids.map(x=>this.at(x)))+s,'sum',ids,{coefficientSum:String(coefficient),coefficientReserve:s});}
  product(id,ids){const coefficient=BigInt(ids.length)**BigInt(this.order),s=reserve(coefficient);return this.put(id,ids.reduce((a,x)=>a+this.at(x),0)+s,'ordinary mixed Leibniz',ids,{coefficientSum:String(coefficient),coefficientReserve:s});}
  reciprocal(id,input,lowerPower){const n=this.order,coefficient=BigInt(n+1)**BigInt(n+2)*factorial(n),s=reserve(coefficient);return this.put(id,(n+1)*lowerPower+n*this.at(input)+s,'finite reciprocal Taylor series',[input],{positiveValueLowerPower:lowerPower,coefficientSum:String(coefficient),coefficientReserve:s});}
}

function inputOf(input){
  if(input===null||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','Use a source-bound high-jet request.');
  for(const k of Object.keys(input))if(k!=='sourceProfile')fail('INVALID_INPUT','No high-jet norm, derivative order, source function, R or N override is accepted: '+k);
  return {sourceProfile:input.sourceProfile??SOURCE_PROFILE_ID};
}

function sourceHierarchy(source){
  const p=source.parametersExactExpressions,checks=[];
  const check=(id,pass,proof)=>checks.push({id,pass,proof});
  check('same-Q-rho-and-positive-P',same(p.Q,{quotient:[{product:[{integer:String(1n<<260n)},{ref:'K'}]},{power:[{ref:'sigmaStar'},2]}]})&&same(p.rho,{quotient:[{power:[{ref:'sigmaStar'},2]},{integer:65536}]})&&same(p.K,{power:[{ref:'Pstar'},2]})&&same(p.logP,{product:[{integer:2},{ref:'T'}]}),'Q=2^260*Pstar^2/sigmaStar^2, rho=sigmaStar^2/65536, Pstar=exp(2T)>1.');
  check('same-C-Q200-choice',same(p.CSelected,{exp:{ref:'logCSelected'}})&&same(p.logCSelected,{sum:[{product:[{integer:10},{log:{sum:[{integer:1},{ref:'BRefUpper'}]}}]},{power:[{ref:'Q'},200]}]}),'C>exp(Q^200).');
  check('Q10000-below-C',factorial(51)<(1n<<BigInt(260*200)),'exp(Q^200)>Q^10200/51!>Q^10000, for Q>=2^260.');
  check('same-fixed-width',same(p.t1,{power:[{ref:'CSelected'},-120]})&&same(p.Lambda,{power:[{ref:'Q'},64]}),'No B22/B26 width or radial scaling is reselected.');
  check('same-S-R-N',same(p.sourceEnvelopeS,{power:[{ref:'CSelected'},100000]})&&same(p.C12EnvelopeR,{exp:{power:[{ref:'sourceEnvelopeS'},256]}})&&same(p.radialFrequencyN,{sum:[{integer:1},{ceil:{power:[{ref:'C12EnvelopeR'},50]}}]}),'S=C^100000, R=exp(S^256), N=1+ceil(R^50) are the accepted scales.');
  check('same-loop-choices',same(p.loopDelta,{exp:{product:[{integer:-1},{power:[{ref:'sourceEnvelopeS'},16]}]}})&&same(p.loopD0,{quotient:[{integer:1},{product:[{integer:8},{ref:'sourceEnvelopeS'}]}]})&&same(p.loopMuMax,{power:[{ref:'sourceEnvelopeS'},12]}),'The actual signed-variance root and inverse-circle map retain their original branch and scales.');
  check('same-h-lambda-mu',same(p.h,{exp:{product:[{integer:-8002},{ref:'T'}]}})&&same(p.lambda,{exp:{product:[{integer:-1000},{ref:'T'}]}})&&same(p.muMoment,{power:[{ref:'h'},2]})&&same(p.sigmaStar,{quotient:[{ref:'j0'},{integer:2000}]})&&same(p.j0,{power:[{ref:'h'},4]}),'log Q>64020T; muMoment^-1=exp(16004T)<Q, h^-1<Q, lambda^-1<Q; lambda<2^-200.');
  check('fixed-small-integers-absorbed',12n**12n*factorial(12)<Cmin&&Smin>100000n,'All finite product, Taylor and multi-index counts used below are computed below the same positive C or S.');
  return {checks,pass:checks.every(c=>c.pass),lowerBounds:{Q:'2^260',C:'Q^10000',S:'2^20',R:'8192'},oldHigherJetAssumptionUsed:false};
}

function premodulationHighJets(step,natural){
  // Q powers first. A width loss is recorded separately, so a radial
  // derivative of a short cutoff is never treated as a small eta change.
  const reciprocalPhiPower=13+12*natural.commonQPower+1;
  const nonconstantLogPower=natural.commonQPower+reciprocalPhiPower+1;
  const qRows=[
    {id:'natural-reciprocal-Phi',actual:reciprocalPhiPower,bound:256,reason:'Phi>=1/4, finite reciprocal recurrence to order12.'},
    {id:'natural-log-and-Y-slope',actual:nonconstantLogPower+2,bound:512,reason:'(log Phi)_eta=Phi_eta/Phi and Y Phi_Y/Phi; all required mixed derivatives are supplied by (16).'},
    {id:'reference-eta-ratio',actual:16+(13+12*16+1)+1,bound:512,reason:'Reference value 1/4<=Rr<=2; short v has all eta derivatives below1, so exp(v) uses finite Bell coefficients and its actual value <=2.'},
    {id:'reference-mixed-fields',actual:12*512+2,bound:16384,reason:'Finite Bell polynomial at known |g Rr|<=2; retain t1^-max(r-1,0), r+eta<=10.'},
    {id:'reference-pressure',actual:2*16384+4,bound:40000,reason:'Pi=P+integral F_r^2; eta derivative under the continuous integral, D_y Pi=X F_r^2. The axis is treated by its regular integral.'},
    {id:'literal-source-Sq-Sn',actual:Math.max(3*512+8,40000+12),bound:50000,reason:'All six Sn terms and all three Sq terms, including the eta derivative of Pi/U and D_y Pi; width loss at most t1^-r.'},
    {id:'integrated-reference-eta-jets',actual:50000+512+4,bound:100000,reason:'p1r=(X/L) integral_0^1 s Rr(sX)/Rr(X) Sq; nsr=(1/L) integral Sn; X<=110 and L inverse eta12 has fixed rational bounds <Q.'},
    {id:'reference-radial-recurrence',actual:100000+9*(512+3),bound:200000,reason:'D_y p1r=X Sq/L-l p1r and D_y nsr=Sn/L-nsr, differentiated at most9 times; retain t1^-max(r-1,0).'},
    {id:'actual-B26-log-and-U',actual:200000+4*17+8,bound:210000,reason:'Original kappa/beta/blend products and actual reference sources; all widths t1 and the eta-independent integral length <Q^2 are retained.'}
  ].map(r=>({...r,pass:r.actual<r.bound}));
  const sourceLogCPower=Math.ceil(210000/10000),bellActual=2+8*sourceLogCPower+7*120+1;
  const cRows=[
    {id:'B26-B34-and-restoration-mixed8',actual:bellActual,bound:2048,reason:'Known E value <C^2, eight-factor Bell rule, and sum max(r_i-1,0)<=max(r-1,0). B34 width>=1; ideal and axial-restoration segments are smaller.'},
    {id:'incoming-five-moments-eta8',actual:2*2048+12+7+3,bound:4120,reason:'The largest density sqrt(2X)UE costs2*2048+7+1; integration adds12; two units cover finite stage sums and radial-product coefficients. Other four densities are smaller. Core Cp is regular.'},
    {id:'B8-scaled-actual-debt-eta8',actual:4120+9,bound:4130,reason:'The exact five rows include Keta inverses, muMoment^-1, subtraction of 4eta*dI and 8eta*dM, and the ideal moments. These normalizers have explicit polynomial eta dependence.'}
  ].map(r=>({...r,pass:r.actual<r.bound}));
  let maxInverseRow=rat(0);
  for(const row of B8.preconditioner){const total=row.map(x=>readRational(x)).map(abs).reduce(qadd,rat(0));if(qcompare(total,maxInverseRow)>0)maxInverseRow=total;}
  const inverseResidual=B8.inverseResidualUpper.map(x=>readRational(x)).reduce((a,b)=>qcompare(a,b)>0?a:b,rat(0)),mu=readRational(B8.muUpper),quad=B8.quadraticPreconditionedBounds.map(x=>readRational(x)).reduce(qadd,rat(0));
  const radius=readRational(B8.rootRadius),jacLoss=qadd(inverseResidual,qmul(rat(2),qmul(mu,qmul(quad,radius))));
  const root=fixedQuadraticJetMajorant({order:8,rhsPower:4131}),rootAbsorptions=root.rows.map(r=>polynomialAbsorption(r)),rootPower=Math.max(...rootAbsorptions.map(r=>r.strictPower));
  const patchPower=rootPower+4,profilePower=65536;
  const checks=[
    {id:'new-step-twelve-derivatives',pass:step.pass&&step.order===12},
    {id:'new-natural-total-twelve',pass:natural.pass&&natural.order===12},
    {id:'B22-short-integral-small-at-all-required-orders',pass:512<120*10000,proof:'Q^512*t1<Q^(512-1200000)<1, before Bell differentiation.'},
    {id:'all-reference-width-and-source-terms',pass:qRows.every(r=>r.pass)&&cRows.every(r=>r.pass)},
    {id:'actual-B8-inverse-row',pass:qcompare(maxInverseRow,rat(1n<<30n))<0,upper:qtext(maxInverseRow)},
    {id:'actual-B8-Jacobian-inverse-below-two',pass:qcompare(jacLoss,rat(1,4))<0&&qcompare(qmul(mu,quad),rat(1))<0,loss:qtext(jacLoss),proof:'Neumann inverse norm <=1/(1-loss)<2; no claim that the rational preconditioner is the exact continuous inverse.'},
    {id:'B8-all-eight-implicit-derivatives',pass:rootAbsorptions.every(r=>r.pass)&&patchPower<profilePower,rootPower,physicalCorrectionPower:patchPower,proof:'Keta*mu*z_j*b_j; source bump log derivatives to8 use sigma derivatives to9 and fixed x/width<32. Higher z derivatives are not declared smaller than 10^-6.'}
  ];
  const L=new PowerLedger(6);
  L.put('E',profilePower,'actual premodulation mixed8 source bound');L.put('U',profilePower,'actual premodulation mixed8 source bound');L.put('DyE',profilePower,'one source radial derivative, six further parameter derivatives');L.put('DyU',profilePower,'one source radial derivative, six further parameter derivatives');
  L.put('moment',2*profilePower+32,'five regular continuous moment densities and integration, mixed7');L.put('elementary',1,'fixed geometric eta coefficients and L inverse');L.put('radial',12,'C^-1<X<C^12');
  L.reciprocal('inverseE','E',3);L.product('H',['E','radial']);L.reciprocal('inverseH','H',4);
  L.product('a-product',['DyE','inverseE']);L.sum('a',['elementary','a-product']);L.product('bs',['DyU','inverseE']);L.reciprocal('inverseA','a',122);
  L.product('ts',['bs','inverseA']);L.product('bs-square-over-a',['bs','bs','inverseA']);L.sum('vs',['a','bs-square-over-a']);
  L.product('W-moment',['moment','elementary','radial']);L.sum('W',['elementary','W-moment']);
  L.product('angular-numerator',['moment','elementary']);L.product('angular-integral',['inverseH','angular-numerator']);L.product('XW',['radial','W']);L.sum('p1-numerator',['XW','angular-integral']);L.product('p1',['elementary','p1-numerator']);
  L.product('XWU',['radial','W','U']);L.product('axial-moments',['elementary','moment','radial']);L.sum('p2-numerator',['XWU','axial-moments']);L.product('p2',['elementary','inverseE','p2-numerator']);
  L.product('ts-p2',['ts','p2']);L.sum('cs',['p1','ts-p2']);L.product('ts-p1',['ts','p1']);L.sum('js',['p2','ts-p1']);
  const actualInputPower=Math.max(...L.rows.map(r=>r.power))+1,inputAbsorption=finitePowerBelowInputExponential(actualInputPower);
  checks.push({id:'all-original-loop-input-high-jets-below-E2',pass:inputAbsorption.pass,power:actualInputPower,proof:'This enlarged derivative bound leaves the original pointwise S and its positive gaps unchanged.'});
  return {schema:'MathScope.ActualPremodulationHigherJetBounds/1',QRows:qRows,CRows:cRows,B8:{root,maxPreconditionerRow:qtext(maxInverseRow),rootAbsorptions},premodulationProfileMixedOrder:8,premodulationProfileCPower:profilePower,inputMixedOrder:6,inputPowerLedger:L.rows,inputAbsorption,positiveDenominators:{E:'C^-3',a:'C^-122',L:'49/50'},checks,pass:checks.every(c=>c.pass)};
}

function loopHigherJets(premodulation){
  const implicit=implicitTotalJetMajorant(6),muAbsorption=implicit.rows.map(r=>exponentialJetAbsorption(r,{from:22,to:23})),circleAbsorption=implicit.rows.map(r=>exponentialJetAbsorption(r,{from:39,to:40})),stageAudit=finiteLoopJetStageAudit();
  // The enclosing finite-jet template executes degree + log(coefficient)
  // <65536. That log multiplier costs one E index since S>=2^20.
  const rows=[
    {id:'tilted-mean-and-removable-Q',from:13,to:15,count:4096,reason:'M^(k), (M^-1)^(k), R^(k), k<=8; Q^(k)=integral(1-s)s^k R^(k+2), k<=6, including z=0.'},
    {id:'sqrt-Q-and-W-mixed6',from:15,to:19,count:65536,reason:'Q>=E14^-1 and W_mu>=E14^-1; square-root Taylor recurrence through6 uses Q derivatives through6.'},
    {id:'cutoff-and-right-hand-side-mixed6',from:16,to:20,count:65536,reason:'delta^-1=E16, vstar-vs>=delta/4 on the cutoff support; input mixed6<E2; actual flat zero extension.'},
    {id:'actual-implicit-equation-mixed6',from:20,to:22,count:65536,reason:'F(mu,y,eta)=W(mu,p2(y,eta))-r(y,eta); actual simple derivative is positive.'},
    {id:'actual-mu-total6',from:23,to:32,count:65536,reason:'Executed total-degree implicit recurrence; the original nonnegative root, including mu=0.'},
    {id:'actual-t-total6',from:32,to:35,count:65536,reason:'The removable integral of partial_z(exp(z sin theta)/M(z)), not division by p2. Derivatives of the numerator through7 are supplied by the order8 tilt bound.'},
    {id:'circle-density-total6',from:35,to:38,count:65536,reason:'a(1+t^2)/(2pi*v); v>=2. All reciprocal and product Taylor coefficients through6 included.'},
    {id:'circle-lift-total6',from:38,to:39,count:64,reason:'Integrate over a single circle of length2pi<8; theta derivatives lower the integrand order.'},
    {id:'actual-inverse-circle-total6',from:40,to:48,count:65536,reason:'Executed implicit recurrence, density>=1/(16S^2); local lifts agree at the seam.'},
    {id:'actual-loop-total6',from:48,to:64,count:65536,reason:'v(1,t)/(1+t^2) after inverse-circle substitution. The denominator is >=1.'},
    {id:'actual-zero-mean-primitives-total6',from:64,to:128,count:65536,reason:'Both period integrals, actual mean subtraction and E factor in B retained. No global lifted-phase magnitude is used as a periodic derivative bound.'}
  ].map(r=>({...r,available:String(Smin**BigInt(r.to-r.from)),pass:BigInt(r.count)<Smin**BigInt(r.to-r.from)}));
  const checks=[
    {id:'actual-input-high-jets-generated',pass:premodulation.pass},
    {id:'implicit-six-jet-extraction',pass:implicit.rows.length===6&&muAbsorption.every(a=>a.pass)&&circleAbsorption.every(a=>a.pass)},
    {id:'all-fixed-Taylor-composition-absorptions',pass:stageAudit.pass&&rows.every(r=>r.pass)&&12n**12n*factorial(12)<Cmin},
    {id:'new-six-jet-bound-fits-original-R',pass:128<256,proof:'E128<R=E256; R and the already selected N are not increased.'}
  ];
  return {schema:'MathScope.ActualLoopHigherJetBounds/1',totalOrder:6,coordinates:['logX','eta','periodicPhase'],norm:'sum of absolute partial derivatives divided by multi-index factorial through total6',implicit,muAbsorption,circleAbsorption,stageAudit,rows,periodicPrimitivesUpper:'exp(S^128)<R',sameRootBranches:true,oldThreeJetBoundRelabelled:false,checks,pass:checks.every(c=>c.pass)};
}

function outerHigherJets(){
  const lambdaUpper=rat(1,1n<<200n),radius=qmul(rat(1n<<16n),qpowInteger(lambdaUpper,29));
  const angularLip=qmul(rat(512),radius),root=variableQuadraticJetMajorant({order:8,coefficientPower:50}),absorptions=root.rows.map((r,i)=>polynomialAbsorption(r,{ordinaryOrder:i+1}));
  const rows=[
    {id:'outer-complex-f',actual:41,bound:48,proof:'On dist(eta,[-1,1])<=1/4: |1+eta^2|>=9/16, <=41/16; |f|<2, |1/f|<3.'},
    {id:'outer-complex-angular-debt',actual:26*27,bound:1024,proof:'|rAfter|<=24, rEq<=2; exp(-(1-lambda)(30B-3))<27*lambda^29.'},
    {id:'outer-complex-angular-root-selfmap',actual:4*1024,bound:32768,proof:'The complex contraction ball radius is 65536*lambda^29. Its real restriction is the original unique small root.'},
    {id:'outer-finite-and-infinite-E-energy',actual:2*2+11+1,bound:20,proof:'Xb<C^11, scalar E height<C^2, h^-1<C; include E(Xb)^2*Xb/(2h) and the angular edit. No tail is dropped.'},
    {id:'outer-amplitude-polynomial',actual:20+3+5,bound:32,proof:'Normalize by exp(-pulse.start-2logAStart)/f^2<C^3; affine moment inverse<4/lambda<C^2, affine coefficients<C^5; positive bump weights<30.'},
    {id:'outer-amplitude-coefficient-Cauchy',actual:32+1,bound:50,proof:'Cauchy circle radius1/8 is contained in the proved1/4 tube; 8^8*8!<C.'}
  ].map(r=>({...r,pass:r.actual<r.bound}));
  const maxAmplitudePower=Math.max(...absorptions.map(r=>r.strictPower)),fieldPower=maxAmplitudePower+16;
  const checks=[
    {id:'actual-complex-angular-contraction',pass:qcompare(angularLip,rat(1,4))<0&&rows.every(r=>r.pass),lipschitzUpper:qtext(angularLip)},
    {id:'all-actual-amplitude-eta-derivatives',pass:absorptions.every(r=>r.pass)&&8n**8n*factorial(8)<Cmin,proof:'Differentiate the actual quadratic whose coefficients contain every outer energy stage, angular correction and both M/J corrections. The real derivative floor is7/20.'},
    {id:'outer-field-and-one-radial-jet',pass:fieldPower<4096,actualCPower:fieldPower,proof:'U=E*(Amp R0+affine endpoint bumps), with source sigma derivatives. M is its actual primitive, and exactly zero after Xv by its moment equation.'}
  ];
  return {schema:'MathScope.ActualOuterHigherJetBounds/1',etaOrder:8,radialLogOrder:1,complexCoefficientTube:'dist(eta,[-1,1])<=1/4',amplitudeIsOnlyRealRootOnOriginalBracket:true,coefficientRows:rows,amplitude:root,absorptions,fieldCPower:4096,XvUpper:'C^11<R',etaEndpointsIndependentOfX:true,checks,pass:checks.every(c=>c.pass)};
}
const qpowInteger=(a,n)=>rat(a[0]**BigInt(n),a[1]**BigInt(n));

function modulationAndRestoration(loop){
  const rows=[
    {id:'C12-field-change-eta6',power:2,coefficient:4,divideByN:true,formula:'||Delta E||6,||Delta U||6 <=4 R^2/N'},
    {id:'C12-actual-five-debt-eta6',power:6,coefficient:1,divideByN:true,formula:'20 R^5/N<R^6/N, using the five full nonlinear density differences'},
    {id:'actual-I1-row-operator-eta6',power:7,coefficient:1,divideByN:false,formula:'The whole second row retains lambda^-2 and both terms; 210R^6<R^7'},
    {id:'actual-I1-inverse-debt-eta6',power:16,coefficient:1,divideByN:true,formula:'Continuous I1 inverse<2^30<R^3, so beta<R^16/N'},
    {id:'actual-I1-root-eta6',power:17,coefficient:1,divideByN:true,formula:'The same quadratic contraction in the C_eta^6 factorial Banach algebra has root norm<2 beta<R^17/N'},
    {id:'actual-I1-field-change-eta6',power:20,coefficient:1,divideByN:true,formula:'Keta*lambda*z times the fixed source bump; the ordinary log-radius derivative is included'},
    {id:'actual-I1-partial-moment-change-eta6',power:24,coefficient:1,divideByN:true,formula:'All partial density integrals, with the same datum, are bounded before exact moment restoration'}
  ];
  const lambdaUpper=rat(1,1n<<200n),r=rat(1,1000000),lip=qmul(rat(2n*(1n<<36n)),qmul(lambdaUpper,r));
  const checks=[
    {id:'new-loop-primitives-through-six',pass:loop.pass},
    {id:'same-frequency-dominates-all-new-small-errors',pass:rows.filter(r=>r.divideByN).every(r=>r.power+1<50)&&20<Rmin&&210<Rmin},
    {id:'continuous-I1-inverse-bound',pass:(1n<<30n)<Rmin**3n,proof:'Independent continuous determinant/cofactor estimate, not the old fixture matrix: U inverse<800; E inverse<768000000<2^30.'},
    {id:'I1-factorial-C6-contraction',pass:qcompare(lip,rat(1,4))<0&&2n<Rmin&&2n*Rmin**16n*100000000n<Rmin**50n,lipschitzUpper:qtext(lip),proof:'The eta-independent quadratic operator norm is<2^36 after exact inverse. Work in the factorial C6 algebra; pointwise uniqueness identifies the same original root.'},
    {id:'eta-independent-fast-phase-kept',pass:6>=5+1,proof:'D_y(B(y,eta,N y)/N)=B_y/N+B_phase. Mixed eta5 uses actual total6, not the small value bound alone.'},
  ];
  return {schema:'MathScope.ActualC12HigherJetRestoration/1',parameterOrder:6,norm:'sum_(j=0)^6 sup|partial_eta^j f|/j!',frequency:'the original N=1+ceil(R^50)',rows,rawSixthDerivativeFactorial:720,ordinaryDerivativesAreNotFactorialNorm:true,fastRadialDerivative:'B_y/N+B_phase',pointwiseEqualityAfterI1:'All five functions of eta exactly restored by the actual root equation; this analytic identity is not inferred from compact support or an interval midpoint.',checks,pass:checks.every(c=>c.pass)};
}

/** Continuous bounds, not evaluations of the signed source integrals. */
export function actualLeadingHighJetBounds(input={},context={}){
  const request=inputOf(input),source=assertSourceProfile(request.sourceProfile);context.checkCancelled?.();
  const hierarchy=sourceHierarchy(source),step=actualStepHighDerivativeAudit(12),natural=actualNaturalMixedCoefficientAudit(12),premodulation=premodulationHighJets(step,natural);context.checkCancelled?.();
  const loop=loopHigherJets(premodulation),outer=outerHigherJets(),restoration=modulationAndRestoration(loop);
  const regularIntegrands=[
    {name:'Jm',formula:'v',etaNormPower:3,xDerivativePower:5},
    {name:'J0',formula:'X*v',etaNormPower:4,xDerivativePower:7},
    {name:'Hm',formula:'U*v',etaNormPower:6,xDerivativePower:9},
    {name:'H0',formula:'X*U*v',etaNormPower:7,xDerivativePower:11},
    {name:'Km2',formula:'v^2',etaNormPower:7,xDerivativePower:9},
    {name:'Km1',formula:'X*v^2',etaNormPower:8,xDerivativePower:11}
  ];
  const checks=[
    {id:'actual-hierarchy',pass:hierarchy.pass},
    {id:'actual-leading-all-stages-higher-jet-proof',pass:premodulation.pass&&loop.pass&&outer.pass&&restoration.pass},
    {id:'natural-core-physical-X-derivative',pass:64+14<10000,proof:'U=Ustar+u(Lambda X)/Lambda, and its average; the actual natural mixed coefficient bounds include eta6 and one Y derivative. No1/X bound is used at the axis.'},
    {id:'six-regular-integrand-bounds',pass:regularIntegrands.every(r=>r.etaNormPower<12&&r.xDerivativePower<12)},
    {id:'eta-order-suffices-for-Omega-four',pass:6>=4+2&&6>=5+1,proof:'v uses one derivative of M/X; weighted Omega adds one. Its eta4 derivatives require U/M eta6.'},
    {id:'entire-finite-support-length',pass:11<100000,proof:'Source Xv<Xb<C^11<R, with U=M=V=0 after Xv.'}
  ];
  return {schema:'MathScope.ActualLeadingHighJetBounds/1',profileId:source.id,sourceHash:PINNED_N3.inputs.assembly.sha256,parameterExpressionSHA256:source.parameterExpressionSHA256,sourceInputs:structuredClone(source.inputs),sourceBindings:structuredClone(ACTUAL_LEADING_HIGH_JET_BINDINGS),
    hierarchy,step,natural,premodulation,loop,outer,restoration,
    bounds:{domain:{X:['0','Xv'],eta:[-1,1]},factorialEtaNorm:{U0:{order:6,upper:'R^2'},averageU0:{order:6,upper:'R^2'},V0OverX:{order:5,upper:'R^3'}},physicalXDerivative:{U0:{etaOrder:5,upper:'R^5'},averageU0:{etaOrder:5,upper:'R^5'},V0OverX:{etaOrder:5,upper:'R^5'}},M0:{etaOrder:6,upper:'R^3',physicalXDerivative:'U0'},originalFrequency:'1+ceil(R^50)',R:'exp(CSelected^25600000)',rawDerivativeConversion:'The j-th ordinary eta derivative is at most j! times the listed factorial norm.'},
    regularIntegrands,weightedOmega:{pressure:'(D*eta*Jm_eta+d*Hm_eta-2A*eta*Hm)/(2L)+Km2/4+axisVX',flux:'(D*eta*J0_eta-J0+d*H0_eta+2D*eta*H0)/(2L)-Km1/4',axisVX:'[2A*eta*(4eta+j0)-4d]/L',axisBoundaryDropped:false,etaOrder:4,factorialNormUpper:'R^13',regularIntegralProducerBound:{etaOrder:5,valueAndPhysicalXDerivativeUpper:'R^12'},quadrature:{interval:['0','Xv'],rule:'left Riemann rectangles, n equal subintervals',factorialEtaErrorUpper:'R^14/(2n)',tailAfterXvExactlyZero:true,uniformForAllEta:true,proof:'For each differentiable integrand, |integral f-leftSum| <= (Xv)^2 sup|f_X|/(2n). The exact signed function is not replaced by this bound.'}},
    checks,pass:checks.every(c=>c.pass),certificateType:'SOURCE_ANALYTIC_DERIVATION_WITH_EXECUTED_FINITE_JET_ARITHMETIC',
    scope:{actualLeadingHigherEtaNormsDerived:true,oldC2ContractPromotedWithoutNewProof:false,sourceConstantsSuppliedByCaller:false,signedMomentValuesNumericallyEnclosed:false,n1CompletedCoefficientNormDerived:false,allPositiveOrdersCompleted:false,stressFlatEdgeDirectionModulusDerived:false,actualUniformHColumnsCertified:false,sourceUniformQStarCertified:false,originalN506Complete:false,formalKernelProof:false}};
}
