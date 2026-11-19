# Complete localized original slow energy

The complete initialized slow background, with the outer axial cutoff and all first spatial derivatives, fits its allocated **2^-28 S_R** energy budget conditionally on the existing original source slow envelopes and chart transfer. The initialized primary wave and later corrections remain separate. N7-06/N8-05, final jets and RELEASE HOLD are unchanged.

This uses the exact same slow-field upper envelopes as the existing 67-atom replay. Instead of first evaluating extremely large physical tau0 powers and later multiplying their reciprocals, the exact localization polynomial collects every common physical power before numerical evaluation. No numerical precision was increased.

For A=1/2+h, normalize the velocity by tau0^A and its spatial gradient by tau0^(A+1/2). Each source slow atom supplies its original coefficient and explicit affine tau0 reciprocal power. Coordinates x,y cost Rstar sqrt(tau0). On this annular plateau C_r=0, |C|<=1, |C_z|<=20 tau0^(-1/2+h), and |C_zz|<=692 tau0^(-1+2h).

There are 360 surviving positive contributions and 58 zero polynomial terms. Two independent exact collectors, using Fraction and SymPy respectively, verify that every remaining tau0 power is one of

    0, h, 2h, 3h, 4h, 5h.

For 0<h<1/64 and 0<tau0<1, each such factor is at most one. Dropping these small factors gives an upper bound. The coefficient envelope is then evaluated with the original coarse 96-bit directed numerical engine and the previously saved original L_U, L_F, K and higher mixed-norm factors. The original exact localization polynomial supplies all three velocity and nine Cartesian gradient entries; the energy measure is the same 32Xb used by the initialized annular replay.

The executed endpoint comparison is strict:

    J_slow^2/tau0 < 2^-28 S_R/tau0.

The coordinate enclosure 2sqrt(Xb)<Rstar is also checked by directed endpoints. A reopened receipt verifies the strict energy comparison. A source-bound negative control omitting the velocity normalization leaves exponent -1/2-h and fails the nonnegative-exponent test.

VERIFIED: exact source SHA pins, all original polynomial contributions, the physical power identities and residual nonnegative powers, retained original norm factors, and the directed comparison. CONDITIONAL: the previously established original source slow norm/atom envelopes, original enlarged chart and inverse-coordinate operator transfer, fixed labels, original selector supports, and flat cutoff conditions. This does not evaluate actual integrals and does not complete full annular jets.

All four scripts take explicit paths and are portable. GOAL_NEXT, ORIGINAL_RUNTIME and HISTORICAL_INPUT have the same roles as the adjoining mean-coupled packet. Use a new empty OUT directory. Python requires SymPy for the independent verifier. Assertions must remain enabled; Python programs reject optimized execution. All outputs use UTF-8/LF.

```text
python build_slow_energy_ledger.py GOAL_NEXT OUT/slow-energy-ledger.json
python verify_slow_energy_ledger.py GOAL_NEXT OUT/slow-energy-ledger.json OUT/slow-energy-algebra.json
node evaluate_slow_energy.mjs GOAL_NEXT ORIGINAL_RUNTIME HISTORICAL_INPUT OUT/slow-energy-ledger.json OUT/slow-energy-final.json
node verify_slow_energy_receipt.mjs GOAL_NEXT ORIGINAL_RUNTIME HISTORICAL_INPUT OUT/slow-energy-final.json OUT/slow-energy-readback.json
```

The evaluator reuses the same SHA-pinned exported numerical helper without copying or slicing its implementation. Two complete runs reproduce all four receipts byte-for-byte. The ten files in this final directory form the deliverable; MANIFEST.json pins the other nine. Preliminary tests outside this directory are excluded. No existing repository or numerical base-67 file was modified.
