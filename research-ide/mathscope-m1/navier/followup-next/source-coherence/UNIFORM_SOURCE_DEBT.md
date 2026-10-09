# One source profile: exact bounds before five-moment repair

## Scope and current proof status

`derive_uniform_debt.py` computes a single set of parameters from the actual
A.21 source pressure with `logP=14`, its exact binary64 value of `h`, `j0=3/100`,
and the already generated coefficient-space bounds. It selects `t1`, `kappa0`,
`Tsh`, and then a larger `logC`, in that order. All operations deciding a scalar
inequality use Python `Fraction`.

The resulting profile is a mathematically specified **analytic** profile. The
axis is the unique fixed point corresponding to the new amplitude. B.22 and
B.26 are exact integrals of that axis and its reference controls; B.34 is the
source exponential interpolation. It is not the old Float64/RK4 profile, and
its radius is not a representable ordinary floating-point radius. The new
`axis-prefix-common-profile.json` uses the same larger `logC` to compute directed
intervals for finite radial/parameter coefficients.

The finite scalar checks, the calculus argument below, and Lean proofs are
three different evidence layers. The existing source coefficient certificate
contains a published-theorem reference and exact scalar upper bounds. Its
generated analytic premise bundle has not been assembled as a new Lean proof.
Consequently this document does not label the whole construction `FORMAL PASS`
or claim a completed global leading profile. No missing estimate is declared
true by an axiom.

## Source anchors

The pinned source commit is `f9e8bc5b38b6e212696e8a30e3e91517af887bbd` in
`openai/NavierStokesAndEuler`. The supplied paper has SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.

| Step | Paper anchor | Lean/source anchor | Evidence still needed for a new end-to-end kernel proof |
|---|---|---|---|
| Coefficient bounds | pp.145–148, B.4–B.16 | `AxisCoefficientSpace.axisSpace_derivative_bound`; `AxisEvaluation.mixedSeries_uniform`, `mixed_derivative_profile`; `AxisContraction.exists_unique_natural_fixedPoint` | Instantiate the actual A.21 functions and generated analytic bounds in those types. |
| Smooth, correctly differentiated axis | p.147, B.12–B.15 | `NaturalAxisBridge.integrated_solution`, `pressure_equation`, `pressure_integral`, `exists_scaled_profiles` | Identify each interval prefix with the coefficients of this particular fixed point in Lean. |
| Actual zero leading core residual | pp.25–28, 4.5–4.16 | `NaturalCoefficientBridge.zero_of_natural_germs`, `fromNatural_primitives_and_stresses_zero` | Supply the actual natural-profile germ and its retained constants. |
| Reference and continuation | pp.150–153, B.22–B.27 | `followup-construction/controlled-continuation.mjs`, functions `buildReference`, `controls`; this note replaces RK4 values by the exact defining integrals for the new profile | Formalize the concrete reference integrals and the uniform estimates below. |
| Transition and normalized moments | pp.154–157, B.34–B.40; pp.127–128, A.2–A.3 | `followup-construction/source-inner-gluing.mjs`, functions `prepareSlice`, `solvePatch`; `uniform-gluing/uniform-moment-certificate.json` | Link the exact continuum map and exact analytic debt functions to one parameterized root. |

The theorem names identify source mathematics. Merely importing them is not a
proof that a numerical array has those properties.

## 1. Derivative bounds from the same coefficient norm

Write `rho` for the generated coefficient radius, and `M` for the generated
bound for both components of the fixed point. For `0<=Y<=R=41/10`, set
`q=1-R/20`. The B.4 coefficient weight implies, for `k,m>=0`,

\[
|\partial_Y^k\partial_\eta^m F(Y,\eta)|
\le B_{km}:=
\frac{M(k+m)!}{20^k\rho^m(m+1)^2q^{k+m+1}}.
\]

Here `F` denotes either normalized component `Phi` or `u`, not the physical
azimuthal scalar. To derive this bound, differentiate the absolutely convergent
power series term by term, retain the factor `(m+1)^-2`, and bound
`(n+1)^-2<=1`. Differentiating
`sum_n binom(n+m,m) z^n=(1-z)^(-m-1)` gives the stated sum. The uniform
convergence and parameter derivatives are justified by the coefficient-space
evaluation theorems above. All four needed numbers `B00,B10,B01,B11` are
computed, rather than inferred from samples.

Let `cPhi>0` be the source certificate's uniform lower bound for `Phi`. Define

\[
B_s=R B_{10}/c_\Phi,\qquad
B_{s\eta}=R(B_{11}/c_\Phi+B_{10}B_{01}/c_\Phi^2).
\]

These bound `DY log Phi` and its parameter derivative. The exact generated
`Lambda` satisfies `B00/Lambda<j0/100`. It also makes the required parameter
derivative errors smaller than one; the script checks that separately.

## 2. B.22 reference on the entire parameter interval

The reference is the source field up to the axis joining point `X0=4/Lambda`.
On the following logarithmic interval its log-F and U derivatives are multiplied
by a smooth cutoff between zero and one. They vanish after `2t1`. Use

\[
2t_1 B_s<1,\quad 2t_1 B_{s\eta}<1,
\quad 4e^{2t_1}<4.1.
\]

The last inequality is checked using `e^x<=1/(1-x)` for `0<=x<1`, so no numerical
exponential is used. It keeps every source evaluation inside the known axis
rectangle.

Write `Zeta` for the source complex bound on `zetaStar`. The reference satisfies

\[
|U_r|\le5,\quad |\partial_\eta U_r|\le5,\quad
|D_X U_r|\le R B_{10}/\Lambda,
\]

and

\[
|\partial_\eta\log F_r|\le
J:=\Lambda\,\mathrm{Zeta}+B_{01}/c_\Phi+1.
\]

For fixed eta, the ratio between any earlier positive F and its current
reference value is at most `3 B00/cPhi`. This follows from the core bounds
`cPhi<=Phi<=B00`, the common positive amplitude, and `exp(1)<3` over the
reference cutoff. No lower floating-point approximation to the amplitude is
needed.

The later choice of C ensures `F_r<=1` everywhere up to X=110. Hence the forward
pressure and its eta derivative satisfy

\[
|\Pi_r|\le P_b+110,\qquad
|\partial_\eta\Pi_r|\le P'_b+220J.
\]

These are the integrals of `F_r^2` and `2F_r^2 partialEta(log F_r)` from zero;
`P_b,P'_b` are the actual A.21 source bounds. Since `|W|<=11` and `|Hc|<=6`,
the source terms obey

\[
|S_q|\le11(1+B_s)+11/100+6J,
\]

\[
|S_n|\le11R B_{10}/\Lambda+60+P'_b+220J
+3(P_b+110)+220.
\]

The integral forms (4.10) therefore give

\[
|p_{1,r}|\le\frac{110}{2L_{min}}
\frac{3B_{00}}{c_\Phi}\,\sup|S_q|=:P_1,
\qquad |n_{s,r}|\le\sup|S_n|/L_{min}=:N_s.
\]

The factor 1/2 in the Qs bound is the integral of the radial weight `s` on
`[0,1]`. Set `V=55 Ns`; this bounds `X ns/2` up to X=110. These bounds concern
the actual defining integrals, not a mesh of reference samples.

## 3. Uniform B.26 controls and the order of choices

Let `T` be an integer greater than `log(110 Lambda/4)`, computed from the bit
length of an integer ceiling. This is valid because `log(2)<1`. The script
chooses positive exact `t1,kappa0` with

\[
t_1 P_1\le1/100,\quad \kappa_0TP_1\le1/100,
\quad t_1V\le j_0/100,\quad\kappa_0TV\le j_0/100.
\]

The B.26 activation satisfies
`0<kappa<=kappa0+(1-kappa0) 1_[0,t1]`, so its integral over the logarithmic
radius is at most `t1+kappa0 T`. Multiplying by the reference bounds and
integrating the exact ODE gives

\[
|U-4\eta|\le j_0+B_{00}/\Lambda+
(t_1+\kappa_0T)V\le2j_0=:D_U
\]

throughout the core and continuation. The final axial cutoff only reduces the
integrand's absolute value. The final transition to `a=.8` has log-radius
length less than `1/10`, so its extra contribution to log-F is at most `1/20`.
The displayed `delta_log_f` bound remains below one. This also justifies the
coarse reference and endpoint ratio estimates used above.

At Xi=110, `ell_i=log C+log E_i`. Uniformly in the later C, it obeys

\[
|\ell_i|\le B_\ell:=\Lambda B_{phase}+B_{00}+1/c_\Phi+111.
\]

For the phase, the source proof bounds the modulus of the integral along a
path in its convex complex tube by the path length times the bound on
zetaStar. For the other factors use `|log Phi|<=Phi+1/Phi`, `sqrt(220)<15`,
and the log-F change just bounded. The script first chooses `Tsh>=1000(Bell+1)`.
It then chooses C larger than the old normalization threshold and large enough
for the small-amplitude estimates in the next section. This has no circular
dependence: the coefficient bounds hold uniformly for all larger C. Increasing
C changes the fixed point; the new prefix is recomputed for that new amplitude.

## 4. Early moment errors, including the pressure integral

Choose a positive dyadic `delta=2^-B`, with B larger than the bit length of
`Tsh+111` plus 256. The actual chosen `logC` enforces

\[
E\le\delta\text{ on }0<X<X_{sep},\quad
F\le\delta/\sqrt{220}\text{ on }0<X\le110,
\quad x_{sep}:=X_{sep}/X_R\le\delta^{10}.
\]

For the core and B.26 field, bound
`E<=45 B00 exp(Lambda Bphase-logC)` using the estimate above. The script uses
`log(45 B00)<=45 B00`, a deliberately conservative sufficient condition. For
B.34, use

\[
\log E=-\log C+y_i/10+(1-\sigma)\ell_i+\sigma\log f
\le-\log C+T_{sh}/10+B_\ell.
\]

Finally, `log xsep=Tsh-10(logC+14)`. Exponential upper bounds are obtained from
`exp(-B)<=2^-B`; no extremely small quantity is set to zero.

Pressure requires separate treatment at X=0. In the core and continuation,
the exact integrand is `F^2`; hence its integral is bounded by `110 delta^2`
(a weaker bound than the displayed F estimate). On the B.34 interval the
logarithmic pressure density is `E^2/2`, giving `Tsh delta^2/2`. The normalized
ideal pressure primitive is `(5/2)xsep^(1/5)`, bounded by `(5/2)delta^2`.
Thus a bound such as `(Tsh+121)delta^2` controls the normalized pressure
discrepancy. The I and S energy discrepancies follow by integrating their
positive absolute densities. The code checks these bounds are all below
`epsilon=2^-128` before it substitutes epsilon into the final vector.

## 5. The exact all-eta debt vector entering the continuous map

Put `c=4eta`, `K=P*/(1+eta^2)`, so `K>=exp(14)/2`. The source B.34 field
becomes exactly `K x^(1/10)` by `xsep`; U is then restored from Gi to c on
`-8<log x<-7`. Consequently `U-c=0` beyond `exp(-7)`, and `|U-c|<=DU` at
every earlier radius. The normalization used by the certified map gives

\[
|d_{M/K}|\le (D_U/K_{min})e^{-7},
\]

\[
|d_{(J-cI)/K^2}|\le
(D_U/K_{min})\frac{15}{16}e^{-56/5}+\epsilon,
\]

\[
|d_{I/K}|\le\epsilon,\qquad
|d_{(S-2cM)/K^2}|\le(D_U/K_{min})^2e^{-7}+\epsilon,
\quad |d_{Cp/K^2}|\le\epsilon.
\]

For J use `sqrt(2)/(8/5)<15/16`. For S, the identity
`U^2-c^2-2c(U-c)=(U-c)^2` removes the linear U error. The pressure row has no
U term. The bounds for exp(14), exp(7), and exp(56/5) use positive rational
Taylor partial sums; reciprocals of the latter lower sums give upper bounds.

Multiplication by the **exact preconditioner matrices** from the continuous
B.8 certificate yields, for this single source profile and every eta,

- U rows: at most `3.84275420594e-6` and `3.50094039773e-6`;
- E rows: at most `7.27632295751e-12`, `1.61240982185e-11`, and `8.78296376644e-12`.

The exact rational values, source hashes, and all checks are in
`uniform-source-debt.json`. The input profile is continuous and smooth in eta
because its analytic axis, the fixed cutoffs, and its finite defining integrals
are smooth; the continuous implicit-function construction then uses the same
normalized quadratic map on the whole parameter interval. The required
uniqueness and small-ball derivative bounds belong to the independent
`uniform-gluing` certificate, not to a set of three sampled Newton solves.

## 6. What this does not yet establish

This calculation reaches the B.8 debt admissibility condition for one precisely
specified analytic construction. A source-level audit must still establish that
every computational bound used here is the corresponding Lean premise for the
chosen source functions. It also does not prove the whole profile's strict
cone, complete the outer A.4/A.7 repairs, or certify the C.12 modulation and its
parameter derivatives. Those are different mathematical obligations. In
particular the C2 certificate for a different lambda cannot be reused for this
profile's exact lambda.

The old finite-core polynomial has a demonstrably nonzero stress numerator.
Its residual cannot be replaced by exact zero or hidden by the flat cutoff.
The zero-core-stress claim in this note concerns the source analytic fixed
point under its stated theorem/premise boundary.

## 7. A second, smaller j0 and actual first parameter derivatives

The first `j0=3/100` calculation is preserved. It passes the continuous moment
map test, but its resulting shear bound is too large for B.36's requirement
`|bs|<=.1/(1+w*)`. The independent ideal-reference bound gives
`w*<=120081080.49`, hence a permitted shear of about `8.33e-10`. Therefore the
analytic axis producer was **actually rerun** at `j0=1/10^10`, giving a new
sigma, a new 151-digit Lambda, and a new coefficient radius. The whole bound
chain was rerun for those inputs; no j0=3/100 axis was silently retained.

The outputs are `source-axis-small-j-trial.json`,
`uniform-source-debt-small-j.json`, and
`axis-prefix-common-small-j.json`. The last file is a newly computed 1024-bit
directed interval prefix for the new, larger C chosen after Tsh. The source's
`h`, `lambda`, and A.21 pressure parameters stay exactly bound to this profile.

For the C1 extension, also form B02 and B12 using section 1. The second eta
derivative of the logarithmic radial slope is bounded by

\[
B_{s\eta\eta}=R\left(
B_{12}/c_\Phi+2B_{11}B_{01}/c_\Phi^2
+B_{10}B_{02}/c_\Phi^2+2B_{10}B_{01}^2/c_\Phi^3\right).
\]

Cauchy's estimate for zetaStar on the same source tube, with circle radius rC,
and the twice-differentiated logarithm give the reference bound

\[
J_2=\Lambda\,\mathrm{Zeta}/r_C+B_{02}/c_\Phi
+(B_{01}/c_\Phi)^2+1
\quad\text{for }|\partial_\eta^2\log F_r|.
\]

The code now also imposes `2t1 BsEtaEta<1` and
`|partialEta^2 U_r|<=B02/Lambda+2t1 R B12/Lambda<1`. Differentiating the actual
source quantities gives `|W_eta|<=21`, `|Hc_eta|<=16`, and

\[
|S_{q\eta}|\le21(1+B_s)+11B_{s\eta}+1/5+16J+6J_2.
\]

The common amplitude cancels from `F_r(sX)/F_r(X)`. Its first derivative is
bounded by `ratio*(2 B01/cPhi+2)`, avoiding an artificial factor Lambda in
that ratio. Differentiating the integral formula for Qs and then `p1=XQs/L`
gives the `p1EtaBound` stored in the JSON.

For the pressure, direct differentiation of the actual A.21 kernel gives the
conservative bound `|P0''|<=28 massUpper`. For the forward reference pressure,

\[
|\Pi_{r\eta\eta}|\le28P_b+220J_2+440J^2.
\]

This follows from `(F^2)''=2F^2(log F)''+4F^2((log F)')^2` and the 110-unit
physical radial interval. A product-rule bound for Sn is

\[
\begin{split}
|S_{n\eta}|\le{}&21R B_{10}/\Lambda+11R B_{11}/\Lambda+300\\
&+2P_{r,1}+P_{r,2}+3(P_{r,0}+P_{r,1})+220+440J,
\end{split}
\]

where `Pr,0=Pb+110`, `Pr,1=P'b+220J`, and `Pr,2` is the previous bound. All
derivatives here are at a fixed X. Thus
`NsEta<=SnEta/Lmin+4h Sn/Lmin^2` bounds the derivative of ns. The new t1 and
kappa are selected against both `P1+P1Eta` and `V+VEta`. The exact B.26
integral now proves, for all eta,

\[
|\partial_\eta(G_i-4\eta)|
\le B_{01}/\Lambda+(t_1+\kappa_0T)V_\eta\le j_0=:D_1.
\]

The early B.34 moments also have controlled eta derivatives. The endpoint
`ell_i'` is at most J: the initial logarithm contributes
`Lambda zeta+Phi_eta/Phi`, while the B.26 integral contributes at most one
by the new p1Eta selection. In B.34,
`|(log E)_eta|<=J+1`. C is enlarged further so that
`(Tsh+121)delta^2(1+10J+10J2)<epsilon`. This covers both the earlier value
errors and the needed first eta derivatives, including derivatives of
normalization by K. The constant is deliberately conservative and checked
exactly. No Cauchy bound is applied to the entire leading term `4eta+j0`;
its derivative 4 is removed before estimating the correction.

Since `|K'/K|<=1`, the first derivatives of the normalized debt vector satisfy

\[
|d'_{M/K}|\le(D_1+D_U)e^{-7}/K_{min},
\]

\[
|d'_{(J-cI)/K^2}|\le
(D_1+D_U)(15/16)e^{-56/5}/K_{min}+\epsilon,
\]

\[
|d'_{I/K}|,|d'_{Cp/K^2}|\le\epsilon,\qquad
|d'_{(S-2cM)/K^2}|\le
2D_U(D_1+D_U)e^{-7}/K_{min}^2+\epsilon.
\]

These exact C1 bounds are exported for the independent normalized implicit
map. With the new j0, the C0 preconditioned bounds are approximately
`1.28092e-14` and `1.79184e-28`, and the C1 vectors are in the same file.
The changed profile must pass all later ideal-field, perturbation, and cone
requirements on its own; passing this smaller moment-map ball alone is not a
whole-profile cone certificate.
