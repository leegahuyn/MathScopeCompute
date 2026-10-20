# Same-source recursive field, cutoff sum and terminal force

This is a new mathematical source application to the exact initialized state in the independently reviewed N6-01 candidate. It defines the subsequent functions and all selector constants; it does not claim that the historical JavaScript field evaluator already computes those functions. The input paper is SHA256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`. The original fixed parameter expressions are SHA256 `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`.

## 1. Actual initialized source and recursive successor

The full initial velocity roots are `(3825006,3825007,3825008)` and the complete pressure is `3825009`. The mean tuple is `(3614790,3614791,3614792)`, latest mean pressure is `3615361`, mean residual is `(3614976,3615392)` and current defects are `(3615055,3615101,3615147)`. These are checked against the source-bound N6-01 application and its exact norm-family artifact. The actual background `(b,V,G)` is `(622934,634588,622933)` and original stress pair is `(633815,633863)`. They are read from, and checked against, that artifact; they are not freely supplied parameters.

For each finite `j`, the new term graph defines **complete** updated fields by the following ordered operations. An update means the previous field plus the actual increment. Full auxiliary covariance is formed before averaging. Every pressure refresh retains all accumulated angular pressure and reconstructs the latest complete mean pressure.

1. Project the supported nonzero harmonic residual of this exact state, retaining every generated harmonic and conjugate. Apply the original zero-entrance-data inhomogeneous inverse of Proposition 7.2 on the original fixed path. Retain its full pressure coefficient, cutoff potential and full curl. Refresh pressure and current residual.
2. Take the physical auxiliary averages of the **post-forced** tangential residual. Compute their full weighted moments at fixed `z,t`, subtract the original normalized profiles times those moments, and take the original compact radial primitive. Apply the original fixed signed inverse `Hcov^-1/(2*a_primary)`. Retain all three covariance remainders, full curl and homogeneous pressure, then refresh again.
3. Take the zero-auxiliary-average part of the **post-signed** mean residual. Apply the original torus inverse, then realize its actual axial velocity by the original potential. Keep the axial reconstruction remainder `F_ax`, and refresh pressure.
4. Apply the fixed five-equation map to the **post-temporal** fresh `P,Jtheta,Jz`, with zero targets in its first two conservation rows. Retain its actual nonlinear defect remainder and refresh pressure once more.

The descriptors in `ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json` link every source to its actual predecessor. They also record every refresh and exact fixed source. They are mathematical function descriptors, **not** recovered JavaScript private seals or numeric graph roots. Five serialized successors illustrate the finite representation; the universal claim comes from Proposition 9.6 and Lemma 9.7 applied to this same recursive rule.

Proposition 9.6, pp107–111, proves that these generic operators preserve the complete Definition 9.4 state: supported/flat residual decomposition, cumulative classes, both exact moments and complete pressure. Its last paragraph invokes Proposition 9.3 to supply the next-cycle source hypotheses. Lemma 9.7, pp111–112, applies to arbitrary source size; its coefficients, positive primary denominators and support choices remain fixed. Harmonic damping has modulus at most one, and every fixed derivative request has a finite dependency graph. No stage- or derivative-dependent domain is introduced.

The initial-only JavaScript factories do not implement this general successor. In particular the saved forced factory loops over positive harmonics `[1,2]`, the old mean factory sets mean velocity to zero, and the signed degree generator begins with primary-only curl arrays. These are computational limitations of those factories; they are not premises of the mathematical operators just defined.

## 2. Common domain and all finite derivative bounds

The domain join is an equality of source formulas, not an equality of unrelated graph-node numbers:

\[
q_{\rm source}=2^{-(\ell_{\min}+4)},\qquad \ell_0=\ell_{\min}+6,
\]
\[
q_{\rm big}=q_{\rm source}/64=2^{-(\ell_{\min}+10)}
=2^{-(\ell_0+4)}=q_{\rm GlobalStar}=q_{\rm localization}.
\]

`source-inner-growth.mjs` lines115–119 and146–149 and `source-global-current.mjs` give these exact definitions; the recorded domain witness uses the same ratio1/64. The profile is unchanged, including positive original `h`. The localization uses `tau0=qbig/32`, `z0=tau0^D`, `r0=1`; its entire support obeys `q<=4(tau0+z0^(1/D))=qbig/4`.

The 42 inequalities of the original iteration program were replayed and independently checked as rational affine functions of `j`: a nonnegative slope and the required signed intercept prove each inequality for every `j>=0`. Hence

\[
\sigma_j=\tfrac15+\tfrac j{10},\qquad g_j=hj/10,
\qquad \ell_m=2A+(m+1)(1+3h/2).
\]

The potentials are the **canonical potentials returned by the original operators**, not an arbitrary gauge of the velocity increment. For initialization these are the original Stokes potential, original primary raw/shared potentials before curl, the original temporal realized `psi`, and the actual five-map `psi` at root3614778. At later stages `A_j` is the sum of the emitted wave/meridional potentials, `B_j` the direct azimuthal increments, and `p_j` the exact telescoping difference of complete pressures in(9.16). This matters because cutoff then curl is gauge-sensitive.

Here is a definite choice of constants, rather than unnamed placeholders. Write `D` for the original physical domain and `Lambda=1+|log q|`; fix the finite-dimensional derivative norm as the maximum over scalar components and Cartesian space–time multiindices through the given order. For actual `Z_j` and `Delta u_j=curl A_j+B_j e_theta`, set

\[
S_{j,m,p}=\sup_D q^{\ell_m-g_j}
\bigl(|Z_j|_m+|\Delta u_j|_m\bigr)\Lambda^{-p}.
\]

Choose `P_(j,m)` as the least nonnegative integer with finite `S`, and `C_(j,m)=1+ceil(S)` at that exponent. Lemma9.8 makes this set nonempty; increasing a real logarithmic exponent to a nonnegative integer preserves a bound because `Lambda>=1`.

For each `m`, choose `k_m` as the least nonnegative integer for which every finite stage admits a finite logarithm-weighted supremum of both `q^k |U[j]|_m` and `q^(k-h*sigma_j)|R(U[j])-Flat[j]|_m`. Lemma9.8 guarantees a witness independent of `j`. Set `K_m=max_(r<=m) k_r`, and select the actual state/residual `P,C` by the same least-exponent and supremum rule. For each fixed `j,m,N`, use `1+ceil(sup_D q^-N |Flat[j]|_m)` as its flat constant. These are uniquely defined actual-source quantities; none is assumed1 or0. This is a mathematical definition of the constants, not a claimed effective numerical supremum routine.

## 3. Exact shrinking cutoffs, field and evaluation window

For `a>=1`, let

\[
T_aZ_j=\bigl(\operatorname{curl}(\chi(aq)A_j)+\chi(aq)B_je_\theta,
\chi(aq)p_j\bigr).
\]

Set `ellPrime_m=ell_(m+1)+(m+1)`. A complete product/chain-rule expansion involves source derivatives through `m+1`. On the support of a positive derivative of `chi`, `aq` lies in `[1/2,1]`; every factor `a` is compensated by `q^-1`. Since `0<D<1`, every physical derivative costs at most one such power. Nondecreasing `ell_m` then gives this sufficient loss uniformly over **all** `a>=1`.

Define, before selecting any scale,

\[
\widehat S_{j,m,p}=\sup_{a\ge1,(x,t)\in D}
 q^{\ell'_m-g_j}|T_aZ_j|_m\Lambda^{-p}.
\]

Take the least nonnegative integer `P_hat` making this finite and `C_hat=1+ceil(S_hat)`. The preceding estimate proves finiteness for at least `P_(j,m+1)`. Thus there is no circular dependence on the scale being chosen.

Let `gamma_j=hj/20`, `L_0=log(1/qbig)`, and define

\[
L_j=\max\left(1,L_{j-1}+1,1+\log(1/q_{\rm big}),
\max_{0\le m\le j}(2\widehat P_{j,m}/\gamma_j)^2,
\max_{0\le m\le j}2(\widehat C_{j,m}+j)/\gamma_j\right),
\quad a_j=e^{L_j}.
\]

All quantities are now fixed by the actual functions. For `x=-log q>=L_j`, `log(1+x)<=sqrt x` gives the original differentiated bound(5.37). Also `a_j/a_(j-1)>=e>2` and `1/a_1<qbig`. The paper does not require integer `a_j`.

Apply `chi_init=chi(2q/qbig)` only to the **finite initialization correction** potentials/direct swirl/pressure before curl. Leave the realized slow base unchanged. This defines `U0_prime`; it equals the original initialization for `q<=qbig/4`. Its extra residual terms are supported away from zero and belong to every fixed-stage flat remainder. Define the final fields exactly by(9.21) with this `A0,B0,p0` and the canonical actual `Z_j,a_j`.

For a concrete saved window choose derivative order `m=1`, comparison stage `J=3`, and `M=5`:

\[
q\in[e^{-L_5},2e^{-L_5}].
\]

Corrections1,2,3 lie on their exact plateau; correction4 is the only possible transition term; every correction `j>=5` is exactly zero, including the lower endpoint. The initialization block is also on its plateau. The possibly active correction inventory is `[1,2,3,4]`, with the base and initialization stored separately. This follows from `L_5-L_3>=2`, so `2e^{L_3-L_5}<1/2`. The whole interval lies inside `qbig`, and in fact inside `qbig/4`.

Lemma5.4 gives the saved tail bound

\[
|U-U'^{[3]}|_1\le\tfrac18q^{h/5-\ell'_1}.
\]

Here `U'^[J]=U0_prime+sum_(1..J) uncut increments`. On this saved window `U'^[3]` equals the original recursive `S_3`. A possibly negative exponent is a valid bound and is not asserted to make this low-stage error small. For residual flatness at arbitrary `m,N`, choose the single finite

\[
J=\left\lceil\max\left(m+2,\frac{20(N+K_{m+2}+1+\ell'_{m+2})}{h},
\frac{10(N+K_m+1)}h\right)\right\rceil.
\]

Only after this `J` is fixed are its actual constants/logarithms absorbed into one extra `q^-1` on a sufficiently small neighborhood. Compare the full second-order Navier–Stokes polynomial with this one finite state, adding only its flat remainder. This proves(9.20); no series of finite-stage flat residuals is formed.

## 4. Same whole localized force, terminal jets and extension

Apply the original axisymmetric Cartesian cutoff to precisely the preceding final `A,B,p`: `u=curl(cA)+cB e_theta`, `p=c p_loc`, and `f=R(u,p)`. The fixed base is unchanged, so its exact exterior heat/centrifugal-pressure formula remains available. `div(cB e_theta)=0` follows from theta independence. The script independently expands the direct Cartesian differential polynomial and checks all three components against its complete product-rule decomposition, using arbitrary formal smooth functions. Omitting the pressure commutator is detected.

The whole-support terminal argument is Lemma10.2 applied to this same field:

- Away from the origin with `q` bounded below, local finiteness, fixed discrete choices, original all-order source bounds on the closed eta range and one further time derivative give uniform Cauchy limits by FTC.
- At positive radius with small `q`, the exact exterior heat integral and centrifugal-pressure integral give all-order dominated convergence, with all fixed cutoff terms retained.
- Near the origin the cutoff is1. The flat local residual and exact zero exterior residual yield(10.9) for every mixed derivative and every `N`.

A small origin ball followed by a finite cover of the remaining compact `K` proves uniform convergence on all space. Spatial and temporal FTC give the compatible actual functions `F_j` in(10.6),(10.10), with every spatial derivative zero at the origin. They are not exterior-only jets, toy maxima or assigned sample zeros.

For this uniquely selected force define its actual finite norm `N_(j,a)=||F_j||_C^a(K)`. Choose `b0=1` and, for each `j>=1`, the **least integer** `b>b_(j-1)` satisfying every(10.12) constraint `a+m<=floor(j/2)` with those norms. The constraint set is nonempty because every exponent `m-j` is negative and every norm is finite. For each fixed mixed derivative the tail is bounded by `sum2^-j`. At `sigma=0` only the `j=m` term contributes `F_m`;(10.10) therefore gives all-order joining. The extension retains compact `K` and vanishes for `sigma>=1`. This extends the force only, through time2.

## Verdict and computational scope

The new source-defined construction supplies mathematical candidates for **N6-07, N6-08, N7-04 and N7-05**, pending the independent reviews of these exact artifacts. The original criterion does not require decimal values for these functional constants or symbolic window endpoints. The definitions are source-bound; the computation of their numerical values is a separate task.

**N7-06 and N8-05 remain open.** The whole-space analytic energy identity and inequality follow for these compactly supported smooth fields, but the original N7-06 also requires an independently refined whole-`K` numerical energy-defect table. N8-05 requires actual final-field evaluation with independent grid, Fourier, coefficient-order and precision comparisons, plus separate tails and a real last-resolved tau. No such evaluator or tables are produced here; `last_resolved_actual_tau` remains null. The earlier initial1260 checks and zero intervals retain their original initial scope.
