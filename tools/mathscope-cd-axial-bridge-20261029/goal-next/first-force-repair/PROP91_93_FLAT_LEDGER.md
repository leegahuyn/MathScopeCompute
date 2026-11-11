# Proposition 9.1 and 9.3 flat split for the actual second candidate

The repository-pinned 166-page manuscript has SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
Proposition 9.1 and equations (9.1)–(9.2) are on pages 101–102.
Proposition 9.3 and equations (9.3)–(9.6) are on pages 103–105.
The physical steps are described on pages 108–111. The recovered
upload, the repository copy and the public manuscript match this hash.

## Principal identity

Fix one original sign, difference, label, copy and nonzero harmonic \(m\).
Let \(P_m\) denote the old primary principal cutoff tail, and let \(R_{0,m}\)
be the original initialized nonzero conservative coefficient. The repaired
first source satisfies \(g_m=R_{0,m}-P_m\). The original full particular
solution satisfies \(\mathcal L_m(t_{F,m},\pi_{F,m})=-g_m\), including the
normal forcing term in the pressure. In the original fixed path,
\(Q^{1+h}N_{\rm abs}\psi=\partial_v\psi\). Thus the principal product rule
gives
\[
 \mathcal L_m(\psi t_{F,m},\psi\pi_{F,m})
 =-\psi g_m+\psi't_{F,m}.
\]
The actual mapped cutoff residual includes \(+g_m\), which gives the
two directly replayed terms \((1-\psi)g_m+\psi't_{F,m}\).
The Signed increment uses the same homogeneous moving-frame pulse
multiplied by a coefficient constant along the pulse path. Its
principal source is zero and its new principal tail is
\(\psi't_{S,m}\). With the old tail retained once, the linear principal
sum is exactly
\[
 R_{0,m}+\mathcal L_m(\psi t_{F,m},\psi\pi_{F,m})
 +\mathcal L_m(\psi t_{S,m},\psi\pi_{S,m})
 =P_m+(1-\psi)g_m+\psi't_{F,m}+\psi't_{S,m}.
\]
The primary and Signed factors appear only at \(m=\pm1\).
The particular factors appear only at \(m=\pm1,\pm2\).
The source uses the actual conjugate of each positive coefficient.

The exact negative control uses the earlier choice of \(R_{0,m}\) as
the particular input. With that choice, retaining the old tail plus
the corresponding new \((1-\psi)R_{0,m}\) term would leave \(-P_m\)
in the supported residual. Replacing only the recorded remaining
factor by \((1-\psi)g_m\) would leave \(-\psi P_m\).
The actual repaired input removes the cause of either error.

## Supported terms

Let \(r_{F,m}^{\psi}\) and \(r_{S,m}^{\psi}\) denote the curl corrections
after cutting off the potential. The complete amplitudes in the residual
are \(a_{F,m}=\psi t_{F,m}+r_{F,m}^{\psi}\) and
\(a_{S,m}=\psi t_{S,m}+r_{S,m}^{\psi}\). For each increment the retained
linear error is
\[
 \mathcal L_m(r_m^{\psi},0)+
 \mathcal L_m^{\mathrm{rem}}(a_m,\psi\pi_m).
\]
The spatial operators annihilate \(v\) on a fixed original label.
Indeed, \(J^d v_r=\Lambda^d v_r\), \(v_t^\top v_r=0\), and the
slow variables and angle do not enter this fixed-label \(v\).
Consequently \(\psi\) commutes with the spatial curl on this chart.
Proposition 9.1 bounds this entire expression in
\(W_{\alpha+1/2-3\kappa_s}\) on its stated hypotheses. In particular,
if the principal time derivative of \(r_m^{\psi}\) is expanded, any
term \(\psi'r_m\) remains within that bound. The same term could
also be Gaussian-flat. The proposition exhibits a valid additive
split and the intersection of a supported class with the flat class
allows different valid splits.

The exact residual update on page 105 keeps the previous \(F\)
additively and all nonlinear products use the actual fields. Mean–wave
and wave–wave terms, including products with every actual curl or
radial-integral velocity correction, stay in the supported residual.
The linear Temporal and FiveMap increments are angular invariant
and contribute only to mode zero. Their interactions with waves are
already included in the complete velocity products. On the common
ordinary divergence-free domain, the conservative tensor-divergence
form and the manuscript's advective form agree.

The base and stress flat record is mode zero in the original
source. Lemma 8.2 applies to \(f\in M_\alpha\), which is angular
invariant and may vary on the auxiliary torus. Its cutoff remainder
\(A_e f\) is therefore also angular invariant. In the corrected graph
the two Corollary 8.5 cutoff operands, Signed pressure \(A_0\), the
Temporal \(T_1\) cutoff and the FiveMap pressure \(A_0\) are
\(\#4197521,\#4198320,\#4229450,\#4454181,\#4455782\),
respectively. The axial reconstruction \(F_{\rm ax}\) is a fast-time
derivative of the angular-invariant \(T_1\) discrepancy. This operation
preserves mode zero. Retaining or removing already canceled pure-mean
flat terms cannot change the live nonzero source ledger.

## Uniform flatness on the manuscript domain

The direct collar replay places the four principal families in
\(|v-L_s/2|\ge L_s/4\). On the manuscript domain, the fixed-order
physical derivative of each has the bound
\(C Q^{-M}\ell^P e^{-c\ell^2}\) after the \(\sqrt{\zeta}\) weight
absorbs its fixed shell poles. Here \(Q=2^{-\ell}\), \(q/Q\in[1/2,2]\)
and \(c>0\). For every integer \(N\ge0\),
\[
 Q^{-M}\ell^P e^{-c\ell^2}
 \le Q^N
 \exp\!\left(\frac{((M+N)\log 2)^2}{2c}\right)
 \sup_{x\ge0}x^P e^{-c x^2/2}.
\]
The supremum is \(1\) for \(P=0\), and
\((P/(ce))^{P/2}\) for \(P>0\). Thus each fixed derivative is
\(O(q^N)\). A fixed polynomial increase in the number of labels can
be included in \(P\).

This supplies the four-family nonzero flat inventory for the
constructed decomposition of Proposition 9.3. The actual all-order
\(W_\alpha\) input and amplitude estimates, common-domain divergence
identities, cross-label derivative support and smooth zero joins
remain the analytic requirements for the physical global split.
The manuscript's conclusion conditional on those inputs and the
exact finite graph replay have distinct scopes.

## Replay

    python check_prop91_93_flat_ledger.py --repo REPO --first-dir FIRST --candidate-dir CANDIDATE --paper PAPER --source-functionals ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json --official-receipt independent-second-candidates.json --low-receipt low-forced-collar-binding.json --wave-receipt repeat-own-wave-operands-detailed.json --supplemental-receipt supplemental-second-candidates.json --cycle-ledger corrected-cycle-ledger.json --out actual-principal-flat-ledger.json

Use the graph directories in the replay guide. The original recursive
functionals are in the archived source tree for the 67 final jets.
The checker requires the 166-page repository-pinned manuscript and
verifies its SHA-256 before opening the graph.
