# Explicit estimates for a new A.4 outer schedule

## 1. Scope, source and exact parameter order

The source is the user's complete paper with SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The formulas used are A.2–A.31, 4.15–4.16 and Lemma 4.5. We use the
literal smooth step and stage lengths in A.2, including the two pairs of
moment bumps and the terminal wait selected by A.13. We choose the positive
moment bumps to have unit integral in their local logarithmic coordinate:

\[
\beta_c(y)=\frac{10}{3}\sigma'\!\left(\frac{10}{3}(y-c)+\frac12\right).
\]

Their support has width 3/10. A rescaling of these freely chosen bumps
rescales the coefficients and does not change the moment construction.

Use exactly the parameter expressions in the README and the independent
axial receipt. Put B=1000T, so lambda=exp(-B), Tw=60B. In estimates it is
enough to use T>=128, although the actual T is much larger. We frequently
use

\[
0<\lambda<2^{-200},\quad h\le\lambda^8,\quad h e^T<1/192,
\quad 2\lambda(1+60B)<1/2.
\tag{1}
\]

Every expression here is finite. These bounds follow from e^x>=2^x for
x>=0, e^x>=1+x+x^2/2, and monotonicity. No arbitrary cutoff or underflow
is used. Define an error envelope

\[
\epsilon=e^{64T}\lambda^{1/4}=e^{-186T}<2^{-60}.
\tag{2}
\]

The envelope is not an unspecified Cpre. The estimates below give the
individual terms absorbed by it. A scalar check of these absorptions does
not, by itself, prove the differential or integral identities; those
connections are written out here.

The unchanged continuous step certificate gives

\[
\|\sigma'\|_\infty<9,\quad
\|\sigma''\|_\infty<128,\quad
\|\sigma'''\|_\infty<8192.
\tag{3}
\]

Its proof covers whole closed cells and analytic endpoint collars. The
new independent axial check recomputes the first of these bounds.

## 2. Exact function definitions and selection order

The following definitions specify the mathematical candidate, including
the quantities that ordinary floating-point evaluation cannot represent.

1. Integrate `(log E)'=l-1/2` on the prescribed A.2 stages. Initially
   `E=Pstar*f*x^(1/10)` and `U=4*eta`; in the axial stage use the literal
   k(y). The later unedited E schedule is independent of the pulse
   amplitude. Its terminal wait is defined below.
2. On the uniform angular-correction stage solve the actual two equations
   in A.11 in the small coefficient ball described in section 5. This
   fixes E. The pulse changes only U and hence cannot change this choice.
3. At exterior-transition start the exact angular reset gives
   `Q=(lambda-h)/(1-lambda)`. Integrate the scalar Q equation through the
   steepening/hold/flattening stages. With its resulting value Qb and
   the exact positive A.13 integral Qp, take
   `wait=log(Qb/Qp)/(1-h)`. Section 9 proves Qb>Qp. This fixes every
   remaining E stage and the exterior power.
4. On the pulse use `R=Amp*R0+c1*beta1+c2*beta2`, `U=E*R`. For each Amp
   solve the two exact linear continuous moment equations `M=J=0`.
   Their coefficients are affine in Amp. Choose Amp as the unique root
   of the exact scalar S(infinity) equation on [9/10,6/5], as in section 6.
   The entire exterior E, including its wait, is now already fixed.
5. Define the pressure by A.21 with the pressure-neutral E bumps omitted.
   When they are restored their exact pressure increment is zero. Use
   this same axis datum and integrate pressure forward, equivalently
   using the actual complete backward integral.

There is no circular dependence in this order. The exterior E shape and
its wait depend on the exact angular reset and its unchanged endpoint E,
not on Amp. Its total energy contribution enters the scalar Amp equation.
The angular reset itself depends only on the preceding E shapes; those
shapes are independent of the pulse U.

All integrals in these definitions are actual continuous integrals. The
two infinite tails after the power law are elementary convergent
exponentials. Roots can be evaluated by interval bisection/Newton using
the stated separated derivatives. The large exponentials are kept as
expressions and normalized before evaluating the small matrices. This
directory does not claim that such evaluations have already produced a
new B.2/B.8 numerical source chain.

## 3. Reference, first transition and entire axial stage

Write s=eta^2, d=1-s, L=1-2hs, D=1/2-h, A=1/2+h,
f=(1+s)^(-1), J'=2eta/(1+s). The independent derivation proves, on every
y in [0,T] and eta in [-1,1],

\[
Q\ge(\eta^2+e^{-y})/16,\qquad
|N|/E^2\le24|\eta|(1+y),\qquad E^2\ge e^{2T}.
\tag{4}
\]

Consequently with ed=36/Md,

\[
|b_sw|\le768e_d=27/1024<1/32,\qquad
b_s^2/a\le2e_d^2,\qquad a=2.
\tag{5}
\]

These are bounds on the entire region, not just the old failure midpoint.
The exact cone test follows already for XR>=128. On the reference region
Q>1, b=0 and a=4/5. During the first unit transition Q>=1/6, b=0 and
4/5<=a<=2. Thus the two sufficient ratio margins there are at least 4/5
and 2. The final common radial threshold is supplied in section 10.

## 4. Entry and reserved constant-slope interval

At the end of the axial interval the final eleven units have k=0.
The exact average kbar solves kbar'=k-kbar, initially in [0,4]. Thus
`L*kbar <= 4*exp(-11)<1/2`. The entry stage has U=0, b=0 and

\[
Q'+(1-\lambda\sigma)Q=\lambda\sigma W-h+D\eta J',\qquad W\ge1/2.
\]

Variation of constants, e^-1>1/3 and h e^T<1/192 give

\[
Q_{entry}\ge(\eta^2+e^{-T})/64.
\tag{6}
\]

The unedited future pressure obeys `|Pi|<=E^2` and
`|Pi_eta|<=4*abs(eta)*E^2`. Thus the U=0 equation 4.9 has
`|Sn|<=8*abs(eta)*E^2`. Combining (4) with this convolution gives an entry
bound `|N/E|<=128*Pstar*(1+T)*abs(eta)`. Its first eta derivative is bounded
by `1024*Pstar*(1+T)` by differentiating the explicit f and pressure
integrands. The latter estimate is used only as a harmless incoming
envelope, not as a replacement for a sampled derivative.

In the constant-slope interval put alpha=1-lambda, beta=1/2-lambda and
ceta=D*eta*J'. The exact Q source is

\[
\lambda-h+c_\eta-\lambda L\bar k(0)e^{-y}.
\]

It is at least `(lambda+eta^2)/4`, using h<=lambda/4 and D>=49/100.
With (6), variation of constants therefore gives

\[
Q\ge\frac{e^{-T}}{256}
 (\eta^2+\lambda+e^{-\alpha y}).
\tag{7}
\]

Here E=E0*exp(-(1/2+lambda)y), E0<=Pstar, and

\[
|N/E|\le e^{5T}|\eta|(1+y)e^{-\beta y}.
\]

Use `abs(eta)/(eta^2+exp(-alpha*y)) <= exp(alpha*y/2)/2`.
On `0<=y<=60B`, (1) and `1+60B<=exp(T)` give the deliberately generous
uniform bound

\[
|w|\le e^{16T}.
\tag{8}
\]

The same coarse bound holds on the entry stage by (6). Consequently
`(a-2)w^2 <= 2*lambda*exp(32T)<1/4`. The first margin is a>=2; the second
is at least 7/4. The admissible condition holds as soon as l<0. At the
entry's initial endpoint v=2 and the claim is the relaxed condition.

At pulse start, with E=eb*f, the explicit shapes also give

\[
e_b\le e^{2T}\lambda^{30},\quad
\|m(0)\|_{C^1_\eta}\le e^{16T}\lambda^{29},\quad
\left\|S/(Xe_b^2f^2)\right\|_{C^1_\eta}
 \le32(1+T+60B).
\tag{9}
\]

For the last bound, before angular interpolation the normalized negative
energy primitive is independent of eta. Its value is at most
`2*(T+60B+6)` because `exp(lambda+120*lambda*B)<2`.
The positive U^2 primitive has C1 norm at most
`256*exp(-3T+1)<1`: U^2 integrates to at most
`16*eta^2*XR*exp(1+T)`, whereas the current normalizing energy is
`XR*Pstar^2*f^2*exp(3/5-lambda-120*lambda*B)`.
The M and J estimates use their exact exponential weights. Their incoming
normalized C1 factors are at most exp(16T); their decay over 60B has
slopes 1/2-lambda and 1/2-2lambda, both exceeding .49.

## 5. Pressure-neutral angular correction, quantitatively

This correction is selected before Amp. During interpolation
`1+l >= 1-lambda-9/128 > 9/10`, using lambda<=1/100 and log(2)<1.
The scalar ratio r=I/(XH) solves
`r'+(1+l)r=1`. Initially r<=2; hence r<=2 throughout interpolation.
Its eta derivative solves the differentiated equation, with
`|l_eta|<=9/128`; thus `|r_eta|<=1`.

At the first angular bump center, after uniform length `30B-3`, the
normalized I discrepancy and its eta derivative are bounded by

\[
D_I=128\lambda^{29}.
\tag{10}
\]

Indeed the discrepancy is at most 4 before this interval and decays as
`exp(-(1-lambda)*(30B-3))`; `(1-lambda)*30B>=29B` and e^3<32.
The pressure discrepancy is exactly zero before the edit.

For a relative edit E -> E(1+c1*beta1+c2*beta2), normalize both rows at
the first bump center. Let

\[
B(s)=\int_{-3/20}^{3/20}e^{st}\beta_0(t)\,dt.
\]

The exact matrix and only nonlinear row are

\[
L=\begin{pmatrix} B(a)&e^{2a}B(a)\\
2B(b)&2e^{2b}B(b)\end{pmatrix},\quad
a=1-\lambda,\ b=-1-2\lambda,
\]

\[
Q_j=\int e^{b(y-c_{first})}\beta_j(y)^2\,dy.
\]

For lambda<=1/100, `4/5<=B(a),B(b)<=6/5`, e^(2a)>7,
e^(2b)<1/4 and e^(2a)<8. Therefore `|det L|>=216/25`,
`||L^-1||_infinity<=4`, and `sum Qj<=64`.

The exact fixed-point map `c=L^-1(d-Q(c,c))` maps the radius

\[
r_A=1024\lambda^{29}=8D_I
\tag{11}
\]

strictly inside itself, with contraction at most `512*r_A<1/4`.
Differentiating the exact equation bounds the eta derivative by `6D_I`.
Thus the root exists, is unique in this ball, and is smooth in eta.
Its two exact equations are the angular reset and zero total pressure
increment, not numerical residual assignments.

The bump bounds from (3) give
`||beta||<=30`, `||beta'||<=12800/9`, `||beta''||<=8192000/27`.
Consequently the edit is positive and its changes in l and the angular
source are less than lambda/8. All endpoint values and the pressure datum
are unchanged exactly. These inequalities are checked from (11).

## 6. Pulse correction and the actual total S root

For the main shape, the literal A.2 definition gives

\[
0\le R_0\le11,\quad R_0'\le1,\quad |R_0'|\le100,
\quad |R_0''|\le2048.
\tag{12}
\]

For example `|R0''|<=50*9+2*9+11*128=1876<2048`.
The start is flat. The main pulse vanishes for xi>=11, whereas the two
correction bumps are centered at `13/lambda-3` and `13/lambda-1` in y.

Their normalized M,J matrix has rows
`B(si)*(1,exp(2*si))`, with s1=1/2-lambda, s2=1/2-2lambda.
For lambda<=1/100, `9/10<=B(si)<=11/10`. Its determinant magnitude is
at least `3*lambda`; its inverse infinity norm is at most `4/lambda`.
This follows from `exp(2*s1)-exp(2*s2)
 =exp(2*s2)*(exp(2*lambda)-1)>4*lambda`.
The first inverse-row numerator is at most `2*(11/10)*3=33/5`;
the second is at most `2*(11/10)=11/5`. Division by the determinant
lower bound gives the asserted common bound.

The main-pulse normalized moment per unit amplitude is bounded by

\[
\frac{600}{\lambda}e^{-0.98/\lambda}.
\]

The contribution before the pulse has the additional factor
`exp(-.49*(13/lambda-3))` times the incoming C1 bound in (9).
It follows, for each affine coefficient in 1 and Amp, that

\[
\|c_i\|_{C^1_\eta}
\le e^{20T}\lambda^{-2}e^{-0.9/\lambda}
\le e^{-1/(2\lambda)}\le\lambda^{200}.
\tag{13}
\]

The two last inequalities follow already from
`exp(B)>=B^2/2`: `.4*exp(B)>=2020*T` and
`.5*exp(B)>=200000*T`. With (3), their contributions through two xi
derivatives are bounded by lambda^180, including one eta derivative
once `|Amp_eta|<=1`. These corrections make M=J=0 exactly.

Put

\[
K_b=\int_0^{13} e^{-2\xi}R_0(\xi)^2\,d\xi.
\]

Because R0<=xi, Kb<=1/4. On [.02,9], R0>=xi-.02, and exact integration
of that positive polynomial minorant gives Kb>1/5. No numerical
quadrature of R0 is assumed in this bound.

The normalized total S is the actual polynomial

\[
F(Amp,\eta)=Amp^2K_b-(1-e^{-26})/4+\mathcal E(Amp,\eta).
\tag{14}
\]

The pre-pulse term is bounded by (9). The post-pulse normalized energy
and its first eta derivative are bounded by
`256*(Tf+30B+3)`: interpolation decreases the relative shape from f to
1/2, its first derivative is bounded, and the exterior energy bound in
section 9 is at most twice its starting normalization. The angular edit
in (11) changes these bounds by less than their reserved factor of two.
The two U correction supports are disjoint from the main pulse and from
each other. Their energy is quadratic in the affine coefficients, and
its C1 norm in (Amp,eta) is at most `10^6*lambda^401` on the bracket.
Thus an explicit bound is

\[
\|\mathcal E\|_{C^1_{Amp,\eta}}
\le\lambda[32(1+T+60B)+256(T_f+30B+3)]
       +10^6\lambda^{401}
\le e^{20T}\lambda.
\tag{15}
\]

The principal term at Amp=9/10 is below -.047, at Amp=6/5 is above
.038, and its derivative is at least 9/25. The error in (15) is smaller
than 1/1000. The actual F therefore has a unique root on this bracket
with `F_Amp>=7/20`, for every eta. The implicit-function theorem gives

\[
|Amp_\eta|\le3e^{20T}\lambda<1.
\tag{16}
\]

This selects one smooth amplitude function and proves S(infinity)=0
for that function. It does not join independent endpoint solutions.

## 7. Uniform pulse cone estimate

Let R=Amp*R0+the exact end corrections, m=M/(XE), and
beta=1/2-lambda. Its exact equation is `m'+beta*m=R`. Integrating by
parts twice, using flatness at the left endpoint, gives

\[
m=R/\beta-\lambda R_\xi/\beta^2+r_m,
\qquad |r_m|\le65536\lambda^2+e^{16T}\lambda^{29}e^{-\beta y}.
\tag{17}
\]

Here `|R_xixi|<=4096` and beta>=.49; the exact convolution remainder is
at most `lambda^2*||R_xixi||/beta^3`. Also (16) and the differentiated
m equation give `|m_eta|<=exp(24T)*lambda`.

In the Q equation write ceta=D*eta*J' and
`Qinf=(lambda-h+ceta)/(1-lambda)`. Direct substitution of W and U gives

\[
S_q=\lambda-h+c_\eta+
E[-\lambda(2D\eta m+d(m_\eta-J'm))+2h\eta R+dRJ'].
\]

The bracket has absolute value at most 16. At pulse start the exact
constant-slope solution has `|Q-Qinf|<=16*lambda^59`.
Convolution and (9) consequently give

\[
|Q-Qinf|\le e^{4T}\lambda^{30},\qquad
Q\ge(\lambda+\eta^2)/8.
\tag{18}
\]

For N use the exact moment identity 4.16. With s=S/(XE^2),

\[
N/E=-R+(D+c_\eta)m-D\eta m_\eta+\mathcal R_N.
\]

The geometric W correction is at most `2000*E`. The equation
`s'=R^2-1/2+2*lambda*s`, its eta derivative and (9),(16) give
`|s|+|s_eta|<=exp(26T)/lambda` on `0<=y<=13/lambda`.
The whole backward pressure and its derivative are O(E^2) with the
explicit bound in section 11. Thus

\[
|\mathcal R_N|\le e^{28T}E/\lambda.
\tag{19}
\]

The factor `abs(eta)/Q` in the m_eta term is at most `4/sqrt(lambda)`.
Use (17)–(19), `E<=exp(2T)*lambda^30`, `|R|<=14` and `|R_xi|<=128`.
Then, with Rm=Amp*R0 and dm=Amp*R0',

\[
b_s=-R_m+\delta_b,\qquad
w=2R_m-C_d d_m+\delta_w,\qquad
|\delta_b|,|\delta_w|\le\epsilon,
\tag{20}
\]

where the individual errors before their common absorption are bounded
by `exp(32T)*sqrt(lambda)`, plus smaller terms
`exp(31T)*lambda^28`, `exp(18T)*lambda^28`, and `512*lambda`.
Their sum is below (2). In particular this estimate does not replace
`|eta|/(lambda+eta^2)` by an eta-independent constant.

The exact coefficient is

\[
C_d=\frac{\lambda(D+c_\eta)(1-\lambda)}
 {\beta^2(\lambda-h+c_\eta)},\qquad 0\le C_d\le2+32\lambda<201/100.
\tag{21}
\]

Its maximum in ceta>=0 is at zero; use h<=lambda^2 to prove the last
bound. We have `0<=Rm<=14`, `dm<=6/5`, `|dm|<=128`.
Thus the exact unperturbed cross-term maxima are

\[
\sup_{r\ge0}[-2r^2+(603/250)r]=0.727218,
\]

\[
\sup_{r\ge0}[-(7/2)r^2+(603/125)r]
=23.270976/14<1.663.
\]

The first perturbation is at most `315*epsilon`. The second, including
`(a-2)w^2`, is at most `181000*epsilon`; here `|w|<=301` and lambda<=epsilon.
Consequently throughout the pulse

\[
b_sw<3/4,\quad a-b_sw>5/4,\quad
2b_sw+b_s^2/a+(a-2)w^2<7/4.
\tag{22}
\]

Also a=2+2lambda>2, so v>=a>2. This calculation uses the whole shape,
including its descending cutoff and the two exact end corrections.

## 8. Interpolation and corrected angular interval

Now U=M=J=0 exactly. Before the small angular edit
`Sq=-l-h+theta*ceta>=lambda-h`; the bounds in section 5 change this by
less than lambda/8. The inherited Q bound is at least lambda/8.
Since `1+l<=1`, the scalar lower barrier gives Q>=lambda/8 throughout.
The slope range, including the correction, has `2<a<3`.

S(infinity)=0 implies the exact identity

\[
S(X)/X=\frac1{2X}\int_X^\infty E(X')^2\,dX'.
\]

Before release, l<=-lambda/2; the release energy integral has the bound
in section 9. Thus `(|S|+|S_eta|)/X<=8*E^2/lambda`.
The actual angular edit has `|partial_eta log E|<=2`, so the same
estimate includes the corrected intervals. The backward pressure is
bounded by E^2/2 and its derivative by 2E^2 here.
The exact N formula consequently gives `|w|<=128*E/lambda^2`.

At pulse end

\[
E\le e^{2T}\lambda^{30}e^{-13/(2\lambda)}\le\lambda^{100}.
\]

Subsequent E is decreasing (the correction retains l<0). Therefore
`|w|<=128*lambda^98<1/100`. Since b=0 and 2<a<3, the ratio margins
are at least 2 and 19999/10000, respectively.

## 9. Exterior, exact terminal wait, and pressure estimates

At release the exact angular reset and U=M=J=0 give
`Q=(lambda-h)/(1-lambda)`. The first transition and the steep hold
have Q>=lambda/2. Their slopes are at most -lambda and -1, respectively.
Write q=XE^2 relative to its value at release. The first unit contributes
at most 1 to integral q dy; the -1 hold contributes at most 1/2.
After the hold q<=h^8. The following unit contributes at most h^8.
Thereafter l<=-3h/4, and its entire infinite contribution is at most
(2/3)h^7. Hence

\[
\int_{release} XE^2dy\le2X_{rel}e_{rel}^2.
\tag{23}
\]

This proves the concrete release bound used earlier; its constant is
independent of h. Similarly the amplitude at hold end is at most erel*h^6.

For the terminal factor rho=co*h, (3) implies
`fo'/fo<=rho*9/(2*(1-rho))<h/4`. Thus all later slopes are at most
-3h/4. The exact A.13 integral satisfies

\[
c_oh\le Q_p\le32c_oh=h/8.
\tag{24}
\]

For its lower bound, drop the positive integrating-factor excess and
integrate fo'/fo over [1,3]. The upper bound uses e^3<32 and retains the
factor 1/(1-rho); the sharper rational check e^3/(1-rho)^2<32 is included.

At hold end Q>=4(1-h)log(1/h), and the flattening transition loses at
most a factor e. This exceeds 1, hence exceeds Qp. The exact wait
`log(Qb/Qp)/(1-h)` is positive and finite. During the wait Q>=Qp.
On terminal coordinates [0,1/2], A.16 similarly gives Q>=co*h.
No bound is claimed here at the zero-Q endpoint y=3.

Uniformity in eta after release and the exact S identity give

\[
N=2\eta\int_0^\infty[h e^s-A]E(y+s)^2ds.
\]

Since `E(y+s)^2<=E(y)^2*exp(-(1+3h/2)s)`, we obtain
`|N|<=3E^2`. Up to hold end Q>=lambda/2, while after it Q>=co*h.
Thus

\[
|w|\le6e_{rel}/\lambda\quad\hbox{or}\quad
|w|\le768e_{rel}h^5,
\]

respectively. Both are below 1/100 by erel<=lambda^100.
Here b=0 and 2<a<=4, including the first half-unit of the terminal
interval. The two ratio margins are at least 2 and 9999/5000.

## 10. From the ratios to an actual common radial cone threshold

Set `c=1-b*w/a`, `j=w+b/a`, `v=a+b^2/a`. The exact identity is

\[
2c^2-(v-2)j^2=\frac va
 [2-2bw-b^2/a-(a-2)w^2].
\]

Across all the stated stages one can take

\[
c_{min}=1/3,\quad c_{max}=2259,\quad V=116,
\quad g_{min}=1/4.
\]

The pulse is the worst case: |b|<=15, |w|<=301 and 2<a<3.
All other stages have b=0 or the stronger axial bounds. For
`P=p_s,1`, it suffices to have

\[
P\ge\max\{(V+2)/c_{min},8c_{max}V/g_{min}\}<2^{24}.
\tag{25}
\]

Then `Pc>max(v,2)` and
`2(Pc-v)^2-(v-2)Jc^2>0`. This proves the actual cone by Lemma 4.5
when v>2. When v<=2, Pc>2 gives the relaxed cone directly.

Take the inner start xminus=exp(-8). On the reference interval
`XQ/XR>=exp(-8)>3^-8`. The initial stage has `XQ/XR>=1/6`.
On the axial interval the lower bound is e/16. On entry it is e/64.
On the constant-slope interval (7) gives `XQ/XR>=e^2/256>1/64`.
On the pulse and subsequent pre-hold stages `XQ/XR>=1`, since
`lambda*exp(T+2+60B)/8>1`. After the hold, its radial growth contributes
h^-4, so `XQ/XR>=co*h^-3>1`. As L<=1, the simple common choice

\[
X_R\ge2^{40}
\tag{26}
\]

implies P>2^24 throughout this entire finite A.4 interval. The same
argument with a changed reference lower bound treats any other fixed
xminus>0. The later source scaling may increase XR without changing
the pressure datum or any normalized estimates.

## 11. The new A.21 datum and its dependence on h

Omit only the exact pressure-neutral angular edit. Each unedited shape
is `c(y)*f(eta)^theta(y)`, with 0<=theta<=1 and c independent of eta.
The first transition contributes at most `2*Pstar^2*f^2` to integral E^2dy;
the reference contributes exactly `5*Pstar^2*f^2`; the entire subsequent
decreasing tail contributes at most `Pstar^2*f^2`. Consequently

\[
\frac52P_*^2f^2\le-\Pi_0(\eta)\le4P_*^2f^2.
\tag{27}
\]

The unedited later slope is nonpositive in l, including the terminal
factor controlled by (24); this is the step that makes the estimate
uniform even for the very small selected h. Real differentiation under
the integral gives evenness and the strict sign of Pi0' for eta!=0.
Restoring the angular edit retains this exact datum by its second
equation. Pulse edits change only U.

On the strip `|Im z|<=1/16`, `|Re z|<=1`,
`Re(1+z^2)>=255/256`. Thus the common analytic logarithm is defined and
`|f(z)^theta|<=256/255`. The same positive integral estimate at eta=0
gives `|Pi0(z)|<=5*Pstar^2`. Cauchy's estimate on a smaller neighborhood
therefore gives, at every real eta in [-1,1],

\[
|\Pi_0^{(k)}(\eta)|\le5P_*^2 k!32^k.
\tag{28}
\]

For endpoint disks one may enlarge the real projection to
[-33/32,33/32]; the lower real-part estimate and integral bound are
unchanged because the lower bound for |1+z^2| uses only the imaginary
part. This removes an otherwise invalid endpoint use of a truncated
strip. The datum is independent of XR because every integration variable
is global log(X/XR), exactly as in A.21.

## 12. What this does not close

The new choices differ from every previously computed axis datum. This
derivation and its scalar receipt do not certify a new B.2 fixed point,
B.8 same-source matching, the actual incoming C.12 moment discrepancy,
one common global frequency, the A.7 heat modification, or the final
stress factorization and endpoint limits. Those obligations must use
this new pressure and h if this replacement is adopted. The original
acceptance snapshot is not changed. The continuous arguments in this
document are not claimed to have been checked by the Lean kernel.
