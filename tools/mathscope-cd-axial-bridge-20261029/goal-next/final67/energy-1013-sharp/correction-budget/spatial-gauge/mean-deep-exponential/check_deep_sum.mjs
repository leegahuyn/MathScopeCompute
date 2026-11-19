/** Independent controls for the opt-in deep positive addition cap. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {makeFineArithmeticModule} from './fine_arithmetic_module.mjs';

const [goal,runtime,output]=process.argv.slice(2);
assert.equal(process.argv.length,5);
const original=await import(pathToFileURL(resolve(goal,
  'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const thresholds=await original.load(resolve(goal,
  'whole-k-selector-scales/historical-scale-arithmetic-result.json'),
  'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const fine=await import(await makeFineArithmeticModule(goal));
const prior=(await original.sourceArithmetic(runtime,thresholds.sourcePins,'coarse-upper')).N;
const improved=(await fine.sourceArithmetic(runtime,thresholds.sourcePins,'coarse-upper')).N;
const tower=(depth,value)=>{
  let point={rational:String(value)};
  for(let i=0;i<depth;i++)point={exp:point};
  return point;
};
const rows=[];
for(const [depth,value,eligible] of [[2,256,true],[3,256,true],[7,1048576,true],[1,256,false],[2,1,false]]) {
  const endpoint=tower(depth,value),closed={lower:endpoint,upper:endpoint};
  const a=prior.fromClosed(closed),b=improved.fromClosed(closed);
  const start=improved.report().deepPositiveSumRefinements;
  const old=prior.toClosed(prior.add(a,a));
  const next=improved.toClosed(improved.add(b,b));
  const refinements=improved.report().deepPositiveSumRefinements-start;
  assert.equal(refinements,eligible?1:0);
  const comparison=improved.compareEndpoints(next.upper,old.upper);
  assert.equal(comparison,eligible?-1:0);
  rows.push({depth,value,eligible,refinements,old,next,upperComparison:comparison});
}
const result={
  status:'PASS_DEEP_POSITIVE_SUM_CAP_AND_GUARD_CONTROLS',
  rows,
  sufficientSeed:'For t>=256 and delta=2^-128, exp(t)*(exp(delta)-1)>=2^256*delta=2^128>=1. Thus exp(exp(t+delta))>=exp(1)*exp(exp(t))>=2*exp(exp(t)). Higher exp layers retain the factor-two order.',
  missingDepthControl:'For depth one, exp(t+delta)/exp(t)=exp(delta)<2, so the proposed shifted point alone would not bound x+x. The implementation requires at least two layers.',
  scope:'Arithmetic endpoint enclosures only. Source inputs and analytic mean bounds remain independent.',
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log('PASS three strict deep-sum refinements and two disabled-guard controls');
