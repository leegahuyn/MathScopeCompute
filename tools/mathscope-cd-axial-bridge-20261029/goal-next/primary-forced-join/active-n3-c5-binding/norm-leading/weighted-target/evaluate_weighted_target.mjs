/** Directed replay of the original N0..N6 positive arithmetic frontier.
 * The supplied theorem receipts are independent, explicitly checked premises.
 * This is not an unconditional proof of their analytic or private-family premises.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [moduleFile,runtime,thresholdFile,historicalFile,artifact,matchFile,chartFile,chartProofFile,classificationFile,integralsFile,out]=process.argv.slice(2);
assert.ok(out);
const {load,sha,sourceArithmetic}=await import(pathToFileURL(resolve(moduleFile)).href);
const thresholds=await load(thresholdFile,'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const historical=await load(historicalFile,'03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
const native=JSON.parse(await readFile(resolve(artifact,'primary-c5-native.json')));
const frontier=await load(resolve(artifact,'primary-K-arithmetic-frontier.json'),native.normOperandBoundary.sha256);
const index=await load(resolve(artifact,'primary-K-binding-index.json'),native.normBindingIndex.sha256);
const [matchBytes,chartBytes,proofBytes,classificationBytes,integralsBytes]=await Promise.all([matchFile,chartFile,chartProofFile,classificationFile,integralsFile].map(p=>readFile(p)));
const [match,chart,proof,classification,integrals]=[matchBytes,chartBytes,proofBytes,classificationBytes,integralsBytes].map(x=>JSON.parse(x));
assert.equal(frontier.prefix,3);assert.equal(index.prefix,3);assert.equal(frontier.roots.K,index.normRoot);
assert.equal(match.status,'MATCHED_168_TYPED_FACE_ROOTS_PROVENANCE_REQUIRES_SEPARATE_ATTESTATION');
assert.equal(match.matchedCount,168);assert.equal(match.faceCount,672);
assert.equal(chart.status,'DIRECTED_COMMON_FTC_UPPER');assert.equal(chart.coefficientProofSHA256,sha(proofBytes));
assert.equal(proof.status,'PASS');assert.equal(proof.faceBound,'Each original nonconstant slow-chart coefficient FTC sum lies in [0,2^1521 H^119].');
assert.equal(index.targetSourceProfileSHA256,match.sourceProfile);assert.equal(match.sourceProfile,chart.parameterExpressionSHA256);
assert.equal(classification.status,'PASS_DEPENDENCY_CLASSIFICATION_ONLY');
assert.equal(integrals.status,'MATCHED_THREE_ORIGINAL_INTEGRALS_TO_ARCHIVED_BOUNDARIES');
assert.equal(integrals.liveExportSHA256,match.liveSHA256);assert.deepEqual(integrals.archivedIntervals,historical.boundaryIntervals);
const original=new Map(frontier.nodes.map(x=>[x.id,x.node]));
const boundaries=new Map(),replaced=new Map();
const put=(id,interval,kind)=>{assert.ok(original.has(id)&&!boundaries.has(id));boundaries.set(id,interval);replaced.set(id,kind);};
const byKey=r=>`${r.kind}/${r.component}/${r.radialOrder}/${r.etaOrder}`;
const target=new Map(index.targetFTC.map(r=>[byKey(r),r]));assert.equal(target.size,168);
for(const row of match.matched){const r=target.get(byKey(row));assert.ok(r);assert.equal(r.bound,row.liveC6Root);assert.deepEqual(r.faces.map(f=>f.upperBound),row.liveFaces);put(r.bound,row.directedInterval,'target');}
for(const row of index.coefficientFTC){if(row.sourceConstant||!original.has(row.bound))continue;assert.deepEqual(row.faces.map(f=>f.mask),[0,1,2,3,4,5,6,7]);put(row.bound,chart.enclosure,'slow-chart');}
for(const id of [239,257,275]){assert.deepEqual(original.get(id),historical.nodes.find(r=>r.id===id).node);put(id,historical.boundaryIntervals[id],'archived-integral');}
const stack=[...frontier.roots.weightedTarget],seen=new Set(),leaves=[],names=new Set(),nodes=[];
while(stack.length){const id=stack.pop();if(seen.has(id))continue;seen.add(id);const node=original.get(id);assert.ok(node,`missing #${id}`);
 if(boundaries.has(id)){leaves.push({id,originalOp:node.op,kind:replaced.get(id)});nodes.push({id,node:{op:'proved_original_operand',args:[]}});continue;}
 nodes.push({id,node});const {op,args}=node;
 if(op==='source_parameter')names.add(args[0]);else if(op==='integer_power')stack.push(args[0]);else if(op!=='rational'){
  assert.ok(['inverse','exp','log_positive','sqrt_positive','ceiling','ceiling_nonnegative','add','multiply','maximum'].includes(op),`No numerical enclosure for #${id} (${op})`);stack.push(...args);}}
const tally=Object.fromEntries(['target','slow-chart','archived-integral'].map(k=>[k,leaves.filter(x=>x.kind===k).length]));
assert.deepEqual(tally,{target:168,'slow-chart':1148,'archived-integral':3});
const {N,evaluateClosedArithmeticDefinitions,tracedArithmeticEvaluator}=await sourceArithmetic(runtime,thresholds.sourcePins,'coarse-upper');
const {values:parameters}=evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:[...names]});
const numericBoundaries=new Map(leaves.map(({id})=>[id,N.fromClosed(boundaries.get(id))]));
const evaluator=tracedArithmeticEvaluator({nodes,nonArithmeticBoundaries:leaves},N,{parameters,boundaries:numericBoundaries});
const rows=frontier.roots.weightedTarget.map((root,order)=>({order,root,enclosure:N.toClosed(evaluator.value(root))}));
const receipt={schema:'MathScope.ActiveOriginalWeightedTargetEnclosure/1',status:'DIRECTED_CONDITIONAL_N0_TO_N6',rows,leaves:tally,
 sourcePins:{frontier:native.normOperandBoundary.sha256,index:native.normBindingIndex.sha256,match:sha(matchBytes),chart:sha(chartBytes),chartProof:sha(proofBytes),classification:sha(classificationBytes),integrals:sha(integralsBytes)},
 trace:evaluator.report(),arithmetic:N.report(),fullKEnclosed:false,
 scope:'Conditional directed arithmetic at exact original N0..N6 roots. Assumes the archived target FTC intervals, slow-chart majorant and original source-integral intervals, and their source/private-family attestations. Other K dependencies are not bounded here.',release:'HOLD'};
await writeFile(out,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:receipt.status,leaves:tally,rows:rows.length}));
