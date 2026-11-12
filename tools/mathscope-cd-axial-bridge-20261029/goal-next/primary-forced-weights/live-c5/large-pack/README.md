# Bounded storage for the original C8 replay

The original graph uses append-only JSON records with fixed IDs. These overlays
store a verified graph prefix as a frozen record array and check each record
against the issued prefix. The original raw JSON comparison uses the original
key order. The canonical comparison uses the original key-sorted JSON encoding.
The snapshot stores packed metadata separately. Certificate hashing streams the
same original canonical bytes, including the exact graph and function metadata.
The equality check uses the records themselves. Recursively freezing original
records also makes direct mutation of those records throw. In the replay,
replacing entries in the live or public prefix remains detectable.

The lower-order comparison in `native-chain-original.json` and
`native-chain-bounded.json` covers background C3, source band, fixed
representative, current field, weighted target C2 and Primary order zero.
All six stages have identical node counts, raw node hashes, native function
registry hashes, roots and check rows. Each side rejects changing either a live
node or a packed-program node. This comparison used the storage patches through
commit `f7f4b07409ad3ab6a25c6cd675d9db9bbbb90498`. Replay with
`test_native_chain.mjs original ORIGINAL_RUNTIME OUT` and
`test_native_chain.mjs bounded PATCHED_RUNTIME OUT`.

Run 43273827905 issued the actual C8 background at 14,220,509 nodes before
the original positive primitive comparison reached its 300,000-visit limit.
Run 43276022455 called the original private background assertion with the
issued object. It recorded all 12 positive checks and the source-only
`GaussianB_6` root. The exact primitive comparator used a raised default
visit budget of 1,200,000 and all eight original positive primitives completed.
The subsequent pressure/stress construction reached the original coefficient
norm at 14,535,728 nodes and exceeded the JavaScript string limit.

Run `43277740099` applied the same exact prefix method to the
coefficient norm's raw graph and the first-order weighted stress program.
`pressure-storage-preflight.json` confirms the two original source hashes,
the intermediate induction-norm import hash and exact byte reversal. Original
roots, coefficient recurrences and acceptance checks are retained. The
low-order replay after this change produced the identical bounded receipt.
This run passed the coefficient norm stage and stopped at a separate raw
string conversion in the normalized cutoff issuer. The isolated
`43279539851` retry applies the exact raw prefix comparison to the two
normalized cutoff issuers. `cutoffs-storage-preflight.json` records the
original hash and exact reversal.
The issued C8 object contains symbolic bounds. Directed numerical enclosures,
the common family, weighted target C6 and Primary C5 each require separate
verification.
