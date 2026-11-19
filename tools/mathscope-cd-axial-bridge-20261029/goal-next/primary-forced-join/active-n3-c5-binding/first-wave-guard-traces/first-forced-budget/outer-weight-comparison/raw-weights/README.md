# Band and radial weights for the original first Forced source

## VERIFIED

The exact replay uses C90's raw signed monomials, C91's original field envelopes, and C92's geometry and carrier identities. It inventories every one of the 23 original \((R,Z,L)\) derivative orders through total order four. The replay removes \(Y_1\)-mean terms through the original pairing with their \(Y_0\) coefficients. It therefore uses the proven \(L\) derivative of the mean. It replaces Primary ambient \(Y\) derivatives by the transverse branch and adds the one surviving mode-one pulse-time derivative. The exact C91 identity supplies that operation before any absolute bounds are taken.

The mode-one carrier terms are regrouped by the C92 identity. The phase part retains \(bn_r+\varepsilon w(\omega_T-G\omega_Z)+n\cdot\Delta\). The independent conservative term uses only the imaginary \(n\cdot U\), since the original real Primary is tangent to the normal. The other source terms include all original pressure, viscosity, initialized mean and tail operands. The replay counts 2,620 remaining mode-one monomials, 100 mean \(Y_1\) monomials accounted for by their \(L\) pairs, 360 regrouped carrier monomials, and 1,270 mode-two monomials.

## CONDITIONAL

Write \(s=\alpha_R+\alpha_Z\) for a verified derivative direction, and put \(g(d)=e^{-2/d^2}d^{-3/2}\) for \(0<d\le1/4\). The common \(g(d)^m\) is removed in the table's pole column. The source is the raw mode-\(m\) forcing after removing the same pulse factor \(P(w)^m\). The velocity column is for the native first Forced solution divided by its physical \(P(v)\). The original final curl is a subsequent operation.

| Mode | Raw band exponent | Native velocity divided by \(P\) band exponent | Additional pole after \(g^m\) |
| --- | ---: | ---: | ---: |
| 1 | \(67/4+3s\) | \(71/4+3s\) | \(9+3s\) |
| 2 | \(19/2+3s\) | \(10+3s\) | \(9+3s\) |

The ordered variation spends at most two \(S\) powers for each slow derivative moved from the forcing to the frame, projector, or matrix insertions. The original forcing costs three per slow derivative and the original time masses add \(S\) in mode one and \(\sqrt S\) in mode two. Positive \(L\) derivatives act on the already mapped field operands. The mean increment retains its largest actual polynomial band power. The source inequality \(0\le\zeta\le e^{-4/d^2}\) absorbs its entire extra radial pole through 27 at cost \(14!/4^{14}\), already present in the C92 field budget. No derivatives of the affine time shift change the radial distance \(d\) on \(H_w\).

The original outer stress weight is

\[
\zeta=\exp\!\big[-t_1^2/\log(X/X_a)^2-4/d^2\big].
\]

The fixed collar inequalities \(t_1\le1/128\) and \(\log(X/X_a)\ge7/4\) give

\[
g(d)^m\le(100352/100351)^m\,\zeta^{m/2}d^{-3m/2}.
\]

Through order four the raw band powers are at most \(115/4,43/2\) and the native velocity powers at most \(119/4,22\), respectively. The total poles after removing \(\zeta^{m/2}\) are at most \(45/2,24\). These figures retain the original \(k\) and \(\varepsilon\) trade. The Gaussian-rate and pulse-derivative terms have exponent at least \(1/2\). The grouped phase term has exponent at least \(99999/100000\). Every term after regrouping has exponent at least \(49999/100000\). On the original label threshold each final listed band power can be absorbed into \(\varepsilon^{-2^{-20}}\) once, retaining a positive exponent.

On the original directed slab \(q_{\rm Big}/64\le q<q_{\rm Big}/16\), select \(C_F=M=\exp(H/2^{128})\). The C92 field and variation cap includes the normalized Primary, pressure, tail, mean increments and original response masses. The baseline \(b/\varepsilon,RF,G\) is bounded by \(8B_{\rm norm}M\) at the required slow orders. One extra geometry-size factor covers that baseline or \(G\) in \(G\omega_Z\). The source-only logarithm for this expanded geometry, before the separate reference factors, stays below \(H/2^{124}\). The finite reserve \(2^{136}\) covers the explicit reference ratios and fixed-lift factors, carrier bound constants, the ratio converting \(g^m\) to \(\zeta^{m/2}\), and grouped branch and Leibniz counts. Added to the verified conditional field and variation logarithm \(H/2^{109}\), this gives the source-only cap \(\exp(H/2^{108})\). It applies on the same domains and with the same source, positive frame, fixed representative and complete short-path assumptions as the contributing receipts.

## OPEN

The estimates apply to the fixed first Forced source and its native solution on the stated outer collar and directed slab. The remaining domain, final curl and pressure joins, further nonlinear corrections, energy, convergence and final jet comparisons retain their own proof and numerical obligations. `jets 0/67`, `RELEASE HOLD`.

## Replay

```text
python -B verify_raw_weights.py --band FIRST_WAVE_GUARD_TRACES --out NEW_JSON
```
