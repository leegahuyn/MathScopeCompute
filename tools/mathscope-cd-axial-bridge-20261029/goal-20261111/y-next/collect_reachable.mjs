import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';
import { exactOriginalSourceNodeChildren } from '../y/exact_original_node_children.mjs';
import {
  loadOriginalExtendedNativeRegistry,
  nativeSemanticDefinitionEdges,
} from '../y/original_native_semantic_definitions.mjs';

const NODE_COUNT = 4420257;
const GRAPH_SHA = 'a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269';
const REGISTRY_SHA = 'bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e';
const PROFILE_SHA = 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a';
const NATURAL_IDS_SHA = '962a016d25ad21fe54cf285ecd8192d2a7a47d9a6451a957c6bc9fac5b3d2b00';
const ENTRY_IDS_SHA = 'd688ed77238936fe0fd7e83214b7db0337b1395c2189ef4362b729216de56e44';
const PRIOR_IDS_SHA = '862033a6f22e1a3ad4dddbb993853a113bbeead7e4be867ca1679c68c943b490';
const ROOTS = [4419697,4419698,4419699,4419702,4419723,4420035,4420037,4420039,4420249,4420251,4420253];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const idDigest = ids => sha(JSON.stringify(ids));
const readPinned = (name, hash) => {
  const bytes = fs.readFileSync(name);
  assert.equal(sha(bytes), hash, `Source digest mismatch at ${name}`);
  return bytes;
};

// Each pair is checked against the AST below. Bounds are assigned only to
// real integration-variable occurrences and only inside the integral body.
const groups = [];
function addGroup(y, variable, kind, left, right, count) {
  groups.push({ y, variable, kind, left, right, count, bit: 1 << groups.length });
}
for (const [y, count] of [[3640,6],[3647,12],[3656,6],[3663,6],[3672,6]]) {
  addGroup(y, y, 'identity', 0, 3628, count);
}
for (const [y, variable, count] of [[3684,3682,12],[3703,3701,6]]) {
  addGroup(y, variable, 'fourExp', 3612, 3625, count);
}
for (const [y, count] of [[4487,5],[4492,10],[4501,5],[4508,5],[4516,5],[6319,5],[6326,5],[6334,5]]) {
  addGroup(y, y, 'identity', 0, 474, count);
}
for (const [y, variable, count] of [[28890,28879,2],[28908,28906,4],[28955,28944,4]]) {
  addGroup(y, variable, 'scaled', 0, 28823, count);
}
const byY = new Map(groups.map(group => [group.y, group]));
const byVariable = new Map(groups.map(group => [group.variable, group]));
assert.equal(byVariable.size, groups.length);

function binderTransfer(openBody, openLeft, openRight, boundBit, fixed) {
  return {
    open: (openBody & ~boundBit) | openLeft | openRight,
    sealed: fixed ? 0 : openBody & boundBit,
  };
}

function authenticateBinderAndNativeProducer() {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const read = (name, hash) => readPinned(path.join(moduleDir, '..', 'y', 'producer', name), hash).toString('utf8');
  const exactFunctions = read('actual-continuation-exact-functions.mjs',
    '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311');
  const baseExpressions = read('actual-global-source-expressions.mjs',
    'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3');
  assert(baseExpressions.includes("this.node('definite_integral',[body,variable,left,right])"));
  assert(baseExpressions.includes('lo=ev(a,env),hi=ev(b,env),name=program.nodes[t].args[0]'));
  assert(baseExpressions.includes('ev(f,{...env,[name]:lo+k*h})'));
  assert(exactFunctions.includes('left=this.substitute(left,variable,value);right=this.substitute(right,variable,value);'));
  assert(exactFunctions.includes("const renamed=this.fresh('alpha_renamed_integral')"));
  assert(exactFunctions.includes('const out=this.simultaneousSubstitute(body,s.parameters,values)'));
  assert(exactFunctions.includes('this.expressionSystems.push({name,parameters:[...parameters],body,derivativeLimits:[...derivativeLimits]'));
  assert(exactFunctions.includes('expression:JSON.stringify(this.expressionSystems)'));
  return {
    sourceCommit:'a9b3a5b317525f6d0a71e2e356b054c9d25d2e60',
    exactFunctionsBlob:'1684bc230b42b766821c633ee3fb961198aa616c',
    baseExpressionsBlob:'854bb862276d03c236b2df73ba1bb9a61373c4df',
    scope:'The pinned producer constructs, substitutes and evaluates the integral binder with body-only scope. Expression-native materialization substitutes its registered formal list hygienically.',
  };
}

function pins() {
  return new Map(Object.entries({
    0: ['rational',['0','1']], 2: ['coordinate',['eta']], 24: ['rational',['2','1']],
    474: ['rational',['4','1']], 3454: ['source_parameter',['Lambda']],
    3612: ['source_parameter',['t1']], 3617: ['source_parameter',['Xa']],
    3623: ['exp',[3612]], 3624: ['multiply',[3617,3623]],
    3625: ['multiply',[24,3612]], 3628: ['multiply',[3454,3624]],
    28820: ['rational',['1','32']], 28821: ['multiply',[3612,28820]],
    28822: ['exp',[28821]], 28823: ['multiply',[3617,28822]],
  }).map(([id, expected]) => [Number(id), expected]));
}

function authenticateArithmetic(profilePath) {
  readPinned(profilePath, PROFILE_SHA);
  // For the pinned profile: Q>1 implies logCSelected>1, hence CSelected>e>2
  // and 0<t1=CSelected^-120<2^-120. Lambda=Q^64 and Xa=4/Lambda.
  // All certified exponential arguments are <=2*t1<1/64. The series
  // comparison exp(s)<=1/(1-s) then gives a common strict bound 256/63.
  assert(2n * 64n < 2n ** 120n);
  assert(256n * 10n < 41n * 63n);
}

async function verify(graphDir, profilePath) {
  authenticateArithmetic(profilePath);
  const producer = authenticateBinderAndNativeProducer();
  const manifest = JSON.parse(fs.readFileSync(path.join(graphDir, 'original-source-export-manifest.json')));
  assert.deepEqual(manifest.original_root_ids, ROOTS);
  assert.equal(manifest.node_stream_sha256, GRAPH_SHA);
  assert.equal(manifest.definitions_sha256, REGISTRY_SHA);
  assert.equal(manifest.final_all_cycle_A_b_p, false);
  const registry = loadOriginalExtendedNativeRegistry(JSON.parse(readPinned(
    path.join(graphDir, 'original-source-functions.json'), REGISTRY_SHA,
  )));

  const offsets = new Uint32Array(NODE_COUNT + 1);
  const edges = new Uint32Array(9749737);
  let edgeCount = 0;
  const all = new Uint32Array(NODE_COUNT);
  const open = new Uint32Array(NODE_COUNT);
  const sealed = new Uint32Array(NODE_COUNT);
  const nativeEdges = new Map();
  const unresolvedNative = new Map();
  const nativeCache = new Map();
  const early = [];
  const natural = [];
  const binderRecords = [];
  const expected = pins();
  const pinnedStreamHash = createHash('sha256');
  const gunzip = fs.createReadStream(path.join(graphDir, 'original-source-nodes.jsonl.gz')).pipe(createGunzip());
  gunzip.on('data', chunk => pinnedStreamHash.update(chunk));
  const reader = readline.createInterface({ input: gunzip, crlfDelay: Infinity });

  let index = -1;
  for await (const line of reader) {
    const node = JSON.parse(line);
    if (index < 0) {
      assert.deepEqual(node, {schema:'MathScope.M3.FullNodesJSONL/1', node_count:NODE_COUNT});
      index = 0;
      continue;
    }
    const { op, args } = node;
    assert(index < NODE_COUNT);
    if (index <= 28955) early.push(node);
    if (expected.has(index)) {
      assert.deepEqual([op, args], expected.get(index), `Pinned operand #${index}`);
      expected.delete(index);
    }

    const children = exactOriginalSourceNodeChildren(node);
    offsets[index] = edgeCount;
    let seenHere = 0;
    let openHere = 0;
    let sealedHere = 0;
    if (op === 'actual_natural_series') {
      const group = byY.get(args[1]);
      if (group) seenHere = openHere = group.bit;
      natural.push({ id:index, component:args[0], y:args[1], eta:args[2], k:args[3], m:args[4] });
    } else if (op.startsWith('actual_') || op.startsWith('m3_')) {
      const key = `${op}:${JSON.stringify(args[0])}`;
      if (!nativeCache.has(key)) nativeCache.set(key, nativeSemanticDefinitionEdges(node, registry));
      const def = nativeCache.get(key);
      if (def?.resolved) nativeEdges.set(index, def.bodyRoots);
      else unresolvedNative.set(index, op);
    }
    for (const child of children) {
      assert(child >= 0 && child < index);
      assert(edgeCount < edges.length);
      edges[edgeCount++] = child;
      seenHere |= all[child];
      sealedHere |= sealed[child];
    }
    if (op === 'definite_integral') {
      const [body, variable, left, right] = args;
      const group = byVariable.get(variable);
      const fixed = group && left === group.left && right === group.right;
      const transfer = binderTransfer(open[body], open[left], open[right], group?.bit ?? 0, fixed);
      openHere |= transfer.open;
      sealedHere |= transfer.sealed;
      if (group && (all[body] & group.bit)) {
        binderRecords.push({ integral:index, body, variable, left, right,
          certifiedFixedInterval:Boolean(fixed), discharge:Boolean(fixed && (open[body] & group.bit)) });
      }
    } else {
      for (const child of children) openHere |= open[child];
    }
    all[index] = seenHere;
    open[index] = openHere;
    sealed[index] = sealedHere;
    index++;
  }
  offsets[index] = edgeCount;
  assert.equal(index, NODE_COUNT);
  assert.equal(edgeCount, edges.length);
  assert.equal(expected.size, 0);
  assert.equal(pinnedStreamHash.digest('hex'), GRAPH_SHA);
  for (const group of groups) {
    assert.equal(early[group.variable].op, 'coordinate');
    if (group.kind === 'identity') assert.equal(group.y, group.variable);
    else if (group.kind === 'scaled') {
      assert.deepEqual(early[group.y], {op:'multiply', args:[3454,group.variable]});
    } else {
      const node = early[group.y];
      assert.equal(node.op, 'multiply');
      assert.equal(node.args[0], 474);
      assert.deepEqual(early[node.args[1]], {op:'exp', args:[group.variable]});
    }
  }

  // Native scope is entered from its declared roots with an empty binder
  // context. No proof is ever borrowed from the calling scope, even when
  // its binder uses the same original coordinate ID.
  const reached = new Uint8Array(NODE_COUNT);
  const entrySet = new Set();
  const queue = [];
  function push(id) {
    assert(Number.isSafeInteger(id) && id >= 0 && id < NODE_COUNT);
    if (!reached[id]) {
      reached[id] = 1;
      queue.push(id);
    }
  }
  ROOTS.forEach(push);
  for (let j = 0; j < queue.length; ++j) {
    const id = queue[j];
    assert(!unresolvedNative.has(id), `Unresolved reached native op ${unresolvedNative.get(id)} #${id}`);
    for (let e = offsets[id]; e < offsets[id + 1]; ++e) push(edges[e]);
    for (const entry of nativeEdges.get(id) ?? []) {
      entrySet.add(entry);
      push(entry);
    }
  }
  const entries = [...entrySet].sort((a,b) => a-b);
  assert.equal(queue.length, 159655);
  assert.equal(entries.length, 1745);
  assert.equal(idDigest(entries), ENTRY_IDS_SHA);
  const calls = natural.filter(call => reached[call.id]);
  assert.equal(calls.length, 523);
  assert.equal(idDigest(calls.map(call => call.id)), NATURAL_IDS_SHA);
  assert(calls.every(call => call.eta === 2));

  const sourceBodies = [...nativeEdges].filter(([id]) => reached[id]);
  const nodes = [];
  for await (const [id, node] of originalNodes(graphDir)) {
    if (reached[id]) nodes.push([id,node]);
  }
  return {roots:ROOTS, entries, calls, nodes, sourceBodies};
}
async function* originalNodes(graphDir) {
  const stream = fs.createReadStream(path.join(graphDir, 'original-source-nodes.jsonl.gz')).pipe(createGunzip());
  const proofStreamHash = createHash('sha256');
  stream.on('data', chunk => proofStreamHash.update(chunk));
  let id=-1;
  for await (const line of readline.createInterface({input:stream,crlfDelay:Infinity})) {
    if (id>=0) yield [id,JSON.parse(line)];
    id++;
  }
  assert.equal(id,NODE_COUNT);
  assert.equal(proofStreamHash.digest('hex'),GRAPH_SHA);
}
const [graphDir, profilePath, output] = process.argv.slice(2);
const result = await verify(graphDir, profilePath);
fs.writeFileSync(output, JSON.stringify(result));
console.log(JSON.stringify({nodes:result.nodes.length,calls:result.calls.length,entries:result.entries.length}));
