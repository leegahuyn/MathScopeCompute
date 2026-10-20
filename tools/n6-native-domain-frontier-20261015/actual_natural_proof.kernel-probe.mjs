/** Read-only original degree-zero source identity check; no numerical series. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const options={};for(let i=2;i<process.argv.length;i+=2){assert(process.argv[i].startsWith('--')&&process.argv[i+1]);options[process.argv[i].slice(2)]=process.argv[i+1];}
const root=resolve(options['kernel-root']??process.cwd()),payloadPath=resolve(options.payload??'work/native-result-small/NATIVE_PAYLOADS.json'),out=resolve(options.out??'work/actual_natural_proof.kernel-binding.json');
const payload=JSON.parse(await readFile(payloadPath,'utf8')),fixed=payload.fullNativePayloads.fixed,
  hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),
  sourcePath=resolve(root,'research-ide/mathscope-m2/navier/actual-continuation-exact-core.mjs'),before=await readFile(sourcePath),sourceSHA256=createHash('sha256').update(before).digest('hex');
assert.equal(hash(fixed),payload.fullNativePayloadSHA256.fixed);
const {prepareActualNaturalCoreProgram}=await import(pathToFileURL(sourcePath));
const actual=prepareActualNaturalCoreProgram({degree:0});
assert.deepEqual(actual.rootFields,fixed.core);
assert.deepEqual(actual.pressure,fixed.pressure);
assert.deepEqual(actual.outer,fixed.outer);
assert.deepEqual(actual.G.source,fixed.source);
// Bind every primitive ancestor of P0, including integrands absent from the
// small fixed.pressure root table, to the independently audited projection.
const pressureSeen=new Set(),pressureTodo=[fixed.core.P0];
while(pressureTodo.length){const id=pressureTodo.pop();if(pressureSeen.has(id))continue;pressureSeen.add(id);const n=actual.G.nodes[id];assert(n);if(['rational','coordinate','source_parameter'].includes(n.op))continue;pressureTodo.push(...(['integer_power','source_step_derivative'].includes(n.op)?n.args.slice(0,1):n.args));}
const pressurePrimitiveASTSHA256=hash([...pressureSeen].sort((a,b)=>a-b).map(id=>[id,actual.G.nodes[id]]));
assert.equal(pressureSeen.size,287);
assert.equal(pressurePrimitiveASTSHA256,'19a9eec59702f233d4744083aaef545f0d600d5549177ee8e8b3a143535c8152');
assert.deepEqual(before,await readFile(sourcePath));
const wrong=structuredClone(fixed.core);wrong.P0=wrong.g;
let rejected=false;try{assert.deepEqual(actual.rootFields,wrong);}catch{rejected=true;}
assert(rejected);
const result={schema:'MathScope.N6.ActualNaturalOriginalKernelRebinding/1',sourceRun:payload.sourceRun,fixedDefinitionSHA256:hash(fixed),sourcePath:'research-ide/mathscope-m2/navier/actual-continuation-exact-core.mjs',sourceSHA256,degreeZeroNodes:actual.G.nodes.length,allActualCoreRootsEqual:true,fullActualPressureDefinitionEqual:true,fullActualOuterProgramEqual:true,fullActualSourceProfileEqual:true,pressurePrimitiveAncestorCount:pressureSeen.size,pressurePrimitiveASTSHA256,sourceKernelBytesUnchanged:true,negativeControlPressureRootMutationRejected:true,finiteDegreeUsedAsInfiniteProof:false,independentAnalyticProof:'actual_natural_proof.md',all533ActiveCallDomainsProved:false,newDischarged:0};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify(result)+'\n');
