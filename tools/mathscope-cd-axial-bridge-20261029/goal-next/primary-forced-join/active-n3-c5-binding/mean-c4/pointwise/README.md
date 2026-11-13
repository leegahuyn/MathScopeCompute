# Positive-N v: same-live pointwise reduction

This work starts with the pinned same-live N3 initialized mean identity and the
52 positive-N derivative indices from `continuation33/mean-c4`. The source has
not yet been numerically bounded on the whole common-Y domain. All inequalities
below are conditional on the original finite source, fixed-label chart, smooth
flat joins and the stated norm premises. No complete mean C4, Forced class or
final numerical jet is asserted.

For the actual component `v=#21435336`, at fixed ell and common Y the original
Fourier identity and the original Y-independent stress and FiveMap terms give

```text
N^j v = -c0^-1 N^(j-1) Pperp (D2 W_rtheta + epsilon d_Z W_thetaz), j>=1,
D2 = d_R + a L + 2/R,  Pperp f = f - Haar(f).
```

Take `D_s=(d_R,d_Z,d_T)` with common Y held fixed. Suppose `0<epsilon<=1`,
`c0>0`, `A>=1` bounds every `||D_s^beta a||_infinity` and
`2||D_s^beta(1/R)||_infinity` with `|beta|<=3`, and `B` bounds the actual
enumerated source W derivatives in the sup norm. Then the 52 required
positive-N derivatives of v are bounded by `36*c0^-1*A*B`. For 33 of them,
the source has an L or N derivative, which has zero Haar mean, so the sharper
factor is `18`; for the remaining 19 only `||Pperp f||_infinity<=2||f||_infinity`
is used. This conclusion does not require the 2D L2-to-sup estimate below.

## Exact 162-row source and conditional local transfer

The same-run Primary C5 receipt provides an order-four **local** full
covariance estimate, source constant #18310098, scale power 2585, epsilon
power 1, zeta weight, distance pole 36 and `P(v)^2`. The source registry says
`actualPreHaarCommonYCovarianceClassCertified=false`; the local estimate is not
itself a global common-Y norm. The checker verifies that the actual rtheta
and thetaz systems each contain 81 distinct boxes and both signs, all 162 row
local body/system pairs match their native definitions, and the derivative
maps involve precisely the five local slots `(R,Z,T,xi,v)` while labels and
other discrete inputs are held fixed.

For a finite pointwise transfer, assume all five mapped arguments and each
row coefficient have mixed derivatives up to degree four bounded by `C>=1`
in the five common directions `(R,Z,T,L,N)`; assume the applicable local
covariance derivatives through degree four are bounded by `M` at all mapped
points; and assume the exact original support, chart domains and flat joins.
The set-partition product/chain rule contains at most 2576 terms per row at
degree four, so

```text
B <= 162 * 2576 * C^5 * M = 417312 * C^5 * M.
```

Consequently the two v bounds above become `15023232*c0^-1*A*C^5*M` for the
19 rows and `7511616*c0^-1*A*C^5*M` for the 33 others. These are explicit
conditional arithmetic bounds, **not** actual numerical enclosures: deriving C,
uniform M from the same-live local weighted estimate, the dyadic conversions,
and validity on all mapped pulse paths remains open. In particular the Gaussian
and other weights cannot be silently discarded or identified across labels.

## Why one L2 derivative is insufficient in general

The original Fourier integrals use the unit torus with normalized Haar mass 1.
Set `a=sqrt(2)-1` and `d=1+a^2`. Exact arithmetic in `Q(sqrt(2))` gives

```text
d_Y0 = (L+a*N)/d,      d_Y1 = (N-a*L)/d,
d_Y0 d_Y1 = (-a*L^2 + (1-a^2)*L*N + a*N^2)/d^2.
```

On the unit torus the one-dimensional identity
`f(x)=integral(f)+integral(K_x(s)*f'(s))`, with `|K_x|<=1`, applied twice and
Cauchy–Schwarz gives

```text
||f||_infinity <= ||f||_2 + 2||Lf||_2 + 2||Nf||_2
                 + ||L^2 f||_2 + ||L N f||_2 + ||N^2 f||_2.
```

This particular sufficient estimate adds two torus derivatives to each v
operand and reaches source covariance order six in the top cases. The current
local Primary C5 covariance rows reach order five; they do not supply W6, nor
the missing common-Y transfer. That is a limitation of this L2-to-sup route,
not proof that every possible pointwise argument needs Primary C6: the direct
sup-norm route above needs only W4 once its hypotheses are established.

One first-order L2 bound alone cannot yield a general 2D pointwise bound. Let
`f_m(Y)=sum_{0<||k||_infinity<=m} exp(2*pi*i*k.Y)/(1+|k|^2)` and let
`S_m=sum 1/(1+|k|^2)` over the same set. Exact orthogonality gives
`f_m(0)=S_m` and `||f_m||_2^2+||grad f_m||_2^2/(4*pi^2)=S_m`. Each square
shell has 8m points and gives `S_m>=8/3 * H_m`, so the ratio of pointwise size
to H1 size is unbounded. `L,N` are an invertible constant basis, so they do
not repair this critical embedding. The checker tests finite rational shell
instances and the exact direction matrix; the divergence argument is stated
here, not proved by the finite test alone.

## Reproduction

`check_pointwise.py` takes the pinned previous demand receipt, same-live
Primary receipt, native registry and original Fourier source via explicit
arguments. Use `--help` for the exact interface. The checked result is
`same-live-pointwise-cover.json`; all input SHA-256 pins are inside the script.
The underlying 21M-node graph verification is the separate prior readback
referenced by the demand receipt, not repeated by this script. RELEASE HOLD.
