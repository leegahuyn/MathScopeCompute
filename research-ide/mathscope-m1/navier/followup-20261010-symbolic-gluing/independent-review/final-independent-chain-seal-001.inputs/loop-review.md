# Independent review of the C.12 frequency and loop derivative bounds

## Scope and outcome

This review directly compares `C12_FREQUENCY_CONTRACT.md`,
`QUANTITATIVE_LOOP_SELECTION.md`, and `LOOP_DERIVATIVE_ENVELOPE.md`
with the supplied original equations 4.15–4.16, 4.20, 4.26, and
C.4–C.17. The original paper has SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.

The implications are consistent after the corrections described below.
They still require the actual same-profile source envelope. The identities,
positive denominators, and derivative budgets do not authenticate a
supplied number R or S. This review does not assert that the final profile
has already supplied those inputs or that their analytic proofs have been
instantiated in Lean.

## C.12: moments, normalization, and the repair

The factorial parameter norm is submultiplicative by the Leibniz rule.
It bounds a second ordinary derivative by twice the norm. The frequency
has no eta dependence, so the modulation creates no hidden N factor in
these parameter derivatives. Its radial derivative can be large; stock
recovery correctly uses the integral formula 4.16 instead.

Write `epsilon=4R^2/N<1`. Direct estimates of the displayed continuous
density differences give the following numerator bounds, each divided by N:

| Moment | Sufficient bound |
|---|---|
| M | `4R^3` |
| I | `4R^4` |
| J | `8R^5+4R^4` |
| S | `12R^4+6R^3` |
| Cp | `4R^5+2R^4` |

All are below `20R^5` for `R>=8192`. The calculation works at every
partial integration point, since the integrand bound is uniform and the
actual integration length is bounded. The S density is precisely
`U^2-E^2/2`, including its correct quadratic coefficients.

For the recovery formula, the following direct triangle bounds justify
the stated powers:

`|Delta Qs| <= (7R+22R^3+22R^7) epsilon < R^8 epsilon`,

`|Ns| <= 8R^3+8R^2+8R < 20R^3`,

`|Delta Ns| <= (16R^2+8R+4) epsilon < R^3 epsilon`,

`|Delta ps,2| <= (4R^5+80R^6) epsilon < R^8 epsilon`.

Here the reciprocal identity is used with the original `E>=1/R` and
the actual perturbed `Enew>=1/(2R)`. The pressure difference is the
actual pressure-increment difference, since the same datum is held fixed.
The formula for the axial component retains `-XWU` inside its numerator;
placing `-WU` there would be a different formula. No such error is present
in this contract.

The second U row of the C.2 repair contains two terms and the factor
`lambda^-2`. Both must be bounded together. The actual patch geometry
implies `X0^-1<=14R`; hence the sum of the two multiplier norms is at
most `196R^6+14R^4<=210R^6<R^7`. The fresh preconditioner norms are
below 7500. This accounts for the divided difference and its conditioning
without asserting uniform invertibility at lambda zero.

The solution coefficient bound should be proportional to the incoming
debt beta, even if beta is much smaller than lambda. A fixed root-box
estimate containing an additive `lambda*r^2` would not prove this.
The corrected argument works directly in the C2 factorial-norm algebra:
the U solution has norm below `2 beta`, and the E map sends the ball of
radius `2 beta` into itself because

`beta+(2 beta)/16+4 lambda(BU+BE) beta^2 < 2 beta`.

Its Lipschitz constant there is below
`1/16+4 lambda BE beta<1`. The fixed constants `BU<32768`,
`BE<16384`, and `lambda<=2^-200` make these estimates uniform for the
required beta range. Pointwise uniqueness identifies this function-space
solution with the fresh continuous certificate's branch. Thus the
contract's larger `8 beta` bound is safe.

The repair bump convention is unit mass on intervals of width one half.
Its actual value bound is below 18; its x derivative is below 404, with
`x=X/X0<=14`. In logarithmic differentiation, the X0 factor cancels:
`D_X=x partial_x`. This proves the radial repair estimates with no
unaccounted physical-scale factor. Disjoint supports prevent sums of
five active bumps at one point. The continuous moment estimates then
apply again, including inside the repair patch.

## C.12: cone and directional margins

On the coordinate box with bound `B=2R` and reciprocal a at most B,
direct differentiation gives

`|v|,|c|,|j|<=2B^3`, and each of their gradient l1 norms is at most
`4B^4`.

For the last cone component, the product rule gives the bound
`128B^7+80B^10<=208B^10<256B^10`. Since
`256(2R)^10<=R^12`, the chosen Lipschitz bound is valid. Every segment
between old and new coordinates remains in the same positive-a box,
because the perturbation is below `1/(2R)`.

The largest coordinate change is below `R^34/N`. Thus the raw gaps lose
at most `R^46/N`, and `N>R^50` makes every gap larger than `1/(2R)`.
The exact directional identities then give

`n_theta+t n_z >= 1/(16R^2)`,

`2-(v-2)(n_z-t n_theta)^2/(n_theta+t n_z)^2 >= 1/(2048R^7)`.

These estimates use `|ps-(a,-b)|<8R` and `c-v<=32R^3`; no division
by a vanishing stress is used at the preserved endpoints. On the affected
compact interval the first gap proves that the stress is nonzero. The
already preserved endpoint direction bounds are separate inputs.
`kappa=R^-10` is smaller than all the displayed directional bounds.

## The variance root at zero

The removable quotient is exact:

`Q(z)=(R(z)-1)/z^2=integral_0^1 (1-s) R''(sz) ds`.

It follows from Taylor's integral identity and `R(0)=1`, `R'(0)=0`.
In particular `Q(0)=1/2`. Differentiating the integral gives the stated
bounds through order six without dividing an interval containing zero.

For the tilted probability measure, its density is bounded below by
`exp(-2|z|)`. Minimizing the integral of `(sin(theta)-c)^2` over c
therefore proves `g''(z)>=exp(-2|z|)/2`. The double integral for
`g(2z)-2g(z)+g(0)` then gives
`Q(z)>=exp(-4Z)/2`, uniformly for `|z|<=Z`. The signed square root

`W(mu,p)=d0 mu sqrt(Q(mu p))`

is smooth also at mu zero and p zero. The derivative bound
`W_mu>=(d0/4)exp(-6Z)` follows by combining the lower bound on
`V_mu` with the upper bound on `sqrt(V)`. At mu zero its actual value
is `d0/sqrt(2)`. The proof therefore uses a nonsingular implicit equation;
it does not incorrectly assume that `V_mu(0)>0`.

The right-side square root is taken only where the cutoff is supported,
where its argument has the positive lower bound `deltaL/4`. Its zero
extension is smooth because the cutoff is flat at that support boundary.

## Loop derivatives and the circle inverse

The actual divided-difference formula for t follows from the fundamental
theorem of calculus applied to `exp(z sin(theta))/M(z)`. It holds even
when p is zero. The derivative bounds for M and its reciprocal include
the chain factor in `M(2z)`. The budget `2^128 exp(40S^13)` is larger
than the product-rule bound through order eight.

The displayed high-derivative bound for the source step follows from its
literal derivative polynomial and the reciprocal Taylor recurrence.
The maximum monomial `t^-m exp(-1/t^2)` is bounded by `12^12` for
the required `m<=24`; using this coarse bound is legitimate. The
exponential budgets leave room for both the factorials and the finite
number of terms in the chain rules.

The variance equation proves that the integral of the circle density
over one period is exactly one. Its derivative is bounded below by
`1/(16S^2)` because `a>=1/S`, `v<=2S`, and `pi<4`. This establishes
the actual increasing lifted circle map. First, second, and third inverse
derivative formulas then have a positive controlled denominator.
Local inverse lifts differ by a full period at the seam; after substitution
into the periodic loop their derivatives and values agree.

The claimed budget sequence is deliberately larger than the direct
third-order product bounds. For example the most expensive implicit
third derivative is controlled by a finite sum of products bounded by
`E22 * E26^3 * E14`, which is below E30. The inverse-circle third
derivative is bounded using `E39 * E43^3` and a polynomial in S, below
E48. Composing the third-order loop jet with this inverse is below E55;
the at most twenty multi-indices cost another reserved exponent. The
finite primitive integrations then cost at most two, and multiplication
by the same source E is included in the bound E60.

Consequently `R=exp(S^256)` covers these loop and primitive quantities
and the reciprocal raw cone margin. Supplying every remaining actual
source, patch, and preserved-collar bound remains necessary before this
conditional choice can become the final construction's frequency.

## Corrections communicated during review

The initial frequency draft wrote `D=3-2h`; the actual source is
`D=1/2-h`. This was corrected. The deliberately loose inequality `D<=3`
remains valid. The reviewer also requested the combined normalization-row
bound and the beta-dependent C2 algebra argument above; both were added
before the final arithmetic check. No protected original source was edited.
