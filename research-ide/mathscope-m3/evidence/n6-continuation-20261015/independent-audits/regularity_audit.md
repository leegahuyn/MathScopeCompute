# Original `complete_gr`: local regularity audit

Source export: run `38689780299`, commit `a35bb0727953e56470682839c98fd9759306d18c`.
The unchanged original target reported by the continuation package is
`expressionDefinitions[21]`, body `3614891`, parameters `[N,R,Z,T,Y0,Y1]`.
Those node identifiers are supplied by the previous source-binding audit;
this document does not manufacture an independent export of those nodes.

## Verdict and exact boundary

There is a sound analytic route to the requested local result. Neither the
infinite Fourier inverse nor the zero-variance loop introduces an inherent
loss of smoothness. A finite all-band numerical norm is unnecessary.
The mechanisms below are proved here, rather than inferred from successful
symbolic differentiation. Application to the particular saved `g` still
requires the complete defining-body/source-theorem binding listed at the end.
Until that binding and its analytic inputs are checked, this audit does not
discharge any original guard or claim an unconditional theorem for node 3614891.

The requested conclusion is: for every **fixed admitted integer band**, each
positive-time slow point has a compact relative slow neighborhood `K`, and
the original fixed radial envelope `J=[L,U]`, with `L>0`, such that
`g`, `partial_Z g`, `partial_Y0 g`, `partial_Y1 g` are jointly continuous on
`J x K x T^2`. The same conclusion at `T=0` uses the original one-sided
positive-time domain. No negative-time heat extension is assumed.

## 1. Natural series: actual normal convergence, not a finite truncation

The original recurrence and its norm are specified in
`actual-continuation-exact-core.mjs:85-86` and
`SAME_DATUM_ANALYTIC_AXIS.md`, sections 2 and 4-8. Let `a_n(eta)` be any of
the original Phi/u/average coefficient sequences. The B_rho bound used by
the original construction is

```
|partial_eta^m a_n(eta)| <=
Q rho^(-m) m!/(m+1)^2 * binom(n+m,m) / (20^n (n+1)^2).
```

For each fixed `k,m` and `0<=Y<=Ymax<20`, the differentiated series is
dominated by the sum of these bounds multiplied by `(n)_k Ymax^(n-k)`.
Its successive-term ratio, for `n>=k`, is at most

```
(Ymax/20) * (n+1+m)/(n+1-k).
```

This tends to `Ymax/20<1`. Thus every fixed mixed derivative series converges
uniformly, locally in eta and uniformly on the stated Y rectangle. The
usual uniform-derivative limit theorem identifies its sum with the actual
mixed derivative of the same series. Radial averaging divides coefficients
by `n+1`, and preserves this conclusion. The source selects a parameter
tube about `[-33/32,33/32]`; a smaller tube works simultaneously for any
finite collection of requested derivatives. In particular the natural
Y range near `Lambda*Xa=4` fits strictly inside the convergence radius.

The norm itself must come from the actual Banach fixed-point argument,
not be supplied by an auditor. The argument in the cited note supplies
the complete original nonlinear remainder bound and a contraction:
`Q>=2^260`, `Lambda=Q^64`, `B(Q)<Q^32`, `Lip(N)<Q^32`, so
`x -> x0+N(x)/(2Lambda)` is a strict self-map/contraction of its radius-one
ball in the complete coefficient space. The norm bound then follows for
its unique limit. This audit has checked the subsequent normal-convergence
argument independently, but has not independently reconstructed the entire
nonlinear operator-bound tree from the saved graph.

## 2. Original implicit inverses and parameter domains

The source chart root satisfies

```
F(s;Z,T)=s-Z^2 s^(2h)-T=0,
Z=s^(1/2-h) eta, |eta|<=1, 1/2<=s<=2.
```

At a source solution, `F_s=1-2h eta^2 >= 1-2h>0`. On a slightly larger
compact neighborhood it remains positive. Therefore the implicit function
theorem gives a smooth local chart `s(Z,T)`. On overlaps, uniqueness makes
the local roots agree with the same original branch. At a bracket endpoint
the IFT still applies to the defining equation: bracket clipping must not
be confused with a new `min/max` definition of the root. Only the original
admissible image, or its one-sided closure, is used.

For a quadratic moment root, let the original fixed point map be
`H(z,a)=z-P F(z,a)`. Its proved contraction estimate
`||D_z H||<=q<1` implies `P D_z F=I-D_z H` is invertible by the Neumann
series. In a finite square system this also implies `D_z F` is invertible.
Consequently the root is smooth wherever the retained actual RHS is smooth.
This works for an approximate preconditioner P; calling P an exact inverse
is unnecessary. See `actual-continuation-exact-b8.mjs:37`,
`actual-continuation-exact-heat.mjs:47`, and the original moment histories.
The contraction estimate and actual incoming RHS must be the ones of that
source system, not a bound copied from another root.

For the C.1 variance root, an independent nondegeneracy proof is available.
Put `M(z)=average exp(z sin(theta))`, `ell=log M`, and
`R(z)=M(2z)/M(z)^2`. Finite circle integration gives smoothness of M and
all derivatives on compact z intervals, while M is strictly positive.
`ell''(z)=Var_z(sin(theta))>0`, because the tilted density is positive and
sin is not constant. Thus R is even, and
`R'(z)=2R(z)(ell'(2z)-ell'(z))>0` for `z>0`.
The exact removable quotient

```
Q(z)=(R(z)-1)/z^2 = integral_0^1 (1-t) R''(tz) dt
```

is smooth, `Q(0)=1/2`, and positive everywhere on the real line. The actual
signed square root is `W(mu,p)=d0*mu*sqrt(Q(mu*p))`.
For `mu>0,p!=0`, differentiating `W^2=d0^2*(R(mu*p)-1)/p^2` proves
`W_mu>0`; at `mu=0` or `p=0`, continuity gives `W_mu=d0/sqrt(2)>0`.
On the compact original bracket this derivative has a positive minimum.
The original RHS `r=zeta(vs)*sqrt((vstar-vs)/a)` is smooth: on the cutoff's
support, `vstar-vs>=delta/4>0`, `a>0`, and the cutoff is flat at its edge.
The original bracket gives existence, hence IFT gives the same smooth root,
including its zero branch. This does not differentiate an unsigned square
root at a zero. The source formulas are
`actual-continuation-exact-loop.mjs:30-43`.

The lifted circle inverse is likewise smooth: its defining density
`a*(1+t^2)/(2*pi*vtarget)` is strictly positive, smooth and periodic;
its integral has increment one per circle. Therefore its inverse exists,
is smooth on every compact phase interval, and agrees across lifted seams.

## 3. Heat and the finite radial/Picard construction

The full terminal heat body has the Laplace representation, for `z>=0`,

```
H(z)=Gamma(1+h)^(-1) integral_0^infinity exp(-t) t^h (1+zt)^(-h) dt.
partial_z^j H(z)=(-1)^j (h)_j/Gamma(1+h)
                  * integral exp(-t)t^(h+j)(1+zt)^(-h-j)dt.
```

The absolute derivative integrand is bounded by
`(h)_j exp(-t)t^(h+j)/Gamma(1+h)`, an integrable majorant independent of
z in any closed positive half-interval. Hence all right derivatives are
continuous through z=0. This proves smoothness on the actual one-sided
domain; no singular compactification endpoint is evaluated as a sample.
In the slow chart its argument simplifies exactly:

```
2(1-eta^2)/X = 4T/R^2.
```

It is independent of Z, so a Z derivative at T=0 never requires negative
heat arguments. Source: `actual-continuation-exact-heat.mjs:85-111`.

At each finite positive coefficient order, the original six-component
linear Picard system has eta-analytic coefficients/forcing on a strip and
its retained convergent eta-analytic limit on a smaller strip. The original
nilpotent A1 mask gives at most ceil(k/2) eta differentiations in Picard
term k; its certified Cauchy-loss tail tends to zero. Cauchy's formula on
a still smaller strip gives every fixed eta derivative locally uniformly.
Away from xi=0, the defining equation

```
partial_xi W = -diag(c_i)/xi * W + A0 W + A1 partial_eta W + forcing
```

then recursively gives all radial and mixed derivatives. At xi=0 the
source uses its separate even analytic natural extension. The fixed
radial envelope of the pressure is strictly positive, so its radial
regularity does not need division at the axis. When an earlier coefficient
is integrated from zero, its actual natural-axis extension supplies the
endpoint regularity. The C-infinity radial cutoff remains present; no
complex radial analyticity is inferred on its activation collar.

Induction in coefficient order is finite on every fixed band. The source
constructs each new forcing from completed lower tuples, finite products,
derivatives, integrals and the same constant nonsingular moment inverse.
The global pieces are glued by the original flat cutoffs and exact moment
identities; those join identities are required source inputs.
Sources: `actual-residual-order-induction-source.mjs:20-89,129-190` and
`actual-continuation-exact-functions.mjs:144-218`.

## 4. Volterra smoothness includes slow derivatives of the infinite limit

Let the retained actual coefficient matrix A(t,a) be smooth on a compact
parameter neighborhood K times the fixed finite pulse interval [0,L].
For each finite multiindex alpha, define the jet components u_alpha by

```
u_alpha' = A u_alpha
 + sum_(0<beta<=alpha) binom(alpha,beta) (partial_a^beta A) u_(alpha-beta).
```

For all `|alpha|<=m` these form one finite triangular linear system. Its
matrix entries are actual derivatives of A, and are bounded on [0,L]xK
by compactness **after** their continuity is proved. Call an induced norm
bound Km. Its ordered-integral expansion has a uniform remainder

```
exp(Km L)*(Km L)^(n+1)/(n+1)! * ||initial jet||.
```

This follows from `(n+1+j)! >= (n+1)! j!`; the remainder tends to zero.
Finite ordered integrals can be differentiated under compact integrals.
The jet product rule shows their derivatives are exactly the finite jet
partial sums. Uniform convergence of the augmented sums identifies the
limit with the derivatives of the same original Volterra solution.
This proves every finite slow derivative locally uniformly, rather than
assuming it from the undifferentiated factorial tail. The source's frozen
band, representative and carrier fix L and all rounding choices during
these derivatives. Parameter-dependent endpoints can instead be pulled
back to [0,1], with their derivative terms retained.
Sources: `actual-covariance-volterra.mjs:12-55`,
`actual-pulse-jet-source.mjs:102-154`.

H is a finite integral of products of these smooth pulses. On the original
same-box domain, the covariance concentration theorem supplies
`|det H|>=dstar/S>0` and positive normalized weights. Thus H inverse and
the interior square roots are smooth. Positivity is essential; a symbolic
adjugate identity cannot establish it.

## 5. Radial edges and changing labels

The original inner and outer square roots have the exact factors

```
inner: exp(-t1^2/(2y^2)) * sqrt(ga(y)*H(y)^(-1)*bbar(y)), y>0;
outer: exp(-2/delta^2)*delta^(-3/2)*sqrt(H(delta)^(-1)*bbar(delta)), delta>0.
```

Here the regular coefficient is smooth and strictly positive through the
one-sided edge, using the actual nonzero limiting source direction and
the same covariance cone theorem, not division by zero stress.
For fixed band/label all finite coefficient derivatives on a compact
collar are bounded. For `f(x)=exp(-a/x^2)*x^(-b)`, a direct product rule
gives

```
f^(j)=exp(-a/x^2)*x^(-b-3j)*P_j(x^2),
P_(j+1)(z)=2a P_j(z)+(-b-3j)z P_j(z)+2z^2 P_j'(z).
```

At every finite j this is a polynomial. The positive exponential absorbs
every finite inverse power: split it in half and use
`exp(-a/(2x^2)) <= M! (2/a)^M x^(2M)` for arbitrary integer M.
Therefore every finite derivative of the whole square root tends to zero
with an arbitrary extra power of edge distance. Extension of the **whole
function** by zero has every derivative zero. Inactive inverse powers or
square roots must not be evaluated at the edge first.

The n1-only inner adapter is insufficient by itself for all bands. The
common-family source explicitly retains all active corrections. Their
stress outputs have an exact zero branch below the common Xminus
(`actual-residual-order-induction-source.mjs:181-185`), so the leading
flat target factor remains the same on a collar of Xa. A fixed finite
prefix changes H through finitely many smooth coefficients, and the same
common-family cone/determinant result supplies its regular positive
coefficient. This extends the local edge argument to each fixed finite
prefix without claiming a uniform numerical bound over all prefixes.
Source: `actual-common-admissible-family.mjs:157-171`; detailed factor
identities: inner extension `:220-234`, outer extension `:297-310`.

For fixed labels the representatives and rounded carriers are constants.
The original partition factors are C-infinity and flat at support edges.
On any compact subset of q>0 only finitely many band labels and mesh
labels have nonzero support; the cutoff selector has `b_n>=2^n`.
Consequently the all-label sum is locally a finite sum of these extended
smooth bodies. Replacing its indexing by nearby candidates gives the same
function because all omitted terms vanish with all derivatives. No
derivative of a floor, palette, nearest-cell map or representative choice
is taken. The common torus pullbacks preserve periodicity and smoothness.

## 6. Diophantine temporal inverse: a uniform compact proof

Let `v=(sqrt(2)-1,1)` and `k=(k0,k1)!=0`. Put
`m=k1-k0`, `n=k0`. Irrationality of sqrt(2), or integer parity descent,
gives `m^2-2n^2!=0`. Since it is an integer its absolute value is at least
one. Exact conjugation therefore gives

```
|1/(v.k)| <= |m|+sqrt(2)|n| <= (2+sqrt(2))*|k|_infinity.
```

Suppose the actual source F is smooth on `K x T^2`. For a slow multiindex
alpha and a torus multiindex beta of total order m0, set

```
C_alpha,m0 = max_(j=0,1) sup_(K x T^2)
                 |partial_a^alpha partial_Yj^(m0+4) F| < infinity.
```

The finiteness follows from continuity on that compact set. Periodic
integration by parts in a maximal-frequency coordinate gives Fourier
decay order `m0+4`. Inversion costs one frequency power; beta derivatives
cost m0 powers; each two-dimensional max shell has exactly `8r` points.
Thus the complete omitted square-lattice tail of the inverse derivative
is at most

```
8*(2+sqrt(2))*C_alpha,m0 / ((2*pi)^5 Kcut).
```

All constants are uniform over the **same compact slow set**. Every fixed
mixed derivative therefore converges uniformly; differentiating finite
Fourier coefficients under their compact Haar integral identifies its
limit with the derivative of the same original infinite inverse. The
zero Fourier mode is projected out before division and remains zero in
the limit. The inverse is smooth and one-periodic in both Y coordinates
for all real phase lifts. This proof supplies the slow uniformity that
an unevaluated pointwise tail alone does not supply.
Source: `source-auxiliary-fourier.mjs:59-79,139-160` and
`source-global-temporal.mjs:45-136`.

## 7. Apply the finite original stages, then choose one compact set

The actual stage order is essential and noncircular. Start with the smooth
primary all-label full-curl covariance, reconstruct its finite translated
radial pressure, and form Etheta/Ez. Apply the preceding temporal inverse
to those **earlier** source bodies. Realize its meridional potential with
the retained cutoff remainder. Recompute pressure from that updated mean;
compute the five new complete moments; solve the fixed nonsingular five
row system; add those actual compact profile corrections; finally
recompute the complete g. This is a finite dependency chain, with no g
defined through its own Fourier inverse or its own unproved derivative.
See `source-global-initial-mean.mjs:26-57`.

Every stage preserves smoothness by the preceding results and finite
compact parameter integrals. Positive bump mass has a positive minimum
on a compact slow neighborhood; its reciprocal is consequently smooth.
For the actual post-temporal five-row inverse one can derive the absence
of singular matrix denominators without a numerical matrix norm. Its
three angular geometric nodes are `exp(d*p)` with `d=1/5` and
`p=2,-2-2lambda,-2lambda`. Since `lambda>0`, these exponents are strictly
ordered and all three nodes are distinct. Their Vandermonde determinant
is nonzero. Every row factor is a signed product of positive source
scales, `(1+eta^2)^(-1)` and an integral of the nonzero positive bump
against a positive power function; hence no row factor vanishes. The
axial denominator is `1-exp(-2*d*lambda)>0`, and its remaining exponential
node is positive. This proves exactly the nonzero denominators retained
by `source-global-moment.mjs:26-60` for the actual inputs passed by
`source-global-initial-mean.mjs:36-42`. It does not authenticate the earlier
B8/I1/I2 quadratic root discrepancies or replace their separate input proof.
The actual complete radial expression is

```
g = -time(beta)
    -De(2*b*beta+beta^2+Wrr,1)
    -Dz(b*gamma+G0*beta+beta*gamma+Wrz)
    +(2*V*v+v^2+Wthetatheta)/R + epsilon*lapVector(beta).
```

It is exactly `source-full-mean-equations.mjs:27-30`, wrapped as
`tag+'_complete_gr'` by `source-updated-mean-pressure.mjs:32`.

Fix an admitted N and a valid slow point. Choose a small closed slow
rectangle K inside its chart image (relative half-rectangle at T=0).
The original pressure endpoints are fixed positive constants L,U. Their
whole radial interval is handled by the same source shell guards before
any local H or root can be evaluated outside its valid shell; the full
background/heat formula and the mean patch remain defined for positive
radius outside that shell. This must be checked on actual ancestor
guards, not inferred solely from the pointwise chart-domain string.
Finitely many candidate charts suffice on `J x K`. Shrink K so their
active coefficient neighborhoods and every nonzero denominator remain
valid. Compactness is invoked only now, after the actual smoothness proof.

Use the full compact torus rather than a single phase rectangle. Since g
and all its phase derivatives are periodic, the shifted arguments
`Y+(1,v1)*(Psi(rho)-Psi(R))` and the whole Haar cube are simultaneously
covered for all `rho in J`. It follows that g and its three requested
derivatives have finite maxima on this one common compact set. This gives
the noncircular dominated-differentiation bounds of the continuation
pressure lemma, first for P and then for H. No all-band numerical constant
and no g_R/g_T hypothesis is required for those ten specific guards.

## Remaining source-application checks (do not silently assume these)

1. Traverse the saved body 3614891 through every native registry payload,
   not only syntactic call arguments. Bind its exact natural/Picard/root/
   Volterra/inverse/indexed systems and stage order to the reviewed source.
   The kernel source files alone do not prove that the saved graph uses
   only these bodies. Include derivative orders in this binding.
2. Independently review or replay the original mathematical input proofs:
   actual natural B_rho norm/contraction; nonsingular constant moment
   matrices and exact gluing identities; original all-label covariance
   concentration cone/determinant and normalized edge coefficient lower
   bounds; exact inner/outer factorization of the retained actual target.
   The closure arguments here prove consequences of these specific
   theorems. Hashes, proof-status booleans, numerical samples, finite
   derivative arrays and a matching theorem name are not their proofs.
3. Verify the complete fixed radial interval (including shell exterior
   and mean patch) and original outer lazy guards for the saved source.
   Check all candidate same-box/slow-chart domains. A continuity theorem
   on one interior local box is insufficient for P's whole envelope.

No actual discontinuity or nonexistence counterexample has been found.
The unresolved issue is verification of the full source application,
not a demonstrated mathematical failure of the original functions.

## Authenticated compact extraction and independent executed checks

The later cloud replay exported
`work/cloud-result/COMPACT_JET_PDE_SOURCE.json`. It binds the source header
canonical SHA-256
`bf22a99a1ff0b83cd022c31bc4c21aff92d6489359ab4d1c983f8662b0e0f464`
and supplies g21's exact name, body and six parameters above. Its conservative
capture visits 136,186 nodes and 84 native registry definitions. This is a
dependency superset, including operands in inactive lazy branches.

`verify_regularity_mechanisms.py` checked all 362 exported kernel hashes
and matched all 84 reached registry hashes to the compact definitions.
Their mechanism groups are: two covariance systems, one Picard system,
three monotone systems, three quadratic systems, two Fourier inverses,
twelve indexed cover fields, sixty shared finite/heat bodies, and one
fixed natural/core/outer registry. The machine-readable audit maps every
individual key and name without omitting a reached registry.

The actual Picard system is only `picard:0`,
`ActualSameN3OrderOneInner`. The reached positive-order globals are the
ActualFinalOrderOne F/U/v/M/average/Pi bodies. Thus this saved source graph
uses the order-one active background prefix; it does not prove the
universal higher-prefix requirements merely because N is a free frozen
band coordinate. The capture has 533 `actual_natural_series` operations.
The 4,500-node bounded excerpt contains only ten such operations and has
519 frontier nodes. The fixed natural registry is explicitly a summary
of a 141,847-byte definition, not that complete definition. Consequently
the excerpt alone cannot prove all 533 actual argument ranges or their
coefficient norm. The previous PR's 157 natural calls are a different
scope and cannot be substituted for this capture.

The independent execution also verified fourteen symbolic derivatives
of the two actual Gaussian scalar factors against the product-rule
recurrence in section 5. Those finite checks are regressions; the written
induction, not extrapolation of fourteen observations, proves the general
recurrence and flatness mechanism.

## Bilinear assembly and exact support separation

The independently reviewed `jet_pde_assembly_certificate.py` has a sound
generic free-module identity. Writing the complete PDE as linear L plus
the bilinear operator `Q(u,v)=div(u tensor v)`, its computation proves

```
E(M+sum_i wi)-[E(M)+sum_i(E(M+wi)-E(M))]
       = sum_(i!=j) Q(wi,wj).
```

It correctly retains all 324 mean-wave cross products for 162 waves.
Its ideal reduction does not prove the actual support ideal: it constructs
the expected 26,082 distinct-wave ordered pairs and removes that same set.
It also still needs each original indexed local residual to equal the
actual normalized `E(M+wi)-E(M)` pullback.

There is substantive original support geometry that can be checked
independently, beyond a `pass` field. The 2,250 colors have centers
`c_nu=((nu+1)/2^20,0)`, and rectangle radius `r0=2^-34` in the original
dual eigenvector coordinates. With `J=[[3,1],[1,5]]`, the second-row first
entries of `J^delta` for delta=1,2,3,4 are 1,8,50,288. Independent exact
integer enumeration of `nu=1,...,2250` gives respective minimum nonzero
vertical residues modulo `2^20` of 1,8,50,288. This separates every ordered
center pair at those covering differences, because the target center's
second coordinate is zero. At delta=0 distinct colors have horizontal
separation at least `2^-20`.

The maximal row norm of J^4 is 1028. The combined perturbation of two
enlarged rectangles is at most `3*(1028+1)*r0=3087/2^34`, strictly less
than `2^-20`; the exact remaining gap is `13297/2^34>0`.
The original color residues separate same-band overlapping grid labels
and the two signs; nearby-band residues use period 9. Far bands have
disjoint slow cutoff supports. These integer/rational separation checks
were executed independently in `verify_regularity_mechanisms.py`.

To turn this geometry into an ideal for the actual saved 162 functions,
one must still bind each actual color, covering-level difference, center,
guarded velocity and pressure support to these same rectangles. Derivative
support follows only after the actual flat extensions/regularity are
proved. The present audit therefore leaves those support bindings, and
all 1,020 original comparison terms, open.
