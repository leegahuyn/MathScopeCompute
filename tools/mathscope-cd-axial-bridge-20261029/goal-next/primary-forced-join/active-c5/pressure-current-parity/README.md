# Current workflow helper pressure replay

This supplements [the preceding replay](../pressure-parity/README.md). The genuine N1/C2
pressure overlay replay was repeated with `current-helper.mjs`, SHA-256
`94df5d1171246de92226d11fc1710a1453c9399fe054400f00feeb7f29916019`,
the wrapped helper pin reported by the C8/N4 hosted workflow. Its full result
`overlay-current.json` equals the earlier original receipt byte-for-byte;
the saved receipt SHA-256 is
`88b09ac23e8702159d8c0ff7f9b0d63dd1657dcec50e144611c37a2063124fb7`.
Underlying graph and registry are compared by SHA, not by literal serialized
cross-process byte comparison. This is not a C5/Forced proof. The helper freezes
node records, so in-place mutation behavior is not identical to the original.

To replay, first use the sibling README to create a scratch runtime pair. Then,
from this directory, apply the tested helper to that pair (the input must be
the fresh old-helper pair):

```text
node install_current.mjs NEW_SCRATCH_DIRECTORY
node test_cached_helper.mjs NEW_SCRATCH_DIRECTORY/overlay/research-ide/mathscope-m2/navier/mathscope-large-seal.mjs
node --max-old-space-size=8192 ../pressure-parity/run.mjs NEW_SCRATCH_DIRECTORY/overlay NEW_SCRATCH_DIRECTORY/overlay-current.json
node ../pressure-parity/compare.mjs ../pressure-parity/original.json NEW_SCRATCH_DIRECTORY/overlay-current.json
```

For exact source reconstruction, `current-helper.mjs` is the former branch
`large_pack.mjs` (SHA `fa3930a26256ab7f4e1acf634a2530b3c04369ac07f1dcb407d5dd0c14cdbdc4`)
plus the six-line canonical wrapper used by the preceding overlay generator.
The wrapped file is included to avoid relying on a mutable checkout.
