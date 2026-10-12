/** Exploratory independent SU2 scale pilot. No target masses enter this run. */
import {writeFile,mkdir} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {su2Geometry,su2Initial,heatbathSweep,standardFlowCurve,wilsonSummary,packedSourceHash,SCALE_FLOW_CONVENTION} from '../su2-kernel.mjs';
import {rngFromSeed} from '../../../mathscope-m2/gauge/contracts.mjs';
const rows=JSON.parse(process.argv[2]??'[{"beta":2.1,"Ns":4,"Nt":8},{"beta":2.3,"Ns":6,"Nt":12},{"beta":2.4,"Ns":8,"Nt":16}]');
const outputName=process.argv[3]??'pilot-scale-attempt1.json';if(!/^[A-Za-z0-9._-]+\.json$/.test(outputName))throw new Error('A safe new output filename is required.');
const out={schema:'MathScope.M3.IndependentScalePilot/1',phase:'EXPLORATORY_SCALE_ONLY_NO_MASS_TARGET',normalization:SCALE_FLOW_CONVENTION,rows:[]},started=performance.now();
await mkdir(new URL('../evidence/scale-expansion/',import.meta.url),{recursive:true});
const outputURL=new URL('../evidence/scale-expansion/'+outputName,import.meta.url);await writeFile(outputURL,JSON.stringify(out,null,2)+'\n',{flag:'wx'});
for(const row of rows){
 const g=su2Geometry(row.Ns,row.Nt),samples=[];let links=su2Initial(g,`m3-scale-pilot-init-${row.beta}`),rng=rngFromSeed(`m3-scale-pilot-update-${row.beta}`);const start=performance.now();
 for(let k=0;k<160;k++){heatbathSweep(links,g,row.beta,rng);heatbathSweep(links,g,row.beta,rng,{overrelaxation:true});}
 console.log(JSON.stringify({phase:'burned',...row,seconds:(performance.now()-start)/1000,plaquette:wilsonSummary(links,g,row.beta).meanPlaquette}));
 for(let i=0;i<8;i++){
  for(let k=0;k<12;k++){heatbathSweep(links,g,row.beta,rng);heatbathSweep(links,g,row.beta,rng,{overrelaxation:true});}
  const sourceHash=await packedSourceHash(links,row),flow=await standardFlowCurve(links,g,{maxTime:3.2,step:.04,measureEvery:2});samples.push({sample:i,sourceHash,curve:flow.curve});
  console.log(JSON.stringify({phase:'scale-configuration',...row,sample:i,maximumT2E:Math.max(...flow.curve.map(p=>p.t2E)),seconds:(performance.now()-start)/1000}));
 }
 const curve=samples[0].curve.map((p,i)=>({t:p.t,t2E:samples.reduce((s,x)=>s+x.curve[i].t2E,0)/samples.length,t2EPlaquette:samples.reduce((s,x)=>s+x.curve[i].t2EPlaquette,0)/samples.length}));
 let crossing=null;for(let i=1;i<curve.length;i++)if(curve[i-1].t2E<.1&&curve[i].t2E>=.1){crossing=curve[i-1].t+(.1-curve[i-1].t2E)*(curve[i].t-curve[i-1].t)/(curve[i].t2E-curve[i-1].t2E);break;}
 out.rows.push({...row,samples,curve,crossing,status:crossing?'BRACKETED_EXPLORATORY':'NOT_BRACKETED',aOverSqrtT0:crossing?1/Math.sqrt(crossing):null,LOverSqrtT0:crossing?row.Ns/Math.sqrt(crossing):null});
 await writeFile(outputURL,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({phase:'row-complete',...row,crossing,seconds:(performance.now()-start)/1000}));
}
console.log(JSON.stringify({phase:'complete',seconds:(performance.now()-started)/1000}));
