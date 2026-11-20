# Original mode-two gauge for higher Signed pressure

The exact pressure pairing demands 50 ordinary \((R,Z,L)\) directions from 2,970 ordered curl cases. The replay computes the original mode-two forcing for that full set. It keeps the 60 real and imaginary scalars and all 1,270 original monomials. Each monomial contains two Primary velocity factors, at most one raw derivative between them, and at most two geometric factors. The native mode-two forcing has no initialized mean operand. The prior pure \(Z^4\) and \(Z^5\) rows reproduce exactly.

The high mode-two rows use ordinary Primary velocity through ten and its potential through eleven. The replay reconstructs the original matrix and normal derivative recurrence through eleven, reproduces the existing order-eight table, and uses the C104 C13 Primary frame and C17 cutoff budget. The seven geometry tags in the actual monomials are \(\varepsilon\), \(1/R\), the normalized fast radial factor, the three doubled carrier-normal components and \(v_{r,1}\). The fast radial factor retains the original epsilon cost. These bounds use the original positive radii, normal pseudoinverse, and fixed-label carrier and pulse conditions.

The 50 exact ordered state and physical Volterra polynomials retain derivative placement, the number of matrix insertions, simplex factorials and source coefficient powers. The gauge uses the original \(i\psi(v)(n\times t_2)/(2k|n|^2)\). The exact source pulse roots agree in all ten charts for each mode. The original affine source proof gives \(v_R=v_Z=Lv=0\), so these directions leave the fixed-label pulse cutoff \(\psi(v)\) unchanged. The native gauge coefficient includes the original \((2k)^{-1}\) factor explicitly. The cross-product product rule includes both signed terms of each component and every mixed split between \(n\), \(|n|^{-2}\) and \(t_2\).

For the two highest slow directions \((0,9,0)\) and \((1,8,0)\), the normalized mode-two gauge carries \(S^{37}\) and pole 36 after factoring out the two original Gaussian factors. Keeping \(\zeta\) gives outer pole 39 and a conservative inner pole 39. The largest finite coefficient log-rank sum is 54,563, so the coefficient log charge is below \(H/2^{112}\) under the original reference caps. The mode-two tangency gain gives \(\varepsilon^{99999/100000}\) before band and coefficient absorption and \(\varepsilon^{49999/50000}\) after those charges. The inverse carrier is retained in both statements.

The coefficient bounds are conditional on the original same-label admitted smooth charts, positive frame and stable pulse, native tangency identity and radial-envelope transfer. The high mode-one donor, full retained pressure and covariance estimate, global guard seams, \(K_1\), and final jets remain open.

~~~text
python -B verify_forced_mode_two_high.py --goal GOAL_NEXT --frame C104_SELECTED_FRAME_C13 --signed C103_SIGNED_HIGH_UPSTREAM --demand C105_FORCED_GAUGE_DEMAND --out forced-mode-two-high.json
~~~
