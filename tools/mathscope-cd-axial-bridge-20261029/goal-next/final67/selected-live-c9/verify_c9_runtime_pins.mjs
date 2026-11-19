import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {dirname, relative, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [goalPath,workPath,output] = process.argv.slice(2);
assert.equal(process.argv.length,5);
const goal=resolve(goalPath),work=resolve(workPath);
const original=resolve(work,'continuation27/original-primary-degree-runtime');
const arithmeticRuntime=resolve(work,'annular-numeric-24/pinned-original-runtime');
const sourceRepo=resolve(goal,'../../..');
const sourceCommit='f8cb4034e86d7b669d52a6f2248aebba156b51b5';
const gitTree=execFileSync('git',['-c','safe.directory='+sourceRepo.replaceAll('\\','/'),
  '-C',sourceRepo,'ls-tree','-r',sourceCommit],{encoding:'utf8',maxBuffer:30*1024*1024});
const gitBlob=new Map(gitTree.split(String.fromCharCode(10)).filter(Boolean).map(row=>{
  const [entry,path]=row.split(String.fromCharCode(9));
  return [path,entry.split(' ')[2]];
}));
const checked=new Set();
const navier=name=>resolve(original,'research-ide/mathscope-m2/navier',name);
const arithmeticNavier=name=>resolve(arithmeticRuntime,'research-ide/mathscope-m2/navier',name);
const sha=body=>createHash('sha256').update(body).digest('hex');
async function pinned(relativeRoot,module){
  if(checked.has(module))return;
  checked.add(module);
  const name=relative(relativeRoot,module).replaceAll('\\','/');
  const data=await readFile(module);
  const object=createHash('sha1').update('blob '+data.length+String.fromCharCode(0)).update(data).digest('hex');
  assert.equal(object,gitBlob.get(name),name);
  for(const match of data.toString('utf8').matchAll(/(?:\bfrom\s+|\bimport\s*(?:\(\s*)?)['"](\.[^'"]+)['"]/g)){
    await pinned(relativeRoot,resolve(dirname(module),match[1]));
  }
}
const sourceModuleNames=['actual-residual-order-induction-source.mjs','actual-residual-order-induction-norms.mjs','actual-residual-order-induction-kernels.mjs',
  'actual-continuation-arithmetic.mjs'];
for(const name of sourceModuleNames)await pinned(original,navier(name));
const traceModule=arithmeticNavier('actual-common-selection-arithmetic-trace.mjs');
await pinned(arithmeticRuntime,traceModule);
const data={schema:'MathScope.N7.C9RuntimeSourcePins/1',originalCommit:sourceCommit,originalSources:checked.size,
  modules:[...checked].map(full=>{
    const root=full.startsWith(arithmeticRuntime)?arithmeticRuntime:original;
    const file=relative(root,full).replaceAll('\\','/');
    return {file,gitBlob:gitBlob.get(file)};
  }).sort((a,b)=>a.file.localeCompare(b.file)), originallyRetained:true};
await writeFile(output,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
