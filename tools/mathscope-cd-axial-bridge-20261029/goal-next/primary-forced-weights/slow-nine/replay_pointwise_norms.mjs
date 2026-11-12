/** Pointwise C9/C8 source majorants from the already validated profile jets. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {load, sha, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [goal, runtime, historicalFile, output] = process.argv.slice(2);
assert.equal(process.argv.length, 6, 'Use GOAL_NEXT ORIGINAL_RUNTIME HISTORICAL_INPUT OUTPUT.');
const norm = 'whole-k-annular-wrz-norm/';
const inputs = {
  fullSlow: ['primary-forced-weights/full-slow-norms/full-slow-norms.json', '517662b18f4014644cd7539de42b82b74999374aaf34273163f39693f160bdb4'],
  backgroundGraph: [norm+'background-c8.json', '5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e'],
  background: [norm+'numerical/background-c8-complete.json', '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966'],
  profiles: [norm+'numerical/background-majorants.json', 'b3a14675ddad1bdad7913a184f23b27161ba852994898a9c801b315ae6da27da'],
  numericalProfiles: [norm+'numerical/background-numerical.json', '4d2fa5753568e00bacbb47126909b7b3219f55f7b9cb8a0f45599ce2b0d3d19f'],
  targetGraph: [norm+'target-c7.json', '3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770'],
  inner: [norm+'target-numerical/target-inner-numerical.json', '724daf0118dd8dc9b2d4af0597411bdee0995c99e68a25950a80749517737e4d'],
  middle: [norm+'target-numerical/target-middle-numerical.json', '07cbe3e4cda7f95d289fffea64472a5fac45387f72a4414603fec663613458e9'],
  outer: [norm+'target-numerical/target-outer-numerical.json', '363d484e7699ce86af70a6d7ff23bd0c0a10366a64a86e3379e60852cbe56d84'],
  fixed: ['whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json', '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  thresholds: ['whole-k-selector-scales/historical-scale-arithmetic-result.json', 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
};
const historicalPin = '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0';
const navier = 'research-ide/mathscope-m2/navier/';
const sourcePins = {
  'actual-global-source-expressions.mjs': 'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
  'actual-residual-order-induction-kernels.mjs': '97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef',
  'actual-common-target-weighted-norms.mjs': '6fca53620e45a839868d094a1425ee0071ec4ca21c16bff77476d8be2f32e38a',
};
const [evidence, historical] = await Promise.all([
  Promise.all(Object.entries(inputs).map(async ([key, [file, pin]]) =>
    [key, await load(resolve(goal, file), pin)])).then(Object.fromEntries),
  load(historicalFile, historicalPin),
  Promise.all(Object.entries(sourcePins).map(async ([file, pin]) =>
    assert.equal(sha(await readFile(resolve(runtime, navier, file))), pin, file))),
]);
const {fullSlow, backgroundGraph, background, profiles, numericalProfiles, targetGraph, inner, middle, outer, fixed, thresholds} = evidence;
assert.deepEqual(fullSlow.domain.axes, ['R','Z','T']);
assert.deepEqual(fullSlow.domain.q, ['qBig/64','qBig/16']);
assert.deepEqual(backgroundGraph.activePrefix, [0,1,2,3]);
assert.equal(fullSlow.sourceParameterSHA256, profiles.parameterExpressionSHA256);
assert.equal(fullSlow.sourceParameterSHA256, targetGraph.sourceParameterSHA256);
assert.equal(background.originalGraphSHA256, backgroundGraph.graph.uncompressedSHA256);
assert.equal(profiles.ordinaryDerivativeOrder, 10);
assert.equal(numericalProfiles.majorantsSHA256, inputs.profiles[1]);
assert.equal(numericalProfiles.originalGraphSHA256, backgroundGraph.graph.uncompressedSHA256);
for (const region of ['inner','middle','outer']) {
  const receipt = evidence[region];
  assert.equal(receipt.originalGraphSHA256, targetGraph.graph.uncompressedSHA256);
  const bodies = {inner: 'actualInnerBodies', middle: 'actualTargetBodies', outer: 'actualOuterBodies'};
  assert.deepEqual(receipt[bodies[region]], targetGraph.regions[region].bodies);
}
assert.equal(inner.outputDerivativeOrder, 9);
assert.equal(middle.actualTargetThroughOrdinaryOrder, 9);
assert.equal(outer.derivativeOrder, 9);
assert.deepEqual(historical.definitions.t1, {power:[{ref:'CSelected'}, -120]});

const {N, evaluateClosedArithmeticDefinitions} =
  await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const parameters = evaluateClosedArithmeticDefinitions(historical.definitions, N, {
  names:['Xa','CSelected'],
}).values;
const q = n => N.point(String(n));
const upper = x => N.toClosed(x).upper;
const lower = x => N.toClosed(x).lower;
const zero = {rational:'0'};
const positive = x => N.fromClosed({lower:zero,upper:x});
const sum = values => values.reduce(N.add,N.zero());
const product = values => values.reduce(N.mul,N.one());
const greater = (a,b) => assert.equal(N.compareEndpoints(a,b),1);
const less = (a,b) => assert.equal(N.compareEndpoints(a,b),-1);
const Rstar = N.fromClosed(fixed.hostedOriginal[216823]);
const Xa = parameters.get('Xa');
const Xb = N.fromClosed(background.Xb);
const t1 = N.fromClosed(fixed.hostedOriginal[3612]);
greater(lower(Xa),zero);
greater(lower(Rstar),{rational:'1'});
less(upper(N.mul(q(4),Xb)),lower(N.pow(Rstar,2)));
greater(fixed.hostedOriginal[9].lower,zero);
less(fixed.hostedOriginal[9].upper,{rational:'1/64'});
less(upper(t1),{rational:'1/128'});
greater(lower(N.log(N.div(Xb,Xa))),{rational:'2'});

const originals = file => import(pathToFileURL(resolve(runtime,navier,file)).href);
const [{sourceNormalizedCutoffWeights}, {weightedGaussianDerivativeRules}, {ActualSourceExpressions}] =
  await Promise.all([
    originals('actual-residual-order-induction-kernels.mjs'),
    originals('actual-common-target-weighted-norms.mjs'),
    originals('actual-global-source-expressions.mjs'),
  ]);
const G = new ActualSourceExpressions();
const order = 9;
const degrees = Array.from({length:order+1},(_,j)=>j);
const factorial = [1n];
for (const j of degrees.slice(1)) factorial.push(factorial[j-1]*BigInt(j));
const choose = (n,k)=>factorial[n]/(factorial[k]*factorial[n-k]);
const profileTrace = new Map(profiles.trace.nodes.map(({id,node})=>[id,node]));
const unit = {op:'rational',args:['1','1']};
function hasUnit(id) {
  const node = profileTrace.get(id);
  return JSON.stringify(node)===JSON.stringify(unit) || (node.op==='add' && node.args.some(hasUnit));
}
const profileBounds = [0,1,2,3].map(n=>['F','U'].map(field=>{
  const group = backgroundGraph.groups.find(row=>row.order===n && row.field===field);
  assert(group);
  const key = 'ordinary_'+n+':'+field;
  const root = profiles.trace.roots[key];
  if (n===0) {
    const interval = background.leadingOrdinaryC10[field+'0'];
    if (field==='F') assert.equal(root,undefined);
    return {sourceRoot:group.sourceRoot,ordinaryThrough:10,upper:interval};
  }
  assert.equal(profiles.bindings.filter(row=>row.sourceRoot===group.sourceRoot).length,45);
  const ftcRoot = profiles.trace.roots['ftc_'+n+':'+field];
  const ftc = profileTrace.get(ftcRoot);
  assert.equal(ftc.op,'multiply');
  const weighted = ftc.args.find(id=>profileTrace.get(id).args.includes(root));
  assert.deepEqual(profileTrace.get(weighted),{op:'add',args:[1,root]});
  assert(hasUnit(ftc.args.find(id=>id!==weighted)));
  const stored = numericalProfiles.evaluatedProfiles['ftc_'+n+':'+field];
  assert.equal(stored.root,ftcRoot);
  return {sourceRoot:group.sourceRoot,ordinaryThrough:10,arithmeticRoot:root,
    enclosingFtcMajorantRoot:ftcRoot,upper:stored.interval.upper};
}));
const eulerRows = [1,2,3].map(n=>{
  const receipt = sourceNormalizedCutoffWeights({order:n,derivativeOrder:9});
  assert(receipt.pass && receipt.parameterExpressionSHA256===fullSlow.sourceParameterSHA256);
  return receipt.weights.map(row=>row.polynomialInSourceH);
});
const euler = eulerRows.map(rows=>rows.map(row=>sum(row.map((value,j)=>
  q(BigInt(value)+'/'+(64n**BigInt(j)))))));

// Each factor's degree-j Cauchy count is (j+1)(j+2)/2. The common
// (128 Rstar)^j is factored out of each positive Taylor product.
const count = degrees.map(j=>BigInt((j+1)*(j+2)/2));
const conv = (a,b)=>degrees.map(j=>degrees.slice(0,j+1)
  .reduce((total,k)=>total+a[k]*b[j-k],0n));
const countPowers = [degrees.map(j=>j===0?1n:0n)];
for (const j of degrees.slice(1)) countPowers.push(conv(countPowers[j-1],[0n,...count.slice(1)]));
const chart = countPowers.map(row=>conv(count,row));
const inverseRadius = N.mul(q(128),Rstar);
const xPowers = degrees.map(r=>N.pow(Rstar,2*r));
function compositionTerms(j, cutoff) {
  const rows=[];
  for (let r=0;r<=j;r++) for (let e=0;r+e<=j;e++) {
    const last = cutoff ? j-r-e : 0;
    for (let k=0;k<=last;k++) {
      const denominator = factorial[r]*factorial[e]*factorial[k];
      assert.equal(factorial[j]%denominator,0n);
      const scalar = 8n*(6n**BigInt(r))*(4n**BigInt(e+k))*chart[r+e+k][j]*factorial[j]/denominator;
      if (scalar) rows.push({r,e,k,coefficient:N.mul(q(scalar),xPowers[r])});
    }
  }
  return rows;
}
const allBackground = degrees.map(j=>{
  const rows = compositionTerms(j,true);
  return [0,1].map(field=>{
    const terms = profileBounds.map((pair,n)=>{
      const coeff = sum(rows.flatMap(row=>n===0 && row.k ? [] :
        [n===0 ? row.coefficient : N.mul(row.coefficient,euler[n-1][row.k])]));
      return N.mul(coeff,positive(pair[field].upper));
    });
    return N.mul(N.pow(inverseRadius,j),sum(terms));
  });
});

const innerUpper = inner.maxComponentPower.map(power=>N.pow(parameters.get('CSelected'),power+120*8));
const outerUpper = outer.integerTaylor.map(row=>{
  const scaled = row.slice(0,9).map((value,j)=>BigInt(value)*factorial[j]);
  const max = scaled.reduce((a,b)=>a>b?a:b,0n);
  return N.mul(Rstar,q(max));
});
// The original middle has y>=t1/8 and delta>=1/4, so zeta^-1<=exp(128).
const middleUpper = middle.componentBounds.map(row=>N.mul(N.exp(q(128)),positive(row[6])));
assert.equal(middle.componentBounds[0].length,8);
const gaussian = [0,3].map(pole=>weightedGaussianDerivativeRules(G,{a:G.q(4),initialPole:pole,order:8}));
assert.deepEqual(gaussian[0].unsignedFirstStirling,gaussian[1].unsignedFirstStirling);
const gaussianCoefficients = gaussian.map(result=>result.rows.map(({upperCoefficient})=>{
  const [numerator,denominator]=G.fraction(upperCoefficient);
  assert.equal(denominator,1n);
  return numerator;
}));
assert.equal(gaussianCoefficients[0][1],8n);
assert.equal(gaussianCoefficients[1][1],11n);
// Each missing logarithmic distance is >1 on its opposite collar.
const complement = N.exp(q(4));
const profilesWeighted = degrees.slice(0,9).map(r=>[0,1].map(component=>{
  const collar = gaussian.map((data,region)=>{
    const coefficients=gaussianCoefficients[region];
    const scalar = data.unsignedFirstStirling[r].reduce((total,value,j)=>
      total+BigInt(value)*coefficients.slice(0,j+1).reduce((s,c,k)=>s+choose(j,k)*c,0n),0n);
    const body = (region===0?innerUpper:outerUpper)[component];
    return product([complement,N.pow(Xa,-r),q(scalar),body]);
  });
  return N.max([N.one(),middleUpper[component],...collar]);
}));
const allTargets = degrees.slice(0,9).map(j=>{
  const rows=compositionTerms(j,false);
  return [0,1].map(component=>N.mul(N.pow(inverseRadius,j),sum(rows.map(({r,coefficient})=>
    N.mul(coefficient,profilesWeighted[r][component])))));
});
const closed = value=>({lower:zero,upper:upper(value)});
const maxima = rows=>rows[0].map((_,i)=>closed(N.max([N.one(),...rows.map(row=>row[i])])));
const backgroundC9=maxima(allBackground);
const weightedTargetC8=maxima(allTargets);
for (const value of [...backgroundC9,...weightedTargetC8]) greater(value.upper,zero);
const result={
  schema:'MathScope.N7.OriginalFixedSlabPointwiseC9C8/1',
  status:'VERIFIED_SOURCE_POINTWISE_BOUNDS_ON_ADMITTED_FIXED_SLAB',
  inputPins:inputs,historicalPin,sourcePins,sourceParameterSHA256:fullSlow.sourceParameterSHA256,
  domain:fullSlow.domain,activeBackgroundPrefix:backgroundGraph.activePrefix,
  profileBounds,cutoffEulerPolynomials:eulerRows,
  weightedProfileInput:{inner:innerUpper.map(closed),middle:middleUpper.map(closed),outer:outerUpper.map(closed),
    gaussianIntegerUpper:gaussianCoefficients.map(row=>row.map(String)),stirling:gaussian[0].unsignedFirstStirling},
  backgroundC9:{F:backgroundC9[0],G:backgroundC9[1]},
  weightedTargetC8:{pole:27,weight:'zeta*delta_star^(-27)',component:weightedTargetC8},
  arithmetic:N.report(),
  scope:'Direct numerical pointwise estimates on the fixed source slab. Original profile analytic premises apply. No original all-band norm seal, live Forced attachment, or active increment estimate.',
  finalJets:'0/67',release:'HOLD',
};
await writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log('PASS fixed-slab original background C9 and weighted target C8 pointwise numerical bounds');
