# Reproduce the original default-build artifact audit

Run `python verify-default-build.py` from any working directory. The script reads inputs relative to its own file and changes none of them. An optional `--output path/to/new-report.json` saves a new report using exclusive creation; it refuses to overwrite an existing file.

The default audit was rerun from `/tmp`, outside the evidence directory. It reproduced all **43/43 original checks**, preserved the original GitHub/controller failure, and confirmed actual exit 0 for both original cache-get and default-build commands. See `default-build-reverification.json`.

`original-default-build-artifact.base64` is explicitly a base64 encoding of the original 282640-byte GitHub artifact ZIP. It is retained so a source release that excludes ZIP archives can still carry the exact original artifact bytes. The verifier strictly decodes this representation, checks the GitHub SHA-256, validates ZIP CRCs, and compares all 21 decoded archive members byte-for-byte with `default-build-artifact/`. If the original `.zip` is also present, its bytes must match the decoded copy; it is optional for reproduction.

The first of the original 43 checks now performs this complete archive/member check. The remaining checks and names match the frozen `default-build-independent-audit.json` exactly. The full artifact's recorded result remains `FAILED`, exit 1; the separate successful original commands remain exit 0. There is no rerun of Lean, GitHub, Comparator, or nanoda in this read-only integrity verifier.

For a complete portable snapshot, copy the files enumerated in `default-build-snapshot-manifest.json` while preserving their relative paths. That manifest intentionally omits the duplicate ZIP and live Comparator observation files.
