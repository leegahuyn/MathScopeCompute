import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {getExamples,runJob,getChecklist} from '../index.mjs';
const directory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../evidence');await fs.mkdir(directory,{recursive:true});
const results=[],fixtures=[];
for(const e of getExamples()){
  const r=await runJob(e.request);
  results.push({id:e.id,kind:r.kind,status:r.status,sourceHash:r.sourceHash,modelHash:r.modelHash??null,sampleHash:r.sampleHash??null,ensembleHash:r.ensembleHash??null,historyHash:r.historyHash??null,observationHash:r.visualization.observationHash??null,charts:r.charts?.map(c=>({id:c.id,sourceHash:c.sourceHash,observationHash:c.observationHash,coordinateTypes:c.observation.coordinateTypes}))??[],renderedPoints:r.visualization.points.length,rawObservationPoints:r.visualization.points.length,rawSourceBytes:JSON.stringify(r).length,checks:r.checks,gaugeCheck:r.gaugeCheck??null,refinement:r.levels??null,comparison:r.comparison??null,ensembleDiagnostics:r.replicas?.map(x=>({start:x.start,seed:x.seed,retained:x.samples.length,acceptance:x.acceptance,plaquetteMean:x.statistics.plaquette.mean,ess:x.statistics.plaquette.effectiveSampleSize,confidenceInterval95:x.statistics.plaquette.confidenceInterval95}))??null,scopeBlockers:r.scopeBlockers??[],blockers:r.blockers??[]});
  if(r.kind==='gauge.lattice')fixtures.push({id:e.id,model:r.model,lattice:r.request.input.lattice,links:r.source.links,action:r.measurements.action,meanPlaquette:r.measurements.meanPlaquette,polyakov:r.measurements.meanPolyakovReal,sourceHash:r.sourceHash});
}
const summary={schema:'MathScope.M2.GaugeValidation/1',generatedAt:new Date().toISOString(),method:'Executed eight real examples plus the separately stored numerical/negative Node suite and independent Python matrix oracle.',examples:results,checklist:getChecklist(),proofBoundary:'No new Lean kernel run, certified equilibrium, reflection-positivity application, transfer-matrix cutoff, continuum QFT or mass-gap proof.'};
await fs.writeFile(path.join(directory,'example-validation.json'),JSON.stringify(summary,null,2)+'\n');await fs.writeFile(path.join(directory,'independent-lattice-fixtures.json'),JSON.stringify(fixtures,null,2)+'\n');
const sourceFiles=['contracts.mjs','lattice.mjs','statistics.mjs','ensemble.mjs','index.mjs'];const sourceHashes={};for(const p of sourceFiles){const b=await fs.readFile(path.join(directory,'..',p));sourceHashes[p]=crypto.createHash('sha256').update(b).digest('hex');}
await fs.writeFile(path.join(directory,'source-hashes.json'),JSON.stringify({revision:'m2-gauge-1.0.0',algorithmSourceSHA256:sourceHashes},null,2)+'\n');
console.log(JSON.stringify({examples:results.length,successful:results.filter(x=>x.status==='COMPLETED').length,partial:results.filter(x=>x.status==='PARTIAL').length,allVisible:results.every(x=>x.renderedPoints>0),outputDirectory:directory}));
