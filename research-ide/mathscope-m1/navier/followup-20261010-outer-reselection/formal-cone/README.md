# Explicit threshold in the original Lean cone predicates

ConeThreshold.lean uses the original NavierStokes.SeedConePaper and
NavierStokes.ConeAlgebra definitions. Its seven statements cover:

1. The explicit threshold \(p_{s,1}\ge9\) for the normalized constant box.
2. The corresponding original RelaxedCone predicate with radial shear 2.
3. The original AdmissibleCone predicate when the additional strict shear
   hypothesis is supplied.
4. Failure of that strict admissible predicate when the axial shear is zero.
5. The explicit common threshold \(p_{s,1}\ge2^{24}\) for the normalized
   outer constant box \(1/3\le c\le2259\), \(0\le v\le116\), \(G\ge1/4\).
6. The corresponding original RelaxedCone predicate for general positive
   radial shear \(a\).
7. The original AdmissibleCone predicate with the separate strict shear
   hypothesis for this common outer threshold.

All analytic field bounds are explicit hypotheses. This is a conditional
consumer for those bounds, not a Lean proof of the smooth-step supremum,
the A.21 pressure integral, the exact infinite axis, or a completed final
profile. It does not close an original N3 gate.

An actual command receipt and kernel log must accompany this file before
its proof-checking status may be reported as successful. The pinned source
commit is f9e8bc5b38b6e212696e8a30e3e91517af887bbd, using the original
Lean 4.34.0-rc2 kernel. No original source file is edited.

## Actual check

The first preserved attempt, `attempts/0001`, completed with actual exit
code **0**. All seven `#print axioms` outputs contain only `propext`,
`Classical.choice`, and `Quot.sound`. The before/after source inventories
and original rc2 kernel hash match. `latest-result.json` binds the actual
receipt, and `attempts/0001/lean.log` contains the complete compiler output.

The command used the previously audited explicit installation-path entry
with the original kernel. This is separate from the original protected
Comparator and from a stock launcher's path-autodiscovery behavior.

To reproduce in the same installed original environment, run
`python3 -B run_check.py`. It creates a new numbered attempt and retains
each earlier source, log, exit code and result. The source archive does not
include the multi-gigabyte upstream runtime; install the pinned environment
first as described in the English reproduction guide.
