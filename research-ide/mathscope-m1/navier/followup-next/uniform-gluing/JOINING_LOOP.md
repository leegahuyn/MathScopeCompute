# A quantitative C.1 loop on the same joining rectangle

## Proven domain and limitations

`certify_joining_loop.py` consumes the same source, moment-root binding, and
whole joining rectangle certificate. It constructs explicit C.1 constants and
checks positive cone margins for every `log x` in `[-8,-5]`, every `eta` in
`[-1,1]`, and every auxiliary phase. There are no radial, parameter, or phase
samples in this certificate. All scalar comparisons use exact rational numbers.

The result is a periodic **shear loop**, before the radial substitution in C.12.
It is not yet a field with the same cone margins after that substitution. Slow
radial derivatives, parameter derivatives, resulting moment discrepancies, and
the later source patch still need bounds. The whole loop must also extend over
the complete original interval `I`, with the prescribed radial collars. Local
choices cannot be silently transferred to that larger interval.

The certificate depends on the earlier analytically specified axis and exact
continuation. The analytic premise bundle has not been assembled into a new
Lean proof. In particular, the exact scalar calculation and this derivation do
not relabel the old finite arrays or complete original N3-06.

## The actual source interval for eta

The supplied paper, pp.24–25, equation (4.1), defines

$$
\eta=z/q^D,\quad \tau=1-t=q(1-\eta^2),\quad
q-z^2q^{2h}=\tau,\quad D=1/2-h.
$$

For `tau>0`, the unique solution has `q>|z|^(1/D)`, hence `|eta|<1`.
All physical real axial coordinates are covered by this transformation.
The parameter endpoints `eta=+/-1` describe one-sided limits at `t=1`.
The construction's closed parameter domain is exactly `[-1,1]`; the
certificate does not require a separate arbitrary extension to all real eta.

## 1. Normalize the actual radial scale

On the certified rectangle, put `p_j=ps,j/XR`. The actual source satisfies

$$
0.7\le a\le0.9,\quad |t_s|\le10^{-9},\quad v_s<1,
\quad P_c(t_s)/X_R\ge10^{-4},\quad |p_1|\le10,
\quad |p_2|\le2\cdot10^8.
$$

These bounds are recalculated from the source rectangle, not accepted as
caller constants. The reference Q bound is `63/16+3h/4`, plus its certified
error. The bound for N uses the actual A.21 pressure certificate. Also
`x>=exp(-8)>3^-8`, `x<=1`, and `1-2h<=L<=1`.

The same source has `XR=110 exp(10(logC+14))>2^128`. This is a lower bound on
its actual enormous radius, not a replacement radius. Set

$$
\bar d=1/40000,\quad d_0=X_R\bar d,\quad
\bar\mu=\mu X_R,\quad z=\bar\mu p_2.
$$

The C.5 loop is therefore

$$
t=t_s+\bar d\,\frac{e^{z\sin\theta}/I_0(z)-1}{p_2},
$$

with its exact removable value at `p2=0`. The variance is

$$
V(\bar\mu,p_2)=\frac{\bar d^2}{p_2^2}
\left(\frac{I_0(2z)}{I_0(z)^2}-1\right).
$$

The checked inequality `2*dbar < 1e-4-2/2^128` proves the paper's strict
condition `d0 < (Pc(ts)-2)/2` for every state in this rectangle.

## 2. Three elementary bounds for the Bessel mean

Here `I0(z)` denotes the exact mean of `exp(z sin(theta))`. Define
`R(z)=I0(2z)/I0(z)^2`. The following bounds are used analytically; numerical
evaluations are only independent diagnostics.

For `0<=z<=1`, the positive series gives
`I0(z)<=exp(z^2/4)<=4/3`. Orthogonality and the positive series for
`<sin(theta) exp(z sin(theta))>` give a lower bound `z/2` for that mean.
Cauchy–Schwarz, applied to its covariance with `sin(theta)`, then gives

$$
R(z)-1=\operatorname{Var}(e^{z\sin\theta}/I_0(z))
\ge \frac{z^2}{2 I_0(z)^2}\ge\frac{9z^2}{32}>\frac{z^2}{18}.
$$

The logarithmic derivative of `R` is positive for `z>0`: the second derivative
of `log I0` is the strictly positive variance of `sin(theta)` under its
positive tilted density. Thus `R(z)-1>=1/18` for `z>=1`.

For `z>=1`, write the integral with `cos(theta)` over `[-pi,pi]`.
Using `cos(theta)<=1-2theta^2/pi^2` and extending the Gaussian integral to
the line gives `I0(z)<=exp(z)/sqrt(z)`. Integrating only
`|theta|<=1/sqrt(z)`, with `cos(theta)>=1-theta^2/2`, gives

$$
I_0(2z)\ge\frac{e^{2z}}{\pi e\sqrt z}
>\frac{e^{2z}}{12\sqrt z},\qquad R(z)\ge\frac{\sqrt z}{12}.
$$

All these inequalities are even in z. The same short-arc argument yields
`I0(z)>=exp(|z|)/(12 sqrt(|z|))` for `|z|>=1`, so the normalized density is
at most `12 sqrt(1+|z|)` for all real z.

## 3. One explicit uniform root bracket

Set `T=3/0.7`, `P=2e8`, and define exact rational numbers

$$
p_c=\frac{\bar d}{100(1+T)},\quad
S=24\left(1+\frac{TP^2}{\bar d^2}\right),\quad
\bar\mu_{\max}=S^2/p_c.
$$

For all `|p2|<=P`, three exhaustive cases give `V(muMax,p2)>T`:

| Case | Uniform lower bound for V |
| --- | --- |
| `|muMax*p2|<1`, including `p2=0` | `dbar^2*muMax^2/18` |
| `|muMax*p2|>=1` and `|p2|<pc` | `dbar^2/(18pc^2)` |
| `|p2|>=pc` | `dbar^2/P^2*(S/12-1)` |

Every lower bound is compared to T exactly. Since the desired variance is
`rho/a<3/aMin`, strict monotonicity yields the unique C.10 root in the same
finite interval for every source point. In this rectangle the cutoff equals
one, so `rho=v-vs>1`; smoothness of this root does not rely on a sampled
crossing or the zero-variance branch.

The computed bracket is deliberately conservative:
`muMax*XR ~= 9.16205e62` and `|mu*p_s,2| <= 1.83241e71`.
These are finite rational values. No `exp(1.8e71)` is evaluated or replaced by
infinity.

## 4. A uniform all-phase cone margin

For fixed `mubar`, the derivative of the normalized density with respect to p
has absolute value at most `2*mubar` times that density. The integral form of
the removable quotient consequently gives

$$
|t|\le |t_s|+24\bar d\bar\mu_{\max}
\sqrt{1+\bar\mu_{\max}P}=:T_{\max}.
$$

The square root is rounded upward by an exact integer-square comparison.
Set `Jmax=P+10*Tmax`, `g0=1/20000`, and

$$
\delta_L=\min\left(1/2,\frac{g_0^2}{4J_{\max}^2}\right),
\qquad v=2+\delta_L/2.
$$

The C.5 positive-density identity ensures
`Pc(t)/XR>=1e-4-dbar`. Therefore, at every parameter and phase,

$$
\frac{P_c(t)-v}{X_R}\ge10^{-4}-\bar d-v/2^{128}\ge g_0,
\qquad |J_c(t)|/X_R\le J_{\max}.
$$

The four checked margins are

$$
a_L\ge\frac{2}{1+T_{\max}^2}>0,\quad v-2=\delta_L/2>0,
\quad (P_c-v)/X_R>0,
$$

$$
\frac{2(P_c-v)^2-(v-2)J_c^2}{X_R^2}
\ge2(10^{-4}-\bar d-v/2^{128})^2-\delta_L J_{\max}^2/2>0.
$$

The output contains positive exact fractions even when displaying `v` as an
ordinary floating-point value would round it to 2. Approximate lower bounds
are `aL>=3.61e-191`, `deltaL=1.13e-202`,
`(Pc-v)/XR>=7.5e-5`, and quadratic gap divided by `XR^2>=1.09e-8`.

Finally, C.1 follows by the exact change of variable
`dphi/dtheta=a(1+t^2)/(2*pi*v)`. Its positive derivative and total mass one
give a smooth circle reparametrization. Its shear means are exactly `(a,-bs)`.
The certificate never estimates these means with phase quadrature.

## 5. What this already gives for C.12, and what is missing

The zero-mean primitives in C.11 satisfy `|A|<=2` and `|B|<=E` here. Indeed,
`aL<3`, `|bL|<3/2`, and the bounds on the original shear bound their phase
derivatives. A zero-mean periodic primitive is bounded by the supremum of
its derivative. Thus for every integer `N>=4`, C.12 obeys

$$
|E_N/E-1|\le4/N,\qquad |U_N-U|/E\le1/N.
$$

This value estimate alone does not control the shears or residuals after
substitution. The exact C.13 formulas also need `D_X A` and `D_X B`, and the
radial moments need `A_eta` and `B_eta`. Those in turn need quantitative
derivatives of the actual loop and base `p_s`, using base fields through
eta order two. These bounds, the other radial regions, one compatible global
loop, and the resulting actual C.2 patch debt remain separate required work.

## Reproduction

```sh
python3 navier/followup-next/uniform-gluing/certify_joining_loop.py
```

The three input paths and the output path have CLI options so a later source
refinement can be bound under a new name without changing this preserved
source-specific certificate.
