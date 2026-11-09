# Original n=1 axial residual and Picard row: exact source projection

`check_source_row.py` authenticates all 4,420,257 original JSONL nodes and the
function registry, then projects exact original graph nodes into rational
symbolic expressions. It checks Picard system 0 A0 row 5, A1 row 5, forcing,
all eight original raw stress terms making #117045, the original v1 formula
in terms of the actual average, and the Picard pressure row. Every checked
coefficient has exact zero symbolic remainder against an independent formula.
Two negative controls change pressure and viscosity coefficients and yield a
nonzero remainder.

The key *conditional* bridge is

`2*raw_#117045 = -U1_xixi - U1_xi/xi + actual_picard_row5`

after explicit substitutions in `source-row.json`: `X=xi²`, chain rules for
U1, actual and Picard leading profiles and derivatives agree, the two lower
viscosity values agree, `Pi1_X=2*F0*F1-Omega0OverX/2`, and the source average
is `U1+K1`. Assumptions include xi nonzero, L nonzero, and defined operations.
These are hypotheses; the code does not certify them or solve the Picard ODE.

The pressure row check shows its registered source syntax has
`A0[3,0]=4*xi*F0`, forcing `2*xi*(-Omega0OverX/2)`, and other entries zero.
The graph also identifies the inner radial pressure derivative as
`actual_background_even_profile(0,3,X,eta,1,0)` and the relevant average and
eta derivative as integral nodes. Concluding their calculus meaning and
deriving `Pi1_X` requires actual Picard ODE/derivative semantics and regularity.

The aliases listed in the JSON preserve source node IDs, but assignment of the
semantic atom to each derivative is a further source-semantics obligation.
Source node #29440 is `v1_factor`; the manuscript radial coefficient is
`V1=X*v1_factor`. The symbolic implementation calls the atom `V1` internally,
but the source output and formula make the factor explicit. Optimized Python
(`-O`) is rejected because integrity checks rely on assertions.
The result does not prove Picard convergence, actual ODE satisfaction, the
axis limit, native parameter support, total-moment cancellation, or any all-n
claim. It is not a counterexample to the original system.

Reproduce with Python 3 + SymPy:

```
python check_source_row.py --source <original-graph-dir> --out source-row.json
```
