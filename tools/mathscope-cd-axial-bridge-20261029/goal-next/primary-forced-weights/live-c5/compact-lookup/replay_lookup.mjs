import assert from 'node:assert/strict';
import {createReadStream,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {CompactLookup,compactFromLegacy,CompactDerivativeLookup,encodeKey,decodeKey} from './compact_lookup.mjs';

const [mode,file,limitArg] = process.argv.slice(2), limit=Number(limitArg);
assert(['baseline','compact','differential'].includes(mode) && file && Number.isSafeInteger(limit) && limit>0);
assert(global.gc,'Use --expose-gc for reproducible retained-heap measurements');
assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),'9b2e16a14fe0daf81e4325d05eb5966d74164e34b537da1fb3abc4d95754751c','original graph gzip');
const key=(op,a,b)=>JSON.stringify([op,[a,b]]), base=2**25;
const add=key('add',1,0),mul=key('multiply',1,0),edge=key('add',base-1,base-1),outside=key('add',base,0);
assert.notEqual(encodeKey(add),encodeKey(mul));
assert.equal(typeof encodeKey(edge),'number');assert.equal(typeof encodeKey(outside),'string');
for(const s of [add,mul,edge,outside,'["add",[01,0]]','["add",[-1,0]]','["other",[1,0]]'])
  assert.equal(decodeKey(encodeKey(s)),s);
// Mutation witnesses: removing op bit merges add and multiply; packing an
// out-of-range b without rejection merges (a,base) with (a+1,0).
const badNoOpcode=(op,a,b)=>a*base+b, badNoRange=(a,b)=>a*base+b;
assert.equal(badNoOpcode('add',1,0),badNoOpcode('multiply',1,0));
assert.equal(badNoRange(1,base),badNoRange(2,0));
assert.notEqual(encodeKey(key('add',1,base)),encodeKey(key('add',2,0)));
for(let a=0;a<256;a++)for(let b=0;b<256;b++)for(const op of ['add','multiply']){
  const s=key(op,a,b);assert.equal(decodeKey(encodeKey(s)),s);
}
const trial=new Map([['x',4],[add,5],['z',6],[mul,7]]),converted=compactFromLegacy(trial);
assert(converted instanceof Map);assert.deepEqual([...converted],[...trial]);
assert.deepEqual([...new Map(converted)],[...trial]);
assert.deepEqual([...converted.keys()],[...trial.keys()]);
const visited=[];converted.forEach((v,k,m)=>{assert.equal(m,converted);visited.push([k,v])});
assert.deepEqual(visited,[...trial]);assert.equal(converted.delete('x'),true);assert.equal(converted.has('x'),false);
const derivative=new CompactDerivativeLookup(),ordinary=new Map();
for(const [k,v]of [['1:0',1],['0:1',2],[`${base-1}:${base-1}`,3],[`1:${base}`,4],['01:1',5]]){
  derivative.set(k,v);ordinary.set(k,v);
}
assert.equal(derivative.size,ordinary.size);assert.deepEqual([...derivative],[...ordinary]);
assert.deepEqual([...new Map(derivative)],[...ordinary]);
for(const [k,v]of ordinary)assert.equal(derivative.get(k),v);

const maps=mode==='differential'?[new Map(),new CompactLookup()]:[mode==='baseline'?new Map():new CompactLookup()];
let count=0,duplicates=0,packed=0,header;
const hash=createHash('sha256');
const start=Date.now();
for await(const line of createInterface({input:createReadStream(file).pipe(createGunzip()),crlfDelay:Infinity})){
  if(!header){header=JSON.parse(line);assert.equal(header.schema,'MathScope.M3.FullNodesJSONL/1');continue;}
  const n=JSON.parse(line), k=JSON.stringify([n.op,n.args]);
  if(typeof encodeKey(k)==='number')packed++;
  const ids=maps.map(map=>{
    let result=map.get(k);
    if(result===undefined){result=count;map.set(k,result)}
    return result;
  });
  if(ids[0]!==count)duplicates++;
  if(ids.length===2)assert.equal(ids[0],ids[1],'different canonical intern ID at source line '+count);
  hash.update(JSON.stringify([n,ids[0]])+'\n');
  count++;
  if(count===limit)break;
}
assert.equal(count,Math.min(limit,header.node_count));
if(mode==='differential'){
  assert.equal(maps[0].size,maps[1].size);
  const a=maps[0].entries(),b=maps[1].entries();
  for(;;){const x=a.next(),y=b.next();assert.equal(x.done,y.done);if(x.done)break;assert.deepEqual(x.value,y.value)}
}
global.gc();
const mem=process.memoryUsage();
console.log(JSON.stringify({mode,count,sourceNodeCount:header.node_count,duplicates,packed,packedFraction:packed/count,
  lookupSize:maps[0].size,recordAndInternSHA256:hash.digest('hex'),heapUsed:mem.heapUsed,rss:mem.rss,
  elapsedMs:Date.now()-start,allRowsAndMapIterationAgree:mode==='differential',release:'HOLD'}));
