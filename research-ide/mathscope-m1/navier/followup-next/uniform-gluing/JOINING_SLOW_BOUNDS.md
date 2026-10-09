# Slow derivatives and a finite frequency for the joining contribution

## What is computed

The new `source-final-*` files all use the refined source datum in
`source-coherence/uniform-source-debt-final.json`, SHA-256
`ac79c8268a501f9762b5f13f6efe114809a94e568efc614e2fd66ceae4303c7a`.
This datum has the same actual A.21 pressure at `logP=14`, `j0=1e-10`,
and source lambda as before. Its larger Lambda, amplitude, and widths are
recorded under new filenames. The previous source-specific certificates are
preserved.

The computation now follows the implicit moment root through two eta
derivatives, bounds the original fields and residuals on the whole joining
rectangle, and bounds the slow derivatives of the actual C.1 loop. It then
chooses a finite symbolic frequency making the **contribution produced in
this rectangle** fit an explicitly verified perturbation tolerance.

The full original interval I is larger. No incoming C.12 moment error has
been assigned a numerical value, set to zero, or borrowed from the independent
power-annulus example. The frequency result records a required upper bound
for that incoming error. Its assertion for an entire modulated field remains
open until the earlier radial panels, a compatible global loop, and that
incoming bound are established.

## 1. Differentiate the same exact moment root twice

The normalized B.8 correction map has constant linear part and diagonal
quadratic part. The same matrix inverse and small ball therefore control the
parameter derivatives of its unique root. Write `zU,zE,BU,BE` for the exact
matrix and nonlinear bounds, `rU,rE` for the root radii, and
`qE=zE+2BE*rE<1`. For the second derivative of the actual normalized source
debt, let `betaU2,betaE2` be its exact preconditioned bounds. Then

$$
u_2\le\frac{\beta_{U2}}{1-z_U},\qquad
e_2\le\frac{\beta_{E2}+2B_U(u_1^2+r_Uu_2)+2B_Ee_1^2}{1-q_E}.
$$

The factors of two arise by differentiating the quadratic terms; the terms
containing `e*e''` are part of the same Jacobian inverse. Positive bounds are
rounded upward to dyadics with denominator `2^320` after each operation.
The resulting bounds are

| Same implicit root | Upper bound |
| --- | ---: |
| `|d_eta^2 u|` | `4.484859e-14` |
| `|d_eta^2 e|` | `1.020540e-23` |

The full prefix moments use the same fixed-sign integral argument as before.
For a quadratic coefficient `Qij`, the second derivative contribution is
bounded by `2*abs(Qij)*(r1_j^2+r0_j*r2_j)`. The complete normalized moment
errors are then converted back to B.35's physical hats, using
`K'=d_eta K`, `|K'|<=K`, `|K''|<=2K`, and `c=4eta`.

## 2. Bounds for the actual smooth shapes and fields

`smooth-derivative-certificate.json` encloses the first three derivatives of
the actual flat step over its entire closed interval. It uses 1,024 exact
cells, outward dyadic arithmetic, reflection, and analytic endpoint bounds:

| Derivative | Continuous upper bound |
| --- | ---: |
| `|sigma'|` | `8.148888` |
| `|sigma''|` | `100.120659` |
| `|sigma'''|` | `4199.624115` |

For example, on `0<t<=1/4`, an upper bound for the third derivative is

$$
(64t^{-9}+144t^{-7}+48t^{-5})e^{4-t^{-2}}.
$$

Each summand increases on that collar. Away from the endpoint, direct
interval differentiation of the logistic expression is used. The flat
endpoint derivative is exactly zero, with no floating-point underflow used
to establish it.

The B.8 shapes are `b(x)=sigma'((x-left)/width)`, without division by width.
Their logarithmic radial derivatives satisfy

$$
|D b|\le\frac{x}{w}\|\sigma''\|_\infty,\qquad
|D^2b|\le\frac{x}{w}\|\sigma''\|_\infty
+\frac{x^2}{w^2}\|\sigma'''\|_\infty,
\quad D=x\partial_x.
$$

The eta derivatives come from the same implicit coefficients and K. The
restoration interval uses sigma directly in `log x`, and its actual
`Gi-4eta`, first derivative, and second derivative bounds. These formulas
give explicit upper bounds for `E,U` through eta order two and the mixed
first eta/log-radius and second log-radius derivatives required by the
shears.

The pressure bounds also use the actual A.21 function. Its second eta
derivative is bounded by 28 times its positive mixture mass: differentiating
`(1+eta^2)^(-2theta)`, for `0<=theta<=1`, gives the elementary bound 28
on the closed parameter interval. The exact forward pressure primitive is
then added. No pressure datum is independently chosen here.

## 3. Differentiate B.35 before estimating

All moments below are the B.35 hats. Let

$$
W=1-\frac{2D\eta M+dM_\eta}{x},\qquad
B_Q=(1-h)I-D\eta I_\eta-dJ_\eta+2(h-D)\eta J.
$$

Then `Qs=-W+BQ/(x sqrt(2x) E)`. Its eta derivative uses the moments through
order two, and its log-radius derivative uses their exact densities. For
example, `Dlogx M=xU`, `Dlogx I=x sqrt(2x) E`, and
`Dlogx J=x sqrt(2x) UE`. The code retains the entire derivative of the
denominator, including its `3/2` logarithmic power.

For the axial residual,

$$
N_s=-WU+\frac{D(M-\eta M_\eta)+4h\eta S-dS_\eta}{x}
+4A\eta\Pi-d\Pi_\eta.
$$

Its eta derivative has numerator
`-D*eta*M_etaeta+4h*S+(4h+2)*eta*S_eta-d*S_etaeta` in the fraction.
Its log-radius derivative uses the exact densities of M, S, and Cp.
The resulting absolute bounds are converted to `p_s/XR=x*(Qs,Ns/E)/L`.
For this datum, the computed bound for `|d_eta(p_s,2/XR)|` is below
`9.720713e6` throughout the joining rectangle.

## 4. Quantify the implicit loop and inverse phase

Use the normalized C.1 parameters from `JOINING_LOOP.md`. Set
`Z=muMaxTimesXR*maxAbs(p_s,2/XR)` and let H be an integer upper bound
for `sqrt(1+Z)`. The normalized exponential density is at most `12H`.
The integral form of its removable quotient gives

$$
|t_\mu|\le24\bar d H,\quad
|t_p|\le30\bar d\bar\mu_{max}^2H,\quad
|t_\theta|\le12\bar d\bar\mu_{max}H.
$$

Here the mu derivative is with respect to normalized `mubar`, and the p
derivative is with respect to `p_s,2/XR`. The second derivative of the
normalized density is bounded by five times `mubar^2` times that density,
which gives the middle bound.

On this rectangle the cutoff equals one, and the target variance is at
least one. Since `V <= (24*dbar*mubar*H)^2`, the chosen root satisfies
`mubar >= 1/(24*dbar*H)`.

For the tilted probability measure at argument z, its density is bounded
below by `exp(-2|z|)`. The double-integral formula for variance therefore
gives `g''(z)>=exp(-4|z|)/2`, where `g=log I0`. Integrating this bound from
z to 2z in C.6 yields

$$
V_\mu\ge\bar d^2\bar\mu e^{-8Z}.
$$

The same inequality extends at p=0, where the derivative is exactly
`dbar^2*mubar`. Differentiating `V(mubar,p)=rho/a` now gives explicit bounds
for both slow root derivatives, expressed as a rational coefficient times
`exp(8Z)`.

The phase map satisfies
`phi_theta=a(1+t^2)/(2*pi*v)>aMin/24`. Its slow derivative obeys
`|phi_s|<=|a_s|/aMin+aMax*Tmax*|t_s|`, because v is constant on this
rectangle. Implicit differentiation of its inverse therefore bounds
`theta_s` at fixed phase. Adding `t_theta*theta_s` gives the derivative
of t at fixed phase. The derivatives of `aL=v/(1+t^2)` and
`bL=-v*t/(1+t^2)` have absolute value at most three times this bound.

Differentiating the zero-mean primitive identities C.11 then bounds
`A_eta`, `Dlogx A`, `B_eta/E`, and `Dlogx B/E`. Their common exponential
factor is

$$
e^T,\qquad T=8Z\simeq1.46592759043731778\cdot10^{72}.
$$

The exact coefficient for `|A_eta|` is below `1.459221e527`, and that for
`|Dlogx A|` is below `4.461447e526`, before multiplication by `exp(T)`.
The JSON retains exact rational coefficients and an exact rational T.
It does not evaluate this exponential or replace it by infinity.

## 5. Generated moment increments, with the incoming error retained

For `N>=max(4,exp(T))`, define `epsilonN=exp(T)/N<=1`. C.12 and C.13
give absolute field, eta derivative, and shear errors bounded by recorded
rational coefficients times epsilonN. Products are estimated using
`epsilonN^2<=epsilonN`; the pressure increment is integrated in log x,
whose length is exactly three here.

For each of the five moment components and eta orders zero and one, the
output bounds

$$
|\Delta m(x)-\Delta m(e^{-8})|\le C_m\,\epsilon_N.
$$

This is an increment bound. The term `Delta m(exp(-8))` remains the actual
unknown incoming error from the other modulation panels. It is never
silently deleted. Keeping the same axis pressure datum means that the
incoming Cp error also controls the incoming pressure error.

## 6. Exact cone tolerance and a finite local frequency

`certify_joining_frequency.py` checks all four cone inequalities under
simultaneous perturbations of a, b, and both normalized residual components
of size at most

$$
\varepsilon=2^{-2048}.
$$

For instance, with loop lower bound `aL>=a0` and `|bL|<=3/2`, it uses

$$
|\Delta t|\le\frac{\varepsilon}{a_0-\varepsilon}
+\frac{(3/2)\varepsilon}{a_0(a_0-\varepsilon)}
$$

and the corresponding exact quotient bound for `Delta v`.
These bounds are inserted into `Pc`, `Jc`, and the quadratic cone gap.
The resulting four positive margins are explicitly checked with fractions.

A separate Lipschitz bound converts absolute field and moment errors into
errors in `p_s/XR`. The algorithm then selects

$$
N_{local}=\left\lceil\exp(T+3853)\right\rceil.
$$

The safety exponent 3853 is computed from the exact maximum error coefficient,
the residual sensitivity, and epsilon. The integer inequality using
`2^3853` is checked directly, and `exp(-3853)<2^-3853` supplies the needed
tail bound. The exact rational exponent is in the JSON; no integer with
astronomically many digits is materialized. Phase is an independent circle
coordinate in every uniform estimate.

The joining contribution at this frequency fits the required tolerance.
To infer the cone for the modulated field on this rectangle, one still needs
the incoming errors in all five hat moments, including their eta derivatives,
to be at most the explicit positive fraction whose displayed value is

$$
\|\Delta m(e^{-8},\cdot)\|_{C^1}\le3.84953515602432665\cdot10^{-619}.
$$

This is a per-component maximum norm with actual eta derivatives, in the
units `(M/XR,I/XR^(3/2),J/XR^(3/2),S/XR,Cp)`. It has not yet been proved
for a complete original C.12 modulation. Moreover, the loop must be one
compatible smooth family on the whole original I. The final moment repair
on the actual reserved source-lambda patch and the original exterior
continuation also remain separate. These open conditions are explicit in
every completion flag.

## Reproduction from the repository root

```sh
python3 navier/followup-next/uniform-gluing/bind_source_debt.py --source navier/followup-next/source-coherence/uniform-source-debt-final.json --output navier/followup-next/uniform-gluing/source-final-bound-moment-inclusion.json
python3 navier/followup-next/uniform-gluing/certify_joining_rectangle.py --source navier/followup-next/source-coherence/uniform-source-debt-final.json --binding navier/followup-next/uniform-gluing/source-final-bound-moment-inclusion.json --output navier/followup-next/uniform-gluing/source-final-joining-rectangle-certificate.json
python3 navier/followup-next/uniform-gluing/certify_joining_loop.py --source navier/followup-next/source-coherence/uniform-source-debt-final.json --binding navier/followup-next/uniform-gluing/source-final-bound-moment-inclusion.json --rectangle navier/followup-next/uniform-gluing/source-final-joining-rectangle-certificate.json --output navier/followup-next/uniform-gluing/source-final-joining-loop-certificate.json
python3 navier/followup-next/uniform-gluing/certify_smooth_derivatives.py
python3 navier/followup-next/uniform-gluing/certify_joining_slow_bounds.py
python3 navier/followup-next/uniform-gluing/certify_joining_frequency.py
```

These commands preserve the previous source-specific JSON files. They use
the repository's vendored mpmath only for optional diagnostic verification;
the bound-producing programs use exact rational and outward dyadic arithmetic.
