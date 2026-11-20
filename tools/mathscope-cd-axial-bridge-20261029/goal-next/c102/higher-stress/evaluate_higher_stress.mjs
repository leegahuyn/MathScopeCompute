/** Directed ordinary C4 inputs for the three actual higher stress coefficients. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [goal,work,input,out]=process.argv.slice(2);
const sha=data=>createHash('sha256').update(data).digest('hex');
async function json(path,pin){
 const raw=await readFile(path);
 if(pin) assert.equal(sha(raw),pin,path);
 return [JSON.parse(raw),sha(raw)];
}
const [[trace,traceSHA],[history,historySHA],[selection,selectionSHA],[background,backgroundSHA]] = await Promise.all([
 json(input),
 json(resolve(work,'whole-k-prefix/historical-scale-arithmetic-input.json'),
  '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0'),
 json(resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'),
  'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'),
 json(resolve(goal,'c101/background12/background-c12.json')),
]);
assert.equal(trace.schema,'MathScope.C102.OriginalPositiveStressFieldNormTrace/1');
assert.equal(background.leading.leadingLogCap,'H/2^300');
assert.equal(background.leading.leadingLogCapSign,-1);
assert.deepEqual(trace.normalized.map(row=>Object.keys(row.maximumThrough4)),
 Array.from({length:3},()=>['E','U','Pi','VOverR']));
const {sourceArithmetic}=await import(pathToFileURL(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const {N,evaluateClosedArithmeticDefinitions,tracedArithmeticEvaluator}=
 await sourceArithmetic(resolve(work,'annular-numeric-24/pinned-original-runtime'),selection.sourcePins,'coarse-upper');
const R='C12EnvelopeR';
const names=[...new Set([...trace.trace.sourceParameters,'h',R,'Lambda','Xa','t1'])];
const parameters=evaluateClosedArithmeticDefinitions(history.definitions,N,{names}).values;
const boundaries=new Map();
assert.deepEqual(trace.trace.nonArithmeticBoundaries.map(row=>row.id),[239,257,275]);
for(const row of trace.trace.nonArithmeticBoundaries){
 assert.deepEqual(row.node,history.nodes.find(w=>w.id===row.id).node);
 boundaries.set(row.id,N.fromClosed(history.boundaryIntervals[row.id]));
}
const ev=tracedArithmeticEvaluator(trace.trace,N,{parameters,boundaries,maxNodeVisits:trace.trace.nodeCount});
const ell=N.fromClosed(history.archivedEllMinimumInterval),two=N.point('2');
const H=N.mul(parameters.get('h'),N.mul(N.add(ell,N.point('15')),N.log(two)));
const gate=N.toClosed(N.div(H,N.pow(two,288))).lower;
const rows=trace.normalized.map(row=>{
  const fields=Object.fromEntries(Object.entries(row.maximumThrough4).map(([name,root])=>{
    const value=N.max([N.one(),ev.value(root)]);
    const logarithm=N.toClosed(N.log(value)).upper;
    const sign=N.compareEndpoints(logarithm,gate);
    assert.equal(sign,-1,'original C4 norm log comparison n='+row.order+' '+name);
    return [name,{root,upper:N.toClosed(value).upper,logarithm,sign}];
  }));
  return {order:row.order,normalizedSourceCalls:row.actualSourceRoots,fields};
});
const geometry=Object.fromEntries([
 ['radialInverseDominatedByEnvelope',N.compareEndpoints(N.toClosed(parameters.get('Lambda')).upper,N.toClosed(parameters.get(R)).lower)],
 ['innerScaleBelowOneOver128',N.compareEndpoints(N.toClosed(parameters.get('t1')).upper,N.toClosed(N.point('1/128')).lower)]
]);
assert.deepEqual(Object.values(geometry),[-1,-1]);
const receipt={
 schema:'MathScope.C102.DirectedOriginalHigherStressFieldC4/1',
 pins:{traceSHA,historySHA,selectionSHA,backgroundSHA},
 originalOrders:[1,2,3],derivativeOrder:4,originalIntegralBoundaries:[239,257,275],
 logCap:'H/2^288',leadRawF0U0LogCap:background.leading.leadingLogCap,traceNodeCount:trace.trace.nodeCount,
 rows,geometry,scope:'Original admitted real profile, all fixed one-sided eta jets and inherited normalized source pressure estimate.',
 release:'HOLD'
};
await writeFile(out,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({originalOrders:receipt.originalOrders,fields:12,traceRecords:trace.trace.nodeCount,strictLogComparisons:12}));
