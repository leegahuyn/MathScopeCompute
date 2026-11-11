# Actual Gaussian cutoff envelopes in the second source

The independent replay reads both original pulse envelopes from
the 4,682,006-node live second Forced graph. Their exact roots are
\(\#623389,\#623722\). It checks the original fixed representative
operands, the two signs of
\(s(v)=\pm u(1/2+v/L_s)\), the reference damping, and the actual
bound-variable substitution in
\[
 P(v)=\exp\!\left(\int_{L_s/2}^{v}(\lambda(w)-d_{\rm ref}(w))\,dw\right).
\]
It checks 360 scalar slots of the live cutoff ledger, including
zero slots. The mode-one rows contain both first-Forced tails
and the primary and Signed tails. Mode two contains the two
first-Forced tails. Modes three and four have empty cutoff ledgers.

## Fixed Gaussian exponent

The actual roots give \(u=2/\kappa\),
\(L_s=2r_0/c_i\) and \(S_*=\ell^2\). The original
floor for \(i\) and the exact \(c_i=Q^{1+h}T_g^i\)
give \(c_i\le\ell^{-2}\). Thus \(L_s\ge2r_0\ell^2\).
Here \(r_0=2^{-34}\) is the actual source constant.

On \([0,L_s]\), write \(y=|s(v)|\), so that \(y'=u/L_s\),
\(y\ge u/2\), and \(y(L_s/2)=u\). The actual reference growth
minus damping is
\[
 a(y)=\lambda_0(1+y^2)^{-1/2}
       -\lambda_0(1+y^2)(1+u^2)^{-3/2}.
\]
Its derivative in \(v\) is at most
\(-\lambda_0u^2/(L_s(1+u^2)^{3/2})\). In the original regime
\(u\ge2\), the denominator obeys
\((1+u^2)^{3/2}\le(25/16)u^3\le2u^3\).
The derivative is therefore at most \(-\lambda_0/(2uL_s)\).
Both \(\log P\) and its first derivative vanish at \(L_s/2\).
Integrating on either side gives
\[
 P(v)\le \exp\!\left(-\frac{\lambda_0}{4u}
                        \frac{(v-L_s/2)^2}{L_s}\right).
\]
Use the original closed annulus bound
\(\lambda_0\ge R_*^{-31}\), where \(R_*\) is the source
`C12EnvelopeR`. On the support of the cutoff tails,
\(|v-L_s/2|\ge L_s/4\), so the exact common exponent is
\(a=r_0R_*^{-31}/(32u)>0\), giving \(P(v)\le e^{-a\ell^2}\).
The quarter-width exponent and the uniform dyadic Gaussian
inequality were checked on
[GitHub Lean run 43036975763](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43036975763).

## Consequence for the actual tail classes

Given the manuscript's actual \(P(v)\)-weighted derivative bounds
for the four retained sources, Leibniz and the physical coordinate
pullback give a bound of the form \(C Q^{-M}S_*^P e^{-a\ell^2}\)
for each fixed derivative. A fixed polynomial inverse shell loss
can be absorbed by the original \(\sqrt\zeta\), using a positive
term of the exponential series separately at each shell endpoint.
At a point, the checked source cover has at most 32 contributing
signed labels after their derivative support is established.

For any requested physical flatness order \(N\ge0\), the
uniform bound is
\[
 Q^{-M}\ell^{2P}e^{-a\ell^2}
 \le 2^N
    \exp\!\left(\frac{((M+N)\log2+2P)^2}{2a}\right)q^N .
\]
This uses \(Q/2\le q\), \(\log\ell\le\ell\), and the
nonnegative square for \(a\ell^2-K\ell+K^2/(2a)\).
The actual uniform amplitude and forcing seminorms for the
corrected first cycle, the angular-mean flat remainder, and
the final jet intervals remain open.

    python check_repeat_gaussian_tail.py --repo REPO --first-dir FIRST --candidate-dir CANDIDATE --official-receipt independent-second-forced-candidates.json --out repeat-gaussian-tail.json
