# MathScope M0 — I1 local compute foundation

## Implemented scope

This module provides four finite local kernels behind the same strict `MathScope.ComputeJobSpec/1` and `MathScope.ResultEnvelope/1` contracts used by the IDE. A browser with Worker/Blob support runs the kernels in a real, separate Web Worker. Node and explicitly selected CPU fallback use bounded cooperative steps; the capability manifest records the actual selected execution path. A failed browser worker is reported as a failure, never silently relabeled as a successful server computation.

The existing MathScopeCompute server is a separate service. These modules do not deploy, change, or claim new SageMath, FLINT, Arb, full prismatic cohomology, general gauge-group lattice, Navier–Stokes, or statistical-sampling capabilities there. The manifest lists those adapters as unavailable in this local execution path.

| Adapter ID | Computation | Supported finite scope | Independent check |
|---|---|---|---|
| `prime-segment` | Segmented sieve using BigInt endpoints | `0 ≤ L ≤ U ≤ 1,000,000`; width ≤20,000 | Trial division by all odd divisors through the square root for **every** integer in the interval |
| `padic-delta` | `(a − a^p)/p` in canonical `Z_p` with Frobenius lift equal to the identity | Prime `p ≤ 1,000,000`; 1–255 output digits | Repeated multiplication independent of binary exponentiation for `p ≤ 97`; divisibility and reconstruction congruence for all supported `p` |
| `rational-interval` | Addition, subtraction, multiplication, division | Exact rational endpoints, with zero arithmetic rounding; a divisor containing zero is rejected | Exact endpoint/corner enclosure checks |
| `integer-matrix-product` | Exact integer matrix product | Dimensions ≤16, input entries ≤512 decimal digits | Outer-product accumulation separate from row-dot generation |

The interval adapter's `workingBits` records the request/display context because the common contract requires an interval precision field. It does **not** promise an output-width target or implement floating-point interval refinement. Its endpoints are exact rationals; any width arises from the input enclosures and interval dependence. Transcendental functions and interval quadrature are unsupported.

## Value types and precision

`values.mjs` preserves exact integers as decimal strings. An unsafe JavaScript Number is rejected before conversion. The supported vocabulary is:

- `INTEGER`, `RATIONAL`, `FINITE_FIELD`;
- `PADIC_BALL` as `residue + O(p^digits)`;
- certified `REAL_INTERVAL` with exact rational endpoints, and `COMPLEX_INTERVAL` as a rational rectangle;
- noncertified `FLOAT64` and `STATISTICAL_ESTIMATE` with a confidence level, sample/effective sample counts, method and dependence description.

Finite-field addition, multiplication and division are available in the value layer with prime-modulus validation. The p-adic layer supports addition, multiplication with propagated absolute precision, and **unit-only** division. A nonunit denominator is rejected; `Z/p^N Z` is never treated as a field.

For canonical delta, `N` output digits require `N+1` input digits. The runtime returns `PRECISION_REQUIRED` when the extra digit has no source. It can increase precision when the request carries an exact integer or a compatible exact integer lift. A supplied exact lift narrows the original ball and this fact is recorded. No missing digit is invented. For example, `7` and `132` agree modulo `5^3` but give different delta residues modulo `5^3`.

Displaying a rounded number does not mutate its stored value. Statistical confidence intervals never enter a certified interval operation. No computation receipt can issue `FORMAL PASS` or `THEOREM-BACKED`.

## Public API

```js
import {
  createComputeEngine, createExampleJob, getExampleJobs,
  computeInputHash, isResultFor, verifyResult
} from './compute.mjs';

const engine = createComputeEngine({ maxConcurrent: 1 });
const unsubscribe = engine.subscribe(job => console.log(job.status, job.progress));
const request = await createExampleJob('prime-segment');
// The IDE rebinds modelRef, sources and assumptions to its selected object revision.
const submitted = await engine.submit(request);
const finished = await engine.wait(submitted.id);
console.log(finished.result);

const bundle = await engine.exportBundle(finished.id);
const fresh = createComputeEngine();
const replay = await fresh.replayBundle(bundle);
console.log(replay.comparison.status); // MATCH after fresh execution
unsubscribe();
```

`submit` and `resume` return public Job snapshots. `wait` returns the terminal Job snapshot, whose `.result` is the ResultEnvelope. `getJob`/`listJobs` are synchronous immutable snapshots. `capabilities()` is asynchronous and includes source/environment SHA-256 hashes. `cancel(id)` requests cancellation and returns a boolean; use `wait(id)` before resuming. Queued cancellation creates a cancelled result without executing a kernel.

`exportCheckpoint`/`importCheckpoint` preserve the last completed kernel prefix. Imported checkpoints remain untrusted: prime prefixes are independently retested and matrix rows are rechecked before reuse. A mismatched source version is rejected. An import does not evaluate its supplied source. `exportBundle` contains the immutable request, actual environment manifest, output, error ledger, verifier record, checkpoint, and complete static worker source. Replay requires matching installed source and performs a new computation; it does not trust the imported evidence grade.

`removeJob(id)` removes only a terminal job. `clearCache()` clears computed cache entries. `dispose()` cancels active jobs and releases the worker Blob URL.

## Identity, cache and result meaning

The canonical input hash includes model ID/revision/hash, adapter/version, source refs, assumption refs, explicit finite scope, precision, seed, domain, basis/conventions and the actual input. Invocation ID and resource budget are excluded because they do not alter the mathematical input. The cache key additionally includes the execution environment digest. Altering a source, an assumption, precision, a basis, `p`, a mode, a cutoff or any input creates a different key.

`contentHash` covers the mathematical output, declared scope, precision, mathematical provenance, verifier record and evidence description. It omits invocation metadata and the execution environment, so the same finite calculation can be compared across fresh sessions. `environmentHash` remains separate and both hashes are carried by the result. Exact values and the mathematical content hash are identical after deterministic cancellation/resumption; job IDs, elapsed timing and checkpoint validation work are execution metadata and can differ.

`isResultFor(request, result)` checks the complete input/provenance/scope binding and content integrity. `verifyResult` additionally recomputes the finite observation. An unsigned content hash is not an authenticity signature. Imported outputs are never automatically promoted to trusted current evidence.

Each result has separate `rounding`, `discretization`, `tail`, `residual`, `stability`, and `statistical` ledger fields. These kernels do not compute a PDE residual or prove a stability estimate. A small residual elsewhere in the IDE cannot be interpreted as a solution error merely by using this envelope.

## Budgets and cancellation

The queue permits at most two active workers, defaults to one, retains at most 32 jobs, and caches at most eight completed results. Each request requires finite `maxMillis`, `maxBytes` and `maxItems` budgets and may specify `maxOperations`. Global caps are 60,000 ms, 16 MiB, 100,000 items and 50,000,000 counted operations; kernel limits are smaller where necessary. A 16 KiB minimum byte allowance covers provenance metadata. Serialized requests are limited to 1 MiB and imports to 8 MiB.

The prime kernel yields after each ≤128-integer chunk. Matrix multiplication yields after each row. Cancellation preserves the last fully committed chunk or row. Resource exhaustion returns `BUDGET_EXCEEDED` with a checkpoint. Resume can explicitly increase the resource budget within the same caps, while mathematical identity stays fixed. Consumed time/operations are retained, and revalidation of imported/resumed prefixes consumes additional budget.

Input, item and artifact limits are hard guards; workspace estimates avoid allocating unbounded sieves or matrices. They are **not OS-enforced JavaScript heap quotas**. Worker elapsed time has a watchdog; GPU budgets are unsupported. Unknown kernels receive `UNSUPPORTED`. No input field can name arbitrary code or an arbitrary external endpoint.

## Baseline fixtures

1. `[2,1000]` contains exactly 168 primes; coverage is complete only inside that finite interval.
2. `delta_5(7) = 15 + O(5^3)`, consuming an input known modulo `5^4`.
3. `[1/3,1/2] × [-2,3] = [-1,3/2]` as a certified exact rational enclosure.
4. The blueprint's displayed integer `D1` (3×5) and `D0` (5×4) multiply to the 3×4 zero matrix. This is a finite matrix check, not a certification of the entire geometric comparison theorem or completed prismatic complex.

## Verification command and checklist coverage

```sh
node --test mathscope-m0/tests/compute.test.mjs
```

The 14 test groups exercise exact values beyond `2^53`, finite-field/nonunit distinctions, interval/statistical separation, all four kernels, actual worker execution, missing-scope rejection, p-adic precision loss, cache/source staleness, cancellation and fresh-session checkpoint resume, operation-budget exhaustion, forged checkpoint rejection, observation-bundle replay and source tampering, unsupported bounds, and queue concurrency/duplicate IDs.

For M0, I1-01/02/04/05/06/08 have concrete implementations within this local finite scope. I1-03 has concrete precision propagation for the implemented exact, interval, p-adic arithmetic and delta; determinant/basis-reduction/quadrature/series and general Frobenius precision adapters remain later support extensions. I1-07 provides independent prime, matrix and small-p delta checks; the later Frobenius point-counting, FFT/direct convolution, gauge quadrature and PDE checks remain work for their domain packages. These distinctions must be preserved in the stage checklist.
