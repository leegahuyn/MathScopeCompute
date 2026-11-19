/** Reopen directed slow energy endpoints without reading their prior decision. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [goal,runtime,historicalPath,input,output]=process.argv.slice(2);
assert.equal(process.argv.length,7);
const helper=resolve(goal,'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/evaluate_mean_bulk_energy.mjs');
assert.equal(createHash('sha256').update(await readFile(helper)).digest('hex'),
 '61d4d23e7ec003206758c861a2e464791730dc6f14b648d3b5eb721418f59f7b');
const {prepareMeanBulkEnergy}=await import(pathToFileURL(helper).href);
const {N}=await prepareMeanBulkEnergy(goal,runtime,historicalPath,resolve(goal,
 'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/weighted-velocity-coefficients.json'));
const bytes=await readFile(input),r=JSON.parse(bytes);
const comparison=N.compareEndpoints(r.twiceEnergyAndDissipationUpperDividedByTau0,r.reservedBudgetLowerDividedByTau0);
assert.equal(comparison,-1);assert.equal(r.reservedForceFraction,'2^-28');
assert.equal(r.N706,'OPEN');assert.equal(r.N805,'OPEN');assert.equal(r.finalJets,0);assert.equal(r.release,'HOLD');
const result={status:'VERIFIED_REOPENED_LOCALIZED_SLOW_ENERGY_ENDPOINTS',comparison,
 receiptSHA256:createHash('sha256').update(bytes).digest('hex'),reservedForceFraction:'2^-28',
 N706:'OPEN',N805:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
