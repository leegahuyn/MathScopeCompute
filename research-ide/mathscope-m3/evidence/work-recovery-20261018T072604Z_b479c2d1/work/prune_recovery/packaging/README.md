# Portable recovery replay

This runner needs Python 3.12 or later and Node available on `PATH`. It uses only
the supplied local files and standard libraries. Keep the package layout:
`recovered/base`, `work/prune_recovery`, and `work/recovery_git/recovered`.
The package root must contain `FINAL_FILE_INDEX.json` with a `files` array of
`path`, `size_bytes`, and `sha256` records. Disposable SQLite and Python caches
must be excluded from that index.

Run the Python entry point from any directory, supplying a **new** working
directory and a report directory outside the original package:

```bash
python /path/to/package/REPRO_RECOVERY.py --package-root /path/to/package --work-dir /path/to/new-replay --report-dir /path/to/replay-reports
```

The same files may also be invoked from `work/prune_recovery/packaging`. The
PowerShell wrapper is equivalent:

```powershell
& C:\mspkg\reproPS_RECOVERY.ps1 -PackageRoot C:\mspkg -WorkDir C:\msw -ReportDir C:\msreports
```

`-PythonExecutable` optionally selects a Python executable. Otherwise the
wrapper uses `py -3`, then `python`; the Python runner checks the minimum version.
Python children use UTF-8 mode, including retained scripts with Korean text.
Paths containing spaces are supported. The wrapper does not change PowerShell
execution policy.
Short Windows roots, such as `C:\mspkg` and `C:\msw`, leave room for the retained
long source filenames without relying on machine-wide long-path settings.

The runner verifies every indexed file, copies only indexed files into the new
directory, and checks the copied bytes. Existing work directories are rejected
and are never cleared. Each run creates a separate report subdirectory, so a
report directory can be reused.

The replay order is:

1. Check the frozen energy manifest before changing copied evidence.
2. Recover scalar source records; run scalar controls, binder controls/audit,
   historical graph-identity inspection, and independent scalar review.
3. Generate native recipes, recover direct indexed operands, apply the original
   proof records, and run native controls.
4. Regenerate the energy operator, run energy controls, connect actual source
   dependencies, and generate the added initialized pressure recipe.
5. Run independent native mathematics/binding/direct-operand and energy
   algebra/boundary reviews.

Scalar source arguments stay relative to the copied root. This preserves the
exact source-export hash expected by the downstream consumers. The original
source gzip is always read at
`work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz`.

The energy connection expects a disposable database at
`scalar/cache_recheck/independent-recheck.sqlite`. The runner validates the fresh
scalar database at `scalar/evidence/fresh-source-cache.sqlite`, including its
3,892,594 rows and exact node 31, and makes a byte-verified derived copy at the
expected location. It records this reuse and removes that derived copy after
replay. It does not run a second full database producer. The archived historical
cache diagnostic is not presented as a new execution.

Each job has separate stdout, stderr, and exit-code files. `SUMMARY.json`,
`PACKAGE_BEFORE.json`, `PACKAGE_AFTER.json`, `JOB_PLAN.json`, and `EXIT.txt` record
the result and original-package hash verification. A failed job stops dependent
jobs; original-package verification still runs. Successful replay verifies this
recovery work and leaves N7-06 and N8-05 open. It does not run the old long replay,
the historical Windows run, or an original mathematical source producer.

The runner was executed in a fresh Work Linux copy: all 22 jobs exited 0 in 48.074 seconds. All 1,148 indexed inputs remained byte-identical before and after. The Windows PowerShell wrapper was statically reviewed only; no new Windows run is claimed. See portable_verification/recovery-20261018T072029Z-afa7970a for the actual logs and generated-output hash comparison.
