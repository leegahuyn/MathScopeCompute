/** Fixed original common-torus inverse constants for the class induction.
 *
 * These are complete all-frequency bounds for the actual directions v_t
 * and v_r. They do not turn an arbitrary source function into M_alpha.
 * The actual input seminorms and weighted radial zero moment remain
 * explicit inputs of the source class composition.
 */
import {ActualConvergentExpressions} from '../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {exactAuxiliaryPi,exactAuxiliaryDivisor} from './source-auxiliary-fourier.mjs';
import {recordedGlobalTemporalInverse,globalTemporalInverseObservations} from './source-global-temporal-evidence.mjs';
import {recordedSourceN7DomainExterior,sourceExteriorForceObservations} from './source-exterior-force-evidence.mjs';
import {assertGlobalTemporalInverse} from './source-global-temporal.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),attachments=new WeakMap(),copy=x=>structuredClone(x),
  fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be a finite nonnegative integer.','RESOURCE_LIMIT');return n;};

const data=p=>({schema:p.schema,request:p.request,source:p.source,operators:p.operators,rows:p.rows,
  palette:p.palette,diophantine:p.diophantine,roots:p.roots,checks:p.checks,scope:p.scope});

/** Exact coefficients for the two ORIGINAL quadratic directions. This
 * finite algebra helper accepts no replacement direction. The all-mode
 * conclusion below uses the displayed integer-norm/descent argument,
 * independently of how many individual frequencies are requested here.
 */
export function exactOriginalClassDivisor(G,{mode,direction='temporal'}={}){
  if(!['temporal','radial'].includes(direction)||!Array.isArray(mode)||mode.length!==2)
    fail('Use one of the two original directions and exactly two integer frequencies.','INVALID_INPUT');
  const k=mode.map(value=>{
    if(!['number','string','bigint'].includes(typeof value)||typeof value==='number'&&!Number.isSafeInteger(value)||
      !/^-?(?:0|[1-9]\d*)$/.test(String(value)))fail('Frequency components must be exact canonical integers.','INVALID_INPUT');
    const n=BigInt(value);if((n<0n?-n:n).toString(2).length>4096)fail('The integer frequency exceeds its explicit representation budget.','RESOURCE_LIMIT');return n;
  }),[k0,k1]=k,abs=n=>n<0n?-n:n,n=abs(k0)>abs(k1)?abs(k0):abs(k1);
  if(n===0n)fail('The whole zero mode is retained separately, never divided.','ZERO_MODE_NOT_INVERTIBLE');
  const u=direction==='temporal'?k1-k0:k0+k1,v=direction==='temporal'?k0:-k1,norm=u*u-2n*v*v;
  if(norm===0n)fail('The nonzero original integer frequency cannot have zero quadratic norm.','ZERO_MODE_NOT_INVERTIBLE');
  const sqrtTwo=G.sqrt(G.q(2)),value=G.add(G.q(u),G.mul(G.q(v),sqrtTwo)),
    conjugate=G.sub(G.q(u),G.mul(G.q(v),sqrtTwo)),reciprocal=G.div(conjugate,G.q(norm)),
    inverseAbsUpper=G.mul(G.add(G.q(2),sqrtTwo),G.q(n));
  return {mode:k.map(String),direction,quadratic:{u:String(u),v:String(v),integerNorm:String(norm)},
    maxFrequency:String(n),sqrtTwo,value,conjugate,reciprocal,inverseAbsUpper,
    checks:{nonzeroIntegerNorm:norm!==0n,integerNormAbsAtLeastOne:abs(norm)>=1n,
      linearIntegerFirstBound:abs(u)<=2n*n,linearIntegerSecondBound:abs(v)<=n,
      exactOriginalPositiveSquareRoot:G.nodes[sqrtTwo].op==='sqrt_positive'&&G.nodes[sqrtTwo].args[0]===G.q(2)},
    sourceAuthenticated:false,zeroModeInverted:false,binary64UsedForDivisorDecision:false};
}

/** All fixed mixed source derivatives commute with these fixed torus
 * multipliers. The norm uses the maximum of all total derivatives through
 * the indicated order, so no factorial/binomial count is suppressed.
 */
export function originalFourierClassDerivativeDemand({outputOrder=0,inversePower=1}={}){
  natural(outputOrder,'Output derivative order');natural(inversePower,'Inverse power');
  if(inversePower<1||!Number.isSafeInteger(outputOrder+2*inversePower+3))
    fail('Use a positive exact inverse power within the finite derivative representation budget.','RESOURCE_LIMIT');
  return {outputOrder,inversePower,torusSourceOrder:outputOrder+inversePower+3,
    radialIBPSourceOrder:outputOrder+2*inversePower+3,radialIBPExtraRadialOrder:inversePower,
    everyOutputMixedDerivative:true,
    exactPowerCancellation:{coefficientDecay:outputOrder+inversePower+3,
      divisorLoss:inversePower,outputDerivatives:outputOrder,netModePower:-3,shellPower:1,netShellPower:-2},
    derivativeRule:'D_RZT^alpha D_y^beta L^(-p)f=L^(-p)D_RZT^alpha D_y^beta f; |alpha|+|beta|<=m. Choose the largest Fourier coordinate for |beta|+p+3 integrations by parts; with the retained slow derivatives this needs at most m+p+3 total source derivatives.',
    radialRule:'For the full-line radial remainder, the p U-derivatives and p+3 extra torus derivatives are both retained; a sufficient total input order is m+2p+3.',
    callerSourceNormAccepted:false,sourceClassAuthenticated:false};
}

export async function prepareOriginalFourierClassMajorants(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','inversePower','maxWork'].includes(k)))
    fail('Choose finite derivative and inverse orders only; no direction, source, norm or completion flag is accepted.','INVALID_INPUT');
  const request={order:input.order??2,inversePower:input.inversePower??3,maxWork:input.maxWork??10000};
  natural(request.order,'Output order');natural(request.inversePower,'Inverse power');natural(request.maxWork,'Work budget');
  if(request.inversePower<1||request.maxWork<1||BigInt(request.inversePower)*(BigInt(request.order)+1n)+BigInt(request.order)+1n+16n>BigInt(request.maxWork)||
    !Number.isSafeInteger(request.order+2*request.inversePower+3))
    fail('The full requested all-mode norm inventory exceeds the declared work budget.','RESOURCE_LIMIT');
  const temporal=await recordedGlobalTemporalInverse();globalTemporalInverseObservations(temporal);
  const domain=await recordedSourceN7DomainExterior();sourceExteriorForceObservations(domain);
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),sqrtTwo=G.sqrt(q(2)),
    D=G.add(q(2),sqrtTwo),pi=exactAuxiliaryPi(G),twoPi=G.mul(q(2),pi.value),
    Tg=G.add(q(4),sqrtTwo),ciInverseOverS=G.mul(Tg,G.exp(G.mul(G.add(q(2),G.mul(q(2),h)),G.log(q(2))))),
    rows=Array.from({length:request.inversePower},(_,index)=>{
      const p=index+1,constant=G.div(G.mul(q(16),G.pow(D,p)),G.pow(twoPi,2*p+3)),
        tailCoefficient=G.div(G.mul(q(8),G.pow(D,p)),G.pow(twoPi,2*p+3));
      return {inversePower:p,operatorConstant:constant,completeTailCoefficient:tailCoefficient,
        sourceDerivativeOrders:Array.from({length:request.order+1},(_,m)=>originalFourierClassDerivativeDemand({outputOrder:m,inversePower:p})),
        wholeLattice:true,zeroModeInverted:false,
        estimate:'||L^(-p)(f-Haar(f))||_(C^m) <=16*(2+sqrt(2))^p/(2*pi)^(2p+3) * ||f||_(C^(m+p+3))',
        omittedSquareTail:'For max(|k0|,|k1|)>K>=1, the same derivative tail is <=8*(2+sqrt(2))^p/(2*pi)^(2p+3)/K times that input norm.',
        zeroMeanProjectionCostsNoDerivativeNorm:'Every nonzero Fourier coefficient of f-Haar(f) equals the coefficient of f; the integrations by parts use a positive torus derivative.'};
    }),temporalRows=Array.from({length:request.order+1},(_,m)=>({order:m,inputOrder:m+4,
      constant:G.mul(ciInverseOverS,rows[0].operatorConstant),addedSPower:1,epsilonExponentChange:'0',
      zetaPowerChange:'0',boundaryPoleChange:'0',
      sourceClassImplication:'If these exact full current Etheta/Ez have M_alpha bounds at the requested input orders, then -ci0^(-1)N^(-1)(E-Haar(E)) has M_alpha bounds with one additional S power.'})),
    observedPairs=Object.values(temporal.summary.inverses).flatMap(inv=>inv.finite.rows.map(row=>({mode:row.mode.map(String),
      original:row.divisor.quadratic,recomputed:exactAuxiliaryDivisor(G,row.mode),
      temporal:exactOriginalClassDivisor(G,{mode:row.mode,direction:'temporal'}),
      radial:exactOriginalClassDivisor(G,{mode:row.mode,direction:'radial'})}))),
    diophantine={directions:{temporal:['sqrt(2)-1','1'],radial:['1','1-sqrt(2)']},
      integerNorm:'(u+v*sqrt(2))*(u-v*sqrt(2))=u^2-2v^2',
      temporalSubstitution:{u:'k1-k0',v:'k0'},radialSubstitution:{u:'k0+k1',v:'-k1'},
      parityDescent:{squaresModuloFour:[0,1],ifNormZero:'u^2=2v^2 implies u even, then v even; dividing both by2 gives a smaller nonzero integer solution, which is impossible by descent.',
        zeroNormOnlyAtZeroMode:true},
      conjugateBound:'|u-v*sqrt(2)|<=(2+sqrt(2))*max(|k0|,|k1|)',
      inverseBound:'The nonzero integer norm has absolute value>=1, so |1/(direction.k)|<=(2+sqrt(2))*|k|max.',
      shellCount:'(2n+1)^2-(2n-1)^2=8n',wholeSeries:'sum_(n=1)^infinity n^-2<=1+integral_1^infinity x^-2 dx=2',
      exactPiLower:'pi=4*integral_0^1(1+t^2)^(-1)dt>=2, hence every displayed denominator is strictly positive.',observedPairs},
    palette={commonIndex:'i0=floor(((1+h)*(ell-2)*log2-2log(ell-2))/log(Tg))',
      referenceBand:'ell=ell_ref, Q_ref=2^(-ell_ref)',referenceS:'S_ref=ell_ref^2',
      localContinuousScaleSubstituted:false,
      sourceNormalization:'ci0=Tg^i0*2^(-(1+h)*ell)',ellDomain:'ell>ell0+3 and ell-2>=8 on the authenticated original common qBig',
      boundRoot:ciInverseOverS,exactBound:'ci0^(-1)<=Tg*2^(2*(1+h))*(ell-2)^2<=Tg*2^(2*(1+h))*ell^2',
      floorDefectFactorization:{defect:'x-floor(x)',range:['0','1'],upperEndpointIncluded:false,
        exactRatio:'ci0^(-1)/(Tg*2^(2*(1+h))*ell^2)=Tg^(defect-1)*(1-2/ell)^2',
        positiveTgGreaterThanOne:true,ellAtLeastEight:true},
      proof:['floor(x)>=x-1 and Tg>1 give Tg^i0>=2^((1+h)*(ell-2))/(Tg*(ell-2)^2).',
        'Multiply by2^(-(1+h)*ell) and invert positive quantities.',
        'ell>=2 gives(ell-2)^2<=ell^2=S; all fixed slow and common-Y derivatives hold ell and i0 fixed.'],
      additionalSPower:1,noNewSmallnessThreshold:true,actualHRetained:true},
    checks=[
      {id:'same-private-recorded-original-source-and-common-domain',pass:temporal.archiveVerification.pass&&domain.archiveVerification.pass&&
        temporal.summary.source.parameterExpressionSHA256===G.source.parameterExpressionSHA256&&
        temporal.summary.source.paperSHA256===G.source.sourcePaperSHA256&&
        domain.domain.sourceBinding.parameterExpressionSHA256===G.source.parameterExpressionSHA256},
      {id:'actual-original-time-direction-and-source-smooth-periodicity',pass:temporal.summary.periodicity.checks.every(c=>c.pass)&&
        temporal.summary.periodicity.checks.some(c=>c.id==='same-original-two-dimensional-time-direction'&&c.pass)},
      {id:'all-observed-source-divisors-reexecuted-exactly',pass:observedPairs.length===8&&observedPairs.every(r=>same(r.original,r.recomputed.quadratic)&&r.recomputed.proof.integerNormNonzero&&
        r.temporal.quadratic.u===r.original.m&&r.temporal.quadratic.v===r.original.n&&r.temporal.quadratic.integerNorm===r.original.integerNorm&&
        Object.values(r.temporal.checks).every(Boolean)&&Object.values(r.radial.checks).every(Boolean))},
      {id:'same-original-common-index-and-no-cover-inversion',pass:temporal.summary.periodicity.completeCommonTorusCoverProof.integerRange.minimum===0&&
        temporal.summary.periodicity.completeCommonTorusCoverProof.integerRange.maximum===4&&
        temporal.summary.periodicity.completeCommonTorusCoverProof.integerRange.proof.some(t=>t.includes('ell_ref-2>=8'))},
      {id:'all-positive-powers-and-all-mixed-derivative-demands-retained',pass:rows.length===request.inversePower&&rows.every(row=>
        row.sourceDerivativeOrders.length===request.order+1&&row.sourceDerivativeOrders.every(d=>d.exactPowerCancellation.netShellPower===-2))},
      {id:'only-source-constant-roots-no-band-or-point-norm',pass:[ciInverseOverS,...rows.flatMap(r=>[r.operatorConstant,r.completeTailCoefficient]),
        ...temporalRows.map(r=>r.constant)].every(x=>G.freeCoordinates(x).size===0)},
      {id:'same-positive-h-without-rounding',pass:same(G.source.parametersExactExpressions.h,{exp:{product:[{integer:-8002},{ref:'T'}]}})},
      {id:'no-input-class-assumption-disguised-as-a-bound',pass:temporalRows.every(row=>row.inputOrder===row.order+4&&row.addedSPower===1)&&
        rows.every(row=>row.zeroModeInverted===false)}
    ];
  if(checks.some(c=>!c.pass))fail('An original fixed Fourier operator premise failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const roots={h,Tg,exactPi:pi.value,ciInverseOverS};
  rows.forEach(row=>{roots['radial_inverse_constant_'+row.inversePower]=row.operatorConstant;roots['radial_inverse_tail_'+row.inversePower]=row.completeTailCoefficient;});
  temporalRows.forEach(row=>{roots['temporal_operator_constant_'+row.order]=row.constant;});
  const result={schema:'MathScope.N6.ActualFixedFourierClassMajorants/1',G,request,
    source:{profileId:G.source.id,paperSHA256:G.source.sourcePaperSHA256,parameterExpressionSHA256:G.source.parameterExpressionSHA256,
      actualTemporalArtifact:copy(temporal.artifact),actualTemporalArchiveSHA256:temporal.archiveSHA256,
      originalDomainArtifact:copy(domain.domainArtifact),originalDomainArchiveSHA256:domain.archiveSHA256,
      fixedSourceCode:'source-global-pressure.mjs:completeSourceCover; source-global-temporal.mjs:sourceSmoothPeriodicity; source-auxiliary-fourier.mjs'},
    operators:{temporal:{direction:['sqrt(2)-1','1'],directionRoots:[G.sub(sqrtTwo,G.one),G.one],normalization:palette.sourceNormalization,rows:temporalRows,
      equation:'N inverse(E-Haar E); velocity increment -ci0^(-1)*inverse',newSourceValuesInvented:false},
      radial:{direction:['1','1-sqrt(2)'],directionRoots:[G.one,G.sub(G.one,sqrtTwo)],powers:rows.map(r=>r.inversePower),weightedMomentConditionStillRequired:true,
        IBPFormula:'J(R^e f)=(-M^(-1))^p integral_R partial_U^p L^(-p)F(U+u,y+M*u*v_r)du; original zero full Haar moment and compact source remove the zero-mode integral and all endpoints.'}},
    rows,palette,diophantine,roots,checks,
    scope:{actualOriginalFixedDirectionsAndInverseConstantsConstructed:true,allRequestedDerivativeOrdersAndInversePowersRetained:true,
      arbitraryFixedOrderRecipe:true,allModesBoundAnalytically:true,allIntegerFrequenciesEnumerated:false,
      actualTemporalSourceReconstructed:false,actualCurrentInputClassNormsCertified:false,
      radialInputWeightedZeroMomentCertified:false,actualPhysicalCutoffFlatnessCertified:false,
      allOrderCurrentClassCertified:false,allCorrectionStagesConstructed:false,completeN6:false,newLeanKernelProof:false}};
  const metadata=data(result),program=copy(G.pack(roots,{schema:'MathScope.N6.FixedFourierClassMajorantProgram/1',metadata}));
  seals.set(result,{G,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),record:canonicalStringify(metadata),program});
  return result;
}

export function assertOriginalFourierClassMajorants(p){
  const s=seals.get(p);if(!s||s.G!==p.G||s.record!==canonicalStringify(data(p))||
    s.nodes!==canonicalStringify(p.G.nodes.slice(0,s.count))||!p.G.functionDefinitionsUnchanged(s.definitions))
    fail('Use the unchanged privately constructed original fixed Fourier class constants.');return true;
}

export async function originalFourierClassMajorantCertificate(p){
  assertOriginalFourierClassMajorants(p);const seal=seals.get(p),program=copy(seal.program),encoded=canonicalStringify(program);
  return {...data(p),schema:'MathScope.N6.ActualFixedFourierClassMajorantCertificate/1',program,
    graph:{sha256:await sha256(encoded),nodeCount:seal.count,canonicalBytes:new TextEncoder().encode(encoded).length}};
}

/** The current inverse bodies stay in their own graph. Only actual private
 * temporal states bind these fixed constants, with every source retained.
 */
export function attachOriginalTemporalClassOperator(temporal,p){
  assertGlobalTemporalInverse(temporal);assertOriginalFourierClassMajorants(p);
  const G=temporal.G,geometry=temporal.pressure.geometry,band=temporal.pressure.current.band,
    sqrtTwo=G.sqrt(G.q(2)),directions=[band.coordinates.R,band.coordinates.Z,band.coordinates.T,...geometry.Y],
    exactDirection=geometry.vt[0]===G.sub(sqrtTwo,G.one)&&geometry.vt[1]===G.one,
    fixedNormalization=directions.every(x=>!G.dependsOn(geometry.ci,x)),
    baseEll=G.sub(band.coordinates.ell,G.q(2)),h=band.constants.h,Tg=band.geometry.Tg,
    indexArgument=G.div(G.sub(G.mul(G.add(G.one,h),baseEll,G.log(G.q(2))),G.mul(G.q(2),G.log(baseEll))),G.log(Tg)),
    baseIndex=G.neg(G.ceiling(G.neg(indexArgument))),
    expectedCi=G.mul(G.exp(G.mul(baseIndex,G.log(Tg))),G.exp(G.mul(G.add(G.one,h),G.log(band.geometry.Q)))),
    sourceRows=Object.entries(temporal.inverses).map(([name,inv])=>({name,system:inv.system,source:inv.body,
      definition:G.auxiliaryInverseSystem(inv.system),exactInverse:inv.exact,zeroMode:inv.exactZeroMode,
      sameActualCompleteSource:G.auxiliaryInverseSystem(inv.system).body===inv.body,
      sameOriginalCurrentResidual:inv.body===temporal.pressure.residual[name==='theta'?'Etheta':'Ez'],
      requestedClassBounds:p.operators.temporal.rows.map(row=>({...copy(row),constantGraphNamespace:'fixedFourier.G'}))})),
    checks=[{id:'same-actual-source-and-constant-parameter-program',pass:temporal.source.parameterExpressionSHA256===p.source.parameterExpressionSHA256&&
      temporal.source.paperSHA256===p.source.paperSHA256},
      {id:'same-complete-original-temporal-direction-and-fixed-normalization',pass:exactDirection&&fixedNormalization&&
        geometry.referenceBaseEll===baseEll&&geometry.commonIndex===baseIndex&&geometry.ci===expectedCi&&Tg===G.add(G.q(4),sqrtTwo)},
      {id:'every-actual-inverse-and-zero-mode-bound',pass:sourceRows.length===2&&sourceRows.every(row=>row.sameActualCompleteSource&&row.sameOriginalCurrentResidual&&row.zeroMode===G.zero)},
      {id:'actual-source-periodicity-and-original-potential',pass:temporal.periodicity.checks.every(c=>c.pass)&&temporal.potential.checks.every(c=>c.pass)}];
  if(checks.some(c=>!c.pass))fail('The fixed Fourier operator bounds do not bind this exact temporal current.');
  const result={schema:'MathScope.N6.ActualTemporalClassOperatorAttachment/1',G,temporal,operator:p,
    sourceRows,checks,geometry:{ci:geometry.ci,vt:geometry.vt,commonIndex:geometry.commonIndex},
    source:{paperSHA256:p.source.paperSHA256,parameterExpressionSHA256:p.source.parameterExpressionSHA256},
    scope:{actualFixedOperatorAttachedToCompleteTemporalSource:true,actualInputMeanClassNormsCertified:false,
      sourceConstantGraphIsDistinct:true,allOrderCurrentClassCertified:false,completeN6:false}};
  attachments.set(result,{G,temporal,p,record:canonicalStringify({...result,G:null,temporal:null,operator:null})});return result;
}

export function assertOriginalTemporalClassOperator(p){
  const s=attachments.get(p);if(!s||s.G!==p.G||s.temporal!==p.temporal||s.p!==p.operator||
    s.record!==canonicalStringify({...p,G:null,temporal:null,operator:null}))fail('Use the unchanged private temporal class operator attachment.');
  assertGlobalTemporalInverse(p.temporal);assertOriginalFourierClassMajorants(p.operator);return true;
}
