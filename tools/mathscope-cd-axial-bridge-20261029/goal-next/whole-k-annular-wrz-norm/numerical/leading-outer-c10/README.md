# Numerical C10 bound for the original leading exterior

The actual source (F_0) satisfies, for nonnegative integers (r,e) with (r+e\le10),

\[
|\partial_X^r\partial_\eta^eF_0(X,\eta)|
 < 2^{-65343}\frac{X_v}{X^{r+1}},\qquad X\ge X_+=eX_v,\quad -1\le\eta\le1.
\]

Derivatives at either \(\eta\) endpoint are the continuous one-sided derivatives from the original domain. The estimate includes the interpolation, angular, steepen, steepPower, flatten, wait, and terminal stages. The terminal stage includes the original heat transition and the complete infinite exterior. The actual \(U_0\) is already identically zero after \(X_v\).

Replay from the workspace root using the original runtime directory or an exported source tree containing the pinned runtime blobs.

```powershell
node work/goal-next/leading-outer-c10/replay_leading_outer_c10.mjs work/goal-next/second-live/node-fixture work/goal-next/leading-outer-c10/leading-outer-c10.json
node work/goal-next/leading-outer-c10/check_outer_receipt.mjs work/goal-next/second-live/node-fixture work/goal-next/leading-outer-c10/leading-outer-c10.json
```

The checker pins the twelve Git blobs read from `b14e309`, validates the original symbolic parameter tree, constructs the actual leading graph, and reads the live stage and heat roots. In particular, the imported `Xtail` and `Etail` match the actual terminal start and amplitude under lexical bound-variable renaming. The check emits all 462 integer derivative rows, including 66 total-degree pairs on each of seven branches. The largest majorant coefficient needs 193 bits. The receipt SHA256 is `a2937d2c2066946f3dbe0a1be2a883766266a0b984914b67780ab81e55eadcbb`.

## Source region and amplitude

Write \(y=\log(X/X_R)\), \(a=1/2+h\), \(\alpha=-1/2-\lambda\), and \(\rho=c_oh\). The original pulse and interpolation definitions give

\[
X_p=X_Re^{T+2+60B},\qquad X_v=X_pe^{13/\lambda},\qquad X_+=X_ve.
\]

The pin includes \(X_R=110(C_{\rm Selected}P_*)^{10}\), \(\log C_{\rm Selected}=10\log(1+Q^{300})+Q^{200}>0\) and \(\log P_*=2T>0\). The original positive \(Q\) and \(T\) therefore give \(X_R>110\) and \(X_v>1\). The C12 right endpoint is \(X_Re^{T+3}\), I1 ends at \(X_pe^{-20}\), and I2 ends at \(X_pe^{-15}\). All three corrections vanish before \(X_+\). The B8 and pregluing branches occur before \(X_R\). Since \(T_f=128>1\), \(X_+\) lies in the actual interpolation. The actual angular bumps remain present in the next stage.

At the pulse end, the scalar amplitude before its angular factor is at most \(P_* e^{-13/(2\lambda)}\). All preceding stage contributions to its logarithm after the initial unit are negative. The initial unit contributes \(1/10-(3/5)(1/2)=-1/5\). From \(T=e^{1048576}+10>11\) and \(\lambda^{-1}=e^{1000T}>1+1000T\),

\[
\log(P_* e^{-13/(2\lambda)})< -(6498T+13/2)<-65536.
\]

Every subsequent scalar exponent decreases at least at rate \(1/2\) in \(y\) after removing the angular bumps and the terminal \(f_o/(1-\rho)\) factor. The interpolation multiplies by \(e^{-\log(2)\sigma(s/T_f)} f(\eta)^{1-\sigma(s/T_f)}\le1\), with \(f=(1+\eta^2)^{-1}\). The steepen and flatten primitive is \(S(s)=\int_0^s\sigma\), with \(0\le S'\le1\), and the remaining baseline slopes are \(\alpha\), \(-3/2\), or \(-a\). Therefore each scalar baseline height is at most \(2^{-65536}\sqrt{X_v/X}\). Division by \(\sqrt{2X}\) preserves the bound \(2^{-65536} X_v/X\). The checker applies separate Taylor majorants for the angular bumps and terminal factor. The finite stage joins use the flat source cutoffs and the matching endpoint values and slopes from the actual schedule.

## Actual angular and heat factors

The angular correction uses the original coefficients \(c_1,c_2\) and the exact bumps \(\beta(s)=(10/3)\sigma'((10/3)s+1/2)\) translated to the two source centers. The source coefficient contraction holds on \(\operatorname{dist}(\eta,[-1,1])\le1/4\). The true small root satisfies \(|c_2|\le65536\lambda^{29}\). The linear row gives \(c_1=\mathrm{target}-e^{2(1-\lambda)}c_2\), with \(|\mathrm{target}|\le2048\lambda^{29}\). Hence both coefficient heights are less than one and Cauchy's formula on radius \(1/8\) bounds their Taylor coefficients through ten by \(8^e\).

For an explicit check of the small-root contraction, set \(\varepsilon=\lambda^{29}\), \(a_0=1-\lambda\), and \(b_0=-1-2\lambda\). The positive mass-one bump is supported on \([-3/20,3/20]\), so \(1/2\le B_A,B_B\le2\) for its integrals weighted by \(e^{a_0s},e^{b_0s}\). The scalar linear derivative is \(D=2B_B(e^{2b_0}-e^{2a_0})<-1\). The interpolation formula gives \(|r_{\rm after}|<24\) on the stated tube because \(|2f|<3\), \(r_{\rm before}<3\) and \(a_0>1/2\). The last real inequality follows from \(r_{\rm initial}<10\), \(r_{\rm decay}<2\), \(r_{\rm entry}<5\), and the reserved-plus-pulse interval's exponential decay. The actual angular debt multiplies \(r_{\rm after}-1/a_0\) by \(e^{-a_0(30B-3)}<27\varepsilon\), using \(B=1000T\), \(\lambda=e^{-B}<1/30\), and \(e<3\). Division by \(B_A\) gives \(|\mathrm{target}|<2048\varepsilon\).

Eliminating \(c_1\) gives the actual equation

\[
D c_2+2B_B\mathrm{target}
 +Q_0(\mathrm{target}-e^{2a_0}c_2)^2+Q_1c_2^2=0,
\quad Q_0=\int e^{b_0 s}\beta(s)^2ds,\quad Q_1=e^{2b_0}Q_0.
\]

Here \(Q_1\le Q_0\le8\sup|\sigma'|\). The auxiliary integer checker verifies the self-map and contraction inequalities on \(|c_2|\le65536\varepsilon\) and bounds the explicit source root on the real slice inside the same ball. The holomorphic fixed point therefore continues that real branch. No analyticity of the heat function across \(\eta=\pm1\) is used.

On and after the terminal start put \(s=\log(X/X_{\rm tail})\), \(Z=2(1-\eta^2)/X\) and

\[
E_{\rm cl}=E_{\rm tail}e^{-as}\frac{1-\rho+\rho\sigma((s-1)/2)}{1-\rho},\quad
L=1-H,\quad \kappa=\sigma((s-1/5)/(3/10)).
\]

The original terminal branch is \(F_0=E_{\rm cl}(1-\kappa L(Z))/\sqrt{2X}\). Before the heat starts, \(\kappa=0\). After the terminal stage, \(f_o=\kappa=1\) and this is the exact source expression \(A_{\rm ext}X^{-1-h}H(Z)\). The original Gamma integral is

\[
H(Z)=\frac{1}{\Gamma(1+h)}\int_0^\infty e^{-t}t^h(1+Zt)^{-h}dt.
\]

For each \(m\le10\), dominated differentiation on \(Z\ge0\) follows by bounding the derivative integrand with \((h)_m e^{-t}t^{h+m}\). The Gamma recurrence yields \(|H^{(m)}|\le(h)_m(1+h)_m\le m!(m+1)!\) because \(0<h<1\). Also \(0\le L\le1\). These bounds give continuity up to \(Z=0\) and hence the required one-sided endpoint jets in \(\eta\).

## Exact arithmetic and use in the full FTC expression

The replay substitutes a single nonnegative formal variable for both Taylor increments and majorizes absolute coefficients. It uses the original square-seed cutoff through order eleven to account for the differentiated angular bumps. Ordinary derivatives are recovered with the two factorials. Physical radial derivatives use \(X^r\partial_X^r=\prod_{j=0}^{r-1}(D_y-j)\), retaining every signed term before taking its absolute coefficient. Multiplication by the source inverse square-root prefactor is included. All arithmetic in these coefficient bounds uses exact integers.

For \(r\ge1\), the integral of the exterior derivative magnitude is bounded by \(2^{-65343}/r\), since \(\int_{X_+}^\infty X_vX^{-r-1}dX=X_v/(rX_+^r)\le1/r\). The original FTC integrand is \(\sqrt{1+d^2}\) and its unit contribution must be integrated on the original finite box. If \(M\) bounds the active C10 derivatives on \([X_a/2,X_+]\times[-1,1]\), each original four-face FTC expression for \(\partial_X^r\partial_\eta^eF_0\), \(r+e\le8\), is at most

\[
3(1+2X_b-X_a/2)(1+\max(M,1)).
\]

The receipt verifies the exterior part. The parent numerical replay combines it with the actual active C10 bound and the original finite box width.
