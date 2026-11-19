# Natural derivative tail modulus at actual N4 orders

The original N4 reached source contains 597 natural calls. The maximum
orders are three radial and five eta derivatives. Twenty-five actual calls
request eta order five. The pinned original simple refinement-modulus API
accepts orders through four and rejects that order-five request.

`natural_tail_modulus.mjs` checks the actual call census and the separate
conditional 597-call Y-range receipt. It then invokes the byte-pinned
original rational tail function at degrees 256 and 512 for every pair
`0<=k,m<=12`. All 338 exact rational comparisons satisfy
`scaledTailUpper<=2^(-N)`.

The new sufficient modulus is proved using exact integers. For `n>=257`,

```text
m!*binomial(n+m,m)*(n)_k
 <= (n+12)^(m+k)
 <= (n+12)^24
 <= 2^n,                       0<=k,m<=12.
```

The final inequality follows from the checked base
`269^24<2^257` and the checked ratio
`270^24<2*269^24`. The ratio
`(n+13)/(n+12)` decreases with n. Thus the differentiated tail for
`0<=Y<=5` after `N>=256` is at most
`Q*rho^(-m)*2^(-N)`. The `m!` factor is retained in this argument.
The pinned source estimates `rho^(-1)<=Q`,
`Q=2^260*4000000*exp(64020*T)<2^(131072*T)` and `T>=1` give

```text
N = ceil((m+1)*131072*T) + bits
tail <= 2^(-bits),              any positive integer bits.
```

This extends the mathematical sufficient modulus to all the derivative
orders accepted by the original rational tail API, including the 25
order-five source calls. The original simple-modulus implementation retains
its order-four input limit. The replay records that rejection as a control.

The result assumes the original nonlinear coefficient-space fixed-point
theorem and identification of the exact finite coefficient producer with the
same infinite solution. The original full Y argument census is conditional
on native and branch semantics, and eta image conditions remain separate.
The enormous symbolic degree is unmaterialized. Finite coefficient
arithmetic errors, Picard/Forced limits, all-order recursion and final fields
remain open. RELEASE HOLD.

Run from the workspace root with Node.js. Replace REPLAY with the location
of this directory and NEW_JSON with a fresh output filename.

```text
node --max-old-space-size=4096 REPLAY/natural_tail_modulus.mjs work/goal-20261111/axial-replay/source/research-ide work/goal-next/y-n4/reached.json work/goal-next/continuation41/y/range-flow.json work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/y-higher-flow/picard-even-axis/actual-seam/natural-source/SAME_DATUM_ANALYTIC_AXIS.md NEW_JSON
```

`find_frame.py` and `frame-paths.json` are an earlier exploratory traversal
of fourteen simultaneous physical frames. They identify source paths to
four of the five selected value callers. They do not establish all-path
substitution preservation or selected-branch conditions and are excluded
from the derivative tail result.
