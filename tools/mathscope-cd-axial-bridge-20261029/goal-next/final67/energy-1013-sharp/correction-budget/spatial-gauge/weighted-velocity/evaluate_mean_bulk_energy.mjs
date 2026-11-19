/** Conditional energy of C times the original virtual axisymmetric mean. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [goal, runtime, historicalPath, coefficientPath, output] = process.argv.slice(2);
assert.equal(process.argv.length, 7);
const {load, sourceArithmetic} = await import(pathToFileURL(resolve(goal,
  'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const pins = {
  coefficients: 'a063ec41e45055397ab3f3eea1df520a7806df690db2b80fe371a5aa8da31356',
  valuation: '240a21bc2a0886b4f21ead841a5baf949bf68bd6f71cf05fbbefb474bfab6ce8',
  fixed: '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c',
  background: '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966',
  thresholds: 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
  historical: '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0',
};
const [coefficients, valuation, fixed, background, thresholds, historical] = await Promise.all([
  load(coefficientPath, pins.coefficients),
  load(resolve(goal, 'primary-forced-weights/weighted-stage-zero-valuation.json'), pins.valuation),
  load(resolve(goal, 'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json'), pins.fixed),
  load(resolve(goal, 'whole-k-annular-wrz-norm/numerical/background-c8-complete.json'), pins.background),
  load(resolve(goal, 'whole-k-selector-scales/historical-scale-arithmetic-result.json'), pins.thresholds),
  load(historicalPath, pins.historical),
]);
assert.equal(coefficients.sourceSHA256, valuation.source.oldGraph);
assert.equal(coefficients.oldPositiveGraphSHA256, valuation.source.meanPositiveGraph);
assert.equal(valuation.units, '1/100000');
assert.deepEqual(valuation.factoredActualNormBounds.C0.maxRoots, [7590,7602,7594]);
assert.deepEqual(valuation.factoredActualNormBounds.C1.maxRoots, [7619,7591,7627,7603,7635,7595]);
assert.equal(valuation.factoredActualNormBounds.C0.epsilonExponent, 99999);
assert.equal(valuation.factoredActualNormBounds.C1.epsilonExponent, 99998);
assert.equal(valuation.factoredActualNormBounds.beta0.epsilonExponent, 199999);
assert.equal(valuation.factoredActualNormBounds.beta1.epsilonExponent, 199998);
const {N, evaluateClosedArithmeticDefinitions} = await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const q = value => N.point(String(value));
const closed = value => N.toClosed(value);
const upper = value => N.fromClosed({lower: value.upper, upper: value.upper});
const sum = values => values.reduce((a,b) => N.add(a,b),N.zero());
const h = evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:['h']}).values.get('h');
const ell = N.fromClosed(fixed.hostedOriginal[617432]);
const logTau = N.neg(N.mul(N.add(ell,q(15)),N.log(q(2))));
const hLogTau = N.mul(h,logTau), logFour = N.log(q(4));
assert.equal(N.compareEndpoints(closed(h).lower,{rational:'0'}),1);
assert.equal(N.compareEndpoints(closed(h).upper,{rational:'1/64'}),-1);
const C0 = upper(coefficients.C0), C1 = upper(coefficients.C1);
const Rinv = N.mul(q(2),N.fromClosed(fixed.hostedOriginal[216823]));
const Xb = N.fromClosed(background.Xb);
const weighted = (constant, halfInteger, alpha) => {
  // tau0^A Q^(-A) epsilon^alpha, or its first-derivative analogue.
  // Q in [tau0/4,4 tau0], epsilon=Q^h, frozen-band derivative.
  const exponent = N.add(q(halfInteger),N.mul(N.sub(q(1),q(alpha)),h));
  return N.mul(constant,N.exp(N.add(N.mul(exponent,logFour),N.mul(q(alpha),hLogTau))));
};
const fields = [
  {name:'beta',a0:'199999/100000',a1:'199998/100000'},
  {name:'v',a0:'99999/100000',a1:'99998/100000'},
  {name:'gamma',a0:'99999/100000',a1:'99998/100000'},
].map(row => {
  const velocity = weighted(C0,'1/2',row.a0);
  const radial = weighted(C1,1,row.a1);
  const axial = N.add(radial,N.mul(q(64),N.mul(N.exp(hLogTau),velocity)));
  const connection = weighted(N.mul(Rinv,C0),1,row.a0);
  return {...row,velocity,radial,axial,connection};
});
const velocitySquare = sum(fields.map(row=>N.pow(row.velocity,2)));
const gradientSquare = sum(fields.flatMap(row=>[
  N.pow(row.radial,2),N.pow(row.axial,2),
  ...(row.name==='gamma'?[]:[N.pow(row.connection,2)]),
]));
const energyOverTau = N.mul(N.mul(q(32),Xb),N.add(velocitySquare,N.mul(q(2),gradientSquare)));
const fourA = N.add(q(2),N.mul(q(4),h));
const budgetOverTau = N.mul(q(`1/${1n<<26n}`),
  N.exp(N.sub(N.sub(N.mul(q(-2),hLogTau),N.mul(fourA,N.log(Xb))),N.log(fourA))));
const comparison = N.compareEndpoints(closed(energyOverTau).upper,closed(budgetOverTau).lower);
assert.notEqual(comparison,null);
const result = {
  schema:'MathScope.N7.ConditionalSavedMeanBulkVelocityEnergy/1',
  status:comparison<=0?'CONDITIONAL_VIRTUAL_MEAN_BULK_BUDGET':'CONDITIONAL_VIRTUAL_MEAN_BULK_UPPER_TOO_WIDE',
  sourcePins:pins,comparison,velocityFields:fields.map(row=>({
    name:row.name,epsilonValueExponent:row.a0,epsilonDerivativeExponent:row.a1,
    velocity:closed(row.velocity),radialDerivative:closed(row.radial),axialDerivative:closed(row.axial),
    angularConnection:closed(row.connection),
  })),
  twiceEnergyAndDissipationUpperDividedByTau0:closed(energyOverTau).upper,
  budgetLowerDividedByTau0:closed(budgetOverTau).lower,
  formulas:{
    normalizedVelocity:'4^(A-h*alpha0)*C0*tau0^(h*alpha0)',
    normalizedDerivative:'4^(A+1/2-h*alpha1)*C1*tau0^(h*alpha1)',
    gradient:'sum_j(|D_R u_j|^2+|D_Z u_j|^2)+(beta^2+v^2)/R^2',
    cutoff:'The scalar velocity cutoff C has magnitude <=1 and normalized axial derivative <=64*tau0^h.',
  },
  assumptions:[...valuation.proofDependencies,
    'Q is frozen during derivatives and lies in [tau0/4,4*tau0]',
    'the prior mean C0/C1 bounds apply to the chosen virtual beta,v,gamma and their normalized spatial derivatives',
    'the axisymmetric velocity and scalar-cutoff energy is measured in the existing correction-budget normalization'],
  scope:'Conditional energy for the scalar-cutoff virtual mean velocity. The actual initialized field is formed by curl(C Amean) and may contain radial fast pullback a*L(psi) and cutoff commutator terms. Their bounds remain independent obligations before using this result for the actual annular mean energy.',
  actualAnnularEnergy:'OPEN',finalJets:0,release:'HOLD',arithmetic:N.report(),
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,comparison,fields:fields.length}));
