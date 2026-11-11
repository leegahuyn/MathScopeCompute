# Low-mode first-Forced cutoff terms in the second source

Let \(g\) be the corrected first-Forced input in a fixed original own
chart. The live second candidate subtracts the original first mapped
terms
\[
 B=(1-\psi(v))\,g,\qquad D=\psi'(v)\,t(v),
\]
componentwise in \(m=1,2\). Here \(g\) includes the full first conservative
nonzero coefficient of \(F[G_0]\) with the original primary principal
tail removed. The independent replay checks that subtraction, the exact
native \(\operatorname{CoupledForced}\) wrapper, the \(H_w\) pullback,
the endpoint substitution, the zero-data solution node and both live
second-source operands. Since \(H_v(Y)=Y\), the remaining-source factor
uses the actual own-chart \(g\) at the endpoint. The projected forcing
of the first ODE is \(-\mathcal P_n g\), with
\(\mathcal P_n=I-nn^\top/|n|^2\).

## Pulse and transverse collars

Write \(x=v/L_s\) and
\(\Psi(x)=\sigma(20x-4)\sigma(16-20x)\). The original smooth step
\(\sigma\) is zero for argument at most zero and one for argument at
least one. At the transition endpoints, all derivatives of its
difference from the corresponding constant vanish. This follows from
the step's defining numerator \(e^{-1/x^2}\) and its complementary
numerator \(e^{-1/(1-x)^2}\), since each derivative is a polynomial in
the inverse distance times the exponential. This statement is about
ordinary jets of the analytic cutoff. The native step interpreter
generates derivatives through order twelve.
Thus \(\Psi=0\) on the two exterior collars \(x\le1/5\) and
\(x\ge4/5\), and \(\Psi=1\) on \(1/4\le x\le3/4\).
\(\psi'(v)=\Psi'(x)/L_s\) has support in
\[
 [L_s/5,L_s/4]\ \cup\ [3L_s/4,4L_s/5].
\]

The actual primary potential has an explicit \(\psi\), transverse
\(\chi_\perp\) and original four-axis slow-cutoff factor in every
summand. Its derivatives supply the full original curl, including its
imaginary remainder. The actual homogeneous pressure retains the same
cutoffs. The primary principal tail retains \(\psi'\), \(\chi_\perp\)
and the same slow product. With the defining functions evaluated on
their original admissible domain, these generators and their ordinary
jets are zero throughout each strict exterior pulse collar and the
strict transverse collar \(|\xi|>3r_0/4\). A term-by-term ideal reduction
then gives \(g=0\) on those collars and keeps the independent mean
and geometry. Hence \(B=0\) on the exterior pulse collars, where
\(1-\psi=1\). Its support is contained in the same two transition
strips as \(D\), because \(1-\psi=0\) on the middle plateau.

The original fixed-label path \(H_w\) preserves \(\xi\) for every
\(0\le w\le L_s\). In the strict transverse collar the complete ODE input
is zero along the whole path. The zero-data solution and the mapped
\(D\) therefore vanish there. In the left pulse collar the forcing has
been zero since \(w=0\), so \(t=0\) there. In the right pulse collar,
\(\psi'=0\) supplies the factor killing \(D\). A nonzero pulse history
can persist there. The strict zero collars leave positive gaps to the
outer guards \(v=0,L_s\) and \(|\xi|=r_0\), giving all zero jets at
those outer guard faces after zero extension. At the inner transition
edges the same zero-jet conclusion through order \(r\) uses the
ordinary \(C^r\) regularity of the other factors on their local
admissible neighborhood.

Fixed labels also prevent a loss from rescaling the pulse cutoff.
Using \(L_s=2r_0/c_i\) and the verified \(v(Y)\),
\[
 D_Y(v/L_s)=T_g^d v_t^\top/(2r_0 D_g),\qquad
 \|D_Y(v/L_s)\|_1 < 972/r_0
\]
for \(0\le d\le4\), since \(T_g<6\), \(D_g>1\), and
\(\|v_t\|_1<3/2\). The map is affine and its higher derivatives vanish.
Also \(1/L_s=c_i/(2r_0)\le1/(128r_0)\) on the original \(\ell\ge8\)
labels. At fixed labels and copies, derivatives of \(\psi\) and
\(\psi'\) in these directions therefore have uniform finite-order
bounds from those of \(\Psi\).

## Slow and shell faces

The four slow factors are flat at their own guard edges. Every derivative
of a primary field through the required order has zero slow seam jets
if the uncut amplitudes and geometric factors admit the corresponding
bounded or controlled-pole extension. The fixed-label \(H_w\) leaves
the slow offsets and shell coordinate unchanged, so this obligation is
along the complete \(w\)-interval. For a slow variable \(z\), the first
forced variation satisfies
\[
 (\partial_z^\alpha t)' =
 M\,\partial_z^\alpha t+
 \sum_{0<\beta\le\alpha}\binom{\alpha}{\beta}
 (\partial_z^\beta M)\,\partial_z^{\alpha-\beta}t+
 \partial_z^\alpha(-\mathcal P_n g),\qquad
 \partial_z^\alpha t(0)=0 .
\]
On a seam where all the required \(g\) jets vanish for every pulse time
and the coefficients are regular with \(|n|^2>0\), induction on
\(|\alpha|\) gives zero \(t\) jets. Pulse and mixed derivatives follow
from the equation to the available order. The corresponding conclusion
with pole bounds needs an estimate for the actual ordered propagator
and its differentiated coefficients. For example, in the scalar model
\(t'=s^{-2}t+e^{-1/s^2}\), \(t(0)=0\), the input is flat in \(s\) but
the solution is \(s^2(e^{(w-1)/s^2}-e^{-1/s^2})\), which diverges as
\(s\downarrow0\) for fixed \(w>1\). The shell version needs the
actual derivative bounds with the factor
\(\sqrt{\zeta}=\exp[-t_1^2/(2s_a^2)-2/s_b^2]\).
This factor absorbs every fixed inverse power of the shell distances
when the other factor has the asserted bound.

The replay establishes actual raw source orders two for primary
velocity, one for primary pressure and zero for the removed tail.
For a \(C^r\) proof of \(g\), the precise remaining input is actual
primary velocity, pressure and tail jets through \(r+2,r+1,r\),
respectively, with the ordinary domain and weight bounds for the
independent coefficients. The archived primary class supplies only
order one in its own namespace. For example,
\(u(s)=(\max(s,0))^{3/2}\) has \(C^1\) zero extension but its interior
second derivative is \(3/(4\sqrt{s})\). A first-order assertion alone
cannot establish the needed viscous source value at a seam. Even a
flat displayed factor is insufficient without control of the
cofactor. For \(s>0\), \(\chi(s)=e^{-1/s^2}\) and
\(a(s)=e^{1/s^2}\) give \(\chi a=1\).

Two further controls distinguish the pulse mechanisms. Taking
\(g\equiv1\) in the scalar model yields \((1-\psi)g=1\) on the exterior
collars, so the complement factor alone gives no localization.
Taking \(t'=g,\ t(0)=0\) with a nonnegative smooth nonzero \(g\)
supported strictly in the left transition produces a positive
constant \(t\) in the right collar. These controls concern the proof
requirements for the actual identities.

## Replay

    python check_low_forced_collars.py --repo REPO --first-dir FIRST --candidate-dir CANDIDATE --official-receipt independent-second-candidates.json --seven-guards seven-guards-receipt.json --out low-forced-collar-binding.json

Use the directories in the replay guide. This replay proves the finite
source and cutoff identities and the conditional vanishing
implications. Uniform all-order analytic joins and global support
remain open.
