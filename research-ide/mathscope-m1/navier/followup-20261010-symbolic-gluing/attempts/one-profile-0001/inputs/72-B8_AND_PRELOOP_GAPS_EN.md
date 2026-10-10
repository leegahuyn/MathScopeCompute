# Actual B.8 partial moments and the complete pre-loop gap ledger

## 1. Same-source scope and fixed choices

This note supplies the positive lower bounds required by the original
C.1 loop for the actual continuation, B.8 correction, and new outer
profile. The bounds refer to one mathematical profile and every
`eta in [-1,1]`. They do not arise from a phase or parameter sample.

Use the exact data and functions defined in
`../followup-20261010-same-datum-axis/CONTINUATION_AND_NEW_DEBT.md`
and `REFERENCE_DERIVATIVE_BOUNDS.md`, including the finite common
reference bounds proved there. Put

\[
 P=P_*=e^{2T},\quad h=e^{-8002T},\quad
 j=h^4,\quad \epsilon_m=h^3,\quad \mu=h^2,
\]
\[
 Q\ge2^{260},\quad Q>h^{-8},\quad \Lambda=Q^{64},\quad
 C=(1+Q^{300})^{10}e^{Q^{200}},\quad X_R=110(CP)^{10},
\]
\[
 t_1=\kappa_0=\omega_1=\omega_2=C^{-120},\qquad
 S=C^{100000}.                                      \tag{G1}
\]

The actual B.8 certificate is
`../followup-20261010-symbolic-gluing/attempts/b8-0001/certificate.json`.
Its unique root has ordinary eta derivatives through order two
bounded by `10^-6`; only orders zero and one are needed below.
Its coefficients in the physical fields are `K_eta mu z`, where
`K_eta=P f(eta)` and `f=(1+eta^2)^(-1)`.

The B.8 bumps in this certificate are **sigma' without a unit-mass
prefactor** on intervals of width `1/4096`. Thus their masses are
`1/4096`, their pointwise values are at most 9, and their x derivatives
are at most `4096*128`. This convention is different from the later
C.2 unit-mass bumps. The five ordered supports run from `12/4096`
to `21/4096`; they are pairwise disjoint and lie strictly between
`exp(-6)` and `exp(-5)`.

All pressure quantities start at the same A.21 datum. The original
source is the supplied paper, SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`;
the formulas used are (4.15)–(4.16), B.26–B.35 and Lemma 4.4.
The outer bounds are those of `OUTER_DERIVATION.md`, SHA-256
`ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81`.

## 2. Continuous partial debt throughout restoration and B.8

Write `x=X/XR` and work on

\[
 \mathcal R=\{e^{-8}\le x\le e^{-5},\ |\eta|\le1\}.
\]

The comparison field is exactly `U_id=c=4eta`, `E_id=P f x^(1/10)`.
For a function of eta, use the maximum of the absolute values of
orders zero and one. Every bound in this section holds at every
partial radial integration point. The raw normalization is

\[
 \left(
 \frac{\Delta M}{X_RP},\quad
 \frac{\Delta I}{X_R^{3/2}P},\quad
 \frac{\Delta J}{X_R^{3/2}P^2},\quad
 \frac{\Delta S}{X_RP^2},\quad
 \frac{\Delta C_p}{P^2}
 \right).                                           \tag{G2}
\]

The exact early continuation estimate (15) in the same-datum note
bounds each incoming normalized error by `epsilon_m`, including
these two eta orders. Passing from its K normalization and the
rows `J-cI`, `S-2cM` to G2 costs at most 27. For example the largest
conversion is

\[
 \Delta S/(X_RP^2)
 =f^2 d_{S-2cM}+(2c/P)f d_M.
\]

Since `|f|,|f'|<=1`, `|c|,|c'|<=4`, `P>=1`, its value and first
derivative are bounded by `27epsilon_m`. The other rows cost less.
If an incoming row is already raw, that smaller conversion is also
covered by 27. This bound concerns the actual early integrals and
their analytic error; no arbitrary incoming debt is supplied.

Between the end of the shift and the end of the source restoration,
write `U=c+v`, with `|v|<=2j`, `|v_eta|<=j`, and `E=E_id`.
The radial cutoff depends only on x. On every partial interval
of length at most one in x, the additional bounds for G2 are
at most `28j`. In the energy row, for instance,

\[
 (U^2-c^2)/P^2=(2cv+v^2)/P^2,
\]

whose first eta derivative is bounded by
`16j+8j+4j^2<=28j`. The J row costs at most `6j` after
including its factor `sqrt(2x)`; the M row costs at most `2j`.
The I and pressure rows do not change on this restoration.

For the B.8 correction itself, disjointness and the certified roots
give, at every point,

\[
 |\Delta E/P|,|\Delta U/P|,
 |\partial_\eta(\Delta E/P)|,
 |\partial_\eta(\Delta U/P)|\le\mu/1000.          \tag{G3}
\]

Indeed `18*10^-6<1/1000`. The true value bound is
`9*10^-6 mu`; the larger bound in G3 includes the derivative of f.
Insert G3 in the exact density differences of (4.15). The following
numbers bound both the value and first eta derivative after dividing
out the powers in G2; all integrals have x length below one.

| Row | Bound for the complete or partial B.8 contribution |
| --- | --- |
| M | `mu/1000` |
| I | `2mu/1000` |
| J | `20mu/1000+4mu^2/10^6 < mu` |
| S | `18mu/1000+3mu^2/10^6 < mu` |
| Cp | `2^13(2mu/1000+mu^2/10^6) < 17mu` |

Here `x^-1<e^8<3^8<2^13`. The J calculation uses
`sqrt(2x)(E_id Delta U+c Delta E+Delta E Delta U)`, and the
S calculation uses
`2c Delta U+Delta U^2-E_id Delta E-Delta E^2/2`.
The quadratic terms are included even though disjointness removes
some of them. For Cp the exact density is
`(E_id Delta E+Delta E^2/2)/x`.

Combining the actual early interval, restoration and B.8 contributions
therefore proves the uniform continuous bound

\[
 \boxed{\max_{k=0,1}\|\partial_\eta^k\text{ each row in G2}\|_\infty
 \le27h^3+28h^4+17h^2<100\mu.}                  \tag{G4}
\]

The location of an integration endpoint inside a bump introduces no
eta-boundary term, since all support endpoints are independent of eta.
G4 bounds partial moments, not just the exactly restored totals.

## 3. Positive field and actual shear on this whole rectangle

On R the ideal field is larger than `P/5`: `f>=1/2`, and
`exp(4/5)<5/2` follows from `e<3` and `3^4<(5/2)^5`.
Using the true value bound preceding G3 gives

\[
 E>P/6.                                           \tag{G5}
\]

On a B.8 support,

\[
 |D_X\Delta E|,|D_X\Delta U|
 \le 21\cdot128\cdot10^{-6}P\mu=2688\cdot10^{-6}P\mu.
\]

The factors `4096` from the bump derivative and `x<=21/4096`
have both been retained. Since the ideal log slope is 1/10,

\[
 |a-4/5|\le12(2688+9/10)10^{-6}\mu<\mu/4,
 \qquad |b_s|\le12\cdot2688\cdot10^{-6}\mu<\mu/4. \tag{G6}
\]

On the preceding restoration `a=4/5` exactly and
`|b_s|<=180j/P<mu/4`; it is zero in the intervening pieces.
The last inequality uses `720h^2<P`.
Consequently throughout R,

\[
 7/10<a<9/10,\qquad |b_s|\le\mu/4,\qquad
 v_s=a+b_s^2/a<1.                                \tag{G7}
\]

These estimates contain neither a factor C nor its reciprocal.

## 4. The XR-independent stock recovery

For clarity set
`m=M/XR`, `i=I/XR^(3/2)`, `j_m=J/XR^(3/2)`, `s=S/XR`,
and `Hhat=sqrt(2x)E`. Formula (4.16) becomes exactly

\[
 W=1-(2D\eta m+d m_\eta)/x,
\]
\[
 Q_s=-W+\frac{(1-h)i-D\eta i_\eta-d(j_m)_\eta
                                  +2(h-D)\eta j_m}{x\widehat H},
\]
\[
 N_s=-WU+\frac{D(m-\eta m_\eta)+4h\eta s-ds_\eta}{x}
                       +4A\eta\Pi-d\Pi_\eta.      \tag{G8}
\]

The physical stock coordinates are
`p_s,1=X Qs/L`, `p_s,2=X Ns/(L E)`.
In particular XR cancels from Qs, Ns and `w=Ns/(E Qs)`.

For the ideal field, `m_id=4eta x`, `W_id=-3+8h eta^2`,
`I/(XH)=5/8`, `J=cI`. Direct substitution gives

\[
 Q_{id}=\frac98-\frac58h+2h\eta^2
       +\frac58\frac{2\eta^2}{1+\eta^2}(D+4d),
 \qquad 9/8-5h/8\le Q_{id}<4.                    \tag{G9}
\]

G4 bounds the change of W by `100*2^14 mu P<2^21 mu P`.
The change of the angular numerator in G8 is at most
`150mu P+200mu P^2<2^9 mu P^2`.
Since `x^-3/2<e^12<3^12<2^20`, G5 gives
`1/(x Hhat)<2^23/P`. Finally the old angular fraction equals
`Q_id+W_id`, of absolute value below 7; changing E in its
denominator costs at most `7mu`. These bounds prove

\[
 |Q_s-Q_{id}|<2^{40}\mu P<1/16,
 \qquad \boxed{Q_s>1}.                          \tag{G10}
\]

Here and below all smallness is justified by the fixed expression

\[
 \mu P=\exp(-16002T),\qquad T\ge128.             \tag{G11}
\]

For Ns one can bound the full actual terms instead of multiplying
an absolute stock-vector error by C. The ideal moments and G4 give

\[
 |W|\le4,\quad |U|\le5,\quad
 |m|/x,|m_\eta|/x\le5,\quad
 |s|/x\le18P^2,\quad |s_\eta|/x\le34P^2.
\]

For example
`s_id=16eta^2 x-(5/12)P^2 f^2 x^(6/5)`.
The actual A.21 bound and its first derivative give
`|Pi0|<=5P^2`, `|Pi0'|<=160P^2`.
The ideal pressure increment is `(5/2)P^2 f^2 x^(1/5)`;
after G4, `|Pi|<9P^2`, `|Pi_eta|<256P^2`.
Using `h<=1/4`, `D<=1/2`, `4A<=3`, the six contributions in
G8 have sum below

\[
 (20+5+18+34+27+256)P^2<2^{20}P^2.
\]

Thus

\[
 \boxed{|w|<2^{24}P}.                            \tag{G12}
\]

Equations G6, G7 and G11–G12 imply

\[
 |b_sw/a|<2^{26}\mu P<1/4,
 \quad P_c=p_{s,1}(1-b_sw/a)\ge3X/4.
\]

On R, `X>=XR exp(-8)>2^27`. Hence
`Pc-2>1`, `Pc-vs>1`, and

\[
 2(P_c-v_s)^2-(v_s-2)J_c^2\ge2(P_c-v_s)^2>2,
\]

because `vs<1`. Together with `a>7/10`, this proves that all
four **relaxed** C.1 gaps on the entire actual restoration/B.8
rectangle are larger than `1/2`.

## 5. Exact complete geometry

Use the same geometry as the final stress assembly:

\[
 X_a=4/\Lambda,\quad X_{an}=X_a e^{t_1/16},\quad
 X_-=X_a e^{t_1/8},\quad X_c=X_Re^{T+2},\quad X_+=X_c e,
\]
\[
 \Xi_1=X_c e^{60B-25},\quad B=1000T,\qquad
 I=[X_-,X_+],\quad J=[X_{an},16\Xi_1].             \tag{G13}
\]

All I1 repair supports lie before `16Xi1`, and the original I2
reserved interval begins at `exp(5)Xi1>16Xi1`. The A.7 heat
and I2 edits occur strictly to the right of J and preserve the
same datum. Forward moments and all fields on J are therefore
exactly the pre-loop continuation/B.8/new-outer fields estimated here.

## 6. Complete lower-bound ledger, without a compact minimum

Write

\[
 \Psi_{rel}=(a,\ P_c-2,\ P_c-v_s,
                  2(P_c-v_s)^2-(v_s-2)J_c^2).
\]

The following regions cover J. Each stated lower bound applies
to every eta and every radial point of its region.

**Activation from `y=log(X/Xa)=t1/16` to `t1`.**
The exact B.29 comparison is verified in
`ACTIVATION_COLLAR_BOUNDS_EN.md`, with
`Kcmp<C^49`, `Vmax<C^5` and the widths G1.
It gives `Pc-2>=1/10`, `Pc-vs>=2ea`, and the fourth gap
at least `4ea^2`. At `y/t1>=1/16`,

\[
 e_a\ge\frac14e^{-256}>\frac1{4\cdot3^{256}}>2^{-408}.
\]

The actual shear has
`a>=kappa0/(4Lambda)>=C^-122`, using `Lambda<=C` and `C>=4`.
Thus the last two gaps exceed `2^-407` and `2^-814` respectively.
All four exceed `C^-1000`, because `C>=2^260`.

**After activation through the reference cutoff and continuation to
the axial cutoff at X=100.**
The actual comparison error is at most `4C^-71`, while
`kappa0 Vmax<C^-115`. The inequalities
`4C^-71<1/10` and `C^-115+4C^-71<1/10`, together with
`vr>11/5`, give `Pc>21/10` and `vs<1/10`.
Hence the second gap is at least `1/10`, the third exceeds 2,
and the fourth exceeds 8. Again `a>=C^-122`.

**The two short final transitions near X=100.**
The reference bound `p1,r>3` here follows quantitatively from
`Sq,r>=12/5`, `l_r<=1` and its positive initial value:

\[
 p_{1,r}(X)\ge\frac65\left(X-\frac{X_a^2}{X}\right)>3
 \quad (100\le X\le110).
\]

During the axial cutoff the reference projected value is
`p1,r+beta p2,r^2/p1,r>=p1,r`; the same `4C^-71` comparison
therefore gives `Pc>29/10`, `vs<1` and `a>=C^-122`.
After that cutoff `b_s=0` exactly. The convex interpolation of a
to `4/5` keeps `C^-122<=a<=4/5`, while `Pc=p_s,1>29/10`.
The last two gaps consequently exceed 1 and 2 on both transitions.

**The fixed-slope continuation, B.34 shift, and final constant
portion before `x=e^-8`.**
At entry `p_s,1>29/10`. The same-source estimates prove `Sq>1`
on these portions, including theta=0 at the end of the shift;
their log slope is at most `13/20` after the two transitions.
At a hypothetical first downward crossing through `p_s,1=5/2`,

\[
 D_Xp_{s,1}=X S_q/L-l p_{s,1}
            >100-(13/20)(5/2)>0.
\]

This prevents that crossing. The eta shape and constant U remain
unchanged after the shift. More explicitly, put
`epsilon=2Q^-58+Q^-200<j/50`. Before restoration the whole previous
U profile differs from `U_*=4eta+j`, together with its first eta
derivative, by at most epsilon. Its radial average has the same
bound. Consequently

\[
 -W\ge3-8h-j-2\epsilon,\qquad
 -H_c(\log f)'\ge-j^2/(2D)-2\epsilon.
\]

The second inequality is the completed-square bound for
`D eta^2+d j eta`, with the additional U error retained. For
`h,j<=1/1000`, `D>=49/100` and `l>=11/20`, these give

\[
 S_q\ge\frac{11}{20}(3-8h-j-2\epsilon)
                 -11h-j^2/(2D)-2\epsilon>1.
\]

This verifies the extension of the theta=0 estimate up to the
restoration point, including the changing radial average. Here `b_s=0`,
`7/10<=a=vs<=9/10`, and `Pc=p_s,1>5/2`.
All four relaxed gaps therefore exceed `1/2`.

**The restoration/B.8 rectangle.**
Sections 2–4 prove all four gaps exceed `1/2`, including every
partial moment and both ends of every correction bump.

**After B.8 through the right endpoint of J.**
The exact five equations and Lemma 4.4 identify these fields and
moments with the new ideal outer. The reviewed outer ratio bounds
are `a>=4/5`, `c=1-bw/a>=1/3`, `c<=2259`, `vs<=116`, and
`G=2c^2-(vs-2)(w+b/a)^2>=1/4`.
They cover the reference, first transition, the entire axial stage,
entry and the required part of the constant-slope stage.
The common radial estimate in outer section 10 gives

\[
 p=p_{s,1}\ge3^{-8}X_R>C^9>2^{33}.
\]

It follows directly that

\[
 P_c-2\ge p/4>1,\quad P_c-v_s\ge p/6>1,\quad
 2(P_c-v_s)^2-(v_s-2)J_c^2\ge p^2/8>1.
\]

The second quadratic inequality retains the actual finite p:
`G-4c vs/p+2vs^2/p^2>=1/8`, since
`4*2259*116/2^33<1/8`.

The complete ledger proves the actual, explicit result

\[
 \boxed{\Psi_{rel}\ge C^{-1000}\quad\hbox{on all of J, for every eta}.}
                                                        \tag{G14}
\]

It uses no unspecified minimum over the final profile.

## 7. Both actual loop collars and the remaining strict regions

The left collar of I is
`Xa exp(t1/8)<=X<=Xa exp(t1/4)`. The activation bound gives
`vs-2>=1/10` there. The right collar is
`Xc exp(1/2)<=X<=Xc e`, entirely inside the untouched
constant-slope interval, where `vs-2=2lambda` exactly.
Since `lambda^-1<h^-1<Q^(1/8)<C`, both collar gaps exceed
`S^-1=C^-100000`.

The same strict bounds hold on `J\I`: its left part is in the
closed first activation collar, and its right part stays inside
the constant-slope interval because `log(16)<25`.
They provide the unchanged-profile strict gaps needed by C.12
off the loop interval. With `delta_L=exp(-S^16)<S^-1`, the
actual C.1 loop equals the original shear on both fixed collars.

Thus G14 and the two collar estimates supply the **actual lower
gap inputs** to `LOOP_DERIVATIVE_ENVELOPE.md` at the explicit
`S=C^100000`. A separate same-source derivative envelope must
still prove the upper jet bounds at this S. Once it is attached,
the already proved loop and finite-N contracts apply to this
profile without an additional compactness choice.

This note establishes the continuous lower-gap component. It does
not on its own provide the remaining derivative envelope, a new
Lean proof, or an automatic full-profile gate promotion.
