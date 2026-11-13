# Same-live N3 positive-N gamma: conditional source bound

The pinned 21,681,493-node source graph has actual `E_z=#17754268`, source
stress term #17744195 and pressure-Z term #17754234. The checker reads their
exact nodes, matches the source pressure construction, and verifies all 162
signed rows of each of the actual `W_rr`, `W_rz`, `W_thetatheta` and `W_zz`
systems against their own local definitions. The prior same-live receipt binds
the exact z Fourier inverse and the original temporal gamma/FiveMap bodies.

The original source is

```text
G   = -D1 W_rr - epsilon*d_Z W_rz + W_thetatheta/R,
E_z = D1 W_rz + epsilon*d_Z W_zz
      + epsilon*d_Z T0(G - rho*P) - D1 stress_z,
D1  = d_R + a L + 1/R.
```

`T0` is the *complete* original left-minus-cutoff-whole shifted radial
operator. `P` and the stress term are common-Y independent. Haar projection
commutes with the original radial translation, so it removes those two
Y-independent inputs; it does not set either original input to zero. All
cutoff, `chi_Z`, whole-integral and shifted arguments remain. The exact
positive-N source identity, under the source Fourier and smoothness premises,
is

```text
N^j gamma = -c0^-1 (I-A1) N^(j-1) Pperp E_z,  j>=1.
```

The required source norm for the 52 positive-N mean-wave shapes is C3 for
`Pperp E_z`, hence at most C5 for W: the pressure source contributes one
derivative inside G and `d_Z` outside T0. This C5 is available as a same-run
**local** Primary class row; its global common-Y transfer still uses the
original fixed-label, admitted-map and flat-join hypotheses.

## Explicit symbolic estimate

The C5 local covariance row is `K^2994 S_label^2994 epsilon_label zeta
delta_*^-42 P(v)^2`. The same 162-row fixed-label transfer as in the prior W4
proof gives the conditional common-Y C5 estimate

```text
B5_weighted = 5184 * 4^2999 * Tg^25 * K^2994 * S_ref^2999
              * epsilon_ref * zeta * delta_*^-42.
```

The pressure integral traverses radii, so one may not retain the output
point's zeta as if it were a bound at every integration point. The original
two-collar source has `zeta=exp(-t1^2/u^2-4/v^2)`,
`u=log(X/Xa)`, `v=log(Xb/X)` and `delta_*=min(1,u,v)`. For positive t1,
`exp(-x)<=22!*x^-22` and a separate `delta_*=1` case give

```text
zeta * delta_*^-42 <= Z42 = 1 + 22! * (t1^-44 + 4^-22).
```

For either active collar the same proof includes an extra `delta_*^2`, so
the scalar Gaussian envelope tends to zero at that seam. The original source
flat joins are still needed for the *field* and differentiated integrals.
Let B5 denote the displayed C5 expression with `Z42` replacing the local
weight, uniformly over the whole integration shell.

Define Ck as the maximum sup norm of all mixed words of total order <=k in
`(d_R,d_Z,d_T,L,N)` on the specified fixed-label chart. Let `A>=1` bound
the slow derivatives through order 4 of both `a` and `1/R`. Let `O0` bound
the actual shifted T0 as `C4 -> C4`, and `O1` bound the actual A1 as
`C3 -> C3`. These norms must cover the original full radial interval and the
same common-Y domain. The conditional Leibniz count gives

```text
||G||_C4 <= (2+3*2^4*A) B5 <= 50*A*B5,
||Pperp E_z||_C3 <= 2*(18+50*O0)*A*B5,
||D_s^alpha L^l N^j gamma||_infinity
    <= 136*c0^-1*A*(1+O0)*(1+O1)*B5,
```

for each of the 52 positive-N shapes (`j>=1`,
`|alpha|+l+j<=4`). The first 2 in the second line is the pointwise bound for
the normalized Haar projection, not an assumed mean-zero original source.
No commutation of T0 or A1 with slow derivatives is assumed: their actual
norms must include derivatives of the shift, endpoint and cutoff.

Using the previous same-family source bounds `c0^-1<=8*Tg*S_ref` and
`A<=K*epsilon_ref^-kappa_s` yields the explicit symbolic coefficient

```text
5640192 * 4^2999 * Tg^26 * K^2995 * S_ref^3000
  * epsilon_ref^(1-kappa_s) * Z42 * (1+O0)*(1+O1).
```

The factors O0 and O1 have **not** been bounded numerically or uniformly in
epsilon and may themselves depend on epsilon. Therefore this does not claim an
epsilon class exponent or close the actual gamma class. It is a source-bound,
conditional reduction on the fixed common-reference chart. Own-label gamma
conversion, beta, zero-N components, full mean C4, Forced and all 67 numerical
jets remain open. RELEASE HOLD.

`check_gamma.py --help` lists the pinned graph, registry, source and previous
receipt arguments. It checks the exact integer constants and source nodes;
the analytic operator norm premises and original smoothness are not inferred
from a finite node scan. No source checkout, Git branch or local Lean was
changed.
