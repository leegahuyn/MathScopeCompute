# Exact terminal integral enclosure

The checker matches the original 4,420,257-node stream and checks the 24 typed
operands of terminal integral `#275`. It separately checks the original source
profile and square-seed step definition. The certified enclosures support the
base step orders 0 through 12, including intervals that meet either flat endpoint.

For `0<x≤1`, write `y=1/x`. Derivatives of `exp(-1/x²)` are
`P_n(y) exp(-y²)` with `P_{n+1}=2 y³ P_n-y² P_n'`. Each monomial times the
exponential is enclosed at the interval endpoints and its possible positive
maximum `y=√(k/2)`. The exponential tail controls the interval reaching
`x=0`. Leibniz's rule then encloses the derivatives of the quotient by the
strictly positive sum of the two seeds. The source step is monotone and
`σ(0)=0`, `σ(1)=1`.

For the exact source scale `ρ=h/256`, set `Qp = ρ/(1−ρ) * J` and
`J=∫₀¹ exp((1−h)(1+2t)) σ'(t) dt`. On each cell, the step endpoint
difference bounds its positive measure. Multiply it by the weight interval
and sum with rational outward bounds. Keeping the exact positive `h` and
the proved bound `h<2^-64`, 256 cells give
`7.400857450 ≤ J ≤ 7.458903096` and `h/35 < Qp < h/34`. The independent
integration-by-parts review obtains a narrower enclosure of the same `J`.
This computation concerns the terminal wait in the source background.

Use Python 3 with `PYTHONPATH` set to the directory containing the existing
`certified_bounded_transcendentals.py` and `rigorous_rational_intervals.py`:

```text
python enclose_original_qp.py --graph <archive-root>/inputs/graph/original-source-nodes.jsonl.gz --profile <archive-root>/inputs/producer/source-profile-data.mjs --support actual-continuation-exact-support.mjs --out rerun.json
```
