# Actual Picard collar: two ordinary radial jets and two literal averages

This is a new bound application to the unchanged Picard0 source. It reuses the
authenticated all-order common-collar theorem in
`ACTUAL_PICARD_ORIGINAL_NUMERIC_MAJORANT.json`, whose original source and
analytic inputs were already composed. It does not rerun the source producer,
replace the activation by a natural analytic extension, evaluate the enormous
sufficient K-term sum, or close an original M3 acceptance row.

## Actual callers and their domain

The executable checks the original source records, system definition hash,
all selected parameter ASTs, original norm root, diagonal, zero-axis datum,
and first two matrix rows. The four actual caller applications are:

| Actual source caller | Selected source | Native source | Quantity |
|---|---|---|---|
| 29336 | literal integral 29332 | 29331 | average of U(tX, eta) |
| 29436 | literal integral 29343 | 29342 | average of U_eta(tX, eta) |
| 72026 | 72018 | 72018 | first ordinary X derivative of F |
| 72261 | 72257 | 72257 | first ordinary X derivative of U |

The common application domain is the closed actual activation subcollar

`Xa exp(t1/256) <= X <= Xa exp(3t1/256), -1 <= eta <= 1`.

It contains the actual join `Xminus`, source node28814, whose exponent is
`t1/128`. All its X values are strictly larger than Xa, so the old conditional
natural-core Cauchy bound cannot supply this result. Since t1>0 and
`3/256 < 1/64 < 1/16`, the entire subcollar is before the actual Xkeep node28819
and before aSquared node24805. The original smooth-piecewise callers therefore
select the displayed exact branches. No transported condition is imposed on
the t binder: independently, every t in [0,1] satisfies
`0 <= tX <= X < aSquared`. This verifies the complete literal integral domain.
The enclosure is uniform on that continuum, not a grid or a sampled maximum.

## Existing coefficient and value bounds

Write `delta=rho/(1024Q)`, `B=4096 Lambda^2 Q^3/t1`,
`C1=262144 B^2/delta^2`, `loss=delta/8`, and
`M=exp(9 C1^2 aSquared/(2 loss))`, the original source root24848.
The unchanged parameter ASTs give B/delta>1, 0<delta<1, and M>=1.

The retained quantitative source proof, together with the explicit
`actual-background-majorant.mjs` derivation, bounds each matrix row sum by
`512B/delta` and the forcing by `65536B^2/delta^2`. Each is less than C1.
The executable also checks the sharper retained row4/row5 constants
250, 210, 68, 56 and forcing constant40960 against those safe bounds.
These are the actual source coefficients on the whole common radial interval
and the source eta tube; no sampled coefficient is used.

The same actual solution W has max norm at most M on
`0<=xi<=a`, `dist(eta,[-33/32,33/32])<delta/8`.
At every real eta in [-1,1], the eta disc of radius delta/16 is inside this
tube, giving `||W_eta|| <= 16M/delta`. The average value and first eta
derivative are consequently bounded by M and 16M/delta, respectively, since
their literal t integral has length one. The retained all-order smoothness
justifies the fixed-bound eta derivative without imposing a radial analytic
extension.

## Ordinary first radial derivatives on the smooth collar

Let `R=f+A0 W+A1 W_eta`. On the same real common collar,

`||R|| <= C1(1+M+16M/delta) <= 18 C1 M/delta`.

The actual first two rows are `F_xi=W4`, `U_xi=W5`; their A1 and forcing rows
are zero. The actual singular diagonal entries for W4 and W5 are c4=3, c5=1.
The regular zero-axis inverse from the original source gives

`Wj(xi)/xi = integral_0^1 t^cj Rj(t xi) dt`.

Thus, for X=xi^2>0,

`F_X = (1/2) integral_0^1 t^3 R4(t sqrt(X)) dt`,

`U_X = (1/2) integral_0^1 t R5(t sqrt(X)) dt`.

By the existing smooth even extension the identities and bounds also extend
to X=0. Integrating the weights, rather than dropping them, yields

`|F_X| <= 18 C1 M/(8 delta)`,

`|U_X| <= 18 C1 M/(4 delta)`.

These are ordinary radial bounds from the unchanged singular ODE. There is
no radial Cauchy estimate, no division by a possibly zero numeric interval,
and no assumed analyticity of the activation in X. The actual callers72026
and72261 use exactly these jets on the verified strict activation subcollar.

## An explicit finite numeric bound from the unchanged parameters

The executable recomputes the following identities from the original source
constant DAG, rather than accepting new constants:

`C1 = 2^62 Q^264 rho^-2 t1^-2`,

`S := log M = 9*2^138 Q^465 rho^-5 t1^-4 exp(t1/16)`.

Let q=log Q, r=log(rho^-1), tau=log(t1^-1). The unchanged ASTs give

`Q=2^260*4000000*exp(64020T)`,

`rho^-1=2^16*4000000*exp(64016T)`, `T=exp(1048576)+10`.

Consequently Q>2^260, `0<r<q`, and `q<2^16 T`. Here
4000000<2^22, log2<1, T>1, and 260+22+64020<2^16 suffice.
Also `T<2 exp(1048576)`, since exp(1048576)>10.

Put `L=log CSelected=10log(1+Q^300)+Q^200`.
For Q>1, `log(1+Q^300)<1+300log Q<=301Q`.
Since `3010<2^(260*199)<Q^199`, this proves `L<2Q^200`, and hence
`tau=120L<240Q^200`. All these are inequalities for the fixed source numbers.

Using t1<1 and r<q,

`log S <147+470q+960Q^200 <961Q^200`.

The latter absorption uses `617<Q^199`. A single upper bound for all four
target quantities is `H=5 C1 M/delta`, since C1>262144 and18/4<5.
Its prefactor satisfies

`log(5C1/delta) <74+268q+480Q^200 <481Q^200 <S`.

The two last comparisons use `342<Q^199` and
`S>9*2^138*Q^465>481Q^200`. Therefore

`log H <2S`,

`log log H <1+log S <962Q^200 <2^10 Q^200`,

`log log log H <10+200q <2^24 T <2^25 exp(1048576) <exp(1048601)`.

Exponentiating three times after the last inequality gives

`H < exp(exp(exp(exp(1048601))))`.

The output therefore encloses each of the four actual caller quantities
between the negative and positive of that finite constant. This is an exact
numeric-expression enclosure: it contains no unevaluated source parameter,
supremum, coefficient, or source function. Its deliberately coarse endpoints
are represented by four exponentials of one integer, not by an infeasible
decimal expansion. It is not a point evaluation or a requested-precision
Picard approximation.

## Scope and next unresolved operation

Two ordinary first radial native jets and two average-related native calls
now have source-attached, uniformly valid enclosures at genuine activation
callers. This does not certify each native kernel on every eventual global
caller domain. The original 138-kernel whole-completion count is unchanged.

For nodes72136 and72310, the second radial F/U jets require the differentiated
ordinary RHS bounds (including actual coefficient xi derivatives and the
resulting W derivatives), or a validated interval ODE solver over this same
collar. For node87492, the pressure radial jet requires the specific parity
factorization or ordinary derivative bounds of A0[3][0]=node25602 and
forcing[3]=node26395. Narrow values require a validated integration or
accelerated solution algorithm with an explicit arithmetic-error and tail
budget. The literal sufficient-K budget excludes only that direct algorithm;
it is not an impossibility result.

No whole-K/four-axis norm, final global energy, N7-06, or N8-05 is closed here.
