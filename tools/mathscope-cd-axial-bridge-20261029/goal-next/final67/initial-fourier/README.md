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

**Original initialized angular split.** The separate
`check_initialized_angular_split.py` replay authenticates the 4,456,994-node
saved graph and the original native registry. It checks 648 signed index
rows across three initial cylindrical velocity fields and pressure, the
eight local bodies, both original rounded nonzero integer windings and
the four full-field joins. The exact native scope traversal checks 133,635
nodes. The wave consists of sine and cosine terms with a nonzero integer
frequency and angle-independent amplitudes, guards and slow arguments.
The other summand of each full field is angle independent. The mean and
wave kinetic and dissipation cross terms vanish on full physical circles
under the original smooth chart and flat-join contracts. This split includes
the cylindrical connection in the angular part of the gradient.
Angle-independent scalar multiplication preserves the split. Localization
by a curl of the cutoff times the wave potential still needs a separate
bound for the wave cutoff contribution. Run with the corrected source graph
directory from job 43010593847 and a fresh output path.

```text
python -B check_initialized_angular_split.py ORIGINAL_GRAPH_DIRECTORY NEW_JSON
```

`evaluate_initialized_winding.mjs` replays 28 original arithmetic records
and six original inputs for the uniform winding upper endpoint `W`. It
uses the previously proved signed carrier and admitted dyadic band
envelopes. The squared omitted tail is exactly zero for pressure cutoffs
at least `ceil(W)`, Cartesian velocity cutoffs at least `ceil(W)+1`, and
Cartesian velocity-gradient cutoffs at least `ceil(W)+2`. The additions
come from the polar basis and the transverse Cartesian derivative. The
endpoint is a directed exponential expression and the integer cutoff is
kept symbolic. The current endpoint does not resolve a small-cutoff
convergence comparison.

```text
node evaluate_initialized_winding.mjs GOAL_NEXT ORIGINAL_RUNTIME NEW_JSON
```

**Remaining.** The original field's nonzero frequencies must be grouped
when contributions share a physical winding. The final velocity, gradients
and force need the later corrections. A force Fourier tail requires angular
regularity. N8-05 still needs the full-field refinement table, a final-field
tail and the last resolved physical time. N7-06 remains OPEN, final jets
remain 0/67 and RELEASE HOLD remains.

Portable replay from a combined checkpoint (paths can be absolute):

```powershell
$goal = '<checkpoint>/tools/mathscope-cd-axial-bridge-20261029/goal-next'
$runtime = '<checkpoint>/inputs/annular-numerical-runtime'
$out = "$goal/final67/initial-fourier"
node "$out/evaluate.mjs" $goal $runtime $out
& '<Python 3 executable>' -B "$out/independent_controls.py"
```
