# Bounded current recovery validation

`SCOPED_CI_PROPOSAL.yml` is a proposal stored with recovery work. It is not an
installed workflow and does not claim a hosted CI run. No `.github` file was
modified by its author.

`run_all_scoped.py` requires a new output directory outside the repository.
It writes raw stdout/stderr, step exit codes, actual test counts, source/input
and output hashes, and a partial receipt after each step. It sets
`PYTHONDONTWRITEBYTECODE=1`; native outputs go only to that external directory.
Source bytes, commit and Git state must be unchanged when the run finishes.
CI requires a clean checkout. `--allow-dirty` exists only for explicitly scoped
local preparation; its use and the dirty start are recorded in the receipt.

```bash
python -m pip install -r research-ide/requirements-reference.txt
python -B research-ide/mathscope-m4/recovery-20261019/run_all_scoped.py --output-dir "$RUNNER_TEMP/mathscope-scoped"
```

The five bounded steps are:

| Step | Exact extent |
|---|---|
| Native source capsule | Read and hash existing source header/closure/profile; extract the19 records. Do not regenerate the700/3407 record producers. |
| Native validation |19 declared scalar-function boxes,22 independent endpoint certificates,5 implicit jet identities,16 negative controls; actual global caller coordinates remain unevaluated. |
| Cutoff unittest |9 tests, including the active4096-bit regression. No new support-grid generation or whole-K energy integration. |
| M4 semantic contracts |10 new tests, including exact descendants, ABA and asynchronous construction snapshots; one small installed P1 Worker check. |
| M4 observation contracts |6 new tests, including selection snapshot and raw UTF-8 BOM rejection; small installed reference Taylor-Green/prism/delta Workers. |

Native flags were checked against actual `--help` output:

```bash
python research-ide/mathscope-m3/recovery-20261019/native/prepare_native_source.py --recovery-root research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1 --output /absolute/external/output/native/SOURCE_CAPSULE.json
python research-ide/mathscope-m3/recovery-20261019/native/verify_slow_inverse.py --source-capsule /absolute/external/output/native/SOURCE_CAPSULE.json --output-dir /absolute/external/output/native
```

The driver deliberately does not run old full release replays, mathematical
source producers, a Lean compiler, browser automation, the manifest builder,
Git writes or publication. It retains N7-06/N8-05 OPEN, M4 original acceptance
UNCONFIRMED and actual global last-resolved tau null regardless of green tests.
The cutoff nine tests and M4 sixteen tests are software assertions, and the
native check counts are separately scoped evidence; none is a completion count
for original blueprint criteria.
