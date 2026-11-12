import assert from 'node:assert/strict';
import {CompactLookup, CompactDerivativeLookup} from './compact_lookup.mjs';

const internKey = n => '["add",[' + n + ',0]]';
const derivativeKey = n => n + ':0';

for (const [Lookup, key] of [[CompactLookup, internKey], [CompactDerivativeLookup, derivativeKey]]) {
  const legacy = new Map();
  const compact = new Lookup(undefined, 3);
  const both = (name, ...args) => {
    const a = legacy[name](...args), b = compact[name](...args);
    assert.deepEqual(a === legacy ? 'self' : a, b === compact ? 'self' : b);
    assert.equal(compact.size, legacy.size);
    assert.deepEqual([...compact], [...legacy]);
    assert.deepEqual([...compact.keys()], [...legacy.keys()]);
    assert.deepEqual([...compact.values()], [...legacy.values()]);
  };
  for (let i = 0; i < 11; i++) both('set', key(i), i);
  both('set', key(0), 41);
  both('set', key(4), undefined);
  both('has', key(4));
  both('get', key(4));
  both('delete', key(2));
  both('set', key(2), 42);
  const old = legacy.entries(), current = compact.entries();
  assert.deepEqual(current.next(), old.next());
  both('clear');
  both('set', key(99), 99);
  assert.deepEqual(current.next(), old.next());
  assert.deepEqual(current.next(), old.next());
}

if (process.argv.includes('--full-limit')) {
  const count = 2 ** 24 + 17;
  const lookup = new CompactLookup();
  for (let i = 0; i < count; i++) lookup.set(internKey(i), i);
  assert.equal(lookup.size, count);
  for (const i of [0, 2 ** 23 - 1, 2 ** 23, 2 ** 24 - 1, 2 ** 24, count - 1])
    assert.equal(lookup.get(internKey(i)), i);
  let expected = 0;
  for (const value of lookup.values()) {
    if (value !== expected++) throw Error('Intern iteration changed node-ID order');
  }
  assert.equal(expected, count);
  console.log(JSON.stringify({status: 'PASS', entries: count, nodeIDOrderPreserved: true}));
} else {
  console.log('PASS compact intern and derivative table operations across segment boundaries');
}
