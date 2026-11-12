/** Install the exact tested current helper into an already-created scratch pair. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const [scratch]=process.argv.slice(2);if(!scratch)throw Error('Usage: node install_current.mjs SCRATCH_PAIR');
const own=path.dirname(fileURLToPath(import.meta.url));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const input=fs.readFileSync(path.join(own,'current-helper.mjs'));
assert.equal(sha(input),'94df5d1171246de92226d11fc1710a1453c9399fe054400f00feeb7f29916019');
const target=path.join(scratch,'overlay/research-ide/mathscope-m2/navier/mathscope-large-seal.mjs');
assert.equal(sha(fs.readFileSync(target)),'81bb2348dada517cc7cc76adc78b617703ba3f83f9a3f578e62c5394f8b49fc8');
fs.writeFileSync(target,input);
assert.equal(sha(fs.readFileSync(target)),sha(input));
console.log('PASS: current workflow helper installed into scratch overlay');
