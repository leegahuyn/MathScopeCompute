# Actual pulse covariance in the Gaussian coordinate

## Scope and source

`actual-pulse-covariance-integrals.mjs` evaluates the two columns of the actual
homogeneous pulse covariance from (7.27) at an `Imean` representative. It consumes
the frozen actual-source phase and amplitude construction documented in
[`ACTUAL_PULSE_AMPLITUDE.md`](ACTUAL_PULSE_AMPLITUDE.md). The accepted N3 profile,
positive `h`, `lambda`, original left growing datum, integer rounding, moving
frame, damping, and source phase correction are unchanged.

The source is `same-profile-2026-10-10.3`, assembly SHA-256
`184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd`.
The primary reference is [*Finite Time Blowup for Navier–Stokes*](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf),
SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`,
printed pp.63–67 and 74–83, especially (6.11), (6.16), (6.19), (7.12),
(7.21), (7.22), and (7.27). The source permits a choice of the transverse and
time cutoffs; the concrete admissible choice below is now fixed. It does not
alter the N3 velocity or stress.

Public API:

```js
actualMeanPulseCovariance({y:2.5, cells:256, cutoffCells:256})
observeActualPulseGaussianCenter({y:2.5, w:[-8,8]})
actualPulseTransverseMass({cells:256})
```

The representative has `eta=0`, `s=q/Q=1`, and `1/4<=y<=19/4`.
Gaussian and transverse cell counts may be 64, 128, 256, or 512.
The returned covariance is for this actual representative, **not** the entire
slow neighborhood or annulus. The producer does not accept a target-stress
fixture or declare weights/global assembly complete.

## 1. Resolve the actual pulse width

Let `G=lambda0*L_s/u_star>0`, `a=1/2+v/L_s`, and `delta=1/u_star>0`.
The accepted source estimates give

\[
 G^{-1}\le2^{-1000},\qquad 0<G^{-1/2}\le2^{-500}.
\]

The correct integration coordinate is

\[
 w=\sqrt G(a-1),\qquad dv=L_sG^{-1/2}\,dw.
\]

A uniform finite grid in `a` does not resolve this width. The producer uses
exact dyadic cells in `-8<=w<=8`, retaining the coordinate as
`a=1+w/sqrt(G)`. Its displacement is tiny but not set to zero.

For an interval of requested `w`, the implementation carries its entire
outward interval for `a` into the **full initial-to-current-point** Liouville
transfer. On the whole interval from `a=1/2` to that endpoint it encloses

\[
 D=\widetilde a^2+(t_a/u_*)^2,\quad
 H=\frac{(1+\vartheta)^2}{4}
   \left(1+\frac{(t_a/u_*)^2}{D}\right),
\]

and uses the positive comparison transfer from the frozen amplitude module.
The initial state, original left datum, actual normal-rounding error, and
growth-multiplied phase factor are all retained. This is not a copied midpoint
value or a replacement by the reference eigenvector.

It returns simultaneous bounds for

\[
 X=t_r/P,\quad \Theta=t_\theta/(\sqrt\lambda u_*P),
 \quad Z=t_{z,+}/(u_*P).
\]

Across `|w|<=8`, their products `X Theta` and `X Z` are enclosed near `1/8`.
The enclosure refers to actual source values on that complete central interval;
the zero-small-parameter limit `1/8` is only an independent arithmetic probe.

## 2. A stable actual reference kernel

The exact reference logarithm is `log P=G f(a,delta)` with

\[
 f(a,\delta)=\log\frac{a+\sqrt{a^2+\delta^2}}
                         {1+\sqrt{1+\delta^2}}
 -\frac{(a-1)\delta^2+(a^3-1)/3}{(1+\delta^2)^{3/2}}.
\]

Its derivatives satisfy

\[
 f(1)=f'(1)=0,\quad f''(1)=-3(1+\delta^2)^{-3/2},
\]

\[
 f'''(a)=\frac{2a^2-\delta^2}{(a^2+\delta^2)^{5/2}}
          -\frac2{(1+\delta^2)^{3/2}}.
\]

On `1/2<=a<=3/2`, the first magnitude is bounded by `2/a^3<=16`,
and the second by 2. Thus the deliberately loose bound `|f'''|<=32`
holds over the full required path. Taylor's theorem gives, on `|w|<=8`,

\[
 2Gf(1+w/\sqrt G,\delta)=-3w^2+e,
\]

\[
 |e|\le\frac{32}{3}|w|^3G^{-1/2}
          +\frac92w^2\delta^2<2^{-480}.
\]

The final inequality is checked with exact positive Fractions in the independent
audit. In particular the positive `delta` contribution is not deleted. The
kernel is evaluated as `exp(-3*w^2+[-2^-480,2^-480])`, avoiding subtraction of
enormous logarithms. At `w=0`, the source identity `P=1` is exact.

Every dyadic cell bounds the Gaussian kernel throughout that cell and multiplies
it by the actual central multiplier intervals. Summing these rectangle
integrals encloses the central contributions to

\[
 A=\int\psi^2 X\Theta P^2\,dw,\qquad
 B=\int\psi^2 XZP^2\,dw.
\]

The implementation also records midpoint density enclosures for visualization.
These are distinct from its whole-cell bounds and quadrature contributions.

## 3. A nonzero tail bound on the entire source pulse

The source cutoff is 1 throughout the central interval because
`8*2^-500<1/5`. For the remainder, it suffices to use `0<=psi<=1`, the
whole-pulse amplitude bound, and a Gaussian majorant.

Here are explicit constants behind the product bound. The positive scaled
Liouville state obeys `1/2<=W,Z_state<=2` for all `0<=v<=L_s`, by the
cooperative comparison already proved for the frozen amplitude. Its minimum
does not decrease; its maximum grows by at most `exp(integral H/G d zeta)`.
The initial state lies close to `(1,1)`, `H<1`, and the whole Liouville
interval is shorter than 2, giving the stated loose bound.

For the actual tiny source parameters, `t_a<1.01`, `1/2<=a_tilde<1.51`,
`D>=1/4`, `V_0=D_0^(1/4)*sqrt(D_ref,0)<.36`, and the actual phase
factor is below `1.01`. The reconstruction in the amplitude document therefore
gives `0<X<3`, `|Theta|<3`, and `|Z|<5`. For example the adjusted derivative
in `X` is at most `Z_state<=2`, while `D^-3/4<3` and `D^-1/4<1.5`.
The distinct tiny ratios `q_a/sqrt(lambda)` and `q_a*sqrt(lambda)` are both
bounded by the actual source inequalities. Consequently both products have
absolute value below the conservative bound 64 on the **whole pulse**.

The source reference gives `f(a)<=-(a-1)^2/4`, hence `P^2<=exp(-w^2/2)`.
On either half-line,

\[
 \int_8^\infty e^{-w^2/2}\,dw\le e^{-32}/8.
\]

This follows by replacing 1 with `w/8` in the integrand and integrating its
derivative. Thus each full covariance integral has a signed tail enclosure

\[
 [-E_{tail},E_{tail}],\qquad
 E_{tail}=64\cdot2\cdot e^{-32}/8=16e^{-32}>0.
\]

Its outward numerical upper bound is about `2.02627e-13` and is explicitly
added to the central rectangle sums. No source tail is reported as exactly zero.
This upper bound is intentionally much larger than the eventual central-kernel
tail; it remains valid without using an unresolved asymptotic approximation.

## 4. Fix and integrate the source cutoffs

Let `sigma` be the literal smooth A.2 step already used by the pinned source:

\[
 \sigma(s)=\frac{e^{-1/s^2}}{e^{-1/s^2}+e^{-1/(1-s)^2}}
 \quad(0<s<1),
\]

with its smooth 0 and 1 extensions. Choose the transverse cutoff

\[
 \chi_g(\xi)=\chi(\xi/r_0),\quad
 \chi(x)=\begin{cases}
 1,&|x|\le1/2,\\
 \sigma(3-4|x|),&1/2<|x|<3/4,\\
 0,&|x|\ge3/4.
 \end{cases}
\]

It is nonzero, takes values in `[0,1]`, and has smooth compact support strictly
inside `(-r0,r0)`. The absolute value causes no loss of smoothness at 0 because
the function is constant there. There is **one** transverse coordinate, so

\[
 \int\chi_g^2\,d\xi
 =r_0 C_\chi,\qquad
 C_\chi=1+\frac12\int_0^1\sigma(s)^2\,ds.
\]

`sigma` is increasing, as the derivative of
`-s^-2+(1-s)^-2` is positive. Monotone lower and upper rectangle sums
therefore give a certified mass interval. There are no finite quadrature
estimates promoted to certificates. Stable negative-exponent evaluations and
the exact reflection identity handle the endpoints.

For time choose `psi=1` when `|a-1|<=1/5`,
`psi=sigma(3-10|a-1|)` when `1/5<|a-1|<3/10`, and `psi=0`
beyond `3/10`. Its support lies strictly inside the source's open `1/3`
interval, and it meets (6.16). The central calculation uses its exact value 1;
the tail uses its bounds `[0,1]`.

At 512 transverse cells the returned interval for `C_chi` is
`[1.2348083495359463,1.2357849120359587]`. An independent 80-digit
calculation gives a diagnostic value about `1.23529663078595247` inside it.

## 5. Haar measure, the two sign columns, and the determinant

The exact torus geometry is imported from `sourceTorusGeometry`:

\[
 J_{rect}=|\det(v_r,v_t)|=4-2\sqrt2.
\]

The angular average is exactly `1/2` because `kp` is a nonzero integer.
The normalized Haar average is preserved under a covering: `14^Delta` lifts,
each with Jacobian `14^-Delta`, give total factor 1. A factor `1/14` for the
full torus would be incorrect.

The two source signs use exactly opposite rounded angular frequencies.
Their `a_tilde,D,x,ybar,t_theta` are identical, and `t_z` changes sign.
This follows directly from the actual source frame and initial datum, not by
setting two separately estimated numerical values equal. Their cutoffs have
the same shape on disjoint auxiliary rectangles.

Combining (7.27), `dv=L_s dw/sqrt(G)`, the one transverse mass, and
`c_i L_s=2r0`, define the exact positive scale

\[
 C_*=\frac{J_{rect}}2(r_0C_\chi)c_iL_s\frac{u_*}{\sqrt G}
 =J_{rect}r_0^2C_\chi\frac{u_*}{\sqrt G}>0.
\]

The actual covariance has the form

\[
 H=C_*\begin{pmatrix}\sqrt\lambda A&\sqrt\lambda A\\B&-B\end{pmatrix},
 \quad\det H=-2C_*^2\sqrt\lambda AB\ne0.
\]

The producer retains `r0^2*u_star/sqrt(G)` as a positive source expression;
it is not replaced by a floating-point zero. The visualized matrix has separate
row normalizations, with the `sqrt(lambda)` scale explicit in the first row.
The determinant is reported both after division by `C_*^2 sqrt(lambda)`
and after division by the corresponding base scale before the Haar/mass factor.

At 512 Gaussian cells,

\[
 A\in[0.12400958849306987,0.13182208849355787],\quad
 B\in[0.12400958849306878,0.13182208849355778].
\]

Both lower bounds are positive. The convenient reference value
`sqrt(pi/3)/8≈0.12791583849331106` is only an independent limit diagnostic.
The actual integrals are the executed source-bound intervals, including their
nonzero tail and tiny parameter uncertainty.

Once an actual source target is supplied, the exact inverse is

\[
 y_\pm=\frac12\left(
 \frac{T_{r\theta}}{C_*\sqrt\lambda A}
 \ \pm\ \frac{T_{rz}}{C_*B}\right).
\]

This module supplies the actual integral objects and determinant lower bound.
It does not replace `T0,*` by a supplied fixture. The actual target, positive
weights, source covariance identity, and once-per-slow-box global assembly
remain explicitly false in this producer until their separate source modules
are joined. In particular the two signs are two rectangles of **one** slow box.

## Verification

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-pulse-covariance.test.mjs
node research-ide/mathscope-m2/navier/tests/actual-pulse-covariance-fixture.mjs
python research-ide/mathscope-m2/navier/tests/actual-pulse-covariance-independent.py
```

The JavaScript suite checks 10 groups, including immutable amplitude hashes,
actual displacement and full transfer, cutoff mass refinement, width-resolving
quadrature, finite source-bound point observations, nonzero tails, Haar/angular
normalization, exact sign parity, determinant positivity, input guards, replay
and cancellation. The independent Python audit makes 294 checks using exact
Fractions, `Q(sqrt(2))` geometry, and 80-digit Decimal arithmetic. Its negative
controls reject a uniform pulse grid, omitted angular half, a single covering
lift treated as full Haar measure, duplicated transverse mass, and accidental
promotion to an actual target/global certificate. No frozen runtime file was
changed by this addition.
