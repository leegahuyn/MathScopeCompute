# Independent refinement on the original moving heat exterior

**VERIFIED on the stated exterior identification.** On the original
`X=r^2/(2q)>=Xb` part of the whole-K slab, the exterior theorem makes the
final localized velocity, pressure and force equal to the original heat
field with the source cutoffs. This certificate uses that identification and
the pressure normalization at radial infinity. It checks only those
physical circles and the original exterior pressure integral.

| Axis | Baseline | Independent refinement | Verified comparison |
| --- | ---: | ---: | --- |
| Axial cutoff transition grid | 32 cells | 64 cells | Exact enclosing widths decrease for endpoint energy and spacetime azimuthal force squared |
| Directed arithmetic | 72 bits | 144 bits | Exact enclosing widths decrease in both metrics while the spatial and time grids stay fixed |
| Physical angular Fourier cutoff | 2 | 4 | Both omitted tails and their retained-field difference are exactly zero |
| Exterior heat coefficient degree | 4 | 8 | Every listed uniform remainder cap is more than 1,000 times smaller at degree 8 |

The integration rows preserve the 64-cell time grid and the exact angular
integral. The printed upper bounds on energy interval width are 0.024544
and 0.012272 under the spatial refinement. The upper bounds on azimuthal
force-square interval width are 2.844678 and 2.763810. Values are ratios to
the positive exact exterior scale in the parent receipt. Doubling arithmetic
precision narrows both exact intervals by less than the displayed decimal
resolution. The heat-order comparison uses pointwise coefficient errors on
the whole moving exterior. Its bounds are independent of the choice of grid,
Fourier cutoff and directed arithmetic resolution.

## Exact physical angular cutoff

For the exterior field use the cutoffs `C=C(r,z,t)` and write
`u=C K e_theta` and `p=C p_loc`. The verified force formula gives
`F=F_r e_r+F_theta e_theta+F_z e_z`, with cylindrical scalar components
independent of angle. Thus in Cartesian coordinates the velocity has modes
`±1`, the pressure has mode `0`, and the force has modes from
`{−1,0,1}`. The operators
`d_x=cos(theta)*d_r−sin(theta)*d_theta/r` and
`d_y=sin(theta)*d_r+cos(theta)*d_theta/r` give transverse gradient
modes from `{−2,0,2}`. The axial gradient has modes from `{−1,1}`.

The gradient requires mode two on the actual spatial and temporal plateau.
There
`d_x u_y=(K_r+K/r)/2+(K_r−K/r)*cos(2 theta)/2`. The original radial
slope gives `K_r<0<K/r`, so the mode-two term is nonzero. A five-point
uniform angular grid resolves all field modes and integrates their quadratic
averages exactly by roots of unity. At four points the +2 and −2 modes
alias, and a nonzero fourth mode of a component-square can alias to the mean.

## Signed finite heat remainder

The pinned original heat and mean-stress compilers bind
`Z=2*(1−eta^2)/X=4*tau/r^2`, the original compactified Laplace variable,
and the normalized weight `exp(−v)*v^h/Gamma(1+h)`. The exact terminal
parameters have `XR>110` and the preceding outer stage lengths are
positive. In particular `lambda>h` gives `Qsteep>0`, and the hold term
gives `Qb>exp(−1/2)*(1−h)*(−4 log h)>1`. Monotonicity and the unit
change of the terminal source cutoff give
`0<Qp<=exp(3)*co*h/(1−co*h)<27/63<1`, using `co<=1` and `h<1/64`.
Therefore `wait=log(Qb/Qp)/(1−h)>0` and
`Xb=XR*exp(terminal.end)>110`. The same argument cap
`0<=Z<=2/Xb<1/55` covers increasing radii in the pressure tail.

The m-th differentiated integrand of `H` has sign `(−1)^m`.
The positive absolute integrand is dominated by
`(h)_m v^m exp(−v) v^h/Gamma(1+h)`; its integral is
`(h)_m (1+h)_m` by the Gamma recurrence. Differentiation under the
integral and finite Taylor's theorem give, for the degree-`N` polynomial,

```
P_N(Z) = sum_(j=0)^N (-1)^j (h)_j (1+h)_j Z^j / j!
abs(Z^d * (H^(d)(Z)-P_N^(d)(Z)))
  <= (h)_(N+1) * (1+h)_(N+1) * Z^(N+1) / (N+1-d)!   (d=0,1,2).
```

The sign of `H^(d)-P_N^(d)` is negative or zero at both tested even
orders. The certificate keeps the actual positive factor `h` in every
uniform bound. The bounds multiplying `h` for the value of `H` are
below `5.104e-8` and `9.545e-12` at degrees 4 and 8.

Put `B=2^A*cInfinity` and `s=r^2`. The exact pressure polynomial is
the radial integral of the square of `B*s^(-A)*P_N(4*tau/s)`. Each term
has the positive antiderivative denominator `2A+i+j` and the original
factor `1/2` from `dr/r=ds/(2s)`. If `E0` is the `H` remainder
bound, `0<H<=P_N<=1+E0` gives the common squared-heat and pressure
error factor `Ep=(2+E0)*E0`. The localized force error uses this factor
and the two heat-derivative tails in the source's exact reduced force
identity, with the original time, radial and axial cutoff terms retained.

**OPEN.** The last checked positive time in this exterior slab is
`tau0/2=qBig/64`. The last resolved time for whole K still needs the
inner and annular fields. The active wave and mean correction orders,
pulse wavelength and axial mesh checks, and the full-field uniform tails
and refinements remain open. N8-05 and final jets 0/67 remain open.
RELEASE HOLD.

## Replay

Run from a workspace that has the original archived input trees. The
original heat source, `actual-mean-stress.mjs` and
`actual-global-source-outer.mjs` must be in the same directory.

```text
python check_exterior_n8_axes.py --localization-source LOCALIZATION_ARCHIVE \
  --heat-source ORIGINAL_RUNTIME/research-ide/mathscope-m2/navier/actual-continuation-exact-heat.mjs \
  --chart ORIGINAL_WHOLE_K_CHART --exterior GOAL_NEXT/whole-k-exterior \
  --criterion REPO/research-ide/mathscope-m3/ORIGINAL_M3_M4_CRITERIA.json --out NEW_JSON
```
