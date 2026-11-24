# Original heat exterior at terminal time

**Verified on the source-identified heat collar.** On \(r^2\ge2^{-1024}\) all three terminal force components and the radial-infinity pressure have explicit formulas at each order. This includes both spatial cutoff transitions and both signs of \(z\). The proof gives quantitative Cartesian derivative bounds and a differentiated extension tail on this collar. The finite replay evaluates exact coefficients through order 20 and agrees coefficient by coefficient with 26 archived radial-source polynomials through order 12.

**Open for the global certificate.** The same final force on \(0\le r^2<2^{-1024}\), its compatible terminal traces, the global \(C^a(K)\) norms and a single global \(b_j\) sequence remain necessary.

## The same heat branch up to \(\tau=0\)

Use the paper's \(s=r^2/2\), the Cartesian radial variable \(w=r^2\), and \(\zeta=z/z_0\). The pinned region replay establishes \(2qX_b < 2^{-1024}\) uniformly on the spatial collar up through \(\tau=\tau_0\), using the original parameter and cutoff thresholds. At fixed physical \(z\), equations (4.1)–(4.2) give
\[
 \tau=q-z^2q^{2h},\qquad
 \left.\frac{\partial\tau}{\partial q}\right|_z
 =1-2h z^2q^{2h-1}=1-2h\eta^2>0.
\]
The pinned replay covers \(\tau/\tau_0\in[1/2,1]\). Monotonicity gives \(q(\tau,z)\le q(\tau_0/2,z)\) at each fixed \(z\) for \(0<\tau\le\tau_0/2\), including \(z=0\) where \(q=\tau\). Thus the same strict heat-collar bound holds down to the terminal limit. The original temporal cutoff is one on this interval. For \(\zeta^2>1/2\) or \(w>1/2\) the spatial cutoff and the localized fields are zero by smooth extension. On the supported collar the pressure ray to infinity is taken at fixed physical \(z,\tau\), so \(q\) stays fixed and the ray lies on the unlocalized heat branch.

The source identification uses Lemma 5.2, Proposition 5.5 and Proposition 9.9 Step 4 for the exterior and the smooth vanishing of annular corrections. The localization law and terminal kernel are Proposition 10.1, (10.4)–(10.8), pp. 118–119, and (A.32), p. 138. The original matched amplitude \(c_\infty>0\) is retained.

## Exact terminal fields and force

Let \(A=\tfrac12+h\), \(K(r,\tau)=c_\infty s^{-A}H(2\tau/s)\). In (A.32) the normalized Laplace weight is \(v^h e^{-v}/\Gamma(1+h)\). Differentiation of \((1+(2\tau/s)v)^{-h}\) at \(\tau=0\) contributes \((-1)^j(h)_j(2v/s)^j\). Its magnitude is bounded by \((h)_j(2v/s)^j\) uniformly on \(\tau\ge0\); \(\partial_t=-\partial_\tau\) cancels the sign. Set
\[
\begin{split}
 P_j&=(h)_j(1+h)_j,& D_j&=\sum_{k=0}^j {j\choose k}P_kP_{j-k},\\
 K_j&=c_\infty 2^jP_j s^{-A-j},&
 S_j&=c_\infty^2 2^jD_j s^{-2A-j},\\
 p_j&=-\int_r^\infty S_j(\varrho)\,\frac{d\varrho}{\varrho}
       =-\frac{S_j}{2(2A+j)}.
\end{split}
\]
Here \(S_j\) is the terminal physical derivative of \(K^2\). The same derivative bounds are integrable on the pressure ray uniformly for radii bounded below. Further radial derivatives follow by differentiating the heat kernel or the pressure ray's lower endpoint. In each such calculation the next time derivative is uniformly bounded, so the time fundamental theorem of calculus gives uniform convergence to the displayed values for every fixed mixed derivative.

Let \(R=\chi(2w),W=\chi(2\zeta^2),C=RW\) be the original spatial factors. The localized exterior has \(u=CKe_\theta\) and \(p=Cp_{\rm loc}\). The vector heat equation and \(\partial_r p_j=S_j/r\) give
\[
 F_{j,r}=C(1-C)\frac{S_j}{r}+C_r p_j,\qquad
 F_{j,\theta}=-(\Delta C)K_j-2C_r\partial_r K_j,\qquad
 F_{j,z}=C_zp_j .
\]
At \(w=3/8,z=0\) the radial and angular signs reproduce the archived formulas \((1/4+3/(2A+j))S_j/r>0\) and \(-64(h+j)K_j<0\). At \(w=\zeta^2=3/8\), \(C_z=-8\zeta/z_0\), so the axial force is nonzero with the sign of \(\zeta\). Both witnesses use the original pressure integral followed by localization.

## Cartesian bounds and differentiated extension

Write \(U_j=F_{j,r}/r,\ V_j=F_{j,\theta}/r\), and \((F_{j,x},F_{j,y})=(xU_j-yV_j,yU_j+xV_j)\). Use \(\partial_rK_j=-2(A+j)K_j/r\) and
\[
 C_r/r=4\chi'(2w)W,\qquad
 \Delta C=(8\chi'(2w)+16w\chi''(2w))W+
 R(4\chi'(2\zeta^2)+16\zeta^2\chi''(2\zeta^2))/z_0^2 .
\]
The independent rational code contracts the Taylor variables for \(x,y,\zeta\) to one positive variable \(v\), summing absolute coefficients at each degree. On the support \(|x|,|y|,|\zeta|\le1\). The increments of \(w,\zeta^2\) are bounded coefficientwise by \(4v+2v^2,\ 2v+v^2\). For \(w^{-\beta}\) with \(0<\beta\le b\), \(b\) an integer, the degree-\(k\) normalized coefficient in an increment of \(w\) is bounded by \(2^{1024(b+k)}\binom{b+k-1}{k}\). A degree-\(a\) coefficient times \(a!\) bounds each spatial derivative of that degree. Physical \(\partial_z=z_0^{-1}\partial_\zeta\) and \(z_0<1\) justify the uniform factor \(z_0^{-a-2}\), including the axial Laplacian.

For the cutoff \(\chi\) write \(f(u)=e^{-1/u}\) for \(u>0\), smoothly zero for \(u\le0\). On \(0<u\le1\), \(f^{(n)}(u)=T_n(1/u)e^{-1/u}\) with \(T_0=1\), \(T_{n+1}(y)=y^2(T_n(y)-T_n'(y))\). Use \(y^k e^{-y}\le k!\) and \(f(u)+f(1-u)\ge e^{-2}>1/9\). Differentiating the quotient recursively gives explicit uniform bounds for all cutoff derivatives, with seam values supplied by flatness. This yields
\[
 \|F_j\|_{C^a(\mathrm{collar})}
 \le M_{j,a}=2^{d_{j,a}}(1+c_\infty+c_\infty^2)z_0^{-a-2},
\]
where the integer \(d_{j,a}\) is given by the coefficient majorant, including lower orders. The spatial norm bounds the Euclidean length of each Cartesian derivative. Finite JSON rows give explicit exponents through \(a=\max(2,\lfloor j/2\rfloor)\).

For the freely chosen cutoff in Lemma 10.3 use \(\chi_0(v)=\chi(v^2)\). It is smooth, one near zero, and zero for \(|v|\ge1\). With \(L_k\ge\|\chi_0^{(k)}\|_\infty\) from the cutoff majorant define
\[
 C_{j,m}=\sum_{\substack{0\le k\le m\\ j-m+k\ge0}}
 \binom{m}{k}\frac{L_k}{(j-m+k)!}.
\]
For \(\sigma=t-1\ge0\) the product rule bounds each differentiated summand of (10.11) by \(C_{j,m}b_j^{m-j}M_{j,a}\). Take \(b_0=1\) and
\[
 b_j=b_{j-1}+1+
 \left\lceil \max_{a+m\le\lfloor j/2\rfloor}2^j C_{j,m}M_{j,a}\right\rceil
 \quad (j\ge1).
\]
This sufficient collar schedule makes each constrained summand at most \(2^{-j}\) since \(j-m\ge1\). For fixed \((a,m)\) and \(N\ge\max(0,2(a+m)-1)\) the entire differentiated tail after \(N\) is bounded by \(2^{-N}\). At each \(\sigma>0\) only finitely many summands are nonzero. All derivatives vanish at \(\sigma\ge1\) by smooth cutoff and uniform convergence. At \(\sigma=0\) the \(m\)-th derivative matches \(F_m\), which yields the smooth join on the collar. Spatial support is relative to the collar, including its ordinary interior trace at the positive inner radius. The global least-integer rule in the paper uses the full force norms on \(K\).

## Reproduction

Run the independent standard-library checker against the evidence branch's goal-next directory. The three input receipts are hash-pinned. The archived comparison file comes from calling the original exteriorTerminalPolynomials function through order 12. The source module SHA-256 is 60b696ffe2bb26e93a15e45feb554435741a392a7418260f90a6cbbf68d5ec16.

~~~text
python -B verify_terminal_collar.py --goal /path/to/goal-next --out terminal-heat-collar.json --order 20
~~~
