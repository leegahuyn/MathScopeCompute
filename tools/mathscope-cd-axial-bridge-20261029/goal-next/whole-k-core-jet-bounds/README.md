# Exact factored bounds for all original strict-core field atoms

**VERIFIED local bounds.** All 22 scalar derivative inputs and the 67 original pre-localization field atoms have exact factored intervals on the closed strict-core cell
\[
 \tfrac12\le\rho\le1,\qquad 2\le Y=\Lambda X\le\tfrac52,\qquad
 |\eta|\le\tfrac14,\qquad 0\le\theta<2\pi .
\]
Nineteen of these atoms are exactly zero because \(A_z=0\). The other intervals use actual positive source norm factors. Those factors remain symbolic and the result supplies no global numerical jet enclosure. The original annular zero-extension theorem supplies the same strict-core identification as in the previous center proof.

## Original coefficient attachments

Write \(s=x^2+y^2\), \(a=A_\theta/r\), \(b=B/r\), and \(\beta=A+\tfrac12\). The actual background gauge is \(A=(-ya,xa,0)\), with \(\partial_t=-\partial_\tau\) for the original physical time derivative. For \(n\ge1\), take \(G_n=M_n/\sqrt{2X}, E_n,\Pi_n\) for \(a,b,p_{\rm loc}\), respectively. Define \(\widetilde G_n=\chi(b_nq)q^{2nh}G_n\), where \(b_n\) is the original common cutoff scale. The physical contributions are
\[
 a_n=q^{-A}(2X)^{-1/2}\widetilde G_n,\qquad
 b_n^{\rm field}=q^{-\beta}(2X)^{-1/2}\widetilde G_n,\qquad
 p_n=q^{-2A}\widetilde G_n,
\]
with the matching field in each expression. The actual normalized norm for \(M_n/\sqrt{2X}\) incorporates the zero-origin Stokes primitive. Thus evaluating \(a_n\) on this cell requires no estimate of a profile quotient at the axis.

For the leading field, \(a_0=\tfrac12q^{-A}\int_0^1 U_0(vX,\eta)\,dv\) and \(b_0=q^{-\beta}F_0\). The actual Stokes root \(\#9239\) selects \(\#5180=X(U_\star+\Lambda^{-1}{\rm Avg}_{\rm natural})\) on the strict core. The earlier guards \(X_{R}e^{-7},X_Re^{-8}\) and \({\rm loopILeft}\) are all above \(X_a\), and \(Y\le5/2<\Lambda X_a=4\). The source leading velocity norm \(L_U\) is root \(\#197828\) in the replayed canonical graph and applies on the entire path \(0\le vX\le X\). The mixed \(Y,\eta\) derivatives of the leading average are bounded by \(L_U/(r+1)\) for \(r\) derivatives in \(Y\), since \(v^r\Lambda^{-r}\) is integrated over \([0,1]\). The leading core \(F_0\) bound \(L_F\) is root \(\#80391\) in the separate pinned leading norm program and covers \(X\in[0,X_a]\).

The actual leading pressure root \(\#617757\) equals the normalized A.21 datum \(\#3451\) plus the exact radial prefix \(\#617756\). Its native binder \(\#617752\) applies \(F_0\) at \((X_{\rm bound},\eta)\) and squares that actual value. The pressure normalization remains the original one. The original pressure source has \(|P|\le5K\) in its analytic strip, \(K=P_\star^2\), and Cauchy with radius \(1/32\) gives \(|P_\eta|\le160K\). Thus for the demanded leading profile derivatives,
\[
 |\Pi_0|\le5K+L_F^2,\qquad
 |\partial_Y\Pi_0|\le L_F^2,\qquad
 |\partial_\eta\Pi_0|\le160K+2L_F^2.
\]
Here \(X\le1\) and \(\Lambda\ge1\). The source and formal arguments of the pressure prefix are checked explicitly.

## Historical and common cutoff bounds

The original third diagonal norm replay supplies every mixed derivative through degree three for the actual normalized \(E_n\), \(M_n/\sqrt{2X}\) and \(\Pi_n\) at \(n=1,2,3\). Its box \([X_a/2,2X_b]\times[-1,1]\) covers the whole stated cell. With \(m=e+i+j\), use the actual polynomial Euler weight for the derivatives of \(\chi(b_nq)q^{2nh}\). These weights are uniform in the positive cutoff scale.

For \(m\le n\), the original historical \(c_n\) selector retains its actual \(B_{n,m}\) clause, and the actual common selector has \(b_n\ge c_n\). On an active cutoff,
\[
 |(\partial_{\log q})^e\partial_Y^i\partial_\eta^j\widetilde G_n|
 \le B_{n,m}q^{2nh}\le2^{-n}q^{nh}.
\]
The derivative in \(Y=\Lambda X\) costs at most the corresponding \(X\) derivative because \(\Lambda\ge1\). On the inactive branch all cutoff derivatives vanish including the flat endpoint. For \(m>n\), the replay separately forms the maximum of the actual mixed norm roots times the original Euler weights. It retains the unabsorbed factor \(H_{n,m,G}q^{2nh}\). The only such roots needed are

| Order \(n\) | Derivative degree \(m\) | Actual norm field | Bound root |
|---:|---:|---|---:|
| 1 | 2 | \(M_1/\sqrt{2X}\) | 212882 |
| 1 | 3 | \(M_1/\sqrt{2X}\) | 212893 |
| 2 | 3 | \(M_2/\sqrt{2X}\) | 212905 |
| 1 | 2 | \(E_1\) | 212886 |

These new bound roots do not change the historical or common selectors. The exact common lower bound \(b_nq_{\rm Big}\ge64\) and \(q\ge q_{\rm Big}/64\) make all \(n\ge4\) terms flat zero throughout the slab. The historical scale alone is used only to bound each retained order. It supplies no separate claim about which historical-only tail terms are active on the slab.

## Exact physical and Cartesian transfer

With \(\mathcal L=1-2h\eta^2\), the exact physical derivatives on a term \(q^{-w}f(\log q,Y,\eta)\) factor as
\[
\begin{aligned}
 \partial_s &:\quad \Lambda q^{-(w+1)}\tfrac12\partial_Y,\\
 \partial_z &:\quad \frac{q^{-(w+D)}}{\mathcal L}
  \bigl(2\eta(\partial_{\log q}-w)-2\eta Y\partial_Y
        +(1-\eta^2)\partial_\eta\bigr),\\
 \partial_\tau &:\quad \frac{q^{-(w+1)}}{\mathcal L}
  \bigl(\partial_{\log q}-w-Y\partial_Y-D\eta\partial_\eta\bigr).
\end{aligned}
\]
The checker proves all nine inverse-coordinate entries and differentiates the coefficient at every step. It updates \(w\) after each derivative. For the two weighted fields it factors \((2X)^{-1/2}=\sqrt\Lambda(2Y)^{-1/2}\), including the logarithmic derivative \(-1/(2Y)\) of its \(Y\) factor. Rational interval arithmetic on the displayed cell bounds all differential polynomial coefficients. The scalar physical factor at derivative \((i,j,k)\) is \(\Lambda^i\tau_0^{-(w_0+i+Dj+k)}\) with \(w_0=A,\beta,2A\), and the positive weighted fields carry their additional \(\sqrt\Lambda\). The normalized \(Q=q/\tau_0\) lies in \([1/2,2]\), so all remaining \(Q\) powers are bounded by exact dyadics. The cutoff powers use \(q^{nh}\le2\tau_0^{nh}\) and \(q^{2nh}\le2\tau_0^{2nh}\) for \(n\le3\).

The checker substitutes all 67 original atom formulas. On this cell \(r<4\sqrt{\tau_0/\Lambda}\). Each monomial of \(x,y\) in a Cartesian potential derivative has degree \(2i+1-\alpha_x-\alpha_y\), and for pressure it has degree \(2i-\alpha_x-\alpha_y\). Thus every monomial of each atom has the same original physical prefactor after applying the radial bound. The receipt gives the common factor and the rational coefficient of every remaining norm term. Each nonzero bound \(R\) represents the symmetric interval \([-R,R]\). This retains the absolute source factors and is separate from the outer cutoff's 13 jets.

The complete whole-K atom coverage is still 0/67. N7-06, N8-05, whole-K forcing and independent refinement remain OPEN. RELEASE HOLD.

## Replay

Supply the packaged original source runtime and first-gauge graph.

    node replay_core_high_norms.mjs <inputs/original-core-runtime> core-high-norms.json
    python check_strict_core_jet_bounds.py --repo <repo> --joined <inputs/first-gauge-joined> \
      --whole-k <whole-k-chart.json>

The second command reads the pinned main atom JSON, the source coefficient receipt and the original graph's leading nodes. It uses Python and SymPy. Neither command writes to the repository or compiles Lean.
