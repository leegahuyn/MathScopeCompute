/** Bind the mean side of the complete archived mean–wave C2 derivative stencil. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sha, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [goal,runtime,covariancePath,output]=process.argv.slice(2);
assert.equal(process.argv.length,6,'Use GOAL_NEXT ORIGINAL_RUNTIME COVARIANCE_MEAN OUTPUT.');
const mean = 'primary-forced-weights/higher-mean/';
const pins = {
  baseline:['whole-k-annular-pressure-lower/mean-path-longitudinal.json','e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59'],
  longitudinal:[mean+'mean-longitudinal.json','778a1058ffff15e9f80c3066645218b51b4ce52aa75514172008e05150ec94b9'],
  longitudinalNumeric:[mean+'mean-longitudinal-numerical.json','6775bdc52b8586ca618b4172906dbbb846fc7606afc7cf4c1c9cdadd61bd5e55'],
  transverse:[mean+'mean-transverse-c3.json','121c25bb1dc783bec4004184e829db082d3cf074a6698a2004a011c6ea6863c8'],
  fullSlow:['primary-forced-weights/full-slow-norms/full-slow-norms.json','517662b18f4014644cd7539de42b82b74999374aaf34273163f39693f160bdb4'],
  ledger:['primary-forced-weights/higher-mode-one/mode-one-valuation.json','62d2ba143b1257af8d80e2b184851ae4441d30bf197491fe00fd946473b8652c'],
  c1:['primary-forced-weights/higher-mode-one/mean-wave-c1-roots.json','6374e0d1395fa8764c755ff66511e6379358fcc6ed9474b6afdaee44a0324203'],
  fixed:['whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json','9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  thresholds:['whole-k-selector-scales/historical-scale-arithmetic-result.json','af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
};
const covariancePin = '1b23727273405976142d0a07edaa0024aec67674c416d12ce81d9362e859f4fd';
const [evidence,covariance]=await Promise.all([
  Promise.all(Object.entries(pins).map(async ([key,[file,pin]])=>
    [key,await load(resolve(goal,file),pin)])).then(Object.fromEntries),
  load(covariancePath,covariancePin),
]);
const {baseline,longitudinal,longitudinalNumeric,transverse,fullSlow,ledger,c1,fixed,thresholds}=evidence;
assert.equal(covariance.sourceGraphSHA,baseline.sourceSHA256);
assert.equal(longitudinal.source.graphSHA256,baseline.sourceSHA256);
assert.equal(longitudinalNumeric.meanReceiptSHA256,pins.longitudinal[1]);
assert.equal(transverse.source.graphSHA256,baseline.sourceSHA256);
assert.equal(fixed.sourceSHA256,baseline.sourceSHA256);
assert.deepEqual(covariance.domain,longitudinalNumeric.fullSlowInputDomain);
assert.deepEqual(covariance.domain,fullSlow.domain);
assert.deepEqual(covariance.actualMeanSource,{meanV:3614791,fiveMapV:3614767,freshP:3614334,freshJz:3614420,earlyEz:643883,axialPressureDerivative:643849});
assert.deepEqual(ledger.axes,['R','Z','T','xi','v']);
assert.equal(ledger.degreeSummary[2].meanWave.maxLeafOrders.M,3);
assert.equal(ledger.degreeSummary[2].meanWave.maxLeafOrders.L,3);
assert.equal(c1.originalSource.forced,ledger.archive.graphSHA256);
assert.equal(c1.originalSource.cycle,baseline.sourceSHA256);

const previous=[...baseline.nodes,...longitudinal.positive.extension];
assert.equal(transverse.positive.previousCount,previous.length);
assert.equal(transverse.positive.previousSHA256,sha(JSON.stringify(previous)));
const graph=[...previous,...transverse.positive.extension];
assert.equal(transverse.positive.graphSHA256,sha(JSON.stringify(graph)));
const zero = {rational:'0'};
const components=['betaWithoutEpsilon','v','gamma'];
const fixedOrders = (dimension,degree)=>dimension===1 ? [[degree]] :
  Array.from({length:degree+1},(_,n)=>fixedOrders(dimension-1,degree-n).map(row=>[n,...row])).flat();
const indices=new Map();
for (const alpha of [0,1,2].flatMap(degree=>fixedOrders(5,degree))) {
  for (const base of [-1,0,1,3]) {
    const beta=alpha.map((order,axis)=>order+Number(axis===base));
    indices.set(beta.join(''),beta);
  }
}
assert.equal(indices.size,52);
const listed=[...indices.values()].sort((a,b)=>a.join('').localeCompare(b.join('')));
assert.equal(listed.filter(alpha=>alpha[4]>0).length,18);
const byNL=new Map(longitudinalNumeric.roots.map(row=>[row.N+':'+row.L,row]));
const byL=new Map(transverse.positive.transverseRows.map(row=>[row.L,row]));
const rows = listed.map(alpha=>{
  const [r,z,t,l,n]=alpha,slow=r+z+t;
  const roots=Object.fromEntries(components.map(component=>{
    if (n>0) {
      const row=byNL.get(n+':'+l);
      assert(row && slow<=row.slowThrough);
      const id=row.roots[component][slow];
      assert(longitudinalNumeric.intervals[id],String(id));
      return [component,{source:'positiveN',id}];
    }
    if (l===0 && slow===3 && component==='v')
      return [component,{source:'higherCovariance',id:covariance.roots.meanVSlow3}];
    const values=l ? byL.get(l).roots[component] : transverse.positive.pureSlow[component];
    assert(graph[values[slow]]);
    return [component,{source:'zeroN',id:values[slow]}];
  }));
  return {alpha,roots};
});
const {N,tracedArithmeticEvaluator}=await sourceArithmetic(runtime,thresholds.sourcePins,'coarse-upper');
const external={
  'hosted-original':fixed.hostedOriginal,
  'fixed-radial':fixed.fixedRadial,
  'background-c8':Object.fromEntries(fullSlow.backgroundC8.flatMap(row=>
    ['F','G'].map(field=>[row.originalDirectionalRoots[field],row[field]]))),
  'target-c7':Object.fromEntries(fullSlow.weightedTargetC7.flatMap(row=>
    row.originalDirectionalRoots.map((id,i)=>[id,row.component[i]]))),
};
const visited=new Set(),parameters=new Map();
function visit(id) {
  if (visited.has(id)) return;
  visited.add(id);
  const {op,args}=graph[id];
  if (op==='authenticated_source_norm_root') {
    const [namespace,root]=args,key=args.join('/');
    if (parameters.has(key)) return;
    let interval=external[namespace][root];
    assert(interval,key);
    if (key==='hosted-original/300170') {
      assert.equal(interval.lower.rational,String(1n<<128n));
      interval={lower:{exp:{rational:'64'}},upper:interval.upper};
    }
    parameters.set(key,N.fromClosed(interval));
  } else if (op==='integer_power') visit(args[0]);
  else if (op!=='rational') args.forEach(visit);
}
const roots = new Set(rows.flatMap(row=>Object.values(row.roots)
  .filter(({source})=>source==='zeroN').map(({id})=>id)));
roots.forEach(visit);
const nodes=[...visited].sort((a,b)=>a-b).map(id=>{
  const node=graph[id];
  return {id,node:node.op==='authenticated_source_norm_root'?{op:'source_parameter',args:[node.args.join('/')]}:node};
});
const interpreter=tracedArithmeticEvaluator({nodes,nonArithmeticBoundaries:[]},N,{parameters});
const zeroN=Object.fromEntries([...roots].sort((a,b)=>a-b).map(id=>
  [id,{lower:zero,upper:N.toClosed(interpreter.value(id)).upper}]));
assert.equal(interpreter.report().visitedNodes,nodes.length);
const bySource={positiveN:longitudinalNumeric.intervals,zeroN,
  higherCovariance:{[covariance.roots.meanVSlow3]:covariance.endpoints.meanVSlow3}};
const bounds=Object.fromEntries(components.map(component=>{
  const intervals=rows.map(row=>{
    const {source,id}=row.roots[component],interval=bySource[source][id];
    assert.equal(N.compareEndpoints(interval.upper,zero),1);
    return N.fromClosed(interval);
  });
  // Covariance/FiveMap transfer 4, own/reference scale <16 through
  // order three, and epsilon-ratio factor <2 on the original window.
  const upper=N.toClosed(N.mul(N.point('128'),N.max(intervals))).upper;
  return [component,{upper,epsilonPowerNumerator:component==='betaWithoutEpsilon'?199999:99999}];
}));
const result={
  schema:'MathScope.N7.ArchivedMeanWaveC2MeanOperands/1',
  status:'CONDITIONAL_ALL_ARCHIVED_MEAN_OPERANDS_FOR_CROSS_C2',
  pins,covariancePin,sourceCycle:baseline.sourceSHA256,sourceForced:ledger.archive.graphSHA256,
  componentOrders:52,numericalComponentOrders:52*components.length,uniqueZeroNRoots:roots.size,
  domain:covariance.domain,rows,zeroN,bounds,trace:interpreter.report(),arithmetic:N.report(),
  scale:'Factor 128 uses source covariance/FiveMap factor 4, original fixed-label ratio rho in {1/2,1,2} with slow derivatives through degree three, and original epsilon ratio on the admitted charts. The transverse and pulse coordinate factors are at most one.',
  epsilonPowerDenominator:100000,
  scope:'Mean operands only. The explicit epsilon powers assume the original fixed-label valuation, same admitted source chart along the full pulse interval and smooth flat joins. Wave C3 for the cross term, full mode-one C2 forcing, live-family attachment and active increments remain open.',
  finalJets:'0/67',release:'HOLD',
};
await writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log('PASS 52 numerical archived mean operands per component for the cross C2 stencil');
