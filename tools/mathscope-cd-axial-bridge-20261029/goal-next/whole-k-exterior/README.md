# Actual heat-exterior cell in the original whole-K slab

**VERIFIED, subject to the stated original exterior identification.** This replay gives a nonzero cell contribution for the same final-field instance used in (9.21) and (10.4). On one closed annular cell it encloses the endpoint energy, transverse dissipation and forcing work by positive factored intervals, gives exact zero axial dissipation, and encloses all 67 requested local field operands. Of these operands, 60 are exactly zero. The exterior identification uses the original Lemma 5.2, Proposition 5.5 and Proposition 9.9 Step 4. The geometric, differential and interval calculations below are independent of uncomputed active-stage amplitudes. Whole-K N7-06 remains open.

## Same original exterior and normalization

Use \(r^2=x^2+y^2\), \(\rho=\tau/\tau_0\), \(\zeta=z/z_0\), \(\tau_0=q_{\rm Big}/32\), \(A=1/2+h\), and \(z_0=\tau_0^{1/2-h}\). The original cutoff is
\[
 C=\chi(2r^2)\chi(2\zeta^2)\chi(\rho).
\]
Take the cell
\[
 \tfrac14\le r\le\tfrac12,\qquad -\tfrac12\le\zeta\le\tfrac12,\qquad
 \tfrac12\le\rho\le1,\qquad 0\le\theta<2\pi.
\]
The radial and axial cutoff factors are exactly one on this closed cell, and their positive-order derivatives are zero, including at the flat endpoints. Put \(c=\chi(\rho)\).

On the whole slab, \(q<q_{\rm Big}/16\). The source-pinned radial envelope gives \(4X_b\le R_*^2\), \(R_*=C12EnvelopeR\). The localization has \(B=\log(1/q_{\rm Big})>R_*^{1024}/2\), with \(R_*\ge1\). Since \(e^x\ge1+x\), \(B>1/2+512\log R_*\), and \(q_{\rm Big}R_*^2<e^{-1/2}<2/3\). Consequently \(2qX_b<1/48\) on the whole slab. The cell has \(r^2\ge1/16\), so \(X=r^2/(2q)>X_b\) throughout, with a strict margin.

The pinned manuscript gives \(X_+<X_b\) in Lemma 5.2 and zero positive-order velocity and pressure beyond \(X_+\) in Proposition 5.5. Equations (4.28), (10.1) and Proposition 9.9 Step 4 put the fixed zero-origin Stokes potential at exactly zero in the exterior. The same Step 4 and the initialization discussion remove all annular wave and mean potentials, direct means and pressure corrections there. Theorem 3.1(iii) fixes the pressure normalization at infinity. Thus the local operands of (10.4) are exactly
\[
 A_{\rm gauge}=0,\quad B=K_{\rm heat}(r,\tau),\quad
 p_{\rm loc}=-\int_r^\infty K_{\rm heat}(\xi,\tau)^2\,\frac{d\xi}{\xi}.
\]
The actual heat compiler fixes the positive constant \(c_\infty=E_{\rm tail}X_{\rm tail}^A/(1-c_o h)\), where the exact source inputs are \(E_{\rm tail}=P_\star e^{\text{terminal.logAStart}}\) and \(X_{\rm tail}=X_R e^{\text{terminal.start}}\). No free exterior amplitude or pressure offset is introduced.

## Heat, force and field atoms

With \(s=r^2\), \(Z=4\tau/s\), and \(H\) the positive normalized heat integral in (4.29), (A.32),
\[
 K_{\rm heat}=c_\infty(s/2)^{-A}H(Z),\qquad
 -\partial_\tau K_{\rm heat}=
 (\partial_{rr}+r^{-1}\partial_r-r^{-2})K_{\rm heat}.
\]
The bound \(\ell_{\min}\ge8\) gives \(\tau_0\le2^{-23}\) and \(0\le Z\le2^{-17}\), both in the cell and at every radius in its pressure tail. The integral formula gives \(-h(1+h)\le H'\le0\). Set \(m=1-2^{-22}\). Then \(m\le H\le1\). Also \(P=-ZH'/H\) is a positive weighted average of \(hZv/(1+Zv)\), so \(0\le P<h\) and \(-r(K_{\rm heat})_r/K_{\rm heat}=1+2h-2P\) is between \(1\) and \(1+2h\).

The global velocity and pressure are \(u=cK_{\rm heat}e_\theta\), \(p=cp_{\rm loc}\). At viscosity one the heat equation cancels the terms carrying \(c\partial_t K_{\rm heat}\) and \(c\Delta(K_{\rm heat}e_\theta)\). The radial convective acceleration is \(-c^2K_{\rm heat}^2/r\) and \(\partial_r p=cK_{\rm heat}^2/r\). The exact force and work density are
\[
 f=-\frac{\chi'(\rho)}{\tau_0}K_{\rm heat}e_\theta+
 c(1-c)\frac{K_{\rm heat}^2}{r}e_r,\qquad
 f\cdot u=-\frac{c\chi'(\rho)}{\tau_0}K_{\rm heat}^2.
\]
The derivatives of all three components of \(A_{\rm gauge}\) give 57 exact zeros in the input contract. The inputs \(b_z,b_{zz},(p_{\rm loc})_z\) add three. For \(b=B/r\), the positive factor \(c_\infty 2^A\) is kept exact and the underlying expression is \(s^{-\beta}H(4\tau/s)\) with \(\beta=1+h\). Differentiating in \(s,\tau\) gives the four nonzero \(b\)-operand intervals in the receipt. The pressure interval uses the normalized improper integral and \(m^2\le H^2\le1\) at all tail radii. The horizontal pressure derivative is \((p_{\rm loc})_x=xK_{\rm heat}^2/r^2\), and likewise for \(y\). The receipt lists the 67 intervals against the actual original operator atom names and preserves all positive source factors.

## Energy contribution and scope

Write \(M=\tau_0^{2A}c_\infty^2\). Let
\[
 I_E=2^{2A}\frac{2^{8h}-2^{4h}}{4h},\qquad
 I_D=2^{2A}\frac{2^{8A}-2^{4A}}{4A}.
\]
These are the exact radial power integrals from \(1/4\) to \(1/2\), with the factors \(r\,dr\) and \(dr/r\), respectively. The exact primitive gives \(c(\rho)+c(3/2-\rho)=1\), \(\int c\,d\rho=1/4\) and \(\int -cc'\,d\rho=1/2\). Hence \(1/8\le\int c^2\,d\rho\le1/4\). The normalized whole-K coordinates use measure \(r\,dr\,d\theta\,d\zeta\) and positive time integration over \(\rho\in[1/2,1]\) after reversing the physical limits. On this cell, the normalized terms have the enclosures

| Cell contribution | Exact interval or value |
|---|---|
| Starting energy | \(0\) |
| Endpoint energy divided by \(M\) | \([2\pi m^2 I_E,\,2\pi I_E]\) |
| Transverse dissipation divided by \(M\) | \([\pi m^2 I_D/2,\,\pi (1+(1+2h)^2) I_D/2]\) |
| Axial dissipation | \(0\) |
| Force work divided by \(M\) | \([\pi m^2 I_E,\,\pi I_E]\) |

The balance weights the displayed transverse dissipation by \(\tau_0\) at viscosity one. This restricted cell has a radial viscous flux. Its integrated balance equals
\[
 2\pi\tau_0^{2A+1}
 \int_{1/2}^1 c^2[rK_{\rm heat}(K_{\rm heat})_r]_{1/4}^{1/2}\,d\rho,
\]
which is positive because \(K_{\rm heat}(1/4,\tau)>2K_{\rm heat}(1/2,\tau)\) and \(1<-r(K_{\rm heat})_r/K_{\rm heat}<1+2h\). This is an internal flux of the restricted integration region. The complete whole-K balance still needs the complement, the actual force norm in (10.13), and independent spatial and temporal refinement.

The intervals are closed-cell statements with exact positive factors. They leave the global 67-jet coverage count at 0/67. The use of the manuscript's exterior theorems is explicit and supplies no independent proof of the all-order \(\#672\) source bridge. RELEASE HOLD.

## Entire geometric heat exterior

The source theorem identifies the exterior at \(X\ge X_b\), including the closed seam. The moving lower face has \(r^2\ge2qX_b\ge\tau_0 X_b\). The exact Laplace kernel has \(0<H\le1\), \(0\le -ZH'/H\le h\), \(0\le Z^2H''/H\le h(1+h)\) for all \(Z\ge0\). This yields all 67 factored jet intervals down to \(X=X_b\), with 60 exact zeros. The same original radial heat identity supplies the fully localized force, endpoint energy, dissipation, work and force-square integral bounds there. The prior fixed-radius region retains its sharper small-amplitude bounds.

    python check_geometric_heat_exterior.py --localization-source <inputs/localization-source> --chart <whole-k-chart.json>

## Replay

    python check_whole_k_exterior_cell.py --repo REPO --paper PAPER --localization-source SOURCE

The checker uses Python with PyMuPDF and SymPy, the original source blobs accessible read-only in the repository, and pinned sibling localization and radial-envelope receipts. The recovered uploaded manuscript, repository copy and public manuscript match the pinned hash.

## Exterior cutoff transitions

The [larger exterior region](region/README.md) covers every spatial
angle and all times in the original slab for \(r^2\ge2^{-1024}\).
It supplies the same 67 local operand enclosures with the seven
nonzero intervals factored by the positive heat constants.

Throughout that region, put \(u=C K_{\rm heat}e_\theta\) and
\(p=Cp_{\rm loc}\) with all three outer cutoff factors retained.
The replay differentiates the cylindrical field in Cartesian
coordinates at \(x=r,y=0\) and uses rotation invariance. Viscosity
one and the actual heat identity give
\[
 f_\theta=(C_t-\Delta C)K_{\rm heat}-2C_r(K_{\rm heat})_r,\quad
 f_r=C(1-C)K_{\rm heat}^2/r+C_rp_{\rm loc},\quad
 f_z=C_zp_{\rm loc}.
\]
In particular, an active axial cutoff gives a pressure contribution
and an axial velocity derivative. The checker retains both. The
first two derivative bounds for the original outer step are
108 and 19440, from the linear seed \(e^{-1/u}\) and its flat
extension. With \(B=c_\infty 2^A\), the broad region has
\(K_{\rm heat}\le2^{528}B\), \(|(K_{\rm heat})_r|\le2^{1041}B\)
and \(|p_{\rm loc}|\le2^{1055}B^2\). The replay records separate
upper bounds for the exterior force-square integral, endpoint
energy, two dissipation terms and absolute work in normalized
whole-K coordinates.

The [actual heat amplitude](amplitude/README.md) gives
\(M=\tau_0^{2A}c_\infty^2<2^{-8388607}\).
Using \(A+D=1\) and \(\tau_0/z_0^2=\tau_0^{2h}\le1\)
converts the pressure and cutoff terms without an inverse
normalization loss. On the entire verified exterior, the
normalized endpoint energy integral is below \(2^{-8387547}\)
and the spacetime integral of the normalized force squared is
below \(2^{-8385472}\).

The smaller plateau cell also has a positive normalized force-square
lower bound. On its time interval \(\int-\chi'=1\), so
\(2\le\int(\chi')^2\le108\) by Cauchy–Schwarz and the derivative
bound. Radial and azimuthal force components are orthogonal. The
center cylinder and the whole-K force norm remain open.

    python check_exterior_cutoff_force.py --exterior-cell-receipt whole-k-exterior-cell.json --exterior-region-receipt region/whole-k-exterior-region.json --exterior-amplitude-receipt amplitude/whole-k-exterior-amplitude.json --out exterior-cutoff-force.json
