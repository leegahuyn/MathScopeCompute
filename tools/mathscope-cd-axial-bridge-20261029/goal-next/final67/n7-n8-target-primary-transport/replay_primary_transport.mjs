/** Original Primary recurrence with external original-target bounds. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [goalPath,sourceRuntime,numericRuntime,targetReceiptFile,outFile]=process.argv.slice(2);
assert(goalPath&&sourceRuntime&&numericRuntime&&targetReceiptFile&&outFile);
const sha=b=>createHash('sha256').update(b).digest('hex'),goal=resolve(goalPath);
const sourcePins={
 'research-ide/mathscope-m3/navier/source-primary-class-majorants.mjs':'40b3f1220b7ad1b9b05a11ae1378c864351e77e8efe7134ae1b78921fbab47ea',
 'research-ide/mathscope-m2/navier/actual-global-wave-bound-kernel.mjs':'aed60d154195d07b38e2b7fa3005a1b792cc6e8c8867a91008fecec2d33ca6b9',
 'research-ide/mathscope-m2/navier/actual-all-order-gaussian-jet-kernel.mjs':'5de9d043e77bc511e2e117bc825c42d60375193f617a78724ae535f0127415f6'};
for(const [file,pin]of Object.entries(sourcePins))assert.equal(sha(await readFile(resolve(sourceRuntime,file))),pin,file);
const modulePath=resolve(sourceRuntime,'research-ide/mathscope-m3/navier/source-primary-class-majorants.mjs');
const {originalPrimaryClassDegreeProgram}=await import(pathToFileURL(modulePath).href);
const targetBytes=await readFile(targetReceiptFile);
assert.equal(sha(targetBytes),'75b0bb821dc1a486ced5d88176faffe63645d73534366f11bd1708d39377e25f');
const target=JSON.parse(targetBytes);
const arithmeticFile=resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs');
assert.equal(sha(await readFile(arithmeticFile)),'4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47');
const thresholdBytes=await readFile(resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'));
assert.equal(sha(thresholdBytes),'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const {sourceArithmetic}=await import(pathToFileURL(arithmeticFile).href);
const {N}=await sourceArithmetic(numericRuntime,JSON.parse(thresholdBytes).sourcePins,'coarse-upper');
const closedPins={3:'7d58e4e643ec0938332cc8dd7fdc7befcb034b49c1b2553044985b3ee3df079a',4:'c8d7fcb356f3c4637dac8005b07fd87c03513d2b2d7c6ec867404608778d635f'};
const primitive=[];
for(const prefix of [3,4]){
 const file=resolve(goal,'primary-forced-join/active-n3-c5-binding/norm-leading/n'+prefix+'-closed.json');
 const bytes=await readFile(file);assert.equal(sha(bytes),closedPins[prefix]);
 const receipt=JSON.parse(bytes);assert.equal(receipt.status,'DIRECTED_CLOSED_K_OPERANDS');assert.equal(receipt.prefix,prefix);
 const named=Object.fromEntries(['W','dstar','cy'].map(name=>{const row=receipt.ready.find(r=>r.name===name);assert(row);return [name,row];}));
 for(const row of Object.values(named))assert.equal(N.compareEndpoints(row.enclosure.lower,{rational:'0'}),1);
 primitive.push({prefix,receiptSHA256:sha(bytes),frontierSHA256:receipt.frontierSHA256,originalIntegralBoundaryIds:receipt.originalIntegralBoundaryIds,rows:named,
  extended:{W9:N.toClosed(N.pow(N.fromClosed(named.W.enclosure),9)),W10:N.toClosed(N.pow(N.fromClosed(named.W.enclosure),10)),
   inverseDstar:N.toClosed(N.inverse(N.fromClosed(named.dstar.enclosure))),inverseSqrtCy:N.toClosed(N.inverse(N.sqrt(N.fromClosed(named.cy.enclosure))))}});
}
assert.deepEqual(primitive[0].extended,primitive[1].extended);
const lowerTargetPins={3:'6d35cadb59f7b24b18948608d958a0d4e9e244da48546a7acd5308694c06a759',4:'231f2e075627a7d027b7c36714f6852c609c8b7eeb6894fa81901ebf698ba8aa'};
const lowerTarget=[];
for(const prefix of [3,4]){
 const path='primary-forced-join/active-n3-c5-binding/norm-leading/weighted-target/'+(prefix===3?'n3-weighted-target-directed.json':'n4-replay/n4-weighted-target-directed.json');
 const bytes=await readFile(resolve(goal,path));assert.equal(sha(bytes),lowerTargetPins[prefix]);
 const r=JSON.parse(bytes);assert.equal(r.status,'DIRECTED_CONDITIONAL_N0_TO_N6');
 assert.deepEqual(r.leaves,{target:168,'slow-chart':1148,'archived-integral':3});
 assert.equal(r.sourcePins.frontier,primitive.find(r=>r.prefix===prefix).frontierSHA256);
 assert.deepEqual(r.rows.map(x=>x.order),[0,1,2,3,4,5,6]);
 lowerTarget.push({prefix,receiptSHA256:sha(bytes),sourcePins:r.sourcePins,rows:r.rows});
}
assert.deepEqual(lowerTarget[0].rows.map(r=>r.enclosure),lowerTarget[1].rows.map(r=>r.enclosure));
const transfers=[];
for(const outputOrder of [6,7]){
 const targetOrder=outputOrder+1,row=target.rows.find(r=>r.order===targetOrder),pole=row.pole;
 const standard=originalPrimaryClassDegreeProgram({order:outputOrder,maxWork:500000});
 const external=originalPrimaryClassDegreeProgram({order:outputOrder,maxWork:500000,targetPoles:Array(outputOrder+2).fill(pole)});
 assert.equal(external.weighted.pass,true);assert.equal(external.allMixedProductsRetained,true);
 assert.equal(external.derivativeOrders.background,outputOrder+3);
 assert.equal(external.weighted.targetPoles.length,outputOrder+2);
 const fields=p=>({amplitude:p.weighted.amplitude,potential:p.weighted.potential,curlRemainder:p.weighted.curl,
  pressure:p.pressure,primaryCovariance:p.primaryCovariance,covarianceRemainder:p.covarianceRemainder});
 const old=fields(standard),fresh=fields(external);
 for(const name of Object.keys(old))for(let j=0;j<old[name].length;j++){
  assert.equal(old[name][j].power,fresh[name][j].power);
  assert(old[name][j].pole<=fresh[name][j].pole);
 }
 const final=Object.fromEntries(Object.entries(fresh).map(([name,rows])=>[name,rows[outputOrder]]));
 const hybrid=originalPrimaryClassDegreeProgram({order:outputOrder,maxWork:500000,targetPoles:Array.from({length:outputOrder+2},(_,j)=>3+3*j)});
 assert.deepEqual(hybrid,standard);
 const targetConstants=[...lowerTarget[0].rows.map(r=>({order:r.order,pole:3+3*r.order,source:'archived-actual-native-target-constant',enclosure:r.enclosure})),
  ...target.rows.filter(r=>r.order<=targetOrder).map(r=>({order:r.order,pole:r.pole,source:'external-original-target-pointwise',enclosure:r.enclosure}))];
 assert.deepEqual(targetConstants.map(r=>r.order),Array.from({length:targetOrder+1},(_,j)=>j));
 const hybridTargetMaximum=N.toClosed(N.max(targetConstants.map(r=>N.fromClosed(r.enclosure))));
 transfers.push({outputOrder,targetOrder,targetSourcePole:pole,targetPoles:external.weighted.targetPoles,
  requiredBackgroundOrder:external.derivativeOrders.background,requiredCutoffMapOrder:outputOrder+2,
  sourceBoundTargetUpper:row.enclosure,originalExponents:external.exponents,finalDegrees:final,
  pureProgram:external,
  sharperHybridTransfer:{targetConstants,targetMaximum:hybridTargetMaximum,targetPoles:hybrid.weighted.targetPoles,
   exactOriginalDegreeProgramUnchanged:true,finalDegrees:Object.fromEntries(Object.entries(fields(hybrid)).map(([name,rows])=>[name,rows[outputOrder]])),
   program:hybrid,premise:'The archived actual N0..N6 constants bound the SAME original target on the SAME source family/domain; their original independent analytic and source-family premises are retained. Append only the external order7/order8 bounds with poles24/27. Reapply the source recurrence; do not replace any sealed target field.'},
  transfer:'Reapply this same source finite recurrence with a fresh common base dominating the same original primitive constants, required background and cutoff/map bounds, and N_external. Do not substitute for or upper-bound the native N root.',
  implementationBoundary:'attachGlobalPrimaryClassOperator requires the original private target object and reads target.rows.N_m; this external analytic transfer cannot pass its existing seal without a separately proved adapter.',
  actualCurrentOrFamilyModified:false,nativeNormRootsEvaluated:false});
}
const result={schema:'MathScope.OriginalPrimaryExternalTargetTransfer/1',status:'PASS_EXACT_ORIGINAL_RECURRENCE_EXTERNAL_TARGET_TRANSPORT_CONDITIONAL_REMAINING_PRIMITIVES',
 sourcePins,targetReceiptSHA256:sha(targetBytes),primitiveDirectedAlready:primitive,lowerTargetAlreadyDirected:lowerTarget,transfers,arithmetic:N.report(),
 theorem:'For the same original field/family, under the original homogeneous mixed Gaussian, determinant/positive-weight, cutoff/chart and background hypotheses, replacing only the target derivative premise by its authenticated external pointwise bound and explicit uniform pole inventory yields the original recurrence conclusions with fresh Khat. This is a new external sufficient bound, never an upper bound on the existing native K or N roots.',
 commonBase:'Khat=max(2^128,B_(m+1),W^(m+3),dstar^-1,cy^-1/2,Haar,Ccoeff_(m+2),N_external). All factors must refer to the same source family and the domain used by the original paths.',
 exactMissing:['Actual same-family external-target certificate/adapter: native target seal cannot be satisfied by replacing numeric fields.','For output6, source-valid B7/backgroundC9 plus cutoff/map through8 over the original live, frozen and path domains.','For output7, source-valid B8/backgroundC10 plus cutoff/map through9 over those same domains.','Actual primitive association and stability/positive cone hypotheses for the selected current; existing directed W,dstar,cy values do not by themselves rebind a changed local background proof.'],
 scope:{pureFiniteRecurrenceExecuted:true,WdstarCyAlreadyDirected:true,physicalHOrYJetsDirectlyEvaluated:false,newActualClassCertified:false,nativeKOrNReplaced:false,finalJets:'0/67',release:'HOLD'}};
await writeFile(outFile,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,transfer:transfers.map(t=>({outputOrder:t.outputOrder,targetOrder:t.targetOrder,background:t.requiredBackgroundOrder,cutoffMap:t.requiredCutoffMapOrder,pole:t.targetSourcePole,finalDegrees:t.finalDegrees})),primitiveNumericPrefixes:[3,4]}));
