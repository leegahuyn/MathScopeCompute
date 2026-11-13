# Original angular spectrum through the next Forced candidate

**VERIFIED archival source identity.** Run `43015175416` provides the original
4,682,006-node graph. The checker streams the full graph and checks its SHA-256,
header, node count, byte count and operator histogram. It reads the native
registry, then verifies ten phase lifts against the corrected first-cycle
prefix and 40 native Forced candidate slots. In each lift the literal angle
term is `theta * omega/k`. The other summands have no free physical angle.
The same check on 484 distinct output and mean roots descends through native
function bodies with their formal/actual substitutions. Two integer winding
AST roots serve the ten phase templates. Each uses the exact nearest-integer
operation with nonzero fallback. The graph coefficient roots therefore have
physical cylindrical frequencies `n = m*omega`, with `m` from `-4` through
`4` in the archived candidate. This verifies the candidate's frequency support.
The independent original-operator audit retains its separate conditions on
the second complete state and the global conservative projection.

## Whole-K frequency bound

**VERIFIED band cutoff arithmetic.** In the physical slab,
`qBig = 2^(-(ellMinimum+10))` and `q >= qBig/64`. The original active band
condition is `abs(ell+log2(q)) < 3/4` with flat zero endpoints. Since `ell`
is an integer, it is at most `ellMinimum+16`, so `Q_ell >= qBig/64`.
The actual wave number is `k_ell = ceil(Q_ell^(-h/2))` and `h>0`. The original
uniform frozen carrier estimate in `actual-covariance-operator-bounds.mjs`
gives `abs(p) <= Bnorm^5` on its source domain. Consequently an integer upper
bound for every original `abs(omega) = k_ell*abs(p)` in this slab is

\[
W=\left\lceil B_{\rm norm}^5
             \left\lceil (64/q_{\rm Big})^{h/2}\right\rceil\right\rceil .
\]

The bound uses source constants and a finite positive expression. It does not
need rounded machine values of `qBig`. The band identity for `qBig` and the
localization roots were checked in the pinned whole-K angular receipt. The
new replay checks the `Q_ell`, `h`, and `k_ell` AST on the candidate and reads
the original fixed-label support module. Fixed representatives affect the
winding value within each band while retaining the same upper bound.

**CONDITIONAL final spectral cover.** The original functional archive lists
the initialized state with maximal relative harmonic 1. Its four-map chain
for stage `j` retains all nonzero supported residual harmonics through
`2^j` with their conjugate pairs. For the analytic extension to all active
stages, use Lemma 9.2 and Proposition 9.3, including their original complete
field, source support and pressure reconstruction hypotheses. For each signed
label, linear operations, pressure and the cutoff curl preserve the harmonic.
Own-label quadratic terms add their signed integer harmonics. Distinct
original wave labels have disjoint closed supports for products, including
derivatives by smooth extension. The Signed map only adds fundamental
waves on existing labels. Temporal and FiveMap remain independent of
physical `theta` even when they depend on auxiliary variables. Induction
gives relative caps `2^j` for velocity and pressure and `2^(j+1)` for the
conservative residual. The archived second Forced output is a candidate
within this induction. Full stage-two through stage-four realizations still
require the actual supported inputs and their joins.

The original stage cutoff is `chi(a_j*q)` and the outer physical cutoffs
depend only on `r,z,t`. Their product and the cutoff-before-curl construction
preserve cylindrical support. Since `a_j*q >= exp(j)/64 > 1` for `j>=5`, all
such stages and derivatives vanish identically on this slab. Stage three
vanishes for `q>=qBig/20` and stage four for `q>=qBig/54`, using the exact
selector bounds in the pinned receipt. Thus the conditional cylindrical
velocity/pressure cap is `16W` and the localized force cap is `32W`.
Even without wave support separation, once the velocity is covered globally
by `16W`, cross-label force frequencies have form
`m_1*omega_1 + m_2*omega_2` and remain below `32W` in absolute value.

There are at most two active translates for each of the four independent
band/slow mesh axes at a point. This gives at most sixteen physical boxes
and thirty-two signed carriers. On each full angular circle at fixed
`r,z,t`, the same labels apply for all angles. Under the same source
support conditions, sparse cylindrical velocity/pressure then have at most
1025 frequencies including zero, and the force at most 2049. These counts
bound the union of all carried modes, including possible collisions. They do
not bound the number of radial boxes in a radial integral.

## Frame, grouping and exact integration

For the cylindrical coefficient vector `U_n` at `r>0`, the physical
azimuthal gradient column is

\[
r^{-1}(inI+J)U_n,\qquad J(U_r,U_\theta,U_z)=(-U_\theta,U_r,0).
\]

This connection includes the zeroth cylindrical mode. In Cartesian
coordinates the horizontal combinations are
`U_x +/- i U_y = exp(+/- i theta)*(U_r +/- i U_theta)`.
The physical velocity cap is `16W+1` and the force cap is `32W+1`.
Cartesian spatial gradient entries can shift the velocity cap by one further
frequency. Axis values are covered by continuity for a smooth Cartesian
field, or by the separate interior source proof where wave supports vanish.
The polar connection formula itself is only used for `r>0`.

Sum all coefficient contributions with the same **physical** integer `n`
before taking a square, a dot product, or a truncation. For normalized Haar
measure `dtheta/(2*pi)` the full-circle integrals are then exact sparse sums.
For example, velocity energy uses `sum_n U_n dot conj(U_n)` and the work
uses `sum_n F_n dot conj(U_n)` in a common frame. A uniform angular grid
of `L = 64W+3` points also gives unaliased Cartesian force/velocity coefficients
and exact quadratic angular integrals for velocity energy, gradient
dissipation, force work and squared force. The largest quadratic frequency
here is `2*(32W+1)`, strictly below `L`. This follows from the exact
root-of-unity sum. The integer controls detect the alias at `L=2M`, verify
the absence of aliases at `2M+1`, include a cancellation between two labels
of equal physical frequency, and check the frame shift over exact complex
integer pairs. Sparse coefficient grouping is practical without enumerating
the potentially enormous uniform grid. It still requires numerical
enclosures for each active final coefficient.

**OPEN.** This adds a finite mathematical support bound and an independently
replayed archived second Forced source binding. The physical selector-backed
final coefficients, quantitative tails for feasible angular truncations,
final-field grid, Fourier, coefficient-order and precision comparisons,
and the last resolved time remain open. N7-06 and N8-05 remain OPEN, final
jets 0/67 and RELEASE HOLD. No local Lean compilation was performed.

## Replay

From the workspace root, use Python 3.11+ with the existing helpers in
the `goal-next` branch directory. It creates one temporary 201 MB uncompressed
index backing file in the output directory and removes it on exit. Use the
hosted `post-five-repeat-forced-graph` artifact of run `43015175416` and its
existing independent receipt. `SOURCE_ROOT` is the archived `research-ide`
tree, `PAPER_TEXT_DIR` contains the pinned PDF page extracts, and `FAMILY` is
the `ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json` archived source. The CLI pins
all of these inputs by byte SHA-256. PowerShell example for this workspace

```powershell
$base = 'work/goal-next'
$second = "$base/second-live"
$goal = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
$out = "$base/continuation38/angular"
$family = (Get-ChildItem -LiteralPath "$base/final67/source" `
    -Filter ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json -Recurse).FullName
$env:PYTHONDONTWRITEBYTECODE = '1'
python "$out/check_angular_winding.py" `
    --candidate-dir "$second/hosted-43015175416/post-five-repeat-forced-graph" `
    --goal-next $goal --source-root "$second/node-fixture/research-ide" `
    --paper-text-dir $second --official "$second/independent-second-candidates.json" `
    --cycle "$base/corrected-flat/corrected-cycle-ledger.json" --family $family `
    --whole-k 'work/goal-20261111/m3/whole-k-chart.json' `
    --out "$out/actual-angular-winding.json"
```
