# All original jet labels on the moving heat exterior inside K

**VERIFIED on the source-identified exterior.** The domain is the original part of \(K\) with \(X=s/(2q)\ge X_b\), where \(s=x^2+y^2\), \(\rho=\tau/\tau_0\in[1/2,1]\), and \(\zeta=z/z_0\). Its inner face is \(s=2qX_b\). The entire supported exterior has \(s\le1/2\), \(\zeta^2\le1/2\), and all physical angles. Lemma 5.2, Proposition 5.5 and Proposition 9.9 Step 4 identify the original field and its exterior trace at that moving face. This replay uses that identification and its original smooth zero extension of the annular corrections. It reaches both nonconstant spatial cutoff bands.

Let \(a=A+1/2\), \(B=2^A c_\infty\), \(\xi=4\tau/s\), \(R=\chi(2s)\), \(W=\chi(2\zeta^2)\) and \(c=\chi(\rho)\). The original \(r_0=1\) follows from the archived cutoff source. The bare swirl scalar is \(b=B s^{-a}H(\xi)\) and the physical vector is \((-y,x,0)Cb\) with the total gate \(C=R Wc\). The potential and all 57 original potential labels are exactly zero on the exterior. The heat parameter obeys \(0\le \xi\le 2/X_b<1/55\), since \(X_b>110\) and \(q\ge\tau\). The directed order-four and order-eight heat enclosures use the original differentiated Laplace kernel for \(H,\xi H',\xi^2H''\). The four heat and pressure remainder magnitudes decrease by a factor strictly greater than 1484 at order eight on this larger domain.

## Pressure and signs

At fixed physical \(z,\tau\), \(q\) is independent of \(s\). Every radius in the pressure ray from a point of the exterior through infinity therefore stays on the heat branch. The bare pressure is
\[
 p_{\rm loc}=-\int_r^\infty K_{\rm heat}(r',\tau)^2\,\frac{dr'}{r'}
 =-\frac{B^2}{4A}s^{-2A}G(\xi),\qquad
 G(\xi)=2A\int_0^1 v^{2A-1}H(v\xi)^2\,dv.
\]
The endpoint derivative gives \(\partial_s p_{\rm loc}=(B^2/2)s^{-2A-1}H(\xi)^2>0\), and the bare \(\partial_z p_{\rm loc}\) is zero. The source multiplies the resulting pressure by \(C=RWc\). For example
\[
 \partial_x(C p_{\rm loc})
 = C x B^2 s^{-2A-1}H^2+2x R_s Wc\,p_{\rm loc},\qquad
 \partial_z(Cp_{\rm loc})=R c W_\zeta\,p_{\rm loc}/z_0.
\]
At \(c=1/2\) on a unit spatial plateau, inserting the squared velocity cutoff in the pressure integral would impose \(1/4\) in the lower endpoint derivative where the source gives \(1/2\). The exact replay rejects that control. The radial pressure ray has no truncation at the spatial support face. Its unlocalized pressure there stays negative, and the localized pressure and its required derivatives vanish by the flat cutoff.

The original b-time label denotes differentiation in \(\tau=1-t\). The physical derivative has the opposite sign. Write \(H_1=\xi H'\) and \(H_2=\xi^2 H''\). The radial and time products for \(\widetilde b=Cb\) are
\[
\begin{aligned}
 s^{a+1}\widetilde b_s/B &= Wc\,[sR_sH-R(aH+H_1)],\\
 s^{a+2}\widetilde b_{ss}/B &= Wc\,[s^2R_{ss}H-2sR_s(aH+H_1)+R(a(a+1)H+2(a+1)H_1+H_2)],\\
 \tau_0 s^a\widetilde b_\tau/B &= RW[c' H+cH_1/\rho].
\end{aligned}
\]
The two axial rows use \(W_\zeta=4\zeta\chi'(2\zeta^2)\) and \(W_{\zeta\zeta}=4\chi'(2\zeta^2)+16\zeta^2\chi''(2\zeta^2)\) with the respective \(z_0^{-1}\) and \(z_0^{-2}\) factors. On \(\zeta>0\) the localized \(b_z\) is nonpositive and \(p_z\) nonnegative. The signs reverse for \(\zeta<0\). The axial pressure derivative is the full axial force in the exterior.

## Exact and interval results

The packet includes all 67 bare and all 67 localized label intervals, plus all 13 original cutoff intervals. The bare field has 60 exactly zero labels. The two axial \(b\) rows and the axial pressure row become nonzero after localization, leaving 57 exact zero labels. All ten active rows are strictly signed at the same point \(s=\zeta^2=3/8\), \(\zeta>0\), \(\rho=3/4\), with radial unit vector \((3/5,4/5)\). The original exterior geometry places this point above its moving inner face. Exactly at each of the radial, axial, and time support boundaries all localized labels vanish by original flatness. The same zero extension applies outside the positive support.

The replay covers each signed axial half and cuts the radial, axial and time transition bands into 4 and 8 parts. These give 200 and 1296 outward rational boxes. The radial plateau box is only a coefficient box. Its apparent lower endpoint \(s=0\) is never used for the heat or radial normalizations. They use the actual \(s\ge 2qX_b\ge s_*=\tau_0 X_b>0\). The four combined spatial plateau and transition regions have their own intervals. The refined global enclosure strictly reduces eight active widths. The package also gives fixed-scale intervals by replacing \(s\) in the positive multipliers by \(s_*\). Each multiplier ratio has the form \((s_*/s)^d\) with \(d>0\), and is enclosed in \([0,1]\). All 67 intervals overlap their C113 comparisons on the common upper piece, with the same normalizers.

Sparse rational algebra applies the bare exterior rows and nonconstant cutoff rows to the captured original 67+13 stencil. It reproduces all 16 outputs after substitution of the localized product derivatives. The underlying exact identities retain the two cylindrical radial Laplace factors, axial Laplacian, physical time sign, centrifugal convection and pressure commutator. In particular, the axial force remains \(C_zp_{\rm loc}\), and its radial counterpart is \(C(1-C)K_{\rm heat}^2/r+C_r p_{\rm loc}\). The horizontal force components have only the two physical angular modes ±1 after collecting x²+y²=s. The axial pressure force supplies a genuine mode zero at the simultaneous-transition point. The union of the force modes is therefore {−1,0,1}, and the Cartesian gradients use modes {−2,−1,0,1,2}. The original patch still has zero axial force wherever the two spatial cutoffs are on their unit plateaux. These are calculations for the original moving heat exterior alone. The annulus, center, whole-field jet comparisons and whole-K last resolved time remain open. The global final count is 0/67, N7-06 and N8-05 are OPEN, and RELEASE HOLD remains.

~~~text
python -B verify_full_exterior_jets.py --workspace WORKSPACE --goal GOAL_NEXT --out full-exterior-jets.json
~~~
