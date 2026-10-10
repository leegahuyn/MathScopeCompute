# Evaluated normalized core values for the same infinite profile

## Exact meaning of these finite arrays

The fixed point, pressure and scalar choices are those in
`SAME_DATUM_ANALYTIC_AXIS.md`, with the final choice `j=h^4` and the common
amplitude `C`. The finite interval arrays in this directory enclose specified
evaluations of that infinite core. They are not a new core definition and
are not a substitution of the comparison Bessel function for the nonlinear
solution. The positive nonlinear displacement, the entire radial tail and
every arithmetic rounding error remain in each applicable interval.

Write `K=Pstar^2`, `Y=Lambda X`, `g=exp(Lambda psi)/C` and use the actual
normalized unknowns `Phi,u,p` from equations (18)--(24) of the axis note.
All statements below are at `eta=0`, for `0<=Y<=41/10`, and include the
first two radial derivatives where recorded. At this parameter value

\[
 g=1/C,\quad H_*=j,\quad
 \chi=\frac{4000000}{4000001},\quad
 Z_*=-(A+4)j,\quad L=1.
 \tag{1}
\]

The comparison polynomial is

\[
 q_{24}(Y)=\sum_{n=0}^{24}\frac{(-\chi/2)^nY^n}{n!(n+1)!}.
 \tag{2}
\]

Its coefficients are exact rational numbers. This is a comparison
polynomial, while the exact nonlinear radial recurrence is retained in
`axis-symbolic-jet-N24.json`. Their relation is the proved invariant-ball
displacement `epsilon=29 Q^-53`; coefficients are not assumed equal.

## 1. Parameter derivative and the actual pressure input

Differentiating the complete expression for `Z_*` at zero gives

\[
 Z_*'(0)=-20+2Aj^2-\Pi_0''(0)+4A\Pi_0(0).
 \tag{3}
\]

Here `A+D=1`, `U_*'=4`, `H_*'(0)=D+4`, `d'(0)=L'(0)=0`, and
evenness gives `Pi_0'(0)=0`. Thus the comparison axial functions and their
averages have the exact normalized coefficients

\[
 \frac{u_{ref}}j=\frac{A+4}{2}Y,
 \qquad\frac{(u_{ref})_\eta}K=B_PY,
 \quad B_P=\frac12\left(\frac{20-2Aj^2}K+
          \frac{\Pi_0''(0)}K-4A\frac{\Pi_0(0)}K\right).
 \tag{4}
\]

The two pressure derivatives in (4) use the accepted continuous A.21
pressure interval and its analytic error from `PRESSURE_DATUM_INTERVAL.md`.
They are read from `attempts/pressure-datum-0001/receipt.json`; the rejected
prefix attempt is not accepted as an input. The exact parameters satisfy
`0<h,j^2,K^-1<2^-2048` because `T>2^39`. For evaluation these positive
expressions are enclosed by `[0,2^-2048]`. The lower endpoint of an
enclosure is not a replacement of the exact positive parameter by zero.

## 2. Uniform nonlinear and radial-tail errors

The actual difference `(Phi,u)-(f0(Ychi),u_ref)` has coefficient norm at
most `29Q^-53`. Since `j>Q^-1/2`, `rho^-1<=Q`, `K>=1`, and averaging
does not increase this norm, the normalized errors for `u/j`, `u_eta/K`
and the average `B_eta/K` are bounded by `29Q^-52` after coefficient
evaluation. For an order-`k` radial derivative, `k<=2`, the following
coarser common expression suffices:

\[
 e_{u,k}(Y)=29\,2^{-13520}\frac{k!}{20^k(1-Y/20)^{k+1}}.
 \tag{5}
\]

For one eta derivative the coefficient weights contain
`(n+1)/(4(n+1)^2)<=1`, so (5) indeed covers the differentiated series.
The exact averaging factor `1/(n+1)` only improves it.

For `Phi`, add the same-axis nonlinear evaluation error to the Bessel
tail of (2). The first omitted differentiated term is divided by
`1-chi Y/[2(26-k)27]`, with `n=25` and `k<=2`. This proves a bound for
the entire infinite tail. The implementation also records uniform
versions at `Y=41/10`, where the positive majorants are largest.

## 3. Reconstruction and the normalized pressure primitive

The exact core identities imply

\[
 \frac{CE}{\sqrt{2X}}=\Phi,\qquad
 \frac{\Lambda(U-j)}j=\frac uj,\qquad
 \frac{\Lambda(U_\eta-4)}K=\frac{u_\eta}K,
 \tag{6}
\]

\[
 \frac{\Lambda}{K}\left(\frac{V_0}{X}+4\right)
       =-\frac{B_\eta}K,\qquad
 C^2\Lambda(\Pi-\Pi_0)=\int_0^Y\Phi(s,0)^2\,ds.
 \tag{7}
\]

At `X=0`, ratios in (6)--(7) mean their regular analytic extensions;
the code never divides an evaluated zero by zero. The pressure comparison
is the exact integral of the degree-48 polynomial `q_24^2`. Its
coefficients are obtained by a full convolution of (2), with no numerical
quadrature. If `delta_k` bounds `Phi^(k)-q_24^(k)` uniformly, the absolute
sum of the polynomial coefficients proves `|q_24|<4`, `|q_24'|<2`
on this rectangle. The axis proof gives `|Phi|<2`. Consequently the
pressure-comparison errors are bounded respectively by

\[
 25\delta_0,\quad 6\delta_0,\quad4(\delta_0+\delta_1)
 \tag{8}
\]

for radial orders zero, one and two. These bounds enclose the actual
nonlinear pressure primitive; they do not just test its defining
derivative numerically.

The exported radial-velocity comparison is `-B_PY/2` and uses (5),
because the average of the linear function in (4) is `B_PY/2`.
The pressure datum itself and its second derivative are evaluated using
the actual normalized intervals, so this also checks a nontrivial
parameter derivative of the core rather than only its eta-zero value.

## 4. What was executed and what remains open

The producer evaluates all five normalized functions at
`Y=0,1,2,4,41/10`, with radial orders zero, one and two. Every finite
polynomial value is computed with directed 256-bit dyadic intervals and
independently with exact rational interval arithmetic. The latter is
checked to lie in the rounded interval before analytic errors are added.
Input uncertainty, measured rounding enclosure and the positive analytic
error are separately recorded.

This closes a concrete finite-value/derivative comparison for the same
infinite core and pressure datum. It does not evaluate the entire
nonlinear eta-jet graph at every eta, and it does not provide the Lean
proof terms instantiating the original analytic hypotheses. Those
stronger original gate requirements remain separate. The leading
incompressibility and tangential identities are derived in the axis
note; no claim is made that axial viscosity or the full Navier--Stokes
residual vanishes.
