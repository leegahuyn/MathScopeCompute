# Original active N3 annular pole absorption and archived frame

The source has \(\zeta=\exp[-t_1^2/d_a^2-4/d_b^2]\), with \(d_a=\log(X/X_a)\), \(d_b=\log(X_b/X)\), and \(\delta_*=\min(1,d_a,d_b)\). The original actual node 3612 is the same-profile parameter \(t_1=C_{\rm Selected}^{-120}\). The extracted stream is the same 21,681,493-node original N3 artifact, authenticated by its uncompressed SHA. The compact readback keeps only 3,121 nodes, the selected rows, and their exact native registry records.

For all actual poles \(18,24,30,36,42\), reduce to pole 42 by \(0<\delta_*\le1\). On an edge where \(\delta_*=d_a<1\), put \(x=1/\delta_*\) and use \(x^{42}\exp(-t_1^2x^2)\). The exact maximum of \(u^{21}e^{-au}\) is \((21/(ea))^{21}\). With \(e>8/3\), its dimensionless prefactor is smaller than the integer 6626158371078869087, which in turn is smaller than \(2^{63}\). The outer edge uses \(a=4\) and is cheaper. Where \(\delta_*=1\), the bound is one. The original midpoint-normalized pulse envelope obeys \(0<P(v)\le1\). Thus

\[
\zeta\,\delta_*^{-b}P(v)<2^{63}t_1^{-42}
<C_{\rm Selected}^{5103}<R_{\rm env}\le B_{\rm norm}\le K.
\]

The \(R_{\rm env}\) comparison uses \(\log R_{\rm env}=C_{\rm Selected}^{25{,}600{,}000}\) and the original \(B_{\rm norm}\) construction includes \(R_{\rm env}^{4096}\). The same-run native roots are \(B_{\rm norm}=14220485\), \(B_m=14220496\), and \(K=18310069\). This replaces the pole and Gaussian in each selected conditional physical derivative by one additional power of \(KS\).

A separate fixed finite dyadic endpoint for the scalar factor is the exact power tree \(2^{2^{2^{2097179}}}\). To check it, the original tree gives \(T=e^{1048576}+10<2^{2097153}\) and
\(\log Q=260\log2+64020T+2\log2000<64100T\).
With \(Q>2\), the original \(\log C_{\rm Selected}<2Q^{200}<2e^{12820000T}\). Therefore the base-two logarithm of \(C_{\rm Selected}^{5103}\) is below \(20412 e^{12820000T}<2^{2^{2097179}}\). This reduction does not evaluate the original norm \(K\), physical band scale or final jet endpoints.

## Archived moving frame

The targeted exact arithmetic independently reconstructs the original positive-sign homogeneous \(B,B_{\rm left},B'\), full moving \(A_\phi\), projected frame matrix, \(d=\varepsilon k^2|n|^2\), and the registered \(M_1\). It checks original \(P\) root 17733391 and the actual integral integrand 17733373, including the literal midpoint. It also reconstructs both selected native Forced matrices \(A_\phi-4dI\) from each row's actual normal and retained cylindrical matrix.

The direct archived equality between the unfrozen homogeneous normal and each frozen native Forced normal remains open. The receipts list the exact formal/actual tuple and unmatched subexpression pairs. The first visible reassociations involve the frozen carrier expressions; the native derivative roots 17788298 and 17766524 are outside the retained narrow slices. The original private-object frame adapter can close this link in a fresh same-family run. The archived readback does not treat identical symbolic matrix recipes as sufficient for that step.

## Replay

~~~sh
python -B extract_slots.py HOSTED/witness original-frame-slots-complete.json
python -B replay_annular_absorption.py TIME/n3-time-carrier-and-physical.json \
  original-frame-slots-complete.json PROFILE/source-profile-data.mjs DEGREE_RUNTIME annular-absorption.json
python -B replay_archived_frame.py original-frame-slots-complete.json \
  GOAL_NEXT/first-force-repair/verify_repaired_first_force.py ORIGINAL_RUNTIME archived-frame.json
~~~

HOSTED is run 43296617887. TIME is continuation34/time-phase. PROFILE is the mathscope-m2/navier directory in the original pinned annular-numeric-24 runtime. DEGREE_RUNTIME is continuation31/segment-fork-control/research-ide. ORIGINAL_RUNTIME is the second-live node fixture research-ide. The completed absorption receipt is annular-absorption-complete.json. The archived result with exact unresolved pairs is archived-frame-substitution-cached.json. The output applies only to the selected source contribution. Final jets remain 0/67 and RELEASE HOLD.
