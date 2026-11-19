/** Same original slow envelopes, with physical tau powers collected before evaluation. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [goal,runtime,historicalPath,ledgerPath,output]=process.argv.slice(2);
assert.equal(process.argv.length,7);
const helper=resolve(goal,'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/evaluate_mean_bulk_energy.mjs');
assert.equal(createHash('sha256').update(await readFile(helper)).digest('hex'),
 '61d4d23e7ec003206758c861a2e464791730dc6f14b648d3b5eb721418f59f7b');
const {prepareMeanBulkEnergy}=await import(pathToFileURL(helper).href);
const {N,q,closed,load,h,hLogTau,Xb,pins}=await prepareMeanBulkEnergy(goal,runtime,historicalPath,resolve(goal,
 'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/weighted-velocity-coefficients.json'));
const numericalPin='6c8ad3386dfc2d5e392368a4884eacbd2088531821edb37f3a4c471f729410fc';
const slow=await load(resolve(goal,'whole-k-annular-slow/annular-slow-numerical-intervals.json'),numericalPin);
const ledgerBytes=await readFile(ledgerPath),ledger=JSON.parse(ledgerBytes);
const ledgerPin='390feae633688fbc21140885501a8d06066bb717be55acdbc17bb5cba0a0ab65';
assert.equal(createHash('sha256').update(ledgerBytes).digest('hex'),ledgerPin);
assert.equal(ledger.status,'VERIFIED_ORIGINAL_SLOW_SPATIAL_ENERGY_TAU_POWER_LEDGER');
assert.equal(ledger.slowBoundsSHA256,'3e3bd5d76fcdac202d2d4da51ca490ddc8dd5d020c1a57aed6a2ecd7985a3a69');
assert.equal(ledger.localizationPolynomialSHA256,'1f02933c4a09f96efca99188fba2731526df81459deb1deb3c249433b73295f7');
const Rstar=N.fromClosed(slow.factors.Rstar.interval);
assert.equal(N.compareEndpoints(closed(Rstar).lower,{rational:'1'}),1);
assert.equal(N.compareEndpoints(closed(hLogTau).upper,{rational:'0'}),-1);
const radialComparison=N.compareEndpoints(closed(N.mul(q(2),N.sqrt(Xb))).upper,closed(Rstar).lower);
assert.ok(radialComparison<=0);
const algebraPin='19b6013b104d52c3afdc69dcb3806ad3e391c4595564b446d7f36836461f5c2f';
const algebra=await load(resolve(ledgerPath,'../slow-energy-algebra.json'),algebraPin);
assert.equal(algebra.ledgerSHA256,ledgerPin);assert.equal(algebra.checkedContributions,360);
const identityPin='36f30a23afbfdb254e392a351d322f4dfd8a4656bd1c935d25cf65994b30b6c3';
const identities=await load(resolve(goal,
 'final67/energy-1013-sharp/correction-budget/spatial-gauge/actual-mean-cutoff/mean-cutoff-source-final.json'),identityPin);
assert.deepEqual(identities.cutoffConstants,{value:1,z:20,zz:692,radialDerivative:0});
const factors=new Map([['1',N.one()],...Object.entries(slow.factors).map(([name,r])=>[name,N.fromClosed(r.interval)])]);
factors.set('L_F^2',N.pow(factors.get('L_F'),2));
const sums=new Map();
for(const row of ledger.rows){
 assert.ok(factors.has(row.factor));assert.ok(Number.isSafeInteger(row.RstarPower));
 const term=N.mul(q(row.coefficient),N.mul(N.pow(Rstar,row.RstarPower),factors.get(row.factor)));
 sums.set(row.component,N.add(sums.get(row.component)??N.zero(),term));
}
const velocity=Array.from({length:3},(_,i)=>sums.get('velocity/'+i)??N.zero());
const gradient=Array.from({length:9},(_,i)=>sums.get('gradient/'+i)??N.zero());
const sum=xs=>xs.reduce((a,b)=>N.add(a,b),N.zero());
const energy=N.mul(N.mul(q(32),Xb),N.add(sum(velocity.map(x=>N.pow(x,2))),N.mul(q(2),sum(gradient.map(x=>N.pow(x,2))))));
const fourA=N.add(q(2),N.mul(q(4),h));
const budget=N.mul(q('1/'+String(1n<<28n)),N.exp(N.sub(N.sub(N.mul(q(-2),hLogTau),N.mul(fourA,N.log(Xb))),N.log(fourA))));
const comparison=N.compareEndpoints(closed(energy).upper,closed(budget).lower);
assert.notEqual(comparison,null);
const result={status:comparison<=0?'CONDITIONAL_COMPLETE_LOCALIZED_SLOW_WITHIN_RESERVED_BUDGET':'OPEN_SLOW_TAU_FACTORED_BUDGET',
 sourcePins:{...pins,numericalSlow:numericalPin,slowBounds:ledger.slowBoundsSHA256,polynomial:ledger.localizationPolynomialSHA256,
 ledger:ledgerPin,algebra:algebraPin,outerCutoffSource:identityPin},
 comparison,radialComparison,reservedForceFraction:'2^-28',sourceRows:ledger.rows.length,
 normalizedVelocityUpper:velocity.map(x=>closed(x).upper),normalizedGradientUpper:gradient.map(x=>closed(x).upper),
 twiceEnergyAndDissipationUpperDividedByTau0:closed(energy).upper,reservedBudgetLowerDividedByTau0:closed(budget).lower,
 assumptions:['existing original source slow scalar/atom envelopes and physical inverse operator transfer',
 'the original enlarged source box and whole-K annular chart; fixed labels and original cutoff supports',
 '0<h<1/64,0<tau0<1; radial cutoff is flat and the pinned outer axial derivatives apply',
 'exact forward physical tau-power collection in the accompanying independently replayable ledger'],
 scope:'Complete localized original slow background including spatial cutoff derivatives. Initialized mean, primary wave and later corrections remain separate.',
 N706:'OPEN',N805:'OPEN',finalJets:0,release:'HOLD',arithmetic:N.report()};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,comparison,rows:ledger.rows.length}));
