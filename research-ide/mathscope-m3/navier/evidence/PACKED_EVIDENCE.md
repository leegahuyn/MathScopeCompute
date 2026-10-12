# Large observed artifacts

The following gzip files contain the exact JSON artifacts from their original
passing executions:

| Artifact | Original bytes |
|---|---:|
| `global-signed-20261012/attempt1/global-signed.json.gz` | 29,064,143 |
| `global-moment-pressure-20261012/attempt1/global-moment-pressure.json.gz` | 15,938,453 |

Gzip changes only the storage encoding. Each original `receipt.json`, raw
artifact SHA-256, source capture, log, and scope claim is preserved.

The GitHub connector has a 16 MiB request-body limit. The lossless gzip file is
small enough to transfer with the other repository files. The complete mapping
and both checksums are in `packed-evidence.json`.

From the repository root, verify the compressed bytes, decompress in memory,
and check the exact original artifact against its unmodified execution receipt:

```bash
python -B research-ide/mathscope-m3/navier/tests/verify-packed-evidence.py
```

To also restore the original JSON path for direct inspection or another tool:

```bash
python -B research-ide/mathscope-m3/navier/tests/verify-packed-evidence.py --materialize
```

The verifier refuses to overwrite an existing file with different bytes. The
restored JSON is ignored by Git because the lossless packed artifact is tracked.
This storage check is not a new mathematical execution or acceptance criterion.

## Original auxiliary temporal inverse

The actual attempt3 temporal graph is stored as `global-temporal-20261012/attempt3/global-temporal.json.gz`. It reconstructs the exact original 24527857 bytes with SHA-256 `8ef4e695623643d6ed344ce092270b0ac392be1aa2e49bcc1990ebd5da39df58`. The observed receipt is unchanged. The manifest and verifier check both the compressed bytes and the reconstructed bytes; no scalar nodes, Fourier rows, derivative programs or tail bounds are omitted.
