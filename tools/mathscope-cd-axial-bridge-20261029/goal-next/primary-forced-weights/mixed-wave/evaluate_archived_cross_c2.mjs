import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

assert.equal(process.argv.length,6,'Use GOAL_NEXT ARITHMETIC_RUNTIME MIXED_WAVE_NUMERICAL OUT_JSON');
const [, ,goal,runtime,wavePath,out]=process.argv;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files={
  wave:[wavePath,'dc58aa3deb6f3b9fba10eae0f9081f1d6af56d67e2dfc98ce698240da3f86b3e'],
  mean:['primary-forced-weights/slow-nine/cross-c2-mean.json','68e9a2951bdfa90e87e962cb8fba45ba2cf8722ecb6e5d638f6bb093e07ed994'],
  c9:['primary-forced-weights/slow-nine/pointwise-norms.json','1c7b4fdef5a1757f94e4f46b24a4dc1bf6c202c15b22528e1e820ff851dba39c'],
  ledger:['primary-forced-weights/higher-mode-one/mode-one-valuation.json','62d2ba143b1257af8d80e2b184851ae4441d30bf197491fe00fd946473b8652c'],
  previousWave:['first-forced-mode-two-c1/mode-two-weighted-c1.json','e2bf09b924c42fa444029ac6ef41cb1fc86094bb65130c522c30e19e457f6be4'],
  fixed:['whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json','9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  threshold:['whole-k-selector-scales/historical-scale-arithmetic-result.json','af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf']
};
const helper=resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs');
const helperSHA='4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47';
assert.equal(sha(await readFile(helper)),helperSHA);
const {load,sourceArithmetic}=await import(pathToFileURL(helper).href);
const input=Object.fromEntries(await Promise.all(Object.entries(files).map(async ([name,[path,digest]])=>{
  const absolute=name==='wave'?resolve(path):resolve(goal,path);
  assert.notEqual(absolute,resolve(out));
  return [name,await load(absolute,digest)];
})));
const {wave,mean,c9,ledger,previousWave,fixed,threshold}=input;
const cycle=previousWave.source.cycleSHA256,forced=previousWave.source.forcedSHA256;
assert.equal(cycle,wave.originalGraphSHA256);
assert.equal(cycle,mean.sourceCycle);
assert.equal(cycle,fixed.sourceSHA256);
assert.equal(forced,mean.sourceForced);
assert.equal(forced,ledger.archive.graphSHA256);
assert.equal(ledger.archive.registrySHA256,previousWave.source.registrySHA256);
assert.equal(ledger.archive.checkedFundamentalParts,60);
assert.deepEqual(mean.domain,wave.domain);
assert.deepEqual(c9.domain,wave.domain);
const prefix=previousWave.source.sharedOriginalNodePrefix;
assert.deepEqual(prefix,{count:3860185,sha256:'2524f35161dfad02368893371e2dd121af3d72c1d5884cf0068b6ef1bdfe6598'});
const previous=new Map(previousWave.source.records.map(row=>[row.key,row]));
const longitudinalScales=[623025,3712237,3748917,3785599,3822281];
const paths=ledger.archive.cases.map(row=>{
  const {path:p}=previous.get(row.key);
  assert.deepEqual([row.path.Hw,row.path.w,row.path.pulse,row.path.difference],
    [p.Hw,p.w,p.pulse,p.levelDifference]);
  assert.equal(p.ci,longitudinalScales[0]);
  assert.equal(row.path.scale,longitudinalScales[p.levelDifference]);
  return {key:row.key,modeOne:row.path,previousSourceModeTwo:p};
});
assert.equal(paths.length,10);
const total=a=>a.reduce((x,y)=>x+y,0),key=a=>a.join(',');
const outputs=ledger.jets.filter(row=>row.total<=2);
assert.equal(outputs.length,21);
const wants=new Set(outputs.flatMap(row=>[-1,0,1,3].map(axis=>key(row.orders.map((d,j)=>d+Number(j===axis))))));
assert.equal(wants.size,52);
assert.deepEqual([...wants].sort(),mean.rows.map(row=>key(row.alpha)).sort());
const waveRows=wave.appliedBounds.rows.filter(row=>total(row.orders)<=3);
const available=new Set(waveRows.map(row=>key(row.orders)));
assert.equal(available.size,56);
assert.ok([...wants].every(index=>available.has(index)));
const pole=Math.max(...waveRows.flatMap(row=>[row.poles.real,row.poles.imaginary]));
assert.equal(pole,96);

const {N}=await sourceArithmetic(runtime,threshold.sourcePins,'coarse-upper');
const zero={rational:'0'},positive=upper=>N.fromClosed({lower:zero,upper});
const q=x=>N.point(String(x)),add=(...xs)=>xs.reduce((a,b)=>N.add(a,b),q(0));
const mul=(...xs)=>xs.reduce((a,b)=>N.mul(a,b),q(1));
const hosted=id=>N.fromClosed(fixed.hostedOriginal[id]),upper=value=>N.toClosed(value).upper;
const R=hosted(216823),r0=hosted(300171),kappa=hosted(617289),ellPlus17=add(hosted(617432),q(17));
const rInverse=mul(q(2),R),u=mul(q(2),N.inverse(kappa)),Tg=add(q(4),N.sqrt(q(2)));
const length=mul(q(2),r0,Tg,N.pow(ellPlus17,2));
const carrier=add(q(1),mul(add(R,q(1)),N.pow(R,42),add(q(1),
  mul(u,N.pow(R,31),N.inverse(mul(q(4),r0))),mul(q('1/2'),u))));
const C_R=N.max([rInverse,N.pow(rInverse,2),mul(q(2),N.pow(rInverse,3))]);
const FplusG=add(positive(c9.backgroundC9.F.upper),positive(c9.backgroundC9.G.upper));
const C_n=mul(carrier,N.max([add(q(1),mul(add(length,q(1)),FplusG)),C_R]));
const fixedAFast=mul(q(4),N.pow(R,3),N.exp(mul(q('1/100000'),hosted(9),ellPlus17,hosted(127))));
const C_a=mul(fixedAFast,N.max([q(1),mul(q(12),R),N.pow(mul(q(12),R),2)]));
const C_M=N.max(Object.values(mean.bounds).map(row=>positive(row.upper)));
const C_U=N.max(waveRows.flatMap(row=>[...row.real,...row.imaginary].map(root=>positive(wave.appliedBounds.upperEndpoints[root]))));
assert.deepEqual(Object.values(mean.bounds).map(row=>row.epsilonPowerNumerator),[199999,99999,99999]);
assert.deepEqual(wave.appliedBounds.exponents,{real:50000,imaginary:99999,pressure:100000});
const outputRows=outputs.map(row=>{
  const {total:d}=row;
  const scales={ordinary:2**(d+3),radialFast:4*3**d,connection:4*3**d,phase:12*3**d};
  for(const [real,imaginary] of row.meanWave){
    assert.equal(real.minEpsilonUnits,149998);
    assert.equal(imaginary.minEpsilonUnits,99999);
    assert.ok(real.maxLeafOrders.M<=d+1&&imaginary.maxLeafOrders.M<=d+1);
  }
  return {orders:row.orders,scales};
});
const upperByOrder=[0,1,2].map(d=>{
  const {ordinary,radialFast,connection,phase}=outputRows.find(row=>total(row.orders)===d).scales;
  return upper(mul(C_M,C_U,add(q(ordinary),mul(q(radialFast),C_a),mul(q(connection),C_R),mul(q(phase),C_n))));
});
for(const value of upperByOrder)assert.equal(N.compareEndpoints(value,zero),1);
const receipt={
  schema:'MathScope.ArchivedMeanWaveC2Numerical/1',
  status:'CONDITIONAL_DIRECTED_UPPER_ENDPOINTS_FOR_ORIGINAL_ARCHIVED_MEAN_WAVE_C2',
  originalCycle:cycle,originalFirstForced:forced,sharedPrefix:prefix,domain:wave.domain,
  exactOriginalPaths:paths,inputPins:Object.fromEntries(Object.entries(files).map(([name,[,pin]])=>[name,pin])),
  derivativeCoverage:{outputs:outputRows,meanIndices:52,waveIndicesThrough3:56,components:3},
  scalarUpperEndpoints:{C_M:upper(C_M),C_U:upper(C_U),C_a:upper(C_a),C_R:upper(C_R),C_n:upper(C_n)},
  upperByOrder,epsilonPowerDenominator:100000,epsilonPowers:{real:149998,imaginary:99999},
  retainedEnvelope:'sqrt(zeta) delta_*^(-96) P(v)',
  sourceFormula:'Full conservative divergence of M tensor U + U tensor M, with both cylindrical connections and all three original phase-gradient components.',
  scope:'The archived mean–wave interaction alone. Applies on the exact matched original fixed-label paths when the own and reference charts are admitted and have their original smooth zero joins. The affine H_w leaves R,Z,T and the chart bounds fixed as w varies. No full Forced C2, live whole-K application, final-field jets or release promotion.',
  arithmetic:N.report()
};
await writeFile(out,JSON.stringify(receipt)+'\n');
console.log(JSON.stringify({status:receipt.status,paths:paths.length,indices:outputRows.length,sha256:sha(await readFile(out))}));
