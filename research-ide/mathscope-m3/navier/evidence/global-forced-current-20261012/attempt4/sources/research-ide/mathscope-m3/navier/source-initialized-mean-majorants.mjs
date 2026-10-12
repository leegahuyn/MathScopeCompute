/** Bind the fixed source five-profile operator bounds to the actual newly
 * computed post-temporal P/J. The two graphs have separate root namespaces.
 * No current defect norm is manufactured by this source identity bridge.
 */
import {assertGlobalInitializedMean} from './source-global-initial-mean.mjs';
import {exactFiveMomentCoefficients} from './source-global-moment.mjs';
import {assertOriginalMeanMapOperatorSeminorms} from './source-fixed-mean-majorants.mjs';
import {createFactoredRationalVerifier} from './forced-rational-identity.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});},
  names=['P','Jtheta','Jz'],same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);

/** Copy complete elementary fixed-source bodies, with explicitly bound
 * source coordinates. All integrands and both endpoints are copied. This
 * utility by itself grants no original-source authority to its arguments.
 */
export function copyFixedMeanSourceExpressions(from,to,bindings=[]){
  if(from.source?.parameterExpressionSHA256!==to.source?.parameterExpressionSHA256||
    !Array.isArray(bindings)||bindings.some(row=>!Array.isArray(row)||row.length!==2||!from.nodes[row[0]]||!to.nodes[row[1]])||
    new Set(bindings.map(row=>row[0])).size!==bindings.length)
    fail('Fixed profile copying requires the same original parameter graph and a complete nonduplicated coordinate binding.');
  const map=new Map(bindings),identities=[];
  const copy=id=>{
    if(map.has(id))return map.get(id);const n=from.nodes[id];if(!n)fail('A retained fixed mean source body is missing.');
    const {op,args}=n;let out;
    if(op==='rational')out=to.q(...args);
    else if(op==='source_parameter')out=to.parameter(args[0]);
    else if(op==='coordinate')out=to.fresh('bound_original_mean_profile');
    else if(op==='add')out=to.add(...args.map(copy));
    else if(op==='multiply')out=to.mul(...args.map(copy));
    else if(op==='inverse')out=to.inv(copy(args[0]));
    else if(op==='integer_power')out=to.pow(copy(args[0]),args[1]);
    else if(op==='exp')out=to.exp(copy(args[0]));
    else if(op==='log_positive')out=to.log(copy(args[0]));
    else if(op==='sqrt_positive')out=to.sqrt(copy(args[0]));
    else if(op==='smooth_piecewise')out=to.choose(...args.map(copy));
    else if(op==='definite_integral')out=to.integral(copy(args[0]),copy(args[1]),copy(args[2]),copy(args[3]));
    else fail('A fixed mean definition contains an unrecognized non-elementary source operation '+op+'.');
    map.set(id,out);identities.push({from:id,to:out,operation:op});return out;
  };
  return {copy,identities,mapping:map,sourceAuthenticated:false,actualIntegrandsAndEndpointsRetained:true};
}

const record=s=>({schema:s.schema,source:s.source,coordinateBinding:s.coordinateBinding,
  fixedDefinitionChecks:s.fixedDefinitionChecks,units:s.units,currentDefects:s.currentDefects,
  actualCoefficientChecks:s.actualCoefficientChecks,operatorBounds:s.operatorBounds,
  implications:s.implications,checks:s.checks,scope:s.scope});

/** The actual moment constructor deliberately removes its local `g`
 * object from bumps because it includes callable integration helpers.
 * Its complete serializable geometry is already retained by the SAME
 * private current. Resolve that actual shape explicitly; this helper
 * alone gives a caller-created object no source authority.
 */
export function originalInitializedMeanProfileBindingInputs(mean){
  const G=mean?.G,current=mean?.template?.current,band=mean?.temporal?.pressure?.current?.band,
    b=mean?.template?.bumps,g=current?.mean?.geometry;
  if(!G||!current||mean?.temporal?.pressure?.current!==current||!band||!b||!g||
    [g.s,g.X0,g.x0,g.R,b.R,b.x].some(root=>!Number.isSafeInteger(root)||!G.nodes[root])||
    g.s!==band.chart.s||g.R!==b.R||b.R!==band.coordinates.R||g.X0!==G.parameter('X0Imean')||
    g.x0!==G.mul(G.sqrt(G.mul(G.q(2),g.X0)),G.exp(G.q(1,2))))
    fail('The actual stored current mean geometry and the unchanged original bump template must agree.');
  return {G,band,bumps:b,geometry:g,sourceAuthenticated:false,
    retainedGeometryPath:'initializedMean.template.current.mean.geometry',
    localCallableGeometryRequired:false};
}

export function attachInitializedMeanOperatorMajorants(mean,operator){
  assertGlobalInitializedMean(mean);assertOriginalMeanMapOperatorSeminorms(operator);
  const resolved=originalInitializedMeanProfileBindingInputs(mean),{G,band,bumps:b,geometry:g}=resolved,N=operator.G,F=operator.sourceBodies,
    c=F.coordinates,bindings=[[c.s,g.s],[c.eta,band.chart.eta],[c.R,b.R],[c.x,b.x]],
    copied=copyFixedMeanSourceExpressions(N,G,bindings),verify=createFactoredRationalVerifier(G,{maxTerms:120000}),
    fixed=(id,source,actual)=>({id,sourceRoot:source,actualRoot:actual,copiedRoot:copied.copy(source),
      identicalRetainedBody:copied.copy(source)===actual,...verify(G.sub(copied.copy(source),actual))}),
    fixedDefinitionChecks=[fixed('original-source-lambda',F.lambda,b.lambda),fixed('original-source-positive-h',F.h,band.constants.h),
      fixed('original-A',F.A,b.A),fixed('original-profile-geometric-step',F.d,b.d),fixed('original-X0',F.X0,g.X0),
      fixed('original-radial-profile-center',F.x0,g.x0),fixed('original-log-Kmean',F.logK,b.logK),fixed('original-positive-Kmean',F.K,b.K),
      fixed('original-mean-power-law-a',F.a,b.a),fixed('complete-original-flat-bump-body',F.eta0,b.eta0),
      ...F.powers.map((x,j)=>fixed('original-moment-power-'+j,x,b.powers[j])),
      ...F.mu.map((x,j)=>fixed('complete-original-moment-integral-'+j,x,b.mu[j])),
      ...F.copies.flatMap((row,j)=>[fixed('original-copy-'+j+'-profile',row.profile,b.copies[j].profile),
        fixed('original-copy-'+j+'-q-Q-scale',row.inQ,b.copies[j].inQ)])];
  if(fixedDefinitionChecks.some(row=>!row.pass))
    fail('The fixed operator norm source differs from the actual initialized mean definition: '+fixedDefinitionChecks.filter(row=>!row.pass).map(row=>row.id).join(', '));
  const q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),A=band.constants.A,s=band.chart.s,
    chartPowers={P:G.mul(q(2),A),Jtheta:G.sub(G.mul(q(2),A),q(3,2)),Jz:G.sub(G.mul(q(2),A),G.one)},
    units=names.map(target=>{
      const targets=Object.fromEntries(names.map(name=>[name,name===target?power(s,chartPowers[name]):G.zero])),
        coefficients=exactFiveMomentCoefficients(G,{angularNodes:b.powers.slice(0,3).map(p=>G.exp(G.mul(b.d,p))),
          angularFactors:b.coefficients.angularMatrix.map(row=>row[0]),angularTargets:[G.zero,G.neg(targets.P),G.neg(targets.Jz)],
          axialNode:G.exp(b.d),axialRatio:G.exp(G.mul(q(-2),b.d,b.lambda)),
          axialFactors:b.coefficients.axialMatrix.map(row=>row[0]),axialTarget:G.neg(targets.Jtheta)}),
        sourceUnit=F.units.find(row=>row.target===target),
        identityChecks=['angular','axial'].flatMap(part=>coefficients[part].map((actual,j)=>fixed('actual-unit-'+target+'-'+part+'-'+j,sourceUnit.coefficients[part][j],actual)));
      return {target,targets,coefficients,identityChecks};
    }),currentDefects=mean.bumps.actualInputDefects,
    actualVerifier=createFactoredRationalVerifier(G,{atomicNodes:names.map(name=>currentDefects[name]),maxTerms:120000}),
    actualCoefficientChecks=['angular','axial'].flatMap(part=>mean.bumps.coefficients[part].map((actual,j)=>{
      const completeLinearResponse=G.add(...units.map(unit=>G.mul(unit.coefficients[part][j],currentDefects[unit.target])));
      return {part,component:j,actual,completeLinearResponse,
        ...actualVerifier(G.sub(actual,completeLinearResponse)),allThreeActualTargetsRetained:true};
    })),
    checks=[
      {id:'private-actual-post-temporal-new-defects',pass:names.every(name=>currentDefects[name]===mean.stages.temporal.mean[name])&&
        mean.source.callerReplacementTargetsAccepted===false},
      {id:'same-original-source-parameter-and-paper',pass:operator.source.parameterExpressionSHA256===mean.source.parameterExpressionSHA256&&
        operator.source.paperSHA256===mean.source.paperSHA256},
      {id:'every-fixed-profile-and-complete-moment-body-bound',pass:fixedDefinitionChecks.every(x=>x.pass)},
      {id:'every-source-unit-response-bound-to-actual-matrix',pass:units.every(unit=>unit.identityChecks.every(x=>x.pass)&&unit.coefficients.checks.every(x=>x.pass))},
      {id:'actual-new-coefficients-are-complete-source-linear-map',pass:actualCoefficientChecks.every(x=>x.pass)},
      {id:'both-zero-velocity-moments-and-radial-product-rule-retained',pass:mean.bumps.exactRows.slice(0,2).every(row=>row.target===G.zero)&&
        mean.potential.checks.every(row=>row.pass)&&operator.entries.filter(e=>e.component==='betaOverEpsilon').length===6},
      {id:'source-only-operator-norms-do-not-invent-input-class',pass:operator.byOrder.every(row=>N.freeCoordinates(row.maximum).size===0)&&
        operator.scope.currentDefectClassCertified===false&&operator.scope.fullCurrentAllOrderClassCertified===false}
    ];
  if(checks.some(row=>!row.pass))fail('The actual initialized mean operator majorant attachment failed: '+checks.filter(row=>!row.pass).map(row=>row.id).join(', '));
  const result={schema:'MathScope.N6.ActualInitializedMeanOperatorMajorantAttachment/1',G,mean,operator,
    source:{sourceProfile:operator.source.profileId,paperSHA256:mean.source.paperSHA256,parameterExpressionSHA256:mean.source.parameterExpressionSHA256,
      actualCurrentPrefixCount:mean.source.sourcePrefixCount,exactSequence:mean.source.exactSequence,
      actualCoefficientNamespace:'initializedMean.G',operatorConstantNamespace:'operator.G',
      sourceCopyWasACompleteDefiningBodyCopy:true,sourceParametersReplaced:false},
    coordinateBinding:bindings.map(([from,to])=>({operatorCoordinate:from,actualSourceExpression:to})),
    fixedDefinitionChecks,units,currentDefects,actualCoefficientChecks,
    operatorBounds:operator.byOrder.map(row=>({...structuredClone(row),graphNamespace:'operator.G'})),
    implications:{sourceInputs:'These exact newly recomputed post-temporal P,Jtheta,Jz, including all current and pressure terms.',
      inputNorms:'Their actual S_H scalar-defect slow seminorm generator is still required; no finite value or q-power is supplied here.',
      mean:'Once those source inputs have S_H bounds, the exact attached fixed mean map has M_H bounds with the displayed source-only constants and unchanged S powers.',
      radial:'The actual beta=-epsilon*D_Z psi retains both source-kernel and target derivatives and gains one epsilon power.',
      pressure:'The full newly reconstructed p_m is retained in the initialized state; this leaf alone does not certify its W class.',
      allOrders:'The same complete source operator and bound-generation recipe applies at each finite requested derivative order on the fixed compact Imean collar.'},
    checks,scope:{actualFixedSourceOperatorBoundToNewCurrentDefects:true,actualSourceUnitMapAndAllFiveCoefficientsVerified:true,
      requestedFixedMapOperatorNormsConstructed:true,actualCurrentInputClassBoundsCertified:false,
      fullInitializedStateClassCertified:false,originalProp9_5Proved:false,wholeN6Complete:false,callerClassFlagsAccepted:false}};
  seals.set(result,{G,mean,operator,record:canonicalStringify(record(result))});return result;
}

export function assertInitializedMeanOperatorMajorants(result){
  const seal=seals.get(result);
  if(!seal||seal.G!==result.G||seal.mean!==result.mean||seal.operator!==result.operator||seal.record!==canonicalStringify(record(result)))
    fail('Use the unchanged privately attached initialized-current operator majorants.');
  assertGlobalInitializedMean(result.mean);assertOriginalMeanMapOperatorSeminorms(result.operator);return true;
}
