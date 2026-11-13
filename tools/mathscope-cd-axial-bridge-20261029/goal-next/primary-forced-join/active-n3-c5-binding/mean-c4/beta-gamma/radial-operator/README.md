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
