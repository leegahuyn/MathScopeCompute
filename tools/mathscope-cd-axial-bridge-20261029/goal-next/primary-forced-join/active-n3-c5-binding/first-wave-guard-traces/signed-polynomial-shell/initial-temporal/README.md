# C86 actual initial Temporal centering and pressure shell path

## VERIFIED

The audit authenticates the 22,155,584-record source export and original native registry from GitHub run 44582875351. It binds the **pre-Forced** GlobalActualTemporal systems, including the exact center subtractions in the Fourier path.

| Actual operand | θ | z |
| --- | ---: | ---: |
| Raw E | 17754253 | 17754268 |
| Negative original stress divergence arm | 17744077 | 17744195 |
| Complete normalized Haar | 19561020 | 19563359 |
| Actual E−Haar E | 19561026 | 19563365 |

The replay compares the entire nonstress expression after the two actual Haar-coordinate substitutions. Native field IDs, argument order and derivative directions remain exact. Both nested integrals use [0,1], with the original normalized Haar convention. Each negative original stress arm is the same root inside and outside its Haar integral and has no dependence on the common torus variables. Therefore the original stress vanishes from the centered Temporal source. Its separate whole radial moment can remain open.

The direct positive Primary covariance terms use the original indexed fields (162 rows each). The two direct operators are `Dr(Wrθ)+2Wrθ/R+εWθz,Z` and `Dr(Wrz)+Wrz/R+εWzz,Z`. The axial system also retains `ε pZ`. The audit reads actual pressure derivative #17754234 as

```
pZ = I_Z − χ J_Z − χ_Z J
```

with actual pressure integrals I/J #17753667/#17753668 and actual differentiated-source integrals I_Z/J_Z #17754191/#17754192. In each the bound radius replaces R inside the original primitive. The two shifted arguments are exactly `Y + (φ(r) − φ(R)) v_r`. The displacement depends on radial variables and frozen labels. It is independent of Z,T,Y. The two integrals retain the same actual direction and each uses the original lower radius and its original moving or fixed upper limit.

## CONDITIONAL outer collar transfer

On the original outer collar established in C83, χ=1 and ρ=0 on the short outer interval. Subtracting the fixed whole integral gives the backward interval from R to the fixed outer radius β, with the same shifted integrand. The derivative in the bound radius of a translated covariance field is its actual `Dr=∂r+aL` along this path. With the original zero exterior at β, FTC gives

```
p_m(R,Y) = −Wrr(R,Y)
           + ∫[R,β] (Wrr/r + ε Wrz,Z − Wθθ/r)(r,Y+shift) dr.
```

This retains the radial term and the full pressure feedback. A Z derivative hits the actual covariance or its slow factors. A radial derivative retains the translating argument and the moving endpoint. The full same-live field bounds for these derivatives are open.

The initial FiveMap increment vanishes on the original collars by the C84 source receipt. Thus the initial mean increment there is linear Temporal from this covariance and its pressure. Acting on the centered source removes the independent background stress, including the exceptional order-one theta arm. For estimates, apply the native weighted Fourier tails to the actual spatial and torus covariance derivatives. The `T1` outer short integral preserves the weighted source class with finite algebraic poles, under the admitted smooth joins and integrability.

### Consequence for the mode-one Gaussian exponent

The original outer covariance factor producer writes each positive Primary square-root amplitude as `G(d) sqrt(W_sign)`, with `d=log(Xb/X)`, `G(d)=exp(−2/d²)d^(−3/2)`, and strictly positive smooth normalized coefficients on its admitted outer domain. That certificate was produced on its original selected band. Transferring the regular normalized coefficients and the retained full target to the live label family is a separate source obligation.

If that regular outer factorization holds along a fixed live chart ray and the initialized mean and its first derivative obey `mean=o(d^(-3))` and `grad mean=o(d^(-6))`, the leading original projected mode-one forcing comes from viscosity on the differentiated true Primary curl. For a normalized positive-mode potential `i G S` with `S=c(n×t)`, its leading term is proportional to

```
i ε G''' |grad d|² P_n(grad d × S)
= −i ε G''' |grad d|² c (grad d · n) t .
```

The full original pressure and principal pulse tail are linear in the undifferentiated amplitude. Time, actual background/mean advection, and cylindrical lower-order connections use at most two Gaussian derivatives. On the admitted source ray Z=0,T=1, R=√(2Xb)exp(−d/2), take the original radial mesh label nearest to \(\ell^6\sqrt{2X_b}\) and the original axial/time labels 0, \(\ell^6\). The band offset is zero on this ray. The slow factors stay positive near d=0. Pick ξ=0 and one of the two interior pulse values L_s/3 or L_s/2. The true n_R=x0−w H_R has x0≠0, hence at most one zero; t is nonzero by homogeneous ODE uniqueness. With admitted positive outer coefficients, the displayed term then has a nonzero leading coefficient and G'''/G is asymptotic to 64 d^(−9).

Under those premises a same-Gaussian exponent-one bound for the **projected mode-one forcing**, even with finite algebraic poles, cannot follow. The appropriate shell continuation instead carries the half-Gaussian times poles through the inverse and forms full-weight products in covariance. A quantitative result requires the actual weight of the aggregate source and the admitted initial mean, with the finite poles left explicit. This section is an analytical conditional consequence and has no new numerical claim.

## OPEN

Uniform weighted bounds on the original Primary covariance jets and on the initial mean and complete projected Forced paths. The post-Forced Haar stress whole moment, renewed pressure, Signed radial seam, N7-06 and N8-05 remain open. Final jets 0/67 and RELEASE HOLD.

## Replay

Use the existing original evidence directory as GOAL, local work/goal-next as WORK, the extracted 44582875351 directory as ARTIFACT, and the immutable C80 authenticated source cache as CACHE. Pass an unoccupied output path. Run Python with assertions enabled.

```powershell
python -B verify_initial_temporal.py --goal GOAL --work WORK --artifact ARTIFACT --cache CACHE --out initial-temporal-replay.json
Get-FileHash -Algorithm SHA256 initial-temporal.json,initial-temporal-replay.json
```
