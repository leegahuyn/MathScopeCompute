import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  prepareActualPositiveGlobalStress,
} from '../../../goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/actual-positive-global-stress.mjs';

const proof = prepareActualPositiveGlobalStress({ order: 3, maxNodes: 2200000 });
const count = 123869;
const nativePrefix = proof.G.nodes.slice(0, count);
const sha256 = createHash('sha256').update(JSON.stringify(nativePrefix)).digest('hex');
assert.equal(nativePrefix.length, count);
assert.equal(sha256, '89cf4399ac52722aec46382217924afa5670198a4a7fad2429728b7f296f38e6');
console.log(JSON.stringify({ count, sha256 }));
