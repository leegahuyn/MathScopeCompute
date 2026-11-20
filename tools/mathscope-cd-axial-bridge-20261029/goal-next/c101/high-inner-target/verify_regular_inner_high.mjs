/** Replay the original regular inner target with the all-order natural source at C11. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [goal, runtime, historicalPath, chart11Path, out] = process.argv.slice(2);
assert(goal && runtime && historicalPath && chart11Path && out);

const pinned = {
  innerProgram: '97dfb4d4d34295879c0a9b0c935b034101aa8f5f3f66873e79b1fd9bf618f7aa',
  innerC9: '724daf0118dd8dc9b2d4af0597411bdee0995c99e68a25950a80749517737e4d',
  target: '3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770',
  arithmetic: '4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47',
  thresholds: 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
  historical: '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0',
  chart11: '9ef9baa5136aeca25f7ef343d83d14a121e127949ec64a7cb03cc81590772efd',
  innerBinding: '8228b3442a46ee6e6843ed8212184d1f3fce56f331852096e78b156a6187ff61',
  stress: 'b3567c39a9381ef16c3d94f0a24a88571a87dee7a61b9fe782d2076732b165f5',
  core: 'd657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
  leading: 'c1af950944adeecc10e4248da77cddc4970a7fede935b462aea1f4006be6fa2e',
  kernels: '97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef',
};
const read = async (name, path) => {
  const raw = await readFile(path);
  assert.equal(createHash('sha256').update(raw).digest('hex'), pinned[name], name);
  return raw.toString();
};
const json = async (name, path) => JSON.parse(await read(name,path));
const packed = 'whole-k-annular-wrz-norm/target-numerical';
const wave = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget';
const navier = resolve(runtime,'research-ide/mathscope-m2/navier');
const arithmeticPath = resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs');
const [baseline, old, target, thresholds, historical, chart, binding, stress, core] = await Promise.all([
  read('innerProgram',resolve(goal,packed,'evaluate_target_inner.mjs')),
  json('innerC9',resolve(goal,packed,'target-inner-numerical.json')),
  json('target',resolve(goal,'whole-k-annular-wrz-norm/target-c7.json')),
  json('thresholds',resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json')),
  json('historical',historicalPath),
  json('chart11',chart11Path),
  json('innerBinding',resolve(goal,wave,'inner-physical-gauge/source/inner-covariance.json')),
  read('stress',resolve(navier,'actual-stress-direction-program.mjs')),
  read('core',resolve(navier,'actual-continuation-exact-core.mjs')),
  read('kernels',resolve(navier,'actual-residual-order-induction-kernels.mjs')),
  read('leading',resolve(navier,'actual-leading-high-jets.mjs')),
  read('arithmetic',arithmeticPath),
]);

for (const fragment of [
  'const v=G.add(o,G.mul(G.pow(radius,2),u)),s=G.div(end,G.sqrt(v))',
  'G.div(G.mul(ga(s),fn(s)),G.mul(v,G.sqrt(v)))',
  "Ka('inner_log_ratio',s,t=>natural(t).p1)",
  "Ka('inner_U_difference',s,t=>natural(t).Uy)",
  "integral('inner_exponential_divided_difference',t=>G.exp(G.mul(t,v)),z,o)",
  "Ka('inner_delta_'+name,y,s=>innerMomentDifferenceAlgebra",
  'innerStressDifferenceAlgebra(G,source',
  "G.natural('average',Y)",
  'const ga=s=>G.div(G.sub(o,kap0),G.add(flat(G.div(s,t1)),flat(G.sub(o,G.div(s,t1)))))',
  'const ea=s=>G.mul(G.sub(o,kap0),G.step(G.div(s,t1)))',
]) assert(stress.includes(fragment),fragment);
assert(core.includes('average=u.map((x,k)=>G.div(x,G.q(k+1)))'));
assert.deepEqual(binding.bindings.historicalRegularInnerRoots,[119712,119713]);
assert.deepEqual(target.regions.inner.bodies,old.actualInnerBodies);
assert.deepEqual(old.actualInnerBodies,binding.bindings.historicalRegularInnerRoots);
assert.equal(binding.bindings.regularActivationRoot,119711);
assert.equal(binding.regions.inner.targetFactorization,'Tbar=exp(-1/u^2)*s^(-A-1/2)*(#119712,#119713)');
assert.equal(old.originalGraphSHA256,target.graph.uncompressedSHA256);
assert.deepEqual(historical.definitions.kappa0,{ref:'t1'});
assert.deepEqual(historical.definitions.t1,{power:[{ref:'CSelected'},-120]});
assert.deepEqual(historical.definitions.C12EnvelopeR,{exp:{power:[{ref:'sourceEnvelopeS'},256]}});
assert.deepEqual(historical.definitions.sourceEnvelopeS,{power:[{ref:'CSelected'},100000]});
assert.deepEqual(historical.definitions.Lambda,{power:[{ref:'Q'},64]});
assert.deepEqual(historical.definitions.Xa,{quotient:[{integer:4},{ref:'Lambda'}]});

const [{actualLeadingHighJetBounds},{sourceAllOrderCutoffJets,sourceAllOrderNaturalJetBound},{sourceArithmetic}] =
  await Promise.all([
    import(pathToFileURL(resolve(navier,'actual-leading-high-jets.mjs')).href),
    import(pathToFileURL(resolve(navier,'actual-residual-order-induction-kernels.mjs')).href),
    import(pathToFileURL(arithmeticPath).href),
  ]);
const original = actualLeadingHighJetBounds();
assert(original.pass && original.hierarchy.pass && original.natural.order === 12);
assert.equal(original.parameterExpressionSHA256,target.sourceParameterSHA256);
const oldCutoff = sourceAllOrderCutoffJets({order:12});
const highCutoff = sourceAllOrderCutoffJets({order:13});
assert(oldCutoff.pass && highCutoff.pass);
assert.deepEqual(highCutoff.activation.ordinaryDerivativeBounds.slice(0,13),oldCutoff.activation.ordinaryDerivativeBounds);

const naturalRows = [];
const Qmin = 1n<<260n;
for (let r=0;r<=13;r++) for (let m=0;r+m<=13;m++) {
  const row = sourceAllOrderNaturalJetBound({radialLogOrder:r,etaOrder:m});
  const [p,q='1'] = row.coefficient.split('/');
  assert(row.pass && row.scope.actualNaturalFunctionBound);
  assert.equal(row.parameterExpressionSHA256,target.sourceParameterSHA256);
  assert.equal(row.domain.complexYAbsoluteUpper,'5');
  assert(BigInt(p)<Qmin*BigInt(q));
  // Q*rho^-m times the rational coefficient is less than Q^(m+2).
  naturalRows.push([r,m,row.coefficient,m+2]);
}
assert.equal(naturalRows.length,105);
assert(Math.max(...naturalRows.map(r=>r[3]))<10000);
// Inner u<=1/4 gives Y<=4 exp(t1/4)<=4*512/511<5.
assert(4*512<5*511);

const lower = baseline.indexOf('// All fixed integers below');
const upper = baseline.indexOf('assert(theta.degree >= 9 && axialFinal.degree >= 9);');
assert(lower>=0 && upper>lower);
const originalLoop = baseline.slice(lower,upper);
const applyLedger = (body,step) => Function('assert','step',
  body+'\nreturn {n,theta,axialFinal,ledger};')(assert,step);
const oldReplay = applyLedger(originalLoop,oldCutoff);
assert.equal(oldReplay.n,10);
assert.deepEqual(oldReplay.ledger,old.ledger);
assert.deepEqual([oldReplay.theta.power,oldReplay.axialFinal.power],[327,608]);

let highLoop = originalLoop;
const replaceOnce = (find,give) => {
  assert.equal(highLoop.split(find).length,2,find);
  highLoop=highLoop.replace(find,give);
};
replaceOnce('const n = 10;', 'const n = 12;');
replaceOnce('k <= 12; k++) fac.push', 'k <= 13; k++) fac.push');
replaceOnce("const natural = atom('Phi, u and actual average log-radius derivatives', 1);",
            "const natural = atom('Phi, u and actual average log-radius derivatives', 1, 13);");
replaceOnce("const invPhi = put('inverse Phi', 13, 12, 'Phi >= 1/4 and finite Taylor inverse', [natural]);",
            `const inversePhiCounts = [4n];
for (let m=1;m<=13;m++) {
  let sum=0n;
  for (let k=1;k<=m;k++) sum += (fac[m]/fac[k]/fac[m-k])*inversePhiCounts[m-k];
  inversePhiCounts.push(4n*sum);
  fixedCoefficient(inversePhiCounts[m]);
}
const invPhi = put('inverse Phi', 14, 13, 'Phi >= 1/4 and finite Taylor inverse', [natural]);`);
replaceOnce("const expDiv = put('exp divided difference', n*v.power+1, n,",
            "const expDiv = put('exp divided difference', n*v.power+1, Math.min(n,v.degree),");
const highReplay=applyLedger(highLoop,highCutoff);
assert.equal(highReplay.n,12);
assert.deepEqual([highReplay.theta.degree,highReplay.axialFinal.degree],[11,11]);
assert.equal(highReplay.ledger.find(row=>row.name==='v').degree,12);
assert.equal(highReplay.ledger.find(row=>row.name==='inverse Phi').degree,13);

const {N,evaluateClosedArithmeticDefinitions}=await sourceArithmetic(runtime,thresholds.sourcePins,'coarse-upper');
const {values}=evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:['CSelected','Xa','t1','C12EnvelopeR']});
const C=values.get('CSelected');
assert.equal(N.compareEndpoints(N.toClosed(C).lower,{rational:'2'}),1);
assert.equal(N.compareEndpoints(N.toClosed(values.get('t1')).upper,{rational:'1/128'}),-1);
assert.equal(N.compareEndpoints(N.toClosed(values.get('Xa')).upper,{rational:'1'}),-1);
assert.equal(chart.combinedPointwiseFactor,'2^2288*Hc^168');
assert.equal(chart.ordinaryDirections,364);
const capRows=[];
for (let j=0;j<=11;j++) {
  const logarithmic = [highReplay.theta.power,highReplay.axialFinal.power].map(k=>k+120*j);
  assert(Math.max(...logarithmic)<25600000);
  const fac=Array.from({length:j},(_,k)=>BigInt(k+1)).reduce((a,b)=>a*b,1n);
  assert(fac<1n<<26n);
  assert(2288+26<4096 && 168+j+1<4096);
  capRows.push({order:j,maxLogDerivativeCPower:logarithmic,
    componentLogarithmicNumericalUpper:logarithmic.map(power=>N.toClosed(N.pow(C,power)).upper),
    logToXUnsignedStirlingSum:String(fac),physicalRZTCap:'2^4096*Bnorm'});
}
const result={
  schema:'MathScope.C101.RegularInnerStressC11/1',
  status:'VERIFIED_ORIGINAL_REGULAR_INNER_ANALYTIC_COEFFICIENT_C11_CONDITIONAL_PHYSICAL_CHART',
  pins:pinned, parameterExpressionSHA256:target.sourceParameterSHA256,
  originalGraphSHA256:old.originalGraphSHA256, originalRegularInnerBodies:[119712,119713], activationRoot:119711,
  originalFactoredTarget:binding.regions.inner.targetFactorization,
  domain:{u:['0','1/4'],eta:['-1','1'],s:['1/2','2'],fixedOriginalLabel:true},
  outputDerivativeOrder:11,kernelDerivativeOrder:12,naturalDerivativeOrder:13,
  normalizedComponentPowers:[highReplay.theta.power,highReplay.axialFinal.power],
  strictNormalizedC9ReplayMatchesCompleteOriginalLedger:true,
  ordinaryCapRows:capRows,allOrderNaturalRows:naturalRows,highRegularLedger:highReplay.ledger,
  sourceNormScope:'Pointwise derivatives of the regular factors, with the native multiplier s^(-A-1/2). The factored exp(-1/u^2), frame, C10/C11 covariance and full FTC faces are separate.',
  finalJets:'0/67', release:'HOLD',
};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({orders:[11,12,13], normalized:result.normalizedComponentPowers,
  C10:capRows[10].maxLogDerivativeCPower,C11:capRows[11].maxLogDerivativeCPower}));
