# Original radial cutoff coefficient for the Temporal axial field

The retained original coefficient is `k=chi_R/R`. Both the pinned Git
definition and the effective original runtime have byte-identical mean
geometry bodies. The original formula is

    x0 = sqrt(2 X0Imean) exp(1/2)
    u = 10 (R/(x0 sqrt(s)) - 1)
    chi = sigma(u)
    k = 10/(R*x0) * s^(-1/2) * sigma'(u).

On the support of a positive-order sigma derivative, the normalized
radius is between 1 and 11/10. The original real sigma and all its
derivatives have matching flat jets at both support endpoints. The
coefficient and its ordinary mixed derivatives therefore vanish at those
faces and outside the support.

The previously checked geometric chart contraction admits a complex
radius of 1/64 around each original real slow point. Only its geometric
variable s is used here. It satisfies |s|>=3/8, so Cauchy on radius
1/128 bounds every mixed derivative of s^(-1/2) of order j by
2*j!*128^j. On the active support R/x0<2. Holding R and the label fixed,
the derivatives of u therefore have bounds 40*j!*128^j, j>=1.
The original sigma derivatives through order 4 and the full Leibniz
and composition integer coefficients give the four recorded bounds
for |D^alpha k| times X0Imean, where alpha is a Z/T multiindex of total
order zero through three. The common bound is 2^80/X0Imean. It uses
the original real step bounds on each active branch.

The directed comparisons give log(2^80/X0Imean)<H/2^120 and
log((2 sqrt(Xb))^2)<3H/2^128. These are pointwise coefficient and
radial-length estimates on the admitted original domain.

    node evaluate_mean_cutoff_coefficients.mjs GOAL_NEXT WORK NEW_RECEIPT.json
