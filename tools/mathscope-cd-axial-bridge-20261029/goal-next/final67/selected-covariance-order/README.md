# Selected Wrz derivative audit

The exact audit isolates the next input for the **initial pre-Forced** common-Y angular covariance Wrz_Z5T2. Its leading covariance part needs amplitude slow derivatives through7 and background derivatives through8, together with the independent target/H/y/cutoff primitives. The imaginary covariance is exactly

    -epsilon*Ctheta_Z*(Ctheta_R+a*Ctheta_xi+Ctheta/R).

Its selected seventh derivative contains the potential jets Z6T2, RZ5T2 and xi Z5T2 with exact coefficients -epsilon*(Dr Ctheta+Ctheta/R), -epsilon*Ctheta_Z and -epsilon*a*Ctheta_Z. The original Primary potential is transverse-separable, chi(xi)*C0(R,Z,T,v), so the xi derivative costs its original cutoff derivative and does not add a new slow background order.

The direct source frame inputs are F,FR,GR, HR=p F_R+pz G_R and HZ=p F_Z+pz G_Z. The first two genuinely new slow-eight potential jets therefore reach only three total-nine directions per field:

    R2 Z5 T2,  R1 Z6 T2,  Z7 T2, for both F and G.

They are six selected background jets, rather than a request for an isotropic C9 theorem. The full background is evaluated at the live slow point; its q stays fixed along the original Y-only H_w path. The known live cutoff may exclude all n>=4 there. Frozen leading reference values are separate. Independent weighted target/H/y jets through8 are still required; current C5 target N0..N6 does not imply N7/N8.

The source moving-frame matrix and its exact homogeneous tangent ODE were included in a noncancellation control. With the leading reference held fixed, R=p=pz=1,x0=2,k=4,c=-1,epsilon=1/16 gives

    raw Ctheta(0)=1/8-sqrt(2)/24,
    raw partial_FR Ctheta(0)=0,
    raw partial_v partial_FR Ctheta(0)=1/24-sqrt(2)/144 !=0.

The tangent constraint defect and initial tangency defect are exactly zero. Thus freezing an arbitrary amplitude was not used to produce this response. A positive pulse-independent H normalization cannot remove the whole uncut response: its derivative would first have to vanish from the nonzero initial value, after which the nonzero mixed derivative remains.

This is an **uncut structural control**, not numerical substitution into the fixed original field. The original psi cutoff is flat at v=0. To extend the noncancellation argument to its positive middle support, one uses analyticity of the uncut fixed-slow matrix and ODE parameter response: ntheta=p/R is nonzero, all original normal denominators stay positive, and an analytic response vanishing on an open middle interval would vanish through the pulse. That premise is explicit in the receipt. No actual original ninth derivative is enclosed by the control.

Retaining the original W1 potential weight gives imaginary Wrz an epsilon^(3-kappa_s) envelope. The selected preceding mean path adds epsilon^7, hence epsilon^(10-kappa_s) on the missing directional coefficient envelope. HZ enters n and n_prime with another explicit epsilon; that gain should also be retained. The leading covariance can reuse C8; the extra layer needs actual selected source bounds. A norm-only C8-to-C9 implication is invalid, as checked by omega^-8 sin(omega*((R-R0)+Z+(T-T0))), whose derivatives through8 are bounded by1 but each selected ninth derivative is omega at its center. This is a logical information control, not another MathScope source.

## Full leading C9 is already available

The audit also executes a useful bounded reinterpretation of the existing original leading certificates. `leading-u0-c99.json` retains actualLeadingAllOrderJets(radialOrder9,etaOrder9), covering U0 on all X>=0. `leading-f0-c99.json` uses the same active9x9 norm graph on[0,Xplus], joined to the existing original exterior C10 certificate on[Xplus,infinity], including the terminal heat transition. All12 exterior Git blobs and the common parameter-expression hash are matched.

Their positive expressions3(1+Renv^2/2)(1+U9x9) and3(1+Renv^2/2)(2+Factive9x9) dominate the pointwise leading C9 sup as well as their advertised C8 FTC sums. The exact polynomial dominance is checked. Therefore their existing authenticated directed endpoints can be reused for **pointwise full leading C9** under the original proof and source-transport premises, without another leading compiler. This does not prove literal C9 FTC sums: their mixed faces can require total11, beyond the existing exterior C10.

## Updated covariance is a different input

The fresh post-Signed Temporal covariance includes retained Primary–Forced, Forced-square, old/Forced–Signed and Signed-square terms. The initial selected Wrz leaf cannot be substituted for it. Existing Forced order8 certification asks pulled-back forcing C8 and background C10; these are retained certificate requirements, not sharp necessity claims. An unreduced mode2 input asks prior velocity C9, while mode1 retains velocity C10, mixed slow8+time1, pressureC9 and initialized meanC9. Signed potential C8 additionally asks fresh SigmaC8, H/y/reciprocal jets through8 and target N0..N8. Flux/FTC reductions may lower these counts only after an actual source proof.

No selected positive-order ninth jet, updated stage cap or final gate is closed. N7-06, N8-05, final jets0/67 and RELEASE HOLD remain unchanged. No new artifact was downloaded, no repository/base67 changed and no Lean ran locally.

```text
python -B audit_selected.py GOAL_NEXT C64_MEAN_DIRECTIONAL_JSON NEW_OUTPUT.json
```

Replay requires Python/SymPy and the frozen original Git objects. The final five files are the script, selected-audit.json, replay-log.json, README.md and MANIFEST.json.
