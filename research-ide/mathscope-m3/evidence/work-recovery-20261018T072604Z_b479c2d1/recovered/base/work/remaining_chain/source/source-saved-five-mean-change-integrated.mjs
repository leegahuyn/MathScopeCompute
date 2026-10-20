/** Independent fast-coordinate cancellation attached to the unchanged,
 * privately authenticated saved five-map slow residual norm composition.
 * All calculus conclusions are conditional on the original operators being
 * defined in their original differentiable chart. Neither the chart/domain
 * nor the actual whole mean difference is reconstructed by this attachment.
 */
import {createHash} from 'node:crypto';
import {assertSavedInitializedSource,savedInitializedSourceProgram} from './source-saved-initialized-authority.mjs';
import {assertSavedInitializedCutoffAuthority} from './source-saved-initialized-cutoff-norms.mjs';
import {assertSavedFiveMeanChangeNorms} from './source-saved-five-mean-change-norms.mjs';
import {assertSavedFiveFastTimeAudit} from './source-saved-five-fast-time-audit.mjs';
import {originalMeanResidualChangeDemand} from './source-mean-residual-change-kernel.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),names=['beta','v','gamma'],copy=x=>structuredClone(x),
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  fail=(message,code='INVALID_SAVED_FIVE_MEAN_INTEGRATION')=>{throw Object.assign(new Error(message),{code});},
  require=(ok,message)=>{if(!ok)fail(message);},integer=x=>Number.isSafeInteger(x)&&x>=0,
  freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;},
  digest=x=>createHash('sha256').update(losslessStringify(x)).digest('hex');

// The inherited frozen audit contains explicit undefined diagnostic fields
// (an indexed definition has rows rather than one body id). Ordinary JSON
// would silently omit those properties. Tag every object/array instead, so
// the graph digest and exported lossless encoding retain the original shape
// without changing or normalizing the old audit record.
function losslessEncode(x){
  if(x===undefined)return ['undefined'];
  if(x===null||typeof x==='string'||typeof x==='boolean'||typeof x==='number'&&Number.isFinite(x))return x;
  if(Array.isArray(x))return ['array',x.map(losslessEncode)];
  require(x&&typeof x==='object'&&Object.getPrototypeOf(x)===Object.prototype,'Only original record objects, arrays and finite JSON scalars may be encoded.');
  return ['object',Object.keys(x).sort().map(k=>[k,losslessEncode(x[k])])];
}
const losslessStringify=x=>JSON.stringify(losslessEncode(x));

function assertDependencies(capability,cutoff,norm,audit){
  assertSavedInitializedSource(capability);assertSavedInitializedCutoffAuthority(cutoff);
  assertSavedFiveMeanChangeNorms(norm);assertSavedFiveFastTimeAudit(audit);
}

function bind(capability,cutoff,norm,audit){
  const source=savedInitializedSourceProgram(capability),before=source.mean.stages.temporal,after=source.mean.stages.moments,
    a=audit.analysis,b=norm.sourceBinding,t=audit.sourceBinding,geometry=cutoff.bodies.geometry;
  require(same(norm.source,capability.source)&&same(audit.source,capability.source)&&same(cutoff.source,capability.source)&&
    same(cutoff.actualRoots,source.actualRoots),'Both unchanged private results and the cutoff must belong to the identical immutable source.');
  require(same(b.geometry,geometry)&&same(t.Y,geometry.Y)&&same(a.forbidden,geometry.Y)&&
    Array.isArray(geometry.Y)&&geometry.Y.length===2&&new Set(geometry.Y).size===2&&geometry.Y.every(id=>source.node(id).op==='coordinate'),
    'Retain the exact same original geometry and both actual fast-coordinate ids.');
  require(same(b.previous,before.velocity)&&same(b.updated,after.velocity)&&same(b.background,source.actualRoots.background)&&
    same(b.unchangedCovariance,source.actualRoots.covariance)&&same(b.unchangedStress,source.actualRoots.originalStress)&&
    same(b.retainedNonlinearDefects,source.actualRoots.retainedRemainderDefects)&&
    same(t.retainedNonlinearRemainders,source.actualRoots.retainedRemainderDefects),
    'Keep all old/new velocity roots, the same full background/covariance/stress and original nonzero remainders.');
  const identities=Object.fromEntries(names.map(name=>{
    const old=b.velocityIdentities[name],independent=t.identities[name];
    require(old&&independent&&old.previous===before.velocity[name]&&old.updated===after.velocity[name]&&
      old.increment===b.increment[name]&&['previous','increment','updated'].every(k=>old[k]===independent[k])&&
      same(old.oldAdditiveTerms,independent.oldTerms)&&same(old.updatedAdditiveTerms,independent.newTerms),
      'The independent audit must refer to the same whole retained additive increment: '+name);
    return [name,{previous:old.previous,increment:old.increment,updated:old.updated}];
  }));
  const roots=names.map(name=>identities[name].increment),p=b.pressureDifference;
  require(p.old===before.pressure.value&&p.new===after.pressure.value&&
    t.oldFullPressure===p.old&&t.newFullPressure===p.new&&
    cutoff.bodies.pressureRows[0].pressure===p.old&&cutoff.bodies.pressureRows[1].pressure===p.new&&
    p.oldZ===before.pressure.slowZDerivative&&p.newZ===after.pressure.slowZDerivative&&
    p.oldA0===before.pressure.cutoffRemainder&&p.newA0===after.pressure.cutoffRemainder&&t.oldA0===p.oldA0&&t.newA0===p.newA0&&
    same(p.oldEndpointTerms,before.pressure.endpointTerms)&&same(p.newEndpointTerms,after.pressure.endpointTerms),
    'The old/new complete pressure, A0 remainders, slow derivatives and all endpoint terms must stay unchanged.');
  require(audit.status==='INDEPENDENCE_VERIFIED'&&a.status==='INDEPENDENCE_VERIFIED'&&a.independent===true&&
    a.stopReason===null&&same(a.roots,roots)&&a.rows.length===roots.length&&a.unknownOperations.length===0&&
    a.rows.every((row,j)=>row.root===roots[j]&&row.unresolvedTokens.length===0&&row.forbiddenCoordinates.length===0&&
      geometry.Y.every(id=>!row.freeCoordinates.includes(id))),
    'Use the completed private actual-body dependency traversal; a status/pass flag cannot substitute for its source-bound rows.');
  return {source,geometry:copy(geometry),identities,roots,pressureDifference:copy(p)};
}

/** No replacement source, pressure, norm value, proof or completion flag is
 * accepted. The old records are copied verbatim and never modified. */
export function attachSavedFiveMeanChangeIntegrated(capability,cutoff,norm,audit,input={}){
  assertDependencies(capability,cutoff,norm,audit);
  require(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).every(k=>k==='order'),
    'Choose only a finite output order; caller proofs and completion flags are not arguments.');
  const order=input.order??norm.request.order;
  if(!integer(order)||order>norm.request.order||!Number.isSafeInteger(order+2)||norm.parentNormRequest.order<order+2)
    fail('The unchanged norm result and its parent must supply every required derivative through output order m+2.','RESOURCE_LIMIT');
  const binding=bind(capability,cutoff,norm,audit),demand=originalMeanResidualChangeDemand({order});
  for(const [kind,length]of [['backgroundRows',order+2],['previousRows',order+2],['incrementRows',order+3],['pressureChangeRows',order+2]])
    require(Array.isArray(norm.inputRows[kind])&&norm.inputRows[kind].length>=length&&norm.inputRows[kind].slice(0,length).every((row,j)=>row.order===j),
      'Keep every original norm input through its complete derivative demand: '+kind);
  require(norm.rows.length>=order+1&&norm.rows.slice(0,order+1).every((row,j)=>row.order===j&&
    Object.values(row.fluxProducts).reduce((total,group)=>total+Object.keys(group).length,0)===19&&
    same(Object.keys(row.thetaTerms).sort(),['axial','radial','slowTime','viscous'])&&
    same(Object.keys(row.zTerms).sort(),['axial','radial','slowTime','viscous'])&&
    row.fastTimeCancellationApplied===false&&row.actualCutoffFlatnessInferred===false),
    'Preserve all 19 products and all four complete slow groups; the old record must retain its historical uncancelled-fast-term scope.');
  const rows=norm.rows.slice(0,order+1).map(row=>({order:row.order,
    originalSlowNormRow:copy(row),
    fastTime:{Etheta:{operator:'ci*N',increment:binding.identities.v.increment,exactZero:'0'},
      Ez:{operator:'ci*N',increment:binding.identities.gamma.increment,exactZero:'0'},
      allExistingMixedPartialsThroughOrder:order,conditionalOnOriginalDifferentiableOperatorDomain:true},
    Etheta:copy(row.Etheta),Ez:copy(row.Ez),
    completeResidualChangeBoundConditionalOnOriginalIdentityAndDomain:true,
    originalDomainFastCancellationApplied:true,actualCutoffFlatnessInferred:false}));
  const result=freeze({schema:'MathScope.N6.SavedFiveMeanChangeIntegrated/1',request:{order},demand,source:copy(capability.source),
    sourceBinding:{geometry:binding.geometry,identities:binding.identities,incrementRoots:[...binding.roots],
      pressureDifference:binding.pressureDifference,retainedNonlinearRemainders:copy(binding.source.actualRoots.retainedRemainderDefects)},
    dependencies:{unchangedMeanChangeNorm:copy(norm),unchangedIndependentFastTimeAudit:copy(audit)},
    dependencyDigests:{meanChangeNormSHA256:digest(norm),fastTimeAuditSHA256:digest(audit)},rows,
    calculus:{premises:['The original operators are defined in their original open differentiable chart.',
      'The derivatives and source norm premises required by the retained C^m norm composition hold on that chart.',
      'The complete original mean residual difference has the retained four-group algebraic decomposition.'],
      argument:['The authenticated definition-body audit excludes both actual fast coordinates from each entire retained increment.',
        'Consequently each existing fast partial, N(delta_v) and N(delta_gamma), is identically zero there.',
        'Multiplication by the original ci preserves exact zero; every existing mixed derivative of that zero expression remains zero.',
        'Adding this exact zero fast term to the unchanged finite slow norm composition gives the stated conditional residual-change bounds.'],
      premisesReprovedByThisAttachment:false,independentWholeSavedMeanDifferenceRecomputed:false,
      domainExistenceOrSourceClassCertified:false,numericalNormValueComputed:false,newLeanProof:false},
    scope:{sameImmutableSavedSourceBound:true,exactActualIncrementRootsMatched:true,bothCompleteOriginalPressuresMatched:true,
      newIndependentFastTimeZeroCheck:true,fastTimeIntegratedIntoMeanNormCertificate:true,originalDomainFastCancellationApplied:true,
      historicalDependencyScopeRewritten:false,fastTimeUsesIndependentDefinitionBodyAudit:true,
      numericalNorms:false,sourceNormValuesNumericallyEvaluated:false,smoothnessOrDomainProved:false,
      originalDomainExistenceProved:false,actualWholeMeanDifferenceRecomputed:false,leanKernelChecked:false,
      initialHaarAndPositiveIBPCutoffCompositionApplied:false,actualHighOrderDerivativeBodiesMaterialized:false,
      completeInitialTupleClassCertified:false,originalN601Complete:false,originalN602Complete:false,
      completeN6:false,wholeM3Complete:false,M4Accepted:false}});
  seals.set(result,{capability,cutoff,norm,audit,source:binding.source,record:losslessStringify(result)});return result;
}

export function assertSavedFiveMeanChangeIntegrated(result){
  const state=seals.get(result);
  require(state&&Object.isFrozen(result)&&state.record===losslessStringify(result),
    'Use the unchanged private integration, not a copied, serialized or relabelled record.');
  assertDependencies(state.capability,state.cutoff,state.norm,state.audit);
  require(savedInitializedSourceProgram(state.capability)===state.source,'The private original source changed.');
  bind(state.capability,state.cutoff,state.norm,state.audit);return true;
}

export async function savedFiveMeanChangeIntegratedCertificate(result){
  assertSavedFiveMeanChangeIntegrated(result);const losslessProgram=losslessEncode(result),encoded=JSON.stringify(losslessProgram);
  return {schema:'MathScope.N6.SavedFiveMeanChangeIntegratedCertificate/1',program:copy(result),
    encoding:{schema:'MathScope.LosslessJSONWithUndefined/1',
      grammar:'Scalars stay scalars; arrays are ["array", encodedElements]; objects are ["object", sorted [key, encodedValue] pairs]; undefined is ["undefined"].',
      inheritedUndefinedPropertiesPreserved:true,ordinaryProgramJSONViewMayOmitUndefinedDiagnostics:true},losslessProgram,
    graph:{sha256:createHash('sha256').update(encoded).digest('hex'),canonicalBytes:Buffer.byteLength(encoded),
      inheritedScalarNodeCount:result.dependencies.unchangedMeanChangeNorm.scalarProgram.nodes.length},
    scope:copy(result.scope),serializedCertificateIsNotPrivateSourceAuthority:true};
}
