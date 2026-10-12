/** Complete nonzero angular source after the actual temporal and five-moment
 * mean updates. Each fixed lifted rectangle retains the WHOLE common-torus
 * mean field. Five exact palette differences are separate finite branches;
 * no inverse of the covering map or selected preimage replaces that field.
 */
import {assertGlobalInitializedMean,globalInitializedMeanCertificate} from './source-global-initial-mean.mjs';
import {attachGlobalInitialAngularState,assertGlobalInitialAngularState,originalAngularNormalizationLedger} from './source-global-angular.mjs';
import {SourceCoupledExpressions,assertSourceCoupledExpressions} from './source-coupled-expressions.mjs';
import {exactCommonTorusMatrix} from './source-global-pressure.mjs';
import {guardGlobalLocalBody,shareGlobalScalar} from './source-global-current.mjs';
import {exactHarmonicComplexAlgebra,exactAngularResidualUpdate,exactRealCylindricalPDE,
  originalCylindricalDifferentialOperators} from './source-harmonic-assembly.mjs';
import {createQuadraticSourceVerifier} from './source-quadratic-identity.mjs';
import {verifyCompleteAngularResidualUpdate} from './source-angular-update-verification.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),liftSeals=new WeakMap(),pathSeals=new WeakMap(),fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),parts=['real','imaginary'],
  dot=(G,a,b)=>G.add(...a.map((x,j)=>G.mul(x,b[j]))),
  root=(G,x)=>Number.isSafeInteger(x)&&!!G.nodes[x],
  progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});},
  record=s=>({schema:s.schema,source:s.source,coordinates:s.coordinates,reference:s.reference,
    templates:s.templates,application:s.application,global:s.global,checks:s.checks,scope:s.scope});

/** The integer copy is an independent fixed label. Derivatives are taken
 * before the actual nearest-copy substitution. Both Y columns remain.
 */
export function exactOriginalAngularLift(G,input={}){
  const {R,Z,T,theta,Y,center,copy,levelDifference,vr,vt,Dgeom,ci,r0,Tg,Lambda,radialFast,epsilon}=input;
  if(!Number.isSafeInteger(levelDifference)||levelDifference<0||levelDifference>4||
      ![Y,center,copy,vr,vt].every(a=>Array.isArray(a)&&a.length===2)||
      ![R,Z,T,theta,...Y,...center,...copy,...vr,...vt,Dgeom,ci,r0,Tg,Lambda,radialFast,epsilon].every(x=>root(G,x))||
      [R,Z,T,theta,...Y,...center,...copy].some(x=>G.nodes[x].op!=='coordinate'))
    fail('Retain the complete original fixed lift, its five finite covering branches and exact source geometric constants.','INVALID_INPUT');
  const matrix=exactCommonTorusMatrix(G,G.q(levelDifference)),offset=matrix.value.map((row,j)=>G.sub(G.sub(dot(G,row,Y),center[j]),copy[j])),
    xi=G.div(dot(G,vr,offset),Dgeom),eta=G.div(dot(G,vt,offset),Dgeom),v=G.div(G.add(eta,r0),ci),
    geometry={R,Z,T,theta,Y:[...Y],vr:[...vr],vt:[...vt],epsilon,
      radialFast:G.div(radialFast,G.pow(Lambda,levelDifference)),ci:G.div(ci,G.pow(Tg,levelDifference))},
    operators=originalCylindricalDifferentialOperators(G,geometry),verify=createQuadraticSourceVerifier(G,{maxTerms:120000}),
    check=(id,a,b)=>({id,...verify(G.sub(a,b))}),
    checks=[check('source-lift-complete-radial-eigenvalue',operators.L(xi),G.pow(Lambda,levelDifference)),
      check('source-lift-transverse-time-derivative-zero',operators.N(xi),G.zero),
      check('source-lift-longitudinal-radial-derivative-zero',operators.L(v),G.zero),
      check('source-lift-complete-time-eigenvalue',operators.N(v),G.div(G.pow(Tg,levelDifference),ci)),
      check('source-lift-normalized-pulse-time-one',G.mul(geometry.ci,operators.N(v)),G.one),
      check('source-lift-normalized-radial-coordinate',G.mul(geometry.radialFast,operators.L(xi)),radialFast)];
  if(checks.some(x=>!x.pass))fail('An original fixed-lift eigenvalue, covering factor or physical derivative was lost in branch '+levelDifference+': '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const result={schema:'MathScope.N6.ExactOriginalFixedAngularLift/1',levelDifference,matrix,center:[...center],copy:[...copy],offset,xi,eta,v,geometry,checks,
    original:{ci,Tg,Lambda,r0,Dgeom,radialFast,epsilon,vr:[...vr],vt:[...vt]},
    fullCommonTorusPreimageRetained:true,nearestCopyDifferentiated:false,inverseTorusCoverUsed:false,sourceAuthenticated:false};
  liftSeals.set(result,{G,record:canonicalStringify(result)});return result;
}

/** Same original H_w formula as the frozen forced kernel, with the extra
 * exact algebraic relation needed by the original integer Jg cover.
 */
export function originalFixedLiftPulsePath(G,{lift,w}={}){
  const seal=liftSeals.get(lift);
  if(!seal||seal.G!==G||seal.record!==canonicalStringify(lift)||G.nodes[w]?.op!=='coordinate'||lift.geometry.Y.includes(w)||G.dependsOn(lift.v,w))
    fail('Use this unchanged exact original fixed lift and an independent pulse path coordinate.');
  const {Y}=lift.geometry,{ci,Tg,Dgeom,vr,vt}=lift.original,delta=lift.levelDifference,
    lambdaT=vt.map(x=>G.div(x,Dgeom)),lambdaR=vr.map(x=>G.div(x,Dgeom)),
    factor=G.div(ci,G.pow(Tg,delta)),difference=G.sub(w,lift.v),Hw=Y.map((y,j)=>G.add(y,G.mul(factor,difference,vt[j]))),
    gradient=Y.map(y=>G.derivative(lift.v,y)),expectedGradient=lambdaT.map(x=>G.div(G.mul(G.pow(Tg,delta),x),ci)),
    atPulse=G.simultaneousSubstitute(lift.v,Y,Hw),transverseBefore=dot(G,lambdaR,Y),transverseAfter=dot(G,lambdaR,Hw),
    jacobian=Hw.map(x=>Y.map(y=>G.derivative(x,y))),expectedJacobian=vt.map((x,i)=>lambdaT.map((y,j)=>G.sub(i===j?G.one:G.zero,G.mul(x,y)))),
    invariantDirections=jacobian.map(row=>dot(G,row,vt)),verify=createQuadraticSourceVerifier(G,{maxTerms:120000}),
    check=(id,a,b=G.zero)=>({id,...verify(G.sub(a,b))}),
    checks=[...gradient.map((x,j)=>check('original-integer-lift-pulse-gradient-'+j,x,expectedGradient[j])),
      check('original-integer-lift-pulse-at-Hw-is-w',atPulse,w),check('original-integer-lift-transverse-fixed',transverseAfter,transverseBefore),
      ...jacobian.flatMap((row,i)=>row.map((x,j)=>check('original-integer-lift-full-Jacobian-'+i+'-'+j,x,expectedJacobian[i][j]))),
      ...invariantDirections.map((x,j)=>check('original-integer-lift-N-basepoint-invariance-'+j,x))];
  if(checks.some(x=>!x.pass))fail('An original lifted pulse path lost its full integer-cover normalization or transverse basepoint.');
  const result={schema:'MathScope.N6.OriginalIntegerLiftForcedPulsePath/1',Y:[...Y],pulse:lift.v,w,ci,Tg,levelDifference:delta,
    vr,vt,lambdaT,lambdaR,commonToPulseScale:factor,Hw,gradient,atPulse,transverseBefore,transverseAfter,jacobian,invariantDirections,checks,
    originalOperatorFormula:'H_w=Y+(ci_label/Tg^delta)*(w-v(Y))*v_t',
    originalSourceReference:'(6.21), Proposition7.2; the exact fixed Jg^delta lift is retained.',
    squaredRadicalRelationOnly:'The literal positive sqrt(2) obeys sqrt(2)^2=2; no analytic source operand is assigned an additional relation.',
    originalFrozenKernelModified:false,preimagesIdentified:false,sourceAuthenticated:false};
  pathSeals.set(result,{G,lift,record:canonicalStringify(result)});return result;
}

export function assertOriginalFixedLiftPulsePath(G,path){
  const seal=pathSeals.get(path);if(!seal||seal.G!==G||seal.record!==canonicalStringify(path)||
    liftSeals.get(seal.lift)?.record!==canonicalStringify(seal.lift))fail('Use the unchanged executed original integer-lift pulse path.');
  return true;
}

function subtractVectorRows(G,left,right){
  const C=exactHarmonicComplexAlgebra(G),modes=[...new Set([...left,...right].map(x=>x.m))].sort((a,b)=>a-b),
    at=(rows,m)=>rows.find(x=>x.m===m)?.value??[C.zero,C.zero,C.zero];
  return modes.map(m=>({m,value:at(left,m).map((x,j)=>C.sub(x,at(right,m)[j]))}));
}
const complexRoots=z=>[z.real,z.imaginary];
const vectorRoots=z=>z.flatMap(complexRoots);
function realVectorRows(G,rows,k,phase){
  return [0,1,2].map(j=>G.add(...rows.map(({m,value})=>{
    const a=G.mul(k,G.q(m),phase);return G.sub(G.mul(value[j].real,G.cosine(a)),G.mul(value[j].imaginary,G.sine(a)));
  })));
}

export function attachGlobalInitializedAngular(mean,context={}){
  assertGlobalInitializedMean(mean);
  const pressure=mean.temporal.pressure,current=pressure.current,band=current.band,
    initial=attachGlobalInitialAngularState(pressure,context),G=new SourceCoupledExpressions(mean.G),
    start=G.nodes.length,definitions=G.captureFunctionDefinitions(),{R,Z,T,theta,ell,v,Xrep,etaRep,sRep}=band.coordinates,
    {A,D}=band.constants,{epsilon,k,ci,r0,Dgeom,Tg}=band.geometry,{Lambda}=current.geometry.physicalMap,
    Y=pressure.geometry.Y,vr=pressure.geometry.vr,vt=pressure.geometry.vt,
    ellReference=G.fresh('initialized_angular_reference_band'),center=[G.fresh('initialized_angular_center0'),G.fresh('initialized_angular_center1')],
    copy=[G.fresh('initialized_angular_copy0'),G.fresh('initialized_angular_copy1')],
    levelDifference=G.fresh('initialized_angular_fixed_palette_difference'),
    parameters=[...current.local.localParameters,ellReference,...Y,...center,...copy,theta],
    power=(x,a)=>G.exp(G.mul(a,G.log(x))),ratio=G.exp(G.mul(G.sub(ell,ellReference),G.log(G.q(2)))),
    referenceValues=[G.div(R,G.sqrt(ratio)),G.div(Z,power(ratio,D)),G.div(T,ratio),ellReference,...Y],
    background=[band.fields.b,G.mul(R,band.fields.F),band.fields.G],meanVelocity=Object.values(mean.stages.moments.velocity),
    completeMeanVelocity=background.map((x,j)=>G.add(x,meanVelocity[j])),
    completeMeanPressure=G.add(band.fields.pressure,mean.stages.moments.pressure.value),
    originalReferenceRoots={velocity:completeMeanVelocity,pressure:completeMeanPressure},
    referenceFunctions={velocity:completeMeanVelocity.map((body,j)=>G.defineExpressionFunction({name:'ActualInitializedMeanVelocity_'+j,parameters:pressure.cover.parameters,body})),
      pressure:G.defineExpressionFunction({name:'ActualInitializedMeanFullPressure',parameters:pressure.cover.parameters,body:completeMeanPressure})},
    normalizedMeanVelocity=referenceFunctions.velocity.map(id=>G.mul(power(ratio,G.neg(A)),G.expressionValue(id,referenceValues))),
    normalizedMeanPressure=G.mul(power(ratio,G.neg(G.mul(G.q(2),A))),G.expressionValue(referenceFunctions.pressure,referenceValues)),
    atRepresentative=body=>G.simultaneousSubstitute(body,[Xrep,etaRep,sRep],[current.representative.roots.X,current.representative.roots.eta,current.representative.roots.s]),
    representativeFixed=[current.representative.roots.X,current.representative.roots.eta,current.representative.roots.s].every(x=>[R,Z,T,...Y].every(y=>!G.dependsOn(x,y))),
    C=exactHarmonicComplexAlgebra(G),templates=[];
  if(!representativeFixed||meanVelocity.length!==3||!same(Object.keys(mean.stages.moments.velocity),['beta','v','gamma']))
    fail('The actual original representative is frozen before physical derivatives, and every initialized velocity component is mandatory.');
  for(let delta=0;delta<=4;delta++){
    const lift=exactOriginalAngularLift(G,{R,Z,T,theta,Y,center,copy,levelDifference:delta,vr,vt,Dgeom,ci,r0,Tg,Lambda,
      radialFast:current.geometry.radialFast,epsilon}),localMap=body=>G.simultaneousSubstitute(atRepresentative(body),[band.cutoffs.xi,v],[lift.xi,lift.v]);
    for(let signIndex=0;signIndex<2;signIndex++){
      const prior=initial.local[signIndex],family=band.families[signIndex],mapComplex=z=>C.value(localMap(z.real),localMap(z.imaginary)),
        phase=localMap(prior.phase),unsharedWaveRows=prior.waveRows.map(row=>({m:row.m,velocity:row.velocity.map(mapComplex),pressure:mapComplex(row.pressure)})),
        shareComplex=(z,name)=>C.value(...parts.map(part=>shareGlobalScalar(G,z[part],name+'_'+part))),
        positive=unsharedWaveRows.find(r=>r.m===1),positiveVelocity=positive.velocity.map((z,j)=>shareComplex(z,'InitializedOriginalWave_'+delta+'_'+prior.sign+'_'+j)),
        positivePressure=shareComplex(positive.pressure,'InitializedOriginalPrimaryPressure_'+delta+'_'+prior.sign),
        waveRows=[{m:1,velocity:positiveVelocity,pressure:positivePressure},{m:-1,velocity:positiveVelocity.map(C.conjugate),pressure:C.conjugate(positivePressure)}],
        previous=[{m:0,velocity:normalizedMeanVelocity.map(x=>C.value(x)),pressure:C.value(normalizedMeanPressure)}],
        oldFlat=initial.global.oldFlatResidual.local.map(row=>({m:row.m,value:row.value.map(mapComplex)})),
        update=exactAngularResidualUpdate(G,{geometry:lift.geometry,phase,k,previous,increment:waveRows,oldFlatResidual:oldFlat}),
        waveResidual=subtractVectorRows(G,update.direct,update.oldResidual),
        normal=prior.normal.map(localMap),normalDerivative=prior.normalDerivative.map(localMap),
        principalK=prior.principalK.map(row=>row.map(atRepresentative)),
        Dlocal=originalCylindricalDifferentialOperators(G,lift.geometry),phaseGradient=[Dlocal.Dr(phase),Dlocal.angular(phase),Dlocal.Dz(phase)],
        phaseVerifier=createQuadraticSourceVerifier(G,{maxTerms:180000}),
        phaseChecks=phaseGradient.map((x,j)=>({id:'initialized-source-normal-'+delta+'-'+prior.sign+'-'+j,...phaseVerifier(G.sub(x,normal[j]))})),
        coefficientVerification=verifyCompleteAngularResidualUpdate(G,update,{prefix:'initialized-complete-update-'+delta+'-'+prior.sign}),
        coefficientChecks=coefficientVerification.checks,
        checks=[...phaseChecks,...coefficientChecks,
          {id:'initialized-mean-whole-common-torus-retained-'+delta+'-'+prior.sign,pass:previous[0].velocity.every((z,j)=>z.real===normalizedMeanVelocity[j])&&previous[0].pressure.real===normalizedMeanPressure},
          {id:'initialized-primary-original-pressure-half-pair-'+delta+'-'+prior.sign,pass:waveRows.length===2&&waveRows[0].m===1&&waveRows[1].m===-1&&prior.checks.every(x=>x.pass)},
          {id:'initialized-nonzero-modes-complete-'+delta+'-'+prior.sign,pass:same(waveResidual.map(r=>r.m),[-2,-1,0,1,2])&&update.discardedModes.length===0},
          {id:'initialized-original-flat-quadratic-retained-'+delta+'-'+prior.sign,pass:same(update.oldFlatResidual,oldFlat)&&update.newQuadraticRemainderRetained}];
      if(checks.some(x=>!x.pass))fail('A complete initialized angular source failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
      templates.push({key:delta+':'+prior.sign,signIndex,sign:prior.sign,levelDifference:delta,lift,phase,k,normal,normalDerivative,principalK,
        sourceFrame:{normalBeforePath:prior.normal.map(atRepresentative),pulseVariable:v,principalK,
          familySystem:family.system,primaryPotential:current.local.rows[signIndex].potential,
          primaryHomogeneousPressure:prior.primaryPressure,actualPrimaryAmplitude:current.local.rows[signIndex].weightedAmplitude.map(atRepresentative)},
        previous,waveRows,unsharedWaveRows,update,coefficientVerification,waveResidual,nonzeroAngularForcing:waveResidual.filter(r=>r.m!==0),checks,
        oldFlatResidual:oldFlat,sourcePulseLength:band.geometry.Ls,sourceCutoff:atRepresentative(band.cutoffs.psi),
        sourcePathVariable:v,completeReferenceMeanBeforeMapping:originalReferenceRoots});
      progress(context,'initialized-actual-complete-angular-source-fixed-lift',G,{delta,sign:prior.sign,modes:5});
    }
  }
  const chooseLevel=values=>{
    let out=G.zero;for(let j=4;j>=0;j--)out=G.choose(levelDifference,G.q(2*j-1,2),G.q(2*j+1,2),out,values[j],out);return out;
  },localParameters=[...parameters,levelDifference],systems=[0,1].map(signIndex=>{
    const rows=templates.filter(t=>t.signIndex===signIndex).sort((a,b)=>a.levelDifference-b.levelDifference),
      residuals=rows.map(t=>realVectorRows(G,t.waveResidual,k,t.phase).map(body=>G.choose(t.lift.xi,G.neg(r0),r0,G.zero,
        G.choose(t.lift.v,G.zero,band.geometry.Ls,G.zero,body,G.zero),G.zero)));
    return [0,1,2].map(j=>{
      const body=chooseLevel(residuals.map(r=>r[j])),guarded=guardGlobalLocalBody(G,current.geometry,current.local.slowCutoff,body,{auxiliary:false}),
        fixed=atRepresentative(guarded.body),ownSystem=G.defineExpressionFunction({name:'ActualInitializedAngularOwnLabel_'+signIndex+'_'+j,parameters:localParameters,body:fixed}),
        values=[G.mul(G.sqrt(ratio),R),G.mul(power(ratio,D),Z),G.mul(ratio,T),...localParameters.slice(3)],
        referenceBody=G.mul(power(ratio,G.add(G.mul(G.q(2),A),G.q(1,2))),G.expressionValue(ownSystem,values)),
        system=G.defineExpressionFunction({name:'ActualInitializedAngularReferenceChart_'+signIndex+'_'+j,parameters:localParameters,body:referenceBody});
      return {system,ownSystem,body,fixedBody:fixed,referenceBody,referenceValues:values,guards:guarded,
        allScaleFactorsInsideDifferentiatedBody:true};
    });
  }),fieldParameters=[...pressure.cover.parameters,theta],directions=[...pressure.cover.directions,theta],definitionsByComponent=[],roots=[];
  for(let component=0;component<3;component++){
    const rows=[];
    for(const row of pressure.cover.rows){
      const b=pressure.cover.bands[row.relativeBand+1];
      for(const sign of row.signs){
        const values=[R,Z,T,row.label.ell,...row.label.grid,ell,...Y,...sign.rectangle.center,...sign.rectangle.copy,theta,b.delta],
          derivativeMaps=[...[0,1,2].map(parameter=>[{parameter,coefficient:G.one}]),
            [{parameter:8,coefficient:G.one}],[{parameter:9,coefficient:G.one}],[{parameter:14,coefficient:G.one}]];
        rows.push({localSystem:systems[sign.sourceLocalRow][component].system,values,derivativeMaps,
          coefficient:G.one,guards:row.guards,
          label:{key:row.key,ell:row.label.ell,grid:row.label.grid,sign:sign.sign,fixedDifference:b.delta,countBoxOnce:true}});
      }
    }
    const field=G.definePeriodicIndexedField({name:'ActualAll162InitializedAngularResidual_'+component,parameters:fieldParameters,directions,rows,
      sourceRecipe:{actualInitializedMean:true,completeReferenceMeanRetained:true,all81SourceBoxes:true,bothSigns:true,
        everyExactDifferenceFrom0Through4:true,fullCommonYTorusKept:true,nearestCopyFrozenBeforeDifferentiation:true,
        sourceDisjointness:pressure.cover.proof.allCrossLabelProductsVanish,originalFlatJoins:pressure.cover.proof.localFinitenessAndFlatJoins}});
    definitionsByComponent.push(field);roots.push(G.periodicIndexedValue(field,fieldParameters));
  }
  const commonGeometry={...pressure.geometry,theta},globalVelocity=completeMeanVelocity.map((x,j)=>G.add(x,initial.global.velocity.waves[j])),
    globalPressure=G.add(completeMeanPressure,initial.global.pressure.nonzeroAngular),
    direct=exactRealCylindricalPDE(G,{geometry:commonGeometry,velocity:globalVelocity,pressure:globalPressure}),
    referenceMean=exactRealCylindricalPDE(G,{geometry:commonGeometry,velocity:completeMeanVelocity,pressure:completeMeanPressure}),
    assembled=referenceMean.conservativeResidual.map((x,j)=>G.add(x,roots[j])),normalization=originalAngularNormalizationLedger(),
    checks=[...templates.flatMap(t=>t.checks),
      {id:'actual-initialized-angular-all-ten-fixed-source-lifts',pass:templates.length===10&&templates.every(t=>t.lift.checks.every(x=>x.pass))},
      {id:'actual-initialized-angular-all162-original-contributions',pass:definitionsByComponent.every(id=>G.periodicIndexedSystem(id).rows.length===162)},
      {id:'actual-initialized-angular-full-pressure-and-mean-sequence',pass:mean.scope.actualTemporalBeforeMomentSequenceConstructed&&mean.scope.actualFullPressureAfterBothMeanUpdates&&
        referenceFunctions.velocity.every((id,j)=>G.expressionSystem(id).body===completeMeanVelocity[j])&&G.expressionSystem(referenceFunctions.pressure).body===completeMeanPressure},
      {id:'actual-initialized-angular-disjoint-source-products',pass:pressure.cover.proof.allCrossLabelProductsVanish&&pressure.cover.proof.exactSourceAuthority&&normalization.pass},
      {id:'actual-initialized-angular-same-source-seals',pass:assertGlobalInitializedMean(mean)&&assertGlobalInitialAngularState(initial)&&G.functionDefinitionsUnchanged(definitions)}];
  if(checks.some(x=>!x.pass))fail('The original initialized angular source lost a private source or complete-cover premise.');
  const result={schema:'MathScope.N6.GlobalActualInitializedAngular/1',G,mean,initial,
    source:{paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,sourcePrefixCount:start,
      actualTemporalBeforeMomentSequence:true,wholeOriginalMeanSourceAcceptedOnlyThroughPrivateSeal:true,
      originalM2Modified:false,callerSourceOrCutoffAccepted:false,allOriginalPrimaryPressureTermsRetained:true},
    coordinates:{parameters,localParameters,referenceEll:ellReference,center,copy,levelDifference,Y,theta,originalPulse:v},
    reference:{parameters:pressure.cover.parameters,functions:referenceFunctions,roots:originalReferenceRoots,ratio,values:referenceValues,
      normalizedMeanVelocity,normalizedMeanPressure,sourcePhysicalNormalization:normalization,
      fullOriginalReferenceFieldPulledBack:true,ownLabelBackgroundIdentityAssumedInstead:false},
    templates,application:{systems,parameters:fieldParameters,directions,definitions:definitionsByComponent,residualRoots:roots,
      sourceCover:pressure.cover.proof,sourceCoverRows:81,signedContributions:162,sourceDifferences:[0,1,2,3,4],
      completeYPreimageKept:true,nearestCopiesDifferentiated:false,discardedLabelsOrModes:[]},
    global:{geometry:commonGeometry,velocity:globalVelocity,pressure:globalPressure,direct,assembledResidual:assembled,
      referenceMeanResidual:referenceMean,oldFlatResidual:initial.global.oldFlatResidual,
      crossLabelProducts:'The direct path differentiates the whole sum. The assembled path uses the same executed original disjoint-support/flat-join cover; mean-wave products retain the whole common-Y mean.',
      equalityScope:'Exact local coefficient identities plus authenticated fixed-label normalization and source-disjoint joins; no numerical whole-field residual enclosure.'},
    checks,scope:{actualInitializedMeanAngularSourceConstructed:true,allCurrentNonzeroModesConstructed:true,all162OriginalContributionsRetained:true,
      allOriginalAndUpdatedPressureTermsRetained:true,allGeneratedFiniteHarmonicsRetained:true,forcedInverseApplied:false,
      sourceDerivativeClosureAudited:false,initializedJ0:false,originalProp9_5ClassBoundsEstablished:false,
      originalN602Complete:false,originalN603Complete:false,allCorrectionStagesConstructed:false,completeN6:false}};
  const count=G.nodes.length;seals.set(result,{G,mean,initial,start,count,delta:canonicalStringify(G.nodes.slice(start,count)),
    definitions:G.captureFunctionDefinitions(),record:canonicalStringify(record(result))});
  progress(context,'initialized-actual-all162-full-angular-source-sealed',G);return result;
}

export function assertGlobalInitializedAngular(s){
  const seal=seals.get(s);if(!seal||seal.G!==s.G||seal.mean!==s.mean||seal.initial!==s.initial||seal.record!==canonicalStringify(record(s))||
      seal.delta!==canonicalStringify(s.G.nodes.slice(seal.start,seal.count))||!s.G.functionDefinitionsUnchanged(seal.definitions))
    fail('Use the unchanged privately constructed complete initialized angular source.');
  assertSourceCoupledExpressions(s.G,s.mean.G);assertGlobalInitializedMean(s.mean);assertGlobalInitialAngularState(s.initial);return true;
}

export async function globalInitializedAngularCertificate(s){
  assertGlobalInitializedAngular(s);const seal=seals.get(s),sourceMean=await globalInitializedMeanCertificate(s.mean),
    encoded=canonicalStringify({sourceMeanGraph:sourceMean.graph,record:record(s),nodes:s.G.nodes.slice(seal.start,seal.count),definitions:seal.definitions});
  return {...record(s),sourceMeanGraph:sourceMean.graph,
    graph:{sha256:await sha256(encoded),nodeCount:seal.count,deltaNodeCount:seal.count-seal.start,canonicalBytes:new TextEncoder().encode(encoded).length},
    execution:'ACTUAL_COMPLETE_POST_TEMPORAL_POST_MOMENT_ANGULAR_SOURCE_CONSTRUCTION',
    numericalWholeFieldEnclosure:false,allOrderClassBoundsCertified:false};
}

export function initializedAngularSourceRoots(s){
  assertGlobalInitializedAngular(s);
  return [...new Set([...s.global.velocity,s.global.pressure,...s.global.direct.conservativeResidual,...s.global.assembledResidual,
    ...s.templates.flatMap(t=>t.nonzeroAngularForcing.flatMap(r=>vectorRoots(r.value)))])];
}
