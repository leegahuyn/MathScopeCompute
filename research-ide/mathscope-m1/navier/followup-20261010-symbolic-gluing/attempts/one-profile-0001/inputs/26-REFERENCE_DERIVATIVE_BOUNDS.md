# A computed polynomial upper bound for the actual reference family

## 1. Scope and inputs

This supplies the finite derivative calculation needed in section 2 of
`CONTINUATION_AND_NEW_DEBT.md`. The reference functions are the actual
B.22 continuation of the new Picard limit in `SAME_DATUM_ANALYTIC_AXIS.md`,
with its A.21 pressure. They are not independently supplied input functions.
The resulting common constant is the explicit expression

\[
                       B_{ref}:=Q^{300}.                 \tag{1}
\]

For every `C>=Caxis`, `0<t<=Q^-200`, `X0<=X<=110`, and `|eta|<=1`,
we prove

\[
 1+\max_{0\le m\le3}\sup_{X,\eta}
       \bigl(|\partial_\eta^m p_{1,r}|+
                    55|\partial_\eta^m n_{s,r}|\bigr)<B_{ref}. \tag{2}
\]

Thus a compact supremum is no longer an unevaluated parameter in the
choice of `C` or of the continuation widths. All polynomial calculations
below are recomputed by `check_continuation_debt.py`. Its entries are
ordinary derivative bounds, without factorial normalization. The finite
checker does not replace the analytic and integral arguments that connect
these entries to the actual functions.

The standing inequalities are `Q>=2^260`, `rho^-1<=Q`, `Lambda=Q^64`,
`Phi>=1/4` for `0<=Y<=4.1`, and the bound `Q` on the actual coefficient
norms of both `Phi` and `u`. On the real rectangle `Phi<=2`; this follows
from `f0(Y chi)<=1` and the sharp deviation `29Q^-53`. The reference
source argument first proves the natural nonpositive logarithmic slope.
The B.22 cutoff then preserves the range

\[
                 \tfrac14\le R_r:=F_r/g\le2.             \tag{3}
\]

This use of slope positivity has no circular dependence on the estimate
of `Bref`: the source sign is obtained directly from the sharp axis
deviation and the weighted-chi estimates, before integrated upper bounds
for `p1,r` are used.

## 2. Four parameter derivatives before and after B.22

For `m=0,...,4`, formula (16) in the analytic note gives

\[
 |\partial_\eta^m(\Phi,u)|
 \le Q\rho^{-m}\frac{m!}{(m+1)^2}(200/159)^{m+1},
\]
\[
 |Y\partial_Y\partial_\eta^m(\Phi,u)|
 \le Q\rho^{-m}\frac{41(m+1)!}{200(m+1)^2}(200/159)^{m+2}.
                                                               \tag{4}
\]

The checker evaluates these ten rational coefficients. Each is less
than `2^260`, so every displayed derivative is at most `Q^6`.

Let `a_m` bound `d_eta^m(1/Phi)`. The reciprocal identity gives

\[
 a_0=4,\qquad
 a_m=4\sum_{k=1}^m {m\choose k}Q^6a_{m-k}.              \tag{5}
\]

Differentiating `log Phi` as `Phi_eta/Phi`, and differentiating
`Y Phi_Y/Phi` by the ordinary Leibniz rule, gives the following exact
positive-polynomial bounds. The checker records every coefficient of
every derivative polynomial; their coefficient sums are less than
`2^260`, so a polynomial of degree less than `a` is below `Q^a`.

| Actual quantity | Parameter orders | Upper bound |
| --- | --- | --- |
| `1/Phi` | 0 through 4 | `Q^25` |
| `log Phi` | 0 through 4 | `Q^25` |
| `Y dY log Phi` | 0 through 4 | `Q^31` |

For order zero of the logarithm use `|log Phi|<2`. Higher entries use
(5), so no estimate of a logarithm at a complex zero is assumed.

During the cutoff, write its defining integral exactly as

\[
 R_r(X,\eta)=\Phi(4e^t,\eta)\exp v(X,\eta),
 \qquad
 v=\int_t^{\min(y,2t)}\alpha(u)\,
           Y\partial_Y\log\Phi(4e^u,\eta)\,du,
 \quad0\le\alpha\le1.                                  \tag{6}
\]

Here `y=log(X/X0)` and the formula is used for `y>=t`; for `y<=t`
the reference is the natural profile itself. Since the integration
length is at most `t<=Q^-200`,

\[
       \max_{m\le4}|\partial_\eta^m v|\le Q^{-169}.     \tag{7}
\]

The real value of `exp v` is less than two. Its first four derivatives
are bounded by the Bell polynomials

\[
 2a,\quad2(a+a^2),\quad2(a+3a^2+a^3),\quad
 2(a+7a^2+6a^3+a^4),\qquad a=Q^{-169}<1.
\]

Use the corresponding constants `2,2,4,10,30` as a common upper
derivative jet in (6). The largest product-rule coefficient sum for
`Phi exp v` is `104 Q^6`, which is below `Q^7`. The logarithmic
derivatives in (6) are bounded by `Q^25+Q^-169<Q^32`. This proves,
including the constant continuation after the cutoff,

\[
 \max_{m\le4}|\partial_\eta^m R_r|<Q^7,
 \qquad \max_{m\le4}|\partial_\eta^m\log R_r|<Q^{32}.  \tag{8}
\]

In particular the weaker bound `Q^32` for derivatives of `R_r` itself
is also available. One must not derive that weaker bound by merely
exponentiating the bound on `log R_r`; the short integral (7) is what
makes it valid.

## 3. The common amplitude cancels from radial ratios

For any `s in [0,1]`, put `r=R_r(sX,eta)/R_r(X,eta)`. By (3),
`0<r<=8`. The first three derivatives of its logarithm have absolute
value at most `2Q^32`. Differentiating this ratio as one exponential
therefore gives the explicit derivative bounds

\[
\begin{split}
 |r|&\le8,\\
 |r_\eta|&\le16Q^{32},\\
 |r_{\eta\eta}|&\le16Q^{32}+32Q^{64},\\
 |r_{\eta\eta\eta}|&\le16Q^{32}+96Q^{64}+64Q^{96}.
\end{split}                                                   \tag{9}
\]

Every entry is smaller than `Q^100`. This estimate is uniform down to
`s=0`, where the regular axis factor is `R_r(0,eta)=1`. There is no
reciprocal of a numerically underflowed value of `g` in this calculation.

## 4. Pressure and the literal source derivatives

The phase primitive obeys `|psi|<=34/sigma^2` on the parameter tube.
At the minimum amplitude `Caxis`, and hence at every larger amplitude,

\[
            0<g\le\exp(-30\Lambda/\sigma^2).
\]

The first four derivatives of `log g` are bounded by `Q^70`: they
are `Lambda` times derivatives of the already constructed `zeta`, and
the coefficient-space derivative bound applies through order three.
Bell differentiation of `g`, followed by multiplication by the weaker
`Q^32` bound for the derivatives of `R_r`, gives

\[
        \max_{m\le4}|\partial_\eta^m F_r|<g Q^{313}.
\]

Since `sigma^-2>1` and the exact integer inequality `30^32>32!` holds,

\[
 e^{30Q^{64}}\ge(30Q^{64})^{32}/32!>Q^{2048}.
\]

Thus all four required derivatives of `F_r` are below `Q^-1000`.
The actual forward pressure is `Pi_r=P+integral_0^X F_r^2 dx`.
For its axis datum, the strip estimate `|P|<=5K` gives
`|P^(m)|<=5K m!32^m` for `m<=4`. Consequently

\[
 \max_{m\le4}|\partial_\eta^m\Pi_r|<Q^3,
 \quad\max_{m\le3}|\partial_\eta^m(D_X\Pi_r)|<1.
                                                               \tag{10}
\]

The source terms are precisely the original (4.9):

\[
\begin{split}
 S_{q,r}&=-W_rl_r-h(1-2\eta U_r)-H_{c,r}(\log F_r)_\eta,\\
 S_{n,r}&=-W_rD_XU_r-A(1-2\eta U_r)U_r-H_{c,r}(U_r)_\eta\\
        &\hspace{12mm}-d(\Pi_r)_\eta+4A\eta\Pi_r+2\eta D_X\Pi_r.
\end{split}                                                   \tag{11}
\]

The natural `u/Lambda` term and the cutoff integral give
`|d_eta^m U_r|<=6` for `m<=4`, and
`|d_eta^m D_XU_r|<=1` for `m<=3`. Radial averaging preserves those
bounds. Direct product differentiation of

`W_r=1-2D eta A_X(U_r)-d d_eta A_X(U_r)` and
`H_c,r=D eta+d U_r`

gives derivative jets bounded respectively by
`(19,42,78,126)` and `(7,19,42,78)`. In particular they are below `Q`.
Also `l_r` and its first three parameter derivatives are below `Q^32`,
and `(log F_r)_eta` and its first three derivatives are below `Q^71`.
Inserting these actual bounds into (11) and applying Leibniz's rule
gives

\[
 \max_{m\le3}|\partial_\eta^m S_{q,r}|<Q^{80},\qquad
 \max_{m\le3}|\partial_\eta^m S_{n,r}|<Q^5.             \tag{12}
\]

The checker records the exact nonnegative polynomial for each derivative
of each term. In particular the fourth pressure and axial derivatives
required by the third derivative of the source have been included.

## 5. Continuous integrated source bounds

The original regular integral formulas give exactly

\[
 p_{1,r}(X,\eta)=\frac{X}{L}\int_0^1
        s\frac{R_r(sX,\eta)}{R_r(X,\eta)}S_{q,r}(sX,\eta)\,ds,
 \quad
 n_{s,r}(X,\eta)=\frac1L\int_0^1 S_{n,r}(sX,\eta)\,ds. \tag{13}
\]

All displayed derivatives have uniform continuous bounds on the compact
integration domain, including `s=0`; differentiation under the integral
is therefore justified by those bounds. With `X<=110`, the factor
`X integral_0^1 s ds` is at most 55. The reciprocal identity and
`L>=.998` give the loose derivative jet
`(2,16,272,6912)` for `1/L`. Combining this jet, (9), and the exact
source polynomials (12), the checker proves

\[
 \max_{m\le3}|\partial_\eta^m p_{1,r}|<Q^{200},\qquad
 \max_{m\le3}|\partial_\eta^m n_{s,r}|<Q^7.             \tag{14}
\]

Finally `1+Q^200+55Q^7<Q^300`. This proves (2) for the entire
actual reference family. Every integral estimate is a bound for the
continuous integral; no quadrature grid or finite set of eta values is
used.

## 6. Explicit comparison and width bounds in powers of the final C

With (1), define the final amplitude by

\[
 C=(1+Q^{300})^{10}e^{Q^{200}}.
\]

The elementary inequality `log Q<Q` and `Q>=2^260` imply

\[
 e^{Q^{200}}\le C\le e^{2Q^{200}},\qquad
 Q^{10000}<C,\qquad 10^8<C.                             \tag{15}
\]

For the constants explicitly defined in the continuation note, ordinary
positive-polynomial bounds now give

| Quantity | Bound in Q or C |
| --- | --- |
| `L0=log(110 Lambda/4)` | `<Q^2` |
| `VA=1+Bref+2^20 Bref^2 Lambda^4` | `<Q^857` |
| `Bcmp0=10^6(1+Q^1000+Bref+VA+L0)^4` | `<Q^4001<C` |
| `exp(Lmath)`, where `Lmath=log C+34Lambda/sigma^2` | `<C^2` |
| `Gamma=Bcmp0 exp(Lmath)` | `<C^3` |
| `Kcmp=1000 Gamma^16` | `<C^49` |
| `Vmax=VA exp(2Lmath)` | `<C^5` |

The six positive entries defining `tauBase` are consequently bounded
below by `C^-2`, `C^-1`, `C^-5`, `C^-6`, `C^-6`, and `C^-114`,
respectively. Hence

\[
                 \tau_{base}>C^{-114}.                  \tag{16}
\]

The final selected widths are `t1=kappa0=omega1=omega2=C^-120`, which
satisfy every strict width condition. The earlier uncommitted
least-dyadic draft is superseded by these explicit expressions. No
unknown source norm or integer search remains in this selection.

The comparison polynomial for `v_s-kappa v_r` uses `12 Gamma^6`,
obtained from `p1,r*(t-t0)*(t+t0)`. A smaller power `12 Gamma^4`
would not follow from the displayed bounds on `t0` and its variation;
the correct power is still strictly dominated by `Kcmp=1000 Gamma^16`.

## 7. Two additional input derivatives and the actual B.8 root through order four

For later source jets, the checker repeats the finite table with analytic
eta order five and source eta order four. Formula (4) now has `Q^7` as
an upper bound for the analytic derivatives. The resulting bounds are

| Actual quantity | Orders covered | Bound |
| --- | --- | --- |
| `log Phi`, `Y dY log Phi` | eta 0 through 5 | `Q^36`, `Q^43` |
| `R_r`, `log R_r` | eta 0 through 5 | `Q^8`, `Q^64` |
| `R_r(sX)/R_r(X)` | eta 0 through 4 | `Q^260` |
| `F_r/g` derivative Bell bound before exponential reserve | eta 0 through 5 | `Q^425` |
| `Sq,r`, `Sn,r` | eta 0 through 4 | `Q^90`, `Q^5` |
| `p1,r`, `ns,r` | eta 0 through 4 | `Q^400`, `Q^7` |

Since `2048-425>1000`, the same pressure reserve still works. Thus
`Q^500` is a proved bound for the reference quantity in (2) with
`m<=4`. This auxiliary bound does not replace the already fixed
`Bref=Q^300` used for the first three derivatives. The fourth derivative
of the actual B.26 axial change is below

\[
 10^6 C^{-120}Q^{502}<Q^{-200},
\]

using `C>Q^10000`. Consequently `Gi-4eta` has ordinary eta derivative
bounds `(2j,j,j,j,j)` through order four. The same computation gives
`|d_eta^4 ell_i|<Q^80`. In the early-amplitude proof, differentiating
`E` four times costs at most `Q^324` times a fixed Bell coefficient.
It is absorbed by the same exponential reserve in `Delta`; thus the
normalized early errors through eta order four are below `h^3`.
The reciprocal normalizations and the factor `c=4eta` have bounded
polynomial derivatives of these orders; their fixed coefficients are
included in the factor `10^6` in that estimate.

For the late axial discrepancy `d=Gi-c`, differentiation of `d/K`
gives coefficient bounds `(4,6,10,14,22)j`; differentiation of
`d^2/K^2` gives `(16,48,152,472,1448)j^2`. These are recomputed by
the checker. The second angular-momentum weight has mass less than
one, so the same bound applies there. Therefore the actual incoming
data, after division by `mu=h^2` and the new exact preconditioners,
satisfy for every `m<=4`

\[
 \|R_U\partial_\eta^m(d_U/\mu)\|\le2^{40}(22h^2+h)<10^{-8},
\]
\[
 \|R_E\partial_\eta^m(d_E/\mu)\|\le2^{40}(1448h^6+h)<10^{-8}.
                                                               \tag{17}
\]

The new B.8 operator has constant matrices and quadratic terms after
this normalization. Its derivative inverse is bounded by `1/(1-q_E)`.
Let `U_m,E_m` be upper bounds for the ordinary derivatives of its
actual root. The checker evaluates exactly the recurrence

\[
 U_m=10^{-8}/(1-z_U),\quad
 E_m=\frac{10^{-8}+\mu B_U\sum_{k=0}^{m}{m\choose k}U_kU_{m-k}
       +\mu B_E\sum_{k=1}^{m-1}{m\choose k}E_kE_{m-k}}{1-q_E}
                                                               \tag{18}
\]

for `1<=m<=4`, starting with `U_0=E_0=10^-6`. The constants are the
actual rational values enclosed in the new continuous certificate;
`mu<=2^-400`. Every resulting derivative bound is strictly below
`10^-6`. In deriving (18), the two terms containing `E_0 E_m` are
absorbed in the same invertible derivative that defines `q_E`.
This proves the higher derivative bounds for that same unique root,
without selecting unrelated coefficient functions at different eta.

## 8. Verification boundary

`check_continuation_debt.py` executes the derivative polynomial table,
fresh rational moment-map expansion, sharp source scalar estimates, and
the new B.8 preconditioner/debt comparisons. These are mathematical
upper bounds in the exact positive variable `Q`. They are useful for
the parameter hierarchy and subsequent explicit derivative estimates.
They do not assert that a complete formal Lean construction or every
final modulation interval calculation has already been supplied.
