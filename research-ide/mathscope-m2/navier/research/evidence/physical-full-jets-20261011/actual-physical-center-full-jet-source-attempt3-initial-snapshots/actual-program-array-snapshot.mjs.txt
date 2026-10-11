/** Preserve the array membership of one packed expression program.
 *
 * Legacy pack() methods deliberately expose appendable graph/system arrays.
 * A certificate must retain their membership at its own sealing time, while
 * subsequent attachments may append to the live graph. Existing node and
 * definition objects are NOT cloned: the caller's canonical prefix and
 * definition checks must still reject mutation of any prior object.
 *
 * Nested metadata is intentionally retained, not authenticated here. Its
 * canonical value and any source definitions remain the caller's seal.
 * This helper confers no source authority and changes no expression body.
 */
export function snapshotActualProgramArrays(program){
  if(!program||typeof program!=='object'||Array.isArray(program)||!Array.isArray(program.nodes))
    throw Object.assign(new Error('Snapshot a packed expression program with its node array.'),{code:'INVALID_INPUT'});
  return Object.fromEntries(Object.entries(program).map(([key,value])=>[key,Array.isArray(value)?value.slice():value]));
}
