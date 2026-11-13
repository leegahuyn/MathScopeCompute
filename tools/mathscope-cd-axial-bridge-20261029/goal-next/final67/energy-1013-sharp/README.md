# Original center contribution to (10.13)

**VERIFIED.** For the original whole-K endpoint \(\rho=1/2\), the
axis-inclusive inner region \(X\le X_a\) satisfies the strict bound

\[
  2(E_{\rm inner}+D_{\rm inner}) < 2^{-22} S_R,
  \qquad S_R=\frac{\tau_0^{2A+2}(2^A c_\infty)^4
                           (\tau_0 X_b)^{-4A}}{4A}.
\]

This is less than one quarter of the independently certified same-field
whole-K force RHS lower \(2^{-20}S_R\). The moving heat exterior LHS is
less than \(4S\), and \(S_R/S>2^{8192}\), so it consumes less than another
quarter. Hence a sufficient remaining condition for (10.13) is

\[
  2(E_{\rm annular}+D_{\rm annular})\le 2^{-21}S_R .
\]

Here \(E\) includes one half, \(D\) uses the original unit viscosity and
time weight, and all terms use the shared normalization in the pinned
original (10.13) comparison. These are bounds on contributions to the
same localized final field, using the original source support statements.

## Source and arithmetic

The earlier whole-inner bounds already bind the 67 original field atoms
to 22 exact scalar factors and the original 16 output stencil rows. This
replay retains the same physical domain, the 123,870-node original
coefficient graph, the actual three positive-order even Picard profiles
and their Cauchy factors, the pressure datum, and all original outer
localization derivatives. It changes two arithmetic choices.

1. The exact original strict-core branches use only the natural functions
   for \(F_0,U_0\). The Stokes average remains in that same interval because
   \(vX\le X\le X_a\) for \(v\in[0,1]\). The leading source module exports
   `U0CorePhysicalTotal` and `F0CorePhysicalTotal`, roots #2729 and #2730
   at this request. The corresponding factorial Taylor bounds convert to
   ordinary derivatives with a factor \(6!=720\). Passing to normalized
   \(Y\)-derivatives introduces \(\Lambda^{-i}\le1\). The existing pressure
   source remains the actual A.21 datum plus its radial \(F_0^2\) prefix.
   The selected leading trace visits 129 original arithmetic nodes.

2. Each \(\tau_0\) exponent is represented as the exact pair \((a,b)\)
   denoting \(a/2+bh\). Form and cancel these powers across the exact
   operator monomial before multiplying by \(\log\tau_0\). For evaluation
   use \(a\log(\tau_0)/2+b(h\log\tau_0)\). This retains small nonzero
   \(h\) independently from the half-integer part. The previous coarse
   interval had an absolute-rounding width around \(1/2+h\), which became
   large after multiplication by the original log scale. The same
   analytic input with the exact exponent representation gives a strict
   comparison.

For the final comparison, divide both sides by the same positive
\(\tau_0\). The center upper uses the exact geometric factor
\(\tau_0/\Lambda\). The lower force fraction uses

\[
  S_R/\tau_0=\frac{(2^A c_\infty)^4}{4A}
                X_b^{-4A}\exp[-2h\log\tau_0] .
\]

The replay drops only the positive amplification
\((2^A c_\infty)^4>1\) in this lower endpoint. It uses the actual source
\(X_b\) interval and retains the whole positive \(h\log\tau_0\) scale.
The independent Python readback strips the common monotone exponential
layers and proves the remaining endpoint comparison with rational
positive Taylor terms. It derives the affine powers of every original
stencil term from two rational values of \(h\) and checks the 22-scalar
inventory and exterior quarter separately.

**OPEN.** The active annular corrections still need a final energy and
dissipation bound. The verified center and exterior budgets do not close
the original whole-K energy defect or the independent refinement table.
N7-06 and N8-05 remain OPEN, jets 0/67, RELEASE HOLD.

## Replay

```powershell
$out = 'work/goal-next/continuation41/energy'
$g = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
$rt = 'work/goal-next/annular-numeric-24/pinned-original-runtime'
node "$out/check_center_energy.mjs" $g $rt `
    'work/goal-next/whole-k-prefix/historical-scale-arithmetic-input.json' `
    "$out/center-energy-sharp.json"
python "$out/verify_sharp_center.py" `
    --axis "$g/whole-k-inner-axis/inner-axis-jet-bounds.json" `
    --force "$g/whole-k-core-force/whole-inner-force-energy.json" `
    --radial "$g/final67/moving-heat-energy/radial-force.json" `
    --exterior "$g/final67/moving-heat-energy/moving-heat-energy.json" `
    --sharp "$out/center-energy-sharp.json" --out "$out/center-energy-readback.json"
```
