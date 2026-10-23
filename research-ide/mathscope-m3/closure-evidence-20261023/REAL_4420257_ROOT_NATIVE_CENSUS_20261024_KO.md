# 실제 4,420,257노드 원본 재생 / 11루트 native 의존성 감사 (2026-10-24 KST)

## 인증된 실행 원천
- [Full original graph capture, Actions #39977528137](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39977528137) completed **success**.
- Artifact #12515234307, compressed 27,641,635 bytes, GitHub artifact SHA256 `396e842f85285bb0935a9b28ff4a11bbae84e7c43f783fbad537481ef0c41bef`.
- Uncompressed JSONL **188,570,816 bytes**. Full node count **4,420,257**, 33 distinct original operator names.
- Independently decompressed/rehashed node stream SHA256 `a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269`; raw source registry SHA256 `d06514935992de25f0bc5dc42f97ead909fc15a8b35c925af10682950269ec35`. Both match the original sealed manifest.
- Original PR30 pinned `a9b3a5b317525f6d0a71e2e356b054c9d25d2e60`, unmodified.
- Physical 11 roots: velocity `4419697,4419698,4419699`, pressure `4419702`, divergence `4419723`, PDE residual `4420035,4420037,4420039`, direct/split defects `4420249,4420251,4420253`.

## Independent topology count — syntactic AST children ONLY
- Checked **9,749,737** direct graph edges with operation-specific node schemas.
- Reverse topological bitset on the eleven roots yields **2,036 distinct directly reachable AST nodes**, each individual root: u0=37, u1=61, u2=91, p=290, div=167, R0=802, R1=513, R2=1019, defect0=947, defect1=656, defect2=1144.
- These counts **do not** recursively expand native functions registered by system IDs in their private definition tables. Thus they are **not** the actual full numerical work needed for final field evaluation.

| Operator | Whole source graph | Root-direct reachable |
|---|---:|---:|
| `m3_coupled_indexed_partial` | 4,368 | 102 |
| `m3_coupled_expression_partial` | 13,857 | 79 |
| `m3_aux_expression_partial` | 28,636 | 58 |
| `m3_aux_inverse_partial` | 6,458 | 13 |
| `m3_coupled_inverse_partial` | 42 | 13 |
| `actual_covariance_volterra` | 1,448 | 0 |
| `m3_forced_pulse_partial` | 1,080 | 0 |
| `m3_global_pulse_jet` | 160 | 0 |

An ODE/Volterra native root-direct count of zero **does not** establish that native defining-body ODE/Volterra dependencies are absent. These are stored behind the source-native facade's defining body.

## Serious definition-capture gap found and corrected
The successful old #39977528137 archive has `m3GlobalPulses` and base expression definitions only. **It omits the separate actual auxiliary, coupled, and forced facade registries**, although its node stream refers to their IDs. Its SHA confirms faithfully captured bytes, **not semantically complete replay**.
- Updated `export_original_source_graph.mjs` to accept `definitionGraph` owning the **identical** `G.nodes` and record all five coupled/forced registry lists.
- Updated `run_real_original_signed162.mjs` to capture `forced.G` (the actual SourceCoupledExpressions facade), rather than only raw `band.G`.
- Replay integrity audit validates extended registry list counts, SHA, same graph identity and fail-closed guards.
- New full authentic capture [#39988632325](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39988632325) was launched with this correction. Its **execution success and new complete artifact are unconfirmed until the run terminates**.
- Small regression CI on corrected exporter: [#39988412079](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39988412079), **success**.

## Next mathematical/numeric work
1. Inspect #39988632325 source registry and compare against its 4.4M node graph; run root-body-aware semantic reachability with exact original system IDs.
2. Expand 102 directly referenced coupled indexed calls, 79 coupled expressions, 58 auxiliary expressions, 26 Fourier inverse calls using actual defined native bodies; identify true unique ODE/Volterra/Fourier dependencies.
3. Authenticate Fourier coefficient input, all source order-m+4 supnorm majorants, Volterra/ODE enclosure kernels and pressure/Cutoff all-order bounds.
4. Generate the actual **final all-cycle** \(A,b,p\), which is **not** represented by the current first-FiveMap snapshot. Only then calculate the original final 67 closed-cell jets.

Release remains **M3 62/64, M4 0/16, final actual 67 = 0/67, RELEASE HOLD**. AST roots are not certificates that the PDE residual vanishes or that the force is \(C_c^\infty\).
