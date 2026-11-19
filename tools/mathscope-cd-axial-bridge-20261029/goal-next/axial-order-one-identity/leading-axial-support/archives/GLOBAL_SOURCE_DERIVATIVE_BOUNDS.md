# An explicit source envelope for the same premodulation profile

## 1. The fixed member and its interval

Use the unique new analytic solution selected by

\[
j=h^4,\quad\epsilon_m=h^3,\quad\mu=h^2,\quad
B_{ref}=Q^{300},\quad C=(1+Q^{300})^{10}e^{Q^{200}},
\]
\[
t_1=\kappa_0=\omega_1=\omega_2=C^{-120},\qquad X_R=110(CP_*)^{10}.
\]

Continue it by the exact B.22, B.26, and B.34 integrals and the actual
unique root of the new B.8 equations, as proved in the companion notes.
Use the same A.21 pressure throughout. The prescribed outer profile
then agrees exactly, including its pressure and five accumulated moments.

Put `B=1000T`, `X01=XR exp(T+2+60B-25)`, and

\[
x_-=(4/\Lambda)\exp(t_1/16),\quad x_+=16X_{01},\quad J=[x_-,x_+]. \tag{1}
\]

These are the physical radial coordinates in the new C.2 certificate:
I1 is the first reserved interval, with bumps in `9<X/X01<14`.
Later heat compensation is on I2, strictly to the right, so it cannot
change fields or forward integrals on J; its axis pressure is preserved.

Write `y=log X` and let `[f]_n` be the maximum absolute value of every
ordinary mixed derivative `d_y^r d_eta^m f`, `r+m<=n`, on
`J x [-1,1]`. The following one explicit number bounds the actual
input to the later modulation:

\[
                         S=C^{100000}.                 \tag{2}
\]

It bounds E and U through total order four, all moments through order
four, and the shear, stock vector, their reciprocals and derived cone
coordinates through total order three. It also bounds the radial range,
the I1 power-law coefficient and reciprocal through eta order two, and
`lambda^-1`. It does not by itself prove the later loop or finite-frequency
inequalities, and does not instantiate the analytic Lean premises.

## 2. Finite differentiation rules

The checker `check_global_source_envelope.py` propagates ordinary mixed
derivative bounds. For total order n, a product of k factors has
coefficient sum at most `k^n`. All fixed k,n here are at most 12, so
these coefficient sums are smaller than C. Actual finite sums are
included as well. If `[f]_n<=C^b` and `f>=C^-a>0`, the truncated
Taylor identity for a reciprocal gives

\[
                  [1/f]_n<C^{(n+1)a+nb+1}.             \tag{3}
\]

Indeed use `f0^-1 sum_(k=0)^n(-v/f0)^k`, modulo higher-degree
terms; its coefficient sum, including the conversion to ordinary
derivatives, is below C. The same finite Taylor calculation gives
the Bell-polynomial estimate for an exponential, retaining its known
value. It does not exponentiate a large upper bound on `|log E|`.

For the source step, put `f(t)=exp(-1/t^2)`. The exact identities
`f^(k)=f P_k(1/t)` and `P_(k+1)=2z^3 P_k-z^2 P_k'` give degree
at most 24 and coefficient sum below `26^8<2^40` for k<=8.
The bound `sup t^-m exp(-1/t^2)<=12^12<2^44` for m<=24 gives
`|f^(k)|<2^128`. On [0,1], `f(t)+f(1-t)>=exp(-4)>2^-7` and
its derivative bounds are `2^129`. The normalized reciprocal-jet
recursion gives coefficients below `2^(144(k+1))`. Multiplication
and restoration of factorials imply

\[
                  |\sigma^{(k)}|<2^{2048}<Q^8\quad(k\le8). \tag{4}
\]

The checker executes these derivative polynomials and integer bounds.
The flat endpoint extensions follow from the same exponential limits.
A step on a log interval of width t1 has kth derivative below
`Q^8 t1^-k`.

## 3. Reference and shear-control derivatives

The analytic coefficient estimate and the finite Stirling expansion
`(Y dY)^r=sum_k S(r,k)Y^k dY^k` give

\[
 |\partial_y^r\partial_\eta^m(\Phi,u)|<Q^{10}
 \quad(r+m\le8,\ 0\le Y\le4.1).                      \tag{5}
\]

Every rational coefficient used here is evaluated by the checker.
With Phi>=1/4, its finite reciprocal/logarithm jets give `Q^100`
for the nonconstant natural logarithmic input derivatives. The
phase `Lambda psi` has these eta derivatives below `Q^74`, from
the actual coefficient norm of zeta.

Differentiate the defining first derivatives in B.22. For r>=1,
the reference satisfies, on the finite list r+m<=7 needed below,

\[
 |\partial_y^r\partial_\eta^m\log F_r|,
 |\partial_y^r\partial_\eta^m U_r|
       <Q^{110}t_1^{-\max(r-1,0)}.                    \tag{6}
\]

The r=0 derivatives follow from the defining integrals and the
eta-only reference table. Crucially the width exponent in (6) is
one less than the radial derivative order. For each product,

\[
 \sum_i\max(r_i-1,0)\le\max(\sum_i r_i-1,0).          \tag{7}
\]

The finite Bell calculation consequently gives
`Q^900 t1^-max(r-1,0)` for reference field derivatives needed by
the sources. The factor sqrt(2X), X<=110, is included in this Q
budget. Pressure retains the reserve `g<Q^-2048`, absorbing Q^900;
its integral is `integral F_r^2 dx`, including the regular endpoint.

The literal sources (4.9), with their actual averages, satisfy

\[
 |\partial_y^r\partial_\eta^m(S_{q,r},S_{n,r})|
       <Q^{1000}t_1^{-r}\quad(r\le2,m\le4).           \tag{8}
\]

The extra eta derivative of U and pressure is included. For radial
averages use `D_y A_X(U)=U-A_X(U)`; this introduces no additional
inverse width. In Sq, W and Hc have exponent at most 112 and l
and the logarithmic gradient at most 110, so the product exponents
are below 300. The Sn pressure term has the actual integral bound
just proved. The checker includes all coefficients of this finite
source-product count before replacing it by Q^1000.

The eta-only bounds through order four are `p1,r<Q^400`,
`ns,r<Q^7`. Differentiate the exact equations

\[
 D_y p_{1,r}=X S_{q,r}/L-l_r p_{1,r},\qquad
 D_y n_{s,r}=S_{n,r}/L-n_{s,r}.                         \tag{9}
\]

One, two, and three radial derivatives give successive upper
exponents `400,1003,1115,1227`, including mixed eta product
coefficients. Hence

\[
 |\partial_y^r\partial_\eta^m(p_{1,r},n_{s,r})|
 <Q^{3000}t_1^{-\max(r-1,0)}\quad(r\le3,m\le4).       \tag{10}
\]

In B.26 the prescribed derivatives are products of these functions,
cutoff factors, X and kappa. Equations (4),(10) give
`Q^4000 t1^-(r-1)` for the rth radial derivative of log F or U,
through total order four. Their eta-only integral changes through
order four have the sharper `Q^-200` bound in the companion, except
for the eta-independent final slope change. The fixed .8 last
interval has no inverse-width loss.

The exponential derivative through order four uses at most four
factors and obeys (7). The actual field derivatives on this finite
continuation are therefore bounded by

\[
                   Q^{20000}t_1^{-3}<C^{362}.
\]

Here E is already below one, `Q^10000<C`, and `t1=C^-120`.
This uses a finite Bell polynomial and the actual small value of E.
The B.34 cutoff has width Tsh>=1 and endpoint eta derivatives through
order four below Q^80; its exponential remains below one by the
early amplitude bound. The ideal power-law segment and the unit-width
axial restoration have smaller bounds. Thus E,U are bounded by
C^1000 through total order four before B.8.

## 4. The actual B.8 derivatives and the remaining outer part of J

The incoming data are actual functions, not arbitrary smooth inputs.
Section 7 of `REFERENCE_DERIVATIVE_BOUNDS.md` proves their first four
ordinary eta derivatives, after the exact preconditioners and division
by mu, are below 10^-8. Its receipt executes the quadratic implicit
derivative recurrence for the same unique root, obtaining

\[
 |z^{(m)}(\eta)|<10^{-6}\ (1\le m\le4),\qquad |z|\le10^{-6}. \tag{11}
\]

The correction is exactly `deltaU=K mu sum_(j=0)^1 z_j b_j`,
`deltaE=K mu sum_(j=2)^4 z_j b_j`, where K=Pstar/(1+eta^2).
The disjoint bump widths in x=X/XR are 1/4096. The Stirling
expansion for x d_x and (4) bound their first four radial
derivatives by Q^9. K and its first four eta derivatives have a
fixed rational bound times Pstar. Thus every mixed derivative of
the actual correction through total order four is below Q^20<C.
The same certificate proves E/K>1/2 on its supports.

After B.8 the fields and all five moments agree exactly with the new
outer profile. Up to I1 it consists of the initial transition, the
axial cutoff, the entry transition, and the reserved power-law
interval. All these cutoffs have widths at least one, or derivatives
reduced by T. Their eta dependence is the explicit 4eta,
f=(1+eta^2)^-1, and the prescribed exponent interpolation. Repeated
differentiation contributes fixed powers of log f, bounded on the
whole eta interval. Together with the exact E height bound this gives

\[
                         [E]_4,[U]_4<C^{1000}\quad\hbox{on }J. \tag{12}
\]

## 5. Positive lower bounds and the radial range

The expressions give log Q>=64020T and log C>=Q^200.
Since Lambda=Q^64<C, the left endpoint exceeds C^-1. At the
right, `log x_+<10 log C+60021T+10<12 log C`. Therefore

\[
                          C^{-1}<x_-<x_+<C^{12}.       \tag{13}
\]

On the inner continuation, g>exp(-Lmath)>C^-2, R_r>=1/4,
and sqrt(2X)>=sqrt(8/Lambda)>C^-1/2. The actual multiplicative
change from the reference is at least exp(-1), including the fixed
.8 last interval. C>10^8 gives E>C^-3 there. E increases during
the shift and exceeds one on the B.8 supports. Up to I1 the
subsequent outer stages satisfy `log E>=-30001T>-log C`.
This includes the whole decrease over 60B, using lambda*60B<1/2
and Q>=1+64020T. Consequently

\[
                               E>C^{-3}\quad\hbox{on }J. \tag{14}
\]

On B.26, a=kappa p1,r>=C^-120/(4Lambda)>C^-122.
The axial cutoff leaves a unchanged, and its final interpolation
is between positive endpoints obeying this bound. On the shift
a>=.7; on the ideal part a=.8; B.8 changes a by less than mu/4;
the subsequent outer stages have a>=.8. Thus

\[
                               a>C^{-122}\quad\hbox{on }J. \tag{15}
\]

These are proved lower bounds, not uncomputed compact minima.
For the later loop take the left endpoint Xa exp(t1/8), with
Xa=4/Lambda, and the right endpoint XR exp(T+3). Its right collar
lies in Xc exp([1/2,1]), Xc=XR exp(T+2), where U=b=0 and
a=v=2+2lambda. The gap v-2=2lambda is larger than C^-1.
The inner collar gap is supplied by the separate activation proof.
The unmodulated interior can have v<2; four positive admissible
raw gaps there are required only after the loop has been constructed.

## 6. Forward moments and the complete source vector

The axis pressure has eta derivatives through order four below Q^2.
In the core F and its first four eta derivatives are below one.
The pressure contribution from zero to X0 is bounded directly as
`integral F^2 dx`; no singular 1/X bound is used at zero. On
[X0,x_+], use (12), 1/X<C, length<C^12, and sqrt(2X)<C^7.
The five actual densities are

`U`, `sqrt(2X)E`, `sqrt(2X)UE`, `U^2-E^2/2`, `E^2/(2X)`.

Product differentiation and continuous integration give the common
bound

\[
 [M]_4,[I]_4,[J]_4,[S_{moment}]_4,[C_p]_4,[\Pi]_4<C^{2030}. \tag{16}
\]

For positive radial order use D_y integral_0^X f=Xf(X) and
differentiate that identity. The same bound covers all mixed
derivatives. No quadrature residual is used in (16).

Equation (3) gives `[1/E]_3<C^3015`. For H=sqrt(2X)E,
`[H]_3<C^1008`, H>C^-4 and `[1/H]_3<C^3050`.
Insert these bounds into the complete original formulas

\[
 p_1=L^{-1}[-XW+H^{-1}((1-h)I-D\eta I_\eta-dJ_\eta
                                      +2(h-D)\eta J)],
\]
\[
 p_2=(LE)^{-1}[-XWU+D(M-\eta M_\eta)+4h\eta S_{moment}
       -d(S_{moment})_\eta+X(4A\eta\Pi-d\Pi_\eta)].      \tag{17}
\]

In particular the axial numerator contains -XWU. The checker
expands these exact polynomials and includes the mixed product
coefficients through total order three, obtaining
`[p1]_3,[p2]_3<C^8000`.

The remaining table follows from the definitions and (3).

| Actual quantity | Bound through total order three |
| --- | --- |
| a=1-2(D_yE)/E and b_s=2(D_yU)/E | C^5000 |
| 1/a using (15) | C^16000 |
| t_s=-b_s/a | C^21002 |
| v_s=a+b_s^2/a | C^26004 |
| Pc=p1+t_s p2 and Jc=p2-t_s p1 | C^29004 |

Every entry is below S. At I1 its exact coefficient K and reciprocal
through eta order two are below C^3, using its displayed amplitude
and f. Also lambda^-1=exp(1000T)<Q<C. The factorially weighted
eta norms used by C.12 are at most four times these ordinary
derivative bounds, and hence also below S with the displayed slack.

## 7. Verification boundary

The global source receipt binds the new outer source, the one final
C and widths, the actual higher B.8 root receipt, and this proof.
The checker evaluates all finite derivative coefficients and exponent
comparisons. No generic input norm or unevaluated compact maximum
defines S. Cone gaps and the loop/frequency construction are separate
and must use this same profile. The receipt does not mark the
original analytic Lean premises as proved.
