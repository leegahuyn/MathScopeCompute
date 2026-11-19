# C84 original post-Forced covariance at the Haar E source

## VERIFIED

The active N3 hosted artifact for run 44582875351 contains 22,155,584 source records. Its node-stream SHA-256 is `faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96`. The verifier authenticates this stream, the input receipts, the original constructor sources and the exact cache reader.

Across ten original fixed own-level labels, the verifier compares sixty guarded post-Forced covariance leaves with the angular pairing of the actual guarded velocity. The basis is the literal first and second angular harmonic. The original angular slope is the nonzero integer ω. Real and imaginary coefficient signs and the mean normalization are included. The covariance and velocity row maps agree on all 162 original signed rows. The assembled covariance uses the original cross-label disjoint-support premise on the branch interiors. Analytic boundary and seam obligations stay open.

At the common bound radius #17743710, the verifier reads every direct velocity-covariance term in Eθ #21999622 and Ez #22000445 and both steps of the unit-square normalized Haar integrals, with respective roots #21999624 and #22000447. On the admissible periodic extension the two fast divergence terms are torus derivatives with Haar-independent coefficients. Their Haar means vanish. The remaining direct arms are

- Eθ: ⟨∂R Wᵣθ + 2Wᵣθ/R + ε∂Z Wθz⟩.
- Ez: ⟨∂R Wᵣz + Wᵣz/R + ε∂Z Wzz⟩.

The separate axial pressure term is source #22000444 = ε·#22000443.

## CONDITIONAL

Let a₁ be the original first-mode Primary velocity and f₁, f₂ the first Forced increments. The increment covariance in any fixed own-chart is
`ΔWᵢⱼ = 2 Re(a₁ᵢ conj(f₁ⱼ) + f₁ᵢ conj(a₁ⱼ) + f₁ᵢ conj(f₁ⱼ) + f₂ᵢ conj(f₂ⱼ))`.
The fast first derivatives have already integrated out in these direct arms. At order zero in E the needed coefficient roles are C0 and R at all three components, and Z at θ,z, for a₁,f₁,f₂ in every one of the ten fixed charts. This makes 240 labelled complex roles. The quantitative hypothesis is a uniform bound Pcap·√ζ·δ_*^(−pP) for the listed Primary leaves, and Fcap·ζ·δ_*^(−pF) for the listed Forced leaves, over their original fixed-label and common bound-radius domains.

Use the original shell Gaussian `ζ = exp(−t₁²/dₐ²−4/dᵦ²)`, `δ_* = min(1,dₐ,dᵦ)` in the interior and the original zero extension outside. For integer p ≥ 0 the positive exponential series gives `√ζ·δ_*^(−p) ≤ G_p = 2^ceil(p/2) ceil(p/2)! t₁^(−p)` when 0 < t₁ ≤ 1. With `M = Pcap·Fcap·G_(pP+pF) + Fcap²·G_(2pF)`, the source row counts and dilation scales imply

- |ΔWᵢⱼ| ≤ 5184 Mζ.
- |∂R ΔWᵢⱼ|, |∂Z ΔWᵢⱼ| ≤ 20736 Mζ on the required source arms.
- |ΔMθ,direct| ≤ [20736(1+ε) + 10368/R]Mζ.
- |ΔMz,direct| ≤ [20736(1+ε) + 5184/R]Mζ.

The script checks source structure and exact integer coefficients. The displayed Gaussian inequality and the conversion of the coefficient hypotheses to the product bounds are analytical.

## OPEN

Uniform values for the actual first Forced coefficient caps, the remaining original initial covariance and mean arms, full axial pressure feedback, radial orders R and R² of the complete Haar E source and the Signed seams. The packet does not close N7-06 or N8-05. Final jets remain 0/67 and release remains HOLD.

## Replay

Run Python 3 with the existing MathScope workspace, repo worktree, authenticated hosted artifact, and original pinned intermediate receipts in place. Point the result at a new path. The script compares precise SHA-256 values before interpreting the source. The adjacent JSON is the expected result and the log records replay.

```powershell
python -B verify_covariance_shell.py --goal GOAL_NEXT --artifact HOSTED_ARTIFACT --cache LOCAL_CACHE --runtime ORIGINAL_RUNTIME --out covariance-shell-replay.json
Get-FileHash -Algorithm SHA256 covariance-shell.json,covariance-shell-replay.json
```

`ORIGINAL_RUNTIME` supplies the three digest-pinned original JavaScript modules below `research-ide/mathscope-m3/navier`. The preserved same-run environment provides them in `continuation66/stage2/runtime-exact`.
