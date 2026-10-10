# An executed radial and parameter jet for the same nonlinear Phi

`evaluate_phi_mixed_comparison.py` produces
`evaluated-phi-mixed-comparison.json`. The executed receipt contains
125 bivariate coefficient intervals, for radial degrees 0 through 24
and normalized eta Taylor degrees 0 through 4. It also contains 75
mixed derivative evaluations, at Y=0,1,2,4,4.1, radial derivative
orders 0 through 2, and normalized eta derivative orders 0 through 4.
All 360 checks passed with 4534 directed 256-bit operations.

These intervals enclose coefficients and derivatives of the actual
new nonlinear Picard solution. They are obtained by evaluating the
comparison polynomial and adding the proved sharp nonlinear error;
they are not claimed to be a direct evaluation of every node in the
full nonlinear recurrence graph. The source hashes bind the same
final C and j used by the continuation.

## 1. A nondegenerate coordinate at eta zero

Set xi=eta/j, where j=h^4>0. The actual transport polynomial becomes

\[
 H_*(j\xi)/j=1+(9/2-h)\xi-j^2\xi^2-4j^2\xi^3,
 \qquad \chi(j\xi)=\frac{(H_*(j\xi)/j)^2}
                         {(H_*(j\xi)/j)^2+1/4000000}. \tag{1}
\]

Thus the true chi Taylor coefficients can be evaluated without dividing
floating-point approximations of two underflowed numbers. The exact
positive parameters satisfy h<2^-4096 and j^2<2^-32768, by their
original exponential definitions. The program uses closed interval
enclosures [0,2^-4096] and [0,2^-32768], with outward input rounding.
Containing zero as an enclosure endpoint does not set the actual
positive parameters equal to zero.

The ordinary truncated Taylor algebra computes the coefficients of
(1). The directed radial coefficient recurrence is

\[
       a_0(\xi)=1,\qquad
       a_{n+1}(\xi)=-\chi(j\xi)a_n(\xi)/(2(n+1)(n+2)). \tag{2}
\]

An exact rational interval oracle separately computes powers of chi
and the closed coefficient formula. Each directed interval is checked
to contain that oracle interval. The largest measured outward excess,
including the widening of inputs and arithmetic, is enclosed in
approximately 3.756e-60. All proof-relevant endpoints are dyadic
integers; the decimal display is not used in any inclusion check.

## 2. Attaching the actual nonlinear coefficients

The actual coefficient-space error from the same Picard limit to the
comparison is at most `29 Q^-53`. The exact original weight is

\[
 20^{-n}\rho^{-m}m!{n+m\choose m}/((n+1)^2(m+1)^2).
\]

After changing from eta derivatives to xi Taylor coefficients, the
factor is j^m/m!. Since j<=1, rho^-1<=Q and Q>=2^260, the actual
coefficient error is at most

\[
 \frac{29\,2^{-260(53-m)}{n+m\choose m}}
      {20^n(n+1)^2(m+1)^2}.                            \tag{3}
\]

The receipt adds this strictly positive bound to every nonconstant
radial coefficient interval. At n=0 the actual Phi coefficient is
identically one, so the exact constant and zero parameter derivatives
are retained. Formula (3) is the connection from the evaluated finite
array to the same nonlinear infinite solution.

For a derivative evaluation at Y, the corresponding bound is

\[
 29\,2^{-260(53-m)}\frac{(m+k)!}{(m+1)^2 20^k}
               (1-Y/20)^{-m-k-1}.                    \tag{4}
\]

The output labels each mixed derivative as
`j^m partial_eta^m partial_Y^k Phi(Y,0)`. It does not label those
numbers as unscaled eta derivatives.

## 3. Two different radii, used for different purposes

For the **comparison only**, (1) gives `|H_*(j xi)/j-1|<.3`
on the complex xi disk of radius 1/16. Its denominator has modulus
larger than .48, hence `|chi|<2`. Cauchy's estimate therefore bounds
the mth xi derivative of the radial Bessel tail by

`m! 16^m * radialTail(chiUpper=2,Y,N=24,k)`.

That tail is an explicit first-omitted-term geometric bound. Together
with (4), its error is below 2^-90 for all 75 recorded mixed
derivative evaluations. The outward rounding contribution is recorded
separately. This complex disk is not asserted to lie inside the
analytic domain of the actual nonlinear solution.

For a genuine finite eta Taylor approximation, the stated chart is
the much smaller **actual** chart `|eta|<=rho/4`, or
`|xi|<=rho/(4j)`. Its positive radius is less than 2^-16000 in xi.
On the comparison disk, the absolute Bessel sum is below
`exp(4.1)<243`. The comparison's eta Taylor remainder after degree
four is consequently at most

\[
          243(16\,2^{-16000})^5/(1-16\,2^{-16000})<2^{-79000}.
\]

The actual nonlinear value error on that real chart is added from
the original Banach estimate. This splits the error into the real
nonlinear comparison error, the comparison's complex Taylor tail,
the radial Bessel tail, and directed arithmetic error. It never
applies the larger xi Cauchy disk to the unknown nonlinear Phi.

For illustration, at Y=4 the enclosed normalized derivatives of
orders 0 through 4 have decimal displays approximately
`0.28298010676254537`, `-1.0789378664873407e-6`,
`1.4565658332407669e-5`, `-2.6218178551698924e-4`, and
`0.005899088433541105`. The receipt contains their exact interval
endpoints and the separate positive error budgets.

## 4. Acceptance boundary

This is an actually evaluated radial and parameter comparison array
attached to the same nonlinear Phi. A single eta Taylor chart is not
claimed to cover the whole interval [-1,1]. The complete nonlinear
expression graph remains separate, and the missing Lean input
producer described in `FORMAL_BRIDGE_REMAINING.md` remains open.
Neither limitation is converted into a full N3-03 completion flag.
