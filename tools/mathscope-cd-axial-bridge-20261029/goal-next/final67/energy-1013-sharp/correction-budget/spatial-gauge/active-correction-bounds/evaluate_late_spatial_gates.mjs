/** Compare the improved sufficient gate with the saved coarse candidate endpoint. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [goal,runtime,historicalPath,gatePath,output]=process.argv.slice(2);
assert.equal(process.argv.length,7);
const helper=resolve(goal,'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/evaluate_mean_bulk_energy.mjs');
assert.equal(createHash('sha256').update(await readFile(helper)).digest('hex'),
 '61d4d23e7ec003206758c861a2e464791730dc6f14b648d3b5eb721418f59f7b');
const {prepareMeanBulkEnergy}=await import(pathToFileURL(helper).href);
const {N,q,closed,load,hLogTau,Xb,pins}=await prepareMeanBulkEnergy(goal,runtime,historicalPath,resolve(goal,
 'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/weighted-velocity-coefficients.json'));
const gateBytes=await readFile(gatePath);
const gatePin='1fa33500726728505f74ed51aae5e113f4c10c452c5faa7a4f823d5a6d2d6a36';
assert.equal(createHash('sha256').update(gateBytes).digest('hex'),gatePin);
const gate=JSON.parse(gateBytes);
assert.equal(gate.status,'VERIFIED_SOURCE_BINDERS_AND_EXACT_CONDITIONAL_LATE_SPATIAL_GATE');
assert.equal(gate.energyIntegerUpper,789303688704);
assert.equal(gate.comparisonWithExistingGate.exactAdmissibleAmplitudeMultiplier,8);
const Kpin='0e1984e6f872e9a167b7920d31a55b4888a807c359a0c38dbff9f8f8af5f4acb';
const coarse=await load(resolve(goal,'primary-forced-join/active-n3-c5-binding/norm-leading/n3-whole-k.json'),Kpin);
assert.equal(N.compareEndpoints(closed(Xb).lower,{rational:'1'}),1);
const rows=[1,2,3,4].map(j=>{
 const gain=N.exp(N.mul(q('-'+j+'/10'),hLogTau));
 const base=N.mul(N.pow(Xb,-2),gain);
 const original=N.mul(q('1/'+String(1n<<36n)),base);
 const improved=N.mul(q('1/'+String(1n<<33n)),base);
 const lower=closed(improved).lower;
 const coarseComparison=N.compareEndpoints(coarse.enclosure.upper,lower);
 assert.notEqual(coarseComparison,null);
 assert.equal(N.compareEndpoints(lower,{rational:'1'}),1);
 return {stage:j,oldSufficientThreshold:closed(original),newSufficientThreshold:closed(improved),
   exactThresholdMultiplier:8,oldAndNewRoundedLowerComparison:N.compareEndpoints(closed(original).lower,lower),
   coarseCandidateUpperComparison:coarseComparison,coarseCandidateUpperFits:coarseComparison<=0,
   actualStageK:null,actualStageBoundVerified:false};
});
const result={status:'DIRECTED_IMPROVED_LATE_GATE_WITHOUT_ACTUAL_STAGE_AMPLITUDE_ENDPOINTS',
 sourcePins:{...pins,gate:gatePin,coarseCandidateK:Kpin},
 rows,coarseCandidateUpper:coarse.enclosure.upper,hLogTau:closed(hLogTau),Xb:closed(Xb),
 actualStageBoundsVerified:0,
 scope:'The exact admissible amplitude grows by8 in the same Xb geometry. Existing coarse upper endpoints still fail the numerical majorant test. They are not evaluated actual complete K_j values and do not refute the actual inequalities.',
 firstMissingInput:gate.missingPrimitive,N706:'OPEN',N805:'OPEN',finalJets:0,release:'HOLD',arithmetic:N.report()};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(rows.map(row=>({j:row.stage,coarseComparison:row.coarseCandidateUpperComparison,
 oldNewRounded:row.oldAndNewRoundedLowerComparison}))));
