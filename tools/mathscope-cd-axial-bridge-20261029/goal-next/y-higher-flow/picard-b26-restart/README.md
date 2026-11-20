# Original N1 restart across the B.26 join at \(Y=4\)

**VERIFIED**. The unchanged runtime matches both original N1
Picard descriptors and the retained B.26 decision in the actual
leading angular field. The registered original matrix entry
#25602 is \(A_{0,30}=4\xi F_0\). The runtime carried that entry
and its actual natural and B.26 operands to the same positive
right-side coordinate. It also produced the exact auxiliary seam
seed, two restarted terms with original coefficients, and six
actual native calls at the positive right endpoint. The pinned
C55 implementation verifies the actual B.26 controls, the
leading \(B\) norm and the source \(C_1\) operand.

**CONDITIONAL**. Under the original written \(B_\rho\) natural
realization and its A.21 datum as used by C55 and C96, the
actual N1 system joins the C96 core to the real B.26 branch.
Its left and right values and all fixed ordinary radial and
parameter jets match at \(Y=4\). The real radial kernel is
smooth there. Its tracked original matrix entry is strictly
larger on the B.26 side than the auxiliary analytic reference,
so the actual entry has no radial analytic extension through
the join. The restarted series gives an explicit positive
right interval with a small geometric tail and the unchanged
actual leading coefficients.

## Strict discrepancy of the original right coefficient

Let \(y=\log(X/X_a)\), \(Y=4e^y\). The actual source controls
from C55 on \(0\le y\le t_1/16\) use the same natural reference
with \(p=\partial_y\log(g\Phi(4e^y,\eta))\).
The B.26 evolution is
\(F_{0,\mathrm{act},y}=\kappa p F_{0,\mathrm{act}}\),
where
\(\kappa=1-(1-t_1)\sigma(y/t_1)\).
Both angular fields start from \(g\Phi(4,\eta)>0\)
at real \(\eta\). On \(\eta=0\),
\[
 \log\frac{F_{0,\mathrm{act}}}{F_{0,\mathrm{nat}}}
 =(1-t_1)\int_0^y \sigma(v/t_1)(-p(v,0))\,dv .
\]

For the natural auxiliary approximation,
\(\chi(0)=4000000/4000001\) and
\[
 f_0(w)=\sum_{n\ge0}\frac{(-w)^n}{2^n n!(n+1)!},
 \qquad \Phi_0(Y,0)=f_0(Y\chi(0)).
\]
On \(0\le w\le41/10\), consecutive magnitudes in \(f_0'\)
have ratio \(w/[2n(n+2)]<1\) for \(n\ge1\).
The alternating upper estimate is
\(f_0'(w)\le-1/4+w/24\le-19/240\).
The original natural theorem (17) gives
\(|\partial_Y(\Phi-\Phi_0)|\le Q^{-29}<1/128\) there.
The exact comparison gives \(\partial_Y\Phi<-1/16\).
Also \(f_0(w)\le f_0(0)=1\) and
\(\lvert\Phi-\Phi_0\rvert<Q^{-29}<1/128\), whence
\(0<\Phi<2\). It follows that
\(-p\ge1/8\) on the right region with \(4\le Y\le41/10\).
The C55 bound supplies \(-p\le8Q\).

The original squared-flat step is
\(\sigma(u)=[1+\exp(u^{-2}-(1-u)^{-2})]^{-1}\) for \(0<u<1\).
For \(0<u\le1/128\), its exponent is above \(16382\).
On \(1/256\le u\le1/128\) it is below \(65536\), and
\(\sigma(u)\ge e^{-65536}/2\). Thus at the exact source witness
\(X_{\mathrm w}=X_a e^{t_1/128}\), \(\eta=0\),
\[
 \frac{(1-t_1)t_1e^{-65536}}{4096}
 <\log\frac{A_{0,30,\mathrm{act}}}{A_{0,30,\mathrm{nat}}}
 < \frac{(1-t_1)Qt_1e^{-16382}}{16}.
\]
The normalizing factor \(4\xi\) is positive and identical in
both entries. The integral gap is positive at every \(y>0\)
in the stated right region. The squared-flat step has every
positive-order derivative zero at \(u=0\), and also value zero
there. Consequently the discrepancy is flat at the seam and
analytic continuation of the natural entry would give the
wrong original entry to the right.

## Actual right restart

Let \(\alpha=\sqrt{X_a}\), \(\alpha_{\mathrm w}=\sqrt{X_{\mathrm w}}\),
\(w=\alpha_{\mathrm w}-\alpha\), \(B=2^{20}\),
and \(s_0=s_{\mathrm{aux}}/4\), with the verified C96 strip.
Define
\[
 b=\frac{w}{1+w}\frac{s_0^2}{B(1+C_1)^3},\qquad
 \alpha\le\xi\le\alpha+b<\alpha_{\mathrm w}.
\]
This radius is inside the actual B.26 domain and inside \(X<X_{\rm keep}\).
The exact auxiliary seam value \(W_a(\eta)\) is defined in the
complex disc of C96. Its left trace equals the actual seam data.
Let \(M_{\mathrm{left}}=\exp(9 C_{\mathrm{aux}}^2 a_{\mathrm{aux}}^2/(2s_{\mathrm{aux}}))\).

At every right point write
\[
 H_i(\xi,\eta)=(\alpha/\xi)^{c_i}(W_a)_i(\eta),\qquad
 (G_{\mathrm a}f)_i(\xi,\eta)
 =\int_\alpha^\xi(\tau/\xi)^{c_i} f_i(\tau,\eta)\,d\tau .
\]
Splitting the same original radial integral at \(\alpha\) gives
\[
 W=T_0+\mathcal K_{\mathrm a}W,\quad
 T_0=H+G_{\mathrm a}f,\quad
 \mathcal K_{\mathrm a}=G_{\mathrm a}(A_0+A_1\partial_\eta).
\]
The runtime writes exactly this split expression using the original
six diagonal exponents, original forcing and actual right matrix.
The displayed approximation is \(T_0+\mathcal K_{\mathrm a}T_0\).

On \(S_{2s_0}\) the initial norm is at most \(1+M_{\mathrm{left}}\)
because \(C_1 b/2<1\), and the modulus of every ordered radial
weight is at most one. In a \(k\)-letter word allocate total
parameter loss \(s_0\) by Cauchy. Every parameter derivative costs
at most \(k/s_0\). The ordered simplex has volume at most \(b^k/k!\).
Each source coefficient norm is at most \(C_1/2\) by C55, and
there are at most \(2^k\) words.
Since \(k^k/k!<3^k\), the \(k\)-th term is bounded by
\((1+M_{\mathrm{left}})r^k\), with
\(r=3C_1 b/s_0<3/B<1/2\).
The geometric sum realizes the exact right solution. Indeed the
ordinary full actual Volterra solution from C55 satisfies this
same split integral, and the iterated difference tends to zero
by the same estimate. The error after the two displayed terms on
\(S_{s_0}\) is at most
\[
 \frac{18}{B^2}(1+M_{\mathrm{left}}).
\]
Real \(\eta\) derivatives of order \(m\) multiply this by
\(m!(2/s_0)^m\). The local series gives the same continuous trace
at \(\alpha\). The regular positive-radius equation and the
matching coefficient jets then give agreement of each fixed
radial derivative by induction on shrinking parameter strips.

These right radii also admit the original N1 physical label
\(\ell=\ell_{\min}+12\) from C95 by taking \(Z=0\), \(T=31/32\),
\(s=T\) and \(R=\sqrt{2sX}\). Then \(q/q_{\rm Big}=31/128\),
\(b_1q<1/2\) and \(b_2q>2\).

**OPEN**. The first-order coefficient values on the wider activation
collar and the full stress support, actual higher-order source
realization, and final jet evaluation. The pressure matrix
nonextension is a property of the kernel. The result gives the
actual right ordinary solution by its restarted series.

## Replay

    $p = 'work/goal-next'
    $d = "$p/continuation97/y/final"
    $g = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
    $r = "$p/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier"
    $n = "$p/hosted-43055678022-N4/original-whole-k-current-pressure-graph"
    node "$d/replay_n1_b26_restart.mjs" $r "$n/original-source-functions.json" "$p/continuation90/y/final/core-operands.json" "$p/continuation96/y/final/local-majorant.json" "$d/b26-restart-operands-repeat.json"
    python -B "$d/verify_n1_b26_restart.py" "$d/b26-restart-operands-repeat.json" "$p/continuation90/y/final" "$p/continuation96/y/final/local-majorant.json" $g "$d/b26-restart-repeat.json"
