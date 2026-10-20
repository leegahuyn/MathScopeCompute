/** Conditional updated mean replay after the exact FTC maximum gate.
 * Only the authenticated original source provider enters the sealed reader.
 * The replacement max(1,B)=B uses three retained FTC anchors and keeps its
 * analytic/capture premises open. No original source or acceptance is edited.
 */
import {createHash} from 'node:crypto';
import {assertSavedInitializedSource,savedInitializedSourceProgram} from './source-saved-initialized-authority.mjs';
import {assertSavedInitializedCutoffAuthority} from './source-saved-initialized-cutoff-norms.mjs';
import {createIndependentMeanReader,assertIndependentMeanReader} from './source-saved-whole-mean-direct-audit.mjs';
import {attachSavedMonotoneDerivativeAuthority} from './source-saved-monotone-implicit-derivatives.mjs';
import {attachSavedQuadraticDerivativeAuthority} from './source-saved-quadratic-implicit-derivatives.mjs';
import {attachSavedNaturalSeriesAuditAuthority} from './source-saved-quadratic-series-audit.mjs';
import {auditSavedRadiusAndMonotone,inspectRadiusFTCDominance} from './source-saved-radius-monotone-audit.mjs';
import {createFactoredRationalVerifier} from './forced-rational-identity.mjs';

const seals=new WeakSet(),keys=['beta','v','gamma'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const fail=(message,code='INVALID_CONDITIONAL_WHOLE_MEAN_AUDIT')=>{throw Object.assign(new Error(message),{code});};
const require=(ok,message)=>{if(!ok)fail(message);};
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const compact=(value,limit=40)=>{
  if(Array.isArray(value))return {count:value.length,sha256:hash(value),retained:value.slice(0,limit).map(x=>compact(x,limit)),omitted:value.length>limit};
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,compact(v,limit)]));
  return typeof value==='string'&&value.length>1600?{characters:value.length,sha256:hash(value),preview:value.slice(0,1600)}:value;
};
const reportableStops=new Set(['RESOURCE_LIMIT','UNRESOLVED_CUSTOM_DERIVATIVE','UNRESOLVED_IMPLICIT_UPSTREAM','CAPTURED_COORDINATE_DERIVATIVE','DEPENDENCY_CYCLE','UNRESOLVED_NATURAL_INPUT_CLOSURE','NATURAL_DERIVATIVE_ORDER_LIMIT','SINGULAR_IMPLICIT_ROOT']);

/** Reporting must not destroy the primary unresolved source stop merely
 * because an old registered diagnostics routine spends exhausted work.
 * Unknown implementation errors still throw; unavailable metrics are null.
 */
export function collectConditionalMeanDiagnostics(reader,input={}){
  assertIndependentMeanReader(reader);
  require(input&&Object.keys(input).every(k=>['maxWork','maxNodes'].includes(k)),'Diagnostics accept only the recorded finite reader budgets.');
  try{
    const raw=reader.diagnostics();
    return {diagnosticsAvailable:true,diagnosticsFailure:null,workUsed:raw.workUsed,workUsedExact:true,maxWork:raw.maxWork,scalarNodes:raw.scalarNodes,maxNodes:raw.maxNodes,selectedSourceNodeCount:raw.selectedSourceNodeCount,selectedSourceNodesSha256:raw.selectedSourceNodesSha256,
      sourceBindings:compact(raw.sourceBindings,24),inspectedDefinitionBindings:compact(raw.inspectedDefinitionBindings,24),unresolvedCustomBodyClosure:compact(raw.unresolvedCustomBodyClosure,24),unknownSourceOperators:compact(raw.unknownSourceOperators,24),
      discreteDerivativeStops:compact(raw.discreteDerivativeStops,16),sourceOperatorAudits:raw.sourceOperatorAudits.map(a=>compact(a,12)),domainHypotheses:compact(raw.domainHypotheses,24),
      originalDerivativeRoutineCalled:false,originalFreeCoordinateRoutineCalled:false,originalPassBitsRead:false,fullScalarGraphOmitted:true,compactCountsAndHashesRetainOmittedDiagnosticIdentity:true};
  }catch(error){
    if(!reportableStops.has(error.code))throw error;
    return {diagnosticsAvailable:false,diagnosticsFailure:{code:error.code,reason:error.message,stage:'post-stop-diagnostics',primarySourceStopPreserved:true},
      workUsed:null,workUsedExact:false,maxWork:input.maxWork??null,scalarNodes:reader.nodes.length,maxNodes:input.maxNodes??null,
      selectedSourceNodeCount:null,selectedSourceNodesSha256:null,sourceBindings:null,inspectedDefinitionBindings:null,unresolvedCustomBodyClosure:null,unknownSourceOperators:null,discreteDerivativeStops:null,sourceOperatorAudits:null,domainHypotheses:null,
      originalDerivativeRoutineCalled:false,originalFreeCoordinateRoutineCalled:false,originalPassBitsRead:false,fullScalarGraphOmitted:true,compactCountsAndHashesRetainOmittedDiagnosticIdentity:false,
      limitation:'The original registered diagnostics routine consumed work after an unresolved stop. Its unavailable counts/hashes were not invented; exact source/cutoff/replacement bindings and the primary stop remain in the enclosing artifact.'};
  }
}

/** Unauthenticated fixture/import kernel. It independently rechecks every
 * FTC face. A supplied proof flag or copied source record grants no authority.
 */
export function createConditionalFTCImporter(reader,input={}){
  require(input&&Object.keys(input).every(k=>['node','maximum'].includes(k)),'Use only a read-only source provider and exact maximum node; no branch/proof/completion override.');
  assertIndependentMeanReader(reader,{expectedSourceNode:input.node});
  const proof=inspectRadiusFTCDominance({node:input.node,maximum:input.maximum});
  require(proof.structuralIdentityVerified&&proof.faces.length===24&&same(proof.faceDimensionCounts,[3,9,9,3])&&proof.conditionalDominance.lowerBound==='3'&&proof.conditionalDominance.strictMarginAtLeast==='2','Keep the exact three complete FTC sums and conditional strict gap.');
  const G=reader,maximum=G.importSource(proof.sourceMaximum.sourceNode),selected=G.importSource(proof.aggregate.sourceNode),cache=new Map(),bindings=[];
  for(const statement of proof.conditionalDominance.hypotheses)G.registerDomainHypothesis({kind:'CONDITIONAL_ORIGINAL_FTC_MAXIMUM',sourceMaximum:input.maximum,selectedOperand:proof.aggregate.sourceNode,statement,provedByThisAudit:false});
  G.registerDomainHypothesis({kind:'ORIGINAL_FTC_CAPTURE_CLOSURE',sourceMaximum:input.maximum,statement:'Every actual integrand/limit/indexed body capture and every requested mixed derivative is justified on its original domain; the function signature alone is insufficient.',provedByThisAudit:false});
  // Conservative reachability also visits numeric metadata. This may only
  // cause extra substitutions; it never drops a represented scalar operand.
  // Avoid fresh integral binders when no represented maximum is present.
  const containsMaximumCache=new Map();
  const containsMaximum=root=>{
    if(containsMaximumCache.has(root))return containsMaximumCache.get(root);
    const pending=[root],seen=new Set();let found=false;
    while(pending.length){const id=pending.pop();if(id===maximum){found=true;break;}
      if(!Number.isSafeInteger(id)||id<0||id>=G.nodes.length||seen.has(id))continue;
      seen.add(id);const visit=a=>{for(const x of a){if(Array.isArray(x))visit(x);else if(typeof x==='number')pending.push(x);}};visit(G.nodes[id].args);
    }
    containsMaximumCache.set(root,found);return found;
  };
  const at=sourceId=>{
    if(cache.has(sourceId))return cache.get(sourceId);
    const binding={sourceId,status:'import-started',imported:null,transformed:null,changed:null};bindings.push(binding);
    const imported=G.importSource(sourceId),transformed=containsMaximum(imported)?G.substitute(imported,maximum,selected):imported;
    cache.set(sourceId,transformed);Object.assign(binding,{status:'import-completed',imported,transformed,changed:imported!==transformed});return transformed;
  };
  return Object.freeze({at,proof,maximum,selected,bindings,sourceAuthenticated:false,allAnalyticPremisesProved:false});
}

/** Independent total conservative fluxes, using only conditionally transformed
 * imported fields. Stored residual roots enter later comparison operands only.
 */
export function reconstructConditionalConservativeMean(reader,{geometry,background,velocity,covariance,stress,pressure},importer){
  assertIndependentMeanReader(reader);require(importer&&typeof importer.at==='function'&&importer.sourceAuthenticated===false&&importer.allAnalyticPremisesProved===false,'Use the explicit conditional source importer.');
  const G=reader,at=importer.at,R=at(geometry.R),e=at(geometry.epsilon),ci=at(geometry.ci),a=at(geometry.radialFast),
    Z=at(geometry.Z),T=at(geometry.T),Y=geometry.Y.map(at),vr=geometry.vr.map(at),vt=geometry.replayTimeDirection??geometry.vt.map(at),
    D=(x,v)=>G.derivative(x,v),L=x=>G.add(...Y.map((y,j)=>G.mul(vr[j],D(x,y)))),
    Dr=x=>G.add(D(x,R),G.mul(a,L(x))),Dz=x=>G.mul(e,D(x,Z)),
    time=x=>G.add(G.neg(G.mul(e,D(x,T))),G.mul(ci,G.add(...Y.map((y,j)=>G.mul(vt[j],D(x,y)))))),
    divFlux=(x,weight)=>G.add(Dr(x),G.div(G.mul(G.q(weight),x),R)),
    lap=x=>G.add(Dr(Dr(x)),G.div(Dr(x),R),Dz(Dz(x))),vectorLap=x=>G.sub(lap(x),G.div(x,G.pow(R,2))),
    [b,V,axial]=['b','V','G'].map(k=>at(background[k])),[beta,v,gamma]=keys.map(k=>at(velocity[k])),
    fullB=G.add(b,beta),fullV=G.add(V,v),fullG=G.add(axial,gamma),W=Object.fromEntries(Object.entries(covariance).map(([k,x])=>[k,at(x)])),
    deltaFlux=(x,y,oldX,oldY,w)=>G.add(G.sub(G.mul(x,y),G.mul(oldX,oldY)),w),
    thetaRadial=G.sub(deltaFlux(fullB,fullV,b,V,W.rtheta),at(stress[0])),thetaAxial=deltaFlux(fullG,fullV,axial,V,W.thetaz),
    zRadial=G.sub(deltaFlux(fullB,fullG,b,axial,W.rz),at(stress[1])),zAxial=G.add(G.sub(G.pow(fullG,2),G.pow(axial,2)),W.zz,at(pressure)),
    Etheta=G.add(time(v),divFlux(thetaRadial,2),Dz(thetaAxial),G.neg(G.mul(e,vectorLap(v)))),
    Ez=G.add(time(gamma),divFlux(zRadial,1),Dz(zAxial),G.neg(G.mul(e,lap(gamma)))),
    gr=G.add(G.neg(time(beta)),G.neg(divFlux(deltaFlux(fullB,fullB,b,b,W.rr),1)),G.neg(Dz(deltaFlux(fullB,fullG,b,axial,W.rz))),G.div(deltaFlux(fullV,fullV,V,V,W.thetatheta),R),G.mul(e,vectorLap(beta)));
  return {Etheta,Ez,gr,pressureZ:D(at(pressure),Z),sixCovarianceRootsRetained:Object.keys(W).length===6,
    derivation:'Total conservative cylindrical fluxes minus fixed base fluxes; complete scalar/vector viscosity, slow/fast time, actual complete pressure and every mixed/square product.',sourceAuthenticated:false};
}

export async function auditSavedWholeMeanConditional(capability,cutoff,input={}){
  assertSavedInitializedSource(capability);assertSavedInitializedCutoffAuthority(cutoff);
  require(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).every(k=>['maxWork','maxNodes','maxTerms','maxProducts'].includes(k)),'Only finite work/node/rational-verifier budgets may be supplied.');
  const source=savedInitializedSourceProgram(capability),before=source.mean.stages.temporal,after=source.mean.stages.moments;
  require(same(cutoff.source,capability.source)&&same(cutoff.actualRoots,source.actualRoots),'The private source and pressure cutoff authority must bind identical roots.');
  require(same(before.mean.background,after.mean.background)&&same(before.mean.fullAngularCovariance,after.mean.fullAngularCovariance)&&same(before.mean.fullOriginalStress,after.mean.fullOriginalStress),'Keep the identical actual background, six covariances and full stress.');
  require(cutoff.bodies.pressureRows[0].pressure===before.pressure.value&&cutoff.bodies.pressureRows[1].pressure===after.pressure.value&&source.mean.nonlinear.remaindersDeclaredZero===false,'Keep both latest pressures, their A0 remainders and nonzero nonlinear defects.');
  const definitions={};for(const kind of ['expressionDefinitions','expression','fieldDefinitions','inverseDefinitions','m3GlobalFields']){
    const found=source.definitionCollections.filter(r=>r.namespace.endsWith('.'+kind));require(found.length===1,'A defining registry must be the unique actual saved table: '+kind);definitions[kind]=found[0].value;
  }
  const radius=await auditSavedRadiusAndMonotone(),r=radius.sourceMaximum;
  require(r.sourceAuthenticated&&r.structuralIdentityVerified&&r.sourceMaximum.sourceNode===539400&&r.aggregate.sourceNode===539399&&radius.source.completeParentSnapshotNodeSHA256===capability.source.completeParentSnapshotNodeSHA256,'The independent structural FTC audit must bind this same immutable complete source parent.');
  const originalNode=source.node,rules=[attachSavedMonotoneDerivativeAuthority(capability),attachSavedQuadraticDerivativeAuthority(capability),attachSavedNaturalSeriesAuditAuthority(capability)],
    replay=createIndependentMeanReader({node:originalNode,definitions,sourceOperationRules:rules,maxWork:input.maxWork??400000,maxNodes:input.maxNodes??200000}),rows=[],stops=[];
  let importer=null,stage='conditional-maximum-import';
  try{
    importer=createConditionalFTCImporter(replay,{node:originalNode,maximum:539400});
    require(importer.proof.selectedSkeletonSHA256===r.selectedSkeletonSHA256,'The original source FTC skeleton and all retained faces must agree.');
    const g=cutoff.bodies.geometry;require(same(originalNode(g.vr[0]),{op:'rational',args:['1','1']}),'Retain the original unit direction.');
    const geometry={...g,replayTimeDirection:[replay.neg(importer.at(g.vr[1])),importer.at(g.vr[0])]},
      verify=createFactoredRationalVerifier(replay,{maxTerms:input.maxTerms??20000,maxProducts:input.maxProducts??200000});
    for(const [name,state] of [['temporal',before],['moments',after]]){
      stage=name;
      const rebuilt=reconstructConditionalConservativeMean(replay,{geometry,background:state.mean.background,velocity:state.velocity,covariance:state.mean.fullAngularCovariance,stress:state.mean.fullOriginalStress,pressure:state.pressure.value},importer),comparisons={};
      for(const k of ['Etheta','Ez'])comparisons[k]=verify(replay.sub(rebuilt[k],importer.at(state.mean[k])));
      comparisons.gr=verify(replay.sub(rebuilt.gr,importer.at(state.mean.raw.gr)));
      comparisons.pressureZ=verify(replay.sub(rebuilt.pressureZ,importer.at(state.pressure.slowZDerivative)));
      rows.push({stage,rebuilt,originalRoots:{Etheta:state.mean.Etheta,Ez:state.mean.Ez,gr:state.mean.raw.gr,pressure:state.pressure.value,pressureZ:state.pressure.slowZDerivative},comparisons});
    }
  }catch(error){
    if(!reportableStops.has(error.code))throw error;
    const lastImportedSourceRoot=importer?.bindings.at(-1)?.sourceId??539400,lastNode=originalNode(lastImportedSourceRoot);
    const reportedSourceNodes=[...error.message.matchAll(/(?:actual source nodes?|source node)\s+([\d, ]+)/g)].flatMap(m=>m[1].split(/[, ]+/).filter(Boolean).map(Number));
    stops.push({stage,code:error.code,reason:error.message,lastImportedSourceRoot,lastImportedSourceNode:{sourceNode:lastImportedSourceRoot,node:structuredClone(lastNode),nodeSHA256:hash(lastNode)},lastImportStatus:importer?.bindings.at(-1)?.status??'conditional-maximum-import-not-completed',reportedSourceNodes,
      exactInnerFailingNodeKnown:reportedSourceNodes.length>0,resourceLimitIsNotAMathematicalCounterexample:error.code==='RESOURCE_LIMIT',originalRootOrOperatorNotReplacedByZero:true});
  }
  const diagnostics=collectConditionalMeanDiagnostics(replay,{maxWork:input.maxWork??400000,maxNodes:input.maxNodes??200000}),matched=rows.length===2&&rows.every(row=>Object.values(row.comparisons).every(c=>c.pass));
  if(!diagnostics.diagnosticsAvailable)stops.push({stage:'post-stop-diagnostics',code:'DIAGNOSTICS_UNAVAILABLE_AFTER_SOURCE_STOP',reason:diagnostics.diagnosticsFailure.reason,underlyingCode:diagnostics.diagnosticsFailure.code,primarySourceStopPreserved:true});
  const result=freeze({schema:'MathScope.N6.SavedWholeMeanConditionalAudit/1',source:structuredClone(capability.source),
      sourceBindings:{previousVelocity:structuredClone(before.velocity),updatedVelocity:structuredClone(after.velocity),previousPressure:before.pressure.value,updatedPressure:after.pressure.value,previousA0:before.pressure.cutoffRemainder,updatedA0:after.pressure.cutoffRemainder,originalNonlinearRemainders:structuredClone(source.mean.nonlinear.remainderDefects),unchangedCovariance:structuredClone(before.mean.fullAngularCovariance),unchangedStress:structuredClone(before.mean.fullOriginalStress)},
      conditionalReplacement:{sourceMaximum:r.sourceMaximum,aggregate:r.aggregate,selectedSkeletonSHA256:r.selectedSkeletonSHA256,faceDimensionCounts:r.faceDimensionCounts,faces:compact(r.faces,24),conditionalDominance:r.conditionalDominance,applied:importer!==null,transformedBindings:compact(importer?.bindings??[],32),originalSourceGraphChanged:false,allAnalyticGuardsDischarged:false},
      rows:compact(rows,2),diagnostics,stops,conditionalAlgebraIdentitiesMatched:matched,
      verifierLimitation:{integralAlphaEquivalenceCertified:false,algebraicNonmatchMayBeAlphaRenamingOnly:true,
        reason:'The unchanged source reader alpha-renames integral binders during substitution. The factored verifier treats definite_integral nodes as atomic expressions without an alpha-equivalence theorem. Thus a failed algebraic comparison is not, by itself, a counterexample to the original residual identity.'},
      status:stops.length?'UNRESOLVED_AFTER_CONDITIONAL_FTC_SELECTION':matched?'CONDITIONAL_UPDATED_NORMALIZED_MEAN_MATCH_ALL_ANALYTIC_GUARDS_OPEN':'CONDITIONAL_UPDATED_MEAN_DIFFERENCE_NOT_RESOLVED',
      scope:{actualSavedWholeVelocityAndPressureRootsBound:true,independentConservativeMeanFormulaConstructed:rows.length===2,originalExactSourceProviderPreserved:true,actualMonotoneQuadraticNaturalDerivativeRulesAttached:true,conditionalOriginalFTCMaximumSelectionApplied:importer!==null,
        originalFormulaHelperCalled:false,originalDerivativeRoutineCalled:false,oldResidualRootUsedAsProofOperand:false,customBodyClosureProved:false,allDenominatorAndDomainHypothesesProved:false,implicitDomainHypothesesDischarged:false,
        sourceNormAndClassCertified:false,actualWholeMeanDifferenceRecomputed:false,wholePhysicalNonzeroAngularPDERecomputed:false,originalPrivateProducerHydrated:false,numericalErrorEnclosureComputed:false,originalN601Complete:false,originalN602Complete:false,completeN6:false,wholeM3Complete:false,countsChanged:false},
      limitation:'Conditional algebra for the unchanged exact saved temporal/moment velocity and pressure, after structurally proved FTC branch selection under explicitly open analytic/capture guards. Integral alpha-equivalence is not certified by the factored verifier; nonmatches may be representational. It does not certify all-order classes, numerical enclosures, nonzero angular/Cartesian PDE or original N6 completion.'});
  require(Buffer.byteLength(JSON.stringify(result,null,2))<=5*1024*1024,'Compact conditional evidence exceeded 5 MiB.');seals.add(result);return result;
}
export function assertSavedWholeMeanConditionalAudit(result){require(seals.has(result)&&Object.isFrozen(result),'Copied/serialized/modified conditional audits are not private source records.');return true;}
