import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {writeExactStageSnapshot,verifyExactStageSnapshot} from './exact-stage-snapshot.mjs';

function graph(){
  const G=new ActualConvergentExpressions(),x=G.fresh('snapshot_x');let body=x;
  for(let j=1;j<=350;j++)body=G.add(body,G.mul(G.q(j,j+3),G.exp(G.add(x,G.q(j,j+1)))));
  return {G,x,body};
}

test('a streamed full scalar table and exact operator definitions round-trip through ordered bounded gzip parts',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'mathscope-exact-stage-'));
  try{
    const {G,body}=graph(),snapshot=await writeExactStageSnapshot({G,record:{body,complete:false},kind:'source-control',directory,partBytes:1024}),
      nodes=[],result=await verifyExactStageSnapshot(snapshot.manifestPath,{onNode:(id,node)=>{nodes[id]=node;}});
    assert.equal(result.pass,true);assert.deepEqual(nodes,G.nodes);assert.deepEqual(result.header.definitions,G.captureFunctionDefinitions());
    assert.deepEqual(result.header.record,{body,complete:false});assert.ok(snapshot.parts.length>1);
    assert.ok(snapshot.parts.every(p=>p.bytes<=1024));assert.equal(snapshot.allLiveSourceNodeBytesUnchangedDuringWrite,true);
    assert.equal(snapshot.privateSourceAuthorityHydrated,false);assert.equal(result.privateSourceAuthorityHydrated,false);
    assert.equal(snapshot.nodeCount,G.nodes.length);assert.equal(snapshot.appendedNodeCount,G.nodes.length);
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('an appended graph rechecks the complete original prefix and records only its exact new nodes',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'mathscope-exact-stage-'));
  try{
    const {G,x,body}=graph(),first=await writeExactStageSnapshot({G,record:{body},kind:'first',directory:join(directory,'first')}),
      before=G.nodes.length,next=G.mul(G.sine(x),G.exp(body)),second=await writeExactStageSnapshot({G,record:{body:next},kind:'second',
        directory:join(directory,'second'),parent:first}),nodes=[];
    const verified=await verifyExactStageSnapshot(second.manifestPath,{onNode:(id,node)=>{nodes.push([id,node]);}});
    assert.equal(verified.pass,true);assert.equal(second.firstNode,before);assert.equal(second.parent.sha256,first.sha256);
    assert.equal(second.allPrefixNodeBytesReverified,true);assert.deepEqual(nodes,G.nodes.slice(before).map((n,j)=>[before+j,n]));
    assert.equal(second.nodeCount,G.nodes.length);
    await assert.rejects(()=>writeExactStageSnapshot({G,record:{body},kind:'cloned',directory:join(directory,'cloned'),parent:{...second}}),{code:'INVALID_SOURCE_SNAPSHOT'});
    const old=G.nodes[x].args[0];G.nodes[x].args[0]='changed_original_coordinate';
    try{await assert.rejects(()=>writeExactStageSnapshot({G,record:{body},kind:'mutated',directory:join(directory,'mutated'),parent:second}),{code:'INVALID_SOURCE_SNAPSHOT'});}
    finally{G.nodes[x].args[0]=old;}
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('changed graph bytes, missing or reordered gzip parts and a different parent manifest fail closed',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'mathscope-exact-stage-'));
  try{
    const {G,body}=graph(),first=await writeExactStageSnapshot({G,record:{body},kind:'first',directory:join(directory,'first'),partBytes:1024}),
      p=join(directory,'first',first.parts[0].path),bytes=await readFile(p),changed=Buffer.from(bytes);changed[changed.length-1]^=1;
    await writeFile(p,changed);await assert.rejects(()=>verifyExactStageSnapshot(first.manifestPath),{code:'INVALID_SOURCE_SNAPSHOT'});await writeFile(p,bytes);
    const manifestBytes=await readFile(first.manifestPath),manifest=JSON.parse(manifestBytes);manifest.parts.reverse();
    await writeFile(first.manifestPath,JSON.stringify(manifest));await assert.rejects(()=>verifyExactStageSnapshot(first.manifestPath),{code:'INVALID_SOURCE_SNAPSHOT'});
    await writeFile(first.manifestPath,manifestBytes);
    const second=await writeExactStageSnapshot({G,record:{body},kind:'second',directory:join(directory,'second'),parent:first});
    await writeFile(first.manifestPath,Buffer.concat([manifestBytes,Buffer.from(' ')]));
    await assert.rejects(()=>verifyExactStageSnapshot(second.manifestPath),{code:'INVALID_SOURCE_SNAPSHOT'});
  }finally{await rm(directory,{recursive:true,force:true});}
});
