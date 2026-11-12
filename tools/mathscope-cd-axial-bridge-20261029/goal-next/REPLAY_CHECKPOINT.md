# Replay the November 12 checkpoint

Extract Continuation17 and then the cumulative Continuation20 delta to the same directory. The delta manifest lists the exact replacements. The original source exports and registries in the two archives are the inputs to the commands below.

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
