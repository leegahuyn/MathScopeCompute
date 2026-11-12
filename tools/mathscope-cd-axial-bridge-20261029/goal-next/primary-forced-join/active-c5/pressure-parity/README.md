# Native pressure overlay: portable old-helper replay

The saved `original.json` and `overlay.json` are identical receipts from two
independent genuine N1/C2 runs: current and all-label pressure were constructed
and authenticated in each process. Each produced 1,635,639 graph nodes. The
receipts contain the SHA-256 of the ordered raw node records, captured function
definitions, and complete pressure certificate; the native checks and seal
mutation controls also agreed. `node compare.mjs original.json overlay.json`
checks the saved receipts. Digest equality is computational evidence, not a
Lean proof or literal interprocess byte-by-byte comparison.

These runs use the older wrapped helper `old-helper.mjs`, SHA-256
`81bb2348dada517cc7cc76adc78b617703ba3f83f9a3f578e62c5394f8b49fc8`.
They do **not** by themselves verify the later cached helper used by the C8
workflow. The snapshot helper freezes source node records; direct in-place
mutations can therefore fail at a different point than in the unpatched run.
The completed checks include changed node and pressure record rejection and
acceptance of a canonically equal replacement node. No claim about every
possible mutation is made. Neither C5, Forced, nor numerical intervals are
proved here; RELEASE remains HOLD.

## Required source input

Supply a source runtime directory containing `research-ide/`. Its **151 file**
byte hashes are pinned in `input-manifest.json`, whose SHA-256 is
`cbc739f318a2f0e7e6ee621e9559472227b3b35456ee209146a168852743741c`.
`create_pair.mjs` checks the full inventory, including absence of extra files,
before making a new scratch copy. No source runtime or user PDF is included in
this directory. The recorded runtime is the earlier `forced-probe/runtime`,
derived from the `second-live/node-fixture` source with byte-reversible
read-only Forced diagnostics; the four probed files and their hashes are
documented in that earlier probe's `overlay.json` and `README.md`. The exact
runtime must be supplied from the existing reproduction workspace or package;
this directory does not claim it can reconstruct it from a different tree.

The pressure source input SHA-256 is
`fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d`.
`prepare_pressure.mjs` checks this pin, makes exactly five replacements, checks
exact byte reversal, and emits overlay SHA-256
`69c19b13899657fc04b6e05bcc6d8eb1a564b00d14567b91955044f7446f6bae`.
It writes only a new scratch file. `create_pair.mjs` then copies the validated
source runtime twice and installs the generated pressure overlay and included
old helper into the second copy. The prior instrumentation is identical in
both copies, and its callbacks are not used in this pressure test.

## Replay

Run from this directory with Node.js and replace the two arguments with the
paths to the exact source runtime and a **new**, disposable output directory.
The output directory must not already exist. Each original-source run can take
many minutes and several gigabytes of memory.

```text
node create_pair.mjs SOURCE_RUNTIME NEW_SCRATCH_DIRECTORY
node --max-old-space-size=8192 run.mjs NEW_SCRATCH_DIRECTORY/original NEW_SCRATCH_DIRECTORY/original.json
node --max-old-space-size=8192 run.mjs NEW_SCRATCH_DIRECTORY/overlay NEW_SCRATCH_DIRECTORY/overlay.json
node compare.mjs NEW_SCRATCH_DIRECTORY/original.json NEW_SCRATCH_DIRECTORY/overlay.json
```

The runner uses `flag:'wx'` for output receipts, so reruns need new output
filenames or a new scratch directory. `globalCurrentPressureCertificate` is
included in the comparison; it serializes the newly added pressure delta. If
that delta becomes too large in another run, its monolithic certificate path
may require separate, exact canonical streaming and digest/byte parity.

## Script pins

```text
create_pair.mjs       7bc61b393b67b94ed2122ae40c73174b96a0c80b859e7de68d84cc3b55f1c27a
inventory.mjs         1eef41eb35cf9aa716f1149cbd1393ff0f2593072f5d3f9b5a256f1ed81e868a
prepare_pressure.mjs  665dff6294fa7563027a3c1643504d2031d5ae5f43871a6c0962e1318639146d
run.mjs               e9f493e46dc395b5043b11260bc324c9ba660be1acf220739985ed6d6a8d29ac
compare.mjs           1e2f31f9452b4df56773896a491d45bf6e1d9cd979a93577d8c18988d3b9623b
original.json         88b09ac23e8702159d8c0ff7f9b0d63dd1657dcec50e144611c37a2063124fb7
overlay.json          88b09ac23e8702159d8c0ff7f9b0d63dd1657dcec50e144611c37a2063124fb7
```
