/** A byte-checked archive of actual runs. Opening it executes no Markov chain. */
import {STUDY_RECORD_DATA} from './study-record-data.mjs';
import {check,known,sha256,canonical} from './contracts.mjs';

export async function verifyStudyRecordEnvelope(envelope){
 check(envelope?.encoding==='UTF8_JSON_BASE64'&&typeof envelope.bodyBase64==='string','STUDY_ARCHIVE_ENCODING','A source-bound UTF-8 study archive is required.');
 let text;
 try{text=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(envelope.bodyBase64),c=>c.charCodeAt(0)));}
 catch{throw Object.assign(new Error('The study archive transport is invalid.'),{code:'STUDY_ARCHIVE_ENCODING'});}
 check(await sha256(text)===envelope.bodySha256,'STUDY_ARCHIVE_BODY_HASH','The encoded actual-study body was changed.');
 const body=JSON.parse(text);
 check(body.schema==='MathScope.M3.SU2ProductionArchive/1'&&body.recordId==='su2-production-v1','STUDY_ARCHIVE_ID','This is not the pinned finite SU2 production archive.');
 check(body.result?.kind==='ensemble-study'&&body.result.newExecution===false&&body.result.execution?.newExecution===false,'STUDY_ARCHIVE_EXECUTION','Opening stored observations must never claim a fresh Markov-chain execution.');
 check(body.result.continuumGap==='OPEN_CONTINUUM'&&body.result.limitComparison?.continuumGap?.claim===false&&body.result.limitComparison?.spacing?.extrapolation?.continuumPositiveLowerBound===null,'STUDY_ARCHIVE_SCOPE','Finite observations do not establish a positive continuum lower bound.');
 check(await sha256(body.result)===body.resultSha256,'STUDY_ARCHIVE_RESULT_HASH','The displayed numerical study differs from its packaged receipt.');
 check(body.rowReceipts.length===body.result.calibration.length,'STUDY_ARCHIVE_ROWS','Every displayed channel must have its own recorded row receipt.');
 const rowChecks=[];
 for(let i=0;i<body.rowReceipts.length;i++){
  const receipt=body.rowReceipts[i],row=body.result.calibration[i];
  check(row.id===receipt.id&&await sha256(row)===receipt.displayedRowSha256,'STUDY_ARCHIVE_ROW_HASH','A displayed calibration row changed.');
  check(row.targetComparison.equalityForced===false&&row.channelMass.globalGapLowerBound===false&&row.channelMass.uncertainty.rigorous===false,'STUDY_ARCHIVE_MASS_SCOPE','An estimated channel mass cannot be relabelled exact or a global lower bound.');
  check(row.chainHashes.length===2&&row.chainHashes.every(h=>/^[a-f0-9]{64}$/.test(h)),'STUDY_ARCHIVE_CHAIN_SOURCE','Each numerical row needs both actually executed source chains.');
  check(await sha256({model:row.model,independentScaleSourceHash:row.independentScaleSourceHash,chainHashes:row.chainHashes})===row.sourceHash,'STUDY_ARCHIVE_SOURCE_HASH','The model, separate reference and actual source chains were rebound.');
  check(body.originalFiles.some(f=>f.fileSha256===receipt.originalFileSha256&&f.resultHash===receipt.originalResultHash),'STUDY_ARCHIVE_ORIGINAL_RECEIPT','The displayed row lacks a source-bound original execution.');
  rowChecks.push({id:row.id,status:'MATCH',displayedRowSha256:receipt.displayedRowSha256,originalRowSha256:receipt.originalRowSha256,originalFileSha256:receipt.originalFileSha256});
 }
 check(body.originalFiles.length===8&&body.originalFiles.every(f=>/^[a-f0-9]{64}$/.test(f.fileSha256)&&f.originalExecution?.status==='EXECUTED'),'STUDY_ARCHIVE_EXECUTIONS','All eight retained production/validation attempts must remain in the source manifest.');
 check(body.independentNumericalReview.status==='PASS'&&body.independentNumericalReview.checks.length===7,'STUDY_ARCHIVE_NUMERICAL_REVIEW','The independent raw-observation review must cover every displayed channel.');
 return {body,bodySha256:envelope.bodySha256,rowChecks};
}

export async function loadStudyRecord(input={}){
 known(input,['recordId'],'stored ensemble-study input');
 check(input.recordId==='su2-production-v1','STUDY_RECORD_ID','Choose the source-bound su2-production-v1 record. To run new chains, omit recordId and use the explicit study parameters.');
 const {body,bodySha256,rowChecks}=await verifyStudyRecordEnvelope(STUDY_RECORD_DATA),result=structuredClone(body.result);
 return {...result,sourceHash:bodySha256,archiveAudit:{status:'ARCHIVE_BODY_AND_DISPLAYED_ROWS_MATCH',recordId:body.recordId,bodySha256,resultSha256:body.resultSha256,displayedRowChecks:rowChecks,originalFiles:body.originalFiles,review:body.reviewReceipt,independentNumericalReview:body.independentNumericalReview,packaging:body.packaging,
  newExecution:false,sourceAuditReexecuted:true,rawFilesRefetchedInBrowser:false,
  verificationScope:'This run recomputes the UTF-8 archive body and displayed-row digests. The recorded local packaging audit verified every original raw result and original source snapshot. Browser loading does not download those raw files or rerun the original Markov chains.',
  replayMeaning:'Reopening or replaying this archive rechecks its bytes and receipts. Use the live examples for an actual newly executed numerical study.'}};
}
