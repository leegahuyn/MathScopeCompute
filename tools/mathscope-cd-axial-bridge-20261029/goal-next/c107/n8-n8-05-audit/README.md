# N8-05 original annular sampling geometry

**VERIFIED** — The fixed-copy physical pullback of the original two palette signs has the same six derivative identities in each sign. The check differentiates the source graph and proves zero rational numerators. It also verifies the Gram matrix of the projected basis in exact `Q(sqrt(2))`. Changing the sign of the time derivative fails in both proofs.

Write `Lambda_torus=4-sqrt(2)`, `Tg=4+sqrt(2)` and `r0=2^-34` in the original palette. At fixed label `i`, the radial and temporal basis vectors are orthogonal with squared length `4-2sqrt(2)>0`. For the palette’s transverse coordinate `xi` and normalized pulse coordinate `w=v/Ls`, the exact physical derivatives are

| Coordinate | `∂r` | `∂z` | `∂τ` |
|---|---|---|---|
| `xi` | `dr Lambda_torus^i r^(dr-1)` | `0` | `0` |
| `w` | `0` | `0` | `-Tg^i/(2 r0)` |

Each of the two original longitudinal switch collars has width `1/20` in `w`, so its physical width is `r0/(10 Tg^i)`. The transverse switch has width `r0/2` in `xi`. At fixed label and copy, `∂T v=-1/epsilon`. This derivative enters `∂T[p theta+pz Z/epsilon+x0 R-v H]=H/epsilon-v H_T`.

**CONDITIONAL** — The directional pitch bounds apply on admitted original label/copy segments and use the previously proved finite harmonic envelope and operator bounds on their stated domains. Use `tau0=qBig/32`, `z0=tau0^(1/2-h)` and `L=ellMinimum+15`. On the declared slab, `q/tau0∈[1/2,2)`. The figure’s core scale `Lambda_core=4/Xa` differs from the palette’s `Lambda_torus`, and the outer spatial localization uses radial scale `1`. Pass to normalized coordinates `rbar=r/sqrt(tau0)`, `zeta=z/z0`, `rho=tau/tau0`. Implicit differentiation of `Qstar-zeta^2 Qstar^(2h)=rho` uses denominator `1-2h eta^2≥7/8`. The source core is `Y=Lambda_core rbar^2/(2 Qstar)≤4`. Thus the `zeta,rho` core slopes are bounded by `40,12` and the radial slope by `4 Lambda_core sqrt(Xa)`. When the original stage switch is in transition, `d(2aq-1)/d(log q)` is at most `2`; on either flat piece the clipped switch argument has zero derivative. The slow partition uses `ell^6`, the chart scale is at most `2` in each normalized direction, and the bump has factor `2` in its clipped argument. These give the `4 Smax^3` entries.

The original palette floor gives `1/(Tg S)<ci≤1/S` and `Ls=2r0/ci`. With `rho_g=ln(Lambda_torus)/ln(Tg)`, the original exponent satisfies `0<dr<3` and `Lambda_torus^i Q_ell^(dr/2)=ci^rho_g epsilon^(-1/100000)`. The annulus bounds `sqrt(Xa)≤R≤2 sqrt(Xb)` give the radial pulse cap in the receipt. The same floor gives the temporal cap. The phase part uses the original bound `|n|≤Bnorm^8(1+Ls)`, the original carrier caps, and `|H|,|H_T|≤2 Bnorm^6`. This includes the fixed-copy derivative of `v`. The admitted harmonic support bounds the number of carrier factors by `32` for force, with `32W+2` including angular tensor rotation. The receipt lists the maximum per-axis changes of these arguments when one pitch is halved. A segment must be split at changes of the original labels or lattice copy. No global convexity is assumed.

The time pitch calculation gives a lower bound for a specific uniform policy. On the central source label `ell=L`, requiring change at most `1/16` in the affine longitudinal argument `20w-4` per full uniform step over `rho∈[1/2,1]` forces `n≥80 ci/(r0 epsilon)>80 exp(H)/(6r0 L²)`, where `H=h L ln 2`. The pinned original first-scale lower bounds give `(L-5) ln 2>2048 h^-2` and `(L-5) ln 2>Bnorm^512/2`. Consequently `H>32 sqrt(L)` and `L>2^65535`, so `H-2 ln(L)>1024 ln 2`. This gives the reported `n>2^1024` for the affine policy. It supplies no lower bound on adaptive sampling and records no actual runtime budget failure.

**OPEN** — N8-05 requires a grid comparison, independent Fourier cutoff, coefficient order and arithmetic precision comparisons, certified separate tails, and an observed last resolved positive time for the same full final field. This replay checks geometry. It does not evaluate the full field or assign any certified jet. Existing M3 acceptance remains 62/64 and release remains HOLD.

## Replay

Run Node.js on `replay_sampling_geometry.mjs` with the cached original M2 `navier` directory and a new output JSON path. Run Python on `check_sampling_geometry.py` with that output, the original `ORIGINAL_M3_M4_CRITERIA.json`, the saved `whole-k-chart.json`, the evidence checkout’s `goal-next`, the saved original M3 `navier` directory and a new output JSON path. From the workspace containing `work`, the PowerShell commands are

```powershell
$source = 'work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier'
$base = 'work/MathScopeCompute-Continuation22'
$goal = "$base/tools/mathscope-cd-axial-bridge-20261029/goal-next"
$localization = 'work/goal-next/final67/source/research-ide/mathscope-m3/navier'
$audit = 'work/goal-next/continuation107/n8-n8-05-audit/final'
node "$audit/replay_sampling_geometry.mjs" $source 'operands-replay.json'
python -B "$audit/check_sampling_geometry.py" --operands 'operands-replay.json' `
  --criterion "$base/research-ide/mathscope-m3/ORIGINAL_M3_M4_CRITERIA.json" `
  --chart 'work/goal-20261111/m3/whole-k-chart.json' --goal $goal `
  --localization $localization --out 'sampling-geometry-replay.json'
```
