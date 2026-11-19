/** Jointly absorb primary stable factors and compare the original energy fraction. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const [goal,runtime,historicalPath,ledgerPath,output] = process.argv.slice(2);
assert.equal(process.argv.length,7);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const helper = resolve(goal,'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/evaluate_mean_bulk_energy.mjs');
assert.equal(digest(await readFile(helper)),'61d4d23e7ec003206758c861a2e464791730dc6f14b648d3b5eb721418f59f7b');
const {prepareMeanBulkEnergy} = await import(pathToFileURL(helper).href);
const ctx = await prepareMeanBulkEnergy(goal,runtime,historicalPath,resolve(goal,
  'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/weighted-velocity-coefficients.json'));
const {N,q,closed,load,fixed,h,hLogTau,Xb} = ctx;
const ledgerBytes = await readFile(ledgerPath);
assert.equal(digest(ledgerBytes),'b06a3591051ef0f0ac15896c7ed88b264bdd9a7c3891c0d84f0b471488d1f4f3');
const ledger = JSON.parse(ledgerBytes);
assert.equal(ledger.graphSHA256,digest(JSON.stringify(ledger.nodes)));
assert.deepEqual(ledger.positiveDegrees,['34','2']);
assert.deepEqual(ledger.symbols,{P:27,F:3541});
assert.equal(ledger.rows,162);
const [threshold,fullSlow] = await Promise.all([
  load(resolve(goal,'final67/energy-1013-sharp/correction-budget/spatial-gauge/mean-coupled-source/common-threshold-source.json'),
    '2f72eede076eafe81098b075bcb5125a7a1fee2b17fb38617e6cf6962bee1745'),
  load(resolve(goal,'primary-forced-weights/full-slow-norms/full-slow-norms.json'),
    '517662b18f4014644cd7539de42b82b74999374aaf34273163f39693f160bdb4'),
]);
assert.equal(threshold.verifiedFullSourceNodes,4456994);
assert.equal(threshold.sourceSHA256,ledger.sourceSHA256);
assert.equal(fullSlow.status,'VERIFIED_ORIGINAL_FULL_R_Z_T_BOUNDS_ON_THE_FIXED_PHYSICAL_SLAB');
const background = Object.fromEntries(fullSlow.backgroundC8.flatMap(row =>
  ['F','G'].map(name => [row.originalDirectionalRoots[name],row[name]])));
const target = Object.fromEntries(fullSlow.weightedTargetC7.flatMap(row =>
  row.originalDirectionalRoots.map((id,i) => [id,row.component[i]])));
assert.equal(Object.keys(background).length,18);
assert.equal(Object.keys(target).length,16);
const leaves = {'hosted-original':fixed.hostedOriginal,'fixed-radial':fixed.fixedRadial,
  'background-c8':background,'target-c7':target};
const cache = new Map(),usedLeaves = new Set();
function coefficient(id) {
  if (cache.has(id)) return cache.get(id);
  let value;
  if (id === 27 || id === 3541) value = N.one();
  else {
    const {op,args} = ledger.nodes[id];
    if (op === 'rational') value = q(args[0]+'/'+args[1]);
    else if (op === 'authenticated_source_norm_root') {
      assert.ok(leaves[args[0]]?.[args[1]],args.join('/'));
      usedLeaves.add(args.join('/'));
      value = N.fromClosed(leaves[args[0]][args[1]]);
    } else if (op === 'integer_power') value = N.pow(coefficient(args[0]),args[1]);
    else {
      const values = args.map(coefficient);
      if (op === 'add') value = values.reduce((a,b)=>N.add(a,b),N.zero());
      else if (op === 'multiply') value = values.reduce((a,b)=>N.mul(a,b),N.one());
      else if (op === 'maximum') value = N.max(values);
      else {
        assert.equal(args.length,1);
        const operation = {inverse:'inverse',sqrt_positive:'sqrt',exp:'exp'}[op];
        assert.ok(operation,op);
        value = N[operation](values[0]);
      }
    }
  }
  cache.set(id,value);
  return value;
}
const W0 = coefficient(ledger.root);
const W0upper = closed(W0).upper;
assert.equal(N.compareEndpoints(W0upper,{rational:'0'}),1);
const WupperPoint = N.fromClosed({lower:W0upper,upper:W0upper});
const L = N.neg(N.add(hLogTau,N.mul(h,N.log(q(4)))));
const Llower = closed(L).lower;
assert.equal(N.compareEndpoints(Llower,{rational:'0'}),1);
const L0 = N.fromClosed({lower:Llower,upper:Llower});
const residual = N.add(N.log(WupperPoint),q(2));
const residualAllowance = N.div(L0,q(16));
const coefficientComparison = N.compareEndpoints(closed(residual).upper,closed(residualAllowance).lower);
// Exact degree loss: 34/2^33+2/100000 < 1/16.
assert(34n*100000n+2n*2n**33n < 2n**33n*100000n/16n);
const geometryLog = N.log(N.mul(q(672),Xb));
const geometryAllowance = N.div(L0,q(4));
const geometryComparison = N.compareEndpoints(closed(geometryLog).upper,closed(geometryAllowance).lower);
const fourA = N.add(q(2),N.mul(q(4),h));
const budgetLoss = N.add(N.mul(q(32),N.log(q(2))),
  N.add(N.mul(fourA,N.log(Xb)),N.log(fourA)));
const budgetAllowance = L0;
const budgetComparison = N.compareEndpoints(closed(budgetLoss).upper,closed(budgetAllowance).lower);
const ratioUpper = N.exp(N.mul(q('-1/2'),L0));
const ratioBelowOne = N.compareEndpoints(closed(ratioUpper).upper,{rational:'1'});
const passed = coefficientComparison<=0 && geometryComparison<=0 &&
  budgetComparison<=0 && ratioBelowOne===-1;
const result = {
  schema:'MathScope.Initialized.PrimaryWaveCoupledEnergy/1',
  status:passed?'CONDITIONAL_COMPLETE_INITIAL_PRIMARY_WAVE_WITHIN_2_POW_NEG_32_BUDGET':'OPEN_INITIAL_PRIMARY_WAVE_ENERGY_COMPARISON',
  sourceSHA256:ledger.sourceSHA256,ledgerSHA256:digest(ledgerBytes),
  registrySHA256:'657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333',
  normalization:{velocity:'U_i=tau0^A*u_i',gradient:'G_ij=tau0^(A+1/2)*partial_j u_i',
    energy:'J^2/tau0<=32Xb*(sum_i U_i^2+2sum_ij G_ij^2)',
    sourceTau0:'2^(-(ellMinimum+15))',A:'1/2+h',D:'1/2-h'},
  parameters:{h:closed(h),ellMinimum:fixed.hostedOriginal[617432],hLogTau:closed(hLogTau),Xb:closed(Xb)},
  root:ledger.root,positiveDegrees:ledger.positiveDegrees,
  coefficientAtPAndFOne:closed(W0),consumedRecords:cache.size,consumedLeaves:[...usedLeaves].sort(),
  L:closed(L),coefficientLogUpper:closed(residual).upper,coefficientAllowanceLower:closed(residualAllowance).lower,
  coefficientComparison,geometricLogUpper:closed(geometryLog).upper,
  geometricAllowanceLower:closed(geometryAllowance).lower,geometryComparison,
  reservedBudgetLogLossUpper:closed(budgetLoss).upper,budgetLossAllowanceLower:closed(budgetAllowance).lower,
  budgetComparison,ratioUpper:closed(ratioUpper).upper,ratioBelowOne,reservedForceFraction:'2^-32',
  requestedForceFraction:'2^-28',strictlyStrongerThanRequested:passed,
  bounds:{
    normalizedEveryCylindricalVelocityAndCovariantGradientEntry:'W<=exp(L/8)',
    twiceEnergyAndDissipationOverTau0:'32 Xb*(3+2*9)*W^2<=exp(L/2)',
    reservedBudgetOverTau0:'2^-32 S_R/tau0 >= exp(L)',
    ratioToReservedBudget:'J_wave^2/(2^-32 S_R)<=exp(-L/2)<1',
  },
  derivation:[
    'The fixed source curl keeps sqrt(epsilon) leading and epsilon^(1-kappa_s) remainder. k*sqrt(epsilon)<=2 and k*epsilon^(1-kappa_s)<=2 remove apparent negative phase powers in first spatial derivatives.',
    'The source potential prefactor Q^(-h)*sqrt(epsilon)/k is at most1. Outer cutoff curl and its derivative retain nonnegative tau0 powers; the explicit 20 and692 coefficients are included.',
    'All162 signed source rows and the saved common Gaussian absorption are included in W. The three full-circle mean-wave cross terms are separate, and no wave-wave cancellation is used in this upper bound.',
    'Cross-component polar connections cost at most2V1 and2A1. Their normalized32V1 and160A1 bounds are covered by64V1 and1280A1 in W. Energy uses Euclidean/Frobenius invariance under polar rotation, so the three and nine cylindrical component counts equal the Cartesian energy and dissipation counts.',
    'The exact coupled ledger is W<=W(P=F=1)*P^34*F^2. Original threshold bounds give P<=exp(L/2^33), F<=exp(1+L/100000). The checked coefficient reserve and exact degree inequality give W<=exp(L/8).',
    'The original normalized velocity and Cartesian gradient energy bound has672 Xb W^2. The checked geometry reserve bounds its logarithm byL/2.',
    'The original force-scale lower bound has logarithm2L+2h log4 minus the reserved budget loss. Its checked loss is at mostL, giving the displayed ratio.'
  ],
  assumptions:ledger.scalingPremises,
  sourcePins:{threshold:'2f72eede076eafe81098b075bcb5125a7a1fee2b17fb38617e6cf6962bee1745',
    fullSlow:'517662b18f4014644cd7539de42b82b74999374aaf34273163f39693f160bdb4',...ctx.pins},
  scope:'Only initial primary wave with the source outer-cutoff curl. Later active corrections, full N7/N8 and final67 jets remain open.',
  finalJets:0,N706:'OPEN',N805:'OPEN',release:'HOLD',arithmetic:N.report(),
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,coefficientComparison,geometryComparison,budgetComparison,
  ratioBelowOne,consumedRecords:cache.size}));
