# Independent pressure and same-core interval review

## Current result and preserved development failure

The current independent run is `pressure-core-review-002.json`, produced
by `verify_pressure_core_receipts.py` with actual exit code zero and
**553/553 checks passed**. It consumes the accepted pressure-prefix
attempt 0002, the actual A.21 pressure coefficient attempt 0001, and the
newly frozen core interval attempt 0002. Its verifier bytes are retained
as `pressure-core-review-002.verifier.py`.

The earlier independent record `pressure-core-review-001.json` remains
**FAIL, 551/553**. The two failed conditions were the current producer
hash and the axis input hash of development core attempt 0001. Its
mathematical rows passed, but that did not authenticate it as a current
result. The producer has marked that attempt superseded and created the
new append-only attempt with input-byte snapshots. The rejected pressure
prefix attempt 0001 is also retained; its incorrect point collar factor
was replaced in accepted attempt 0002 by the whole interval
`[1-2*2^-350,1]`.

## Work performed independently

No producer or arithmetic helper is imported. The independent program
uses exact rational interval arithmetic and a separate Horner evaluator.
It authenticates the current proof, producer, helper, pressure input, and
axis certificate against their stored hashes. The accepted continuous
quadrature algorithm and analytic remainder are reviewed in
`PRESSURE_REVIEW.md`; the 1,792 quadrature cells are not represented as
an independent replay here.

The following downstream work was actually recomputed:

| Calculation | Independent method |
| --- | --- |
| Final pressure-prefix combination | New 256-term alternating rational enclosure for `exp(-2/5)` |
| 49 normalized A.21 Taylor coefficients | Exact coefficient formula, nonzero whole-strip error, odd symmetry |
| 49 pressure derivative intervals | Exact multiplication by `k!` |
| `Z*(0)` and `Z*'(0)` | Multivariate polynomial algebra over `QQ[h,j,P(0),P''(0)]` |
| 75 core value/derivative rows | Exact interval Horner for five quantities at five Y values and Y derivative orders 0–2 |
| Final intervals | Independent positive Banach error, infinite-series tail, and outward-rounding containment checks |

Every pressure coefficient interval has width below `2^-256`. Every
listed same-infinite-core interval has width below `2^-120`. These are
width bounds for the actual enclosure rows, not decimal agreement of
two approximations.

## Exact leading identities

Let `K=Pstar^2`, `A=1/2+h`, `D=1/2-h`, `j=h^4`, and use the same
actual A.21 pressure `P`. At eta zero, evenness gives `P'(0)=0`, and

`H*(0)=j`, `L(0)=1`, `g(0)=1/C`,
`chi(0)=4000000/4000001`.

Substituting `U*=4 eta+j` into the complete axial source gives the exact
identities

`Z*(0)=-(A+4)j`,

`Z*'(0)=-20+2 A j^2-P''(0)+4 A P(0)`.

The constant `-20` uses `A+D=1`. The pressure second derivative and the
`4AP(0)` term both belong to the actual datum. They must not be omitted
or replaced by the earlier fixture's pressure. Therefore the linear
coefficient in the normalized eta derivative of the core velocity is

`BP=-Z*'(0)/(2K)`

`=(20/K-2 A j^2/K+P''(0)/K-4 A P(0)/K)/2`.

This is the same coefficient used in the current directed interval
evaluation. The first axial comparison is `(A+4)Y/2` after division by
`j`. Radial averaging gives `B_eta/K=BP Y/2`. At eta zero, the exact
incompressibility relation yields

`Lambda*(V0/X+4)/K = -B_eta/K`.

For pressure, the actual forward relation yields

`C^2 Lambda (Pi-P(0)) = integral_0^Y Phi(v,0)^2 dv`.

The finite comparison uses the degree-24 Taylor polynomial of the
actual `f0(chi Y)`, its full degree-48 square, and the degree-49 integral.
The square is not truncated back to degree 24.

## Connection to the infinite core and error accounting

The current actual Banach displacement is `29 Q^-53`. The normalized
velocity error after division by `j` is bounded by `29 Q^-52`, using
the proved inequality `j>Q^-1/2` and a deliberately looser power.
For the eta derivative, the coefficient-space factor is
`1/[4(n+1)]` and `rho^-1<=Q`, giving the same safe `29 Q^-52` bound.
The averaging operator only reduces the relevant coefficients.

The first omitted Bessel-series degree is 25. After `k` Y derivatives,
the successive-tail ratio is bounded by
`chi Y/[2(26-k)27]`, which is below one throughout the displayed range.
The independent program adds this positive tail and the positive
Banach evaluation bound. For the pressure comparison it separately
uses `|q24|<4`, `|q24'|<2`, and `|Phi|<2`; the error multipliers
`25 delta0`, `6 delta0`, and `4(delta0+delta1)` are valid for derivative
orders 0, 1, and 2. At `Y=0`, order zero, exact initial values allow a
zero error; other rows retain the positive remainder.

The small enclosures for `h`, `j^2`, and `1/K` are `[0,2^-2048]`.
Their zero lower endpoints are outward enclosure endpoints and do not
set the source parameters to zero. Pressure uncertainty is propagated
through `BP` before evaluation. Directed finite arithmetic is checked
to contain the independent exact rational interval, and the final
reported interval contains that exact interval enlarged by all analytic
errors.

## Scope

This result connects the listed eta-zero core values and Y derivatives
to the same infinite analytic profile and pressure used by the new
continuation. It does not evaluate the complete all-eta nonlinear graph,
establish the global modulated stress, or instantiate the original Lean
analytic premises. The original core certificate and the independent
record retain those limitations explicitly. The independent 553 checks
are distinct from the producer's 239 checks and 2,280 directed operations.
