# Original tangent-frame propagator for modes 3 and 4

## VERIFIED

In the available 166-page manuscript candidate, Proposition 7.2 and Corollary
7.3 on pages 77–80 establish the forward estimate in the two-dimensional
moving tangent frame. Equation (7.18) compares every nonzero integer mode
to the fundamental mode. The manuscript candidate SHA-256 is
\(\mathtt{0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f}\).
The [manuscript provenance](../manuscript-provenance.json) independently
confirms byte equality with the uploaded attachment and the public PDF.

Let \(a=\epsilon k^2|n|^2\) be the original nonnegative damping and
\(M=B_\ell(A_\Phi B-B')\) the actual undamped moving-frame matrix.
Here \(B\) spans \(n^\perp\), \(B_\ell B=I_2\), and \(B'\) is its pulse
derivative. If \(t=Bz\) is the homogeneous zero-normal solution then
\[
 z'=(M-m^2aI_2)z,\qquad M=\operatorname{diag}(\lambda,-\lambda)+E_a.
\]
Indeed \(n\cdot t\) solves \((n\cdot t)'=-m^2a(n\cdot t)\). For a
projected source the same relation holds, since \(n\cdot\Pi f=0\).
Thus initial data in \(n^\perp\) stay there and the actual ambient
inverse restricts to the original moving tangent frame. This is an
estimate for the two-dimensional propagator. In ambient coordinates
on the moving tangent planes, include the factors \(\|B(v)\|\) and
\(\|B_\ell(w)\|\).

Let \(P(v)>0\) be the original envelope with
\((\log P)'=\lambda-a_{\rm ref}\), normalized at \(L_s/2\).
The actual mode-one normalized matrix for \(z/P\) is
\[
 \widetilde M_1=\operatorname{diag}(0,-2\lambda)
             +E_a-(a-a_{\rm ref})I_2.
\]
The source uniform family bounds each entry of \(E_a\) and
\(|a-a_{\rm ref}|\) by \(E/S_\ell\), with \(E=B_{\rm norm}^{256}\).
Its same-label pulse length satisfies \(L_s\le L_{\max}S_\ell\),
\(L_{\max}=2r_0T_g\). Because \(\lambda>0\), the maximum over rows of
the real diagonal entry plus the sum of absolute off-diagonal entries
is at most \(3E/S_\ell\). The upper Dini derivative of
\(\|z/P\|_\infty\) is bounded by this row quantity times the norm.
Integrating for \(0\le w\le v\le L_s\) gives
\[
  \|V_1(v,w)\|_\infty
   \le \exp(3B_{\rm norm}^{256}L_{\max})\, P(v)/P(w).
\]
These constants are retained source expressions. In the original graph
\(B_{\rm norm}\) is #300170, \(E\) is #617292, \(L_{\max}\) is
#300174, and \(L_s\) is #623027. The original fixed thresholds
\(q_\star\) and \(\ell_0\) are #617437 and #617433. Their expression
roots supply exact symbolic constants.

Put \(A_m=M-m^2aI_2\). Direct differentiation with initial value \(I_2\)
at \(v=w\) gives, by uniqueness,
\[
 V_m(v,w)=\exp\!\left(-(m^2-1)\int_w^v a(s)\,ds\right)V_1(v,w).
\]
The scalar identity matrix commutes with every coefficient, so this
argument requires no commutation of matrices at distinct times.
Modes 3 and 4 have the exact extra damping multipliers 8 and 15.
For every nonzero integer \(m\) the scalar factor is at most one,
since \(a\ge0\) and the time interval is forward. The same \(W\)
therefore bounds all those modes in value. It follows from the
uniqueness of the ordered-integral limit and does not require
truncating that series.

The replay checks the original two sign-specific registered normalized
matrices, envelope integral endpoints and bodies, the frame and its
actual pulse derivative, the exact ambient operators, and the original source
operand correspondence for the 20 archived mode-one/two inverses.
The archived matrices are \([[623351,623328],[623332,623352]]\)
and \([[623685,623663],[623667,623686]]\). Their respective envelope
roots are #623389 and #623722. The original producer uses the same
bound recipe at every admitted band, with its own original representative
and frame. This is an analytic source-bound claim. The archive contains
a finite materialized band. Its stable-class test receipt records
426 independent arithmetic checks and explicitly leaves actual private
Forced class attachment unexecuted.
The replay rejects replacing the current's fixed representative with
the exploratory band's representative and replacing the actual harmonic
square with a different mode's square.

## CONDITIONAL

For an actual mode 3 or 4 instance with the same fixed \(n,K,k,\epsilon\),
pulse length, and representative, the preceding source norm applies
to its moving tangent frame. For \(g=-B_\ell\Pi f_m\) with the \(P(w)\)
envelope, Duhamel cancels \(P(w)\) in the denominator and gains at most
\(L_s\). The complete pressure includes \(n\cdot f_m\), with the factor
\(1/(k|m|)\le\sqrt\epsilon\) from the source carrier definition. Fixed
slow derivatives use
\[
 (\partial^\alpha z)'=A_m\,\partial^\alpha z
 +\partial^\alpha g
 +\sum_{0<\beta\le\alpha}\binom{\alpha}{\beta}
       (\partial^\beta A_m)(\partial^{\alpha-\beta}z).
\]
Their zero-data propagator is the same \(V_m\); for pulse derivatives
use the differential equation. Derivatives of \(a\) retain the
coefficient \(m^2\). Thus a fixed finite harmonic set and each fixed
order change derivative constants or powers of \(S_\ell\), while
the value-frame threshold comes from the same finite source
conditions. Complete input \(W_\alpha\) seminorms are a separate
hypothesis. The uniform value bound by itself does not control
arbitrarily many mode derivatives with constants independent of \(m\).

## OPEN

New registered second-stage mode 3 and 4 inverses, their complete
repaired source input definitions, their actual weighted seminorms,
and the second-stage physical residual closure require additional
evidence. The original class attachment filters exactly 20 mode-one/two
systems. It does not provide an executed source-native certificate
for these new registered instances. The manuscript theorem imposes
the stated slow, transverse and shell supports and smooth
enlargement hypotheses. The replay does not supply these for the
repaired second-stage input.

## Replay

Run the following with assertions enabled against the original graph
and Git objects, keeping the adjacent \(\texttt{flat}\),
\(\texttt{flat-palette}\), and \(\texttt{f1-regularity}\) directories.

```text
python check_propagator.py --repo MATHSCOPE_CHECKOUT --graph-dir ORIGINAL_GRAPH_DIRECTORY --output propagator-receipt.json
```
