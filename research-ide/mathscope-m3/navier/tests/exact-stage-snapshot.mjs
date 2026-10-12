/** Lossless, bounded-memory observed source graph checkpoints.
 * No private mathematical authority is reconstructed by this file.
 */
import {createHash} from 'node:crypto';
import {mkdir,open,readFile,writeFile} from 'node:fs/promises';
import {resolve,relative,dirname,join} from 'node:path';
import {Readable,Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createGzip,createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';

const saved=new WeakMap(),sha=bytes=>createHash('sha256').update(bytes).digest('hex'),
  fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_SNAPSHOT'});},
  nodeLine=(G,id)=>JSON.stringify([id,G.nodes[id]])+'\n';

function liveNodesDigest(G,count,progress){
  const hash=createHash('sha256');let bytes=0;
  for(let id=0;id<count;id++){
    if(!G.nodes[id])fail('An exact stage has a missing original scalar node.');
    const line=nodeLine(G,id);hash.update(line);bytes+=Buffer.byteLength(line);
    if(id%100000===0)progress?.({stage:'exact-source-snapshot-prefix-check',node:id,nodeCount:count});
  }
  return {hash,sha256:hash.copy().digest('hex'),bytes};
}

export async function writeExactStageSnapshot({G,record,kind,key=null,directory,parent=null,partBytes=8*1024**2,onProgress}={}){
  if(!Array.isArray(G?.nodes)||typeof G.captureFunctionDefinitions!=='function'||typeof G.functionDefinitionsUnchanged!=='function'||
    !record||typeof kind!=='string'||!Number.isSafeInteger(partBytes)||partBytes<1024||partBytes>8*1024**2)
    fail('A source checkpoint requires the actual graph, complete record and a bounded binary part size.');
  const prior=parent&&saved.get(parent);if(parent&&(!prior||prior.G!==G))fail('A delta can only extend this same privately observed graph snapshot.');
  const end=G.nodes.length,start=prior?.nodeCount??0,folder=resolve(directory),definitions=G.captureFunctionDefinitions(),
    prefix=liveNodesDigest(G,start,onProgress);
  if(prior&&(prefix.sha256!==prior.nodesSHA256||prefix.bytes!==prior.nodeBytes))fail('The actual source prefix changed before its appended checkpoint.');
  await mkdir(folder,{recursive:true});
  // Existing snapshots are immutable. Exclusive creation fails on a
  // repeated destination instead of overwriting a historical graph.
  const lock=await open(join(folder,'snapshot.lock'),'wx');await lock.close();
  const header={schema:'MathScope.N6.ExactSourceStageGraphNDJSON/1',kind,key,firstNode:start,nodeCount:end,
    definitions,record,sourceAuthority:'Observed exact source bytes only; no private source object is reconstructed from this record.'},
    rawHash=createHash('sha256'),gzipHash=createHash('sha256'),nodeHash=prefix.hash,parts=[];
  let rawBytes=0,gzipBytes=0,nodeBytes=prefix.bytes,handle=null,partHash=null,partSize=0,partName=null;
  const finishPart=async()=>{
    if(!handle)return;await handle.close();parts.push({index:parts.length,path:partName,bytes:partSize,sha256:partHash.digest('hex')});
    handle=null;partHash=null;partSize=0;
  },sink=new Writable({write(chunk,encoding,done){(async()=>{
    const bytes=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,encoding);gzipHash.update(bytes);gzipBytes+=bytes.length;let offset=0;
    while(offset<bytes.length){
      if(!handle){partName='graph.ndjson.gz.part'+String(parts.length).padStart(4,'0');handle=await open(join(folder,partName),'wx');partHash=createHash('sha256');}
      const n=Math.min(partBytes-partSize,bytes.length-offset),piece=bytes.subarray(offset,offset+n);let written=0;
      while(written<piece.length){const result=await handle.write(piece.subarray(written));if(!result.bytesWritten)fail('A source snapshot write made no progress.');written+=result.bytesWritten;}
      partHash.update(piece);partSize+=n;offset+=n;if(partSize===partBytes)await finishPart();
    }
  })().then(()=>done(),done);},final(done){finishPart().then(()=>done(),done);}}),
    source=Readable.from((async function*(){
      const send=text=>{const bytes=Buffer.from(text);rawHash.update(bytes);rawBytes+=bytes.length;return bytes;};
      yield send(JSON.stringify(header)+'\n');let chunk='',chunkBytes=0;
      for(let id=start;id<end;id++){
        const line=nodeLine(G,id),n=Buffer.byteLength(line);nodeHash.update(line);nodeBytes+=n;chunk+=line;chunkBytes+=n;
        if(chunkBytes>=1024**2){yield send(chunk);chunk='';chunkBytes=0;onProgress?.({stage:'exact-source-snapshot-node-stream',node:id,nodeCount:end});}
      }
      if(chunk)yield send(chunk);
    })());
  try{await pipeline(source,createGzip({level:6}),sink);}catch(error){if(handle)await handle.close().catch(()=>{});throw error;}
  const nodeDigest=nodeHash.digest('hex'),after=liveNodesDigest(G,end,onProgress);
  if(G.nodes.length!==end||after.sha256!==nodeDigest||after.bytes!==nodeBytes||!G.functionDefinitionsUnchanged(definitions))
    fail('A source node or operator definition changed during its exact checkpoint write.');
  const parentRow=prior?{path:relative(folder,prior.manifestPath),sha256:prior.manifestSHA256,nodeCount:prior.nodeCount,nodesSHA256:prior.nodesSHA256}:null,
    manifest={schema:'MathScope.N6.ExactSourceStageGraphSnapshot/1',kind,key,encoding:'UTF-8 NDJSON, one complete header followed by exact [id,node] rows; gzip parts concatenate in index order.',
      firstNode:start,nodeCount:end,appendedNodeCount:end-start,allPrefixNodeBytesReverified:!!prior,parent:parentRow,
      rawBytes,rawSHA256:rawHash.digest('hex'),gzipBytes,gzipSHA256:gzipHash.digest('hex'),nodeBytes,nodesSHA256:nodeDigest,
      maximumPartBytes:partBytes,parts,allLiveSourceNodeBytesUnchangedDuringWrite:true,allOperatorDefinitionsRetained:true,
      privateSourceAuthorityHydrated:false,wholeFieldNumericalEnclosure:false},
    manifestPath=join(folder,'manifest.json'),manifestText=JSON.stringify(manifest,null,2)+'\n';
  await writeFile(manifestPath,manifestText,{flag:'wx'});
  const result={manifestPath,sha256:sha(manifestText),...manifest};
  saved.set(result,{G,nodeCount:end,nodeBytes,nodesSHA256:nodeDigest,manifestPath,manifestSHA256:result.sha256});return result;
}

/** Independently verifies saved compressed bytes, exact row inventory and
 * linked parent metadata. Nodes are passed to a callback for selective
 * polynomial replay; this never installs a private source seal.
 */
export async function verifyExactStageSnapshot(manifestPath,{onHeader,onNode}={}){
  const path=resolve(manifestPath),manifestBytes=await readFile(path),m=JSON.parse(manifestBytes),folder=dirname(path);
  if(m.schema!=='MathScope.N6.ExactSourceStageGraphSnapshot/1'||m.privateSourceAuthorityHydrated!==false||!Array.isArray(m.parts)||!m.parts.length||
    m.parts.some((p,j)=>p.index!==j||!/^graph\.ndjson\.gz\.part\d{4}$/.test(p.path)||p.bytes<1||p.bytes>m.maximumPartBytes))
    fail('Use a complete immutable exact source snapshot manifest.');
  if(m.parent){
    const bytes=await readFile(resolve(folder,m.parent.path)),p=JSON.parse(bytes);
    if(sha(bytes)!==m.parent.sha256||p.nodeCount!==m.firstNode||p.nodeCount!==m.parent.nodeCount||p.nodesSHA256!==m.parent.nodesSHA256)
      fail('The appended source snapshot lost its exact original parent.');
  }else if(m.firstNode!==0)fail('A source graph suffix requires its exact parent snapshot.');
  let compressedBytes=0,rawBytes=0,rows=0,header=null,expected=m.firstNode;
  const compressedHash=createHash('sha256'),rawHash=createHash('sha256'),
    source=Readable.from((async function*(){for(const p of m.parts){
      const bytes=await readFile(join(folder,p.path));if(bytes.length!==p.bytes||sha(bytes)!==p.sha256)fail('An exact source gzip part changed.');
      compressedBytes+=bytes.length;compressedHash.update(bytes);yield bytes;
    }})()),gunzip=createGunzip();
  const result=pipeline(source,gunzip);
  result.catch(()=>{}); // the for-await path below reports and rethrows it
  gunzip.on('data',bytes=>{rawBytes+=bytes.length;rawHash.update(bytes);});
  const lines=createInterface({input:gunzip,crlfDelay:Infinity});
  try{for await(const line of lines){
    const value=JSON.parse(line);
    if(!header){header=value;if(header.schema!=='MathScope.N6.ExactSourceStageGraphNDJSON/1'||header.firstNode!==m.firstNode||header.nodeCount!==m.nodeCount||
      header.kind!==m.kind||header.key!==m.key||!header.definitions||!header.record)fail('A source snapshot header lost its exact graph or stage binding.');
      await onHeader?.(header);
    }else{
      if(!Array.isArray(value)||value.length!==2||value[0]!==expected++||!value[1]||typeof value[1].op!=='string'||!Array.isArray(value[1].args))
        fail('The exact source node table is incomplete or reordered.');
      rows++;await onNode?.(value[0],value[1]);
    }
  }await result;}catch(error){source.destroy();gunzip.destroy();await result.catch(()=>{});throw error;}
  if(!header||expected!==m.nodeCount||rows!==m.appendedNodeCount||rawBytes!==m.rawBytes||rawHash.digest('hex')!==m.rawSHA256||
    compressedBytes!==m.gzipBytes||compressedHash.digest('hex')!==m.gzipSHA256)
    fail('An exact source graph stream did not reproduce its complete recorded bytes.');
  return {pass:true,manifestSHA256:sha(manifestBytes),nodeCount:m.nodeCount,rows,rawBytes,compressedBytes,header,
    privateSourceAuthorityHydrated:false,numericalValuesSubstituted:false};
}
