import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as M from './matrix.mjs';
import {GROUP_DATA,createGroup,availableGroups,verifyGroup,inner,fromCoordinates,groupElementResidual,groupDescriptor,selectEmbedding} from './groups.mjs';
import {verifyExactTable} from './exact.mjs';
import {getExamples,runJob,validateRequest,sha256,createField,createStateFamily} from './index.mjs';
import {evaluateField,evaluateJet,verifyFieldAt,verifyCoordinateCurvature,verifyPeriodicSeam,verifyDensityQuadrature,bpstMarginal,bpstBallMass,curvatureFromJet,gaugeAt,normalizeFieldGauge} from './fields.mjs';
import {wilsonLoop,pathHolonomy,plaquettePath} from './holonomy.mjs';
import {finiteSpectralModel} from './family.mjs';
import {validate,canonicalStringify} from '../../mathscope-m0/contracts.mjs';
const records=[];let failures=0;
async function check(id,scope,fn){try{const evidence=await fn();records.push({id,scope,status:'PASS',evidence:evidence??{}});console.log('PASS',id);}catch(e){failures++;records.push({id,scope,status:'FAIL',message:e.stack});console.error('FAIL',id,e.stack);}}
const ex=id=>structuredClone(getExamples().find(e=>e.id===id).request);
const near=(a,b,t=1e-10)=>assert(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b} (relative ${t})`);

await check('exact-group-data-integrity','Y1-02,Y1-03,Y1-04,Y1-06,Y1-07',async()=>{
 const evidence=[];
 for(const d of GROUP_DATA){const {dataSha256,...payload}=d;assert.equal(await sha256(payload),dataSha256);assert.equal(d.rootDatum.roots.length+d.rank,d.dimension);
  for(let i=0;i<d.rank;i++)for(let j=0;j<d.rank;j++)assert.equal(d.rootDatum.simpleCorootCocharacters[i].reduce((s,v,k)=>s+v*d.rootDatum.simpleRootCharacters[j][k],0),d.rootDatum.cartan[i][j]);
  for(const root of d.rootDatum.roots){assert.equal(root.character.reduce((s,v,j)=>s+v*root.cocharacter[j],0),2);assert(M.rationalNumber(root.lengthSquared)>0&&M.rationalNumber(root.lengthSquared)<=2);}
  assert.equal(Math.max(...d.rootDatum.roots.map(r=>M.rationalNumber(r.lengthSquared))),2);
  assert(d.certificate.gramPositiveLDL.every(x=>M.rationalNumber(x)>0));assert.equal(d.chevalley.fullBasisCount,d.dimension);assert(d.chevalley.structureConstants.every(row=>Number.isSafeInteger(row[3])));
  evidence.push({group:d.id,dimension:d.dimension,dataSha256,rootCount:d.rootDatum.roots.length,exactJacobiTriples:d.certificate.jacobiFullOrderedTriples,chevalleyBasisCount:d.chevalley.fullBasisCount});
 }
 return evidence;
});
await check('all-compact-matrix-regressions','Y1-03,Y1-05,Y1-06,Y1-08',()=>availableGroups().map(item=>{
 const g=createGroup(item.spec),v=verifyGroup(g,{exact:true,tolerance:1e-10});assert(v.ok);const a=fromCoordinates(g,Array.from({length:g.dimension},(_,i)=>.13*Math.cos(i+1))),b=fromCoordinates(g,Array.from({length:g.dimension},(_,i)=>.17*Math.sin(2*i+1))),u=M.exponential(a),w=M.exponential(b);const closure=groupElementResidual(g,M.multiply(u,w));assert(closure.max<1e-10);near(inner(g,M.commutator(a,b),a),inner(g,a,M.commutator(b,a)),1e-12);
 return {group:g.id,...v,productMembership:closure};
}));
await check('corrupt-exact-bracket-rejected','Y1-03,I3-02',()=>{
 const bad=verifyExactTable(GROUP_DATA.find(d=>d.id==='SU3'),{corrupt:true});assert.equal(bad.ok,false);return bad;
});
await check('global-form-and-kernel-distinguished','Y1-01,Y1-05,Y2-02',()=>{
 const su=createGroup({family:'SU',parameter:2,globalForm:'SIMPLY_CONNECTED',representation:'DEFINING'}),so=createGroup({family:'SO',parameter:3,globalForm:'ADJOINT',representation:'DEFINING'}),g2=createGroup({family:'G2',parameter:2,globalForm:'ADJOINT',representation:'REAL_7'});assert.equal(su.dimension,so.dimension);
 const suCentral=M.exponential(M.scale(su.embedding[0],2*Math.PI)),soCentral=M.exponential(M.scale(so.embedding[0],2*Math.PI)),g2Central=M.exponential(M.scale(g2.embedding[0],2*Math.PI));assert(M.distance(suCentral,M.identity(2))>2);assert(M.distance(soCentral,M.identity(3))<1e-10);assert(M.distance(g2Central,M.identity(7))>3);
 const expected=[[su,'{1}'],[so,'{+1, -1}']];for(const [g,k] of expected)assert.equal(groupDescriptor(g).globalForm.kernel,k);
 return {sameLieAlgebraDimension:3,SU2minusOneIdentityDistance:M.distance(suCentral,M.identity(2)),SO3coverMinusOneIdentityDistance:M.distance(soCentral,M.identity(3)),G2embeddedMinusOneIdentityDistance:M.distance(g2Central,M.identity(7)),SU2:groupDescriptor(su),SO3:groupDescriptor(so)};
});
await check('supported-bounds-and-global-form-rejections','Y1-01,Y1-05,Y1-07',()=>{
 const cases=[{family:'SO',parameter:4,globalForm:'QUOTIENT',representation:'DEFINING'},{family:'SU',parameter:7,globalForm:'SIMPLY_CONNECTED',representation:'DEFINING'},{family:'Sp',parameter:4,globalForm:'SIMPLY_CONNECTED',representation:'DEFINING'},{family:'Spin',parameter:7,globalForm:'SIMPLY_CONNECTED',representation:'DEFINING'},{family:'F4',parameter:4,globalForm:'ADJOINT',representation:'DEFINING'},{family:'E8',parameter:8,globalForm:'ADJOINT',representation:'DEFINING'},{family:'SU',parameter:2,globalForm:'ADJOINT',representation:'DEFINING'},{family:'G2',parameter:2,globalForm:'ADJOINT',representation:'DEFINING'}];
 return cases.map(group=>{const v=validateRequest({kind:'gauge.group',input:{group}});assert.equal(v.ok,false);return {group,errors:v.errors};});
});
await check('all-group-bpst-and-full-color-fields','Y2-02,Y2-04,Y2-05,Y2-06,Y2-07,I1-07',()=>{
 const reference=ex('su3-bpst').input.field,trial=ex('g2-full-color').input.field,evidence=[];
 for(const item of availableGroups()){
  const g=createGroup(item.spec),f=createField(g,reference),b=verifyFieldAt(f,[.2,-.3,.4,.1]);assert(b.bpstReference.curvatureResidual<1e-12);assert(b.equations.relativeYangMills<1e-11);assert(b.equations.relativeBianchi<1e-11);assert(b.finiteDifference.halfStepError<b.finiteDifference.error*.26);assert(b.gauge.curvatureCovariance<1e-11);
  const p=createField(g,trial),v=verifyFieldAt(p,[.2,-.3,.4,.1]),coordinates=verifyCoordinateCurvature(p,[.2,-.3,.4,.1]);assert(coordinates.connectionResidual<1e-12&&coordinates.curvatureResidual<1e-11);assert.equal(coordinates.activeCoefficientDirections.length,g.dimension);assert(v.equations.yangMillsFrobenius>1e-3);assert(v.equations.relativeBianchi<1e-11);assert(v.gauge.curvatureCovariance<1e-10);assert(v.gauge.actionDensityDifference<1e-9);assert(v.finiteDifference.halfStepError<v.finiteDifference.error*.26);
  evidence.push({group:g.id,bpst:b,fullBasis:{...v,coordinates}});
 }
 return evidence;
});
await check('embedding-index-one-versus-three','Y2-02,Y2-03,Y2-04,I1-07',async()=>{
 const req=ex('g2-marginal'),g=createGroup(req.input.group),f1=createField(g,req.input.field),s3={...req.input.field,embedding:'short-root-su2'},f3=createField(g,s3),x=[.2,-.3,.4,.1];assert.equal(f3.group.index,3);for(let i=0;i<3;i++){assert(M.distance(M.commutator(f3.group.embedding[i],f3.group.embedding[(i+1)%3]),f3.group.embedding[(i+2)%3])<1e-12);for(let j=0;j<3;j++)near(inner(f3.group,f3.group.embedding[i],f3.group.embedding[j]),i===j?1.5:0);}
 const d1=evaluateField(f1,x).density,d3=evaluateField(f3,x).density;near(d3.topologicalDensity,3*d1.topologicalDensity);near(d3.actionDensity,3*d1.actionDensity);const q=verifyDensityQuadrature(f3,{panels:256});assert(q.totalCharge.absoluteError<1e-9);assert(q.marginal.absoluteError<1e-11);
 const a=await createStateFamily(g,req.input.field,req.input.family),b=await createStateFamily(g,s3,req.input.family);assert.notEqual(a.physicalFieldHash,b.physicalFieldHash);
 return {firstIndex:1,secondIndex:3,densityRatio:d3.topologicalDensity/d1.topologicalDensity,quadrature:q,hashChanged:true,formalScope:'Index 3 is exact-rational generator checked; the shipped Lean metric fixture is the index 1 embedding.'};
});
await check('independent-density-normalization-and-window-tail','Y2-01,Y2-04,I1-07',async()=>{
 const r=await runJob(ex('su3-bpst'));assert(r.densityQuadrature.totalCharge.absoluteError<1e-9);assert(r.densityQuadrature.marginal.absoluteError<1e-11);near(r.topology.chargeOnR4,1);near(r.topology.actionOnR4,8*Math.PI**2);assert(r.topology.windowTail.omittedChargeUpperBound>0);assert(r.topology.windowTail.omittedChargeUpperBound<.02);
 const f=createField(createGroup(r.normalizedGroupInput),r.fieldSpec);near(bpstBallMass(f.group,1,1),.5);near(bpstBallMass(f.group,1,0),0);
 return {quadrature:r.densityQuadrature,windowTail:r.topology.windowTail,halfChargeInsideRho:true};
});
await check('periodic-boundary-and-global-gauge','Y2-01,Y2-07',()=>{
 const req=ex('so3-periodic'),g=createGroup(req.input.group),f=createField(g,req.input.field),x=[.2,-.3,.4,.1],seam=verifyPeriodicSeam(f,x),gauge=verifyFieldAt(f,x).gauge;
 assert(seam.connectionResidual<1e-11&&seam.curvatureResidual<1e-11);assert(gauge.curvatureCovariance<1e-10);
 const omega=gaugeAt(f,x,gauge.spec).u;let omegaSeam=0;for(let j=0;j<4;j++){const xp=x.slice();xp[j]+=f.spec.domain.periods[j];omegaSeam=Math.max(omegaSeam,M.distance(omega,gaugeAt(f,xp,gauge.spec).u));}assert(omegaSeam<1e-11);
 assert.throws(()=>normalizeFieldGauge(g,f.spec,{generator:0,wave:[.3,.2,.1,.4],amplitude:.4,phase:0}),e=>e.code==='GAUGE_NOT_PERIODIC');
 const wrong=ex('su3-bpst');wrong.input.field.domain=req.input.field.domain;assert.equal(validateRequest(wrong).ok,false);
 return {seam,periodicGaugeCovariance:gauge,omegaSeam,nonperiodicGaugeRejected:true,naivePeriodicBPSTRejected:true};
});
await check('four-delta-roles-and-physical-hashes','I0-04,Y2-08',async()=>{
 const evidence=[];for(const mode of ['assumed_bound','units','classical_scale','effective_model']){
  const r=await runJob(ex('delta-'+mode)),physical=new Set(r.comparison.map(x=>x.physicalFieldHash)),display=new Set(r.comparison.map(x=>x.displayHash)),assumptions=new Set(r.comparison.map(x=>x.assumptionHash));assert.equal(physical.size,['assumed_bound','units'].includes(mode)?1:3);assert.equal(assumptions.size,3);assert.equal(display.size,mode==='assumed_bound'?1:3);
  evidence.push({mode,physicalHashCount:physical.size,displayHashCount:display.size,assumptionHashCount:assumptions.size,comparison:r.comparison,stateMeaning:r.stateMeaning});
 }return evidence;
});
await check('dilation-density-units-q4-q3','I0-04,Y2-03',async()=>{
 const req=ex('su3-bpst'),g=createGroup(req.input.group),base=req.input.field;const s1=await createStateFamily(g,base,{...req.input.family,mode:'CLASSICAL_SCALE',delta:1}),s2=await createStateFamily(g,base,{...req.input.family,mode:'CLASSICAL_SCALE',delta:2});const q1=evaluateField(s1.field,[0,0,0,0]).density.topologicalDensity,q2=evaluateField(s2.field,[0,0,0,0]).density.topologicalDensity,m1=bpstMarginal(g,s1.fieldSpec.rho,[0,0,0]),m2=bpstMarginal(g,s2.fieldSpec.rho,[0,0,0]);near(q2/q1,16);near(m2/m1,8);
 const u1=await createStateFamily(g,base,{...req.input.family,mode:'UNITS',delta:1}),u2=await createStateFamily(g,base,{...req.input.family,mode:'UNITS',delta:2});assert.equal(u1.physicalFieldHash,u2.physicalFieldHash);near(u2.displayTransform.q4Scale,16);near(u2.displayTransform.q3Scale,8);near(u2.displayTransform.coordinateScale,.5);
 return {classicalDilationQ4Ratio:q2/q1,classicalDilationQ3Ratio:m2/m1,unitRescale:u2.displayTransform,physicalFieldUnchangedInUnitMode:true};
});
await check('actual-projection-and-source-coordinates','Y2-08,I0-04',async()=>{
 const r=await runJob(ex('g2-projection')),P=r.observation.matrix;assert.equal(r.sourceSamples.length,625);for(let i=0;i<r.sourceSamples.length;i++){const x=r.sourceSamples[i].x4;assert.equal(x.length,4);for(let j=0;j<3;j++)near(r.visualization.points[i].pos[j],P[j].reduce((v,a,k)=>v+a*x[k],0));}for(const row of P)near(row.reduce((v,a,k)=>v+a*r.observation.fibreKernelDirection[k],0),0);
 const rankBad=ex('g2-projection');rankBad.input.observation.matrix=[[1,0,0,0],[2,0,0,0],[0,0,0,0]];assert.equal(validateRequest(rankBad).ok,false);
 const marg=ex('g2-full-color');marg.input.observation.kind='BPST_INFINITE_MARGINAL';delete marg.input.observation.slice;assert.equal(validateRequest(marg).ok,false);
 return {samples:r.sourceSamples.length,projectionMatrix:P,kernelDirection:r.observation.fibreKernelDirection,rankDeficiencyRejected:true,unjustifiedInfiniteMarginalRejected:true};
});
await check('finite-holonomy-and-independent-gauge-integration','Y1-05,Y2-07,I3-02',()=>{
 const req=ex('g2-wilson'),g=createGroup(req.input.group),f=createField(g,req.input.field),a=wilsonLoop(f,req.input.path,{steps:8,gauge:req.input.gauge}),b=wilsonLoop(f,req.input.path,{steps:16,gauge:req.input.gauge});assert(b.membership.max<1e-10);assert(b.gaugeCheck.discreteEndpointCovariance<1e-10);assert(b.gaugeCheck.closedDiscreteTraceDifference<1e-10);assert(b.gaugeCheck.continuumConnectionIntegrationCovariance<a.gaugeCheck.continuumConnectionIntegrationCovariance*.3);
 const c0=pathHolonomy(f,req.input.path,8).matrix,c1=pathHolonomy(f,req.input.path,16).matrix,c2=pathHolonomy(f,req.input.path,32).matrix;assert(M.distance(c1,c2)<M.distance(c0,c1)*.3);
 const open=wilsonLoop(f,req.input.path.slice(0,-1),{steps:8,gauge:req.input.gauge});assert.equal(open.wilsonPlaquetteTerm,null);assert.equal(open.gaugeCheck.closedDiscreteTraceDifference,null);near(b.beta,7/f.spec.coupling.g**2);
 return {eightSteps:a.gaugeCheck,sixteenSteps:b.gaugeCheck,membership:b.membership,convergenceRatio:M.distance(c0,c1)/M.distance(c1,c2),G2BasicFormBeta:b.beta,openTraceNotClaimedInvariant:true};
});
await check('finite-spectral-model-and-channel-scope','I3-03,I0-04',()=>{
 const s=ex('finite-spectrum').input.model,r=finiteSpectralModel(s);near(r.gap,1);near(r.channelMass,1.4);assert(r.samples.every(x=>x.boundResidual<1e-13));assert(r.model.diagonal[0]===0&&r.model.diagonal.slice(1).every(e=>e>=s.delta));assert(r.continuumAssumptionsRequired.some(x=>x.includes('self-adjoint')));assert.throws(()=>finiteSpectralModel({...s,weights:[-.1,.7,.3]}));
 return r;
});
await check('all-examples-contract-valid-and-replay','Y2-08,I0-04,I1-07',async()=>{
 const evidence=[];for(const e of getExamples()){
  const validation=validateRequest(e.request);assert(validation.ok,e.id+JSON.stringify(validation));const r=await runJob(e.request);canonicalStringify(r);assert.equal(r.status,'COMPLETED');if(r.groupSpec)assert(validate('GaugeGroupSpec',r.groupSpec).ok);if(r.stateFamilySpec)assert(validate('StateFamilySpec',r.stateFamilySpec).ok);for(const a of r.assumptionRecords??[])assert(validate('AssumptionSpec',a).ok);
  const replay=await runJob(e.request);assert.equal(canonicalStringify(r),canonicalStringify(replay));evidence.push({example:e.id,kind:e.request.kind,sourceSamples:r.sourceSamples?.length??0,resultSha256:await sha256(r),requestHash:r.requestHash,exactReplay:true});
 }return evidence;
});
await check('float64-large-integer-wrapper','I0-04,Y2-08',async()=>{
 const q=ex('su3-bpst');q.input.family={...q.input.family,mode:'CLASSICAL_SCALE',delta:10000};q.input.observation.samplesPerAxis=3;q.input.verify={field:false,densityQuadrature:false};const r=await runJob(q),center=r.visualization.points[13].value;assert.equal(center.kind,'FLOAT64');assert(center.value>Number.MAX_SAFE_INTEGER);canonicalStringify(r);return {value:center,canonicalSerializationAccepted:true};
});
await check('required-state-input-and-budget-rejections','I0-04,Y1-07,Y2-01',()=>{
 const cases=[];const only={kind:'gauge.field',input:{group:ex('su3-bpst').input.group,delta:1}};cases.push(only);
 const missing=ex('su3-bpst');delete missing.input.field.domain;cases.push(missing);
 const budget=ex('g2-projection');budget.input.observation.samplesPerAxis=13;cases.push(budget);
 const invalidFamily=ex('su3-bpst');invalidFamily.input.family.mode='ENSEMBLE_ESTIMATE';cases.push(invalidFamily);
 const scale=ex('su3-bpst');scale.input.family={...scale.input.family,mode:'CLASSICAL_SCALE',delta:10000,referenceDelta:.0001};cases.push(scale);
 const missingForm=ex('su3-bpst');delete missingForm.input.group.globalForm;cases.push(missingForm);
 const badEmbedding=ex('su3-bpst');badEmbedding.input.field.embedding='short-root-su2';cases.push(badEmbedding);
 const split=ex('sp2-full-basis');split.input.group.representation='SPLIT_REAL';cases.push(split);
 const nan=ex('su3-bpst');nan.input.field.rho=Infinity;cases.push(nan);
 return cases.map(req=>{const r=validateRequest(req);assert.equal(r.ok,false);return {kind:req.kind,errors:r.errors};});
});
await check('lean-audit-source-and-negative-controls','I3-02,I3-03,I3-04',async()=>{
 const audit=JSON.parse(await readFile(new URL('./lean/lean-audit.json',import.meta.url),'utf8'));assert.equal(audit.targets.length,27);assert(audit.absenceOfSorry);assert(audit.targets.every(t=>t.customAxioms.length===0));assert(audit.commands.every(c=>c.exitCode===0));assert(audit.negativeControls.length===3&&audit.negativeControls.every(c=>c.rejected&&c.exitCode!==0&&c.log.includes('decide')));
 for(const s of audit.sourceFiles){const content=await readFile(new URL('./lean/'+s.path,import.meta.url),'utf8');assert.equal(content,s.content);assert.equal(createHash('sha256').update(content).digest('hex'),s.sha256);}
 for(const cmd of audit.commands){assert.equal(createHash('sha256').update(cmd.log).digest('hex'),cmd.logSha256);assert.equal(await readFile(new URL('./lean/'+cmd.logPath,import.meta.url),'utf8'),cmd.log);}
 const ledger=JSON.parse(await readFile(new URL('./analytic-assumptions.json',import.meta.url),'utf8'));assert.equal(ledger.importedLeanAnalyticTheorems.length,0);assert(ledger.infiniteDimensionalContract.hamiltonian.includes('self-adjoint'));assert(ledger.infiniteDimensionalContract.sumAndLimitExchange.includes('Tonelli'));assert.equal(ledger.customLeanAxiomsIntroduced.length,0);
 const sources=JSON.parse(await readFile(new URL('./sources.json',import.meta.url),'utf8'));assert(sources.every(s=>s.status==='THEOREM_REFERENCE'&&s.leanImport===null&&s.kernelReceipt===null));
 return {targetCount:audit.targets.length,standardAxiomCounts:Object.fromEntries([...new Set(audit.targets.flatMap(t=>t.axioms))].map(a=>[a,audit.targets.filter(t=>t.axioms.includes(a)).length])),customAxioms:[],negativeControls:audit.negativeControls.map(x=>({name:x.name,exitCode:x.exitCode,sha256:x.sha256,logSha256:x.logSha256})),sourceFileCount:audit.sourceFiles.length,toolchain:audit.toolchain,referencesNotImports:true};
});
const sourceFiles=['index.mjs','matrix.mjs','exact.mjs','groups.mjs','fields.mjs','family.mjs','observations.mjs','holonomy.mjs','group-data.mjs','generate_groups.py','tests.mjs','analytic-assumptions.json','sources.json'];
const files=[];for(const path of sourceFiles){const content=await readFile(new URL('./'+path,import.meta.url));files.push({path,sha256:createHash('sha256').update(content).digest('hex'),bytes:content.length});}
const report={schema:'MathScope.M1.GaugeValidation/1',checkedAt:new Date().toISOString(),runtime:process.version,status:failures?'FAIL':'PASS',total:records.length,passed:records.length-failures,failed:failures,records,files,scope:'Bounded constructive compact matrix adapters and classical fields; exact rational and selected Lean finite statements; no quantum YM construction/continuum gap proof.'};
await writeFile(new URL('./evidence/validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,total:report.total,passed:report.passed,failed:report.failed}));if(failures)process.exitCode=1;
