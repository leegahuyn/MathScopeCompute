/** Fresh P/J and subsequent five-map classes for the same actual source.
 *
 * The initial temporal class, complete private temporal-before-five state,
 * and original fixed radial/five-profile operators are mandatory. No norm,
 * changed current, sampled target or caller completion flag is accepted.
 */
import {assertGlobalInitializedMean,globalInitializedMeanCertificate} from './source-global-initial-mean.mjs';
import {assertGlobalTemporalClass,globalTemporalClassCertificate} from './source-global-temporal-class-majorants.mjs';
import {assertOriginalRadialClassMajorants,originalRadialClassMajorantCertificate}
  from './source-radial-class-majorants.mjs';
import {assertOriginalMeanMapOperatorSeminorms,originalMeanMapOperatorCertificate}
  from './source-fixed-mean-majorants.mjs';
import {attachInitializedMeanOperatorMajorants,assertInitializedMeanOperatorMajorants}
  from './source-initialized-mean-majorants.mjs';
import {copyClosedOriginalSourceConstants} from './source-pressure-class-kernel.mjs';
import {originalFreshMeanClassDerivativeDemand,composeOriginalFreshMeanDefectRows,
  composeOriginalFiveMomentRemainderRows,composeOriginalFiveMapClassRows} from './source-fresh-mean-class-kernel.mjs';
import {radialFactorial} from './source-radial-class-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const postSeals=new WeakMap(),initialSeals=new WeakMap(),copy=x=>structuredClone(x),CHUNK=4096,
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  keys=['beta','v','gamma'],covKeys=['rr','rtheta','rz','thetatheta','thetaz','zz'],
  request=input=>{
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork'].includes(k)))
      fail('Choose a finite output order and work budget; all actual fields and source norms come from private parents.','INVALID_INPUT');
    const r={order:input.order??0,maxWork:input.maxWork??200000};
    originalFreshMeanClassDerivativeDemand({order:r.order});
    if(!Number.isSafeInteger(r.maxWork)||r.maxWork<1||BigInt(r.order+6)**2n>BigInt(r.maxWork))
      fail('The complete actual mean norm request exceeds its finite work budget.','RESOURCE_LIMIT');
    return r;
  },
  record=p=>({schema:p.schema,request:p.request,demand:p.demand,source:p.source,domain:p.domain,
    sourceBinding:p.sourceBinding,fixed:p.fixed,inputRows:p.inputRows,productProgram:p.productProgram,
    pressureRows:p.pressureRows,rows:p.rows,checks:p.checks,scope:p.scope}),
  initialRecord=p=>({schema:p.schema,request:p.request,demand:p.demand,source:p.source,domain:p.domain,
    sourceBinding:p.sourceBinding,fixedMap:p.fixedMap,fiveProgram:p.fiveProgram,updatedVelocityRows:p.updatedVelocityRows,
    fullMeanProgram:p.fullMeanProgram,remainderProgram:p.remainderProgram,pressureRows:p.pressureRows,rows:p.rows,
    checks:p.checks,scope:p.scope});

/** A closed producer description for the same-source all-finite-order
 * family binder. Finite row materialization is available below, but is
 * not an assertion that every integer derivative table was executed.
 */
export function originalFreshMeanClassCompositionRecipe(){
  return {schema:'MathScope.N6.OriginalFreshMeanClosedClassRecipe/1',
    producers:{demand:'source-fresh-mean-class-kernel.mjs:originalFreshMeanClassDerivativeDemand',
      fullGrAndDefects:'source-fresh-mean-class-kernel.mjs:composeOriginalFreshMeanDefectRows',
      fixedFive:'source-fresh-mean-class-kernel.mjs:composeOriginalFiveMapClassRows',
      newNonlinearDefects:'source-fresh-mean-class-kernel.mjs:composeOriginalFiveMomentRemainderRows',
      radial:'source-radial-class-majorants.mjs:prepareOriginalRadialClassMajorants',
      fixedFiveConstants:'source-fixed-mean-majorants.mjs:prepareOriginalMeanMapOperatorSeminorms',
      finitePostTemporalAttachment:'source-global-fresh-mean-class-majorants.mjs:attachGlobalPostTemporalDefectClass',
      finiteInitializedAttachment:'source-global-fresh-mean-class-majorants.mjs:attachGlobalInitializedMeanInputClasses'},
    sourceRelations:['same private complete temporal-before-five state','same complete temporal velocity and original b,V,G',
      'same full pre-Haar six-component covariance','fresh P/J from the complete post-temporal g_r and fluxes',
      'fixed original five-profile linear map applied to those exact fresh P/J','full pressure reconstructed after both mean updates',
      'actual checked five rows, incompressible potential and full nonlinear moment differences'],
    derivativeRecurrence:{freshGr:'m+2 mean velocity; m+1 background and full covariance',
      freshDefects:'fixed normalized Haar and whole radial integral preserve m',
      fiveVelocity:'fixed operator at m with three fresh target norms through m+1',
      initializedDefects:'five velocity through m+2, fresh targets through m+3, preceding velocity through m+5'},
    exactInitialExponents:{kappa_s:'1/100000',temporalTangential:'1-kappa_s',temporalRadial:'2-kappa_s',
      freshGr:'1-kappa_s',freshP_J:'1-kappa_s',newFiveTangential:'1-kappa_s',newFiveRadial:'2-kappa_s',
      fullMeanPressure:'1-kappa_s',fiveNonlinearRemainder:'2-2*kappa_s',freshNewDefects:'2-2*kappa_s'},
    exactLowerBounds:{cumulativeTangentialMargin:'9999/100000',cumulativeRadialMargin:'9999/100000',
      newDefectsAboveC0Star:'39999/50000'},
    allOrderSemantics:'At each requested finite m, the displayed finite Leibniz convolutions, complete fixed operator seminorm generators and whole-source integral bounds form the source-only constant. No current supremum is replaced by a caller value.',
    radialFlatness:'A0 is retained. Each requested positive flatness power additionally uses the finite original radial IBP derivative demand on the same complete source.',
    supportAndEndpointPremise:'The source family binder must authenticate the actual common flat support and all original integral endpoints for every generator call.',
    actualSourceClassAuthoritySupplied:false,unmaterializedDerivativeRowsDeclaredExecuted:false,
    improvedTangentialResidualAndNonzeroAngularClassesSeparate:true,completeN6:false};
}

function snapshot(G,start){
  const count=G.nodes.length;
  return {start,count,source:canonicalStringify(G.source),definitions:G.captureFunctionDefinitions(),
    chunks:Array.from({length:Math.ceil((count-start)/CHUNK)},(_,j)=>canonicalStringify(G.nodes.slice(start+j*CHUNK,Math.min(count,start+(j+1)*CHUNK))))};
}
function unchanged(G,s){
  return G.nodes.length>=s.count&&canonicalStringify(G.source)===s.source&&G.functionDefinitionsUnchanged(s.definitions)&&
    s.chunks.every((text,j)=>text===canonicalStringify(G.nodes.slice(s.start+j*CHUNK,Math.min(s.count,s.start+(j+1)*CHUNK))));
}

function copiedConstants(from,to,roots,maxWork,name){
  const c=copyClosedOriginalSourceConstants(from,to,[...new Set(roots)],{maxWork,name}),
    at=id=>{const root=c.mapping.get(id);if(root===undefined)fail('Every original operator factor must be retained in the norm graph.');return root;};
  return {at,record:{roots:c.roots,identities:c.identities,work:c.work,
    parameterExpressionSHA256:c.parameterExpressionSHA256,allCopiedRootsClosed:c.allCopiedRootsClosed,
    allDefiningIntegrandsAndEndpointsRetained:c.allDefiningIntegrandsAndEndpointsRetained}};
}

/** Pressure is rebuilt from the complete NEW g_r and P. These rows use
 * the actual fixed T0 and rho norms; even the unimproved A0 is retained.
 */
function pressureProducts(G,grRows,radial,copied,order){
  const at=copied.at,q=(n,d=1)=>G.q(n,d);
  return grRows.slice(0,order+1).map((row,j)=>{
    const f=row.gr,ri=radial.pressureInput[j],op=radial.pressureRows[j],change=radial.change.exponents[0].throughOrder[j],
      withNorm=constant=>({...copy(f),constant,pole:radial.request.pole}),
      centered=G.mul(at(ri.constant),f.constant),
      rawOperator=G.mul(q(3n**BigInt(j)),at(change.outputPrefactor),at(change.outputComposition),
        at(radial.cutoff.rows[j+1].bound),at(radial.weight.wholeIntegralConstant),
        at(radial.geometry.middleZetaInverse),at(change.transformedSource)),
      A0=G.mul(rawOperator,centered),rhoP=G.mul(q(2n**BigInt(j)),at(ri.rhoWeightedNorm),
        at(ri.wholeHaarProjectionConstant),f.constant);
    return {order:j,actualGrInputNorm:copy(f),P:copy(row.defects.P),
      rhoP:withNorm(rhoP),centeredSource:withNorm(centered),
      pressure:withNorm(G.mul(at(op.pressureConstant),f.constant)),cutoffA0:withNorm(A0),
      fullRadialPressureDerivative:withNorm(G.add(centered,A0)),radialPressureDefect:withNorm(G.add(rhoP,A0)),
      rawCutoffOperator:rawOperator,
      exactIdentity:'D_r p_m=(g_r-rho*P)-A0, so D_r p_m-g_r=-rho*P-A0.',
      pressureAfterActualUpdate:true,fullCutoffRemainderKept:true,
      positiveIBPGainApplied:false,allOrdersCutoffFlatnessClaimed:false};
  });
}

function fixedRadialRoots(radial,order){
  return [radial.geometry.B,radial.weight.wholeIntegralConstant,radial.geometry.middleZetaInverse,
    ...radial.pressureInput.slice(0,order+1).flatMap(r=>[r.wholeHaarProjectionConstant,r.rhoWeightedNorm,r.constant]),
    ...radial.pressureRows.slice(0,order+1).map(r=>r.pressureConstant),
    ...radial.change.exponents[0].throughOrder.slice(0,order+1).flatMap(r=>[r.outputPrefactor,r.outputComposition,r.transformedSource]),
    ...radial.cutoff.rows.slice(0,order+2).map(r=>r.bound)];
}

export function attachGlobalPostTemporalDefectClass(mean,temporalClass,radial,input={},context={}){
  assertGlobalInitializedMean(mean);assertGlobalTemporalClass(temporalClass);assertOriginalRadialClassMajorants(radial);
  const r=request(input),m=r.order,demand=originalFreshMeanClassDerivativeDemand({order:m}),
    initial=temporalClass.initialResidualClass,background=initial.background,commonY=initial.pressureClass.commonY,
    current=mean.temporal.pressure.current,G=temporalClass.G,PG=mean.G,pressure=mean.temporal.pressure,
    stage=mean.stages.temporal,{R}=pressure.geometry;
  if(mean.temporal!==temporalClass.temporal||mean.G!==temporalClass.temporal.G||temporalClass.initialResidualClass.pressure!==pressure||
    background.G!==G||commonY.G!==G||background.current!==current||commonY.primary.current!==current)
    fail('Use the complete actual temporal-before-five state and every norm from its same private source family.');
  if(temporalClass.request.order<demand.requiredVelocityOrder||background.request.order<demand.requiredBackgroundOrder||
    commonY.scope.actualFiniteDerivativeOrder<demand.requiredCovarianceOrder||radial.request.order<m||
    radial.pressureRows.length<m+1||radial.pressureInput.length<m+1||radial.cutoff.rows.length<m+2)
    fail('Generate actual temporal velocity C'+(m+2)+', background/common-Y C'+(m+1)+
      ' and fixed radial output C'+m+' before the fresh P/J attachment.','RESOURCE_LIMIT');
  if([radial.source,temporalClass.source].some(s=>s.paperSHA256!==current.source.paperSHA256||
    s.parameterExpressionSHA256!==current.source.parameterExpressionSHA256))
    fail('The same original paper and exact parameter graph must define every source operator.');
  const start=G.nodes.length,sourceStart=PG.nodes.length,copied=copiedConstants(radial.G,G,fixedRadialRoots(radial,m),r.maxWork,'actual_post_temporal_norm'),
    B=copied.at(radial.geometry.B),q=(n,d=1)=>G.q(n,d),
    backgroundRows=Array.from({length:m+2},(_,j)=>({order:j,b:copy(background.rows[j].b),G:copy(background.rows[j].G),
      V:{...copy(background.rows[j].F),constant:G.mul(q(2n**BigInt(j)),B,background.rows[j].F.constant),
        originalVIsRTimesF:true,completeRadiusProductRule:true}})),
    velocityRows=Array.from({length:m+3},(_,j)=>({order:j,...Object.fromEntries(keys.map(k=>[k,copy(temporalClass.rows[j].fields[k])]))})),
    covarianceRows=Array.from({length:m+2},(_,j)=>({order:j,
      ...Object.fromEntries(covKeys.map(k=>[k,copy(commonY.bounds.rows[j].fields.fullCovariance)]))})),
    radialDerivativeBounds=Array.from({length:m+2},(_,j)=>G.mul(q(radialFactorial(j+4)),G.pow(B,j+4))),
    fixed={radiusBase:B,radialDerivativeBounds,wholeHaarProjection:copied.at(radial.pressureInput[0].wholeHaarProjectionConstant),
      projectionPole:radial.request.pole,maxWork:r.maxWork,constantCopy:copied.record,
      coefficientProof:'For every finite j, factorial(j+4)*B^(j+4) bounds all fixed d_r*R^(d_r-1) derivatives through j on 1/B<=R<=B, 1<d_r<4. The same original M supplies only epsilon^(-kappa_s).',
      originalCiUpper:copy(temporalClass.sourceBinding.ciUpper),
      originalRadialScaleUpper:copy(initial.pressureClass.sourceBinding.phase)},
    productProgram=composeOriginalFreshMeanDefectRows(G,{order:m,backgroundRows,velocityRows,covarianceRows,
      radiusBase:B,radialDerivativeBounds,wholeHaarProjection:fixed.wholeHaarProjection,projectionPole:fixed.projectionPole,maxWork:r.maxWork}),
    rows=productProgram.rows,pressureRows=pressureProducts(G,rows,radial,copied,m),
    sourceBinding={graphNamespace:'initializedMean.G',actualVelocity:copy(stage.velocity),actualBackground:copy(stage.mean.background),
      actualCompleteCovariance:copy(stage.mean.fullAngularCovariance),actualFullMeanEquations:copy(stage.mean.raw),
      actualGr:stage.mean.gr,actualHaarGr:stage.mean.haarGr,
      actualFreshDefects:{P:stage.mean.P,Jtheta:stage.mean.Jtheta,Jz:stage.mean.Jz},
      actualPressure:copy(stage.pressure),
      actualFullT1Velocity:copy(temporalClass.sourceBinding.actualRoots),
      wholeSourceIntegralConvention:'The complete normalized two-torus Haar integral is taken only for P/J, over the same original radial envelope; both source endpoints and all flat joins remain in the private actual current.',
      noOldPreTemporalTargetsReused:true},
    checks=[
      {id:'same-actual-private-temporal-stage-and-source-norm-family',pass:mean.temporal===temporalClass.temporal&&current===background.current&&current===commonY.primary.current},
      {id:'every-complete-actual-temporal-velocity-component',pass:keys.every(k=>stage.velocity[k]===mean.temporal.potential.velocity[k]&&
        stage.velocity[k]===temporalClass.sourceBinding.actualRoots[k])},
      {id:'complete-original-b-V-G-and-all-six-covariance-inputs',pass:stage.mean.background.b===current.band.fields.b&&
        stage.mean.background.V===PG.mul(R,current.band.fields.F)&&stage.mean.background.G===current.band.fields.G&&
        same(stage.mean.fullAngularCovariance,pressure.covariance.fullAngularMean)&&same(commonY.roots.fullCovariance,pressure.covariance.fullAngularMean)},
      {id:'literal-complete-current-defects-after-pressure-rebuild',pass:['P','Jtheta','Jz'].every(k=>mean.bumps.actualInputDefects[k]===stage.mean[k])&&
        stage.checks.every(c=>c.pass)&&stage.mean.allOldAndQuadraticMeanTermsRetained},
      {id:'pressure-is-from-this-complete-new-gr-and-P',pass:stage.pressure.source===PG.sub(stage.mean.gr,PG.mul(stage.pressure.rho,stage.mean.P))&&
        stage.pressure.rho===pressure.pressure.rho&&stage.pressure.chi===pressure.pressure.chi&&!stage.pressure.cutoffRemainderDeclaredZero},
      {id:'original-fixed-fast-coefficients-and-complete-source-operator',pass:fixed.originalCiUpper.identity.pass&&fixed.originalRadialScaleUpper.identity.pass&&
        radial.phase.drRangeProof.strict&&same(radial.phase.drRangeProof.range,['1','4'])&&copied.record.allCopiedRootsClosed},
      {id:'full-source-class-terms-and-actual-projection-pole',pass:rows.every(row=>row.allFiveGrGroupsRetained&&!row.pressureMomentDiscarded)&&
        radial.request.pole>=productProgram.requiredProjectionPole},
      {id:'all-new-source-norm-roots-closed',pass:rows.every(row=>[row.gr,...Object.values(row.defects)].every(f=>G.freeCoordinates(f.constant).size===0))&&
        pressureRows.every(row=>G.freeCoordinates(row.pressure.constant).size===0)},
      {id:'full-radial-A0-and-unchanged-background-residual-retained',pass:pressureRows.every(row=>row.fullCutoffRemainderKept&&!row.allOrdersCutoffFlatnessClaimed)&&
        temporalClass.scope.unchangedBackgroundFlatResidualRetained}
    ];
  if(checks.some(c=>!c.pass))fail('The actual post-temporal P/J class attachment failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const result={schema:'MathScope.N6.ActualPostTemporalDefectClasses/1',G,PG,mean,temporalClass,radial,current,request:r,demand,
    source:{paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,
      sourcePages:[89,90,91,95,96,106,107],equations:['8.3','8.12','8.15','8.20','9.11'],samePrivateTemporalAndNewFiveTargets:true},
    domain:copy(temporalClass.domain),sourceBinding,fixed,inputRows:{backgroundRows,velocityRows,covarianceRows},
    productProgram,pressureRows,rows,checks,
    scope:{actualFreshPostTemporalFullGrClassCertified:true,actualFreshPostTemporalPJClassesCertified:true,
      actualNewFullShiftedPressureNormsConstructed:true,actualUnimprovedA0NormsConstructed:true,
      actualFiniteDerivativeOrder:m,allFiniteOrdersBySameOriginalNormGenerator:true,allIntegerDerivativeGraphsLiterallyExecuted:false,
      actualFiveMapInputClassesApplied:false,actualAllOrdersRadialCutoffFlatnessCertified:false,
      unchangedBackgroundFlatResidualRetained:true,actualCompleteInitialN6TupleClassCertified:false,
      allFiniteIterationStagesClassCertified:false,completeN6:false,newLeanKernelProof:false}};
  postSeals.set(result,{G,PG,mean,temporalClass,radial,current,norm:snapshot(G,start),source:snapshot(PG,sourceStart),record:canonicalStringify(record(result)),copied});
  context.onProgress?.({stage:'actual-new-post-temporal-P-J-and-full-pressure-classes',order:m,normNodes:G.nodes.length});
  return result;
}

export function assertGlobalPostTemporalDefectClass(p){
  const s=postSeals.get(p);
  if(!s||s.G!==p.G||s.PG!==p.PG||s.mean!==p.mean||s.temporalClass!==p.temporalClass||s.radial!==p.radial||s.current!==p.current||
    s.record!==canonicalStringify(record(p))||!unchanged(p.G,s.norm)||!unchanged(p.PG,s.source))fail('Use the unchanged private actual post-temporal norm composition.');
  assertGlobalInitializedMean(p.mean);assertGlobalTemporalClass(p.temporalClass);assertOriginalRadialClassMajorants(p.radial);return true;
}

export function attachGlobalInitializedMeanInputClasses(mean,post,fiveOperator,input={},context={}){
  assertGlobalInitializedMean(mean);assertGlobalPostTemporalDefectClass(post);assertOriginalMeanMapOperatorSeminorms(fiveOperator);
  const r=request(input),m=r.order,demand=originalFreshMeanClassDerivativeDemand({order:m}),G=post.G,PG=mean.G;
  if(post.mean!==mean||post.PG!==PG||post.current!==mean.temporal.pressure.current)
    fail('The actual five-map state and its fresh input norm program must be the same private source.');
  if(post.request.order<demand.requiredInitializedInputDefectOrder||fiveOperator.request.order<demand.requiredInitializedFiveMapOrder)
    fail('Generate the actual fresh P/J through '+(m+3)+' and the same fixed five-map through '+(m+2)+
      ' before estimating the full initialized nonlinear current defects.','RESOURCE_LIMIT');
  if(fiveOperator.source.paperSHA256!==post.source.paperSHA256||fiveOperator.source.parameterExpressionSHA256!==post.source.parameterExpressionSHA256)
    fail('The actual initialized source and fixed five-profile norms must use the same paper and exact parameters.');
  const start=G.nodes.length,sourceStart=PG.nodes.length,operatorAttachment=attachInitializedMeanOperatorMajorants(mean,fiveOperator),
    fixedCopy=copiedConstants(fiveOperator.G,G,fiveOperator.byOrder.slice(0,m+3).flatMap(row=>[row.maximum,...Object.values(row.componentBounds)]),
      r.maxWork,'actual_new_five_target_norm'),
    operatorRows=fiveOperator.byOrder.slice(0,m+3).map(row=>({...copy(row),maximum:fixedCopy.at(row.maximum),graphNamespace:'norm',
      componentBounds:Object.fromEntries(Object.entries(row.componentBounds).map(([k,id])=>[k,fixedCopy.at(id)]))})),
    fiveProgram=composeOriginalFiveMapClassRows(G,{order:m+2,defectRows:post.rows,operatorRows,maxWork:r.maxWork}),
    previousRows=post.inputRows.velocityRows.slice(0,m+3),
    incrementRows=fiveProgram.rows.map(row=>({order:row.order,...copy(row.fields)})),
    updatedVelocityRows=Array.from({length:m+3},(_,j)=>({order:j,...Object.fromEntries(keys.map(k=>{
      const before=previousRows[j][k],delta=incrementRows[j][k];
      if(before.epsilonExponent!==delta.epsilonExponent||before.weight!=='zeta'||delta.weight!=='zeta')
        fail('Keep the original initial mean exponent and weight for each complete old and new velocity.');
      return [k,{constant:G.add(before.constant,delta.constant),power:Math.max(before.power,delta.power),
        pole:Math.max(before.pole,delta.pole),epsilonExponent:before.epsilonExponent,
        epsilonExponentExact:delta.epsilonExponentExact,weight:'zeta',gaussian:'1',
        originalTemporalAndFiveMapBothIncluded:true}];
    }))})),fixedInput={radiusBase:post.fixed.radiusBase,radialDerivativeBounds:post.fixed.radialDerivativeBounds,
      wholeHaarProjection:post.fixed.wholeHaarProjection,projectionPole:post.fixed.projectionPole,maxWork:r.maxWork},
    fullMeanProgram=composeOriginalFreshMeanDefectRows(G,{order:m,backgroundRows:post.inputRows.backgroundRows,
      velocityRows:updatedVelocityRows,covarianceRows:post.inputRows.covarianceRows,...fixedInput}),
    remainderProgram=composeOriginalFiveMomentRemainderRows(G,{order:m,backgroundRows:post.inputRows.backgroundRows,
      previousRows,incrementRows,...fixedInput}),
    pressureRows=pressureProducts(G,fullMeanProgram.rows,post.radial,postSeals.get(post).copied,m),
    rows=Array.from({length:m+1},(_,j)=>({order:j,velocity:copy(updatedVelocityRows[j]),increment:copy(fiveProgram.rows[j].fields),
      fullGr:copy(fullMeanProgram.rows[j].gr),fullPressure:copy(pressureRows[j].pressure),
      actualThreeDefects:copy(remainderProgram.rows[j].defects),
      fullNonlinearRemainder:copy(remainderProgram.rows[j]),
      exactNewDefectsUseCheckedFiveRowCancellation:true})),
    updatedVNode=PG.nodes[mean.stages.moments.velocity.v],oldV=mean.stages.temporal.velocity.v,
    actualVDelta=updatedVNode?.op==='add'&&updatedVNode.args.includes(oldV)?updatedVNode.args.find(id=>id!==oldV):null,
    actualVDeltaNode=PG.nodes[actualVDelta],actualVDefinition=actualVDeltaNode?.op==='actual_expression_partial'?
      PG.expressionSystems[actualVDeltaNode.args[0]]:null,
    expectedFullVBody=PG.add(...mean.bumps.coefficients.angular.map((coefficient,j)=>PG.mul(coefficient,mean.bumps.copies[j].inQ))),
    sourceBinding={graphNamespace:'initializedMean.G',actualFreshInputDefects:copy(mean.bumps.actualInputDefects),
      actualFiveCoefficients:copy(mean.bumps.coefficients),actualFullFivePotential:copy(mean.potential),
      actualUpdatedVelocity:copy(mean.stages.moments.velocity),actualVDelta,expectedFullVBody,
      actualNewPressure:copy(mean.stages.moments.pressure),
      actualFullNonlinearRemainders:copy(mean.nonlinear),
      fixedSourceOperatorAttachment:{...operatorAttachment,G:null,mean:null,operator:null},
      actualConservation:copy(mean.conservation),
      completeDefectIdentity:'Integrating the private checked complete difference equations and the five original moment rows identifies the freshly recomputed actual P/J with every retained nonlinear remainder integral. Integral linearity and Fubini apply to the original smooth compact fields.'},
    checks=[
      {id:'actual-fixed-five-profile-map-bound-to-these-new-targets',pass:operatorAttachment.checks.every(c=>c.pass)&&
        ['P','Jtheta','Jz'].every(k=>mean.bumps.actualInputDefects[k]===post.sourceBinding.actualFreshDefects[k])},
      {id:'both-actual-zero-conservation-rows-and-every-nonlinear-difference',pass:mean.bumps.exactRows.slice(0,2).every(row=>row.target===PG.zero)&&
        mean.nonlinear.expansionChecks.every(c=>c.pass)&&mean.potential.checks.every(c=>c.pass)&&mean.stages.moments.checks.every(c=>c.pass)},
      {id:'actual-full-temporal-plus-five-velocity-kept',pass:actualVDefinition?.body===expectedFullVBody&&
        same(actualVDeltaNode.args[1],actualVDefinition.parameters)&&actualVDeltaNode.args[2].every(n=>n===0)&&
        mean.stages.moments.velocity.v===PG.add(oldV,actualVDelta)&&
        mean.stages.moments.velocity.beta===PG.add(mean.stages.temporal.velocity.beta,mean.potential.deltaBeta)&&
        mean.stages.moments.velocity.gamma===PG.add(mean.stages.temporal.velocity.gamma,mean.potential.gammaDesired)},
      {id:'all-source-target-derivatives-and-full-radial-epsilon-gain',pass:fiveProgram.rows.length===m+3&&fiveProgram.rows.every((row,j)=>
        row.inputOrder===j+1&&row.radialExtraEpsilonRetained&&row.allThreeFreshInputNorms.length===3)},
      {id:'actual-updated-pressure-is-complete-and-latest',pass:mean.stages.moments.pressure.source===PG.sub(mean.stages.moments.mean.gr,
        PG.mul(mean.stages.moments.pressure.rho,mean.stages.moments.mean.P))&&!mean.stages.moments.pressure.cutoffRemainderDeclaredZero},
      {id:'actual-fresh-defects-use-all-nonlinear-and-pressure-moment-terms',pass:remainderProgram.rows.every(row=>
        row.noNewNonlinearDefectDeclaredZero&&row.exactCurrentDefectsEqualTheseRemaindersRequiresActualFiveRows)&&
        mean.nonlinear.remaindersDeclaredZero===false&&rows.every(row=>Object.keys(row.actualThreeDefects).length===3)},
      {id:'same-source-compact-operator-constants-complete',pass:fixedCopy.record.allCopiedRootsClosed&&fixedCopy.record.allDefiningIntegrandsAndEndpointsRetained},
      {id:'all-resulting-actual-norm-roots-closed',pass:rows.every(row=>[...Object.values(row.actualThreeDefects),row.fullGr,row.fullPressure,
        ...keys.map(k=>row.velocity[k])].every(f=>G.freeCoordinates(f.constant).size===0))}
    ];
  if(checks.some(c=>!c.pass))fail('The actual initialized fresh-target/five-map class attachment failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const result={schema:'MathScope.N6.ActualInitializedMeanInputClasses/1',G,PG,mean,post,fiveOperator,operatorAttachment,
    request:r,demand,source:{paperSHA256:post.source.paperSHA256,parameterExpressionSHA256:post.source.parameterExpressionSHA256,
      sourcePages:[97,98,99,106,107],equations:['8.25','8.26','8.27','9.9','9.10','9.11'],samePrivateFreshCurrentTargets:true},
    domain:copy(post.domain),sourceBinding,fixedMap:{operatorRows,constantCopy:fixedCopy.record},fiveProgram,
    updatedVelocityRows,fullMeanProgram,remainderProgram,pressureRows,rows,checks,
    scope:{actualFreshPostTemporalPJClassesApplied:true,actualFixedFiveProfileInputClassesApplied:true,
      actualFullInitializedMeanVelocityClassesCertified:true,actualLatestFullPressureNormsConstructed:true,
      actualInitializedNonlinearThreeDefectClassesCertified:true,actualFiniteDerivativeOrder:m,
      allFiniteOrdersBySameOriginalNormGenerator:true,allIntegerDerivativeGraphsLiterallyExecuted:false,
      actualAllOrdersRadialCutoffFlatnessCertified:false,actualImprovedTangentialResidualClassesCertified:false,
      actualNonzeroAngularResidualClassCertified:false,unchangedBackgroundFlatResidualRetained:true,
      actualCompleteInitialN6TupleClassCertified:false,allFiniteIterationStagesClassCertified:false,
      completeN6:false,newLeanKernelProof:false}};
  initialSeals.set(result,{G,PG,mean,post,fiveOperator,operatorAttachment,norm:snapshot(G,start),source:snapshot(PG,sourceStart),record:canonicalStringify(initialRecord(result))});
  context.onProgress?.({stage:'actual-fresh-targets-five-map-nonlinear-defect-and-pressure-classes',order:m,normNodes:G.nodes.length});
  return result;
}

export function assertGlobalInitializedMeanInputClasses(p){
  const s=initialSeals.get(p);
  if(!s||s.G!==p.G||s.PG!==p.PG||s.mean!==p.mean||s.post!==p.post||s.fiveOperator!==p.fiveOperator||s.operatorAttachment!==p.operatorAttachment||
    s.record!==canonicalStringify(initialRecord(p))||!unchanged(p.G,s.norm)||!unchanged(p.PG,s.source))fail('Use the unchanged private actual fresh-target/five-map norm composition.');
  assertGlobalPostTemporalDefectClass(p.post);assertGlobalInitializedMean(p.mean);
  assertOriginalMeanMapOperatorSeminorms(p.fiveOperator);assertInitializedMeanOperatorMajorants(p.operatorAttachment);return true;
}

export async function globalPostTemporalDefectClassCertificate(p){
  assertGlobalPostTemporalDefectClass(p);const s=postSeals.get(p),temporal=await globalTemporalClassCertificate(p.temporalClass),
    mean=await globalInitializedMeanCertificate(p.mean),radial=await originalRadialClassMajorantCertificate(p.radial),
    program={schema:'MathScope.N6.ActualPostTemporalDefectClassProgram/1',record:record(p),
      parentGraphs:{temporal:temporal.graph,mean:mean.graph,radial:radial.graph},
      norm:{start:temporal.graph.normNodeCount,nodes:p.G.nodes.slice(temporal.graph.normNodeCount,s.norm.count),definitions:s.norm.definitions},
      actualSource:{start:mean.graph.nodeCount,nodes:p.PG.nodes.slice(mean.graph.nodeCount,s.source.count),definitions:s.source.definitions}},
    encoded=canonicalStringify(program);
  return {...record(p),parents:program.parentGraphs,program,
    graph:{sha256:await sha256(encoded),normNodeCount:s.norm.count,canonicalBytes:new TextEncoder().encode(encoded).length,
      requiresCompleteAuthenticatedParentPrograms:true},integerRootsAreExactSourceExpressions:true,numericalNormValuesComputed:false};
}

export async function globalInitializedMeanInputClassCertificate(p){
  assertGlobalInitializedMeanInputClasses(p);const s=initialSeals.get(p),post=await globalPostTemporalDefectClassCertificate(p.post),
    mean=await globalInitializedMeanCertificate(p.mean),operator=await originalMeanMapOperatorCertificate(p.fiveOperator),
    program={schema:'MathScope.N6.ActualInitializedMeanInputClassProgram/1',record:initialRecord(p),
      parentGraphs:{post:post.graph,mean:mean.graph,fiveOperator:operator.graph},
      norm:{start:post.graph.normNodeCount,nodes:p.G.nodes.slice(post.graph.normNodeCount,s.norm.count),definitions:s.norm.definitions},
      actualSource:{start:mean.graph.nodeCount,nodes:p.PG.nodes.slice(mean.graph.nodeCount,s.source.count),definitions:s.source.definitions}},
    encoded=canonicalStringify(program);
  return {...initialRecord(p),parents:program.parentGraphs,program,
    graph:{sha256:await sha256(encoded),normNodeCount:s.norm.count,canonicalBytes:new TextEncoder().encode(encoded).length,
      requiresCompleteAuthenticatedParentPrograms:true},integerRootsAreExactSourceExpressions:true,numericalNormValuesComputed:false};
}
