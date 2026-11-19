# Quantitative B.29 bounds on a fixed fraction of the activation collar

## Inputs and source boundary

This is an independent quantitative consequence of the **actual B.29
comparison bounds** in the new same-datum continuation. It does not replace
the proof that those bounds hold for that continuation. It uses the original
activation (B.26), stress factorization (B.30), and normalized cone (4.26)
from the supplied paper, pp.33, 152–153, SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.

Let `y=log(X/X0)`, `0<kappa0<1/2`, and

\[
 e_a=(1-\kappa_0)\sigma(y/t_1),\qquad \kappa=1-e_a.
\]

Assume that the same reference and actual fields satisfy, for all eta and
`0<=y<=t1`,

\[
 v_r>11/5,\quad v_r\le V,\quad p_{1,r}>0,
\]
\[
 |v_s-\kappa v_r|\le Kye_a,
 \quad |P_c-v_r|\le Kye_a,
 \quad |J_c|\le Kye_a.                         \tag{A1}
\]

Here `K=Kcmp` and `V=Vmax` are the proved comparison bounds of
`../followup-20261010-same-datum-axis/CONTINUATION_AND_NEW_DEBT.md`.
They must be supplied by its continuous integral argument. It suffices to
choose the actual positive width with

\[
 Kt_1\le1/10,\qquad VK^2t_1^2\le1.              \tag{A2}
\]

The original comparison selector's term
`1/[10^8 B0(1+K)^2(1+V)^2]`, with `B0>=1`, implies both inequalities:
`K/(1+K)^2<=1` and `VK^2/[(1+K)^4(1+V)^4]<=1`. Thus no new or
circular width choice is required.

For the final explicit continuation choices
`t1=kappa0=omega1=omega2=C^-120`, `K<C^49`, `V<C^5`, `C>=4`,
the substitution is direct:

\[
 Kt_1<C^{-71}<1/10,\qquad VK^2t_1^2<C^{-137}<1.
                                                        \tag{A2a}
\]

Thus the final fixed width satisfies A2 without an unevaluated dyadic
search. With `Lambda<=C`, A10 also gives `a>=C^-122` on activation.

## 1. Exact flat-cutoff bounds

For `r=y/t1>=1/8`, monotonicity and the literal sigma formula give

\[
 e_a\ge\frac14e^{-64}>e^{-66}.
                                                        \tag{A3}
\]

Indeed the denominator in sigma at 1/8 is less than 2, and
`1-kappa0>1/2`. Also `e^2>4`. A separate entirely rational lower bound is

\[
 e_a>\frac1{4\,3^{64}}>2^{-104},               \tag{A4}
\]

using `e<3` and the exact integer comparison `3^64<2^102`.
This does not evaluate a flat factor as numerical zero.

For `0<=r<=1/4`,

\[
 e_a\le\sigma(1/4)
 <\exp(-16+16/9)=\exp(-128/9)<2^{-14}.          \tag{A5}
\]

The last comparison uses `128/9>14` and `e>2`.

## 2. Absolute cone gaps throughout activation

Put `D=P_c-v_s`. The errors in A1 contain the same flat factor, so

\[
 D\ge e_a(v_r-2Ky)>2e_a,
 \qquad P_c>21/10.                            \tag{A6}
\]

Moreover `v_s-2<=V`, and `|J_c/D|<=Ky/2`. Hence

\[
 2D^2-(v_s-2)J_c^2
 \ge\left(2-\frac{VK^2t_1^2}{4}\right)D^2
 \ge\frac74D^2>D^2>4e_a^2.                    \tag{A7}
\]

The same lower bound is valid when `v_s<=2`, since that only increases
the quadratic expression. These estimates use no division by kappa0.

Consequently, on the entire closed range
`t1/8 <= y <= t1`, for all eta,

\[
 P_c-2>1/10,\qquad P_c-v_s>2^{-103},
\]
\[
 2(P_c-v_s)^2-(v_s-2)J_c^2>2^{-206}.            \tag{A8}
\]

In particular the loop input `d0=1/40` is allowed on this range.
These are actual dyadic lower bounds obtained from A1–A2, not an
uncomputed compact minimum. They concern three source quantities and do
not assert `v_s>2` on all of activation.

## 3. An explicit admissible inner collar

On `0<=y<=t1/4`, A1, A2 and A5 give

\[
 v_s\ge(1-2^{-14})\frac{11}{5}-\frac{2^{-14}}{10}
 >\frac{21}{10}.                              \tag{A9}
\]

Thus this entire fixed-fraction collar has `v_s-2>1/10`.
The actual shear has `a=kappa p1,r>0` there. If the same reference bound
`p1,r>=1/(4 Lambda)` is used, then throughout activation

\[
 a\ge\kappa_0/(4\Lambda).                     \tag{A10}
\]

This explicit positive lower bound also persists during the subsequent
small-shear part; later convex interpolation to .8 preserves it whenever
`kappa0/(4 Lambda)<.8`. Bounds for later stages must still be verified
using their respective defining formulas.

## 4. A normalized directional margin that does not vanish with t1

Let `t=-b_s/a`, `R=p_s-(a,-b_s)`, and `n=R/|R|` in the open collar;
this is also the direction of T0 because F>0. The exact orthogonal-basis
identity is

\[
 D^2+J_c^2=(1+t^2)|R|^2.                       \tag{A11}
\]

Therefore

\[
 n_\theta+t n_z
 =\frac{\sqrt{1+t^2}}{\sqrt{1+(J_c/D)^2}}
 \ge\frac1{\sqrt{1+1/400}}>1/2.
\]

By A7,

\[
 (v_s-2)\frac{J_c^2}{D^2}\le1/4<3/2.
\]

These are exactly the two inequalities in (4.26) with the explicit
common value **kappa=1/2**, on `0<y<=t1/4`.

At y=0 the direction is defined by the actual B.30 factorization, not
by direct division of zero stress. That factorization gives its smooth
extension, parallel to `p_s,r` at the endpoint. Here `J_c/D` tends to zero
by A1–A6, and the first directional expression tends to
`sqrt(1+t(0,eta)^2)>=1`. The same kappa=1/2 therefore holds on the
**closed** inner collar, conditional on the actual B.30 input already
identified. The constants are independent of physical q.

## 5. A compatible analytic rectangle and modulation interval

One explicit radial ordering is

\[
 X_{an}=X_0\exp(t_1/16),\qquad
 X_-=X_0\exp(t_1/8).
                                                        \tag{A12}
\]

Choose a right boundary of the left collar of I before
`X0 exp(t1/4)`. Then the analytic rectangle ends strictly before I,
and an admissible collar remains at I's left endpoint. The original
parameter analyticity proof in B.6 applies to the shorter rectangle.
It is unnecessary to assert a parameter neighborhood uniform as t1 or
C changes; all parameters are now fixed.

This avoids a potential ordering ambiguity: an analytic rectangle with
endpoint `X0 exp(t1/4)` would contain the proposed start `X-`. Such a
larger rectangle could be retained only after separately proving that
the modulation vanishes there. A12 satisfies the source's simpler
strict support ordering directly.

## 6. What remains to make these global inputs

The activation supplies actual positive lower bounds in A8, A9 and A10.
To take their minimum with other pieces of the full loop rectangle, one
must retain bounds through the reference cutoff, small-shear interval,
final axial cutoff, .8 interpolation, shift, B.8 restoration and its
partial moment corrections, and the explicit early outer schedule.
The B.8 correction operator alone is not a bound for those intermediate
quantities. The source fields and moment derivatives used by A1 must
refer to the same selected amplitude and the same positive widths.

The companion requirement note identifies which finite derivative bounds
must be enclosed before the final N selector can consume this source.
This local quantitative result does not, by itself, promote N3-06.
