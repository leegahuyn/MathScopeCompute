# Leading cancellation of the original mode-one forcing

## VERIFIED

The replay authenticates 22,155,584 original nodes and compares all 60 supported raw real and imaginary scalars in the ten mode-one charts. It expands the original cylindrical linear and conservative polynomials with independent native velocity, pressure, and mean jets. The exact comparison includes the time derivative, all diagonal and off-diagonal phase and nonphase stiffness terms, pressure, both conservative divergences, and the registered principal-tail subtraction. The actual reference-coordinate arguments and all coefficient roots are preserved.

Use \(U=U_e+iU_o\) for the Primary velocity divided by its original \(P\), and \(i p_I\) for that pressure divided by \(P\). For the same transported complete mean \(M=(b,RF,G)+\Delta\), the conservative mixed source has the decomposition

\[
\mathcal B_\phi(U,M)
=M\cdot\nabla_\phi U
+(U\cdot\nabla)M
+\mathcal C(U,M)
+U\operatorname{div} M
+M\operatorname{div}_\phi U .
\]

The cylindrical term is
\(\mathcal C(U,M)=(-2M_\theta U_\theta/R,\ (M_\theta U_r+M_rU_\theta)/R,\ 0)\).
Here \(M_\theta/R\) and \(\partial_R(RF)\) give the exact \(-2F\) and \(2F+RF_R\) parts of the original cylindrical \(K\); the axial entry is \(G_R\). The rest of the mean-gradient and metric terms carry one explicit \(\varepsilon\) or a weighted \(\Delta\) derivative. The complete \(U\operatorname{div}M\) term may be retained for estimates.

The other divergence term vanishes by applying the original cylindrical divergence to the original full curl. The carrier commutators use

\[
D_r n_z=D_z n_r=-\varepsilon v\,\omega_{RZ},\quad
D_r n_\theta=-n_\theta/R,\quad D_z n_\theta=0,\quad
\omega=pF+p_zG.
\]

The slow derivatives commute on the admitted source chart. Thus the ordinary and carrier parts of \(M\operatorname{div}_\phi U\) vanish together. This includes the independent \((n\cdot U)M\) term extracted in C92.

The replay reopens both original homogeneous pulse matrices, their exact Gaussian integrals, both moving bases and their left inverses. At positive normal and tangent lengths it verifies \(n^{\mathsf T}B=0\), \(B_\ell B=I\), \(q_n=n^{\mathsf T}n\), and \(n^{\mathsf T}A_\phi=-n_v^{\mathsf T}\). The four source prefactor roots for \(\sqrt\varepsilon\), the transverse cutoff, the slow cutoff, and the original positive Cramer amplitude are independent of \(v\). Hence for \(z\) the original normalized Volterra state,

\[
U_e=\tfrac12\psi A_0 Bz,\qquad
p_I=(n^{\mathsf T}K-n_v^{\mathsf T})U_e/(kq_n),\qquad
\nu=P_v/P=\lambda-d_{\rm ref}.
\]

Differentiating \(n^{\mathsf T}B=0\) gives that the columns of \(A_\phi B-B_v\) lie in the span of \(B\). The exact original normalization therefore yields

\[
(\partial_v+\nu+K+\varepsilon k^2q_n)U_e-k n\,p_I
   =\tfrac12\psi_v A_0 Bz .
\]

The right hand side is the original tail subtraction, including the cutoff transition and the regions where \(\psi\) and its derivatives vanish. Thus the real homogeneous principal block is zero. The imaginary homogeneous block retains \(U_o\), which carries the \(k^{-1}\) of the original curl remainder. The ordinary pressure gradient is purely imaginary.

## CONDITIONAL

Let \(\kappa_s=1/100000\). The remaining mode-one real part has an \(\varepsilon^{3/2-2\kappa_s}\) absolute upper factor and the imaginary part has \(\varepsilon^{1-\kappa_s}\). These powers hold for every one of the 23 original mixed spatial derivatives through order four, with the C91 geometry and field factors held explicitly. In particular, transport and unphased diffusion may spend up to two factors \(\varepsilon^{-\kappa_s}\) from the radial fast operator. The single-carrier phase and connection terms in viscosity spend one, together with the original \(\varepsilon k\).

An explicit signed remaining term is \(+k n_\theta\Delta_\theta (U_e)_j\) in the imaginary eikonal equation. Its coefficient is a nonzero formal operator term because the source angular integer is nonzero. The original real Primary vector is tangent and therefore passes the orthogonal projection up to the forcing sign. The actual \(\Delta_\theta\) and the projected residual have no certified signs or numerical lower bounds.

The C93 source-only budget and weights remain valid. For \(s=\alpha_R+\alpha_Z\), the uniform raw band exponent is \(67/4+3s\) and the additional pole after the single outer \(g(d)\) is \(9+3s\). The largest band exponent occurs in one original derivative of the mean–velocity product. The largest pole occurs in the ordinary part of viscosity with two extra slow derivatives of \(U\). The native velocity divided by its original \(P\) then has \(S\) exponent \(71/4+3s\), hence maximum \(119/4\), and maximum additional pole 21. The finite re-expansion charge is bounded by \(2^{20}\) inside the existing \(2^{136}\) reserve. This keeps the same conditional log cap \(H/2^{108}\).

The actual \(D_t\) differentiates before pullback. Under the original lift this gives \(\partial_v-\varepsilon\partial_T\) on Primary amplitudes, and then \(v\) is evaluated at \(w\). The actual \(H_w\) preserves \(R,Z,T,\xi,d\) and the \(L\) direction. It leaves \(P(w)\) fixed under \(R,Z,L\) differentiation. All bounds use the original fixed labels and representatives, positive frame, full admissible short mean and pressure paths, and directed slab \(q_{\rm Big}/64\le q<q_{\rm Big}/16\).

## OPEN

The quantitative field constants retain the C91–C93 analytic premises. The final physical curl, remaining pressure and nonlinear joins, global energy, convergence and final jet comparisons require separate evidence. `jets 0/67`, `RELEASE HOLD`.

## Replay

```text
python -B verify_mode1_linear_cancellation.py --goal GOAL --artifact HOSTED --cache C80_CACHE --out NEW_JSON
```
