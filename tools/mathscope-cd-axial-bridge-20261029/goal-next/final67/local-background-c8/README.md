# Actual live-slab slow background bound

The comparison in this packet is **verified** for the three physical live-chart scopes below. The transfer to the original operator estimates and to N7-06/N8-05 is **open**.

## Original inputs

The N3 Primary K is root #18310069 and has 14 literal operands. Its background C8 is #14220496 with children \(B_{\rm norm}\) #14220485, \(C_{\rm slow}\) #14220475, \(8!\), \(L_{\max}\) #14220489 and 2. The 330 literal slow rows consist of 165 multiindices for each of F and G, of total order at most 8. Each row adds an existing leading term and four times its positive slow chart coefficient sum times the normalized finite block #14182092. The global block contains seven original finite rows and the \(1/128\) tail. The replay checks all row shapes and 90 distinct leading leaves and 25,299 distinct chart leaves against the pinned arithmetic frontier. The JSON contains the input digests and every checked row.

The original source chart is \(s=q/Q\in[1/2,2]\), \(X\in[X_a/2,2X_b]\), \(|\eta|\le1\) with its original same-family ordinary interpretation and one-sided physical endpoint where needed. The bound applies to original full F/G and all normalized slow partial derivatives through total order 8. It retains the original leading and coefficient bounds, global nesting, and common selectors.

## Local restriction

The common physical slab has \(q_{\rm Big}/64\le q<q_{\rm Big}/16\), with \(\tau_0=q_{\rm Big}/32\). The exact original selector equalities \(b_4 q_{\rm Big}=64\) and \(b_3 q_{\rm Big}=32\) hold. The series terms carry the original factor \(q^{2nh}\chi(b_n q)\). Each \(n\ge4\) cutoff is flat zero throughout the slab. Each \(n\ge3\) cutoff is flat zero on the N3 chart \(q\ge\tau_0\). The lower N4 chart \(q\le\tau_0\) and the uniform slab bound retain orders 1 through 3. At equality the cutoff and its derivatives through order 8 are zero. The unscaled finite row envelopes are #14177917, #14178851 and #14179740. Every retained normalized row carries its \(q^{2nh}\) gain from the exact source Euler weights. For \(q\le2\tau_0\) and \(n\le3\), we use \(q^{2nh}\le 2\exp(2nh\log\tau_0)\). For \(q\le\tau_0\), the factor 2 can be omitted.

The original \(B_{\rm norm}\) is a sum of nonnegative terms and \(B_{\rm norm}\ge2^{128}\). Since \(L_{\max}=(4+\sqrt2)/2^{33}>2^{-31}\), the literal node \(W=\exp(3B_{\rm norm}^{256}L_{\max})\) gives \(B_{\rm norm}\le W^8\). The \(W^8\) operand is already part of the 14-operand maximum. The comparison takes the maximum of the local slow bound, the other 13 original operand upper endpoints, \(8!\), and 2. It also covers \(L_{\max}<1\). Every physical live-chart scope gives an upper endpoint strictly below the lower endpoint of \(\exp(H/2^{128})/(64 X_b^2)\) with \(H=-h\log\tau_0\). The independent variant using the unscaled first three rows also passes. The JSON records every tested threshold and the comparison sign, where −1 is strict upper-to-lower separation.

## Frozen-point scope

The source moving-frame \(F_0,F_{R,0},G_{R,0}\) evaluates the leading fields at the frozen representative. Any operator argument that evaluates a full-background jet at that representative needs its own support and upper bound. The cover bounds the frozen representative by \(\tau_0/4<q_{\rm rep}<4\tau_0\). Original doubling gives \(b_5q_{\rm rep}>1\), so every \(n\ge5\) term is flat zero there. An N4 representative can fall below \(b_4q_{\rm rep}=1\). The separate trial using four original finite row envelopes and retaining their \(q_{\rm rep}^{2nh}\) gains exceeds the normalized first-stage gate as an upper estimate. The actual frozen n4 upper and the full use of a restricted scalar in the Forced/Signed, Temporal, and FiveMap estimates remain open. The literal global K and the M3, M4, jet and release decisions retain their original values.

## Replay

Run from the working directory that contains the work directory. Choose a new output path.

    node --max-old-space-size=4096 work/goal-next/continuation61/c8-slab/final/verify_c8_slab.mjs work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next work/goal-next NEW_OUTPUT
