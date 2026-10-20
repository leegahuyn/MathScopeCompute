# New recovery native binding

This directory is a new, small implementation reconstructed from surviving,
authenticated source records. It is not the lost implementation, and its hashes
must not be described as hashes of lost historical bytes. The original source
producer is not rerun. No M3 acceptance row is closed here.

The raw initialized scalar closure contains 589 semantic native calls: 490
natural, 31 Picard, 13 quadratic, 14 monotone, 4 covariance, 34 indexed and 3
auxiliary inverse calls. Of these, 572 have no direct evaluation body. The 14
monotone bodies are residuals whose roots are required; the 3 inverse bodies are
forcings whose inverses are required. Neither is an ordinary function body.
There are also 811 nonzero expression derivative calls. Those derivatives must
be taken in the original formal variables before simultaneous application.

## Quadratic and slow root applications

For each of the original three quadratic systems the stored source proof gives
a self-map of the original radius ball, a contraction constant q<1/4, and a
bound beta for the norm of T(0). The exact source root z satisfies
`||z|| <= beta + q||z||`, hence `||z|| <= beta/(1-q)`. The B8 beta is 1/100000000;
the I1 and heat beta is 2^-441, directly from their retained source incoming
bound and heat reduction. The rational q is the original proof's sharper q,
not a sampled Jacobian. All 13 component calls are bound to their original
system, component, RHS node and eta argument. Their resulting rational
intervals are uniform on eta in [-1,1]. No RHS integral has been evaluated.

The two original slow calls solve
`F(s)=s-Z^2 exp(2h log(s))-T=0` on [1/2,2]. The original source image has
`Z=s0^(1/2-h) eta`, `T=s0(1-eta^2)`, with s0 in that bracket and |eta|<=1.
Thus s0 is a root and Z²<=2. Since the pinned source gives 0<h<1/16,
`F'(s)=1-2h Z² s^(2h-1)` lies between 1-8h>1/2 and 1 on the bracket.
This proves uniqueness and the source-conditional bracket. Numerical use of
the runtime adapter additionally requires actual source endpoint interval
signs. No numerical Z,T values were invented for the two actual calls.

## Natural series bound and finite tail

The existing B_rho coefficient proof uses radial base20 and bounds the
ordinary (k,m) derivative by

`Q rho^-m m!/(m+1)^2 sum[n>=k] binom(n+m,m) (n)_k Y^(n-k)/(20^n(n+1)^2)`.

On 0<=Y<=5, the factor without Q rho^-m is at most

`C(k,m)=5^-k/(m+1)^2 sum[n>=0] (n+m)^(k+m) (1/4)^n`.

This follows from `m! binom(n+m,m)<= (n+m)^m`, `(n)_k <= (n+m)^k`,
and dropping `(n+1)^-2`. Terms n<k may be added because they are nonnegative.
The power series is computed exactly using Stirling numbers and
`sum (n)_j r^n=j!r^j/(1-r)^(j+1)`. Thus each C is a rational, not an
uncomputed infinite sum. The average component has the additional coefficient
factor 1/(n+1) and satisfies the same upper bound.

The pinned parameter expressions give
`Q=2^260*4000000*exp(64020*T)`,
`rho^-1=2^16*4000000*exp(64016*T)` and `T=exp(1048576)+10`.
Use `T<2exp(1048576)`, `log2<1`, and `4000000<2^22`.
The recorded integer comparisons prove for each observed pair that
`log(C Q rho^-m) < 2^(18+m) exp(1048576) < exp(1048594+m)`.
Therefore `C Q rho^-m < exp(exp(1048594+m))`.
Observed eta orders include 5, so the recovered bounds span integer
1048594 through 1048599. These are exact descriptions of finite positive
upper bounds; no decimal expansion of these enormous numbers is claimed.

The independent tail implementation reproduces the surviving exact-rational
first-positive-term/geometric-ratio formula with guards N>=k, 0<=Y<=5 and
ratio<1. The full tail includes the factor Q rho^-m. Finite coefficient
rounding errors need an additional budget.

## Picard proof scope

All 31 observed even-profile calls use original Picard system0. The existing
numeric-majorant proof is attached by comparing its parameter ASTs, its tail
root IDs, and all 74 original constant nodes to authenticated raw source.
Historical header hashes are not silently identified with the current raw
header hash; explicit record comparisons perform the attachment.

The common collar value norm is exp(9 C1² a²/(2loss)), with original
Kcondition=ceil(72 C1² a²/loss). For each fixed eta order m the derivative tail
is m!(16/delta)^m 4^-K/3 on the smaller eta tube. The stored K was chosen for
its stored order and precision. It is not a universal truncation index.

The separate natural extension has norm root24855 on |Lambda X|<=5.
It agrees with actual Picard0 only through X<=Xa=4/Lambda. On that core,
Cauchy radius1/Lambda in X and delta/16 in eta gives the recorded symbolic
mixed-derivative bound. Beyond Xa, the actual smooth activation collar is
handled by the original ordinary radial recurrence and regular even-profile
integral. A value bound on that collar is not a holomorphic radial bound.
The runtime core adapter rejects a caller outside Lambda X in [0,4].

## Finite indexed assembly and retained theorems

The 34 plans retain all 5,184 declared rows, original label values, guard layers,
local bodies, local formal parameters and argument nodes. Constant chart
direction maps are expanded by exact sparse polynomial multiplication. The
result explicitly asks for local formal derivatives, then maps their values.
It is executable as a finite recipe but does not claim those local derivative
bodies or numerical values have been materialized. Labels and nearest-copy
choices are not differentiated. Guard intervals that cross a boundary fail
closed, and inactive rows become zero before their singular local body.

Original fields6,7,8,9 match the surviving PRIMARY_INDEXED_SOURCE definitions
exactly. The later PRIMARY_WAVE_QUANTITATIVE_SOURCE_APPLICATION explicitly
cites ACTUAL_PRIMARY_INDEXED_REGULARITY and supplies the grouped original
wave class conclusions for every fixed derivative. Earlier snapshot false
scope flags remain unchanged as historical data; they are not used to erase
that later theorem. This reuse has the exact theorem's scope. It does not
numerically evaluate every indexed field or certify final global norms.

The finite recipes reference 453 distinct direct source operands. Of these,
24 were already in the initialized scalar closure and 429 were recovered by
an early source scan through node643012 after authenticating the entire
compressed source and exact header bytes. All direct operands now have raw
records in the exported pair of datasets. Their 418 additional immediate
argument dependencies remain outside that pair. This supplement is explicitly
not a transitive closure and supplies no numerical caller-domain checks.

The initialized closed source scope is retained. New finite recipes and
uniform bounds alone do not finish the final global A,b,p evaluator, the
energy integral, or N7-06/N8-05. The remaining required numerical operations
are listed explicitly in EXISTING_PROOF_APPLICATION.json.
