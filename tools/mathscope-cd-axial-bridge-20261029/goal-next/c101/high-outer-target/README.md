# Native regular outer target through order eleven

The verifier reproduces both complete original C9 Taylor series and their positive moment coefficients. It extends the same calculation to output order eleven, with heat Taylor order twelve entering the original \(K_\delta\) term. It retains the terminal height, the four original \(J_{4,m}\) kernels, their common radial interval, and the axial \(\delta^6\) factor.

The pinned regular factors are #119567 and #119694, attached through the matching same-live outer receipt to source slots #32017 and #32018. For the fixed original terminal boundary the target on \(0<\delta=\log(X_b/X)\le1/2\) has regular coefficient
\[
 \bar b=s^{-A-1/2}(b_\theta,\delta^6 b_z)
\]
after factoring \(e^{-4/\delta^2}\delta^{-3}\). In the original heat distribution differentiation under the \(\Gamma(1+h)\) integral bounds the \(j\)-th derivative by \(h\,j!(j+1)!\) for \(1\le j\le12\). The activation reciprocal remains regular because its opposite square seed is at least \(e^{-16/9}>1/9\). The \(J\) integrands and every differentiated order admit the original exponential domination multiplied by a finite polynomial in the integration variable. Hence the derivative bounds extend inward to \(\delta=0\) and \(\eta=\pm1\) on their respective closed faces.

In original \((\log X,\eta)\) coordinates the two component coefficients before \(R_{\rm env}\) have bit ceilings \(169,210\) through order ten and \(186,232\) through order eleven. Exact directed scale arithmetic evaluates both positive closed upper expressions through order eleven. The pinned chart estimate \(2^{2288}H_c^{168}\) at \(H_c=R_{\rm env}\) then gives \(\|\bar b\|_{C^{11}(R,Z,T)}\le 2^{4096}B_{\rm norm}\) on the original fixed label. This transport uses \(X>1\) on the collar and the usual unsigned Stirling bound for the logarithmic change of variable. The regular factor enclosure is conditional on the original terminal heat and moment identities and the same-live admitted chart. The higher covariance, original FTC face sums and coupled energy require separate verification.

~~~text
node verify_regular_outer_high.mjs GOAL_NEXT ORIGINAL_RUNTIME C100_CHART11_JSON regular-outer-c11.json
~~~
