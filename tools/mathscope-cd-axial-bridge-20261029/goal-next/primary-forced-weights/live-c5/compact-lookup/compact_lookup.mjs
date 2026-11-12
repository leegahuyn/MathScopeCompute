/** Reversible representation of the original JSON-string-key Map.
 * Only canonical two-nonnegative-integer add/multiply keys are packed.
 * All other strings keep their original representation. The public key
 * interface and iteration order remain those of Map<string, number>.
 */
const BASE = 2 ** 25;
const pattern = /^\["(add|multiply)",\[(0|[1-9][0-9]*),(0|[1-9][0-9]*)\]\]$/;

export function encodeKey(key) {
  if (typeof key !== 'string') throw TypeError('Original graph intern keys are JSON strings');
  const match = pattern.exec(key);
  if (match === null) return key;
  const a = Number(match[2]), b = Number(match[3]);
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a >= BASE || b >= BASE) return key;
  const code = (a * BASE + b) * 2 + Number(match[1] === 'multiply');
  if (!Number.isSafeInteger(code)) throw Error('Packed key not exactly representable');
  return code;
}

export function decodeKey(key) {
  if (typeof key === 'string') return key;
  if (!Number.isSafeInteger(key) || key < 0 || key >= 2 * BASE ** 2) throw Error('Invalid internal key');
  const op = key % 2 ? 'multiply' : 'add';
  const pair = Math.floor(key / 2), a = Math.floor(pair / BASE), b = pair % BASE;
  return JSON.stringify([op, [a, b]]);
}

const SEGMENT_LIMIT = 2 ** 23;

/** Each segment contains consecutive insertions. Updating an existing key
 * keeps its position, and reinserting a deleted key goes at the end. */
class PackedLookup extends Map {
  #segments = [new Map()];
  #count = 0;
  #limit;
  #encode;
  #decode;

  constructor(encode, decode, entries, limit) {
    super();
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > SEGMENT_LIMIT)
      throw new RangeError('Invalid intern segment limit');
    this.#encode = encode;
    this.#decode = decode;
    this.#limit = limit;
    if (entries != null) for (const [key, value] of entries) this.set(key, value);
  }

  get size() { return this.#count; }

  #find(key) {
    for (let i = this.#segments.length - 1; i >= 0; i--) {
      const segment = this.#segments[i];
      if (segment.has(key)) return segment;
    }
  }

  has(key) { return this.#find(this.#encode(key)) !== undefined; }

  get(key) {
    const encoded = this.#encode(key);
    for (let i = this.#segments.length - 1; i >= 0; i--) {
      const value = this.#segments[i].get(encoded);
      if (value !== undefined) return value;
    }
  }

  set(key, value) {
    const encoded = this.#encode(key);
    let segment = this.#find(encoded);
    if (!segment) {
      segment = this.#segments.at(-1);
      if (segment.size === this.#limit) {
        segment = new Map();
        this.#segments.push(segment);
      }
      this.#count++;
    }
    segment.set(encoded, value);
    return this;
  }

  delete(key) {
    const encoded = this.#encode(key);
    const segment = this.#find(encoded);
    if (!segment) return false;
    segment.delete(encoded);
    this.#count--;
    return true;
  }

  clear() {
    for (const segment of this.#segments) segment.clear();
    this.#count = 0;
  }

  *entries() {
    for (const segment of this.#segments)
      for (const [key, value] of segment) yield [this.#decode(key), value];
  }

  *keys() {
    for (const segment of this.#segments)
      for (const key of segment.keys()) yield this.#decode(key);
  }

  *values() {
    for (const segment of this.#segments) yield* segment.values();
  }

  [Symbol.iterator]() { return this.entries(); }
  forEach(callback, thisArg) {
    if (typeof callback !== 'function') throw new TypeError('Expected a callback');
    for (const [key, value] of this) callback.call(thisArg, value, key, this);
  }
}

export class CompactLookup extends PackedLookup {
  constructor(entries, limit = SEGMENT_LIMIT) { super(encodeKey, decodeKey, entries, limit); }
}

/** Preserve every legacy key/value and insertion order. The caller may
 * discard the old table; mutating/deleting it here is intentionally avoided.
 */
export function compactFromLegacy(legacy) {
  if (!(legacy instanceof Map)) throw TypeError('Expected source lookup Map');
  const result = new CompactLookup();
  for (const [k,v] of legacy) result.set(k,v);
  if (result.size !== legacy.size) throw Error('Lossy intern table conversion');
  return result;
}

// The source derivative memo uses only the literal string form `node:var`.
// Keeping all other strings intact makes this reversible on its full domain.
const pairPattern = /^(0|[1-9][0-9]*):(0|[1-9][0-9]*)$/;
function encodePair(k) {
  if (typeof k !== 'string') throw TypeError('Original derivative keys are strings');
  const m=pairPattern.exec(k); if (!m) return k;
  const a=Number(m[1]),b=Number(m[2]);
  return a<BASE && b<BASE ? a*BASE+b : k;
}
function decodePair(k) {
  if(typeof k==='string')return k;
  if(!Number.isSafeInteger(k)||k<0||k>=BASE**2)throw Error('Invalid derivative key');
  return Math.floor(k/BASE)+':'+(k%BASE);
}
export class CompactDerivativeLookup extends PackedLookup {
  constructor(entries, limit = SEGMENT_LIMIT) { super(encodePair, decodePair, entries, limit); }
}
export function compactDerivativesFromLegacy(legacy){
  if(!(legacy instanceof Map))throw TypeError('Expected source derivative Map');
  const out=new CompactDerivativeLookup();for(const [k,v]of legacy)out.set(k,v);
  if(out.size!==legacy.size)throw Error('Lossy derivative table conversion');return out;
}
