import { createValueOps } from './values.mjs';

/* Self-contained kernel runtime. Its static function source is bundled into a Blob worker.
 * Requests select an allowlisted adapter; no request can supply executable code. */
export async function kernelRuntime(message, emit = () => {}, control = { cancelled: false }, valueFactory = createValueOps) {
  const V = valueFactory();
  const request = message.request;
  const budget = request.budget;
  const started = performance.now();
  let operations = message.checkpoint?.metrics?.operations || 0;
  const elapsedBefore = message.checkpoint?.metrics?.elapsedMillis || 0;
  let state = message.checkpoint?.state ? JSON.parse(JSON.stringify(message.checkpoint.state)) : null;
  const delay = () => new Promise(resolve => setTimeout(resolve, 0));
  const error = (code, reason, details = {}) => { const e = new Error(reason); e.code = code; e.details = details; throw e; };
  function touch(n = 1) {
    operations += n;
    if (operations > (budget.maxOperations ?? 20000000)) error('BUDGET_EXCEEDED', 'The operation budget was reached. The last complete checkpoint is retained.', { resource: 'operations', used: operations, limit: budget.maxOperations ?? 20000000 });
    if (elapsedBefore + performance.now() - started > budget.maxMillis) error('BUDGET_EXCEEDED', 'The elapsed worker budget was reached. Resume with a larger bounded budget.', { resource: 'maxMillis', limit: budget.maxMillis });
  }
  const snapshot = () => ({ schema: 'MathScope.KernelCheckpoint/1', state: JSON.parse(JSON.stringify(state)), metrics: { operations, elapsedMillis: elapsedBefore + performance.now() - started } });
  const publish = progress => emit({ type: 'progress', progress, checkpoint: snapshot() });
  const exactLedger = () => ({
    rounding: { status: 'NOT_APPLICABLE', reason: 'Exact integer/rational arithmetic; no floating-point rounding in the computed values.' },
    discretization: { status: 'NOT_APPLICABLE', reason: 'The result is a finite computation on the stated input domain.' },
    tail: { status: 'NOT_APPLICABLE', reason: 'No inference outside the finite scope or infinite-series tail is made.' },
    residual: { status: 'NOT_COMPUTED', reason: 'This adapter does not compute a PDE residual or solution-error estimate.' },
    stability: { status: 'NOT_PROVIDED', reason: 'No analytic stability theorem is attached.' },
    statistical: { status: 'NOT_APPLICABLE', reason: 'The adapter is deterministic; no MCMC or sampling claim is issued.' }
  });
  function trialPrime(n) {
    if (n < 2n) return false;
    if (n === 2n) return true;
    touch(); if (n % 2n === 0n) return false;
    for (let d = 3n; d * d <= n; d += 2n) { touch(); if (n % d === 0n) return false; }
    return true;
  }
  function basePrimes(limit) {
    const flags = new Uint8Array(limit + 1), out = [];
    for (let p = 2; p <= limit; p++) {
      touch();
      if (flags[p]) continue;
      out.push(p);
      for (let j = p * p; j <= limit; j += p) { flags[j] = 1; touch(); }
    }
    return out;
  }
  function modPow(a, e, m) {
    let r = 1n; a = V.mod(a, m);
    while (e) { touch(); if (e & 1n) r = r * a % m; a = a * a % m; e >>= 1n; }
    return r;
  }
  function inputMatrix(a) {
    if (!Array.isArray(a) || a.length < 1 || a.length > 16 || !Array.isArray(a[0]) || a[0].length < 1 || a[0].length > 16 || a.some(row => !Array.isArray(row) || row.length !== a[0].length)) error('INVALID_MATRIX', 'Matrices must be nonempty rectangular arrays with at most 16 rows and 16 columns.');
    return a.map(row => row.map(x => { const s = x?.kind === 'INTEGER' ? x.value : x; const b = V.asBigInt(s); if (String(b).replace('-', '').length > 512) error('INPUT_LIMIT', 'Matrix entries are limited to 512 decimal digits.'); return b; }));
  }
  try {
    if (!budget || !Number.isFinite(budget.maxMillis) || budget.maxMillis <= 0 || !Number.isSafeInteger(budget.maxItems) || budget.maxItems <= 0 || !Number.isSafeInteger(budget.maxBytes) || budget.maxBytes < 1024) error('INVALID_BUDGET', 'A finite positive time, item and byte budget is required.');
    if (state && state.adapterId !== request.adapter.id) error('INVALID_CHECKPOINT', 'Checkpoint adapter does not match the request.');
    let values, verification, scopeKind = 'exact-finite', ledger = exactLedger(), precision = JSON.parse(JSON.stringify(request.precision));
    if (request.adapter.id === 'prime-segment') {
      const L = V.asBigInt(request.input.lower), U = V.asBigInt(request.input.upper);
      const width = U >= L ? Number(U - L + 1n) : 0;
      if (L < 0n || U < L || U > 1000000n || width > 20000) error('UNSUPPORTED', 'The local prime adapter supports 0 ≤ L ≤ U ≤ 1,000,000 with at most 20,000 integers per finite interval.');
      if (width > budget.maxItems) error('BUDGET_EXCEEDED', 'The prime interval exceeds the item budget.', { resource: 'maxItems', required: width });
      if (request.scope.primeInterval?.lower !== L.toString() || request.scope.primeInterval?.upper !== U.toString()) error('SCOPE_MISMATCH', 'The declared prime interval must equal the executed interval.');
      if (request.precision.kind !== 'EXACT') error('PRECISION_MISMATCH', 'Prime enumeration requires EXACT precision.');
      const estimated = 65536 + 64 * width + Math.floor(Math.sqrt(Number(U))) + 1;
      if (estimated > budget.maxBytes) error('BUDGET_EXCEEDED', 'The conservative prime workspace/output estimate exceeds the byte budget.', { resource: 'maxBytes', requiredAtLeast: estimated });
      state ||= { adapterId: 'prime-segment', next: L.toString(), primes: [] };
      const next = V.asBigInt(state.next);
      if (next < L || next > U + 1n || !Array.isArray(state.primes) || state.primes.length > width || !state.primes.every(x => typeof x === 'string' && /^\d+$/.test(x))) error('INVALID_CHECKPOINT', 'The prime checkpoint shape or prefix is invalid.');
      // Imported checkpoints are untrusted. Independently validate the entire completed prefix.
      let prefixIndex = 0;
      for (let n = L; n < next; n++) {
        if (trialPrime(n)) { if (state.primes[prefixIndex++] !== n.toString()) error('INVALID_CHECKPOINT', 'The checkpoint contains an incorrect prime prefix.'); }
        if ((n - L + 1n) % 128n === 0n) { if (control.cancelled) return { status: 'CANCELLED', checkpoint: snapshot() }; await delay(); }
      }
      if (prefixIndex !== state.primes.length) error('INVALID_CHECKPOINT', 'The checkpoint has extra or missing prime entries.');
      const base = basePrimes(Math.floor(Math.sqrt(Number(U))));
      while (BigInt(state.next) <= U) {
        if (control.cancelled) return { status: 'CANCELLED', checkpoint: snapshot() };
        const lo = BigInt(state.next), hi = lo + 127n < U ? lo + 127n : U;
        const flags = new Uint8Array(Number(hi - lo + 1n));
        for (const pNumber of base) {
          const p = BigInt(pNumber), p2 = p * p;
          let start = ((lo + p - 1n) / p) * p;
          if (start < p2) start = p2;
          for (let k = start; k <= hi; k += p) { flags[Number(k - lo)] = 1; touch(); }
        }
        const chunk = [];
        for (let n = lo; n <= hi; n++) {
          const sieveSaysPrime = n >= 2n && flags[Number(n - lo)] === 0;
          const independent = trialPrime(n);
          if (sieveSaysPrime !== independent) error('VERIFICATION_FAILED', 'The segmented sieve disagreed with independent trial division.', { n: n.toString() });
          if (sieveSaysPrime) chunk.push(n.toString());
        }
        state.primes.push(...chunk); state.next = (hi + 1n).toString();
        publish(Number(hi - L + 1n) / width);
        await delay();
      }
      values = { primes: state.primes.map(V.integer), count: V.integer(state.primes.length), coverage: { lower: L.toString(), upper: U.toString(), testedIntegers: String(width), completeWithinScope: true, infinitePrimeSetComplete: false } };
      verification = { status: 'PASS', generator: 'SEGMENTED_ERATOSTHENES_SIEVE', verifier: 'TRIAL_DIVISION_BY_ALL_ODD_DIVISORS_TO_SQRT', verifiedIntegers: String(width), criterion: 'Every integer in the interval receives matching prime/composite decisions.', theoremScope: 'FINITE_INTERVAL_ONLY' };
    } else if (request.adapter.id === 'padic-delta') {
      state ||= { adapterId: 'padic-delta', phase: 'READY' };
      if (control.cancelled) return { status: 'CANCELLED', checkpoint: snapshot() };
      const p = V.asBigInt(request.input.p), N = request.input.outputDigits;
      if (!V.isPrimeSmall(p) || !Number.isInteger(N) || N < 1 || N > 255) error('UNSUPPORTED', 'Canonical delta on Z_p supports prime p ≤ 1,000,000 and 1 ≤ outputDigits ≤ 255.');
      if (budget.maxItems < 3 || budget.maxBytes < (N + 1) * String(p).length * 16 + 8192) error('BUDGET_EXCEEDED', 'The p-adic digit/workspace estimate exceeds the item or byte budget.');
      if (request.scope.pAdic?.p !== p.toString() || request.scope.pAdic?.digits !== N || request.precision.kind !== 'PADIC' || request.precision.digits !== N || (request.precision.p !== undefined && request.precision.p !== p.toString())) error('SCOPE_MISMATCH', 'p, output digits, scope, and precision must agree.');
      if ((request.domain.ring !== undefined && request.domain.ring !== `Z_${p}` && request.domain.ring !== 'Z_p') || (request.domain.frobeniusLift !== undefined && request.domain.frobeniusLift !== 'identity')) error('SCOPE_MISMATCH', 'This adapter requires the declared canonical Z_p base and Frobenius lift phi = identity.');
      const a = request.input.a;
      let residue, availableDigits, autoRefined = false;
      const inputModulus = p ** BigInt(N + 1), outputModulus = p ** BigInt(N);
      if (a?.kind === 'INTEGER') { residue = V.mod(V.asBigInt(a.value), inputModulus); availableDigits = 'EXACT_INTEGER_LIFT'; autoRefined = true; }
      else if (a?.kind === 'PADIC_BALL') {
        const ball = V.padicBall(a.p, a.residue, a.digits);
        if (ball.p !== p.toString()) error('PADIC_BASE_MISMATCH', 'The p-adic input base differs from the requested prime.');
        availableDigits = ball.digits;
        if (ball.digits < N + 1) {
          if (request.input.exactLift?.kind === 'INTEGER') {
            const lift = V.asBigInt(request.input.exactLift.value), knownMod = p ** BigInt(ball.digits);
            if (V.mod(lift, knownMod).toString() !== ball.residue) error('INCONSISTENT_EXACT_LIFT', 'The supplied exact lift is not congruent to the p-adic ball.');
            residue = V.mod(lift, inputModulus); availableDigits = 'EXACT_INTEGER_LIFT'; autoRefined = true;
          } else error('PRECISION_REQUIRED', 'Canonical delta(a) = (a − a^p)/p needs one additional input p-adic digit.', { requiredInputDigits: N + 1, availableInputDigits: ball.digits, outputDigits: N, canAutoRefineWithoutSource: false });
        } else residue = V.mod(BigInt(ball.residue), inputModulus);
      } else error('INVALID_VALUE', 'delta requires an INTEGER or PADIC_BALL input.');
      touch();
      const power = modPow(residue, p, inputModulus), numerator = residue - power;
      if (numerator % p !== 0n) error('VERIFICATION_FAILED', 'The canonical delta numerator is not divisible by p.');
      const delta = V.mod(numerator / p, outputModulus);
      // Independent binomial/repeated multiplication check for the small reference primes.
      let checkPower = 1n;
      let verifier;
      if (p <= 97n) {
        for (let j = 0n; j < p; j++) { checkPower = checkPower * residue % inputModulus; touch(); }
        if (checkPower !== power) error('VERIFICATION_FAILED', 'Binary exponentiation disagreed with repeated multiplication.');
        verifier = 'REPEATED_MULTIPLICATION_AND_DIVISIBILITY';
      } else verifier = 'DIVISIBILITY_AND_RECONSTRUCTION_CONGRUENCE_ONLY';
      if (V.mod(p * delta + power - residue, inputModulus) !== 0n) error('VERIFICATION_FAILED', 'The delta reconstruction congruence failed.');
      state.phase = 'DONE'; publish(1);
      values = { delta: V.padicBall(p, delta, N), inputResidueUsed: V.padicBall(p, residue, N + 1), convention: 'Z_p with Frobenius lift phi = identity; delta(a) = (a - a^p)/p', precisionPropagation: { requiredInputDigits: N + 1, availableInputDigits: availableDigits, outputDigits: N, digitsConsumed: 1, autoRefined, exactLiftNarrowsOriginalBall: autoRefined && a.kind === 'PADIC_BALL' } };
      scopeKind = 'interval-certified';
      verification = { status: 'PASS', generator: 'BINARY_MODULAR_EXPONENTIATION', verifier, theoremScope: 'CANONICAL_ZP_DELTA_MOD_P_POWER' };
      ledger.rounding = { status: 'CERTIFIED', reason: 'Exact arithmetic in the stated quotient; p-adic uncertainty is an absolute valuation bound.', bound: { kind: 'PADIC_ABSOLUTE_PRECISION', p: p.toString(), digits: N } };
    } else if (request.adapter.id === 'rational-interval') {
      state ||= { adapterId: 'rational-interval', phase: 'READY' };
      if (control.cancelled) return { status: 'CANCELLED', checkpoint: snapshot() };
      if (request.precision.kind !== 'REAL_INTERVAL') error('PRECISION_MISMATCH', 'The interval adapter requires REAL_INTERVAL precision.');
      if (!request.scope.finite || request.scope.finite.itemCount < 6) error('SCOPE_MISMATCH', 'An interval operation requires an explicit finite scope covering its input and output endpoints.');
      const a = V.validateValue(request.input.a), b = V.validateValue(request.input.b);
      if (a.kind !== 'REAL_INTERVAL' || b.kind !== 'REAL_INTERVAL') error('INVALID_VALUE', 'Both operands must be certified rational endpoint intervals.');
      if (budget.maxItems < 6 || budget.maxBytes < 8192 + new TextEncoder().encode(JSON.stringify([a, b])).length * 8) error('BUDGET_EXCEEDED', 'The rational interval workspace estimate exceeds the item or byte budget.');
      const operationsByName = { add: V.intervalAdd, subtract: V.intervalSub, multiply: V.intervalMul, divide: V.intervalDiv };
      const operation = operationsByName[request.input.operation];
      if (!operation) error('UNSUPPORTED', 'Supported interval operations are add, subtract, multiply and divide.');
      touch(16);
      const result = operation(a, b);
      const pointOperation = { add: V.qAdd, subtract: V.qSub, multiply: V.qMul, divide: V.qDiv }[request.input.operation];
      for (const x of [a.lower, a.upper]) for (const y of [b.lower, b.upper]) {
        const corner = pointOperation(x, y);
        if (V.qCompare(result.lower, corner) > 0 || V.qCompare(corner, result.upper) > 0) error('VERIFICATION_FAILED', 'An exact endpoint value falls outside the interval result.');
      }
      state.phase = 'DONE'; publish(1);
      values = { result, operation: request.input.operation, dependencyWarning: 'Operands are treated as independent intervals. Repeated variables can widen an enclosure; no point-value equality is asserted.' };
      verification = { status: 'PASS', generator: 'EXACT_RATIONAL_INTERVAL_ARITHMETIC', verifier: 'EXACT_CORNER_ENCLOSURE_CHECK', theoremScope: 'ENCLOSURE_OF_THE_STATED_BINARY_OPERATION' };
      scopeKind = 'interval-certified';
    } else if (request.adapter.id === 'integer-matrix-product') {
      const A = inputMatrix(request.input.A), B = inputMatrix(request.input.B);
      if (A[0].length !== B.length) error('MATRIX_SHAPE_MISMATCH', 'Inner matrix dimensions do not agree.');
      if (request.precision.kind !== 'EXACT') error('PRECISION_MISMATCH', 'Integer matrix multiplication requires EXACT precision.');
      const r = A.length, k = B.length, c = B[0].length, items = r * k + k * c + r * c;
      if (items > budget.maxItems) error('BUDGET_EXCEEDED', 'The matrix entries exceed the item budget.', { required: items });
      if ((items * 1100 + 32768) > budget.maxBytes) error('BUDGET_EXCEEDED', 'The conservative exact matrix digit/workspace estimate exceeds the byte budget.');
      if (!request.scope.finite || request.scope.finite.itemCount < items) error('SCOPE_MISMATCH', 'A finite matrix scope must include both inputs and the output entry count.');
      state ||= { adapterId: 'integer-matrix-product', nextRow: 0, rows: [] };
      if (!Number.isInteger(state.nextRow) || state.nextRow < 0 || state.nextRow > r || !Array.isArray(state.rows) || state.rows.length !== state.nextRow || state.rows.some(row => !Array.isArray(row) || row.length !== c)) error('INVALID_CHECKPOINT', 'The matrix checkpoint shape is invalid.');
      // Validate any completed rows using outer-product accumulation before reuse.
      const prefixCheck = Array.from({ length: state.nextRow }, () => Array(c).fill(0n));
      for (let h = 0; h < k; h++) for (let i = 0; i < state.nextRow; i++) for (let j = 0; j < c; j++) { prefixCheck[i][j] += A[i][h] * B[h][j]; touch(); }
      for (let i = 0; i < state.nextRow; i++) for (let j = 0; j < c; j++) if (String(prefixCheck[i][j]) !== state.rows[i][j]) error('INVALID_CHECKPOINT', 'The matrix prefix certificate failed.');
      while (state.nextRow < r) {
        if (control.cancelled) return { status: 'CANCELLED', checkpoint: snapshot() };
        const i = state.nextRow, row = [];
        for (let j = 0; j < c; j++) { let sum = 0n; for (let h = 0; h < k; h++) { sum += A[i][h] * B[h][j]; touch(); } row.push(V.integer(sum).value); }
        state.rows.push(row); state.nextRow++; publish(state.nextRow / r); await delay();
      }
      const check = Array.from({ length: r }, () => Array(c).fill(0n));
      for (let h = 0; h < k; h++) for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { check[i][j] += A[i][h] * B[h][j]; touch(); }
      for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) if (String(check[i][j]) !== state.rows[i][j]) error('VERIFICATION_FAILED', 'Independent outer-product accumulation disagreed with row-dot multiplication.');
      values = { product: state.rows.map(row => row.map(V.integer)), shape: [r, c], inputShape: [[r, k], [k, c]], exactEntryCount: r * c };
      verification = { status: 'PASS', generator: 'ROW_DOT_PRODUCT', verifier: 'INDEPENDENT_OUTER_PRODUCT_ACCUMULATION', theoremScope: 'THE_EXACT_FINITE_INPUT_MATRICES' };
    } else error('UNSUPPORTED', `Unsupported adapter: ${request.adapter.id}. The local runtime does not provide a general prismatic, Sage/FLINT, Yang–Mills or Navier–Stokes solver.`);
    const output = { status: 'COMPLETED', values, verification, errorLedger: ledger, precision, scopeKind };
    const outputBytes = new TextEncoder().encode(JSON.stringify(output)).length;
    if (outputBytes > budget.maxBytes) error('BUDGET_EXCEEDED', 'The output exceeds the byte budget.', { outputBytes, limit: budget.maxBytes });
    return { ...output, checkpoint: snapshot(), outputBytes };
  } catch (e) {
    return { status: ['UNSUPPORTED', 'PRECISION_REQUIRED', 'BUDGET_EXCEEDED'].includes(e.code) ? e.code : 'FAILED', error: { code: e.code || 'KERNEL_FAILURE', message: String(e.message || e), details: e.details || {} }, checkpoint: snapshot() };
  }
}

export function createKernelWorkerSource() {
  return `"use strict";\nconst createValueOps = ${createValueOps.toString()};\nconst kernelRuntime = ${kernelRuntime.toString()};\nlet control = {cancelled:false}; let busy = false;\nself.onmessage = async event => {\n const message=event.data;\n if(message.type === 'cancel'){control.cancelled=true; return;}\n if(message.type !== 'start' || busy) return;\n busy=true;control={cancelled:false};\n try { const result=await kernelRuntime(message, update=>self.postMessage(update), control,createValueOps); self.postMessage({type:'result',result}); }\n catch(error){self.postMessage({type:'result',result:{status:'FAILED',error:{code:'WORKER_FAILURE',message:String(error.message || error)}}});}\n finally {busy=false;}\n};`;
}
