# Actual natural coefficients and normalized caller enclosures

This continuation encloses 33 **original scalar expressions**, uniformly on the
original formal eta domain `[-1,1]`, by the explicit rational interval
`[-2^-4096, 2^-4096]`. Their natural operands cover 20 entries of the original
138-call ledger. This does not close any of those whole unscaled kernels and
does not certify a later global chart substitution or either remaining M3 gate.

The new result uses the actual original normalizations. Examples are node3632,
`Lambda^-1*u(4*exp(t1),eta)`, node3637 for `average`, and node3630,
`g(eta)*Phi(4*exp(t1),eta)`. It also covers their existing subexpressions with
eta derivatives of the natural operand through order5. `g*d_eta^m(Phi)` is not
the full product derivative `d_eta^m(g*Phi)`.

## Source and finite coefficients

The complete compressed original source is checked against SHA256
`42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3`.
Its header bytes are compared with the pinned header, and the first 3,612
coefficient-program records are exactly the original raw records. The small
original degree-one coefficient materializer is executed. The global original
producer, old finite cycle, and Windows workflow are not run.

The actual initial coefficients are `Phi_0=1`, `u_0=average_0=0`.
Their eta derivatives of positive order are exactly zero, with zero finite
coefficient rounding error. Thus degree0 is a valid actual finite approximant
for the normalized calls, not a comparison solution.

The nonzero first coefficient is also reconstructed and its expression nodes
are checked directly:

`Phi_1=(-chi + Lambda^-1*L^-1*(Wstar+h*(1-2*eta*Ustar)))/4`.

On the stated domain, `0<h<1/16`, `0<j0<1`, `|Ustar|<=5`, `0<=d<=1`,
`7/8<L<=1`, `|Wstar|<=10`, and `0<=chi<=1`. Consequently the absolute value
of the expression multiplied by `Lambda^-1` is less than13. Since
`Lambda=Q^64>2^16640`, exact integer arithmetic gives

`Phi_1 in [-1/4-2^-4096, 2^-4096]`.

This is a numerical enclosure of the original nonzero finite coefficient,
uniform in eta. It does not claim a tight point value, nor that the first
nonzero `u` coefficient has been evaluated. The latter still contains the
original pressure and its eta derivative.

## Actual radial domain

Node474 is exactly4. Node3628 is the original expression
`Lambda*Xa*exp(t1)=4*exp(t1)`. Pinned parameters give
`Q>2^260`, `log(CSelected)>=Q^200>1`, and
`0<t1=CSelected^-120<exp(-120)<1/8`. The power series inequality
`exp(x)<=1/(1-x)` for `0<=x<1` gives
`4*exp(t1)<32/7<5`. Both original caller radial domains therefore lie in
`[0,5]`; this conclusion does not depend on a floating point evaluation of
the enormous parameters. Eta remains the original formal coordinate2, with
an explicitly required interval contained in `[-1,1]`.

## Complete tail after the original normalization

For radial order0 and eta order `m<=5`, the exact source tail after degree0 is

`Q*rho^-m*t_m(Y)`,

where its first positive term is
`m!*binom(1+m,m)*Y/((m+1)^2*20*4)`, and its ratio bound is
`Y*(m+2)/40`. At `Y<=5` the largest ratio is7/8. The implementation computes
the rational first-term/geometric-ratio bound exactly for each actual call.

The original parameters imply `rho^-1<Q` and `Lambda=Q^64`. Therefore the
tail of an original `Lambda^-1*u` or `Lambda^-1*average` expression is at most
`t_m(Y)*Q^(m-63)`. Its finite approximant is exactly zero. Substitution of
`Q>2^260` gives an exact dyadic bound, and the implemented rational comparison
verifies that it is smaller than `2^-4096` for every certified call.

For the other original normalization, the complete original `g` definition
is retained. Since `0<L<=1`, `0<sigmaStar<1`, and
`2*sigmaStar*|Hstar|<=Hstar^2+sigmaStar^2`,

`|zeta|<=1/(2*sigmaStar)` and `|psi|<=1/(2*sigmaStar)<Q/2`.

The pinned `log(CSelected)` is at least `Q^200`. Thus

`log(g)<=Q^65/2-Q^200<=-Q^199`,

where the last inequality follows from `Q>=2`. As `exp(x)>x` for positive x,
`0<g< Q^-199`. For order0 the actual scaled finite coefficient `g*Phi_0=g`
is enclosed in `[0,2^-51740]`; for higher eta derivatives of Phi it is zero.
The complete normalized tail is bounded by `t_m(Y)*Q^(m-198)`. Exact rational
addition of the finite coefficient enclosure and this tail again lies within
the delivered interval. No decimal underflow is used as proof of zero.

## Remaining unscaled obstruction

The existing general tail certificate cannot certify a small unscaled error
with the retained budgets. At the genuine caller `Y=4`, order `(0,0)`, even
the tail routine's maximum degree10000 gives a first majorant term
`Q/(5^10001*10002^2)>1`. This follows from
`Q>2^(260+64020)` and an exact integer comparison. The finite coefficient
materializer itself supports only degree64.

This is a lower bound on the **computed upper-bound certificate**, not on the
actual error. A sharper source-bound tail, more efficient source-specific
recurrence, or a genuine higher-degree evaluation is still needed for the
unscaled calls. Full global caller substitutions, product derivatives,
remaining source factors, and original pressure numerical enclosures also
remain separate obligations. All original 138 whole kernels remain OPEN.

The scripts record exact inputs, outputs, execution logs, exit codes, and
negative controls. The source and frozen recovery artifacts are unchanged.
