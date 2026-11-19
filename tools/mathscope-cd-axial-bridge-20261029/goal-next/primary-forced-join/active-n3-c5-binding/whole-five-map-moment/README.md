# Actual N3 weighted whole FiveMap integral

This replay binds the actual whole integral #22151951 to the original two
native axial bump copies in GitHub run 44582875351. It reads the complete
original first-spatial source with the authenticated extended registry.

Fix the original band label and its admissible slow image. The actual
monotone inverse is called with `(Z,T)` and has bracket `[1/2,2]`.
The actual axial coefficients have free chart coordinates `(ell,Z,T)`.
The two whole bounds have no free chart coordinates. In particular the
actual native arguments of `Gamma_F` replace the formal radius by the
integral's bound variable, holding these other coordinates fixed.

Write `E=exp(1/5)`, `x0=sqrt(2*X0Imean)*exp(1/2)` and
`B_j(R)=s^(-A) eta0(R/(sqrt(s)*E^j))/E^j`. The raw body is
`c0 B_0+c1 B_1`, with `c1=-c0/E` from its actual coefficient operands.
The two source profiles use the same guarded smooth function of
`10*(R/(sqrt(s)*x0*E^j)-1)`. Thus their supports lie in
`[sqrt(s)*x0*E^j, (11/10)*sqrt(s)*x0*E^j]` for `j=0,1`.

The inherited original shell verifier checks the same `Xa`, `Xb` and
terminal radius formula. Its strict inequalities are
`Xa < X0Imean` and `exp(5)*X0Imean < Xb`. Since `s>=1/2`,
`s*x0^2>=exp(1)*X0Imean>Xa`. Since `s<=2`, `(11/10)^2<2<exp(1)`,
and `1+2/5<2`, the square of the upper support is less than
`4*exp(3)*X0Imean < 4*Xb`. Both full bumps are therefore integrated on
the admitted chart.

For the complete first weighted moment put `M0=int R*B_0(R) dR`.
In the dilated copy `R=E*u`, the weighted integrand and Jacobian give
`M1=E*M0`. The actual whole is `c0*M0+c1*E*M0=0`. The utilized raw
and separately retained compact FiveMap potentials therefore agree
on this chart under the original real native semantics. The result
does not depend on numerical evaluation of the huge exponents.

A finite-window exact control uses a test bump `u^2*(1-u)^2` on
`(0,1)`, `s=x0=c0=1`, and the same dilation `E=exp(1/5)`.
The shortened window `[1,11/10]` omits the full second bump and
gives the nonzero weighted moment `7/2000`. This control exhibits
the support premise in the proof. The original source's window
contains both bumps.

The remaining source-image and smooth-branch contracts, the first
correction's wave gauge and uniform weighted norms, the raw N3
repeat append, N7-06, N8-05 and final jets remain separate.

```text
python -B verify_five_whole_moment.py --reader SPATIAL_READER --repo REPO --goal GOAL_NEXT --artifact FIRST_SPATIAL_GRAPH --scratch SCRATCH --out NEW_RECEIPT.json
```
