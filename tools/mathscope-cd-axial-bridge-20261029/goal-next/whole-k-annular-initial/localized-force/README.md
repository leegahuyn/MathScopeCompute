# Initialized annular localized velocity and force

**Scope.** This replay transfers the 67 numerical enclosures for the original initialized stage-zero annular field to 16 symmetric absolute enclosures: three localized velocity components, nine spatial velocity derivatives, one localized pressure, and three components of the defined Navier–Stokes force. It uses the original physical-time sign and all terms of the original 67+13 stencil, including the pressure/cutoff and nonlinear terms. The enclosures are extremely conservative exact nested exponential endpoint trees, not decimal estimates. They inherit every premise of the pinned stage-zero source and numerical input receipts.

**Domain.** The source chart is `Xa <= X <= Xb`, `|eta| <= 3/4`, and `qBig/64 <= q < qBig/16`; this is the initialized field, before any later correction. The original radial cutoff is flat throughout this chart: `r^2=2qX <= 2q Xb < qBig Rstar^2/32 < 1/48`, so its primitive argument `2r^2<1/24<1/2`. The three source inequalities are pinned in `whole-k-exterior-cell.json`. We still retain the original axial and time cutoff and all needed derivatives. Beyond the nonzero time support, the original flat extension has zero cutoff jets. No numerical active later correction or final field is inferred.

**Cutoff.** The pinned original cutoff certificate gives absolute bounds `|C|<=1`, `|C_tau|<=5/tau0`, `|C_z|<=20/z0`, `|C_zz|<=692/z0^2`, `|C_zzz|<=69472/z0^3`, `|C_z,tau|<=100/(z0*tau0)`; all seven requested radial derivatives vanish. For a deliberately conservative common scalar, let `T=exp(ellMinimum+15)`. Since `tau0=2^(-(ellMinimum+15))`, `1/tau0<=T`; since `z0=tau0^(1/2-h)`, `0<tau0<1` and `0<1/2-h<1`, `1/z0<=T`. We also use `|x|,|y|<=1`, a valid consequence of the annular radial bound. All signed source inputs are bounded symmetrically and every polynomial coefficient is replaced by its absolute value before summation: there is no assumed sign cancellation.

**Source and checks.** `export_stencil.py` reconstructs the original exact operator independently with sparse rational polynomials, then compares all 16 polynomials term by term against the pinned captured `ACTUAL_ENERGY_OPERATOR_BINDING.json`. It also compares velocity, gradient, pressure and force against the original rational 67+13 backend for two distinct nontrivial rational assignments. The cutoff-pressure and nonlinear omission controls are rejected. The exported polynomial has 540 exact terms. `evaluate.mjs` pins the complete actual stage-zero input, original geometric plateau certificate, cutoff bounds, fixed-scale input, arithmetic implementation and exported exact polynomials. It uses the source's directed exponential arithmetic with outward dyadic rounding; each reported upper endpoint represents its corresponding symmetric closed interval. The output can be replayed byte-for-byte. Negative-control polynomial checks establish operator binding, not independent proof of the source-field regularity assumptions.

**Remaining.** The result is a localized initialized field enclosure, not a numerical bound for the complete corrected field, an energy integral, an N7-06/N8-05 refinement, or a new Lean theorem. Active Forced and later corrections, all final-field jets and global energy/convergence remain OPEN. M3 62/64, final jets 0/67 and RELEASE HOLD remain unchanged.

For a portable replay, combine the original source files listed in `SOURCE_INPUTS.md` beneath one directory, such as `inputs/localization-source`. Place the original source numerical arithmetic runtime under another root. The three Node arguments are the extracted checkpoint `goal-next` directory, numerical-runtime root, and output directory. All paths below may be absolute.

```powershell
$python = '<Python 3 executable>'
$goal = '<checkpoint>/tools/mathscope-cd-axial-bridge-20261029/goal-next'
$source = '<checkpoint>/inputs/localization-source'
$runtime = '<checkpoint>/inputs/original-runtime'
$local = "$goal/whole-k-annular-initial/localized-force"
& $python -B "$local/export_stencil.py" $source
node "$local/evaluate.mjs" $goal $runtime $local
```

The code and receipt require no branch, operating page, or deployed site changes. Note that reproducing the source inputs themselves needs the previous source and numerical evidence packages named in the checkpoint replay instructions.
