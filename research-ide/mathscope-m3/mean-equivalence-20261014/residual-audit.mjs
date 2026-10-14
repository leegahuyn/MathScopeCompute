/** Full original residual frontier; one complete source stream, all175/203/690
 * terms, a separately derived actual Cartesian jet attempt, no promotions.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openFullResidualSource,fullResidualProgram,sourceWitness,verifySourceWitnesses,hashBytes,hashJSON,requireResidual,RESIDUAL_PINS} from './residual-source.mjs';
import {createCompleteResidualVerifier} from './residual-rational-verifier.mjs';
import {createResidualFrontier} from './residual-frontier.mjs';
import {createResidualCartesianCalculus,deriveActualCartesianResidual} from './residual-cartesian.mjs';
import {reduceSourceTrigNumerator} from './residual-trig.mjs';

export async function auditFullResidualTerms(capability,{outputDir}={}){
  const p=fullResidualProgram(capability),full=p.full,startedAt=new Date().toISOString(),extra=[];
  const append=(op,args)=>{const id=p.nodeCount+extra.length;extra.push({op,args});return id;};
  const array=new Proxy({},{get(_target,key){if(typeof key==='string'&&/^\d+$/.test(key)){const id=Number(key);return id<p.nodeCount?p.node(id):extra[id-p.nodeCount];}return undefined;},set(){throw new Error('An original residual operand cannot be changed.');}});
  const minusOne=append('rational',['-1','1']),frontier=createResidualFrontier({node:p.node,definitions:p.definitions,geometry:full.geometry,nodeCount:p.nodeCount}),rows=[];
  const originals=[...full.velocity,full.pressure,...full.direct.conservativeResidual,...full.assembledResidual,full.direct.divergence,...full.oldFlatResidual.local.flatMap(row=>row.value.flatMap(z=>[z.real,z.imaginary])),...full.oldFlatResidual.fullStressDivergence];
  const roots=[...new Set(originals)].map(id=>sourceWitness(capability,id));
  for(let component=0;component<3;component++){
    const direct=full.direct.conservativeResidual[component],assembled=full.assembledResidual[component],difference=append('add',[direct,append('multiply',[minusOne,assembled])]);
    const verify=createCompleteResidualVerifier({nodes:array},{maxTerms:10000,maxProducts:2000000}),comparison=verify(difference);
    requireResidual(comparison.completeNumeratorExported&&comparison.numerator.length===comparison.numeratorMonomials,'An actual residual monomial was truncated.');
    // These old observed counts are source invariants of the unchanged verifier
    // arithmetic. A differing result is an implementation/source failure.
    requireResidual(comparison.numeratorMonomials===[175,203,690][component],'The actual complete residual comparison count changed; inspect the execution before accepting it.');
    const terms=comparison.numerator.map((term,index)=>({index,...frontier.classify(term.monomial,term.coefficient)}));
    const trigReduction=reduceSourceTrigNumerator({node:p.node,atomicSourceIDs:comparison.actualAtomicNodes,numerator:comparison.numerator});
    const afterProvedTrigRelationTerms=trigReduction.numerator.map((term,index)=>({index,...frontier.classify(term.monomial,term.coefficient)}));
    comparison.actualAtomicNodes.forEach(id=>frontier.atom(id));
    const counts={};for(const term of terms)for(const label of term.labels)counts[label]=(counts[label]??0)+1;
    rows.push({component,directRoot:direct,assembledRoot:assembled,derivedDifferenceRoot:difference,status:'UNRESOLVED_WITH_ALL_ACTUAL_RATIONAL_TERMS_AND_DEFINING_FRONTIER',comparison,
      terms,trigReduction,afterProvedTrigRelationTerms,exactMultiLabelCounts:counts,allRemainingTermsExported:true,sourceDerivativeBodiesIndependentlyVerified:false,sourceRationalNonmatchIsNotPDECounterexample:true});
    console.log('FULL_RESIDUAL_TERMS',JSON.stringify({component,numeratorMonomials:terms.length,afterSameArgumentTrig:trigReduction.reducedMonomials,actualAtoms:comparison.actualAtomicOperandCount,products:comparison.productsUsed}));
  }
  const frontierRecords=frontier.diagnostics();verifySourceWitnesses(capability,roots);verifySourceWitnesses(capability,frontierRecords.sourceWitnesses);
  const first=frontierRecords.atomicRecords[0],altered=structuredClone(first);altered.node={op:'rational',args:['7','1']};altered.nodeSHA256=hashJSON(altered.node);
  let sourceMutationRejected=false,copiedCapabilityRejected=false;
  try{verifySourceWitnesses(capability,[altered]);}catch(error){sourceMutationRejected=error.code==='INVALID_ACTUAL_RESIDUAL_SOURCE';}
  try{fullResidualProgram({...capability});}catch(error){copiedCapabilityRejected=error.code==='INVALID_ACTUAL_RESIDUAL_SOURCE';}
  requireResidual(sourceMutationRejected&&copiedCapabilityRejected,'A forged original source witness or copied authority was accepted.');
  const G=createResidualCartesianCalculus({node:p.node,maxNodes:250000,maxWork:1000000});let cartesian,cartesianStop=null;
  try{cartesian=deriveActualCartesianResidual(G,{geometry:full.geometry,velocity:full.velocity,pressure:full.pressure});}
  catch(error){cartesianStop={code:error.code??'ERROR',reason:error.message,workUsed:error.workUsed??null,scalarNodes:error.scalarNodes??null};cartesian={schema:'MathScope.N6.IndependentActualCartesianJetAttempt/1',status:'UNRESOLVED_BOUNDED_PRIMITIVE_RECOMPUTATION',sourceVelocity:full.velocity,sourcePressure:full.pressure,sourceGeometry:full.geometry,stop:cartesianStop,diagnostics:G.diagnostics(),actualCartesianPDEVerified:false,originalN601Complete:false,originalN602Complete:false};}
  verifySourceWitnesses(capability,cartesian.diagnostics.sourceBindings);
  const proofBoundary={exactSourceRationalArithmeticRecomputed:true,sourceAtomIDsPreserved:true,allNumeratorTermsRetained:true,allDenominatorFactorsRetained:true,sourceMutationNegativeControl:true,
    primitiveCartesianOperatorsIndependentlyWritten:true,originalCylindricalPDEHelperCalled:false,storedSourceDerivativeRootsUsedAsIndependentJets:false,opaqueJetsAreExplicitStops:true,
    actualOpaqueOperatorJetsEvaluated:false,sourceCoverDisjointnessProved:false,nonzeroDivisorHypothesesDischarged:false,fullActualCartesianPDEVerified:false,oldFlatTailReplacedByZero:false,oldPassFlagsUsedAsProof:false,originalN601Complete:false,originalN602Complete:false,countsChanged:false};
  const summary={schema:'MathScope.N6.FullActualResidualFrontierAudit/1',startedAt,finishedAt:new Date().toISOString(),source:capability.source,sourceRoots:roots,fullSourceGeometry:full.geometry,oldFlatResidual:full.oldFlatResidual,
    status:'ALL1068_ACTUAL_RATIONAL_TERMS_EXPORTED_CARTESIAN_PRIMITIVES_DERIVED_ANALYTIC_FRONTIER_OPEN',components:rows.map(row=>({component:row.component,directRoot:row.directRoot,assembledRoot:row.assembledRoot,numeratorMonomials:row.comparison.numeratorMonomials,afterProvedSameArgumentTrigRelations:row.trigReduction.reducedMonomials,provedTrigRelations:row.trigReduction.relations.length,denominatorFactors:row.comparison.denominatorFactors,status:row.status,exactMultiLabelCounts:row.exactMultiLabelCounts})),
    fullRemainingTermCount:rows.reduce((s,r)=>s+r.terms.length,0),actualAtomicRecords:frontierRecords.atomicRecords.length,actualOpaqueFrontierCount:frontierRecords.actualOpaqueFrontier.length,definitionBindingCount:frontierRecords.definitionBindings.length,
    independentCartesianAttempt:{status:cartesian.status,stop:cartesianStop,scalarNodes:G.nodes.length,unresolvedActualJetRequests:cartesian.diagnostics.unresolvedActualJetRequests.length},
    negativeControls:{sourceMutationRejected,copiedCapabilityRejected},proofBoundary,
    minimalRemainingRelations:['Full same-body indexed-cover expansion with the exact162 local rows, direction maps and nonzero modes.','Actual source-disjointness and flat joins, which remove cross-label nonlinear products rather than a generic polynomial cancellation.','Actual same pressure Fourier/inverse/body semantics and all exact retained local curl jets.','Analytic definition/domain/nonzero-divisor assumptions and full original j=0 class bounds for these exact global roots.']};
  if(outputDir){const out=resolve(outputDir);await mkdir(out,{recursive:true});const artifacts=[];
    const save=async(name,value)=>{const raw=JSON.stringify(value,null,2)+'\n';await writeFile(resolve(out,name),raw,{flag:'wx'});artifacts.push({path:name,sha256:hashBytes(raw),bytes:Buffer.byteLength(raw)});};
    for(const row of rows)await save('residual-component-'+row.component+'-all-terms.json',row);
    await save('residual-actual-atoms-and-frontier.json',frontierRecords);
    await save('residual-independent-cartesian-jets.json',{...cartesian,scalarProgram:G.nodes});
    await save('residual-audit-summary.json',summary);
    const implementationNames=['residual-audit.mjs','residual-source.mjs','residual-rational-verifier.mjs','residual-frontier.mjs','residual-cartesian.mjs','residual-trig.mjs'];
    const implementations=await Promise.all(implementationNames.map(async path=>{const raw=await readFile(new URL(path,import.meta.url));return {path,sha256:hashBytes(raw),bytes:raw.length};}));
    await save('residual-execution.json',{schema:'MathScope.N6.FullActualResidualFrontierExecution/1',startedAt,finishedAt:new Date().toISOString(),nodeVersion:process.version,implementations,originalRationalVerifierSHA256:RESIDUAL_PINS.verifier,arithmeticOnlyOutputExtension:true,artifacts:[...artifacts],proofBoundary});
  }return {summary,rows,frontierRecords,cartesian};
}
const direct=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(direct){const args=process.argv.slice(2);requireResidual(args.length===2&&args[0]==='--output'&&args[1],'Use --output DIR only; source/math/branch replacement flags are unavailable.');const cap=await openFullResidualSource();const result=await auditFullResidualTerms(cap,{outputDir:args[1]});console.log('RESIDUAL_AUDIT',JSON.stringify({status:result.summary.status,components:result.summary.components,fullRemainingTermCount:result.summary.fullRemainingTermCount,actualOpaqueFrontierCount:result.summary.actualOpaqueFrontierCount,independentCartesianAttempt:result.summary.independentCartesianAttempt,actualCartesianPDEVerified:false}));}
