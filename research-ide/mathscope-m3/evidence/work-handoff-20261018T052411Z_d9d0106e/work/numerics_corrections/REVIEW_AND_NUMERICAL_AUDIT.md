# Review evidence and numerical corrections

Accepted completion count remains **56/64**. This audit creates no new original-item completions. Original files were read only. The new independent numerical verifier and a separately corrected copy of the eight-item verifier were executed.

## Recovered review originals

All three files match both byte size and SHA-256 in the uploaded `FILE_INDEX.json`; each ZIP was checked for absolute/traversal paths and symlinks before extraction.

| Original | Bytes | SHA-256 |
|---|---:|---|
| N601_57of64 review package | 667746 | `fabb01f454915c08cb478e4d00db79e452fbfe23c9c06ec2db31c4c1de371b72` |
| Seven source result 170104 | 144043 | `7475c5970fe998c3eef1e2f2028d9dbd3d185a2e4a89e09f069da81624141187` |
| Seven source result 170144 | 144038 | `8e50f3a4956ca9bcca36c90af50501be17067cc6c066a30956cf91b3b33a1d68` |

The review package's 42-entry internal manifest matches every entry. The two Seven result archives have identical four module JSON outputs, identical original ledger, and identical mathematical report. Differences occur in logs/receipts and the top-level result timestamp. They are two executions of the same logic, not independent mathematical algorithms.

## Why the review's 57/64 claim is not accepted

`02_modified_code_and_diffs/wave_source_connection.py`, `gf_decomposition_check`, checks two file hashes, schemas, literal statement strings, and `conditional_wave_connection_complete == True`. It does not construct or verify the actual G/F decomposition bodies. `all_order_theorem_check` checks `len(induction)>=4` and two hashes, then emits hard-coded domain, divergence-free, moment and discharged-hypothesis statements. Those returned statements drive the N6-01 CLOSED result.

The consumed artifacts contradict an unconditional interpretation:

- `CURRENT_WAVE_APPLICATION.json`: `unconditional_global_wave_certificate=false`; four premises remain, including same-source all-fixed-order continuation, primary amplitude/pressure/tangency, full curl divergence/support, and whole reference mean pullback.
- `WAVE_SOURCE_REFERENCE.json`: scope explicitly says integrity pins/inspected source facts only, no mathematical completion authority.
- `normFamily.json`: continuation quantifier concerns the same original initialized mean. Its scope keeps `completeInitialResidualClassCertified=false`, `allFiniteCorrectionStagesClassCertified=false`, and `actualFiniteScalarNormCompositionExecuted=false`. General finite-order existence is useful evidence; it does not automatically discharge every target-source hypothesis.

The 66-test receipt and hash checks establish test execution and byte identity; they do not substitute for those missing mathematical links. The saved run manifest binds the review's `wave_source_connection.py` and orchestrator, but does **not** bind its current launcher, PowerShell launcher, stage-tail module, or stage-tail tests: their bytes differ. The package acknowledges some post-run changes, so the saved run cannot be attributed to every currently included code file. Also the theorem-analysis narrative lists `normFamily.json` hash `d852...`, whereas the included bytes and manifest have `d98a245f1fc563ba44c48d21c59a43d6787fc3895d922472bb3f3ab6e04d9a6d`.

## Gaussian correction: exact model arithmetic, not physical tail constants

`numerics_corrections.py` computes rational lower/upper bounds for logarithms using the atanh series and its explicit positive remainder. There is no imported-code execution and no finite-grid extrapolation. Parameters are precisely the v5 model parameters `c=1/20, M=N=4, P=3`.

| Quantity | Correct value (rounded for display) | Earlier report |
|---|---:|---|
| stationary point | 56.51346826473484 | 56.5135 is a valid rounding |
| E'(40) | +1.695177444479562 | 40 was incorrectly called supercritical |
| E(172) | -494.5445126886345 | -494.68 |
| E(173) | -506.2145525380490 | -506.37 |
| E(180) | -590.7103188883375 | -596.08 |
| coarse log C_N | 657.1350639505859 | 657.3396 in pasted report |

The least integer ell>=1 with E(ell)<=-500 is **173**. This follows from rigorous E(172)>-500, E(173)<-500, E'(173)<0, and E''(ell)=-2c-2P/ell²<0. The valid displayed supercritical sequence starts at 60. A real threshold is not asserted equal to 173.

The universal bound follows by completing the square and maximizing the polynomial factor. Its tighter log C_N bound is 324.6249928582348; the original coarse bound replaces (ln2)² with 1 and remains valid. Finite sampling of ell=1..300 is not a proof for all ell. Negative-log representation is retained; a tiny positive exp(E) is never represented as an exact zero.

The review's different example `C=1,c=1/25,M=2,P=3,N=4` has coarse log C_N=467.8044946045285 and tighter log C_N=234.0083508677192, so that particular difference is a legitimate coarse-versus-tighter estimate. Neither example supplies the actual derivative constants C,M,P or evaluates `c=node617317*node300173/25`. The actual physical last resolved tau stays **null**.

## N6-07: separate three comparisons

The new verifier reads `stage_tail_connection.json` and `STAGE_CYCLE_AND_TAIL_SCHEDULE.json` and recomputes every exact affine comparison. The 126 saved discrepancies mean **63 stage/order pairs** `(j=0..8,m=0..6)` with two differing quantities each, not v5's fabricated `6*21` pairs.

| Quantity | Saved producer minus saved Acceptance |
|---|---|
| ell_m | 0 |
| K_m | 2+3h |
| ell'_m | m+1 (1 at m=0) |

Paper p114 gives the sufficient common choice `ell_m=2A+(m+1)(1+3h/2)`, identical to the recorded producer and Acceptance ell. Paper (9.18) gives existence of K_m, not an explicit K_m formula. Lemma5.4 gives existence of ell'_m depending on m and ell_(m+1), not an explicit difference or m=0 branch. A different sufficient bound could be valid with a same-source derivation; disagreement alone is not disproof.

The v5 code invents an additional `s_x=(1+h)/2` and `2A+s_x` to define comparison losses, then reports the unrelated expression `1/2-3h/2`. It does not consume the 126 saved discrepancy records. Neither expression is a certified paper-versus-code difference. The new audit removes that claim and the asserted numeric J-shift derived from it. Stage independence of a conditional loss formula does not construct actual C_(j,m), P_(j,m), or all finite-stage Z_j.

## Whole-K and tau scope

The review's terminal module records exterior heat transport at positive radius, z=0, X>=Xheat, finite orders j=0..4. It explicitly has `whole_K_Fj_constructed=false`. Its extension checks consume fixture norms and retain `actual_global_Fj_norms_supplied=false`. N7-04/N7-05 remain blocked on final N6 identity, actual stage flatness and whole-K F_j norm generation.

The v5 N7 function does not improve this: it takes a maximum of a toy radial expression over seven radii and names it `f_j_norms_on_K`; a finite sampled maximum is not a C^a(K) upper bound. Its origin value is assigned zero and checked, not proved flat. The piecewise cubic cutoff is C1 but is not C-infinity at the joins. The b_j values are floating point, the loops omit spatial derivative index a, and only one derivative cross term is modeled. These must be labeled toy samples and may not supply Lemma10.3's actual whole-K norms.

The review energy module records an initial zero interval, 17 inner-core point evaluations/78 exact interval comparisons, and a pre-temporal auxiliary Fourier tail. It expressly reports no whole-K integrals, no final source attachment, no new Fourier sums, no physical tau. The 1/K rows at K=1,2,4,8 rescale one tail inequality and are not four Fourier computations.

The v5 N8 error budget uses hard-coded coefficients 0.02, 0.01, 0.05 in toy formulas. Its varying bit-count term is not a directed-arithmetic precision run. Spatial/Fourier/order sweeps and any returned tau are model diagnostics only. Actual radial/axial/active-time resolution, actual final Fourier and coefficient tails, whole-K energy/work/dissipation, and source-derived physical error budget remain open.

## Execution and integration

Executed the new CLI successfully against v5 inputs: exact Gaussian threshold 173; 126 recorded loss discrepancies rechecked; new M3 completions 0. Nine targeted tests pass, including tampered/duplicate-record rejection, m=0, independently evaluated decimal logarithms, incorrect old Gaussian statements, and scope preservation. Two negative scope regressions demonstrate that successful toy b_j checks cannot provide whole-K norms and a successful model tau cannot become an actual tau. Logs are `targeted_tests.stdout.log` and `targeted_tests.stderr.log`.

To integrate, copy `numerics_corrections.py` beside the corrected verifier and use `verify_gaussian_model()` and `verify_recorded_losses(inputs_dir)` for their respective sections. Keep Gaussian output under a model/test namespace, and preserve `actual_source_c_evaluated=false`, `actual_stage_fields_constructed=false`, and `last_resolved_physical_tau=null`. The old v5 numerical functions and their existing evidence are historical inputs, not the new authoritative calculation.

The corrected `verify_all_eight_items.py` and its unified diff are included. N7 legacy actual-norm fields now return null, all-order flatness/cross-term/extension closure flags are false, and positive sample diagnostics have explicit model names. N8 legacy last_resolved_tau is null and model_last_resolved_tau preserves the toy 1e-4 result. The original time derivative is intentionally unchanged in this copy for the separate derivative patch to merge cleanly. Do not present this copy as the final combined derivative repair before that merge.
