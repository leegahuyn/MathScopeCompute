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

export class CompactLookup extends Map {
  has(k) { return super.has(encodeKey(k)); }
  get(k) { return super.get(encodeKey(k)); }
  set(k, v) { super.set(encodeKey(k), v); return this; }
  delete(k) { return super.delete(encodeKey(k)); }
  *entries() { for (const [k,v] of super.entries()) yield [decodeKey(k),v]; }
  *keys() { for (const k of super.keys()) yield decodeKey(k); }
  [Symbol.iterator]() { return this.entries(); }
  forEach(callback, thisArg) { for (const [k,v] of this) callback.call(thisArg,v,k,this); }
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
export class CompactDerivativeLookup extends Map {
  has(k){return super.has(encodePair(k));}
  get(k){return super.get(encodePair(k));}
  set(k,v){super.set(encodePair(k),v);return this;}
  delete(k){return super.delete(encodePair(k));}
  *entries(){for(const [k,v]of super.entries())yield [decodePair(k),v];}
  *keys(){for(const k of super.keys())yield decodePair(k);}
  [Symbol.iterator](){return this.entries();}
  forEach(callback,thisArg){for(const [k,v]of this)callback.call(thisArg,v,k,this);}
}
export function compactDerivativesFromLegacy(legacy){
  if(!(legacy instanceof Map))throw TypeError('Expected source derivative Map');
  const out=new CompactDerivativeLookup();for(const [k,v]of legacy)out.set(k,v);
  if(out.size!==legacy.size)throw Error('Lossy derivative table conversion');return out;
}
