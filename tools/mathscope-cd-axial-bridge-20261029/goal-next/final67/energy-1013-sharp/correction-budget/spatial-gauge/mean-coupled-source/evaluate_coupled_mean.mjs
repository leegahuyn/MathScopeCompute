/** Absorb exact stability and radial-fast factors before numerical evaluation. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const [goal,runtime,historicalPath,ledgerPath,output]=process.argv.slice(2);
assert.equal(process.argv.length,7);
const helperPath=resolve(goal,
  'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/evaluate_mean_bulk_energy.mjs');
const helperPin='61d4d23e7ec003206758c861a2e464791730dc6f14b648d3b5eb721418f59f7b';
assert.equal(createHash('sha256').update(await readFile(helperPath)).digest('hex'),helperPin);
const {prepareMeanBulkEnergy}=await import(pathToFileURL(helperPath).href);
const context=await prepareMeanBulkEnergy(goal,runtime,historicalPath,resolve(goal,
  'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/weighted-velocity-coefficients.json'));
const {N,q,closed,load,pins,fixed,h,hLogTau,Xb,valuation}=context;
const oldPin='e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59';
const old=await load(resolve(goal,'whole-k-annular-pressure-lower/mean-path-longitudinal.json'),oldPin);
const ledgerBytes=await readFile(ledgerPath);
const ledgerPin='aa1bd4662a5bb9fa158608059d15a4bb756ed585d7d4ee9d02199fcb3a4d5076';
assert.equal(createHash('sha256').update(ledgerBytes).digest('hex'),ledgerPin);
const ledger=JSON.parse(ledgerBytes);
assert.equal(ledger.meanPathSHA256,oldPin);
assert.equal(ledger.positiveGraphSHA256,old.graphSHA256);
assert.ok(ledger.marginPositive);
assert.deepEqual(ledger.maximumPositiveDegrees,['187','6']);
const thresholdPin='2f72eede076eafe81098b075bcb5125a7a1fee2b17fb38617e6cf6962bee1745';
const thresholdAudit=await load(resolve(dirname(ledgerPath),'common-threshold-source.json'),thresholdPin);
assert.equal(thresholdAudit.verifiedFullSourceNodes,4456994);
assert.equal(thresholdAudit.sourceSHA256,old.sourceSHA256);
assert.equal(thresholdAudit.positiveGraphSHA256,old.graphSHA256);
const algebraPin='cc58a83a1011f6e2990b8510f693abd729e27bb9d17cd72641953faf97328a98';
const algebra=await load(resolve(dirname(ledgerPath),'coupled-algebra.json'),algebraPin);
assert.equal(algebra.ledgerSHA256,ledgerPin);
assert.equal(algebra.checkedLaurentRecords,3918);
const identitiesPin='36f30a23afbfdb254e392a351d322f4dfd8a4656bd1c935d25cf65994b30b6c3';
const identities=await load(resolve(goal,
  'final67/energy-1013-sharp/correction-budget/spatial-gauge/actual-mean-cutoff/mean-cutoff-source-final.json'),identitiesPin);
assert.equal(identities.sourceSHA256,old.sourceSHA256);
assert.equal(identities.verifiedFullSourceNodes,4456994);
assert.deepEqual(identities.sourceMean.completeVelocity,[3614790,3614791,3614792]);
assert.deepEqual(identities.cutoffConstants,{value:1,z:20,zz:692,radialDerivative:0});
const [background,target]=await Promise.all([
  load(resolve(goal,'whole-k-annular-wrz-norm/numerical/background-c8-complete.json'),
    '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966'),
  load(resolve(goal,'whole-k-annular-wrz-norm/target-numerical/target-c7-complete.json'),
    'b262127767b185e99041bd14f1f8dd2af6fe7d9a95736b93d9ac114914348f1a'),
]);
const leaves={'hosted-original':fixed.hostedOriginal,'fixed-radial':fixed.fixedRadial,
  'background-c8':background.backgroundC8,'target-c7':target.targetC7};
const cache=new Map(),consumedLeaves=new Set();
function coefficient(id) {
  if(cache.has(id))return cache.get(id);
  let value;
  if(id===27||id===3541)value=N.one();
  else {
    const {op,args}=old.nodes[id];
    if(op==='rational')value=q(args[0]+'/'+args[1]);
    else if(op==='authenticated_source_norm_root') {
      assert.ok(leaves[args[0]]?.[args[1]],args.join('/'));
      consumedLeaves.add(args.join('/'));
      value=N.fromClosed(leaves[args[0]][args[1]]);
    } else if(op==='integer_power')value=N.pow(coefficient(args[0]),args[1]);
    else {
      const values=args.map(coefficient);
      if(op==='add')value=values.reduce((a,b)=>N.add(a,b),N.zero());
      else if(op==='multiply')value=values.reduce((a,b)=>N.mul(a,b),N.one());
      else if(op==='maximum')value=N.max(values);
      else {
        assert.equal(args.length,1);
        const operation={inverse:'inverse',sqrt_positive:'sqrt',exp:'exp'}[op];
        assert.ok(operation,op);
        value=N[operation](values[0]);
      }
    }
  }
  cache.set(id,value);return value;
}
const rows=ledger.rows.map(row=>({...row,coefficient:closed(coefficient(row.root))}));
const coefficientUpper=N.max(rows.map(row=>N.fromClosed({
  lower:row.coefficient.upper,upper:row.coefficient.upper})));
const L=N.neg(N.add(hLogTau,N.mul(h,N.log(q(4)))));
const Llower=closed(L).lower;
assert.equal(N.compareEndpoints(Llower,{rational:'0'}),1);
const L0=N.fromClosed({lower:Llower,upper:Llower});
const [pDegree,fDegree]=ledger.maximumPositiveDegrees;
const logResidual=N.add(N.log(N.mul(q(64),coefficientUpper)),q(fDegree));
const residualAllowance=N.div(L0,q(16));
const coefficientComparison=N.compareEndpoints(closed(logResidual).upper,closed(residualAllowance).lower);
const Renv=N.fromClosed(fixed.hostedOriginal[216823]);
assert.equal(N.compareEndpoints(closed(Renv).lower,{rational:'1'}),1);
const radialComparison=N.compareEndpoints(closed(Xb).upper,closed(N.pow(Renv,2)).lower);
const geomVelocity=21n**2n+1n+1n;
const geomGradient=31n**2n+1n+1n+733n**2n+21n**2n+21n**2n+12n**2n+2n**2n;
const geometricInteger=32n*(geomVelocity+2n*geomGradient);
assert.equal(geometricInteger,34528224n);
assert.ok(geometricInteger<1n<<26n);
const geometricLog=N.add(N.mul(q(26),N.log(q(2))),N.mul(q(4),N.log(Renv)));
const geometricComparison=N.compareEndpoints(closed(geometricLog).upper,closed(N.div(L0,q(4))).lower);
const energyUpper=N.exp(N.mul(q('-3/4'),L0));
const fourA=N.add(q(2),N.mul(q(4),h));
const budget=N.mul(q('1/'+String(1n<<32n)),
  N.exp(N.sub(N.sub(N.mul(q(-2),hLogTau),N.mul(fourA,N.log(Xb))),N.log(fourA))));
const budgetAboveOne=N.compareEndpoints(closed(budget).lower,{rational:'1'});
const energyBelowOne=N.compareEndpoints(closed(energyUpper).upper,{rational:'1'});
const passed=coefficientComparison<=0&&radialComparison<=0&&geometricComparison<=0&&
  budgetAboveOne===1&&energyBelowOne===-1;
const result={
  status:passed?'CONDITIONAL_COMPLETE_INITIALIZED_MEAN_WITHIN_RESERVED_BUDGET':'OPEN_COUPLED_MEAN_ABSORPTION_TEST',
  sourceSHA256:old.sourceSHA256,oldPositiveGraphSHA256:old.graphSHA256,
  helperPin,meanPathPin:oldPin,ledgerSHA256:ledgerPin,
  sourcePins:{...pins,commonThresholdSource:thresholdPin,coupledAlgebra:algebraPin,cutoffIdentities:identitiesPin},
  rows,maximumPositiveDegrees:[pDegree,fDegree],consumedRecords:cache.size,consumedLeaves:[...consumedLeaves].sort(),
  L:closed(L),coefficientLogUpper:closed(logResidual).upper,coefficientAllowanceLower:closed(residualAllowance).lower,
  coefficientComparison,radialComparison,geometricInteger:String(geometricInteger),
  geometricLogUpper:closed(geometricLog).upper,geometricAllowanceLower:closed(N.div(L0,q(4))).lower,geometricComparison,
  normalizedMeanCommonUpper:'exp(-L/2)',
  twiceEnergyAndDissipationUpperDividedByTau0:closed(energyUpper).upper,
  reservedBudgetLowerDividedByTau0:closed(budget).lower,
  energyBelowOne,budgetAboveOne,reservedForceFraction:'2^-32',
  reasoning:[
    'P=exp(3 Bnorm^256 Lmax), ellMinimum>=Bnorm^512 and ellMinimum>=(64/h)^2 give P<=exp(L/2^33).',
    'F=exp(kappa_s*h*(ellMinimum+17)*log2)<=exp(1+kappa_s*L).',
    'The exact Laurent ledger bounds each original positive mean root by coefficient*P^p*F^f.',
    'The source epsilon gain and the checked exact degree margin leave every normalized mean value/first derivative <=exp(-L/2).',
    'The complete source cutoff curl has geometric coefficient <=2^26 Renv^4, absorbed into exp(L/4).',
    'Its complete mean energy upper is <=exp(-3L/4)<1, below the reserved source force fraction.'
  ],
  assumptions:[...valuation.proofDependencies,...identities.assumptions,
    'the source-pinned radial-characteristic potential envelope holds uniformly along the whole admitted reference characteristic',
    'positive original source norms and inverse denominators in the Laurent coefficient induction',
    'the original positive Laurent coefficient arithmetic and source norm interpretation'],
  scope:'Complete initialized mean contribution only. The slow background, initial primary wave, active later corrections and whole N7/N8 acceptance remain separate.',
  N706:'OPEN',N805:'OPEN',finalJets:0,release:'HOLD',arithmetic:N.report(),
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,coefficientComparison,radialComparison,geometricComparison,
  energyBelowOne,budgetAboveOne,consumedRecords:cache.size}));
