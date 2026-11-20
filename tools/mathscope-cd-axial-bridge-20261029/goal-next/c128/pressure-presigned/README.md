# Original covariance inputs for the higher late axial pressure

The pinned C127 pressure census reaches \(W^-_{rz,Z^6T}\) before Signed. This packet computes all 18 distinct covariance directions needed by the C125 and C127 censuses. It keeps the original mode-one and mode-two inverse formulas and the original paired harmonic products. The weighted moment recurrence covers 60 native gauge directions, 364 initial mean roles and the three original radial regions.

The highest Primary inputs are \(W_{rz,Z^{12}T}\) and its transverse \(L^2\) derivative. They occur in the compact quadratic moments. The arithmetic recomputes both factor branches, the original ordered variation and the complete curl. The highest required ordinary cutoff order is 12 and the highest compact moment order is 10. These fit the independent C106 cutoff order 13 and compact geometry. The C106 frame covers the largest Primary ordinary order including the extra curl derivative.

The conditional logarithmic coefficient rank is 357940 in \(H/2^{128}\) units. The mode-one rank is 170778. The \(Z^6T\) row retains \(\varepsilon\zeta\), band \(S^{125/2}\) and a collar pole at most 48. The mode-two product has two Gaussian factors and keeps its original separate pole budget before absorption. The bounds use the exact original admitted chart, ordinary cutoff and flat support, positive frame and complete fixed or shifted paths.

The requirement replay and the two wave arithmetic runs produce identical bytes. The requested new Signed target derivatives and native post-Signed covariance require their separate joins.

```text
python -B probe_high_pressure_presigned.py --work WORK --goal GOAL --runtime ORIGINAL_NAVIER --demand C127_PRESSURE_CENSUS --prior C125_SIGMA_CENSUS --out requirements.json
python -B verify_presigned_pressure_high.py --work WORK --goal GOAL --runtime ORIGINAL_NAVIER --prior C125_SIGMA_CENSUS --frontier C127_PRESSURE_CENSUS --requirements requirements.json --schedule fresh-schedule.json --out fresh-covariance.json
```

WORK contains the pinned intermediate source and replay files used by the previous C118 and C125 verifiers. GOAL is the repository's current verification directory. The scratch adapter checks the upstream verifier hash and its named numeric cutoffs before running the expanded demand.
