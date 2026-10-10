# Independent review of the new local analytic axis

## Result and scope

The local analytic construction has a consistent connection between its
actual complex functions, the original coefficient norm, and the complete
original nonlinear operator. The first independent exact run returned
**48/48 PASS** with process exit zero. It did not import or run the producer.
The checks and source hashes are in `axis-fraction-review-001.json`.

The review directly read the unchanged official files
`AxisContraction.lean`, `AxisCoefficientSpace.lean`,
`AxisWeightEstimates.lean`, `AxisOperators.lean`, and `AxisResolvent.lean`,
at official commit `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`, together
with the new written construction. The two primary source pins are checked
against the live read-only original checkout in the receipt. The remaining
read source hashes are also recorded there.

These checks support the written infinite-dimensional argument. They do
not fill the original Lean premise structures with proof terms, identify
historical floating point jets with this new solution, or prove a global
Navier–Stokes construction. Separate work is required for those claims.

## Actual holomorphic inputs and the coefficient norm

The new pressure has the representation

`P(z)=-integral (1+z^2)^(-2 theta) dmu`, with `0<=theta<=1`,
`mu(total)<=4K`, and a positive reference mass `5K/2` at `theta=1`.

On `|Im z|<=1/16`, the real part of `1+z^2` is at least `255/256`.
Because the exponent is real, the modulus of its principal complex power
is exactly `|1+z^2|^(-2 theta)`; a hidden factor involving the argument of
the logarithm is not needed. Thus the integrand is bounded by
`(256/255)^2`, and `4(256/255)^2<5` gives `|P|<5K`. Dominated
differentiation against the same finite positive measure establishes an
actual holomorphic function. A radius `1/32` circle inside the strip gives
`|P'|<=160K` on the much smaller coefficient tube.

For the rational functions of H, it matters that the center of the tube is
real. With `R=sigma^2/2048`, the polynomial estimates `|H|<10` and
`|H'|<20` give

`|H(z)^2-H(x)^2|<sigma^2/4`

at a nearest real point x. Hence the denominator has modulus at least
`H(x)^2+3 sigma^2/4`, whereas the numerator of chi is at most
`H(x)^2+sigma^2/4`. This proves `|chi|<=1` throughout the complex tube,
as well as nonvanishing denominators. The claimed small complex norm does
not follow merely from the real inequality `0<=chi<=1`; the tube argument
is the necessary connection, and it is present.

The actual source weight is

`w(n,m)=20^-n rho^-m m! binom(n+m,m)/((n+1)^2(m+1)^2)`.

For a radial-constant holomorphic input, Cauchy's derivative estimate is
`|f^(m)|<=m! M r^-m`. The coefficient norm therefore costs
`M(m+1)^2(rho/r)^m`. Here `rho/r=1/16`, and the positive geometric
derivative identity gives

`sum_(m>=0) (m+1)^2/16^m=4352/3375<2`.

The m! on the two sides cancels correctly. The argument uses actual
derivatives, not Taylor coefficients mistaken for derivatives. The
coefficient-space compatibility condition in the original source is also
met: jets of an actual smooth function obey the fundamental theorem of
calculus relation. Their membership in the closed compatible subspace
therefore supplies the completeness needed for the Picard limit. Arbitrary
unrelated arrays of derivative bounds would not provide this connection.

The primitive of zeta is well defined on the convex tube. Its length bound
and `|zeta|<=32/sigma^2` give `|psi|<=64/sigma^2`. The actual amplitude
`g=exp(Lambda psi)/C` consequently has complex sup norm below one for every
`C>=Caxis`. Cauchy bounds then put it in the coefficient space with norm
at most two uniformly in C and Lambda. Its real value is strictly positive.
The large parameter gradient is included in its actual derivatives; it
has not been omitted or rounded to zero.

## Operator and resolvent bounds

The original bounded operators have product norm at most 64, radial
averaging norm at most one, and regular radial integration bounds at most
80. The largest integrated differentiated-product bounds are at most
`5120/rho`. With `Q=2^260 K/sigma^2` and `rho=sigma^2/65536`, all are
less than Q. This does not presume that bare parameter differentiation is
bounded on the same space; it uses the original integrated operators.

For `T=J2 M_chi/2`, the source filtration theorem gives

`||T^n||<=5120^n/[n!(n+1)!]`.

This controls the Neumann series despite the absence of a small bound on
`||T||`. The sum is bounded by the diagonal terms of the product of two
exponential series, hence by `exp(160)<3^160<2^256`. Absolute operator
convergence and the telescoping partial-product identity give both the
left and right inverse. The bound on `S 1` uses the actual norm of the
constant one, which is one. The axial reference component is bounded by
`40*64*4*2048 K<2^25 K`. The resulting radius-one ball is indeed inside
the norm ball of radius Q.

## Direct count of every nonlinear summand

The independent verifier counts 24 literal summands of the original
`naturalRemainder`. For each it records three integers: its positive
coefficient, total power of Q, and the number of factors drawn from the
variable pair `(Phi,u)`. Fixed fields and bounded operators each cost Q;
the normalized amplitude costs two. The variable degree is one or two.

A telescoping product difference turns a term `c Q^d` with variable
degree k into the Lipschitz bound `c k Q^(d-1)`. This provides an
independent route to the producer's Lipschitz polynomial. The exact
grouped bounds before the final inverse-L and resolvent factors are:

| Source group | Bound polynomial | Variable degree |
|---|---|---|
| lin1 | `2Q^3+2Q^4+2Q^6` | 1 |
| quad1 | `Q^8` | 2 |
| slow1 | `Q^5+6Q^6+2Q^7` | 2 |
| lin2 | `2Q^3+Q^4+5Q^6` | 1 |
| slow2 | `Q^5+5Q^6` | 2 |
| pressure | `28Q^9` | 2 |

The first component adds three Q factors (multiplication, inverse L, and
resolvent), and the second adds two. Summing the two component bounds
bounds the product-space maximum norm. The exact results are

`B=2Q^5+3Q^6+3Q^7+11Q^8+8Q^9+2Q^10+29Q^11`,

`L=2Q^4+3Q^5+4Q^6+17Q^7+14Q^8+4Q^9+58Q^10`.

All five slow angular terms, both integrated mixed products, the angular
quadratic term, and all three pressure terms are accounted for. Signs are
discarded only after passing to nonnegative norm bounds. No omitted term
or missing factor of two was found in this comparison.

Since the coefficient sums are 58 and 102, the stronger useful bounds are
`B<=58Q^11` and `L<=102Q^10` for every `Q>=1`. With `Lambda=Q^64`,
the actual self-map displacement is at most `29Q^-53` and the Lipschitz
constant at most `51Q^-54`. The weaker `1/(2Q^32)` bound in the original
note is also valid and already proves contraction. The stronger bounds
matter for the subsequent continuation source estimates.

## Evaluation and the infinite fixed point

Termwise differentiation of the weighted power series is justified on
strictly smaller radial and parameter domains. Dropping only the positive
factor `(n+1)^-2<=1` and differentiating the binomial generating function
gives, for a norm error epsilon,

`|partial_Y^k partial_eta^m e| <= epsilon rho^-m (m+k)!/[(m+1)^2 20^k]`
` * (1-|Y|/20)^(-m-k-1)`.

Indeed differentiating `(1-t)^(-m-1)` k times contributes
`(m+k)!/m!`; this cancels the original m! in exactly the stated way.
This identity holds for all nonnegative integer orders, not merely the
finite orders inspected numerically by the checker. For `|Y|<=5` and
orders at most two the remaining scalar is below 128. The source's
alternating-series lower bound then gives `Phi>1/4` on `0<=Y<=4.1`.

The map is continuous and maps a closed ball in the complete compatible
coefficient space into itself. Its geometric Picard differences converge,
and the limit solves the actual operator equation. The radial-degree
raising property of every regular inverse connects exact finite jets to
that same limit. An unevaluated expression graph has no arithmetic
rounding error, but its transcendental nodes remain exact mathematical
objects. This observation does not certify a later numerical evaluation
without a separate enclosure for those nodes and the infinite tail.

## Continuation review findings and repairs

The independent review identified two places where the initial continuation
draft used a stronger conclusion than its displayed estimate immediately
supplied. Both were communicated to the author before status promotion:

1. The proposed `Q^-50` angular-source residual needs the stronger
   `29Q^-53` displacement above. Using only the earlier `Q^-32` estimate
   leaves an eta derivative error of order `Q^-31`. Inserting the exact
   degree-eleven polynomial bound into the same evaluation formula fixes
   this without changing Lambda or the operator.
2. A drift bound of `j/50` alone does not control the product of the field
   drift with `Lambda zeta` during the later shift. The final positive
   width selector should impose, for example,
   `tau < Q^-200/[10^6(1+B_ref)(1+L0)]`. Then the accumulated reference
   control drift is at most `Q^-200`, and multiplication by
   `Lambda zeta`, bounded by `Q^65`, remains below `Q^-135`.

The corresponding stronger estimates preserve the required parameter
order and use positive finite widths. A later receipt must bind to the
revised note; the first receipt deliberately remains an observation of
the earlier source bytes. The original functions and historical evidence
were not changed during this audit.

## Reproduction

From the parent axis directory, with a fresh output filename:

```sh
python3 -B independent-review/verify_axis_certificate.py \
  --original-root /workspace/scratch/afa9cd11a21b/mathscope-m1/navier/official-validation/repo \
  --output independent-review/axis-fraction-review-NEW.json
```

The original checkout is read only. The optional source-root argument
adds direct source-byte comparisons; it is not used to run or modify Lean.
