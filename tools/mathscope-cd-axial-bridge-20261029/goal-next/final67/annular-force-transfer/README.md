# Annular force through one original cutoff transition

**VERIFIED** original cutoff support, exact force algebra, cylindrical
connections and a sharper conditional spatial energy bound.
**CONDITIONAL** application to actual cumulative force roots, physical
chart matches and source endpoint intervals. **OPEN** N7-06, N8-05 and
the final 67 jet intervals.

## Original support and source association

The original (9.21) summation uses the fixed selected
\(a_j=\exp(L_j)\), exact \(q=q(z,\tau)\), and
\(k_j=\chi(a_jq)\). It multiplies the potential, direct azimuthal
scalar and pressure by the same \(k_j\) before taking the curl.
The original scale records give \(L_{j+1}\ge L_j+1\).
The open transition intervals
\((1/(2a_j),1/a_j)\) are strictly pairwise disjoint because \(e>2\).
The authenticated slab has only stages \(1,\ldots,4\) possibly
active. On a transition for stage \(j\), every \(i<j\) is on its
one plateau and every \(i>j\) is on its zero plateau. A numerical
cell crossing a threshold has to be subdivided or use an enclosure
of all admitted branches. All positive cutoff jets at the seam are
zero under the original flat extension.

The transfer applies on the original annular radial plateau \(r<1/2\),
where the three-factor outer cutoff reduces to
\(C=\chi(2(z/z_0)^2)\chi(\tau/\tau_0)\). It preserves the physical
time derivative \(-\partial_\tau\). Use the original exact-zero branch
where \(C\) vanishes flatly and the uncut source may have no local
definition. When all stage cutoffs are flat, the formula uses the
single cumulative state. Stage four lies on the outer axial plateau
on its nonzero support. There \(C_z=0\), and \((Ck_4)_z=C(k_4)_z\)
still contains the stage cutoff derivative.

The pinned active N3 first-cycle source gives post-Five velocity
roots 22153222–22153224, pressure 22153227, divergence 22153248 and
conservative residual roots 22153560, 22153562 and 22153564.
The independent actual direct/split audit identifies those residual
roots and verifies four difference polynomials. They are candidates
for the stage-one cumulative residual only on the matching physical
chart. The numerical residual size, ordinary source divergence
identity, gauge and physical chart binding are still required.
The later cumulative stages need their own source bindings.

## Signed force formula

Write \(U,P,A\) for the cumulative source through \(j-1\),
\(w,\pi,B\) for the corresponding increment, \(k=k_j\) and \(K=Ck\).
The ordinary gauge identities are \(U=\operatorname{curl}A+d\)
and \(w=\operatorname{curl}B+\delta d\). The two direct summands
are the source axisymmetric azimuthal fields. Define
\[
 \mathcal D=-\partial_\tau-\Delta,\quad Jv=e_z\times v,\quad
 W=CU+Kw,\quad g=J(C_z A+K_z B),\quad V=W+g .
\]
Taking the curl of the original weighted potential gives exactly
\(V\), and the localized pressure is \(CP+K\pi\).
Let \(N(a,b)=\nabla_a b\) be the covariant transport operator, and
\(F(v,p)=\mathcal Dv+N(v,v)+\nabla p\). The weights
\(\lambda_0=1-C,\lambda_1=C(1-k),\lambda_2=K\) are nonnegative,
sum to one, and attach to the zero state, \(U,P\), and \(U+w,P+\pi\).
Set
\[
 R_m=\lambda_1 F(U,P)+\lambda_2 F(U+w,P+\pi).
\]
The exact correction is
\[
\begin{aligned}
 F(V,CP+K\pi)-R_m={}&(\mathcal DC)U+(\mathcal DK)w
   -2(C_z U_z+K_z w_z)+(C_zP+K_z\pi)e_z+\mathcal Dg\\
 &+(W\cdot e_z)(C_z U+K_z w)\\
 &-\lambda_0\lambda_1N(U,U)
  -\lambda_0\lambda_2N(U+w,U+w)
  -\lambda_1\lambda_2N(w,w)\\
 &+N(W,g)+C N(g,U)+K N(g,w)+N(g,g).
\end{aligned}
\]
The two outer covariance terms retain the interaction with the
zero-state row. The pressure row of that state is zero. The
transport terms with \(g\) use \(g\cdot e_z=0\).
The partial \(z\) derivatives of \(U,w\) in this display are separate
from their axial vector components. The heat commutator is
\[
\begin{aligned}
 \mathcal Dg=J\big[
     C_z \mathcal DA+K_z \mathcal DB
     -(C_{z\tau}+C_{zzz})A-(K_{z\tau}+K_{zzz})B
     -2C_{zz}A_z-2K_{zz}B_z
     \big].
\end{aligned}
\]
This is a pointwise identity. It only combines adjacent original
residuals on the transition and requires no all-stage residual
series.

The orthonormal cylindrical gradient uses
\(D_r=\partial_r\), \(D_z=\partial_z\), and
\(D_\theta=(\partial_\theta+J)/r\) on vector components.
The vector Laplacian carries the full term
\(r^{-2}(\partial_{\theta\theta}+2J\partial_\theta+J^2)\)
and radial \(r^{-1}\partial_r\). The replay derives the connection
from the rotating basis, verifies the three Laplacian and transport
components and verifies that \(J\) commutes with the axial product
rules. It uses the annulus \(r>0\). A Cartesian proof compares the
three signed force formulas to direct differentiation and checks
12 flat-branch force components. Exact rational controls detect
seven omitted terms or sign changes, including omitted covariance,
omitted pressure gradient, and reversed physical time.

## Surviving endpoint inputs

| Group | Inputs beyond the cumulative residual enclosures |
| --- | --- |
| \(U,w\) | Values and first covariant spatial derivatives |
| \(P,\pi\) | Values |
| \(A,B\) | Two transverse components, each value, three first covariant spatial derivatives and one grouped \(\mathcal D\) value |
| \(C,K\) | Value and the \(\tau,z,zz,z\tau,zzz\) derivatives |

An ungrouped potential heat evaluation uses the time derivative,
pure spatial second derivatives and the cylindrical connection.
The third and mixed space-time derivatives in the displayed
transfer belong to the scalar cutoffs. The original independent
67-jet request still applies to the full final source.

The receipt checks 16 physical exponent combinations. Write
\(t=\tau_0^h\), normalize force by \(\tau_0^{A_{\rm exp}+1}\)
where \(A_{\rm exp}=1/2+h\), and use velocity, potential and pressure
value factors \(\tau_0^{A_{\rm exp}},\tau_0^h,\tau_0^{2A_{\rm exp}}\).
Every spatial derivative adds \(\tau_0^{1/2}\) to its corresponding
normalizer and heat adds \(\tau_0\). The normalized gauge heat
uses exact powers \(t,t^2,t^3\). In the explicit covariance
term the normalization gives \(t^{-1}\). The record retains that
factor and all cutoff weights. On a closed cell the positive
endpoint program uses upper endpoints of nonnegative factors,
including each pair \(\lambda_i\lambda_j\).
The exact weighted-vector square identity gives
\[
 |R_m|^2\le \lambda_1|F(U,P)|^2+
                   \lambda_2|F(U+w,P+\pi)|^2 .
\]
With component caps \(R\) for \(R_m\) and \(E\) for the complete
correction, the interval transfer allows an absolute force-square
error of \(6RE+3E^2\) in common physical units.

## Original cutoff constants and the existing energy inequality

All constants in the following table bound the absolute derivative
after multiplication by \(\tau_0^{mD+n}\) for \(m\) axial and \(n\)
time derivatives, \(D=1/2-h\). The computation uses the directed
fraction endpoints on the 256 original seed cells, the original
normalized \(q\) derivative formulas and the rational upper
\(99/70>\sqrt 2\).

| Derivative | \(C\) | \(k\) | \(K=Ck\) |
| --- | ---: | ---: | ---: |
| value | 1 | 1 | 1 |
| \(\tau\) | 5 | 7 | 12 |
| \(z\) | 15 | 7 | 22 |
| \(z\tau\) | 75 | 144 | 359 |
| \(zz\) | 364 | 166 | 740 |
| \(zzz\) | 31,068 | 9,540 | 55,722 |

The spatial constants 22 and 740 inserted into the original
24-operand bracket give \(96E_{24}/W_{\rm cap}^2\) bounded by
237240288 on N3 and 312885936 on N4 using the authenticated
reference conversion as a premise. The checker also reproduces
the prior 30 and 1264 coefficients on both conversions.
Both sharper integers times 49 are below \(2^{34}\). Hence
\[
 W_{\rm cap}\le (7/8)\,2^{-27}X_b^{-2}\tau_0^{-h}
\]
suffices for the existing \(2^{-26}S_R\) allocation on either
piece under the existing original gauge, chart and measure premises.
N3 alone permits \(2^{-27}X_b^{-2}\tau_0^{-h}\).
The actual \(W_{\rm cap}\) still has to be enclosed over every
required native label, guard and seam.

## Replay

Use Python assertions and SymPy 1.14.0 with the pinned goal-next
tree as input. Choose a new output path.

    python -B verify_annular_force_transfer.py GOAL_NEXT NEW_OUTPUT.json

The proof packet establishes algebra, support and conditional
quantitative transfer. Actual annular force endpoint intervals,
stage-two through stage-four source states and the separate
whole-K refinements in grid, Fourier cutoff, degree and precision
remain open. M3 remains 62/64 and RELEASE HOLD.
