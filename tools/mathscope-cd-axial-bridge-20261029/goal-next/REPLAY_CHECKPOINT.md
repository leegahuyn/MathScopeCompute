# Replay the November 13 checkpoint

Extract Continuation17, the cumulative Continuation20 delta, Continuation21,
Continuation22, Continuation23, Continuation24, Continuation25 and Continuation26 to the same directory in that order. The latest
checkpoint lists the parent checksums and the replaced files.

## Continuation31

- [Active native N3 Primary C5 receipt and terminal execution](primary-forced-weights/live-c5/hosted-43285995098-n3/primary-c5-native.json)
- [Active native N4 Primary C5 receipt and terminal execution](primary-forced-weights/live-c5/hosted-43290112348-n4/primary-c5-native.json)
- [Active N3 mode-two arithmetic and live attachment](primary-forced-join/active-n3-c5-binding/README.md)
- [Active N3 stable inverse and cutoff pressure arithmetic](primary-forced-join/active-n3-c5-binding/active-inverse/README.md)
- [Independent N1/C2 pressure storage comparison](primary-forced-join/active-c5/pressure-parity/README.md)
- [Original initialized and Forced branch observer](primary-forced-join/active-mode-two-witness/README.md)
- [Original N1–5 Picard even-axis parity, matrix derivatives and seam](y-higher-flow/picard-even-axis/README.md)
- [Active N4 source node budget and exact storage replay](primary-forced-weights/live-c5/large-pack/README.md)

## Continuation29–30

- [Original C8 bounded replay and differential checks](primary-forced-weights/live-c5/large-pack/README.md)
- [Archived original wave C4, mean–wave C2 and supported mode-one C2](primary-forced-weights/mixed-wave/README.md)
- [Archived original radial background C3](primary-forced-weights/radial-background/README.md)
- [Archived original mode-two input, inverse and mapped output C3](primary-forced-weights/archived-mode-two/README.md)
- [Original active N3 cell, typed wave roots and local mode-two replay](primary-forced-weights/active-mode-two/README.md)
- [Actual N4 Picard caller and binder checks](y-higher-flow/y-picard-callers/README.md)
- [Actual fixed-order Picard tail constants and first radial derivative](y-higher-flow/fixed-n-radial-tail/README.md)
- [Actual N2 original finite Picard witness and fixed-n analytic reduction](y-higher-flow/fixed-n-limit/README.md)

## Continuation26

Run from the combined package root.

```sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
chart=tools/mathscope-cd-axial-bridge-20261029/goal-20261111/m3/whole-k-chart.json
rt=inputs/annular-numerical-runtime
hist=inputs/original-selector-scales/historical-scale-arithmetic-input.json
loc=inputs/localization-source/research-ide/mathscope-m3/recovery-20261019
o=/tmp/mathscope-26
mkdir -p "$o"

energy="$p/whole-k-annular-initial/energy"
python -B "$energy/check_annular_measure.py" "$chart" "$p/whole-k-exterior/whole-k-exterior-cell.json" "$o/annular-measure.json"
node "$energy/evaluate_initial_integrals.mjs" "$p" "$rt" "$hist" "$o/annular-measure.json" "$o/initial-annular-integrals.json"
cmp "$o/initial-annular-integrals.json" "$energy/initial-annular-integrals.json"

fourier="$p/final67/initial-fourier"
node "$fourier/evaluate.mjs" "$p" "$rt" "$o"
cmp "$o/initial-angular-tail.json" "$fourier/initial-angular-tail.json"
python -B "$fourier/independent_controls.py"

support="$p/final67/active-support"
python -B "$support/check_active_support.py" \
  --family inputs/final-functionals/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json \
  --chart "$chart" --cutoff "$p/final67/first-scale-selector.json" \
  --tail "$p/final67/cut-correction-tail.json" --outer "$loc/outer_cutoff.py" --out "$o/active-support.json"
cmp "$o/active-support.json" "$support/active-support.json"

mode="$p/primary-forced-weights/higher-mode-one"
node "$mode/replay_mode_one_valuation.mjs" "$p" inputs/mode-one-source "$o/mode-one-valuation.json"
node "$mode/bind_cross_c1.mjs" "$p" "$o/mode-one-valuation.json" "$o/mean-wave-c1-roots.json"
cmp "$o/mean-wave-c1-roots.json" "$mode/mean-wave-c1-roots.json"
```

The four geometry layouts are exact additive partitions. An independent
final-field refinement still needs a separately enclosed final integrand in
each cell. The physical angular tail is for initialized velocity. The
archived Forced algebra does not certify numerical same-family C3 norms.

## Continuation25

Run the original-runtime check before loading the source majorants. The
background arithmetic replay can take several minutes. The archive keeps the
exact source traces and all resulting endpoints for readback.

```sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
rt=inputs/annular-numerical-runtime
m2="$rt/research-ide/mathscope-m2/navier"
hist=inputs/original-selector-scales/historical-scale-arithmetic-input.json
threshold="$p/whole-k-selector-scales/historical-scale-arithmetic-result.json"
norm="$p/whole-k-annular-wrz-norm"
bg="$norm/numerical"
target="$norm/target-numerical"
init="$p/whole-k-annular-initial/numerical"
fixed="$init/stage-zero-fixed-numerical.json"
slow96="$p/whole-k-annular-slow/annular-slow-numerical-intervals.json"
o=/tmp/mathscope-25
mkdir -p "$o"

node "$bg/check_original_runtime.mjs" "$rt" "$rt/GIT-SOURCE-SHA256.json" "$o/original-runtime-readback.json"
python "$bg/check_background_ftc_trace.py" "$norm/background-c8.json" "$norm/background-c8-graph.jsonl.gz" "$o/background-ftc-transport.json"
node --stack-size=4096 --max-old-space-size=4096 "$bg/produce_background_majorants.mjs" "$rt" "$norm/background-c8.json" "$o/background-majorants.json"
node "$bg/evaluate_background_majorants.mjs" "$rt" "$o/background-majorants.json" "$o/background-ftc-transport.json" "$hist" "$threshold" "$o/background-numerical.json"
node --stack-size=4096 "$bg/produce_leading_active.mjs" "$rt" "$o/leading-active-c10-trace.json"
node "$bg/leading-outer-c10/replay_leading_outer_c10.mjs" "$rt" "$o/leading-outer-c10.json"
node "$bg/leading-outer-c10/check_outer_receipt.mjs" "$rt" "$o/leading-outer-c10.json"
node "$bg/complete_background_numerical.mjs" "$rt" "$o/background-numerical.json" "$o/background-ftc-transport.json" "$o/leading-active-c10-trace.json" "$o/leading-outer-c10.json" "$fixed" "$hist" "$threshold" "$o/background-c8-complete.json"

node "$target/target-middle-reduction.mjs" "$norm/target-c7.json" "$norm/target-c7-graph.jsonl.gz" "$norm/replay_target_c7.mjs" "$m2/actual-background-physical-seminorms.mjs" > "$o/target-middle-reduction.lf.json"
node "$target/outer-kernel-bounds.mjs" "$norm/target-c7.json" "$norm/target-c7-graph.jsonl.gz" "$m2/source-profile-data.mjs" "$m2/actual-stress-direction-program.mjs" > "$o/outer-kernel-bounds.lf.json"
# Preserve the byte format of the two archived Windows receipts.
for stem in target-middle-reduction outer-kernel-bounds; do
  python -c 'from pathlib import Path; import sys; Path(sys.argv[2]).write_bytes(Path(sys.argv[1]).read_text().replace("\n","\r\n").encode())' \
    "$o/$stem.lf.json" "$o/$stem.json"
done
node "$target/check_terminal_amplitude_bound.mjs" "$rt" "$norm/target-c7.json" "$norm/target-c7-graph.jsonl.gz" "$o/leading-outer-c10.json" "$o/terminal-amplitude-link.json"
python "$target/check_target_ftc_trace.py" "$norm/target-c7.json" "$norm/target-c7-graph.jsonl.gz" "$o/target-middle-reduction.json" "$o/target-ftc-transport.json"
node "$target/evaluate_target_inner.mjs" "$rt" "$norm/target-c7.json" "$fixed" "$hist" "$threshold" "$o/target-inner-numerical.json"
node "$target/evaluate_target_middle.mjs" "$rt" "$o/background-c8-complete.json" "$o/target-middle-reduction.json" "$hist" "$threshold" "$o/target-middle-numerical.json"
node "$target/evaluate_target_outer.mjs" "$rt" "$norm/target-c7.json" "$o/outer-kernel-bounds.json" "$o/terminal-amplitude-link.json" "$o/background-c8-complete.json" "$fixed" "$threshold" "$o/target-outer-numerical.json"
node "$target/complete_target_numerical.mjs" "$rt" "$o/target-ftc-transport.json" "$o/target-inner-numerical.json" "$o/target-middle-numerical.json" "$o/target-outer-numerical.json" "$hist" "$threshold" "$o/target-c7-complete.json"
cmp "$o/target-c7-complete.json" "$target/target-c7-complete.json"
node "$init/evaluate_stage_zero_all.mjs" "$p" "$rt" "$slow96" "$o/stage-zero-complete-numerical.json"
node "$init/check_stage_zero_numerical.mjs" "$p" "$rt" "$slow96" "$o/stage-zero-complete-numerical.json" "$o/stage-zero-complete-readback.json"

loc="$p/whole-k-annular-initial/localized-force"
cp "$loc/export_stencil.py" "$o/"
python -B "$o/export_stencil.py" inputs/localization-source
node "$loc/evaluate.mjs" "$p" "$rt" "$o"
cmp "$o/initialized-annular-localized-force.json" "$loc/initialized-annular-localized-force.json"
```

For the isolated browser check use the original candidate
`inputs/m4-r108-isolated-candidate/candidate.html`.
[Browser arguments and scope](m4/r108/isolated-file-reimport/README.md).

GitHub run [43242610982](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43242610982)
passed the original Temporal inverse and initialized mean. Its angular
constructor still requested 5,000,000 nodes. The source-verified resource
overlay now supplies the same ceiling to both constructors in run
[43256030290](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43256030290).

## Continuation24

Use the pinned original runtime for this replay. It has a separate path so
earlier checkpoint inputs preserve their exact bytes.

```sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
rt=inputs/annular-numerical-runtime
m2="$rt/research-ide/mathscope-m2/navier"
m3=inputs/original-core-runtime/research-ide/mathscope-m3/navier
graph=inputs/corrected-first-cycle/corrected-first-cycle-graph
forced=inputs/corrected-first-forced/corrected-first-forced-graph
hist=inputs/original-selector-scales/historical-scale-arithmetic-input.json
threshold="$p/whole-k-selector-scales/historical-scale-arithmetic-result.json"
slow="$p/whole-k-annular-slow"
fixed="$p/whole-k-annular-initial/numerical"
node --stack-size=4096 "$p/whole-k-core-jet-bounds/replay_core_high_norms.mjs" \
  "$rt" /tmp/core-high-norms.json /tmp/slow-jet-norm-trace.json
node "$slow/evaluate_annular_slow.mjs" "$rt" /tmp/slow-jet-norm-trace.json \
  "$hist" "$slow/annular-slow-jet-bounds.json" "$threshold" /tmp/annular-slow-256bit.json
node "$slow/evaluate_annular_slow.mjs" "$rt" /tmp/slow-jet-norm-trace.json \
  "$hist" "$slow/annular-slow-jet-bounds.json" "$threshold" /tmp/annular-slow-96bit.json coarse-upper
node "$slow/compare_directed_intervals.mjs" "$rt" "$threshold" \
  /tmp/annular-slow-256bit.json /tmp/annular-slow-96bit.json /tmp/slow-interval-comparison.json
python "$fixed/trace_stage_zero_leaves.py" "$p" "$graph/original-source-nodes.jsonl.gz" \
  /tmp/stage-zero-transitive-inputs.json
node "$fixed/evaluate_stage_zero_fixed.mjs" "$rt" /tmp/stage-zero-transitive-inputs.json \
  "$hist" "$threshold" /tmp/annular-slow-96bit.json /tmp/stage-zero-fixed-numerical.json
mass="$p/whole-k-annular-pressure-lower/numerical-mass"
node "$mass/actual-rho-mass.mjs" "$graph/original-source-nodes.jsonl.gz" \
  "$m3/source-global-current.mjs" "$m2/actual-pulse-meanpatch.mjs" > /tmp/actual-rho-mass.json
node "$mass/rho-mass-independent.mjs" /tmp/actual-rho-mass.json > /tmp/rho-mass-independent.json
mode="$p/first-forced-mode-two-jets"
node "$mode/replay_mode_two_jets.mjs" "$p" "$forced" "$m3/source-forced-pulse.mjs" /tmp/mode-two-selected-jets.json
node "$mode/check_mode_two_jets.mjs" "$p" "$forced" /tmp/mode-two-selected-jets.json /tmp/mode-two-selected-jets-readback.json
```

The local browser replay accepts `inputs/operational-m4/production-v137.html`,
the installed Playwright module path, the Chrome path and an output directory.
[Browser replay and scope](m4/r108/production-pointer-local/README.md).

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

## Continuation27

Merge the archives in the order in CHECKPOINT.json. Use the existing
corrected graph and chart from Continuation21. The new runtime manifests
pin the original code modules. The mean and radial numerical evaluators
also use the directed arithmetic runtime included with Continuation24.

~~~sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
f="$p/primary-forced-weights"
node "$f/full-slow-norms/replay_full_slow_norms.mjs" \
  "$p" "$arithmetic_runtime" /tmp/full-slow-norms.json
node "$f/live-c5/replay_primary_degree_five.mjs" \
  inputs/original-primary-degree-runtime /tmp/full-slow-norms.json /tmp/primary-degree-five.json
python "$f/live-c5/check_fixed_slab_coefficients.py" \
  --degrees /tmp/primary-degree-five.json \
  --slab "$f/c5-pulse-audit/slab-k.json" \
  --fixed "$p/whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json" \
  --scale-program "$p/whole-k-annular-pressure-lower/propagate_lower_covariance.mjs" \
  --out /tmp/fixed-slab-coefficients.json
~~~

[The mean and radial replays](primary-forced-weights/higher-mean/README.md)
use the corrected graph and original numerical operands. [The cutoff
and pulse checks](primary-forced-weights/c5-pulse-audit/README.md)
give the separate integer and source-pin controls. [The three GitHub C5
logs](primary-forced-weights/live-c5/README.md) record the original
computation limits. [The operating M4 rehearsal](m4/r108/operational-replay-audit/README.md)
reverses the exact public HTTP bytes locally.

## Continuation28

Use the [pointwise and covariance replay](primary-forced-weights/slow-nine/README.md)
to rebuild the two C9 background and two weighted C8 target endpoints,
the archived mean C3, and all 156 mean-side bindings for mean–wave C2.
The independent Python pass compares the exact shifted and unshifted
original records. [The compact graph controls](primary-forced-weights/live-c5/compact-lookup/README.md)
replay the C2 seal and the separate order-eight chart calculation.
