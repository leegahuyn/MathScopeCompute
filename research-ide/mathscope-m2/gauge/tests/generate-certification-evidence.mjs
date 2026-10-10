import fs from 'node:fs/promises';
import * as M from '../../../mathscope-m1/gauge/matrix.mjs';
import {availableGroups,createGroup,fromCoordinates} from '../../../mathscope-m1/gauge/groups.mjs';
import {createField,evaluateJet} from '../../../mathscope-m1/gauge/fields.mjs';
import {getExamples,runJob} from '../index.mjs';
import {rngFromSeed,SU2} from '../contracts.mjs';
import {auditedExponential,auditedTransport,connectionEnclosure} from '../transport-certificates.mjs';
import {besselI,expEnclosure,su2Reference} from '../enclosures.mjs';
const examples=getExamples(),bpst=examples.find(e=>e.id==='m2-bpst-refinement').request.input.field,exponentials=[],transports=[],fieldEnclosures=[],rng=rngFromSeed('independent-exponential-audit');
for(const item of availableGroups()){
  const group=createGroup(item.spec),H=fromCoordinates(group,Array.from({length:group.dimension},()=>.2*(rng.uniform()-.5))),e=auditedExponential(H);exponentials.push({group:group.id,input:M.jsonMatrix(H),output:M.jsonMatrix(e.matrix),certificate:{errorUpper:e.errorUpper,roundoffUpper:e.roundoffUpper,truncationUpper:e.truncationUpper,terms:e.terms,squarings:e.squarings}});
  for(const embedding of group.data.embeddings){
    const field=createField(group,{...bpst,embedding:embedding.id}),x=[.2,-.3,.1,.4],y=[.325,-.3,.1,.4];
    for(const steps of (group.id==='SU2'?[4,8]:[4])){const t=auditedTransport(field,x,y,steps);transports.push({group:group.id,embedding:embedding.id,sourceGenerators:embedding.matrixGenerators,field:field.spec,x,y,steps,output:M.jsonMatrix(t.matrix),certificate:t.certificate});}
  }
}
for(const kind of ['FULL_BASIS_TRIAL','BPST_PLUS_PERTURBATION'])for(const mode of ['GAUSSIAN_POLYNOMIAL','FOURIER']){
  const field=createField(createGroup(SU2),{...bpst,kind,...(kind==='FULL_BASIS_TRIAL'?{rho:null,embedding:null}:{}),perturbation:{kind:mode,length:1.2,amplitude:.07,seed:'high-precision-field-source',modes:mode==='FOURIER'?[{wave:[1,-2,1,0],parity:'SIN',phase:.3},{wave:[0,1,-1,2],parity:'COS',phase:-.2}]:[[1,1,0,0],[0,2,1,0]]}}),x=[.2,-.3,.1,.4];
  fieldEnclosures.push({field:field.spec,x,basis:field.group.data.basis.matrices,embedding:field.group.selectedEmbedding?.matrixGenerators??null,enclosures:[0,1,2,3].map(mu=>connectionEnclosure(field,x.map(v=>({lower:v,upper:v})),mu)),computed:evaluateJet(field,x,{order:0}).A.map(M.jsonMatrix)});
}
const transfer=await runJob(examples.find(e=>e.id==='m2-su2-cube-transfer-cutoff').request),reference=await runJob(examples.find(e=>e.id==='m2-su2-small-lattice-reference').request),volume=await runJob(examples.find(e=>e.id==='m2-bpst-fixed-volume').request),refinements=[];
for(const e of examples.filter(e=>e.request.kind==='gauge.lattice-refinement')){const r=await runJob(e.request);refinements.push({id:e.id,model:r.model,reference:r.reference,levels:r.levels,topology:r.topology,boundaryError:r.boundaryError});}
const fixture={schema:'MathScope.M2.GaugeIndependentCertificationFixtures/1',generatedAt:new Date().toISOString(),groupCount:availableGroups().length,expCases:[-100,-20,-1,-.001,0,.001,1,20,100].map(x=>({x,enclosure:expEnclosure(x)})),besselCases:[0,.1,.5,2,6,15,20].flatMap(x=>[0,1,2,3,4,9,20].map(n=>({n,x,enclosure:besselI(n,x)}))),su2Cases:[0,.1,2,6,20].map(x=>su2Reference(x)),exponentials,transports,fieldEnclosures,refinements,volume:{model:volume.model,reference:volume.reference,levels:volume.levels,convergence:volume.convergence},transfer:{model:transfer.model,cutoff:transfer.cutoff,rows:transfer.source.rows,gram:transfer.gram,operator:transfer.transferOperator,error:transfer.errorBudget},reference:{model:reference.model,reference:reference.reference,rows:reference.source.rows.slice(0,3),configurations:reference.source.firstConfigurations,comparisons:reference.comparisons,independentControls:reference.independentControls}};
await fs.writeFile(new URL('../evidence/certification-fixtures.json',import.meta.url),JSON.stringify(fixture)+'\n');console.log(JSON.stringify({matrixExponentials:exponentials.length,analyticTransports:transports.length,fieldEnclosures:fieldEnclosures.length,scalarIntervals:fixture.expCases.length+fixture.besselCases.length+fixture.su2Cases.length,fixtureBytes:JSON.stringify(fixture).length}));
