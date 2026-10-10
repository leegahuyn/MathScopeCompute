# Continuation selectors and the new all-eta incoming B.8 debt

## Scope

This extends `SAME_DATUM_ANALYTIC_AXIS.md` to an actual, mathematically
specified pregluing profile. It uses the exact reference and shear-control
integrals B.22 and B.26, and the original B.5 comparison argument. All selected
constants and positive widths are explicit expressions in the new outer
parameters. The final five debt bounds below
are for that one selected family member, with the new A.21 pressure and the
same enlarged amplitude throughout.

The new continuous B.8 matrix is the independently recomputed matrix in
`followup-20261010-symbolic-gluing/attempts/b8-0001/certificate.json`.
No matrix, pressure certificate, continuation, or incoming debt from the
old `Md=1` fixture is reused.

## 1. Choices made before the final amplitude

Take the outer expressions and local construction of the companion note,
and now set

\[
 \epsilon_m=h^3,\qquad j=h^4,\qquad \mu=h^2.
 \tag{1}
\]

Thus `j<epsilon_m<h`, `epsilon_m/mu=h`, and all are strictly positive.
The local cutoff, coefficient radius, `Q`, and `Lambda=Q^64` are recomputed
by exact substitution of this `j`. In particular

\[
 Qj^2=2^{260}\,2000^2K>1,
 \quad j>Q^{-1/2},\quad h>Q^{-1/8}.
 \tag{2}
\]

These relations are useful when comparing the extremely small axis errors
with `j`. They do not replace `h` or `j` by zero.

Use a reference-cutoff upper width `bar t=Q^-200`. Then
`4 exp(2 bar t)<4.1`, so B.22 only evaluates the new analytic solution
inside its certified rectangle. For `0<=k<=3` and `0<=Y<=4.1`, the exact
coefficient estimate (16) in the companion note implies the convenient
bounds

\[
 |\partial_\eta^k u|+|Y\partial_Y\partial_\eta^k u|\le Q^6,
 \quad |\partial_\eta^k\log\Phi|
       +|\partial_\eta^k(Y\partial_Y\log\Phi)|\le Q^{24}.
 \tag{3}
\]

For example all normalized function derivatives with `k<=3` have size
at most `Q^5`; differentiation of a reciprocal with `Phi>=1/4` and the
ordinary product rule give the second estimate. The displayed powers
include ample fixed numerical factors since `Q>=2^260`. Derivatives of
the fixed phase through order three have size at most `Q^4`; hence
`Lambda psi` and its first three derivatives are bounded by `Q^69`.

The same coefficient formula through eta order four gives finite bounds
for the additional derivative required when differentiating the source
formulas three times. For example `Q^32` bounds the normalized and
logarithmic input derivatives in that finite list, and `Q^70` bounds
the phase derivatives after multiplication by Lambda. These extra input
bounds enter the explicit finite derivative table in
`REFERENCE_DERIVATIVE_BOUNDS.md`, without imposing their smallness.

The initial axial deviation is therefore at most `Q^-58<j/100` in
`C_eta^3`. The reference cutoff adds at most `2 bar t Q^-58` to this
bound. Its extra gradient and logarithmic-value changes are at most
`2 bar t Q^24`, both much smaller than `Q^-100`.

## 2. The actual reference family and its finite common bounds

For each `0<t<=bar t`, define `phi_r,U_r` by the literal integrals B.22:
they equal the new analytic profile up to `X0 exp(t)`, their prescribed
logarithmic slopes are multiplied by
`1-sigma((log(X/X0)-t)/t)` up to `X0 exp(2t)`, and thereafter they are
constant in logarithmic radius. Use the same A.21 axis pressure, and define
all moments, `Qs,r`, and `Ns,r` by their actual continuous integrals.
Here `X0=4/Lambda`, `Xb=100`, `Xi=110`.

The reference estimates can be made uniform for every `C>=Caxis` and
`0<t<=bar t`. To see finiteness without hiding a pressure assumption,
write `R_r=F_r/g`. The common positive factor `g` cancels from every
radial ratio in the integral for `Qs,r`. The local positivity and the
nonpositive natural logarithmic slope imply `1/4<=R_r<=2`. Its first
three parameter derivatives have finite bounds from (3) and B.22.
Pressure is `P+integral F_r^2`; its derivatives through the additional
fourth eta order are bounded by integrating the actual products of `F_r`
and its derivatives on `[0,110]`. The
normalization in the companion note bounds these uniformly for larger
`C`.

The exact derivative-polynomial table in `REFERENCE_DERIVATIVE_BOUNDS.md`
sharpens this argument into an explicit common upper bound. It proves
`R_r` and its first four derivatives are below `Q^7`, logarithmic
derivatives through order four are below `Q^32`, the radial ratio and its
first three derivatives are below `Q^100`, and the literal source bounds
are `Sq,r<Q^80`, `Sn,r<Q^5` in `C_eta^3`. The actual integral formulas
then give `p1,r<Q^200` and `ns,r<Q^7` in the same norm. We therefore set

\[
 B_{ref}:=Q^{300}>
 1+\sup_{C\ge C_{axis},\ 0<t\le\bar t}
   \max_{0\le k\le3}\sup_{X\in[X_0,110],\ |\eta|\le1}
  \bigl(|\partial_\eta^k p_{1,r}|+
        55|\partial_\eta^k n_{s,r}|\bigr).
 \tag{4}
\]

This is a proved upper bound for the actual functions, not an input norm
claim. The checker executes every coefficient in that finite derivative
table. The common factor `g` cancels before ratio differentiation, so the
bound is uniform even as `C` grows. No compact supremum remains in the
selected value of `Bref`, and no reciprocal of an underflowed amplitude
enters the proof. The earlier uncommitted supremum-selector draft has
been superseded by this explicit expression and its new receipt.

## 3. Positive reference source and the endpoint alternative

The bounds needed by B.4 apply to this new family, not just to the earlier
rational example. For clarity, the mechanism can be quantified in powers
of the new `Q`. Write `e=Phi-f0(Y chi)`. On the real interval

\[
 |H_*\chi'|\le2|H_*'|\chi,\quad
 |H_*|/(H_*^2+\sigma^2)\le\sigma^{-1}\sqrt\chi,
 \quad |H_*'|\le20.
\]

Use the sharper actual displacement `29Q^-53` in (14a) of the companion
note. The eta error in (16) is at most
`(29/4)(200/159)^2 Q^-52`; after multiplication by the bounded H field
and the reciprocal Phi its fixed numerical coefficient is absorbed by
one power of Q. The residual is therefore less than `Q^-50`. The
coarser displacement `1/(2Q^32)` would not justify that conclusion.

The local and reference axial deviations are at most `2Q^-58`, and
the extra cutoff-gradient error is at most `2Q^-176`. Using
`|f0'|<=1/4`, `Phi>=1/4`, and the derivative-error estimate (16), the
complete source formula yields an error of the form

\[
 S_{q,r}\ge\Lambda L\chi-W_*-11h
             -Q^2\chi-Q^8\sqrt\chi-Q^{-50}.
\]

All fixed coefficients in this deliberately coarse inequality are covered
by (3), `sigma^-1<=Q`, and the full terms
`-W l-h(1-2 eta U)-Hc(log F)_eta`; no division by `chi` is used.
Young's inequality gives

\[
 Q^8\sqrt\chi\le .05\Lambda L\chi+6Q^{-48},
 \qquad Q^2\chi\le .01\Lambda L\chi.
\]

Since `-W_*>=3-8h-j` and `h,j<=1/1000`, this proves

\[
 S_{q,r}\ge .94\Lambda L\chi+2.4,
 \qquad l_r\le1. \tag{5}
\]

The natural-core case is obtained first, and its positive integrated
source proves the required nonpositive natural logarithmic slope; the
cutoff then preserves it. This order avoids assuming that monotonicity
in order to prove its own source estimate.

The first endpoint alternative uses the exact alternating-series bound
`f0(4chi)+4chi f0'(4chi)<-.18` when `chi>.99`, so (16) gives
`p1,r(X0)>2.3`. The differential comparison in B.25 and (5) preserve
this strict inequality along that part of the parameter interval.
The same comparison gives `p1,r>3` for `100<=X<=110`.

On `chi<=.99`, the new separation (8) gives `|Z_*|>j/10`. The full
axial source differs from `Z_*` by at most a fixed polynomial in the
small deviations in (3) plus the actual forward pressure correction.
The latter is uniformly small on this finite radial interval. Indeed the
straight segment in the complex tube has length at most `17/16`, so
`|psi|<=34/sigma^2`; the normalization reserves at least
`30Lambda/sigma^2` in `logCaxis-Lambda Re psi`. Direct product
differentiation and `exp(x)>=x^n/n!` make its first three derivatives
smaller than `Q^-1000`. Therefore

\[
 |S_{n,r}-Z_*|<Q^{-50}<j/40,
 \qquad |n_{s,r}|>j/40
\]

throughout the low-chi region, including the initial value and its
integrating-factor evolution.

The final amplitude chosen below ensures `p2,r^2/p1,r>2.3` uniformly
there. Thus `v_r=p1,r+p2,r^2/p1,r>2.2` for every eta on the reference
interval. This supplies the hypotheses used in the actual B.5 shear
reduction.

## 4. Bk and the shift are fixed before C

The actual B.26 shear reduction will be chosen with widths satisfying

\[
 (t_1+\kappa_0 L_0+\omega_1+\omega_2)B_{ref}<j/100,
 \qquad L_0=\log(110\Lambda/4), \tag{6}
\]

where the two final transition lengths are `omega1,omega2`. Such strictly
positive widths exist after `C` and will be fixed in section 6. Integrating
the actual B.26 controls, with their cutoff values between zero and one,
gives on the entire continuation

\[
 \|U-U_*\|_{C_\eta^3}\le2Q^{-58}+Q^{-200}<j/50,
 \quad \|\log\phi-\log\phi(X_0,\cdot)\|_{C_\eta^3}<1.
 \tag{7}
\]

The final interpolation toward `a=.8` contributes at most one more fixed
unit to this logarithmic bound; its constant target has zero eta
derivatives. No inverse radial-cutoff width occurs, since only integrals
of cutoff values are used. Accordingly the endpoint
`ell_i=log(C E(110,eta))` satisfies

\[
 \|\ell_i\|_{C_\eta^k}\le B_k:=Q^{80}\quad(0\le k\le3),
 \tag{8}
\]

using `Lambda psi`, (3), (7), and the fixed factor `sqrt(220)`.
Choose

\[
 T_{sh}=Q^{90}. \tag{9}
\]

The certified source step has `||sigma'||<=9`, so this is larger than
`180(Q^80+||log f||)` and satisfies B.33. Both (8) and (9) are fixed
before the final amplitude and are valid for every sufficiently narrow
width choice in (6).

## 5. One final enlarged amplitude and one outer radius

Now fix

\[
 C=(1+B_{ref})^{10}\exp(Q^{200}),
 \quad X_R=110(CP_*)^{10},\quad X_{sep}=110\exp(T_{sh}).
 \tag{10}
\]

This exceeds `Caxis`. It fixes **one new analytic Picard limit** in the
uniform family, used for the reference and the actual continuation. In
the low-chi region, (4) and the source bound in section 3 imply that
`p2,r^2/p1,r>2.3`: `p1,r<=Bref`, `X>=4/Lambda`,
`|ns,r|>j/40`, and `Er<=30 exp(34Lambda/sigma^2)/C`.
After substitution of (10), the required inequality is dominated by
`exp(Q^200)` against a fixed power of `Q`, `j^-1<=Q`, and
`(1+Bref)`. The elementary inequality `exp(x)>=x^n/n!`, already with
a fixed `n`, proves the dominance. Also `XR>2^40`, so the earlier
finite outer cone threshold remains satisfied.

## 6. Positive final widths selected from actual finite comparisons

The scalar B.5 comparisons have to hold for the chosen functions, not for
sampled data. Here is an exact selector that makes the original
"sufficiently small" choice unambiguous while retaining its proved
meaning.

For the now fixed `C`, put

\[
 \mathcal L=\log C+34\Lambda/\sigma^2,\qquad
 V_A=1+B_{ref}+2^{20}B_{ref}^2\Lambda^4,
\]
\[
 B_0=10^6(1+Q^{1000}+B_{ref}+V_A+L_0)^4,
 \quad\Gamma=B_0e^{\mathcal L},\quad
 K_{cmp}=1000\Gamma^{16},\quad V_{max}=V_Ae^{2\mathcal L}.
 \tag{10a}
\]

These are exact finite expressions in already selected quantities. In
particular `Kcmp` is not a postulated bound. To justify it, (5) and the
ratio `1/4<=Fref/g<=2` give `p1,r>=1/(4Lambda)` and
`Eref^2>=exp(-2 Lmath)/(2Lambda)`. Consequently
`|p2,r|<=220 Bref Lambda exp(Lmath)` and `v_r<=Vmax`.
All fixed input fields, moments, pressure derivatives, reciprocal radial
coordinates, and `1/p1,r` in the reconstruction are bounded by `B0` or
`Gamma` as appropriate. The large term `Q^1000` absorbs the finite
derivative bounds in (3), the extra fourth input derivative, and the
fixed interval length. In particular `1/Eref,1/Href<=Gamma`.

The resulting constant proves the following actual B.27–B.29 estimates:

* on the activation interval, the differences of the fields, their first
  three eta derivatives, and the moment inputs and their first eta
  derivatives, divided by `y e_a`,
  are bounded by `Kcmp`;
* there, `|v_s-kappa v_r|`, `|Pc-v_r|`, and `|Jc|` are bounded by
  `Kcmp y e_a`;
* after activation and through the two final transitions, the corresponding
  differences are bounded by `Kcmp` times the sum of their logarithmic
  widths and `kappa0`.

These are proved from the exact defining integrals: subtract B.26 from
the reference equations to obtain B.27, integrate the monotone factor
`e_a`, differentiate in eta, and insert the differences into the rational
formulas 4.16. One extra eta derivative is included in (4). In detail,
write `v=log(F/Fref)`, `w=U-Uref`. On activation use `s=y e_a`;
elsewhere through the final two transitions use
`s=t1+kappa0+omega1+omega2`. The defining integrals imply
`|v|,|v_eta|,|w|,|w_eta|<=B0 s`. The actual width condition and
`s<=4tau_base` give `B0s<1/10`. Thus `|v|<=1/10`,
`|exp(2v)-1|<=3|v|`, and `|exp(v)-1|<=3|v|`.
The exact moment integrals up to the end of the two final transitions give
the following upper bounds after division by `s`:

| Difference | Value | First eta derivative |
| --- | ---: | ---: |
| U | B0 | B0 |
| H | 45 B0 | 90 B0^2 |
| M | 110 B0 | 110 B0 |
| I | 4950 B0 | 9900 B0^2 |
| J | 26400 B0 | 79200 B0^2 |
| S | 1430 B0 | 3190 B0^2 |
| Cp | 3 B0^2 | 9 B0^3 |

For the last row use `dCp=E^2 dy/2` on the interval where the profiles
differ. The source fields and their first derivatives are bounded by
five for U and one for E after (10). The table follows by the ordinary
product rule; each entry is less than `B0^4`. The exact reciprocal
identity then bounds inverse E/H differences by `Gamma^6 s`.

The actual rational moment map is

\[
 p_1=L^{-1}[-XW+H^{-1}((1-h)I-D\eta I_\eta-dJ_\eta
                                      +2(h-D)\eta J)],
\]
\[
 p_2=(LE)^{-1}[-XWU+D(M-\eta M_\eta)+4h\eta S-dS_\eta
                           +X(4A\eta\Pi-d\Pi_\eta)].
\]

Expanding its monomials and telescoping each product gives
`|Delta p1|,|Delta p2|<=100 Gamma^12 s`. The independently recomputed
positive-polynomial bounds are
`(21/2)Gamma^6+5Gamma^7+(21/2)Gamma^8` for the first component and
`9Gamma^6+9Gamma^7+9Gamma^8+27Gamma^9+5Gamma^11` for the second.
Finally `t0=p2,r/p1,r`, `t=t0 Eref/E` satisfy
`|t|<=3Gamma^2`, `|t-t0|<=3Gamma^3 s`. Substituting in
`Pc=p1+t p2`, `Jc=p2-t p1`, and
`v_s=kappa p1,r(1+t^2)` bounds the first two errors by
`[100Gamma^12(1+3Gamma^2)+3Gamma^4]s`, and the third by
`12Gamma^6 s`. Indeed the latter is bounded by
`p1,r*|t-t0|*(|t|+|t0|)<=12Gamma^6 s`. All are less than the explicit
`Kcmp s` in (10a).

In the cone formulas, first cancel the common positive `kappa` from
`t_s=-b_s/a`, exactly as in B.29. Thus **no `1/kappa0` appears** in this
definition of `Kcmp`. Near activation, use the normalized difference
variables `(field-field_r)/(y e_a)` produced by B.27; division by the flat
factor is justified by that integral identity, not by a sampled quotient.
This is precisely the finite comparison construction used in the proof
of the original Proposition B.5.

Set `tau_base` to the minimum of `bar t/4`, `1/1000`,
`1/[100 Gamma B0]`, and

\[
 \frac{j}{10^8(1+B_{ref})(1+L_0)},\quad
 \frac{Q^{-200}}{10^6(1+B_{ref})(1+L_0)},\quad
 \frac1{10^8 B_0(1+Kcmp)^2(1+Vmax)^2}.
\]

The explicit polynomial bounds in section 6 of
`REFERENCE_DERIVATIVE_BOUNDS.md` give
`exp(Q^200)<=C<=exp(2Q^200)`, `Q^10000<C`, `B0<C`,
`Gamma<C^3`, `Kcmp<C^49`, `Vmax<C^5`, and
`tau_base>C^-114`. Fix the final positive widths directly by

\[
 t_1=\kappa_0=\omega_1=\omega_2=C^{-120}<\tau_{base}.
 \tag{11}
\]

Every entry of the comparison minimum is a proved positive finite real,
and its lower bound explicitly proves that the selected widths satisfy
all conditions. No least-integer search, unknown source supremum, or
unknown cone inequality occurs in this final specification. The earlier
least-dyadic draft is superseded. Subsequent bounds and source hashes
refer to this one final member of the analytic family.

Substitution in the estimates above gives `Pc-v_s>0`, `Pc>2`, and
`(v_s-2)_+ Jc^2<2(Pc-v_s)^2` throughout activation. On a smaller positive
collar, `v_s>2` as well. Afterwards `kappa0 Vmax<1/100` and the global
comparison retain `Pc>2` and `v_s<1`. The final axial cutoff at `Xb=100`
uses `p1,r>3`; the following interpolation to `.8` still has `v_s<1`
and `Pc>2`. Its widths sum to less than `1/100`, hence both transitions
fit before `Xi=110`. The `O(s)` comparison stops at the end of that
interpolation. On the following fixed `.8` interval, the logarithmic
change has zero eta derivatives of positive order, `Sq>1`, and the
same `p1=2` crossing argument used in section 7 keeps `p1>2`.
No `O(s)` comparison with the frozen reference is asserted on that
fixed-length last interval. These are the actual strict relaxed-cone conclusions
of B.5 for the selected profile. The factorization on the first collar
is the original B.30 argument applied to the actual positive width (11).

This is an explicit mathematical specification with executed scalar and
polynomial upper-bound checks. It is not a Lean proof term. That
distinction is retained in the receipt.

## 7. The exact B.34 shift and the all-eta early error

Use B.34 with `Gi=U(110,eta)`, the actual `ell_i`, and the already fixed
`Tsh`:

\[
 \log E=-\log C+y/10+(1-\sigma(y/T_{sh}))\ell_i
                         +\sigma(y/T_{sh})\log f,
 \qquad U=G_i. \tag{12}
\]

It has `l in [.55,.65]`. The gradient estimate of section 3 remains
valid with a factor `theta=1-sigma in [0,1]`. The new `log f` part has
lower bound `-j^2/(2D)-2||Gi-U_*||`, since
`eta H_* >=D eta^2+j d eta`. Its possible negative contribution is
therefore small. For the phase-bearing part it is essential to use the
stronger bound `||Gi-U_*||<=2Q^-58+Q^-200`, not its consequence `j/50`.
The additional width condition above makes the B.26 axial and
nonconstant eta-logarithmic changes less than `Q^-200`; multiplication
by `Lambda zeta`, bounded by `Q^66`, still leaves less than `Q^-134`.
The axis part is absorbed with the square-root-chi estimate of section 3.
The constant source retains
`.55(3-8h-j)-11h` minus the controlled errors, which is greater than
one. Thus `Sq>1` on the shift. The differential equation for `p1` cannot
cross down through two when `X>=110`, because there
`X Sq/L-l*2>110-1.3>0`.

At `Xsep`, (12) equals the ideal outer field **exactly**:

\[
 E=P_*f(X/X_R)^{1/10},\qquad
 x_{sep}=X_{sep}/X_R=e^{T_{sh}}/(CP_*)^{10}. \tag{13}
\]

Write `Delta=exp(-Q^200/4)`. Equations (8)–(10), ordinary product
differentiation through order three, and `exp(x)>=x^n/n!` give

\[
 \max_{k\le3}|\partial_\eta^k E|\le\Delta
       \quad(0<X<X_{sep}),\qquad
 \max_{k\le3}|\partial_\eta^k F|\le\Delta
       \quad(0<X\le110),\quad x_{sep}\le\Delta^{10}.
 \tag{14}
\]

For example in the shift `log E<=-Q^200+Q^90/10+Q^80<=-Q^200/2`,
while its first three eta derivatives are bounded by `Q^81`; the factors
arising from differentiating the exponential are absorbed by the
remaining `exp(-Q^200/4)`. In the preceding interval the same argument
uses the bounded log change (7). The pressure integral must be treated
separately at zero: it is `integral F^2 dX` up to 110, and
`integral E^2 dy/2` thereafter. Thus it and its normalized first three
eta derivatives are bounded by a fixed factor times
`(Tsh+111)Delta^2`. The ideal early pressure is
`(5/2)P_*^2 f^2 xsep^(1/5)`, with the same vanishing bound after
normalization.

The positive densities defining `I,J,S` have the corresponding small
early bounds. Differentiating normalization by
`K_eta=P_* f(eta)` contributes only fixed polynomials in eta. A common
upper bound for every normalized early error through order three is

\[
 10^6(T_{sh}+111)\Delta^2+10^6\Delta< Q^{-1000}<h^3=\epsilon_m.
 \tag{15}
\]

The last inequality follows from (2). It is a continuous integral bound,
not a quadrature residual. The loose `Delta` term covers all positive
powers of the tiny `xsep`, so the uniform upper bound does not depend on
a sampled separation point.

## 8. The actual incoming debt on the whole parameter interval

Let `c=4eta`, `K_eta=P_* f`, so `K_eta>=P_*/2>1/2`. By (7),

\[
 |G_i-c|\le2j=:D_0,\quad
 |(G_i-c)'|\le j=:D_1,\quad |(G_i-c)''|\le j=:D_2.
 \tag{16}
\]

On `-8<log x<-7`, restore `Gi` to `c` with the source smooth cutoff,
keeping `E` ideal. Its eta derivatives are bounded by exactly (16),
because the cutoff depends only on radius. Beyond `x=exp(-7)` the
axial discrepancy is identically zero. The five normalized debts used
by the **new** B.8 certificate are

\[
 d_U=\left(\frac{\Delta M}{X_R K_\eta},
       \frac{\Delta J-c\Delta I}{X_R^{3/2}K_\eta^2}\right),
\]
\[
 d_E=\left(\frac{\Delta I}{X_R^{3/2}K_\eta},
       \frac{\Delta S-2c\Delta M}{X_RK_\eta^2},
       \frac{\Delta C_p}{K_\eta^2}\right). \tag{17}
\]

The weights on `0<x<exp(-7)` have total integral less than one. The
reciprocal `1/K_eta=(1+eta^2)/P_*` has its first two derivatives bounded
by `2/Kmin`, where `Kmin=P_*/2`. Therefore (15)–(16), including all
derivatives of `c` and `K_eta`, give

\[
 \max_{m\le2}\|\partial_\eta^m d_U\|_\infty
       \le14j+\epsilon_m,
 \quad
 \max_{m\le2}\|\partial_\eta^m d_E\|_\infty
       \le184j^2+\epsilon_m. \tag{18}
\]

For the second U row, the ideal part of `H` is
`sqrt(2)K_eta x^(3/5)`, whose primitive factor
`sqrt(2)/(8/5)<1`; the same bounds apply. For the energy row the
essential exact identity is

\[
 U^2-c^2-2c(U-c)=(U-c)^2.
\]

Its second derivative and differentiation of `K_eta^-2` cost at most
`184j^2`; the linear axial discrepancy cancels identically before
differentiation. The `I` and pressure rows consist only of their early
errors, already bounded by (15). This establishes (18) for all eta,
not for an eta-zero jet.

## 9. Feeding the new continuous implicit map

Let `R_U,R_E` be the exact preconditioners stored in the new B.8
certificate. The new checker reads their exact rational entries and
verifies both infinity norms are less than `2^40`. They are independent
of eta after the normalizations (17). Dividing by `mu=h^2` and using
(1), for every derivative order `m=0,1,2`,

\[
 \|R_U\partial_\eta^m(d_U/\mu)\|_\infty
       \le2^{40}(14h^2+h),
\]
\[
 \|R_E\partial_\eta^m(d_E/\mu)\|_\infty
       \le2^{40}(184h^6+h).
 \tag{19}
\]

The outer parameters give `h<2^-200`. The exact rational substitution
at that larger upper endpoint proves both bounds in (19) are less
than `1e-8`. This is the required incoming-data contract of the new
continuous map. Its contraction therefore supplies one unique smooth
five-coefficient correction for every eta in the uniform small box.
It restores all five moments exactly. Equal fields near the patch's
right boundary and the common A.21 axis pressure then give equal
pressure, `Qs`, and `Ns` beyond it by the original Lemma 4.4.

The continuum matrix enclosure and its contraction are executable
evidence. The continuous analytic construction and explicit parameter
expressions above are mathematical evidence; their complete Lean
instantiation is not asserted. The result reaches the new B.8
incoming contract and exact joining at that mathematical level. It
does not prove the later A.7 heat replacement or the global C.12
finite-frequency construction and final endpoint claims.
