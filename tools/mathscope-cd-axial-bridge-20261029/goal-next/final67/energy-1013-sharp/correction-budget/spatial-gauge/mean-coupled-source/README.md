# Original initialized mean: coupled threshold absorption

The complete initialized mean contribution, including the outer axial cutoff commutator and all first spatial derivatives, now satisfies its reserved budget **conditionally on the existing actual source norm/chart and radial-characteristic premises**. This is a substantive source-coupled estimate. It uses the original coarse numerical arithmetic at 96 bits; increasing arithmetic precision did not obtain this result.

VERIFIED: the entire original 4,456,994-node source SHA, the actual common threshold, stability factor P, radial-fast factor F, nine original mean roots, 3,918 Laurent-degree records, exact rational loss/geometry constants, and directed residual/geometry/budget endpoint comparisons. The source audit explicitly retains #24=2 and #127=log_positive(#24).

CONDITIONAL: transfer of the saved positive norm producer to actual mean fields and spatial derivatives on the whole required reference chart; flat joins and fixed labels; the uniform radial-characteristic potential envelope. These premises remain listed in the numerical receipt and the pinned prior source-curl receipt.

OPEN: slow background, initial primary wave, all later active corrections, N7-06/N8-05, and final 67 jets. RELEASE HOLD remains unchanged. No original source, existing repository file, numerical base-67 value, branch, or website was changed by this packet.

## The estimate

Write E=Bnorm^256 and L=h(ellMinimum+13)log(2). Original source #617432 is a ceiling over a maximum containing Bnorm^512=E^2 and (64/h)^2. Consequently 64E<=h ellMinimum. The same saved source has r0=2^-34 and Lmax=2r0(4+sqrt(2))<2^-30. Therefore

    P=exp(3E Lmax) <= exp(L/2^33).
    F=exp(h(ellMinimum+17)log(2)/100000) <= exp(1+L/100000).

The second identity uses source #127, rather than an independently chosen logarithm. The original nine roots are beta #7590/#7619/#7591, v #7602/#7627/#7603, gamma #7594/#7635/#7595 in the old mean-positive namespace. Factoring P and F gives upper degrees at most (187,6). The coefficient at P=F=1 is evaluated with the existing directed numerical engine; P and F are restored and jointly absorbed in the mathematical bound. They are never replaced by one in the actual field.

The actual mean valuation retains epsilon^(1-kappa_s) for values and epsilon^(1-2kappa_s) for first derivatives. Beta has an additional favorable epsilon factor; the common bound safely ignores it. Reference epsilon<=(4tau0)^h=exp(-L). The source coefficient factor 4 and physical dyadic factors are covered by 64. The executed directed check is

    log(64 max coefficient_upper)+6 < L_lower/16.

The exact residual margin is

    99998/100000 - 187/2^33 - 6/100000 - 1/16 - 1/2
      =11741903131977/26843545600000 >0.

Thus every required normalized mean value and first spatial derivative is at most b=exp(-L/2). The same coefficient reserve covers the source potential value envelope.

The pinned original Temporal covariant curl and auxiliary-independent FiveMap identities give, with Psi=Q^-h psi and radial cutoff derivative zero,

    beta=-Psi_z, gamma=Psi_r+Psi/r,
    ur=C beta-C_z Psi, utheta=C v, uz=C gamma,
    ur,r=C beta_r-C_z gamma+C_z Psi/r,
    ur,z=C beta_z+2C_z beta-C_zz Psi.

The internal shifted Temporal kernel cancels the apparent external aL term, as already source-verified. There is no new missing-aL obligation. With |C_z|<=20/z0, |C_zz|<=692/z0^2 and the whole-characteristic bound |psi|<=R sup|gamma|/2, the normalized complete mean has coefficient bounds

    values:       (21 Renv, 1, 1)b
    r derivatives:(31, 1, 1)b
    z derivatives:(733 Renv, 21, 21)b
    connections:  (12 Renv, 2 Renv)b.

The Cartesian gradient includes the two angular connection squares. Using Renv>=1, tau0^h<=1 and the separately checked Xb<=Renv^2,

    J_mean^2/tau0 <= 34528224 Renv^4 exp(-L)
                  <= 2^26 Renv^4 exp(-L)
                  <= exp(-3L/4) <1
                  < 2^-32 S_R/tau0.

The geometric logarithm and the final reserved-budget lower bound are independently checked directed endpoints. The result is a sufficient upper enclosure for the initialized mean.

The initial wave has zero azimuthal mean after the original outer
cutoff, and the slow and mean terms are axisymmetric in the cylindrical
frame. Orthogonality holds for both the velocity and its physical
gradient on complete circles. If the two remaining initialized
contributions each attain a fraction at most `2^-28` of the common
`S_R` budget, the derived sufficient initialized fraction is
`41*2^-32 < 2^-26`. The exact calculation is in
`initial-energy-budget.json`. The slower background and wave fraction
bounds remain open.

## Replay

All scripts are portable and accept explicit input locations. GOAL_NEXT is the existing pinned repository goal-next directory. ORIGINAL_RUNTIME is the existing pinned numerical runtime. HISTORICAL_INPUT is the original historical-scale-arithmetic-input.json. SOURCE is the original-source-nodes.jsonl.gz with uncompressed SHA ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf. FAMILY is the original actual-common-admissible-family.mjs pinned by the source audit. Use a new empty output directory OUT; do not disable Python assertions.

```text
python audit_common_threshold.py SOURCE FAMILY GOAL_NEXT OUT/common-threshold-source.json
python build_laurent_ledger.py GOAL_NEXT OUT/laurent-ledger.json
python verify_coupled_algebra.py GOAL_NEXT OUT/laurent-ledger.json OUT/coupled-algebra.json
node evaluate_coupled_mean.mjs GOAL_NEXT ORIGINAL_RUNTIME HISTORICAL_INPUT OUT/laurent-ledger.json OUT/coupled-mean-final.json
node verify_coupled_receipt.mjs GOAL_NEXT ORIGINAL_RUNTIME HISTORICAL_INPUT OUT/coupled-mean-final.json OUT/coupled-readback.json
python check_initial_energy_budget_split.py OUT/coupled-mean-final.json GOAL_NEXT/final67/initial-fourier/localized-initialized-modes.json OUT/initial-energy-budget.json
```

The evaluator reuses the exported, SHA-pinned prepareMeanBulkEnergy helper. It does not copy or slice a numerical evaluator. The three Python programs abort when optimization would strip assertions and write canonical UTF-8/LF bytes. Two complete runs were byte-identical; reopened endpoint checks all passed. The independent forward ledger verifier is separate from the recursive ledger builder. Its exact negative control shows that dropping the frequency threshold invalidates 64E<=h ell.

[GitHub compilation of the four mean-scale Lean theorems](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44543956526)

The continuation archive records exact SHA-256 pins for these scripts and receipts.
