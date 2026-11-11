import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [repository,sourceDir,inputPath,outputPath]=process.argv.slice(2).map(s=>resolve(s));
const revision='f8cb4034e86d7b669d52a6f2248aebba156b51b5';
const names=['actual-numerical-exponential-arithmetic.mjs','actual-closed-parameter-arithmetic.mjs',
  'actual-selection-arithmetic-enclosure-kernel.mjs'];
const modules=names.map(name=>join(sourceDir,'research-ide/mathscope-m2/navier',name));
const pins={};
function pinSource(file){
  const path=relative(sourceDir,file).split('\\').join('/');
  assert(!path.startsWith('..'));
  if(pins[path])return;
  const raw=readFileSync(file);
  const original=execFileSync('git',['-c','core.longpaths=true','-C',repository,'show',`${revision}:${path}`],{maxBuffer:16*1024*1024});
  assert.deepEqual(raw,original,path);
  pins[path]=createHash('sha256').update(raw).digest('hex');
  for(const [,specifier] of raw.toString('utf8').matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)){
    pinSource(resolve(dirname(file),specifier));
  }
}
modules.forEach(pinSource);
const [{numericalExponentialArithmetic},{evaluateClosedArithmeticDefinitions},{tracedArithmeticEvaluator}]=
  await Promise.all(modules.map(path=>import(pathToFileURL(path).href)));
const raw=readFileSync(inputPath);
const input=JSON.parse(raw);
assert.equal(input.graphSHA256,'75db9fddc311fb7ce8d7968fbde4a52a07521cf8d47feb0b8f302d6bed108987');
assert.equal(input.archiveNumericalSHA256,'0c7285a274b3442eca8cf2127c3d279f8a09ec0db48f5d444006f23d324b3cd8');
assert.deepEqual(input.roots,{historicalLogC1:137420,historicalLogC2:163613,historicalLogC3:212868});
const N=numericalExponentialArithmetic({precisionBits:256,maxOperations:200_000_000,maxMemoEntries:80_000});
const parameters=evaluateClosedArithmeticDefinitions(input.definitions,N,{names:input.parameters}).values;
const boundaries=new Map(Object.entries(input.boundaryIntervals).map(([key,value])=>[Number(key),N.fromClosed(value)]));
const evaluator=tracedArithmeticEvaluator(input,N,{parameters,boundaries,maxNodeVisits:100_000});
const tower=(n,x)=>n===0?{rational:String(x)}:{exp:tower(n-1,x)};
const separator=tower(5,1048592);
const C=N.fromClosed(input.archivedEllMinimumInterval);
const thresholds=Object.fromEntries([10,14,15,16,17].map(k=>[k,N.toClosed(N.mul(N.add(C,N.point(String(k))),N.log(N.point('2'))))]));
const rows=[];
function save(complete){
  const result={schema:'MathScope.N7.OriginalHistoricalScaleUpperReplay/1',sourceRevision:revision,sourcePins:pins,
    inputSHA256:createHash('sha256').update(raw).digest('hex'),separator,thresholds,rows,complete,arithmetic:N.report(),
    trace:evaluator.report(),scope:'Only historical c1/c2/c3 alternatives; actual higher common FTC branches remain open.'};
  const output=JSON.stringify(result,null,2)+'\n';
  writeFileSync(outputPath,output);
  if(complete) process.stdout.write(`${createHash('sha256').update(output).digest('hex')}  ${outputPath}\n`);
}
for(const [name,root] of Object.entries(input.roots)){
  const interval=N.toClosed(evaluator.value(root));
  const below=N.compareEndpoints(interval.upper,separator)<0;
  const comparison=Object.fromEntries(Object.entries(thresholds).map(([k,v])=>[k,
    N.compareEndpoints(interval.upper,v.lower)<0?'STRICTLY_BELOW':
    N.compareEndpoints(interval.lower,v.upper)>0?'STRICTLY_ABOVE':'INTERVALS_OVERLAP']));
  rows.push({name,root,interval,strictlyBelowSeparator:below,againstCPlusKLog2:comparison});
  save(false);
  process.stdout.write(`${name} ${JSON.stringify(comparison)}\n`);
}
save(true);
