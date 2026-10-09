/* MathScope M0 exact and approximate value vocabulary. No external numerical backend. */
export function createValueOps() {
  const MAX_DIGITS = 2048;
  class ValueError extends Error {
    constructor(code, message, details = {}) { super(message); this.name = 'ValueError'; this.code = code; this.details = details; }
  }
  const fail = (code, message, details) => { throw new ValueError(code, message, details); };
  function asBigInt(value) {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) fail('INVALID_EXACT_INTEGER', 'An exact integer must be a safe integer, BigInt, or decimal string.');
    if (!['number', 'string', 'bigint'].includes(typeof value)) fail('INVALID_EXACT_INTEGER', 'Unsupported integer representation.');
    const s = String(value);
    if (!/^-?\d+$/.test(s) || s.replace('-', '').length > MAX_DIGITS) fail('INTEGER_LIMIT', `Integer input must contain at most ${MAX_DIGITS} decimal digits.`);
    return BigInt(s);
  }
  const abs = a => a < 0n ? -a : a;
  function gcd(a, b) { a = abs(a); b = abs(b); while (b) { const c = a % b; a = b; b = c; } return a; }
  const mod = (a, m) => ((a % m) + m) % m;
  function integer(value) { return { kind: 'INTEGER', value: asBigInt(value).toString() }; }
  function rational(numerator, denominator = '1') {
    let n = asBigInt(numerator), d = asBigInt(denominator);
    if (d === 0n) fail('DIVISION_BY_ZERO', 'A rational denominator cannot be zero.');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d); n /= g; d /= g;
    if (abs(n).toString().length > MAX_DIGITS || d.toString().length > MAX_DIGITS) fail('INTEGER_LIMIT', 'The exact result exceeds the configured digit limit.');
    return { kind: 'RATIONAL', numerator: n.toString(), denominator: d.toString() };
  }
  function asRational(v) {
    if (v && v.kind === 'RATIONAL') return rational(v.numerator, v.denominator);
    if (v && v.kind === 'INTEGER') return rational(v.value);
    if (typeof v === 'string' && /^-?\d+\/[1-9]\d*$/.test(v)) { const [n, d] = v.split('/'); return rational(n, d); }
    return rational(v);
  }
  function qParts(v) { v = asRational(v); return [BigInt(v.numerator), BigInt(v.denominator)]; }
  function qAdd(a, b) { const [an, ad] = qParts(a), [bn, bd] = qParts(b); const g = gcd(ad, bd); return rational(an * (bd / g) + bn * (ad / g), ad * (bd / g)); }
  function qNeg(a) { a = asRational(a); return rational(-BigInt(a.numerator), a.denominator); }
  function qSub(a, b) { return qAdd(a, qNeg(b)); }
  function qMul(a, b) { let [an, ad] = qParts(a), [bn, bd] = qParts(b); const g = gcd(an, bd), h = gcd(bn, ad); return rational((an / g) * (bn / h), (ad / h) * (bd / g)); }
  function qDiv(a, b) { b = asRational(b); if (b.numerator === '0') fail('DIVISION_BY_ZERO', 'Division by zero.'); return qMul(a, rational(b.denominator, b.numerator)); }
  function qCompare(a, b) { const [an, ad] = qParts(a), [bn, bd] = qParts(b); const c = an * bd - bn * ad; return c < 0n ? -1 : c > 0n ? 1 : 0; }
  function isPrimeSmall(p) {
    p = asBigInt(p);
    if (p < 2n || p > 1000000n) return false;
    if (p === 2n) return true;
    if (p % 2n === 0n) return false;
    for (let d = 3n; d * d <= p; d += 2n) if (p % d === 0n) return false;
    return true;
  }
  function primeModulus(p) {
    p = asBigInt(p);
    if (!isPrimeSmall(p)) fail('INVALID_PRIME', 'The supported modulus must be a prime between 2 and 1,000,000.');
    return p;
  }
  function finiteField(p, residue) { p = primeModulus(p); return { kind: 'FINITE_FIELD', p: p.toString(), residue: mod(asBigInt(residue), p).toString() }; }
  function sameField(a, b) {
    if (!a || !b || a.kind !== 'FINITE_FIELD' || b.kind !== 'FINITE_FIELD' || a.p !== b.p) fail('FIELD_BASE_MISMATCH', 'Finite-field operands must have the same prime modulus.');
    return [finiteField(a.p, a.residue), finiteField(b.p, b.residue)];
  }
  function finiteFieldAdd(a, b) { [a, b] = sameField(a, b); return finiteField(a.p, BigInt(a.residue) + BigInt(b.residue)); }
  function finiteFieldMul(a, b) { [a, b] = sameField(a, b); return finiteField(a.p, BigInt(a.residue) * BigInt(b.residue)); }
  function finiteFieldDivide(a, b) { [a, b] = sameField(a, b); if (b.residue === '0') fail('DIVISION_BY_ZERO', 'Zero has no multiplicative inverse in the finite field.'); return finiteField(a.p, BigInt(a.residue) * inverseMod(BigInt(b.residue), BigInt(b.p))); }
  function padicBall(p, residue, digits) {
    p = primeModulus(p);
    if (!Number.isInteger(digits) || digits < 1 || digits > 256) fail('PRECISION_LIMIT', 'Supported p-adic absolute precision is 1 to 256 digits.');
    return { kind: 'PADIC_BALL', p: p.toString(), residue: mod(asBigInt(residue), p ** BigInt(digits)).toString(), digits };
  }
  function realInterval(lower, upper) {
    lower = asRational(lower); upper = asRational(upper);
    if (qCompare(lower, upper) > 0) fail('INVALID_INTERVAL', 'The lower endpoint exceeds the upper endpoint.');
    return { kind: 'REAL_INTERVAL', lower, upper, certified: true, certification: 'EXACT_RATIONAL_ENDPOINTS' };
  }
  function interval(v) {
    if (!v || v.kind !== 'REAL_INTERVAL' || v.certified !== true || v.certification !== 'EXACT_RATIONAL_ENDPOINTS') fail('INVALID_INTERVAL', 'Only exact rational endpoint intervals are supported.');
    return realInterval(v.lower, v.upper);
  }
  function intervalAdd(a, b) { a = interval(a); b = interval(b); return realInterval(qAdd(a.lower, b.lower), qAdd(a.upper, b.upper)); }
  function intervalSub(a, b) { a = interval(a); b = interval(b); return realInterval(qSub(a.lower, b.upper), qSub(a.upper, b.lower)); }
  function intervalMul(a, b) {
    a = interval(a); b = interval(b);
    const bounds = [qMul(a.lower, b.lower), qMul(a.lower, b.upper), qMul(a.upper, b.lower), qMul(a.upper, b.upper)].sort(qCompare);
    return realInterval(bounds[0], bounds[3]);
  }
  function intervalDiv(a, b) {
    a = interval(a); b = interval(b);
    if (qCompare(b.lower, '0') <= 0 && qCompare(b.upper, '0') >= 0) fail('INTERVAL_CONTAINS_ZERO', 'An interval containing zero cannot be used as a divisor.');
    return intervalMul(a, realInterval(qDiv('1', b.upper), qDiv('1', b.lower)));
  }
  function complexInterval(real, imaginary) { return { kind: 'COMPLEX_INTERVAL', real: interval(real), imaginary: interval(imaginary), certified: true, certification: 'EXACT_RATIONAL_RECTANGLE' }; }
  function float64(value, note = 'IEEE-754 numerical value; no certified enclosure') {
    if (typeof value !== 'number' || !Number.isFinite(value)) fail('NONFINITE_VALUE', 'A numerical value must be finite.');
    return { kind: 'FLOAT64', value, certified: false, note: String(note) };
  }
  function statisticalEstimate({ estimate, standardError, sampleCount, effectiveSampleSize, confidence, interval: ci, method, dependence = 'unspecified' }) {
    if (![estimate, standardError, effectiveSampleSize, confidence].every(Number.isFinite) || standardError < 0 || !Number.isSafeInteger(sampleCount) || sampleCount < 2 || effectiveSampleSize <= 0 || effectiveSampleSize > sampleCount || confidence <= 0 || confidence >= 1 || !Array.isArray(ci) || ci.length !== 2 || !ci.every(Number.isFinite) || ci[0] > ci[1] || !method) fail('INVALID_STATISTICAL_ESTIMATE', 'A statistical estimate requires finite uncertainty, sample count, effective sample size, confidence, method, and ordered interval.');
    return { kind: 'STATISTICAL_ESTIMATE', estimate, standardError, sampleCount, effectiveSampleSize, confidence, interval: ci.slice(), method: String(method), dependence: String(dependence), certified: false, interpretation: 'SAMPLING_UNCERTAINTY_NOT_DETERMINISTIC_ENCLOSURE' };
  }
  function inverseMod(a, m) {
    let x = mod(a, m), y = m, u = 1n, v = 0n;
    while (y) { const q = x / y; [x, y] = [y, x - q * y]; [u, v] = [v, u - q * v]; }
    if (x !== 1n) fail('NONUNIT_DIVISION', 'Only unit division is implemented; Z/p^N Z is not treated as a field.');
    return mod(u, m);
  }
  function samePadic(a, b) {
    if (!a || !b || a.kind !== 'PADIC_BALL' || b.kind !== 'PADIC_BALL' || a.p !== b.p) fail('PADIC_BASE_MISMATCH', 'p-adic operands must have the same prime base.');
    return [padicBall(a.p, a.residue, a.digits), padicBall(b.p, b.residue, b.digits)];
  }
  function valuationLower(a) { let x = BigInt(a.residue), p = BigInt(a.p), v = 0; if (!x) return a.digits; while (x % p === 0n) { x /= p; v++; } return v; }
  function padicAdd(a, b) { [a, b] = samePadic(a, b); return padicBall(a.p, BigInt(a.residue) + BigInt(b.residue), Math.min(a.digits, b.digits)); }
  function padicMul(a, b) {
    [a, b] = samePadic(a, b);
    const digits = Math.min(256, a.digits + valuationLower(b), b.digits + valuationLower(a));
    return padicBall(a.p, BigInt(a.residue) * BigInt(b.residue), digits);
  }
  function padicUnitDivide(a, b) {
    [a, b] = samePadic(a, b);
    if (BigInt(b.residue) % BigInt(b.p) === 0n) fail('NONUNIT_DIVISION', 'The denominator is a nonunit. A separate p-adic quotient precision model is required.');
    const digits = Math.min(a.digits, b.digits + valuationLower(a)), m = BigInt(a.p) ** BigInt(digits);
    return padicBall(a.p, BigInt(a.residue) * inverseMod(BigInt(b.residue), m), digits);
  }
  function validateValue(v) {
    if (!v || typeof v !== 'object') fail('INVALID_VALUE', 'A value must carry an explicit kind.');
    switch (v.kind) {
      case 'INTEGER': return integer(v.value);
      case 'RATIONAL': return rational(v.numerator, v.denominator);
      case 'FINITE_FIELD': return finiteField(v.p, v.residue);
      case 'PADIC_BALL': return padicBall(v.p, v.residue, v.digits);
      case 'REAL_INTERVAL': return interval(v);
      case 'COMPLEX_INTERVAL': return complexInterval(v.real, v.imaginary);
      case 'FLOAT64': return float64(v.value, v.note);
      case 'STATISTICAL_ESTIMATE': return statisticalEstimate(v);
      default: fail('UNSUPPORTED_VALUE_TYPE', `Unsupported value kind: ${String(v.kind)}`);
    }
  }
  function formatValue(v, digits = 12) {
    v = validateValue(v);
    switch (v.kind) {
      case 'INTEGER': return v.value;
      case 'RATIONAL': return v.denominator === '1' ? v.numerator : `${v.numerator}/${v.denominator}`;
      case 'FINITE_FIELD': return `${v.residue} (mod ${v.p})`;
      case 'PADIC_BALL': return `${v.residue} + O(${v.p}^${v.digits})`;
      case 'REAL_INTERVAL': return `[${formatValue(v.lower)}, ${formatValue(v.upper)}]`;
      case 'COMPLEX_INTERVAL': return `${formatValue(v.real)} + i${formatValue(v.imaginary)}`;
      case 'FLOAT64': return `${v.value.toPrecision(Math.min(17, Math.max(1, digits)))} (numerical)`;
      case 'STATISTICAL_ESTIMATE': return `${v.estimate.toPrecision(Math.min(17, Math.max(1, digits)))}; ${(100 * v.confidence).toFixed(1)}% CI [${v.interval.join(', ')}] (statistical)`;
    }
  }
  return { ValueError, asBigInt, gcd, mod, integer, rational, asRational, qAdd, qSub, qMul, qDiv, qCompare, isPrimeSmall, finiteField, finiteFieldAdd, finiteFieldMul, finiteFieldDivide, padicBall, realInterval, complexInterval, intervalAdd, intervalSub, intervalMul, intervalDiv, float64, statisticalEstimate, inverseMod, padicAdd, padicMul, padicUnitDivide, validateValue, formatValue };
}

const ops = createValueOps();
export const { ValueError, asBigInt, gcd, mod, integer, rational, asRational, qAdd, qSub, qMul, qDiv, qCompare, isPrimeSmall, finiteField, finiteFieldAdd, finiteFieldMul, finiteFieldDivide, padicBall, realInterval, complexInterval, intervalAdd, intervalSub, intervalMul, intervalDiv, float64, statisticalEstimate, inverseMod, padicAdd, padicMul, padicUnitDivide, validateValue, formatValue } = ops;

export function canonicalStringify(value) {
  const seen = new Set();
  let nodes = 0;
  function visit(v, depth, allowApproximate = false) {
    if (++nodes > 250000 || depth > 64) throw new ValueError('SERIALIZATION_LIMIT', 'Input exceeds the canonical JSON node/depth limit.');
    if (v === null || typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'number') {
      if (!Number.isFinite(v) || (!allowApproximate && Number.isInteger(v) && !Number.isSafeInteger(v))) throw new ValueError('NON_CANONICAL_NUMBER', 'Use decimal strings for large exact integers and reject nonfinite numbers.');
      return Object.is(v, -0) ? '0' : JSON.stringify(v);
    }
    if (typeof v !== 'object' || seen.has(v)) throw new ValueError('NON_CANONICAL_JSON', 'Canonical inputs must be acyclic JSON values; BigInt needs an INTEGER tag.');
    if (!Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) throw new ValueError('NON_CANONICAL_JSON', 'Only plain JSON objects and arrays are accepted.');
    if (Array.isArray(v)) for (let i = 0; i < v.length; i++) if (!Object.hasOwn(v, i)) throw new ValueError('NON_CANONICAL_JSON', 'Sparse arrays are not canonical JSON.');
    seen.add(v);
    const approximateField = key => (v.kind === 'FLOAT64' && key === 'value') || (v.kind === 'STATISTICAL_ESTIMATE' && ['estimate', 'standardError', 'interval'].includes(key));
    const out = Array.isArray(v) ? `[${v.map(x => visit(x, depth + 1, allowApproximate)).join(',')}]` : `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${visit(v[k], depth + 1, approximateField(k))}`).join(',')}}`;
    seen.delete(v);
    return out;
  }
  const out = visit(value, 0);
  if (out.length > 8 * 1024 * 1024) throw new ValueError('SERIALIZATION_LIMIT', 'Canonical JSON is limited to 8 MiB.');
  return out;
}

export async function sha256(value) {
  if (!globalThis.crypto?.subtle) throw new ValueError('CRYPTO_UNAVAILABLE', 'WebCrypto SHA-256 requires a secure context or a supported runtime.');
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : canonicalStringify(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}
