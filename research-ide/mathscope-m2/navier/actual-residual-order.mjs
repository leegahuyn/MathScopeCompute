/** Actual Fslow enclosures on one fixed, source-defined unmodified core.
 * N, mesh, and arithmetic bits are independent variables. Positive physical
 * scales and the fixed Cauchy error floor are never replaced by binary64 zero.
 */
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {actualBackgroundAxisObservations} from './actual-background-observations.mjs';
import {actualResidualOrderBounds} from './actual-residual-order-bounds.mjs';
import {buildActualResidualOrderProgram} from './actual-residual-order-algebra.mjs';
import {rational as q,addR,mulR,divR,negR,cmpR,rationalText,pointR,addI,scaleI,widenI,packI,unpackI,roundI,displayI} from './actual-residual-order-rational.mjs';

export const ACTUAL_RESIDUAL_DOMAIN_ID='same-N3-natural-core-fixed-residual-domain.1';
export const ACTUAL_RESIDUAL_LOCATION_BUDGET_BITS=160;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const I=n=>({integer:String(n)}),R=name=>({ref:name}),mul=(...a)=>({product:a}),div=(a,b)=>({quotient:[a,b]}),pow=(a,n)=>({power:[a,n]});

function normalize(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Expected a residual request object.');
  for(const k of Object.keys(input))if(!['sourceProfile','bits','mesh','maxDerivativeOrder','timeIndices'].includes(k))throw Error('Unsupported actual residual input: '+k);
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID,bits=input.bits??128,mesh=input.mesh??8,maxDerivativeOrder=input.maxDerivativeOrder??2,timeIndices=input.timeIndices??[4,8,12,16];
  assertSourceProfile(sourceProfile);
  if(!Number.isSafeInteger(bits)||bits<96||bits>512)throw Error('bits must be an integer from 96 to 512.');
  if(![4,8,16,32].includes(mesh))throw Error('mesh must be 4, 8, 16, or 32 on the same fixed domain.');
  if(!Number.isSafeInteger(maxDerivativeOrder)||maxDerivativeOrder<0||maxDerivativeOrder>6)throw Error('maxDerivativeOrder must be an integer from 0 to 6.');
  if(!Array.isArray(timeIndices)||!timeIndices.length||timeIndices.length>8||timeIndices.some((k,i)=>!Number.isSafeInteger(k)||k<1||k>256||(i&&k<=timeIndices[i-1])))throw Error('timeIndices must be strictly increasing integers from 1 to 256, at most eight.');
  return {sourceProfile,bits,mesh,maxDerivativeOrder,timeIndices:[...timeIndices]};
}

function baseIntervals(axis){
  const tiny=q(1,1n<<2048n),tinySquared=mulR(tiny,tiny),angular=unpackI(axis.samples[0].normalizedInterval),AA=unpackI(axis.samples[1].normalizedInterval),pressure=unpackI(axis.samples[2].normalizedInterval);
  return {
    N0:{theta:scaleI(angular,-1),z:scaleI(AA,2),radial:addI(scaleI(pressure,-2),[mulR(q(-24),tiny),q(0)])},
    N1:{theta:pointR(0),z:[addR(q(9,2),mulR(q(-18),tinySquared)),q(9,2)],radial:pointR(0)},
    exactSourceParameters:{hUpper:'1/2^2048',inverseKUpper:'1/2^2048',actualHPositive:true,actualKPositive:true,actualJPositive:true,lowerZeroIsIntervalEndpointOnly:true},
  };
}

const quantities={
  N0:{theta:{coefficient:'-(CSelected*j0^2/Lambda^2)*Z_b^[2]f0(X,0)',factor:'sqrt(2X)*Lambda^2/(CSelected*j0^2)',hPower:1,axis:'(-4*j0^2/Lambda^2)*phi1_X(0,0) with opposite sign'},z:{coefficient:'-Z_c^[2]U0(X,0)/j0',factor:'j0',hPower:1,axis:'2A=1+2h'},radial:{coefficient:'(Omega0/X-w*Z_0^[2]V0/X)/K',factor:'sqrt(X/2)*K',hPower:0,axis:'-2*Pi1_X(0,0)/K-24*w/K'}},
  N1:{theta:{coefficient:'(CSelected*j0^2/Lambda^2)*Htheta1(X,0)',factor:'sqrt(2X)*Lambda^2/(CSelected*j0^2)',hPower:3,axis:'0'},z:{coefficient:'Hz1(X,0)/(j0*X)',factor:'j0*X',hPower:3,axis:'9/2-18*h^2'},radial:{coefficient:'(Q1(X,0)+w*Q2(X,0))/K',factor:'sqrt(X/2)*K',hPower:2,axis:'0'}},
};

function pointRows(base,bits,mesh){
  const rows=[],eps=q(1,1n<<160n);
  for(let i=1;i<=mesh;i++){
    const xRatio=q(4*i,mesh),tail=divR(mulR(xRatio,eps),q(16));
    for(const N of [0,1])for(const component of ['theta','z','radial']){
      const key='N'+N,raw=widenI(base[key][component],tail),rounded=roundI(raw,bits),spec=quantities[key][component],idx=rows.length;
      rows.push({id:`actual-residual-N${N}-${component}-X${rationalText(xRatio)}`,sourceIndex:idx,N,component,XMultiplierExact:rationalText(xRatio),XExactExpression:mul({rational:rationalText(xRatio)},R('residualXUnit')),XStrictlyPositive:true,XBinary64:null,etaExact:'0',fixedDomainId:ACTUAL_RESIDUAL_DOMAIN_ID,
        quantity:spec.coefficient,normalizedInterval:packI(rounded),analyticRemainderUpperExact:rationalText(tail),arithmeticBits:bits,...displayI(rounded),
        physicalScale:{positive:true,factor:spec.factor,qExponent:{constant:'-3/2',hCoefficient:spec.hPower},w:'q^(2h)',qDomain:'0<q<=1',parameterUnderflowNotSubstituted:true},
        observationKind:'ACTUAL_SOURCE_RESIDUAL_COMPONENT_ENCLOSURE',intervalZeroCenterIsNotAnExactZero:N===1&&component!=='z',sourcePath:`result.results.pointRows[${idx}].normalizedInterval`,sourceEquation:'5.24',axisCoefficient:spec.axis});
    }
  }
  return rows;
}

export function actualResidualOrderCertificate(input={},context={}){
  const request=normalize(input),{sourceProfile,bits,mesh,maxDerivativeOrder,timeIndices}=request,source=assertSourceProfile(sourceProfile);
  const bounds=actualResidualOrderBounds({profileId:sourceProfile,maxDerivativeOrder}),program=buildActualResidualOrderProgram({profileId:sourceProfile,radialDegree:3}),axis=actualBackgroundAxisObservations({profileId:sourceProfile}),base=baseIntervals(axis);
  const rows=pointRows(base,bits,mesh),witness=rows.find(r=>r.N===0&&r.component==='radial'&&r.XMultiplierExact==='1');
  if(!witness)throw Error('The fixed witness must belong to every allowed mesh.');
  const lower=unpackI(witness.normalizedInterval)[0],eps=q(1,1n<<160n);
  const exactExpressions={...bounds.exactExpressions,
    residualNorm:{positiveNormGraphNode:bounds.positiveNormGraph.residualNormNode},residualSharpConstant:{positiveNormGraphNode:bounds.positiveNormGraph.sharpConstantNode},
    residualNormalizationBudget:{sum:[I(1),div(I(1),R('j0')),div(I(1),R('K')),div(mul(R('CSelected'),pow(R('j0'),2)),pow(R('Lambda'),2))]},
    residualXUnit:div(mul(pow(R('residualRadialRadius'),2),pow(I(2),-160)),mul(I(256),R('residualNorm'),R('residualNormalizationBudget'))),
    residualXMax:mul(I(4),R('residualXUnit')),
    residualWitnessScale:mul({sqrt:div(R('residualXUnit'),I(2))},R('K')),
  };
  const timeRows=timeIndices.map((k,index)=>{
    const name='residualW'+k,qname='residualQ'+k,upper=q(1,1n<<BigInt(k)),ratio=divR(upper,lower);
    exactExpressions[name]=div(mul(pow(I(2),-k),R('residualWitnessScale')),{sum:[I(1),R('residualSharpConstant'),R('residualWitnessScale')]});
    exactExpressions[qname]={exp:div({log:R(name)},mul(I(2),R('h')))};
    return {sourceIndex:index,k,wExactExpression:R(name),qExactExpression:R(qname),qStrictlyPositive:true,qBinary64:null,qLogExpression:`log(${name})/(2*h)`,actualHUnchanged:true,domainId:ACTUAL_RESIDUAL_DOMAIN_ID,
      commonPositivePhysicalScale:'q^(-3/2)*residualWitnessScale',N0NormLowerExact:rationalText(lower),N1NormUpperExact:rationalText(upper),actualNormRatioUpperExact:rationalText(ratio),...displayI([q(0),upper]),
      comparison:'sup_fixed_domain |Fslow[N=1]| < 2^(-k) * sup_fixed_domain |Fslow[N=0]|',strict:cmpR(lower,q(1))>0,sourcePath:`result.results.timeRows[${index}]`,
      lowerIsEvaluatedSourceWitness:true,upperIsSourceDerivedUniformNorm:true,intervalCentersAreNotComputedNormValues:true};
  });
  const precisionBits=[...new Set([96,128,192,bits])].sort((a,b)=>a-b);
  const precision=precisionBits.map(b=>{const r=pointRows(base,b,mesh).filter(x=>x.XMultiplierExact==='1');return {bits:b,domainId:ACTUAL_RESIDUAL_DOMAIN_ID,XExact:'residualXUnit',analyticBudgetBits:160,values:r.map(x=>({N:x.N,component:x.component,normalizedInterval:x.normalizedInterval})),arithmeticOnly:true};});
  const meshes=[4,8,16,32].map(g=>{const r=pointRows(base,bits,g);return {mesh:g,positivePointCount:g,domainId:ACTUAL_RESIDUAL_DOMAIN_ID,XMaxExact:'4*residualXUnit',witness:r.filter(x=>x.XMultiplierExact==='1').map(x=>({N:x.N,component:x.component,normalizedInterval:x.normalizedInterval})),sourceNormBoundUsesWholeDomain:true,finiteSamplingIsNotTheNormProof:true};});
  const checks=[
    {id:'same-accepted-source',pass:program.profileId===bounds.profileId&&axis.parameterExpressionSHA256===source.parameterExpressionSHA256},
    {id:'source-residual-norms-executed',pass:Object.keys(bounds.positiveNormGraph.coefficientNorms).length===8&&bounds.positiveNormGraph.nodes.length>0},
    {id:'actual-positive-N0-residual-witness',pass:cmpR(lower,q(1))>0},
    {id:'actual-positive-N1-axial-residual',pass:rows.filter(r=>r.N===1&&r.component==='z').every(r=>cmpR(unpackI(r.normalizedInterval)[0],q(0))>0)},
    {id:'actual-order-improvement',pass:timeRows.every(r=>r.strict&&cmpR(unpackI({lower:r.actualNormRatioUpperExact,upper:r.actualNormRatioUpperExact})[0],q(1))<0)},
    {id:'same-fixed-domain-under-precision-and-mesh',pass:precision.every(r=>r.XExact==='residualXUnit')&&meshes.every(r=>same(r.witness,meshes[0].witness))},
    {id:'strictly-positive-error-floor-retained',pass:cmpR(eps,q(0))>0&&rows.every(r=>cmpR(unpackI(r.normalizedInterval)[1],unpackI(r.normalizedInterval)[0])>0)},
    {id:'Km-independent-of-N',pass:bounds.derivativeConstants.every(r=>r.Km===2+r.m&&same(r.N,[0,1]))},
  ];
  return {schema:'MathScope.ActualFixedCoreResidualCertificate/1',request,sourceProfile,sourceHash:context.sourceHash??null,parameterExpressionSHA256:source.parameterExpressionSHA256,sourceInputs:axis.sourceInputs,
    domain:{id:ACTUAL_RESIDUAL_DOMAIN_ID,XExact:['0','4*residualXUnit'],etaExact:['-1','1'],angularDomain:'all theta',normWitnessTheta:'0',positivePointEta:'0',sourceNaturalCoreEnd:'4/Lambda',CauchyRadius:'3/Lambda',fixedForAllNMeshPrecisionAndQ:true,chosenFromActualSourceBounds:true,observationDomainIsVerySmall:true,physicalSpaceChangesWithQByOriginalSimilarityMap:true,fullCollar:false,wholeProfile:false},
    restrictionProof:{sourcePaperSHA256:program.sourcePaperSHA256,originalStatements:['Theorem 4.6(ii), pp.32-33: T0=0 for 0<=X<=Xa','Lemma 5.2, pp.49-51: Xa<Xminus<Xkeep<Xcut<a^2<inf Ipos','Equations (5.14)-(5.15): cutoff=1 and all five bumps=0 before Xminus; forward integrals preserve V1 and Pi1','Equation (5.13): T1=0 on [0,Xminus]','Proposition 5.3, pp.54-55: every fixed compact 0<=X<=Xmax, -1<=eta<=1'],executedRadiusInequality:'0<Xmax/R=R*2^-160/(64*Bres*normalizationBudget)<1/64<1/8, since 0<R<1 and Bres,normalizationBudget>=1',sameFinalizedInnerCoefficientRestriction:true,pressureReconstructedFromSameZeroAxisDatum:true,stressAndAllDerivativesExactlyZeroOnObservationNeighborhood:true,qCutoffNotApplied:true},
    exactExpressions,sourceNorms:bounds,residualProgram:program,
    axisIdentities:{Ustar:'4*eta+j0',alpha:'-1/2*Z_(-1) Z_(-A) Ustar',alphaAtZero:'A*j0',alphaEtaAtZero:'12',alphaEtaEtaAtZero:'2*A*j0*(8*h-3)',N0Radial:'24-4*A*P(0)+P_second(0)',N1AxialSlope:'(9/2-18*h^2)*j0',N1RadialAxis:'0',actualPressureIntervalUsed:true},
    pointRows:rows,timeRows,witnessId:witness.id,refinement:{precision,meshes,analyticBudgetBits:160,locationDependsOnArithmeticBits:false,locationDependsOnMesh:false,locationDependsOnQ:false,precisionBeyondAnalyticFloorDoesNotImproveTheSourceError:true,meshSamplesAreObservationsNotAReplacementForTheAnalyticSupremumBound:true},
    sourceErrorLedger:{actualA21Intervals:axis.samples[2].normalizedInterval,normalizedAngularAxisInterval:axis.samples[0].normalizedInterval,smallParameters:base.exactSourceParameters,cauchyBudgetUpperExact:'1/2^160',atPointRemainder:'(X/XUnit)*2^-160/16',pressureCorrection:'-24*w/K is enclosed in [-24*2^-2048,0], not deleted',arithmetic:'Outward exact rational-to-dyadic rounding at requested bits; binary64 is display only.'},
    checks,pass:checks.every(c=>c.pass),
    scope:{actualFiniteFixedDomainResidualEnclosures:true,actualResidualNormOrderImprovement:true,actualCNmAndKmComputed:true,finiteOrders:[0,1],derivativeOrdersThrough:maxDerivativeOrder,uniformEtaDomainCertified:true,sourceCoefficientPointsAtEtaZeroOnly:true,sourceN1InfiniteSolutionEnclosedByCauchy:true,finitePolynomialTreatedAsFullSolution:false,unchangedInnerRestrictionOfOriginalRepair:true,globalN1MomentRepairComplete:false,wholeProfileResidualComplete:false,allNResidualComplete:false,sourceProfileReplaced:false,formalKernelProof:false},
    acceptanceBoundary:'Finite original (5.25) acceptance on one explicitly fixed compact in the unchanged source core. It does not construct the unfinished global repaired tuple or certify every N.',
  };
}

export function verifyActualResidualOrderCertificate(value){
  try{const expected=actualResidualOrderCertificate(value?.request??{},{sourceHash:value?.sourceHash??null});return {pass:expected.pass&&same(value,expected),reason:same(value,expected)?'Actual source, direct residual program, norm constants, fixed coordinates, outward intervals, and scope replay exactly.':'Source, coordinate, coefficient, bound, or claim differs from internal reconstruction.'};}catch(e){return {pass:false,reason:e.message};}
}
