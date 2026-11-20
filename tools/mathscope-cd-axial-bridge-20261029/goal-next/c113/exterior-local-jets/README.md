# All 67 original jet labels on the nonzero heat exterior patch

This checks the actual final field on the C109 patch \(4\le r^2/(\tau_0 X_b)\le8\), \(1/4\le z/z_0\le3/8\), \(15/32\le\tau/\tau_0\le17/32\). Proposition 9.9 Step 4 gives zero potential and zero annular corrections there because \(X/X_b>2\). The original radial and axial spatial cutoffs are on their unit plateaux. Retain the original \(C=\chi(\tau/\tau_0)\) and the pressure gauge at radial infinity.

For \(s=r^2\), \(Z=4\tau/s\), \(a=A+1/2\), and \(B=2^A c_\infty\), the local post-cutoff swirl scalar is \(b=BCs^{-a}H(Z)\), so that the velocity is \((-y,x,0)b\). The pressure is
\[
 p=-\frac{B^2}{4A}C s^{-2A}G(Z),\qquad
 G(Z)=2A\int_0^1 v^{2A-1}H(vZ)^2\,dv.
\]
In the pressure integral every larger radius remains in the same exterior. Differentiation at the lower radial endpoint gives \(\partial_s p=(B^2/2)Cs^{-2A-1}H(Z)^2\). The finite jet label conventions and sign of physical time are unchanged. In particular, \(\partial_t b=-\partial_\tau b\).

The 57 potential labels and the three axial-gradient labels of \(b,p\) vanish exactly. The other four labels of \(b\) and three labels of \(p\) have explicit outward enclosures both across the two parts of the seam and at three matching physical points. At the upper point \(r^2/(\tau_0 X_b)=6\), \(z/z_0=5/16\), \(x/r=3/5\), \(y/r=4/5\), the seven inequalities are strict with the original signs. The source normalizations multiply by positive factors displayed in the receipt. Actual parameters such as \(h,X_b,\tau_0,B\) stay symbolic, with their proved bounds.

The radial differentiation identity is checked as a polynomial in \(a,k\) on a formal \(H(Z)=Z^k\). The three weighted derivative evaluation rows for \(k=0,1,2\) have determinant two after factoring \(Z^k>0\). This checks the full linear identity for \(H, ZH',Z^2 H''\). Using \(K\) itself in the scalar instead of \(K/r\) changes the radial derivative coefficient and fails the control. For each even coefficient degree, the original differentiated Laplace representation gives the signed remainder, including the two weighted derivatives. The upper remainder caps for all seven nonzero labels drop by factors greater than 100,000 at degree eight versus degree four. At the upper point 144-bit enclosures are strictly contained in 72-bit enclosures for every nonzero row.

Reducing the original 16 output polynomials with these already localized input jets recovers the three velocity, nine velocity-gradient, one pressure and three force formulas. Gradient rows index velocity components. The polynomial check retains the physical time sign, the cylindrical swirl convection and both radial Laplacian terms.

The results certify normalized jet intervals for this part of the original final field. The interval below the original \(K\) time range is the same defined exterior extension as in C109. The annular jet intervals, independent whole-field tails, and last resolved global time remain open. The final whole-field jet count remains 0/67 and RELEASE HOLD.

~~~text
python -B verify_exterior_local_jets.py --workspace WORKSPACE --goal GOAL_NEXT --out FRESH_OUTPUT.json
~~~
