/** Extend the original regular outer target Taylor and J-kernel bounds through thirteen. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [goal,runtime,chartPath,out] = process.argv.slice(2);
assert(goal && runtime && chartPath && out);
const pins={
  program:'3135320a19ba8d720c99939ee7fa9a67a8a03f9fce61d8b73b3757d422d59e58',
  c9:'363d484e7699ce86af70a6d7ff23bd0c0a10366a64a86e3379e60852cbe56d84',
  kernel:'934731bc39f6770d49fb3085c1e3cf350db33d16a40ae1e9a5de2a605a85b1f6',
  amplitude:'370f913b7f664b9e0f4cd289cc1970f946ce917620984db814f187df72e9d812',
  target:'3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770',
  live:'23d3577bc75eb2a6587eb5839a7c6b9f834814e46c335c136fb165757f03aa39',
  background:'4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966',
  fixed:'9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c',
  arithmetic:'4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47',
  thresholds:'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
  chart14:'b3f110811f8c704daf2d1b9190947b41f4cc76aeeb62b2656f65044a98b077c2',
  stress:'b3567c39a9381ef16c3d94f0a24a88571a87dee7a61b9fe782d2076732b165f5',
};
const read=async(name,path)=>{
  const raw=await readFile(path);
  assert.equal(createHash('sha256').update(raw).digest('hex'),pins[name],name);
  return raw.toString();
};
const json=async(name,path)=>JSON.parse(await read(name,path));
const norm='whole-k-annular-wrz-norm';
const packed=resolve(goal,norm,'target-numerical');
const fixedDirectory=resolve(goal,'whole-k-annular-initial/numerical');
const wave='primary-forced-join/active-n3-c5-binding/first-wave-guard-traces';
const arithmetic=resolve(fixedDirectory,'source_arithmetic.mjs');
const [baseline,c9,kernel,amplitude,target,live,background,fixed,thresholds,chart,stress] = await Promise.all([
  read('program',resolve(packed,'evaluate_target_outer.mjs')),
  json('c9',resolve(packed,'target-outer-numerical.json')),
  json('kernel',resolve(packed,'outer-kernel-bounds.json')),
  json('amplitude',resolve(packed,'terminal-amplitude-link.json')),
  json('target',resolve(goal,norm,'target-c7.json')),
  json('live',resolve(goal,wave,'outer-normalized-amplitude/outer-live.json')),
  json('background',resolve(goal,norm,'numerical/background-c8-complete.json')),
  json('fixed',resolve(fixedDirectory,'stage-zero-fixed-numerical.json')),
  json('thresholds',resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json')),
  json('chart14',chartPath),
  read('stress',resolve(runtime,'research-ide/mathscope-m2/navier/actual-stress-direction-program.mjs')),
  read('arithmetic',arithmetic),
]);
assert.equal(target.graph.uncompressedSHA256,kernel.targetGraphSHA256);
assert.equal(amplitude.targetGraphSHA256,kernel.targetGraphSHA256);
assert.equal(amplitude.targetOuterEpowB,target.regionFactoring.outer.EpowB);
assert.equal(amplitude.sourceParameterSHA256,target.sourceParameterSHA256);
assert.equal(amplitude.alphaNormalizedOriginalAndTargetSHA256,'508dd94a9ac67a4cfdf11cbaa05b6f713762f6c7ee639e2270a5b1cb7817971b');
assert.equal(amplitude.bound,'0<EpowB<exp(-65536)<1; 0<=delta<=1/2 and A=1/2+h<1 give EpowB*exp(A*delta)<2');
assert.deepEqual(target.regions.outer.bodies,c9.actualOuterBodies);
assert.deepEqual(c9.actualOuterBodies,[119567,119694]);
assert.deepEqual(kernel.originalJkernels.map(({root,m})=>[root,m]),[[119364,-3],[119561,-3],[119679,-3],[119689,0]]);
assert.deepEqual(live.target.Tbar.map(row=>row.baseNativeSlot),[32017,32018]);
assert(live.conditionalAnalyticIdentity.includes('bbar=s^(-A-1/2)*(b_theta,delta^6*b_z)'));
assert.equal(chart.pointwiseCoefficientCap,'2^3654*Hc^255');
for(const fragment of [
  'The terminal original stage is eta-independent.',
  "EpowB=G.mul(p('Pstar'),G.exp(terminal.logAEnd))",
  'Kdelta=G.mul(pow,G.add(G.mul(A,heat),G.mul(Z,exactHeatZ)))',
  'const half=G.mul(q(1,2),s),den=G.add(flat(half),flat(G.sub(o,half))),go=G.inv(den)',
  'c=G.mul(rho,G.add(G.mul(q(8),go),G.mul(G.pow(s,3),gp)))',
  "J('outer_viscous_stress',delta,-3", "J('outer_inviscid_stress',delta,-3",
  "J('outer_pressure',s,-3", "J('outer_axial_stress',delta,0",
  'outerScaledZ=G.mul(G.pow(delta,6),outerZ)',
]) assert(stress.includes(fragment),fragment);

// The heat coefficients come from the original positive Gamma density.
// Rising products at 0<h<1 satisfy (h)_j <= h*j! and (1+h)_j <= (j+1)!.
// The square seed's complex disk gives Re(1/w^2)>1/(2*t^2):
// inverse squared modulus >=16/25 and cos(2 arg w)>=4/5.
assert(2*16*4>25*5);
// On the half-distance collar the opposing seed is at least exp(-16/9).
// Its reciprocal is <9 because 16/9<2 and exp(1)<3.
assert(16<2*9);
const start=baseline.indexOf('const order = 9;');
const stop=baseline.indexOf('const rows = target.regions.outer.rows.map');
assert(start>=0 && stop>start);
const originalTaylor=baseline.slice(start,stop);
const calculate=body=>Function('assert',body+'\nreturn {order,C,theta,axial,moments};')(assert);
const low=calculate(originalTaylor);
assert.deepEqual([low.theta,low.axial].map(series=>series.map(String)),c9.integerTaylor);
assert.deepEqual(low.moments.map(String),c9.momentBounds);
let highTaylor=originalTaylor;
const change=(from,to)=>{
  assert.equal(highTaylor.split(from).length,2,from);
  highTaylor=highTaylor.replace(from,to);
};
change('const order = 9;', 'const order = 13;');
change('function coefficient10(base, perturbation) {','function topHeatCoefficient(base, perturbation) {');
change('const end = 10;', 'const end = order + 1;');
change('const k10 = coefficient10(Array.from({length: 11}', 'const upperK = topHeatCoefficient(Array.from({length: order + 2}');
change('10n * k10','BigInt(order + 1) * upperK');
const high=calculate(highTaylor);
assert.equal(high.order,13);
const coefficientBits=Math.max(...high.C.flat().map(n=>n.toString(2).length)); assert(coefficientBits<320);
assert(high.C.every((row,c)=>row.slice(0,10).every((value,j)=>{
  // The inherited degree-nine final slot uses a special loose degree-ten
  // heat bound. Earlier derivatives must agree exactly; the degree-nine
  // value can increase or decrease with the improved degree bookkeeping.
  return j===9 || value===low.C[c][j];
})));

const {sourceArithmetic}=await import(pathToFileURL(arithmetic).href);
const {N}=await sourceArithmetic(runtime,thresholds.sourcePins,'coarse-upper');
assert.equal(N.compareEndpoints(background.Xb.lower,{exp:{rational:'2'}}),1);
assert.equal(N.compareEndpoints(fixed.hostedOriginal[9].lower,{rational:'0'}),1);
assert.equal(N.compareEndpoints(fixed.hostedOriginal[9].upper,{rational:'1/64'}),-1);
const Renv=N.fromClosed(fixed.hostedOriginal[216823]);
const radius=N.sqrt(N.mul(N.point('2'),N.fromClosed(background.Xb)));
assert.equal(N.compareEndpoints(N.toClosed(radius).upper,N.toClosed(Renv).lower),-1);
// X>=Xb*exp(-1/2)>1, so derivatives in X cost at most j!, no Renv inverse.
assert(3654+coefficientBits+26<4096 && 255+1<4096);
const rows=Array.from({length:14},(_,j)=>{
  const cap=high.C.map(series=>series[j]);
  return {order:j,actualLogDerivativeIntegerCaps:cap.map(String),
    actualLogDerivativeEndpoints:cap.map(c=>N.toClosed(N.mul(Renv,N.point(String(c)))).upper),
    physicalRZTCap:'2^4096*Bnorm'};
});
const receipt={
  schema:'MathScope.C104.RegularOuterStressC13/1',
  status:'VERIFIED_ORIGINAL_REGULAR_OUTER_ANALYTIC_COEFFICIENT_C13_CONDITIONAL_PHYSICAL_CHART',
  pins, sourceGraphSHA256:kernel.targetGraphSHA256, actualRegularOuterBodies:c9.actualOuterBodies,
  activeTargetSlots:live.target.Tbar.map(row=>row.baseNativeSlot), sourceGamma:kernel.sourceGamma,
  Jkernels:kernel.originalJkernels, nativeFactorization:live.conditionalAnalyticIdentity,
  sourceHeatDerivativeOrder:14, outputDerivativeOrder:13, preservedOriginalAxialDeltaSix:true,
  originalCompleteC9TaylorReplayMatches:true,
  integerTaylor:[high.theta,high.axial].map(series=>series.map(String)), momentBounds:high.moments.map(String),
  ordinaryCapRows:rows,
  scope:'Original analytic heat, terminal amplitude, moment restoration, positive cutoff denominators, ordinary J integral semantics, and original same-live collar chart. Regular factors only; separate Gaussian, higher FTC face integrals and covariance frame.',
  finalJets:'0/67', release:'HOLD',
};
await writeFile(out,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({sourceHeatDerivativeOrder:14,outputDerivativeOrder:13,
  C12:rows[12].actualLogDerivativeIntegerCaps.map(x=>BigInt(x).toString(2).length),
  C13:rows[13].actualLogDerivativeIntegerCaps.map(x=>BigInt(x).toString(2).length)}));
