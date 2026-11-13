# Full vector force in the moving heat exterior

**VERIFIED for the same source-identified geometric exterior.** Retain the
notations of `README.md` and let \(s_*=\tau_0 X_b\). Define the second
positive original scale

\[
 S_R=\frac{\tau_0^{2A+2}B_h^4 s_*^{-4A}}{4A}.
\]

It differs substantially from the moving exterior energy scale \(S\).
The original force on the geometric exterior has exactly the additional
components

\[
 f_r=C(1-C)K_{\rm heat}^2/r + C_r p_{\rm loc},\qquad
 f_z=C_z p_{\rm loc}.
\]

The radial acceleration arises after the exact original centrifugal term
and normalized pressure gradient combine. It is nonzero when the time
cutoff is between zero and one on the radial and axial plateaux.

## Closed cell lower bounds

The cell is

\[
 4s_*\le s\le8s_*,\qquad |\zeta|\le1/2,\qquad
 11/16\le\rho\le13/16,
\]

with every physical angle. The genuine moving boundary is
\(s_b=2Qs_*<4s_*\). The actual radial scale ensures \(8s_*<1/4\), so
\(C=c\) and the radial pressure cutoff derivative is exactly zero on this
cell. The original directed cutoff evaluator certifies
\(1/5<c<4/5\) throughout the closed time interval. It follows that
\(c(1-c)>4/25\).

The radial square integral uses \(s^{-1-4A}\). Its exact ratio over
\([4s_*,8s_*]\) to the full power integral \(s_*^{-4A}/(4A)\) is
\(4^{-4A}(1-2^{-4A})>1/128\), since \(2<4A<3\). The original
kernel has \(H^4>1/2\) there. The angular Jacobian is \(\pi\,ds\) and
the axial interval has length one. Even using only \(\pi>3/2\), the
spatial square at every time in the cell exceeds
\((3/2)(4/25)^2 S_R/(2\cdot128)\). Multiplying by the time length
\(1/8\) gives the spacetime square lower bound. For the squared
\(L^1_\rho L^2_x\) norm, use the square root of the spatial lower bound
at each time and then multiply the square by \((1/8)^2\).

## Upper bounds on all three components

Use \(C(1-C)\le1/4\), \(H\le1\), and the original pressure bound
\(\lvert p_{\rm loc}\rvert\le B_h^2s^{-2A}/(4A)\). Uniformly at each
time, the uncut spatial integrals of the square of the normalized
radial acceleration \(\tau_0^{A+1}K^2/r\) and pressure
\(\tau_0^{A+1}p_{\rm loc}\) are bounded by \(6S_R\) and
\((3/4)s_* S_R\), respectively. For the pressure, integrate
\(s^{-4A}\) on \([s_b,1/2]\), use \(s_b\ge s_*\) and
\(4A(4A-1)>2\), and bound the full angular and axial factor by
\(\pi\sqrt2<6\). The cutoff derivative bounds give
\(|C_r|\le324\) and \(|C_z|\le324/z_0\). Consequently

\[
 \frac{\|F_r\|_2^2}{S_R}\le\frac6{16}+\frac{6\cdot324^2}{4}s_*,
 \qquad
 \frac{\|F_z\|_2^2}{S_R}\le\frac{3\cdot324^2}{4}\frac{s_*}{z_0^2}.
\]

These terms use the full velocity and pressure on this exterior. The
azimuthal square is less than \(13S\) after time integration, from the
same-domain directed replay. The time length is \(1/2\), so
Cauchy–Schwarz bounds the squared \(L^1_\rho L^2_x\) norm by half the
spacetime square upper bound.

To verify the scale conversions without evaluating huge source constants,
let \(L=\log(1/q_{\rm Big})\). The two original inputs
\(L>2048/h^2\) and \(L>R_*^{1024}/2\) imply
\(hL>2048/h\) and \(hL>32R_*^{512}\), the latter by their geometric mean.
With \(X_b\le R_*^2/4\), this proves
\(s_*/z_0^2=\tau_0^{2h}X_b<2^{-8192}\), as well as \(s_*<2^{-8192}\).
Moreover

\[
 \log(S_R/S)=\log\frac{h}{1+2h}+2\log B_h
          +2h\log(1/\tau_0)-(2+2h)\log X_b.
\]

The pinned source amplitude has \(B_h>1\). The sum of the negative
logarithms \(\log(1/h)+\log(1+2h)\) is less than \(1/h\) for the
source's \(h<2^{-8192}\). Retain one copy of \(hL\) to absorb this
loss and use the other to dominate \((2+2h)\log X_b\). The original
\(R_*\ge2\) and \(\log R_*\le R_*\) give a remainder greater than
\(8192\), hence \(S_R/S>2^{8192}\).

The exact integer/rational replay gives the following enclosures.

| Actual full force quantity on the moving heat exterior | Interval divided by \(S_R\) |
| --- | --- |
| Spacetime squared \(L^2\) norm | \([2^{-16},1/4]\) |
| Squared \(L^1_\rho L^2_x\) norm | \([2^{-20},1/8]\) |

In particular the full whole-K squared force norm is greater than
\(2^{-20}S_R>2^{8172}S\). This is a lower bound from one exact part of
the original final field. Whole-K force upper bounds, the center and
annulus contributions, and the whole-K balance and (10.13) comparison
remain open. N7-06 and N8-05 remain OPEN, jets 0/67, RELEASE HOLD.

Replay with the same arguments as `check_moving_heat_energy.py`, plus
`--moving <moving-heat-energy.json>` and `--out <radial-force.json>`.
