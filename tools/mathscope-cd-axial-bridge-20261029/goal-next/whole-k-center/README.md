# Positive center contribution of the original whole-K field

**Verified source reduction.** For the authenticated common-selector realization using chi(b_n q), a moving cell wholly inside the original core has strictly positive normalized swirl energy and strictly positive swirl work from the original time-cutoff term. Two of the original local field atoms have signed interval enclosures there. The proof uses the manuscript's annular zero-extension theorem and the actual first two common background cutoff clauses. The final-slab endpoint energy bound stated below additionally requires the original third-order normalized diagonal bound, which has no independent numerical replay here.

## Physical core and original cutoff

Distinguish the fixed source parameter \(\Lambda\) from the original whole-K coordinates. At each fixed \(\rho=\tau/\tau_0\), take
\[
 Y=\Lambda X,\qquad Q=\frac{q}{\tau_0}=\frac{\rho}{1-\eta^2},\qquad
 \zeta=\eta Q^D,\qquad r^2=\frac{2\tau_0QY}{\Lambda},
\]
where \(D=\tfrac12-h\), \(A=\tfrac12+h\), and \(\tau_0=q_{\rm Big}/32\). The substitution gives the exact original implicit equation \(Q-\zeta^2 Q^{2h}=\rho\). It uses the physical \((z,\tau)\) slots of the actual native chart. At fixed \(\rho\), its normalized Cartesian volume element is
\[
 dx\,dy\,d\zeta
 =\frac{\tau_0}{\Lambda}Q^{D+1}\frac{1-2h\eta^2}{1-\eta^2}
 \,dY\,d\theta\,d\eta .
\]
The radial coordinate depends on \(\eta\), but the axial coordinate has no \(Y\) dependence, so the mixed radial derivative does not enter the determinant.

Set \(\eta_*=\sigma_\star/\Lambda\) with \(\sigma_\star=j_0/2000\), \(j_0=h^4\). Use \(2\le Y\le5/2\) and \(|\eta|\le\eta_*\). Since \(X_a=4/\Lambda\), this has \(X<X_a\) with a strict radial gap. The original wave supports are in \(X_a\le X\le X_b\), and the mean, modified radial-integral and pressure constructions have the manuscript's smooth exterior branches. Proposition 9.9 Step 5 and the source inner-growth definition identify the region \(X<X_a\) as the base alone, including the vanishing of the initialization corrections. The replay uses these support statements as original source theorems.

The geometry gives \(\eta_*<1/4\), \(Q<2\), \(|\zeta|<1/2\) and \(r^2\le5q/\Lambda<1/4\). Thus both spatial factors in the actual cutoff are strictly on their unit plateaux. With \(c=\chi(\rho)\), \(\nabla C=0\) there and the outer curl commutator vanishes. The time cutoff is spatially constant and is not differentiated by curl. The base Stokes potential is azimuthal, so its curl does not contribute to the azimuthal velocity. The actual azimuthal velocity is
\[
 u_\theta=cq^{-A}(E_0+\Delta E).
\]
This identification and the positive swirl bound do not depend on a pressure offset or on cancellation with a meridional gauge.

## Actual core and positive background terms

The original natural-core evaluator uses \(F_0=g(\eta)\Phi(Y,\eta)\) and \(E_0=\sqrt{2X}F_0\). Its exact positive prefactor is \(g=e^{\Lambda\psi}/C_{\rm Selected}\), with \(\psi(0)=0\) and
\[
 \psi'=-\frac{L H_s}{H_s^2+\sigma_\star^2},\quad
 L=1-2h\eta^2,\quad H_s=D\eta+(1-\eta^2)(4\eta+j_0).
\]
On this cell, \(|\psi'|\le1/(2\sigma_\star)\) and \(|\Lambda\psi|\le1/2\), giving \(1/2<gC_{\rm Selected}<2\). Also \(H_s>j_0/2\), so the actual comparison coefficient \(\chi_{\rm core}=H_s^2/(H_s^2+\sigma_\star^2)>3/4\).

The original comparison recurrence gives the alternating series with terms \((-\chi_{\rm core}Y)^n/(2^nn!(n+1)!)\). Its value lies in \([3/8,1]\) on \(2\le Y\le5/2\). Its first derivative is between \(-1/4\) and \(-7/64\), using the first two alternating terms and the ratio at most \(5/12\). The source uniform nonlinear comparison error is retained, below \(1/24\) for the value and below \(1/64\) for the first derivative. These bounds extend over the rectangle by the continuity of the original functions. They give \(\Phi\in[1/3,9/8]\), \(\Phi_Y\in[-1/3,-1/16]\). A separate execution of the actual point evaluator at \(\eta=0\) gives the following rounded displays. The receipt stores the directed rational intervals.

| \(Y\) | Actual \(\Phi\) | Actual \(\Phi_Y\) |
|---|---:|---:|
| \(2\) | \(0.576725\) | \(-0.176417\) |
| \(9/4\) | \(0.533617\) | \(-0.168490\) |
| \(5/2\) | \(0.492458\) | \(-0.160821\) |

For each active original order the actual normalized coefficient clauses give \(B_{n,m}q^{2nh}\le2^{-n}q^{nh}\) for \(m=0,1\) through the historical \(c_n\) cutoff, since the common \(b_n\) dominates \(c_n\). The derivative in this statement is at fixed \(q,\eta\) in \(X\). Its domain begins at \(X_a/2\), which is exactly \(Y=2\). All inactive cutoffs give zero including at their flat seam. The source comparison \(h\log(1/q_{\rm Big})>65536\log C_{\rm Selected}\), together with \(\log(C_{\rm Selected}\sqrt\Lambda)<2\log C_{\rm Selected}\), gives
\[
 |\Delta E|,\ |\partial_X\Delta E| < q^h
 <\frac1{512C_{\rm Selected}\sqrt\Lambda}.
\]
Thus \(E_0+\Delta E\) lies between \(1/4\) and \(8\) times \((C_{\rm Selected}\sqrt\Lambda)^{-1}\). For \(b=B/r\) and \(s=r^2\), use \(\partial_s=(2q)^{-1}\partial_X\) at fixed \(z,\tau\), with \(q\) independent of radius. The leading \(b_s\) uses \(g\Phi_Y\Lambda/(2q)\), and the correction differentiates both \(\Delta E\) and \(1/\sqrt{2X}\). The actual near-start atom intervals are
\[
 b@0,0,0\in[1/48,16]\frac{\tau_0^{-(1+h)}}{C_{\rm Selected}},\qquad
 b@1,0,0\in[-4,-1/1024]\frac{\tau_0^{-(2+h)}\Lambda}{C_{\rm Selected}}.
\]

## Nonzero center energy and time-cutoff work

For the independently usable prefix, take \(\eta\in[\eta_*/2,\eta_*]\) and
\[
 \rho\in[\rho_L,\rho_U]=[1-\eta_*^2/8,\,1-\eta_*^2/16].
\]
Then \(Q>1\) with strict margin. The exact common selector lower bound \(b_nq_{\rm Big}\ge32\) for \(n\ge3\) makes all their cutoff terms flat zero. Only the first two actual normalized clauses are needed in this common-selector realization. The literal historical chi(c_n q) requires its own activity test. The inequality b_n>=c_n preserves upper bounds for each active term, and only b_n supplies the inactivity argument here. The replay binds their actual common and historical scale roots in the original graph. This time band lies strictly inside the original positive-time slab and \(c>0\) on it.

The normalized swirl energy in a spatial slice of this cell is
\[
 E_\theta^*(\rho)=\frac{2\pi\tau_0}{\Lambda}c^2
 \int Q^{1/2-3h}\frac{1-2h\eta^2}{1-\eta^2}(E_0+\Delta E)^2\,dY\,d\eta.
\]
The product of the \(Y,\eta\) interval lengths is \(\eta_*/4\), and the remaining geometry factor is at least \(1/2\). Hence
\[
 E_\theta^*(\rho)>
 \frac{\pi\tau_0\eta_*}{64C_{\rm Selected}^2\Lambda^2}c(\rho)^2
 \ \ge\ \frac{\pi\tau_0\eta_*}{256C_{\rm Selected}^2\Lambda^2}e^{-16/\eta_*^2}>0 .
\]
The last bound uses the original flat step's numerator at \(1-\rho\ge\eta_*^2/16\).

On the same cell, the exact product rule gives the time-cutoff term \(c_tu_{\rm loc}\) in the force. Its swirl work in the normalized balance is the uncut swirl energy weighted by \(-cc'\), where the prime is in \(\rho\). Since the original \(\chi\) is strictly decreasing there, integration gives the positive lower bound
\[
 W^*_{\rm time,\theta}>
 \frac{\pi\tau_0\eta_*}{128C_{\rm Selected}^2\Lambda^2}
 \bigl(c(\rho_L)^2-c(\rho_U)^2\bigr)>0 .
\]
The local residual and nonlinear advection remain in the force and can affect total work.

At the slab endpoint \(\rho=1/2\), use the symmetric interval \(|\eta|\le\eta_*\) and \(c=1\). The same proof gives \(E_\theta^*>\pi\tau_0\eta_*/(16C_{\rm Selected}^2\Lambda^2)\) **conditional on the actual third-order normalized \(m=0\) clause**, because \(n=3\) can be active there. The targeted [third-order replay](../whole-k-center-n3/README.md) now supplies the \(m=0,1\) clauses and extends the two signed intervals to the endpoint of the common-selector realization.

The verified center result does not supply the remaining global atom derivatives, the full center force, or a whole-K space-time refinement. N7-06 and N8-05 stay OPEN. Global jets stay 0/67 and RELEASE stays HOLD.

## Replay

    python check_whole_k_center.py --repo <repo> --paper <166-page-pdf> \
      --localization-source <localization-source> --runtime <original-core-runtime> \
      --joined <first-gauge-joined> --whole-k <whole-k-chart.json>

This replays the pinned manuscript and Git blobs, a 4,459,637-node actual graph and its native registry, three actual point enclosures, and exact rational/symbolic inequalities. It uses Python with PyMuPDF and SymPy plus the installed Node runtime for the actual point evaluator. No Lean compilation is part of this replay.
