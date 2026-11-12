# Original whole-K bounds including the slow time direction

The previous source-bound positive C8 and C7 programs used a two-variable
Taylor majorant in R,Z at fixed T. This replay supplies bounds for every
ordinary mixed R,Z,T derivative on the same fixed-band physical slab. The
inputs are the archived actual profile FTC bounds and their directed
numerical upper endpoints. The original live background terms are
`n=0,1,2,3`. The original cutoff and all its derivatives vanish for
`n>=4` on `qBig/64 <= q < qBig/16`. The original labels and band are fixed
under differentiation. No claim is made for a different frozen point or a
larger q interval.

## Source elementary chart in three variables

At an actual real center `s0∈[1/2,2]`, the source equation is
`s = T + Z² s^(2h)`. Work on the complex disk `|s-s0|<=1/8`.
For `|Z-Z0|,|T-T0|<=1/128`, the original real center satisfies
`|Z0|<=sqrt(2)<3/2`, so `|Z|<2` and `Re(s)>=3/8`. With
`0<h<1/64`, the derivative of the fixed point map has magnitude below
`(1/32)*4*(8/3)=1/3`. The change of its value at s0 is at most
`1/128 + 2*(4/128)=9/128`. The image stays in the disk since
`9/128+1/24<1/8`. The convergent holomorphic iterates supply the same
real implicit root. The principal logarithm is defined throughout.

Use the common polydisc of radius `1/(128 Rstar)` in R,Z,T. The source
inequality `4 Xb < Rstar²` is checked by directed arithmetic. It gives
`|R0|<=Rstar`. On the polydisc the elementary quantities
`X=R²/(2s)`, `eta=Z s^(-D)` and `log s` retain the earlier bounds
`6 Rstar²,4,4`. The factors `s^(-A)` and `s^(-A-1/2)` have
magnitude below 8, since `3/8<=|s|<=17/8` and the exponents have
magnitude below 2. These estimates use complex arguments only for
elementary coordinate and multiplier functions. The actual heat and
profile derivatives are evaluated on the original real domain. At a
flat radial join or an admitted endpoint the bounds pass to continuous
inward jets.

## Exact positive coefficient comparison

At total degree j the number of three-variable Cauchy coefficients is
`(j+1)(j+2)/2 <= (j+1) 2^j`. The original two-variable count is j+1.
Thus the three-variable positive majorant for each elementary factor is
coefficientwise dominated by the original one with its argument doubled.
Finite positive products and compositions commute with that doubling.
For total order m the new coefficient bound is at most `2^m` times
the archived positive majorant, including its prefactor, Euler cutoff
derivatives, and profile factorials. The archived roots are maxima
over degrees through m. Using the factor `2^m` therefore bounds all
ordinary mixed derivatives through m. The two-dimensional Cauchy count
alone would already fail to cover three elementary first derivatives.

For the original target, the common-family source uses
`s^(-A-1/2) P(X,eta)`. Each derivative at a real point retains the
same `zeta` and the pole `3+3*m`. The positive composition enlarges
only its coefficient. It does not divide a value by a vanishing weight.

The result gives 18 numerical background bounds through C8 and 16
weighted target bounds through C7, now including T. The original
same-family C5 class uses C8 and weighted C6. A numerical bound for the
remaining scalar prefactors and a live private-family seal are separate.

```sh
node replay_full_slow_norms.mjs GOAL_NEXT ORIGINAL_NUMERICAL_RUNTIME OUT_JSON
```
