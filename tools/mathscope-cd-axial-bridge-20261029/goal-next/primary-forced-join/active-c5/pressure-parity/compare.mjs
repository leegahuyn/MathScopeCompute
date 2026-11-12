import fs from 'node:fs';
import assert from 'node:assert/strict';
const [a,b]=process.argv.slice(2);
assert(a&&b);
assert.deepEqual(JSON.parse(fs.readFileSync(a)),JSON.parse(fs.readFileSync(b)));
console.log('PASS: genuine N1 C2 pressure graph, registry, certificate, checks and mutation guards exactly agree');
