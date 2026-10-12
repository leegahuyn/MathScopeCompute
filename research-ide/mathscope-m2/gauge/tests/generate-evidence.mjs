import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {getExamples,runJob,getChecklist} from '../index.mjs';
import {REVISION} from '../contracts.mjs';
const directory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../evidence');await fs.mkdir(directory,{recursive:true});
const results=[],fixtures=[];
for(const e of getExamples()){
  const r=await runJob(e.request);
  results.push({id:e.id,kind:r.kind,status:r.status,sourceHash:r.sourceHash,modelHash:r.modelHash??null,sampleHash:r.sampleHash??null,ensembleHash:r.ensembleHash??null,historyHash:r.historyHash??null,observationHash:r.visualization.observationHash??null,coordinateTypes:r.visualization.axes.map(a=>a.type??a.kind),charts:r.charts?.map(c=>({id:c.id,sourceHash:c.sourceHash,observationHash:c.observationHash,coordinateTypes:c.observation.coordinateTypes}))??[],renderedPoints:r.visualization.points.length,rawObservationPoints:r.visualization.points.length,rawSourceBytes:JSON.stringify(r).length,checks:r.checks,gaugeCheck:r.gaugeCheck??null,refinement:r.levels?.map(({source,components,...row})=>({...row,sourceLinks:source?.links?.length??null,actualNonNullLinks:source?.links?.filter(Boolean).length??null,sourceCells:source?.cells?.length??null,localPlanes:components?.length??null}))??null,convergence:r.convergence??null,comparison:r.comparison??r.comparisons??null,reference:r.reference??r.certifiedReference??null,reflectionPositivity:r.reflectionPositivity??null,cutoff:r.cutoff??null,errorBudget:r.errorBudget??null,transferOperator:r.transferOperator??null,ensembleDiagnostics:(r.replicas??r.ensemble?.replicas)?.map(x=>({start:x.start,seed:x.seed,retained:x.samples.length,acceptance:x.acceptance,plaquetteMean:x.statistics.plaquette.mean,ess:x.statistics.plaquette.effectiveSampleSize,confidenceInterval95:x.statistics.plaquette.confidenceInterval95,topologyDiagnostic:x.topologyDiagnostic}))??null,equilibriumDiagnostics:r.diagnostics?.equilibrium??r.ensemble?.diagnostics?.equilibrium??null,scopeBlockers:r.scopeBlockers??[],blockers:r.blockers??[]});
  if(r.kind==='gauge.lattice')fixtures.push({id:e.id,model:r.model,lattice:r.request.input.lattice,links:r.source.links,action:r.measurements.action,meanPlaquette:r.measurements.meanPlaquette,polyakov:r.measurements.meanPolyakovReal,sourceHash:r.sourceHash});
}
const summary={schema:'MathScope.M2.GaugeValidation/1',revision:REVISION,generatedAt:new Date().toISOString(),method:'Executed every registered real example, with separately stored numerical/negative Node tests, independent Python complex matrix checks and 80-digit Decimal/NumPy certification oracles.',examples:results,checklist:getChecklist(),proofBoundary:'Original finite classical/lattice, theorem-hypothesis and explicit-cutoff acceptance is implemented. Short or stalled chains can remain PARTIAL. No new Lean kernel run, general equilibrium/topological-sector theorem, continuum QFT construction or mass-gap proof is asserted.'};
await fs.writeFile(path.join(directory,'example-validation.json'),JSON.stringify(summary,null,2)+'\n');await fs.writeFile(path.join(directory,'independent-lattice-fixtures.json'),JSON.stringify(fixtures,null,2)+'\n');
const original=JSON.parse(await fs.readFile(new URL('../../evidence/original-m2-criteria.json',import.meta.url),'utf8')),independent=JSON.parse(await fs.readFile(path.join(directory,'certification-independent-validation.json'),'utf8'));
const evidenceById={
  'Y3-01':['tests/gauge.test.mjs','contracts.mjs'],
  'Y3-02':['tests/gauge.test.mjs','tests/independent.py','lattice.mjs'],
  'Y3-03':['tests/gauge.test.mjs','tests/independent.py','quaternion-oracle.mjs'],
  'Y3-04':['tests/gauge.test.mjs','README_KO.md','../../mathscope-m1/gauge/lean/MathScope/M1/Gauge/Transport.lean'],
  'Y3-05':['tests/gauge.test.mjs','tests/independent.py','lattice.mjs'],
  'Y3-06':['refinement.mjs','volume.mjs','tests/certification.test.mjs','tests/independent-certification.py'],
  'Y3-07':['transport-certificates.mjs','enclosures.mjs','tests/certification.test.mjs','tests/independent-certification.py'],
  'Y3-08':['tests/gauge.test.mjs','tests/visualization.test.mjs','tests/worker.test.mjs'],
  'Y4-01':['lattice.mjs','tests/gauge.test.mjs'],
  'Y4-02':['ensemble.mjs','tests/gauge.test.mjs','tests/certification.test.mjs'],
  'Y4-03':['reference.mjs','quaternion-oracle.mjs','enclosures.mjs','tests/certification.test.mjs','tests/independent-certification.py'],
  'Y4-04':['statistics.mjs','ensemble.mjs','tests/certification.test.mjs'],
  'Y4-05':['statistics.mjs','tests/gauge.test.mjs','tests/certification.test.mjs'],
  'Y4-06':['reflection.mjs','tests/certification.test.mjs','README_KO.md'],
  'Y4-07':['transfer.mjs','enclosures.mjs','tests/certification.test.mjs','tests/independent-certification.py'],
  'Y4-08':['ensemble.mjs','tests/gauge.test.mjs','tests/visualization.test.mjs','tests/worker.test.mjs']
};
const originalCriteria=['Y3','Y4'].flatMap(k=>original.packages[k].criteria),criterionReport={schema:'MathScope.M2.GaugeOriginalCriterionCompletion/1',revision:REVISION,generatedAt:summary.generatedAt,sourceName:original.sourceName,sourceSHA256:original.sourceSHA256,originalTextPreserved:true,criteria:originalCriteria.map(c=>({...c,...getChecklist().find(s=>s.id===c.id),evidencePaths:evidenceById[c.id]})),independentValidation:{path:'certification-independent-validation.json',passed:independent.passed,count:independent.count,negativeControls:independent.negativeControls.length},registeredExamples:results.length,successfulExamples:results.filter(x=>x.status==='COMPLETED').length,partialExamples:results.filter(x=>x.status==='PARTIAL').map(x=>x.id),notClaimed:['A new theorem-prover kernel execution','Uniform equilibration or exact integer topological-sector mixing','Unsupported graphs, groups or cutoff weights','Continuum quantum Yang–Mills construction','A mass-gap proof'],scopeRule:'The original finite acceptance criteria remain verbatim. IMPLEMENTED_FINITE_SCOPE describes the available algorithms and validated finite/theorem-bound cases; it does not force COMPLETED on every numerical request.'};
await fs.writeFile(path.join(directory,'criterion-completion.json'),JSON.stringify(criterionReport,null,2)+'\n');
const sourceHashes={},testHashes={};for(const p of (await fs.readdir(path.join(directory,'..'))).filter(x=>x.endsWith('.mjs')).sort()){const b=await fs.readFile(path.join(directory,'..',p));sourceHashes[p]=crypto.createHash('sha256').update(b).digest('hex');}for(const p of (await fs.readdir(path.join(directory,'../tests'))).filter(x=>/\.(mjs|py)$/.test(x)).sort()){const b=await fs.readFile(path.join(directory,'../tests',p));testHashes[p]=crypto.createHash('sha256').update(b).digest('hex');}
await fs.writeFile(path.join(directory,'source-hashes.json'),JSON.stringify({revision:REVISION,algorithmSourceSHA256:sourceHashes,validationSourceSHA256:testHashes},null,2)+'\n');
console.log(JSON.stringify({examples:results.length,successful:results.filter(x=>x.status==='COMPLETED').length,partial:results.filter(x=>x.status==='PARTIAL').length,allVisible:results.every(x=>x.renderedPoints>0),criteria:criterionReport.criteria.length,criterionStatuses:[...new Set(criterionReport.criteria.map(x=>x.status))],independentChecks:independent.count,outputDirectory:directory}));
