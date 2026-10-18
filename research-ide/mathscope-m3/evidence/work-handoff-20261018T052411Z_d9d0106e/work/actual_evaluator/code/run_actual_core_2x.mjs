import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(process.argv[2]??'.'),out=path.resolve(process.argv[3]??'work/actual_evaluator/evidence');
const manifest=JSON.parse(await readFile(path.join(root,'work/actual_evaluator/evidence/CORE_SOURCE_MANIFEST.json')));
for(const f of manifest.files){const actual=createHash('sha256').update(await readFile(path.join(root,'work/actual_evaluator/core_source',f.path))).digest('hex');if(actual!==f.sha256)throw Error('Changed original core module '+f.path);}
const {evaluateSourceCoreRefinement}=await import(pathToFileURL(path.join(root,'work/actual_evaluator/core_source/research-ide/mathscope-m3/navier/source-core-refinement.mjs')).href);
const request={gridLevels:[1,2],degrees:[32,64],precisionBits:[128,256],baseGrid:1,baseDegree:32,baseBits:128};
const start=Date.now();let record;
try{const result=await evaluateSourceCoreRefinement(request);record={schema:'MathScope.ActualCoreTwofoldExecution/1',request,elapsedMilliseconds:Date.now()-start,result,
  actualFinalFieldEvaluated:false,actualLastResolvedTau:null,
  scope:'Fresh actual original inner leading-profile evaluation only. Comparison polynomial degree is not actual nonlinear recurrence order. No Fourier axis, axial/pulse resolution, uniform spatial interpolation, localized final field, or whole-K energy is supplied.'};}
catch(e){record={schema:'MathScope.ActualCoreTwofoldExecution/1',request,elapsedMilliseconds:Date.now()-start,errorCode:e.code??null,errorMessage:e.message,actualFinalFieldEvaluated:false,actualLastResolvedTau:null};}
await mkdir(out,{recursive:true});await writeFile(path.join(out,'ACTUAL_CORE_TWO_FOLD_EXECUTION.json'),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({elapsedMilliseconds:record.elapsedMilliseconds,uniqueCoreEvaluations:record.result?.execution.uniqueCoreEvaluations,errorCode:record.errorCode??null,actualLastResolvedTau:null}));
