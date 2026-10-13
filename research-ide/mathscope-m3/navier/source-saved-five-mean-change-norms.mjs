/** Complete slow tangential residual-change norms for the ACTUAL saved
 * post-temporal five-map update. The whole old and new pressure is kept.
 * This is a source-bound finite composition, not a numerical norm value,
 * a new live original constructor, or completion of the N6 iteration.
 */
import {assertSavedInitializedSource,savedInitializedSourceProgram} from './source-saved-initialized-authority.mjs';
import {assertSavedInitializedNormProgram} from './source-saved-initialized-norm-family.mjs';
import {assertSavedInitializedCutoffAuthority} from './source-saved-initialized-cutoff-norms.mjs';
import {composeOriginalMeanResidualChangeRows,originalMeanResidualChangeDemand,exactFullMeanResidualChange} from './source-mean-residual-change-kernel.mjs';
import {DeferredSourceNormScalars} from './source-deferred-norm-scalars.mjs';
import {radialFactorial} from './source-radial-class-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),copy=x=>structuredClone(x),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  names=['beta','v','gamma'],refs=Object.freeze({products:composeOriginalMeanResidualChangeRows,exactIdentity:exactFullMeanResidualChange}),
  fail=(message,code='INVALID_SAVED_FIVE_MEAN_CHANGE')=>{throw Object.assign(new Error(message),{code});},
  require=(ok,message)=>{if(!ok)fail(message);};

function requestOf(input,parent){
  require(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).every(k=>['order','maxNodes','maxWork'].includes(k)),
    'Choose only a finite output order and scalar representation budgets.');
  const r={order:input.order??Math.max(0,parent.request.order-2),maxNodes:input.maxNodes??200000,maxWork:input.maxWork??200000};
  for(const [k,n]of Object.entries(r))if(!Number.isSafeInteger(n)||n<0)fail(k+' must be a finite nonnegative integer.','RESOURCE_LIMIT');
  if(!r.maxNodes||!r.maxWork||!Number.isSafeInteger(r.order+2)||parent.request.order<r.order+2)
    fail('Generate the same-source initialized norm program through output order m+2 before a C^m five-map change.','RESOURCE_LIMIT');
  return r;
}

/** Additive identity only: updated=previous+increment at the actual saved
 * roots. Each complete non-additive expression is retained as a whole
 * operand. No equation for an arbitrary source body is introduced.
 */
function actualIncrement(source,updated,previous){
  const memo=new Map();
  const terms=id=>{
    if(memo.has(id))return memo.get(id);
    const node=source.node(id);let result;
    if(node.op==='rational'&&node.args[0]==='0')result=[];
    else if(node.op==='add')result=node.args.flatMap(terms);
    else result=[id];
    memo.set(id,result);return result;
  };
  const left=[...terms(updated)],old=terms(previous);
  for(const id of old){const at=left.indexOf(id);require(at>=0,'The actual updated mean omits an old velocity operand.');left.splice(at,1);}
  require(left.length===1,'The actual five-map increment must be retained as one complete original coefficient.');
  return {previous,increment:left[0],updated,oldAdditiveTerms:[...old],updatedAdditiveTerms:terms(updated),
    identity:'updated = previous + increment',identityValidForArbitraryWholeOperands:true};
}

function bindActualStep(capability,source,cutoff){
  const mean=source.mean,before=mean.stages.temporal,after=mean.stages.moments,
    roots=source.actualRoots,sequence=['primary-current-pressure','temporal-8.20','post-temporal-8.12','five-moments-8.25-on-new-P-J','post-moment-8.12'];
  require(same(capability.source.originalSourceSequence,sequence)&&same(mean.source.exactSequence,sequence),
    'Keep the original temporal-before-fresh-five-map sequence.');
  require(same(before.velocity,roots.temporalVelocity)&&same(after.velocity,roots.initializedVelocity)&&
    same(before.mean.background,after.mean.background)&&same(before.mean.background,roots.background)&&
    same(before.mean.fullAngularCovariance,after.mean.fullAngularCovariance)&&same(before.mean.fullAngularCovariance,roots.covariance)&&
    same(before.mean.fullOriginalStress,after.mean.fullOriginalStress)&&same(before.mean.fullOriginalStress,roots.originalStress),
    'Both equations must use the same complete background, all six covariances and original stress.');
  require(same(cutoff.actualRoots,roots)&&same(cutoff.source,capability.source)&&
    cutoff.bodies.pressureRows[0].pressure===before.pressure.value&&cutoff.bodies.pressureRows[1].pressure===after.pressure.value&&
    !before.pressure.cutoffRemainderDeclaredZero&&!after.pressure.cutoffRemainderDeclaredZero,
    'The complete old and rebuilt pressure must be the authenticated original two pressure bodies.');
  const equations=Object.fromEntries(names.map(k=>[k,actualIncrement(source,after.velocity[k],before.velocity[k])])),
    increment=Object.fromEntries(names.map(k=>[k,equations[k].increment]));
  require(increment.beta===mean.potential.deltaBeta&&increment.gamma===mean.potential.gammaDesired,
    'The actual meridional increment must keep its original potential derivative and axial profile.');
  const named=source.node(increment.v),definitions=source.definitionCollections.filter(r=>r.namespace.endsWith('.expressionDefinitions'));
  require(definitions.length===1&&named.op==='m3_aux_expression_partial'&&named.args[0]<0&&named.args[2].every(x=>x===0),
    'Retain the entire original five-map angular coefficient at its own arguments.');
  const definition=definitions[0].value[-1-named.args[0]];
  require(definition&&definition.name==='GlobalInitializationFiveBump_v'&&same(definition.parameters,named.args[1]),
    'The angular increment must use the saved original five-map coefficient body.');
  const zeroMean=mean.potential.checks.find(r=>r.id==='post-temporal-five-bump-has-no-auxiliary-variable');
  require(zeroMean?.pass&&before.checks.every(r=>r.pass)&&after.checks.every(r=>r.pass)&&
    mean.nonlinear.expansionChecks.every(r=>r.pass)&&mean.nonlinear.remaindersDeclaredZero===false,
    'Keep the original zero-auxiliary-dependence premise and every nonzero nonlinear remainder.');
  const paths=['source-global-initial-mean.mjs','source-full-mean-equations.mjs','source-updated-mean-pressure.mjs'],
    sourceFiles=paths.map(name=>source.sourceFiles.find(r=>r.path==='research-ide/mathscope-m3/navier/'+name));
  require(sourceFiles.every(Boolean),'The actual executed full mean constructors are missing.');
  const selected=new Set([...Object.values(before.velocity),...Object.values(after.velocity),...Object.values(increment),
    before.pressure.value,after.pressure.value,before.pressure.slowZDerivative,after.pressure.slowZDerivative,
    before.mean.Etheta,before.mean.Ez,after.mean.Etheta,after.mean.Ez]);
  return {sourceFiles:copy(sourceFiles),geometry:copy(cutoff.bodies.geometry),background:copy(roots.background),
    previous:copy(before.velocity),increment,updated:copy(after.velocity),velocityIdentities:equations,
    pressureDifference:{operation:'subtract',new:after.pressure.value,old:before.pressure.value,
      newZ:after.pressure.slowZDerivative,oldZ:before.pressure.slowZDerivative,
      newA0:after.pressure.cutoffRemainder,oldA0:before.pressure.cutoffRemainder,
      newEndpointTerms:copy(after.pressure.endpointTerms),oldEndpointTerms:copy(before.pressure.endpointTerms)},
    actualResiduals:{before:{Etheta:before.mean.Etheta,Ez:before.mean.Ez},after:{Etheta:after.mean.Etheta,Ez:after.mean.Ez}},
    unchangedCovariance:copy(roots.covariance),unchangedStress:copy(roots.originalStress),
    exactFiveRows:copy(mean.bumps.exactRows),originalFiveCoefficients:copy(mean.bumps.coefficients),
    originalFreshTargets:copy(mean.bumps.actualInputDefects),retainedNonlinearDefects:copy(mean.nonlinear.remainderDefects),
    recordedNoAuxiliaryDependencePremise:copy(zeroMean),
    fastFiveTime:'ci0*N(delta_v)=ci0*N(delta_gamma)=0 using the authenticated recorded no-auxiliary-dependence premise.',
    newIndependentFastTimeZeroCheck:false,
    selectedNodeBindings:[...selected].sort((a,b)=>a-b).map(id=>({id,node:copy(source.node(id))}))};
}

export function attachSavedFiveMeanChangeNorms(capability,parent,cutoff,input={}){
  assertSavedInitializedSource(capability);assertSavedInitializedNormProgram(parent);assertSavedInitializedCutoffAuthority(cutoff);
  const request=requestOf(input,parent),m=request.order,source=savedInitializedSourceProgram(capability);
  require(same(parent.savedSourceBinding.source,capability.source)&&same(parent.savedSourceBinding.actualRoots,source.actualRoots),
    'The initialized norm program must belong to the actual saved source.');
  const binding=bindActualStep(capability,source,cutoff),G=new DeferredSourceNormScalars({maxNodes:request.maxNodes,prefix:parent.scalarProgram.nodes}),
    radial=parent.callGraph.calls.find(c=>c.producer==='radial');
  require(radial,'The original fixed radial norm producer is absent.');
  const radiusBase=G.select(radial.id,['geometry','B']),
    radialDerivativeBounds=Array.from({length:m+2},(_,j)=>G.mul(G.q(radialFactorial(j+4)),G.pow(radiusBase,j+4))),
    backgroundRows=parent.inputRows.backgroundRows.slice(0,m+2).map(r=>({order:r.order,b:copy(r.b),G:copy(r.G),
      V:{...copy(r.F),constant:G.mul(G.q(2n**BigInt(r.order)),radiusBase,r.F.constant)}})),
    previousRows=parent.temporalProducts.rows.slice(0,m+2).map(r=>({order:r.order,...copy(r.fields)})),
    incrementRows=parent.fiveProducts.rows.slice(0,m+3).map(r=>({order:r.order,...copy(r.fields)})),
    pressureChangeRows=Array.from({length:m+2},(_,j)=>{
      const a=parent.postPressure[j]?.pressure,b=parent.updatedPressure[j]?.pressure;
      require(a&&b&&a.epsilonExponent===b.epsilonExponent&&a.weight===b.weight&&a.gaussian===b.gaussian,
        'Keep both complete same-source pressure norm rows before taking their difference bound.');
      return {order:j,pressure:{...copy(a),constant:G.add(a.constant,b.constant),power:Math.max(a.power,b.power),pole:Math.max(a.pole,b.pole)},
        before:copy(a),after:copy(b),differenceBound:'norm(p_new-p_old) <= norm(p_new)+norm(p_old)'};
    }),products=composeOriginalMeanResidualChangeRows(G,{order:m,backgroundRows,previousRows,incrementRows,pressureChangeRows,
      radiusBase,radialDerivativeBounds,maxWork:request.maxWork});
  require(products.rows.length===m+1&&products.all19FluxProductTermsRetained&&products.allFourSlowGroupsRetained&&
    products.latestCompletePressureChangeRetained&&products.rows.every(r=>!r.fastTimeCancellationApplied&&!r.actualCutoffFlatnessInferred),
    'The complete mean-change norm kernel must retain all slow groups and its separate fast-time term.');
  const result={schema:'MathScope.N6.SavedFiveMeanChangeNorms/1',request,demand:originalMeanResidualChangeDemand({order:m}),
    source:copy(capability.source),sourceBinding:binding,parentNormRequest:copy(parent.request),
    callGraph:copy(parent.callGraph),sameSourceNormContinuation:copy(parent.savedSourceBinding.sameSourceNormContinuation),
    inputRows:{backgroundRows,previousRows,incrementRows,pressureChangeRows},radiusBase,radialDerivativeBounds,
    scalarProgram:{nodes:copy(G.nodes),parentPrefixCount:parent.scalarProgram.nodes.length,
      finiteScalarCompositionExecuted:true,sourceNormValuesNumericallyEvaluated:false},products,rows:products.rows,
    scope:{actualSavedFiveMapSourceBound:true,allThreeActualIncrementRootsVerified:true,
      actualBothCompletePressureRootsBound:true,actualFiniteSlowResidualNormCompositionExecuted:true,
      all19FluxProductsAndFourSlowGroupsRetained:true,
      fastTimeUsesRecordedNoAuxiliaryDependencePremise:true,newIndependentFastTimeZeroCheck:false,
      actualWholeMeanDifferenceRecomputed:false,temporalFastCancellationApplied:false,
      initialHaarAndPositiveIBPCutoffCompositionApplied:false,actualHighOrderDerivativeBodiesMaterialized:false,
      completeInitialTupleClassCertified:false,originalN601Complete:false,originalN602Complete:false,completeN6:false,wholeM3Complete:false}};
  seals.set(result,{capability,parent,cutoff,source,functions:{...refs},record:canonicalStringify(result)});return result;
}

export function assertSavedFiveMeanChangeNorms(result){
  const s=seals.get(result);
  require(s&&s.record===canonicalStringify(result)&&Object.keys(refs).every(k=>s.functions[k]===refs[k]),
    'Use the unchanged private five-map residual norm composition, not a copied or relabelled record.');
  assertSavedInitializedSource(s.capability);assertSavedInitializedNormProgram(s.parent);assertSavedInitializedCutoffAuthority(s.cutoff);
  require(savedInitializedSourceProgram(s.capability)===s.source,'The authenticated saved source changed.');return true;
}

export async function savedFiveMeanChangeNormCertificate(result){
  assertSavedFiveMeanChangeNorms(result);const encoded=canonicalStringify(result);
  return {schema:'MathScope.N6.SavedFiveMeanChangeNormCertificate/1',program:copy(result),
    graph:{sha256:await sha256(encoded),canonicalBytes:new TextEncoder().encode(encoded).length,scalarNodeCount:result.scalarProgram.nodes.length},
    scope:copy(result.scope),serializedCertificateIsNotPrivateSourceAuthority:true};
}
