/** Shared bounded P8 JSON helpers. These functions confer no proof authority. */
import {canonicalProofJSON, proofSha256} from '../../mathscope-m0/proof.mjs';

export const OBJECT_KINDS = Object.freeze(['CW_TOY', 'DERIVED_MODEL', 'PRISMATIC_VIA_COMPARISON', 'NATIVE_PRISMATIC']);
export const ARITHMETIC_MODES = Object.freeze(['EXACT', 'BALL', 'APPROXIMATE']);
export const PROOF_METHODS = Object.freeze(['NONE', 'LEAN_KERNEL', 'EXTERNAL_THEOREM', 'HYPOTHESIS']);
export const NO_AUTHORITY = Object.freeze({certificateIssued:false, formalComplete:false, wholeP8Complete:false, wholeM3Complete:false});
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,239}$/;
const LEAN_NAME = /^[A-Za-z_][A-Za-z0-9_.']*$/;

export function fail(code, message) { throw Object.assign(new TypeError(message), {code}); }
export function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
export function shape(value, required, optional=[], label='object') {
  if (!isObject(value)) fail('INVALID_OBJECT', `${label} must be an ordinary JSON object.`);
  const allowed = new Set([...required, ...optional]);
  if (required.some(key => !Object.hasOwn(value, key)) || Object.keys(value).some(key => !allowed.has(key))) fail('INVALID_FIELDS', `${label} has missing or unsupported fields.`);
}
export function string(value, label, max=65536) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail('INVALID_STRING', `${label} must be nonempty text within its budget.`);
  // TextEncoder replaces isolated UTF-16 surrogates; reject before hashing.
  for (let i=0; i<value.length; i++) {
    const c=value.charCodeAt(i);
    if (c>=0xd800 && c<=0xdbff) { const d=value.charCodeAt(++i); if (!(d>=0xdc00 && d<=0xdfff)) fail('INVALID_UNICODE', `${label} contains an unpaired surrogate.`); }
    else if (c>=0xdc00 && c<=0xdfff) fail('INVALID_UNICODE', `${label} contains an unpaired surrogate.`);
  }
  return value;
}
export function id(value, label='id') { string(value,label,240); if (!ID.test(value)) fail('INVALID_ID', `${label} is not a supported identifier.`); return value; }
export function hashString(value, label='hash') { if (typeof value !== 'string' || !HASH.test(value)) fail('INVALID_HASH', `${label} must be a lower-case SHA-256.`); return value; }
export function declaration(value) { string(value,'Lean declaration',240); if (!LEAN_NAME.test(value)) fail('INVALID_DECLARATION','Use an explicit Lean declaration name.'); return value; }
export function reference(value) { shape(value,['id','revision','hash'],[],'reference'); id(value.id); string(value.revision,'reference revision',240); hashString(value.hash); return value; }
export function references(values, label='references') {
  if (!Array.isArray(values) || values.length>256) fail('REFERENCE_BUDGET', `${label} must be a bounded array.`);
  const ids=new Set(); for (const ref of values) { reference(ref); if (ids.has(ref.id)) fail('DUPLICATE_REFERENCE',`${label} contains duplicate IDs.`); ids.add(ref.id); }
}
export function assertJSON(value, maxBytes=2*1024*1024) {
  let count=0; const seen=new Set();
  function visit(v,depth) {
    if (++count>100000 || depth>48) fail('JSON_BUDGET','JSON nesting or item budget exceeded.');
    if (v===null || typeof v==='boolean') return;
    if (typeof v==='string') { if (v.length) string(v.trim() ? v : 'x','JSON text',maxBytes); return; }
    if (typeof v==='number') { if (!Number.isFinite(v) || Number.isInteger(v) && !Number.isSafeInteger(v)) fail('UNSAFE_JSON_NUMBER','Use exact strings for integers outside the safe integer range; nonfinite numbers are not data.'); return; }
    if (!Array.isArray(v) && !isObject(v)) fail('NON_JSON_VALUE','Only ordinary JSON values are accepted.');
    if (seen.has(v)) fail('JSON_CYCLE','Cyclic or aliased object references are not JSON input.'); seen.add(v);
    if (Object.getOwnPropertySymbols(v).length || Array.isArray(v) && (Object.keys(v).length!==v.length || Object.keys(v).some((k,i)=>k!==String(i)))) fail('NON_JSON_VALUE','Symbol properties, sparse arrays and array decorations are not JSON data.');
    if (!Array.isArray(v) && Object.getOwnPropertyNames(v).length!==Object.keys(v).length) fail('NON_JSON_VALUE','Hidden properties are not JSON data.');
    for (const key of Object.keys(v)) {
      string(key,'JSON key',1024);
      if (['__proto__','prototype','constructor'].includes(key)) fail('UNSAFE_KEY','Prototype-related keys are not supported.');
      const descriptor=Object.getOwnPropertyDescriptor(v,key);
      if (!descriptor || !Object.hasOwn(descriptor,'value')) fail('NON_JSON_VALUE','Accessor properties are not JSON data.');
      visit(descriptor.value,depth+1);
    }
    seen.delete(v);
  }
  visit(value,0);
  const text=canonicalProofJSON(value);
  if (new TextEncoder().encode(text).length>maxBytes) fail('JSON_BUDGET','Canonical JSON exceeds the byte budget.');
  return value;
}
export const canonicalJSON = value => canonicalProofJSON(assertJSON(value,16*1024*1024));
export const sha256 = value => proofSha256(typeof value==='string' ? string(value,'hashed text',16*1024*1024) : canonicalJSON(value));
export const cloneJSON = value => JSON.parse(canonicalJSON(value));
export function freeze(value) { if (value && typeof value==='object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
export function issue(error) { return {code:error.code || 'INVALID_CONTRACT',message:String(error.message || error)}; }
