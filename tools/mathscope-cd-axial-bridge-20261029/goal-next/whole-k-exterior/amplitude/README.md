# Exact exterior heat amplitude and normalized dyadic scales

The original heat amplitude is strictly positive and admits both source-relative and fixed dyadic bounds. The same replay gives fixed dyadic upper bounds for the normalized energy and force on the previously verified whole-K exterior \(r^2\ge2^{-1024}\). The central cylinder remains open.

## Original terminal amplitude

The original heat and mean-stress compiler roots give
\[
 c_\infty=\frac{E_{\rm tail}X_{\rm tail}^{A}}{1-c_oh},\qquad
 E_{\rm tail}=P_\star e^{L_{\rm start}},\quad
 X_{\rm tail}=X_R e^{y_{\rm start}},\quad A=\tfrac12+h.
\]
The start values come from the original terminal stage in the pinned outer-schedule compiler. Every preceding row adds its exact log-amplitude increment to \(L_{\rm start}\) and its length to \(y_{\rm start}\). The implicit wait contributes \(-Aw\) to the former and \(w\) to the latter. Thus its total contribution to \(\log c_\infty\) is exactly zero. The replay uses the literal stage sequence and checks its algebraic sum. With \(T\) the large fixed original profile parameter,
\[
\begin{split}
 \log c_\infty={}&\log P_\star+A\log X_R-\log(1-c_oh)
 -\tfrac7{10}+\tfrac72h-\lambda+hT-\log2\\
 &+(h-\lambda)(90B_{\rm Outer}+13/\lambda+T_f)
 +4(1-h)\log h.
\end{split}
\]
The matched coefficient is the same as the earlier cell replay, including its factor \(\sqrt2\) from the source compiler's exterior profile.

## Quantitative comparisons

Let \(L_c=\log C_{\rm Selected}\), \(B=\log(1/q_{\rm Big})\), and \(R_*=C12EnvelopeR\). The exact parameter tree has \(P_\star=e^{2T}\), \(X_R=110(C_{\rm Selected}P_\star)^{10}\), \(h=e^{-8002T}\), \(\lambda=e^{-1000T}\), \(B_{\rm Outer}=1000T\), \(T_f=128\), \(c_o=1/256\), and \(T=e^{1048576}+10\). In particular \(0<h<\lambda<1/64\). Since \(\sigma_\star=h^4/2000<1\), the source \(Q\ge P_\star^2\), and
\[
 L_c\ge Q^{200}\ge e^{800T}>123000T.
\]
The last inequality follows from the quadratic term of the positive exponential series and \(T>10\).

For the lower bound, \(A\log X_R>5L_c\). The negative terms in the log-amplitude formula have combined magnitude below \(122008T+144<123000T\). In detail the long slope contribution is bounded by \(90000T+13+128\), the steep power contributes less than \(32008T\), and the remaining negative constants contribute less than \(3\). For the upper bound, discard the negative terms. Use \(A<33/64\), \(\log X_R<10L_c+21T\), \(-\log(1-c_oh)<1\), and \((7/2)h<1\). This gives \(\log c_\infty<(330/64)L_c+13T+2<6L_c\). Thus
\[
 C_{\rm Selected}^{4}<c_\infty<C_{\rm Selected}^{6}.
\]
There is also a fixed but very coarse raw dyadic bracket \(2^{4920000}<c_\infty<2^{2^{N+1}}\), where \(N=2^{2\cdot1048576+26}\). For the upper bound use the exact integer multiplier in \(Q\) to get \(\log Q<64100T\), then \(L_c<2Q^{200}\) and \(6L_c<e^{12820002T}\). The bound \(T<2^{2\cdot1048576+1}\) gives \(\log c_\infty<2^N\). The replay keeps the dyadic exponents symbolic.

For the normalized energy factor \(M=\tau_0^{2A}c_\infty^2\), the original threshold satisfies \(B>2^{23}\) and \(B>512\log R_*\), with \(\log R_*=\exp(25600000L_c)\). Therefore \(\log c_\infty<2^{-31}B\). Since \(1<2A<2\) and \(\tau_0=q_{\rm Big}/32\),
\[
 0<\tau_0^2=2^{-2(\ell_{\min}+15)}
 <M<q_{\rm Big}^{\,1-2^{-30}}<2^{-8388607}.
\]
The lower endpoint is an exact positive dyadic with the original integer exponent. A fixed numerical lower bound for \(M\) would require a certified upper bound on \(\ell_{\min}\), which this replay does not supply.

## Energy and force consequences

On the previously checked annular cell \(r\in[1/4,1/2]\), \(|\zeta|\le1/2\), the normalized endpoint energy \(E^*\), unweighted transverse dissipation \(D_{xy}^*\), and force work \(W^*\) satisfy
\[
 M<E^*<2^5M,\qquad M<D_{xy}^*<2^9M,\qquad M<W^*<2^4M.
\]
The axial dissipation is zero there. These bounds follow from the pinned heat-factor enclosure and the exact time moments in the cell replay. In particular the radial integrals there obey \(1<I_E<4\) and \(4<I_D<64\).

On the verified wider exterior \(r^2\ge2^{-1024}\), the radial heat value obeys \(0<K_{\rm heat}/c_\infty<2^{529}\), \(|\partial_r K_{\rm heat}|/c_\infty<2^{1042}\), and \(|p_{\rm loc}|/c_\infty^2<2^{1058}\). The pressure bound uses the original normalized radial integral. The normalized spatial volume is below \(4\), and the original cutoff lies in \([0,1]\). Hence the endpoint exterior energy is bounded by
\[
 E^*_{\rm ext}<2^{1060}M<2^{-8387547}.
\]

For the original cutoff primitive, the two exponential seed derivatives are bounded by \(2\) and \(36\) in the first two orders, and the denominator is above \(1/9\). Quotient differentiation gives \(|\chi'|<2^6\), \(|\chi''|<2^{14}\). The corresponding radial and axial Laplacian cutoff factors are bounded by \(2^{18}\) and \(2^{18}z_0^{-2}\). In the normalized force \(F^*=\tau_0^{A+1}f\), the heat factors carry \(\sqrt M\) after the time derivative. The axial second derivative adds \(\tau_0/z_0^2=\tau_0^{2h}\le1\). The quadratic pressure and swirl terms are bounded by multiples of \(M\), since \(\tau_0^{1-A}\le1\) and \(\tau_0^{1-A}/z_0=1\). The receipt checks each of the seven term bounds for the exact exterior force
\[
\begin{split}
 f_\theta&=K_{\rm heat}(\partial_t C-\Delta C)-2(\partial_rK_{\rm heat})\partial_r C,\\
 f_r&=C(1-C)K_{\rm heat}^2/r+p_{\rm loc}\partial_r C,\qquad
 f_z=p_{\rm loc}\partial_z C.
\end{split}
\]
These give \(|F^*|<2^{1573}\sqrt M<2^{-4192730}\) pointwise in the verified exterior. The squared time integral of its spatial \(L^2\) norm is below \(2^{3148}M\).

The bounds use the same manuscript exterior identification as the pinned cell and region. No estimate for the central cylinder follows from this exterior bound. The whole-K defect, the full (10.13) comparison, global jet coverage, and N7-06 remain open. RELEASE HOLD.

## Replay

    python work/goal-next/whole-k-prefix/amplitude/check_whole_k_exterior_amplitude.py

The checker reads the original stage compiler from a pinned Git object and uses exact rational and symbolic arithmetic. The repository and both previously checked exterior receipts are read-only inputs.
