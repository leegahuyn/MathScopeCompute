/** Read-only identity of the genuinely observed initialized source.
 *
 * This separate capability verifies saved bytes and retains the actual
 * scalar/function program. It never installs an original live producer
 * seal, proves a norm, or substitutes a serialized flag for a PDE proof.
 * Node-only: consumers that need source mathematics run outside the UI.
 */
import {readFile} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {verifyExactStageSnapshot} from './tests/exact-stage-snapshot.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../../..'),
  BASE='research-ide/mathscope-m3/navier/',
  ORIGINAL=BASE+'evidence/global-forced-current-20261012/attempt382884203291/',
  REPLAY=BASE+'evidence/forced-snapshot-replay-20261012/attempt1/',
  PINS=Object.freeze({
    originalReceipt:'d17bc42fcfaf8000d014977d4725f325dbdb73849a43c71c36d20ea63ef14684',
    replayReceipt:'76cb0c616b6485bff14037bd3fd8c67e59f3f2edbd476e5d37ef15e456f3c736',
    replay:'d66646cda670daa8a3d4ecc45db205995fb7d685c897c912655fb0e0f0e5dd6d',
    mean:'22c878e7ace454c61f00c9ee4952738f7f9fa7b1c269eca538ca224dd8fcb96b',
    angular:'ba60de00a1e41f9c448da3aabcbf791bc4649b5fcfd99cff7a71865463db8b14',
    index:'ba251f2f3401d2d81467a8ac3c5ceb0da7c6ddc3899aab6d9d580755ff0fd1f3',
    sourceBefore:'37960fe03a79493d12b6b9051b8a69a88ab71cc3505cc8cd62c6f2fc4bc0daeb'}),
  seals=new WeakMap(),fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SAVED_INITIALIZED_SOURCE'});},
  sha=raw=>createHash('sha256').update(raw).digest('hex'),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),
  require=(value,message)=>{if(!value)fail(message);},
  freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const x of Object.values(value))freeze(x);Object.freeze(value);}return value;},
  repoPath=path=>{require(typeof path==='string','An exact repository path is required.');const p=resolve(ROOT,path);
    require(p.startsWith(ROOT+sep),'A saved source file must stay inside its repository.');return p;};
let pending;

async function pinned(path,pin,bytes){
  const raw=await readFile(repoPath(path));
  require(sha(raw)===pin&&(bytes===undefined||raw.length===bytes),'Changed immutable saved source bytes: '+path);
  return raw;
}
const jsonPinned=async(path,pin,bytes)=>JSON.parse(await pinned(path,pin,bytes));

async function construct(){
  const startedAt=new Date().toISOString(),original=await jsonPinned(ORIGINAL+'receipt.json',PINS.originalReceipt),
    replayReceipt=await jsonPinned(REPLAY+'receipt.json',PINS.replayReceipt),
    replayArtifacts=new Map(replayReceipt.artifacts.map(row=>[row.path,row])),
    artifact=async name=>{const row=replayArtifacts.get(REPLAY+name);require(row,'A replay evidence artifact is missing: '+name);
      return jsonPinned(row.path,row.sha256,row.bytes);},
    replay=await artifact('replay.json'),capture=await artifact('input-verification.json'),
    replayBefore=await artifact('source-before.json'),replayAfter=await artifact('source-after.json');
  require(original.pass===false&&original.stoppedReason==='OBSERVED_EXECUTION_TIME_LIMIT'&&original.sourceFileCount===155&&
    original.sourceFilesUnchanged===true,'The original failed construction outcome must remain unchanged.');
  require(replayArtifacts.get(REPLAY+'replay.json').sha256===PINS.replay&&replayReceipt.pass===true&&
    replayReceipt.actualCoefficientComparisons===540&&replayReceipt.actualScalarIdentities===2320&&
    replayReceipt.independentChecks===213&&replayReceipt.independentPass===true&&replayReceipt.negativeControls===4&&
    replayReceipt.sourceFileCount===9&&replayReceipt.sourceFilesUnchanged===true&&
    replayReceipt.privateSourceAuthorityHydrated===false&&replayReceipt.wholeCurrentCertificateRecovered===false,
    'Use the exact completed saved-source replay, with its separate and limited scope.');
  require(capture.pass===true&&capture.originalSourceFileCount===155&&capture.originalSourceBytesUnchanged===true&&
    same(replayBefore,replayAfter)&&replayBefore.length===9,'The complete original and replay source captures are required.');
  for(const row of replayReceipt.artifacts)await pinned(row.path,row.sha256,row.bytes);
  for(const row of capture.files)await pinned(row.path,row.sha256,row.bytes);
  for(const row of replayBefore){await pinned(row.path,row.sha256,row.bytes);await pinned(REPLAY+'sources/'+row.path,row.sha256,row.bytes);}
  const sourceBefore=await jsonPinned(ORIGINAL+'source-bytes-before.json',PINS.sourceBefore),sourceTexts=new Map();
  require(sourceBefore.files.length===155,'Every original source dependency is required.');
  for(const row of sourceBefore.files){
    const raw=await pinned(row.path,row.sha256,row.bytes);await pinned(ORIGINAL+'sources/'+row.path,row.sha256,row.bytes);
    sourceTexts.set(row.path,raw.toString('utf8'));
  }
  const mean=await jsonPinned(ORIGINAL+'initialized-mean-construction.json',PINS.mean),
    angular=await jsonPinned(ORIGINAL+'initialized-angular-construction.json',PINS.angular),
    index=await jsonPinned(ORIGINAL+'checkpoint-index.json',PINS.index),first=index.checkpoints[0],
    manifest=await jsonPinned(first.path,first.sha256),nodes=[],cumulative=createHash('sha256'),
    meanPrefix=createHash('sha256');let nodeBytes=0,meanNodeBytes=0,header;
  require(mean.schema==='MathScope.N6.GlobalActualInitializedMean/1'&&mean.graph.nodeCount===3615866&&
    angular.graph.nodeCount===3825351&&manifest.nodeCount===3892594&&first.firstNode===0&&index.checkpoints.length===11&&
    angular.sourceMeanGraph.sha256===mean.graph.sha256&&angular.sourceMeanGraph.nodeCount===mean.graph.nodeCount,
    'The saved initialized mean must be the exact parent of the actual angular source.');
  const verification=await verifyExactStageSnapshot(repoPath(first.path),{
    onHeader:h=>{header=h;},onNode:(id,node)=>{
      require(id===nodes.length&&id<3892594,'Retain the complete ordered source node prefix.');
      const line=JSON.stringify([id,node])+'\n';cumulative.update(line);nodeBytes+=Buffer.byteLength(line);
      if(id<mean.graph.nodeCount){meanPrefix.update(line);meanNodeBytes+=Buffer.byteLength(line);}
      nodes.push(freeze(node));
    }});
  require(cumulative.digest('hex')===manifest.nodesSHA256&&nodeBytes===manifest.nodeBytes&&
    verification.manifestSHA256===first.sha256&&header.record.initializedSourceNodeCount===angular.graph.nodeCount&&
    header.record.source.parameterExpressionSHA256===mean.source.parameterExpressionSHA256,
    'The actual complete source graph stream or its initialized parent changed.');
  require(same(mean.source.exactSequence,['primary-current-pressure','temporal-8.20','post-temporal-8.12',
    'five-moments-8.25-on-new-P-J','post-moment-8.12'])&&mean.checks.every(row=>row.pass)&&
    mean.stages.temporal.checks.every(row=>row.pass)&&mean.stages.moments.checks.every(row=>row.pass)&&
    mean.nonlinear.expansionChecks.every(row=>row.pass)&&mean.nonlinear.remaindersDeclaredZero===false&&
    ['P','Jtheta','Jz'].every(key=>mean.bumps.actualInputDefects[key]===mean.stages.temporal.mean[key]),
    'Keep the actual fresh temporal targets, all five source rows and complete latest mean pressure.');
  const stageRootIds=[...Object.values(mean.stages.temporal.velocity),...Object.values(mean.stages.moments.velocity),
    mean.stages.temporal.pressure.value,mean.stages.moments.pressure.value,...Object.values(mean.bumps.actualInputDefects),
    ...Object.values(mean.nonlinear.actualNewDefects),...Object.values(mean.nonlinear.remainderDefects)];
  require(stageRootIds.every(id=>Number.isSafeInteger(id)&&id>=0&&id<mean.graph.nodeCount&&nodes[id]),
    'An initialized velocity, fresh pressure or retained nonlinear defect is outside its actual source prefix.');
  // The parent function registry is a complete observed definition table.
  // Later appended definitions remain labelled as such; callers cannot
  // use their nodes through this earlier initialized-mean capability.
  const definitions=freeze(header.definitions),definitionRows=[],collect=(layer,namespace)=>{
    if(!layer)return;
    for(const [key,value]of Object.entries(layer)){
      if(key==='base')collect(value,namespace+'.base');
      else if(typeof value==='string'&&['definitions','expressionDefinitions','fieldDefinitions','inverseDefinitions',
        'quadratic','monotone','picard','expression','fixed','m3GlobalPulses','m3GlobalCoefficients','m3GlobalBlocks','m3GlobalFields'].includes(key)){
        const parsed=freeze(JSON.parse(value));definitionRows.push(freeze({namespace:namespace+'.'+key,value:parsed}));
      }
    }
  };collect(definitions,'snapshot');
  const recipePaths=['research-ide/mathscope-m2/navier/actual-common-admissible-family.mjs',
    'research-ide/mathscope-m2/navier/actual-common-target-weighted-norms.mjs',BASE+'source-global-band.mjs',
    BASE+'tests/global-source-forced-current.test.mjs'];
  require(recipePaths.every(path=>sourceTexts.has(path))&&sourceTexts.get(recipePaths[3]).includes('coefficientOrder:1,maxNodes:3500000'),
    'The original selected source request and family producer code must remain the exact executed bytes.');
  // Recheck the current executed dependencies after the stream, so a
  // concurrent source edit cannot silently change the observed binding.
  for(const row of sourceBefore.files)await pinned(row.path,row.sha256,row.bytes);
  for(const row of replayBefore)await pinned(row.path,row.sha256,row.bytes);
  const meanPrefixSHA256=meanPrefix.digest('hex'),actualRoots=freeze({
    background:mean.stages.moments.mean.background,covariance:mean.stages.moments.mean.fullAngularCovariance,
    originalStress:mean.stages.moments.mean.fullOriginalStress,
    temporalVelocity:mean.stages.temporal.velocity,temporalPressure:mean.stages.temporal.pressure,
    freshInputDefects:mean.bumps.actualInputDefects,fiveCoefficients:mean.bumps.coefficients,
    initializedVelocity:mean.stages.moments.velocity,initializedPressure:mean.stages.moments.pressure,
    initializedDefects:mean.nonlinear.actualNewDefects,retainedRemainderDefects:mean.nonlinear.remainderDefects,
    exactFiveRows:mean.bumps.exactRows,potential:mean.potential,conservation:mean.conservation}),
    capability=freeze({schema:'MathScope.N6.SavedInitializedSourceAuthority/1',
      source:{paperSHA256:mean.source.paperSHA256,parameterExpressionSHA256:mean.source.parameterExpressionSHA256,
        originalMeanCertificateSHA256:PINS.mean,originalMeanGraph:mean.graph,sourceNodePrefixSHA256:meanPrefixSHA256,
        sourceNodePrefixBytes:meanNodeBytes,sourceNodeCount:mean.graph.nodeCount,
        completeParentSnapshotNodeCount:manifest.nodeCount,completeParentSnapshotNodeSHA256:manifest.nodesSHA256,
        sourceDependencyCount:155,replayDependencyCount:9,originalReceiptSHA256:PINS.originalReceipt,replayReceiptSHA256:PINS.replayReceipt,
        sourceSnapshotIndexSHA256:PINS.index,originalSourceSequence:mean.source.exactSequence},
      actualRoots,recipe:{files:sourceBefore.files.filter(row=>recipePaths.includes(row.path)),
        originalSelectedBandRequest:{coefficientOrder:1,maxNodes:3500000},originalSelectedFamilyRequest:{throughOrder:2,derivativeOrder:3},
        runtimeProducerReference:'The immutable source recipe defines family.constructTargetWeightedNorms; no private family runtime is recreated here.',
        allFiniteNormProducerHydrated:false},
      verification:{startedAt,finishedAt:new Date().toISOString(),fullParentUncompressedStreamVerified:true,
        allCapturedCompressedArtifactBytesVerified:true,all155OriginalSourceBytesVerified:true,
        actualReplayReceiptBound:true,actualReplayCoefficientComparisons:540,actualReplayScalarIdentities:2320,
        identitiesRecomputedDuringThisOpen:false,all11UncompressedStreamsReplayedDuringThisOpen:false,
        originalConstructorPass:false,originalConstructorOutcomeRewritten:false},
      scope:{actualSavedInitializedMeanBodyIdentityAuthenticated:true,wholeOriginalInitializedMeanRootsRetained:true,
        originalPrivateProducerAuthorityHydrated:false,sourceRecipeBytesRetained:true,liveFamilyRuntimeRecreated:false,
        uniformAllOrderSourceClassProved:false,wholeIndependentPhysicalPDECompared:false,
        completeForcedCurrentCertificateRecovered:false,originalN602Complete:false,completeN6:false,wholeM3Complete:false}});
  const node=id=>{require(Number.isSafeInteger(id)&&id>=0&&id<mean.graph.nodeCount,'Only the actual initialized-mean node prefix is authorized.');return nodes[id];},
    program=Object.freeze({mean:freeze(mean),actualRoots,node,nodeCount:mean.graph.nodeCount,
      completeParentDefinitions:definitions,definitionCollections:freeze(definitionRows),
      definitionScope:'Captured definitions include later appended source definitions; this capability authorizes nodes only below nodeCount.',
      sourceFiles:freeze(sourceBefore.files),sourceText:path=>{require(sourceTexts.has(path),'The requested source file was not executed in this immutable source capture.');return sourceTexts.get(path);},
      originalLiveFamily:null,originalTargetNormProducer:null});
  seals.set(capability,{program});return capability;
}

/** No caller graph, source id, receipt, path or completion flag is accepted. */
export async function openSavedInitializedSource(...args){
  require(args.length===0,'The fixed actual saved initialized source takes no replacement input.');
  if(!pending)pending=construct().catch(error=>{pending=null;throw error;});
  return pending;
}
export function assertSavedInitializedSource(capability){
  require(seals.has(capability)&&Object.isFrozen(capability),'Use the private unchanged saved-source capability, not a copied record.');return true;
}
export function savedInitializedSourceProgram(capability){
  assertSavedInitializedSource(capability);return seals.get(capability).program;
}
