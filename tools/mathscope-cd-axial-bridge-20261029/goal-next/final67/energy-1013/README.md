# Original (10.13) endpoint comparison

**VERIFIED exterior budget.** The checker binds the 166-page original
manuscript by SHA-256 and reads the localization on page 118 and Lemma 10.4
on page 121. At the original endpoint \(t_*=1-\tau_0/2\), the time cutoff
is identically zero through \(t=1-\tau_0\), including its derivatives.
Thus the interval \(\rho=\tau/\tau_0\in[1/2,1]\) covers every nonzero
contribution to the integrals up to \(t_*\). The spatial cutoff confines
the fields to the original physical whole-\(K\) domain.

Write \(U=\tau_0^A u\), \(F=\tau_0^{A+1}f\), and
\(d\widetilde x=dx\,dy\,d\zeta\) for \(\zeta=z/z_0\). Let
\(E_*=(1/2)\int |U|^2\,d\widetilde x\) at the endpoint and
\(D_*=\tau_0^{2A+1}\int|\nabla u|^2\,d\widetilde x\,d\rho\) on the slab.
Both sides of (10.13) carry the same positive factor
\(z_0\tau_0^{-2A}\). The exact normalized inequality is

\[
 2(E_*+D_*)\le
 \left(\int_{1/2}^1\|F\|_{L^2(d\widetilde x)}\,d\rho\right)^2.
\]

The original moving heat exterior \(X\ge X_b\) contributes less than
\(4S\) to the left side. The same final field's full vector exterior
forces a whole-\(K\) right side greater than \(2^{8172}S\), with
\(S=\tau_0(2^A c_\infty)^2 X_b^{-2h}/(2h)\). Positivity ensures these
contributions can be used in a sufficient whole-\(K\) comparison. The
exact remaining interior budget is

\[
 2(E_{\rm inner}+D_{\rm inner}+E_{\rm annular}+D_{\rm annular})
 \le (2^{8172}-4)S .
\]

The actual third-order endpoint core receipt also provides a strictly
positive center contribution, on a region disjoint from the heat exterior.
That lower endpoint is retained separately.

**VERIFIED directed full inner upper endpoints.** The center replay rebuilds
the original order-three coefficient graph and matches its 123,870 nodes
by SHA-256. The separate native receipt fixes the actual even Picard
roots and their pressure datum. For the 22 scalar field factors used by the
original 16 operator rows, the replay reconstructs the positive-order
Cauchy factors through degree three from the original normalized cutoff
weights, strips and auxiliary solution norms. It evaluates both original
leading norm programs. No implicit boundary values enter these arithmetic
traces. All source factors are kept as closed directed exponential
endpoints, since ordinary floating-point numbers cannot represent them.

The exact source stencil converts those factors into bounds for endpoint
energy, axial and transverse dissipation, and the squared spacetime norm
of the full actual force on \(X\le X_a\), including the axis. It keeps the
outer axial and time cutoff derivatives and their source factors. The
directed center upper bound exceeds one quarter of the certified exterior
force lower endpoint. This arithmetic comparison supplies no upper margin
for the whole-K inequality and establishes no violation. A sharper
absolute leading core norm or a direct cell evaluator would be needed
for a useful comparison with the exterior lower bound. The initialized
annular field receipt does not supply the active annular correction
bounds for this comparison.

The inequality itself has no interior boundary terms. For a separate
energy-defect computation, the fluxes on \(X=X_a\) and \(X=X_b\) cancel
after identifying the identical traces with opposite orientations. This
includes the moving-boundary term from Reynolds transport. Neither
the spatial/temporal refinement table nor the actual final annulus is
established here. N7-06 and N8-05 remain OPEN, jets 0/67, RELEASE HOLD.

```powershell
$out = 'work/goal-next/continuation40/energy-1013'
$g = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
python "$out/check_exterior_1013.py" `
    --paper 'work/paper-audit/openai-public-manuscript.pdf' `
    --chart 'work/goal-20261111/m3/whole-k-chart.json' `
    --moving "$g/final67/moving-heat-energy/moving-heat-energy.json" `
    --radial "$g/final67/moving-heat-energy/radial-force.json" `
    --center "$g/whole-k-center-n3/endpoint-third-bound.json" `
    --out "$out/exterior-1013.json"
node "$out/check_center_energy.mjs" $g `
    'work/goal-next/annular-numeric-24/pinned-original-runtime' `
    'work/goal-next/whole-k-prefix/historical-scale-arithmetic-input.json' `
    "$out/center-energy-tight.json"
```
