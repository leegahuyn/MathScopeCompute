# Original Forced operator cost on the live slab

The replay evaluates the original amplitude and pressure exponents through order 6. It uses the 20 original systems from the completed first-cycle receipt, C62's same-family threshold relation, and C63's directed local background comparison. Transferring the operator bound to a correction requires that its coefficient and moving-frame paths stay in the original live slab with the original primitive positivity, fixed labels and smooth seams.

Let \(L=\ell_{\min}+15\), \(H=hL\log 2\) and \(W=\exp(3B_{\rm norm}^{256}L_{\max})\). C63 bounds the local background, the other coefficient leaves and the original \(W^8\) operand by \(\exp(H/2^{128})/(64X_b^2)\). The additional fixed factor \(16(4+\sqrt2)^5\) is less than \(2^{128}\le B_{\rm norm}\). The order \(m\le6\) original constructor requires \(C^{m+2}\), so its local proof can use the same \(C^8\) envelope. This gives \(\log K_{\rm loc}<H/2^{128}\) and \(\log W<H/2^{131}\).

For the neighboring labels and both reference pieces, \(\ell\le2L\). On \(L\ge1\), \(\log L\le2(\sqrt L-1)\) follows by integrating \(u^{-1}\le u^{-1/2}\). Thus \(\log(\ell^2)\le6\sqrt L\). The same-family relations \(H>hL/2\), \(B_{\rm norm}>h^{-1}\) and \(L\ge B_{\rm norm}^{512}\) give \(\log(\ell^2)/H<12/B_{\rm norm}^{255}<2^{-128}\). The original pressure reference factor \(2^h\) also costs less than \(H/2^{128}\) in the logarithm.

The original operator coefficient is \(W^{m+1}K^{3p}S^p\), with the additional \(2^h\) for pressure. In units of \(H/2^{131}\) the upper costs are \(m+1+32p\) and \(m+1+32p+8\). The largest cost is 34607 at order 6 for pressure, with \(p=1081\). It is less than \(2^{16}\), so the common operator-only log cost is strictly below \(H/2^{115}\). The original pressure gain \(\sqrt\varepsilon\) is retained. All projected input seminorms, the neighboring input factors and the radial-domain hypotheses still require proof for the active correction.

The fixed pulse path \(H_w\) changes fast coordinates while retaining live slow \(R,Z,T\). The companion Sigma audit reads the leading-only frozen frame operands and the actual mean fluxes. The complete fresh mean budget, full background at an arbitrary frozen point, the three gauge defects and the final correction caps remain open.

Replay with Node, a readable repository containing the pinned original blob, and the original runtime used for C27.

    node verify_local_forced_cost.mjs REPO GOAL_NEXT ORIGINAL_RESEARCH_IDE NEW_OUTPUT.json
