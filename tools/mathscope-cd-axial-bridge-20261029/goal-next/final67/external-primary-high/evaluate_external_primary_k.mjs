import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [goal, work, output] = process.argv.slice(2);
assert.ok(goal && work && output);
const sha = raw => createHash('sha256').update(raw).digest('hex');
const pins = {
  profile: ['final67/live-background-c10/positive-c10-directed.json','f756d88c734373cd5a7a34684a5b1edac272298774c60d27667fc8473a1833f9'],
  transport: ['final67/n7-n8-target-primary-transport/primary-transport.json','a6027c998b42336dbeffd5157e443eca485850e9cca3d78c0afcccf29cbff8b9'],
  coefficient: ['final67/n7-n8-primary-cutoff-orders/primary-cutoff-orders.json','d3dab84d038b542253e76a27b5eb84d4730fd5660f8db9fc26774a09bb5d43d9'],
  slab: ['final67/local-background-c8/c8-slab.json','e26c62baf924c4209bbac2ebd944bd17a992bfe4599fd1a8fab2cb8c91d7c02b'],
  frozen: ['final67/frozen-n4-high/frozen-high-bridge.json','a4cbadff8f11caf2b75a5933b49457cc4260307fe2ad712a5c9eadbe8e7f776e'],
  arithmetic: ['whole-k-selector-scales/historical-scale-arithmetic-result.json','af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
};
const checked = (root, path, pin) => {
  const raw = readFileSync(resolve(root,path));
  assert.equal(sha(raw),pin,path);
  return raw;
};
const [profile,transport,coefficient,slab,frozen,arithmetic] =
  Object.values(pins).map(([path,pin])=>JSON.parse(checked(goal,path,pin)));
assert.equal(profile.candidateFullC10.combinedComparison,-1);
assert.equal(coefficient.simpleCommonUpper.belowExistingN6DirectedUpper,true);
assert.deepEqual(transport.transfers.map(row=>row.outputOrder),[6,7]);

assert.equal(frozen.status,'PASS_ORIGINAL_RAW_C10_RANK_AND_CUTOFF_TRANSPORT_CONDITIONAL_SOURCE_ANALYSIS');
assert.equal(frozen.scope.exceptionalFrozenN4Through10,true);
assert.deepEqual(frozen.rawC10.rank,[2,33127]);
assert.equal(frozen.chartCutoff.eulerOrder,10);
assert.ok(frozen.conclusion.includes('exp(-L^6/3)<1'));
assert.ok(4n*3n < 64n && 12n < 2n**34n && 162n*16n < 2n**12n);

const root = resolve(work,'continuation27/original-primary-degree-runtime/research-ide');
const originals = {
  'mathscope-m3/navier/source-primary-class-majorants.mjs':'40b3f1220b7ad1b9b05a11ae1378c864351e77e8efe7134ae1b78921fbab47ea',
  'mathscope-m2/navier/actual-compact-all-band-background-norms.mjs':'62d877ca5d45073c8e95862bc0f5d0d44197f8ace34bd77d885bfbececc69464',
};
const [majorant,background] = Object.entries(originals).map(([path,pin])=>checked(root,path,pin).toString('utf8'));
for (const marker of [
  'backgroundRow.B_m,G.pow(W,m+3),G.inv(dstar),G.inv(G.sqrt(cy)),haarLengthUpper',
  'coefficientConstants.maximum,...targetRows.map(r=>r.N_m)',
  'epsilonExponent:degreeProgram.exponents[name]',
  'named.fullCovariance=sum([named.fullCovariance,named.covarianceRemainder]);',
  'G.pow(q(4),r.order+f.power),f.constant)',
  'reserve=n=>n<=1n?0:(n-1n).toString(2).length',
]) assert.ok(majorant.includes(marker),marker);
assert.ok(background.includes('B_m:G.maximum(Bnorm,rows[j+2].Cslow,q(factorial(j+2)),Lmax,q(2))'));

const historyPin='03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0';
const history=JSON.parse(checked(work,'whole-k-prefix/historical-scale-arithmetic-input.json',historyPin));
const {sourceArithmetic}=await import(pathToFileURL(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const {N,evaluateClosedArithmeticDefinitions}=await sourceArithmetic(resolve(work,'annular-numeric-24/pinned-original-runtime'),arithmetic.sourcePins,'coarse-upper');
const {values}=evaluateClosedArithmeticDefinitions(history.definitions,N,{names:['h','t1']});
const ell=N.fromClosed(history.archivedEllMinimumInterval);
const H=N.mul(values.get('h'),N.mul(N.add(ell,N.point('15')),N.log(N.point('2'))));
const gate=N.fromClosed(slab.gates.smallGrowth128);
const gain=N.mul(H,N.point('1/'+String(2n**115n)));
const fullProfile=N.add(N.fromClosed(profile.candidateFullC10.upper),N.point('1'));
const factorial = n => {
  let result = 1n;
  for (let i=2n;i<=BigInt(n);i++) result *= i;
  return result;
};
// For p<=54 use e^(z^2)>=z^54/27! when z>=1, and delta>=t1 otherwise.
const logBoundary=N.add(N.log(N.point(String(factorial(27)))),
  N.mul(N.point('-54'),N.log(values.get('t1'))));
const boundaryCap=N.toClosed(logBoundary);
const boundaryComparison=N.compareEndpoints(boundaryCap.upper,N.toClosed(gain).lower);
assert.equal(boundaryComparison,-1);
const halfBoundaryCap = N.toClosed(N.add(logBoundary, N.mul(N.point("27"),N.log(N.point("2")))));
const halfBoundaryComparison = N.compareEndpoints(halfBoundaryCap.upper,N.toClosed(gain).lower);
assert.equal(halfBoundaryComparison,-1);

const horizon=[];
for (const primitive of transport.primitiveDirectedAlready) {
  for (const jet of transport.transfers) {
    const m=jet.outputOrder;
    const h=jet.sharperHybridTransfer;
    const exact=primitive.extended;
    const w=exact['W'+String(m+3)];
    const inputs={
      dyadicBase:N.point(String(2n**128n)),
      backgroundC10PlusOne:fullProfile,
      WToRequiredPower:N.fromClosed(w),
      inverseDstar:N.fromClosed(exact.inverseDstar),
      inverseSqrtCy:N.fromClosed(exact.inverseSqrtCy),
      coefficient:N.fromClosed(coefficient.simpleCommonUpper.enclosure),
      target:N.fromClosed(h.targetMaximum),
    };
    const largest=N.max(Object.values(inputs));
    const k=N.toClosed(largest);
    const pieces=Object.fromEntries(Object.entries(inputs).map(([name,value])=>
      [name,N.compareEndpoints(N.toClosed(value).upper,N.toClosed(gate).lower)]));
    const p=h.program;
    const fullCovariance=p.primaryCovariance.map((x,j)=>Math.max(x.power,p.covarianceRemainder[j].power)+1);
    const allDegrees=[p.weighted.amplitude,p.weighted.potential,p.weighted.curl,
      p.pressure,p.covarianceRemainder].flat().map(row=>row.power);
    const maxPower=Math.max(...allDegrees,...fullCovariance);
    assert.equal(maxPower,m===6?3405:3814);
    const logCap=N.toClosed(N.mul(N.point(String(maxPower)),N.log(largest)));
    const kComparison=N.compareEndpoints(k.upper,N.toClosed(gate).lower);
    const coefficientComparison=N.compareEndpoints(logCap.upper,N.toClosed(gain).lower);
    const haarExtraLog=N.mul(N.point(String(12+2*(m+Math.max(...fullCovariance)))),N.log(N.point("2")));
    const haarLogCap=N.toClosed(N.add(N.fromClosed(logCap),haarExtraLog));
    const haarComparison=N.compareEndpoints(haarLogCap.upper,N.toClosed(N.mul(H,N.point("1/"+String(2n**113n)))).lower);
    assert.equal(kComparison,-1);
    assert.equal(coefficientComparison,-1);
    assert.equal(haarComparison,-1);
    horizon.push({prefix:primitive.prefix,order:m,
      includedOriginalCandidateConstants:Object.keys(inputs),maxPower,k,logCap,haarLogCap,
      componentComparisons:pieces,kComparison,coefficientComparison,haarComparison});
  }
}
const report={
  schema:'MathScope.N7.ExternalOriginalPrimaryHighScalar/1',
  status:'DIRECTED_COMPARISON_CONDITIONAL_EXTERNAL_SOURCE_RECURRENCE',
  sourceFileSHA256:originals,pins,historyPin,horizon,
  wholeCslowAdmission:'The admitted pointwise C10 upper includes the leading profile and orders 1 through 3 for q <= 4 tau0. Source cutoff geometry removes n >= 5, and the independent fourth frozen summand is smaller than one on its exceptional admitted original collar.',
  unchangedBnormDominance:'The established Bnorm <= W^8 and W>=1 imply Bnorm <= W^(m+3). The original 9!,10!,2, Lmax, and Haar length are below 2^128.',
  smallGrowth:'All conditional external Khat values are below exp(H/2^128)/(64 Xb^2) and maxDegree log(Khat)<H/2^115.',
  haarFactor: '162*auxMass*4^(2A+2h)*4^(j+power) <= 2^(12+2*(m+power)); logHaarCap < H/2^113.',
  unaveragedRadialWeight: {maxPole:54,bound:'zeta*delta^-p <= 27! * t1^-54',logUpper:boundaryCap,compareHOver2Pow115:boundaryComparison,
    halfGaussianBound:'sqrt(zeta)*delta^-p <= 2^27 * 27! * t1^-54',
    halfGaussianLogUpper:halfBoundaryCap,halfGaussianCompareHOver2Pow115:halfBoundaryComparison},
  nativeKRootEvaluated:false,actualWholePathAssociation:'OPEN',actualAllCorrections:'OPEN',
  finalJets:0,release:'HOLD',
};
writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({comparisons:horizon.map(x=>[x.prefix,x.order,x.kComparison,x.coefficientComparison,x.haarComparison])}));
