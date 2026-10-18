# Native recovery package

This is new recovery code. It does not claim to restore lost implementation
bytes or to complete the final global numerical evaluator. N7-06 and N8-05
remain open; zero original M3 acceptance rows are newly closed here.

Use Python 3.10 or later with the standard library. Preserve the package paths
under `recovered/base/` and `work/prune_recovery/`. From the package root run:

```bash
python work/prune_recovery/native/code/native_binding.py
python work/prune_recovery/native/code/proof_application.py --source work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz
python work/prune_recovery/native/code/recover_indexed_operands.py --source work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz
python work/prune_recovery/native/code/verify_native.py
```

The `--source` argument may point to another local copy of the same gzip. Its
exact SHA-256 must be
`42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3`.
The scripts authenticate the full compressed bytes before a limited sequential
scan. They do not use SQLite, network access, source constructors, or restored
private seals. Commands regenerate the evidence files. The raw initialized
closure and original header also have mandatory exact byte pins.

The package contains:

- 589 semantic source bindings and 811 nonzero expression derivative requests.
- Exact uniform source-domain rational enclosures for 13 quadratic components,
  and conditional source brackets for two slow inverse calls.
- 34 finite indexed recipes retaining 5,184 rows and 6,804 symbolic terms.
- 429 additional direct indexed operand records. These do not complete their
  transitive dependency closure or numerical evaluation.
- Natural norm and tail formulas, and an attachment of the existing Picard and
  primary indexed source proofs with their actual scope preserved.
- 104 targeted exact-source and fail-closed checks.

`NATIVE_RECOVERY_PROOF.md` states the mathematical applications and limits.
`EXISTING_PROOF_APPLICATION.json` lists the remaining numerical work.
`MANIFEST.json` pins the files in this directory; independent reviews are
stored by the reviewing agent outside this directory.
