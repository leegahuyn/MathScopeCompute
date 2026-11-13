# Moving original heat exterior energy and force on whole K

**VERIFIED on the original geometric heat exterior, using the stated
exterior identification.** The region is the part of whole K with
\(X=r^2/(2q)\ge X_b\). Its inner boundary moves with \(z,t\). This
replay reaches that boundary, unlike the earlier calculation with
fixed \(r^2\ge2^{-1024}\). On this region the original final field is
the actual heat swirl with its pressure, multiplied by the original
cutoffs. The source premise is the same Lemma 5.2, Proposition 5.5 and
Proposition 9.9 Step 4 used in the pinned geometric exterior receipt.
No estimate on the inner or annular corrections is needed here.

Use \(A=1/2+h\), \(D=1/2-h\), \(z_0=\tau_0^D\), \(\zeta=z/z_0\),
\(\rho=\tau/\tau_0\), \(Q=q/\tau_0\), \(s=r^2\), and
\(s_* = \tau_0 X_b\). The source velocity before localization is
\(K_{\rm heat}=B_h s^{-A} H(4\tau/s)\), where \(B_h=2^A c_\infty\) and
\(H\) is the normalized source Laplace kernel. Write

\[
R=\chi(2s),\quad Z_a=\chi(2\zeta^2),\quad c=\chi(\rho),\quad
U=\tau_0^A R Z_a c K_{\rm heat}e_\theta,\quad F=\tau_0^{A+1}f.
\]

All integrals below use \(d\zeta\,r\,dr\,d\theta\) and the positive
time measure \(d\rho\) after reversing the physical time limits.
Physical energy carries the common external factor
\(z_0\tau_0^{-2A}\). The scale inside this normalization is

\[
M=\tau_0^{2A}B_h^2,\qquad
S=\frac{M s_*^{-2h}}{2h}
 =\frac{\tau_0 B_h^2 X_b^{-2h}}{2h}>0.
\]

The replay retains \(S\) as an exact positive source expression. Its
directed numerical intervals enclose the ratios to this expression.

## Radial integration and moving boundary

The lower limit is \(s_b=2Q s_*\), with \(1\le2Q<4\). The original
terminal schedule has \(X_b=X_R\exp(\text{terminal.end})>110\), so
\(4\tau/s\le2/X_b\) throughout this exterior. The derivative bound of
the actual \(H\) and \(H(0)=1\) give \(1-2h\le H\le1\). Set
\(L=\log(1/q_{\rm Big})\). The source threshold gives
\(L>(64/h)^2/2\) and \(L>512\log R_*\), and the actual radial
envelope satisfies \(4X_b\le R_*^2\). Therefore
\(\log(4s_*)<-(255/256)L\). From \(h=e^{-8002T}\), \(T>10\), one gets
\(h,\tau_0,\tau_0^{2h},(4s_*)^{2h}<2^{-8192}\).

For fixed \(\zeta,\rho\), let
\(J=\int_{s_b}^{1/2} R^2 H(4\tau/s)^2 s^{-1-2h}\,ds\).
Since \(R=1\) on \([s_b,1/4]\) and \(0\le R\le1\),

\[
(1-2h)^2\big((2Q)^{-2h}-(4s_*)^{2h}\big)
\le \frac{M J}{S} \le 1.
\]

Use \((2Q)^{-2h}\ge1-4h\) to enclose the radial factor by
\([1-2^{-8188},1]\) uniformly in space and time. The large logarithmic
radial range is integrated with the original exponent \(-1-2h\).
Replacing the original power by \(s^{-1}\) throughout this moving region
would lose the leading scale \(S\).

Put \(I_Z=\int Z_a^2\,d\zeta\). At the final slice the endpoint energy
divided by \(S\) is within the radial-factor interval times
\(\pi I_Z/2\). The start slice vanishes exactly. Since \(\int -c'\,d\rho=1\)
and \(\int -cc'\,d\rho=1/2\), the leading work ratio also equals
\(\pi I_Z/2\), and the leading squared \(L^1_\rho L^2_x\) azimuthal force
ratio equals \(\pi I_Z\). The leading spacetime azimuthal force square
ratio is \(\pi I_Z\int(c')^2\,d\rho\).

## Error estimates and the energy flux

The original force identity is
\(f_\theta=(C_t-\Delta C)K_{\rm heat}-2C_r\partial_r K_{\rm heat}\),
with \(C=R Z_a c\). The other two force components do no work on this
pure swirl. They can only increase its spatial \(L^2\) force norm.
The dimensionless error between \(F_\theta\) and its term with \(-c'\) is
pointwise at most \(\sigma\tau_0^A K_{\rm heat}\), where

\[
\sigma=(156384+2\cdot324\cdot4)\tau_0+155952\tau_0^{2h}
<2^{-8173}.
\]

The derivative contribution uses \(r\ge1/2\) where \(R_r\ne0\) and
\(|r K_r|\le2K\). The uncut radial bound gives
\(\|\tau_0^A K\|_{L^2_x}\le\sqrt{\pi\sqrt{2}S}<3\sqrt S\) uniformly
on the moving exterior. For the work and spacetime force square use this
bound, the uniform radial-factor error, \(|c'|\le108\), and
\(\int |c'|=1\). For \(L^1_\rho L^2_x\), use the reverse triangle
inequality and the time length \(1/2\). The resulting ratio error bounds
are respectively \(2^{-8170}\), \(2^{-8162}\), and \(2^{-8168}\), as
checked by exact rational arithmetic. This yields a lower bound on the
actual whole-K force norm from its azimuthal component alone.

The transverse gradient includes the rotating-frame contribution
\((R K/r)^2\). The remaining radial piece is \((R_r K+R K_r)^2\).
With the time weight \(\tau_0\), integrate the \(K^2/r^2\) bound using
\(\int_{s_b}^{1/2}s^{-2-2h}ds\le s_*^{-1-2h}/(1+2h)\) and
\(\tau_0/s_*=1/X_b<1\). Use the cutoff derivative bounds for the other
radial term and the axial gradient. This gives weighted full dissipation
at most \(2^{-8171}S\).

The moving inner face has outward vector area
\(-r_b(e_r-r_{b,z}e_z)d\theta d\zeta\), with radial cutoff flat there.
Its advective and pressure energy fluxes vanish since the velocity is
purely azimuthal. The viscous term retains both radial and tilted axial
pieces. The normalized Reynolds transport term retains the face motion.
Use

\[
\left|r_b r_{b,t}\right|\le4X_b,\qquad
\left|r_b r_{b,z}/z_0\right|\le4s_b/z_0^2,
\qquad
\tau_0^{2A}K(r_b)^2\le\frac{2hS}{s_b}.
\]

The first bound follows from the original time derivative of \(q\).
For the second use \(|\eta|<3/4\), \(z_0q^{-D}=Q^{-D}\le2\) and
\(1-2h\eta^2>1/2\). The radial viscous flux, tilted axial viscous flux,
and moving-face term have absolute ratios at most \(16h\),
\(10368h\tau_0^{2h}\), and \(16h\), respectively. Their sum is below
\(2^{-8184}\). The outer radial and axial cutoff faces contribute zero.

The leading \(\pi I_Z/2\) occurs in both endpoint energy and work.
Keeping that term correlated gives the exterior balance defect
\(|E+D-W-\Phi|/S<2^{-8168}\) directly from the exact source remainders,
where \(\Phi\) includes viscous and moving-face flux. This analytical
bound for the moving exterior is independent of the displayed interval
widths. The whole-K numerical defect remains open.

## Executed refinements

| Quantity divided by S | Outward display interval, both axes refined |
| --- | --- |
| Endpoint energy | [1.85413, 1.86641] |
| Force work | [1.85413, 1.86641] |
| Spacetime azimuthal force square | [11.49995, 12.91948] |
| Squared \(L^1_\rho L^2_x\) azimuthal force norm | [3.70826, 3.73281] |

The code integrates the original axial cutoff square using monotone
endpoint brackets on 32 and 64 spatial transition cells. It evaluates
the original \((c')^2\) by directed cell intervals on 64 and 128 temporal
cells. The spatial and temporal refinements separately narrow the
azimuthal force-square interval, as checked in exact rational arithmetic.
The precision-only run keeps the same cells and changes 72 to 96 bits.
The reported ratios carry the heat and commutator error intervals.

The earlier fixed-radius endpoint energy is less than \(2048M\).
Since \(s_*<1\), \(S/M>1/(2h)>2^{8191}\), and the new endpoint energy
exceeds \(S\). The geometric exterior energy is therefore more than
\(2^{8180}\) times that fixed-radius contribution. This comparison is
source-relative and does not claim an absolute decimal value of \(S\).

**OPEN.** The same final-field center and annulus, full force upper
interval, entire whole-K defect and (10.13) comparison remain open.
These refinements apply to the actual moving heat exterior, with
whole-K lower bounds by positivity. They leave N7-06 and N8-05 OPEN,
final jets at 0/67, and RELEASE HOLD.

```powershell
$base = 'work/goal-next'
$out = "$base/continuation39/heat-energy"
$goal = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
$heat = "$base/second-live/node-fixture/research-ide/mathscope-m2/navier/actual-continuation-exact-heat.mjs"
$env:PYTHONDONTWRITEBYTECODE = '1'
python "$out/check_moving_heat_energy.py" `
    --localization-source "$base/final67/source" --heat-source $heat `
    --chart 'work/goal-20261111/m3/whole-k-chart.json' `
    --exterior "$goal/whole-k-exterior" --out "$out/moving-heat-energy.json"
```
