# Positive native chart root and physical admission

The pinned original monotone kernel `ActualConvergentExpressions` constructs
a chart-root node from a system and an argument tuple. The original
`source-global-band` binds this kernel to the equation
`F(s)=s-Z²s^(2h)-T` and separately describes the physical chart domain.

The replay uses the same original formula, symbolic h, left and right
bracket, and the genuine monotone functional and implicit derivative API.
For `(Z,T)=(1,0)` and `(-1,0)`, exact substitution `s=1` has zero
residual and gives the two physical eta endpoints. It also checks the
implicit time derivative at the first endpoint as the exact rational
expression `1/(1-2h)` in symbolic h.

The exclusion control `(Z,T)=(5/4,-9/16)` has the same exact point `s=1`
as root. On `[1/2,2]` and for `0<h<1/16`, the residual has slope
`1-2h (25/16)v^(2h-1) > 1-(1/8)(25/16)2 = 39/64`. The given interior
root therefore implies strict endpoint signs and uniqueness. The native
monotone node represents this equation. At the exact root its eta is
`5/4`, outside the physical source image. This is a counterexample to
using positive root and strict bracket as the whole physical admission
test. The original source domain still requires nonnegative physical time
or the equivalent recovered eta condition. The replay makes no claim that
the production application admits this excluded input.

```text
node verify_original_monotone_admission.mjs PINNED_ORIGINAL_RESEARCH_IDE
```
