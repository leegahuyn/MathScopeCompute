# Same-live N3 own-label mean-v pullback

The checked result `same-live-own-mean-v.json` carries the conditional
pointwise bounds for the 52 positive-longitudinal v shapes from the exact
same-live N3 common-reference W4/mean result into the original own label.
The original 21,681,493-node stream, registry, two selected paths and earlier
source receipts are SHA-pinned by `check_own_mean.py`. This is not an
independent Lean proof or a numerical enclosure of K.

The actual normalized mean is node #21435344, with exact source definition

```text
rho^(-A) * v_ref(rho^(-1/2) R, rho^(-D) Z, rho^(-1) T, ell_ref, Y),
rho=Q_ref/Q_own, A=1/2+h, D=1/2-h.
```

The source node #21435343 applies the actual `ActualInitializedMeanVelocity_1`
definition, whose body is #21435336. In both selected `0:1` and `1:1` native
mode-one source definitions, the checker reads an actual add/multiply path from
the first real and imaginary source component to #21435344. This is exact
syntactic reachability; it does not by itself prove a nonzero mathematical
contribution or an estimate for the complete mode-one source. The actual
`H_w` nodes for both selected delta branches and their source identities are
also checked against the independent endpoint receipt.

At fixed labels and nearest copy, with `Lambda=4-sqrt(2)` and `Tg=4+sqrt(2)`,
the original lift gives

```text
d_xi = Lambda^(-delta) L,     d_w = (ci_own/Tg^delta) N,
H_w = Y + (ci_own/Tg^delta) (w-v(Y)) vt.
```

Thus for `j>=1` each own derivative with slow orders `(r,z,t)` and transverse
order `l` is exactly the common-reference derivative multiplied by

```text
rho^(-A-r/2-D*z-t) * Lambda^(-delta*l) * (ci_own/Tg^delta)^j,
```

evaluated at the original path. For each fixed base point, the path moves
along the common torus, so a uniform reference bound applies at every path
point if all of that path is inside the stated source domain. As a map of the
base point, H_w is not asserted to be a translation. The original floor formula gives
`ci_own<=ell_own^-2<=1` for an admitted label `ell_own>=8`. The exact finite
cover has `0<=delta<=4`, and `Lambda,Tg>1`; the transverse and longitudinal
factors are therefore at most one.

With `epsilon_ref=rho^h epsilon_own` and `0<kappa_s<1`, the remaining rho
factor has exponent

```text
-1/2 - h*kappa_s - r/2 - (1/2-h)*z - t.
```

All 52 indices have `r+z+t<=3`. Under `0<h<1/2` and the original overlapping
chart bound `1/4<=rho<=4`, this exponent has absolute value at most 4 and the
whole rho factor is at most `4^4=256`. The check covers each index and exact
endpoint arithmetic, and rejects altered source square-root, Tg inversion and
normalization nodes.

Both charts describe the same `q,X,eta`. Indeed, the original inverse chart
equation is `T=s-Z^2*s^(2h)`; after setting `s_ref=s_own/rho`, the transformed
equation holds because `2D+2h=1`. Uniqueness on the admitted positive branch
then preserves q, X and eta, hence the original zeta and logarithmic distance.
The interval and flat-join conditions must be checked for the entire original
pulse path; the bound below is for `Xa<X<Xb` with `delta_*>0`. It does **not**
infer an endpoint value by evaluating `delta_*^-36` at zero.

Combining with the conditional common-reference estimate gives the following
own-label upper bound, with `S_ref=ell_ref^2` and K in the same live target
norm graph. For 19 indices the constant is `764411904`; for the other 33 it is
`382205952` because their remaining N or L derivative removes the Haar mean:

```text
constant * 4^2589 * Tg^21 * K^2586 * S_ref^2590
         * epsilon_own^(1-kappa_s) * zeta * delta_*^(-36).
```

The result assumes the same-live original local C4 class at every actual
mapped point, complete finite cover, original cutoff/flat joins, inverse
Fourier theorem, positive source geometry and original radial-phase bound.
The local C4-to-common W4 transfer is a separate symbolic argument in the
prior receipt, not a newly executed native pre-Haar seal. The supported
mode-one forcing, other mean components, zero-N derivatives, explicit
numerical constants and final 67 jet intervals remain open. RELEASE HOLD.

## Additional same-live beta/gamma source identities

`check_beta_gamma.py` additionally pins the actual source E_z #17754268 and
its exact original inverse #19563093, the temporal beta and gamma terms
#19570921 and #19570930, and both background and FiveMap operands. The
FiveMap definitions have no common-Y parameters. On the original smooth,
fixed-label domain, the exact Fourier identity and translation commutation give

```text
N^j beta = epsilon*c0^-1*d_Z[T1(N^(j-1) Pperp E_z)],
N^j gamma = -c0^-1*(I-A1)[N^(j-1) Pperp E_z],       j>=1.
```

The entire original shifted T1 and A1 operators are retained, including the
outer cutoff and every derivative of its coefficients; in particular the
`d_Z` is not moved through T1 without those terms. The checked receipt is
`same-live-beta-gamma-identities-v2.json`. It supplies no bound for E_z or the
radial operators and no beta/gamma pointwise estimate.

Use `check_own_mean.py --help` to supply the explicit source-node stream,
registry, witness, endpoint, W4 and demand receipts, and original initialized
angular source. Every input hash is pinned inside the checker. No Git or Lean
operation is required. Use `check_beta_gamma.py --help` for its additional
source-pinned inputs.
