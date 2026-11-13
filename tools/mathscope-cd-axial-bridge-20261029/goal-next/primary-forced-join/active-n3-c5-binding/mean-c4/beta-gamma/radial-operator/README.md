# Shifted radial operator bounds and beta derivative obstruction

The executable ledger pins the unchanged original `shiftedRadialIntegrals`,
temporal `A1`, mean cutoff geometry, and the previous same-live N3 gamma
receipt. It confirms their source syntax and expands the bounds below in
integer arithmetic. It does not numerically evaluate the source geometry.

Let the fixed integration interval be `[r0,r1]`; write the original phase as
`phi` with `phi_R=a`, and let `L=vr·d_Y`. The original source uses

```text
I_left f  = integral(r0,R) f(r,Z,T,Y + (phi(r)-phi(R))*vr) dr
I_whole f = integral(r0,r1) f(r,Z,T,Y + (phi(r)-phi(R))*vr) dr
T0 f = I_left f - chi I_whole f
A1 f = (chi_R/R) I_whole(r f).
```

All derivatives refer to the same fixed common-Y chart. The source proves
that `phi` is independent of Z, T and Y and has derivative a; the interval
endpoints are fixed on that chart. Therefore, with the original periodic
translation and suitable source smoothness,

```text
d_R I_left f  = f(R,Z,T,Y) - a I_left(L f)
d_R I_whole f =             - a I_whole(L f).
```

`d_Z`, `d_T`, `L`, and `N` commute with each integral. This does **not**
assert commutation with T0 or A1: all cutoff derivatives are retained.

Let C >= 1 dominate `r1-r0`, `|r|` over the interval, all radial derivatives
of a through order 3, all mixed `(R,Z,T,L,N)` derivatives of chi through
order 4, and those of `1/R` through order 3. Let `Ck` be the maximum of the
sup norms of all mixed words of length at most k in those five directions.
The scalar C is a concrete remaining geometry premise: in particular chi is
the actual `step(10*(R/(sqrt(s)*x0)-1))`, whose mixed derivatives and chart
denominators must be bounded on the actual shell. C may depend on epsilon.

For either shifted integral, define `U0=C` and

```text
Uk = 1 + C sum(i=0..k-1) binom(k-1,i) U(k-1-i),  k=1,...,4.
```

Then `||I_left f||_Ck, ||I_whole f||_Ck <= Uk ||f||_Ck`. Induct on k:
when a word contains an R derivative, apply the displayed identities to one
of them. The endpoint term costs at most one input Ck norm; distributing the
remaining derivatives over a and `I(Lf)` gives the indicated binomial sum.
Mixed slow/angular derivatives of a are zero in the source. Words with no R
derivative are bounded by the interval width. Nonnegative coefficients make
the Uk increasing for C >= 1. Flat joins and differentiating under the
integral remain analytical premises.

Leibniz yields

```text
||T0||_(C4 -> C4) <= O0(C) = U4 + C sum(j=0..4) binom(4,j) U(4-j)
  = 1+22C+33C^2+33C^3+32C^4+11C^5+C^6.

||A1||_(C3 -> C3) <= O1(C)
  = 8 C^2 (C+3) sum(j=0..3) binom(3,j) U(3-j)
  = 168C^2+224C^3+248C^4+208C^5+72C^6+8C^7.
```

Here `||chi_R/R||_C3 <= 8C^2`, and multiplication by the integration
coordinate r costs at most C+3 in C3. Substitution into the earlier gamma
bound removes its abstract O0/O1 premises, at the cost of the explicit
geometry premise C. The output at C=1 is an arithmetic check, **not** a
claim that the original geometry has C=1. No epsilon-uniform exponent,
actual gamma gate, or further 67-jet closure follows without an actual bound
for C and the previously stated same-live hypotheses.

## Why C5 alone does not close beta by these general operators

Consider only a smooth toy version with interval [1,2], `a=chi=0`, epsilon
and c0 equal to 1, and `Wrz=m^-5 sin(m Z) sin(Y)`; all other covariance and
stress terms vanish. The C5 norms of Wrz are uniformly bounded in integer
m. The positive-N beta identity and the same formal source operator pattern
give at R=2, up to a fixed overall sign,

```text
d_Z^3 N beta = (5/12) d_Z^6 Wrz - (1/2) d_Z^4 Wrz.
```

Indeed `T1(T0(1))=5/12` and `T1(1/R)=1/2` at R=2. At `Z=pi/(2m)` and
`Y=pi/2` its absolute value is `5m/12+1/(2m)`, hence unbounded. This is a
counterexample only to a generic bound using C5 and these operator identities;
it is **not** a counterexample for the actual covariance family. A proof
may still exploit additional source structure or an independently proved
extra mixed derivative bound. Integration by parts in the radial variable
alone cannot provide the missing Z regularity in this generic model.

## Reproduction

From the repository workspace root, using Node.js and the archived paths:

```text
node work/goal-next/continuation39/radial-operator/check_operator.mjs \
  work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-pressure.mjs \
  work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-temporal-potential.mjs \
  work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-current-state.mjs \
  work/goal-next/continuation38/beta-gamma/same-live-gamma-bound-v3.json \
  work/goal-next/continuation39/radial-operator/operator-polynomials.json
```

The line continuation shown is for a POSIX shell; on PowerShell use one
line or the native continuation syntax. The checker accepts explicit paths and
fails on any mismatch in the four SHA-256 pins. Its finite arithmetic and
source-syntax checks are separate from the analytical proof and its premises.

## Directed source geometry

`evaluate_source_geometry.mjs` pins the original common pressure cover, mean
geometry, slow chart and cutoff kernel. It uses the whole-N3 directed K
interval and the previous positive-N gamma identity. Work on the original
fixed reference chart with integer band index ell≥4, 1/2≤s≤2, |eta|≤1 and
the full fixed radial integration shell. Let H=max(3,C12EnvelopeR,1/sqrt(Xa)).
The original radius premises give H^(-1)≤sqrt(Xa)≤R≤2sqrt(Xb)≤H.
The integration length and |R| are at most H. The derivatives of 1/R
through order four, including its value, are bounded by 24 H^5.

Write Q=2^(-ell), epsilon=Q^h, and i0=i(ell-2), with the original
palette i. Since ell/(ell-2)≤2, the unfloored palette numerator at ell
exceeds the numerator at ell-2 by at least 2h log 2. Therefore
Lambda^i0 ≤ Lambda^i(ell). Using S=ell²≥1 and the original radial exponent,
Lambda^i(ell) Q^(dr/2)≤epsilon^(-kappa_s). In this comparison Lambda is the
pulse constant 4-sqrt(2). The pulse ratio rho_g lies between 1/4 and 3/4:
2<Lambda<3, 5<Tg<6, and 3^4<5^3. Hence 0<dr<2 for the original h<1/64.
The phase derivative a and its first four ordinary radial derivatives
are bounded by 40320 H^5 epsilon^(-kappa_s), using the falling products
of dr and the original positive R interval. Its other derivatives vanish
at fixed label.

The cutoff argument is b=10(R/(sqrt(s)*x0)-1). Its transition has
1≤R/(sqrt(s)*x0)≤11/10. The directed parameter evaluation verifies X0Imean>1,
hence x0=sqrt(2*X0Imean)*exp(1/2)>1. To bound all mixed derivatives of b
through order four, center a complex polydisc of radius 1/256 in (R,Z,T)
at a real transition point. For fixed Z,T in the polydisc the map
u↦T+Z²u^(2h) is a contraction on |u-s|≤1/16 using the principal branch.
Indeed |Z|<3/2, |u|≥7/16 and 2h<1/32 give Lipschitz constant <1/4.
Its displacement at the center is at most
`[1+2*(2*sqrt(2)+1/256)]/256 < 3/64`; it maps the disk into itself.
The uniform limit of analytic iterates gives the holomorphic chart s.
On this polydisc |sqrt(s_center/s)|≤2 and the new radial displacement
changes the real normalized numerator by at most 1/256 before that factor
of two. Hence |b|<70, and Cauchy's estimate gives
`|D^alpha b| ≤ 70 |alpha|! 256^|alpha|`. The original sigma derivative
bound and the multivariate product rule, grouped by set partitions, give
the Bell-polynomial cutoff bound. On the other branches the cutoff is
constant, and flatness gives the same inequality at the two joins. This
argument concerns the elementary slow chart and cutoff argument. It
requires no complex extension of the actual covariance.

Take C0 to be the maximum of 40320 H^5 and the four cutoff derivative
bounds. Then C=C0 epsilon^(-kappa_s) bounds the geometry in both the
operator ledger and the earlier factor A through order four. As C≥1,
O0≤133 C^6 and O1≤928 C^7. The total 14 factors cost at most
epsilon^(-14 kappa_s); the explicit numerical gamma coefficient thus
multiplies `S_ref^3000 epsilon_ref^(1-14/100000)` for all 52 positive-N
shapes. This is a coarse, uniform-in-label coefficient. The original
source smoothness, flat support, fixed-label class, valid real chart,
and exact Fourier differentiation remain premises. The zero-N sector,
beta, and the full output are open.

```text
node evaluate_source_geometry.mjs ARITHMETIC_RUNTIME ORIGINAL_RUNTIME HISTORICAL_RESULT HISTORICAL_INPUT N3_WHOLE_K SAME_LIVE_GAMMA OPERATOR_POLYNOMIALS source-geometry.json
```
