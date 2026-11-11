# Actual correction cutoff and fourth-stage support on K

**VERIFIED source arithmetic.** The original exact selectors use
\(L_j=\log a_j\), gain \(\gamma_j=jh/20\), and the cutoff-curl
norm roots for all \(m\le j\). The replay reads the first five actual
selector records and each predecessor, including the weighted
functional and potential/velocity operands. It retains the genuine
\(1+\lceil\widehat S\rceil\) and the actual cutoff before curl from
Lemma 5.4 and (9.21). The derivative loss is
\[
\ell'_m=2A+(m+2)(1+3h/2)+(m+1)=2m+4+(5+3m/2)h .
\]

**CONDITIONAL derivative bound.** Where the actual weighted source class
exists, put \(x=\log(1/q)\). For a nonzero selected increment, \(x\ge L_j\).
The derivative of \(t-\log(1+t^2)\) is \((t-1)^2/(1+t^2)\ge0\) for
\(t\ge0\), so \(\log(1+x)\le\sqrt{x}\). The two actual threshold
operands then give
\[
\widehat P\log(1+x)\le\gamma_jx/2,qquad
\widehat C+j\le\gamma_jx/2 .
\]
Using \(\log\widehat C\le\widehat C-1\) in the weighted bound yields
\[
 |T_{a_j} Z_j|_m\le 2^{-j}q^{jh/20-\ell'_m}\qquad (m\le j).
\]
The zero branch and its flat endpoint also satisfy this estimate. These
inequalities compare with a partial sum using the same cutoffs, including
inside the transition of a retained term. Every exponent in the eleven
recorded rows is negative. A uniform slab endpoint follows by substituting
\(q_{\min}=q_{\rm Big}/64\).

**VERIFIED fourth-stage localization.** The original recurrence gives
\(a_4q_{\rm Big}\ge e^4>54\). Hence the possibly nonzero fourth stage
has \(Q=q/\tau_0<16/27\). Since
\(\rho=Q(1-\eta^2)\ge1/2\), it also has
\(\rho<16/27\), \(\eta^2<5/32\) and
\(|z/z_0|=|\eta Q^D|<1/2\). Its radial support is already inside the outer
radial plateau by the original annular radius bound. All fourth-stage
jets are zero outside these spatial plateaus. This removes the fourth
potential's outer axial curl commutator from the **whole-K force**
calculation. The third stage also vanishes for \(q\ge q_{\rm Big}/20\).

The independent symbolic force expansion keeps the time sign and all
three transport differences. On the two spatial plateaus only the
common time cutoff remains. Let \(T_m\) be the sum of the component
tail bounds at derivative order \(m\), and \(M_0,M_1\) be component
bounds on the actual localized base velocity and its gradient. Then
\[
 |\Delta f_i|\le (1+5/\tau_0)T_0+3T_2+T_1
                 +3(M_0T_1+M_1T_0+T_0T_1).
\]
For the fourth-stage-only comparison this bound applies throughout
whole K, including its exact zero regions. The JSON records the
corresponding bounds on kinetic energy, dissipation, force work and
squared force densities. The broader tail of stages 2–4 uses the same
formula on the spatial plateaus. Its axial transition still needs the
gauge-resolved contributions of stages 2 and 3.

**OPEN.** Stage one requires its actual order-two velocity bound.
Original initialization, wave and mean gauge derivatives and the
independent numerical refinements remain required. Whole-K jets remain
0/67. N7-06 and N8-05 remain open.

Run the checker from the branch or an extracted evidence package, with
these inputs:

    python check_cut_correction_tail.py \
      --family <inputs/final-functionals/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json> \
      --chart <whole-k-chart.json> --cutoff first-scale-selector.json \
      --annular ../whole-k-core-force/annular-slow-force-energy.json \
      --shell ../whole-k-selector-scales/n4-inner-shell.json \
      --out cut-correction-tail.json
