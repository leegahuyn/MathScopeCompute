# Refined arithmetic for the saved initialized mean

The opt-in arithmetic reduces all nine saved-source mean value and first
spatial derivative upper endpoints. It also reduces the full initialized
mean cutoff energy upper endpoint. The improved energy upper still exceeds
the allocated sufficient budget, so actual annular energy acceptance and
final fields remain open.

The earlier coarse positive-sum bound repeatedly enlarged a nested
exponential by shifting its innermost coordinate by whole units.
For a positive endpoint exp^d(t) with d>=2 and t>=256, this replay shifts
the seed by exactly 2^-128. The shifted endpoint already bounds twice
the original endpoint, and therefore bounds a sum of two positive
endpoints no greater than that maximum.

The all-depth factor-two theorem was compiled on GitHub in
`DeepExpEnclosure.lean`, source SHA-256
`8b5d3bcf4958707ac3cf72ea4d5c32c5a1fedf47d761e1b6d8da857e545c1cc6`.
The numerical controls exercise three eligible cases and two cases where
the refinement is disabled. A separate exact rational readback checks
the sufficient seed margin and shows that the same shift at depth one
would fail to cover a factor two.
[GitHub proof run](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44538054938)

The original fixed-input producer supplies
`BnormUpper=exp(log(2*B)/512)`, with B taken from the authenticated
threshold 10. Its source SHA-256 is
`1cda839b66df1ecd0d9eed24abf338d84f90977c85f9428df3b5c11e9be414ce`.
The replay re-executes that exact operand with the refined arithmetic
and obtains a strictly smaller upper for original scalar #300170.
The refinement is local to the new mean replay. The original source
files and stored numerical inputs are preserved.

The 42 declared covariance norm roots are supplied with the original
source epsilon gain. The fixed-slab radial-fast coefficients already
occur numerically in the old positive program. The downstream replay
therefore retains the linear covariance and quadratic Temporal products
separately, using a conservative two-band epsilon ratio. It verifies that
all dependent nodes use positive sums, products, maxima or nonnegative
integer powers. No dependent inverse, square root or exponential is
accepted. Beta's extra epsilon is applied at typed outputs to avoid
changing shared psi-derivative nodes. Original analytic source and
fixed-chart valuation premises remain explicit.

The full conditional mean cutoff computation uses the preceding source
identity and radial-characteristic potential bound. It retains the actual
20/z0 and 692/z0^2 outer cutoff derivatives, the axial commutator and
all Cartesian angular connection terms. The exact rational readback
checks the nine strict input improvements, the strict Bnorm improvement,
the strict full-mean energy improvement and the still-inconclusive budget
comparison.

The final result consists of these nine files.

* README.md
* fine_arithmetic_module.mjs
* evaluate_covariance_scaled_mean.mjs
* covariance_scaled_mean_extension.mjs
* check_deep_sum.mjs
* verify_cap_and_readback.py
* mean-cutoff-final.json
* deep-sum-controls.json
* verified-mean-final.json

Run with the original archived input trees and fresh output paths.

```text
node check_deep_sum.mjs GOAL_NEXT ORIGINAL_RUNTIME deep-sum-controls.json
node --stack-size=4096 evaluate_covariance_scaled_mean.mjs GOAL_NEXT ORIGINAL_RUNTIME SLOW_RECEIPT HISTORICAL_INPUT mean-cutoff-final.json deep-sum-refined-Bnorm
python verify_cap_and_readback.py deep-sum-controls.json mean-cutoff-final.json verified-mean-final.json
```

The runner also emits a sidecar for the original 67-atom graph evaluated
with the opt-in arithmetic. The numerical engine and source helper are
read from the original pinned inputs and imported independently in memory.
The standard arithmetic helper and standard evaluator files are preserved.
RELEASE HOLD.
