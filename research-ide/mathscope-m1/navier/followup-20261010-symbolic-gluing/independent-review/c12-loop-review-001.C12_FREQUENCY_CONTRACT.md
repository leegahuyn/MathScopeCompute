# A finite frequency bound for the same C.12 and C.2 operators

## Scope and source

This is a quantitative implication, with a deliberately generous bound.
It replaces an unspecified frequency threshold by
\(N=1+\lceil R^{50}\rceil\), after one specific input profile supplies the
explicit bounds in section 1. It does **not** assert those whole-profile
bounds have already been evaluated. No frequency for the MathScope final
field is issued by the accompanying arithmetic checker.

The source is the supplied paper, SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`,
equations (4.15)-(4.16), (4.20), (4.26), and Appendix C.1-C.3,
pp.28-34 and 158-164. The correction operator is the new continuous
certificate in `attempts/0001/certificate.json`, not an old-datum matrix.
The heat preparation uses I2, whereas this correction uses I1.

## 1. The required numerical envelope

Use the same exact pressure at the axis throughout. Let \(J=[x_-,x_+]\)
start inside the preserved inner collar and end at the right edge of I1.
It contains the compact loop interval \(I\), the bridge to I1, and I1.
The perturbations vanish to the left of \(J\).

For a scalar function define the parameter norm
\[
 |f|_k=\sum_{j=0}^k\frac{\sup|\partial_\eta^j f|}{j!}.
\]
The supremum includes the radial interval, and the periodic phase when
present. This norm is submultiplicative. For vectors, apply it to each
component and take the maximum. Endpoint parameter derivatives are
one-sided. A bound in this norm bounds the second derivative by twice the
bound, not by the bound itself.

One finite real \(R\ge8192\) must bound the following **actual objects**.
An unsupported JSON field saying that these inequalities hold is not
evidence for them.

| Required object | Bound |
| --- | --- |
| Fixed radial range | \(R^{-1}\le x_-\le x_+\le R\) |
| Original profiles and moments | \(|E|_3,|U|_3,|M|_3,|I|_3,|J|_3,|S|_3,|C_p|_3,|\Pi_0|_3\le R\) |
| Reciprocal of the original positive field | \(|1/E|_2\le R\) |
| Original stock vector and comparison shears | \(|p_{s,1}|,|p_{s,2}|,|a_L|,|b_L|\le R\) on \(I\); the same bounds for the unchanged shear on \(J\setminus I\) |
| Actual periodic primitives of C.11 | \(|A|_2,|B|_2\le R\), and \(|D_XA|,|D_XB|\le R\) |
| Four raw cone gaps | Each component of \(\Psi\) below is at least \(R^{-1}\) for the loop on \(I\), and for the unchanged profile on \(J\setminus I\) |
| Exact I1 power-law coefficient | \(|K|_2,|1/K|_2\le R\) |
| Same positive exponent | \(0<\lambda\le2^{-200}\) and \(\lambda^{-1}\le R\) |
| Preserved endpoint and exterior regions | Their common directional margin in (4.26) is at least \(R^{-1}\); positivity and their flat factorizations have already been proved for this same input |

Here
\[
 t=-b/a,\quad v=a+b^2/a,\quad c=p+tq,\quad j=q-tp,
\qquad
 \Psi(a,b,p,q)=(a,\ v-2,\ c-v,\ 2(c-v)^2-(v-2)j^2).
\]
The raw cone bound already gives \(a\ge R^{-1}\). The upper bounds for
\(p_s\) in this table are additional checked inputs; they are not inferred
from the same letter \(R\) bounding the moments.

In the paper's actual geometry \(0<h\le1/100\), \(|\eta|\le1\),
\(A=1/2+h\), \(D=1/2-h\), \(d=1-\eta^2\), and
\(L=1-2h\eta^2\). Thus \(L\ge.98\), \(L^{-1}<2\), \(D\le3\),
and all elementary coefficient bounds used below hold.

The norm of each exact preconditioner is below 7500. The actual disjoint
bumps satisfy \(\beta\le18\), \(|\beta'|\le404\), have unit mass, and
lie in \(9\le X/X_0\le14\). These are the constants proved in the new
continuous certificate. They do not depend on \(R\) or \(\eta\).

## 2. One integer and the actual modulation

Set
\[
 \boxed{N=1+\lceil R^{50}\rceil.} \tag{1}
\]
Use exactly (C.12),
\[
 E_N=E\exp(A(X,\eta,N\log X)/N),\qquad
 U_N=U+B(X,\eta,N\log X)/N.
\]
The phase has no parameter dependence. Since \(N\ge R\), the Banach
algebra exponential estimate gives
\[
 |E_N-E|_2,\ |U_N-U|_2\le4R^2/N. \tag{2}
\]
For example
\(|e^{A/N}-1|_2\le e^{|A|_2/N}-1\le3R/N\).
These are bounds on the actual exponentials, not their linearizations.

The exact shear identities (C.13) give
\[
 |a_N-a_L|\le2R/N,\qquad
 |b_N-b_L|\le9R^2/N<R^3/N. \tag{3}
\]
Here the factor \(e^{-A/N}\) is retained. In particular
\[
 b_N=e^{-A/N}\left(b_L+\frac{2D_XB}{NE}\right).
\]
The \(X\)-derivative of the field change can have order one. No small
radial-derivative premise is used for recovering \(p_s\).

## 3. Continuous moments and stock-vector recovery

The source moment \(S\) is \(\int(U^2-E^2/2)\,dX\).
It is not half of \(\int(U^2-E^2)\,dX\).
On \(J\), length is at most \(R\),
\(\sqrt{2X}\le R\), and \(1/X\le R\).
The bounds on each moment difference, including its parameter norm
through order two, follow from the following actual density identities:
\[
\begin{split}
 \Delta M&=\int\Delta U,\qquad
 \Delta I=\int\sqrt{2X}\,\Delta E,\\
 \Delta J&=\int\sqrt{2X}(E\Delta U+U\Delta E+\Delta U\Delta E),\\
 \Delta S&=\int(2U\Delta U+\Delta U^2-E\Delta E-\Delta E^2/2),\\
 \Delta C_p&=\int(2E\Delta E+\Delta E^2)/(2X).
\end{split}
\]
Since (2) is less than one, each difference is bounded by
\[
 |\Delta m|_2\le20R^5/N<R^6/N. \tag{4}
\]
The same bound holds at every partial integration point, not just at
the right endpoint. The common datum gives \(\Delta\Pi=\Delta C_p\).

For clarity, the algebraic recovery estimate used here can be made
explicit. Suppose profile and moment differences have parameter norm
through order two at most \(\epsilon\le1/(2R)\). Then \(E_{\rm new}\)
remains positive and its pointwise reciprocal is at most \(2R\).
From (4.16), with the original data bounded as in section 1,
\[
 \|\Delta p_s\|_\infty\le R^{11}\epsilon. \tag{5}
\]
A termwise verification uses
\[
 |W|\le8R^2,\quad|\Delta W|\le7R\epsilon,\quad
 |H^{-1}|\le R^2,\quad|H_{\rm new}^{-1}|\le2R^2.
\]
The angular numerator has magnitude at most \(11R\) and change at
most \(11\epsilon\). The reciprocal identity for \(H\) then gives
\(|\Delta Q_s|\le R^8\epsilon\), whence
\(|\Delta p_{s,1}|\le R^{10}\epsilon\).
The axial numerator and the term \(-WU\) give
\(|N_s|\le20R^3\), \(|\Delta N_s|\le R^3\epsilon\);
division by \(LE\) gives a bound below \(R^8\epsilon\) for the second
stock component. The stated power eleven safely covers their maxima.
No derivative in \(X\) of a difference enters these estimates.

Using (2)-(5), the changes in the four coordinates
\((a,b,p_{s,1},p_{s,2})\), compared with the loop on \(I\) and the
original profile elsewhere before the repair, are at most
\[
 R^{18}/N. \tag{6}
\]

## 4. The actual five-component incoming debt at I1

Use the same normalizations as the new certificate:
\[
\left(
 \frac{\Delta M}{X_0K\lambda},\
 \frac{\Delta J/(\sqrt2 X_0^{3/2}K^2)-\Delta M/(X_0K)}{\lambda^2},\
 \frac{\Delta I}{X_0^{3/2}K\lambda},\
 \frac{\Delta S}{X_0K^2\lambda},\
 \frac{\Delta C_p}{K^2\lambda}
\right). \tag{7}
\]
In particular the second row retains \(\lambda^{-2}\).
One may not replace it by a \(\lambda\)-independent inverse estimate.
The parameter norm of each complete row operator in (7) is below \(R^7\),
including the sum of the two terms in its second row. Even using only
that the bump support lies in \(9\le X/X_0\le14\) gives
\(X_0^{-1}\le14R\) and \(X_0^{-3/2}\le196R^2\). The second row is
therefore bounded by \(196R^6+14R^4\le210R^6<R^7\).
Equations (4) and (7), followed by the exact preconditioners, give
\[
 |\hbox{preconditioned debt}|_2\le\beta:=R^{14}/N. \tag{8}
\]
For the certificate's per-derivative convention, each derivative of
order zero, one, or two is at most \(2\beta\).
The choice (1) makes \(2\beta<10^{-8}\).
All products with \(K^{-1}\), including its parameter derivatives, are
included before asserting (8).

The continuous inclusion and derivative estimates of the new certificate
therefore apply to these same actual moment integrals. Starting its
contraction at zero selects the unique smooth branch. Its solution
satisfies
\[
 |z_U|_2,\ |z_E|_2\le8\beta. \tag{9}
\]
To justify scaling the solution by the actual debt, work in the
\(C_\eta^2\) factorial norm itself. On the ball of radius \(2\beta\),
the same triangular map has norm at most
\[
 \beta+(2\beta)/16+4\lambda(B_U+B_E)\beta^2<2\beta
\]
and derivative norm below \(1/8\), using
\(B_U<32768\), \(B_E<16384\), \(\lambda\le2^{-200}\), and
\(2\beta<10^{-8}\). It therefore gives a \(C^2\) root with norm
below \(2\beta\). At every parameter value this lies inside the
original \(10^{-6}\) root box, so pointwise uniqueness identifies it
with the same smooth branch. In particular the more generous (9)
holds. This argument does not infer an \(O(\beta)\) result from
a fixed \(O(\lambda\,10^{-12})\) box error, and it does not replace
the fixed quadratic bounds by the potentially much larger \(R^2\).

Add the prescribed bumps with coefficients \(K\lambda z\), using the
negative of (7) as target. Their physical coefficients have norm below
\(R^{16}/N\). Disjoint supports and the actual width factors give
\[
 |\Delta E_{\rm rep}|_2,\ |\Delta U_{\rm rep}|_2<R^{17}/N,
\quad
 |D_X\Delta E_{\rm rep}|,\ |D_X\Delta U_{\rm rep}|<R^{18}/N.
 \tag{10}
\]
The latter estimate uses \(D_X=x\partial_x\), \(x\le14\), and
\(|\beta'|\le404\). Since the original patch has \(U=0\) and
\(D_XE=-(1/2+\lambda)E\), its actual shear changes are below
\(R^{20}/N\). The positive denominator \(E+\Delta E_{\rm rep}\)
is retained.

The density identities in section 3 apply to every partial repair
integral as well. They bound these partial moment differences by
\(R^{21}/N\). Adding the incoming moments and the changed field
values gives an input error below \(R^{22}/N\) for (5).
Thus throughout the repair patch the four-coordinate error is below
\[
 R^{34}/N. \tag{11}
\]

## 5. A uniform strict cone, including the repair

On a box where all four coordinates have absolute value at most \(2R\)
and \(a^{-1}\le2R\), the sum of absolute first partial derivatives of
each component of \(\Psi\) is at most \(R^{12}\).
One direct calculation puts \(B=2R\), bounds
\[
 |v|,|c|,|j|\le2B^3,\quad
 \|Dv\|_1,\|Dc\|_1,\|Dj\|_1\le4B^4,\quad
 |c-v|\le4B^3,
\]
and obtains \(256B^{10}\le R^{12}\) for the last component.
The other components satisfy smaller bounds.

The source lower bound \(R^{-1}\), (6), and (11) imply that all four
cone gaps after modulation and repair are at least
\[
 R^{-1}-R^{46}/N>1/(2R). \tag{12}
\]
Their coordinates stay in the stated box because the errors are
less than \(1/(2R)\). This proves strictness over the whole affected
interval, rather than at a grid of phase or parameter samples.

At the right edge of I1 the five moments agree exactly. The fields
agree near that edge and afterwards. Lemma 4.4 therefore gives exact
equality of pressure and both stock components there and beyond.
This preserves the earlier heat compensation at I2 and both remaining
reserved patches. The original inner datum and collar have not changed.

For the directional version (4.26), put
\(D_s=|p_s-(a,-b)|\). On the affected interval
\[
 D_s\le8R,\qquad c-v\le32R^3.
\]
Equation (12) and the exact identities in C.3 give
\[
 n_\theta+t_sn_z\ge1/(16R^2),\qquad
 2-\frac{(v_s-2)(n_z-t_sn_\theta)^2}
         {(n_\theta+t_sn_z)^2}\ge1/(2048R^7).
\]
Together with the input collars and unaffected regions, the common choice
\[
 \boxed{\kappa=R^{-10}>0} \tag{13}
\]
therefore satisfies (4.26) on the closed annulus. The first positive gap
also proves the stress does not vanish in its interior.

All constructions are smooth for this one finite \(N\). Higher radial
derivatives may grow with \(N\); finiteness after fixing \(N\) is the
source's assertion, and no uniform bound as \(N\to\infty\) is claimed.

## 6. What this implication does and does not complete

This result has a fully specified frequency and margin **once the same
input supplies an actual certified \(R\)**. The bound includes the
ill-conditioned U moment row, continuous partial moments, the nonlinear
positive denominator, the first repair, and directional normalization.
It can use an exactly represented large number for \(R\); it does not
require converting that number to a machine float.

The arithmetic checker verifies the fixed constants and power
absorptions used by this implication. It cannot establish the bounds in
section 1 merely by accepting a claimed norm in a JSON file. Until an
actual whole-domain envelope and source hashes are attached, N3-06 and
the full-profile gate remain open. In particular no empty entry for
\(R\), no compactness statement without evaluated bounds, and no numerical
sample are treated as the missing input.
