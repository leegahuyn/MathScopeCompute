# Whole-K exterior coverage for the original field atoms

The same exterior heat operands as in the pinned annular-cell replay apply throughout the closed part of the original whole-K slab with \(r^2\ge2^{-1024}\). The replay computes all 67 requested original field operand intervals on that region. There are 60 exact zero intervals and seven intervals factored by the positive original heat coefficient and, for the time derivative, the original positive \(h\).

The actual localization threshold contains \((64/h)^2\) and \(R_*^{1024}\), with \(h<1/64\) and \(R_*=C12EnvelopeR\ge1\). Put \(B=\log(1/q_{\rm Big})\). Then
\[
 B>2^{23},\qquad B>\tfrac12 R_*^{1024}\ge\tfrac12+512\log R_*.
\]
The original annulus bound \(4X_b\le R_*^2\) and the whole-K bound \(q<q_{\rm Big}/16\) give
\[
 2qX_b<\frac{q_{\rm Big}R_*^2}{32}
 <\frac{\exp(-(255/256)B)}{32}<2^{-1024}.
\]
The whole region therefore has \(X>X_b\) with strict separation. For every radial point in the normalized pressure tail, \(Z=4\tau/r^2\le2^{1021}q_{\rm Big}<2^{-17}\). The previously checked bounds on \(H,H',H''\) apply throughout. The only change in the interval formulas is the powers of the widened radial interval, using \(s^{-h}\le2^{16}\) and \(s^{-2h}\le2^{32}\) for \(s=r^2\ge2^{-1024}\).

The exterior identification uses the same original Lemma 5.2, Proposition 5.5 and Proposition 9.9 Step 4 as the pinned cell replay. The unresolved part lies within \(r^2<2^{-1024}\), a fraction at most \(2^{-1023}\) of the original spatial cylinder. This is a geometric measure bound. The remaining field and its energy can concentrate there, so no bound on the fraction of unresolved energy follows. The outer-cutoff force on its transition regions is a separate calculation. The complete global jet count remains 0/67, N7-06 remains OPEN, and RELEASE remains HOLD.

Replay from the workspace root:

    python check_whole_k_exterior_region.py --localization-source SOURCE
