/** Exact bounded witnesses and deterministic Lean export. This module does not run Lean. */
export const SCHEMA = 'MathScope.M3.P8.FiniteCertificate/1';
const same = (a, b) => canonical(a) === canonical(b);
export function canonical(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isSafeInteger(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && Object.getPrototypeOf(value) === Object.prototype) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  throw new TypeError('Only exact JSON integers, strings, arrays, and plain objects are accepted.');
}
const mod = (x, p) => ((x % p) + p) % p;
const integer = x => {
  if (typeof x !== 'string' || !/^(0|-?[1-9][0-9]*)$/.test(x) || x.length > 80) throw new TypeError('Expected a canonical bounded decimal integer string.');
  return BigInt(x);
};
function affine(p) {
  const out = [];
  for (let x = 0n; x < p; x++) for (let y = 0n; y < p; y++) if (mod(y*y, p) === mod(x*x*x-x, p)) out.push([String(x), String(y)]);
  return out;
}
function multiply(a, b) {
  return [a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3], a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3]];
}
function convolution(a, b, length) {
  return Array.from({length}, (_, n) => a.reduce((s, x, i) => s + (n >= i && n-i < b.length ? x*b[n-i] : 0n), 0n));
}
function dataFor(input) {
  if (!input || !same(Object.keys(input).sort(), ['prime','traceLength'])) throw new TypeError('Closed input schema requires prime and traceLength only.');
  const p = integer(input.prime), length = input.traceLength;
  if (![3n,5n,7n].includes(p) || !Number.isInteger(length) || length < 3 || length > 8) throw new RangeError('Supported primes are 3,5,7; traceLength is 3..8.');
  const points = affine(p), count = BigInt(points.length)+1n, t = p+1n-count;
  const matrix = [0n,-p,1n,t]; let power = [1n,0n,0n,1n]; const traces = [];
  for (let i = 0; i < length; i++) { traces.push(power[0]+power[3]); power = multiply(matrix,power); }
  const coefficients = [p,-t,1n], bounds = [p,4n,1n], modulus = 625n;
  const residues = coefficients.map(x => mod(x,modulus));
  const candidates = residues.map((r,i) => { const out=[]; for(let x=-bounds[i];x<=bounds[i];x++) if(mod(x,modulus)===r)out.push(String(x));return out; });
  const factor = [1n,-t,p], inverse = [1n];
  for(let n=1;n<length;n++) inverse.push(t*inverse[n-1]-(n>1?p*inverse[n-2]:0n));
  const product=convolution(factor,inverse,length);
  if(product.some((x,i)=>x!==(i===0?1n:0n)))throw new Error('The finite Euler prefix is not the multiplicative identity.');
  if(candidates.some((xs,i)=>xs.length!==1||xs[0]!==String(coefficients[i])))throw new Error('The bounded coefficient lift is not a singleton.');
  return {
    curve:{equation:'y^2=x^3-x',a:'-1',b:'0',prime:String(p),projectiveInfinityCount:'1',smoothDiscriminantResidue:String(64n%p)},
    affinePoints:points,pointCount:String(count),aP:String(t),
    matrix:{kind:'COMPANION_POLYNOMIAL_MODEL',entries:matrix.map(String),computedCohomologicalFrobenius:false},
    traces:traces.map(String),traceIndexStartsAt:0,
    reconstruction:{modulus:String(modulus),bounds:bounds.map(String),residues:residues.map(String),candidates,coefficients:coefficients.map(String),coefficientOrder:'ascending in X',boundProvenance:'DECLARED_FINITE_INTERVALS'},
    euler:{factor:factor.map(String),inversePrefix:inverse.map(String),productPrefix:product.map(String),coefficientOrder:'ascending in T',truncationDegree:length-1,analyticTailBound:null,placeVariable:'T_p; p='+String(p)},
  };
}
export function makeFiniteCertificate(input = {prime:'5',traceLength:7}) {
  return {schema:SCHEMA,input:JSON.parse(canonical(input)),data:dataFor(input),scope:{finite:true,precision:'EXACT_INTEGER',geometry:'RESIDUE_PAIR_ENUMERATION_WITH_DECLARED_ONE_POINT_COMPLETION',globalRHProved:false,globalBSDProved:false,wholeP8Complete:false,wholeM3Complete:false,computedPrismaticComplex:false},authority:'UNTRUSTED_WITNESS_REQUIRES_REEXECUTION',formalLeanProofIssued:false};
}
export function validateFiniteCertificate(record) {
  const issues=[];
  try {
    const expected=makeFiniteCertificate(record?.input);
    if (!same(record,expected)) issues.push('Record differs from a fresh exhaustive computation or from its closed scope contract.');
  } catch(error) { issues.push(error.message); }
  return {status:issues.length?'REJECTED':'EXACT_FINITE_RECOMPUTED',valid:issues.length===0,issues,formalLeanProofIssued:false,serializedAuthority:'UNTRUSTED_REQUIRES_REEXECUTION',wholeP8Complete:false,wholeM3Complete:false};
}
const leanInt = x => integer(x)<0n ? '('+x+')' : x;
const list = xs => '['+xs.map(leanInt).join(',')+']';
export function exportLeanCertificate(record) {
  const verdict=validateFiniteCertificate(record);
  if(!verdict.valid) throw new Error('Cannot export a rejected finite certificate: '+verdict.issues.join('; '));
  const {data:d,input}=record, r=d.reconstruction,e=d.euler;
  return `import MathScope.P8.Finite

/-! Deterministically exported exact input. Generated by finite-certificates.mjs.
    Every assertion below must still compile in the pinned Lean kernel. -/
namespace MathScope.P8.Generated
open MathScope.P8
def prime : ℕ := ${input.prime}
def expectedAffine : List (ℕ × ℕ) := [${d.affinePoints.map(([x,y])=>`(${x},${y})`).join(',')}]
def companion : Mat2 := ⟨${d.matrix.entries.map(leanInt).join(',')}⟩

theorem point_count_certificate :
    affinePoints prime = expectedAffine ∧ (affinePoints prime).Nodup ∧
    pointCount prime = ${d.pointCount} := by decide

theorem prime_and_smooth_fixture : Nat.Prime prime ∧ (64 : ℤ) % (prime : ℤ) ≠ 0 := by decide

theorem trace_matrix_certificate :
    tracePrefix companion ${input.traceLength} = ${list(d.traces)} ∧
    mtrace companion = ${leanInt(d.aP)} ∧ mdet companion = ${input.prime} ∧
    mtrace companion = (prime : ℤ) + 1 - (pointCount prime : ℤ) := by decide

theorem reconstruction_certificate :
    boundedResidues ${r.modulus} ${r.residues[0]} ${r.bounds[0]} = ${list(r.candidates[0])} ∧
    boundedResidues ${r.modulus} ${r.residues[1]} ${r.bounds[1]} = ${list(r.candidates[1])} ∧
    boundedResidues ${r.modulus} ${r.residues[2]} ${r.bounds[2]} = ${list(r.candidates[2])} := by decide

theorem finite_euler_certificate :
    truncatedProduct ${list(e.factor)} ${list(e.inversePrefix)} ${input.traceLength} =
      ${list(e.productPrefix)} := by decide

end MathScope.P8.Generated
`;
}
