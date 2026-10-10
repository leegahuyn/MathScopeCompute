# A quantitative heat compensation for the same new outer profile

## Status and immutable inputs

This note supplies a continuous, all-parameter argument for a **heat-prepared
new outer profile**. It is not a completed inner profile, a full Theorem 4.6
witness, or a new Lean proof. The regular-axis and same-source gluing obligations
remain separate. The formulas below use the actual heat integral and actual
moment integrals, not a zero-residual assignment or endpoint samples.

Sources:

* P: the 166-page user-supplied paper, SHA-256
  `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
  Relevant locations are pp.28-34, (4.15)-(4.30); pp.129-140, Proposition A.4,
  Lemma A.5, Lemma A.6 and Proposition A.7; pp.140-144, Lemmas A.8-A.9 and
  Proposition A.10.
* O: `../followup-20261010-outer-reselection/OUTER_DERIVATION.md`, SHA-256
  `ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81`.
  This fixes the exact continuous A.4 schedule and its reviewed bounds.
* G: `../followup-20261010-symbolic-gluing/attempts/0001/certificate.json`.
  Its exact rational fields certify the continuous bump operator for
  `0 < lambda <= 2^-200`; the present note supplies an actual incoming debt to
  its E-only block. Its hash is recorded by the accompanying checker.

All parameter expressions are those of the new outer tree with SHA-256
`38e23d037f8b75eaeb30448a815689e92171926d47787196c7c5395fe98425a8`:

\[
M_d=2^{20},\quad T=e^{M_d}+10,\quad P_*=e^{2T},\quad
\lambda=e^{-1000T},\quad h=e^{-8002T},\quad c_o=1/256,
\quad X_R\ge 2^{40}.
\]

Thus `T >= 128`, `0 < h <= .01`, and none of these positive numbers is
replaced by machine zero. Bounds below hold for every later exact choice of
`XR >= 2^40`. They do not declare that the final axis/gluing radius has been
selected.

## 1. Exact patch location and normalization

Let `B=1000T`. The start of the constant-slope interval is

\[
X_c=X_R e^{T+2},\qquad
e_c=P_*e^{-T/2-7/10-\lambda/2}.
\tag{H1}
\]

Indeed the first unit transition changes `log E` by `-1/5`, the axial
stage by `-T/2`, and the entry transition by `-1/2-lambda/2`.
Here `integral_0^1 sigma = 1/2` follows from the exact identity
`sigma(1-t)=1-sigma(t)`. This verifies H1 against the literal source schedule.

The second reserved patch has left endpoint

\[
X_* = X_R e^{T+2+60B-20}=X_R e^{60001T-18},\qquad
e_* =e_c e^{-(1/2+\lambda)(60B-20)}.
\tag{H2}
\]

With `x=X/X*`, its unchanged field is

\[
U=0,\qquad E_{cl}=K(\eta)x^{-1/2-\lambda},\qquad
K(\eta)=e_* f(\eta),\quad f=(1+\eta^2)^{-1}.
\tag{H3}
\]

Its logarithmic width is 5. The E-bumps of G are supported in the three
intervals `[11,23/2]`, `[12,25/2]`, `[13,27/2]` in `x`. They are nonnegative,
have unit `dx` integral, are smooth and flat at their endpoints, and have
disjoint supports. The certificate's raw derivative bounds are
`sigma' <= 9` and `|sigma''| <= 101`. The actual unit-mass bump has width
`w=1/2`, so `beta(x)=sigma'((x-left)/w)/w` satisfies
`beta <= 18` and `|beta'| <= 404`.
All supports have `0 < log x < 5`. Neither the first reserved patch nor the
third/fourth reserved patches is edited here.

The exponent in H2 gives `e_* <= 1`. On the complete original schedule after
this patch, `-1 <= l < 0`. Consequently `E_cl` decreases and `X H_cl`
does not decrease. Put `X_K=e^(1/5)X_tail`, `e_K=E_cl(X_K)`, and
`R=X_K/X_*`. The original tail is independent of eta. Since `H_cl` decreases,

\[
R\ge1,\qquad e_K/e_*\le1,\qquad
(e_K/e_*)\sqrt R\le1.
\tag{H4}
\]

In fact the last upper bound could be `1/2`; the weaker version suffices.

## 2. Actual heat replacement and its continuous debt

Use the exact cutoff

\[
\chi_K(y)=\sigma((y-1/5)/(3/10)),\quad
y=\log(X/X_{tail}),\quad Z=2(1-\eta^2)/X,
\]

and define the actual edit

\[
g=\chi_K(y)(H(Z)-1),\qquad E_h=E_{cl}(1+g),\qquad
H(Z)=\Gamma(1+h)^{-1}\int_0^\infty e^{-v}v^h(1+Zv)^{-h}\,dv.
\tag{H5}
\]

It vanishes as an edit for `X <= X_K`, equals the heat factor for `y >= 1/2`,
and is smooth at eta's endpoints because `Z >= 0` and no division by
`1-eta^2` is used. Moreover `0 < H <= 1`, `-1 < g <= 0`, so `E_h > 0`.

For `X >= X_K >= 1`, the actual integral and its differentiated form (A.34)
give

\[
|H'|\le2h,\qquad |H''|\le3h,\qquad
0\le1-H\le3h/X.
\]

For example the sharper first derivative bound is `h(1+h)` and the second
is `h(1+h)^2(2+h)`. Since `|Z_eta| <= 4/X` and `|Z_etaeta|=4/X`,

\[
|g|\le3h/X,\quad |g_\eta|\le8h/X,\quad
|g_{\eta\eta}|\le48h/X^2+8h/X\le64h/X.
\tag{H6}
\]

For `r=2g+g^2`, one has `r_eta=2(1+g)g_eta` and
`r_etaeta=2g_eta^2+2(1+g)g_etaeta`. Hence, for `0 <= k <= 2`,

\[
|\partial_\eta^k(E_h-E_{cl})|\le64hE_{cl}/X,\qquad
|\partial_\eta^k(E_h^2-E_{cl}^2)|\le256hE_{cl}^2/X.
\tag{H7}
\]

The original tail satisfies
`E_cl(X_K x) <= 2 e_K x^(-A)`, `A=1/2+h`: the only extra factor is
`f_o/(1-rho_o) <= 2`. All eta-derivatives of this reference tail vanish.
Differentiation under each improper integral below is justified by H7's
integrable majorants, also at eta's one-sided endpoints.

Let `D_p`, `D_S`, `D_I` be the actual total heat changes in `Cp`, `S`, and
the renormalized angular moment. Since the prescribed `H_pow` is unchanged,
the last change is simply the convergent integral of `sqrt(2X)(E_h-E_cl)`.
For the C2 norm in eta, H7 gives

\[
\begin{split}
\|D_p\|_{C^2}&\le256h e_K^2/X_K,\\
\|D_S\|_{C^2}&\le512h e_K^2,\\
\|D_I\|_{C^2}&\le256e_K\sqrt{X_K}.
\end{split}
\tag{H8}
\]

For clarity, the three integrals used here are bounded by

\[
\begin{split}
128h\int_{X_K}^\infty E_{cl}^2X^{-2}\,dX
 &\le {512h e_K^2\over X_K(2A+1)},\\
128h\int_{X_K}^\infty E_{cl}^2X^{-1}\,dX
 &\le {512h e_K^2\over 2A},\\
64\sqrt2h\int_{X_K}^\infty E_{cl}X^{-1/2}\,dX
 &\le128\sqrt2e_K\sqrt{X_K}.
\end{split}
\]

The last integral uses `integral_1^infinity x^(-1-h) dx=1/h`; its `1/h`
factor cancels the explicit `h` in H7. No tail is discarded. This is why the
small value of h does not destroy the present normalized debt estimate.

Normalize the three debts by `(e_*^2, X_* e_*^2, X_*^(3/2)e_*)`.
Equations H4 and H8 imply a common C2 bound `512/X_*`. The operator G uses
`K=e_* f` instead. Multiplication by `f^-2=(1+eta^2)^2` has C2 operator norm
at most `4+2*8+16=36`; multiplication by `f^-1` has norm at most 8.
Therefore its actual three normalized debt functions obey

\[
\|d_E\|_{C^2}\le 2^{15}/X_*.
\tag{H9}
\]

The M and J heat debts are **identically zero**: both modified regions have
`U=0`. This is an exact identity, not an interval containing zero.

## 3. Existence of one smooth, exact compensating root

Apply G's same-lambda E block to the negative of these heat debts.
Its equation is `A_E z+lambda Q_E(z,z)=d_E/lambda`, with
`delta E=K lambda sum(z_j beta_j)`. The two U rows have zero debt and an
invertible linear U block, so their unique solution is exactly `z_U=0`.

The certified rational constants give

\[
\|R_E\|_\infty<7500,\qquad
\operatorname{Lip}(\Phi_E)<1/16,\qquad
\|R_EQ_E\|<10000.
\tag{H10}
\]

The whole continuous eta interval is covered because its dependence enters
only through the actual smooth debt. Set

\[
q_D={2^{28}\over\lambda X_*}.
\]

Then `||R_E d_E/lambda||_C2 < q_D`, since `7500*2^15 < 2^28`. Further,

\[
q_D\le2^{-12}e^{-59001T+18}<10^{-8}.
\tag{H11}
\]

This is stronger than G's allowed preconditioned debt of `10^-8` at each
eta derivative order 0, 1, 2. G's strict inclusion gives a single root
selected by iteration from zero, not unrelated roots at separate eta values.
The inverse Jacobian and the smooth parameter-dependent implicit function
theorem give smoothness on the closed interval, with one-sided endpoint
derivatives. No definition of the heat integral at negative Z is required.
All fixed higher derivatives are finite; no simultaneous smallness of all
orders is asserted.

The actual root has a sharper size bound than the generic `10^-6` box.
The contraction bound gives `||z||_C0 <= 2q_D`; differentiating the exact
equation gives `||z'|| <= 2q_D`, and differentiating twice gives

\[
\|z''\|\le2(q_D+2\lambda\,10000(2q_D)^2)<4q_D.
\]

Thus for `c=lambda z`,

\[
\|c\|_{C^2}\le B_0:={2^{30}\over X_*}.
\tag{H12}
\]

The corrected profile `E_new=E_h+K sum(c_j beta_j)` now has **exactly** the
same total `S`, `Cp`, and renormalized `I` as O, and unchanged `M,J`.
The three actual integrals are the definitions of the debt supplied to
this root; H9 bounds those same definitions. No computed debt is set to zero.

## 4. Exact equality of the pressure datum

The complete edit has

\[
\int_0^\infty {E_{new}^2-E_{cl}^2\over2X}\,dX=0
\quad\hbox{for every }\eta\in[-1,1].
\tag{H13}
\]

The total `Cp` of O is `-Pi_0(eta)`, with the *same* analytic A.21 datum.
Accordingly

\[
\Pi_{new}(X,\eta)
=\Pi_0(\eta)+\int_0^X{E_{new}^2\over2x}\,dx
=-\int_X^\infty{E_{new}^2\over2x}\,dx.
\tag{H14}
\]

Before the compensation support, the forward pressure is unchanged.
Although the heat factor need only be smooth in eta, it does not alter
the analytic axis datum. H14 applies to this exact heat-prepared outer
profile. A later axis replacement or cone modulation must preserve the
same five moments before H14 can be transferred to that final field.

## 5. Quantitative cone preservation on the entire I2-to-splice interval

We spell out the transfer, because a small total debt alone does not prove
the cone between its two separated supports. Put `Q=Q_s`, `N=N_s`,
`w=N/(EQ)`. All comparisons in this section use the same axis datum.

O gives, from I2 through terminal coordinate `1/2`,

\[
Q\ge h/256,\quad |w|\le e^{16T},\quad |b_s|\le15,\quad 2<a\le4.
\tag{H15}
\]

On the constant-slope patch additionally `Q<=8`, `1/2<=W<=1`.
For the upper Q bound: the reference formula (A.25) is at most 4, its first
transition source is at most 7 with damping at least 1, the axial source is
at most 5, and the next two stages have source at most `.51` and damping
at least `.99`. The scalar barriers give `Q<=8` on I2. The lower bound in
H15 follows from O's constant-stage `e^-T lambda/256`, pulse/interpolation
`lambda/8`, release `lambda/2`, and terminal `h/256` bounds, using
`h<=lambda e^-T`.

### 5a. Inside the compensation patch

Here the heat edit has not started. The bump coefficient bound H12,
`f>=1/2`, `x^(-1/2-lambda)>=1/4`, unit bump masses, and disjoint supports
give the following bounds for every *partial* cumulative integral within
the patch, in C1(eta):

\[
\begin{split}
\|\Delta I\|_{C^1}&\le64 e_*X_*^{3/2}B_0,\\
\|\Delta S\|_{C^1}&\le64 X_*e_*^2B_0,\\
\|\Delta C_p\|_{C^1}&\le64e_*^2B_0.
\end{split}
\tag{H16}
\]

For example `||fc||_C1<=2B_0`, `sqrt(x)<=4`, and the three unit masses give
the first bound. The linear energy terms contribute at most `9B_0` in
their respective normalizations. The quadratic terms contribute at most
`108B_0^2`, since `integral beta^2 <= 18` for each bump. Their sum is below
`64B_0` when `B_0<=1/16`, as follows from the stronger parameter bound
`B_0<2^-10`. Dividing by x in the pressure row only improves this
bound. These arguments cover partial supports, not only the right endpoint.

Let `g_c=Delta E/E_cl`. Then `|g_c|<=72B_0`, and
`E_cl>=e_*/8`. Equations (4.16), with unchanged `M,J,U,W`, imply

\[
|\Delta Q|\le2^{12}B_0,\qquad
{|\Delta N|\over E_{cl}Q}\le2^{20}B_0/h.
\tag{H17}
\]

Indeed the Q numerator changes by at most `96 e_*X_*^(3/2)B_0`;
the denominator is at least `sqrt(2)e_*X_*^(3/2)/8`.
The other denominator change costs `(Q+W)|g_c|<=16*72B_0`.
Division by `1+g_c>=3/4` is absorbed in `2^12`.
For N, the S and pressure terms in (4.16) give `|Delta N|<=384e_*^2B_0`.

Set `epsilon_Q=2^20 B_0/h`. The selected parameters make
`|g_c|<=epsilon_Q<=1/4`; comparison of the two denominators gives

\[
|w_{new}-w_{cl}|\le {2^{54}e^{16T}\over hX_*}
<\epsilon:=e^{-186T}.
\tag{H18}
\]

For the final strict inequality, its ratio to epsilon is at most
`2^14 exp(-51797T+18)<1`. No large exponential is evaluated as infinity.

The operator G also bounds `|Delta a|<=lambda/4`. Since `z_U=0`,
`b_s=0` exactly on I2. Consequently

\[
7\lambda/4\le a_{new}-2\le9\lambda/4,\qquad
(a_{new}-2)w_{new}^2\le9e^{-968T}<1/4.
\tag{H19}
\]

Thus both sufficient ratio inequalities of Lemma 4.5 hold there, with
strict `v_s=a_new>2`.

### 5b. After I2 and before the heat switch

The values of E and U are unchanged here. The cumulative differences
are the negatives of H8's full heat debts, because the preceding bumps
cancel them exactly. The monotonicity of `XH_cl`, H4, and (4.16) give

\[
|\Delta Q|\le2^{10}/X_*,\qquad
{|\Delta N|\over E_{cl}Q}\le2^{19}/X_*,\qquad
|\Delta w|\le {2^{21}e^{16T}\over hX_*}<\epsilon.
\tag{H20}
\]

For the middle bound, directly
`|Delta N|<=2048h e_K^2/X` for `X<=X_K`; divide by `EQ>=Eh/256`
and use `E>=e_K`, `e_K<=1`, `X>=X_*`. The first uses
`XH>=e_*X_*^(3/2)/sqrt(2)` and `||D_I||_C1<=256e_K sqrt(X_K)`.

The profile shears have no change on this interval. The first ratio margin
loses at most `15 epsilon`. The second loses at most
`30 epsilon+4e^(16T)epsilon+2epsilon^2<1/8`. O's second margin was at least
`1/4`, so at least `1/8` remains throughout this whole interval, including
the pulse and its exact end corrections.

### 5c. The actual heat splice, 1/5 <= y <= 1/2

Use backward moment differences, integrating from the current X to
infinity; total differences are zero. H8 then holds locally with
`X_K,e_K` replaced by `X,E_cl(X)`. The reference tail is eta-independent,
`h/256<=Q<=h/8`, and the reference slope is exactly `l=-h` here.
Equations H6 and (4.16) give

\[
|\Delta Q|\le2^{11}/X,\qquad
|\Delta w|\le {2^{23}e^{16T}\over hX_*}<\epsilon.
\tag{H21}
\]

For example the added Q numerator divided by `XH_cl` is at most `512/X`,
while the denominator change costs at most `2|g|`; `1+g>=1/2` suffices.
The N bound is the same local form used in H20. The denominator comparison
now includes `g` from H6.

Since `|chi_K'|<=30`, H6 and `|ZH'|<=3h/X` give `|g_y|<=93h/X`.
Therefore

\[
|\Delta a|=2|g_y/(1+g)|\le372h/X<h/2.
\tag{H22}
\]

The last inequality follows from `X>=X_*>744`. Hence `a>2+3h/2`,
`b_s=0`, and `|w_new|<1/50`, using O's `|w_cl|<1/100` in this region.
Both sufficient ratio margins and `v_s>2` follow.

### 5d. One actual radial threshold

After these changes the ratio data in 5b may be bounded by
`c=1-bw/a>=1/4`, `c<=2260`, `v<=116`, and
`G=2c^2-(v-2)(w+b/a)^2>=1/8`.
The Lemma 4.5 threshold is consequently below `2^26`.
The I2 and splice estimates have stronger bounds.

On the constant-slope part O gives `XQ_cl/XR>1/64`; on every later
pre-splice part the bound is stronger. The estimates above make the
relative Q change at most `1/2`. Thus
`P_new=XQ_new/L>=2^33>2^26` for the allowed `XR>=2^40`.
Equivalently on the splice one may use
`P_new>=Xh/512`, with `hX_*>=2^40 exp(51999T-18)`.
This closes the large-P part of the **same** outer cone test. It does not
choose the later global C.12 frequency N.

## 6. The terminal collar and its final stress direction

The following stress conclusions require the *same final* regular axis
and exact total moments in Lemma A.8. They are explicitly conditional until
that axis and the intervening B.8/C.12 work have been attached. The
heat-prepared outer in sections 1-5 supplies their exterior profile and
total-moment side of the input, with the analytic datum H14.

For `1/2<=y<3`, write `K` for the exact physical heat swirl of Lemma A.6,
`f=f_o`, `rho=rho_o`, and `psi=psi_o`. Lemma A.8 gives the positive-sign
backward stress formula (A.46). The exact formula (A.54) has three
nonnegative terms. Its last one and
`K(y+s)>=K(y)e^(-As)` yield the quantitative bound

\[
T_\theta\ge {rK\over2qL}\rho\psi>0.
\tag{H23}
\]

The exact pressure derivative (A.53) and one more backward integration give

\[
|T_z/T_\theta|\le
2(e^{3-y}-1)q^A K\le32E_{pow}(X)H(2d/X).
\tag{H24}
\]

Here `3-y<=5/2` and `e^(5/2)<16`. The latter follows already from
`e<3` and `3^5<16^2`. The steep hold in O gives
`E_pow H<=2e_rel h^6`, so H24 is below `64e_rel h^6<1/100`.
Here `q^A K=E_pow H`; the actual profile contains the additional factor
`f_o`, bounded below by `1-rho_o>1/2`.
Also `-ZH'/H<=6h/X<h/4` when `X>24` and `f_o'/f_o<h/4`.
Thus

\[
2+h<a\le2+2h,\qquad b_s=0.
\tag{H25}
\]

For the unit direction `n`, these estimates verify (4.26) on this entire
terminal collar with the explicit common value `kappa=1/2`.
This is a terminal-collar value, not a claimed margin on the as-yet
unfinished inner annulus.

Let `delta=3-y`. The source flat-integral substitution in Lemma A.9,
applied to these exact fields, gives

\[
T_{0,\theta}=e^{-4/\delta^2}\delta^{-3}b_\theta(\delta,\eta),\qquad
T_{0,z}=e^{-4/\delta^2}\delta^3b_z(\delta,\eta),
\tag{H26}
\]

where both coefficients extend smoothly to the closed outer collar and

\[
b_\theta(0,\eta)=
{16\rho_o E_{pow}(X_b)\over\sqrt{2X_b}}
H(2(1-\eta^2)/X_b)e
\ge {8\rho_o E_{pow}(X_b)e\over\sqrt{2X_b}}>0.
\tag{H27}
\]

The lower bound uses `H>=1-3h/X_b>=1/2`. The unit direction therefore
extends smoothly with `n(X_b,eta)=(1,0)`, while the stress itself is flat
and zero at the edge. Every fixed derivative has the bound in (A.51).
For any later fixed inner weight positive on this collar, multiplication
by that weight preserves these local conclusions. This does not supply
the missing inner flat factor or its actual t1 and Xa.

## 7. Precise gate consequences

Established here, conditional only on the explicitly identified reviewed
outer and continuous operator inputs: the actual all-eta heat debt bound;
one smooth exact I2 compensation branch; same A.21 forward/backward
pressure; preservation of all five total moments; positivity; preservation
of the admissible cone from I2 through the splice; and preservation of
the other three reserved patches. These are real additions to the
heat-prepared outer, beyond O's finite A.4 interval.

The terminal stress formula and its explicit directional margin are bound
to this exterior, but need Lemma A.8's actual regular-axis and exact-moment
input for the final field. N3-02 remains subject to subsequent same-datum
axis/gluing/modulation preservation. N3-07 still needs the same completed
inner profile, global stress nonvanishing, both edges, the common flat
weight, and the full Theorem 4.6 witness. Neither full gate is silently
promoted by this note or by its scalar checker.

The accompanying checker verifies exact rational constants, input hashes,
and conservative exponential absorptions in this proof. Its test count is
not a Lean proof count and is not a count of new global PDE theorems.
