/** Produce a scratch-only, byte-reversible overlay of the pinned pressure source. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const [input, output] = process.argv.slice(2);
if (!input || !output || path.resolve(input) === path.resolve(output))
  throw Error('Usage: node prepare.mjs ORIGINAL_PRESSURE OUTPUT_COPY');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const original = fs.readFileSync(input);
assert.equal(sha(original), 'fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d');
const before = original.toString('utf8');
assert.deepEqual(Buffer.from(before, 'utf8'), original);
const newline = before.includes('\r\n') ? '\r\n' : '\n';
const edits = [
  ["import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';",
   "import {captureNodes} from '../../mathscope-m2/navier/mathscope-large-seal.mjs';" + newline +
   "import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';"],
  ['prefix=canonicalStringify(G.nodes)', 'prefix=captureNodes(G.nodes)'],
  ['canonicalStringify(G.nodes.slice(0,prefixCount))===prefix', 'prefix.verify(G.nodes)'],
  ['prefix:canonicalStringify(G.nodes)', 'prefix:captureNodes(G.nodes)'],
  ['seal.prefix!==canonicalStringify(s.G.nodes.slice(0,seal.count))', '!seal.prefix.verify(s.G.nodes)'],
];
let result = before;
const applied = [];
for (const [oldText, newText] of edits) {
  const at = result.indexOf(oldText);
  assert(at >= 0 && result.indexOf(oldText, at + oldText.length) < 0, oldText);
  result = result.slice(0, at) + newText + result.slice(at + oldText.length);
  applied.push({oldText, newText, at});
}
let reversed = result;
for (const {oldText, newText, at} of applied.reverse()) {
  assert.equal(reversed.slice(at, at + newText.length), newText);
  reversed = reversed.slice(0, at) + oldText + reversed.slice(at + newText.length);
}
assert.deepEqual(Buffer.from(reversed, 'utf8'), original);
fs.mkdirSync(path.dirname(path.resolve(output)), {recursive:true});
fs.writeFileSync(output, result, {flag:'wx'});
const receipt = {status:'BYTE_REVERSIBLE_SCRATCH_ONLY', inputSHA256:sha(original),
  outputSHA256:sha(Buffer.from(result)), edits:edits.length, exactByteReversal:true,
  mathChanged:false, nativeReplay:false, release:'HOLD'};
fs.writeFileSync(output + '.receipt.json', JSON.stringify(receipt,null,2)+'\n', {flag:'wx'});
console.log(JSON.stringify(receipt,null,2));
