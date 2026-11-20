# Protected PostFive mean: conditional first spatial derivatives

The source is the protected original PostFive mean above the matched original
background, with initialized roots `21374946,21374947,21374948`, original late
potential roots `22150943,22151952` and direct late swirl `22154876`. The
protected source-stream and registry hashes are checked through the C122
source receipt. Its source-backed meridional late correction is the full
original cylindrical curl of the two potentials; the direct swirl remains a
separate original field. The FiveMap term has no auxiliary-torus parameter.

The calculation uses the actual C105 late donor rows for total R/Z/L order at
most two of the potentials and order at most one of the direct swirl, plus
the actual C108 initialized-mean rows. Its conditions include all 127 C105
covariance inputs, original whole shifted radial paths and flat supports,
same-source bounds on both labels, a jointly admitted original inverse-chart
overlap and the original early slab. The T=0 statement is a trace using the
existing one-sided source-time regularity; it is not a new two-sided
extension. None of those donor premises is proved by this ledger.

With fixed labels, write the normalized physical derivative directions as
`D_r=partial_R+a L` and `D_z=epsilon partial_Z`. Treat the reference and own
radial-fast coefficients separately. For the original overlap ratio the
actual transport is

```
D_r^own Delta_own = ratio^(-A) *
  (ratio^(-1/2) partial_R Delta_ref + a_own L Delta_ref).
```

No equality of the two radial-fast coefficients is assumed. Each component
of the transported normalized mean obeys the following conditional bounds,
after the common source coefficient and band debit:

| Quantity | Common epsilon exponent |
| --- | ---: |
| Value | `22499/25000` |
| `partial_R` | `17999/20000` |
| `partial_Z` | `22499/25000` |
| `L` | `22499/25000` |
| `D_r` | `17999/20000` |
| `D_z` | `47499/25000` |

The complete component-by-component grades, including the stronger beta
grades, are in `first-derivative-grades.json`. In particular the radial
gamma derivative retains both `a_R L A_T` and `a^2 L^2 A_T`; FiveMap's
separate L derivatives vanish because its native arguments exclude both Y
coordinates. Exact rational arithmetic checks all used source rows, the
single epsilon debit `1/100000`, band cap `S^59`, coefficient rank 204910,
and the original label-ratio bounds. The rank is a conservative cap, not a
new numerical evaluation of the underlying fields.

For physical cylindrical coordinates `r=Q_ref^(1/2) R`,
`z=Q_ref^D Z` and physical velocity scaling `Q_ref^(-A)`, with
`A=1/2+h`, `D=1/2-h`, the same fixed-label estimates read

```
|partial_r Delta_physical| <= Q_ref^(-1-h) epsilon_ref^(17999/20000)
|partial_z Delta_physical| <= Q_ref^(-1)   epsilon_ref^(22499/25000).
```

These Q powers are essential: the positive normalized epsilon exponents do
not by themselves prove small unweighted physical derivatives. No separate
radial Gaussian is assigned to the mean. Active Repeat-app binding, phase
scalar derivatives, complete residuals, N7/N8 and final jets remain OPEN.
RELEASE HOLD.

Replay after extraction from any working directory. Replace `GOAL` with the
extracted `goal-next` directory containing the pinned `c105`, `c107`, and
`c108` inputs; replace the remaining uppercase names with their actual paths.
`PACKET` is this directory, `OUT` is a separate output directory and
`FROZEN` is the original `first-derivative-grades.json`:

```
python PACKET/verify_mean_first_derivatives.py --goal GOAL --protected PROTECTED --prior PRIOR --reference REFERENCE --operators OPERATORS --out OUT/fresh.json
python PACKET/double_replay.py --goal GOAL --protected PROTECTED --prior PRIOR --reference REFERENCE --operators OPERATORS --frozen FROZEN --out-dir OUT
```

The two arithmetic replays are written to separate files and both match the
frozen source receipt byte for byte; they do not overwrite that receipt.
The arithmetic receipt is written with explicit CRLF line endings on every
platform, preserving its original digest. The hash-manifest helper also takes
explicit paths; `python PACKET/hash_evidence.py --help` lists them.
