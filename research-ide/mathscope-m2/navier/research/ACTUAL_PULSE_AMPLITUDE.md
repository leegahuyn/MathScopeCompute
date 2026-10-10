# Actual mean-patch phase and validated growing amplitude

## Result and exact source

`actual-pulse-amplitude-phase.mjs` compiles the source phase, normal, shear,
projected operator, moving frame, its derivative and left inverse, pressure
coefficient, and phase-transport defect. `actual-pulse-amplitude-integrator.mjs`
encloses the **actual homogeneous growing solution** at an `Imean` representative
throughout its complete pulse interval. Its public entry point is

```js
actualMeanPulseAmplitude({y:2.5, sign:1, steps:64})
```

Here `1/4 <= y <= 19/4`, `sign` is the original `sigma=+1` or `-1`, and
`steps` is a power of two between 8 and 256. The source parameters, band,
positive `u_star`, carrier, representative `eta=0`, and `q/Q=1` cannot be
overridden. A sign change does **not** replace `u_star` by a negative value.
The original datum is `z_plus(0)=P(0)>0`, `z_minus(0)=0`.

The source is the accepted `same-profile-2026-10-10.3`, assembly SHA-256
`184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd`, with parameter
graph SHA-256 `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`.
The same byte-bound source files as `actual-pulse-source.mjs` are verified by
the dedicated tests. Their literal formulas are used with the selected enormous
parameters; historical finite defaults are never run.

The primary reference is [*Finite Time Blowup for Navier–Stokes*](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf),
PDF SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The construction uses pp.52,60–61, equations (5.18), (5.44), (5.45), and
pp.73–82, equations (7.2)–(7.22). The displayed page numbers are the paper's
printed numbers. No additional copy of the paper is committed.

This is the **exact restriction of the completed background velocity**:
(5.18) makes every positive-order `E_n,U_n,F_n,V_n` vanish on `Imean`;
(5.44) gives the resulting velocity; p.61 also checks the extra cutoff
derivative times `F_n`. This does not set pressure or stress corrections to
zero. In particular the actual nonzero cumulative radial moment remains
present. The local restriction is not an evaluator for the whole background.

## 1. Phase and complete moving frame

Write `R_e=C12EnvelopeR`, `M=R_e^100` and use the source choice

\[
 u=2R_e^{10},\quad \ell=\lceil M^{100}h^{-4}\rceil,\quad
 S_*=\ell^2,\quad \epsilon=2^{-h\ell},\quad k=\lceil\epsilon^{-1/2}\rceil.
\]

The covering index is the actual floor from (6.11), with
`T_g=4+sqrt(2)` and `r0=2^-34`. Thus `L_s=2^-33/c_i` and
`S_*/M <= L_s <= S_*`. The source definitions remain an exact expression
graph, including all ceilings and floors. Their enormous integer values are
not materialized or replaced by small frequencies.

The actual mean-patch field is derived in
[`ACTUAL_MEAN_PATCH_PULSE.md`](ACTUAL_MEAN_PATCH_PULSE.md). At a representative
`s=1, eta=0`, it has

\[
 G=0,\quad F_R=-(2+2\lambda)F/R,\quad F_Z=0,\quad
 \lambda_0=2F_0\sqrt\lambda,\quad c_0=-\sqrt\lambda,
 \quad b=-\epsilon m/R\ne0.
\]

For general points in the allowed local mean-patch image, the phase program
uses the full slow field

\[
 F=F_m\rho_R^{-2-2\lambda}
 \frac{s^{\lambda-h}}{1+Z^2s^{-1+2h}},\qquad
 T_c=s-Z^2s^{2h}.
\]

The implicit positive root carries its equation, variable, and bracket
`[1/2,2]`. It is only requested on the image
`R=sqrt(2 X_m exp(y))*sqrt(s)`, `Z=eta*s^(1/2-h)`,
`T_c=s*(1-eta^2)`. The derivative denominator is `L=1-2h eta^2>0`.
`F_R,F_Z,F_Tc` are explicit expressions, not derivative-oracle nodes.
The amplitude evaluation itself uses `s=1,eta=0`, where the root is exactly 1.

The graph distinguishes its `generatedFunctionDomain`, the whole displayed
mean-patch image where the field expression makes sense, from its
`certifiedOperatorDomain`. The normal/frame lower bounds and `C/S_*` estimates
apply on the intersection of that image with the original slow enlargement
`|Delta(R,Z,T_c)|<=4*S_*^-3` about the selected representative, for all
`0<=v<=L_s`. They are not certified over the entire bounding field image by
copying the local estimate.

With the original nonzero angular rounding and `p_z=-B_s`, the graph contains

\[
 \Phi=p\theta+p_zZ/\epsilon+x_0R-vpF,\quad
 n=(x_0-vpF_R,p/R,-B_s-\epsilon vpF_Z),
\]

\[
 K=\begin{pmatrix}0&-2F&0\\-2\lambda F&0&0\\0&0&0\end{pmatrix},
 \quad A_\Phi=-K+\frac{n(n^TK-(n')^T)}{|n|^2}.
\]

The graph generates `K_a,N_a,s_a,U,J,B=UJ`,
`B'=U'J+UJ'`, `Bleft=J^-1[er^T;Na^T]`, and
`Bleft*(Aphi*B-Bprime)`. Both moving-normal and moving-frame terms are kept.
The exact identities `n^T B=0`, `Bleft B=I` and

\[
 \det J=-2c_0\sqrt{1+s_{ref}^2}>0,\qquad
 \det(B^TB)=(\det J)^2(1+s_a^2)
\]

give source lower bounds `det J >= 2/M`, `det(B^TB) >= 4/M^2`.
The earlier whole-box source estimates give `|n|,|n_tan| >= M^-4` on the
fixed local enlargement. They also give `1<=epsilon*k^2<=4` and all primitive
value bounds needed below. The graph provides these guards with the generated
objects; a label's discrete quantities are fixed before differentiation.

The pressure coefficient is retained as
`pi=i*(n^T K-(n')^T)t/(k|n|^2)` for the homogeneous `m=1` solution.
The phase defect is `epsilon*v*p*F_Tc+b*n_r`. Here `T_c=tau/Q`, `tau=-t` and
`t_star=partial_v-epsilon*partial_Tc`, which explains the plus sign of its
first term. The remaining slow transport and viscosity are not assigned zero.

## 2. A stronger carrier bound

The full-pulse growth exponent is enormous, so a small pointwise phase error
is insufficient: its integrated effect multiplied by growth must also be
controlled. Put `L=log(1/h)>=8002`. For every integer band above the selected
threshold,

\[
 k^{-1}\le M^{-300}S_*^{-10}.
\]

At `ell_0=ceil(M^100 exp(4L))`, using `log 2>1/2`,

\[
 \log(M^{300}\ell_0^{20}/k)
 \le20\log2+2300\log M+80L-M^{100}e^{3L}/4
 <20+2300M+80L-\frac98M^{100}L^2<0.
\]

The last polynomial is negative at `M=2^50,L=8002`, and its two partial
derivatives are negative throughout that quadrant. The script checks these
integer inequalities. The logarithmic derivative in `ell` is
`20/ell-h log(2)/2<0`, so the bound persists at every later band.

Let `q_a=p/(R_0 B_s)` and `alpha=(2+2lambda)F_0`. Define

\[
 \vartheta=\frac{\alpha L_s q_a}{\sigma u}-1,\qquad
 \mathcal G=\lambda_0L_s/u>0.
\]

The actual rounding error, primitive source bounds and `L_s` bounds imply

\[
 |q_a|\le2M^3/S_*,\quad
 |\vartheta|\le M^6S_*/k,\quad
 \mathcal G^{-1}\le M^3/S_*,\quad \mathcal G\le MS_*.
\]

Both `|q_a|/sqrt(lambda)` and `|q_a|*sqrt(lambda)` are at most `2M^4/S_*`.
They are distinct source quantities with a common numerical bound.
Also `log(u)/G <= M^4/S_*`. These estimates are below `2^-1000` because
`S_*>=M^200` and `M>=2^50`.

The bound `u^-1<2^-1000` uses the **actual** envelope:
`R_e=exp(CSelected^25600000)>exp(2^100)`, not the weak bound `M>=2^50`
alone. Similarly `sqrt(lambda)=exp(-500T)` with `T=exp(Md)+10>10`.
The interval endpoint 0 is permitted by finite outward arithmetic; the
parameters' attached exact expressions remain strictly positive.

## 3. Exact reduction of the actual projected equation

Use `a=1/2+v/L_s`, `a_tilde=1/2+(1+vartheta)(a-1/2)`,
`t_a=sqrt(1+q_a^2)`, `delta=1/u` and

\[
 D=a_{tilde}^2+(t_a/u)^2,\qquad H_d=(1+\delta^2)^{3/2}.
\]

The actual normal and moving tangent coordinates are

\[
 n/B_s=(\sigma u a_{tilde},q_a,-1),\quad
 K_a=(q_a,-1)/t_a,\quad N_a=(-1,-q_a)/t_a,
 \quad s_a=\sigma u a_{tilde}/t_a,
\]

\[
 t^h=x(e_r-s_aK_a)-\sqrt\lambda\,u\,\bar y N_a.
\]

Direct substitution in (7.5)–(7.8), **including** the derivative of the normal,
gives the exact system

\[
 x_a=-\frac{D_a}{D}x+\frac{\mathcal Gt_a}{D}\bar y
       -\frac{\mathcal GD}{H_d}x,
 \qquad
 \bar y_a=\frac{\mathcal G}{t_a}x
       -\frac{\mathcal GD}{H_d}\bar y.
\]

Omitting the moving-normal term changes the first drift and violates the
differentiated constraint. The independent Fraction audit verifies that failure.
The common damping is removed exactly. For
`Y=exp(integral G*D/H_d da)*ybar`, the result is

\[
 (D Y_a)_a=\mathcal G^2Y.
\]

Set `d zeta/da=D^-1/2` and `V=D^1/4 Y`. The Liouville equation becomes

\[
 V_{\zeta\zeta}=(\mathcal G^2+H)V,\qquad
 H=\frac{D_{aa}}4-\frac{D_a^2}{16D}
  =\frac{(1+\vartheta)^2}{4}\left(1+\frac{(t_a/u)^2}{D}\right)>0.
\]

The original growing datum supplies
`x(0)=P(0)`, `ybar(0)=sqrt(1/4+delta^2)*P(0)`.
It is the reference `s_ref` in the source frame that sets this latter factor.

## 4. Validated transfer across an entire cell

The integrated state is

\[
 (W,Z)=e^{-\mathcal G\zeta}(V,V_\zeta/\mathcal G)/V(0).
\]

It starts at

\[
 W_0=1,\qquad Z_0=
 \frac{\sqrt{D_0}}{t_a\sqrt{D_{ref,0}}}
 +\frac{D_a(0)}{4\sqrt{D_0}\mathcal G}.
\]

Every pulse cell supplies an outward enclosure of `H` on its **whole interval**,
and an outward logarithmic expression for its `Delta zeta`. For constant `H`,
put `r=sqrt(1+H/G^2)`, `e=exp(-2 G r Delta zeta)` and
`f=exp((H/G)/(r+1)*Delta zeta)`. The scaled transfer is

\[
 \frac f2\begin{pmatrix}1+e&(1-e)/r\\(1-e)r&1+e\end{pmatrix}.
\]

The subtraction `sqrt(G^2+H)-G` is never evaluated. Instead the positive
quotient `H/G/(r+1)` is used. For enormous positive growth the decaying mode
has an enclosure `[0,positive subnormal upper]`, with its exact exponential
still understood as positive.

The unscaled first-order system is cooperative when `H>=0`. Positive Volterra
kernels compare its entries with those from the cell infimum and supremum of
`H`. The displayed scaled transfers therefore enclose the actual variable
potential. Both components stay positive, so the comparison can be composed
across all cells. This is a validated comparison integrator, not an empirical
step-refinement error estimate or an explicit Euler integration at huge growth.

## 5. Preserve the source reference scale when restoring the amplitude

The original reference is exactly

\[
 \log P=\mathcal G f(a,\delta),\quad
 f=\log\frac{a+\sqrt{a^2+\delta^2}}{1+\sqrt{1+\delta^2}}
 -\frac{(a-1)\delta^2+(a^3-1)/3}{(1+\delta^2)^{3/2}}.
\]

In particular `P(L_s/2)=1` and `log P(L_s/2)=0`. This is a normalization of
the reference. No normalization of the actual vector at that point is imposed.

The actual normal changes the Liouville phase and damping slightly. With
`D_ref=a^2+delta^2`, throughout `1/2<=a<=3/2` one has
`D,D_ref>=1/8` and `|D-D_ref|<=4|vartheta|+delta^2 q_a^2`.
The derivative of `D^-1/2` on this range has absolute value below 12. Integrating
over an interval of length at most one, and adding the damping difference,
gives the deliberately loose bound

\[
 |\log(\text{actual phase factor}/\text{reference factor})|
 \le128\mathcal G(|\vartheta|+q_a^2)
 \le128(M^7S_*^2/k+4M^7/S_*)<2^{-1000}.
\]

This controls the **growth-multiplied integral**, not just a pointwise error.
The unknown positive `delta` is shared with the reference and is not removed;
`G*delta^2` is never discarded. Let `phaseFactor` be the resulting positive
enclosure. With `V_0=D_0^1/4 sqrt(D_ref,0)` after division by `P(0)`,

\[
 X=\frac{x}{P}=\text{phaseFactor}\,t_aV_0D^{-3/4}
 \left[Z-\frac{D_a}{4\sqrt D\,\mathcal G}W\right],\qquad
 Y_b=\frac{\bar y}{P}=\text{phaseFactor}\,V_0D^{-1/4}W.
\]

The source tangential components are restored as

\[
 \Theta=\frac{t_\theta}{\sqrt\lambda uP}
 =Y_b/t_a-\sigma a_{tilde}\frac{q_a/\sqrt\lambda}{t_a^2}X,
\]

\[
 Z_c=\frac{t_z}{uP}
 =\sigma a_{tilde}X/t_a^2+(q_a\sqrt\lambda)Y_b/t_a.
\]

At 32 cells, the actual source midpoint `x/P` is enclosed near
`0.35355339059327`; the right endpoint is near `0.19245008972988`.
Neither is 1. Replacing this amplitude by `P` fails the dedicated test.
The returned rows are explicitly normalized chart quantities, with each exact
positive scale kept in the expression graph and each source path attached.

## 6. Energy, transverse pressure, and both Gaussian tails

The source pressure removes the normal component, so it contributes no energy.
The exact identity (7.22) is

\[
 \frac d{dv}|t|^2=-2t\cdot Kt-2d|t|^2.
\]

For `E=|t|^2/(P^2u^2)` this yields the returned interval quantity

\[
 \frac{(d/da)|t|^2}{\mathcal GP^2u^2}
 =2\left[(1+\lambda)X\Theta-\frac{D}{H_d}E\right].
\]

The independent test derives this from the full 3-by-3 equation and verifies it
with exact Fractions. It does not merely finite-difference the displayed energy.

There is also a continuous, grid-independent bound. The scaled equations are
`W'=G(Z-W)`, `Z'=G(W-Z)+(H/G)W`; their minimum cannot decrease, and their
maximum grows at most by `exp(integral H/G)`. The source bounds give
`1/2<=W,Z<=2` throughout the pulse. The amplitude reconstruction is consequently
bounded by `32uP*exp(phaseError)`. Since `u<=M`,

\[
 \frac{\log u+\log32+\text{phaseError}}{\mathcal G}
 \le4M^4/S_*<2^{-1000}.
\]

The source reference satisfies `f''(a)<=-1` on this interval: its logarithmic
term has second derivative `-a/(a^2+delta^2)^(3/2)`, and the cubic term adds
`-2a/(1+delta^2)^(3/2)`. For `delta^2<1/16`, the two positive magnitudes exceed
`1/8` and `7/8`, respectively, uniformly on `[1/2,3/2]`.
Also `f(1)=f'(1)=0`. In particular the weaker bound

\[
 \log|t(a)|/\mathcal G\le-(a-1)^2/4+2^{-1000}
\]

holds throughout the pulse. On the cutoff collar
`|v/L_s-1/2|>=1/5`, it is at most `-1/200`. The endpoint amplitudes therefore
have rigorously negative logarithms and remain strictly positive; underflow is
not reported as a solution identically zero. Bounds for **all slow derivatives**
of the amplitude are a separate obligation and are not asserted here.

## 7. Verification and remaining scope

Run from the repository root:

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-pulse-amplitude.test.mjs
node research-ide/mathscope-m2/navier/tests/actual-pulse-amplitude-fixture.mjs
python research-ide/mathscope-m2/navier/tests/actual-pulse-amplitude-independent.py
```

The JavaScript suite covers source hashes and selected parameters, every frame
matrix, its left inverse and derivative, pressure, energy, interval propagation,
two signs, source-scale positivity, common-node refinement, strict input guards,
replay and cancellation. The independent Python audit checks 30 rational
projected-ODE cases, Liouville potentials and Gram determinants, then compares
three finite-growth variable-potential problems with an 80-digit Decimal solver.
Finite diagnostic parameters and zero-small-parameter limits are marked as
operator/arithmetic tests; they are never production replacements for N3.

The executable acceptance obtained here is the actual generated local phase and
the actual **homogeneous `m=1` growing solution at fixed representatives** over
the entire pulse coordinate. These are new concrete inputs to N5-04/N5-05.
The finite workbench criteria and the full Section 7 package must be stated
separately. This module does not claim a completed source-wide forced inverse for
arbitrary `m,f_m`, every slow derivative Gaussian estimate, the whole annulus,
the full physical slow residual, a Haar covariance integral, matching to actual
`T0,*`, the global partition sum, or a new Lean kernel proof. Its result retains
`status: PARTIAL` and explicit false flags for those package-wide claims.

For covariance work, the pulse width is of order `G^-1/2` in `a`. Uniform rows
are observations of the amplitude multiplier, not a quadrature resolving that
width. The appropriate new coordinate is `w=sqrt(G)*(a-1)`, with the original
reference log and all positive scales retained. No covariance is inferred by
summing the uniform pulse rows.
