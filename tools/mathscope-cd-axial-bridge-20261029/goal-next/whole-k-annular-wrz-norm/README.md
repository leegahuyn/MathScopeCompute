# Exact source norm expressions for the remaining directional covariance input

**VERIFIED exact finite norm programs.** The original weighted target has exact source-only slow \(R,Z\) bounds through degree seven. The actual completed slow \(F,G\) have exact source-only slow \(R,Z\) bounds through degree eight on the original whole-K annulus. A separate computation bounds the actual fourth coefficient profiles through eight and gives its original cutoff's relative flat Euler bounds. The positive roots retain the exact FTC integrals as operands. No quadrature values are asserted.

| Exact source norm | Graph root | Domain |
|---|---|---|
| Leading \(U_0\), ordinary \(X,\eta\) C8 | 10199 | All \(X\ge0\) and \(|\eta|\le1\) |
| Leading \(F_0\), ordinary \(X,\eta\) C8 on active support | 10205 | \(0\le X\le X_+=eX_v\), \(|\eta|\le1\) |
| Weighted slow target C7, two components | 153453, 153454 | Original annulus with weight \(\zeta\delta_*^{-24}\) |
| Completed slow \(F,G\), C8 | 152306, 152307 | Actual whole-K annulus at fixed original band |
| Fourth \(F_4,U_4\), ordinary profile C8 | 90 separate rows | Original enlarged profile box |

The root numbers are local to their respective programs. The final directional \(W_{rz}\) covariance norm still requires the moving-frame, stable Volterra and H-inverse recurrences to consume these leaves. The programs do not evaluate the source FTC integrals numerically or instantiate the complete covariance. Final jets 0/67, N7-06 and N8-05 OPEN, RELEASE HOLD.

## Weighted target

The original target constructor uses the complete actual leading \(F_0,U_0,M_0\), all four relevant moment prefixes, the original pressure datum, and both shear terms. An independent lexical replay compared the two resulting raw native target bodies to the actual original applications \(\#623780,\#623787\) in corrected GitHub run 43010593847. The comparison preserves lexical integral binders, native formal/actual arguments, derivative orders, and all source operands. The raw bodies agree up to commutative addition/multiplication and the renaming of bound coordinates.

Write \(y=\log(X/X_a)\), \(d=\log(X_b/X)\), \(\zeta=\exp(-t_1^2/y^2-4/d^2)\) and \(\delta_*=\min(1,y,d)\). The original three-region recipes were executed directly.

- On \(0\le y\le t_1/4\), import the actual inner normal form, including all \(K_a\) kernels, nonlinear moment differences, natural series, and exact activation prefactor \(g_a\). The regular \(g_a b_{\rm in}\) coefficients are differentiated, with no division by the vanishing original Gaussian.
- On \(0\le d\le1/2\), import the actual outer normal form, including the Euler Gamma and nested axial heat integrals. Its \(d^{-3}\) factor and both original components are retained. The original exact \(X_b\) identity verifies that the independently copied outer endpoint equals the actual native source endpoint.
- On \(X_a e^{t_1/8}\le X\le X_b e^{-1/4}\), the exact full target and its native derivatives enter the four-face FTC bound divided by the positive original \(\zeta\). Here \(\zeta^{-1}\le e^{128}\) by the two distance inequalities.

The anchored rectangles overlap. For each of the 36 total-degree-seven profile pairs \((r,e)\) and two components, each region yields one closed positive norm expression. This produces 216 four-face norms. The collar normal forms use the original dominated regularity, with one-sided flat edge derivatives. The native derivative and all FTC face integrals remain in the compressed graph. On \(\delta_*>0\), the retained signed radial Gaussian recurrence, its absolute majorant and unsigned Stirling conversion give profile pole \(3+3r\). Replacing this by \(3+3m\) for each derivative through \(m\) is valid since \(\delta_*\le1\). In particular the C7 row has pole 24. The original smooth flat extensions supply the edge limits.

## Background

The full leading \(F_0,U_0\) including the original heat and I2 source enter the normalized band formula. The C8 computation uses their actual native jets on \([X_a/2,2X_b]\times[-1,1]\). It also keeps the original completed \(F_n,U_n\) at \(n=1,2,3\) and the actual common cutoff factors \(\chi(b_n q)q^{2nh}\). The original source uses the same scale-independent Euler derivative bounds for every positive \(b_n\). They were applied through eight with the exact positive \(h\), including the original flat endpoint. The positive \(q^{2nh}\le1\) is used only for this coarse norm. The whole-K physical bound \(b_n q_{\rm Big}\ge64\) for \(n\ge4\), \(q\ge q_{\rm Big}/64\) supplies exact zero of every later cutoff and all jets on the slab. It does not assert a bound outside that physical slab or at a frozen representative with smaller \(q\).

There are 45 profile derivatives through total degree eight for each of eight native functions. Each of their 360 norm expressions retains the original four anchored FTC faces. The profiles are the same original completed coefficient bodies with their regular Picard jets, preserved moment corrections and flat joins. The leading heat derivative is taken from the nonnegative heat argument, including continuous one-sided endpoint derivatives. The exact source C8 transfer does not construct positive coefficients of order five through eight.

The earlier independent leading recurrence was also run at radial order eight and eta order eight. Its norm arithmetic verifies the same B8, I1, I2 and finite N and retains the full heat debt. It gives the first two optional leading roots in the table. The complete annular \(F_0\) used by the new background program is instead the original native \(F_0\) in the full annular FTC box.

## Fixed slow chart transfer

At the real point \(s=q/Q\in[1/2,2]\) and \(s-T-Z^2s^{2h}=0\), \(|Z|\le\sqrt2\) for \(|\eta|\le1\). On complex \(Z\) perturbations of radius \(1/128\) and a disk for \(s\) of radius \(1/8\) about its actual real value, \(\operatorname{Re}s\ge3/8\) and \(|Z|<2\). The fixed point map in \(s\) is a contraction of constant at most \((1/32)4(8/3)=1/3\), and the shift of its value at the center is at most \(9/128\). Since \(9/128+1/24<1/8\), its iterates give the holomorphic slow coordinate. A common complex polydisc radius \(1/(128R_*)\) in \(R,Z\), at fixed \(T\), also bounds \(|X|=|R^2/(2s)|\le6R_*^2\), \(|\eta|=|Zs^{-D}|\le4\), \(|\log s|\le4\), and both real source field powers \(s^{-A}\), \(s^{-A-1/2}\) by eight in modulus. The complex argument is used only for the slow coordinate and its elementary prefactors.

For a holomorphic chart component bounded by \(C\), Cauchy bounds the sum of all two-variable Taylor coefficient magnitudes of total degree \(j\) by \((j+1)C(128R_*)^j\). Form the positive finite series for perturbations of \(X,\eta,\log q\), with \(\log q=\log Q+\log s\) and \(Q\) held fixed. Compose the real profile derivatives with these positive series. Multiply each term of degree \(m\) by \(m!/(r!\,e!\,k!)\) with \((r,e,k)\) the profile and Euler differentiation orders. This bounds every selected ordinary mixed \(R,Z\) derivative. It preserves the whole-Q chart multiplier and every profile or cutoff Leibniz term, without needing a separate three-dimensional FTC program for each chart coefficient. At \(\eta=\pm1\), take the admitted continuous one-sided profile values. The real heat profile is not analytically continued beyond its physical endpoint.

## Fourth frozen term

The order-four source was generated separately and compared byte-for-byte to the exact earlier N3 prefix through 123,870 nodes. The same native original F4 and U4 produce 90 FTC norms through degree eight, independently of whether an original frozen point admits a fourth coefficient. For \(w=1-b_4q_{\rm frozen}\in(0,1/4]\), the original time cutoff is
\[
 \chi(1-w)=\frac{\exp(-1/(2w))}
 {\exp(-1/(1-2w))+\exp(-1/(2w))}.
\]
On this collar the denominator is at least \(e^{-2}>1/9\). The source numerator derivatives are polynomials in \(w^{-1}\) times the same exponential, with pole at most \(2j\) at order \(j\). Differentiating the reciprocal and multiplying numerator gives the ordinary derivative recurrence. The Euler derivative uses unsigned Stirling numbers for \((s\partial_s)^j\), and the \(q^{8h}\) product uses the exact bound \(8h\le1\). The stored constants \(C_j\) satisfy
\[
 |(\partial_{\log q})^j[\chi(b_4q)q^{8h}]|
 \le C_j q^{8h}\exp(-1/(2w))w^{-2j}.
\]
At \(j=8\), \(C_8=1719897836738458818267\) and the pole is 16. For \(w\le0\) every cutoff derivative is zero. This permits a bounded nonzero fourth contribution at a frozen point if its original window has \(w>0\). It supplies neither the comparison defining the actual \(b_4\) nor a bound for additional frozen orders without their own window proof. In the physical moving frame the frozen \(\lambda_0,c_0,g_0\) are computed from the leading representative fields. The complete positive-order background bound above is used at the live point only.

## Replay

SOURCE is the original checkout with the frozen source runtime. HOSTED is the extracted corrected first-cycle graph from GitHub run 43010593847. THIRD and CORE are the previously pinned third-diagonal-native.json and core-high-norms.json. Run in this directory, or pass the corresponding absolute paths.

```text
node --max-old-space-size=3072 replay_leading_c8.mjs SOURCE leading-c8.json
node --max-old-space-size=3072 replay_target_c7.mjs SOURCE target-c7.json target-c7-graph.jsonl.gz
node --max-old-space-size=3072 replay_background_c8.mjs SOURCE background-c8.json background-c8-graph.jsonl.gz
node --max-old-space-size=3072 replay_frozen_fourth_c8.mjs SOURCE frozen-fourth-c8.json frozen-fourth-c8-graph.jsonl.gz
node --max-old-space-size=3072 check_directional_norms.mjs . HOSTED THIRD CORE directional-norms-readback.json
```

The independent pass checks all 666 original FTC bounds' four-face representation, graph SHA-256 and node counts, raw target semantic equality, and the original shared coefficient prefixes. The scripts write only their named scratch outputs. No Lean theorem was added.
