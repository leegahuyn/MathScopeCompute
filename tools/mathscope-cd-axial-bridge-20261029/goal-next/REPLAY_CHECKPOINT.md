# Replay the November 12 checkpoint

Extract Continuation17, the cumulative Continuation20 delta, Continuation21,
Continuation22, and Continuation23 to the same directory in that order. The latest
checkpoint lists the parent checksums and the replaced files.

## Continuation23

Extract Continuation23 after Continuation22. Replay the initialized annular
bounds and source argument checks from the shared extraction directory.

```sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
m2=inputs/original-core-runtime/research-ide/mathscope-m2/navier
m3=inputs/original-core-runtime/research-ide/mathscope-m3/navier
graph=inputs/corrected-first-cycle/corrected-first-cycle-graph
functionals=inputs/final-functionals/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json
node "$p/whole-k-primary-potential-c3/replay_primary_potential_c3.mjs" \
  "$p" "$graph" "$functionals" /tmp/initial-potential-c3.json
node "$p/whole-k-primary-potential-c3/check_primary_potential_c3.mjs" \
  "$p" "$graph" "$functionals" /tmp/initial-potential-c3.json /tmp/initial-potential-readback.json
node "$p/whole-k-initialized-gauge/replay_initialized_gauge.mjs" \
  "$p" /tmp/initial-all67.json
node "$p/whole-k-initialized-gauge/check_initialized_gauge.mjs" \
  "$p" /tmp/initial-all67.json /tmp/initial-all67-readback.json
python "$p/whole-k-initialized-gauge/check_stage_zero_source.py" \
  "$p" "$graph" /tmp/stage-zero-source-inventory.json
forced=inputs/corrected-first-forced/corrected-first-forced-graph
python "$p/first-forced-mode-two-c1/check_original_prefix.py" \
  "$forced" "$graph" /tmp/mode-two-original-prefix.json
node --max-old-space-size=2048 "$p/first-forced-mode-two-c1/replay_mode_two.mjs" \
  "$p" "$forced" "$graph" /tmp/mode-two-weighted-c1.json
node "$p/first-forced-mode-two-c1/check_mode_two.mjs" \
  "$p" "$p/first-force-repair/independent-repaired-first-force.json" \
  "$p/final67/first-forced-gauge.json" /tmp/mode-two-weighted-c1.json \
  /tmp/mode-two-output-readback.json
for check in weighted-mode-one weighted-stage-zero-valuation; do
  node "$p/primary-forced-weights/$check.mjs" "$p" "$m3" > "/tmp/$check.json"
done
for n in 2 3 4; do
  if [ "$n" = 2 ]; then
    input=inputs/original-axial-n2
    raw="$input/original-n2-current-pressure-graph"
  else
    input="inputs/original-whole-k-n$n-diagonal"
    raw="$input/original-whole-k-current-pressure-graph"
  fi
  radial="/tmp/picard-radial-invariance-n$n.json"
  python "$p/y-dynamic-n2/check_picard_radial_invariance.py" \
    "$raw" "$m2/actual-continuation-exact-functions.mjs" "$radial" --prefix "$n"
  python "$p/y-dynamic-n2/check_picard_call_ingress.py" \
    "$input/y-reached.json" "$raw/original-source-functions.json" "$radial" \
    "$m2/source-profile-data.mjs" "/tmp/picard-call-ingress-n$n.json" --prefix "$n"
done
python "$p/y-dynamic-n2/check_picard_call_ingress.py" \
  "$input/y-reached.json" "$raw/original-source-functions.json" "$radial" \
  "$m2/source-profile-data.mjs" /tmp/picard-call-ingress-no-bracket.json \
  --prefix 4 --without-reference-bracket
```

Lean was run in [GitHub Actions 43239867740](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43239867740). The compiled source hash and theorem axioms are in [the CI artifact](ci-43239867740/). The earlier live C3 run reached authenticated pressure before the Temporal allocator stopped. Its [failure receipt](primary-forced-join/hosted-43232163618/native-receipt.json) and the retry [resource overlay control](primary-forced-join/hosted-43242610982/local-pin-and-reversal-control.json) are archived.

From the extraction directory, set the evidence path in a POSIX shell.

```sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
for folder in inputs/original-whole-k-n{2,3}-primary-potential-C3 inputs/original-whole-k-n2-primary-C3; do
  python "$p/whole-k-atlas/verify_primary_c3.py" "$folder"
done
python "$p/y-higher-flow/check_reference_roots.py" --inputs inputs --out /tmp/mathscope-reference-roots.json
python "$p/y-n2-flow/verify_receipts.py"
python "$p/y-higher-flow/verify_receipts.py"
```

For an independent replay of the call checks, run the six positive and negative-control variants for N3 and N4 from their pinned raw-base exports, and the three variants for N2.

```sh
profile=inputs/original-core-runtime/research-ide/mathscope-m2/navier/source-profile-data.mjs
n2=inputs/original-axial-n2
for n in 2 3 4; do
  if [ "$n" = 2 ]; then
    dir="$n2"
    graph=original-n2-current-pressure-graph
    script="$p/y-n2-flow/range_flow_n2.py"
  else
    dir="inputs/original-whole-k-n$n-diagonal"
    graph=original-whole-k-current-pressure-graph
    script="$p/y-higher-flow/range_flow_n$n.py"
  fi
  registry="$dir/$graph/original-source-functions.json"
  python "$script" "$dir/y-reached.json" "$registry" "$profile" "/tmp/mathscope-y-n$n.json" --transport --allow-defined-root2
  python "$script" "$dir/y-reached.json" "$registry" "$profile" "/tmp/mathscope-y-n$n-no-bracket.json" --transport
  python "$script" "$dir/y-reached.json" "$registry" "$profile" "/tmp/mathscope-y-n$n-no-loop.json" --transport --allow-defined-root2 --drop-loop-sign
done
```

```sh
python "$p/whole-k-exterior/check_exterior_energy_refinement.py" --localization-source inputs/localization-source --out /tmp/mathscope-exterior-energy.json
```

The [fourth-scale certificate](whole-k-selector-scales/fourth/README.md) gives the commands for the N4 source binding and exact scale comparison. The two new Lean proofs are recorded in the GitHub artifacts [ci-43219998006](ci-43219998006/) and [ci-43224231941](ci-43224231941/). The exterior integral details are in [the heat-exterior certificate](whole-k-exterior/EXTERIOR_ENERGY_REFINEMENT.md). Final-field acceptance remains recorded in [STATUS.json](STATUS.json).

## Continuation21

```sh
graph=inputs/corrected-first-cycle/corrected-first-cycle-graph
chart="${p%/goal-next}/goal-20261111/m3/whole-k-chart.json"
python "$p/whole-k-atlas/check_n3_n4_live_band.py" \
  --n3 inputs/original-whole-k-n3-diagonal --n4 inputs/original-whole-k-n4-diagonal \
  --fourth "$p/whole-k-selector-scales/fourth/fourth-selector-maxima.json" \
  --out /tmp/n3-n4-live-band.json
node --max-old-space-size=3072 "$p/whole-k-annular-pressure-lower/propagate_lower_covariance.mjs" \
  "$p" "$graph" "$chart" /tmp/lower-covariance-pressure.json
node "$p/whole-k-annular-pressure-lower/check_lower_covariance.mjs" \
  "$p" "$graph" /tmp/lower-covariance-pressure.json /tmp/lower-pressure-readback.json
node "$p/whole-k-angular-pressure/replay_angular_pressure.mjs" \
  "$p" "$graph" /tmp/initialized-angular-pressure.json
node "$p/whole-k-angular-pressure/check_angular_pressure.mjs" \
  "$p" "$graph" /tmp/initialized-angular-pressure.json /tmp/initialized-angular-pressure-readback.json
node --max-old-space-size=3072 "$p/whole-k-annular-pressure-lower/propagate_lower_covariance.mjs" \
  "$p" "$graph" "$chart" /tmp/mean-transverse-c2.json --mean-spatial-c2
node "$p/whole-k-annular-pressure-lower/check-mean-transverse-c2.mjs" \
  "$p" "$graph" /tmp/mean-transverse-c2.json /tmp/mean-transverse-c2-readback.json
node "$p/whole-k-angular/n1-fourier-tail.mjs"
dir="$p/primary-forced-join/hosted-43219432398"
python "$p/primary-forced-join/verify_join_receipt.py" \
  "$dir/native-receipt.json" "$dir/source-pins.json" /tmp/forced-readback.json
```

The [closed-boundary proof](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43229357946)
was compiled on GitHub. Its source checksum and assumptions are in
[the GitHub evidence](ci-43229357946/). The [original N2 finite Picard binder](y-dynamic-n2/README.md)
has a separate replay command.

## Continuation22

```sh
g4=inputs/original-whole-k-n4-primary-potential-C3
python "$p/whole-k-atlas/verify_primary_c3.py" "$g4"
python "$p/whole-k-atlas/check_primary_cover.py" \
  --diagonal3 inputs/original-whole-k-n3-diagonal \
  --diagonal4 inputs/original-whole-k-n4-diagonal \
  --primary3 inputs/original-whole-k-n3-primary-potential-C3 --primary4 "$g4" \
  --fourth "$p/whole-k-selector-scales/fourth/fourth-selector-maxima.json" \
  --out /tmp/primary-reference-cover.json
python "$p/g0-supported/verify_mean_hw.py" \
  inputs/corrected-first-forced/corrected-first-forced-graph \
  "$p/first-force-repair/independent-repaired-first-force.json" \
  "$p/g0-supported/actual-g0-order.json" /tmp/mean-hw-binding.json
node --max-old-space-size=3072 "$p/whole-k-annular-pressure-lower/propagate_lower_covariance.mjs" \
  "$p" "$graph" "$chart" /tmp/mean-path-longitudinal.json --mean-path-longitudinal
node "$p/whole-k-annular-pressure-lower/check-mean-path-longitudinal.mjs" \
  "$p" "$graph" /tmp/mean-path-longitudinal.json /tmp/mean-path-longitudinal-readback.json
node --max-old-space-size=3072 "$p/whole-k-annular-pressure-lower/propagate_lower_covariance.mjs" \
  "$p" "$graph" "$chart" /tmp/stage-zero-b-jets.json --stage-zero-b
node "$p/whole-k-annular-pressure-lower/check-stage-zero-b-jets.mjs" \
  "$p" "$graph" /tmp/stage-zero-b-jets.json /tmp/stage-zero-b-jets-readback.json
node "$p/whole-k-angular-pressure-c2/replay_angular_pressure_c2.mjs" \
  "$p" "$graph" /tmp/initialized-angular-pressure-c2.json
node "$p/whole-k-angular-pressure-c2/check_angular_pressure_c2.mjs" \
  "$p" "$graph" /tmp/initialized-angular-pressure-c2.json /tmp/initialized-angular-pressure-c2-readback.json
```

The [N2 five-moment range replay](y-dynamic-n2/README.md) executes the exact
finite source Picard partial sum and checks all 291 generated literal
natural arguments in its five local moment integrals. Its mathematical
range and normalization lemmas passed on [GitHub](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43235628663).
