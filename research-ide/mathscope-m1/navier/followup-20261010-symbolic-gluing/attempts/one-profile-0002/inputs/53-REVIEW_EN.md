# Independent analytic review of the actual outer pulse and moment roots

## Conclusion and exact scope

**No blocking analytic defect was found in the revised sections 4–7 of
OUTER_DERIVATION.md.** The argument specifies and controls actual continuous
moment equations for the new parameter expressions. In particular, the
angular correction is a uniform contraction for its actual quadratic moment
map; the pulse corrections solve the actual two linear moment equations;
and the amplitude is the unique root of the actual total-S equation, with
a uniform positive derivative. The pulse cone bounds retain the necessary
loss proportional to one over the square root of lambda.

This conclusion uses the elementary release-energy and backward-pressure
lemmas reviewed separately in independent-postpulse, and the literal
reference/axial estimates reviewed in independent-review-axial. The release
energy estimate needed to select the amplitude depends only on E and its
angular reset. It does not require the amplitude root or S(infinity)=0.
Thus combining these reviews does not introduce a circular proof.

The subject is the finite A.4 outer interval, with its literal radial
schedule and its own A.21 pressure. It is not a proof of the A.7 heat
replacement, a new B.2 infinite axis, B.8 same-source joining, C.12 global
frequency/incoming moments, a completed global profile, or an original
acceptance gate. The continuous argument has not been checked by the Lean
kernel. The separate scalar program is supporting evidence, not the
continuous proof.

## Reviewed revision and sources

The original source is the user-provided complete paper, SHA-256
0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f.
This review read formulas 4.8–4.16 and A.11, A.14–A.20, A.21–A.24,
A.27–A.31, principally the extracted printed pages 26–32 and 131–136.
The normalized formulas agree with the B.35 moment convention: the term
-WU in Ns has no additional division by X.

| Reviewed file | SHA-256 |
| --- | --- |
| OUTER_DERIVATION.md | ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81 |
| check_outer_envelopes.py | b5a84d2408d1acc29c170e97db2a8d79600da93e46c678123f7b6a8547fc6889 |
| outer-envelope-certificate.json | 7da0ae60395cd3a8d2d428546271485daacbb570dd4757e284d7318c25b1a18d |

The producer's 106/106 scalar checks were replayed in memory with bytecode
disabled. The result exactly reproduced the stored JSON and did not alter
the reviewed files. Its field recording an incomplete independent audit
describes the state when that producer receipt was created. This later,
separate review does not rewrite that historical receipt.

The independent review program checks polynomial identities by its own
small exact polynomial ring, evaluates fixed exponential bounds using a
rational Taylor interval with a complete tail, and independently absorbs
the individual pulse error terms. Deliberately incorrect extra-X,
normalization-derivative and leading-coefficient variants are detected.
The execution count and the source hashes are recorded in checks.json.
The analytic connections, endpoint reasoning and integral estimates are
the arguments below; they are not implied merely by that execution count.

## 1. Parameters and order of construction

Use exactly

\[
M_d=2^{20},\quad T=e^{M_d}+10,\quad P_*=e^{2T},\quad
\lambda=e^{-1000T},\quad h=e^{-8002T},\quad
c_o=1/256,\quad T_f=128.
\]

Write B=1000T, alpha=1-lambda and beta=1/2-lambda. For the estimates
T>=128 suffices, while the actual T is larger. In particular,
lambda<2^-200, h<=lambda^8, h exp(T)<1/192 and both pulse moment
slopes 1/2-lambda and 1/2-2lambda exceed .49. The latter statement uses
the actual much smaller bound on lambda; the generic matrix range
lambda<=.01 alone would not imply that the second slope exceeds .49.

These parameters remain positive finite expressions. The proof does not
replace their exponentials by floating-point zero or infinity.

The revised selection order is sound. First determine the unedited E
shapes and solve the angular correction. Its exact reset and unchanged
endpoint E determine the terminal scalar wait and the whole exterior E.
Only then solve the two pulse linear equations for each trial amplitude
and choose the total-S root. Finally use the same pressure-neutral E
construction in A.21. The pulse changes U only. All interval lengths
are independent of eta, including the terminal wait after the exact reset.

The constants below bound maxima of the value and first eta derivative,
as in the source's componentwise C1 convention. Where sums are used,
their additional coefficients are displayed or absorbed explicitly.

## 2. Incoming continuous moments

Set f=(1+eta^2)^(-1), J'=2 eta/(1+eta^2), D=1/2-h,
A=1/2+h, and d=1-eta^2. Then |J'|<=1 and |J''|<=2.
At pulse start let E=eb f and write q_p=X_p eb^2 f^2.
Integrating the literal first, axial, entry and reserved stages gives

\[
q_p=X_R P_*^2 f^2
       e^{3/5-\lambda-120\lambda B}.
\]

The squared-energy primitive divided by q_p is independent of eta before
interpolation: every preceding E has the same factor f. Its absolute
value is at most 2(T+60B+6), since
exp(lambda+120 lambda B)<2.

The other contribution to S is the actual U-squared primitive. Since
|U|<=4|eta| and the last possible nonzero U precedes the end of the
axial stage,

\[
\int U^2\,dX\le16\eta^2X_R e^{1+T}.
\]

After division by q_p, the eta factor is eta^2/f^2. The derivative
of eta^2(1+eta^2)^2 is 2 eta+8 eta^3+6 eta^5, whose absolute value
on [-1,1] is at most 16. As
lambda+120 lambda B<3/5, the normalized positive contribution has
value at most 64 exp(1-3T) and derivative at most
256 exp(1-3T)<1. This proves the generous bound
32(1+T+60B) in the derivation without leaving an unspecified Cpre.

M and J are constant between the end of axial U and pulse start.
Their normalizations XE and XHE grow with slopes beta and
1/2-2lambda during the 60B interval. Thus their decay factors are
lambda^(30-60 lambda) and lambda^(30-120 lambda), both at most
lambda^29. The earlier normalized moments and their eta derivatives
fit within exp(16T). For example, before that long decay
|M|<=4|eta| X_R exp(1+T); the normalized angular dependence is eta/f,
whose derivative has absolute value at most four. For J the earlier
H is bounded by its axial-stage value, and the same eta/f factor
results after normalization. These are actual primitive estimates.

One can also make the coefficient in the incoming Q error explicit.
The reference Q is below seven: in A.25 use L<=1,
eta J'<=1, d<=1, D<=1/2 and h<=.01. During the first transition its
source is at most
(3/5)3+7/100+9/2<7, while the linear coefficient is at least one.
During the axial stage its source is below 4.6. The entry source
remains below one and its linear coefficient exceeds .99. Hence
Q_0<7 at the reserved interval's start. Its exact solution is

\[
Q(y)-Q_\infty=e^{-\alpha y}
 [Q_0-Q_\infty-L\bar k_0]+L\bar k_0 e^{-y}.
\]

Here Q_infinity<1 and L kbar_0<1/2. The absolute sum of these
coefficients is less than nine, and alpha(60B)>=59B. The stated
16 lambda^59 incoming error follows. No eta derivative of this Q
error is used in the subsequent pointwise cone estimate.

## 3. The actual angular correction

The revised interpolation inequality is

\[
1+l\ge1-\lambda-9/128>9/10.
\]

This includes lambda; omitting it would have left an unjustified
transition from a slope estimate to the claimed .9 bound.

The ODE r'+(1+l)r=1 gives r<=2. Before interpolation r is
independent of eta because I and XH share the same f factor.
The differentiated ODE and |l_eta|<=9/128 give |r_eta|<1.
Consequently the value and eta derivative of r-1/alpha are bounded
by four at uniform-interval entry. At the first bump center their
decay is at most exp(3) lambda^29, giving D_I=128 lambda^29.

Let the smooth nonnegative bumps have unit dy integral and width .3.
With B(s)=integral exp(st) beta_0(t) dt, the exact angular matrix is

\[
L_A=\begin{pmatrix}
B(a)&e^{2a}B(a)\\
2B(b)&2e^{2b}B(b)
\end{pmatrix},
\quad a=1-\lambda,\quad b=-1-2\lambda.
\]

The second row has the factor two from differentiating E^2.
The pressure increment equation can be multiplied by a nonzero
constant, but that same normalization must be used in its quadratic
row. The displayed matrix and quadratic row do so. The bumps have
disjoint supports, so no cross quadratic term is missing.

Whole-support bounds 4/5<=B(a),B(b)<=6/5, exp(2a)>7 and
exp(2b)<1/4 give determinant magnitude at least 216/25.
The inverse norm is below four, and the quadratic row norm is
at most 45<64. The resulting map

\[
c=L_A^{-1}(d-Q(c,c))
\]

maps the radius r_A=1024 lambda^29 strictly inside itself:
the center image is at most r_A/2, the nonlinear contribution is
at most 256 r_A^2, and the Lipschitz constant is at most
512 r_A<1/4. This is a contraction for the actual continuous
two-moment map, not a finite set of collocation equations.

The normalized matrix and quadratic row are independent of eta;
the baseline E at this stage is already uniform in eta. Differentiating
the exact equation gives |c_eta|<=6D_I. The field remains positive,
and the bounds on beta, beta', together with this derivative, make
the combined slope and angular-source change smaller than lambda/8.
The edit has exactly zero total pressure increment and fixes the
actual angular moment. No small numerical residual is set to zero.

## 4. Pulse matrix and end corrections

The exact moment weights after division by X_p eb f and
X_p H_p eb f are exp(s_i y), with
s_1=1/2-lambda and s_2=1/2-2lambda. Dividing each row by
exp(s_i c_first) produces rows

\[
B(s_i)(1,e^{2s_i}).
\]

There is no missing lambda factor in these rows: the end bumps
have unit integral in y, not xi=lambda y. The determinant is
B(s_1)B(s_2)(exp(2s_2)-exp(2s_1)). Its magnitude exceeds
3 lambda by the support bounds B>=.9 and
exp(2s_2)(exp(2lambda)-1)>4lambda.

The inverse's first-row numerator is at most
2(11/10)3=33/5, not 22/5. Its second-row numerator is at most
11/5. Hence the corrected row bounds are
(11/5)/lambda and (11/15)/lambda, both below 4/lambda.
This corrects the original arithmetic while preserving the
declared common bound.

The main pulse ends at 11/lambda, whereas the first correction is
centered at 13/lambda-3. Its normalized moment per unit amplitude is
at most

\[
\frac{121}{\lambda}e^{3/2}e^{-.98/\lambda}
 <\frac{600}{\lambda}e^{-.98/\lambda}.
\]

The factor exp(3/2) includes the three-unit center offset; the
independent interval check verifies 121 exp(3/2)<600. Incoming
moments have the additional factor exp(-.49(13/lambda-3)).
Multiplication by the actual inverse therefore gives the affine
coefficient bound

\[
\|a_i\|_{C^1_\eta},\ \|b_i\|_{C^1_\eta}
\le e^{20T}\lambda^{-2}e^{-.9/\lambda}
\le e^{-1/(2\lambda)}\le\lambda^{200},
\quad c_i=a_i+b_i Amp.
\]

The two final absorptions follow from exp(B)>=B^2/2, exactly as
stated in the revised derivation. The main and both correction
supports are disjoint. Once |Amp_eta|<=1 has been obtained below,
the total coefficient derivative is at most 3.2 lambda^200.
The whole-cell beta'' bound and the two xi derivative factors
lambda^-2 give contributions below lambda^180, including that
eta derivative. Before the amplitude root is selected, only
partial derivatives at fixed Amp are used.

## 5. The total-S root and its C1 bound

The literal main shape satisfies 0<=R_0<=11, R_0'<=1,
|R_0'|<=100 and |R_0''|<=2048. For the last bound the
product rule gives
50(9)+2(9)+11(128)=1876.
The start is flat, and R_0 vanishes for xi>=11.

The actual integral K_b is bounded above by the integral of
xi^2 exp(-2xi) over [0,infinity), namely 1/4.
On [.02,9], the exact positive minorant (xi-.02)^2 gives

\[
K_b\ge e^{-.04}\left[
\frac14-e^{-2u}\left(\frac{u^2}{2}+\frac u2+\frac14\right)
\right]>\frac15,\quad u=449/50.
\]

This bound uses integration of a pointwise minorant. It does not
require sampled quadrature to prove an inequality about the actual
smooth step integral.

The normalized total S is exactly

\[
F(a,\eta)=\frac{\lambda S(\infty)}{X_p e_b^2f^2}
=a^2K_b-\frac{1-e^{-26}}4+\mathcal E(a,\eta).
\]

The negative pulse energy term is exact after changing y to xi.
The pre-pulse error is the primitive bound in section 2 above.
For the post-pulse error, q/q_p at pulse end equals exp(-26);
the very large radial factor exp(13/lambda) cancels the corresponding
decay of E^2. During interpolation the relative shape is
(2f)^(-2(1-theta)), at most one, and its eta logarithmic derivative
has magnitude at most two. The tiny angular correction and its
eta derivative leave ample room within the reserved coefficient
256(T_f+30B+3). The release contributes at most twice its starting
q by the independently reviewed E-only release bound.

For the end bumps, at fixed trial a in [.9,1.2] the value and eta
derivative of each c_i are at most 2.2 lambda^200; its a derivative
is at most lambda^200. Since each integral of beta_i^2 is at most
30, their disjoint energy contribution, value plus the two first
partial derivative bounds, is at most

\[
\left[60(11/5)^2+120(11/5)+120(11/5)^2\right]
\lambda^{401}<10^6\lambda^{401}.
\]

The extra lambda is the normalization in F. The absence of an
order-lambda^200 cross term follows from the disjoint supports,
not from a claimed negligible numerical integral.

Thus the actual error has the stated bound

\[
\|\mathcal E\|_{C^1_{a,\eta}}
\le\lambda[32(1+T+60B)+256(T_f+30B+3)]
 +10^6\lambda^{401}\le e^{20T}\lambda<.001.
\]

These are partial derivatives at fixed a. In particular this
estimate does not assume the later bound on Amp_eta.
At a=.9 the principal term is below -.047; at a=1.2 it
is strictly above .038. Its derivative is at least .36.
Therefore F has exactly one zero in this bracket for every eta,
and F_a>=.35 there. The implicit-function theorem gives one smooth
amplitude function with

\[
|Amp_\eta|\le(20/7)e^{20T}\lambda<3e^{20T}\lambda<1.
\]

The finite integrals are smooth in eta; the infinite exterior is
eta-independent before the explicit f normalization and has a
convergent power tail with fixed positive h. Differentiation is
legitimate. The same formulas extend locally past eta=±1,
so there is no omitted endpoint in the implicit-function argument.

## 6. Exact convolution and normalized moment identities

Put R=Amp R_0+end corrections and m=M/(XE).
The exact equation is m'+beta m=R. Integrating its variation-of-
constants formula twice gives

\[
m=R/\beta-\lambda R_\xi/\beta^2+r_m,\qquad
|r_m|\le65536\lambda^2+
e^{16T}\lambda^{29}e^{-\beta y}.
\]

The boundary expression before using flatness is
exp(-beta y)[m(0)-R(0)/beta+R_y(0)/beta^2].
Both R(0) and R_y(0) vanish, including the end corrections.
The integral remainder is bounded by
lambda^2 ||R_xixi||/beta^3, and
4096/(.49)^3<65536. No missing boundary term or first-order
convolution remainder is hidden in this estimate.

The differentiated convolution uses
|R_eta|<=34 exp(20T)lambda and
|m_eta(0)|<=exp(16T)lambda^29. Hence

\[
|m_\eta|\le[1+34/.49]e^{20T}\lambda
 <71e^{20T}\lambda\le e^{24T}\lambda.
\]

Also |m|<=1+14/.49<30. Substituting the actual W and U
in formula 4.9 gives exactly

\[
S_q=\lambda-h+c_\eta+
E[-\lambda(2D\eta m+d(m_\eta-J'm))+2h\eta R+dRJ'],
\quad c_\eta=D\eta J'.
\]

The bracket is bounded by 61 lambda+28h+14<16.
Combining the incoming Q estimate with its positive convolution
gives |Q-Q_infinity|<=exp(4T)lambda^30.
Since c_eta>=.49 eta^2 and h<=lambda/4, the claimed lower
bound Q>=(lambda+eta^2)/8 follows with strict room for this error.

The independent polynomial expansion of formula 4.16 gives

\[
\frac{N_s}{E}=-R+(D+c_\eta)m-D\eta m_\eta+\mathcal R_N,
\]

\[
\mathcal R_N=E\big[
(2D\eta m+d(m_\eta-J'm))R+
(4h\eta+2dJ')s-ds_\eta+
4A\eta\Pi/E^2-d\Pi_\eta/E^2
\big],\quad s=S/(XE^2).
\]

In particular S_eta/(XE^2)=s_eta-2J's; dropping this
normalization derivative would give a different equation.
The exact s equation is s'=R^2-1/2+2lambda s,
and its eta derivative has forcing 2RR_eta.
Using |R_eta|<1, the sum of the two forcing bounds is below
225. Over y<=13/lambda the integrating factor is at most
exp(26). The incoming C1 bound then gives the sufficient estimate

\[
|s|+|s_\eta|\le2926e^{26}/\lambda
 \le e^{26T}/\lambda.
\]

The geometric term in the displayed remainder is at most
61(14)E<2000E. The pressure terms have an absolute coefficient
below seven by the E-only backward-pressure estimate; the s
terms contribute at most 3E(|s|+|s_eta|).
These actual terms are bounded by exp(28T)E/lambda.

## 7. The eta loss and the full pulse cone

Let q_num=lambda-h+c_eta. Direct denominator clearing verifies

\[
\frac{-R+(D+c_\eta)(R/\beta-\lambda R_\xi/\beta^2)}
 {Q_\infty}
=\frac\alpha\beta R-C_d R_\xi,
\quad
C_d=\frac{\lambda(D+c_\eta)\alpha}{\beta^2q_{num}}.
\]

Here alpha/beta=2+lambda/beta exactly. The resulting difference
from 2R is at most 29lambda. Maximizing C_d at c_eta=0,
using h<=lambda^2, gives
0<=C_d<=2+32lambda<2.01.

The potentially largest error has the singular eta factor.
The elementary square identity

\[
(\eta^2+\lambda)^2-4\lambda\eta^2
 =(\eta^2-\lambda)^2\ge0
\]

and Q>=(eta^2+lambda)/8 give
|eta|/Q<=4/sqrt(lambda). Consequently the m_eta contribution
is bounded by 2 exp(24T)sqrt(lambda), rather than an incorrectly
claimed uniform constant times exp(24T)lambda.

For clarity, one independent term-by-term error list is:

| Origin of error in w | Sufficient upper bound |
| --- | --- |
| Replacing alpha/beta by two | 29 lambda |
| Convolution remainder divided by Q | 524288 lambda |
| Incoming mean remainder | 8 exp(16T) lambda^28 |
| eta derivative of m divided by Q | 2 exp(24T) sqrt(lambda) |
| Normalized Ns remainder divided by Q | 8 exp(30T) lambda^28 |
| Replacing Q_infinity by the actual Q | 2400 exp(4T) lambda^29 |
| Replacing R by the nonnegative main pulse | 5 lambda^180 |

For the denominator replacement, the exact leading expression divided
by Q_infinity has magnitude below 300; multiply this by
|Q-Q_infinity|/Q<=8 exp(4T)lambda^29. This prevents an
unstated assumption that the two denominators are equal.

Each listed term is below exp(-190T), by the actual lambda and
T>=128. Their sum is below exp(-186T)=epsilon, since
seven<exp(4T). The independent support program checks these
absorptions individually. The shear identity

\[
b_s=2[-(1/2+\lambda)R+\lambda R_\xi]
\]

likewise gives b_s=-R_main+delta_b with
|delta_b|<=512lambda<epsilon.

For R_main>=0, R_main<=14, d_main<=1.2 and
|d_main|<=128, the exact quadratic maxima in the derivation are
valid even on the descending cutoff: its negative derivative
decreases the cross terms being bounded above. The two maxima are
.727218 and 23.270976/14. Including the stated
315epsilon and 181000epsilon perturbations gives

\[
b_sw<3/4,\quad a-b_sw>5/4,\quad
2b_sw+b_s^2/a+(a-2)w^2<7/4.
\]

The correction supports, startup and final endpoint are included.
No division by eta or 1-eta^2 occurs. At eta=0 the denominator
retains its positive lambda lower bound; at eta=±1 the formulas
remain valid. Since a=2+2lambda>2 on the entire pulse, v>=a>2
there. The conversion of these ratios to the actual cone uses
the separately reviewed common radial threshold, not just a plot
or a pointwise ratio test.

## Reproduction and interpretation

From the research-ide directory in the English distribution:

~~~sh
python3 -B mathscope-m1/navier/followup-20261010-outer-reselection/independent-review-pulse/review_checks.py
~~~

This writes only the review's own checks.json. Its producer replay
is in memory, and it checks the frozen target hashes before and
afterward. The original scratch review is retained separately.

The three revisions requested during review are resolved: the pulse
inverse row numerator is correct, the terminal wait precedes the
total-S root in the dependency order, and interpolation includes
lambda in its lower coefficient bound.

The old Md=1/logP=14 actual counterexample remains valid for that
different datum. The new expression-valued candidate does not reuse
its pressure or axis. None of this review changes the published
historical release, claims a completed global NS construction,
or closes N3 merely because scalar or polynomial checks pass.
