import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(process.argv[2]??'.'),out=path.resolve(process.argv[3]??'work/actual_evaluator/evidence');
const source='work/n602_continuation/source/research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs';
const {evaluateSourceProgramDiagnostic}=await import(pathToFileURL(path.join(root,source)).href);
const headerPath='analysis/base/PR30-primary67-continuation/pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json';
const raw=await readFile(path.join(root,headerPath));const header=JSON.parse(raw);const regs={};
function unpack(d){for(const[k,v]of Object.entries(d)){if(k==='base')unpack(v);else if(typeof v==='string'){try{regs[k]=JSON.parse(v);}catch{}}}}
unpack(header.definitions);const parametersExactExpressions=regs.fixed.source.parametersExactExpressions;
const attempts=[];
for(const parameter of ['h','T','lambda']){
  const program={schema:'MathScope.ActualSourceFunctionProgram/1',parametersExactExpressions,
    nodes:[{op:'source_parameter',args:[parameter]}],roots:{parameter:0}};
  let result;
  try{result={returned:evaluateSourceProgramDiagnostic(program,0,{maxOperations:100000,quadratureCells:64})};}
  catch(e){result={errorCode:e.code??null,message:e.message};}
  attempts.push({parameter,parameterOverridesUsed:false,coordinateOverridesUsed:false,...result});
}
await mkdir(out,{recursive:true});const record={schema:'MathScope.OriginalActualNumericBackendAttempt/1',
  source,sourceSHA256:createHash('sha256').update(await readFile(path.join(root,source))).digest('hex'),
  headerSHA256:createHash('sha256').update(raw).digest('hex'),attempts,
  fieldNumericallyEvaluated:false,actualLastResolvedTau:null,
  scope:'Execution of the recovered original diagnostic arithmetic on unchanged source parameters. It is binary64, not a certified interval engine. Failure is recorded without fallback parameter substitution.'};
await writeFile(path.join(out,'ORIGINAL_NUMERIC_BACKEND_ATTEMPT.json'),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({attempts:attempts.map(({parameter,errorCode})=>({parameter,errorCode})),actualLastResolvedTau:null}));
