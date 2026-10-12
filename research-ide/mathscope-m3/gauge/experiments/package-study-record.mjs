/** Verify original receipts first, then package a browser-sized display archive. */
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {sha256,canonical} from '../contracts.mjs';
import {vacuumDifferenceCorrelators,vacuumNegativeControls} from '../vacuum.mjs';
const root=new URL('../',import.meta.url),read=async path=>readFile(new URL(path,root),'utf8');
const reviewPath='evidence/scale-expansion/matched-study-review-attempt1/review.json.gz',reviewBytes=await readFile(new URL(reviewPath,root)),reviewText=gunzipSync(reviewBytes).toString('utf8'),review=JSON.parse(reviewText),{payloadHash,...reviewPayload}=review;
const reviewFileSha256=createHash('sha256').update(reviewBytes).digest('hex');
if(await sha256(reviewPayload)!==payloadHash)throw new Error('Matched review payload changed');
const independentPath='evidence/scale-expansion/independent-numerical-review-attempt1.json',independentText=await read(independentPath),independent=JSON.parse(independentText);
if(independent.status!=='PASS'||independent.checks.length!==7)throw new Error('Independent numerical review incomplete');
if(independent.verifierSha256!==await sha256(await read('experiments/verify-study-numerics.py')))throw new Error('Independent numerical verifier changed');
const originalFiles=[],records=new Map(),references=new Map(),rowReceipts=[],calibration=[],rowSummaries=[];
const allPaths=[...review.sourceFiles.map(f=>({jobId:f.jobId,path:f.path.replace('research-ide/mathscope-m3/gauge/',''),expected:f.fileSha256})),{jobId:'production-a-coarse-attempt1',path:'evidence/scale-expansion/production-a-coarse-attempt1/result.json'}];
for(const f of allPaths){
 const raw=await read(f.path),record=JSON.parse(raw),fileSha256=await sha256(raw);
 if(f.expected&&fileSha256!==f.expected)throw new Error('Original production file changed: '+f.jobId);
 if(await sha256(record.result)!==record.resultHash)throw new Error('Original production result changed: '+f.jobId);
 const snapshots=[];for(const source of record.sourceFiles){const path=f.path.slice(0,f.path.lastIndexOf('/')+1)+source.snapshot;if(await sha256(await read(path))!==source.sha256)throw new Error('Original source snapshot changed: '+path);snapshots.push({...source,path});}
 const file={jobId:f.jobId,path:f.path,fileSha256,resultHash:record.resultHash,sourceFiles:snapshots,originalExecution:record.execution};originalFiles.push(file);records.set(f.jobId,{record,file});
 if(f.jobId!=='production-a-coarse-attempt1')for(const ref of record.result.scaleStudy.references){const prior=references.get(ref.sourceHash);if(prior&&canonical(prior.reference)!==canonical(ref))throw new Error('Shared reference contents differ');if(!prior)references.set(ref.sourceHash,{reference:ref,origin:file});}
}
const omitReplicateArrays=value=>{
 if(Array.isArray(value))return value.map(omitReplicateArrays);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['bootstrapMasses','bootstrapT0OverA2','sourceHashes'].includes(k)).map(([k,v])=>[k,omitReplicateArrays(v)]));
 return value;
};
for(const row of review.rows){
 const source=[...records.values()].find(r=>r.record.jobId!=='production-a-coarse-attempt1'&&r.record.result.rows.some(q=>q.id===row.id));
 if(!source||canonical(row)!==canonical(source.record.result.rows.find(r=>r.id===row.id)))throw new Error('Review row differs from original: '+row.id);
 const independentCheck=independent.checks.find(c=>c.rowId===row.id);if(!independentCheck||independentCheck.rawFileSha256!==source.file.fileSha256)throw new Error('Independent numerical review refers to a different raw file: '+row.id);
 const channel=omitReplicateArrays(row.channel),scaleSetting=omitReplicateArrays(row.scale);delete scaleSetting.curve;
 scaleSetting.quantitativeStatus=scaleSetting.diagnostics.replicas.every(r=>r.status==='FINITE_SAMPLE_DIAGNOSTICS_ACCEPTABLE')&&scaleSetting.diagnostics.splitRhat.status==='SPLIT_RHAT_ACCEPTABLE'?'REPLICA_DIAGNOSTICS_PASSED_FINITE_SAMPLE_ONLY':'PROVISIONAL_REFERENCE_DIAGNOSTICS';
 // Add the bounded-vector interpretation without rewriting the historical output.
 channel.vacuumDifference.currentAnalyticInterpretation=vacuumDifferenceCorrelators(row.channel.rawCorrelatorMatrices).zeroTemperatureVector;
 const sourceHash=await sha256({model:row.model,independentScaleSourceHash:row.independentScaleSourceHash,chainHashes:row.chainHashes});
 const out={id:row.id,role:row.role,targetDelta:row.targetDelta,beta:row.beta,model:row.model,modelHash:row.modelHash,sourceHash,independentScaleSourceHash:row.independentScaleSourceHash,chainHashes:row.chainHashes,
  lattice:{Ns:row.Ns,Nt:row.Nt,as:row.scale.aOverSqrtT0,at:row.scale.aOverSqrtT0,lengthUnit:'sqrt(t0)'},scaleSetting,
  targetComparison:{...row.targetComparison,newActualChainExecuted:false,originalNewActualChainExecuted:true,executionContext:'ORIGINAL_RECORDED_RUN'},
  correlator:{rows:row.channel.connectedCorrelatorMatrices.map((matrix,t)=>({time:t*row.scale.aOverSqrtT0,lag:t,matrix}))},
  channelMass:row.channel.referenceMass,channel,vacuumAudit:row.vacuumAudit,
  originalExecution:{jobId:source.record.jobId,sourceFile:source.file.path,sourceFileSha256:source.file.fileSha256,resultHash:source.record.resultHash,execution:source.record.execution,request:source.record.input,replicas:row.replicas.map(r=>({start:r.start,seed:r.seed,chainHash:r.chainHash,retainedConfigurations:r.samples.length})),newExecution:false}};
 calibration.push(out);rowReceipts.push({id:row.id,originalRowSha256:await sha256(row),displayedRowSha256:await sha256(out),originalFileSha256:source.file.fileSha256,originalResultHash:source.record.resultHash});
 rowSummaries.push({id:row.id,role:row.role,beta:row.beta,Ns:row.Ns,Nt:row.Nt,targetDelta:row.targetDelta,referenceScaleId:row.referenceScaleId,sourceHash,chainHashes:row.chainHashes,originalExecution:out.originalExecution,vacuumAudit:row.vacuumAudit,channel:{finiteTemperature:{...row.vacuumAudit.thermal,zeroEnergyDifference:channel.vacuumDifference.currentAnalyticInterpretation,thermalDifferenceScope:channel.vacuumDifference.finiteT}}});
}
const referenceDisplays=[...references.values()].map(({reference:r,origin})=>({id:r.id,model:r.model,modelHash:r.modelHash,sourceHash:r.sourceHash,targetMassWasAnInput:false,analysis:omitReplicateArrays(r.analysis),replicas:r.replicas.map(q=>({start:q.start,seed:q.seed,chainHash:q.chainHash,retainedConfigurations:q.samples.length})),originalFile:origin.path,originalFileSha256:origin.fileSha256}));
const prior=records.get('production-a-coarse-attempt1'),priorRow=prior.record.result.rows[0];
const result={status:'COMPLETED',kind:'ensemble-study',recordId:'su2-production-v1',evidenceGrade:'ARCHIVED_ACTUAL_INDEPENDENT_REFERENCE_SCALE_AND_FINITE_CHANNEL_STUDY',interpretation:'ESTIMATED',newExecution:false,
 execution:{kind:'ARCHIVED_ACTUAL_NUMERICAL_RUNS',newExecution:false,sourceAuditReexecuted:true,originalAttemptCount:8,displayedIndependentModelRows:7,displayedChannelConfigurations:calibration.reduce((n,r)=>n+r.originalExecution.replicas.reduce((s,q)=>s+q.retainedConfigurations,0),0),distinctReferenceConfigurations:referenceDisplays.reduce((n,r)=>n+r.replicas.reduce((s,q)=>s+q.retainedConfigurations,0),0),meaning:'Stored full continuous SU2 production and held-out validation chains; opening this record only verifies its packaged source receipts.'},
 normalization:[...records.values()][0].record.result.normalization,calibration,rows:rowSummaries,scaleStudy:{references:referenceDisplays,independence:'Separate actual scale and channel trajectories with disjoint seeds. Scale definitions and scale seeds exclude targetDelta. L/T sweeps reuse the same exact independent beta reference.',physicalUnitAnchor:null},
 calibrationSearch:review.review.calibration,limitComparison:review.review.limits,vacuumNegativeControls:vacuumNegativeControls(),
 researchLimitations:[...referenceDisplays.map(r=>({kind:'INDEPENDENT_SCALE_DIAGNOSTICS',referenceId:r.id,beta:r.model.beta,replicaStatus:r.analysis.diagnostics.replicas.map(q=>q.status),replicaESS:r.analysis.diagnostics.replicas.map(q=>q.effectiveSampleSize),minimumESS:16,cloverT0:r.analysis.t0OverA2,plaquetteT0:r.analysis.alternatePlaquetteCrossing.value,cloverMinusPlaquetteT0:r.analysis.discretizationComparison.cloverMinusPlaquetteT0,meaning:'The finite-spacing scale-definition difference is substantial. Small RK3 step error does not remove this lattice systematic. Statistical confidence remains conditional on the displayed replica diagnostics.'})),{kind:'MATCHING_AND_EXTRAPOLATION',actualMatching:review.review.limits.matching,fit:review.review.limits.spacing.extrapolation.status,finiteRange:review.review.limits.spacing.rows.map(r=>({id:r.id,aOverSqrtT0:r.a})),meaning:'Approximate matched finite geometries and coarse a values. The conditional a2 fit does not verify an asymptotic scaling regime or a positive continuum lower bound.'},{kind:'EXTENT_DIFFERENCE_UNCERTAINTY',comparisons:review.review.limits.measuredExtentDifferences,meaning:'The predeclared paired-bootstrap threshold is preserved. An unresolved difference interval is not a systematic error bound.'}],
 priorAttempts:[{jobId:prior.record.jobId,id:priorRow.id,originalFile:prior.file.path,originalFileSha256:prior.file.fileSha256,originalResultHash:prior.record.resultHash,channelMass:priorRow.channel.referenceMass,primaryFitStatus:priorRow.channel.primaryFit.status,relationship:'production-a-coarse-attempt2 extends the exact same chain prefix with more retained configurations; it is not independent validation.',hidden:false}],
 studyReview:{scopeChecks:review.review.scopeChecks,referenceDiagnostics:review.review.referenceDiagnostics,limitations:review.review.limitations,reviewHash:review.review.reviewHash},
 inequalityDirection:'gap_global <= E_channel <= m_eff only for a positive vacuum-projected zero-temperature spectral measure. Finite-T/cosh and thermal-transition limitations remain visible for each measured channel.',
 continuumGap:'OPEN_CONTINUUM',representationCutoff:null,scope:'Actual finite full-Haar SU2 Wilson models and independent reference units. Approximate confidence intervals, finite matching and conditional extrapolations do not construct a continuum theory or prove a uniform gap.'};
const packagingPaths=['experiments/package-study-record.mjs','experiments/assemble-study-evidence.mjs','study-review.mjs','study-record.mjs','scale-analysis.mjs','vacuum.mjs'],packagingSources=[];
for(const path of packagingPaths)packagingSources.push({path,sha256:await sha256(await read(path))});
const body={schema:'MathScope.M3.SU2ProductionArchive/1',recordId:'su2-production-v1',result,resultSha256:await sha256(result),rowReceipts,originalFiles,
 reviewReceipt:{path:reviewPath,encoding:'GZIP_UTF8_JSON',fileSha256:reviewFileSha256,uncompressedSha256:await sha256(reviewText),payloadHash,reviewHash:review.review.reviewHash},
 independentNumericalReview:{...independent,path:independentPath,fileSha256:await sha256(independentText)},
 packaging:{status:'ORIGINAL_RAW_FILES_RESULTS_SOURCE_SNAPSHOTS_AND_REVIEW_MATCH',sourceFiles:packagingSources,newNumericalExecution:false,originalSourceEpochIsPreserved:true,omittedFromBrowser:'Full raw configuration vectors, original flow curves per configuration and bootstrap replicate arrays remain in the eight linked source files. Fit data, invalid states and uncertainty summaries remain displayed.',scope:'A packaging audit validates bytes and row provenance; it is not a new numerical or Lean execution.'}};
const text=JSON.stringify(body),envelope={encoding:'UTF8_JSON_BASE64',bodySha256:await sha256(text),bodyBase64:Buffer.from(text,'utf8').toString('base64')},module='/** Generated from verified actual production receipts; UTF-8 transport is byte-stable. */\nexport const STUDY_RECORD_DATA = '+JSON.stringify(envelope)+';\n';
const output=new URL('study-record-data.mjs',root),check=process.argv.includes('--check');
if(check){if(await readFile(output,'utf8')!==module)throw new Error('Study archive package is stale');}else await writeFile(output,module);
console.log(JSON.stringify({status:check?'MATCH':'PACKAGED',bodySha256:envelope.bodySha256,bytes:Buffer.byteLength(text),rows:calibration.length,originalAttempts:8,sourceSnapshots:originalFiles.reduce((n,f)=>n+f.sourceFiles.length,0),independentNumericalChecks:independent.checks.length}));
