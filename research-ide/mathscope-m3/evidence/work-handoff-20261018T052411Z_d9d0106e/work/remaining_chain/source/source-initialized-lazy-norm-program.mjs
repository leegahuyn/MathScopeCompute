/** Closed finite norm programs for the ORIGINAL initialized mean.
 *
 * A deferred scalar is a selected result of an actual imported producer,
 * whose complete source inputs occur in the closed call graph below. It
 * is never a number, user named constant, hash or class-completion flag.
 * The scalar composition is executed at the requested order. Expanding
 * the high-order source derivative bodies is a separate finite action.
 */
import {assertOriginalInitializedNormAuthority,originalInitializedNormSource}
  from './source-initialized-norm-authority.mjs';
import {attachActualCommonTargetWeightedNorms,assertActualCommonTargetWeightedNorms}
  from '../../mathscope-m2/navier/actual-common-target-weighted-norms.mjs';
import {rectangularSourceFTC} from '../../mathscope-m2/navier/actual-background-physical-seminorms.mjs';
import {compactCoefficientSourceFTC} from '../../mathscope-m2/navier/actual-compact-all-band-background-norms.mjs';
import {sourceAllOrderCutoffJets} from '../../mathscope-m2/navier/actual-residual-order-induction-kernels.mjs';
import {rational,qadd,qmul,qpow} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {originalPrimaryClassDegreeProgram,attachGlobalPrimaryClassOperator,assertGlobalPrimaryClassOperator}
  from './source-primary-class-majorants.mjs';
import {originalCommonYAffineClassRecipe,attachGlobalCommonYCovarianceClass,assertGlobalCommonYCovarianceClass}
  from './source-common-y-class-majorants.mjs';
import {originalHigherStressTailRecipe,attachGlobalBackgroundClass,assertGlobalBackgroundClass}
  from './source-background-class-majorants.mjs';
import {prepareOriginalRadialClassMajorants,assertOriginalRadialClassMajorants}
  from './source-radial-class-majorants.mjs';
import {prepareOriginalFourierClassMajorants,assertOriginalFourierClassMajorants}
  from './source-fourier-class-majorants.mjs';
import {prepareOriginalMeanMapOperatorSeminorms,assertOriginalMeanMapOperatorSeminorms,originalMeanSeedFlatJets}
  from './source-fixed-mean-majorants.mjs';
import {originalPressureClassDerivativeDemand,radialCovarianceForceMajorant}
  from './source-pressure-class-kernel.mjs';
import {attachGlobalRadialPressureClass,assertGlobalRadialPressureClass}
  from './source-global-pressure-class-majorants.mjs';
import {originalInitialMeanResidualDemand,initialMeanResidualMajorants}
  from './source-initial-residual-class-kernel.mjs';
import {attachGlobalInitialResidualClass,assertGlobalInitialResidualClass}
  from './source-global-initial-residual-class.mjs';
import {originalTemporalClassDerivativeDemand,originalRawTemporalCutoffMajorant,composeOriginalTemporalClassRows}
  from './source-temporal-class-kernel.mjs';
import {attachGlobalTemporalClass,assertGlobalTemporalClass}
  from './source-global-temporal-class-majorants.mjs';
import {originalFreshMeanClassDerivativeDemand,composeOriginalFreshMeanDefectRows,
  composeOriginalFiveMapClassRows,composeOriginalFiveMomentRemainderRows}
  from './source-fresh-mean-class-kernel.mjs';
import {attachGlobalPostTemporalDefectClass,assertGlobalPostTemporalDefectClass,
  attachGlobalInitializedMeanInputClasses,assertGlobalInitializedMeanInputClasses}
  from './source-global-fresh-mean-class-majorants.mjs';
import {radialFactorial} from './source-radial-class-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),materializedSeals=new WeakMap(),copy=x=>structuredClone(x),
  fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be a finite nonnegative integer.','RESOURCE_LIMIT');return n;},
  keys=['beta','v','gamma'],covarianceKeys=['rr','rtheta','rz','thetatheta','thetaz','zz'],
  producers=Object.freeze({target:attachActualCommonTargetWeightedNorms,
    primary:attachGlobalPrimaryClassOperator,commonY:attachGlobalCommonYCovarianceClass,background:attachGlobalBackgroundClass,
    radial:prepareOriginalRadialClassMajorants,fourier:prepareOriginalFourierClassMajorants,five:prepareOriginalMeanMapOperatorSeminorms,
    pressure:attachGlobalRadialPressureClass,initialResidual:attachGlobalInitialResidualClass,temporal:attachGlobalTemporalClass,
    fresh:attachGlobalPostTemporalDefectClass,initialized:attachGlobalInitializedMeanInputClasses,
    rectangularFTC:rectangularSourceFTC,coefficientFTC:compactCoefficientSourceFTC,
    allFiniteCutoffJets:sourceAllOrderCutoffJets,fixedMeanSeedJets:originalMeanSeedFlatJets,
    degree:originalPrimaryClassDegreeProgram,commonYDegree:originalCommonYAffineClassRecipe,
    pressureProducts:radialCovarianceForceMajorant,initialResidualProducts:initialMeanResidualMajorants,
    temporalProducts:composeOriginalTemporalClassRows,freshProducts:composeOriginalFreshMeanDefectRows,
    fiveProducts:composeOriginalFiveMapClassRows,remainderProducts:composeOriginalFiveMomentRemainderRows}),
  assertions=Object.freeze({target:assertActualCommonTargetWeightedNorms,primary:assertGlobalPrimaryClassOperator,
    commonY:assertGlobalCommonYCovarianceClass,background:assertGlobalBackgroundClass,radial:assertOriginalRadialClassMajorants,
    fourier:assertOriginalFourierClassMajorants,five:assertOriginalMeanMapOperatorSeminorms,
    pressure:assertGlobalRadialPressureClass,initialResidual:assertGlobalInitialResidualClass,temporal:assertGlobalTemporalClass,
    fresh:assertGlobalPostTemporalDefectClass,initialized:assertGlobalInitializedMeanInputClasses});

function requested(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxNodes','maxWork'].includes(k)))
    fail('Choose finite output order and representation budgets only; no source identity, norm value or producer name is an input.','INVALID_INPUT');
  const r={order:input.order??0,maxNodes:input.maxNodes??200000,maxWork:input.maxWork??200000};
  Object.entries(r).forEach(([k,n])=>natural(n,k));
  if(r.maxNodes<1||r.maxWork<1||!Number.isSafeInteger(r.order+20)||BigInt(r.order+20)**3n>BigInt(r.maxWork))
    fail('The complete source-only norm program exceeds its declared finite work budget.','RESOURCE_LIMIT');
  return r;
}

/** Only positive, closed scalar operations used by the imported kernels.
 * source_norm_result leaves select a scalar from the closed producer DAG.
 * Their existence does not say that the producer's derivative bodies were
 * materialized. The live consumer below retains the function references.
 */
class ClosedNormScalars{
  constructor(maxNodes){this.maxNodes=maxNodes;this.nodes=[];this.memo=new Map();this.zero=this.q(0);this.one=this.q(1);}
  emit(op,args){const key=canonicalStringify([op,args]);if(this.memo.has(key))return this.memo.get(key);
    if(this.nodes.length>=this.maxNodes)fail('The complete scalar composition exceeded its explicit node budget.','RESOURCE_LIMIT');
    const id=this.nodes.length;this.nodes.push({op,args});this.memo.set(key,id);return id;}
  require(id){if(!Number.isSafeInteger(id)||!this.nodes[id])fail('A scalar root is outside this closed norm graph.');return id;}
  q(n,d=1){const a=rational(n,d);return this.emit('rational',a.map(String));}
  value(id){const n=this.nodes[this.require(id)];return n.op==='rational'?n.args.map(BigInt):null;}
  isq(id){return this.nodes[this.require(id)].op==='rational';}
  fraction(id){const q=this.value(id);if(!q)fail('This norm scalar is not an exact rational.');return q;}
  pair(op,a,b){this.require(a);this.require(b);const qa=this.value(a),qb=this.value(b);
    if(qa&&qb){const z=op==='add'?qadd(qa,qb):qmul(qa,qb);return this.q(...z);}
    if(op==='add'){if(a===this.zero)return b;if(b===this.zero)return a;}
    else{if(a===this.zero||b===this.zero)return this.zero;if(a===this.one)return b;if(b===this.one)return a;}
    return this.emit(op,[a,b].sort((x,y)=>x-y));}
  add(...xs){return xs.reduce((a,b)=>this.pair('add',a,b),this.zero);}
  mul(...xs){return xs.reduce((a,b)=>this.pair('multiply',a,b),this.one);}
  pow(id,power){this.require(id);if(!Number.isSafeInteger(power))fail('A scalar power must be an exact finite integer.');
    if(power===0)return this.one;if(power===1)return id;const q=this.value(id);
    return q?this.q(...qpow(q,power)):this.emit('integer_power',[id,power]);}
  sqrt(id){this.require(id);if(id===this.zero||id===this.one)return id;return this.emit('sqrt_positive',[id]);}
  maximum(...xs){xs.forEach(x=>this.require(x));if(!xs.length)fail('A source norm maximum must retain its complete inputs.');
    const ids=[...new Set(xs)].sort((a,b)=>a-b);return ids.length===1?ids[0]:this.emit('maximum',ids);}
  select(call,path){return this.emit('source_norm_result',[call,copy(path)]);}
  freeCoordinates(id){this.require(id);return new Set();}
}

function metadata(request){
  const m=request.order,fresh=originalFreshMeanClassDerivativeDemand({order:m}),
    post=originalFreshMeanClassDerivativeDemand({order:fresh.requiredInitializedInputDefectOrder}),
    temporal=originalTemporalClassDerivativeDemand({order:post.requiredVelocityOrder,ibpOrder:0}),
    initial=originalInitialMeanResidualDemand({order:temporal.requiredResidualPairOrder}),
    pressure=originalPressureClassDerivativeDemand({order:initial.requiredPressureOrder,ibpOrder:0}),
    order=pressure.requiredPrimaryOrder,targetPoles=Array.from({length:order+2},(_,j)=>3+3*j),
    degree=originalPrimaryClassDegreeProgram({order,targetPoles,maxWork:request.maxWork}),
    affine=originalCommonYAffineClassRecipe({order,maxWork:request.maxWork}),
    commonY=Array.from({length:order+1},(_,j)=>{
      const prefix=Array.from({length:j+1},(_,i)=>{
        const leading=degree.primaryCovariance[i],remainder=degree.covarianceRemainder[i];
        return {power:Math.max(leading.power,remainder.power)+1+i,pole:Math.max(leading.pole,remainder.pole)};
      });
      return {order:j,power:Math.max(...prefix.map(r=>r.power)),pole:Math.max(...prefix.map(r=>r.pole)),
        epsilonExponent:'1',weight:'zeta',gaussian:'1',
        derivation:'Original full leading-plus-curl-square degree, its two-term reserve, both affine columns, and the complete through-order prefix.'};
    }),primaryPole=Math.max(...commonY.map(r=>r.pole),3+3*initial.requiredBackgroundClassOrder),
    postPole=2*primaryPole,
    stress=originalHigherStressTailRecipe({order:initial.requiredBackgroundClassOrder,maxWork:request.maxWork});
  if(!Number.isSafeInteger(postPole))fail('The complete quadratic pole exceeds its finite representation.','RESOURCE_LIMIT');
  return {order:m,fresh,post,temporal,initial,pressure,degree,affine,commonY,
    sourceDemand:{backgroundSlowOrder:pressure.requiredBackgroundSlowOrder,targetWeightedOrder:pressure.requiredTargetWeightedOrder,
      primaryOrder:order,commonYOrder:order,backgroundClassOrder:initial.requiredBackgroundClassOrder,
      pressureOrder:initial.requiredPressureOrder,initialResidualOrder:temporal.requiredResidualPairOrder,
      temporalOrder:post.requiredVelocityOrder,freshDefectOrder:fresh.requiredInitializedInputDefectOrder,
      fixedFiveOrder:fresh.requiredInitializedFiveMapOrder,finiteCoefficientPrefix:stress.tailStarts,
      fullWeightedStressDerivativeOrder:initial.requiredBackgroundClassOrder,
      requiredPrimaryRadialPole:primaryPole,requiredFreshRadialPole:postPole},
    fixedRadialPoleProof:'The first pressure uses the full pre-Haar covariance pole. The complete temporal fields inherit it. Fresh velocity products have at most twice that pole, so a separately generated radial operator absorbs the actual quadratic input. A norm index is changed, never the physical source operator.'};
}

function compile(request){
  const d=metadata(request),s=d.sourceDemand,G=new ClosedNormScalars(request.maxNodes),calls=[],
    call=(producer,input,dependencies=[],role='source-derived-class')=>{
      const id=calls.length;calls.push({id,producer,request:copy(input),dependencies:[...dependencies],role,
        actualProducerImported:true,callerCallableSupplied:false,derivativeBodiesMaterialized:false});return id;
    },
    target=call('target',{derivativeOrder:s.targetWeightedOrder},[],'same-private-family-leaf'),
    primary=call('primary',{order:s.primaryOrder},[target]),commonY=call('commonY',{},[primary]),
    background=call('background',{order:s.backgroundClassOrder},[primary]),
    baseRadial=call('radial',{order:s.pressureOrder,pole:s.requiredPrimaryRadialPole,ibpOrder:1},[],'original-fixed-FTC-operator-leaf'),
    fourier=call('fourier',{order:d.temporal.requiredFixedFourierOrder,inversePower:1},[],'original-fixed-FTC-operator-leaf'),
    freshRadial=call('radial',{order:s.freshDefectOrder,pole:s.requiredFreshRadialPole,ibpOrder:1},[],'original-fixed-FTC-operator-leaf'),
    five=call('five',{order:s.fixedFiveOrder},[],'original-fixed-FTC-operator-leaf'),
    pressure=call('pressure',{order:s.pressureOrder,ibpOrder:0},[commonY,baseRadial]),
    initial=call('initialResidual',{order:s.initialResidualOrder},[pressure,background]),
    temporal=call('temporal',{order:s.temporalOrder,ibpOrder:0},[initial,fourier,baseRadial]),
    fresh=call('fresh',{order:s.freshDefectOrder},[temporal,freshRadial]),
    initialized=call('initialized',{order:request.order},[fresh,five]),
    at=(id,...path)=>G.select(id,path),q=(n,den=1)=>G.q(n,den),
    norm=(constant,power,pole,epsilonExponent,weight='zeta')=>({constant,power,pole,epsilonExponent,weight,gaussian:'1'}),
    covarianceRows=d.commonY.map(r=>({order:r.order,fields:{fullCovariance:{...copy(r),constant:at(commonY,'bounds','rows',r.order,'fields','fullCovariance','constant')}}})),
    backgroundRows=Array.from({length:s.backgroundClassOrder+1},(_,j)=>({order:j,
      F:norm(at(background,'rows',j,'F','constant'),0,0,'0','1'),
      G:norm(at(background,'rows',j,'G','constant'),0,0,'0','1'),
      b:norm(at(background,'rows',j,'b','constant'),0,0,'1','1'),
      fullStress:norm(at(background,'rows',j,'fullStress','constant'),0,3+3*j,'1')})),
    B=at(baseRadial,'geometry','B'),coefficientBounds=Array.from({length:s.pressureOrder+2},(_,j)=>G.mul(q(radialFactorial(j+4)),G.pow(B,j+4)));

  const pressureProducts=(grRows,radial,pole,order)=>grRows.slice(0,order+1).map((row,j)=>{
    const f=row.gr,select=(...path)=>at(radial,...path),scaled=constant=>({...copy(f),constant,pole}),
      projection=select('pressureInput',j,'wholeHaarProjectionConstant'),rho=select('pressureInput',j,'rhoWeightedNorm'),
      centered=G.mul(select('pressureInput',j,'constant'),f.constant),
      raw=G.mul(q(3n**BigInt(j)),select('change','exponents',0,'throughOrder',j,'outputPrefactor'),
        select('change','exponents',0,'throughOrder',j,'outputComposition'),select('cutoff','rows',j+1,'bound'),
        select('weight','wholeIntegralConstant'),select('geometry','middleZetaInverse'),
        select('change','exponents',0,'throughOrder',j,'transformedSource')),
      cutoff=G.mul(raw,centered),rhoP=G.mul(q(2n**BigInt(j)),rho,projection,f.constant);
    return {order:j,actualGrInputNorm:copy(f),centeredSource:scaled(centered),rhoP:scaled(rhoP),
      pressure:scaled(G.mul(select('pressureRows',j,'pressureConstant'),f.constant)),cutoffA0:scaled(cutoff),
      fullRadialPressureDerivative:scaled(G.add(centered,cutoff)),radialPressureDefect:scaled(G.add(rhoP,cutoff)),
      rawCutoffOperator:raw,fullCutoffRemainderKept:true,positiveIBPGainApplied:false,allOrdersCutoffFlatnessClaimed:false};
  });
  const initialGr=Array.from({length:s.pressureOrder+1},(_,j)=>{
    const f=covarianceRows[j+1].fields.fullCovariance,bound=radialCovarianceForceMajorant(G,{order:j,radiusBase:B,
      directPowerDerivativeBounds:coefficientBounds,inputNorm:f.constant,maxWork:request.maxWork});
    return {order:j,gr:norm(bound.constant,f.power,s.requiredPrimaryRadialPole,'1-kappa_s'),bound};
  }),initialPressure=pressureProducts(initialGr,baseRadial,s.requiredPrimaryRadialPole,s.pressureOrder),
    initialResidualRows=Array.from({length:s.initialResidualOrder+1},(_,j)=>{
      const W=covarianceRows[j+1].fields.fullCovariance,p=initialPressure[j+1].pressure,stress=backgroundRows[j+1].fullStress,
        bound=initialMeanResidualMajorants(G,{order:j,radiusBase:B,directPowerDerivativeBounds:coefficientBounds,
          covarianceNorm:W.constant,stressNorm:stress.constant,pressureDerivativeNorm:p.constant,maxWork:request.maxWork}),
        power=Math.max(W.power,p.power,stress.power),pole=Math.max(W.pole,p.pole,stress.pole);
      return {order:j,bound,fields:Object.fromEntries(Object.entries(bound.fields).map(([name,f])=>
        [name,norm(f.constant,power,pole,'1-kappa_s')]))};
    }),desiredRows=Array.from({length:d.temporal.requiredDesiredVelocityOrder+1},(_,j)=>{
      const input=initialResidualRows[j+4],constant=at(fourier,'operators','temporal','rows',j,'constant'),
        bound=f=>({...copy(f),constant:G.mul(constant,f.constant),power:f.power+1});
      return {order:j,v:bound(input.fields.Etheta),gammaDesired:bound(input.fields.Ez),inputOrder:j+4};
    }),radialRows=Array.from({length:s.temporalOrder+2},(_,j)=>{
      const a=(...path)=>at(baseRadial,...path),raw=originalRawTemporalCutoffMajorant(G,{order:j,
        outputPrefactor:a('change','exponents',1,'throughOrder',j,'outputPrefactor'),
        outputComposition:a('change','exponents',1,'throughOrder',j,'outputComposition'),
        cutoffDerivative:a('cutoff','rows',j+1,'bound'),wholeIntegral:a('weight','wholeIntegralConstant'),
        middleZetaInverse:a('geometry','middleZetaInverse'),transformedSource:a('change','exponents',1,'throughOrder',j,'transformedSource')});
      return {order:j,e:1,primitiveConstant:a('rows',1,'orders',j,'primitiveConstant'),rawCutoffConstant:raw.constant,rawCutoffProof:raw};
    }),temporalProducts=composeOriginalTemporalClassRows(G,{order:s.temporalOrder,desiredRows,radialRows}),
    radius=at(freshRadial,'geometry','B'),fixed={radiusBase:radius,
      radialDerivativeBounds:Array.from({length:s.freshDefectOrder+2},(_,j)=>G.mul(q(radialFactorial(j+4)),G.pow(radius,j+4))),
      wholeHaarProjection:at(freshRadial,'pressureInput',0,'wholeHaarProjectionConstant'),
      projectionPole:s.requiredFreshRadialPole,maxWork:request.maxWork},
    bg=backgroundRows.slice(0,s.freshDefectOrder+2).map(r=>({order:r.order,b:copy(r.b),G:copy(r.G),
      V:{...copy(r.F),constant:G.mul(q(2n**BigInt(r.order)),radius,r.F.constant)}})),
    velocities=temporalProducts.rows.map(r=>({order:r.order,...Object.fromEntries(keys.map(k=>[k,copy(r.fields[k])]))})),
    W=covarianceRows.slice(0,s.freshDefectOrder+2).map(r=>({order:r.order,
      ...Object.fromEntries(covarianceKeys.map(k=>[k,copy(r.fields.fullCovariance)]))})),
    freshProducts=composeOriginalFreshMeanDefectRows(G,{order:s.freshDefectOrder,backgroundRows:bg,velocityRows:velocities,covarianceRows:W,...fixed}),
    postPressure=pressureProducts(freshProducts.rows,freshRadial,s.requiredFreshRadialPole,s.freshDefectOrder),
    operatorRows=Array.from({length:s.fixedFiveOrder+1},(_,j)=>({order:j,requiredTargetDerivativeOrder:j+1,sPolynomialPower:0,
      maximum:at(five,'byOrder',j,'maximum'),componentBounds:Object.fromEntries(['v','gamma','psi','betaOverEpsilon']
        .map(k=>[k,at(five,'byOrder',j,'componentBounds',k)]))})),
    fiveProducts=composeOriginalFiveMapClassRows(G,{order:s.fixedFiveOrder,defectRows:freshProducts.rows,operatorRows,maxWork:request.maxWork}),
    before=velocities.slice(0,request.order+3),increment=fiveProducts.rows.map(r=>({order:r.order,...copy(r.fields)})),
    updatedVelocityRows=before.map((r,j)=>({order:j,...Object.fromEntries(keys.map(k=>{
      const old=r[k],delta=increment[j][k];if(old.epsilonExponent!==delta.epsilonExponent)fail('The original temporal and five-map exponents must agree.');
      return [k,norm(G.add(old.constant,delta.constant),Math.max(old.power,delta.power),Math.max(old.pole,delta.pole),old.epsilonExponent)];
    }))})),
    fullUpdatedMean=composeOriginalFreshMeanDefectRows(G,{order:request.order,backgroundRows:bg,velocityRows:updatedVelocityRows,covarianceRows:W,...fixed}),
    remainder=composeOriginalFiveMomentRemainderRows(G,{order:request.order,backgroundRows:bg,previousRows:before,incrementRows:increment,...fixed}),
    updatedPressure=pressureProducts(fullUpdatedMean.rows,freshRadial,s.requiredFreshRadialPole,request.order),
    rows=Array.from({length:request.order+1},(_,j)=>({order:j,velocity:copy(updatedVelocityRows[j]),increment:copy(fiveProducts.rows[j].fields),
      fullGr:copy(fullUpdatedMean.rows[j].gr),fullPressure:copy(updatedPressure[j].pressure),
      freshDefects:copy(remainder.rows[j].defects),fullNonlinearRemainder:copy(remainder.rows[j])}));
  return {schema:'MathScope.N6.OriginalInitializedLazyNormProgram/1',request,sourceDemand:s,
    derivativeDemand:{fresh:d.fresh,post:d.post,temporal:d.temporal,initial:d.initial,pressure:d.pressure},
    degreeProgram:d.degree,affineProgram:d.affine,commonYMetadata:d.commonY,radialPoleProof:d.fixedRadialPoleProof,
    callGraph:{calls,entry:initialized,leaves:calls.filter(c=>c.dependencies.length===0).map(c=>c.id),
      sameSourceLeaf:target,fixedSourceLeaves:[baseRadial,fourier,freshRadial,five],
      exactFunctionReferencesRequired:true,producerStringsAreOnlyReadableLabels:true,
      noArbitraryNormOrProducerInput:true,sourceContinuationIsNotAFinitePrefixMutation:true},
    scalarProgram:{nodes:G.nodes,integerIdsAreExpressionReferences:true,allLeavesClosedProducerResults:true,
      scalarCompositionExecuted:true,sourceDerivativeBodyCallsExecuted:false},
    inputRows:{covarianceRows,backgroundRows},initialGr,initialPressure,initialResidualRows,
    temporalProducts,freshProducts,postPressure,fiveProducts,updatedVelocityRows,fullUpdatedMean,remainder,updatedPressure,rows,
    originalFiveRowAndSourceEndpointPremiseRequired:true,
    sourceOnlyConstantMeaning:'Each source_norm_result is a result of the retained imported source-only producer on the same mathematical source, with the displayed full finite derivative demand. It has no numerical value assigned by the caller.',
    scope:{closedImportedProducerComposition:true,allRequestedScalarProductsExecuted:true,
      fullTimeAndViscosityAndPressureMomentRetained:true,allThreeFreshTargetsAndFullFiveMapRetained:true,
      actualSourceIdentityAuthenticated:false,originalAllFiniteSourceRecipeAuthenticated:false,
      actualHighOrderSourceDerivativeBodiesMaterialized:false,actualFinitePrivateNormAttachmentExecuted:false,
      higherSourceContinuationRequired:true,allOrdersRadialCutoffFlatnessCertified:false,
      actualImprovedTangentialResidualClassCertified:false,allFiniteIterationClassesCertified:false,completeN6:false}};
}

/** Auditable structure only. The function fixes every producer and every
 * norm metadata recurrence. Even a byte-identical copy is not authority.
 */
export function originalInitializedNormProgramStructure(input={}){return compile(requested(input));}

/** A separate archived-source binder may retain these imported functions
 * in its OWN private seal. The returned identities carry no source token
 * and cannot authenticate a serialized record or a caller norm value.
 */
export function originalInitializedNormProgramProducerReferences(){return Object.freeze({...producers});}

/** The source capability has already authenticated the actual temporal,
 * fresh targets, fixed five solve, current defects and rebuilt pressure.
 * The private seal retains imported callable identities, not their names.
 */
export function attachOriginalInitializedLazyNormProgram(authority,input={}){
  assertOriginalInitializedNormAuthority(authority);const source=originalInitializedNormSource(authority),program=compile(requested(input));
  program.sourceBinding=copy({source:authority.source,actualRoots:authority.actualRoots});
  program.scope.actualSourceIdentityAuthenticated=true;program.scope.originalAllFiniteSourceRecipeAuthenticated=true;
  program.scope.finiteSelectedSourceDerivativeOrder=source.family.request.derivativeOrder;
  program.scope.finiteSelectedSourceCoefficientOrder=source.family.request.throughOrder;
  program.scope.unchangedBackgroundFlatResidualRetained=true;
  seals.set(program,{authority,mean:source.mean,current:source.current,family:source.family,G:source.G,
    target:source.targetNormProducer,functions:{...producers},record:canonicalStringify(program)});return program;
}

export function assertOriginalInitializedLazyNormProgram(program){
  const s=seals.get(program);if(!s||s.record!==canonicalStringify(program)||Object.keys(producers).some(k=>s.functions[k]!==producers[k]))
    fail('Use the unchanged private source-bound norm program; labels, copied graphs and source hashes cannot replace its authority.');
  assertOriginalInitializedNormAuthority(s.authority);const source=originalInitializedNormSource(s.authority);
  if(source.mean!==s.mean||source.current!==s.current||source.family!==s.family||source.G!==s.G||source.targetNormProducer!==s.target)
    fail('The original initialized source or its actual target norm producer changed.');return true;
}

/** Return the concrete continuation request before any costly source
 * producer is called. A finite source prefix is never promoted to a
 * higher generated prefix by changing an order label.
 */
export function originalInitializedNormMaterializationDemand(program){
  assertOriginalInitializedLazyNormProgram(program);const s=seals.get(program),f=s.family,d=program.sourceDemand,
    available={backgroundSlowOrder:f.source.backgroundNorms.request.derivativeOrder,
      fullWeightedStressDerivativeOrder:f.source.pressureStressSeminorms.request.derivativeOrder,
      finiteCoefficientPrefix:f.selector.rows.length},
    ready=available.backgroundSlowOrder>=d.backgroundSlowOrder&&available.fullWeightedStressDerivativeOrder>=d.fullWeightedStressDerivativeOrder&&
      available.finiteCoefficientPrefix>=d.finiteCoefficientPrefix;
  return {required:copy(d),available,ready,sourceContinuationRequired:!ready,
    sameMathematicalSourceRequired:true,newPhysicalSourceAllowed:false,
    lowerPrefixNormsSilentlyExtrapolated:false,derivativeGraphMaterializationExecuted:false};
}

/** Optional finite instantiation, using ONLY the sealed actual functions.
 * It deliberately refuses an insufficient source prefix before starting.
 * No public callback can inject a norm or swap the private current.
 */
export async function materializeOriginalInitializedLazyNormProgram(program,input={},context={}){
  assertOriginalInitializedLazyNormProgram(program);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['maxSourceNodes','maxWork'].includes(k)))
    fail('Only source representation budgets may be selected for this finite instantiation.','INVALID_INPUT');
  const maxSourceNodes=input.maxSourceNodes??4000000,maxWork=input.maxWork??program.request.maxWork;
  natural(maxSourceNodes,'Source node budget');natural(maxWork,'Source work budget');
  if(maxSourceNodes<5000||maxWork<1)fail('Positive complete source representation budgets are required.','RESOURCE_LIMIT');
  const demand=originalInitializedNormMaterializationDemand(program);
  if(!demand.ready)fail('Continue the same source recipe through background C'+demand.required.backgroundSlowOrder+
    ', weighted stress C'+demand.required.fullWeightedStressDerivativeOrder+' and coefficient prefix '+demand.required.finiteCoefficientPrefix+
    ' before materializing this norm program. The lower private prefix is unchanged.','RESOURCE_LIMIT');
  const s=seals.get(program),values=[],common={maxWork},fixed={maxNodes:Math.min(maxSourceNodes,300000),maxWork};
  for(const call of program.callGraph.calls){
    context.checkCancelled?.();const deps=call.dependencies.map(id=>values[id]),r={...call.request},fn=s.functions[call.producer];let value;
    if(call.producer==='target')value=s.target({...r,maxNodes:maxSourceNodes,maxJetRequests:maxWork},context);
    else if(call.producer==='primary')value=fn(s.current,deps[0],{...r,...common},context);
    else if(call.producer==='commonY')value=fn(deps[0],s.mean.temporal.pressure,common,context);
    else if(call.producer==='background')value=fn(deps[0],{...r,...common},context);
    else if(call.producer==='fourier')value=fn({...r,...common},context);
    else if(['radial','five'].includes(call.producer))value=fn({...r,...fixed},context);
    else if(call.producer==='pressure')value=fn(deps[0],deps[1],{...r,...common},context);
    else if(call.producer==='initialResidual')value=fn(deps[0],deps[1],{...r,...common},context);
    else if(call.producer==='temporal')value=fn(s.mean.temporal,deps[0],deps[1],deps[2],{...r,...common},context);
    else if(call.producer==='fresh')value=fn(s.mean,deps[0],deps[1],{...r,...common},context);
    else if(call.producer==='initialized')value=fn(s.mean,deps[0],deps[1],{...r,...common},context);
    else fail('A closed source call refers to an unsupported producer.');
    value=await value;assertions[call.producer](value);values.push(value);
    context.onProgress?.({stage:'original-initialized-lazy-norm-call-materialized',call:call.id,producer:call.producer});
  }
  const result={schema:'MathScope.N6.OriginalInitializedFiniteNormInstantiation/1',program,
    initialized:values[program.callGraph.entry],calls:program.callGraph.calls.map(c=>({id:c.id,producer:c.producer,executed:true})),
    scope:{actualFinitePrivateNormAttachmentExecuted:true,actualFiniteDerivativeOrder:program.request.order,
      unrequestedHigherDerivativeBodiesDeclaredExecuted:false,completeN6:false}};
  materializedSeals.set(result,{program,initialized:result.initialized,calls:canonicalStringify(result.calls),scope:canonicalStringify(result.scope)});
  return result;
}

export function assertOriginalInitializedFiniteNormInstantiation(p){
  const s=materializedSeals.get(p);if(!s||s.program!==p.program||s.initialized!==p.initialized||
    s.calls!==canonicalStringify(p.calls)||s.scope!==canonicalStringify(p.scope))fail('Use the unchanged private finite source-norm instantiation.');
  assertOriginalInitializedLazyNormProgram(p.program);assertGlobalInitializedMeanInputClasses(p.initialized);return true;
}

export async function originalInitializedLazyNormProgramCertificate(program){
  assertOriginalInitializedLazyNormProgram(program);const text=canonicalStringify(program);
  return {schema:'MathScope.N6.OriginalInitializedLazyNormProgramCertificate/1',program:copy(program),
    graph:{sha256:await sha256(text),canonicalBytes:new TextEncoder().encode(text).length,
      scalarNodeCount:program.scalarProgram.nodes.length,sourceProducerCallCount:program.callGraph.calls.length},
    sourceBinding:copy(program.sourceBinding),scope:copy(program.scope),
    serializedCertificateIsNotLiveSourceAuthority:true,integerRootsAreExpressionsNotNumericalValues:true};
}
