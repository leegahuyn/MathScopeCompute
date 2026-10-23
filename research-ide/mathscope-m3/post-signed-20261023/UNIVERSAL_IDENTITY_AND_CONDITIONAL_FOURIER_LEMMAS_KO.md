# Proven algebraic obligations and strictly conditional Fourier lemma
2026-10-23 · original PR30 pinned: `a9b3a5b317525f6d0a71e2e356b054c9d25d2e60`

## Lemma A — conservative cylindrical PDE polarization on the positive-radius chart (PROVED AS AN ABSTRACT IDENTITY)
Let (u,v\in C^2) be three-component cylindrical velocity fields and (p,q\in C^1)
on a coordinate chart with (R>0). Let the linear derivative operators
(D_r=\partial_R+a(R)\partial_\xi), (D_z=\varepsilon\partial_Z),
(D_\theta=R^{-1}\partial_\theta), and (D_t=-\varepsilon\partial_T+\partial_\eta).
The claim also holds for the original common two-torus derivative directions if they
are linear derivations (including its radial/time coefficients).

Define the exact cylindrical bilinear transport, with the physical connections,

[
B(u,v)_r= u_rD_rv_r+u_\theta D_\theta v_r+u_zD_zv_r-u_\theta v_\theta/R,
]
[
B(u,v)_\theta= u_rD_rv_\theta+u_\theta D_\theta v_\theta+u_zD_zv_\theta+
u_\theta v_r/R,
quad B(u,v)_z=\sum_{i\in\{r,\theta,z\}}u_iD_iv_z.
]

Set (\mathcal R(u,p)=D_tu-\nu\Delta_{\mathrm{vec}}u+B(u,u)+\nabla p+u\operatorname{div}u\),
where the vector cylindrical Laplacian (with both connection components) is *linear*.
Then the identity

[
\boxed{\mathcal R(u+v,p+q)
=\mathcal R(u,p)+\mathcal R(v,q)+B(u,v)+B(v,u)
+u\operatorname{div}v+v\operatorname{div}u}
]
holds componentwise. **Proof:** (D_t,\Delta_{\mathrm{vec}},\nabla,\operatorname{div})
are linear; (B) is bilinear. Expand both quadratic terms
(B(u+v,u+v)) and ((u+v)\operatorname{div}(u+v)), subtract and cancel.
No assumption (\operatorname{div}u=0) or (\operatorname{div}v=0) is needed.
The independent SymPy verification treats every component as an arbitrary
(C^2) function of six coordinates (not a polynomial example) and retains
(a(R),\varepsilon,\nu) as symbolic variables.

**Scope limitation:** This proves the *identity as an implication for smooth fields*,
not that the 4,419,183-node MathScope source field is smooth, its AST evaluator
implements each derivative consistently, that its two AST roots normalize
to the same expression, or that the forced PDE residual is equal to its source.

## Lemma B — Fourier inversion on the original irrational 2-torus (PROVED AS A CONDITIONAL LEMMA)
Let (\omega=(\sqrt2-1,1)) and (F\in C^\infty(\mathbb T^2)), normalized
with period 1. Let (\langle F\rangle) be its Haar average and put

[
H=\sum_{k\in\mathbb Z^2\setminus\{0\}}
\frac{\hat F(k)}{2\pi i(k\cdot\omega)}e^{2\pi i k\cdot y}.
]

For (k=(k_0,k_1)\ne0), let (a=k_1-k_0,b=k_0,N=\max(|k_0|,|k_1|)).
Then (a^2-2b^2\in\mathbb Z\setminus\{0\}), so
(1/|k\cdot\omega|\le |a|+\sqrt2|b|\le(2+\sqrt2)N).
For every fixed output derivative order (m\ge0), suppose
(C_{m+4}=\max_{|\alpha|=m+4}\|\partial^\alpha F\|_\infty)
is finite. For a mode with \(\|k\|_\infty=n\), choose the coordinate with
\(|k_j|=n\) and integrate by parts (m+4) times. This gives
(|\hat F(k)|\le C_{m+4}/(2\pi n)^{m+4}\).
Each order-(m) output derivative contributes at most ((2\pi n)^m\)
and inversion introduces ((2\pi|k\cdot\omega|)^{-1}\).
There are (8n) lattice points in the max-norm shell (n\).
Therefore for (K\ge1)

[
\|H-S_K\|_{C^m}\le
\frac{8(2+\sqrt 2) C_{m+4}}{(2\pi)^5}
\sum_{n>K}n^{-2}
\le\frac{8(2+\sqrt2) C_{m+4}}{(2\pi)^5 K}.
]

Here \(S_K\) is the inverse-Fourier partial sum over \(\|k\|_\infty\le K\).
The estimates imply absolute convergence with all fixed derivatives,
thus \(H\in C^\infty\) and
\(\omega\cdot\nabla H=F-\langle F\rangle\), provided \(F\in C^\infty\).

**Scope limitation:** This does *not* certify the actual source (F_j) has
a uniform-in-j common domain, its source-specific (C_{j,m+4}) has been
produced and bounded, the cutoff correction series can be summed before curl,
or the A–D induction hypotheses hold for all stages.

## Remaining separate original proofs (all OPEN)
- Actual real post-FiveMap source 3D AST and source-bound direct/split defect root equalities
- Source equality `R(u,p)=f`, divergence zero and original forcing (C^\infty_c)
- Every genuine A–D source iteration, refreshed full pressure, and the induction hypothesis
- Lemma 9.7 common positive domain for all iterations
- Lemma 9.8 actual all-(m) source seminorm estimates, constants and derivative losses
- Lemma 5.4 original infinite cutoff series before curl and endpoint flattening
- All 67 physically evaluated interval jets, original active scale selectors and independent refinement

**No release promotion:** M3 62/64, M4 0/16, final jets 0/67, `last_resolved_tau=null`, RELEASE HOLD.
