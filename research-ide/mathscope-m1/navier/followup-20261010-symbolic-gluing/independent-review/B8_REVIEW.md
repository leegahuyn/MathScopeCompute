# Independent review of the new symbolic B.8 certificate

This review concerns the new A.21 outer family and
`attempts/b8-0001/certificate.json`. It does not reuse the historical `Md=1`
data. The independent exact verifier returned **39/39 PASS**, with actual
process exit zero. Its report is `b8-fraction-review-001.json`. The verifier
imports the independent Fraction helpers in this directory, not either
producer or their dyadic arithmetic implementation.

## Original moments and scaling

The original manuscript, equations 4.15 and B.35, defines the five actual
continuous moments. With `x=X/XR`, `c=4 eta`, `K=Pstar/(1+eta^2)`, and
`E0=K x^(1/10)`, the transformed rows before division by `mu=h^2` are

| Block | Exact row |
|---|---|
| U, 1 | `Delta M/(XR K)` |
| U, 2 | `(Delta J-c Delta I)/(XR^(3/2) K^2)` |
| E, 1 | `Delta I/(XR^(3/2) K)` |
| E, 2 | `(Delta S-2c Delta M)/(XR K^2)` |
| E, 3 | `Delta Cp/K^2` |

These are invertible row operations for every `K>0` and `XR>0`. In particular,
`U^2-c^2-2c(U-c)=(U-c)^2` is an exact identity. Parameter differentiation
must be applied after this cancellation and normalization, including the
derivatives of `c` and `K`.

The perturbations are `Delta U=K mu sum(z_j b_j)` on the first two supports
and `Delta E=K mu sum(z_j b_j)` on the last three. All five supports are
disjoint, so the mixed product `Delta U Delta E` and products of different
bumps vanish identically. The resulting equation is exactly
`A z+mu Q(z)=d/mu`, with a separated linear U block and an E block whose only
nonlinear rows arise from S and Cp.

The actual positive number is `mu=exp(-16004 T)`, bounded above by
`2^-400`. It is not zero. The small nonlinear factor results from dividing
the entire original moment equation by this positive number.

## Continuous supports, matrix, and implicit bounds

The supports are `(n/2048,(2n+1)/4096)`, for `n=6,...,10`. Each has width
`1/4096` and lies strictly in the original logarithmic patch `-6<log x<-5`.
The bump here is the unnormalized step derivative `sigma'(t)`, so its
integral with respect to x is exactly the width. This differs from the
unit-mass convention of the C.2 patch; the verifier explicitly checks the
mass convention instead of assuming it transfers.

The report independently recomputes the rational midpoint inverses and
interval matrix products. It checks that the recorded inverse intervals
contain the exact rational inverses, that residual bounds contain the
independent Fraction products, and that both strict self-map and contraction
inequalities hold. It also checks the nonlinear derivative bounds used for
the all-eta implicit estimates. The recorded E residual norm is about
`0.0243325`, leaving a substantial strict margin below one.

The C1 and C2 estimates have the same triangular structure as the C.2
certificate: first solve the linear U block, then solve the E fixed point.
Their input condition is a bound on **preconditioned normalized debt and
its first two actual eta derivatives**. A small unnormalized debt or an
eta-zero jet alone would not meet that contract.

The fresh certificate by itself does not construct the incoming profile or
prove that contract. The later `CONTINUATION_AND_NEW_DEBT.md` addresses that
separate implication and is reviewed separately. No result from this
matrix audit substitutes for that analytic connection.

## Positivity and shear

The independent calculation checks the exact relation between the local
angular perturbation and

`a=1-2x E_x/E`, `bs=2x U_x/E`.

It uses the independent, whole-interval derivative bounds
`|sigma'|<9`, `|sigma''|<128` established by the C.2 Fraction review, and a
strict positive lower bound for the same `E0/K`. The resulting perturbations
are proportional to the actual positive `mu`; no inverse factor of mu is
introduced. These are estimates for the corrected fields on this patch.
They do not, by themselves, establish every stress/cone condition outside it.

## Additional independent numerical crosscheck of C.2

The companion adaptive `mpmath` run finished with **71/71 PASS**, 220 decimal
digits, and actual process exit zero. Its report is
`mpmath-diagnostic-001.json`. It independently integrated the physical
moment densities at `lambda=2^-200` and `lambda=2^-300`, finding maximum
row differences from the transformed equations of approximately
`2.61e-169` and `8.29e-138`. It also checked the continuous zero limit of
the coefficient functions. The zero-limit computation is only a diagnostic;
the original source parameter remains strictly positive. Adaptive floating
quadrature is additional numerical evidence, not the rigorous interval
certificate.

## Reproduction

From the parent symbolic-gluing directory, use a fresh output filename:

```sh
python3 -B independent-review/verify_b8_certificate.py \
  --output independent-review/b8-fraction-review-NEW.json
```

All source and certificate hashes used by the run are included in the JSON
report. The existing report is preserved rather than overwritten.
