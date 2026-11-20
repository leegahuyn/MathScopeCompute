# One actual raw natural value at original literal Y=4

This encloses the raw function named by original live C139 call #4468 at
the explicit source coordinates $Y=4,\eta=0$. Its original literal
Y node is #474. The condition is the inherited original written
same-datum $B_\rho$ coefficient norm for the ordinary natural
realization, with the original A.21 pressure. The fixed point, original
recurrence, and exact profile constants are bound by the replay.

## Retain the original small parameter before taking bounds

Write (a_n,u_n) for the original natural coefficient rows. The
original (B_\rho) coefficient norm and differentiated tail
majorants give

~~~text
|a_n|, |u_n| <= Q 20^(-n)/(n+1)^2
|d_eta a_n|, |d_eta u_n| <= Q rho^(-1) 20^(-n)/(4(n+1)).
~~~

The exact profile has `rho^(-1)<Q`, `Lambda=Q^64`, and `Q>2^260`.
Consequently a coefficient of (a) or (n a) costs at most
`Q 20^(-n)`, and an ordinary first eta derivative costs at most
`Q^2 20^(-n)`.

For real (|\eta|\le1), the original
`Ustar=4 eta+j0`, `Hstar=D eta+d Ustar`, and
`Wstar=1-4d-2D eta Ustar` have magnitudes at most (5,11/2,10).
Also (0\le d\le1), (|L|\le1), (L^{-1}<2), and the actual
`zeta=-L Hstar/(Hstar^2+sigmaStar^2)` is bounded by (Q).
In the original recurrence, the average and its derivative retain their
(u_n/(n+1)) factors. Their correction to (W) costs at most
`2 Q^2 Lambda^(-1) 20^(-n)`. After the original `Lambda^(-1)`
factors, coefficient bounds for (W,U,H_c) are respectively
(12,6,7), each times (20^{-n}). The original prefactor
`W+h(1-2 eta U)+d u zeta` costs at most
`2 Q^2 20^(-n)` (the 1 applies only at zero order).

The retained three products in the actual (R_1) coefficient are
`pref*a`, `W*(n a)` and `H_c*d_eta a`. The convolution has (n+1)
terms, and the factor (L^{-1}\le2) gives the checked uniform bound

~~~text
|(R1)_n| <= 64 (n+1) Q^3 20^(-n).
~~~

Introduce (b_0=1) and
`b_(n+1)=-chi*b_n/[2(n+1)(n+2)]`. The original recurrence, with all
actual pressure and correction terms retained, implies for
(d_n=a_n-b_n)

~~~text
d_0=0
d_(n+1) = (-chi*d_n + Lambda^(-1)*(R1)_n)/[2(n+1)(n+2)].
~~~

Both absolute sums converge for real $0\le Y\le5$ by the coefficient
majorant. The original runtime's published point domain has $Y\le41/10$,
which includes the requested point $Y=4$.
The (d_0=0) equality makes the homogeneous multiplier at most
(Y/12) when summing higher terms. The forcing contributes at most
`16 Q^(-61) Y/(1-Y/20)`. At (Y=5) the resulting bound on
`sum |d_n| Y^n` is `(1280/7) Q^(-61) < 256 Q^(-61) < 2^-15852`.
The same upper bound holds for the coefficient series throughout that
real range of $Y$ and $|\eta|\le1$.
In particular, the alternating recurrence is a tightly enclosed
comparison to the actual raw function at the specified fixed point.

## Exact endpoint arithmetic

At (eta=0), the original (H_*=j_0) and
(\sigma_*=j_0/2000) give the exact rational
(\chi=4000000/4000001). With (Y=4), the comparison terms have
consecutive magnitude ratio
`2 chi/((n+1)(n+2))<1`. The exact alternating enclosure after
degree 37, plus a conservative bound on the analytic perturbation,
fits between adjacent dyadic endpoints with denominator $2^{260}$.
Both integer numerators and the exact bound are in `phi-y4.json`.
The two separate exact Python replays are byte-identical.

```text
python -B enclose_original_phi_y4.py ORIGINAL_M2_NAVIER/actual-continuation-exact-core.mjs ORIGINAL_M2_NAVIER/source-profile-data.mjs C139/expanded.json C139/active-y-reach.json phi-y4.json
```

The open work concerns (u), the average, actual eta jet enclosures,
other physical frames, and general N, along with the inherited
ordinary-natural realization theorem. RELEASE HOLD.
