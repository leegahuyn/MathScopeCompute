/** Exact degree accounting for the ORIGINAL four-operation correction cycle.
 *
 * This is an executed rational proof of the exponent implications in
 * Propositions 9.5/9.6 and the physical losses in Lemma 9.8.  The common
 * source domain is authenticated separately below.  It is NOT a substitute
 * for proving that a newly constructed current has the input class bounds.
 * In particular, unknown C_{j,m} and logarithmic powers are never set to 1
 * or 0; the finite dependency program records their actual missing producers.
 */
import {rational as Q,readRational as readQ,qadd,qsub,qmul,qdiv,qcompare,qtext} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {recordedSourceN7DomainExterior,sourceExteriorForceObservations} from './source-exterior-force-evidence.mjs';

const fail=(message,code='INVALID_ITERATION_PROOF')=>{throw Object.assign(new Error(message),{code});},
  copy=x=>structuredClone(x),seals=new WeakMap(),
  canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}',
  same=(a,b)=>canonical(a)===canonical(b),r=x=>readQ(x),zero=Q(0),one=Q(1),
  aff=(constant='0',slope='0')=>({constant:r(constant),slope:r(slope)}),
  plus=(...values)=>values.reduce((a,b)=>({constant:qadd(a.constant,b.constant),slope:qadd(a.slope,b.slope)}),aff()),
  times=(a,b)=>({constant:qmul(a.constant,r(b)),slope:qmul(a.slope,r(b))}),
  minus=(a,b)=>plus(a,times(b,'-1')),
  pack=a=>({constant:qtext(a.constant),slope:qtext(a.slope)}),
  evaluate=(a,j)=>qadd(a.constant,qmul(a.slope,Q(j))),
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be a finite nonnegative safe integer.','RESOURCE_LIMIT');return n;};

/** The numeric premises below are literal exponents from pp106--114.
 * Fields describing an operator are requirements, not caller authority.
 * The source consumer constructs this recipe internally without overrides.
 */
export function originalIterationDecayRecipe(){
  return {schema:'MathScope.N6.OriginalIterationDecayRecipe/1',
    kappa:'1/100000',sigma0:'1/5',gain:'1/10',oldPrimary:'1/2',oldWaveRemainder:'17/25',
    totalMean:'9/10',totalRadialMean:'19/10',retainedMeanGain:'17/100',
    operatorOrder:['forced-angular','signed-covariance','temporal-mean','five-current-moments'],
    forcedErrors:['linear','old-wave-cross','self-quadratic','total-mean-cross'],
    signedErrors:['linear','total-mean-cross','old-wave-cross','self-quadratic'],
    signedCovariance:['primary-transverse-leading','old-wave-minus-primary','full-curl-remainder','signed-self-quadratic'],
    temporalErrors:['slow-time','radial-flux','axial-flux','viscosity'],
    pressure:{afterEveryOperation:true,fullUpdatedFields:true,currentDefects:true,axialMomentIncludesCRhoP:true,
      increment:'T0(delta-gr-rho*delta-P)',fixedRho:true},
    flatRemainders:{base:'E_B retained',pulse:'retained outside supported next-pulse source',
      axialReconstruction:'F_ax retained with actual Delta-gamma',radialCutoff:'retained with actual reconstructed velocities',
      realization:'compare to one fixed finite residual; never sum E_j'},
    fixedDenominators:['original noncharacteristic normal','original primary H','original 2*sqrt(y_sigma)','original five-profile inverse'],
    harmonicRule:{quadratic:'all m+n',inverse:'preserves m',curl:'preserves m',conjugates:'both signs retained'},
    physical:{radialKappa:'1/100000',spatialH:'2',temporalH:'3/2',extraCurlDerivatives:1,
      velocityPrefactor:'A',pressurePrefactor:'2A',potentialPrefactor:'A-1/2',residualPrefactor:'2A+1/2'}};
}

function requireStructure(recipe){
  const original=originalIterationDecayRecipe();
  if(!recipe||recipe.schema!==original.schema)fail('The complete original correction recipe is required.');
  for(const key of ['operatorOrder','forcedErrors','signedErrors','signedCovariance','temporalErrors','pressure','flatRemainders','fixedDenominators','harmonicRule','physical'])
    if(!same(recipe[key],original[key]))fail('The original '+key+' is incomplete or changed.');
  // These source choices cannot be enlarged silently to make the proof pass.
  for(const key of ['kappa','sigma0','gain','oldPrimary','oldWaveRemainder','totalMean','totalRadialMean','retainedMeanGain'])
    if(qcompare(r(recipe[key]),r(original[key]))!==0)fail('The exact original exponent '+key+' changed.');
}

/** Prove every j>=0 inequality from its intercept and slope.  No finite
 * sample of correction stages is used as an induction argument.
 */
export function verifyOriginalIterationDecay(recipe){
  requireStructure(recipe);
  const k=aff(recipe.kappa),half=aff('1/2'),sigma=aff(recipe.sigma0,recipe.gain),B=plus(half,sigma),C=plus(aff('1'),sigma),
    gain=aff(recipe.gain),H=minus(C,times(k,'2')),oldRemainder=aff(recipe.oldWaveRemainder),checks=[];
  const prove=(id,left,right,{strict=false,role='CLASS_EXPONENT_IMPLICATION'}={})=>{
    const margin=minus(left,right),pass=qcompare(margin.slope,zero)>=0&&(strict?qcompare(margin.constant,zero)>0:qcompare(margin.constant,zero)>=0),
      row={id,role,left:pack(left),right:pack(right),margin:pack(margin),strict,domain:'every integer j>=0',
        exactDecision:'nonnegative slope and '+(strict?'positive':'nonnegative')+' intercept',pass};
    checks.push(row);if(!pass)fail('The all-stage exponent implication failed at '+id+'.');return row;
  };
  const initial={
    primary:half,fullCurlRemainder:minus(aff('1'),k),linear:minus(aff('1'),times(k,'3')),nonlinear:minus(aff('1'),k),
    primaryCovarianceRemainder:minus(aff('3/2'),times(k,'2')),axialAndPressure:minus(aff('2'),k),
    fullMean:minus(aff('1'),k),H0:minus(aff('1'),k),meanRemainder:minus(aff('2'),times(k,'3')),
    fiveNonlinearDefectConservativeLower:minus(aff('9/5'),k)};
  const initialChecks=[
    ['initial-linear-at-least-B0',initial.linear,aff('7/10')],
    ['initial-nonlinear-at-least-B0',initial.nonlinear,aff('7/10')],
    ['initial-covariance-after-radial-loss-at-least-1.49',initial.primaryCovarianceRemainder,aff('149/100')],
    ['initial-axial-pressure-at-least-1.49',initial.axialAndPressure,aff('149/100')],
    ['initial-temporal-remainder-at-least-1.49',initial.meanRemainder,aff('149/100')],
    ['initial-retained-averaged-mean-at-least-C0',aff('149/100'),aff('6/5')],
    ['initial-five-nonlinear-defect-at-least-C0',initial.fiveNonlinearDefectConservativeLower,aff('6/5')],
    ['initial-wave-mean-interaction-at-least-B0',initial.H0,aff('7/10')],
    ['initial-curl-above-cumulative-remainder',initial.fullCurlRemainder,oldRemainder],
    ['initial-mean-above-cumulative-mean',initial.H0,aff(recipe.totalMean)],
    ['initial-radial-mean-above-cumulative-radial',plus(initial.H0,aff('1')),aff(recipe.totalRadialMean)]
  ];
  initialChecks.forEach(([id,left,right])=>prove(id,left,right));

  const forced=[
    {id:'linear',value:minus(plus(B,half),times(k,'3'))},
    {id:'old-wave-cross',value:minus(plus(B,half),k)},
    {id:'self-quadratic',value:minus(times(B,'2'),k)},
    {id:'total-mean-cross',value:plus(B,aff('2/5'))}
  ],signed=[
    {id:'linear',value:minus(plus(B,half),times(k,'4'))},
    {id:'total-mean-cross',value:minus(plus(B,aff('2/5')),k)},
    {id:'old-wave-cross',value:minus(plus(B,half),times(k,'2'))},
    {id:'self-quadratic',value:minus(times(B,'2'),times(k,'3'))}
  ],covariance=[
    {id:'old-wave-minus-primary',before:minus(plus(B,oldRemainder),k)},
    {id:'full-curl-remainder',before:minus(plus(C,half),times(k,'2'))},
    {id:'signed-self-quadratic',before:minus(times(B,'2'),times(k,'2'))}
  ].map(row=>({...row,afterRadialDivergence:minus(row.before,k)})),temporal=[
    {id:'slow-time',value:plus(H,aff('1'))},
    {id:'radial-flux',value:minus(plus(H,aff('1')),k)},
    {id:'axial-flux',value:plus(H,aff('1'))},
    {id:'viscosity',value:minus(plus(H,aff('1')),times(k,'2'))}
  ];
  forced.forEach(row=>prove('forced-'+row.id,row.value,plus(B,aff('2/5'))));
  signed.forEach(row=>prove('signed-'+row.id,row.value,minus(plus(B,aff('2/5')),k)));
  covariance.forEach(row=>prove('signed-mean-'+row.id,row.afterRadialDivergence,plus(C,aff(recipe.retainedMeanGain)),{strict:true}));
  prove('signed-retained-weighted-moment',minus(plus(C,aff('1')),k),plus(C,aff(recipe.retainedMeanGain)),{strict:true});
  prove('signed-axial-and-pressure-changes',minus(plus(C,aff('1')),times(k,'2')),plus(C,aff(recipe.retainedMeanGain)),{strict:true});
  temporal.forEach(row=>prove('temporal-'+row.id,row.value,minus(plus(H,aff('1')),times(k,'2'))));
  prove('retained-mean-gain-closes-cycle',plus(C,aff(recipe.retainedMeanGain)),plus(C,gain),{strict:true});
  prove('new-temporal-mean-gain-closes-cycle',minus(plus(H,aff('1')),times(k,'2')),plus(C,gain),{strict:true});
  prove('five-new-defects-close-cycle',minus(plus(H,aff('9/10')),times(k,'2')),plus(C,gain),{strict:true});
  prove('mean-interaction-closes-wave-cycle',H,plus(B,gain),{strict:true});
  prove('forced-errors-close-wave-cycle',plus(B,aff('2/5')),plus(B,gain),{strict:true});
  prove('signed-errors-close-wave-cycle',minus(plus(B,aff('2/5')),k),plus(B,gain),{strict:true});
  prove('all-signed-increments-preserve-old-remainder',minus(B,k),oldRemainder,{strict:true});
  prove('all-forced-increments-preserve-old-remainder',B,oldRemainder,{strict:true});
  prove('all-new-mean-and-pressure-increments-preserve-cumulative-class',H,aff(recipe.totalMean),{strict:true});
  prove('all-new-radial-increments-preserve-cumulative-class',plus(H,aff('1')),aff(recipe.totalRadialMean),{strict:true});
  // Cycle j-1 -> j, j>=1: subtract the j/10 required by (9.17).
  const jNormalized=aff('0',recipe.gain),previousB=minus(B,gain),previousH=minus(H,gain);
  prove('physical-cycle-j-forced-minimum',previousB,jNormalized);
  prove('physical-cycle-j-signed-minimum',minus(previousB,k),jNormalized);
  prove('physical-cycle-j-mean-and-pressure-minimum',previousH,jNormalized);
  prove('physical-cycle-j-radial-minimum',plus(previousH,aff('1')),jNormalized);
  const packRows=rows=>rows.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,value&&typeof value==='object'&&'constant'in value?pack(value):value])));
  return {schema:'MathScope.N6.ExactAllFiniteIterationDecay/1',sourceAuthenticated:false,
    recipe:copy(recipe),inductionVariable:'j>=0',sigma:pack(sigma),wave:pack(B),meanAndDefect:pack(C),H:pack(H),
    initial:Object.fromEntries(Object.entries(initial).map(([key,value])=>[key,pack(value)])),
    originalInitialOrders:{B0:'7/10',C0Star:'6/5'},forced:packRows(forced),signed:packRows(signed),signedCovariance:packRows(covariance),
    signedLeadingCovarianceCanceledOnlyByActualIdentity:true,temporal:packRows(temporal),
    checks,pass:true,allNonnegativeStagesByAffineInduction:true,sourceClassPremisesDischarged:false,
    conclusion:'If the original initial state and the four original updated-current maps satisfy their stated class hypotheses, every complete cycle improves wave, full tangential mean and current defect orders by exactly 1/10 on the same domain.',
    noSampleResidualMonotonicityClaim:true,noBackgroundFlatResidualDropped:true,noCurrentCovarianceSquareRoot:true,
    noActualFiniteStageFieldConstructed:true,allOrderNumericGraphsExecuted:false};
}

/** Fixed physical losses, as affine functions of the exact positive h.
 * K_m below is an explicitly conservative sufficient choice; the paper
 * specifies the stage independence of K_m, not this particular formula.
 */
export function originalPhysicalIterationLosses({order=0}={}){
  natural(order,'Derivative order');if(order>1000000)fail('Derivative-loss output exceeded its finite work budget.','RESOURCE_LIMIT');
  const h=aff('0','1'),A=plus(aff('1/2'),h),D=minus(aff('1/2'),h),sx=plus(aff('1/2'),times(h,'2')),
    st=plus(aff('1'),times(h,'3/2')),radial=plus(aff('1/2'),times(h,'1/100000')),
    ell=m=>plus(times(A,'2'),times(st,String(m+1))),
    K=m=>plus(times(A,'2'),aff('1/2'),times(st,String(m+2))),
    ellPrime=m=>plus(ell(m+1),aff(String(m+1))),checks=[];
  const check=(id,left,right)=>{
    const delta=minus(left,right),at0=delta.constant;
    // The comparison variable is h, not the integer j used by the other
    // kernel. A linear function is nonnegative on [0,1/16] iff both endpoints are.
    const endpoint=qadd(delta.constant,qmul(delta.slope,Q(1,16))),pass=qcompare(at0,zero)>=0&&qcompare(endpoint,zero)>=0;
    checks.push({id,left:pack(left),right:pack(right),difference:pack(delta),hInterval:['0','1/16'],
      endpointMargins:[qtext(at0),qtext(endpoint)],pass});if(!pass)fail('A physical derivative loss does not dominate '+id+'.');
  };
  check('spatial-loss-dominates-radial-amplitude',sx,radial);
  check('spatial-loss-dominates-axial-amplitude',sx,D);
  check('spatial-loss-dominates-frame',sx,aff('1/2'));
  check('spatial-loss-dominates-phase-carrier',sx,plus(aff('1/2'),times(h,'1/2')));
  check('time-loss-dominates-amplitude',st,plus(aff('1'),h));
  check('time-loss-dominates-phase-carrier',st,plus(aff('1'),times(h,'3/2')));
  check('time-loss-dominates-space-loss',st,sx);
  check('twice-A-dominates-velocity-prefactor',times(A,'2'),A);
  check('twice-A-dominates-potential-prefactor',times(A,'2'),minus(A,aff('1/2')));
  check('K-dominates-increment-and-finite-field-loss',K(order),ell(order));
  check('K-dominates-physical-residual-conversion',K(order),plus(times(A,'2'),aff('1/2'),times(st,String(order))));
  check('cutoff-loss-dominates-potential-product-and-curl',ellPrime(order),plus(ell(order+1),aff(String(order+1))));
  return {schema:'MathScope.N6.ExactPhysicalIterationLosses/1',variable:'h',sourceAuthenticated:false,order,
    A:pack(A),D:pack(D),sX:pack(sx),sT:pack(st),radial:pack(radial),ell:pack(ell(order)),K:pack(K(order)),ellPrime:pack(ellPrime(order)),
    formulas:{ell:'2A+(m+1)*(1+3h/2)',K:'2A+1/2+(m+2)*(1+3h/2)',ellPrime:'ell_(m+1)+(m+1)',
      increment:'C_(j,m)*q^(h*j/10-ell_m)*(1+abs(log(q)))^P_(j,m)',
      finiteState:'C_(j,m)*q^(-K_m)*(1+abs(log(q)))^P_(j,m)',
      residual:'C_(j,m)*q^(h*(1/5+j/10)-K_m)*(1+abs(log(q)))^P_(j,m)+E_(j,m)'},
    paperExplicitEll:true,KIsConservativeDerivedChoice:true,KRequiredPremise:'The original normalized background and complete current have the all-fixed-order polynomial-S amplitude bounds used in Lemma9.8.',
    cutoffProof:'Every derivative of chi(a*q) is bounded by C*q^(-m), independent of a, because a*q is bounded on its derivative support and 0<D<1. The full curl needs one more potential derivative; ell_(m+1)+(m+1) is sufficient.',
    commonQPowerLossIndependentOfStage:true,constantsAndLogPowersMayDependOnStage:true,logPowersSetToZero:false,
    checks,pass:true};
}

/** A finite operation DAG computes exactly the source derivative requests
 * of Lemma9.7. Its norm leaves are intentionally unexpanded. No unexecuted
 * operator-specific C-infinity majorant is turned into a numeric bound.
 */
export function originalIterationDependencyProgram({stageCount=2,order=2,maxWork=100000}={}){
  natural(stageCount,'Stage count');natural(order,'Derivative order');natural(maxWork,'Work budget');
  if(maxWork<1||stageCount>100000||order>100000||stageCount*100+order+100>maxWork)fail('The finite iteration dependency graph exceeded its explicit work budget.','RESOURCE_LIMIT');
  const nodes=[],byId=new Map(),source=(id,producer)=>{const node={id,operation:'source',producer,inputs:[]};nodes.push(node);byId.set(id,node);return id;},
    operation=(id,kind,inputs,additional=0,detail='')=>{
      if(byId.has(id)||inputs.some(x=>!byId.has(x)))fail('An iteration dependency is duplicated or not earlier in the acyclic graph.');
      const node={id,operation:kind,inputs:inputs.map(input=>({input,additionalDerivatives:additional})),detail};nodes.push(node);byId.set(id,node);return id;
    };
  const base=source('original-background','actual-common-admissible-family.mjs: prepareActualCommonAdmissibleFamily; source-global-class.mjs: prepareGlobalClassNormExpansion source request'),
    primary=source('original-primary-full-curl','actual-global-wave-bound-kernel.mjs: originalWeightedCovarianceJetPowers with authenticated target norms'),
    stress=source('original-stress','actual-common-target-weighted-norms.mjs: original weighted stress and all-order positive remainder'),
    pulse=source('fixed-original-pulse','actual-pulse-gaussian-power-kernel.mjs: allOrderMixedGaussianJetPowerAudit and common forward propagator'),
    signedMap=source('fixed-original-signed-inverse','source-global-class.mjs: prepareGlobalClassNormExpansion (composed norm request remains separate)'),
    meanMap=source('fixed-original-five-profiles','source-mean-map.mjs: original fixed profile and positive inverse'),
    radial=source('fixed-original-radial-pressure-map','source-global-class.mjs: original Gaussian radial primitive and fixed mean patch'),
    torus=source('fixed-original-temporal-map','source-global-temporal.mjs: complete indexed inverse and source-bound coefficient tails');
  const mean=(prefix,current)=>{
    const gr=operation(prefix+'-gr','full-quadratic-mean-and-two-derivatives',[current,base,stress],2,'Every old, cross and new quadratic term of (8.3).'),
      P=operation(prefix+'-P','haar-and-full-radial-integral',[gr]),
      pm=operation(prefix+'-pm','fixed-supported-radial-inverse',[gr,P,radial],0,'T0(gr-rho*P), retaining both terms and the fixed source rho.'),
      state=operation(prefix+'-pressure-state','sum',[current,pm]),
      E=operation(prefix+'-E','full-mean-residual',[state,base,stress],2,'Actual Etheta/Ez after this pressure reconstruction.'),
      J=operation(prefix+'-new-defects','whole-current-flux-integrals',[state,gr,P],0,'New P/Jtheta/Jz, including the entire c_rho*P axial product.');
    return {state,E,J};
  };
  const temporal=(prefix,current)=>{
    const before=mean(prefix+'-before',current),zeroMean=operation(prefix+'-zero-mean','subtract-haar',[before.E]),
      inverse=operation(prefix+'-inverse','fixed-zero-mean-torus-inverse',[zeroMean,torus],4,'Four extra torus derivatives are a conservative C0/C1-tail input request; fixed slow derivatives are retained.'),
      potential=operation(prefix+'-potential','fixed-supported-radial-inverse',[inverse,radial]),
      full=operation(prefix+'-full-velocity','full-potential-curl',[potential,inverse],1,'Actual axial reconstruction is used; F_ax is separate.'),
      next=operation(prefix+'-updated','sum',[current,full]);return mean(prefix+'-after',next);
  };
  const moments=(prefix,current)=>{
    const before=mean(prefix+'-before',current),coefficients=operation(prefix+'-coefficients','fixed-five-current-moment-map',[before.J,meanMap]),
      potentials=operation(prefix+'-potentials','fixed-supported-radial-inverse',[coefficients,radial]),
      delta=operation(prefix+'-full-velocity','full-potential-curl',[potentials,coefficients],1),
      next=operation(prefix+'-updated','sum',[current,delta]);return mean(prefix+'-after',next);
  };
  const start=operation('initial-primary-current','sum',[base,primary]),t0=temporal('initial-temporal',start),
    m0=moments('initial-moments',t0.state),stages=[{stage:0,current:m0.state,residual:m0.E,defects:m0.J}];let current=m0.state;
  for(let j=0;j<stageCount;j++){
    const id='cycle-'+j,sourceHarmonics=operation(id+'-harmonic-source','complete-supported-harmonic-residual',[current,base,stress],2,'All nonzero m+n retained; old flat residual stays outside the supported source.'),
      forced=operation(id+'-forced','exact-zero-data-forced-pulse',[sourceHarmonics,pulse],0,'Original (7.13), every mixed variational source, pressure and full conjugate pairs.'),
      forcedPotential=operation(id+'-forced-potential','original-cutoff-and-inverse-normal-cross-product',[forced,pulse]),
      forcedVelocity=operation(id+'-forced-full-curl','full-potential-curl',[forcedPotential],1),
      afterForced=mean(id+'-after-forced',operation(id+'-forced-updated','sum',[current,forcedVelocity,forced])),
      average=operation(id+'-average','haar',[afterForced.E]),weighted=operation(id+'-weighted-moments','whole-radial-integral',[average]),
      zeroMoment=operation(id+'-zero-weighted-moment','subtract-fixed-profile-times-moment',[average,weighted,meanMap]),
      sigma=operation(id+'-Sigma','fixed-supported-radial-inverse',[zeroMoment,radial]),
      signed=operation(id+'-signed','fixed-primary-signed-division',[sigma,signedMap,primary],0,'Original fixed H and 2*sqrt(y_sigma); no square root of the new covariance.'),
      signedCurl=operation(id+'-signed-full-curl','full-potential-curl',[signed],1),
      afterSigned=mean(id+'-after-signed',operation(id+'-signed-updated','sum',[afterForced.state,signed,signedCurl])),
      afterTemporal=temporal(id+'-temporal',afterSigned.state),afterMoments=moments(id+'-moments',afterTemporal.state);
    current=afterMoments.state;stages.push({stage:j+1,current,residual:afterMoments.E,defects:afterMoments.J});
  }
  if(nodes.length*(order+1)>maxWork)fail('The derivative-request closure exceeds this finite work budget.','RESOURCE_LIMIT');
  const inputSources=nodes.filter(n=>n.operation==='source'),memo=new Map();let work=0;
  const request=(id,m,sourceId)=>{
    const key=id+'|'+m+'|'+sourceId;if(memo.has(key))return memo.get(key);
    if(++work>maxWork)fail('The derivative-demand dynamic program exhausted its exact budget.','RESOURCE_LIMIT');
    const n=byId.get(id),value=n.operation==='source'?(n.id===sourceId?m:null):n.inputs.map(e=>request(e.input,m+e.additionalDerivatives,sourceId)).reduce((a,b)=>a===null?b:b===null?a:Math.max(a,b),null);
    if(value!==null&&!Number.isSafeInteger(value))fail('A source derivative count exceeded the exact integer range.','RESOURCE_LIMIT');memo.set(key,value);return value;
  };
  const rows=stages.map(stage=>({stage:stage.stage,outputs:{current:stage.current,residual:stage.residual,defects:stage.defects},
    sourceRequests:inputSources.map(s=>({source:s.id,producer:s.producer,current:request(stage.current,order,s.id),residual:request(stage.residual,order,s.id),defects:request(stage.defects,order,s.id)}))}));
  // Each degree leaf is the actual producer's (constant,S-power,pole)
  // request at the computed source order. Its value is not manufactured.
  const requestedNorms=rows.flatMap(row=>row.sourceRequests.filter(s=>[s.current,s.residual,s.defects].some(n=>n!==null)).map(s=>({
    stage:row.stage,source:s.source,derivativeOrder:Math.max(...[s.current,s.residual,s.defects].filter(n=>n!==null)),producer:s.producer,
    constant:{status:'SOURCE_BODY_MAJORANT_NOT_EXPANDED'},sPower:{status:'SOURCE_OPERATION_DEGREE_NOT_INSTANTIATED'},
    boundaryPole:{status:'SOURCE_WEIGHTED_CLASS_NOT_INSTANTIATED'}})));
  return {schema:'MathScope.N6.FiniteOriginalIterationDependencyProgram/1',sourceAuthenticated:false,stageCount,order,nodes,rows,requestedNorms,
    recurrence:'D_(v,a)(m)=max_(w->v) D_(w,a)(m+d_(v,w)); source a needs m; an absent source contributes no request.',
    derivativeDemandSeparateFromExplicitEpsilonLoss:true,extraInputDerivativesMultipliedIntoQPower:false,
    logarithmicConversion:{identity:'S=ell^2',comparison:'ell<=C*(1+abs(log(q))) on every admitted fixed-neighbor dyadic chart',
      forFiniteIntegerSPower:'S^p <= C^(2p)*(1+abs(log(q)))^(2p)',logPower:'2*p',logPowerSetToZero:false,
      operatorProducts:'multiply constants and add S powers; Leibniz sums take maxima of all mixed derivative powers and retain their binomial counts in the constant',
      valueComputed:false,missing:'Actual source-specific majorant and S-degree leaves for the full updated-current sequence.'},
    finiteHarmonicRange:{initialMaximum:2,stageBound:'2^(j+1)',allSumsRetained:true,
      meaning:'The wave field starts at |m|<=1 and its residual at |m|<=2. Each complete cycle adds only existing residual modes; its new quadratic residual at most doubles the range.',
      rangeChangesConstantsOnly:true},
    flatSourceOrderRequest:{targetNDependent:true,actualIBPCountNotInvented:true,expanded:false,
      meaning:'A separate fixed-stage original integration-by-parts majorant must request every source derivative needed for the selected q^N flat bound.'},
    operationDAGIsExplicit:true,actualStageBodyDAGBound:false,allOrderClassConstantsInstantiated:false,workUsed:work,maxWork,
    noStageOrDerivativeDependentQDomain:true};
}

export function originalIterationDecayProgram(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['stageCount','order','maxWork'].includes(k)))fail('Choose a finite stage count, derivative order and work budget only.','INVALID_INPUT');
  const stageCount=input.stageCount??2,order=input.order??2,algebra=verifyOriginalIterationDecay(originalIterationDecayRecipe()),
    physical=originalPhysicalIterationLosses({order}),dependencies=originalIterationDependencyProgram({...input,stageCount,order}),
    a=x=>({constant:r(x.constant),slope:r(x.slope)}),stages=Array.from({length:stageCount+1},(_,j)=>({stage:j,
      sigma:qtext(evaluate(a(algebra.sigma),j)),B:qtext(evaluate(a(algebra.wave),j)),CStar:qtext(evaluate(a(algebra.meanAndDefect),j)),
      gOverH:qtext(Q(j,10)),residualDecayOverH:qtext(qadd(Q(1,5),Q(j,10))),
      coefficientsComputed:false,actualFullResidualSample:null,sampleMonotonicityNotAssumed:true,
      sourceClassConstants:'UNINSTANTIATED_SOURCE_NORM_REQUESTS',logPowers:'UNINSTANTIATED_SOURCE_DEGREE_REQUESTS'}));
  return {schema:'MathScope.N6.OriginalIterationDecayProgram/1',algebra,physical,dependencies,stages,
    sourceAuthenticated:false,allFiniteExponentInductionVerified:true,allFiniteClassMembershipProved:false,
    actualSourceCutoffScheduleConstructed:false,actualFinalFieldConstructed:false,
    residualSamplePolicy:'If one sampled residual grows, inspect interval precision, covered domain, complete terms and constants. An asymptotic exponent inequality does not assert monotone finite-sample residual norms.'};
}

/** Authenticate the SAME executed qBig and positive original h.  This
 * grants domain/source-parameter authority only, not missing field classes.
 */
export async function recordedSourceIterationDecay(input={}){
  const program=originalIterationDecayProgram(input),archive=await recordedSourceN7DomainExterior();sourceExteriorForceObservations(archive);
  const d=archive.domain,p=d.fixedMeanMap.originalPowerLaw??d.initialPrerequisites.find(row=>row.id==='fixed-original-supported-mean-inverse')?.originalPowerLaw,
    hExpected={exp:{product:[{integer:-8002},{ref:'T'}]}},tExpected={sum:[{exp:{ref:'Md'}},{integer:10}]},
    checks=[
      {id:'private-authenticated-original-common-domain',pass:archive.archiveVerification.pass&&d.checks.every(row=>row.pass)&&d.constants.domainRatio==='1/64'},
      {id:'same-source-tiny-positive-h-definition',pass:same(p?.h,hExpected)&&same(p?.T,tExpected)&&d.sourceBinding.profileId==='same-profile-2026-10-10.3'&&
        d.sourceBinding.parameterExpressionSHA256==='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'},
      {id:'source-h-strictly-between-zero-and-one-sixteenth',pass:8002*10>4,
        argument:'T=exp(Md)+10>10, hence 0<h=exp(-8002T)<exp(-4)<1/16, using e>2. No binary floating-point value is assigned to h.'},
      {id:'all-four-fixed-original-inverse-prerequisites',pass:d.initialPrerequisites.length===5&&d.initialPrerequisites.every(row=>row.id)&&
        d.domainProof.sourceTheoremAppliedToExecutedInitialPremises&&d.domainProof.unknownHistoricalGammaValueUsed===false},
      {id:'same-qBig-at-every-stage-and-output-derivative-order',pass:program.dependencies.noStageOrDerivativeDependentQDomain&&
        d.domainProof.references.includes('Lemma9.7')&&d.domainProof.finalFieldExistenceUsedToInventAThreshold===false},
      {id:'all-finite-rational-exponent-and-physical-loss-checks',pass:program.algebra.checks.every(row=>row.pass)&&program.physical.checks.every(row=>row.pass)},
      {id:'missing-current-class-constants-kept-explicit',pass:!program.allFiniteClassMembershipProved&&!program.dependencies.allOrderClassConstantsInstantiated&&
        !program.actualSourceCutoffScheduleConstructed&&!program.actualFinalFieldConstructed}
    ];
  if(checks.some(row=>!row.pass))fail('The source-bound iteration proof failed: '+checks.filter(row=>!row.pass).map(row=>row.id).join(', '));
  const result={schema:'MathScope.N6.RecordedSourceIterationDecay/1',status:'SOURCE_DOMAIN_AND_ALL_FINITE_DECAY_ALGEBRA_VERIFIED_CLASS_ATTACHMENT_PENDING',
    recordedOnly:true,newDecayProofExecuted:true,freshSourceConstructorExecuted:false,newLeanExecuted:false,
    sourceBinding:copy(d.sourceBinding),sourceArtifacts:{domain:copy(archive.domainArtifact),domainReceipt:copy(archive.receipt),fullScalarProgram:copy(archive.fullScalarProgram)},
    sourceDomain:{qBigSourceRoot:d.constants.qBig,commonQStarSourceRoot:d.constants.commonQStar,domainRatio:'1/64',qStarEqualsQBig:true,
      everyFiniteStageUsesSameDomain:true,everyDerivativeOrderUsesSameDomain:true,sourceDomainChoiceJustified:true},
    sourceParameter:{h:copy(p.h),T:copy(p.T),positive:true,upper:'1/16',hNumericallyRounded:false},program,checks,
    sourceReferences:[{pages:[106,107],references:['Proposition9.5'],role:'Actual initial pressure/temporal/five-moment class hypotheses'},
      {pages:[108,109,110,111],references:['Proposition9.6','(9.11)--(9.14)'],role:'All four ordered updates, full covariance and residual exponent inequalities'},
      {pages:[111,112,113,114],references:['Lemmas9.7/9.8','(9.15)--(9.19)'],role:'One domain, finite derivative requests, phase and physical losses'},
      {pages:[57,58,59,114,115],references:['Lemma5.4','Proposition9.9','(9.20)/(9.21)'],role:'Actual source majorants needed before a final cutoff/tail schedule can be instantiated'}],
    remainingObligations:[
      {id:'actual-initial-class-state',required:'Bind Prop9.5 class estimates to the authenticated initial temporal -> new pressure/current moments -> five-map -> final pressure sequence.',missingValue:'Original input-current weighted seminorms and corresponding all-order S powers.'},
      {id:'actual-every-stage-forced-harmonic-source',required:'Bind the exact forced inverse to every actual residual coefficient and full pressure/conjugate/curl/current update.',missingValue:'Complete same-source cycle body and joint derivative/closure dispatcher.'},
      {id:'actual-composed-class-norms',required:'Instantiate all finite derivative requests in this operation DAG with source-only norm generators and exact Gaussian/reciprocal/polynomial-S bounds.',missingValue:'C_(j,m), P_(j,m), cutoff C-hat_(j,m)/P-hat_(j,m) and every fixed-stage flat C_(j,m,N).'},
      {id:'actual-original-shrinking-cutoff-and-tail',required:'Use those authenticated majorants to choose the common a_j and certify active indices and omitted tail on the selected evaluation window.',missingValue:'An original final-field schedule and its source-bound field/potential evaluator.'}
    ],
    scope:{sourceDomainAuthenticated:true,originalExponentInductionExecuted:true,physicalStageIndependentLossesExecuted:true,
      finiteDerivativeDemandDAGExecuted:true,fullCurrentClassAttachment:false,allOrderClassConstantsInstantiated:false,
      finalSourceSummationInstantiated:false,allSpaceFinalFieldConstructed:false,wholeN6Complete:false,wholeM3Complete:false,criterionAssessmentEdited:false}};
  const encoded=canonical(result),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(encoded));
  result.proofSHA256=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');seals.set(result,canonical(result));return result;
}

export function assertRecordedSourceIterationDecay(result){
  if(!seals.has(result)||seals.get(result)!==canonical(result))fail('Use the unchanged internally authenticated iteration-domain/decay proof.');return true;
}

export function sourceIterationDecayObservations(result){
  assertRecordedSourceIterationDecay(result);return {kind:'SOURCE_COMMON_DOMAIN_AND_ITERATION_DECAY',proofSHA256:result.proofSHA256,
    sourceArtifacts:copy(result.sourceArtifacts),domain:copy(result.sourceDomain),stages:copy(result.program.stages),
    physicalLosses:copy(result.program.physical),exponentChecks:copy(result.program.algebra.checks),
    sourceNormRequests:copy(result.program.dependencies.requestedNorms),remainingObligations:copy(result.remainingObligations),
    samples:[],curves:[],recordedOnly:true,newDecayProofExecuted:true,allSpaceFinalFieldConstructed:false,wholeN6Complete:false};
}
