# Physical angular Fourier tail of the initialized annular velocity

**CONDITIONAL, source-bound.** Under the original stage-zero smoothness, native-field, domain, and fixed-cover join assumptions, the actual localized initialized-stage Cartesian velocity has the circle-by-circle Fourier tail below. This carries the existing source proof's hypotheses; it does not independently discharge those hypotheses. The input `initialized-annular-localized-force.json` is pinned by SHA-256 and supplies the actual original source-based six Cartesian gradient majorants used here. It already includes the three original outer cutoffs, including their physical derivative terms.

For a complete physical circle at fixed admitted `r>0`, `z`, and `tau`, define

    u_hat[n] = (1/(2*pi)) integral_0^(2*pi) u(theta) exp(-i*n*theta) dtheta.

The physical derivative is `d_theta u_i = -y*d_x u_i + x*d_y u_i`. By Cauchy–Schwarz and Parseval, for every integer `N >= 0`,

    sum_(|n|>N) sum_i |u_hat[i,n]|^2
      <= (1/(N+1)^2) * (1/(2*pi)) integral |d_theta u|^2 dtheta
      <= E / (48*(N+1)^2),

where `E` is the directed upper bound of the six squared localized Cartesian gradient bounds: `sum_i (G[i,x]^2+G[i,y]^2)`. The existing source geometry gives `r^2<1/48` on `Xa<=X<=Xb`; the constants are uniform over the initialized annular chart `|eta|<=3/4`, `qBig/64<=q<qBig/16`. All comparisons concern real physical angular circles, not the auxiliary Haar phase. At the axis, the annular chart does not apply. This is a velocity tail bound only. The output records `E` as a finite exact exponential endpoint tree; it is intentionally very conservative. The rational multiplier for `N=0,1,3,7` is respectively `1, 1/4, 1/16, 1/64` relative to the `N=0` bound. These are algebraic upper-bound ratios, not observed numerical errors or convergence measurements. Given any positive target `delta`, an integer satisfying `(N+1)^2 >= E/(48*delta)` is sufficient for the squared tail; the present endpoint may make that cutoff impractically large.

**Frame and aliasing.** The proof expands the *Cartesian physical components*. A rotating cylindrical basis shifts integer Fourier modes by one. Add contributions with equal physical winding before squaring; the prior first-wave source identity `n=m*omega` does not by itself give a uniform explicit maximum over the initial chart. We make no finite winding maximum claim and do not identify Haar cutoff modes with physical theta modes.

**Independent checks.** `independent_controls.py` proves the finite coefficient inequality exactly for rational samples, checks equality at a single cutoff-adjacent mode, and gives counterexamples for failure to combine equal modes, treating a rotating Cartesian frame as fixed, and trying to infer a force tail from a force supremum alone. These are synthetic controls, not a new evaluation of the original field. `evaluate.mjs` evaluates the six actual gradient inputs using the original pinned directed exponential runtime and writes the exact endpoint; running it twice gives the same receipt bytes.

**Remaining.** The first-stage and subsequent corrections and the full final-field velocity, gradients and force are not covered. A force Fourier tail requires additional angular regularity: a magnitude bound alone cannot give decay. This one restricted Fourier-tail bound does not produce the original independent grid/Fourier/coefficient-order/precision comparison table, a final-field tail, or the last resolved physical time. N8-05 and N7-06 remain OPEN, final jets remain 0/67, RELEASE HOLD remains. No Lean compilation was attempted.

Portable replay from a combined checkpoint (paths can be absolute):

```powershell
$goal = '<checkpoint>/tools/mathscope-cd-axial-bridge-20261029/goal-next'
$runtime = '<checkpoint>/inputs/annular-numerical-runtime'
$out = "$goal/final67/initial-fourier"
node "$out/evaluate.mjs" $goal $runtime $out
& '<Python 3 executable>' -B "$out/independent_controls.py"
```
