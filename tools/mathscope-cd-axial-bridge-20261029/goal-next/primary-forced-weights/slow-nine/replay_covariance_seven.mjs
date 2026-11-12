/** Reuse the source-authenticated full-curl covariance estimate one order higher. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sha, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [goal, graph, chart, runtime, higherPath, output] = process.argv.slice(2);
assert.equal(process.argv.length, 8, 'Use GOAL_NEXT ARCHIVED_GRAPH WHOLE_K_CHART NUMERICAL_RUNTIME HIGHER_NORMS OUTPUT.');
const pins = {
  producer:'34f45caa70455663b06f9c5116aa490ef59d58fc17e00a6b618918e35b78a338',
  prior:'5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328',
  fullSlow:'517662b18f4014644cd7539de42b82b74999374aaf34273163f39693f160bdb4',
  higher:'1c7b4fdef5a1757f94e4f46b24a4dc1bf6c202c15b22528e1e820ff851dba39c',
  radialC5:'378971a6061b1a49051ff0214e715aa1d7726ac621a159d97f17b844b9128d6e',
  fixed:'9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c',
  thresholds:'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
};
const producer = resolve(goal,'whole-k-annular-pressure-lower/propagate_lower_covariance.mjs');
const [program, higher, prior, fullSlow, fixed, thresholds, radialC5] = await Promise.all([
  readFile(producer,'utf8'),
  load(higherPath,pins.higher),
  load(resolve(goal,'whole-k-annular-pressure-lower/lower-covariance-pressure.json'),pins.prior),
  load(resolve(goal,'primary-forced-weights/full-slow-norms/full-slow-norms.json'),pins.fullSlow),
  load(resolve(goal,'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json'),pins.fixed),
  load(resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'),pins.thresholds),
  load(resolve(goal,'primary-forced-weights/higher-mean/fixed-radial-c5-numerical.json'),pins.radialC5),
]);
assert.equal(sha(program),pins.producer);
assert.equal(higher.schema,'MathScope.N7.OriginalFixedSlabPointwiseC9C8/1');
assert.equal(higher.inputPins.fullSlow[1],pins.fullSlow);
assert.equal(higher.sourceParameterSHA256,fullSlow.sourceParameterSHA256);
assert.deepEqual(higher.domain,fullSlow.domain);
assert.equal(higher.weightedTargetC8.pole,27);
assert.equal(fixed.sourceSHA256,prior.sourceSHA256);
assert.deepEqual(radialC5.bounds,{rawWhole:8370,T0:8372,T1:8372,A0:8373,A1:8373});

const end = 'let meanSpatialInputs, meanSpatialBounds, radialPhaseA0, radialPhaseA1;';
assert.equal(program.split(end).length,2);
let prefix = program.split(end)[0];
function substitute(old, replacement) {
  assert.equal(prefix.split(old).length,2,old);
  prefix = prefix.replace(old,replacement);
}
substitute('const m=7;','const m=8;');
substitute("const trivariateRatio=k=>2n**BigInt(k);\nfunction actualFGBound(field,extra){\n  return degree.map((k,j)=>mul(q(trivariateRatio(k+extra),alphaFactor[j]),P.leaf('background-c8',inputs.background.bounds[k+extra][field])));\n}",
  "function actualFGBound(field,extra){\n"+
  "  return degree.map((k,j)=>mul(q(1,alphaFactor[j]),k+extra===9 ? P.leaf('background-c9',field) : P.leaf('background-c8',inputs.background.bounds[k+extra][field])));\n"+
  "}");
substitute("const target=degree.map((k,j)=>mul(q(trivariateRatio(k),alphaFactor[j]),max(...inputs.target.bounds[k].component.map(id=>P.leaf('target-c7',id)))));",
  "const target=degree.map((k,j)=>mul(q(1,alphaFactor[j]),max(...(k===8 ? [0,1].map(id=>P.leaf('target-c8',id)) : inputs.target.bounds[k].component.map(id=>P.leaf('target-c7',id))))));");
substitute('const sqrtWeight=[sq(weight[0])],poles=[12]','const sqrtWeight=[sq(weight[0])],poles=[14]');
substitute('poles.push(Math.max(24,','poles.push(Math.max(27,');
substitute('k===0?12:24*k','k===0?14:27*k');
substitute('assert.ok(covariance.every(v=>v.length===7));','assert.ok(covariance.every(v=>v.length===8));');
substitute("const radial=e=>inputs.radial.unweighted[e].rows.map(({T})=>P.leaf('fixed-radial',T));",
  "const radial=e=>[...inputs.radial.unweighted[e].rows.map(({T})=>P.leaf('fixed-radial',T)),P.leaf('fixed-radial-c5',8372)];");
substitute("const cutoffRemainder=e=>inputs.radial.unweighted[e].rows.map(({A})=>P.leaf('fixed-radial',A));",
  "const cutoffRemainder=e=>[...inputs.radial.unweighted[e].rows.map(({A})=>P.leaf('fixed-radial',A)),P.leaf('fixed-radial-c5',8373)];");
substitute("const rawWhole=rawWholeIds.map(id=>P.leaf('fixed-radial',id));",
  "const rawWhole=[...rawWholeIds.map(id=>P.leaf('fixed-radial',id)),P.leaf('fixed-radial-c5',8370)];");

const argv = process.argv;
let verified;
try {
  process.argv = [argv[0],producer,goal,graph,chart,'output-disabled'];
  const exposed = prefix + '\nexport {P,covariance,sourceGraphSHA,nativeRegistrySHA,fields,poles,potentialAbs,through,velocity,temporalBeta,fiveV,freshP,freshJz};';
  verified = await import('data:text/javascript;base64,'+Buffer.from(exposed).toString('base64'));
} finally {
  process.argv = argv;
}
const {P,covariance,sourceGraphSHA,nativeRegistrySHA,fields,poles,potentialAbs,through,velocity,temporalBeta,fiveV,freshP,freshJz} = verified;
assert.equal(fields.length,6);
assert.equal(fields[2].name,'GlobalCompleteCommonTorus_rz');
assert.equal(fields[2].rows.length,162);
assert.equal(sourceGraphSHA,prior.sourceSHA256);
assert.equal(nativeRegistrySHA,prior.nativeRegistrySHA256);
assert.deepEqual(poles,[14,27,54,81,108,135,162,189,216]);
const roots = {
  potentialSlow8Normalized:potentialAbs[8],WrzSlow7:covariance[0][7],L2WrzSlow7:covariance[2][7],
  temporalBetaSlow4WithoutEpsilon:through(temporalBeta,4)[4],
  freshPSlow3:through(freshP,3)[3],freshJzSlow3:through(freshJz,3)[3],
  fiveMapVSlow3:through(fiveV,3)[3],meanVSlow3:through(velocity.v,3)[3],
};

const external = {
  'hosted-original':fixed.hostedOriginal,
  'fixed-radial':fixed.fixedRadial,
  'fixed-radial-c5':radialC5.roots,
  'background-c8':Object.fromEntries(fullSlow.backgroundC8.flatMap(row=>
    ['F','G'].map(field=>[row.originalDirectionalRoots[field],row[field]]))),
  'target-c7':Object.fromEntries(fullSlow.weightedTargetC7.flatMap(row=>
    row.originalDirectionalRoots.map((id,i)=>[id,row.component[i]]))),
  'background-c9':higher.backgroundC9,
  'target-c8':higher.weightedTargetC8.component,
};
const {N,tracedArithmeticEvaluator} = await sourceArithmetic(runtime,thresholds.sourcePins,'coarse-upper');
const visited = new Set(), parameters = new Map();
function visit(id) {
  if (visited.has(id)) return;
  visited.add(id);
  const {op,args}=P.nodes[id];
  if (op==='authenticated_source_norm_root') {
    const [namespace,root]=args,key=args.join('/');
    assert(Object.hasOwn(external[namespace],root),key);
    let interval=external[namespace][root];
    if (key==='hosted-original/300170') {
      assert.equal(interval.lower.rational,String(1n<<128n));
      interval={lower:{exp:{rational:'64'}},upper:interval.upper};
    }
    parameters.set(key,N.fromClosed(interval));
  } else if (op==='integer_power') visit(args[0]);
  else if (op!=='rational') args.forEach(visit);
}
Object.values(roots).forEach(visit);
for (const key of ['background-c9/F','background-c9/G','target-c8/0','target-c8/1']) assert(parameters.has(key),key);
for (const key of ['fixed-radial-c5/8370','fixed-radial-c5/8372']) assert(parameters.has(key),key);
const nodes=[...visited].sort((a,b)=>a-b).map(id=>{
  const node=P.nodes[id];
  return {id,node:node.op==='authenticated_source_norm_root'?{op:'source_parameter',args:[node.args.join('/')]}:node};
});
const interpreter=tracedArithmeticEvaluator({nodes,nonArithmeticBoundaries:[]},N,{parameters});
const zero={rational:'0'};
const endpoints=Object.fromEntries(Object.entries(roots).map(([name,id])=>{
  const {upper}=N.toClosed(interpreter.value(id));
  assert.equal(N.compareEndpoints(upper,zero),1,name);
  return [name,{lower:zero,upper}];
}));
const trace=interpreter.report();
assert.equal(trace.visitedNodes,nodes.length);
const result={
  schema:'MathScope.N7.ArchivedFullCurlCovarianceAndMeanSlowThree/1',
  status:'CONDITIONAL_ARCHIVED_ACTUAL_COVARIANCE_AND_MEAN_NUMERICAL_BOUNDS',
  pins,sourceGraphSHA,nativeRegistrySHA,
  verifiedNativeCovarianceRows:fields.reduce((n,f)=>n+f.rows.length,0),
  targetPole:27,squareRootPoles:poles,gaussianAbsorptionPole:216,
  roots,endpoints,trace,arithmetic:N.report(),domain:higher.domain,
  positive:{sourceGraphNodes:P.nodes.length,reachable:nodes.length,reachableSHA256:sha(JSON.stringify(nodes)),
    parameters:[...parameters.keys()].sort()},
  actualMeanSource:{meanV:3614791,fiveMapV:3614767,freshP:3614334,freshJz:3614420,earlyEz:643883,axialPressureDerivative:643849},
  scope:'Original archived rz component and full-curl pair, with initialized direct mean v. Fixed label, admitted chart and pulse-path, flat extension, cone and same-source stability assumptions of the prior proof. Includes all ordinary R,Z,T order-seven Wrz directions and the L² case. Unweighted upper endpoints. Fixed-slab numerical input does not issue a live-family seal.',
  finalJets:'0/67',release:'HOLD',
};
await writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log('PASS original potential slow8, Wrz slow7 and initialized direct mean v slow3 endpoints');
