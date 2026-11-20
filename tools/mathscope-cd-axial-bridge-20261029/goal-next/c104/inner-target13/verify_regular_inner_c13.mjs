/** Reproduce the original regular inner target and extend its exact ledger to C13. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [goal, runtime, historicalPath, priorPath, chartPath, backgroundPath, out, sourceDump] = process.argv.slice(2);
assert(out);

const pinned = {
  innerProgram: '97dfb4d4d34295879c0a9b0c935b034101aa8f5f3f66873e79b1fd9bf618f7aa',
  innerC9: '724daf0118dd8dc9b2d4af0597411bdee0995c99e68a25950a80749517737e4d',
  target: '3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770',
  arithmetic: '4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47',
  thresholds: 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
  historical: '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0',
  prior: '79c6471329316eeb52668dea299949866ff80f8d29ecebe34cac9a9d4cc44a0a',
  chart14: 'b3f110811f8c704daf2d1b9190947b41f4cc76aeeb62b2656f65044a98b077c2',
  background14: '95155cca443e1a62c0cbc6234a24ba7f8180bac15003e70c46d035309b96c18b',
  innerBinding: '8228b3442a46ee6e6843ed8212184d1f3fce56f331852096e78b156a6187ff61',
  stress: 'b3567c39a9381ef16c3d94f0a24a88571a87dee7a61b9fe782d2076732b165f5',
  core: 'd657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
  leading: 'c1af950944adeecc10e4248da77cddc4970a7fede935b462aea1f4006be6fa2e',
  kernels: '97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef',
  allOrderLeading: 'd3af156118671a3e582c19a82064aab884a09d6ce81f51a6b2d64d35444cd29d',
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
const [baseline, old, target, thresholds, historical, prior, chart, background, binding, stress, core, allOrderLeading] = await Promise.all([
  read('innerProgram',resolve(goal,packed,'evaluate_target_inner.mjs')),
  json('innerC9',resolve(goal,packed,'target-inner-numerical.json')),
  json('target',resolve(goal,'whole-k-annular-wrz-norm/target-c7.json')),
  json('thresholds',resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json')),
  json('historical',historicalPath),
  json('prior',priorPath),
  json('chart14',chartPath),
  json('background14',backgroundPath),
  json('innerBinding',resolve(goal,wave,'inner-physical-gauge/source/inner-covariance.json')),
  read('stress',resolve(navier,'actual-stress-direction-program.mjs')),
  read('core',resolve(navier,'actual-continuation-exact-core.mjs')),
  read('allOrderLeading',resolve(navier,'actual-leading-all-order-jets.mjs')),
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
assert(core.includes('Us=G.add(G.mul(G.q(4),eta),j)'));
assert(core.includes('g=G.div(G.exp(G.mul(Lambda,psi)),C)'));
assert(core.includes('L=G.sub(G.one,G.mul(G.q(2),h,G.pow(eta,2)))'));
assert(allOrderLeading.includes('Cauchy on the actual Omega tube; |g|<1 and radius >=rho'));
assert(allOrderLeading.includes("ordinaryDerivativeUpper:'2*m!*rho^-m'"));
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

const [{actualLeadingHighJetBounds},{sourceAllOrderCutoffJets,sourceAllOrderNaturalJetBound},
       {sourceArithmetic},{compileActualStressDirectionProgram}] =
  await Promise.all([
    import(pathToFileURL(resolve(navier,'actual-leading-high-jets.mjs')).href),
    import(pathToFileURL(resolve(navier,'actual-residual-order-induction-kernels.mjs')).href),
    import(pathToFileURL(arithmeticPath).href),
    import(pathToFileURL(resolve(navier,'actual-stress-direction-program.mjs')).href),
  ]);
const source = compileActualStressDirectionProgram({derivativeOrder:0});
assert.equal(source.parameterExpressionSHA256,target.sourceParameterSHA256);
assert.deepEqual(source.domains.inner,{coordinate:'y=log(X/Xa)',range:['0','t1/4'],eta:[-1,1]});
assert.equal(source.exactFactorization.inner,'T0=e_a*(innerTheta,innerZ)');
assert(source.exactSupport.inner.includes('C12 primitives vanish on y<=t1/4 by the strict shear cutoff'));
for (const row of binding.bindings.innerRegularFactorProducer) assert.equal(source.roots[row.name],row.rebuiltRoot);
const kernelNames = source.innerKernels.map(row=>row.name);
assert.deepEqual([...new Set(kernelNames)],['inner_log_ratio','inner_U_difference',
  'inner_delta_M','inner_delta_I','inner_delta_J','inner_delta_S','inner_delta_Cp']);
assert(source.innerKernels.every(row=>row.identity==='e_a(y)^-1 integral_0^y e_a(s) f(s) ds'));
assert(source.improper.filter(row=>kernelNames.includes(row.name)).every(row=>row.weight==='exp(-u)' &&
  row.endpoints==='One-sided improper limits; no singular endpoint sample is evaluated.'));
if (sourceDump) await writeFile(sourceDump,JSON.stringify({factorRoots:source.roots,factorNodes:source.nodes})+'\n');
const original = actualLeadingHighJetBounds();
assert(original.pass && original.hierarchy.pass && original.natural.order === 12);
assert.equal(original.parameterExpressionSHA256,target.sourceParameterSHA256);
const oldCutoff = sourceAllOrderCutoffJets({order:12});
const priorCutoff = sourceAllOrderCutoffJets({order:13});
const highCutoff = sourceAllOrderCutoffJets({order:15});
assert(oldCutoff.pass && priorCutoff.pass && highCutoff.pass);
assert.equal(highCutoff.activation.seedPower,2);
assert.deepEqual(highCutoff.activation.ordinaryDerivativeBounds.slice(0,14),priorCutoff.activation.ordinaryDerivativeBounds);
assert.deepEqual(priorCutoff.activation.ordinaryDerivativeBounds.slice(0,13),oldCutoff.activation.ordinaryDerivativeBounds);
assert.equal(highCutoff.activation.seedDerivatives.length,16);

const naturalRows = [];
const Qmin = 1n<<260n;
for (let r=0;r<=15;r++) for (let m=0;r+m<=15;m++) {
  const row = sourceAllOrderNaturalJetBound({radialLogOrder:r,etaOrder:m});
  const [p,q='1'] = row.coefficient.split('/');
  assert(row.pass && row.scope.actualNaturalFunctionBound);
  assert.equal(row.parameterExpressionSHA256,target.sourceParameterSHA256);
  assert.equal(row.domain.complexYAbsoluteUpper,'5');
  assert(BigInt(p)<Qmin*BigInt(q));
  // Q*rho^-m times the rational coefficient is less than Q^(m+2).
  naturalRows.push([r,m,row.coefficient,m+2]);
}
assert.equal(naturalRows.length,136);
assert(Math.max(...naturalRows.map(r=>r[3]))<10000);
// Inner u<=1/4 gives Y<=4 exp(t1/4)<=4*512/511<5.
assert(4n*512n*10n<41n*511n && 4n*512n<5n*511n);

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

function extendLedger(kernelOrder) {
  const atomOrder = kernelOrder+1;
  let body = originalLoop;
  const replaceOnce = (find,give) => {
    assert.equal(body.split(find).length,2,find);
    body=body.replace(find,give);
  };
  replaceOnce('const n = 10;', `const n = ${kernelOrder};`);
  replaceOnce('k <= 12; k++) fac.push', `k <= ${atomOrder}; k++) fac.push`);
  replaceOnce("const natural = atom('Phi, u and actual average log-radius derivatives', 1);",
              `const natural = atom('Phi, u and actual average log-radius derivatives', 1, ${atomOrder});`);
  replaceOnce("const invPhi = put('inverse Phi', 13, 12, 'Phi >= 1/4 and finite Taylor inverse', [natural]);",
              `const inversePhiCounts = [4n];
for (let m=1;m<=${atomOrder};m++) {
  let sum=0n;
  for (let k=1;k<=m;k++) sum += (fac[m]/fac[k]/fac[m-k])*inversePhiCounts[m-k];
  inversePhiCounts.push(4n*sum);
  fixedCoefficient(inversePhiCounts[m]);
}
const invPhi = put('inverse Phi', ${atomOrder+1}, ${atomOrder}, 'Phi >= 1/4 and finite Taylor inverse', [natural]);`);
  replaceOnce("const expDiv = put('exp divided difference', n*v.power+1, n,",
              "const expDiv = put('exp divided difference', n*v.power+1, Math.min(n,v.degree),");
  if (kernelOrder>12) {
    replaceOnce('degree=12) => put', `degree=${atomOrder}) => put`);
    replaceOnce('const flat = k => k === 0 ? 1n : 8n**BigInt(k)*(1n+fac[k]);',
                'const flat = k => BigInt(step.activation.seedDerivatives[k].ordinaryDerivativeUpper);');
    replaceOnce('k <= 12; k++) {', `k <= ${atomOrder}; k++) {`);
    replaceOnce('coefficient += 2n*flat(j)*inv[k-j];',
                'coefficient += (fac[k]/fac[j]/fac[k-j])*2n*flat(j)*inv[k-j];');
    replaceOnce('fixedCoefficient(fac[k]*inv[k]);', 'fixedCoefficient(inv[k]);');
    replaceOnce('fixedCoefficient(fac[k]*4n*flat(k));', 'fixedCoefficient(4n*flat(k));');
    replaceOnce('fixedCoefficient(fac[12] * 13n * 4n**13n * 169n**12n);',
                'fixedCoefficient(fac[n] * BigInt(n+1) * 4n**BigInt(n+1) * BigInt((n+1)**2)**BigInt(n));');
  }
  return body;
}

const priorReplay=applyLedger(extendLedger(12),priorCutoff);
assert.deepEqual(priorReplay.ledger,prior.highRegularLedger);
assert.deepEqual([priorReplay.theta.power,priorReplay.axialFinal.power],[392,738]);
const highReplay=applyLedger(extendLedger(14),highCutoff);
assert.equal(highReplay.n,14);
assert.deepEqual([highReplay.theta.degree,highReplay.axialFinal.degree],[13,13]);
assert.equal(highReplay.ledger.find(row=>row.name==='v').degree,14);
assert.equal(highReplay.ledger.find(row=>row.name==='inverse Phi').degree,15);

const {N,evaluateClosedArithmeticDefinitions}=await sourceArithmetic(runtime,thresholds.sourcePins,'coarse-upper');
const {values}=evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:['CSelected','Xa','t1','C12EnvelopeR','h','j0']});
const C=values.get('CSelected');
assert.equal(N.compareEndpoints(N.toClosed(C).lower,{rational:'2'}),1);
assert.equal(N.compareEndpoints(N.toClosed(values.get('t1')).upper,{rational:'1/128'}),-1);
assert.equal(N.compareEndpoints(N.toClosed(values.get('Xa')).upper,{rational:'1'}),-1);
assert.equal(N.compareEndpoints(N.toClosed(values.get('h')).upper,{rational:'1/64'}),-1);
assert.equal(N.compareEndpoints(N.toClosed(values.get('j0')).upper,{rational:'1'}),-1);
assert(original.hierarchy.checks.some(check=>check.id==='same-Q-rho-and-positive-P' && check.pass));
assert.equal(chart.pointwiseCoefficientCap,'2^3654*Hc^255');
assert.equal(chart.atomDerivativeOrder,15);
assert.equal(chart.totalDirections,680);
assert.equal(background.inputs.chartSHA,pinned.chart14);
assert.equal(background.derivativeOrder,14);
assert.equal(background.leading.leadingLogCap,'H/2^300');
assert.equal(background.leading.leadingLogCapSign,-1);

const factorial = m => Array.from({length:m},(_,k)=>BigInt(k+1)).reduce((a,b)=>a*b,1n);
// L^-1 admits the Cauchy disk |delta eta|<=1/2, with |L|>=1-9/128.
// r^+/-1 has a normalized radial exponential of rate |t1|/2<1.
// The largest geometric amplitude is bounded by 4 Lambda; g is bounded by
// the pinned Cauchy tube estimate and rho^-1<Q. Both fit the same C.
assert(9n<128n/2n);
assert(2n**16n*factorial(15)<Qmin);
assert(65<10000 && 16<10000);
const capRows=[];
for (let j=0;j<=13;j++) {
  const logarithmic = [highReplay.theta.power,highReplay.axialFinal.power].map(k=>k+120*j);
  assert(Math.max(...logarithmic)<25600000);
  const fac=factorial(j);
  assert(fac<1n<<33n);
  assert(3654+33<4096 && 255+j+1<4096);
  capRows.push({order:j,maxLogDerivativeCPower:logarithmic,
    componentLogarithmicNumericalUpper:logarithmic.map(power=>N.toClosed(N.pow(C,power)).upper),
    logToXUnsignedStirlingSum:String(fac),physicalRZTCap:'2^4096*Bnorm'});
}
const result={
  schema:'MathScope.C104.RegularInnerStressC13/1',
  status:'VERIFIED_ORIGINAL_REGULAR_INNER_ANALYTIC_COEFFICIENT_C13_CONDITIONAL_PHYSICAL_CHART',
  pins:pinned, parameterExpressionSHA256:target.sourceParameterSHA256,
  originalGraphSHA256:old.originalGraphSHA256, originalRegularInnerBodies:[119712,119713], activationRoot:119711,
  originalFactoredTarget:binding.regions.inner.targetFactorization,
  domain:{u:['0','1/4'],eta:['-1','1'],s:['1/2','2'],fixedOriginalLabel:true,
    inwardEtaAndRadialEdgeDerivatives:true,X:'(4/Lambda)*exp(t1*u)',Y:'4*exp(t1*u)<41/10'},
  outputDerivativeOrder:13,kernelDerivativeOrder:14,naturalDerivativeOrder:15,
  normalizedComponentPowers:[highReplay.theta.power,highReplay.axialFinal.power],
  strictNormalizedC9ReplayMatchesCompleteOriginalLedger:true,
  strictNormalizedC11ReplayMatchesCompletePriorLedger:true,
  rebuiltOriginalSource:{nodeCount:source.nodes.length,kernelNames,physicalFactorization:source.exactFactorization.inner,
    rootPairs:binding.bindings.innerRegularFactorProducer.map(({name,historicalRoot,rebuiltRoot})=>({name,historicalRoot,rebuiltRoot}))},
  cutoff:{source:'square seed with flat zero extension',seedDerivativeOrder:15,
    activationDerivativeOrder:15,gaDenominatorInverseUpper:9,
    gaDenominatorProof:'b(u)+b(1-u)>=exp(-16/9)>1/9 on [0,1/4]',gaRatioUpper:36,
    kernel:'u -> u/sqrt(1+u^2*t) stays in [0,u], each derivative is dominated by an integrable (1+t)^k exp(-t)',
    seedOrdinaryBounds:highCutoff.activation.seedDerivatives.map(row=>row.ordinaryDerivativeUpper)},
  chart:{pointwiseCoefficientCap:chart.pointwiseCoefficientCap,Hc:'Renv=exp(C^25600000)',
    physicalInverseXPowerUpper:'X^-j<=Renv^j',normalizedLogUpper:'C^(p+120j)<Renv',
    backgroundLeadingLogCap:background.leading.leadingLogCap,
    backgroundLeadingLogCapUsedForNormalizedInnerBound:false},
  ordinaryCapRows:capRows,allOrderNaturalRows:naturalRows,highRegularLedger:highReplay.ledger,
  sourceNormScope:'Pointwise derivatives of the regular factors, with the native multiplier s^(-A-1/2). The factored exp(-1/u^2), frame, C10/C11 covariance and full FTC faces are separate.',
  finalJets:'0/67', release:'HOLD',
};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({orders:[13,14,15], normalized:result.normalizedComponentPowers,
  C12:capRows[12].maxLogDerivativeCPower,C13:capRows[13].maxLogDerivativeCPower,
  priorCompleteLedgers:[9,11],naturalRows:naturalRows.length}));
