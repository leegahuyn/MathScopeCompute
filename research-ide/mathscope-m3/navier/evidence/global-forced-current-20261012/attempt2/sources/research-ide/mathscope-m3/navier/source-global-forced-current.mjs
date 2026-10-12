/** One actual complete angular substep of the original current.
 *
 * The input is the privately constructed temporal-before-moment current,
 * including every original primary pressure and every current harmonic.
 * Every nonzero coefficient is used as an actual source along H_w. The
 * resulting full curl changes W, so the mean pressure is reconstructed
 * again before the complete physical residual is formed.
 */
import {assertGlobalInitializedAngular,globalInitializedAngularCertificate,
  originalFixedLiftPulsePath,assertOriginalFixedLiftPulsePath} from './source-initialized-angular.mjs';
import {coupledForcedAngularInverse,assertSourceCoupledExpressions} from './source-coupled-expressions.mjs';
import {realizeMappedForcedAngularCurl,assertMappedForcedAngularCurl,mappedForcedAngularCurlRoots} from './source-mapped-forced-curl.mjs';
import {assertForcedAngularInverse} from './source-forced-pulse.mjs';
import {createQuadraticSourceVerifier} from './source-quadratic-identity.mjs';
import {createFactoredRationalVerifier} from './forced-rational-identity.mjs';
import {exactHarmonicComplexAlgebra,exactAngularResidualUpdate,exactRealCylindricalPDE,
  reconstructAngularHarmonics} from './source-harmonic-assembly.mjs';
import {reconstructUpdatedFullMeanPressure} from './source-updated-mean-pressure.mjs';
import {guardGlobalLocalBody,shareGlobalScalar} from './source-global-current.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),parts=['real','imaginary'],names=['rr','rtheta','rz','thetatheta','thetaz','zz'],
  pairs=[[0,0],[0,1],[0,2],[1,1],[1,2],[2,2]],fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),root=(G,x)=>Number.isSafeInteger(x)&&!!G.nodes[x],
  vectorRoots=v=>v.flatMap(z=>[z.real,z.imaginary]),
  progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});},
  omit=(value,keys)=>Object.fromEntries(Object.entries(value).filter(([key])=>!keys.includes(key))),
  record=s=>({schema:s.schema,source:s.source,templates:s.templates.map(t=>({...t,forced:t.forced.map(f=>({...f,
    bound:omit(f.bound,['G','inverse']),inverse:omit(f.inverse,['G']),mapped:omit(f.mapped,['G','inverse'])}))})),assembly:s.assembly,mean:s.mean,
    global:s.global,checks:s.checks,scope:s.scope});

/** Complete angular mean of all finite wave pairs. Pressure and the zero
 * mode are not silently included in W; they stay in the separate mean PDE.
 */
export function exactAngularWaveCovariance(G,{rows,theta}={}){
  const C=exactHarmonicComplexAlgebra(G);
  if(!Array.isArray(rows)||!rows.length||rows.length>128||new Set(rows.map(r=>r.m)).size!==rows.length||
    rows.some(r=>!Number.isSafeInteger(r.m)||r.m===0||!Array.isArray(r.velocity)||r.velocity.length!==3||
      r.velocity.some(z=>!C.check(z)||[z.real,z.imaginary].some(x=>theta!==undefined&&G.dependsOn(x,theta)))))
    fail('Retain every nonzero conjugate wave coefficient and all three components.','INVALID_INPUT');
  const at=new Map(rows.map(r=>[r.m,r])),verify=createFactoredRationalVerifier(G,{maxTerms:120000}),checks=[];
  for(const row of rows.filter(r=>r.m>0)){
    const negative=at.get(-row.m);if(!negative)fail('A complete real angular covariance requires both signs of every mode.','INVALID_INPUT');
    row.velocity.forEach((z,j)=>parts.forEach(part=>checks.push({id:'full-W-conjugate-'+row.m+'-'+j+'-'+part,
      ...verify(G.sub(negative.velocity[j][part],C.conjugate(z)[part]))})));
  }
  if(rows.some(r=>!at.has(-r.m)))fail('A finite mode has no conjugate source partner.','INVALID_INPUT');
  const values={},imaginary={},contributions={};
  names.forEach((name,index)=>{
    const [i,j]=pairs[index],terms=rows.map(row=>({m:row.m,partner:-row.m,value:C.mul(row.velocity[i],at.get(-row.m).velocity[j])})),
      sum=C.add(...terms.map(t=>t.value));values[name]=sum.real;imaginary[name]=sum.imaginary;contributions[name]=terms;
    checks.push({id:'full-W-real-angular-mean-'+name,...verify(sum.imaginary)});
    if(i===j){const positive=G.mul(G.q(2),G.add(...rows.filter(r=>r.m>0).map(r=>G.add(G.pow(r.velocity[i].real,2),G.pow(r.velocity[i].imaginary,2)))));
      checks.push({id:'full-W-diagonal-positive-sum-'+name,...verify(G.sub(sum.real,positive))});}
  });
  if(checks.some(x=>!x.pass))fail('A full angular covariance lost a conjugate, complex component or nonnegative square.');
  return {schema:'MathScope.N6.ExactCompleteFiniteAngularCovariance/1',modes:rows.map(r=>r.m).sort((a,b)=>a-b),values,imaginary,contributions,checks,
    zeroModeProjection:'Keep every pair m+n=0 in the full exact finite convolution.',
    originalNonzeroIntegerCarrierStillRequired:true,allFinitePairsRetained:true,discardedModes:[],sourceAuthenticated:false};
}

/** Execute the differential-ideal support check on the actual emitted
 * residual. Every derivative/application of an original wave capsule is
 * set to zero, while the entire mean field is retained as a coefficient.
 */
export function exactAngularSourceSupportIdeal(G,{rows,waveSystems}={}){
  if(!Array.isArray(rows)||!Array.isArray(waveSystems)||!waveSystems.length)fail('Retain the actual wave-jet systems and complete source coefficient rows.','INVALID_INPUT');
  const systems=new Set(waveSystems),seenJets=new Map(),cache=new Map();
  waveSystems.forEach(id=>G.expressionSystem(id));
  const visit=id=>{
    if(cache.has(id))return cache.get(id);const node=G.nodes[id];if(!node)fail('A source support ideal lost an exact operand.');
    const {op,args}=node;let value=id;
    if(op==='m3_coupled_expression_partial'&&systems.has(args[0])){
      seenJets.set(args[0]+':'+args[2].join(','),{system:args[0],orders:args[2],actualBody:G.expressionSystem(args[0]).body});value=G.zero;
    }else if(op==='add')value=G.add(...args.map(visit));
    else if(op==='multiply'){const first=visit(args[0]);value=first===G.zero?G.zero:G.mul(first,visit(args[1]));}
    else if(op==='integer_power')value=G.pow(visit(args[0]),args[1]);
    else if(op==='inverse')value=G.inv(visit(args[0]));
    else if(op==='smooth_piecewise')value=G.choose(args[0],args[1],args[2],...args.slice(3).map(visit));
    // Other independent analytic fields, including the WHOLE mean, stay
    // intact. No source body hidden in another operator is set to zero.
    cache.set(id,value);return value;
  },verify=createFactoredRationalVerifier(G,{maxTerms:120000}),checks=rows.flatMap(row=>row.value.flatMap((z,j)=>parts.map(part=>{
    const reduced=visit(z[part]);return {id:'actual-forcing-wave-support-'+row.m+'-'+j+'-'+part,source:z[part],reduced,...verify(reduced)};
  })));
  if(checks.some(x=>!x.pass)||!seenJets.size)fail('The actual nonzero source is not in the retained original wave differential ideal.');
  return {schema:'MathScope.N6.ExecutedAngularSourceSupportIdeal/1',waveSystems:[...systems],waveJets:[...seenJets.values()],checks,
    wholeMeanCoefficientKept:true,sourcePressureWaveJetsKept:true,
    conclusion:'On any open set where the original wave and all its spatial/time jets vanish, every displayed nonzero source coefficient is exactly zero.',
    originalSupportAndFlatnessStillRequiresAuthentication:true,sourceAuthenticated:false};
}

function sumStateRows(G,left,right){
  const C=exactHarmonicComplexAlgebra(G),all=[...new Set([...left,...right].map(r=>r.m))].sort((a,b)=>a-b),
    at=(rows,m)=>rows.find(r=>r.m===m)??{velocity:[C.zero,C.zero,C.zero],pressure:C.zero};
  return all.map(m=>({m,velocity:at(left,m).velocity.map((z,j)=>C.add(z,at(right,m).velocity[j])),pressure:C.add(at(left,m).pressure,at(right,m).pressure)}));
}
function subtractVectorRows(G,left,right){
  const C=exactHarmonicComplexAlgebra(G),all=[...new Set([...left,...right].map(r=>r.m))].sort((a,b)=>a-b),at=(rows,m)=>rows.find(r=>r.m===m)?.value??[C.zero,C.zero,C.zero];
  return all.map(m=>({m,value:at(left,m).map((z,j)=>C.sub(z,at(right,m)[j]))}));
}
function realVectorRows(G,rows,k,phase){
  return [0,1,2].map(j=>G.add(...rows.map(({m,value})=>{const a=G.mul(k,G.q(m),phase);return G.sub(G.mul(value[j].real,G.cosine(a)),G.mul(value[j].imaginary,G.sine(a)));})));
}

function completeSourceField(source,templates,name,bodyAt,{kind,angular=true}={}){
  const G=source.G,pressure=source.mean.temporal.pressure,current=pressure.current,band=current.band,{R,Z,T,theta,ell,Xrep,etaRep,sRep}=band.coordinates,
    {A,D}=band.constants,{r0,Ls}=band.geometry,{levelDifference}=source.coordinates,
    parameters=angular?source.coordinates.localParameters:source.coordinates.localParameters.filter(x=>x!==theta),
    fieldParameters=angular?[...pressure.cover.parameters,theta]:pressure.cover.parameters,
    directions=angular?[...pressure.cover.directions,theta]:pressure.cover.directions,
    ratio=source.reference.ratio,power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    exponent=kind==='velocity'?A:kind==='residual'?G.add(G.mul(G.q(2),A),G.q(1,2)):G.mul(G.q(2),A),
    choose=values=>{let out=G.zero;for(let j=4;j>=0;j--)out=G.choose(levelDifference,G.q(2*j-1,2),G.q(2*j+1,2),out,values[j],out);return out;},
    systems=[0,1].map(signIndex=>{
      const selected=templates.filter(t=>t.signIndex===signIndex).sort((a,b)=>a.levelDifference-b.levelDifference),
        guardedLifts=selected.map(t=>G.choose(t.lift.xi,G.neg(r0),r0,G.zero,G.choose(t.lift.v,G.zero,Ls,G.zero,bodyAt(t),G.zero),G.zero)),
        own=guardGlobalLocalBody(G,current.geometry,current.local.slowCutoff,choose(guardedLifts),{auxiliary:false}),
        fixed=G.simultaneousSubstitute(own.body,[Xrep,etaRep,sRep],[current.representative.roots.X,current.representative.roots.eta,current.representative.roots.s]),
        ownSystem=G.defineExpressionFunction({name:name+'_own_'+signIndex,parameters,body:fixed}),
        referenceValues=[G.mul(G.sqrt(ratio),R),G.mul(power(ratio,D),Z),G.mul(ratio,T),...parameters.slice(3)],
        referenceBody=G.mul(power(ratio,exponent),G.expressionValue(ownSystem,referenceValues)),
        system=G.defineExpressionFunction({name:name+'_reference_'+signIndex,parameters,body:referenceBody});
      return {system,ownSystem,ownBody:fixed,referenceBody,referenceValues,guards:own,allScaleFactorsInsideDifferentiatedBody:true};
    }),rows=[];
  for(const row of pressure.cover.rows){const b=pressure.cover.bands[row.relativeBand+1];for(const sign of row.signs){
    const values=[R,Z,T,row.label.ell,...row.label.grid,ell,...pressure.geometry.Y,...sign.rectangle.center,...sign.rectangle.copy,...(angular?[theta]:[]),b.delta],
      derivativeMaps=[...[0,1,2,8,9].map(parameter=>[{parameter,coefficient:G.one}]),...(angular?[[{parameter:14,coefficient:G.one}]]:[])];
    rows.push({localSystem:systems[sign.sourceLocalRow].system,values,derivativeMaps,coefficient:G.one,guards:row.guards,
      label:{key:row.key,ell:row.label.ell,grid:row.label.grid,sign:sign.sign,fixedDifference:b.delta,countBoxOnce:true}});
  }}
  const field=G.definePeriodicIndexedField({name,parameters:fieldParameters,directions,rows,sourceRecipe:{actualForcedSourceSubstep:true,
    all81Boxes:true,bothSigns:true,everyFixedDifferenceRetained:true,originalNearestCopyAndLabelsFrozen:true,
    allScaleAndChainFactorsInsideActualLocalBody:true,physicalScale:kind,sourceCover:pressure.cover.proof}});
  return {field,root:G.periodicIndexedValue(field,fieldParameters),systems,parameters:fieldParameters,directions,contributions:rows.length,
    originalSourceLabelsAndCopiesFrozenBeforeDerivative:true};
}

function sourcePullbackComponent(G,body,path,name){
  assertOriginalFixedLiftPulsePath(G,path);
  if(body===G.zero)return {body,root:body,mapped:body,sourceInvariant:G.zero,check:{pass:true,exactZeroBody:true}};
  const parameters=[...G.freeCoordinates(body)].sort((a,b)=>a-b),system=G.defineExpressionFunction({name,parameters,body}),
    value=G.expressionValue(system,parameters),mapped=G.simultaneousSubstitute(value,path.Y,path.Hw),
    sourceInvariant=G.add(...path.Y.map((y,j)=>G.mul(path.vt[j],G.derivative(mapped,y)))),
    check=createQuadraticSourceVerifier(G,{maxTerms:160000})(sourceInvariant);
  if(!check.pass)fail('The complete actual source pullback moves the original transverse basepoint.');
  return {body,root:value,system,parameters,mapped,sourceInvariant,check,
    wholeDefiningBodyRetained:G.expressionSystem(system).body===body};
}

export function attachGlobalForcedCurrent(source,context={}){
  assertGlobalInitializedAngular(source);
  const G=source.G,pressure=source.mean.temporal.pressure,current=pressure.current,band=current.band,
    {R,Z,T,theta}=band.coordinates,{Y}=pressure.geometry,{epsilon,k}=band.geometry,
    start=G.nodes.length,definitions=G.captureFunctionDefinitions(),C=exactHarmonicComplexAlgebra(G),templates=[];
  for(const old of source.templates){
    const w=G.fresh('actual_forced_source_path_'+old.levelDifference+'_'+old.sign),path=originalFixedLiftPulsePath(G,{lift:old.lift,w}),
      normal=old.sourceFrame.normalBeforePath.map(x=>G.substitute(x,old.sourceFrame.pulseVariable,w)),K=old.principalK,
      psiPath=G.substitute(old.sourceCutoff,old.sourcePathVariable,w),
      systems=[...new Set(old.waveRows.flatMap(row=>[...row.velocity,row.pressure]).flatMap(z=>parts.flatMap(part=>{
        const n=G.nodes[z[part]];return n.op==='m3_coupled_expression_partial'?[n.args[0]]:[];
      })))],support=exactAngularSourceSupportIdeal(G,{rows:old.nonzeroAngularForcing,waveSystems:systems}),
      forced=[],increment=[],conjugacy=[];
    for(const m of [1,2]){
      const positive=old.nonzeroAngularForcing.find(r=>r.m===m),negative=old.nonzeroAngularForcing.find(r=>r.m===-m),verify=createFactoredRationalVerifier(G,{maxTerms:180000});
      if(!positive||!negative)fail('Every current positive and negative source mode must be solved.');
      for(let j=0;j<3;j++)for(const part of parts)conjugacy.push({id:'actual-forcing-conjugate-'+old.key+'-'+m+'-'+j+'-'+part,
        ...verify(G.sub(negative.value[j][part],C.conjugate(positive.value[j])[part]))});
      const pullback=positive.value.map((z,j)=>Object.fromEntries(parts.map(part=>[part,sourcePullbackComponent(G,z[part],path,
        'ActualWholeNonzeroSource_'+old.key+'_'+m+'_'+j+'_'+part)]))),
        forcing=pullback.map(z=>C.value(z.real.mapped,z.imaginary.mapped)),
        all=[...normal,...K.flat(),epsilon,k,old.sourcePulseLength,...vectorRoots(forcing)],
        parameters=[...new Set([R,Z,T,...Y,...all.flatMap(x=>[...G.freeCoordinates(x)])])].filter(x=>x!==w),
        bound=coupledForcedAngularInverse(G,{name:'ActualOriginalForced_'+old.key+'_m'+m,variable:w,parameters,directions:[R,Z,T,...Y],
          length:old.sourcePulseLength,n:normal,K,k,epsilon,forcing,m}),inverse=bound.inverse,
        mapped=realizeMappedForcedAngularCurl({G,inverse,geometry:old.lift.geometry,phase:old.phase,pulseValue:old.lift.v,psiPath,
          name:'ActualMappedOriginalForced_'+old.key+'_m'+m}),
        negativeVelocity=inverse.velocity.map(C.conjugate),negativePressure=C.conjugate(inverse.pressure),
        negativeSource=inverse.source.map(C.conjugate),negativeRhs=inverse.rhs.map(C.conjugate),
        negativeResidual=negativeVelocity.map((z,i)=>C.add(negativeRhs[i],C.add(...K[i].map((a,j)=>C.scale(a,negativeVelocity[j]))),
          C.scale(G.mul(G.q(m*m),inverse.damping),z),negativeSource[i],
          C.imaginary(G.mul(G.q(-m),k,normal[i]),negativePressure))),
        negativeVerifier=createFactoredRationalVerifier(G,{atomicNodes:vectorRoots(inverse.velocity),maxTerms:120000}),
        negativeChecks=negativeResidual.flatMap((z,j)=>parts.map(part=>({id:'actual-negative-principal-'+old.key+'-'+m+'-'+j+'-'+part,...negativeVerifier(z[part])}))),
        principalInvariant=Y.every(y=>[...inverse.matrix.flat(),...normal,...K.flat()].every(x=>!G.dependsOn(x,y))),
        atEnd=G.simultaneousSubstitute(old.lift.v,Y,path.Hw),pulseIdentity=createQuadraticSourceVerifier(G)(G.sub(atEnd,w)),
        inputRoots=positive.value.map(z=>({...z})),
        checks=[{id:'actual-forced-full-source-'+old.key+'-'+m,pass:pullback.every(z=>parts.every(part=>z[part].check.pass))&&bound.everyOriginalSourceBodyRetained},
          {id:'actual-forced-original-fixed-transverse-system-'+old.key+'-'+m,pass:principalInvariant&&path.checks.every(x=>x.pass)&&pulseIdentity.pass},
          {id:'actual-forced-original-pulse-domain-'+old.key+'-'+m,pass:inverse.input.length===old.sourcePulseLength&&inverse.epsilon===epsilon&&inverse.k===k&&
            old.sourceFrame.normalBeforePath[1]!==G.zero&&band.families[old.signIndex].carrier.nonzeroAngularInteger},
          {id:'actual-forced-complete-complex-pressure-and-curl-'+old.key+'-'+m,pass:inverse.identities.checks.every(x=>x.pass)&&mapped.identities.checks.every(x=>x.pass)&&negativeChecks.every(x=>x.pass)}];
      if(checks.some(x=>!x.pass))fail('An actual original forced source, path or pressure premise was lost.');
      forced.push({m,bound,inverse,mapped,inputRoots,pullback,path,checks,
        signedSolutions:[{m,originalSource:positive.value,pathSource:inverse.source,velocity:inverse.velocity,pressure:inverse.pressure},
          {m:-m,originalSource:negative.value,pathSource:negativeSource,velocity:negativeVelocity,pressure:negativePressure,
            exactConjugateOfSystem:inverse.system,principalResidual:negativeResidual,checks:negativeChecks,
            equality:'The actual negative source was checked before pullback. This real zero-data matrix equation preserves conjugacy; the displayed signed pressure satisfies its complete negative-mode principal equation.'}],
        sourcePathInvariance:{matrixIndependentOfBasepointN:principalInvariant,actualSourceNChecks:pullback.map(z=>parts.map(part=>z[part].check)),
          exactPrinciple:'Every source-ordered term is N-invariant because N H_w=0 and N M=0. Its actual C1 variational factorial tails give the same identity for the exact limit.',
          independentParameterDerivativeNotDropped:true,commonPhysicalTimeAtMappedEndpoint:'(ci_label/Tg^delta)*N[t(v(Y),Y)] = partial_w t(v(Y),Y), after the checked basepoint identity.',
          sourceClassNormNotAssumed:true},
        originalSupport:{differentialIdeal:support,originalPalette:current.geometry.palette,originalTorus:current.geometry.torus,
          sourceFlatJoinRule:pressure.cover.proof.localFinitenessAndFlatJoins,
          zeroDataPreservesTransverseSupport:'Outside the original transverse support the entire pulled-back source is zero for every w. Every ordered term and every flat parameter jet is then zero.',
          originalPsiRestoresLongitudinalSupport:true,fullAllOrderUniformClassBound:false}});
      increment.push({m,velocity:mapped.velocity,pressure:mapped.pressure},
        {m:-m,velocity:mapped.velocity.map(C.conjugate),pressure:C.conjugate(mapped.pressure)});
      progress(context,'actual-all-label-forced-source-full-complex-inverse-and-mapped-curl',G,{key:old.key,m});
    }
    if(conjugacy.some(x=>!x.pass))fail('The authentic negative source is not the conjugate of the retained positive source.');
    const waveRows=sumStateRows(G,old.waveRows,increment),covariance=exactAngularWaveCovariance(G,{rows:waveRows,theta}),
      reconstruction=reconstructAngularHarmonics(G,{geometry:old.lift.geometry,phase:old.phase,k,rows:waveRows});
    templates.push({key:old.key,signIndex:old.signIndex,sign:old.sign,levelDifference:old.levelDifference,lift:old.lift,phase:old.phase,k,
      oldWaveRows:old.waveRows,oldMeanRows:old.previous,oldFlatResidual:old.oldFlatResidual,originalSourceRows:old.nonzeroAngularForcing,
      forced,increment,waveRows,covariance,reconstruction,support,conjugacy,
      sourceFiniteInventory:{solved:[-2,-1,1,2],updatedVelocity:[-2,-1,1,2],nextResidual:[-4,-3,-2,-1,0,1,2,3,4],discarded:[]}});
  }
  const covarianceFields=Object.fromEntries(names.map(name=>[name,completeSourceField(source,templates,'ActualForcedCurrent_W_'+name,t=>t.covariance.values[name],{kind:'covariance',angular:false})])),
    covariance=Object.fromEntries(names.map(name=>[name,covarianceFields[name].root])),
    background={b:band.fields.b,V:G.mul(R,band.fields.F),G:band.fields.G},
    latestMean=reconstructUpdatedFullMeanPressure(G,{geometry:pressure.geometry,background,
      velocity:source.mean.stages.moments.velocity,covariance,stress:pressure.residual.fullOriginalStress,
      rho:pressure.pressure.rho,chi:pressure.pressure.chi,tag:'ActualAfterCompleteForcedAngularSubstep'}),
    pressureDifference=G.sub(latestMean.pressure.value,source.mean.stages.moments.pressure.value),
    meanPressureFunction=G.defineExpressionFunction({name:'ActualAfterForcedRefreshedFullMeanPressure',parameters:pressure.cover.parameters,
      body:G.add(band.fields.pressure,latestMean.pressure.value)}),
    power=(x,a)=>G.exp(G.mul(a,G.log(x))),newLocalMeanPressure=G.mul(power(source.reference.ratio,G.neg(G.mul(G.q(2),band.constants.A))),
      G.expressionValue(meanPressureFunction,source.reference.values)),
    localPressureDifference=G.sub(newLocalMeanPressure,source.reference.normalizedMeanPressure);
  for(const t of templates){
    const old=source.templates.find(x=>x.key===t.key),previous=sumStateRows(G,old.previous,old.waveRows),
      increment=[...t.increment,{m:0,velocity:[C.zero,C.zero,C.zero],pressure:C.value(localPressureDifference)}],
      update=exactAngularResidualUpdate(G,{geometry:t.lift.geometry,phase:t.phase,k,previous,increment,oldFlatResidual:t.oldFlatResidual}),
      newMean=[{m:0,velocity:old.previous[0].velocity,pressure:C.value(newLocalMeanPressure)}],
      assembled=exactAngularResidualUpdate(G,{geometry:t.lift.geometry,phase:t.phase,k,previous:newMean,increment:t.waveRows,oldFlatResidual:t.oldFlatResidual}),
      waveResidual=subtractVectorRows(G,assembled.direct,assembled.oldResidual),verify=createFactoredRationalVerifier(G,{maxTerms:180000,maxProducts:12000000}),
      checks=update.defect.flatMap(row=>row.value.flatMap((z,j)=>parts.map(part=>({id:'actual-forced-full-update-'+t.key+'-'+row.m+'-'+j+'-'+part,...verify(z[part])}))));
    if(checks.some(x=>!x.pass)||!same(waveResidual.map(r=>r.m),t.sourceFiniteInventory.nextResidual))
      fail('The actual forced substep lost a pressure increment, quadratic remainder or newly generated harmonic.');
    t.update=update;t.updatedMeanRows=newMean;t.nextAngularSource=waveResidual.filter(r=>r.m!==0);t.waveResidual=waveResidual;t.residualChecks=checks;
    t.realWaveResidual=realVectorRows(G,waveResidual,k,t.phase);
  }
  const velocityFields=[0,1,2].map(j=>completeSourceField(source,templates,'ActualForcedCurrent_velocity_'+j,t=>t.reconstruction.velocity[j],{kind:'velocity'})),
    angularPressureField=completeSourceField(source,templates,'ActualForcedCurrent_angular_pressure',t=>t.reconstruction.pressure,{kind:'pressure'}),
    residualFields=[0,1,2].map(j=>completeSourceField(source,templates,'ActualForcedCurrent_angular_residual_'+j,t=>t.realWaveResidual[j],{kind:'residual'})),
    meanVelocity=[background.b,background.V,background.G].map((x,j)=>G.add(x,source.mean.stages.moments.velocity[['beta','v','gamma'][j]])),
    velocity=meanVelocity.map((x,j)=>G.add(x,velocityFields[j].root)),
    fullPressure=G.add(band.fields.pressure,latestMean.pressure.value,angularPressureField.root),geometry={...pressure.geometry,theta},
    direct=exactRealCylindricalPDE(G,{geometry,velocity,pressure:fullPressure}),
    meanDirect=exactRealCylindricalPDE(G,{geometry,velocity:meanVelocity,pressure:G.add(band.fields.pressure,latestMean.pressure.value)}),
    assembledResidual=meanDirect.conservativeResidual.map((x,j)=>G.add(x,residualFields[j].root)),
    checks=[...templates.flatMap(t=>[...t.conjugacy,...t.residualChecks,...t.forced.flatMap(f=>f.checks)]),
      {id:'actual-all20-forced-positive-source-systems',pass:templates.length===10&&templates.every(t=>t.forced.length===2&&same(t.increment.map(r=>r.m).sort((a,b)=>a-b),[-2,-1,1,2]))},
      {id:'actual-after-forced-all162-covariance-and-wave-fields',pass:[...Object.values(covarianceFields),...velocityFields,angularPressureField,...residualFields].every(f=>f.contributions===162)},
      {id:'actual-after-forced-mean-pressure-recomputed-from-new-full-W',pass:latestMean.mean.fullAngularCovariance===covariance&&latestMean.checks.every(x=>x.pass)&&pressureDifference!==G.zero},
      {id:'actual-after-forced-all-new-current-harmonics',pass:templates.every(t=>same(t.nextAngularSource.map(r=>r.m),[-4,-3,-2,-1,1,2,3,4])&&t.update.newQuadraticRemainderRetained&&t.update.oldFlatResidualRetained)},
      {id:'actual-after-forced-source-support-and-private-input',pass:templates.every(t=>t.support.checks.every(x=>x.pass))&&pressure.cover.proof.allCrossLabelProductsVanish&&
        assertGlobalInitializedAngular(source)&&G.functionDefinitionsUnchanged(definitions)}];
  if(checks.some(x=>!x.pass))fail('The complete actual forced current failed a source/pressure/harmonic check.');
  const result={schema:'MathScope.N6.GlobalActualForcedCurrent/1',G,input:source,
    source:{paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,sourcePrefixCount:start,
      actualInput:'Privately constructed temporal→fresh-pressure→new-five-moments→fresh-pressure current.',
      operators:['complete-current-angular-residual','original-fixed-lift-H_w','original-forced-7.13','original-psi-full-curl',
        'complete-new-angular-covariance','fresh-full-mean-pressure-8.12','complete-physical-PDE'],
      originalM2Modified:false,primaryCoefficientsRepurposedAsForcedSolutions:false,callerSourceOrNumericalBoundsAccepted:false},
    templates,assembly:{covarianceFields,velocityFields,angularPressureField,residualFields,allOriginalSourceLabels:81,signedSourceContributions:162,
      exactPositiveSourceSystems:20,exactNegativeConjugateSolutionRoutes:20,originalCover:pressure.cover.proof,
      fullMeanWaveProductsRetained:true,crossLabelProductsRemovedOnlyByActualSupportIdealAndOriginalDisjointness:true},
    mean:{...latestMean,previousPressure:source.mean.stages.moments.pressure.value,pressureDifference,fullCurrentCovariance:covariance,
      completeBetaVGamma:source.mean.stages.moments.velocity,sourceStress:pressure.residual.fullOriginalStress},
    global:{geometry,velocity,pressure:fullPressure,direct,assembledResidual,meanResidual:meanDirect,
      originalBackgroundPressure:band.fields.pressure,fullMeanPressure:latestMean.pressure.value,allAngularPressure:angularPressureField.root,
      oldPhysicalResidual:source.global.direct.conservativeResidual,
      oldFlatResidual:source.global.oldFlatResidual,
      equalityScope:'Executed complete local harmonic updates, full fixed-label physical normalization, and the actual source support/disjointness proof. Both whole-source expression paths are retained.'},
    checks,scope:{actualOriginalForcedAngularSubstepConstructed:true,actualCompleteUpdatedCurrentConstructed:true,
      everyCurrentNonzeroModeUsedAsSource:true,allOriginalAndNewPressureTermsRetained:true,allNextFiniteHarmonicsConstructed:true,
      sourceDerivativeClosureAudited:false,numericalWholeFieldEnclosure:false,originalProp9_5ClassBoundsEstablished:false,
      initializedJ0:false,allCorrectionStagesConstructed:false,originalN602Complete:false,originalN603Complete:false,completeN6:false}};
  const count=G.nodes.length;seals.set(result,{G,source,start,count,delta:canonicalStringify(G.nodes.slice(start,count)),
    definitions:G.captureFunctionDefinitions(),record:canonicalStringify(record(result))});
  progress(context,'actual-all162-forced-current-full-pressure-and-new-residual-sealed',G);return result;
}

export function assertGlobalForcedCurrent(s){
  const seal=seals.get(s);if(!seal||seal.G!==s.G||seal.source!==s.input||seal.record!==canonicalStringify(record(s))||
    seal.delta!==canonicalStringify(s.G.nodes.slice(seal.start,seal.count))||!s.G.functionDefinitionsUnchanged(seal.definitions))
    fail('Use the unchanged privately constructed actual full forced current.');
  assertSourceCoupledExpressions(s.G,s.input.mean.G);assertGlobalInitializedAngular(s.input);
  s.templates.forEach(t=>t.forced.forEach(f=>{assertForcedAngularInverse(f.inverse);assertMappedForcedAngularCurl(f.mapped);}));return true;
}

export async function globalForcedCurrentCertificate(s){
  assertGlobalForcedCurrent(s);const seal=seals.get(s),source=await globalInitializedAngularCertificate(s.input),
    encoded=canonicalStringify({sourceGraph:source.graph,record:record(s),nodes:s.G.nodes.slice(seal.start,seal.count),definitions:seal.definitions});
  return {...record(s),sourceGraph:source.graph,
    graph:{sha256:await sha256(encoded),nodeCount:seal.count,deltaNodeCount:seal.count-seal.start,canonicalBytes:new TextEncoder().encode(encoded).length},
    execution:'ACTUAL_COMPLETE_CURRENT_FORCED_ANGULAR_SUBSTEP_AND_REFRESHED_PRESSURE',
    originalClassAndAllStageCompletionStillRequired:true,numericalWholeFieldEnclosure:false};
}

export function globalForcedCurrentSourceRoots(s){
  assertGlobalForcedCurrent(s);
  return [...new Set([...s.global.velocity,s.global.pressure,...s.global.direct.conservativeResidual,...s.global.assembledResidual,
    s.mean.mean.gr,s.mean.mean.P,s.mean.mean.Jtheta,s.mean.mean.Jz,s.mean.mean.Etheta,s.mean.mean.Ez,
    ...s.templates.flatMap(t=>[...t.nextAngularSource.flatMap(r=>vectorRoots(r.value)),...t.forced.flatMap(f=>mappedForcedAngularCurlRoots(f.mapped))])])];
}
