# Independent review of the quantitative C.1 loop selection

## Reviewed inputs and conclusion

Reviewed source:
`../followup-20261010-symbolic-gluing/QUANTITATIVE_LOOP_SELECTION.md`,
SHA-256 `937cfaace88466009c5f47a763e0f983d983c350fd754cd4cc57ad148d5897e6`.
The source includes the added full-family verification of (C.8).

Primary mathematical source: user-supplied 166-page paper, SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`,
pp.31, 38, 158–162, especially (4.35) and (C.4)–(C.10).

No blocking defect was found in the variance bracket, the signed-root
derivative bound, or the strict loop cone margins. They are quantitative
selection results for the original exponential loop, conditional on the
listed bounds for one actual fixed source. They do not supply that source,
its derivative bounds, a finite modulation N, or an actual modulation debt.

## 1. Variance estimate

For small positive z, the identity `E[sin(theta)]=0` and Cauchy–Schwarz
give `Var(exp(z sin(theta))) >= 2 E[sin(theta) exp(z sin(theta))]^2`.
The latter mean is at least `z/2` by the positive odd-power expansion.
The geometric estimate for M(1) is valid: the term at k=2 is 1/64,
and the subsequent term ratio is at most 1/36 and decreases. Its stated
upper bound has square below 2. Thus `R(z)-1 >= z^2/4` on [0,1].
Evenness handles negative z without a sign reversal.

For z>=1, the upper Gaussian comparison for M(z) and the lower integral
over `[0,1/sqrt(z)]` for M(2z) use the correct normalized measure 1/pi.
Their constants give `R(z)>sqrt(z)/6`. Subtracting 1 is justified with
the stated threshold z=144. On `[1,144]`, monotonicity from (C.6),
combined with the z=1 bound, gives `R(z)-1>=sqrt(z)/48`. Both branches
therefore imply the weaker common `sqrt(z)/64` lower bound.

The variance at p=0 is exactly `d0^2 mu^2/2`. The displayed small-argument
branch is a valid weaker bound at that point. No division by zero is used.

## 2. Uniform bracket

The second term in mu_max exceeds `4/(d0 sqrt(a_-))`, which gives
`V>4/a_-` in the small-argument branch. In the large-argument branch,
the third term gives
`sqrt(mu)>256(1+P)^(3/2)/(a_- d0^2)`.
Substitution into the variance bound yields `V>4/a_-` for every
nonzero `|p|<=P`. If P=0, only the first branch is used. Thus the
bracket is strict everywhere and covers the source's `0<=rho<3`.

The bracket is an exact finite positive expression. Its size can be
enormous; neither binary64 infinity nor a replacement finite float is
required by this argument.

## 3. Signed square root and parameter endpoints

For the tilted probability density, the lower bound `exp(-2|z|)` is
valid because both numerator and normalizing mean lie between
`exp(-|z|)` and `exp(|z|)`. Minimizing the weighted square in the
variance formula after this lower bound gives
`g''(z)>=exp(-2|z|)/2`.

For z=mu p, the difference `g'(2z)-g'(z)` integrates g'' along an
interval of length |z| contained in `[-2Z,2Z]`. This gives
`V_mu>=d0^2 mu exp(-4Z)`, including p<0 after accounting for both
signs. At p=0, direct differentiation gives the stronger
`V_mu=d0^2 mu`.

The divided-difference form of the original loop gives
`sqrt(V)<=2 d0 mu exp(2Z)`. Dividing by `2 sqrt(V)` for mu>0
therefore gives `W_mu>=d0 exp(-6Z)/4`. At mu=0 the exact derivative
`d0/sqrt(2)` is positive and larger. This is the appropriate equation
for smoothness at zero variance; differentiating V directly there
would have a zero Jacobian.

## 4. Full auxiliary family and four cone gaps

The strengthened input choice `c_s-2>=4d0` is compatible with the
original choice `d0<(1/2) min(c_s-2)`. The original exact formula
gives `c(t)>=c_s-d0>=2+3d0` for all mu in the bracket.

The added paragraph checks (C.8) before solving the variance equation.
At `v=2+delta_L`, its inequalities give `c-v>=2d0` and a strict
quadratic gap above `4d0^2`. Since v>2 and c>v, the equivalent
quadratic cone test in Lemma 4.5 gives `U(c,j)>2+delta_L` on the
whole auxiliary family. No unproved compact minimum is substituted.

On the active cutoff, `v>=2+delta_L/8`, `v<=2+delta_L/2`, and
`c-v>=5d0/2`. The quadratic gap is at least `21d0^2/2`, which
exceeds the retained lower bound `4d0^2`. The shear a_L is at least
`2/(1+T_*^2)`. Off the cutoff the loop is the original shear, and
the source's actual `a_-`, `m_c`, and `m_q` apply. The displayed
kappa_L is therefore a lower bound for all four components of Psi.

The fixed boundary collars remain unchanged because delta_L is at
most half their lower bound for `v_s-2`. The original circle
reparametrization has a strictly positive derivative and exactly
normalizes the mean; it is not replaced by an unweighted average of
the resulting shear vectors.

## 5. Scope of this independent review

The accompanying exact-fraction checker verifies the rational constants
and records this source hash. The calculus, integrals, monotonicity,
and implicit-function arguments are reviewed in this document. Its
finite check count is not a Lean proof of those statements.

The required whole-domain source and derivative bounds are still
inputs. Merely naming them as finite compact suprema does not satisfy
the blueprint's computational gate, which requires actual quantitative
intervals (blueprint pp.55–56, 78; handoff p.10). This review does not
promote N3-06 or declare the full final profile complete.
