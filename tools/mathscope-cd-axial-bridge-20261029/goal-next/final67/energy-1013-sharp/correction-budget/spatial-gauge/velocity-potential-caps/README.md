# Active-correction energy from first spatial derivatives

**CONDITIONAL.** Let \(u_j=\operatorname{curl} A_j+B_j\) be the actual
uncut velocity increment and let \(T_j\) be the original stage cutoff
times the outer factors. On the annular radial plateau the spatial
cutoff derivative is axial. The localized velocity is exactly

\[
v_j=T_j u_j+T_{j,z}e_z\times A_j.
\]

This expresses its first spatial derivative using the actual uncut
\(u_j,A_j\) and first derivatives of those fields. It preserves both
the cutoff times velocity derivative and the differentiated cutoff
commutator. The bounds hold in the orthonormal cylindrical frame with
the basis connection included.

The axial cutoff derivative costs \(D=1/2-h\) while the source
spatial derivative cost is \(s_x=1/2+h/2\). The gap \(3h/2\) leaves
a quantified reserve per cutoff derivative. For \(d=\tau_0^h\),
weighted uniform bounds \(U_0,U_1,A_0,A_1\) as defined in the
exact receipt give normalized localized bounds

\[
V=U_0+120d^{3/2}A_0,\qquad
G=U_1+120d^{3/2}(U_0+A_1)+10200d^3 A_0.
\]

Set \(T=2^{-21}X_b^{-2}\tau_0^{-jh/10}\). If \(120d\le 1\)
and the four actual weighted norms are bounded respectively by
\(T/(4\sqrt d)\), \(T/4\), \(T/(480d^2)\) and
\(T/(480d^{3/2})\), then \(\sqrt d V\le T/2\) and \(G\le T\).
The resulting original force ratio is at most
\(28800/2^{42}<2^{-27}\). The transfer and the four cap implications
were checked by exact rational arithmetic and the corresponding
Lean arithmetic lemmas.

**VERIFIED arithmetic.** The directed replay proves \(120d<1\) on
the same original scale and computes positive lower bounds on all
16 cap endpoints. The previously recorded coarse \(K\) upper
exceeds all 16 lower bounds. **OPEN** actual source-bound uniform
stage endpoints. Full final jets still require the other requested
derivatives.

Replay from this directory with the original runtime and historical input.

~~~text
python -B check_velocity_potential_budget.py ../active-correction-bounds/late-spatial-gates.json TRANSFER.json
node evaluate_velocity_potential_caps.mjs GOAL_NEXT ORIGINAL_RUNTIME HISTORICAL_INPUT CAPS.json
~~~
