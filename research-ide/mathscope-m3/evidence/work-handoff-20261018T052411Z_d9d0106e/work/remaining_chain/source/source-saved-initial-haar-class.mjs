/** Initial Haar residual norms for the authenticated saved construction.
 *
 * This path keeps the original source bodies immutable. It binds the
 * complete original Haar/positive-H/squared-partition identity and uses
 * the same source norm producer calls already bound to that body.
 */
import {assertSavedInitializedSource,savedInitializedSourceProgram} from './source-saved-initialized-authority.mjs';
import {assertSavedInitializedNormProgram} from './source-saved-initialized-norm-family.mjs';
import {attachOriginalPrimaryCovarianceIdentity} from './source-primary-class-majorants.mjs';
import {composeOriginalInitialHaarResidualRows,originalInitialHaarResidualDemand} from './source-initial-haar-class-kernel.mjs';
import {DeferredSourceNormScalars} from './source-deferred-norm-scalars.mjs';
import {originalInitializedNormProgramProducerReferences} from './source-initialized-lazy-norm-program.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),copy=x=>structuredClone(x),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  names=['rr','rtheta','rz','thetatheta','thetaz','zz'],
  fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SAVED_INITIAL_HAAR_CLASS'});},
  functions=Object.freeze({...originalInitializedNormProgramProducerReferences(),
    exactPrimaryCovarianceIdentity:attachOriginalPrimaryCovarianceIdentity,haarProducts:composeOriginalInitialHaarResidualRows}),
  sourcePaths=['research-ide/mathscope-m3/navier/source-global-band.mjs',
    'research-ide/mathscope-m3/navier/source-global-current.mjs',
    'research-ide/mathscope-m3/navier/source-global-pressure.mjs',
    'research-ide/mathscope-m2/navier/actual-covariance-source-certificate.mjs'];

function bindCompleteHaarSource(source){
  const one=suffix=>{const matches=source.definitionCollections.filter(r=>r.namespace.endsWith(suffix));
    if(matches.length!==1)fail('Use the unique full original '+suffix+' definition namespace.');return matches[0];},
    aux=one('.fieldDefinitions'),global=one('.m3GlobalFields'),expression=one('.expression'),
    exprByName=new Map(expression.value.map((d,id)=>[d.name,{id,...d}])),
    fields=names.map((name,j)=>{
      const root=source.actualRoots.covariance[name],node=source.node(root),index=node.args?.[0],field=aux.value[index],
        oldRoot=field?.sourceRecipe?.originalCurrentCovariance,oldNode=Number.isSafeInteger(oldRoot)?source.node(oldRoot):null,
        globalIndex=oldNode?.args?.[0],haar=global.value[globalIndex],local=exprByName.get('GlobalBothSignsFullMean_'+name),
        signs=[1,-1].map(sign=>exprByName.get('GlobalFixedRepresentativeMean_'+sign+'_'+name));
      if(node.op!=='m3_aux_indexed_partial'||index!==j||node.args[2].some(x=>x!==0)||
        !field||field.name!=='GlobalCompleteCommonTorus_'+name||field.rows.length!==162||
        !field.sourceRecipe.all81Boxes||!field.sourceRecipe.bothSignsInsideEachBox||
        !field.sourceRecipe.sourceBodyIsTheOriginalCompleteHarmonicCurl||
        oldNode?.op!=='m3_global_indexed_partial'||oldNode.args[2].some(x=>x!==0)||
        !haar||haar.name!=='GlobalFullMean_'+name||haar.rows.length!==81||
        !local||signs.some(x=>!x)||
        haar.rows.some(r=>r.localBody!==local.body||r.localSystem!==local.id||r.guards.length!==5||
          !same(r.label.signs,[1,-1])||r.label.countInGlobalSum!==1)||
        field.rows.some(r=>r.guards.length!==5||!r.label.signIsInsideBox||!r.label.countBoxOnce||
          ![1,-1].includes(r.label.sign)))fail('A complete source curl, candidate, sign, Haar root or slow partition body was lost.');
      const byKey=new Map(haar.rows.map(r=>[r.label.key,r]));
      if(byKey.size!==81)fail('The complete original 81-candidate partition must not contain repeated labels.');
      for(const [key,row]of byKey){
        const two=field.rows.filter(r=>r.label.key===key);
        if(two.length!==2||!same(two.map(r=>r.label.sign).sort((a,b)=>a-b),[-1,1])||
          two.some(r=>r.coefficient!==row.coefficient||!same(r.guards,row.guards)))
          fail('The normalized Haar pullback must preserve each original candidate and both full-curl signs.');
      }
      return {name,actualCommonYRoot:root,actualCommonYNode:copy(node),commonYNamespace:aux.namespace,
        actualHaarRoot:oldRoot,actualHaarNode:copy(oldNode),haarNamespace:global.namespace,
        completeCommonYDefinition:copy(field),completeHaarDefinition:copy(haar),
        completeBothSignLocalDefinition:copy(local),actualSignLocalDefinitions:copy(signs)};
    }),originalFiles=sourcePaths.map(path=>source.sourceFiles.find(r=>r.path===path));
  if(originalFiles.some(r=>!r))fail('The executed original H, complete partition and Haar source recipes are required.');
  return {actualCovarianceRoots:copy(source.actualRoots.covariance),actualOriginalStress:copy(source.actualRoots.originalStress),
    fields,originalExecutedRecipes:copy(originalFiles),
    leadingIdentity:{operator:'attachOriginalPrimaryCovarianceIdentity',parentNormCall:1,
      resultPaths:{leadingTarget:['covariance','globalLeadingTarget'],checks:['covariance','checks'],
        exactRemainder:['bounds','haarRows','m','fields','covarianceRemainder']},
      proof:[
        'The saved potential and covariance bodies were produced by the exact original band/current constructors: both positive a_sigma are sqrt(y_sigma), and the literal two-by-two H inverse satisfies H*y=T0_star.',
        'The original full harmonic curl is weightedAmplitude+i*curlRemainder. Its nonzero angular mean is one half of each amplitude product plus one half of each curl-remainder product; the mixed sine/cosine terms have mean zero.',
        'Each actual local leading Haar integral is the corresponding original H column multiplied by epsilon, a_sigma squared and the complete slow cutoff squared. Thus summing the two signs yields epsilon times T0_star times that same cutoff squared.',
        'All 81 original squared partition terms sum to one after their exact physical covariance chart factors. Differentiating this whole identity includes every partition derivative and leaves exactly epsilon*T0_star.',
        'The source-global-band target uses s^(-A-1/2) times the exact leading stress bodies. The original background stress uses the same factor and an additional epsilon. Hence epsilon*T0_star is exactly Sigma^(0).',
        'The complete integer torus pullbacks preserve normalized Haar measure: the cover multiplicity cancels its Jacobian. The source periodic zero extension makes the Haar average of every Y derivative exactly zero.',
        'Only this leading part cancels. The exact full-curl covariance remainder and every higher background stress term remain in (9.11).'
      ],
      proofKind:'Same original constructor definitions, exact H-inverse/positive-root/whole-partition identities and normalized Haar change of variables.',
      literalOriginalIdentityFunctionReexecutedOnHydratedLiveCurrent:false,
      numericalOrSampleCancellationUsed:false,wholeCovarianceDeclaredEqualToLeadingTarget:false},
    allSixCompleteActualCommonYToHaarBodiesMatched:true};
}

export function attachSavedInitialHaarResidualNorm(capability,parent,input={}){
  assertSavedInitializedSource(capability);assertSavedInitializedNormProgram(parent);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxNodes','maxWork'].includes(k)))
    fail('Select a finite output order and scalar budgets only.');
  const request={order:input.order??parent.request.order,maxNodes:input.maxNodes??200000,maxWork:input.maxWork??200000},
    demand=originalInitialHaarResidualDemand({order:request.order}),source=savedInitializedSourceProgram(capability),
    m=request.order;
  if(!same(parent.savedSourceBinding.source,capability.source)||!same(parent.savedSourceBinding.actualRoots,source.actualRoots)||
    parent.request.order<m)fail('The complete source norm program and the saved mean must be the same private source at sufficient order.');
  const binding=bindCompleteHaarSource(source),G=new DeferredSourceNormScalars({maxNodes:request.maxNodes,prefix:parent.scalarProgram.nodes}),
    primary=parent.callGraph.calls.find(c=>c.producer==='primary'),background=parent.callGraph.calls.find(c=>c.producer==='background'),
    radial=parent.callGraph.calls.find(c=>c.producer==='radial'),
    field=(constant,power,pole,epsilonExponent)=>({constant,power,pole,epsilonExponent,weight:'zeta',gaussian:'1'}),
    remainder=[],covariance=[],higher=[],pressure=[];
  for(let j=0;j<=m+1;j++){
    const degree=parent.degreeProgram,rem=degree.covarianceRemainder[j],lead=degree.primaryCovariance[j];
    remainder.push({order:j,field:field(G.select(primary.id,['bounds','haarRows',j,'fields','covarianceRemainder','constant']),rem.power,rem.pole,'2-2*kappa_s')});
    covariance.push({order:j,field:field(G.select(primary.id,['bounds','haarRows',j,'fields','fullCovariance','constant']),
      Math.max(lead.power,rem.power)+1,Math.max(lead.pole,rem.pole),'1')});
    higher.push({order:j,field:field(G.select(background.id,['rows',j,'higherStress','constant']),0,3+3*j,'3')});
    pressure.push({order:j,field:copy(parent.initialPressure[j].pressure)});
  }
  const products=composeOriginalInitialHaarResidualRows(G,{order:m,radiusBase:G.select(radial.id,['geometry','B']),
    covarianceRemainderRows:remainder,fullHaarCovarianceRows:covariance,higherStressRows:higher,pressureRows:pressure,maxWork:request.maxWork}),
    result={schema:'MathScope.N6.SavedInitialHaarResidualNorm/1',request,demand,
      source:copy(capability.source),sourceBinding:binding,
      sameSourceNormContinuation:copy(parent.savedSourceBinding.sameSourceNormContinuation),
      parentNormRequest:copy(parent.request),callGraph:copy(parent.callGraph),
      scalarProgram:{nodes:copy(G.nodes),parentPrefixCount:parent.scalarProgram.nodes.length,
        finiteScalarCompositionExecuted:true,allSourceResultLeavesBoundToSamePrivateFamily:true,
        actualHighOrderDerivativeBodiesMaterialized:false},products,rows:products.rows,
      scope:{actualSavedSourceIdentityAuthenticated:true,completeOriginalHaarFieldsMatched:true,
        originalLeadingCancellationBoundToSameSourceRecipe:true,actualFiniteHaarNormCompositionExecuted:true,
        allFiniteOrdersBySameOriginalSourceNormRecurrence:true,
        initialHaarResidualExponent:'149/100',exactComputedLowerExponent:'99999/50000',
        temporalAndFiveResidualChangeApplied:false,allOrdersCutoffFlatnessApplied:false,
        initializedTangentialResidualClassComplete:false,completeN6:false}};
  seals.set(result,{capability,parent,source,functions:{...functions},record:canonicalStringify(result)});return result;
}

export function assertSavedInitialHaarResidualNorm(result){
  const s=seals.get(result);
  if(!s||s.record!==canonicalStringify(result)||Object.keys(functions).some(k=>s.functions[k]!==functions[k]))
    fail('Use the unchanged private same-source Haar norm composition.');
  assertSavedInitializedSource(s.capability);assertSavedInitializedNormProgram(s.parent);
  if(savedInitializedSourceProgram(s.capability)!==s.source)fail('The exact source program changed.');return true;
}

export async function savedInitialHaarResidualNormCertificate(result){
  assertSavedInitialHaarResidualNorm(result);const encoded=canonicalStringify(result);
  return {schema:'MathScope.N6.SavedInitialHaarResidualNormCertificate/1',program:copy(result),
    graph:{sha256:await sha256(encoded),canonicalBytes:new TextEncoder().encode(encoded).length,
      scalarNodeCount:result.scalarProgram.nodes.length},scope:copy(result.scope),
    originalLiveCurrentHydrated:false,allDerivativeBodiesMaterialized:false,
    numericalNormValuesInvented:false,serializedCertificateIsNotPrivateSourceAuthority:true};
}
