# Actual N3 mode-two damping and fixed-pulse transport

The source graph and registry are the original selected-input witness from
GitHub run 43363985266. The same-run private-family receipt binds its two
actual mode-two source systems `ActualOriginalForced_0:1_m2` (system 1) and
`ActualOriginalForced_1:1_m2` (system 5), with the same projected inputs and
H_w paths. These are palette differences 0 and 1, original sign +1. This is
not a complete Forced seal or a proof about every label/sign.

Python streams and hashes all 21,681,493 original AST nodes, extracting a
small reusable window. Exact rational/symbolic replay checks the 18 actual
undamped matrix entries against their source normal and K operands, their
three common scalar diagonal factors, and the literal affine normal and its
derivative. Both actual systems satisfy

```
M(w) = Aphi(w) - 4*d(w)*I,    d(w)=epsilon*k^2*|n(w)|^2 >= 0.
n(w) = n(0) + w*nprime.
```

The source's exact zero-data solution is the complete ordered-integral
limit, not its finite display. Its scalar attenuation factors out even
when Aphi at different times does not commute. The normal affine identity
also gives the exact cubic integral of `|n(w)|^2` between pulse times.

For a fixed admitted parameter tuple, suppose `F` bounds all source
derivatives through order four, `A` bounds the matrix row norm of Aphi,
and `B` bounds the row norms of all nonzero parameter derivatives of M
through order four on `0<=w<=Ls`. Differentiating the actual zero-data
equation gives a triangular system: each off-diagonal term reduces total
derivative order, so at most four occur. The conditional fixed-pulse bound is

```
max_|alpha|<=4 ||D^alpha u(t)||_infinity
 <= F*t*exp(A*t) * sum_{j=0}^4 (15*B*t)^j/(j+1)!.
```

The common damping is retained, not replaced by a positive exponential;
the finite polynomial keeps all derivatives of the damping and the ordered
noncommuting matrix products. The five source parameter directions are
`(R,Z,T,Y1,Y2)` and time `t` is fixed during those derivatives. At the
original annulus and source nonzero integer carrier, the actual AST also
gives `4*d(w)>=mu=4*epsilon/Renv^2>0`. This permits replacing `exp(A*t)` by
`exp(max(A-mu,0)*t)`. An actual strict inequality `A<mu` has not been proved;
the displayed proof does not assert contraction.

The results assume original source smoothness, admitted fixed-label domain,
positive/nonzero source normal, and valid same-run selected-source provenance.
Actual directed F, A and B, endpoint chain derivatives, full mapped curl,
pressure, Forced output/class, all higher stages and final jets remain OPEN.
No Lean theorem is claimed and RELEASE HOLD remains in effect.

Reproduce from the workspace root (Python 3 and SymPy required):

```
python work/goal-next/continuation44/forced/extract_actual_pulse_matrix.py
python work/goal-next/continuation44/forced/certify_actual_damping.py
python work/goal-next/continuation44/forced/certify_damping_floor.py
python work/goal-next/continuation44/forced/hash_pulse_evidence.py
```

The first command streams the original compressed graph and verifies its
uncompressed SHA-256; `two-pulse-source-windows.json` avoids retaining the
full billion-byte stream in memory. `pulse-byte-hashes.json` records inputs,
scripts, and receipts. The exact source checks and analytic inequalities are
distinct from any numerical evaluation of F, A or B.
