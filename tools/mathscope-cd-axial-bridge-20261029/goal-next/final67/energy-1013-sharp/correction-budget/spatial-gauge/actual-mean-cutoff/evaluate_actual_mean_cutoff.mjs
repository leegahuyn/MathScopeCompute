import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {prepareMeanBulkEnergy} from '../weighted-velocity/evaluate_mean_bulk_energy.mjs';

const [goal, runtime, historicalPath, coefficientPath, identityPath, output] = process.argv.slice(2);
assert.equal(process.argv.length, 8);
const {load, pins, coefficients, valuation, fixed, N, q, closed, sum, h, hLogTau, logFour, C0, Xb, fields} =
  await prepareMeanBulkEnergy(goal, runtime, historicalPath, coefficientPath);
const sharedEvaluator = await readFile(new URL('../weighted-velocity/evaluate_mean_bulk_energy.mjs', import.meta.url));
const sharedEvaluatorSHA256 = createHash('sha256').update(sharedEvaluator).digest('hex');

const identityPin='36f30a23afbfdb254e392a351d322f4dfd8a4656bd1c935d25cf65994b30b6c3';
const identities=await load(identityPath,identityPin);
assert.equal(identities.sourceSHA256,coefficients.sourceSHA256);
assert.deepEqual(identities.sourceMean.completeVelocity,[3614790,3614791,3614792]);
assert.equal(identities.verifiedFullSourceNodes,4456994);
assert.deepEqual(identities.actualFiveMap.parameters,[622791,622802,622803,622804]);
assert.deepEqual(identities.cutoffConstants,{value:1,z:20,zz:692,radialDerivative:0});
const tauH=N.exp(hLogTau);
const [beta,v,gamma]=fields;
const Renv=N.fromClosed(fixed.hostedOriginal[216823]);
const potentialValue=N.mul(N.mul(q('1/2'),N.mul(Renv,C0)),
  N.exp(N.add(N.mul(N.mul(q('1/100000'),h),logFour),N.mul(q('99999/100000'),hLogTau))));
const potentialRadial=N.mul(q('3/2'),gamma.velocity);
const potentialAxial=beta.velocity;
const commutatorVelocity=N.mul(N.mul(q(10),N.mul(Renv,C0)),
  N.exp(N.add(N.mul(N.mul(q('1/100000'),h),logFour),N.mul(q('199999/100000'),hLogTau))));
const commutatorRadial=N.mul(q(30),N.mul(tauH,gamma.velocity));
const commutatorAngular=N.mul(q(10),N.mul(tauH,gamma.velocity));
const commutatorAxial=N.add(
  N.mul(q('173/5'),N.mul(tauH,commutatorVelocity)),
  N.mul(q(20),N.mul(tauH,beta.velocity)));
const localized=[
  {name:'beta',velocity:N.add(beta.velocity,commutatorVelocity),
    radial:N.add(beta.radial,commutatorRadial),
    axial:sum([beta.radial,N.mul(q(20),N.mul(tauH,beta.velocity)),commutatorAxial]),
    connection:N.add(beta.connection,commutatorAngular)},
  {name:'v',velocity:v.velocity,radial:v.radial,
    axial:N.add(v.radial,N.mul(q(20),N.mul(tauH,v.velocity))),connection:v.connection},
  {name:'gamma',velocity:gamma.velocity,radial:gamma.radial,
    axial:N.add(gamma.radial,N.mul(q(20),N.mul(tauH,gamma.velocity))),connection:N.zero()},
];
const velocitySquare=sum(localized.map(row=>N.pow(row.velocity,2)));
const gradientSquare=sum(localized.flatMap(row=>[
  N.pow(row.radial,2),N.pow(row.axial,2),N.pow(row.connection,2)]));
const energyOverTau=N.mul(N.mul(q(32),Xb),N.add(velocitySquare,N.mul(q(2),gradientSquare)));
const fourA=N.add(q(2),N.mul(q(4),h));
const budgetOverTau=N.mul(q('1/'+String(1n<<26n)),
  N.exp(N.sub(N.sub(N.mul(q(-2),hLogTau),N.mul(fourA,N.log(Xb))),N.log(fourA))));
const comparison=N.compareEndpoints(closed(energyOverTau).upper,closed(budgetOverTau).lower);
assert.notEqual(comparison,null);
const result={
  schema:'MathScope.N7.ConditionalActualInitializedMeanCutoffEnergy/1',
  status:comparison<=0?'CONDITIONAL_ACTUAL_MEAN_CUTOFF_BUDGET':'CONDITIONAL_ACTUAL_MEAN_CUTOFF_UPPER_TOO_WIDE',
  comparison,sourcePins:{...pins,sharedEvaluatorSHA256,cutoffIdentities:identityPin},
  actualSourceVelocity:[3614790,3614791,3614792],
  localizedVelocity:localized.map(row=>({name:row.name,velocity:closed(row.velocity),
    radialDerivative:closed(row.radial),axialDerivative:closed(row.axial),
    angularConnection:closed(row.connection)})),
  commutator:{velocity:closed(commutatorVelocity),radial:closed(commutatorRadial),
    axial:closed(commutatorAxial),angularConnection:closed(commutatorAngular)},
  meanPotential:{
    valueNormalization:'tau0^h * Psi',value:closed(potentialValue),
    derivativeNormalization:'tau0^A * partial_(r,z) Psi',
    radialDerivative:closed(potentialRadial),axialDerivative:closed(potentialAxial),
    angularConnection:closed(N.mul(q('1/2'),gamma.velocity)),
  },
  twiceEnergyAndDissipationUpperDividedByTau0:closed(energyOverTau).upper,
  budgetLowerDividedByTau0:closed(budgetOverTau).lower,
  characteristicBound:'|psi|<=R*C0*epsilon^(1-kappa_s)/2 and |psi/R|<=C0*epsilon^(1-kappa_s)/2.',
  formulas:{
    commutatorVelocity:'10 Renv C0 4^(h*kappa_s) tau0^(h*(2-kappa_s))',
    commutatorRadial:'30 tau0^h U_gamma',
    commutatorAxial:'(173/5) tau0^h K0 + 20 tau0^h U_beta',
    commutatorAngularConnection:'10 tau0^h U_gamma',
    betaAxial:'G_beta + 40 tau0^h U_beta + (173/5) tau0^h K0',
  },
  assumptions:[...valuation.proofDependencies,...identities.assumptions,
    'same saved-source complete mean and radial-characteristic bound over the whole admitted reference envelope',
    'the normalization and geometric measure enclosure from the preceding original annular energy replay'],
  scope:'Conditional enclosure for the actual initialized mean contribution curl(C Amean)+C v e_theta on the annular radial plateau, including the axial cutoff commutator and all first spatial derivatives. This includes the source Temporal covariant curl and auxiliary-independent FiveMap identities. Source analytic envelope and radial-characteristic uniformity premises remain explicit.',
  N706:'OPEN',N805:'OPEN',finalJets:0,release:'HOLD',arithmetic:N.report(),
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,comparison,completeMeanComponents:localized.length}));
