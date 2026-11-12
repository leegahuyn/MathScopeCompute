# Initialized mean transport and six direct scalar bounds

The original first Forced source graph from run 43010379487 contains 4,197,115
nodes. The Python replay verifies the actual scale for both signs and both
modes at each difference \(d=0,1,2,3,4\), all 120 native argument
replacements, the formal wrappers, and the original reference velocity
arguments. For fixed labels and original \(Y\) coordinates, the actual pulse
\(v\) is independent of \(R,Z,T,w\), and
\[
H_w=Y+f(w-v)v_t,\qquad f=c_i/T_g^d.
\]
Its two coordinates are independent of \(R,Z,T\). The actual mean reads
\(\rho^{-A}g(\rho^{-1/2}R,\rho^{-D}Z,\rho^{-1}T,\ell_{\rm ref},H_w)\),
where \(\rho=2^{\ell-\ell_{\rm ref}}\).
Thus \(\partial_w g(H_w)=f(Ng)(H_w)\) for \(N=v_t\cdot\partial_Y\).
The own radial derivative has both \(\rho^{-1/2}\partial_Rg\) and
\(a_{\rm own} Lg\). The reference radial-phase factor belongs to its own chart.

The registered auxiliary inverse gives \(N N^{-1}P_\perp=P_\perp\) on the
original mean-zero Fourier limit. The translated whole and left integrals,
including \(A_1\), retain their cutoff terms and commute with \(N,L\).
FiveMap is auxiliary-independent. The actual early inputs are
\(E_\theta=\#643868\), \(E_z=\#643883\). The positive replay preserves the
factor 2 in \(\|P_\perp f\|_\infty\le2\|f\|_\infty\). Under the original
finite FTC and smooth source assumptions, the resulting normalized
reference bounds for the initialized perturbations are

| Component | \(Ng\) | \(D_RNg\) | \(D_ZNg\) |
| --- | ---: | ---: | ---: |
| \(\beta\) | 7677 | 7726 | 7719 |
| \(v\) | 7659 | 7728 | 7660 |
| \(\gamma\) | 7704 | 7730 | 7705 |

For the six direct \(b\) requests, the perturbation is
\(b_{\rm init}=Q^{-A-1/2}v/R\), with fixed \(Q\).
Applying \(\partial_s=(2QR)^{-1}D_R\) gives the first-order coefficients
\((1,-1)/2\) and the second-order coefficients \((1,-3,3)/4\) after
collecting the appropriate inverse powers of \(R\). Axial differentiation
gives one factor of \(Q^{-D}\) per derivative. Physical time uses
\(Q^{-1}[-\partial_T+\epsilon^{-1}c_iN]\), where the actual
\(c_iN v_T=-P_\perp E_\theta\) and \(Nv_5=0\).

| Original request | Perturbation bound root |
| --- | ---: |
| `b@0,0,0` | 7733 |
| `b@0,0,1` | 7736 |
| `b@0,1,0` | 7737 |
| `b@0,2,0` | 7738 |
| `b@1,0,0` | 7742 |
| `b@2,0,0` | 7748 |

The independent replay authenticates the 8,456-node graph, the signed
radial coefficients, the inverse epsilon bound, and the two original
receipts with identical chart and 67-atom hashes. The total initialized
radius is the pinned slow-background radius plus the physically scaled
perturbation radius. The two receipts use symbolic FTC norms and the
original smooth chart and stability assumptions. The live private-family
binding, weighted Forced estimate, later increments, and numerical final
intervals remain OPEN.
