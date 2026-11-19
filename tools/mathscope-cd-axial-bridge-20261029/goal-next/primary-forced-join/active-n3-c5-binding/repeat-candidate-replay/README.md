# Replaying the original repeated Forced graph

Two archived original N1 runs can be joined exactly. Run 43010593847 supplies
`corrected-first-cycle-graph`. Run 43015175416 supplies
`post-five-repeat-forced-graph`, including the latter directory's
`post-five-repeat-forced-candidate.json`. Their commits, manifests, original
uncompressed streams and extended registries are pinned by the checker.

Create an empty scratch directory and run

```text
python replay_archived_repeat.py BEFORE AFTER SCRATCH archived-repeat-append-readback.json
```

The checker compares all 4,456,994 earlier node records byte for byte and
checks the existing ordered definitions in each of the five registry groups.
It saves 225,012 appended node records and the full current registry in
`SCRATCH/append-packet`. It reconstructs the full stream by writing the updated
count header, the earlier records and the suffix. The independent source
reader checks the recovered stream against the full archive's SHA-256,
byte count, node count and operation counts. The independent typed verifier
rechecks the 40 returned candidates and 240 shared mapped-potential
applications. Its proof file matches the archived proof byte for byte.

The pair establishes lossless replay and returned-gauge bindings for this
archived input. The active N3 run, the full guarded support equality and the
whole second-correction force bound each have their own evidence obligations.

- [Original first-correction run](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43010593847)
- [Original repeated Forced run](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43015175416)
