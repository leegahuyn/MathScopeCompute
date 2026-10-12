/** Complete initial angular field and residual of the authentic source.
 *
 * The input is the sealed all-label current with its full auxiliary mean
 * pressure. Every local primary curl, its homogeneous pressure, and every
 * m+n product is retained. This is the exact PRE-TEMPORAL initial current;
 * it is never substituted for a post-temporal or forced-corrected state.
 */
import {assertGlobalCurrentPressure,globalCurrentPressureCertificate} from './source-global-pressure.mjs';
import {guardGlobalLocalBody,globalGraphEqual} from './source-global-current.mjs';
import {exactHarmonicComplexAlgebra,exactAngularResidualUpdate,
  exactRealCylindricalPDE,originalCylindricalDifferentialOperators} from './source-harmonic-assembly.mjs';
import {materializeExactAuxiliarySourceClosure,declareExactAuxiliaryMaterializationBudget} from './source-auxiliary-derivative-closure.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  record=s=>({schema:s.schema,source:s.source,domain:s.domain,local:s.local,global:s.global,checks:s.checks,scope:s.scope}),
  progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});},
  dot=(G,a,b)=>G.add(...a.map((x,j)=>G.mul(x,b[j])));

/** Exact exponent accounting in the fixed reference chart. Each affine
 * pair is [constant, coefficient of h], so no value of the source's tiny
 * positive h is rounded. This is a calculus identity, not source authority.
 */
export function originalAngularNormalizationLedger(){
  const add=(...rows)=>rows.reduce((a,b)=>[a[0]+b[0],a[1]+b[1]],[0,0]),
    A=[1,2],D=[1,-2],h=[0,2],half=[1,0],one=[2,0], // doubled exponents
    residual=add(A,A,half),routes={radialTransport:add(A,A,half),axialTransport:add(A,A,h,D),
      slowTime:add(A,h,one),fastTime:add(A,one,h),viscous:add(A,h,one),pressure:add(A,A,half)},
    checks=Object.entries(routes).map(([id,exponent])=>({id,twiceExponent:exponent,expectedTwiceExponent:residual,pass:same(exponent,residual)}));
  return {schema:'MathScope.N6.OriginalAngularNormalization/1',A:'1/2+h',D:'1/2-h',
    sourceVelocityScale:'Q_label^(-A)',sourcePressureScale:'Q_label^(-2A)',sourceResidualScale:'Q_label^(-2A-1/2)',
    velocityPullback:'(Q_ref/Q_label)^A',pressurePullback:'(Q_ref/Q_label)^(2A)',residualPullback:'(Q_ref/Q_label)^(2A+1/2)',
    slowScales:['ratio^(1/2)','ratio^D','ratio'],
    epsilonRatio:'epsilon_ref/epsilon_label=ratio^h',
    originalFastSpace:'a_ref*Lambda^(i_label-i0)=sqrt(ratio)*a_label',
    originalFastTime:'ci_ref*Tg^(i_label-i0)/ci_label=ratio^(1+h)',
    checks,pass:checks.every(x=>x.pass),binary64SourceH:false,sourceAuthenticated:false};
}

/** Retain the true homogeneous primary pressure. The original source frame
 * has already solved the moving-normal homogeneous ODE. Multiplication by
 * the original scalar cutoff preserves n dot t=0, and its pressure is the
 * same scalar multiple of i*(n^T*K-n'^T)*t/(k*|n|^2).
 */
export function originalHomogeneousPrimaryPressure(G,{normal,nPrime,K,k,amplitude}={}){
  if(!Array.isArray(normal)||normal.length!==3||!Array.isArray(nPrime)||nPrime.length!==3||!Array.isArray(K)||K.length!==3||K.some(r=>r.length!==3)||
    !Array.isArray(amplitude)||amplitude.length!==3||![...normal,...nPrime,...K.flat(),k,...amplitude].every(x=>Number.isSafeInteger(x)&&G.nodes[x]))
    fail('Supply every original normal, moving-normal derivative, principal matrix and complete cutoff primary amplitude.','INVALID_INPUT');
  const squared=dot(G,normal,normal),row=[0,1,2].map(j=>G.div(G.sub(dot(G,normal,K.map(r=>r[j])),nPrime[j]),G.mul(k,squared))),
    imaginary=dot(G,row,amplitude),normalBalance=G.sub(dot(G,normal,K.map(r=>dot(G,r,amplitude))),dot(G,nPrime,amplitude)),
    pressureTerm=G.neg(G.mul(k,squared,imaginary)),identity=globalGraphEqual(G,G.add(normalBalance,pressureTerm),G.zero,
      [...normal,...nPrime,...K.flat(),...amplitude,k,squared]);
  if(!identity.pass)fail('The full moving-normal primary pressure identity failed.');
  return {value:{real:G.zero,imaginary},row,normalSquared:squared,normalBalance,pressureTerm,identity,
    originalEquation:'t_prime+K*t+d*t+i*k*n*pi=0 before the scalar cutoff; pi=i*(n^T*K-n_prime^T)*t/(k*|n|^2).',
    cutoffTangencyPremiseRequired:true,homogeneousPrimaryNotForcedInverse:true,normalForcingDeclaredZeroOnlyForThisPrimary:true,
    pressureOmitted:false,sourceAuthenticated:false};
}

function subtractVectorRows(G,left,right){
  const C=exactHarmonicComplexAlgebra(G),modes=[...new Set([...left,...right].map(r=>r.m))].sort((a,b)=>a-b),
    at=(rows,m)=>rows.find(r=>r.m===m)?.value??[C.zero,C.zero,C.zero];
  return modes.map(m=>({m,value:at(left,m).map((x,j)=>C.sub(x,at(right,m)[j]))}));
}

function realVectorRows(G,rows,k,phase){
  return [0,1,2].map(j=>G.add(...rows.map(({m,value})=>{
    const argument=G.mul(k,G.q(m),phase);return G.sub(G.mul(value[j].real,G.cosine(argument)),G.mul(value[j].imaginary,G.sine(argument)));
  })));
}

function shareCompleteAngularFields(pressure,local,context){
  const G=pressure.G,{current,cover}=pressure,{band}=current,{A}=band.constants,{theta,R,Z,T,ell}=band.coordinates,
    power=(x,a)=>G.exp(G.mul(a,G.log(x))),parameters=[...cover.parameters,theta],directions=[...cover.directions,theta],
    localParameters=[...cover.localParameters,theta],
    atRepresentative=body=>G.simultaneousSubstitute(body,[band.coordinates.Xrep,band.coordinates.etaRep,band.coordinates.sRep],
      [current.representative.roots.X,current.representative.roots.eta,current.representative.roots.s]),
    bodies=local.map(row=>{
      const wave=realVectorRows(G,row.waveRows.map(x=>({m:x.m,value:x.velocity})),row.k,row.phase),
        pressureBody=G.add(...row.waveRows.map(({m,pressure:p})=>{
          const argument=G.mul(row.k,G.q(m),row.phase);return G.sub(G.mul(p.real,G.cosine(argument)),G.mul(p.imaginary,G.sine(argument)));
        })),residual=realVectorRows(G,row.waveResidual,row.k,row.phase),
        fields={...Object.fromEntries(wave.map((x,j)=>['velocity_'+j,x])),pressure:pressureBody,
          ...Object.fromEntries(residual.map((x,j)=>['residual_'+j,x]))};
      return Object.fromEntries(Object.entries(fields).map(([name,body])=>{
        const guarded=guardGlobalLocalBody(G,current.geometry,current.local.slowCutoff,body),
          fixed=atRepresentative(guarded.body),system=G.defineExpressionFunction({name:'OriginalInitialAngular_'+row.sign+'_'+name,parameters:localParameters,body:fixed});
        return [name,{system,originalBody:body,guardedBody:guarded.body,fixedBody:fixed,guards:guarded}];
      }));
    });
  const fieldNames=Object.keys(bodies[0]),definitions={},roots={},rowsByName=Object.fromEntries(fieldNames.map(name=>[name,[]]));
  for(const coverRow of cover.rows){
    const b=cover.bands[coverRow.relativeBand+1];
    for(const sign of coverRow.signs){
      const source=local[sign.sourceLocalRow],values=[...sign.values,theta],derivativeMaps=[...sign.derivativeMaps,[{parameter:9,coefficient:G.one}]],
        coefficients={velocity:power(b.ratio,A),pressure:sign.coefficient,residual:power(b.ratio,G.add(G.mul(G.q(2),A),G.q(1,2)))};
      for(const name of fieldNames){
        const kind=name.split('_')[0];
        rowsByName[name].push({localSystem:bodies[sign.sourceLocalRow][name].system,values,derivativeMaps,coefficient:coefficients[kind],guards:coverRow.guards,
          label:{key:coverRow.key,ell:coverRow.label.ell,grid:coverRow.label.grid,sign:source.sign,countBoxOnce:true,signIsInsideBox:true}});
      }
    }
  }
  for(const name of fieldNames){
    definitions[name]=G.definePeriodicIndexedField({name:'OriginalAll81InitialAngular_'+name,parameters,directions,rows:rowsByName[name],
      sourceRecipe:{actualSourceCurrent:true,all81Boxes:true,bothSigns:true,physicalAngleRetained:true,
        completeLocalFullCurl:true,homogeneousPrimaryPressureIncluded:true,allGeneratedAngularModes:true,
        labelsAndNearestCopiesFrozenBeforeDifferentiation:true,sourceFlatJoins:cover.proof.localFinitenessAndFlatJoins}});
    roots[name]=G.periodicIndexedValue(definitions[name],parameters);
  }
  progress(context,'global-angular-all162-exact-physical-curl-pressure-residual-fields',G);
  return {parameters,directions,localParameters,bodies,definitions,roots,
    completeCoverRows:cover.rows.length,signedContributions:cover.rows.reduce((n,r)=>n+r.signs.length,0),
    originalCommonCover:cover.proof,normalization:originalAngularNormalizationLedger(),
    localDerivativesTakenBeforeSourceRepresentativeSubstitution:true,allDiscreteLabelsAndCopiesFrozen:true,
    angularDerivativeParameter:theta,sourceLocalPhaseIncludesPhysicalAngle:true};
}

export function attachGlobalInitialAngularState(pressure,context={}){
  assertGlobalCurrentPressure(pressure);const G=pressure.G,{current}=pressure,{band}=current,{R,Z,T,theta,v}=band.coordinates,
    start=G.nodes.length,definitions=G.captureFunctionDefinitions(),materializationBudget=declareExactAuxiliaryMaterializationBudget(G,5000000),{epsilon,k}=band.geometry,xi=band.cutoffs.xi,
    geometry={R,Z,T,theta,xi,v,epsilon,radialFast:current.geometry.radialFast},D=originalCylindricalDifferentialOperators(G,geometry),
    C=exactHarmonicComplexAlgebra(G),baseVelocity=[band.fields.b,G.mul(R,band.fields.F),band.fields.G],basePressure=band.fields.pressure,
    base=exactRealCylindricalPDE(G,{geometry,velocity:baseVelocity,pressure:basePressure}),
    stress=current.mean.residual.fullOriginalStress,
    stressDivergence=[G.zero,G.add(D.Dr(stress[0]),G.div(G.mul(G.q(2),stress[0]),R)),G.add(D.Dr(stress[1]),G.div(stress[1],R))],
    oldFlat=[{m:0,value:base.conservativeResidual.map((x,j)=>C.value(G.add(x,stressDivergence[j])))}],
    local=[];
  for(const [index,row]of current.local.rows.entries()){
    const family=band.families[index],primaryPressure=originalHomogeneousPrimaryPressure(G,{normal:family.frame.n,nPrime:family.frame.nPrime,
      K:family.frame.principalK,k,amplitude:row.weightedAmplitude}),
      positive=row.curl.fullCoefficient.map(x=>C.scale(G.q(1,2),x)),positivePressure=C.scale(G.q(1,2),primaryPressure.value),
      waveRows=[{m:1,velocity:positive,pressure:positivePressure},{m:-1,velocity:positive.map(C.conjugate),pressure:C.conjugate(positivePressure)}],
      previous=[{m:0,velocity:baseVelocity.map(x=>C.value(x)),pressure:C.value(basePressure)}],
      update=exactAngularResidualUpdate(G,{geometry,k,phase:family.phase,previous,increment:waveRows,oldFlatResidual:oldFlat}),
      waveResidual=subtractVectorRows(G,update.direct,update.oldResidual),
      coreRoots=[...previous,...waveRows].flatMap(r=>[...r.velocity.flatMap(x=>[x.real,x.imaginary]),r.pressure.real,r.pressure.imaginary]),
      atomic=[...coreRoots,...coreRoots.flatMap(root=>[R,Z,T,xi,v].map(y=>G.derivative(root,y)))],
      coefficientChecks=update.defect.flatMap(({m,value})=>value.flatMap((x,j)=>['real','imaginary'].map(part=>({
        id:'source-local-exact-update-'+row.sign+'-'+m+'-'+j+'-'+part,
        ...globalGraphEqual(G,x[part],G.zero,atomic)})))),
      pressureBinding=primaryPressure.row.every((x,j)=>x===family.frame.pressureImaginaryRow[j]),
      checks=[{id:'source-primary-pressure-moving-normal-'+row.sign,pass:pressureBinding&&primaryPressure.identity.pass},
        {id:'source-primary-full-curl-half-conjugate-pair-'+row.sign,pass:positive.every((x,j)=>x.real===G.mul(G.q(1,2),row.curl.leading[j])&&x.imaginary===G.mul(G.q(1,2),row.curl.remainder[j]))},
        {id:'source-primary-original-integer-carrier-'+row.sign,pass:family.carrier.nonzeroAngularInteger&&row.checks.every(x=>x.pass)},
        {id:'source-primary-every-generated-mode-'+row.sign,pass:same(waveResidual.map(r=>r.m),[-2,-1,0,1,2])},
        {id:'source-primary-previous-pressure-and-flat-preserved-'+row.sign,pass:update.updatedPressure.find(r=>r.m===0).value.real===basePressure&&
          same(update.oldFlatResidual,oldFlat)&&update.newQuadraticRemainderRetained},...coefficientChecks];
    if(checks.some(x=>!x.pass))fail('An authentic initial angular coefficient failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
    local.push({sign:row.sign,phase:family.phase,k,normal:family.frame.n,normalDerivative:family.frame.nPrime,principalK:family.frame.principalK,
      sourcePulse:family.system,sourcePotential:row.potential,sourceFullCurl:row.curl.fullCoefficient,primaryPressure,
      waveRows,previous,update,waveResidual,nonzeroAngularForcing:waveResidual.filter(r=>r.m!==0),
      originalHomogeneousPrimary:true,forcedInverseApplied:false,checks,
      fixedLabelSourceDomain:band.chart,sourceCutoffs:current.local.slowCutoff,
      pulseEndpointRemaindersKept:'All psi/chi/slow-cutoff derivatives remain inside the actual full curl and full residual; no homogeneous cutoff tail is set to zero.'});
    progress(context,'global-angular-source-full-local-harmonics-and-pressure-'+row.sign,G,{modes:5});
  }
  const assembly=shareCompleteAngularFields(pressure,local,context),commonGeometry={...pressure.geometry,theta},
    waveVelocity=[0,1,2].map(j=>assembly.roots['velocity_'+j]),
    velocity=baseVelocity.map((x,j)=>G.add(x,waveVelocity[j])),
    fullPressure=G.add(basePressure,pressure.pressure.value,assembly.roots.pressure),
    direct=exactRealCylindricalPDE(G,{geometry:commonGeometry,velocity,pressure:fullPressure}),
    referenceBase=exactRealCylindricalPDE(G,{geometry:commonGeometry,velocity:baseVelocity,pressure:G.add(basePressure,pressure.pressure.value)}),
    assembledResidual=referenceBase.conservativeResidual.map((x,j)=>G.add(x,assembly.roots['residual_'+j])),
    crossTerms={source:pressure.cover.proof,allCrossLabelProductsVanish:pressure.cover.proof.allCrossLabelProductsVanish,
      actualSmoothDisjointPalette:current.geometry.palette,originalTorus:current.geometry.torus,
      requiredIdentity:'div((sum_l w_l) tensor(sum_l w_l))=sum_l div(w_l tensor w_l), since distinct source support closures are disjoint and every derivative has the same flat zero extension.',
      arbitraryOverlappingFieldsAccepted:false,zeroInferredFromFrequencySeparation:false},
    checks=[...local.flatMap(r=>r.checks),
      {id:'global-angular-same-actual-162-source-contributions',pass:assembly.completeCoverRows===81&&assembly.signedContributions===162&&Object.values(assembly.definitions).every(id=>G.periodicIndexedSystem(id).rows.length===162)},
      {id:'global-angular-original-pressure-all-three-parts',pass:fullPressure===G.add(basePressure,pressure.pressure.value,assembly.roots.pressure)&&pressure.scope.actualAllAuxiliaryModesRetained},
      {id:'global-angular-full-cylindrical-normalization',pass:assembly.normalization.pass&&band.constants.A===G.add(G.q(1,2),band.constants.h)&&band.constants.D===G.sub(G.q(1,2),band.constants.h)},
      {id:'global-angular-source-disjoint-nonlinear-products',pass:crossTerms.allCrossLabelProductsVanish&&current.geometry.palette.pass&&current.geometry.torus.pass},
      {id:'global-angular-source-label-flat-join-conventions',pass:assembly.localDerivativesTakenBeforeSourceRepresentativeSubstitution&&assembly.allDiscreteLabelsAndCopiesFrozen&&
        assembly.originalCommonCover.exactSourceAuthority},
      {id:'global-angular-original-source-definitions-unchanged',pass:G.functionDefinitionsUnchanged(definitions)&&assertGlobalCurrentPressure(pressure)}];
  if(checks.some(x=>!x.pass))fail('The complete authentic initial angular assembly lost a source premise.');
  const result={schema:'MathScope.N6.GlobalActualInitialAngular/1',G,pressure,
    source:{paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,
      originalM2Unchanged:true,privateFullPressureAndCurrentSealsUsed:true,callerFieldsOrForcingAccepted:false,sourcePrefixCount:start,
      materializationBudget,actualOriginalHomogeneousPrimaryPressureIncluded:true,primaryCoefficientRepurposedAsForcedSolution:false},
    domain:current.domain,local,
    global:{geometry:commonGeometry,assembly,velocity:{background:baseVelocity,waves:waveVelocity,value:velocity},
      pressure:{background:basePressure,fullAuxiliaryMean:pressure.pressure.value,nonzeroAngular:assembly.roots.pressure,value:fullPressure},
      direct,assembledResidual,referenceBaseResidual:referenceBase.conservativeResidual,
      oldFlatResidual:{local:oldFlat,fullStressDivergence:stressDivergence,numericalZeroAssumed:false,
        classScope:'The inherited original background flatness theorem is separate; these exact residual roots are retained whether or not a numerical flatness bound has been evaluated.'},
      crossTerms,sourceFiniteModeInventory:{perSignedLabel:[-2,-1,0,1,2],nonzeroPerSignedLabel:[-2,-1,1,2],
        completeSignedLabels:162,maximumLocalHarmonic:2,discardedFiniteModes:[],infiniteBackgroundTail:'The original validated coefficient-prefix atlas omits only exactly zero source cutoff terms.'},
      directVersusAssemblyScope:'Both exact expression paths are constructed. Their equality uses the executed local coefficient identities, the fixed-label physical normalization and the original sealed disjoint-support/flat-join cover. A requested derivative audit must still materialize their complete source closure.'},
    checks,scope:{actualOriginalInitialAngularFieldConstructed:true,actualOriginalPrimaryPressureConstructed:true,
      actualInitialNonzeroForcingCoefficientsConstructed:true,all162SourceContributionsRetained:true,allFiniteHarmonicProductsRetained:true,
      actualPostTemporalCurrent:false,forcedNonzeroInverseApplied:false,allCorrectionStagesConstructed:false,
      sourceDerivativeClosureAudited:false,directGlobalNumericalResidualEnclosure:false,
      initializedJ0:false,originalN602Complete:false,originalN603Complete:false,completeN6:false,newLeanKernelProof:false}};
  const count=G.nodes.length;seals.set(result,{G,pressure,start,count,delta:canonicalStringify(G.nodes.slice(start,count)),definitions:G.captureFunctionDefinitions(),record:canonicalStringify(record(result))});
  progress(context,'global-angular-actual-initial-field-and-all-harmonics-sealed',G);return result;
}

export function assertGlobalInitialAngularState(s){
  const seal=seals.get(s);if(!seal||seal.G!==s.G||seal.pressure!==s.pressure||seal.record!==canonicalStringify(record(s))||
    seal.delta!==canonicalStringify(s.G.nodes.slice(seal.start,seal.count))||!s.G.functionDefinitionsUnchanged(seal.definitions))
    fail('Use the unchanged privately constructed original full angular source; serialized arrays have no authority.');
  assertGlobalCurrentPressure(s.pressure);return true;
}

export async function globalInitialAngularCertificate(s){
  assertGlobalInitialAngularState(s);const seal=seals.get(s),sourcePressure=await globalCurrentPressureCertificate(s.pressure),
    encoded=canonicalStringify({sourcePressureGraph:sourcePressure.graph,record:record(s),nodes:s.G.nodes.slice(seal.start,seal.count),definitions:seal.definitions});
  return {...record(s),sourcePressure,graph:{sha256:await sha256(encoded),nodeCount:seal.count,deltaNodeCount:seal.count-seal.start,canonicalBytes:new TextEncoder().encode(encoded).length},
    execution:'ACTUAL_INITIAL_FULL_ANGULAR_SOURCE_EXPRESSION_CONSTRUCTION',numericalSourceValues:false,
    remaining:['Derivative closure audit of both complete physical paths.','The actual post-temporal and five-moment mean state.',
      'Every current nonzero mode solved by the original zero-data forced inverse, with cutoff tails retained.','All finite stages and original class/convergence bounds.']};
}

export async function auditGlobalInitialAngularDerivatives(s,context={}){
  assertGlobalInitialAngularState(s);const G=s.G,start=G.nodes.length,materializationBudget=declareExactAuxiliaryMaterializationBudget(G,5000000),
    roots=[...s.global.velocity.value,s.global.pressure.value,...s.global.direct.conservativeResidual,...s.global.direct.advectiveResidual,s.global.direct.divergence,
      ...s.global.assembledResidual,...s.local.flatMap(row=>[...row.nonzeroAngularForcing.flatMap(r=>r.value.flatMap(x=>[x.real,x.imaginary])),
        ...row.waveRows.flatMap(r=>[r.pressure.real,r.pressure.imaginary]),...row.update.defect.flatMap(r=>r.value.flatMap(x=>[x.real,x.imaginary]))])],
    closure=materializeExactAuxiliarySourceClosure(G,roots,{maxExpressions:100000,onProgress:context.onProgress}),
    checks=[{id:'actual-angular-all-requested-shared-derivatives',pass:closure.allRequestedSharedBodiesMaterialized&&closure.baseClosure.allRequestedSharedBodiesMaterialized},
      {id:'actual-angular-all-original-cover-rows',pass:closure.allDeclaredCoverRowsRetained},
      {id:'actual-angular-source-still-private-unchanged',pass:assertGlobalInitialAngularState(s)}];
  if(checks.some(x=>!x.pass))fail('An actual full angular derivative body or source label was omitted.');
  const source=await globalInitialAngularCertificate(s),encoded=canonicalStringify({sourceGraph:source.graph,closure,nodes:G.nodes.slice(start),definitions:G.captureFunctionDefinitions()});
  return {schema:'MathScope.N6.GlobalActualInitialAngularDerivativeAudit/1',source,closure,checks,materializationBudget,
    graph:{sha256:await sha256(encoded),nodeCount:G.nodes.length,deltaNodeCount:G.nodes.length-start,canonicalBytes:new TextEncoder().encode(encoded).length},
    actualSourceBodiesExecuted:true,numericalWholeFieldEnclosure:false,postTemporalCurrentConstructed:false,
    forcedCorrectionExecuted:false,originalN602Complete:false,originalN603Complete:false,completeN6:false};
}
