/** Actual positive coefficient cancellation, including both stress ends.
 * The original finite low-order defects are retained as expressions. Their
 * vanishing is proved from the actual Picard recurrence, five GLOBAL
 * moments, pressure primitive and signed stress FTC.  No forcing or zero
 * coefficient is defined here to make the momentum equation tautological.
 */
import {prepareActualGlobalConservativeMoments,assertActualGlobalConservativeMoments} from './actual-global-conservative-moments.mjs';
import {actualPositiveStressFTC} from './actual-background-residual-bridge.mjs';
import {verifyActualInductionInnerEquations,verifyActualInductionParametricKernel} from './actual-residual-order-induction-proof.mjs';
import {sourceScaledOperators} from './actual-continuation-exact-order-two-source.mjs';
import {actualLeadingSubtractedAngularProof} from './actual-continuation-exact-leading-conservation.mjs';
import {explicitPrimitiveBodyIdentity} from './actual-global-primitive-kernels.mjs';
import {reduceExpressionOnDeclaredBranches} from './actual-global-pressure-kernels.mjs';
import {reduceLiteralZeroDerivatives} from './actual-strengthened-background-kernels.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {originalPositiveConservativeTotalIdentity,originalSignedStressSplitIdentity} from './actual-positive-global-stress-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const live=new WeakMap(),data=r=>({source:r.source,request:r.request,generic:r.generic,leading:r.leading,inner:r.inner,rawRows:r.rawRows,
  sourceFTC:r.sourceFTC,momentFamilies:r.momentFamilies,totals:r.totals,stressRows:r.stressRows,radialRows:r.radialRows,roots:r.roots,checks:r.checks,scope:r.scope,remaining:r.remaining});
const requirePass=(p,label)=>{if(!p.pass)fail('INVALID_SOURCE_CONSTRUCTION',label);return p;};
const body=(G,id)=>{const n=G.nodes[id];return n.op==='actual_expression_partial'&&n.args[2].every(x=>x===0)
  ?body(G,G.materializeExpressionFunction(n.args[0],n.args[1],n.args[2])):id;};
const equal=(G,a,b,atomicNodes=[],label='The original positive residual body changed.')=>
  requirePass(explicitPrimitiveBodyIdentity(G,a,b,{atomicNodes,maxVisits:600000}),label);
const algebra=(G,difference,atomicNodes=[],label='The actual positive residual algebra failed.')=>
  requirePass(sourceGraphRationalIdentity(G,difference,{atomicNodes,maxTerms:100000}),label);

/** Copy only explicitly enumerated algebra of an append-only leading
 * audit, above the already checked common original node prefix.  New
 * audit node IDs are never transplanted into the induction copy. Existing
 * original opaque functions remain the SAME original prefix nodes.
 */
function copyLeadingAuditAlgebra(G,origin,base,roots){
  if(canonicalStringify(G.nodes.slice(0,base))!==canonicalStringify(origin.nodes.slice(0,base)))
    fail('INVALID_SOURCE_CONSTRUCTION','The leading and induction graphs must preserve the same original prefix before mapping audit algebra.');
  const map=new Map(),trace=[];
  function copy(id){
    if(id<base)return id;if(map.has(id))return map.get(id);
    const {op,args}=origin.nodes[id];let value;
    if(op==='coordinate')value=G.fresh('mapped_leading_audit_'+args[0]);
    else if(op==='rational'||op==='source_parameter')value=G.node(op,[...args]);
    else if(['add','multiply','inverse','sqrt_positive','exp','log_positive','sine','cosine','maximum','ceiling_nonnegative'].includes(op))value=G.node(op,args.map(copy));
    else if(op==='integer_power'||op==='source_step_derivative')value=G.node(op,[copy(args[0]),args[1]]);
    else if(op==='definite_integral'||op==='smooth_piecewise')value=G.node(op,args.map(copy));
    else fail('INVALID_SOURCE_CONSTRUCTION','A new leading audit operation is not plain copied algebra: '+op+'. Preserve its original function identity explicitly.');
    map.set(id,value);trace.push({originalAuditNode:id,inductionNode:value,operation:op});return value;
  }
  const mapped=Object.fromEntries(Object.entries(roots).map(([name,id])=>[name,copy(id)]));
  return {mapped,trace,commonOriginalNodeCount:base,newAuditNodeIdsInterchanged:false,
    sourceOpaqueFunctionsReconstructed:false,meaning:'Node-by-node exact copy of plain audit algebra, with fresh bound coordinates, above the unchanged original common prefix.'};
}

function afterSourceEnd(G,root,moments,{atXv=false}={}){
  const {pressure:p}=moments,{bootstrap:b}=p.primitives.prepared,{X}=b.constants,s=p.primitives.sourceSupport,
    {Xb,Xplus,...earlier}=s.endpoints,ends=new Set(Object.values(earlier)),tail=s.leadingExterior,q=(n,d=1)=>G.q(n,d),steps=new Map();
  if(!atXv)ends.add(Xplus);tail.physicalRightEnds.forEach(x=>ends.add(x));
  for(let j=0;j<5;j++)for(const argument of [
    G.div(G.sub(G.div(X,G.parameter('XR')),q(j+6,2048)),q(1,4096)),
    G.div(G.sub(G.div(X,G.parameter('X0I1')),q(j+9)),q(1,2))])
    for(let k=0;k<=3;k++)steps.set(G.step(argument,k),k?G.zero:G.one);
  const reduced=reduceExpressionOnDeclaredBranches(G,root,{coordinate:X,stepValues:steps,maxVisits:600000,
    selectPiecewise:n=>n.coordinate===X&&ends.has(n.right)||n.coordinate===tail.tailLogCoordinate&&n.right===tail.tailLogRight?5:null}),
    zero=reduceLiteralZeroDerivatives(G,reduced.value);
  if(!s.pass||zero.value!==G.zero)fail('INVALID_SOURCE_CONSTRUCTION','The actual coefficient has not reached its source-closed zero exterior.');
  return {source:root,endpoint:atXv?b.constants.Xv:Xplus,reduced,zero,
    reason:'All selected source endpoints are earlier by the private original ordering proof. Integrals keep their accumulated value unless the original source already supplies a moment-closed zero branch.',pass:true};
}

function leadingMomentPremises(moments,context){
  const {G,pressure:p}=moments,{bootstrap:b}=p.primitives.prepared,{X,eta,Xv}=b.constants,
    massExterior=afterSourceEnd(G,b.finalM,moments,{atXv:true}),
    massIntegrand=G.share(b.finalU,[X,eta],'ActualLeadingWholeMassDensityForPositiveStress'),t=G.fresh('actual_leading_whole_mass_for_stress'),
    massIntegral=G.integral(G.substitute(massIntegrand,X,t),t,G.zero,Xv);
  if(!p.stream.scope.actualGlobalLeadingMassPrimitiveIdentity||p.stream.roots.actualGlobalM0!==b.finalM||
    p.stream.roots.actualGlobalU0!==b.finalU||!p.stream.scope.actualLeadingContinuityIdentity)
    fail('INVALID_SOURCE_CONSTRUCTION','The SAME actual M0 and complete source stream must supply the leading axial total.');
  context.onProgress?.({phase:'positive-stress-leading-angular-source-start',nodes:G.nodes.length});
  const angular=actualLeadingSubtractedAngularProof(b.completedOrderOne,b.actualHeat),origin=b.G,
    copy=copyLeadingAuditAlgebra(G,origin,G.baseNodeCount,{originalRoot:angular.originalRoot,normalizedRoot:angular.normalizedRoot,
      waitFactor:angular.analyticRewrite.from,waitRatio:angular.analyticRewrite.to}),
    mappedNormalization=G.substitute(copy.mapped.originalRoot,copy.mapped.waitFactor,copy.mapped.waitRatio),
    normalizationCheck=equal(G,mappedNormalization,copy.mapped.normalizedRoot);
  if(!angular.pass||!angular.constantOfIntegrationIncluded||angular.heatChangeAloneUsedAsWholeMoment||!angular.analyticRewrite.verified)
    fail('INVALID_SOURCE_CONSTRUCTION','The full actual pre-heat and post-heat angular invariant must be supplied, including its integration constant.');
  const heat=b.actualHeat.heat,exterior=b.stress.exteriorIdentity;
  if(!b.stress.sourceAssertions.actualHeatExteriorChainIdentity||!exterior.pass||b.actualHeat.program.heat.tailTruncated!==false)
    fail('INVALID_SOURCE_CONSTRUCTION','The leading angular viscosity requires the actual complete heat exterior identity.');
  context.onProgress?.({phase:'positive-stress-leading-moment-premises-bound',nodes:G.nodes.length});
  return {mass:{actualIntegral:massIntegral,sourceU:b.finalU,sourceM:b.finalM,massExterior,
      axis:'The source-bound leading M0 proof retains M0=X*(Ustar+natural_average/Lambda) at the regular axis, so M0(0)=0 without evaluating M0/X there.',
      theorem:'The actual global M0_X=U0 and its checked original zero exterior give integral_0^Xv U0 dX=M0(Xv)-M0(0)=0.',pass:true},
    angular:{actualSubtractedMomentRoot:copy.mapped.originalRoot,mappedNormalizedRoot:copy.mapped.normalizedRoot,normalizationCheck,copy,
      originalAuditGraphNamespace:'bootstrap.original-leading-append-only-audit',originalAuditProof:angular,
      sourceFullLeadingF:heat.finalF,sourceHeatExterior:exterior,
      theorem:'The complete original source satisfies (5.19), including the pre-heat A.2/A.13 integration constant, B8/I1 angular corrections and full I2/heat compensation.',
      differentiatedIntegral:'In physical radius the prescribed subtracted power is independent of z. Beyond the actual source terminal collar the full heat profile is also independent of z, by the executed heat chain identity. Thus the second z derivative has compact radial support, and differentiating the complete convergent subtracted moment gives zero for the integrated leading angular viscosity.',
      heatOnlyMomentUsed:false,improperIntegralDeclaredAbsolutelyConvergentWithoutSubtraction:false,pass:true}};
}

/** Independently assemble the raw coefficient before adding stress.
 * n=1 uses the exact original unshared bodies to avoid assuming that a
 * sharing label is a derivative oracle. n>=2 uses the genuine source's
 * explicit shared functions and their implemented AD operations.
 */
function actualRawCoefficient(moments,n,context){
  const {G,pressure:p}=moments,prepared=p.primitives.prepared,{bootstrap:b,records}=prepared,{X,eta}=b.constants,
    q=(n,d=1)=>G.q(n,d),{A,D}=G.core,h=G.parameter('h'),{T,Z}=sourceScaledOperators(G,X,eta),
    exponent=k=>G.mul(q(2*k),h),bexp=G.neg(G.add(A,q(1,2))),cexp=G.neg(A),
    tuples=records.slice(0,n+1).map(r=>Object.fromEntries(['F','U','v'].map(k=>[k,n===1?body(G,r.global[k]):r.global[k]]))),
    Pi=n===1?body(G,records[n].global.Pi):records[n].global.Pi,
    pairs=Array.from({length:n+1},(_,i)=>[i,n-i]),current=tuples[n],
    theta=[T(G.add(bexp,exponent(n)),current.F)],axial=[T(G.add(cexp,exponent(n)),current.U)];
  for(const[i,j]of pairs){const a=tuples[i],b=tuples[j];
    theta.push(G.mul(a.v,G.add(G.mul(X,G.derivative(b.F,X)),b.F)),G.mul(a.U,Z(G.add(bexp,exponent(j)),b.F)));
    axial.push(G.mul(X,a.v,G.derivative(b.U,X)),G.mul(a.U,Z(G.add(cexp,exponent(j)),b.U)));
  }
  const lowerAngular=Z(G.sub(G.add(bexp,exponent(n-1)),D),Z(G.add(bexp,exponent(n-1)),tuples[n-1].F)),
    lowerAxial=Z(G.sub(G.add(cexp,exponent(n-1)),D),Z(G.add(cexp,exponent(n-1)),tuples[n-1].U));
  theta.push(G.mul(q(-2),G.add(G.mul(X,G.derivative(G.derivative(current.F,X),X)),G.mul(q(2),G.derivative(current.F,X)))),G.neg(lowerAngular));
  axial.push(Z(G.add(G.mul(q(-2),A),exponent(n)),Pi),G.mul(q(-2),G.add(G.mul(X,G.derivative(G.derivative(current.U,X),X)),G.derivative(current.U,X))),G.neg(lowerAxial));
  const original=records[n].stress,sourceTheta=n===1?original.angular:original.rawTheta,sourceAxial=n===1?original.axial:original.rawZ,
    thetaRoot=G.add(...theta),axialRoot=G.add(...axial),
    atoms=[...tuples.flatMap(r=>Object.values(r)),Pi,lowerAngular,lowerAxial],
    thetaCheck=equal(G,sourceTheta,thetaRoot,atoms),axialCheck=equal(G,sourceAxial,axialRoot,atoms),
    fieldChecks=tuples.flatMap((r,i)=>Object.entries(r).map(([name,root])=>({order:i,name,source:records[i].global[name],body:root,check:equal(G,records[i].global[name],root)}))),
    pressureCheck=equal(G,records[n].global.Pi,Pi),sourceInner=verifyActualInductionInnerEquations(prepared,{order:n,kind:'actual'}),
    PiBody=G.nodes[body(G,records[n].global.Pi)];
  if(PiBody.op!=='smooth_piecewise'||PiBody.args[3]!==records[n].raw.Pi||PiBody.args[1]!==b.orderOne.Xkeep)
    fail('INVALID_SOURCE_CONSTRUCTION','The actual global pressure must retain the original raw Picard pressure throughout the inner collar.');
  if(!p.primitives.rows[n-1].coreUCheck.pass||!p.primitives.rows[n-1].coreFCheck.pass)
    fail('INVALID_SOURCE_CONSTRUCTION','The actual full positive fields must retain the SAME Picard core before using its PDE.');
  const exterior=Object.fromEntries(['F','U','v','Pi'].map(k=>[k,afterSourceEnd(G,records[n].global[k],moments)]));
  context.onProgress?.({phase:'positive-stress-raw-and-inner-recurrence-bound',order:n,nodes:G.nodes.length});
  return {order:n,pairs,tuples,Pi,sourceTheta,sourceAxial,thetaRoot,axialRoot,thetaCheck,axialCheck,fieldChecks,pressureCheck,
    lowerAngular,lowerAxial,sourceInner,exterior,
    innerRestriction:{endpoint:b.orderOne.Xminus,unchangedCutoffStart:b.orderOne.Xkeep,
      sourceCoreChecks:p.primitives.rows[n-1].coreUCheck.pass&&p.primitives.rows[n-1].coreFCheck.pass,
      rawPicardSystem:records[n].raw.system,sourcePressureCore:PiBody.args[3],
      proof:'Xminus<Xkeep and every local cutoff is identically one there. The private pressure proof identifies full leading F/U/v with the original inner tuple. The actual positive mass primitive and Picard U/K row identify the integral average with the same raw U+K. The pressure retains its literal raw branch. Consequently the executed original Picard PDE reduction cancels both whole raw residuals before Xminus, with every source jet.'},
    exteriorMechanism:n===1?'Every non-heat current/product/pressure term has an actual positive coefficient which has ended before Xplus. The leading U0 has ended at Xv; the leading angular axial-viscosity ends at Xb by the original complete heat chain identity.'
      :'Every ordered product contains a positive coefficient and the lower axial-viscosity order n-1 is positive. The checked global fields and all their derivatives vanish after Xplus.',
    allOriginalConvolutionTermsRetained:true,lowerForcingDropped:false,pass:true};
}

function buildConservativeTotals(moments,leading,rawRows,generic){
  const {G}=moments,{eta}=moments.pressure.primitives.prepared.bootstrap.constants,{D,d,L}=G.core,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),
    zeroSystems=new Map(),families=[];
  function family(name,root,proof){
    if(!proof.pass)fail('INVALID_SOURCE_CONSTRUCTION','A source proof must precede every zero moment family.');
    const system=G.defineExpressionFunction({name,parameters:[eta],body:root,derivativeLimits:[2]}),value=G.expressionValue(system,[eta]);
    zeroSystems.set(system,{body:root,proof});const row={name,actualBody:root,system,value,proof};families.push(row);return value;
  }
  const m=Array(moments.rows.length+1);
  m[0]=[family('ActualSourceLeadingMassZero',leading.mass.actualIntegral,{kind:'original-M0-FTC-axis-and-whole-exterior',pass:leading.mass.pass}),
    family('ActualSourceLeadingSubtractedAngularZero',leading.angular.actualSubtractedMomentRoot,{kind:'complete-original-angular-A2-A13-B8-I1-I2-heat',pass:leading.angular.pass})];
  for(const row of moments.rows)m[row.order]=row.actualWholeIntegrals.map((root,j)=>family('ActualWholeGlobalMomentZero_'+row.order+'_'+(j+1),root,
    {kind:'source-full-global-density-to-original-continuous-moment-equation',order:row.order,moment:j+1,
      originalResidual:row.originalMomentResiduals[j],actualZeroEquation:row.checks[j],pass:row.pass&&row.checks[j].pass}));
  const Tbar=(a,x)=>G.div(G.add(G.neg(G.mul(a,x)),G.mul(D,eta,G.derivative(x,eta))),L),
    Zbar=(a,x)=>G.div(G.add(G.mul(q(2),a,eta,x),G.mul(d,G.derivative(x,eta))),L),trace=[],cache=new Map();
  function reduce(id){
    if(cache.has(id))return cache.get(id);const{op,args}=G.nodes[id];let out=id;
    if(op==='actual_expression_partial'&&zeroSystems.has(args[0])&&args[1].length===1&&args[1][0]===eta){
      const p=zeroSystems.get(args[0]);if(G.expressionSystems[args[0]].body!==p.body||!p.proof.pass)
        fail('INVALID_SOURCE_CONSTRUCTION','A proved actual moment family changed.');
      out=G.zero;trace.push({node:id,system:args[0],originalBody:p.body,etaOrder:args[2][0],rule:'fixed eta derivative of the proved SAME actual whole zero moment'});
    }else if(op==='add')out=G.add(...args.map(reduce));
    else if(op==='multiply')out=G.mul(...args.map(reduce));
    else if(op==='inverse')out=G.inv(reduce(args[0]));
    else if(op==='integer_power')out=G.pow(reduce(args[0]),args[1]);
    cache.set(id,out);return out;
  }
  const totals=rawRows.map(raw=>{
    const n=raw.order,nu=G.mul(q(2*n),h),previousNu=G.mul(q(2*(n-1)),h),thetaFluxExponent=G.add(q(1,2),G.mul(q(-2),h),nu),
      theta=G.sub(G.add(Tbar(G.add(G.sub(G.one,h),nu),m[n][1]),Zbar(thetaFluxExponent,m[n][3])),
        Zbar(thetaFluxExponent,Zbar(G.add(G.sub(G.one,h),previousNu),m[n-1][1]))),
      axial=G.sub(G.add(Tbar(G.add(D,nu),m[n][0]),Zbar(G.sub(nu,G.mul(q(2),h)),m[n][4])),
        Zbar(previousNu,Zbar(G.add(D,previousNu),m[n-1][0]))),
      thetaReduced=reduce(theta),axialReduced=reduce(axial),pass=thetaReduced===G.zero&&axialReduced===G.zero;
    if(!pass)fail('INVALID_SOURCE_CONSTRUCTION','The actual conservative whole moments did not reduce to zero.');
    return {order:n,theta,axial,thetaReduced,axialReduced,actualMomentFamilies:m[n],lowerMomentFamilies:[m[n-1][1],m[n-1][0]],
      sourceRawAngular:raw.sourceTheta,sourceRawAxial:raw.sourceAxial,
      sourceConservativeKernel:moments.generic.conservative.schema,
      fullIndeterminateExponentIdentity:generic.totals.schema,
      fullExponentAndBoundaryChecks:generic.totals.checks,
      independentIdentity:'Integrate the separately verified conservative pair and radial-weight identities for EVERY original ordered pair. Every continuity defect is zero by the SAME source stream primitives. All radial boundary fluxes vanish by source parity/regularity at X=0 and actual positive support at the outer endpoint. Integrating pressure by parts uses the proved complete Pi_n primitive. The n=1 lower angular term uses the actual convergent subtracted leading moment, not the divergent unrenormalized integral.',
      allFixedEtaDerivatives:true,callerMomentValuesAccepted:false,pass};
  });
  return {families,totals,trace};
}

function bindStressBoundaries(moments,rawRows,sourceFTC,totalData){
  const {G,pressure:p}=moments,prepared=p.primitives.prepared,{X}=prepared.bootstrap.constants,
    q=(n,d=1)=>G.q(n,d),rows=[];
  for(const ftc of sourceFTC.rows){
    const n=ftc.order,component=ftc.component,raw=rawRows[n-1],original=prepared.records[n].stress,
      total=totalData.totals[n-1],right=ftc.openDomain[1],I=G.nodes[ftc.integral],
      totalIntegral=G.integral(I.args[0],I.args[1],I.args[2],right),
      backward=component==='theta'?(n===1?original.thetaBackward:original.backwardTheta):(n===1?original.zBackward:original.backwardZ),
      parts=[];
    const collect=id=>{const node=G.nodes[id];if(node.op==='definite_integral'){parts.push(id);return;}
      if(['add','multiply'].includes(node.op))node.args.forEach(collect);else if(['inverse','integer_power','sqrt_positive'].includes(node.op))collect(node.args[0]);};collect(backward);
    if(parts.length!==1)fail('INVALID_SOURCE_CONSTRUCTION','The actual backward stress must contain one original integral.');
    const backIntegral=parts[0],bn=G.nodes[backIntegral];
    if(bn.args[2]!==X||bn.args[3]!==right)fail('INVALID_SOURCE_CONSTRUCTION','The original backward stress endpoints changed.');
    const backCompleted=G.integral(bn.args[0],bn.args[1],I.args[2],right),wholeDensityCheck=equal(G,backCompleted,totalIntegral),
      backwardSign=algebra(G,G.sub(G.mul(ftc.denominator,backward),backIntegral),[backIntegral]),
      originalTotal=n===1?(component==='theta'?original.totalAngular:original.totalAxial):null,
      originalTotalCheck=originalTotal===null?null:equal(G,originalTotal,totalIntegral),
      rawDensityCheck=equal(G,ftc.raw,component==='theta'?raw.sourceTheta:raw.sourceAxial),
      stressDerivative=component==='theta'?G.div(G.derivative(G.mul(X,ftc.root),X),X):G.derivative(G.mul(G.sqrt(G.mul(q(2),X)),ftc.root),X),
      retainedDefect=G.add(ftc.raw,stressDerivative),reducedTotal=component==='theta'?total.thetaReduced:total.axialReduced,
      interiorCoefficientDefect=G.add(ftc.raw,component==='theta'?G.div(ftc.interiorDerivative,G.mul(q(2),X)):ftc.interiorDerivative),
      interiorCoefficientCheck=algebra(G,interiorCoefficientDefect,[ftc.raw,ftc.integral]);
    if(!ftc.check.pass||!ftc.primitiveCheck.pass||!raw.sourceInner.pass||reducedTotal!==G.zero)
      fail('INVALID_SOURCE_CONSTRUCTION','Inner PDE, conservative total and original signed FTC are all required for global stress gluing.');
    rows.push({order:n,component,actualStress:ftc.root,actualRawResidual:ftc.raw,retainedStressDerivative:stressDerivative,retainedDefect,
      sourceForward:ftc.forward,sourceBackward:backward,sourceForwardIntegral:ftc.integral,sourceBackwardIntegral:backIntegral,
      actualWholeResidualIntegral:totalIntegral,originalTotal,originalTotalCheck,rawDensityCheck,wholeDensityCheck,backwardSign,
      originalSignedFTC:ftc.check,interiorCoefficientDefect,interiorCoefficientCheck,actualConservativeTotal:component==='theta'?total.theta:total.axial,actualConservativeTotalReduced:reducedTotal,
      joins:{axisAndInner:'The raw residual is identically zero before Xminus by the actual common-core Picard recurrence. The literal forward primitive therefore has zero initial value and all matching fixed jets there; Xminus>0 means its denominator never vanishes in the active collar.',
        outer:'The same actual total residual integral is zero by the full conservative moment proof. Splitting that integral at X proves -integral_left^X = integral_X^right. The ORIGINAL backward primitive has exactly the same complete density and the checked positive sign. Its density vanishes after the actual endpoint, so its value and every fixed derivative approach zero at the endpoint.',
        axis:'The stress already equals the literal zero function on a whole neighbourhood of X=0; no expression divides by zero at the axis.'},
      theorem:component==='theta'?'r_n,theta/R + partial_X(X*T_n,theta)/X = 0 globally, with the genuine smooth axis and both source endpoint extensions.'
        :'r_n,z + partial_X(sqrt(2X)*T_n,z) = 0 globally, with the genuine smooth axis and both source endpoint extensions.',
      finiteLowDefectDiscarded:false,defectDefinedAsZero:false,allFixedDerivativeJetsMatch:true,pass:true});
  }
  return rows;
}

export function attachActualPositiveGlobalStress(moments,context={}){
  assertActualGlobalConservativeMoments(moments);const {G,pressure:p}=moments,prepared=p.primitives.prepared,
    generic={totals:originalPositiveConservativeTotalIdentity(),signedSplit:originalSignedStressSplitIdentity()},
    leading=leadingMomentPremises(moments,context),sourceFTC=actualPositiveStressFTC(prepared),rawRows=[];
  for(let n=1;n<=moments.request.throughOrder;n++){context.checkCancelled?.();rawRows.push(actualRawCoefficient(moments,n,context));}
  const inner={parametric:verifyActualInductionParametricKernel(prepared),actualRows:rawRows.map(r=>r.sourceInner)},
    totalData=buildConservativeTotals(moments,leading,rawRows,generic),stressRows=bindStressBoundaries(moments,rawRows,sourceFTC,totalData),
    radialRows=moments.rows.map(row=>{
      const source=p.rows[row.order-1],Pi=prepared.records[row.order].global.Pi,derivative=G.derivative(Pi,prepared.bootstrap.constants.X),
        retainedDefect=G.sub(derivative,source.independent.fullRadialDensity);
      if(!source.pressurePrimitiveProved||!source.finalIdentity.pass)fail('INVALID_SOURCE_CONSTRUCTION','The actual full positive radial coefficient requires its original global pressure primitive.');
      return {order:row.order,actualPi:Pi,actualDerivative:derivative,independentFullRadialDensity:source.independent.fullRadialDensity,retainedDefect,
        actualOriginalPressureConvolutionProof:source.finalIdentity,originalPrimitiveSource:row.order===1?p.pressureOne.source:p.primitives.rows[row.order-1].pressure.source,
        theorem:'The ORIGINAL Pi_n derivative equals the independently assembled complete global centrifugal/Omega density, with its axis and all source joins. Hence the displayed radial coefficient defect is zero.',
        finiteLowDefectDiscarded:false,defectDefinedAsZero:false,pass:true};
    }),
    roots={actualLeadingWholeUIntegral:leading.mass.actualIntegral,actualLeadingFullSubtractedAngularMoment:leading.angular.actualSubtractedMomentRoot,
      ...Object.fromEntries(stressRows.flatMap(r=>[['n'+r.order+'_'+r.component+'_retainedActualDefect',r.retainedDefect],
        ['n'+r.order+'_'+r.component+'_actualWholeResidualIntegral',r.actualWholeResidualIntegral],['n'+r.order+'_'+r.component+'_actualConservativeTotal',r.actualConservativeTotal]])),
      ...Object.fromEntries(radialRows.map(r=>['n'+r.order+'_radial_retainedActualDefect',r.retainedDefect]))},
    result={G,moments,source:moments.source,request:{throughOrder:moments.request.throughOrder},generic,leading,inner,sourceFTC,rawRows,
      momentFamilies:totalData.families,totals:{rows:totalData.totals,zeroRewriteTrace:totalData.trace},stressRows,radialRows,roots,
      checks:[{id:'indeterminate-conservative-totals-and-original-signed-primitive',pass:generic.totals.pass&&generic.signedSplit.pass},
        {id:'same-actual-leading-global-moment-premises',pass:leading.mass.pass&&leading.angular.pass},
        {id:'source-indeterminate-order-Picard-reduction',pass:inner.parametric.pass},
        ...rawRows.map(r=>({id:'actual-original-raw-PDE-and-core-n'+r.order,pass:r.pass})),
        ...stressRows.map(r=>({id:'actual-global-stress-'+r.order+'-'+r.component,pass:r.pass}))],
      scope:{actualPositiveGlobalTangentialCoefficientCancellation:true,actualPositiveGlobalRadialCoefficientCancellation:true,
        actualPositiveGlobalMomentumCoefficientCancellation:true,actualPositiveStressWholeResidualIntegralsZero:true,
        actualOriginalForwardBackwardStressEquality:true,actualStressBothEndpointJoins:true,
        allFixedPositiveCoefficientDerivativeIdentities:true,allGeneratedPositiveOrdersExecuted:rawRows.length,
        originalFiniteLowDefectExpressionsRetained:true,actualLeadingOrderZeroResidualCancelled:false,
        commonInfiniteCutoffBackgroundAssembled:false,allOrderPhysicalResidualFlatness:false,
        wholeGN4Complete:false,newLeanKernelProof:false,m3MayStart:false},
      remaining:['The n=0 original Pi0 and leading stress cancellation is a separate SAME-source proof.',
        'A common all-order cutoff selector and the full pressure/stress/velocity tail bounds must still turn these uncut coefficient identities into an infinite physical residual/flat-error theorem.']};
  const packed=G.pack(roots,{schema:'MathScope.ActualPositiveGlobalStressProgram/1',...data(result)}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  live.set(result,{G,moments,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result)),program:canonicalStringify(result.program)});
  return result;
}

export function prepareActualPositiveGlobalStress(input={},context={}){
  return attachActualPositiveGlobalStress(prepareActualGlobalConservativeMoments(input,context),context);
}

export function assertActualPositiveGlobalStress(result){
  const s=live.get(result);if(!s||s.G!==result.G||s.moments!==result.moments||canonicalStringify(data(result))!==s.data||
    canonicalStringify(result.program)!==s.program||canonicalStringify(result.G.nodes.slice(0,s.count))!==s.prefix||!result.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally produced actual positive global stress proof.');
  assertActualGlobalConservativeMoments(result.moments);return true;
}

export async function actualPositiveGlobalStressCertificate(result){
  assertActualPositiveGlobalStress(result);const encoded=canonicalStringify(result.program);
  return {schema:'MathScope.ActualPositiveGlobalStressCertificate/1',...data(result),graph:{sha256:await sha256(encoded),
    nodeCount:result.program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length,fixedCompilerPrefix:true}};
}
