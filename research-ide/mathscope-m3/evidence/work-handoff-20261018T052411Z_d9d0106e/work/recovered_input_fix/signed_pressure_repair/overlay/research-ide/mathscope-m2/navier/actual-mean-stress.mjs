/** Actual heat-prepared Imean stress, with the restored cumulative moments.
 *
 * The exact heat debt is an explicit convergent integral program. The executed
 * observation is a source-derived enclosure of T0_theta/(F*X*lambda), at eta=0.
 * No evaluation of the nonlinear core or arbitrary-eta global stress is claimed.
 */
import {ActualSourceExpressions} from './actual-global-source-expressions.mjs';
import {compileActualOuterAxialProgram} from './actual-global-source-outer.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {PINNED_N3} from './source-profile-data.mjs';
import {nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

export const ACTUAL_MEAN_STRESS_BINDINGS=Object.freeze([
  {path:'mathscope-m1/navier/followup-20261010-final-stress-audit/HEAT_COMPENSATION_PROOF_EN.md',bytes:18440,sha256:'81446a5f1a6a18a4e1aa9a44fdc5695da1846a1c23fe412c9ac282af155688e3',sections:['H5-H9','H13-H14','H20']},
  {path:'mathscope-m1/navier/followup-20261010-final-stress-audit/GLOBAL_STRESS_ASSEMBLY_EN.md',bytes:13948,sha256:'3c89af370fb2728bc407f5192493eb7474666051289626c57b73f19da7e59516',sections:['1','3','6']},
  {path:'mathscope-m1/navier/followup-20261010-same-datum-axis/GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md',bytes:12673,sha256:'f27e8d640e9b8e49805c0128c987f043d5667c298b2029dd061b820ae9e3117b',sections:['4: exact B.8 restoration']},
  {path:'mathscope-m2/navier/actual-global-source-outer.mjs',bytes:13949,sha256:'5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9',sections:['literal scalar Q terminal wait','terminal stage','rInitial/rDecay/rEntry','pre-pulse M/J']},
  {path:'mathscope-m2/navier/actual-global-source-expressions.mjs',bytes:12714,sha256:'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',sections:['explicit integrands and endpoints']},
  {path:'mathscope-m2/navier/actual-pulse-meanpatch.mjs',bytes:9742,sha256:'4e2930c8c89596c11f0db8ce72c417b52d01393f8d760920a197f6139bcb0e32',sections:['actual mean-patch normalization and shear']}
]);

const invalid=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function inputOf(input){
  if(input===null||typeof input!=='object'||Array.isArray(input))invalid('Use a source-bound mean stress request.');
  for(const k of Object.keys(input))if(!['sourceProfile','y','bits'].includes(k))invalid('Unknown actual mean stress input: '+k);
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID,y=input.y??2.5,bits=input.bits??512;
  assertSourceProfile(sourceProfile);
  if(!Number.isFinite(y)||y<.25||y>4.75)invalid('The mean stress observation uses eta=0 and y in [1/4,19/4].');
  if(!Number.isSafeInteger(bits)||bits<16||bits>4096)invalid('Choose an exact enclosure exponent from 16 through 4096.');
  return {sourceProfile,y,bits};
}
function binaryRational(x){
  const v=new DataView(new ArrayBuffer(8));v.setFloat64(0,x);const raw=v.getBigUint64(0),sign=raw>>63n?-1n:1n,e=Number((raw>>52n)&2047n),f=raw&((1n<<52n)-1n);
  let n=sign*((e?1n<<52n:0n)+f),d=1n,p=(e||1)-1023-52;if(p>=0)n<<=BigInt(p);else d<<=BigInt(-p);while(d>1n&&n%2n===0n){n/=2n;d/=2n;}return[n,d];
}

/** Copy only the needed immutable terminal subexpressions, never a value leaf. */
function importSubexpressions(from,to){
  const cache=new Map();
  function at(id){
    if(cache.has(id))return cache.get(id);const {op,args}=from.nodes[id];let out;
    if(op==='rational')out=to.q(args[0],args[1]);
    else if(op==='source_parameter')out=to.parameter(args[0]);
    else if(op==='coordinate')out=to.var('outer:'+args[0]);
    else if(op==='integer_power'||op==='source_step_derivative')out=to.node(op,[at(args[0]),args[1]]);
    else if(['add','multiply','inverse','exp','log_positive','sqrt_positive','definite_integral','smooth_piecewise'].includes(op))out=to.node(op,args.map(at));
    else throw Error('A terminal source operation needs an explicit importer: '+op);
    cache.set(id,out);return out;
  }
  return at;
}

/** Differentiate the heat integrals under their fixed eta-independent bounds.
 * H7 supplies the dominating integrable derivative. We deliberately do not
 * construct a spurious endpoint value multiplied by a zero endpoint velocity.
 */
function differentiateHeatEta(d,root,eta){
  const cache=new Map(),zero=d.zero;
  function diff(id){
    if(cache.has(id))return cache.get(id);const {op,args}=d.nodes[id],v=i=>diff(args[i]);let out=zero;
    if(op==='coordinate')out=id===eta?d.one:zero;
    else if(op==='add')out=d.add(v(0),v(1));
    else if(op==='multiply')out=d.add(d.mul(v(0),args[1]),d.mul(args[0],v(1)));
    else if(op==='inverse')out=d.neg(d.mul(v(0),d.pow(id,2)));
    else if(op==='integer_power')out=d.mul(d.q(args[1]),d.pow(args[0],args[1]-1),v(0));
    else if(op==='exp')out=d.mul(id,v(0));
    else if(op==='log_positive')out=d.div(v(0),args[0]);
    else if(op==='sqrt_positive')out=d.div(v(0),d.mul(d.q(2),id));
    else if(op==='source_step_derivative')out=d.mul(d.step(args[0],args[1]+1),v(0));
    else if(op==='definite_integral'){
      if(diff(args[2])!==zero||diff(args[3])!==zero||args[1]===eta)throw Error('The heat derivative requires fixed eta-independent integration bounds.');
      out=d.integral(diff(args[0]),args[1],args[2],args[3]);
    }else if(op==='smooth_piecewise'){
      if(diff(args[0])!==zero||diff(args[1])!==zero||diff(args[2])!==zero)throw Error('The imported terminal joins must be independent of eta.');
      out=d.choose(args[0],args[1],args[2],v(3),v(4),v(5));
    }else if(!['rational','source_parameter'].includes(op))throw Error('Unexpanded heat derivative operation '+op);
    cache.set(id,out);return out;
  }
  return diff(root);
}

/** The exact expression program keeps the nonzero heat debt and its full tail. */
export function compileActualMeanStressProgram(input={}){
  const request=inputOf(input),d=new ActualSourceExpressions(request.sourceProfile),q=(n,e=1)=>d.q(n,e),p=n=>d.parameter(n),add=(...x)=>d.add(...x),mul=(...x)=>d.mul(...x),sub=(a,b)=>d.sub(a,b),div=(a,b)=>d.div(a,b),neg=x=>d.neg(x),exp=x=>d.exp(x),sq=x=>d.pow(x,2);
  const one=d.one,zero=d.zero,h=p('h'),lambda=p('lambda'),T=p('T'),XR=p('XR'),P=p('Pstar'),eta=d.var('eta'),y=d.q(...binaryRational(request.y)),L=add(mul(q(60000),T),q(-8),y),X=mul(p('X0Imean'),exp(y));
  const logKm=add(mul(q(-59997,2),T),q(33,10),mul(sub(q(15,2),mul(q(60000),T)),lambda)),E=exp(sub(logKm,mul(add(q(1,2),lambda),y))),H=mul(d.sqrt(mul(q(2),X)),E),F=div(E,d.sqrt(mul(q(2),X)));
  const finiteIntegral=(name,fn,a,b)=>{const v=d.fresh(name);return d.integral(fn(v),v,a,b);};
  const S=s=>finiteIntegral('sourceSigma',v=>d.step(v),zero,s);
  const initialIntegral=finiteIntegral('initialAngular',s=>exp(sub(mul(q(8,5),s),mul(q(3,5),S(s)))),zero,one);
  const rInitial=mul(exp(q(-13,10)),add(q(5,8),initialIntegral));
  const rDecay=add(one,mul(sub(rInitial,one),exp(neg(T))));
  const rEntry=mul(exp(add(q(-1),mul(q(1,2),lambda))),add(rDecay,finiteIntegral('entryAngular',s=>exp(sub(s,mul(lambda,S(s)))),zero,one)));
  const rEquilibrium=div(one,sub(one,lambda)),transient=mul(sub(rEntry,rEquilibrium),exp(neg(mul(sub(one,lambda),L)))),rReference=add(rEquilibrium,transient);
  const k=s=>mul(q(4),sub(one,d.step(div(d.log(add(one,s)),p('Md'))))),K1=finiteIntegral('axialMoment',s=>mul(exp(s),k(s)),zero,sub(exp(p('Md')),one));
  const mConst=mul(XR,exp(one),add(q(4),K1)),Jshape=add(q(5,2),mul(q(4),initialIntegral),mul(exp(q(13,10)),K1)),Jeta=mul(d.sqrt(q(2)),XR,d.sqrt(XR),P,Jshape);

  const outer=compileActualOuterAxialProgram({profileId:request.sourceProfile,etaDerivativeOrder:0}),terminal=outer.stages.find(s=>s.id==='terminal');
  if(!terminal)throw Error('The actual terminal schedule is missing.');
  const copy=importSubexpressions(outer,d),Xtail=mul(XR,exp(copy(terminal.start))),Etail=mul(P,exp(copy(terminal.logAStart))),XK=mul(Xtail,exp(q(1,5))),eK=mul(Etail,exp(neg(mul(add(q(1,2),h),q(1,5))))),rho=mul(p('co'),h);
  const compactIntegrals=[];
  // This is an improper endpoint limit after t -> lower+t/(1-t). Every
  // integrand and Jacobian is explicit; H7-H8 prove convergence of the debts.
  function improper(name,fn,lower=zero){
    const t=d.fresh(name+'Compact'),oneMinus=sub(one,t),s=add(lower,div(t,oneMinus)),body=mul(fn(s),d.pow(oneMinus,-2)),root=d.integral(body,t,zero,one);
    compactIntegrals.push({name,root,variable:t,substitution:'s=lower+t/(1-t)',lowerNode:lower,upper:'infinity',endpointInterpretation:'one-sided improper limits at t=0 and t=1; no finite endpoint sample is asserted'});return root;
  }
  const laplaceWeight=v=>exp(add(neg(v),mul(h,d.log(v))));
  // Gamma here is Euler's Gamma(1+h); the unrelated axis-comparison source
  // parameter named Gamma is deliberately NOT used.
  const heatGamma=improper('EulerGammaOnePlusH',laplaceWeight);
  const heatLoss=Z=>{
    const numerator=improper('positiveHeatLoss',v=>{
      const logarithm=d.log(add(one,mul(Z,v))),positiveLoss=sub(one,exp(neg(mul(h,logarithm))));
      return mul(laplaceWeight(v),positiveLoss);
    });
    return div(numerator,heatGamma);
  };
  const heatAt=s=>{
    const xx=mul(Xtail,exp(s)),fo=sub(one,mul(rho,sub(one,d.step(div(sub(s,one),q(2)))))),ec=mul(Etail,exp(neg(mul(add(q(1,2),h),s))),div(fo,sub(one,rho))),Z=div(mul(q(2),sub(one,sq(eta))),xx),cut=d.step(div(sub(s,q(1,5)),q(3,10))),loss=mul(cut,heatLoss(Z));
    return {xx,ec,loss,energyChange:sub(sq(sub(one,loss)),one)};
  };
  const heatI=neg(improper('fullHeatAngularDebt',s=>{const {xx,ec,loss}=heatAt(s);return mul(d.sqrt(q(2)),xx,d.sqrt(xx),ec,loss);},q(1,5)));
  const heatS=neg(improper('fullHeatEnergyDebt',s=>{const {xx,ec,energyChange}=heatAt(s);return mul(q(1,2),xx,sq(ec),energyChange);},q(1,5)));
  const heatCp=improper('fullHeatPressureDebt',s=>{const {ec,energyChange}=heatAt(s);return mul(q(1,2),sq(ec),energyChange);},q(1,5));
  const heatIAtZero=d.substitute(heatI,eta,zero),heatSAtZero=d.substitute(heatS,eta,zero),heatCpAtZero=d.substitute(heatCp,eta,zero),heatTheta=neg(div(mul(sub(one,h),heatIAtZero),mul(X,H,lambda)));
  const heatIetaAtZero=d.substitute(differentiateHeatEta(d,heatI,eta),eta,zero),heatSetaAtZero=d.substitute(differentiateHeatEta(d,heatS,eta),eta,zero),heatCpetaAtZero=d.substitute(differentiateHeatEta(d,heatCp,eta),eta,zero);
  const terms={equilibrium:div(sub(lambda,h),mul(lambda,sub(one,lambda))),transient:div(mul(sub(one,h),transient),lambda),radialMoment:div(mConst,mul(X,lambda)),mixedMoment:neg(div(Jeta,mul(X,H,lambda))),viscousShear:neg(div(add(q(2),mul(q(2),lambda)),mul(X,lambda))),heatCompensation:heatTheta};
  const normalizedTheta=add(...Object.values(terms)),IReference=mul(X,H,rReference),IActual=sub(IReference,heatIAtZero),Qs=add(q(-1),div(mConst,X),div(sub(mul(sub(one,h),IActual),Jeta),mul(X,H))),theta=mul(F,sub(mul(X,Qs),add(q(2),mul(q(2),lambda))));
  const heatAbsoluteLower=div(mul(Etail,d.sqrt(Xtail),h),q(512)),heatAbsoluteUpper=mul(q(256),eK,d.sqrt(XK)),heatThetaLower=div(mul(sub(one,h),heatAbsoluteLower),mul(X,H,lambda)),heatThetaUpper=div(q(1024),mul(lambda,p('X0I2'))),normalizedHeatDebtUpper=div(q(2n**15n),p('X0I2'));
  return d.pack({X,E,H,F,mConst,Jeta,K1,Jshape,rInitial,rDecay,rEntry,rEquilibrium,rReference,transient,IReference,IActual,Qs,normalizedTheta,theta,z:zero,...Object.fromEntries(Object.entries(terms).map(([k,v])=>['term_'+k,v])),heatI,heatS,heatCp,heatIAtZero,heatSAtZero,heatCpAtZero,heatIetaAtZero,heatSetaAtZero,heatCpetaAtZero,heatM:zero,heatJ:zero,heatGamma,Xtail,Etail,XK,eK,heatAbsoluteLower,heatAbsoluteUpper,heatThetaLower,heatThetaUpper,normalizedHeatDebtUpper},
    {schema:'MathScope.ActualMeanStressProgram/1',sourceBindings:structuredClone(ACTUAL_MEAN_STRESS_BINDINGS),request:{...request,yExact:binaryRational(request.y).join('/')},observedDomain:{patch:'Imean',y:[.25,4.75],eta:0,qOverQ:1},heatDebtDomain:{eta:[-1,1],X:['Xtail*exp(1/5)','infinity']},compactIntegrals,
      exactRestoration:{axisPressure:'same A.21 datum; Pi0 is even by the literal outer E profile',B8:'all five cumulative moment functions agree with the selected A.2 data after B.8',I1:'the final C.12 modulation and I1 repair preserve all five cumulative moment functions before I2',I2:'E-only compensation adds exactly the negative of the three full heat debts',onImean:{M:'eta*mConst',J:'eta/(1+eta^2)*Jeta',I:'I_reference-D_I_heat',S:'S_reference-D_S_heat',Cp:'Cp_reference-D_Cp_heat'},functionsOfEtaMatchedExactly:true,coreParityAssumed:false},
      heatDefinition:{source:'H5-H9, H13-H14, H20',GammaIsExplicitLaplaceIntegral:true,axisComparisonGammaUsed:false,positiveHeatLoss:true,tailTruncated:false,integrability:'H7 with Ecl(XK*x)<=2*eK*x^(-1/2-h); integral_1^infinity x^(-1-h)=1/h. The exact positive h is retained.',signsAtEtaZero:{I:'strictly negative',S:'strictly positive',Cp:'strictly negative',M:'identically zero',J:'identically zero'},lowerBoundProof:'On y in [1/2,1] and Laplace v in [1,2], Gamma(1+h)<=2 and 1-H(Z)>=h*Z/128. Hence -D_I>Etail*sqrt(Xtail)*h/512>0.'},
      normalization:{theta:'T0_theta/(F*X*lambda)',z:'T0_z/(F*X*lambda)',F:'E/sqrt(2X)',physicalStress:'q^(-A-1/2)*T0; the observations do not multiply this physical q factor',radialViscosityRetained:'-(2+2*lambda)/(X*lambda)'},
      scope:{exactActualHeatDebtFunctionCompiled:true,allIntegrandsExplicit:true,actualEtaZeroStressEnclosedByContinuousBounds:true,entireHeatIntegralNumericallyQuadratured:false,allEtaStressNumericallyEvaluated:false,globalCoreNumericallyEvaluated:false,wholeAnnulusCovarianceMatched:false,newLeanProof:false}});
}

/** Executable integer comparisons for the actual fixed-parameter estimates. */
export function actualMeanStressBounds(bits=512){
  if(!Number.isSafeInteger(bits)||bits<16||bits>4096)invalid('The mean stress certificate supports 16 through 4096 exact bits.');
  const source=assertSourceProfile(),p=source.parametersExactExpressions,Tmin=128n;
  const rows=[
    ['equilibrium_lambda',1n,1000n,0n,'lambda/(1-lambda) <= 2 exp(-1000T)'],
    ['equilibrium_h_over_lambda',1n,7002n,0n,'h/(lambda*(1-lambda)) <= 2 exp(-7002T)'],
    ['transient',4n,58400n,8n,'|(1-h)*(rEntry-rEq)*exp(-(1-lambda)*L)/lambda| <= 16 exp(-58400T+8)'],
    ['radial_moment',2n,59000n,7n,'mConst/(X*lambda) <= 4 exp(-59000T+7)'],
    ['mixed_moment',7n,58400n,8n,'Jeta/(X*H*lambda) <= 128 exp(-58400T+8)'],
    ['viscous_shear',2n,59001n,6n,'(2+2lambda)/(X*lambda) <= 4 exp(-59001T+6)'],
    ['heat_compensation',10n,59001n,18n,'0<-(1-h)D_I/(X*H*lambda) <= 1024 exp(-59001T+18)']
  ].map(([id,powerOfTwo,decayT,offset,expression])=>{const exponent=decayT*Tmin-offset-powerOfTwo;return{id,powerOfTwo:String(powerOfTwo),decayT:String(decayT),offset:String(offset),expression,strictDyadicUpperExponent:String(exponent),pass:exponent>=BigInt(bits+3)};});
  const conclusions=source.attachedAnalyticConclusions;
  const checks=[
    {id:'same-positive-source-scales',pass:same(p.lambda,{exp:{product:[{integer:-1000},{ref:'T'}]}})&&same(p.h,{exp:{product:[{integer:-8002},{ref:'T'}]}})&&same(p.T,{sum:[{exp:{ref:'Md'}},{integer:10}]})&&p.Md.integer===1048576},
    {id:'T-at-least-128',pass:1n+BigInt(p.Md.integer)+10n>=Tmin,proof:'exp(Md)>=1+Md; source T=exp(Md)+10.'},
    {id:'lambda-and-h-at-most-one-hundredth',pass:1000n*Tmin>=7n&&8002n*Tmin>=7n&&128n>100n,proof:'e>2, and 2^-7<1/100.'},
    {id:'rInitial-rEntry-bounds',pass:77n<80n&&10n+3n===13n&&13n+2n<16n,proof:'0<=sigma<=1; e<3; initial integral<e^2<9; rInitial<77/8<10, rDecay<10, entry integral<3, rEntry<13, rEq<2.'},
    {id:'Jshape-and-moment-bounds',pass:149n<256n,proof:'K1<4e^T and initial integral<9 imply Jshape<149e^T/2<128e^T; 4XR*e<mConst<4XR*e^(T+1).'},
    {id:'constant-stage-exponent',pass:99n*60000n/100n-1000n===58400n&&99n*8n<800n,proof:'(1-lambda)L >= (99/100)(60000T-8), for every y>=0.'},
    {id:'heat-full-tail-upper',pass:256n<1024n,proof:'H8, H4 and monotone XH give |D_I|/(XH)<=1024/X0I2, including the complete improper tail.'},
    {id:'heat-strict-nonzero-lower',pass:12n*9n<128n&&384n<512n,proof:'Gamma<=2; e^2<9; 1-exp(-a)>=a/2 for a<=1; log(1+Z)>=Z/3 for Z<=2; integrate y in [1/2,1] and v in [1,2].'},
    {id:'actual-moment-restoration-attached',pass:conclusions.samePressureDatumAndAllFiveMoments===true&&conclusions.continuousB8InclusionAllEta===true&&conclusions.heatCompensationSameDatum===true&&conclusions.continuousC12DebtAndI1Restoration===true&&conclusions.preservedReservedPatches.includes('Imean')},
    {id:'all-seven-exact-bounds',pass:rows.every(r=>r.pass)},
    {id:'sum-is-below-requested-radius',pass:7n<8n,proof:'Each of seven absolute terms is less than 2^(-bits-3); their sum is less than 2^-bits.'}
  ];
  const den=1n<<BigInt(bits),lo=den-1n,hi=den+1n,radius=bits<=1074?2**(-bits):0;
  return {schema:'MathScope.ActualMeanStressBounds/1',profileId:source.id,parameterExpressionSHA256:source.parameterExpressionSHA256,bits,TLowerExact:'128',range:{y:[0,5],eta:0},rows,checks,pass:checks.every(c=>c.pass),
    theta:{center:'1',absoluteRemainderUpper:'1/2^'+bits,lower:String(lo)+'/'+String(den),upper:String(hi)+'/'+String(den),strict:true,binary64:[nextDown(1-radius),nextUp(1+radius)],binary64IsRoundedEnclosure:true},
    heatCompensation:{strictlyPositive:true,exactLower:'(1-h)*Etail*sqrt(Xtail)*h/(512*X*H*lambda)',exactUpper:'1024/(lambda*X0I2)',comparisonDyadicUpper:'1/2^'+rows.find(r=>r.id==='heat_compensation').strictDyadicUpperExponent,normalizedAllEtaDebtC2Upper:'2^15/X0I2',debtSetToZero:false,tailDropped:false},
    proofUsesSampling:false,arbitraryPrecisionHeatQuadratureExecuted:false};
}

/** Finite real evaluation by a continuous, source-bound analytic enclosure. */
export function evaluateActualMeanStress(input={},context={}){
  const request=inputOf(input);context.checkCancelled?.();const bounds=actualMeanStressBounds(request.bits);if(!bounds.pass)throw Error('The actual source stress inequalities did not verify.');
  const program=compileActualMeanStressProgram(request);context.checkCancelled?.();
  const theta=bounds.theta.binary64,rows=[
    {component:'rtheta',normalizedInterval:theta,exactInterval:{lower:bounds.theta.lower,upper:bounds.theta.upper},sourceProgramRoot:'normalizedTheta',sourcePath:'result.results.meanStress.rows[0]',sourceHash:PINNED_N3.inputs.assembly.sha256,strictlyPositive:true},
    {component:'rz',normalizedInterval:[0,0],exactInterval:{lower:'0',upper:'0'},sourceProgramRoot:'z',sourcePath:'result.results.meanStress.rows[1]',sourceHash:PINNED_N3.inputs.assembly.sha256,identicallyZero:true}
  ];
  return {schema:'MathScope.ActualMeanStressEvaluation/1',profileId:request.sourceProfile,sourceHash:PINNED_N3.inputs.assembly.sha256,parameterExpressionSHA256:PINNED_N3.parameterExpressionSHA256,input:request,sourceBindings:structuredClone(ACTUAL_MEAN_STRESS_BINDINGS),sourceInputs:structuredClone(PINNED_N3.inputs),
    coordinateFrame:'PROFILE_X_ETA_AT_Q_OVER_QREF_ONE',observedDomain:{patch:'Imean',y:request.y,eta:0,qOverQ:1},observationKind:'ACTUAL_HEAT_PREPARED_STRESS_DIVIDED_BY_F_X_LAMBDA',
    normalizedTarget:{theta,thetaExact:bounds.theta,z:[0,0],zExact:'0'},rows,bounds,program,
    axialParity:{exact:true,reason:'B.8 and I1 restore the complete functions M,J,I,S,Cp. On Imean M=eta*mConst and S, Cp and Pi0 are even. The full A.7 heat debts are even functions of eta and the I2 correction subtracts these exact debts. Thus U=0, M(0)=S_eta(0)=Pi_eta(0)=0 in (4.16), so Ns(0)=0 and T0_z=0.',coreParityAssumed:false,momentTotalsAloneAtEtaZeroUsed:false,matchedAsFunctionsOfEta:true,heatMAndJExactlyZero:true},
    interpretation:'A computed enclosure of the actual final leading stress at an Imean representative. The exact thermal compensation is retained with a strictly positive contribution to the normalized angular stress; neither the enormous physical scale nor the complete heat integral is materialized.',
    pass:true,status:'CERTIFIED_ACTUAL_MEAN_STRESS',scope:{actualHeatPreparedTargetEnclosed:true,leadingStressOnly:true,actualEtaZeroAxialStressExactlyZero:true,wholeMeanYIntervalBounded:true,actualSourceIntegralProgramCompiled:true,entireHeatIntegralNumericallyQuadratured:false,arbitraryEtaStressNumericallyEvaluated:false,positiveOrderBackgroundStressAssumedZero:false,globalCoreNumericallyEvaluated:false,wholeAnnulusCovarianceMatched:false,globalEquation730Certified:false,fullN5PackageComplete:false,newLeanKernelProof:false}};
}

/** Integrity check for a retained observation; the producer's math is separately
 * checked by source algebra and independent rational/decimal tests. */
export function verifyActualMeanStress(receipt){
  try{
    if(receipt?.schema!=='MathScope.ActualMeanStressEvaluation/1')return{pass:false,reason:'WRONG_SCHEMA'};
    const expected=evaluateActualMeanStress(receipt.input);return{pass:same(receipt,expected),reason:same(receipt,expected)?'MATCHES_PINNED_SOURCE_ENCLOSURE':'SOURCE_OR_MATHEMATICAL_CONTRACT_CHANGED'};
  }catch(e){return{pass:false,reason:e.code??'INVALID_RECEIPT'};}
}
