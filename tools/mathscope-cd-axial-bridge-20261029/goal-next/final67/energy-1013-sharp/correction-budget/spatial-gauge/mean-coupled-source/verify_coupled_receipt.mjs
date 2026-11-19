/** Reopen the completed mean receipt and compare its saved directed endpoints. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [goal,runtime,historicalPath,input,output]=process.argv.slice(2);
assert.equal(process.argv.length,7);
const helper=resolve(goal,'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/evaluate_mean_bulk_energy.mjs');
assert.equal(createHash('sha256').update(await readFile(helper)).digest('hex'),
 '61d4d23e7ec003206758c861a2e464791730dc6f14b648d3b5eb721418f59f7b');
const {prepareMeanBulkEnergy}=await import(pathToFileURL(helper).href);
const {N}=await prepareMeanBulkEnergy(goal,runtime,historicalPath,resolve(goal,
 'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/weighted-velocity-coefficients.json'));
const data=await readFile(input),r=JSON.parse(data);
assert.equal(r.status,'CONDITIONAL_COMPLETE_INITIALIZED_MEAN_WITHIN_RESERVED_BUDGET');
const comparisons={
 coefficient:N.compareEndpoints(r.coefficientLogUpper,r.coefficientAllowanceLower),
 geometry:N.compareEndpoints(r.geometricLogUpper,r.geometricAllowanceLower),
 energyBelowOne:N.compareEndpoints(r.twiceEnergyAndDissipationUpperDividedByTau0,{rational:'1'}),
 budgetAboveOne:N.compareEndpoints(r.reservedBudgetLowerDividedByTau0,{rational:'1'}),
 energyBelowReservedBudget:N.compareEndpoints(r.twiceEnergyAndDissipationUpperDividedByTau0,r.reservedBudgetLowerDividedByTau0),
};
assert.deepEqual(comparisons,{coefficient:-1,geometry:-1,energyBelowOne:-1,budgetAboveOne:1,energyBelowReservedBudget:-1});
assert.equal(r.N706,'OPEN');assert.equal(r.N805,'OPEN');assert.equal(r.finalJets,0);assert.equal(r.release,'HOLD');
const result={status:'VERIFIED_REOPENED_COUPLED_MEAN_ENDPOINTS',
 receiptSHA256:createHash('sha256').update(data).digest('hex'),comparisons,
 N706:'OPEN',N805:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
