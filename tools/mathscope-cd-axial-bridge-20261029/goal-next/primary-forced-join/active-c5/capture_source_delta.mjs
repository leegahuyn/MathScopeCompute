/** A bounded-memory representation of an original append-only source seal. */
import {captureNodes} from '../../mathscope-m2/navier/mathscope-large-seal.mjs';

export function captureSourceDelta(nodes, start) {
  if (!Number.isSafeInteger(start) || start < 0 || start > nodes.length)
    throw new TypeError('Invalid source delta start');
  const snapshot = captureNodes(nodes.slice(start));
  return {verify: live => Array.isArray(live) &&
    snapshot.verify(live.slice(start, start + snapshot.nodeCount), true)};
}
