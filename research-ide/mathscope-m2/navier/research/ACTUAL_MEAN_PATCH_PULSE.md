# Actual N3 mean-patch pulse inputs and local value bounds

## Scope and source

This addition evaluates a restriction of **the same accepted N3**, not a new power-law profile. The local interval is the reserved `Imean` of `ONE_PROFILE_SPECIFICATION.md` §4 and `GLOBAL_STRESS_ASSEMBLY_EN.md` §6. Both files are byte-pinned in `actual-pulse-source.mjs`. The accepted assembly SHA-256 is `184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd`; its original parameter graph SHA-256 is `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`.

The primary source is *Finite Time Blowup for Navier–Stokes*, PDF SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`, [official PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf). We use pp.25–28, equations (4.3), (4.7), (4.11), (4.15)–(4.16); pp.33–34, (4.26), (4.30); pp.52 and 60–61, (5.18), (5.44), (5.45); pp.63–66, (6.1), (6.5), (6.11); and pp.74–83, (7.2)–(7.28). The PDF was verified against that hash and read from a temporary file; no second large source copy is committed.

The ordinary slow field jets are actual normalized field values. The displayed pulse curve is the exact source **reference envelope**, with its physical logarithmic scale retained. No actual amplitude or covariance is silently substituted by that curve. The local phase/frame and homogeneous value comparisons below are written analytic implications, with actual source bounds and executable exact absorptions. They are not numerical integration of the very large band frequencies. The entire N5-04/05/06 gates remain PARTIAL: the completed background outside this patch, all requested slow derivative estimates, and the actual covariance integrals are still absent.

## 1. Recover the exact unmodified field

Use `T_d = exp(1048576)+10` for the fixed outer parameter; the chart time is denoted `T_c`. Let `B_o=1000 T_d`, `C=CSelected`, and

\[
 X_m=XR\exp(T_d+2+60B_o-8),\quad y=\log(X/X_m),\quad 0<y<5.
\]

The literal step has the reflection identity `sigma(t)+sigma(1-t)=1`, hence its integral on `[0,1]` is exactly `1/2`. The first transition contributes `-1/5` to `log E`, the axial stage contributes `-T_d/2`, the entry contributes `-1/2-lambda/2`, and the remaining constant-slope wait contributes `-(1/2+lambda)(60B_o-8)`. Thus

\[
 \log K_m=\frac32T_d-\frac7{10}-\frac\lambda2
 -(\tfrac12+\lambda)(60B_o-8)
 =-\frac{59997}{2}T_d+\frac{33}{10}
 +(\tfrac{15}{2}-60000T_d)\lambda,
\]

\[
 E=K_m\frac{e^{-(1/2+\lambda)y}}{1+\eta^2},\qquad U=0.
\]

No old `Md=1` or finite floating-point outer default is executed. Only the literal stage formulas are reused, with the actual pinned parameter expressions.

The interval is **before** the main axial pulse. Its cumulative moment is not zero. The reference and first transition have `U=4 eta`; on the axial stage

\[
 k(w)=4[1-\sigma(\log(1+w)/Md)],\quad
 M(X,\eta)=\eta m,
\quad
 m=XR\,e\left(4+\int_0^{T_d}e^w k(w)\,dw\right).
\]

The strict bounds `4 XR e < m < 4 XR exp(T_d+1)` follow from `0<=k<=4`, with strict inequalities on nonempty intervals. The original inner matching and I1 repair preserve this moment; I2 is E-only. Substitution in (4.7) gives

\[
 V_0=-m\frac{2D\eta^2+(1-\eta^2)}{1-2h\eta^2}=-m.
\]

Therefore `ur^(0)=-m/r`, not zero. The positive-order `E_n,U_n,F_n,V_n` vanish on this patch by (5.18); the extra cutoff term involving `F_n` in (5.45) also vanishes. The eventual background velocity agrees with this restriction as in (5.44). This does not imply vanishing pressure or stress corrections. For example (5.6) gives `Omega_0=-m^2/(2X)` here, so even when `E_1=0`, the pressure equation requires `Pi_1,X=m^2/(4X^2)>0`.

## 2. Ordinary slow jets, including axial/time dependence

Set `s=q/Q`, `rho_R=R/sqrt(2X_m)`, `F_m=K_m/sqrt(2X_m)`. The actual chart field is

\[
 F=F_m s^{-1-h}\frac{e^{-(1+\lambda)y}}{1+\eta^2},\quad
 G=0,\quad b=-\epsilon m/R.
\]

The relations `Z=eta*s^D`, `T_c=s(1-eta^2)` imply `T_c=s-Z^2*s^(2h)` and

\[
 \frac F{F_m}=\rho_R^{-2-2\lambda}
 \frac{s^{\lambda-h}}{1+Z^2s^{-1+2h}}.
\]

`actual-pulse-meanpatch.mjs` differentiates this expression in the **ordinary variables `(rho_R,Z,T_c)`** through total order three. It solves the Taylor coefficients of the implicit equation for `s` by division by `L=1-2h eta^2`. Its center is parameterized by exact `s,eta`, so the constant equation is an identity; it is not solved by a floating-point root. Nonconstant coefficients are solved successively. Power series coefficients are `D^alpha/alpha!`; the returned table multiplies by the factorials.

The scale restoring a physical chart `R` derivative of order `a` is `F_m*(2X_m)^(-a/2)`. The factors are positive symbolic expressions and are not replaced by binary64 zero. Intervals `[0,2^-1000]` for lambda and the existing outward enclosure for h only enclose the tiny parameters; their exact positive definitions remain attached. All interval elementary functions use the original bounded-series exp/log implementation.

Running the same interval Taylor calculation on the **entire box** `0<=y<=5`, `-1<=eta<=1`, `1/2<=s<=2` gives, through order three, normalized maximum bounds less than `2^17` for F, `2^21` for V, and `32` for the normalized radial component. This is a whole-box interval computation, not a grid maximum. A separate positive lower bound is

\[
 F/F_m>1/(8\,3^{10})>2^{-19}.
\]

## 3. Explicit actual scales

The source expressions give

\[
 \log F_m=-60009T_d-5\log C+\frac{63}{10}
 -\frac12\log220+(\tfrac{15}{2}-60000T_d)\lambda.
\]

Since `log C > 64016 T_d`, `2*64016 > 120009`, and `0<lambda<1`, this yields `C^-7<F_m<1`. The source annular bound `X_b<C^11`, with `1/2<=s<=2`, gives `1<R<C^6` on the mean patch. Hence

\[
 F>C^{-8},\quad m<C^{12},\quad\lambda^{-1}<C.
\]

Its shear has `a=v_s=2+2lambda`, `b_s=0`, so throughout this patch

\[
 N=(-1,0),\quad K=(0,-1),\quad
 \lambda_0=2F_0\sqrt\lambda>0,\quad c_0=-\sqrt\lambda<0.
\]

The accepted global direction margin is `kappa=R_e^-10`, where `R_e=C12EnvelopeR=exp(S^256)`, `S=C^100000`. A legitimate fixed choice is `u_star=2/kappa`. Equation (4.26) bounds the square of the source stress quotient by `1-kappa/2`, while

\[
 \frac{u_*^2}{1+u_*^2}-(1-\kappa/2)
 =\kappa/2-\frac{\kappa^2}{4+\kappa^2}\ge\kappa/4.
\]

This selects a real source phase parameter; it does not evaluate T0. On Imean the frame direction and c0 are constant, so their freezing introduces no additional direction change. We still leave the global slow-neighborhood/covariance gate unclaimed.

Let the fixed majorant be `M=R_e^100 > 2^50`. The explicit bounds above imply that all of `R,R^-1,F,F^-1,|g0|,|g0|^-1,lambda0,lambda0^-1,|c0|,|c0|^-1,u_star`, the slow F derivatives through order three, and the slow derivatives of `b/epsilon` through order three are bounded by M. The latter follows also directly from `b/epsilon=-m/R`. This is a bound from the actual source, not a user-supplied coefficient constant.

## 4. One local band threshold and phase/frame estimate

Write `S_*=ell^2`. First, the actual h gives a quantitative scalar threshold `ell_s=ceil(h^-4)`. For every `ell>=ell_s`,

\[
 \ell^4(\epsilon+\epsilon^2+k^{-1})\le1.
\]

Indeed `epsilon+epsilon^2+1/k<=3 sqrt(epsilon)`. With `L=log(1/h)>=8002`, `ell_s<=2e^(4L)` and `h ell_s>=e^(3L)`. The endpoint logarithm is at most

\[
 \log48+16L-e^{3L}/4 < 4+16L-9L^2/8<0.
\]

The last quadratic is negative and decreasing for `L>=8002`; both comparisons are checked with integers. The function `ell^4 exp(-h log2 ell/2)` decreases for all later ell. This is one scalar condition, **not** the global q_star. In particular all existing coordinate-observation bands `ell=8..900` fail that scalar condition: their actual epsilon is larger than one half.

For the local source bounds choose

\[
 \ell_m=\lceil M^{100}h^{-4}\rceil
 =\lceil R_e^{10000}h^{-4}\rceil,
 \qquad \ell\ge\ell_m.
\]

Then `S_*>=M^200`. The installed `r0=2^-34` and the exact covering floor give `S_*/M<=L_s<=S_*`. Work on one fixed enlargement with coordinate distance at most `4 S_*^-3`, whose radial positions stay inside `0<y<5`; derivative data at the eta endpoints are understood relative to the source domain.

The definition of Bs in (7.2) and `1<=epsilon*k^2<=4` imply

\[
 M^{-3}\le B_s\le M,
 \qquad \lambda(v)\ge M^{-3}.
\]

Since `K_theta=0`, the unrounded angular number is

\[
 \widetilde p=\sigma R_0B_su_*/(L_s(2+2\lambda)F_0).
\]

Use the precise tie rule `kp=sigma*max(1,floor(abs(k*p_tilde)+1/2))`. It ensures nonzero integer angular frequency and `|p-p_tilde|<=1/k` even when zero would have been the closest unrestricted integer. Both `|p|` and `|p_z|` are at most `M^2`. Here `p_z=-B_s`.

The actual normal is affine in v:

\[
 n=(\sigma B_su_*/2-vpF_R,\ p/R,\ -B_s-\epsilon vpF_Z),
 \quad n'=(-pF_R,0,-\epsilon pF_Z).
\]

The radial shear error obeys `|pF_R-p_tilde F_R,0|<=12 M^3/S_*^3+M/k`. The tangential error is bounded using `R0/R<=2`; its angular component is at most `2M^4/S_*+1/k`, and its axial component is at most `M^3 epsilon S_*`. Combining these estimates, the same bounds for n', and the scalar inequality gives

\[
 |n-n_{ref}|+|n'|\le M^{10}/S_*,\quad n_{ref}=B_s(s(v),K).
\]

It is smaller than `B_s/2`, so `|n_tan|,|n|>=M^-4`. The phase defect here is the actual expression `epsilon*v*p*F_T+b*n_r`; it is `O(epsilon*S_*)` with a fixed explicit power of M. The radial term is retained.

For clarity, the finite matrix bookkeeping is listed explicitly. Euclidean/vector and induced matrix norms are used; factors from dimensions two and three are smaller than the slack in the displayed powers (M exceeds `2^50`). Let J denote the two-by-two factor called M in (7.8), to avoid confusing it with the majorant.

| Object | Bound | Reason |
|---|---|---|
| `Ka-K`, `Na-N` | `M^15/S_*` | Normalization of a vector of length at least `M^-4`, using the preceding normal error |
| `sa-s` | `M^16/S_*` | Quotient difference, `|s|<=3M/2` and `|n_tan|>=Bs/2` |
| `U-Uref` | `M^18/S_*` | `U=[er-sa Ka,Na]` |
| `U,J,B` | `M^3,M^3,M^7` | `|sa|<=2M`, `|c0|<=M`, and matrix multiplication |
| `J^-1,B_left` | `M^2,M^3` | Explicit inverse, `|c0|>=M^-1`, `sqrt(1+s²)>=1`; `B_left=J^-1[er^T;Na^T]` |
| `B-Bref`, `B_left-Bref_left` | `M^22/S_*,M^19/S_*` | Same frozen J, and the preceding U/Na differences |
| `Kshear-Kshear,0` | `M^6/S_*^3` | Ordinary slow derivatives and the product R*F_R |
| `Aphi-Aref` | `M^26/S_*` | `||P(n)-P(nref)||<=4|n-nref|/min(|n|,|nref|)`, shear difference, and `-n*n'^T/|n|²` |
| `Ka',Na',sa'` | `M^16/S_*,M^16/S_*,M^22/S_*` | Differentiate normalization/quotient, retaining n' |
| `U',J',B'` | `M^24/S_*,M^4/S_*,M^29/S_*` | Product rule; `|s'|=u_*/L_s<=M²/S_*` |

Here `Aref=-P(nref)*Kshear,frozen` is the instantaneous reference operator, with no moving-normal term. The term `-n*n'^T/|n|²` is retained in `Aphi` and bounded as part of its difference from `Aref`. At the exact reference normal, the identity `B_left,ref Aref Bref=diag(lambda,-lambda)` follows from `g0=|g0|N` and the source definitions of lambda0,c0. Splitting the actual triple product into its three differences gives exponents at most 38; the frame derivative contribution has exponent at most 34. The exact integer absorption `6 M^38+4 M^34<M^64` therefore gives

\[
 \left|B^\ell(A_\Phi B-B')-\operatorname{diag}(\lambda,-\lambda)\right|
 \le M^{64}/S_*.
\]

Similarly `d-dref=epsilon*k²(|n|²-|nref|²)` has absolute value at most `M^20/S_*`, which is smaller than `M^64/S_*`. These constants concern the **actual mean-patch velocity only**. They must not be extended to the rest of the source annulus by copying the bound.

## 5. The prescribed left datum and an actual local value comparison

The initial datum of Lemma 7.4 is `z_plus(0)=P(0)`, `z_minus(0)=0`. It is stored with its positive logarithmic factor, not as a vector of zeros. Put `delta=1/u_star` and `a=1/2+v/L_s`. The exact bounded expression

\[
 f(a,\delta)=\log\frac{a+\sqrt{a^2+\delta^2}}{1+\sqrt{1+\delta^2}}
 -\frac{(a-1)\delta^2+(a^3-1)/3}{(1+\delta^2)^{3/2}}
\]

satisfies `log P=(lambda0 L_s/u_star) f`. In particular the source left coefficient is enclosed by about `[-0.401480513893317,-0.401480513893245]`. This is the exact source reference-envelope expression evaluated with an outward enclosure of its actual delta, not the claim that a zero-delta profile has replaced N3.

The non-underflowing unknowns are

\[
 r=z_-/z_+,\quad w=\log(z_+/P),\quad(r,w)(0)=(0,0),
\]

\[
 r'=E_{21}+(-2\lambda+E_{22}-E_{11})r-E_{12}r^2,
 \qquad w'=-(d-dref)+E_{11}+E_{12}r.
\]

The local bounds above give an inward vector field at `r=+-M^68/S_*`: the outward derivative is less than `(-2M^65+2M^64)/S_*<0`, and `M^68/S_*<1/4`. Thus `|r|<=M^68/S_*`. Integration on `L_s<=S_*` gives `|w|<=3M^64` and

\[
 e^{-M^{66}}P\le x\le e^{M^{66}}P.
\]

The source reference Gaussian coefficient can be bounded explicitly:

\[
 \frac{\lambda_0 u_*^2}{2(1+u_*^2)^{3/2}}
 =\frac{\lambda_0}{2u_*}(1+u_*^{-2})^{-3/2}
 \ge\frac1{6M^2}\ge M^{-3}.
\]

Restoring the tangential coordinates introduces only a fixed factor at most `M^6`, hence

\[
 |t(v)|\le\exp\!\left(M^{67}-M^{-3}(v-L_s/2)^2/L_s\right).
\]

In a cutoff collar `|v-L_s/2|>=L_s/5`, `L_s>=S_*/M` and `S_*>=M^200` give the actual local bound `log|t|<=-S_*/(50M^4)`. The constants are enormous but finite and source-bound. These value implications do not require a numerical grid or a materialized carrier integer.

## Remaining mathematical obligations

The code deliberately retains all of the following false flags: `globalPhaseCertified`, `globalHomogeneousPulseCertified`, `globalCovarianceMatched`, `allSlowDerivativeGaussianBoundsCertified`, and `actualAmplitudeNumericallyIntegrated`. The actual restricted velocity is now defined and evaluated, and its local phase/value comparisons have explicit bounds. It still does not supply the completed background on the rest of the annulus, the all-order derivative Gaussian estimates, actual pulse interval quadrature, the heat-prepared cumulative T0 data, or a once-per-box global covariance assembly. None of the six remaining original source construction gates is promoted by this local addition.

| Original criterion | Actual progress in this addition | Input still needed for the original gate | Next executable step after that input exists |
|---|---|---|---|
| N5-04 | Actual Imean F/G/b, ordinary slow jets through order 3, the original fixed u choice, nonzero rounded angular label contract, local C/Sstar phase and frame bound | The realized Proposition 5.5 background on the **whole original annulus**, including the N4 positive-order coefficient sequence and its uniform constants | Substitute its source-bound jets into the displayed normal/projector/frame formulas and certify one common q threshold over the actual covering |
| N5-05 | The prescribed left growing datum in a positive logarithmic scale, the exact reference envelope, and a local invariant-barrier/Gaussian value comparison | The actual global projected systems from N5-04 and their full slow-derivative majorants; actual normalized amplitude enclosures and corresponding derivative estimates | Integrate the r/w system with interval remainder control and differentiate the fixed-label system using those majorants; certify the common Gaussian constants |
| N5-06 | A legitimate fixed direction parameter from the actual N3 margin; a nonzero radial moment is preserved and not confused with local stress | Heat-prepared cumulative T0 on the representative boxes, actual pulse covariance quadrature H_sigma, and source-bound slow variation/positivity constants | Compute both actual covariance columns, solve their two-column positive-weight system against the same T0, and check the squared partition assembly |

These are missing mathematical inputs, not fields that can be completed by increasing a sample count. The original propositions apply once their actual background, stress and uniform-bound hypotheses have been supplied. Applying them to a constant substitute or to the isolated mean patch would not discharge the whole-annulus gates. The mean-patch restriction above remains useful because (5.18), (5.44) and (5.45) identify it exactly without solving the still missing positive-order fields elsewhere.

## Verification

`node --test research-ide/mathscope-m2/navier/tests/actual-pulse.test.mjs` passes **13/13** tests. These check the accepted source bytes, actual parameter expressions, normalization and endpoint derivatives, the whole-box bounds, the original left datum, nonzero rounding including its near-zero failure control, rejected alternate-source/fabricated-certificate requests, and deterministic replay.

`python research-ide/mathscope-m2/navier/tests/actual-pulse-independent.py --output research-ide/mathscope-m2/navier/tests/actual-pulse-independent.json` passes **421/421** checks using only the Python standard library. It verifies the source logarithmic algebra and moment identity, compares all 20 slow multiindices through order three at three chart locations against **400-digit direct Newton inversion and seven-point mixed finite differences**, checks the normal/frame/left-inverse identities with exact rational matrices, and independently evaluates the reference envelope and the exact exponent/barrier inequalities. The greatest distance from an independently computed F/V derivative to its displayed interval midpoint is about `4.21e-14`, and every computed value lies within its displayed interval.

The independent derivative calculations exercise a positive endpoint of the certified parameter enclosure; they are arithmetic tests, not claims that this endpoint is the actual N3 value. The source definitions of h and lambda remain pinned expressions, and the production output encloses their values uniformly. The rational matrix fixtures check universal source identities only. They are not described as actual finite-frequency N3 pulses. Omitting the moving-normal term, omitting B', reversing the shear sign, replacing the F normalization by E, or using an insufficient local band fails the corresponding negative control.

The independent source reviewer also checked the phase/frame matrix-power bookkeeping in §4 and the invariant-barrier, logarithmic comparison and collar absorption in §5. The review found no missing local term, and agreed that the global N5 and all-slow-derivative/covariance flags must remain false. The executable checks support this written local derivation; they do not turn it into a formal kernel proof or replace the remaining global construction.
