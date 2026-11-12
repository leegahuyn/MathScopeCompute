/** An intern table fork over one immutable node-ID prefix. */
import {CompactLookup, compactDerivativesFromLegacy} from './mathscope-compact-lookup.mjs';

export {compactDerivativesFromLegacy};

class OwnedLookup extends CompactLookup {
  #protected = false;

  protectPrefix() { this.#protected = true; }

  set(key, id) {
    if (this.#protected && super.has(key)) {
      if (super.get(key) !== id) throw new Error('Cannot change a captured intern key');
      return this;
    }
    return super.set(key, id);
  }

  delete(key) {
    if (this.#protected) throw new Error('Cannot delete a captured intern key');
    return super.delete(key);
  }

  clear() {
    if (this.#protected) throw new Error('Cannot clear a captured intern table');
    super.clear();
  }
}

class ForkedLookup extends OwnedLookup {
  #source;
  #count;

  constructor(source, count) {
    super();
    this.#source = source;
    this.#count = count;
    source.protectPrefix();
  }

  get size() { return this.#count + super.size; }

  get(key) {
    if (super.has(key)) return super.get(key);
    const id = this.#source.get(key);
    return id < this.#count ? id : undefined;
  }

  has(key) { return this.get(key) !== undefined; }

  set(key, id) {
    const prior = this.get(key);
    if (prior !== undefined) {
      if (prior !== id) throw new Error('Cannot replace a node-ID intern binding');
      return this;
    }
    if (id !== this.size) throw new Error('Nonconsecutive intern node ID');
    return super.set(key, id);
  }

  delete() { throw new Error('An intern fork is append-only'); }

  clear() { throw new Error('An intern fork is append-only'); }

  *entries() {
    for (const [key,id] of this.#source) {
      if (id >= this.#count) break;
      yield [key,id];
    }
    yield* super.entries();
  }

  *keys() { for (const [key] of this.entries()) yield key; }

  *values() { for (const [,id] of this.entries()) yield id; }
}

export function compactOwnedLookup(legacy, nodeCount) {
  if (!(legacy instanceof Map) || legacy.size !== nodeCount)
    throw new Error('Original intern table is not dense in the node prefix');
  const compact = new OwnedLookup();
  let next = 0;
  for (const [key,id] of legacy) {
    if (id !== next++) throw new Error('Original intern table is not in node-ID order');
    compact.set(key,id);
  }
  if (compact.size !== nodeCount) throw new Error('Original intern key packing changed a key');
  return compact;
}

export function canForkOwnedLookup(lookup) { return lookup instanceof OwnedLookup; }

export function forkOwnedLookup(lookup, nodeCount) {
  if (!canForkOwnedLookup(lookup) || lookup.size !== nodeCount)
    throw new Error('Fork requires the complete captured original intern table');
  return new ForkedLookup(lookup,nodeCount);
}
