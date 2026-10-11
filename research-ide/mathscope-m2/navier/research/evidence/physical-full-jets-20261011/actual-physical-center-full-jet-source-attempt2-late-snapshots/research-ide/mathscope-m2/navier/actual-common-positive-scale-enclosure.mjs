/** Synchronous late attachment to the SAME private actual physical point.
 * Closed numerical endpoints contain no source root, integral or oracle.
 * The first-selector FTC replacement is a separate proved UPPER comparison;
 * original coefficients, cutoffs and b_n are never changed.
 */
import {assertActualPhysicalCenterTargetEnclosure} from './actual-physical-center-target-enclosure.mjs';
import {assertActualCommonFirstSelectorFTCUpperBounds} from './actual-common-first-selector-ftc-upper-bounds.mjs';
import {traceExactArithmeticDependencies} from './actual-common-selection-arithmetic-trace.mjs';
import {getPinnedSourceProfile} from './source-profile.mjs';
import {evaluateClosedArithmeticDefinitions} from './actual-closed-parameter-arithmetic.mjs';
import {numericalExponentialArithmetic,closedNumericalExponentialEndpoint} from './actual-numerical-exponential-arithmetic.mjs';
import {tracedArithmeticEvaluator} from './actual-selection-arithmetic-enclosure-kernel.mjs';
import {originalA13IntegralSourceAudit,encloseRepresentedOriginalA13Integrals} from './actual-original-a13-numerical-enclosure.mjs';
import {encloseFirstSelectorFromUpperComparisons,positiveBandGeometricIntervals,finiteJetPositiveScaleRecipe,finiteJetClosedNumericalScale} from './actual-positive-geometric-scale-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const publicData=r=>({schema:r.schema,request:r.request,sourceBinding:r.sourceBinding,rows:r.rows,scaleRowsByRoot:r.scaleRowsByRoot,
  absoluteValues:r.absoluteValues,rowScales:r.rowScales,roots:r.roots,diagnostics:r.diagnostics,checks:r.checks,scope:r.scope,proof:r.proof,pass:r.pass,sourceAuthenticated:r.sourceAuthenticated});
function controls(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','logCoordinateTolerance','maxOperations','maxMemoEntries','maxNodes'].includes(k)))
    fail('INVALID_INPUT','Only finite arithmetic controls and the explicit log-coordinate tolerance accompany this private source.');
  return {precisionBits:input.precisionBits??384,logCoordinateTolerance:input.logCoordinateTolerance??'1/1000000000000',
    maxOperations:input.maxOperations??100000000,maxMemoEntries:input.maxMemoEntries??30000,maxNodes:input.maxNodes??250000};
}
function assertClosed(row){
  if(!closedNumericalExponentialEndpoint(row.interval.lower)||!closedNumericalExponentialEndpoint(row.interval.upper))
    fail('INVALID_SOURCE_CONSTRUCTION','A numerical scale endpoint must contain only numerical rational constants and exp/neg.');
}

export function attachActualCommonPositiveScaleEnclosure(target,upperProof,input={},context={}){
  assertActualPhysicalCenterTargetEnclosure(target);assertActualCommonFirstSelectorFTCUpperBounds(upperProof);
  const request=controls(input),p=target.p,bodies=upperProof.bodies,G=upperProof.G,family=p.family,band=p.band,g=band.geometry,c=band.constants,
    progress=(stage,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};
  if(p!==upperProof.physicalCenter||bodies.physicalCenter!==p||family!==upperProof.family||bodies.G!==G||upperProof.upperRows.length!==8)
    fail('INVALID_SOURCE_CONSTRUCTION','The target, eight upper comparisons and all270 bodies must belong to this SAME private physical point and graph.');
  const sourceCount=G.nodes.length,profile=getPinnedSourceProfile(),definitions=profile.parametersExactExpressions,
    N=numericalExponentialArithmetic(request),parameters=evaluateClosedArithmeticDefinitions(definitions,N),
    q=x=>N.point(x),mul=(...xs)=>xs.reduce((a,b)=>N.mul(a,b),N.one()),
    first=family.selector.rows[0],a13Roots={A13SteepIntegral:239,A13FlattenIntegral:257,A13TerminalIntegral:275,Qb:259,Qp:275,terminalWait:280},
    a13=originalA13IntegralSourceAudit({nodes:G.nodes.slice(0,299).map((node,id)=>({id,node})),rootNames:a13Roots,profileDefinitions:definitions}),
    integralBounds=encloseRepresentedOriginalA13Integrals(a13,N,parameters.values),
    sourceRoots={Bnorm:c.Bnorm,E:c.E,Sminimum:family.uniformCovariance.threshold.Sminimum,ellMinimum:family.selector.ellMinimum,
      firstHistoricalLogScale:first.historicalLogScale,...Object.fromEntries(upperProof.upperRows.map(r=>['upperRequiredLog_'+r.index,r.upperRequiredLog]))},
    trace=traceExactArithmeticDependencies(G,sourceRoots,{maxNodes:request.maxNodes}),
    arithmetic=tracedArithmeticEvaluator(trace,N,{parameters:parameters.values,boundaries:integralBounds.values,maxNodeVisits:request.maxNodes});
  if(trace.nonArithmeticBoundaries.some(r=>!integralBounds.values.has(r.id)))
    fail('INVALID_SOURCE_CONSTRUCTION','An original integral or derivative remained without its independently source-proved numerical bound.');
  progress('positive-scale-original-profile-and-A13-bound',{sourceArithmeticNodes:trace.nodeCount,sourceIntegralBoundaries:trace.nonArithmeticBoundaries.length});
  let done=0;
  // The original DAG is in creation order. This avoids a large recursive
  // arithmetic cache retaining every transient endpoint on a deep path.
  for(const r of trace.nodes){arithmetic.value(r.id);if(++done%1000===0)progress('positive-scale-exact-selection-arithmetic',{completedNodes:done,totalNodes:trace.nodeCount,arithmetic:N.report()});}
  const rows=[],scaleRowsByRoot={},intervals=new Map(),reportCache=new Map(),absoluteValues=[],rowScales=[];
  function report(name,sourceRoot,value,{coarse=false,reason=null,coefficient=null}={}){
    const interval=N.toClosed(value),cacheKey=canonicalStringify(interval);let detail;
    if(coarse)detail={toleranceMet:false,individualPrecisionMet:false,originalValueRelativeToleranceGuaranteed:false,coarseReason:reason};
    else{
      if(!reportCache.has(cacheKey)){
        const lo=N.compareEndpoints(interval.lower,{rational:'0'}),hi=N.compareEndpoints(interval.upper,{rational:'0'}),negative=hi===-1;
        if(lo!==1&&!negative)fail('PRECISION_REQUIRED','The nonzero source value '+name+' could not be separated from zero.');
        const d=N.reportInterval(negative?N.neg(value):value,request);
        reportCache.set(cacheKey,{...d,sign:negative?-1:1,coordinateOf:negative?'absolute value':'positive value',individualPrecisionMet:true});
      }
      detail=reportCache.get(cacheKey);
    }
    const {lower,upper,...d}=detail,row={name,sourceRoot,interval,...d,logCoordinateWidth:d.coordinateWidth??null,
      endpointContainsOnlyNumericalConstants:true,...(coefficient?{dimensionlessCoefficient:coefficient}:{})};
    assertClosed(row);rows.push(row);if(sourceRoot!==null&&sourceRoot!==undefined){scaleRowsByRoot[String(sourceRoot)]=row;intervals.set(sourceRoot,value);}return row;
  }
  for(const name of['Bnorm','E','Sminimum','ellMinimum'])report(name,sourceRoots[name],arithmetic.value(sourceRoots[name]));
  const selected=encloseFirstSelectorFromUpperComparisons(N,{ellMinimum:arithmetic.value(sourceRoots.ellMinimum),historicalLogScale:arithmetic.value(sourceRoots.firstHistoricalLogScale),
      upperRequiredLogs:upperProof.upperRows.map(r=>arithmetic.value(r.upperRequiredLog))}),
    sigmaBox=p.numerics.centered.sigmaIntegral.integral,
    box=x=>N.fromClosed({lower:{rational:x.lower},upper:{rational:x.upper}}),
    targetIntervals=Object.fromEntries(target.numerics.rows.map(r=>[r.name,N.fromClosed(r.interval)]));
  if(!sigmaBox||!p.numerics.centered.sigmaIntegral.pass||target.numerics.rows.some(r=>!r.toleranceMet))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the actual original cutoff quadrature and the same-point full target numerical refinement.');
  const numeric=positiveBandGeometricIntervals(N,{ell:selected.ell,h:parameters.values.get('h'),u:N.div(q(2),parameters.values.get('directionalMarginKappa')),
    F:targetIntervals.F,gamma:targetIntervals.gamma,g:targetIntervals.g,tau:targetIntervals.tau,Ac:targetIntervals.Ac,profileRadius:targetIntervals.profileRadius,sigmaIntegral:box(sigmaBox)});
  const sq=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    expectedEll=G.ceiling(G.div(G.add(G.log(sq(4)),first.logScale),G.log(sq(2)))),
    checks=[{id:'same-original-first-selector-and-eight-upper-comparisons',pass:g.ell===family.selector.ellA&&g.ell===expectedEll&&
      first.smallBand===G.mul(G.add(family.selector.ellMinimum,sq(10)),G.log(sq(2)))&&upperProof.upperRows.every((r,j)=>r.originalRequiredLog===first.constraints[j].requiredLog)},
      {id:'literal-original-A13-integrands-and-positive-pinned-h',pass:a13.pass&&a13.checks.every(r=>r.pass)&&same(G.source.parametersExactExpressions,definitions)},
      {id:'original-dyadic-frequency-palette-and-Haar',pass:g.Q===G.exp(G.neg(G.mul(g.ell,G.log(sq(2)))))&&g.S===G.pow(g.ell,2)&&g.epsilon===power(g.Q,c.h)&&
        g.k===G.ceiling(G.inv(G.sqrt(g.epsilon)))&&g.Ls===G.div(G.mul(sq(2),g.r0),g.ci)&&g.haarFactor===G.mul(sq(1,2),g.Dgeom,g.ci,band.cutoffs.transverseMass)&&
        c.u===G.div(sq(2),c.kappa)&&g.r0===sq(1,1n<<34n)},
      {id:'same-private-new-point-scale-and-support-proofs',pass:p.sourceBounds.pass&&p.midplane.pass&&p.support.pass&&p.point.pass&&p.numerics.pass&&target.checks.every(r=>r.pass)},
      {id:'all-target-roots-belong-to-the-copied-physical-prefix',pass:target.numerics.rows.every(r=>same(G.nodes[r.sourceRoot],target.G.nodes[r.sourceRoot]))}];
  const scales=bodies.roots.scales,phys=bodies.physical.scales,
    namedRoots={ell:g.ell,S:g.S,Q:g.Q,epsilon:g.epsilon,k:g.k,ci:g.ci,Ls:g.Ls,r0:g.r0,Tg:g.Tg,Dgeom:g.Dgeom,u:c.u,h:c.h,
      F:target.source.roots.F,gamma:target.source.roots.gamma,g:scales.g,tau:scales.tau,Ac:scales.Ac,profileRadius:target.source.roots.r,
      transverseMass:band.cutoffs.transverseMass,J:g.haarFactor,massScale:scales.massScale,A0:scales.A0,lambda0:p.midplane.roots.lambda0,gabs:phys.gabs,
      Bs:phys.Bs,T:p.point.inverse.slow.T,R:phys.Rsharp,etaBeta:p.point.slowCutoff.value,pTilde:phys.pTilde,A:c.A,physicalQScale:phys.physicalQScale};
  for(const[name,sourceRoot]of Object.entries(namedRoots))report(name,sourceRoot,numeric[name],['T','etaBeta'].includes(name)?
    {coarse:true,reason:'A proved positive rational enclosure of the unchanged physical point; individual requested precision is not claimed.'}:{});
  for(const[k,id]of Object.entries(phys.coordinateScales))report('coordinateScale_'+k,id,numeric.coordinateScales[k]);
  for(const[k,id]of Object.entries(phys.Omega))report('Omega_'+k,id,numeric.Omega[k]);
  phys.positiveVelocityScales.forEach((id,j)=>report('physicalVelocityScale_'+j,id,numeric.V[j]));
  const exactOps={one:()=>G.one,mul:(...xs)=>G.mul(...xs),div:(a,b)=>G.div(a,b),sqrt:x=>G.sqrt(x),pow:(a,n)=>G.pow(a,n)},
    exactScales={...scales,Ls:g.Ls,k:g.k,V:phys.positiveVelocityScales,coordinateScales:phys.coordinateScales,Omega:phys.Omega};
  for(const[j,row]of [...bodies.rows,...bodies.physical.rows].entries()){
    const expected=finiteJetPositiveScaleRecipe(exactOps,exactScales,row);
    if(expected!==row.positiveExactScale)fail('INVALID_SOURCE_CONSTRUCTION','The actual positive derivative scale '+j+' differs from its independently interpreted exact recipe.');
    let r=scaleRowsByRoot[String(expected)];if(!r)r=report('finiteDerivativeScale_'+j,expected,finiteJetClosedNumericalScale(N,numeric,row));
    rowScales.push({index:j,rowKey:[row.quantity,row.sign??'physical',row.component,row.derivative].join(':'),quantity:row.quantity,sign:row.sign??null,component:row.component,derivative:row.derivative,order:row.order,
      sourceRoot:expected,positiveExactScale:expected,originalValue:row.physicalValue??row.normalizedDirectionDerivative,
      interval:{...r.interval,coordinateDefinition:r.coordinateDefinition,coordinate:r.coordinate,coordinateWidth:r.logCoordinateWidth,toleranceMet:r.toleranceMet},
      coordinateDefinition:r.coordinateDefinition,logarithmCount:r.logarithmCount,coordinate:r.coordinate,logCoordinateWidth:r.logCoordinateWidth,
      toleranceMet:r.toleranceMet,individualPrecisionMet:r.individualPrecisionMet,originalValueRelativeToleranceGuaranteed:false,actualScaleRecipeBound:true});
  }
  const D=[N.one(),numeric.Ac,numeric.u],valueRoot=(name,j)=>name==='pulseCylindrical'?p.rows[Math.floor(j/3)].center.t[j%3]:
    name==='weightedCylindrical'?p.rows[Math.floor(j/3)].retained.weighted[j%3]:name==='covariance'?p.roots.actualH[Math.floor(j/2)][j%2]:
    name==='weights'?p.roots.actualWeights[j]:name==='centers'?p.roots.actualCenters[j]:name==='mass'?p.rows[j].retained.mass:
    name==='squareRootWeights'?G.sqrt(p.roots.actualWeights[j]):name==='determinant'?G.mul(p.roots.scaledDeterminant,scales.Ac,scales.u,G.pow(scales.massScale,2)):null,
    valueScale=(name,j)=>name==='pulseCylindrical'?D[j%3]:name==='weightedCylindrical'?mul(D[j%3],numeric.A0):
      name==='covariance'?mul(D[Math.floor(j/2)+1],numeric.massScale):name==='weights'?N.div(numeric.tau,numeric.massScale):
      name==='squareRootWeights'?numeric.A0:name==='mass'?numeric.massScale:name==='determinant'?mul(numeric.Ac,numeric.u,N.pow(numeric.massScale,2)):N.one();
  for(const[name,array]of Object.entries(p.numerics.values)){
    const list=Array.isArray(array[0])?array.flat():array;
    for(const[j,coefficient]of list.entries()){
      const r=report('absolute_'+name+'_'+j,valueRoot(name,j),mul(valueScale(name,j),box(coefficient)),{coefficient});absoluteValues.push(r);
    }
  }
  for(let j=0;j<3;j++)absoluteValues.push(report('absolute_physicalCurlValue_'+j,p.physical.physicalValues[j],mul(numeric.V[j],box(p.numerics.values.weightedCylindrical[0][j])),
    {coefficient:p.numerics.values.weightedCylindrical[0][j]}));
  checks.push({id:'all-270-source-positive-normalizers-numerically-closed',pass:rowScales.length===270&&rowScales.every(r=>r.actualScaleRecipeBound&&r.toleranceMet)},
    {id:'every-positive-numerical-endpoint-closed-and-required-log-width-met',pass:rows.every(r=>r.endpointContainsOnlyNumericalConstants&&(r.individualPrecisionMet?r.toleranceMet:r.coarseReason!==null))},
    {id:'both-actual-H-columns-and-inverse-absolute-scales-enclosed',pass:absoluteValues.filter(r=>r.name.startsWith('absolute_covariance_')).length===4&&absoluteValues.filter(r=>r.name.startsWith('absolute_weights_')).length===2},
    {id:'original-prefix-and-parent-private-authority-retained',pass:G.nodes.slice(0,sourceCount).every((n,id)=>id>=p.program.nodes.length||same(n,p.G.nodes[id]))&&
      assertActualPhysicalCenterTargetEnclosure(target)&&assertActualCommonFirstSelectorFTCUpperBounds(upperProof)});
  if(checks.some(r=>!r.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual closed numerical source-scale attachment failed: '+checks.filter(r=>!r.pass).map(r=>r.id).join(', '));
  const result={schema:'MathScope.ActualCommonPositiveScaleEnclosure/1',p,target,upperProof,G,request,rows,scaleRowsByRoot,absoluteValues,rowScales,
    roots:{...namedRoots,normalizers:rowScales.map(r=>r.sourceRoot)},
    sourceBinding:{samePrivatePhysicalCenter:true,sameOriginalFirstSelector:true,originalParameterExpressionSHA256:profile.parameterExpressionSHA256,
      firstOriginalLogScale:first.logScale,originalEll:g.ell,firstFTCUpperComparisons:upperProof.upperRows.map(r=>({index:r.index,original:r.originalRequiredLog,upper:r.upperRequiredLog})),
      actualA13RootIds:a13.integrals.map(r=>r.root),positiveSourceHRetained:true},
    diagnostics:{arithmetic:N.report(),traversal:arithmetic.report(),parameterTraversal:{count:parameters.values.size,evaluationOrder:parameters.evaluationOrder},
      originalA13Audit:a13,integralBounds:integralBounds.rows,traceRoots:trace.roots,sourceArithmeticNodeCount:trace.nodeCount,
      historicalLogScale:{sourceRoot:first.historicalLogScale,interval:N.toClosed(arithmetic.value(sourceRoots.firstHistoricalLogScale)),individualPrecisionMet:false,
        reason:'Its finite positive upper endpoint is retained inside the selector maximum; it is not separately advertised as a high-accuracy numerical value.'},
      upperRequiredLogIntervals:upperProof.upperRows.map(r=>({index:r.index,sourceRoot:r.upperRequiredLog,interval:N.toClosed(arithmetic.value(r.upperRequiredLog))})),
      noOriginalFTCValueReplaced:true,allArithmeticBoundariesAccountedFor:true,sourceArithmeticEvaluationComplete:true},
    checks,proof:{selector:selected.proof,...numeric.proof,
      scaleInterpretation:'Every one of the270 positive normalizers is rebuilt by an exact source recipe and compared literally to its original root. Directed arithmetic evaluates an algebraically identical common-factor monomial before interval enclosure. A0=tau^(1/2)*g^(1/4)*Ls^(1/4)/r0 and massScale=r0^2*g^(-1/2)*Ls^(-1/2). For physical rows Bs=sqrt(2Fgamma)*u^(-3/2)/[(k sqrt epsilon)*(1+u^-2)^(3/4)], Ac=gamma*u*sqrt(1+u^-2), gabs=2F(1+gamma^2). The n copies of k cancel the n copies of k in Bs. The remaining Q exponent is -(1+n_spatial+2n_time)/2-h*(1+n+2n_time)/2. All powers of each repeated positive factor are combined first. The factors1+u^-2 and1+gamma^2 lie in[1,2], giving the explicit positive scalar bracket in the generic kernel; no rounding value is changed.',
      precision:'The finite positive endpoints contain only numerical rational constants and exp/neg. Their explicitly named iterated-log coordinate widths meet the request. No original-value relative tolerance is asserted. T and eta_beta are separately labeled coarse positive rational bounds; the dependent astronomical physical scales still have their requested log-coordinate widths checked.',
      sourceBounds:'The eight original FTC constants are upper-bounded by a separately authenticated n1,m5 construction. Original first historical and small-band terms are kept. A.13 has literal full integrand and endpoint checks with the original positive h; no integral, derivative or scale is replaced by zero.'},
    scope:{sameActualPhysicalPoint:true,actualCommonBnormAndEllNumericallyEnclosed:true,actualQepsilonKciLsJNumericallyEnclosed:true,
      actualAbsoluteHAndInverseWeightsNumericallyEnclosed:true,all270ActualPositiveDerivativeScalesNumericallyEnclosed:true,
      closedNumericalEndpointLeavesOnly:true,allRequiredLogCoordinateWidthsChecked:true,individualEtaBetaPrecisionMet:false,individualTPrecisionMet:false,
      originalValueRelativeToleranceGuaranteed:false,derivativeCoefficientEnclosuresOwnedBySeparateActualAdapter:true,
      originalSelectorOrBackgroundChanged:false,sourceHReplacedByZero:false,originalFTCValuesIndividuallyNumericallyEvaluated:false,
      globalAllLabelsNumericallyEvaluated:false,wholeGNUMComplete:false,M3Started:false},pass:true,sourceAuthenticated:true};
  const ownedRoots=[...new Set([...Object.values(namedRoots),...rowScales.map(r=>r.sourceRoot)].filter(Number.isSafeInteger))],
    literalNodes=ownedRoots.map(id=>({id,node:structuredClone(G.nodes[id])}));
  seals.set(result,{p,target,upperProof,G,data:canonicalStringify(publicData(result)),literalNodes});
  progress('actual-common-positive-numerical-scales-sealed',{rows:rows.length,absoluteValues:absoluteValues.length,normalizers:rowScales.length});return result;
}

export function assertActualCommonPositiveScaleEnclosure(result){
  const s=seals.get(result);if(!s||s.p!==result.p||s.target!==result.target||s.upperProof!==result.upperProof||s.G!==result.G||
    s.data!==canonicalStringify(publicData(result))||s.literalNodes.some(r=>!same(result.G.nodes[r.id],r.node)))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private closed numerical scale attachment.');
  assertActualPhysicalCenterTargetEnclosure(result.target);assertActualCommonFirstSelectorFTCUpperBounds(result.upperProof);return true;
}
export function projectActualCommonPositiveScaleEnclosure(result){assertActualCommonPositiveScaleEnclosure(result);return structuredClone(publicData(result));}
export async function actualCommonPositiveScaleEnclosureCertificate(result){assertActualCommonPositiveScaleEnclosure(result);const content=projectActualCommonPositiveScaleEnclosure(result);
  return {...content,recordSHA256:await sha256(canonicalStringify(content)),containsPrivateGraphOrAuthorityObjects:false};}
