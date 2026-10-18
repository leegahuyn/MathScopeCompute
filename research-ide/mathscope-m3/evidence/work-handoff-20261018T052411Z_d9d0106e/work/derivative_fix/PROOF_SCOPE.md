# Derivative repair: exact identity and model-only scope

The recovered v5 evaluator is reproduced exactly before repair. Its archived result at
`n_t=256, n_x=128` is `0.012856955389226377`; the corrected result is
`2.5431306450995894e-7`. This is a repair of the diagnostic energy model. It does not
discharge the original N7-06 actual-global-field obligation or change M3's completion count.

## What changed

The production change is one derivative expression, plus its explanatory comment, in
`code/verify_all_eight_items.py`, function
`verify_n706_and_n805_energy_and_adaptation`:

```python
return (9.0 * s * s - 8.0 * s * s * s) / (t_end - t_quiet)
```

The original amplitude and its branches are retained. The original six tests are retained;
one behavioral energy-identity regression is added. The unified patch is
`DERIVATIVE_FIX.patch`. `reference/` preserves byte-identical original source and archived
results. Only the fourteen inputs actually read by the evaluator are copied into `inputs/`.

## Exact calculation

Write `Delta = t_end - t_quiet = 3/4` and `s = (t-t_quiet)/Delta`. On the active branch,

\[
a(t)=3s^3-2s^4,\qquad
a'(t)=\frac{9s^2-8s^3}{\Delta}.
\]

This follows by the product and chain rules with fixed endpoints. The original derivative
`6s^2(1-s)/Delta` is inconsistent with the retained amplitude. In particular, at `s=1/2`
the corrected derivative is `5/(4 Delta)`, while the original is `3/(4 Delta)`.

Let `U = 0.045*(1+0.15/n_x^2)` be the evaluator's fixed spatial multiplier. Because the
same dissipation is added to both sides of its balance, the energy defect reduces to the
quadrature error in

\[
U\left(\frac12-\int a(t)a'(t)\,dt\right).
\]

For the corrected derivative,

\[
\int_0^1 (3s^3-2s^4)(9s^2-8s^3)\,ds
=\int_0^1 (27s^5-42s^6+16s^7)\,ds=\frac12.
\]

For the original derivative,

\[
\int_0^1 (3s^3-2s^4)6s^2(1-s)\,ds
=\int_0^1 (18s^5-30s^6+12s^7)\,ds=\frac3{14}.
\]

Thus the original normalized defect converges to `1/2 - 3/14 = 2/7`, rather than zero.
As both grid sizes tend to infinity, the absolute defect tends to
`(9/200)*(2/7) = 9/700 = 0.012857142857...`. This quantitatively explains the reported
`~0.012856` discrepancy without introducing a different amplitude.

## Why the regression threshold is justified

Set `g(s)=27s^5-42s^6+16s^7`. Its second derivative has the Bernstein representation

\[
g''(s)=54B_{3,5}(s)-36B_{4,5}(s)-48B_{5,5}(s),
\quad B_{k,5}(s)=\binom5k s^k(1-s)^{5-k}.
\]

All Bernstein basis functions are nonnegative and sum to one on `[0,1]`; the other three
coefficients are zero. Therefore `|g''(s)| <= 54`. Every tested `n_t` is divisible by four,
so the quiet-interval boundary lies on the time grid. The active `s`-grid has spacing
`h=4/(3*n_t)`. The composite midpoint bound gives

\[
\left|\frac12-h\sum g(s_{mid})\right|
\le\frac{54h^2}{24}=\frac4{n_t^2}.
\]

The new test divides the observed defect by `2*E_final = U`, applies this bound to every
run, and checks the expected approximately fourfold error reduction when `n_t` doubles.
Normalization removes the independently changing `n_x` factor. The test checks the
energy identity; satisfaction of inequality (10.14) alone cannot satisfy it.

## Reproduced results

| n_t | n_x | Original defect | Corrected defect |
|---:|---:|---:|---:|
| 64 | 32 | 0.01285414270094136 | 4.068987062053053e-6 |
| 128 | 32 | 0.012857805345755556 | 1.0173629589188549e-6 |
| 128 | 64 | 0.012856392951964217 | 1.0172512044520632e-6 |
| 256 | 128 | 0.012856955389226377 | 2.5431306450995894e-7 |

The entire baseline evaluator JSON equals the archived v5 JSON. In the corrected JSON,
only `force_work_integral`, `energy_balance_defect`, and `inequality_10_14_rhs` change for
each of the four runs. The N8-05 diagnostic calculation is unchanged.

| Execution | Result | Exit code |
|---|---|---:|
| Original six tests, original evaluator | 6/6 pass | 0 |
| Original evaluator CLI | archived result reproduced exactly | 0 |
| New regression, original evaluator | expected assertion failure | 1 |
| Original six tests plus regression, corrected evaluator | 7/7 pass | 0 |
| Corrected evaluator CLI | results emitted | 0 |

The negative control fails on `0.28560577879247184 <= 0.0009765625`, an energy-identity
assertion, rather than an import or execution error. Full stdout, stderr, command lines,
exit codes, input hashes, and output-source hashes are retained under `logs/` and
`evidence/EXECUTION_RECEIPT.json`.

## Endpoints and smoothness: observed facts, no new acceptance requirement

The actual code has `a(t)=0` for `t<=0.25` and the polynomial for every `t>0.25`.
There is no constant-one branch or clamp at `t_end`. The polynomial is not standard
cubic smoothstep: it is `s` times `3s^2-2s^3`.

At the quiet boundary, the value and first two derivatives match zero; the third
derivative does not. Thus this diagnostic amplitude is C2 but not C3 across that join.
At `t_end=1`, its derivative is `1/Delta=4/3`; this is a smooth interior polynomial value
because no right-hand branch is present. A right-hand clamp would introduce a different
smoothness issue, but it is absent from this source and has not been added.

These observations describe the diagnostic model. They are not claims that the original
source field violates a smoothness condition. No additional endpoint requirement or
completion gate is inferred from them.

## Exact proof scope

This function uses hardcoded scalar spatial norms, a synthetic spatial multiplier, a
scalar time amplitude, and an assigned work rate. It does not evaluate the actual global
velocity, pressure, or force. It reads `energy_refinement_connection.json` only to count
its 23 recorded source-check entries; this execution does not independently rerun those
23 checks or establish their underlying mathematical conclusions.

The repair establishes the correct model derivative, reproduces and explains the old
model discrepancy, and verifies model energy-balance quadrature convergence. It supplies
no new full-component `G_wave/F_pulse` transport proof, actual global-field integrals,
uniform near-terminal evaluator bound, or original-criterion completion certificate.
Original N7-06/N8-05 and M3 completion statuses must be decided by their own source and
theorem evidence. No original criteria or completion ledgers are edited by this repair.

## Reproduction

From this directory, using Python 3.10 or later and only its standard library:

```bash
python -B code/run_derivative_audit.py
```

The audit expects exit 1 for its preserved-old-formula negative control and exits 0 only
when the scoped comparisons and all expected exit codes are satisfied. It does not run
the Windows whole-package launcher.
